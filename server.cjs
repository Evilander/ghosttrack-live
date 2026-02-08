/**
 * GhostTrack Live — Portable Server
 * Zero-dependency HTTP server + API proxy
 * Uses only built-in Node.js modules
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DIST_DIR = path.join(__dirname, 'dist');
const PORT_START = 3000;
const PORT_END = 3004;

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.wasm': 'application/wasm',
  '.pbf': 'application/x-protobuf',
};

// Proxy configuration — mirrors vite.config.js
const PROXY_ROUTES = {
  '/adsb-api': { host: 'api.adsb.lol', prefix: '/adsb-api', secure: true },
  '/adsbdb-api': { host: 'api.adsbdb.com', prefix: '/adsbdb-api', secure: true },
  '/liveatc': { host: 'd.liveatc.net', prefix: '/liveatc', secure: true },
};

// OCHA API identifiers (required by OCHA-run APIs; request approval from OCHA/ReliefWeb/HDX).
const OCHA_RELIEFWEB_APPNAME = process.env.OCHA_RELIEFWEB_APPNAME || '';

function proxyRequest(clientReq, clientRes, route) {
  const targetPath = clientReq.url.replace(new RegExp('^' + route.prefix), '') || '/';
  _doProxy(clientReq, clientRes, route.host, targetPath, route.secure !== false, 0);
}

function _doProxy(clientReq, clientRes, hostname, targetPath, secure, redirectCount) {
  if (redirectCount > 5) {
    clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
    clientRes.end('Too many redirects');
    return;
  }

  const options = {
    hostname,
    port: secure ? 443 : 80,
    path: targetPath,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: hostname,
    },
  };

  // Remove headers that don't belong on the upstream request
  delete options.headers['referer'];
  delete options.headers['origin'];

  const transport = secure ? https : http;
  const proxyReq = transport.request(options, (proxyRes) => {
    // Follow redirects server-side (LiveATC 302s to stream servers)
    if ((proxyRes.statusCode === 301 || proxyRes.statusCode === 302) && proxyRes.headers.location) {
      proxyRes.resume(); // drain the redirect response body
      try {
        const loc = new URL(proxyRes.headers.location);
        const isSec = loc.protocol === 'https:';
        _doProxy(clientReq, clientRes, loc.hostname, loc.pathname + loc.search, isSec, redirectCount + 1);
      } catch {
        clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
        clientRes.end('Bad redirect URL');
      }
      return;
    }

    // Set CORS headers so the browser accepts the response
    clientRes.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': '*',
    });
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`  [PROXY ERROR] ${hostname}${targetPath} — ${err.message}`);
    clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
    clientRes.end('Proxy error: ' + err.message);
  });

  clientReq.pipe(proxyReq, { end: true });
}

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0]; // strip query string
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(DIST_DIR, urlPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback: serve index.html for unmatched routes
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, indexData) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(indexData);
        });
        return;
      }
      res.writeHead(500);
      res.end('Server error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// LiveATC feed discovery — probe which feeds exist for a given ICAO code
// Standard US-style suffixes + common international patterns
const FEED_SUFFIXES = [
  { suffix: '_twr', label: 'TWR', desc: 'Tower' },
  { suffix: '_app', label: 'APP', desc: 'Approach' },
  { suffix: '_gnd', label: 'GND', desc: 'Ground' },
  { suffix: '_del', label: 'DEL', desc: 'Delivery' },
  { suffix: '_dep', label: 'DEP', desc: 'Departure' },
  { suffix: '_atis', label: 'ATIS', desc: 'ATIS' },
  { suffix: '_ctr', label: 'CTR', desc: 'Center' },
  // International airports sometimes use numbered feeds or alternate suffixes
  { suffix: '_radar', label: 'RADAR', desc: 'Radar' },
  { suffix: '_1', label: 'CH1', desc: 'Channel 1' },
  { suffix: '_2', label: 'CH2', desc: 'Channel 2' },
  { suffix: '_3', label: 'CH3', desc: 'Channel 3' },
];

// Cache discovered feeds for 10 minutes
const feedCache = new Map();
const FEED_CACHE_TTL = 10 * 60 * 1000;

function probeFeed(feedName) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'd.liveatc.net',
      port: 443,
      path: '/' + feedName,
      method: 'GET',
      headers: { host: 'd.liveatc.net' },
    }, (res) => {
      res.destroy(); // don't consume the stream
      // 302 = redirect to stream server, 200 = direct stream
      // 429 = rate-limited (NOT reliable — treat as unknown, retry later)
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
  // On rate limit (429), don't retry — return false and let client fallback handle it
  return result === true;
}

async function discoverFeeds(icao) {
  const cacheKey = icao.toUpperCase();
  const cached = feedCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < FEED_CACHE_TTL) return cached.feeds;

  const base = icao.toLowerCase();
  const feeds = [];

  // Probe in batches of 2 with 800ms gaps to avoid LiveATC rate limiting
  for (let i = 0; i < FEED_SUFFIXES.length; i += 2) {
    const batch = FEED_SUFFIXES.slice(i, i + 2);
    const results = await Promise.all(
      batch.map(async ({ suffix, label, desc }) => {
        const feedName = base + suffix;
        const exists = await probeWithRetry(feedName);
        return exists === true ? { feed: feedName, label, desc } : null;
      })
    );
    feeds.push(...results.filter(Boolean));
    if (i + 2 < FEED_SUFFIXES.length) await delay(800);
  }

  feedCache.set(cacheKey, { feeds, ts: Date.now() });
  return feeds;
}

function handleRequest(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  // LiveATC feed discovery endpoint
  const feedMatch = req.url.match(/^\/liveatc-feeds\/([A-Za-z0-9]{3,4})$/);
  if (feedMatch) {
    discoverFeeds(feedMatch[1]).then((feeds) => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=600',
      });
      res.end(JSON.stringify({ icao: feedMatch[1].toUpperCase(), feeds }));
    }).catch((err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // OCHA war country list (requires approved ReliefWeb appname)
  if (req.url.startsWith('/ocha-war-countries')) {
    if (!OCHA_RELIEFWEB_APPNAME) {
      res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({
        authoritative: false,
        source: 'UN/OCHA',
        error: 'OCHA_RELIEFWEB_APPNAME not configured (ReliefWeb API access is gated).',
        iso3: [],
      }));
      return;
    }

    const url = `https://api.reliefweb.int/v2/disasters?appname=${encodeURIComponent(OCHA_RELIEFWEB_APPNAME)}&limit=1000`;
    https.get(url, (rwRes) => {
      let body = '';
      rwRes.on('data', (c) => { body += c; });
      rwRes.on('end', () => {
        if (rwRes.statusCode !== 200) {
          res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
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
            // Use only current/alert disasters
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
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=1800',
          });
          res.end(JSON.stringify({
            authoritative: true,
            source: 'UN/OCHA ReliefWeb',
            updatedAt: Date.now(),
            iso3: Array.from(iso3),
          }));
        } catch (e) {
          res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ authoritative: false, source: 'UN/OCHA ReliefWeb', error: e.message, iso3: [] }));
        }
      });
    }).on('error', (err) => {
      res.writeHead(503, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ authoritative: false, source: 'UN/OCHA ReliefWeb', error: err.message, iso3: [] }));
    });
    return;
  }

  // Check proxy routes
  for (const [prefix, route] of Object.entries(PROXY_ROUTES)) {
    if (req.url.startsWith(prefix)) {
      proxyRequest(req, res, route);
      return;
    }
  }

  // Serve static files
  serveStatic(req, res);
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function tryListen(port) {
  if (port > PORT_END) {
    console.error('\n  [ERROR] All ports 3000-3004 are busy. Close other servers and try again.\n');
    process.exit(1);
  }

  const server = http.createServer(handleRequest);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`  Port ${port} is busy, trying ${port + 1}...`);
      tryListen(port + 1);
    } else {
      console.error(`  [ERROR] ${err.message}`);
      process.exit(1);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    const lanIP = getLocalIP();
    console.log(`
  ============================================
       G H O S T T R A C K   L I V E
  ============================================

  Local:    http://localhost:${port}
  Network:  http://${lanIP}:${port}

  Open the Network URL on your phone
  (same Wi-Fi) to view on mobile!

  Proxying:
    /adsb-api/*    -> api.adsb.lol
    /adsbdb-api/*  -> api.adsbdb.com
    /liveatc/*     -> d.liveatc.net (ATC audio)

  Press Ctrl+C to stop the server.
  ============================================
    `);
  });
}

// Verify dist/ exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('\n  [ERROR] dist/ folder not found. Something is wrong with the package.\n');
  process.exit(1);
}

tryListen(PORT_START);
