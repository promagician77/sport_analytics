/* The Closing Line — Edges (+EV finder) */
(function (NE) {
  'use strict';
  const D = NE.data, U = NE.ui, esc = NE.esc;
  const S = { kind: 'all', minEV: null, maxDec: 0, q: '', books: null, limit: 50, sort: 'ev' };
  const KINDS = [{ v: 'all', l: 'All' }, { v: 'ml', l: 'Moneyline' }, { v: 'spread', l: 'Spread' }, { v: 'total', l: 'Total' }, { v: 'prop', l: 'Props' }];
  const KIND_LABEL = { ml: 'Moneyline', spread: 'Spread', total: 'Total', prop: 'Prop' };
  const opt = (arr, cur) => arr.map(o => '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + o[1] + '</option>').join('');

  function feed() {
    if (S.minEV == null) S.minEV = NE.settings.minEV;
    const books = S.books || new Set(Object.keys(D.BOOK));
    let rows = D.evFeed({ sports: U.sportSet(), kind: S.kind, books, minEV: S.minEV, maxOdds: S.maxDec || 0, method: NE.settings.devig, bankroll: NE.settings.bankroll, kelly: NE.settings.kellyFraction });
    const q = S.q.trim().toLowerCase();
    if (q) rows = rows.filter(r => (D.pickLabel(r) + ' ' + r.ev.title).toLowerCase().includes(q));
    const key = { ev: r => r.e, kelly: r => r.kelly, start: r => -r.ev.start, dec: r => r.dec }[S.sort];
    rows.sort((a, b) => key(b) - key(a));
    return rows;
  }
  function rowHTML(r, i) {
    const ev = r.ev, fk = 'ev|' + ev.id + '|' + r.kind + '|' + (r.prop ? r.prop.id : '') + '|' + r.book + '|' + r.side;
    return '<tr class="click" tabindex="0" data-i="' + i + '"><td class="c">' + U.evPill(r.e) + '</td><td><div class="mu">' + U.sportBadge(ev.sport) + '<div class="stack"><b>' + esc(D.pickLabel(r)) + '</b><small>' + KIND_LABEL[r.kind] + (r.kind === 'prop' ? ' · ' + esc(r.prop.label) : '') + '</small></div></div></td>' +
      '<td><div class="stack"><b class="nw sm">' + esc(ev.title) + '</b><small>' + (D.isLive(ev) ? '<span class="live"><i></i>Live</span>' : NE.fmtDay(ev.start) + ' · ' + NE.fmtTime(ev.start)) + ' · ' + esc(ev.league) + '</small></div></td>' +
      '<td class="c">' + U.book(r.book) + '</td><td class="c">' + U.odds(r.dec, { best: true, fk }) + '</td><td class="c num">' + NE.fmtOdds(r.fairDec) + '<small class="mn">' + NE.fmtPct(r.p, 1) + '</small></td>' +
      '<td class="r num"><b>' + (r.stake ? NE.fmtMoney(r.stake) : '—') + '</b><small class="mn">' + NE.fmtPct(r.kelly * NE.settings.kellyFraction, 2) + ' of roll</small></td><td class="c"><button class="btn sm" data-log="' + i + '" title="Log this bet">Log</button></td></tr>';
  }

  NE.pages.ev = {
    title: 'Edges',
    render() {
      return U.pgh({ k: '+EV finder', t: 'Edges', s: 'Every soft-book price scored against the Pinnacle no-vig fair price. Where a book pays more than the true odds you hold positive expected value — size the stake with fractional Kelly and log it straight to the ledger.',
        a: '<label class="fld"><span>Bankroll</span><input type="number" id="eBank" min="100" step="100" value="' + NE.settings.bankroll + '" style="width:120px" aria-label="Bankroll"></label>' }) +
        '<div id="eTiles"></div>' +
        '<section class="ctl mt-s"><div id="eSport"></div><div class="ctl-row"><div class="fld"><span>Market</span>' + U.seg('kind', KINDS, S.kind, 'sm') + '</div>' +
        '<label class="fld"><span>Edge at least</span><select id="eMin">' + opt([0, 1, 2, 3, 5, 8, 10].map(x => [x, x + '%']), S.minEV == null ? NE.settings.minEV : S.minEV) + '</select></label>' +
        '<label class="fld"><span>Longest price</span><select id="eMax">' + opt([[0, 'Any'], [3, '+200'], [4, '+300'], [6, '+500'], [11, '+1000']], S.maxDec) + '</select></label>' +
        '<label class="fld"><span>Devig method</span><select id="eDevig">' + NE.DEVIG_METHODS.map(m => '<option value="' + m.key + '"' + (m.key === NE.settings.devig ? ' selected' : '') + '>' + m.label.split(' (')[0] + '</option>').join('') + '</select></label>' +
        '<label class="fld"><span>Kelly fraction</span><select id="eKelly">' + opt([[0.1, '10%'], [0.25, '¼ Kelly'], [0.5, '½ Kelly'], [1, 'Full Kelly']], NE.settings.kellyFraction) + '</select></label>' +
        '<div class="fld"><span>Bookmakers</span><div class="pop-wrap" id="eBooks"></div></div>' +
        '<label class="fld"><span>Rank by</span><select id="eSort">' + opt([['ev', 'Edge'], ['kelly', 'Kelly stake'], ['start', 'Start time'], ['dec', 'Price']], S.sort) + '</select></label><div class="grow"></div>' +
        '<label class="fld"><span>Find</span><input type="search" id="eQ" placeholder="Pick or event" value="' + esc(S.q) + '" style="width:200px" aria-label="Filter"></label></div></section>' +
        '<section class="sheet"><div class="tbl-wrap" id="eTbl"></div><div class="tbl-foot" id="eFoot"></div></section>';
    },
    mount(view, ctx) {
      let rows = []; const tbl = view.querySelector('#eTbl'), foot = view.querySelector('#eFoot'), tiles = view.querySelector('#eTiles');
      function draw() {
        rows = feed();
        const shown = rows.slice(0, S.limit), stake = NE.sum(rows.map(r => r.stake)), exp = NE.sum(rows.map(r => r.stake * r.e));
        tiles.innerHTML = U.kpis([
          { label: 'Opportunities', value: String(rows.length), delta: 'edge ≥ ' + (S.minEV == null ? NE.settings.minEV : S.minEV) + '% against ' + NE.DEVIG_METHODS.find(m => m.key === NE.settings.devig).label.split(' (')[0].toLowerCase() + ' fair' },
          { label: 'Average edge', value: rows.length ? '<span class="pos">' + NE.fmtEV(NE.mean(rows.map(r => r.e))) + '</span>' : '—', delta: rows.length ? 'best ' + NE.fmtEV(rows[0].e) : '' },
          { label: 'Suggested stakes', value: NE.fmtMoney(stake), delta: NE.fmtPct(stake / NE.settings.bankroll, 0) + ' of a ' + NE.fmtMoney(NE.settings.bankroll) + ' bankroll if you took every one' },
          { label: 'Expected profit', value: '<span class="pos">' + NE.fmtMoney(exp, 0) + '</span>', delta: 'sum of stake × edge' }]);
        tbl.innerHTML = rows.length ? '<table class="tbl evt"><thead><tr><th class="c">Edge</th><th>Pick</th><th>Matchup</th><th class="c">Book</th><th class="c">Price</th><th class="c">Fair</th><th class="r">Kelly stake</th><th></th></tr></thead><tbody>' + shown.map(rowHTML).join('') + '</tbody></table>' : U.empty('No edge at this threshold', 'Lower the minimum edge or widen the sport and book filters.');
        foot.innerHTML = rows.length ? '<span>Showing ' + shown.length + ' of ' + rows.length + '</span>' + (rows.length > shown.length ? '<button class="btn sm" id="eMore">Show 50 more</button>' : '') : '';
        U.flashDiff(tbl);
      }
      U.mountSportFilter(view.querySelector('#eSport'), () => { S.limit = 50; draw(); });
      const ids = Object.keys(D.BOOK); if (!S.books) S.books = new Set(ids);
      U.bookPicker(view.querySelector('#eBooks'), ids, S.books, draw);
      const q = s => view.querySelector(s);
      q('#eMin').onchange = e => { S.minEV = +e.target.value; draw(); };
      q('#eMax').onchange = e => { S.maxDec = +e.target.value; draw(); };
      q('#eDevig').onchange = e => { NE.settings.devig = e.target.value; NE.saveSettings(); draw(); };
      q('#eKelly').onchange = e => { NE.settings.kellyFraction = +e.target.value; NE.saveSettings(); draw(); };
      q('#eSort').onchange = e => { S.sort = e.target.value; draw(); };
      q('#eQ').oninput = NE.debounce(e => { S.q = e.target.value; draw(); }, 140);
      q('#eBank').onchange = e => { NE.settings.bankroll = Math.max(100, +e.target.value || 5000); NE.saveSettings(); draw(); };
      q('[data-seg="kind"]').onclick = function (e) { const b = e.target.closest('button'); if (!b) return; S.kind = b.dataset.val; S.limit = 50; this.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); draw(); };
      view.addEventListener('click', function (e) {
        if (e.target.closest('#eMore')) { S.limit += 50; draw(); return; }
        const lg = e.target.closest('[data-log]');
        if (lg) { const r = rows[+lg.dataset.log]; NE.logBetModal({ sport: r.ev.sport, desc: D.pickLabel(r), vs: r.ev.title, book: r.book, dec: r.dec, p: r.p, start: r.ev.start }); e.stopPropagation(); return; }
        const tr = e.target.closest('tr[data-i]');
        if (tr) { const r = rows[+tr.dataset.i]; if (r.kind === 'prop') NE.openProp(r.prop.id); else location.hash = '#/app/event/' + r.ev.id; }
      });
      draw();
      ctx.on('tick', draw);
    }
  };
})(window.NE);
