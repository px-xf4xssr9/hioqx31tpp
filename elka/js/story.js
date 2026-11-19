/* Сюжет: персонажи, комиксы, экран загрузки, ориентиры регионов */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = D.OL, COL = D.COL;
function c() { return D.ctx; }

// ---------- персонажи ----------
function grad(ctx, x0, y0, x1, y1, a, b) { var g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function fur(ctx, x0, x1, y, r, l) { // пушистая опушка — ряд белых кружков
  var n = Math.max(3, Math.round((x1 - x0) / (r * 1.3)));
  for (var i = 0; i <= n; i++) { var x = x0 + (x1 - x0) * i / n; D.circ(x, y, r, '#ffffff', l); }
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, y - r * 0.6, x1 - x0, r * 1.2);
}
function shape(ctx, pts, fill, l) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); }
// ---------- лёгкий скелет руки (только мультики): плечо → локоть → кисть ----------
// a — угол плеча от «вниз», вперёд положительный; e — сгиб локтя (относительно плеча)
D.rigArm = function (side, sx, sy, a, e, L1, L2, w, col, l, hand, hr, cuff, bony) {
  var ctx = D.ctx, ex = sx + Math.sin(a) * L1, ey = sy + Math.cos(a) * L1, a2 = a + e, hx = ex + Math.sin(a2) * L2, hy = ey + Math.cos(a2) * L2;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy);
  ctx.strokeStyle = OL; ctx.lineWidth = w + l * 2; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  if (cuff) D.circ(hx - Math.sin(a2) * hr * 0.7, hy - Math.cos(a2) * hr * 0.7, w * 0.62, cuff, l * 0.7);
  if (bony) { ctx.strokeStyle = bony; ctx.lineWidth = l * 0.5; ctx.beginPath(); for (var f = -1; f <= 1; f++) { var fa = a2 + f * 0.35; ctx.moveTo(hx, hy); ctx.lineTo(hx + Math.sin(fa) * hr, hy + Math.cos(fa) * hr); } ctx.stroke(); }
  else if (hand) D.circ(hx, hy, hr, hand, l * 0.7);
  try { var T = ctx.getTransform(); D.rigOut = D.rigOut || {}; D.rigOut[side] = { p: T.transformPoint(new DOMPoint(hx, hy)), ps: T.transformPoint(new DOMPoint(sx, sy)), pe: T.transformPoint(new DOMPoint(ex, ey)), s: Math.hypot(T.a, T.b), hand: bony ? null : hand, hr: hr, l: l, w: w, col: col, cuff: cuff, bony: bony }; } catch (er) { if (window.__rep) window.__rep(er); }
  return { x: hx, y: hy };
};
// 2.11.5: живые глаза у всех — белок, зрачок, блик; моргают оба глаза разом, у каждого персонажа в своё время
// (момент моргания — от положения персонажа на экране). kind: 'coal' — глянцевые угольки снеговиков.
D.blinkNow = function () { var m = c().getTransform(), sd = Math.abs(Math.sin((m.e * 0.0131 + m.f * 0.0077) * 12.9898)) * 7; return ((Z.time * 0.9 + sd) % 4.1) < 0.13; };
D.eyeR = function (x, y, r, look, kind) {
  var ctx = c(), bl = D.blinkNow(); look = look || 0;
  if (kind === 'coal') {
    if (bl) { ctx.strokeStyle = OL; ctx.lineWidth = r * 0.55; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - r * 0.9, y); ctx.lineTo(x + r * 0.9, y); ctx.stroke(); return; }
    var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, '#4a5068'); g.addColorStop(1, '#14182c'); D.circ(x, y, r, g);
    D.circ(x - r * 0.32 + look * r * 0.15, y - r * 0.32, r * 0.3, 'rgba(255,255,255,0.9)'); return;
  }
  if (kind === 'warm') {   // 2.11.5: добрые глаза героев — тёмная капля без белка и толстой обводки, два блика, мягкое веко сверху
    if (bl) { ctx.strokeStyle = '#2a2440'; ctx.lineWidth = r * 0.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y - r * 0.35, r * 0.8, 0.35, Math.PI - 0.35); ctx.stroke(); return; }
    var gw = ctx.createRadialGradient(x - r * 0.2, y - r * 0.3, r * 0.1, x, y, r * 1.05); gw.addColorStop(0, '#5a4a6e'); gw.addColorStop(1, '#221c34');
    D.ell(x + look * r * 0.12, y + r * 0.05, r * 0.72, r * 0.9, gw);
    D.circ(x + look * r * 0.12 + r * 0.24, y - r * 0.24, r * 0.27, '#ffffff'); D.circ(x + look * r * 0.12 - r * 0.2, y + r * 0.32, r * 0.12, 'rgba(255,255,255,0.85)');
    return;
  }
  if (bl) { ctx.strokeStyle = OL; ctx.lineWidth = r * 0.45; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y - r * 0.2, r * 0.85, 0.25, Math.PI - 0.25); ctx.stroke(); return; }
  D.ell(x, y, r, r * 1.12, '#ffffff', Math.max(1, r * 0.3));
  D.circ(x + look * r * 0.28, y + r * 0.08, r * 0.62, OL);
  D.circ(x + look * r * 0.28 + r * 0.22, y - r * 0.18, r * 0.22, '#ffffff');
};
// 2.11.5: рот рисуется внутри модели (под усами, на лице) — двигается с головой при ходьбе, прыжке, наклоне
function talks(o, key) { return o.talk || (!o.noTalk && Z.talkKey && Z.talkKey() === key); }
D.moroz = function (x, y, R, o) {
  var ctx = c(); o = o || {}; var l = Math.max(1.4, R * 0.08), dir = o.dir || 1, t = Z.time;
  var bob = o.walk ? Math.abs(Math.sin(t * 8)) * R * 0.06 : 0;
  ctx.save(); ctx.translate(x, y - bob); ctx.scale(dir, 1);
  D.ell(R * 0.1, bob, R * 0.8, R * 0.2, 'rgba(30,40,80,0.22)');
  // 2.7.21: удар посохом — поднять и с размаху ударить о землю, от удара — ледяное кольцо
  var sp = o.atkP != null && o.atkP >= 0 ? o.atkP : -1, sdy = 0, srt = 0;
  // 2.11.5: удар с замахом: посох поднимается и отводится назад (сияние набирается), резкий удар вперёд о землю,
  // дрожь посоха и вспышка в точке удара, затем возврат. Удар — на 0,5 анимации.
  var ease = function (u) { return 1 - (1 - u) * (1 - u); }, chg = 0, smear = -1;
  if (sp >= 0) {
    if (sp < 0.4) { var e0 = ease(sp / 0.4); sdy = -R * 0.75 * e0; srt = -0.42 * e0; chg = e0; }
    else if (sp < 0.5) { var u1 = (sp - 0.4) / 0.1, a1 = u1 * u1; sdy = -R * 0.75 * (1 - a1); srt = -0.42 + 0.62 * a1; chg = 1 - u1 * 0.5; smear = u1; }
    else if (sp < 0.64) { var v1 = (sp - 0.5) / 0.14; sdy = -R * 0.07 * Math.sin(v1 * Math.PI); srt = 0.2 - 0.08 * v1 + 0.05 * Math.sin(v1 * 34) * (1 - v1); }
    else { var w1 = ease((sp - 0.64) / 0.36); srt = 0.12 * (1 - w1); }
  }
  // 2.11.5: морозный луч — посох наводится вперёд на врага, набалдашник сияет; луч рисуется эффектом от кончика
  var bm = o.beam != null && o.beam >= 0 ? o.beam : -1;
  if (bm >= 0 && sp < 0) { var bin = bm < 0.2 ? ease(bm / 0.2) : bm > 0.8 ? 1 - ease((bm - 0.8) / 0.2) : 1; srt = (o.beamA || 1.25) * bin; sdy = -R * 0.45 * bin; chg = Math.max(chg, bin); }
  if (smear >= 0) {   // след посоха при ударе
    var aB = -Math.PI / 2 + 0.03 + srt, aA = aB - 0.8, rS = R * 2.85;
    ctx.save(); ctx.translate(R * 0.8, R * 0.02 + sdy); ctx.globalAlpha = 0.85 * (1 - smear * 0.3); ctx.beginPath(); ctx.arc(0, 0, rS, aA, aB); ctx.arc(0, 0, rS * 0.45, aB, aA, true); ctx.closePath();
    var sg = ctx.createRadialGradient(0, 0, rS * 0.45, 0, 0, rS); sg.addColorStop(0, 'rgba(127,216,255,0)'); sg.addColorStop(0.6, 'rgba(127,216,255,0.55)'); sg.addColorStop(1, 'rgba(255,255,255,0.95)'); ctx.fillStyle = sg; ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
  }
  if (sp >= 0.5 && sp < 0.7) {   // вспышка в точке удара
    var fv = (sp - 0.5) / 0.2, fr = R * (0.35 + fv * 0.9);
    ctx.save(); ctx.translate(R * 0.8, R * 0.02); ctx.globalAlpha = 1 - fv;
    var fg = ctx.createRadialGradient(0, 0, 0, 0, 0, fr); fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.35, 'rgba(160,230,255,0.95)'); fg.addColorStop(1, 'rgba(90,190,255,0)'); ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(0, -R * 0.05, fr, fr * 0.6, 0, 0, 7); ctx.fill();
    ctx.lineCap = 'round';
    for (var fl = 0; fl < 9; fl++) { var fa = -Math.PI + fl * Math.PI / 8, f0 = R * (0.25 + fv * 0.6), f1 = R * (0.6 + fv * 1.2); ctx.beginPath(); ctx.moveTo(Math.cos(fa) * f0, Math.sin(fa) * f0 * 0.7); ctx.lineTo(Math.cos(fa) * f1, Math.sin(fa) * f1 * 0.7); ctx.strokeStyle = '#4fb6f0'; ctx.lineWidth = Math.max(2, R * 0.11) * (1 - fv); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, R * 0.05) * (1 - fv); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  if (sp >= 0.5 && sp < 0.95) { var ri = (sp - 0.5) / 0.45; ctx.globalAlpha = 0.75 * (1 - ri); ctx.strokeStyle = '#bfefff'; ctx.lineWidth = Math.max(1.5, R * 0.1) * (1 - ri * 0.6); ctx.beginPath(); ctx.ellipse(R * 0.8, R * 0.02, R * (0.3 + ri * 1.1), R * (0.1 + ri * 0.32), 0, 0, 7); ctx.stroke();
    for (var ic = 0; ic < 5; ic++) { var ia = -2.6 + ic * 0.55, ir2 = R * (0.25 + ri * 0.75); D.poly([R * 0.8 + Math.cos(ia) * ir2 - R * 0.05, R * 0.02 + Math.sin(ia) * ir2 * 0.5, R * 0.8 + Math.cos(ia) * ir2, R * 0.02 + Math.sin(ia) * ir2 * 0.5 - R * 0.22 * (1 - ri), R * 0.8 + Math.cos(ia) * ir2 + R * 0.05, R * 0.02 + Math.sin(ia) * ir2 * 0.5], '#dff6ff'); }
    ctx.globalAlpha = 1; }
  ctx.save(); ctx.translate(R * 0.8, R * 0.02 + sdy); ctx.rotate(srt); ctx.translate(-R * 0.8, -R * 0.02);
  ctx.strokeStyle = OL; ctx.lineWidth = l * 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(R * 0.78, R * 0.02); ctx.lineTo(R * 0.86, -R * 2.6); ctx.stroke();
  ctx.strokeStyle = grad(ctx, R * 0.7, 0, R * 0.95, 0, '#ffffff', '#9fc4ef'); ctx.lineWidth = l * 1.4; ctx.stroke();
  var g = 0.6 + 0.4 * Math.sin(t * 4) + chg * 1.2 + (sp >= 0.5 && sp < 0.7 ? 0.6 : 0);
  ctx.globalAlpha = Math.min(0.9, 0.4 * g); D.circ(R * 0.86, -R * 2.78, R * 0.42 * (1 + chg * 0.5), '#bfefff'); ctx.globalAlpha = 1;
  if (chg > 0.2) for (var oc = 0; oc < 4; oc++) { var oa = t * 9 + oc * Math.PI / 2, orr = R * 0.55 * (1.2 - chg * 0.5); ctx.globalAlpha = chg; D.flake(R * 0.86 + Math.cos(oa) * orr, -R * 2.78 + Math.sin(oa) * orr, R * 0.09, '#ffffff', l * 0.5); ctx.globalAlpha = 1; }
  D.flake(R * 0.86, -R * 2.78, R * 0.26, OL, l * 1.5); D.flake(R * 0.86, -R * 2.78, R * 0.26, '#9fe3ff', l * 0.8);
  ctx.restore();
  // шуба колоколом с объёмом
  ctx.beginPath(); ctx.moveTo(-R * 0.62, 0); ctx.quadraticCurveTo(-R * 0.6, -R * 0.9, -R * 0.4, -R * 1.5); ctx.lineTo(R * 0.4, -R * 1.5); ctx.quadraticCurveTo(R * 0.6, -R * 0.9, R * 0.62, 0); ctx.quadraticCurveTo(0, R * 0.08, -R * 0.62, 0); ctx.closePath();
  ctx.fillStyle = grad(ctx, -R * 0.6, 0, R * 0.6, 0, '#f0525a', '#a8222d'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  // узоры-снежинки
  for (var i = 0; i < 3; i++) D.flake(-R * 0.32 + i * R * 0.06, -R * 0.35 - i * R * 0.3, R * 0.07, 'rgba(255,255,255,0.85)', l * 0.45);
  D.flake(R * 0.35, -R * 0.4, R * 0.07, 'rgba(255,255,255,0.85)', l * 0.45);
  fur(ctx, -R * 0.6, R * 0.6, -R * 0.04, R * 0.1, l * 0.5);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-R * 0.08, -R * 1.45, R * 0.16, R * 1.4);
  // кушак
  D.rr(-R * 0.5, -R * 0.92, R * 1.0, R * 0.12, R * 0.04); ctx.fillStyle = grad(ctx, 0, -R * 0.92, 0, -R * 0.8, '#ffe27a', '#d9a520'); ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
  ctx.strokeStyle = '#d9a520'; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(-R * 0.3, -R * 0.8); ctx.lineTo(-R * 0.36, -R * 0.5); ctx.moveTo(-R * 0.24, -R * 0.8); ctx.lineTo(-R * 0.24, -R * 0.52); ctx.stroke();
  // рукава и варежки
  var RG = D.rig;
  if (RG) { D.rigArm('f', R * 0.47, -R * 1.38, RG.f.a, RG.f.e, R * 0.33, R * 0.32, R * 0.3, '#c9323c', l * 0.8, '#e8484f', R * 0.13, '#ffffff'); D.rigArm('b', -R * 0.49, -R * 1.36, RG.b.a, RG.b.e, R * 0.33, R * 0.32, R * 0.3, '#d93a44', l * 0.8, '#e8484f', R * 0.12, '#ffffff'); }
  else if (!D.armOff) {   // 2.11.5: рука держит посох там, где он сейчас (на замахе и при ударе)
    var hgx = R * 0.8 + Math.sin(srt) * R * 0.8, hgy = R * 0.02 + sdy - Math.cos(srt) * R * 0.8, shx = R * 0.5, shy = -R * 1.3, adx = hgx - shx, ady = hgy - shy, alen = Math.max(R * 0.3, Math.hypot(adx, ady));
    ctx.save(); ctx.translate(shx, shy); ctx.rotate(Math.atan2(-adx, ady)); D.ell(0, alen * 0.45, R * 0.17, alen * 0.5, '#c9323c', l * 0.8); D.circ(0, alen * 0.85, R * 0.11, '#ffffff', l * 0.5); ctx.restore();
    D.circ(hgx, hgy, R * 0.13, '#e8484f', l * 0.8); }
  if (!RG) { ctx.save(); ctx.translate(-R * 0.48, -R * 1.3); ctx.rotate(0.2); D.ell(0, R * 0.28, R * 0.17, R * 0.34, '#d93a44', l * 0.8); D.circ(0, R * 0.6, R * 0.12, '#e8484f', l * 0.7); ctx.restore(); }
  // голова
  D.circ(0, -R * 1.86, R * 0.34, '#ffd9b8', l);
  // борода облаком с тенью
  var bx = [[-0.3, -1.6, 0.2], [0.3, -1.6, 0.2], [-0.24, -1.36, 0.22], [0.24, -1.36, 0.22], [0, -1.2, 0.26], [-0.12, -1.0, 0.2], [0.12, -1.0, 0.2], [0, -0.86, 0.16]];
  bx.forEach(function (b) { D.circ(b[0] * R, b[1] * R, b[2] * R, '#ffffff', l * 0.7); });
  bx.forEach(function (b) { D.circ(b[0] * R, b[1] * R, b[2] * R * 0.92, '#ffffff'); });
  ctx.globalAlpha = 0.18; bx.forEach(function (b) { D.circ(b[0] * R + R * 0.05, b[1] * R + R * 0.05, b[2] * R * 0.6, '#7d94c8'); }); ctx.globalAlpha = 1;
  if (talks(o, 'MOR') && Z.mouthAt) Z.mouthAt(0, -R * 1.58, R * 0.13);
  // усы
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = OL; ctx.lineWidth = l * 0.6;
  [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.moveTo(0, -R * 1.72); ctx.quadraticCurveTo(s * R * 0.25, -R * 1.82, s * R * 0.36, -R * 1.64); ctx.quadraticCurveTo(s * R * 0.2, -R * 1.62, 0, -R * 1.66); ctx.fill(); ctx.stroke(); });
  D.circ(0, -R * 1.78, R * 0.08, '#ff9c8a', l * 0.5);
  D.circ(-R * 0.2, -R * 1.78, R * 0.06, 'rgba(255,120,120,0.45)'); D.circ(R * 0.2, -R * 1.78, R * 0.06, 'rgba(255,120,120,0.45)');
  D.eyeR(-R * 0.12, -R * 1.92, R * 0.07, 0.3, 'warm'); D.eyeR(R * 0.13, -R * 1.92, R * 0.07, 0.3, 'warm');
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = l * 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-R * 0.24, -R * 2.04); ctx.lineTo(-R * 0.05, -R * 2.02); ctx.moveTo(R * 0.06, -R * 2.02); ctx.lineTo(R * 0.26, -R * 2.04); ctx.stroke();
  // шапка с меховым околышем
  ctx.beginPath(); ctx.moveTo(-R * 0.36, -R * 2.08); ctx.quadraticCurveTo(-R * 0.34, -R * 2.55, 0, -R * 2.56); ctx.quadraticCurveTo(R * 0.34, -R * 2.55, R * 0.36, -R * 2.08); ctx.closePath();
  ctx.fillStyle = grad(ctx, -R * 0.35, 0, R * 0.35, 0, '#f0525a', '#a8222d'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  D.flake(0, -R * 2.36, R * 0.09, '#ffffff', l * 0.5);
  D.rr(-R * 0.42, -R * 2.18, R * 0.84, R * 0.18, R * 0.09); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.stroke();
  ctx.restore();
};
D.snegurochka = function (x, y, R, o) {
  var ctx = c(); o = o || {}; var l = Math.max(1.4, R * 0.08), dir = o.dir || 1, t = Z.time;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  D.ell(R * 0.08, 0, R * 0.7, R * 0.18, 'rgba(30,40,80,0.22)');
  // коса — за спиной и через плечо, из звеньев
  var seg = 7;
  for (var i = 0; i < seg; i++) { var k = i / (seg - 1), bx = -R * 0.3 - Math.sin(k * 1.4) * R * 0.12 + Math.sin(t * 2 + i) * R * 0.01, by = -R * 1.6 + k * R * 0.95; ctx.save(); ctx.translate(bx, by); ctx.rotate(0.25 * (i % 2 ? 1 : -1)); D.ell(0, 0, R * (0.11 - k * 0.03), R * 0.1, i % 2 ? '#f2c04f' : '#e3a93a', l * 0.6); ctx.restore(); }
  D.circ(-R * 0.37, -R * 0.62, R * 0.06, '#4aa3ff', l * 0.5); D.poly([-R * 0.37, -R * 0.6, -R * 0.45, -R * 0.42, -R * 0.33, -R * 0.45], '#4aa3ff', l * 0.4);
  // шубка
  ctx.beginPath(); ctx.moveTo(-R * 0.56, 0); ctx.quadraticCurveTo(-R * 0.5, -R * 0.9, -R * 0.3, -R * 1.45); ctx.lineTo(R * 0.3, -R * 1.45); ctx.quadraticCurveTo(R * 0.5, -R * 0.9, R * 0.56, 0); ctx.quadraticCurveTo(0, R * 0.07, -R * 0.56, 0); ctx.closePath();
  ctx.fillStyle = grad(ctx, -R * 0.55, 0, R * 0.55, 0, '#7cc4ff', '#2f7fd6'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = l * 0.5;
  for (var p = 0; p < 4; p++) D.flake(-R * 0.25 + (p % 2) * R * 0.5, -R * 0.3 - Math.floor(p / 2) * R * 0.45, R * 0.07, '#ffffff', l * 0.45);
  fur(ctx, -R * 0.54, R * 0.54, -R * 0.04, R * 0.09, l * 0.5);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-R * 0.07, -R * 1.42, R * 0.14, R * 1.38);
  D.rr(-R * 0.36, -R * 1.47, R * 0.72, R * 0.12, R * 0.06); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke();
  // руки с белыми варежками
  if (D.rig) { D.rigArm('b', -R * 0.36, -R * 1.37, D.rig.b.a, D.rig.b.e, R * 0.29, R * 0.27, R * 0.24, '#4c9ae8', l * 0.7, '#ffffff', R * 0.1, null); D.rigArm('f', R * 0.36, -R * 1.37, D.rig.f.a, D.rig.f.e, R * 0.29, R * 0.27, R * 0.24, '#3b8de0', l * 0.7, '#ffffff', R * 0.1, null); }
  else if (!D.armOff) { ctx.save(); ctx.translate(R * 0.38, -R * 1.3); ctx.rotate(-0.25); D.ell(0, R * 0.24, R * 0.13, R * 0.3, '#3b8de0', l * 0.7); D.circ(0, R * 0.52, R * 0.1, '#ffffff', l * 0.6); ctx.restore(); }
  if (!D.rig) { ctx.save(); ctx.translate(-R * 0.38, -R * 1.3); ctx.rotate(0.25); D.ell(0, R * 0.24, R * 0.13, R * 0.3, '#4c9ae8', l * 0.7); D.circ(0, R * 0.52, R * 0.1, '#ffffff', l * 0.6); ctx.restore(); }
  // голова, чёлка
  D.circ(0, -R * 1.76, R * 0.31, '#ffe0c4', l);
  ctx.beginPath(); ctx.moveTo(-R * 0.31, -R * 1.78); ctx.quadraticCurveTo(-R * 0.28, -R * 2.06, 0, -R * 2.07); ctx.quadraticCurveTo(R * 0.28, -R * 2.06, R * 0.31, -R * 1.78); ctx.quadraticCurveTo(R * 0.12, -R * 1.92, 0, -R * 1.86); ctx.quadraticCurveTo(-R * 0.12, -R * 1.92, -R * 0.31, -R * 1.78); ctx.closePath();
  ctx.fillStyle = '#f2c04f'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
  // кокошник
  ctx.beginPath(); ctx.moveTo(-R * 0.34, -R * 1.98); ctx.quadraticCurveTo(-R * 0.36, -R * 2.42, 0, -R * 2.52); ctx.quadraticCurveTo(R * 0.36, -R * 2.42, R * 0.34, -R * 1.98); ctx.quadraticCurveTo(0, -R * 2.08, -R * 0.34, -R * 1.98); ctx.closePath();
  ctx.fillStyle = grad(ctx, 0, -R * 2.5, 0, -R * 2.0, '#ffffff', '#bfe0ff'); ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
  for (var q = 0; q < 5; q++) { var a = Math.PI * (0.15 + q * 0.175); D.circ(Math.cos(a) * -R * 0.26, -R * 2.06 - Math.sin(a) * R * 0.3, R * 0.03, '#ffffff', l * 0.3); }
  D.star(0, -R * 2.3, R * 0.1, '#7cc4ff', l * 0.5);
  // лицо
  D.eyeR(-R * 0.11, -R * 1.73, R * 0.075, 0.25, 'warm'); D.eyeR(R * 0.12, -R * 1.73, R * 0.075, 0.25, 'warm');
  ctx.strokeStyle = OL; ctx.lineWidth = l * 0.5; ctx.beginPath(); ctx.moveTo(-R * 0.17, -R * 1.8); ctx.lineTo(-R * 0.2, -R * 1.83); ctx.moveTo(R * 0.18, -R * 1.8); ctx.lineTo(R * 0.21, -R * 1.83); ctx.stroke();
  D.circ(-R * 0.19, -R * 1.64, R * 0.055, 'rgba(255,140,170,0.55)'); D.circ(R * 0.2, -R * 1.64, R * 0.055, 'rgba(255,140,170,0.55)');
  if (talks(o, 'SNE') && Z.mouthAt) Z.mouthAt(R * 0.01, -R * 1.6, R * 0.09);
  else { ctx.beginPath(); ctx.arc(R * 0.01, -R * 1.64, R * 0.07, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke(); }
  ctx.restore();
};
// 2.11.5: Метелица — снежная ведьма: летит над землёй, подол тает в вихре снега (без «платформы»), длинные волосы-вьюга
// развеваются за спиной, широкие рукава, ледяная корона с бликом, холодное свечение. Точки крепления прежние (голова, рот, звезда, рука).
D.metelitsa = function (x, y, R, o) {
  var ctx = c(); o = o || {}; var l = Math.max(1.5, R * 0.09), t = Z.time, dir = o.dir || 1, fy = Math.sin(t * 2) * R * 0.06;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.globalAlpha *= 0.22; D.ell(0, R * 0.02, R * 0.55 - fy, R * 0.12, '#1b2448'); ctx.globalAlpha /= 0.22;   // тень на снегу — она парит
  ctx.translate(0, -R * 0.12 + fy);
  // холодное сияние
  var ga = ctx.createRadialGradient(0, -R * 1.2, R * 0.2, 0, -R * 1.2, R * 1.6); ga.addColorStop(0, 'rgba(160,220,255,0.35)'); ga.addColorStop(1, 'rgba(160,220,255,0)'); ctx.fillStyle = ga; ctx.fillRect(-R * 1.7, -R * 2.9, R * 3.4, R * 3.2);
  // волосы-вьюга за спиной: одна пышная волна с тремя прядями-завитками
  var hw = Math.sin(t * 2.4) * R * 0.08, hw2 = Math.sin(t * 2.4 + 1.2) * R * 0.1;
  ctx.beginPath(); ctx.moveTo(R * 0.05, -R * 2.12);
  ctx.bezierCurveTo(-R * 0.55, -R * 2.25, -R * 0.95 + hw, -R * 1.9, -R * 1.05 + hw2, -R * 1.35);
  ctx.quadraticCurveTo(-R * 1.12 + hw2, -R * 1.0, -R * 0.92 + hw, -R * 0.82);
  ctx.quadraticCurveTo(-R * 0.86 + hw, -R * 1.05, -R * 0.74 + hw, -R * 1.02);
  ctx.quadraticCurveTo(-R * 0.72 + hw, -R * 0.8, -R * 0.52 + hw2 * 0.5, -R * 0.68);
  ctx.quadraticCurveTo(-R * 0.55, -R * 0.95, -R * 0.42, -R * 1.05);
  ctx.quadraticCurveTo(-R * 0.36, -R * 1.3, -R * 0.2, -R * 1.5); ctx.closePath();
  var gh = ctx.createLinearGradient(0, -R * 2.2, -R * 1.0, -R * 0.8); gh.addColorStop(0, '#ffffff'); gh.addColorStop(0.6, '#dfe6ff'); gh.addColorStop(1, '#b6c4f2');
  ctx.fillStyle = gh; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  ctx.strokeStyle = 'rgba(140,160,220,0.7)'; ctx.lineWidth = l * 0.5;
  ctx.beginPath(); ctx.moveTo(-R * 0.3, -R * 1.95); ctx.quadraticCurveTo(-R * 0.8 + hw, -R * 1.7, -R * 0.88 + hw, -R * 1.05); ctx.moveTo(-R * 0.25, -R * 1.75); ctx.quadraticCurveTo(-R * 0.6 + hw, -R * 1.5, -R * 0.6 + hw2 * 0.5, -R * 0.85); ctx.stroke();
  // вихрь снега вместо подола
  for (var w = 0; w < 4; w++) {
    var ph = t * 3 + w * 1.6, sx = (w - 1.5) * R * 0.22;
    ctx.beginPath(); ctx.moveTo(sx - R * 0.16, -R * 0.55); ctx.quadraticCurveTo(sx + Math.sin(ph) * R * 0.25, -R * 0.2, sx + Math.sin(ph + 1) * R * 0.3 - R * 0.05, R * 0.04 + w % 2 * R * 0.05); ctx.quadraticCurveTo(sx + Math.sin(ph) * R * 0.1, -R * 0.25, sx + R * 0.16, -R * 0.55); ctx.closePath();
    ctx.fillStyle = 'rgba(220,240,255,' + (0.55 - w * 0.06) + ')'; ctx.fill();
  }
  // платье: от тёмно-синего к ледяному, тает книзу
  var dress = function () { ctx.beginPath(); ctx.moveTo(-R * 0.26, -R * 1.5); ctx.quadraticCurveTo(-R * 0.62, -R * 0.9, -R * 0.62 + Math.sin(t * 2.6) * R * 0.05, -R * 0.42);
    for (var i = 0; i <= 8; i++) { var xx = -R * 0.62 + i * R * 0.155, yy = -R * 0.42 + (i % 2 ? R * 0.16 : 0) + Math.sin(t * 4 + i) * R * 0.035; ctx.lineTo(xx, yy); }
    ctx.quadraticCurveTo(R * 0.6, -R * 0.9, R * 0.26, -R * 1.5); ctx.closePath(); };
  dress(); var gd = ctx.createLinearGradient(0, -R * 1.5, 0, -R * 0.3); gd.addColorStop(0, '#3b3fa0'); gd.addColorStop(0.55, '#4f7fd8'); gd.addColorStop(1, 'rgba(170,225,255,0.55)'); ctx.fillStyle = gd; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  ctx.save(); dress(); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = l * 0.5; for (var cr = 0; cr < 3; cr++) { ctx.beginPath(); ctx.moveTo(-R * 0.4 + cr * R * 0.4, -R * 1.45); ctx.quadraticCurveTo(-R * 0.3 + cr * R * 0.4, -R * 1.0, -R * 0.45 + cr * R * 0.45, -R * 0.4); ctx.stroke(); }
  D.flake(-R * 0.22, -R * 0.82, R * 0.09, 'rgba(255,255,255,0.85)', l * 0.4); D.flake(R * 0.2, -R * 1.02, R * 0.08, 'rgba(255,255,255,0.85)', l * 0.4); D.flake(R * 0.02, -R * 0.6, R * 0.07, 'rgba(255,255,255,0.7)', l * 0.4);
  ctx.restore();
  // пояс с кристаллом
  ctx.beginPath(); ctx.moveTo(-R * 0.4, -R * 1.12); ctx.quadraticCurveTo(0, -R * 1.04, R * 0.4, -R * 1.12); ctx.lineWidth = l * 1.4; ctx.strokeStyle = '#bfefff'; ctx.stroke();
  D.poly([0, -R * 1.2, R * 0.07, -R * 1.08, 0, -R * 0.96, -R * 0.07, -R * 1.08], '#7fdcff', l * 0.5);
  // широкий рукав сзади
  ctx.save(); ctx.translate(-R * 0.3, -R * 1.38); ctx.rotate(-0.5 + Math.sin(t * 2) * 0.08); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-R * 0.35, R * 0.2, -R * 0.42, R * 0.55); ctx.lineTo(-R * 0.08, R * 0.5); ctx.closePath(); ctx.fillStyle = grad(ctx, 0, 0, 0, R * 0.55, '#4a55b8', 'rgba(150,210,255,0.7)'); ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke(); D.circ(-R * 0.26, R * 0.5, R * 0.07, '#dfefff', l * 0.5); ctx.restore();
  // рука вперёд (кости рига в мультиках) — тоже широкий рукав
  if (D.rig) D.rigArm('f', R * 0.3, -R * 1.42, D.rig.f.a, D.rig.f.e, R * 0.4, R * 0.38, R * 0.24, '#4a55b8', l * 0.8, '#e8eefb', R * 0.08, null);
  else if (!D.armOff) { ctx.save(); ctx.translate(R * 0.3, -R * 1.38); ctx.rotate(0.35 + Math.sin(t * 2 + 1) * 0.08); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(R * 0.32, R * 0.22, R * 0.4, R * 0.55); ctx.lineTo(R * 0.06, R * 0.5); ctx.closePath(); ctx.fillStyle = grad(ctx, 0, 0, 0, R * 0.55, '#4a55b8', 'rgba(150,210,255,0.7)'); ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke(); D.circ(R * 0.24, R * 0.5, R * 0.07, '#dfefff', l * 0.5); ctx.restore(); }
  // ворот-иней
  D.ell(0, -R * 1.5, R * 0.3, R * 0.09, '#eef8ff', l * 0.7);
  // голова
  D.circ(0, -R * 1.8, R * 0.3, grad(ctx, 0, -R * 2.1, 0, -R * 1.5, '#eaf3ff', '#bcd2f4'), l);
  // чёлка-сосульки
  ctx.beginPath(); ctx.moveTo(-R * 0.3, -R * 1.82); ctx.quadraticCurveTo(-R * 0.28, -R * 2.12, 0, -R * 2.12); ctx.quadraticCurveTo(R * 0.28, -R * 2.12, R * 0.3, -R * 1.82); ctx.lineTo(R * 0.2, -R * 1.92); ctx.lineTo(R * 0.12, -R * 1.86); ctx.lineTo(R * 0.03, -R * 1.95); ctx.lineTo(-R * 0.08, -R * 1.87); ctx.lineTo(-R * 0.17, -R * 1.94); ctx.closePath();
  ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
  // лицо: светящиеся глаза, ресницы, строгие брови, иней на щеках
  var eg = 0.75 + 0.25 * Math.sin(t * 5);
  var mbl = D.blinkNow();
  [-1, 1].forEach(function (sd) { var ex = sd * R * 0.11; if (mbl) { ctx.strokeStyle = OL; ctx.lineWidth = l * 0.7; ctx.beginPath(); ctx.arc(ex, -R * 1.79, R * 0.05, 0.3, Math.PI - 0.3); ctx.stroke(); ctx.lineWidth = l * 0.9; ctx.beginPath(); ctx.moveTo(ex - sd * R * 0.06, -R * 1.865); ctx.lineTo(ex + sd * R * 0.07, -R * 1.9); ctx.stroke(); return; } D.ell(ex, -R * 1.78, R * 0.055, R * 0.065, '#ffffff', l * 0.4); ctx.globalAlpha *= eg; D.circ(ex + R * 0.008, -R * 1.775, R * 0.038, '#3fb6ff'); ctx.globalAlpha /= eg; D.circ(ex + R * 0.02, -R * 1.79, R * 0.012, '#fff');
    ctx.strokeStyle = OL; ctx.lineWidth = l * 0.6; ctx.beginPath(); ctx.moveTo(ex + sd * R * 0.05, -R * 1.82); ctx.lineTo(ex + sd * R * 0.085, -R * 1.85); ctx.stroke();
    ctx.lineWidth = l * 0.9; ctx.beginPath(); ctx.moveTo(ex - sd * R * 0.06, -R * 1.865); ctx.lineTo(ex + sd * R * 0.07, -R * 1.9); ctx.stroke(); });
  ctx.globalAlpha *= 0.5; D.circ(-R * 0.18, -R * 1.68, R * 0.05, '#9fd8ff'); D.circ(R * 0.18, -R * 1.68, R * 0.05, '#9fd8ff'); ctx.globalAlpha /= 0.5;
  if (talks(o, 'MET') && Z.mouthAt) Z.mouthAt(0, -R * 1.62, R * 0.11);
  else { ctx.beginPath(); ctx.moveTo(-R * 0.07, -R * 1.63); ctx.quadraticCurveTo(0, -R * 1.67, R * 0.08, -R * 1.62); ctx.lineWidth = l * 0.7; ctx.strokeStyle = '#3a4a9a'; ctx.stroke(); }
  // корона из сосулек с бликом
  var cp = [-R * 0.3, -R * 2.04, -R * 0.26, -R * 2.36, -R * 0.15, -R * 2.12, -R * 0.08, -R * 2.48, 0, -R * 2.15, R * 0.08, -R * 2.58, R * 0.16, -R * 2.14, R * 0.26, -R * 2.4, R * 0.3, -R * 2.04];
  D.poly(cp, grad(ctx, 0, -R * 2.58, 0, -R * 2.04, '#ffffff', '#7fd0ff'), l * 0.8);
  var gl = (t * 0.7) % 2; if (gl < 1) { ctx.save(); ctx.globalAlpha *= 1 - Math.abs(gl - 0.5) * 2; D.star(R * 0.08 - R * 0.3 + gl * R * 0.6, -R * 2.3, R * 0.07, '#ffffff'); ctx.restore(); }
  D.circ(R * 0.08, -R * 2.1, R * 0.04, '#7fdcff', l * 0.4);
  // снежинки вокруг
  for (var sn = 0; sn < 8; sn++) { var a = t * 1.6 + sn * 0.78, rr = R * (0.85 + (sn % 3) * 0.18); ctx.globalAlpha *= 0.75; D.flake(Math.cos(a) * rr, -R * 1.15 + Math.sin(a) * rr * 0.55, R * 0.05, '#ffffff', l * 0.3); ctx.globalAlpha /= 0.75; }
  D.flake(-R * 0.72, -R * 1.72, R * 0.16, '#bfefff', l * 0.8);
  if (o.star) { ctx.globalAlpha *= 0.5; D.circ(-R * 0.75, -R * 1.75, R * 0.35, '#fff3b0'); ctx.globalAlpha /= 0.5; D.star(-R * 0.75, -R * 1.75, R * 0.22, COL.gold, l); }
  ctx.restore();
};
D.bigTree = function (x, y, h, t, o) {
  var ctx = c(); o = o || {}; var l = Math.max(1.5, h * 0.025), w = h * 0.72;
  var glow = ctx.createRadialGradient(x, y - h * 0.45, h * 0.05, x, y - h * 0.45, h * 0.75);
  glow.addColorStop(0, 'rgba(255,230,150,' + (o.dim ? 0.12 : 0.45) + ')'); glow.addColorStop(1, 'rgba(255,230,150,0)');
  ctx.fillStyle = glow; ctx.fillRect(x - h, y - h * 1.3, h * 2, h * 1.6);
  ctx.fillStyle = COL.woodD; ctx.fillRect(x - h * 0.05, y - h * 0.12, h * 0.1, h * 0.12);
  for (var i = 0; i < 4; i++) {
    var yy = y - h * 0.1 - i * h * 0.2, tw = w * (1 - i * 0.2);
    D.poly([x - tw / 2, yy, x, yy - h * 0.34, x + tw / 2, yy], i % 2 ? COL.green : '#269058', l);
    ctx.beginPath(); ctx.moveTo(x - tw * 0.42, yy - h * 0.01); ctx.quadraticCurveTo(x, yy - h * 0.06, x + tw * 0.42, yy - h * 0.01); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = l * 1.3; ctx.stroke();
    var n = 5 - i; for (var k = 0; k < n; k++) { if (o.lost && (k * 7 + i * 3) % 6 < o.lost) continue; var f = (k + 0.5) / n, cols = ['#ff5a5f', '#ffd54a', '#5ac8ff', '#9dff6a', '#ff8fd6'], on = o.dim ? Math.sin(t * 9 + k) > 0.6 : Math.sin(t * 3 + k * 1.7 + i) > -0.4; var lx = x - tw * 0.38 + tw * 0.76 * f, ly = yy - h * 0.05; if (on) { ctx.globalAlpha = 0.35; D.circ(lx, ly, h * 0.03, cols[(k + i) % 5]); ctx.globalAlpha = 1; } D.circ(lx, ly, h * 0.014, on ? cols[(k + i) % 5] : '#556', l * 0.4); }
  }
  var sy = y - h * 0.1 - 3 * h * 0.2 - h * 0.36;
  if (o.star !== false) {
    ctx.save(); ctx.translate(x, sy); ctx.rotate(Math.sin(t * 1.5) * 0.08);
    for (var r = 0; r < 8; r++) { ctx.rotate(Math.PI / 4); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 3 + r); D.poly([0, 0, -h * 0.02, -h * 0.2, h * 0.02, -h * 0.2], '#fff3b0'); }
    ctx.globalAlpha = 1; D.star(0, 0, h * 0.075, COL.gold, l); ctx.restore();
  } else { ctx.globalAlpha = 0.6; D.star(x, sy, h * 0.06, 'rgba(120,130,160,0.5)', l * 0.5); ctx.globalAlpha = 1; }
};

