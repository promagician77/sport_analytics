/* The Closing Line — Front Page (dashboard) */
(function (NE) {
  'use strict';
  const D = NE.data, U = NE.ui, C = NE.charts, esc = NE.esc;

  function greeting() { const h = new Date().getHours(); return h < 5 ? 'Late edition' : h < 12 ? 'Morning edition' : h < 18 ? 'Afternoon edition' : 'Evening edition'; }

  function bestBets(rows) {
    return rows.slice(0, 7).map(function (r, i) {
      return '<div class="bb click" tabindex="0" data-i="' + i + '"><span class="bb-n">' + (i + 1) + '</span><div class="bb-main"><b>' + esc(D.pickLabel(r)) + '</b><small>' + esc(r.ev.title) + ' · ' + (D.isLive(r.ev) ? 'Live' : NE.fmtDay(r.ev.start) + ' ' + NE.fmtTime(r.ev.start)) + '</small></div><div class="bb-px">' + U.evPill(r.e) + '<span class="bbp">' + U.book(r.book) + U.odds(r.dec, { best: true, fk: 'd|' + i + '|' + r.book }) + '</span></div></div>';
    }).join('');
  }

  NE.pages.dashboard = {
    title: 'Front Page',
    render() {
      const evs = D.evFeed({ minEV: 2 }), now = Date.now(), soon = D.events.filter(e => e.start > now && e.start < now + 24 * 36e5).length;
      const arbs = D.arbs().filter(a => a.profit >= 0.01), bets = D.bets.filter(b => b.ts > now - 30 * 864e5);
      const clv30 = bets.length ? NE.mean(bets.map(b => b.clv)) : 0, beat = bets.length ? bets.filter(b => b.clv > 0).length / bets.length : 0;
      const hot = D.hotProps(6), startSoon = D.events.filter(e => e.start > now).slice(0, 6);
      const feat = D.events.filter(e => e.start > now).sort((a, b) => Math.abs(a.pH - 0.5) - Math.abs(b.pH - 0.5))[0] || D.events[0];
      const fair = D.mainFair(feat.mk.ml);
      const movers = D.events.filter(e => !D.isLive(e)).map(e => { const f = D.mainFair(e.mk.ml)[0]; return { e, d: (f - e.openP) * 100 }; }).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 6);
      const dist = evs.slice(0, 40).map(r => r.e * 100).reverse();
      const slate = D.GROUPS.map(function (g) {
        const keys = D.SPORTS.filter(s => s.group === g).map(s => s.key);
        return { g, n: D.events.filter(e => keys.includes(e.sport)).length, lv: D.events.filter(e => keys.includes(e.sport) && D.isLive(e)).length, pc: D.props.filter(p => keys.includes(p.sport)).length };
      });
      return U.pgh({ k: 'Dashboard · ' + greeting(), t: 'Front Page', s: 'Where the niche markets stand right now — every figure below is computed from the board and refreshes as prices move. Click anything that looks interesting.',
        a: '<a class="btn" href="#/app/props">The Card</a><a class="btn red" href="#/app/ev">All edges ' + U.icon('arrowR', 14) + '</a>', meta: 'Specimen data · prices tick every few seconds' }) +
        '<section class="fp-lead rules"><div class="fp-num"><span class="k">Edges on tonight’s card</span><div class="kpi-n big" id="dHero">' + evs.length + '</div>' +
        '<p class="fp-cap" id="dHeroSub">Soft-book prices that beat the Pinnacle fair price by 2% or more — <b>average ' + NE.fmtEV(NE.mean(evs.map(r => r.e))) + '</b>, <b>best ' + NE.fmtEV(evs[0] ? evs[0].e : 0) + '</b>.</p>' +
        '<div class="fp-spark">' + C.spark(dist, { w: 300, h: 54, color: 'var(--green)', dot: 'var(--green)' }) + '<small>edge curve · top 40</small></div>' +
        U.dl([['Matchups, next 24 hours', '<span class="mono">' + soon + '</span>'], ['Live arbitrage', '<span class="mono">' + arbs.length + '</span>'], ['Your 30-day CLV', '<span class="mono ' + (clv30 >= 0 ? 'pos' : 'neg') + '">' + NE.fmtSigned(clv30 * 100, 2, '%') + '</span>'], ['Beat the close', '<span class="mono">' + NE.fmtPct(beat, 0) + '</span>']]) + '</div>' +
        '<a class="fp-feat" href="#/app/event/' + feat.id + '"><span class="k">Next up · closest match on the card</span>' + U.plate(U.plateName(feat), { ratio: '3/2', alt: D.SPORT[feat.sport].name + ' photograph', cls: 'nohint', fx: 0.5 }) +
        '<h2>' + esc(feat.p[0].name) + ' <i>v</i> ' + esc(feat.p[1].name) + '</h2><p class="fp-meta">' + esc(feat.league) + ' · ' + (D.isLive(feat) ? 'live now' : NE.fmtDay(feat.start) + ' ' + NE.fmtTime(feat.start)) + '</p>' + C.gauge(fair[0], [feat.p[0].name, feat.p[1].name], { compact: true, title: 'Pinnacle fair win probability' }) + '</a>' +
        U.box('Best bets', '<div id="dEV" class="bblist">' + bestBets(evs) + '</div><div class="bb-foot"><a class="link" href="#/app/ev">All ' + evs.length + ' edges →</a></div>', 'fp-best') + '</section>' +
        '<section class="fp-mid rules mt"><div><div class="sec-k"><span class="k">The card</span><h3>Hot props</h3></div><p class="sec-s">Strong recent hit rates, priced fairly.</p><div class="hotlist">' + hot.map(v => '<div class="hotrow" data-prop="' + v.prop.id + '" tabindex="0"><div class="stack"><b>' + esc(v.prop.player) + '</b><small>' + (v.side ? 'Under ' : 'Over ') + NE.fmtLine(v.line) + ' ' + esc(v.prop.label) + '</small></div>' + C.sparkBars(v.prop.log.slice(0, 10).map(g => g.v).reverse(), v.line, v.side, { bw: 5, h: 22 }) + U.hitPill(v.h10, { frac: true }) + U.evPill(v.e) + '</div>').join('') + '</div></div>' +
        '<div><div class="sec-k"><span class="k">The board</span><h3>Market movers</h3></div><p class="sec-s">Pinnacle fair win probability, open to now.</p><div class="movers">' + movers.map(m => '<a class="mv" href="#/app/event/' + m.e.id + '"><div class="stack"><b>' + esc(m.e.p[0].name) + '</b><small>v ' + esc(m.e.p[1].name) + '</small></div>' + C.spark(m.e.hist.map(h => h.p), { w: 64, h: 24, color: 'var(--ink-3)', dot: m.d >= 0 ? 'var(--green)' : 'var(--red)' }) + '<span class="mvd mono ' + (m.d >= 0 ? 'pos' : 'neg') + '">' + (m.d >= 0 ? '▲' : '▼') + ' ' + Math.abs(m.d).toFixed(1) + '</span></a>').join('') + '</div></div>' +
        '<div><div class="sec-k"><span class="k">The index</span><h3>Today’s slate</h3></div><p class="sec-s">Jump straight into a sport.</p><div class="slate">' + slate.map(s => '<button type="button" class="leader sl" data-group="' + s.g + '"><span>' + s.g + '</span><i></i><b class="mono">' + s.n + '</b><small>' + (s.lv ? s.lv + ' live · ' : '') + s.pc + ' props</small></button>').join('') + '</div></div></section>' +
        '<section class="mt-l"><div class="sec-k"><span class="k">Fixtures</span><h3>Starting soon</h3><a class="link" href="#/app/events">All fixtures →</a></div><div class="tbl-wrap"><table class="tbl fx"><tbody>' + startSoon.map(function (e) {
          const f = D.mainFair(e.mk.ml);
          return '<tr class="click" tabindex="0" data-ev="' + e.id + '"><td style="width:110px">' + U.startCell(e) + '</td><td>' + U.matchup(e) + '</td><td style="min-width:260px;width:34%">' + C.gauge(f[0], [e.p[0].name, e.p[1].name], { compact: true }) + '</td><td class="c nw num">' + NE.fmtOdds(1 / f[0]) + ' / ' + NE.fmtOdds(1 / f[1]) + '<small>fair moneyline</small></td><td class="r"><span class="muted">' + esc(e.league) + '</span></td></tr>';
        }).join('') + '</tbody></table></div></section>' +
        '<section class="mt-l">' + U.chartCard({ id: 'dclv', n: 1, title: 'Your closing-line value, 30 days', cap: 'Stake × CLV%, summed — a rising line means you keep beating the close.', h: 200, table: '<div id="dClvT"></div>' }) + '</section>';
    },
    mount(view, ctx) {
      let evs = D.evFeed({ minEV: 2 });
      view.addEventListener('click', function (e) {
        const row = e.target.closest('#dEV .bb');
        if (row) { const r = evs[+row.dataset.i]; if (r.kind === 'prop') NE.openProp(r.prop.id); else location.hash = '#/app/event/' + r.ev.id; return; }
        const hot = e.target.closest('[data-prop]'); if (hot) { NE.openProp(hot.dataset.prop); return; }
        const sl = e.target.closest('[data-group]'); if (sl) { NE.state.sport = { group: sl.dataset.group, key: null }; NE.store.set('sport', NE.state.sport); location.hash = '#/app/props'; return; }
        const ev = e.target.closest('tr[data-ev]'); if (ev) location.hash = '#/app/event/' + ev.dataset.ev;
      });
      view.addEventListener('keydown', e => { if (e.key === 'Enter') { const t = e.target.closest('.bb,[data-prop],tr[data-ev]'); if (t) t.click(); } });
      const bets = D.bets.filter(b => b.ts > Date.now() - 30 * 864e5); let cc = 0; const pts = bets.map(b => ({ x: b.ts, y: (cc += b.clv * b.stake) }));
      C.line(view.querySelector('#ch-dclv'), { series: [{ name: 'Cumulative CLV', color: 'var(--c1)', pts, fmtTip: v => v.toFixed(2) + 'u' }], h: 200, zero: true, fmtX: NE.fmtShortDate, fmtY: v => v.toFixed(1) + 'u', aria: '30-day cumulative CLV' });
      view.querySelector('#dClvT').innerHTML = U.simpleTable(['Date', { h: 'Cumulative (u)', r: true }], pts.filter((_, i) => i % 3 === 0).map(p => [NE.fmtShortDate(p.x), p.y.toFixed(2)]));
      U.flashDiff(view);
      ctx.on('tick', function () {
        evs = D.evFeed({ minEV: 2 });
        const h = view.querySelector('#dHero'), s = view.querySelector('#dHeroSub'), t = view.querySelector('#dEV');
        if (h) h.textContent = evs.length;
        if (s) s.innerHTML = 'Soft-book prices that beat the Pinnacle fair price by 2% or more — <b>average ' + NE.fmtEV(NE.mean(evs.map(r => r.e))) + '</b>, <b>best ' + NE.fmtEV(evs[0] ? evs[0].e : 0) + '</b>.';
        if (t) { t.innerHTML = bestBets(evs); U.flashDiff(t); }
      });
    }
  };
})(window.NE);
