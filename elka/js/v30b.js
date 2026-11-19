/* 2.11.5 · баррикады, звуки и анимации ловушек и вражеских построек, облики ловушек и баррикад в магазине.
   Баррикада нарисована заново, у неё шесть обликов (как у вышек): снежная стена с ледяными кольями, гора подарков,
   пряничный забор, хрустальные глыбы, брёвна в еловых ветках с гирляндой, царский частокол со щитом.
   Баррикада вырастает при постройке, трясётся и теряет щепки при ударах, трескается и кренится, когда почти сломана.
   У ловушек и вражеских построек свои звуки на каждое действие. Облики ловушек и баррикад продаются отдельно:
   вкладка «Ловушки» в магазине; «Как у вышек» — ловушка берёт облик ближайшей вышки, если он куплен для ловушки. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, OL = D.OL || '#1b2448', COL = D.COL;
function C() { return D.ctx; }
function TT(r, e) { return Z.LANG === 'en' ? e : r; }
function G2(c, x0, y0, x1, y1, a, b) { var g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function line(c, pts, col, w) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); }
var BULB = ['#ff5a5f', '#ffd54a', '#5ac8ff', '#9dff6a', '#ff8fd6'];
var IDS = ['gift', 'ginger', 'crystal', 'garland', 'royal'];
var ITEMS = ['spike', 'puddle', 'mine', 'snare', 'fw', 'lamp', 'barr'];
var PRICE = { barr: 40 }, PRICE_T = 30, PRICE_SET = 160;

// ---------- облики: что куплено и что выбрано ----------
function tpSk() { var sk = Z.save && Z.save.skins; if (!sk) return null; sk.tp = sk.tp || {}; sk.tpT = sk.tpT || {}; return sk; }
var autoSkin = Z.trapSkin || function () { return 'base'; };   // ближайшая вышка с обликом (v30a)
function skinFor(type, c, r) {
  var sk = tpSk(); if (!sk) return 'base';
  var sel = sk.tpT[type];
  if (sel && sel !== 'auto') return sel === 'base' || sk.tp[type + ':' + sel] ? sel : 'base';
  if (c == null || c < 0) return 'base';
  var id = autoSkin({ type: type, c: c, r: r });
  return id !== 'base' && sk.tp[type + ':' + id] ? id : 'base';
}
Z.trapSkin = function (tr) { return skinFor(tr.type, tr.c, tr.r); };
Z.barrSkin = function (b) { return b._skin || skinFor('barr', b.c, b.r); };
Z.trapSkinOwned = function (type, id) { var sk = tpSk(); return id === 'base' || !!(sk && sk.tp[type + ':' + id]); };
// «Стартовый набор»: «Царская» и для ловушек с баррикадой
function royalTraps() { var sk = tpSk(); if (!sk) return; ITEMS.forEach(function (t) { sk.tp[t + ':royal'] = 1; }); }
setInterval(function () { try { if (Z.save && Z.save.shop && Z.save.shop.starter) { var sk = tpSk(); if (sk && !sk.tp['spike:royal']) { royalTraps(); Z.persist && Z.persist(); } } } catch (e) { if (window.__rep) window.__rep(e); } }, 3000);
try { var PR = (Z.PRODUCTS || []).filter(function (p) { return p.id === 'starter'; })[0]; if (PR) { PR.dru = PR.dru.replace('«Царская» для всех вышек', '«Царская» для всех вышек, ловушек и баррикад'); PR.den = PR.den.replace('Royal look for all towers', 'Royal look for all towers, traps and barricades'); } } catch (e) { if (window.__rep) window.__rep(e); }

// ---------- клетка у края плато или стены: предмет не ложится на кромку ----------
function bottomLimit(c0, r0) {
  var Lg = Z.G && Z.G.L; if (!Lg || !Lg.hgt || c0 == null || c0 < 0) return null;
  var lvl = function (cc, rr) { return (Lg.hgt[rr] && Lg.hgt[rr][cc]) ? 1 : 0; }, me = lvl(c0, r0), lim = null;
  if (lvl(c0, r0 + 1) > me) lim = r0 + 1 - 0.32 - 0.04; else if (Lg.grid[r0 + 1] && Lg.grid[r0 + 1][c0] === 9) lim = r0 + 0.92;
  return lim === null ? null : Z.ui.Y(lim - (me ? 0.32 : 0));
}

// ---------- баррикада ----------
var BS = new WeakMap();
function bst(b) { var s = BS.get(b); if (!s) { s = { bt: Z.time, ch: [], lc: 0, lt: Z.time }; BS.set(b, s); } return s; }
function easeBack(p) { var s = 1.7; p -= 1; return 1 + p * p * ((s + 1) * p + s); }
function bowB(c, x, y, r, col) { D.ell(x - r * 0.62, y, r * 0.62, r * 0.4, col, Math.max(0.8, r * 0.2)); D.ell(x + r * 0.62, y, r * 0.62, r * 0.4, col, Math.max(0.8, r * 0.2)); D.circ(x, y, r * 0.3, col, Math.max(0.8, r * 0.2)); }
function crownMini(c, x, y, r) { D.poly([x - r, y, x - r, y - r * 0.7, x - r * 0.5, y - r * 0.3, x, y - r * 0.9, x + r * 0.5, y - r * 0.3, x + r, y - r * 0.7, x + r, y], '#ffd54a', Math.max(0.8, r * 0.15)); D.circ(x, y - r * 0.35, r * 0.18, '#b3203a'); }
function snowCap(c, x0, x1, y, r) { c.fillStyle = '#ffffff'; c.beginPath(); var n = Math.max(3, Math.round((x1 - x0) / (r * 1.3))); for (var i = 0; i <= n; i++) { var px = x0 + (x1 - x0) * i / n; c.moveTo(px + r, y); c.arc(px, y, r * (0.8 + 0.3 * ((i * 7) % 3) / 2), 0, Math.PI * 2); } c.fill(); }
var BARR = {};
BARR.base = function (c, x, gb, W, H, cs, l, t) {   // снежная стена из блоков, ледяные колья, снежная шапка
  [[-0.32, -0.3], [0, 0], [0.32, 0.3]].forEach(function (q) {
    c.save(); c.translate(x + q[0] * W, gb - H * 0.55); c.rotate(q[1]);
    D.poly([-cs * 0.055, 0, 0, -cs * 0.4, cs * 0.055, 0], G2(c, -cs * 0.05, 0, cs * 0.05, 0, '#ffffff', '#8fd0f0'), l * 0.7);
    line(c, [-cs * 0.012, -cs * 0.05, -cs * 0.004, -cs * 0.3], 'rgba(255,255,255,0.9)', Math.max(1, l * 0.5)); c.restore();
  });
  D.ell(x, gb - cs * 0.01, W * 0.54, cs * 0.05, '#f4f9ff', l * 0.5);
  var bh = H * 0.42, rows = [[gb - bh, [-1, 0, 1], W / 3], [gb - bh * 2 + cs * 0.01, [-0.5, 0.5], W * 0.37]];
  rows.forEach(function (rw) { rw[1].forEach(function (o) { var bw = rw[2], bx = x + o * bw - bw / 2 + cs * 0.012; D.rr(bx, rw[0], bw - cs * 0.024, bh, bh * 0.32); c.fillStyle = G2(c, 0, rw[0], 0, rw[0] + bh, '#ffffff', '#bcd6f2'); c.fill(); c.lineWidth = l * 0.8; c.strokeStyle = OL; c.stroke();
    line(c, [bx + bw * 0.18, rw[0] + bh * 0.28, bx + bw * 0.6, rw[0] + bh * 0.28], 'rgba(255,255,255,0.95)', Math.max(1, l * 0.6)); }); });
  snowCap(c, x - W * 0.34, x + W * 0.34, gb - bh * 2 + cs * 0.02, cs * 0.05);
};
BARR.gift = function (c, x, gb, W, H, cs, l, t) {   // гора подарков с лентами и леденцом
  function box(bx, by, bw, bh, col, rib, rot) { c.save(); c.translate(bx, by); c.rotate(rot || 0);
    D.rr(-bw / 2, -bh, bw, bh, cs * 0.03); c.fillStyle = G2(c, 0, -bh, 0, 0, col[0], col[1]); c.fill(); c.lineWidth = l * 0.8; c.strokeStyle = OL; c.stroke();
    c.fillStyle = rib; c.fillRect(-bw * 0.08, -bh, bw * 0.16, bh); c.fillRect(-bw / 2, -bh * 0.58, bw, bh * 0.16);
    c.strokeStyle = OL; c.lineWidth = l * 0.5; c.strokeRect(-bw * 0.08, -bh, bw * 0.16, bh);
    D.rr(-bw / 2 - cs * 0.012, -bh - cs * 0.035, bw + cs * 0.024, cs * 0.06, cs * 0.02); c.fillStyle = col[0]; c.fill(); c.lineWidth = l * 0.8; c.stroke(); c.restore(); }
  box(x - W * 0.24, gb, W * 0.46, H * 0.52, ['#ff6f6f', '#c22a36'], '#ffd54a');
  box(x + W * 0.25, gb, W * 0.44, H * 0.48, ['#5fcf86', '#2c8a52'], '#ffffff');
  box(x + W * 0.02, gb - H * 0.5, W * 0.4, H * 0.42, ['#6fd0ff', '#2a8bbd'], '#ffd54a', -0.07);
  bowB(c, x + W * 0.0, gb - H * 0.97, cs * 0.075, '#ffd54a');
  c.save(); c.translate(x + W * 0.47, gb); c.rotate(0.28);   // леденец-трость
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -H * 0.85); c.arc(-cs * 0.07, -H * 0.85, cs * 0.07, 0, Math.PI, true);
  c.lineCap = 'round'; c.strokeStyle = OL; c.lineWidth = cs * 0.075; c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = cs * 0.05; c.stroke();
  c.setLineDash([cs * 0.04, cs * 0.04]); c.strokeStyle = '#e8484f'; c.stroke(); c.setLineDash([]); c.restore();
  snowCap(c, x - W * 0.42, x - W * 0.08, gb - H * 0.55, cs * 0.035);
};
BARR.ginger = function (c, x, gb, W, H, cs, l, t) {   // пряничный забор с глазурью и мармеладками
  var n = 5, pw = W / n, GD = ['#e8484f', '#4cc77d', '#ffd54a', '#5ac8ff', '#ff8fd6'];
  for (var i = 0; i < n; i++) { var px = x - W / 2 + pw * (i + 0.5), h = H * (i % 2 ? 0.86 : 1), w = pw * 0.84;
    c.beginPath(); c.moveTo(px - w / 2, gb); c.lineTo(px - w / 2, gb - h + w / 2); c.arc(px, gb - h + w / 2, w / 2, Math.PI, 0); c.lineTo(px + w / 2, gb); c.closePath();
    c.fillStyle = G2(c, px - w / 2, 0, px + w / 2, 0, '#e2ad72', '#a86a34'); c.fill(); c.lineWidth = l * 0.8; c.strokeStyle = OL; c.stroke();
    c.beginPath(); for (var z = 0; z <= 8; z++) { var a = Math.PI + z / 8 * Math.PI, rr = w / 2 * 0.72 + (z % 2 ? cs * 0.014 : 0); c.lineTo(px + Math.cos(a) * rr, gb - h + w / 2 + Math.sin(a) * rr); } c.strokeStyle = '#fffaf2'; c.lineWidth = Math.max(1, l * 0.75); c.stroke();
    D.circ(px, gb - h + w * 0.2, cs * 0.026, GD[i], l * 0.4); }
  D.rr(x - W * 0.52, gb - H * 0.46, W * 1.04, H * 0.2, cs * 0.04); c.fillStyle = G2(c, 0, gb - H * 0.46, 0, gb - H * 0.26, '#d9995a', '#9a5e2c'); c.fill(); c.lineWidth = l * 0.8; c.strokeStyle = OL; c.stroke();
  for (var d = 0; d < 7; d++) D.circ(x - W * 0.42 + d * W * 0.14, gb - H * 0.36, cs * 0.014, '#fffaf2');
  snowCap(c, x - W * 0.45, x + W * 0.45, gb - H * 0.47, cs * 0.025);
};
BARR.crystal = function (c, x, gb, W, H, cs, l, t) {   // хрустальные глыбы с переливом
  var g = c.createRadialGradient(x, gb - H * 0.5, 0, x, gb - H * 0.5, W * 0.7), pu = 0.25 + 0.12 * Math.sin(t * 2.2 + x * 0.01); g.addColorStop(0, 'rgba(160,230,255,' + pu.toFixed(2) + ')'); g.addColorStop(1, 'rgba(160,230,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, gb - H * 0.5, W * 0.7, 0, 7); c.fill();
  [[-0.36, 0.66, -0.12], [0.36, 0.72, 0.14], [-0.17, 0.95, -0.05], [0.18, 1.05, 0.06], [0, 1.22, 0]].forEach(function (q, i) {
    var sx = x + q[0] * W, h = H * q[1], w = W * 0.13, lean = q[2] * cs;
    D.poly([sx - w, gb, sx - w * 0.85, gb - h * 0.72, sx + lean, gb - h, sx + w * 0.85, gb - h * 0.72, sx + w, gb], G2(c, sx - w, 0, sx + w, 0, '#ffffff', '#6fc6f0'), l * 0.8);
    line(c, [sx + lean, gb - h, sx + lean * 0.3, gb - h * 0.3, sx, gb], 'rgba(255,255,255,0.75)', Math.max(1, l * 0.5));
    D.poly([sx - w * 0.85, gb - h * 0.72, sx + lean, gb - h, sx - w * 0.1, gb - h * 0.62], 'rgba(255,255,255,0.55)');
    var sp = (Math.sin(t * 2.6 + i * 1.7) + 1) / 2; if (sp > 0.75) { c.globalAlpha = (sp - 0.75) * 4; D.star(sx + lean * 0.6, gb - h * 0.82, cs * 0.05, '#ffffff', 0); c.globalAlpha = 1; }
  });
  D.ell(x, gb, W * 0.56, cs * 0.06, '#ffffff', l * 0.6);
};
BARR.garland = function (c, x, gb, W, H, cs, l, t) {   // брёвна на козлах в еловых ветках и гирлянда
  [-0.4, 0.4].forEach(function (o) { var px = x + o * W; line(c, [px - cs * 0.1, gb, px + cs * 0.1, gb - H * 0.75], OL, l * 2.4); line(c, [px + cs * 0.1, gb, px - cs * 0.1, gb - H * 0.75], OL, l * 2.4);
    line(c, [px - cs * 0.1, gb, px + cs * 0.1, gb - H * 0.75], '#7a4a24', l * 1.3); line(c, [px + cs * 0.1, gb, px - cs * 0.1, gb - H * 0.75], '#7a4a24', l * 1.3); });
  function log(y, w, h) { D.rr(x - w / 2, y - h, w, h, h / 2); c.fillStyle = G2(c, 0, y - h, 0, y, '#b47a44', '#6e4423'); c.fill(); c.lineWidth = l * 0.8; c.strokeStyle = OL; c.stroke();
    line(c, [x - w * 0.35, y - h * 0.55, x + w * 0.1, y - h * 0.55], 'rgba(60,30,10,0.45)', Math.max(1, l * 0.5));
    D.ell(x + w / 2 - h / 2, y - h / 2, h * 0.36, h / 2 - l * 0.2, '#e2b47e', l * 0.6); c.beginPath(); c.ellipse(x + w / 2 - h / 2, y - h / 2, h * 0.18, h * 0.24, 0, 0, 7); c.strokeStyle = '#a8723f'; c.lineWidth = Math.max(1, l * 0.5); c.stroke(); }
  log(gb - H * 0.08, W * 0.98, H * 0.34); log(gb - H * 0.44, W * 0.86, H * 0.32);
  for (var i = 0; i < 9; i++) { var bx = x - W * 0.44 + i * W * 0.11, by = gb - H * 0.74 + Math.sin(i * 1.3) * cs * 0.012; D.ell(bx, by, cs * 0.075, cs * 0.04, i % 2 ? '#2c7a4b' : '#3c9a5f', l * 0.5); }
  snowCap(c, x - W * 0.4, x + W * 0.4, gb - H * 0.8, cs * 0.028);
  c.strokeStyle = '#2b3550'; c.lineWidth = Math.max(1, l * 0.45); c.beginPath(); var pts = [];
  for (var k = 0; k <= 6; k++) { var px = x - W * 0.45 + k * W * 0.15, py = gb - H * 0.5 + Math.sin(k / 6 * Math.PI) * cs * 0.07; pts.push([px, py]); if (k) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke();
  pts.forEach(function (p, k) { var on = (Math.floor(t * 3) + k) % 3 !== 0, col = BULB[k % 5]; if (on) { c.globalAlpha = 0.35; D.circ(p[0], p[1] + cs * 0.03, cs * 0.06, col); c.globalAlpha = 1; } D.ell(p[0], p[1] + cs * 0.03, cs * 0.022, cs * 0.03, on ? col : '#4a4f66', Math.max(0.7, l * 0.4)); });
};
BARR.royal = function (c, x, gb, W, H, cs, l, t) {   // царский частокол: красные колья с золотыми наконечниками и щит с короной
  var n = 5, pw = W / n;
  for (var i = 0; i < n; i++) { var px = x - W / 2 + pw * (i + 0.5), w = pw * 0.78, h = H * (0.88 + (i % 2) * 0.12);
    D.rr(px - w / 2, gb - h, w, h, cs * 0.02); c.fillStyle = G2(c, px - w / 2, 0, px + w / 2, 0, '#e2465c', '#8a1426'); c.fill(); c.lineWidth = l * 0.8; c.strokeStyle = OL; c.stroke();
    D.poly([px - w / 2 - cs * 0.01, gb - h, px, gb - h - cs * 0.13, px + w / 2 + cs * 0.01, gb - h], G2(c, px - w / 2, 0, px + w / 2, 0, '#fff1a8', '#c98a1c'), l * 0.7); }
  D.rr(x - W * 0.52, gb - H * 0.34, W * 1.04, H * 0.14, cs * 0.02); c.fillStyle = G2(c, 0, gb - H * 0.34, 0, gb - H * 0.2, '#ffe27a', '#b8860b'); c.fill(); c.lineWidth = l * 0.7; c.strokeStyle = OL; c.stroke();
  for (var r = 0; r < 6; r++) D.circ(x - W * 0.42 + r * W * 0.168, gb - H * 0.27, cs * 0.014, '#fff6c8');
  var sy = gb - H * 0.66, sw = cs * 0.2, gl = 0.5 + 0.5 * Math.sin(t * 2.5);
  var g = c.createRadialGradient(x, sy, 0, x, sy, cs * 0.4); g.addColorStop(0, 'rgba(255,214,90,' + (0.25 * gl + 0.1).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,214,90,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, sy, cs * 0.4, 0, 7); c.fill();
  c.beginPath(); c.moveTo(x - sw, sy - sw * 0.9); c.lineTo(x + sw, sy - sw * 0.9); c.lineTo(x + sw, sy); c.quadraticCurveTo(x + sw, sy + sw * 0.8, x, sy + sw * 1.15); c.quadraticCurveTo(x - sw, sy + sw * 0.8, x - sw, sy); c.closePath();
  c.fillStyle = G2(c, 0, sy - sw, 0, sy + sw, '#d2384f', '#7a1020'); c.fill(); c.lineWidth = l * 1.6; c.strokeStyle = '#ffd54a'; c.stroke(); c.lineWidth = l * 0.6; c.strokeStyle = OL; c.stroke();
  crownMini(c, x, sy + sw * 0.25, sw * 0.6);
};
var CHIP = { base: ['#ffffff', '#cfe6ff'], gift: ['#e8484f', '#ffd54a', '#4cc77d'], ginger: ['#c98a4e', '#fffaf2'], crystal: ['#dff8ff', '#9fe8ff'], garland: ['#7a4a24', '#3c9a5f'], royal: ['#ffd54a', '#c22a36'] };
var CRACK = [[-0.22, 0.25, 0.05, 0.55], [0.18, 0.3, 0.32, 0.7], [-0.05, 0.6, -0.3, 0.85], [0.3, 0.15, 0.12, 0.45]];
Z.drawBarr = function (b, x, y, cs, t, sid) {
  var c = C(), l = Math.max(1.2, cs * 0.04), id = sid || Z.barrSkin(b), f = BARR[id] || BARR.base, st = bst(b), k = b.max ? Math.max(0, Math.min(1, b.hp / b.max)) : 1;
  var gb = y - cs * 0.04, W = cs * 0.86, H = cs * 0.48;
  var lim = bottomLimit(b.c, b.r), dy = 0; if (lim !== null && gb + cs * 0.06 > lim) dy = Math.min(cs * 0.22, gb + cs * 0.06 - lim);
  gb -= dy;
  var dt = Math.min(0.1, Math.max(0, t - st.lt)); st.lt = t;
  if (b.hitT > 0 && t - st.lc > 0.14 && st.ch.length < 24) { st.lc = t; var cc = CHIP[id] || CHIP.base; for (var q = 0; q < 3; q++) st.ch.push({ x: (Math.random() - 0.5) * 0.7, y: -0.2 - Math.random() * 0.3, vx: (Math.random() - 0.5) * 2.2, vy: -1.2 - Math.random() * 1.4, life: 0.6 + Math.random() * 0.3, s: 0.025 + Math.random() * 0.025, col: cc[q % cc.length], rot: Math.random() * 6 }); }
  var pop = b.c != null && b.c >= 0 ? easeBack(Math.min(1, (t - st.bt) / 0.38)) : 1, sh = b.hitT > 0 ? Math.sin(t * 80) * cs * 0.03 : 0, tilt = k < 0.34 ? -0.05 : 0;
  D.ell(x, gb + cs * 0.02, W * 0.58, cs * 0.1, 'rgba(30,40,80,0.22)');
  c.save(); c.translate(x + sh, gb); c.rotate(tilt); c.scale(pop, pop); c.translate(-x, -gb);
  try { f(c, x, gb, W, H, cs, l, t); } catch (e) { if (window.__rep) window.__rep(e); }
  var nc = k < 0.34 ? 4 : k < 0.67 ? 2 : 0;   // трещины: чем меньше прочности, тем больше
  for (var i = 0; i < nc; i++) { var q2 = CRACK[i], x0 = x + q2[0] * W, y0 = gb - H * (1 - q2[1]), x1 = x + q2[2] * W, y1 = gb - H * (1 - q2[3]), mx = (x0 + x1) / 2 + cs * 0.04, my = (y0 + y1) / 2;
    line(c, [x0, y0, mx, my, x1, y1], 'rgba(27,36,72,0.75)', Math.max(1, l * 0.6)); line(c, [mx, my, mx + cs * 0.06, my - cs * 0.02], 'rgba(27,36,72,0.6)', Math.max(1, l * 0.45)); }
  c.restore();
  for (var j = st.ch.length - 1; j >= 0; j--) { var p = st.ch[j]; p.life -= dt; if (p.life <= 0) { st.ch.splice(j, 1); continue; } p.vy += 6 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 9; if (p.y > 0) { p.y = 0; p.vy *= -0.3; p.vx *= 0.6; }
    c.save(); c.globalAlpha = Math.min(1, p.life * 3); c.translate(x + p.x * cs, gb + p.y * cs); c.rotate(p.rot); c.fillStyle = p.col; c.fillRect(-p.s * cs, -p.s * cs * 0.6, p.s * cs * 2, p.s * cs * 1.2); c.strokeStyle = OL; c.lineWidth = 0.8; c.strokeRect(-p.s * cs, -p.s * cs * 0.6, p.s * cs * 2, p.s * cs * 1.2); c.restore(); }
  if (b.max && k < 1 && b.c != null && b.c >= 0) { var bw = cs * 0.7, by = gb - H - cs * 0.3; c.fillStyle = OL; c.fillRect(x - bw / 2 - 1, by - 1, bw + 2, cs * 0.08 + 2); c.fillStyle = k > 0.5 ? '#8fd0ff' : k > 0.25 ? '#ffd54a' : '#ff6b6b'; c.fillRect(x - bw / 2, by, bw * k, cs * 0.08); }
};

// ---------- ловушки: появление, залп петард, отклик ----------
var TS = new WeakMap();
var oTrap = D.trap;
D.trap = function (tr, x, y, cs, t) {
  var c = C(), real = tr.c != null && tr.c >= 0, s = TS.get(tr); if (!s && real) { s = { bt: t }; TS.set(tr, s); }
  var pop = real && s ? easeBack(Math.min(1, (t - s.bt) / 0.32)) : 1;
  if (pop < 1) { c.save(); c.translate(x, y + cs * 0.25); c.scale(pop, pop); c.translate(-x, -(y + cs * 0.25)); }
  oTrap.apply(this, arguments);
  if (pop < 1) c.restore();
  if (tr.type === 'fw' && tr.t > 0) {   // ракетка взлетает из ящика, за ней искры и дымок
    var p = 1 - tr.t / 0.4, rx = x + cs * 0.05 + Math.sin(p * 5) * cs * 0.04, ry = y - cs * 0.35 - p * cs * 1.3, l = Math.max(1, cs * 0.035);
    c.globalAlpha = 1 - p * 0.6; for (var i = 0; i < 5; i++) D.circ(rx - Math.sin(p * 5 - i * 0.3) * cs * 0.02, ry + cs * (0.08 + i * 0.06), cs * (0.03 - i * 0.004), ['#ffd54a', '#ff9a3d', '#ff6b6b', '#ffffff', '#ffd54a'][i]);
    c.globalAlpha = 1; D.rr(rx - cs * 0.03, ry - cs * 0.1, cs * 0.06, cs * 0.14, cs * 0.02); c.fillStyle = '#e8484f'; c.fill(); c.lineWidth = l * 0.7; c.strokeStyle = OL; c.stroke(); D.poly([rx - cs * 0.035, ry - cs * 0.1, rx, ry - cs * 0.16, rx + cs * 0.035, ry - cs * 0.1], '#ffffff', l * 0.5);
    c.globalAlpha = Math.max(0, 0.5 * (1 - p)); D.circ(x, y - cs * 0.3 - p * cs * 0.2, cs * (0.12 + p * 0.15), '#e8eef9'); c.globalAlpha = 1;
  }
};

// ---------- звуки ловушек, баррикад и вражеских построек ----------
function au() { return Z.AU && Z.AU.running && Z.AU.running() ? Z.AU : null; }
function has(n) { var A = Z.AU; return !!(A && A.bufs && (A.bufs[n] || A.bufs['sfx_' + n])); }
function play(n, x, y, v, o) { var A = au(); if (!A || !has(n)) return false; try { A.at(x, y); A.sfx(n, v, o || {}); } catch (e) { if (window.__rep) window.__rep(e); } return true; }
function skinChime(id, x, y) { if (id && id !== 'base' && has('t_' + id)) play('t_' + id, x, y, 0.13, { gap: 0.25, gapKey: 'tpskin', pitch: 1.1 + Math.random() * 0.1 }); }
var PT = {}, PB = {}, SS = new WeakMap(), ES = new WeakMap(), lastG = null, drumT = 0, totT = 0;
var FIRE = { snowtower: 'st_throw', catapult: 'st_catapult', workshop: 'st_saw', frostgun: 'st_frost' };
function nearTower(G, x, y, r) { for (var k in G.towers) { var t = G.towers[k]; if (Math.hypot(t.c + 0.5 - x, t.r + 0.5 - y) < r) return true; } return false; }
function sounds(G, dt) {
  if (G !== lastG) { lastG = G; PT = {}; PB = {}; for (var k0 in G.traps) PT[k0] = { type: G.traps[k0].type, t: G.traps[k0].t || 0 }; for (var b0 in G.barricades) PB[b0] = 1; return; }
  var k, tr, x, y;
  // лужа: враг ступил на лёд — поскользнулся (отклик ловушки и звук)
  for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (e.dead || e.air) continue; var ck = Z.cellKey(Math.floor(e.x), Math.floor(e.y)), es = ES.get(e); if (!es) { es = {}; ES.set(e, es); }
    if (es.ck !== ck) { es.ck = ck; tr = G.traps[ck]; if (tr && tr.type === 'puddle') { tr.t = Math.max(tr.t || 0, 0.35); } } }
  for (k in G.traps) { tr = G.traps[k]; x = tr.c + 0.5; y = tr.r + 0.5; var p = PT[k];
    if (!p) { PT[k] = { type: tr.type, t: tr.t || 0 }; play('tp_set', x, y, 0.5, { gap: 0.08 }); if (tr.type === 'lamp') play('tp_lamp', x, y, 0.45); continue; }
    if ((tr.t || 0) > p.t + 0.04) { var sid = Z.trapSkin(tr), n = { spike: 'tp_spike', snare: 'tp_snap', fw: 'tp_fw', puddle: 'tp_slip' }[tr.type];
      if (n) play(n, x, y, tr.type === 'spike' ? 0.35 : tr.type === 'puddle' ? 0.4 : 0.55, { gap: tr.type === 'spike' ? 0.22 : 0.3, gapKey: tr.type === 'spike' ? '' : k, pitch: 0.94 + Math.random() * 0.12 }); skinChime(sid, x, y); }
    p.t = tr.t || 0; }
  for (k in PT) if (!G.traps[k]) { var q = PT[k]; delete PT[k]; if (q.type === 'mine') { var r0 = Math.floor(+k / G.L.W), c0 = +k - r0 * G.L.W; play('tp_mine', c0 + 0.5, r0 + 0.5, 0.75); } }
  for (k in G.barricades) { var b = G.barricades[k]; x = b.c + 0.5; y = b.r + 0.5;
    if (!PB[k]) { PB[k] = 1; play('bar_build', x, y, 0.6); continue; }
    if (b.hitT > 0) play('bar_hit', x, y, 0.4, { gap: 0.42, gapKey: k, pitch: 0.9 + Math.random() * 0.2 }); }
  for (k in PB) if (!G.barricades[k]) { delete PB[k]; var r1 = Math.floor(+k / G.L.W), c1 = +k - r1 * G.L.W; play('bar_break', c1 + 0.5, r1 + 0.5, 0.75); }
  // вражеские постройки: выстрел — по сбросу таймера, замах катапульты, барабан и тотем, рог дозорной вышки
  drumT -= dt; totT -= dt;
  (G.structs || []).forEach(function (s) {
    var ss = SS.get(s); if (!ss) { ss = { cd: s.cd || 0, done: s.done }; SS.set(s, ss); return; }
    x = s.c + 0.5; y = s.r + 0.5;
    if (s.done && !ss.done && !s.dead) { if (s.type === 'watch') play('st_horn', x, y, 0.45); }
    ss.done = s.done;
    if (!s.done || s.dead || s.sleep > 0) { ss.cd = s.cd || 0; return; }
    var cd = s.cd || 0;
    if (cd > ss.cd + 0.5) {
      var hit = s.type === 'snowtower' ? (nearTower(G, x, y, 3) || (G.squad || []).some(function (U) { return !U.dead && Math.hypot(U.x - x, U.y - y) < 3; })) : s.type === 'catapult' ? nearTower(G, x, y, 6) : s.type === 'frostgun' ? nearTower(G, x, y, 3) : s.type === 'workshop';
      if (hit && FIRE[s.type]) play(FIRE[s.type], x, y, s.type === 'catapult' ? 0.6 : 0.45, { pitch: 0.92 + Math.random() * 0.16 });
      if (s.type === 'lodge' && (G.fx || []).some(function (f) { return f.k === 'v_ghost' && f.t < 0.1; })) play('st_lodge', x, y, 0.45);
    } else if (s.type === 'catapult' && ss.cd >= 1.1 && cd < 1.1 && nearTower(G, x, y, 6)) play('st_crank', x, y, 0.4);
    ss.cd = cd;
    var busy = G.enemies.some(function (e) { return !e.dead && Math.hypot(e.x - x, e.y - y) < 3; });
    if (s.type === 'drum' && busy && drumT <= 0) { drumT = 4.6; play('st_drum', x, y, 0.28); }
    if (s.type === 'totem' && totT <= 0 && G.enemies.some(function (e) { return !e.dead && !e.boss && e.hp < e.max && Math.hypot(e.x - x, e.y - y) < 2; })) { totT = 4; play('st_totem', x, y, 0.3); }
  });
}
var oU = Z.update;
Z.update = function (dt) { oU.apply(this, arguments); var G = Z.G; if (!G || !G.traps) return; try { sounds(G, dt); } catch (e) { if (window.__rep) window.__rep(e); } };

// ---------- магазин: вкладка «Ловушки» ----------
var TNAME = { gift: ['Подарок', 'Gift box'], ginger: ['Пряник', 'Gingerbread'], crystal: ['Кристалл', 'Crystal'], garland: ['Ёлочка', 'Fir tree'], royal: ['Царская', 'Royal'] };
function nm(id) { return id === 'auto' ? TT('Как вышки', 'Auto') : id === 'base' ? TT('Обычный', 'Classic') : TNAME[id][Z.LANG === 'en' ? 1 : 0]; }
function itemName(it) { return it === 'barr' ? Z.T('barricade') : Z.T('tr_' + it); }
function price(it) { return PRICE[it] || PRICE_T; }
var FAKE = {};
function fakeTr(it, id, t, cyc) { var f = FAKE[it + id] || (FAKE[it + id] = { type: it, c: -9, r: -9, uses: (Z.TRAPS[it] || {}).uses, cd: 0 }); f._skin = id; var ph = cyc ? t % 2.4 : 9; f.t = ph < 0.4 ? 0.4 - ph : 0; return f; }
function drawItem(it, id, x, y, cs, t, cyc) {
  if (it === 'barr') { var fb = FAKE['b' + id] || (FAKE['b' + id] = { c: -9, r: -9, hp: 1, max: 1, hitT: 0 }); fb.hitT = cyc && (t % 2.4) < 0.25 ? 0.1 : 0; Z.drawBarr(fb, x, y + cs * 0.3, cs, t, id); }
  else D.trap(fakeTr(it, id, t, cyc), x, y, cs, t);
}
Z.tabTraps = function (m, f, a, top, bot) {
  var S = a.S, w = f.w, ctx = a.ctx, sk = tpSk(), t = Z.time; if (!sk) return;
  m.psel = m.psel || 'spike'; var it = m.psel;
  var cw = (w - 28 * S - (ITEMS.length - 1) * 4 * S) / ITEMS.length, chh = Math.min(cw * 0.95, 52 * S);
  ITEMS.forEach(function (ty, i) {
    a.button('tp_' + ty, f.x + 14 * S + i * (cw + 4 * S), top, cw, chh, { modal: true, r: 8 * S, c1: it === ty ? '#4cc77d' : '#fdf7ec', c2: it === ty ? COL.greenD : COL.panelD, fn: function () { m.psel = ty; m.ptry = null; },
      draw: function (bx, by, bw, bh) { ctx.save(); ctx.beginPath(); ctx.rect(bx + 2, by + 2, bw - 4, bh - 4); ctx.clip(); var sid = sk.tpT[ty] && sk.tpT[ty] !== 'auto' && Z.trapSkinOwned(ty, sk.tpT[ty]) ? sk.tpT[ty] : 'base'; drawItem(ty, sid, bx + bw / 2, by + bh * (ty === 'barr' ? 0.66 : ty === 'lamp' ? 0.72 : 0.5), bh * (ty === 'barr' ? 0.9 : ty === 'lamp' ? 0.95 : 1.2), t, false); ctx.restore(); } });
  });
  var py = top + chh + 8 * S, ph = Math.min((innerHeight > innerWidth ? 300 : 160) * S, (bot - py) * (innerHeight > innerWidth ? 0.56 : 0.48));
  var sel = sk.tpT[it] || 'auto', tr = m.ptry && m.ptry.it === it ? m.ptry.id : null, show = tr || (sel === 'auto' ? null : sel);
  D.rr(f.x + 14 * S, py, w - 28 * S, ph, 14 * S); ctx.fillStyle = '#20305e'; ctx.fill();
  ctx.save(); D.rr(f.x + 14 * S, py, w - 28 * S, ph, 14 * S); ctx.clip(); ctx.fillStyle = '#eef4ff'; ctx.fillRect(f.x, py + ph * 0.7, w, ph);
  ctx.fillStyle = '#d9cdb8'; ctx.fillRect(f.x, py + ph * 0.7, w, ph * 0.04);
  var pcs = Math.min(ph * (it === 'barr' ? 0.85 : it === 'lamp' ? 0.68 : 0.82), 230 * S), pyc = py + ph * (it === 'lamp' ? 0.66 : it === 'barr' ? 0.6 : 0.6);
  if (show) drawItem(it, show, f.x + w / 2, pyc, pcs, t, true);
  else { var own = IDS.filter(function (id) { return sk.tp[it + ':' + id]; }), ids = ['base'].concat(own), idx = Math.floor(t / 1.6) % ids.length;
    drawItem(it, ids[idx], f.x + w / 2, pyc, pcs, t, true);
    D.text(own.length ? TT('Облик ближайшей вышки', 'Nearest tower\'s look') : TT('Купите облик — и ловушка будет как вышка рядом', 'Buy a look — the trap will match the tower nearby'), f.x + w / 2, py + ph - 14 * S, D.fitText(TT('Купите облик — и ловушка будет как вышка рядом', 'Buy a look — the trap will match the tower nearby'), w - 60 * S, 11.5 * S), '#5a6b8f'); }
  if (tr) { D.rr(f.x + 22 * S, py + 8 * S, 96 * S, 22 * S, 8 * S); ctx.fillStyle = 'rgba(255,213,74,0.95)'; ctx.fill(); D.text(TT('Примерка', 'Preview'), f.x + 70 * S, py + 19 * S, 12 * S, OL); }
  D.text(itemName(it), f.x + w - 26 * S, py + 19 * S, D.fitText(itemName(it), w * 0.5, 14 * S), '#ffffff', 'right', 'middle', 0);
  ctx.restore();
  if (tr) {
    var spc = tr === 'royal', pr = price(it), bww = Math.min(w - 40 * S, 300 * S), missing = IDS.indexOf(tr) >= 0 ? ITEMS.filter(function (q) { return !sk.tp[q + ':' + tr]; }).length : 0;
    var buyOne = function () { if (Z.save.flakes < pr) { Z.AU.sfx('error'); Z.needFlakes(pr); return; } Z.save.flakes -= pr; sk.tp[it + ':' + tr] = 1; sk.tpT[it] = tr; m.ptry = null; Z.AU.sfx('levelup'); UI.toast(TT('Новый облик: ', 'New look: ') + nm(tr), '#9dff6a'); Z.persist(true); };
    var buySet = function () { if (Z.save.flakes < PRICE_SET) { Z.AU.sfx('error'); Z.needFlakes(PRICE_SET); return; } Z.save.flakes -= PRICE_SET; ITEMS.forEach(function (q) { sk.tp[q + ':' + tr] = 1; sk.tpT[q] = tr; }); m.ptry = null; Z.AU.sfx('levelup'); UI.toast(TT('«' + nm(tr) + '» — для всех ловушек и баррикады', '"' + nm(tr) + '" for all traps and the barricade'), '#9dff6a'); Z.persist(true); };
    if (spc) a.button('tpbuy', f.x + (w - bww) / 2, py + ph + 4 * S, bww, 28 * S, { modal: true, r: 9 * S, c1: '#ffd54a', c2: COL.goldD, pulse: true, fn: function () { Z.openOffer(); },
      draw: function (bx, by, bw2, bh2) { var bl = TT('«Царская» — в «Стартовом наборе»', '"Royal" — in the Starter pack'); D.text(bl, bx + bw2 / 2, by + bh2 / 2, D.fitText(bl, bw2 - 16 * S, 13 * S), '#fff', 'center', 'middle', 2.5 * S); } });
    else {
      var two = missing > 2, gap = 6 * S, b1 = two ? (bww - gap) * 0.48 : bww, b2 = bww - b1 - gap, bx0 = f.x + (w - bww) / 2;
      var lb1 = TT('Купить за ', 'Buy for ') + pr;
      a.button('tpbuy', bx0, py + ph + 4 * S, b1, 28 * S, { modal: true, r: 9 * S, c1: '#3fb6e6', c2: '#2a8bbd', pulse: !two, fn: buyOne,
        draw: function (bx, by, bw2, bh2) { var fs = D.fitText(lb1, bw2 - 30 * S, 13 * S); D.text(lb1, bx + bw2 / 2 - 8 * S, by + bh2 / 2, fs, '#fff', 'center', 'middle', 2.5 * S); D.flakeIcon(bx + bw2 / 2 + D.mw(lb1, fs) / 2 + 1 * S, by + bh2 / 2, 6 * S); } });
      if (two) { var lb2 = TT('Всем ловушкам за ', 'All traps for ') + PRICE_SET;
        a.button('tpset', bx0 + b1 + gap, py + ph + 4 * S, b2, 28 * S, { modal: true, r: 9 * S, c1: '#ffd54a', c2: COL.goldD, pulse: true, fn: buySet,
          draw: function (bx, by, bw2, bh2) { var fs = D.fitText(lb2, bw2 - 30 * S, 13 * S); D.text(lb2, bx + bw2 / 2 - 8 * S, by + bh2 / 2, fs, '#fff', 'center', 'middle', 2.5 * S); D.flakeIcon(bx + bw2 / 2 + D.mw(lb2, fs) / 2 + 1 * S, by + bh2 / 2, 6 * S); } }); }
    }
  }
  var opts = ['auto', 'base'].concat(IDS), cols = opts.length, sw = (w - 28 * S - (cols - 1) * 5 * S) / cols, sy = py + ph + 40 * S, sh = Math.min(118 * S, bot - sy - 26 * S);
  opts.forEach(function (id, i) {
    var own = id === 'auto' || id === 'base' || !!sk.tp[it + ':' + id], on = sel === id, tryOn = tr === id;
    a.button('tpo_' + id, f.x + 14 * S + i * (sw + 5 * S), sy, sw, sh, { modal: true, r: 10 * S, c1: on ? '#4cc77d' : tryOn ? '#ffe9a8' : '#fdf7ec', c2: on ? COL.greenD : tryOn ? COL.goldD : COL.panelD,
      fn: function () { Z.AU.sfx('select'); if (own) { if (id === 'auto') delete sk.tpT[it]; else sk.tpT[it] = id; m.ptry = null; Z.persist(); } else m.ptry = { it: it, id: id }; },
      draw: function (bx, by, bw, bh) {
        ctx.save(); ctx.beginPath(); ctx.rect(bx + 2, by + 2, bw - 4, bh - 24 * S); ctx.clip();
        var ic = Math.min(bw * 0.95, (bh - 26 * S) * 0.95);
        if (id === 'auto') { D.tower({ type: 'snow', lvl: 1, ang: -0.6, recoil: 0, spin: 0, pop: 0, stun: 0 }, bx + bw * 0.38, by + bh - 28 * S, ic * 0.85, t); D.text('↔', bx + bw * 0.76, by + (bh - 24 * S) * 0.5, 14 * S, OL); }
        else drawItem(it, id, bx + bw / 2, by + (bh - 24 * S) * (it === 'barr' ? 0.62 : it === 'lamp' ? 0.7 : 0.55), ic * (it === 'barr' ? 0.8 : it === 'lamp' ? 0.85 : 1.1), t, false);
        ctx.restore();
        var lab = (on ? '✓ ' : '') + nm(id);
        if (own) D.text(lab, bx + bw / 2, by + bh - 11 * S, Math.max(7.5, D.fitText(lab, bw - 4 * S, 11.5 * S)), on ? '#fff' : OL, 'center', 'middle', on ? 2 * S : 0);
        else if (id === 'royal') D.text(TT('набор', 'pack'), bx + bw / 2, by + bh - 11 * S, 11.5 * S, OL);
        else { D.flakeIcon(bx + bw / 2 - 9 * S, by + bh - 11 * S, 6 * S); D.text('' + price(it), bx + bw / 2 - 1 * S, by + bh - 10 * S, 12 * S, OL, 'left'); }
      } });
  });
  var fy = sy + sh + 14 * S, ft = TT('«Как вышки» — ловушка берёт облик ближайшей вышки, если он куплен для этой ловушки', '"Auto" — the trap takes the nearest tower\'s look if you own it for this trap');
  if (bot - fy > 8 * S) D.text(ft, f.x + w / 2, fy, D.fitText(ft, w - 36 * S, 11 * S), '#5a6b8f');
};
})();
