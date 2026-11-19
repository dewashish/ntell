/* Regulatory Data Hub prototype · shell: navigation, top bar, role view, boot */
(function () {
  'use strict';
  var R = window.RDH, U = R.ui, D = R.D, AG = R.AG, icon = R.icon, esc = R.esc;
  var NAV = [
    ['Workspace', ['today', 'ask', 'agent']],
    ['Monitor', ['market', 'surveillance', 'analytics', 'participants', 'oversight']],
    ['Enforce', ['cases', 'reports']],
    ['Data', ['dataops', 'quality', 'hub']],
    ['Govern', ['rulebook', 'security', 'integrations', 'coverage']]
  ];
  var LABEL = { today: 'Today', ask: 'Ask', agent: 'Agent', market: 'Market Overview', surveillance: 'Surveillance', analytics: 'Market Analytics', participants: 'Participants', oversight: 'Operator Oversight', cases: 'Investigations', reports: 'Reports', dataops: 'Data Operations', quality: 'Data Quality', hub: 'Data Hub', rulebook: 'Market Code', security: 'Security', integrations: 'Integrations', coverage: 'RFI Coverage' };

  function counts() {
    var open = D.openAlerts(), q = D.quarantine.filter(function (x) { return !R.S.quarantine[x.id]; }).length;
    return {
      today: R.S.role === 'board' ? null : AG.priorities.filter(function (p) { return !R.S.done[p.id]; }).length,
      agent: AG.pending().length || null,
      surveillance: open.length, surveillanceCrit: open.some(function (a) { return a.score >= 85; }),
      cases: D.cases.filter(function (c) { return c.stage < 5; }).length,
      quality: q || null
    };
  }
  function side(cur) {
    var c = counts();
    var h = '<div class="brand"><svg class="brand__mark" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#0b2545"/><path d="M6 8h12M6 12h12M6 16h7" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="17" cy="16" r="1.6" fill="#e0a100"/></svg><div><div class="brand__name">' + R.cfg.product + '</div><div class="brand__sub">' + R.cfg.tenant + '</div></div></div><nav class="nav" aria-label="Main">';
    NAV.forEach(function (g) {
      var items = g[1].filter(function (id) { return R.pages[id] && R.can(id); });
      if (!items.length) return;
      h += '<div class="nav__group">' + g[0] + '</div>';
      items.forEach(function (id) {
        var n = c[id];
        h += '<a href="#/' + id + '" class="' + (id === cur ? 'on' : '') + '"' + (id === cur ? ' aria-current="page"' : '') + '>' + icon(R.pages[id].icon) + '<span>' + LABEL[id] + '</span>' + (n ? '<span class="count' + (id === 'surveillance' && c.surveillanceCrit ? ' crit' : '') + '">' + n + '</span>' : '') + '</a>';
      });
    });
    return h + '</nav><div class="side__foot"><b>Prototype · synthetic data</b><br>Every participant, price and record is invented. Built by SDM Asset Management &amp; Consulting with Potomac Economics.</div>';
  }
  function top(r, pg) {
    var grp = NAV.filter(function (g) { return g[1].indexOf(pg.id) >= 0; })[0];
    return '<button class="ibtn menu-btn" data-act="menu" aria-label="Menu">' + icon('menu') + '</button>' +
      '<div class="crumbs"><span>' + (grp ? grp[0] : '') + '</span>' + icon('chev') + '<b>' + LABEL[pg.id] + '</b>' + (r.sub ? icon('chev') + '<b>' + esc(r.sub) + '</b>' : '') + '</div>' +
      (R.can('ask') ? '<label class="askbar">' + icon('ask') + '<input id="askbar-input" type="text" placeholder="Ask about the market, a participant or the data" autocomplete="off" aria-label="Ask a question"><span class="kbd">Ctrl K</span></label>' : '<span class="grow" style="margin-left:auto"></span>') +
      '<div class="top__meta">' + (R.can('agent') ? '<a class="watch" href="#/agent" title="The agent is running. Last cycle shown."><span class="pulse"></span><span class="lbl">' + R.cfg.agent + ' on watch</span></a>' : '') +
      '<span class="clock" id="clock"></span>' +
      '<select class="rolesel" id="rolesel" aria-label="View as role" title="View the same data as another role">' + Object.keys(R.roles).map(function (k) { return '<option value="' + k + '"' + (k === R.S.role ? ' selected' : '') + '>View as: ' + R.roles[k].name + '</option>'; }).join('') + '</select>' +
      '<button class="user" data-act="user-menu" title="Account"><span class="avatar">' + R.cfg.user.initials + '</span><span class="who"><div style="font-weight:600;line-height:1.2">' + R.cfg.user.name + '</div><div class="muted" style="font-size:11px;line-height:1.2">' + R.cfg.user.title + '</div></span></button></div>';
  }
  R.shell = {
    sync: function (r, pg) {
      R.$('#side').innerHTML = side(pg.id); R.$('#side').classList.remove('open');
      R.$('#top').innerHTML = top(r, pg);
      var role = R.roles[R.S.role];
      document.body.classList.toggle('ro', !role.write);
      R.$('#banner').innerHTML = R.S.role === 'analyst' ? '' : '<div class="banner">' + icon('eye') + '<span><b>Viewing as ' + esc(role.name) + '.</b> ' + esc(role.note) + '</span><button class="btn sm" data-act="role-reset">Return to analyst view</button></div>';
      tick();
    }
  };
  function tick() { var c = R.$('#clock'); if (c) { c.textContent = R.cfg.today.slice(0, 10) + ' · ' + R.clock().hms; c.title = R.cfg.today + ', South African Standard Time (simulated clock)'; } }

  R.act.menu = function () { R.$('#side').classList.toggle('open'); };
  R.act['role-reset'] = function () { setRole('analyst'); };
  function setRole(k) {
    R.S.role = k; R.save(); R.audit('Role view changed', 'View as ' + R.roles[k].name, 'Prototype control');
    if (!R.can(R.route().page)) location.hash = '#/' + (R.roles[k].pages ? R.roles[k].pages[0] : 'today'); else R.render();
  }
  R.act['user-menu'] = function () {
    R.modal({ title: R.cfg.user.name, body: U.kv([['Role', R.roles[R.S.role].name], ['Signed in', '07:12 · Entra ID, MFA number match'], ['Workstation', 'MSU-CR-04, control room'], ['Session', 'Expires 15:12 or after 15 min idle']]) + '<div class="note mt12">This is a front-end prototype. Actions you take are kept in this browser so the demonstration can be repeated.</div>',
      foot: '<button class="btn danger" data-act="reset-demo">' + icon('refresh') + 'Reset demonstration</button><button class="btn pri" data-act="close">Close</button>' });
  };
  R.act['reset-demo'] = function () { R.reset(); };

  document.addEventListener('change', function (e) { if (e.target.id === 'rolesel') setRole(e.target.value); });
  document.addEventListener('keydown', function (e) {
    if (e.target.id === 'askbar-input' && e.key === 'Enter') { var q = e.target.value.trim(); e.target.value = ''; e.target.blur(); if (q) AG.ask(q); }
  });

  /* boot */
  if (!R.S.audit.length) { R.S.audit = D.auditSeed.slice(); }
  R.render();
  setInterval(tick, 1000);
  setInterval(AG.tick, 7000);
})();
