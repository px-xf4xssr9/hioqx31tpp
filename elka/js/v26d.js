/* 2.6 · рисование: новые герои, враги, боссы, постройки, ориентиры 35 карт, вода и волны, погода, эффекты */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = D.OL, COL = D.COL;
function c() { return D.ctx; }
function circ(x, y, r, f, l) { D.circ(x, y, r, f, l); }
function ell(x, y, rx, ry, f, l) { D.ell(x, y, rx, ry, f, l); }
function poly(p, f, l) { D.poly(p, f, l); }
function line(pts, col, w) { var x = c(); x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.stroke(); }
function eyes(x, y, R, d, col) { circ(x - R * 0.13 + d * R * 0.05, y, R * 0.07, '#fff'); circ(x + R * 0.13 + d * R * 0.05, y, R * 0.07, '#fff'); circ(x - R * 0.11 + d * R * 0.07, y, R * 0.035, col || OL); circ(x + R * 0.15 + d * R * 0.07, y, R * 0.035, col || OL); }

// ---------- новые герои (x,y — ноги, R — рост) ----------
var heroes = {
  emelya: function (x, y, R, o) {
    var ctx = c(), d = o.dir || 1, l = Math.max(1.2, R * 0.06), bob = o.walk ? Math.sin(Z.time * 12) * R * 0.03 : 0;
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(d, 1);
    // лыжи
    line([-R * 0.75, R * 0.02, R * 0.7, R * 0.02, R * 0.85, -R * 0.1], '#8a5a35', l * 1.6);
    // печь
    D.rr(-R * 0.6, -R * 0.75, R * 1.15, R * 0.72, R * 0.12); ctx.fillStyle = '#f4ede2'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    D.rr(-R * 0.6, -R * 0.2, R * 1.15, R * 0.17, R * 0.05); ctx.fillStyle = '#c8644a'; ctx.fill(); ctx.stroke();
    D.rr(-R * 0.15, -R * 0.55, R * 0.42, R * 0.3, R * 0.15); ctx.fillStyle = '#3a2a2a'; ctx.fill(); ctx.stroke();
    circ(R * 0.06, -R * 0.38, R * 0.08, 'rgba(255,170,60,' + (0.6 + 0.3 * Math.sin(Z.time * 9)).toFixed(2) + ')');
    // труба-мортира
    ctx.save(); ctx.translate(R * 0.38, -R * 0.75); ctx.rotate(-0.35 - (o.atk ? 0.2 : 0)); D.rr(-R * 0.09, -R * 0.42, R * 0.18, R * 0.44, R * 0.04); ctx.fillStyle = '#9aa1b5'; ctx.fill(); ctx.stroke(); ctx.restore();
    // Емеля лежит сверху на подушке
    ell(-R * 0.25, -R * 0.82, R * 0.28, R * 0.1, '#ffffff', l * 0.7);
    D.rr(-R * 0.2, -R * 0.95, R * 0.62, R * 0.2, R * 0.1); ctx.fillStyle = '#d84a4a'; ctx.fill(); ctx.stroke();
    circ(-R * 0.32, -R * 0.98, R * 0.17, '#ffd7b0', l);
    circ(-R * 0.38, -R * 0.95, R * 0.02, '#c47a4a'); circ(-R * 0.26, -R * 0.93, R * 0.02, '#c47a4a');
    D.rr(-R * 0.52, -R * 1.18, R * 0.4, R * 0.14, R * 0.06); ctx.fillStyle = '#7a5a3a'; ctx.fill(); ctx.stroke();
    ell(-R * 0.52, -R * 1.02, R * 0.06, R * 0.1, '#7a5a3a', l * 0.6);
    eyes(-R * 0.3, -R * 1.0, R * 0.9, 1);
    // дым
    for (var i = 0; i < 3; i++) { var p = (Z.time * 0.8 + i / 3) % 1; ctx.globalAlpha = 0.5 * (1 - p); circ(R * 0.55 + p * R * 0.2, -R * 1.25 - p * R * 0.6, R * (0.08 + p * 0.1), '#e8eef9'); }
    ctx.globalAlpha = 1; ctx.restore();
  },
  kolobok: function (x, y, R, o) {
    var ctx = c(), d = o.dir || 1, l = Math.max(1.2, R * 0.06), r = R * 0.36, roll = o.walk ? Z.time * 10 * d : 0;
    ell(x, y, r * 0.9, r * 0.25, 'rgba(30,40,80,0.2)');
    ctx.save(); ctx.translate(x, y - r);
    var g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#e0a03a');
    circ(0, 0, r, g, l);
    ctx.save(); ctx.rotate(roll * 0.05); D.rr(-r, -r * 0.55, r * 2, r * 0.2, r * 0.08); ctx.fillStyle = '#e8484f'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke(); ctx.restore();
    eyes(d * r * 0.15, -r * 0.1, r * 1.6, d);
    ctx.beginPath(); ctx.arc(d * r * 0.18, r * 0.2, r * 0.25, 0.2, Math.PI - 0.2); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
    circ(d * r * 0.55, r * 0.1, r * 0.1, 'rgba(240,110,90,0.5)');
    ctx.restore();
  },
  vasilisa: function (x, y, R, o) {
    var ctx = c(), d = o.dir || 1, l = Math.max(1.2, R * 0.06), w = o.walk ? Math.sin(Z.time * 10) * R * 0.05 : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
    ell(0, 0, R * 0.35, R * 0.1, 'rgba(30,40,80,0.2)');
    poly([-R * 0.32, 0, -R * 0.16, -R * 0.75, R * 0.16, -R * 0.75, R * 0.32, 0], '#6b4fc8', l);
    poly([-R * 0.08, -R * 0.75, R * 0.08, -R * 0.75, R * 0.12, 0, -R * 0.12, 0], '#ffd54a');
    for (var i = 0; i < 3; i++) circ(0, -R * (0.15 + i * 0.2), R * 0.03, '#e8484f');
    circ(0, -R * 0.92, R * 0.2, '#ffe2c8', l);
    // коса и косынка
    ctx.strokeStyle = '#b5652a'; ctx.lineWidth = R * 0.08; ctx.beginPath(); ctx.moveTo(-R * 0.15, -R * 0.9); ctx.quadraticCurveTo(-R * 0.3, -R * 0.6, -R * 0.2 + w, -R * 0.35); ctx.stroke();
    poly([-R * 0.24, -R * 0.98, R * 0.24, -R * 0.98, R * 0.16, -R * 1.14, -R * 0.16, -R * 1.14], '#2fae7a', l * 0.8);
    // очки
    ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.beginPath(); ctx.arc(-R * 0.03, -R * 0.92, R * 0.065, 0, 7); ctx.moveTo(R * 0.165, -R * 0.92); ctx.arc(R * 0.1, -R * 0.92, R * 0.065, 0, 7); ctx.stroke();
    circ(-R * 0.03, -R * 0.92, R * 0.025, OL); circ(R * 0.1, -R * 0.92, R * 0.025, OL);
    // клубок в руке
    var gl = 0.6 + 0.4 * Math.sin(Z.time * 5); ctx.globalAlpha = 0.35 * gl; circ(R * 0.38, -R * 0.55, R * 0.18, '#d9b8ff'); ctx.globalAlpha = 1;
    circ(R * 0.38, -R * 0.55, R * 0.1, '#e8d2ff', l * 0.7);
    ctx.restore();
  },
  kot: function (x, y, R, o) {
    var ctx = c(), d = o.dir || 1, l = Math.max(1.2, R * 0.06), tail = Math.sin(Z.time * 3) * 0.3;
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
    ell(0, 0, R * 0.4, R * 0.1, 'rgba(30,40,80,0.2)');
    ctx.strokeStyle = OL; ctx.lineWidth = R * 0.14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-R * 0.25, -R * 0.1); ctx.quadraticCurveTo(-R * 0.6, -R * 0.2, -R * 0.5 + tail * R * 0.2, -R * 0.55); ctx.stroke();
    ctx.strokeStyle = '#8a95b5'; ctx.lineWidth = R * 0.09; ctx.stroke();
    ell(0, -R * 0.3, R * 0.3, R * 0.32, '#8a95b5', l); ell(R * 0.04, -R * 0.24, R * 0.15, R * 0.2, '#d8dce8');
    circ(R * 0.05, -R * 0.75, R * 0.24, '#9aa3bf', l);
    poly([-R * 0.15, -R * 0.88, -R * 0.12, -R * 1.08, R * 0.02, -R * 0.93], '#9aa3bf', l * 0.8); poly([R * 0.1, -R * 0.93, R * 0.22, -R * 1.08, R * 0.26, -R * 0.86], '#9aa3bf', l * 0.8);
    // ночной колпак
    poly([-R * 0.18, -R * 0.9, R * 0.28, -R * 0.92, R * 0.5, -R * 1.25], '#3f4f9a', l * 0.7); circ(R * 0.5, -R * 1.25, R * 0.06, '#ffd54a');
    // сонные глаза
    ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.beginPath(); ctx.arc(-R * 0.04, -R * 0.76, R * 0.05, 0.2, Math.PI - 0.2); ctx.moveTo(R * 0.2, -R * 0.76); ctx.arc(R * 0.15, -R * 0.76, R * 0.05, 0.2, Math.PI - 0.2); ctx.stroke();
    circ(R * 0.06, -R * 0.68, R * 0.03, '#ff9ab0');
    // гусли
    poly([R * 0.18, -R * 0.2, R * 0.42, -R * 0.42, R * 0.42, -R * 0.12], '#c79055', l * 0.7);
    ctx.restore();
  }
};
var oldAlly = D.ally;
D.ally = function (type, x, y, R, o) { o = o || {}; if (heroes[type]) heroes[type](x, y, R, o); else oldAlly(type, x, y, R, o); };

