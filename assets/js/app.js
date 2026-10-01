/* The Closing Line — router, masthead / section bar / wire tape, global behaviours */
(function (NE) {
  'use strict';
  const D = NE.data, U = NE.ui, esc = NE.esc;
  const App = NE.app = {};

  const ROUTES = [
    [/^\/?$/, 'landing', 'site'], [/^\/pricing$/, 'pricing', 'site'],
    [/^\/app\/?$/, 'dashboard', 'app'], [/^\/app\/props$/, 'props', 'app'], [/^\/app\/odds$/, 'odds', 'app'], [/^\/app\/ev$/, 'ev', 'app'],
    [/^\/app\/arbs$/, 'arbs', 'app'], [/^\/app\/events$/, 'events', 'app'], [/^\/app\/event\/(\w+)$/, 'event', 'app'], [/^\/app\/player\/([\w-]+)$/, 'player', 'app'],
    [/^\/app\/clv$/, 'clv', 'app'], [/^\/app\/calculator$/, 'calc', 'app'], [/^\/app\/reports$/, 'reports', 'app'], [/^\/app\/coverage$/, 'coverage', 'app'], [/^\/app\/settings$/, 'settings', 'app']
  ];
  const SECTIONS = [
    { k: 'dashboard', href: '#/app', b: 'Front Page', s: 'Dashboard' }, { k: 'props', href: '#/app/props', b: 'The Card', s: 'Props screen' },
    { k: 'odds', href: '#/app/odds', b: 'The Board', s: 'Odds screen' }, { k: 'ev', href: '#/app/ev', b: 'Edges', s: '+EV finder', nb: 'ev' },
    { k: 'arbs', href: '#/app/arbs', b: 'Crossings', s: 'Arbitrage', nb: 'arb' }, { k: 'events', href: '#/app/events', b: 'Fixtures', s: 'Matchups & H2H' },
    { k: 'clv', href: '#/app/clv', b: 'The Ledger', s: 'CLV tracker' }, { k: 'calc', href: '#/app/calculator', b: 'Workbench', s: 'Devig calculator' },
    { k: 'reports', href: '#/app/reports', b: 'Almanac', s: 'Reports & trends' }, { k: 'coverage', href: '#/app/coverage', b: 'Index', s: 'Coverage' },
    { k: 'settings', href: '#/app/settings', b: 'Desk', s: 'Settings' }
  ];
  const NAV_ALIAS = { event: 'events', player: 'props' };
  let root, layout = null, current = null, ctx = null;

  function parseHash() {
    const h = location.hash.replace(/^#/, '') || '/', i = h.indexOf('?'), path = i < 0 ? h : h.slice(0, i), q = {};
    (i < 0 ? '' : h.slice(i + 1)).split('&').filter(Boolean).forEach(kv => { const p = kv.split('='); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); });
    return { path, query: q };
  }

  /* ------------------------------------------------------------------ edition info */
  const now = new Date();
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  App.edition = { date: now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), no: doy };

  /* ------------------------------------------------------------------ shells */
  const TITLE = '<a class="mast-title" href="#/" aria-label="The Closing Line — home"><span class="the">The</span>Closing Line</a>';
  function navHTML() {
    return SECTIONS.map(function (s) {
      let nb = '';
      if (s.nb === 'ev') nb = '<span class="nb" id="nb-ev">' + D.evFeed({ minEV: 3 }).length + '</span>'; else if (s.nb === 'arb') nb = '<span class="nb" id="nb-arb">' + D.arbs().filter(a => a.profit >= 0.01).length + '</span>';
      return '<a class="sec-tab" href="' + s.href + '" data-k="' + s.k + '"><b>' + s.b + '</b><small>' + s.s + '</small>' + nb + '</a>';
    }).join('');
  }
  function toolsHTML() {
    return '<div class="search" role="search"><input id="gsearch" type="search" placeholder="Search players, teams, matchups" autocomplete="off" aria-label="Search"><kbd>/</kbd><div class="sres" id="sres"></div></div>' +
      '<label class="fmt"><span class="lbl">Prices</span><select id="oddsfmt" aria-label="Odds format"><option value="american">American</option><option value="decimal">Decimal</option><option value="implied">Implied %</option></select></label>' +
      '<div class="dn" id="themebtn" role="switch" tabindex="0" aria-label="Day or night edition"><span data-t="light">Day</span><span data-t="dark">Night</span></div>' +
      '<div class="pop-wrap" id="alertwrap"><button class="wirebtn" data-pop aria-label="Wire alerts">Wire <b id="alertbadge">0</b></button><div class="pop alerts-pop" id="alertlist"></div></div>' +
      '<div class="pop-wrap"><button class="usr" data-pop aria-label="Account"><i>DA</i><em style="font-style:normal">Desk</em></button><div class="pop right menu" style="min-width:200px"><a href="#/app/settings">Preferences</a><a href="#/pricing">Subscription rates</a><a href="#/">Front door</a></div></div>';
  }
  function appShell() {
    return '<header class="mast"><div class="wrap mast-top"><div class="mast-meta"><b>' + esc(App.edition.date) + '</b><br>Vol. IV · No. ' + App.edition.no + ' · Specimen copy</div>' + TITLE + '<div class="mast-tools">' + toolsHTML() + '</div></div></header>' +
      '<nav class="sections" id="sections" aria-label="Sections"><div class="wrap"><a class="mini-brand" href="#/">The Closing Line</a>' + navHTML() + '</div></nav>' +
      '<main class="wrap" id="view" tabindex="-1"></main>' +
      '<footer class="colophon"><div class="wrap"><span><b>The Closing Line</b> — a specimen copy. All odds, players, lines and results are simulated; nothing here is betting advice. 18+, play responsibly.</span><span><a href="#" data-credits class="link">Photo credits</a> · Typefaces: Bodoni Moda, Big Shoulders Display, Newsreader, Azeret Mono, DSEG7 (OFL)</span></div></footer>';
  }
  // Masthead for marketing pages (rendered by the pages themselves)
  App.siteMast = function (active) {
    return '<header class="smast"><div class="wrap"><div class="smast-top"><div class="mast-meta"><b>' + esc(App.edition.date) + '</b><br>Vol. IV · No. ' + App.edition.no + ' · Specimen copy</div>' +
      '<a class="smast-title" href="#/" aria-label="The Closing Line"><span class="the">The</span>Closing Line</a>' +
      '<div class="mast-tools"><div class="dn" id="themebtn" role="switch" tabindex="0" aria-label="Day or night edition"><span data-t="light">Day</span><span data-t="dark">Night</span></div><a class="btn red" href="#/app">Open the desk ' + U.icon('arrowR', 14) + '</a></div></div>' +
      '<div class="smast-tag"><span>The daily form sheet for the sports the big books forget</span></div>' +
      '<nav class="smast-nav"><a href="#/" data-scroll="lead" class="' + (active === 'home' ? 'on' : '') + '">Front page</a><a href="#/" data-scroll="sports">Sports</a><a href="#/" data-scroll="features">Features</a><a href="#/" data-scroll="how">Method</a><a href="#/pricing" class="' + (active === 'pricing' ? 'on' : '') + '">Rates</a><a href="#/app/coverage">Index</a><a href="#/app">The desk</a></nav></div></header>';
  };
  App.siteFoot = function () {
    return '<footer class="colophon site"><div class="wrap"><span><b>The Closing Line</b> — specimen copy. All odds, players, lines and results shown are simulated and are not betting advice. 18+ · play responsibly.</span><span><a href="#" data-credits class="link">Photo credits</a> · <a href="#/app/coverage" class="link">Index</a> · <a href="#/pricing" class="link">Rates</a></span></div></footer>';
  };

  /* ------------------------------------------------------------------ lifecycle */
  function teardown() {
    if (ctx) ctx.cleanup.forEach(f => { try { f(); } catch (e) { /* noop */ } });
    if (current && current.unmount) { try { current.unmount(ctx); } catch (e) { console.error(e); } }
    NE.charts.cleanup(); NE.ht.cleanup(); U.closeDrawer(true); U.closeModal(); U.onDrawerClose = null; ctx = null; current = null;
  }
  function ensureLayout(kind) {
    if (layout === kind) return;
    root.innerHTML = kind === 'app' ? appShell() : '<div id="view"></div>';
    layout = kind; bindShell(kind); updateTheme(); updateAlerts(); syncFmt(); window.scrollTo(0, 0);
  }
  function mountPage(keepScroll) {
    const y = window.scrollY, view = document.getElementById('view'), page = NE.pages[ctx.name];
    if (!page) { view.innerHTML = U.empty('Page not found', 'This route does not exist in the specimen.'); return; }
    current = page; document.title = (page.title ? page.title + ' — ' : '') + 'The Closing Line';
    view.innerHTML = page.render(ctx);
    if (page.mount) page.mount(view, ctx);
    NE.ht.mountAll(view);
    if (layout === 'site') { bindSiteMast(); updateTheme(); }
    if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
    const key = NAV_ALIAS[ctx.name] || ctx.name;
    document.querySelectorAll('.sec-tab').forEach(a => a.classList.toggle('on', a.dataset.k === key));
    const on = document.querySelector('.sec-tab.on'); if (on && on.scrollIntoView) { const w = on.parentNode; w.scrollLeft = on.offsetLeft - 40; }
  }
  function route() {
    const h = parseHash(); let m = null, name = 'notfound', kind = 'site';
    for (let i = 0; i < ROUTES.length; i++) { m = h.path.match(ROUTES[i][0]); if (m) { name = ROUTES[i][1]; kind = ROUTES[i][2]; break; } }
    teardown(); ensureLayout(kind);
    ctx = { name, params: m ? m.slice(1) : [], query: h.query, cleanup: [], on(ev, fn) { ctx.cleanup.push(NE.bus.on(ev, fn)); } };
    mountPage(false);
    if (h.query.scroll) setTimeout(() => { const t = document.getElementById(h.query.scroll); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
  }
  App.refresh = function () { if (!ctx) return; const c = ctx; c.cleanup.forEach(f => f()); c.cleanup = []; NE.charts.cleanup(); NE.ht.cleanup(); if (current && current.unmount) current.unmount(c); mountPage(true); };
  App.go = function (hash) { if (location.hash === hash) route(); else location.hash = hash; };

  /* ------------------------------------------------------------------ shell behaviours */
  function updateTheme() {
    document.documentElement.dataset.theme = NE.settings.theme;
    document.querySelectorAll('#themebtn').forEach(b => { b.setAttribute('aria-checked', NE.settings.theme === 'dark'); b.querySelectorAll('span').forEach(s => s.classList.toggle('on', s.dataset.t === NE.settings.theme)); });
  }
  App.setTheme = function (t) { NE.settings.theme = t; NE.saveSettings(); updateTheme(); App.refresh(); };
  function syncFmt() { const s = document.getElementById('oddsfmt'); if (s) s.value = NE.settings.oddsFormat; }
  App.setOddsFormat = function (f) { NE.settings.oddsFormat = f; NE.saveSettings(); syncFmt(); App.refresh(); updateTape(); };

  const AL_TAG = { ev: 'EV', arb: 'ARB', steam: 'STM' };
  function updateAlerts() {
    const l = document.getElementById('alertlist'), b = document.getElementById('alertbadge');
    if (l) l.innerHTML = D.alerts.length ? '<div class="pop-h"><span>Telegrams</span><button type="button" class="link" data-alerts-read>Mark all read</button></div>' + D.alerts.slice(0, 8).map(a => '<a class="al ' + a.type + '" href="' + esc(a.href || '#/app') + '"><span class="ai">' + (AL_TAG[a.type] || '•') + '</span><div><b>' + esc(a.title) + '</b><span>' + esc(a.body) + '</span><small>' + NE.ago(a.t) + '</small></div></a>').join('') : '<div class="none" style="padding:16px;color:var(--ink-3);font-style:italic">No telegrams yet.</div>';
    if (b) { b.textContent = D.unread; b.parentNode.style.display = ''; b.style.visibility = D.unread ? 'visible' : 'hidden'; }
  }
  function bindThemeBtn() { document.querySelectorAll('#themebtn').forEach(b => { b.onclick = () => App.setTheme(NE.settings.theme === 'dark' ? 'light' : 'dark'); b.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } }; }); }
  function bindSiteMast() { bindThemeBtn(); }
  function bindShell(kind) {
    bindThemeBtn();
    if (kind === 'site') return;
    const secs = document.getElementById('sections'), mast = document.querySelector('.mast');
    const onScroll = () => secs && secs.classList.toggle('stuck', window.scrollY > mast.offsetHeight + 24);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    document.getElementById('oddsfmt').onchange = e => App.setOddsFormat(e.target.value);
    const al = document.getElementById('alertwrap');
    al.addEventListener('click', function (e) {
      if (e.target.closest('[data-alerts-read]')) { D.unread = 0; updateAlerts(); e.preventDefault(); return; }
      if (e.target.closest('[data-pop]')) { D.unread = 0; setTimeout(updateAlerts, 0); }
      if (e.target.closest('a.al')) al.classList.remove('open');
    });
    const inp = document.getElementById('gsearch'), box = document.getElementById('sres');
    const run = NE.debounce(function () {
      const q = inp.value.trim(); if (q.length < 2) { box.classList.remove('open'); return; }
      const res = D.search(q);
      box.innerHTML = res.length ? res.map(r => '<a href="' + r.href + '">' + U.sportBadge(r.sport) + '<span class="t"><b>' + esc(r.label) + '</b><span>' + esc(r.sub) + '</span></span><span class="tag">' + r.type + '</span></a>').join('') : '<div class="none">No results for “' + esc(q) + '”</div>';
      box.classList.add('open');
    }, 120);
    inp.addEventListener('input', run);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { const a = box.querySelector('a'); if (a) { location.hash = a.getAttribute('href'); inp.blur(); box.classList.remove('open'); inp.value = ''; } } if (e.key === 'Escape') { box.classList.remove('open'); inp.blur(); } });
    box.addEventListener('click', () => { box.classList.remove('open'); inp.value = ''; });
    document.addEventListener('click', e => { if (!e.target.closest('.search')) box.classList.remove('open'); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { const i = document.getElementById('gsearch'); if (i) { e.preventDefault(); i.focus(); } } });

  document.addEventListener('click', function (e) {
    const sc = e.target.closest('[data-scroll]');
    if (sc) { e.preventDefault(); const id = sc.dataset.scroll; if (location.hash === '#/' || location.hash === '' || location.hash === '#') { const t = document.getElementById(id); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } else location.hash = '#/?scroll=' + id; }
    if (e.target.closest('[data-credits]')) {
      e.preventDefault(); const c = NE.credits || {};
      U.modal({ title: 'Photo credits', noSlip: true, body: '<p class="t2" style="font-style:italic">Photographs are printed as halftones from Wikimedia Commons images (Creative Commons / public domain). Hover a plate to develop the original. Replace with licensed imagery before launch.</p><ul class="credits">' + Object.keys(c).map(k => '<li><b>' + esc(c[k].title) + '</b><br><span>© ' + esc(c[k].author || 'Unknown') + ' · <a href="' + esc(c[k].licenseUrl || c[k].source) + '" target="_blank" rel="noopener">' + esc(c[k].license || 'license') + '</a> · <a href="' + esc(c[k].source) + '" target="_blank" rel="noopener">source</a></span></li>').join('') + '</ul>' });
    }
  });

  /* ------------------------------------------------------------------ the wire (bottom tape) */
  const tape0 = Date.now();
  function tapeHTML() {
    const out = [], ev = D.evFeed({ minEV: 4 }).filter(f => f.e < 0.17).slice(0, 12);
    const movers = D.events.filter(e => !D.isLive(e)).map(e => ({ e, d: (D.mainFair(e.mk.ml)[0] - e.openP) * 100 })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 8);
    for (let i = 0; i < Math.max(ev.length, movers.length); i++) {
      const f = ev[i], m = movers[i];
      if (f) out.push('<a href="' + (f.kind === 'prop' ? '#/app/props?open=' + f.prop.id : '#/app/event/' + f.ev.id) + '"><i class="u">▲</i><b>' + NE.fmtEV(f.e) + '</b> ' + esc(D.pickLabel(f)) + ' <i>@ ' + esc(D.BOOK[f.book].short) + ' ' + NE.fmtOdds(f.dec) + '</i></a>');
      if (m) out.push('<a href="#/app/event/' + m.e.id + '"><i class="' + (m.d >= 0 ? 'u' : 'd') + '">' + (m.d >= 0 ? '▲' : '▼') + '</i><b>' + esc(m.e.p[0].short || m.e.p[0].name) + '</b> win prob ' + NE.fmtSigned(m.d, 1, ' pts') + '</a>');
    }
    return out.join('');
  }
  function mountTape() {
    let t = document.getElementById('tape'); if (t) return;
    t = document.createElement('div'); t.id = 'tape'; t.setAttribute('role', 'marquee'); t.setAttribute('aria-label', 'Live edges and line moves');
    t.innerHTML = '<div class="tp-l">The Wire</div><div class="tp-v"><div class="tp-t" id="tapeTrack"></div></div>'; document.body.appendChild(t); updateTape();
  }
  function updateTape() {
    const tr = document.getElementById('tapeTrack'); if (!tr) return; const h = tapeHTML();
    tr.innerHTML = h + h; tr.style.animationDelay = '-' + (((Date.now() - tape0) / 1000) % 120).toFixed(1) + 's';
  }

  /* ------------------------------------------------------------------ boot */
  App.boot = function () {
    root = document.getElementById('root'); document.documentElement.dataset.theme = NE.settings.theme;
    window.addEventListener('hashchange', route); route(); mountTape();
    setInterval(function () { if (!document.hidden) D.tick(); }, 6000);
    setInterval(function () { const f = document.getElementById('feed-t'); if (f) f.textContent = 'Updated ' + Math.max(1, Math.round((Date.now() - D.lastTick) / 1000)) + 's ago'; }, 1000);
    NE.bus.on('tick', function () {
      const e = document.getElementById('nb-ev'); if (e) e.textContent = D.evFeed({ minEV: 3 }).length;
      const a = document.getElementById('nb-arb'); if (a) a.textContent = D.arbs().filter(x => x.profit >= 0.01).length;
      if (D.tickCount % 3 === 0) updateTape();
      if (NE.rng(String(D.tickCount) + 'al').chance(0.12)) {
        const top = D.evFeed({ minEV: NE.settings.alertMinEV }).filter(f => f.e < 0.16);
        if (top.length) { const f = top[(D.tickCount * 7) % top.length]; D.pushAlert({ type: 'ev', title: 'New edge ' + NE.fmtEV(f.e), body: D.pickLabel(f) + ' @ ' + D.BOOK[f.book].name + ' ' + NE.fmtOdds(f.dec), href: f.kind === 'prop' ? '#/app/props?open=' + f.prop.id : '#/app/event/' + f.ev.id }); }
      }
    });
    NE.bus.on('alert', function (a) { updateAlerts(); if (layout === 'app') U.toast(a.title + ' — ' + a.body, a.type === 'steam' ? 'warn' : ''); });
  };
})(window.NE);
