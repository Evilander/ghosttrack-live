// Ambient Radar Soundscape — Immersive ATC environment audio
// All sounds generated with Web Audio API — no external files needed

let audioCtx = null;
let masterGain = null;
let noiseGain = null;
let noiseSource = null;
let pingInterval = null;
let active = false;
let volume = 0.5;

function ensureContext() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = volume;
  masterGain.connect(audioCtx.destination);
}

// --- Static noise bed ---
function startNoise() {
  if (noiseSource) return;

  const bufferSize = audioCtx.sampleRate * 2; // 2 seconds of noise
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3; // low amplitude
  }

  noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  // Bandpass filter — radio static character
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  filter.Q.value = 0.5;

  noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0.04; // very quiet

  noiseSource.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(masterGain);
  noiseSource.start();
}

function stopNoise() {
  if (noiseSource) {
    try { noiseSource.stop(); } catch { /* already stopped */ }
    noiseSource = null;
  }
  noiseGain = null;
}

// --- Radar ping (synced to sweep every 4s) ---
function playPingSound() {
  if (!audioCtx || !active) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 1200;

  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.08);
}

// --- Data blip (on successful fetch) ---
export function playDataBlip() {
  if (!audioCtx || !active) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 800;

  gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.04);
}

// --- TCAS proximity alert tone ---
let alertActive = false;
let alertOsc1 = null;
let alertOsc2 = null;
let alertGain = null;

export function playProximityAlert() {
  if (!audioCtx || !active || alertActive) return;
  alertActive = true;

  // Two-tone alarm: alternating 1500Hz / 1800Hz
  alertGain = audioCtx.createGain();
  alertGain.gain.value = 0.15;
  alertGain.connect(masterGain);

  alertOsc1 = audioCtx.createOscillator();
  alertOsc1.type = 'square';
  alertOsc1.frequency.value = 1500;

  alertOsc2 = audioCtx.createOscillator();
  alertOsc2.type = 'square';
  alertOsc2.frequency.value = 1800;

  const gain1 = audioCtx.createGain();
  const gain2 = audioCtx.createGain();

  alertOsc1.connect(gain1);
  alertOsc2.connect(gain2);
  gain1.connect(alertGain);
  gain2.connect(alertGain);

  const now = audioCtx.currentTime;

  // Alternate tones: 200ms each, 4 cycles = 1.6s
  for (let i = 0; i < 4; i++) {
    const t = now + i * 0.4;
    gain1.gain.setValueAtTime(1, t);
    gain1.gain.setValueAtTime(0, t + 0.2);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.setValueAtTime(1, t + 0.2);
  }

  // Fade out
  alertGain.gain.setValueAtTime(0.15, now + 1.6);
  alertGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

  alertOsc1.start(now);
  alertOsc2.start(now);
  alertOsc1.stop(now + 1.8);
  alertOsc2.stop(now + 1.8);

  setTimeout(() => {
    alertActive = false;
    alertOsc1 = null;
    alertOsc2 = null;
    alertGain = null;
  }, 2000);
}

// --- Public API ---

export function initAmbience() {
  // Set up UI
  const btn = document.getElementById('ambience-toggle');
  const slider = document.getElementById('ambience-volume');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (!active) {
      startAmbience();
      btn.classList.add('active');
    } else {
      stopAmbience();
      btn.classList.remove('active');
    }
  });

  if (slider) {
    slider.addEventListener('input', (e) => {
      volume = e.target.value / 100;
      if (masterGain) masterGain.gain.value = volume;
    });
  }
}

function startAmbience() {
  ensureContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  active = true;
  startNoise();

  // Radar ping every 4s (synced with CSS radar sweep)
  playPingSound();
  pingInterval = setInterval(playPingSound, 4000);
}

function stopAmbience() {
  active = false;
  stopNoise();
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

export function setAmbienceVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = volume;
}

export function isAmbienceActive() {
  return active;
}
