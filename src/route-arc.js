// Great Circle Route Arcs — curved flight path from origin to destination
// Draws a dashed arc on the map when a selected aircraft has route data

import { getAirportCoords } from './airports.js';

const ARC_POINTS = 100; // number of interpolated points along the great circle
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

let map = null;

function haversineIntermediate(lat1, lon1, lat2, lon2, fraction) {
  const phi1 = lat1 * DEG2RAD;
  const phi2 = lat2 * DEG2RAD;
  const lam1 = lon1 * DEG2RAD;
  const lam2 = lon2 * DEG2RAD;

  const dphi = phi2 - phi1;
  const dlam = lam2 - lam1;

  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
  const delta = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (delta < 1e-10) return [lat1, lon1]; // same point

  const A = Math.sin((1 - fraction) * delta) / Math.sin(delta);
  const B = Math.sin(fraction * delta) / Math.sin(delta);

  const x = A * Math.cos(phi1) * Math.cos(lam1) + B * Math.cos(phi2) * Math.cos(lam2);
  const y = A * Math.cos(phi1) * Math.sin(lam1) + B * Math.cos(phi2) * Math.sin(lam2);
  const z = A * Math.sin(phi1) + B * Math.sin(phi2);

  const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * RAD2DEG;
  const lon = Math.atan2(y, x) * RAD2DEG;

  return [lon, lat]; // GeoJSON order: [lon, lat]
}

function buildArcGeoJSON(originCoords, destCoords) {
  const coords = [];
  for (let i = 0; i <= ARC_POINTS; i++) {
    const f = i / ARC_POINTS;
    coords.push(
      haversineIntermediate(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon, f)
    );
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: { type: 'arc' },
      },
      // Origin dot
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [originCoords.lon, originCoords.lat] },
        properties: { type: 'airport', role: 'origin' },
      },
      // Destination dot
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [destCoords.lon, destCoords.lat] },
        properties: { type: 'airport', role: 'dest' },
      },
    ],
  };
}

export function initRouteArc(mapInstance) {
  map = mapInstance;

  map.addSource('route-arc', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Dashed arc line
  map.addLayer({
    id: 'route-arc-line',
    type: 'line',
    source: 'route-arc',
    filter: ['==', ['get', 'type'], 'arc'],
    paint: {
      'line-color': 'rgba(255, 165, 0, 0.3)',
      'line-width': 1.5,
      'line-dasharray': [4, 4],
    },
    layout: {
      'line-cap': 'round',
    },
  });

  // Airport dots
  map.addLayer({
    id: 'route-arc-dots',
    type: 'circle',
    source: 'route-arc',
    filter: ['==', ['get', 'type'], 'airport'],
    paint: {
      'circle-radius': 4,
      'circle-color': [
        'case',
        ['==', ['get', 'role'], 'origin'], 'rgba(0, 255, 136, 0.6)',
        'rgba(255, 165, 0, 0.6)',
      ],
      'circle-stroke-color': [
        'case',
        ['==', ['get', 'role'], 'origin'], 'rgba(0, 255, 136, 0.3)',
        'rgba(255, 165, 0, 0.3)',
      ],
      'circle-stroke-width': 2,
    },
  });
}

export function showRouteArc(originIcao, destIcao) {
  if (!map) return;
  const origin = getAirportCoords(originIcao);
  const dest = getAirportCoords(destIcao);
  if (!origin || !dest) return;

  const source = map.getSource('route-arc');
  if (source) {
    source.setData(buildArcGeoJSON(origin, dest));
  }
}

export function clearRouteArc() {
  if (!map) return;
  const source = map.getSource('route-arc');
  if (source) {
    source.setData({ type: 'FeatureCollection', features: [] });
  }
}
