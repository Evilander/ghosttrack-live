import 'maplibre-gl/dist/maplibre-gl.css';
import './styles/main.css';
import './styles/hud.css';
import './styles/detail-panel.css';
import './styles/radar-sweep.css';
import './styles/livecam.css';

import { createMap } from './map.js';
import { fetchAircraft, toAircraftGeoJSON, toVectorGeoJSON, setVipHexes, fetchVipAircraft } from './aircraft.js';
import { initHUD, updateAircraftCount, updateTopOrigins, pulseHeartbeat } from './hud.js';
import { initDetailPanel, showPanel, hidePanel, getSelectedIcao, isFollowing, isIsolating, updatePanel } from './detail-panel.js';
import { initFilters, getActiveFilters } from './filters.js';
import { initGhost, getGhostAircraft, updateGhostPosition } from './ghost.js';
import { initUnits } from './units.js';
import { initSearch, updateSearchData } from './search.js';
import { recordPositions, getTrailsGeoJSON } from './trails.js';
import { updateStates, pruneStates, interpolateInPlace } from './interpolate.js';
import { detectAnomalies, updateAnomalyPanel, isPrivateJetType } from './anomaly.js';
import { initIntercept, isInterceptActive, checkInterceptTarget } from './intercept.js';
import { initTerminator, toggleTerminator } from './terminator.js';
import { initRouteArc } from './route-arc.js';
import { detectProximity, updateTcasPanel, proximityToGeoJSON } from './proximity.js';
import { initAmbience, playDataBlip, playProximityAlert, playEmergencyAlert } from './ambience.js';
import { initPOI, togglePOI } from './poi.js';
import { VIP_AIRCRAFT, getVipInfo } from './vip-registry.js';
import { initTheater } from './theater.js';
import { initLandings, toggleLandings, updateLandingsFromAircraft } from './landings.js';
import { initWarzones, toggleWarzones } from './warzones.js';
import { initCoop, isCoopEnabled, isCoopHost, getCoopRoom, getShareUrl, enableCoopHost, enableCoopFollow, disableCoop, coopBroadcastSelection } from './coop.js';
import { initLiveCams, toggleLiveCams } from './livecams.js';
import { initConflictIntel, toggleConflictIntel, openBriefingPanel } from './conflict-intel.js';
import './styles/conflict-intel.css';

const FETCH_INTERVAL = 5000;
const MAX_AIRCRAFT = 3000; // Cap to prevent browser crash

let map;
let allAircraft = [];
let fetchError = false;
let countdownInterval = null;
let showTrails = true;
let showGround = true;
let tcasEnabled = false;
let tcasSkip = false; // alternate: skip every other fetch cycle
let showLandings = false;
let showWarzones = true;
let showLiveCams = true;
let showConflict = true;

// Cinematic camera state — store pre-focus view so we can snap back
let preFocusCamera = null;
let focusedOnAircraft = false;
let lostTargetFrames = 0; // count frames where followed aircraft is missing
let lastIsolateState = false; // track isolate mode to avoid redundant paint updates

// Emergency state tracking — only alert on NEW emergencies
const knownEmergencies = new Set();
let emergencyAlertTimer = null;

function showEmergencyBanner(ac, reason) {
  const el = document.getElementById('emergency-alert');
  const titleEl = document.getElementById('emergency-alert-title');
  const detailEl = document.getElementById('emergency-alert-detail');
  if (!el || !titleEl || !detailEl) return;

  const callsign = ac.callsign || ac.icao24;
  titleEl.textContent = reason;
  detailEl.textContent = `${callsign} ${ac.aircraft_type ? '· ' + ac.aircraft_type : ''}`;

  el.classList.remove('hidden');
  // Force reflow then animate in
  void el.offsetWidth;
  el.classList.add('visible');

  const clickHandler = () => {
    showPanel(ac);
    if (ac.longitude != null && ac.latitude != null) {
      map.flyTo({ center: [ac.longitude, ac.latitude], zoom: Math.max(map.getZoom(), 9), duration: 2000 });
    }
    dismissEmergencyBanner();
    el.removeEventListener('click', clickHandler);
  };
  el.onclick = clickHandler;

  const closeBtn = document.getElementById('emergency-alert-close');
  if (closeBtn) closeBtn.onclick = (e) => { e.stopPropagation(); dismissEmergencyBanner(); };

  if (emergencyAlertTimer) clearTimeout(emergencyAlertTimer);
  emergencyAlertTimer = setTimeout(dismissEmergencyBanner, 12000);
}

function dismissEmergencyBanner() {
  const el = document.getElementById('emergency-alert');
  if (!el) return;
  el.classList.remove('visible');
  setTimeout(() => el.classList.add('hidden'), 400);
  if (emergencyAlertTimer) { clearTimeout(emergencyAlertTimer); emergencyAlertTimer = null; }
}

const statFastest = document.getElementById('stat-fastest');
const statHighest = document.getElementById('stat-highest');
const statClements = document.getElementById('stat-clements');
const statDeepDive = document.getElementById('stat-deepdive');
const statRocketship = document.getElementById('stat-rocketship');
const statSlowpoke = document.getElementById('stat-slowpoke');
const statMilCount = document.getElementById('stat-mil-count');
const statVipCount = document.getElementById('stat-vip-count');
const statPvtCount = document.getElementById('stat-pvt-count');
const statTicker = document.getElementById('stat-ticker');

const leaderboardAircraft = {};

function fmtAircraftLine(ac, extra) {
  const cs = (ac.callsign || ac.icao24 || '').trim();
  const type = (ac.aircraft_type || '').trim();
  const bits = [cs];
  if (type) bits.push(type);
  if (extra) bits.push(extra);
  return bits.filter(Boolean).join(' · ');
}

