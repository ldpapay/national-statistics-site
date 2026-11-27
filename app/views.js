// Page renderers for StatAtlas. Each view returns { html, draw } — html goes into
// #app and draw() runs after it is on screen, so canvas charts can measure their box.
// Every figure carries its source and year; nothing here is placeholder.

import { COUNTRIES, YEARS } from './data.js';
import { fmtValue, fmtInt, fmtUsdBn, fmtMillions, changeText, changeClass, escapeHtml } from './format.js';
import { drawBarChart, drawLineChart } from './charts.js';

export const METRICS = [
  { key: 'pop', label: 'Population', unit: 'people', blurb: 'Everyone living in the country, mid-year.', code: 'SP.POP.TOTL' },
  { key: 'gdp', label: 'GDP', unit: 'current US$', blurb: 'Total economic output at current prices.', code: 'NY.GDP.MKTP.CD' },
  { key: 'gdppc', label: 'GDP per capita', unit: 'current US$', blurb: 'Output per person — a rough gauge of average income.', code: 'NY.GDP.PCAP.CD' },
  { key: 'life', label: 'Life expectancy', unit: 'years at birth', blurb: 'How long a newborn can expect to live.', code: 'SP.DYN.LE00.IN' },
  { key: 'unemp', label: 'Unemployment', unit: '% of labour force', blurb: 'Share of the labour force without work (ILO modelled).', code: 'SL.UEM.TOTL.ZS' },
  { key: 'infl', label: 'Inflation', unit: '% per year', blurb: 'Consumer prices, annual change.', code: 'FP.CPI.TOTL.ZG' },
  { key: 'growth', label: 'GDP growth', unit: '% per year', blurb: 'Real GDP growth, annual change.', code: 'NY.GDP.MKTP.KD.ZG' },
  { key: 'internet', label: 'Internet users', unit: '% of population', blurb: 'People using the internet.', code: 'IT.NET.USER.ZS' },
];

export const metricByKey = (key) => METRICS.find((m) => m.key === key) || METRICS[0];
const yi = (year) => YEARS.indexOf(year);
const val = (c, metric, year) => c[metric][yi(year)];
const byCode = (code) => COUNTRIES.find((c) => c.code === code);
const countryLink = (c) => `#/country/${c.code}`;
const fmtTickFor = (metric) => (v) => {
  if (metric === 'pop') return fmtMillions(v / 1e6);
  if (metric === 'gdp') return '$' + Math.round(v / 1e9) + 'B';
  if (metric === 'gdppc') return '$' + Math.round(v / 1000) + 'k';
  return v.toFixed(metric === 'life' ? 0 : 1);
};

function metricOptions(selected) {
  return METRICS.map((m) => `<option value="${m.key}"${m.key === selected ? ' selected' : ''}>${m.label}</option>`).join('');
}

function countryOptions(selectedCodes) {
  return COUNTRIES.map(
    (c) => `<option value="${c.code}"${selectedCodes.includes(c.code) ? ' selected' : ''}>${c.name}</option>`,
  ).join('');
}

function sourceLine() {
  return `<p class="src-note">Source: World Bank, World Development Indicators (WDI), retrieved 27 Nov 2026. Figures are the latest available for the year shown.</p>`;
}

