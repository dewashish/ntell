/* Regulatory Data Hub prototype · charts. Hand-drawn SVG at the container's
   real pixel width so type stays 11px. One y-axis per chart, hairline grid,
   2px lines, crosshair tooltip on every plot. */
(function () {
  'use strict';
  var R = window.RDH, f = R.f, esc = R.esc;
  var C = R.charts = {}, specs = {}, seq = 0;
  var INK2 = '#3a4453', GRID = '#eceef2', AXIS = '#c5cad3';

  function reg(o, kind) { var id = 'c' + (++seq); o.kind = kind; specs[id] = o; return '<div class="chart" data-c="' + id + '" style="min-height:' + (o.h || 220) + 'px"' + (o.label ? ' role="img" aria-label="' + esc(o.label) + '"' : '') + '></div>'; }
  C.xy = function (o) { return reg(o, 'xy'); };
  C.stack = function (o) { return reg(o, 'stack'); };

  function niceStep(span, n) {
    var raw = span / (n || 4), p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }
  function yfmt(v) { return Math.abs(v) >= 10000 ? f.n(v / 1000, v % 1000 ? 1 : 0) + 'k' : f.n(v, v % 1 ? (Math.abs(v) < 10 ? 2 : 1) : 0); }

  function drawXY(el, o) {
    var W = Math.max(280, el.clientWidth), H = o.h || 220, m = { l: o.ml || 46, r: o.mr || 12, t: o.mt || (o.yunit ? 22 : 12), b: 24 };
    var n = o.x.length, pw = W - m.l - m.r, ph = H - m.t - m.b, hasCol = o.series.some(function (s) { return s.type === 'col'; });
    var all = [];
    o.series.forEach(function (s) { s.data.forEach(function (v) { if (v != null) all.push(v); }); });
    (o.hlines || []).forEach(function (h) { if (!h.soft) all.push(h.v); });
    if (o.band) { all = all.concat(o.band.lo, o.band.hi); }
    var mn = o.ymin != null ? o.ymin : Math.min(0, Math.min.apply(null, all)), mx = o.ymax != null ? o.ymax : Math.max.apply(null, all);
    var step = niceStep(mx - mn, o.yticks || 4); mx = o.ymax != null ? mx : Math.ceil(mx / step - 1e-9) * step; if (o.ymin == null && mn < 0) mn = Math.floor(mn / step) * step;
    var bw = pw / (hasCol ? n : Math.max(1, n - 1));
    function X(i) { return m.l + (hasCol ? (i + .5) * bw : i * bw); }
    function Y(v) { return m.t + ph - (v - mn) / (mx - mn) * ph; }
    var fy = o.yfmt || yfmt, s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">';
    /* shaded x ranges */
    (o.bands || []).forEach(function (b) {
      var x0 = X(b.from) - (hasCol ? bw / 2 : 0), x1 = X(b.to) + (hasCol ? bw / 2 : 0);
      s += '<rect x="' + x0.toFixed(1) + '" y="' + m.t + '" width="' + Math.max(2, x1 - x0).toFixed(1) + '" height="' + ph + '" fill="' + (b.color || '#fff3cf') + '" opacity="' + (b.op || .75) + '"/>';
      if (b.label) s += '<text class="ann" x="' + (x0 + 4).toFixed(1) + '" y="' + (m.t + 12) + '">' + esc(b.label) + '</text>';
    });
    /* grid and y ticks */
    for (var v = mn; v <= mx + 1e-9; v += step) {
      var y = Y(v);
      s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="' + (Math.abs(v - mn) < 1e-9 ? AXIS : GRID) + '"/>';
      s += '<text x="' + (m.l - 7) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end">' + fy(v) + '</text>';
    }
    if (o.yunit) s += '<text x="' + m.l + '" y="' + (m.t - 9) + '" text-anchor="start" style="fill:#949cab">' + esc(o.yunit) + '</text>';
    /* x ticks */
    var every = o.xEvery || Math.ceil(n / Math.max(2, Math.floor(pw / 62)));
    for (var i = o.xStart || 0; i < n; i += every) s += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 7) + '" text-anchor="middle">' + esc(o.x[i]) + '</text>';
    /* reference band (for example a ±1σ norm) */
    if (o.band) {
      var up = o.band.hi.map(function (vv, k) { return X(k).toFixed(1) + ' ' + Y(vv).toFixed(1); }), dn = o.band.lo.map(function (vv, k) { return X(k).toFixed(1) + ' ' + Y(Math.max(mn, vv)).toFixed(1); }).reverse();
      s += '<path d="M' + up.concat(dn).join('L') + 'Z" fill="' + (o.band.color || '#98a2b3') + '" opacity=".16"/>';
    }
    /* series */
    o.series.forEach(function (se) {
      var col = se.color || '#2a78d6';
      if (se.type === 'col') {
        var w = Math.min(24, bw * .72);
        se.data.forEach(function (vv, k) {
          if (vv == null) return;
          var y0 = Y(Math.max(mn, 0)), y1 = Y(vv), hh = Math.abs(y0 - y1), top = Math.min(y0, y1), c2 = se.colors ? se.colors[k] : col, r = Math.min(3, hh);
          s += '<path d="M' + (X(k) - w / 2).toFixed(1) + ' ' + (top + hh).toFixed(1) + 'v' + (-(hh - r)).toFixed(1) + 'q0 ' + (-r) + ' ' + r + ' ' + (-r) + 'h' + (w - 2 * r).toFixed(1) + 'q' + r + ' 0 ' + r + ' ' + r + 'v' + (hh - r).toFixed(1) + 'z" fill="' + c2 + '"/>';
        });
        return;
      }
      function path(from, to) {
        var d = '', pen = false;
        for (var k = from; k <= to; k++) {
          var vv = se.data[k]; if (vv == null) { pen = false; continue; }
          var px = X(k), py = Y(vv);
          if (se.type === 'step' && pen) d += 'H' + px.toFixed(1) + 'V' + py.toFixed(1); else d += (pen ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1);
          pen = true;
        }
        return d;
      }
      var last = se.data.length - 1, cut = se.dashFrom != null ? se.dashFrom : null;
      if (se.area) {
        var a = '', first = null, lastK = null;
        se.data.forEach(function (vv, k) { if (vv == null || (cut != null && k > cut)) return; if (first == null) first = k; lastK = k; a += (a ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(vv).toFixed(1); });
        if (first != null) s += '<path d="' + a + 'L' + X(lastK).toFixed(1) + ' ' + Y(mn).toFixed(1) + 'L' + X(first).toFixed(1) + ' ' + Y(mn).toFixed(1) + 'Z" fill="' + col + '" opacity=".1"/>';
      }
      var common = ' fill="none" stroke="' + col + '" stroke-width="' + (se.width || 2) + '" stroke-linejoin="round" stroke-linecap="round"';
      if (cut != null) {
        s += '<path d="' + path(0, cut) + '"' + common + '/><path d="' + path(cut, last) + '"' + common + ' stroke-dasharray="2 5" opacity=".75"/>';
      } else s += '<path d="' + path(0, last) + '"' + common + (se.dash ? ' stroke-dasharray="5 4"' : '') + '/>';
    });
    /* horizontal reference lines: solid hairlines, labelled */
    (o.hlines || []).forEach(function (h) {
      if (h.v > mx || h.v < mn) return;
      var y = Y(h.v);
      s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="' + (h.color || INK2) + '" stroke-width="1"/>';
      s += '<text class="ann" x="' + (h.left ? m.l + 6 : W - m.r - 4) + '" y="' + (y - 5).toFixed(1) + '" text-anchor="' + (h.left ? 'start' : 'end') + '">' + esc(h.label) + '</text>';
    });
    /* selective direct labels */
    (o.marks || []).forEach(function (mk) {
      var se = o.series[mk.s || 0], vv = mk.v != null ? mk.v : se.data[mk.i], px = X(mk.i), py = Y(vv), right = px > W - 150 || mk.left;
      s += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="4.5" fill="' + (mk.color || se.color || '#2a78d6') + '" stroke="#fff" stroke-width="2"/>';
      s += '<text class="lbl" x="' + (px + (right ? -10 : 10)).toFixed(1) + '" y="' + (py + (mk.dy != null ? mk.dy : 4)).toFixed(1) + '" text-anchor="' + (right ? 'end' : 'start') + '">' + esc(mk.label) + '</text>';
    });
    if (o.cursor != null) {
      s += '<line x1="' + X(o.cursor).toFixed(1) + '" x2="' + X(o.cursor).toFixed(1) + '" y1="' + m.t + '" y2="' + (m.t + ph) + '" stroke="#0b2545" stroke-width="1.5"/>';
      if (o.cursorLabel) s += '<text class="lbl" x="' + (X(o.cursor) + (X(o.cursor) > W - 90 ? -6 : 6)).toFixed(1) + '" y="' + (m.t + 10) + '" text-anchor="' + (X(o.cursor) > W - 90 ? 'end' : 'start') + '">' + esc(o.cursorLabel) + '</text>';
    }
    s += '<line class="xh" x1="0" x2="0" y1="' + m.t + '" y2="' + (m.t + ph) + '" stroke="#667080" stroke-width="1" opacity="0"/><g class="xd"></g>';
    s += '<rect class="hit" x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '" fill="transparent"' + (o.onPick ? ' style="cursor:pointer"' : '') + '/></svg>';
    el.innerHTML = s;
    el._c = { o: o, X: X, Y: Y, n: n, bw: bw, m: m, hasCol: hasCol };
  }

  function drawStack(el, o) {
    var W = Math.max(280, el.clientWidth), H = o.h || 260, m = { l: 46, r: 12, t: 22, b: 24 };
    var total = R.sum(o.tranches, function (t) { return t.mw; }), pw = W - m.l - m.r, ph = H - m.t - m.b, ymax = o.ymax || 6000;
    function X(mw) { return m.l + mw / total * pw; }
    function Y(p) { return m.t + ph - p / ymax * ph; }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">';
    for (var v = 0; v <= ymax; v += 1000) {
      s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" stroke="' + (v ? GRID : AXIS) + '"/><text x="' + (m.l - 7) + '" y="' + (Y(v) + 3.5).toFixed(1) + '" text-anchor="end">' + f.n(v) + '</text>';
    }
    s += '<text x="' + m.l + '" y="' + (m.t - 9) + '" style="fill:#949cab">Offer price, R/MWh, by cumulative MW offered</text>';
    for (var g = 0; g <= total; g += 5000) s += '<text x="' + X(g).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + f.n(g) + '</text>';
    var cum = 0; el._t = [];
    o.tranches.forEach(function (t) {
      var x0 = X(cum), x1 = X(cum + t.mw), hh = Math.max(2, Y(0) - Y(t.price));
      s += '<rect x="' + (x0 + .75).toFixed(1) + '" y="' + (Y(0) - hh).toFixed(1) + '" width="' + Math.max(1, x1 - x0 - 1.5).toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + o.color(t) + '"/>';
      el._t.push({ x0: x0, x1: x1, t: t, cum: cum }); cum += t.mw;
    });
    if (o.cf) {                         // counterfactual curve as a stepped outline
      var d = '', c2 = 0;
      o.cf.forEach(function (t) { d += (d ? 'V' : 'M' + X(0).toFixed(1) + ' ') + Y(t.price).toFixed(1) + 'H' + X(Math.min(total, c2 + t.mw)).toFixed(1); c2 += t.mw; });
      s += '<path d="' + d + '" fill="none" stroke="#0f1826" stroke-width="1.5" stroke-dasharray="4 3"/>';
    }
    var dx = X(o.demand);
    s += '<line x1="' + dx.toFixed(1) + '" x2="' + dx.toFixed(1) + '" y1="' + m.t + '" y2="' + Y(0) + '" stroke="#0f1826" stroke-width="1.5"/>';
    s += '<text class="lbl" x="' + (dx - 6).toFixed(1) + '" y="' + (m.t + 10) + '" text-anchor="end">Demand ' + f.mw(o.demand) + '</text>';
    (o.prices || []).forEach(function (p) {
      s += '<line x1="' + m.l + '" x2="' + dx.toFixed(1) + '" y1="' + Y(p.v).toFixed(1) + '" y2="' + Y(p.v).toFixed(1) + '" stroke="' + INK2 + '" stroke-width="1"/>';
      s += '<circle cx="' + dx.toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="4.5" fill="' + p.color + '" stroke="#fff" stroke-width="2"/>';
      s += '<text class="lbl" x="' + (m.l + 6) + '" y="' + (Y(p.v) - 5).toFixed(1) + '">' + esc(p.label) + '</text>';
    });
    if (o.cap) { s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(o.cap).toFixed(1) + '" y2="' + Y(o.cap).toFixed(1) + '" stroke="' + AXIS + '"/><text x="' + (m.l + 6) + '" y="' + (Y(o.cap) - 5).toFixed(1) + '">Price cap ' + f.zar(o.cap, 2) + '</text>'; }
    s += '<rect class="hit" x="' + m.l + '" y="' + m.t + '" width="' + pw + '" height="' + ph + '" fill="transparent"/></svg>';
    el.innerHTML = s; el._c = { o: o, stack: true };
  }

  function draw(el) { var o = specs[el.dataset.c]; if (!o) return; if (o.kind === 'stack') drawStack(el, o); else drawXY(el, o); }
  C.bind = function (root) { R.$$('.chart[data-c]', root).forEach(draw); };
  var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { C.bind(document); }, 120); });

  /* sequential single-hue ramp for heat cells */
  var RAMP = ['#eef4fc', '#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'];
  C.heat = function (o) {
    var cols = o.cols.length, mx = o.max || Math.max.apply(null, o.rows.map(function (r) { return Math.max.apply(null, r.v); }));
    var h = '<div class="heat" style="grid-template-columns:max-content repeat(' + cols + ',minmax(0,1fr))"><span></span>' + o.cols.map(function (c, i) { return '<span class="cl">' + (o.colEvery && i % o.colEvery ? '' : c) + '</span>'; }).join('');
    o.rows.forEach(function (r) {
      h += '<span class="rl">' + r.l + '</span>' + r.v.map(function (v, i) {
        var k = v <= 0 ? -1 : Math.min(RAMP.length - 1, Math.floor(v / mx * (RAMP.length - .01)));
        return '<span class="c" style="background:' + (k < 0 ? '#f4f5f7' : RAMP[k]) + '" data-tip="' + esc('<h5>' + r.l + ' · ' + o.cols[i] + '</h5><div class="r">' + (o.what || 'Value') + '<b>' + (o.fmt ? o.fmt(v) : v) + '</b></div>') + '"></span>';
      }).join('');
    });
    return h + '</div>';
  };

  /* ---------- hover layer ---------- */
  var tip;
  function showTip(html, x, y) {
    if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip); }
    tip.innerHTML = html; tip.classList.add('on');
    var w = tip.offsetWidth, hh = tip.offsetHeight, px = x + 14, py = y + 14;
    if (px + w > window.innerWidth - 8) px = x - w - 14;
    if (py + hh > window.innerHeight - 8) py = y - hh - 14;
    tip.style.left = Math.max(8, px) + 'px'; tip.style.top = Math.max(8, py) + 'px';
  }
  function hideTip() { if (tip) tip.classList.remove('on'); }
  function idxAt(el, e) {
    var c = el._c, r = el.getBoundingClientRect(), x = e.clientX - r.left;
    return R.clamp(Math.round(c.hasCol ? (x - c.m.l) / c.bw - .5 : (x - c.m.l) / c.bw), 0, c.n - 1);
  }
  document.addEventListener('mousemove', function (e) {
    var t = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (t) { showTip(t.dataset.tip, e.clientX, e.clientY); return; }
    var el = e.target.closest ? e.target.closest('.chart[data-c]') : null;
    if (!el || !el._c) { hideTip(); R.$$('.chart .xh').forEach(function (l) { l.setAttribute('opacity', 0); }); R.$$('.chart .xd').forEach(function (g) { g.innerHTML = ''; }); return; }
    var c = el._c, o = c.o;
    if (c.stack) {
      var r = el.getBoundingClientRect(), x = e.clientX - r.left, hit = null;
      el._t.forEach(function (q) { if (x >= q.x0 && x <= q.x1) hit = q; });
      if (!hit) { hideTip(); return; }
      var p = R.D.P[hit.t.p];
      showTip('<h5>' + esc(hit.t.r) + '</h5><div class="r">Participant<b>' + esc(p ? p.short : hit.t.p) + '</b></div><div class="r">Offer price<b>' + f.price(hit.t.price) + '</b></div><div class="r">Quantity<b>' + f.mw(hit.t.mw) + '</b></div><div class="r">Position in merit order<b>' + f.n(hit.cum) + '–' + f.n(hit.cum + hit.t.mw) + ' MW</b></div>', e.clientX, e.clientY);
      return;
    }
    var i = idxAt(el, e), xh = el.querySelector('.xh'), xd = el.querySelector('.xd'), px = c.X(i);
    xh.setAttribute('x1', px); xh.setAttribute('x2', px); xh.setAttribute('opacity', c.hasCol ? 0 : .6);
    var dots = '', rows = '';
    o.series.forEach(function (se) {
      var v = se.data[i]; if (v == null) return;
      if (se.type !== 'col') dots += '<circle cx="' + px.toFixed(1) + '" cy="' + c.Y(v).toFixed(1) + '" r="4" fill="' + (se.color || '#2a78d6') + '" stroke="#fff" stroke-width="2"/>';
      rows += '<div class="r"><i class="key' + (se.type === 'col' ? ' sq' : '') + '" style="background:' + (se.colors ? se.colors[i] : se.color || '#2a78d6') + '"></i>' + esc(se.name) + '<b>' + (se.fmt || o.tfmt || f.n)(v) + '</b></div>';
    });
    if (o.band) rows += '<div class="r"><i class="key sq" style="background:#d5d9e0"></i>' + esc(o.band.name || 'Range') + '<b>' + (o.tfmt || f.n)(o.band.lo[i]) + '–' + (o.tfmt || f.n)(o.band.hi[i]) + '</b></div>';
    xd.innerHTML = dots;
    showTip('<h5>' + esc((o.xLabel ? o.xLabel(i) : o.x[i])) + '</h5>' + rows + (o.tipNote ? '<div class="r faint">' + esc(o.tipNote(i) || '') + '</div>' : ''), e.clientX, e.clientY);
  });
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.chart[data-c]') : null;
    if (el && el._c && el._c.o.onPick) el._c.o.onPick(idxAt(el, e));
  });
  document.addEventListener('scroll', hideTip, true);
})();
