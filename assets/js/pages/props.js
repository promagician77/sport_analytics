/* The Closing Line — The Card (props screen) + player dossier drawer */
(function (NE) {
  'use strict';
  const D = NE.data, U = NE.ui, C = NE.charts, esc = NE.esc;

  const S = { market: 'all', side: 'best', minHit: 0, win: 10, minEV: -100, q: '', sort: 'score', dir: -1, limit: 60, books: null, hideLive: false };
  const lineTxt = (side, line) => (side === 0 ? 'Over ' : 'Under ') + NE.fmtLine(line);
  const startTxt = ev => (D.isLive(ev) ? 'Live' : NE.fmtDay(ev.start) + ' ' + NE.fmtTime(ev.start));

  /* ---------------------------------------------------------------- rows */
  function buildRows() {
    const sports = U.sportSet(), q = S.q.trim().toLowerCase(), books = S.books || new Set(Object.keys(D.BOOK)), rows = [];
    D.props.forEach(function (pr) {
      if (!sports.has(pr.sport)) return;
      const ev = D.byEvent[pr.ev];
      if (S.hideLive && D.isLive(ev)) return;
      if (S.market !== 'all' && pr.label !== S.market) return;
      if (q && !(pr.player.toLowerCase().includes(q) || pr.team.toLowerCase().includes(q) || pr.opp.toLowerCase().includes(q))) return;
      const v = D.propView(pr, S.side === 'best' ? 'best' : S.side, null, books);
      if (!v) return;
      v.ev = ev;
      if (v.e * 100 < S.minEV) return;
      if (S.minHit) { const h = v['h' + S.win]; if (!h || h.pct == null || h.pct * 100 < S.minHit) return; }
      rows.push(v);
    });
    const val = { score: r => r.e + 0.5 * ((r.h10.pct == null ? 0.5 : r.h10.pct) - 0.5), ev: r => r.e, h5: r => (r.h5.pct == null ? -1 : r.h5.pct), h10: r => (r.h10.pct == null ? -1 : r.h10.pct), h20: r => (r.h20.pct == null ? -1 : r.h20.pct), hh: r => (r.hh.pct == null ? -1 : r.hh.pct + r.hh.total * 0.001), start: r => -r.ev.start, dec: r => r.dec }[S.sort] || (r => r.e);
    rows.sort((a, b) => (val(b) - val(a)) * (S.dir === -1 ? 1 : -1) || b.e - a.e);
    return rows;
  }
  function rowHTML(v, i) {
    const pr = v.prop, ev = v.ev, fk = 'p|' + pr.id + '|' + v.book + '|' + v.side, ind = D.SPORT[pr.sport].kind === 'ind';
    return '<tr class="click" tabindex="0" data-id="' + pr.id + '"><td class="ix num">' + (i + 1) + '</td><td><div class="mu">' + U.sportBadge(pr.sport) + '<div class="stack"><b>' + esc(pr.player) + '</b><small>' + (ind ? 'v ' + esc(pr.opp) : esc(pr.team) + ' v ' + esc(pr.opp)) + ' · ' + (D.isLive(ev) ? '<span class="live"><i></i>Live</span>' : startTxt(ev)) + '</small></div></div></td>' +
      '<td><div class="selc"><span class="sd ' + (v.side ? 'u' : 'o') + '">' + (v.side ? 'Under' : 'Over') + '</span><b class="num">' + NE.fmtLine(v.line) + '</b></div><small class="mk">' + esc(pr.label) + '</small></td>' +
      '<td class="c"><div class="bestp">' + U.book(v.book) + U.odds(v.dec, { best: true, fk }) + '</div><small class="fairl">fair ' + NE.fmtOdds(v.fairDec) + '</small></td><td class="c">' + U.evPill(v.e) + '</td>' +
      '<td class="c">' + U.hitPill(v.h5) + '</td><td class="c">' + U.hitPill(v.h10) + '</td><td class="c">' + U.hitPill(v.h20) + '</td><td class="c">' + U.hitPill(v.hh, { frac: true }) + '</td>' +
      '<td class="c">' + C.sparkBars(pr.log.slice(0, 10).map(g => g.v).reverse(), v.line, v.side, { bw: 6, h: 26 }) + '</td><td class="r num">' + v.avg10.toFixed(v.avg10 >= 20 ? 1 : 2) + '</td></tr>';
  }
  const th = (key, label, cls) => '<th class="sortable' + (S.sort === key ? ' on' : '') + (cls ? ' ' + cls : '') + '" data-sort="' + key + '">' + label + (S.sort === key ? (S.dir === -1 ? ' ↓' : ' ↑') : '') + '</th>';
  const opt = (arr, cur) => arr.map(o => '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + o[1] + '</option>').join('');

  /* ---------------------------------------------------------------- page */
  NE.pages.props = {
    title: 'The Card',
    render() {
      const markets = Array.from(new Set(D.props.filter(p => U.sportMatch(p.sport)).map(p => p.label))).sort();
      if (S.market !== 'all' && !markets.includes(S.market)) S.market = 'all';
      return U.pgh({ k: 'Props screen', t: 'The Card', s: 'Every player prop on the board with its best price, the Pinnacle-devigged fair price, and how often it has landed over the last 5, 10 and 20 games and against tonight’s opponent. Click a row for the full dossier.',
        a: '<button class="btn" id="pCsv">' + U.icon('download', 14) + ' Export CSV</button>' }) +
        '<section class="ctl"><div id="pSport"></div><div class="ctl-row">' +
        '<label class="fld"><span>Market</span><select id="pMarket"><option value="all">All markets</option>' + markets.map(m => '<option' + (m === S.market ? ' selected' : '') + '>' + esc(m) + '</option>').join('') + '</select></label>' +
        '<div class="fld"><span>Side</span>' + U.seg('side', [{ v: 'best', l: 'Best edge' }, { v: 'over', l: 'Over' }, { v: 'under', l: 'Under' }], S.side, 'sm') + '</div>' +
        '<div class="fld"><span>Hit rate at least</span><div class="inl"><select id="pMinHit">' + opt([[0, 'Any'], [50, '50%'], [60, '60%'], [70, '70%'], [80, '80%'], [90, '90%']], S.minHit) + '</select>' + U.seg('win', [{ v: 5, l: 'L5' }, { v: 10, l: 'L10' }, { v: 20, l: 'L20' }], S.win, 'sm') + '</div></div>' +
        '<label class="fld"><span>Edge at least</span><select id="pMinEV">' + opt([[-100, 'Any'], [0, '0%'], [2, '2%'], [5, '5%'], [8, '8%']], S.minEV) + '</select></label>' +
        '<label class="fld"><span>Rank by</span><select id="pSort">' + opt([['score', 'Edge + hit rate'], ['ev', 'Edge'], ['h10', 'L10 hit rate'], ['h5', 'L5 hit rate'], ['h20', 'L20 hit rate'], ['hh', 'H2H hit rate'], ['start', 'Start time']], S.sort) + '</select></label>' +
        '<label class="fld"><span>Devig method</span><select id="pDevig">' + NE.DEVIG_METHODS.map(m => '<option value="' + m.key + '"' + (m.key === NE.settings.devig ? ' selected' : '') + '>' + m.label.split(' (')[0] + '</option>').join('') + '</select></label>' +
        '<div class="fld"><span>Bookmakers</span><div class="pop-wrap" id="pBooks"></div></div>' +
        '<label class="chk" style="padding-bottom:6px"><input type="checkbox" id="pLive"' + (S.hideLive ? ' checked' : '') + '><span>Hide live</span></label>' +
        '<div class="grow"></div><label class="fld"><span>Find</span><input type="search" id="pQ" placeholder="Player or team" value="' + esc(S.q) + '" style="width:200px" aria-label="Filter players"></label></div></section>' +
        '<section class="sheet"><div class="tbl-wrap" id="pTbl"></div><div class="tbl-foot" id="pFoot"></div></section>';
    },
    mount(view, ctx) {
      const tbl = view.querySelector('#pTbl'), foot = view.querySelector('#pFoot'); let rows = [];
      function draw() {
        rows = buildRows(); const shown = rows.slice(0, S.limit);
        tbl.innerHTML = rows.length ? '<table class="tbl props"><thead><tr><th class="ix">№</th><th>Player</th><th>Selection</th>' + th('dec', 'Best price', 'c') + th('ev', 'Edge', 'c') + th('h5', 'L5', 'c mn') + th('h10', 'L10', 'c mn') + th('h20', 'L20', 'c mn') + th('hh', 'H2H', 'c mn') + '<th class="c">Last 10</th><th class="r">Avg L10</th></tr></thead><tbody>' + shown.map(rowHTML).join('') + '</tbody></table>' : U.empty('Nothing on the card matches', 'Loosen the hit-rate or edge thresholds, or pick another sport.');
        foot.innerHTML = rows.length ? '<span>Showing ' + shown.length + ' of ' + rows.length + ' props · average edge of those shown <b class="mono ' + (NE.mean(shown.map(r => r.e)) >= 0 ? 'pos' : 'neg') + '">' + NE.fmtEV(NE.mean(shown.map(r => r.e))) + '</b></span>' + (rows.length > shown.length ? '<button class="btn sm" id="pMore">Show 60 more</button>' : '') : '';
        U.flashDiff(tbl);
      }
      U.mountSportFilter(view.querySelector('#pSport'), () => { S.limit = 60; refreshMarkets(); draw(); }, () => { const c = {}; D.props.forEach(p => { c[p.sport] = (c[p.sport] || 0) + 1; }); return c; });
      function refreshMarkets() {
        const markets = Array.from(new Set(D.props.filter(p => U.sportMatch(p.sport)).map(p => p.label))).sort();
        if (S.market !== 'all' && !markets.includes(S.market)) S.market = 'all';
        view.querySelector('#pMarket').innerHTML = '<option value="all">All markets</option>' + markets.map(m => '<option' + (m === S.market ? ' selected' : '') + '>' + esc(m) + '</option>').join('');
      }
      const ids = Object.keys(D.BOOK); if (!S.books) S.books = new Set(ids);
      U.bookPicker(view.querySelector('#pBooks'), ids, S.books, () => { S.limit = 60; draw(); });
      const q = s => view.querySelector(s);
      q('#pMarket').onchange = e => { S.market = e.target.value; S.limit = 60; draw(); };
      q('#pMinHit').onchange = e => { S.minHit = +e.target.value; draw(); };
      q('#pMinEV').onchange = e => { S.minEV = +e.target.value; draw(); };
      q('#pSort').onchange = e => { S.sort = e.target.value; S.dir = S.sort === 'start' ? 1 : -1; draw(); };
      q('#pDevig').onchange = e => { NE.settings.devig = e.target.value; NE.saveSettings(); draw(); };
      q('#pLive').onchange = e => { S.hideLive = e.target.checked; draw(); };
      q('#pQ').oninput = NE.debounce(e => { S.q = e.target.value; S.limit = 60; draw(); }, 140);
      view.addEventListener('click', function (e) {
        const sg = e.target.closest('[data-seg] button');
        if (sg) { const nm = sg.parentNode.dataset.seg; if (nm === 'side') S.side = sg.dataset.val; else if (nm === 'win') S.win = +sg.dataset.val; else return; sg.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === sg)); draw(); return; }
        const so = e.target.closest('[data-sort]');
        if (so) { const k = so.dataset.sort; if (S.sort === k) S.dir *= -1; else { S.sort = k; S.dir = k === 'start' ? 1 : -1; } const ps = q('#pSort'); if (ps) ps.value = S.sort; draw(); return; }
        if (e.target.closest('#pMore')) { S.limit += 60; draw(); return; }
        if (e.target.closest('#pCsv')) { exportCsv(rows); return; }
        const tr = e.target.closest('tr[data-id]'); if (tr) openProp(tr.dataset.id, { from: draw });
      });
      view.addEventListener('keydown', e => { if (e.key === 'Enter') { const tr = e.target.closest('tr[data-id]'); if (tr) openProp(tr.dataset.id); } });
      draw();
      ctx.on('tick', () => { if (!U._drawer) draw(); });
      if (ctx.query.open && D.byProp[ctx.query.open]) setTimeout(() => openProp(ctx.query.open), 80);
    }
  };

  function exportCsv(rows) {
    const head = ['Player', 'Team', 'Opponent', 'Sport', 'Market', 'Side', 'Line', 'Book', 'Decimal odds', 'Fair prob', 'EV %', 'L5 hit %', 'L10 hit %', 'L20 hit %'];
    const body = rows.map(v => [v.prop.player, v.prop.team, v.prop.opp, D.SPORT[v.prop.sport].name, v.prop.label, v.side ? 'Under' : 'Over', v.line, D.BOOK[v.book].name, v.dec, v.p.toFixed(4), (v.e * 100).toFixed(2), v.h5.pct == null ? '' : Math.round(v.h5.pct * 100), v.h10.pct == null ? '' : Math.round(v.h10.pct * 100), v.h20.pct == null ? '' : Math.round(v.h20.pct * 100)]);
    const csv = [head].concat(body).map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'closing-line-props.csv'; a.click();
    U.toast('Exported ' + rows.length + ' props to CSV');
  }

  /* ================================================================== */
  /* The dossier (detail drawer)                                         */
  /* ================================================================== */
  function openProp(id, opts) {
    const pr = D.byProp[id]; if (!pr) return;
    const ev = D.byEvent[pr.ev], sp = D.SPORT[pr.sport], books = S.books || new Set(Object.keys(D.BOOK));
    const v0 = D.propView(pr, S.side === 'best' ? 'best' : S.side, null, books) || D.propView(pr, 'best');
    const vals = pr.log.map(g => g.v), lo = Math.max(0.5, Math.floor(Math.min.apply(null, vals)) - 0.5), hi = Math.ceil(Math.max.apply(null, vals)) + 1.5;
    const st = { side: v0.side, n: 10, line: v0.line };
    const html = '<div class="dr"><header class="dr-h"><div><span class="k">Dossier · ' + esc(sp.name) + '</span><h2>' + esc(pr.player) + '</h2><p class="dr-sub">' + esc(pr.team) + ' v ' + esc(pr.opp) + ' · ' + esc(ev.league) + ' · ' + (D.isLive(ev) ? 'live now' : NE.fmtDateTime(ev.start)) + '</p></div><button class="iconbtn" data-close aria-label="Close">' + U.icon('x', 16) + '</button></header>' +
      '<div class="dr-b"><div class="dr-ctl"><div class="dr-prop"><span class="stamp">' + esc(pr.label) + '</span><div id="drSide"></div></div><div id="drN"></div></div>' +
      '<div class="kpis dr-kpis" id="drKpis"></div>' +
      '<figure class="fig" id="cc-drlog"><div class="fig-h"><div><span class="fig-n">Fig. 1</span><h3>Game log against the line</h3><p class="cap" id="drLogSub"></p></div><div class="figtools"><div class="vt"><button type="button" data-view="chart" class="on">Figure</button><button type="button" data-view="table">Table</button></div></div></div>' +
      '<div class="line-ctl"><button class="iconbtn sm" id="drMinus" aria-label="Lower the line">−</button><input type="range" id="drLine" min="' + lo + '" max="' + hi + '" step="1" value="' + st.line + '" aria-label="Adjust the line"><button class="iconbtn sm" id="drPlus" aria-label="Raise the line">+</button><span class="line-val num" id="drLineVal"></span><button class="link" id="drReset">Reset to best</button></div>' +
      C.legendHTML([{ name: 'Hit', color: 'var(--good)', icon: '✓' }, { name: 'Miss', color: 'var(--bad)', icon: '✕' }, { name: 'Push', color: 'var(--push)' }, { name: 'Line', color: 'var(--ink)', shape: 'line' }]) +
      '<div class="chart-slot" id="ch-drlog" style="min-height:250px"></div><div class="table-slot" id="drLogTbl"></div></figure>' +
      '<section class="dr-sec"><div class="sec-k"><span class="k">Splits</span><h3>Hit rate by sample</h3></div><div class="splits" id="drSplits"></div></section>' +
      '<section class="dr-sec"><div class="sec-k"><span class="k">The board</span><h3>Odds across books</h3></div><p class="sec-s" id="drBooksSub"></p><div class="tbl-wrap" id="drBooks"></div></section>' +
      '<figure class="fig" id="cc-drmv"><div class="fig-h"><div><span class="fig-n">Fig. 2</span><h3>Line movement</h3><p class="cap">Pinnacle fair probability, open to now.</p></div><div class="figtools"><div class="vt"><button type="button" data-view="chart" class="on">Figure</button><button type="button" data-view="table">Table</button></div></div></div><div class="chart-slot" id="ch-drmv" style="min-height:190px"></div><div class="table-slot" id="drMvTbl"></div></figure>' +
      '<section class="dr-sec" id="drH2hCard"><div class="sec-k"><span class="k">Head to head</span><h3>' + esc(pr.player) + ' v ' + esc(pr.opp) + '</h3></div><div id="drH2h"></div></section></div>' +
      '<footer class="dr-f"><button class="btn red" id="drLog">Log this bet</button><a class="btn" href="#/app/event/' + ev.id + '">Open fixture</a><a class="btn ghost" href="#/app/player/' + pr.pid + '">Player file</a></footer></div>';

    U.openDrawer(html, function (dr) {
      const $ = s => dr.querySelector(s);
      const calc = () => ({ g: pr.log.slice(0, st.n), line: st.line, h: D.hit(pr, st.n, st.side, st.line), pO: D.propFairOver(pr, st.line) });
      function bestAt(line) { let best = null; Object.keys(pr.q).forEach(k => { if (pr.q[k].line !== line || !books.has(k)) return; const d = pr.q[k].o[st.side]; if (!best || d > best.dec) best = { book: k, dec: d }; }); return best; }
      const res = (x, line) => (x.v === line ? 'Push' : (st.side === 0 ? x.v > line : x.v < line) ? '<span class="pos">✓ Hit</span>' : '<span class="neg">✕ Miss</span>');
      function paint() {
        const c = calc(), p = st.side === 0 ? c.pO : 1 - c.pO, best = bestAt(c.line), e = best ? p * best.dec - 1 : null, vs = c.g.map(x => x.v), mean = NE.mean(vs), med = NE.median(vs);
        $('#drSide').innerHTML = U.seg('dside', [{ v: 0, l: 'Over' }, { v: 1, l: 'Under' }], st.side, 'sm');
        $('#drN').innerHTML = U.seg('dn', [{ v: 5, l: 'L5' }, { v: 10, l: 'L10' }, { v: 20, l: 'L20' }], st.n, 'sm');
        $('#drKpis').innerHTML = [
          U.kpi({ label: 'Hit rate · L' + st.n, value: c.h.pct == null ? '—' : Math.round(c.h.pct * 100) + '%', delta: c.h.hits + ' of ' + c.h.total + ' games' }),
          U.kpi({ label: best ? 'Best price · ' + D.BOOK[best.book].name : 'Best price', value: best ? NE.fmtOdds(best.dec) : '—', delta: best ? 'at this line' : 'no book at this line' }),
          U.kpi({ label: 'Fair price', value: NE.fmtOdds(1 / p), delta: NE.fmtPct(p) + ' implied' }),
          U.kpi({ label: 'Edge', value: e == null ? '—' : '<span class="' + (e >= 0 ? 'pos' : 'neg') + '">' + NE.fmtEV(e) + '</span>', delta: 'mean ' + mean.toFixed(mean >= 20 ? 1 : 2) + ' · median ' + String(med).replace(/\.0$/, '') })].join('');
        $('#drLineVal').textContent = lineTxt(st.side, c.line);
        $('#drLogSub').textContent = 'Last ' + c.g.length + ' games · ' + (st.side === 0 ? 'over' : 'under') + ' ' + NE.fmtLine(c.line) + ' ' + pr.label.toLowerCase() + '.';
        const rows = c.g.slice().reverse().map(x => ({ v: x.v, label: x.opp, sub: NE.fmtShortDate(x.d), tip: { t: (x.home ? 'v ' : '@ ') + x.opp + ' · ' + NE.fmtShortDate(x.d), r: [[pr.label, String(x.v)], ['Line', NE.fmtLine(c.line)], ['Result', x.v === c.line ? 'Push' : (st.side === 0 ? x.v > c.line : x.v < c.line) ? 'Hit ✓' : 'Miss ✕']] } }));
        C.logBars($('#ch-drlog'), { rows, line: c.line, side: st.side, h: 250, aria: 'Game log for ' + pr.player });
        $('#drLogTbl').innerHTML = U.simpleTable(['Date', 'Opponent', { h: pr.label, r: true }, 'Result'], c.g.map(x => [NE.fmtShortDate(x.d), esc(x.opp), '<b>' + x.v + '</b>', res(x, c.line)]));
        const split = (label, arr) => '<div class="split"><span>' + label + '</span>' + U.hitPill(D.hit(pr, 99, st.side, c.line, arr), { frac: true }) + '</div>';
        $('#drSplits').innerHTML = [5, 10, 20].map(n => '<div class="split"><span>L' + n + '</span>' + U.hitPill(D.hit(pr, n, st.side, c.line), { frac: true }) + '</div>').join('') + split('v ' + esc(pr.oppShort), pr.h2h) + split('Home', pr.log.filter(x => x.home)) + split('Away', pr.log.filter(x => !x.home));
        const keys = Object.keys(pr.q).sort((a, b) => (a === 'pin' ? -1 : b === 'pin' ? 1 : D.BOOK[a].name.localeCompare(D.BOOK[b].name)));
        const evOf = k => { const q = pr.q[k], pO = D.propFairOver(pr, q.line); return (st.side === 0 ? pO : 1 - pO) * q.o[st.side] - 1; };
        let bestE = -9, bestK = null; keys.forEach(k => { const x = evOf(k); if (books.has(k) && x > bestE) { bestE = x; bestK = k; } });
        $('#drBooksSub').textContent = 'Edge shown for the ' + (st.side === 0 ? 'over' : 'under') + ' at each book’s own line.';
        $('#drBooks').innerHTML = '<table class="tbl"><thead><tr><th>Book</th><th class="c">Line</th><th class="c">Over</th><th class="c">Under</th><th class="c">Edge</th></tr></thead><tbody>' + keys.map(k => {
          const q = pr.q[k], x = evOf(k), same = q.line === st.line;
          return '<tr' + (k === bestK ? ' class="hl"' : '') + '><td>' + U.book(k, { name: true }) + (k === bestK ? ' <span class="tag-best">Best</span>' : '') + '</td><td class="c num"><b>' + NE.fmtLine(q.line) + '</b>' + (same ? '' : '<small>' + (q.line > st.line ? '+' : '−') + Math.abs(q.line - st.line) + ' v selected</small>') + '</td><td class="c">' + U.odds(q.o[0], { best: k === bestK && st.side === 0 }) + '</td><td class="c">' + U.odds(q.o[1], { best: k === bestK && st.side === 1 }) + '</td><td class="c">' + (k === 'pin' ? '<span class="muted">sharp reference</span>' : U.evPill(x)) + '</td></tr>';
        }).join('') + '</tbody></table>';
        const hist = pr.hist, f = p => (st.side === 0 ? p : 1 - p);
        C.line($('#ch-drmv'), { series: [{ name: (st.side === 0 ? 'Over' : 'Under') + ' fair probability', color: 'var(--c1)', pts: hist.map(h => ({ x: h.t, y: f(h.p) * 100 })), fmtTip: v => v.toFixed(1) + '%' }], h: 190, fmtX: t => NE.fmtTime(t), fmtTipX: t => NE.fmtDay(t) + ' ' + NE.fmtTime(t), fmtY: (v, step) => v.toFixed(step < 1 ? 1 : 0) + '%', aria: 'Line movement' });
        $('#drMvTbl').innerHTML = U.simpleTable(['Time', { h: 'Fair prob', r: true }, { h: 'Fair price', r: true }], hist.filter((_, i) => i % 3 === 0 || i === hist.length - 1).map(h => [NE.fmtTime(h.t), NE.fmtPct(f(h.p)), NE.fmtOdds(1 / f(h.p))]));
        $('#drH2h').innerHTML = pr.h2h.length ? U.simpleTable(['Date', { h: pr.label, r: true }, 'Result'], pr.h2h.map(x => [NE.fmtShortDate(x.d), '<b>' + x.v + '</b>', res(x, st.line)])) : '<div class="empty">No previous meetings on record.</div>';
      }
      paint();
      const range = $('#drLine');
      range.oninput = () => { st.line = +range.value; paint(); };
      const nudge = d => { st.line = NE.clamp(st.line + d, lo, hi); range.value = st.line; paint(); };
      $('#drMinus').onclick = () => nudge(-1); $('#drPlus').onclick = () => nudge(1);
      $('#drReset').onclick = () => { st.side = v0.side; st.line = v0.line; range.value = st.line; paint(); };
      dr.addEventListener('click', function (e) { const b = e.target.closest('[data-seg] button'); if (!b) return; const nm = b.parentNode.dataset.seg; if (nm === 'dside') st.side = +b.dataset.val; else if (nm === 'dn') st.n = +b.dataset.val; else return; paint(); });
      $('#drLog').onclick = function () {
        const best = bestAt(st.line) || { book: v0.book, dec: v0.dec }, p = (st.side === 0 ? D.propFairOver(pr, st.line) : 1 - D.propFairOver(pr, st.line));
        NE.logBetModal({ sport: pr.sport, desc: D.propPick(pr, st.side, st.line), vs: ev.title, book: best.book, dec: best.dec, p, evId: ev.id, start: ev.start });
      };
    });
    U.onDrawerClose = function () { if (opts && opts.from) opts.from(); };
  }
  NE.openProp = openProp;
})(window.NE);
