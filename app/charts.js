// Hand-rolled canvas charts for StatAtlas — no library, so the first load stays small.
// drawBarChart(canvas, labels, values, options) and drawLineChart(canvas, labels, series, options)
// both size the canvas to its element box at device pixel ratio and return nothing.

const INK = '#12283d';
const SOFT = '#6b7f8f';
const AMBER = '#d98e04';
const TEAL = '#0e7c86';
const GRID = '#e3dcc9';

function setup(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(280, Math.round(rect.width));
  const h = Math.round(rect.height);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function niceMax(v) {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const step = steps.find((s) => s >= n) ?? 10;
  return step * pow;
}

function shortNum(v) {
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(v % 1e9 === 0 ? 0 : 1) + 'B';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1) + 'M';
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'k';
  return String(Math.round(v * 10) / 10);
}

function axes(ctx, w, h, pad, max, formatTick) {
  ctx.strokeStyle = GRID;
  ctx.fillStyle = SOFT;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + ((h - pad.top - pad.bottom) * i) / 4;
    const val = max * (1 - i / 4);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.fillText(formatTick(val), pad.left - 6, y);
  }
}

export function drawBarChart(canvas, labels, values, options = {}) {
  const { ctx, w, h } = setup(canvas);
  const pad = { top: 12, right: 10, bottom: 26, left: 52 };
  const formatTick = options.formatTick || shortNum;
  const formatValue = options.formatValue || ((v) => shortNum(v));
  const max = niceMax(Math.max(...values, 0) * 1.08);
  axes(ctx, w, h, pad, max, formatTick);
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const slot = plotW / values.length;
  const barW = Math.min(46, slot * 0.62);
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  values.forEach((v, i) => {
    const x = pad.left + slot * i + (slot - barW) / 2;
    const bh = (v / max) * plotH;
    const y = pad.top + plotH - bh;
    ctx.fillStyle = i === options.highlight ? AMBER : TEAL;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, Math.max(bh, 1), [4, 4, 0, 0]);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textBaseline = 'bottom';
    ctx.fillText(formatValue(v), x + barW / 2, y - 3);
    ctx.fillStyle = SOFT;
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], x + barW / 2, pad.top + plotH + 5);
  });
}

export function drawLineChart(canvas, labels, series, options = {}) {
  const { ctx, w, h } = setup(canvas);
  const pad = { top: 14, right: 14, bottom: 26, left: 56 };
  const formatTick = options.formatTick || shortNum;
  const all = series.flatMap((s) => s.values);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const lo = options.minZero ? 0 : min - (max - min) * 0.15;
  const hi = max + (max - min) * 0.12;
  // Reuse the grid: draw 4 ticks between lo and hi.
  ctx.strokeStyle = GRID;
  ctx.fillStyle = SOFT;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + ((h - pad.top - pad.bottom) * i) / 4;
    const val = hi - ((hi - lo) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
    ctx.fillText(formatTick(val), pad.left - 6, y);
  }
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const xAt = (i) => pad.left + (plotW * i) / (labels.length - 1);
  const yAt = (v) => pad.top + plotH - ((v - lo) / (hi - lo)) * plotH;
  const colors = [TEAL, AMBER, '#7a4fa3', '#b3261e', '#1d7a3d'];
  series.forEach((s, si) => {
    ctx.strokeStyle = colors[si % colors.length];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    s.values.forEach((v, i) => {
      if (i === 0) ctx.moveTo(xAt(i), yAt(v));
      else ctx.lineTo(xAt(i), yAt(v));
    });
    ctx.stroke();
    ctx.fillStyle = colors[si % colors.length];
    s.values.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(xAt(i), yAt(v), 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  ctx.fillStyle = SOFT;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  labels.forEach((lab, i) => ctx.fillText(lab, xAt(i), pad.top + plotH + 5));
  if (series.length > 1) {
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px system-ui, sans-serif';
    series.forEach((s, si) => {
      const x = pad.left + si * 130;
      ctx.fillStyle = colors[si % colors.length];
      ctx.fillRect(x, 2, 14, 4);
      ctx.fillStyle = INK;
      ctx.fillText(s.name, x + 19, 0);
    });
  }
}
