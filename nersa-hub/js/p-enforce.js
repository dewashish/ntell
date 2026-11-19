/* Regulatory Data Hub prototype · enforce pages: Investigations, Reports */
(function () {
  'use strict';
  var R = window.RDH, f = R.f, U = R.ui, D = R.D, C = R.charts, AG = R.AG, esc = R.esc, icon = R.icon, A = R.cfg.agent;
  var BLUE = '#2a78d6', ORANGE = '#eb6834', GREY = '#98a2b3';
  function priTone(p) { return { Critical: 'crit', High: 'high', Medium: 'warn', Low: '' }[p]; }
  function short(h) { return h.slice(0, 12) + '…' + h.slice(-6); }

  /* SHA-256 where the browser offers it; a plain rolling digest otherwise, so the flow still runs from file:// */
  function digest(text) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); });
    }
    var out = '', h = 2166136261;
    for (var r = 0; r < 8; r++) { for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i) + r; h = Math.imul(h, 16777619); } out += ('0000000' + (h >>> 0).toString(16)).slice(-8); }
    return Promise.resolve(out);
  }
  function bundleText() { return D.evidence.map(function (e) { return e.n + ':' + e.hash; }).join('|') + '|case:0047'; }

  /* ======================= INVESTIGATIONS ======================= */
  var replay = { i: D.EV, timer: null };
  R.pages.cases = {
    id: 'cases', title: 'Investigations', group: 'Enforce', icon: 'cases',
    render: function (r) {
      if (r.sub && D.C[r.sub]) return caseView(D.C[r.sub]);
      var brd = R.S.role === 'board', open = D.cases.filter(function (c) { return c.stage < 5; }), closed = D.cases.filter(function (c) { return c.stage === 5; });
      var h = U.phead('Investigations', 'Every case from detection to resolution, with each step on the record: who did what, when and why.', 'RFI 4.3.5', '');
      h += U.kpis([{ label: 'Open cases', value: open.length, note: open.filter(function (c) { return c.pri === 'Critical' || c.pri === 'High'; }).length + ' high priority or above' }, { label: 'Estimated cost under investigation', value: f.zarm(R.sum(open, function (c) { return c.harm || 0; }), 0), note: 'open cases with an estimate' }, { label: 'Median age, open cases', value: '36<small>days</small>', note: 'target under 60' }, { label: 'Resolved, last 90 days', value: '12', note: '4 with an enforcement outcome' }, { label: 'Evidence bundles sealed', value: 9 + (R.S.sealed ? 1 : 0), note: 'all verifiable by hash', tone: 'good' }]);
      h += '<div class="kan mt12">' + D.stages.map(function (s, i) {
        var cs = D.cases.filter(function (c) { return c.stage === i; });
        return '<div class="kan__c"><h4><span>' + s + '</span><span class="mono faint">' + (i === 5 ? 12 : cs.length) + '</span></h4>' + cs.map(function (c) {
          return '<a class="kan__i" href="#/cases/' + c.id + '"><div class="row"><span class="mono">' + c.id + '</span><span class="grow"></span>' + U.tag(c.pri, priTone(c.pri)) + '</div><div class="t1 mt4" style="font-weight:500">' + D.P[c.p].short + '</div><div class="muted" style="font-size:12px">' + (brd ? 'Detail not shown to this role' : esc(c.title)) + '</div>' + (c.harm ? '<div class="num mt4" style="font-size:12px">' + f.zarm(c.harm) + '</div>' : '') + '</a>';
        }).join('') + (i === 5 ? '<div class="muted" style="padding:0 10px 8px;font-size:12px">and 9 more</div>' : '') + '</div>';
      }).join('') + '</div>';
      h += '<div class="mt12">' + U.card('All cases', U.table([{ h: 'Case', k: 'id', cls: 'mono t1' }, { h: 'Participant', f: function (c) { return D.P[c.p].name; } }, { h: 'Matter', f: function (c) { return brd ? '<span class="faint">Not shown to this role</span>' : esc(c.title); } }, { h: 'Basis', k: 'clause', cls: 'mono t2 nowrap' }, { h: 'Stage', f: function (c) { return U.tag(D.stages[c.stage], c.stage === 5 ? '' : 'info'); } }, { h: 'Priority', f: function (c) { return U.tag(c.pri, priTone(c.pri)); } }, { h: 'Estimated cost', num: 1, f: function (c) { return c.harm ? f.zarm(c.harm) : '<span class="faint">–</span>'; } }, { h: 'Lead', f: function (c) { return U.person(c.lead); } }, { h: 'Next', f: function (c) { return '<span class="t2">' + (c.outcome ? c.outcome + ' · ' + c.closed : c.due) + '</span>'; } }], open.concat(closed), { row: function (c) { return 'class="click" data-go="#/cases/' + c.id + '"'; } }), { flush: true, cls: 'scroll-x' }) + '</div>';
      return h;
    },
    mount: function (root, r) {
      var s = R.$('#replay', root); if (s) s.addEventListener('input', function () { replay.i = +s.value; stop(); R.render(true); });
    }
  };
  function stop() { if (replay.timer) { clearInterval(replay.timer); replay.timer = null; } }
  R.act['replay-play'] = function () {
    if (replay.timer) { stop(); R.render(true); return; }
    if (replay.i >= 41) replay.i = 34;
    replay.timer = setInterval(function () { if (R.route().page !== 'cases' || R.tab('case', 'overview') !== 'replay') { stop(); return; } if (replay.i >= 41) { stop(); R.render(true); return; } replay.i++; R.render(true); }, 1100);
    R.render(true);
  };
  R.act['replay-to'] = function (el) { stop(); replay.i = +el.dataset.v; R.render(true); };

  function caseView(c) {
    var p = D.P[c.p], full = c.id === '0047', brd = R.S.role === 'board', tab = full && !brd ? R.tab('case', 'overview') : 'overview';
    var merged = R.S.alertStatus['A-1095'] === 'Merged';
    var h = '<div class="row mb8"><a href="#/cases" class="muted">Investigations</a></div>' +
      U.phead('Case ' + c.id + ' · ' + p.name, esc(c.title) + '.', 'RFI 4.3.5', U.tag(c.pri, priTone(c.pri)) + (full && !brd ? '<button class="btn" data-act="case-export">' + icon('download') + 'Export case file</button>' : ''));
    h += U.steps(D.stages.map(function (s, i) { return { t: s, d: i === c.stage ? (c.stage === 5 ? c.outcome : 'now') : i < c.stage ? '' : '' }; }), c.stage);
    if (brd) return h + '<div class="note warn mt12" style="max-width:720px">The Board role sees case status only. Evidence, participant-level data and working papers stay within the MSU.</div>' + '<div class="mt12">' + U.card('Status', U.kv([['Stage', D.stages[c.stage]], ['Opened', c.opened], ['Basis', c.clause], ['Estimated cost to buyers', c.harm ? f.zarm(c.harm) : 'Not estimated'], ['Next step', c.due || c.outcome]])) + '</div>';
    if (!full) {
      return h + '<div class="grid g-2-1 mt12">' + U.card('Case record', U.kv([['Participant', '<a href="#/participants/' + p.id + '">' + p.name + '</a>'], ['Matter', esc(c.title)], ['Basis', '<span class="mono">' + c.clause + '</span>'], ['Opened', c.opened], ['Lead', U.person(c.lead)], ['Estimated cost', c.harm ? f.zarm(c.harm) : 'Not estimated'], [c.outcome ? 'Outcome' : 'Next step', c.outcome ? c.outcome + ', ' + c.closed : c.due]])) +
        U.card('In this prototype', '<p class="muted">Case 0047 carries the full record: event replay, evidence bundle, requests and decision. The other cases show their register entry.</p><a class="btn mt12" href="#/cases/0047">Open Case 0047</a>') + '</div>' +
        (c.id === '0048' && !R.S.approvals['ap-case48'] ? '<div class="note info mt12"><div class="row">' + U.ai(A + ' proposal') + '<span>This case is proposed, not open. It needs an analyst’s approval.</span><span class="grow"></span><button class="btn sm pri" data-write data-act="approve" data-id="ap-case48">Approve</button><button class="btn sm" data-write data-act="decline" data-id="ap-case48">Decline</button></div></div>' : '');
    }
    h += '<div class="mt16"></div>' + U.tabs('case', [{ id: 'overview', label: 'Overview' }, { id: 'replay', label: 'Event replay' }, { id: 'evidence', label: 'Evidence', n: D.evidence.length }, { id: 'requests', label: 'Requests and tasks' }, { id: 'timeline', label: 'Timeline and audit' }, { id: 'decision', label: 'Decision' }], tab);

    if (tab === 'overview') {
      h += '<div class="grid g-3-2"><div class="stack">' +
        U.card('Summary', '<div class="brief" style="font-size:13.5px"><p>On 13 July 2027 Kestrel Power declared KST-2 (600 MW) on forced outage from 17:30 to 20:30. Metering and System Operator telemetry both show the unit generating about 545 MW throughout. At 17:22 Kestrel re-priced a further 343 MW to ' + f.price(4250) + '.</p><p>Kestrel was pivotal in each of the six affected intervals. The system price peaked at ' + f.price(4250) + ' against a re-cleared price of ' + f.price(1380) + '. The estimated additional cost to buyers is ' + f.zarm(D.harmTotal) + '.</p><p>No finding has been made. The next step is the information request for the unit’s control-room log and trading-desk communications.</p></div>', { act: U.ai(A + ' draft · reviewed by N. Mokoena'), foot: AG.stamp() }) +
        U.card('Explanations tested', '<ul class="hyp" style="padding:4px 12px">' + D.A['A-1094'].alt.map(function (x) { return '<li><div>' + U.tag(x[1].charAt(0).toUpperCase() + x[1].slice(1), x[1] === 'refuted' ? '' : 'warn') + '</div><div><div class="t1" style="font-weight:500">' + x[0] + '</div><div class="muted">' + x[2] + '</div></div></li>'; }).join('') + '</ul>', { flush: true, sub: 'innocent explanations, each checked against a second source', foot: 'An explanation marked inconclusive stays open until the participant answers.' }) +
        '</div><div class="stack">' +
        U.card('Key facts', U.kv([['Participant', '<a href="#/participants/P-007">' + p.name + '</a> · <span class="mono">GEN-0031</span>'], ['Resources', 'KST-2, KST-5 tranche 2, KST-GT1'], ['Period', '13 Jul 2027, 17:30–20:00, six intervals'], ['Basis', '<span class="mono">' + c.clause + '</span>'], ['Alerts', U.cite('A-1094', '#/surveillance/A-1094') + (merged ? U.cite('A-1095', '#/surveillance/A-1095') : ' <span class="muted">A-1095 suggested for merging</span>')], ['Estimated cost', '<b>' + f.zarm(D.harmTotal) + '</b> (range R 172m–185m)'], ['Opened', c.opened + ' by Naledi Mokoena'], ['Lead', U.person(c.lead)], ['Evidence', R.S.sealed ? 'Bundle sealed ' + R.S.sealed.t : 'Six items, bundle not yet sealed']])) +
        U.card('Declared against metered', R.fig.declared(190, 'event'), { sub: 'evidence items 1 to 3' }) + '</div></div>';
    }
    if (tab === 'replay') {
      var i = replay.i, after = i >= D.EV_FROM, amended = i >= 35, x0 = 30, x1 = 44, xs = D.times.slice(x0, x1 + 1);
      var notes = [[34, '17:00', 'Normal operation. KST-2 metered 592 MW.'], [34, '17:22', 'Kestrel amends offers: KST-5 tranche 2 and KST-GT1 to R 4 250.'], [35, '17:30', 'Outage notice ON-2027-0713-044: KST-2 forced outage, 600 MW.'], [36, '18:00', 'Kestrel pivotal. RSI 0.92. Margin 4.1%.'], [37, '18:31', 'SCR-02 fires. Metering and SCADA agree at 545 MW.'], [37, '18:33', 'Alert A-1094 raised, score 94. Teams card posted.'], [38, '18:52', 'Case 0047 opened by the analyst on duty.'], [41, '20:31', 'KST-2 declared available. Metered 588 MW.']].filter(function (n) { return n[0] <= i; }).reverse();
      h += '<div class="replay mb12"><button class="btn pri" data-act="replay-play">' + icon(replay.timer ? 'pause' : 'play') + (replay.timer ? 'Pause' : 'Play') + '</button><div><input type="range" id="replay" min="34" max="41" step="1" value="' + i + '" aria-label="Replay interval"><div class="row" style="justify-content:space-between;font:400 11px var(--mono);color:var(--ink-3)">' + D.times.slice(34, 42).map(function (t, k) { return '<button class="btn ghost sm" style="padding:0 2px;height:18px;font:inherit;color:' + (34 + k === i ? 'var(--navy)' : 'inherit') + '" data-act="replay-to" data-v="' + (34 + k) + '">' + t + '</button>'; }).join('') + '</div></div><div class="right"><div class="muted" style="font-size:11.5px">Market as it stood at</div><div class="t">' + f.t(i) + '</div></div></div>';
      h += U.kpis([{ label: 'System price', value: f.n(D.price[i]), unit: 'R/MWh', note: 'norm ' + f.n(D.norm[i]), tone: D.price[i] > 2 * D.norm[i] ? 'crit' : '' }, { label: 'KST-2 declared', value: f.n(D.kstDeclared[i]), unit: 'MW', note: D.kstDeclared[i] ? 'available' : 'forced outage', tone: D.kstDeclared[i] ? '' : 'warn' }, { label: 'KST-2 metered', value: f.n(D.kstMetered[i]), unit: 'MW', note: D.kstDeclared[i] ? 'consistent' : 'contradicts the declaration', tone: D.kstDeclared[i] ? '' : 'crit' }, { label: 'RSI, Kestrel Power', value: f.n(D.rsi[i], 2), note: D.rsi[i] < 1 ? 'pivotal' : 'not pivotal', tone: D.rsi[i] < 1 ? 'warn' : '' }, { label: 'Supply margin', value: f.pct(D.margin[i]), note: D.margin[i] < 6 ? 'below watch level' : '' }]);
      h += '<div class="grid g-3-2 mt12"><div class="stack">' + U.card('Price and output through the evening', U.legend([{ c: BLUE, t: 'System price, R/MWh' }, { c: GREY, t: '30-day norm' }]) + C.xy({ h: 200, x: xs, xEvery: 2, ymin: 0, ymax: 5000, series: [{ name: '30-day norm', data: D.norm.slice(x0, x1 + 1), color: GREY, width: 1.5 }, { name: 'System price', data: D.price.slice(x0, x1 + 1).map(function (v, k) { return x0 + k <= i ? v : null; }), color: BLUE }], bands: [{ from: D.EV_FROM - x0, to: D.EV_TO - x0 }], cursor: i - x0, cursorLabel: f.t(i), tfmt: f.price }) +
        '<div class="mt12">' + U.legend([{ c: BLUE, t: 'KST-2 metered, MW' }, { c: '#3a4453', t: 'KST-2 declared, MW', dash: 1 }]) + '</div>' + C.xy({ h: 150, x: xs, xEvery: 2, ymin: 0, ymax: 700, yticks: 7, series: [{ name: 'Declared', data: D.kstDeclared.slice(x0, x1 + 1).map(function (v, k) { return x0 + k <= i ? v : null; }), color: '#3a4453', type: 'step', dash: 1, width: 1.5 }, { name: 'Metered', data: D.kstMetered.slice(x0, x1 + 1).map(function (v, k) { return x0 + k <= i ? v : null; }), color: BLUE }], bands: [{ from: D.EV_FROM - x0, to: D.EV_TO - x0 }], cursor: i - x0, tfmt: f.mw }), { foot: 'Rebuilt from the immutable raw zone: every record as it stood at ' + f.t(i) + ':59, not as later corrected.' }) + '</div><div class="stack">' +
        U.card('Kestrel Power offers in force', U.table([{ h: 'Resource', k: 0, cls: 'mono t1' }, { h: 'MW', k: 1, num: 1 }, { h: 'Offer, R/MWh', k: 2, num: 1 }, { h: '', k: 3 }], [['KST-1', 600, 880, ''], ['KST-2', 600, after && i <= D.EV_TO ? '–' : f.n(1050), after && i <= D.EV_TO ? U.tag('Declared out', 'warn') : ''], ['KST-3', 600, 940, ''], ['KST-4', 600, 990, ''], ['KST-5 T1', 420, f.n(1060), ''], ['KST-5 T2', 180, amended && i <= D.EV_TO ? '<b>' + f.n(4250) + '</b>' : f.n(1120), amended && i <= D.EV_TO ? U.tag('Amended 17:22', 'high') : ''], ['KST-6', 600, f.n(1040), ''], ['KST-GT1', 163, amended && i <= D.EV_TO ? '<b>' + f.n(4250) + '</b>' : f.n(3900), amended && i <= D.EV_TO ? U.tag('Amended 17:22', 'high') : '']], { dense: true }), { flush: true, sub: 'as at ' + f.t(i), foot: U.src('Offers and bids · raw') }) +
        U.card('Record of events', '<ul class="tl" style="padding:12px 12px 0">' + notes.map(function (n) { return '<li><time>' + n[1] + '</time><span class="pt agent"></span><div>' + n[2] + '</div></li>'; }).join('') + '</ul>', { flush: true, sub: 'up to ' + f.t(i) }) + '</div></div>';
    }
    if (tab === 'evidence') {
      var sealed = R.S.sealed;
      h += '<div class="grid g-2-1"><div>' + U.card('Evidence items', U.table([{ h: '#', k: 'n', cls: 'mono', w: '30px' }, { h: 'Item', f: function (e) { return '<div class="t1">' + esc(e.name) + '</div><div class="t2">' + e.ds + '</div>'; } }, { h: 'Added by', f: function (e) { return U.person(e.by); } }, { h: 'SHA-256', f: function (e) { return '<span class="hash" title="' + e.hash + '">' + short(e.hash) + '</span>'; } }, { h: '', f: function () { return U.tag('Verified', 'good', 'check'); } }], D.evidence), { flush: true, cls: 'scroll-x', sub: 'each item hashed when added; originals stay in the raw zone', foot: 'Hashes are recomputed against the raw zone each time the bundle is opened.' }) + '</div><div class="stack">' +
        U.card('Evidence bundle', sealed ? '<div class="row mb8">' + U.tag('Sealed', 'good', 'seal') + '<span class="muted">' + sealed.t + ' by ' + esc(sealed.by) + '</span></div><div class="field"><span>Bundle hash, SHA-256</span><div class="hash" style="color:var(--ink)">' + sealed.hash + '</div></div>' + U.kv([['Filed to', 'SharePoint · /sites/MSU/Cases/0047/Evidence/bundle-0047-01'], ['Retention label', 'Enforcement-7y'], ['Sensitivity', 'Confidential – Regulatory']]).replace('<dl', '<dl style="margin-top:12px"') + '<div class="row mt12"><button class="btn" data-act="bundle-verify">' + icon('check') + 'Verify bundle</button><button class="btn ghost" data-write data-act="bundle-unseal">Reopen</button></div><div id="verify" class="mt8"></div>'
          : '<p class="muted">Sealing fixes the six items and their hashes into one package with its own hash. Any later change to any item changes the bundle hash, so tampering is evident.</p><button class="btn pri mt12" data-write data-act="bundle-seal">' + icon('seal') + 'Seal and hash bundle</button>', { sub: sealed ? '' : 'not sealed' }) +
        U.card('Chain of custody', '<ul class="tl" style="padding:12px 12px 0">' + (sealed ? [[sealed.t, 'good', 'Bundle sealed and filed to SharePoint', sealed.by]] : []).concat([['06:05', 'agent', 'Item 5 added: market re-clear', A], ['01:20', 'agent', 'Items 1 to 3 hashed from the raw zone', A], ['18:58', '', 'Items 4 and 6 added', 'Naledi Mokoena'], ['18:52', '', 'Evidence register opened with the case', 'Naledi Mokoena']]).map(function (t) { return '<li><time>' + t[0] + '</time><span class="pt ' + t[1] + '"></span><div><div class="t1">' + t[2] + '</div><div class="t2">' + t[3] + '</div></div></li>'; }).join('') + '</ul>', { flush: true }) + '</div></div>';
    }
    if (tab === 'requests') {
      var tasks = [['Review and forward information request IR-0047-01', 'Naledi Mokoena', '10:00 today', !!R.S.flags.irSent], ['Approve and issue IR-0047-01', 'Sipho Dlamini', 'Today', false], ['Decide whether A-1095 joins this case', 'Naledi Mokoena', '10:36 today', !!R.S.approvals['ap-merge']], ['Confirm settlement reconciliation as evidence item 7', 'Naledi Mokoena', 'Today', !!R.S.quarantine['DQ-314']], ['Seal the evidence bundle', 'Anika Pillay', 'Before issue', !!R.S.sealed], ['Request SCADA sequence-of-events log from the System Operator', 'Anika Pillay', '15 Jul', false], ['Legal review of the request wording', 'Lerato Khumalo', '15 Jul', false]];
      h += '<div class="grid g-3-2">' + U.card('Tasks', U.table([{ h: '', f: function (t) { return t[3] ? '<span class="tag good">' + icon('check') + 'Done</span>' : '<span class="tag">Open</span>'; }, w: '70px' }, { h: 'Task', k: 0, cls: 't1' }, { h: 'Owner', f: function (t) { return U.person(t[1]); } }, { h: 'Due', k: 2, cls: 'nowrap' }], tasks, { dense: true }), { flush: true, sub: tasks.filter(function (t) { return !t[3]; }).length + ' open' }) +
        U.card('Information request IR-0047-01', U.kv([['To', 'Kestrel Power (Pty) Ltd, Compliance Officer'], ['Asks for', 'KST-2 control-room log, trip record, cost basis for the amended offers, trading-desk communications'], ['Response due', 'Five business days from issue'], ['Status', R.S.flags.irSent ? U.tag('With MSU lead for approval', 'info') + ' <span class="muted">sent ' + R.S.flags.irSent + '</span>' : U.tag('Draft', 'warn')], ['Channel', 'Outlook, with a copy filed to the case in SharePoint']]) + '<div class="row mt12"><button class="btn pri" data-act="ir-draft">Open draft</button>' + U.ai(A + ' draft') + '</div>', { foot: 'Nothing is sent to a participant without the MSU lead’s approval.' }) + '</div>';
    }
    if (tab === 'timeline') {
      var mine = R.S.audit.filter(function (a) { return /0047|A-1094|A-1095|IR-0047|bundle/i.test(a.object + a.detail); });
      h += U.card('Case timeline', U.table([{ h: 'Time', f: function (a) { return '<span class="mono nowrap">' + a.d + ' ' + a.t + '</span>'; } }, { h: 'Actor', f: function (a) { return U.person(a.actor === 'Pipeline' || a.actor === 'Integration' ? null : a.actor).replace('Unassigned', a.actor); } }, { h: 'Role', k: 'role', cls: 't2' }, { h: 'Action', k: 'action', cls: 't1' }, { h: 'Object', k: 'object' }, { h: 'Detail', k: 'detail', cls: 't2' }], mine, { dense: true }), { flush: true, cls: 'scroll-x', sub: 'drawn from the immutable audit log', foot: 'Every view, change, decision and approval is logged with user, time and reason. <a href="#/security">Open the full audit log</a>' });
    }
    if (tab === 'decision') {
      h += '<div class="grid g-3-2"><div class="stack">' + U.card('Findings', '<div class="empty">Findings open when the investigation stage closes.<br>The participant’s response to IR-0047-01 is the next input.</div>', { sub: 'not yet drafted' }) +
        U.card('Approval chain', U.table([{ h: 'Step', k: 0, cls: 't1' }, { h: 'Who', k: 1 }, { h: 'Status', f: function (r) { return U.tag(r[2], r[2] === 'Done' ? 'good' : ''); } }], [['Triage and escalation', 'Naledi Mokoena, analyst', 'Done'], ['Investigation report', 'Anika Pillay, investigator', 'In progress'], ['Recommendation', 'Sipho Dlamini, MSU lead', 'Pending'], ['Legal review', 'Lerato Khumalo', 'Pending'], ['Decision', 'Regulator member panel', 'Pending']], { dense: true }), { flush: true }) + '</div>' +
        U.card('Enforcement options', '<div class="steps v">' + [['Warning', 'Written notice of the conduct'], ['Remediation order', 'Corrective steps with a deadline'], ['Access suspension', 'Through the Market Operator'], ['Administrative penalty', 'Under the Electricity Regulation Act'], ['Licence action', 'Amendment, suspension or referral']].map(function (s, k) { return '<div class="step"><div class="n">0' + (k + 1) + '</div><div class="t">' + s[0] + '</div><div class="d">' + s[1] + '</div></div>'; }).join('') + '</div><div class="note mt12">The platform records the decision and its reasons. It does not recommend an outcome: that judgement belongs to the Regulator.</div>', { sub: 'escalating' }) + '</div>';
    }
    return h;
  }
  R.act['bundle-seal'] = function () {
    digest(bundleText()).then(function (hx) {
      R.S.sealed = { hash: hx, t: R.clock().hm, by: R.cfg.user.name };
      R.audit('Evidence bundle sealed', 'Case 0047 · bundle-0047-01', 'SHA-256 ' + hx.slice(0, 16) + '… · filed to SharePoint, label Enforcement-7y'); R.save();
      R.toast('Bundle sealed and filed', 'Six items, one hash. Custody log updated.'); R.render(true);
    });
  };
  R.act['bundle-verify'] = function () {
    digest(bundleText()).then(function (hx) {
      var ok = R.S.sealed && hx === R.S.sealed.hash;
      R.$('#verify').innerHTML = '<div class="note ' + (ok ? 'good' : 'crit') + '">' + (ok ? 'Recomputed from the six items: the hash matches. Nothing has changed since sealing.' : 'The recomputed hash does not match the sealed hash.') + '</div>';
      R.audit('Evidence bundle verified', 'Case 0047 · bundle-0047-01', ok ? 'Match' : 'Mismatch');
    });
  };
  R.act['bundle-unseal'] = function () { R.S.sealed = null; R.audit('Evidence bundle reopened', 'Case 0047', 'Reason required in delivery'); R.save(); R.render(true); };
  R.act['case-export'] = function () { R.audit('Case file exported', 'Case 0047', 'PDF with evidence index'); R.toast('Case file prepared', 'Summary, timeline, evidence index and hashes as one PDF, labelled Confidential.'); };

  /* ======================= REPORTS ======================= */
  var drill = 0, build = { ds: 0, m: 0, v: 'line', aud: 'MSU analysts' };
  var BUILD = [
    { ds: 'Prices and results', m: [{ n: 'System price by interval, 13 Jul', x: D.times, d: D.price, u: 'R/MWh', every: 6 }, { n: 'Uplift over the 30-day norm, 13 Jul', x: D.times, d: D.price.map(function (p, i) { return p - D.norm[i]; }), u: 'R/MWh', every: 6 }] },
    { ds: 'Metering', m: [{ n: 'KST-2 metered output, 13 Jul', x: D.times, d: D.kstMetered, u: 'MW', every: 6 }] },
    { ds: 'Offers and bids', m: [{ n: 'Offered capacity by participant, 18:30', x: D.shares.map(function (s) { return D.P[s.id].short; }), d: D.shares.map(function (s) { return s.mw; }), u: 'MW', cat: 1 }, { n: 'Offer amendments in the last hour before the interval, by participant', x: ['Highveld', 'Kestrel', 'Limpopo Coal', 'Ridgeline', 'Lowveld', 'Sable', 'Vaal'], d: [4, 9, 1, 3, 2, 5, 212], u: 'amendments', cat: 1 }] },
    { ds: 'Control and audit', m: [{ n: 'Alerts by screen family, 30 days', x: D.screens.map(function (s) { return s.name.split(' ')[0]; }), d: D.screens.map(function (s) { return s.fires; }), u: 'alerts', cat: 1 }] }
  ];
  R.pages.reports = {
    id: 'reports', title: 'Reports', group: 'Enforce', icon: 'reports',
    render: function () {
      var tab = R.tab('rep', 'board'), brd = R.S.role === 'board';
      var h = U.phead('Reports', 'Board, executive and analyst views draw on the same certified datasets, so everyone sees the same numbers. Every figure drills down to the record behind it.', 'RFI 4.3.6', '');
      h += U.tabs('rep', [{ id: 'board', label: 'Board view' }, { id: 'library', label: 'Report library', n: D.reports.length + (R.S.flags.published || []).length }].concat(brd ? [] : [{ id: 'build', label: 'Build a report' }]), tab);
      if (tab === 'board') {
        var alertsM = [6, 8, 7, 9, 12, 10, 9, 11, 14, 96, 104, 117];
        h += '<div class="row wrap mb12"><b style="font-size:14px">SAWEM market integrity</b><span class="muted">last 90 days · as at 14 Jul 2027 07:41</span><span class="grow"></span><span class="tag wrap">Illustrative KPIs, to be agreed with NERSA’s executive and Board</span></div>' +
          U.kpis([{ label: 'KPI · Data feeds on time', value: '99.2%', note: 'target 99.0%', tone: 'good' }, { label: 'KPI · Alerts triaged within SLA', value: '94%', note: 'target 90%', tone: 'good' }, { label: 'KPI · Cases resolved', value: '12', note: '4 enforcement outcomes' }, { label: 'KRI · Open cases', value: '7', note: '4 high priority or above', tone: 'warn' }, { label: 'KRI · Pivotal non-incumbent at peak', value: '18%', note: 'share of peak intervals · up from 14%', tone: 'warn' }, { label: 'KRI · Estimated cost detected', value: f.zarm(D.harmQuarter, 0), note: 'three cases · drill down below', tone: 'crit' }]) +
          '<div class="grid g2 mt12">' + U.card('Market concentration', C.xy({ h: 210, x: D.months, series: [{ name: 'HHI', data: D.hhiTrend, color: BLUE }], hlines: [{ v: 1800, label: 'Highly concentrated above 1 800', left: 1 }], ymin: 0, ymax: 5000, marks: [{ i: 11, label: f.n(D.hhi), dy: -8 }], tfmt: f.n }), { sub: 'HHI at the evening peak, monthly', foot: U.src('Resource register') }) +
          U.card('Alerts raised', C.xy({ h: 210, x: D.months, series: [{ name: 'Alerts', type: 'col', data: alertsM, color: BLUE }], ymin: 0, ymax: 120, tfmt: f.n, bands: [{ from: 9, to: 11, label: 'Market open', color: '#f1f3f6' }] }), { sub: 'per month · shadow operation before April', foot: U.src('Control and audit') }) + '</div>';
        /* drill-down */
        var crumbs = ['Board KPI', 'Case 0047', 'Interval 18:30', 'Raw record'], body = '';
        if (drill === 0) body = U.table([{ h: 'Case', k: 0, cls: 'mono t1' }, { h: 'Participant', k: 1 }, { h: 'Stage', k: 2 }, { h: 'Estimated cost', k: 3, num: 1 }], [['0047', 'Kestrel Power (Pty) Ltd', 'Investigation', f.zarm(D.harmTotal)], ['0044', 'Lowveld Peaking Power', 'Decision', f.zarm(11.4e6)], ['0041', 'Sable Power Trading', 'Closed · remediation order', f.zarm(4.8e6)]], { dense: true, row: function (r) { return r[0] === '0047' ? 'class="click hl" data-act="drill" data-v="1"' : ''; } }) + '<div class="row" style="padding:9px 12px;border-top:1px solid var(--line-2);font-weight:600"><span>Estimated cost detected</span><span class="grow"></span><span class="num">' + f.zarm(D.harmQuarter) + '</span></div>';
        if (drill === 1) body = U.table([{ h: 'Interval', k: 't', cls: 't1' }, { h: 'System price', num: 1, f: function (x) { return f.n(x.price); } }, { h: 'Re-cleared', num: 1, f: function (x) { return f.n(x.cf); } }, { h: 'Energy, MWh', num: 1, f: function (x) { return f.n(x.mwh); } }, { h: 'Cost', num: 1, f: function (x) { return f.zarm(x.harm); } }], D.harm, { dense: true, row: function (x) { return x.i === D.EV ? 'class="click hl" data-act="drill" data-v="2"' : ''; } });
        if (drill === 2) body = U.table([{ h: 'Resource', k: 'r', cls: 't1' }, { h: 'Participant', f: function (t) { return D.P[t.p].short; } }, { h: 'MW', num: 1, f: function (t) { return f.n(t.mw); } }, { h: 'Offer, R/MWh', num: 1, f: function (t) { return f.n(t.price); } }, { h: '', f: function (t) { return t.flag ? U.tag('Set the price', 'high') : ''; } }], D.stack.slice(13, 20), { dense: true, row: function (t) { return t.r === 'KST-5 tranche 2' ? 'class="click hl" data-act="drill" data-v="3"' : ''; } });
        if (drill === 3) body = '<div style="padding:12px"><pre class="code">{\n  "offer_id": "OF-20270713-KST5-T2-v3",\n  "participant_id": "P-007",\n  "resource_id": "KST-5",\n  "tranche": 2,\n  "interval_start": "2027-07-13T18:30:00+02:00",\n  "quantity_mw": 180,\n  "price_zar_mwh": 4250.00,\n  "supersedes": "OF-20270713-KST5-T2-v2",   <span class="c">// R 1 120.00</span>\n  "submitted_at": "2027-07-13T17:22:08.412+02:00",\n  "submitted_by": "user:trader.07@kestrelpower.example",\n  "channel": "web session"\n}</pre>' + U.kv([['Raw file', '<span class="mono">raw/trading/2027/07/13/offers_172200_172259.json</span>'], ['SHA-256', '<span class="hash">5d0f8b2a6c4e1937f0a2c4e6b8d0f1a3c5e7b9d1f3a5c7e9b0d2f4a6c8e0b1d3</span>'], ['Ingested', '13 Jul 17:22:41, trading platform API']]).replace('<dl', '<dl style="margin-top:12px"') + (R.can('hub') ? '<a class="btn mt12" href="#/hub">' + icon('link') + 'Open lineage in the Data Hub</a>' : '') + '</div>';
        h += '<div class="mt12">' + U.card('Drill-down', '<div class="row wrap" style="padding:10px 12px;border-bottom:1px solid var(--line);gap:4px">' + crumbs.map(function (c, k) { return (k ? '<span class="faint">' + icon('chev').replace('<svg', '<svg style="width:12px;height:12px"') + '</span>' : '') + '<button class="chip' + (k === drill ? ' on' : '') + '" data-act="drill" data-v="' + k + '"' + (k > drill ? ' disabled style="opacity:.5"' : '') + '>' + (k + 1) + ' · ' + c + '</button>'; }).join('') + '<span class="grow"></span><span class="muted" style="font-size:12px">' + ['Select Case 0047', 'Select the 18:30 interval', 'Select the offer that set the price', 'The original record, as received'][drill] + '</span></div>' + body, { flush: true, sub: 'from ' + f.zarm(D.harmQuarter, 0) + ' to the raw record in four steps', foot: brd && drill > 1 ? 'Shown here for demonstration. In delivery the Board role stops at case level.' : 'The same path works from any figure on any report.' }) + '</div>';
      }
      if (tab === 'library') {
        var pub = (R.S.flags.published || []).map(function (p) { return { name: p.n, aud: p.aud, freq: 'On demand', last: 'Today ' + p.t, by: R.cfg.user.name, cls: 'Restricted', status: 'Published' }; });
        h += U.card('', U.table([{ h: 'Report', k: 'name', cls: 't1' }, { h: 'Audience', k: 'aud' }, { h: 'Frequency', k: 'freq', cls: 'nowrap' }, { h: 'Last issued', k: 'last', cls: 'nowrap' }, { h: 'Prepared by', f: function (r) { return r.by.indexOf(A) === 0 ? U.ai(r.by) : esc(r.by); } }, { h: 'Classification', f: function (r) { return '<span class="t2">' + r.cls + '</span>'; } }, { h: 'Status', f: function (r) { return U.tag(r.status, r.status === 'Published' ? 'good' : r.status === 'Draft' ? 'warn' : 'info'); } }, { h: '', f: function (r) { return '<button class="btn sm" data-act="report-open" data-n="' + esc(r.name) + '">Open</button>'; } }], pub.concat(D.reports)), { flush: true, cls: 'scroll-x', foot: 'Reports are Power BI reports over the curated datasets, with row-level security by role. Public reports have confidential data removed before release.' });
      }
      if (tab === 'build') {
        var b = BUILD[build.ds], m = b.m[Math.min(build.m, b.m.length - 1)], viz;
        if (build.v === 'table') viz = '<div class="scroll-y" style="max-height:260px">' + U.table([{ h: m.cat ? 'Category' : 'Interval', k: 0 }, { h: m.u, k: 1, num: 1 }], m.x.map(function (x, i) { return [x, f.n(m.d[i])]; }), { dense: true }) + '</div>';
        else viz = C.xy({ h: 250, x: m.x, xEvery: m.every, series: [{ name: m.n, data: m.d, color: BLUE, type: build.v === 'column' || m.cat ? 'col' : 'line' }], yunit: m.u, tfmt: function (v) { return f.n(v) + ' ' + m.u; }, ymin: Math.min(0, Math.min.apply(null, m.d)) < 0 ? undefined : 0 });
        function sel(id, opts, cur) { return '<select class="sel" data-build="' + id + '" style="width:100%">' + opts.map(function (o, i) { var v = typeof o === 'string' ? o : i; return '<option value="' + v + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + (typeof o === 'string' ? o : o.label) + '</option>'; }).join('') + '</select>'; }
        h += '<div class="grid g-1-2"><div>' + U.card('Build a report', '<div class="stack">' +
          '<div class="field"><span>1 · Certified dataset</span>' + sel('ds', BUILD.map(function (x) { return { label: x.ds }; }), build.ds) + '</div>' +
          '<div class="field"><span>2 · Measure</span>' + sel('m', b.m.map(function (x) { return { label: x.n }; }), Math.min(build.m, b.m.length - 1)) + '</div>' +
          '<div class="field"><span>3 · Visual</span>' + U.seg('build-v', [{ id: 'line', label: 'Line' }, { id: 'column', label: 'Column' }, { id: 'table', label: 'Table' }], m.cat && build.v === 'line' ? 'column' : build.v) + '</div>' +
          '<div class="field"><span>4 · Publish to, with row-level security</span>' + sel('aud', ['MSU analysts', 'Executive', 'Board', 'Regulatory decision-makers'], build.aud) + '</div>' +
          '<button class="btn pri" data-write data-act="build-publish">' + icon('upload') + 'Publish</button></div>', { sub: 'four steps', foot: 'Only certified datasets can be chosen, so a report cannot be built on unchecked data.' }) + '</div><div>' +
          U.card(esc(m.n), viz, { flush: build.v === 'table', sub: 'preview', foot: U.src(b.ds, 'certified') + '<span class="src">visible to: ' + esc(build.aud) + '</span><span class="grow"></span><span class="src">In delivery this is a Power BI report over the same dataset</span>' }) + '</div></div>';
      }
      return h;
    },
    mount: function (root) {
      R.$$('[data-build]', root).forEach(function (s) { s.addEventListener('change', function () { var k = s.dataset.build; build[k] = k === 'aud' ? s.value : +s.value; if (k === 'ds') build.m = 0; R.render(true); }); });
    }
  };
  R.act.drill = function (el) { drill = +el.dataset.v; R.render(true); };
  R.act['build-v'] = function (el) { build.v = el.dataset.v; R.render(true); };
  R.act['build-publish'] = function () {
    var b = BUILD[build.ds], m = b.m[Math.min(build.m, b.m.length - 1)];
    R.S.flags.published = (R.S.flags.published || []); R.S.flags.published.unshift({ n: m.n, aud: build.aud, t: R.clock().hm });
    R.audit('Report published', m.n, 'Dataset ' + b.ds + ' · audience ' + build.aud + ' · row-level security applied'); R.save();
    R.toast('Published to ' + build.aud, 'Row-level security applied. It now appears in the report library.'); R.tabState.rep = 'library'; R.render();
  };
  R.act['report-open'] = function (el) { R.toast('Opening “' + el.dataset.n + '”', 'In delivery this opens the Power BI report in place.'); };
})();
