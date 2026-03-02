import maplibregl from 'maplibre-gl';

// Conflict Intelligence Layer — Operation Epic Fury / Roaring Lion
// Real-time Iran-Israel-US conflict overlay with verified strike data,
// GDELT news integration, and Strait of Hormuz monitoring.

const STRIKE_COLOR = '#ff2222';
const RETALIATION_COLOR = '#ff8800';
const AIRPORT_COLOR = '#FFD700';
const HORMUZ_COLOR = '#ff4444';

// Verified strike locations from multiple confirmed sources.
// Each entry includes source attribution and verification status.
const STRIKES = [
  // ——— Coalition strikes on Iran (Feb 28–Mar 1, 2026) ———
  { id: 'tehran-khamenei', lat: 35.7000, lon: 51.4100, name: 'Tehran — Supreme Leader Compound', desc: 'Khamenei killed. Satellite imagery shows heavy damage. Confirmed by Iranian state media.', side: 'coalition', verified: true, severity: 'critical', casualties: '1+ (Supreme Leader)', source: 'Al Jazeera, AP, satellite imagery' },
  { id: 'tehran-irib', lat: 35.7150, lon: 51.4250, name: 'Tehran — IRIB Broadcasting HQ', desc: 'Iranian Broadcasting Authority building struck.', side: 'coalition', verified: true, severity: 'high', source: 'Israel-Alma' },
  { id: 'kermanshah', lat: 34.3142, lon: 47.0650, name: 'Kermanshah — Imam Ali Missile Base', desc: 'Major IRGC missile facility. Confirmed struck by Israel-Alma.', side: 'coalition', verified: true, severity: 'high', source: 'Israel-Alma' },
  { id: 'tabriz', lat: 38.0800, lon: 46.2919, name: 'Tabriz — Fighter Jet Base', desc: 'IRIAF fighter jets destroyed on ground.', side: 'coalition', verified: true, severity: 'high', source: 'Israel-Alma' },
  { id: 'bandar-abbas', lat: 27.1865, lon: 56.2808, name: 'Bandar Abbas — Naval/Military', desc: 'Major IRIN naval base and port targeted.', side: 'coalition', verified: true, severity: 'high', source: 'Israel-Alma, CBS News' },
  { id: 'shiraz', lat: 29.5918, lon: 52.5836, name: 'Shiraz — Military Targets', desc: 'Multiple military installations struck.', side: 'coalition', verified: true, severity: 'medium', source: 'Al Jazeera, Newsweek' },
  { id: 'mashhad', lat: 36.2605, lon: 59.6168, name: 'Mashhad — Military Targets', desc: 'Military facilities in eastern Iran.', side: 'coalition', verified: true, severity: 'medium', source: 'Israel-Alma' },
  { id: 'rezvanshahr', lat: 37.5511, lon: 49.1375, name: 'Rezvanshahr — Military', desc: 'Strike confirmed in Gilan province.', side: 'coalition', verified: true, severity: 'medium', source: 'Israel-Alma' },
  { id: 'qom', lat: 34.6416, lon: 50.8746, name: 'Qom — Military/Strategic', desc: 'Religious and strategic center. Strikes confirmed.', side: 'coalition', verified: true, severity: 'high', source: 'Al Jazeera' },
  { id: 'ilam', lat: 33.6374, lon: 46.4227, name: 'Ilam — Military', desc: 'Western border province targets.', side: 'coalition', verified: true, severity: 'medium', source: 'Al Jazeera' },
  { id: 'karaj', lat: 35.8400, lon: 50.9391, name: 'Karaj — Military/Industrial', desc: 'Industrial targets near Tehran.', side: 'coalition', verified: true, severity: 'medium', source: 'Al Jazeera' },
  { id: 'bushehr', lat: 28.9234, lon: 50.8203, name: 'Bushehr — Nuclear Area', desc: 'Strikes near nuclear facility region.', side: 'coalition', verified: true, severity: 'high', source: 'Al Jazeera' },
  { id: 'dezful', lat: 32.3836, lon: 48.4036, name: 'Dezful — Missile Base', desc: 'IRGC ballistic missile storage.', side: 'coalition', verified: true, severity: 'high', source: 'Newsweek' },
  { id: 'kharg-island', lat: 29.2333, lon: 50.3167, name: 'Kharg Island — Oil Terminal', desc: 'Iran\'s primary oil export terminal. Critical infrastructure.', side: 'coalition', verified: true, severity: 'critical', source: 'Newsweek' },
  { id: 'chabahar', lat: 25.2919, lon: 60.6430, name: 'Chabahar — Naval Base', desc: 'CENTCOM confirmed sinking of Jamaran-class corvette here.', side: 'coalition', verified: true, severity: 'high', casualties: 'Unknown', source: 'CENTCOM' },
  { id: 'minab-school', lat: 27.1028, lon: 57.0808, name: 'Minab — Girls\' Elementary School', desc: '148–158 students killed (Iranian govt figures). Footage verified by WaPo/NYT. No independent body count. Israel says unaware of ops in area.', side: 'coalition', verified: 'partial', severity: 'critical', casualties: '148–158 killed, ~95 wounded', source: 'NPR, WaPo, NYT (footage verified)' },

  // ——— Iranian retaliation (across 9 countries) ———
  { id: 'beit-shemesh', lat: 31.7468, lon: 34.9882, name: 'Beit Shemesh, Israel', desc: '9 killed in missile strike near Jerusalem.', side: 'iran', verified: true, severity: 'critical', casualties: '9 killed', source: 'Jerusalem Post' },
  { id: 'tel-aviv', lat: 32.0853, lon: 34.7818, name: 'Tel Aviv, Israel', desc: '2 killed, 121 injured. ~40 buildings damaged.', side: 'iran', verified: true, severity: 'critical', casualties: '2 killed, 121 injured', source: 'MDA via Al Jazeera' },
  { id: 'dubai-strike', lat: 25.2528, lon: 55.3644, name: 'Dubai, UAE', desc: 'Dubai International Airport shut. Debris and drone strikes. 3 killed, 58 injured in UAE.', side: 'iran', verified: true, severity: 'high', casualties: '3 killed, 58 injured (UAE)', source: 'Al Jazeera AJLabs' },
  { id: 'bahrain-airport', lat: 26.2708, lon: 50.6336, name: 'Bahrain International Airport', desc: 'Drone struck the airport. 4+ injured.', side: 'iran', verified: true, severity: 'high', casualties: '4+ injured', source: 'Bahrain Ministry of Interior' },
  { id: 'kuwait-strike', lat: 29.2267, lon: 47.9689, name: 'Kuwait — US Military', desc: '3 US service members killed in drone strike. 5 seriously wounded.', side: 'iran', verified: true, severity: 'critical', casualties: '3 US KIA, 5 WIA', source: 'AP, CENTCOM, CNN' },
  { id: 'qatar-strike', lat: 25.3156, lon: 51.4440, name: 'Qatar', desc: '16 injured in strikes on US/allied facilities.', side: 'iran', verified: true, severity: 'medium', casualties: '16 injured', source: 'AJLabs' },
  { id: 'oman-khasab', lat: 26.2000, lon: 56.2600, name: 'Near Khasab, Oman', desc: 'Tanker "Skylight" struck ~5nm north of Khasab Port.', side: 'iran', verified: true, severity: 'high', source: 'Oman Maritime Security, gCaptain' },
  { id: 'iraq-pmf', lat: 33.3100, lon: 44.3660, name: 'Iraq — PMF Forces', desc: '2 killed, 5 injured among PMF forces.', side: 'iran', verified: true, severity: 'medium', casualties: '2 killed, 5 injured', source: 'AJLabs' },
  { id: 'akrotiri', lat: 34.5903, lon: 32.9878, name: 'RAF Akrotiri, Cyprus', desc: 'Drone strike caused minor damage. No confirmed casualties.', side: 'iran', verified: true, severity: 'medium', source: 'The Guardian' },
];

