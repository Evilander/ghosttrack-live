import { formatSpeed, formatAltitude, formatVerticalRate, formatHeading } from './units.js';
import { initSatelliteView, updateSatelliteView, destroySatelliteView } from './satellite.js';
import { showRouteArc, clearRouteArc } from './route-arc.js';

const panel = document.getElementById('detail-panel');
const closeBtn = document.getElementById('detail-close');
const btnGoogleEarth = document.getElementById('btn-google-earth');
const btnFollow = document.getElementById('btn-follow');

const els = {
  callsign: document.getElementById('detail-callsign'),
  status: document.getElementById('detail-status'),
  origin: document.getElementById('detail-origin'),
  altitude: document.getElementById('detail-altitude'),
  speed: document.getElementById('detail-speed'),
  heading: document.getElementById('detail-heading'),
  vrate: document.getElementById('detail-vrate'),
  icao: document.getElementById('detail-icao'),
  route: document.getElementById('detail-route'),
  routeCell: document.getElementById('detail-route-cell'),
  airline: document.getElementById('detail-airline'),
  airlineCell: document.getElementById('detail-airline-cell'),
  aircraft: document.getElementById('detail-aircraft'),
  aircraftCell: document.getElementById('detail-aircraft-cell'),
  photoContainer: document.getElementById('detail-photo-container'),
  photo: document.getElementById('detail-photo'),
  photoCredit: document.getElementById('detail-photo-credit'),
  // ATC audio
  atcSection: document.getElementById('atc-section'),
  atcAirportTabs: document.getElementById('atc-airport-tabs'),
  atcFeedsContainer: document.getElementById('atc-feeds'),
  atcAudio: document.getElementById('atc-audio'),
  atcStatusText: document.getElementById('atc-status-text'),
  atcVisualizer: document.getElementById('atc-visualizer'),
  atcVolume: document.getElementById('atc-volume'),
};

// Enrichment cache — keyed by icao24
const enrichmentCache = new Map();

let selectedIcao = null;
let selectedCoords = null;
let followMode = false;
let onCloseCallback = null;
let onFollowCallback = null;
let satelliteInitialized = false;
let atcActiveFeed = null; // currently playing feed name
let atcActiveAirport = null; // currently selected airport tab
let atcAudioCtx = null;
let atcAnalyser = null;
let atcSource = null;
let atcVisRAF = null;
let staticNode = null;
let staticGain = null;
const atcFeedCache = new Map(); // icao -> { feeds, ts }

// ---- ATC Audio Player ----

function atcSetStatus(text, cls) {
  els.atcStatusText.textContent = text;
  els.atcStatusText.className = 'atc-status-text' + (cls ? ' ' + cls : '');
}

function atcConnect(feedName, btn) {
  if (atcActiveFeed === feedName) {
    atcDisconnect();
    return;
  }

  atcDisconnect();
  atcActiveFeed = feedName;

  // Mark all feed buttons inactive, then activate this one
  els.atcFeedsContainer.querySelectorAll('.atc-feed-btn').forEach(b => b.classList.remove('active', 'error'));
  btn.classList.add('active');
  atcSetStatus('CONNECTING...', 'connecting');

  els.atcAudio.src = '/liveatc/' + feedName;
  els.atcAudio.load();
  els.atcAudio.play().catch(() => {
    atcSetStatus('STREAM UNAVAILABLE', 'error');
    btn.classList.remove('active');
    btn.classList.add('error');
    atcActiveFeed = null;
    stopVisualizer();
  });
}

function atcDisconnect() {
  atcActiveFeed = null;
  els.atcAudio.pause();
  els.atcAudio.removeAttribute('src');
  els.atcAudio.load();
  els.atcFeedsContainer.querySelectorAll('.atc-feed-btn').forEach(b => b.classList.remove('active', 'error'));
  stopVisualizer();
  atcSetStatus(atcActiveAirport ? 'SELECT FEED' : 'SELECT AIRPORT', '');
}

