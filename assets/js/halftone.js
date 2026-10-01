/* The Closing Line — live two-ink halftone "photo plates".
   Draws newsprint-style dots into <canvas data-ht="name"> from a tiny pre-computed tone map (tones.js), so it works
   from file:// (no pixel-readback of images), stays crisp at any size and re-inks itself on resize. */
window.NE = window.NE || {};
(function (NE) {
  'use strict';
  const cache = {};
  function tone(name) {
    if (cache[name]) return cache[name];
    const t = NE.TONES && NE.TONES[name]; if (!t) return null;
    const bin = atob(t.d), L = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) L[i] = bin.charCodeAt(i);
    return (cache[name] = { w: t.w, h: t.h, L });
  }
  function sample(m, u, v) {
    const x = Math.min(m.w - 1, Math.max(0, u * (m.w - 1))), y = Math.min(m.h - 1, Math.max(0, v * (m.h - 1)));
    const x0 = x | 0, y0 = y | 0, x1 = Math.min(m.w - 1, x0 + 1), y1 = Math.min(m.h - 1, y0 + 1), fx = x - x0, fy = y - y0;
    const a = m.L[y0 * m.w + x0], b = m.L[y0 * m.w + x1], c = m.L[y1 * m.w + x0], d = m.L[y1 * m.w + x1];
    return (((a * (1 - fx) + b * fx) * (1 - fy)) + ((c * (1 - fx) + d * fx) * fy)) / 255;
  }

  function draw(cv) {
    const m = tone(cv.dataset.ht); if (!m) return;
    const W = cv.clientWidth, H = cv.clientHeight; if (W < 8 || H < 8) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    const cs = getComputedStyle(cv), ink = cs.getPropertyValue('--plate-ink').trim() || '#15120d', red = cs.getPropertyValue('--plate-red').trim() || '#c8321e';
    const mono = cv.dataset.mono === '1';
    const cell = NE.clamp(W / 140, 3.2, 6) * (parseFloat(cv.dataset.cell) || 1);
    // "cover" crop of the tone map
    const mA = m.w / m.h, pA = W / H; let sw = 1, sh = 1;
    if (pA > mA) sh = mA / pA; else sw = pA / mA;
    const fx = cv.dataset.fx != null ? +cv.dataset.fx : 0.5, fy = cv.dataset.fy != null ? +cv.dataset.fy : 0.5;
    const u0 = (1 - sw) * fx, v0 = (1 - sh) * fy, diag = Math.hypot(W, H);
    function layer(angle, color, off, toneFn, scale) {
      const a = angle * Math.PI / 180, cs_ = Math.cos(a), sn = Math.sin(a);
      x.fillStyle = color; x.beginPath();
      for (let v = -diag; v < diag; v += cell) for (let u = -diag; u < diag; u += cell) {
        const px = W / 2 + u * cs_ - v * sn + off[0], py = H / 2 + u * sn + v * cs_ + off[1];
        if (px < -cell || py < -cell || px > W + cell || py > H + cell) continue;
        const dk = toneFn(sample(m, u0 + (px / W) * sw, v0 + (py / H) * sh));
        if (dk <= 0.03) continue;
        const r = (cell / 2) * 1.14 * Math.sqrt(Math.min(1, dk)) * scale;
        x.moveTo(px + r, py); x.arc(px, py, r, 0, 6.2832);
      }
      x.fill();
    }
    // spot colour lives in the mid-tones only (bell curve), printed a touch off-register; black carries shadows
    if (!mono) layer(15, red, [cell * 0.55, -cell * 0.3], l => { const d = 1 - l; return Math.max(0, 1 - Math.abs(d - 0.48) * 2.5) * 0.95; }, 0.9);
    layer(45, ink, [0, 0], l => Math.pow(Math.max(0, 1 - l * 1.08), 1.05), 1);
  }

  const ros = new Set();
  NE.ht = {
    draw,
    mountAll(root) {
      (root || document).querySelectorAll('canvas[data-ht]').forEach(function (cv) {
        draw(cv);
        if (window.ResizeObserver) { let last = cv.clientWidth; const ro = new ResizeObserver(() => { if (Math.abs(cv.clientWidth - last) > 2) { last = cv.clientWidth; draw(cv); } }); ro.observe(cv); ros.add(ro); }
      });
    },
    cleanup() { ros.forEach(r => r.disconnect()); ros.clear(); }
  };
  // plate markup helper: <figure class="plate"> canvas + (hover) colour photo + caption
  NE.ht.plate = function (name, o) {
    o = o || {}; const c = NE.credits && NE.credits[name];
    return '<figure class="plate' + (o.cls ? ' ' + o.cls : '') + '" style="' + (o.ratio ? 'aspect-ratio:' + o.ratio + ';' : '') + '"><canvas data-ht="' + name + '"' + (o.fx != null ? ' data-fx="' + o.fx + '"' : '') + (o.fy != null ? ' data-fy="' + o.fy + '"' : '') + (o.cell ? ' data-cell="' + o.cell + '"' : '') + ' aria-hidden="true"></canvas>' +
      '<img class="plate-ph" src="assets/img/' + name + '.jpg" alt="' + NE.esc(o.alt || '') + '" loading="lazy" decoding="async"' + (o.fx != null ? ' style="object-position:' + Math.round(o.fx * 100) + '% ' + Math.round((o.fy != null ? o.fy : 0.5) * 100) + '%"' : '') + '>' +
      (o.caption ? '<figcaption>' + o.caption + '</figcaption>' : '') + '</figure>';
  };
})(window.NE);
