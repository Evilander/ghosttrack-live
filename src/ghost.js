// Ghost aircraft easter eggs
// One ghost hovers above the user's current location
// One ghost hovers above Quincy, IL

const SPAWN_DELAY_MIN = 30000;  // 30s
const SPAWN_DELAY_MAX = 90000;  // 90s
const ORBIT_RADIUS_DEG = 0.02;  // ~2km radius orbit
const ORBIT_SPEED = 0.0003;     // radians per update tick

// Static ghost anchor: Quincy, IL
const STATIC_GHOST_LAT = 39.9340;
const STATIC_GHOST_LON = -91.4099;

let ghostAircraft = null;
let staticGhostAircraft = null;
let spawnTimeout = null;
let userLat = null;
let userLon = null;
let orbitAngle = 0;
let staticOrbitAngle = 0;

function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 10000, maximumAge: 300000 }
    );
  });
}

async function spawnGhost() {
  // Try to get user location; fall back to random if denied
  let loc = null;
  if (userLat == null) {
    loc = await getUserLocation();
    if (loc) {
      userLat = loc.lat;
      userLon = loc.lon;
    }
  }

  const baseLat = userLat ?? (Math.random() * 130 - 60);
  const baseLon = userLon ?? (Math.random() * 340 - 170);

  orbitAngle = Math.random() * Math.PI * 2;

  ghostAircraft = {
    icao24: 'ghost_local',
    callsign: 'GHOST-01',
    origin_country: 'UNKNOWN',
    longitude: baseLon + ORBIT_RADIUS_DEG * Math.cos(orbitAngle),
    latitude: baseLat + ORBIT_RADIUS_DEG * Math.sin(orbitAngle),
    altitude: null,
    altitude_ft: null,
    on_ground: false,
    velocity: 0,
    speed_kts: null,
    true_track: 0,
    vertical_rate: null,
    band: 'high',
    color: '#ff4444',
    isGhost: true,
    _baseLat: baseLat,
    _baseLon: baseLon,
  };
}

function spawnStaticGhost() {
  staticOrbitAngle = Math.random() * Math.PI * 2;

  staticGhostAircraft = {
    icao24: 'ghost_static',
    callsign: 'GHOST-02',
    origin_country: 'UNKNOWN',
    longitude: STATIC_GHOST_LON + ORBIT_RADIUS_DEG * Math.cos(staticOrbitAngle),
    latitude: STATIC_GHOST_LAT + ORBIT_RADIUS_DEG * Math.sin(staticOrbitAngle),
    altitude: null,
    altitude_ft: null,
    on_ground: false,
    velocity: 0,
    speed_kts: null,
    true_track: 0,
    vertical_rate: null,
    band: 'high',
    color: '#ff4444',
    isGhost: true,
    _baseLat: STATIC_GHOST_LAT,
    _baseLon: STATIC_GHOST_LON,
  };
}

export function initGhost() {
  const delay = SPAWN_DELAY_MIN + Math.random() * (SPAWN_DELAY_MAX - SPAWN_DELAY_MIN);
  spawnTimeout = setTimeout(() => {
    spawnGhost();
    spawnStaticGhost();
  }, delay);
}

export function getGhostAircraft() {
  const ghosts = [];
  if (ghostAircraft) ghosts.push(ghostAircraft);
  if (staticGhostAircraft) ghosts.push(staticGhostAircraft);
  return ghosts;
}

function orbitGhost(ghost, angle) {
  ghost.latitude = ghost._baseLat + ORBIT_RADIUS_DEG * Math.sin(angle);
  ghost.longitude = ghost._baseLon + ORBIT_RADIUS_DEG * Math.cos(angle);
  const headingRad = angle + Math.PI / 2;
  ghost.true_track = ((headingRad * 180 / Math.PI) % 360 + 360) % 360;
}

export function updateGhostPosition(elapsed) {
  const step = ORBIT_SPEED * (elapsed / 100);

  if (ghostAircraft) {
    orbitAngle += step;
    if (orbitAngle > Math.PI * 2) orbitAngle -= Math.PI * 2;
    orbitGhost(ghostAircraft, orbitAngle);
  }

  if (staticGhostAircraft) {
    staticOrbitAngle += step * 0.8; // slightly slower orbit
    if (staticOrbitAngle > Math.PI * 2) staticOrbitAngle -= Math.PI * 2;
    orbitGhost(staticGhostAircraft, staticOrbitAngle);
  }
}
