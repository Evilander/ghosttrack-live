// TCAS Proximity Alerts — Detects dangerously close aircraft pairs
// Uses spatial grid indexing for O(n) performance with up to 3000 aircraft

const DEG2RAD = Math.PI / 180;
const EARTH_RADIUS_NM = 3440.065; // nautical miles
const GRID_SIZE = 0.1; // degrees (~6nm at mid-latitudes)

// Thresholds
const RA_HORIZ_NM = 2;    // Resolution Advisory: < 2nm horizontal
const RA_VERT_FT = 500;   // Resolution Advisory: < 500ft vertical
const TA_HORIZ_NM = 5;    // Traffic Advisory: < 5nm horizontal
const TA_VERT_FT = 1000;  // Traffic Advisory: < 1000ft vertical

function haversineNm(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * DEG2RAD;
  const dLon = (lon2 - lon1) * DEG2RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG2RAD) * Math.cos(lat2 * DEG2RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(a));
}

function gridKey(lat, lon) {
  const row = Math.floor(lat / GRID_SIZE);
  const col = Math.floor(lon / GRID_SIZE);
  return `${row},${col}`;
}

function getNeighborKeys(lat, lon) {
  const row = Math.floor(lat / GRID_SIZE);
  const col = Math.floor(lon / GRID_SIZE);
  const keys = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      keys.push(`${row + dr},${col + dc}`);
    }
  }
  return keys;
}

/**
 * Detect proximity alerts between aircraft.
 * @param {Array} aircraft - array of aircraft objects
 * @returns {Array} alerts: { ac1, ac2, distNm, altDiffFt, severity }
 */
export function detectProximity(aircraft) {
  // Filter to airborne aircraft with valid position + altitude
  const airborne = aircraft.filter(
    (a) => !a.isGhost && !a.on_ground && a.latitude != null && a.longitude != null && a.altitude_ft != null
  );

  if (airborne.length < 2) return [];

  // Build spatial grid
  const grid = new Map();
  for (const ac of airborne) {
    const key = gridKey(ac.latitude, ac.longitude);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(ac);
  }

  const alerts = [];
  const seen = new Set(); // prevent duplicate pairs

  for (const ac of airborne) {
    const neighborKeys = getNeighborKeys(ac.latitude, ac.longitude);

    for (const key of neighborKeys) {
      const cell = grid.get(key);
      if (!cell) continue;

      for (const other of cell) {
        if (ac === other) continue;

        // Create sorted pair key to prevent duplicates
        const pairKey = ac.icao24 < other.icao24
          ? `${ac.icao24}|${other.icao24}`
          : `${other.icao24}|${ac.icao24}`;

        if (seen.has(pairKey)) continue;
        seen.add(pairKey);

        // Quick altitude pre-filter
        const altDiff = Math.abs(ac.altitude_ft - other.altitude_ft);
        if (altDiff > TA_VERT_FT) continue;

        // Fast lat/lon degree pre-filter (~5nm ≈ 0.083° at equator, wider at poles)
        const dLat = Math.abs(ac.latitude - other.latitude);
        if (dLat > 0.12) continue;
        const dLon = Math.abs(ac.longitude - other.longitude);
        if (dLon > 0.12) continue;

        // Haversine distance (only for candidates that passed pre-filter)
        const distNm = haversineNm(ac.latitude, ac.longitude, other.latitude, other.longitude);
        if (distNm > TA_HORIZ_NM) continue;

        // Determine severity
        let severity;
        if (distNm < RA_HORIZ_NM && altDiff < RA_VERT_FT) {
          severity = 'RA';
        } else {
          severity = 'TA';
        }

        alerts.push({
          ac1: ac,
          ac2: other,
          distNm: Math.round(distNm * 10) / 10,
          altDiffFt: Math.round(altDiff),
          severity,
        });
      }
    }
  }

  // Sort: RA first, then by distance
  alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'RA' ? -1 : 1;
    return a.distNm - b.distNm;
  });

  return alerts;
}

/**
 * Update the dedicated TCAS panel DOM.
 * @param {Array} alerts - from detectProximity()
 * @param {Function} onSelect - callback(aircraft) when user clicks an item
 */
export function updateTcasPanel(alerts, onSelect) {
  const listEl = document.getElementById('tcas-list');
  const countEl = document.getElementById('tcas-count');
  if (!listEl || !countEl) return;

  countEl.textContent = alerts.length;

  if (alerts.length === 0) {
    listEl.innerHTML = '<div class="tcas-empty">NO PROXIMITY ALERTS</div>';
    return;
  }

  listEl.innerHTML = '';

  for (const alert of alerts) {
    const item = document.createElement('div');
    item.className = 'tcas-item';

    const pair = document.createElement('span');
    pair.className = 'tcas-pair';
    const cs1 = alert.ac1.callsign || alert.ac1.icao24;
    const cs2 = alert.ac2.callsign || alert.ac2.icao24;
    pair.textContent = cs1;

    const badge = document.createElement('span');
    badge.className = `tcas-badge ${alert.severity.toLowerCase()}`;
    badge.textContent = alert.severity;

    const info = document.createElement('span');
    info.className = 'tcas-info';
    info.textContent = `${alert.distNm}nm · ${alert.altDiffFt}ft · ${cs2}`;

    item.appendChild(pair);
    item.appendChild(info);
    item.appendChild(badge);

    item.addEventListener('click', () => {
      if (onSelect) onSelect(alert.ac1);
    });

    listEl.appendChild(item);
  }
}

export function proximityToGeoJSON(alerts) {
  const features = [];

  for (const alert of alerts) {
    // Line between the two aircraft
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [alert.ac1.longitude, alert.ac1.latitude],
          [alert.ac2.longitude, alert.ac2.latitude],
        ],
      },
      properties: {
        severity: alert.severity,
        distNm: alert.distNm,
      },
    });

    // Midpoint marker
    const midLat = (alert.ac1.latitude + alert.ac2.latitude) / 2;
    const midLon = (alert.ac1.longitude + alert.ac2.longitude) / 2;
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [midLon, midLat],
      },
      properties: {
        severity: alert.severity,
        type: 'midpoint',
      },
    });
  }

  return { type: 'FeatureCollection', features };
}