function updateTopFlightStats(aircraft) {
  const list = (aircraft || []).filter((a) => a && !a.isGhost);
  const airborne = list.filter((a) => !a.on_ground);

  // FASTEST
  let fastest = null;
  for (const a of airborne) {
    if (a.speed_kts == null) continue;
    if (!fastest || a.speed_kts > fastest.speed_kts) fastest = a;
  }

  // HIGHEST
  let highest = null;
  for (const a of airborne) {
    if (a.altitude_ft == null) continue;
    if (!highest || a.altitude_ft > highest.altitude_ft) highest = a;
  }

  // TOP MIL (Clements Approved)
  let topMil = null;
  for (const a of airborne) {
    if ((a.dbFlags & 1) === 0) continue;
    if (a.speed_kts == null) continue;
    if (!topMil || a.speed_kts > topMil.speed_kts) topMil = a;
  }

  // DEEP DIVE — fastest descender
  let deepDive = null;
  for (const a of airborne) {
    if (a.vertical_rate_fpm == null || a.vertical_rate_fpm >= 0) continue;
    if (!deepDive || a.vertical_rate_fpm < deepDive.vertical_rate_fpm) deepDive = a;
  }

  // ROCKETSHIP — fastest climber
  let rocketship = null;
  for (const a of airborne) {
    if (a.vertical_rate_fpm == null || a.vertical_rate_fpm <= 0) continue;
    if (!rocketship || a.vertical_rate_fpm > rocketship.vertical_rate_fpm) rocketship = a;
  }

  // SLOWPOKE — slowest airborne (min 50 kts to exclude glitches)
  let slowpoke = null;
  for (const a of airborne) {
    if (a.speed_kts == null || a.speed_kts < 50) continue;
    if (!slowpoke || a.speed_kts < slowpoke.speed_kts) slowpoke = a;
  }

  // Counts
  let milCount = 0, vipCount = 0, pvtCount = 0;
  for (const a of list) {
    if (a.dbFlags & 1) milCount++;
    if (getVipInfo(a.icao24)) vipCount++;
    if (a.aircraft_type && isPrivateJetType(a.aircraft_type)) pvtCount++;
  }

  if (statFastest) statFastest.textContent = fastest ? fmtAircraftLine(fastest, `${fastest.speed_kts} kts`) : '---';
  if (statHighest) statHighest.textContent = highest ? fmtAircraftLine(highest, `${Math.round(highest.altitude_ft).toLocaleString()} ft`) : '---';
  if (statClements) statClements.textContent = topMil ? fmtAircraftLine(topMil, `${topMil.speed_kts} kts`) : '---';
  if (statDeepDive) statDeepDive.textContent = deepDive ? fmtAircraftLine(deepDive, `${Math.round(deepDive.vertical_rate_fpm)} fpm`) : '---';
  if (statRocketship) statRocketship.textContent = rocketship ? fmtAircraftLine(rocketship, `+${Math.round(rocketship.vertical_rate_fpm)} fpm`) : '---';
  if (statSlowpoke) statSlowpoke.textContent = slowpoke ? fmtAircraftLine(slowpoke, `${slowpoke.speed_kts} kts`) : '---';
  if (statMilCount) statMilCount.textContent = String(milCount);
  if (statVipCount) statVipCount.textContent = String(vipCount);
  if (statPvtCount) statPvtCount.textContent = String(pvtCount);

  leaderboardAircraft.fastest = fastest;
  leaderboardAircraft.highest = highest;
  leaderboardAircraft.clements = topMil;
  leaderboardAircraft.deepdive = deepDive;
  leaderboardAircraft.rocketship = rocketship;
  leaderboardAircraft.slowpoke = slowpoke;

  // Collapsed ticker — rotate through top stats
  if (statTicker) {
    const tickerItems = [];
    if (fastest) tickerItems.push(`${fastest.callsign || fastest.icao24} ${fastest.speed_kts}kts`);
    if (highest) tickerItems.push(`${highest.callsign || highest.icao24} FL${Math.round(highest.altitude_ft / 100)}`);
    if (topMil) tickerItems.push(`MIL: ${topMil.callsign || topMil.icao24}`);
    statTicker.textContent = tickerItems.length ? tickerItems[Math.floor(Date.now() / 4000) % tickerItems.length] : '';
  }
}

const tooltipEl = document.getElementById('hover-tooltip');
const tooltipCallsign = document.getElementById('tooltip-callsign');
const tooltipInfo = document.getElementById('tooltip-info');

// Render chevron icon to raw pixel data for reliable MapLibre WebGL rendering
function createChevronIcon(color, stroke, size = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.094);   // top center
  ctx.lineTo(size * 0.875, size * 0.813);  // bottom right
  ctx.lineTo(size * 0.5, size * 0.594);    // notch
  ctx.lineTo(size * 0.125, size * 0.813);  // bottom left
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  const imageData = ctx.getImageData(0, 0, size, size);
  return { width: size, height: size, data: new Uint8Array(imageData.data.buffer) };
}

