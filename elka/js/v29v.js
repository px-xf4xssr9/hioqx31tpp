/* 2.11.5 · ориентиры карт заново — у каждой карты свой узнаваемый объект, без повторов и «простых фигур».
   Рисуются в той же клетке 2×2 (баланс и нажатия не меняются); база — центр-низ клетки, масштаб cs. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = D.OL || '#1b2448', TT = Z.TT || function (r, e) { return Z.LANG === 'en' ? e : r; };
function C() { return D.ctx; }
function G2(x0, y0, x1, y1, a, b) { var g = C().createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function P(pts, fill, l) { D.poly(pts, fill, l); }
function E(x, y, rx, ry, fill, l) { D.ell(x, y, rx, ry, fill, l); }
function O(x, y, r, fill, l) { D.circ(x, y, r, fill, l); }
function R(x, y, w, h, r, fill, l) { var c = C(); D.rr(x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } if (l) { c.lineWidth = l; c.strokeStyle = OL; c.stroke(); } }
function line(pts, col, w) { var c = C(); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); }
function snowCap(x0, y0, x1, y1, h) { var c = C(); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - h, x1, y1); c.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) + h * 0.3, x0, y0); c.fill(); }
function smoke(x, y, s, t) { var c = C(); for (var i = 0; i < 4; i++) { var q = (t * 0.35 + i / 4) % 1; c.globalAlpha = 0.45 * (1 - q); O(x + Math.sin(q * 5 + i) * s * 0.4, y - q * s * 2.4, s * (0.18 + q * 0.3), '#e8eef8'); } c.globalAlpha = 1; }
function plankWall(x, y, w, h, col, l) { var c = C(); R(x, y, w, h, l, col, l); c.strokeStyle = 'rgba(60,35,15,0.35)'; c.lineWidth = Math.max(1, l * 0.5); c.beginPath(); for (var i = 1; i < 5; i++) { c.moveTo(x + 2, y + h * i / 5); c.lineTo(x + w - 2, y + h * i / 5); } c.stroke(); }
function logHouse(x, y, w, h, cs, l, roofCol) {   // избушка из брёвен
  var c = C();
  for (var i = 0; i < 4; i++) { R(x - w / 2, y - h + i * h / 4, w, h / 4, h / 8, i % 2 ? '#9a6a3a' : '#a8784a', l * 0.7); O(x - w / 2 + h / 12, y - h + i * h / 4 + h / 8, h / 12, '#e0b88a', l * 0.4); O(x + w / 2 - h / 12, y - h + i * h / 4 + h / 8, h / 12, '#e0b88a', l * 0.4); }
  P([x - w * 0.62, y - h, x, y - h - h * 0.75, x + w * 0.62, y - h], roofCol || '#7a4a2a', l);
  snowCap(x - w * 0.62, y - h, x + w * 0.62, y - h, h * 0.75);
  R(x - w * 0.12, y - h * 0.62, w * 0.24, h * 0.3, l, '#ffe08a', l * 0.7); line([x, y - h * 0.62, x, y - h * 0.32], OL, l * 0.5);
}
function firs(x, y, cs, n, seed) { for (var i = 0; i < n; i++) { var k = Math.sin(seed + i * 12.9) * 43758.5453; k = k - Math.floor(k); D.pine(x + (i - (n - 1) / 2) * cs * 0.35, y + (i % 2) * cs * 0.06, cs * (0.55 + k * 0.3), '#2a6a52'); } }
function rock(x, y, w, h, l, col) { P([x - w / 2, y, x - w * 0.42, y - h * 0.62, x - w * 0.12, y - h, x + w * 0.22, y - h * 0.86, x + w / 2, y - h * 0.3, x + w / 2, y], col || '#8a86a2', l); P([x + w * 0.05, y, x + w * 0.12, y - h * 0.6, x + w / 2, y - h * 0.3, x + w / 2, y], 'rgba(40,36,70,0.25)'); }

var DRAW = {};
// ---------- лес ----------
DRAW.mill = function (x, y, cs, t, l) {   // водяная мельница у ручья, колесо вмёрзло и чуть поскрипывает
  var c = C();
  E(x - cs * 0.46, y - cs * 0.04, cs * 0.42, cs * 0.12, '#b8e4f7', l * 0.6);
  logHouse(x + cs * 0.3, y, cs * 0.9, cs * 0.95, cs, l, '#6a3a2a');
  smoke(x + cs * 0.52, y - cs * 1.95, cs * 0.3, t);
  R(x + cs * 0.45, y - cs * 1.9, cs * 0.15, cs * 0.35, cs * 0.03, '#8a7a7a', l * 0.6);
  var wx = x - cs * 0.45, wy = y - cs * 0.5, wr = cs * 0.42, a = Math.sin(t * 0.7) * 0.08;
  c.save(); c.translate(wx, wy); c.rotate(a);
  O(0, 0, wr, null, l * 1.6); c.strokeStyle = '#8a5a35'; c.lineWidth = l * 0.9; c.stroke();
  O(0, 0, wr * 0.72, null, l); c.stroke();
  for (var i = 0; i < 8; i++) { c.rotate(Math.PI / 4); line([0, 0, 0, -wr], '#6a4628', l * 0.9); R(-cs * 0.07, -wr - cs * 0.05, cs * 0.14, cs * 0.12, cs * 0.02, '#a8784a', l * 0.5); }
  O(0, 0, cs * 0.09, '#5a6078', l * 0.6);
  c.restore();
  for (var ic = 0; ic < 5; ic++) P([wx - wr * 0.6 + ic * wr * 0.3, wy + wr * 0.75 - Math.abs(ic - 2) * cs * 0.05, wx - wr * 0.55 + ic * wr * 0.3, wy + wr * 1.0, wx - wr * 0.5 + ic * wr * 0.3, wy + wr * 0.75 - Math.abs(ic - 2) * cs * 0.05], '#dff6ff', l * 0.4);
  R(x - cs * 0.1, y - cs * 1.08, cs * 0.45, cs * 0.1, cs * 0.04, '#9a6a3a', l * 0.7);
};
DRAW.eyetrees = function (x, y, cs, t, l) {   // корявые старые деревья Лешего, в дуплах моргают глаза
  var c = C();
  [[-0.65, 1.0, 0], [0.05, 1.25, 1], [0.7, 0.95, 2]].forEach(function (q) {
    var tx = x + q[0] * cs, th = q[1] * cs * 1.6, sw = Math.sin(t * 0.8 + q[2]) * cs * 0.03;
    c.beginPath(); c.moveTo(tx - cs * 0.24, y); c.quadraticCurveTo(tx - cs * 0.08, y - th * 0.4, tx - cs * 0.14 + sw, y - th); c.lineTo(tx + cs * 0.12 + sw, y - th); c.quadraticCurveTo(tx + cs * 0.06, y - th * 0.45, tx + cs * 0.26, y); c.closePath();
    c.fillStyle = G2(tx - cs * 0.2, 0, tx + cs * 0.2, 0, '#7a5a3a', '#4a3020'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
    line([tx - cs * 0.05, y - th * 0.2, tx - cs * 0.1, y - th * 0.55], 'rgba(30,20,10,0.45)', l * 0.5);
    line([tx - cs * 0.1 + sw, y - th * 0.85, tx - cs * 0.42 + sw, y - th * 1.05, tx - cs * 0.5 + sw, y - th * 1.2], OL, l * 2.2); line([tx - cs * 0.1 + sw, y - th * 0.85, tx - cs * 0.42 + sw, y - th * 1.05, tx - cs * 0.5 + sw, y - th * 1.2], '#5a4028', l * 1.1);
    line([tx + cs * 0.08 + sw, y - th * 0.9, tx + cs * 0.35 + sw, y - th * 1.1, tx + cs * 0.38 + sw, y - th * 1.25], OL, l * 2); line([tx + cs * 0.08 + sw, y - th * 0.9, tx + cs * 0.35 + sw, y - th * 1.1, tx + cs * 0.38 + sw, y - th * 1.25], '#5a4028', l);
    E(tx - cs * 0.01 + sw, y - th + cs * 0.02, cs * 0.24, cs * 0.08, '#ffffff');
    E(tx - cs * 0.15 + sw * 0.5, y - th * 1.12, cs * 0.12, cs * 0.06, '#6a9a4a', l * 0.4);   // мох
    // дупло с глазами
    var hy = y - th * 0.55; E(tx, hy, cs * 0.14, cs * 0.18, '#1a1008', l * 0.6);
    var bl = ((t * 0.7 + q[2] * 1.3) % 3.3) < 0.15, glow = 0.7 + 0.3 * Math.sin(t * 3 + q[2]);
    if (!bl) { c.globalAlpha = glow; O(tx - cs * 0.05, hy - cs * 0.02, cs * 0.04, '#ffe066'); O(tx + cs * 0.05, hy - cs * 0.02, cs * 0.04, '#ffe066'); c.globalAlpha = 1; O(tx - cs * 0.045, hy - cs * 0.02, cs * 0.015, OL); O(tx + cs * 0.055, hy - cs * 0.02, cs * 0.015, OL); }
  });
  for (var m = 0; m < 4; m++) { E(x - cs * 0.9 + m * cs * 0.6, y + cs * 0.03, cs * 0.18, cs * 0.06, '#5a8a4a'); }
};
// ---------- деревня ----------
DRAW.windmill = function (x, y, cs, t, l) {   // ветряная мельница: каменный фундамент, дощатая башня, крыша-шапка, решётчатые крылья
  var c = C();
  R(x - cs * 0.55, y - cs * 0.3, cs * 1.1, cs * 0.3, cs * 0.06, '#9a98ac', l);
  for (var s = 0; s < 4; s++) E(x - cs * 0.4 + s * cs * 0.27, y - cs * 0.15, cs * 0.1, cs * 0.07, 'rgba(255,255,255,0.35)');
  P([x - cs * 0.48, y - cs * 0.3, x - cs * 0.32, y - cs * 1.55, x + cs * 0.32, y - cs * 1.55, x + cs * 0.48, y - cs * 0.3], G2(x - cs * 0.5, 0, x + cs * 0.5, 0, '#d8b080', '#9a6a3a'), l);
  c.strokeStyle = 'rgba(80,50,25,0.4)'; c.lineWidth = Math.max(1, l * 0.5); c.beginPath(); for (var p = 1; p < 6; p++) { var py = y - cs * 0.3 - p * cs * 0.21, hw = cs * (0.48 - p * 0.027); c.moveTo(x - hw, py); c.lineTo(x + hw, py); } c.stroke();
  R(x - cs * 0.12, y - cs * 0.62, cs * 0.24, cs * 0.32, cs * 0.1, '#6a3a1e', l * 0.7); R(x - cs * 0.1, y - cs * 1.2, cs * 0.2, cs * 0.18, cs * 0.04, '#ffe08a', l * 0.6);
  c.beginPath(); c.moveTo(x - cs * 0.42, y - cs * 1.55); c.quadraticCurveTo(x, y - cs * 2.15, x + cs * 0.42, y - cs * 1.55); c.closePath(); c.fillStyle = G2(0, y - cs * 2.1, 0, y - cs * 1.55, '#c0503a', '#7a2a1e'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  snowCap(x - cs * 0.4, y - cs * 1.6, x + cs * 0.4, y - cs * 1.6, cs * 0.45);
  c.save(); c.translate(x, y - cs * 1.62); c.rotate(t * 1.1);
  for (var i = 0; i < 4; i++) { c.rotate(Math.PI / 2); line([0, 0, 0, -cs * 1.15], OL, l * 1.8); line([0, 0, 0, -cs * 1.15], '#8a5a35', l * 0.9);
    R(cs * 0.02, -cs * 1.12, cs * 0.24, cs * 0.85, cs * 0.02, 'rgba(242,230,208,0.92)', l * 0.6);
    c.strokeStyle = 'rgba(120,90,50,0.6)'; c.lineWidth = Math.max(1, l * 0.4); c.beginPath(); for (var g = 1; g < 6; g++) { c.moveTo(cs * 0.02, -cs * 1.12 + g * cs * 0.15); c.lineTo(cs * 0.26, -cs * 1.12 + g * cs * 0.15); } c.moveTo(cs * 0.14, -cs * 1.12); c.lineTo(cs * 0.14, -cs * 0.27); c.stroke(); }
  O(0, 0, cs * 0.09, '#5a6078', l * 0.7);
  c.restore();
};
DRAW.bridges = function (x, y, cs, t, l) {   // деревенская церквушка с золотой луковкой и колоколом
  var c = C();
  R(x - cs * 0.62, y - cs * 0.95, cs * 1.24, cs * 0.95, cs * 0.06, G2(x - cs * 0.6, 0, x + cs * 0.6, 0, '#fff8ec', '#e0d4c0'), l);
  P([x - cs * 0.75, y - cs * 0.95, x - cs * 0.3, y - cs * 1.35, x + cs * 0.3, y - cs * 1.35, x + cs * 0.75, y - cs * 0.95], '#3f6f9a', l); snowCap(x - cs * 0.75, y - cs * 0.95, x + cs * 0.75, y - cs * 0.95, cs * 0.3);
  c.beginPath(); c.arc(x, y - cs * 0.4, cs * 0.17, Math.PI, 0); c.lineTo(x + cs * 0.17, y); c.lineTo(x - cs * 0.17, y); c.closePath(); c.fillStyle = '#6a3a1e'; c.fill(); c.lineWidth = l * 0.7; c.strokeStyle = OL; c.stroke();
  [-0.4, 0.4].forEach(function (d) { c.beginPath(); c.arc(x + d * cs, y - cs * 0.62, cs * 0.08, Math.PI, 0); c.lineTo(x + d * cs + cs * 0.08, y - cs * 0.45); c.lineTo(x + d * cs - cs * 0.08, y - cs * 0.45); c.closePath(); c.fillStyle = '#ffe08a'; c.fill(); c.stroke(); });
  R(x - cs * 0.22, y - cs * 1.95, cs * 0.44, cs * 0.65, cs * 0.04, '#fff8ec', l);
  c.beginPath(); c.arc(x, y - cs * 1.6, cs * 0.1, Math.PI, 0); c.lineTo(x + cs * 0.1, y - cs * 1.45); c.lineTo(x - cs * 0.1, y - cs * 1.45); c.closePath(); c.fillStyle = '#2a3460'; c.fill(); c.stroke();
  var sw = Math.sin(t * 2.2) * 0.35; c.save(); c.translate(x, y - cs * 1.68); c.rotate(sw); P([-cs * 0.06, cs * 0.12, -cs * 0.04, 0, cs * 0.04, 0, cs * 0.06, cs * 0.12], '#ffd54a', l * 0.5); c.restore();
  c.beginPath(); c.moveTo(x - cs * 0.24, y - cs * 1.95); c.bezierCurveTo(x - cs * 0.34, y - cs * 2.2, x - cs * 0.06, y - cs * 2.3, x, y - cs * 2.5); c.bezierCurveTo(x + cs * 0.06, y - cs * 2.3, x + cs * 0.34, y - cs * 2.2, x + cs * 0.24, y - cs * 1.95); c.closePath();
  c.fillStyle = G2(x - cs * 0.3, 0, x + cs * 0.3, 0, '#ffe58a', '#c99520'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  c.globalAlpha = 0.6; E(x - cs * 0.1, y - cs * 2.2, cs * 0.05, cs * 0.1, '#ffffff'); c.globalAlpha = 1;
  line([x, y - cs * 2.5, x, y - cs * 2.75], '#c99520', l * 1.2); line([x - cs * 0.08, y - cs * 2.66, x + cs * 0.08, y - cs * 2.66], '#c99520', l * 1.2);
};
DRAW.scarecrow = function (x, y, cs, t, l) {   // пугало в шляпе и заплатанном кафтане, на руке ворона
  var c = C(), sw = Math.sin(t * 1.4) * 0.05;
  line([x, y, x, y - cs * 1.5], OL, l * 2.6); line([x, y, x, y - cs * 1.5], '#8a5a35', l * 1.4);
  c.save(); c.translate(x, y - cs * 1.15); c.rotate(sw);
  line([-cs * 0.75, 0, cs * 0.75, 0], OL, l * 2.4); line([-cs * 0.75, 0, cs * 0.75, 0], '#8a5a35', l * 1.2);
  P([-cs * 0.42, -cs * 0.05, cs * 0.42, -cs * 0.05, cs * 0.36, cs * 0.75, -cs * 0.36, cs * 0.75], G2(-cs * 0.4, 0, cs * 0.4, 0, '#6a7ab8', '#3a4a8a'), l);
  R(cs * 0.08, cs * 0.2, cs * 0.16, cs * 0.16, cs * 0.02, '#c9504a', l * 0.5); R(-cs * 0.26, cs * 0.42, cs * 0.14, cs * 0.12, cs * 0.02, '#e0b050', l * 0.5);
  line([-cs * 0.36, cs * 0.5, cs * 0.36, cs * 0.5], '#c99520', l * 1.2);
  [-1, 1].forEach(function (d) { for (var s = 0; s < 4; s++) line([d * cs * 0.7, 0, d * (cs * 0.85 + s * cs * 0.02), cs * (0.02 + (s - 1.5) * 0.06)], '#e0b850', l * 0.6); for (var s2 = 0; s2 < 4; s2++) line([-cs * 0.3 + s2 * cs * 0.2, cs * 0.75, -cs * 0.32 + s2 * cs * 0.2, cs * 0.88], '#e0b850', l * 0.6); });
  O(0, -cs * 0.28, cs * 0.25, '#e8d4a8', l);
  line([-cs * 0.12, -cs * 0.32, -cs * 0.06, -cs * 0.26], OL, l * 0.7); line([-cs * 0.12, -cs * 0.26, -cs * 0.06, -cs * 0.32], OL, l * 0.7); line([cs * 0.06, -cs * 0.32, cs * 0.12, -cs * 0.26], OL, l * 0.7); line([cs * 0.06, -cs * 0.26, cs * 0.12, -cs * 0.32], OL, l * 0.7);
  c.strokeStyle = OL; c.lineWidth = l * 0.6; c.beginPath(); c.moveTo(-cs * 0.12, -cs * 0.16); c.quadraticCurveTo(0, -cs * 0.1, cs * 0.12, -cs * 0.16); c.stroke(); for (var st = 0; st < 4; st++) line([-cs * 0.09 + st * cs * 0.06, -cs * 0.17, -cs * 0.09 + st * cs * 0.06, -cs * 0.11], OL, l * 0.4);
  E(0, -cs * 0.5, cs * 0.42, cs * 0.08, '#c99a50', l * 0.8); P([-cs * 0.2, -cs * 0.52, -cs * 0.15, -cs * 0.82, cs * 0.17, -cs * 0.82, cs * 0.2, -cs * 0.52], '#d8aa5a', l * 0.8); line([-cs * 0.2, -cs * 0.58, cs * 0.2, -cs * 0.58], '#c9504a', l * 1.4); snowCap(-cs * 0.16, -cs * 0.8, cs * 0.16, -cs * 0.8, cs * 0.08);
  // ворона на руке
  var hop = Math.abs(Math.sin(t * 2.5)) > 0.97 ? -cs * 0.06 : 0;
  E(cs * 0.62, -cs * 0.14 + hop, cs * 0.14, cs * 0.1, '#2c2f45', l * 0.6); O(cs * 0.74, -cs * 0.24 + hop, cs * 0.08, '#2c2f45', l * 0.5); P([cs * 0.81, -cs * 0.25 + hop, cs * 0.92, -cs * 0.22 + hop, cs * 0.81, -cs * 0.2 + hop], '#ffb347', l * 0.4); O(cs * 0.76, -cs * 0.26 + hop, cs * 0.02, '#ffffff');
  c.restore();
};
DRAW.slide = function (x, y, cs, t, l) {   // ледяная горка: вышка с лесенкой, флажки, длинный ледяной скат с бортами
  var c = C();
  c.beginPath(); c.moveTo(x - cs * 0.3, y - cs * 1.25); c.quadraticCurveTo(x + cs * 0.5, y - cs * 1.0, x + cs * 0.75, y - cs * 0.25); c.lineTo(x + cs * 1.05, y - cs * 0.02); c.lineTo(x + cs * 1.05, y + cs * 0.08); c.lineTo(x + cs * 0.65, y - cs * 0.08); c.quadraticCurveTo(x + cs * 0.38, y - cs * 0.85, x - cs * 0.3, y - cs * 1.05); c.closePath();
  c.fillStyle = G2(x - cs * 0.3, y - cs * 1.2, x + cs * 1, y, '#e6f8ff', '#9fd8f5'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = l * 0.8; c.beginPath(); c.moveTo(x - cs * 0.2, y - cs * 1.13); c.quadraticCurveTo(x + cs * 0.45, y - cs * 0.92, x + cs * 0.7, y - cs * 0.18); c.stroke();
  for (var p = 0; p < 4; p++) line([x - cs * 0.15 + p * cs * 0.25, y - cs * (1.1 - p * 0.28), x - cs * 0.15 + p * cs * 0.25, y], OL, l * 1.2);
  R(x - cs * 0.75, y - cs * 1.4, cs * 0.5, cs * 0.14, cs * 0.03, '#a8784a', l * 0.8);
  [-0.72, -0.3].forEach(function (d) { line([x + d * cs, y, x + d * cs, y - cs * 1.4], OL, l * 1.8); line([x + d * cs, y, x + d * cs, y - cs * 1.4], '#9a6a3a', l * 0.9); });
  for (var s = 1; s < 6; s++) line([x - cs * 0.72, y - s * cs * 0.23, x - cs * 0.3, y - s * cs * 0.23], '#9a6a3a', l * 0.9);
  line([x - cs * 0.72, y - cs * 1.4, x - cs * 0.72, y - cs * 1.95], OL, l); var fw = Math.sin(t * 4) * cs * 0.04; P([x - cs * 0.72, y - cs * 1.95, x - cs * 0.4, y - cs * 1.86 + fw, x - cs * 0.72, y - cs * 1.75], '#e8484f', l * 0.5);
  var cols = ['#ff5a5f', '#ffd54a', '#4cc77d', '#3fb6e6']; for (var f = 0; f < 6; f++) { var fx = x - cs * 0.3 + f * cs * 0.22, fy = y - cs * (1.32 - f * 0.18); P([fx, fy, fx + cs * 0.08, fy, fx + cs * 0.04, fy + cs * 0.1], cols[f % 4]); }
  var sp = (t * 0.5) % 1, sx = x - cs * 0.2 + sp * cs * 1.15, sy = y - cs * 1.15 + sp * sp * cs * 1.1; E(sx, sy - cs * 0.04, cs * 0.12, cs * 0.05, '#c9504a', l * 0.5);   // санки едут
};
DRAW.well = function (x, y, cs, t, l) {   // погреба: бревенчатый колодец с воротом и ведром, рядом дверь погреба в снежном холме
  var c = C();
  c.beginPath(); c.moveTo(x + cs * 0.05, y); c.quadraticCurveTo(x + cs * 0.55, y - cs * 1.1, x + cs * 1.05, y); c.closePath(); c.fillStyle = G2(0, y - cs, 0, y, '#ffffff', '#d8e4f2'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  P([x + cs * 0.35, y, x + cs * 0.4, y - cs * 0.45, x + cs * 0.7, y - cs * 0.45, x + cs * 0.75, y], '#7a4a2a', l * 0.8); line([x + cs * 0.55, y - cs * 0.45, x + cs * 0.55, y], 'rgba(30,15,5,0.5)', l * 0.6); O(x + cs * 0.62, y - cs * 0.22, cs * 0.025, '#c9d2e3');
  var wx = x - cs * 0.4;
  for (var i = 0; i < 3; i++) R(wx - cs * 0.42, y - cs * 0.2 - i * cs * 0.17, cs * 0.84, cs * 0.17, cs * 0.08, i % 2 ? '#9a6a3a' : '#a8784a', l * 0.7);
  E(wx, y - cs * 0.71, cs * 0.4, cs * 0.08, '#1a2450', l * 0.6);
  [-1, 1].forEach(function (d) { line([wx + d * cs * 0.36, y - cs * 0.6, wx + d * cs * 0.36, y - cs * 1.35], OL, l * 2); line([wx + d * cs * 0.36, y - cs * 0.6, wx + d * cs * 0.36, y - cs * 1.35], '#8a5a35', l); });
  line([wx - cs * 0.36, y - cs * 1.08, wx + cs * 0.5, y - cs * 1.08], OL, l * 1.6); line([wx - cs * 0.36, y - cs * 1.08, wx + cs * 0.5, y - cs * 1.08], '#b08050', l * 0.8);
  var a = t * 0.8; line([wx + cs * 0.5, y - cs * 1.08, wx + cs * 0.5 + Math.cos(a) * cs * 0.12, y - cs * 1.08 + Math.sin(a) * cs * 0.12], OL, l * 0.9);
  var sw = Math.sin(t * 1.5) * cs * 0.03; line([wx, y - cs * 1.08, wx + sw, y - cs * 0.86], '#6a5030', 1.5);
  P([wx - cs * 0.1 + sw, y - cs * 0.86, wx + cs * 0.1 + sw, y - cs * 0.86, wx + cs * 0.08 + sw, y - cs * 0.7, wx - cs * 0.08 + sw, y - cs * 0.7], '#8a93ad', l * 0.6);
  P([wx - cs * 0.58, y - cs * 1.3, wx, y - cs * 1.7, wx + cs * 0.58, y - cs * 1.3], '#7a3a2a', l); snowCap(wx - cs * 0.58, y - cs * 1.3, wx + cs * 0.58, y - cs * 1.3, cs * 0.38);
  for (var ic = 0; ic < 4; ic++) P([wx - cs * 0.45 + ic * cs * 0.3, y - cs * 1.3, wx - cs * 0.42 + ic * cs * 0.3, y - cs * (1.18 - (ic % 2) * 0.05), wx - cs * 0.39 + ic * cs * 0.3, y - cs * 1.3], '#dff6ff', l * 0.3);
};
DRAW.cable = function (x, y, cs, t, l) {   // нижняя станция канатки: домик с большим колесом, запасная кабинка
  var c = C();
  plankWall(x - cs * 0.8, y - cs * 0.85, cs * 1.05, cs * 0.85, '#a8784a', l);
  P([x - cs * 0.86, y - cs * 0.85, x - cs * 0.28, y - cs * 1.35, x + cs * 0.31, y - cs * 0.85], '#4a5a8a', l); snowCap(x - cs * 0.86, y - cs * 0.85, x + cs * 0.31, y - cs * 0.85, cs * 0.35);
  R(x - cs * 0.55, y - cs * 0.6, cs * 0.3, cs * 0.25, cs * 0.03, '#ffe08a', l * 0.6);
  c.save(); c.translate(x + cs * 0.4, y - cs * 1.05); c.rotate(t * 0.9); O(0, 0, cs * 0.35, null, l * 1.4); c.strokeStyle = '#5a6078'; c.lineWidth = l * 0.8; c.stroke(); for (var s = 0; s < 6; s++) { c.rotate(Math.PI / 3); line([0, 0, 0, -cs * 0.35], '#5a6078', l * 0.6); } O(0, 0, cs * 0.06, '#e8484f', l * 0.5); c.restore();
  line([x + cs * 0.4, y - cs * 0.7, x + cs * 0.4, y], OL, l * 1.8); line([x + cs * 0.4, y - cs * 0.7, x + cs * 0.4, y], '#8a93ad', l);
  var bob = Math.sin(t * 1.3) * 0.05; c.save(); c.translate(x + cs * 0.68, y - cs * 1.25); c.rotate(bob); line([0, -cs * 0.25, 0, 0], OL, l * 0.8);
  R(-cs * 0.2, 0, cs * 0.4, cs * 0.38, cs * 0.07, '#e8484f', l * 0.8); R(-cs * 0.14, cs * 0.06, cs * 0.28, cs * 0.14, cs * 0.03, '#bfe9ff', l * 0.4); c.restore();
};
// ---------- озеро ----------
DRAW.boat = function (x, y, cs, t, l) {   // вмёрзшая лодка, лунка, удочка, ведро с рыбой
  var c = C();
  E(x, y - cs * 0.05, cs * 1.0, cs * 0.28, 'rgba(170,220,245,0.85)', l * 0.6);
  c.beginPath(); c.moveTo(x - cs * 0.85, y - cs * 0.45); c.lineTo(x + cs * 0.3, y - cs * 0.5); c.quadraticCurveTo(x + cs * 0.25, y - cs * 0.05, x - cs * 0.15, y - cs * 0.05); c.quadraticCurveTo(x - cs * 0.7, y - cs * 0.05, x - cs * 0.85, y - cs * 0.45); c.closePath();
  c.fillStyle = G2(0, y - cs * 0.5, 0, y, '#b07a45', '#6a4628'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  line([x - cs * 0.75, y - cs * 0.3, x + cs * 0.22, y - cs * 0.33], 'rgba(40,20,10,0.4)', l * 0.6);
  E(x - cs * 0.28, y - cs * 0.5, cs * 0.5, cs * 0.06, '#ffffff');
  E(x + cs * 0.62, y + cs * 0.02, cs * 0.18, cs * 0.08, '#2a6a9a', l * 0.6);   // лунка
  var bob = Math.sin(t * 3) * cs * 0.02; c.strokeStyle = OL; c.lineWidth = l * 0.8; c.beginPath(); c.moveTo(x + cs * 0.25, y - cs * 0.6); c.quadraticCurveTo(x + cs * 0.55, y - cs * 1.05, x + cs * 0.85, y - cs * 0.85); c.stroke(); c.strokeStyle = 'rgba(30,40,70,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + cs * 0.85, y - cs * 0.85); c.lineTo(x + cs * 0.64, y + bob); c.stroke(); O(x + cs * 0.64, y + bob, cs * 0.03, '#e8484f');
  R(x + cs * 0.82, y - cs * 0.22, cs * 0.22, cs * 0.24, cs * 0.04, '#8a93ad', l * 0.7); E(x + cs * 0.93, y - cs * 0.22, cs * 0.11, cs * 0.04, '#3a6a9a', l * 0.4); P([x + cs * 0.87, y - cs * 0.3, x + cs * 0.97, y - cs * 0.38, x + cs * 0.99, y - cs * 0.26], '#9fc0d8', l * 0.4);
};
DRAW.fishhuts = function (x, y, cs, t, l) {   // избы рыбаков на сваях, сети, вяленая рыба, дым
  var c = C();
  [[-0.5, 0.9, 0], [0.48, 0.75, 1]].forEach(function (q) { var hx = x + q[0] * cs, s = q[1];
    for (var p = -1; p <= 1; p += 2) line([hx + p * cs * 0.32 * s, y, hx + p * cs * 0.32 * s, y - cs * 0.3], OL, l * 1.6);
    R(hx - cs * 0.44 * s, y - cs * 0.36, cs * 0.88 * s, cs * 0.08, cs * 0.02, '#9a6a3a', l * 0.7);
    logHouse(hx, y - cs * 0.36, cs * 0.8 * s, cs * 0.6 * s, cs, l * 0.9, q[2] ? '#3f6f9a' : '#7a4a2a');
    smoke(hx + cs * 0.2 * s, y - cs * (1.3 * s + 0.36), cs * 0.22, t + q[2]); });
  line([x - cs * 0.05, y - cs * 1.0, x + cs * 0.12, y - cs * 1.0], OL, l * 0.8);
  c.strokeStyle = 'rgba(60,70,100,0.6)'; c.lineWidth = 1; for (var n = 0; n < 4; n++) { c.beginPath(); c.moveTo(x - cs * 0.95 + n * cs * 0.06, y - cs * 0.55); c.lineTo(x - cs * 1.0 + n * cs * 0.06, y - cs * 0.05); c.stroke(); }   // сеть
  for (var f = 0; f < 3; f++) { var fx = x - cs * 0.02 + f * cs * 0.05, fy = y - cs * 0.92, sw = Math.sin(t * 2 + f) * 0.1; c.save(); c.translate(fx, fy); c.rotate(sw); E(0, cs * 0.1, cs * 0.03, cs * 0.08, '#9fc0d8', l * 0.4); P([-cs * 0.03, cs * 0.18, 0, cs * 0.14, cs * 0.03, cs * 0.18], '#9fc0d8', l * 0.3); c.restore(); }
};
DRAW.lighthouse = function (x, y, cs, t, l) {   // каменный маяк с вращающимся лучом
  var c = C();
  rock(x, y, cs * 1.4, cs * 0.35, l, '#8a86a2');
  P([x - cs * 0.32, y - cs * 0.3, x - cs * 0.2, y - cs * 1.75, x + cs * 0.2, y - cs * 1.75, x + cs * 0.32, y - cs * 0.3], '#ffffff', l);
  c.save(); c.beginPath(); c.moveTo(x - cs * 0.32, y - cs * 0.3); c.lineTo(x - cs * 0.2, y - cs * 1.75); c.lineTo(x + cs * 0.2, y - cs * 1.75); c.lineTo(x + cs * 0.32, y - cs * 0.3); c.closePath(); c.clip();
  for (var b = 0; b < 3; b++) { c.fillStyle = '#e8484f'; c.fillRect(x - cs * 0.4, y - cs * (0.55 + b * 0.45), cs * 0.8, cs * 0.22); } c.fillStyle = 'rgba(40,50,90,0.18)'; c.fillRect(x + cs * 0.05, y - cs * 1.8, cs * 0.3, cs * 1.6); c.restore();
  R(x - cs * 0.08, y - cs * 0.6, cs * 0.16, cs * 0.3, cs * 0.06, '#2a3460', l * 0.6);
  R(x - cs * 0.3, y - cs * 1.82, cs * 0.6, cs * 0.08, cs * 0.02, '#2a3460', l * 0.7);
  R(x - cs * 0.17, y - cs * 2.2, cs * 0.34, cs * 0.38, cs * 0.04, 'rgba(255,240,170,0.95)', l * 0.8);
  P([x - cs * 0.24, y - cs * 2.2, x, y - cs * 2.45, x + cs * 0.24, y - cs * 2.2], '#e8484f', l * 0.8);
  var a = t * 1.2, bx = x, by = y - cs * 2.02; c.save(); c.globalCompositeOperation = 'lighter'; var bg = c.createRadialGradient(bx, by, 0, bx, by, cs * 2.2); bg.addColorStop(0, 'rgba(255,240,170,0.45)'); bg.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = bg;
  [0, Math.PI].forEach(function (o) { var aa = a + o, k = Math.cos(aa); c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.cos(aa) * cs * 2.2, by - cs * 0.18 + Math.sin(aa) * cs * 0.3); c.lineTo(bx + Math.cos(aa) * cs * 2.2, by + cs * 0.18 + Math.sin(aa) * cs * 0.3); c.closePath(); c.globalAlpha = 0.5 + 0.5 * Math.abs(k); c.fill(); });
  c.restore(); c.globalAlpha = 1;
};
DRAW.river = function (x, y, cs, t, l) {   // причал и лодка среди плывущих льдин
  var c = C();
  for (var p = 0; p < 4; p++) line([x - cs * 0.9 + p * cs * 0.25, y + cs * 0.05, x - cs * 0.9 + p * cs * 0.25, y - cs * 0.42], OL, l * 1.6);
  R(x - cs * 1.0, y - cs * 0.5, cs * 0.95, cs * 0.12, cs * 0.02, '#a8784a', l * 0.8); for (var pl = 0; pl < 5; pl++) line([x - cs * 0.95 + pl * cs * 0.19, y - cs * 0.5, x - cs * 0.95 + pl * cs * 0.19, y - cs * 0.38], 'rgba(60,35,15,0.4)', 1);
  E(x - cs * 0.55, y - cs * 0.5, cs * 0.45, cs * 0.05, '#ffffff');
  for (var f = 0; f < 3; f++) { var fx = x + cs * (0.2 + f * 0.35) + Math.sin(t * 0.4 + f) * cs * 0.08, fy = y - cs * (0.05 + (f % 2) * 0.25); P([fx - cs * 0.22, fy, fx - cs * 0.15, fy - cs * 0.12, fx + cs * 0.12, fy - cs * 0.14, fx + cs * 0.22, fy, fx + cs * 0.05, fy + cs * 0.06], '#eaf8ff', l * 0.7); }
  var bob = Math.sin(t * 1.5) * cs * 0.03; c.save(); c.translate(x + cs * 0.25, y - cs * 0.45 + bob); c.rotate(Math.sin(t * 1.2) * 0.04);
  c.beginPath(); c.moveTo(-cs * 0.5, -cs * 0.12); c.lineTo(cs * 0.5, -cs * 0.15); c.quadraticCurveTo(cs * 0.4, cs * 0.12, 0, cs * 0.12); c.quadraticCurveTo(-cs * 0.4, cs * 0.12, -cs * 0.5, -cs * 0.12); c.closePath(); c.fillStyle = G2(0, -cs * 0.15, 0, cs * 0.12, '#3f8fc0', '#1f5a8a'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  line([-cs * 0.45, -cs * 0.08, cs * 0.45, -cs * 0.1], '#ffffff', l * 0.8); line([0, -cs * 0.13, 0, -cs * 0.95], OL, l * 1.2);
  P([cs * 0.03, -cs * 0.92, cs * 0.42, -cs * 0.3, cs * 0.03, -cs * 0.3], '#fff3e0', l * 0.7);
  c.restore(); line([x - cs * 0.05, y - cs * 0.45, x + cs * 0.0, y - cs * 0.5], OL, l * 0.5);
};
DRAW.lights = function (x, y, cs, t, l) {   // избушка Кикиморы на сваях над тёмной заводью, фонарь, блуждающие огоньки
  var c = C();
  E(x, y - cs * 0.02, cs * 0.95, cs * 0.25, '#2e5a52', l * 0.7); E(x - cs * 0.3, y - cs * 0.05, cs * 0.2, cs * 0.05, 'rgba(200,240,220,0.3)');
  for (var p = 0; p < 4; p++) line([x - cs * 0.4 + p * cs * 0.27, y + cs * 0.02, x - cs * 0.38 + p * cs * 0.27, y - cs * 0.55], OL, l * 1.4);
  for (var p2 = 0; p2 < 4; p2++) line([x - cs * 0.4 + p2 * cs * 0.27, y + cs * 0.02, x - cs * 0.38 + p2 * cs * 0.27, y - cs * 0.55], '#5a4a3a', l * 0.6);
  P([x - cs * 0.55, y - cs * 0.55, x - cs * 0.5, y - cs * 1.2, x + cs * 0.52, y - cs * 1.15, x + cs * 0.55, y - cs * 0.55], G2(x - cs * 0.5, 0, x + cs * 0.5, 0, '#7a6a4a', '#4a3e2a'), l);
  c.strokeStyle = 'rgba(30,20,10,0.4)'; c.lineWidth = 1; c.beginPath(); for (var b = 1; b < 4; b++) { c.moveTo(x - cs * 0.53, y - cs * (0.55 + b * 0.16)); c.lineTo(x + cs * 0.53, y - cs * (0.55 + b * 0.15)); } c.stroke();
  P([x - cs * 0.7, y - cs * 1.12, x - cs * 0.05, y - cs * 1.75, x + cs * 0.68, y - cs * 1.1], '#5a7a4a', l);   // крыша из камыша и мха
  c.strokeStyle = 'rgba(30,60,20,0.5)'; c.beginPath(); for (var r2 = 0; r2 < 7; r2++) { c.moveTo(x - cs * 0.6 + r2 * cs * 0.2, y - cs * 1.12); c.lineTo(x - cs * 0.1 + r2 * cs * 0.04, y - cs * 1.65); } c.stroke();
  var gl = 0.7 + 0.3 * Math.sin(t * 4); R(x - cs * 0.15, y - cs * 1.0, cs * 0.3, cs * 0.22, cs * 0.03, 'rgba(160,255,140,' + gl.toFixed(2) + ')', l * 0.6);
  line([x + cs * 0.55, y - cs * 1.0, x + cs * 0.75, y - cs * 1.05], OL, l * 0.8); line([x + cs * 0.75, y - cs * 1.05, x + cs * 0.75, y - cs * 0.9], OL, l * 0.5); R(x + cs * 0.69, y - cs * 0.9, cs * 0.12, cs * 0.14, cs * 0.03, '#b8ff9a', l * 0.5);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (var w = 0; w < 5; w++) { var wx = x + Math.sin(t * 0.7 + w * 1.7) * cs * 1.0, wy = y - cs * 0.5 + Math.cos(t * 0.5 + w * 2.1) * cs * 0.45, gg = c.createRadialGradient(wx, wy, 0, wx, wy, cs * 0.3); gg.addColorStop(0, 'rgba(190,255,150,0.85)'); gg.addColorStop(1, 'rgba(120,255,120,0)'); c.fillStyle = gg; c.fillRect(wx - cs * 0.3, wy - cs * 0.3, cs * 0.6, cs * 0.6); O(wx, wy, cs * 0.04, '#f0ffe0'); }
  c.restore();
};
DRAW.dam = function (x, y, cs, t, l, ext) {   // бобровая хатка у ориентира; сама плотина — поперёк реки (рисуется в ext.riverY)
  var c = C();
  // хатка из веток
  c.beginPath(); c.moveTo(x - cs * 0.8, y); c.quadraticCurveTo(x - cs * 0.75, y - cs * 0.95, x, y - cs * 1.05); c.quadraticCurveTo(x + cs * 0.75, y - cs * 0.95, x + cs * 0.8, y); c.closePath(); c.fillStyle = G2(0, y - cs, 0, y, '#8a6a4a', '#5a4030'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  for (var s = 0; s < 14; s++) { var a = s * 0.7, sx = x + Math.cos(a) * cs * 0.5 * (0.4 + (s % 3) * 0.25), sy = y - cs * 0.45 - Math.sin(a * 1.3) * cs * 0.3; line([sx - cs * 0.18, sy + cs * 0.05, sx + cs * 0.18, sy - cs * 0.05], s % 2 ? '#a8784a' : '#7a5232', l * 0.8); }
  snowCap(x - cs * 0.55, y - cs * 0.85, x + cs * 0.55, y - cs * 0.85, cs * 0.25);
  E(x + cs * 0.3, y - cs * 0.12, cs * 0.16, cs * 0.12, '#2a1a0e', l * 0.6);
  if (ext && ext.riverY !== undefined && !ext.gone) {
    var ry = ext.riverY, w = cs * 1.6, dx = ext.damX;
    for (var lg = 0; lg < 4; lg++) { R(dx - w / 2 + (lg % 2) * cs * 0.06, ry - cs * 0.45 + lg * cs * 0.2, w, cs * 0.2, cs * 0.1, lg % 2 ? '#8a5a35' : '#9a6a3a', l * 0.7); O(dx - w / 2 + cs * 0.1, ry - cs * 0.35 + lg * cs * 0.2, cs * 0.06, '#d8b080', l * 0.4); }
    for (var st = 0; st < 6; st++) line([dx - w / 2 + st * w / 5, ry - cs * 0.55, dx - w / 2 + st * w / 5 + cs * 0.05, ry - cs * 0.42], '#6a4628', l * 0.9);
    E(dx, ry - cs * 0.5, w * 0.45, cs * 0.06, '#ffffff');
    // перелив воды
    c.save(); c.globalAlpha = 0.7; for (var wf = 0; wf < 5; wf++) { var q = (t * 1.5 + wf * 0.2) % 1; line([dx - w * 0.3 + wf * w * 0.15, ry + cs * 0.32, dx - w * 0.3 + wf * w * 0.15, ry + cs * (0.32 + q * 0.18)], 'rgba(220,245,255,0.9)', l * 0.7); } c.restore();
  }
};
// ---------- горы ----------
function massif(x, y, cs, l, h, w, seed) {   // горный массив со снежной шапкой и тенью
  var c = C();
  var pk = [x - w / 2, y, x - w * 0.36, y - h * 0.45, x - w * 0.2, y - h * 0.7, x - w * 0.02, y - h, x + w * 0.16, y - h * 0.78, x + w * 0.3, y - h * 0.86, x + w / 2, y];
  P(pk, G2(x - w / 2, y - h, x + w / 2, y, '#a8a4c0', '#5e5a7c'), l);
  P([x - w * 0.02, y - h, x + w * 0.16, y - h * 0.78, x + w * 0.3, y - h * 0.86, x + w / 2, y, x + w * 0.05, y], 'rgba(30,26,60,0.22)');
  P([x - w * 0.2, y - h * 0.7, x - w * 0.02, y - h, x + w * 0.16, y - h * 0.78, x + w * 0.1, y - h * 0.66, x + w * 0.0, y - h * 0.74, x - w * 0.1, y - h * 0.6], '#ffffff', l * 0.6);
  P([x + w * 0.22, y - h * 0.8, x + w * 0.3, y - h * 0.86, x + w * 0.36, y - h * 0.72, x + w * 0.28, y - h * 0.7], '#ffffff', l * 0.5);
  c.strokeStyle = 'rgba(40,36,70,0.35)'; c.lineWidth = Math.max(1, l * 0.5); c.beginPath(); c.moveTo(x - w * 0.1, y - h * 0.55); c.lineTo(x - w * 0.18, y - h * 0.25); c.moveTo(x + w * 0.2, y - h * 0.6); c.lineTo(x + w * 0.26, y - h * 0.3); c.stroke();
  return { capX: x - w * 0.02, capY: y - h * 0.85 };
}
DRAW.slopes = function (x, y, cs, t, l) {   // перевал: массивная гора, снежная шапка-«кнопка» лавины мерцает
  var c = C(), m = massif(x, y, cs, l, cs * 2.4, cs * 1.68, 1);
  firs(x - cs * 0.4, y, cs, 3, 3); firs(x + cs * 0.5, y + cs * 0.02, cs, 2, 7);
  var G = Z.G, ready = !(G && G.avaCd > 0), k = 0.5 + 0.5 * Math.sin(t * 3);
  if (ready) { c.save(); c.globalAlpha = 0.35 + 0.35 * k; c.strokeStyle = '#ffe066'; c.lineWidth = l * 1.4; c.beginPath(); c.ellipse(m.capX, m.capY, cs * 0.45, cs * 0.25, 0, 0, 7); c.stroke(); c.restore();
    c.globalAlpha = 0.85; D.text('▼', m.capX, m.capY - cs * 0.55 - k * cs * 0.08, cs * 0.3, '#ffe066', 'center', 'middle', 2); c.globalAlpha = 1; }
};
DRAW.ropebridge = function (x, y, cs, t, l) {   // две скалы и висячий мост между ними
  var c = C();
  rock(x - cs * 0.7, y, cs * 0.75, cs * 1.4, l); rock(x + cs * 0.72, y, cs * 0.7, cs * 1.25, l, '#9a96b0');
  snowCap(x - cs * 0.95, y - cs * 1.25, x - cs * 0.45, y - cs * 1.3, cs * 0.15); snowCap(x + cs * 0.5, y - cs * 1.12, x + cs * 0.95, y - cs * 1.1, cs * 0.14);
  var sag = cs * 0.25 + Math.sin(t * 1.3) * cs * 0.03, y0 = y - cs * 1.05;
  c.strokeStyle = '#8a6a3a'; c.lineWidth = l * 0.8; c.beginPath(); c.moveTo(x - cs * 0.45, y0 - cs * 0.25); c.quadraticCurveTo(x, y0 + sag - cs * 0.25, x + cs * 0.45, y0 - cs * 0.25); c.stroke();
  for (var p = 0; p <= 8; p++) { var u = p / 8, px = x - cs * 0.45 + u * cs * 0.9, py = y0 + 4 * u * (1 - u) * sag; R(px - cs * 0.05, py - cs * 0.03, cs * 0.1, cs * 0.06, cs * 0.01, '#a8784a', l * 0.4); line([px, py, px, py - cs * 0.25 + 4 * u * (1 - u) * 0], 'rgba(120,90,50,0.7)', 1); }
  c.strokeStyle = OL; c.lineWidth = l * 0.6; c.beginPath(); c.moveTo(x - cs * 0.45, y0); c.quadraticCurveTo(x, y0 + sag * 2 - sag, x + cs * 0.45, y0); c.stroke();
  [-0.45, 0.45].forEach(function (d) { line([x + d * cs, y0 + cs * 0.05, x + d * cs, y0 - cs * 0.35], OL, l * 1.6); line([x + d * cs, y0 + cs * 0.05, x + d * cs, y0 - cs * 0.35], '#8a5a35', l * 0.8); });
};
DRAW.gates = function (x, y, cs, t, l) {   // ущелье: каменные стены и деревянные ворота, осыпь
  var c = C();
  rock(x - cs * 0.62, y, cs * 0.5, cs * 1.6, l); rock(x + cs * 0.62, y, cs * 0.5, cs * 1.5, l, '#9a96b0');
  snowCap(x - cs * 0.82, y - cs * 1.45, x - cs * 0.45, y - cs * 1.5, cs * 0.15); snowCap(x + cs * 0.45, y - cs * 1.35, x + cs * 0.82, y - cs * 1.3, cs * 0.14);
  R(x - cs * 0.42, y - cs * 1.15, cs * 0.84, cs * 0.14, cs * 0.03, '#7a5232', l * 0.8);
  plankWall(x - cs * 0.36, y - cs * 1.0, cs * 0.34, cs * 1.0, '#9a6a3a', l * 0.7); plankWall(x + cs * 0.02, y - cs * 1.0, cs * 0.34, cs * 1.0, '#8a5a35', l * 0.7);
  line([x - cs * 0.34, y - cs * 0.3, x - cs * 0.04, y - cs * 0.85], '#6a4628', l); line([x + cs * 0.04, y - cs * 0.85, x + cs * 0.34, y - cs * 0.3], '#6a4628', l);
  O(x - cs * 0.06, y - cs * 0.5, cs * 0.03, '#c9d2e3', l * 0.3); O(x + cs * 0.06, y - cs * 0.5, cs * 0.03, '#c9d2e3', l * 0.3);
  for (var s = 0; s < 5; s++) E(x - cs * 0.5 + s * cs * 0.25, y + cs * 0.0, cs * (0.07 + (s % 2) * 0.04), cs * 0.04, '#8a86a2', l * 0.4);
};
DRAW.springs = function (x, y, cs, t, l) {   // каменная купель с горячей водой, пар, в воде греется капибара
  var c = C();
  E(x, y - cs * 0.2, cs * 0.95, cs * 0.42, '#8a86a2', l);
  for (var s = 0; s < 9; s++) { var a = s / 9 * Math.PI * 2; E(x + Math.cos(a) * cs * 0.85, y - cs * 0.2 + Math.sin(a) * cs * 0.35, cs * 0.15, cs * 0.09, s % 2 ? '#9a96b0' : '#7a7690', l * 0.5); }
  var wg = c.createRadialGradient(x, y - cs * 0.22, 0, x, y - cs * 0.22, cs * 0.75); wg.addColorStop(0, '#9ff0e8'); wg.addColorStop(1, '#3fb6c0'); E(x, y - cs * 0.22, cs * 0.72, cs * 0.3, wg, l * 0.6);
  for (var b = 0; b < 4; b++) { var q = (t * 0.8 + b * 0.25) % 1; c.globalAlpha = 1 - q; O(x - cs * 0.4 + b * cs * 0.25, y - cs * 0.2, cs * (0.02 + q * 0.04), null, 1); c.strokeStyle = '#ffffff'; c.stroke(); } c.globalAlpha = 1;
  // капибара
  var bx = x + cs * 0.2, by = y - cs * 0.28; E(bx, by, cs * 0.28, cs * 0.16, '#b07a4a', l * 0.8); O(bx + cs * 0.25, by - cs * 0.12, cs * 0.14, '#b07a4a', l * 0.8); R(bx + cs * 0.28, by - cs * 0.16, cs * 0.16, cs * 0.12, cs * 0.05, '#9a6a3a', l * 0.6);
  O(bx + cs * 0.16, by - cs * 0.25, cs * 0.04, '#8a5a35', l * 0.4); c.strokeStyle = OL; c.lineWidth = l * 0.6; c.beginPath(); c.arc(bx + cs * 0.25, by - cs * 0.15, cs * 0.03, 0.3, Math.PI - 0.3); c.stroke();
  E(bx + cs * 0.22, by - cs * 0.29, cs * 0.07, cs * 0.03, '#ffd54a', l * 0.4);   // мандаринка на голове
  E(x, y - cs * 0.17, cs * 0.7, cs * 0.06, 'rgba(159,240,232,0.75)');
  for (var st = 0; st < 5; st++) { var sq = (t * 0.3 + st * 0.2) % 1; c.globalAlpha = 0.5 * (1 - sq); O(x - cs * 0.5 + st * cs * 0.25 + Math.sin(sq * 6 + st) * cs * 0.1, y - cs * 0.4 - sq * cs * 1.4, cs * (0.12 + sq * 0.2), '#ffffff'); } c.globalAlpha = 1;
};
// ---------- север ----------
DRAW.crystals = function (x, y, cs, t, l) {   // вход в ледяную пещеру, внутри светятся кристаллы
  var c = C();
  c.beginPath(); c.moveTo(x - cs * 1.0, y); c.quadraticCurveTo(x - cs * 0.95, y - cs * 1.6, x, y - cs * 1.75); c.quadraticCurveTo(x + cs * 0.95, y - cs * 1.6, x + cs * 1.0, y); c.closePath(); c.fillStyle = G2(0, y - cs * 1.7, 0, y, '#dff4ff', '#8fc8ec'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  c.beginPath(); c.moveTo(x - cs * 0.55, y); c.quadraticCurveTo(x - cs * 0.5, y - cs * 1.05, x, y - cs * 1.1); c.quadraticCurveTo(x + cs * 0.5, y - cs * 1.05, x + cs * 0.55, y); c.closePath(); c.fillStyle = '#1a2450'; c.fill(); c.stroke();
  var gl = 0.6 + 0.4 * Math.sin(t * 2); c.save(); c.globalCompositeOperation = 'lighter'; var g = c.createRadialGradient(x, y - cs * 0.4, 0, x, y - cs * 0.4, cs * 0.8); g.addColorStop(0, 'rgba(160,120,255,' + (0.6 * gl).toFixed(2) + ')'); g.addColorStop(1, 'rgba(90,200,255,0)'); c.fillStyle = g; c.fillRect(x - cs, y - cs * 1.3, cs * 2, cs * 1.3); c.restore();
  [[-0.25, 0.55, '#b48cff'], [0.0, 0.8, '#7fdcff'], [0.22, 0.5, '#c9a8ff']].forEach(function (q) { P([x + q[0] * cs - cs * 0.08, y, x + q[0] * cs, y - q[1] * cs, x + q[0] * cs + cs * 0.08, y], q[2], l * 0.6); });
  for (var i = 0; i < 6; i++) P([x - cs * 0.85 + i * cs * 0.32, y - cs * (1.25 + (i % 2) * 0.1) + Math.abs(i - 2.5) * cs * 0.12, x - cs * 0.8 + i * cs * 0.32, y - cs * (1.0 + (i % 2) * 0.1) + Math.abs(i - 2.5) * cs * 0.12, x - cs * 0.75 + i * cs * 0.32, y - cs * (1.25 + (i % 2) * 0.1) + Math.abs(i - 2.5) * cs * 0.12], '#eafaff', l * 0.4);
};
DRAW.icebergs = function (x, y, cs, t, l) {   // айсберг в воде, на нём греется тюлень
  var c = C(), bob = Math.sin(t * 1.1) * cs * 0.03;
  E(x, y - cs * 0.05, cs * 1.0, cs * 0.25, 'rgba(60,140,200,0.55)', l * 0.6);
  P([x - cs * 0.9, y - cs * 0.15 + bob, x - cs * 0.65, y - cs * 1.0 + bob, x - cs * 0.2, y - cs * 1.55 + bob, x + cs * 0.15, y - cs * 1.15 + bob, x + cs * 0.5, y - cs * 1.3 + bob, x + cs * 0.9, y - cs * 0.15 + bob], G2(x - cs, 0, x + cs, 0, '#ffffff', '#a8dcf5'), l);
  P([x - cs * 0.2, y - cs * 1.55 + bob, x + cs * 0.15, y - cs * 1.15 + bob, x + cs * 0.1, y - cs * 0.15 + bob, x - cs * 0.25, y - cs * 0.15 + bob], 'rgba(120,190,235,0.35)');
  line([x - cs * 0.55, y - cs * 0.9 + bob, x - cs * 0.3, y - cs * 0.5 + bob], 'rgba(255,255,255,0.9)', l);
  // тюлень на уступе
  var sx = x + cs * 0.45, sy = y - cs * 0.6 + bob; E(sx, sy, cs * 0.3, cs * 0.13, '#9aa4bc', l * 0.8); O(sx + cs * 0.27, sy - cs * 0.08, cs * 0.12, '#a8b2c8', l * 0.8); P([sx - cs * 0.3, sy, sx - cs * 0.45, sy - cs * 0.08, sx - cs * 0.42, sy + cs * 0.06], '#8a94ac', l * 0.5);
  O(sx + cs * 0.31, sy - cs * 0.11, cs * 0.025, OL); O(sx + cs * 0.37, sy - cs * 0.06, cs * 0.02, OL); c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); c.moveTo(sx + cs * 0.36, sy - cs * 0.04); c.lineTo(sx + cs * 0.48, sy - cs * 0.07); c.stroke();
  for (var w = 0; w < 3; w++) { var q = (t * 0.6 + w / 3) % 1; c.globalAlpha = 1 - q; E(x, y - cs * 0.1, cs * (0.95 + q * 0.3), cs * (0.24 + q * 0.06), null, 1); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke(); } c.globalAlpha = 1;
};
DRAW.icewalls = function (x, y, cs, t, l) {   // ледяная арка лабиринта с рунами
  var c = C();
  c.beginPath(); c.moveTo(x - cs * 0.95, y); c.lineTo(x - cs * 0.95, y - cs * 1.2); c.quadraticCurveTo(x, y - cs * 2.1, x + cs * 0.95, y - cs * 1.2); c.lineTo(x + cs * 0.95, y); c.lineTo(x + cs * 0.5, y); c.lineTo(x + cs * 0.5, y - cs * 1.0); c.quadraticCurveTo(x, y - cs * 1.55, x - cs * 0.5, y - cs * 1.0); c.lineTo(x - cs * 0.5, y); c.closePath();
  c.fillStyle = G2(x - cs, 0, x + cs, 0, '#eafaff', '#9fd0ee'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  var gl = 0.5 + 0.5 * Math.sin(t * 2.5);
  ['ᚱ', 'ᛉ', 'ᛟ'].forEach(function (rn, i) { var a = -0.6 + i * 0.6, rx = x + Math.sin(a) * cs * 0.72, ry = y - cs * 1.25 - Math.cos(a) * cs * 0.32; c.globalAlpha = 0.5 + 0.5 * gl; D.text(rn, rx, ry, cs * 0.22, '#5ac8ff', 'center', 'middle', 0); c.globalAlpha = 1; });
  for (var i2 = 0; i2 < 4; i2++) P([x - cs * 0.92 + i2 * cs * 0.12, y - cs * 1.2, x - cs * 0.88 + i2 * cs * 0.12, y - cs * (0.95 - (i2 % 2) * 0.1), x - cs * 0.84 + i2 * cs * 0.12, y - cs * 1.2], '#ffffff', l * 0.3);
  P([x - cs * 0.15, y - cs * 1.78, x, y - cs * 2.1, x + cs * 0.15, y - cs * 1.78], '#bfe9ff', l * 0.7);
};
DRAW.palace = function (x, y, cs, t, l) {   // чертоги Метелицы: ледяной дворец со шпилями и светящимися окнами
  var c = C();
  R(x - cs * 0.9, y - cs * 0.9, cs * 1.8, cs * 0.9, cs * 0.05, G2(x - cs, 0, x + cs, 0, '#eafaff', '#a8d8f5'), l);
  [[-0.75, 1.7, 0.28], [0.75, 1.6, 0.28], [-0.32, 2.1, 0.3], [0.32, 2.0, 0.3], [0, 2.6, 0.34]].forEach(function (q) {
    var tx = x + q[0] * cs, th = q[1] * cs, tw = q[2] * cs; R(tx - tw / 2, y - th * 0.78, tw, th * 0.78, cs * 0.03, G2(tx - tw / 2, 0, tx + tw / 2, 0, '#ffffff', '#b8e0f8'), l * 0.8);
    P([tx - tw * 0.62, y - th * 0.78, tx, y - th, tx + tw * 0.62, y - th * 0.78], '#7fc8ee', l * 0.8);
    var gl = 0.6 + 0.4 * Math.sin(t * 2 + q[0] * 3); R(tx - tw * 0.18, y - th * 0.6, tw * 0.36, th * 0.12, tw * 0.15, 'rgba(160,220,255,' + gl.toFixed(2) + ')', l * 0.4); });
  c.beginPath(); c.arc(x, y - cs * 0.35, cs * 0.22, Math.PI, 0); c.lineTo(x + cs * 0.22, y); c.lineTo(x - cs * 0.22, y); c.closePath(); c.fillStyle = '#3a4a8a'; c.fill(); c.lineWidth = l * 0.7; c.strokeStyle = OL; c.stroke();
  D.flake(x, y - cs * 0.68, cs * 0.14, '#5ac8ff', l * 0.6);
  c.save(); c.globalCompositeOperation = 'lighter'; for (var s = 0; s < 6; s++) { var a = t * 0.8 + s, r2 = cs * (1.2 + (s % 2) * 0.3); c.globalAlpha = 0.6; D.flake(x + Math.cos(a) * r2, y - cs * 1.3 + Math.sin(a) * cs * 0.5, cs * 0.07, '#ffffff', 1); } c.restore(); c.globalAlpha = 1;
};
DRAW.aurora = function (x, y, cs, t, l) {   // каменный круг и ледяной обелиск, от вершины — лента сияния
  var c = C();
  c.save(); c.globalCompositeOperation = 'lighter';
  [['80,255,190', 0], ['150,120,255', 1.4], ['90,200,255', 2.6]].forEach(function (q) { c.beginPath(); for (var k = 0; k <= 12; k++) { var u = k / 12, px = x + (u - 0.5) * cs * 2.2, py = y - cs * 1.9 - Math.sin(u * 5 + t * 0.9 + q[1]) * cs * 0.25 - u * cs * 0.3; if (!k) c.moveTo(px, py); else c.lineTo(px, py); } c.strokeStyle = 'rgba(' + q[0] + ',0.45)'; c.lineWidth = cs * 0.18; c.lineCap = 'round'; c.stroke(); });
  c.restore();
  for (var s = 0; s < 6; s++) { var a = s / 6 * Math.PI * 2, sx = x + Math.cos(a) * cs * 0.8, sy = y - cs * 0.1 + Math.sin(a) * cs * 0.22; R(sx - cs * 0.08, sy - cs * (0.35 + (s % 2) * 0.1), cs * 0.16, cs * (0.35 + (s % 2) * 0.1), cs * 0.04, '#8a86a2', l * 0.6); E(sx, sy - cs * (0.35 + (s % 2) * 0.1), cs * 0.08, cs * 0.03, '#ffffff'); }
  P([x - cs * 0.2, y, x - cs * 0.1, y - cs * 1.45, x, y - cs * 1.65, x + cs * 0.1, y - cs * 1.45, x + cs * 0.2, y], G2(x - cs * 0.2, 0, x + cs * 0.2, 0, '#eafaff', '#7fc8ee'), l);
  var gl = 0.6 + 0.4 * Math.sin(t * 2); c.globalAlpha = gl; O(x, y - cs * 1.55, cs * 0.12, '#b8ffd8'); c.globalAlpha = 1;
  D.text('✦', x, y - cs * 0.75, cs * 0.25, '#5ac8ff', 'center', 'middle', 0);
};
DRAW.vane = function (x, y, cs, t, l) {   // метеостанция: домик, мачта с анемометром и флюгером, градусник
  var c = C();
  logHouse(x - cs * 0.35, y, cs * 0.85, cs * 0.6, cs, l, '#3f6f9a');
  line([x + cs * 0.45, y, x + cs * 0.45, y - cs * 2.0], OL, l * 1.6); line([x + cs * 0.45, y, x + cs * 0.45, y - cs * 2.0], '#8a93ad', l * 0.8);
  c.save(); c.translate(x + cs * 0.45, y - cs * 2.0); var a = t * 4; for (var i = 0; i < 3; i++) { var aa = a + i * Math.PI * 2 / 3, ex = Math.cos(aa) * cs * 0.28, ey = Math.sin(aa) * cs * 0.08; line([0, 0, ex, ey], OL, l * 0.6); O(ex, ey, cs * 0.07, Math.cos(aa) > 0 ? '#e8484f' : '#c0323f', l * 0.5); } c.restore();
  var va = Math.sin(t * 0.6) * 0.5; c.save(); c.translate(x + cs * 0.45, y - cs * 1.55); c.scale(Math.cos(va), 1); line([-cs * 0.3, 0, cs * 0.3, 0], OL, l * 0.8); P([cs * 0.3, 0, cs * 0.18, -cs * 0.08, cs * 0.18, cs * 0.08], '#e8484f', l * 0.5); P([-cs * 0.3, -cs * 0.1, -cs * 0.18, 0, -cs * 0.3, cs * 0.1], '#ffd54a', l * 0.5); c.restore();
  R(x + cs * 0.62, y - cs * 1.1, cs * 0.1, cs * 0.5, cs * 0.05, '#ffffff', l * 0.6); R(x + cs * 0.645, y - cs * 0.9, cs * 0.05, cs * 0.28, cs * 0.02, '#e8484f'); O(x + cs * 0.67, y - cs * 0.6, cs * 0.06, '#e8484f', l * 0.5);
};
DRAW.ship = function (x, y, cs, t, l) {   // ледокол: красный корпус с ватерлинией, белая рубка, труба с дымом, лёд у носа (умещается в 2 клетки)
  var c = C(), bob = Math.sin(t * 1.2) * cs * 0.02;
  E(x, y - cs * 0.04, cs * 0.88, cs * 0.17, 'rgba(60,140,200,0.55)', l * 0.6);
  c.save(); c.translate(0, bob);
  c.beginPath(); c.moveTo(x - cs * 0.8, y - cs * 0.55); c.lineTo(x + cs * 0.55, y - cs * 0.55); c.lineTo(x + cs * 0.86, y - cs * 0.78); c.quadraticCurveTo(x + cs * 0.7, y - cs * 0.12, x + cs * 0.42, y - cs * 0.06); c.lineTo(x - cs * 0.68, y - cs * 0.06); c.closePath();
  c.fillStyle = G2(0, y - cs * 0.6, 0, y, '#e8484f', '#a01e2a'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  line([x - cs * 0.72, y - cs * 0.2, x + cs * 0.58, y - cs * 0.2], '#1b2448', l * 1.4); line([x - cs * 0.76, y - cs * 0.48, x + cs * 0.6, y - cs * 0.48], '#ffffff', l * 0.6);
  for (var p = 0; p < 4; p++) O(x - cs * 0.5 + p * cs * 0.25, y - cs * 0.34, cs * 0.045, '#bfe9ff', l * 0.4);
  R(x - cs * 0.5, y - cs * 1.05, cs * 0.72, cs * 0.5, cs * 0.04, '#ffffff', l * 0.8); for (var w = 0; w < 4; w++) R(x - cs * 0.44 + w * cs * 0.16, y - cs * 0.95, cs * 0.11, cs * 0.12, cs * 0.02, '#5a8ac0', l * 0.4);
  R(x - cs * 0.32, y - cs * 1.3, cs * 0.42, cs * 0.25, cs * 0.03, '#ffffff', l * 0.7);
  R(x + cs * 0.24, y - cs * 1.45, cs * 0.2, cs * 0.45, cs * 0.04, '#ffd54a', l * 0.7); R(x + cs * 0.24, y - cs * 1.45, cs * 0.2, cs * 0.1, cs * 0.03, '#1b2448');
  c.restore();
  smoke(x + cs * 0.34, y - cs * 1.5, cs * 0.3, t);
  for (var i = 0; i < 3; i++) P([x + cs * (0.58 + i * 0.1), y - cs * 0.05, x + cs * (0.62 + i * 0.1), y - cs * (0.16 + (i % 2) * 0.07), x + cs * (0.68 + i * 0.1), y - cs * 0.05], '#eafaff', l * 0.4);
};
DRAW.mileposts = function (x, y, cs, t, l) {   // верстовой столб в чёрно-белую полоску с табличкой, фонари
  var c = C();
  R(x - cs * 0.12, y - cs * 1.7, cs * 0.24, cs * 1.7, cs * 0.04, '#ffffff', l);
  for (var s = 0; s < 6; s++) { c.fillStyle = s % 2 ? '#ffffff' : '#1b2448'; c.beginPath(); c.moveTo(x - cs * 0.12, y - cs * (0.2 + s * 0.25)); c.lineTo(x + cs * 0.12, y - cs * (0.32 + s * 0.25)); c.lineTo(x + cs * 0.12, y - cs * (0.44 + s * 0.25)); c.lineTo(x - cs * 0.12, y - cs * (0.32 + s * 0.25)); c.closePath(); c.fill(); }
  R(x - cs * 0.12, y - cs * 1.7, cs * 0.24, cs * 1.7, cs * 0.04, null, l);
  R(x - cs * 0.45, y - cs * 1.55, cs * 0.9, cs * 0.32, cs * 0.04, '#f4e8d0', l * 0.8); D.text(Z.LANG === 'en' ? 'Tree 1 mi' : 'До ёлки 1 в.', x, y - cs * 1.39, cs * 0.16, '#3a2a1a', 'center', 'middle', 0);
  P([x - cs * 0.16, y - cs * 1.7, x, y - cs * 1.9, x + cs * 0.16, y - cs * 1.7], '#1b2448', l * 0.6); snowCap(x - cs * 0.16, y - cs * 1.72, x + cs * 0.16, y - cs * 1.72, cs * 0.12);
  [-0.75, 0.75].forEach(function (d, i) { var lx = x + d * cs; line([lx, y, lx, y - cs * 1.1], OL, l * 1.4); line([lx, y, lx, y - cs * 1.1], '#3c4f8c', l * 0.7); var fl = 0.75 + 0.25 * Math.sin(t * 9 + i * 3); c.save(); c.globalCompositeOperation = 'lighter'; var g = c.createRadialGradient(lx, y - cs * 1.2, 0, lx, y - cs * 1.2, cs * 0.6 * fl); g.addColorStop(0, 'rgba(255,210,120,0.55)'); g.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = g; c.fillRect(lx - cs * 0.6, y - cs * 1.8, cs * 1.2, cs * 1.2); c.restore(); R(lx - cs * 0.1, y - cs * 1.32, cs * 0.2, cs * 0.22, cs * 0.04, '#ffe9a0', l * 0.6); });
};
D.LM_DRAW = DRAW;
var oLm = D.landmark;
D.landmark = function (kind, x, y, cs, t) {
  var G = Z.G, mp = G && !G.endless && Z.mapOf ? Z.mapOf(G.idx) : null, k = mp ? mp.lm : null, f = k && DRAW[k];
  if (!f) { var oe = OLD_EXT[k], ody = oe ? Math.max(0, oe[2] - 0.06) : 0; return oLm.call(this, kind, x, y - (((G && G.L && G.L.lmLift) || 0) + ody) * cs, cs, t); }
  var l = Math.max(1.5, cs * 0.05), ext = null;
  if (k === 'dam' && G.L.riverRow !== undefined) { var lm = G.L.landmark; ext = { riverY: y + (G.L.riverRow + 0.5 - (lm.r + 1.9)) * cs, damX: x, gone: !!G.damGone }; }
  var F0 = fitOf(k), c = C(), L0 = G.L, F = { s: L0.lmShrink ? F0.s : 1, dy: F0.dy };
  if (L0.lmLift) y -= L0.lmLift * cs;
  try {
    D.ell(x, y - cs * 0.03, cs * 0.86, cs * 0.12, 'rgba(30,40,80,0.18)');
    if (F.s < 0.999 || F.dy > 0) { c.save(); c.translate(x, y - F.dy * cs); c.scale(F.s, F.s); c.translate(-x, -y); f(x, y, cs, t, l / F.s, ext ? { riverY: y + (ext.riverY - y + F.dy * cs) / F.s, damX: x, gone: ext.gone } : null); c.restore(); }
    else f(x, y, cs, t, l, ext);
  } catch (e) { if (!D._lmErr) { D._lmErr = 1; console.error('lm', k, e); } }
};
// 2.11.5: «пятно» ориентира — его 2×2 клетки. Всё, что лежит на земле (основание, вода, камни), обязано помещаться в пятно
// с небольшим отступом; вверх (высота) выступать можно. Один раз меряем каждый рисунок в памяти и, если он
// наезжает на соседние клетки, ужимаем и приподнимаем его. Так любой новый ориентир тоже не вылезет за свои клетки.
var FIT = {};
function fitOf(k) {
  if (FIT[k]) return FIT[k];
  var res = { s: 1, dy: 0 };
  try {
    var cs = 100, N = 520, X = 260, Yb = 320, cv = document.createElement('canvas'); cv.width = cv.height = N;
    var cx = cv.getContext('2d'), prev = D.ctx, minx = X, maxx = X, maxy = Yb;
    [0.3, 1.3, 2.7].forEach(function (tt) {
      cx.clearRect(0, 0, N, N); D.setCtx(cx);
      try { DRAW[k](X, Yb, cs, tt, 5, { riverY: Yb - 400, damX: X, gone: true }); } catch (e) { if (window.__rep) window.__rep(e); }
      D.setCtx(prev);
      var d = cx.getImageData(0, 0, N, N).data;
      for (var yy = Math.round(Yb - cs * 0.7); yy < N; yy++) for (var xx = 0; xx < N; xx++) { if (d[(yy * N + xx) * 4 + 3] < 40) continue; if (xx < minx) minx = xx; if (xx > maxx) maxx = xx; if (yy > maxy) maxy = yy; }
    });
    res.eL = (X - minx) / cs; res.eR = (maxx - X) / cs;
    var half = Math.max(X - minx, maxx - X) / cs; res.s = Math.min(1, 0.92 / Math.max(0.01, half));
    var over = (maxy - Yb) / cs * res.s - 0.06; res.dy = Math.max(0, over);
  } catch (e) { if (window.__rep) window.__rep(e); }
  FIT[k] = res; return res;
}
D.LM_FIT = fitOf;
// плотина стоит на реке: нажатие по ней работает так же, как по ориентиру
var oTap = Z.mechTap;
Z.mechTap = function (c, r) {
  var G = Z.G, L = G && G.L, lm = L && L.landmark;
  if (G && G.mech === 'dam' && lm && L.riverRow !== undefined && Math.abs(r - L.riverRow) <= 1 && Math.abs(c + 0.5 - (lm.c + 1)) <= 1.5) return oTap.call(this, lm.c, lm.r);
  return oTap.apply(this, arguments);
};

// ---------- горы: камни-«горки» превращены в скальные уступы. На уступе можно строить, вышка бьёт на 25% дальше ----------
function hh(c, r, k) { var x = Math.sin(c * 127.1 + r * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); }
D.ledgeSpot = function (x, y, cs, cc, rr) {
  var c = C(), l = Math.max(1.2, cs * 0.045), w = cs * 0.46, top = y - cs * 0.02, bot = y + cs * 0.34, j = hh(cc || 0, rr || 0, 5);
  c.save();
  c.fillStyle = 'rgba(46,40,100,0.2)'; c.beginPath(); c.ellipse(x + cs * 0.08, bot + cs * 0.04, w * 1.2, cs * 0.12, 0, 0, 7); c.fill();
  // бок скалы: гранёный, со слоями
  var side = [x - w, top, x - w * 1.04, top + cs * 0.12, x - w * 0.92, bot - cs * 0.02, x - w * 0.4, bot + cs * 0.04, x + w * 0.35, bot + cs * 0.03, x + w * 0.95, bot - cs * 0.03, x + w * 1.03, top + cs * 0.1, x + w, top];
  P(side, G2(x - w, 0, x + w, 0, '#a7a3c2', '#5e5a7e'), l);
  P([x + w * 0.15, top + cs * 0.05, x + w * 0.35, bot + cs * 0.03, x + w * 0.95, bot - cs * 0.03, x + w * 1.03, top + cs * 0.1, x + w, top], 'rgba(30,26,70,0.25)');
  c.strokeStyle = 'rgba(40,36,80,0.4)'; c.lineWidth = Math.max(1, l * 0.6); c.beginPath();
  c.moveTo(x - w * 0.95, top + cs * 0.16); c.lineTo(x - w * 0.3, top + cs * 0.2); c.lineTo(x + w * 0.2, top + cs * 0.15);
  c.moveTo(x - w * 0.5, top + cs * 0.27); c.lineTo(x + w * 0.6, top + cs * 0.24);
  c.moveTo(x - w * 0.15, top + cs * 0.06); c.lineTo(x - w * 0.25 + j * w * 0.2, bot - cs * 0.02); c.stroke();
  // плоская вершина со снегом
  var tp = []; for (var q = 0; q < 10; q++) { var a = q / 10 * Math.PI * 2, rj = 0.88 + hh(cc || 0, rr || 0, q + 11) * 0.2; tp.push(x + Math.cos(a) * w * rj, top + Math.sin(a) * cs * 0.14 * rj); }
  P(tp, '#c4c0dc', l);
  var tp2 = []; for (var q2 = 0; q2 < 10; q2++) { var a2 = q2 / 10 * Math.PI * 2, rj2 = 0.72 + hh(cc || 0, rr || 0, q2 + 31) * 0.16; tp2.push(x - cs * 0.03 + Math.cos(a2) * w * rj2, top - cs * 0.015 + Math.sin(a2) * cs * 0.11 * rj2); }
  P(tp2, '#ffffff');
  for (var i = 0; i < 4; i++) { var ix = x - w * 0.75 + i * w * 0.45 + j * cs * 0.05; P([ix - cs * 0.03, top + cs * 0.1, ix, top + cs * (0.18 + (i % 2) * 0.07), ix + cs * 0.03, top + cs * 0.1], '#e4f6ff', l * 0.4); }
  if (j < 0.5) D.ell(x - w * 0.95, bot, cs * 0.1, cs * 0.06, '#8a86a2', l * 0.6); else D.ell(x + w * 1.0, bot - cs * 0.02, cs * 0.08, cs * 0.05, '#8a86a2', l * 0.6);
  // флажок «можно строить — выше и дальше»
  line([x + w * 0.45, top + cs * 0.02, x + w * 0.45, top - cs * 0.36], '#6a4628', l * 1.1); P([x + w * 0.45, top - cs * 0.36, x + w * 0.45 + cs * 0.2, top - cs * 0.3, x + w * 0.45, top - cs * 0.23], '#e8484f', l * 0.7);
  c.restore();
};

// ---------- 2.11.5: ориентир ставится туда, где ему хватает места, а не ужимается ----------
// Правила «пятна»: все клетки пятна — на одном уровне земли (не на плато и не на горе), без дороги/воды/построек;
// ряд над пятном и соседи слева/справа — тоже на нижнем уровне (иначе обрыв плато свисает на ориентир);
// ширина пятна = сколько клеток реально занимает основание рисунка (широкий рисунок — 3–4 клетки).
// старые рисунки (арка, нора, берлога, карусель, двор Яги) — их основание замерено один раз: влево, вправо, вниз (в клетках)
var OLD_EXT = { arch: [1.3, 1.23, 0.29], hares: [1.08, 1.24, 0.35], den: [1.03, 1.02, 0.29], carousel: [0.98, 0.97, 0.29], hut: [1.02, 1.36, 0.29] };
function placeLandmark(L, idx) {
  var lm = L.landmark; if (!lm || idx >= 35 || !L.grid) return;
  var mp = Z.mapOf ? Z.mapOf(idx) : null, k = mp && mp.lm; if (k === 'stump' || k === 'stumps') return;
  var F = k && DRAW[k] ? fitOf(k) : (OLD_EXT[k] ? { eL: OLD_EXT[k][0], eR: OLD_EXT[k][1] } : { eL: 0.9, eR: 0.9 });
  var xL0 = Math.max(0, Math.ceil((F.eL || 0.9) - 1.0 - 1e-6)), xR0 = Math.max(0, Math.ceil((F.eR || 0.9) - 1.0 - 1e-6));
  var W = L.W, H = L.H, hg = L.hgt || [], ents = L.entrances || [];
  function mtnAt(c, r) { return (L.mtn && L.mtn.dec && L.mtn.dec[r * W + c]) || (Z.cellLift && L.mtn && Z._mtnDbg ? false : false); }
  function lvl(c, r) { if (c < 0 || r < 0 || c >= W || r >= H) return 0; if (mtnAt(c, r)) return 9; return (hg[r] && hg[r][c]) ? 1 : 0; }
  function mine(c, r) { return c >= lm.c && c <= lm.c + 1 && r >= lm.r && r <= lm.r + 1; }
  function free(c, r) {
    if (c < 0 || r < 0 || c >= W || r >= H) return false;
    var v = L.grid[r][c]; if (!(v === 0 || v === 6 || v === 7 || (v === 11 && mine(c, r)))) return false;
    if (ents.some(function (e) { return Math.abs(e[0] - c) <= 1 && Math.abs(e[1] - r) <= 1; })) return false;
    if (L.fort && Math.abs(c - L.fort[0]) <= 1 && r >= L.fort[1] - 1) return false;
    if (L.ledges && L.ledges[r * W + c]) return false;
    return true;
  }
  function ok(c0, r0, xL, xR) {
    if (r0 < 1 || r0 > H - 4) return false;
    var Lv = lvl(c0, r0); if (Lv > 1) return false;
    for (var c = c0 - xL; c <= c0 + 1 + xR; c++) for (var r = r0; r <= r0 + 1; r++) if (!free(c, r) || lvl(c, r) !== Lv) return false;
    // выше пятна (ряд над ним) и по бокам не должно быть земли выше пятна — иначе её обрыв ляжет на ориентир
    for (var c2 = c0 - xL - 1; c2 <= c0 + 2 + xR; c2++) { if (lvl(c2, r0 - 1) > Lv) return false; for (var r2 = r0; r2 <= r0 + 1; r2++) if (lvl(c2, r2) > Lv) return false; }
    return true;
  }
  function search(xL, xR) {
    if (ok(lm.c, lm.r, xL, xR)) return [lm.c, lm.r];
    var best = null, bd = 1e9;
    for (var r0 = 1; r0 < H - 1; r0++) for (var c0 = 0; c0 < W - 1; c0++) { if (!ok(c0, r0, xL, xR)) continue; var d = Math.hypot(c0 - lm.c, r0 - lm.r) + lvl(c0, r0) * 1.5; if (d < bd) { bd = d; best = [c0, r0]; } }
    return best;
  }
  var xL = xL0, xR = xR0, best = search(xL, xR);
  if (!best && (xL || xR)) {
    var wl = xL, wr = xR; xL = 0; xR = 0; best = search(0, 0);
    if (best) {   // пробуем расшириться вбок прямо тут: свободные клетки того же уровня, плато за ними разравниваем
      var Lb = lvl(best[0], best[1]), colOk = function (c) { return free(c, best[1]) && free(c, best[1] + 1) && lvl(c, best[1]) === Lb && lvl(c, best[1] + 1) === Lb; };
      var gl = 0, gr = 0; while (gl < wl && colOk(best[0] - gl - 1)) gl++; while (gr < wr && colOk(best[0] + 2 + gr)) gr++;
      if (gl === wl && gr === wr) { xL = gl; xR = gr; [best[0] - xL - 1, best[0] + 2 + xR].forEach(function (c) { for (var r = best[1] - 1; r <= best[1] + 1; r++) if (hg[r] && hg[r][c] && lvl(c, r) !== 9 && lvl(c, r) > Lb) hg[r][c] = 0; }); }
      else L.lmShrink = true;
    }
  }   // широкий рисунок не влез ни в одно место — ставим 2×2 и сужаем
  if (!best) {   // места нет нигде: разравниваем землю вокруг исходного места (плато рядом опускаем), рисунок не трогаем
    var c0 = lm.c, r0 = lm.r, Lv = 0, fail = false; xL = xR = 0;
    for (var fc = c0 - 1; fc <= c0 + 2; fc++) for (var fr = r0 - 1; fr <= r0 + 1; fr++) { if (fc < 0 || fr < 0 || fc >= W || fr >= H) continue; if (lvl(fc, fr) === 9) fail = true; else if (hg[fr] && hg[fr][fc]) hg[fr][fc] = 0; }
    if (fail) { L.lmShrink = true; return; }
    best = [c0, r0];
  }
  for (var q = 0; q < 2; q++) for (var p = 0; p < 2; p++) if (L.grid[lm.r + q] && L.grid[lm.r + q][lm.c + p] === 11) L.grid[lm.r + q][lm.c + p] = 0;
  lm.c = best[0]; lm.r = best[1];
  for (var cc = lm.c - xL; cc <= lm.c + 1 + xR; cc++) for (var rr = lm.r; rr <= lm.r + 1; rr++) { L.grid[rr][cc] = 11; var kk = rr * W + cc; if (L.bush) delete L.bush[kk]; if (L.drift) delete L.drift[kk]; }
  L.lmPad = { l: xL, r: xR }; L.lmLift = lvl(lm.c, lm.r) ? 0.32 : 0;
}
var oGen = Z.genLevel;
Z.genLevel = function (idx, dims) {
  var L = oGen.apply(this, arguments);
  try { placeLandmark(L, idx); } catch (e) { if (window.__rep) window.__rep(e); }
  try {
    var reg = Math.floor(idx / 7);
    if (idx < 35 && reg === 3 && L.grid) { L.ledges = L.ledges || {}; var n = 0;
      var cand = [];
      for (var r = 0; r < L.H; r++) for (var c = 0; c < L.W; c++) { var k = r * L.W + c; if (L.grid[r][c] !== 7 || (L.mtn && L.mtn.dec && L.mtn.dec[k])) continue;
        var road = 0; for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++) if (L.grid[r + dr] && L.grid[r + dr][c + dc] === 1) road++;
        if (road) cand.push([road + hh(c, r, idx) * 2, c, r]); }
      cand.sort(function (a, b) { return b[0] - a[0]; });
      var pick = [];   // до 6 уступов у дороги, не вплотную друг к другу
      cand.forEach(function (q) { if (pick.length < 6 && pick.every(function (p) { return Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) > 2; })) pick.push(q); });
      pick.forEach(function (q) { var k = q[2] * L.W + q[1]; L.grid[q[2]][q[1]] = 3; L.ledges[k] = 1; n++; if (L.bush) delete L.bush[k]; if (L.drift) delete L.drift[k]; });
      L.ledgeN = n; }
  } catch (e) { if (window.__rep) window.__rep(e); }
  return L;
};
var oUpdL = Z.update;
Z.update = function (dt) {
  oUpdL.apply(this, arguments);
  var G = Z.G; if (!G || !G.L || !G.L.ledgeN || G._ledgeTip || !Z.ui || Z.ui.screen !== 'level') return;
  G._ledgeT = (G._ledgeT || 0) + dt;
  if (G._ledgeT > 6 && !(G.banner && G.banner.t > 0)) { G._ledgeTip = 1; if (!(Z.save.seen && Z.save.seen.ledge)) { Z.save.seen.ledge = 1; G.banner = { text: TT('Скальные уступы', 'Rock ledges'), sub: TT('Вышка на уступе с флажком видит и бьёт на четверть дальше', 'A tower on a flagged ledge sees and shoots a quarter farther'), t: 4 }; } }
};

// ---------- 2.11.5: значок уровня на карте — его ориентир в миниатюре ----------
var LMK = ['stump', 'stumps', 'arch', 'hares', 'mill', 'eyetrees', 'den', 'scarecrow', 'carousel', 'windmill', 'hut', 'well', 'bridges', 'slide', 'boat', 'fishhuts', 'lighthouse', 'river', 'lights', 'dam', 'stonebridge', 'slopes', 'cable', 'springs', 'crystals', 'ropebridge', 'gates', 'castle', 'aurora', 'vane', 'icebergs', 'ship', 'icewalls', 'mileposts', 'palace'];
Z.mapLmKind = function (idx) { var mp = Z.mapOf && Z.mapOf(idx); return (mp && mp.lm) || LMK[idx]; };
Z.mapLm = function (idx, x, y, cs, t) {
  var k = Z.mapLmKind(idx), c = C(), l = Math.max(1.2, cs * 0.06);
  try {
    D.ell(x, y, cs * 0.85, cs * 0.18, 'rgba(30,40,80,0.16)');
    if (DRAW[k] && k !== 'dam') { DRAW[k](x, y, cs, t, l, null); return; }
    if (k === 'dam') { DRAW.dam(x, y, cs, t, l, null); return; }
    if (k === 'stump' || k === 'stumps') { if (D.stumpSpot) D.stumpSpot(x, y - cs * 0.3, cs * 1.4); if (k === 'stumps' && D.stumpSpot) D.stumpSpot(x + cs * 0.75, y - cs * 0.05, cs * 0.8); return; }
    if (k === 'arch') {   // просека: две ели и бревенчатая арка со звездой
      D.pine(x - cs * 0.62, y, cs * 1.5, '#24804f', true); D.pine(x + cs * 0.62, y, cs * 1.4, '#2f8f5b', true);
      line([x - cs * 0.45, y, x - cs * 0.45, y - cs * 1.15], OL, l * 2); line([x + cs * 0.45, y, x + cs * 0.45, y - cs * 1.15], OL, l * 2);
      line([x - cs * 0.45, y, x - cs * 0.45, y - cs * 1.15], '#8a5a35', l); line([x + cs * 0.45, y, x + cs * 0.45, y - cs * 1.15], '#8a5a35', l);
      R(x - cs * 0.6, y - cs * 1.32, cs * 1.2, cs * 0.22, cs * 0.06, '#c9504a', l); D.star(x, y - cs * 1.21, cs * 0.12, '#ffd54a', 1); snowCap(x - cs * 0.6, y - cs * 1.32, x + cs * 0.6, y - cs * 1.32, cs * 0.08); return; }
    if (k === 'hares') {   // заячья нора: снежный холм с норой, торчат уши
      c.beginPath(); c.moveTo(x - cs * 0.9, y); c.quadraticCurveTo(x, y - cs * 1.1, x + cs * 0.9, y); c.closePath(); c.fillStyle = '#f4f8ff'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
      E(x + cs * 0.15, y - cs * 0.22, cs * 0.24, cs * 0.18, '#2a2438', l * 0.7);
      var tw = Math.sin(t * 3) * 0.12; [[-0.42, -0.1], [-0.28, 0.1]].forEach(function (q) { c.save(); c.translate(x + q[0] * cs, y - cs * 0.52); c.rotate(q[1] + tw); E(0, -cs * 0.22, cs * 0.07, cs * 0.24, '#ffffff', l * 0.7); E(0, -cs * 0.22, cs * 0.03, cs * 0.16, '#ffc0d0'); c.restore(); });
      return; }
    if (k === 'den') {   // берлога: снежный купол, в лазе спит медведь
      c.beginPath(); c.moveTo(x - cs, y); c.quadraticCurveTo(x, y - cs * 1.4, x + cs, y); c.closePath(); c.fillStyle = '#eef4ff'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
      c.beginPath(); c.moveTo(x - cs * 0.5, y); c.quadraticCurveTo(x, y - cs * 0.9, x + cs * 0.5, y); c.closePath(); c.fillStyle = '#2a2438'; c.fill(); c.stroke();
      if (D.bear) D.bear(x, y - cs * 0.02, cs * 0.42, { mode: 'sleep', dir: 1 }); return; }
    if (k === 'carousel' && D.carousel) { D.carousel(x, y, cs * 0.9, t * 1.1, { simple: true }); return; }
    if (k === 'hut' && Z.drawHut) { Z.drawHut(x, y, cs * 0.75, t, false, { smoke: true }); return; }
    if (k === 'stonebridge' && D.kbridge) { D.kbridge(x, y, cs * 2.0, cs * 0.9, l, t); return; }
    if (k === 'castle' && Z.MDIR && Z.MDIR.drawProp) { c.save(); c.translate(x, y); c.scale(0.55, 0.55); Z.MDIR.drawProp('castle', 0, 0, cs * 1.3, t, {}); c.restore(); return; }
  } catch (e) { if (window.__rep) window.__rep(e); }
};
})();
