import { defineConfig } from 'vite';
import https from 'https';

// LiveATC feed suffixes to probe
const FEED_SUFFIXES = [
  { suffix: '_twr', label: 'TWR', desc: 'Tower' },
  { suffix: '_app', label: 'APP', desc: 'Approach' },
  { suffix: '_gnd', label: 'GND', desc: 'Ground' },
  { suffix: '_del', label: 'DEL', desc: 'Delivery' },
  { suffix: '_dep', label: 'DEP', desc: 'Departure' },
  { suffix: '_atis', label: 'ATIS', desc: 'ATIS' },
  { suffix: '_ctr', label: 'CTR', desc: 'Center' },
];

const feedCache = new Map();

function probeFeed(feedName) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'd.liveatc.net', port: 443,
      path: '/' + feedName, method: 'GET',
      headers: { host: 'd.liveatc.net' },
    }, (res) => {
      res.destroy();
      if (res.statusCode === 429) {
        resolve('retry');
      } else {
        resolve(res.statusCode === 302 || res.statusCode === 200);
      }
    });
    req.on('error', () => resolve(false));
    req.setTimeout(4000, () => { req.destroy(); resolve(false); });
    req.end();
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function probeWithRetry(feedName) {
  const result = await probeFeed(feedName);
  return result === true;
}

async function discoverFeeds(icao) {
  const key = icao.toUpperCase();
  const cached = feedCache.get(key);
  if (cached && Date.now() - cached.ts < 600000) return cached.feeds;
  const base = icao.toLowerCase();
  const feeds = [];
  for (let i = 0; i < FEED_SUFFIXES.length; i += 2) {
    const batch = FEED_SUFFIXES.slice(i, i + 2);
    const results = await Promise.all(
      batch.map(async ({ suffix, label, desc }) => {
        const exists = await probeWithRetry(base + suffix);
        return exists === true ? { feed: base + suffix, label, desc } : null;
      })
    );
    feeds.push(...results.filter(Boolean));
    if (i + 2 < FEED_SUFFIXES.length) await delay(800);
  }
  feedCache.set(key, { feeds, ts: Date.now() });
  return feeds;
}

function liveatcFeedsPlugin() {
  return {
    name: 'liveatc-feeds',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = req.url.match(/^\/liveatc-feeds\/([A-Za-z0-9]{3,4})$/);
        if (!m) return next();
        discoverFeeds(m[1]).then((feeds) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ icao: m[1].toUpperCase(), feeds }));
        }).catch((err) => {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        });
      });
    },
  };
}

function ochaWarCountriesPlugin() {
  const appname = process.env.OCHA_RELIEFWEB_APPNAME || '';
  return {
    name: 'ocha-war-countries',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/ocha-war-countries')) return next();

        if (!appname) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            authoritative: false,
            source: 'UN/OCHA',
            error: 'OCHA_RELIEFWEB_APPNAME not configured (ReliefWeb API access is gated).',
            iso3: [],
          }));
          return;
        }

        const url = `https://api.reliefweb.int/v2/disasters?appname=${encodeURIComponent(appname)}&limit=1000`;
        https.get(url, (rwRes) => {
          let body = '';
          rwRes.on('data', (c) => { body += c; });
          rwRes.on('end', () => {
            if (rwRes.statusCode !== 200) {
              res.statusCode = 503;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                authoritative: false,
                source: 'UN/OCHA ReliefWeb',
                error: `ReliefWeb request failed (${rwRes.statusCode}). Your appname may not be approved.`,
                iso3: [],
              }));
              return;
            }
            try {
              const json = JSON.parse(body);
              const rows = Array.isArray(json.data) ? json.data : [];
              const iso3 = new Set();
              for (const r of rows) {
                const f = r && r.fields ? r.fields : {};
                const status = String(f.status || '').toLowerCase();
                if (status && status !== 'current' && status !== 'alert') continue;
                const types = Array.isArray(f.type) ? f.type : (f.type ? [f.type] : []);
                const isConflict = types.some((t) => String((t && t.name) || '').toLowerCase().includes('conflict'));
                if (!isConflict) continue;
                const countries = Array.isArray(f.country) ? f.country : (f.country ? [f.country] : []);
                for (const c of countries) {
                  const code = (c && (c.iso3 || c.iso)) ? String(c.iso3 || c.iso).toUpperCase() : '';
                  if (code && code.length === 3) iso3.add(code);
                }
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                authoritative: true,
                source: 'UN/OCHA ReliefWeb',
                updatedAt: Date.now(),
                iso3: Array.from(iso3),
              }));
            } catch (e) {
              res.statusCode = 503;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ authoritative: false, source: 'UN/OCHA ReliefWeb', error: e.message, iso3: [] }));
            }
          });
        }).on('error', (err) => {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ authoritative: false, source: 'UN/OCHA ReliefWeb', error: err.message, iso3: [] }));
        });
      });
    },
  };
}

function coopPlugin() {
  const rooms = new Map(); // room -> Set(res)
  function isValidRoom(room) {
    return typeof room === 'string' && /^[a-z0-9_-]{4,32}$/i.test(room);
  }
  return {
    name: 'coop-sse',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/coop/events')) {
          const u = new URL(req.url, 'http://localhost');
          const room = u.searchParams.get('room') || '';
          if (!isValidRoom(room)) {
            res.statusCode = 400;
            res.end('Bad room');
            return;
          }
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache, no-transform');
          res.setHeader('Connection', 'keep-alive');
          res.write('\n');
          const set = rooms.get(room) || new Set();
          set.add(res);
          rooms.set(room, set);
          const ping = setInterval(() => { try { res.write('event: ping\ndata: {}\n\n'); } catch {} }, 25000);
          req.on('close', () => {
            clearInterval(ping);
            const s = rooms.get(room);
            if (s) {
              s.delete(res);
              if (s.size === 0) rooms.delete(room);
            }
          });
          return;
        }

        if (req.url.startsWith('/coop/update')) {
          const u = new URL(req.url, 'http://localhost');
          const room = u.searchParams.get('room') || '';
          if (!isValidRoom(room)) {
            res.statusCode = 400;
            res.end('Bad room');
            return;
          }
          let body = '';
          req.on('data', (c) => { body += c; if (body.length > 50_000) req.destroy(); });
          req.on('end', () => {
            let msg = {};
            try { msg = JSON.parse(body || '{}'); } catch {}
            const payload = JSON.stringify(msg);
            const s = rooms.get(room);
            if (s) for (const client of s) { try { client.write(`data: ${payload}\n\n`); } catch {} }
            res.statusCode = 204;
            res.end();
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [liveatcFeedsPlugin(), ochaWarCountriesPlugin(), coopPlugin()],
  server: {
    port: 3000,
    host: true,
    open: true,
    proxy: {
      '/adsb-api': {
        target: 'https://api.adsb.lol',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/adsb-api/, ''),
        secure: true,
      },
      '/adsbdb-api': {
        target: 'https://api.adsbdb.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/adsbdb-api/, ''),
        secure: true,
      },
      '/liveatc': {
        target: 'https://d.liveatc.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/liveatc/, ''),
        secure: true,
        followRedirects: true,
      },
    },
  },
});
