/* The Closing Line — The Board (odds screen): a tote board with seven-segment prices */
(function (NE) {
  'use strict';
  const D = NE.data, U = NE.ui, C = NE.charts, esc = NE.esc;

  const DEFAULT_BOOKS = ['pin', 'b365', 'btw', 'unib', 'bfx', 'stk', 'dk'];
  const S = { tab: 'ml', q: '', books: null, hideLive: false };
  const TABS = [{ v: 'ml', l: 'Moneyline' }, { v: 'spread', l: 'Spread' }, { v: 'total', l: 'Total' }];

  // LED price: sign (or %) in mono, digits in DSEG7
  function ledHTML(dec, o) {
    const fmt = NE.settings.oddsFormat; let inner;
    if (fmt === 'decimal') inner = '<span class="dg">' + dec.toFixed(2) + '</span>';
    else if (fmt === 'implied') inner = '<span class="dg">' + (100 / dec).toFixed(1) + '</span><span class="sg">%</span>';
    else { const a = NE.dec2am(dec); inner = '<span class="sg">' + (a > 0 ? '+' : '-') + '</span><span class="dg">' + Math.abs(a) + '</span>'; }
    return '<span class="led' + (o.cls ? ' ' + o.cls : '') + '"' + (o.fk ? ' data-fk="' + esc(o.fk) + '" data-fv="' + dec + '"' : '') + (o.tip ? ' data-tt="' + o.tip + '"' : '') + '>' + inner + '</span>';
  }
  U.led = ledHTML;

  function sideLabels(ev, tab) {
    const n = i => esc(ev.p[i].name);
    if (tab === 'ml') return [n(0), n(1)];
    if (tab === 'spread') { const l = ev.mk.spread.line; return [n(0) + ' <b class="lnum">' + (l > 0 ? '+' : '−') + Math.abs(l) + '</b>', n(1) + ' <b class="lnum">' + (l > 0 ? '−' : '+') + Math.abs(l) + '</b>']; }
    const l = NE.fmtLine(ev.mk.total.line);
    return ['Over <b class="lnum">' + l + '</b>', 'Under <b class="lnum">' + l + '</b>'];
  }

  function rowHTML(ev, tab, cols) {
    const mk = ev.mk[tab], fair = D.mainFair(mk), labels = sideLabels(ev, tab), best = [D.bestOf(mk, 0), D.bestOf(mk, 1)];
    let topE = -1, topK = null, topS = 0;
    const cells = cols.map(function (bk) {
      const q = mk.q[bk];
      if (!q) return '<td class="bt-px"><div class="pc"><span class="led off">—</span></div><div class="pc"><span class="led off">—</span></div></td>';
      return '<td class="bt-px">' + [0, 1].map(function (s) {
        const dec = q.o[s], e = fair[s] * dec - 1, isBest = best[s].book === bk && best[s].dec === dec, plus = bk !== 'pin' && e >= 0.02;
        if (bk !== 'pin' && e > topE) { topE = e; topK = bk; topS = s; }
        const tip = C.tt({ t: D.BOOK[bk].name + ' · ' + ev.p[s].name, r: [['Price', NE.fmtOdds(dec)], ['Fair price', NE.fmtOdds(1 / fair[s])], ['Edge', bk === 'pin' ? 'sharp reference' : NE.fmtEV(e)]] });
        return '<div class="pc">' + ledHTML(dec, { cls: (isBest ? 'best ' : '') + (plus ? 'plus' : ''), fk: 'o|' + ev.id + '|' + tab + '|' + bk + '|' + s, tip }) + '</div>';
      }).join('') + '</td>';
    }).join('');
    const bestCell = topE >= 0.02 ? '<div class="bt-edge"><b class="' + (topE >= 0.08 ? 'hot' : '') + '">' + NE.fmtEV(topE) + '</b><small><span class="bk">' + esc(D.BOOK[topK].short) + '</span> ' + esc(tab === 'ml' ? ev.p[topS].short : topS ? 'Under' : 'Over') + '</small></div>' : '<span class="bt-none">—</span>';
    return '<tr class="click ev-row" tabindex="0" data-ev="' + ev.id + '"><td class="bt-start">' + U.startCell(ev) + '</td><td class="bt-mu"><div class="bt-names"><span>' + labels[0] + '</span><span>' + labels[1] + '</span></div><small>' + U.sportBadge(ev.sport) + ' ' + esc(ev.league) + (ev.round ? ' · ' + esc(ev.round) : '') + '</small></td>' + cells +
      '<td class="bt-fair"><div class="pc"><span>' + NE.fmtPct(fair[0], 1) + '</span></div><div class="pc"><span>' + NE.fmtPct(fair[1], 1) + '</span></div></td><td class="bt-be">' + bestCell + '</td></tr>';
  }

  NE.pages.odds = {
    title: 'The Board',
    render() {
      return U.pgh({ k: 'Odds screen', t: 'The Board', s: 'Moneylines, spreads and totals across the books, posted like a tote board. The brightest price is the best on the board; a green price beats the Pinnacle fair price by 2% or more. Hover any price for its edge.',
        a: U.seg('tab', TABS, S.tab) }) +
        '<section class="ctl"><div id="oSport"></div><div class="ctl-row"><div class="fld"><span>Bookmakers</span><div class="pop-wrap" id="oBooks"></div></div><label class="chk" style="padding-bottom:6px"><input type="checkbox" id="oLive"' + (S.hideLive ? ' checked' : '') + '><span>Hide live</span></label>' +
        '<label class="fld"><span>Devig method</span><select id="oDevig">' + NE.DEVIG_METHODS.map(m => '<option value="' + m.key + '"' + (m.key === NE.settings.devig ? ' selected' : '') + '>' + m.label.split(' (')[0] + '</option>').join('') + '</select></label>' +
        '<div class="grow"></div><label class="fld"><span>Find</span><input type="search" id="oQ" placeholder="Team, player or league" value="' + esc(S.q) + '" style="width:230px" aria-label="Filter matchups"></label></div></section>' +
        '<section class="board" aria-label="Odds board"><div class="board-h"><span>The Board <i></i> <b id="boardTitle">Moneyline</b></span><span class="live"><i></i>Feed live</span></div><div class="swipe">← Swipe for more books →</div><div class="tbl-wrap" id="oTbl"></div><div class="board-f" id="oFoot"></div></section>';
    },
    mount(view, ctx) {
      const all = Object.keys(D.BOOK); if (!S.books) S.books = new Set(DEFAULT_BOOKS);
      const tbl = view.querySelector('#oTbl'), foot = view.querySelector('#oFoot');
      function draw() {
        const sports = U.sportSet(), q = S.q.trim().toLowerCase();
        const evs = D.events.filter(e => sports.has(e.sport) && (!S.hideLive || !D.isLive(e)) && (!q || e.title.toLowerCase().includes(q) || e.league.toLowerCase().includes(q)));
        const cols = all.filter(b => S.books.has(b)), title = { ml: 'Moneyline', spread: 'Spread', total: 'Total' }[S.tab];
        view.querySelector('#boardTitle').textContent = title;
        let lastDay = '';
        const body = evs.map(function (ev) {
          const day = D.isLive(ev) ? 'Live now' : NE.fmtDay(ev.start); let sep = '';
          if (day !== lastDay) { sep = '<tr class="day"><td colspan="' + (cols.length + 4) + '">' + esc(day) + '</td></tr>'; lastDay = day; }
          return sep + rowHTML(ev, S.tab, cols);
        }).join('');
        tbl.innerHTML = evs.length ? '<table class="bt"><thead><tr><th>Start</th><th>' + title + '</th>' + cols.map(b => '<th class="c">' + U.book(b) + '</th>').join('') + '<th class="c">Fair</th><th class="c">Best edge</th></tr></thead><tbody>' + body + '</tbody></table>' : '<div class="board-empty">NO MATCHUPS ON THE BOARD</div>';
        foot.innerHTML = '<span>' + evs.length + ' matchups · prices re-post every few seconds</span><span><span class="led best"><span class="sg">+</span><span class="dg">125</span></span> best price &nbsp; <span class="led plus"><span class="sg">+</span><span class="dg">130</span></span> beats fair by 2%+</span>';
        U.flashDiff(tbl);
      }
      U.mountSportFilter(view.querySelector('#oSport'), draw, () => { const c = {}; D.events.forEach(e => { c[e.sport] = (c[e.sport] || 0) + 1; }); return c; });
      U.bookPicker(view.querySelector('#oBooks'), all, S.books, draw);
      view.querySelector('#oQ').oninput = NE.debounce(e => { S.q = e.target.value; draw(); }, 140);
      view.querySelector('#oLive').onchange = e => { S.hideLive = e.target.checked; draw(); };
      view.querySelector('#oDevig').onchange = e => { NE.settings.devig = e.target.value; NE.saveSettings(); draw(); };
      view.querySelector('.pgh [data-seg="tab"]').onclick = function (e) { const b = e.target.closest('button'); if (!b) return; S.tab = b.dataset.val; this.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); draw(); };
      tbl.addEventListener('click', e => { const tr = e.target.closest('tr[data-ev]'); if (tr) location.hash = '#/app/event/' + tr.dataset.ev; });
      tbl.addEventListener('keydown', e => { if (e.key === 'Enter') { const tr = e.target.closest('tr[data-ev]'); if (tr) location.hash = '#/app/event/' + tr.dataset.ev; } });
      draw();
      ctx.on('tick', draw);
    }
  };
})(window.NE);
