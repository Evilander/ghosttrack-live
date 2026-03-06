// Day/Night Terminator — Solar shadow overlay
// Renders a semi-transparent dark polygon over the nighttime half of the globe

let terminatorInterval = null;

function getSubsolarPoint(date) {
  const dayOfYear = Math.floor((date - new Date(date.getUTCFullYear(), 0, 0)) / 86400000);
  const totalDays = 365.25;

  // Solar declination (angle of sun above/below equator)
  const declination = -23.44 * Math.cos((2 * Math.PI / totalDays) * (dayOfYear + 10));

  // Equation of time (minutes) — corrects for orbital eccentricity and axial tilt
  const B = (2 * Math.PI / totalDays) * (dayOfYear - 81);
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  // Subsolar longitude: based on UTC time + equation of time correction
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const solarNoonOffsetHours = eot / 60;
  let subsolarLon = (12 - utcHours - solarNoonOffsetHours) * 15;

  // Normalize to [-180, 180]
  if (subsolarLon > 180) subsolarLon -= 360;
  if (subsolarLon < -180) subsolarLon += 360;

  return { lat: declination, lon: subsolarLon };
}

function buildTerminatorPolygon(date) {
  const sun = getSubsolarPoint(date);
  const decRad = (sun.lat * Math.PI) / 180;
  const points = [];

  // Compute terminator line — 360 points, one per degree of longitude
  for (let i = 0; i <= 360; i++) {
    const lon = -180 + i;
    const lonRad = ((lon - sun.lon) * Math.PI) / 180;
    // Terminator latitude at this longitude
    const latRad = Math.atan(-Math.cos(lonRad) / Math.tan(decRad));
    const lat = (latRad * 180) / Math.PI;
    points.push([lon, lat]);
  }

  // Build night polygon — extend to the pole opposite the sun
  // If sun is in northern hemisphere, night covers south pole; vice versa
  const nightPole = sun.lat >= 0 ? -90 : 90;

  const nightRing = [];

  if (nightPole < 0) {
    // Night is on the south side of the terminator
    // Go along terminator west to east, then close via south pole
    for (const p of points) nightRing.push(p);
    nightRing.push([180, nightPole]);
    nightRing.push([-180, nightPole]);
  } else {
    // Night is on the north side of the terminator
    // Go along terminator east to west (reversed), then close via north pole
    for (let i = points.length - 1; i >= 0; i--) nightRing.push(points[i]);
    nightRing.push([-180, nightPole]);
    nightRing.push([180, nightPole]);
  }

  // Close the ring
  nightRing.push(nightRing[0]);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [nightRing],
    },
    properties: {},
  };
}

function updateTerminator(map) {
  const source = map.getSource('terminator');
  if (!source) return;
  const poly = buildTerminatorPolygon(new Date());
  source.setData({
    type: 'FeatureCollection',
    features: [poly],
  });
}

export function initTerminator(map) {
  // Add source
  map.addSource('terminator', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });

  // Add fill layer — below trail-lines so it's a background effect
  map.addLayer(
    {
      id: 'terminator-fill',
      type: 'fill',
      source: 'terminator',
      paint: {
        'fill-color': 'rgba(0, 0, 20, 0.35)',
      },
    },
    'trail-lines' // insert before trail-lines
  );

  // Initial render
  updateTerminator(map);

  // Update every 60 seconds
  terminatorInterval = setInterval(() => updateTerminator(map), 60000);
}

export function toggleTerminator(map, visible) {
  map.setLayoutProperty('terminator-fill', 'visibility', visible ? 'visible' : 'none');
}
