# GhostTrack Live

Real-time global flight tracker with a dark ATC radar aesthetic, built with vanilla JavaScript and MapLibre GL.

## Highlights
- Live aircraft rendering with altitude-band styling and callsign labels
- Smooth interpolation between API polls for near-real-time motion
- Detail panel with route/aircraft enrichment, satellite mini-view, and ATC stream hooks
- Theater mode cinematic auto-tour across high-interest targets
- TCAS-style proximity alerts, watchlist anomalies, trails, and POI overlays
- Portable local server option via `server.cjs`

## Tech Stack
- Vite
- MapLibre GL JS
- Vanilla ES modules
- Node.js (optional local proxy/server runtime)

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Notes
- `dist/` is generated output and is ignored by git.
- `node_modules/` is ignored by git.
