import maplibregl from 'maplibre-gl';

let satMap = null;
let marker = null;

const SATELLITE_STYLE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '&copy; Esri',
      maxzoom: 18,
    },
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
    },
  ],
};

export function initSatelliteView() {
  const container = document.getElementById('satellite-map');
  if (!container) return;

  satMap = new maplibregl.Map({
    container: 'satellite-map',
    style: SATELLITE_STYLE,
    center: [0, 0],
    zoom: 8,
    interactive: false,
    attributionControl: false,
  });
}

export function updateSatelliteView(lon, lat) {
  if (!satMap) return;

  satMap.jumpTo({ center: [lon, lat], zoom: 9 });

  if (marker) {
    marker.setLngLat([lon, lat]);
  } else {
    const el = document.createElement('div');
    el.style.width = '12px';
    el.style.height = '12px';
    el.style.borderRadius = '50%';
    el.style.background = 'rgba(255, 165, 0, 0.8)';
    el.style.border = '2px solid #FFA500';
    el.style.boxShadow = '0 0 10px rgba(255, 165, 0, 0.5)';
    marker = new maplibregl.Marker({ element: el }).setLngLat([lon, lat]).addTo(satMap);
  }

  const labelEl = document.getElementById('satellite-label');
  if (labelEl) {
    labelEl.textContent = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  }
}

export function destroySatelliteView() {
  if (marker) {
    marker.remove();
    marker = null;
  }
  if (satMap) {
    satMap.remove();
    satMap = null;
  }
}
