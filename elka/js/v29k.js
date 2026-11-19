// v2.10.6–2.10.7: настоящий рельеф — только на горных картах (см. CFG). Дорога переваливает через гору между двумя снежными пиками.
// В гору враги ползут медленно (наклоняются, пыхтят), с горы — разгоняются и съезжают (машины — ещё быстрее).
// Вышка на склоне видит дальше (до +15%). Гора — объёмная: склоны со светом и тенью, скалы, ели, снежные шапки,
// дорога на перевале поднимается вместе с горой, враги и герои на ней — выше.
// Вместо скальных гряд 2.10.5 (они были только для вида).
// Тут же: заячья нора на «Заячьих тропах» — сугроб с норами, из которых выглядывают и выбегают зайцы (раньше — эмодзи в яйце).
(function () {
var Z = window.Z, D = Z.D, TT = Z.TT, OL = D.OL || '#26304f';
var K = 0.6;   // подъём на один «уровень» высоты, в клетках
function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function sstep(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }

// ---------- где ставить гору: только там, где этого требует сама карта ----------
// 13 «Площадь с горкой» — ледяная горка: долгий подъём по лестнице, крутой скат вниз (у горки).
// 21 «Перевал» — длинный подъём и спуск прямо к ёлке; на главном пике снежная шапка — лавина по спуску.
// Везде: на крутом склоне строить нельзя (осыпь), кроме отмеченных уступов — подъём не становится бесплатной зоной убийства.
var CFG = {
  13: { kind: 'slide', n: [6, 7], at: 'landmark', Hr: 1.5, up: 0.72, peaks: 0, ledges: 0 },
  21: { kind: 'pass', n: [10, 12], at: 0.62, Hr: 2.1, up: 0.5, peaks: 2, extra: 3, ledges: 2, avalanche: true }
};
function wants(idx, L) { var cf = CFG[idx]; return !!cf && (L.type !== 'escort' || cf.escort) && !L.kb; }
function build(L, idx) {
  var cf = CFG[idx], W = L.W, H = L.H, g = L.grid, rnd = rng(7331 + idx * 101), P = (L.paths && L.paths.length) ? L.paths : [L.main];
  var main = P.reduce(function (a, b) { return b.length > a.length ? b : a; }, []);
  if (!main || main.length < 10) return;
  var ents = L.entrances || [], lm = L.landmark;
  function forbid(c, r) {
    if (c < 0 || r < 0 || c >= W || r >= H) return true;
    var v = g[r][c]; if (v === 4 || v === 5 || v === 8 || v === 9 || v === 10 || v === 11) return true;
    var k = r * W + c; if ((L.bridges && L.bridges[k]) || (L.ice && L.ice[k])) return true;
    if (L.fort && Math.abs(c - L.fort[0]) <= 2 && r >= L.fort[1] - 2) return true;
    if (ents.some(function (e) { return Math.abs(e[0] - c) <= 1 && Math.abs(e[1] - r) <= 1; })) return true;
    if (cf.kind !== 'slide' && lm && c >= lm.c - 1 && c <= lm.c + 2 && r >= lm.r - 1 && r <= lm.r + 2) return true;
    if (r === 0 || r === H - 1) return v !== 1;
    return false;
  }
  // центр окна: доля пути или (горка) — клетка дороги у самой горки, чтобы скат кончался у неё
  var target = Math.round(main.length * (typeof cf.at === 'number' ? cf.at : 0.5));
  if (cf.at === 'landmark' && lm) { var bd = 1e9; main.forEach(function (q, i) { var d = Math.hypot(q[0] - lm.c - 1, q[1] - lm.r - 1); if (d < bd) { bd = d; target = i; } }); }
  var tries = [];
  for (var n0 = cf.n[1]; n0 >= Math.max(5, cf.n[0] - 3); n0--) for (var i0 = 1; i0 + n0 < main.length - 1; i0++) {
    var ctr = cf.at === 'landmark' ? i0 + Math.round(n0 * (cf.up || 0.5)) : i0 + n0 / 2;
    tries.push([i0, n0, Math.abs(ctr - target) + (cf.n[1] - n0) * 0.6]);
  }
  tries.sort(function (a, b) { return a[2] - b[2]; });
  for (var ti = 0; ti < tries.length; ti++) {
    var n = tries[ti][1], win = main.slice(tries[ti][0], tries[ti][0] + n);
    if (win.length < n || win.some(function (q) { return forbid(q[0], q[1]) || g[q[1]][q[0]] !== 1; })) continue;
    var Hr = cf.Hr * (0.95 + rnd() * 0.1), up = cf.up || 0.5;
    // профиль дороги: подъём (доля up), короткая площадка, спуск; в ущелье дорога внизу
    var prof = win.map(function (q, j) { if (cf.kind === 'gorge') return 0; var u = (j + 0.5) / n, top = 0.08; return Hr * (u < up - top ? sstep(u / (up - top)) : u <= up + top ? 1 : sstep((1 - u) / (1 - up - top))); });
    var mid = Math.min(n - 2, Math.max(1, Math.round(n * up))), a = win[mid - 1], b = win[mid + 1], dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy) || 1, px = -dy / ln, py = dx / ln;
    var peaks = [];
    for (var pk = 0; pk < cf.peaks; pk++) { var sd = pk % 2 ? -1 : 1; for (var d = 3; d >= 2; d--) { var pc = Math.round(win[mid][0] + px * d * sd), pr = Math.round(win[mid][1] + py * d * sd); if (!forbid(pc, pr) && g[pr][pc] !== 1) { peaks.push([pc, pr, Hr + 0.9 + rnd() * 0.5]); break; } } }
    var E = [], onWin = {};
    win.forEach(function (q, j) { onWin[q[1] * W + q[0]] = prof[j]; });
    for (var r = 0; r < H; r++) { E.push([]); for (var c = 0; c < W; c++) {
      var k = r * W + c, h = 0;
      if (onWin[k] !== undefined) h = onWin[k];
      else if (g[r][c] === 1) h = 0;
      else if (cf.kind === 'gorge') {
        // стены ущелья: высоко сразу у дороги, к концам ущелья ниже, вдали — сходят на нет
        var dmin = 1e9, jn = 0; for (var j = 0; j < n; j++) { var dd = Math.hypot(c - win[j][0], r - win[j][1]); if (dd < dmin) { dmin = dd; jn = j; } }
        var endw = sstep(Math.min(jn + 0.5, n - 0.5 - jn) / 2.2);
        h = dmin < 0.5 ? 0 : Hr * sstep((dmin - 0.55) / 0.9) * (1 - sstep((dmin - 2.6) / 2.2)) * endw;
      } else {
        for (var j2 = 0; j2 < n; j2++) { var d2 = Math.hypot(c - win[j2][0], r - win[j2][1]); if (d2 < 3.4) h = Math.max(h, prof[j2] * (1 - sstep((d2 - 0.6) / (cf.kind === 'slide' ? 1.6 : 2.8)))); }
        peaks.forEach(function (p) { var dp = Math.hypot(c - p[0], r - p[1]); if (dp < 3.2) h = Math.max(h, p[2] * (1 - sstep((dp - 0.3) / 2.9))); });
      }
      if (h > 0.05) h *= 0.93 + rnd() * 0.14;
      if (forbid(c, r) && g[r][c] !== 1) h = 0;
      E[r].push(h);
    } }
    var dec = {}, nb = {}, ledge = {};
    for (var r2 = 0; r2 < H; r2++) for (var c2 = 0; c2 < W; c2++) {
      if (E[r2][c2] < 0.15) continue; var k2 = r2 * W + c2;
      if (g[r2][c2] !== 1) g[r2][c2] = 0;
      if (L.bush) delete L.bush[k2]; if (L.drift) delete L.drift[k2]; if (L.hgt && L.hgt[r2]) L.hgt[r2][c2] = 0;
    }
    peaks.forEach(function (p) { if (g[p[1]][p[0]] === 0) { g[p[1]][p[0]] = 7; dec[p[1] * W + p[0]] = 'peak'; } });
    // хребет: ещё пики на самых высоких местах вдали от дороги
    var cand = [];
    for (var r5 = 1; r5 < H - 1; r5++) for (var c5 = 0; c5 < W; c5++) {
      if (g[r5][c5] !== 0 || E[r5][c5] < Math.max(1.25, Hr * 0.75)) continue;
      var adj = false; for (var a5 = -1; a5 <= 1; a5++) for (var b5 = -1; b5 <= 1; b5++) if (g[r5 + a5] && g[r5 + a5][c5 + b5] === 1) adj = true;
      if (!adj) cand.push([c5, r5, E[r5][c5] + rnd() * 0.3]);
    }
    cand.sort(function (x, y) { return y[2] - x[2]; });
    var extra = cf.extra || 0;
    for (var q5 = 0; q5 < cand.length && extra > 0; q5++) { var cc5 = cand[q5]; if (g[cc5[1]][cc5[0]] !== 0) continue; var near = false; for (var a6 = -1; a6 <= 1; a6++) for (var b6 = -1; b6 <= 1; b6++) if (dec[(cc5[1] + a6) * W + cc5[0] + b6] === 'peak' && (a6 || b6) && rnd() < 0.5) near = true; if (near) continue; g[cc5[1]][cc5[0]] = 7; dec[cc5[1] * W + cc5[0]] = 'peak'; extra--; }
    // уступы: ровные площадки на склоне в 2 клетках от дороги — единственные места под вышки на горе
    var lc = [];
    for (var r6 = 1; r6 < H - 1; r6++) for (var c6 = 0; c6 < W; c6++) {
      if (g[r6][c6] !== 0 || E[r6][c6] < 0.8) continue;
      var dmn = 1e9; win.forEach(function (q) { dmn = Math.min(dmn, Math.max(Math.abs(q[0] - c6), Math.abs(q[1] - r6))); });
      if (dmn !== 2) continue; lc.push([c6, r6, rnd()]);
    }
    lc.sort(function (x, y) { return x[2] - y[2]; });
    var nl = 0; for (var q6 = 0; q6 < lc.length && nl < cf.ledges; q6++) { var L6 = lc[q6]; if (Object.keys(ledge).some(function (kk) { var kc = kk % W, kr = Math.floor(kk / W); return Math.abs(kc - L6[0]) + Math.abs(kr - L6[1]) < 3; })) continue; ledge[L6[1] * W + L6[0]] = 1; E[L6[1]][L6[0]] = Math.max(E[L6[1]][L6[0]], 1.1); nl++; }
    // осыпь: крутой склон — не строится
    for (var r7 = 0; r7 < H; r7++) for (var c7 = 0; c7 < W; c7++) { var k7 = r7 * W + c7; if (g[r7][c7] === 0 && E[r7][c7] > 0.5 && !ledge[k7]) nb[k7] = 1; }
    if (L.spots) L.spots = L.spots.filter(function (sp) { var v = g[sp.r][sp.c], kk = sp.r * W + sp.c; return (v === 0 || v === 3) && !nb[kk]; });
    var bb = [W, H, 0, 0]; for (var r3 = 0; r3 < H; r3++) for (var c3 = 0; c3 < W; c3++) if (E[r3][c3] > 0.02) { bb[0] = Math.min(bb[0], c3); bb[1] = Math.min(bb[1], r3); bb[2] = Math.max(bb[2], c3); bb[3] = Math.max(bb[3], r3); }
    var cap = null; if (cf.avalanche) { var best = null; Object.keys(dec).forEach(function (kk) { var kc = kk % W, kr = Math.floor(kk / W); if (dec[kk] === 'peak' && (!best || (kr >= 2) > (best[1] >= 2) || ((kr >= 2) === (best[1] >= 2) && E[kr][kc] > E[best[1]][best[0]]))) best = [kc, kr]; }); cap = best; }
    L.mtn = { E: E, dec: dec, nb: nb, ledge: ledge, bb: bb, Hr: Hr, win: win, mid: mid, kind: cf.kind, cap: cap };
    return;
  }
}
var oGen = Z.genLevel;
Z.genLevel = function (idx, dims) { var L = oGen.apply(this, arguments); try { if (wants(idx, L)) build(L, idx); } catch (e) { L.mtn = null; Z._mtnErr = String(e); } return L; };
Z._mtnDbg = { wants: wants, build: build };

// ---------- высота в точке (клетки), подъём на экране ----------
function hAt(M, x, y) {
  var E = M.E, fx = x - 0.5, fy = y - 0.5, c0 = Math.floor(fx), r0 = Math.floor(fy), tx = fx - c0, ty = fy - r0;
  function e(c, r) { return (E[r] && E[r][c]) || 0; }
  // Катмулл–Ром по 4×4 клеткам — склоны гладкие, без «складок» на границах клеток
  function cr(p0, p1, p2, p3, t) { return p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0))); }
  var rows = [];
  for (var j = -1; j <= 2; j++) rows.push(cr(e(c0 - 1, r0 + j), e(c0, r0 + j), e(c0 + 1, r0 + j), e(c0 + 2, r0 + j), tx));
  var v = cr(rows[0], rows[1], rows[2], rows[3], ty);
  return v > 0 ? v : 0;
}
function mtn() { var G = Z.G; return G && G.L && G.L.mtn; }
Z.mtnH = function (x, y) { var M = mtn(); return M ? hAt(M, x, y) : 0; };
var oLift = Z.liftAt;
Z.liftAt = function (x, y) { var M = mtn(); return (oLift ? oLift(x, y) : 0) + (M ? hAt(M, x, y) * K : 0); };
Z.cellLift = function (c, r) { var M = mtn(); return M ? hAt(M, c + 0.5, r + 0.5) * K : 0; };

