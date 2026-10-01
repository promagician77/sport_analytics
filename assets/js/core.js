/* NicheEdge — core utilities: PRNG, odds math, devig, formatting, storage, tiny event bus */
window.NE = window.NE || {};
NE.pages = NE.pages || {};
(function (NE) {
  'use strict';

  /* ---------- seeded PRNG ---------- */
  NE.hash = function (str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  };

  NE.rng = function (seed) {
    let a = typeof seed === 'string' ? NE.hash(seed) : seed >>> 0;
    const next = function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r = { next };
    r.range = (lo, hi) => lo + (hi - lo) * next();
    r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * next());
    r.chance = p => next() < p;
    r.pick = arr => arr[Math.floor(next() * arr.length)];
    r.normal = function () {
      let u = 0, v = 0;
      while (u === 0) u = next();
      while (v === 0) v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    r.shuffle = function (arr) {
      const o = arr.slice();
      for (let i = o.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [o[i], o[j]] = [o[j], o[i]];
      }
      return o;
    };
    r.weighted = function (items, weights) {
      const tot = weights.reduce((s, w) => s + w, 0);
      let x = next() * tot;
      for (let i = 0; i < items.length; i++) { x -= weights[i]; if (x <= 0) return items[i]; }
      return items[items.length - 1];
    };
    return r;
  };

  /* ---------- math ---------- */
  NE.clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  NE.sum = a => a.reduce((s, x) => s + x, 0);
  NE.mean = a => (a.length ? NE.sum(a) / a.length : 0);
  NE.median = function (a) {
    if (!a.length) return 0;
    const s = a.slice().sort((x, y) => x - y), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  NE.stdev = function (a) {
    if (a.length < 2) return 0;
    const m = NE.mean(a);
    return Math.sqrt(NE.sum(a.map(x => (x - m) * (x - m))) / (a.length - 1));
  };

  // Abramowitz-Stegun erf approximation
  NE.erf = function (x) {
    const s = x < 0 ? -1 : 1; x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  };
  NE.normCdf = z => 0.5 * (1 + NE.erf(z / Math.SQRT2));
  // inverse normal CDF (Acklam)
  NE.normInv = function (p) {
    p = NE.clamp(p, 1e-9, 1 - 1e-9);
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    const pl = 0.02425;
    let q, r;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  };
  // P(X <= k) for Poisson(mu)
  NE.poisCdf = function (k, mu) {
    if (k < 0) return 0;
    let term = Math.exp(-mu), s = term;
    for (let i = 1; i <= k; i++) { term *= mu / i; s += term; }
    return Math.min(1, s);
  };

  /* ---------- odds conversion ---------- */
  NE.am2dec = a => (a > 0 ? 1 + a / 100 : 1 + 100 / Math.abs(a));
  NE.dec2am = d => (d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1)));
  NE.impl = d => 1 / d;
  NE.p2dec = p => 1 / NE.clamp(p, 0.001, 0.999);

  NE.fmtOdds = function (dec, fmt) {
    if (dec == null || !isFinite(dec)) return '—';
    fmt = fmt || NE.settings.oddsFormat;
    if (fmt === 'decimal') return dec.toFixed(2);
    if (fmt === 'implied') return (100 / dec).toFixed(1) + '%';
    const a = NE.dec2am(dec);
    return (a > 0 ? '+' : '') + a;
  };
  // parse user input: "+150", "-110", "2.5", "40%"
  NE.parseOdds = function (s) {
    s = String(s).trim();
    if (!s) return NaN;
    if (/%$/.test(s)) { const p = parseFloat(s) / 100; return p > 0 && p < 1 ? 1 / p : NaN; }
    const n = parseFloat(s);
    if (!isFinite(n)) return NaN;
    if (/^[+-]/.test(s) && Math.abs(n) >= 100) return NE.am2dec(n);
    if (Math.abs(n) >= 100) return NE.am2dec(n);
    return n > 1 ? n : NaN;
  };

  /* ---------- de-vigging (n-way) ---------- */
  // decs: decimal odds of each outcome. returns fair probabilities summing to 1.
  NE.devig = function (decs, method) {
    method = method || 'multiplicative';
    const q = decs.map(d => 1 / d), S = NE.sum(q), n = q.length;
    if (method === 'additive') {
      const adj = (S - 1) / n;
      let p = q.map(x => x - adj);
      if (p.some(x => x <= 0.001)) return NE.devig(decs, 'multiplicative');
      return p;
    }
    if (method === 'power') {
      let lo = 0.5, hi = 3;
      for (let i = 0; i < 60; i++) {
        const k = (lo + hi) / 2, t = NE.sum(q.map(x => Math.pow(x, k)));
        if (t > 1) lo = k; else hi = k;
      }
      const k = (lo + hi) / 2;
      return q.map(x => Math.pow(x, k));
    }
    if (method === 'shin') {
      const pz = z => q.map(x => (Math.sqrt(z * z + 4 * (1 - z) * x * x / S) - z) / (2 * (1 - z)));
      let lo = 0, hi = 0.4;
      for (let i = 0; i < 60; i++) {
        const z = (lo + hi) / 2, t = NE.sum(pz(z));
        if (t > 1) lo = z; else hi = z;
      }
      const p = pz((lo + hi) / 2), t = NE.sum(p);
      return p.map(x => x / t);
    }
    return q.map(x => x / S); // multiplicative
  };
  NE.DEVIG_METHODS = [
    { key: 'multiplicative', label: 'Multiplicative (proportional)' },
    { key: 'additive', label: 'Additive (equal margin)' },
    { key: 'power', label: 'Power' },
    { key: 'shin', label: 'Shin' },
    { key: 'worst', label: 'Worst case (lowest EV)' }
  ];
  // fair prob of outcome `idx` from a Pinnacle-style price set; 'worst' = min over methods
  NE.fairProb = function (decs, idx, method) {
    if (method === 'worst') {
      return Math.min.apply(null, ['multiplicative', 'additive', 'power', 'shin'].map(m => NE.devig(decs, m)[idx]));
    }
    return NE.devig(decs, method)[idx];
  };
  NE.hold = decs => NE.sum(decs.map(d => 1 / d)) - 1;
  NE.ev = (p, dec) => p * dec - 1;
  NE.kelly = function (p, dec) { const b = dec - 1; return b > 0 ? Math.max(0, (p * b - (1 - p)) / b) : 0; };

  /* ---------- formatting ---------- */
  NE.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  NE.fmtPct = (x, d) => (x * 100).toFixed(d == null ? 1 : d) + '%';
  NE.fmtSigned = function (x, d, suffix) {
    d = d == null ? 1 : d;
    const s = x.toFixed(d);
    return (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(d) + (suffix || '');
  };
  NE.fmtEV = ev => NE.fmtSigned(ev * 100, 1, '%');
  NE.fmtNum = function (x, d) { return Number(x).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  NE.fmtMoney = function (x, d) {
    const s = Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: d == null ? 0 : d, maximumFractionDigits: d == null ? 0 : d });
    return (x < 0 ? '−$' : '$') + s;
  };
  NE.fmtLine = function (l) { return Number.isInteger(l) ? l.toFixed(1) : String(Math.round(l * 100) / 100); };
  NE.fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  NE.fmtDay = function (ts) {
    const d = new Date(ts), now = new Date();
    const dd = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
    if (dd === 0) return 'Today';
    if (dd === 1) return 'Tomorrow';
    if (dd === -1) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };
  NE.fmtShortDate = ts => new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  NE.fmtDateTime = ts => NE.fmtDay(ts) + ' · ' + NE.fmtTime(ts);
  NE.until = function (ts) {
    const m = Math.round((ts - Date.now()) / 60000);
    if (m <= 0) return 'Live';
    if (m < 60) return 'in ' + m + 'm';
    const h = Math.floor(m / 60);
    if (h < 24) return 'in ' + h + 'h ' + (m % 60 ? (m % 60) + 'm' : '');
    return 'in ' + Math.floor(h / 24) + 'd';
  };
  NE.ago = function (ts) {
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.round(s / 60) + 'm ago';
    return Math.round(s / 3600) + 'h ago';
  };
  NE.initials = n => String(n).split(/[\s-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  NE.slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /* ---------- storage (safe) ---------- */
  NE.store = {
    get(k, fallback) {
      try { const v = localStorage.getItem('ne:' + k); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(k, v) { try { localStorage.setItem('ne:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  /* ---------- settings ---------- */
  NE.settings = Object.assign({
    oddsFormat: 'american',
    theme: 'light',
    bankroll: 5000,
    kellyFraction: 0.25,
    devig: 'multiplicative',
    minEV: 2,
    books: null,          // null = all
    alerts: { ev: true, arb: true, steam: false, start: true },
    alertMinEV: 5
  }, NE.store.get('settings', {}));
  NE.saveSettings = function () { NE.store.set('settings', NE.settings); };

  /* ---------- tiny pub/sub ---------- */
  NE.bus = (function () {
    const m = {};
    return {
      on(ev, fn) { (m[ev] = m[ev] || []).push(fn); return () => { m[ev] = (m[ev] || []).filter(f => f !== fn); }; },
      emit(ev, a) { (m[ev] || []).slice().forEach(f => { try { f(a); } catch (e) { console.error(e); } }); }
    };
  })();

  /* ---------- DOM helpers ---------- */
  NE.$ = (sel, root) => (root || document).querySelector(sel);
  NE.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  NE.debounce = function (fn, ms) { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), ms); }; };
})(window.NE);
