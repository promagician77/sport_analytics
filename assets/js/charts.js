/* NicheEdge — dependency-free SVG/HTML charts (hover layer, responsive, theme-aware via CSS tokens) */
window.NE = window.NE || {};
(function (NE) {
  'use strict';
  const C = NE.charts = {};
  const esc = NE.esc;
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- responsive mounting ---------- */
  const observers = new Set();
  C.cleanup = function () { observers.forEach(o => o.disconnect()); observers.clear(); C.hideTip(); };
  C.responsive = function (el, draw) {
    if (!el) return { redraw() {} };
    let last = 0;
    const run = function () {
      const w = Math.floor(el.clientWidth);
      if (w < 40) return;
      if (last && Math.abs(w - last) < 2) return;
      last = w; draw(w);
    };
    run();
    if (window.ResizeObserver) { const ro = new ResizeObserver(run); ro.observe(el); observers.add(ro); }
    return { redraw() { last = 0; run(); } };
  };

  /* ---------- scales ---------- */
  function niceTicks(lo, hi, n) {
    const span = (hi - lo) || 1, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0))), norm = step0 / mag;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
    return { ticks: out, step };
  }
  C.niceTicks = niceTicks;
  const fmtTick = (v, step) => (step >= 1 ? String(Math.round(v)) : v.toFixed(step >= 0.1 ? 1 : 2));

  /* ---------- tooltip (values lead, labels follow; built with textContent) ---------- */
  let tipEl = null;
  function tip() {
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tt'; tipEl.setAttribute('role', 'tooltip'); tipEl.hidden = true; document.body.appendChild(tipEl); }
    return tipEl;
  }
  C.showTip = function (data, x, y) {
    const el = tip(); el.textContent = '';
    if (data.t) { const t = document.createElement('div'); t.className = 'tt-t'; t.textContent = data.t; el.appendChild(t); }
    (data.r || []).forEach(function (row) {
      const d = document.createElement('div'); d.className = 'tt-r';
      if (row[2]) { const k = document.createElement('i'); k.style.background = row[2]; d.appendChild(k); }
      const v = document.createElement('b'); v.textContent = row[1];
      const l = document.createElement('span'); l.textContent = row[0];
      d.appendChild(v); d.appendChild(l); el.appendChild(d);
    });
    el.hidden = false;
    const r = el.getBoundingClientRect(), pad = 14;
    let left = x + pad, top = y + pad;
    if (left + r.width > window.innerWidth - 8) left = x - r.width - pad;
    if (top + r.height > window.innerHeight - 8) top = y - r.height - pad;
    el.style.left = Math.max(8, left) + 'px'; el.style.top = Math.max(8, top) + 'px';
  };
  C.hideTip = function () { if (tipEl) tipEl.hidden = true; };
  C.tt = obj => esc(JSON.stringify(obj));        // for data-tt attributes

  document.addEventListener('pointermove', function (e) {
    const t = e.target.closest ? e.target.closest('[data-tt],[data-tt-self]') : null;
    if (!t) { C.hideTip(); return; }
    if (t.hasAttribute('data-tt-self')) return;
    try { C.showTip(JSON.parse(t.getAttribute('data-tt')), e.clientX, e.clientY); } catch (err) { /* ignore */ }
  });
  document.addEventListener('focusin', function (e) {
    const t = e.target.closest ? e.target.closest('[data-tt]') : null;
    if (!t) return;
    const r = t.getBoundingClientRect();
    try { C.showTip(JSON.parse(t.getAttribute('data-tt')), r.left + r.width / 2, r.top); } catch (err) { /* ignore */ }
  });
  document.addEventListener('focusout', C.hideTip);
  window.addEventListener('scroll', C.hideTip, true);

  /* ---------- helpers ---------- */
  function topRounded(x, yTop, w, yBase, r) {
    const hgt = yBase - yTop; r = Math.min(r, hgt / 2, w / 2);
    if (hgt <= 0) return '';
    return 'M' + x + ',' + yBase + 'V' + (yTop + r) + 'Q' + x + ',' + yTop + ' ' + (x + r) + ',' + yTop + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + yTop + ' ' + (x + w) + ',' + (yTop + r) + 'V' + yBase + 'Z';
  }
  function legendHTML(items) {
    return '<div class="legend">' + items.map(i => '<span class="lg">' + (i.shape === 'line' ? '<i class="lg-line" style="background:' + i.color + '"></i>' : '<i class="lg-box" style="background:' + i.color + '"></i>') + (i.icon ? '<em>' + i.icon + '</em>' : '') + esc(i.name) + '</span>').join('') + '</div>';
  }
  C.legendHTML = legendHTML;

  /* ================================================================== */
  /* Bars vs. a threshold line  (game log / prop hit-rate chart)         */
  /* ================================================================== */
  C.logBars = function (el, o) {
    return C.responsive(el, function (w) {
      const rows = o.rows, n = rows.length, h = o.h || 250;
      if (!n) { el.innerHTML = '<div class="empty">No games in this sample.</div>'; return; }
      const showVals = n <= 10, m = { t: 26, r: 48, b: showVals ? 44 : 26, l: 34 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      const vmax = Math.max(o.line, Math.max.apply(null, rows.map(r => r.v)), 1) * 1.16;
      const nt = niceTicks(0, vmax, 4), ymax = nt.step * Math.ceil(vmax / nt.step);
      const y = v => m.t + ih - (v / ymax) * ih;
      const band = iw / n, bw = Math.min(band * 0.56, showVals ? 30 : 22);
      let s = '<svg class="ch" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(o.aria || 'Game log chart') + '">';
      nt.ticks.forEach(t => { s += '<line class="grid" x1="' + m.l + '" x2="' + (w - m.r) + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text class="tick" x="' + (m.l - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + fmtTick(t, nt.step) + '</text>'; });
      s += '<line class="axis" x1="' + m.l + '" x2="' + (w - m.r) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>';
      const labelEvery = band >= 34 ? 1 : band >= 22 ? 2 : 4;
      rows.forEach(function (r, i) {
        const x = m.l + band * i + (band - bw) / 2;
        const hit = o.side === 0 ? r.v > o.line : r.v < o.line, push = r.v === o.line;
        const cls = push ? 'm-push' : hit ? 'm-hit' : 'm-miss';
        const yt = y(r.v);
        if (r.v <= 0) s += '<rect class="' + cls + '" x="' + x + '" y="' + (y(0) - 2) + '" width="' + bw + '" height="2" rx="1"/>';
        else s += '<path class="bar ' + cls + '" d="' + topRounded(x, yt, bw, y(0), 4) + '"/>';
        if (showVals) s += '<text class="val" x="' + (x + bw / 2) + '" y="' + (Math.min(yt, y(0) - 2) - 6) + '" text-anchor="middle">' + esc(r.vLabel != null ? r.vLabel : r.v) + '</text>';
        if (i % labelEvery === 0) {
          s += '<text class="tick" x="' + (x + bw / 2) + '" y="' + (h - m.b + 15) + '" text-anchor="middle">' + esc(r.label) + '</text>';
          if (showVals && r.sub) s += '<text class="tick dim" x="' + (x + bw / 2) + '" y="' + (h - m.b + 29) + '" text-anchor="middle">' + esc(r.sub) + '</text>';
        }
        s += '<rect class="hit" tabindex="0" x="' + (m.l + band * i) + '" y="' + m.t + '" width="' + band + '" height="' + ih + '" data-tt="' + C.tt(r.tip) + '"/>';
      });
      // threshold line (mark, 2px solid) + value chip
      s += '<line class="thr" x1="' + m.l + '" x2="' + (w - m.r + 6) + '" y1="' + y(o.line) + '" y2="' + y(o.line) + '"/>';
      s += '<g class="thr-chip" transform="translate(' + (w - m.r + 8) + ',' + (y(o.line) - 10) + ')"><rect width="40" height="20" rx="6"/><text x="20" y="14" text-anchor="middle">' + esc(NE.fmtLine(o.line)) + '</text></g>';
      s += '</svg>';
      el.innerHTML = s;
    });
  };

  /* ================================================================== */
  /* Line chart w/ crosshair + one tooltip listing every series          */
  /* ================================================================== */
  C.line = function (el, o) {
    return C.responsive(el, function (w) {
      const h = o.h || 230, m = { t: 14, r: o.endLabels === false ? 16 : 54, b: 26, l: 46 };
      const iw = w - m.l - m.r, ih = h - m.t - m.b;
      const S = o.series, all = [].concat.apply([], S.map(s => s.pts));
      if (!all.length) { el.innerHTML = '<div class="empty">No data yet.</div>'; return; }
      let x0 = Math.min.apply(null, all.map(p => p.x)), x1 = Math.max.apply(null, all.map(p => p.x));
      if (x0 === x1) x1 = x0 + 1;
      let y0 = o.yMin != null ? o.yMin : Math.min.apply(null, all.map(p => p.y)), y1 = o.yMax != null ? o.yMax : Math.max.apply(null, all.map(p => p.y));
      if (o.zero) { y0 = Math.min(y0, 0); y1 = Math.max(y1, 0); }
      if (y0 === y1) { y0 -= 1; y1 += 1; }
      const pad = (y1 - y0) * 0.08; if (o.yMin == null) y0 -= pad; if (o.yMax == null) y1 += pad;
      const nt = niceTicks(y0, y1, 4);
      const X = v => m.l + ((v - x0) / (x1 - x0)) * iw, Y = v => m.t + ih - ((v - y0) / (y1 - y0)) * ih;
      const fy = o.fmtY || (v => fmtTick(v, nt.step));
      let s = '<svg class="ch" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(o.aria || 'Line chart') + '">';
      nt.ticks.forEach(t => { if (Y(t) >= m.t - 1 && Y(t) <= m.t + ih + 1) s += '<line class="grid" x1="' + m.l + '" x2="' + (w - m.r) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/><text class="tick" x="' + (m.l - 8) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + esc(fy(t, nt.step)) + '</text>'; });
      if (o.zero && Y(0) > m.t && Y(0) < m.t + ih) s += '<line class="axis" x1="' + m.l + '" x2="' + (w - m.r) + '" y1="' + Y(0) + '" y2="' + Y(0) + '"/>';
      const nx = Math.max(2, Math.min(6, Math.floor(iw / 90)));
      for (let i = 0; i <= nx; i++) { const v = x0 + (x1 - x0) * i / nx; s += '<text class="tick" x="' + X(v) + '" y="' + (h - 6) + '" text-anchor="' + (i === 0 ? 'start' : i === nx ? 'end' : 'middle') + '">' + esc((o.fmtX || (q => q))(v)) + '</text>'; }
      const labelsOK = S.length <= 4 && o.endLabels !== false;
      const endYs = [];
      S.forEach(function (ser, si) {
        const d = ser.pts.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ',' + Y(p.y).toFixed(1)).join('');
        if (S.length === 1 && o.area !== false) s += '<path d="' + d + 'L' + X(ser.pts[ser.pts.length - 1].x) + ',' + (m.t + ih) + 'L' + X(ser.pts[0].x) + ',' + (m.t + ih) + 'Z" style="fill:' + ser.color + ';opacity:.10"/>';
        s += '<path class="ln" d="' + d + '" style="stroke:' + ser.color + '"/>';
        const last = ser.pts[ser.pts.length - 1];
        s += '<circle class="dot" cx="' + X(last.x) + '" cy="' + Y(last.y) + '" r="4" style="fill:' + ser.color + '"/>';
        endYs.push(Y(last.y));
        if (labelsOK) s += '<text class="endlab" x="' + (X(last.x) + 9) + '" y="' + (Y(last.y) + 4) + '">' + esc(fy(last.y)) + '</text>';
      });
      s += '<line class="xhair" y1="' + m.t + '" y2="' + (m.t + ih) + '" x1="0" x2="0" style="display:none"/>';
      S.forEach((ser, si) => { s += '<circle class="hdot" r="4.5" style="fill:' + ser.color + ';display:none" data-i="' + si + '"/>'; });
      s += '<rect class="ov" data-tt-self x="' + m.l + '" y="' + m.t + '" width="' + iw + '" height="' + ih + '"/></svg>';
      el.innerHTML = (S.length >= 2 ? legendHTML(S.map(q => ({ name: q.name, color: q.color, shape: 'line' }))) : '') + s;
      const svg = el.querySelector('svg'), ov = svg.querySelector('.ov'), xh = svg.querySelector('.xhair'), dots = svg.querySelectorAll('.hdot');
      const xs = S[0].pts.map(p => p.x);
      const move = function (ev) {
        const r = svg.getBoundingClientRect(), mx = ev.clientX - r.left;
        const v = x0 + ((mx - m.l) / iw) * (x1 - x0);
        let bi = 0, bd = Infinity;
        xs.forEach((q, i) => { const dd = Math.abs(q - v); if (dd < bd) { bd = dd; bi = i; } });
        const cx = X(xs[bi]);
        xh.setAttribute('x1', cx); xh.setAttribute('x2', cx); xh.style.display = '';
        const rowsT = [];
        S.forEach((ser, si) => { const p = ser.pts[Math.min(bi, ser.pts.length - 1)]; dots[si].setAttribute('cx', cx); dots[si].setAttribute('cy', Y(p.y)); dots[si].style.display = ''; rowsT.push([ser.name, (ser.fmtTip || fy)(p.y), ser.color]); });
        C.showTip({ t: (o.fmtTipX || o.fmtX || (q => q))(xs[bi]), r: rowsT }, ev.clientX, ev.clientY);
      };
      ov.addEventListener('pointermove', move);
      ov.addEventListener('pointerleave', function () { xh.style.display = 'none'; dots.forEach(d => { d.style.display = 'none'; }); C.hideTip(); });
    });
  };

  /* ================================================================== */
  /* Histogram (signed bins)                                             */
  /* ================================================================== */
  C.hist = function (el, o) {
    return C.responsive(el, function (w) {
      const h = o.h || 200, m = { t: 14, r: 12, b: 28, l: 34 }, bins = o.bins, n = bins.length;
      const iw = w - m.l - m.r, ih = h - m.t - m.b, band = iw / n, bw = Math.min(band - 2, 28);
      const vmax = Math.max(1, Math.max.apply(null, bins.map(b => b.n))), nt = niceTicks(0, vmax * 1.1, 3), ymax = nt.step * Math.ceil(vmax * 1.1 / nt.step);
      const y = v => m.t + ih - (v / ymax) * ih;
      let s = '<svg class="ch" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(o.aria || 'Distribution') + '">';
      nt.ticks.forEach(t => { s += '<line class="grid" x1="' + m.l + '" x2="' + (w - m.r) + '" y1="' + y(t) + '" y2="' + y(t) + '"/><text class="tick" x="' + (m.l - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + t + '</text>'; });
      s += '<line class="axis" x1="' + m.l + '" x2="' + (w - m.r) + '" y1="' + y(0) + '" y2="' + y(0) + '"/>';
      const every = band >= 40 ? 1 : 2;
      bins.forEach(function (b, i) {
        const x = m.l + band * i + (band - bw) / 2;
        if (b.n > 0) s += '<path class="bar ' + (b.mid >= 0 ? 'm-hit' : 'm-miss') + '" d="' + topRounded(x, y(b.n), bw, y(0), 4) + '"/>';
        if (i % every === 0) s += '<text class="tick" x="' + (x + bw / 2) + '" y="' + (h - 8) + '" text-anchor="middle">' + esc(b.label) + '</text>';
        s += '<rect class="hit" tabindex="0" x="' + (m.l + band * i) + '" y="' + m.t + '" width="' + band + '" height="' + ih + '" data-tt="' + C.tt({ t: b.range, r: [['bets', String(b.n)]] }) + '"/>';
      });
      el.innerHTML = s + '</svg>';
    });
  };

  /* ================================================================== */
  /* Horizontal bars (supports negatives around a zero baseline)         */
  /* ================================================================== */
  C.hbar = function (el, o) {
    return C.responsive(el, function (w) {
      const rows = o.rows, rh = o.rowH || 30, h = rows.length * rh + 22, lw = o.labelW || Math.min(190, w * 0.38), rw = Math.max(62, Math.max.apply(null, rows.map(r => String(r.vLabel != null ? r.vLabel : r.v).length)) * 7.4 + 16);
      const iw = w - lw - rw;
      const vals = rows.map(r => r.v), lo = Math.min(0, Math.min.apply(null, vals)), hi = Math.max(0, Math.max.apply(null, vals));
      const nt = niceTicks(lo, hi, 4), a = Math.min(lo, nt.ticks[0]), b = Math.max(hi, nt.ticks[nt.ticks.length - 1]);
      const X = v => lw + ((v - a) / (b - a || 1)) * iw;
      let s = '<svg class="ch" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(o.aria || 'Bar chart') + '">';
      nt.ticks.forEach(t => { s += '<line class="grid" x1="' + X(t) + '" x2="' + X(t) + '" y1="0" y2="' + (h - 20) + '"/><text class="tick" x="' + X(t) + '" y="' + (h - 5) + '" text-anchor="middle">' + esc((o.fmtTick || (q => fmtTick(q, nt.step)))(t)) + '</text>'; });
      rows.forEach(function (r, i) {
        const cy = i * rh + rh / 2, th = Math.min(16, rh - 10), x0 = X(0), x1 = X(r.v);
        const cls = r.cls || (o.diverging ? (r.v >= 0 ? 'm-hit' : 'm-miss') : 'm-c1');
        const st = r.color ? ' style="fill:' + r.color + '"' : '';
        s += '<text class="lab' + (r.strong ? ' strong' : '') + '" x="' + (lw - 10) + '" y="' + (cy + 4) + '" text-anchor="end">' + esc(r.label) + '</text>';
        const bx = Math.min(x0, x1), bwid = Math.max(2, Math.abs(x1 - x0));
        s += '<rect class="bar ' + cls + '"' + st + ' x="' + bx + '" y="' + (cy - th / 2) + '" width="' + bwid + '" height="' + th + '" rx="4"/>';
        if (r.v >= 0) s += '<rect class="' + cls + '"' + st + ' x="' + bx + '" y="' + (cy - th / 2) + '" width="5" height="' + th + '"/>'; else s += '<rect class="' + cls + '"' + st + ' x="' + (bx + bwid - 5) + '" y="' + (cy - th / 2) + '" width="5" height="' + th + '"/>';
        s += '<text class="val" x="' + (r.v >= 0 ? x1 + 8 : x0 + 8) + '" y="' + (cy + 4) + '" text-anchor="start">' + esc(r.vLabel != null ? r.vLabel : r.v) + '</text>';
        s += '<rect class="hit" tabindex="0" x="0" y="' + (i * rh) + '" width="' + w + '" height="' + rh + '" data-tt="' + C.tt(r.tip || { t: r.label, r: [[o.valName || 'value', String(r.vLabel != null ? r.vLabel : r.v)]] }) + '"/>';
      });
      s += '<line class="axis" x1="' + X(0) + '" x2="' + X(0) + '" y1="0" y2="' + (h - 20) + '"/>';
      el.innerHTML = s + '</svg>';
    });
  };

  /* ================================================================== */
  /* Inline micro-charts (static, used inside tables)                    */
  /* ================================================================== */
  C.sparkBars = function (vals, line, side, o) {
    o = o || {}; const n = vals.length, bw = o.bw || 6, gap = 2, h = o.h || 22, w = n * (bw + gap) - gap;
    if (!n) return '';
    const vmax = Math.max(line * 1.25, Math.max.apply(null, vals), 1);
    let s = '<svg class="spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">';
    const ly = h - (line / vmax) * h;
    vals.forEach(function (v, i) {
      const hit = side === 0 ? v > line : v < line, push = v === line, bh = Math.max(2, (v / vmax) * h);
      s += '<rect class="' + (push ? 'm-push' : hit ? 'm-hit' : 'm-miss') + '" x="' + (i * (bw + gap)) + '" y="' + (h - bh) + '" width="' + bw + '" height="' + bh + '" rx="1.5"/>';
    });
    s += '<line class="thr-s" x1="0" x2="' + w + '" y1="' + ly + '" y2="' + ly + '"/></svg>';
    return s;
  };
  C.spark = function (vals, o) {
    o = o || {}; const w = o.w || 72, h = o.h || 24, n = vals.length; if (n < 2) return '';
    const lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), span = (hi - lo) || 1;
    const pts = vals.map((v, i) => [2 + (i / (n - 1)) * (w - 4), 3 + (1 - (v - lo) / span) * (h - 6)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
    const last = pts[n - 1];
    return '<svg class="spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path class="ln" d="' + d + '" style="stroke:' + (o.color || 'var(--c-muted)') + '"/><circle class="dot" cx="' + last[0] + '" cy="' + last[1] + '" r="3.2" style="fill:' + (o.dot || 'var(--c1)') + '"/></svg>';
  };

  /* ================================================================== */
  /* Sequential heat table (single hue, light → dark)                    */
  /* ================================================================== */
  const RAMP = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95'];
  const RAMP_DARK = ['#0d366b', '#104281', '#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#5598e7', '#6da7ec', '#86b6ef', '#9ec5f4'];
  function lum(hex) { const c = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  C.heat = function (o) {
    const flat = [].concat.apply([], o.rows.map(r => r.cells.filter(c => c != null)));
    const lo = Math.min.apply(null, flat), hi = Math.max.apply(null, flat), dark = document.documentElement.dataset.theme !== 'light';
    const ramp = dark ? RAMP_DARK : RAMP;
    const col = v => ramp[Math.round(((v - lo) / ((hi - lo) || 1)) * (ramp.length - 1))];
    let s = '<div class="heat-wrap"><table class="heat"><thead><tr><th></th>' + o.cols.map(c => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>';
    o.rows.forEach(function (r) {
      s += '<tr><th scope="row">' + r.label + '</th>';
      r.cells.forEach(function (v, i) {
        if (v == null) { s += '<td class="na">—</td>'; return; }
        const bg = col(v), fg = lum(bg) > 0.3 ? '#0b0b0b' : '#ffffff';
        s += '<td tabindex="0" style="background:' + bg + ';color:' + fg + '" data-tt="' + C.tt({ t: r.plain + ' · ' + o.cols[i], r: [[o.valName, o.fmt(v)]] }) + '">' + o.fmt(v) + '</td>';
      });
      s += '</tr>';
    });
    s += '</tbody></table></div><div class="heat-scale"><span>' + o.fmt(lo) + '</span><i style="background:linear-gradient(90deg,' + ramp[0] + ',' + ramp[ramp.length - 1] + ')"></i><span>' + o.fmt(hi) + '</span></div>';
    return s;
  };

  /* ================================================================== */
  /* Tale-of-the-tape comparison rows (two series: slot 1 / slot 2)      */
  /* ================================================================== */
  C.compare = function (names, rows) {
    let s = '<div class="cmp"><div class="cmp-head"><span class="lg"><i class="lg-box" style="background:var(--c1)"></i>' + esc(names[0]) + '</span><span class="lg">' + esc(names[1]) + '<i class="lg-box" style="background:var(--c2)"></i></span></div>';
    rows.forEach(function (r) {
      const a = r.a, b = r.b, mx = Math.max(Math.abs(a), Math.abs(b), 1e-9), lo = Math.min(a, b);
      const sa = r.better === 0 ? 'cmp-win' : '', sb = r.better === 1 ? 'cmp-win' : '';
      let pa, pb;
      if (r.range) { pa = NE.clamp((a - r.range[0]) / (r.range[1] - r.range[0]), 0.04, 1); pb = NE.clamp((b - r.range[0]) / (r.range[1] - r.range[0]), 0.04, 1); }
      else { pa = Math.abs(a) / mx; pb = Math.abs(b) / mx; }
      s += '<div class="cmp-row"><div class="cmp-v ' + sa + '">' + esc(r.fa) + '</div><div class="cmp-bars" data-tt="' + C.tt({ t: r.label, r: [[names[0], r.fa, 'var(--c1)'], [names[1], r.fb, 'var(--c2)']] }) + '" tabindex="0"><div class="cmp-l"><i style="width:' + (pa * 100).toFixed(1) + '%;background:var(--c1)"></i></div><div class="cmp-mid">' + esc(r.label) + '</div><div class="cmp-r"><i style="width:' + (pb * 100).toFixed(1) + '%;background:var(--c2)"></i></div></div><div class="cmp-v ' + sb + '">' + esc(r.fb) + '</div></div>';
    });
    return s + '</div>';
  };

  /* ---------- win-probability gauge: printed scale with a needle at the split ---------- */
  C.gauge = function (p0, names, o) {
    o = o || {};
    const p = NE.clamp(p0, 0.01, 0.99), X = v => 6 * v, trim = (n, k) => { n = String(n); return n.length > k ? n.slice(0, k - 1) + '…' : n; };
    const compact = o.compact;
    let s = '<svg class="gauge' + (o.compact ? ' cp' : '') + '" viewBox="0 0 600 ' + (compact ? 58 : 86) + '" role="img" aria-label="' + esc((o.title || 'Win probability') + ': ' + names[0] + ' ' + Math.round(p * 100) + '%, ' + names[1] + ' ' + Math.round((1 - p) * 100) + '%') + '" tabindex="0" data-tt="' + C.tt({ t: o.title || 'Win probability', r: [[names[0], NE.fmtPct(p0), 'var(--c1)'], [names[1], NE.fmtPct(1 - p0), 'var(--c2)']] }) + '">';
    const yb = compact ? 38 : 52, th = compact ? 9 : 11;
    if (!compact) {
      s += '<text class="big" x="0" y="34">' + Math.round(p * 100) + '<tspan font-size="17" dx="1">%</tspan></text><text class="nm" x="' + (Math.round(p * 100) >= 100 ? 76 : 66) + '" y="32">' + esc(trim(names[0], 24)) + '</text>';
      s += '<text class="big" x="600" y="34" text-anchor="end"><tspan font-size="17" dx="-1">%</tspan></text>';
      s = s.replace('<text class="big" x="600" y="34" text-anchor="end"><tspan font-size="17" dx="-1">%</tspan></text>', '<text class="big" x="600" y="34" text-anchor="end">' + Math.round((1 - p) * 100) + '<tspan font-size="17" dx="1">%</tspan></text><text class="nm" x="' + (Math.round((1 - p) * 100) >= 100 ? 524 : 534) + '" y="32" text-anchor="end">' + esc(trim(names[1], 24)) + '</text>');
    }
    s += '<rect x="0" y="' + yb + '" width="' + (X(p * 100) - 1.5) + '" height="' + th + '" fill="var(--c1)"/><rect x="' + (X(p * 100) + 1.5) + '" y="' + yb + '" width="' + (600 - X(p * 100) - 1.5) + '" height="' + th + '" fill="var(--c2)"/>';
    for (let i = 0; i <= 10; i++) s += '<line class="tk" x1="' + X(i * 10) + '" x2="' + X(i * 10) + '" y1="' + (yb + th + 2) + '" y2="' + (yb + th + (i === 5 ? 9 : 5)) + '"/>';
    s += '<line x1="' + X(p * 100) + '" x2="' + X(p * 100) + '" y1="' + (yb - 7) + '" y2="' + (yb + th + 3) + '" stroke="var(--ink)" stroke-width="3"/>';
    if (!compact) s += [0, 25, 50, 75, 100].map(v => '<text class="lbl" x="' + X(v) + '" y="' + (yb + th + 20) + '" text-anchor="' + (v === 0 ? 'start' : v === 100 ? 'end' : 'middle') + '">' + v + '</text>').join('');
    else s += '<text class="lbl" x="0" y="56" >' + Math.round(p * 100) + '%</text><text class="lbl" x="600" y="56" text-anchor="end">' + Math.round((1 - p) * 100) + '%</text>';
    return s + '</svg>';
  };
  C.probBar = (p, names, o) => C.gauge(p, names, o);

  /* ---------- meter (ratio) ---------- */
  C.meter = function (p, label) {
    const pct = Math.round(NE.clamp(p, 0, 1) * 100);
    return '<div class="meter" role="meter" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + esc(label || '') + '"><i style="width:' + pct + '%"></i></div>';
  };
})(window.NE);