// ---------- новые враги ----------
var oldEnemy = D.enemy;
var NEW_E = { leshy: 1, raz: 1, yaga: 1, kiki: 1, solovey: 1, hare: 1, duck: 1, gorynych: 1, koschei: 1 };
D.enemy = function (e, x, y, cs, t) {
  if (!NEW_E[e.type]) return oldEnemy(e, x, y, cs, t);
  var ctx = c(), R = cs * 0.31 * e.size, l = Math.max(1.2, R * 0.12), d = e.dir || 1, T = e.type, fl = e.hitT > 0;
  var hop = e.air ? Math.sin(t * 2 + e.ph) * R * 0.15 : Math.abs(Math.sin(e.walk)) * R * 0.12;
  ctx.save(); ctx.translate(x, y);
  if (e.hideT > 0) ctx.globalAlpha = 0.35;
  ell(0, e.air ? R * 0.8 : 0, R * 0.9, R * 0.28, 'rgba(30,40,80,0.18)');
  ctx.translate(-(e.kb > 0 ? d * R * 0.25 : 0), -hop - (e.air ? R * 1.3 : 0));
  if (e.corpse !== undefined) { ctx.rotate(d * e.corpse * 1.5); ctx.globalAlpha = Math.max(0, 1 - e.corpse); }
  if (e.slow > 0) { ctx.globalAlpha *= 0.5; circ(0, -R * 0.8, R * 1.05, '#bfefff'); ctx.globalAlpha = e.hideT > 0 ? 0.35 : 1; }
  if (e.iced > 0) { ctx.globalAlpha = 0.55; D.rr(-R * 0.9, -R * 1.9, R * 1.8, R * 1.9, R * 0.3); ctx.fillStyle = '#bfefff'; ctx.fill(); ctx.globalAlpha = 1; }
  ctx.scale(d, 1);
  if (T === 'leshy') {
    poly([-R * 0.55, 0, -R * 0.4, -R * 1.5, R * 0.4, -R * 1.5, R * 0.55, 0], fl ? '#fff' : '#7a5a3a', l);
    for (var i = 0; i < 3; i++) line([-R * 0.3 + i * R * 0.3, -R * 0.2, -R * 0.25 + i * R * 0.3, -R * 1.2], '#5a4028', l * 0.6);
    poly([-R * 0.45, -R * 0.9, 0, -R * 0.2, R * 0.45, -R * 0.9], '#3f8a4a', l);
    circ(-R * 0.15, -R * 1.15, R * 0.09, '#ffe066'); circ(R * 0.15, -R * 1.15, R * 0.09, '#ffe066'); circ(-R * 0.13, -R * 1.15, R * 0.04, OL); circ(R * 0.17, -R * 1.15, R * 0.04, OL);
    line([-R * 0.3, -R * 1.45, -R * 0.6, -R * 2.0, -R * 0.8, -R * 1.9], '#5a4028', l * 1.2); line([R * 0.3, -R * 1.45, R * 0.55, -R * 2.05, R * 0.8, -R * 2.0], '#5a4028', l * 1.2);
    circ(-R * 0.75, -R * 1.92, R * 0.12, '#3f8a4a'); circ(R * 0.78, -R * 2.0, R * 0.12, '#3f8a4a');
  } else if (T === 'raz') {
    ell(0, -R * 0.6, R * 0.42, R * 0.5, fl ? '#fff' : '#d84a4a', l);
    for (var s = 0; s < 3; s++) line([-R * 0.35, -R * (0.35 + s * 0.2), R * 0.35, -R * (0.35 + s * 0.2)], '#f2e6d0', l * 0.6);
    circ(0, -R * 1.3, R * 0.33, '#f1c9a0', l);
    D.rr(-R * 0.38, -R * 1.62, R * 0.76, R * 0.2, R * 0.08); ctx.fillStyle = '#3a3f5c'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ell(R * 0.08, -R * 1.18, R * 0.24, R * 0.08, '#4a3020'); eyes(R * 0.06, -R * 1.33, R * 1.4, 1);
    // бочка с фитилём
    ctx.save(); ctx.translate(R * 0.5, -R * 0.75); D.rr(-R * 0.28, -R * 0.35, R * 0.56, R * 0.7, R * 0.15); ctx.fillStyle = '#9a6a3a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    line([-R * 0.28, -R * 0.12, R * 0.28, -R * 0.12], OL, l * 0.7); line([-R * 0.28, R * 0.15, R * 0.28, R * 0.15], OL, l * 0.7);
    line([0, -R * 0.35, R * 0.1, -R * 0.6], '#3d3d3d', l * 0.6); circ(R * 0.1, -R * 0.62, R * (0.07 + 0.04 * Math.sin(t * 30)), '#ffd54a'); ctx.restore();
  } else if (T === 'yaga') {
    poly([-R * 0.55, -R * 0.2, -R * 0.42, R * 0.45, R * 0.42, R * 0.45, R * 0.55, -R * 0.2], fl ? '#fff' : '#8a8f9e', l);
    ell(0, -R * 0.2, R * 0.55, R * 0.14, '#6a6f7e', l);
    circ(0, -R * 0.7, R * 0.32, '#e8d0b0', l);
    poly([-R * 0.4, -R * 0.75, 0, -R * 1.15, R * 0.4, -R * 0.75, R * 0.3, -R * 0.55, -R * 0.3, -R * 0.55], '#5a2a6a', l);
    poly([R * 0.12, -R * 0.68, R * 0.5, -R * 0.6, R * 0.14, -R * 0.56], '#e8c0a0', l * 0.6); eyes(R * 0.02, -R * 0.75, R * 1.2, 1);
    line([-R * 0.8, R * 0.3, R * 0.2, -R * 1.0], '#8a5a35', l * 1.2); poly([-R * 0.8, R * 0.3, -R * 1.1, R * 0.55, -R * 0.6, R * 0.5], '#d8b86a', l * 0.6);
  } else if (T === 'kiki') {
    ell(0, -R * 0.55, R * 0.45, R * 0.55, fl ? '#fff' : '#5aa06a', l);
    circ(0, -R * 1.15, R * 0.32, '#7cc08a', l);
    for (var k = 0; k < 5; k++) line([-R * 0.25 + k * R * 0.12, -R * 1.35, -R * 0.3 + k * R * 0.15, -R * 1.85 + Math.sin(t * 3 + k) * R * 0.05], '#4a7a3a', l * 0.8);
    eyes(R * 0.05, -R * 1.18, R * 1.5, 1, '#3a1a4a');
    ctx.beginPath(); ctx.arc(R * 0.05, -R * 1.02, R * 0.12, 0.3, Math.PI - 0.3); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
  } else if (T === 'solovey') {
    // сидит на суку дерева у дороги
    D.rr(-R * 0.25, -R * 2.6, R * 0.5, R * 2.6, R * 0.1); ctx.fillStyle = '#6b4a2f'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    line([0, -R * 1.6, R * 0.9, -R * 1.9], '#6b4a2f', l * 2.5);
    circ(-R * 0.1, -R * 2.9, R * 0.75, '#2a7f5a', l); circ(R * 0.5, -R * 2.7, R * 0.5, '#2f8f63', l);
    ctx.save(); ctx.translate(R * 0.55, -R * 1.95);
    ell(0, -R * 0.3, R * 0.35, R * 0.4, fl ? '#fff' : '#4a5a8a', l);
    var puff = e.whistle > 0 ? 1.3 : 1;
    circ(0, -R * 0.9, R * 0.3 * puff, '#f1c9a0', l);
    ell(R * 0.05, -R * 0.78, R * 0.32, R * 0.08, '#3d2a1a');
    if (e.snore) { D.text('z', R * 0.4, -R * 1.4 - (t % 1) * R * 0.3, R * 0.4, '#fff'); } else eyes(R * 0.02, -R * 0.95, R * 1.1, 1);
    if (e.whistle > 0) circ(R * 0.28, -R * 0.82, R * 0.07, OL);
    D.rr(-R * 0.3, -R * 1.22, R * 0.6, R * 0.16, R * 0.06); ctx.fillStyle = '#e8484f'; ctx.fill(); ctx.stroke();
    ctx.restore();
  } else if (T === 'hare') {
    ell(0, -R * 0.4, R * 0.42, R * 0.35, fl ? '#ffe' : '#ffffff', l);
    circ(R * 0.3, -R * 0.75, R * 0.25, '#ffffff', l);
    ell(R * 0.22, -R * 1.15, R * 0.07, R * 0.28, '#ffffff', l * 0.7); ell(R * 0.38, -R * 1.12, R * 0.07, R * 0.26, '#ffffff', l * 0.7);
    circ(R * 0.42, -R * 0.78, R * 0.04, OL); circ(R * 0.55, -R * 0.7, R * 0.04, '#ff9ab0');
  } else if (T === 'duck') {
    var fl2 = Math.sin(t * 16) * R * 0.25;
    ell(0, -R * 0.4, R * 0.5, R * 0.3, fl ? '#fff' : '#9a7a4a', l);
    poly([-R * 0.1, -R * 0.5, -R * 0.5, -R * 0.9 - fl2, R * 0.2, -R * 0.6], '#7a5a3a', l * 0.8);
    circ(R * 0.45, -R * 0.65, R * 0.2, '#2f7a4a', l); poly([R * 0.6, -R * 0.68, R * 0.85, -R * 0.62, R * 0.6, -R * 0.56], '#ffb347', l * 0.6); circ(R * 0.5, -R * 0.7, R * 0.035, OL);
    if (Z.G && Z.G.kos && Z.G.kos.stage === 2) ell(0, -R * 0.05, R * 0.14, R * 0.18, '#fff8e8', l * 0.6);
  } else if (T === 'gorynych') {
    var lost = e.headsLost || 0;
    ell(0, -R * 0.55, R * 0.85, R * 0.6, fl ? '#fff' : '#3f8a4a', l);
    ell(R * 0.1, -R * 0.4, R * 0.5, R * 0.35, '#b8d86a');
    poly([-R * 0.6, -R * 0.7, -R * 1.3, -R * 1.5, -R * 0.9, -R * 0.5], '#2f6a3a', l);
    line([-R * 0.8, -R * 0.2, -R * 1.4, R * 0.05, -R * 1.6, -R * 0.15], '#3f8a4a', l * 2.5);
    [[-0.45, '#bfe6ff'], [0.05, '#e8eef9'], [0.55, '#ffb347']].forEach(function (h, i) {
      var nx = R * h[0], ny = -R * 1.45 - (i === 1 ? R * 0.2 : 0) + Math.sin(t * 2 + i) * R * 0.05;
      line([R * h[0] * 0.5, -R * 0.9, nx, ny], OL, l * 3.2); line([R * h[0] * 0.5, -R * 0.9, nx, ny], '#3f8a4a', l * 2);
      var dead = (i === 2 && lost >= 1) || (i === 1 && lost >= 2) || (i === 0 && lost >= 3);
      if (dead) { circ(nx, ny, R * 0.12, '#f2e6d0', l * 0.6); line([nx - R * 0.1, ny, nx + R * 0.1, ny], '#e8484f', l * 0.6); return; }
      ell(nx, ny, R * 0.26, R * 0.2, '#4a9a5a', l); circ(nx + R * 0.08, ny - R * 0.06, R * 0.05, '#ffe066'); circ(nx + R * 0.09, ny - R * 0.06, R * 0.025, OL);
      poly([nx + R * 0.18, ny + R * 0.02, nx + R * 0.36, ny + R * 0.08, nx + R * 0.18, ny + R * 0.12], h[1], l * 0.5);
      poly([nx - R * 0.1, ny - R * 0.18, nx - R * 0.05, ny - R * 0.34, nx + R * 0.02, ny - R * 0.18], '#ffd54a', l * 0.5);
    });
  } else if (T === 'koschei') {
    var imm = !(Z.G && ((Z.G.kos && Z.G.kos.stage >= 4) || e.mortal));
    if (imm) { ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 4); circ(0, -R * 0.9, R * 1.05, '#9a7cff'); ctx.globalAlpha = 1; }
    poly([-R * 0.45, 0, -R * 0.2, -R * 1.3, R * 0.2, -R * 1.3, R * 0.45, 0], fl ? '#fff' : '#2a2340', l);
    line([-R * 0.2, -R * 1.1, -R * 0.55, -R * 0.55], '#2a2340', l * 2.2); line([R * 0.2, -R * 1.1, R * 0.6, -R * 0.6], '#2a2340', l * 2.2);
    circ(-R * 0.55, -R * 0.52, R * 0.07, '#d8d0c0'); circ(R * 0.6, -R * 0.57, R * 0.07, '#d8d0c0');
    ell(0, -R * 1.55, R * 0.24, R * 0.3, '#d8d0c0', l);
    circ(-R * 0.08, -R * 1.58, R * 0.06, '#3a2a5a'); circ(R * 0.1, -R * 1.58, R * 0.06, '#3a2a5a'); circ(-R * 0.08, -R * 1.58, R * 0.02, '#7fffd0'); circ(R * 0.1, -R * 1.58, R * 0.02, '#7fffd0');
    poly([-R * 0.24, -R * 1.78, -R * 0.2, -R * 2.0, -R * 0.08, -R * 1.86, 0, -R * 2.05, R * 0.08, -R * 1.86, R * 0.2, -R * 2.0, R * 0.24, -R * 1.78], '#ffd54a', l * 0.6);
    line([R * 0.6, -R * 0.6, R * 0.75, -R * 1.9], '#8a8f9e', l * 1.2);
  }
  ctx.restore();
};