async function setupLayers() {
  // Canvas-rendered icons — direct pixel data, no async image loading issues
  map.addImage('chevron-low', createChevronIcon('#FFA500', 'rgba(0,0,0,0.4)'));
  map.addImage('chevron-mid', createChevronIcon('#00CED1', 'rgba(0,0,0,0.4)'));
  map.addImage('chevron-high', createChevronIcon('#E0F0FF', 'rgba(0,0,0,0.4)'));
  map.addImage('chevron-ghost', createChevronIcon('#ff4444', 'rgba(255,0,0,0.6)'));
  console.log('[GhostTrack] Canvas icons loaded');

  // Trail lines
  map.addSource('trails', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer({
    id: 'trail-lines',
    type: 'line',
    source: 'trails',
    paint: {
      'line-color': 'rgba(0, 255, 136, 0.15)',
      'line-width': 1.5,
      'line-blur': 1,
    },
  });

  // Aircraft source with clustering — Points only, no mixed geometries
  map.addSource('aircraft', {
    type: 'geojson',
    data: toAircraftGeoJSON([]),
    cluster: true,
    clusterMaxZoom: 5,
    clusterRadius: 50,
  });

  // Velocity vectors — separate unclustered source (LineStrings only)
  map.addSource('aircraft-vectors', {
    type: 'geojson',
    data: toVectorGeoJSON([]),
  });

  // Cluster circles
  map.addLayer({
    id: 'aircraft-clusters',
    type: 'circle',
    source: 'aircraft',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step', ['get', 'point_count'],
        'rgba(0, 255, 136, 0.1)',
        50, 'rgba(0, 255, 136, 0.15)',
        200, 'rgba(255, 165, 0, 0.12)',
        500, 'rgba(255, 165, 0, 0.18)',
      ],
      'circle-stroke-color': [
        'step', ['get', 'point_count'],
        'rgba(0, 255, 136, 0.3)',
        200, 'rgba(255, 165, 0, 0.3)',
      ],
      'circle-stroke-width': 1,
      'circle-radius': ['step', ['get', 'point_count'], 15, 50, 22, 200, 28, 500, 36],
    },
  });

  // Cluster labels
  map.addLayer({
    id: 'aircraft-cluster-count',
    type: 'symbol',
    source: 'aircraft',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-size': 11,
      'text-font': ['Noto Sans Bold'],
    },
    paint: {
      'text-color': '#00ff88',
    },
  });

  // TCAS proximity alert lines
  map.addSource('tcas-alerts', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  map.addLayer({
    id: 'tcas-lines',
    type: 'line',
    source: 'tcas-alerts',
    filter: ['==', ['geometry-type'], 'LineString'],
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'severity'], 'RA'], 'rgba(255, 68, 68, 0.7)',
        'rgba(255, 165, 0, 0.5)',
      ],
      'line-width': [
        'case',
        ['==', ['get', 'severity'], 'RA'], 2,
        1.5,
      ],
      'line-dasharray': [3, 2],
    },
  });

  map.addLayer({
    id: 'tcas-midpoints',
    type: 'circle',
    source: 'tcas-alerts',
    filter: ['==', ['get', 'type'], 'midpoint'],
    paint: {
      'circle-radius': [
        'case',
        ['==', ['get', 'severity'], 'RA'], 6,
        4,
      ],
      'circle-color': [
        'case',
        ['==', ['get', 'severity'], 'RA'], 'rgba(255, 68, 68, 0.3)',
        'rgba(255, 165, 0, 0.2)',
      ],
      'circle-stroke-color': [
        'case',
        ['==', ['get', 'severity'], 'RA'], 'rgba(255, 68, 68, 0.8)',
        'rgba(255, 165, 0, 0.6)',
      ],
      'circle-stroke-width': 1.5,
    },
  });

  map.addLayer({
    id: 'aircraft-vectors',
    type: 'line',
    source: 'aircraft-vectors',
    filter: ['==', ['get', 'isVector'], 1],
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 1,
      'line-opacity': 0.3,
      'line-dasharray': [3, 4],
    },
  });

  // Individual aircraft icons
  map.addLayer({
    id: 'aircraft-icons',
    type: 'symbol',
    source: 'aircraft',
    filter: ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'isVector'], 1]],
    layout: {
      'icon-image': [
        'case',
        ['==', ['get', 'isGhost'], 1], 'chevron-ghost',
        ['==', ['get', 'band'], 'low'], 'chevron-low',
        ['==', ['get', 'band'], 'mid'], 'chevron-mid',
        'chevron-high',
      ],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 2, 0.35, 5, 0.55, 8, 0.85, 12, 1.0],
      'icon-rotate': ['get', 'rotation'],
      'icon-rotation-alignment': 'map',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'text-field': ['step', ['zoom'], '', 7, ['get', 'callsign']],
      'text-size': 10,
      'text-offset': [1.2, 0],
      'text-anchor': 'left',
      'text-font': ['Noto Sans Regular'],
      'text-optional': true,
    },
    paint: {
      'text-color': [
        'case',
        ['==', ['get', 'isGhost'], 1], '#ff4444',
        '#00ff88',
      ],
      'text-halo-color': 'rgba(10, 14, 23, 0.9)',
      'text-halo-width': 1.5,
      'icon-opacity': [
        'case',
        ['==', ['get', 'isGhost'], 1], 0.6,
        ['==', ['get', 'on_ground'], 1], 0.5,
        1,
      ],
    },
  });
}

function showSignalLost(message) {
  fetchError = true;
  const overlay = document.getElementById('signal-lost');
  const msgEl = document.getElementById('signal-lost-message');
  const countdownEl = document.getElementById('signal-lost-countdown');

  msgEl.textContent = message || 'Connection interrupted';
  overlay.classList.remove('hidden');

  let countdown = Math.ceil(FETCH_INTERVAL / 1000);
  countdownEl.textContent = countdown;

  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    countdown--;
    countdownEl.textContent = Math.max(0, countdown);
    if (countdown <= 0) clearInterval(countdownInterval);
  }, 1000);
}

function hideSignalLost() {
  fetchError = false;
  document.getElementById('signal-lost').classList.add('hidden');
  if (countdownInterval) clearInterval(countdownInterval);
}

function applyFilters(aircraft) {
  const filters = getActiveFilters();
  return aircraft.filter((a) => {
    if (a.isGhost) return true;
    if (!showGround && a.on_ground) return false;
    return filters[a.band];
  });
}