// Affected airports — status as of conflict
const AFFECTED_AIRPORTS = [
  { icao: 'OMDB', name: 'Dubai International', lat: 25.2528, lon: 55.3644, status: 'CLOSED', reason: 'Drone/debris strikes. Concourse damaged.' },
  { icao: 'OBBI', name: 'Bahrain International', lat: 26.2708, lon: 50.6336, status: 'STRUCK', reason: 'Direct drone hit confirmed by Ministry of Interior.' },
  { icao: 'OIIE', name: 'Tehran Imam Khomeini', lat: 35.4161, lon: 51.1522, status: 'DISRUPTED', reason: 'Active military operations in Tehran area.' },
  { icao: 'OISS', name: 'Shiraz International', lat: 29.5392, lon: 52.5900, status: 'DISRUPTED', reason: 'Military targets struck nearby.' },
  { icao: 'OIBB', name: 'Bushehr Airport', lat: 28.9448, lon: 50.8346, status: 'DISRUPTED', reason: 'Strikes in Bushehr province.' },
  { icao: 'OIKB', name: 'Bandar Abbas International', lat: 27.2183, lon: 56.3778, status: 'DISRUPTED', reason: 'Naval base and military targets in city.' },
  { icao: 'LCRA', name: 'RAF Akrotiri', lat: 34.5903, lon: 32.9878, status: 'STRUCK', reason: 'Iranian drone strike. Minor damage.' },
];