// ---- Audio Visualizer (Web Audio API) ----

function ensureAudioContext() {
  if (atcAudioCtx) return;
  atcAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  atcAnalyser = atcAudioCtx.createAnalyser();
  atcAnalyser.fftSize = 128;
  atcAnalyser.smoothingTimeConstant = 0.5;
  atcSource = atcAudioCtx.createMediaElementSource(els.atcAudio);

  const bufferSize = atcAudioCtx.sampleRate * 2;
  const noiseBuffer = atcAudioCtx.createBuffer(1, bufferSize, atcAudioCtx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) { noiseData[i] = (Math.random() * 2 - 1) * 0.1; }

  staticNode = atcAudioCtx.createBufferSource();
  staticNode.buffer = noiseBuffer;
  staticNode.loop = true;

  staticGain = atcAudioCtx.createGain();
  staticGain.gain.value = 0.15;

  atcSource.connect(atcAnalyser);
  staticNode.connect(staticGain);
  staticGain.connect(atcAnalyser);
  atcAnalyser.connect(atcAudioCtx.destination);
  staticNode.start();
}

function startVisualizer() {
  if (!atcAnalyser) return;
  const canvas = els.atcVisualizer;
  const ctx = canvas.getContext('2d');
  const bufLen = atcAnalyser.frequencyBinCount;
  const dataArr = new Uint8Array(bufLen);

  function draw() {
    atcVisRAF = requestAnimationFrame(draw);
    atcAnalyser.getByteFrequencyData(dataArr);

    ctx.fillStyle = 'rgba(0, 5, 10, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00ffcc';
    ctx.beginPath();

    const sliceWidth = canvas.width / bufLen;
    let x = 0;

    for (let i = 0; i < bufLen; i++) {
      const v = dataArr[i] / 128.0;
      const y = v * canvas.height / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 204, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
  }

  draw();
}

function stopVisualizer() {
  if (atcVisRAF) {
    cancelAnimationFrame(atcVisRAF);
    atcVisRAF = null;
  }
  const canvas = els.atcVisualizer;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(0,255,204,0.15)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
}

// ---- Feed Discovery ----

async function discoverFeedsForAirport(icao) {
  const cached = atcFeedCache.get(icao);
  if (cached && Date.now() - cached.ts < 600000) return cached.feeds;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000); // 12s max
  try {
    const res = await fetch(`/liveatc-feeds/${icao}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const json = await res.json();
    const feeds = json.feeds || [];
    atcFeedCache.set(icao, { feeds, ts: Date.now() });
    return feeds;
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

function renderAirportTabs(airports) {
  els.atcAirportTabs.innerHTML = '';
  airports.forEach(({ icao, iata, label }) => {
    const tab = document.createElement('button');
    tab.className = 'atc-airport-tab';
    tab.dataset.icao = icao;
    tab.innerHTML = `<span class="atc-tab-icao">${icao}</span>` +
      (iata ? `<span class="atc-tab-iata">${iata}</span>` : '') +
      `<span class="atc-tab-label">${label}</span>`;
    tab.addEventListener('click', () => selectAirport(icao));
    els.atcAirportTabs.appendChild(tab);
  });
}

// Default feed types shown when probing fails or as initial state
const DEFAULT_FEED_TYPES = [
  { suffix: '_twr', label: 'TWR', desc: 'Tower' },
  { suffix: '_app', label: 'APP', desc: 'Approach' },
  { suffix: '_gnd', label: 'GND', desc: 'Ground' },
  { suffix: '_del', label: 'DEL', desc: 'Delivery' },
  { suffix: '_dep', label: 'DEP', desc: 'Departure' },
  { suffix: '_atis', label: 'ATIS', desc: 'ATIS' },
  { suffix: '_ctr', label: 'CTR', desc: 'Center' },
];

function renderFeedButtons(feeds) {
  els.atcFeedsContainer.innerHTML = '';
  feeds.forEach(({ feed, label, desc }) => {
    const btn = document.createElement('button');
    btn.className = 'atc-feed-btn';
    btn.dataset.feed = feed;
    btn.innerHTML =
      `<span class="atc-indicator"></span>` +
      `<span class="atc-feed-label">${label}</span>` +
      `<span class="atc-feed-desc">${desc}</span>`;
    btn.addEventListener('click', () => atcConnect(feed, btn));
    els.atcFeedsContainer.appendChild(btn);
  });
}

async function selectAirport(icao) {
  atcDisconnect();
  atcActiveAirport = icao;

  // Highlight active tab
  els.atcAirportTabs.querySelectorAll('.atc-airport-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.icao === icao);
  });

  // Show scanning state
  els.atcFeedsContainer.innerHTML = '<div class="atc-scanning">SCANNING FREQUENCIES...</div>';
  atcSetStatus('PROBING ' + icao + '...', 'connecting');

  let feeds;
  try {
    feeds = await discoverFeedsForAirport(icao);
  } catch {
    feeds = [];
  }

  // Verify we're still on the same airport
  if (atcActiveAirport !== icao) return;

  if (feeds.length > 0) {
    // Show discovered feeds
    renderFeedButtons(feeds);
    atcSetStatus('SELECT FEED · ' + feeds.length + ' FOUND', '');
  } else {
    // No feeds found — show clear explanation + optional fallback
    els.atcFeedsContainer.innerHTML = '';
    const noFeed = document.createElement('div');
    noFeed.className = 'atc-no-coverage';
    noFeed.innerHTML =
      '<div class="atc-no-coverage-title">NO COVERAGE</div>' +
      '<div class="atc-no-coverage-text">LiveATC has no feeds for ' + icao +
      '. Many countries restrict ATC audio broadcasting. Coverage is strongest in the US and select international hubs.</div>';
    els.atcFeedsContainer.appendChild(noFeed);

    // Manual feed entry for international/edge cases
    const manual = document.createElement('div');
    manual.className = 'atc-manual';
    manual.innerHTML =
      '<div class="atc-manual-title">MANUAL FEED</div>' +
      '<div class="atc-manual-row">' +
      '<input class="atc-manual-input" type="text" spellcheck="false" placeholder="e.g. kjfk_twr or egll_app" />' +
      '<button class="atc-manual-btn">CONNECT</button>' +
      '</div>' +
      '<div class="atc-manual-hint">Enter a LiveATC feed name (airport + suffix). This is useful outside common suffix patterns.</div>';
    const input = manual.querySelector('.atc-manual-input');
    const btn = manual.querySelector('.atc-manual-btn');
    btn.addEventListener('click', () => {
      const v = (input.value || '').trim().toLowerCase();
      if (!v) return;
      // Render a single button so the rest of the UI behaves consistently
      renderFeedButtons([{ feed: v, label: 'MANUAL', desc: v }]);
      const b = els.atcFeedsContainer.querySelector('.atc-feed-btn');
      if (b) atcConnect(v, b);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
    els.atcFeedsContainer.appendChild(manual);

    // "Try anyway" row for power users
    const tryRow = document.createElement('div');
    tryRow.className = 'atc-try-anyway';
    const tryBtn = document.createElement('button');
    tryBtn.className = 'atc-try-btn';
    tryBtn.textContent = 'TRY FEEDS ANYWAY';
    tryBtn.addEventListener('click', () => {
      const base = icao.toLowerCase();
      const fallbackFeeds = DEFAULT_FEED_TYPES.map(({ suffix, label, desc }) => ({
        feed: base + suffix, label, desc,
      }));
      renderFeedButtons(fallbackFeeds);
      atcSetStatus('SELECT FEED · TAP TO TEST', '');
    });
    tryRow.appendChild(tryBtn);
    els.atcFeedsContainer.appendChild(tryRow);

    atcSetStatus('NO FEEDS AVAILABLE', 'error');
  }
}

function showAtcFeeds(data) {
  const airports = [];
  if (data.originIcao && data.originIcao.length >= 3) {
    airports.push({ icao: data.originIcao, iata: data.originIata, label: 'ORIGIN' });
  }
  if (data.destIcao && data.destIcao.length >= 3) {
    airports.push({ icao: data.destIcao, iata: data.destIata, label: 'DEST' });
  }

  if (airports.length === 0) {
    els.atcSection.style.display = 'none';
    return;
  }

  atcDisconnect();
  atcActiveAirport = null;
  els.atcFeedsContainer.innerHTML = '';
  renderAirportTabs(airports);
  els.atcSection.style.display = '';
  atcSetStatus('SELECT AIRPORT', '');
  stopVisualizer(); // draw idle line
}

function initAtcPlayer() {
  els.atcAudio.addEventListener('playing', () => {
    atcSetStatus('UPLINK ESTABLISHED · ' + (atcActiveFeed || '').toUpperCase(), 'live');
    if (staticGain) staticGain.gain.value = 0;
    try {
      ensureAudioContext();
      if (atcAudioCtx.state === 'suspended') atcAudioCtx.resume();
      startVisualizer();
    } catch {
      // Web Audio not available — still plays audio
    }
  });

  els.atcAudio.addEventListener('waiting', () => {
    atcSetStatus('BUFFERING...', 'connecting');
    if (staticGain) staticGain.gain.value = 0.1;
  });

  els.atcAudio.addEventListener('error', () => {
    const activeBtn = atcActiveFeed
      ? els.atcFeedsContainer.querySelector(`[data-feed="${atcActiveFeed}"]`)
      : null;
    if (activeBtn) {
      activeBtn.classList.remove('active');
      activeBtn.classList.add('error');
    }
    atcSetStatus('SIGNAL LOST - SEARCHING FREQUENCY', 'error');
    if (staticGain) staticGain.gain.value = 0.15;
    try { ensureAudioContext(); startVisualizer(); } catch {}
    atcActiveFeed = null;
  });

  els.atcAudio.addEventListener('stalled', () => {
    if (atcActiveFeed) atcSetStatus('SIGNAL WEAK...', 'connecting');
  });

  els.atcAudio.volume = 0.7;
  els.atcVolume.addEventListener('input', (e) => {
    els.atcAudio.volume = e.target.value / 100;
  });

  stopVisualizer(); // draw idle line
}

export function initDetailPanel(onClose, onFollow) {
  onCloseCallback = onClose;
  onFollowCallback = onFollow;

  closeBtn.addEventListener('click', hidePanel);

  btnGoogleEarth.addEventListener('click', () => {
    if (!selectedCoords) return;
    const [lon, lat] = selectedCoords;
    const url = `https://earth.google.com/web/@${lat},${lon},10000a,5000d,35y,0h,0t,0r`;
    window.open(url, '_blank');
  });

  btnFollow.addEventListener('click', () => {
    followMode = !followMode;
    btnFollow.classList.toggle('active', followMode);
    btnFollow.textContent = followMode ? 'FOLLOWING...' : 'FOLLOW AIRCRAFT';
    if (followMode && onFollowCallback && selectedCoords) {
      onFollowCallback(selectedCoords);
    }
  });

  initAtcPlayer();
}

