/* Regulatory Data Hub prototype · the always-on analyst agent.
   Content and simulated behaviour: brief, ranked worklist, activity stream,
   standing watches, approvals, and the natural-language question engine.
   Answers are scripted against the synthetic market; the shape of each answer
   (lead, figure, datasets, query, checks) is what the delivered system returns. */
(function () {
  'use strict';
  var R = window.RDH, f = R.f, U = R.ui, D = R.D, C = R.charts, esc = R.esc;
  var AG = R.AG = {}, A = R.cfg.agent;
  AG.model = 'msu-analyst 2027.06'; AG.rules = 'r118';
  AG.stamp = function () { return '<span class="src">model <b>' + AG.model + '</b> · rule set <b>' + AG.rules + '</b></span>'; };

  /* today's forecast, used by the evening watch */
  D.marginToday = D.demandToday.map(function (d, i) { return (27812 + (i >= 12 && i <= 32 ? 900 : 0) - d) / d * 100; });
  D.rsiToday = D.demandToday.map(function (d, i) { return (27812 + (i >= 12 && i <= 32 ? 900 : 0) - 3763) / d; });

  /* ---------- morning brief ---------- */
  AG.brief = function () {
    return '<p><span class="lede">One event from last night needs decisions today.</span>Between 17:30 and 20:00 Kestrel Power declared KST-2 on forced outage while its meter and SCADA both showed about 545 MW ' + U.cite('A-1094', '#/surveillance/A-1094') + '. Eight minutes earlier it re-priced 343 MW to ' + f.price(4250) + ' ' + U.cite('A-1095', '#/surveillance/A-1095') + '. Kestrel was pivotal throughout (RSI ' + f.n(D.rsiPeak, 2) + '), the system price peaked at ' + f.price(4250) + ', ' + f.n(D.z, 1) + 'σ above the 30-day norm, and buyers paid about <b>' + f.zarm(D.harmTotal) + '</b> more than the re-cleared market ' + U.cite('Case 0047', '#/cases/0047') + '.</p>' +
      '<p>Overnight I re-cleared the six intervals, tested four innocent explanations and refuted three, drafted the information request to Kestrel, and assembled six evidence items. The request cannot go out until the MSU lead approves it. Two further alerts arrived: Sable Power Trading’s imbalance pattern ' + U.cite('A-1096', '#/surveillance/A-1096') + ' and a one-second submission cadence at Vaal Energy Traders ' + U.cite('A-1097', '#/surveillance/A-1097') + '.</p>' +
      '<p>Data is sound with two exceptions: the metering file was 47 minutes late, and settlement differs from metered energy by 0.31% for 13 Jul, which is the Kestrel energy with no schedule ' + U.cite('DQ-314', '#/quality') + '. Tonight’s peak is forecast as tight as last night’s, with a ' + f.pct(D.marginToday[37]) + ' margin at 18:30. Three watches are armed.</p>';
  };

  AG.briefBoard = function () {
    return '<p><span class="lede">One matter of significance since the last report.</span>On the evening of 13 July the system price rose to ' + f.price(4250) + ', about three times its norm, for six intervals. The Market Surveillance Unit has opened an investigation into the conduct of one generator. The estimated additional cost to buyers is about <b>' + f.zarm(D.harmTotal, 0) + '</b>. No finding has been made.</p>' +
      '<p>Market data is complete and reconciled, with one feed late this morning. Platform availability is 99.94% against a 99.9% condition. Seven cases are open; twelve have been resolved in the last 90 days.</p>';
  };

  /* ---------- ranked worklist ---------- */
  AG.priorities = [
    { id: 'p-ir', kind: 'Decision', score: 96, title: 'Review the information request to Kestrel Power, then send it for approval', why: 'Case 0047 needs the KST-2 control-room log and trip record before they can be altered or lost. The draft is ready. It needs your review and the MSU lead’s approval before it is issued.', meta: [['cases', 'Case 0047'], ['flag', f.zarm(D.harmTotal) + ' at stake'], ['clock', 'Issue by 10:00'], ['user', 'Approver: Sipho Dlamini']], act: [['Review draft', 'ir-draft', 'pri'], ['Open case', '#/cases/0047']], factors: [['Harm at stake', .97, f.zarm(D.harmTotal)], ['Time-critical evidence', .92, 'Logs held by the participant'], ['Process clock', .80, '10:00 today'], ['Blocks other work', .85, 'Findings cannot start']] },
    { id: 'p-merge', kind: 'Triage', score: 88, title: 'Triage A-1095 and decide whether it joins Case 0047', why: 'The re-pricing and the outage are the same participant, the same six intervals and complementary effects. I suggest one case, so the conduct is assessed as a whole.', meta: [['alert', 'A-1095 · score 81'], ['clock', 'Triage due 10:36'], ['agent', 'Suggestion: merge']], act: [['Accept: merge into 0047', 'merge-1095', 'pri'], ['Open alert', '#/surveillance/A-1095']], factors: [['Alert score', .81, '81 of 100'], ['Triage SLA', .78, '2 h 54 min left'], ['Linked to an open case', .90, 'Case 0047'], ['Effort', .30, 'About 10 min']] },
    { id: 'p-recon', kind: 'Data', score: 79, title: 'Confirm the 0.31% settlement gap is the Kestrel energy', why: 'Settlement and metering differ by 1 635 MWh for 13 Jul, outside the 0.25% tolerance. It matches KST-2 output with no schedule. If you confirm it, the reconciliation becomes evidence item 7.', meta: [['hub', 'DQ-314 · Settlement, Metering'], ['cases', 'Case 0047']], act: [['Open reconciliation', '#/quality', 'pri']], factors: [['Evidential value', .88, 'Third independent source'], ['Data integrity', .70, 'Outside tolerance'], ['Process clock', .40, 'Before month-end close'], ['Effort', .25, 'About 5 min']] },
    { id: 'p-ridge', kind: 'Triage', score: 71, title: 'Triage A-1091: Ridgeline Energy’s third late outage notice in 30 days', why: 'The notice came 2 h 14 min after the trip, against a 60-minute rule, and two offers were amended in the gap. A warning letter was issued for the earlier two on 8 Jul.', meta: [['alert', 'A-1091 · score 57'], ['clock', 'Triage due 16:21'], ['participants', 'Repeat behaviour']], act: [['Open alert', '#/surveillance/A-1091', 'pri']], factors: [['Alert score', .57, '57 of 100'], ['Repeat behaviour', .85, '3 in 30 days'], ['Triage SLA', .45, '8 h 39 min left'], ['Trading in the gap', .60, '2 amendments']] },
    { id: 'p-watch', kind: 'Prepare', score: 66, title: 'Tonight’s peak is as tight as last night’s: confirm the evening watch', why: 'Forecast margin is ' + f.pct(D.marginToday[37]) + ' at 18:30 and Kestrel is pivotal from 17:30 to 19:30. KST-2 is declared available. I will tell you within one cycle if any declaration and meter disagree.', meta: [['clock', 'From 17:00'], ['agent', '3 watches armed']], act: [['Review watches', '#/agent', 'pri'], ['Open market', '#/market']], factors: [['Likelihood of recurrence', .62, 'Same conditions'], ['Potential harm', .90, 'Comparable to 13 Jul'], ['Lead time', .50, '9 h'], ['Effort', .15, 'About 3 min']] },
    { id: 'p-vaal', kind: 'Decision', score: 58, title: 'Decide whether to open Case 0048 on Vaal Energy Traders', why: '212 amendments arrived exactly one second apart through one API key with no user session. That is inconsistent with manual review, which the platform conditions require for five years.', meta: [['alert', 'A-1097 · score 44'], ['agent', 'Proposal: open a case']], act: [['Approve', 'approve:ap-case48', 'pri'], ['Decline', 'decline:ap-case48'], ['Open alert', '#/surveillance/A-1097']], factors: [['Alert score', .44, '44 of 100'], ['Policy significance', .85, 'First test of the ban'], ['Confidence', .68, 'Single source'], ['Harm', .15, 'None estimated']] },
    { id: 'p-code', kind: 'Review', score: 47, title: 'Approve two screen re-mappings after Market Code Rev 2.4', why: 'Two amended clauses change what SCR-02, SCR-04 and SCR-09 test. Until the mappings are approved those screens run on the previous wording.', meta: [['rulebook', 'Rev 2.4 received 12 Jul'], ['agent', '2 proposals']], act: [['Open Market Code', '#/rulebook', 'pri']], factors: [['Rule accuracy', .70, '3 screens affected'], ['Process clock', .35, 'This week'], ['Effort', .30, 'About 10 min'], ['Harm', .10, 'None']] },
    { id: 'p-q', kind: 'Data', score: 35, title: 'Resolve the quarantined meter read (−12.4 MWh)', why: 'One read from LCE-3 failed the validity rule and is held out of the hub. It also feeds Case 0040 on the same unit.', meta: [['hub', 'DQ-312 · Metering'], ['cases', 'Case 0040']], act: [['Resolve', '#/quality', 'pri']], factors: [['Data integrity', .45, '1 of 1 920 reads'], ['Linked to an open case', .50, 'Case 0040'], ['Effort', .15, 'About 2 min'], ['Harm', .05, 'None']] }
  ];

  /* ---------- activity ---------- */
  AG.activity = [
    ['07:41:52', 'screen', 'Ran 10 screens on interval 07:30: 380 offers, 0 exceptions'],
    ['07:30:24', 'analysis', 'Re-cleared interval 07:00 independently: R1 015 against published R1 015'],
    ['07:18:40', 'data', 'Classified 1 participant e-mail as “outage correction”, linked to Ridgeline Energy and A-1091'],
    ['06:47:38', 'data', 'Metering file landed 47 min late: 1 920 reads loaded, 1 quarantined (DQ-312)'],
    ['06:30:00', 'action', 'Published the morning brief to 6 MSU readers'],
    ['06:10:44', 'action', 'Proposed Case 0048 (Vaal Energy Traders). Waiting for approval'],
    ['06:05:12', 'action', 'Drafted information request IR-0047-01. Waiting for approval'],
    ['04:02:10', 'analysis', 'Reconciled settlement to metering for 13 Jul: 0.31% gap, traced to KST-2 (DQ-314)'],
    ['02:14:30', 'detect', 'Raised A-1096: Sable Power Trading, long imbalance on 4 of 6 evening peaks'],
    ['01:20:05', 'analysis', 'Tested four alternative explanations for A-1094: 3 refuted, 1 inconclusive'],
    ['23:05:16', 'detect', 'Raised A-1097: Vaal Energy Traders, 212 amendments at 1.00 s cadence'],
    ['21:40:33', 'analysis', 'Estimated harm for 17:30–20:00 at ' + f.zarm(D.harmTotal) + ' by re-clearing six intervals'],
    ['20:31:02', 'screen', 'KST-2 declared available again. Metered 588 MW. Watch W-01 stood down'],
    ['18:36:20', 'detect', 'Raised A-1095: Kestrel Power, conduct and impact tests both failed'],
    ['18:34:11', 'action', 'Posted alert card A-1094 to Teams, MSU alerts channel'],
    ['18:33:07', 'detect', 'Raised A-1094: KST-2 declared out, metered 545 MW. Score 94'],
    ['18:31:40', 'analysis', 'Corroborated metering against SCADA telemetry: agree within 0.8%'],
    ['18:31:04', 'screen', 'SCR-02 fired on interval 18:30: declared 0 MW, metered 545 MW']
  ];
  var live = [
    ['screen', 'Ran 10 screens on interval {t}: {n} offers, 0 exceptions'],
    ['data', 'Trading platform pull: {m} new submissions, hashes sealed in the raw zone'],
    ['analysis', 'Updated Kestrel Power’s offer profile for tonight: no change against reference'],
    ['screen', 'Checked 23 declarations against metering: all consistent'],
    ['data', 'Dispatch stream healthy: lag 2 s, 720 events in the last hour'],
    ['analysis', 'Refreshed tonight’s forecast: margin ' + f.pct(D.marginToday[37]) + ' at 18:30, unchanged'],
    ['screen', 'Balancing stack scanned: no activation out of merit order'],
    ['data', 'Transparency platform pull: 4 new publications, all within 60 min']
  ];
  var liveN = 0;
  AG.tick = function () {
    var tpl = live[liveN++ % live.length], c = R.clock();
    var row = [c.hms, tpl[0], tpl[1].replace('{t}', f.t(c.h * 2 + (c.m >= 30 ? 1 : 0))).replace('{n}', 360 + (liveN * 7) % 40).replace('{m}', 12 + (liveN * 5) % 30)];
    AG.activity.unshift(row); if (AG.activity.length > 60) AG.activity.pop();
    var ul = R.$('#stream');
    if (ul) { ul.insertAdjacentHTML('afterbegin', AG.row(row, true)); if (ul.children.length > 40) ul.lastElementChild.remove(); }
    var w = R.$('#watch-last'); if (w) w.textContent = c.hms;
  };
  AG.row = function (r, isNew) { var lab = { screen: 'Screen', detect: 'Detect', analysis: 'Analysis', data: 'Data', action: 'Action' }[r[1]]; return '<li class="' + (isNew ? 'new' : '') + '" data-k="' + r[1] + '"><time>' + r[0] + '</time><span class="k ' + r[1] + '">' + lab + '</span><span>' + esc(r[2]) + '</span></li>'; };

  /* ---------- watches, schedule, guardrails, approvals ---------- */
  AG.watches = [
    { id: 'W-01', text: 'Tell me if any Kestrel Power unit is declared unavailable while its meter reads more than 50 MW', rule: 'outages.declared_mw = 0 AND metering.mw > 50 AND participant_id = \'P-007\'', scope: 'Every interval', hits: 6, last: '13 Jul 18:31', by: 'Naledi Mokoena', v: 2 },
    { id: 'W-02', text: 'Warn me when the evening margin is forecast below 6% and a non-incumbent supplier is pivotal', rule: 'forecast.margin_pct < 6 AND rsi < 1.0 AND participant_id <> \'P-001\'', scope: '16:00–21:00', hits: 3, last: 'Today 06:30', by: 'Naledi Mokoena', v: 1 },
    { id: 'W-03', text: 'Flag any offer re-priced by more than 200% within 15 minutes of an interval', rule: 'offer.price / LAG(offer.price) > 3.0 AND minutes_to_interval <= 15', scope: 'Every amendment', hits: 2, last: '13 Jul 17:22', by: 'Sipho Dlamini', v: 3 },
    { id: 'W-04', text: 'Tell me if the metering file is more than 30 minutes late', rule: 'feed = \'metering\' AND arrival > deadline + 30 min', scope: 'Daily 06:00', hits: 2, last: 'Today 06:47', by: 'Johan van Wyk', v: 1 },
    { id: 'W-05', text: 'Watch Ridgeline Energy outage notices against trip times', rule: 'publication_time - trip_time > 60 min AND participant_id = \'P-012\'', scope: 'Every trip event', hits: 3, last: '13 Jul 16:21', by: 'Anika Pillay', v: 1 }
  ];
  AG.schedule = [
    ['Continuous', 'Screen every interval', 'Ten screen families on each closed interval, about 40 s after clearing'],
    ['Continuous', 'Declaration against meter', 'Every outage notice checked against metering and SCADA'],
    ['02:00 daily', 'D+1 reconciliation', 'Settlement, metering and schedules reconciled to source control totals'],
    ['06:30 daily', 'Morning brief', 'What changed overnight, ranked worklist, data exceptions'],
    ['16:00 daily', 'Evening watch set-up', 'Peak forecast, pivotal suppliers, watches armed'],
    ['20:30 daily', 'Evening wrap', 'Peak review and any harm estimate while evidence is fresh'],
    ['Mon 08:00', 'Weekly market conduct report', 'Draft for the MSU lead to sign'],
    ['Monthly', 'Threshold review', 'Proposes recalibration from analyst dispositions; never applies it']
  ];
  AG.guard = [
    ['Does on its own', 'good', ['Screen, score and rank', 'Correlate across sources', 'Re-clear intervals and estimate harm', 'Quarantine records that fail a rule', 'Draft briefs, notes and letters', 'Assemble evidence with hashes']],
    ['Proposes, a named person approves', 'warn', ['Open, merge or close a case', 'Send anything to a participant', 'Change a threshold or a screen', 'Map a Market Code change to a screen', 'Release a quarantined record', 'Publish a report outside the MSU']],
    ['Never does', 'crit', ['Decide an enforcement outcome', 'Contact a participant directly', 'Alter or delete a raw record', 'Act outside its data permissions', 'Use data outside South Africa', 'Hide its reasoning or its sources']]
  ];
  AG.approvals = [
    { id: 'ap-ir', what: 'Send information request IR-0047-01 to Kestrel Power', by: 'MSU lead', ctx: 'Case 0047', go: '#/cases/0047', detail: 'Requests the KST-2 control-room log, trip record and trader communications for 13 Jul, 16:00–21:00.' },
    { id: 'ap-merge', what: 'Merge alert A-1095 into Case 0047', by: 'Analyst', ctx: 'A-1095', go: '#/surveillance/A-1095', detail: 'Same participant and intervals. Merging keeps one evidence bundle and one decision.' },
    { id: 'ap-case48', what: 'Open Case 0048 on Vaal Energy Traders', by: 'Analyst', ctx: 'A-1097', go: '#/surveillance/A-1097', detail: 'Submission cadence inconsistent with manual review.' },
    { id: 'ap-thr', what: 'Raise the bid-pattern threshold from 3.0σ to 3.4σ', by: 'MSU lead', ctx: 'SCR-04', go: '#/surveillance', detail: 'Backtest on 90 days: 11 fewer false positives, no confirmed alert lost.' },
    { id: 'ap-map1', what: 'Map MCR 4.2(a) amendment to SCR-02', by: 'MSU lead', ctx: 'Market Code Rev 2.4', go: '#/rulebook', detail: 'Adds a check for technical cause evidence within one business day.' },
    { id: 'ap-map2', what: 'Map Market Code s.9.3 amendment to SCR-04 and SCR-09', by: 'MSU lead', ctx: 'Market Code Rev 2.4', go: '#/rulebook', detail: 'Gate closure may be extended by notice; timing tests must read the notice.' }
  ];
  AG.pending = function () { return AG.approvals.filter(function (a) { return !R.S.approvals[a.id]; }); };
  R.act.approve = function (el) { AG.decide(el.dataset.id, 'Approved'); };
  R.act.decline = function (el) { AG.decide(el.dataset.id, 'Declined'); };
  AG.decide = function (id, verdict) {
    var a = AG.approvals.filter(function (x) { return x.id === id; })[0]; if (!a) return;
    R.S.approvals[id] = { v: verdict, t: R.clock().hm, by: R.cfg.user.name };
    if (id === 'ap-merge' && verdict === 'Approved') R.S.alertStatus['A-1095'] = 'Merged';
    if (id === 'ap-case48') { R.S.done['p-vaal'] = 1; if (verdict === 'Approved') { D.C['0048'].stage = 1; D.C['0048'].opened = '14 Jul ' + R.clock().hm; D.C['0048'].lead = R.cfg.user.name; R.S.alertStatus['A-1097'] = 'Escalated'; } else R.S.alertStatus['A-1097'] = 'Closed'; }
    if (id === 'ap-merge') R.S.done['p-merge'] = 1;
    R.audit(verdict + ' agent proposal', a.what, a.ctx); R.save(); R.close();
    R.toast(verdict + ': ' + a.what, 'Recorded in the audit log with your name and the time.');
    R.render(true);
  };
  R.act['merge-1095'] = function () { AG.decide('ap-merge', 'Approved'); };
  R.act['ir-draft'] = function () {
    R.modal({
      wide: true, title: 'Information request IR-0047-01 · draft',
      body: '<div class="row mb12">' + U.ai(A + ' draft · not sent') + '<span class="grow"></span>' + AG.stamp() + '</div>' +
        '<div class="doc" contenteditable="true" spellcheck="false"><h5>INFORMATION REQUEST IN TERMS OF THE ELECTRICITY REGULATION ACT, 2006</h5><div>Reference IR-0047-01 · 14 July 2027</div><br><div>To: The Compliance Officer, Kestrel Power (Pty) Ltd (licence GEN-0031)</div><br>' +
        '<div>The Market Surveillance Unit is reviewing the availability declarations and offers submitted for Kestrel Power Station on Tuesday 13 July 2027. Please provide, within five business days:</div><ol style="margin:8px 0 8px 18px;list-style:decimal"><li>The control-room log for unit KST-2 from 16:00 to 21:00, including any trip, runback or protection operation.</li><li>The technical cause relied on for outage notice ON-2027-0713-044, with supporting records.</li><li>An explanation of the metered output of approximately 545 MW from KST-2 between 17:30 and 20:00.</li><li>The reason for the offer amendments submitted at 17:22:08 for KST-5 and KST-GT1, and the cost basis for the amended prices.</li><li>All communications between the trading desk and the station between 16:00 and 21:00.</li></ol>' +
        '<div>Records relating to these matters must be preserved in their current form. This request does not imply that a contravention has occurred.</div><br><div>Issued for the Market Surveillance Unit, National Energy Regulator of South Africa.</div></div>' +
        '<div class="note mt12">You can edit the text above. Sending it to the MSU lead records your review; only the MSU lead can issue it to the participant.</div>',
      foot: '<button class="btn" data-act="close">Close</button><button class="btn pri" data-act="ir-send" data-write>' + R.icon('send') + 'Send to MSU lead for approval</button>'
    });
  };
  R.act['ir-send'] = function () { R.S.done['p-ir'] = 1; R.S.flags.irSent = R.clock().hm; R.audit('Reviewed and forwarded', 'Information request IR-0047-01', 'To Sipho Dlamini for approval'); R.save(); R.close(); R.toast('Sent to Sipho Dlamini for approval', 'IR-0047-01 stays a draft until the MSU lead issues it.'); R.render(true); };

  /* ---------- question engine ---------- */
  function harmTable() {
    return U.table([{ h: 'Interval', k: 't' }, { h: 'System price', num: 1, f: function (h) { return f.n(h.price); } }, { h: 'Re-cleared price', num: 1, f: function (h) { return f.n(h.cf); } }, { h: 'Uplift, R/MWh', num: 1, f: function (h) { return f.n(h.uplift); } }, { h: 'Energy, MWh', num: 1, f: function (h) { return f.n(h.mwh); } }, { h: 'Cost to buyers', num: 1, f: function (h) { return f.zarm(h.harm); } }], D.harm, { dense: true });
  }
  var evBand = [{ from: D.EV_FROM, to: D.EV_TO, label: 'KST-2 declared out' }];
  AG.intents = [
    { id: 'spike', q: 'Why did the price spike at 18:30 yesterday?', keys: /spike|18:30|18h30|price.*(yesterday|last night)|what happened|why.*price/i,
      lead: function () { return '<p>The system price reached <b>' + f.price(4250) + '</b> at 18:30 on 13 Jul, 208% above the 30-day norm of ' + f.price(1380) + ' for that interval.</p><p>Demand was ordinary for a winter evening (' + f.mw(26140) + '). The cause was on the supply side: Kestrel Power declared KST-2 (600 MW) on forced outage from 17:30 and, eight minutes before, re-priced a further 343 MW to R4 250. With the margin at ' + f.pct(D.reserveMargin) + ', those 343 MW became the marginal offer and set the price for six intervals.</p>'; },
      viz: function () { return U.legend([{ c: 'var(--s1)', t: 'System price' }, { c: '#a29ea9', t: '30-day norm ±1σ', sq: 1 }]) + C.xy({ h: 210, x: D.times, xEvery: 6, series: [{ name: 'System price', data: D.price, color: '#17090c' }, { name: '30-day norm', data: D.norm, color: '#a29ea9', width: 1.5 }], band: { lo: D.norm.map(function (p, i) { return p - D.sigma[i]; }), hi: D.norm.map(function (p, i) { return p + D.sigma[i]; }), name: '±1σ' }, bands: evBand, marks: [{ i: 37, label: 'R 4 250 at 18:30', color: '#d7143c' }], tfmt: f.price, yunit: 'R/MWh' }); },
      ds: ['Prices and results', 'Outages and availability', 'Offers and bids', 'Metering'], rows: 4416, ms: 840,
      sql: "SELECT p.interval_start, p.system_price, n.norm_price, n.sigma,\n       (p.system_price - n.norm_price) / n.sigma AS z_score\nFROM curated.prices_results p\nJOIN curated.price_norm_30d n ON n.interval_of_day = p.interval_of_day\nWHERE p.trading_day = '2027-07-13'\nORDER BY p.interval_start;\n-- joined to outages (notice ON-2027-0713-044) and offer amendments at 17:22:08",
      checks: ['Price confirmed against the Market Operator’s published result and the hub’s own re-clear', 'Demand within 0.4σ of the norm, so demand does not explain the spike', 'Outage notice read at 0.97 confidence; return-to-service field at 0.91'],
      follow: ['How much did it cost buyers?', 'Was Kestrel pivotal?', 'Show Kestrel’s offer changes before 17:30'], open: ['Open in Market Analytics', '#/analytics'] },
    { id: 'cost', q: 'How much did it cost buyers?', keys: /cost|harm|how much|buyers|damage|impact/i,
      lead: function () { return '<p>About <b>' + f.zarm(D.harmTotal) + '</b> across six intervals, 17:30 to 20:00.</p><p>I re-cleared each interval with KST-2 offered at its reference level (R1 050) and the two re-priced tranches at theirs. The difference between the actual and re-cleared price, multiplied by the energy bought, is the cost to buyers. It is an estimate of market impact, not a finding of loss.</p>'; },
      viz: function () { return harmTable(); },
      ds: ['Prices and results', 'Offers and bids', 'Resource register'], rows: 2268, ms: 1320,
      sql: "WITH recleared AS (\n  SELECT interval_start, hub.reclear(interval_start,\n         override => 'KST-2@reference, KST-5.T2@reference, KST-GT1@reference') AS cf_price\n  FROM curated.prices_results\n  WHERE interval_start BETWEEN '2027-07-13 17:30' AND '2027-07-13 20:00')\nSELECT p.interval_start, p.system_price, r.cf_price,\n       (p.system_price - r.cf_price) * p.cleared_mwh AS cost_to_buyers\nFROM curated.prices_results p JOIN recleared r USING (interval_start);",
      checks: ['Re-clear reproduces the published price in all 42 unaffected intervals of the day', 'Sensitivity: with reference levels 10% higher the estimate is R172m; 10% lower, R185m', 'Excludes reserve and constraint costs, so it is likely a floor'],
      follow: ['Who paid the most?', 'Summarise Case 0047 for the Board'], open: ['Open Case 0047', '#/cases/0047'] },
    { id: 'pivotal', q: 'Was Kestrel pivotal?', keys: /pivotal|rsi|residual supply|market power/i,
      lead: function () { return '<p>Yes. Kestrel Power’s residual supply index fell below 1.00 from 17:00 and was <b>' + f.n(D.rsiPeak, 2) + '</b> at 18:30, so demand could not be met without its capacity.</p><p>With KST-2 available the margin would have been 6.4%; with it declared out the margin was ' + f.pct(D.reserveMargin) + '. Kestrel was pivotal either way, which is why the conduct tests apply.</p>'; },
      viz: function () { return R.fig.rsi(210); },
      ds: ['Prices and results', 'Resource register', 'Outages and availability'], rows: 1968, ms: 610,
      sql: "SELECT interval_start,\n       (SUM(available_mw) - SUM(CASE WHEN participant_id = 'P-007' THEN available_mw END))\n       / MAX(demand_mw) AS rsi\nFROM curated.availability_by_interval\nWHERE trading_day = '2027-07-13'\nGROUP BY interval_start;",
      checks: ['Availability taken from declarations, so the declared outage is included', 'Highveld Generation is pivotal in every interval and is screened on conduct, not structure'],
      follow: ['How often is a non-incumbent pivotal at the evening peak?', 'Why did the price spike at 18:30 yesterday?'], open: ['Open in Market Analytics', '#/analytics'] },
    { id: 'declared', q: 'Which units were declared unavailable while metered above zero in the last 30 days?', keys: /declared|unavailable|metered above|contradict/i,
      lead: function () { return '<p>Three units on four days. One is material: <b>KST-2 on 13 Jul</b>, declared out for six intervals while metered at about 545 MW. The other three are short overlaps at the start or end of genuine outages, each under 30 minutes and under 60 MW.</p>'; },
      viz: function () { return U.table([{ h: 'Unit', k: 0, cls: 't1' }, { h: 'Participant', k: 1 }, { h: 'Day', k: 2 }, { h: 'Intervals', k: 3, num: 1 }, { h: 'Avg metered, MW', k: 4, num: 1 }, { h: 'Assessment', k: 5 }], [['KST-2', 'Kestrel Power', '13 Jul', 6, 545, U.tag('Alert A-1094', 'crit')], ['RDG-1', 'Ridgeline Energy', '2 Jul', 1, 58, U.tag('Run-down after trip')], ['LPP GT 2', 'Lowveld Peaking Power', '26 Jun', 1, 41, U.tag('Run-down after trip')], ['RDG-1', 'Ridgeline Energy', '21 Jun', 1, 22, U.tag('Return to service')]], { dense: true }); },
      ds: ['Outages and availability', 'Metering'], rows: 593280, ms: 1890,
      sql: "SELECT o.resource_id, o.trading_day, COUNT(*) AS intervals, AVG(m.metered_mw) AS avg_mw\nFROM curated.outages_availability o\nJOIN curated.metering m USING (resource_id, interval_start)\nWHERE o.declared_available_mw = 0 AND m.metered_mw > 20\n  AND o.trading_day >= '2027-06-14'\nGROUP BY o.resource_id, o.trading_day\nORDER BY avg_mw DESC;",
      checks: ['20 MW floor removes house-load and metering noise', 'Each row cross-checked against SCADA telemetry'],
      follow: ['Why did the price spike at 18:30 yesterday?', 'Save this as a standing watch'], open: ['Open Participants', '#/participants/P-007'] },
    { id: 'offers', q: 'Show Kestrel’s offer changes before 17:30', keys: /offer|re-?pric|amend|bid/i,
      lead: function () { return '<p>At <b>17:22:08</b> Kestrel amended two offers for intervals from 17:30: KST-5 tranche 2 (180 MW) from R1 120 to R4 250, and KST-GT1 (163 MW) from R3 900 to R4 250. Nothing else in its portfolio changed. The KST-2 outage notice followed at 17:30.</p><p>Against its reference level, the KST-5 tranche is 279% higher. No cost update was filed.</p>'; },
      viz: function () { return U.table([{ h: 'Resource', k: 0, cls: 't1' }, { h: 'MW', k: 1, num: 1 }, { h: 'Reference', k: 2, num: 1 }, { h: 'Before 17:22', k: 3, num: 1 }, { h: 'After 17:22', k: 4, num: 1 }, { h: 'Change', k: 5, num: 1 }], D.kestrelUnits.map(function (u) { var before = u.id === 'KST-5' ? 1120 : u.id === 'KST-GT1' ? 3900 : u.offer, after = u.id === 'KST-5' ? 4250 : u.offer, ch = before && after && before !== after; return [u.id + (u.id === 'KST-5' ? ' tranche 2' : ''), u.id === 'KST-5' ? 180 : u.mw, f.n(u.id === 'KST-5' ? 1120 : u.ref), before ? f.n(before) : '–', after ? f.n(after) : 'Declared out', ch ? '<b>+' + f.pct((after / before - 1) * 100, 0) + '</b>' : '<span class="faint">none</span>']; }), { dense: true, row: function (r) { return r[5].indexOf('<b>') === 0 ? 'class="hl"' : ''; } }); },
      ds: ['Offers and bids', 'Resource register'], rows: 1164, ms: 520,
      sql: "SELECT resource_id, tranche, price AS new_price,\n       LAG(price) OVER (PARTITION BY resource_id, tranche ORDER BY submitted_at) AS old_price,\n       submitted_at, submitted_by\nFROM curated.offers_bids\nWHERE participant_id = 'P-007' AND trading_day = '2027-07-13'\n  AND submitted_at BETWEEN '17:00' AND '17:30';",
      checks: ['Amendment records taken from the raw zone, hash verified', 'Submitted by a named user session, not an API key'],
      follow: ['How much did it cost buyers?', 'Was Kestrel pivotal?'], open: ['Open alert A-1095', '#/surveillance/A-1095'] },
    { id: 'data', q: 'Is any data feed late or failing quality rules?', keys: /feed|late|quality|data (alert|issue|problem)|quarantin|ingest/i,
      lead: function () { return '<p>Twelve of thirteen feeds are on time. <b>Metering</b> arrived 47 minutes late this morning and has since loaded in full. Three records are quarantined, and one reconciliation is outside tolerance: settlement against metering for 13 Jul, by 0.31%.</p>'; },
      viz: function () { return U.table([{ h: '', f: function (a) { return '<span class="dot ' + a.sev + '"></span>'; }, w: '20px' }, { h: 'Exception', f: function (a) { return '<div class="t1">' + a.title + '</div>'; } }, { h: 'Dataset', k: 'ds' }, { h: 'Status', f: function (a) { return U.tag(a.status, a.status === 'Recovered' ? 'good' : ''); } }], D.dataAlerts, { dense: true }); },
      ds: ['Control and audit'], rows: 13, ms: 190,
      sql: "SELECT feed, expected_at, arrived_at, records, quarantined\nFROM control.feed_runs\nWHERE run_day = '2027-07-14'\nORDER BY (arrived_at > expected_at) DESC;",
      checks: ['Feed status read from pipeline run records, not from the sources’ own reports'],
      follow: ['Which units were declared unavailable while metered above zero in the last 30 days?'], open: ['Open Data Operations', '#/dataops'] },
    { id: 'tonight', q: 'What should I watch tonight?', keys: /tonight|this evening|forecast|watch/i,
      lead: function () { return '<p>The 18:30 peak is forecast at ' + f.mw(D.demandToday[37]) + ' with a <b>' + f.pct(D.marginToday[37]) + '</b> margin, below the 6% watch level from 17:30 to 19:30. Kestrel Power will be pivotal across those intervals (RSI ' + f.n(D.rsiToday[37], 2) + ').</p><p>KST-2 is declared available. If a declaration and a meter disagree, or an offer is re-priced by more than 200% inside 15 minutes of an interval, you will hear within one cycle.</p>'; },
      viz: function () { return C.xy({ h: 190, x: D.times, xEvery: 6, ymin: 0, ymax: 50, yticks: 5, series: [{ name: 'Margin', data: D.marginToday, color: '#17090c', dashFrom: D.NOW }], hlines: [{ v: 6, label: 'Watch level 6%', left: 1 }], cursor: D.NOW, cursorLabel: 'Now', marks: [{ i: 37, label: f.pct(D.marginToday[37]) + ' at 18:30', dy: -8 }], yfmt: function (v) { return v + '%'; }, tfmt: function (v) { return f.pct(v); }, tipNote: function (i) { return i > D.NOW ? 'Forecast' : 'Actual'; } }); },
      ds: ['Prices and results', 'Outages and availability', 'Resource register'], rows: 96, ms: 430,
      sql: "SELECT interval_start, (available_mw - forecast_demand_mw) / forecast_demand_mw AS margin\nFROM curated.day_ahead_outlook\nWHERE trading_day = '2027-07-14';",
      checks: ['Demand forecast from the System Operator, 06:00 issue', 'Availability from current declarations; it changes if a unit is declared out'],
      follow: ['Why did the price spike at 18:30 yesterday?'], open: ['Open Market Overview', '#/market'] },
    { id: 'top', q: 'Which participants carry the most surveillance risk this quarter?', keys: /top|rank|most|risk|participants?/i,
      lead: function () { return '<p><b>Kestrel Power</b> leads by a wide margin after last night, followed by Ridgeline Energy (repeated late disclosures) and Sable Power Trading (imbalance pattern under a live remediation order). The rating combines open alert scores, repeat behaviour and case outcomes over 90 days.</p>'; },
      viz: function () { return U.hbar(D.participants.slice().sort(function (a, b) { return b.risk - a.risk; }).slice(0, 7).map(function (p, i) { return { l: p.short, v: p.risk, em: i === 0, mute: i > 0 }; }), { max: 100 }); },
      ds: ['Control and audit', 'Participant register'], rows: 117, ms: 280,
      sql: "SELECT participant_id, hub.risk_rating(participant_id, window_days => 90) AS rating\nFROM curated.participant_register\nORDER BY rating DESC LIMIT 7;",
      checks: ['Rating is an ordering aid for analysts; it is not a finding and is not shared with participants'],
      follow: ['Show Kestrel’s offer changes before 17:30'], open: ['Open Participants', '#/participants'] },
    { id: 'board', q: 'Summarise Case 0047 for the Board', keys: /summar|board|brief|draft/i,
      lead: function () { return '<p class="muted">Draft for review. Nothing here has been sent.</p><p><b>Case 0047, Kestrel Power (Pty) Ltd.</b> On the evening of 13 July 2027 Kestrel Power declared unit KST-2 (600 MW) on forced outage from 17:30 to 20:30. Metering and System Operator telemetry both show the unit generating about 545 MW throughout. Shortly before, Kestrel re-priced a further 343 MW to R4 250/MWh. Kestrel was a pivotal supplier in each affected interval.</p><p>The system price rose to R4 250/MWh, 208% above the 30-day norm. The Unit estimates the additional cost to buyers at about ' + f.zarm(D.harmTotal) + '. The matter is in investigation; an information request is being issued. No finding has been made.</p>'; },
      viz: function () { return ''; },
      ds: ['Case record 0047', 'Prices and results', 'Metering'], rows: 6, ms: 2100,
      sql: "-- Composed from the case record and its six evidence items.\n-- Every figure in the text links to its evidence item and source dataset.",
      checks: ['Each number matches the case record', 'Wording avoids any conclusion on intent or contravention', 'Marked Confidential; not released outside the MSU without approval'],
      follow: ['How much did it cost buyers?'], open: ['Open Case 0047', '#/cases/0047'] },
    { id: 'conc', q: 'How concentrated is the market, and is it improving?', keys: /concentrat|hhi|market share|competition/i,
      lead: function () { return '<p>The market is highly concentrated: HHI is <b>' + f.n(D.hhi) + '</b> at the evening peak, against a 1 800 threshold. Highveld Generation holds ' + f.pct(D.shares[0].pct) + ' of available capacity.</p><p>It is improving slowly. HHI has fallen about 500 points in twelve months as independent producers enter.</p>'; },
      viz: function () { return C.xy({ h: 190, x: D.months, series: [{ name: 'HHI', data: D.hhiTrend, color: '#17090c' }], hlines: [{ v: 1800, label: 'Highly concentrated above 1 800' }], ymin: 0, ymax: 5000, marks: [{ i: 11, label: f.n(D.hhi) }], tfmt: f.n }); },
      ds: ['Resource register', 'Outages and availability'], rows: 4944, ms: 390,
      sql: "SELECT month, SUM(POWER(share_pct, 2)) AS hhi\nFROM curated.capacity_share_peak\nGROUP BY month ORDER BY month;",
      checks: ['Shares by available capacity at the evening peak, monthly average'],
      follow: ['Was Kestrel pivotal?'], open: ['Open in Market Analytics', '#/analytics'] }
  ];
  AG.match = function (q) {
    var exact = AG.intents.filter(function (i) { return i.q.toLowerCase() === q.trim().toLowerCase(); })[0];
    if (exact) return exact;
    var order = ['cost', 'pivotal', 'declared', 'offers', 'data', 'tonight', 'board', 'conc', 'spike', 'top'];
    for (var k = 0; k < order.length; k++) { var it = AG.intents.filter(function (i) { return i.id === order[k]; })[0]; if (it.keys.test(q)) return it; }
    return null;
  };
  AG.suggest = ['Why did the price spike at 18:30 yesterday?', 'How much did it cost buyers?', 'Which units were declared unavailable while metered above zero in the last 30 days?', 'What should I watch tonight?', 'Is any data feed late or failing quality rules?', 'Summarise Case 0047 for the Board'];
  AG.thread = [];
  AG.ask = function (q) {
    q = (q || '').trim(); if (!q) return;
    AG.draft = '';
    var it = AG.match(q), item = { q: q, it: it, state: 'run', step: 0, t: R.clock().hm };
    AG.thread.unshift(item);
    R.audit('Question asked', q.slice(0, 80), it ? 'Datasets: ' + it.ds.join(', ') : 'Not answered');
    if (R.route().page !== 'ask') { location.hash = '#/ask'; } else R.render();
    var timer = setInterval(function () {
      item.step++;
      if (item.step >= 4) { item.state = 'done'; clearInterval(timer); }
      if (R.route().page === 'ask') R.render(true);
    }, 380);
  };
})();