// Push data to MapLibre — called ONLY when data changes, not on a timer
function pushToMap(aircraft) {
  const ghosts = getGhostAircraft();
  let combined = [...aircraft, ...ghosts];
  combined = applyFilters(combined);

  // Cap to prevent WebGL crash
  if (combined.length > MAX_AIRCRAFT) {
    // Prioritize airborne over ground
    const airborne = combined.filter(a => !a.on_ground && !a.isGhost);
    const ground = combined.filter(a => a.on_ground);
    const special = combined.filter(a => a.isGhost);
    combined = [...special, ...airborne.slice(0, MAX_AIRCRAFT - special.length)];
    if (combined.length < MAX_AIRCRAFT) {
      combined.push(...ground.slice(0, MAX_AIRCRAFT - combined.length));
    }
  }

  const source = map.getSource('aircraft');
  if (source) {
    source.setData(toAircraftGeoJSON(combined));
  }
  const vecSource = map.getSource('aircraft-vectors');
  if (vecSource) {
    vecSource.setData(toVectorGeoJSON(combined));
  }

  recordPositions(combined);
  if (showTrails) {
    const trailSource = map.getSource('trails');
    if (trailSource) {
      trailSource.setData(getTrailsGeoJSON(combined));
    }
  }

  const selectedIcao = getSelectedIcao();
  if (selectedIcao) {
    const selected = combined.find((a) => a.icao24 === selectedIcao);
    if (selected) {
      updatePanel(selected);
      if (isFollowing() && selected.longitude != null) {
        map.easeTo({
          center: [selected.longitude, selected.latitude],
          duration: 250,
        });
      }
    }
  }
}

let fetchInProgress = false;
// Keep a map of recently-seen aircraft so they don't pop out instantly on zoom
const recentAircraftMap = new Map(); // icao24 → { aircraft, lastSeen }
const AIRCRAFT_STALENESS_MS = 120000; // keep unseen aircraft for 2min to prevent pop-out on zoom

async function fetchAndUpdate() {
  if (fetchInProgress) return;
  if (document.hidden) return; // save bandwidth when tab not visible
  fetchInProgress = true;
  try {
    const [aircraft, vipAircraft] = await Promise.all([
      fetchAircraft(map),
      fetchVipAircraft(),
    ]);

    // Merge VIP results — VIP scan is global, dedup by icao24
    const seen = new Map();
    for (const ac of aircraft) seen.set(ac.icao24, ac);
    for (const ac of vipAircraft) {
      if (!seen.has(ac.icao24)) seen.set(ac.icao24, ac);
    }

    // Update recent aircraft cache — fresh data wins, stale data kept briefly
    const now = Date.now();
    for (const [id, ac] of seen) {
      recentAircraftMap.set(id, { aircraft: ac, lastSeen: now });
    }
    for (const [id, entry] of recentAircraftMap) {
      if (now - entry.lastSeen > AIRCRAFT_STALENESS_MS) {
        recentAircraftMap.delete(id);
      }
    }
    allAircraft = Array.from(recentAircraftMap.values()).map(e => e.aircraft);

    // Only update interpolation base for FRESHLY fetched aircraft.
    // Stale cache entries keep their original base positions, preventing
    // the animation loop's in-place mutations from compounding.
    updateStates(Array.from(seen.values()), now);
    pruneStates(new Set(allAircraft.map(a => a.icao24)));

    const airborne = allAircraft.filter((a) => !a.on_ground).length;
    const ground = allAircraft.length - airborne;
    updateAircraftCount(allAircraft.length, airborne, ground);
    updateTopOrigins(allAircraft);
    updateSearchData(allAircraft);
    pulseHeartbeat();

    // Record trails from raw positions (animation loop handles rendering)
    const ghosts = getGhostAircraft();
    let filtered = applyFilters([...allAircraft, ...ghosts]);
    recordPositions(filtered);

    // Update selected aircraft panel
    const selectedIcao = getSelectedIcao();
    if (selectedIcao) {
      const selected = filtered.find(a => a.icao24 === selectedIcao);
      if (selected) updatePanel(selected);
    }

    // Record VIP/private landings (airborne -> on_ground transition)
    updateLandingsFromAircraft(map, allAircraft);

    updateTopFlightStats(allAircraft);

    // Detect anomalies (includes VIP from global scan)
    const anomalies = detectAnomalies(allAircraft);
    const onSelectAnomaly = (ac) => {
      showPanel(ac);
      if (ac.longitude != null && ac.latitude != null) {
        map.flyTo({
          center: [ac.longitude, ac.latitude],
          zoom: Math.max(map.getZoom(), 7),
          duration: 2000,
        });
      }
    };
    updateAnomalyPanel(anomalies, onSelectAnomaly);

    // Check for NEW emergency squawk activations
    const currentEmergencies = new Set();
    for (const a of anomalies) {
      if (a.type === 'emergency') {
        currentEmergencies.add(a.aircraft.icao24);
        if (!knownEmergencies.has(a.aircraft.icao24)) {
          playEmergencyAlert();
          showEmergencyBanner(a.aircraft, a.reason);
        }
      }
    }
    knownEmergencies.clear();
    for (const id of currentEmergencies) knownEmergencies.add(id);

    playDataBlip();

    // TCAS proximity — runs every other fetch cycle to halve CPU cost,
    // deferred off the critical render path so aircraft paint without stutter
    tcasSkip = !tcasSkip;
    if (!tcasSkip) {
      const acSnapshot = allAircraft;
      setTimeout(() => {
        if (!tcasEnabled) {
          const src = map.getSource('tcas-alerts');
          if (src) src.setData({ type: 'FeatureCollection', features: [] });
          updateTcasPanel([], null);
          return;
        }
        const proximityAlerts = detectProximity(acSnapshot);
        const tcasSource = map.getSource('tcas-alerts');
        if (tcasSource) {
          tcasSource.setData(proximityToGeoJSON(proximityAlerts));
        }
        updateTcasPanel(proximityAlerts, onSelectAnomaly);
        if (proximityAlerts.some(a => a.severity === 'RA')) {
          playProximityAlert();
        }
      }, 100);
    }

    if (fetchError) hideSignalLost();
  } catch (err) {
    console.error('[GhostTrack] Fetch error:', err);
    showSignalLost(err.message || 'Connection interrupted');
  } finally {
    fetchInProgress = false;
  }
}