async function enrichAircraft(icao, callsign) {
  if (enrichmentCache.has(icao)) {
    applyEnrichment(enrichmentCache.get(icao));
    return;
  }

  // Reset enrichment fields while loading
  resetEnrichmentFields();

  const data = {};

  // Fetch aircraft info and callsign/route in parallel
  const promises = [];

  if (icao) {
    promises.push(
      fetch(`/adsbdb-api/v0/aircraft/${icao}`)
        .then(r => r.ok ? r.json() : null)
        .then(json => {
          if (json && json.response && json.response.aircraft) {
            const ac = json.response.aircraft;
            data.manufacturer = ac.manufacturer || '';
            data.acType = ac.type || '';
            data.owner = ac.registered_owner || '';
            data.registration = ac.registration || '';
            if (ac.url_photo) data.photoUrl = ac.url_photo;
            if (ac.url_photo_thumbnail) data.photoThumb = ac.url_photo_thumbnail;
          }
        })
        .catch(() => {})
    );
  }

  if (callsign && callsign.trim()) {
    promises.push(
      fetch(`/adsbdb-api/v0/callsign/${callsign.trim()}`)
        .then(r => r.ok ? r.json() : null)
        .then(json => {
          if (json && json.response && json.response.flightroute) {
            const fr = json.response.flightroute;
            if (fr.origin) {
              data.originIata = fr.origin.iata_code || '';
              data.originIcao = fr.origin.icao_code || '';
              data.originName = fr.origin.name || '';
              data.originCity = fr.origin.municipality || '';
            }
            if (fr.destination) {
              data.destIata = fr.destination.iata_code || '';
              data.destIcao = fr.destination.icao_code || '';
              data.destName = fr.destination.name || '';
              data.destCity = fr.destination.municipality || '';
            }
            if (fr.airline) {
              data.airlineName = fr.airline.name || '';
              data.airlineIata = fr.airline.iata || '';
            }
            if (fr.callsign_iata) data.iataFlight = fr.callsign_iata;
          }
        })
        .catch(() => {})
    );
  }

  await Promise.all(promises);

  // Cache and apply
  enrichmentCache.set(icao, data);
  // Only apply if still viewing the same aircraft
  if (selectedIcao === icao) {
    applyEnrichment(data);
  }
}

