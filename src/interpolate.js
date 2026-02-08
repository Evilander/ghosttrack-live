// Smooth position interpolation between API updates
// Stores previous + current states, linearly interpolates based on elapsed time

const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

let previousStates = new Map();
let currentStates = new Map();
let lastFetchTime = 0;
let fetchInterval = 5000; // 5s fetch cycle

export function updateStates(aircraft, timestamp) {
  previousStates = currentStates;
  currentStates = new Map();
  for (const a of aircraft) {
    currentStates.set(a.icao24, a);
  }
  lastFetchTime = timestamp || Date.now();
}

export function getInterpolatedPositions(now) {
  const elapsed = now - lastFetchTime;
  const t = Math.min(elapsed / fetchInterval, 1.5); // clamp to avoid overshooting too much

  const results = [];

  for (const [id, current] of currentStates) {
    const prev = previousStates.get(id);

    if (prev && prev.longitude != null && prev.latitude != null) {
      // Interpolate using velocity and heading for smoother motion
      const velocityMs = current.velocity || 0;
      const heading = current.true_track || 0;
      const distKm = (velocityMs * (elapsed / 1000)) / 1000;

      const lat1 = current.latitude * DEG_TO_RAD;
      const lon1 = current.longitude * DEG_TO_RAD;
      const bearing = heading * DEG_TO_RAD;

      const angularDist = distKm / EARTH_RADIUS_KM;

      const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(angularDist) +
        Math.cos(lat1) * Math.sin(angularDist) * Math.cos(bearing)
      );
      const lon2 = lon1 + Math.atan2(
        Math.sin(bearing) * Math.sin(angularDist) * Math.cos(lat1),
        Math.cos(angularDist) - Math.sin(lat1) * Math.sin(lat2)
      );

      results.push({
        ...current,
        longitude: lon2 * RAD_TO_DEG,
        latitude: lat2 * RAD_TO_DEG,
      });
    } else {
      results.push({ ...current });
    }
  }

  return results;
}

export function getAircraftById(icao24) {
  return currentStates.get(icao24) || null;
}
