// INTERCEPT Mode — Timed Spotter Challenge Game
// Find and click matching aircraft against the clock

const STORAGE_KEY = 'ghosttrack_intercept_highscore';

// Mission definitions by tier
const MISSION_TYPES = [
  // Tier 1 — easy (30s)
  {
    tier: 1, time: 30, label: 'LOCATE: Aircraft from {value}',
    generate(aircraft) {
      const countries = countValues(aircraft, 'origin_country');
      if (!countries.length) return null;
      const value = pick(countries);
      return { value, check: (a) => a.origin_country === value };
    },
  },
  {
    tier: 1, time: 30, label: 'LOCATE: Aircraft above FL{value}',
    generate(aircraft) {
      const alts = [100, 150, 200, 250, 300, 350, 400];
      const viable = alts.filter(fl => aircraft.some(a => a.altitude_ft > fl * 100));
      if (!viable.length) return null;
      const value = pick(viable);
      return { value: String(value), check: (a) => a.altitude_ft > value * 100 };
    },
  },
  // Tier 2 — medium (25s)
  {
    tier: 2, time: 25, label: 'LOCATE: Aircraft heading {value}',
    generate(aircraft) {
      const dirs = [
        { name: 'NORTH', min: 315, max: 45 },
        { name: 'EAST', min: 45, max: 135 },
        { name: 'SOUTH', min: 135, max: 225 },
        { name: 'WEST', min: 225, max: 315 },
      ];
      const viable = dirs.filter(d => aircraft.some(a => headingInRange(a.true_track, d.min, d.max)));
      if (!viable.length) return null;
      const dir = pick(viable);
      return { value: dir.name, check: (a) => headingInRange(a.true_track, dir.min, dir.max) };
    },
  },
  {
    tier: 2, time: 25, label: 'LOCATE: Descending aircraft',
    generate(aircraft) {
      const has = aircraft.some(a => a.vertical_rate_fpm < -500);
      if (!has) return null;
      return { value: '', check: (a) => a.vertical_rate_fpm < -500 };
    },
  },
  {
    tier: 2, time: 25, label: 'LOCATE: Climbing aircraft',
    generate(aircraft) {
      const has = aircraft.some(a => a.vertical_rate_fpm > 500);
      if (!has) return null;
      return { value: '', check: (a) => a.vertical_rate_fpm > 500 };
    },
  },
  // Tier 3 — hard (20s)
  {
    tier: 3, time: 20, label: 'LOCATE: Military aircraft',
    generate(aircraft) {
      const has = aircraft.some(a => a.dbFlags & 1);
      if (!has) return null;
      return { value: '', check: (a) => !!(a.dbFlags & 1) };
    },
  },
  {
    tier: 3, time: 20, label: 'LOCATE: Aircraft faster than {value} kts',
    generate(aircraft) {
      const thresholds = [300, 400, 450, 500];
      const viable = thresholds.filter(t => aircraft.some(a => a.speed_kts > t));
      if (!viable.length) return null;
      const value = pick(viable);
      return { value: String(value), check: (a) => a.speed_kts > value };
    },
  },
  {
    tier: 3, time: 20, label: 'LOCATE: Aircraft between FL{value} and FL{value2}',
    generate(aircraft) {
      const bands = [
        { lo: 100, hi: 200 }, { lo: 200, hi: 300 }, { lo: 300, hi: 400 },
        { lo: 50, hi: 150 },  { lo: 250, hi: 350 },
      ];
      const viable = bands.filter(b =>
        aircraft.some(a => a.altitude_ft > b.lo * 100 && a.altitude_ft < b.hi * 100)
      );
      if (!viable.length) return null;
      const band = pick(viable);
      return {
        value: String(band.lo), value2: String(band.hi),
        check: (a) => a.altitude_ft > band.lo * 100 && a.altitude_ft < band.hi * 100,
      };
    },
  },
  {
    tier: 3, time: 20, label: 'LOCATE: Ground vehicle or taxiing aircraft',
    generate(aircraft) {
      const has = aircraft.some(a => a.on_ground);
      if (!has) return null;
      return { value: '', check: (a) => a.on_ground };
    },
  },
];

