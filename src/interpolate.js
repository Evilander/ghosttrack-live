// Smooth aircraft interpolation — visual position tracker.
//
// Instead of projecting from base and snapping on refresh, we maintain a
// persistent visual position (vizLat/vizLon) per aircraft that:
//   1. Moves forward each frame at the aircraft's velocity + heading
//   2. Gently corrects toward the dead-reckoned target from the latest API data
//
// This means the displayed position NEVER jumps or backtracks. When new API
// data arrives, the base/target updates but the visual position just smoothly
// adjusts its trajectory over ~1 second.

const EARTH_RADIUS_KM = 6371;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const MAX_DRIFT_KM = 40;
const CORRECTION_RATE = 2.0; // per second — gentler convergence for smoother motion

const states = new Map(); // icao24 → state entry

// Great-circle projection for the absolute target (multi-second distances).
function projectForward(baseLat, baseLon, velocityMs, headingDeg, elapsedSec) {
  if (velocityMs < 5 || elapsedSec <= 0 || elapsedSec > 30) return null;
  const distKm = Math.min((velocityMs * elapsedSec) / 1000, MAX_DRIFT_KM);
  if (distKm < 0.005) return null;

  const lat1 = baseLat * DEG_TO_RAD;
  const lon1 = baseLon * DEG_TO_RAD;
  const bearing = headingDeg * DEG_TO_RAD;
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

  return [lat2 * RAD_TO_DEG, lon2 * RAD_TO_DEG];
}

// Linear step for per-frame movement (sub-km, fast, no trig overhead).
function stepForward(lat, lon, velocityMs, headingDeg, dt) {
  const distKm = (velocityMs * dt) / 1000;
  if (distKm < 0.0001) return null; // < 0.1m, skip

  const headRad = headingDeg * DEG_TO_RAD;
  const dLatDeg = (distKm / EARTH_RADIUS_KM) * RAD_TO_DEG * Math.cos(headRad);
  const cosLat = Math.cos(lat * DEG_TO_RAD);
  const dLonDeg = cosLat > 0.001
    ? (distKm / EARTH_RADIUS_KM) * RAD_TO_DEG * Math.sin(headRad) / cosLat
    : 0;

  return [lat + dLatDeg, lon + dLonDeg];
}

// Call with ONLY freshly-fetched aircraft (not stale cache entries).
export function updateStates(freshAircraft, timestamp) {
  const now = timestamp || Date.now();

  for (const a of freshAircraft) {
    const prev = states.get(a.icao24);
    states.set(a.icao24, {
      baseLat: a.latitude,
      baseLon: a.longitude,
      fetchTime: now,
      vel: a.velocity || 0,
      hdg: a.true_track || 0,
      // Carry forward the visual position — never reset it on fetch.
      // New aircraft start at their API position.
      vizLat: (prev && prev.vizLat != null) ? prev.vizLat : a.latitude,
      vizLon: (prev && prev.vizLon != null) ? prev.vizLon : a.longitude,
      lastFrame: now,
    });
  }
}

// Remove interpolation state for aircraft no longer tracked at all.
export function pruneStates(activeIcaos) {
  for (const id of states.keys()) {
    if (!activeIcaos.has(id)) states.delete(id);
  }
}

// Each frame: move visual position forward, correct toward dead-reckoned target.
export function interpolateInPlace(aircraft, now) {
  for (let i = 0; i < aircraft.length; i++) {
    const a = aircraft[i];
    if (a.longitude == null || a.latitude == null) continue;
    if (a.on_ground) continue;

    const entry = states.get(a.icao24);
    if (!entry || entry.vizLat == null) continue;

    // Slow/stopped aircraft — just hold the visual position
    if (entry.vel < 5) {
      a.latitude = entry.vizLat;
      a.longitude = entry.vizLon;
      continue;
    }

    // Frame delta time (capped to prevent huge jumps after tab switch)
    const dt = Math.min((now - entry.lastFrame) / 1000, 0.15);
    entry.lastFrame = now;

    if (dt <= 0.001) {
      a.latitude = entry.vizLat;
      a.longitude = entry.vizLon;
      continue;
    }

    // Step 1: Move visual position forward at aircraft velocity + heading.
    // This is the primary motion — always forward, never backwards.
    const step = stepForward(entry.vizLat, entry.vizLon, entry.vel, entry.hdg, dt);
    if (step) {
      entry.vizLat = step[0];
      entry.vizLon = step[1];
    }

    // Step 2: Compute where the aircraft SHOULD be (dead-reckoned target from
    // the latest API base position). This is our "truth" reference.
    const elapsed = (now - entry.fetchTime) / 1000;
    if (elapsed >= 0 && elapsed <= 30) {
      const target = projectForward(entry.baseLat, entry.baseLon, entry.vel, entry.hdg, elapsed);
      if (target) {
        // Gently pull visual position toward the target.
        // At CORRECTION_RATE=3, ~95% converged within 1 second.
        const pull = Math.min(dt * CORRECTION_RATE, 0.12);
        entry.vizLat += (target[0] - entry.vizLat) * pull;
        entry.vizLon += (target[1] - entry.vizLon) * pull;
      }
    }

    // Write the smooth visual position back to the aircraft object
    a.latitude = entry.vizLat;
    a.longitude = entry.vizLon;
  }
}

export function getAircraftById(icao24) {
  const entry = states.get(icao24);
  return entry || null;
}