// ---------- сцены комиксов ----------
Z.drawScene = function (k, x, y, w, h, t) { scene(k, x, y, w, h, t); };
function scene(kind, x, y, w, h, t) {
  var ctx = c(), FAR = Z.SCP !== 'near', NEAR = Z.SCP !== 'far';   // 2.11.5: слои для параллакса (дальний — небо, горы; ближний — земля и всё на ней)
  var sky = ctx.createLinearGradient(0, y, 0, y + h);
  var pal = { night: ['#141c3d', '#34488a'], village: ['#1d2a5a', '#5a6fb0'], lake: ['#1b3a5c', '#6fb2d6'], mount: ['#1e2240', '#6a6f9e'], pole: ['#0f1530', '#3a2f7a'], storm: ['#2a2f55', '#7a86b0'], fest: ['#24104a', '#6a3fb0'] }[kind] || ['#141c3d', '#34488a'];
  sky.addColorStop(0, pal[0]); sky.addColorStop(1, pal[1]);
  if (FAR) { ctx.fillStyle = sky; ctx.fillRect(x, y, w, h); }
  if (FAR) for (var i = 0; i < 26; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.3 * Math.sin(t * 1.3 + i)).toFixed(2) + ')'; ctx.fillRect(x + (i * 97.3) % w, y + (i * 53.1) % (h * 0.5), 2, 2); }
  if (FAR && kind === 'mount') { D.poly([x, y + h * 0.75, x + w * 0.25, y + h * 0.3, x + w * 0.5, y + h * 0.75], '#8f9bc6', 2); D.poly([x + w * 0.4, y + h * 0.75, x + w * 0.7, y + h * 0.22, x + w, y + h * 0.75], '#a9b4da', 2); }
  if (FAR && kind === 'pole') { ctx.fillStyle = '#9fdcff'; for (var k = 0; k < 4; k++) { ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.moveTo(x, y + h * (0.15 + k * 0.06)); ctx.quadraticCurveTo(x + w / 2, y + h * (0.05 + k * 0.08) + Math.sin(t + k) * 10, x + w, y + h * (0.2 + k * 0.05)); ctx.lineTo(x + w, y + h * (0.24 + k * 0.05)); ctx.quadraticCurveTo(x + w / 2, y + h * (0.1 + k * 0.08), x, y + h * (0.19 + k * 0.06)); ctx.fill(); } ctx.globalAlpha = 1; }
  if (FAR && kind === 'fest') { for (var f = 0; f < 5; f++) { var fx = x + w * (0.15 + f * 0.18), fy = y + h * (0.18 + (f % 2) * 0.1), cols = ['#ff5a5f', '#ffd54a', '#5ac8ff', '#9dff6a', '#ff8fd6']; for (var q = 0; q < 12; q++) { var a = q / 12 * Math.PI * 2, d = (12 + (t * 30 + f * 7) % 30) * Z.ui.api().S; D.circ(fx + Math.cos(a) * d, fy + Math.sin(a) * d, 2.5, cols[f]); } } }
  if (FAR && kind === 'village') { D.house(x + w * 0.15, y + h * 0.8, h * 0.28, 3); D.house(x + w * 0.85, y + h * 0.82, h * 0.24, 8); D.house(x + w * 0.62, y + h * 0.76, h * 0.15, 21); }
  if (!NEAR) return;
  ctx.fillStyle = kind === 'lake' ? '#cfeaf8' : '#e8eefc';
  ctx.beginPath(); ctx.moveTo(x, y + h); for (var xx = 0; xx <= w; xx += 10) ctx.lineTo(x + xx, y + h * 0.78 - (0.5 + 0.5 * Math.sin(xx * 0.02)) * h * 0.03); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
  if (kind === 'lake') { D.ell(x + w * 0.5, y + h * 0.88, w * 0.4, h * 0.06, 'rgba(140,210,245,0.7)'); }
  if (kind === 'night' || kind === 'storm') { D.pine(x + w * 0.08, y + h * 0.85, h * 0.35, '#24804f'); D.pine(x + w * 0.93, y + h * 0.86, h * 0.3, '#24804f'); }
  if (kind === 'storm') { ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (var sn = 0; sn < 50; sn++) ctx.fillRect(x + ((sn * 71 + t * 200) % w), y + ((sn * 37 + t * 120) % h), 3, 3); }
}
// панель: фон, персонажи, реплика
Z.COMICS = {
  intro: [
    { sc: 'night', ch: [['tree', 0.5, 0.9, 0.62]], k: 'c_intro1' },
    { sc: 'storm', ch: [['tree', 0.25, 0.92, 0.5, { star: false, dim: true }], ['met', 0.7, 0.85, 0.3, { star: true }], ['rac', 0.5, 0.9, 0.12], ['rac', 0.92, 0.92, 0.1]], k: 'c_intro2', who: 'met' },
    { sc: 'night', ch: [['moroz', 0.33, 0.9, 0.3], ['sneg', 0.66, 0.9, 0.26, { dir: -1 }]], k: 'c_intro3', who: 'moroz' }
  ],
  r1: [
    { sc: 'night', ch: [['sneg', 0.35, 0.9, 0.28], ['moroz', 0.68, 0.9, 0.3, { dir: -1 }]], k: 'c_r1a', who: 'sneg' },
    { sc: 'village', ch: [['met', 0.5, 0.85, 0.3, { star: true }], ['sled', 0.2, 0.92, 0.14], ['sled', 0.85, 0.94, 0.12]], k: 'c_r1b', who: 'met' },
    { sc: 'village', ch: [['moroz', 0.5, 0.9, 0.32]], k: 'c_r1c', who: 'moroz' }
  ],
  r2: [
    { sc: 'village', ch: [['moroz', 0.3, 0.9, 0.3], ['sneg', 0.68, 0.9, 0.26, { dir: -1 }]], k: 'c_r2a', who: 'sneg' },
    { sc: 'lake', ch: [['met', 0.5, 0.82, 0.32, { star: true }], ['crow', 0.2, 0.55, 0.14], ['crow', 0.82, 0.5, 0.12]], k: 'c_r2b', who: 'met' }
  ],
  r3: [
    { sc: 'lake', ch: [['moroz', 0.3, 0.9, 0.3], ['sneg', 0.68, 0.9, 0.26, { dir: -1 }]], k: 'c_r3a', who: 'moroz' },
    { sc: 'mount', ch: [['met', 0.62, 0.8, 0.3, { star: true }], ['plow', 0.25, 0.94, 0.16]], k: 'c_r3b', who: 'met' }
  ],
  r4: [
    { sc: 'mount', ch: [['sneg', 0.35, 0.9, 0.28], ['moroz', 0.68, 0.9, 0.3, { dir: -1 }]], k: 'c_r4a', who: 'sneg' },
    { sc: 'pole', ch: [['met', 0.5, 0.82, 0.34, { star: true }]], k: 'c_r4b', who: 'met' }
  ],
  finale: [
    { sc: 'pole', ch: [['met', 0.7, 0.88, 0.26, { dir: -1 }], ['moroz', 0.3, 0.9, 0.32]], k: 'c_fin1', who: 'moroz' },
    { sc: 'fest', ch: [['tree', 0.5, 0.92, 0.55], ['moroz', 0.2, 0.92, 0.26], ['sneg', 0.82, 0.92, 0.24, { dir: -1 }]], k: 'c_fin2', who: 'sneg' }
  ]
};
Z.COMIC_AFTER = { 6: 'r1', 13: 'r2', 20: 'r3', 27: 'r4', 34: 'finale' };
Z.TXT.ru.c_intro1 = 'Канун Нового года. Главная ёлка сияет, а под ней — подарки для всех детей.';
Z.TXT.ru.c_intro2 = 'Метелица: «Ха-ха! Без Звезды Новый год не наступит! Еноты, тащите подарки!»';
Z.TXT.ru.c_intro3 = 'Дед Мороз: «Не бывать этому! Защитим ёлку, а потом вернём Звезду! Снеговики, к бою!»';
Z.TXT.ru.c_r1a = 'Снегурочка: «Великан повержен! Но Метелица со Звездой умчалась в Деревню.»';
Z.TXT.ru.c_r1b = 'Метелица: «Деревенские подарки тоже мои! Еноты, на снегоходы!»';
Z.TXT.ru.c_r1c = 'Дед Мороз: «В путь, в Деревню! Без Звезды не вернёмся.»';
Z.TXT.ru.c_r2a = 'Снегурочка: «Смотри, следы ведут к Ледяному озеру!»';
Z.TXT.ru.c_r2b = 'Метелица: «Мои вороны поднимут вас на смех! Озеро вам не перейти!»';
Z.TXT.ru.c_r3a = 'Дед Мороз: «Озеро позади. Впереди Горы — там её снегоуборщики.»';
Z.TXT.ru.c_r3b = 'Метелица: «Мои машины сметут вас с перевала!»';
Z.TXT.ru.c_r4a = 'Снегурочка: «Вот он, Северный полюс! Её замок совсем близко.»';
Z.TXT.ru.c_r4b = 'Метелица: «Это мой полюс! Звезду вы не получите никогда!»';
Z.TXT.ru.c_fin1 = 'Дед Мороз: «Всё кончено, Метелица. Верни Звезду — и приходи на праздник.»';
Z.TXT.ru.c_fin2 = 'Звезда снова на ёлке! С Новым годом! А в Бесконечной ночи тебя ждут новые волны.';
Z.TXT.en.c_intro1 = 'New Year\'s Eve. The great tree is shining, with gifts for every child beneath it.';
Z.TXT.en.c_intro2 = 'Blizzard Witch: "Ha-ha! Without the Star, New Year will never come! Raccoons, grab the gifts!"';
Z.TXT.en.c_intro3 = 'Grandfather Frost: "Not on my watch! We will defend the tree and bring the Star back! Snowmen, to arms!"';
Z.TXT.en.c_r1a = 'Snow Maiden: "The giant is down! But the Witch fled to the Village with the Star."';
Z.TXT.en.c_r1b = 'Blizzard Witch: "The village gifts are mine too! Raccoons, to the snowmobiles!"';
Z.TXT.en.c_r1c = 'Grandfather Frost: "To the Village! We won\'t return without the Star."';
Z.TXT.en.c_r2a = 'Snow Maiden: "Look, the tracks lead to the Frozen Lake!"';
Z.TXT.en.c_r2b = 'Blizzard Witch: "My crows will laugh you off the ice! You will never cross the lake!"';
Z.TXT.en.c_r3a = 'Grandfather Frost: "The lake is behind us. Ahead are the Mountains and her snowplows."';
Z.TXT.en.c_r3b = 'Blizzard Witch: "My machines will sweep you off the pass!"';
Z.TXT.en.c_r4a = 'Snow Maiden: "There it is, the North Pole! Her castle is close."';
Z.TXT.en.c_r4b = 'Blizzard Witch: "This is my pole! You will never get the Star!"';
Z.TXT.en.c_fin1 = 'Grandfather Frost: "It\'s over, Witch. Give back the Star and come to the party."';
Z.TXT.en.c_fin2 = 'The Star is back on the tree! Happy New Year! New waves await in the Endless Night.';
Z.TXT.ru.skip = 'Пропустить'; Z.TXT.en.skip = 'Skip';
Z.TXT.ru.next = 'Дальше'; Z.TXT.en.next = 'Next';

