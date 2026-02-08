// Flight trails — stores recent positions for each aircraft
// and produces a GeoJSON LineString collection for rendering

const MAX_TRAIL_POINTS = 12;
const trailData = new Map();

export function recordPositions(aircraft) {
  const seen = new Set();

  for (const a of aircraft) {
    if (a.isGhost) continue;
    seen.add(a.icao24);

    let trail = trailData.get(a.icao24);
    if (!trail) {
      trail = [];
      trailData.set(a.icao24, trail);
    }

    const last = trail[trail.length - 1];
    // Only add if position changed meaningfully
    if (!last || Math.abs(last[0] - a.longitude) > 0.0001 || Math.abs(last[1] - a.latitude) > 0.0001) {
      trail.push([a.longitude, a.latitude]);
      if (trail.length > MAX_TRAIL_POINTS) {
        trail.shift();
      }
    }
  }

  // Clean up stale trails
  for (const [id] of trailData) {
    if (!seen.has(id)) {
      trailData.delete(id);
    }
  }
}

export function getTrailsGeoJSON(visibleAircraft) {
  const visibleSet = new Set(visibleAircraft.map((a) => a.icao24));
  const features = [];

  for (const [id, trail] of trailData) {
    if (!visibleSet.has(id)) continue;
    if (trail.length < 2) continue;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: trail,
      },
      properties: {
        icao24: id,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