// ---------- Overview ----------
export function overviewView(state) {
  const year = state.year;
  const totalPop = COUNTRIES.reduce((s, c) => s + val(c, 'pop', year), 0);
  const totalGdp = COUNTRIES.reduce((s, c) => s + val(c, 'gdp', year), 0);
  const longestLife = [...COUNTRIES].sort((a, b) => val(b, 'life', year) - val(a, 'life', year))[0];
  const lowestUnemp = [...COUNTRIES].sort((a, b) => val(a, 'unemp', year) - val(b, 'unemp', year))[0];
  const topGdppc = [...COUNTRIES].sort((a, b) => val(b, 'gdppc', year) - val(a, 'gdppc', year)).slice(0, 5);
  const biggest = [...COUNTRIES].sort((a, b) => val(b, 'gdp', year) - val(a, 'gdp', year)).slice(0, 5);
  const fastest = [...COUNTRIES].sort((a, b) => val(b, 'growth', year) - val(a, 'growth', year))[0];

  const html = `
<h1>How 12 countries actually compare</h1>
<p class="lede">Population, economies, health and work — real figures from the World Bank, 2019–${year},
for twelve countries across Asia, Europe and North America. Pick a year, pick a country, and see the numbers.</p>

<section class="kpis" aria-label="Headline figures for ${year}">
  <div class="kpi accent"><div class="k-label">Combined population</div><div class="k-value">${fmtMillions(totalPop / 1e6)}</div><div class="k-sub">12 countries · ${year}</div></div>
  <div class="kpi"><div class="k-label">Combined GDP</div><div class="k-value">${fmtUsdBn(totalGdp)}</div><div class="k-sub">current US$ · ${year}</div></div>
  <div class="kpi teal"><div class="k-label">Longest life expectancy</div><div class="k-value">${val(longestLife, 'life', year).toFixed(1)} yrs</div><div class="k-sub">${escapeHtml(longestLife.name)} · ${year}</div></div>
  <div class="kpi"><div class="k-label">Lowest unemployment</div><div class="k-value">${val(lowestUnemp, 'unemp', year).toFixed(1)}%</div><div class="k-sub">${escapeHtml(lowestUnemp.name)} · ${year}</div></div>
</section>

<div class="grid2">
  <section class="panel">
    <h2>Richest per person, ${year}</h2>
    <p class="muted">GDP per capita, current US$. Singapore leads the twelve by a wide margin.</p>
    <canvas class="chart" id="chart-top-gdppc" aria-label="Bar chart of GDP per capita"></canvas>
    <p class="legend">Click a country card below to open its full profile.</p>
  </section>
  <section class="panel">
    <h2>Biggest economies, ${year}</h2>
    <table>
      <thead><tr><th>#</th><th>Country</th><th class="num">GDP</th><th class="num">Per person</th></tr></thead>
      <tbody>
        ${biggest.map((c, i) => `<tr><td><span class="rank-badge${i < 3 ? ' top' : ''}">${i + 1}</span></td>
          <td><a href="${countryLink(c)}">${escapeHtml(c.name)}</a></td>
          <td class="num">${fmtUsdBn(val(c, 'gdp', year))}</td>
          <td class="num">${fmtValue('gdppc', val(c, 'gdppc', year))}</td></tr>`).join('')}
      </tbody>
    </table>
    <p class="src-note">China's economy is about ${Math.round(val(byCode('CHN'), 'gdp', year) / val(byCode('IDN'), 'gdp', year))}× Indonesia's; the United States is about ${(val(byCode('USA'), 'gdp', year) / val(byCode('CHN'), 'gdp', year)).toFixed(1)}× China's.</p>
  </section>
</div>

<section class="panel">
  <h2>Fastest grower in ${year}: ${escapeHtml(fastest.name)} — ${val(fastest, 'growth', year).toFixed(1)}% real GDP growth</h2>
  <p>Vietnam grew ${val(fastest, 'growth', year).toFixed(1)}% in ${year}, ahead of Singapore (${val(byCode('SGP'), 'growth', year).toFixed(1)}%) and Malaysia (${val(byCode('MYS'), 'growth', year).toFixed(1)}%). Indonesia grew ${val(byCode('IDN'), 'growth', year).toFixed(1)}% — steady, and above the ${year} world pace. <a href="#/rankings">See every ranking →</a></p>
</section>

<h2>All 12 countries</h2>
<div class="card-grid">
  ${COUNTRIES.map((c) => `<a class="country-card" href="${countryLink(c)}">
    <div class="cc-name">${escapeHtml(c.name)}</div>
    <div class="cc-meta">${escapeHtml(c.capital)} · ${escapeHtml(c.region)}</div>
    <div class="cc-stat">${fmtMillions(val(c, 'pop', year) / 1e6)} <small>people</small></div>
    <div class="cc-meta">${fmtValue('gdppc', val(c, 'gdppc', year))} per person · ${val(c, 'life', year).toFixed(1)} yrs life expectancy</div>
  </a>`).join('')}
</div>
${sourceLine()}`;

  return {
    html,
    draw() {
      drawBarChart(document.getElementById('chart-top-gdppc'), topGdppc.map((c) => c.name.replace('United States', 'USA').replace('South Korea', 'S. Korea')), topGdppc.map((c) => val(c, 'gdppc', year)), {
        formatTick: (v) => '$' + Math.round(v / 1000) + 'k',
        formatValue: (v) => '$' + Math.round(v).toLocaleString('en-US'),
        highlight: 0,
      });
    },
  };
}