// ---------- скорость: в гору медленно, с горы быстро ----------
var oSp = Z.hk.speed;
Z.hk.speed = function (e, pos, k) {
  k = oSp ? oSp(e, pos, k) : k;
  var M = mtn(); if (!M || e.air || !pos) return k;
  var z = hAt(M, pos.x, pos.y);
  if (e._mz === undefined) { e._mz = z; e._mx = pos.x; e._my = pos.y; e._sl = 0; return k; }
  var d = Math.hypot(pos.x - e._mx, pos.y - e._my);
  if (d > 0.06) { var sl = (z - e._mz) / d; e._sl += (clamp(sl, -2, 2) - e._sl) * 0.6; e._mz = z; e._mx = pos.x; e._my = pos.y; }
  if (z < 0.08) { e._sl *= 0.8; return k; }
  var T = Z.ENEMIES[e.type] || {}, s = e._sl;
  if (s > 0.05) k *= 1 / (1 + s * (T.vehicle ? 1.4 : T.boss ? 0.6 : 0.95));
  else if (s < -0.05) k *= 1 + Math.min(1.2, -s) * (T.vehicle ? 1.0 : T.boss ? 0.35 : 0.8);
  return k;
};
// вышка на склоне видит дальше
var oRange = Z.hk.rangeMul;
Z.hk.rangeMul = function (tw) { var m = oRange ? oRange(tw) : 1, M = mtn(); if (M) if (M.ledge && M.ledge[tw.r * Z.G.L.W + tw.c]) m *= 1.18; else m *= 1 + Math.min(0.06, hAt(M, tw.c + 0.5, tw.r + 0.5) * 0.06); return m; };