// BONUS mission
const BONUS_GHOST_MISSION = {
  tier: 'bonus', time: 15, label: 'INTERCEPT: GHOST SIGNAL',
  check: (a) => a.isGhost === true || a.isGhost === 1,
};

// --- State ---
let gameActive = false;
let missionActive = false;
let score = 0;
let streak = 0;
let missionCount = 0;
let currentMission = null;
let timerStart = 0;
let timerDuration = 0;
let timerRaf = null;
let resultTimeout = null;
let getAllAircraft = null;

// DOM refs
let toggleBtn, panel, missionEl, timerBar, scoreEl, streakEl, resultEl;

export function initIntercept(allAircraftGetter) {
  getAllAircraft = allAircraftGetter;

  toggleBtn = document.getElementById('intercept-toggle');
  panel = document.getElementById('intercept-panel');
  missionEl = document.getElementById('intercept-mission');
  timerBar = document.getElementById('intercept-timer-bar');
  scoreEl = document.getElementById('intercept-score');
  streakEl = document.getElementById('intercept-streak');
  resultEl = document.getElementById('intercept-result');

  // Load high score
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) score = 0; // Always start fresh, high score is just for display

  toggleBtn.addEventListener('click', () => {
    if (gameActive) endGame();
    else startGame();
  });
}

function startGame() {
  gameActive = true;
  score = 0;
  streak = 0;
  missionCount = 0;

  toggleBtn.classList.add('active');
  toggleBtn.textContent = 'END GAME';
  panel.classList.remove('hidden');
  scoreEl.textContent = '0';
  updateStreakDisplay();

  // Start first mission after brief delay
  missionEl.textContent = 'STANDBY...';
  setTimeout(() => startMission(), 1500);
}

function endGame() {
  gameActive = false;
  missionActive = false;

  // Save high score
  const prev = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  if (score > prev) localStorage.setItem(STORAGE_KEY, String(score));

  toggleBtn.classList.remove('active');
  toggleBtn.textContent = 'INTERCEPT';
  panel.classList.add('hidden');
  currentMission = null;

  if (timerRaf) { cancelAnimationFrame(timerRaf); timerRaf = null; }
  if (resultTimeout) { clearTimeout(resultTimeout); resultTimeout = null; }
  resultEl.className = 'intercept-result hidden';
}

function startMission() {
  if (!gameActive) return;

  const aircraft = getAllAircraft().filter(a => !a.isGhost);

  // Determine available tiers based on progression
  let maxTier;
  if (missionCount < 3) maxTier = 1;
  else if (missionCount < 7) maxTier = 2;
  else maxTier = 3;

  // Check for ghost bonus (10% chance if ghost visible)
  const ghostVisible = getAllAircraft().some(a => a.isGhost);
  if (ghostVisible && Math.random() < 0.10) {
    currentMission = { ...BONUS_GHOST_MISSION };
    missionCount++;
    launchMission(BONUS_GHOST_MISSION.label, BONUS_GHOST_MISSION.time);
    return;
  }

  // Filter missions by available tiers and generate from current data
  const candidates = MISSION_TYPES.filter(m => m.tier <= maxTier);
  // Shuffle and try each until one generates successfully
  const shuffled = shuffle([...candidates]);

  for (const mtype of shuffled) {
    const result = mtype.generate(aircraft);
    if (result) {
      let label = mtype.label.replace('{value}', result.value);
      if (result.value2) label = label.replace('{value2}', result.value2);
      currentMission = { check: result.check, time: mtype.time, tier: mtype.tier };
      missionCount++;
      launchMission(label, mtype.time);
      return;
    }
  }

  // Fallback — no mission could be generated (very unlikely)
  missionEl.textContent = 'NO TARGETS — SCANNING...';
  setTimeout(() => startMission(), 3000);
}

