/* Regulatory Data Hub prototype · workspace pages: Today, Ask, Agent */
(function () {
  'use strict';
  var R = window.RDH, f = R.f, U = R.ui, D = R.D, C = R.charts, AG = R.AG, esc = R.esc, icon = R.icon, A = R.cfg.agent;
  var openWhy = {};

  /* ======================= TODAY ======================= */
  var BLOCKS = [['brief', 'Morning brief'], ['rag', 'Status at a glance'], ['since', 'Since you signed off'], ['prio', 'Priorities'], ['data', 'Data alerts'], ['tonight', 'Tonight’s watch'], ['deadlines', 'Clocks and deadlines'], ['approvals', 'Waiting for a decision'], ['activity', 'Agent activity overnight'], ['pins', 'Pinned answers']];
  function shown(id) { return !R.S.hidden[id]; }

  function actBtn(a, i) {
    var cls = 'btn sm' + (a[2] === 'pri' && i === 0 ? ' pri' : '');
    if (a[1].charAt(0) === '#') return '<a class="' + cls + '" href="' + a[1] + '">' + esc(a[0]) + '</a>';
    var parts = a[1].split(':');
    return '<button class="' + cls + '" data-write data-act="' + parts[0] + '"' + (parts[1] ? ' data-id="' + parts[1] + '"' : '') + '>' + esc(a[0]) + '</button>';
  }
  function prioItem(p, n) {
    var done = R.S.done[p.id], tone = { Decision: 'info', Triage: 'high', Data: 'warn', Prepare: '', Review: '' }[p.kind];
    return '<li class="prio ' + (n === 1 && !done ? 'p1 ' : '') + (done ? 'done' : '') + '">' +
      '<div class="prio__n">' + (done ? '✓' : n) + '</div>' +
      '<div><div class="row gap8">' + U.tag(p.kind, tone) + '<span class="prio__t">' + esc(p.title) + '</span></div>' +
      (done ? '' : '<div class="prio__w">' + esc(p.why) + '</div>') +
      '<div class="prio__m">' + p.meta.map(function (m) { return '<span>' + icon(m[0]) + esc(m[1]) + '</span>'; }).join('') +
      '<button class="btn ghost sm" data-act="prio-why" data-id="' + p.id + '">' + (openWhy[p.id] ? 'Hide ranking' : 'Why ranked here') + '</button></div></div>' +
      '<div class="prio__a">' + (done ? '<button class="btn sm ghost" data-act="prio-done" data-id="' + p.id + '">' + icon('undo') + 'Reopen</button>' :
        '<div class="row gap4">' + p.act.map(actBtn).join('') + '</div><button class="btn sm ghost" data-write data-act="prio-done" data-id="' + p.id + '">' + icon('check') + 'Mark done</button>') + '</div>' +
      (openWhy[p.id] ? '<div class="why"><div class="row mb8"><b>Priority ' + p.score + ' of 100</b><span class="muted">Ranked on what is at stake, how soon it expires, and what it blocks. You can reorder; the agent learns from it.</span></div><div class="factors">' +
        p.factors.map(function (x) { return '<span>' + esc(x[0]) + '</span>' + U.meter(x[1], 'ink') + '<span class="num">' + f.n(x[1] * 100) + '</span><span class="muted">' + esc(x[2]) + '</span>'; }).join('') + '</div></div>' : '') + '</li>';
  }

  R.pages.today = {
    id: 'today', title: 'Today', group: 'Workspace', icon: 'today',
    render: function () {
      var board = R.S.role === 'board', filt = R.tab('prio', 'all');
      var list = AG.priorities.filter(function (p) { return filt === 'all' || (filt === 'other' ? ['Prepare', 'Review'].indexOf(p.kind) >= 0 : p.kind.toLowerCase() === filt); });
      var open = AG.priorities.filter(function (p) { return !R.S.done[p.id]; }).length;
      var h = U.phead('Today', R.cfg.today + ' · ' + (board ? 'Summary for the Board.' : 'What changed since you signed off at 17:05 yesterday, ranked by what needs you first.'), null,
        board ? '<a class="btn" href="#/reports">' + icon('reports') + 'Open the Board view</a>' : '<a class="btn" href="#/ask">' + icon('ask') + 'Ask a question</a><button class="btn" data-act="customise">' + icon('sliders') + 'Customise canvas</button>');

      var brief = U.card('Morning brief', '<div class="brief">' + (board ? AG.briefBoard() : AG.brief()) + '</div>', {
        sub: 'Written 06:30 by ' + A + ' · covers 13 Jul 17:05 to 14 Jul 06:30',
        act: U.ai(A),
        foot: AG.stamp() + '<span class="src">' + (board ? 'summary for the Board role' : '9 sources · every figure links to its record') + '</span><span class="grow"></span><button class="btn sm ghost" data-act="fb" data-v="useful">Useful</button><button class="btn sm ghost" data-act="fb" data-v="not">Not useful</button>' + (board ? '' : '<a class="btn sm ghost" href="#/agent">Earlier briefs</a>')
      });
      var since = U.kpis([
        { label: 'New alerts', value: '3', note: '1 critical, escalated', tone: 'crit', href: '#/surveillance' },
        { label: 'Estimated cost to buyers', value: f.zarm(D.harmTotal), note: 'Case 0047, six intervals', href: '#/cases/0047' },
        { label: 'Waiting for a decision', value: AG.pending().length, note: 'agent proposals', tone: AG.pending().length ? 'warn' : 'good', href: '#/agent' },
        { label: 'Feeds on time', value: '12<small>of 13</small>', note: 'Metering 47 min late', tone: 'warn', href: '#/dataops' },
        { label: 'Margin forecast, 18:30', value: f.pct(D.marginToday[37]), note: 'below the 6% watch level', tone: 'warn', href: '#/market' },
        { label: 'System price now', value: f.n(D.priceToday[D.NOW]), unit: 'R/MWh', note: 'within the 30-day norm', href: '#/market' }
      ]);

      var ragCells = [
        ['r', 'Market conduct', '1 critical alert, in an open case', 'Kestrel Power, 13 Jul. ' + f.zarm(D.harmTotal) + ' estimated cost.', 'surveillance'],
        ['a', 'Tonight’s market', 'Margin ' + f.pct(D.marginToday[37]) + ' at 18:30', 'Below the 6% watch level; one pivotal supplier.', 'market'],
        ['a', 'Data health', '12 of 13 feeds on time', 'One reconciliation outside tolerance; 3 records held.', 'quality'],
        ['a', 'Operator', '2 conditions under query', 'One re-clear variance; one report mismatch.', 'oversight'],
        ['g', 'Triage clocks', 'All within SLA', 'Next due 10:36, alert A-1095.', 'surveillance'],
        ['g', 'Platform', '99.94% available', 'No incidents; every sign-in with a second factor.', 'security']];
      var rag = '<div class="ragrow" aria-label="Status at a glance">' + ragCells.map(function (c) { var ok = R.can(c[4]); return '<' + (ok ? 'a href="#/' + c[4] + '"' : 'div') + ' class="ragcell ' + c[0] + '"><div class="row" style="justify-content:space-between"><span class="muted" style="font-size:11.5px">' + c[1] + '</span>' + U.rag(c[0]) + '</div><b>' + c[2] + '</b><p>' + c[3] + '</p></' + (ok ? 'a' : 'div') + '>'; }).join('') + '</div>';

      var prio = U.card('Priorities', '<ul>' + list.map(function (p) { return prioItem(p, AG.priorities.indexOf(p) + 1); }).join('') + '</ul>', {
        flush: true, sub: open + ' open · ranked by ' + A + ', reordered by you',
        act: U.seg('prio-filter', [{ id: 'all', label: 'All' }, { id: 'decision', label: 'Decisions' }, { id: 'triage', label: 'Triage' }, { id: 'data', label: 'Data' }, { id: 'other', label: 'Other' }], filt),
        foot: '<span>Ranking uses harm at stake, expiry of clocks, confidence and what each item blocks. It is advice: you decide the order of work.</span>'
      });

      var dataAlerts = U.card('Data alerts', '<ul class="list">' + D.dataAlerts.map(function (a) {
        var st = R.S.quarantine[a.id] ? 'Resolved' : a.status;
        return '<li><span class="dot ' + a.sev + '" style="margin-top:5px"></span><div class="grow"><div class="t1">' + esc(a.title) + '</div><div class="t2">' + esc(a.detail) + '</div><div class="row mt4"><span class="tag mono">' + a.id + '</span><span class="muted" style="font-size:12px">' + esc(a.ds) + '</span><span class="grow"></span>' + (st !== 'Open' ? U.tag(st, 'good') : '') + '<a class="btn sm" href="' + a.go + '">' + esc(a.action) + '</a></div></div></li>';
      }).join('') + '</ul>', { flush: true, sub: D.dataAlerts.filter(function (a) { return a.status === 'Open'; }).length + ' open', act: '<a class="btn sm ghost" href="#/quality">Data Quality</a>' });

      var tonight = U.card('Tonight’s watch', C.xy({ h: 150, x: D.times, xEvery: 8, xStart: 0, ymin: 0, ymax: 50, yticks: 5, series: [{ name: 'Margin', data: D.marginToday, color: '#17090c', dashFrom: D.NOW }], hlines: [{ v: 6, label: 'Watch level 6%', left: 1 }], cursor: D.NOW, cursorLabel: 'Now', marks: [{ i: 37, label: f.pct(D.marginToday[37]), dy: -8 }], yfmt: function (v) { return v + '%'; }, tfmt: function (v) { return f.pct(v); }, tipNote: function (i) { return i > D.NOW ? 'Forecast' : 'Actual'; }, label: 'Forecast supply margin today' }) +
        '<ul class="mt8" style="font-size:12.5px">' + [['Peak demand', f.mw(D.demandToday[37]) + ' at 18:30'], ['Pivotal supplier', 'Kestrel Power, 17:30–19:30 (RSI ' + f.n(D.rsiToday[37], 2) + ')'], ['KST-2', 'Declared available · metered 588 MW'], ['Watches armed', 'W-01, W-02, W-03']].map(function (r) { return '<li class="row" style="padding:3px 0"><span class="muted" style="width:112px;flex:none">' + r[0] + '</span><span>' + r[1] + '</span></li>'; }).join('') + '</ul>',
        { sub: 'margin, then forecast', act: '<a class="btn sm ghost" href="#/agent">Watches</a>' });

      var deadlines = U.card('Clocks and deadlines', U.table([{ h: 'Due', k: 0, cls: 'mono nowrap' }, { h: 'What', k: 1 }, { h: '', k: 2 }], [
        ['10:00', 'Information request IR-0047-01 to issue', R.S.flags.irSent ? U.tag('With MSU lead', 'info') : U.tag('Draft', 'warn')],
        ['10:36', 'Triage A-1095 (SLA 16 h)', R.S.alertStatus['A-1095'] ? U.tag('Done', 'good') : U.tag('2 h 54 min', 'warn')],
        ['11:05', 'Triage A-1097', R.S.alertStatus['A-1097'] ? U.tag('Done', 'good') : U.tag('3 h 23 min')],
        ['14:14', 'Triage A-1096', U.tag('6 h 32 min')],
        ['16:21', 'Triage A-1091', U.tag('8 h 39 min')],
        ['16 Jul', 'Case 0046 triage decision', U.tag('2 days')],
        ['22 Jul', 'Case 0044 to Regulator member panel', U.tag('8 days')]
      ], { dense: true }), { flush: true });

      var pend = AG.pending();
      var approvals = U.card('Waiting for a decision', pend.length ? '<ul class="list">' + pend.slice(0, 4).map(function (a) {
        return '<li><div class="grow"><div class="t1">' + esc(a.what) + '</div><div class="t2">' + esc(a.detail) + ' Approver: ' + a.by + '.</div></div><div class="row gap4"><button class="btn sm" data-write data-act="approve" data-id="' + a.id + '">Approve</button><button class="btn sm ghost" data-write data-act="decline" data-id="' + a.id + '">Decline</button></div></li>';
      }).join('') + '</ul>' : '<div class="empty">Nothing is waiting. The agent takes no outward action without a named approver.</div>', { flush: true, sub: pend.length + ' agent proposals', act: '<a class="btn sm ghost" href="#/agent">All</a>' });

      var activity = U.card('Agent activity overnight', '<ul class="tl" style="padding:12px 12px 0">' + [['18:31', 'crit', 'Detected the contradiction', 'KST-2 declared 0 MW, metered 545 MW. Corroborated with SCADA in 36 s.'], ['18:33', 'agent', 'Raised A-1094, score 94', 'Posted to Teams. Analyst on duty opened Case 0047 at 18:52.'], ['21:40', 'agent', 'Estimated the cost', 'Re-cleared six intervals: ' + f.zarm(D.harmTotal) + '.'], ['01:20', 'agent', 'Tested alternative explanations', 'Three refuted, one inconclusive.'], ['06:05', 'warn', 'Drafted the information request', 'Waiting for approval. Not sent.'], ['06:30', 'good', 'Published this brief', '']].map(function (t) {
        return '<li><time>' + t[0] + '</time><span class="pt ' + t[1] + '"></span><div><div class="t1">' + t[2] + '</div><div class="t2">' + t[3] + '</div></div></li>';
      }).join('') + '</ul>', { flush: true, act: '<a class="btn sm ghost" href="#/agent">Full log</a>' });

      var pins = U.card('Pinned answers', R.S.pins.length ? '<ul class="list">' + R.S.pins.map(function (p, i) {
        var it = AG.intents.filter(function (x) { return x.id === p.id; })[0];
        return '<li><div class="grow"><div class="t1">' + esc(it.q) + '</div><div class="t2">' + it.lead().replace(/<\/p><p[^>]*>/g, ' ').replace(/<\/?p[^>]*>/g, '') + '</div><div class="row mt4"><span class="src">pinned ' + p.t + ' · refreshes with the data</span><span class="grow"></span><button class="btn sm ghost" data-act="ask-suggest" data-q="' + esc(it.q) + '">Open</button><button class="btn sm ghost" data-act="unpin" data-i="' + i + '">Remove</button></div></div></li>';
      }).join('') + '</ul>' : '<div class="empty">Pin any answer from Ask and it stays here, refreshed each cycle.<br><a href="#/ask">Ask a question</a></div>', { flush: true });

      if (board) {
        since = U.kpis([{ label: 'System price now', value: f.n(D.priceToday[D.NOW]), unit: 'R/MWh', note: 'within the 30-day norm', href: '#/market' }, { label: 'Estimated cost under investigation', value: f.zarm(D.harmTotal, 0), note: 'one case, six intervals', tone: 'crit', href: '#/reports' }, { label: 'Open cases', value: '7', note: '4 high priority or above', href: '#/cases' }, { label: 'Feeds on time', value: '12<small>of 13</small>', note: 'one late, since recovered' }, { label: 'Platform availability', value: '99.94%', note: 'condition: at least 99.9%', tone: 'good', href: '#/oversight' }]);
        return h + '<div class="stack">' + brief + rag + since + '<div class="note info" style="max-width:760px">The Board role sees the brief and summary figures. Worklists, participant-level detail and agent proposals belong to the MSU. <a href="#/reports">Open the Board view</a></div></div>';
      }
      return h + '<div class="stack">' + (shown('brief') ? brief : '') + (shown('rag') ? rag : '') + (shown('since') ? since : '') +
        '<div class="grid g-2-1"><div class="stack">' + (shown('prio') ? prio : '') + (shown('activity') ? activity : '') + '</div>' +
        '<div class="stack">' + (shown('approvals') ? approvals : '') + (shown('data') ? dataAlerts : '') + (shown('tonight') ? tonight : '') + (shown('deadlines') ? deadlines : '') + (shown('pins') ? pins : '') + '</div></div></div>';
    }
  };
  R.act['prio-filter'] = function (el) { R.tabState.prio = el.dataset.v; R.render(true); };
  R.act['prio-why'] = function (el) { openWhy[el.dataset.id] = !openWhy[el.dataset.id]; R.render(true); };
  R.act['prio-done'] = function (el) { var id = el.dataset.id; if (R.S.done[id]) delete R.S.done[id]; else { R.S.done[id] = 1; R.audit('Marked done', 'Priority ' + id, ''); } R.save(); R.render(true); };
  R.act.fb = function (el) { R.audit('Feedback on brief', 'Morning brief 14 Jul', el.dataset.v); R.toast('Thanks. Feedback recorded against this brief.', 'It is used in the monthly review of the agent, not to change it silently.'); };
  R.act.unpin = function (el) { R.S.pins.splice(+el.dataset.i, 1); R.save(); R.render(true); };
  R.act.customise = function () {
    R.modal({ title: 'Customise canvas', body: '<p class="muted mb12">Choose the blocks on your Today canvas. The choice is kept for you on this device.</p>' + BLOCKS.map(function (b) { return '<label class="row" style="padding:5px 0"><input type="checkbox" data-block="' + b[0] + '"' + (shown(b[0]) ? ' checked' : '') + '> ' + b[1] + '</label>'; }).join(''),
      foot: '<button class="btn pri" data-act="customise-save">Done</button>',
      mount: function (m) { m.addEventListener('change', function (e) { var b = e.target.dataset.block; if (!b) return; if (e.target.checked) delete R.S.hidden[b]; else R.S.hidden[b] = 1; R.save(); }); } });
  };
  R.act['customise-save'] = function () { R.close(); R.render(true); };

  /* ======================= ASK ======================= */
  var TRACE = ['Reading the question', 'Choosing certified datasets', 'Running the query', 'Checking the result against screens and sources'];
  function qa(item, idx) {
    var it = item.it, h = '<article class="qa"><div class="qa__q"><span class="avatar sm">' + R.cfg.user.initials + '</span><span>' + esc(item.q) + '</span><span class="grow"></span><span class="src">' + item.t + '</span></div><div class="qa__a">';
    if (item.state === 'run') {
      return h + '<ul class="trace">' + TRACE.map(function (t, i) { return i > item.step ? '' : '<li class="' + (i === item.step ? 'run' : '') + '">' + icon(i === item.step ? 'loader' : 'check') + t + (i === 1 && it && item.step >= 1 ? ': ' + it.ds.join(', ') : '') + '</li>'; }).join('') + '</ul></div></article>';
    }
    if (!it) {
      return h + '<div class="note">I could not map that to a certified dataset with confidence, so I have not guessed. In this prototype the answers are scripted for the questions below; in delivery the same panel answers any question the curated datasets can support, and says so when they cannot.</div><div class="row wrap mt8">' + AG.suggest.map(function (s) { return '<button class="chip" data-act="ask-suggest" data-q="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div></div></article>';
    }
    var pinned = R.S.pins.some(function (p) { return p.id === it.id; }), viz = it.viz();
    h += '<div class="row mb8" style="margin-bottom:6px">' + U.ai(A) + '</div><div class="lead">' + it.lead() + '</div>' + (viz ? '<div class="card mt12"><div class="card__b' + (viz.indexOf('<table') === 0 ? ' flush' : '') + '">' + viz + '</div></div>' : '');
    h += '<details class="how"' + (idx === 0 ? '' : '') + '><summary>How this was answered<span class="grow"></span><span class="src">' + it.ds.length + ' certified datasets · ' + f.n(it.rows) + ' rows · ' + f.n(it.ms) + ' ms · data as at 07:41</span></summary><div>' +
      '<div class="row wrap mb8">' + it.ds.map(function (d) { return '<a class="tag good" href="#/hub">' + icon('check') + esc(d) + '</a>'; }).join('') + '</div>' + U.sql(it.sql) +
      '<div class="mt8"><b style="font-size:12px">Checks made before answering</b><ul class="trace mt4">' + it.checks.map(function (c) { return '<li>' + icon('check') + esc(c) + '</li>'; }).join('') + '</ul></div><div class="mt8">' + AG.stamp() + '</div></div></details>';
    h += '<div class="row wrap mt12">' + '<button class="btn sm" data-act="pin" data-id="' + it.id + '"' + (pinned ? ' disabled' : '') + '>' + icon('pin') + (pinned ? 'Pinned to Today' : 'Pin to Today') + '</button>' +
      '<button class="btn sm" data-write data-act="to-evidence" data-id="' + it.id + '">' + icon('cases') + 'Add to Case 0047 evidence</button>' +
      '<a class="btn sm" href="' + it.open[1] + '">' + icon('arrow') + it.open[0] + '</a><button class="btn sm ghost" data-act="export-answer">' + icon('download') + 'Export</button></div>';
    h += '<div class="row wrap mt12"><span class="muted" style="font-size:12px">Follow up</span>' + it.follow.map(function (s) { return '<button class="chip" data-act="ask-suggest" data-q="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
    return h + '</div></article>';
  }
  R.pages.ask = {
    id: 'ask', title: 'Ask', group: 'Workspace', icon: 'ask',
    render: function () {
      return U.phead('Ask the hub', 'Put a question in plain language. Answers come only from certified datasets, show the query that produced them, and say when the data cannot support an answer.', null, '') +
        '<div class="ask"><div class="ask__box"><textarea id="ask-q" rows="2" placeholder="For example: which units were declared unavailable while metered above zero in the last 30 days?"></textarea><div class="row"><span class="src">Scope: curated zone · your role sees participant-level data</span><span class="grow"></span><span class="kbd">Enter</span><button class="btn pri sm" data-act="ask-go">' + icon('send') + 'Ask</button></div></div>' +
        '<div class="row wrap mt12">' + AG.suggest.map(function (s) { return '<button class="chip" data-act="ask-suggest" data-q="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>' +
        '<div class="mt16">' + (AG.thread.length ? AG.thread.map(qa).join('') : '<div class="qa"><div class="grid g3">' + [['What it reads', 'The twelve certified datasets in the curated zone. It cannot read the raw zone, drafts, or anything your role cannot see.'], ['What it shows', 'The answer, the figure, the datasets and query used, the row count, and the checks it ran before answering.'], ['What it will not do', 'Guess when data is missing, state a finding of contravention, or send anything outside the MSU.']].map(function (c) { return '<div><b>' + c[0] + '</b><p class="muted mt4">' + c[1] + '</p></div>'; }).join('') + '</div></div>') + '</div></div>';
    },
    mount: function (root, r) {
      var ta = R.$('#ask-q', root);
      ta.value = AG.draft || '';
      if (AG.askFocus) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
      ta.addEventListener('input', function () { AG.draft = ta.value; });
      ta.addEventListener('focus', function () { AG.askFocus = true; });
      ta.addEventListener('blur', function () { if (document.hasFocus()) AG.askFocus = false; });
      ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); var q = ta.value; ta.value = ''; AG.ask(q); } });
      if (r.q.q && !R.pages.ask._seen) { R.pages.ask._seen = 1; AG.ask(r.q.q); }
    }
  };
  R.act['ask-go'] = function () { var ta = R.$('#ask-q'); if (ta) { var q = ta.value; ta.value = ''; AG.ask(q); } };
  R.act['ask-suggest'] = function (el) { AG.ask(el.dataset.q); };
  R.act.pin = function (el) { R.S.pins.unshift({ id: el.dataset.id, t: R.clock().hm }); R.save(); R.toast('Pinned to Today', 'The answer refreshes each cycle.'); R.render(true); };
  R.act['to-evidence'] = function (el) { var it = AG.intents.filter(function (x) { return x.id === el.dataset.id; })[0]; R.audit('Evidence proposed', 'Case 0047', 'Answer: ' + it.q); R.toast('Added to Case 0047 as a working paper', 'It joins the bundle when the investigator accepts it.'); };
  R.act['export-answer'] = function () { R.toast('Export prepared', 'Answer, figure, query and source list as one PDF, labelled Restricted.'); };

  /* ======================= AGENT ======================= */
  R.pages.agent = {
    id: 'agent', title: 'Agent', group: 'Workspace', icon: 'agent',
    render: function () {
      var tab = R.tab('agent', 'activity'), pend = AG.pending(), all = AG.watches.concat(R.S.watches);
      var h = '<div class="agenthead"><span class="avatar lg agent" role="img" aria-label="ntell.ai signal orb"></span><div class="grow">' + U.phead(A + ', the always-on analyst', 'Screens every interval, correlates across sources, explains what it finds and ranks it. It proposes; people decide. Everything it does is logged with its model and rule versions.', null,
        '<span class="watch"><span class="pulse"></span>On watch · last cycle <span class="mono" id="watch-last">' + AG.activity[0][0] + '</span></span>') + '</div></div>';
      h += U.kpis([
        { label: 'Events screened today', value: f.n(412860), note: 'since 00:00' },
        { label: 'Screen runs', value: '160', note: '16 intervals × 10 families' },
        { label: 'Alerts raised, 24 h', value: '4', note: '1 critical', tone: 'crit', href: '#/surveillance' },
        { label: 'Explanations tested, 24 h', value: '14', note: '9 refuted, 2 supported' },
        { label: 'Waiting for approval', value: pend.length, note: 'before any outward action', tone: pend.length ? 'warn' : 'good' },
        { label: 'Detection to alert, median', value: '2<small>min</small>', note: '30 days' }
      ]);
      h += '<div class="mt16"></div>' + U.tabs('agent', [{ id: 'activity', label: 'Activity' }, { id: 'watches', label: 'Standing watches', n: all.length }, { id: 'approvals', label: 'Approvals', n: pend.length }, { id: 'rules', label: 'Schedule and guardrails' }, { id: 'perf', label: 'Performance and learning' }], tab);

      if (tab === 'activity') {
        var filt = R.tab('stream', 'all');
        h += '<div class="grid g-2-1"><div>' + U.card('Activity', '<ul class="stream" id="stream" data-filter="' + filt + '">' + AG.activity.filter(function (r) { return filt === 'all' || r[1] === filt; }).map(function (r) { return AG.row(r); }).join('') + '</ul>', { flush: true, sub: 'Live', act: U.seg('stream-filter', [{ id: 'all', label: 'All' }, { id: 'detect', label: 'Detections' }, { id: 'analysis', label: 'Analysis' }, { id: 'data', label: 'Data' }, { id: 'action', label: 'Actions' }], filt) }) + '</div><div class="stack">' +
          U.card('One cycle', '<ol class="tl">' + [['Observe', 'New records land in the raw zone and are hashed'], ['Screen', 'Ten families run on the closed interval'], ['Correlate', 'Each hit is checked against a second source'], ['Explain', 'Innocent explanations are tested and marked'], ['Rank', 'Severity, materiality, confidence, repeat behaviour'], ['Notify', 'Alert queue, Teams, and the next brief'], ['Learn', 'Analyst dispositions feed the monthly review']].map(function (s, i) { return '<li><time>' + (i + 1) + '</time><span class="pt agent"></span><div><div class="t1">' + s[0] + '</div><div class="t2">' + s[1] + '</div></div></li>'; }).join('') + '</ol>', { sub: 'about 40 s after each interval closes' }) +
          U.card('Last run record', U.kv([['Run', '<span class="mono">run-20270714-0741</span>'], ['Trigger', 'Interval 07:30 cleared'], ['Tools used', 'screen.run, hub.query, hub.reclear'], ['Data touched', 'Offers and bids (380 rows), Prices and results (1), Outages (23), Metering (0 new)'], ['Duration', '11.4 s'], ['Outcome', 'No exceptions'], ['Versions', AG.model + ' · ' + AG.rules]]), { foot: '<a href="#/security">Every run is in the audit log</a>' }) + '</div></div>';
      }
      if (tab === 'watches') {
        h += '<div class="grid g-2-1"><div>' + U.card('Standing watches', U.table([{ h: 'ID', k: 'id', cls: 'mono' }, { h: 'Watch, as written', f: function (w) { return '<div class="t1">' + esc(w.text) + '</div><div class="hash mt4">' + esc(w.rule) + '</div>'; } }, { h: 'Runs', k: 'scope', cls: 'nowrap' }, { h: 'Hits', k: 'hits', num: 1 }, { h: 'Last hit', k: 'last', cls: 'nowrap' }, { h: 'Owner', f: function (w) { return '<span class="nowrap">' + esc(w.by) + '</span><div class="t2">v' + w.v + '</div>'; } }, { h: '', f: function () { return U.tag('Armed', 'good'); } }], all), { flush: true, sub: 'Written in plain language, stored as a rule you can read', foot: 'A watch is a versioned rule. Changing one creates a new version and an audit entry.' }) + '</div><div>' +
          U.card('New watch', '<div class="field"><span>Describe what to watch for</span><textarea class="inp" id="watch-text" rows="3" placeholder="For example: tell me if Ridgeline Energy re-prices any offer above R3 000 between 17:00 and 20:00"></textarea></div><div class="row mt8"><button class="btn" data-act="watch-preview">Preview rule</button><span class="muted" style="font-size:12px">Nothing is armed until you confirm.</span></div><div id="watch-preview" class="mt12"></div>') + '</div></div>';
      }
      if (tab === 'approvals') {
        var decided = AG.approvals.filter(function (a) { return R.S.approvals[a.id]; });
        h += '<div class="grid g-2-1"><div class="stack">' + U.card('Waiting for a decision', pend.length ? '<ul class="list">' + pend.map(function (a) { return '<li><div class="grow"><div class="t1">' + esc(a.what) + '</div><div class="t2">' + esc(a.detail) + '</div><div class="row mt4"><a class="tag" href="' + a.go + '">' + esc(a.ctx) + '</a><span class="muted" style="font-size:12px">Approver: ' + a.by + '</span></div></div><div class="row gap4"><button class="btn sm pri" data-write data-act="approve" data-id="' + a.id + '">Approve</button><button class="btn sm" data-write data-act="decline" data-id="' + a.id + '">Decline</button></div></li>'; }).join('') + '</ul>' : '<div class="empty">Nothing is waiting.</div>', { flush: true }) +
          U.card('Decided', U.table([{ h: 'Proposal', k: 'what' }, { h: 'Decision', f: function (a) { var d = R.S.approvals[a.id]; return U.tag(d.v, d.v === 'Approved' ? 'good' : ''); } }, { h: 'By', f: function (a) { return R.S.approvals[a.id].by; } }, { h: 'At', f: function (a) { return R.S.approvals[a.id].t; }, cls: 'mono' }], decided, { empty: 'No decisions yet in this session.', dense: true }), { flush: true }) + '</div>' +
          '<div>' + U.card('Why approvals exist', '<p class="muted">The agent can read, compute and draft at any hour. Anything that changes a case, a rule or what a participant receives waits for a named person. The approval, the proposal as it stood and the reason are kept together in the audit log.</p><div class="note mt12">Declining is as useful as approving: both are dispositions the monthly review learns from.</div>') + '</div></div>';
      }
      if (tab === 'rules') {
        h += '<div class="grid g3 mb12">' + AG.guard.map(function (g) { return U.card(g[0], '<ul>' + g[2].map(function (x) { return '<li class="row" style="padding:4px 0"><span class="dot ' + g[1] + '"></span>' + x + '</li>'; }).join('') + '</ul>'); }).join('') + '</div><div class="grid g-2-1">' +
          U.card('Scheduled work', U.table([{ h: 'When', k: 0, cls: 'nowrap mono' }, { h: 'Job', k: 1, cls: 't1' }, { h: 'What it does', k: 2 }], AG.schedule, { dense: true }), { flush: true }) +
          U.card('Model governance', U.kv([['Model', AG.model + ', hosted in NERSA’s Azure tenant, South Africa North'], ['Rule set', AG.rules + ', 10 screen families, 5 watches'], ['Data boundary', 'Curated zone only, under the caller’s row-level security'], ['Retention', 'Prompts, outputs and tool calls kept with the audit log'], ['Independent challenge', 'Quarterly review by Potomac Economics; findings to the MSU lead'], ['Fallback', 'If the model is unavailable the rule screens keep running']]), { foot: 'Deterministic rules raise alerts. The model explains, ranks and drafts.' }) + '</div>';
      }
      if (tab === 'perf') {
        var fp = [38, 36, 37, 33, 31, 29, 30, 27, 26, 24, 23, 21];
        h += '<div class="grid g2">' + U.card('Alerts closed as false positive', C.xy({ h: 200, x: D.months, series: [{ name: 'False positives', data: fp, color: '#17090c' }], ymin: 0, ymax: 50, hlines: [{ v: 20, label: 'Target 20%' }], yfmt: function (v) { return v + '%'; }, tfmt: function (v) { return v + '%'; }, marks: [{ i: 11, label: '21%' }] }), { sub: 'share of dispositioned alerts, by month', foot: 'Falling as thresholds are calibrated on live dispositions.' }) +
          U.card('Screens: fires and confirmations, 30 days', U.table([{ h: 'Screen', f: function (s) { return '<span class="t1">' + s.name + '</span>'; } }, { h: 'Fired', k: 'fires', num: 1 }, { h: 'Confirmed', k: 'confirmed', num: 1 }, { h: 'Precision', num: 1, f: function (s) { return s.fires ? f.pct(s.confirmed / s.fires * 100, 0) : '–'; } }, { h: '', f: function (s) { return U.meter(s.fires ? s.confirmed / s.fires : 0, 'ink'); }, w: '90px' }], D.screens, { dense: true }), { flush: true }) + '</div>' +
          '<div class="mt12">' + U.card('Proposed recalibration', '<div class="row start gap16"><div class="grow"><div class="t1" style="font-weight:600">SCR-04 Bid pattern change: raise the threshold from 3.0σ to 3.4σ</div><p class="muted mt4">Backtest on 90 days of dispositions: 21 alerts become 10. All 11 removed were closed as explained. Both confirmed alerts stay above the new threshold (4.1σ and 5.6σ).</p></div>' + (R.S.approvals['ap-thr'] ? U.tag(R.S.approvals['ap-thr'].v, 'good') : '<button class="btn pri" data-write data-act="approve" data-id="ap-thr">Approve</button><button class="btn" data-write data-act="decline" data-id="ap-thr">Decline</button>') + '</div>', { sub: 'From the monthly threshold review', act: U.ai(A + ' proposal') }) + '</div>';
      }
      return h;
    }
  };
  R.act['stream-filter'] = function (el) { R.tabState.stream = el.dataset.v; R.render(true); };
  R.act['watch-preview'] = function () {
    var t = (R.$('#watch-text').value || '').trim(), out = R.$('#watch-preview'); if (!t) { out.innerHTML = '<div class="note warn">Write the watch first.</div>'; return; }
    var conds = [], lc = t.toLowerCase();
    D.participants.forEach(function (p) { if (lc.indexOf(p.short.toLowerCase()) >= 0) conds.push("participant_id = '" + p.id + "'"); });
    var price = lc.match(/r\s?(\d[\d\s]{2,})/); if (price) conds.push('offer.price > ' + price[1].replace(/\s/g, ''));
    var tm = lc.match(/(\d{1,2}[:h]\d{2}).*?(\d{1,2}[:h]\d{2})/); if (tm) conds.push("interval_start BETWEEN '" + tm[1].replace('h', ':') + "' AND '" + tm[2].replace('h', ':') + "'");
    if (/late|delay/.test(lc)) conds.push('arrival > deadline');
    if (/outage|declar/.test(lc)) conds.push('outages.declared_mw = 0');
    if (/meter/.test(lc)) conds.push('metering.mw > 50');
    if (/pivotal|rsi/.test(lc)) conds.push('rsi < 1.0');
    if (!conds.length) conds.push('-- no condition recognised: refine the sentence, or write the rule directly');
    var rule = conds.join('\n  AND ');
    out.innerHTML = '<div class="src mb8">Stored rule, as the agent read your sentence</div>' + U.sql('WHERE ' + rule) + '<div class="row mt8"><button class="btn pri" data-write data-act="watch-arm">Arm this watch</button><span class="muted" style="font-size:12px">Version 1 · owner ' + R.cfg.user.name + '</span></div>';
    out.dataset.rule = rule.replace(/\n\s*/g, ' '); out.dataset.text = t;
  };
  R.act['watch-arm'] = function () {
    var out = R.$('#watch-preview'), id = 'W-0' + (6 + R.S.watches.length);
    R.S.watches.push({ id: id, text: out.dataset.text, rule: out.dataset.rule, scope: 'Every interval', hits: 0, last: '–', by: R.cfg.user.name, v: 1 });
    R.audit('Watch armed', id, out.dataset.text.slice(0, 80)); R.save(); R.toast('Watch ' + id + ' armed', 'It runs from the next cycle.'); R.render(true);
  };
})();
