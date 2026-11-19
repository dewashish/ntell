/* Regulatory Data Hub prototype · data pages: Data Operations, Data Quality, Data Hub */
(function () {
  'use strict';
  var R = window.RDH, f = R.f, U = R.ui, D = R.D, C = R.charts, esc = R.esc, icon = R.icon, A = R.cfg.agent;
  var KIND = { API: 'info', STREAM: 'info', FILE: '', DOC: 'warn', MANUAL: '' }, KNAME = { API: 'API', STREAM: 'Event stream', FILE: 'Structured file', DOC: 'Unstructured', MANUAL: 'Manual' };

  /* ======================= DATA OPERATIONS ======================= */
  var run = { active: false, idx: -1, step: 0, done: {}, log: [], extra: {} }, STEPS = ['Connect', 'Pull', 'Land in raw', 'Seal hash'];
  var sample = null;
  function hx(seed) { var r = R.rng(seed), s = ''; for (var i = 0; i < 12; i++) s += Math.floor(r() * 16).toString(16); return s; }
  R.act['run-cycle'] = function () {
    if (run.active) return;
    run = { active: true, idx: 0, step: 0, done: {}, log: [], extra: {} }; R.tabState.dops = 'sources';
    R.audit('Ingestion cycle started', 'All 13 sources', 'On demand'); R.render(true);
    var t = setInterval(function () {
      var s = D.sources[run.idx];
      run.step++;
      if (run.step >= STEPS.length) {
        var add = { API: 40, STREAM: 120, FILE: 0, DOC: 1, MANUAL: 0 }[s.kind] + (run.idx * 7) % 30; if (s.kind === 'FILE' || s.kind === 'MANUAL' || s.id === 'code') add = 0;
        run.done[s.id] = 1; run.extra[s.id] = add;
        run.log.unshift([R.clock().hms, s.name, { API: 'GET 200', STREAM: 'offset committed', FILE: 'no new file', DOC: 'model run', MANUAL: 'nothing pending' }[s.kind], add, hx(run.idx + 99)]);
        run.idx++; run.step = 0;
        if (run.idx >= D.sources.length) { clearInterval(t); run.active = false; R.audit('Ingestion cycle completed', '13 sources', R.sum(Object.keys(run.extra), function (k) { return run.extra[k]; }) + ' new records sealed in the raw zone'); R.toast('Ingestion cycle complete', 'Every source type pulled; each landing sealed with a SHA-256 hash.'); }
      }
      if (R.route().page === 'dataops') R.render(true);
    }, 170);
  };
  function intakeChecks(name, rows, cols, held) {
    return [['File type and size', 'Accepted', name], ['Schema', cols ? 'Matched' : 'Matched to template', (cols || 6) + ' columns recognised'], ['Row count', 'Read', f.n(rows) + ' rows'], ['Participant codes in the register', held ? '1 row held' : 'All matched', held ? 'Row ' + held + ': code not found' : ''], ['Duplicates against the hub', 'None', ''], ['Value ranges', 'Within limits', '']];
  }
  function takeFile(file) {
    var done = function (rows, cols) { sample = { name: file.name, rows: rows, cols: cols, held: rows > 3 ? Math.min(rows, 14) : null, size: file.size }; R.audit('Manual upload received', file.name, f.n(rows) + ' rows, validation run'); R.render(true); };
    if (/\.(csv|txt|tsv)$/i.test(file.name) && window.FileReader) {
      var fr = new FileReader(); fr.onload = function () { var lines = String(fr.result).split(/\r?\n/).filter(function (l) { return l.trim(); }); done(Math.max(0, lines.length - 1), (lines[0] || '').split(/[,;\t]/).length); }; fr.readAsText(file);
    } else done(Math.max(12, Math.round(file.size / 180)), null);
  }
  R.act['intake-sample'] = function () { sample = { name: 'Bilateral_nominations_14Jul.csv', rows: 86, cols: 7, held: null, size: 15480 }; R.audit('Manual upload received', sample.name, '86 rows, validation run'); R.render(true); };
  R.act['intake-submit'] = function () { R.S.intake.unshift({ name: sample.name, rows: sample.rows, held: sample.held ? 1 : 0, t: R.clock().hm, by: R.cfg.user.name, status: 'Awaiting second approver' }); R.audit('Manual upload submitted', sample.name, 'Awaiting approval by a second person'); sample = null; R.save(); R.toast('Submitted for approval', 'A second person must approve before it leaves staging.'); R.render(true); };
  R.act['intake-approve'] = function () { R.S.flags.intakeApproved = R.clock().hm; R.audit('Manual upload approved', 'Prudential_cover_Jul.xlsx', '37 rows released; 1 held in quarantine (Q-0411)'); R.save(); R.toast('Approved', '37 rows released to the curated dataset. The held row stays in quarantine.'); R.render(true); };
  R.act['field-confirm'] = function () { R.S.quarantine['DQ-316'] = { t: R.clock().hm }; R.S.quarantine['Q-0409'] = { act: 'Confirmed against the document', why: 'Return to service 20:30 confirmed by eye against the PDF', t: R.clock().hm, by: R.cfg.user.name }; R.audit('Extraction confirmed', 'ON-2027-0713-044 · return_to_service', '20:30 confirmed against the PDF'); R.save(); R.toast('Field confirmed', 'The confirmation and your name are stored with the record.'); R.render(true); };

  R.pages.dataops = {
    id: 'dataops', title: 'Data Operations', group: 'Data', icon: 'dataops',
    render: function () {
      var tab = R.tab('dops', 'sources'), tot = R.sum(D.sources, function (s) { return s.n; });
      var h = U.phead('Data Operations', 'Every source type the RFI lists, pulled through whichever channel the source supports: direct API, event stream, structured file, unstructured document and controlled manual upload.', 'RFI 4.3.1',
        '<button class="btn pri' + (run.active ? ' is-off' : '') + '" data-write data-act="run-cycle">' + icon(run.active ? 'loader' : 'play') + (run.active ? 'Running…' : 'Run ingestion cycle') + '</button>');
      h += U.kpis([{ label: 'Sources connected', value: '13<small>of 13</small>', note: 'all twelve RFI source types', tone: 'good' }, { label: 'Records received today', value: f.n(tot + R.sum(Object.keys(run.extra), function (k) { return run.extra[k]; })), note: 'since 00:00' }, { label: 'On time', value: '12<small>of 13</small>', note: 'Metering 47 min late', tone: 'warn' }, { label: 'Stream lag, median', value: '2<small>s</small>', note: 'dispatch and balancing' }, { label: 'Raw landings sealed today', value: f.n(1842 + run.log.length), note: 'each with a SHA-256 hash' }]);
      h += '<div class="mt16"></div>' + U.tabs('dops', [{ id: 'sources', label: 'Sources', n: 13 }, { id: 'intake', label: 'Manual data intake', n: 1 + R.S.intake.length }, { id: 'docs', label: 'Documents and e-mail' }, { id: 'runs', label: 'Run history' }], tab);
      if (tab === 'sources') {
        var mx = 18240;
        h += '<div class="steps mb12">' + [['Connect', 'Managed identity or mutual TLS; no stored passwords'], ['Pull', 'API call, stream offset, file pick-up or document read'], ['Land in raw', 'Stored exactly as received, append-only'], ['Seal hash', 'SHA-256 of the landing, written to the control log']].map(function (s, k) { return '<div class="step ' + (run.active ? (k < run.step ? 'done' : k === run.step ? 'now' : '') : '') + '"><div class="n">0' + (k + 1) + '</div><div class="t">' + s[0] + '</div><div class="d">' + s[1] + '</div></div>'; }).join('') + '</div>' +
          '<div class="grid g-3-1"><div>' + U.card('', U.table([{ h: 'Source', w: '27%', f: function (s) { return '<div class="t1">' + s.name + '</div><div class="t2">RFI type: ' + s.rfi + '</div>'; } }, { h: 'Channel and method', w: '33%', f: function (s) { return U.tag(KNAME[s.kind], KIND[s.kind]) + '<div class="t2 mt4">' + s.method + '</div>'; } }, { h: 'Received today', w: '17%', f: function (s) { var n = s.n + (run.extra[s.id] || 0); return '<div class="row nowrap"><span class="num" style="width:46px;text-align:right">' + f.n(n) + '</span><div class="meter ink" style="width:56px"><i style="width:' + Math.max(2, Math.sqrt(n / mx) * 100).toFixed(0) + '%"></i></div></div><div class="t2" style="padding-left:54px">' + s.unit + '</div>'; } }, { h: 'Last', f: function (s) { return '<span class="mono nowrap">' + (run.done[s.id] ? R.clock().hm : s.last) + '</span><div class="t2">' + s.lat + '</div>'; } }, { h: 'Status', f: function (s, i) {
          if (run.active && i === run.idx) return U.tag(STEPS[run.step] + '…', 'info', 'loader');
          if (run.done[s.id]) return U.tag('Pulled', 'good', 'check');
          return s.warn ? U.tag(s.warn, 'warn') : U.tag('Healthy', 'good');
        } }], D.sources, { dense: true, row: function (s, i) { return run.active && i === run.idx ? 'class="sel"' : ''; } }), { flush: true, foot: 'Bar length on a square-root scale. Records per source for the trading day; synthetic.' }) + '</div><div>' +
          U.card('Cycle log', run.log.length ? '<ul class="stream">' + run.log.map(function (l) { return '<li style="grid-template-columns:54px minmax(0,1fr)"><time>' + l[0] + '</time><span><b>' + esc(l[1]) + '</b><br>' + l[2] + ' · ' + (l[3] ? f.n(l[3]) + ' new' : 'no change') + '<br><span class="hash">sha256 ' + l[4] + '…</span></span></li>'; }).join('') + '</ul>' : '<div class="empty">Run the cycle to pull every source now.<br>Scheduled pulls continue in the background.</div>', { flush: true, sub: run.log.length ? run.log.length + ' of 13' : '' }) + '</div></div>';
      }
      if (tab === 'intake') {
        var ex = [{ name: 'Prudential_cover_Jul.xlsx', rows: 38, held: 1, t: '13 Jul 15:20', by: 'Lerato Khumalo', status: R.S.flags.intakeApproved ? 'Approved ' + R.S.flags.intakeApproved : 'Awaiting second approver', can: !R.S.flags.intakeApproved }];
        h += '<div class="grid g2"><div class="stack">' + U.card('Upload a file', '<div class="drop" id="drop">' + icon('upload').replace('<svg', '<svg style="width:20px;height:20px;margin:0 auto 6px"') + '<b>Drop a spreadsheet or CSV here</b><div class="mt4">or <label style="color:var(--accent);cursor:pointer">choose a file<input type="file" id="file" hidden></label> · <a href="#" data-act="intake-sample">use a sample file</a></div><div class="mt8" style="font-size:11.5px">For exceptional cases only. Files are read in your browser in this prototype and are not sent anywhere.</div></div>', { sub: 'controlled, validated, approved by a second person' }) +
          (sample ? U.card('Validation · ' + esc(sample.name), U.table([{ h: 'Check', k: 0, cls: 't1' }, { h: 'Result', f: function (c) { return U.tag(c[1], /held/.test(c[1]) ? 'warn' : 'good'); } }, { h: 'Detail', k: 2, cls: 't2' }], intakeChecks(sample.name, sample.rows, sample.cols, sample.held), { dense: true }) + '<div class="row" style="padding:10px 12px;border-top:1px solid var(--line)"><span class="muted">' + (sample.held ? 'The held row goes to quarantine; the rest waits for approval.' : 'All rows passed. Nothing is loaded until a second person approves.') + '</span><span class="grow"></span><button class="btn pri" data-write data-act="intake-submit">Submit for approval</button></div>', { flush: true, sub: f.n(sample.rows) + ' rows' }) : '') + '</div><div>' +
          U.card('Uploads', U.table([{ h: 'File', f: function (u) { return '<div class="t1">' + esc(u.name) + '</div><div class="t2">' + f.n(u.rows) + ' rows' + (u.held ? ' · ' + u.held + ' held' : '') + '</div>'; } }, { h: 'Uploaded', f: function (u) { return '<span class="nowrap">' + u.t + '</span><div class="t2">' + esc(u.by) + '</div>'; } }, { h: 'Status', f: function (u) { return U.tag(u.status, /Approved/.test(u.status) ? 'good' : 'warn'); } }, { h: '', f: function (u) { return u.can ? '<button class="btn sm" data-write data-act="intake-approve">Approve</button>' : u.by === R.cfg.user.name ? '<span class="t2">Needs another person</span>' : ''; } }], R.S.intake.concat(ex), { dense: true }), { flush: true, foot: 'The uploader cannot approve their own file. Both names are kept in the audit log.' }) + '</div></div>';
      }
      if (tab === 'docs') {
        var ok = R.S.quarantine['DQ-316'];
        var fields = [['Notice number', 'ON-2027-0713-044', .99], ['Participant', 'Kestrel Power (Pty) Ltd → P-007', .98], ['Resource', 'KST2 → KST-2', .97], ['Outage type', 'Forced', .99], ['Capacity affected', '0,6 GW → 600 MW', .96], ['Effective from', '13 Jul 2027 17:30', .97], ['Return to service', '13 Jul 2027 20:30', .91], ['Stated cause', 'Boiler tube leak', .94]];
        h += '<div class="grid g2">' + U.card('Outage notice, as received', '<div class="doc"><h5>NOTICE OF FORCED OUTAGE</h5><div>Kestrel Power Station · Notice no. <mark>ON-2027-0713-044</mark></div><br><div>To: Market Operator; System Operator</div><div>From: <mark>Kestrel Power (Pty) Ltd</mark>, Trading Desk</div><table><tr><td>Unit</td><td><mark>KST2</mark></td><td>Type</td><td><mark>Forced</mark></td></tr><tr><td>Capacity affected</td><td><mark>0,6 GW</mark></td><td>Effective</td><td><mark>13/07/2027 17h30</mark></td></tr><tr><td>Expected return</td><td colspan="3"><mark>13/07/2027 <s>21h00</s> 20h30</mark> <i>(amended by hand)</i></td></tr></table><div>Cause: <mark>Boiler tube leak</mark> identified during routine inspection. Unit to be removed from service for repair.</div><br><div>Signed, Shift Trading Manager</div></div>', { sub: 'PDF by secure portal · 17:31:15', foot: '<span class="hash">sha256 ' + short(D.evidence[0].hash) + '</span><span class="src">original kept in the raw zone</span>' }) +
          U.card('Fields read from the document', U.table([{ h: 'Field', k: 0, cls: 't1' }, { h: 'Value read → standardised', k: 1 }, { h: 'Confidence', f: function (x) { var low = x[2] < .95 && !ok; return '<div class="row">' + U.meter(x[2], low ? 'warn' : 'ink') + '<span class="num">' + f.n(x[2], 2) + '</span></div>'; }, w: '120px' }, { h: '', f: function (x) { return x[2] < .95 ? (x[0] === 'Return to service' ? (ok ? U.tag('Confirmed', 'good', 'check') : '<button class="btn sm" data-write data-act="field-confirm">Confirm</button>') : U.tag('Not a key field')) : ''; } }], fields, { dense: true, row: function (x) { return x[0] === 'Return to service' && !ok ? 'class="hl"' : ''; } }), { flush: true, sub: 'document model, auto-accept at 0.95', foot: 'A field below 0.95 is held for a person to confirm. The stated cause is kept as text and is not used by any screen.' }) + '</div>' +
          '<div class="mt12">' + U.card('Participant e-mail', U.table([{ h: 'Received', k: 0, cls: 'mono nowrap' }, { h: 'From', k: 1 }, { h: 'Subject', k: 2, cls: 't1' }, { h: 'Classified as', f: function (m) { return U.tag(m[3]); } }, { h: 'Linked to', k: 4 }, { h: 'Confidence', k: 5, num: 1 }], [['07:18', 'Ridgeline Energy', 'Correction: RDG-1 trip time 13 July', 'Outage correction', U.cite('A-1091', '#/surveillance/A-1091'), '0.96'], ['06:52', 'Protea Metro Distribution', 'Credit cover top-up confirmation', 'Prudential', U.cite('Case 0038', '#/cases/0038'), '0.93'], ['13 Jul 21:14', 'Kestrel Power', 'KST-2 returned to service', 'Outage notice', U.cite('Case 0047', '#/cases/0047'), '0.98'], ['13 Jul 16:40', 'Sable Power Trading', 'Import schedule revision, week 29', 'Schedule change', U.cite('A-1096', '#/surveillance/A-1096'), '0.91'], ['13 Jul 11:05', 'Bushveld Smelting', 'Query on June settlement statement', 'Settlement query', '–', '0.95']], { dense: true }), { flush: true, sub: '14 received today · 5 shown', foot: 'Each e-mail is classified, its key fields read, and it is linked to the participant and any open case.' }) + '</div>';
      }
      if (tab === 'runs') {
        h += U.card('', U.table([{ h: 'Run', k: 0, cls: 'mono' }, { h: 'Started', k: 1, cls: 'mono nowrap' }, { h: 'Pipeline', k: 2, cls: 't1' }, { h: 'Records', k: 3, num: 1 }, { h: 'Quarantined', k: 4, num: 1 }, { h: 'Duration', k: 5, num: 1 }, { h: 'Result', f: function (r) { return U.tag(r[6], r[6] === 'Succeeded' ? 'good' : 'warn'); } }], [['run-0741', '07:41:52', 'Trading platform → raw → staging → curated', f.n(214), 0, '11 s', 'Succeeded'], ['run-0730', '07:30:21', 'Market results', 48, 0, '6 s', 'Succeeded'], ['run-0647', '06:47:31', 'Metering bulk file', f.n(1920), 1, '48 s', 'Succeeded, late'], ['run-0612', '06:12:04', 'Outage notices (documents)', 23, 0, '1 min 12 s', 'Succeeded'], ['run-0458', '04:58:10', 'Prudential and collateral', 38, 0, '9 s', 'Succeeded'], ['run-0352', '03:52:44', 'Settlement statements', f.n(4800), 0, '1 min 03 s', 'Succeeded'], ['run-0200', '02:00:00', 'D+1 reconciliation', '–', 0, '3 min 40 s', 'Succeeded, 1 variance']], { dense: true }), { flush: true, foot: 'In delivery these are Microsoft Fabric pipeline runs; the same run can be opened there.' });
      }
      return h;
    },
    mount: function (root) {
      var d = R.$('#drop', root), fi = R.$('#file', root); if (!d) return;
      ['dragenter', 'dragover'].forEach(function (ev) { d.addEventListener(ev, function (e) { e.preventDefault(); d.classList.add('over'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { d.addEventListener(ev, function (e) { e.preventDefault(); d.classList.remove('over'); }); });
      d.addEventListener('drop', function (e) { if (e.dataTransfer.files[0]) takeFile(e.dataTransfer.files[0]); });
      fi.addEventListener('change', function () { if (fi.files[0]) takeFile(fi.files[0]); });
    }
  };
  function short(h) { return h.slice(0, 12) + '…' + h.slice(-6); }

  /* ======================= DATA QUALITY ======================= */
  var tr = { step: -1, timer: null }, TSTEPS = [['Validate', 'Schema, types, hashes'], ['Standardise', 'Units, time, codes'], ['Conform', 'One key per participant'], ['Quality gate', 'Pass, or quarantine'], ['Load', 'With lineage']];
  R.act['tr-replay'] = function () {
    if (tr.timer) return; tr.step = 0; R.tabState.dq = 'transform'; R.render(true);
    tr.timer = setInterval(function () { tr.step++; if (tr.step >= 5) { clearInterval(tr.timer); tr.timer = null; R.audit('Transform replayed', 'Outage record KST-2, four source shapes', 'Identical standard record from each'); } if (R.route().page === 'quality') R.render(true); }, 650);
  };
  R.act['q-resolve'] = function (el) {
    var q = D.quarantine.filter(function (x) { return x.id === el.dataset.id; })[0];
    R.modal({ title: 'Resolve ' + q.id + ' with a reason', body: U.kv([['Record', esc(q.rec)], ['Value', '<b>' + esc(q.val) + '</b>'], ['Failed rule', esc(q.rule)], ['Source', esc(q.src)]]) + '<div class="note info mt12">' + U.ai(A + ' suggestion') + '<div class="mt4">' + esc(q.suggest) + '</div></div><div class="field mt12"><span>Action</span><select class="sel" id="q-a"><option>Release with a correction (new version; original kept)</option><option>Mark as estimated and request a corrected value</option><option>Reject: keep out of the hub</option></select></div><div class="field mt12"><span>Reason (required)</span><textarea class="inp" id="q-t" rows="3" placeholder="What you checked and why"></textarea></div>',
      foot: '<button class="btn" data-act="close">Cancel</button><button class="btn pri" data-act="q-resolve-ok" data-id="' + q.id + '">Resolve</button>' });
  };
  R.act['q-resolve-ok'] = function (el) {
    var t = R.$('#q-t').value.trim(); if (t.length < 8) { R.$('#q-t').focus(); R.$('#q-t').style.borderColor = 'var(--crit)'; return; }
    var id = el.dataset.id; R.S.quarantine[id] = { act: R.$('#q-a').value, why: t, t: R.clock().hm, by: R.cfg.user.name };
    if (id === 'Q-0412') { R.S.quarantine['DQ-312'] = 1; R.S.done['p-q'] = 1; } if (id === 'Q-0411') R.S.quarantine['DQ-313'] = 1; if (id === 'Q-0409') R.S.quarantine['DQ-316'] = 1;
    R.audit('Quarantine resolved', id, R.$('#q-a').value.split(':')[0].split('(')[0].trim() + ' · ' + t); R.save(); R.close(); R.toast(id + ' resolved', 'The original record is unchanged in the raw zone.'); R.render(true);
  };
  R.act['recon-confirm'] = function () { R.S.quarantine['DQ-314'] = { t: R.clock().hm }; R.S.done['p-recon'] = 1; R.audit('Reconciliation explained', 'Settlement against metering, 13 Jul', 'Gap of 1 635 MWh attributed to KST-2; proposed as evidence item 7, Case 0047'); R.save(); R.toast('Confirmed and proposed as evidence', 'The reconciliation joins Case 0047 when the investigator accepts it.'); R.render(true); };

  R.pages.quality = {
    id: 'quality', title: 'Data Quality', group: 'Data', icon: 'quality',
    render: function () {
      var tab = R.tab('dq', 'transform'), openQ = D.quarantine.filter(function (q) { return !R.S.quarantine[q.id]; });
      var h = U.phead('Data Quality', 'Every source arrives in its own shape and leaves in one standard. Records that fail a rule are quarantined, never fixed silently, and every curated value traces back to its raw record.', 'RFI 4.3.2',
        '<button class="btn pri' + (tr.timer ? ' is-off' : '') + '" data-act="tr-replay">' + icon('play') + 'Replay transform</button>');
      h += U.kpis([{ label: 'Records loaded today', value: f.n(49988), note: 'to the curated zone' }, { label: 'Passed the quality gate', value: '99.99%', note: '3 records held', tone: 'good' }, { label: 'In quarantine', value: openQ.length, note: openQ.length ? 'waiting for a person' : 'all resolved', tone: openQ.length ? 'warn' : 'good' }, { label: 'Reconciliations in tolerance', value: (R.S.quarantine['DQ-314'] ? '9' : '9') + '<small>of 10</small>', note: R.S.quarantine['DQ-314'] ? '1 explained: Case 0047' : 'settlement against metering', tone: 'warn' }, { label: 'Feeds on time, 30 days', value: '99.2%', note: 'target 99.0%', tone: 'good' }]);
      h += '<div class="mt16"></div>' + U.tabs('dq', [{ id: 'transform', label: 'Transform' }, { id: 'rules', label: 'Rules and scores', n: D.dqRules.length }, { id: 'quarantine', label: 'Quarantine', n: openQ.length }, { id: 'recon', label: 'Reconciliation' }], tab);
      if (tab === 'transform') {
        var shapes = [['API · JSON', '{ "unit": "KST2", "avail_mw": 0,\n  "from": "2027-07-13T15:30:00Z",\n  "party": "Kestrel Power (Pty) Ltd" }'], ['File · CSV', 'KST2;HH 36;0,0;F;KESTREL POWER PTY LTD'], ['Document · PDF', 'Unit KST2 … Capacity affected 0,6 GW …\nEffective 13/07/2027 17h30'], ['Manual · Excel', 'Kestrel | KST 2 | 13-Jul-27 | 17:30 | 600 | Forced']];
        var done = tr.step >= 5;
        h += '<div class="steps mb12">' + TSTEPS.map(function (s, i) { var st = tr.step < 0 ? '' : i < tr.step ? 'done' : i === tr.step ? 'now' : ''; return '<div class="step ' + st + '"><div class="n">' + (st === 'done' ? '✓ ' : '') + '0' + (i + 1) + '</div><div class="t">' + s[0] + '</div><div class="d">' + s[1] + '</div></div>'; }).join('') + '</div>' +
          '<div class="grid g2">' + U.card('The same outage, as four sources send it', '<div class="grid g2">' + shapes.map(function (s) { return '<div><div class="src mb8" style="margin-bottom:4px"><b>' + s[0] + '</b></div><pre class="code" style="white-space:pre-wrap;min-height:74px">' + esc(s[1]) + '</pre></div>'; }).join('') + '</div>', { sub: 'as received, kept unchanged in the raw zone' }) +
          U.card('One standard record', (tr.step < 0 || done ? '' : '<div class="note info mb12">' + TSTEPS[tr.step][0] + '…</div>') + '<pre class="code" style="opacity:' + (tr.step >= 0 && !done ? .35 : 1) + '">{\n  "participant_id": "P-007",\n  "resource_id":    "KST-2",\n  "interval_start": "2027-07-13T17:30:00+02:00",\n  "declared_available_mw": 0,\n  "capacity_affected_mw":  600,\n  "outage_type": "FORCED",\n  "source": "outage_notice_pdf",\n  "ingested_at": "2027-07-13T17:31:15+02:00",\n  "raw_ref": "raw/outages/2027/07/13/ON-0713-044.pdf",\n  "quality": "PASS"\n}</pre>' + (done ? '<div class="note good mt12">All four shapes produce this record, field for field. Differences between sources would be raised as a consistency exception.</div>' : ''), { sub: 'curated zone · Outages and availability' }) + '</div>' +
          '<div class="mt12">' + U.card('One record, before and after', U.table([{ h: 'As received', k: 0, cls: 'mono' }, { h: 'Standard field', k: 1, cls: 'mono t1' }, { h: 'Rule', k: 2 }, { h: 'Stage', k: 3, cls: 't2' }], [['Kestrel Power (Pty) Ltd', 'participant P-007', 'Matched to the participant register (exact, then fuzzy above 0.95)', 'Conform'], ['KST2 · KST 2', 'resource KST-2', 'Resource master, alias table', 'Conform'], ['HH 36 · 15:30Z · 17h30', '17:30 SAST', 'Period number or UTC to interval start, UTC(ZA)', 'Standardise'], ['0,6 GW', '600 MW', 'Unit and decimal-comma conversion', 'Standardise'], ['F · Forced', 'FORCED', 'Code list OUTAGE_TYPE', 'Standardise'], ['(file hash)', 'raw_ref + SHA-256', 'Lineage pointer to the landing', 'Load']], { dense: true }), { flush: true }) + '</div>';
      }
      if (tab === 'rules') {
        var sc = D.datasets.map(function (d, i) { var r = R.rng(i + 5); return [d.name].concat(D.dqDims.map(function (_, k) { var v = Math.min(100, d.dq + (r() - .4) * 1.6); if (d.name === 'Metering' && k === 1) v = 93.3; if (d.name === 'Settlement' && k === 3) v = 96.7; return Math.round(v * 10) / 10; })); });
        h += '<div class="grid g2">' + U.card('Quality by dataset and dimension', U.table([{ h: 'Dataset', k: 0, cls: 't1' }].concat(D.dqDims.map(function (d, k) { return { h: d, num: 1, f: function (r) { var v = r[k + 1]; return v < 98 ? '<span class="tag warn">' + f.n(v, 1) + '</span>' : f.n(v, 1); } }; })), sc, { dense: true }), { flush: true, sub: '% of records passing, last 30 days', cls: 'scroll-x' }) +
          U.card('Rules', U.table([{ h: 'Rule', f: function (r) { return '<span class="mono">' + r.id + '</span> ' + r.name; } }, { h: 'Dimension', f: function (r) { return U.tag(D.dqDims[r.dim]); } }, { h: 'Dataset', k: 'ds', cls: 't2' }, { h: 'Pass, 30 d', num: 1, f: function (r) { return f.pct(r.pass, r.pass % 1 ? 2 : 0); } }, { h: 'Failed today', num: 1, f: function (r) { return r.fail ? '<b>' + r.fail + '</b>' : '0'; } }], D.dqRules, { dense: true }), { flush: true, sub: '10 of 64 shown', foot: 'Rules are versioned. A change needs the data steward’s approval and is recorded in Control and audit.' }) + '</div>';
      }
      if (tab === 'quarantine') {
        h += U.card('Quarantined, not fixed silently', '<ul class="list">' + D.quarantine.map(function (q) {
          var rs = R.S.quarantine[q.id];
          return '<li><div class="grow"><div class="row wrap"><span class="tag mono">' + q.id + '</span><span class="t1">' + esc(q.rec) + '</span><span class="tag ' + (rs ? '' : 'warn') + '">' + esc(q.val) + '</span>' + U.tag(q.ds) + '</div><div class="t2 mt4">Failed ' + esc(q.rule) + ' · ' + esc(q.src) + '</div>' + (rs ? '<div class="note good mt8"><b>' + esc(rs.act) + '</b> · ' + esc(rs.by || '') + ' at ' + rs.t + '<br>' + esc(rs.why || '') + '</div>' : '<div class="t2 mt4">' + U.ai(A) + ' ' + esc(q.suggest) + '</div>') + '</div>' + (rs ? U.tag('Resolved', 'good', 'check') : '<button class="btn pri sm" data-write data-act="q-resolve" data-id="' + q.id + '">Resolve with reason</button>') + '</li>';
        }).join('') + '</ul>', { flush: true, sub: 'held out of the hub until a person decides', foot: 'Whatever is decided, the original stays in the raw zone and the correction is a new version with its reason.' });
      }
      if (tab === 'recon') {
        var ok = R.S.quarantine['DQ-314'];
        h += U.card('Hub totals against source control totals, 13 Jul', U.table([{ h: 'Check', k: 0, cls: 't1' }, { h: 'Hub', k: 1, num: 1 }, { h: 'Source', k: 2, num: 1 }, { h: 'Variance', k: 3, num: 1 }, { h: 'Tolerance', k: 4, num: 1 }, { h: '', f: function (r) { return r[5] === 'x' ? (ok ? U.tag('Explained · Case 0047', 'info') : U.tag('Outside tolerance', 'high')) : U.tag('Matches', 'good'); } }], [
          ['Offers and bids: record count', f.n(18240), f.n(18240), '0', '0', ''], ['Market results: intervals', '48', '48', '0', '0', ''], ['Dispatch events', f.n(17280), f.n(17280), '0', '0', ''], ['Settlement lines', f.n(4800), f.n(4800), '0', '0', ''], ['Settlement value, R', f.n(1284611930), f.n(1284611930), '0', 'R 100 000', ''],
          ['Settled energy against metered energy, MWh', f.n(525772), f.n(527407), '<b>−1 635 (0.31%)</b>', '0.25%', 'x'], ['Meter reads', f.n(1920), f.n(1920), '0', '0', ''], ['Transparency publications', f.n(1152), f.n(1152), '0', '0', ''], ['Credit cover records', '38', '38', '0', '0', ''], ['Outage notices', '23', '23', '0', '0', '']], { dense: true, row: function (r) { return r[5] === 'x' && !ok ? 'class="hl"' : ''; } }) +
          '<div style="padding:12px;border-top:1px solid var(--line)"><div class="note ' + (ok ? 'good' : 'warn') + '"><div class="row start gap12"><div class="grow"><b>' + (ok ? 'Explained and proposed as evidence item 7.' : 'The gap is the Kestrel energy.') + '</b><br>1 635 MWh were metered at KST-2 between 17:30 and 20:00 with no schedule, so settlement has no matching line. 545 MW × 3 hours = 1 635 MWh.</div>' + (ok ? '' : '<button class="btn pri" data-write data-act="recon-confirm">Confirm and propose as evidence</button>') + '</div></div></div>', { flush: true, sub: 'D+1 reconciliation, run 02:00', foot: U.src('Control and audit') + '<span>Reconciliation runs against the source systems’ own control totals, so the hub never marks its own work.</span>' });
      }
      return h;
    }
  };

  /* ======================= DATA HUB ======================= */
  var lin = { i: 0, timer: null };
  var LIN = [
    { z: 'Report', t: 'Board view value', d: 'System price, 18:30 · R 4 250', kv: [['Report', 'SAWEM market integrity · Board view'], ['Measure', '<span class="mono">[System price]</span> filtered to 13 Jul 2027 18:30'], ['Reads', 'Curated dataset Prices and results, and nothing else'], ['Row-level security', 'Board: summary']] },
    { z: 'Curated', t: 'Prices and results', d: 'interval 2027-07-13 18:30', kv: [['Dataset', 'Prices and results · certified 9 Jul by N. Mokoena'], ['Row key', '<span class="mono">interval_start = 2027-07-13T18:30+02:00, segment = RT</span>'], ['system_price', '<b>4 250.00</b> R/MWh'], ['marginal_offer', '<span class="mono">OF-20270713-KST5-T2-v3</span>'], ['Version', '1 · no corrections']] },
    { z: 'Staging', t: 'Validated row', d: 'passed 6 rules, 18:30:21', kv: [['Rules passed', 'DQ-R01 interval present · DQ-R07 price within cap · DQ-R18 unique · 3 more'], ['Standardised', 'Period 38 → 18:30 SAST; price string “4250,00” → 4250.00'], ['Conformed', 'Marginal resource KST5 → KST-5, participant P-007'], ['Loaded by', 'run-20270713-1830 · 21 s after clearing']] },
    { z: 'Raw', t: 'File and hash', d: 'results_183000.json', kv: [['Path', '<span class="mono">raw/market-results/2027/07/13/results_183000.json</span>'], ['SHA-256', '<span class="hash">a41c7e09b2d85f3360e1c4a7d9b2f58e03c6a1d4f7b0e3c6a9d2f5b8e1c4a7d0</span>'], ['Stored', 'Append-only, immutable; retention at least 5 years'], ['Size', '18.4 kB · exactly as received']] },
    { z: 'Source', t: 'Market results API call', d: 'GET /v1/results · 200', kv: [['Request', '<span class="mono">GET /v1/results?interval=2027-07-13T18:30</span>'], ['Response', '200 · 18.4 kB · 18:30:21.208 SAST'], ['Authentication', 'Mutual TLS, hub managed identity'], ['Timestamp basis', 'UTC(ZA), offset 4 ms']] }
  ];
  R.act['lin-node'] = function (el) { lin.i = +el.dataset.v; R.render(true); };
  R.act['lin-trace'] = function () {
    if (lin.timer) return; lin.i = 0; R.tabState.hub = 'lineage'; R.render(true);
    lin.timer = setInterval(function () { lin.i++; if (lin.i >= 4) { clearInterval(lin.timer); lin.timer = null; R.audit('Lineage traced', 'System price 18:30, R 4 250', 'Curated to raw to API call'); } if (R.route().page === 'hub') R.render(true); }, 800);
  };
  function datasetDrawer(n) {
    var d = D.datasets[n - 1];
    var schema = d.n === 3 ? [['offer_id', 'string', 'Unique per version'], ['participant_id', 'string', 'Key → Participant register'], ['resource_id', 'string', 'Key → Resource register'], ['interval_start', 'datetime', 'Trading interval, SAST'], ['tranche', 'int', 'Price-quantity step'], ['quantity_mw', 'decimal', '0 to registered capacity'], ['price_zar_mwh', 'decimal', '0 to price cap'], ['version', 'int', 'Increments on amendment'], ['submitted_at', 'datetime', 'UTC(ZA), millisecond'], ['submitted_by', 'string', 'User or API key'], ['source, ingested_at, raw_ref', 'lineage', 'Source system, load time, raw pointer']]
      : d.keys.split(', ').map(function (k) { return [k, k.indexOf('interval') >= 0 ? 'datetime' : 'string', 'Common key']; }).concat([['…', '', 'Dataset-specific measures'], ['source, ingested_at, raw_ref', 'lineage', 'Source system, load time, raw pointer']]);
    R.drawer({ kicker: 'Dataset ' + (d.n < 10 ? '0' : '') + d.n + ' · ' + D.domains[d.dom], title: d.name, sub: d.desc, body:
      '<div class="row wrap mb12">' + U.tag('Certified ' + d.cert, 'good', 'check') + U.tag(d.label) + '<span class="tag mono">' + d.keys + '</span></div>' +
      U.kpis([{ label: 'Rows', value: d.rows >= 1e6 ? f.n(d.rows / 1e6, 2) + 'm' : f.n(d.rows) }, { label: 'Fresh as at', value: d.fresh }, { label: 'Quality score', value: f.pct(d.dq) }]) +
      '<div class="sect"><h4>Schema</h4>' + U.table([{ h: 'Field', k: 0, cls: 'mono t1' }, { h: 'Type', k: 1, cls: 't2' }, { h: 'Note', k: 2 }], schema, { dense: true }) + '</div>' +
      '<div class="sect"><h4>Certification</h4>' + U.kv([['Owner', d.owner], ['Certified', d.cert + ' 2027 by the MSU'], ['Checks', 'Reconciled to source totals · rules passing · lineage complete · access labels set'], ['Next review', 'Quarterly, or on any schema change']]) + '</div>' +
      '<div class="sect"><h4>Used by</h4><div class="row wrap">' + (d.n === 3 ? ['SCR-01', 'SCR-04', 'SCR-05', 'SCR-09', 'Hub re-clear', 'Weekly market conduct report'] : d.n === 10 ? ['SCR-02', 'SCR-06', 'D+1 reconciliation'] : ['Surveillance screens', 'Board view', 'Ask']).map(function (x) { return U.tag(x); }).join('') + '</div></div>' });
  }
  R.act['ds-open'] = function (el) { datasetDrawer(+el.dataset.n); };

  R.pages.hub = {
    id: 'hub', title: 'Data Hub', group: 'Data', icon: 'hub',
    render: function () {
      var tab = R.tab('hub', 'datasets');
      var h = U.phead('Data Hub', 'The central market database: an immutable raw zone, a validated staging zone and twelve curated, certified datasets. Reports and screens read the curated zone only.', 'RFI 4.3.3',
        '<button class="btn pri" data-act="lin-trace">' + icon('link') + 'Trace the R 4 250 price</button>');
      h += '<div class="zones mb12">' + [['Raw', 'Append-only, exactly as received. Each landing sealed with a SHA-256 hash; nothing is ever edited or deleted.', [['Landings today', f.n(1842)], ['Held', '41.6 TB'], ['Retention', 'at least 5 years']]], ['Staging', 'Validated, standardised and conformed. Corrections are new versions with a reason; failed records wait in quarantine.', [['Rules', '64'], ['In quarantine', D.quarantine.filter(function (q) { return !R.S.quarantine[q.id]; }).length], ['Corrections, 30 d', '17']]], ['Curated', 'Twelve certified datasets on one conformed model. The only zone that reports, screens and questions can read.', [['Datasets', '12 of 12 certified'], ['Refresh', 'continuous to daily'], ['Consumers', '10 screens, 7 reports']]]].map(function (z, i) {
        return '<div class="zone"><h4><span class="n">' + (i + 1) + '</span>' + z[0] + (i < 2 ? '<span class="grow"></span><span class="faint">' + icon('arrow').replace('<svg', '<svg style="width:14px;height:14px"') + '</span>' : '') + '</h4><p class="muted mt4" style="min-height:54px">' + z[1] + '</p><div class="row wrap gap12 mt8">' + z[2].map(function (k) { return '<div><div class="muted" style="font-size:11.5px">' + k[0] + '</div><div style="font-weight:600">' + k[1] + '</div></div>'; }).join('') + '</div></div>';
      }).join('') + '</div>';
      h += U.tabs('hub', [{ id: 'datasets', label: 'Core datasets', n: 12 }, { id: 'lineage', label: 'Lineage trace' }, { id: 'build', label: 'How datasets are built' }], tab);
      if (tab === 'datasets') {
        h += '<div class="row wrap mb12"><span class="muted">Every record carries</span>' + ['Participant ID', 'Resource ID', 'Trading interval', 'Source and ingestion time'].map(function (k) { return '<span class="chip">' + k + '</span>'; }).join('') + '<span class="muted">so any event can be joined to any other.</span></div>' +
          U.card('', U.table([{ h: '#', f: function (d) { return (d.n < 10 ? '0' : '') + d.n; }, cls: 'mono', w: '34px' }, { h: 'Dataset', f: function (d) { return '<div class="t1">' + d.name + (d.hot ? ' <span class="tag warn" title="Used by Case 0047">Case 0047</span>' : '') + '</div><div class="t2">' + d.desc + '</div>'; } }, { h: 'Domain', f: function (d) { return U.tag(D.domains[d.dom]); } }, { h: 'Keys', f: function (d) { return '<span class="hash">' + d.keys + '</span>'; } }, { h: 'Rows', num: 1, f: function (d) { return d.rows >= 1e6 ? f.n(d.rows / 1e6, 2) + 'm' : d.rows >= 1e4 ? f.n(d.rows / 1e3, 1) + 'k' : f.n(d.rows); } }, { h: 'Fresh', k: 'fresh', cls: 'mono nowrap' }, { h: 'Quality', num: 1, f: function (d) { return f.pct(d.dq); } }, { h: 'Certified', f: function (d) { return '<span class="nowrap">' + U.tag(d.cert, 'good', 'check') + '</span><div class="t2 nowrap">' + d.owner + '</div>'; } }, { h: 'Label', f: function (d) { return '<span class="t2">' + d.label + '</span>'; } }], D.datasets, { row: function (d) { return 'class="click" data-act="ds-open" data-n="' + d.n + '"'; } }), { flush: true, cls: 'scroll-x', foot: 'Labels and retention are applied by Microsoft Purview. Select a dataset for its schema, certification and consumers.' });
      }
      if (tab === 'lineage') {
        var n = LIN[lin.i];
        h += U.card('From a number on a report to the call that fetched it', '<div class="lin">' + LIN.map(function (x, i) { return (i ? '<div class="lin__a">' + icon('arrow') + '</div>' : '') + '<button class="lin__n' + (i === lin.i ? ' on' : '') + '" data-act="lin-node" data-v="' + i + '"><div class="z">' + x.z + '</div><div class="t">' + x.t + '</div><div class="d">' + x.d + '</div></button>'; }).join('') + '</div><div class="mt12" style="max-width:860px">' + U.kv(n.kv) + '</div>', { sub: 'system price, 13 Jul 18:30', foot: 'No number on any report is more than one step from its source. In delivery the same lineage is held in Microsoft Purview.' });
      }
      if (tab === 'build') {
        h += U.steps([{ t: 'Map', d: 'Each Market Code obligation and RFI data item to a source and a dataset' }, { t: 'Model', d: 'A conformed schema around participants, resources and trading intervals' }, { t: 'Build', d: 'Pipelines source by source, with quality rules and reconciliation to source totals' }, { t: 'Certify', d: 'Each dataset signed off by the MSU before it feeds a screen or a report' }]) +
          '<div class="grid g2 mt12">' + U.card('Six data domains', U.table([{ h: 'Domain', k: 0, cls: 't1' }, { h: 'Datasets', k: 1 }], D.domains.map(function (dm, i) { return [dm, D.datasets.filter(function (d) { return d.dom === i; }).map(function (d) { return d.name; }).join(' · ')]; }), { dense: true }), { flush: true, sub: 'as the RFI requires' }) +
          U.card('What certification checks', '<ul class="trace" style="font-size:13px;gap:7px;color:var(--ink-2)">' + ['Reconciles to the source system’s control totals', 'Every quality rule has run for 30 days and passes its target', 'Lineage is complete from curated field to raw landing', 'Keys join to the participant and resource registers with no orphans', 'Sensitivity label, retention and row-level security are set', 'A named owner in the MSU accepts the dataset'].map(function (x) { return '<li>' + icon('check') + x + '</li>'; }).join('') + '</ul>', { foot: 'An uncertified dataset cannot be selected in a report, a screen or a question.' }) + '</div>';
      }
      return h;
    }
  };
})();
