// THEATER MODE — Cinematic auto-tour of interesting aircraft
// Cycles through VIPs, military, anomalies, and random aircraft
// with smooth fly-to animations and a cinematic overlay.

import { getVipInfo } from './vip-registry.js';

let active = false;
let timer = null;
let currentIndex = 0;
let targets = [];
let getAircraftFn = null;
let onSelectFn = null;
let mapRef = null;

const DWELL_MS = 12000;  // Time at each aircraft before moving on
const FLY_DURATION = 3000;

// DOM elements (created on first init)
let overlay = null;
let letterTop = null;
let letterBot = null;
let infoBox = null;
let infoCallsign = null;
let infoDetail = null;
let infoSub = null;
let theaterBtn = null;

function createDOM() {
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.id = 'theater-overlay';
  overlay.className = 'theater-overlay hidden';

  letterTop = document.createElement('div');
  letterTop.className = 'theater-letter theater-letter-top';
  letterBot = document.createElement('div');
  letterBot.className = 'theater-letter theater-letter-bot';

  infoBox = document.createElement('div');
  infoBox.className = 'theater-info';

  infoCallsign = document.createElement('div');
  infoCallsign.className = 'theater-callsign';

  infoDetail = document.createElement('div');
  infoDetail.className = 'theater-detail';

  infoSub = document.createElement('div');
  infoSub.className = 'theater-sub';

  infoBox.appendChild(infoCallsign);
  infoBox.appendChild(infoDetail);
  infoBox.appendChild(infoSub);

  const exitHint = document.createElement('div');
  exitHint.className = 'theater-exit-hint';
  exitHint.textContent = 'CLICK ANYWHERE TO EXIT';

  overlay.appendChild(letterTop);
  overlay.appendChild(letterBot);
  overlay.appendChild(infoBox);
  overlay.appendChild(exitHint);

  overlay.addEventListener('click', () => stop());
  document.body.appendChild(overlay);
}

function buildTargetList() {
  const aircraft = getAircraftFn ? getAircraftFn() : [];
  if (aircraft.length === 0) return [];

  const scored = [];

  for (const ac of aircraft) {
    if (ac.isGhost) continue;
    if (ac.latitude == null || ac.longitude == null) continue;

    let score = 0;
    let label = '';
    let detail = '';

    // VIP — highest priority
    const vip = getVipInfo(ac.icao24);
    if (vip) {
      score = 100;
      label = vip.owner;
      detail = vip.aircraft;
    }
    // Emergency
    else if (ac.squawk === '7500' || ac.squawk === '7600' || ac.squawk === '7700') {
      score = 90;
      label = ac.callsign || ac.icao24;
      const codes = { '7500': 'HIJACK', '7600': 'COMMS FAILURE', '7700': 'EMERGENCY' };
      detail = `SQUAWK ${ac.squawk} — ${codes[ac.squawk]}`;
    }
    // Military
    else if ((ac.dbFlags & 1) !== 0) {
      score = 50 + Math.random() * 10;
      label = ac.callsign || ac.aircraft_type || ac.icao24;
      detail = 'MILITARY';
    }
    // High altitude or fast
    else if (ac.altitude_ft > 45000 || ac.speed_kts > 600) {
      score = 30 + Math.random() * 10;
      label = ac.callsign || ac.icao24;
      const parts = [];
      if (ac.altitude_ft > 45000) parts.push(`FL${Math.round(ac.altitude_ft / 100)}`);
      if (ac.speed_kts > 600) parts.push(`${ac.speed_kts} KTS`);
      detail = parts.join(' · ');
    }
    // Random airborne aircraft
    else if (!ac.on_ground && ac.callsign) {
      score = Math.random() * 15;
      label = ac.callsign;
      const alt = ac.altitude_ft ? `${(ac.altitude_ft / 1000).toFixed(0)}K FT` : '';
      const spd = ac.speed_kts ? `${ac.speed_kts} KTS` : '';
      detail = [alt, spd].filter(Boolean).join(' · ');
    }

    if (score > 0) {
      let sub = '';
      if (ac.origin_country) sub = ac.origin_country;
      if (ac.registration) sub += (sub ? ' · ' : '') + ac.registration;
      scored.push({ icao24: ac.icao24, score, label, detail, sub });
    }
  }

  // Sort by score descending, take top 20
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 20);
}

function getLiveAircraftByIcao(icao24) {
  if (!icao24 || !getAircraftFn) return null;
  const aircraft = getAircraftFn();
  if (!aircraft || aircraft.length === 0) return null;
  return aircraft.find((ac) =>
    ac &&
    ac.icao24 === icao24 &&
    !ac.isGhost &&
    ac.latitude != null &&
    ac.longitude != null
  ) || null;
}

function flyToNext() {
  if (!active) return;

  // Rebuild target list periodically to pick up new data
  if (currentIndex === 0 || currentIndex >= targets.length) {
    targets = buildTargetList();
    currentIndex = 0;
  }

  if (targets.length === 0) {
    // Nothing to show — wait and retry
    timer = setTimeout(flyToNext, 3000);
    return;
  }

  let target = null;
  let liveAircraft = null;
  const checked = targets.length;
  for (let i = 0; i < checked; i++) {
    const candidate = targets[currentIndex];
    currentIndex = (currentIndex + 1) % targets.length;
    const live = getLiveAircraftByIcao(candidate.icao24);
    if (live) {
      target = candidate;
      liveAircraft = live;
      break;
    }
  }

  if (!target || !liveAircraft) {
    targets = [];
    timer = setTimeout(flyToNext, 2000);
    return;
  }

  // Update info overlay
  infoCallsign.textContent = target.label;
  infoDetail.textContent = target.detail;
  infoSub.textContent = target.sub;

  // Animate info in
  infoBox.classList.remove('theater-info-in');
  void infoBox.offsetHeight;
  infoBox.classList.add('theater-info-in');

  // Fly to the aircraft
  const zoom = target.score >= 50 ? 8 : 6;
  mapRef.flyTo({
    center: [liveAircraft.longitude, liveAircraft.latitude],
    zoom: Math.max(mapRef.getZoom(), zoom),
    duration: FLY_DURATION,
    essential: true,
  });

  // Select the aircraft in the detail panel
  if (onSelectFn) onSelectFn(liveAircraft);

  timer = setTimeout(flyToNext, DWELL_MS);
}

export function start() {
  if (active) return;
  active = true;
  currentIndex = 0;
  targets = [];

  createDOM();
  overlay.classList.remove('hidden');
  if (theaterBtn) theaterBtn.classList.add('active');

  // Start cycling after a brief intro pause
  timer = setTimeout(flyToNext, 1500);
}

export function stop() {
  active = false;
  if (timer) { clearTimeout(timer); timer = null; }
  if (overlay) overlay.classList.add('hidden');
  if (theaterBtn) theaterBtn.classList.remove('active');
}

export function isTheaterActive() { return active; }

export function initTheater(map, getAircraft, onSelect) {
  mapRef = map;
  getAircraftFn = getAircraft;
  onSelectFn = onSelect;

  theaterBtn = document.getElementById('theater-toggle');
  if (theaterBtn) {
    theaterBtn.addEventListener('click', () => {
      if (active) stop(); else start();
    });
  }

  // ESC to exit
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && active) stop();
  });
}