// ---------- Countries table ----------
export function countriesView(state) {
  const year = state.year;
  const metric = metricByKey(state.metric);
  let rows = COUNTRIES.filter((c) => {
    const q = state.search.trim().toLowerCase();
    const okSearch = !q || c.name.toLowerCase().includes(q) || c.capital.toLowerCase().includes(q);
    const okRegion = state.region === 'All' || c.region === state.region;
    return okSearch && okRegion;
  });
  const key = state.sortKey;
  rows = [...rows].sort((a, b) => {
    const av = key === 'name' ? a.name : key === 'region' ? a.region : val(a, key, year);
    const bv = key === 'name' ? b.name : key === 'region' ? b.region : val(b, key, year);
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
    return state.sortDir === 'asc' ? cmp : -cmp;
  });
  const regions = ['All', ...new Set(COUNTRIES.map((c) => c.region))];
  const sortArrow = (k) => (state.sortKey === k ? (state.sortDir === 'asc' ? ' ▲' : ' ▼') : '');

  const html = `
<h1>Countries</h1>
<p class="lede">Every country in the atlas, for ${year}. Search, filter by region, sort any column, or tick up to three countries and compare them side by side.</p>
<div class="toolbar">
  <label class="field">Search<input type="search" id="searchInput" placeholder="Country or capital…" value="${escapeHtml(state.search)}" aria-label="Search countries"></label>
  <label class="field">Region<select id="regionSelect">${regions.map((r) => `<option${r === state.region ? ' selected' : ''}>${r}</option>`).join('')}</select></label>
  <label class="field">Sort by metric<select id="metricSelect">${metricOptions(state.metric)}</select></label>
  <button class="btn amber" id="compareBtn" ${state.compare.size < 2 ? 'disabled' : ''}>Compare ${state.compare.size} selected →</button>
</div>
<p class="muted">${rows.length} of 12 countries shown · ${escapeHtml(metric.label)} shown in the highlighted column · ${year}</p>
<div style="overflow-x:auto">
<table>
  <thead><tr>
    <th><span class="src-note">Compare</span></th>
    <th><button data-sort="name">Country${sortArrow('name')}</button></th>
    <th><button data-sort="region">Region${sortArrow('region')}</button></th>
    ${METRICS.map((m) => `<th class="num"><button data-sort="${m.key}">${m.label}${sortArrow(m.key)}</button></th>`).join('')}
  </tr></thead>
  <tbody>
    ${rows.map((c) => `<tr>
      <td><input type="checkbox" class="compare-check" data-code="${c.code}" ${state.compare.has(c.code) ? 'checked' : ''} aria-label="Compare ${escapeHtml(c.name)}"></td>
      <td><a href="${countryLink(c)}"><strong>${escapeHtml(c.name)}</strong></a><br><span class="muted">${escapeHtml(c.capital)}</span></td>
      <td>${escapeHtml(c.region)}</td>
      ${METRICS.map((m) => `<td class="num"${m.key === state.metric ? ' style="background:#fdf0d3;font-weight:700"' : ''}>${fmtValue(m.key, val(c, m.key, year))}</td>`).join('')}
    </tr>`).join('') || '<tr><td colspan="11">No countries match that search. Try clearing the search or the region filter.</td></tr>'}
  </tbody>
</table>
</div>
<p class="src-note">Change vs ${year - 1} is shown on each country page. ${sourceLine()}</p>`;
  return { html, draw() {} };
}