function launchMission(label, seconds) {
  missionActive = true;
  timerStart = Date.now();
  timerDuration = seconds * 1000;

  missionEl.textContent = label;
  timerBar.style.width = '100%';
  timerBar.className = 'intercept-timer-bar';

  // Start timer animation
  updateTimerBar();
}

function updateTimerBar() {
  if (!missionActive || !gameActive) return;

  const elapsed = Date.now() - timerStart;
  const remaining = Math.max(0, timerDuration - elapsed);
  const pct = remaining / timerDuration;

  timerBar.style.width = (pct * 100) + '%';

  // Color transitions
  if (pct < 0.2) {
    timerBar.className = 'intercept-timer-bar critical';
  } else if (pct < 0.5) {
    timerBar.className = 'intercept-timer-bar warning';
  } else {
    timerBar.className = 'intercept-timer-bar';
  }

  if (remaining <= 0) {
    onTimeout();
    return;
  }

  timerRaf = requestAnimationFrame(updateTimerBar);
}

export function isInterceptActive() {
  return gameActive && missionActive;
}

export function checkInterceptTarget(aircraft) {
  if (!gameActive || !missionActive || !currentMission) return false;

  if (currentMission.check(aircraft)) {
    onHit();
    return true;
  } else {
    onMiss();
    return false;
  }
}

function onHit() {
  missionActive = false;
  if (timerRaf) { cancelAnimationFrame(timerRaf); timerRaf = null; }

  const elapsed = Date.now() - timerStart;
  const remainingSec = Math.max(0, (timerDuration - elapsed) / 1000);

  // Scoring
  streak++;
  const multiplier = Math.min(streak, 5);
  const timeBonus = Math.floor(remainingSec * 10);
  const isBonus = currentMission.tier === 'bonus';
  const base = isBonus ? 500 : 100;
  const points = (base + timeBonus) * multiplier;
  score += points;

  scoreEl.textContent = String(score);
  updateStreakDisplay();

  showResult('HIT', 'hit');

  // Next mission after flash
  setTimeout(() => {
    if (gameActive) startMission();
  }, 1200);
}

function onMiss() {
  showResult('NEGATIVE', 'miss');
  // Don't stop mission — player can retry, timer keeps going
}

function onTimeout() {
  missionActive = false;
  if (timerRaf) { cancelAnimationFrame(timerRaf); timerRaf = null; }

  streak = 0;
  updateStreakDisplay();

  showResult('TIME UP', 'timeout');

  // Next mission after pause
  setTimeout(() => {
    if (gameActive) startMission();
  }, 3000);
}

function showResult(text, type) {
  if (resultTimeout) clearTimeout(resultTimeout);

  resultEl.textContent = text;
  resultEl.className = `intercept-result ${type}`;

  const duration = type === 'timeout' ? 2500 : type === 'miss' ? 800 : 1200;
  resultTimeout = setTimeout(() => {
    resultEl.className = 'intercept-result hidden';
  }, duration);
}

function updateStreakDisplay() {
  const multiplier = Math.min(streak, 5);
  streakEl.textContent = `×${multiplier || 1}`;

  if (multiplier >= 4) {
    streakEl.className = 'intercept-streak fire';
  } else if (multiplier >= 2) {
    streakEl.className = 'intercept-streak hot';
  } else {
    streakEl.className = 'intercept-streak';
  }
}

// --- Utilities ---

function countValues(aircraft, key) {
  const counts = {};
  for (const a of aircraft) {
    const v = a[key];
    if (v) counts[v] = (counts[v] || 0) + 1;
  }
  return Object.keys(counts).filter(k => k && k !== 'UNKNOWN');
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function headingInRange(heading, min, max) {
  if (heading == null) return false;
  if (min > max) {
    // Wraps around 0 (e.g., NORTH: 315-45)
    return heading >= min || heading < max;
  }
  return heading >= min && heading < max;
}
