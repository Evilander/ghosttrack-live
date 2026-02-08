// VIP/Private landing recorder + overlay.
// Records the last "airborne -> on_ground" transition per aircraft (localStorage persisted).

import { getVipInfo } from './vip-registry.js';
import { isPrivateJetType } from './anomaly.js';
import { getNearestAirport } from './airports.js';

const STORAGE_KEY = 'ghosttrack_landings_v1';

let records = new Map(); // icao24 -> record
let prevOnGround = new Map(); // icao24 -> boolean
let dirty = false;

function safeParse(json) {
  try { return JSON.parse(json); } catch { return null; }
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const parsed = safeParse(raw);
  if (!parsed || !Array.isArray(parsed)) return;
  records = new Map(parsed.map((r) => [r.icao24, r]).filter(([k]) => !!k));
}

function save() {
  if (!dirty) return;
  dirty = false;
  const arr = Array.from(records.values())
    .sort((a, b) => (b.landedAt || 0) - (a.landedAt || 0))
    .slice(0, 500);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function classify(ac) {
  const vip = getVipInfo(ac.icao24);
  if (vip) return { kind: 'vip', label: vip.owner };
  if (ac.aircraft_type && isPrivateJetType(ac.aircraft_type)) return { kind: 'private', label: 'Private' };
  return null;
}

function recordLanding(ac) {
  const cls = classify(ac);
  if (!cls) return;
  if (ac.latitude == null || ac.longitude == null) return;

  const nearest = getNearestAirport(ac.latitude, ac.longitude);
  const rec = {
    icao24: ac.icao24,
    kind: cls.kind,
    label: cls.label,
    callsign: ac.callsign || '',
    registration: ac.registration || '',
    aircraft_type: ac.aircraft_type || '',
    landedAt: Date.now(),
    lat: ac.latitude,
    lon: ac.longitude,
    nearestIcao: nearest ? nearest.icao : '',
    nearestName: nearest ? nearest.name : '',
  };

  records.set(ac.icao24, rec);
  dirty = true;
}

function toGeoJSON() {
  const features = Array.from(records.values())
    .sort((a, b) => (b.landedAt || 0) - (a.landedAt || 0))
    .slice(0, 250)
    .map((r) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.lon, r.lat] },
      properties: {
        icao24: r.icao24,
        kind: r.kind,
        label: r.label,
        callsign: r.callsign,
        registration: r.registration,
        aircraft_type: r.aircraft_type,
        nearestIcao: r.nearestIcao,
        nearestName: r.nearestName,
        landedAt: r.landedAt,
        color: r.kind === 'vip' ? '#FFD700' : '#c8a0ff',
      },
    }));

  return { type: 'FeatureCollection', features };
}

export function initLandings(map) {
  load();

  map.addSource('landings', {
    type: 'geojson',
    data: toGeoJSON(),
  });

  map.addLayer({
    id: 'landings-dots',
    type: 'circle',
    source: 'landings',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 4, 6, 6, 10, 8],
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.6,
      'circle-stroke-color': ['get', 'color'],
      'circle-stroke-width': 1.5,
      'circle-stroke-opacity': 0.9,
    },
  }, 'tcas-lines');

  map.addLayer({
    id: 'landings-labels',
    type: 'symbol',
    source: 'landings',
    minzoom: 3,
    layout: {
      'text-field': [
        'case',
        ['==', ['get', 'kind'], 'vip'], ['concat', ['get', 'label'], ' ', ['get', 'nearestIcao']],
        ['concat', 'PVT ', ['get', 'nearestIcao']],
      ],
      'text-size': ['interpolate', ['linear'], ['zoom'], 3, 8, 7, 10],
      'text-offset': [0, -1.2],
      'text-anchor': 'bottom',
      'text-font': ['Noto Sans Regular'],
      'text-optional': true,
    },
    paint: {
      'text-color': ['get', 'color'],
      'text-opacity': 0.75,
      'text-halo-color': 'rgba(10, 14, 23, 0.9)',
      'text-halo-width': 1.5,
    },
  }, 'tcas-lines');

  // Hidden by default (user toggle)
  toggleLandings(map, false);
}

export function toggleLandings(map, visible) {
  const vis = visible ? 'visible' : 'none';
  if (map.getLayer('landings-dots')) map.setLayoutProperty('landings-dots', 'visibility', vis);
  if (map.getLayer('landings-labels')) map.setLayoutProperty('landings-labels', 'visibility', vis);
}

export function updateLandingsFromAircraft(map, aircraft) {
  if (!aircraft || aircraft.length === 0) return;

  for (const ac of aircraft) {
    if (!ac || ac.isGhost) continue;
    const was = prevOnGround.get(ac.icao24) === true;
    const now = ac.on_ground === true;
    prevOnGround.set(ac.icao24, now);
    if (!was && now) {
      recordLanding(ac);
    }
  }

  if (dirty) {
    const src = map.getSource('landings');
    if (src) src.setData(toGeoJSON());
    save();
  }
}

export function getLandingRecord(icao24) {
  return records.get(icao24) || null;
}