// ---------- рисунок горы (в статичный слой поля) ----------
var LT = (function () { var x = -0.55, y = -0.75, z = 0.9, l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; })();
function mix(a, b, t) { t = clamp(t, 0, 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function rgb(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a === undefined ? 1 : a) + ')'; }
var SNOW = [255, 255, 255], SHADE = [206, 219, 245], DEEP = [138, 160, 214], ROCK = [128, 136, 160], ROCKD = [92, 100, 128];
D.mtnLayer = function (c2, L, cs, G) {
  var M = L.mtn; if (!M) return;
  var bb = M.bb, S = 5, x0 = bb[0] - 0.5, y0 = bb[1] - 0.5, x1 = bb[2] + 1.5, y1 = bb[3] + 1.5;
  var nx = Math.ceil((x1 - x0) * S), ny = Math.ceil((y1 - y0) * S), hh = [], X = function (x) { return x * cs; }, Yp = function (y, h) { return (y - h * K) * cs; };
  for (var j = 0; j <= ny; j++) { hh.push([]); for (var i = 0; i <= nx; i++) hh[j].push(hAt(M, x0 + i / S, y0 + j / S)); }
  c2.save();
  // тень от горы вправо-вниз
  for (var r = bb[1]; r <= bb[3]; r++) for (var c = bb[0]; c <= bb[2]; c++) { var e = M.E[r][c]; if (e < 0.2) continue; c2.fillStyle = 'rgba(40,60,120,' + Math.min(0.09, e * 0.035) + ')'; c2.beginPath(); c2.ellipse(X(c + 0.95), (r + 0.85) * cs, cs * (0.6 + e * 0.15), cs * (0.45 + e * 0.1), 0.3, 0, 7); c2.fill(); }
  // склоны: сетка с освещением, сзади вперёд — рисуем в маленький холст и растягиваем со сглаживанием (мягкие переходы)
  var hmax = 0; hh.forEach(function (row) { row.forEach(function (v) { if (v > hmax) hmax = v; }); });
  var sx0 = X(x0), sy0 = Yp(y0, hmax) - cs * 0.2, sw = X(x1) - sx0, sh = Yp(y1, 0) - sy0, q = 0.3;
  var off = document.createElement('canvas'); off.width = Math.max(2, Math.ceil(sw * q)); off.height = Math.max(2, Math.ceil(sh * q));
  var main2 = c2; c2 = off.getContext('2d'); c2.setTransform(q, 0, 0, q, -sx0 * q, -sy0 * q);
  for (var j2 = 0; j2 < ny; j2++) for (var i2 = 0; i2 < nx; i2++) {
    var ha = hh[j2][i2], hb = hh[j2][i2 + 1], hc = hh[j2 + 1][i2 + 1], hd = hh[j2 + 1][i2], hm = (ha + hb + hc + hd) / 4;
    if (hm < 0.015) continue;
    var NS = 1.25, gx = ((hb + hc) - (ha + hd)) / 2 * S * NS, gy = ((hd + hc) - (ha + hb)) / 2 * S * NS, nl = Math.hypot(gx, gy, 1), dot = (-gx * LT[0] - gy * LT[1] + LT[2]) / nl, slope = Math.hypot(gx, gy) / NS;
    var tl = (dot - 0.2) / 0.75, base = tl < 0.5 ? mix(DEEP, SHADE, tl / 0.5) : mix(SHADE, SNOW, (tl - 0.5) / 0.5);
    var rock = clamp((slope - 0.75) / 0.6, 0, 0.8) * (hm > 0.4 ? 1 : 0); if (rock > 0) base = mix(base, dot > 0.75 ? ROCK : ROCKD, rock * 0.75);
    if (hm > M.Hr + 0.35) base = mix(base, [255, 255, 255], 0.6);   // снежные шапки
    var xa = X(x0 + i2 / S), xb = X(x0 + (i2 + 1) / S), ya = y0 + j2 / S, yb = y0 + (j2 + 1) / S;
    var al = clamp(hm * 7, 0, 1); c2.globalAlpha = al;
    c2.fillStyle = c2.strokeStyle = rgb(base); c2.lineWidth = 1;
    var o = al >= 1 ? 1.2 : 0; c2.beginPath(); c2.moveTo(xa - o, Yp(ya, ha) - o); c2.lineTo(xb + o, Yp(ya, hb) - o); c2.lineTo(xb + o, Yp(yb, hc) + o); c2.lineTo(xa - o, Yp(yb, hd) + o); c2.closePath(); c2.fill();
  }
  c2.globalAlpha = 1;
  c2 = main2; c2.save(); c2.imageSmoothingEnabled = true; try { c2.imageSmoothingQuality = 'high'; } catch (e0) { if (window.__rep) window.__rep(e0); } c2.drawImage(off, sx0, sy0, off.width / q, off.height / q); c2.restore();
  // горизонтали — читается как гора
  c2.strokeStyle = 'rgba(70,92,160,0.28)'; c2.lineWidth = Math.max(1, cs * 0.025);
  [0.12, 0.55, 1.1, 1.65, 2.2, 2.75].forEach(function (lv) {
    c2.strokeStyle = lv < 0.2 ? 'rgba(38,48,79,0.45)' : 'rgba(70,92,160,0.3)'; c2.lineWidth = Math.max(1, cs * (lv < 0.2 ? 0.04 : 0.025));
    c2.beginPath();
    for (var j3 = 0; j3 < ny; j3++) for (var i3 = 0; i3 < nx; i3++) {
      var q = [[i3, j3], [i3 + 1, j3], [i3 + 1, j3 + 1], [i3, j3 + 1]], pts = [];
      for (var e2 = 0; e2 < 4; e2++) { var A = q[e2], B = q[(e2 + 1) % 4], ha2 = hh[A[1]][A[0]], hb2 = hh[B[1]][B[0]]; if ((ha2 - lv) * (hb2 - lv) < 0) { var u = (lv - ha2) / (hb2 - ha2), gx2 = x0 + (A[0] + (B[0] - A[0]) * u) / S, gy2 = y0 + (A[1] + (B[1] - A[1]) * u) / S; pts.push([X(gx2), Yp(gy2, lv)]); } }
      if (pts.length >= 2) { c2.moveTo(pts[0][0], pts[0][1]); c2.lineTo(pts[1][0], pts[1][1]); if (pts.length === 4) { c2.moveTo(pts[2][0], pts[2][1]); c2.lineTo(pts[3][0], pts[3][1]); } }
    }
    c2.stroke();
  });
  // блёстки снега
  var rs = rng(77 + (G.idx || 0));
  for (var sp = 0; sp < (bb[2] - bb[0] + 1) * (bb[3] - bb[1] + 1) * 2; sp++) { var sx = bb[0] + rs() * (bb[2] - bb[0] + 1), sy = bb[1] + rs() * (bb[3] - bb[1] + 1), sh = hAt(M, sx, sy); if (sh < 0.3) continue; c2.fillStyle = rs() < 0.5 ? 'rgba(255,255,255,0.9)' : 'rgba(120,140,200,0.18)'; c2.beginPath(); c2.ellipse(X(sx), Yp(sy, sh), cs * (0.04 + rs() * 0.1), cs * 0.03, 0, 0, 7); c2.fill(); }
  // дорога на перевале — поднимается вместе с горой
  var paths = L.paths && L.paths.length ? L.paths : [L.main];
  paths.forEach(function (p) {
    var pts = [];
    for (var a = 0; a < p.length - 1; a++) for (var st = 0; st < 6; st++) { var u = st / 6, x = p[a][0] + 0.5 + (p[a + 1][0] - p[a][0]) * u, y = p[a][1] + 0.5 + (p[a + 1][1] - p[a][1]) * u; pts.push([x, y, hAt(M, x, y)]); }
    var last = p[p.length - 1]; pts.push([last[0] + 0.5, last[1] + 0.5, hAt(M, last[0] + 0.5, last[1] + 0.5)]);
    var runs = [], cur = null;
    pts.forEach(function (q, qi) { var on = q[2] > 0.004 || (pts[qi + 1] && pts[qi + 1][2] > 0.004) || (pts[qi - 1] && pts[qi - 1][2] > 0.004); if (on) { if (!cur) { cur = []; runs.push(cur); } cur.push(q); } else cur = null; });
    runs.forEach(function (R) {
      if (R.length < 2) return;
      var line = function () { c2.beginPath(); R.forEach(function (q, qi) { var sx2 = X(q[0]), sy2 = Yp(q[1], q[2]); if (qi) c2.lineTo(sx2, sy2); else c2.moveTo(sx2, sy2); }); };
      c2.lineCap = 'round'; c2.lineJoin = 'round';
      line(); c2.strokeStyle = OL; c2.lineWidth = cs * 0.9; c2.stroke();
      line(); c2.strokeStyle = '#6d92d6'; c2.lineWidth = cs * 0.8; c2.stroke();
      line(); c2.strokeStyle = '#a3c4f3'; c2.lineWidth = cs * 0.62; c2.stroke();
      line(); c2.strokeStyle = 'rgba(255,255,255,0.2)'; c2.lineWidth = cs * 0.34; c2.stroke();
      // ступени-насечки на крутых местах
      c2.strokeStyle = 'rgba(52,74,140,0.42)'; c2.lineWidth = Math.max(1, cs * 0.04);
      for (var q2 = 1; q2 < R.length - 1; q2 += 2) { var A2 = R[q2 - 1], B2 = R[q2 + 1], sl = Math.abs(B2[2] - A2[2]) / (Math.hypot(B2[0] - A2[0], B2[1] - A2[1]) || 1); if (sl < 0.25) continue; var ddx = B2[0] - A2[0], ddy = B2[1] - A2[1], dl = Math.hypot(ddx, ddy) || 1, ox = -ddy / dl * 0.26, oy = ddx / dl * 0.26, m = R[q2]; c2.beginPath(); c2.moveTo(X(m[0] - ox), Yp(m[1] - oy, m[2])); c2.lineTo(X(m[0] + ox), Yp(m[1] + oy, m[2])); c2.stroke(); }
      // снежные бортики вдоль дороги на горе
      c2.globalAlpha = 0.9; c2.fillStyle = '#ffffff';
      for (var q3 = 0; q3 < R.length; q3 += 3) { var m3 = R[q3]; if (m3[2] < 0.15) continue; c2.beginPath(); c2.ellipse(X(m3[0]) + cs * 0.38, Yp(m3[1], m3[2]) + cs * 0.06, cs * 0.09, cs * 0.05, 0, 0, 7); c2.fill(); c2.beginPath(); c2.ellipse(X(m3[0]) - cs * 0.38, Yp(m3[1], m3[2]) + cs * 0.06, cs * 0.09, cs * 0.05, 0, 0, 7); c2.fill(); }
      c2.globalAlpha = 1;
    });
  });
  // осыпь (строить нельзя) и уступы (можно, видно дальше)
  var rsc = rng(919 + (G.idx || 0)), W0 = L.W;
  Object.keys(M.nb || {}).forEach(function (kk) {
    var c8 = kk % W0, r8 = Math.floor(kk / W0);
    for (var pb = 0; pb < 4; pb++) { var bx = c8 + 0.15 + rsc() * 0.7, by = r8 + 0.2 + rsc() * 0.65, bh = hAt(M, bx, by); c2.fillStyle = rsc() < 0.5 ? '#9aa1b5' : '#7f879f'; c2.beginPath(); c2.ellipse(X(bx), Yp(by, bh), cs * (0.05 + rsc() * 0.05), cs * 0.035, 0, 0, 7); c2.fill(); }
    c2.strokeStyle = 'rgba(80,90,125,0.28)'; c2.lineWidth = Math.max(1, cs * 0.02); var hx = hAt(M, c8 + 0.5, r8 + 0.5);
    for (var hl = 0; hl < 2; hl++) { var ox = c8 + 0.25 + hl * 0.35; c2.beginPath(); c2.moveTo(X(ox), Yp(r8 + 0.3, hx)); c2.lineTo(X(ox + 0.18), Yp(r8 + 0.62, hx)); c2.stroke(); }
  });
  Object.keys(M.ledge || {}).forEach(function (kk) {
    var c9 = kk % W0, r9 = Math.floor(kk / W0), lx = X(c9 + 0.5), ly = Yp(r9 + 0.62, hAt(M, c9 + 0.5, r9 + 0.6)), lw = Math.max(1.4, cs * 0.045);
    c2.fillStyle = '#7f879f'; c2.beginPath(); c2.ellipse(lx, ly + cs * 0.08, cs * 0.44, cs * 0.17, 0, 0, Math.PI); c2.lineTo(lx - cs * 0.44, ly); c2.ellipse(lx, ly, cs * 0.44, cs * 0.17, 0, Math.PI, 0, true); c2.fill();
    c2.fillStyle = '#c3cadb'; c2.beginPath(); c2.ellipse(lx, ly, cs * 0.44, cs * 0.17, 0, 0, 7); c2.fill(); c2.lineWidth = lw; c2.strokeStyle = OL; c2.stroke();
    c2.fillStyle = '#ffffff'; c2.beginPath(); c2.ellipse(lx - cs * 0.12, ly - cs * 0.03, cs * 0.18, cs * 0.06, 0, 0, 7); c2.fill();
  });
  // пики, скалы, ели — поверх, на своей высоте
  var reg = Z.REGIONS[G.info.region] || {}, keys = Object.keys(M.dec).map(Number).sort(function (a, b) { return a - b; });
  keys.forEach(function (k) {
    var c4 = k % L.W, r4 = Math.floor(k / L.W), kind = M.dec[k], x = X(c4 + 0.5), y = Yp(r4 + 0.7, M.E[r4][c4]), l = Math.max(1.4, cs * 0.045);
    if (kind === 'peak') {
      var ph = cs * (0.95 + (M.E[r4][c4] - M.Hr) * 0.35);
      D.poly([x - cs * 0.62, y, x - cs * 0.2, y - ph * 0.8, x - cs * 0.02, y - ph, x + cs * 0.2, y - ph * 0.72, x + cs * 0.6, y], '#8b93a7', l);
      D.poly([x - cs * 0.62, y, x - cs * 0.2, y - ph * 0.8, x - cs * 0.02, y - ph, x - cs * 0.1, y], 'rgba(255,255,255,0.22)');
      D.poly([x - cs * 0.36, y - ph * 0.55, x - cs * 0.2, y - ph * 0.8, x - cs * 0.02, y - ph, x + cs * 0.2, y - ph * 0.72, x + cs * 0.3, y - ph * 0.5, x + cs * 0.12, y - ph * 0.58, x - cs * 0.04, y - ph * 0.46, x - cs * 0.18, y - ph * 0.6], '#f4f8ff', l * 0.8);
    } else if (kind === 'rock') {
      D.poly([x - cs * 0.36, y, x - cs * 0.24, y - cs * 0.34, x + cs * 0.04, y - cs * 0.46, x + cs * 0.32, y - cs * 0.26, x + cs * 0.38, y], '#9aa1b5', l);
      D.poly([x - cs * 0.24, y - cs * 0.34, x + cs * 0.04, y - cs * 0.46, x + cs * 0.3, y - cs * 0.28, x + cs * 0.05, y - cs * 0.33], '#ffffff', l * 0.6);
    } else D.pine(x, y, cs * 0.9, reg.tree || '#24804f', true);
  });
  c2.restore();
};

// ---------- враги на склоне: в гору наклоняются и пыхтят, с горы — откидываются и несутся ----------
var oE = D.enemy;
D.enemy = function (e, x, y, cs, t) {
  var M = mtn(), s = e && e._sl;
  if (!M || !s || e.air || Math.abs(s) < 0.12 || e.dead) return oE.apply(this, arguments);
  var c = D.ctx, dir = e.dir || 1, ang = clamp(s, -1, 1) * (s > 0 ? 0.22 : 0.16) * dir;
  c.save(); c.translate(x, y); c.rotate(ang); c.translate(-x, -y);
  var r = oE.apply(this, arguments);
  c.restore();
  if (s > 0.3 && Math.sin(t * 5 + (e.id || 0)) > 0.6) { c.save(); c.globalAlpha = 0.7; D.ell(x - dir * cs * 0.32, y - cs * 0.95, cs * 0.05, cs * 0.08, '#9fd8ff', Math.max(1, cs * 0.02)); c.restore(); }
  if (s < -0.3) { c.save(); c.globalAlpha = 0.6; c.fillStyle = '#ffffff'; for (var i = 0; i < 4; i++) { var ph = (t * 3 + i * 0.25) % 1; c.beginPath(); c.arc(x - dir * cs * (0.3 + ph * 0.6), y - cs * (0.05 + ph * 0.3) + Math.sin(i * 7) * cs * 0.08, cs * (0.07 - ph * 0.05), 0, 7); c.fill(); } c.restore(); }
  return r;
};

// ---------- подсказка на первом уровне с горой ----------
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!G || !G.L) return;
  if (G.L.mtn && !G._mtnTip) {
    G._mtnTip = (G._mtnTip || 0); G._mtnT = (G._mtnT || 0) + dt;
    if (G._mtnT > 1.2) { G._mtnTip = 1; var seen = Z.save.seen && Z.save.seen.mtn; var kd = G.L.mtn.kind, sk = 'mtn_' + kd; if (!(Z.save.seen && Z.save.seen[sk])) { Z.save.seen[sk] = 1; G.banner = kd === 'gorge' ? { text: TT('Горное ущелье', 'Mountain gorge'), sub: TT('У стен ущелья строить нельзя — только на каменных уступах. С уступа видно дальше', 'You cannot build on the gorge walls — only on stone ledges, which see farther'), t: 4.5 }
        : kd === 'slide' ? { text: TT('Ледяная горка', 'Ice slide'), sub: TT('Наверх враги ползут медленно, вниз — слетают с разгона. Встречай их внизу', 'Enemies crawl up slowly and zoom down. Meet them at the bottom'), t: 4.5 }
        : kd === 'cable' ? { text: TT('Подъём в гору', 'Uphill road'), sub: TT('В гору враги идут медленно, но кабинка везёт их наверх в обход. Режь трос!', 'Enemies climb slowly, but the cable car carries them past the climb. Cut the cable!'), t: 4.5 }
        : { text: TT('Перевал', 'Mountain pass'), sub: TT('С перевала враги несутся к ёлке. Нажми на снежную шапку пика — сойдёт лавина', 'Enemies rush down the pass toward the tree. Tap the snowy peak to start an avalanche'), t: 5 }; } }
  }
  if (G.mech === 'hares' && G.L.landmark && !G._hareHome) { G._hareHome = 1; homeHares(G); }
  if (G.mech === 'hares' && G.L.landmark) hareTick(G, dt);
};