// 60fps animation loop — dead-reckoning aircraft between API fetches.
// Uses requestAnimationFrame for smooth motion. Throttles setData to ~30fps
// to balance visual smoothness against GPU/GeoJSON parsing cost.
let lastRenderTime = 0;
let lastTrailRender = 0;
const RENDER_INTERVAL = 32; // ~30fps — smooth realtime motion for chevrons
const TRAIL_INTERVAL = 3000;
let animFrameId = null;

// Reusable filtered array — avoids per-frame allocation
let frameAircraft = [];

function animationLoop(timestamp) {
  animFrameId = requestAnimationFrame(animationLoop);

  if (allAircraft.length === 0) return;
  if (document.hidden) return;

  // Camera follow runs every frame for smoothness (no setData needed)
  const selectedIcao = getSelectedIcao();
  if (selectedIcao && isFollowing()) {
    const selected = allAircraft.find(a => a.icao24 === selectedIcao);
    if (selected && selected.longitude != null) {
      lostTargetFrames = 0;
      map.easeTo({ center: [selected.longitude, selected.latitude], duration: 180 });
    } else {
      // Aircraft disappeared — auto-return after ~3 seconds (~180 frames at 60fps)
      lostTargetFrames++;
      if (lostTargetFrames > 180) {
        hidePanel();
        returnToGlobeView();
        lostTargetFrames = 0;
      }
    }
  }
  if (focusedOnAircraft && selectedIcao) {
    const target = allAircraft.find(a => a.icao24 === selectedIcao);
    if (target && target.longitude != null) {
      updateReticlePosition(target.longitude, target.latitude);
    }
  }

  // Throttle source updates — setData is expensive with clustering
  if (timestamp - lastRenderTime < RENDER_INTERVAL) return;
  lastRenderTime = timestamp;

  // Dead-reckon positions in-place (mutates allAircraft lon/lat)
  interpolateInPlace(allAircraft, Date.now());

  const ghosts = getGhostAircraft();
  frameAircraft = ghosts.length > 0 ? [...allAircraft, ...ghosts] : allAircraft;
  frameAircraft = applyFilters(frameAircraft);

  if (frameAircraft.length > MAX_AIRCRAFT) {
    const airborne = frameAircraft.filter(a => !a.on_ground && !a.isGhost);
    const special = frameAircraft.filter(a => a.isGhost);
    frameAircraft = [...special, ...airborne.slice(0, MAX_AIRCRAFT - special.length)];
    if (frameAircraft.length < MAX_AIRCRAFT) {
      const ground = frameAircraft.filter(a => a.on_ground);
      frameAircraft.push(...ground.slice(0, MAX_AIRCRAFT - frameAircraft.length));
    }
  }

  const source = map.getSource('aircraft');
  if (source) {
    source.setData(toAircraftGeoJSON(frameAircraft));
  }
  const vecSource = map.getSource('aircraft-vectors');
  if (vecSource) {
    vecSource.setData(toVectorGeoJSON(frameAircraft));
  }

  if (showTrails && timestamp - lastTrailRender > TRAIL_INTERVAL) {
    lastTrailRender = timestamp;
    const trailSource = map.getSource('trails');
    if (trailSource) trailSource.setData(getTrailsGeoJSON(frameAircraft));
  }

  // Isolate mode — dim all aircraft except the selected one
  const isolating = isIsolating() && selectedIcao;
  if (isolating !== lastIsolateState) {
    lastIsolateState = isolating;
    if (isolating) {
      map.setPaintProperty('aircraft-icons', 'icon-opacity', [
        'case',
        ['==', ['get', 'icao24'], selectedIcao], 1,
        0.08,
      ]);
      map.setPaintProperty('aircraft-icons', 'text-opacity', [
        'case',
        ['==', ['get', 'icao24'], selectedIcao], 1,
        0,
      ]);
      map.setLayoutProperty('aircraft-clusters', 'visibility', 'none');
      map.setLayoutProperty('aircraft-cluster-count', 'visibility', 'none');
      map.setPaintProperty('aircraft-vectors', 'line-opacity', 0);
    } else {
      map.setPaintProperty('aircraft-icons', 'icon-opacity', [
        'case',
        ['==', ['get', 'isGhost'], 1], 0.6,
        ['==', ['get', 'on_ground'], 1], 0.5,
        1,
      ]);
      map.setPaintProperty('aircraft-icons', 'text-opacity', 1);
      map.setLayoutProperty('aircraft-clusters', 'visibility', 'visible');
      map.setLayoutProperty('aircraft-cluster-count', 'visibility', 'visible');
      map.setPaintProperty('aircraft-vectors', 'line-opacity', 0.3);
    }
  }
}

