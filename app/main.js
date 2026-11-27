// StatAtlas router and state. One hash router, one state object, every control wired:
// the header year picker, search, region and metric selects, sortable columns,
// compare checkboxes, chart-type toggles and the compare pickers. Re-rendering is
// cheap (a dozen countries), so every control simply updates state and re-renders.
//
//   #/                  Overview
//   #/countries         Searchable, sortable table of all 12 countries
//   #/country/<CODE>    One country's profile, 2019-2024 charts and tables
//   #/compare           Two or three countries side by side
//   #/rankings          All countries ranked by one indicator
//   #/sources           Sources and methods
//
// window.__shotReady is false while a page renders and true once it is on screen,
// so a screenshot script knows when to capture.

import { COUNTRIES, YEARS } from './data.js';
import { overviewView, countriesView, countryView, compareView, rankingsView, sourcesView } from './views.js';

const app = document.getElementById('app');
const yearSelect = document.getElementById('yearSelect');

const state = {
  year: 2024,
  metric: 'gdppc',
  search: '',
  region: 'All',
  sortKey: 'gdppc',
  sortDir: 'desc',
  compare: new Set(['IDN', 'SGP', 'USA']),
  chartType: 'bars',
};

yearSelect.innerHTML = YEARS.map((y) => `<option value="${y}"${y === state.year ? ' selected' : ''}>${y}</option>`).join('');
yearSelect.addEventListener('change', () => {
  state.year = Number(yearSelect.value);
  render();
});

function route() {
  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\//, '').split('/');
  if (parts[0] === '' || parts[0] === 'overview') return { name: 'overview' };
  if (parts[0] === 'countries') return { name: 'countries' };
  if (parts[0] === 'country') return { name: 'country', code: (parts[1] || '').toUpperCase() };
  if (parts[0] === 'compare') return { name: 'compare' };
  if (parts[0] === 'rankings') return { name: 'rankings' };
  if (parts[0] === 'sources') return { name: 'sources' };
  return { name: 'overview' };
}

const TITLES = {
  overview: 'StatAtlas — National Statistics Explorer',
  countries: 'Countries | StatAtlas',
  compare: 'Compare countries | StatAtlas',
  rankings: 'Rankings | StatAtlas',
  sources: 'Sources & methods | StatAtlas',
};

let currentDraw = () => {};

function render() {
  window.__shotReady = false;
  const r = route();
  let view;
  if (r.name === 'countries') view = countriesView(state);
  else if (r.name === 'country') view = countryView(r.code, state);
  else if (r.name === 'compare') view = compareView(state);
  else if (r.name === 'rankings') view = rankingsView(state);
  else if (r.name === 'sources') view = sourcesView(state);
  else view = overviewView(state);

  app.innerHTML = view.html;
  document.title = r.name === 'country'
    ? `${(COUNTRIES.find((c) => c.code === r.code) || { name: 'Country' }).name} | StatAtlas`
    : TITLES[r.name] || TITLES.overview;
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === r.name || (r.name === 'country' && a.dataset.nav === 'countries'));
  });
  currentDraw = view.draw;
  requestAnimationFrame(() => {
    try { view.draw(); } catch (e) { console.error(e); }
    window.scrollTo(0, 0);
    window.__shotReady = true;
  });
}

// All controls inside #app are wired here by delegation, so no view needs its own listeners.
app.addEventListener('input', (e) => {
  if (e.target.id === 'searchInput') {
    state.search = e.target.value;
    const caret = e.target.selectionStart;
    render();
    const again = document.getElementById('searchInput');
    if (again) {
      again.focus();
      again.setSelectionRange(caret, caret);
    }
  }
});

app.addEventListener('change', (e) => {
  const t = e.target;
  if (t.id === 'regionSelect') { state.region = t.value; render(); }
  else if (t.id === 'metricSelect') { state.metric = t.value; render(); }
  else if (t.id === 'cmpA' || t.id === 'cmpB' || t.id === 'cmpC') {
    const unique = [...new Set(['cmpA', 'cmpB', 'cmpC'].map((id) => document.getElementById(id)?.value).filter(Boolean))];
    state.compare = new Set(unique);
    render();
  } else if (t.classList.contains('compare-check')) {
    if (t.checked && state.compare.size >= 3) {
      t.checked = false;
      return;
    }
    if (t.checked) state.compare.add(t.dataset.code);
    else state.compare.delete(t.dataset.code);
    render();
  }
});

app.addEventListener('click', (e) => {
  const sortBtn = e.target.closest('[data-sort]');
  if (sortBtn) {
    const key = sortBtn.dataset.sort;
    if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    else {
      state.sortKey = key;
      state.sortDir = key === 'name' || key === 'region' ? 'asc' : 'desc';
    }
    state.metric = ['pop', 'gdp', 'gdppc', 'life', 'unemp', 'infl', 'growth', 'internet'].includes(key) ? key : state.metric;
    render();
    return;
  }
  if (e.target.id === 'compareBtn') { location.hash = '#/compare'; return; }
  if (e.target.id === 'chartBars' || e.target.id === 'chartLines') {
    state.chartType = e.target.id === 'chartBars' ? 'bars' : 'lines';
    render();
  }
});

window.addEventListener('hashchange', render);
window.addEventListener('resize', () => {
  try { currentDraw(); } catch (e) { /* ignore */ }
});

render();
