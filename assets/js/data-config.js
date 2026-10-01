/* NicheEdge — static configuration for the DEMO dataset (books, sports, markets, name pools, teams).
   Every player name is invented. Team / league names are real labels used purely as placeholders;
   all odds, lines, stats and results are simulated. */
window.NE = window.NE || {};
(function (NE) {
  'use strict';
  const D = NE.data = NE.data || {};

  /* ---------------- Bookmakers ---------------- */
  // margin = [min,max] overround on 2-way main markets, pmargin = props, noise = price noise sd (prob pts)
  D.BOOKS = [
    { key: 'pin',  name: 'Pinnacle',  short: 'PIN', hue: 38,  sharp: true,  margin: [0.019, 0.026], pmargin: [0.035, 0.048], noise: 0 },
    { key: 'b365', name: 'bet365',    short: '365', hue: 150, margin: [0.045, 0.062], pmargin: [0.07, 0.09],  noise: 0.012 },
    { key: 'btw',  name: 'Betway',    short: 'BTW', hue: 162, margin: [0.05, 0.07],   pmargin: [0.075, 0.095], noise: 0.014 },
    { key: 'unib', name: 'Unibet',    short: 'UNI', hue: 128, margin: [0.05, 0.068],  pmargin: [0.075, 0.095], noise: 0.014 },
    { key: 'bfx',  name: 'Betfair Exchange', short: 'BFX', hue: 48, margin: [0.018, 0.03], pmargin: [0.04, 0.06], noise: 0.011 },
    { key: 'dk',   name: 'DraftKings', short: 'DK', hue: 100, margin: [0.045, 0.06],  pmargin: [0.065, 0.085], noise: 0.015 },
    { key: 'fd',   name: 'FanDuel',   short: 'FD',  hue: 212, margin: [0.045, 0.06],  pmargin: [0.065, 0.085], noise: 0.015 },
    { key: 'mgm',  name: 'BetMGM',    short: 'MGM', hue: 42,  margin: [0.05, 0.068],  pmargin: [0.07, 0.09],  noise: 0.016 },
    { key: 'bvd',  name: 'Bovada',    short: 'BOV', hue: 2,   margin: [0.055, 0.08],  pmargin: [0.08, 0.11],  noise: 0.019 },
    { key: 'stk',  name: 'Stake',     short: 'STK', hue: 168, margin: [0.035, 0.05],  pmargin: [0.06, 0.085], noise: 0.016 },
    { key: 'dfb',  name: 'Dafabet',   short: 'DAF', hue: 22,  margin: [0.055, 0.075], pmargin: [0.08, 0.105], noise: 0.019 }
  ];
  D.BOOK = {}; D.BOOKS.forEach(b => { D.BOOK[b.key] = b; });
  const TEN = ['pin', 'b365', 'btw', 'unib', 'bfx', 'dk', 'fd', 'mgm', 'bvd', 'stk'];

  /* ---------------- Sports ---------------- */
  // kind: 'ind' individual / 'team'. totalMu/Sd = main total market; marginSd = sd of final margin in the spread unit.
  D.SPORTS = [
    { key: 'atp', group: 'Tennis', name: 'ATP Tour', short: 'ATP', kind: 'ind', photo: 'tennis-atp', icon: 'tennis', n: 8,
      leagues: ['ATP 250', 'ATP 500', 'Masters 1000'], books: TEN, rating: [1900, 150],
      spread: { label: 'Game Spread', unit: 'games', sd: 5.3 }, total: { label: 'Total Games', mu: 22.6, sd: 4.2, tilt: 0.7 },
      markets: [
        { key: 'aces', label: 'Aces', dist: 'norm', mu: [3.5, 12], sdf: m => Math.max(1.6, m * 0.52), step: 1 },
        { key: 'dfs', label: 'Double Faults', dist: 'pois', mu: [1.4, 4.2], step: 1 },
        { key: 'gw', label: 'Games Won', dist: 'games', step: 1 }
      ],
      stats: [
        { label: '1st serve %', base: 63, sd: 3.6, fmt: 'pct0', hi: true }, { label: 'Aces / match', base: 7.2, sd: 3, fmt: 'n1', hi: true },
        { label: 'Service games held', base: 82, sd: 6, fmt: 'pct0', hi: true }, { label: 'Return games won', base: 21, sd: 6, fmt: 'pct0', hi: true },
        { label: 'Break points saved', base: 63, sd: 5, fmt: 'pct0', hi: true }, { label: 'Tiebreak win %', base: 52, sd: 12, fmt: 'pct0', hi: true }
      ],
      venues: ['Vienna', 'Basel', 'Tokyo', 'Paris', 'Astana', 'Antwerp', 'Stockholm', 'Shanghai'], surfaces: ['Indoor Hard', 'Hard', 'Hard', 'Clay'], rounds: ['R32', 'R16', 'QF', 'SF', 'F'] },

    { key: 'chal', group: 'Tennis', name: 'ATP Challenger', short: 'CHALL', kind: 'ind', photo: 'tennis-chal', icon: 'tennis', n: 14,
      leagues: ['Challenger 50', 'Challenger 75', 'Challenger 100', 'Challenger 125'], books: TEN.filter(b => b !== 'fd'), rating: [1640, 130],
      spread: { label: 'Game Spread', unit: 'games', sd: 5.6 }, total: { label: 'Total Games', mu: 22.1, sd: 4.4, tilt: 0.9 },
      markets: [
        { key: 'aces', label: 'Aces', dist: 'norm', mu: [2.5, 10], sdf: m => Math.max(1.5, m * 0.55), step: 1 },
        { key: 'dfs', label: 'Double Faults', dist: 'pois', mu: [1.8, 5], step: 1 },
        { key: 'gw', label: 'Games Won', dist: 'games', step: 1 }
      ],
      stats: [
        { label: '1st serve %', base: 61, sd: 4, fmt: 'pct0', hi: true }, { label: 'Aces / match', base: 5.8, sd: 2.8, fmt: 'n1', hi: true },
        { label: 'Service games held', base: 77, sd: 7, fmt: 'pct0', hi: true }, { label: 'Return games won', base: 24, sd: 6, fmt: 'pct0', hi: true },
        { label: 'Double faults / match', base: 3.1, sd: 1.2, fmt: 'n1', hi: false }, { label: 'Tiebreak win %', base: 50, sd: 14, fmt: 'pct0', hi: true }
      ],
      venues: ['Brescia', 'Lyon', 'Cagliari', 'Lima', 'Pune', 'Montevideo', 'Rovereto', 'Sassuolo', 'Ho Chi Minh City', 'Orleans', 'Antalya', 'Santiago'], surfaces: ['Clay', 'Hard', 'Indoor Hard', 'Clay'], rounds: ['R32', 'R16', 'QF', 'SF', 'F'] },

    { key: 'wta', group: 'Tennis', name: 'WTA Tour', short: 'WTA', kind: 'ind', photo: 'tennis-wta', icon: 'tennis', n: 8,
      leagues: ['WTA 250', 'WTA 500', 'WTA 1000'], books: TEN.filter(b => b !== 'dfb'), rating: [1800, 140],
      spread: { label: 'Game Spread', unit: 'games', sd: 5.0 }, total: { label: 'Total Games', mu: 20.9, sd: 4.0, tilt: 0.8 },
      markets: [
        { key: 'aces', label: 'Aces', dist: 'pois', mu: [1.2, 4.6], step: 1 },
        { key: 'dfs', label: 'Double Faults', dist: 'norm', mu: [2.6, 6.2], sdf: m => Math.max(1.5, m * 0.5), step: 1 },
        { key: 'gw', label: 'Games Won', dist: 'games', step: 1 }
      ],
      stats: [
        { label: '1st serve %', base: 62, sd: 4, fmt: 'pct0', hi: true }, { label: 'Aces / match', base: 3.1, sd: 1.8, fmt: 'n1', hi: true },
        { label: 'Service games held', base: 66, sd: 8, fmt: 'pct0', hi: true }, { label: 'Return games won', base: 36, sd: 7, fmt: 'pct0', hi: true },
        { label: 'Double faults / match', base: 4.2, sd: 1.5, fmt: 'n1', hi: false }, { label: 'Break points converted', base: 45, sd: 6, fmt: 'pct0', hi: true }
      ],
      venues: ['Linz', 'Ningbo', 'Tokyo', 'Hong Kong', 'Seoul', 'Guadalajara', 'Merida', 'Osaka'], surfaces: ['Hard', 'Indoor Hard', 'Hard', 'Clay'], rounds: ['R32', 'R16', 'QF', 'SF', 'F'] },

    { key: 'cricket', group: 'Cricket', name: 'Cricket (T20)', short: 'CRIC', kind: 'team', photo: 'cricket', icon: 'cricket', n: 6,
      leagues: ['T20 International', 'Big Bash League', 'SA20', 'Caribbean Premier League'], books: ['pin', 'b365', 'btw', 'unib', 'bfx', 'stk', 'dfb'], rating: [1500, 90], homeAdv: 0.03,
      spread: { label: 'Run Handicap', unit: 'runs', sd: 31 }, total: { label: 'Match Total Runs', mu: 331, sd: 28, tilt: 6 },
      stats: [
        { label: 'Batting avg (T20)', base: 27, sd: 4, fmt: 'n1', hi: true }, { label: 'Strike rate', base: 137, sd: 11, fmt: 'n0', hi: true },
        { label: 'Powerplay run rate', base: 8.3, sd: 0.9, fmt: 'n1', hi: true }, { label: 'Death-over economy', base: 9.6, sd: 1, fmt: 'n1', hi: false },
        { label: 'Sixes / match', base: 9.2, sd: 2.6, fmt: 'n1', hi: true }, { label: 'Win % (last 20)', base: 50, sd: 14, fmt: 'pct0', hi: true }
      ],
      venues: ['Wankhede Stadium', 'MCG', 'SCG', 'Newlands', 'Kensington Oval', 'Gaddafi Stadium', 'Eden Gardens', 'Optus Stadium'] },

    { key: 'darts', group: 'Darts', name: 'Darts (PDC)', short: 'DARTS', kind: 'ind', photo: 'darts', icon: 'darts', n: 8,
      leagues: ['Premier League', 'European Tour', 'Players Championship', 'World Series'], books: ['pin', 'b365', 'btw', 'unib', 'bfx', 'stk'], rating: [1650, 140],
      spread: { label: 'Leg Handicap', unit: 'legs', sd: 2.9 }, total: { label: 'Total Legs', mu: 10, sd: 2.1, tilt: 0.6 },
      markets: [
        { key: '180s', label: '180s', dist: 'pois', mu: [1.2, 3.8], step: 1 },
        { key: 'avg', label: '3-Dart Average', dist: 'cont', mu: [88, 102], sdf: () => 5.4, step: 1 },
        { key: 'hco', label: 'Highest Checkout', dist: 'norm', mu: [78, 118], sdf: () => 30, step: 5 }
      ],
      stats: [
        { label: '3-dart average', base: 94, sd: 4.2, fmt: 'n1', hi: true }, { label: 'First-9 average', base: 101, sd: 4.5, fmt: 'n1', hi: true },
        { label: 'Checkout %', base: 41, sd: 4.5, fmt: 'pct0', hi: true }, { label: '180s / leg', base: 0.24, sd: 0.06, fmt: 'n2', hi: true },
        { label: 'Legs won %', base: 50, sd: 8, fmt: 'pct0', hi: true }, { label: 'Deciding-leg win %', base: 50, sd: 12, fmt: 'pct0', hi: true }
      ],
      venues: ['Alexandra Palace', 'Utilita Arena', 'Ahoy Rotterdam', 'Westfalenhalle', 'Morningside Arena', 'M&S Bank Arena', 'Mattioli Arena', 'Brighton Centre'], rounds: ['R1', 'R2', 'QF', 'SF', 'Final'] },

    { key: 'cs2', group: 'Esports', name: 'Counter-Strike 2', short: 'CS2', kind: 'team', photo: 'esports-stage', icon: 'esports', n: 6, esport: true,
      leagues: ['BLAST Premier', 'ESL Pro League', 'IEM', 'PGL'], books: ['pin', 'b365', 'btw', 'unib', 'stk', 'bvd'], rating: [1600, 120], homeAdv: 0,
      markets: [
        { key: 'kills', label: 'Kills (Maps 1+2)', dist: 'norm', mu: [27, 37], sdf: () => 6.6, step: 1 },
        { key: 'hs', label: 'Headshots (Maps 1+2)', dist: 'norm', mu: [11, 19], sdf: () => 4.4, step: 1 }
      ],
      stats: [
        { label: 'Map win % (90d)', base: 52, sd: 9, fmt: 'pct0', hi: true }, { label: 'Team rating 2.0', base: 1.04, sd: 0.07, fmt: 'n2', hi: true },
        { label: 'Pistol round win %', base: 50, sd: 8, fmt: 'pct0', hi: true }, { label: 'Opening duel win %', base: 50, sd: 4, fmt: 'pct0', hi: true },
        { label: 'Clutch win %', base: 14, sd: 4, fmt: 'pct0', hi: true }, { label: 'Avg round diff / map', base: 0.8, sd: 2.4, fmt: 'sgn1', hi: true }
      ],
      venues: ['LAN — Copenhagen', 'LAN — Cologne', 'Online (EU)', 'LAN — Austin', 'LAN — Budapest'], rounds: ['Group', 'Group', 'Bracket', 'Quarterfinal', 'Semifinal'] },

    { key: 'lol', group: 'Esports', name: 'League of Legends', short: 'LoL', kind: 'team', photo: 'esports-crowd', icon: 'esports', n: 5, esport: true,
      leagues: ['LCK', 'LPL', 'LEC', 'LCS'], books: ['pin', 'b365', 'btw', 'unib', 'stk', 'bvd'], rating: [1580, 130], homeAdv: 0,
      markets: [
        { key: 'kills', label: 'Kills (Maps 1+2)', dist: 'norm', mu: [3.5, 11], sdf: m => Math.max(2, m * 0.5), step: 1 },
        { key: 'assists', label: 'Assists (Maps 1+2)', dist: 'norm', mu: [8, 20], sdf: m => Math.max(3, m * 0.36), step: 1 }
      ],
      stats: [
        { label: 'Game win % (90d)', base: 52, sd: 12, fmt: 'pct0', hi: true }, { label: 'Avg game time (min)', base: 31.8, sd: 1.6, fmt: 'n1', hi: false },
        { label: 'First blood %', base: 50, sd: 8, fmt: 'pct0', hi: true }, { label: 'Dragon control %', base: 52, sd: 7, fmt: 'pct0', hi: true },
        { label: 'Gold diff @15', base: 120, sd: 380, fmt: 'sgn0', hi: true }, { label: 'Kills / game', base: 15.4, sd: 2.6, fmt: 'n1', hi: true }
      ],
      venues: ['LoL Park — Seoul', 'Shanghai Studio', 'Berlin Studio', 'Los Angeles Studio'], rounds: ['Week 3', 'Week 4', 'Week 5', 'Playoffs'] },

    { key: 'dota', group: 'Esports', name: 'Dota 2', short: 'DOTA', kind: 'team', photo: 'esports-crowd', icon: 'esports', n: 4, esport: true,
      leagues: ['DreamLeague', 'ESL One', 'BLAST Slam'], books: ['pin', 'b365', 'btw', 'unib', 'stk', 'bvd'], rating: [1560, 120], homeAdv: 0,
      markets: [
        { key: 'kills', label: 'Kills (Maps 1+2)', dist: 'norm', mu: [8, 22], sdf: m => Math.max(3, m * 0.34), step: 1 },
        { key: 'assists', label: 'Assists (Maps 1+2)', dist: 'norm', mu: [16, 36], sdf: m => Math.max(4, m * 0.3), step: 1 }
      ],
      stats: [
        { label: 'Game win % (90d)', base: 52, sd: 11, fmt: 'pct0', hi: true }, { label: 'Avg game length (min)', base: 37.4, sd: 2.8, fmt: 'n1', hi: false },
        { label: 'First blood %', base: 50, sd: 8, fmt: 'pct0', hi: true }, { label: 'Roshan control %', base: 51, sd: 8, fmt: 'pct0', hi: true },
        { label: 'Net worth lead @10', base: 90, sd: 520, fmt: 'sgn0', hi: true }, { label: 'Kills / game', base: 49, sd: 6, fmt: 'n1', hi: true }
      ],
      venues: ['Online (EU)', 'LAN — Stockholm', 'LAN — Riyadh', 'Online (SEA)'], rounds: ['Group', 'Group', 'Playoffs', 'Playoffs'] },

    { key: 'val', group: 'Esports', name: 'Valorant', short: 'VAL', kind: 'team', photo: 'esports-stage', icon: 'esports', n: 5, esport: true,
      leagues: ['VCT Pacific', 'VCT EMEA', 'VCT Americas', 'Challengers'], books: ['pin', 'b365', 'btw', 'unib', 'stk', 'bvd'], rating: [1580, 120], homeAdv: 0,
      markets: [
        { key: 'kills', label: 'Kills (Maps 1+2)', dist: 'norm', mu: [27, 38], sdf: () => 6.8, step: 1 },
        { key: 'assists', label: 'Assists (Maps 1+2)', dist: 'norm', mu: [9, 16], sdf: () => 3.6, step: 1 }
      ],
      stats: [
        { label: 'Map win % (90d)', base: 52, sd: 10, fmt: 'pct0', hi: true }, { label: 'Attack round win %', base: 48, sd: 4, fmt: 'pct0', hi: true },
        { label: 'Defense round win %', base: 52, sd: 4, fmt: 'pct0', hi: true }, { label: 'Pistol round win %', base: 50, sd: 8, fmt: 'pct0', hi: true },
        { label: 'Clutch rate', base: 13, sd: 4, fmt: 'pct0', hi: true }, { label: 'Avg round diff / map', base: 0.6, sd: 2.6, fmt: 'sgn1', hi: true }
      ],
      venues: ['VCT Studio — Seoul', 'VCT Studio — Berlin', 'Online', 'LAN — Sao Paulo'], rounds: ['Stage 1', 'Stage 2', 'Playoffs'] },

    { key: 'rl', group: 'Esports', name: 'Rocket League', short: 'RL', kind: 'team', photo: 'esports-crowd', icon: 'esports', n: 3, esport: true,
      leagues: ['RLCS Regional', 'RLCS Major'], books: ['pin', 'b365', 'btw', 'unib', 'stk'], rating: [1540, 100], homeAdv: 0,
      markets: [
        { key: 'goals', label: 'Goals (Series)', dist: 'pois', mu: [2.2, 4.4], step: 1 },
        { key: 'saves', label: 'Saves (Series)', dist: 'norm', mu: [4.4, 8.6], sdf: m => Math.max(1.8, m * 0.34), step: 1 }
      ],
      stats: [
        { label: 'Series win % (90d)', base: 52, sd: 12, fmt: 'pct0', hi: true }, { label: 'Goals / game', base: 2.9, sd: 0.4, fmt: 'n1', hi: true },
        { label: 'Shots / game', base: 8.1, sd: 1, fmt: 'n1', hi: true }, { label: 'Save %', base: 44, sd: 5, fmt: 'pct0', hi: true },
        { label: 'Boost / minute', base: 380, sd: 28, fmt: 'n0', hi: true }, { label: 'Overtime win %', base: 50, sd: 12, fmt: 'pct0', hi: true }
      ],
      venues: ['Online', 'LAN — Paris', 'LAN — Dallas'], rounds: ['Swiss R3', 'Swiss R4', 'Bracket'] },

    { key: 'npb', group: 'Baseball', name: 'NPB', short: 'NPB', kind: 'team', photo: 'npb', icon: 'baseball', n: 6,
      leagues: ['Central League', 'Pacific League'], books: ['pin', 'b365', 'btw', 'unib', 'bvd', 'stk'], rating: [1500, 60], homeAdv: 0.035,
      spread: { label: 'Run Line', unit: 'runs', sd: 3.9 }, total: { label: 'Total Runs', mu: 7.6, sd: 3.2, tilt: 0.5 },
      markets: [
        { key: 'ks', label: 'Strikeouts', dist: 'pois', mu: [3.6, 7.6], step: 1, role: 'P' },
        { key: 'outs', label: 'Outs Recorded', dist: 'norm', mu: [14.5, 20.5], sdf: () => 3.6, step: 1, role: 'P' },
        { key: 'ha', label: 'Hits Allowed', dist: 'pois', mu: [4.6, 6.8], step: 1, role: 'P' },
        { key: 'hits', label: 'Hits', dist: 'pois', mu: [0.72, 1.12], step: 1, role: 'B' },
        { key: 'tb', label: 'Total Bases', dist: 'pois', mu: [1.1, 1.9], step: 1, role: 'B' }
      ],
      stats: [
        { label: 'Runs / game', base: 3.7, sd: 0.4, fmt: 'n2', hi: true }, { label: 'Runs allowed / game', base: 3.7, sd: 0.4, fmt: 'n2', hi: false },
        { label: 'Team OPS', base: 0.69, sd: 0.04, fmt: 'n3', hi: true }, { label: 'Starter ERA', base: 3.35, sd: 0.55, fmt: 'n2', hi: false },
        { label: 'Bullpen ERA', base: 3.2, sd: 0.55, fmt: 'n2', hi: false }, { label: 'Win % (last 10)', base: 50, sd: 16, fmt: 'pct0', hi: true }
      ] },

    { key: 'kbo', group: 'Baseball', name: 'KBO League', short: 'KBO', kind: 'team', photo: 'kbo', icon: 'baseball', n: 5,
      leagues: ['KBO League'], books: ['pin', 'b365', 'btw', 'unib', 'bvd', 'stk'], rating: [1500, 60], homeAdv: 0.035,
      spread: { label: 'Run Line', unit: 'runs', sd: 4.3 }, total: { label: 'Total Runs', mu: 9.5, sd: 3.7, tilt: 0.6 },
      markets: [
        { key: 'ks', label: 'Strikeouts', dist: 'pois', mu: [3.8, 7.4], step: 1, role: 'P' },
        { key: 'outs', label: 'Outs Recorded', dist: 'norm', mu: [14, 20], sdf: () => 3.8, step: 1, role: 'P' },
        { key: 'ha', label: 'Hits Allowed', dist: 'pois', mu: [5.2, 7.4], step: 1, role: 'P' },
        { key: 'hits', label: 'Hits', dist: 'pois', mu: [0.78, 1.18], step: 1, role: 'B' },
        { key: 'tb', label: 'Total Bases', dist: 'pois', mu: [1.2, 2.1], step: 1, role: 'B' }
      ],
      stats: [
        { label: 'Runs / game', base: 5.0, sd: 0.5, fmt: 'n2', hi: true }, { label: 'Runs allowed / game', base: 5.0, sd: 0.5, fmt: 'n2', hi: false },
        { label: 'Team OPS', base: 0.75, sd: 0.04, fmt: 'n3', hi: true }, { label: 'Starter ERA', base: 4.4, sd: 0.7, fmt: 'n2', hi: false },
        { label: 'Bullpen ERA', base: 4.5, sd: 0.7, fmt: 'n2', hi: false }, { label: 'Win % (last 10)', base: 50, sd: 16, fmt: 'pct0', hi: true }
      ] },

    { key: 'golf', group: 'Golf', name: 'Golf', short: 'GOLF', kind: 'ind', photo: 'golf', icon: 'golf', n: 9,
      leagues: ['PGA Tour', 'DP World Tour', 'PGA Tour Champions'], books: ['pin', 'b365', 'btw', 'unib', 'dk', 'fd', 'mgm', 'bvd', 'stk'], rating: [1500, 110],
      spread: { label: 'Stroke Spread', unit: 'strokes', sd: 3.3 }, total: { label: 'Combined Score', mu: 141, sd: 4.4, tilt: 0.8 },
      markets: [
        { key: 'score', label: 'Round Score', dist: 'norm', mu: [68.6, 71.8], sdf: () => 2.7, step: 1 },
        { key: 'birdies', label: 'Birdies or Better', dist: 'norm', mu: [3.4, 5.6], sdf: () => 1.65, step: 1 },
        { key: 'bogeys', label: 'Bogeys or Worse', dist: 'norm', mu: [1.2, 3.1], sdf: () => 1.4, step: 1 }
      ],
      stats: [
        { label: 'Scoring average', base: 70.4, sd: 0.9, fmt: 'n1', hi: false }, { label: 'Birdies / round', base: 4.2, sd: 0.5, fmt: 'n1', hi: true },
        { label: 'SG: Tee-to-green', base: 0.4, sd: 0.8, fmt: 'sgn2', hi: true }, { label: 'Greens in regulation', base: 68, sd: 3, fmt: 'pct0', hi: true },
        { label: 'Putts / round', base: 28.9, sd: 0.8, fmt: 'n1', hi: false }, { label: 'Scrambling', base: 59, sd: 4, fmt: 'pct0', hi: true }
      ],
      venues: ['TPC Southwind', 'Valderrama', 'Kapalua', 'Wentworth', 'Sedgefield', 'Le Golf National', 'Muirfield Village'], rounds: ['Round 1', 'Round 2', 'Round 3', 'Round 4'] }
  ];
  D.SPORT = {}; D.SPORTS.forEach(s => { D.SPORT[s.key] = s; });
  D.GROUPS = ['Tennis', 'Cricket', 'Darts', 'Esports', 'Baseball', 'Golf'];

  /* ---------------- Name pools (invented composites) ---------------- */
  D.NAMES = {
    ES: { f: ['Mateo', 'Iker', 'Dario', 'Joan', 'Hugo', 'Alvaro', 'Nico', 'Raul', 'Lucas', 'Pau', 'Sergio', 'Adrian', 'Marc', 'Ivan'], l: ['Villaseca', 'Montalban', 'Ferrandis', 'Olmedo', 'Quintela', 'Barrachina', 'Serrano', 'Lozoya', 'Echeverri', 'Casals', 'Taboada', 'Arrieta', 'Navarrete', 'Zubiri'] },
    FR: { f: ['Theo', 'Lucien', 'Maxime', 'Axel', 'Remi', 'Baptiste', 'Quentin', 'Yanis', 'Hector', 'Loic'], l: ['Delaunay', 'Marchetti', 'Rousselet', 'Vauclair', 'Bellamy', 'Fontaine', 'Lacombe', 'Perrault', 'Girardet', 'Montclar'] },
    IT: { f: ['Matteo', 'Luca', 'Gianni', 'Tommaso', 'Edoardo', 'Fabio', 'Riccardo', 'Leo', 'Enzo', 'Samuele'], l: ['Ferraresi', 'Bellandi', 'Cortesi', 'Montanari', 'Gallinari', 'Scalabrini', 'Pedrotti', 'Vitale', 'Brambilla', 'Sorrentino'] },
    DE: { f: ['Jonas', 'Felix', 'Lennart', 'Tim', 'Moritz', 'Jannik', 'Florian', 'Niklas', 'Kai', 'Dominik'], l: ['Kessler', 'Brandauer', 'Hollmann', 'Reinhardt', 'Falkner', 'Westerhoff', 'Ruprecht', 'Lindqvist', 'Obermayer', 'Strohm'] },
    AR: { f: ['Tomas', 'Facundo', 'Santiago', 'Bruno', 'Agustin', 'Nahuel', 'Franco', 'Lautaro'], l: ['Pellegrini', 'Escudero', 'Lagos', 'Carbajal', 'Ibarra', 'Mansilla', 'Bustos', 'Rinaldi'] },
    US: { f: ['Cole', 'Brandon', 'Tyler', 'Mason', 'Garrett', 'Logan', 'Hunter', 'Wyatt', 'Dylan', 'Austin'], l: ['Whitlock', 'Prescott', 'Hargrove', 'McAllister', 'Dunbar', 'Kincaid', 'Ellery', 'Thackeray', 'Rowland', 'Sutter'] },
    GB: { f: ['Callum', 'Jamie', 'Harvey', 'Ollie', 'Reece', 'Dean', 'Lewis', 'Connor', 'Ryan', 'Josh'], l: ['Ashworth', 'Pemberton', 'Kirkby', 'Hallam', 'Redfern', 'Stannard', 'Whittaker', 'Gadsby', 'Thornley', 'Cartwright'] },
    AU: { f: ['Jack', 'Lachlan', 'Riley', 'Mitch', 'Hamish', 'Brodie', 'Callan', 'Tane', 'Flynn', 'Zac'], l: ['Cranston', 'Mulgrave', 'Treloar', 'Hendry', 'Pascoe', 'Kellaway', 'Dunstan', 'Harcourt', 'Bellchambers', 'Raymond'] },
    JP: { f: ['Haruto', 'Ren', 'Sota', 'Kaito', 'Yuto', 'Daiki', 'Takumi', 'Ryota', 'Shun', 'Kenji', 'Taiga', 'Hiroki'], l: ['Aizawa', 'Fujimura', 'Kitagawa', 'Matsuoka', 'Nakahara', 'Ohtsuka', 'Sakurai', 'Tomizawa', 'Uchiyama', 'Yamabe', 'Hasegawa', 'Mizuno'] },
    KR: { f: ['Min-jun', 'Seo-jin', 'Ji-ho', 'Hyun-woo', 'Dong-hyun', 'Tae-yang', 'Joon-seo', 'Sung-min', 'Jae-won', 'Woo-jin', 'Eun-seok'], l: ['Baek', 'Ryu', 'Shin', 'Han', 'Moon', 'Yoon', 'Jung', 'Oh', 'Bae', 'Seong', 'Gwon'] },
    CZ: { f: ['Tomas', 'Vojtech', 'Matej', 'Jakub', 'Ondrej', 'Filip'], l: ['Kopecky', 'Hruby', 'Zelenka', 'Dvorsky', 'Machacek', 'Blazek'] },
    RS: { f: ['Luka', 'Nemanja', 'Stefan', 'Marko', 'Viktor', 'Dusan'], l: ['Petrovic', 'Radanovic', 'Jovicevic', 'Lukovic', 'Stankovic', 'Milenkovic'] },
    NL: { f: ['Daan', 'Sven', 'Ruben', 'Bram', 'Stijn', 'Mees', 'Joost', 'Wessel'], l: ['van Roosmalen', 'de Kuiper', 'Visscher', 'Hoogland', 'van der Meij', 'Brouwers', 'Zwaan', 'Oosterbeek'] },
    PL: { f: ['Kacper', 'Bartosz', 'Mikolaj', 'Szymon', 'Pawel'], l: ['Wrobel', 'Kaminski', 'Sobczak', 'Lisowski', 'Gorecki'] },
    SE: { f: ['Axel', 'Emil', 'Viggo', 'Linus', 'Elias'], l: ['Bergstrom', 'Lindahl', 'Ekdahl', 'Nordin', 'Sjoberg'] },
    CA: { f: ['Liam', 'Noah', 'Ethan', 'Gabriel', 'Owen'], l: ['Beaulieu', 'MacRae', 'Tremblay-Cole', 'Fenwick', 'Ouellet'] },
    CL: { f: ['Matias', 'Benjamin', 'Cristobal', 'Vicente'], l: ['Aravena', 'Concha', 'Valdivia', 'Sepulveda'] },
    IN: { f: ['Arjun', 'Rohan', 'Vikram', 'Kabir', 'Ishaan', 'Nikhil', 'Siddharth', 'Karthik', 'Dev', 'Aarav', 'Tanmay', 'Yash'], l: ['Chaudhary', 'Naidu', 'Bhandari', 'Deshpande', 'Rawat', 'Kulkarni', 'Mallick', 'Trivedi', 'Sethi', 'Pillai', 'Joshi', 'Banerjee'] },
    PK: { f: ['Hamza', 'Faisal', 'Zubair', 'Imran', 'Saad', 'Adnan', 'Shahzaib', 'Rizwan', 'Talha'], l: ['Qureshi', 'Awan', 'Bhatti', 'Siddiqui', 'Mirza', 'Chishti', 'Gilani', 'Khattak', 'Rehmani'] },
    LK: { f: ['Dilshan', 'Kusal', 'Pathum', 'Nuwan', 'Chamara', 'Lahiru', 'Asitha', 'Minod'], l: ['Wickrama', 'Jayasundera', 'Gunathilake', 'Ratnayake', 'Samarasinghe', 'Abeysekera', 'Dissanayake', 'Perera-Silva'] },
    ZA: { f: ['Pieter', 'Dewald', 'Ruan', 'Keegan', 'Wian', 'Tristan', 'Jandre', 'Sipho', 'Themba'], l: ['van Staden', 'Botha-Grey', 'Engelbrecht', 'Pretorius', 'Mokoena', 'Steyn-Louw', 'Ndlovu', 'Visagie', 'Malan'] },
    WI: { f: ['Shamar', 'Kemar', 'Jaden', 'Nicholas', 'Akeem', 'Romario', 'Keon', 'Obed', 'Alzarri'], l: ['Bascombe', 'Gittens', 'Hinds-Walker', 'Cottrell', 'Ramsaran', 'Haynesworth', 'Pinder', 'Lashley', 'Thomasos'] },
    BD: { f: ['Tanvir', 'Mahmudul', 'Rakib', 'Shadman', 'Arif', 'Nasum'], l: ['Hossain', 'Chowdhury', 'Sarkar', 'Talukder', 'Mondal', 'Bhuiyan'] },
    EN: { f: ['Harry', 'Ollie', 'Sam', 'Zak', 'Jordan', 'Liam', 'Ben', 'Tom', 'Will', 'Jofra'], l: ['Ravenscroft', 'Hollingworth', 'Brearley', 'Whitehouse', 'Pickersgill', 'Tattersall', 'Duckworth', 'Mortimer', 'Aldcroft'] }
  };
  D.COUNTRIES = ['ES', 'FR', 'IT', 'DE', 'AR', 'US', 'GB', 'AU', 'JP', 'KR', 'CZ', 'RS', 'NL', 'PL', 'SE', 'CA', 'CL'];
  // weighted nationality draws per individual sport
  D.NAT_WEIGHTS = {
    atp: { ES: 5, FR: 4, IT: 5, DE: 4, AR: 3, US: 4, GB: 2, AU: 3, JP: 1, CZ: 2, RS: 2, PL: 1, SE: 1, CA: 2, CL: 1 },
    chal: { ES: 6, FR: 5, IT: 6, DE: 3, AR: 5, US: 3, GB: 2, AU: 2, JP: 3, KR: 1, CZ: 2, RS: 2, PL: 2, CL: 3, CA: 1 },
    wta: { ES: 3, FR: 3, IT: 4, DE: 3, US: 4, GB: 2, AU: 2, JP: 2, CZ: 4, PL: 3, SE: 1, CA: 2, RS: 1, KR: 1 },
    darts: { GB: 12, NL: 6, DE: 2, AU: 1, PL: 1, SE: 1, CA: 1 },
    golf: { US: 8, GB: 3, AU: 2, JP: 2, KR: 2, SE: 1, ES: 2, CA: 1, DE: 1, AR: 1, CL: 1 }
  };

  // esports handles (invented)
  D.HANDLES = ['Vexar', 'Nyx', 'Kairo', 'Zephyr', 'Drako', 'Mirage', 'Quill', 'Rune', 'Flux', 'Ashen', 'Tyrix', 'Bolt', 'Karma', 'Seren', 'Wraith', 'Cipher', 'Hexa', 'Lumen', 'Orbit', 'Pyro', 'Razor', 'Sable', 'Talon', 'Umbra', 'Vortex', 'Warden', 'Xeno', 'Yuki', 'Zenith', 'Ember', 'Frost', 'Glitch', 'Havoc', 'Iris', 'Jinx', 'Kite', 'Lynx', 'Mako', 'Nomad', 'Onyx', 'Pike', 'Quartz', 'Rift', 'Sprout', 'Torque', 'Ultra', 'Vanta', 'Whisp', 'Xylo', 'Yeti', 'Zorn', 'Atlas', 'Blitz', 'Crux', 'Dusk', 'Echo', 'Fable', 'Gale', 'Halo', 'Ion', 'Jolt', 'Koda', 'Lazer', 'Mythic', 'Neon', 'Oryx', 'Prism', 'Quasar', 'Rogue', 'Stryke', 'Tempo', 'Unity', 'Venom', 'Wisp', 'Xander', 'Yonder', 'Zeal', 'Apex', 'Bravo', 'Comet', 'Delta', 'Eclipse', 'Fury', 'Ghost', 'Hydra', 'Ignis', 'Jade', 'Kryo', 'Lotus', 'Moxie', 'Nova', 'Opal', 'Pixel', 'Quake', 'Rapid', 'Spark', 'Titan', 'Ursa', 'Viper', 'Wolfe', 'Xion', 'Yarn', 'Zero', 'Aero', 'Bishop', 'Cobra', 'Dagger', 'Edge', 'Falken', 'Grim', 'Hawk', 'Ivory', 'Jester', 'Knox', 'Legion', 'Mirth', 'Nitro', 'Omen', 'Phantom', 'Quiver', 'Reaper', 'Shade', 'Thorn'];

  /* ---------------- Teams ---------------- */
  // [name, short, nat/pool, league, rating offset]
  D.TEAMS = {
    npb: [
      ['Yomiuri Giants', 'YOM', 'JP', 'Central League', 40], ['Hanshin Tigers', 'HAN', 'JP', 'Central League', 50], ['Yokohama DeNA BayStars', 'DNA', 'JP', 'Central League', 20],
      ['Hiroshima Toyo Carp', 'HIR', 'JP', 'Central League', 5], ['Chunichi Dragons', 'CHU', 'JP', 'Central League', -35], ['Tokyo Yakult Swallows', 'YAK', 'JP', 'Central League', -30],
      ['Fukuoka SoftBank Hawks', 'SBH', 'JP', 'Pacific League', 70], ['Chiba Lotte Marines', 'LOT', 'JP', 'Pacific League', 10], ['Orix Buffaloes', 'ORX', 'JP', 'Pacific League', 45],
      ['Tohoku Rakuten Golden Eagles', 'RAK', 'JP', 'Pacific League', -5], ['Saitama Seibu Lions', 'SEI', 'JP', 'Pacific League', -40], ['Hokkaido Nippon-Ham Fighters', 'NHF', 'JP', 'Pacific League', 15]
    ],
    kbo: [
      ['Doosan Bears', 'DOO', 'KR', 'KBO League', 10], ['LG Twins', 'LGT', 'KR', 'KBO League', 55], ['Kiwoom Heroes', 'KIW', 'KR', 'KBO League', -40], ['KT Wiz', 'KTW', 'KR', 'KBO League', 20],
      ['SSG Landers', 'SSG', 'KR', 'KBO League', 30], ['NC Dinos', 'NCD', 'KR', 'KBO League', 5], ['Hanwha Eagles', 'HAE', 'KR', 'KBO League', -10], ['Samsung Lions', 'SAM', 'KR', 'KBO League', 35],
      ['Lotte Giants', 'LTG', 'KR', 'KBO League', -15], ['KIA Tigers', 'KIA', 'KR', 'KBO League', 60]
    ],
    cricket: [
      ['India', 'IND', 'IN', 'T20 International', 90], ['Australia', 'AUS', 'AU', 'T20 International', 70], ['England', 'ENG', 'EN', 'T20 International', 55], ['South Africa', 'RSA', 'ZA', 'T20 International', 40],
      ['New Zealand', 'NZL', 'EN', 'T20 International', 35], ['Pakistan', 'PAK', 'PK', 'T20 International', 20], ['Sri Lanka', 'SRI', 'LK', 'T20 International', -10], ['West Indies', 'WIN', 'WI', 'T20 International', 5],
      ['Bangladesh', 'BAN', 'BD', 'T20 International', -30], ['Afghanistan', 'AFG', 'PK', 'T20 International', -5],
      ['Sydney Sixers', 'SYS', 'AU', 'Big Bash League', 25], ['Melbourne Stars', 'MLS', 'AU', 'Big Bash League', 5], ['Perth Scorchers', 'PRS', 'AU', 'Big Bash League', 40], ['Brisbane Heat', 'BRH', 'AU', 'Big Bash League', 0],
      ['Adelaide Strikers', 'ADS', 'AU', 'Big Bash League', 10], ['Hobart Hurricanes', 'HBH', 'AU', 'Big Bash League', -5], ['Melbourne Renegades', 'MLR', 'AU', 'Big Bash League', -20], ['Sydney Thunder', 'SYT', 'AU', 'Big Bash League', -25],
      ['MI Cape Town', 'MIC', 'ZA', 'SA20', 30], ['Joburg Super Kings', 'JSK', 'ZA', 'SA20', 15], ['Pretoria Capitals', 'PRC', 'ZA', 'SA20', 20], ['Paarl Royals', 'PAR', 'ZA', 'SA20', -5], ['Durban Super Giants', 'DSG', 'ZA', 'SA20', 0], ['Sunrisers Eastern Cape', 'SEC', 'ZA', 'SA20', 35],
      ['Trinbago Knight Riders', 'TKR', 'WI', 'Caribbean Premier League', 30], ['Barbados Royals', 'BAR', 'WI', 'Caribbean Premier League', 5], ['Guyana Amazon Warriors', 'GAW', 'WI', 'Caribbean Premier League', 10],
      ['Jamaica Tallawahs', 'JAM', 'WI', 'Caribbean Premier League', -10], ['St Kitts & Nevis Patriots', 'SKN', 'WI', 'Caribbean Premier League', -15], ['Saint Lucia Kings', 'SLK', 'WI', 'Caribbean Premier League', 0]
    ],
    cs2: [
      ['Natus Vincere', 'NAV', 'es', 'BLAST Premier', 80], ['FaZe Clan', 'FAZ', 'es', 'ESL Pro League', 60], ['G2 Esports', 'G2', 'es', 'IEM', 55], ['Team Vitality', 'VIT', 'es', 'BLAST Premier', 90],
      ['MOUZ', 'MOU', 'es', 'ESL Pro League', 50], ['Team Spirit', 'SPI', 'es', 'IEM', 65], ['Astralis', 'AST', 'es', 'PGL', -10], ['FURIA', 'FUR', 'es', 'PGL', 25], ['Heroic', 'HER', 'es', 'BLAST Premier', 5],
      ['Cloud9', 'C9', 'es', 'IEM', -5], ['Team Liquid', 'TL', 'es', 'ESL Pro League', 15], ['ENCE', 'ENC', 'es', 'PGL', -25], ['Falcons', 'FLC', 'es', 'BLAST Premier', 35], ['Eternal Fire', 'EF', 'es', 'ESL Pro League', -15]
    ],
    lol: [
      ['T1', 'T1', 'es', 'LCK', 90], ['Gen.G', 'GEN', 'es', 'LCK', 85], ['Hanwha Life Esports', 'HLE', 'es', 'LCK', 55], ['Dplus KIA', 'DK', 'es', 'LCK', 30], ['KT Rolster', 'KT', 'es', 'LCK', 0],
      ['Bilibili Gaming', 'BLG', 'es', 'LPL', 80], ['JD Gaming', 'JDG', 'es', 'LPL', 60], ['Top Esports', 'TES', 'es', 'LPL', 35], ['Weibo Gaming', 'WBG', 'es', 'LPL', 10], ['LNG Esports', 'LNG', 'es', 'LPL', -15],
      ['G2 Esports', 'G2', 'es', 'LEC', 45], ['Fnatic', 'FNC', 'es', 'LEC', 25], ['Karmine Corp', 'KC', 'es', 'LEC', 35], ['Team Vitality', 'VIT', 'es', 'LEC', -5], ['SK Gaming', 'SK', 'es', 'LEC', -30],
      ['Cloud9', 'C9', 'es', 'LCS', 15], ['Team Liquid', 'TL', 'es', 'LCS', 20], ['FlyQuest', 'FLY', 'es', 'LCS', 0], ['100 Thieves', '100T', 'es', 'LCS', -10]
    ],
    dota: [
      ['Team Falcons', 'FLC', 'es', 'DreamLeague', 80], ['Team Spirit', 'SPI', 'es', 'ESL One', 55], ['Tundra Esports', 'TUN', 'es', 'DreamLeague', 40], ['Gaimin Gladiators', 'GG', 'es', 'ESL One', 35],
      ['BetBoom Team', 'BB', 'es', 'BLAST Slam', 45], ['Xtreme Gaming', 'XG', 'es', 'DreamLeague', 25], ['Team Liquid', 'TL', 'es', 'ESL One', 30], ['Aurora Gaming', 'AUR', 'es', 'BLAST Slam', 5], ['PARIVISION', 'PAR', 'es', 'BLAST Slam', 20], ['Heroic', 'HER', 'es', 'DreamLeague', -15]
    ],
    val: [
      ['Paper Rex', 'PRX', 'es', 'VCT Pacific', 70], ['DRX', 'DRX', 'es', 'VCT Pacific', 40], ['Gen.G', 'GEN', 'es', 'VCT Pacific', 55], ['T1', 'T1', 'es', 'VCT Pacific', 30], ['Fnatic', 'FNC', 'es', 'VCT EMEA', 60],
      ['Team Heretics', 'TH', 'es', 'VCT EMEA', 45], ['Team Vitality', 'VIT', 'es', 'VCT EMEA', 25], ['G2 Esports', 'G2', 'es', 'VCT EMEA', 35], ['Sentinels', 'SEN', 'es', 'VCT Americas', 50], ['LOUD', 'LOUD', 'es', 'VCT Americas', 20],
      ['NRG', 'NRG', 'es', 'VCT Americas', 10], ['Cloud9', 'C9', 'es', 'VCT Americas', -10]
    ],
    rl: [
      ['Team Vitality', 'VIT', 'es', 'RLCS Major', 70], ['Karmine Corp', 'KC', 'es', 'RLCS Major', 55], ['Falcons', 'FLC', 'es', 'RLCS Major', 45], ['NRG', 'NRG', 'es', 'RLCS Regional', 50],
      ['G2 Esports', 'G2', 'es', 'RLCS Regional', 25], ['Spacestation', 'SSG', 'es', 'RLCS Regional', 5], ['FaZe Clan', 'FAZ', 'es', 'RLCS Major', 20], ['Team BDS', 'BDS', 'es', 'RLCS Regional', 15]
    ]
  };
  // venues for baseball home teams
  D.PARKS = {
    YOM: 'Tokyo Dome', HAN: 'Koshien Stadium', DNA: 'Yokohama Stadium', HIR: 'Mazda Stadium', CHU: 'Vantelin Dome', YAK: 'Meiji Jingu Stadium',
    SBH: 'Fukuoka PayPay Dome', LOT: 'ZOZO Marine Stadium', ORX: 'Kyocera Dome', RAK: 'Rakuten Seimei Park', SEI: 'Belluna Dome', NHF: 'Es Con Field',
    DOO: 'Jamsil Stadium', LGT: 'Jamsil Stadium', KIW: 'Gocheok Sky Dome', KTW: 'Suwon KT Wiz Park', SSG: 'Incheon Landers Field', NCD: 'Changwon NC Park',
    HAE: 'Daejeon Hanbat Stadium', SAM: 'Daegu Samsung Lions Park', LTG: 'Sajik Stadium', KIA: 'Gwangju-Kia Champions Field'
  };
})(window.NE);
