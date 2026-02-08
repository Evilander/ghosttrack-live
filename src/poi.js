// Points of Interest — notable locations rendered as small markers on the map

const POI_DATA = [
  // Government
  { name: 'Joint Base Andrews (AF1)', icao: 'KADW', lat: 38.8108, lon: -76.8669, category: 'government' },
  { name: 'Mar-a-Lago / Palm Beach', icao: 'KPBI', lat: 26.6832, lon: -80.0956, category: 'government' },

  // Military
  { name: 'Area 51 / Groom Lake', icao: 'KXTA', lat: 37.2350, lon: -115.8111, category: 'military' },
  { name: 'Tonopah Test Range', icao: 'KTNX', lat: 38.0268, lon: -116.7801, category: 'military' },
  { name: 'Nellis AFB (Red Flag)', icao: 'KLSV', lat: 36.2361, lon: -115.0343, category: 'military' },
  { name: 'Edwards AFB (Test)', icao: 'KEDW', lat: 34.9054, lon: -117.8839, category: 'military' },
  { name: 'Offutt AFB (Doomsday HQ)', icao: 'KOFF', lat: 41.1183, lon: -95.9125, category: 'military' },

  // Celebrity / private jet hubs
  { name: 'Van Nuys (Celebrity Jets)', icao: 'KVNY', lat: 34.2098, lon: -118.4898, category: 'celebrity' },
  { name: 'Teterboro (NYC Private)', icao: 'KTEB', lat: 40.8501, lon: -74.0608, category: 'celebrity' },
  { name: 'Hawthorne (SpaceX HQ)', icao: 'KHHR', lat: 33.9228, lon: -118.3352, category: 'celebrity' },
  { name: 'Scottsdale (Private AZ)', icao: 'KSDL', lat: 33.6229, lon: -111.9105, category: 'celebrity' },
  { name: 'Boeing Field (Bezos)', icao: 'KBFI', lat: 47.5300, lon: -122.3019, category: 'celebrity' },

  // VIP international
  { name: 'Davos / St. Gallen', icao: 'LSZR', lat: 47.4853, lon: 9.5608, category: 'vip' },
  { name: 'Farnborough (Private UK)', icao: 'EGLF', lat: 51.2758, lon: -0.7764, category: 'vip' },
  { name: 'Le Bourget (Private Paris)', icao: 'LFPB', lat: 48.9694, lon: 2.4414, category: 'vip' },
];

const CATEGORY_COLORS = {
  government: '#ff4444',
  military: '#FFA500',
  celebrity: '#c8a0ff',
  vip: '#FFD700',
};

function toGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: POI_DATA.map(poi => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [poi.lon, poi.lat] },
      properties: {
        name: poi.name,
        icao: poi.icao,
        category: poi.category,
        color: CATEGORY_COLORS[poi.category] || '#FFD700',
      },
    })),
  };
}

/**
 * Add POI source and layers to the map.
 * Call after setupLayers() so we can insert below aircraft layers.
 */
export function initPOI(map) {
  map.addSource('poi', {
    type: 'geojson',
    data: toGeoJSON(),
  });

  // Diamond dot marker per POI
  map.addLayer({
    id: 'poi-dots',
    type: 'circle',
    source: 'poi',
    paint: {
      'circle-radius': 4,
      'circle-color': ['get', 'color'],
      'circle-opacity': 0.4,
      'circle-stroke-color': ['get', 'color'],
      'circle-stroke-width': 1,
      'circle-stroke-opacity': 0.6,
    },
  }, 'tcas-lines'); // Insert below TCAS, above terminator/trails

  // Label text at zoom >= 7
  map.addLayer({
    id: 'poi-labels',
    type: 'symbol',
    source: 'poi',
    minzoom: 7,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 10,
      'text-offset': [0, -1.2],
      'text-anchor': 'bottom',
      'text-font': ['Noto Sans Regular'],
      'text-optional': true,
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': ['get', 'color'],
      'text-opacity': 0.5,
      'text-halo-color': 'rgba(10, 14, 23, 0.9)',
      'text-halo-width': 1.5,
    },
  }, 'tcas-lines');
}

/**
 * Show or hide the POI layers.
 */
export function togglePOI(map, visible) {
  const vis = visible ? 'visible' : 'none';
  if (map.getLayer('poi-dots')) map.setLayoutProperty('poi-dots', 'visibility', vis);
  if (map.getLayer('poi-labels')) map.setLayoutProperty('poi-labels', 'visibility', vis);
}