function resetEnrichmentFields() {
  els.routeCell.style.display = 'none';
  els.airlineCell.style.display = 'none';
  els.aircraftCell.style.display = 'none';
  els.photoContainer.style.display = 'none';
  els.atcSection.style.display = 'none';
  atcDisconnect();
}

function applyEnrichment(data) {
  // Route
  if (data.originIata && data.destIata) {
    els.route.innerHTML =
      `<span>${data.originIata}</span><span class="route-arrow">&#9654;</span><span>${data.destIata}</span>`;
    els.route.classList.add('route-value');
    els.routeCell.style.display = '';
    // Update route cell tooltip via title
    const tooltip = [data.originName, data.destName].filter(Boolean).join(' → ');
    els.routeCell.title = tooltip;

    // Show great circle route arc on map
    if (data.originIcao && data.destIcao) {
      showRouteArc(data.originIcao, data.destIcao);
    }
  } else {
    els.routeCell.style.display = 'none';
    clearRouteArc();
  }

  // Airline
  if (data.airlineName) {
    const iataTag = data.airlineIata ? ` (${data.airlineIata})` : '';
    const flightTag = data.iataFlight ? ` · ${data.iataFlight}` : '';
    els.airline.textContent = data.airlineName + iataTag + flightTag;
    els.airlineCell.style.display = '';
  } else {
    els.airlineCell.style.display = 'none';
  }

  // Aircraft type + manufacturer
  if (data.manufacturer || data.acType) {
    els.aircraft.textContent = [data.manufacturer, data.acType].filter(Boolean).join(' ');
    els.aircraftCell.style.display = '';
  } else {
    els.aircraftCell.style.display = 'none';
  }

  // ATC audio feeds
  showAtcFeeds(data);

  // Photo
  const photoUrl = data.photoThumb || data.photoUrl;
  if (photoUrl) {
    els.photo.src = photoUrl;
    els.photo.onload = () => { els.photoContainer.style.display = ''; };
    els.photo.onerror = () => { els.photoContainer.style.display = 'none'; };
    if (data.owner) {
      els.photoCredit.textContent = `Owner: ${data.owner}`;
    } else {
      els.photoCredit.textContent = '';
    }
  } else {
    els.photoContainer.style.display = 'none';
  }
}

