// adsb.lol — free, open ADS-B aggregator
// Proxied through Vite dev server to avoid CORS
// Uses geographic endpoint: /v2/point/{lat}/{lon}/{radius_nm}

const M_TO_FT = 3.28084;

// ICAO hex address → country lookup (covers ~95% of global air traffic)
// Each entry: [startHex, endHex, country]
const ICAO_RANGES = [
  [0x004000, 0x0043FF, 'Zimbabwe'],
  [0x006000, 0x006FFF, 'Mozambique'],
  [0x008000, 0x00FFFF, 'South Africa'],
  [0x010000, 0x017FFF, 'Egypt'],
  [0x018000, 0x01FFFF, 'Libya'],
  [0x020000, 0x027FFF, 'Morocco'],
  [0x028000, 0x02FFFF, 'Tunisia'],
  [0x030000, 0x0303FF, 'Botswana'],
  [0x034000, 0x034FFF, 'Burundi'],
  [0x035000, 0x035FFF, 'Cameroon'],
  [0x038000, 0x038FFF, 'Congo'],
  [0x03E000, 0x03EFFF, 'Gabon'],
  [0x040000, 0x040FFF, 'Ethiopia'],
  [0x042000, 0x042FFF, 'Equatorial Guinea'],
  [0x044000, 0x044FFF, 'Ghana'],
  [0x048000, 0x048FFF, 'Kenya'],
  [0x050000, 0x050FFF, 'Nigeria'],
  [0x054000, 0x054FFF, 'Uganda'],
  [0x058000, 0x058FFF, 'Tanzania'],
  [0x060000, 0x060FFF, 'Guinea'],
  [0x0A0000, 0x0A7FFF, 'Algeria'],
  [0x0C0000, 0x0C4FFF, 'Mexico'],
  [0x0D0000, 0x0D7FFF, 'Venezuela'],
  [0x0E0000, 0x0E3FFF, 'Argentina'],
  [0x0E4000, 0x0E7FFF, 'Brazil'],
  [0x0E8000, 0x0E8FFF, 'Chile'],
  [0x0EA000, 0x0EA0FF, 'Colombia'],
  [0x0EC000, 0x0EC0FF, 'Peru'],
  [0x0EE000, 0x0EE0FF, 'Uruguay'],
  [0x100000, 0x1FFFFF, 'Russia'],
  [0x200000, 0x27FFFF, 'ICAO (Intl)'],
  [0x300000, 0x33FFFF, 'Italy'],
  [0x340000, 0x37FFFF, 'Spain'],
  [0x380000, 0x3BFFFF, 'France'],
  [0x3C0000, 0x3FFFFF, 'Germany'],
  [0x400000, 0x43FFFF, 'United Kingdom'],
  [0x440000, 0x447FFF, 'Austria'],
  [0x448000, 0x44FFFF, 'Belgium'],
  [0x450000, 0x457FFF, 'Bulgaria'],
  [0x458000, 0x45FFFF, 'Denmark'],
  [0x460000, 0x467FFF, 'Finland'],
  [0x468000, 0x46FFFF, 'Greece'],
  [0x470000, 0x477FFF, 'Hungary'],
  [0x478000, 0x47FFFF, 'Norway'],
  [0x480000, 0x487FFF, 'Netherlands'],
  [0x488000, 0x48FFFF, 'Poland'],
  [0x490000, 0x497FFF, 'Portugal'],
  [0x498000, 0x49FFFF, 'Czech Republic'],
  [0x4A0000, 0x4A7FFF, 'Romania'],
  [0x4A8000, 0x4AFFFF, 'Sweden'],
  [0x4B0000, 0x4B7FFF, 'Switzerland'],
  [0x4B8000, 0x4BFFFF, 'Turkey'],
  [0x4C0000, 0x4C7FFF, 'Serbia'],
  [0x4C8000, 0x4CAFFF, 'Croatia'],
  [0x500000, 0x5003FF, 'Iceland'],
  [0x501000, 0x501FFF, 'Ireland'],
  [0x502000, 0x502FFF, 'Luxembourg'],
  [0x504000, 0x504FFF, 'Slovakia'],
  [0x505000, 0x505FFF, 'Slovenia'],
  [0x508000, 0x50FFFF, 'Ukraine'],
  [0x510000, 0x51FFFF, 'Belarus'],
  [0x514000, 0x514FFF, 'Estonia'],
  [0x515000, 0x515FFF, 'Latvia'],
  [0x516000, 0x516FFF, 'Lithuania'],
  [0x600000, 0x6003FF, 'Armenia'],
  [0x680000, 0x68FFFF, 'Oman'],
  [0x681000, 0x681FFF, 'Qatar'],
  [0x684000, 0x687FFF, 'Saudi Arabia'],
  [0x690000, 0x6903FF, 'UAE'],
  [0x698000, 0x698FFF, 'Israel'],
  [0x700000, 0x700FFF, 'Afghanistan'],
  [0x710000, 0x717FFF, 'Japan'],
  [0x718000, 0x71FFFF, 'South Korea'],
  [0x720000, 0x727FFF, 'Iran'],
  [0x730000, 0x737FFF, 'Iraq'],
  [0x738000, 0x73FFFF, 'Kuwait'],
  [0x740000, 0x747FFF, 'Thailand'],
  [0x748000, 0x74FFFF, 'India'],
  [0x750000, 0x757FFF, 'Pakistan'],
  [0x758000, 0x75FFFF, 'Taiwan'],
  [0x760000, 0x767FFF, 'China'],
  [0x768000, 0x76FFFF, 'Malaysia'],
  [0x770000, 0x777FFF, 'Philippines'],
  [0x778000, 0x77FFFF, 'Indonesia'],
  [0x780000, 0x787FFF, 'Singapore'],
  [0x789000, 0x789FFF, 'Hong Kong'],
  [0x7C0000, 0x7FFFFF, 'Australia'],
  [0x800000, 0x83FFFF, 'India'],
  [0x840000, 0x87FFFF, 'Japan'],
  [0x880000, 0x887FFF, 'China'],
  [0x890000, 0x893FFF, 'New Zealand'],
  [0x894000, 0x894FFF, 'Vietnam'],
  [0x895000, 0x8953FF, 'Bangladesh'],
  [0x896000, 0x896FFF, 'Nepal'],
  [0x898000, 0x898FFF, 'Sri Lanka'],
  [0xA00000, 0xAFFFFF, 'United States'],
  [0xC00000, 0xC3FFFF, 'Canada'],
  [0xC80000, 0xC87FFF, 'New Zealand'],
  [0xE00000, 0xE3FFFF, 'Argentina'],
  [0xE40000, 0xE7FFFF, 'Brazil'],
  [0xE80000, 0xE80FFF, 'Chile'],
  [0xE84000, 0xE84FFF, 'Colombia'],
  [0xE88000, 0xE88FFF, 'Ecuador'],
  [0xE8C000, 0xE8CFFF, 'Paraguay'],
  [0xE90000, 0xE90FFF, 'Peru'],
  [0xE94000, 0xE94FFF, 'Uruguay'],
  [0xE98000, 0xE98FFF, 'Venezuela'],
];

