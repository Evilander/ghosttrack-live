/**
 * GhostTrack Live — Portable Server
 * Zero-dependency HTTP server + API proxy
 * Uses only built-in Node.js modules
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

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
  '/adsb-api': { host: 'api.adsb.lol', prefix: '/adsb-api' },
  '/adsbdb-api': { host: 'api.adsbdb.com', prefix: '/adsbdb-api' },
};

function proxyRequest(clientReq, clientRes, route) {
  const targetPath = clientReq.url.replace(new RegExp('^' + route.prefix), '') || '/';

  const options = {
    hostname: route.host,
    port: 443,
    path: targetPath,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: route.host,
    },
  };

  // Remove headers that don't belong on the upstream request
  delete options.headers['referer'];
  delete options.headers['origin'];

  const proxyReq = https.request(options, (proxyRes) => {
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
    console.error(`  [PROXY ERROR] ${route.host}${targetPath} — ${err.message}`);
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

  server.listen(port, () => {
    console.log(`
  ============================================
       G H O S T T R A C K   L I V E
  ============================================

  Server running at:  http://localhost:${port}

  Proxying:
    /adsb-api/*    -> api.adsb.lol
    /adsbdb-api/*  -> api.adsbdb.com

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
