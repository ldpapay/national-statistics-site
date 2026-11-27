// Number formatting for StatAtlas: every figure is shown rounded for reading,
// with its unit and year, and the exact source named beside it.

export function fmtInt(n) {
  return Math.round(n).toLocaleString('en-US');
}

export function fmtMillions(n) {
  if (n >= 1000) return (n / 1000).toFixed(2) + ' bn';
  return n.toFixed(1) + ' m';
}

export function fmtUsdBn(n) {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(1) + ' tn';
  return '$' + (n / 1e9).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' bn';
}

export function fmtUsd(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export function fmtPct(n, digits = 1) {
  return n.toFixed(digits) + '%';
}

export function fmtYears(n) {
  return n.toFixed(1) + ' yrs';
}

// Format one indicator value for a table cell or KPI card.
export function fmtValue(metric, value) {
  switch (metric) {
    case 'pop': return fmtMillions(value / 1e6);
    case 'gdp': return fmtUsdBn(value);
    case 'gdppc': return fmtUsd(value);
    case 'life': return fmtYears(value);
    case 'unemp': case 'infl': case 'growth': case 'internet': return fmtPct(value);
    default: return String(value);
  }
}

// Year-on-year change between two values, as "+x.x%" or "−x.x pp" for rates.
export function changeText(metric, from, to) {
  if (from == null || to == null) return '—';
  const diff = to - from;
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
  const abs = Math.abs(diff);
  if (metric === 'unemp' || metric === 'infl' || metric === 'growth' || metric === 'internet') {
    return `${sign}${abs.toFixed(1)} pp`;
  }
  const pct = (diff / from) * 100;
  return `${sign}${Math.abs(pct).toFixed(1)}%`;
}

export function changeClass(metric, from, to) {
  if (from == null || to == null || to === from) return '';
  const up = to > from;
  // For unemployment and inflation, a rise is bad; for everything else, a rise is good.
  const goodWhenUp = metric !== 'unemp' && metric !== 'infl';
  return up === goodWhenUp ? 'up' : 'down';
}

export const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
