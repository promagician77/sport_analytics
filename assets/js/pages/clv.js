/* The Closing Line — The Ledger (CLV tracker) + shared bet slip */
(function (NE) {
  'use strict';
  const D = NE.data, U = NE.ui, C = NE.charts, esc = NE.esc;

  /* ---------------------------------------------------------------- bet store */
  const userBets = () => NE.store.get('userbets', []);
  const saveBets = a => NE.store.set('userbets', a);
  NE.userBets = userBets;
  const unitSize = () => Math.max(1, Math.round(NE.settings.bankroll / 100));

  NE.logBetModal = function (o) {
    o = o || {};
    const k = o.p ? NE.kelly(o.p, o.dec) : 0, sugg = o.p ? Math.max(0.25, Math.round((NE.settings.bankroll * k * NE.settings.kellyFraction / unitSize()) * 4) / 4) : 1;
    const body = (o.manual ? '<label class="fld"><span>Sport</span><select id="lbSport">' + D.SPORTS.map(s => '<option value="' + s.key + '">' + esc(s.name) + '</option>').join('') + '</select></label><label class="fld"><span>Pick</span><input type="text" id="lbDesc" placeholder="e.g. Player Over 5.5 Aces" maxlength="80"></label>' :
      '<div class="lb-pick"><b>' + esc(o.desc) + '</b><small>' + esc(o.vs || '') + '</small></div>') +
      '<div class="frow" style="flex-wrap:nowrap"><label class="fld" style="flex:1"><span>Book</span><select id="lbBook">' + D.BOOKS.map(b => '<option value="' + b.key + '"' + (b.key === o.book ? ' selected' : '') + '>' + esc(b.name) + '</option>').join('') + '</select></label>' +
      '<label class="fld" style="flex:1"><span>Price taken</span><input type="text" id="lbOdds" value="' + (o.dec ? esc(NE.fmtOdds(o.dec)) : '') + '" placeholder="+120 or 2.20"></label>' +
      '<label class="fld" style="flex:1"><span>Stake (units)</span><input type="number" id="lbStake" min="0.1" step="0.25" value="' + sugg + '"></label></div>' +
      (o.p ? '<p class="t2" style="font-style:italic">Fair probability <b style="font-style:normal">' + NE.fmtPct(o.p) + '</b>. Fractional Kelly suggests <b style="font-style:normal">' + sugg + ' units</b> (1 unit = ' + NE.fmtMoney(unitSize()) + ', ' + Math.round(NE.settings.kellyFraction * 100) + '% Kelly of a ' + NE.fmtMoney(NE.settings.bankroll) + ' bankroll).</p>' : '');
    U.modal({ title: o.manual ? 'Log a bet' : 'Log this bet', body, foot: '<button class="btn ghost" data-mclose>Cancel</button><button class="btn red" id="lbSave">File the slip</button>',
      onMount(m) {
        m.querySelector('#lbSave').onclick = function () {
          const dec = NE.parseOdds(m.querySelector('#lbOdds').value), stake = parseFloat(m.querySelector('#lbStake').value), desc = o.manual ? m.querySelector('#lbDesc').value.trim() : o.desc;
          if (!(dec > 1)) { U.toast('Enter a valid price, e.g. +120 or 2.20', 'warn'); return; }
          if (!(stake > 0)) { U.toast('Enter a stake', 'warn'); return; }
          if (!desc) { U.toast('Describe the pick', 'warn'); return; }
          const arr = userBets();
          arr.push({ id: 'u' + Date.now(), ts: Date.now(), sport: o.manual ? m.querySelector('#lbSport').value : o.sport, desc, vs: o.vs || '', book: m.querySelector('#lbBook').value, dec, stake, p: o.p || null, start: o.start || Date.now() + 3600e3, status: 'pending' });
          saveBets(arr); U.closeModal(); U.toast('Slip filed — it now appears in the ledger');
          if (location.hash.indexOf('/app/clv') >= 0) NE.app.refresh();
        };
      } });
  };

  function settleAll() {
    const arr = userBets(), r = NE.rng('settle' + Date.now()); let n = 0;
    arr.forEach(b => {
      if (b.status !== 'pending') return;
      const p0 = b.p || NE.clamp(1 / b.dec * 1.03, 0.2, 0.85), pc = NE.clamp(p0 + 0.008 + r.normal() * 0.022, 0.12, 0.9);
      b.closeDec = Math.round(100 / pc) / 100; b.clv = b.dec / b.closeDec - 1; b.win = r.chance(pc); b.profit = b.win ? b.stake * (b.dec - 1) : -b.stake; b.status = 'settled'; n++;
    });
    saveBets(arr); return n;
  }

  /* ---------------------------------------------------------------- page */
  const S = { period: 90 };
  function allBets() { const cut = S.period ? Date.now() - S.period * 864e5 : 0; return userBets().concat(D.bets).filter(b => U.sportMatch(b.sport) && b.ts >= cut).sort((a, b) => a.ts - b.ts); }
  function stats(bets) {
    const s = bets.filter(b => b.status === 'settled'), n = s.length, staked = NE.sum(s.map(b => b.stake)), profit = NE.sum(s.map(b => b.profit));
    return { n, pending: bets.length - n, clv: n ? NE.mean(s.map(b => b.clv)) : 0, beat: n ? s.filter(b => b.clv > 0).length / n : 0, profit, staked, roi: staked ? profit / staked : 0, wins: s.filter(b => b.win).length, settled: s, wclv: staked ? NE.sum(s.map(b => b.clv * b.stake)) / staked : 0 };
  }
  const sgn = (x, d, suf) => '<span class="' + (x > 0 ? 'pos' : x < 0 ? 'neg' : '') + '">' + NE.fmtSigned(x, d, suf) + '</span>';
  const acct = x => (x < 0 ? '<span class="neg">(' + Math.abs(x).toFixed(2) + ')</span>' : '<span class="pos">' + x.toFixed(2) + '</span>');

  function betRow(b) {
    const sp = D.SPORT[b.sport], settled = b.status === 'settled';
    return '<tr><td class="num">' + NE.fmtShortDate(b.ts) + '</td><td><div class="mu">' + U.sportBadge(b.sport) + '<div class="stack"><b>' + esc(b.desc) + '</b><small>' + esc(b.vs || sp.name) + '</small></div></div></td><td>' + U.book(b.book) + '</td>' +
      '<td class="c num">' + NE.fmtOdds(b.dec) + '</td><td class="c num">' + (settled ? NE.fmtOdds(b.closeDec) : '<span class="muted">—</span>') + '</td><td class="c">' + (settled ? '<span class="edge ' + (b.clv >= 0.03 ? 'md' : b.clv >= 0 ? 'lo' : 'neg') + '">' + NE.fmtSigned(b.clv * 100, 1, '%') + '</span>' : '<span class="pend">Pending</span>') + '</td>' +
      '<td class="r num">' + b.stake.toFixed(2) + '</td><td class="c">' + (settled ? '<span class="res ' + (b.win ? 'w' : 'l') + '">' + (b.win ? 'W' : 'L') + '</span>' : '<span class="muted">—</span>') + '</td><td class="r num">' + (settled ? acct(b.profit) : '<span class="muted">—</span>') + '</td></tr>';
  }

  NE.pages.clv = {
    title: 'The Ledger',
    render() {
      const bets = allBets(), st = stats(bets), pend = bets.filter(b => b.status === 'pending').length;
      const foot = st.settled.length ? '<tfoot><tr><td colspan="3">Totals · ' + st.n + ' settled</td><td></td><td></td><td class="c num">' + NE.fmtSigned(st.clv * 100, 2, '%') + '</td><td class="r num">' + st.staked.toFixed(2) + '</td><td class="c num">' + st.wins + '–' + (st.n - st.wins) + '</td><td class="r num">' + acct(st.profit) + '</td></tr></tfoot>' : '';
      return U.pgh({ k: 'CLV tracker', t: 'The Ledger', s: 'Closing-line value asks whether the price you took beat the no-vig Pinnacle close — the best leading indicator that an edge is real. Seeded with simulated history; slips you file here are kept in your browser.',
        a: '<button class="btn" id="cSettle"' + (pend ? '' : ' disabled') + '>Simulate close' + (pend ? ' (' + pend + ')' : '') + '</button><button class="btn" id="cCsv">' + U.icon('download', 14) + ' Export</button><button class="btn red" id="cAdd">Log a bet</button>' }) +
        '<section class="ctl"><div id="cSport"></div><div class="ctl-row"><div class="fld"><span>Period</span>' + U.seg('period', [{ v: 30, l: '30 days' }, { v: 60, l: '60 days' }, { v: 90, l: '90 days' }, { v: 0, l: 'All' }], S.period, 'sm') + '</div></div></section>' +
        '<div class="kpis clv-k">' + [
          { label: 'Average CLV', value: '<span class="' + (st.clv >= 0 ? 'pos' : 'neg') + '">' + NE.fmtSigned(st.clv * 100, 2, '%') + '</span>', big: true, delta: 'stake-weighted ' + NE.fmtSigned(st.wclv * 100, 2, '%') },
          { label: 'Beat the close', value: NE.fmtPct(st.beat, 0), delta: Math.round(st.beat * st.n) + ' of ' + st.n + ' bets' },
          { label: 'Profit', value: sgn(st.profit, 1, 'u'), delta: NE.fmtMoney(st.profit * unitSize()) + ' at ' + NE.fmtMoney(unitSize()) + ' a unit' },
          { label: 'Return on stakes', value: sgn(st.roi * 100, 1, '%'), delta: st.wins + 'W · ' + (st.n - st.wins) + 'L · ' + NE.fmtNum(st.staked, 1) + ' units staked' }].map(U.kpi).join('') + '</div>' +
        '<div class="fig2 rules mt">' + U.chartCard({ id: 'cclv', n: 1, title: 'Cumulative CLV', cap: 'Stake × CLV%, summed — rising means you beat the close.', h: 240, table: '<div id="cClvT"></div>' }) + U.chartCard({ id: 'cprof', n: 2, title: 'Cumulative profit', cap: 'Units won — noisy in the short run, even with positive CLV.', h: 240, table: '<div id="cProfT"></div>' }) + '</div>' +
        '<div class="fig2 rules mt">' + U.chartCard({ id: 'chist', n: 3, title: 'CLV distribution', cap: 'Number of bets by CLV bucket.', h: 220, legend: C.legendHTML([{ name: 'Beat the close', color: 'var(--good)', icon: '▲' }, { name: 'Missed the close', color: 'var(--bad)', icon: '▼' }]), table: '<div id="cHistT"></div>' }) + U.chartCard({ id: 'csport', n: 4, title: 'Average CLV by sport', cap: 'Where the edge is coming from.', h: 220, table: '<div id="cSportT"></div>' }) + '</div>' +
        '<section class="mt-l"><div class="sec-k"><span class="k">Journal</span><h3>Bet log</h3><span class="sec-s" style="margin:0 0 0 auto">' + bets.length + ' entries · newest first</span></div><div class="ledger">' + (bets.length ? '<div class="tbl-wrap" style="max-height:620px"><table class="tbl"><thead><tr><th>Date</th><th>Particulars</th><th>Book</th><th class="c">Price taken</th><th class="c">Close (fair)</th><th class="c">CLV</th><th class="r">Stake</th><th class="c">Result</th><th class="r">Profit (u)</th></tr></thead><tbody>' + bets.slice().reverse().map(betRow).join('') + '</tbody>' + foot + '</table></div>' : U.empty('No entries in this view', 'File a slip from The Card or Edges — or widen the period.')) + '</div></section>';
    },
    mount(view) {
      const bets = allBets(), st = stats(bets), s = st.settled;
      U.mountSportFilter(view.querySelector('#cSport'), () => NE.app.refresh());
      view.querySelector('[data-seg="period"]').onclick = e => { const b = e.target.closest('button'); if (b) { S.period = +b.dataset.val; NE.app.refresh(); } };
      view.querySelector('#cAdd').onclick = () => NE.logBetModal({ manual: true });
      view.querySelector('#cSettle').onclick = () => { const n = settleAll(); U.toast(n ? n + ' slip' + (n > 1 ? 's' : '') + ' settled against the simulated close' : 'Nothing pending'); NE.app.refresh(); };
      view.querySelector('#cCsv').onclick = function () {
        const rows = [['Date', 'Sport', 'Pick', 'Book', 'Price taken (dec)', 'Closing fair (dec)', 'CLV %', 'Stake u', 'Result', 'Profit u']].concat(bets.map(b => [new Date(b.ts).toISOString().slice(0, 10), D.SPORT[b.sport].name, b.desc, D.BOOK[b.book].name, b.dec, b.closeDec || '', b.clv != null ? (b.clv * 100).toFixed(2) : '', b.stake, b.status === 'settled' ? (b.win ? 'W' : 'L') : 'Pending', b.profit != null ? b.profit.toFixed(2) : '']));
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n')], { type: 'text/csv' })); a.download = 'closing-line-ledger.csv'; a.click();
      };
      if (!s.length) return;
      let cc = 0, cp = 0;
      const clvPts = s.map(b => ({ x: b.ts, y: (cc += b.clv * b.stake * 100) / 100 })), profPts = s.map(b => ({ x: b.ts, y: (cp += b.profit) }));
      C.line(view.querySelector('#ch-cclv'), { series: [{ name: 'Cumulative CLV', color: 'var(--c1)', pts: clvPts, fmtTip: v => v.toFixed(2) + 'u' }], h: 240, zero: true, fmtX: NE.fmtShortDate, fmtY: v => v.toFixed(1) + 'u', aria: 'Cumulative closing line value in units' });
      C.line(view.querySelector('#ch-cprof'), { series: [{ name: 'Cumulative profit', color: 'var(--c2)', pts: profPts, fmtTip: v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + 'u' }], h: 240, zero: true, fmtX: NE.fmtShortDate, fmtY: v => v.toFixed(0) + 'u', aria: 'Cumulative profit in units' });
      const tw = pts => U.simpleTable(['Date', { h: 'Value (u)', r: true }], pts.filter((_, i) => i % Math.max(1, Math.round(pts.length / 14)) === 0 || i === pts.length - 1).map(p => [NE.fmtShortDate(p.x), p.y.toFixed(2)]));
      view.querySelector('#cClvT').innerHTML = tw(clvPts); view.querySelector('#cProfT').innerHTML = tw(profPts);
      const edges = []; for (let e = -8; e <= 12; e += 2) edges.push(e);
      const bins = edges.slice(0, -1).map((lo, i) => { const hi = edges[i + 1], n = s.filter(b => b.clv * 100 >= lo && (i === edges.length - 2 ? b.clv * 100 <= hi : b.clv * 100 < hi)).length; return { n, mid: (lo + hi) / 2, label: lo === 0 ? '0' : (lo > 0 ? '+' : '−') + Math.abs(lo), range: NE.fmtSigned(lo, 0, '%') + ' to ' + NE.fmtSigned(hi, 0, '%') }; });
      C.hist(view.querySelector('#ch-chist'), { bins, h: 220, aria: 'Distribution of closing line value' });
      view.querySelector('#cHistT').innerHTML = U.simpleTable(['CLV bucket', { h: 'Bets', r: true }], bins.map(b => [b.range, b.n]));
      const by = {}; s.forEach(b => { (by[b.sport] = by[b.sport] || []).push(b); });
      const rows = Object.keys(by).map(k => { const a = by[k]; return { k, n: a.length, clv: NE.mean(a.map(b => b.clv)), profit: NE.sum(a.map(b => b.profit)), beat: a.filter(b => b.clv > 0).length / a.length }; }).sort((a, b) => b.clv - a.clv);
      C.hbar(view.querySelector('#ch-csport'), { rows: rows.map(r => ({ label: D.SPORT[r.k].name, v: r.clv * 100, vLabel: NE.fmtSigned(r.clv * 100, 1, '%'), tip: { t: D.SPORT[r.k].name, r: [['Avg CLV', NE.fmtSigned(r.clv * 100, 2, '%')], ['Bets', String(r.n)], ['Beat close', NE.fmtPct(r.beat, 0)]] } })), diverging: true, rowH: 28, fmtTick: v => v + '%', valName: 'Avg CLV', aria: 'Average CLV by sport' });
      view.querySelector('#cSportT').innerHTML = U.simpleTable(['Sport', { h: 'Bets', r: true }, { h: 'Avg CLV', r: true }, { h: 'Beat close', r: true }, { h: 'Profit', r: true }], rows.map(r => [esc(D.SPORT[r.k].name), r.n, NE.fmtSigned(r.clv * 100, 2, '%'), NE.fmtPct(r.beat, 0), NE.fmtSigned(r.profit, 1, 'u')]));
    }
  };
})(window.NE);
