/* The Closing Line — The Workbench (devig / EV / Kelly calculator) with an adding-machine receipt */
(function (NE) {
  'use strict';
  const D = NE.data, U = NE.ui, esc = NE.esc;
  const S = { n: 2, pick: 0, init: false, a: '', b: '', c: '', t: '', method: 'multiplicative' };
  const letters = ['A', 'B', 'C'];

  function seed() {
    if (S.init) return; S.init = true;
    const f = D.evFeed({ minEV: 3, kind: 'ml' }).filter(x => x.e < 0.15)[0];
    if (f) { const pin = f.ev.mk.ml.q.pin.o; S.a = NE.fmtOdds(pin[0]); S.b = NE.fmtOdds(pin[1]); S.t = NE.fmtOdds(f.dec); S.pick = f.side; } else { S.a = '-125'; S.b = '+105'; S.t = '+118'; }
    S.c = '+400';
  }
  function result() {
    const raw = [S.a, S.b].concat(S.n === 3 ? [S.c] : []).map(NE.parseOdds), test = NE.parseOdds(S.t);
    if (raw.some(x => !(x > 1))) return { err: 'Enter valid prices for every outcome (for example -125, +105, 1.80 or 55%).' };
    const table = ['multiplicative', 'additive', 'power', 'shin'].map(m => ({ m, label: NE.DEVIG_METHODS.find(x => x.key === m).label, p: NE.devig(raw, m) }));
    const worst = raw.map((_, i) => Math.min.apply(null, table.map(r => r.p[i])));
    const pick = Math.min(S.pick, raw.length - 1), sel = S.method === 'worst' ? worst[pick] : table.find(r => r.m === S.method).p[pick];
    const out = { raw, table, worst, pick, sel, hold: NE.hold(raw), test };
    if (test > 1) { out.ev = NE.ev(sel, test); out.kelly = NE.kelly(sel, test); out.evs = table.map(r => NE.ev(r.p[pick], test)); out.evWorst = NE.ev(worst[pick], test); }
    return out;
  }
  const line = (l, v, cls) => '<div class="rc-l ' + (cls || '') + '"><span>' + l + '</span><i></i><b>' + v + '</b></div>';

  function tape(r) {
    const names = letters.slice(0, S.n);
    if (r.err) return '<div class="rcpt"><div class="rc-h">THE CLOSING LINE</div><p class="rc-err">' + esc(r.err) + '</p></div>';
    const stake = r.kelly ? NE.settings.bankroll * r.kelly * NE.settings.kellyFraction : 0, m = NE.DEVIG_METHODS.find(x => x.key === S.method).label.split(' (')[0];
    return '<div class="rcpt"><div class="rc-h">THE CLOSING LINE</div><div class="rc-sub">★ DEVIG WORKBENCH ★</div><div class="rc-sep"></div>' +
      r.raw.map((d, i) => line('PRICE ' + names[i], NE.fmtOdds(d))).join('') + line('BOOK HOLD', NE.fmtPct(r.hold, 2)) + '<div class="rc-sep"></div>' +
      '<div class="rc-t">METHOD · ' + esc(m.toUpperCase()) + '</div>' + r.raw.map((d, i) => line('FAIR ' + names[i], NE.fmtPct((S.method === 'worst' ? r.worst : r.table.find(t => t.m === S.method).p)[i], 2))).join('') +
      line('FAIR PRICE ' + names[r.pick], NE.fmtOdds(1 / r.sel)) + '<div class="rc-sep"></div>' +
      line('TEST PRICE ' + names[r.pick], r.ev == null ? '—' : NE.fmtOdds(r.test)) +
      (r.ev == null ? '' : '<div class="rc-edge ' + (r.ev >= 0 ? 'pos' : 'neg') + '"><span>EDGE</span><b class="stamp-in">' + NE.fmtEV(r.ev) + '</b></div>' +
        line('PER $100 STAKED', NE.fmtMoney(r.ev * 100, 2)) + line('KELLY ' + Math.round(NE.settings.kellyFraction * 100) + '%', r.ev > 0 ? NE.fmtMoney(stake) : '—') + line('FULL KELLY', r.ev > 0 ? NE.fmtPct(r.kelly, 2) : '—')) +
      '<div class="rc-dbl"></div><div class="rc-foot">THANK YOU · BET RESPONSIBLY<br>** SIMULATED SPECIMEN **</div></div>';
  }
  function render(root) {
    const r = result(); root.querySelector('#cTape').innerHTML = tape(r); const box = root.querySelector('#cRes');
    if (r.err) { box.innerHTML = ''; return; }
    const names = letters.slice(0, S.n);
    box.innerHTML = U.simpleTable(['Method'].concat(names.map(n => ({ h: 'Fair % ' + n, r: true }))).concat(names.map(n => ({ h: 'Fair price ' + n, r: true }))).concat(r.ev == null ? [] : [{ h: 'Edge on ' + names[r.pick], r: true }]),
      r.table.map((t, k) => [esc(t.label.split(' (')[0])].concat(t.p.map(x => NE.fmtPct(x, 2))).concat(t.p.map(x => NE.fmtOdds(1 / x))).concat(r.ev == null ? [] : ['<span class="' + (r.evs[k] >= 0 ? 'pos' : 'neg') + '">' + NE.fmtEV(r.evs[k]) + '</span>'])).concat([['<b>Worst case</b>'].concat(r.worst.map(x => NE.fmtPct(x, 2))).concat(r.worst.map(x => NE.fmtOdds(1 / x))).concat(r.ev == null ? [] : ['<span class="' + (r.evWorst >= 0 ? 'pos' : 'neg') + '">' + NE.fmtEV(r.evWorst) + '</span>'])])) +
      '<p class="sec-s" style="padding-top:12px;max-width:80ch">Multiplicative removes the margin proportionally; additive removes it equally; power and Shin push more of it onto the longshots (the favourite–longshot bias). Near 50/50 they agree closely — on lopsided prices they diverge, which is why the worst case is worth a look.</p>';
  }
  function converter(root) {
    const v = NE.parseOdds(root.querySelector('#cvIn').value), o = root.querySelector('#cvOut');
    if (!(v > 1)) { o.innerHTML = '<span class="muted" style="font-style:italic">Try -150, +130, 2.30 or 43%.</span>'; return; }
    o.innerHTML = [['American', NE.fmtOdds(v, 'american')], ['Decimal', v.toFixed(3)], ['Implied', NE.fmtPct(1 / v, 2)], ['Fractional', frac(v - 1)]].map(x => '<div class="cv"><span>' + x[0] + '</span><b>' + x[1] + '</b></div>').join('');
  }
  function frac(x) { let best = [1, 1], err = 9; for (let d = 1; d <= 20; d++) { const n = Math.round(x * d); if (n && Math.abs(n / d - x) < err - 1e-9) { err = Math.abs(n / d - x); best = [n, d]; } } return best[0] + '/' + best[1]; }
  const opt = (arr, cur) => arr.map(o => '<option value="' + o[0] + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + o[1] + '</option>').join('');

  NE.pages.calc = {
    title: 'The Workbench',
    render() {
      seed();
      return U.pgh({ k: 'Devig calculator', t: 'The Workbench', s: 'Strip the bookmaker’s margin out of a two- or three-way market, then test any other book’s price for edge and Kelly stake. Prefilled with a live sharp price from the board; the receipt prints as you type.' }) +
        '<div class="wb rules"><div><div class="sec-k"><span class="k">Step one</span><h3>The sharp market</h3></div><div class="frow" style="margin:12px 0 16px">' + U.seg('n', [{ v: 2, l: 'Two-way' }, { v: 3, l: 'Three-way' }], S.n, 'sm') + '</div>' +
        '<div class="inputs"><label class="fld"><span>Outcome A price</span><input type="text" id="cA" value="' + esc(S.a) + '" aria-label="Outcome A price"></label><label class="fld"><span>Outcome B price</span><input type="text" id="cB" value="' + esc(S.b) + '" aria-label="Outcome B price"></label><label class="fld" id="cCw" style="' + (S.n === 3 ? '' : 'display:none') + '"><span>Outcome C price</span><input type="text" id="cC" value="' + esc(S.c) + '" aria-label="Outcome C price"></label></div>' +
        '<div class="sec-k mt"><span class="k">Step two</span><h3>The price to test</h3></div><div class="inputs" style="margin-top:12px"><label class="fld"><span>Book price</span><input type="text" id="cT" value="' + esc(S.t) + '" aria-label="Book price to test"></label><div class="fld"><span>Backing</span><div id="cPick"></div></div><label class="fld"><span>Devig method</span><select id="cMeth">' + NE.DEVIG_METHODS.map(m => '<option value="' + m.key + '"' + (m.key === S.method ? ' selected' : '') + '>' + m.label + '</option>').join('') + '</select></label></div>' +
        '<div class="inputs" style="margin-top:14px"><label class="fld"><span>Bankroll ($)</span><input type="number" id="cBank" value="' + NE.settings.bankroll + '" min="100" step="100"></label><label class="fld"><span>Kelly fraction</span><select id="cKelly">' + opt([[0.1, '10%'], [0.25, '¼ Kelly'], [0.5, '½ Kelly'], [1, 'Full Kelly']], NE.settings.kellyFraction) + '</select></label></div>' +
        '<div class="sec-k mt-l"><span class="k">Aside</span><h3>Odds converter</h3></div><input type="text" id="cvIn" value="' + esc(S.a) + '" style="width:100%;margin:12px 0 14px" aria-label="Price to convert"><div id="cvOut" class="cvs"></div></div>' +
        '<div class="wb-r"><div id="cTape"></div></div></div>' +
        '<section class="mt-l"><div class="sec-k"><span class="k">Comparison</span><h3>All methods side by side</h3></div><div id="cRes"></div></section>';
    },
    mount(view) {
      const pickDraw = () => { view.querySelector('#cPick').innerHTML = U.seg('pick', letters.slice(0, S.n).map((l, i) => ({ v: i, l })), Math.min(S.pick, S.n - 1), 'sm'); };
      pickDraw();
      const bind = (id, key) => { view.querySelector(id).oninput = e => { S[key] = e.target.value; render(view); }; };
      bind('#cA', 'a'); bind('#cB', 'b'); bind('#cC', 'c'); bind('#cT', 't');
      view.querySelector('#cvIn').oninput = () => converter(view);
      view.querySelector('#cMeth').onchange = e => { S.method = e.target.value; render(view); };
      view.querySelector('#cBank').onchange = e => { NE.settings.bankroll = Math.max(100, +e.target.value || 5000); NE.saveSettings(); render(view); };
      view.querySelector('#cKelly').onchange = e => { NE.settings.kellyFraction = +e.target.value; NE.saveSettings(); render(view); };
      view.addEventListener('click', function (e) {
        const b = e.target.closest('[data-seg] button'); if (!b) return; const nm = b.parentNode.dataset.seg;
        if (nm === 'n') { S.n = +b.dataset.val; view.querySelector('#cCw').style.display = S.n === 3 ? '' : 'none'; if (S.pick >= S.n) S.pick = 0; b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); pickDraw(); render(view); }
        else if (nm === 'pick') { S.pick = +b.dataset.val; b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); render(view); }
      });
      render(view); converter(view);
    }
  };
})(window.NE);
