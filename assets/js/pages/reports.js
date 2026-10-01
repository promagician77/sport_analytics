/* The Closing Line — The Almanac (reports & trends) */
(function (NE) {
  'use strict';
  const D = NE.data, U = NE.ui, C = NE.charts, esc = NE.esc;
  const S = { mkt: 'ml' };

  const TRENDS = [
    ['ATP Challenger', 'chal', 'Unders in Round-of-16 matches'], ['KBO', 'kbo', 'Home underdogs at +120 or longer'], ['Darts', 'darts', 'Over 180s when both averages top 96'],
    ['CS2', 'cs2', 'Map 1+2 kills unders v top-5 opponents'], ['NPB', 'npb', 'Starter strikeouts over in day games'], ['WTA', 'wta', 'Double faults over on clay'],
    ['Cricket T20', 'cricket', 'Batter runs under after a rest day'], ['Golf', 'golf', 'Round-2 matchups: afternoon tee-time underdog'], ['League of Legends', 'lol', 'Assists over for supports in best-of-3'],
    ['ATP Tour', 'atp', 'First-serve aces over on indoor hard']
  ];
  function trends() {
    const r = NE.rng('trends-' + new Date().toISOString().slice(0, 10));
    return TRENDS.map(function (t) {
      const n = r.int(70, 430), dec = +(r.range(1.78, 2.35)).toFixed(2), wr = NE.clamp((1 / dec) * (1 + r.range(-0.045, 0.1)), 0.34, 0.68), w = Math.round(n * wr), roi = (w * dec - n) / n;
      return { name: t[0], key: t[1], desc: t[2], n, w, l: n - w, wr: w / n, dec, roi, units: n * roi };
    }).sort((a, b) => b.roi - a.roi);
  }
  function holdMatrix(kind) {
    return D.BOOKS.map(function (b) {
      const cells = D.GROUPS.map(function (g) {
        const keys = D.SPORTS.filter(s => s.group === g).map(s => s.key), holds = [];
        if (kind === 'prop') D.props.forEach(p => { if (keys.includes(p.sport) && p.q[b.key]) holds.push(NE.hold(p.q[b.key].o)); });
        else D.events.forEach(e => { if (keys.includes(e.sport) && e.mk[kind].q[b.key]) holds.push(NE.hold(e.mk[kind].q[b.key].o)); });
        return holds.length ? NE.mean(holds) * 100 : null;
      });
      return { label: U.book(b.key, { name: true }), plain: b.name, cells };
    });
  }
  function accuracy() {
    const acc = {};
    D.events.forEach(function (ev) { ['ml', 'spread', 'total'].forEach(function (k) { const mk = ev.mk[k], pf = NE.devig(mk.q.pin.o)[0]; Object.keys(mk.q).forEach(bk => { if (bk === 'pin') return; (acc[bk] = acc[bk] || []).push(Math.abs(NE.devig(mk.q[bk].o)[0] - pf) * 100); }); }); });
    return Object.keys(acc).map(k => ({ k, v: NE.mean(acc[k]), n: acc[k].length })).sort((a, b) => a.v - b.v);
  }
  function overRates() {
    const by = {};
    D.props.forEach(function (p) { const h = D.hit(p, 20, 0, p.main); if (h.pct == null) return; const g = D.SPORT[p.sport].name, x = (by[g] = by[g] || { o: 0, n: 0 }); x.o += h.hits; x.n += h.total; });
    return Object.keys(by).map(k => ({ k, rate: by[k].o / by[k].n, n: by[k].n })).sort((a, b) => b.rate - a.rate);
  }

  NE.pages.reports = {
    title: 'The Almanac',
    render() {
      return U.pgh({ k: 'Reports & trends', t: 'The Almanac', s: 'Where the market is sharpest, where it is soft, and which angles are paying. Everything here is computed from the specimen board — except the trend backtests, which are illustrative.' }) +
        '<figure class="fig"><div class="fig-h"><div><span class="fig-n">Fig. 1</span><h3>Bookmaker margin by sport</h3><p class="cap">Average hold on posted two-way prices — lower is sharper.</p></div><div class="figtools">' + U.seg('mkt', [{ v: 'ml', l: 'Moneyline' }, { v: 'spread', l: 'Spread' }, { v: 'total', l: 'Total' }, { v: 'prop', l: 'Props' }], S.mkt, 'sm') + '</div></div><div id="rHeat"></div></figure>' +
        '<div class="fig2 rules mt-l" id="rRow2"></div>' +
        '<section class="mt-l"><div class="sec-k"><span class="k">Backtests</span><h3>Trend angles</h3></div><p class="sec-s">Illustrative flat-stake results (1 unit a bet) for common niche-sport angles. Simulated numbers.</p><div class="fxo rules"><div id="rTrendChart" class="chart-slot"></div><div class="tbl-wrap" id="rTrendTbl"></div></div></section>';
    },
    mount(view) {
      const heat = view.querySelector('#rHeat');
      const drawHeat = () => { heat.innerHTML = C.heat({ cols: D.GROUPS, rows: holdMatrix(S.mkt), fmt: v => v.toFixed(1) + '%', valName: 'Avg hold' }); };
      drawHeat();
      view.querySelector('[data-seg="mkt"]').onclick = function (e) { const b = e.target.closest('button'); if (!b) return; S.mkt = b.dataset.val; this.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); drawHeat(); };
      view.querySelector('#rRow2').innerHTML = U.chartCard({ id: 'racc', n: 2, title: 'Price accuracy by book', cap: 'Average gap to Pinnacle’s fair probability, in percentage points — lower is sharper.', h: 340, table: '<div id="rAccT"></div>' }) +
        U.chartCard({ id: 'rovr', n: 3, title: 'Overs v. unders at the posted line', cap: 'Share of the last 20 games in which the over landed, by sport.', h: 340, legend: C.legendHTML([{ name: 'Overs landed more', color: 'var(--c1)' }, { name: 'Unders landed more', color: 'var(--c2)' }]), table: '<div id="rOvrT"></div>' });
      const acc = accuracy();
      C.hbar(view.querySelector('#ch-racc'), { rows: acc.map((a, i) => ({ label: D.BOOK[a.k].name, v: a.v, vLabel: a.v.toFixed(2) + ' pts', strong: i === 0, tip: { t: D.BOOK[a.k].name, r: [['Avg gap', a.v.toFixed(2) + ' pts'], ['Prices compared', String(a.n)]] } })), rowH: 28, fmtTick: v => v.toFixed(1), valName: 'gap', aria: 'Price accuracy by bookmaker' });
      view.querySelector('#rAccT').innerHTML = U.simpleTable(['Book', { h: 'Avg gap (pts)', r: true }, { h: 'Prices', r: true }], acc.map(a => [esc(D.BOOK[a.k].name), a.v.toFixed(2), a.n]));
      const ov = overRates();
      C.hbar(view.querySelector('#ch-rovr'), { rows: ov.map(o => ({ label: o.k, v: (o.rate - 0.5) * 100, vLabel: NE.fmtPct(o.rate, 1) + ' over', cls: o.rate >= 0.5 ? 'm-c1' : 'm-c2', tip: { t: o.k, r: [['Overs landed', NE.fmtPct(o.rate, 1)], ['Unders landed', NE.fmtPct(1 - o.rate, 1)], ['Games', String(o.n)]] } })), rowH: 26, fmtTick: v => (50 + v).toFixed(0) + '%', aria: 'Over rate by sport' });
      view.querySelector('#rOvrT').innerHTML = U.simpleTable(['Sport', { h: 'Over %', r: true }, { h: 'Games', r: true }], ov.map(o => [esc(o.k), NE.fmtPct(o.rate, 1), o.n]));
      const tr = trends();
      C.hbar(view.querySelector('#rTrendChart'), { rows: tr.map(t => ({ label: t.name, v: t.roi * 100, vLabel: NE.fmtSigned(t.roi * 100, 1, '%'), tip: { t: t.name + ' — ' + t.desc, r: [['ROI', NE.fmtSigned(t.roi * 100, 1, '%')], ['Record', t.w + '–' + t.l], ['Units', NE.fmtSigned(t.units, 1, 'u')]] } })), diverging: true, rowH: 30, fmtTick: v => v + '%', valName: 'ROI', aria: 'Backtest ROI by trend' });
      view.querySelector('#rTrendTbl').innerHTML = '<table class="tbl"><thead><tr><th>Angle</th><th class="r">Record</th><th class="r">Win %</th><th class="r">ROI</th><th class="r">Units</th></tr></thead><tbody>' + tr.map(t => '<tr><td><div class="stack"><b>' + esc(t.desc) + '</b><small>' + esc(t.name) + ' · ' + t.n + ' bets · avg ' + NE.fmtOdds(t.dec) + '</small></div></td><td class="r num">' + t.w + '–' + t.l + '</td><td class="r num">' + NE.fmtPct(t.wr, 1) + '</td><td class="r num"><span class="' + (t.roi >= 0 ? 'pos' : 'neg') + '">' + NE.fmtSigned(t.roi * 100, 1, '%') + '</span></td><td class="r num">' + NE.fmtSigned(t.units, 1, 'u') + '</td></tr>').join('') + '</tbody></table>';
    }
  };
})(window.NE);
