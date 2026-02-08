import 'maplibre-gl/dist/maplibre-gl.css';
import './styles/main.css';
import './styles/hud.css';
import './styles/detail-panel.css';
import './styles/radar-sweep.css';

import { createMap } from './map.js';
import { fetchAircraft, toGeoJSON, setVipHexes, fetchVipAircraft } from './aircraft.js';
import { initHUD, updateAircraftCount, updateTopOrigins, pulseHeartbeat } from './hud.js';
import { initDetailPanel, showPanel, hidePanel, getSelectedIcao, isFollowing, updatePanel } from './detail-panel.js';
import { initFilters, getActiveFilters } from './filters.js';
import { initGhost, getGhostAircraft, updateGhostPosition } from './ghost.js';
import { initUnits } from './units.js';
import { initSearch, updateSearchData } from './search.js';
import { recordPositions, getTrailsGeoJSON } from './trails.js';
import { updateStates, getInterpolatedPositions } from './interpolate.js';
import { detectAnomalies, updateAnomalyPanel } from './anomaly.js';
import { initIntercept, isInterceptActive, checkInterceptTarget } from './intercept.js';
import { initTerminator, toggleTerminator } from './terminator.js';
import { initRouteArc } from './route-arc.js';
import { detectProximity, updateTcasPanel, proximityToGeoJSON } from './proximity.js';
import { initAmbience, playDataBlip, playProximityAlert } from './ambience.js';
import { initPOI, togglePOI } from './poi.js';
import { VIP_AIRCRAFT } from './vip-registry.js';
import { initTheater } from './theater.js';
import { initLandings, toggleLandings, updateLandingsFromAircraft } from './landings.js';
import { initWarzones, toggleWarzones } from './warzones.js';

const FETCH_INTERVAL = 5000;
const MAX_AIRCRAFT = 3000; // Cap to prevent browser crash

let map;
let allAircraft = [];
let fetchError = false;
let countdownInterval = null;
let showTrails = true;
let showGround = true;
let tcasEnabled = true;
let tcasSkip = false; // alternate: skip every other fetch cycle
let showLandings = false;
let showWarzones = true;

// Hover tooltip
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

  // Aircraft source with clustering
  map.addSource('aircraft', {
    type: 'geojson',
    data: toGeoJSON([]),
    cluster: true,
    clusterMaxZoom: 5,
    clusterRadius: 50,
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

  // Individual aircraft icons
  map.addLayer({
    id: 'aircraft-icons',
    type: 'symbol',
    source: 'aircraft',
    filter: ['!', ['has', 'point_count']],
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

  // Update aircraft source — single setData call
  const source = map.getSource('aircraft');
  if (source) {
    source.setData(toGeoJSON(combined));
  }

  // Record and update trails
  recordPositions(combined);
  if (showTrails) {
    const trailSource = map.getSource('trails');
    if (trailSource) {
      trailSource.setData(getTrailsGeoJSON(combined));
    }
  }

  // Update detail panel if aircraft selected
  const selectedIcao = getSelectedIcao();
  if (selectedIcao) {
    const selected = combined.find((a) => a.icao24 === selectedIcao);
    if (selected) {
      updatePanel(selected);
      if (isFollowing() && selected.longitude != null) {
        map.easeTo({
          center: [selected.longitude, selected.latitude],
          duration: 1000,
        });
      }
    }
  }
}

let fetchInProgress = false;

async function fetchAndUpdate() {
  if (fetchInProgress) return;
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
    allAircraft = Array.from(seen.values());

    // Feed interpolation engine with new positions
    updateStates(allAircraft, Date.now());

    const airborne = allAircraft.filter((a) => !a.on_ground).length;
    const ground = allAircraft.length - airborne;
    updateAircraftCount(allAircraft.length, airborne, ground);
    updateTopOrigins(allAircraft);
    updateSearchData(allAircraft);
    pulseHeartbeat();

    // Push to map ONCE per fetch
    pushToMap(allAircraft);

    // Record VIP/private landings (airborne -> on_ground transition)
    updateLandingsFromAircraft(map, allAircraft);

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

    // Ambience data blip on successful fetch
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

// Lightweight interpolation tick — only updates aircraft positions on the map
// Skips trails, HUD, panel updates for speed. Runs at 100ms for near-live feel.
function interpolationTick() {
  if (fetchInProgress || allAircraft.length === 0) return;

  const interpolated = getInterpolatedPositions(Date.now());
  if (interpolated.length === 0) return;

  const ghosts = getGhostAircraft();
  let combined = [...interpolated, ...ghosts];
  combined = applyFilters(combined);

  if (combined.length > MAX_AIRCRAFT) {
    const airborne = combined.filter(a => !a.on_ground && !a.isGhost);
    const ground = combined.filter(a => a.on_ground);
    const special = combined.filter(a => a.isGhost);
    combined = [...special, ...airborne.slice(0, MAX_AIRCRAFT - special.length)];
    if (combined.length < MAX_AIRCRAFT) {
      combined.push(...ground.slice(0, MAX_AIRCRAFT - combined.length));
    }
  }

  // Only update aircraft source — no trails, no HUD, no panel
  const source = map.getSource('aircraft');
  if (source) {
    source.setData(toGeoJSON(combined));
  }

  // Keep follow mode responsive
  const selectedIcao = getSelectedIcao();
  if (selectedIcao && isFollowing()) {
    const selected = combined.find(a => a.icao24 === selectedIcao);
    if (selected && selected.longitude != null) {
      map.easeTo({ center: [selected.longitude, selected.latitude], duration: 100 });
    }
  }
}

function setupInteraction() {
  // Click on aircraft
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
      dbFlags: props.dbFlags,
    };

    // INTERCEPT mode — check target before opening panel
    if (isInterceptActive()) {
      checkInterceptTarget(aircraft);
    }

    showPanel(aircraft);
  });

  // Click on cluster to zoom
  map.on('click', 'aircraft-clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['aircraft-clusters'] });
    const clusterId = features[0].properties.cluster_id;
    map.getSource('aircraft').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      map.easeTo({ center: features[0].geometry.coordinates, zoom });
    });
  });

  // Hover tooltip
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

  // Cluster cursor
  map.on('mouseenter', 'aircraft-clusters', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'aircraft-clusters', () => {
    map.getCanvas().style.cursor = '';
  });

  // Click on empty space closes panel
  map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['aircraft-icons', 'aircraft-clusters'] });
    if (features.length === 0 && getSelectedIcao()) {
      hidePanel();
    }
  });

  // Click landing markers for quick context (no panel)
  map.on('click', 'landings-dots', (e) => {
    if (!e.features || !e.features.length) return;
    const p = e.features[0].properties || {};
    const when = p.landedAt ? new Date(Number(p.landedAt)).toLocaleString() : '';
    const where = p.nearestIcao ? `${p.nearestIcao}${p.nearestName ? ' · ' + p.nearestName : ''}` : '';
    const title = p.kind === 'vip' ? (p.label || 'VIP') : (p.registration || 'Private');
    const lines = [
      title,
      p.callsign ? `Callsign: ${p.callsign}` : '',
      p.aircraft_type ? `Type: ${p.aircraft_type}` : '',
      where ? `Near: ${where}` : '',
      when ? `Landed: ${when}` : '',
    ].filter(Boolean);
    new maplibregl.Popup({ closeButton: true, closeOnClick: true })
      .setLngLat(e.lngLat)
      .setHTML(`<div style="font-family: JetBrains Mono, monospace; font-size: 11px; color: #00ff88;">${lines.map(l => `<div>${String(l).replace(/</g,'&lt;')}</div>`).join('')}</div>`)
      .addTo(map);
  });

  map.on('mouseenter', 'landings-dots', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'landings-dots', () => { map.getCanvas().style.cursor = ''; });

  // Click warzones for label
  map.on('click', 'warzones-fill', (e) => {
    if (!e.features || !e.features.length) return;
    const p = e.features[0].properties || {};
    new maplibregl.Popup({ closeButton: true, closeOnClick: true })
      .setLngLat(e.lngLat)
      .setText(p.name || 'Conflict Zone')
      .addTo(map);
  });
  map.on('mouseenter', 'warzones-fill', () => { map.getCanvas().style.cursor = 'help'; });
  map.on('mouseleave', 'warzones-fill', () => { map.getCanvas().style.cursor = ''; });
}

