/* 2.11.5 · вражеские постройки и наши ловушки — понятнее и красивее.
   Вражеские постройки «с экипажем»: на каждой — енот, который и делает работу (бросает снежки, крутит катапульту,
   стучит в барабан, пилит в мастерской, заряжает морозную пушку, колдует в шатре), с замахом перед выстрелом —
   видно, кто и когда стреляет. Наши ловушки нарисованы заново: шипы-сосульки из лунки, ледяная лужа с бликом,
   мина-бочонок с фитилём, капкан с зубьями; у каждой — отклик на срабатывание и запас (сколько ещё сработает). */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = D.OL || '#1b2448';
function C() { return D.ctx; }
function L0(cs) { return Math.max(1.2, cs * 0.04); }
function line(c, pts, col, w) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); }
function G2(c, x0, y0, x1, y1, a, b) { var g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }

// маленький енот-работник (голова + туловище в жилетке), dir — куда смотрит, arm — угол руки
function coon(c, x, y, R, dir, arm, o) {
  o = o || {}; var l = Math.max(1, R * 0.12);
  c.save(); c.translate(x, y); c.scale(dir, 1);
  // хвост
  c.save(); c.translate(-R * 0.55, -R * 0.4); c.rotate(-0.6 + Math.sin((Z.time || 0) * 3) * 0.15);
  D.ell(0, -R * 0.35, R * 0.22, R * 0.45, '#9aa1b5', l); for (var s = 0; s < 3; s++) D.ell(0, -R * (0.12 + s * 0.22), R * 0.2, R * 0.05, '#3d4256'); c.restore();
  // тело
  D.ell(0, -R * 0.45, R * 0.45, R * 0.5, '#9aa1b5', l); D.rr(-R * 0.4, -R * 0.75, R * 0.8, R * 0.42, R * 0.12); c.fillStyle = o.vest || '#6b3fa0'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  // рука
  c.save(); c.translate(R * 0.3, -R * 0.7); c.rotate(-(arm || 0)); line(c, [0, 0, R * 0.55, 0], OL, R * 0.24); line(c, [0, 0, R * 0.55, 0], '#9aa1b5', R * 0.15);
  if (o.hold) o.hold(c, R * 0.6, 0); c.restore();
  // голова
  var hy = -R * 1.25; D.circ(0, hy, R * 0.5, '#9aa1b5', l); D.circ(-R * 0.34, hy - R * 0.42, R * 0.16, '#9aa1b5', l); D.circ(R * 0.34, hy - R * 0.42, R * 0.16, '#9aa1b5', l);
  D.rr(-R * 0.44, hy - R * 0.15, R * 0.88, R * 0.26, R * 0.11); c.fillStyle = '#3d4256'; c.fill();
  if (D.eyeR) { D.eyeR(-R * 0.17, hy - R * 0.03, R * 0.1, 1); D.eyeR(R * 0.19, hy - R * 0.03, R * 0.1, 1); } else { D.circ(-R * 0.17, hy - R * 0.03, R * 0.08, '#fff'); D.circ(R * 0.19, hy - R * 0.03, R * 0.08, '#fff'); }
  D.circ(R * 0.36, hy + R * 0.14, R * 0.07, OL);
  if (o.hat) o.hat(c, 0, hy - R * 0.45, R);
  c.restore();
}
function snowball(c, x, y, r) { D.circ(x, y, r, '#ffffff', Math.max(1, r * 0.25)); D.circ(x - r * 0.3, y - r * 0.3, r * 0.3, '#e6eefc'); }
// фаза работы постройки: 0 — покой, (0..1) — замах перед действием, «выстрел» сразу после сброса таймера
var PERIOD = { snowtower: 3, catapult: 7, workshop: 15, frostgun: 6, lodge: 10 };
function phase(s) { var P = PERIOD[s.type] || 3, cd = s.cd || 0; if (s.sleep > 0) return { wind: 0, fire: 0 }; var fire = Math.max(0, 1 - (P - cd) / 0.35), wind = cd < 0.6 ? 1 - cd / 0.6 : 0; return { wind: wind, fire: fire }; }

