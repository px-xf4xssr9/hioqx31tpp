/* 2.11.5 · у каждого региона своя гамма и свой мир (баланс не меняется — клетки те же):
   ЛЕС — зеленовато-холодный снег, тропа из утоптанного снега с хвоей, можжевельник, замшелые камни, следы зверей, тени крон по краям;
   ДЕРЕВНЯ — тёплый кремовый снег, накатанная дорога с колеями, смородиновые кусты с ягодами, бочки и поленницы, плетни, солома;
   ОЗЕРО — голубой лёд и снежные островки, ледяная дорожка с трещинами, камыш, ледяные глыбы, вмёрзшие пузыри;
   ГОРЫ — сиренево-серый снег, каменная дорога-брусчатка, стланик, валуны со снегом, осыпи и трещины;
   СЕВЕР — синий полярный лёд, застругги ветра, синяя ледяная дорога со светящимися прожилками, ледяные кусты, кристаллы. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = D.OL || '#1b2448';
function H(c, r, k) { var x = Math.sin(c * 127.1 + r * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); }
// земля и деревья
var PAL = [
  { ground: '#eef6f1', tint: '#d3e6da', tree: '#1f7a4a' },
  { ground: '#fdf6ec', tint: '#efdfc8', tree: '#2a8a5c' },
  { ground: '#e8f7fe', tint: '#c3e4f4', tree: '#2a7f72' },
  { ground: '#f0eef7', tint: '#d4cfe6', tree: '#2f5f58' },
  { ground: '#e6eefc', tint: '#c2d0f2', tree: '#1f6b62' }
];
PAL.forEach(function (p, i) { var R = Z.REGIONS[i]; if (R) { R.ground = p.ground; R.tint = p.tint; R.tree = p.tree; } });
// дороги: [основа, светлая середина, разметка]
Z.ROADCOL = [
  ['#b7a990', '#e6ddcc', 'rgba(120,100,70,0.35)'],
  ['#c49a6c', '#e8cfa8', 'rgba(110,70,40,0.35)'],
  ['#7fc0e0', '#d2f0fc', 'rgba(255,255,255,0.7)'],
  ['#9a97b0', '#cbc8db', 'rgba(70,66,100,0.35)'],
  ['#6f8fd8', '#a9c2f5', 'rgba(200,240,255,0.7)']
];
D.roadTexture = function (c2, roads, roadPath, cs, reg, rnd) {
  c2.save();
  if (reg === 0) {   // хвоя и шишки на тропе
    roads.forEach(function (p) { p.forEach(function (q) { for (var i = 0; i < 3; i++) { var x = (q[0] + 0.5 + (rnd() - 0.5) * 0.6) * cs, y = (q[1] + 0.5 + (rnd() - 0.5) * 0.6) * cs; c2.strokeStyle = 'rgba(70,110,70,0.45)'; c2.lineWidth = Math.max(1, cs * 0.02); c2.beginPath(); var a = rnd() * 6; c2.moveTo(x, y); c2.lineTo(x + Math.cos(a) * cs * 0.08, y + Math.sin(a) * cs * 0.08); c2.stroke(); }
      if (rnd() < 0.12) { var cx = (q[0] + 0.5 + (rnd() - 0.5) * 0.5) * cs, cy = (q[1] + 0.5 + (rnd() - 0.5) * 0.5) * cs; c2.fillStyle = '#7a5232'; c2.beginPath(); c2.ellipse(cx, cy, cs * 0.05, cs * 0.08, rnd(), 0, 7); c2.fill(); } }); });
  } else if (reg === 1) {   // колеи
    [-0.18, 0.18].forEach(function (o) { roads.forEach(function (p) { c2.beginPath(); p.forEach(function (q, i) { var x = (q[0] + 0.5) * cs + o * cs * (p[i + 1] && p[i + 1][1] !== q[1] ? 1 : 0), y = (q[1] + 0.5) * cs + o * cs * (p[i + 1] && p[i + 1][0] !== q[0] ? 1 : 0); if (!i) c2.moveTo(x, y); else c2.lineTo(x, y); }); c2.strokeStyle = 'rgba(140,95,55,0.35)'; c2.lineWidth = cs * 0.07; c2.stroke(); }); });
    roads.forEach(function (p) { p.forEach(function (q) { if (rnd() < 0.3) { c2.strokeStyle = 'rgba(210,170,80,0.7)'; c2.lineWidth = Math.max(1, cs * 0.02); var x = (q[0] + 0.5 + (rnd() - 0.5) * 0.6) * cs, y = (q[1] + 0.5 + (rnd() - 0.5) * 0.6) * cs; c2.beginPath(); c2.moveTo(x, y); c2.lineTo(x + cs * 0.12, y - cs * 0.03); c2.stroke(); } }); });
  } else if (reg === 2) {   // трещины во льду
    roads.forEach(function (p) { p.forEach(function (q) { if (rnd() < 0.5) { var x = (q[0] + 0.5 + (rnd() - 0.5) * 0.5) * cs, y = (q[1] + 0.5 + (rnd() - 0.5) * 0.5) * cs; c2.strokeStyle = 'rgba(70,150,200,0.5)'; c2.lineWidth = Math.max(1, cs * 0.015); c2.beginPath(); c2.moveTo(x, y); for (var k = 0; k < 3; k++) { x += (rnd() - 0.5) * cs * 0.25; y += (rnd() - 0.5) * cs * 0.25; c2.lineTo(x, y); } c2.stroke(); } }); });
  } else if (reg === 3) {   // брусчатка
    roads.forEach(function (p) { p.forEach(function (q) { for (var i = 0; i < 4; i++) { var x = (q[0] + 0.3 + (i % 2) * 0.4 + (rnd() - 0.5) * 0.1) * cs, y = (q[1] + 0.3 + Math.floor(i / 2) * 0.4 + (rnd() - 0.5) * 0.1) * cs; c2.fillStyle = 'rgba(120,115,145,0.35)'; c2.beginPath(); c2.ellipse(x, y, cs * 0.14, cs * 0.1, rnd(), 0, 7); c2.fill(); c2.strokeStyle = 'rgba(80,76,110,0.3)'; c2.lineWidth = 1; c2.stroke(); } }); });
  } else {   // светящиеся прожилки во льду
    roads.forEach(function (p) { p.forEach(function (q) { if (rnd() < 0.6) { var x = (q[0] + 0.5 + (rnd() - 0.5) * 0.5) * cs, y = (q[1] + 0.5 + (rnd() - 0.5) * 0.5) * cs; c2.strokeStyle = 'rgba(190,240,255,0.6)'; c2.lineWidth = Math.max(1, cs * 0.02); c2.beginPath(); c2.moveTo(x, y); c2.quadraticCurveTo(x + (rnd() - 0.5) * cs * 0.4, y + (rnd() - 0.5) * cs * 0.4, x + (rnd() - 0.5) * cs * 0.4, y + (rnd() - 0.5) * cs * 0.4); c2.stroke(); } }); });
  }
  c2.restore();
};
// земля региона (поверх основного градиента)
D.regionGround = function (c2, reg, BW, BH, cs, rnd) {
  var i, x, y, s;
  c2.save();
  if (reg === 0) {
    // тени крон по краям — ощущение леса
    var vg = c2.createRadialGradient(BW / 2, BH / 2, Math.min(BW, BH) * 0.35, BW / 2, BH / 2, Math.max(BW, BH) * 0.7); vg.addColorStop(0, 'rgba(30,80,50,0)'); vg.addColorStop(1, 'rgba(30,80,50,0.16)'); c2.fillStyle = vg; c2.fillRect(-cs, -cs, BW + cs * 2, BH + cs * 2);
    for (i = 0; i < 26; i++) { x = rnd() * BW; y = rnd() * BH; c2.fillStyle = 'rgba(90,120,80,0.08)'; c2.beginPath(); c2.ellipse(x, y, cs * (0.5 + rnd()), cs * (0.25 + rnd() * 0.3), rnd(), 0, 7); c2.fill(); }
    for (i = 0; i < 14; i++) { x = rnd() * BW; y = rnd() * BH; c2.fillStyle = 'rgba(80,90,120,0.22)'; for (var tr = 0; tr < 5; tr++) { c2.beginPath(); c2.ellipse(x + tr * cs * 0.18, y + (tr % 2) * cs * 0.08, cs * 0.03, cs * 0.045, 0, 0, 7); c2.fill(); } }   // следы зайца
  } else if (reg === 1) {
    for (i = 0; i < 20; i++) { x = rnd() * BW; y = rnd() * BH; c2.fillStyle = 'rgba(230,190,110,0.12)'; c2.beginPath(); c2.ellipse(x, y, cs * (0.4 + rnd() * 0.6), cs * (0.15 + rnd() * 0.2), rnd(), 0, 7); c2.fill(); }
    for (i = 0; i < 6; i++) { x = rnd() * BW; y = rnd() * BH; var n = 3 + Math.floor(rnd() * 3); c2.strokeStyle = 'rgba(120,80,45,0.45)'; c2.lineWidth = Math.max(1.5, cs * 0.04); c2.beginPath(); for (var f = 0; f <= n; f++) { c2.moveTo(x + f * cs * 0.3, y); c2.lineTo(x + f * cs * 0.3, y - cs * 0.3); } c2.moveTo(x, y - cs * 0.12); c2.lineTo(x + n * cs * 0.3, y - cs * 0.12); c2.moveTo(x, y - cs * 0.24); c2.lineTo(x + n * cs * 0.3, y - cs * 0.24); c2.stroke(); }   // плетни
  } else if (reg === 2) {
    for (i = 0; i < 12; i++) { x = rnd() * BW; y = rnd() * BH; s = cs * (0.8 + rnd() * 1.4);
      var ig = c2.createRadialGradient(x, y, 0, x, y, s); ig.addColorStop(0, 'rgba(150,215,245,0.45)'); ig.addColorStop(1, 'rgba(150,215,245,0)'); c2.fillStyle = ig; c2.beginPath(); c2.ellipse(x, y, s, s * 0.6, rnd(), 0, 7); c2.fill();
      c2.strokeStyle = 'rgba(255,255,255,0.75)'; c2.lineWidth = 1.2; c2.beginPath(); c2.moveTo(x - s * 0.4, y); c2.lineTo(x - s * 0.1, y - s * 0.15); c2.lineTo(x + s * 0.2, y - s * 0.05); c2.stroke();
      for (var bb = 0; bb < 3; bb++) { c2.strokeStyle = 'rgba(255,255,255,0.6)'; c2.beginPath(); c2.arc(x + (rnd() - 0.5) * s, y + (rnd() - 0.5) * s * 0.4, cs * (0.03 + rnd() * 0.03), 0, 7); c2.stroke(); } }   // вмёрзшие пузыри
  } else if (reg === 3) {
    for (i = 0; i < 26; i++) { x = rnd() * BW; y = rnd() * BH; s = cs * (0.08 + rnd() * 0.16); c2.fillStyle = 'rgba(110,105,140,0.22)'; c2.beginPath(); c2.moveTo(x - s, y + s * 0.4); c2.lineTo(x - s * 0.3, y - s * 0.6); c2.lineTo(x + s * 0.8, y - s * 0.3); c2.lineTo(x + s, y + s * 0.4); c2.closePath(); c2.fill(); }   // осыпь
    for (i = 0; i < 8; i++) { x = rnd() * BW; y = rnd() * BH; c2.strokeStyle = 'rgba(90,85,120,0.25)'; c2.lineWidth = Math.max(1, cs * 0.025); c2.beginPath(); c2.moveTo(x, y); for (var k = 0; k < 4; k++) { x += cs * (0.2 + rnd() * 0.2); y += (rnd() - 0.5) * cs * 0.3; c2.lineTo(x, y); } c2.stroke(); }   // трещины
  } else {
    c2.strokeStyle = 'rgba(255,255,255,0.55)'; c2.lineWidth = Math.max(1, cs * 0.03); c2.lineCap = 'round';
    for (i = 0; i < 40; i++) { x = rnd() * BW; y = rnd() * BH; s = cs * (0.4 + rnd() * 0.7); c2.beginPath(); c2.moveTo(x - s, y); c2.quadraticCurveTo(x, y - cs * 0.12, x + s, y); c2.stroke(); }   // застругги
    for (i = 0; i < 10; i++) { x = rnd() * BW; y = rnd() * BH; c2.strokeStyle = 'rgba(120,170,240,0.35)'; c2.lineWidth = 1.2; c2.beginPath(); c2.moveTo(x, y); for (var q = 0; q < 4; q++) { x += cs * (rnd() - 0.3) * 0.4; y += cs * (rnd() - 0.5) * 0.3; c2.lineTo(x, y); } c2.stroke(); }
  }
  c2.restore();
};
// камень-препятствие по региону
D.regionStone = function (x, y, cs, reg, c, r, idx) {
  var ctx = D.ctx, l = Math.max(1.2, cs * 0.04), j = H(c, r, idx + 21);
  if (reg === 0) { // замшелый камень
    D.ell(x, y + cs * 0.15, cs * 0.34, cs * 0.22, '#8f98a8', l); D.ell(x - cs * 0.08, y + cs * 0.1, cs * 0.16, cs * 0.08, '#6e9a5a'); D.ell(x - cs * 0.06, y + cs * 0.03, cs * 0.22, cs * 0.08, '#ffffff');
  } else if (reg === 1) { // бочка или поленница
    if (j < 0.5) { D.rr(x - cs * 0.2, y - cs * 0.2, cs * 0.4, cs * 0.45, cs * 0.08); ctx.fillStyle = '#a8703f'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); ctx.strokeStyle = '#5a6078'; ctx.lineWidth = l * 1.2; ctx.beginPath(); ctx.moveTo(x - cs * 0.2, y - cs * 0.08); ctx.lineTo(x + cs * 0.2, y - cs * 0.08); ctx.moveTo(x - cs * 0.2, y + cs * 0.14); ctx.lineTo(x + cs * 0.2, y + cs * 0.14); ctx.stroke(); D.ell(x, y - cs * 0.2, cs * 0.2, cs * 0.06, '#ffffff', l * 0.6); }
    else { for (var q = 0; q < 3; q++) { var lx = x - cs * 0.22 + (q % 2) * cs * 0.22, ly = y + cs * 0.1 - (q === 2 ? cs * 0.16 : 0) - (q === 1 ? 0 : 0); D.rr(lx - cs * 0.12 + (q === 2 ? cs * 0.11 : 0), ly - cs * 0.08, cs * 0.24, cs * 0.16, cs * 0.08); ctx.fillStyle = '#9a6a3a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); D.circ(lx - cs * 0.1 + (q === 2 ? cs * 0.11 : 0), ly, cs * 0.05, '#e0b88a'); } D.ell(x, y - cs * 0.12, cs * 0.22, cs * 0.05, '#ffffff'); }
  } else if (reg === 2) { // ледяная глыба
    D.poly([x - cs * 0.3, y + cs * 0.2, x - cs * 0.24, y - cs * 0.12, x + cs * 0.02, y - cs * 0.26, x + cs * 0.3, y - cs * 0.08, x + cs * 0.3, y + cs * 0.2], '#bfe9fb', l);
    D.poly([x - cs * 0.24, y - cs * 0.12, x + cs * 0.02, y - cs * 0.26, x + cs * 0.3, y - cs * 0.08, x + cs * 0.04, y - cs * 0.02], '#eafaff');
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(x - cs * 0.15, y + cs * 0.12); ctx.lineTo(x - cs * 0.06, y - cs * 0.05); ctx.stroke();
  } else if (reg === 3) { // россыпь валунов: круглые камни разной величины, снег на макушках, мох
    var st = [[-0.16, 0.12, 0.24, 0.18], [0.17, 0.16, 0.17, 0.13], [0.02, 0.24, 0.12, 0.08]];
    if (j > 0.5) st = [[0.12, 0.12, 0.25, 0.18], [-0.2, 0.17, 0.16, 0.12], [-0.02, 0.25, 0.1, 0.07]];
    ctx.fillStyle = 'rgba(46,40,100,0.18)'; ctx.beginPath(); ctx.ellipse(x + cs * 0.04, y + cs * 0.3, cs * 0.42, cs * 0.1, 0, 0, 7); ctx.fill();
    st.forEach(function (q, i) { var sx = x + q[0] * cs, sy = y + q[1] * cs, rx = q[2] * cs, ry = q[3] * cs;
      var g = ctx.createLinearGradient(sx - rx, sy - ry, sx + rx, sy + ry); g.addColorStop(0, '#aaa6c4'); g.addColorStop(1, '#66628a');
      D.ell(sx, sy, rx, ry, g, l); D.ell(sx - rx * 0.15, sy - ry * 0.55, rx * 0.7, ry * 0.38, '#ffffff');
      if (i === 0) { ctx.strokeStyle = 'rgba(40,36,80,0.45)'; ctx.lineWidth = Math.max(1, l * 0.6); ctx.beginPath(); ctx.moveTo(sx + rx * 0.1, sy - ry * 0.2); ctx.lineTo(sx + rx * 0.3, sy + ry * 0.5); ctx.stroke(); } });
  } else { // ледяной кристалл
    D.poly([x - cs * 0.22, y + cs * 0.2, x - cs * 0.14, y - cs * 0.3, x - cs * 0.02, y + cs * 0.2], '#9fd6ff', l); D.poly([x - cs * 0.04, y + cs * 0.2, x + cs * 0.1, y - cs * 0.42, x + cs * 0.22, y + cs * 0.2], '#c9ecff', l); D.poly([x + cs * 0.14, y + cs * 0.2, x + cs * 0.26, y - cs * 0.14, x + cs * 0.34, y + cs * 0.2], '#a8dcff', l);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(x + cs * 0.08, y - cs * 0.3); ctx.lineTo(x + cs * 0.05, y + cs * 0.1); ctx.stroke();
  }
};
// кусты по регионам (в них прячутся враги — форма «куста» сохраняется, а вид свой)
var oBush = D.bush;
D.bush = function (x, y, cs, t, sway, seed) {
  var G = Z.G, reg = G && G.info ? G.info.region : 0; if (reg === 0 || !G) return oBush.apply(this, arguments);
  var ctx = D.ctx, l = Math.max(1, cs * 0.035), a = sway + Math.sin(t * 1.3 + seed) * 0.03;
  ctx.save(); ctx.translate(x, y + cs * 0.3);
  D.ell(cs * 0.08, cs * 0.02, cs * 0.36, cs * 0.1, 'rgba(40,60,110,0.16)');
  if (reg === 1) {   // смородина с красными ягодами
    var cols = ['#3f8f4a', '#2f7a3c', '#4aa055'];
    for (var i = 0; i < 3; i++) { ctx.save(); ctx.rotate(a * (0.7 + i * 0.25)); var ox = (i - 1) * cs * 0.18, oy = -cs * (0.16 + (i === 1 ? 0.08 : 0)); D.circ(ox, oy, cs * (0.17 + (i === 1 ? 0.04 : 0)), cols[i], l); D.ell(ox - cs * 0.03, oy - cs * 0.12, cs * 0.1, cs * 0.04, '#ffffff'); ctx.restore(); }
    for (var b = 0; b < 5; b++) D.circ(-cs * 0.22 + b * cs * 0.11, -cs * (0.12 + (b % 2) * 0.12), cs * 0.04, '#e8384a', l * 0.4);
  } else if (reg === 2) {   // камыш
    for (var k = 0; k < 7; k++) { ctx.save(); ctx.rotate(a * (0.6 + k * 0.1)); var rx = -cs * 0.27 + k * cs * 0.09, rh = cs * (0.4 + ((seed * 7 + k * 13) % 10) / 30); ctx.strokeStyle = OL; ctx.lineWidth = l * 1.9; ctx.beginPath(); ctx.moveTo(rx, 0); ctx.quadraticCurveTo(rx + cs * 0.03, -rh * 0.6, rx + cs * 0.05, -rh); ctx.stroke(); ctx.strokeStyle = k % 2 ? '#8a9a5a' : '#a8b070'; ctx.lineWidth = l; ctx.stroke(); if (k % 2) D.ell(rx + cs * 0.05, -rh - cs * 0.04, cs * 0.035, cs * 0.08, '#7a4a2a', l * 0.5); ctx.restore(); }
    D.ell(0, 0, cs * 0.32, cs * 0.06, 'rgba(190,230,250,0.85)');
  } else if (reg === 3) {   // кедровый стланик со снегом
    var c3 = ['#2f5f50', '#25504a', '#3a6f5c'];
    for (var i3 = 0; i3 < 3; i3++) { ctx.save(); ctx.rotate(a * (0.7 + i3 * 0.25)); var ox3 = (i3 - 1) * cs * 0.2, oy3 = -cs * (0.12 + (i3 === 1 ? 0.06 : 0)); D.ell(ox3, oy3, cs * 0.2, cs * 0.13, c3[i3], l); D.ell(ox3 - cs * 0.02, oy3 - cs * 0.08, cs * 0.13, cs * 0.05, '#ffffff'); ctx.restore(); }
  } else {   // ледяной куст
    for (var i4 = 0; i4 < 5; i4++) { ctx.save(); ctx.rotate(a + (i4 - 2) * 0.35); D.poly([-cs * 0.04, 0, 0, -cs * (0.36 + (i4 % 2) * 0.12), cs * 0.04, 0], i4 % 2 ? '#bfe9ff' : '#d9f3ff', l * 0.8); ctx.restore(); }
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 2 + seed); D.circ(0, -cs * 0.2, cs * 0.05, '#ffffff'); ctx.globalAlpha = 1;
  }
  ctx.restore();
};
})();