function setupInteraction() {
  map.on('click', 'aircraft-icons', (e) => {
    if (!e.features || !e.features.length) return;
    const props = e.features[0].properties;
    const coords = e.features[0].geometry.coordinates;

    const aircraft = {
      icao24: props.icao24,
      callsign: props.callsign,
      origin_country: props.origin_country,
      altitude_ft: props.altitude_ft,
      speed_kts: props.speed_kts,
      heading: props.heading,
      vertical_rate: props.vertical_rate,
      vertical_rate_fpm: props.vertical_rate_fpm,
      on_ground: props.on_ground === 1 || props.on_ground === true,
      isGhost: props.isGhost === 1 || props.isGhost === true,
      longitude: coords[0],
      latitude: coords[1],
      true_track: props.rotation,
      registration: props.registration,
      aircraft_type: props.aircraft_type,
      squawk: props.squawk,
      category: props.category,
      dbFlags: props.dbFlags,
    };

    // INTERCEPT mode — check target before opening panel
    if (isInterceptActive()) {
      checkInterceptTarget(aircraft);
    }

    if (!focusedOnAircraft) {
      preFocusCamera = {
        center: map.getCenter().toArray(),
        zoom: map.getZoom(),
        pitch: map.getPitch(),
        bearing: map.getBearing(),
      };
    }
    focusedOnAircraft = true;
    lostTargetFrames = 0;

    showTargetReticle(coords[0], coords[1]);

    const heading = props.rotation || 0;
    const targetBearing = (heading + 30) % 360; // offset from aircraft heading for drama
    map.flyTo({
      center: [coords[0], coords[1]],
      zoom: Math.max(map.getZoom(), 10),
      pitch: 55,
      bearing: targetBearing,
      duration: 2400,
      essential: true,
      curve: 1.4,
    });

    showPanel(aircraft);
    if (isCoopHost()) coopBroadcastSelection(aircraft.icao24);
  });

  map.on('click', 'aircraft-clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['aircraft-clusters'] });
    const clusterId = features[0].properties.cluster_id;
    map.getSource('aircraft').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      map.easeTo({ center: features[0].geometry.coordinates, zoom });
    });
  });

  map.on('mousemove', 'aircraft-icons', (e) => {
    if (!e.features || !e.features.length) return;
    map.getCanvas().style.cursor = 'pointer';

    const props = e.features[0].properties;
    const callsign = props.callsign || props.icao24;
    const altText = props.altitude_ft != null ? `${Number(props.altitude_ft).toLocaleString()} ft` : 'GND';
    const speedText = props.speed_kts != null ? `${props.speed_kts} kts` : '';

    tooltipCallsign.textContent = props.isGhost === 1 ? '??? CLASSIFIED' : callsign;
    tooltipInfo.textContent = props.isGhost === 1
      ? ''
      : `${props.origin_country || ''} · ${altText}${speedText ? ' · ' + speedText : ''}`;

    tooltipEl.style.left = (e.originalEvent.clientX + 16) + 'px';
    tooltipEl.style.top = (e.originalEvent.clientY - 10) + 'px';
    tooltipEl.classList.remove('hidden');
  });

  map.on('mouseleave', 'aircraft-icons', () => {
    map.getCanvas().style.cursor = '';
    tooltipEl.classList.add('hidden');
  });

  map.on('mouseenter', 'aircraft-clusters', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'aircraft-clusters', () => {
    map.getCanvas().style.cursor = '';
  });

  map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['aircraft-icons', 'aircraft-clusters', 'livecams-icons', 'livecams-glow'] });
    if (features.length === 0 && getSelectedIcao()) {
      hidePanel();
      returnToGlobeView();
    }
  });

  map.on('click', 'landings-dots', (e) => {
    if (!e.features || !e.features.length) return;
    const p = e.features[0].properties || {};
    const when = p.landedAt ? new Date(Number(p.landedAt)).toLocaleString() : '';
    const where = p.nearestIcao ? `${p.nearestIcao}${p.nearestName ? ' — ' + p.nearestName : ''}` : '';
    const isVip = p.kind === 'vip';
    const titleColor = isVip ? '#FFD700' : '#c8a0ff';
    const badge = isVip ? 'VIP LANDING' : 'PRIVATE JET LANDING';
    const owner = isVip ? (p.label || 'VIP') : '';
    const esc = (s) => String(s).replace(/</g, '&lt;');
    const html = `<div style="font-family:JetBrains Mono,monospace;max-width:250px;">` +
      `<div style="font-size:8px;letter-spacing:2px;color:${titleColor};opacity:0.7;margin-bottom:3px;">${badge}</div>` +
      (owner ? `<div style="font-size:13px;font-weight:700;color:${titleColor};">${esc(owner)}</div>` : '') +
      (p.callsign ? `<div style="font-size:10px;color:#E0F0FF;opacity:0.8;">Callsign: ${esc(p.callsign)}</div>` : '') +
      (p.aircraft_type ? `<div style="font-size:10px;color:#E0F0FF;opacity:0.8;">Aircraft: ${esc(p.aircraft_type)}</div>` : '') +
      (where ? `<div style="font-size:10px;color:#00ff88;margin-top:3px;">${esc(where)}</div>` : '') +
      (when ? `<div style="font-size:9px;color:#E0F0FF;opacity:0.5;margin-top:2px;">${esc(when)}</div>` : '') +
      `</div>`;
    new maplibregl.Popup({ closeButton: true, closeOnClick: true, className: isVip ? 'vip-landing-popup' : '' })
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(map);
  });

  map.on('mouseenter', 'landings-dots', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'landings-dots', () => { map.getCanvas().style.cursor = ''; });

  map.on('click', 'warzones-fill', (e) => {
    if (!e.features || !e.features.length) return;
    const p = e.features[0].properties || {};
    const name = p.name || 'Conflict Zone';
    const desc = p.desc || '';
    const html = `<div style="font-family:JetBrains Mono,monospace;max-width:340px;">` +
      `<div style="font-size:13px;font-weight:700;color:#ff6666;letter-spacing:1.5px;margin-bottom:6px;">` +
      `&#9888; ${name.replace(/</g,'&lt;')}</div>` +
      (desc ? `<div style="font-size:12px;color:#E0F0FF;line-height:1.6;">${desc.replace(/</g,'&lt;')}</div>` : '') +
      `</div>`;
    new maplibregl.Popup({ closeButton: true, closeOnClick: true, className: 'warzone-popup' })
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(map);
  });
  map.on('mouseenter', 'warzones-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'warzones-fill', () => { map.getCanvas().style.cursor = ''; });
}

