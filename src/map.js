import maplibregl from 'maplibre-gl';

const DARK_STYLE = {
  version: 8,
  name: 'GhostTrack Dark',
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
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
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

export function createMap() {
  const map = new maplibregl.Map({
    container: 'map',
    style: DARK_STYLE,
    center: [-30, 30],
    zoom: 2.5,
    minZoom: 1.5,
    maxZoom: 16,
    attributionControl: false,
  });

  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

  return map;
}
