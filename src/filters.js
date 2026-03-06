const toggleBtn = document.getElementById('filter-toggle');
const body = document.getElementById('filter-body');

let activeFilters = { low: true, mid: true, high: true };
let onChangeCallback = null;

export function initFilters(onChange) {
  onChangeCallback = onChange;

  toggleBtn.addEventListener('click', () => {
    body.classList.toggle('hidden');
  });

  body.querySelectorAll('input[data-filter]').forEach((input) => {
    input.addEventListener('change', () => {
      activeFilters[input.dataset.filter] = input.checked;
      if (onChangeCallback) onChangeCallback(activeFilters);
    });
  });
}

export function getActiveFilters() {
  return { ...activeFilters };
}