// ---------- новые постройки ----------
var oldStruct = D.struct, OLD_ST = { palisade: 1, watch: 1, sentry: 1 };
D.struct = function (s, x, y, cs, t) {
  if (OLD_ST[s.type]) return oldStruct(s, x, y, cs, t);
  var ctx = c(), l = Math.max(1.2, cs * 0.04), rise = s.done ? 1 : Math.max(0.1, s.prog || 1);
  if (!s.done) { oldStruct({ type: 'palisade', done: false, prog: s.prog, stalled: s.stalled, fade: s.fade, hp: s.hp, max: s.max, hitT: 0 }, x, y, cs, t); return; }
  ctx.save(); ctx.translate(x + (s.hitT > 0 ? Math.sin(t * 70) * cs * 0.03 : 0), y); ctx.scale(1, rise);
  ell(cs * 0.05, cs * 0.02, cs * 0.42, cs * 0.12, 'rgba(30,40,80,0.22)');
  var T = s.type;
  if (T === 'snowtower') {
    poly([-cs * 0.32, 0, -cs * 0.2, -cs * 0.95, cs * 0.2, -cs * 0.95, cs * 0.32, 0], '#8a5a35', l);
    line([-cs * 0.28, -cs * 0.3, cs * 0.24, -cs * 0.7], '#5a3a20', l * 0.8); line([cs * 0.28, -cs * 0.3, -cs * 0.24, -cs * 0.7], '#5a3a20', l * 0.8);
    D.rr(-cs * 0.32, -cs * 1.2, cs * 0.64, cs * 0.26, cs * 0.04); ctx.fillStyle = '#a8784a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    for (var i = 0; i < 3; i++) circ(-cs * 0.18 + i * cs * 0.18, -cs * 1.25, cs * 0.08, '#fff', l * 0.6);
  } else if (T === 'catapult') {
    D.rr(-cs * 0.38, -cs * 0.25, cs * 0.76, cs * 0.22, cs * 0.05); ctx.fillStyle = '#8a5a35'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    circ(-cs * 0.26, -cs * 0.03, cs * 0.1, '#5a3a20', l * 0.6); circ(cs * 0.26, -cs * 0.03, cs * 0.1, '#5a3a20', l * 0.6);
    var arm = s.cd > 5 ? -0.3 : 0.6; ctx.save(); ctx.translate(0, -cs * 0.3); ctx.rotate(arm); line([0, 0, -cs * 0.55, -cs * 0.45], '#6b4a2f', l * 2); circ(-cs * 0.58, -cs * 0.5, cs * 0.12, '#fff', l * 0.7); ctx.restore();
  } else if (T === 'workshop') {
    D.rr(-cs * 0.42, -cs * 0.6, cs * 0.84, cs * 0.6, cs * 0.04); ctx.fillStyle = '#9a6a3a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    poly([-cs * 0.5, -cs * 0.6, 0, -cs * 0.95, cs * 0.5, -cs * 0.6], '#6b3fa0', l);
    D.rr(-cs * 0.12, -cs * 0.35, cs * 0.24, cs * 0.35, cs * 0.03); ctx.fillStyle = '#3a2a2a'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(cs * 0.3, -cs * 0.75); ctx.rotate(t * 3); for (var g = 0; g < 6; g++) { ctx.rotate(Math.PI / 3); poly([0, -cs * 0.12, cs * 0.04, -cs * 0.16, -cs * 0.04, -cs * 0.16], '#c9d0dc'); } circ(0, 0, cs * 0.09, '#c9d0dc', l * 0.6); ctx.restore();
  } else if (T === 'crossing') {
    for (var p = 0; p < 4; p++) { D.rr(-cs * 0.45, -cs * 0.4 + p * cs * 0.12, cs * 0.9, cs * 0.1, cs * 0.02); ctx.fillStyle = p % 2 ? '#a8784a' : '#9a6a3a'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke(); }
  } else if (T === 'totem') {
    poly([-cs * 0.18, 0, -cs * 0.12, -cs * 1.0, cs * 0.12, -cs * 1.0, cs * 0.18, 0], '#bfe6ff', l);
    circ(0, -cs * 1.1, cs * 0.14, 'rgba(160,255,200,' + (0.6 + 0.3 * Math.sin(t * 4)).toFixed(2) + ')', l * 0.7);
    ctx.globalAlpha = 0.12; circ(0, -cs * 0.4, cs * 2, '#7dffb2'); ctx.globalAlpha = 1;
  } else if (T === 'drum') {
    ell(0, -cs * 0.25, cs * 0.35, cs * 0.12, '#e8d8b0', l); D.rr(-cs * 0.35, -cs * 0.25, cs * 0.7, cs * 0.3, cs * 0.03); ctx.fillStyle = '#d84a4a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); ell(0, -cs * 0.25, cs * 0.35, cs * 0.12, '#e8d8b0', l);
    var bt = Math.sin(t * 12) > 0 && !(s.sleep > 0); line([-cs * 0.2, -cs * (bt ? 0.3 : 0.55), -cs * 0.35, -cs * 0.75], '#8a5a35', l); line([cs * 0.2, -cs * (bt ? 0.55 : 0.3), cs * 0.35, -cs * 0.75], '#8a5a35', l);
    if (s.sleep > 0) D.text('z', cs * 0.3, -cs * 0.9, cs * 0.3, '#fff');
  } else if (T === 'powder') {
    for (var b = 0; b < 3; b++) { var bx = -cs * 0.25 + b * cs * 0.25, by = b === 1 ? -cs * 0.3 : 0; D.rr(bx - cs * 0.13, by - cs * 0.32, cs * 0.26, cs * 0.32, cs * 0.06); ctx.fillStyle = '#9a6a3a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); D.text('☠', bx, by - cs * 0.16, cs * 0.14, '#fff'); }
  } else if (T === 'frostgun') {
    D.rr(-cs * 0.3, -cs * 0.3, cs * 0.6, cs * 0.3, cs * 0.06); ctx.fillStyle = '#e8eef9'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.save(); ctx.translate(0, -cs * 0.35); ctx.rotate(-0.4); D.rr(0, -cs * 0.1, cs * 0.5, cs * 0.2, cs * 0.08); ctx.fillStyle = '#bfe6ff'; ctx.fill(); ctx.stroke(); ctx.restore();
  } else if (T === 'lodge') {
    D.rr(-cs * 0.38, -cs * 0.55, cs * 0.76, cs * 0.55, cs * 0.05); ctx.fillStyle = '#4a4058'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    poly([-cs * 0.46, -cs * 0.55, 0, -cs * 0.95, cs * 0.46, -cs * 0.55], '#2a2340', l);
    for (var bo = 0; bo < 4; bo++) line([-cs * 0.3 + bo * cs * 0.2, -cs * 0.55, -cs * 0.26 + bo * cs * 0.2, -cs * 0.75], '#e8e0d0', l * 0.8);
    circ(0, -cs * 0.3, cs * 0.08, 'rgba(127,255,208,' + (0.5 + 0.4 * Math.sin(t * 3)).toFixed(2) + ')');
  } else if (T === 'log') {
    ctx.save(); ctx.rotate(0.15); D.rr(-cs * 0.6, -cs * 0.3, cs * 1.2, cs * 0.28, cs * 0.14); ctx.fillStyle = '#8a5a35'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); ell(cs * 0.6, -cs * 0.16, cs * 0.06, cs * 0.14, '#d8b07a', l * 0.6); circ(-cs * 0.3, -cs * 0.4, cs * 0.18, '#2a7f5a', l * 0.6); ctx.restore();
  } else if (T === 'rocks') {
    circ(-cs * 0.2, -cs * 0.2, cs * 0.25, '#8a8f9e', l); circ(cs * 0.2, -cs * 0.15, cs * 0.22, '#9aa1b5', l); circ(0, -cs * 0.38, cs * 0.2, '#a8afc0', l);
  } else if (T === 'chest' && Z.MDIR && Z.MDIR.drawProp) {
    // 2.12.48: тот же дуб с сундуком на цепи и табличкой «Тут игла», что в мультфильме «Игла в яйце»
    Z.MDIR.drawProp('oak', -cs * 0.12, 0, cs * 0.66, Z.time || 0, {});   // ствол — в своей клетке, сундук свисает справа (раньше дерево съезжало на соседнюю клетку)
  } else if (T === 'chest') {
    // дуб и сундук на цепях
    D.rr(-cs * 0.12, -cs * 1.4, cs * 0.24, cs * 1.4, cs * 0.06); ctx.fillStyle = '#6b4a2f'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    circ(0, -cs * 1.55, cs * 0.6, '#3f6a3a', l); circ(-cs * 0.35, -cs * 1.35, cs * 0.35, '#4a7a45', l);
    line([cs * 0.1, -cs * 1.0, cs * 0.4, -cs * 0.6], '#9aa1b5', l * 0.8);
    D.rr(cs * 0.15, -cs * 0.6, cs * 0.5, cs * 0.36, cs * 0.06); ctx.fillStyle = '#8a5a35'; ctx.fill(); ctx.stroke(); line([cs * 0.15, -cs * 0.45, cs * 0.65, -cs * 0.45], '#ffd54a', l * 0.8); circ(cs * 0.4, -cs * 0.4, cs * 0.05, '#ffd54a');
  }
  ctx.restore();
  if (s.hp < s.max) { var bw = cs * 0.6, bh = Math.max(3, cs * 0.06); ctx.fillStyle = OL; D.rr(x - bw / 2 - 1, y + cs * 0.12 - 1, bw + 2, bh + 2, 2); ctx.fill(); ctx.fillStyle = '#c79bff'; ctx.fillRect(x - bw / 2, y + cs * 0.12, bw * Math.max(0, s.hp / s.max), bh); }
};