function getCountryFromHex(hex) {
  const addr = parseInt(hex, 16);
  if (isNaN(addr)) return '';
  for (const [lo, hi, country] of ICAO_RANGES) {
    if (addr >= lo && addr <= hi) return country;
  }
  return '';
}

export function getAltitudeBand(altFt) {
  if (altFt == null || altFt <= 0) return 'low';
  if (altFt <= 10000) return 'low';
  if (altFt <= 25000) return 'mid';
  return 'high';
}

export function getAltitudeColor(band) {
  switch (band) {
    case 'low': return '#FFA500';
    case 'mid': return '#00CED1';
    case 'high': return '#E0F0FF';
    default: return '#E0F0FF';
  }
}

export function parseAircraftState(ac) {
  const lon = ac.lon;
  const lat = ac.lat;
  if (lon == null || lat == null) return null;

  const altFt = ac.alt_baro !== 'ground' ? ac.alt_baro : null;
  const onGround = ac.alt_baro === 'ground';
  const band = getAltitudeBand(altFt);
  const speedKts = ac.gs != null ? Math.round(ac.gs) : null;
  const vRateFpm = ac.baro_rate ?? null;

  return {
    icao24: ac.hex || '',
    callsign: (ac.flight || '').trim(),
    origin_country: ac.ownOp || getCountryFromHex(ac.hex) || '',
    longitude: lon,
    latitude: lat,
    altitude: altFt != null ? altFt / M_TO_FT : null,
    altitude_ft: altFt != null ? Math.round(altFt) : null,
    on_ground: onGround,
    velocity: ac.gs != null ? ac.gs * 0.514444 : null,
    speed_kts: speedKts,
    true_track: ac.track ?? ac.true_heading ?? 0,
    vertical_rate: vRateFpm != null ? vRateFpm / 60 : null,
    vertical_rate_fpm: vRateFpm,
    band,
    color: getAltitudeColor(band),
    registration: ac.r || null,
    aircraft_type: ac.t || null,
    squawk: ac.squawk || null,
    category: ac.category || null,
    dbFlags: ac.dbFlags || 0,
  };
}

export function toGeoJSON(aircraft) {
  return {
    type: 'FeatureCollection',
    features: aircraft.map((a) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [a.longitude, a.latitude],
      },
      properties: {
        icao24: a.icao24,
        callsign: a.callsign,
        origin_country: a.origin_country,
        altitude_ft: a.altitude_ft,
        speed_kts: a.speed_kts,
        heading: Math.round(a.true_track),
        vertical_rate: a.vertical_rate,
        vertical_rate_fpm: a.vertical_rate_fpm,
        band: a.band,
        color: a.color,
        rotation: a.true_track || 0,
        on_ground: a.on_ground ? 1 : 0,
        isGhost: a.isGhost ? 1 : 0,
        registration: a.registration || '',
        aircraft_type: a.aircraft_type || '',
        squawk: a.squawk || '',
        dbFlags: a.dbFlags || 0,
      },
    })),
  };
}

