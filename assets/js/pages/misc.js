/* The Closing Line — The Index (coverage), The Desk (settings), Player file */
(function (NE) {
  'use strict';
  const D = NE.data, U = NE.ui, C = NE.charts, esc = NE.esc;

  /* ================================================================== The Index */
  const PHASES = [
    { n: 'First edition', t: 'The specimen', s: 'done', d: 'This build: every screen, the simulated data model, the devig engine, EV / arbitrage / CLV logic and the whole interface.' },
    { n: 'Second edition', t: 'Live data & accounts', s: 'next', d: 'Connect real odds and stats feeds, keep history, add accounts, billing and alert delivery by email and push.' },
    { n: 'Third edition', t: 'The pocket edition', s: 'later', d: 'Native iOS and Android clients on the same API — push alerts, bet slips and home-screen widgets.' }
  ];
  const PIPE = [['Sources', 'Sharp and soft book odds, plus stats feeds for every sport.'], ['Normalise', 'Match events, players and markets across books and feeds.'], ['Devig engine', 'Fair prices, line adjustment, edge and Kelly.'], ['The paper', 'Web app, API, alerts and mobile.']];

  NE.pages.coverage = {
    title: 'The Index',
    render() {
      const groups = D.GROUPS.map(function (g) {
        const sps = D.SPORTS.filter(s => s.group === g);
        return '<section class="idx-g"><div class="sec-k"><span class="k">' + D.SPORTS.filter(s => s.group === g).length + ' ' + (sps.length > 1 ? 'tours & leagues' : 'tour') + '</span><h3>' + g + '</h3></div><div class="idx-grid">' + sps.map(function (s) {
          const evs = D.events.filter(e => e.sport === s.key).length, prs = D.props.filter(p => p.sport === s.key).length;
          const main = s.spread ? ['Moneyline', s.spread.label, s.total.label] : ['Series winner', 'Map handicap', 'Total maps'], pm = (s.markets || []).map(m => m.label).filter((v, i, a) => a.indexOf(v) === i);
          return '<article class="idx"><div class="leader idx-h"><h4>' + esc(s.name) + '</h4><i></i><span class="mono">' + evs + ' · ' + prs + ' props</span></div><p class="idx-l">' + (s.leagues || []).map(esc).join(' · ') + '</p>' +
            '<div class="idx-m"><span class="lbl">Main</span><span>' + main.map(esc).join(' · ') + '</span></div><div class="idx-m"><span class="lbl">Props</span><span>' + pm.map(esc).join(' · ') + '</span></div><div class="idx-b">' + s.books.map(b => U.book(b)).join('') + '</div></article>';
        }).join('') + '</div></section>';
      }).join('');
      return U.pgh({ k: 'Coverage', t: 'The Index', s: 'Every sport, league and market in this specimen — and how the production data pipeline is put together.' }) +
        U.kpis([{ label: 'Sports & tours', value: String(D.SPORTS.length), delta: D.GROUPS.length + ' disciplines' }, { label: 'Sportsbooks', value: String(D.BOOKS.length), delta: 'Pinnacle as the sharp reference' }, { label: 'Fixtures today', value: String(D.events.length), delta: D.liveCount() + ' live' }, { label: 'Player props', value: NE.fmtNum(D.props.length), delta: 'each with a 20-game log' }]) +
        '<div class="idx-all">' + groups + '</div>' +
        '<section class="mt-l"><div class="sec-k"><span class="k">Method</span><h3>How the data flows</h3></div><div class="flow">' + PIPE.map((p, i) => '<div class="fl"><b>' + (i + 1) + '</b><h4>' + p[0] + '</h4><p>' + p[1] + '</p></div>').join('') + '</div></section>' +
        '<section class="mt-l"><div class="sec-k"><span class="k">Roadmap</span><h3>Editions</h3></div><div class="eds rules">' + PHASES.map(p => '<div class="ed ' + p.s + '"><span class="ed-n">' + p.n + (p.s === 'done' ? ' · you are here' : '') + '</span><h4>' + p.t + '</h4><p>' + p.d + '</p></div>').join('') + '</div></section>';
    }
  };

  /* ================================================================== The Desk */
  NE.pages.settings = {
    title: 'The Desk',
    render() {
      const s = NE.settings, al = s.alerts || {};
      const row = (k, l, d) => '<label class="setrow"><span><b>' + l + '</b><small>' + d + '</small></span><input type="checkbox" class="sw" data-alert="' + k + '"' + (al[k] ? ' checked' : '') + '></label>';
      const opt = (arr, cur) => arr.map(o => '<option value="' + o[0] + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + o[1] + '</option>').join('');
      return U.pgh({ k: 'Preferences', t: 'The Desk', s: 'Your preferences are kept in this browser and take effect instantly on every screen.' }) +
        '<div class="deskgrid"><div>' + U.box('Display', '<div class="inputs"><div class="fld"><span>Price format</span>' + U.seg('oddsFormat', [{ v: 'american', l: 'American' }, { v: 'decimal', l: 'Decimal' }, { v: 'implied', l: 'Implied' }], s.oddsFormat, 'sm') + '</div><div class="fld"><span>Edition</span>' + U.seg('theme', [{ v: 'light', l: 'Day' }, { v: 'dark', l: 'Night' }], s.theme, 'sm') + '</div></div>') +
        U.box('Betting model', '<div class="inputs"><label class="fld"><span>Bankroll ($)</span><input type="number" id="sBank" min="100" step="100" value="' + s.bankroll + '"></label><label class="fld"><span>Kelly fraction</span><select id="sKelly">' + opt([[0.1, '10%'], [0.25, '¼ Kelly'], [0.5, '½ Kelly'], [1, 'Full Kelly']], s.kellyFraction) + '</select></label><label class="fld"><span>Default devig method</span><select id="sDevig">' + NE.DEVIG_METHODS.map(m => '<option value="' + m.key + '"' + (m.key === s.devig ? ' selected' : '') + '>' + m.label + '</option>').join('') + '</select></label><label class="fld"><span>Default minimum edge</span><select id="sMinEV">' + opt([0, 1, 2, 3, 5, 8].map(x => [x, x + '%']), s.minEV) + '</select></label></div>', 'mt') + '</div>' +
        '<div>' + U.box('Wire alerts', '<p class="sec-s" style="margin:0 0 8px">Delivered to the Wire menu and as notices while the specimen is open.</p>' + row('ev', 'New edges', 'When a bet clears your alert threshold') + row('arb', 'Crossings', 'When a cross-book arbitrage appears') + row('steam', 'Steam moves', 'Sharp-book price jumps of 2% or more') + row('start', 'Fixtures starting', 'Reminders before logged bets begin') + '<label class="fld" style="margin-top:14px"><span>Alert threshold (edge)</span><select id="sAlertEV">' + opt([3, 5, 8, 10].map(x => [x, x + '%']), s.alertMinEV) + '</select></label>') +
        U.box('Data', '<p class="sec-s" style="margin:0 0 12px">Clear everything the specimen saved in this browser — filed slips, filters and preferences.</p><button class="btn" id="sReset">Reset the specimen</button>', 'mt') + '</div></div>';
    },
    mount(view) {
      const s = NE.settings;
      view.addEventListener('click', function (e) { const b = e.target.closest('[data-seg] button'); if (!b) return; const nm = b.parentNode.dataset.seg; if (nm === 'oddsFormat') NE.app.setOddsFormat(b.dataset.val); else if (nm === 'theme') NE.app.setTheme(b.dataset.val); });
      const bind = (id, fn) => { view.querySelector(id).onchange = e => { fn(e.target.value); NE.saveSettings(); U.toast('Saved'); }; };
      bind('#sBank', v => { s.bankroll = Math.max(100, +v || 5000); }); bind('#sKelly', v => { s.kellyFraction = +v; }); bind('#sDevig', v => { s.devig = v; }); bind('#sMinEV', v => { s.minEV = +v; }); bind('#sAlertEV', v => { s.alertMinEV = +v; });
      view.querySelectorAll('[data-alert]').forEach(c => { c.onchange = () => { s.alerts = Object.assign({}, s.alerts); s.alerts[c.dataset.alert] = c.checked; NE.saveSettings(); U.toast('Saved'); }; });
      view.querySelector('#sReset').onclick = function () {
        try { Object.keys(localStorage).filter(k => k.indexOf('ne:') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
        U.toast('Specimen cleared — reloading'); setTimeout(() => { location.hash = '#/app'; location.reload(); }, 700);
      };
    }
  };

  /* ================================================================== Player file */
  NE.pages.player = {
    title: 'Player file',
    render(ctx) {
      const pl = D.players[ctx.params[0]];
      if (!pl) return U.empty('Player not found', 'Use the search box to find a player.');
      const props = D.props.filter(p => p.pid === pl.id), sp = D.SPORT[pl.sport], ev = props[0] ? D.byEvent[props[0].ev] : null;
      return '<a class="back" href="#/app/props">' + U.icon('arrowL', 14) + ' The Card</a>' +
        '<section class="plhead"><div class="rule-h"></div><div class="plrow"><div class="plmono">' + esc(NE.initials(pl.name)) + '</div><div><span class="k">Player file · ' + esc(sp.name) + '</span><h1>' + esc(pl.name) + '</h1><p class="pl-sub">' + (pl.teamName ? esc(pl.teamName) : '') + (pl.pos ? (pl.teamName ? ' · ' : '') + esc(pl.pos) : '') + (pl.nat && pl.nat.length === 2 && !pl.team ? esc(pl.nat) : '') + '</p></div>' +
        (ev ? '<a class="plnext" href="#/app/event/' + ev.id + '"><span class="lbl">Next fixture</span><b>' + esc(ev.title) + '</b><small>' + (D.isLive(ev) ? 'Live now' : NE.fmtDateTime(ev.start)) + '</small><span class="btn sm">Open fixture</span></a>' : '') + '</div></section>' +
        (props.length ? '<div class="figgrid">' + props.map(p => { const pv = D.propView(p, 'best') || { side: 0, line: p.main }; return U.chartCard({ id: 'pl' + p.id, n: '', title: esc(p.label), cap: 'Last 10 · ' + (pv.side ? 'under ' : 'over ') + NE.fmtLine(pv.line), h: 220, legend: C.legendHTML([{ name: 'Hit', color: 'var(--good)', icon: '✓' }, { name: 'Miss', color: 'var(--bad)', icon: '✕' }]), extra: '<button class="btn sm" data-open="' + p.id + '">Dossier</button>', table: U.simpleTable(['Date', 'Opp', { h: p.label, r: true }], p.log.slice(0, 10).map(g => [NE.fmtShortDate(g.d), esc(g.opp), g.v])) }); }).join('') + '</div>' : U.empty('No props posted', 'This player has no active props today.'));
    },
    mount(view, ctx) {
      const pl = D.players[ctx.params[0]]; if (!pl) return;
      D.props.filter(p => p.pid === pl.id).forEach(function (p) {
        const v = D.propView(p, 'best') || { side: 0, line: p.main };
        const rows = p.log.slice(0, 10).reverse().map(g => ({ v: g.v, label: g.opp, sub: NE.fmtShortDate(g.d), tip: { t: g.opp + ' · ' + NE.fmtShortDate(g.d), r: [[p.label, String(g.v)], ['Line', NE.fmtLine(v.line)]] } }));
        C.logBars(view.querySelector('#ch-pl' + p.id), { rows, line: v.line, side: v.side, h: 220, aria: p.label + ' game log' });
      });
      view.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) NE.openProp(b.dataset.open); });
    }
  };
})(window.NE);
