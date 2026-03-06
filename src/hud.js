const utcEl = document.getElementById('utc-clock');
const localEl = document.getElementById('local-clock');
const countEl = document.getElementById('aircraft-count');
const airborneEl = document.getElementById('airborne-count');
const groundEl = document.getElementById('ground-count');
const heartbeatEl = document.getElementById('heartbeat');
const dataAgeEl = document.getElementById('data-age');
const cursorLatEl = document.getElementById('cursor-lat');
const cursorLonEl = document.getElementById('cursor-lon');
const topOriginsEl = document.getElementById('top-origins');

let lastFetchTimestamp = Date.now();

function pad(n) {
  return String(n).padStart(2, '0');
}

function updateClocks() {
  const now = new Date();
  utcEl.textContent = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
  localEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // Update data age
  const age = Math.round((Date.now() - lastFetchTimestamp) / 1000);
  dataAgeEl.textContent = `${age}s`;
  dataAgeEl.style.color = age > 30 ? '#ff4444' : age > 15 ? '#FFA500' : '#00ff88';
}

export function initHUD(map) {
  updateClocks();
  setInterval(updateClocks, 1000);

  // Track cursor position on map
  if (map) {
    map.on('mousemove', (e) => {
      cursorLatEl.textContent = e.lngLat.lat.toFixed(4);
      cursorLonEl.textContent = e.lngLat.lng.toFixed(4);
    });
  }
}

export function updateAircraftCount(total, airborne, ground) {
  countEl.textContent = total.toLocaleString();
  airborneEl.textContent = airborne.toLocaleString();
  groundEl.textContent = ground.toLocaleString();
}

export function updateTopOrigins(aircraft) {
  const counts = {};
  for (const a of aircraft) {
    if (a.origin_country) {
      counts[a.origin_country] = (counts[a.origin_country] || 0) + 1;
    }
  }
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  topOriginsEl.innerHTML = sorted
    .map(
      ([name, count]) =>
        `<div class="origin-row"><span class="origin-name">${name}</span><span class="origin-count">${count}</span></div>`
    )
    .join('');
}

export function pulseHeartbeat() {
  lastFetchTimestamp = Date.now();
  heartbeatEl.style.animation = 'none';
  heartbeatEl.offsetHeight;
  heartbeatEl.style.animation = 'heartbeat-pulse 1s infinite';
}
