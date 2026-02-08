// Warzones overlay.
// NOTE: This dataset is intentionally conservative and NOT authoritative.
// Edit/extend as desired.

const WARZONE_AREAS = [
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

function toGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: WARZONE_AREAS.map((a) => ({
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
    data: toGeoJSON(),
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
}

export function toggleWarzones(map, visible) {
  const vis = visible ? 'visible' : 'none';
  if (map.getLayer('warzones-fill')) map.setLayoutProperty('warzones-fill', 'visibility', vis);
  if (map.getLayer('warzones-labels')) map.setLayoutProperty('warzones-labels', 'visibility', vis);
}