// Fetch aircraft within a geographic radius from a single point
async function fetchPoint(lat, lon, radiusNm) {
  const clampLat = Math.round(lat * 100) / 100;
  const clampLon = Math.round(lon * 100) / 100;
  const r = Math.min(Math.round(radiusNm), 250);

  const url = `/adsb-api/v2/point/${clampLat}/${clampLon}/${r}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ADS-B API error: ${res.status}`);
  const data = await res.json();
  if (!data.ac) return [];
  return data.ac.map(parseAircraftState).filter(Boolean);
}

// Fetch special categories (military, LADD) — global endpoints
async function fetchSpecial(endpoint) {
  try {
    const res = await fetch(`/adsb-api/v2/${endpoint}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.ac) return [];
    return data.ac.map(parseAircraftState).filter(Boolean);
  } catch {
    return [];
  }
}

// Build a grid of fetch points covering the visible map bounds
function getGridPoints(bounds, maxPoints) {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  let latMin = Math.max(sw.lat, -85);
  let latMax = Math.min(ne.lat, 85);
  let lonMin = sw.lng;
  let lonMax = ne.lng;

  // Handle world wrap
  if (lonMax < lonMin) lonMax += 360;

  const latRange = latMax - latMin;
  const lonRange = lonMax - lonMin;

  if (latRange <= 0 || lonRange <= 0) return [{ lat: (latMin + latMax) / 2, lon: (lonMin + lonMax) / 2 }];

  const aspect = Math.max(0.5, Math.min(3, lonRange / latRange));
  const cols = Math.max(1, Math.round(Math.sqrt(maxPoints * aspect)));
  const rows = Math.max(1, Math.round(maxPoints / cols));

  const latStep = latRange / rows;
  const lonStep = lonRange / cols;

  const points = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let lon = lonMin + lonStep * (c + 0.5);
      if (lon > 180) lon -= 360;
      points.push({
        lat: latMin + latStep * (r + 0.5),
        lon,
      });
    }
  }
  return points;
}

// Fetch a single aircraft by ICAO hex code (returns 0 or 1 aircraft)
async function fetchHex(hex) {
  try {
    const res = await fetch(`/adsb-api/v2/hex/${hex}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.ac) return [];
    return data.ac.map(parseAircraftState).filter(Boolean);
  } catch {
    return [];
  }
}

// Fetch all VIP aircraft globally by hex code
// Returns only those currently broadcasting ADS-B
let _vipHexes = [];
export function setVipHexes(hexes) { _vipHexes = hexes; }

let _vipCache = [];
let _vipLastFetch = 0;
const VIP_FETCH_INTERVAL = 30000; // 30s — separate from main 5s cycle

export async function fetchVipAircraft() {
  if (_vipHexes.length === 0) return _vipCache;
  if (Date.now() - _vipLastFetch < VIP_FETCH_INTERVAL) return _vipCache;
  _vipLastFetch = Date.now();

  try {
    const results = await Promise.all(_vipHexes.map(h => fetchHex(h)));
    _vipCache = results.flat();
    console.log(`[GhostTrack] VIP scan: ${_vipCache.length}/${_vipHexes.length} active`);
  } catch {
    // Keep stale cache on error
  }
  return _vipCache;
}

// Main fetch: tiles the visible area for global coverage
export async function fetchAircraft(map) {
  const zoom = map.getZoom();
  const bounds = map.getBounds();

  let gridPoints;
  if (zoom < 3) {
    gridPoints = getGridPoints(bounds, 16);
  } else if (zoom < 5) {
    gridPoints = getGridPoints(bounds, 9);
  } else if (zoom < 7) {
    gridPoints = getGridPoints(bounds, 4);
  } else {
    const center = map.getCenter();
    gridPoints = [{ lat: center.lat, lon: center.lng }];
  }

  const radiusNm = 250;

  // Fire all point requests + military/LADD in parallel
  const pointPromises = gridPoints.map(p =>
    fetchPoint(p.lat, p.lon, radiusNm).catch(() => [])
  );

  const specialPromises = zoom < 5
    ? [fetchSpecial('mil'), fetchSpecial('ladd')]
    : [];

  const results = await Promise.all([...pointPromises, ...specialPromises]);

  // Merge and deduplicate by icao24
  const seen = new Map();
  for (const batch of results) {
    for (const ac of batch) {
      seen.set(ac.icao24, ac);
    }
  }

  const aircraft = Array.from(seen.values());
  console.log(`[GhostTrack] ${gridPoints.length} grid points, ${aircraft.length} unique aircraft (zoom ${zoom.toFixed(1)})`);
  return aircraft;
}
