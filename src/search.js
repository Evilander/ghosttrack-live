const input = document.getElementById('search-input');
const resultsEl = document.getElementById('search-results');

let allAircraft = [];
let onSelectCallback = null;

export function initSearch(onSelect) {
  onSelectCallback = onSelect;

  input.addEventListener('input', () => {
    const query = input.value.trim().toUpperCase();
    if (query.length < 2) {
      resultsEl.classList.add('hidden');
      resultsEl.innerHTML = '';
      return;
    }
    const matches = allAircraft
      .filter((a) => {
        const cs = (a.callsign || '').toUpperCase();
        const icao = (a.icao24 || '').toUpperCase();
        return cs.includes(query) || icao.includes(query);
      })
      .slice(0, 8);

    if (matches.length === 0) {
      resultsEl.classList.add('hidden');
      resultsEl.innerHTML = '';
      return;
    }

    resultsEl.innerHTML = matches
      .map(
        (a) => `
      <div class="search-result-item" data-icao="${a.icao24}">
        <span class="search-result-callsign">${a.callsign || a.icao24}</span>
        <span class="search-result-info">${a.origin_country || ''} · ${a.altitude_ft != null ? a.altitude_ft.toLocaleString() + ' ft' : 'GND'}</span>
      </div>`
      )
      .join('');

    resultsEl.classList.remove('hidden');

    resultsEl.querySelectorAll('.search-result-item').forEach((el) => {
      el.addEventListener('click', () => {
        const icao = el.dataset.icao;
        const aircraft = allAircraft.find((a) => a.icao24 === icao);
        if (aircraft && onSelectCallback) {
          onSelectCallback(aircraft);
        }
        input.value = '';
        resultsEl.classList.add('hidden');
        resultsEl.innerHTML = '';
      });
    });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      resultsEl.classList.add('hidden');
      resultsEl.innerHTML = '';
      input.blur();
    }
  });

  // Close results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar')) {
      resultsEl.classList.add('hidden');
    }
  });
}

export function updateSearchData(aircraft) {
  allAircraft = aircraft;
}