export function showPanel(aircraft) {
  selectedIcao = aircraft.icao24;
  followMode = false;
  btnFollow.classList.remove('active');
  btnFollow.textContent = 'FOLLOW AIRCRAFT';
  updatePanel(aircraft);
  panel.classList.remove('hidden');

  // Fetch enrichment data
  if (!aircraft.isGhost) {
    enrichAircraft(aircraft.icao24, aircraft.callsign);
  } else {
    resetEnrichmentFields();
  }

  // Initialize satellite view on first open
  if (!satelliteInitialized) {
    setTimeout(() => {
      initSatelliteView();
      satelliteInitialized = true;
      if (selectedCoords) {
        updateSatelliteView(selectedCoords[0], selectedCoords[1]);
      }
    }, 100);
  }
}

export function hidePanel() {
  panel.classList.add('hidden');
  selectedIcao = null;
  selectedCoords = null;
  followMode = false;
  btnFollow.classList.remove('active');
  btnFollow.textContent = 'FOLLOW AIRCRAFT';
  atcDisconnect();
  clearRouteArc();
  destroySatelliteView();
  satelliteInitialized = false;
  if (onCloseCallback) onCloseCallback();
}

export function getSelectedIcao() {
  return selectedIcao;
}

export function isFollowing() {
  return followMode;
}

