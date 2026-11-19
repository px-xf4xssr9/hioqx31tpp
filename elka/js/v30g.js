/* 2.11.5 · вода одним телом.
   Раньше река и озёра рисовались квадратиками по клеткам с полупрозрачной заливкой: на стыках клеток были швы,
   волны повторялись в каждой клетке, сквозь воду просвечивал снег, а русло лежало прямо на верхней грани снега.
   Теперь вся открытая вода — один контур с чуть неровными берегами (непрерывными через клетки), плотная заливка
   с глубиной к середине, у верхнего берега видна снежная стенка (берег выше воды), у нижнего — мелководье и пена,
   по реке бегут длинные струи течения. Лёд — тоже одним телом, без швов. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = D.OL || '#1b2448';
function isW(L, c, r) { if (c < 0 || c >= L.W) return true; var v = L.grid[r] && L.grid[r][c]; return v === 4 || v === 5 || !!L.bridges[r * L.W + c]; }
function isOpen(L, c, r) { if (c < 0 || c >= L.W || r === L.riverRow) return true; var v = L.grid[r] && L.grid[r][c]; return v === 4 || !!L.bridges[r * L.W + c]; }
function wet(L, c, r) { if (c < 0 || c >= L.W || r < 0 || r >= L.H) return false; var v = L.grid[r] && L.grid[r][c]; return (v === 4 || v === 5) && !L.bridges[r * L.W + c]; }   // вода или лёд без моста (2.12.33: и лёд — иначе у замёрзшей реки шов и видна дорога)
// неровность берега: непрерывна по x поля, своя у каждой кромки
function wob(xw, k) { return 0.024 * Math.sin(xw * 2.3 + k * 1.7) + 0.012 * Math.sin(xw * 5.9 + k * 0.6) + 0.006 * Math.sin(xw * 13.1 + k); }
function rect(G, q, X, Y, cs) {
  var L = G.L, FP = D.fieldPad ? D.fieldPad(L) : { l: 0, r: 0 }, x = X(q[0]), y = Y(q[1]), rx = x, rw = cs, ry = y, rh = cs;
  if (q[0] === 0) { rx -= FP.l * cs + 2; rw += FP.l * cs + 2; }
  if (q[0] === L.W - 1) rw += FP.r * cs + 2;
  // 2.12.32: русло реки уже клетки (берега-полоски сверху и снизу), но если рядом тоже вода (озеро, рухнувший мост) — тянем воду до края клетки:
  // одна сплошная вода, без полоски «берега» между рекой и соседней водой, сквозь которую был виден старый настил
  if (L.riverRow === q[1]) { var wu = wet(L, q[0], q[1] - 1), wd = wet(L, q[0], q[1] + 1); ry = wu ? y - 1 : y + cs * 0.13; rh = (wd ? y + cs + 1 : y + cs * 0.87) - ry; }
  return [rx, ry, rw, rh];
}
// кромки клетки: верх/низ — волнистые, если там берег
function edges(G, q, X, Y, cs, test) {
  var L = G.L, c = q[0], r = q[1], R = rect(G, q, X, Y, cs), riv = L.riverRow === r;
  var top = riv ? !wet(L, c, r - 1) : !test(L, c, r - 1), bot = riv ? !wet(L, c, r + 1) : !test(L, c, r + 1), lft = !test(L, c - 1, r), rgt = !test(L, c + 1, r);
  var x0 = Math.floor(R[0]) - (lft ? 0 : 1), x1 = Math.ceil(R[0] + R[2]) + (rgt ? 0 : 1), N = Math.max(3, Math.ceil((x1 - x0) / (cs * 0.12)));
  var tp = [], bp = [], i, xx, xw;
  for (i = 0; i <= N; i++) {
    xx = x0 + (x1 - x0) * i / N; xw = (xx - X(0)) / cs;
    tp.push([xx, top ? R[1] + cs * (0.03 + wob(xw, r * 2)) : R[1] - 1]);
    bp.push([xx, bot ? R[1] + R[3] - cs * (0.03 + wob(xw, r * 2 + 1)) : R[1] + R[3] + 1]);
  }
  return { tp: tp, bp: bp, top: top, bot: bot, lft: lft, rgt: rgt, R: R };
}
function pathOf(ctx, list) {
  ctx.beginPath();
  list.forEach(function (e) {
    ctx.moveTo(e.tp[0][0], e.tp[0][1]); e.tp.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
    for (var i = e.bp.length - 1; i >= 0; i--) ctx.lineTo(e.bp[i][0], e.bp[i][1]);
    ctx.closePath();
  });
}
function fords(L) {
  var wl = (L.water || []).length, bb = L.brokenBr || {}; if (L._fordsOf === L.paths && L._fordsN === wl && L._fords) return L._fords;
  var o = {}; (L.paths || []).forEach(function (p) { (p || []).forEach(function (q) { var v = L.grid[q[1]] && L.grid[q[1]][q[0]], k = q[1] * L.W + q[0]; if (v === 4 && !bb[k] && !(L.pondRoad && L.pondRoad[k] !== undefined)) o[k] = 1;   /* 2.12.42: дорога через пруд — под водой не видна (сани идут вброд) */ }); });   // 2.12.31: рухнувший мост — не брод
  L._fords = o; L._fordsOf = L.paths; L._fordsN = wl; return o;
}
function cells(G) {
  var L = G.L, o = { open: [], ice: [] };
  var kb = L.kb;
  (L.water || []).forEach(function (q) { if (L.bridges[q[1] * L.W + q[0]] && !(kb && q[1] === kb.r && q[0] >= kb.c0 - 1 && q[0] <= kb.c1 + 1)) return; var v = L.grid[q[1]][q[0]]; if (v === 4) o.open.push(q); else if (v === 5) o.ice.push(q); });   // под мостом воду не рисуем поверх настила
  return o;
}
var cache = { key: '', open: [], ice: [] };
function geo(G, X, Y, cs) {
  var L = G.L, sig = 0; (L.water || []).forEach(function (q) { sig += (L.grid[q[1]][q[0]] || 0) * (q[0] + 1) + (L.bridges[q[1] * L.W + q[0]] ? 7 : 0); });
  var key = sig + ',' + X(0).toFixed(1) + ',' + Y(0).toFixed(1) + ',' + cs.toFixed(2) + ',' + (L.water || []).length + ',' + Object.keys(L.bridges || {}).length + ',' + (G.waterVer || 0);
  if (cache.key === key && cache.L === L) return cache;
  var C = cells(G);
  cache = { key: key, L: L, sig0: sig + ',' + (L.water || []).length + ',' + Object.keys(L.bridges || {}).length + ',' + (G.waterVer || 0) + ',' + (L.riverFrozen ? 1 : 0),
    open: C.open.map(function (q) { var e = edges(G, q, X, Y, cs, isOpen); e.q = q; return e; }),
    ice: C.ice.map(function (q) { var e = edges(G, q, X, Y, cs, function (L2, c, r) { var v = L2.grid[r] && L2.grid[r][c]; return c < 0 || c >= L2.W || v === 5 || r === L2.riverRow; }); e.q = q; return e; }) };
  return cache;
}
Z.waterClip = function (ctx, G, X, Y, cs, kind) { var g = geo(G, X, Y, cs); pathOf(ctx, kind === 'ice' ? g.ice : g.open); ctx.clip(); };
function line(ctx, pts, dy) { ctx.moveTo(pts[0][0], pts[0][1] + dy); for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1] + dy); }