function handleFilterDisplayOptions() {
  const groundCheck = document.getElementById('filter-ground');
  const trailsCheck = document.getElementById('filter-trails');

  if (groundCheck) {
    groundCheck.addEventListener('change', () => {
      showGround = groundCheck.checked;
      // Animation loop picks up filter change next frame
    });
  }

  if (trailsCheck) {
    trailsCheck.addEventListener('change', () => {
      showTrails = trailsCheck.checked;
      if (!showTrails) {
        const trailSource = map.getSource('trails');
        if (trailSource) {
          trailSource.setData({ type: 'FeatureCollection', features: [] });
        }
      }
    });
  }

  const terminatorCheck = document.getElementById('filter-terminator');
  if (terminatorCheck) {
    terminatorCheck.addEventListener('change', () => {
      toggleTerminator(map, terminatorCheck.checked);
    });
  }

  const poiCheck = document.getElementById('filter-poi');
  if (poiCheck) {
    poiCheck.addEventListener('change', () => {
      togglePOI(map, poiCheck.checked);
    });
  }

  const landingsCheck = document.getElementById('filter-landings');
  if (landingsCheck) {
    landingsCheck.addEventListener('change', () => {
      showLandings = landingsCheck.checked;
      toggleLandings(map, showLandings);
    });
  }

  const warzonesCheck = document.getElementById('filter-warzones');
  if (warzonesCheck) {
    warzonesCheck.addEventListener('change', () => {
      showWarzones = warzonesCheck.checked;
      toggleWarzones(map, showWarzones);
    });
  }

  const livecamsCheck = document.getElementById('filter-livecams');
  if (livecamsCheck) {
    livecamsCheck.addEventListener('change', () => {
      showLiveCams = livecamsCheck.checked;
      toggleLiveCams(map, showLiveCams);
    });
  }

  const conflictCheck = document.getElementById('filter-conflict');
  if (conflictCheck) {
    conflictCheck.addEventListener('change', () => {
      showConflict = conflictCheck.checked;
      toggleConflictIntel(map, showConflict);
    });
  }

  const conflictBtn = document.getElementById('conflict-briefing-btn');
  if (conflictBtn) {
    conflictBtn.addEventListener('click', () => openBriefingPanel());
  }

  const watchlistCheck = document.getElementById('filter-watchlist');
  const watchlistPanel = document.getElementById('anomaly-tracker');
  if (watchlistCheck && watchlistPanel) {
    watchlistCheck.addEventListener('change', () => {
      watchlistPanel.style.display = watchlistCheck.checked ? '' : 'none';
    });
  }

  const coopHostCheck = document.getElementById('filter-coop');
  const coopFollowCheck = document.getElementById('filter-coop-follow');
  const coopCopyBtn = document.getElementById('coop-copy-link');
  const coopStatus = document.getElementById('coop-status');

  function refreshCoopUi() {
    if (!coopHostCheck || !coopFollowCheck || !coopCopyBtn || !coopStatus) return;
    const on = isCoopEnabled();
    coopHostCheck.checked = on && isCoopHost();
    coopFollowCheck.checked = on && !isCoopHost();
    coopCopyBtn.disabled = !(on && isCoopHost() && getCoopRoom());
    coopStatus.textContent = !on ? 'OFF' : (isCoopHost() ? `HOST · ROOM ${getCoopRoom()}` : `FOLLOW · ROOM ${getCoopRoom()}`);
  }

  if (coopHostCheck) {
    coopHostCheck.addEventListener('change', () => {
      if (coopHostCheck.checked) {
        if (coopFollowCheck) coopFollowCheck.checked = false;
        enableCoopHost();
      } else {
        disableCoop();
      }
      refreshCoopUi();
    });
  }

  if (coopFollowCheck) {
    coopFollowCheck.addEventListener('change', () => {
      if (coopFollowCheck.checked) {
        if (coopHostCheck) coopHostCheck.checked = false;
        enableCoopFollow();
      } else {
        disableCoop();
      }
      refreshCoopUi();
    });
  }

  if (coopCopyBtn) {
    coopCopyBtn.addEventListener('click', async () => {
      const url = getShareUrl();
      if (!url) return;
      try {
        await navigator.clipboard.writeText(url);
        if (coopStatus) coopStatus.textContent = 'COPIED';
        setTimeout(refreshCoopUi, 1200);
      } catch {
        window.prompt('Copy this link:', url);
      }
    });
  }

  refreshCoopUi();
}

function setupCollapsiblePanels() {
  document.querySelectorAll('.collapse-header').forEach((header) => {
    header.addEventListener('click', (e) => {
      // Don't collapse when clicking the ? help icon or the toggle
      if (e.target.closest('.tcas-help') || e.target.closest('.tcas-toggle-label')) return;

      const targetId = header.dataset.target;
      const body = document.getElementById(targetId);
      if (!body) return;

      const panel = header.closest('.collapsible');
      panel.classList.toggle('collapsed');
    });
  });

  const leaderboardRows = {
    'stat-row-fastest': 'fastest',
    'stat-row-highest': 'highest',
    'stat-row-clements': 'clements',
    'stat-row-deepdive': 'deepdive',
    'stat-row-rocketship': 'rocketship',
    'stat-row-slowpoke': 'slowpoke',
  };
  for (const [elId, key] of Object.entries(leaderboardRows)) {
    const row = document.getElementById(elId);
    if (row) {
      row.addEventListener('click', () => {
        const ac = leaderboardAircraft[key];
        if (!ac) return;
        showPanel(ac);
        if (ac.longitude != null && ac.latitude != null) {
          map.flyTo({ center: [ac.longitude, ac.latitude], zoom: Math.max(map.getZoom(), 8), duration: 2000 });
        }
      });
    }
  }

  const tcasCheck = document.getElementById('tcas-enabled');
  const tcasToggleText = tcasCheck ? tcasCheck.parentElement.querySelector('.tcas-toggle-text') : null;
  if (tcasCheck) {
    tcasCheck.addEventListener('change', () => {
      tcasEnabled = tcasCheck.checked;
      if (tcasToggleText) tcasToggleText.textContent = tcasEnabled ? 'ON' : 'OFF';
      if (!tcasEnabled) {
        const src = map.getSource('tcas-alerts');
        if (src) src.setData({ type: 'FeatureCollection', features: [] });
        updateTcasPanel([], null);
      }
    });
  }
}

