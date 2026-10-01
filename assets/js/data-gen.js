/* NicheEdge — DEMO data generator (everything is simulated; deterministic per calendar day) */
(function (NE) {
  'use strict';
  const D = NE.data;
  const NOW = Date.now();
  const DAY = 864e5, MIN = 6e4;
  const SEED = 'niche-edge-v3-' + new Date().toISOString().slice(0, 10);
  const R = NE.rng(SEED);
  const round2 = x => Math.round(x * 100) / 100;
  const roundHalf = x => Math.round(x - 0.5) + 0.5;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* extra cricket markets (kept here so config stays readable) */
  D.SPORT.cricket.markets = [
    { key: 'runs', label: 'Runs', dist: 'norm', mu: [13, 36], sdf: m => Math.max(8, m * 0.92), step: 1, role: 'B' },
    { key: 'sixes', label: 'Sixes', dist: 'pois', mu: [0.35, 1.5], step: 1, role: 'B' },
    { key: 'fours', label: 'Fours', dist: 'pois', mu: [1.2, 3.4], step: 1, role: 'B' },
    { key: 'wkts', label: 'Wickets', dist: 'pois', mu: [0.8, 1.8], step: 1, role: 'P' }
  ];

  /* ------------------------------------------------------------------ names */
  const usedNames = new Set();
  function personName(r, nat) {
    const p = D.NAMES[nat] || D.NAMES.GB;
    for (let i = 0; i < 40; i++) {
      const f = r.pick(p.f), l = r.pick(p.l);
      const nm = nat === 'KR' ? l + ' ' + f : f + ' ' + l;
      if (!usedNames.has(nm)) { usedNames.add(nm); return nm; }
    }
    return r.pick(p.f) + ' ' + r.pick(p.l) + ' Jr';
  }
  const surname = n => n.replace(/ Jr$/, '').split(' ').slice(-1)[0];
  function shortOf(p) { return surname(p.name).slice(0, 3).toUpperCase(); }

  /* ------------------------------------------------------------------ participants */
  D.players = {};     // id -> player (ind sports + rostered players)
  D.teams = {};       // id -> team
  const pools = {};   // sport -> array of ind players / teams

  function makeIndPool(sp) {
    const r = NE.rng(SEED + sp.key + 'pool');
    const w = D.NAT_WEIGHTS[sp.key];
    const nats = Object.keys(w), ws = nats.map(k => w[k]);
    const n = sp.n * 2 + 14, arr = [];
    for (let i = 0; i < n; i++) {
      const nat = r.weighted(nats, ws);
      const p = { id: sp.key + '-p' + i, sport: sp.key, kind: 'player', nat, name: personName(r, nat), rating: sp.rating[0] + sp.rating[1] * r.normal(), z: r.normal() };
      p.short = shortOf(p);
      D.players[p.id] = p; arr.push(p);
    }
    pools[sp.key] = arr;
  }

  const LOL_ROLES = ['Top', 'Jungle', 'Mid', 'Bot', 'Support'];
  const DOTA_ROLES = ['Pos 1', 'Pos 2', 'Pos 3', 'Pos 4', 'Pos 5'];
  function makeTeamPool(sp) {
    const r = NE.rng(SEED + sp.key + 'teams');
    const list = D.TEAMS[sp.key]; const arr = [];
    const handles = r.shuffle(D.HANDLES); let hi = 0;
    list.forEach((t, i) => {
      const team = { id: sp.key + '-t' + i, sport: sp.key, kind: 'team', name: t[0], short: t[1], nat: t[2], league: t[3], rating: sp.rating[0] + t[4] + r.normal() * 14, roster: [] };
      const mk = (name, pos, role, extra) => {
        const p = Object.assign({ id: team.id + '-r' + team.roster.length, sport: sp.key, kind: 'player', team: team.id, teamName: team.name, name, pos, role, z: r.normal() }, extra || {});
        D.players[p.id] = p; team.roster.push(p);
      };
      if (sp.esport) {
        const cnt = sp.key === 'rl' ? 3 : 5;
        for (let k = 0; k < cnt; k++) mk(handles[hi++ % handles.length], sp.key === 'lol' ? LOL_ROLES[k] : sp.key === 'dota' ? DOTA_ROLES[k] : (sp.key === 'rl' ? ['Striker', 'Mid', 'Defender'][k] : 'Player'), sp.key === 'lol' ? k : sp.key === 'dota' ? k : -1);
      } else if (sp.key === 'cricket') {
        for (let k = 0; k < 6; k++) mk(personName(r, t[2]), 'Batter', 'B');
        for (let k = 0; k < 3; k++) mk(personName(r, t[2]), 'Bowler', 'P');
      } else { // baseball
        for (let k = 0; k < 3; k++) mk(personName(r, t[2]), 'SP', 'P');
        for (let k = 0; k < 9; k++) mk(personName(r, t[2]), 'Batter', 'B');
      }
      D.teams[team.id] = team; arr.push(team);
    });
    pools[sp.key] = arr;
  }
  D.SPORTS.forEach(sp => (sp.kind === 'ind' ? makeIndPool(sp) : makeTeamPool(sp)));

  /* ------------------------------------------------------------------ pricing helpers */
  const bookMargin = (r, b, prop) => r.range.apply(r, prop ? b.pmargin : b.margin);

  const logit = x => Math.log(x / (1 - x)), sigm = x => 1 / (1 + Math.exp(-x));
  const NOISE_MULT = { ml: 0.8, spread: 1.0, total: 1.0, prop: 1.25 };
  function mkQuote(r, b, p0, kind, line) {
    // soft books misprice in log-odds space (so a 15% shot is never priced like a 3% shot)
    let e = 0;
    if (!b.sharp) {
      const sd = b.noise * NOISE_MULT[kind] * 4;
      e = r.normal() * sd;
      if (r.chance(0.022)) e = r.normal() * sd * 2.3;      // stale / mispriced line
      e = NE.clamp(e, -0.42, 0.42);
    }
    const m = bookMargin(r, b, kind === 'prop');
    const p = NE.clamp(sigm(logit(NE.clamp(p0, 0.02, 0.98)) + e), 0.03, 0.97);
    const q = { p, base: p, m, line: line == null ? null : line, o: [0, 0] };
    D.requote(q);
    return q;
  }
  D.requote = function (q) {
    q.o = [Math.max(1.01, round2(1 / (q.p * (1 + q.m)))), Math.max(1.01, round2(1 / ((1 - q.p) * (1 + q.m))))];
  };

  /* ------------------------------------------------------------------ series model (esports) */
  function seriesDist(q, bo) {
    const need = (bo + 1) / 2, out = [];
    const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };
    for (let b = 0; b < need; b++) {
      const pa = C(need - 1 + b, b) * Math.pow(q, need) * Math.pow(1 - q, b);
      out.push({ a: need, b, p: pa });
      out.push({ a: b, b: need, p: C(need - 1 + b, b) * Math.pow(1 - q, need) * Math.pow(q, b) });
    }
    return out;
  }
  const seriesWin = (q, bo) => seriesDist(q, bo).filter(o => o.a > o.b).reduce((s, o) => s + o.p, 0);
  function solveQ(p, bo) {
    let lo = 0.02, hi = 0.98;
    for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (seriesWin(m, bo) < p) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  /* ------------------------------------------------------------------ scores / H2H */
  const SET_SCORES = ['6-0', '6-1', '6-2', '6-3', '6-4', '6-4', '6-3', '7-5', '7-6', '6-4'];
  function scoreStr(r, sp, win) {
    // returns the score from the winner's perspective
    if (sp.group === 'Tennis') {
      const sets = r.chance(0.62) ? 2 : 3, out = [];
      const lost = sets === 3 ? r.int(0, 1) : -1;   // index of the one set the winner dropped
      for (let s = 0; s < sets; s++) {
        const sc = r.pick(SET_SCORES);
        out.push(s === lost ? sc.split('').reverse().join('') : sc);
      }
      return out.join(' ');
    }
    if (sp.key === 'darts') { const ft = r.pick([6, 8, 10]); return ft + '-' + r.int(Math.max(1, ft - 7), ft - 1); }
    if (sp.esport) { const bo = r.chance(0.7) ? 3 : 5; const need = (bo + 1) / 2; return need + '-' + r.int(0, need - 1); }
    if (sp.group === 'Baseball') { const w = r.int(2, 11); return w + '-' + r.int(0, Math.min(w - 1, 8)); }
    if (sp.group === 'Cricket') return r.chance(0.5) ? 'by ' + r.int(4, 48) + ' runs' : 'by ' + r.int(2, 8) + ' wkts';
    if (sp.key === 'golf') { const s = r.int(65, 70); return s + '-' + (s + r.int(1, 5)); }
    return '';
  }

  /* ------------------------------------------------------------------ stats display */
  D.fmtStat = function (v, fmt) {
    switch (fmt) {
      case 'pct0': return Math.round(v) + '%';
      case 'n0': return String(Math.round(v));
      case 'n1': return v.toFixed(1);
      case 'n2': return v.toFixed(2);
      case 'n3': return v.toFixed(3).replace(/^0/, '');
      case 'sgn0': return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(Math.round(v));
      case 'sgn1': return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1);
      case 'sgn2': return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
      default: return String(v);
    }
  };

  /* ------------------------------------------------------------------ props */
  D.pOver = function (prop, line) {
    if (prop.dist === 'pois') return 1 - NE.poisCdf(Math.floor(line), prop.mu);
    return 1 - NE.normCdf((line - prop.mu) / prop.sd);
  };
  function sampleVal(r, prop, mu) {
    if (prop.dist === 'pois') {
      const L = Math.exp(-mu); let k = 0, p = 1;
      do { k++; p *= r.next(); } while (p > L && k < 60);
      return k - 1;
    }
    const x = mu + prop.sd * r.normal();
    return prop.dist === 'cont' ? Math.round(x * 10) / 10 : Math.max(0, Math.round(x));
  }
  function pickMainLine(prop) {
    let best = null, bd = 9;
    const base = Math.floor(prop.mu) + 0.5;
    for (let k = -8; k <= 8; k++) {
      const line = base + k * prop.step;
      if (line < 0.5) continue;
      const d = Math.abs(D.pOver(prop, line) - 0.5);
      if (d < bd) { bd = d; best = line; }
    }
    return best;
  }
  function logGap(r, sp, role) {
    if (sp.group === 'Tennis') return r.int(2, 9);
    if (sp.key === 'darts') return r.int(4, 14);
    if (sp.key === 'golf') return r.chance(0.75) ? 1 : r.int(7, 12);
    if (sp.group === 'Cricket') return r.int(2, 11);
    if (sp.esport) return r.int(1, 6);
    if (sp.group === 'Baseball') return role === 'P' ? r.int(5, 7) : 1;
    return 3;
  }

  let propSeq = 0;
  function makeProp(r, sp, ev, player, sideIdx, mk) {
    const prop = { id: 'p' + (++propSeq), sport: sp.key, ev: ev.id, pid: player.id, player: player.name, side: sideIdx,
      team: ev.p[sideIdx].name, teamShort: ev.p[sideIdx].short, opp: ev.p[1 - sideIdx].name, oppShort: ev.p[1 - sideIdx].short,
      mkt: mk.key, label: mk.label, step: mk.step, pos: player.pos || '', start: ev.start };
    // --- distribution parameters
    let mu;
    if (mk.dist === 'games') {
      const sgn = sideIdx === 0 ? 1 : -1;
      mu = (ev.mk.total.mu + sgn * ev.muMargin) / 2; prop.dist = 'norm'; prop.sd = 2.35;
    } else {
      const lo = mk.mu[0], hi = mk.mu[1];
      const hasRole = (sp.key === 'lol' || sp.key === 'dota') && player.role >= 0;
      if (hasRole) {
        const mult = sp.key === 'lol'
          ? (mk.key === 'kills' ? [0.88, 0.78, 1.12, 1.28, 0.5] : [0.72, 1.18, 1.0, 0.95, 1.55])[player.role]
          : (mk.key === 'kills' ? [1.32, 1.2, 1.02, 0.72, 0.55] : [0.6, 0.8, 1.0, 1.32, 1.6])[player.role];
        mu = ((lo + hi) / 2) * mult * (1 + 0.1 * player.z);
      } else if (sp.key === 'baseball' || sp.group === 'Baseball' || sp.group === 'Cricket') {
        mu = lerp(lo, hi, NE.clamp(0.5 + 0.24 * r.normal(), 0.04, 0.96));
      } else {
        mu = lerp(lo, hi, NE.clamp(0.5 + 0.22 * r.normal(), 0.04, 0.96));
      }
      prop.dist = mk.dist === 'games' ? 'norm' : mk.dist;
      if (prop.dist !== 'pois') prop.sd = mk.sdf(mu);
      // matchup nudge for rate stats
      if (sp.group === 'Tennis' && mk.key === 'aces') mu *= 1 + 0.12 * (ev.mk.ml.pin0 - 0.5);
    }
    prop.mu = Math.max(prop.dist === 'pois' ? 0.15 : 0.5, mu);
    prop.main = pickMainLine(prop);
    // --- quotes
    const pO = D.pOver(prop, prop.main);
    prop.q = {};
    sp.books.forEach(bk => {
      const b = D.BOOK[bk];
      if (!b.sharp && !r.chance(bk === 'b365' ? 0.88 : bk === 'btw' || bk === 'unib' ? 0.7 : 0.55)) return;
      let line = prop.main;
      if (!b.sharp) { const sh = r.pick([-1, 0, 0, 0, 0, 0, 1]) * prop.step; if (line + sh >= 0.5) line += sh; }
      const p0 = D.pOver(prop, line);
      prop.q[bk] = mkQuote(r, b, p0, 'prop', line);
    });
    if (!prop.q.pin) prop.q.pin = mkQuote(r, D.BOOK.pin, pO, 'prop', prop.main);
    prop.q.pin.line = prop.main;
    // --- game log (most recent first)
    const form = 0.09 * r.normal();
    let t = NOW - r.int(1, 4) * DAY;
    prop.log = [];
    const oppPool = pools[sp.key];
    for (let i = 0; i < 20; i++) {
      const mu_i = prop.mu * (1 + (i < 6 ? form : 0) + 0.06 * r.normal());
      const o = r.pick(oppPool);
      prop.log.push({ v: sampleVal(r, prop, Math.max(0.1, mu_i)), d: t, opp: o.short || shortOf(o), home: r.chance(0.5) });
      t -= logGap(r, sp, mk.role || player.role) * DAY;
    }
    // --- H2H vs tonight's opponent
    const h2hN = r.chance(0.35) ? 0 : r.int(1, 5), shift = 1 + 0.09 * r.normal();
    prop.h2h = [];
    let th = NOW - r.int(40, 120) * DAY;
    for (let i = 0; i < h2hN; i++) { prop.h2h.push({ v: sampleVal(r, prop, Math.max(0.1, prop.mu * shift)), d: th, opp: prop.oppShort }); th -= r.int(60, 240) * DAY; }
    // --- Pinnacle fair-prob history (open -> now)
    const pinFair = NE.devig(prop.q.pin.o, 'multiplicative')[0];
    let cur = pinFair - r.normal() * 0.02; prop.hist = [];
    for (let i = 0; i < 24; i++) {
      const frac = i / 23; const v = i === 23 ? pinFair : NE.clamp(lerp(cur, pinFair, frac) + r.normal() * 0.006 * (1 - frac), 0.05, 0.95);
      prop.hist.push({ t: NOW - (23 - i) * 38 * MIN, p: v });
    }
    prop.open = prop.hist[0].p;
    return prop;
  }

  /* ------------------------------------------------------------------ events */
  D.events = []; D.props = []; D.byEvent = {}; D.byProp = {};
  let evSeq = 0;

  function pairIndividuals(r, sp, used) {
    const pool = pools[sp.key].filter(p => !used.has(p.id));
    for (let tries = 0; tries < 60; tries++) {
      const a = r.pick(pool), b = r.pick(pool);
      if (a === b) continue;
      if (Math.abs(a.rating - b.rating) < 240) { used.add(a.id); used.add(b.id); return r.chance(0.5) ? [a, b] : [b, a]; }
    }
    const a = pool[0], b = pool[1]; used.add(a.id); used.add(b.id); return [a, b];
  }
  function pairTeams(r, sp, usedPairs) {
    const teams = pools[sp.key];
    for (let tries = 0; tries < 80; tries++) {
      const a = r.pick(teams); const same = teams.filter(t => t.league === a.league && t !== a);
      if (!same.length) continue;
      const b = r.pick(same); const key = [a.id, b.id].sort().join('|');
      if (usedPairs.has(key)) continue;
      usedPairs.add(key); return [a, b];
    }
    return [teams[0], teams[1]];
  }

  function buildEvent(sp, idx, a, b, startMin) {
    const r = NE.rng(SEED + sp.key + 'ev' + idx);
    const ev = { id: 'e' + (++evSeq), sport: sp.key, idx, p: [a, b], start: NOW + startMin * MIN };
    ev.title = a.name + ' vs ' + b.name;
    ev.league = sp.kind === 'team' ? a.league : r.pick(sp.leagues);
    // home advantage and rating → fair ML
    const diff = a.rating - b.rating;
    let pH = 1 / (1 + Math.pow(10, -diff / 400)) + (sp.homeAdv || 0);
    if (sp.esport) pH = NE.clamp(pH, 0.12, 0.88);
    pH = NE.clamp(pH, 0.1, 0.9);
    ev.pH = pH;
    ev.round = sp.rounds ? r.pick(sp.rounds) : '';
    ev.venue = sp.kind === 'team' && sp.group === 'Baseball' ? (D.PARKS[a.short] || '') : sp.venues ? r.pick(sp.venues) : '';
    ev.surface = sp.surfaces ? r.pick(sp.surfaces) : '';
    if (sp.group === 'Darts') ev.ft = r.pick([6, 6, 8, 10]);
    if (sp.esport) ev.bo = sp.key === 'rl' ? 5 : r.chance(0.72) ? 3 : 5;
    ev.live = startMin <= 0;
    ev.mk = {};
    const books = sp.books.map(k => D.BOOK[k]);
    const quotes = (p2, kind, line) => { const o = {}; books.forEach(bk => { o[bk.key] = mkQuote(r, bk, p2, kind, line); }); return o; };

    /* --- moneyline */
    ev.mk.ml = { key: 'ml', label: 'Moneyline', q: quotes(pH, 'ml'), line: null };
    ev.mk.ml.pin0 = pH;

    /* --- spread + total */
    let spreadLine, pCoverH, totLine, pOver, muT, sdT;
    if (sp.esport) {
      const bo = ev.bo, q = solveQ(pH, bo), dist = seriesDist(q, bo);
      const homeFav = pH >= 0.5;
      spreadLine = homeFav ? -1.5 : 1.5;
      pCoverH = dist.filter(o => (o.a - o.b) + spreadLine > 0).reduce((s, o) => s + o.p, 0);
      totLine = bo === 3 ? 2.5 : 3.5;
      pOver = dist.filter(o => o.a + o.b > totLine).reduce((s, o) => s + o.p, 0);
      ev.muMargin = 0; muT = (bo + 1) / 2 + 0.7; sdT = 0.8;
    } else {
      let msd = sp.spread.sd, tmu = sp.total.mu, tsd = sp.total.sd;
      if (sp.group === 'Darts') { tmu = 1.6 * ev.ft; tsd = 0.28 * ev.ft + 0.1; msd = 0.45 * ev.ft + 0.2; }
      muT = tmu + tsd * 0.22 * r.normal(); sdT = tsd;
      ev.muMargin = msd * NE.normInv(pH);
      if (sp.group === 'Baseball') {
        spreadLine = pH >= 0.5 ? -1.5 : 1.5;
      } else {
        const hs = roundHalf(ev.muMargin); spreadLine = -hs;
      }
      pCoverH = 1 - NE.normCdf((-spreadLine - ev.muMargin) / msd);
      totLine = Math.max(1.5, roundHalf(muT + r.range(-sp.total.tilt, sp.total.tilt) * (sp.group === 'Darts' ? 0.4 : 1)));
      pOver = 1 - NE.normCdf((totLine - muT) / sdT);
    }
    ev.mk.spread = { key: 'spread', label: sp.spread ? sp.spread.label : 'Map Handicap', line: spreadLine, q: quotes(NE.clamp(pCoverH, 0.2, 0.8), 'spread', spreadLine) };
    ev.mk.total = { key: 'total', label: sp.total ? sp.total.label : 'Total Maps', line: totLine, mu: muT, sd: sdT, q: quotes(NE.clamp(pOver, 0.2, 0.8), 'total', totLine) };
    ev.mk.spread.pCover = pCoverH; ev.mk.total.pOver = pOver;

    /* --- ML history (Pinnacle fair prob open → now) */
    const pinNow = NE.devig(ev.mk.ml.q.pin.o)[0];
    let o0 = NE.clamp(pinNow + r.normal() * 0.03, 0.06, 0.94);
    ev.hist = [];
    for (let i = 0; i < 28; i++) {
      const f = i / 27; ev.hist.push({ t: NOW - (27 - i) * 52 * MIN, p: i === 27 ? pinNow : NE.clamp(lerp(o0, pinNow, f) + r.normal() * 0.007 * (1 - f), 0.05, 0.95) });
    }
    ev.openP = ev.hist[0].p;

    /* --- H2H meetings */
    const nH = r.chance(0.12) ? 0 : r.int(2, sp.kind === 'ind' ? 8 : 7);
    ev.h2h = []; let th = NOW - r.int(20, 160) * DAY;
    for (let i = 0; i < nH; i++) {
      const w = r.chance(NE.clamp(pH + 0.08 * r.normal(), 0.08, 0.92)) ? 0 : 1;
      ev.h2h.push({ d: th, w, score: scoreStr(r, sp, w), comp: sp.kind === 'ind' ? r.pick(sp.venues || ['']) + (sp.surfaces ? ' · ' + r.pick(['Clay', 'Hard', 'Grass', 'Indoor Hard']) : '') : r.pick(sp.leagues || [ev.league]) });
      th -= r.int(50, 300) * DAY;
    }
    /* --- recent form */
    ev.form = [0, 1].map(i => {
      const pm = i === 0 ? ev.pH : 1 - ev.pH, pw = NE.clamp(0.34 + 0.36 * pm + 0.07 * r.normal(), 0.28, 0.78);   // recent form follows match strength
      let t = NOW - r.int(1, 4) * DAY; const out = [];
      for (let k = 0; k < 10; k++) {
        const win = r.chance(pw), o = r.pick(pools[sp.key]);
        out.push({ win, d: t, opp: o.short || shortOf(o), score: scoreStr(r, sp, win ? 0 : 1) });
        t -= logGap(r, sp, 'P') * DAY;
      }
      return out;
    });
    /* --- tale of the tape */
    ev.stats = [0, 1].map(i => {
      const rz = (ev.p[i].rating - sp.rating[0]) / sp.rating[1];
      return sp.stats.map(m => m.base + m.sd * ((m.hi ? 1 : -1) * 0.5 * rz + 0.72 * r.normal()));
    });
    /* --- rating strings */
    ev.ratingTxt = ev.p.map(p => Math.round(p.rating));

    /* --- props */
    ev.props = [];
    const R2 = NE.rng(SEED + sp.key + 'props' + idx);
    const add = (player, side, mk) => { const pr = makeProp(R2, sp, ev, player, side, mk); ev.props.push(pr); D.props.push(pr); D.byProp[pr.id] = pr; };
    if (sp.kind === 'ind') {
      [0, 1].forEach(i => sp.markets.forEach(mk => add(ev.p[i], i, mk)));
    } else if (sp.esport) {
      [0, 1].forEach(i => {
        const roster = sp.key === 'rl' ? ev.p[i].roster : R2.shuffle(ev.p[i].roster).slice(0, 3);
        roster.forEach(pl => sp.markets.forEach(mk => add(pl, i, mk)));
      });
    } else if (sp.group === 'Baseball') {
      [0, 1].forEach(i => {
        const team = ev.p[i];
        const spP = team.roster.filter(x => x.pos === 'SP')[0];
        (ev.pitchers = ev.pitchers || [])[i] = spP;
        sp.markets.filter(m => m.role === 'P').forEach(mk => add(spP, i, mk));
        R2.shuffle(team.roster.filter(x => x.pos === 'Batter')).slice(0, 4).forEach(bt => sp.markets.filter(m => m.role === 'B').forEach(mk => add(bt, i, mk)));
      });
    } else if (sp.group === 'Cricket') {
      [0, 1].forEach(i => {
        const team = ev.p[i];
        const bat = R2.shuffle(team.roster.filter(x => x.role === 'B')).slice(0, 3), bowl = R2.shuffle(team.roster.filter(x => x.role === 'P')).slice(0, 2);
        const mkOf = k => sp.markets.find(m => m.key === k);
        bat.forEach(bt => add(bt, i, mkOf('runs')));
        bat.slice(0, 2).forEach(bt => add(bt, i, mkOf('sixes')));
        bowl.forEach(bw => add(bw, i, mkOf('wkts')));
      });
    }
    D.byEvent[ev.id] = ev; D.events.push(ev);
    return ev;
  }

  D.SPORTS.forEach(sp => {
    const r = NE.rng(SEED + sp.key + 'sched');
    const usedInd = new Set(), usedPairs = new Set();
    // schedule: ~1 in 8 live, rest spread across the next ~34h
    const mins = [];
    for (let i = 0; i < sp.n; i++) mins.push(r.chance(0.13) ? -r.int(8, 95) : r.int(12, 34 * 60));
    mins.sort((x, y) => x - y);
    for (let i = 0; i < sp.n; i++) {
      const [a, b] = sp.kind === 'ind' ? pairIndividuals(r, sp, usedInd) : pairTeams(r, sp, usedPairs);
      buildEvent(sp, i, a, b, mins[i]);
    }
  });
  D.events.sort((x, y) => x.start - y.start);

  /* ------------------------------------------------------------------ inject arbitrage-grade mispricings */
  (function injectArbs() {
    const r = NE.rng(SEED + 'arbs');
    const picks = r.shuffle(D.events.filter(e => !e.live));
    let done = 0;
    for (let i = 0; i < picks.length && done < 11; i++) {
      const ev = picks[i], sp = D.SPORT[ev.sport];
      const mk = ev.mk[r.pick(['ml', 'ml', 'total', 'spread'])];
      const p0 = NE.devig(mk.q.pin.o)[0];
      if (p0 < 0.4 || p0 > 0.6) continue;                       // keep arbs on balanced markets so EV stays believable
      const bk = r.pick(sp.books.filter(k => k !== 'pin')), q = mk.q[bk];
      if (!q) continue;
      const dir = 0.046 + r.next() * 0.022;
      q.p = NE.clamp(q.p + (r.chance(0.5) ? dir : -dir), 0.04, 0.96); q.base = q.p; q.m = Math.min(q.m, 0.04); D.requote(q);
      done++;
    }
  })();

  /* ------------------------------------------------------------------ accessors */
  D.sportOf = key => D.SPORT[key];
  D.eventsOf = key => D.events.filter(e => e.sport === key);
  D.propsOf = ev => ev.props;
  D.isLive = ev => ev.start <= Date.now() && Date.now() < ev.start + 3 * 36e5;
  D.liveCount = () => D.events.filter(D.isLive).length;

  D.mainFair = function (mk, method) {
    const pin = mk.q.pin; if (!pin) return [0.5, 0.5];
    if (method === 'worst') return [NE.fairProb(pin.o, 0, 'worst'), NE.fairProb(pin.o, 1, 'worst')];
    return NE.devig(pin.o, method || NE.settings.devig);
  };
  // fair P(over) for a prop at an arbitrary book line, anchored on Pinnacle's devigged price at its own line
  D.propFairOver = function (prop, line, method) {
    const pin = prop.q.pin;
    const base = method === 'worst' ? NE.fairProb(pin.o, 0, 'worst') : NE.devig(pin.o, method || NE.settings.devig)[0];
    if (line === prop.main) return base;
    return NE.clamp(base + (D.pOver(prop, line) - D.pOver(prop, prop.main)), 0.02, 0.98);
  };
  D.bestOf = function (mk, side, restrictBooks) {
    let best = null;
    Object.keys(mk.q).forEach(k => {
      if (restrictBooks && !restrictBooks.has(k)) return;
      const v = mk.q[k].o[side];
      if (!best || v > best.dec) best = { book: k, dec: v };
    });
    return best;
  };

  // Hit-rate helper. side 0 = over, 1 = under. n = sample, line = threshold.
  D.hit = function (prop, n, side, line, src) {
    const rows = (src || prop.log).slice(0, n);
    let hits = 0, push = 0;
    rows.forEach(g => {
      if (g.v === line) push++;
      else if (side === 0 ? g.v > line : g.v < line) hits++;
    });
    const tot = rows.length - push;
    return { hits, total: rows.length, pct: tot ? hits / tot : null };
  };

  /* ------------------------------------------------------------------ prop "view": best quote for a side + hit rates */
  // mode: 'over' | 'under' | 'best' (higher EV). books: optional Set of allowed books.
  D.propView = function (prop, mode, method, books) {
    let best = null;
    Object.keys(prop.q).forEach(bk => {
      if (books && !books.has(bk)) return;
      const q = prop.q[bk], pO = D.propFairOver(prop, q.line, method);
      [0, 1].forEach(s => {
        if ((mode === 'over' && s !== 0) || (mode === 'under' && s !== 1)) return;
        const p = s === 0 ? pO : 1 - pO, e = p * q.o[s] - 1;
        if (!best || e > best.e) best = { side: s, book: bk, line: q.line, dec: q.o[s], p, e };
      });
    });
    if (!best) return null;
    const v = Object.assign({ prop }, best);
    v.h5 = D.hit(prop, 5, v.side, v.line); v.h10 = D.hit(prop, 10, v.side, v.line); v.h20 = D.hit(prop, 20, v.side, v.line);
    v.hh = D.hit(prop, 99, v.side, v.line, prop.h2h);
    v.avg10 = NE.mean(prop.log.slice(0, 10).map(g => g.v));
    v.fairDec = 1 / v.p;
    return v;
  };
  D.hotProps = function (n, method) {
    const out = [];
    D.props.forEach(pr => {
      if (pr.start < NOW - 1000) return;
      const v = D.propView(pr, 'best', method); if (!v || v.h10.pct == null || v.h10.pct < 0.7 || v.e < -0.01) return;
      v.score = v.e + 0.5 * (v.h10.pct - 0.5); out.push(v);
    });
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, n);
  };

  /* ------------------------------------------------------------------ labels */
  D.marketPick = function (ev, mkKey, side) {
    const sp = D.SPORT[ev.sport], mk = ev.mk[mkKey];
    if (mkKey === 'ml') return ev.p[side].name + ' ML';
    if (mkKey === 'spread') {
      const l = side === 0 ? mk.line : -mk.line;
      return ev.p[side].name + ' ' + (l > 0 ? '+' : '−') + Math.abs(l);
    }
    return (side === 0 ? 'Over ' : 'Under ') + NE.fmtLine(mk.line) + ' ' + (sp.total ? sp.total.label.replace('Total ', '') : 'Maps');
  };
  D.propPick = (prop, side, line) => prop.player + ' ' + (side === 0 ? 'Over ' : 'Under ') + NE.fmtLine(line == null ? prop.main : line) + ' ' + prop.label;

  /* ------------------------------------------------------------------ EV feed */
  D.evFeed = function (o) {
    o = o || {};
    const method = o.method || NE.settings.devig, minEV = (o.minEV == null ? NE.settings.minEV : o.minEV) / 100;
    const bankroll = o.bankroll || NE.settings.bankroll, kf = o.kelly || NE.settings.kellyFraction;
    const out = [];
    const push = (kind, ev, mkKey, side, book, dec, p, extra) => {
      const e = p * dec - 1;
      if (e < minEV) return;
      if (o.maxOdds && dec > o.maxOdds) return;
      const k = NE.kelly(p, dec);
      out.push(Object.assign({ kind, ev, mkKey, side, book, dec, p, e, kelly: k, stake: Math.round(bankroll * k * kf / 5) * 5 }, extra));
    };
    D.events.forEach(ev => {
      if (o.sports && !o.sports.has(ev.sport)) return;
      if (o.event && o.event !== ev.id) return;
      if (!o.kind || o.kind === 'all' || o.kind !== 'prop') {
        ['ml', 'spread', 'total'].forEach(mkKey => {
          if (o.kind && o.kind !== 'all' && o.kind !== mkKey) return;
          const mk = ev.mk[mkKey], fair = D.mainFair(mk, method);
          Object.keys(mk.q).forEach(bk => {
            if (bk === 'pin' || (o.books && !o.books.has(bk))) return;
            [0, 1].forEach(s => push(mkKey, ev, mkKey, s, bk, mk.q[bk].o[s], fair[s], { line: mk.line, fairDec: 1 / fair[s] }));
          });
        });
      }
      if (!o.kind || o.kind === 'all' || o.kind === 'prop') {
        ev.props.forEach(pr => {
          Object.keys(pr.q).forEach(bk => {
            if (bk === 'pin' || (o.books && !o.books.has(bk))) return;
            const q = pr.q[bk], pO = D.propFairOver(pr, q.line, method);
            push('prop', ev, pr.mkt, 0, bk, q.o[0], pO, { prop: pr, line: q.line, fairDec: 1 / pO });
            push('prop', ev, pr.mkt, 1, bk, q.o[1], 1 - pO, { prop: pr, line: q.line, fairDec: 1 / (1 - pO) });
          });
        });
      }
    });
    out.sort((a, b) => b.e - a.e);
    return out;
  };
  D.pickLabel = function (r) {
    if (r.kind === 'prop') return D.propPick(r.prop, r.side, r.line);
    return D.marketPick(r.ev, r.mkKey, r.side);
  };
  D.marketLabel = function (r) {
    if (r.kind === 'prop') return r.prop.label;
    return r.ev.mk[r.mkKey].label;
  };

  /* ------------------------------------------------------------------ arbitrage feed */
  D.arbs = function (o) {
    o = o || {};
    const out = [];
    const check = (ev, mk, label, pickA, pickB, extra) => {
      const b0 = D.bestOf(mk, 0, o.books), b1 = D.bestOf(mk, 1, o.books);
      if (!b0 || !b1 || b0.book === b1.book) return;
      const sum = 1 / b0.dec + 1 / b1.dec;
      if (sum < 1) out.push(Object.assign({ ev, mk, label, legs: [Object.assign({ pick: pickA }, b0), Object.assign({ pick: pickB }, b1)], sum, profit: 1 / sum - 1 }, extra));
    };
    D.events.forEach(ev => {
      if (o.sports && !o.sports.has(ev.sport)) return;
      ['ml', 'spread', 'total'].forEach(k => check(ev, ev.mk[k], ev.mk[k].label, D.marketPick(ev, k, 0), D.marketPick(ev, k, 1), { kind: k }));
      ev.props.forEach(pr => {
        // only identical lines can be arbed
        const byLine = {};
        Object.keys(pr.q).forEach(bk => { (byLine[pr.q[bk].line] = byLine[pr.q[bk].line] || {})[bk] = pr.q[bk]; });
        Object.keys(byLine).forEach(l => {
          const grp = byLine[l]; if (Object.keys(grp).length < 2) return;
          const fake = { q: grp };
          check(ev, fake, pr.label, D.propPick(pr, 0, +l), D.propPick(pr, 1, +l), { kind: 'prop', prop: pr, line: +l });
        });
      });
    });
    out.sort((a, b) => b.profit - a.profit);
    return out;
  };

  /* ------------------------------------------------------------------ search */
  D.search = function (q) {
    q = q.trim().toLowerCase(); if (q.length < 2) return [];
    const res = [];
    D.events.forEach(ev => { if (ev.title.toLowerCase().includes(q)) res.push({ type: 'Matchup', label: ev.title, sub: D.SPORT[ev.sport].name + ' · ' + NE.fmtDateTime(ev.start), href: '#/app/event/' + ev.id, sport: ev.sport }); });
    const seen = new Set();
    D.props.forEach(pr => { if (!seen.has(pr.pid) && pr.player.toLowerCase().includes(q)) { seen.add(pr.pid); res.push({ type: 'Player', label: pr.player, sub: D.SPORT[pr.sport].name + ' · ' + pr.team, href: '#/app/player/' + pr.pid, sport: pr.sport }); } });
    return res.slice(0, 9);
  };

  /* ------------------------------------------------------------------ live tick (simulated feed) */
  D.lastTick = NOW; D.tickCount = 0;
  const tickR = NE.rng('tick-' + Date.now());
  D.tick = function () {
    D.tickCount++; D.lastTick = Date.now();
    const evs = D.events, changed = [];
    const nudge = (q, pin) => {
      const before = q.o[0];
      q.p = NE.clamp(q.base + (pin ? 0.0035 : 0.007) * tickR.normal() + (q.p - q.base) * 0.2, 0.03, 0.97);
      D.requote(q);
      if (q.o[0] !== before) changed.push(q);
    };
    for (let i = 0; i < 70; i++) {
      const ev = tickR.pick(evs), mk = ev.mk[tickR.pick(['ml', 'ml', 'spread', 'total'])], bks = Object.keys(mk.q), bk = tickR.pick(bks);
      nudge(mk.q[bk], bk === 'pin');
    }
    for (let i = 0; i < 90; i++) {
      const pr = tickR.pick(D.props), bks = Object.keys(pr.q), bk = tickR.pick(bks);
      nudge(pr.q[bk], bk === 'pin');
    }
    // occasional steam move on a Pinnacle ML
    if (tickR.chance(0.22)) {
      const ev = tickR.pick(evs.filter(e => !e.live)), q = ev.mk.ml.q.pin;
      const dir = tickR.chance(0.5) ? 1 : -1; q.p = NE.clamp(q.p + dir * tickR.range(0.02, 0.035), 0.05, 0.95); q.base = q.p; D.requote(q);
      const f = NE.devig(q.o)[0]; ev.hist.push({ t: Date.now(), p: f }); if (ev.hist.length > 40) ev.hist.shift();
      D.pushAlert({ type: 'steam', title: 'Steam move', body: ev.title + ' — Pinnacle ' + ev.p[dir > 0 ? 1 : 0].name + ' shortened to ' + NE.fmtOdds(ev.mk.ml.q.pin.o[dir > 0 ? 1 : 0]), href: '#/app/event/' + ev.id });
    }
    NE.bus.emit('tick', { n: D.tickCount });
  };

  /* ------------------------------------------------------------------ alerts feed */
  D.alerts = [];
  D.unread = 0;
  D.pushAlert = function (a) {
    a.t = Date.now(); a.id = 'a' + D.alerts.length + '-' + a.t;
    if (NE.settings.alerts) {
      if (a.type === 'steam' && !NE.settings.alerts.steam) return;
      if (a.type === 'ev' && !NE.settings.alerts.ev) return;
      if (a.type === 'arb' && !NE.settings.alerts.arb) return;
    }
    D.alerts.unshift(a); D.unread++; if (D.alerts.length > 30) D.alerts.pop();
    NE.bus.emit('alert', a);
  };
  (function seedAlerts() {
    const feed = D.evFeed({ minEV: 4, method: 'multiplicative' }).slice(0, 4);
    const arbs = D.arbs().slice(0, 2);
    const items = [];
    feed.forEach(f => items.push({ type: 'ev', title: 'New +EV ' + NE.fmtEV(f.e), body: D.pickLabel(f) + ' @ ' + D.BOOK[f.book].name + ' ' + NE.fmtOdds(f.dec), href: f.kind === 'prop' ? '#/app/props?open=' + f.prop.id : '#/app/event/' + f.ev.id }));
    arbs.forEach(a => items.push({ type: 'arb', title: 'Arb ' + NE.fmtSigned(a.profit * 100, 2, '%'), body: a.ev.title + ' · ' + a.label, href: '#/app/arbs' }));
    items.forEach((it, i) => { it.t = NOW - (3 + i * 7) * MIN; it.id = 'seed' + i; D.alerts.push(it); });
    D.alerts.sort((a, b) => b.t - a.t);
    D.unread = Math.min(D.alerts.length, 4);
  })();

  /* ------------------------------------------------------------------ CLV / bet history (simulated) */
  D.betBook = ['pin', 'b365', 'btw', 'unib', 'stk', 'bfx', 'bvd', 'dfb'];
  D.makeBetHistory = function () {
    let best = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      const r = NE.rng(SEED + 'bets' + attempt), bets = [];
      const sportKeys = D.SPORTS.map(s => s.key), w = [9, 14, 8, 7, 9, 6, 4, 3, 4, 2, 7, 5, 5];
      for (let i = 0; i < 74; i++) {
        const key = r.weighted(sportKeys, w), sp = D.SPORT[key], dec = round2(r.range(1.62, 2.55));
        const clv = NE.clamp(0.034 + r.normal() * 0.037, -0.07, 0.14);
        const pClose = NE.clamp((1 + clv) / dec, 0.2, 0.9);
        const stake = Math.max(0.5, Math.min(3, Math.round((0.6 + clv * 18) * 4) / 4));
        const win = r.chance(pClose), day = NOW - (74 - i) * 0.86 * DAY;
        const fake = r.pick(pools[key]), foe = r.pick(pools[key].filter(x => x !== fake));
        const nm = sp.kind === 'ind' ? fake.name : fake.name;
        const mkts = sp.markets ? r.pick(sp.markets).label : 'Moneyline';
        const style = r.pick(['ml', 'prop', 'total', 'prop']);
        let desc;
        if (style === 'ml') desc = nm + ' ML';
        else if (style === 'total') desc = 'Over ' + NE.fmtLine(roundHalf(sp.total ? sp.total.mu : 2.5)) + ' ' + (sp.total ? sp.total.label.replace('Total ', '') : 'Maps');
        else desc = (sp.kind === 'ind' ? nm : (D.players[r.pick(fake.roster || [{ id: '' }]).id] || { name: nm }).name) + ' ' + r.pick(['Over', 'Under']) + ' ' + (r.int(2, 14) + 0.5) + ' ' + mkts;
        bets.push({ id: 'h' + i, ts: day, sport: key, desc, vs: sp.kind === 'ind' ? fake.name + ' v ' + foe.name : fake.name + ' v ' + foe.name, book: r.pick(D.betBook), dec, stake, closeDec: round2(1 / pClose), clv, win, profit: win ? stake * (dec - 1) : -stake, status: 'settled' });
      }
      const tot = NE.sum(bets.map(b => b.profit)), clvAvg = NE.mean(bets.map(b => b.clv));
      best = bets;
      if (tot > 7 && tot < 26 && clvAvg > 0.026 && clvAvg < 0.042) break;
    }
    return best;
  };
  D.bets = D.makeBetHistory();
})(window.NE);
