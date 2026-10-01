/* The Closing Line — Crossings (arbitrage) */
(function (NE) {
  'use strict';
  const D = NE.data, U = NE.ui, esc = NE.esc;
  const S = { kind: 'all', minProfit: 1, stake: 1000, books: null };
  const KINDS = [{ v: 'all', l: 'All' }, { v: 'ml', l: 'Moneyline' }, { v: 'spread', l: 'Spread' }, { v: 'total', l: 'Total' }, { v: 'prop', l: 'Props' }];
  const CROSS = '<svg class="xs" viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><path d="M6 8h20l6 6M34 32H14l-6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/><path d="M26 4l6 4-6 4M14 36l-6-4 6-4" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';

  function legHTML(leg, n, stake) {
    return '<div class="leg"><span class="leg-n">Leg ' + n + '</span><div class="leg-t">' + U.book(leg.book) + '<b>' + esc(leg.pick) + '</b></div><div class="leg-p"><span class="px best" data-fk="arb|' + esc(leg.pick) + '|' + leg.book + '" data-fv="' + leg.dec + '">' + NE.fmtOdds(leg.dec) + '</span><span class="muted">stake</span><b class="num">' + NE.fmtMoney(stake, 2) + '</b></div></div>';
  }
  const opt = (arr, cur) => arr.map(o => '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + o[1] + '</option>').join('');

  NE.pages.arbs = {
    title: 'Crossings',
    render() {
      return U.pgh({ k: 'Arbitrage', t: 'Crossings', s: 'Opposite sides priced so generously across two books that a profit is locked in whichever way the match goes. Stakes below equalise the payout on both legs. Real crossings are small and short-lived — check limits and move fast.' }) +
        '<div id="aTiles"></div><section class="ctl mt-s"><div id="aSport"></div><div class="ctl-row"><div class="fld"><span>Market</span>' + U.seg('kind', KINDS, S.kind, 'sm') + '</div>' +
        '<label class="fld"><span>Profit at least</span><select id="aMin">' + opt([0, 0.5, 1, 2, 3].map(x => [x, x + '%']), S.minProfit) + '</select></label>' +
        '<label class="fld"><span>Total stake</span><input type="number" id="aStake" min="10" step="50" value="' + S.stake + '" style="width:110px" aria-label="Total stake"></label>' +
        '<div class="fld"><span>Bookmakers</span><div class="pop-wrap" id="aBooks"></div></div></div></section>' +
        '<section class="sheet"><div id="aList"></div><div class="tbl-foot" id="aFoot"></div></section>' +
        U.box('How to read this', '<p class="t2" style="max-width:76ch">An arbitrage exists when the implied probabilities of the best prices on each side add up to less than 100%. The profit is <i>1 ÷ sum − 1</i>. Props only qualify when both books post the <b>same line</b>. Books can void stale prices, so treat every crossing as perishable.</p>', 'mt');
    },
    mount(view, ctx) {
      const list = view.querySelector('#aList'), foot = view.querySelector('#aFoot'), tiles = view.querySelector('#aTiles');
      function draw() {
        const books = S.books || new Set(Object.keys(D.BOOK));
        const rows = D.arbs({ sports: U.sportSet(), books }).filter(a => (S.kind === 'all' || a.kind === S.kind) && a.profit * 100 >= S.minProfit), T = S.stake;
        tiles.innerHTML = U.kpis([
          { label: 'Live crossings', value: String(rows.length), delta: 'profit ≥ ' + S.minProfit + '%' },
          { label: 'Best crossing', value: rows.length ? '<span class="pos">' + NE.fmtSigned(rows[0].profit * 100, 2, '%') + '</span>' : '—', delta: rows.length ? esc(rows[0].ev.title) : '' },
          { label: 'Average profit', value: rows.length ? NE.fmtSigned(NE.mean(rows.map(r => r.profit)) * 100, 2, '%') : '—', delta: 'per ' + NE.fmtMoney(T) + ' staked' },
          { label: 'Locked in on the best', value: rows.length ? '<span class="pos">' + NE.fmtMoney(T * rows[0].profit, 2) + '</span>' : '—', delta: 'at a ' + NE.fmtMoney(T) + ' total stake' }]);
        list.innerHTML = rows.length ? '<div class="xhead"><span>Profit</span><span>Matchup</span><span>Price &amp; stake</span><span></span><span>Price &amp; stake</span><span class="r">Payout</span></div>' + rows.slice(0, 60).map(function (a) {
          const s0 = T * (1 / a.legs[0].dec) / a.sum, s1 = T * (1 / a.legs[1].dec) / a.sum;
          return '<div class="xrow" tabindex="0" data-ev="' + a.ev.id + '"' + (a.prop ? ' data-prop="' + a.prop.id + '"' : '') + '><div class="xp"><b class="' + (a.profit >= 0.03 ? 'hi' : '') + '">' + (a.profit * 100).toFixed(2) + '<i>%</i></b></div>' +
            '<div class="xm"><div class="mu">' + U.sportBadge(a.ev.sport) + '<div class="stack"><b>' + esc(a.ev.title) + '</b><small>' + esc(a.label) + (a.kind === 'prop' ? ' · ' + esc(a.prop.player) : '') + ' · ' + (D.isLive(a.ev) ? 'live' : NE.fmtDay(a.ev.start) + ' ' + NE.fmtTime(a.ev.start)) + '</small></div></div></div>' +
            legHTML(a.legs[0], 1, s0) + '<div class="xc">' + CROSS + '</div>' + legHTML(a.legs[1], 2, s1) + '<div class="xr"><b class="num">' + NE.fmtMoney(T / a.sum, 2) + '</b><small class="pos mn">+' + NE.fmtMoney(T * a.profit, 2) + ' profit</small></div></div>';
        }).join('') : U.empty('No crossings at this threshold', 'They are rare — lower the minimum profit or widen the sport filter.');
        foot.innerHTML = '<span>Showing ' + Math.min(60, rows.length) + ' of ' + rows.length + ' · stakes sized to equalise the payout</span>';
        U.flashDiff(list);
      }
      U.mountSportFilter(view.querySelector('#aSport'), draw);
      const ids = Object.keys(D.BOOK); if (!S.books) S.books = new Set(ids);
      U.bookPicker(view.querySelector('#aBooks'), ids, S.books, draw);
      view.querySelector('#aMin').onchange = e => { S.minProfit = +e.target.value; draw(); };
      view.querySelector('#aStake').oninput = NE.debounce(e => { S.stake = Math.max(10, +e.target.value || 1000); draw(); }, 160);
      view.querySelector('[data-seg="kind"]').onclick = function (e) { const b = e.target.closest('button'); if (!b) return; S.kind = b.dataset.val; this.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); draw(); };
      list.addEventListener('click', function (e) { const r = e.target.closest('.xrow'); if (!r) return; if (r.dataset.prop) NE.openProp(r.dataset.prop); else location.hash = '#/app/event/' + r.dataset.ev; });
      list.addEventListener('keydown', e => { if (e.key === 'Enter') { const r = e.target.closest('.xrow'); if (r) r.click(); } });
      draw();
      ctx.on('tick', draw);
    }
  };
})(window.NE);