// ---------- Калинов мост: горбатый каменный мост над ледяной речкой, с калиной ----------
// x — центр, gy — уровень земли, w — пролёт, h — высота горба; общий для уровня и мультика
D.kbridge = function (x, gy, w, h, l, t, haze, o) {
  o = o || {};
  var ctx = c(), x0 = x - w / 2, x1 = x + w / 2, hump = o.hump === undefined ? 0.76 : o.hump, na = o.arches || 1, N = 32, i, u;
  var span = na > 1 ? w * 0.8 : w, aw = span / na, ar = na > 1 ? aw * 0.4 : w * 0.25, ah = na > 1 ? h * 0.55 : h * 0.6;
  var ax = function (k) { return na > 1 ? x - span / 2 + aw * (k + 0.5) : x; };
  var dy = function (u) { return gy - h * ((1 - hump) + hump * Math.cos(u * Math.PI / 2)); };
  var body = function () { ctx.beginPath(); ctx.moveTo(x0, gy); for (i = 0; i <= N; i++) { u = -1 + 2 * i / N; ctx.lineTo(x + u * w / 2, dy(u)); } ctx.lineTo(x1, gy);
    for (var k = na - 1; k >= 0; k--) { ctx.lineTo(ax(k) + ar, gy); ctx.ellipse(ax(k), gy, ar, ah, 0, 0, Math.PI, true); } ctx.closePath(); };
  ctx.save();
  if (!o.noRiver) { // речка подо льдом
    ctx.beginPath(); ctx.ellipse(x, gy + h * 0.02, w * 0.74, h * 0.18, 0, 0, Math.PI * 2); ctx.fillStyle = '#9fd3f2'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, gy + h * 0.01, w * 0.6, h * 0.1, 0, 0, Math.PI * 2); ctx.fillStyle = '#c9ecff'; ctx.fill();
    ctx.globalAlpha = 0.8; line([x - w * 0.42, gy + h * 0.03, x - w * 0.3, gy - h * 0.01, x - w * 0.22, gy + h * 0.04], '#ffffff', l * 0.6); line([x + w * 0.2, gy + h * 0.05, x + w * 0.33, gy + h * 0.0, x + w * 0.44, gy + h * 0.04], '#ffffff', l * 0.6); ctx.globalAlpha = 1;
  }
  // тень под арками
  for (var k0 = 0; k0 < na; k0++) { ctx.beginPath(); ctx.ellipse(ax(k0), gy, ar, ah, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = 'rgba(40,52,96,0.45)'; ctx.fill(); }
  // тело моста с кладкой
  body(); var g = ctx.createLinearGradient(0, gy - h, 0, gy); g.addColorStop(0, '#c3c2d2'); g.addColorStop(1, '#8d8ea6'); ctx.fillStyle = g; ctx.fill();
  ctx.save(); body(); ctx.clip(); ctx.strokeStyle = 'rgba(38,48,79,0.28)'; ctx.lineWidth = l * 0.5; var rh = h * 0.17, nb = Math.max(12, Math.round(w / (h * 0.36)));
  for (var r = 1; r < 7; r++) { var yy = gy - r * rh; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke(); for (var j = 0; j < nb + 2; j++) { var xx = x0 + (j + (r % 2) * 0.5) * w / nb; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + rh); ctx.stroke(); } }
  ctx.restore(); body(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  // клинчатые камни арок и замковый камень
  for (var k1 = 0; k1 < na; k1++) { var cxA = ax(k1), ar2 = ar + h * 0.13, ah2 = ah + h * 0.13;
    for (i = 0; i < 9; i++) { var a0 = Math.PI + i * Math.PI / 9, a1 = a0 + Math.PI / 9; ctx.beginPath(); ctx.ellipse(cxA, gy, ar, ah, 0, a0, a1); ctx.ellipse(cxA, gy, ar2, ah2, 0, a1, a0, true); ctx.closePath(); ctx.fillStyle = i === 4 ? '#e2e0ea' : i % 2 ? '#b3b3c6' : '#c6c6d6'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke(); } }
  // сугробы на парапете
  ctx.beginPath(); ctx.moveTo(x0 - w * 0.01, dy(-1) + h * 0.03); for (i = 0; i <= N; i++) { u = -1 + 2 * i / N; ctx.lineTo(x + u * w / 2, dy(u) - h * 0.07 - Math.abs(Math.sin(i * 1.3)) * h * 0.025); } ctx.lineTo(x1 + w * 0.01, dy(1) + h * 0.03); for (i = N; i >= 0; i--) { u = -1 + 2 * i / N; ctx.lineTo(x + u * w / 2, dy(u) + h * 0.05); } ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
  // столбики по краям
  [-1, 1].forEach(function (s) { var px = x + s * w * 0.47, pt = dy(s * 0.94) - h * 0.3, pw = h * 0.17; D.rr(px - pw / 2, pt, pw, gy - pt, pw * 0.15); ctx.fillStyle = '#a9a9bd'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); D.ell(px, pt, pw * 0.62, pw * 0.3, '#ffffff', l * 0.7);
    if (o.lamps) { var lg2 = 0.55 + 0.25 * Math.sin((t || 0) * 3 + s); ctx.globalAlpha = 0.3 * lg2; D.circ(px, pt - pw * 0.8, pw * 1.6, '#ffd27a'); ctx.globalAlpha = 1; D.rr(px - pw * 0.32, pt - pw * 1.15, pw * 0.64, pw * 0.7, pw * 0.12); ctx.fillStyle = '#ffd27a'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke(); } });
  // калина: кусты у въездов и гроздья на парапете
  var kal = function (bx, by, s) { var lv = ['#3f7a4a', '#5a9a52', '#4c8a4c']; for (var q = 0; q < 5; q++) { var qa = -0.3 - q * 0.6; D.ell(bx + Math.cos(qa) * s * 0.5, by + Math.sin(qa) * s * 0.35, s * 0.42, s * 0.26, lv[q % 3], l * 0.6); }
    for (var b = 0; b < 3; b++) { var cx2 = bx + (b - 1) * s * 0.42, cy2 = by - s * (0.15 + (b % 2) * 0.2); for (var e = 0; e < 4; e++) D.circ(cx2 + (e % 2 - 0.5) * s * 0.2, cy2 + Math.floor(e / 2) * s * 0.17 + (e % 2) * s * 0.05, s * 0.12, '#e5323b', l * 0.45); D.circ(cx2 - s * 0.12, cy2 - s * 0.04, s * 0.04, '#ffd0d0'); } };
  kal(x0 - w * 0.01, gy - h * 0.1, h * 0.36); kal(x1 + w * 0.01, gy - h * 0.1, h * 0.36);
  var nk = Math.max(4, Math.round(w / h * 1.3));
  for (var kk = 0; kk < nk; kk++) { var u2 = -0.8 + 1.6 * kk / (nk - 1), bx = x + u2 * w / 2, by = dy(u2) + h * 0.07; D.ell(bx, by, h * 0.07, h * 0.035, '#4c8a4c', l * 0.35); for (var e2 = 0; e2 < 3; e2++) D.circ(bx + (e2 - 1) * h * 0.04, by + h * 0.045 + (e2 % 2) * h * 0.03, h * 0.035, '#e5323b', l * 0.35); }
  if (haze) { ctx.globalAlpha = haze; body(); ctx.fillStyle = '#3b4f78'; ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
};

