/* Regulatory Data Hub prototype · synthetic market.
   Every participant, price and record here is invented for demonstration.
   The evening of Tue 13 Jul 2027 carries the story: Kestrel Power declares
   KST-2 on forced outage at 17:30 while its meter keeps reading about 545 MW,
   re-prices 343 MW to R4 250/MWh and sets the system price for six intervals.
   Intervals are 30 minutes in this dataset; interval length is a model parameter. */
(function () {
  'use strict';
  var R = window.RDH, f = R.f, rnd = R.rng(20270713);
  var D = R.D = {};
  D.N = 48; D.EV = 37;                 // 18:30
  D.EV_FROM = 35; D.EV_TO = 40;        // 17:30 to 20:00, six intervals
  D.NOW = 15;                          // today, interval in progress (07:30)
  D.CAP = 5396.4;                      // market price cap, R/MWh (draft Market Code, Annexure 2)
  D.times = []; for (var i = 0; i < 48; i++) D.times.push(f.t(i));

  /* ---- demand: winter weekday shape, evening peak 26 140 MW ---- */
  var hourly = [19600, 19100, 18800, 18700, 19000, 20300, 22400, 23900, 24300, 23900, 23500, 23200, 22900, 22600, 22500, 22800, 23600, 24900, 25900, 25900, 25000, 23600, 21900, 20500, 19700];
  function shape(scale, seedNoise) {
    var out = [];
    for (var k = 0; k < 48; k++) {
      var h = Math.floor(k / 2), v = k % 2 ? (hourly[h] + hourly[h + 1]) / 2 : hourly[h];
      out.push(Math.round((v * scale + (seedNoise() - .5) * 110) / 10) * 10);
    }
    return out;
  }
  D.demand = shape(1, rnd);
  var fix = { 34: 24900, 35: 25400, 36: 25900, 37: 26140, 38: 25900, 39: 25450, 40: 25000 };
  for (var k in fix) D.demand[k] = fix[k];
  D.demandToday = shape(1.006, rnd);
  D.demandToday[37] = 26420;

  /* ---- price: 30-day norm by interval, and its spread ---- */
  function norm(d) { var x = R.clamp((d - 18700) / (26140 - 18700), 0, 1.05); return Math.round((640 + 740 * Math.pow(x, 1.5)) / 5) * 5; }
  D.norm = D.demand.map(norm); D.norm[37] = 1380; D.norm[34] = 1205;
  D.sigma = D.norm.map(function (p) { return Math.round(p * .34); }); D.sigma[37] = 470;
  D.cf = D.norm.slice();               // counterfactual: the market re-cleared with KST-2 at its reference offer
  var cfFix = { 35: 1340, 36: 1370, 37: 1380, 38: 1370, 39: 1350, 40: 1320 };
  for (k in cfFix) { D.cf[k] = cfFix[k]; D.norm[k] = cfFix[k]; }
  D.price = D.norm.map(function (p) { return Math.round(p * (1 + (rnd() - .5) * .07) / 5) * 5; });
  var pFix = { 34: 1210, 35: 2960, 36: 3940, 37: 4250, 38: 4120, 39: 3720, 40: 3050, 41: 1295 };
  for (k in pFix) D.price[k] = pFix[k];
  D.daPrice = D.norm.map(function (p) { return Math.round(p * (1 + (rnd() - .5) * .04) / 5) * 5; });
  D.priceToday = D.demandToday.map(function (d) { return Math.round(norm(d) * (1 + (rnd() - .5) * .06) / 5) * 5; });
  D.priceToday[14] = 1015; D.priceToday[15] = 1020;

  /* ---- KST-2: declared availability against metered output ---- */
  D.kstDeclared = D.times.map(function (_, i) { return i >= D.EV_FROM && i <= D.EV_TO ? 0 : 600; });
  D.kstMetered = D.times.map(function (_, i) { return Math.round(583 + rnd() * 14); });
  var mFix = { 34: 592, 35: 548, 36: 545, 37: 545, 38: 543, 39: 546, 40: 544, 41: 588 };
  for (k in mFix) D.kstMetered[k] = mFix[k];

  /* ---- harm: (system price − counterfactual) × energy bought ---- */
  D.harm = [];
  for (i = D.EV_FROM; i <= D.EV_TO; i++) {
    var mwh = D.demand[i] / 2;
    D.harm.push({ i: i, t: f.t(i), price: D.price[i], cf: D.cf[i], uplift: D.price[i] - D.cf[i], mwh: mwh, harm: (D.price[i] - D.cf[i]) * mwh });
  }
  D.harmTotal = R.sum(D.harm, function (h) { return h.harm; });   // about R178.8m
  D.harmQuarter = D.harmTotal + 11.4e6 + 4.8e6;                    // R195m across three cases

  /* ---- participants (all fictional) ---- */
  D.participants = [
    { id: 'P-001', name: 'Highveld Generation SOC', short: 'Highveld', cls: 'Generator · incumbent', lic: 'GEN-0001', licStatus: 'Active', inst: 31400, avail: 16800, alerts: 4, cases: 1, risk: 46, trend: [41, 43, 44, 42, 45, 46], note: 'Structurally pivotal in every interval. Screens test conduct against vesting-contract cost references, not structure alone.' },
    { id: 'P-003', name: 'Limpopo Coal Energy', short: 'Limpopo Coal', cls: 'Generator', lic: 'GEN-0014', licStatus: 'Active', inst: 3200, avail: 2600, alerts: 2, cases: 1, risk: 38, trend: [30, 31, 33, 36, 37, 38] },
    { id: 'P-007', name: 'Kestrel Power (Pty) Ltd', short: 'Kestrel', cls: 'Generator', lic: 'GEN-0031', licStatus: 'Active · under investigation', inst: 3763, avail: 3163, alerts: 6, cases: 1, risk: 91, trend: [44, 47, 52, 58, 66, 91] },
    { id: 'P-012', name: 'Ridgeline Energy', short: 'Ridgeline', cls: 'Generator', lic: 'GEN-0038', licStatus: 'Active · warning issued', inst: 1800, avail: 1500, alerts: 5, cases: 1, risk: 64, trend: [35, 41, 48, 55, 60, 64] },
    { id: 'P-015', name: 'Thukela Pumped Storage', short: 'Thukela', cls: 'Generator · storage', lic: 'GEN-0042', licStatus: 'Active', inst: 1332, avail: 1300, alerts: 0, cases: 0, risk: 12, trend: [14, 13, 12, 12, 12, 12] },
    { id: 'P-018', name: 'Lowveld Peaking Power', short: 'Lowveld', cls: 'Generator · peaking', lic: 'GEN-0047', licStatus: 'Active', inst: 1020, avail: 619, alerts: 3, cases: 2, risk: 57, trend: [50, 52, 55, 56, 58, 57] },
    { id: 'P-021', name: 'Cape Agulhas Wind', short: 'Agulhas Wind', cls: 'Generator · IPP', lic: 'GEN-0102', licStatus: 'Active', inst: 1480, avail: 620, alerts: 0, cases: 0, risk: 9, trend: [10, 10, 9, 9, 9, 9] },
    { id: 'P-024', name: 'Amathole Wind', short: 'Amathole Wind', cls: 'Generator · IPP', lic: 'GEN-0117', licStatus: 'Active', inst: 960, avail: 410, alerts: 1, cases: 0, risk: 15, trend: [11, 12, 12, 14, 15, 15] },
    { id: 'P-027', name: 'Karoo Solar One', short: 'Karoo Solar', cls: 'Generator · IPP', lic: 'GEN-0123', licStatus: 'Active', inst: 1250, avail: 0, alerts: 0, cases: 0, risk: 8, trend: [8, 8, 8, 8, 8, 8] },
    { id: 'P-031', name: 'Sable Power Trading', short: 'Sable', cls: 'Trader · import licence', lic: 'TRD-0009', licStatus: 'Active · remediation order', inst: 0, avail: 200, alerts: 4, cases: 1, risk: 61, trend: [66, 68, 70, 64, 60, 61] },
    { id: 'P-034', name: 'Vaal Energy Traders', short: 'Vaal', cls: 'Trader', lic: 'TRD-0015', licStatus: 'Active', inst: 0, avail: 0, alerts: 2, cases: 0, risk: 43, trend: [20, 21, 22, 24, 30, 43] },
    { id: 'P-040', name: 'Protea Metro Distribution', short: 'Protea Metro', cls: 'Distributor', lic: 'DIS-0022', licStatus: 'Active', inst: 0, avail: 0, alerts: 2, cases: 1, risk: 34, trend: [25, 27, 30, 33, 35, 34] },
    { id: 'P-043', name: 'Bushveld Smelting', short: 'Bushveld', cls: 'Large customer', lic: 'CUS-0006', licStatus: 'Active', inst: 0, avail: 0, alerts: 1, cases: 0, risk: 22, trend: [18, 18, 30, 26, 23, 22] },
    { id: 'P-002', name: 'Central Purchasing Agency', short: 'CPA', cls: 'Central buyer · vesting contracts', lic: 'CPA-0001', licStatus: 'Active', inst: 0, avail: 0, alerts: 0, cases: 0, risk: 6, trend: [6, 6, 6, 6, 6, 6] }
  ];
  D.P = {}; D.participants.forEach(function (p) { D.P[p.id] = p; });
  D.kestrelUnits = [
    { id: 'KST-1', type: 'Coal', mw: 600, offer: 880, ref: 870, status: 'Available' },
    { id: 'KST-2', type: 'Coal', mw: 600, offer: null, ref: 1050, status: 'Declared forced outage 17:30–20:30 · metered 545 MW' },
    { id: 'KST-3', type: 'Coal', mw: 600, offer: 940, ref: 930, status: 'Available' },
    { id: 'KST-4', type: 'Coal', mw: 600, offer: 990, ref: 985, status: 'Available' },
    { id: 'KST-5', type: 'Coal', mw: 600, offer: 1060, ref: 1055, status: 'Available · 180 MW tranche re-priced to R4 250 at 17:22' },
    { id: 'KST-6', type: 'Coal', mw: 600, offer: 1040, ref: 1030, status: 'Available' },
    { id: 'KST-GT1', type: 'Gas turbine', mw: 163, offer: 4250, ref: 3900, status: 'Available · re-priced from R3 900 at 17:22' }
  ];

  /* ---- supply stack at 18:30 (offer tranches in merit order) ---- */
  D.stack = [
    { p: 'P-021', r: 'Wind (Agulhas, Amathole)', mw: 1030, price: 0, type: 'Wind' },
    { p: 'P-001', r: 'HVG-N nuclear', mw: 1800, price: 180, type: 'Nuclear' },
    { p: 'P-001', r: 'HVG coal block A', mw: 4200, price: 520, type: 'Coal' },
    { p: 'P-001', r: 'HVG coal block B', mw: 4000, price: 640, type: 'Coal' },
    { p: 'P-003', r: 'LCE 1–4', mw: 2600, price: 690, type: 'Coal' },
    { p: 'P-001', r: 'HVG coal block C', mw: 3800, price: 780, type: 'Coal' },
    { p: 'P-007', r: 'KST-1', mw: 600, price: 880, type: 'Coal' },
    { p: 'P-007', r: 'KST-3', mw: 600, price: 940, type: 'Coal' },
    { p: 'P-007', r: 'KST-4', mw: 600, price: 990, type: 'Coal' },
    { p: 'P-007', r: 'KST-6', mw: 600, price: 1040, type: 'Coal' },
    { p: 'P-007', r: 'KST-5 tranche 1', mw: 420, price: 1060, type: 'Coal' },
    { p: 'P-012', r: 'RDG 1–3', mw: 1500, price: 1150, type: 'Coal' },
    { p: 'P-001', r: 'HVG mid-merit', mw: 2350, price: 1240, type: 'Coal' },
    { p: 'P-015', r: 'TPS 1–4', mw: 1300, price: 1380, type: 'Pumped storage' },
    { p: 'P-001', r: 'HVG hydro', mw: 250, price: 1690, type: 'Hydro' },
    { p: 'P-031', r: 'Import', mw: 200, price: 2150, type: 'Import' },
    { p: 'P-018', r: 'LPP GT 1', mw: 250, price: 3650, type: 'Gas turbine' },
    { p: 'P-007', r: 'KST-5 tranche 2', mw: 180, price: 4250, type: 'Coal', flag: true },
    { p: 'P-007', r: 'KST-GT1', mw: 163, price: 4250, type: 'Gas turbine', flag: true },
    { p: 'P-018', r: 'LPP GT 2', mw: 369, price: 4480, type: 'Gas turbine' },
    { p: 'P-001', r: 'HVG GT', mw: 400, price: 4900, type: 'Gas turbine' }
  ];
  D.stackCf = D.stack.filter(function (t) { return !t.flag; }).concat([
    { p: 'P-007', r: 'KST-2 (at reference)', mw: 600, price: 1050, type: 'Coal', cf: true },
    { p: 'P-007', r: 'KST-5 tranche 2 (at reference)', mw: 180, price: 1120, type: 'Coal', cf: true },
    { p: 'P-007', r: 'KST-GT1 (at reference)', mw: 163, price: 3900, type: 'Gas turbine', cf: true }
  ]).sort(function (a, b) { return a.price - b.price; });
  D.clear = function (stack, demand) { var c = 0; for (var j = 0; j < stack.length; j++) { c += stack[j].mw; if (c >= demand) return stack[j]; } return stack[stack.length - 1]; };
  D.supplyTotal = R.sum(D.stack, function (t) { return t.mw; });                 // 27 212 MW
  D.reserveMargin = (D.supplyTotal - D.demand[D.EV]) / D.demand[D.EV] * 100;     // 4.1%
  D.kestrelAvail = R.sum(D.stack, function (t) { return t.p === 'P-007' ? t.mw : 0; });
  D.rsiPeak = (D.supplyTotal - D.kestrelAvail) / D.demand[D.EV];                  // 0.92
  /* RSI for Kestrel across the event day: tight only around the evening peak */
  D.rsi = D.demand.map(function (d, i) {
    var avail = 27812 + (i >= 12 && i <= 32 ? 900 : 0) - (i >= D.EV_FROM && i <= D.EV_TO ? 600 : 0);
    return Math.round((avail - (i >= D.EV_FROM && i <= D.EV_TO ? D.kestrelAvail : 3763)) / d * 1000) / 1000;
  });
  D.margin = D.demand.map(function (d, i) {
    var avail = 27812 + (i >= 12 && i <= 32 ? 900 : 0) - (i >= D.EV_FROM && i <= D.EV_TO ? 600 : 0);
    return (avail - d) / d * 100;
  });
  D.capacity = D.demand.map(function (d, i) { return 27812 + (i >= 12 && i <= 32 ? 900 : 0) - (i >= D.EV_FROM && i <= D.EV_TO ? 600 : 0); });
  D.shares = [['P-001', 16800], ['P-007', 3163], ['P-003', 2600], ['P-012', 1500], ['P-015', 1300], ['P-021', 620], ['P-018', 619], ['P-024', 410], ['P-031', 200]]
    .map(function (s) { return { id: s[0], mw: s[1], pct: s[1] / D.supplyTotal * 100 }; });
  D.hhi = Math.round(R.sum(D.shares, function (s) { return s.pct * s.pct; }));
  D.hhiTrend = [4620, 4580, 4510, 4470, 4390, 4350, 4290, 4240, 4200, 4170, 4140, D.hhi];
  D.months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  /* 30 daily prices for the 18:30 interval, for the distribution view */
  D.hist1830 = []; for (i = 0; i < 30; i++) D.hist1830.push(Math.round(1380 + (rnd() + rnd() + rnd() - 1.5) * 2 * 470 * .82));
  D.z = (D.price[D.EV] - D.norm[D.EV]) / D.sigma[D.EV];                            // 6.1

  /* ---- corridors and reserves ---- */
  D.corridors = [
    { name: 'Northern Cape export', line: 'Hydra–Aries 400 kV', limit: 1450, flow: 1392, bind: 31 },
    { name: 'Western Cape import', line: 'Cape corridor', limit: 3900, flow: 3120, bind: 6 },
    { name: 'Eastern Cape export', line: 'Eastern Cape supply area', limit: 1200, flow: 1004, bind: 11 },
    { name: 'Mpumalanga to Gauteng', line: 'Central grid', limit: 9800, flow: 7350, bind: 0 },
    { name: 'KwaZulu-Natal import', line: 'KZN supply area', limit: 4600, flow: 3310, bind: 2 }
  ];
  D.reserves = [
    { name: 'Instantaneous', req: 650, held: 655, price: 68 },
    { name: 'Regulating up', req: 830, held: 830, price: 112 },
    { name: 'Regulating down', req: 830, held: 842, price: 54 },
    { name: 'Ten-minute', req: 720, held: 498, price: 310 }
  ];

  /* ---- surveillance screens: ten families ---- */
  D.screens = [
    { id: 'SCR-01', name: 'Economic withholding', method: 'Conduct and impact', what: 'Offers priced well above reference levels when the resource is pivotal.', thr: 'Offer above reference by the lower of 300% or R1 500/MWh, and price impact above the lower of 200% or R1 500/MWh', clause: 'MCR 4.2(b)', fires: 9, confirmed: 3, status: 'Active', tuned: '28 Jun' },
    { id: 'SCR-02', name: 'Physical withholding', method: 'Correlation', what: 'Derates or outages that coincide with price spikes, tested against metering and telemetry.', thr: 'Declared unavailable above 100 MW or 10% of a unit while metered output exceeds 50 MW, or outage begins within 60 min of a pivotal interval', clause: 'MCR 4.2(a)', fires: 4, confirmed: 2, status: 'Active', tuned: '28 Jun' },
    { id: 'SCR-03', name: 'Market power', method: 'Structural index', what: 'Pivotal supplier and residual supply indices by interval; concentration by segment.', thr: 'RSI below 1.00 for a non-incumbent supplier; HHI above 1 800', clause: 'MCR 3.1', fires: 46, confirmed: 0, status: 'Active · informational', tuned: '14 Jun' },
    { id: 'SCR-04', name: 'Bid pattern change', method: 'Statistical anomaly', what: 'Abrupt shifts in a participant’s offer curve against its own history.', thr: 'Offer-curve distance above 3.0σ from the 90-day profile for the same hour and day type', clause: 'MCR 4.3', fires: 21, confirmed: 2, status: 'Active · recalibration proposed', tuned: '2 Jun' },
    { id: 'SCR-05', name: 'Coordinated conduct', method: 'Correlation and network', what: 'Mirrored bidding or rotation between participants.', thr: 'Pairwise offer correlation above 0.92 over 10 trading days with common price points', clause: 'MCR 4.4', fires: 3, confirmed: 1, status: 'Active', tuned: '14 Jun' },
    { id: 'SCR-06', name: 'Balancing gaming', method: 'Rules and anomaly', what: 'Deliberate imbalance positions ahead of balancing prices.', thr: 'Same-direction imbalance above the 5% metering band in 4 of 6 high-price intervals', clause: 'MCR 4.5', fires: 7, confirmed: 2, status: 'Active', tuned: '21 Jun' },
    { id: 'SCR-07', name: 'Congestion and access', method: 'Rules', what: 'Behaviour around constraints; discriminatory access or wheeling.', thr: 'Uneconomic production behind a binding constraint; access decisions slower for independent applicants than affiliates', clause: 'ERA s.34B · MCR 5.1', fires: 5, confirmed: 1, status: 'Active', tuned: '7 Jun' },
    { id: 'SCR-08', name: 'Settlement and credit', method: 'Rules and reconciliation', what: 'Unusual settlement outcomes, collateral shortfalls, defaults.', thr: 'Credit cover below requirement for more than one business day; settlement variance above R100 000', clause: 'Market Code s.14', fires: 6, confirmed: 2, status: 'Active', tuned: '14 Jun' },
    { id: 'SCR-09', name: 'Automated trading', method: 'Pattern detection', what: 'Submission patterns inconsistent with manual review during the proposed five-year ban.', thr: 'Median gap between amendments below 2 s with spread below 0.1 s across 50 or more submissions', clause: 'Platform Framework ch. 9', fires: 2, confirmed: 0, status: 'Active', tuned: '5 Jul' },
    { id: 'SCR-10', name: 'Disclosure compliance', method: 'Rules', what: 'Late, missing or inconsistent outage and transparency publications.', thr: 'Outage or inside information published more than 60 min after the event, or after trading on it', clause: 'MCR 6.2', fires: 14, confirmed: 9, status: 'Active', tuned: '14 Jun' }
  ];
  D.SCR = {}; D.screens.forEach(function (s) { D.SCR[s.id] = s; });

  /* ---- alerts. Score = 100 × (0.35 S + 0.30 M + 0.20 C + 0.15 R) ---- */
  D.weights = { S: .35, M: .30, C: .20, R: .15 };
  function sc(a) { return Math.round(100 * (a.S * .35 + a.M * .30 + a.C * .20 + a.R * .15)); }
  D.alerts = [
    { id: 'A-1094', scr: 'SCR-02', p: 'P-007', res: 'KST-2', title: 'Declared on forced outage while metered at 545 MW', when: '13 Jul 17:30–20:00', raised: '13 Jul 18:33', S: .97, M: .95, C: .94, R: .85, impact: null, status: 'Escalated', owner: 'Naledi Mokoena', caseId: '0047', sla: 'Triaged in 19 min',
      why: [['Outage notice', 'Forced outage, 600 MW, effective 17:30', 'Outage notices (PDF), confidence 0.97'], ['Metered output', '545 MW average across six intervals', 'Metering, quality flag A (actual)'], ['SCADA telemetry', 'Generator breaker closed; 541–549 MW', 'System Operator dispatch stream'], ['Market state', 'RSI 0.92 at 18:30; reserve margin 4.1%', 'Prices and results'], ['Price impact', 'R4 250/MWh against R1 380 counterfactual', 'Hub re-clear of the 18:30 interval']],
      alt: [['Genuine forced outage', 'refuted', 'Two independent sources show the unit generating throughout.'], ['Metering error or stuck value', 'refuted', 'Readings vary interval to interval and agree with SCADA within 0.8%.'], ['Notice filed against the wrong unit', 'inconclusive', 'KST-3 and KST-4 show no change in output. Kestrel has not corrected the notice.'], ['House-load or island operation', 'refuted', 'Energy was exported at the station boundary meter.']] },
    { id: 'A-1095', scr: 'SCR-01', p: 'P-007', res: 'KST-5, KST-GT1', title: 'Offers re-priced to R4 250 eight minutes before the 17:30 interval', when: '13 Jul 17:22', raised: '13 Jul 18:36', S: .86, M: .88, C: .72, R: .70, impact: 61.2e6, status: 'In triage', owner: 'Naledi Mokoena', sla: 'Triage due 10:36', suggest: 'merge',
      why: [['Conduct test', 'KST-5 tranche 2 offered 279% above reference (R4 250 against R1 120); exceeds the R1 500 limb', 'Offers and bids, amendment 17:22:08'], ['Impact test', 'Price R2 870 above the re-cleared price; exceeds the R1 500 limb', 'Hub re-clear'], ['Timing', 'Amended 8 min before the interval and 8 min before the KST-2 outage notice', 'Offers and bids; Outages'], ['Pivotal', 'Kestrel pivotal in all six intervals', 'Prices and results']],
      alt: [['Fuel cost increase', 'refuted', 'No cost update filed; reference level unchanged since 2 Jun.'], ['Scarcity pricing permitted under the Code', 'inconclusive', 'Offer is below the R5 396.40 cap; conduct rules still apply when pivotal.'], ['Same conduct as A-1094', 'supported', 'Same participant, same intervals, complementary effect. Recommend one case.']] },
    { id: 'A-1091', scr: 'SCR-10', p: 'P-012', res: 'RDG-1', title: 'Outage notice published 2 h 14 min after the trip', when: '13 Jul 14:06', raised: '13 Jul 16:21', S: .55, M: .36, C: .90, R: .60, impact: 0.42e6, status: 'New', owner: null, sla: 'Triage due 16:21',
      why: [['Trip time', 'RDG-1 tripped at 14:06', 'System Operator dispatch stream'], ['Publication', 'Notice published 16:20; rule allows 60 min', 'Transparency platform'], ['Trading in the gap', 'Ridgeline amended two offers at 14:31 and 15:02', 'Offers and bids'], ['History', 'Third late notice in 30 days (21 Jun, 2 Jul)', 'Alert history']],
      alt: [['Platform outage prevented publication', 'refuted', 'Transparency platform was available; 11 other notices published in the window.'], ['Trading on undisclosed information', 'inconclusive', 'Amendments lowered offer volume by 40 MW. Needs analyst judgement.']] },
    { id: 'A-1096', scr: 'SCR-06', p: 'P-031', res: 'Import position', title: 'Long imbalance ahead of high balancing prices on four of six evenings', when: '8–13 Jul, 17:30–19:30', raised: '14 Jul 02:14', S: .52, M: .44, C: .58, R: .40, impact: 1.9e6, status: 'New', owner: null, sla: 'Triage due 14:14',
      why: [['Pattern', 'Over-delivery of 38–61 MW in 4 of 6 evening peaks', 'Metering against schedules'], ['Outcome', 'Settled at the balancing buy price, R1.9m above schedule value', 'Settlement'], ['History', 'Remediation order from Case 0041 still in force', 'Case register']],
      alt: [['Forecast error on imports', 'inconclusive', 'Deviation is one-sided; a forecast error would be two-sided.'], ['Instructed by the System Operator', 'refuted', 'No dispatch instruction recorded for these intervals.']] },
    { id: 'A-1097', scr: 'SCR-09', p: 'P-034', res: 'Trading desk API key 2', title: '212 offer amendments at one-second regularity', when: '13 Jul 09:41–09:58', raised: '13 Jul 23:05', S: .50, M: .28, C: .68, R: .30, impact: null, status: 'New', owner: null, sla: 'Triage due 11:05', suggest: 'case',
      why: [['Cadence', 'Median gap 1.00 s, spread 0.02 s across 212 amendments', 'Platform API log'], ['Channel', 'All through one API key; no user session open', 'User access log'], ['Rule', 'Automated submission without manual review is barred for five years', 'Platform Framework ch. 9']],
      alt: [['Bulk upload by a trader', 'inconclusive', 'A bulk file would arrive as one submission, not 212.'], ['Operator-side replay or retry', 'refuted', 'Sequence numbers are client-generated and increasing.']] },
    { id: 'A-1088', scr: 'SCR-04', p: 'P-018', res: 'LPP GT 1–2', title: 'Offer curve shifted up by R310/MWh', when: '11 Jul', raised: '11 Jul 10:12', S: .40, M: .30, C: .45, R: .25, impact: null, status: 'Closed', disp: 'Explained: fuel cost update filed 10 Jul', owner: 'Anika Pillay' },
    { id: 'A-1085', scr: 'SCR-05', p: 'P-012', res: 'RDG / LPP', title: 'Mirrored offer prices with Lowveld Peaking over ten days', when: '29 Jun–9 Jul', raised: '9 Jul 07:02', S: .66, M: .58, C: .62, R: .60, impact: 3.1e6, status: 'Closed', disp: 'Case 0046 opened', owner: 'Anika Pillay', caseId: '0046' },
    { id: 'A-1079', scr: 'SCR-08', p: 'P-043', res: 'Credit cover', title: 'Collateral R38m below requirement for two business days', when: '6–7 Jul', raised: '7 Jul 08:00', S: .74, M: .70, C: .95, R: .30, impact: 38e6, status: 'Closed', disp: 'Cured 8 Jul; noted', owner: 'Sipho Dlamini' },
    { id: 'A-1072', scr: 'SCR-07', p: 'P-001', res: 'Grid access queue', title: 'Wheeling applications from independents processed 41 days slower', when: 'Q2', raised: '2 Jun 09:15', S: .62, M: .55, C: .60, R: .50, impact: null, status: 'Closed', disp: 'Case 0045 opened', owner: 'Sipho Dlamini', caseId: '0045' },
    { id: 'A-1066', scr: 'SCR-03', p: 'P-007', res: 'Portfolio', title: 'Pivotal in 11 evening intervals this week', when: '28 Jun–4 Jul', raised: '5 Jul 06:30', S: .35, M: .40, C: .90, R: .20, impact: null, status: 'Closed', disp: 'Structural; no conduct found', owner: 'Naledi Mokoena' },
    { id: 'A-1061', scr: 'SCR-01', p: 'P-007', res: 'KST-GT1', title: 'Gas turbine offered 180% above reference while pivotal', when: '29 Jun 18:00–19:00', raised: '29 Jun 19:12', S: .68, M: .62, C: .60, R: .70, impact: 8.4e6, status: 'Closed', disp: 'Insufficient evidence; participant placed on watch', owner: 'Naledi Mokoena' },
    { id: 'A-1049', scr: 'SCR-10', p: 'P-012', res: 'RDG-2', title: 'Outage notice published 1 h 38 min late', when: '2 Jul', raised: '2 Jul 12:40', S: .50, M: .30, C: .90, R: .45, impact: null, status: 'Closed', disp: 'Warning letter issued (Case 0042)', owner: 'Anika Pillay' },
    { id: 'A-1043', scr: 'SCR-10', p: 'P-012', res: 'RDG-1', title: 'Outage notice published 1 h 12 min late', when: '21 Jun', raised: '21 Jun 15:02', S: .42, M: .22, C: .90, R: .20, impact: null, status: 'Closed', disp: 'Noted; first occurrence', owner: 'Anika Pillay' }
  ];
  D.alerts.forEach(function (a) { a.score = sc(a); });
  D.alerts[0].impact = D.harmTotal;
  D.A = {}; D.alerts.forEach(function (a) { D.A[a.id] = a; });
  D.alertStatus = function (a) { return R.S.alertStatus[a.id] || a.status; };
  D.openAlerts = function () { return D.alerts.filter(function (a) { var s = D.alertStatus(a); return s !== 'Closed' && s !== 'Merged'; }); };
  D.funnel = [['Market events screened', 1284600], ['Alerts raised', 117], ['Alerts prioritised', 48], ['Cases opened', 7], ['Enforcement outcomes', 4]];

  /* ---- data alerts ---- */
  D.dataAlerts = [
    { id: 'DQ-314', sev: 'high', ds: 'Settlement · Metering', title: 'Settlement and metered energy differ by 0.31% for 13 Jul', detail: 'Tolerance is 0.25%. The gap is 1 635 MWh, which matches KST-2 metered output with no schedule. Linked to Case 0047.', action: 'Open reconciliation', go: '#/quality', status: 'Open' },
    { id: 'DQ-312', sev: 'warn', ds: 'Metering', title: 'One meter read quarantined: −12.4 MWh from a generator', detail: 'LCE-3, interval 03:30. Negative generation fails the validity rule. Held out of the hub; the original stays in the raw zone.', action: 'Resolve with reason', go: '#/quality', status: 'Open' },
    { id: 'DQ-311', sev: 'warn', ds: 'Metering', title: 'Metering file arrived 47 min after its 06:00 deadline', detail: 'All 1 920 reads loaded at 06:47. Second late delivery this month; the timeliness SLA is 99.0%.', action: 'View feed', go: '#/dataops', status: 'Recovered' },
    { id: 'DQ-316', sev: 'warn', ds: 'Outages and availability', title: 'Outage notice field read at 0.91 confidence', detail: 'Return-to-service time on Kestrel notice ON-2027-0713-044 is below the 0.95 auto-accept level. Needs a human check.', action: 'Check extraction', go: '#/dataops', status: 'Open' },
    { id: 'DQ-313', sev: '', ds: 'Settlement and prudential', title: 'Manual upload: one row held for approval', detail: 'Prudential_cover_Jul.xlsx, row 14: participant code “P-0O7” is not in the register. Suggested match P-007.', action: 'Review upload', go: '#/dataops', status: 'Open' },
    { id: 'DQ-315', sev: '', ds: 'Transparency', title: 'New field in the transparency API response', detail: 'publication_revision appeared at 00:00. Mapped to staging; needs confirmation before it reaches the curated dataset.', action: 'Confirm mapping', go: '#/quality', status: 'Open' }
  ];

  /* ---- cases ---- */
  D.stages = ['Detected', 'Triage', 'Investigation', 'Findings', 'Decision', 'Closed'];
  D.cases = [
    { id: '0047', p: 'P-007', title: 'Suspected physical and economic withholding, evening of 13 Jul', stage: 2, pri: 'Critical', opened: '13 Jul 18:52', lead: 'Anika Pillay', harm: D.harmTotal, clause: 'MCR 4.2(a), 4.2(b), 6.2', due: 'Information request due to issue today' },
    { id: '0048', p: 'P-034', title: 'Submission cadence inconsistent with manual review', stage: 0, pri: 'Medium', opened: 'Proposed 14 Jul 06:10', lead: null, harm: null, clause: 'Platform Framework ch. 9', due: 'Awaiting approval to open' },
    { id: '0046', p: 'P-012', title: 'Mirrored offers between Ridgeline Energy and Lowveld Peaking Power', stage: 1, pri: 'High', opened: '9 Jul', lead: 'Anika Pillay', harm: 3.1e6, clause: 'MCR 4.4', due: 'Triage decision by 16 Jul' },
    { id: '0045', p: 'P-001', title: 'Wheeling applications from independents processed more slowly', stage: 3, pri: 'High', opened: '2 Jun', lead: 'Sipho Dlamini', harm: null, clause: 'ERA s.34B · MCR 5.1', due: 'Draft findings to Legal 20 Jul' },
    { id: '0044', p: 'P-018', title: 'Uneconomic offers behind the Northern Cape constraint', stage: 4, pri: 'High', opened: '11 May', lead: 'Sipho Dlamini', harm: 11.4e6, clause: 'MCR 4.2(b)', due: 'Regulator member panel 22 Jul' },
    { id: '0040', p: 'P-003', title: 'Repeated negative and estimated meter reads at LCE-3', stage: 2, pri: 'Medium', opened: '18 Apr', lead: 'Johan van Wyk', harm: 0.6e6, clause: 'Metering Code 7.3', due: 'Site audit report due 30 Jul' },
    { id: '0038', p: 'P-040', title: 'Credit cover lapsed on three settlement days', stage: 3, pri: 'Medium', opened: '2 Apr', lead: 'Lerato Khumalo', harm: null, clause: 'Market Code s.14', due: 'Findings review 19 Jul' },
    { id: '0042', p: 'P-012', title: 'Late outage disclosures in June', stage: 5, pri: 'Low', opened: '3 Jul', lead: 'Anika Pillay', harm: null, clause: 'MCR 6.2', outcome: 'Warning letter', closed: '8 Jul' },
    { id: '0041', p: 'P-031', title: 'Imbalance positions ahead of balancing prices', stage: 5, pri: 'High', opened: '14 Mar', lead: 'Sipho Dlamini', harm: 4.8e6, clause: 'MCR 4.5', outcome: 'Remediation order', closed: '30 Jun' },
    { id: '0039', p: 'P-043', title: 'Collateral shortfall in April', stage: 5, pri: 'Low', opened: '9 Apr', lead: 'Lerato Khumalo', harm: null, clause: 'Market Code s.14', outcome: 'Closed, no action', closed: '2 May' }
  ];
  D.C = {}; D.cases.forEach(function (c) { D.C[c.id] = c; });
  D.evidence = [
    { n: 1, name: 'Outage notice ON-2027-0713-044 (PDF as received)', ds: 'Outages and availability · raw', by: R.cfg.agent, hash: '9f2c41d07a6be3158c40f6d2e1b7a9034c5d8e6f1a2b3c4d5e6f708192a3b4c5' },
    { n: 2, name: 'Metered output KST-2, 13 Jul, 48 intervals', ds: 'Metering · curated', by: R.cfg.agent, hash: '3b8e07c4d91fa2560e7b3c8d4f1a69e2b5c7d0834f6a1e9b2c3d4e5f60718293' },
    { n: 3, name: 'SCADA telemetry extract KST-2, 17:00–20:30', ds: 'Dispatch and balancing · raw', by: R.cfg.agent, hash: 'c71a5e3f9b024d68a1e7f3c5b9d2046e8a1c3f5b7d9e0f2a4c6e8b0d1f3a5c7e' },
    { n: 4, name: 'Offer amendments, Kestrel Power, 13 Jul 17:22:08', ds: 'Offers and bids · raw', by: 'Naledi Mokoena', hash: '5d0f8b2a6c4e1937f0a2c4e6b8d0f1a3c5e7b9d1f3a5c7e9b0d2f4a6c8e0b1d3' },
    { n: 5, name: 'Market re-clear, 17:30–20:00, actual and counterfactual', ds: 'Prices and results · analysis', by: R.cfg.agent, hash: 'e4a6c8b0d2f41357a9c1e3b5d7f90b2d4f6a8c0e2b4d6f8a0c1e3b5d7f9a1c3e' },
    { n: 6, name: 'Analyst note: triage and reasons for escalation', ds: 'Case record', by: 'Naledi Mokoena', hash: '1a3c5e7b9d0f2a4c6e8b0d1f3a5c7e9b1d3f5a7c9e0b2d4f6a8c0e1b3d5f7a9c' }
  ];

  /* ---- sources, datasets, rules ---- */
  D.sources = [
    { id: 'trd', rfi: 'SAWEM trading platform', name: 'Trading platform', kind: 'API', method: 'REST API, pull every 60 s', n: 18240, unit: 'bids and offers', last: '07:41:52', lat: '8 s', ok: true, ds: 'Offers and bids' },
    { id: 'mo', rfi: 'Market Operator', name: 'Market results', kind: 'API', method: 'REST API after each clearing run', n: 1440, unit: 'price and schedule rows', last: '07:30:21', lat: '21 s', ok: true, ds: 'Prices and results' },
    { id: 'so', rfi: 'System Operator', name: 'Dispatch instructions', kind: 'STREAM', method: 'Event stream, 5 s resolution', n: 17280, unit: 'events', last: '07:41:55', lat: '2 s', ok: true, ds: 'Dispatch and balancing' },
    { id: 'bal', rfi: 'Balancing engines', name: 'Balancing stacks and activations', kind: 'STREAM', method: 'Event stream', n: 2304, unit: 'events', last: '07:41:50', lat: '3 s', ok: true, ds: 'Dispatch and balancing' },
    { id: 'net', rfi: 'Network constraints', name: 'Constraints and limits', kind: 'API', method: 'REST API, pull every 5 min', n: 336, unit: 'rows', last: '07:40:03', lat: '14 s', ok: true, ds: 'Network constraints' },
    { id: 'tp', rfi: 'Transparency platform', name: 'Published market information', kind: 'API', method: 'REST API, with page capture as fallback', n: 1152, unit: 'rows', last: '07:40:11', lat: '40 s', ok: true, warn: 'New field detected', ds: 'Transparency' },
    { id: 'stl', rfi: 'Settlement systems', name: 'Settlement statements', kind: 'FILE', method: 'SFTP, CSV, D+1 by 04:00', n: 4800, unit: 'lines', last: '03:52', lat: 'on time', ok: true, ds: 'Settlement' },
    { id: 'pru', rfi: 'Prudential and collateral', name: 'Credit cover and collateral', kind: 'FILE', method: 'SFTP, CSV, daily 05:00', n: 38, unit: 'records', last: '04:58', lat: 'on time', ok: true, ds: 'Settlement' },
    { id: 'mtr', rfi: 'Metering', name: 'Metered volumes', kind: 'FILE', method: 'SFTP, bulk CSV, D+1 by 06:00', n: 1920, unit: 'reads', last: '06:47', lat: '47 min late', ok: false, warn: 'Late', ds: 'Metering' },
    { id: 'out', rfi: 'Outage and availability', name: 'Outage notices', kind: 'DOC', method: 'PDF by secure portal, fields read by document model', n: 23, unit: 'notices', last: '06:12', lat: 'fields read at 0.91–0.99', ok: true, warn: '1 field to check', ds: 'Outages and availability' },
    { id: 'rep', rfi: 'Participant reporting', name: 'Participant e-mail and returns', kind: 'DOC', method: 'Shared mailbox and portal, classified and linked', n: 14, unit: 'e-mails', last: '07:18', lat: '–', ok: true, ds: 'Transparency' },
    { id: 'code', rfi: 'Market Code and rules', name: 'Market Code changes', kind: 'DOC', method: 'Published PDF, clause-level comparison', n: 212, unit: 'clauses', last: '12 Jul', lat: '–', ok: true, ds: 'Control and audit' },
    { id: 'man', rfi: 'Manual uploads', name: 'Manual upload', kind: 'MANUAL', method: 'Controlled upload, validated, approved by a second person', n: 1, unit: 'file, 1 row held', last: '13 Jul 15:20', lat: '–', ok: true, warn: '1 row held', ds: 'Settlement' }
  ];
  D.domains = ['Trading', 'Fundamental and operational', 'Network and access', 'Settlement and prudential', 'Transparency and disclosure', 'Control and audit'];
  D.datasets = [
    { n: 1, name: 'Participant register', dom: 5, desc: 'Registration, licences, credentials, affiliations', rows: 61, fresh: '06:00', dq: 99.8, cert: '2 Jul', owner: 'Johan van Wyk', label: 'Confidential', keys: 'participant_id' },
    { n: 2, name: 'Resource register', dom: 1, desc: 'Units, capacities, technical limits, ownership', rows: 412, fresh: '06:00', dq: 99.6, cert: '2 Jul', owner: 'Johan van Wyk', label: 'Confidential', keys: 'resource_id, participant_id' },
    { n: 3, name: 'Offers and bids', dom: 0, desc: 'Submissions, amendments and withdrawals with price and quantity steps', rows: 5.47e6, fresh: '07:41', dq: 99.9, cert: '9 Jul', owner: 'Naledi Mokoena', label: 'Restricted', keys: 'participant_id, resource_id, interval, version', hot: true },
    { n: 4, name: 'Prices and results', dom: 0, desc: 'System price, schedules and clearing results by interval', rows: 432e3, fresh: '07:30', dq: 100, cert: '9 Jul', owner: 'Naledi Mokoena', label: 'Public after publication', keys: 'interval, segment' },
    { n: 5, name: 'Dispatch and balancing', dom: 1, desc: 'Instructions, balancing stacks, reserve awards and activations', rows: 5.18e6, fresh: '07:41', dq: 99.7, cert: '9 Jul', owner: 'Naledi Mokoena', label: 'Restricted', keys: 'resource_id, interval, instruction_id' },
    { n: 6, name: 'Outages and availability', dom: 1, desc: 'Planned and forced outages, declarations, return to service', rows: 6.9e3, fresh: '06:12', dq: 98.9, cert: '2 Jul', owner: 'Anika Pillay', label: 'Restricted until published', keys: 'resource_id, interval, notice_id', hot: true },
    { n: 7, name: 'Network constraints', dom: 2, desc: 'Constraints, limits, flows and binding hours', rows: 100.8e3, fresh: '07:40', dq: 99.5, cert: '25 Jun', owner: 'Sipho Dlamini', label: 'Restricted', keys: 'constraint_id, interval' },
    { n: 8, name: 'Access and wheeling', dom: 2, desc: 'Grid access applications, decisions, wheeling transactions', rows: 3.2e3, fresh: '13 Jul', dq: 97.8, cert: '25 Jun', owner: 'Sipho Dlamini', label: 'Confidential', keys: 'application_id, participant_id' },
    { n: 9, name: 'Settlement', dom: 3, desc: 'Statements, invoices, credit cover, defaults', rows: 1.44e6, fresh: '03:52', dq: 99.4, cert: '2 Jul', owner: 'Lerato Khumalo', label: 'Confidential', keys: 'participant_id, interval, charge_code' },
    { n: 10, name: 'Metering', dom: 3, desc: 'Metered volumes with quality flags', rows: 576e3, fresh: '06:47', dq: 98.7, cert: '2 Jul', owner: 'Johan van Wyk', label: 'Restricted', keys: 'resource_id, interval', hot: true },
    { n: 11, name: 'Transparency', dom: 4, desc: 'Transparency publications and participant reports', rows: 345.6e3, fresh: '07:40', dq: 99.1, cert: '25 Jun', owner: 'Anika Pillay', label: 'Public', keys: 'publication_id, interval' },
    { n: 12, name: 'Control and audit', dom: 5, desc: 'User actions, lineage, rule and threshold changes, Market Code versions', rows: 2.9e6, fresh: '07:41', dq: 100, cert: '9 Jul', owner: 'Sipho Dlamini', label: 'Restricted', keys: 'event_id, actor, object' }
  ];
  D.dqDims = ['Completeness', 'Timeliness', 'Validity', 'Consistency', 'Uniqueness'];
  D.dqRules = [
    { id: 'DQ-R01', name: 'Every expected interval present', dim: 0, ds: 'Prices and results', pass: 100, fail: 0 },
    { id: 'DQ-R04', name: 'Participant code exists in the register', dim: 2, ds: 'Offers and bids', pass: 100, fail: 0 },
    { id: 'DQ-R07', name: 'Offer price between R0 and the price cap', dim: 2, ds: 'Offers and bids', pass: 100, fail: 0 },
    { id: 'DQ-R11', name: 'Metered generation is not negative', dim: 2, ds: 'Metering', pass: 99.95, fail: 1 },
    { id: 'DQ-R12', name: 'Metering file received by 06:00 on D+1', dim: 1, ds: 'Metering', pass: 93.3, fail: 1 },
    { id: 'DQ-R15', name: 'Settlement energy equals metered energy within 0.25%', dim: 3, ds: 'Settlement', pass: 96.7, fail: 1 },
    { id: 'DQ-R18', name: 'One version per offer, interval and timestamp', dim: 4, ds: 'Offers and bids', pass: 100, fail: 0 },
    { id: 'DQ-R21', name: 'Document field confidence at least 0.95', dim: 2, ds: 'Outages and availability', pass: 98.4, fail: 1 },
    { id: 'DQ-R24', name: 'Declared availability consistent with metered output', dim: 3, ds: 'Outages and availability', pass: 99.2, fail: 6 },
    { id: 'DQ-R27', name: 'Control totals match the source system', dim: 0, ds: 'Settlement', pass: 100, fail: 0 }
  ];
  D.quarantine = [
    { id: 'Q-0412', ds: 'Metering', rec: 'LCE-3 · 14 Jul 03:30', val: '−12.4 MWh', rule: 'DQ-R11 Metered generation is not negative', src: 'metering_20270714.csv, line 1 287', suggest: 'Likely auxiliary import recorded on the generation channel. Mark as estimated and request a corrected read.' },
    { id: 'Q-0411', ds: 'Settlement', rec: 'Prudential_cover_Jul.xlsx · row 14', val: 'P-0O7', rule: 'DQ-R04 Participant code exists in the register', src: 'Manual upload by L. Khumalo, 13 Jul 15:20', suggest: 'Letter O in place of zero. Suggested match P-007 Kestrel Power (Pty) Ltd, similarity 0.98.' },
    { id: 'Q-0409', ds: 'Outages and availability', rec: 'ON-2027-0713-044 · return_to_service', val: '20:30 (read at 0.91)', rule: 'DQ-R21 Document field confidence at least 0.95', src: 'Outage notice PDF, page 1', suggest: 'Handwritten correction over the typed time. Confirm against the PDF.' }
  ];
  D.codeChanges = [
    { clause: 'MCR 6.2', title: 'Outage disclosure', change: 'Amended', from: 'as soon as reasonably practicable', to: 'within 60 minutes of the event and before trading on it', screens: ['SCR-10'], status: 'Mapped', by: 'Sipho Dlamini' },
    { clause: 'MCR 4.2(a)', title: 'Physical withholding', change: 'Amended', from: 'without reasonable technical cause', to: 'without reasonable technical cause evidenced to the Market Operator within one business day', screens: ['SCR-02'], status: 'Proposed', by: R.cfg.agent },
    { clause: 'Market Code s.9.3', title: 'Day-ahead gate closure', change: 'Amended', from: '10h00 on D-1', to: '10h00 on D-1, or as extended by notice', screens: ['SCR-04', 'SCR-09'], status: 'Proposed', by: R.cfg.agent },
    { clause: 'Annexure 2', title: 'Market price cap', change: 'Value', from: 'R5 396.40/MWh', to: 'No change in Rev 2.4; due for annual review', screens: ['SCR-01'], status: 'No action', by: R.cfg.agent }
  ];

  /* ---- reports, operator oversight, security, integrations ---- */
  D.reports = [
    { name: 'Daily market operations summary', aud: 'MSU', freq: 'Daily 06:30', last: '14 Jul 06:30', by: R.cfg.agent, cls: 'Restricted', status: 'Published' },
    { name: 'Weekly market conduct report', aud: 'MSU · Executive', freq: 'Mon 08:00', last: '12 Jul', by: R.cfg.agent + ' draft, signed by S. Dlamini', cls: 'Restricted', status: 'Published' },
    { name: 'Market integrity board pack', aud: 'Board', freq: 'Quarterly', last: 'Q1 2027/28 in draft', by: R.cfg.agent + ' draft', cls: 'Confidential', status: 'In review' },
    { name: 'Operator compliance report', aud: 'Executive · Regulator members', freq: 'Monthly', last: 'June', by: 'S. Dlamini', cls: 'Confidential', status: 'Published' },
    { name: 'Market performance for tariff and licensing decisions', aud: 'Regulatory decision-makers', freq: 'Monthly', last: 'June', by: 'N. Mokoena', cls: 'Restricted', status: 'Published' },
    { name: 'State of the market report', aud: 'Public', freq: 'Annual, with quarterly updates', last: 'Q4 2026/27', by: 'MSU', cls: 'Public · confidential data removed', status: 'Published' },
    { name: 'Case 0047 evidence summary', aud: 'Legal · Regulator members', freq: 'On demand', last: '14 Jul 06:05', by: R.cfg.agent + ' draft', cls: 'Confidential · legally privileged', status: 'Draft' }
  ];
  D.operatorDuties = [
    { duty: 'Platform availability in trading windows', req: 'At least 99.9%', val: '99.94% month to date', ok: true, src: 'Framework Table 3' },
    { duty: 'Clearing algorithm is the approved version', req: 'Hash equals approved build', val: 'v2.3.1 · hash matches approval of 4 Mar', ok: true, src: 'Framework ch. 12' },
    { duty: 'Market outcomes reproducible', req: 'Independent re-clear matches published price', val: '1 439 of 1 440 intervals this month within R0.50', ok: false, src: 'Framework Table 3', note: '1 interval under query' },
    { duty: 'Maintenance notice', req: '5 business days', val: 'Last window notified 8 days ahead', ok: true, src: 'Framework Table 3' },
    { duty: 'Daily regulatory data extract', req: 'Machine-readable, by 06:00', val: 'Received 05:41', ok: true, src: 'Framework Table 7' },
    { duty: 'Weekly market conduct report', req: 'Each Monday', val: 'Received 12 Jul; 2 alerts not in NERSA’s own queue', ok: false, src: 'Framework Table 7', note: 'Reconcile' },
    { duty: 'Significant incident notice', req: 'Within 4 hours; plan within 24 hours', val: 'No incidents this month', ok: true, src: 'Framework Table 5' },
    { duty: 'Outage publications on the transparency platform', req: 'Within 60 min', val: '97.4% on time (30 days)', ok: true, src: 'MCR 6.2' },
    { duty: 'Timestamps traceable to UTC(ZA)', req: 'Synchronised', val: 'Offset 4 ms', ok: true, src: 'Framework Table 3' },
    { duty: 'Material market data retained', req: 'At least 5 years, searchable', val: 'Retention policy confirmed 1 Jul', ok: true, src: 'Framework ch. 22' }
  ];
  D.accreditation = ['Design approval', 'Factory acceptance test', 'Integration testing', 'Market simulation', 'Pilot', 'Commercial approval'];
  D.access = [{ l: 'Affiliated applicants', v: 63 }, { l: 'Independent applicants', v: 104 }];
  D.controls = [
    { n: 1, req: 'Physical and environmental security', ctl: 'Microsoft-operated Azure datacentres in South Africa North and West', proto: false },
    { n: 2, req: 'Business continuity and incident response', ctl: 'Paired-region recovery; tested playbooks; RPO 15 min, RTO 4 h', proto: false },
    { n: 3, req: 'Inventory and configuration management', ctl: 'Infrastructure as code with policy baselines; drift reported daily', proto: false },
    { n: 4, req: 'Data encryption', ctl: 'AES-256 at rest and TLS 1.2+ in transit, keys held by NERSA in Key Vault', proto: false },
    { n: 5, req: 'Access control and logging', ctl: 'Least privilege; privileged identity management; every access logged', proto: true },
    { n: 6, req: 'Network security and monitoring', ctl: 'Private endpoints, firewalling, Microsoft Sentinel and Defender', proto: false },
    { n: 7, req: 'Identity and access management', ctl: 'Entra ID, role-based access, conditional access', proto: true },
    { n: 8, req: 'POPIA, PAIA and regulation', ctl: 'Purview data classification, sensitivity labels and retention', proto: false },
    { n: 9, req: 'Two-factor authentication', ctl: 'MFA enforced for every user; number matching', proto: true },
    { n: 10, req: 'Man-in-the-middle protection', ctl: 'TLS 1.2+ everywhere; mutual TLS on licensee data links', proto: false },
    { n: 11, req: 'NERSA Cloud Computing Guidelines', ctl: 'Mapped control by control (Annexure 2)', proto: false },
    { n: 12, req: 'Full audit logging', ctl: 'Immutable logs of user, system and agent actions, retained to policy', proto: true }
  ];
  D.roleMatrix = [
    ['Market prices', 'Full', 'Summary', 'Public only', 'Read'],
    ['Offers by participant', 'Full', 'Summary', 'Own only', 'Read'],
    ['Investigation cases', 'Full', 'Status', 'None', 'Read'],
    ['Evidence bundles', 'Full', 'None', 'None', 'Read'],
    ['Agent drafts and approvals', 'Full', 'None', 'None', 'Read'],
    ['Audit log', 'Own actions', 'None', 'None', 'Full']
  ];
  D.auditSeed = [
    { t: '07:41:52', d: '14 Jul', actor: R.cfg.agent, role: 'Service', action: 'Screen run', object: 'SCR-01 to SCR-10 · interval 07:30', detail: '380 offers, 0 exceptions' },
    { t: '07:12:09', d: '14 Jul', actor: 'Naledi Mokoena', role: 'MSU analyst', action: 'Sign-in', object: 'Entra ID · MFA number match', detail: 'Workstation MSU-CR-04, control room' },
    { t: '06:47:31', d: '14 Jul', actor: 'Pipeline', role: 'Service', action: 'Load', object: 'Metering · metering_20270714.csv', detail: '1 920 reads, 1 quarantined, SHA-256 sealed' },
    { t: '06:30:00', d: '14 Jul', actor: R.cfg.agent, role: 'Service', action: 'Brief published', object: 'Morning brief 14 Jul', detail: 'model msu-analyst 2027.06 · rules r118' },
    { t: '06:10:44', d: '14 Jul', actor: R.cfg.agent, role: 'Service', action: 'Proposal', object: 'Open Case 0048 (Vaal Energy Traders)', detail: 'Awaiting analyst approval' },
    { t: '06:05:12', d: '14 Jul', actor: R.cfg.agent, role: 'Service', action: 'Draft', object: 'Information request IR-0047-01', detail: 'Awaiting approval by MSU lead' },
    { t: '02:14:30', d: '14 Jul', actor: R.cfg.agent, role: 'Service', action: 'Alert raised', object: 'A-1096 · Sable Power Trading', detail: 'Score 49' },
    { t: '19:05:18', d: '13 Jul', actor: 'Anika Pillay', role: 'Investigator', action: 'Case accepted', object: 'Case 0047', detail: 'Assigned as lead' },
    { t: '18:52:40', d: '13 Jul', actor: 'Naledi Mokoena', role: 'MSU analyst', action: 'Case opened', object: 'Case 0047 from A-1094', detail: 'Reason: two independent sources contradict the outage notice' },
    { t: '18:41:02', d: '13 Jul', actor: 'Sipho Dlamini', role: 'MSU lead', action: 'View', object: 'A-1094 · offers by participant', detail: 'Row-level security: full' },
    { t: '18:34:11', d: '13 Jul', actor: 'Integration', role: 'Service', action: 'Notify', object: 'Teams · MSU alerts channel', detail: 'Alert card A-1094 posted' },
    { t: '18:33:07', d: '13 Jul', actor: R.cfg.agent, role: 'Service', action: 'Alert raised', object: 'A-1094 · Kestrel Power', detail: 'Score 94 · SCR-02 v14' },
    { t: '17:31:15', d: '13 Jul', actor: 'Pipeline', role: 'Service', action: 'Load', object: 'Outages · ON-2027-0713-044.pdf', detail: 'Fields read at 0.91–0.99, SHA-256 sealed' }
  ];
  D.systems = [
    { id: 'entra', ab: 'ID', name: 'Microsoft Entra ID', what: 'One sign-in for every user', done: 'Token checked; role MSU analyst; conditional access passed', payload: 'aud: rdh-api · roles: [MSU.Analyst] · amr: [pwd, mfa] · ipaddr: control-room range' },
    { id: 'teams', ab: 'T', name: 'Microsoft Teams', what: 'Alert card posted to the MSU', done: 'Adaptive card posted to MSU › Alerts', payload: null },
    { id: 'sp', ab: 'SP', name: 'SharePoint records', what: 'Evidence filed with a retention label', done: 'Filed to /sites/MSU/Cases/0047/Evidence · label Enforcement-7y', payload: 'PUT /sites/MSU/Cases/0047/Evidence/A-1094_alert_record.json\nretentionLabel: "Enforcement-7y"\nsensitivity: "Confidential – Regulatory"' },
    { id: 'lic', ab: 'LIC', name: 'Licensing system', what: 'Licence status checked by API', done: 'GEN-0031 active; two conditions attached', payload: 'GET /licences/GEN-0031  (mock API built to the agreed pattern)\n{ "holder": "Kestrel Power (Pty) Ltd", "status": "Active",\n  "conditions": ["Availability declarations", "Outage disclosure"],\n  "expires": "2041-03-31" }' },
    { id: 'outlook', ab: 'O', name: 'Outlook', what: 'Information request drafted', done: 'Draft IR-0047-01 saved for the MSU lead to approve', payload: 'To: compliance@kestrelpower.example\nSubject: Information request IR-0047-01 – KST-2 availability, 13 July 2027\nStatus: Draft, not sent' },
    { id: 'pbi', ab: 'BI', name: 'Power BI', what: 'Board KPI updated', done: 'Dataset refreshed; “Harm detected this quarter” now R195m', payload: 'POST /datasets/market-integrity/refreshes\nmeasure [Harm detected QTD] 16.2m → 195.0m' }
  ];
  D.coverage = [
    { n: '01', name: 'Data extraction', pts: 20, page: 'dataops', label: 'Data Operations', show: 'Run ingestion cycle across every source type; drop a file into manual intake; read fields from an outage notice PDF.' },
    { n: '02', name: 'Transformation and load', pts: 20, page: 'quality', label: 'Data Quality', show: 'Replay one record arriving in four shapes and leaving in one standard; resolve a quarantined row with a reason.' },
    { n: '03', name: 'Central data hub', pts: 20, page: 'hub', label: 'Data Hub', show: 'Three zones and twelve certified datasets; trace the R4 250 price back to its raw file, hash and API call.' },
    { n: '04', name: 'Data analytics', pts: 10, page: 'analytics', label: 'Market Analytics', show: 'Four lenses on one event: what happened, why, how unusual, what it cost.' },
    { n: '05', name: 'Monitoring and surveillance', pts: 10, page: 'surveillance', label: 'Surveillance', show: 'Alert queue ranked by score with the reasons shown; build a report from a certified dataset.' },
    { n: '06', name: 'Security', pts: 10, page: 'security', label: 'Security', show: 'MFA flow, four role views of the same data, twelve controls, the audit log.' },
    { n: '07', name: 'Integration', pts: 10, page: 'integrations', label: 'Integrations', show: 'One alert sent through six NERSA systems.' }
  ];
  D.annexure = [
    ['Extract data from multiple sources (direct API, structured and unstructured data)', 'dataops', 'Data Operations'],
    ['Transform and load data from the sources into a standardised format', 'quality', 'Data Quality'],
    ['Knowledge of how core datasets will be developed', 'hub', 'Data Hub'],
    ['Knowledge of how datasets will be analysed', 'analytics', 'Market Analytics'],
    ['Build reports and dashboards for monitoring and surveillance', 'surveillance', 'Surveillance · Reports'],
    ['Meet the security requirements in section 4.3.7', 'security', 'Security'],
    ['Integrate with other organisational applications', 'integrations', 'Integrations'],
    ['Tools to support the MSU’s enforcement process from detection to resolution', 'cases', 'Investigations'],
    ['Reports for governance and oversight, including board-level dashboards', 'reports', 'Reports'],
    ['Drill-down from summary view to underlying detailed data', 'reports', 'Reports · Data Hub']
  ];
})();