Z.drawComic = function (m) {
  var A = Z.ui.api(), ctx = c(), S = A.S, W = A.W, H = A.H, t = Z.time;
  var pages = Z.COMICS[m.id], p = pages[m.page];
  if (p.v && m.vp !== m.page && Z.playLine) { m.vp = m.page; Z.playLine(p.v); }   // озвучка сцены уровня
  ctx.fillStyle = 'rgba(8,12,30,0.85)'; ctx.fillRect(0, 0, W, H);
  var w = Math.min(W * 0.94, 560 * S), h = Math.min(H * 0.56, w * 0.75), x = (W - w) / 2, y = Math.max(20 * S, (H - h) / 2 - 70 * S);
  var k = Math.min(1, m.t * 4);
  ctx.save(); ctx.translate(W / 2, y + h / 2); ctx.scale(0.92 + 0.08 * k, 0.92 + 0.08 * k); ctx.translate(-W / 2, -y - h / 2); ctx.globalAlpha = k;
  ctx.save(); D.rr(x, y, w, h, 16 * S); ctx.clip();
  scene(p.sc, x, y, w, h, t);
  // сцена живая: медленный наезд камеры, герои входят по очереди, дышат, говорящий шевелит ртом, враги подпрыгивают
  var spk = p.v && Z.VL[p.v] ? Z.VL[p.v][0] : null, tk = Z.talkKey ? Z.talkKey() : null, talking = !!spk && (tk === spk || (!tk && m.t > 0.5 && m.t < 3.5));
  var zm = 1 + 0.045 * Math.min(1, m.t / 9); ctx.translate(x + w / 2, y + h * 0.7); ctx.scale(zm, zm); ctx.translate(-x - w / 2, -y - h * 0.7);
  var ez = function (v) { v = Math.max(0, Math.min(1, v)); return 1 - Math.pow(1 - v, 3); };
  p.ch.forEach(function (q, k) {
    var cx = x + q[1] * w, cy = y + q[2] * h, R = q[3] * h;
    if (q[0] === 'tree') { D.bigTree(cx, cy, R * 1.6, t, q[4]); return; }
    var en = ez((m.t - 0.1 - k * 0.22) / 0.6), side = q[1] < 0.5 ? -1 : 1, isE = !(q[0] === 'moroz' || q[0] === 'sneg' || q[0] === 'met' || q[0].indexOf('a:') === 0);
    if (en <= 0) return;
    cx += (1 - en) * side * w * 0.55;
    var me = k === 0 && talking, ph = t * 2 + k * 1.7, dy = 0, syy = 1 + Math.sin(ph) * 0.016, sxx = 1 - Math.sin(ph) * 0.008, rot = Math.sin(t * 1.3 + k * 2.1) * 0.02;
    // всё тело качается от ног; подскок врага — через его собственную походку, чтобы тень оставалась на снегу
    if (me) { syy *= 1 + Math.abs(Math.sin(t * 9)) * 0.03; rot += Math.sin(t * 4.5) * 0.03; }
    var hopW = 0; if (isE && en >= 1) { var hp = (t * 0.42 + k * 0.37) % 1; if (hp < 0.14) { var u = hp / 0.14; hopW = u * Math.PI; syy *= 1 + Math.sin(u * Math.PI) * 0.05; } }
    if (q[0] === 'met') { var fl = R * 0.06 + Math.sin(t * 2.2) * R * 0.03; D.ell(cx, cy + R * 0.02, R * 0.2 * (1 - fl / R), R * 0.045, 'rgba(20,30,60,0.28)'); dy = fl; }
    var walking = en < 1;
    ctx.save(); ctx.translate(cx, cy - dy); ctx.rotate(rot); ctx.scale(sxx, syy); ctx.translate(-cx, -cy);
    var o4 = Object.assign({}, q[4] || {}); if (walking) o4.walk = true;
    o4.talk = me; o4.noTalk = !me;
    if (q[0] === 'moroz') D.moroz(cx, cy, R * 0.45, o4);
    else if (q[0] === 'sneg') D.snegurochka(cx, cy, R * 0.45, o4);
    else if (q[0] === 'met') D.metelitsa(cx, cy, R * 0.45, o4);
    else if (q[0].indexOf('a:') === 0) D.ally(q[0].slice(2), cx, cy, R * 0.45, Object.assign({ dir: q[1] > 0.5 ? -1 : 1, walk: walking, noTalk: true }, q[4] || {}));   // герой
    else { var map = { rac: 'raccoon', sled: 'sled', crow: 'crow', plow: 'plow' }, et = q[0].indexOf('e:') === 0 ? q[0].slice(2) : map[q[0]], fk = { type: et, size: Math.min(1.2, (Z.ENEMIES[et] && Z.ENEMIES[et].size) || 1), dir: q[1] > 0.5 ? -1 : 1, walk: walking ? t * 8 : hopW, ph: k * 3.1, hitT: 0, slow: 0, hp: 1, max: 1, air: q[0] === 'crow' || !!(Z.ENEMIES[et] && Z.ENEMIES[et].air) }; D.enemy(fk, cx, cy, R * 1.3, t); }
    ctx.restore();
  });
  ctx.restore();
  D.rr(x, y, w, h, 16 * S); ctx.lineWidth = 4 * S; ctx.strokeStyle = OL; ctx.stroke();
  // облачко текста
  var txt = Z.T(p.k), lines = D.wrap(txt, w - 40 * S, 17 * S), bh = lines.length * 22 * S + 24 * S, by = y + h + 12 * S;
  D.rr(x, by, w, bh, 16 * S); ctx.fillStyle = COL.panel; ctx.fill(); ctx.lineWidth = 3 * S; ctx.strokeStyle = OL; ctx.stroke();
  for (var i = 0; i < lines.length; i++) D.text(lines[i], x + w / 2, by + 22 * S + i * 22 * S, 17 * S, OL);
  ctx.restore();
  var bw = Math.min(200 * S, w * 0.45), bhh = 52 * S, yy = Math.min(H - bhh - 10 * S, by + bh + 14 * S);
  A.button('cnext', x + w - bw, yy, bw, bhh, { modal: true, c1: '#ff8a3d', c2: '#d4602a', pulse: true, label: Z.T('next'), fn: function () {
    if (m.page < pages.length - 1) { m.page++; m.t = 0; Z.AU.sfx('select', 0.6); } else { if (Z.stopLine) Z.stopLine(); Z.save.seen['comic_' + m.id] = 1; Z.persist(); Z.ui.closeModal(); if (m.then) m.then(); }
  } });
  A.button('cskip', x, yy, bw * 0.8, bhh, { modal: true, c1: '#5f74b8', c2: '#43579a', label: Z.T('skip'), px: 16 * S, fn: function () { if (Z.stopLine) Z.stopLine(); Z.save.seen['comic_' + m.id] = 1; Z.persist(); Z.ui.closeModal(); if (m.then) m.then(); } });
  for (var d = 0; d < pages.length; d++) D.circ(W / 2 - (pages.length - 1) * 9 * S + d * 18 * S, yy + bhh / 2, 5 * S, d === m.page ? COL.gold : '#5a6385');
};
Z.showComic = function (id, then) {
  if (!Z.COMICS[id] || Z.save.seen['comic_' + id]) { if (then) then(); return; }
  Z.ui.openModal({ type: 'comic', id: id, page: 0, then: then });
  Z.AU.setState('comic', 0);
};

