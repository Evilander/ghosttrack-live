# GhostTrack Live

Real-time global flight tracker with a dark ATC radar aesthetic, built with vanilla JavaScript and MapLibre GL JS.

## Features

### Core Tracking
- **Live ADS-B data** from adsb.lol — aircraft positions update every 5 seconds with smooth interpolation at 100ms for near-real-time motion
- **Altitude-band coloring** — orange (ground-10k ft), cyan (10k-25k ft), white (25k+ ft)
- **Callsign labels** and heading-rotated chevron icons on the map
- **Click any aircraft** to open a full detail panel with altitude, speed, heading, vertical rate, ICAO hex, and more
- **Follow mode** — lock the camera to any aircraft and track it across the map
- **Search** — find any aircraft by callsign instantly

### Aircraft Enrichment
- **Route & airline data** from adsbdb.com — see origin, destination, airline name, and aircraft type
- **Aircraft photos** when available from the adsbdb database
- **Great circle route arcs** — dashed orange line showing the flight path between origin and destination airports
- **Satellite ground view** — mini-map showing terrain directly below the aircraft
- **Google Earth link** — one-click to open the aircraft's position in Google Earth

### Watchlist & Anomaly Detection
- **Emergency squawk alerts** — 7500 (hijack), 7600 (comms failure), 7700 (emergency) with klaxon sound effect and slide-in banner notification
- **VIP jet tracking** — 18 tracked aircraft including Elon Musk, Jeff Bezos, Bill Gates, Taylor Swift, Drake, Mark Zuckerberg, Oprah, Trump, Kim Kardashian, Jay-Z/Beyonce, Air Force One (x2), and E-4B Nightwatch Doomsday planes (x4)
- **Military detection** — flags military aircraft by ADS-B dbFlags and callsign prefix matching (USAF, NATO, RAF, etc.) with sub-type classification across 150+ ICAO designators: Fighter, Helo, Bomber, Tanker, Recon, Trainer, Transport
- **Private jet detection** — identifies business/private jets by ICAO type designator (Gulfstream, Bombardier, Citation, Learjet, Falcon, etc.)
- **Interesting flight profiles** — extreme altitude (>45k ft), high speed (>600 kts), rapid climb/descent (>5000 fpm)

### Leaderboard
- **Fastest** — highest ground speed aircraft currently airborne
- **Highest** — aircraft at the highest altitude
- **Top MIL (Clements Approved)** — fastest military aircraft in the sky
- **Deep Dive** — steepest descent rate
- **Rocketship** — fastest climbing aircraft
- **Slowpoke** — slowest airborne aircraft
- **Live counts** — military, VIP, and private jet totals
- Click any leaderboard entry to fly to that aircraft

### TCAS Proximity Alerts
- **Traffic Advisory (TA)** — aircraft pairs within 5nm and 1,000ft vertical separation
- **Resolution Advisory (RA)** — aircraft pairs within 2nm and 500ft — triggers audio alarm
- Spatial grid optimization for efficient detection across thousands of aircraft

### Map Overlays
- **Day/night terminator** — solar shadow polygon showing real-time day/night boundary
- **Conflict zones** — highlighted regions for active conflicts (Ukraine, Gaza/Israel, Sudan, Myanmar) with click-for-details popup explaining each conflict
- **Points of interest** — 15 notable locations including Joint Base Andrews, Area 51, Nellis AFB, Mar-a-Lago, Van Nuys, Teterboro, SpaceX HQ, and more
- **VIP landing markers** — tracks where VIP and private jets have landed
- **Aircraft trails** — breadcrumb trail showing recent flight path

### Interactive Modes
- **Theater Mode** — cinematic auto-tour that cycles through VIP jets, emergencies, military aircraft, and interesting flights with 12-second dwell time and letterbox bars
- **Intercept Game** — timed spotter challenge: find and click aircraft matching mission criteria (country, altitude, heading, military, speed). Scoring with streak multipliers and high score tracking

### Live ATC Audio
- **LiveATC integration** — stream real-time ATC audio for airports near the selected aircraft
- **Auto-discovery** — probes for available feeds (Tower, Approach, Ground, Delivery, Departure, ATIS, Center)
- **Real-time frequency visualizer** using Web Audio API
- **Volume control** with visual waveform display

### Ambient Soundscape
- **Radar ping** synced to the sweep animation
- **Static noise bed** — bandpass-filtered radio static
- **Data blip** on each successful fetch
- **TCAS alarm** — two-tone alert on Resolution Advisory
- **Emergency klaxon** — sawtooth wave alarm on new emergency squawk detection

### Co-Op Mode
- **Host mode** — share your session with friends via a room link
- **Follower mode** — join a host's session and see their aircraft selections in real-time
- Server-Sent Events for low-latency sync

### HUD & Interface
- **Dark radar aesthetic** with CRT scanline overlay and radar sweep animation
- **UTC and local clocks** with cursor lat/lon readout
- **Top origins ticker** — shows the most common aircraft origin countries
- **Altitude legend** with color-coded bands
- **Unit toggle** — switch between aviation (knots/feet) and freedom (mph/feet) units
- **Collapsible panels** — watchlist, TCAS, leaderboard, and filters can all be toggled
- **EVLNDR ghost** — a phantom aircraft that orbits your geolocation

## Tech Stack

- **MapLibre GL JS** 5.17 — WebGL map rendering
- **Vite** 7.3 — dev server and build tool
- **Vanilla ES modules** — no framework, ~25 source files
- **Web Audio API** — all sounds synthesized, no external audio files
- **Node.js** — optional local proxy server for portable deployment

## Data Sources

- [adsb.lol](https://adsb.lol) — live ADS-B aircraft positions (free, no API key)
- [adsbdb.com](https://adsbdb.com) — aircraft registration, photos, and route data (free, no API key)
- [LiveATC.net](https://liveatc.net) — real-time ATC audio streams
- ICAO hex address ranges — country-of-origin lookup from hex codes

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

## Portable Deployment

A standalone version can be run without any dev tools:

1. `npm run build` to generate the `dist/` folder
2. Use `server.cjs` with Node.js: `node server.cjs`
3. Or use `START.bat` with the portable `node.exe` for zero-install deployment

## Notes

- `dist/` is generated output and is ignored by git
- `node_modules/` is ignored by git
- Aircraft data refreshes every 5 seconds with 100ms interpolation ticks
- Maximum 3,000 aircraft rendered simultaneously to prevent WebGL crashes
- VIP hex codes are sourced from public ADS-B tracking communities

---

Created by **Evilander**
