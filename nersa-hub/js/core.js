/* Regulatory Data Hub prototype · core: namespace, formatting, state, icons,
   components, overlays, router. Classic script, no build step, runs from file://. */
(function () {
  'use strict';
  var R = window.RDH = { pages: {}, act: {}, cfg: {} };

  R.cfg = {
    product: 'Regulatory Data Hub',
    tenant: 'NERSA · Market Surveillance Unit',
    agent: 'AVA',                       // the always-on analyst agent's name: change here only
    agentRole: 'Surveillance analyst agent',
    user: { name: 'Naledi Mokoena', initials: 'NM', title: 'Senior market analyst, MSU' },
    now: { h: 7, m: 42, s: 0 },         // simulated wall clock, SAST
    today: 'Wed 14 Jul 2027',
    eventDay: 'Tue 13 Jul 2027'
  };

  /* ---------- formatting: South African convention, space as thousands separator ---------- */
  var NB = ' ';
  function grp(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, NB); }
  var f = R.f = {
    n: function (x, dp) {
      if (x == null || isNaN(x)) return '–';
      var s = Math.abs(x).toFixed(dp || 0).split('.');
      return (x < 0 ? '−' : '') + grp(s[0]) + (s[1] ? '.' + s[1] : '');
    },
    zar: function (x, dp) { return 'R' + NB + f.n(x, dp); },
    zarm: function (x, dp) { return 'R' + NB + f.n(x / 1e6, dp == null ? 1 : dp) + 'm'; },
    mw: function (x) { return f.n(x) + NB + 'MW'; },
    pct: function (x, dp) { return f.n(x, dp == null ? 1 : dp) + '%'; },
    price: function (x) { return 'R' + NB + f.n(x) + '/MWh'; },
    t: function (i) { var h = Math.floor(i / 2), m = i % 2 ? '30' : '00'; return (h < 10 ? '0' : '') + h + ':' + m; },
    sign: function (x, dp) { return (x > 0 ? '+' : x < 0 ? '−' : '') + f.n(Math.abs(x), dp); }
  };
  R.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var esc = R.esc;
  R.$ = function (sel, root) { return (root || document).querySelector(sel); };
  R.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  R.rng = function (seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  R.clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
  R.sum = function (a, fn) { return a.reduce(function (s, x) { return s + (fn ? fn(x) : x); }, 0); };

  /* ---------- simulated clock ---------- */
  var t0 = Date.now();
  R.clock = function () {
    var c = R.cfg.now, s = c.h * 3600 + c.m * 60 + c.s + Math.floor((Date.now() - t0) / 1000);
    var h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, ss = s % 60;
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return { h: h, m: m, s: ss, hm: p(h) + ':' + p(m), hms: p(h) + ':' + p(m) + ':' + p(ss) };
  };

  /* ---------- state, persisted per browser ---------- */
  var KEY = 'rdh.proto.v1';
  var defaults = function () { return { role: 'analyst', done: {}, snooze: {}, pins: [], audit: [], approvals: {}, alertStatus: {}, quarantine: {}, sealed: null, watches: [], intake: [], flags: {}, hidden: {} }; };
  R.S = defaults();
  try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) for (var k in saved) R.S[k] = saved[k]; } catch (e) { /* storage unavailable: run in memory */ }
  R.save = function () { try { localStorage.setItem(KEY, JSON.stringify(R.S)); } catch (e) { /* ignore */ } };
  R.reset = function () { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } location.hash = '#/today'; location.reload(); };

  R.audit = function (action, object, detail, actor) {
    var role = R.roles[R.S.role];
    R.S.audit.unshift({ t: R.clock().hms, d: '14 Jul', actor: actor || R.cfg.user.name, role: actor ? 'Service' : role.name, action: action, object: object, detail: detail || '' });
    if (R.S.audit.length > 80) R.S.audit.length = 80;
    R.save();
  };

  /* ---------- roles: the same data, four views ---------- */
  R.roles = {
    analyst:  { name: 'MSU analyst', note: '', pages: null, write: true },
    board:    { name: 'Board member', note: 'Summary views only. Participant-level offers, evidence and the audit log are not available to this role.', pages: ['today', 'market', 'reports', 'cases', 'oversight', 'coverage'], write: false },
    licensee: { name: 'Licensee (Kestrel Power)', note: 'Public market data and this licensee’s own submissions only. Row-level security hides every other participant.', pages: ['market', 'participants', 'coverage'], write: false },
    auditor:  { name: 'Auditor', note: 'Read-only access to everything, including the full audit log. No action can be taken in this role.', pages: null, write: false }
  };
  R.can = function (page) { var r = R.roles[R.S.role]; return !r.pages || r.pages.indexOf(page) >= 0; };

  /* ---------- icons: 16px grid, 1.4 stroke ---------- */
  var IC = {
    today: 'M2.5 4h11M2.5 8h6.5M2.5 12h4.5M10 11.4l1.6 1.6 3-3.6',
    ask: 'M7 2.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM10.4 10.4L14 14',
    agent: 'M8 2a6 6 0 100 12A6 6 0 008 2zM8 5.6a2.4 2.4 0 100 4.8 2.4 2.4 0 000-4.8zM8 8l4.2-4.2',
    market: 'M1.5 8h3l2-5 3 10 2-5h3',
    alert: 'M8 2.2L14.3 13H1.7L8 2.2zM8 6.5v3.2M8 11.4v.3',
    analytics: 'M2.5 13.5v-5M6.2 13.5v-9M9.8 13.5V7M13.5 13.5v-11',
    participants: 'M6 3a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM1.5 13.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M11 3.2a2.5 2.5 0 010 4.6M12.3 9.8c1.4.5 2.2 1.8 2.2 3.7',
    cases: 'M1.5 4.5v8a1 1 0 001 1h11a1 1 0 001-1V6a1 1 0 00-1-1H8L6.5 3.5h-4a1 1 0 00-1 1z',
    reports: 'M4 1.5h5.5L13 5v8.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-11a1 1 0 011-1zM9.5 1.5V5H13M5.5 8.5h5M5.5 11h5',
    oversight: 'M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8zM8 6a2 2 0 100 4 2 2 0 000-4z',
    rulebook: 'M3 2.5h8.5A1.5 1.5 0 0113 4v9.5H4.5A1.5 1.5 0 013 12V2.5zM3 12a1.5 1.5 0 011.5-1.5H13M6 5.5h4',
    dataops: 'M2 4.5h8M7.5 2L10 4.5 7.5 7M14 11.5H6M8.5 9L6 11.5 8.5 14',
    quality: 'M8 2a6 6 0 100 12A6 6 0 008 2zM5.2 8.2l2 2 3.6-4',
    hub: 'M3 4c0-1.1 2.2-2 5-2s5 .9 5 2-2.2 2-5 2-5-.9-5-2zM3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4M3 8c0 1.1 2.2 2 5 2s5-.9 5-2',
    security: 'M8 1.8l5 1.8v4c0 3.2-2.1 5.4-5 6.6-2.9-1.2-5-3.4-5-6.6v-4l5-1.8z',
    integrations: 'M3.5 6.2a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6zM12.5 1.7a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6zM12.5 10.7a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6zM5.1 7.2l5.8-2.9M5.1 8.8l5.8 2.9',
    coverage: 'M2.5 2.5H7V7H2.5zM9 2.5h4.5V7H9zM2.5 9H7v4.5H2.5zM9.5 11.2l1.4 1.4 2.6-3',
    chev: 'M6 3.5L10.5 8 6 12.5',
    down: 'M3.5 6L8 10.5 12.5 6',
    x: 'M3.5 3.5l9 9M12.5 3.5l-9 9',
    check: 'M3 8.5l3.2 3.2L13 4.8',
    clock: 'M8 2a6 6 0 100 12A6 6 0 008 2zM8 4.5V8l2.3 1.5',
    info: 'M8 2a6 6 0 100 12A6 6 0 008 2zM8 7.2v4M8 4.8v.3',
    arrow: 'M2.5 8h11M9.5 4l4 4-4 4',
    play: 'M4.5 2.8v10.4L13 8z',
    pause: 'M5 3v10M11 3v10',
    pin: 'M4 2h8v12l-4-3-4 3z',
    download: 'M8 2v8M4.8 7.2L8 10.4l3.2-3.2M2.5 13.5h11',
    upload: 'M8 10.5v-8M4.8 5.3L8 2.1l3.2 3.2M2.5 13.5h11',
    lock: 'M3.5 7h9v6.5h-9zM5.5 7V5a2.5 2.5 0 015 0v2',
    user: 'M8 2.9a2.6 2.6 0 100 5.2 2.6 2.6 0 000-5.2zM2.8 13.8c0-2.8 2.3-4.3 5.2-4.3s5.2 1.5 5.2 4.3',
    send: 'M14 2L7 9M14 2L9.5 14 7 9 2 6.5z',
    refresh: 'M13.5 8a5.5 5.5 0 11-1.7-4M13.5 2.5v3h-3',
    link: 'M6.8 9.2a2.8 2.8 0 004 0l2-2a2.8 2.8 0 00-4-4l-.8.8M9.2 6.8a2.8 2.8 0 00-4 0l-2 2a2.8 2.8 0 004 4l.8-.8',
    menu: 'M2.5 4h11M2.5 8h11M2.5 12h11',
    plus: 'M8 3v10M3 8h10',
    ext: 'M9 2.5h4.5V7M13.5 2.5l-6 6M11.5 9.5v3a1 1 0 01-1 1h-7a1 1 0 01-1-1v-7a1 1 0 011-1h3',
    loader: 'M8 1.8v2.6M8 11.6v2.6M1.8 8h2.6M11.6 8h2.6M3.6 3.6l1.8 1.8M10.6 10.6l1.8 1.8',
    bolt: 'M9 1.5L3.5 9H8l-1 5.5L12.5 7H8z',
    flag: 'M3.5 14V2.5M3.5 3h8L10 5.5 11.5 8h-8',
    doc: 'M4 1.5h5.5L13 5v8.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-11a1 1 0 011-1zM9.5 1.5V5H13',
    seal: 'M8 1.8l1.5 1.3 2-.2.6 1.9 1.7 1-.7 1.9.7 1.9-1.7 1-.6 1.9-2-.2L8 13.6l-1.5-1.3-2 .2-.6-1.9-1.7-1 .7-1.9-.7-1.9 1.7-1 .6-1.9 2 .2zM5.8 7.8l1.6 1.6 2.8-3',
    sliders: 'M2.5 4.5h6M11.5 4.5h2M2.5 11.5h2M7.5 11.5h6M10 3v3M6 10v3',
    eye: 'M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8zM8 6a2 2 0 100 4 2 2 0 000-4z',
    undo: 'M5 3L2 6l3 3M2 6h7.5a4 4 0 010 8H6'
  };
  R.icon = function (name) {
    return '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (IC[name] || IC.info) + '"/></svg>';
  };
  var icon = R.icon;

  /* ---------- components (all return HTML strings) ---------- */
  var U = R.ui = {};
  U.tag = function (text, tone, ic) { return '<span class="tag ' + (tone || '') + '">' + (ic ? icon(ic) : '') + esc(text) + '</span>'; };
  U.tone = function (score) { return score >= 85 ? 'crit' : score >= 70 ? 'high' : score >= 50 ? 'warn' : ''; };
  U.sevName = function (score) { return score >= 85 ? 'Critical' : score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low'; };
  U.score = function (score, lg) { return '<span class="score ' + U.tone(score) + (lg ? ' lg' : '') + '" title="Priority score ' + score + ' of 100 · ' + U.sevName(score) + '">' + score + '</span>'; };
  U.ai = function (label) { return '<span class="ai" title="Produced by the agent. Model and rule versions are stamped on the audit record.">' + icon('agent') + esc(label || (R.cfg.agent + ' draft')) + '</span>'; };
  U.cite = function (label, href) { return '<a class="cite" href="' + href + '">' + esc(label) + '</a>'; };
  U.kpi = function (o) {
    var el = o.href ? 'a' : 'div';
    return '<' + el + (o.href ? ' href="' + o.href + '"' : '') + ' class="kpi ' + (o.tone || '') + '">' +
      '<div class="kpi__l">' + esc(o.label) + '</div>' +
      '<div class="kpi__v">' + o.value + (o.unit ? '<small>' + esc(o.unit) + '</small>' : '') + '</div>' +
      '<div class="kpi__n">' + (o.note || '&nbsp;') + '</div></' + el + '>';
  };
  U.kpis = function (list) { return '<div class="kpis">' + list.map(U.kpi).join('') + '</div>'; };
  U.card = function (title, body, o) {
    o = o || {};
    return '<section class="card' + (o.cls ? ' ' + o.cls : '') + '"' + (o.id ? ' id="' + o.id + '"' : '') + '>' +
      (title ? '<header class="card__h"><h3>' + title + '</h3>' + (o.sub ? '<span class="sub">' + o.sub + '</span>' : '') + (o.act ? '<div class="act">' + o.act + '</div>' : '') + '</header>' : '') +
      '<div class="card__b' + (o.flush ? ' flush' : '') + '">' + body + '</div>' +
      (o.foot ? '<footer class="card__f">' + o.foot + '</footer>' : '') + '</section>';
  };
  /* cols: [{h, k|f, num, w, cls}] */
  U.table = function (cols, rows, o) {
    o = o || {};
    var h = '<table class="tbl' + (o.dense ? ' dense' : '') + (o.cls ? ' ' + o.cls : '') + '"><thead><tr>' + cols.map(function (c) {
      return '<th' + (c.num ? ' class="num"' : '') + (c.w ? ' style="width:' + c.w + '"' : '') + '>' + (c.h || '') + '</th>';
    }).join('') + '</tr></thead><tbody>';
    h += rows.map(function (r, i) {
      var attr = o.row ? o.row(r, i) : '';
      return '<tr ' + attr + '>' + cols.map(function (c) {
        var v = c.f ? c.f(r, i) : r[c.k];
        return '<td class="' + (c.num ? 'num ' : '') + (c.cls || '') + '">' + (v == null ? '' : v) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    if (!rows.length) h += '<tr><td colspan="' + cols.length + '"><div class="empty">' + (o.empty || 'Nothing to show.') + '</div></td></tr>';
    return h + '</tbody></table>';
  };
  U.tabs = function (id, tabs, cur) {
    return '<div class="tabs" role="tablist">' + tabs.map(function (t) {
      return '<button role="tab" class="' + (t.id === cur ? 'on' : '') + '" data-act="tab" data-tabs="' + id + '" data-tab="' + t.id + '">' + esc(t.label) + (t.n != null ? '<span class="n">' + t.n + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  };
  U.seg = function (act, opts, cur, extra) {
    return '<div class="seg">' + opts.map(function (o) {
      return '<button class="' + (o.id === cur ? 'on' : '') + '" data-act="' + act + '" data-v="' + o.id + '" ' + (extra || '') + '>' + esc(o.label) + '</button>';
    }).join('') + '</div>';
  };
  U.meter = function (v, tone) { return '<div class="meter ' + (tone || '') + '"><i style="width:' + R.clamp(v * 100, 0, 100).toFixed(0) + '%"></i></div>'; };
  U.kv = function (pairs) { return '<dl class="kv">' + pairs.map(function (p) { return '<dt>' + p[0] + '</dt><dd>' + p[1] + '</dd>'; }).join('') + '</dl>'; };
  U.legend = function (items) {
    return '<div class="legend">' + items.map(function (i) {
      return '<span><i class="key' + (i.sq ? ' sq' : '') + (i.dash ? ' dash' : '') + '" style="background:' + i.c + ';color:' + i.c + '"></i>' + esc(i.t) + '</span>';
    }).join('') + '</div>';
  };
  U.src = function (dataset, extra) { return '<span class="src">Source <b>' + esc(dataset) + '</b>' + (extra ? ' · ' + esc(extra) : '') + '</span>'; };
  U.person = function (name) {
    if (!name) return '<span class="faint">Unassigned</span>';
    var a = name === R.cfg.agent;
    var ini = a ? 'A' : name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('');
    return '<span class="row gap4 nowrap"><span class="avatar sm' + (a ? ' agent' : '') + '">' + ini + '</span>' + esc(name) + '</span>';
  };
  U.phead = function (title, desc, ref, actions) {
    return '<header class="phead"><div><h1>' + title + (ref ? '<span class="ref">' + esc(ref) + '</span>' : '') + '</h1>' + (desc ? '<p>' + desc + '</p>' : '') + '</div>' +
      (actions ? '<div class="phead__act">' + actions + '</div>' : '') + '</header>';
  };
  U.spark = function (data, color, hi) {
    var w = 84, h = 22, mn = Math.min.apply(null, data), mx = Math.max.apply(null, data), d = mx - mn || 1;
    var pts = data.map(function (v, i) { return [(i / (data.length - 1)) * (w - 4) + 2, h - 3 - ((v - mn) / d) * (h - 6)]; });
    var last = pts[pts.length - 1];
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + '" fill="none" stroke="' + (color || '#98a2b3') + '" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="2.5" fill="' + (hi || color || '#0b2545') + '"/></svg>';
  };
  U.hbar = function (rows, o) {
    o = o || {};
    var mx = o.max || Math.max.apply(null, rows.map(function (r) { return r.v; }));
    return '<div class="hbar">' + rows.map(function (r) {
      return '<span class="' + (r.em ? 't1' : '') + '" style="' + (r.em ? 'font-weight:600' : '') + '">' + r.l + '</span><span class="trk"><i class="' + (r.em ? 'em' : r.mute ? 'mute' : '') + '" style="width:' + (r.v / mx * 100).toFixed(1) + '%' + (r.c ? ';background:' + r.c : '') + '"></i>' +
        (o.ref ? '<b style="left:' + (o.ref / mx * 100).toFixed(1) + '%" title="' + esc(o.refLabel || '') + '"></b>' : '') + '</span><span class="v">' + (r.t || f.n(r.v)) + '</span>';
    }).join('') + '</div>';
  };
  U.steps = function (list, cur) {
    return '<div class="steps">' + list.map(function (s, i) {
      var st = cur == null ? '' : i < cur ? 'done' : i === cur ? 'now' : '';
      return '<div class="step ' + st + '"><div class="n">' + (st === 'done' ? '✓ ' : '') + (i < 9 ? '0' : '') + (i + 1) + '</div><div class="t">' + esc(s.t) + '</div>' + (s.d ? '<div class="d">' + s.d + '</div>' : '') + '</div>';
    }).join('') + '</div>';
  };
  U.sql = function (code) {
    var h = esc(code).replace(/(--[^\n]*)/g, '<span class="c">$1</span>')
      .replace(/\b(SELECT|FROM|WHERE|AND|OR|JOIN|LEFT|ON|GROUP BY|ORDER BY|AS|WITH|OVER|PARTITION BY|HAVING|LIMIT|DESC|ASC|BETWEEN|CASE|WHEN|THEN|ELSE|END|IN|NOT|NULL|IS|SUM|AVG|COUNT|MAX|MIN|STDDEV|ROUND|LAG|DISTINCT|TOP)\b/g, '<span class="k">$1</span>')
      .replace(/(&#39;[^&]*?&#39;)/g, '<span class="s">$1</span>');
    return '<pre class="code">' + h + '</pre>';
  };

  /* keep "R 4 250" and "26 140 MW" from breaking across lines: text nodes only, never markup */
  R.tidy = function (root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(function (t) {
      var p = t.parentNode, v = t.nodeValue; if (!p || !/\d/.test(v) || p.closest('svg,pre,textarea,.hash,[contenteditable]')) return;
      var o = v.replace(/(^|[^\w-])R ?(?=\d)/g, '$1R\u00a0').replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u00a0'); if (o !== v) t.nodeValue = o;
    });
  };

  /* ---------- overlays ---------- */
  R.drawer = function (o) {
    var d = R.$('#drawer');
    d.className = 'drawer on' + (o.wide ? ' wide' : '');
    d.innerHTML = '<header class="drawer__h"><div class="grow">' + (o.kicker ? '<div class="muted mb8" style="margin-bottom:4px">' + o.kicker + '</div>' : '') + '<h2>' + o.title + '</h2>' + (o.sub ? '<div class="muted mt4">' + o.sub + '</div>' : '') + '</div><button class="ibtn" data-act="close" aria-label="Close">' + icon('x') + '</button></header>' +
      '<div class="drawer__b">' + o.body + '</div>' + (o.foot ? '<footer class="drawer__f">' + o.foot + '</footer>' : '');
    R.$('#scrim').classList.add('on');
    if (o.mount) o.mount(d);
    R.tidy(d); R.charts.bind(d);
  };
  R.modal = function (o) {
    var m = R.$('#modal');
    m.className = 'modal on' + (o.wide ? ' wide' : '');
    m.innerHTML = '<header class="modal__h"><h2 class="grow">' + o.title + '</h2><button class="ibtn" data-act="close" aria-label="Close">' + icon('x') + '</button></header><div class="modal__b">' + o.body + '</div>' + (o.foot ? '<footer class="modal__f">' + o.foot + '</footer>' : '');
    R.$('#scrim').classList.add('on');
    if (o.mount) o.mount(m);
    R.tidy(m);
    var first = m.querySelector('input,textarea,select'); if (first) first.focus();
  };
  R.close = function () {
    R.$('#drawer').classList.remove('on'); R.$('#modal').classList.remove('on'); R.$('#scrim').classList.remove('on');
  };
  R.toast = function (msg, sub) {
    var t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = icon('check') + '<div>' + esc(msg) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div>';
    R.$('#toasts').appendChild(t);
    setTimeout(function () { t.remove(); }, 4200);
  };
  R.act.close = function () { R.close(); };

  /* ---------- router ---------- */
  R.route = function () {
    var h = (location.hash || '#/today').replace(/^#\/?/, '');
    var q = {}, qi = h.indexOf('?');
    if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (p) { var kv = p.split('='); q[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); }); h = h.slice(0, qi); }
    var parts = h.split('/').filter(Boolean);
    return { page: parts[0] || 'today', sub: parts[1], sub2: parts[2], q: q };
  };
  R.go = function (hash) { if (location.hash === hash) R.render(); else location.hash = hash; };
  R.tabState = {};
  R.act.tab = function (el) { R.tabState[el.dataset.tabs] = el.dataset.tab; R.render(true); };
  R.tab = function (id, def) { return R.tabState[id] || def; };

  R.render = function (keepScroll) {
    var r = R.route(), pg = R.pages[r.page] || R.pages.today, view = R.$('#view'), y = window.scrollY;
    if (!keepScroll) R.close();      // a refresh in place leaves an open drawer or dialog alone
    if (!R.can(pg.id)) {
      view.innerHTML = '<div class="page">' + U.phead(pg.title, '') + '<div class="note warn" style="max-width:640px"><b>Not available to this role.</b><br>The ' + esc(R.roles[R.S.role].name) + ' role has no access to this page. Access is granted by Entra ID role and enforced again at the dataset by row-level security.</div></div>';
    } else {
      view.innerHTML = '<div class="page" data-page="' + pg.id + '">' + pg.render(r) + '</div>';
      if (pg.mount) pg.mount(view, r);
      R.tidy(view); R.charts.bind(view);
    }
    R.shell.sync(r, pg);
    if (!keepScroll) window.scrollTo(0, 0); else window.scrollTo(0, y);
    document.title = pg.title + ' · ' + R.cfg.product;
  };

  /* ---------- global delegation ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]');
    if (a) {
      var fn = R.act[a.dataset.act];
      if (fn) { e.preventDefault(); fn(a, e); }
      return;
    }
    var g = e.target.closest('[data-go]');
    if (g && !e.target.closest('a,button')) { R.go(g.dataset.go); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') R.close();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); var i = R.$('#askbar-input'); if (i) i.focus(); }
  });
  window.addEventListener('hashchange', function () { R.render(); });
})();
