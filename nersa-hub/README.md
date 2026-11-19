# Regulatory Data Hub · market monitoring and surveillance prototype

A front-end prototype of the solution proposed in response to NERSA RFI
NERSA-2627-ELR-MMSP-BID011: a regulatory data hub and electricity market
surveillance platform for the Market Surveillance Unit, with an always-on
analyst agent on top.

It is a prototype of the experience. Nothing here calls a server: every
participant, price and record is synthetic, and every hand-off to another
system is simulated in the browser.

## Run it

```bash
python3 -m http.server 4173      # from the repository root
```

Open http://127.0.0.1:4173/nersa-hub/. It also opens straight from disk
(`index.html`), with no server.

## Deploy to Vercel

The folder is a static site with its own `vercel.json` (no build, `noindex`
header, long cache on fonts). With a Vercel token in `VERCEL_TOKEN`:

```bash
nersa-hub/tools/deploy-vercel.sh        # project nersa-ntell → nersa-ntell.vercel.app
```

Or import the repository in the Vercel dashboard with **Root Directory** set
to `nersa-hub`, framework preset **Other**, and no build command.

To hand it to someone as one file:

```bash
python3 nersa-hub/tools/bundle.py out/regulatory-data-hub.html
```

That inlines the styles, scripts and fonts into a single HTML file of about
680 kB.

## The story in the data

The evening of Tuesday 13 July 2027. Kestrel Power (fictional) declares unit
KST-2 on forced outage at 17:30 while its meter keeps reading about 545 MW,
and eight minutes earlier re-prices 343 MW to R 4 250/MWh. It is pivotal
(RSI 0.92), the margin is 4.1%, and the system price sits about three times
its norm for six intervals. The hub catches the contradiction, estimates the
cost to buyers at about R 179m, and takes it from alert to case to Board
figure. The app opens on the morning after, at 07:42 on Wednesday 14 July.

The numbers reconcile: the merit order in `js/data.js` clears at R 4 250 as
offered and R 1 380 with the unit available, and the cost figure is computed
from those two prices, not typed in.

## Pages

| Group | Page | What it shows |
|---|---|---|
| Workspace | Today | Morning brief, ranked priorities with the reasons for the ranking, data alerts, tonight's watch, clocks, approvals, pinned answers |
| | Ask | Questions in plain language, answered from certified datasets with the query, row count and checks shown |
| | Agent | Live activity, standing watches written in plain language, approvals, schedule, guardrails, performance |
| Monitor | Market Overview | Price, demand, margin, merit order and declarations by interval, live and replayed |
| | Surveillance | Alert queue scored on four dimensions, ten screen families, scoring and funnel |
| | Market Analytics | Four lenses on one event, plus market structure |
| | Participants | Register, risk rating, resources, alert and case history |
| | Operator Oversight | Platform conditions checked from the hub's own copy of the data |
| Enforce | Investigations | Case board, event replay, evidence bundle sealed with a real SHA-256, requests, decision |
| | Reports | Board view with drill-down to the raw record, library, report builder |
| Data | Data Operations | Thirteen sources, ingestion cycle, manual intake, document extraction |
| | Data Quality | Transform replay, rules, quarantine, reconciliation |
| | Data Hub | Three zones, twelve certified datasets, lineage trace |
| Govern | Market Code | Clause changes, clause-to-screen map, parameters in force |
| | Security | Twelve controls, four role views, audit log, residency |
| | Integrations | One alert sent through six systems |
| | RFI Coverage | Each scored criterion and Annexure 1 requirement, with the page that meets it |

The role selector in the top bar switches the whole application between
MSU analyst, Board member, Licensee and Auditor.

## Structure

```
index.html          Shell markup and script order
css/app.css         Design tokens and every component
js/core.js          Formatting, state, icons, components, overlays, router
js/data.js          The synthetic market
js/charts.js        SVG charts with a hover layer
js/agent.js         The agent: brief, worklist, watches, approvals, question engine
js/p-*.js           One file per navigation group
js/app.js           Navigation, top bar, role view, boot
tools/bundle.py     Single-file build
js/brand.js         ntell.ai icon, lockup and signal orb, inlined from /assets
assets/fonts/       Stack Sans, Newsreader and JetBrains Mono, copied from the site
```

No framework and no build step. Scripts are plain files loaded in order.

## Theme

The app wears the ntell.ai brand from the company site: ink `#17090C`,
crimson `#D7143C` and paper `#F4F4F6` on a white page, Stack Sans for
everything you read, Newsreader for the one statement at the top of the
brief, and the signal orb wherever the agent appears: its on-watch light, its
name beside every draft and answer, and the empty states. Every page carries
"Powered by ntell.ai". Plum `#5B2A6E` is
the quiet second colour for selection, citations and bars.

Red, amber and green are kept for status only and always come with a word
or a number: the status strip on Today, the dot on every KPI, alert scores,
feed and case states. In charts the measure is ink, the comparator is grey
and crimson marks the anomaly. Tokens sit at the top of `css/app.css`.

## Things to know

- The agent's name is set once, in `R.cfg.agent` at the top of `js/core.js`.
- What you do in the app (approvals, sealed bundle, resolved records, pinned
  answers) is kept in the browser's local storage so a demonstration can be
  repeated. The account menu, top right, has **Reset demonstration**.
- Answers on the Ask page are scripted for about ten questions and decline
  anything else, saying so. The shape of an answer is what matters here.
- Intervals are 30 minutes in this dataset. The draft Market Code defines a
  60-minute Trading Period; interval length is a parameter.
- Thresholds, clause numbers and KPIs are illustrative, to be calibrated with
  NERSA to the final Market Code.
- The page carries `noindex`. It is not linked from the company site.
