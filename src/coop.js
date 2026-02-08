// Co-op sync (zero-dependency): host broadcasts selection/view to followers via SSE.

function randRoom() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
}

function getQuery() {
  return new URLSearchParams(window.location.search);
}

function setQuery(params) {
  const url = new URL(window.location.href);
  url.search = params.toString();
  history.replaceState(null, '', url.toString());
}

let enabled = false;
let role = 'host'; // host | follow
let room = '';
let es = null;
let suppress = false;
let onRemote = null;

export function initCoop(remoteSelectHandler) {
  onRemote = remoteSelectHandler;

  const q = getQuery();
  const coop = q.get('coop') === '1';
  const qRoom = q.get('room') || '';
  const qRole = q.get('role') || '';

  if (coop && qRoom) {
    enabled = true;
    room = qRoom;
    role = qRole === 'follow' ? 'follow' : 'host';
  }
}

export function isCoopEnabled() { return enabled; }
export function isCoopHost() { return enabled && role === 'host'; }
export function getCoopRoom() { return room; }

export function enableCoopHost() {
  enabled = true;
  role = 'host';
  room = room || randRoom();
  const q = getQuery();
  q.set('coop', '1');
  q.set('room', room);
  q.set('role', 'host');
  setQuery(q);
  connect();
}

export function enableCoopFollow() {
  enabled = true;
  role = 'follow';
  room = room || randRoom();
  const q = getQuery();
  q.set('coop', '1');
  q.set('room', room);
  q.set('role', 'follow');
  setQuery(q);
  connect();
}

export function disableCoop() {
  enabled = false;
  role = 'host';
  room = '';
  if (es) { es.close(); es = null; }
  const q = getQuery();
  q.delete('coop'); q.delete('room'); q.delete('role');
  setQuery(q);
}

export function getShareUrl() {
  if (!room) return '';
  const url = new URL(window.location.href);
  url.searchParams.set('coop', '1');
  url.searchParams.set('room', room);
  url.searchParams.set('role', 'follow');
  return url.toString();
}

function connect() {
  if (!enabled || !room) return;
  if (es) es.close();
  es = new EventSource(`/coop/events?room=${encodeURIComponent(room)}`);
  es.addEventListener('message', (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (!msg || !msg.type) return;
      if (msg.type === 'select' && role === 'follow' && onRemote) {
        suppress = true;
        onRemote(msg.icao24);
        // release suppression on next tick to avoid feedback loops
        setTimeout(() => { suppress = false; }, 0);
      }
    } catch {
      // ignore
    }
  });
  es.addEventListener('error', () => {
    // browser will auto-retry
  });
}

async function post(msg) {
  if (!enabled || role !== 'host' || !room) return;
  if (suppress) return;
  try {
    await fetch(`/coop/update?room=${encodeURIComponent(room)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
  } catch {
    // ignore
  }
}

export function coopBroadcastSelection(icao24) {
  if (!icao24) return;
  post({ type: 'select', icao24, ts: Date.now() });
}