// ---------- ориентиры карт ----------
var oldLm = D.landmark;
D.landmark = function (kind, x, y, cs, t) {
  var G = Z.G, mp = G && !G.endless ? Z.mapOf(G.idx) : null, ctx = c(), l = Math.max(1.5, cs * 0.05);
  var k = mp ? mp.lm : null;
  if (!k || k === 'stump' || k === 'stumps' || k === 'bridges' || k === 'river') return oldLm(kind, x, y, cs, t);
  ell(x, y, cs * 0.95, cs * 0.3, 'rgba(30,40,80,0.2)');
  if (k === 'mill' || k === 'windmill') {
    poly([x - cs * 0.45, y, x - cs * 0.3, y - cs * 1.4, x + cs * 0.3, y - cs * 1.4, x + cs * 0.45, y], '#c9a06a', l);
    poly([x - cs * 0.4, y - cs * 1.4, x, y - cs * 1.8, x + cs * 0.4, y - cs * 1.4], '#8a4a3a', l);
    ctx.save(); ctx.translate(x, y - cs * 1.3); ctx.rotate(t * (k === 'windmill' ? 1.5 : 0.8)); for (var i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); D.rr(-cs * 0.06, -cs * 0.95, cs * 0.12, cs * 0.85, cs * 0.03); ctx.fillStyle = '#f2e6d0'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke(); } circ(0, 0, cs * 0.08, '#6b4a2f', l * 0.6); ctx.restore();
  } else if (k === 'arch') {
    for (var a = 0; a < 5; a++) { var ax = x - cs * 0.9 + a * cs * 0.45, ah = cs * (1.2 + Math.sin(a * 1.3) * 0.2); D.pine(ax, y, ah, '#24804f', true); }
  } else if (k === 'hares') {
    for (var h = 0; h < 3; h++) { ell(x - cs * 0.6 + h * cs * 0.6, y - cs * 0.1, cs * 0.25, cs * 0.12, '#5a4a3a', l * 0.6); }
    ell(x, y - cs * 0.5, cs * 0.6, cs * 0.45, '#f4f8ff', l); D.text('🐇', x, y - cs * 0.55, cs * 0.4, '#000');
  } else if (k === 'eyetrees') {
    for (var e = 0; e < 3; e++) { var ex = x - cs * 0.6 + e * cs * 0.6; D.rr(ex - cs * 0.12, y - cs * 1.2, cs * 0.24, cs * 1.2, cs * 0.08); ctx.fillStyle = '#5a4028'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); circ(ex, y - cs * 1.35, cs * 0.35, '#2f5a3a', l); var bl = Math.sin(t * 0.7 + e * 2) > 0.95 ? 0.2 : 1; ell(ex - cs * 0.06, y - cs * 0.8, cs * 0.05, cs * 0.05 * bl, '#ffe066'); ell(ex + cs * 0.06, y - cs * 0.8, cs * 0.05, cs * 0.05 * bl, '#ffe066'); }
  } else if (k === 'den') {
    ctx.beginPath(); ctx.ellipse(x, y, cs * 1.0, cs * 0.9, 0, Math.PI, 0); ctx.fillStyle = '#f4f8ff'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y, cs * 0.35, cs * 0.45, 0, Math.PI, 0); ctx.fillStyle = '#2a3050'; ctx.fill(); ctx.stroke();
    var zz = (t * 0.6) % 1; ctx.globalAlpha = 1 - zz; D.text('Z', x + cs * 0.2 + zz * cs * 0.3, y - cs * 0.6 - zz * cs * 0.6, cs * 0.3, '#fff'); ctx.globalAlpha = 1;
  } else if (k === 'scarecrow') {
    line([x, y, x, y - cs * 1.4], '#6b4a2f', l * 1.5); line([x - cs * 0.6, y - cs * 1.0, x + cs * 0.6, y - cs * 1.0], '#6b4a2f', l * 1.5);
    poly([x - cs * 0.3, y - cs * 1.1, x + cs * 0.3, y - cs * 1.1, x + cs * 0.25, y - cs * 0.55, x - cs * 0.25, y - cs * 0.55], '#4a7ab8', l); circ(x, y - cs * 1.3, cs * 0.2, '#e8c890', l); poly([x - cs * 0.3, y - cs * 1.38, x, y - cs * 1.75, x + cs * 0.3, y - cs * 1.38], '#a8784a', l);
    for (var f = 0; f < 4; f++) D.rr(x - cs * 1.0 + f * cs * 0.15, y - cs * 0.5, cs * 0.08, cs * 0.5, cs * 0.02), ctx.fillStyle = '#a8784a', ctx.fill(), ctx.stroke();
  } else if (k === 'carousel') {
    var CR = G && G.car; D.carousel(x, y, cs, CR ? CR.ang : t * 0.6, { spin: CR ? CR.spin : 0, ready: !!(CR && CR.st === 'ready'), charge: CR && CR.st === 'charge' ? CR.t / 13 : undefined, nest: !!(G && G.mag) });
  } else if (k === 'hut' && Z.drawYagaYard) { Z.drawYagaYard(x, y, cs, t);
  } else if (k === 'hut' || k === 'fishhuts') {
    var n = k === 'fishhuts' ? 2 : 1;
    for (var hh = 0; hh < n; hh++) drawHut(x - (n - 1) * cs * 0.5 + hh * cs, y, cs * (n > 1 ? 0.7 : 0.9), t, k === 'hut');
  } else if (k === 'well') {
    ell(x, y - cs * 0.2, cs * 0.5, cs * 0.2, '#8a8f9e', l); D.rr(x - cs * 0.5, y - cs * 0.6, cs * 1.0, cs * 0.4, cs * 0.05); ctx.fillStyle = '#9aa1b5'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    line([x - cs * 0.45, y - cs * 0.6, x - cs * 0.45, y - cs * 1.3], '#6b4a2f', l * 1.2); line([x + cs * 0.45, y - cs * 0.6, x + cs * 0.45, y - cs * 1.3], '#6b4a2f', l * 1.2);
    poly([x - cs * 0.65, y - cs * 1.25, x, y - cs * 1.6, x + cs * 0.65, y - cs * 1.25], '#8a4a3a', l);
  } else if (k === 'slide') {
    poly([x - cs * 1.0, y, x - cs * 0.6, y - cs * 1.4, x - cs * 0.2, y - cs * 1.4, x + cs * 1.0, y], '#cfeeff', l);
    line([x - cs * 0.55, y - cs * 1.35, x + cs * 0.9, y - cs * 0.05], '#ffffff', l * 1.5);
    for (var fl = 0; fl < 4; fl++) circ(x - cs * 0.5 + fl * cs * 0.12, y - cs * 1.6 - (fl % 2) * cs * 0.1, cs * 0.05, ['#e8484f', '#ffd54a', '#4aa3ff', '#6fe07a'][fl]);
  } else if (k === 'boat' || k === 'ship') {
    var big = k === 'ship' ? 1.3 : 1;
    poly([x - cs * 0.9 * big, y - cs * 0.4, x + cs * 0.9 * big, y - cs * 0.4, x + cs * 0.6 * big, y, x - cs * 0.6 * big, y], '#8a4a3a', l);
    line([x, y - cs * 0.4, x, y - cs * 1.5 * big], '#6b4a2f', l * 1.2);
    if (k === 'ship') { D.rr(x - cs * 0.4, y - cs * 0.85, cs * 0.8, cs * 0.45, cs * 0.05); ctx.fillStyle = '#e8eef9'; ctx.fill(); ctx.stroke(); D.rr(x + cs * 0.15, y - cs * 1.25, cs * 0.22, cs * 0.4, cs * 0.04); ctx.fillStyle = '#e8484f'; ctx.fill(); ctx.stroke(); }
    else poly([x, y - cs * 1.45, x + cs * 0.6, y - cs * 0.55, x, y - cs * 0.55], '#f2e6d0', l);
    ell(x, y + cs * 0.02, cs * 0.9 * big, cs * 0.12, 'rgba(191,239,255,0.8)');
  } else if (k === 'lighthouse') {
    poly([x - cs * 0.35, y, x - cs * 0.2, y - cs * 1.6, x + cs * 0.2, y - cs * 1.6, x + cs * 0.35, y], '#ffffff', l);
    for (var st = 0; st < 3; st++) poly([x - cs * (0.33 - st * 0.05), y - cs * (0.25 + st * 0.5), x + cs * (0.33 - st * 0.05), y - cs * (0.25 + st * 0.5), x + cs * (0.3 - st * 0.05), y - cs * (0.45 + st * 0.5), x - cs * (0.3 - st * 0.05), y - cs * (0.45 + st * 0.5)], '#e8484f');
    circ(x, y - cs * 1.75, cs * 0.18, '#ffe066', l); ctx.globalAlpha = 0.2; poly([x, y - cs * 1.75, x + Math.cos(t) * cs * 3, y - cs * 1.75 + Math.sin(t) * cs * 0.8, x + Math.cos(t + 0.3) * cs * 3, y - cs * 1.75 + Math.sin(t + 0.3) * cs * 0.8], '#fff6b0'); ctx.globalAlpha = 1;
  } else if (k === 'lights') {
    for (var w = 0; w < 6; w++) { var wx = x + Math.sin(t * 0.8 + w * 1.7) * cs * 0.9, wy = y - cs * 0.6 + Math.cos(t * 0.6 + w) * cs * 0.4; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 3 + w); circ(wx, wy, cs * 0.12, '#b8ff9a'); ctx.globalAlpha = 0.15; circ(wx, wy, cs * 0.35, '#b8ff9a'); }
    ctx.globalAlpha = 1; for (var r2 = 0; r2 < 7; r2++) line([x - cs * 0.9 + r2 * cs * 0.3, y, x - cs * 0.95 + r2 * cs * 0.3, y - cs * 0.8], '#6a8a4a', l);
  } else if (k === 'dam') {
    for (var lg = 0; lg < 5; lg++) { D.rr(x - cs * 1.0, y - cs * 0.2 - lg * cs * 0.2, cs * 2.0, cs * 0.2, cs * 0.1); ctx.fillStyle = lg % 2 ? '#8a5a35' : '#9a6a3a'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke(); }
    if (G && G.damGone) { ctx.globalAlpha = 0.6; ctx.fillStyle = '#7fd8ff'; ctx.fillRect(x - cs * 0.3, y - cs * 1.0, cs * 0.6, cs * 1.0); ctx.globalAlpha = 1; }
    else D.text('💥', x, y - cs * 1.3, cs * 0.35, '#000');
  } else if (k === 'stonebridge') {
    D.kbridge(x, y, cs * 2.3, cs * 1.0, l, t);
  } else if (k === 'slopes' || k === 'gates') {
    poly([x - cs * 1.0, y, x - cs * 0.5, y - cs * 1.5, x - cs * 0.1, y], '#9aa1b5', l); poly([x + cs * 0.1, y, x + cs * 0.5, y - cs * 1.5, x + cs * 1.0, y], '#8a8f9e', l);
    poly([x - cs * 0.62, y - cs * 1.15, x - cs * 0.5, y - cs * 1.5, x - cs * 0.38, y - cs * 1.15], '#fff'); poly([x + cs * 0.38, y - cs * 1.15, x + cs * 0.5, y - cs * 1.5, x + cs * 0.62, y - cs * 1.15], '#fff');
    if (k === 'gates') { D.rr(x - cs * 0.6, y - cs * 1.7, cs * 1.2, cs * 0.25, cs * 0.05); ctx.fillStyle = '#7a7f8e'; ctx.fill(); ctx.stroke(); }
  } else if (k === 'cable') {
    if (!(G && G.cable2)) line([x - cs * 0.6, y, x - cs * 0.45, y - cs * 1.8, x - cs * 0.3, y], '#5a5f6e', l * 1.4);
    var on = !(G && G.cable && !G.cable.on);
    if (G && G.cable2) {} else if (on) { line([x - cs * 0.45, y - cs * 1.8, x + cs * 3, y - cs * 3.5], '#3d3d3d', l * 0.8); var cp = (t * 0.15) % 1; D.rr(x - cs * 0.45 + cp * cs * 3.4 - cs * 0.2, y - cs * 1.8 - cp * cs * 1.7, cs * 0.4, cs * 0.35, cs * 0.06); ctx.fillStyle = '#e8484f'; ctx.fill(); ctx.stroke(); D.text('✂', x + cs * 0.4, y - cs * 1.0, cs * 0.3, '#000'); }
    else { line([x - cs * 0.45, y - cs * 1.8, x - cs * 0.1, y - cs * 1.0], '#3d3d3d', l * 0.8); }
  } else if (k === 'springs') {
    ell(x, y - cs * 0.15, cs * 0.9, cs * 0.35, '#8fe0d8', l); ell(x, y - cs * 0.15, cs * 0.6, cs * 0.2, '#b8f4ee');
    for (var sm = 0; sm < 4; sm++) { var sp = (t * 0.4 + sm / 4) % 1; ctx.globalAlpha = 0.5 * (1 - sp); circ(x - cs * 0.5 + sm * cs * 0.33, y - cs * 0.4 - sp * cs * 1.2, cs * (0.15 + sp * 0.25), '#ffffff'); } ctx.globalAlpha = 1;
  } else if (k === 'crystals' || k === 'icewalls' || k === 'icebergs' || k === 'palace') {
    var big2 = k === 'palace' ? 1.5 : 1;
    [[-0.6, 0.9], [0, 1.5], [0.6, 1.1], [-0.25, 0.7], [0.35, 0.6]].forEach(function (q, i) { var qx = x + q[0] * cs * big2, qh = q[1] * cs * big2; poly([qx - cs * 0.2, y, qx, y - qh, qx + cs * 0.2, y], i % 2 ? '#bfe6ff' : '#9fd8ff', l * 0.8); ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2 + i); line([qx - cs * 0.05, y - qh * 0.3, qx, y - qh * 0.8], '#ffffff', l * 0.6); ctx.globalAlpha = 1; });
    if (k === 'palace') { ctx.globalAlpha = 0.3 + 0.15 * Math.sin(t * 2); circ(x, y - cs * 1.4, cs * 1.2, '#c79bff'); ctx.globalAlpha = 1; }
  } else if (k === 'castle') {
    D.rr(x - cs * 0.9, y - cs * 1.1, cs * 1.8, cs * 1.1, cs * 0.05); ctx.fillStyle = '#4a4058'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    [-0.9, 0.9].forEach(function (q) { D.rr(x + q * cs - cs * 0.22, y - cs * 1.8, cs * 0.44, cs * 1.8, cs * 0.04); ctx.fillStyle = '#3a3048'; ctx.fill(); ctx.stroke(); poly([x + q * cs - cs * 0.28, y - cs * 1.8, x + q * cs, y - cs * 2.3, x + q * cs + cs * 0.28, y - cs * 1.8], '#2a2340', l); });
    D.rr(x - cs * 0.22, y - cs * 0.6, cs * 0.44, cs * 0.6, cs * 0.2); ctx.fillStyle = '#1a1428'; ctx.fill(); ctx.stroke();
    circ(x - cs * 0.9, y - cs * 1.4, cs * 0.06, 'rgba(127,255,208,' + (0.5 + 0.4 * Math.sin(t * 3)).toFixed(2) + ')');
  } else if (k === 'aurora' || k === 'vane') {
    line([x, y, x, y - cs * 1.8], '#5a5f6e', l * 1.4); D.rr(x - cs * 0.35, y - cs * 0.8, cs * 0.7, cs * 0.8, cs * 0.05); ctx.fillStyle = '#e8eef9'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.save(); ctx.translate(x, y - cs * 1.8); ctx.rotate(Math.sin(t * 0.7) * 1.2); poly([0, -cs * 0.08, cs * 0.5, 0, 0, cs * 0.08], '#e8484f', l * 0.6); poly([0, -cs * 0.08, -cs * 0.3, -cs * 0.15, -cs * 0.3, cs * 0.15, 0, cs * 0.08], '#4aa3ff', l * 0.6); ctx.restore();
    if (G && G.v26) { var good = G.v26.wx !== 'blizzard'; circ(x, y - cs * 0.45, cs * 0.15, good ? '#6fe07a' : '#ff6b6b', l * 0.6); }
  } else if (k === 'mileposts') {
    for (var mp2 = 0; mp2 < 3; mp2++) { var mx = x - cs * 0.7 + mp2 * cs * 0.7; D.rr(mx - cs * 0.08, y - cs * 1.0, cs * 0.16, cs * 1.0, cs * 0.03); ctx.fillStyle = mp2 % 2 ? '#fff' : '#e8484f'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke(); }
  } else return oldLm(kind, x, y, cs, t);
};
function drawHut(x, y, cs, t, walk) {
  var ctx = c(), l = Math.max(1.5, cs * 0.05), st = walk ? Math.sin(t * 6) * cs * 0.08 : 0;
  if (walk) { line([x - cs * 0.25, y - cs * 0.55, x - cs * 0.3 + st, y], '#e8a040', l * 1.3); line([x + cs * 0.25, y - cs * 0.55, x + cs * 0.3 - st, y], '#e8a040', l * 1.3); }
  var by = y - (walk ? cs * 0.55 : 0);
  D.rr(x - cs * 0.5, by - cs * 0.75, cs * 1.0, cs * 0.75, cs * 0.04); ctx.fillStyle = '#9a6a3a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  for (var i = 1; i < 4; i++) line([x - cs * 0.5, by - cs * 0.19 * i, x + cs * 0.5, by - cs * 0.19 * i], '#6b4a2f', l * 0.5);
  poly([x - cs * 0.62, by - cs * 0.75, x, by - cs * 1.25, x + cs * 0.62, by - cs * 0.75], '#f4f8ff', l);
  D.rr(x - cs * 0.15, by - cs * 0.55, cs * 0.3, cs * 0.25, cs * 0.03); ctx.fillStyle = '#ffd56b'; ctx.fill(); ctx.stroke();
}
Z.drawHut = drawHut;