// ---------- экран загрузки ----------
Z.TXT.ru.loading = 'Загрузка оркестра…'; Z.TXT.en.loading = 'Loading the orchestra…';
Z.TXT.ru.tapStart = 'Нажми, чтобы начать'; Z.TXT.en.tapStart = 'Tap to start';
Z.drawLoading = function () {
  var A = Z.ui.api(), ctx = c(), S = A.S, W = A.W, H = A.H, t = Z.time;
  var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#141c3d'); g.addColorStop(1, '#2c3c78');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (var i = 0; i < 60; i++) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect((i * 113.7) % W, (i * 71.1 + t * (20 + i % 5 * 8)) % H, 2, 2); }
  ctx.fillStyle = '#e8eefc'; ctx.beginPath(); ctx.moveTo(0, H); for (var x = 0; x <= W; x += 20) ctx.lineTo(x, H * 0.8 - Math.sin(x * 0.01) * 14); ctx.lineTo(W, H); ctx.fill();
  var th = Math.min(H * 0.42, 330 * S);
  D.bigTree(W / 2, H * 0.8, th, t);
  var title = Z.T('title'), px = D.fitText(title, W - 40 * S, 44 * S);
  D.text(title, W / 2, H * 0.8 - th - 50 * S, px, '#ffd54a', 'center', 'middle', Math.max(4, px * 0.16));
  var AU = Z.AU, pr = AU.total ? AU.loaded / AU.total : 0, done = Z.loadDone;
  var bw = Math.min(W * 0.7, 320 * S), bx = (W - bw) / 2, by = H * 0.9;
  if (!done) {
    D.rr(bx, by, bw, 14 * S, 7 * S); ctx.fillStyle = '#2a3157'; ctx.fill();
    D.rr(bx, by, Math.max(14 * S, bw * pr), 14 * S, 7 * S); ctx.fillStyle = COL.gold; ctx.fill();
    D.rr(bx, by, bw, 14 * S, 7 * S); ctx.lineWidth = 2.5 * S; ctx.strokeStyle = OL; ctx.stroke();
    D.text(Z.T('loading') + ' ' + Math.round(pr * 100) + '%', W / 2, by - 16 * S, 15 * S, '#fff', 'center', 'middle', 3 * S);
  } else if (!Z.ui.titleAuto) {
    var a = 0.6 + 0.4 * Math.sin(t * 4);
    ctx.globalAlpha = a; D.text(Z.T('tapStart'), W / 2, by, 24 * S, '#fff', 'center', 'middle', 4 * S); ctx.globalAlpha = 1;
  }
};

