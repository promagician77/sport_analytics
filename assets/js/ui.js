/* The Closing Line — UI component builders (HTML strings) + global behaviours */
window.NE = window.NE || {};
(function (NE) {
  'use strict';
  const D = NE.data, esc = NE.esc;
  const U = NE.ui = {};

  /* ------------------------------------------------------------------ icons (square-cut, used sparingly) */
  const P = {
    search: '<circle cx="10.5" cy="10.5" r="6.2"/><path d="M15.2 15.2L21 21"/>',
    arrowR: '<path d="M3 12h17M14 6l6 6-6 6"/>', arrowL: '<path d="M21 12H4M10 6l-6 6 6 6"/>',
    arrowUp: '<path d="M12 20V5M6 11l6-6 6 6"/>', arrowDown: '<path d="M12 4v15M6 13l6 6 6-6"/>',
    chevD: '<path d="M5 9l7 7 7-7"/>', chevR: '<path d="M9 5l7 7-7 7"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>', x: '<path d="M5 5l14 14M19 5L5 19"/>', plus: '<path d="M12 4v16M4 12h16"/>',
    download: '<path d="M12 3v13M6 11l6 6 6-6M4 21h16"/>', refresh: '<path d="M20 11A8 8 0 0 0 5 7.5M4 4v4h4M4 13a8 8 0 0 0 15 3.5M20 20v-4h-4"/>',
    star: '<path d="M12 3l2.8 5.8 6.2.8-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2l1.1-6.2L3 9.6l6.2-.8z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6.5V12l3.5 2"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>', filter: '<path d="M3 5h18l-7 8.5V20l-4-2v-4.5z"/>', menu: '<path d="M3 7h18M3 12h18M3 17h18"/>'
  };
  U.icon = function (name, size, cls) {
    return '<svg class="ic ' + (cls || '') + '" width="' + (size || 16) + '" height="' + (size || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">' + (P[name] || '') + '</svg>';
  };

  /* ------------------------------------------------------------------ atoms */
  U.plateName = ev => (ev.sport === 'cricket' && ev.league === 'Big Bash League') ? 'cricket-bbl' : D.SPORT[ev.sport].photo;
  U.plateOf = key => D.SPORT[key].photo;
  U.sportBadge = function (key) { const sp = D.SPORT[key]; return '<span class="scode g-' + sp.group.toLowerCase() + '" title="' + esc(sp.name) + '">' + esc(sp.short) + '</span>'; };
  U.sportIcon = U.sportBadge;
  U.book = function (key, o) {
    const b = D.BOOK[key]; if (!b) return ''; o = o || {};
    return '<span class="bk' + (b.sharp ? ' sharp' : '') + '" title="' + esc(b.name) + (b.sharp ? ' — sharp reference' : '') + '">' + esc(b.short) + '</span>' + (o.name ? '<span class="bk-name">' + esc(b.name) + '</span>' : '');
  };
  U.evClass = e => (e >= 0.08 ? 'hi' : e >= 0.03 ? 'md' : e >= 0 ? 'lo' : 'neg');
  U.evPill = function (e) { return '<span class="edge ' + U.evClass(e) + '">' + NE.fmtEV(e) + '</span>'; };
  U.hitTier = p => (p == null ? 'na' : p >= 0.8 ? 't5' : p >= 0.65 ? 't4' : p >= 0.5 ? 't3' : p >= 0.35 ? 't2' : 't1');
  U.hitPill = function (h, o) {
    o = o || {};
    if (!h || h.pct == null) return '<span class="hf na"><b>—</b><i></i></span>';
    return '<span class="hf ' + U.hitTier(h.pct) + '" title="' + h.hits + ' of ' + h.total + '"><b>' + Math.round(h.pct * 100) + '%</b><i style="--w:' + Math.round(h.pct * 100) + '%"></i>' + (o.frac ? '<small>' + h.hits + '/' + h.total + '</small>' : '') + '</span>';
  };
  U.odds = function (dec, o) {
    o = o || {};
    return '<span class="px' + (o.best ? ' best' : '') + (o.cls ? ' ' + o.cls : '') + '"' + (o.fk ? ' data-fk="' + esc(o.fk) + '" data-fv="' + dec + '"' : '') + '>' + NE.fmtOdds(dec) + '</span>';
  };
  U.live = '<span class="live"><i></i>Live</span>';
  U.startCell = function (ev) {
    return '<div class="start">' + (D.isLive(ev) ? U.live : '<b>' + NE.fmtTime(ev.start) + '</b><small>' + NE.fmtDay(ev.start) + '</small>') + '</div>';
  };
  U.matchup = function (ev) { return '<div class="mu">' + U.sportBadge(ev.sport) + '<div class="mu-t"><b>' + esc(ev.p[0].name) + '</b><span>' + esc(ev.p[1].name) + '</span></div></div>'; };
  U.empty = function (title, text) { return '<div class="empty-state"><h3>' + esc(title) + '</h3><p>' + esc(text || '') + '</p></div>'; };
  U.dl = function (pairs) { return '<div class="dl">' + pairs.map(p => '<div class="leader"><span>' + p[0] + '</span><i></i><b>' + p[1] + '</b></div>').join('') + '</div>'; };

  /* ------------------------------------------------------------------ headings & figures */
  // o: { k: kicker, t: title, s: standfirst, a: actions html, meta }
  U.pgh = function (o) {
    return '<header class="pgh"><div class="rule-h"></div><div class="pgh-row"><div><span class="k">' + o.k + '</span><h1>' + o.t + '</h1></div><div><p class="pgh-s">' + (o.s || '') + '</p>' + (o.a ? '<div class="pgh-a">' + o.a + '</div>' : '') + (o.meta ? '<div class="pgh-meta">' + o.meta + '</div>' : '') + '</div></div></header>';
  };
  U.kpi = function (o) {
    return '<div class="kpi"><div class="kpi-l">' + esc(o.label) + '</div><div class="kpi-n' + (o.big ? ' big' : '') + '"' + (o.id ? ' id="' + o.id + '"' : '') + '>' + o.value + '</div>' + (o.delta != null ? '<div class="kpi-d"' + (o.did ? ' id="' + o.did + '"' : '') + '>' + o.delta + '</div>' : '') + (o.extra || '') + '</div>';
  };
  U.kpis = items => '<div class="kpis">' + items.map(U.kpi).join('') + '</div>';
  U.statTile = o => U.kpi({ label: o.label, value: o.value, delta: o.delta, big: o.hero, extra: o.spark ? '<div style="margin-top:8px">' + o.spark + '</div>' : '' });
  // Figure with chart / table twin. o: { id, n, title, cap, legend, h, extra, table, cls }
  U.chartCard = function (o) {
    return '<figure class="fig ' + (o.cls || '') + '" id="cc-' + o.id + '"><div class="fig-h"><div>' + (o.n ? '<span class="fig-n">Fig. ' + o.n + '</span>' : '') + '<h3>' + o.title + '</h3>' + (o.cap || o.sub ? '<p class="cap">' + (o.cap || o.sub) + '</p>' : '') + '</div><div class="figtools">' + (o.extra || '') +
      '<div class="vt" role="group" aria-label="View"><button type="button" data-view="chart" class="on">Figure</button><button type="button" data-view="table">Table</button></div></div></div>' +
      (o.legend || '') + '<div class="chart-slot" id="ch-' + o.id + '" style="min-height:' + (o.h || 220) + 'px"></div><div class="table-slot">' + (o.table || '') + '</div></figure>';
  };
  U.simpleTable = function (cols, rows, cls) {
    return '<div class="tbl-wrap"><table class="tbl ' + (cls || '') + '"><thead><tr>' + cols.map(c => '<th' + (c.r ? ' class="r"' : '') + '>' + esc(c.h || c) + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map(r => '<tr>' + r.map((c, i) => '<td' + (cols[i] && cols[i].r ? ' class="r num"' : '') + '>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  };
  U.box = (title, inner, cls) => '<section class="box ' + (cls || '') + '">' + (title ? '<span class="box-t">' + title + '</span>' : '') + inner + '</section>';
  U.plate = (name, o) => NE.ht.plate(name, o);

  /* ------------------------------------------------------------------ controls */
  U.seg = function (name, opts, val, cls) {
    return '<div class="tabs ' + (cls === 'seg-sm' ? 'sm' : (cls || '')) + '" role="group" data-seg="' + name + '">' + opts.map(o => '<button type="button" data-val="' + esc(o.v) + '" class="' + (String(o.v) === String(val) ? 'on' : '') + '" aria-pressed="' + (String(o.v) === String(val)) + '">' + o.l + '</button>').join('') + '</div>';
  };
  U.select = function (name, opts, val, label) {
    return '<label class="fld">' + (label ? '<span>' + esc(label) + '</span>' : '') + '<select data-sel="' + name + '">' + opts.map(o => '<option value="' + esc(o.v) + '"' + (String(o.v) === String(val) ? ' selected' : '') + '>' + esc(o.l) + '</option>').join('') + '</select></label>';
  };

  /* ------------------------------------------------------------------ sport filter (global state) */
  NE.state = NE.state || {};
  NE.state.sport = NE.store.get('sport', { group: 'All', key: null });
  U.sportMatch = function (key) { const s = NE.state.sport, sp = D.SPORT[key]; return s.group === 'All' || (sp.group === s.group && (!s.key || s.key === key)); };
  U.sportSet = () => new Set(D.SPORTS.filter(s => U.sportMatch(s.key)).map(s => s.key));
  U.sportFilterHTML = function (counts) {
    const s = NE.state.sport;
    const gc = g => (counts ? D.SPORTS.filter(x => x.group === g).reduce((a, x) => a + (counts[x.key] || 0), 0) : null);
    let h = '<div class="sportbar" role="toolbar" aria-label="Filter by sport"><div class="tabs"><button type="button" class="' + (s.group === 'All' ? 'on' : '') + '" data-sg="All">All sports' + (counts ? '<sup>' + Object.keys(counts).reduce((a, k) => a + counts[k], 0) + '</sup>' : '') + '</button>';
    D.GROUPS.forEach(g => { h += '<button type="button" class="' + (s.group === g ? 'on' : '') + '" data-sg="' + g + '">' + g + (counts ? '<sup>' + gc(g) + '</sup>' : '') + '</button>'; });
    h += '</div>';
    const subs = s.group !== 'All' ? D.SPORTS.filter(x => x.group === s.group) : [];
    if (subs.length > 1) h += '<div class="row2"><button type="button" class="' + (!s.key ? 'on' : '') + '" data-sk="">All ' + esc(s.group) + '</button>' + subs.map(x => '<button type="button" class="' + (s.key === x.key ? 'on' : '') + '" data-sk="' + x.key + '">' + esc(x.name) + (counts ? '<em>' + (counts[x.key] || 0) + '</em>' : '') + '</button>').join('') + '</div>';
    return h + '</div>';
  };
  U.mountSportFilter = function (el, onChange, countsFn) {
    const draw = () => { el.innerHTML = U.sportFilterHTML(countsFn ? countsFn() : null); };
    draw();
    el.onclick = function (e) {
      const g = e.target.closest('[data-sg]'), k = e.target.closest('[data-sk]');
      if (g) NE.state.sport = { group: g.dataset.sg, key: null }; else if (k) NE.state.sport = { group: NE.state.sport.group, key: k.dataset.sk || null }; else return;
      NE.store.set('sport', NE.state.sport); draw(); onChange();
    };
    return draw;
  };

  /* ------------------------------------------------------------------ popovers / book picker */
  U.bookPicker = function (el, books, sel, onChange) {
    const draw = function () {
      el.innerHTML = '<button type="button" class="btn sm" data-pop>Books <b class="mono">' + sel.size + '/' + books.length + '</b> ' + U.icon('chevD', 12) + '</button>' +
        '<div class="pop"><div class="pop-h"><span>Bookmakers</span><span><button type="button" class="link" data-bk-all>All</button> · <button type="button" class="link" data-bk-sharp>Sharp only</button></span></div>' +
        books.map(k => '<label class="chk"><input type="checkbox" data-bk="' + k + '"' + (sel.has(k) ? ' checked' : '') + '>' + U.book(k) + '<span>' + esc(D.BOOK[k].name) + '</span></label>').join('') + '</div>';
    };
    draw(); el.classList.add('pop-wrap');
    el.addEventListener('change', function (e) {
      const c = e.target.closest('[data-bk]'); if (!c) return;
      if (c.checked) sel.add(c.dataset.bk); else sel.delete(c.dataset.bk);
      if (!sel.size) { sel.add(c.dataset.bk); c.checked = true; }
      el.querySelector('[data-pop] b').textContent = sel.size + '/' + books.length; onChange();
    });
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-bk-all]')) { books.forEach(b => sel.add(b)); draw(); el.classList.add('open'); onChange(); }
      if (e.target.closest('[data-bk-sharp]')) { sel.clear(); sel.add('pin'); draw(); el.classList.add('open'); onChange(); }
    });
  };
  document.addEventListener('click', function (e) {
    const t = e.target.closest('[data-pop]');
    document.querySelectorAll('.pop-wrap.open').forEach(w => { if (!t || !w.contains(t)) w.classList.remove('open'); });
    if (t) { const w = t.closest('.pop-wrap'); if (w) w.classList.toggle('open'); }
  });

  /* ------------------------------------------------------------------ drawer / modal / toast */
  U.openDrawer = function (html, onMount, o) {
    U.closeDrawer(true);
    const wrap = document.createElement('div'); wrap.className = 'drawer-wrap';
    wrap.innerHTML = '<div class="scrim" data-close></div><aside class="drawer ' + ((o && o.cls) || '') + '" role="dialog" aria-modal="true" tabindex="-1"><div class="dr-scroll">' + html + '</div></aside>';
    document.body.appendChild(wrap); document.body.classList.add('noscroll');
    requestAnimationFrame(() => wrap.classList.add('in'));
    wrap.addEventListener('click', e => { if (e.target.closest('[data-close]')) U.closeDrawer(); });
    U._drawer = wrap;
    const dr = wrap.querySelector('.drawer'); dr.focus(); if (onMount) onMount(dr); return dr;
  };
  U.closeDrawer = function (instant) {
    const w = U._drawer; if (!w) return;
    U._drawer = null; document.body.classList.remove('noscroll'); NE.charts.hideTip();
    if (instant) { w.remove(); return; }
    w.classList.remove('in'); setTimeout(() => w.remove(), 230);
    if (U.onDrawerClose) U.onDrawerClose();
  };
  let slipNo = 100 + Math.floor(Math.random() * 800);
  U.modal = function (o) {
    U.closeModal();
    const wrap = document.createElement('div'); wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="scrim" data-mclose></div><div class="modal ' + (o.foot ? 'hf ' : '') + (o.cls || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '"><header><div><span class="slip-no">' + (o.noSlip ? 'Notice' : 'Slip № ' + String(++slipNo).padStart(6, '0')) + '</span><h3>' + esc(o.title) + '</h3></div><button type="button" class="iconbtn" data-mclose aria-label="Close">' + U.icon('x', 16) + '</button></header><div class="modal-b">' + o.body + '</div>' + (o.foot ? '<footer>' + o.foot + '</footer>' : '') + '</div>';
    document.body.appendChild(wrap); document.body.classList.add('noscroll'); U._modal = wrap;
    requestAnimationFrame(() => wrap.classList.add('in'));
    wrap.addEventListener('click', e => { if (e.target.closest('[data-mclose]')) U.closeModal(); });
    if (o.onMount) o.onMount(wrap.querySelector('.modal'));
    return wrap.querySelector('.modal');
  };
  U.closeModal = function () { const w = U._modal; if (!w) return; U._modal = null; if (!U._drawer) document.body.classList.remove('noscroll'); w.remove(); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (U._modal) U.closeModal(); else if (U._drawer) U.closeDrawer(); } });
  U.toast = function (msg, kind) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.innerHTML = '<b>' + (kind === 'warn' ? 'Notice' : 'Wire') + '</b><span></span>'; t.querySelector('span').textContent = msg;
    box.appendChild(t); requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 250); }, 3600);
  };

  /* ------------------------------------------------------------------ figure view toggle */
  document.addEventListener('click', function (e) {
    const b = e.target.closest('.fig [data-view]'); if (!b) return;
    const card = b.closest('.fig'), tbl = b.dataset.view === 'table';
    card.classList.toggle('show-table', tbl);
    card.querySelectorAll('[data-view]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    if (!tbl) window.dispatchEvent(new Event('resize'));
  });

  /* ------------------------------------------------------------------ price-flash diff (simulated live feed) */
  const lastVals = new Map();
  U.flashDiff = function (root) {
    root.querySelectorAll('[data-fk]').forEach(function (el) {
      const k = el.dataset.fk, v = parseFloat(el.dataset.fv), old = lastVals.get(k);
      if (old != null && old !== v) { el.classList.remove('flash-up', 'flash-dn', 'flip'); void el.offsetWidth; el.classList.add(v > old ? 'flash-up' : 'flash-dn', 'flip'); }
      lastVals.set(k, v);
    });
  };
})(window.NE);
