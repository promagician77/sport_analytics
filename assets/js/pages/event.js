/* The Closing Line — a single fixture: programme cover, overview, odds, H2H & form, props */
(function (NE) {
  'use strict';
  const D = NE.data, U = NE.ui, C = NE.charts, esc = NE.esc;
  const S = { tab: 'overview' };
  const score = v => (v.e + 0.5 * ((v.h10.pct || 0.5) - 0.5));
  const formStr = f => '<span class="fstr">' + f.map(x => '<i class="' + (x.win ? 'w' : 'l') + '" title="' + (x.win ? 'Won' : 'Lost') + ' v ' + esc(x.opp) + (x.score ? ' · ' + esc(x.score) : '') + '">' + (x.win ? 'W' : 'L') + '</i>').join('') + '</span>';

  function oddsTable(ev, key) {
    const mk = ev.mk[key], fair = D.mainFair(mk);
    const names = key === 'ml' ? [ev.p[0].name, ev.p[1].name] : key === 'spread' ? [ev.p[0].name + ' ' + (mk.line > 0 ? '+' : '−') + Math.abs(mk.line), ev.p[1].name + ' ' + (mk.line > 0 ? '−' : '+') + Math.abs(mk.line)] : ['Over ' + NE.fmtLine(mk.line), 'Under ' + NE.fmtLine(mk.line)];
    const best = [D.bestOf(mk, 0), D.bestOf(mk, 1)];
    const keys = Object.keys(mk.q).sort((a, b) => (a === 'pin' ? -1 : b === 'pin' ? 1 : D.BOOK[a].name.localeCompare(D.BOOK[b].name)));
    return '<section><div class="sec-k"><span class="k">' + esc(mk.label) + '</span><h3>' + esc(names[0]) + ' <i class="vv">v</i> ' + esc(names[1]) + '</h3></div><p class="sec-s">Fair prices: ' + NE.fmtOdds(1 / fair[0]) + ' (' + NE.fmtPct(fair[0]) + ') and ' + NE.fmtOdds(1 / fair[1]) + ' (' + NE.fmtPct(fair[1]) + ').</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Book</th><th class="c">' + esc(names[0]) + '</th><th class="c">' + esc(names[1]) + '</th><th class="c">Hold</th><th class="c">Edge 1</th><th class="c">Edge 2</th></tr></thead><tbody>' +
      keys.map(function (k) {
        const q = mk.q[k], e0 = fair[0] * q.o[0] - 1, e1 = fair[1] * q.o[1] - 1;
        return '<tr><td>' + U.book(k, { name: true }) + '</td>' + [0, 1].map(s => '<td class="c">' + U.odds(q.o[s], { best: best[s].book === k, fk: 'e|' + ev.id + '|' + key + '|' + k + '|' + s }) + '</td>').join('') + '<td class="c num">' + NE.fmtPct(NE.hold(q.o), 1) + '</td>' + [e0, e1].map(e => '<td class="c">' + (k === 'pin' ? '<span class="muted">sharp</span>' : U.evPill(e)) + '</td>').join('') + '</tr>';
      }).join('') + '</tbody></table></div></section>';
  }

  function propsTable(ev) {
    const rows = ev.props.map(p => D.propView(p, 'best')).filter(Boolean).sort((a, b) => score(b) - score(a));
    if (!rows.length) return U.empty('No props posted', 'Props for this fixture have not been released yet.');
    return '<div class="tbl-wrap"><table class="tbl props"><thead><tr><th>Player</th><th>Selection</th><th class="c">Best price</th><th class="c">Edge</th><th class="c mn">L5</th><th class="c mn">L10</th><th class="c mn">L20</th><th class="c mn">H2H</th><th class="c">Last 10</th></tr></thead><tbody>' + rows.map(v => {
      const pr = v.prop;
      return '<tr class="click" tabindex="0" data-prop="' + pr.id + '"><td><div class="stack"><b>' + esc(pr.player) + '</b><small>' + esc(pr.team) + '</small></div></td><td><div class="selc"><span class="sd ' + (v.side ? 'u' : 'o') + '">' + (v.side ? 'Under' : 'Over') + '</span><b class="num">' + NE.fmtLine(v.line) + '</b></div><small class="mk">' + esc(pr.label) + '</small></td><td class="c"><div class="bestp">' + U.book(v.book) + U.odds(v.dec, { best: true }) + '</div></td><td class="c">' + U.evPill(v.e) + '</td><td class="c">' + U.hitPill(v.h5) + '</td><td class="c">' + U.hitPill(v.h10) + '</td><td class="c">' + U.hitPill(v.h20) + '</td><td class="c">' + U.hitPill(v.hh, { frac: true }) + '</td><td class="c">' + C.sparkBars(pr.log.slice(0, 10).map(g => g.v).reverse(), v.line, v.side, { bw: 6, h: 26 }) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }

  function formBlock(ev, i) {
    const f = ev.form[i], w = f.filter(x => x.win).length;
    return '<div><div class="sec-k"><span class="k">Last ten · ' + w + 'W–' + (10 - w) + 'L</span><h3>' + esc(ev.p[i].name) + '</h3></div>' + formStr(f) + U.simpleTable(['Date', 'Opponent', 'Result', 'Score'], f.map(x => [NE.fmtShortDate(x.d), esc(x.opp), x.win ? '<span class="pos">Win</span>' : '<span class="neg">Loss</span>', esc(x.score || '—')])) + '</div>';
  }

  function overview(ev) {
    const sp = D.SPORT[ev.sport], fair = D.mainFair(ev.mk.ml), pin = ev.mk.ml.q.pin, bestH = D.bestOf(ev.mk.ml, 0), bestA = D.bestOf(ev.mk.ml, 1), moved = (fair[0] - ev.openP) * 100, sl = ev.mk.spread.line;
    const rows = sp.stats.map(function (m, i) {
      const a = ev.stats[0][i], b = ev.stats[1][i];
      return { label: m.label, a, b, fa: D.fmtStat(a, m.fmt), fb: D.fmtStat(b, m.fmt), better: a === b ? -1 : (m.hi ? (a > b ? 0 : 1) : (a < b ? 0 : 1)), range: [m.base - 2.4 * m.sd, m.base + 2.4 * m.sd] };
    });
    const top = ev.props.map(p => D.propView(p, 'best')).filter(Boolean).sort((a, b) => score(b) - score(a)).slice(0, 6);
    return '<div class="fxo rules">' + '<div>' + U.chartCard({ id: 'evmv', n: 1, title: esc(ev.p[0].name) + ' win probability', cap: 'Pinnacle fair price, devigged. Open ' + NE.fmtPct(ev.openP) + ', now ' + NE.fmtPct(fair[0]) + ' (' + NE.fmtSigned(moved, 1, ' pts') + ').', h: 230, table: '<div id="evMvT"></div>' }) + '</div>' +
      '<div><div class="sec-k"><span class="k">At a glance</span><h3>Market snapshot</h3></div><div class="card-b">' + U.dl([
        ['Fair moneyline', esc(ev.p[0].short) + ' ' + NE.fmtOdds(1 / fair[0]) + ' · ' + esc(ev.p[1].short) + ' ' + NE.fmtOdds(1 / fair[1])],
        ['Best price · ' + esc(ev.p[0].short), U.book(bestH.book) + ' <b class="num">' + NE.fmtOdds(bestH.dec) + '</b>'], ['Best price · ' + esc(ev.p[1].short), U.book(bestA.book) + ' <b class="num">' + NE.fmtOdds(bestA.dec) + '</b>'],
        [esc(ev.mk.spread.label), esc(ev.p[0].short) + ' ' + (sl > 0 ? '+' : '−') + Math.abs(sl)], [esc(ev.mk.total.label), '<b class="num">' + NE.fmtLine(ev.mk.total.line) + '</b>'],
        ['Pinnacle hold', '<b class="num">' + NE.fmtPct(NE.hold(pin.o), 2) + '</b>'], ['Books quoting', '<b class="num">' + Object.keys(ev.mk.ml.q).length + '</b>']]) + '</div></div></div>' +
      '<div class="fxo rules mt-l"><div><div class="sec-k"><span class="k">Tale of the tape</span><h3>Season rates</h3></div><p class="sec-s">The bolder figure is the better side.</p>' + C.compare([ev.p[0].short || ev.p[0].name, ev.p[1].short || ev.p[1].name], rows) + '</div>' +
      '<div><div class="sec-k"><span class="k">The card</span><h3>Top props here</h3><button class="link" data-tab="props">All ' + ev.props.length + ' →</button></div><div class="hotlist">' + top.map(v => '<div class="hotrow" data-prop="' + v.prop.id + '" tabindex="0"><div class="stack"><b>' + esc(v.prop.player) + '</b><small>' + (v.side ? 'Under ' : 'Over ') + NE.fmtLine(v.line) + ' ' + esc(v.prop.label) + '</small></div>' + U.hitPill(v.h10) + '<span class="bestp">' + U.book(v.book) + U.odds(v.dec, { best: true }) + '</span>' + U.evPill(v.e) + '</div>').join('') + '</div></div></div>';
  }

  function h2hTab(ev) {
    const rec = NE.h2hRecord(ev);
    return '<section><div class="sec-k"><span class="k">Head to head</span><h3>' + (rec.n ? rec.n + ' meeting' + (rec.n > 1 ? 's' : '') + ' on record' : 'First meeting') + '</h3></div>' +
      (rec.n ? '<div class="h2hscore"><div><b>' + rec.a + '</b><span>' + esc(ev.p[0].name) + '</span></div><div class="h2hsep">—</div><div class="r"><b>' + rec.b + '</b><span>' + esc(ev.p[1].name) + '</span></div></div>' + U.simpleTable(['Date', 'Competition', 'Winner', 'Score'], ev.h2h.map(x => [NE.fmtShortDate(x.d), esc(x.comp), '<b class="' + (x.w === 0 ? 'c1t' : 'c2t') + '">' + esc(ev.p[x.w].name) + '</b>', esc(x.score)])) : '<p class="sec-s">These two have not met before.</p>') + '</section>' +
      '<div class="fxo rules mt-l">' + formBlock(ev, 0) + formBlock(ev, 1) + '</div>';
  }

  NE.pages.event = {
    title: 'Fixture',
    render(ctx) {
      const ev = D.byEvent[ctx.params[0]];
      if (!ev) return U.empty('Fixture not found', 'It may have finished — head back to the fixtures list.');
      const sp = D.SPORT[ev.sport], fair = D.mainFair(ev.mk.ml), live = D.isLive(ev);
      const tabs = [['overview', 'Overview'], ['odds', 'Odds'], ['h2h', 'H2H & form'], ['props', 'Props (' + ev.props.length + ')']];
      const facts = [ev.venue && ['Venue', ev.venue], ev.surface && ['Surface', ev.surface], ev.ft && ['Format', 'First to ' + ev.ft + ' legs'], ev.bo && ['Format', 'Best of ' + ev.bo], ['Fair moneyline', NE.fmtOdds(1 / fair[0]) + ' / ' + NE.fmtOdds(1 / fair[1])], ['Rating', ev.ratingTxt[0] + ' v ' + ev.ratingTxt[1]]].filter(Boolean);
      return '<a class="back" href="#/app/events">' + U.icon('arrowL', 14) + ' All fixtures</a>' +
        '<section class="cover"><div class="rule-h"></div><div class="cover-top"><span class="k">' + esc(sp.name) + ' · ' + esc(ev.league) + (ev.round ? ' · ' + esc(ev.round) : '') + '</span><span class="cover-when">' + (live ? U.live : NE.fmtDateTime(ev.start) + ' · ' + NE.until(ev.start)) + '</span></div>' +
        '<h1 class="cover-h"><span>' + esc(ev.p[0].name) + '</span><i>versus</i><span>' + esc(ev.p[1].name) + '</span></h1>' +
        '<div class="cover-body rules"><div>' + U.plate(U.plateName(ev), { ratio: '16/9', alt: sp.name, caption: 'Photograph: see photo credits' }) + '</div><div class="cover-r">' + C.gauge(fair[0], [ev.p[0].name, ev.p[1].name], { title: 'Pinnacle fair win probability' }) + '<div class="dl" style="margin-top:14px">' + facts.map(f => '<div class="leader"><span>' + f[0] + '</span><i></i><b>' + esc(f[1]) + '</b></div>').join('') + '</div></div></div></section>' +
        '<div class="tabrow"><div class="tabs" role="tablist">' + tabs.map(t => '<button type="button" role="tab" data-tab="' + t[0] + '" class="' + (S.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div></div><div id="evBody"></div>';
    },
    mount(view, ctx) {
      const ev = D.byEvent[ctx.params[0]]; if (!ev) return; const body = view.querySelector('#evBody');
      function show(tab) {
        S.tab = tab; C.cleanup();
        view.querySelectorAll('.tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
        if (tab === 'overview') {
          body.innerHTML = overview(ev);
          C.line(body.querySelector('#ch-evmv'), { series: [{ name: ev.p[0].name + ' win %', color: 'var(--c1)', pts: ev.hist.map(h => ({ x: h.t, y: h.p * 100 })), fmtTip: v => v.toFixed(1) + '%' }], h: 230, fmtX: NE.fmtTime, fmtTipX: t => NE.fmtDay(t) + ' ' + NE.fmtTime(t), fmtY: (v, st) => v.toFixed(st < 1 ? 1 : 0) + '%', aria: 'Win probability movement' });
          body.querySelector('#evMvT').innerHTML = U.simpleTable(['Time', { h: 'Win %', r: true }], ev.hist.filter((_, i) => i % 3 === 0 || i === ev.hist.length - 1).map(h => [NE.fmtTime(h.t), NE.fmtPct(h.p)]));
        } else if (tab === 'odds') body.innerHTML = '<div class="stackv">' + oddsTable(ev, 'ml') + oddsTable(ev, 'spread') + oddsTable(ev, 'total') + '</div>';
        else if (tab === 'h2h') body.innerHTML = h2hTab(ev); else body.innerHTML = propsTable(ev);
        U.flashDiff(body);
      }
      view.addEventListener('click', function (e) { const t = e.target.closest('[data-tab]'); if (t) { show(t.dataset.tab); return; } const p = e.target.closest('[data-prop]'); if (p) NE.openProp(p.dataset.prop); });
      view.addEventListener('keydown', e => { if (e.key === 'Enter') { const p = e.target.closest('[data-prop]'); if (p) NE.openProp(p.dataset.prop); } });
      show(S.tab);
      ctx.on('tick', () => { if (S.tab === 'odds') show('odds'); });
    }
  };
})(window.NE);
