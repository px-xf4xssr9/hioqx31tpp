/* 2.6 · подробная рисовка новых героев и врагов (в стиле Деда Мороза и Снегурочки) + все герои в главном меню */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = D.OL;
function c() { return D.ctx; }
function G2(x0, y0, x1, y1, a, b) { var g = c().createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function RG(x, y, r, a, b) { var g = c().createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function path(pts, fill, l) { var x = c(); x.beginPath(); x.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); x.fillStyle = fill; x.fill(); if (l) { x.lineWidth = l; x.strokeStyle = OL; x.lineJoin = 'round'; x.stroke(); } }
function stroke(col, w, f) { var x = c(); x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); f(x); x.stroke(); }
var TK = false, BL = false;
Z.KOS_FACE = {"prof":[0.16,-0.947,0.346,-0.904,0.457,-0.862,0.537,-0.819,0.596,-0.777,0.66,-0.734,0.707,-0.691,0.75,-0.649,0.782,-0.606,0.787,-0.564,0.798,-0.521,0.856,-0.479,0.894,-0.436,0.915,-0.394,0.936,-0.351,0.936,-0.309,0.926,-0.266,0.947,-0.223,0.984,-0.181,0.992,-0.138,0.997,-0.096,1.0,-0.053,0.997,-0.011,0.992,0.032,0.987,0.074,0.987,0.117,0.976,0.16,0.976,0.202,0.963,0.245,0.955,0.287,0.936,0.33,0.923,0.372,0.899,0.415,0.872,0.457,0.846,0.5,0.816,0.543,0.777,0.585,0.723,0.628,0.673,0.67,0.614,0.713,0.553,0.755,0.521,0.798,0.513,0.84,0.508,0.883,0.508,0.926,0.505,0.968,0.5,1.011,0.495,1.053,0.489,1.096,0.479,1.138,0.46,1.181,0.423,1.223,0.362,1.266,0.263,1.309,0.077,1.351],"sock":[0.032,-0.404,-0.069,-0.394,-0.197,-0.33,-0.271,-0.234,-0.319,-0.096,-0.314,0.059,-0.266,0.176,-0.165,0.271,-0.032,0.335,-0.048,0.372,-0.144,0.383,-0.128,0.394,-0.005,0.394,0.128,0.346,0.239,0.229,0.303,0.074,0.319,-0.043,0.314,-0.117,0.266,-0.25,0.154,-0.362],"eye":[0.069,0.063,0.151],"nose":[-0.013,0.34,-0.04,0.362,-0.109,0.537,-0.098,0.553,-0.072,0.564,-0.035,0.553,-0.013,0.527,0.019,0.516,0.04,0.532,0.04,0.543,0.077,0.559,0.104,0.532,0.104,0.489,0.04,0.372,0.008,0.34],"mouth":[0.319,0.037,0.271,-0.069,0.218,-0.112,0.191,-0.197,0.117,-0.191,0.059,-0.234,0.027,-0.197,-0.011,-0.186,-0.085,-0.218,-0.101,-0.202,-0.112,-0.149,-0.229,-0.074,-0.282,-0.011,-0.324,0.117,-0.293,0.16,-0.234,0.17,-0.186,0.229,-0.128,0.176,-0.09,0.17,-0.043,0.186,0.021,0.16,0.053,0.165,0.09,0.191,0.112,0.176,0.165,0.176,0.207,0.213,0.229,0.202,0.266,0.144,0.298,0.133,0.314,0.112],"mouthC":0.904,"crown":[-0.133,-1.947,-0.17,-1.952,-0.197,-1.92,-0.346,-1.42,-0.404,-1.426,-0.926,-1.739,-0.989,-1.729,-0.984,-1.074,-1.005,-1.048,-1.537,-1.16,-1.59,-1.144,-1.527,-1.005,-1.106,-0.447,-1.037,-0.447,-0.878,-0.532,-0.809,-0.484,-0.766,-0.559,-0.606,-0.686,-0.218,-0.899,0.218,-1.186,0.218,-1.234],"gemR":[-0.597,-1.088,0.137],"gemG":[-0.109,-1.291,0.097],"gemB":[-1.027,-0.782,0.11]};
// рот при разговоре: открывается в такт речи
function mouth(x, y, w) { w *= 1.5; var t = Z.time, o = 0.25 + 0.75 * Math.abs(Math.sin(t * 17) * Math.sin(t * 5.3 + 1)); D.ell(x, y, w * 0.5, w * 0.42 * o + w * 0.06, '#5a1a22', Math.max(1, w * 0.12)); D.ell(x, y + w * 0.2 * o, w * 0.28, w * 0.12 * o, '#ff7a8a'); }
Z.mouthAt = mouth;
// глаза с бликом, румянец
function eye(x, y, r, look, lid) {
  if (BL || (D.blinkNow && D.blinkNow())) { stroke(OL, r * 0.45, function (q) { q.arc(x, y - r * 0.2, r * 0.8, 0.2, Math.PI - 0.2); }); return; }
  D.circ(x, y, r, '#ffffff', r * 0.35);
  D.circ(x + look * r * 0.25, y + r * 0.05, r * 0.58, OL);
  D.circ(x + look * r * 0.25 + r * 0.2, y - r * 0.2, r * 0.2, '#fff');
  if (lid) { c().fillStyle = lid; c().beginPath(); c().arc(x, y, r * 1.05, Math.PI * 1.05, Math.PI * 1.95); c().fill(); stroke(OL, r * 0.3, function (q) { q.moveTo(x - r, y - r * 0.15); q.lineTo(x + r, y - r * 0.15); }); }
}
function blush(x, y, r) { c().globalAlpha = 0.45; D.circ(x, y, r, '#ff8a8a'); c().globalAlpha = 1; }