// ---------- снаряды героев ----------
var oldShot = D.shot;
D.shot = function (s, X, Y, cs, t) {
  if (s.k !== 'ally') return oldShot(s, X, Y, cs, t);
  if (s.t < 0) return;
  var x = X(s.x), y = Y(s.y), ctx = c(), l = Math.max(1, cs * 0.03);
  if (s.kind === 'pot') { ctx.save(); ctx.translate(x, y); ctx.rotate(s.rot || 0); D.rr(-cs * 0.11, -cs * 0.1, cs * 0.22, cs * 0.2, cs * 0.07); ctx.fillStyle = '#c8644a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); circ(0, -cs * 0.12, cs * 0.04, '#ffd54a'); ctx.restore(); }
  else if (s.kind === 'ball') { ctx.globalAlpha = 0.4; circ(x, y, cs * 0.16, '#d9b8ff'); ctx.globalAlpha = 1; circ(x, y, cs * 0.08, '#f4e8ff', l); }
  else if (s.kind === 'cone') { ctx.save(); ctx.translate(x, y); ctx.rotate(s.rot || 0); ell(0, 0, cs * 0.07, cs * 0.1, '#8a5a35', l); ctx.restore(); }
  else if (s.kind === 'ice') { circ(x, y, cs * 0.07, '#bfefff', l); }
  else if (s.kind === 'snowb') { var rb = cs * (s.big ? 0.2 : 0.11); ctx.globalAlpha = 0.35; circ(x, y, rb * 1.6, '#9fdcff'); ctx.globalAlpha = 1; circ(x, y, rb, '#ffffff', l); ctx.strokeStyle = '#9cc4ee'; ctx.lineWidth = l; ctx.beginPath(); ctx.arc(x, y, rb * 0.5, (s.rot || 0), (s.rot || 0) + 3.4); ctx.stroke(); }
};

// ---------- подложка: вода с волнами, болото, ледяные стены, люки ----------
Z.drawUnder = function (ctx, X, Y, cs, t) {
  var G = Z.G, L = G.L;
  if (L.water && L.water.length) {
    ctx.save();
    // 2.11.4: у края поля вода продолжается до рамки (река на подложке уходит за край — раньше была «ступенька»),
    // а в русле реки заливка не выходит за её берега
    var FPw = D.fieldPad ? D.fieldPad(L) : { l: 0, r: 0 };
    if (Z.waterBase) Z.waterBase(ctx, X, Y, cs, t);
    L.water.forEach(function (q) {
      var v = L.grid[q[1]][q[0]], x = X(q[0]), y = Y(q[1]), k = q[1] * L.W + q[0];
      if (L.bridges[k]) return;
      var rx = x, rw = cs + 0.5, ry2 = y, rh = cs + 0.5;
      if (q[0] === 0) { rx -= FPw.l * cs + 2; rw += FPw.l * cs + 2; }
      if (q[0] === L.W - 1) rw += FPw.r * cs + 2;
      if (L.riverRow === q[1]) { ry2 = y + cs * 0.13; rh = cs * 0.74; }
      if (v === 4 && Z.waterBase) { /* 2.11.5: открытая вода — одним телом, см. v30g.js */ }
      else if (v === 4) {
        ctx.fillStyle = G.mech === 'springs' ? 'rgba(140,230,220,0.55)' : 'rgba(70,160,220,0.55)'; ctx.fillRect(rx, ry2, rw, rh);
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = Math.max(1, cs * 0.03);
        for (var i = 0; i < 2; i++) { var ph = t * 1.6 + q[0] * 0.9 + i * 2.1, wy = y + cs * (0.3 + i * 0.4) + Math.sin(ph) * cs * 0.06; ctx.beginPath(); ctx.moveTo(x + cs * 0.1, wy); ctx.quadraticCurveTo(x + cs * 0.5, wy - cs * 0.1 * Math.cos(ph), x + cs * 0.9, wy); ctx.stroke(); }
      } else if (v === 5) {
        var thin = L.iceT && G.t - (L.iceT[k] || -99) < 5;
        if (!Z.waterBase) { ctx.fillStyle = thin ? 'rgba(200,240,255,0.55)' : 'rgba(225,245,255,0.75)'; ctx.fillRect(rx, ry2, rw, rh); }
        ctx.strokeStyle = 'rgba(120,180,220,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + cs * 0.2, y + cs * 0.3); ctx.lineTo(x + cs * 0.5, y + cs * 0.5); ctx.lineTo(x + cs * 0.8, y + cs * 0.35); ctx.stroke();
      }
    });
    // круги и большие волны
    G.ripples.forEach(function (r) { var p = r.t / (r.big ? 1.4 : 0.9); ctx.globalAlpha = (1 - p) * 0.8; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, cs * (r.big ? 0.06 : 0.03));
      var pq = Math.round(p * 16) / 16, ra = cs * (0.15 + pq * (r.big ? 1.6 : 0.5)), rb = cs * (0.06 + pq * (r.big ? 0.6 : 0.2)), lw = Math.max(1, cs * (r.big ? 0.06 : 0.03)), rx = X(r.x), ry = Y(r.y);   // 2.12: кольцо — готовой картинкой (16 размеров)
      if (Z.sharedSprite && Z.sharedSprite('rip|' + (r.big ? 1 : 0) + '|' + pq + '|' + Math.round(cs * 4), rx, ry, ra * 2 + lw * 2 + 2, rb * 2 + lw * 2 + 2, ra + lw + 1, rb + lw + 1, function () { var c2 = D.ctx; c2.strokeStyle = '#ffffff'; c2.lineWidth = lw; c2.beginPath(); c2.ellipse(rx, ry, ra, rb, 0, 0, 7); c2.stroke(); })) return;
      ctx.beginPath(); ctx.ellipse(rx, ry, cs * (0.15 + p * (r.big ? 1.6 : 0.5)), cs * (0.06 + p * (r.big ? 0.6 : 0.2)), 0, 0, 7); ctx.stroke(); });
    ctx.globalAlpha = 1;
    // предупреждение о заморозке
    var wc = G.wc; if (wc && wc.phase === 'warm' && wc.t < 3 && L.water.length) { var q0 = L.water[Math.floor(L.water.length / 2)]; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 10); D.flake(X(q0[0] + 0.5), Y(q0[1] - 0.3), cs * 0.35, '#ffffff', cs * 0.08); D.text(Math.ceil(wc.t) + '', X(q0[0] + 0.5), Y(q0[1] - 0.95), cs * 0.4, '#fff', 'center', 'middle', 3); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  if (!Z.drawSwamp) for (var sk in G.swamp || {}) { var sc = sk % L.W, sr = Math.floor(sk / L.W); ctx.globalAlpha = Math.min(1, G.swamp[sk] / 2) * 0.55; ctx.fillStyle = '#5a7a3a'; ctx.beginPath(); ctx.ellipse(X(sc + 0.5), Y(sr + 0.55), cs * 0.48, cs * 0.36, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  (G.hatches || []).forEach(function (h) { var x = X(h.c + 0.5), y = Y(h.r + 0.55); D.rr(x - cs * 0.32, y - cs * 0.22, cs * 0.64, cs * 0.44, cs * 0.06); ctx.fillStyle = h.open ? '#5a3a20' : '#f4f8ff'; ctx.fill(); ctx.lineWidth = Math.max(1, cs * 0.03); ctx.strokeStyle = D.OL; ctx.stroke(); if (h.open) { D.text('30', x, y, cs * 0.22, '#ffd54a', 'center', 'middle', 2); } });
  if (G.walls) G.walls.forEach(function (w) { if (L.grid[w.r][w.c] !== 12) return; var x = X(w.c), y = Y(w.r); poly([x + cs * 0.05, y + cs, x + cs * 0.12, y - cs * 0.15, x + cs * 0.5, y - cs * 0.35, x + cs * 0.88, y - cs * 0.15, x + cs * 0.95, y + cs], 'rgba(170,225,255,0.9)', Math.max(1, cs * 0.03)); line([x + cs * 0.3, y + cs * 0.1, x + cs * 0.45, y + cs * 0.6], '#ffffff', Math.max(1, cs * 0.03)); });
};
// объекты по глубине: избушка, зайцы, кабинка
Z.drawObjs = function (objs, X, Y, cs, t) {
  var G = Z.G;
  if (G.hut && Z.drawHutObj) Z.drawHutObj(objs, X, Y, cs, t);
  (G.critters || []).forEach(function (h) { if (!h) return; objs.push({ y: h.y, f: function () { var hp = h.hop > 0 ? Math.sin(h.hop / 0.35 * Math.PI) * cs * 0.3 : 0; var fe = h._fe || (h._fe = { type: 'hare', size: 0.7, dir: 1, walk: 0, ph: 0, hitT: 0, slow: 0, kb: 0, hp: 1, max: 1 }); fe.dir = h.dir || 1; var hx = X(h.x), hy = Y(h.y - (Z.oLift ? Z.oLift(h) : 0)) - hp; if (!(Z.enemySprite && Z.enemySprite(fe, hx, hy, cs))) D.enemy(fe, hx, hy, cs, t); } }); });   // 2.12: зайцы — общими кадрами (v30o)
};
// поверх: погода, свет, эффекты 2.6
var flakes = []; for (var i = 0; i < 70; i++) flakes.push([Math.random(), Math.random(), 0.5 + Math.random()]);
Z.drawOver = function (ctx, X, Y, cs, t) {
  var G = Z.G, L = UI().L, wx = G.v26 && G.v26.wx;
  try { G.fx.forEach(function (f) { if (f.t >= 0 && f.k && f.k.indexOf('v_') === 0) drawFx(ctx, f, X, Y, cs, t); }); } catch (eF) { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
  // герои: флажки точек сбора, «!» у слабых, иней, связки
  try { (G.squad || []).forEach(function (U) {
    if (U.dead) return;
    if (U.weak) D.text('!', X(U.x), Y(U.y - 1.35), cs * 0.4, '#ff6b6b', 'center', 'middle', 3);
    if (U.iced > 0 || U.stunT > 0) { U.iced = (U.iced || 0) - 0.016; ctx.globalAlpha = 0.45; D.rr(X(U.x) - cs * 0.3, Y(U.y) - cs * 0.7, cs * 0.6, cs * 0.7, cs * 0.1); ctx.fillStyle = '#bfefff'; ctx.fill(); ctx.globalAlpha = 1; }
  });
  Z.SYNERGY && Z.SYNERGY.forEach(function (s) { var A = Z.unitOf(G, s.a), B = Z.unitOf(G, s.b); if (A && B && Math.hypot(A.x - B.x, A.y - B.y) <= 2.2) { ctx.setLineDash([4, 5]); line([X(A.x), Y(A.y - 0.2), X(B.x), Y(B.y - 0.2)], 'rgba(255,213,74,0.7)', 2); ctx.setLineDash([]); } });
  } catch (eS) { ctx.globalAlpha = 1; ctx.setLineDash([]); }   // 2.7.20: сбой подписи героя не отменяет погоду и вечерний свет
  // погода
  // погода — на всё поле внутри рамки (вместе с запасом вокруг клеток), обрезана по её скруглённому краю
  var FR = UI().frame(), BW = FR.w, BH = FR.h, FX0 = FR.x, FY0 = FR.y; ctx.save(); UI().frameClip(ctx);
  if (wx === 'snow' || wx === 'blizzard' || wx === 'thaw') {
    var n = wx === 'blizzard' ? 70 : 40, sp = wx === 'blizzard' ? 2.5 : 1;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (var i = 0; i < n; i++) { var f = flakes[i]; var x = FX0 + ((f[0] * BW + t * 30 * sp * f[2] * (wx === 'blizzard' ? 3 : 0.3)) % BW), y = FY0 + ((f[1] * BH + t * 40 * f[2] * sp) % BH); ctx.fillRect(x, y, 2 * f[2], 2 * f[2]); }
    if (wx === 'blizzard') { ctx.globalAlpha = 0.18; ctx.fillStyle = '#e8f4ff'; ctx.fillRect(FX0, FY0, BW, BH); ctx.globalAlpha = 1; }
  }
  if (wx === 'fog' || wx === 'steam') { for (var fg = 0; fg < 6; fg++) { ctx.globalAlpha = 0.16; var gx = FX0 + ((fg * 0.37 * BW + t * 12) % (BW + 200)) - 100, gy = FY0 + (fg * 0.17 + 0.1) * BH; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(gx, gy, cs * 4, cs * 1.4, 0, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
  var nightOK = false; try { nightOK = !!(Z.drawNight && Z.drawNight(ctx, G, L, cs, t, wx, X, Y)); } catch (eN) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }   // 2.7.20: сбой в слое света не роняет кадр
  if (nightOK) { /* настоящая ночь — v26i */ }
  else if (wx === 'night' || wx === 'dark' || (G.mech === 'lights') || wx === 'dusk' || wx === 'storm') {
    // темнота с «дырами» света
    var dark = wx === 'dark' ? 0.55 : wx === 'night' || G.mech === 'lights' ? 0.42 : 0.18;
    // 2.8: слой тьмы в половинном разрешении, «дыры» света — из готовой картинки (раньше — новый градиент на каждую вышку каждый кадр)
    // 2.8.1: только видимая часть рамки (при сильном зуме огромный слой на телефоне не накладывался)
    var vpD = L.vp, VX = Math.max(FX0, Math.floor(vpD.x)), VY = Math.max(FY0, Math.floor(vpD.y)), VX1 = Math.min(FX0 + BW, Math.ceil(vpD.x + vpD.w)), VY1 = Math.min(FY0 + BH, Math.ceil(vpD.y + vpD.h)), VW = Math.max(1, VX1 - VX), VH = Math.max(1, VY1 - VY);
    var DS = Math.min(0.5, 900 / Math.max(VW, VH)), cv = Z.darkCan || (Z.darkCan = document.createElement('canvas')), cw = Math.ceil(VW * DS), ch = Math.ceil(VH * DS);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    if (!Z.holeSpr) { var hs = Z.holeSpr = document.createElement('canvas'); hs.width = hs.height = 64; var hg = hs.getContext('2d'), hgr = hg.createRadialGradient(32, 32, 0, 32, 32, 32); hgr.addColorStop(0, 'rgba(0,0,0,1)'); hgr.addColorStop(1, 'rgba(0,0,0,0)'); hg.fillStyle = hgr; hg.fillRect(0, 0, 64, 64); }
    var dc = cv.getContext('2d'); dc.setTransform(1, 0, 0, 1, 0, 0); dc.globalCompositeOperation = 'source-over'; dc.clearRect(0, 0, cw, ch);
    dc.fillStyle = 'rgba(10,16,48,' + dark + ')'; dc.fillRect(0, 0, cw, ch); dc.globalCompositeOperation = 'destination-out'; dc.setTransform(DS, 0, 0, DS, (L.fx - VX) * DS, (L.fy - VY) * DS);
    var hole = function (x, y, r) { dc.drawImage(Z.holeSpr, x - r, y - r, r * 2, r * 2); };
    if (L.fort || G.L.fort) { var fo = G.L.fort; if (fo) hole((fo[0] + 0.5) * cs, (fo[1]) * cs, cs * 3.5); }
    if (G.L.landmark) hole((G.L.landmark.c + 1) * cs, (G.L.landmark.r + 1) * cs, cs * 3);
    (G.fires || []).forEach(function (fr) { hole(fr.x * cs, fr.y * cs, cs * 2.2); });
    for (var tk0 in G.towers) { var tw0 = G.towers[tk0]; if (tw0.lvl >= 2) hole((tw0.c + 0.5) * cs, (tw0.r + 0.5) * cs, cs * 1.5); }
    for (var tk in G.traps) { var tr = G.traps[tk]; if (tr.type === 'lamp') hole((tr.c + 0.5) * cs, (tr.r + 0.5) * cs, cs * 3); }
    (G.squad || []).forEach(function (U) { if (!U.dead && (U.type === 'sneg' || U.type === 'moroz' || U.type === 'emelya')) hole(U.x * cs, U.y * cs, cs * 2); });
    if (G.L.type === 'escort' && Z.sleighPos) { var p = Z.sleighPos(); hole(p.x * cs, p.y * cs, cs * 3.2); }
    if (G.auroraOn) { dc.setTransform(1, 0, 0, 1, 0, 0); dc.globalCompositeOperation = 'destination-out'; dc.fillStyle = 'rgba(0,0,0,0.5)'; dc.fillRect(0, 0, cw, ch); }
    ctx.drawImage(cv, 0, 0, cw, ch, VX, VY, VW, VH);
  }
  if (G.auroraOn || wx === 'aurora') { for (var a = 0; a < 3; a++) { ctx.globalAlpha = 0.14 + 0.06 * Math.sin(t + a); ctx.fillStyle = ['#7dffb2', '#7fd8ff', '#c79bff'][a]; ctx.beginPath(); ctx.moveTo(FX0, FY0 + BH * (0.05 + a * 0.05)); for (var q = 0; q <= 10; q++) ctx.lineTo(FX0 + BW * q / 10, FY0 + BH * (0.08 + a * 0.05) + Math.sin(t * 0.8 + q * 0.9 + a) * cs * 0.8); ctx.lineTo(FX0 + BW, FY0); ctx.lineTo(FX0, FY0); ctx.fill(); } ctx.globalAlpha = 1; }
  if (wx === 'sunset' || wx === 'garland' || wx === 'festive') { ctx.globalAlpha = 0.1; ctx.fillStyle = '#ff9a5a'; ctx.fillRect(FX0, FY0, BW, BH); ctx.globalAlpha = 1; }
  ctx.restore();
};
function UI() { return Z.ui; }
function drawFx(ctx, f, X, Y, cs, t) {
  var p = Math.min(1, f.t / f.dur), x = X(f.x || 0), y = Y(f.y || 0);
  ctx.save();
  switch (f.k) {
    case 'v_pike': ctx.globalAlpha = 1 - Math.max(0, p - 0.7) / 0.3; Z.drawPike(x, y - Math.sin(p * Math.PI) * cs * 0.6, cs * 0.9, -1, p > 0.2 && p < 0.7, t, true); break;
    case 'v_dust': ctx.globalAlpha = (1 - p) * 0.6; circ(x, y, cs * (0.1 + p * 0.25), '#ffffff'); break;
    case 'v_clock': ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#d9b8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, cs * f.r * 0.6, -Math.PI / 2, -Math.PI / 2 - p * Math.PI * 4, true); ctx.stroke(); break;
    case 'v_ghost': ctx.globalAlpha = (1 - p) * 0.6; circ(x, y - cs * 0.4, cs * 0.35, '#d9b8ff'); break;
    case 'v_zzz': for (var z = 0; z < 3; z++) { var zp = (p * 2 + z / 3) % 1; ctx.globalAlpha = 1 - zp; D.text('z', x + zp * cs * 0.8 + z * cs * 0.3, y - zp * cs * 1.5, cs * (0.3 + z * 0.1), '#c9d2ff', 'center', 'middle', 2); } break;
    case 'v_warn': ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 14); ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, cs * 0.5 * (1 - p * 0.5), cs * 0.25 * (1 - p * 0.5), 0, 0, 7); ctx.stroke(); break;
    case 'v_mushroom': ctx.globalAlpha = 1 - p; circ(x, y - cs * p * 2, cs * (0.6 + p * 1.2), '#ffb347'); circ(x, y - cs * p * 2, cs * (0.4 + p * 0.8), '#fff3c4'); ctx.fillStyle = '#9a8a7a'; ctx.fillRect(x - cs * 0.2, y - cs * p * 2, cs * 0.4, cs * p * 2); break;
    case 'v_vortex': ctx.translate(x, y - cs * 0.5); ctx.rotate(t * 12); ctx.globalAlpha = 1 - p; for (var v = 0; v < 3; v++) { ctx.rotate(2.1); ctx.strokeStyle = '#d8b86a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, cs * (0.2 + v * 0.12), 0, 2); ctx.stroke(); } break;
    case 'v_wind': ctx.globalAlpha = (1 - p) * 0.8; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; for (var w = 0; w < 6; w++) { var a = w / 6 * 6.28; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * cs * f.r * p * 0.6, y + Math.sin(a) * cs * f.r * p * 0.3); ctx.lineTo(x + Math.cos(a) * cs * f.r * p, y + Math.sin(a) * cs * f.r * p * 0.5); ctx.stroke(); } break;
    case 'v_breath': ctx.globalAlpha = 1 - p; var bx = x + (X(f.tx) - x) * Math.min(1, p * 1.5), by = y + (Y(f.ty) - y) * Math.min(1, p * 1.5); for (var b = 0; b < 6; b++) circ(x + (bx - x) * b / 6, y + (by - y) * b / 6, cs * (0.15 + b * 0.05), f.col); break;
    case 'v_sooty': var sx = x + f.dir * p * cs * 2, sy = y - Math.sin(p * Math.PI) * cs * 1.6; ctx.translate(sx, sy); ctx.rotate(p * 8); circ(0, 0, cs * 0.2, '#3d3d3d', 1.5); circ(cs * 0.06, -cs * 0.04, cs * 0.04, '#fff'); break;
    case 'v_barrel': ctx.globalAlpha = 1 - p; circ(x, y, cs * (0.4 + p), '#ffb347'); break;
    case 'v_egg': var ey = y - cs * 2 + p * cs * 2; ell(x, Math.min(y, ey), cs * 0.14, cs * 0.18, '#fff8e8', 1.5); if (p > 0.8) { ctx.globalAlpha = (1 - p) * 5; D.star(x, y - cs * 0.4, cs * 0.4, '#ffd54a', 1); } break;
    case 'v_flood': ctx.globalAlpha = (1 - p) * 0.7; ctx.fillStyle = '#7fd8ff'; ctx.fillRect(UI().frame().x, Y(f.y - 1 - p * 2), UI().frame().w, cs * (2 + p * 4)); break;
    case 'v_avalanche': ctx.globalAlpha = 1 - p * 0.8; for (var s = 0; s < 8; s++) circ(x + (Math.sin(s * 3) * cs * 0.6), Y(f.y - 1 + p * 6) - s * cs * 0.15, cs * (0.4 + (s % 3) * 0.15), '#ffffff', 1); break;
    case 'v_planks': ctx.globalAlpha = 1 - p; for (var pl = 0; pl < 4; pl++) { ctx.save(); ctx.translate(x + (pl - 1.5) * cs * 0.3 * (1 + p), y - Math.sin(p * Math.PI) * cs * 0.8); ctx.rotate(p * 5 + pl); D.rr(-cs * 0.2, -cs * 0.05, cs * 0.4, cs * 0.1, 2); ctx.fillStyle = '#9a6a3a'; ctx.fill(); ctx.restore(); } break;
    case 'v_crater': ctx.globalAlpha = 0.35 * (1 - p); ell(x, y, cs * 0.45, cs * 0.22, '#3d3d3d'); break;
    case 'v_fw': ctx.globalAlpha = 1 - p; for (var k = 0; k < 10; k++) { var aa = k / 10 * 6.28; circ(x + Math.cos(aa) * cs * p * 0.8, y + Math.sin(aa) * cs * p * 0.8, cs * 0.05, f.col); } break;
    case 'v_snowhit': var hx = X(f.sx) + (x - X(f.sx)) * p, hy = Y(f.sy) + (y - Y(f.sy)) * p - Math.sin(p * Math.PI) * cs * 0.3; circ(hx, hy, cs * 0.08, '#fff', 1); break;
    case 'v_big': ctx.globalAlpha = 1 - p; circ(x, y, cs * f.r * (0.5 + p), 'rgba(255,200,120,0.35)'); ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 3 * (1 - p); ctx.beginPath(); ctx.arc(x, y, cs * f.r * (0.6 + p * 1.6), 0, 7); ctx.stroke(); break;
    case 'v_smoke': ctx.globalAlpha = (1 - p) * 0.5; circ(x + f.vx * p * cs, y - p * cs * 1.2, cs * (0.25 + p * 0.5), '#8a8f9e'); break;
    case 'v_burst': ctx.globalAlpha = 1 - p; ctx.strokeStyle = f.col; ctx.lineWidth = 3; for (var bb = 0; bb < 8; bb++) { var ab = bb / 8 * 6.28; ctx.beginPath(); ctx.moveTo(x + Math.cos(ab) * cs * 0.3, y + Math.sin(ab) * cs * 0.15); ctx.lineTo(x + Math.cos(ab) * cs * (0.4 + p * 0.8), y + Math.sin(ab) * cs * (0.2 + p * 0.4)); ctx.stroke(); } break;
    case 'v_salute': ctx.globalAlpha = 1 - p; var sy2 = y - Math.min(1, p * 3) * cs * 4; if (p < 0.33) circ(x, sy2, cs * 0.06, '#fff'); else for (var q = 0; q < 14; q++) { var aq = q / 14 * 6.28, rq = (p - 0.33) * cs * 3; circ(x + Math.cos(aq) * rq, sy2 + Math.sin(aq) * rq + (p - 0.33) * cs, cs * 0.06, f.col); } break;
  }
  ctx.restore();
}
// эпичные взрывы: вспышка, дым, воронка, тряска
Z.fxBig = function (x, y, r) {
  var G = Z.G; if (!G || G.fx.length > 380) return;
  G.fx.push({ k: 'v_big', x: x, y: y, r: Math.max(0.8, r), t: 0, dur: 0.6 });
  for (var i = 0; i < 4; i++) G.fx.push({ k: 'v_smoke', x: x + (Math.random() - 0.5) * r, y: y, vx: (Math.random() - 0.5) * 1.2, t: -i * 0.06, dur: 1.4 + Math.random() * 0.6 });
  if (G.decals.length < 400) G.decals.push({ k: 'crater', x: x, y: y, s: Math.min(1.6, 0.8 + r * 0.4), rot: Math.random() * 6 });
  G.shake = Math.max(G.shake || 0, Math.min(0.6, 0.15 + r * 0.15));
};
Z.fxBurst = function (x, y, col) { var G = Z.G; if (G && G.fx.length < 400) G.fx.push({ k: 'v_burst', x: x, y: y - 0.3, col: col, t: 0, dur: 0.5 }); };
Z.salute = function () { var G = Z.G; if (!G) return; for (var i = 0; i < 14; i++) G.fx.push({ k: 'v_salute', x: 1 + Math.random() * (G.L.W - 2), y: G.L.H - 1, col: ['#ffd54a', '#ff6b8a', '#7fd8ff', '#9dff6a'][i % 4], t: -i * 0.25, dur: 1.8 }); };
})();
