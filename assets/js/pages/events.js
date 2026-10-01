/* The Closing Line — Fixtures (matchup hub) */
(function (NE) {
  'use strict';
  const D = NE.data, U = NE.ui, C = NE.charts, esc = NE.esc;
  const S = { q: '', sort: 'time' };

  NE.h2hRecord = function (ev) { const a = ev.h2h.filter(x => x.w === 0).length; return { a, b: ev.h2h.length - a, n: ev.h2h.length }; };

  function row(ev) {
    const sp = D.SPORT[ev.sport], fair = D.mainFair(ev.mk.ml), rec = NE.h2hRecord(ev), sl = ev.mk.spread.line;
    const best = ev.props.map(p => D.propView(p, 'best')).filter(Boolean).sort((x, y) => y.e - x.e)[0];
    return '<a class="fxrow" href="#/app/event/' + ev.id + '"><div class="fx-t">' + U.startCell(ev) + '</div>' +
      '<div class="fx-m"><span class="fx-lg">' + U.sportBadge(ev.sport) + '<em>' + esc(ev.league) + (ev.round ? ' · ' + esc(ev.round) : '') + '</em></span><h4>' + esc(ev.p[0].name) + ' <i>v</i> ' + esc(ev.p[1].name) + '</h4></div>' +
      '<div class="fx-g">' + C.gauge(fair[0], [ev.p[0].name, ev.p[1].name], { compact: true, title: 'Pinnacle fair win probability' }) + '</div>' +
      '<dl class="fx-k"><div><dt>Fair</dt><dd>' + NE.fmtOdds(1 / fair[0]) + ' / ' + NE.fmtOdds(1 / fair[1]) + '</dd></div><div><dt>' + esc(sp.spread ? sp.spread.label.split(' ')[0] : 'Map') + '</dt><dd>' + (sl > 0 ? '+' : '−') + Math.abs(sl) + '</dd></div><div><dt>Total</dt><dd>' + NE.fmtLine(ev.mk.total.line) + '</dd></div><div><dt>H2H</dt><dd>' + (rec.n ? rec.a + '–' + rec.b : '—') + '</dd></div></dl>' +
      '<div class="fx-p"><b class="num">' + ev.props.length + '</b> props' + (best && best.e > 0.02 ? '<small>best ' + NE.fmtEV(best.e) + '</small>' : '') + '</div></a>';
  }

  NE.pages.events = {
    title: 'Fixtures',
    render() {
      return U.pgh({ k: 'Matchups & H2H', t: 'Fixtures', s: 'Every upcoming and live fixture with the Pinnacle fair win probability, the key lines and the head-to-head record. Open one for odds across books, form, splits and props.' }) +
        '<section class="ctl"><div id="mSport"></div><div class="ctl-row"><div class="fld"><span>Order by</span>' + U.seg('sort', [{ v: 'time', l: 'Start time' }, { v: 'edge', l: 'Biggest favourite' }, { v: 'close', l: 'Closest match' }], S.sort, 'sm') + '</div><div class="grow"></div><label class="fld"><span>Find</span><input type="search" id="mQ" placeholder="Team, player or league" value="' + esc(S.q) + '" style="width:230px" aria-label="Search matchups"></label></div></section><div id="mLead"></div><section class="fxlist" id="mGrid"></section>';
    },
    mount(view) {
      const grid = view.querySelector('#mGrid'), lead = view.querySelector('#mLead');
      function draw() {
        const sports = U.sportSet(), q = S.q.trim().toLowerCase();
        let evs = D.events.filter(e => sports.has(e.sport) && (!q || e.title.toLowerCase().includes(q) || e.league.toLowerCase().includes(q)));
        if (S.sort === 'edge') evs.sort((a, b) => Math.abs(b.pH - 0.5) - Math.abs(a.pH - 0.5)); else if (S.sort === 'close') evs.sort((a, b) => Math.abs(a.pH - 0.5) - Math.abs(b.pH - 0.5));
        const f = evs.find(e => e.start > Date.now()) || evs[0];
        lead.innerHTML = f && !q ? '<a class="fxlead" href="#/app/event/' + f.id + '">' + U.plate(U.plateName(f), { ratio: '16/7', cls: 'nohint', alt: D.SPORT[f.sport].name }) + '<div class="fxl-t"><span class="k">Lead fixture · ' + esc(f.league) + '</span><h2>' + esc(f.p[0].name) + ' <i>v</i> ' + esc(f.p[1].name) + '</h2><p>' + (D.isLive(f) ? 'Live now' : NE.fmtDay(f.start) + ' · ' + NE.fmtTime(f.start)) + ' · ' + esc(f.venue || '') + '</p><span class="btn red">Open the programme ' + U.icon('arrowR', 14) + '</span></div></a>' : '';
        if (!evs.length) { grid.innerHTML = U.empty('No fixtures found', 'Try another sport or search term.'); return; }
        let last = '', out = '';
        evs.forEach(function (e) {
          const day = S.sort !== 'time' ? '' : (D.isLive(e) ? 'Live now' : NE.fmtDay(e.start));
          if (S.sort === 'time' && day !== last) { out += '<div class="fx-day">' + esc(day) + '</div>'; last = day; }
          out += row(e);
        });
        grid.innerHTML = out; NE.ht.mountAll(lead);
      }
      U.mountSportFilter(view.querySelector('#mSport'), draw, () => { const c = {}; D.events.forEach(e => { c[e.sport] = (c[e.sport] || 0) + 1; }); return c; });
      view.querySelector('#mQ').oninput = NE.debounce(e => { S.q = e.target.value; draw(); }, 140);
      view.querySelector('[data-seg="sort"]').onclick = function (e) { const b = e.target.closest('button'); if (!b) return; S.sort = b.dataset.val; this.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); draw(); };
      draw();
    }
  };
})(window.NE);
