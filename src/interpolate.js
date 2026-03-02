// Dead-reckoning interpolation — smooth 60fps aircraft motion between API fetches.
// Projects each aircraft forward using its last-known velocity and heading
// via great-circle math, then pushes updates at requestAnimationFrame rate.

const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

const states = new Map(); // icao24 → { aircraft, fetchTime }
let lastFetchTime = 0;

export function updateStates(aircraft, timestamp) {
  const now = timestamp || Date.now();
  lastFetchTime = now;

  const incoming = new Set();
  for (const a of aircraft) {
    incoming.add(a.icao24);
    const existing = states.get(a.icao24);
    states.set(a.icao24, {
      base: a,
      fetchTime: now,
      prevLon: existing ? existing.base.longitude : a.longitude,
      prevLat: existing ? existing.base.latitude : a.latitude,
    });
  }

  // Prune aircraft that disappeared
  for (const id of states.keys()) {
    if (!incoming.has(id)) states.delete(id);
  }
}

export function getInterpolatedPositions(now) {
  const results = [];

  for (const [, entry] of states) {
    const a = entry.base;
    if (a.longitude == null || a.latitude == null) {
      results.push({ ...a });
      continue;
    }

    const elapsed = (now - entry.fetchTime) / 1000; // seconds since last fetch
    const velocity = a.velocity || 0; // m/s
    const heading = a.true_track || 0;

    // Ground aircraft and zero-speed aircraft don't move
    if (a.on_ground || velocity < 5) {
      results.push({ ...a });
      continue;
    }

    // Dead reckoning: project position forward along heading
    const distKm = (velocity * elapsed) / 1000;
    const lat1 = a.latitude * DEG_TO_RAD;
    const lon1 = a.longitude * DEG_TO_RAD;
    const bearing = heading * DEG_TO_RAD;
    const angularDist = distKm / EARTH_RADIUS_KM;

    const sinLat1 = Math.sin(lat1);
    const cosLat1 = Math.cos(lat1);
    const sinAng = Math.sin(angularDist);
    const cosAng = Math.cos(angularDist);

    const lat2 = Math.asin(sinLat1 * cosAng + cosLat1 * sinAng * Math.cos(bearing));
    const lon2 = lon1 + Math.atan2(
      Math.sin(bearing) * sinAng * cosLat1,
      cosAng - sinLat1 * Math.sin(lat2)
    );

    results.push({
      ...a,
      longitude: lon2 * RAD_TO_DEG,
      latitude: lat2 * RAD_TO_DEG,
    });
  }

  return results;
}

export function getAircraftById(icao24) {
  const entry = states.get(icao24);
  return entry ? entry.base : null;
}
