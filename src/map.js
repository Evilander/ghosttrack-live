import maplibregl from 'maplibre-gl';

const DARK_STYLE = {
  version: 8,
  name: 'GhostTrack Palantir',
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: 'SYSTEM: GHOSTTRACK // DATA: ADSB // CARTO',
    },
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

function generateGraticule() {
  const features = [];
  for (let lng = -180; lng <= 180; lng += 10) {
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[lng, -90], [lng, 90]] },
    });
  }
  for (let lat = -80; lat <= 80; lat += 10) {
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[-180, lat], [180, lat]] },
    });
  }
  return { type: 'FeatureCollection', features };
}

export function createMap() {
  const map = new maplibregl.Map({
    container: 'map',
    style: DARK_STYLE,
    center: [-30, 30],
    zoom: 2.5,
    minZoom: 1.5,
    maxZoom: 16,
    pitch: 25,
    attributionControl: false,
  });

  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

  map.on('load', () => {
    map.addSource('graticule', { type: 'geojson', data: generateGraticule() });
    map.addLayer({
      id: 'graticule-lines',
      type: 'line',
      source: 'graticule',
      paint: {
        'line-color': 'rgba(0, 255, 204, 0.06)',
        'line-width': 1,
        'line-dasharray': [4, 8],
      },
    }, 'carto-dark-layer');
  });

  return map;
}
