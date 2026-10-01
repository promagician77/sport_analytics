# The Closing Line — niche-sports analytics, as a daily form sheet

A clickable, fully working specimen of a sports data & analytics platform for **ATP Challenger, ATP, WTA, cricket, darts,
esports (CS2 · LoL · Dota 2 · Valorant · Rocket League), NPB, KBO and golf** — hit rates (L5 / L10 / L20 / H2H), moneylines,
spreads, totals, Pinnacle-devigged fair prices, +EV, arbitrage and closing-line value.

> **All odds, players, lines and results are simulated** (a strip on every screen says so). Team / league / sportsbook names
> are real labels used as placeholders; every individual player is invented. "The Closing Line" is a placeholder brand.

## Run it

No build step, no dependencies, no network access needed — fonts and images are bundled.

```bash
xdg-open index.html            # or just double-click it
python3 -m http.server 8080    # or serve the folder; routing is hash-based, so any static host works
```

## The design idea

Betting has its own printing tradition — the racing form, the tote board, the betting slip, the ledger, the adding-machine
receipt. Instead of a dashboard template, **every screen is one of those artifacts**:

| Screen | Route | Metaphor |
|---|---|---|
| Front page | `#/` | Newspaper masthead, lead story, sports section, classifieds (rates), corrections (FAQ) |
| **Front Page** (dashboard) | `#/app` | The paper's front page — one enormous number, a lead fixture plate, a "Best bets" box |
| **The Card** (props) | `#/app/props` | The racing form: ruled sheet, hit-rate gauges, selection column; click a row → torn-edge **dossier** with a draggable line |
| **The Board** (odds) | `#/app/odds` | A black tote board with **seven-segment amber LED prices** that flip when they change |
| **Edges** (+EV) | `#/app/ev` | Value sheet with rubber-stamped edge figures and Kelly stakes |
| **Crossings** (arbitrage) | `#/app/arbs` | Paired-leg tickets with a stamped profit figure |
| **Fixtures** | `#/app/events`, `#/app/event/:id` | Match programme — cover, probability gauge, tale of the tape, H2H, form |
| **The Ledger** (CLV) | `#/app/clv` | Accounting paper with a red margin, parenthesised losses, totals row; **bet slips** (perforated) |
| **The Workbench** (devig) | `#/app/calculator` | Paper form + an **adding-machine receipt** that prints as you type |
| **The Almanac** (reports) | `#/app/reports` | Margin heat-table, price accuracy, over/under bias, trend backtests |
| The Index, The Desk, Player file | `#/app/coverage`, `/settings`, `/player/:id` | Directory, preferences, dossier |

Signature details: photos are **live two-ink halftones** (black + spot red, drawn to canvas) that "develop" into the original on
hover; a **Wire** tape scrolls real edges and line moves along the bottom; **Day / Night editions**; odds formats American /
Decimal / Implied; keyboard-friendly rows; every chart has a Table view.

**Type:** Bodoni Moda (masthead), Big Shoulders Display (scoreboard headlines), Newsreader (reading text), Azeret Mono
(numerals), DSEG7 (tote-board digits). All SIL OFL, self-hosted in `assets/fonts/`.
**Charts** use a validated palette (blue / orange categorical; green / red hit–miss, always with ✓ / ✕ glyphs).

## How it's built

Plain HTML / CSS / JS (no framework, no bundler); charts are hand-written SVG.

```
index.html
assets/
  css/   fonts.css · base.css (design system) · shell.css · landing.css · pages.css
  js/
    core.js         seeded PRNG, odds conversion, devig (multiplicative / additive / power / Shin), EV, Kelly
    data-config.js  books, sports, markets, name pools, teams
    data-gen.js     DEMO data generator (events, quotes, props, game logs, H2H, form, CLV history) + EV / arb feeds + live tick
    halftone.js + tones.js   the two-ink photo plates
    charts.js · ui.js · app.js · pages/*.js
  fonts/ img/ (photos + credits.json)
```

## From specimen to production

The UI only reads the shapes produced by `data-gen.js`; replace that file with adapters over real feeds and the screens run unchanged:

- **Event** `{ id, sport, league, start, p:[a, b], mk:{ ml, spread, total }, props:[], h2h:[], form:[], stats:[] }`
- **Quote** `mk.<market>.q[bookKey] = { o:[side0Decimal, side1Decimal], line }` — Pinnacle (`pin`) is the sharp reference
- **Prop** `{ player, label, main, dist, mu, sd, q:{ book:{ line, o:[over, under] } }, log:[{v,d,opp,home}], h2h:[], hist:[] }`

Production data layer: odds ingestion per book → event/player matching → Postgres/Timescale (open/close lines power CLV) →
SSE/WebSocket push → this front-end (or a React/Next.js port) and a mobile app on the same API.

Maths (`core.js`): fair probability = Pinnacle price with margin removed (4 methods + worst-case); EV = `p × decimal − 1`;
Kelly = `(p·b − q)/b`; CLV = `bet decimal / no-vig closing decimal − 1`. Props priced at a different line than Pinnacle's are
line-adjusted along the player's distribution before EV is computed.

## Images & licensing

Photos are from **Wikimedia Commons** (CC BY / CC BY-SA / public domain) — credits in `assets/img/credits.json` and the site's
"Photo credits". Some show real people and sponsor branding, and CC BY-SA carries attribution/share-alike duties.
**Replace them with licensed or commissioned imagery before a commercial launch.**