// основа воды: вызывается из Z.drawUnder (v26d) вместо квадратиков по клеткам
// 2.12: основа воды (заливка, глубина, берега, лёд) не меняется — готовой картинкой (v30o); живьём только струи течения
var wInner = 0;
function streams(ctx, X, Y, cs, t, L, g) {
  if (L.riverRow === undefined || Z.RICH === 0 || !g.open.length) return;
  ctx.save(); pathOf(ctx, g.open); ctx.clip();
  var yr = Y(L.riverRow), xa = X(-1), xb = X(L.W + 1);
  ctx.lineCap = 'round';
  [[0.36, 0.0, 0.5], [0.52, 2.1, 0.32], [0.66, 4.3, 0.45]].forEach(function (s) {
    ctx.beginPath(); for (var xx = xa; xx <= xb; xx += cs * 0.1) { var xw = (xx - X(0)) / cs, yy = yr + cs * (s[0] + 0.025 * Math.sin(xw * 1.7 + s[1] + t * 0.8)); if (xx === xa) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
    ctx.setLineDash([cs * 0.55, cs * 0.35, cs * 0.18, cs * 0.6]); ctx.lineDashOffset = -t * cs * 0.55 - s[1] * cs;
    ctx.strokeStyle = 'rgba(255,255,255,' + s[2] + ')'; ctx.lineWidth = Math.max(1, cs * 0.028); ctx.stroke();
  });
  ctx.setLineDash([]); ctx.restore();
}
Z.waterBase = function (ctx, X, Y, cs, t) {
  var G = Z.G, L = G.L, g = geo(G, X, Y, cs), spr = G.mech === 'springs';
  if (Z.sceneSprite && !wInner && ctx === D.ctx) {
    var thinAny = L.iceT && g.ice.some(function (e) { var k = e.q[1] * L.W + e.q[0]; return G.t - (L.iceT[k] || -99) < 5; });
    if (!thinAny) {
      var key = 'water|' + g.sig0 + '|' + (spr ? 1 : 0);
      Z.sceneSprite(key, function () { wInner = 1; try { Z.waterBase(D.ctx, X, Y, cs, t); } finally { wInner = 0; } });
      streams(ctx, X, Y, cs, t, L, g); return;
    }
  }
  if (g.open.length) {
    ctx.save();
    // 2.11.5: брод — дорога идёт через воду: там вода мелкая и полупрозрачная, дорога и ловушки на ней видны
    var ford = fords(L), deep = g.open.filter(function (e) { return !ford[e.q[1] * L.W + e.q[0]]; }), shallow = g.open.filter(function (e) { return ford[e.q[1] * L.W + e.q[0]]; });
    pathOf(ctx, deep); ctx.fillStyle = spr ? '#6cc9c4' : '#5aaee2'; ctx.fill();
    if (shallow.length) { pathOf(ctx, shallow); ctx.fillStyle = spr ? 'rgba(108,201,196,0.42)' : 'rgba(90,174,226,0.42)'; ctx.fill(); }
    ctx.save(); pathOf(ctx, deep); ctx.clip();
    // глубина: русло реки темнее к середине, в озёрах — мягкие пятна по глубине клеток (без швов)
    if (L.riverRow !== undefined) {
      var y0 = Y(L.riverRow) + cs * 0.13, y1 = y0 + cs * 0.74, gr = ctx.createLinearGradient(0, y0, 0, y1);
      gr.addColorStop(0, 'rgba(150,215,245,0.55)'); gr.addColorStop(0.22, 'rgba(90,170,230,0)'); gr.addColorStop(0.55, 'rgba(25,85,160,0.28)'); gr.addColorStop(0.85, 'rgba(90,170,230,0)'); gr.addColorStop(1, 'rgba(170,225,250,0.6)');
      ctx.fillStyle = gr; ctx.fillRect(X(-2), y0 - 2, (L.W + 4) * cs, y1 - y0 + 4);
    }
    g.open.forEach(function (e) {
      var q = e.q, dp = (L.wdepth && L.wdepth[q[1] * L.W + q[0]]) || 0; if (!dp || L.riverRow === q[1]) return;
      var cx = X(q[0] + 0.5), cy = Y(q[1] + 0.5), rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cs * 0.95);
      rg.addColorStop(0, 'rgba(20,70,145,' + Math.min(0.3, dp * 0.1).toFixed(3) + ')'); rg.addColorStop(1, 'rgba(20,70,145,0)');
      ctx.fillStyle = rg; ctx.fillRect(cx - cs, cy - cs, cs * 2, cs * 2);
    });
    // у берегов светлее (мелко)
    ctx.strokeStyle = 'rgba(190,235,255,0.35)'; ctx.lineWidth = cs * 0.16; ctx.lineJoin = 'round'; ctx.beginPath();
    g.open.forEach(function (e) { if (e.bot) line(ctx, e.bp, 0); if (e.top) line(ctx, e.tp, cs * 0.1); });
    ctx.stroke();
    // струи течения: длинные, непрерывные через клетки, бегут по реке
    if (L.riverRow !== undefined && Z.RICH !== 0 && !wInner) {
      var yr = Y(L.riverRow), xa = X(-1), xb = X(L.W + 1);
      ctx.lineCap = 'round';
      [[0.36, 0.0, 0.5], [0.52, 2.1, 0.32], [0.66, 4.3, 0.45]].forEach(function (s) {
        ctx.beginPath(); for (var xx = xa; xx <= xb; xx += cs * 0.1) { var xw = (xx - X(0)) / cs, yy = yr + cs * (s[0] + 0.025 * Math.sin(xw * 1.7 + s[1] + t * 0.8)); if (xx === xa) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
        ctx.setLineDash([cs * 0.55, cs * 0.35, cs * 0.18, cs * 0.6]); ctx.lineDashOffset = -t * cs * 0.55 - s[1] * cs;
        ctx.strokeStyle = 'rgba(255,255,255,' + s[2] + ')'; ctx.lineWidth = Math.max(1, cs * 0.028); ctx.stroke();
      });
      ctx.setLineDash([]);
    }
    ctx.restore();
    // верхний берег: снежная стенка над водой (берег выше воды), под ней — тень у кромки
    ctx.save(); pathOf(ctx, g.open); ctx.clip();
    ctx.lineJoin = 'round';
    ctx.beginPath(); g.open.forEach(function (e) { if (e.top) line(ctx, e.tp, cs * 0.05); }); ctx.strokeStyle = '#c4d3ea'; ctx.lineWidth = cs * 0.1; ctx.stroke();
    ctx.beginPath(); g.open.forEach(function (e) { if (e.top) line(ctx, e.tp, cs * 0.1); }); ctx.strokeStyle = 'rgba(25,70,130,0.35)'; ctx.lineWidth = Math.max(1, cs * 0.025); ctx.stroke();
    ctx.restore();
    // контур берегов
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = Math.max(1.2, cs * 0.032); ctx.beginPath();
    g.open.forEach(function (e) {
      if (e.top) line(ctx, e.tp, 0); if (e.bot) line(ctx, e.bp, 0);
      if (e.lft) { ctx.moveTo(e.tp[0][0], e.tp[0][1]); ctx.lineTo(e.bp[0][0], e.bp[0][1]); }
      if (e.rgt) { var n = e.tp.length - 1; ctx.moveTo(e.tp[n][0], e.tp[n][1]); ctx.lineTo(e.bp[n][0], e.bp[n][1]); }
    });
    ctx.globalAlpha = 0.75; ctx.stroke();
    ctx.restore();
  }
  if (g.ice.length) {
    ctx.save(); pathOf(ctx, g.ice);
    var thinAny = L.iceT && g.ice.some(function (e) { var k = e.q[1] * L.W + e.q[0]; return G.t - (L.iceT[k] || -99) < 5; });
    ctx.fillStyle = '#c9e7f7'; ctx.fill();
    if (thinAny) { ctx.save(); ctx.clip(); g.ice.forEach(function (e) { var k = e.q[1] * L.W + e.q[0]; if (G.t - (L.iceT[k] || -99) < 5) { var cx = X(e.q[0] + 0.5), cy = Y(e.q[1] + 0.5), rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cs * 0.8); rg.addColorStop(0, 'rgba(90,170,230,0.45)'); rg.addColorStop(1, 'rgba(90,170,230,0)'); ctx.fillStyle = rg; ctx.fillRect(cx - cs, cy - cs, cs * 2, cs * 2); } }); ctx.restore(); }
    ctx.strokeStyle = OL; ctx.lineWidth = Math.max(1.2, cs * 0.03); ctx.lineJoin = 'round'; ctx.globalAlpha = 0.6; ctx.beginPath();
    g.ice.forEach(function (e) { if (e.top) line(ctx, e.tp, 0); if (e.bot) line(ctx, e.bp, 0); });
    ctx.stroke(); ctx.restore();
  }
};
// река на подложке поля (под мостами и переправами): та же форма, цвет, стенка берега и контур, что у воды сверху,
// поэтому в щелях между настилами и у края поля видна та же река, без второй кромки
Z.riverStatic = function (c2, L, cs, xa, xb) {
  var r = L.riverRow, fr = L.riverFrozen, N = Math.ceil((xb - xa) / (cs * 0.12)), tp = [], bp = [], i, xx, xw;
  for (i = 0; i <= N; i++) { xx = xa + (xb - xa) * i / N; xw = xx / cs; tp.push([xx, (r + 0.13 + 0.03 + wob(xw, r * 2)) * cs]); bp.push([xx, (r + 0.87 - 0.03 - wob(xw, r * 2 + 1)) * cs]); }
  var e = { tp: tp, bp: bp };
  c2.save(); pathOf(c2, [e]); c2.fillStyle = fr ? '#c9e7f7' : '#5aaee2'; c2.fill();
  if (!fr) {
    c2.save(); pathOf(c2, [e]); c2.clip();
    var y0 = (r + 0.13) * cs, y1 = y0 + cs * 0.74, gr = c2.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, 'rgba(150,215,245,0.55)'); gr.addColorStop(0.22, 'rgba(90,170,230,0)'); gr.addColorStop(0.55, 'rgba(25,85,160,0.28)'); gr.addColorStop(0.85, 'rgba(90,170,230,0)'); gr.addColorStop(1, 'rgba(170,225,250,0.6)');
    c2.fillStyle = gr; c2.fillRect(xa, y0 - 2, xb - xa, y1 - y0 + 4);
    c2.lineJoin = 'round'; c2.beginPath(); line(c2, tp, cs * 0.05); c2.strokeStyle = '#c4d3ea'; c2.lineWidth = cs * 0.1; c2.stroke();
    c2.beginPath(); line(c2, tp, cs * 0.1); c2.strokeStyle = 'rgba(25,70,130,0.35)'; c2.lineWidth = Math.max(1, cs * 0.025); c2.stroke();
    c2.restore();
  }
  c2.lineJoin = 'round'; c2.strokeStyle = OL; c2.lineWidth = Math.max(1.2, cs * (fr ? 0.03 : 0.032)); c2.globalAlpha = fr ? 0.6 : 0.75; c2.beginPath(); line(c2, tp, 0); line(c2, bp, 0); c2.stroke();
  c2.restore();
};
// пена у берега — бегущий пунктир по тем же неровным кромкам (вызывается из v29w)
Z.waterFoam = function (ctx, X, Y, cs, t) {
  var G = Z.G, g = geo(G, X, Y, cs); if (!g.open.length) return;
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1, cs * 0.035); ctx.lineCap = 'round'; ctx.setLineDash([cs * 0.16, cs * 0.24]); ctx.lineDashOffset = -t * cs * 0.35;
  ctx.beginPath(); g.open.forEach(function (e) { if (e.bot) line(ctx, e.bp, -cs * 0.07); if (e.top) line(ctx, e.tp, cs * 0.15); });
  ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t * 2); ctx.stroke(); ctx.restore();
};
// Калинов мост: рисуется после всей воды (каустики, блики, пена), в арках — та же вода
Z._kbLate = true;
var oU = Z.drawUnder;
Z.drawUnder = function (ctx, X, Y, cs, t) {
  if (oU) oU.apply(this, arguments);
  var G = Z.G, kb = G && G.L && G.L.kb; if (kb && Z._kbBack) Z._kbBack(ctx, X, Y, cs, t, kb);
};
})();