// ---------- ЕМЕЛЯ НА ПЕЧИ ----------
function emelya(x, y, R, o) {
  var ctx = c(), d = o.dir || 1, l = Math.max(1.4, R * 0.075), t = Z.time, bob = o.walk ? Math.sin(t * 14) * R * 0.03 : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
  D.ell(0, R * 0.02, R * 0.95, R * 0.18, 'rgba(30,40,80,0.22)');
  // лыжи с загнутыми носами
  stroke(OL, l * 2.6, function (q) { q.moveTo(-R * 0.85, 0); q.lineTo(R * 0.7, 0); q.quadraticCurveTo(R * 0.95, 0, R * 0.98, -R * 0.2); });
  stroke('#b5763f', l * 1.4, function (q) { q.moveTo(-R * 0.85, 0); q.lineTo(R * 0.7, 0); q.quadraticCurveTo(R * 0.95, 0, R * 0.98, -R * 0.2); });
  ctx.translate(0, bob);
  // печь: белёная, с кирпичным низом и тенью
  D.rr(-R * 0.7, -R * 1.02, R * 1.3, R * 0.98, R * 0.16); ctx.fillStyle = G2(-R * 0.7, 0, R * 0.6, 0, '#fffaf2', '#d9cfc0'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  // 2.12.39: кирпичи — внутри полосы кладки (крайний кирпич второго ряда торчал за правый край печи)
  ctx.save(); ctx.beginPath(); ctx.rect(-R * 0.66, -R * 0.3, R * 1.22, R * 0.24); ctx.clip();
  for (var b = 0; b < 2; b++) for (var k = -1; k < 5; k++) { D.rr(-R * 0.66 + k * R * 0.25 + (b ? R * 0.12 : 0), -R * 0.3 + b * R * 0.12, R * 0.22, R * 0.1, R * 0.02); ctx.fillStyle = b ? '#b84a36' : '#c95b42'; ctx.fill(); }
  ctx.restore();
  ctx.lineWidth = l * 0.6; ctx.strokeStyle = 'rgba(27,36,72,0.5)'; ctx.strokeRect(-R * 0.66, -R * 0.3, R * 1.22, R * 0.24);
  // устье с огнём
  ctx.beginPath(); ctx.moveTo(-R * 0.22, -R * 0.36); ctx.lineTo(-R * 0.22, -R * 0.62); ctx.quadraticCurveTo(0, -R * 0.84, R * 0.22, -R * 0.62); ctx.lineTo(R * 0.22, -R * 0.36); ctx.closePath(); ctx.fillStyle = '#2a1a1a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  var fl = 0.7 + 0.3 * Math.sin(t * 11);
  ctx.globalAlpha = 0.9; path([-R * 0.14, -R * 0.38, -R * 0.05, -R * 0.6 * fl - R * 0.05, R * 0.02, -R * 0.45, R * 0.08, -R * 0.62 * fl, R * 0.15, -R * 0.38], '#ff9a3d'); path([-R * 0.06, -R * 0.38, 0, -R * 0.5 * fl, R * 0.07, -R * 0.38], '#ffe066'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.25 * fl; D.circ(0, -R * 0.45, R * 0.4, '#ffb347'); ctx.globalAlpha = 1;
  // горшки на приступке
  [[-0.5, '#c8644a'], [0.42, '#9a5a3a']].forEach(function (p) { D.rr(R * p[0] - R * 0.09, -R * 0.56, R * 0.18, R * 0.16, R * 0.06); ctx.fillStyle = p[1]; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke(); });
  // труба-мортира
  // 2.7.21: залп — труба дёргается отдачей, из жерла вспышка и клуб дыма
  var ep = o.atkP != null && o.atkP >= 0 ? o.atkP : -1, ek = ep >= 0 ? Math.max(0, 1 - ep / 0.35) : 0, ef = ep >= 0 && ep < 0.3 ? 1 - ep / 0.3 : 0;
  ctx.save(); ctx.translate(R * 0.42 - ek * R * 0.07, -R * 1.0 + ek * R * 0.06); ctx.rotate(-0.3 - (o.atk ? 0.25 : 0) - ek * 0.15);
  D.rr(-R * 0.11, -R * 0.55, R * 0.22, R * 0.58, R * 0.05); ctx.fillStyle = G2(-R * 0.11, 0, R * 0.11, 0, '#c9d0dc', '#6a7290'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  D.rr(-R * 0.14, -R * 0.62, R * 0.28, R * 0.1, R * 0.04); ctx.fillStyle = '#4a5068'; ctx.fill(); ctx.stroke();
  if (ep >= 0 && ep < 0.85) { var eu = ep / 0.85; ctx.globalAlpha = 0.8 * (1 - eu); for (var es = 0; es < 4; es++) D.circ((es - 1.5) * R * 0.09 * (0.4 + eu), -R * (0.7 + eu * 0.55) - (es % 2) * R * 0.06, R * (0.1 + eu * 0.17), '#eef2fa', l * 0.4); ctx.globalAlpha = 1; }
  if (ef > 0) { ctx.globalAlpha = ef; path([0, -R * 1.05, R * 0.1, -R * 0.78, R * 0.22, -R * 0.82, R * 0.13, -R * 0.64, -R * 0.13, -R * 0.64, -R * 0.22, -R * 0.82, -R * 0.1, -R * 0.78], '#ffd24a'); D.circ(0, -R * 0.72, R * 0.09, '#fff6c8'); ctx.globalAlpha = 1; }
  ctx.restore();
  for (var s = 0; s < 3; s++) { var p2 = (t * 0.7 + s / 3) % 1; ctx.globalAlpha = 0.55 * (1 - p2); D.circ(R * 0.62 + p2 * R * 0.3, -R * 1.62 - p2 * R * 0.7, R * (0.09 + p2 * 0.13), '#eef2fa'); } ctx.globalAlpha = 1;
  // подушка и лоскутное одеяло
  D.ell(-R * 0.42, -R * 1.08, R * 0.26, R * 0.12, '#ffffff', l * 0.7);
  D.rr(-R * 0.25, -R * 1.2, R * 0.78, R * 0.22, R * 0.1); ctx.fillStyle = G2(0, -R * 1.2, 0, -R * 0.98, '#e8484f', '#b52a33'); ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
  for (var q = 0; q < 3; q++) { D.rr(-R * 0.18 + q * R * 0.24, -R * 1.16, R * 0.12, R * 0.12, R * 0.02); ctx.fillStyle = ['#ffd54a', '#4aa3ff', '#6fe07a'][q]; ctx.fill(); }
  if (D.rig) D.rigArm('f', -R * 0.15, -R * 1.16, D.rig.f.a, D.rig.f.e, R * 0.22, R * 0.2, R * 0.13, '#d84a4a', l * 0.6, '#ffd7b0', R * 0.065, null);
  // Емеля: рука под щекой, ушанка, веснушки
  D.ell(-R * 0.28, -R * 1.23, R * 0.1, R * 0.07, '#e8484f', l * 0.6);
  D.circ(-R * 0.4, -R * 1.36, R * 0.24, RG(-R * 0.4, -R * 1.36, R * 0.24, '#ffe6cc', '#f5c49a'), l);
  ctx.beginPath(); ctx.arc(-R * 0.4, -R * 1.42, R * 0.27, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fillStyle = G2(0, -R * 1.7, 0, -R * 1.4, '#8a6a4a', '#5a3f28'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  D.ell(-R * 0.66, -R * 1.32, R * 0.08, R * 0.16, '#6b4a2f', l * 0.7); D.rr(-R * 0.68, -R * 1.52, R * 0.56, R * 0.09, R * 0.04); ctx.fillStyle = '#d8c8b0'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke();
  stroke('#e8a050', l * 0.9, function (q2) { q2.moveTo(-R * 0.22, -R * 1.5); q2.lineTo(-R * 0.15, -R * 1.42); q2.moveTo(-R * 0.25, -R * 1.47); q2.lineTo(-R * 0.18, -R * 1.38); });
  eye(-R * 0.46, -R * 1.38, R * 0.055, 1, o.walk ? null : '#f5c49a'); eye(-R * 0.3, -R * 1.38, R * 0.055, 1, o.walk ? null : '#f5c49a');
  [[-0.5, -1.29], [-0.45, -1.27], [-0.27, -1.29], [-0.32, -1.27]].forEach(function (f) { D.circ(R * f[0], R * f[1], R * 0.012, '#c47a4a'); });
  blush(-R * 0.52, -R * 1.28, R * 0.05); blush(-R * 0.26, -R * 1.28, R * 0.05);
  stroke(OL, l * 0.6, function (q3) { q3.arc(-R * 0.38, -R * 1.28, R * 0.06, 0.3, Math.PI - 0.3); });
  if (TK) mouth(-R * 0.38, -R * 1.25, R * 0.1);
  ctx.restore();
}
// ---------- КОЛОБОК ----------
function kolobok(x, y, R, o) {
  var ctx = c(), d = o.dir || 1, l = Math.max(1.4, R * 0.075), t = Z.time, r = R * 0.62, hop = o.walk ? Math.abs(Math.sin(t * 12)) * R * 0.12 : 0, sq = o.walk ? 1 + Math.sin(t * 24) * 0.04 : 1;
  var kp = o.atkP != null && o.atkP >= 0 ? o.atkP : -1, dash = 0, ks = 0;   // 2.7.21: удар с разбега
  if (kp >= 0) { dash = (kp < 0.4 ? Math.sin(kp / 0.4 * Math.PI / 2) : Math.cos((kp - 0.4) / 0.6 * Math.PI / 2)) * r * 1.1 * d; ks = kp > 0.3 && kp < 0.62 ? Math.sin((kp - 0.3) / 0.32 * Math.PI) : 0; hop = kp < 0.4 ? Math.sin(kp / 0.4 * Math.PI) * R * 0.1 : 0; sq = 1 - ks * 0.14; }
  D.ell(x + dash, y, r * 0.85 * (1 - hop / R), r * 0.2, 'rgba(30,40,80,0.22)');
  if (ks > 0.05) { for (var kz = 0; kz < 3; kz++) { var ka = -1 + kz * 0.9; D.star(x + dash + d * (r * 1.12 + Math.cos(ka) * r * 0.45 * ks), y - r + Math.sin(ka) * r * 0.75, r * 0.26 * (0.5 + ks * 0.5), '#ffe066', Math.max(1, l * 0.45)); } stroke('rgba(255,255,255,0.85)', l, function (q) { for (var kk = 0; kk < 3; kk++) { q.moveTo(x + dash + d * r * 1.02, y - r + (kk - 1) * r * 0.45); q.lineTo(x + dash + d * r * (1.25 + ks * 0.2), y - r + (kk - 1) * r * 0.62); } }); }
  ctx.save(); ctx.translate(x + dash, y - r * sq - hop); ctx.scale(d * sq, 1 / sq);
  if (o.walk) { stroke('rgba(255,255,255,0.7)', l, function (q) { for (var i = 0; i < 3; i++) { q.moveTo(-r * 1.15 - i * r * 0.15, -r * 0.3 + i * r * 0.3); q.lineTo(-r * 1.55 - i * r * 0.15, -r * 0.3 + i * r * 0.3); } }); }
  D.circ(0, 0, r, RG(0, 0, r, '#ffe7a0', '#d98a2a'), l);
  // корочка и мучная пыль
  ctx.globalAlpha = 0.35; D.ell(r * 0.2, r * 0.45, r * 0.65, r * 0.35, '#b56a1a'); ctx.globalAlpha = 0.6; D.ell(-r * 0.35, -r * 0.5, r * 0.25, r * 0.12, '#fff6dc'); ctx.globalAlpha = 1;
  [[-0.5, 0.35], [0.55, 0.3], [-0.2, 0.62], [0.25, 0.65], [0.6, -0.35]].forEach(function (p) { D.ell(r * p[0], r * p[1], r * 0.05, r * 0.03, '#8a5a2a'); });
  // спортивная повязка с хвостиками
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r - l * 0.3, 0, 7); ctx.clip();
  ctx.fillStyle = G2(0, -r * 0.62, 0, -r * 0.4, '#ff5a63', '#c22a35'); ctx.fillRect(-r, -r * 0.64, r * 2, r * 0.24);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-r, -r * 0.55, r * 2, r * 0.05); ctx.restore();
  ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.beginPath(); ctx.moveTo(-r * 0.92, -r * 0.64); ctx.lineTo(r * 0.92, -r * 0.64); ctx.moveTo(-r * 0.97, -r * 0.4); ctx.lineTo(r * 0.97, -r * 0.4); ctx.stroke();
  var fl = Math.sin(t * 10) * r * 0.08;
  path([-r * 0.95, -r * 0.55, -r * 1.35, -r * 0.75 + fl, -r * 1.3, -r * 0.5 + fl], '#e8484f', l * 0.6); path([-r * 0.95, -r * 0.5, -r * 1.4, -r * 0.4 - fl, -r * 1.25, -r * 0.25 - fl], '#c22a35', l * 0.6);
  // лицо
  eye(r * 0.08, -r * 0.12, r * 0.17, 1); eye(r * 0.5, -r * 0.12, r * 0.15, 1);
  stroke(OL, l * 0.9, function (q) { q.moveTo(-r * 0.05, -r * 0.4); q.quadraticCurveTo(r * 0.08, -r * 0.48, r * 0.2, -r * 0.38); q.moveTo(r * 0.4, -r * 0.4); q.quadraticCurveTo(r * 0.52, -r * 0.47, r * 0.62, -r * 0.38); });
  ctx.beginPath(); ctx.moveTo(r * 0.05, r * 0.18); ctx.quadraticCurveTo(r * 0.3, r * 0.5, r * 0.6, r * 0.16); ctx.quadraticCurveTo(r * 0.32, r * 0.25, r * 0.05, r * 0.18); ctx.fillStyle = '#7a2a2a'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
  if (TK) mouth(r * 0.32, r * 0.28, r * 0.42);
  D.ell(r * 0.32, r * 0.3, r * 0.1, r * 0.05, '#ff8a8a');
  blush(-r * 0.12, r * 0.12, r * 0.14); blush(r * 0.75, r * 0.1, r * 0.11);
  ctx.restore();
}
// ---------- ВАСИЛИСА ПРЕМУДРАЯ ----------
function vasilisa(x, y, R, o) {
  var ctx = c(), d = o.dir || 1, l = Math.max(1.4, R * 0.075), t = Z.time, bob = o.walk ? Math.abs(Math.sin(t * 8)) * R * 0.05 : 0, sw = o.walk ? Math.sin(t * 8) * R * 0.04 : 0;
  ctx.save(); ctx.translate(x, y - bob); ctx.scale(d, 1);
  D.ell(0, bob, R * 0.6, R * 0.16, 'rgba(30,40,80,0.22)');
  // коса за спиной
  stroke(OL, R * 0.2, function (q) { q.moveTo(-R * 0.18, -R * 1.75); q.quadraticCurveTo(-R * 0.55, -R * 1.2, -R * 0.38 + sw, -R * 0.6); });
  stroke('#c0702e', R * 0.14, function (q) { q.moveTo(-R * 0.18, -R * 1.75); q.quadraticCurveTo(-R * 0.55, -R * 1.2, -R * 0.38 + sw, -R * 0.6); });
  for (var b = 0; b < 4; b++) stroke('#8a4a1a', l * 0.5, function (q) { var yy = -R * (1.55 - b * 0.22); q.moveTo(-R * 0.42 - b * 0.02 * R, yy); q.lineTo(-R * 0.3, yy + R * 0.05); });
  path([-R * 0.38 + sw, -R * 0.62, -R * 0.5 + sw, -R * 0.42, -R * 0.26 + sw, -R * 0.46], '#2fae7a', l * 0.6);
  // сарафан колоколом с золотой каймой
  ctx.beginPath(); ctx.moveTo(-R * 0.58, 0); ctx.quadraticCurveTo(-R * 0.5, -R * 0.8, -R * 0.3, -R * 1.42); ctx.lineTo(R * 0.3, -R * 1.42); ctx.quadraticCurveTo(R * 0.5, -R * 0.8, R * 0.58, 0); ctx.quadraticCurveTo(0, R * 0.08, -R * 0.58, 0); ctx.closePath();
  ctx.fillStyle = G2(-R * 0.6, 0, R * 0.6, 0, '#8a6af0', '#4a2f9a'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  D.rr(-R * 0.58, -R * 0.14, R * 1.16, R * 0.12, R * 0.04); ctx.fillStyle = '#ffd54a'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.stroke();
  for (var i = 0; i < 7; i++) D.circ(-R * 0.5 + i * R * 0.166, -R * 0.08, R * 0.025, '#e8484f');
  ctx.fillStyle = '#ffd54a'; ctx.fillRect(-R * 0.07, -R * 1.4, R * 0.14, R * 1.26);
  for (var j = 0; j < 5; j++) D.circ(0, -R * (0.3 + j * 0.22), R * 0.04, '#e8484f', l * 0.3);
  // рукава-фонарики и клубок
  var RGv = D.rig, vb = null, vf = null;
  if (RGv) { vb = D.rigArm('b', -R * 0.36, -R * 1.4, RGv.b.a, RGv.b.e, R * 0.22, R * 0.2, R * 0.26, '#ffffff', l * 0.8, '#ffe2c8', R * 0.085, null); vf = D.rigArm('f', R * 0.28, -R * 1.3, RGv.f.a, RGv.f.e, R * 0.2, R * 0.2, R * 0.26, '#ffffff', l * 0.8, '#ffe2c8', R * 0.08, null); }
  else { D.ell(-R * 0.36, -R * 1.18, R * 0.16, R * 0.24, '#ffffff', l * 0.8); D.circ(-R * 0.4, -R * 0.92, R * 0.09, '#ffe2c8', l * 0.6); }
  if (!D.armOff && !RGv) { ctx.save(); ctx.translate(R * 0.36, -R * 1.18); ctx.rotate(-0.6); D.ell(0, R * 0.1, R * 0.16, R * 0.24, '#ffffff', l * 0.8); ctx.restore(); }
  var gl = 0.6 + 0.4 * Math.sin(t * 5), bx = R * 0.6, by = -R * 1.28; if (RGv) { var vh = RGv.f.busy ? vb : vf; bx = vh.x; by = vh.y - R * 0.17; }
  var vp = o.atkP != null && o.atkP >= 0 ? o.atkP : -1, vfl = vp >= 0 ? Math.sin(Math.min(1, vp / 0.55) * Math.PI) : 0;   // 2.7.21: вспышка клубка при чарах
  if (vfl > 0.04 && (!D.armOff || RGv)) { ctx.globalAlpha = 0.85 * vfl; for (var vr = 0; vr < 8; vr++) { var va = vr * 0.785 + vp * 2; stroke('#f4e8ff', l * 0.8, function (q) { q.moveTo(bx + Math.cos(va) * R * 0.2, by + Math.sin(va) * R * 0.2); q.lineTo(bx + Math.cos(va) * R * (0.32 + vfl * 0.18), by + Math.sin(va) * R * (0.32 + vfl * 0.18)); }); } ctx.globalAlpha = 1; gl += vfl * 1.3; }
  if (!D.armOff || RGv) { ctx.globalAlpha = Math.min(0.9, 0.35 * gl); D.circ(bx, by, R * (0.3 + vfl * 0.1), '#d9b8ff'); ctx.globalAlpha = 1;
  D.circ(bx, by, R * 0.14, RG(bx, by, R * 0.14, '#ffffff', '#c79bff'), l * 0.7);
  stroke('#9a6af0', l * 0.5, function (q) { q.arc(bx, by, R * 0.08, 0.5, 4); q.moveTo(bx - R * 0.12, by - R * 0.02); q.lineTo(bx + R * 0.12, by + R * 0.04); }); }
  for (var s = 0; s < 3; s++) { var a = t * 3 + s * 2.1; D.star(bx + Math.cos(a) * R * 0.28, by + Math.sin(a) * R * 0.22, R * 0.04, '#fff6b0'); }
  // голова, очки, косынка
  D.circ(0, -R * 1.72, R * 0.3, RG(0, -R * 1.72, R * 0.3, '#fff0e0', '#f5cba8'), l);
  ctx.beginPath(); ctx.moveTo(-R * 0.3, -R * 1.78); ctx.quadraticCurveTo(-R * 0.25, -R * 2.12, 0, -R * 2.12); ctx.quadraticCurveTo(R * 0.25, -R * 2.12, R * 0.3, -R * 1.78); ctx.quadraticCurveTo(0, -R * 1.9, -R * 0.3, -R * 1.78); ctx.closePath();
  ctx.fillStyle = G2(0, -R * 2.12, 0, -R * 1.8, '#3fcf8f', '#1f8a5a'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  [[-0.15, -1.98], [0.05, -2.04], [0.18, -1.92], [-0.02, -1.9]].forEach(function (p) { D.circ(R * p[0], R * p[1], R * 0.025, '#ffffff'); });
  path([R * 0.22, -R * 1.82, R * 0.42, -R * 1.72, R * 0.3, -R * 1.66], '#1f8a5a', l * 0.6);
  stroke('#c0702e', l * 1.6, function (q) { q.moveTo(-R * 0.22, -R * 1.84); q.quadraticCurveTo(-R * 0.05, -R * 1.92, R * 0.18, -R * 1.85); });
  D.circ(-R * 0.08, -R * 1.72, R * 0.085, 'rgba(200,230,255,0.5)', l * 0.6); D.circ(R * 0.14, -R * 1.72, R * 0.085, 'rgba(200,230,255,0.5)', l * 0.6);
  stroke(OL, l * 0.6, function (q) { q.moveTo(R * 0.005, -R * 1.73); q.lineTo(R * 0.055, -R * 1.73); });
  D.circ(-R * 0.07, -R * 1.71, R * 0.035, OL); D.circ(R * 0.15, -R * 1.71, R * 0.035, OL); D.circ(-R * 0.055, -R * 1.725, R * 0.012, '#fff'); D.circ(R * 0.165, -R * 1.725, R * 0.012, '#fff');
  blush(-R * 0.15, -R * 1.6, R * 0.05); blush(R * 0.22, -R * 1.6, R * 0.05);
  stroke(OL, l * 0.6, function (q) { q.arc(R * 0.04, -R * 1.62, R * 0.06, 0.4, Math.PI - 0.8); });
  if (TK) mouth(R * 0.04, -R * 1.58, R * 0.1);
  ctx.restore();
}
// ---------- КОТ-БАЮН ----------
function kot(x, y, R, o) {
  var ctx = c(), d = o.dir || 1, l = Math.max(1.4, R * 0.075), t = Z.time, tail = Math.sin(t * 2.5) * 0.25, br = 1 + Math.sin(t * 1.6) * 0.02;
  ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
  D.ell(0, 0, R * 0.62, R * 0.16, 'rgba(30,40,80,0.22)');
  // пушистый хвост
  stroke(OL, R * 0.3, function (q) { q.moveTo(-R * 0.4, -R * 0.15); q.quadraticCurveTo(-R * 0.95, -R * 0.2, -R * 0.8 + tail * R * 0.3, -R * 0.85); });
  stroke('#8e98b8', R * 0.22, function (q) { q.moveTo(-R * 0.4, -R * 0.15); q.quadraticCurveTo(-R * 0.95, -R * 0.2, -R * 0.8 + tail * R * 0.3, -R * 0.85); });
  // 2.11.5: полоски хвоста — поперёк хвоста по его кривой и короче его толщины, не вылезают за контур
  (function () { var P0 = [-R * 0.4, -R * 0.15], P1 = [-R * 0.95, -R * 0.2], P2 = [-R * 0.8 + tail * R * 0.3, -R * 0.85];
    [0.42, 0.62, 0.8].forEach(function (u) { var v = 1 - u, px = v * v * P0[0] + 2 * v * u * P1[0] + u * u * P2[0], py = v * v * P0[1] + 2 * v * u * P1[1] + u * u * P2[1], tx = 2 * v * (P1[0] - P0[0]) + 2 * u * (P2[0] - P1[0]), ty = 2 * v * (P1[1] - P0[1]) + 2 * u * (P2[1] - P1[1]), tl = Math.hypot(tx, ty) || 1, nx = -ty / tl * R * 0.075, ny = tx / tl * R * 0.075;
      stroke('#5f6a8e', R * 0.045, function (q) { q.moveTo(px - nx, py - ny); q.lineTo(px + nx, py + ny); }); }); })();
  // тело-груша
  ctx.save(); ctx.scale(br, br);
  var bodyP = function () { ctx.beginPath(); ctx.moveTo(-R * 0.5, 0); ctx.quadraticCurveTo(-R * 0.6, -R * 0.75, -R * 0.25, -R * 1.05); ctx.lineTo(R * 0.25, -R * 1.05); ctx.quadraticCurveTo(R * 0.6, -R * 0.75, R * 0.5, 0); ctx.quadraticCurveTo(0, R * 0.06, -R * 0.5, 0); ctx.closePath(); };
  bodyP(); ctx.fillStyle = G2(-R * 0.5, 0, R * 0.5, 0, '#a8b2cf', '#6f7a9e'); ctx.fill();
  // 2.11.5: полоски шерсти обрезаны по телу — заходят из-за контура и не торчат наружу
  ctx.save(); bodyP(); ctx.clip();
  for (var s = 0; s < 3; s++) stroke('#5f6a8e', l * 0.9, function (q) { var yy = -R * (0.3 + s * 0.22); q.moveTo(-R * 0.7, yy - R * 0.02); q.quadraticCurveTo(-R * 0.45, yy - R * 0.04, -R * 0.3, yy + R * 0.02); q.moveTo(R * 0.7, yy - R * 0.02); q.quadraticCurveTo(R * 0.47, yy - R * 0.04, R * 0.36, yy + R * 0.02); });
  ctx.restore();
  bodyP(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  D.ell(R * 0.04, -R * 0.45, R * 0.24, R * 0.36, '#e8ecf5');
  D.ell(-R * 0.22, -R * 0.04, R * 0.16, R * 0.08, '#c9d0e4', l * 0.7); D.ell(R * 0.28, -R * 0.04, R * 0.16, R * 0.08, '#c9d0e4', l * 0.7);
  // гусли на коленях
  path([R * 0.0, -R * 0.35, R * 0.55, -R * 0.62, R * 0.62, -R * 0.42, R * 0.15, -R * 0.18], G2(0, -R * 0.6, 0, -R * 0.2, '#e0a860', '#a8703a'), l * 0.8);
  for (var g = 0; g < 4; g++) stroke('#fff3c4', l * 0.35, function (q) { q.moveTo(R * (0.08 + g * 0.1), -R * (0.27 + g * 0.06)); q.lineTo(R * (0.2 + g * 0.1), -R * (0.22 + g * 0.06 + 0.15)); });
  D.ell(R * 0.42, -R * 0.42, R * 0.07, R * 0.09, '#8e98b8', l * 0.6);
  ctx.restore();
  // голова
  var hy = -R * 1.32;
  path([-R * 0.32, hy - R * 0.12, -R * 0.36, hy - R * 0.5, -R * 0.08, hy - R * 0.28], '#9aa4c4', l * 0.8); path([-R * 0.29, hy - R * 0.17, -R * 0.31, hy - R * 0.4, -R * 0.13, hy - R * 0.27], '#ffb8c8');
  path([R * 0.32, hy - R * 0.12, R * 0.36, hy - R * 0.5, R * 0.08, hy - R * 0.28], '#9aa4c4', l * 0.8); path([R * 0.29, hy - R * 0.17, R * 0.31, hy - R * 0.4, R * 0.13, hy - R * 0.27], '#ffb8c8');
  D.ell(0, hy, R * 0.38, R * 0.32, RG(0, hy, R * 0.38, '#c2cadf', '#7f8aae'), l);
  D.ell(0, hy + R * 0.12, R * 0.2, R * 0.13, '#eef1f8');
  stroke('#5f6a8e', l * 0.7, function (q) { q.moveTo(-R * 0.08, hy - R * 0.3); q.lineTo(-R * 0.06, hy - R * 0.18); q.moveTo(0, hy - R * 0.32); q.lineTo(0, hy - R * 0.18); q.moveTo(R * 0.08, hy - R * 0.3); q.lineTo(R * 0.06, hy - R * 0.18); });
  // сонные глаза
  var sleepy = !o.walk;
  if (sleepy) stroke(OL, l * 0.9, function (q) { q.arc(-R * 0.14, hy - R * 0.02, R * 0.07, 0.2, Math.PI - 0.2); q.moveTo(R * 0.21, hy - R * 0.02); q.arc(R * 0.14, hy - R * 0.02, R * 0.07, 0.2, Math.PI - 0.2); });
  else { D.ell(-R * 0.14, hy - R * 0.02, R * 0.07, R * 0.08, '#c8f070', l * 0.5); D.ell(R * 0.14, hy - R * 0.02, R * 0.07, R * 0.08, '#c8f070', l * 0.5); D.ell(-R * 0.14, hy - R * 0.02, R * 0.02, R * 0.07, OL); D.ell(R * 0.14, hy - R * 0.02, R * 0.02, R * 0.07, OL); }
  path([-R * 0.04, hy + R * 0.07, R * 0.04, hy + R * 0.07, 0, hy + R * 0.12], '#ff8aa8', l * 0.4);
  stroke(OL, l * 0.6, function (q) { q.moveTo(0, hy + R * 0.12); q.quadraticCurveTo(-R * 0.06, hy + R * 0.2, -R * 0.12, hy + R * 0.15); q.moveTo(0, hy + R * 0.12); q.quadraticCurveTo(R * 0.06, hy + R * 0.2, R * 0.12, hy + R * 0.15); });
  if (TK) mouth(0, hy + R * 0.17, R * 0.12);
  stroke('rgba(255,255,255,0.9)', l * 0.4, function (q) { [-1, 1].forEach(function (sd) { q.moveTo(sd * R * 0.18, hy + R * 0.1); q.lineTo(sd * R * 0.5, hy + R * 0.04); q.moveTo(sd * R * 0.18, hy + R * 0.14); q.lineTo(sd * R * 0.5, hy + R * 0.16); }); });
  blush(-R * 0.24, hy + R * 0.08, R * 0.05); blush(R * 0.24, hy + R * 0.08, R * 0.05);
  // ночной колпак со звёздами
  ctx.beginPath(); ctx.moveTo(-R * 0.3, hy - R * 0.18); ctx.quadraticCurveTo(R * 0.05, hy - R * 0.6, R * 0.55, hy - R * 0.5 + Math.sin(t * 2) * R * 0.04); ctx.quadraticCurveTo(R * 0.2, hy - R * 0.32, R * 0.3, hy - R * 0.18); ctx.closePath();
  ctx.fillStyle = G2(0, hy - R * 0.6, 0, hy - R * 0.2, '#5a6fd8', '#2f3f9a'); ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
  D.star(-R * 0.05, hy - R * 0.32, R * 0.04, '#ffd54a'); D.star(R * 0.22, hy - R * 0.4, R * 0.035, '#ffd54a');
  D.circ(R * 0.56, hy - R * 0.5 + Math.sin(t * 2) * R * 0.04, R * 0.08, '#ffffff', l * 0.5);
  if (sleepy) { var zp = (t * 0.5) % 1; ctx.globalAlpha = 1 - zp; D.text('z', R * 0.5 + zp * R * 0.2, hy - R * 0.75 - zp * R * 0.4, R * 0.22, '#c9d2ff', 'center', 'middle', 2); ctx.globalAlpha = 1; }
  ctx.restore();
}
var HEROES = { emelya: emelya, kolobok: kolobok, vasilisa: vasilisa, kot: kot };
var EKEY = { raz: 'RAZ', yaga: 'YAG', leshy: 'LES', kiki: 'KIK', solovey: 'SOL', giant: 'GIA', gorynych: 'GOR', koschei: 'KOS', chariot: 'MET', witch: 'MET', engineer: 'ENO', sculptor: 'ENO' };
Z.talkKey = function () { var s = Z.sub; if (!s || !(s.t > 0) || !s.id || !Z.VL[s.id]) return null; var k = Z.VL[s.id][0]; return k.indexOf('GOR') === 0 ? 'GOR' : k; };
function blinkAt(x) { return ((Z.time * 0.9 + Math.abs(Math.sin(x * 12.9898)) * 7) % 4.1) < 0.12; }
// рот поверх старых спрайтов (Дед Мороз, Снегурочка, Белка, Пломбир): [x, y, ширина] в долях R
var OLDM = { belka: [0.24, -1.09, 0.1], plombir: [0, -1.18, 0.14] };
var prevAlly = D.ally;
D.ally = function (type, x, y, R, o) {
  o = o || {};
  var talk = o.talk || (Z.talkKey() && Z.talkKey() === Z.VKEY[type] && !o.noTalk);
  if (HEROES[type]) { TK = talk; BL = !talk && blinkAt(x); HEROES[type](x, y, R, o); TK = BL = false; return; }
  var bob = talk ? Math.abs(Math.sin(Z.time * 9)) * R * 0.04 : 0;
  prevAlly(type, x, y - bob, R, o);
  var m = OLDM[type]; if (talk && m) { var sR = type === 'sneg' ? R * 0.92 : R; mouth(x + (o.dir || 1) * m[0] * sR, y - bob + m[1] * sR, m[2] * sR); }
};
Z.talkMouthMet = function () { };   // 2.11.5: рот Метелицы — внутри модели

// ---------- враги: подробнее ----------
var prevEnemy = D.enemy;
var DET = { leshy: 1, raz: 1, yaga: 1, kiki: 1, koschei: 1, gorynych: 1, solovey: 1, hare: 1, duck: 1 };
D.enemy = function (e, x, y, cs, t) {
  if (!DET[e.type]) return prevEnemy(e, x, y, cs, t);
  TK = !!(e.talk || (Z.talkKey() && Z.talkKey() === EKEY[e.type])); BL = !TK && blinkAt(x + (e.ph || 0));
  try { drawE(e, x, y, cs, t); } finally { TK = BL = false; }
};
function drawE(e, x, y, cs, t) {
  var ctx = c(), R = cs * 0.31 * e.size, l = Math.max(1.3, R * 0.1), d = e.dir || 1, T = e.type, fl = e.hitT > 0;
  var hop = e.air ? Math.sin(t * 2 + (e.ph || 0)) * R * 0.15 : Math.abs(Math.sin(e.walk || 0)) * R * 0.1;
  ctx.save(); ctx.translate(x, y);
  if (e.hideT > 0) ctx.globalAlpha = 0.35;
  D.ell(0, e.air ? R * 0.8 : 0, R * 0.9, R * 0.26, 'rgba(30,40,80,0.2)');
  // 2.7.21: выпад при ударе по вышке или герою — как у остальных врагов
  var lg = e.lunge > 0 ? Math.sin(Math.min(1, e.lunge / 0.2) * Math.PI) : 0;
  ctx.translate(d * R * 0.35 * lg - (e.kb > 0 ? d * R * 0.25 : 0), -hop - (e.air ? R * 1.3 : 0)); if (lg) ctx.rotate(d * 0.12 * lg);
  if (e.corpse !== undefined) { ctx.rotate(d * e.corpse * 1.5); ctx.globalAlpha = Math.max(0, 1 - e.corpse); }
  if (e.slow > 0) { var ga = ctx.globalAlpha; ctx.globalAlpha = ga * 0.45; D.circ(0, -R * 0.9, R * 1.1, '#bfefff'); ctx.globalAlpha = ga; }
  if (e.iced > 0) { ctx.globalAlpha = 0.55; D.rr(-R * 0.9, -R * 2, R * 1.8, R * 2, R * 0.3); ctx.fillStyle = '#bfefff'; ctx.fill(); ctx.globalAlpha = 1; }
  ctx.scale(d, 1);
  var W = fl ? '#ffffff' : null;
  if (T === 'leshy') {
    // ствол-тело с корой, мох-борода, рога-ветви с листьями и грибом
    stroke(OL, l * 2.6, function (q) { q.moveTo(-R * 0.3, -R * 0.1); q.lineTo(-R * 0.4, R * 0.02); q.moveTo(R * 0.3, -R * 0.1); q.lineTo(R * 0.42, R * 0.02); });
    stroke('#6b4a2f', l * 1.5, function (q) { q.moveTo(-R * 0.3, -R * 0.1); q.lineTo(-R * 0.4, R * 0.02); q.moveTo(R * 0.3, -R * 0.1); q.lineTo(R * 0.42, R * 0.02); });
    ctx.beginPath(); ctx.moveTo(-R * 0.5, -R * 0.1); ctx.quadraticCurveTo(-R * 0.62, -R * 1.1, -R * 0.35, -R * 1.75); ctx.lineTo(R * 0.35, -R * 1.75); ctx.quadraticCurveTo(R * 0.62, -R * 1.1, R * 0.5, -R * 0.1); ctx.closePath();
    ctx.fillStyle = W || G2(-R * 0.5, 0, R * 0.5, 0, '#9a7048', '#5a3d24'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    for (var i = 0; i < 4; i++) stroke('rgba(40,25,10,0.45)', l * 0.6, function (q) { q.moveTo(-R * 0.35 + i * R * 0.22, -R * 0.2); q.quadraticCurveTo(-R * 0.3 + i * R * 0.22, -R * 0.8, -R * 0.35 + i * R * 0.22, -R * 1.5); });
    // рот Лешего — это его моховая «челюсть»: когда говорит, мох опускается и открывается тёмное дупло
    var jaw = TK ? 0.25 + 0.75 * Math.abs(Math.sin(t * 17) * Math.sin(t * 5.3 + 1)) : 0;
    if (jaw > 0) { ctx.beginPath(); ctx.moveTo(-R * 0.42, -R * 1.06); ctx.quadraticCurveTo(0, -R * 1.12, R * 0.42, -R * 1.06); ctx.lineTo(R * 0.4, -R * (1.0 - jaw * 0.3)); ctx.quadraticCurveTo(0, -R * (0.92 - jaw * 0.32), -R * 0.4, -R * (1.0 - jaw * 0.3)); ctx.closePath(); ctx.fillStyle = '#2a1408'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke(); D.ell(0, -R * (0.97 - jaw * 0.3), R * 0.16, R * 0.04 + jaw * R * 0.04, '#c94a5a'); }
    ctx.save(); if (jaw > 0) { ctx.beginPath(); ctx.rect(-R * 2, -R * 3, R * 4, R * 2.88); ctx.clip(); } ctx.translate(0, jaw * R * 0.3);
    path([-R * 0.45, -R * 1.05, -R * 0.3, -R * 0.45, -R * 0.1, -R * 0.75, 0, -R * 0.3, R * 0.12, -R * 0.75, R * 0.3, -R * 0.45, R * 0.45, -R * 1.05], G2(0, -R * 1.05, 0, -R * 0.3, '#6fbf5a', '#2f7a3a'), l * 0.8);
    ctx.restore();
    D.ell(-R * 0.16, -R * 1.3, R * 0.11, R * 0.13, '#2a1a10', l * 0.5); D.ell(R * 0.16, -R * 1.3, R * 0.11, R * 0.13, '#2a1a10', l * 0.5);
    D.circ(-R * 0.15, -R * 1.3, R * 0.06, '#ffe066'); D.circ(R * 0.17, -R * 1.3, R * 0.06, '#ffe066'); D.circ(-R * 0.13, -R * 1.32, R * 0.02, '#fff'); D.circ(R * 0.19, -R * 1.32, R * 0.02, '#fff');
    // ветви-руки Лешего на «костях»: плечо → локоть → кисть с листьями; качаются, жестикулируют, показывают дорогу
    [-1, 1].forEach(function (sd) {
      var a1 = 0.54 + Math.sin(t * 1.6 + sd + (e.ph || 0)) * 0.06, a2 = 1.25 + Math.sin(t * 2.1 + sd * 2 + (e.ph || 0)) * 0.1;
      if (TK) { a1 += Math.sin(t * 5 + sd * 1.3) * 0.2 * (sd > 0 ? 1 : 0.6); a2 += Math.sin(t * 6.5 + sd) * 0.3; }
      if (e.point && sd > 0) { a1 = 0.95 + Math.sin(t * 4) * 0.04; a2 = 1.45; }
      var P = function (x0, y0, ang, len) { return [x0 + sd * Math.sin(ang) * len, y0 - Math.cos(ang) * len]; };
      var Sx = sd * R * 0.25, Sy = -R * 1.7, E = P(Sx, Sy, a1, R * 0.58), Hn = P(E[0], E[1], a2, R * 0.32), Tb = P(Sx, Sy, a1, R * 0.45), Te = P(Tb[0], Tb[1], a1 - 0.75, R * 0.33);
      var bone = function (q) { q.moveTo(Sx, Sy); q.lineTo(E[0], E[1]); q.lineTo(Hn[0], Hn[1]); q.moveTo(Tb[0], Tb[1]); q.lineTo(Te[0], Te[1]); };
      stroke(OL, l * 2.2, bone); stroke(W || '#7a5a3a', l * 1.1, bone);
      var ha = Math.atan2(Hn[1] - E[1], Hn[0] - E[0]); ctx.save(); ctx.translate(Hn[0] + Math.cos(ha) * R * 0.04, Hn[1] + Math.sin(ha) * R * 0.04); ctx.rotate(ha); D.ell(0, 0, R * 0.12, R * 0.07, W || '#4a9a4a', l * 0.5); ctx.restore();
      D.ell(Te[0], Te[1] - R * 0.04, R * 0.07, R * 0.11, W || '#5aaa5a', l * 0.5);
    });
    D.ell(R * 0.3, -R * 1.72, R * 0.14, R * 0.07, '#e8484f', l * 0.5); D.circ(R * 0.26, -R * 1.74, R * 0.02, '#fff'); D.circ(R * 0.34, -R * 1.73, R * 0.02, '#fff');
  } else if (T === 'raz') {
    stroke(OL, l * 2.4, function (q) { q.moveTo(-R * 0.18, -R * 0.4); q.lineTo(-R * 0.22, 0); q.moveTo(R * 0.18, -R * 0.4); q.lineTo(R * 0.22, 0); }); stroke('#3a3f5c', l * 1.4, function (q) { q.moveTo(-R * 0.18, -R * 0.4); q.lineTo(-R * 0.22, 0); q.moveTo(R * 0.18, -R * 0.4); q.lineTo(R * 0.22, 0); });
    D.ell(-R * 0.24, R * 0.02, R * 0.12, R * 0.06, '#3a2a1a', l * 0.5); D.ell(R * 0.26, R * 0.02, R * 0.12, R * 0.06, '#3a2a1a', l * 0.5);
    if (D.rig) D.rigArm('b', -R * 0.3, -R * 1.05, D.rig.b.a, D.rig.b.e, R * 0.26, R * 0.24, R * 0.16, '#a82a2a', l * 0.6, '#f1c9a0', R * 0.075, null);
    else if (!D.armOff) {   // 2.11.5: рука сзади — кулак в бок, размахивает на ходу
      var rsw = Math.sin((e.walk || 0) * 1.0 + t * 1.5) * 0.15;
      ctx.save(); ctx.translate(-R * 0.32, -R * 1.02); ctx.rotate(0.55 + rsw); stroke(OL, R * 0.17 + l * 1.6, function (q) { q.moveTo(0, 0); q.lineTo(0, R * 0.42); }); stroke('#a82a2a', R * 0.17, function (q) { q.moveTo(0, 0); q.lineTo(0, R * 0.42); }); D.circ(0, R * 0.47, R * 0.085, '#f1c9a0', l * 0.6); ctx.restore(); }
    D.ell(0, -R * 0.75, R * 0.42, R * 0.48, W || G2(-R * 0.4, 0, R * 0.4, 0, '#ef5a5a', '#a82a2a'), l);
    D.rr(-R * 0.42, -R * 0.55, R * 0.84, R * 0.1, R * 0.04); c().fillStyle = '#2a2a2a'; c().fill(); D.rr(-R * 0.06, -R * 0.57, R * 0.12, R * 0.14, R * 0.02); c().fillStyle = '#ffd54a'; c().fill();
    stroke('#ffe9d0', l * 0.5, function (q) { q.moveTo(-R * 0.1, -R * 1.18); q.lineTo(0, -R * 0.95); q.lineTo(R * 0.1, -R * 1.18); });
    // 2.11.5: детали рубахи — складки, заплатка, пуговицы, платок на шее
    if (!W) { stroke('rgba(120,20,20,0.55)', l * 0.6, function (q) { q.moveTo(-R * 0.26, -R * 1.0); q.quadraticCurveTo(-R * 0.3, -R * 0.8, -R * 0.24, -R * 0.62); q.moveTo(R * 0.22, -R * 0.98); q.quadraticCurveTo(R * 0.28, -R * 0.82, R * 0.2, -R * 0.64); });
      D.rr(-R * 0.3, -R * 0.86, R * 0.16, R * 0.14, R * 0.02); ctx.fillStyle = '#d9a35a'; ctx.fill(); ctx.lineWidth = l * 0.45; ctx.strokeStyle = OL; ctx.stroke();
      stroke('#6a3a1a', l * 0.35, function (q) { for (var ps = 0; ps < 3; ps++) { q.moveTo(-R * 0.3 + ps * R * 0.06, -R * 0.86); q.lineTo(-R * 0.29 + ps * R * 0.06, -R * 0.83); } });
      D.circ(0, -R * 0.82, R * 0.025, '#ffe9d0'); D.circ(0, -R * 0.7, R * 0.025, '#ffe9d0'); }
    path([-R * 0.26, -R * 1.14, R * 0.26, -R * 1.14, R * 0.1, -R * 1.02, R * 0.16, -R * 0.86, -R * 0.02, -R * 0.98, -R * 0.16, -R * 1.0], '#2a3a6a', l * 0.6);
    for (var kd = 0; kd < 4; kd++) D.circ(-R * 0.16 + kd * R * 0.1, -R * 1.1 + (kd % 2) * R * 0.03, R * 0.018, '#ffffff');
    D.circ(0, -R * 1.42, R * 0.33, RG(0, -R * 1.42, R * 0.33, '#ffd9b0', '#e0a47a'), l);
    c().fillStyle = 'rgba(70,50,40,0.35)'; for (var sb = 0; sb < 9; sb++) { c().beginPath(); c().arc(-R * 0.08 + (sb % 5) * R * 0.08, -R * 1.2 - Math.floor(sb / 5) * R * 0.05 + (sb % 2) * R * 0.015, R * 0.012, 0, 7); c().fill(); }
    c().globalAlpha = 0.35; D.ell(R * 0.05, -R * 1.25, R * 0.22, R * 0.12, '#5a4030'); c().globalAlpha = 1;
    path([-R * 0.33, -R * 1.5, -R * 0.25, -R * 1.78, R * 0.25, -R * 1.78, R * 0.34, -R * 1.5], G2(0, -R * 1.8, 0, -R * 1.5, '#3a4a8a', '#1e2a5a'), l);
    for (var p = 0; p < 4; p++) D.circ(-R * 0.2 + p * R * 0.13, -R * 1.62, R * 0.025, '#ffffff');
    path([-R * 0.34, -R * 1.55, -R * 0.6, -R * 1.45, -R * 0.55, -R * 1.62], '#1e2a5a', l * 0.6);
    eye(R * 0.0, -R * 1.42, R * 0.06, 1); eye(R * 0.17, -R * 1.42, R * 0.055, 1);
    stroke(OL, l * 0.9, function (q) { q.moveTo(-R * 0.08, -R * 1.52); q.lineTo(R * 0.06, -R * 1.5); q.moveTo(R * 0.12, -R * 1.5); q.lineTo(R * 0.25, -R * 1.54); });
    ctx.beginPath(); ctx.moveTo(-R * 0.12, -R * 1.3); ctx.quadraticCurveTo(R * 0.1, -R * 1.38, R * 0.32, -R * 1.28); ctx.quadraticCurveTo(R * 0.1, -R * 1.22, -R * 0.12, -R * 1.3); c().fillStyle = '#4a3020'; c().fill();
    if (TK) mouth(R * 0.1, -R * 1.24, R * 0.16);
    else { stroke(OL, l * 0.7, function (q) { q.moveTo(-R * 0.02, -R * 1.2); q.quadraticCurveTo(R * 0.1, -R * 1.15, R * 0.22, -R * 1.21); }); D.rr(R * 0.07, -R * 1.2, R * 0.05, R * 0.04, R * 0.01); ctx.fillStyle = '#ffffff'; ctx.fill(); }   // 2.11.5: молчит — ухмылка с зубом, а не пустое лицо
    D.circ(R * 0.1, -R * 1.36, R * 0.06, '#f0a07a', l * 0.5);
    // бочка
    if (!D.noBarrel) { ctx.save(); ctx.translate(R * 0.52, -R * 0.82);
    ctx.beginPath(); ctx.ellipse(0, 0, R * 0.3, R * 0.38, 0, 0, 7); ctx.fillStyle = G2(-R * 0.3, 0, R * 0.3, 0, '#c08a50', '#7a4a20'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, R * 0.3 - l * 0.4, R * 0.38 - l * 0.4, 0, 0, 7); ctx.clip();   // 2.11.5: обручи — дугой по бочке и не выходят за край
    stroke('#3d3d4d', l * 0.9, function (q) { q.moveTo(-R * 0.31, -R * 0.19); q.quadraticCurveTo(0, -R * 0.12, R * 0.31, -R * 0.19); q.moveTo(-R * 0.31, R * 0.13); q.quadraticCurveTo(0, R * 0.2, R * 0.31, R * 0.13); });
    stroke('rgba(60,30,10,0.35)', l * 0.5, function (q) { q.moveTo(-R * 0.12, -R * 0.38); q.quadraticCurveTo(-R * 0.16, 0, -R * 0.12, R * 0.38); q.moveTo(R * 0.12, -R * 0.38); q.quadraticCurveTo(R * 0.16, 0, R * 0.12, R * 0.38); });
    ctx.restore();
    D.text('☠', 0, R * 0.01, R * 0.2, '#fff');
    stroke('#3d3d3d', l * 0.6, function (q) { q.moveTo(0, -R * 0.37); q.quadraticCurveTo(R * 0.1, -R * 0.55, R * 0.05, -R * 0.68); });
    var sp = 0.5 + 0.5 * Math.sin(t * 30); D.star(R * 0.05, -R * 0.7, R * (0.08 + sp * 0.05), '#ffd54a'); D.circ(R * 0.05, -R * 0.7, R * 0.03, '#ffffff');
    ctx.restore(); }
    if (D.rig) D.rigArm('f', R * 0.3, -R * 1.05, D.rig.f.a, D.rig.f.e, R * 0.26, R * 0.24, R * 0.16, '#c83a3a', l * 0.6, '#f1c9a0', R * 0.075, null);
    else if (!D.armOff) {   // 2.11.5: передняя рука обнимает бочку (без бочки — грозит кулаком)
      var hx2 = D.noBarrel ? R * 0.5 : R * 0.42, hy2 = D.noBarrel ? -R * 1.25 + Math.sin(t * 6) * R * 0.05 : -R * 0.72;
      stroke(OL, R * 0.17 + l * 1.6, function (q) { q.moveTo(R * 0.28, -R * 1.02); q.quadraticCurveTo(R * 0.5, -R * 0.95, hx2, hy2); }); stroke('#c83a3a', R * 0.17, function (q) { q.moveTo(R * 0.28, -R * 1.02); q.quadraticCurveTo(R * 0.5, -R * 0.95, hx2, hy2); });
      D.circ(hx2, hy2, R * 0.09, '#f1c9a0', l * 0.6); }
  } else if (T === 'yaga') {
    // помело в руке: угол и подъём руки — из анимации удара
    var YB = Z.yagaBroom ? Z.yagaBroom(e) : { a: 0, lift: 0, blur: 0 }, yhx = R * (0.42 + 0.06 * YB.lift), yhy = -R * (0.38 + 0.42 * YB.lift), yth = 2.618 + YB.a;
    var broom = function (th, alpha, onlyB) {
      ctx.save(); ctx.translate(yhx, yhy); ctx.rotate(th); if (alpha < 1) ctx.globalAlpha *= alpha;
      if (!onlyB) { stroke(OL, l * 2, function (q) { q.moveTo(-R * 0.3, 0); q.lineTo(R * 1.12, 0); }); stroke('#9a6a3a', l, function (q) { q.moveTo(-R * 0.3, 0); q.lineTo(R * 1.12, 0); }); }
      path([R * 1.02, -R * 0.08, R * 1.55, -R * 0.26, R * 1.66, 0, R * 1.55, R * 0.26, R * 1.02, R * 0.08], G2(R * 1.0, 0, R * 1.6, 0, '#e8c870', '#b8903a'), l * 0.7);
      if (!onlyB) { stroke('rgba(120,80,30,0.7)', l * 0.5, function (q) { q.moveTo(R * 1.2, -R * 0.1); q.lineTo(R * 1.55, -R * 0.18); q.moveTo(R * 1.2, R * 0.1); q.lineTo(R * 1.55, R * 0.18); }); stroke('#8a2a3a', l * 1.4, function (q) { q.moveTo(R * 1.06, -R * 0.1); q.lineTo(R * 1.06, R * 0.1); }); }
      ctx.restore();
    };
    var yLay = YB.a < 0.01 ? 'mid' : YB.a > 2.4 && YB.a < 5.0 ? 'front' : 'back';
    if (yLay === 'back') broom(yth, 1);
    // ступа с древесной текстурой
    path([-R * 0.58, -R * 0.25, -R * 0.42, R * 0.5, R * 0.42, R * 0.5, R * 0.58, -R * 0.25], W || G2(-R * 0.6, 0, R * 0.6, 0, '#b08a60', '#6a4a2a'), l);
    for (var w = 0; w < 3; w++) stroke('rgba(60,35,15,0.5)', l * 0.5, function (q) { q.moveTo(-R * 0.4 + w * R * 0.4, -R * 0.15); q.lineTo(-R * 0.32 + w * R * 0.32, R * 0.45); });
    D.ell(0, -R * 0.25, R * 0.58, R * 0.14, '#8a6a40', l);
    if (yLay === 'mid') broom(yth, 1);
    // бабка: волосы, платок, нос, бородавка
    D.ell(0, -R * 0.45, R * 0.36, R * 0.3, '#4a2a5a', l);
    stroke('#d8d8e8', l * 1.3, function (q) { q.moveTo(-R * 0.25, -R * 0.9); q.quadraticCurveTo(-R * 0.45, -R * 0.7, -R * 0.38, -R * 0.45); });
    D.circ(R * 0.02, -R * 0.88, R * 0.27, RG(0, -R * 0.88, R * 0.27, '#f5e0c8', '#d8b090'), l);
    path([R * 0.12, -R * 0.9, R * 0.5, -R * 0.78, R * 0.14, -R * 0.74], '#e8c0a0', l * 0.7); D.circ(R * 0.38, -R * 0.8, R * 0.03, '#8a6a4a');
    stroke(OL, l * 0.6, function (q) { q.moveTo(-R * 0.02, -R * 0.74); q.quadraticCurveTo(R * 0.06, -R * 0.68, R * 0.12, -R * 0.74); });
    if (TK) mouth(R * 0.05, -R * 0.72, R * 0.12);
    ctx.beginPath(); ctx.moveTo(-R * 0.3, -R * 0.86); ctx.quadraticCurveTo(-R * 0.3, -R * 1.25, R * 0.05, -R * 1.2); ctx.quadraticCurveTo(R * 0.32, -R * 1.15, R * 0.3, -R * 0.96); ctx.quadraticCurveTo(R * 0.05, -R * 1.1, -R * 0.3, -R * 0.86); ctx.closePath();
    ctx.fillStyle = G2(0, -R * 1.2, 0, -R * 0.85, '#e8484f', '#9a2a3a'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    for (var dt2 = 0; dt2 < 4; dt2++) D.circ(-R * 0.15 + dt2 * R * 0.12, -R * 1.08 + (dt2 % 2) * R * 0.05, R * 0.025, '#ffd54a');
    path([-R * 0.3, -R * 0.84, -R * 0.45, -R * 0.65, -R * 0.22, -R * 0.72], '#9a2a3a', l * 0.6);
    eye(R * 0.0, -R * 0.9, R * 0.055, 1); eye(R * 0.15, -R * 0.91, R * 0.05, 1);
    if (yLay === 'front') { if (YB.blur) for (var yb = 1; yb <= 3; yb++) broom(yth - yb * 0.32, 0.22 / yb, true); broom(yth, 1); }
    // рука в рукаве держит помело
    stroke(OL, R * 0.17 + l * 2, function (q) { q.moveTo(R * 0.16, -R * 0.6); q.quadraticCurveTo(R * 0.4, -R * (0.5 + 0.2 * YB.lift), yhx, yhy); });
    stroke('#4a2a5a', R * 0.17, function (q) { q.moveTo(R * 0.16, -R * 0.6); q.quadraticCurveTo(R * 0.4, -R * (0.5 + 0.2 * YB.lift), yhx, yhy); });
    D.circ(yhx, yhy, R * 0.085, '#e8c0a0', l * 0.8);
  } else if (T === 'kiki') {
    // 2.11.5: Кикимора болотная — сгорбленная, волосы-тина, шляпа-кувшинка, нос с бородавкой, платье из мха с рваным подолом,
    // тонкие руки с длинными пальцами, рогоз-посох, лягушка на поясе, пузыри и мошкара
    var kb = Math.sin(t * 2.2) * 0.04;
    for (var bb = 0; bb < 3; bb++) { var bp = (t * 0.5 + bb * 0.33) % 1; ctx.globalAlpha = 0.6 * (1 - bp); D.circ(-R * 0.55 + bb * R * 0.5, -R * (0.1 + bp * 0.7), R * (0.04 + bp * 0.04), null, l * 0.4); ctx.strokeStyle = '#7ac08a'; ctx.stroke(); }
    ctx.globalAlpha = 1;
    // рогоз-посох сзади
    stroke(OL, l * 2.2, function (q) { q.moveTo(-R * 0.62, R * 0.02); q.lineTo(-R * 0.5, -R * 1.9); }); stroke('#7a8a3a', l * 1.1, function (q) { q.moveTo(-R * 0.62, R * 0.02); q.lineTo(-R * 0.5, -R * 1.9); });
    D.ell(-R * 0.49, -R * 1.98, R * 0.08, R * 0.2, '#6a3a1e', l * 0.6); stroke('#7a8a3a', l * 0.8, function (q) { q.moveTo(-R * 0.48, -R * 2.18); q.lineTo(-R * 0.47, -R * 2.32); });
    // лягушачьи ступни
    D.ell(-R * 0.18, R * 0.0, R * 0.14, R * 0.06, '#6aa86a', l * 0.6); D.ell(R * 0.2, R * 0.0, R * 0.14, R * 0.06, '#6aa86a', l * 0.6);
    ctx.save(); ctx.rotate(kb);
    // платье из мха с рваным подолом
    ctx.beginPath(); ctx.moveTo(-R * 0.22, -R * 1.05); ctx.quadraticCurveTo(-R * 0.55, -R * 0.6, -R * 0.5, -R * 0.08);
    for (var hm = 0; hm <= 8; hm++) ctx.lineTo(-R * 0.5 + hm * R * 0.125, -R * 0.08 + (hm % 2 ? -R * 0.1 : R * 0.04) + Math.sin(t * 3 + hm) * R * 0.015);
    ctx.quadraticCurveTo(R * 0.55, -R * 0.6, R * 0.22, -R * 1.05); ctx.closePath();
    ctx.fillStyle = W || G2(-R * 0.5, 0, R * 0.5, 0, '#6aa060', '#2f5a34'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    for (var k = 0; k < 5; k++) D.ell(-R * 0.28 + k * R * 0.14, -R * (0.3 + (k % 2) * 0.28), R * 0.07, R * 0.045, '#3f7a40');
    stroke('rgba(160,220,140,0.6)', l * 0.5, function (q) { q.moveTo(-R * 0.2, -R * 0.95); q.quadraticCurveTo(-R * 0.3, -R * 0.5, -R * 0.25, -R * 0.15); q.moveTo(R * 0.15, -R * 0.95); q.quadraticCurveTo(R * 0.25, -R * 0.5, R * 0.22, -R * 0.15); });
    // пояс-верёвка с лягушкой
    stroke('#a88a50', l * 1.2, function (q) { q.moveTo(-R * 0.4, -R * 0.62); q.quadraticCurveTo(0, -R * 0.55, R * 0.4, -R * 0.62); });
    D.ell(R * 0.22, -R * 0.5, R * 0.1, R * 0.08, '#7ad06a', l * 0.5); D.circ(R * 0.17, -R * 0.57, R * 0.035, '#fff', l * 0.3); D.circ(R * 0.27, -R * 0.57, R * 0.035, '#fff', l * 0.3); D.circ(R * 0.17, -R * 0.57, R * 0.015, OL); D.circ(R * 0.27, -R * 0.57, R * 0.015, OL);
    // руки: тонкие, длинные пальцы; задняя держит рогоз, передняя манит
    var arm = function (x0, y0, x1, y1, cx, cy) { stroke(OL, R * 0.1 + l * 1.4, function (q) { q.moveTo(x0, y0); q.quadraticCurveTo(cx, cy, x1, y1); }); stroke('#8ac08a', R * 0.1, function (q) { q.moveTo(x0, y0); q.quadraticCurveTo(cx, cy, x1, y1); }); };
    arm(-R * 0.2, -R * 0.98, -R * 0.53, -R * 0.95, -R * 0.45, -R * 0.75); D.circ(-R * 0.53, -R * 0.95, R * 0.07, '#8ac08a', l * 0.5);
    var bk = Math.sin(t * 4) * 0.3;
    arm(R * 0.2, -R * 0.98, R * 0.55, -R * 0.75, R * 0.5, -R * 1.05); D.circ(R * 0.55, -R * 0.75, R * 0.065, '#8ac08a', l * 0.5);
    for (var fg = 0; fg < 3; fg++) stroke(OL, l * 0.9, function (q) { var a0 = -0.6 + fg * 0.45 + bk * (fg === 1 ? 1 : 0.4); q.moveTo(R * 0.58, -R * 0.75); q.lineTo(R * 0.58 + Math.cos(a0) * R * 0.16, -R * 0.75 + Math.sin(a0) * R * 0.16); });
    // волосы-тина за головой
    for (var r2 = 0; r2 < 7; r2++) { var rx = -R * 0.34 + r2 * R * 0.11, sw = Math.sin(t * 2 + r2) * R * 0.05; stroke(OL, l * 1.9, function (q) { q.moveTo(rx, -R * 1.42); q.quadraticCurveTo(rx - R * 0.15 + sw, -R * 1.1, rx - R * 0.1 + sw * 1.5, -R * (0.75 + (r2 % 3) * 0.1)); }); stroke(r2 % 2 ? '#4a8a3a' : '#5a9a48', l * 1, function (q) { q.moveTo(rx, -R * 1.42); q.quadraticCurveTo(rx - R * 0.15 + sw, -R * 1.1, rx - R * 0.1 + sw * 1.5, -R * (0.75 + (r2 % 3) * 0.1)); }); }
    // голова
    D.ell(0, -R * 1.22, R * 0.34, R * 0.3, RG(0, -R * 1.22, R * 0.36, '#b4e6a8', '#5aa06a'), l);
    // нос крючком с бородавкой
    path([R * 0.12, -R * 1.24, R * 0.48, -R * 1.12, R * 0.42, -R * 1.06, R * 0.14, -R * 1.12], '#8ccf86', l * 0.7); D.circ(R * 0.36, -R * 1.15, R * 0.03, '#5a8a3a');
    // глаза разного размера
    eye(-R * 0.1, -R * 1.27, R * 0.1, 1); eye(R * 0.15, -R * 1.29, R * 0.075, 1);
    stroke(OL, l * 0.8, function (q) { q.moveTo(-R * 0.22, -R * 1.4); q.lineTo(-R * 0.02, -R * 1.38); q.moveTo(R * 0.08, -R * 1.39); q.lineTo(R * 0.24, -R * 1.42); });
    if (TK) mouth(R * 0.07, -R * 1.04, R * 0.15);
    else { ctx.beginPath(); ctx.moveTo(-R * 0.1, -R * 1.06); ctx.quadraticCurveTo(R * 0.06, -R * 0.96, R * 0.22, -R * 1.06); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke(); D.rr(R * 0.02, -R * 1.04, R * 0.05, R * 0.05, R * 0.01); ctx.fillStyle = '#fffbe8'; ctx.fill(); }
    // чёлка из тины и шляпа-кувшинка с цветком
    for (var fr = 0; fr < 5; fr++) stroke('#3f7a30', l * 1.1, function (q) { q.moveTo(-R * 0.26 + fr * R * 0.12, -R * 1.46); q.quadraticCurveTo(-R * 0.25 + fr * R * 0.12, -R * 1.38, -R * 0.28 + fr * R * 0.12, -R * 1.33); });
    ctx.beginPath(); ctx.ellipse(-R * 0.02, -R * 1.5, R * 0.42, R * 0.12, -0.12, 0.15, Math.PI * 2 - 0.15); ctx.lineTo(-R * 0.02, -R * 1.5); ctx.closePath(); ctx.fillStyle = '#4aa04a'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
    stroke('rgba(255,255,255,0.35)', l * 0.4, function (q) { q.moveTo(-R * 0.02, -R * 1.5); q.lineTo(-R * 0.3, -R * 1.55); q.moveTo(-R * 0.02, -R * 1.5); q.lineTo(-R * 0.15, -R * 1.42); });
    for (var pt = 0; pt < 6; pt++) { var pa = pt / 6 * Math.PI * 2 + 0.3; D.ell(-R * 0.12 + Math.cos(pa) * R * 0.08, -R * 1.62 + Math.sin(pa) * R * 0.04, R * 0.07, R * 0.035, '#ffc0e0', l * 0.4); }
    D.circ(-R * 0.12, -R * 1.62, R * 0.04, '#ffd54a', l * 0.3);
    ctx.restore();
    // мошкара
    for (var mq = 0; mq < 3; mq++) { var ma = t * (3 + mq) + mq * 2; D.circ(Math.cos(ma) * R * 0.5, -R * 1.6 + Math.sin(ma * 1.3) * R * 0.2, R * 0.025, OL); }
  } else if (T === 'koschei') {
    var imm = !(Z.G && ((Z.G.kos && Z.G.kos.stage >= 4) || e.mortal));
    if (imm) { ctx.globalAlpha = 0.22 + 0.1 * Math.sin(t * 4); D.circ(0, -R * 1.0, R * 1.1, '#9a7cff'); ctx.globalAlpha = 1; }
    // плащ с алым подбоем
    path([-R * 0.7, 0, -R * 0.27, -R * 1.45, R * 0.27, -R * 1.45, R * 0.7, 0], W || '#e8323f', l);
    path([-R * 0.45, 0, -R * 0.2, -R * 1.42, R * 0.2, -R * 1.42, R * 0.45, 0], W || G2(-R * 0.45, 0, R * 0.45, 0, '#3a3058', '#15102a'), l);
    for (var j2 = 0; j2 < 4; j2++) D.circ(0, -R * (0.3 + j2 * 0.28), R * 0.065, '#ffd54a', l * 0.3);
    D.ell(0, -R * 1.42, R * 0.32, R * 0.1, '#2a2340', l * 0.8);
    var RIGv = D.rig, orbX = R * 0.66, orbY = -R * 0.62, spP = { x: -R * 0.6, y: -R * 0.62 };
    if (RIGv) { var hb = D.rigArm('b', -R * 0.22, -R * 1.25, RIGv.b.a, RIGv.b.e, R * 0.38, R * 0.36, l * 1.3, '#2a2340', l * 0.55, '#f0e8d8', R * 0.125, null, null), hf = D.rigArm('f', R * 0.22, -R * 1.25, RIGv.f.a, RIGv.f.e, R * 0.38, R * 0.36, l * 1.3, '#2a2340', l * 0.55, '#f0e8d8', R * 0.125, null, null); var oh = RIGv.f.busy ? hb : hf; orbX = oh.x; orbY = oh.y; spP = RIGv.f.busy ? null : hb; }
    else [[-1, -0.3], [1, 0.25]].forEach(function (s) { if (s[0] > 0 && D.armOff) return; stroke(OL, l * 2.4, function (q) { q.moveTo(s[0] * R * 0.22, -R * 1.25); q.lineTo(s[0] * R * 0.6, -R * 0.62); }); stroke('#2a2340', l * 1.3, function (q) { q.moveTo(s[0] * R * 0.22, -R * 1.25); q.lineTo(s[0] * R * 0.6, -R * 0.62); }); stroke('#e8e0d0', l * 0.5, function (q) { for (var f = -1; f <= 1; f++) { q.moveTo(s[0] * R * 0.6, -R * 0.6); q.lineTo(s[0] * R * (0.64 + f * 0.04), -R * 0.48); } }); });
    // 2.7.14: скипетр в другой руке и костлявые пальцы — силуэт держится не только на голове
    if (spP) { var sx = spP.x, sy = spP.y, top = sy - R * 0.8, bot = sy + R * 0.38;
      stroke(OL, l * 2.8, function (q) { q.moveTo(sx, bot); q.lineTo(sx, top); }); stroke(W || '#c9952a', l * 1.5, function (q) { q.moveTo(sx, bot); q.lineTo(sx, top); });
      D.circ(sx, bot, R * 0.06, W || '#ffd54a', l * 0.5);
      ctx.globalAlpha = 0.4 * (0.6 + 0.4 * Math.sin(t * 4 + 1)); D.circ(sx, top - R * 0.3, R * 0.3, '#7fffd0'); ctx.globalAlpha = 1;
      D.circ(sx, top - R * 0.02, R * 0.12, W || G2(sx - R * 0.1, 0, sx + R * 0.1, 0, '#ffe680', '#c99a20'), l * 0.7);
      path([sx, top - R * 0.58, sx + R * 0.15, top - R * 0.3, sx, top - R * 0.1, sx - R * 0.15, top - R * 0.3], W || '#8ff5cf', l * 0.8);
      path([sx, top - R * 0.52, sx + R * 0.07, top - R * 0.3, sx, top - R * 0.22], 'rgba(255,255,255,0.85)');
      D.circ(sx, sy, R * 0.12, W || '#f0e8d8', l * 0.55);
      stroke(OL, l * 0.45, function (q) { for (var f = -1; f <= 1; f++) { q.moveTo(sx - R * 0.1, sy + f * R * 0.05); q.lineTo(sx + R * 0.1, sy + f * R * 0.05); } }); }
    if (!D.armOff || RIGv) { var fx2 = orbX, fy2 = orbY + R * 0.1; stroke(W || '#f0e8d8', l * 0.55, function (q) { for (var f = -1; f <= 1; f++) { q.moveTo(fx2 + f * R * 0.06, fy2 - R * 0.02); q.lineTo(fx2 + f * R * 0.09, fy2 - R * 0.13); } }); }
    // светящийся шар бессмертия в костлявой руке
    var og = 0.6 + 0.4 * Math.sin(t * 4); if (!D.armOff || RIGv) { ctx.globalAlpha = 0.35 * og; D.circ(orbX, orbY, R * 0.24, '#7fffd0'); ctx.globalAlpha = 1;
    D.circ(orbX, orbY, R * 0.12, RG(orbX, orbY, R * 0.12, '#e8fff6', '#3fd8a0'), l * 0.6); }
    // 2.7.13: голова обведена по контурам обложки (kos_trace), выпрямлена и симметрична; глазницы срезаны «злыми бровями», рот — ухмылка
    var KF = Z.KOS_FACE, Rh = R * 0.38, cy = -R * 1.94, lw = l / Rh, jw = TK ? (0.3 + 0.7 * Math.abs(Math.sin(t * 13))) * 0.35 : 0;
    // воротник за головой
    [-1, 1].forEach(function (s) {
      path([s * R * 0.08, -R * 1.4, s * R * 0.48, -R * 1.66, s * R * 0.44, -R * 1.36], '#1d1630', l);
      path([s * R * 0.15, -R * 1.43, s * R * 0.42, -R * 1.6, s * R * 0.4, -R * 1.41], W || '#e8323f');
    });
    ctx.save(); ctx.translate(0, cy); ctx.scale(Rh, Rh); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    function poly(p, sx, ox, oy, sy) { sy = sy || 1; var n = p.length / 2; ctx.beginPath();
      var px = function (i) { i = (i + n) % n; return ox + p[i * 2] * sx; }, py = function (i) { i = (i + n) % n; return oy + p[i * 2 + 1] * sy; };
      ctx.moveTo((px(0) + px(1)) / 2, (py(0) + py(1)) / 2);
      for (var i = 1; i <= n; i++) ctx.quadraticCurveTo(px(i), py(i), (px(i) + px(i + 1)) / 2, (py(i) + py(i + 1)) / 2);
      ctx.closePath(); }
    function skull() { var P = KF.prof, m = P.length / 2, q = [], i; for (i = 0; i < m; i++) q.push(P[i * 2], P[i * 2 + 1]); for (i = m - 1; i >= 0; i--) q.push(-P[i * 2], P[i * 2 + 1]); poly(q, 1, 0, 0); }
    skull(); ctx.lineWidth = lw * 1.7; ctx.strokeStyle = OL; ctx.stroke();
    var gS = ctx.createRadialGradient(-0.35, -0.45, 0.05, -0.1, 0, 1.5); gS.addColorStop(0, '#fffaf0'); gS.addColorStop(1, '#ddd0b4');
    ctx.fillStyle = W || gS; ctx.fill();
    if (!W) { ctx.save(); skull(); ctx.clip();
      ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.ellipse(0.1, -0.66, 0.5, 0.13, -0.12, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.globalAlpha = 1;
      ctx.restore(); }
    // глазницы с бровями-срезами к переносице и светящиеся глаза
    var SK = W ? '#d8d8d8' : '#3a2140', gl = 0.6 + 0.4 * Math.sin(t * 5);
    [-1, 1].forEach(function (s) {
      ctx.save(); ctx.translate(s * 0.41, 0.12); ctx.scale(-s * 1.13, 1.13);   // локально: внутренний край справа
      ctx.beginPath(); ctx.moveTo(-0.6, -0.62); ctx.lineTo(0.5, -0.2); ctx.lineTo(0.5, 0.7); ctx.lineTo(-0.6, 0.7); ctx.closePath(); ctx.save(); ctx.clip();
      poly(KF.sock, -1, 0, 0); ctx.fillStyle = BL ? '#eadcbc' : SK; ctx.fill();
      if (!BL && !W) { var e = KF.eye, ex = -e[0], ey = e[1] + 0.03;
        ctx.globalAlpha = 0.35 * gl; ctx.beginPath(); ctx.arc(ex, ey, e[2] * 1.7, 0, Math.PI * 2); ctx.fillStyle = '#7fffd0'; ctx.fill(); ctx.globalAlpha = 1;
        var gE = ctx.createRadialGradient(ex - e[2] * 0.3, ey - e[2] * 0.3, 0, ex, ey, e[2]); gE.addColorStop(0, '#effff9'); gE.addColorStop(0.5, '#8ff5cf'); gE.addColorStop(1, '#3fd2a0');
        ctx.beginPath(); ctx.arc(ex, ey, e[2], 0, Math.PI * 2); ctx.fillStyle = gE; ctx.fill(); }
      ctx.restore();
      // тень надбровья по срезу
      ctx.restore();
    });
    // нос
    poly(KF.nose, 1, 0, 0); ctx.fillStyle = SK; ctx.fill();
    // рот: дуга с обложки перевёрнута в ухмылку, при речи раскрывается вниз
    var my = KF.mouthC - 0.02, ms = 1 + jw;
    poly(KF.mouth, 1.05, 0, my, -ms); ctx.fillStyle = SK; ctx.fill();
    // стежки: 4 сверху, 3 снизу, по фактическим краям рта
    function edge(x, top) { var p = KF.mouth, n = p.length / 2, best = null; for (var i = 0; i < n; i++) { var x1 = p[i * 2] * 1.05, y1 = -p[i * 2 + 1] * ms, x2 = p[((i + 1) % n) * 2] * 1.05, y2 = -p[((i + 1) % n) * 2 + 1] * ms; if ((x1 - x) * (x2 - x) <= 0 && x1 !== x2) { var yy = y1 + (y2 - y1) * (x - x1) / (x2 - x1); if (best === null || (top ? yy < best : yy > best)) best = yy; } } return best; }
    ctx.beginPath(); [-0.21, -0.07, 0.07, 0.21].forEach(function (x) { var y = edge(x, true); if (y !== null) { ctx.moveTo(x, my + y - 0.02); ctx.lineTo(x, my + y + 0.08); } });
    [-0.14, 0, 0.14].forEach(function (x) { var y = edge(x, false); if (y !== null) { ctx.moveTo(x, my + y - 0.08); ctx.lineTo(x, my + y + 0.02); } });
    ctx.lineWidth = lw * 0.55; ctx.strokeStyle = W || '#f3e7cb'; ctx.stroke();
    // корона — контур с обложки, уменьшена и выровнена
    ctx.save(); ctx.translate(-0.18, -1.12); ctx.rotate(0.38); ctx.scale(0.66, 0.66); ctx.translate(0.704, 1.145);
    poly(KF.crown, 1, 0, 0); ctx.lineWidth = lw * 1.5; ctx.strokeStyle = OL; ctx.stroke();
    var gC = ctx.createLinearGradient(0, -1.6, 0, -0.5); gC.addColorStop(0, '#ffe58a'); gC.addColorStop(1, '#d4a12c'); ctx.fillStyle = W || gC; ctx.fill();
    lw /= 0.66;
    [['gemR', '#e2456e'], ['gemG', '#43c86e'], ['gemB', '#4a7ef0']].forEach(function (g) { var q = KF[g[0]], r = q[2] * 1.15; ctx.beginPath();
      for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3 + 0.5; ctx[k ? 'lineTo' : 'moveTo'](q[0] + Math.cos(a) * r, q[1] + Math.sin(a) * r); } ctx.closePath();
      ctx.fillStyle = W || g[1]; ctx.fill(); ctx.lineWidth = lw * 0.4; ctx.strokeStyle = '#8a5a14'; ctx.stroke();
      if (!W) { ctx.beginPath(); ctx.arc(q[0] - r * 0.3, q[1] - r * 0.3, r * 0.25, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill(); } });
    ctx.restore(); ctx.restore();
  } else if (T === 'solovey') {
    // дуб у дороги, Соловей на суку
    if (!e.noTree) {
    // 2.11.5: могучий дуб — корни, кора с дуплом, сук с веточкой, листва в два слоя со снежными шапками
    var trunk = function (q) { q.moveTo(-R * 0.55, 0); q.quadraticCurveTo(-R * 0.3, -R * 0.15, -R * 0.3, -R * 0.6); q.lineTo(-R * 0.26, -R * 2.6); q.lineTo(R * 0.26, -R * 2.6); q.lineTo(R * 0.3, -R * 0.6); q.quadraticCurveTo(R * 0.3, -R * 0.15, R * 0.6, 0); q.quadraticCurveTo(R * 0.2, -R * 0.05, R * 0.05, R * 0.02); q.quadraticCurveTo(-R * 0.2, -R * 0.05, -R * 0.55, 0); };
    ctx.beginPath(); trunk(ctx); ctx.closePath(); ctx.fillStyle = G2(-R * 0.3, 0, R * 0.3, 0, '#9a6c46', '#4a3020'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke();
    stroke('rgba(40,25,10,0.5)', l * 0.6, function (q) { q.moveTo(-R * 0.12, -R * 0.25); q.quadraticCurveTo(-R * 0.18, -R * 0.9, -R * 0.12, -R * 1.5); q.moveTo(R * 0.12, -R * 0.45); q.quadraticCurveTo(R * 0.06, -R * 1.2, R * 0.14, -R * 2.1); q.moveTo(-R * 0.05, -R * 1.9); q.lineTo(-R * 0.1, -R * 2.5); });
    D.ell(-R * 0.04, -R * 1.05, R * 0.1, R * 0.15, '#2a1a10', l * 0.6); D.ell(-R * 0.04, -R * 1.0, R * 0.06, R * 0.08, '#120a06');   // дупло
    stroke(OL, l * 3.2, function (q) { q.moveTo(R * 0.1, -R * 1.55); q.quadraticCurveTo(R * 0.6, -R * 1.62, R * 1.15, -R * 1.85); q.moveTo(R * 0.85, -R * 1.76); q.lineTo(R * 1.05, -R * 2.1); }); stroke('#6b4a2f', l * 2, function (q) { q.moveTo(R * 0.1, -R * 1.55); q.quadraticCurveTo(R * 0.6, -R * 1.62, R * 1.15, -R * 1.85); q.moveTo(R * 0.85, -R * 1.76); q.lineTo(R * 1.05, -R * 2.1); });
    D.ell(R * 1.08, -R * 2.16, R * 0.1, R * 0.06, '#3a9a60', l * 0.5);
    var CL = [[-0.75, -2.55, 0.48], [0.5, -2.7, 0.55], [-0.35, -3.05, 0.7], [0.25, -3.35, 0.55], [-0.95, -2.95, 0.42], [0.85, -3.05, 0.42]];
    CL.forEach(function (q) { D.circ(R * q[0], R * q[1], R * q[2], '#1f5a38', l); });
    CL.forEach(function (q) { D.circ(R * q[0] + R * 0.05, R * q[1] - R * 0.05, R * q[2] * 0.82, RG(R * q[0], R * q[1], R * q[2], '#5cc07a', '#2f8552')); });
    CL.forEach(function (q, i) { ctx.beginPath(); ctx.arc(R * q[0], R * q[1], R * q[2] * 0.97, Math.PI * 1.15, Math.PI * 1.85); ctx.lineWidth = R * q[2] * 0.22; ctx.strokeStyle = '#f4f8ff'; ctx.stroke(); });   // снег на кроне
    for (var lf = 0; lf < 7; lf++) { var ax = -R * 0.8 + lf * R * 0.28, ay = -R * (2.55 + (lf % 3) * 0.3); D.circ(ax, ay, R * 0.06, '#c97a3a', l * 0.4); D.ell(ax, ay - R * 0.06, R * 0.065, R * 0.035, '#7a4a28'); }   // жёлуди
    }
    ctx.save(); if (e.noTree) ctx.translate(0, -R * 0.36); else ctx.translate(R * 0.75, -R * 1.92);
    // 2.11.5: Соловей-разбойник — атаман: кафтан с меховым воротником и вышивкой, кушак с кистями, сапоги, шапка с пером,
    // нос картошкой, кустистые брови, закрученные усы; рот — часть лица (ухмылка / говорит / свистит трубочкой)
    var wh = e.whistle > 0, sw = Math.sin(t * 2.6) * 0.12;
    // ноги: на ветке дуба болтаются, на земле (в мультфильмах) стоят ровно и шагают при ходьбе
    [[-1, 0], [1, 1.4]].forEach(function (q) { var a0 = e.noTree ? q[0] * 0.03 + (e.walk ? Math.sin(e.walk) * 0.3 * q[0] : 0) : q[0] * 0.08 + Math.sin(t * 2.6 + q[1]) * 0.18; ctx.save(); ctx.translate(q[0] * R * 0.15, -R * 0.1); ctx.rotate(a0);
      stroke(OL, R * 0.15 + l * 1.4, function (k) { k.moveTo(0, 0); k.lineTo(0, R * 0.32); }); stroke('#3a3f5c', R * 0.15, function (k) { k.moveTo(0, 0); k.lineTo(0, R * 0.32); });
      path([-R * 0.09, R * 0.28, R * 0.09, R * 0.28, R * 0.1, R * 0.46, R * 0.22, R * 0.5, R * 0.2, R * 0.56, -R * 0.1, R * 0.56], '#9a3a24', l * 0.6); ctx.restore(); });
    if (D.rig) D.rigArm('b', -R * 0.28, -R * 0.58, D.rig.b.a, D.rig.b.e, R * 0.22, R * 0.21, R * 0.14, '#2f3a6a', l * 0.6, '#ffd9b0', R * 0.065, null);
    else if (!D.armOff) { stroke(OL, R * 0.14 + l * 1.6, function (q) { q.moveTo(-R * 0.26, -R * 0.58); q.quadraticCurveTo(-R * 0.47, -R * 0.35, -R * 0.38, -R * 0.08); }); stroke('#3c4c96', R * 0.14, function (q) { q.moveTo(-R * 0.26, -R * 0.58); q.quadraticCurveTo(-R * 0.47, -R * 0.35, -R * 0.38, -R * 0.08); }); D.circ(-R * 0.38, -R * 0.06, R * 0.075, '#ffd9b0', l * 0.5); }
    // кафтан
    ctx.beginPath(); ctx.moveTo(-R * 0.3, -R * 0.68); ctx.quadraticCurveTo(-R * 0.48, -R * 0.4, -R * 0.42, -R * 0.02); ctx.lineTo(R * 0.42, -R * 0.02); ctx.quadraticCurveTo(R * 0.48, -R * 0.4, R * 0.3, -R * 0.68); ctx.closePath();
    ctx.fillStyle = fl ? '#fff' : G2(-R * 0.45, 0, R * 0.45, 0, '#6a7ad0', '#2f3a7a'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.fillStyle = '#ffd54a'; ctx.fillRect(-R * 0.42, -R * 0.1, R * 0.84, R * 0.06);
    for (var em = 0; em < 5; em++) D.circ(-R * 0.32 + em * R * 0.16, -R * 0.07, R * 0.025, '#e8484f');   // вышивка по подолу
    stroke('#ffd54a', l * 0.6, function (q) { q.moveTo(0, -R * 0.66); q.lineTo(0, -R * 0.12); });
    for (var bt = 0; bt < 3; bt++) D.circ(R * 0.06, -R * (0.58 - bt * 0.12), R * 0.03, '#ffd54a', l * 0.3);
    // кушак с кистями
    D.rr(-R * 0.43, -R * 0.36, R * 0.86, R * 0.1, R * 0.04); ctx.fillStyle = '#d8323f'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke();
    [[-0.2, 0], [-0.1, 1]].forEach(function (q) { var kx = R * q[0], ka = Math.sin(t * 3 + q[1]) * 0.15; ctx.save(); ctx.translate(kx, -R * 0.28); ctx.rotate(ka); stroke(OL, l * 1.6, function (k) { k.moveTo(0, 0); k.lineTo(0, R * 0.16); }); stroke('#d8323f', l * 0.8, function (k) { k.moveTo(0, 0); k.lineTo(0, R * 0.16); }); D.ell(0, R * 0.2, R * 0.04, R * 0.06, '#ffd54a', l * 0.4); ctx.restore(); });
    // меховой воротник
    if (D.rig) D.rigArm('f', R * 0.28, -R * 0.58, D.rig.f.a, D.rig.f.e, R * 0.22, R * 0.21, R * 0.14, '#3a4a8a', l * 0.6, '#ffd9b0', R * 0.065, null);
    // голова — как у прежнего Соловья: круглое чистое лицо, хитрый прищур, брови-чёрточки, широкие усы-подкова;
    // усы не выходят за лицо, рот виден под усами (2.11.5)
    var puff = wh ? 1.12 : 1, hy = -R * 1.0, hr = R * 0.33;
    D.ell(0, hy, hr * puff, hr, RG(0, hy, hr, '#ffdcb8', '#e0a47a'), l);
    if (wh) { blush(-R * 0.21, hy + R * 0.06, R * 0.09); blush(R * 0.21, hy + R * 0.06, R * 0.09); } else { blush(-R * 0.2, hy + R * 0.05, R * 0.055); blush(R * 0.2, hy + R * 0.05, R * 0.055); }
    if (e.snore) stroke(OL, l * 0.7, function (q) { q.arc(-R * 0.1, hy - R * 0.05, R * 0.05, 0.2, 2.9); q.moveTo(R * 0.18, hy - R * 0.05); q.arc(R * 0.13, hy - R * 0.05, R * 0.05, 0.2, 2.9); });
    else { eye(-R * 0.1, hy - R * 0.06, R * 0.06, 1); eye(R * 0.13, hy - R * 0.06, R * 0.06, 1); }
    var my = hy + R * 0.235;
    if (wh) { D.ell(R * 0.02, my - R * 0.02, R * 0.05, R * 0.055, '#c9606a', l * 0.6); D.circ(R * 0.02, my - R * 0.02, R * 0.022, '#5a1a22'); }
    else if (TK) mouth(R * 0.01, my, R * 0.1);
    else stroke('#6a2a26', Math.max(1, R * 0.022), function (q) { q.moveTo(-R * 0.05, my - R * 0.005); q.quadraticCurveTo(R * 0.01, my + R * 0.025, R * 0.07, my - R * 0.01); });
    D.ell(R * 0.01, hy + R * 0.05, R * 0.055, R * 0.045, '#e9946e'); D.circ(-R * 0.005, hy + R * 0.035, R * 0.016, 'rgba(255,255,255,0.55)');   // нос — маленький, в цвет лица
    // усы-подкова: от носа в стороны и вниз, кончики подкручены вверх, всё в пределах лица
    [-1, 1].forEach(function (d) { var s = wh ? 0.85 : 1; ctx.beginPath(); ctx.moveTo(R * 0.01, hy + R * 0.09);
      ctx.quadraticCurveTo(d * R * 0.16, hy + R * 0.07, d * R * 0.25 * s, hy + R * 0.15);
      ctx.quadraticCurveTo(d * R * 0.31 * s, hy + R * 0.19, d * R * 0.3 * s, hy + R * 0.1);
      ctx.quadraticCurveTo(d * R * 0.27 * s, hy + R * 0.22, d * R * 0.15, hy + R * 0.18);
      ctx.quadraticCurveTo(d * R * 0.07, hy + R * 0.16, R * 0.01, hy + R * 0.15); ctx.closePath();
      ctx.fillStyle = '#4a2e1c'; ctx.fill(); });
    if (wh) for (var wv = 0; wv < 3; wv++) stroke('rgba(255,255,255,0.85)', l * 0.7, function (q) { q.arc(R * 0.06, my, R * (0.12 + wv * 0.12 + (t * 0.6 % 0.12)), -0.6, 0.6); });
    // шапка с меховой опушкой и пером — надвинута на глаза, как у прежнего Соловья (хитрый прищур из-под околыша)
    ctx.save(); ctx.translate(0, R * 0.05);
    path([-R * 0.3, hy - R * 0.2, -R * 0.24, hy - R * 0.55, -R * 0.02, hy - R * 0.62 + sw * R * 0.1, R * 0.26, hy - R * 0.5, R * 0.32, hy - R * 0.2], G2(0, hy - R * 0.6, 0, hy - R * 0.2, '#f05a62', '#9a2030'), l);
    stroke('rgba(255,255,255,0.35)', l * 0.6, function (q) { q.moveTo(-R * 0.15, hy - R * 0.25); q.quadraticCurveTo(-R * 0.12, hy - R * 0.45, -R * 0.02, hy - R * 0.55); });
    D.rr(-R * 0.36, hy - R * 0.26, R * 0.72, R * 0.13, R * 0.06); ctx.fillStyle = '#8a5a3a'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke();
    for (var fb = 0; fb < 6; fb++) D.circ(-R * 0.3 + fb * R * 0.12, hy - R * 0.25 + (fb % 2) * R * 0.03, R * 0.025, '#b07a50');
    D.circ(R * 0.22, hy - R * 0.22, R * 0.045, '#5ac8ff', l * 0.4);
    ctx.save(); ctx.translate(R * 0.22, hy - R * 0.24); ctx.rotate(0.35 + sw); path([0, 0, -R * 0.06, -R * 0.3, 0, -R * 0.5, R * 0.06, -R * 0.3], G2(0, -R * 0.5, 0, 0, '#5ac8ff', '#2a7a5a'), l * 0.5); D.circ(0, -R * 0.36, R * 0.04, '#ffd54a'); ctx.restore();
    ctx.restore();
    if (!D.rig && !D.armOff) {   // передняя рука — свистит в два пальца, иначе подбоченился
      var fx = wh ? R * 0.22 : R * 0.42, fy = wh ? my - R * 0.02 : -R * 0.3;
      stroke(OL, R * 0.14 + l * 1.6, function (q) { q.moveTo(R * 0.26, -R * 0.58); q.quadraticCurveTo(R * (wh ? 0.55 : 0.6), -R * (wh ? 0.62 : 0.45), fx, fy); }); stroke('#4a5ab0', R * 0.14, function (q) { q.moveTo(R * 0.26, -R * 0.58); q.quadraticCurveTo(R * (wh ? 0.55 : 0.6), -R * (wh ? 0.62 : 0.45), fx, fy); });
      D.circ(fx, fy, R * 0.075, '#ffd9b0', l * 0.5); if (wh) stroke('#ffd9b0', l * 1.2, function (q) { q.moveTo(fx - R * 0.02, fy - R * 0.02); q.lineTo(fx - R * 0.12, fy - R * 0.03); }); }
    if (e.snore) { var zp = (t * 0.5) % 1; ctx.globalAlpha = 1 - zp; D.text('Z', R * 0.4 + zp * R * 0.3, -R * 1.5 - zp * R * 0.6, R * 0.3, '#fff', 'center', 'middle', 2); ctx.globalAlpha = 1; }
    ctx.restore();
  } else if (T === 'hare') {
    var hp2 = Math.abs(Math.sin(t * 9)) * R * 0.15;
    ctx.translate(0, -hp2);
    D.ell(-R * 0.35, -R * 0.35, R * 0.16, R * 0.14, '#ffffff', l * 0.7);
    D.ell(0, -R * 0.45, R * 0.48, R * 0.38, fl ? '#fff' : RG(0, -R * 0.45, R * 0.5, '#ffffff', '#d8e0f0'), l);
    D.ell(R * 0.28, -R * 0.08, R * 0.18, R * 0.08, '#ffffff', l * 0.7);
    D.circ(R * 0.38, -R * 0.82, R * 0.28, RG(R * 0.38, -R * 0.82, R * 0.28, '#ffffff', '#dde4f2'), l);
    [[0.25, -1.3, -0.25], [0.48, -1.32, 0.15]].forEach(function (er) { ctx.save(); ctx.translate(R * er[0], R * er[1]); ctx.rotate(er[2] + Math.sin(t * 6) * 0.1); D.ell(0, 0, R * 0.09, R * 0.32, '#ffffff', l * 0.7); D.ell(0, R * 0.02, R * 0.045, R * 0.24, '#ffc0d0'); ctx.restore(); });
    eye(R * 0.48, -R * 0.88, R * 0.07, 1); D.circ(R * 0.63, -R * 0.78, R * 0.045, '#ff8aa8', l * 0.4);
    stroke('rgba(120,130,160,0.8)', l * 0.4, function (q) { q.moveTo(R * 0.6, -R * 0.74); q.lineTo(R * 0.85, -R * 0.78); q.moveTo(R * 0.6, -R * 0.72); q.lineTo(R * 0.84, -R * 0.66); });
    blush(R * 0.5, -R * 0.72, R * 0.05);
  } else if (T === 'duck') {
    var wg = Math.sin(t * 16);
    D.ell(0, -R * 0.4, R * 0.55, R * 0.32, fl ? '#fff' : G2(0, -R * 0.7, 0, -R * 0.1, '#b08a5a', '#7a5a3a'), l);
    path([-R * 0.5, -R * 0.45, -R * 0.82, -R * 0.62, -R * 0.62, -R * 0.35], '#5a4028', l * 0.7);
    ctx.save(); ctx.translate(-R * 0.05, -R * 0.5); ctx.rotate(-wg * 0.6); path([0, 0, -R * 0.55, -R * 0.45, -R * 0.15, R * 0.05], G2(0, -R * 0.4, 0, 0, '#6a8aa0', '#3a5a7a'), l * 0.8); ctx.restore();
    D.circ(R * 0.48, -R * 0.72, R * 0.22, RG(R * 0.48, -R * 0.72, R * 0.22, '#4aa06a', '#1f6a3a'), l);
    D.rr(R * 0.3, -R * 0.55, R * 0.36, R * 0.06, R * 0.03); ctx.fillStyle = '#ffffff'; ctx.fill();
    path([R * 0.66, -R * 0.74, R * 0.98, -R * 0.68, R * 0.66, -R * 0.62], '#ffb347', l * 0.6);
    eye(R * 0.52, -R * 0.78, R * 0.055, 1);
    if (Z.G && Z.G.kos && Z.G.kos.stage === 2) { D.ell(0, -R * 0.02, R * 0.14, R * 0.18, RG(0, -R * 0.02, R * 0.18, '#ffffff', '#efe4c8'), l * 0.6); D.star(R * 0.04, -R * 0.08, R * 0.04, '#ffd54a'); }
  } else if (T === 'gorynych') {
    var lost = e.headsLost || 0;
    // крылья
    var wf = Math.sin(t * 3) * R * 0.1;
    [-1, 1].forEach(function (s) { path([s * R * 0.2, -R * 1.0, s * R * 1.25, -R * 1.65 - wf, s * R * 1.15, -R * 1.1 - wf, s * R * 1.3, -R * 0.75, s * R * 0.6, -R * 0.65], s < 0 ? '#2f6a3a' : '#3a7a45', l); stroke('rgba(255,255,255,0.25)', l * 0.6, function (q) { q.moveTo(s * R * 0.3, -R * 0.95); q.lineTo(s * R * 1.15, -R * 1.55 - wf); q.moveTo(s * R * 0.4, -R * 0.85); q.lineTo(s * R * 1.15, -R * 1.05 - wf); }); });
    // хвост и лапы
    stroke(OL, l * 3.4, function (q) { q.moveTo(-R * 0.6, -R * 0.3); q.quadraticCurveTo(-R * 1.4, -R * 0.1, -R * 1.5, -R * 0.55); }); stroke('#3f8a4a', l * 2.2, function (q) { q.moveTo(-R * 0.6, -R * 0.3); q.quadraticCurveTo(-R * 1.4, -R * 0.1, -R * 1.5, -R * 0.55); });
    path([-R * 1.5, -R * 0.55, -R * 1.72, -R * 0.75, -R * 1.45, -R * 0.78], '#ffd54a', l * 0.6);
    D.ell(-R * 0.4, -R * 0.08, R * 0.2, R * 0.12, '#2f6a3a', l * 0.8); D.ell(R * 0.42, -R * 0.08, R * 0.2, R * 0.12, '#2f6a3a', l * 0.8);
    // тело с чешуёй и брюхом
    D.ell(0, -R * 0.62, R * 0.82, R * 0.6, W || RG(0, -R * 0.62, R * 0.85, '#6cc07a', '#2f6a3a'), l);
    D.ell(R * 0.08, -R * 0.45, R * 0.48, R * 0.36, '#d8e88a', l * 0.6);
    for (var bp = 0; bp < 4; bp++) stroke('rgba(120,140,40,0.6)', l * 0.6, function (q) { q.moveTo(-R * 0.3, -R * (0.25 + bp * 0.13)); q.quadraticCurveTo(R * 0.1, -R * (0.2 + bp * 0.13), R * 0.48, -R * (0.27 + bp * 0.13)); });
    for (var sc = 0; sc < 6; sc++) path([-R * 0.65 + sc * R * 0.2, -R * 1.08 + Math.abs(sc - 2.5) * R * 0.05, -R * 0.58 + sc * R * 0.2, -R * 1.3 + Math.abs(sc - 2.5) * R * 0.05, -R * 0.5 + sc * R * 0.2, -R * 1.08 + Math.abs(sc - 2.5) * R * 0.05], '#ffd54a', l * 0.5);
    var HO = [[-0.5, '#bfe6ff', 0], [0.05, '#e8eef9', 1], [0.6, '#ffb347', 2]], hsOf = function (i) { var d0 = (i === 2 && lost >= 1) || (i === 1 && lost >= 2) || (i === 0 && lost >= 3); return e.headSt ? e.headSt[i] : (d0 ? 'sleep' : null); };
    HO.sort(function (a, b) { var sa = hsOf(a[2]) === 'sleep' || hsOf(a[2]) === 'frozen' ? 1 : 0, sb = hsOf(b[2]) === 'sleep' || hsOf(b[2]) === 'frozen' ? 1 : 0; return sa - sb || a[2] - b[2]; });
    HO.forEach(function (h) {
      var i = h[2], dead = (i === 2 && lost >= 1) || (i === 1 && lost >= 2) || (i === 0 && lost >= 3);
      // состояния головы: wind — замах, dizzy — ошалела, sleep — уснула, frozen — спит под ледяным колпаком (без «отрубания»: детская игра)
      var hs = e.headSt ? e.headSt[i] : (dead ? 'sleep' : null), hk = e.headK ? e.headK[i] || 0 : 1;
      var nx = R * h[0], ny = -R * 1.55 - (i === 1 ? R * 0.22 : 0) + Math.sin(t * 2 + i) * R * 0.06;
      if (hs === 'wind') { nx -= R * 0.22 * hk; ny -= R * 0.18 * hk; }
      if (hs === 'sleep' || hs === 'frozen') { nx += R * [0.18, 0.4, 0.3][i]; ny += R * [0.5, 0.36, 0.46][i] + Math.sin(t * 1.5 + i) * R * 0.03; }
      if (hs === 'dizzy') { nx += Math.sin(t * 9 + i) * R * 0.07; ny += R * 0.12; }
      stroke(OL, l * 4, function (q) { q.moveTo(R * h[0] * 0.5, -R * 1.0); q.quadraticCurveTo(nx - R * 0.1, (ny - R * 1.0) / 2 - R * 0.2, nx, ny); });
      stroke(i === 1 ? '#4aa05a' : '#3f8a4a', l * 2.6, function (q) { q.moveTo(R * h[0] * 0.5, -R * 1.0); q.quadraticCurveTo(nx - R * 0.1, (ny - R * 1.0) / 2 - R * 0.2, nx, ny); });
      if (hs === 'wind') { ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 14); D.circ(nx + R * 0.08, ny, R * (0.42 + 0.05 * Math.sin(t * 14)), '#ffe066'); ctx.globalAlpha = 1; }
      if (hs === 'sleep' || hs === 'frozen' || hs === 'dizzy') {
        ctx.save(); ctx.translate(nx, ny); ctx.rotate(hs === 'dizzy' ? Math.sin(t * 6 + i) * 0.25 : 0.35); ctx.translate(-nx, -ny);
        D.ell(nx + R * 0.05, ny, R * 0.3, R * 0.22, RG(nx, ny, R * 0.3, '#7ad08a', '#3a8a4a'), l);
        D.ell(nx + R * 0.28, ny + R * 0.06, R * 0.14, R * 0.1, '#5ab06a', l * 0.6); D.circ(nx + R * 0.36, ny + R * 0.02, R * 0.02, OL);
        if (hs === 'dizzy') { stroke(OL, l * 0.6, function (q) { for (var a = 0; a < 9; a++) { var rr = R * 0.012 * a, an = a * 0.9 + t * 8; if (a === 0) q.moveTo(nx + R * 0.04, ny - R * 0.07); else q.lineTo(nx + R * 0.04 + Math.cos(an) * rr, ny - R * 0.07 + Math.sin(an) * rr); } });
          for (var st2 = 0; st2 < 3; st2++) { var sa = t * 4 + st2 * 2.1; D.star(nx + Math.cos(sa) * R * 0.32, ny - R * 0.34 + Math.sin(sa) * R * 0.08, R * 0.07, '#ffe066', l * 0.4); } }
        else { stroke(OL, l * 0.7, function (q) { q.moveTo(nx - R * 0.03, ny - R * 0.07); q.quadraticCurveTo(nx + R * 0.04, ny - R * 0.02, nx + R * 0.11, ny - R * 0.07); }); }
        path([nx - R * 0.14, ny - R * 0.16, nx - R * 0.08, ny - R * 0.38, nx, ny - R * 0.18], '#ffd54a', l * 0.5); path([nx + R * 0.04, ny - R * 0.2, nx + R * 0.12, ny - R * 0.36, nx + R * 0.16, ny - R * 0.18], '#ffd54a', l * 0.5);
        ctx.restore();
        if (hs === 'frozen') { ctx.globalAlpha = 0.55; D.ell(nx + R * 0.08, ny - R * 0.04, R * 0.42, R * 0.34, '#cfeeff', l * 0.7); ctx.globalAlpha = 0.9; stroke('#ffffff', l * 0.9, function (q) { q.moveTo(nx - R * 0.18, ny - R * 0.2); q.quadraticCurveTo(nx - R * 0.08, ny - R * 0.3, nx + R * 0.06, ny - R * 0.3); }); ctx.globalAlpha = 1; }
        if (hs !== 'dizzy') for (var zz = 0; zz < 2; zz++) { var zp = (t * 0.6 + zz * 0.5 + i * 0.3) % 1, zx = nx + R * (0.2 + zp * 0.3), zy = ny - R * (0.35 + zp * 0.5), zs = R * (0.06 + zp * 0.05); ctx.globalAlpha = 1 - zp; var zm = e.dir < 0 ? -zs : zs, zf = function (q) { q.moveTo(zx - zm, zy - zs); q.lineTo(zx + zm, zy - zs); q.lineTo(zx - zm, zy + zs); q.lineTo(zx + zm, zy + zs); }; stroke(OL, l * 1.6, zf); stroke('#ffffff', l * 0.7, zf); ctx.globalAlpha = 1; }
        return; }
      D.ell(nx + R * 0.05, ny, R * 0.3, R * 0.22, RG(nx, ny, R * 0.3, '#7ad08a', '#3a8a4a'), l);
      D.ell(nx + R * 0.28, ny + R * 0.06, R * 0.14, R * 0.1, '#5ab06a', l * 0.6); D.circ(nx + R * 0.36, ny + R * 0.02, R * 0.02, OL);
      eye(nx + R * 0.04, ny - R * 0.07, R * 0.06, 1);
      if (hs === 'wind') { path([nx - R * 0.08, ny - R * 0.2, nx + R * 0.14, ny - R * 0.12, nx - R * 0.06, ny - R * 0.12], OL, l * 0.4); }
      path([nx - R * 0.14, ny - R * 0.16, nx - R * 0.08, ny - R * 0.38, nx, ny - R * 0.18], '#ffd54a', l * 0.5); path([nx + R * 0.04, ny - R * 0.2, nx + R * 0.12, ny - R * 0.36, nx + R * 0.16, ny - R * 0.18], '#ffd54a', l * 0.5);
      if (i === 2) { ctx.beginPath(); ctx.ellipse(nx + R * 0.3, ny + R * 0.14, R * 0.08, R * 0.05, 0, 0, 7); ctx.fillStyle = '#7a2a2a'; ctx.fill(); }
      if (TK) mouth(nx + R * 0.3, ny + R * 0.13, R * 0.14);
      if (i === 0) { ctx.globalAlpha = 0.5; D.circ(nx + R * 0.45, ny + R * 0.08, R * 0.06, h[1]); ctx.globalAlpha = 1; }
    });
  }
  ctx.restore();
};

// ---------- главное меню: вся команда у ёлки ----------
Z.drawMenuCast = function (W, ground, th, s, t) {
  var heroes = [['emelya', -1.62, 1], ['belka', -1.2, 1], ['kolobok', -0.88, 1], ['kot', 1.86, -1], ['plombir', 1.52, -1], ['eskimo', 1.2, -1], ['vasilisa', 0.88, -1]];   // 2.11.1: Эскимо рядом с братом
  var foes = [['koschei', -2.2, 1], ['gorynych', 2.3, -1]];
  var wide = W / 2 > th * 2.35, f = Math.min(1, (W / 2 - 22 * s) / (th * 1.62)), R = th * (wide ? 0.165 : 0.12);
  if (!wide) { // узкий экран: два ряда — Емеля и Кот-Баюн на сугробах сзади, остальные спереди, никто ни за кем не прячется
    // 2.11.5: задний ряд стоит на снежной террасе (её рисует фон, Z.menuTerrace) — ноги на снегу, никто не висит; передний ряд реже
    var R2 = Math.min(th * 0.15, W * 0.08), TR = Z.menuTerrace ? Z.menuTerrace(W, ground, th, s) : null, back = function (x) { return TR ? TR.y(x) : ground - th * 0.27; };
    var row = [['emelya', 0.13, 1, 1, 1.15], ['eskimo', 0.71, -1, 1, 0.8], ['kot', 0.9, -1, 1, 1.0], ['belka', 0.07, 1, 0, 0.92], ['kolobok', 0.18, 1, 0, 0.82], ['vasilisa', 0.79, -1, 0, 0.92], ['plombir', 0.93, -1, 0, 0.92]];
    row.forEach(function (q) { var hop = Math.abs(Math.sin(t * 2.2 + q[1] * 9)) * R2 * 0.06, gx = W * q[1], gy = q[3] ? back(gx) + 2 * s : ground + 6 * s; D.ally(q[0], gx, gy - hop, R2 * q[4], { dir: q[2] }); });
    return { mx: W * 0.3, sx: W * 0.67, k: Math.min(1.15, W * 0.088 / (th * 0.17)) };
  }
  // 2.11.5: на широком экране злодеи не стоят в ряду с героями — как на телефоне: Горыныч пролетает в небе, Кощей выглядывает из замка (v29q)
  if (false) foes.forEach(function (q) {
    var x = W / 2 + q[1] * th, sz = Z.ENEMIES[q[0]].size, cs = th * (q[0] === 'gorynych' ? 0.3 : 0.24) / (0.31 * sz);
    D.enemy({ type: q[0], size: sz, dir: q[2], walk: t * 2, ph: 0, hitT: 0, slow: 0, kb: 0, air: false, mortal: true, headsLost: 0 }, x, ground + 8 * s, cs, t);
  });

  heroes.forEach(function (q) {
    var x = W / 2 + q[1] * th * (wide ? 1 : f), hop = Math.abs(Math.sin(t * 2.2 + q[1] * 3)) * R * 0.1, sc = q[0] === 'emelya' ? 1.3 : q[0] === 'kolobok' ? 0.95 : 1;
    D.ally(q[0], x, ground + 6 * s - hop, R * sc, { dir: q[2] });
  });
};
})();

(function () { var E = window.Z.ENEMIES; E.raz.size = 1.35; E.kiki.size = 1.75; E.leshy.size = 1.55; E.yaga.size = 1.6; E.hare.size = 1.15; E.duck.size = 1.3; E.koschei.size = 2.1; E.solovey.size = 1.55; })();