// ---------- ориентиры регионов ----------
D.landmark = function (kind, x, y, cs, t) {
  var ctx = c(), l = Math.max(1.5, cs * 0.05);
  if (kind === 0) { // огромный старый пень с фонарём
    D.ell(x, y, cs * 0.9, cs * 0.3, 'rgba(30,40,80,0.2)');
    D.rr(x - cs * 0.7, y - cs * 0.9, cs * 1.4, cs * 0.9, cs * 0.15); ctx.fillStyle = COL.wood; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    D.ell(x, y - cs * 0.9, cs * 0.7, cs * 0.25, '#c7925f', l);
    D.ell(x, y - cs * 0.95, cs * 0.6, cs * 0.18, '#fff');
    for (var r = 1; r < 3; r++) { ctx.beginPath(); ctx.ellipse(x, y - cs * 0.9, cs * 0.22 * r, cs * 0.08 * r, 0, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(107,70,38,0.5)'; ctx.lineWidth = l * 0.6; ctx.stroke(); }
    ctx.strokeStyle = OL; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(x + cs * 0.35, y - cs * 1.0); ctx.lineTo(x + cs * 0.35, y - cs * 1.5); ctx.stroke();
    var g = 0.6 + 0.4 * Math.sin(t * 3); ctx.globalAlpha = 0.4 * g; D.circ(x + cs * 0.35, y - cs * 1.6, cs * 0.35, '#ffcf6b'); ctx.globalAlpha = 1;
    D.rr(x + cs * 0.25, y - cs * 1.72, cs * 0.2, cs * 0.24, 3); ctx.fillStyle = '#ffcf6b'; ctx.fill(); ctx.stroke();
  } else if (kind === 1) { // мельница
    D.rr(x - cs * 0.45, y - cs * 1.3, cs * 0.9, cs * 1.3, cs * 0.08); ctx.fillStyle = '#c7925f'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    D.poly([x - cs * 0.6, y - cs * 1.3, x, y - cs * 1.9, x + cs * 0.6, y - cs * 1.3], COL.redD, l);
    ctx.save(); ctx.translate(x, y - cs * 1.35); ctx.rotate(t * 0.8);
    for (var b = 0; b < 4; b++) { ctx.rotate(Math.PI / 2); D.rr(-cs * 0.08, -cs * 1.05, cs * 0.16, cs * 0.95, 2); ctx.fillStyle = '#f4ead8'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke(); }
    ctx.restore(); D.circ(x, y - cs * 1.35, cs * 0.1, COL.woodD, l * 0.7);
  } else if (kind === 2) { // вмёрзший корабль
    D.ell(x, y, cs * 1.1, cs * 0.3, 'rgba(140,210,245,0.8)', l * 0.6);
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12);
    ctx.beginPath(); ctx.moveTo(-cs * 1.0, -cs * 0.5); ctx.lineTo(cs * 1.0, -cs * 0.5); ctx.lineTo(cs * 0.7, 0); ctx.lineTo(-cs * 0.75, 0); ctx.closePath();
    ctx.fillStyle = COL.woodD; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = l * 1.4; ctx.beginPath(); ctx.moveTo(0, -cs * 0.5); ctx.lineTo(0, -cs * 1.8); ctx.stroke();
    D.poly([cs * 0.05, -cs * 1.7, cs * 0.75, -cs * 1.1, cs * 0.05, -cs * 0.9], '#f4ead8', l * 0.8);
    ctx.restore();
    for (var i = 0; i < 4; i++) D.poly([x - cs * 0.8 + i * cs * 0.45, y - cs * 0.48, x - cs * 0.74 + i * cs * 0.45, y - cs * 0.2, x - cs * 0.68 + i * cs * 0.45, y - cs * 0.48], COL.ice, l * 0.5);
  } else if (kind === 3) { // горный перевал с аркой
    D.poly([x - cs * 1.1, y, x - cs * 0.55, y - cs * 1.6, x, y], '#8f9bc6', l);
    D.poly([x, y, x + cs * 0.55, y - cs * 1.9, x + cs * 1.1, y], '#a9b4da', l);
    D.poly([x - cs * 0.72, y - cs * 1.15, x - cs * 0.55, y - cs * 1.6, x - cs * 0.38, y - cs * 1.15], '#fff');
    D.poly([x + cs * 0.36, y - cs * 1.35, x + cs * 0.55, y - cs * 1.9, x + cs * 0.74, y - cs * 1.35], '#fff');
    ctx.beginPath(); ctx.arc(x, y, cs * 0.35, Math.PI, 0); ctx.fillStyle = '#2a2f55'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  } else { // мастерская Деда Мороза
    D.rr(x - cs * 0.85, y - cs * 1.0, cs * 1.7, cs * 1.0, cs * 0.1); ctx.fillStyle = '#e8484f'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    D.poly([x - cs * 1.0, y - cs * 1.0, x, y - cs * 1.6, x + cs * 1.0, y - cs * 1.0], '#f6f9ff', l);
    for (var w2 = 0; w2 < 3; w2++) { D.rr(x - cs * 0.6 + w2 * cs * 0.45, y - cs * 0.75, cs * 0.28, cs * 0.3, 3); ctx.fillStyle = Math.sin(t * 2 + w2) > -0.5 ? '#ffcf6b' : '#3a4670'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.stroke(); }
    for (var s2 = 0; s2 < 5; s2++) { ctx.strokeStyle = s2 % 2 ? '#fff' : COL.red; ctx.lineWidth = cs * 0.1; ctx.beginPath(); ctx.moveTo(x + cs * 1.1, y - s2 * cs * 0.3); ctx.lineTo(x + cs * 1.1, y - s2 * cs * 0.3 - cs * 0.3); ctx.stroke(); }
    D.star(x + cs * 1.1, y - cs * 1.6, cs * 0.14, COL.gold, l * 0.6);
  }
};
})();
// ---------- сюжетные сцены перед каждым уровнем ----------
(function () {
  var Z = window.Z;
  var WHO = { S: 'sneg', M: 'moroz', W: 'met' };
  var SC = ['night', 'village', 'lake', 'mount', 'pole'];
  var FOE = ['rac', 'sled', 'crow', 'plow', 'rac'];
  var RU = [
    'S|Еноты Метелицы уже у опушки! Поставь снеговиков у дороги — защитим ёлку!',
    'S|Сосульки шныряют там, где меньше вышек. Смотри на стрелки — они покажут их путь.',
    'S|Мы с санями везём подарки в лесную сторожку. Прикрой нас!',
    'M|Я вернулся из дозора! Укажи мне, куда идти, — посохом задержу любого.',
    'W|Мои метатели разнесут ваших снеговиков в снежную пыль!',
    'S|Ещё один обоз. Ставь ловушки на дорогах — пусть еноты попляшут!',
    'W|Ледяной Великан, растопчи их крепость!',
    'S|Деревня в беде! Еноты пригнали снегоходы — им нужна ровная дорога.',
    'W|Вороны, сбрасывайте бомбы на их вышки!',
    'M|Жители ждут подарков. Довезём — и снова в бой!',
    'S|Толстяки ломают всё на своём пути. Чини вышки вовремя!',
    'W|Окружайте! Идите со всех сторон!',
    'S|Последний деревенский обоз. Дедушка, прикрой нас!',
    'W|Колесница Вьюги, вперёд! Сметите эту деревню!',
    'M|Озеро замёрзло — по льду враги скользят быстрее. Не зевай!',
    'S|Слякотники делятся надвое. Бей по площади!',
    'S|Через лёд к рыбацкой деревне — везём подарки!',
    'W|Тараны разобьют ваши баррикады в щепки!',
    'M|Метелица прячется где-то за озером. Мы уже близко.',
    'S|Ещё обоз! Рыбаки нас очень ждут.',
    'W|Великан вернулся — и он очень зол!',
    'M|Горы. Здесь её снегоуборщики: броня толстая — бей баллистой.',
    'W|Метель и камнепад — мои верные слуги!',
    'S|Горный перевал узкий. Сани пройдут, если ты прикроешь.',
    'W|Бульдозеры раздавят ваши ловушки!',
    'M|Её армия всё больше. Держи строй!',
    'S|Последний горный обоз — дальше только полюс.',
    'W|Колесница, на перевал! Не пропускать их!',
    'S|Северный полюс! Где-то здесь её ледяной замок.',
    'W|Вы замёрзнете здесь навсегда!',
    'M|Детям полюса тоже нужны подарки. Вперёд!',
    'W|Вся моя армия — против вас!',
    'S|Звезда мерцает над замком! Ещё чуть-чуть.',
    'M|Последний обоз. После него — к Метелице!',
    'W|Я сама выйду на бой! Звезду вы не получите!'
  ];
  var EN = [
    'S|The Witch\'s raccoons are at the forest edge! Put snowmen by the road — let\'s protect the tree!',
    'S|Icicles sneak where there are fewer towers. Watch the arrows — they show their path.',
    'S|We are taking gifts to the forest lodge by sleigh. Cover us!',
    'M|I\'m back from patrol! Tell me where to go and my staff will hold anyone back.',
    'W|My throwers will smash your snowmen into powder!',
    'S|Another convoy. Put traps on the roads — let the raccoons dance!',
    'W|Ice Giant, stomp their fortress flat!',
    'S|The village is in trouble! Raccoons brought snowmobiles — they need a smooth road.',
    'W|Crows, drop bombs on their towers!',
    'M|The villagers are waiting for gifts. Deliver them, then back to battle!',
    'S|Brutes smash everything in their way. Repair your towers in time!',
    'W|Surround them! Come from every side!',
    'S|The last village convoy. Grandpa, cover us!',
    'W|Blizzard Chariot, charge! Sweep this village away!',
    'M|The lake is frozen — enemies slide faster on the ice. Stay sharp!',
    'S|Slushlings split in two. Hit them with splash damage!',
    'S|Across the ice to the fishing village — gifts on board!',
    'W|My rams will smash your barricades to splinters!',
    'M|The Witch is hiding somewhere past the lake. We are close.',
    'S|Another convoy! The fishermen are waiting.',
    'W|The Giant is back — and he is furious!',
    'M|The mountains. Her snowplows are here: thick armor — use ballistas.',
    'W|Blizzard and rockfall are my loyal servants!',
    'S|The mountain pass is narrow. The sleigh will make it if you cover us.',
    'W|My bulldozers will crush your traps!',
    'M|Her army keeps growing. Hold the line!',
    'S|The last mountain convoy — only the Pole lies ahead.',
    'W|Chariot, to the pass! Let no one through!',
    'S|The North Pole! Her ice castle is somewhere here.',
    'W|You will freeze here forever!',
    'M|The children of the Pole need gifts too. Onward!',
    'W|My whole army is against you!',
    'S|The Star is shining above the castle! Almost there.',
    'M|The last convoy. After that — to the Witch!',
    'W|I will fight you myself! You will never get the Star!'
  ];
  for (var i = 0; i < RU.length; i++) {
    var p = RU[i].split('|'), e = EN[i].split('|'), r = Math.floor(i / 7), who = WHO[p[0]];
    var ch = [[who, p[0] === 'W' ? 0.62 : 0.34, 0.9, 0.3, p[0] === 'W' ? { star: true, dir: -1 } : {}]];
    if (p[0] === 'W') ch.push([FOE[r], 0.22, 0.93, 0.13]);
    else ch.push([p[0] === 'S' ? 'moroz' : 'sneg', 0.7, 0.9, 0.26, { dir: -1 }]);
    if (i === 3) ch = [['moroz', 0.5, 0.9, 0.34]];
    Z.COMICS['lv_' + i] = [{ sc: (i % 7 === 6 || p[0] === 'W') && r < 4 ? 'storm' : SC[r], ch: ch, k: 'lv_' + i, who: who }];
    Z.TXT.ru['lv_' + i] = (p[0] === 'S' ? 'Снегурочка: «' : p[0] === 'M' ? 'Дед Мороз: «' : 'Метелица: «') + p[1] + '»';
    Z.TXT.en['lv_' + i] = (e[0] === 'S' ? 'Snow Maiden: "' : e[0] === 'M' ? 'Grandfather Frost: "' : 'Blizzard Witch: "') + e[1] + '"';
  }
  var REGION_COMIC = { 1: 'r1', 2: 'r2', 3: 'r3', 4: 'r4' };
  // перед уровнем: комикс начала региона (если ещё не видел) и сцена уровня
  Z.showStory = function (idx) {
    var info = Z.LEVELS[idx]; if (!info) return;
    if (info.k === 0 && REGION_COMIC[info.region]) Z.showComic(REGION_COMIC[info.region]);
    if (idx === 0) Z.showComic('intro');
    Z.showComic('lv_' + idx);
  };
})();
// ---------- АНИМАЦИОННЫЕ РОЛИКИ ----------
(function () {
  var Z = window.Z, D = Z.D, OL = D.OL, COL = D.COL;
  function c() { return D.ctx; }
  // актёр: k — кто, путь (x0,y0)→(x1,y1) в долях сцены, s — рост в долях высоты, an — анимация, d — направление
  function A(k, x0, y0, x1, y1, s, an, d, o) { return { k: k, x0: x0, y0: y0, x1: x1 === undefined ? x0 : x1, y1: y1 === undefined ? y0 : y1, s: s, an: an || '', d: d || 1, o: o || {} }; }
  var CUTS = {
    intro: [
      { d: 5, sc: 'night', cam: [1, 1.15, 0.5, 0.5], a: [A('tree', 0.5, 0.86, 0.5, 0.86, 0.6), A('gifts', 0.5, 0.88, 0.5, 0.88, 0.25), A('sneg', -0.1, 0.9, 0.3, 0.9, 0.2, 'walk'), A('moroz', -0.25, 0.9, 0.18, 0.9, 0.24, 'walk')], line: ['S', 'k_i1'] },
      { d: 4.5, sc: 'storm', cam: [1.2, 1, 0.6, 0.5], a: [A('met', 1.2, 0.6, 0.68, 0.72, 0.36, 'fly', -1), A('tree', 0.2, 0.9, 0.2, 0.9, 0.45, 'shake')], fx: [[0.3, 'snow', 0.7, 0.5], [1.5, 'flash', 0.5, 0.5], [2.4, 'snow', 0.5, 0.4]], line: ['W', 'k_i2'] },
      { d: 4.5, sc: 'storm', cam: [1, 1.1, 0.5, 0.55], a: [A('rac', 1.1, 0.9, 0.3, 0.9, 0.16, 'walk', -1), A('rac', 1.3, 0.92, 0.45, 0.92, 0.15, 'walk', -1), A('thrower', 1.45, 0.88, 0.6, 0.88, 0.15, 'walk', -1), A('crow', 1.2, 0.35, -0.2, 0.3, 0.12, 'fly', -1), A('sled', 1.6, 0.94, 0.75, 0.94, 0.17, 'walk', -1)], line: ['W', 'k_i3'] },
      { d: 4, sc: 'night', cam: [1.4, 1.6, 0.45, 0.62], a: [A('moroz', 0.45, 0.92, 0.45, 0.92, 0.42, 'staff')], fx: [[1.2, 'flash', 0.55, 0.3], [1.3, 'stars', 0.55, 0.35]], line: ['M', 'k_i4'] },
      { d: 4.5, sc: 'night', cam: [1, 1.05, 0.5, 0.5], a: [A('fort', 0.5, 0.9, 0.5, 0.9, 0.3), A('moroz', 0.18, 0.92, 0.22, 0.92, 0.22), A('sneg', 0.82, 0.92, 0.78, 0.92, 0.19, '', -1)], line: ['S', 'k_i5'] }
    ],
    r1: [
      { d: 4, sc: 'night', cam: [1.1, 1.3, 0.5, 0.6], a: [A('giant', 0.55, 0.92, 0.55, 0.92, 0.5, 'fall')], fx: [[1.6, 'boom', 0.55, 0.8], [1.7, 'shake', 0, 0], [2, 'snow', 0.55, 0.85]], line: ['M', 'k_r1a'] },
      { d: 4, sc: 'storm', cam: [1, 1, 0.5, 0.5], a: [A('met', 0.5, 0.6, 1.3, 0.3, 0.32, 'fly')], line: ['W', 'k_r1b'] },
      { d: 4, sc: 'village', cam: [1, 1.1, 0.4, 0.5], a: [A('sleigh', -0.3, 0.88, 0.6, 0.88, 0.2, 'walk')], line: ['S', 'k_r1c'] }
    ],
    r2: [
      { d: 4, sc: 'village', cam: [1.1, 1.25, 0.5, 0.6], a: [A('chariot', 0.2, 0.9, 0.55, 0.9, 0.24, 'boom')], fx: [[1.8, 'boom', 0.55, 0.8], [1.9, 'shake', 0, 0], [2.0, 'wheel', 0.55, 0.88]], line: ['S', 'k_r2a'] },
      { d: 4, sc: 'village', cam: [1, 1, 0.5, 0.5], a: [A('moroz', 0.3, 0.92, 0.35, 0.92, 0.24), A('sneg', 0.7, 0.92, 0.65, 0.92, 0.2, '', -1), A('gifts', 0.5, 0.92, 0.5, 0.92, 0.2)], fx: [[0.5, 'fest', 0.5, 0.3]], line: ['M', 'k_r2b'] },
      { d: 3.5, sc: 'lake', cam: [1, 1.1, 0.5, 0.5], a: [A('met', 0.8, 0.55, 0.75, 0.6, 0.3, 'fly', -1)], line: ['W', 'k_r2c'] }
    ],
    r3: [
      { d: 4, sc: 'lake', cam: [1.1, 1.3, 0.5, 0.65], a: [A('giant', 0.5, 0.9, 0.5, 1.15, 0.48, 'sink')], fx: [[0.8, 'crack', 0.5, 0.88], [1.5, 'snow', 0.5, 0.85], [1.6, 'shake', 0, 0]], line: ['S', 'k_r3a'] },
      { d: 4, sc: 'mount', cam: [1, 1.15, 0.5, 0.45], a: [A('sleigh', -0.3, 0.9, 0.45, 0.8, 0.18, 'walk')], line: ['M', 'k_r3b'] }
    ],
    r4: [
      { d: 4, sc: 'mount', cam: [1.1, 1.3, 0.5, 0.6], a: [A('chariot', 0.8, 0.88, 0.45, 0.9, 0.24, 'boom', -1)], fx: [[1.6, 'boom', 0.45, 0.8], [1.7, 'shake', 0, 0], [1.9, 'boom', 0.55, 0.75], [2.1, 'snow', 0.5, 0.7]], line: ['M', 'k_r4a'] },
      { d: 4, sc: 'pole', cam: [1, 1.1, 0.5, 0.45], a: [A('met', 0.5, 0.55, 0.5, 0.5, 0.42, 'fly')], fx: [[0.6, 'snow', 0.5, 0.5], [2, 'flash', 0.5, 0.4]], line: ['W', 'k_r4b'] }
    ],
    finale: [
      { d: 4.5, sc: 'pole', cam: [1.2, 1.4, 0.5, 0.55], a: [A('met', 0.5, 0.65, 0.5, 0.65, 0.42, 'defeat')], fx: [[1.2, 'flash', 0.5, 0.5], [1.3, 'stars', 0.5, 0.5], [2.4, 'snow', 0.5, 0.6], [2.5, 'shake', 0, 0]], line: ['W', 'k_f1'] },
      { d: 4.5, sc: 'pole', cam: [1, 1.1, 0.5, 0.4], a: [A('star', 0.5, 0.7, 0.5, 0.2, 0.12, 'rise'), A('moroz', 0.25, 0.92, 0.3, 0.92, 0.24), A('sneg', 0.75, 0.92, 0.7, 0.92, 0.2, '', -1)], fx: [[3.2, 'flash', 0.5, 0.2]], line: ['M', 'k_f2'] },
      { d: 6, sc: 'fest', cam: [1, 1.12, 0.5, 0.55], a: [A('tree', 0.5, 0.86, 0.5, 0.86, 0.6), A('gifts', 0.5, 0.88, 0.5, 0.88, 0.27), A('moroz', 0.2, 0.92, 0.2, 0.92, 0.24, 'bounce'), A('sneg', 0.8, 0.92, 0.8, 0.92, 0.2, 'bounce', -1), A('rac', 0.65, 0.95, 0.62, 0.95, 0.12, 'bounce', -1)], fx: [[0.2, 'fest', 0.5, 0.3]], line: ['S', 'k_f3'] }
    ]
  };
  Z.CUTS = CUTS;
  var RU = { k_i1: 'Канун Нового года! Скорее, украсим главную ёлку — дети ждут подарков!', k_i2: 'Ха-ха-ха! Не будет вам праздника! Звезду я заберу себе!', k_i3: 'Еноты, вперёд! Тащите все подарки! Вороны — крушите их вышки!',
    k_i4: 'Не бывать этому! Посох со мной — защитим ёлку!', k_i5: 'Строим оборону! Враги уже идут по лесным дорогам.',
    k_r1a: 'Ледяной Великан повержен! Лес снова наш.', k_r1b: 'Это только начало! В деревне вас ждёт моя Колесница!', k_r1c: 'Скорее в деревню — там тоже ждут подарков!',
    k_r2a: 'Колесница разбита! Деревня спасена!', k_r2b: 'Праздник продолжается! Но Метелица ушла к озеру.', k_r2c: 'Озеро заморозит вас навсегда!',
    k_r3a: 'Великан провалился под лёд! Путь в горы открыт.', k_r3b: 'Вперёд, к перевалу! Полюс уже близко.',
    k_r4a: 'Колесница сорвалась с перевала! Остался только полюс.', k_r4b: 'На полюсе мои владения! Здесь вам конец!',
    k_f1: 'Не-е-ет! Моя вьюга… тает!', k_f2: 'Звезда возвращается на ёлку! Новый год спасён!', k_f3: 'С Новым годом! Спасибо, что защитил ёлку!' };
  var EN = { k_i1: 'New Year\'s Eve! Let\'s decorate the great tree — the children are waiting for gifts!', k_i2: 'Ha-ha-ha! There will be no holiday! The Star is mine!', k_i3: 'Raccoons, charge! Grab every gift! Crows — smash their towers!',
    k_i4: 'Not on my watch! Staff in hand — we will protect the tree!', k_i5: 'Build the defenses! Enemies are already on the forest roads.',
    k_r1a: 'The Ice Giant has fallen! The forest is ours again.', k_r1b: 'This is just the beginning! My Chariot awaits you in the village!', k_r1c: 'To the village — they are waiting for gifts too!',
    k_r2a: 'The Chariot is wrecked! The village is saved!', k_r2b: 'The party goes on! But the Witch has fled to the lake.', k_r2c: 'The lake will freeze you forever!',
    k_r3a: 'The Giant fell through the ice! The way to the mountains is open.', k_r3b: 'Onward to the pass! The Pole is near.',
    k_r4a: 'The Chariot fell off the pass! Only the Pole is left.', k_r4b: 'The Pole is my domain! This is your end!',
    k_f1: 'No-o-o! My blizzard… is melting!', k_f2: 'The Star returns to the tree! New Year is saved!', k_f3: 'Happy New Year! Thank you for protecting the tree!' };
  for (var k in RU) { Z.TXT.ru[k] = RU[k]; Z.TXT.en[k] = EN[k]; }
  var NAME = { S: ['Снегурочка', 'Snow Maiden', '#7cc4ff'], M: ['Дед Мороз', 'Grandfather Frost', '#ff7a7f'], W: ['Метелица', 'Blizzard Witch', '#c79bff'] };
  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
  function drawActor(a, X, Y, R, t, lt, p) {
    var ctx = c(), e = ease(Math.min(1, p * 1.15)), x = X(a.x0 + (a.x1 - a.x0) * e), y = Y(a.y0 + (a.y1 - a.y0) * e), d = a.d, walk = a.an === 'walk';
    ctx.save();
    if (a.an === 'bounce') y -= Math.abs(Math.sin(lt * 6 + a.x0 * 9)) * R * 0.25;
    if (a.an === 'fly') y += Math.sin(lt * 3) * R * 0.08;
    if (a.an === 'shake') x += Math.sin(lt * 40) * R * 0.03;
    if (a.an === 'fall' && p > 0.35) { ctx.translate(x, y); ctx.rotate(Math.min(1.5, (p - 0.35) * 4) * d); ctx.translate(-x, -y); }
    if (a.an === 'sink') { ctx.beginPath(); ctx.rect(0, 0, 99999, Y(0.9)); ctx.clip(); }
    if (a.an === 'defeat') { var sh = Math.max(0.05, 1 - Math.max(0, p - 0.4) * 1.6); ctx.translate(x, y); ctx.rotate(lt * (2 + p * 10)); ctx.scale(sh, sh); ctx.translate(-x, -y); ctx.globalAlpha = sh; }
    if (a.an === 'boom' && p > 0.45) ctx.globalAlpha = Math.max(0, 1 - (p - 0.45) * 5);
    var fake = function (type) { return { type: type, size: 1, dir: d, walk: lt * 8, ph: 0, hitT: 0, slow: 0, hp: 1, max: 1, air: type === 'crow', lunge: a.an === 'staff' ? 0 : 0 }; };
    if (a.k === 'moroz') { if (a.an === 'staff') { var sw = Math.sin(Math.min(1, lt / 1.2) * Math.PI) * 0.15; ctx.translate(x, y); ctx.rotate(-sw); ctx.translate(-x, -y); } D.moroz(x, y, R * 0.42, { dir: d, walk: walk }); }
    else if (a.k === 'sneg') D.snegurochka(x, y, R * 0.42, { dir: d, walk: walk });
    else if (a.k === 'met') D.metelitsa(x, y, R * 0.42, { dir: d, star: true });
    else if (a.k === 'tree') D.bigTree(x, y, R, t, {});
    else if (a.k === 'gifts') D.giftPile(x, y, R * 1.6, t, 0);
    else if (a.k === 'fort') D.fortress(x, y, R * 0.8, 1, 0, t);
    else if (a.k === 'sleigh') D.sleigh(x, y, R * 1.6, d, walk ? lt : 0, 0);
    else if (a.k === 'star') { ctx.globalAlpha = 0.4; D.circ(x, y, R * 1.2, '#fff3b0'); ctx.globalAlpha = 1; D.star(x, y, R * 0.6, COL.gold, 3); }
    else D.enemy(fake(a.k), x, y, R * 0.75, t);
    ctx.restore();
  }
  function drawFx(f, X, Y, R, lt, S) {
    var ctx = c(), age = lt - f[0]; if (age < 0) return;
    var x = X(f[2]), y = Y(f[3]);
    if (f[1] === 'boom' && age < 1) { ctx.globalAlpha = 1 - age; D.circ(x, y, R * (0.1 + age * 0.6), '#ffcf6b'); D.circ(x, y, R * (0.05 + age * 0.35), '#fff3b0'); ctx.globalAlpha = (1 - age) * 0.6; D.circ(x, y - age * R * 0.5, R * (0.2 + age * 0.4), '#6a6a7a'); ctx.globalAlpha = 1; }
    else if (f[1] === 'snow' && age < 1.5) { for (var i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2, dd = age * R * (0.4 + (i % 3) * 0.2); ctx.globalAlpha = Math.max(0, 1 - age / 1.5); D.circ(x + Math.cos(a) * dd, y + Math.sin(a) * dd * 0.6 + age * age * R * 0.2, R * 0.03, '#fff'); } ctx.globalAlpha = 1; }
    else if (f[1] === 'stars' && age < 1.4) { for (var j = 0; j < 8; j++) { var b = j / 8 * Math.PI * 2 + age; ctx.globalAlpha = Math.max(0, 1 - age / 1.4); D.star(x + Math.cos(b) * age * R * 0.5, y + Math.sin(b) * age * R * 0.5, R * 0.05, COL.gold, 1); } ctx.globalAlpha = 1; }
    else if (f[1] === 'crack' && age < 3) { ctx.strokeStyle = 'rgba(40,60,110,0.8)'; ctx.lineWidth = 3 * S; var L = Math.min(1, age * 2) * R * 0.6; for (var q = 0; q < 6; q++) { var an = q * 1.05; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(an) * L, y + Math.sin(an) * L * 0.3); ctx.stroke(); } }
    else if (f[1] === 'wheel' && age < 2) { ctx.save(); ctx.translate(x + age * R * 0.8, y); ctx.rotate(age * 10); D.circ(0, 0, R * 0.06, '#3d4256', 2); ctx.restore(); }
    else if (f[1] === 'fest') { var cols = ['#ff5a5f', '#ffd54a', '#5ac8ff', '#9dff6a', '#ff8fd6']; for (var k = 0; k < 5; k++) { var ph = (age * 0.8 + k * 0.23) % 1, fx = X(0.15 + k * 0.17), fy = Y(0.15 + (k % 2) * 0.12); for (var m = 0; m < 12; m++) { var aa = m / 12 * Math.PI * 2; ctx.globalAlpha = 1 - ph; D.circ(fx + Math.cos(aa) * ph * R * 0.25, fy + Math.sin(aa) * ph * R * 0.25 + ph * ph * R * 0.05, R * 0.012 + 1, cols[k]); } } ctx.globalAlpha = 1; }
  }
  Z.drawCut = function (m) {
    var Ap = Z.ui.api(), ctx = c(), S = Ap.S, W = Ap.W, H = Ap.H, t = Z.time;
    var shots = CUTS[m.id], sh = shots[m.shot];
    m.lt = (m.lt || 0) + (Z.frameDt || 0.016);
    if (sh.fx) sh.fx.forEach(function (f) { if (!f.done && m.lt >= f[0]) { f.done = true; if (f[1] === 'boom') { Z.AU.boom(1.2); } else if (f[1] === 'flash' || f[1] === 'stars') Z.AU.sfx('levelup', 0.6); else if (f[1] === 'shake') m.shake = 0.5; else if (f[1] === 'snow') Z.AU.sfx('freeze', 0.6); } });
    if (!m.voiced && m.lt > 0.3) { m.voiced = true; if (Z.AU.voice) Z.AU.voice(sh.line[0] === 'W' ? 'witch' : sh.line[0] === 'M' ? 'moroz' : 'sneg', 'idle'); }
    var p = Math.min(1, m.lt / sh.d);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    // сцена 16:10 с кинорамкой
    var sw = W, shh = Math.min(H * (W < H ? 0.6 : 0.7), W * (W < H ? 1.15 : 0.62)), sx = 0, sy = (H - shh) / 2 - 40 * S; if (sy < 52 * S) sy = 52 * S;
    var cam = sh.cam || [1, 1, 0.5, 0.5], z = cam[0] + (cam[1] - cam[0]) * ease(p), sk = m.shake > 0 ? (m.shake -= Z.frameDt) * 18 * S : 0;
    ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, shh); ctx.clip();
    ctx.translate(sx + sw / 2 + Math.sin(t * 60) * sk, sy + shh / 2); ctx.scale(z, z); ctx.translate(-(sx + sw * cam[2]), -(sy + shh * cam[3]));
    Z.drawScene(sh.sc, sx, sy, sw, shh, t);
    var kx = W < H ? 0.84 : 1, X = function (u) { return sx + (0.5 + (u - 0.5) * kx) * sw; }, Y = function (v) { return sy + v * shh; };
    sh.a.forEach(function (a) { drawActor(a, X, Y, a.s * shh, t, m.lt, p); });
    if (sh.fx) sh.fx.forEach(function (f) { drawFx(f, X, Y, shh, m.lt, S); });
    var fl = sh.fx && sh.fx.filter(function (f) { return f[1] === 'flash' && m.lt >= f[0] && m.lt < f[0] + 0.5; })[0];
    if (fl) { ctx.globalAlpha = 1 - (m.lt - fl[0]) / 0.5; ctx.fillStyle = '#fff'; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.globalAlpha = 1; }
    ctx.restore();
    var fadeIn = Math.min(1, m.lt * 3); if (fadeIn < 1) { ctx.globalAlpha = 1 - fadeIn; ctx.fillStyle = '#000'; ctx.fillRect(sx, sy, sw, shh); ctx.globalAlpha = 1; }
    // субтитры
    var nm = NAME[sh.line[0]], txt = Z.T(sh.line[1]), chars = Math.floor(Math.min(1, m.lt / 1.6) * txt.length);
    var ty = sy + shh + 16 * S, lines = D.wrap(txt.slice(0, chars), W - 40 * S, 17 * S);
    D.text(nm[Z.LANG === 'en' ? 1 : 0], 20 * S, ty, 15 * S, nm[2], 'left');
    for (var i = 0; i < lines.length; i++) D.text(lines[i], 20 * S, ty + 24 * S + i * 22 * S, 17 * S, '#ffffff', 'left');
    // прогресс и кнопки
    for (var d = 0; d < shots.length; d++) D.circ(W / 2 - (shots.length - 1) * 8 * S + d * 16 * S, H - 22 * S, 4 * S, d === m.shot ? COL.gold : '#5a6385');
    var next = function () { if (m.shot < shots.length - 1) { m.shot++; m.lt = 0; m.voiced = false; shots[m.shot].fx && shots[m.shot].fx.forEach(function (f) { f.done = false; }); } else end(); };
    var end = function () { Z.save.seen['cut_' + m.id] = 1; Z.persist(); Z.ui.closeModal(); if (m.then) m.then(); };
    if (m.lt > sh.d + 1.2) next();
    Ap.button('cutTap', 0, sy, W, shh + 120 * S, { modal: true, hidden: true, fn: function () { if (m.lt < 1.6) m.lt = 1.6; else next(); } });
    Ap.button('cskip', W - 110 * S, 10 * S, 100 * S, 36 * S, { modal: true, c1: 'rgba(95,116,184,0.85)', c2: '#43579a', label: Z.T('skip'), fn: end });
  };
  var oldShow = Z.showComic;
  Z.showComic = function (id, then) {
    if (CUTS[id]) { if (Z.save.seen['cut_' + id] && !Z.forceCut) { if (then) then(); return; } Z.forceCut = false; CUTS[id].forEach(function (s) { (s.fx || []).forEach(function (f) { f.done = false; }); }); Z.ui.openModal({ type: 'cut', id: id, shot: 0, lt: 0, then: then }); Z.AU.setState('comic', 0); return; }
    oldShow(id, then);
  };
})();
// ---------- союзники: Белка Шишка и снеговик-богатырь Пломбир ----------
(function () {
  var Z = window.Z, D = Z.D, OL = D.OL, COL = D.COL;
  function c() { return D.ctx; }
  function grad(ctx, x0, y0, x1, y1, a, b) { var g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
  D.belka = function (x, y, R, o) {
    var ctx = c(); o = o || {}; var l = Math.max(1.3, R * 0.08), dir = o.dir || 1, t = Z.time;
    var hop = o.walk ? Math.abs(Math.sin(t * 10)) * R * 0.18 : Math.abs(Math.sin(t * 2.5)) * R * 0.04;
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    D.ell(0, 0, R * 0.55, R * 0.15, 'rgba(30,40,80,0.22)');
    ctx.translate(0, -hop);
    // пушистый хвост-завиток
    ctx.beginPath(); ctx.moveTo(-R * 0.25, -R * 0.3); ctx.bezierCurveTo(-R * 1.1, -R * 0.2, -R * 1.2, -R * 1.6, -R * 0.55, -R * 1.75); ctx.bezierCurveTo(-R * 0.15, -R * 1.85, -R * 0.1, -R * 1.35, -R * 0.45, -R * 1.3); ctx.bezierCurveTo(-R * 0.75, -R * 1.0, -R * 0.55, -R * 0.55, -R * 0.15, -R * 0.55); ctx.closePath();
    ctx.fillStyle = grad(ctx, -R * 1.1, 0, -R * 0.1, 0, '#ffb26b', '#d9661e'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    // 2.12.39: блик на хвосте — только внутри хвоста (раньше нижний конец вылезал за контур к тельцу)
    ctx.save(); ctx.beginPath(); ctx.moveTo(-R * 0.25, -R * 0.3); ctx.bezierCurveTo(-R * 1.1, -R * 0.2, -R * 1.2, -R * 1.6, -R * 0.55, -R * 1.75); ctx.bezierCurveTo(-R * 0.15, -R * 1.85, -R * 0.1, -R * 1.35, -R * 0.45, -R * 1.3); ctx.bezierCurveTo(-R * 0.75, -R * 1.0, -R * 0.55, -R * 0.55, -R * 0.15, -R * 0.55); ctx.closePath(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = l * 0.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-R * 0.62, -R * 1.52); ctx.quadraticCurveTo(-R * 0.86, -R * 1.12, -R * 0.66, -R * 0.82); ctx.stroke(); ctx.restore();
    // тельце
    D.ell(0, -R * 0.55, R * 0.36, R * 0.48, '#ef8a3a', l); D.ell(R * 0.08, -R * 0.5, R * 0.2, R * 0.32, '#ffe2bf');
    // шарф
    D.rr(-R * 0.32, -R * 0.98, R * 0.64, R * 0.14, R * 0.06); ctx.fillStyle = '#4cc77d'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
    D.poly([-R * 0.22, -R * 0.88, -R * 0.38, -R * 0.55, -R * 0.12, -R * 0.62], '#3aa865', l * 0.6);
    // голова
    D.circ(R * 0.05, -R * 1.25, R * 0.32, '#ef8a3a', l);
    D.poly([-R * 0.2, -R * 1.45, -R * 0.12, -R * 1.85, R * 0.02, -R * 1.5], '#ef8a3a', l); D.poly([R * 0.1, -R * 1.5, R * 0.22, -R * 1.88, R * 0.3, -R * 1.45], '#ef8a3a', l);
    ctx.strokeStyle = OL; ctx.lineWidth = l * 0.6; ctx.beginPath(); ctx.moveTo(-R * 0.12, -R * 1.85); ctx.lineTo(-R * 0.1, -R * 1.98); ctx.moveTo(R * 0.22, -R * 1.88); ctx.lineTo(R * 0.25, -R * 2.0); ctx.stroke();
    D.ell(R * 0.2, -R * 1.15, R * 0.15, R * 0.1, '#ffe2bf');
    // лётные очки на лбу
    D.circ(-R * 0.03, -R * 1.42, R * 0.09, '#7fd8ff', l * 0.6); D.circ(R * 0.17, -R * 1.42, R * 0.09, '#7fd8ff', l * 0.6);
    D.eyeR(R * 0.02, -R * 1.25, R * 0.068, 0.4); D.eyeR(R * 0.2, -R * 1.25, R * 0.065, 0.4);
    D.circ(R * 0.32, -R * 1.15, R * 0.04, OL);
    // шишка в лапке
    var bp = o.atkP != null && o.atkP >= 0 ? o.atkP : -1, sw = o.atk ? -0.8 : 0;
    if (D.rig) { var bh = D.rigArm('f', R * 0.22, -R * 0.82, D.rig.f.a, D.rig.f.e, R * 0.17, R * 0.16, R * 0.12, '#ef8a3a', l * 0.6, '#ffe2bf', R * 0.06, null); if (!D.rig.f.busy) { ctx.save(); ctx.translate(bh.x, bh.y - R * 0.04); D.ell(0, 0, R * 0.11, R * 0.15, '#8a5a35', l * 0.6); ctx.restore(); D.circ(bh.x, bh.y, R * 0.06, '#ffe2bf', l * 0.6); } }
    else if (!D.armOff && bp >= 0) {   // 2.7.21: бросок — лапа заводит шишку за голову и швыряет вперёд
      var ba = bp < 0.3 ? 0.5 - 3.4 * (1 - (1 - bp / 0.3) * (1 - bp / 0.3)) : bp < 0.45 ? -2.9 + 2.7 * ((bp - 0.3) / 0.15) : -0.2 + 0.7 * ((bp - 0.45) / 0.55);
      var bsx = R * 0.16, bsy = -R * 0.92, bhx = bsx + Math.cos(ba) * R * 0.42, bhy = bsy + Math.sin(ba) * R * 0.42;
      if (bp > 0.3 && bp < 0.55) { ctx.save(); ctx.globalAlpha = 0.7 * (1 - Math.abs(bp - 0.42) / 0.13); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, R * 0.07); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(bsx, bsy, R * 0.5, -2.7, Math.max(-2.6, Math.min(-0.2, ba))); ctx.stroke(); ctx.restore(); }
      ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = Math.max(2.4, R * 0.15); ctx.beginPath(); ctx.moveTo(bsx, bsy); ctx.lineTo(bhx, bhy); ctx.stroke(); ctx.strokeStyle = '#ef8a3a'; ctx.lineWidth = Math.max(1.4, R * 0.09); ctx.stroke();
      if (bp < 0.42 || bp > 0.85) { D.ell(bhx + R * 0.06, bhy - R * 0.06, R * 0.11, R * 0.15, '#8a5a35', l * 0.6); }
      D.circ(bhx, bhy, R * 0.06, '#ffe2bf', l * 0.6); }
    else if (!D.armOff) { ctx.save(); ctx.translate(R * 0.3, -R * 0.7); ctx.rotate(sw); D.ell(R * 0.12, -R * 0.05, R * 0.11, R * 0.15, '#8a5a35', l * 0.6); ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = l * 0.4; ctx.beginPath(); ctx.moveTo(R * 0.04, -R * 0.08); ctx.lineTo(R * 0.2, -R * 0.08); ctx.moveTo(R * 0.04, R * 0.02); ctx.lineTo(R * 0.2, R * 0.02); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  };
  D.plombir = function (x, y, R, o) {
    var ctx = c(); o = o || {}; var l = Math.max(1.4, R * 0.08), dir = o.dir || 1, t = Z.time;
    var bob = o.walk ? Math.abs(Math.sin(t * 6)) * R * 0.06 : 0;
    ctx.save(); ctx.translate(x, y - bob); ctx.scale(dir, 1);
    D.ell(0, bob, R * 0.85, R * 0.2, 'rgba(30,40,80,0.22)');
    function ball(bx, by, r) { var g = ctx.createRadialGradient(bx - r * 0.35, by - r * 0.4, r * 0.1, bx, by, r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cbd9f2'); ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); }
    ball(0, -R * 0.55, R * 0.62); ball(0, -R * 1.38, R * 0.46);
    // рука-ветка с сосулькой-мечом
    var sw = o.atk ? -1.0 : 0.25;
    if (D.rig) { var RGp = D.rig.f, ph = D.rigArm('f', R * 0.45, -R * 1.0, RGp.a, RGp.e, R * 0.2, R * 0.18, l * 1.5, '#6b4a2f', l * 0.5, null, R * 0.07, null, '#6b4a2f'), pa = RGp.a + RGp.e; ctx.save(); ctx.translate(ph.x, ph.y); ctx.rotate(-pa); D.poly([-R * 0.05, 0, 0, R * 0.8, R * 0.05, 0], '#bfefff', l * 0.7); ctx.fillStyle = '#6b4a2f'; ctx.fillRect(-R * 0.09, -R * 0.02, R * 0.18, R * 0.04); ctx.restore(); }
    else if (!D.armOff) {
      // 2.7.18: взмах мечом-сосулькой — замах за голову, рубящий удар вперёд-вниз со шлейфом, возврат
      var p = o.atkP != null && o.atkP >= 0 ? o.atkP : -1, ang = 0.25 + (o.walk ? Math.sin(t * 6) * 0.06 : Math.sin(t * 2) * 0.03), ease = function (u) { return 1 - Math.pow(1 - u, 3); };
      var A0 = 0.25, AW = -0.62, AS = 2.25;
      if (p >= 0) { if (p < 0.28) ang = A0 + (AW - A0) * ease(p / 0.28); else if (p < 0.55) ang = AW + (AS - AW) * ease((p - 0.28) / 0.27); else ang = AS + (A0 - AS) * ease((p - 0.55) / 0.45); }
      var px = R * 0.45, py = -R * 1.0, tipR = R * 1.32, BA = Math.atan2(-1.25, 0.37);
      if (p >= 0.3 && p < 0.8) { // шлейф удара
        var aEnd = ang, aSt = Math.max(AW, aEnd - 2.0), fade = p < 0.55 ? 1 : 1 - (p - 0.55) / 0.25, a0 = aSt + BA, a1 = aEnd + BA;
        ctx.save(); ctx.translate(px, py); ctx.globalAlpha = 0.8 * fade; ctx.beginPath(); ctx.arc(0, 0, tipR * 1.04, a0, a1); ctx.arc(0, 0, tipR * 0.45, a1, a0, true); ctx.closePath();
        var gT = ctx.createRadialGradient(0, 0, tipR * 0.5, 0, 0, tipR); gT.addColorStop(0, 'rgba(160,225,255,0)'); gT.addColorStop(0.75, 'rgba(200,240,255,0.7)'); gT.addColorStop(1, '#ffffff'); ctx.fillStyle = gT; ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
      }
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = l * 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * 0.32, -R * 0.12); ctx.stroke();
      // гарда и клинок-сосулька
      D.rr(R * 0.2, -R * 0.24, R * 0.3, R * 0.08, R * 0.03); ctx.fillStyle = '#7fc8ee'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke();
      D.poly([R * 0.27, -R * 0.24, R * 0.37, -R * 1.25, R * 0.45, -R * 0.24], grad(ctx, R * 0.27, 0, R * 0.45, 0, '#eafaff', '#8fd6f5'), l * 0.7);
      ctx.beginPath(); ctx.moveTo(R * 0.34, -R * 0.3); ctx.lineTo(R * 0.37, -R * 1.05); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = l * 0.5; ctx.stroke();
      ctx.restore(); }
    // голова: ведро-шлем, угольки, морковка, суровые брови
    D.eyeR(-R * 0.14, -R * 1.42, R * 0.07, 0.3, 'coal'); D.eyeR(R * 0.14, -R * 1.42, R * 0.07, 0.3, 'coal');
    ctx.strokeStyle = OL; ctx.lineWidth = l * 1.1; ctx.beginPath(); ctx.moveTo(-R * 0.24, -R * 1.55); ctx.lineTo(-R * 0.06, -R * 1.5); ctx.moveTo(R * 0.06, -R * 1.5); ctx.lineTo(R * 0.24, -R * 1.55); ctx.stroke();
    D.poly([R * 0.02, -R * 1.34, R * 0.5, -R * 1.28, R * 0.02, -R * 1.24], COL.orange, l * 0.7);
    for (var m = 0; m < 5; m++) D.circ(-R * 0.18 + m * R * 0.09, -R * 1.16 - Math.sin(m / 4 * Math.PI) * R * 0.04, R * 0.025, OL);
    ctx.beginPath(); ctx.moveTo(-R * 0.4, -R * 1.62); ctx.lineTo(-R * 0.32, -R * 2.05); ctx.lineTo(R * 0.32, -R * 2.05); ctx.lineTo(R * 0.4, -R * 1.62); ctx.closePath(); ctx.fillStyle = grad(ctx, -R * 0.4, 0, R * 0.4, 0, '#9fb1cc', '#5d6d8c'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    D.rr(-R * 0.46, -R * 1.68, R * 0.92, R * 0.1, R * 0.04); ctx.fillStyle = '#8193b0'; ctx.fill(); ctx.stroke();
    // пуговицы-угольки и пояс
    D.circ(0, -R * 0.75, R * 0.05, OL); D.circ(0, -R * 0.5, R * 0.05, OL);
    // 2.11.5: вместо прямой планки — вязаный шарф на шее: обхват по стыку комов и свисающий конец с бахромой (со стороны меча, не за щитом)
    var sw2 = Math.sin(t * 2.2) * 0.06 + (o.walk ? Math.sin(t * 6) * 0.08 : 0);
    ctx.save(); ctx.translate(R * 0.22, -R * 0.93); ctx.rotate(0.12 + sw2);
    D.rr(-R * 0.07, 0, R * 0.16, R * 0.42, R * 0.05); ctx.fillStyle = COL.red; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-R * 0.07, R * 0.12, R * 0.16, R * 0.05); ctx.fillRect(-R * 0.07, R * 0.25, R * 0.16, R * 0.05);
    ctx.strokeStyle = COL.red; ctx.lineWidth = l * 0.6; for (var fr = 0; fr < 4; fr++) { ctx.beginPath(); ctx.moveTo(-R * 0.05 + fr * R * 0.04, R * 0.42); ctx.lineTo(-R * 0.05 + fr * R * 0.04, R * 0.5); ctx.stroke(); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-R * 0.4, -R * 1.02); ctx.quadraticCurveTo(0, -R * 0.84, R * 0.4, -R * 1.02); ctx.lineTo(R * 0.42, -R * 0.9); ctx.quadraticCurveTo(0, -R * 0.7, -R * 0.42, -R * 0.9); ctx.closePath();
    ctx.fillStyle = COL.red; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = l * 0.7; ctx.beginPath(); ctx.moveTo(-R * 0.36, -R * 0.94); ctx.quadraticCurveTo(0, -R * 0.78, R * 0.36, -R * 0.94); ctx.stroke();
    // ледяной щит — в руке перед телом, рисуется последним: шарф уходит под него
    ctx.save(); ctx.translate(-R * 0.55, -R * 0.75); ctx.beginPath(); ctx.moveTo(0, -R * 0.42); ctx.quadraticCurveTo(R * 0.34, -R * 0.4, R * 0.3, 0); ctx.quadraticCurveTo(R * 0.25, R * 0.38, 0, R * 0.5); ctx.quadraticCurveTo(-R * 0.25, R * 0.38, -R * 0.3, 0); ctx.quadraticCurveTo(-R * 0.34, -R * 0.4, 0, -R * 0.42); ctx.closePath();
    ctx.fillStyle = grad(ctx, -R * 0.3, -R * 0.4, R * 0.3, R * 0.4, '#dff6ff', '#5ab4e6'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); D.flake(0, 0, R * 0.16, '#ffffff', l * 0.6); ctx.restore();
    ctx.restore();
  };
})();
