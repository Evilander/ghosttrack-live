// Unit system: AVIATION (kts, ft, m/s) vs FREEDOM (mph, ft, ft/min)
const KTS_TO_MPH = 1.15078;
const MS_TO_FT_MIN = 196.85;
const M_TO_FT = 3.28084;

let useFreedom = false;

const labelEl = document.getElementById('unit-label');
const indicatorEl = document.getElementById('unit-indicator');
const toggleEl = document.getElementById('unit-toggle');
const btn = document.getElementById('unit-btn');

export function initUnits() {
  btn.addEventListener('click', () => {
    useFreedom = !useFreedom;
    if (useFreedom) {
      labelEl.textContent = 'FREEDOM';
      indicatorEl.textContent = 'MPH / FT';
      toggleEl.classList.add('freedom');
    } else {
      labelEl.textContent = 'AVIATION';
      indicatorEl.textContent = 'KTS / FT';
      toggleEl.classList.remove('freedom');
    }
  });
}

export function isFreedom() {
  return useFreedom;
}

export function formatSpeed(kts) {
  if (kts == null) return '---';
  if (useFreedom) {
    return `${Math.round(kts * KTS_TO_MPH)} mph`;
  }
  return `${kts} kts`;
}

export function formatAltitude(ft) {
  if (ft == null) return '---';
  return `${ft.toLocaleString()} ft`;
}

export function formatVerticalRate(ms) {
  if (ms == null) return '---';
  const ftMin = Math.round(ms * M_TO_FT * 60);
  if (useFreedom) {
    return `${ftMin > 0 ? '+' : ''}${ftMin.toLocaleString()} ft/min`;
  }
  return `${ftMin > 0 ? '+' : ''}${ftMin.toLocaleString()} ft/min`;
}

export function formatHeading(deg) {
  if (deg == null) return '---';
  return `${Math.round(deg)}°`;
}