// ---------- заячья нора ----------
function burrow(G) { var lm = G.L.landmark; return { x: lm.c + 1, y: lm.r + 1.6 }; }
function homeHares(G) {
  var B = burrow(G);
  (G.critters || []).forEach(function (h, i) { if (!h) return; h.x = B.x + (i - 1) * 0.9; h.y = B.y + 0.6; h.home = 1; });
}
function hareTick(G, dt) {
  var B = burrow(G); if (G.phase === 'wave' || G.phase === 'escortRun') return;   // 2.11.5: в бою зайцы на охоте за врагами, в нору не прячутся
  G._hareT = (G._hareT || 6) - dt;
  if (G._hareT <= 0) {
    G._hareT = 7 + Math.random() * 6;
    // один заяц прячется в нору, другой выскакивает из неё
    var hs = (G.critters || []).filter(function (h) { return h && h.k === 'hare'; }); if (!hs.length) return;
    var far = hs.reduce(function (a, b) { return Math.hypot(a.x - B.x, a.y - B.y) > Math.hypot(b.x - B.x, b.y - B.y) ? a : b; });
    far.fx = far.x; far.fy = far.y; far.x = B.x + (Math.random() - 0.5) * 0.8; far.y = B.y + 0.6; far.hop = 0.35;
    G._peek = 1.4;
  }
  if (G._peek > 0) G._peek -= dt;
}
var oLm = D.landmark;
D.landmark = function (kind, x, y, cs, t) {
  var G = Z.G, mp = G && !G.endless && Z.mapOf ? Z.mapOf(G.idx) : null;
  if (!mp || mp.lm !== 'hares') return oLm.apply(this, arguments);
  var ctx = D.ctx, l = Math.max(1.5, cs * 0.05), W2 = cs * 1.05, H2 = cs * 0.75;
  D.ell(x + cs * 0.15, y + cs * 0.02, W2 * 1.05, cs * 0.26, 'rgba(30,40,80,0.16)');
  // сугроб-холм
  ctx.beginPath(); ctx.moveTo(x - W2, y); ctx.bezierCurveTo(x - W2 * 0.8, y - H2 * 1.1, x - W2 * 0.1, y - H2 * 1.25, x + W2 * 0.2, y - H2 * 1.05); ctx.bezierCurveTo(x + W2 * 0.6, y - H2 * 0.95, x + W2 * 0.95, y - H2 * 0.5, x + W2, y); ctx.closePath();
  var gr = ctx.createLinearGradient(x - W2, y - H2, x + W2, y); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#cfdcf3'); ctx.fillStyle = gr; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  // две норы
  [[-0.45, 0.55], [0.42, 0.42]].forEach(function (h, i) { var hx = x + W2 * h[0], hy = y - cs * 0.06, hw = cs * 0.24 * (i ? 0.85 : 1), hhgt = cs * h[1];
    ctx.beginPath(); ctx.ellipse(hx, hy, hw, hhgt, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#3a3150'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(hx, hy - hhgt * 0.05, hw * 1.25, hhgt * 0.32, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = l * 1.6; ctx.stroke(); });
  // заяц выглядывает из норы (уши и мордочка)
  var pk = G._peek > 0 ? Math.min(1, G._peek * 2) : (0.5 + 0.5 * Math.sin(t * 0.9)) > 0.75 ? 1 : 0.35;
  var hx2 = x - W2 * 0.45, hy2 = y - cs * 0.08 - cs * 0.28 * pk;
  ctx.save(); ctx.beginPath(); ctx.ellipse(hx2, y - cs * 0.06, cs * 0.24, cs * 0.9, 0, Math.PI, 0); ctx.closePath(); ctx.clip();
  D.ell(hx2 - cs * 0.07, hy2 - cs * 0.3, cs * 0.06, cs * 0.2, '#ffffff', l * 0.7); D.ell(hx2 + cs * 0.07, hy2 - cs * 0.3, cs * 0.06, cs * 0.19, '#ffffff', l * 0.7);
  D.ell(hx2 - cs * 0.07, hy2 - cs * 0.3, cs * 0.025, cs * 0.12, '#ffc1cf'); D.ell(hx2 + cs * 0.07, hy2 - cs * 0.3, cs * 0.025, cs * 0.11, '#ffc1cf');
  D.circ(hx2, hy2, cs * 0.17, '#ffffff', l * 0.8); D.circ(hx2 - cs * 0.06, hy2 - cs * 0.02, cs * 0.028, OL); D.circ(hx2 + cs * 0.06, hy2 - cs * 0.02, cs * 0.028, OL); D.circ(hx2, hy2 + cs * 0.05, cs * 0.03, '#ff9ab0');
  ctx.restore();
  // морковка у входа и следы
  ctx.save(); ctx.translate(x + W2 * 0.75, y - cs * 0.05); ctx.rotate(-0.5); D.poly([0, -cs * 0.05, cs * 0.32, 0, 0, cs * 0.05], '#ff8a3d', l * 0.6); D.poly([-cs * 0.02, 0, -cs * 0.12, -cs * 0.08, -cs * 0.1, cs * 0.02], '#4cc77d', l * 0.5); ctx.restore();
  ctx.fillStyle = 'rgba(90,110,170,0.35)'; for (var f = 0; f < 4; f++) { ctx.beginPath(); ctx.ellipse(x - W2 * 0.3 + f * cs * 0.28, y + cs * 0.22 + (f % 2) * cs * 0.08, cs * 0.04, cs * 0.06, 0, 0, 7); ctx.fill(); }
};

// ---------- на осыпи не построить ----------
var oCB = Z.canBuildAt;
Z.canBuildAt = function (c, r) { var M = mtn(); if (M && M.nb && M.nb[r * Z.G.L.W + c]) return false; return oCB.apply(this, arguments); };
Z.isLedge = function (c, r) { var M = mtn(); return !!(M && M.ledge && M.ledge[r * Z.G.L.W + c]); };

// ---------- лавина на «Перевале»: нажми на снежную шапку — снег сходит по спуску к ёлке ----------
var AVA_CD = 40;
function avaReady(G) { var M = G.L.mtn; return M && M.cap && G.phase !== 'build' && (G._avaCd || 0) <= 0; }
function avalancheGo(G) {
  var M = G.L.mtn, win = M.win, desc = win.slice(M.mid);
  G._avaCd = AVA_CD; G.shake = Math.max(G.shake || 0, 0.9); Z.AU.sfx('avalanche', 1); G.flash = Math.max(G.flash || 0, 0.15);
  desc.forEach(function (q, i) { setTimeout(function () { if (Z.G !== G) return; G.fx.push({ k: 'v_avalanche', x: q[0] + 0.5, y: q[1] + 0.5, t: 0, dur: 1.4 }); }, i * 90); });
  setTimeout(function () {
    if (Z.G !== G) return; var hit = 0;
    G.enemies.forEach(function (e) {
      if (e.dead || e.air || e.neutral) return;
      var ep = Z.enemyPos ? Z.enemyPos(e) : e, bj = -1, bd = 1.1; desc.forEach(function (q, j) { var d = Math.hypot(ep.x - q[0] - 0.5, ep.y - q[1] - 0.5); if (d < bd) { bd = d; bj = j; } });
      if (bj < 0) return; hit++;
      Z._.damage(e, e.boss ? e.max * 0.06 : e.max * 0.45 + 25, { pierceArmor: true });
      if (!e.dead && !e.boss) { var back = desc[Math.max(0, bj - 2)]; e.x = back[0] + 0.5; e.y = back[1] + 0.5; e.tc = null; e.stun = Math.max(e.stun || 0, 1.2); }
    });
    if (Z._.addText) Z._.addText(hit ? TT('Лавина! ×', 'Avalanche! ×') + hit : TT('Лавина!', 'Avalanche!'), desc[0][0] + 0.5, desc[0][1] - 0.6, '#bfe9ff', 1.6, 0.8);
  }, 450);
}
var oUpd2 = Z.update;
Z.update = function (dt) {
  oUpd2.apply(this, arguments);
  var G = Z.G; if (!G || !G.L || !G.L.mtn || !G.L.mtn.cap) return;
  if (G._avaCd === undefined) G._avaCd = 12;
  if (G.phase === 'wave' && G._avaCd > 0) G._avaCd -= dt;
};
var UI = Z.ui;
var oHook = UI.tapHook;
UI.tapHook = function (wx, wy, px, py) {
  var G = Z.G, M = G && G.L && G.L.mtn;
  if (M && M.cap && !UI.aim) {
    var cx = M.cap[0] + 0.5, cy = M.cap[1] + 0.6, lift = hAt(M, cx, cy) * K;
    if (Math.abs(wx - cx) < 0.9 && wy > cy - lift - 1.8 && wy < cy + 0.8) {
      if (avaReady(G)) { avalancheGo(G); return true; }
      if (G.phase === 'build') { G.banner = { text: TT('Лавина — в бою', 'Avalanche — during battle'), t: 1.6 }; return true; }
    }
  }
  return oHook ? oHook.apply(this, arguments) : false;
};
var oOver = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  if (oOver) oOver(ctx, X, Y, cs, t);
  var G = Z.G, M = G && G.L && G.L.mtn; if (!M || !M.cap) return;
  var cx = M.cap[0] + 0.5, cy = M.cap[1] + 0.6, top = Y(cy - hAt(M, cx, cy) * K) - cs * (1.05 + (M.E[M.cap[1]][M.cap[0]] - M.Hr) * 0.35) - cs * 0.35, x = X(cx), R = cs * 0.32; top = Math.max(top, Y(0) + R * 1.6);
  ctx.save();
  if (avaReady(G)) {
    var p = 0.5 + 0.5 * Math.sin(t * 5); ctx.globalAlpha = 0.35 + 0.35 * p; D.circ(x, top, R * (1.25 + p * 0.3), '#bfe9ff'); ctx.globalAlpha = 1;
    D.circ(x, top, R, '#ffffff', Math.max(1.5, cs * 0.05)); if (D.flake) D.flake(x, top, R * 0.62, '#4aa3ff', R * 0.14);
    D.text(TT('Лавина!', 'Avalanche!'), x, top - R * 1.7, D.fitText(TT('Лавина!', 'Avalanche!'), cs * 2, cs * 0.32), '#ffffff', 'center', 'middle', Math.max(2, cs * 0.06));
  } else if (G.phase !== 'build') {
    D.circ(x, top, R, 'rgba(255,255,255,0.55)', Math.max(1, cs * 0.04));
    var f = 1 - Math.max(0, G._avaCd || 0) / AVA_CD; ctx.strokeStyle = '#4aa3ff'; ctx.lineWidth = Math.max(2, cs * 0.07); ctx.beginPath(); ctx.arc(x, top, R * 0.8, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
};
})();
