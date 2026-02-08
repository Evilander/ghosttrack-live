// Warzones overlay.
//
// "Authoritative" mode requires UN/OCHA data access that is currently gated behind
// an approved app identifier for OCHA APIs (ReliefWeb / HDX HAPI).
// When not configured/available, this falls back to a small approximate overlay.
//
// Country boundaries are sourced from Natural Earth (public domain) and used only
// to render country-level highlighting when OCHA provides a country list.

const FALLBACK_WARZONE_AREAS = [
  {
    name: 'Conflict Zone (approx): Ukraine',
    key: 'ukraine',
    // Rough bounding box polygon
    polygon: [
      [22.0, 52.5],
      [40.5, 52.5],
      [40.5, 44.0],
      [22.0, 44.0],
      [22.0, 52.5],
    ],
  },
  {
    name: 'Conflict Zone (approx): Gaza/Israel',
    key: 'gaza_israel',
    polygon: [
      [34.0, 32.2],
      [35.9, 32.2],
      [35.9, 30.8],
      [34.0, 30.8],
      [34.0, 32.2],
    ],
  },
  {
    name: 'Conflict Zone (approx): Sudan',
    key: 'sudan',
    polygon: [
      [21.5, 22.5],
      [38.5, 22.5],
      [38.5, 8.0],
      [21.5, 8.0],
      [21.5, 22.5],
    ],
  },
  {
    name: 'Conflict Zone (approx): Myanmar',
    key: 'myanmar',
    polygon: [
      [92.0, 28.6],
      [101.5, 28.6],
      [101.5, 9.5],
      [92.0, 9.5],
      [92.0, 28.6],
    ],
  },
];

function fallbackGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: FALLBACK_WARZONE_AREAS.map((a) => ({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [a.polygon] },
      properties: {
        name: a.name,
        key: a.key,
      },
    })),
  };
}

export function initWarzones(map) {
  map.addSource('warzones', {
    type: 'geojson',
    data: fallbackGeoJSON(),
  });

  map.addLayer({
    id: 'warzones-fill',
    type: 'fill',
    source: 'warzones',
    paint: {
      'fill-color': 'rgba(255, 68, 68, 0.12)',
      'fill-outline-color': 'rgba(255, 68, 68, 0.35)',
    },
  }, 'trail-lines');

  map.addLayer({
    id: 'warzones-labels',
    type: 'symbol',
    source: 'warzones',
    minzoom: 3,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 10,
      'text-font': ['Noto Sans Regular'],
      'text-optional': true,
    },
    paint: {
      'text-color': 'rgba(255, 68, 68, 0.7)',
      'text-halo-color': 'rgba(10, 14, 23, 0.9)',
      'text-halo-width': 1.5,
    },
  }, 'trail-lines');

  // Try to replace fallback overlay with OCHA-driven country highlighting.
  // Non-fatal: failures keep the fallback.
  refreshWarzones(map);
}

export function toggleWarzones(map, visible) {
  const vis = visible ? 'visible' : 'none';
  if (map.getLayer('warzones-fill')) map.setLayoutProperty('warzones-fill', 'visibility', vis);
  if (map.getLayer('warzones-labels')) map.setLayoutProperty('warzones-labels', 'visibility', vis);
}

async function loadWorldCountries() {
  const res = await fetch('/ne_110m_admin_0_countries.geojson', { cache: 'force-cache' });
  if (!res.ok) throw new Error('world boundaries unavailable');
  return await res.json();
}

async function fetchOchaWarCountries() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch('/ocha-war-countries', { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || !json.authoritative || !Array.isArray(json.iso3) || json.iso3.length === 0) return null;
    return json;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

async function refreshWarzones(map) {
  const info = await fetchOchaWarCountries();
  if (!info) return;

  const world = await loadWorldCountries();
  const set = new Set(info.iso3.map((s) => String(s).toUpperCase()));

  const features = (world.features || []).filter((f) => {
    const p = f && f.properties ? f.properties : {};
    const iso3 = (p.ISO_A3 || p.ADM0_A3 || '').toUpperCase();
    return iso3 && set.has(iso3);
  }).map((f) => ({
    type: 'Feature',
    geometry: f.geometry,
    properties: {
      name: `Conflict (UN/OCHA): ${f.properties.ADMIN || f.properties.NAME || f.properties.ADM0_A3 || 'Country'}`,
      key: (f.properties.ISO_A3 || f.properties.ADM0_A3 || '').toUpperCase(),
    },
  }));

  if (features.length === 0) return;

  const src = map.getSource('warzones');
  if (src) src.setData({ type: 'FeatureCollection', features });
}