export function updatePanel(aircraft) {
  if (!aircraft || aircraft.icao24 !== selectedIcao) return;

  // Track coordinates for satellite view and Google Earth
  if (aircraft.longitude != null && aircraft.latitude != null) {
    selectedCoords = [aircraft.longitude, aircraft.latitude];
  }

  // Ghost aircraft special display
  if (aircraft.isGhost) {
    els.callsign.textContent = aircraft.callsign;
    els.callsign.style.color = '#ff4444';
    els.status.textContent = 'CLASSIFIED';
    els.status.style.color = '#ff4444';
    els.origin.textContent = 'UNKNOWN';
    els.altitude.textContent = '░░░░░';
    els.speed.textContent = '░░░░░';
    els.heading.textContent = '░░░░░';
    els.vrate.textContent = '░░░░░';
    els.icao.textContent = '░░░░░░';
    return;
  }

  els.callsign.textContent = aircraft.callsign || aircraft.icao24;
  els.callsign.style.color = '#FFA500';
  els.status.textContent = aircraft.on_ground ? 'ON GROUND' : 'AIRBORNE';
  els.status.style.color = aircraft.on_ground ? '#FFA500' : '#00ff88';
  els.origin.textContent = aircraft.origin_country || '---';

  if (aircraft.altitude_ft != null) {
    const arrow = aircraft.vertical_rate > 1 ? ' ↑' : aircraft.vertical_rate < -1 ? ' ↓' : '';
    els.altitude.textContent = formatAltitude(aircraft.altitude_ft) + arrow;
  } else {
    els.altitude.textContent = aircraft.on_ground ? 'GND' : '---';
  }

  els.speed.textContent = formatSpeed(aircraft.speed_kts);
  els.heading.textContent = formatHeading(aircraft.heading != null ? aircraft.heading : aircraft.true_track);

  // Use ft/min directly if available (adsb.lol), otherwise convert
  if (aircraft.vertical_rate_fpm != null) {
    const fpm = Math.round(aircraft.vertical_rate_fpm);
    els.vrate.textContent = `${fpm > 0 ? '+' : ''}${fpm.toLocaleString()} ft/min`;
  } else {
    els.vrate.textContent = formatVerticalRate(aircraft.vertical_rate);
  }

  // Show registration + type if available
  const regType = [aircraft.registration, aircraft.aircraft_type].filter(Boolean).join(' · ');
  els.icao.textContent = regType || aircraft.icao24;

  // Update satellite view
  if (satelliteInitialized && selectedCoords) {
    updateSatelliteView(selectedCoords[0], selectedCoords[1]);
  }

  // Trigger follow if active
  if (followMode && onFollowCallback && selectedCoords) {
    onFollowCallback(selectedCoords);
  }
}