var oStruct = D.struct;
D.struct = function (s, x, y, cs, t) {
  var T = s.type, c = C(), l = L0(cs);
  if (!s.done || !NEW[T]) return oStruct.apply(this, arguments);
  var ph = phase(s), shake = s.hitT > 0 ? Math.sin(t * 70) * cs * 0.03 : 0;
  c.save(); c.translate(x + shake, y);
  D.ell(cs * 0.05, cs * 0.03, cs * 0.44, cs * 0.12, 'rgba(30,40,80,0.22)');
  try { NEW[T](c, s, cs, t, l, ph); } catch (e) { if (window.__rep) window.__rep(e); }
  c.restore();
  if (s.sleep > 0) { var zz = (t * 0.7) % 1; c.globalAlpha = 1 - zz; D.text('z', x + cs * 0.3, y - cs * (1.3 + zz * 0.4), cs * 0.28, '#ffffff', 'center', 'middle', 2); c.globalAlpha = 1; }
  if (s.hp < s.max) { var bw = cs * 0.6, bh = Math.max(3, cs * 0.06); c.fillStyle = OL; D.rr(x - bw / 2 - 1, y + cs * 0.14 - 1, bw + 2, bh + 2, 2); c.fill(); c.fillStyle = '#c79bff'; c.fillRect(x - bw / 2, y + cs * 0.14, bw * Math.max(0, s.hp / s.max), bh); }
};
var NEW = {};
NEW.snowtower = function (c, s, cs, t, l, ph) {   // снежная вышка: помост на сваях, бруствер из снежков, енот-метатель
  [[-0.3, 0], [0.3, 0]].forEach(function (q) { line(c, [q[0] * cs, 0, q[0] * 0.75 * cs, -cs * 0.9], OL, l * 2.2); line(c, [q[0] * cs, 0, q[0] * 0.75 * cs, -cs * 0.9], '#8a5a35', l); });
  line(c, [-cs * 0.27, -cs * 0.25, cs * 0.24, -cs * 0.7], '#6a4628', l * 0.8); line(c, [cs * 0.27, -cs * 0.25, -cs * 0.24, -cs * 0.7], '#6a4628', l * 0.8);
  D.rr(-cs * 0.4, -cs * 1.0, cs * 0.8, cs * 0.14, cs * 0.03); c.fillStyle = '#a8784a'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  var arm = ph.wind > 0 ? -1.2 * ph.wind : ph.fire > 0 ? 1.1 * ph.fire : 0.2;
  coon(c, -cs * 0.05, -cs * 1.0, cs * 0.3, 1, arm, { vest: '#6b3fa0', hold: ph.fire > 0.5 ? null : function (cc, hx, hy) { snowball(cc, hx, hy, cs * 0.07); } });
  for (var i = 0; i < 4; i++) snowball(c, -cs * 0.3 + i * cs * 0.2, -cs * 1.02, cs * 0.075);   // бруствер
  for (var j = 0; j < 3; j++) snowball(c, cs * 0.22 + j * cs * 0.06, -cs * 0.1 - (j % 2) * cs * 0.08, cs * 0.06);   // запас у подножия
  c.save(); c.translate(-cs * 0.32, -cs * 1.0); line(c, [0, 0, 0, -cs * 0.55], OL, l); D.poly([0, -cs * 0.55, cs * 0.25, -cs * 0.48 + Math.sin(t * 5) * cs * 0.03, 0, -cs * 0.4], '#6b3fa0', l * 0.6); c.restore();
};
NEW.catapult = function (c, s, cs, t, l, ph) {   // катапульта: рама на колёсах, ложка со снежным комом, енот крутит ворот
  D.rr(-cs * 0.42, -cs * 0.28, cs * 0.84, cs * 0.18, cs * 0.04); c.fillStyle = '#8a5a35'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  [-0.28, 0.28].forEach(function (q) { D.circ(q * cs, -cs * 0.05, cs * 0.12, '#6b4a2f', l * 0.8); D.circ(q * cs, -cs * 0.05, cs * 0.04, '#c9d2e3'); });
  line(c, [-cs * 0.1, -cs * 0.28, 0, -cs * 0.62, cs * 0.1, -cs * 0.28], '#6b4a2f', l * 1.2);
  var a = ph.fire > 0 ? 0.6 - 1.6 * ph.fire : -1.0 + 0.2 * ph.wind;   // ложка: взведена — назад, выстрел — вперёд
  c.save(); c.translate(0, -cs * 0.58); c.rotate(a); line(c, [0, 0, -cs * 0.62, 0], OL, l * 2.2); line(c, [0, 0, -cs * 0.62, 0], '#a8784a', l * 1.1);
  D.ell(-cs * 0.66, -cs * 0.04, cs * 0.12, cs * 0.06, '#6b4a2f', l * 0.6); if (ph.fire < 0.5) snowball(c, -cs * 0.66, -cs * 0.12, cs * 0.11); c.restore();
  coon(c, cs * 0.45, -cs * 0.05, cs * 0.26, -1, Math.sin(t * (ph.wind > 0 ? 9 : 2)) * 0.6, { vest: '#c0323f' });
};
NEW.workshop = function (c, s, cs, t, l, ph) {   // мастерская: сарай с трубой, енот стучит молотком, искры
  D.rr(-cs * 0.42, -cs * 0.62, cs * 0.84, cs * 0.62, cs * 0.04); c.fillStyle = G2(c, -cs * 0.4, 0, cs * 0.4, 0, '#a8784a', '#7a5232'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  c.strokeStyle = 'rgba(60,35,15,0.4)'; c.lineWidth = l * 0.5; for (var p = 1; p < 4; p++) { c.beginPath(); c.moveTo(-cs * 0.42, -cs * 0.62 * p / 4); c.lineTo(cs * 0.42, -cs * 0.62 * p / 4); c.stroke(); }
  D.poly([-cs * 0.5, -cs * 0.6, 0, -cs * 0.95, cs * 0.5, -cs * 0.6], '#6b3fa0', l); D.rr(cs * 0.18, -cs * 1.0, cs * 0.12, cs * 0.25, cs * 0.02); c.fillStyle = '#5a5a6a'; c.fill(); c.stroke();
  for (var sm = 0; sm < 3; sm++) { var q = (t * 0.4 + sm / 3) % 1; c.globalAlpha = 0.5 * (1 - q); D.circ(cs * 0.24 + Math.sin(q * 5) * cs * 0.06, -cs * 1.05 - q * cs * 0.6, cs * (0.06 + q * 0.12), '#c9d2e6'); } c.globalAlpha = 1;
  D.rr(-cs * 0.3, -cs * 0.42, cs * 0.28, cs * 0.42, cs * 0.03); c.fillStyle = '#2a1e18'; c.fill(); c.stroke();
  var hit = Math.sin(t * 8) > 0.6; coon(c, cs * 0.12, 0, cs * 0.25, -1, hit ? -0.4 : 0.9, { vest: '#4a7a4a', hold: function (cc, hx, hy) { line(cc, [hx, hy, hx + cs * 0.12, hy], '#6b4a2f', l); D.rr(hx + cs * 0.1, hy - cs * 0.06, cs * 0.06, cs * 0.12, 2); cc.fillStyle = '#9aa1b5'; cc.fill(); } });
  if (hit) for (var k = 0; k < 4; k++) { var a = -1.2 + k * 0.6; D.circ(-cs * 0.12 + Math.cos(a) * cs * 0.12, -cs * 0.25 + Math.sin(a) * cs * 0.1, cs * 0.02, '#ffd54a'); }
  if (ph.fire > 0) { c.globalAlpha = ph.fire; D.text('+2', 0, -cs * 1.15 - (1 - ph.fire) * cs * 0.3, cs * 0.26, '#c79bff', 'center', 'middle', 2); c.globalAlpha = 1; }
};
NEW.drum = function (c, s, cs, t, l, ph) {   // барабан: большой бубен на треноге, енот бьёт колотушками — ускоряет своих
  [[-0.3], [0.3]].forEach(function (q) { line(c, [q[0] * cs, 0, 0, -cs * 0.35], '#6b4a2f', l * 1.2); });
  D.ell(0, -cs * 0.42, cs * 0.34, cs * 0.12, '#f0e2c0', l); D.rr(-cs * 0.34, -cs * 0.42, cs * 0.68, cs * 0.22, cs * 0.03); c.fillStyle = '#c0323f'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke(); D.ell(0, -cs * 0.42, cs * 0.34, cs * 0.12, '#f0e2c0', l);
  for (var z = 0; z < 5; z++) line(c, [-cs * 0.3 + z * cs * 0.15, -cs * 0.4, -cs * 0.25 + z * cs * 0.15, -cs * 0.22], '#ffd54a', l * 0.6);
  var asleep = s.sleep > 0, bt = !asleep && Math.sin(t * 12) > 0;
  coon(c, -cs * 0.48, 0, cs * 0.26, 1, asleep ? -0.6 : bt ? 0.1 : 0.8, { vest: '#c0323f', hold: function (cc, hx, hy) { line(cc, [hx, hy, hx + cs * 0.2, hy - cs * 0.04], '#8a5a35', l); D.circ(hx + cs * 0.21, hy - cs * 0.04, cs * 0.04, '#f0e2c0'); } });
  if (!asleep && bt) { c.globalAlpha = 0.5; for (var r = 1; r <= 2; r++) { c.strokeStyle = '#ffd54a'; c.lineWidth = l * 0.6; c.beginPath(); c.ellipse(0, -cs * 0.45, cs * 0.34 * (1 + r * 0.3), cs * 0.12 * (1 + r * 0.3), 0, Math.PI, 0); c.stroke(); } c.globalAlpha = 1; }
};
NEW.powder = function (c, s, cs, t, l, ph) {   // пороховой склад: бочки с черепом, тлеющий фитиль — опасно взрывается
  [[-0.22, 0], [0.22, 0], [0, -0.32]].forEach(function (q, i) { var bx = q[0] * cs, by = q[1] * cs; D.rr(bx - cs * 0.15, by - cs * 0.34, cs * 0.3, cs * 0.34, cs * 0.07); c.fillStyle = i === 2 ? '#7f5332' : '#9a6a3a'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
    c.fillStyle = '#5a6078'; c.fillRect(bx - cs * 0.15, by - cs * 0.26, cs * 0.3, cs * 0.03); c.fillRect(bx - cs * 0.15, by - cs * 0.1, cs * 0.3, cs * 0.03);
    D.circ(bx, by - cs * 0.18, cs * 0.05, '#f0e8d8'); D.circ(bx - cs * 0.018, by - cs * 0.19, cs * 0.012, OL); D.circ(bx + cs * 0.018, by - cs * 0.19, cs * 0.012, OL); });
  c.strokeStyle = '#3d3d3d'; c.lineWidth = l * 0.7; c.beginPath(); c.moveTo(0, -cs * 0.66); c.quadraticCurveTo(cs * 0.1, -cs * 0.8, cs * 0.04, -cs * 0.9); c.stroke();
  var fl = 0.7 + 0.3 * Math.sin(t * 20); c.globalAlpha = 0.5 * fl; D.circ(cs * 0.04, -cs * 0.92, cs * 0.07, '#ffb347'); c.globalAlpha = 1; D.circ(cs * 0.04, -cs * 0.92, cs * 0.025, '#fff3b0');
};
NEW.frostgun = function (c, s, cs, t, l, ph) {   // морозная пушка: ледяной ствол на лафете, енот в очках крутит вентиль, перед выстрелом — иней
  D.rr(-cs * 0.32, -cs * 0.26, cs * 0.64, cs * 0.24, cs * 0.05); c.fillStyle = '#7a8aa8'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  [-0.2, 0.2].forEach(function (q) { D.circ(q * cs, -cs * 0.04, cs * 0.09, '#4a5070', l * 0.7); });
  var rec = ph.fire > 0 ? ph.fire * cs * 0.08 : 0;
  c.save(); c.translate(-rec, -cs * 0.38); c.rotate(-0.35); D.rr(0, -cs * 0.11, cs * 0.55, cs * 0.22, cs * 0.08); c.fillStyle = G2(c, 0, -cs * 0.1, 0, cs * 0.1, '#e6faff', '#7fc8ee'); c.fill(); c.lineWidth = l; c.strokeStyle = '#2f6f9e'; c.stroke();
  for (var r = 0; r < 3; r++) line(c, [cs * (0.12 + r * 0.14), -cs * 0.11, cs * (0.12 + r * 0.14), cs * 0.11], '#2f6f9e', l * 0.5);
  if (ph.wind > 0) { c.globalAlpha = ph.wind; D.circ(cs * 0.58, 0, cs * 0.1, 'rgba(200,240,255,0.8)'); if (D.flake) D.flake(cs * 0.58, 0, cs * 0.08 * ph.wind, '#ffffff', 1); c.globalAlpha = 1; }
  c.restore();
  coon(c, -cs * 0.42, 0, cs * 0.25, 1, ph.wind > 0 ? Math.sin(t * 14) * 0.5 : 0.3, { vest: '#2f6f9e', hat: function (cc, hx, hy, R) { D.rr(hx - R * 0.42, hy + R * 0.28, R * 0.84, R * 0.2, R * 0.08); cc.fillStyle = '#5ac8ff'; cc.fill(); cc.lineWidth = 1; cc.strokeStyle = OL; cc.stroke(); } });
};
NEW.lodge = function (c, s, cs, t, l, ph) {   // шатёр шамана: шкуры на жердях, черепа-обереги, енот-шаман с бубном и зелёным огнём — поднимает павших
  line(c, [-cs * 0.42, 0, cs * 0.05, -cs * 1.05], OL, l * 1.6); line(c, [cs * 0.42, 0, -cs * 0.05, -cs * 1.05], OL, l * 1.6);
  D.poly([-cs * 0.42, 0, 0, -cs * 0.95, cs * 0.42, 0], G2(c, -cs * 0.4, 0, cs * 0.4, 0, '#6a5a7a', '#3a3048'), l);
  c.strokeStyle = 'rgba(232,224,208,0.5)'; c.lineWidth = l * 0.6; for (var st = 1; st < 4; st++) { c.beginPath(); c.moveTo(-cs * 0.42 * (1 - st * 0.22), -cs * 0.95 * st * 0.22); c.lineTo(cs * 0.42 * (1 - st * 0.22), -cs * 0.95 * st * 0.22); c.stroke(); }
  D.poly([-cs * 0.12, 0, 0, -cs * 0.35, cs * 0.12, 0], '#140c20', l * 0.6);
  var gl = 0.5 + 0.5 * Math.sin(t * 3) + ph.wind * 0.5; c.globalAlpha = Math.min(1, 0.3 * gl); D.circ(0, -cs * 0.1, cs * 0.3, '#7fffd0'); c.globalAlpha = 1; D.circ(0, -cs * 0.1, cs * 0.05 * (0.7 + gl * 0.3), '#c8ffe8');
  [[-0.3, -0.4], [0.3, -0.4]].forEach(function (q) { D.circ(q[0] * cs, q[1] * cs, cs * 0.05, '#f0e8d8', l * 0.4); });
  coon(c, cs * 0.5, 0, cs * 0.24, -1, Math.sin(t * 4) * 0.6 + ph.wind, { vest: '#2a2340', hat: function (cc, hx, hy, R) { [-0.3, 0, 0.3].forEach(function (q) { D.poly([hx + q * R - R * 0.08, hy + R * 0.2, hx + q * R, hy - R * 0.35, hx + q * R + R * 0.08, hy + R * 0.2], '#e8484f', 1); }); } });
  if (ph.fire > 0) { c.globalAlpha = ph.fire; for (var k = 0; k < 6; k++) { var a = k / 6 * Math.PI * 2 + t * 4; D.circ(Math.cos(a) * cs * 0.4, -cs * 0.4 + Math.sin(a) * cs * 0.2, cs * 0.04, '#7fffd0'); } c.globalAlpha = 1; }
};
NEW.totem = function (c, s, cs, t, l, ph) {   // ледяной тотем: столб с ликами, зелёный огонёк лечит своих (кольцо — зона)
  D.rr(-cs * 0.16, -cs * 1.0, cs * 0.32, cs * 1.0, cs * 0.05); c.fillStyle = G2(c, -cs * 0.16, 0, cs * 0.16, 0, '#e6faff', '#7fc8ee'); c.fill(); c.lineWidth = l; c.strokeStyle = '#2f6f9e'; c.stroke();
  [0.3, 0.65].forEach(function (q, i) { var fy = -cs * q; D.circ(-cs * 0.06, fy, cs * 0.03, '#2f6f9e'); D.circ(cs * 0.06, fy, cs * 0.03, '#2f6f9e'); line(c, [-cs * 0.06, fy + cs * 0.08, cs * 0.06, fy + cs * 0.08], '#2f6f9e', l * 0.7); });
  D.poly([-cs * 0.3, -cs * 0.95, -cs * 0.16, -cs * 0.85, -cs * 0.16, -cs * 1.0], '#bfe9ff', l * 0.6); D.poly([cs * 0.3, -cs * 0.95, cs * 0.16, -cs * 0.85, cs * 0.16, -cs * 1.0], '#bfe9ff', l * 0.6);
  var gl = 0.6 + 0.3 * Math.sin(t * 4); D.circ(0, -cs * 1.12, cs * 0.13, 'rgba(160,255,200,' + gl.toFixed(2) + ')', l * 0.7);
  c.globalAlpha = 0.25 + 0.1 * Math.sin(t * 2); c.strokeStyle = '#7dffb2'; c.lineWidth = l; c.setLineDash([cs * 0.12, cs * 0.1]); c.beginPath(); c.ellipse(0, 0, cs * 2, cs * 1.4, 0, 0, 7); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  for (var p = 0; p < 3; p++) { var q2 = (t * 0.6 + p / 3) % 1; c.globalAlpha = 1 - q2; D.text('+', Math.sin(p * 2.1) * cs * 0.3, -cs * (1.2 + q2 * 0.6), cs * 0.2, '#7dffb2', 'center', 'middle', 0); } c.globalAlpha = 1;
};

NEW.palisade = function (c, s, cs, t, l, ph) {   // частокол: заострённые колья, перевязанные верёвкой, сосульки на остриях — враги за ним прячутся
  for (var i = 0; i < 6; i++) { var px = -cs * 0.4 + i * cs * 0.16, h = cs * (0.6 + ((i * 7) % 3) * 0.08);
    D.poly([px - cs * 0.07, 0, px - cs * 0.07, -h + cs * 0.1, px, -h, px + cs * 0.07, -h + cs * 0.1, px + cs * 0.07, 0], G2(c, px - cs * 0.07, 0, px + cs * 0.07, 0, '#a8784a', '#6b4a2f'), l * 0.8);
    D.ell(px, -h + cs * 0.1, cs * 0.05, cs * 0.02, '#ffffff'); }
  line(c, [-cs * 0.46, -cs * 0.22, cs * 0.46, -cs * 0.25], '#c9a06a', l * 0.9); line(c, [-cs * 0.46, -cs * 0.42, cs * 0.46, -cs * 0.4], '#c9a06a', l * 0.9);
  c.save(); c.translate(cs * 0.36, -cs * 0.75); line(c, [0, 0, 0, -cs * 0.35], OL, l); D.poly([0, -cs * 0.35, cs * 0.24, -cs * 0.29 + Math.sin(t * 5) * cs * 0.02, 0, -cs * 0.22], '#6b3fa0', l * 0.6); c.restore();
  D.ell(0, cs * 0.0, cs * 0.46, cs * 0.06, '#ffffff');
};
NEW.watch = function (c, s, cs, t, l, ph) {   // дозорная вышка: енот с подзорной трубой высматривает наших — свои рядом крепче (фиолетовое кольцо)
  [[-0.3], [0.3]].forEach(function (q) { line(c, [q[0] * cs, 0, q[0] * 0.65 * cs, -cs * 1.0], OL, l * 2); line(c, [q[0] * cs, 0, q[0] * 0.65 * cs, -cs * 1.0], '#5b4a73', l); });
  line(c, [-cs * 0.26, -cs * 0.3, cs * 0.22, -cs * 0.7], '#3f3355', l * 0.8); line(c, [cs * 0.26, -cs * 0.3, -cs * 0.22, -cs * 0.7], '#3f3355', l * 0.8);
  D.rr(-cs * 0.32, -cs * 1.08, cs * 0.64, cs * 0.12, cs * 0.03); c.fillStyle = '#5b4a73'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  var look = Math.sin(t * 0.8) > 0 ? 1 : -1;
  coon(c, 0, -cs * 1.08, cs * 0.26, look, 0.25, { vest: '#6b3fa0', hold: function (cc, hx, hy) { D.rr(hx - cs * 0.02, hy - cs * 0.04, cs * 0.22, cs * 0.08, cs * 0.03); cc.fillStyle = '#c99520'; cc.fill(); cc.lineWidth = 1; cc.strokeStyle = OL; cc.stroke(); var gl = (Math.sin(t * 6) + 1) / 2; cc.globalAlpha = 0.6 * gl; D.circ(hx + cs * 0.22, hy, cs * 0.05, '#bfeaff'); cc.globalAlpha = 1; } });
  D.poly([-cs * 0.38, -cs * 1.65, 0, -cs * 1.92, cs * 0.38, -cs * 1.65], '#6b3fa0', l); line(c, [-cs * 0.3, -cs * 1.66, -cs * 0.3, -cs * 1.08], OL, l * 0.8); line(c, [cs * 0.3, -cs * 1.66, cs * 0.3, -cs * 1.08], OL, l * 0.8);
  c.globalAlpha = 0.1 + 0.05 * Math.sin(t * 3); D.circ(0, -cs * 0.3, cs * 2.6, '#6b3fa0'); c.globalAlpha = 1;
};
// ---------- наши ловушки: в стиле обликов вышек ----------
// Облик ловушки = облик ближайшей наряженной вышки (в 3 клетках), иначе — самый частый облик на поле.
// Так ловушки и постройки всегда «в одном комплекте» с вышками рядом; отдельно покупать ничего не нужно.
var PAL = {
  base:    { main: '#8fd0f0', dark: '#2f6f9e', hi: '#ffffff', acc: '#c9d2e3', metal: '#c9d2e3', wood: '#8a5a35', glow: null },
  gift:    { main: '#e8484f', dark: '#9a1e2a', hi: '#ffffff', acc: '#ffd54a', metal: '#ffd54a', wood: '#c9302c', glow: null },
  ginger:  { main: '#c98a4e', dark: '#7a4a20', hi: '#fffaf2', acc: '#fffaf2', metal: '#e0b07a', wood: '#a86a34', glow: null },
  crystal: { main: '#9fe8ff', dark: '#2f7fb0', hi: '#ffffff', acc: '#e6faff', metal: '#bfefff', wood: '#7cc4ea', glow: 'rgba(160,225,255,' },
  garland: { main: '#2c7a4b', dark: '#174a2c', hi: '#eef6ff', acc: '#ffd54a', metal: '#4caf6e', wood: '#2c7a4b', glow: null },
  royal:   { main: '#ffd54a', dark: '#a8780c', hi: '#fff6c8', acc: '#b3203a', metal: '#ffd54a', wood: '#d39a1c', glow: 'rgba(255,214,90,' }
};
var BULB = ['#ff5a5f', '#ffd54a', '#5ac8ff', '#9dff6a'];
function trapSkin(tr) {
  var G = Z.G; if (!G || !Z.towerSkin) return 'base';
  var best = null, bd = 3.01, cnt = {}, top = null, tc = 0;
  for (var k in G.towers) { var tw = G.towers[k], sk = Z.towerSkin(tw.type); if (!sk) continue; cnt[sk.id] = (cnt[sk.id] || 0) + 1; if (cnt[sk.id] > tc) { tc = cnt[sk.id]; top = sk.id; } var d = Math.hypot(tw.c - tr.c, tw.r - tr.r); if (d < bd) { bd = d; best = sk.id; } }
  return best || top || 'base';
}
Z.trapSkin = trapSkin;
function bow(c, x, y, r, col) { D.ell(x - r * 0.6, y, r * 0.6, r * 0.38, col, Math.max(0.8, r * 0.18)); D.ell(x + r * 0.6, y, r * 0.6, r * 0.38, col, Math.max(0.8, r * 0.18)); D.circ(x, y, r * 0.28, col, Math.max(0.8, r * 0.18)); }
function crownMini(c, x, y, r) { D.poly([x - r, y, x - r, y - r * 0.7, x - r * 0.5, y - r * 0.3, x, y - r * 0.9, x + r * 0.5, y - r * 0.3, x + r, y - r * 0.7, x + r, y], '#ffd54a', Math.max(0.8, r * 0.15)); D.circ(x, y - r * 0.35, r * 0.18, '#b3203a'); }
function glowAt(c, x, y, r, P, k) { if (!P.glow) return; var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, P.glow + (0.4 * (k || 1)).toFixed(2) + ')'); g.addColorStop(1, P.glow + '0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }

var oTrap = D.trap;
D.trap = function (tr, x, y, cs, t) {
  var T = tr.type, c = C(), l = L0(cs), act = tr.t > 0 ? Math.min(1, tr.t / 0.3) : 0, def = Z.TRAPS[T];
  if (!TR[T]) return oTrap.apply(this, arguments);
  var id = tr._skin || Z.trapSkin(tr), P = PAL[id] || PAL.base;
  // 2.11.5: ловушка лежит в своей клетке и на своём уровне земли: если клетка ниже — плато (его верх наползает на этот ряд),
  // ловушка сжимается и приподнимается, чтобы не лечь на кромку плато
  var Lg = Z.G && Z.G.L, sh = 0, sc = 1;
  if (Lg && Lg.hgt) { var lvl = function (cc, rr) { return (Lg.hgt[rr] && Lg.hgt[rr][cc]) ? 1 : 0; }, me = lvl(tr.c, tr.r), lim = null;
    if (lvl(tr.c, tr.r + 1) > me) lim = (tr.r + 1 - 0.32 - 0.04); else if (Lg.grid[tr.r + 1] && Lg.grid[tr.r + 1][tr.c] === 9) lim = tr.r + 0.92;
    if (lim !== null) { var yTop = y - cs * 0.42, yBot = y + cs * 0.4, maxB = Z.ui.Y(lim - (me ? 0.32 : 0)); if (yBot > maxB) { var room = Math.max(cs * 0.3, maxB - yTop); sc = Math.min(1, room / (yBot - yTop)); sh = yBot - maxB - (1 - sc) * (yBot - y); if (sh < 0) sh = 0; } } }
  c.save(); if (sc < 1 || sh > 0) { c.translate(x, y - sh); c.scale(sc, sc); c.translate(-x, -y); }
  try { TR[T](c, tr, x, y, cs, t, l, act, P, id); } catch (e) { if (window.__rep) window.__rep(e); }
  c.restore();
  if (sc < 1 || sh > 0) { c.save(); c.translate(x, y - sh); c.scale(sc, sc); c.translate(-x, -y); }
  if (def && def.uses > 1 && def.uses < 100 && tr.uses !== undefined) { var n = Math.min(6, Math.ceil(tr.uses / Math.max(1, def.uses / 6))); for (var i = 0; i < 6; i++) D.circ(x - cs * 0.2 + i * cs * 0.08, y + cs * 0.36, cs * 0.022, i < n ? (id === 'base' ? (def.col || '#bfefff') : P.acc) : 'rgba(40,50,80,0.35)'); }
  if (sc < 1 || sh > 0) c.restore();
};
var TR = {};
TR.spike = function (c, tr, x, y, cs, t, l, act, P, id) {   // шипы из лунки: сосульки / карамельные трости / пряничные конусы / кристаллы / ёлочки / золотые пики
  D.ell(x, y + cs * 0.12, cs * 0.36, cs * 0.16, id === 'base' ? '#3a4a7a' : P.dark, l * 0.8); D.ell(x, y + cs * 0.14, cs * 0.3, cs * 0.11, '#1e2a50');
  glowAt(c, x, y - cs * 0.1, cs * 0.45, P, 0.8);
  var up = 0.8 + 0.35 * act, dU = (Z.TRAPS.spike || {}).uses || 30, keep = tr.uses == null ? 6 : Math.max(1, Math.ceil(6 * tr.uses / dU)), BRK = [3, 0, 5, 1, 4, 2];
  [[-0.2, 0.32], [-0.08, 0.44], [0.05, 0.38], [0.17, 0.46], [0.27, 0.3], [-0.02, 0.24]].forEach(function (q, i) { var sx = x + q[0] * cs, h = cs * q[1] * up, by = y + cs * 0.14, w = cs * 0.06, ol = Math.max(0.7, l * 0.4);
    if (BRK[i] < 6 - keep) {   // 2.11.5: обломанный шип — пенёк с неровным сколом
      var sc0 = id === 'garland' ? '#2c7a4b' : id === 'ginger' ? P.main : id === 'gift' ? '#ffffff' : id === 'royal' ? '#e0b040' : '#cfeaf8', hs = cs * q[1] * 0.28;
      D.poly([sx - w, by, sx - w * 0.75, by - hs, sx - w * 0.2, by - hs * 1.35, sx + w * 0.15, by - hs * 0.9, sx + w * 0.7, by - hs * 1.2, sx + w, by], sc0, ol); return; }
    if (id === 'garland') { for (var k = 0; k < 3; k++) D.poly([sx - w * (1.4 - k * 0.35), by - h * k * 0.3, sx, by - h * (0.45 + k * 0.28), sx + w * (1.4 - k * 0.35), by - h * k * 0.3], k % 2 ? '#3c9a5f' : P.main, ol); if (i % 2 === 0) D.circ(sx, by - h * 0.35, cs * 0.022, BULB[i % 4]); return; }
    var fill = id === 'base' ? G2(c, sx - w, 0, sx + w, 0, '#ffffff', '#8fd0f0') : id === 'crystal' ? G2(c, sx - w, 0, sx + w, 0, '#ffffff', P.main) : id === 'royal' ? G2(c, sx - w, 0, sx + w, 0, '#fff1a8', '#c98a1c') : P.main;
    D.poly([sx - w, by, sx, by - h, sx + w, by], fill, ol);
    if (id === 'gift') { c.save(); c.beginPath(); c.moveTo(sx - w, by); c.lineTo(sx, by - h); c.lineTo(sx + w, by); c.closePath(); c.clip(); c.strokeStyle = '#ffffff'; c.lineWidth = cs * 0.025; for (var st = 0; st < 5; st++) { c.beginPath(); c.moveTo(sx - w * 2, by - h * st * 0.22); c.lineTo(sx + w * 2, by - h * st * 0.22 - h * 0.14); c.stroke(); } c.restore(); D.poly([sx - w, by, sx, by - h, sx + w, by], null, ol); }
    if (id === 'ginger') { D.poly([sx - w * 0.35, by - h * 0.7, sx, by - h, sx + w * 0.35, by - h * 0.7], P.hi); D.circ(sx, by - h * 0.4, cs * 0.012, '#e8484f'); }
    if (id === 'royal' && i === 1) D.circ(sx, by - h * 0.35, cs * 0.022, P.acc);
  });
  if (id === 'gift') bow(c, x - cs * 0.3, y + cs * 0.04, cs * 0.06, P.acc);
  if (act > 0.3) { c.globalAlpha = act; for (var k = 0; k < 5; k++) { var a = -Math.PI / 2 + (k - 2) * 0.4; D.circ(x + Math.cos(a) * cs * 0.35, y - cs * 0.2 + Math.sin(a) * cs * 0.25, cs * 0.03, id === 'base' ? '#ffffff' : P.acc); } c.globalAlpha = 1; }
};
TR.puddle = function (c, tr, x, y, cs, t, l, act, P, id) {   // лужа: лёд / вишнёвое желе / карамель / хрусталь / лёд в хвойном венке / золотой лёд
  var col = { base: ['#dff6ff', '#7fc8ee', '#2f6f9e'], gift: ['#ffd0d4', '#e8484f', '#9a1e2a'], ginger: ['#ffd9a0', '#d08a3a', '#7a4a20'], crystal: ['#ffffff', '#9fe8ff', '#2f7fb0'], garland: ['#dff6ff', '#7fc8ee', '#174a2c'], royal: ['#fff6c8', '#ffd54a', '#a8780c'] }[id] || ['#dff6ff', '#7fc8ee', '#2f6f9e'];
  if (id === 'garland') { for (var g = 0; g < 14; g++) { var a = g / 14 * Math.PI * 2; D.ell(x + Math.cos(a) * cs * 0.46, y + cs * 0.1 + Math.sin(a) * cs * 0.26, cs * 0.07, cs * 0.04, g % 2 ? '#2c7a4b' : '#3c9a5f'); } }
  c.beginPath(); c.ellipse(x, y + cs * 0.1, cs * 0.44, cs * 0.24, 0, 0, 7); c.fillStyle = G2(c, x - cs * 0.4, y, x + cs * 0.4, y + cs * 0.2, col[0], col[1]); c.fill(); c.lineWidth = l * 0.8; c.strokeStyle = col[2]; c.stroke();
  if (id === 'royal') { c.lineWidth = l * 1.4; c.strokeStyle = '#ffd54a'; c.stroke(); for (var gm = 0; gm < 4; gm++) { var a2 = gm / 4 * Math.PI * 2 + 0.4; D.circ(x + Math.cos(a2) * cs * 0.44, y + cs * 0.1 + Math.sin(a2) * cs * 0.24, cs * 0.03, P.acc, 1); } }
  c.save(); c.beginPath(); c.ellipse(x, y + cs * 0.1, cs * 0.44, cs * 0.24, 0, 0, 7); c.clip();
  c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = Math.max(1, l * 0.5); c.beginPath(); c.moveTo(x - cs * 0.2, y + cs * 0.02); c.lineTo(x - cs * 0.05, y + cs * 0.12); c.lineTo(x + cs * 0.12, y + cs * 0.05); c.moveTo(x - cs * 0.05, y + cs * 0.12); c.lineTo(x - cs * 0.02, y + cs * 0.24); c.stroke();
  if (id === 'ginger') for (var d = 0; d < 6; d++) D.circ(x - cs * 0.25 + d * cs * 0.1, y + cs * 0.18 - (d % 2) * cs * 0.1, cs * 0.018, '#fffaf2');
  var sw = ((t * 0.5 + x * 0.01) % 1.6 - 0.3) * cs; c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(x - cs * 0.45 + sw, y + cs * 0.4); c.lineTo(x - cs * 0.3 + sw, y - cs * 0.2); c.lineTo(x - cs * 0.22 + sw, y - cs * 0.2); c.lineTo(x - cs * 0.37 + sw, y + cs * 0.4); c.fill();
  c.restore();
  D.ell(x - cs * 0.15, y + cs * 0.03, cs * 0.12, cs * 0.04, 'rgba(255,255,255,0.85)');
  if (id === 'gift') bow(c, x + cs * 0.36, y - cs * 0.04, cs * 0.06, P.acc);
  if (id === 'garland') for (var b = 0; b < 4; b++) { var a3 = b / 4 * Math.PI * 2 + t * 0.3, on = Math.sin(t * 3 + b) > -0.3; if (on) { c.globalAlpha = 0.35; D.circ(x + Math.cos(a3) * cs * 0.46, y + cs * 0.1 + Math.sin(a3) * cs * 0.26, cs * 0.06, BULB[b]); c.globalAlpha = 1; } D.circ(x + Math.cos(a3) * cs * 0.46, y + cs * 0.1 + Math.sin(a3) * cs * 0.26, cs * 0.025, on ? BULB[b] : '#556'); }
  if (id === 'crystal') { var sp = (Math.sin(t * 2.4 + x) + 1) / 2; if (sp > 0.6) { c.globalAlpha = (sp - 0.6) * 2.5; D.star(x + cs * 0.15, y + cs * 0.05, cs * 0.05, '#ffffff', 0); c.globalAlpha = 1; } }
  if (act > 0) { c.globalAlpha = act; c.strokeStyle = '#ffffff'; c.lineWidth = l; c.beginPath(); c.ellipse(x, y + cs * 0.1, cs * 0.44 * (1 + (1 - act) * 0.4), cs * 0.24 * (1 + (1 - act) * 0.4), 0, 0, 7); c.stroke(); c.globalAlpha = 1; }
};
TR.mine = function (c, tr, x, y, cs, t, l, act, P, id) {   // мина: бочонок / коробка-сюрприз / пряничный бочонок / ледяная сфера / ёлочный шар / золотая бомба с короной
  D.ell(x, y + cs * 0.14, cs * 0.24, cs * 0.08, 'rgba(30,40,80,0.25)');
  var fx = x + cs * 0.06, fy = y - cs * 0.31;
  if (id === 'gift') { D.rr(x - cs * 0.17, y - cs * 0.16, cs * 0.34, cs * 0.3, cs * 0.03); c.fillStyle = P.main; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke(); c.fillStyle = P.acc; c.fillRect(x - cs * 0.03, y - cs * 0.16, cs * 0.06, cs * 0.3); c.fillRect(x - cs * 0.17, y - cs * 0.04, cs * 0.34, cs * 0.05); bow(c, x, y - cs * 0.18, cs * 0.06, P.acc); fx = x + cs * 0.12; fy = y - cs * 0.3; }
  else if (id === 'crystal' || id === 'garland' || id === 'royal') {
    var g = c.createRadialGradient(x - cs * 0.06, y - cs * 0.06, cs * 0.02, x, y, cs * 0.18); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, id === 'garland' ? '#e8484f' : P.main); g.addColorStop(1, id === 'garland' ? '#8a1e2a' : P.dark);
    glowAt(c, x, y, cs * 0.35, P, 0.7 + 0.3 * Math.sin(t * 4));
    c.beginPath(); c.arc(x, y, cs * 0.17, 0, 7); c.fillStyle = g; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
    if (id === 'garland') { D.rr(x - cs * 0.06, y - cs * 0.22, cs * 0.12, cs * 0.06, cs * 0.015); c.fillStyle = '#d9b44a'; c.fill(); c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = l * 0.7; c.beginPath(); c.arc(x, y, cs * 0.11, 0.2, 1.3); c.stroke(); fy = y - cs * 0.32; }
    if (id === 'crystal') { var cc = 0.6 + 0.4 * Math.sin(t * 6); c.globalAlpha = cc; D.circ(x, y, cs * 0.06, '#ffffff'); c.globalAlpha = 1; }
    if (id === 'royal') { crownMini(c, x, y - cs * 0.15, cs * 0.08); fx = x + cs * 0.12; fy = y - cs * 0.25; }
  }
  else { D.rr(x - cs * 0.16, y - cs * 0.14, cs * 0.32, cs * 0.3, cs * 0.08); c.fillStyle = id === 'ginger' ? G2(c, x - cs * 0.16, 0, x + cs * 0.16, 0, '#d9a066', '#8a5a2a') : G2(c, x - cs * 0.16, 0, x + cs * 0.16, 0, '#ff6f6f', '#a01e2a'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
    if (id === 'ginger') { c.strokeStyle = '#fffaf2'; c.lineWidth = l * 0.8; for (var w = 0; w < 2; w++) { c.beginPath(); for (var z = 0; z <= 6; z++) { var zx = x - cs * 0.15 + z * cs * 0.05, zy = y - cs * 0.06 + w * cs * 0.12 + (z % 2 ? cs * 0.025 : 0); if (z) c.lineTo(zx, zy); else c.moveTo(zx, zy); } c.stroke(); } }
    else { c.fillStyle = '#3d3d4a'; c.fillRect(x - cs * 0.16, y - cs * 0.06, cs * 0.32, cs * 0.04); c.fillRect(x - cs * 0.16, y + cs * 0.06, cs * 0.32, cs * 0.04); D.circ(x, y, cs * 0.06, '#ffd54a', l * 0.5); D.text('!', x, y + cs * 0.005, cs * 0.1, OL, 'center', 'middle', 0); }
  }
  c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(x, y + cs * 0.15, cs * 0.24, cs * 0.06, 0, 0, Math.PI); c.fill();
  c.strokeStyle = '#3d3d3d'; c.lineWidth = l * 0.6; c.beginPath(); c.moveTo(fx - cs * 0.02, fy + cs * 0.17); c.quadraticCurveTo(fx + cs * 0.06, fy + cs * 0.07, fx, fy); c.stroke();
  var fl = 0.6 + 0.4 * Math.sin(t * 18 + x); c.globalAlpha = 0.5 * fl; D.circ(fx, fy - cs * 0.01, cs * 0.06, '#ffb347'); c.globalAlpha = 1; D.circ(fx, fy - cs * 0.01, cs * 0.02, '#fff3b0');
};
TR.snare = function (c, tr, x, y, cs, t, l, act, P, id) {   // капкан: дуги с зубьями в цвете облика
  var shut = act > 0 || (tr.hold > 0), rx = cs * 0.32, ry = cs * 0.15, cy = y + cs * 0.1, met = id === 'base' ? '#c9d2e3' : P.metal, tooth = id === 'ginger' ? '#fffaf2' : id === 'gift' ? '#ffffff' : '#eef2fa';
  D.ell(x, cy + cs * 0.03, rx * 1.1, ry * 1.15, 'rgba(30,40,80,0.22)');
  glowAt(c, x, cy, cs * 0.45, P, 0.6);
  if (!shut) {
    c.beginPath(); c.ellipse(x, cy, rx, ry, 0, 0, 7); c.strokeStyle = OL; c.lineWidth = l * 2.2; c.stroke(); c.strokeStyle = met; c.lineWidth = l * 1.2; c.stroke();
    if (id === 'gift') { c.setLineDash([cs * 0.05, cs * 0.05]); c.strokeStyle = '#ffffff'; c.lineWidth = l * 0.8; c.stroke(); c.setLineDash([]); }
    for (var k = 0; k < 12; k++) { var a = k / 12 * Math.PI * 2, ox = x + Math.cos(a) * rx, oy = cy + Math.sin(a) * ry, ix = x + Math.cos(a) * rx * 0.72, iy = cy + Math.sin(a) * ry * 0.62;
      D.poly([ox + Math.sin(a) * cs * 0.02, oy - Math.cos(a) * cs * 0.01, ix, iy, ox - Math.sin(a) * cs * 0.02, oy + Math.cos(a) * cs * 0.01], tooth, Math.max(0.6, l * 0.35)); }
    if (id === 'garland') for (var b = 0; b < 4; b++) { var a4 = b / 4 * Math.PI * 2 + 0.4; D.circ(x + Math.cos(a4) * rx, cy + Math.sin(a4) * ry, cs * 0.025, BULB[b]); }
    line(c, [x - rx * 0.9, cy, x + rx * 0.9, cy], id === 'base' ? '#6b7592' : P.dark, l * 0.8);
    if (id === 'royal') crownMini(c, x, cy + cs * 0.02, cs * 0.06); else D.ell(x, cy, cs * 0.07, cs * 0.04, id === 'gift' ? P.acc : '#ffd54a', l * 0.5);
  } else {
    line(c, [x - rx, cy, x + rx, cy], id === 'base' ? '#4a5070' : P.dark, l * 1.3);
    c.beginPath(); c.ellipse(x, cy, rx, cs * 0.26, 0, Math.PI, 0); c.strokeStyle = OL; c.lineWidth = l * 2; c.stroke(); c.strokeStyle = met; c.lineWidth = l * 1.1; c.stroke();
    for (var k2 = 1; k2 < 8; k2++) { var a2 = Math.PI + k2 / 8 * Math.PI, tx = x + Math.cos(a2) * rx, ty = cy + Math.sin(a2) * cs * 0.26; D.poly([tx - cs * 0.02, ty, tx, ty + cs * 0.06, tx + cs * 0.02, ty], tooth, Math.max(0.6, l * 0.35)); }
    if (act > 0.2) { c.globalAlpha = act; for (var q = 0; q < 4; q++) { var a3 = -Math.PI / 2 + (q - 1.5) * 0.5; line(c, [x + Math.cos(a3) * cs * 0.34, cy - cs * 0.22 + Math.sin(a3) * cs * 0.1, x + Math.cos(a3) * cs * 0.46, cy - cs * 0.28 + Math.sin(a3) * cs * 0.15], '#ffffff', l * 0.7); } c.globalAlpha = 1; }
  }
};
TR.lamp = function (c, tr, x, y, cs, t, l, act, P, id) {   // фонарь (освещает ночью): кованый столб, фонарь в стиле облика
  D.ell(x, y + cs * 0.14, cs * 0.22, cs * 0.07, 'rgba(30,40,80,0.25)');
  var post = id === 'base' ? '#3c4f8c' : id === 'ginger' ? '#a86a34' : id === 'gift' ? '#ffffff' : P.dark;
  line(c, [x, y + cs * 0.12, x, y - cs * 0.62, x + cs * 0.18, y - cs * 0.62], OL, l * 2.6); line(c, [x, y + cs * 0.12, x, y - cs * 0.62, x + cs * 0.18, y - cs * 0.62], post, l * 1.3);
  if (id === 'gift') { c.save(); c.beginPath(); c.rect(x - l, y - cs * 0.62, l * 2, cs * 0.74); c.clip(); c.strokeStyle = '#e8484f'; c.lineWidth = l * 1.1; for (var st = 0; st < 8; st++) { c.beginPath(); c.moveTo(x - l * 2, y - cs * 0.6 + st * cs * 0.1); c.lineTo(x + l * 2, y - cs * 0.65 + st * cs * 0.1); c.stroke(); } c.restore(); }
  if (id === 'garland') { c.strokeStyle = '#2c7a4b'; c.lineWidth = l * 1.2; c.beginPath(); for (var g = 0; g <= 8; g++) { var gy = y + cs * 0.1 - g * cs * 0.08; c.lineTo(x + Math.sin(g * 1.6) * cs * 0.04, gy); } c.stroke(); }
  D.ell(x, y + cs * 0.12, cs * 0.08, cs * 0.03, post, l * 0.6);
  var lx = x + cs * 0.18, ly = y - cs * 0.46, fl = 0.85 + 0.15 * Math.sin(t * 9 + x) * Math.sin(t * 5.3), lc = id === 'crystal' ? '#bfefff' : id === 'garland' ? '#fff3a0' : '#ffd27a';
  c.globalAlpha = 0.35 * fl; D.circ(lx, ly, cs * 0.32, lc); c.globalAlpha = 1;
  line(c, [lx, y - cs * 0.62, lx, ly - cs * 0.14], OL, l * 0.7);
  if (id === 'crystal') { D.poly([lx, ly - cs * 0.16, lx + cs * 0.09, ly, lx, ly + cs * 0.14, lx - cs * 0.09, ly], 'rgba(220,250,255,0.95)', l * 0.8); D.circ(lx, ly, cs * 0.04 * fl, '#ffffff'); }
  else if (id === 'ginger') { D.rr(lx - cs * 0.09, ly - cs * 0.12, cs * 0.18, cs * 0.22, cs * 0.04); c.fillStyle = 'rgb(255,' + Math.round(200 + 30 * fl) + ',110)'; c.fill(); c.lineWidth = l * 1.4; c.strokeStyle = '#a86a34'; c.stroke(); D.poly([lx - cs * 0.12, ly - cs * 0.12, lx, ly - cs * 0.22, lx + cs * 0.12, ly - cs * 0.12], '#c98a4e', l * 0.8); for (var d = 0; d < 3; d++) D.circ(lx - cs * 0.06 + d * cs * 0.06, ly - cs * 0.13, cs * 0.015, '#fffaf2'); }
  else { D.rr(lx - cs * 0.09, ly - cs * 0.12, cs * 0.18, cs * 0.22, cs * 0.04); c.fillStyle = 'rgb(255,' + Math.round(200 + 30 * fl) + ',110)'; c.fill(); c.lineWidth = l; c.strokeStyle = id === 'royal' ? '#a8780c' : OL; c.stroke();
    if (id === 'royal') crownMini(c, lx, ly - cs * 0.13, cs * 0.08); else D.poly([lx - cs * 0.11, ly - cs * 0.12, lx, ly - cs * 0.2, lx + cs * 0.11, ly - cs * 0.12], id === 'gift' ? '#e8484f' : '#3d3d3d', l * 0.8);
    if (id === 'gift') bow(c, lx, ly + cs * 0.11, cs * 0.04, '#ffd54a');
    D.circ(lx, ly, cs * 0.04 * fl, '#fffbe8'); }
};
TR.fw = function (c, tr, x, y, cs, t, l, act, P, id) {   // петарды: ящик-обёртка в стиле облика, ракетки и фитиль
  D.ell(x, y + cs * 0.14, cs * 0.26, cs * 0.08, 'rgba(30,40,80,0.25)');
  var box = id === 'base' ? '#9a6a3a' : id === 'crystal' ? '#bfe9ff' : P.main;
  var cols = id === 'royal' ? ['#ffd54a', '#b3203a', '#ffd54a', '#b3203a'] : id === 'garland' ? ['#e8484f', '#ffd54a', '#5ac8ff', '#9dff6a'] : id === 'ginger' ? ['#fffaf2', '#e8484f', '#fffaf2', '#4cc77d'] : ['#e8484f', '#4aa3ff', '#ffd54a', '#4cc77d'];
  var dF = (Z.TRAPS.fw || {}).uses || 1, nR = tr.uses == null ? 4 : Math.max(0, Math.min(4, Math.ceil(4 * tr.uses / dF)));
  for (var i = 0; i < 4; i++) { if (i >= nR) continue; var rx = x - cs * 0.14 + i * cs * 0.093, h = cs * (0.24 + (i % 2) * 0.07); D.rr(rx - cs * 0.035, y - cs * 0.06 - h, cs * 0.07, h, cs * 0.02); c.fillStyle = cols[i]; c.fill(); c.lineWidth = l * 0.7; c.strokeStyle = OL; c.stroke(); D.poly([rx - cs * 0.04, y - cs * 0.06 - h, rx, y - cs * 0.12 - h, rx + cs * 0.04, y - cs * 0.06 - h], '#ffffff', l * 0.5); }
  D.rr(x - cs * 0.22, y - cs * 0.08, cs * 0.44, cs * 0.22, cs * 0.03); c.fillStyle = box; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  if (id === 'gift') { c.fillStyle = P.acc; c.fillRect(x - cs * 0.025, y - cs * 0.08, cs * 0.05, cs * 0.22); bow(c, x, y - cs * 0.08, cs * 0.05, P.acc); }
  else if (id === 'ginger') { for (var d = 0; d < 5; d++) D.circ(x - cs * 0.16 + d * cs * 0.08, y + cs * 0.03, cs * 0.016, '#fffaf2'); }
  else if (id === 'garland') { for (var b = 0; b < 4; b++) D.circ(x - cs * 0.15 + b * cs * 0.1, y + cs * 0.03, cs * 0.022, BULB[b]); }
  else if (id === 'royal') { c.fillStyle = P.acc; c.fillRect(x - cs * 0.22, y + cs * 0.0, cs * 0.44, cs * 0.04); }
  else if (id === 'crystal') { c.globalAlpha = 0.7; D.ell(x - cs * 0.08, y - cs * 0.02, cs * 0.1, cs * 0.025, '#ffffff'); c.globalAlpha = 1; }
  else { c.fillStyle = 'rgba(60,35,15,0.45)'; c.fillRect(x - cs * 0.22, y + cs * 0.02, cs * 0.44, cs * 0.02); }
  c.strokeStyle = '#3d3d3d'; c.lineWidth = l * 0.7; c.beginPath(); c.moveTo(x + cs * 0.22, y + cs * 0.04); c.quadraticCurveTo(x + cs * 0.34, y, x + cs * 0.32, y - cs * 0.1); c.stroke();
};
// вражеский снеговик-часовой: злой снеговик в ледяном шлеме с пикой и фонарём-глазом — замедляет наших рядом
NEW.sentry = function (c, s, cs, t, l, ph) {
  D.circ(0, -cs * 0.22, cs * 0.27, '#e8eef9', l); D.circ(0, -cs * 0.6, cs * 0.19, '#e8eef9', l);
  c.strokeStyle = 'rgba(120,140,190,0.4)'; c.lineWidth = l * 0.6; c.beginPath(); c.arc(-cs * 0.05, -cs * 0.25, cs * 0.18, 2.4, 3.6); c.stroke();
  D.rr(-cs * 0.2, -cs * 0.45, cs * 0.4, cs * 0.08, cs * 0.04); c.fillStyle = '#5b4a73'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  D.poly([-cs * 0.06, -cs * 0.6, -cs * 0.18, -cs * 0.66, -cs * 0.06, -cs * 0.68], OL); D.poly([cs * 0.06, -cs * 0.6, cs * 0.18, -cs * 0.66, cs * 0.06, -cs * 0.68], OL);   // злые брови
  var gl = 0.6 + 0.4 * Math.sin(t * 5); c.globalAlpha = 0.5 * gl; D.circ(-cs * 0.07, -cs * 0.6, cs * 0.06, '#ff4060'); D.circ(cs * 0.07, -cs * 0.6, cs * 0.06, '#ff4060'); c.globalAlpha = 1;
  D.circ(-cs * 0.07, -cs * 0.6, cs * 0.028, '#ff4060'); D.circ(cs * 0.07, -cs * 0.6, cs * 0.028, '#ff4060');
  D.poly([0, -cs * 0.55, cs * 0.16, -cs * 0.52, 0, -cs * 0.5], '#ff8a3d', l * 0.5);
  D.poly([-cs * 0.2, -cs * 0.72, -cs * 0.14, -cs * 0.92, -cs * 0.05, -cs * 0.8, 0, -cs * 0.98, cs * 0.05, -cs * 0.8, cs * 0.14, -cs * 0.92, cs * 0.2, -cs * 0.72], G2(c, -cs * 0.2, 0, cs * 0.2, 0, '#e6faff', '#7fc8ee'), l * 0.8);
  line(c, [cs * 0.24, 0, cs * 0.3, -cs * 1.0], OL, l * 1.8); line(c, [cs * 0.24, 0, cs * 0.3, -cs * 1.0], '#5b4a73', l * 0.9); D.poly([cs * 0.26, -cs * 1.0, cs * 0.31, -cs * 1.18, cs * 0.36, -cs * 0.99], '#bfe6ff', l * 0.6);
  line(c, [cs * 0.2, -cs * 0.28, cs * 0.28, -cs * 0.5], '#6a4628', l);
  c.globalAlpha = 0.1 + 0.04 * Math.sin(t * 3); D.circ(0, -cs * 0.3, cs * 1.6, '#5b4a73'); c.globalAlpha = 1;
};
})();