// ---------- Country profile ----------
export function countryView(code, state) {
  const c = byCode(code);
  if (!c) {
    return { html: `<h1>Country not found</h1><p>There is no country with code “${escapeHtml(code)}” in this atlas. <a href="#/countries">See all countries</a>.</p>`, draw() {} };
  }
  const year = state.year;
  const prev = year - 1;
  const metric = metricByKey(state.metric);
  const series = c[metric.key];
  const chartLabel = metric.label;

  const kpi = (label, value, sub) => `<div class="kpi"><div class="k-label">${label}</div><div class="k-value">${value}</div><div class="k-sub">${sub}</div></div>`;

  const html = `
<p class="breadcrumb"><a href="#/countries">← All countries</a></p>
<h1>${escapeHtml(c.name)}</h1>
<p><span class="pill">${escapeHtml(c.region)}</span><span class="pill amber">${escapeHtml(c.income)}</span> Capital: ${escapeHtml(c.capital)} · Land area: ${fmtInt(c.areaKm2)} km²</p>

<section class="stat-list" aria-label="Key figures for ${year}">
  ${kpi('Population', fmtMillions(val(c, 'pop', year) / 1e6), `${year} · ${changeText('pop', val(c, 'pop', prev), val(c, 'pop', year))} vs ${prev}`)}
  ${kpi('GDP', fmtUsdBn(val(c, 'gdp', year)), `${fmtValue('gdppc', val(c, 'gdppc', year))} per person`)}
  ${kpi('Life expectancy', val(c, 'life', year).toFixed(1) + ' yrs', `${changeText('life', val(c, 'life', prev), val(c, 'life', year))} vs ${prev}`)}
  ${kpi('Unemployment', val(c, 'unemp', year).toFixed(1) + '%', `Inflation ${val(c, 'infl', year).toFixed(1)}% · ${year}`)}
</section>

<section class="panel">
  <h2>${escapeHtml(chartLabel)} in ${escapeHtml(c.name)}, 2019–${year}</h2>
  <p class="muted">${escapeHtml(metric.blurb)}</p>
  <div class="toolbar">
    <label class="field">Indicator<select id="metricSelect">${metricOptions(state.metric)}</select></label>
    <div class="seg" role="group" aria-label="Chart type">
      <button id="chartBars" aria-pressed="${state.chartType === 'bars'}">Bars</button>
      <button id="chartLines" aria-pressed="${state.chartType === 'lines'}">Lines</button>
    </div>
  </div>
  <canvas class="chart tall" id="chart-country" aria-label="Chart of ${escapeHtml(chartLabel)} 2019 to ${year}"></canvas>
  <p class="legend">Each bar is one year. ${escapeHtml(c.name)}'s ${metric.label.toLowerCase()} in ${year} was ${fmtValue(metric.key, val(c, metric.key, year))}, ${changeText(metric.key, val(c, metric.key, prev), val(c, metric.key, year))} on ${prev}.</p>
</section>

<div class="grid2">
  <section class="panel">
    <h2>Year by year</h2>
    <table class="fact-table">
      <thead><tr><th>Year</th><th class="num">${escapeHtml(metric.label)}</th><th class="num">Change</th></tr></thead>
      <tbody>
        ${YEARS.map((y, i) => `<tr><td>${y}</td><td class="num"><strong>${fmtValue(metric.key, series[i])}</strong></td>
          <td class="num"><span class="${changeClass(metric.key, i ? series[i - 1] : null, series[i])}">${i ? changeText(metric.key, series[i - 1], series[i]) : '—'}</span></td></tr>`).join('')}
      </tbody>
    </table>
  </section>
  <section class="panel">
    <h2>At a glance, ${year}</h2>
    <table class="fact-table"><tbody>
      ${METRICS.map((m) => `<tr><td>${m.label}</td><td class="num"><strong>${fmtValue(m.key, val(c, m.key, year))}</strong></td></tr>`).join('')}
      <tr><td>Population density</td><td class="num"><strong>${fmtInt(val(c, 'pop', year) / c.areaKm2)} / km²</strong></td></tr>
    </tbody></table>
    <p style="margin-top:.8rem"><a class="btn" href="#/compare">Compare ${escapeHtml(c.name)} with others →</a></p>
  </section>
</div>
<div class="callout"><strong>How to read this:</strong> ${escapeHtml(c.name)} is ${escapeHtml(c.income.toLowerCase())}. Its GDP per capita of ${fmtValue('gdppc', val(c, 'gdppc', year))} sits ${val(c, 'gdppc', year) >= 40000 ? 'among the richest in this atlas' : val(c, 'gdppc', year) >= 10000 ? 'in the middle of this atlas' : 'towards the lower end of this atlas'} — compare it with its neighbours on the <a href="#/compare">Compare page</a>.</div>
${sourceLine()}`;

  return {
    html,
    draw() {
      const canvas = document.getElementById('chart-country');
      const labels = YEARS.map(String);
      if (state.chartType === 'lines') {
        drawLineChart(canvas, labels, [{ name: c.name, values: series }], { formatTick: fmtTickFor(metric.key) });
      } else {
        drawBarChart(canvas, labels, series, { formatTick: fmtTickFor(metric.key), formatValue: (v) => fmtValue(metric.key, v), highlight: YEARS.length - 1 });
      }
    },
  };
}