function handleFilterDisplayOptions() {
  const groundCheck = document.getElementById('filter-ground');
  const trailsCheck = document.getElementById('filter-trails');

  if (groundCheck) {
    groundCheck.addEventListener('change', () => {
      showGround = groundCheck.checked;
      pushToMap(allAircraft); // Re-render with new filter
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

  // TCAS on/off toggle
  const tcasCheck = document.getElementById('tcas-enabled');
  const tcasToggleText = tcasCheck ? tcasCheck.parentElement.querySelector('.tcas-toggle-text') : null;
  if (tcasCheck) {
    tcasCheck.addEventListener('change', () => {
      tcasEnabled = tcasCheck.checked;
      if (tcasToggleText) tcasToggleText.textContent = tcasEnabled ? 'ON' : 'OFF';
      // Clear TCAS visuals immediately when disabled
      if (!tcasEnabled) {
        const src = map.getSource('tcas-alerts');
        if (src) src.setData({ type: 'FeatureCollection', features: [] });
        updateTcasPanel([], null);
      }
    });
  }
}

async function init() {
  map = createMap();

  initHUD(map);
  initUnits();

  initDetailPanel(
    () => { /* panel closed */ },
    (coords) => {
      map.easeTo({ center: coords, duration: 800 });
    }
  );

  initFilters(() => {
    // Re-render when altitude filters change
    pushToMap(allAircraft);
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

  // Register VIP hex codes for global scanning
  setVipHexes(Array.from(VIP_AIRCRAFT.keys()));

  map.on('load', async () => {
    console.log('[GhostTrack] Map loaded, setting up layers...');
    await setupLayers();
    console.log('[GhostTrack] Layers ready');

    // Premium features — init after layers
    initTerminator(map);
    initRouteArc(map);
    initPOI(map);
    initWarzones(map);
    initLandings(map);
    toggleWarzones(map, showWarzones);

    setupInteraction();
    handleFilterDisplayOptions();
    setupCollapsiblePanels();

    // Theater mode — cinematic auto-tour
    initTheater(map, () => allAircraft, (ac) => {
      showPanel(ac);
    });

    // Initial fetch
    await fetchAndUpdate();

    // Re-fetch when user pans or zooms (debounced)
    let moveTimer = null;
    map.on('moveend', () => {
      if (moveTimer) clearTimeout(moveTimer);
      moveTimer = setTimeout(fetchAndUpdate, 800);
    });

    // Periodic polling
    setInterval(fetchAndUpdate, FETCH_INTERVAL);

    // Interpolation — near-live smooth movement (100ms tick, lightweight path)
    setInterval(interpolationTick, 100);

    // Ghost position update — slow timer, re-pushes only when ghost exists
    setInterval(() => {
      const ghosts = getGhostAircraft();
      if (ghosts.length > 0) {
        updateGhostPosition(3000);
      }
    }, 3000);
  });
}

init();