function returnToGlobeView() {
  if (!focusedOnAircraft) return;
  focusedOnAircraft = false;
  hideTargetReticle();

  // Always reset pitch/bearing to defaults — user expects a clean "normal" view
  const center = preFocusCamera ? preFocusCamera.center : map.getCenter().toArray();
  const zoom = preFocusCamera ? preFocusCamera.zoom : Math.min(map.getZoom(), 6);
  preFocusCamera = null;

  map.flyTo({
    center,
    zoom,
    pitch: 0,
    bearing: 0,
    duration: 2000,
    essential: true,
    curve: 1.2,
  });
}

const reticleEl = document.getElementById('target-reticle');

function showTargetReticle(lon, lat) {
  if (reticleEl) {
    reticleEl.classList.remove('hidden');
    reticleEl.classList.add('active');
    updateReticlePosition(lon, lat);
  }
}

function hideTargetReticle() {
  if (reticleEl) {
    reticleEl.classList.remove('active');
    setTimeout(() => reticleEl.classList.add('hidden'), 500);
  }
}

function updateReticlePosition(lon, lat) {
  if (!reticleEl || !map) return;
  const point = map.project([lon, lat]);
  // Scale reticle: larger when zoomed out, smaller when zoomed in
  const zoom = map.getZoom();
  const size = Math.max(60, Math.min(240, 320 - zoom * 20));
  reticleEl.style.width = size + 'px';
  reticleEl.style.height = size + 'px';
  reticleEl.style.transform = `translate(${point.x - size / 2}px, ${point.y - size / 2}px)`;
}

async function init() {
  map = createMap();

  initHUD(map);
  initUnits();
  initCoop((icao24) => {
    const ac = allAircraft.find((a) => a.icao24 === icao24);
    if (!ac) return;
    showPanel(ac);
    if (ac.longitude != null && ac.latitude != null) {
      map.flyTo({ center: [ac.longitude, ac.latitude], zoom: Math.max(map.getZoom(), 7), duration: 1200, essential: true });
    }
  });

  initDetailPanel(
    () => { returnToGlobeView(); },
    (coords) => {
      map.easeTo({ center: coords, duration: 800 });
    }
  );

  initFilters(() => {
    // Animation loop picks up filter change next frame
  });

  initSearch((aircraft) => {
    showPanel(aircraft);
    if (aircraft.longitude != null && aircraft.latitude != null) {
      map.flyTo({
        center: [aircraft.longitude, aircraft.latitude],
        zoom: Math.max(map.getZoom(), 7),
        duration: 2000,
      });
    }
  });

  initGhost();
  initIntercept(() => allAircraft);
  initAmbience();

  setVipHexes(Array.from(VIP_AIRCRAFT.keys()));

  map.on('load', async () => {
    console.log('[GhostTrack] Map loaded, setting up layers...');
    await setupLayers();
    console.log('[GhostTrack] Layers ready');

    initTerminator(map);
    initRouteArc(map);
    initPOI(map);
    initWarzones(map);
    initLandings(map);
    initLiveCams(map);
    initConflictIntel(map);
    toggleWarzones(map, showWarzones);

    setupInteraction();
    handleFilterDisplayOptions();
    setupCollapsiblePanels();

    initTheater(map, () => allAircraft, (ac) => {
      showPanel(ac);
      if (isCoopHost()) coopBroadcastSelection(ac.icao24);
    });

    await fetchAndUpdate();

    const splash = document.getElementById('loading-splash');
    if (splash) {
      splash.classList.add('fade-out');
      setTimeout(() => splash.remove(), 1000);
    }

    map.on('move', () => {
      if (focusedOnAircraft && getSelectedIcao()) {
        const target = allAircraft.find(a => a.icao24 === getSelectedIcao());
        if (target && target.longitude != null) {
          updateReticlePosition(target.longitude, target.latitude);
        }
      }
    });

    // Re-fetch when user pans or zooms (debounced)
    let moveTimer = null;
    map.on('moveend', () => {
      if (moveTimer) clearTimeout(moveTimer);
      moveTimer = setTimeout(fetchAndUpdate, 800);
    });

    setInterval(fetchAndUpdate, FETCH_INTERVAL);

    // 60fps dead-reckoning animation loop
    animFrameId = requestAnimationFrame(animationLoop);

    // Ghost position update — slow timer, re-pushes only when ghost exists
    setInterval(() => {
      const ghosts = getGhostAircraft();
      if (ghosts.length > 0) {
        updateGhostPosition(3000);
      }
    }, 3000);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && getSelectedIcao()) {
        hidePanel();
        returnToGlobeView();
        return;
      }
      if ((e.key === '/' || (e.key === 'k' && (e.ctrlKey || e.metaKey))) && document.activeElement?.id !== 'search-input') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
        return;
      }
      if (e.key === 'f' && getSelectedIcao() && document.activeElement?.tagName !== 'INPUT') {
        const followBtn = document.getElementById('btn-follow');
        if (followBtn) followBtn.click();
        return;
      }
    });
  });
}

init();