// ---------- Compare ----------
export function compareView(state) {
  const year = state.year;
  const metric = metricByKey(state.metric);
  const selected = [...state.compare].map(byCode).filter(Boolean);
  const html = `
<h1>Compare countries</h1>
<p class="lede">Pick two or three countries and one indicator. The chart and the table update together, for ${year} — and the lines view shows the whole 2019–${year} story.</p>
<div class="toolbar">
  <label class="field">Country A<select id="cmpA">${countryOptions(selected[0] ? [selected[0].code] : [])}</select></label>
  <label class="field">Country B<select id="cmpB">${countryOptions(selected[1] ? [selected[1].code] : [])}</select></label>
  <label class="field">Country C (optional)<select id="cmpC"><option value="">— none —</option>${countryOptions(selected[2] ? [selected[2].code] : [])}</select></label>
  <label class="field">Indicator<select id="metricSelect">${metricOptions(state.metric)}</select></label>
  <div class="seg" role="group" aria-label="Chart type">
    <button id="chartBars" aria-pressed="${state.chartType === 'bars'}">Bars (${year})</button>
    <button id="chartLines" aria-pressed="${state.chartType === 'lines'}">Lines (2019–${year})</button>
  </div>
</div>
${selected.length < 2 ? '<p class="callout"><strong>Pick at least two countries</strong> — choose Country A and Country B above, or tick countries on the <a href="#/countries">Countries page</a>.</p>' : `
<section class="panel">
  <h2>${escapeHtml(metric.label)}, ${year}</h2>
  <canvas class="chart tall" id="chart-compare" aria-label="Comparison chart"></canvas>
</section>
<section class="panel">
  <h2>Side by side, ${year}</h2>
  <div style="overflow-x:auto"><table>
    <thead><tr><th>Indicator</th>${selected.map((c) => `<th class="num"><a href="${countryLink(c)}">${escapeHtml(c.name)}</a></th>`).join('')}</tr></thead>
    <tbody>
      ${METRICS.map((m) => `<tr${m.key === metric.key ? ' style="background:#fdf0d3"' : ''}><td>${m.label}</td>${selected.map((c) => `<td class="num"><strong>${fmtValue(m.key, val(c, m.key, year))}</strong></td>`).join('')}</tr>`).join('')}
    </tbody>
  </table></div>
  <p>${verdict(selected, metric, year)}</p>
</section>`}
${sourceLine()}`;

  return {
    html,
    draw() {
      if (selected.length < 2) return;
      const canvas = document.getElementById('chart-compare');
      if (state.chartType === 'lines') {
        drawLineChart(canvas, YEARS.map(String), selected.map((c) => ({ name: c.name, values: c[metric.key] })), { formatTick: fmtTickFor(metric.key) });
      } else {
        drawBarChart(canvas, selected.map((c) => c.name.replace('United States', 'USA').replace('South Korea', 'S. Korea')), selected.map((c) => val(c, metric.key, year)), {
          formatTick: fmtTickFor(metric.key),
          formatValue: (v) => fmtValue(metric.key, v),
          highlight: 0,
        });
      }
    },
  };
}

function verdict(selected, metric, year) {
  const ranked = [...selected].sort((a, b) => val(b, metric.key, year) - val(a, metric.key, year));
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];
  const ratio = val(top, metric.key, year) / val(bottom, metric.key, year);
  return `<strong>Reading:</strong> ${escapeHtml(top.name)} leads on ${metric.label.toLowerCase()} at ${fmtValue(metric.key, val(top, metric.key, year))}, ${ratio >= 1.05 ? `${ratio.toFixed(1)}× ${escapeHtml(bottom.name)}'s ${fmtValue(metric.key, val(bottom, metric.key, year))}` : `just ahead of ${escapeHtml(bottom.name)} (${fmtValue(metric.key, val(bottom, metric.key, year))})`}.`;
}

