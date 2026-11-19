/* Regulatory Data Hub prototype · govern pages: Market Code, Security, Integrations, RFI Coverage */
(function () {
  'use strict';
  var R = window.RDH, f = R.f, U = R.ui, D = R.D, AG = R.AG, esc = R.esc, icon = R.icon, A = R.cfg.agent;

  /* ======================= MARKET CODE ======================= */
  var APID = { 'MCR 4.2(a)': 'ap-map1', 'Market Code s.9.3': 'ap-map2' };
  R.pages.rulebook = {
    id: 'rulebook', title: 'Market Code', group: 'Govern', icon: 'rulebook',
    render: function () {
      var tab = R.tab('code', 'changes'), wait = ['ap-map1', 'ap-map2'].filter(function (k) { return !R.S.approvals[k]; }).length;
      var h = U.phead('Market Code', 'Screens are mapped clause by clause to the Market Code and the platform conditions. When a clause changes, the affected screens are found and a re-mapping is proposed for approval.', null, '<span class="tag">Rev 2.4 received 12 Jul 2027</span>');
      h += U.kpis([{ label: 'Clauses tracked', value: '212', note: 'Code, Conduct Rules, conditions' }, { label: 'Mapped to a screen', value: '38', note: 'the rest are informational' }, { label: 'Changed in Rev 2.4', value: '4', note: 'compared clause by clause' }, { label: 'Mappings waiting for approval', value: wait, note: wait ? 'screens run on the previous wording' : 'all screens current', tone: wait ? 'warn' : 'good' }]);
      h += '<div class="mt16"></div>' + U.tabs('code', [{ id: 'changes', label: 'Changes in Rev 2.4', n: 4 }, { id: 'map', label: 'Clause-to-screen map' }, { id: 'params', label: 'Parameters in force' }], tab);
      if (tab === 'changes') {
        h += U.card('', '<ul class="list">' + D.codeChanges.map(function (c) {
          var ap = APID[c.clause], dec = ap && R.S.approvals[ap], st = dec ? dec.v : c.status;
          return '<li><div class="grow"><div class="row wrap"><span class="tag mono">' + c.clause + '</span><span class="t1">' + c.title + '</span>' + U.tag(c.change) + '</div><div class="mt8" style="font-size:12.5px;line-height:1.6"><span style="background:var(--crit-bg);text-decoration:line-through;color:var(--ink-3)">' + esc(c.from) + '</span> <span style="background:var(--good-bg)">' + esc(c.to) + '</span></div><div class="row wrap mt8"><span class="muted" style="font-size:12px">Screens affected</span>' + c.screens.map(function (s) { return '<span class="tag">' + s + ' ' + D.SCR[s].name + '</span>'; }).join('') + (c.by === A ? U.ai('Mapping proposed by ' + A) : '<span class="muted" style="font-size:12px">Mapped by ' + c.by + '</span>') + '</div></div><div class="row gap4">' +
            (st === 'Proposed' ? '<button class="btn sm pri" data-write data-act="approve" data-id="' + ap + '">Approve mapping</button><button class="btn sm" data-write data-act="decline" data-id="' + ap + '">Decline</button>' : U.tag(st, st === 'Mapped' || st === 'Approved' ? 'good' : '')) + '</div></li>';
        }).join('') + '</ul>', { flush: true, foot: 'A mapping changes what a screen tests, so it needs the MSU lead’s approval. Until then the screen runs on the previous wording and says so on each alert.' });
      }
      if (tab === 'map') {
        h += U.card('', U.table([{ h: 'Clause', k: 0, cls: 'mono t1 nowrap' }, { h: 'Obligation', k: 1 }, { h: 'On', k: 2, cls: 't2' }, { h: 'Screen', f: function (r) { return r[3].map(function (s) { return '<span class="tag">' + s + '</span>'; }).join(' '); } }, { h: 'Datasets read', k: 4, cls: 't2' }], [
          ['MCR 3.1', 'No abuse of a pivotal or dominant position', 'Participants', ['SCR-03'], 'Prices and results · Resource register'],
          ['MCR 4.2(a)', 'No physical withholding without technical cause', 'Generators', ['SCR-02'], 'Outages · Metering · Dispatch'],
          ['MCR 4.2(b)', 'No economic withholding', 'Generators', ['SCR-01'], 'Offers and bids · Prices and results'],
          ['MCR 4.3', 'Offers reflect a consistent commercial basis', 'Participants', ['SCR-04'], 'Offers and bids'],
          ['MCR 4.4', 'No coordination between participants', 'Participants', ['SCR-05'], 'Offers and bids · Participant register'],
          ['MCR 4.5', 'No deliberate imbalance', 'Balance responsible parties', ['SCR-06'], 'Metering · Dispatch · Settlement'],
          ['MCR 5.1 · ERA s.34B', 'Non-discriminatory access to the grid', 'System Operator', ['SCR-07'], 'Access and wheeling · Network constraints'],
          ['MCR 6.2', 'Outage and inside information published within 60 minutes', 'Participants', ['SCR-10'], 'Transparency · Outages · Dispatch'],
          ['Market Code s.14', 'Credit cover maintained', 'Participants', ['SCR-08'], 'Settlement'],
          ['Platform Framework ch. 9', 'No fully automated submission for five years', 'Participants', ['SCR-09'], 'Offers and bids · Control and audit'],
          ['Platform Framework Table 3', '99.9% availability; reproducible outcomes', 'Market Operator', ['Operator oversight'], 'Prices and results · Control and audit']], { dense: true }), { flush: true, cls: 'scroll-x', sub: '11 of 38 mapped clauses', foot: 'Clause numbering is illustrative and follows the published drafts. It is re-keyed to the final Market Code on approval.' });
      }
      if (tab === 'params') {
        h += U.card('', U.table([{ h: 'Parameter', k: 0, cls: 't1' }, { h: 'In force', k: 1 }, { h: 'Source', k: 2, cls: 't2' }, { h: 'Used by', k: 3, cls: 't2' }], [
          ['Market price cap', f.zar(D.CAP, 2) + '/MWh', 'Draft Market Code, Annexure 2', 'DQ-R07 · SCR-01'],
          ['Materiality threshold', 'R 100 000', 'Draft Market Code, Annexure 2', 'SCR-08 · reconciliation'],
          ['Metering accuracy band', '5%', 'Draft Market Code, Annexure 2', 'SCR-06'],
          ['Trading interval', '30 minutes in this synthetic dataset', 'Model parameter. The draft Code defines a 60-minute Trading Period', 'Every dataset keyed on interval'],
          ['Day-ahead gate closure', '10:00 on D-1, or as extended by notice', 'Market Code s.9.3 (Rev 2.4)', 'SCR-04 · SCR-09'],
          ['Outage disclosure', '60 minutes', 'MCR 6.2', 'SCR-10'],
          ['Automated submission', 'Barred for 5 years from launch', 'Draft Platform Framework', 'SCR-09'],
          ['Platform availability', 'At least 99.9% in trading windows', 'Draft Platform Framework, Table 3', 'Operator oversight'],
          ['Retention of material market data', 'At least 5 years, searchable', 'Draft Platform Framework', 'Raw zone policy'],
          ['Conduct and impact thresholds', 'Lower of 300% or R 1 500; lower of 200% or R 1 500', 'Illustrative; to be calibrated with NERSA', 'SCR-01']], { dense: true }), { flush: true, cls: 'scroll-x', foot: 'Parameters are configuration, not code. A change is versioned, approved and takes effect from a stated interval.' });
      }
      return h;
    }
  };

  /* ======================= SECURITY ======================= */
  R.act.mfa = function (el) {
    var step = +(el.dataset.step || 0), b;
    if (step === 0) b = '<div class="field"><span>Work account</span><input class="inp" value="naledi.mokoena@nersa.example" readonly></div><div class="field mt12"><span>Password</span><input class="inp" type="password" value="••••••••••••" readonly></div><div class="note mt12">Simulated flow. In delivery this is the Microsoft Entra ID sign-in page, with conditional access limiting sign-in to managed devices and the control-room network.</div>';
    if (step === 1) b = '<div style="text-align:center;padding:10px 0"><div class="muted">Approve the sign-in on your phone and enter this number</div><div style="font:600 44px/1.2 var(--mono);color:var(--navy);margin:10px 0">47</div><div class="row" style="justify-content:center">' + U.tag('Waiting for approval…', 'info', 'loader') + '</div><p class="muted mt12">Number matching stops approval by reflex. A password alone is never enough.</p></div>';
    if (step === 2) { b = '<div class="note good mb12"><b>Signed in.</b> Second factor verified by number match.</div>' + U.kv([['User', 'Naledi Mokoena'], ['Roles in token', '<span class="mono">MSU.Analyst</span>'], ['Authentication methods', '<span class="mono">pwd, mfa</span>'], ['Device', 'MSU-CR-04 · compliant'], ['Conditional access', 'Passed: managed device, control-room network'], ['Session', '8 hours; re-authenticates for privileged actions']]); R.audit('MFA control tested', 'Entra ID sign-in', 'Simulated number-match flow completed'); }
    R.modal({ title: 'Sign in · step ' + (step + 1) + ' of 3', body: b, foot: step < 2 ? '<button class="btn" data-act="close">Cancel</button><button class="btn pri" data-act="mfa" data-step="' + (step + 1) + '">' + (step === 0 ? 'Next' : 'I approved it on my phone') + '</button>' : '<button class="btn pri" data-act="close">Done</button>' });
  };
  R.act['view-as'] = function (el) { var s = R.$('#rolesel'); s.value = el.dataset.v; s.dispatchEvent(new Event('change', { bubbles: true })); };
  R.act['audit-filter'] = function (el) { R.tabState.auditf = el.dataset.v; R.render(true); };
  R.pages.security = {
    id: 'security', title: 'Security', group: 'Govern', icon: 'security',
    render: function () {
      var tab = R.tab('sec', 'controls'), cur = Object.keys(R.roles).indexOf(R.S.role) + 1;
      var h = U.phead('Security', 'Hosted in Microsoft Azure’s South African regions. Each of the twelve minimum requirements maps to a control, and the same data shows differently to each role.', 'RFI 4.3.7', '<button class="btn pri" data-act="mfa">' + icon('lock') + 'Test MFA control</button>');
      h += U.kpis([{ label: 'Requirements mapped to a control', value: '12<small>of 12</small>', tone: 'good', note: 'RFI 4.3.7' }, { label: 'Shown working in this prototype', value: '4', note: 'the rest are delivery configuration' }, { label: 'Sign-ins today', value: '14', note: 'all with a second factor' }, { label: 'Privileged elevations, 30 d', value: '3', note: 'all approved and time-limited' }, { label: 'Data location', value: 'South Africa', note: 'North primary, West recovery' }]);
      h += '<div class="mt16"></div>' + U.tabs('sec', [{ id: 'controls', label: 'Twelve controls' }, { id: 'roles', label: 'Role views' }, { id: 'audit', label: 'Audit log', n: R.S.audit.length }, { id: 'residency', label: 'Residency and keys' }], tab);
      if (tab === 'controls') {
        h += U.card('', '<div class="grid g2" style="gap:0">' + D.controls.map(function (c) { return '<div class="ctrl"><span class="n">' + c.n + '</span><div><div class="t1" style="font-weight:600">' + c.req + '</div><div class="muted">' + c.ctl + '</div></div>' + (c.proto ? U.tag('Shown here', 'good', 'check') : U.tag('In delivery')) + '</div>'; }).join('') + '</div>', { flush: true, foot: '“Shown here” means the behaviour can be exercised in this prototype: sign-in flow, role views, access logging, audit log. The others are Azure configuration, evidenced on the live services at the demonstration.' });
      }
      if (tab === 'roles') {
        h += '<div class="grid g-2-1">' + U.card('Same data, four people, four views', U.table([{ h: 'What they see', k: 0, cls: 't1' }].concat(['Analyst', 'Board', 'Licensee', 'Auditor'].map(function (r, k) { return { h: r, f: function (row) { var v = row[k + 1]; return '<span class="' + (v === 'Full' ? 'full' : v === 'None' ? 'none' : '') + '">' + v + '</span>'; }, cls: k + 1 === cur ? 'me' : '' }; })), D.roleMatrix, { cls: 'matrix' }) + '<div class="row wrap" style="padding:12px;border-top:1px solid var(--line)"><span class="muted">View this application as</span>' + Object.keys(R.roles).map(function (k) { return '<button class="btn sm' + (k === R.S.role ? ' pri' : '') + '" data-act="view-as" data-v="' + k + '">' + R.roles[k].name + '</button>'; }).join('') + '</div>', { flush: true, foot: 'Proposed role model, enforced by Entra ID roles and row-level security at the dataset; to be agreed with NERSA.' }) +
          U.card('What changes when you switch', '<ul class="trace" style="font-size:13px;gap:8px;color:var(--ink-2)">' + ['Board: the brief, market summary, Board view and case status. No participant-level offers, evidence or worklists.', 'Licensee: public market data and its own record. Every other participant is filtered out at the dataset.', 'Auditor: everything, read-only, with the full audit log. Every action button is disabled.', 'Analyst: full working access. Sees own actions in the audit log.'].map(function (x) { return '<li style="align-items:flex-start">' + icon('eye') + '<span>' + x + '</span></li>'; }).join('') + '</ul>', { foot: 'The filter is applied where the data is read, so it holds in reports, questions and exports alike.' }) + '</div>';
      }
      if (tab === 'audit') {
        var fl = R.tab('auditf', 'all'), own = R.S.role === 'analyst';
        var rows = R.S.audit.filter(function (a) { var svc = a.role === 'Service'; return fl === 'all' || (fl === 'agent' ? a.actor === A : fl === 'people' ? !svc : svc && a.actor !== A); });
        h += '<div class="row mb12">' + U.seg('audit-filter', [{ id: 'all', label: 'All' }, { id: 'people', label: 'People' }, { id: 'agent', label: A }, { id: 'services', label: 'Services' }], fl) + '<span class="grow"></span><span class="muted">' + rows.length + ' entries · newest first · append-only</span></div>' +
          U.card('', U.table([{ h: 'Time', f: function (a) { return '<span class="mono nowrap">' + a.d + ' ' + a.t + '</span>'; } }, { h: 'Actor', f: function (a) { return a.role === 'Service' && a.actor !== A ? '<span class="nowrap">' + a.actor + '</span>' : U.person(a.actor); } }, { h: 'Role', k: 'role', cls: 't2 nowrap' }, { h: 'Action', k: 'action', cls: 't1' }, { h: 'Object', f: function (a) { return esc(a.object); } }, { h: 'Detail', f: function (a) { return '<span class="t2">' + esc(a.detail) + '</span>'; } }], rows, { dense: true }), { flush: true, cls: 'scroll-x', foot: (own ? 'The analyst role sees its own actions in delivery; the full log is shown here so the control can be demonstrated. ' : '') + 'Everything you do in this prototype is added here as you do it. User, system and agent actions are logged alike and cannot be edited.' });
      }
      if (tab === 'residency') {
        h += '<div class="grid g2">' + U.card('Where the data lives', '<div class="grid g2">' + [['South Africa North', 'Johannesburg · production', ['Fabric capacity and OneLake', 'Model endpoint for the agent', 'Key Vault, customer-managed keys']], ['South Africa West', 'Cape Town · recovery', ['Geo-redundant backup', 'Site Recovery target', 'Tested failover, RPO 15 min, RTO 4 h']]].map(function (r) { return '<div class="note" style="background:var(--bg)"><b>' + r[0] + '</b><div class="muted">' + r[1] + '</div><ul class="mt8">' + r[2].map(function (x) { return '<li class="row" style="padding:2px 0"><span class="dot good"></span>' + x + '</li>'; }).join('') + '</ul></div>'; }).join('') + '</div><p class="muted mt12">No NERSA data is transferred, replicated or processed outside South Africa without NERSA’s prior approval. That includes the prompts and outputs of the analyst agent.</p>', { foot: 'NERSA’s build runs in NERSA’s own Azure tenant.' }) +
          U.card('Keys, labels and ownership', U.kv([['Encryption at rest', 'AES-256, keys held by NERSA in Key Vault'], ['In transit', 'TLS 1.2 or later; mutual TLS on licensee links'], ['Classification', 'Purview sensitivity labels: Public, Restricted, Confidential'], ['Retention', 'Raw zone at least 5 years; case records by retention label'], ['POPIA', 'Personal information limited to user and contact records, labelled and minimised'], ['Monitoring', 'Microsoft Sentinel and Defender; alerts to NERSA’s security team'], ['Ownership', 'NERSA owns all data, reports, configurations and outputs, during the contract and on exit'], ['Testing', 'Annual independent penetration test and recovery test']])) + '</div>';
      }
      return h;
    }
  };

  /* ======================= INTEGRATIONS ======================= */
  var integ = { idx: -1, done: {}, show: null, timer: null };
  R.act['integ-send'] = function () {
    if (integ.timer) return; integ = { idx: 0, done: {}, show: null, timer: null }; R.render(true);
    integ.timer = setInterval(function () {
      var s = D.systems[integ.idx]; integ.done[s.id] = R.clock().hms; integ.show = s.id; integ.idx++;
      if (integ.idx >= D.systems.length) { clearInterval(integ.timer); integ.timer = null; integ.idx = -1; R.audit('Alert sent through systems', 'A-1094 → 6 NERSA systems', 'Entra ID, Teams, SharePoint, licensing, Outlook, Power BI'); R.toast('Alert A-1094 sent through six systems', 'No copy and paste. Each hand-off is in the audit log.'); }
      if (R.route().page === 'integrations') R.render(true);
    }, 750);
  };
  R.act['integ-show'] = function (el) { integ.show = el.dataset.id; R.render(true); };
  function artefact(id) {
    var s = D.systems.filter(function (x) { return x.id === id; })[0];
    if (id === 'teams') return '<div class="src mb8">MSU › Alerts · posted by Regulatory Data Hub</div><div class="teams"><div class="row"><b>Critical alert A-1094</b><span class="grow"></span>' + U.score(94) + '</div><div class="mt4">Kestrel Power (Pty) Ltd · KST-2 declared on forced outage while metered at 545 MW.</div>' + U.kv([['When', '13 Jul 17:30–20:00'], ['Screen', 'Physical withholding · MCR 4.2(a)'], ['Estimated effect', f.zarm(D.harmTotal)]]).replace('<dl', '<dl style="margin-top:8px;font-size:12px"') + '<div class="row mt8"><span class="btn sm">Open alert</span><span class="btn sm">Assign to me</span><span class="btn sm">Open case</span></div></div>';
    return '<div class="src mb8">' + s.name + '</div><pre class="code" style="white-space:pre-wrap">' + esc(s.payload) + '</pre>' + (id === 'lic' ? '<div class="note warn mt8">The licensing link calls a mock API built to the agreed pattern. Connecting NERSA’s licensing system needs its interface details.</div>' : '');
  }
  R.pages.integrations = {
    id: 'integrations', title: 'Integrations', group: 'Govern', icon: 'integrations',
    render: function () {
      var n = Object.keys(integ.done).length;
      var h = U.phead('Integrations', 'The hub shares data with NERSA’s other systems instead of becoming another silo. One alert travels through six of them without anyone copying anything.', 'RFI Annexure 1 · 7',
        '<button class="btn pri' + (integ.timer ? ' is-off' : '') + '" data-write data-act="integ-send">' + icon('send') + 'Send alert through systems</button>');
      h += '<div class="grid g2">' + U.card('Alert A-1094 · Kestrel Power', D.systems.map(function (s, i) {
        var st = integ.done[s.id] ? 'ok' : (integ.timer && i === integ.idx ? 'run' : '');
        return '<div class="sys ' + st + '"><span class="sys__i">' + s.ab + '</span><div class="grow"><div class="t1" style="font-weight:600">' + s.name + '</div><div class="muted">' + (st === 'ok' ? s.done : s.what) + '</div></div>' + (st === 'ok' ? '<span class="mono muted">' + integ.done[s.id] + '</span><button class="btn sm' + (integ.show === s.id ? ' pri' : '') + '" data-act="integ-show" data-id="' + s.id + '">View</button>' : st === 'run' ? U.tag('Sending…', 'info', 'loader') : U.tag('Ready')) + '</div>';
      }).join(''), { flush: true, sub: n ? n + ' of 6 done' : 'six systems', foot: 'Each hand-off uses the signed-in user’s identity, so the target system applies its own permissions.' }) +
        U.card('What arrived', integ.show ? artefact(integ.show) : '<div class="empty">Send the alert to see what each system receives:<br>a Teams card, a filed record, a licence check, a drafted request, a refreshed KPI.</div>', { sub: integ.show ? '' : 'nothing sent yet' }) + '</div>';
      h += '<div class="mt12">' + U.card('Connections', U.table([{ h: 'NERSA system or need', k: 0, cls: 't1' }, { h: 'Integration approach', k: 1 }, { h: 'Direction', k: 2, cls: 't2' }, { h: 'Protection', k: 3, cls: 't2' }, { h: 'In this prototype', f: function (r) { return U.tag(r[4], r[4] === 'Simulated' ? '' : 'warn'); } }], [
        ['Identity (single sign-on)', 'Microsoft Entra ID, with NERSA roles mapped to platform permissions', 'In', 'OpenID Connect, MFA', 'Simulated'],
        ['Records management (SharePoint)', 'Evidence bundles and case records filed with retention labels', 'Out', 'Graph API, user delegated', 'Simulated'],
        ['Microsoft 365 and Teams', 'Alert notifications, case collaboration, report distribution', 'Out', 'Graph API', 'Simulated'],
        ['Licensing, tariff and complaints systems', 'Participant and licence data shared by API or scheduled exchange', 'Both', 'API Management, managed identity', 'Mock API'],
        ['Corporate reporting and BI', 'Power BI datasets reused across divisions, with row-level security', 'Out', 'Row-level security', 'Simulated'],
        ['External exchange with licensees', 'Secure APIs and portal', 'Both', 'Mutual TLS', 'Simulated']], { dense: true }), { flush: true, cls: 'scroll-x', foot: 'This prototype simulates every hand-off in the browser. At the demonstration the Teams card and the SharePoint file are shown arriving on the live services.' }) + '</div>';
      return h;
    }
  };

  /* ======================= RFI COVERAGE ======================= */
  R.pages.coverage = {
    id: 'coverage', title: 'RFI Coverage', group: 'Govern', icon: 'coverage',
    render: function () {
      var link = function (p, l) { return R.can(p) ? '<a href="#/' + p + '">' + l + '</a>' : l; };
      var h = U.phead('RFI Coverage', 'Where each requirement of NERSA-2627-ELR-MMSP-BID011 is met in this prototype, and what to do on each page to see it.', 'Evaluator’s map', '');
      h += U.card('Stage 1 presentation criteria', U.table([{ h: '#', k: 'n', cls: 'mono', w: '34px' }, { h: 'Criterion', k: 'name', cls: 't1' }, { h: 'Points', f: function (c) { return '<div class="row"><b class="num" style="width:20px">' + c.pts + '</b><div class="meter ink" style="width:80px"><i style="width:' + c.pts * 5 + '%"></i></div></div>'; }, w: '130px' }, { h: 'Page', f: function (c) { return link(c.page, c.label); }, cls: 'nowrap' }, { h: 'What to do there', k: 'show' }], D.coverage), { flush: true, cls: 'scroll-x', sub: '100 points · 65 to proceed to Stage 2', foot: 'Sixty of the hundred points sit in the data foundation: extraction, transformation and the central hub.' });
      h += '<div class="grid g2 mt12">' + U.card('Annexure 1 service requirements', U.table([{ h: '#', f: function (r, i) { return i + 1; }, cls: 'mono', w: '30px' }, { h: 'Requirement', k: 0 }, { h: '', f: function () { return U.tag('Yes', 'good', 'check'); } }, { h: 'Page', f: function (r) { return link(r[1], r[2]); }, cls: 'nowrap' }], D.annexure, { dense: true }), { flush: true, sub: '10 of 10' }) +
        '<div class="stack">' + U.card('Beyond the scored criteria', U.table([{ h: 'Capability', k: 0, cls: 't1' }, { h: 'Why it matters to the MSU', k: 1 }, { h: 'Page', f: function (r) { return link(r[2], r[3]); }, cls: 'nowrap' }], [
          ['Daily brief and ranked worklist', 'An analyst starts the day on what needs a decision, not on a queue', 'today', 'Today'],
          ['Questions in plain language', 'Answers from certified data, with the query and checks shown', 'ask', 'Ask'],
          ['Always-on analyst agent', 'Screens, correlates and explains at any hour; proposes, never decides', 'agent', 'Agent'],
          ['Oversight of the operator', 'Platform conditions checked from NERSA’s own copy of the data', 'oversight', 'Operator Oversight'],
          ['Market Code change tracking', 'Screens stay aligned with the rules as the Code is finalised', 'rulebook', 'Market Code'],
          ['Case, evidence and Board view', 'From a Board number to the raw record in four steps', 'cases', 'Investigations']], { dense: true }), { flush: true }) +
          U.card('What runs behind each page in delivery', U.table([{ h: 'Page', k: 0, cls: 't1' }, { h: 'Microsoft service', k: 1 }], [['Data Operations', 'Fabric Data Factory, event streams, Document Intelligence'], ['Data Quality', 'Fabric notebooks and quality rules'], ['Data Hub', 'OneLake, Purview lineage'], ['Market Analytics', 'Fabric notebooks, Potomac Economics methods'], ['Surveillance', 'Power BI, Data Activator'], ['Agent and Ask', 'Azure AI Foundry in South Africa North, Fabric data agent'], ['Security', 'Entra ID, row-level security, Sentinel'], ['Integrations', 'Teams, SharePoint, Outlook, API Management'], ['Investigations', 'OneLake history, SharePoint records']], { dense: true }), { flush: true, foot: 'This is a prototype of the experience. NERSA’s build runs in NERSA’s own Azure tenant in South Africa.' }) + '</div></div>';
      return h;
    }
  };
})();
