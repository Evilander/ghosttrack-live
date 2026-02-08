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

export default defineConfig({
  plugins: [liveatcFeedsPlugin()],
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