// ---------- Rankings ----------
export function rankingsView(state) {
  const year = state.year;
  const metric = metricByKey(state.metric);
  const ranked = [...COUNTRIES].sort((a, b) => val(b, metric.key, year) - val(a, metric.key, year));
  const max = val(ranked[0], metric.key, year);
  const html = `
<h1>Rankings</h1>
<p class="lede">All twelve countries, ranked by one indicator at a time. Change the indicator to re-rank the whole table — highest first.</p>
<div class="toolbar">
  <label class="field">Rank by<select id="metricSelect">${metricOptions(state.metric)}</select></label>
</div>
<section class="panel">
  <h2>${escapeHtml(metric.label)} — ${year} <span class="muted" style="font-weight:400">(${escapeHtml(metric.unit)})</span></h2>
  <p class="muted">${escapeHtml(metric.blurb)}</p>
  <table>
    <thead><tr><th>#</th><th>Country</th><th class="num">${escapeHtml(metric.label)}</th><th style="width:38%">Share of leader</th><th class="num">vs ${year - 1}</th></tr></thead>
    <tbody>
      ${ranked.map((c, i) => {
        const v = val(c, metric.key, year);
        const prev = val(c, metric.key, year - 1);
        return `<tr>
          <td><span class="rank-badge${i < 3 ? ' top' : ''}">${i + 1}</span></td>
          <td><a href="${countryLink(c)}"><strong>${escapeHtml(c.name)}</strong></a></td>
          <td class="num"><strong>${fmtValue(metric.key, v)}</strong></td>
          <td><div style="background:#eee7d3;border-radius:999px;height:12px"><div style="width:${Math.max(2, (v / max) * 100).toFixed(1)}%;height:12px;border-radius:999px;background:${i === 0 ? '#d98e04' : '#0e7c86'}"></div></div></td>
          <td class="num"><span class="${changeClass(metric.key, prev, v)}">${changeText(metric.key, prev, v)}</span></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
</section>
<p class="muted">The bars show each country as a share of the leader — useful when the raw numbers are far apart, as with population (China 1.41 bn vs Singapore 6.0 m).</p>
${sourceLine()}`;
  return { html, draw() {} };
}

// ---------- Sources ----------
export function sourcesView() {
  const html = `
<h1>Sources &amp; methods</h1>
<p class="lede">StatAtlas shows real figures, not estimates made up for a demo. This page says where every number comes from, what it means, and what it cannot do.</p>

<section class="panel">
  <h2>Where the numbers come from</h2>
  <p>Every figure on this site comes from the <strong>World Bank's World Development Indicators (WDI)</strong>, retrieved from the World Bank API (api.worldbank.org) on 27 November 2026. The WDI in turn draws on national statistical offices, the International Labour Organization (unemployment), the International Monetary Fund (inflation) and the United Nations Population Division (population). The dataset covers 12 countries and the years 2019–2024.</p>
  <table>
    <thead><tr><th>Indicator</th><th>WDI code</th><th>Latest year</th></tr></thead>
    <tbody>
      ${METRICS.map((m) => `<tr><td>${m.label}</td><td>${m.code}</td><td>2024</td></tr>`).join('')}
      <tr><td>Land area</td><td>AG.SRF.TOTL.K2</td><td>2023</td></tr>
    </tbody>
  </table>
</section>

<section class="panel">
  <h2>How to use this site</h2>
  <ul class="checks">
    <li><strong>Overview</strong> — the headlines for the year you pick, the richest countries per person, and the biggest economies.</li>
    <li><strong>Countries</strong> — search, filter by region, sort any column, and tick countries to compare.</li>
    <li><strong>Country pages</strong> — a full profile: key figures, a 2019–2024 chart you can switch between bars and lines, and a year-by-year table.</li>
    <li><strong>Compare</strong> — two or three countries side by side, on any indicator, as bars for one year or lines across six.</li>
    <li><strong>Rankings</strong> — all twelve countries ranked by the indicator you choose, with the change on last year.</li>
  </ul>
  <p>Use the <strong>Year</strong> picker in the header to move the whole site between 2019 and 2024. Everything on the site updates — nothing on any page is frozen to one year.</p>
</section>

<section class="panel">
  <h2>What the numbers cannot do</h2>
  <p>GDP per capita is an average: it says nothing about how income is shared inside a country. Unemployment is modelled by the ILO, so it is not directly comparable with a national labour-force survey. Life expectancy dipped in several countries in 2020–2021 — that is the COVID-19 pandemic in the data, not an error. Figures are rounded for display; the underlying values are the WDI values as published.</p>
  <p>StatAtlas is an independent project, not affiliated with the World Bank, any government, or any national statistics office. Country names, capitals and regions follow the World Bank's country list.</p>
</section>`;
  return { html, draw() {} };
}