// Strait of Hormuz closure zone
const HORMUZ_ZONE = [
  [56.0, 27.2],
  [56.5, 26.8],
  [57.0, 26.2],
  [56.8, 25.8],
  [56.3, 25.5],
  [55.8, 25.8],
  [55.5, 26.3],
  [55.8, 26.8],
  [56.0, 27.2],
];

// Broader Persian Gulf operations area
const OPS_AREA = [
  [47.0, 30.5],
  [60.5, 30.5],
  [60.5, 23.0],
  [47.0, 23.0],
  [47.0, 30.5],
];

// Iran theater polygon (approximate borders)
const IRAN_THEATER = [
  [44.0, 40.0],
  [63.5, 40.0],
  [63.5, 25.0],
  [44.0, 25.0],
  [44.0, 40.0],
];

// Casualty summary as of Mar 1, 15:00 GMT — AJLabs + CENTCOM
const CASUALTY_DATA = {
  updatedAt: '2026-03-01T15:00:00Z',
  entries: [
    { region: 'Iran (total)', killed: '201+', wounded: '747+', status: 'reported', source: 'Iranian Red Crescent' },
    { region: 'Iran — Minab school', killed: '148–158', wounded: '~95', status: 'unverified', source: 'Iranian govt (footage verified WaPo/NYT)' },
    { region: 'Israel', killed: '11+', wounded: '~500', status: 'reported', source: 'MDA, hospitals' },
    { region: 'US Military', killed: '3', wounded: '5+ serious', status: 'confirmed', source: 'CENTCOM' },
    { region: 'UAE', killed: '3', wounded: '58', status: 'reported', source: 'AJLabs' },
    { region: 'Kuwait', killed: '1', wounded: '32', status: 'reported', source: 'AJLabs' },
    { region: 'Iraq (PMF)', killed: '2', wounded: '5', status: 'reported', source: 'AJLabs' },
    { region: 'Bahrain', killed: '0', wounded: '4+', status: 'reported', source: 'AJLabs' },
    { region: 'Qatar', killed: '0', wounded: '16', status: 'reported', source: 'AJLabs' },
    { region: 'Oman', killed: '0', wounded: '5', status: 'reported', source: 'AJLabs' },
  ],
};

// Unverified claims
const DISPUTED_CLAIMS = [
  { claim: 'IDF: 1,200+ munitions across 24/31 provinces', status: 'claimed', source: 'IAF briefing via Al Jazeera' },
  { claim: 'IDF: 40 senior commanders killed', status: 'claimed', source: 'CBS News' },
  { claim: 'Trump: 9 Iranian naval ships sunk', status: 'disputed', source: 'NPR — CENTCOM would not confirm' },
  { claim: 'IRGC: 27 US bases attacked', status: 'claimed', source: 'IRGC via Al Jazeera' },
  { claim: 'IRGC: 560 US troops killed/injured', status: 'contradicted', source: 'CENTCOM confirms 3 KIA / 5 WIA' },
  { claim: 'Hormuz officially closed', status: 'disputed', source: 'IRGC VHF warnings vs FM denial. De facto blockade per Reuters/MarineTraffic' },
];

let mapRef = null;
let gdeltEvents = [];
let panelOpen = false;

function strikesGeoJSON() {
  const features = STRIKES.map(s => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
    properties: {
      id: s.id,
      name: s.name,
      desc: s.desc,
      side: s.side,
      verified: String(s.verified),
      severity: s.severity,
      casualties: s.casualties || '',
      source: s.source || '',
    },
  }));
  return { type: 'FeatureCollection', features };
}

function affectedAirportsGeoJSON() {
  const features = AFFECTED_AIRPORTS.map(a => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [a.lon, a.lat] },
    properties: {
      icao: a.icao,
      name: a.name,
      status: a.status,
      reason: a.reason,
    },
  }));
  return { type: 'FeatureCollection', features };
}

function hormuzGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [HORMUZ_ZONE] },
      properties: { name: 'Strait of Hormuz — De Facto Blockade', desc: '150+ tankers anchored. Major shipping lines suspended transit. IRGC declared waterway closed via VHF.' },
    }],
  };
}

function opsAreaGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [OPS_AREA] },
      properties: { name: 'PERSIAN GULF OPS AREA', desc: 'Active military operations zone. Multiple nations affected.' },
    }],
  };
}

function theaterGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [IRAN_THEATER] },
      properties: { name: 'OPERATION EPIC FURY / ROARING LION', desc: 'Theater of operations' },
    }],
  };
}

function gdeltGeoJSON() {
  if (gdeltEvents.length === 0) return { type: 'FeatureCollection', features: [] };
  const features = gdeltEvents.map((e, i) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [e.lon, e.lat] },
    properties: {
      id: `gdelt-${i}`,
      title: e.title || '',
      url: e.url || '',
      domain: e.domain || '',
      tone: e.tone || 0,
    },
  }));
  return { type: 'FeatureCollection', features };
}

// Create canvas-rendered strike icons
function createStrikeIcon(color, size = 20) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner dot
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Crosshair lines
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - r - 2, cy);
  ctx.lineTo(cx - r * 0.6, cy);
  ctx.moveTo(cx + r * 0.6, cy);
  ctx.lineTo(cx + r + 2, cy);
  ctx.moveTo(cx, cy - r - 2);
  ctx.lineTo(cx, cy - r * 0.6);
  ctx.moveTo(cx, cy + r * 0.6);
  ctx.lineTo(cx, cy + r + 2);
  ctx.stroke();

  return { width: size, height: size, data: new Uint8Array(ctx.getImageData(0, 0, size, size).data.buffer) };
}

function createAirportWarningIcon(size = 22) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  // Warning triangle
  ctx.beginPath();
  ctx.moveTo(cx, 2);
  ctx.lineTo(size - 2, size - 2);
  ctx.lineTo(2, size - 2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
  ctx.fill();
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Exclamation mark
  ctx.fillStyle = '#000';
  ctx.font = `bold ${size * 0.45}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', cx, cy + 2);

  return { width: size, height: size, data: new Uint8Array(ctx.getImageData(0, 0, size, size).data.buffer) };
}

export function initConflictIntel(map) {
  mapRef = map;

  // Register icons
  map.addImage('strike-coalition', createStrikeIcon(STRIKE_COLOR, 22));
  map.addImage('strike-iran', createStrikeIcon(RETALIATION_COLOR, 22));
  map.addImage('airport-warning', createAirportWarningIcon(24));

  // Theater outline (very subtle)
  map.addSource('conflict-theater', { type: 'geojson', data: theaterGeoJSON() });
  map.addLayer({
    id: 'conflict-theater-outline',
    type: 'line',
    source: 'conflict-theater',
    paint: {
      'line-color': 'rgba(255, 68, 68, 0.15)',
      'line-width': 1,
      'line-dasharray': [4, 4],
    },
  });

  // Operations area
  map.addSource('conflict-ops', { type: 'geojson', data: opsAreaGeoJSON() });
  map.addLayer({
    id: 'conflict-ops-fill',
    type: 'fill',
    source: 'conflict-ops',
    paint: {
      'fill-color': 'rgba(255, 68, 68, 0.04)',
    },
  });
  map.addLayer({
    id: 'conflict-ops-line',
    type: 'line',
    source: 'conflict-ops',
    paint: {
      'line-color': 'rgba(255, 68, 68, 0.25)',
      'line-width': 1.5,
      'line-dasharray': [6, 3],
    },
  });

  // Hormuz closure zone
  map.addSource('conflict-hormuz', { type: 'geojson', data: hormuzGeoJSON() });
  map.addLayer({
    id: 'conflict-hormuz-fill',
    type: 'fill',
    source: 'conflict-hormuz',
    paint: {
      'fill-color': 'rgba(255, 0, 0, 0.15)',
    },
  });
  map.addLayer({
    id: 'conflict-hormuz-line',
    type: 'line',
    source: 'conflict-hormuz',
    paint: {
      'line-color': HORMUZ_COLOR,
      'line-width': 2,
      'line-dasharray': [3, 2],
    },
  });
  map.addLayer({
    id: 'conflict-hormuz-label',
    type: 'symbol',
    source: 'conflict-hormuz',
    layout: {
      'text-field': 'HORMUZ — DE FACTO BLOCKADE',
      'text-size': 9,
      'text-font': ['Noto Sans Bold'],
      'text-letter-spacing': 0.15,
    },
    paint: {
      'text-color': HORMUZ_COLOR,
      'text-halo-color': 'rgba(10, 14, 23, 0.9)',
      'text-halo-width': 1.5,
    },
  });

  // Strike locations
  map.addSource('conflict-strikes', { type: 'geojson', data: strikesGeoJSON() });
  map.addLayer({
    id: 'conflict-strikes-glow',
    type: 'circle',
    source: 'conflict-strikes',
    paint: {
      'circle-radius': ['case', ['==', ['get', 'severity'], 'critical'], 18, ['==', ['get', 'severity'], 'high'], 14, 10],
      'circle-color': ['case', ['==', ['get', 'side'], 'coalition'], STRIKE_COLOR, RETALIATION_COLOR],
      'circle-opacity': 0.15,
      'circle-blur': 0.8,
    },
  });
  map.addLayer({
    id: 'conflict-strikes-icons',
    type: 'symbol',
    source: 'conflict-strikes',
    layout: {
      'icon-image': ['case', ['==', ['get', 'side'], 'coalition'], 'strike-coalition', 'strike-iran'],
      'icon-size': ['case', ['==', ['get', 'severity'], 'critical'], 1.3, ['==', ['get', 'severity'], 'high'], 1.0, 0.8],
      'icon-allow-overlap': true,
      'text-field': ['get', 'name'],
      'text-size': 8,
      'text-offset': [0, 1.8],
      'text-font': ['Noto Sans Regular'],
      'text-optional': true,
    },
    minzoom: 4,
    paint: {
      'text-color': ['case', ['==', ['get', 'side'], 'coalition'], 'rgba(255, 100, 100, 0.8)', 'rgba(255, 180, 100, 0.8)'],
      'text-halo-color': 'rgba(10, 14, 23, 0.9)',
      'text-halo-width': 1.5,
    },
  });

  // Affected airports
  map.addSource('conflict-airports', { type: 'geojson', data: affectedAirportsGeoJSON() });
  map.addLayer({
    id: 'conflict-airports-icons',
    type: 'symbol',
    source: 'conflict-airports',
    layout: {
      'icon-image': 'airport-warning',
      'icon-allow-overlap': true,
      'text-field': ['concat', ['get', 'icao'], ' — ', ['get', 'status']],
      'text-size': 8,
      'text-offset': [0, 1.6],
      'text-font': ['Noto Sans Bold'],
      'text-optional': true,
    },
    minzoom: 4,
    paint: {
      'text-color': AIRPORT_COLOR,
      'text-halo-color': 'rgba(10, 14, 23, 0.9)',
      'text-halo-width': 1.5,
    },
  });

  // GDELT real-time event layer
  map.addSource('conflict-gdelt', { type: 'geojson', data: gdeltGeoJSON() });
  map.addLayer({
    id: 'conflict-gdelt-dots',
    type: 'circle',
    source: 'conflict-gdelt',
    minzoom: 3,
    paint: {
      'circle-radius': 4,
      'circle-color': '#ff66aa',
      'circle-opacity': 0.5,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ff66aa',
    },
  });

  // Click handlers
  map.on('click', 'conflict-strikes-icons', (e) => {
    if (!e.features || !e.features.length) return;
    const p = e.features[0].properties;
    const esc = s => String(s || '').replace(/</g, '&lt;');
    const color = p.side === 'coalition' ? STRIKE_COLOR : RETALIATION_COLOR;
    const verifiedBadge = p.verified === 'true' ? '<span style="color:#00ff88;">VERIFIED</span>'
      : p.verified === 'partial' ? '<span style="color:#FFD700;">PARTIALLY VERIFIED</span>'
        : '<span style="color:#ff8800;">CLAIMED</span>';

    const html = `<div style="font-family:JetBrains Mono,monospace;max-width:280px;">` +
      `<div style="font-size:8px;letter-spacing:2px;color:${color};opacity:0.7;margin-bottom:3px;">STRIKE LOCATION</div>` +
      `<div style="font-size:11px;font-weight:700;color:${color};">${esc(p.name)}</div>` +
      `<div style="font-size:9px;color:#E0F0FF;opacity:0.8;margin-top:4px;line-height:1.5;">${esc(p.desc)}</div>` +
      (p.casualties ? `<div style="font-size:9px;color:#ff4444;margin-top:3px;">Casualties: ${esc(p.casualties)}</div>` : '') +
      `<div style="font-size:8px;margin-top:4px;">${verifiedBadge}</div>` +
      `<div style="font-size:7px;color:rgba(224,240,255,0.4);margin-top:2px;">Source: ${esc(p.source)}</div>` +
      `</div>`;

    new maplibregl.Popup({ closeButton: true, closeOnClick: true })
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(map);
  });

  map.on('click', 'conflict-airports-icons', (e) => {
    if (!e.features || !e.features.length) return;
    const p = e.features[0].properties;
    const esc = s => String(s || '').replace(/</g, '&lt;');
    const statusColor = p.status === 'CLOSED' ? '#ff4444' : p.status === 'STRUCK' ? '#ff8800' : '#FFD700';

    const html = `<div style="font-family:JetBrains Mono,monospace;max-width:260px;">` +
      `<div style="font-size:8px;letter-spacing:2px;color:${AIRPORT_COLOR};opacity:0.7;margin-bottom:3px;">AFFECTED AIRPORT</div>` +
      `<div style="font-size:11px;font-weight:700;color:#E0F0FF;">${esc(p.name)} (${esc(p.icao)})</div>` +
      `<div style="font-size:10px;font-weight:700;color:${statusColor};margin-top:3px;">STATUS: ${esc(p.status)}</div>` +
      `<div style="font-size:9px;color:#E0F0FF;opacity:0.8;margin-top:3px;">${esc(p.reason)}</div>` +
      `</div>`;

    new maplibregl.Popup({ closeButton: true, closeOnClick: true })
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(map);
  });

  map.on('click', 'conflict-hormuz-fill', (e) => {
    const html = `<div style="font-family:JetBrains Mono,monospace;max-width:280px;">` +
      `<div style="font-size:8px;letter-spacing:2px;color:${HORMUZ_COLOR};opacity:0.7;margin-bottom:3px;">MARITIME CHOKEPOINT</div>` +
      `<div style="font-size:11px;font-weight:700;color:${HORMUZ_COLOR};">STRAIT OF HORMUZ</div>` +
      `<div style="font-size:9px;color:#E0F0FF;opacity:0.8;margin-top:4px;line-height:1.5;">` +
      `20–30% of global oil/gas transits here. IRGC declared waterway closed via VHF. ` +
      `150+ tankers anchored. Maersk, Hapag-Lloyd, CMA CGM, MSC suspended transits. ` +
      `Tanker "Skylight" struck near Khasab.</div>` +
      `<div style="font-size:8px;color:#ff8800;margin-top:3px;">DE FACTO BLOCKADE — S&P Global/Platts</div>` +
      `</div>`;

    new maplibregl.Popup({ closeButton: true, closeOnClick: true })
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(map);
  });

  // Cursor changes
  for (const layer of ['conflict-strikes-icons', 'conflict-airports-icons', 'conflict-hormuz-fill']) {
    map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
  }

  // Init briefing panel
  initBriefingPanel();

  // Start GDELT polling
  fetchGdeltEvents();
  setInterval(fetchGdeltEvents, 5 * 60 * 1000);
}

function extractUrlFromHtml(html) {
  if (!html) return '';
  const m = html.match(/href="([^"]+)"/);
  return m ? m[1] : '';
}

function extractDomain(url) {
  if (!url) return '';
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

async function fetchGdeltEvents() {
  try {
    const res = await fetch('/gdelt-conflict');
    if (!res.ok) return;
    const geojson = await res.json();
    if (!geojson || !geojson.features) return;
    gdeltEvents = geojson.features
      .filter(f => f.geometry && f.geometry.coordinates)
      .map(f => {
        const p = f.properties || {};
        const url = extractUrlFromHtml(p.html) || p.url || '';
        return {
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          title: p.name || '',
          url,
          domain: extractDomain(url),
          tone: p.tone || 0,
        };
      });
    const src = mapRef && mapRef.getSource('conflict-gdelt');
    if (src) src.setData(gdeltGeoJSON());
    updateGdeltFeed();
  } catch { /* non-fatal */ }
}

function initBriefingPanel() {
  const panel = document.getElementById('conflict-panel');
  if (!panel) return;

  const closeBtn = document.getElementById('conflict-panel-close');
  if (closeBtn) closeBtn.addEventListener('click', () => togglePanel(false));

  const flyBtn = document.getElementById('conflict-fly-to');
  if (flyBtn) {
    flyBtn.addEventListener('click', () => {
      if (mapRef) {
        mapRef.flyTo({
          center: [53.0, 30.0],
          zoom: 4.5,
          pitch: 30,
          bearing: 15,
          duration: 3000,
        });
      }
    });
  }

  renderCasualtyTable();
  renderDisputedClaims();
}

function renderCasualtyTable() {
  const container = document.getElementById('conflict-casualties');
  if (!container) return;

  let totalKilled = 0;
  let totalWounded = 0;

  const rows = CASUALTY_DATA.entries.map(e => {
    const statusClass = e.status === 'confirmed' ? 'confirmed' : e.status === 'unverified' ? 'unverified' : 'reported';
    const killed = String(e.killed).replace(/[^0-9]/g, '');
    const wounded = String(e.wounded).replace(/[^0-9]/g, '');
    if (killed) totalKilled += parseInt(killed, 10);
    if (wounded) totalWounded += parseInt(wounded, 10);

    return `<div class="conflict-cas-row">` +
      `<span class="conflict-cas-region">${e.region}</span>` +
      `<span class="conflict-cas-killed">${e.killed}</span>` +
      `<span class="conflict-cas-wounded">${e.wounded}</span>` +
      `<span class="conflict-cas-status ${statusClass}">${e.status.toUpperCase()}</span>` +
      `</div>`;
  }).join('');

  container.innerHTML =
    `<div class="conflict-cas-header">` +
    `<span>REGION</span><span>KIA</span><span>WIA</span><span>STATUS</span>` +
    `</div>` + rows +
    `<div class="conflict-cas-total">` +
    `<span>TOTAL (minimum)</span><span>${totalKilled}+</span><span>${totalWounded}+</span><span></span>` +
    `</div>`;
}

function renderDisputedClaims() {
  const container = document.getElementById('conflict-claims');
  if (!container) return;

  container.innerHTML = DISPUTED_CLAIMS.map(c => {
    const cls = c.status === 'contradicted' ? 'contradicted' : c.status === 'disputed' ? 'disputed' : 'claimed';
    return `<div class="conflict-claim">` +
      `<span class="conflict-claim-badge ${cls}">${c.status.toUpperCase()}</span>` +
      `<span class="conflict-claim-text">${c.claim}</span>` +
      `</div>`;
  }).join('');
}

function updateGdeltFeed() {
  const container = document.getElementById('conflict-gdelt-feed');
  if (!container || gdeltEvents.length === 0) return;

  const items = gdeltEvents.slice(0, 12).map(e => {
    const domain = e.domain || 'unknown';
    const tone = e.tone ? (e.tone < -5 ? 'negative' : e.tone > 2 ? 'positive' : 'neutral') : 'neutral';
    return `<a class="conflict-gdelt-item" href="${e.url}" target="_blank" rel="noopener">` +
      `<span class="conflict-gdelt-tone ${tone}"></span>` +
      `<span class="conflict-gdelt-title">${(e.title || 'Untitled').substring(0, 80)}</span>` +
      `<span class="conflict-gdelt-domain">${domain}</span>` +
      `</a>`;
  }).join('');

  container.innerHTML = items;
}

function togglePanel(show) {
  const panel = document.getElementById('conflict-panel');
  if (!panel) return;
  panelOpen = show;
  panel.classList.toggle('hidden', !show);
}

export function toggleConflictIntel(map, visible) {
  const layers = [
    'conflict-theater-outline',
    'conflict-ops-fill', 'conflict-ops-line',
    'conflict-hormuz-fill', 'conflict-hormuz-line', 'conflict-hormuz-label',
    'conflict-strikes-glow', 'conflict-strikes-icons',
    'conflict-airports-icons',
    'conflict-gdelt-dots',
  ];
  const vis = visible ? 'visible' : 'none';
  for (const id of layers) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
  }

  // Show/hide the briefing button
  const btn = document.getElementById('conflict-briefing-btn');
  if (btn) btn.style.display = visible ? '' : 'none';

  if (!visible) togglePanel(false);
}

export function openBriefingPanel() {
  togglePanel(true);
}

