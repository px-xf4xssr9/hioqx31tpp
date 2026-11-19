/* 2.11.5 · Ярмарочная карусель.
   Раньше карусель сама по себе раз в 20 секунд то ускоряла, то замедляла врагов в трёх клетках от себя — без единой подсказки,
   поэтому казалось, что она ничего не делает. Теперь это понятная помощница:
   - карусель копит силу (золотая дуга вокруг неё); когда готова — светится;
   - нажми на неё — она раскручивается, играет колокольчик, и у всех врагов в круге (круг виден на земле) кружится голова:
     над ними крутятся звёздочки, и они еле плетутся (великаны и сани — чуть меньше, летуны — нет);
   - если не нажимать, готовая карусель раскрутится сама, когда враги подойдут к ней близко.
   И сама карусель нарисована заново: полосатый купол с фестонами и огоньками, лошадки на золотых шестах скачут вверх-вниз. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, OL = D.OL || '#1b2448', TT = Z.TT || function (r, e) { return Z.LANG === 'en' ? e : r; };
var CHARGE = 13, SPIN = 6, RAD = 3.3, DIZZY = 2.6;
var HORSE = ['#ffffff', '#ffb3c8', '#a9d8ff', '#b9f0c8', '#fff09a', '#d9c2ff'];
function c() { return D.ctx; }
function snd(n, v) { try { var B = Z.AU.bufs || {}; if (B[n]) Z.AU.sfx(n, v || 0.6, { gap: 0.25, gapKey: n }); } catch (e) { if (window.__rep) window.__rep(e); } }
function battle(G) { return G.phase === 'wave' || G.phase === 'escortRun'; }
function lmOk(G) { return G && G.L && G.L.landmark && G.mech === 'carousel' && !G.endless; }
function center(G) { var lm = G.L.landmark; return { x: lm.c + 1, y: lm.r + 1.4 }; }
function epos(e) { return Z.enemyPos ? Z.enemyPos(e) : e; }

// ================= рисунок =================
// (x, y) — середина основания на земле, k — размер клетки, ang — угол поворота
D.carousel = function (x, y, k, ang, o) {
  o = o || {}; var ctx = c(), l = Math.max(1.1, k * 0.045), TAU = Math.PI * 2, t = Z.time || 0;
  var y0 = y - k * 0.22, prx = k * 0.92, pry = k * 0.26, ph = k * 0.15;          // помост
  var yr = y - k * 1.28, rrx = k * 1.0, rry = k * 0.25, yp = y - k * 1.92;       // купол
  var sp = o.spin || 0;
  // готова — золотое сияние на земле; копит — золотая дуга
  if (o.ready) { var pu = 0.5 + 0.5 * Math.sin(t * 4); ctx.save(); ctx.globalAlpha = 0.35 + 0.35 * pu; ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = l * (2 + pu); ctx.beginPath(); ctx.ellipse(x, y - k * 0.08, prx * 1.12, pry * 1.35, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
  else if (o.charge !== undefined && o.charge < 1) { ctx.save(); ctx.lineCap = 'round'; ctx.globalAlpha = 0.5; ctx.strokeStyle = 'rgba(27,36,72,0.5)'; ctx.lineWidth = l * 2.2; ctx.beginPath(); ctx.ellipse(x, y - k * 0.08, prx * 1.12, pry * 1.35, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 0.95; ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = l * 1.6; ctx.beginPath(); ctx.ellipse(x, y - k * 0.08, prx * 1.12, pry * 1.35, 0, Math.PI / 2, Math.PI / 2 + TAU * o.charge); ctx.stroke(); ctx.restore(); }
  // помост: красный бортик с золотыми заклёпками, сверху светлый настил
  ctx.beginPath(); ctx.moveTo(x - prx, y0); ctx.lineTo(x - prx, y0 + ph); ctx.ellipse(x, y0 + ph, prx, pry, 0, Math.PI, 0, true); ctx.lineTo(x + prx, y0); ctx.ellipse(x, y0, prx, pry, 0, 0, Math.PI, false); ctx.closePath();
  ctx.fillStyle = '#d8364a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  for (var d = 0; d < 7; d++) { var da = Math.PI * (0.1 + d * 0.8 / 6); D.circ(x + Math.cos(da) * prx * 0.98, y0 + ph * 0.55 + Math.sin(da) * pry, k * 0.035, '#ffd54a'); }
  D.ell(x, y0, prx, pry, '#f7e6c4', l);
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y0, prx * 0.98, pry * 0.96, 0, 0, TAU); ctx.clip(); ctx.strokeStyle = 'rgba(160,110,60,0.35)'; ctx.lineWidth = Math.max(1, l * 0.6); ctx.beginPath();
  for (var s = 0; s < 8; s++) { var sa = ang + s * TAU / 8; ctx.moveTo(x, y0); ctx.lineTo(x + Math.cos(sa) * prx, y0 + Math.sin(sa) * pry); } ctx.stroke(); ctx.restore();
  // лошадки: сначала задние, потом столб, потом передние
  var N = o.simple ? 4 : 6, rid = [];
  for (var i = 0; i < N; i++) { var a = ang + i * TAU / N; rid.push({ a: a, i: i, s: Math.sin(a) }); }
  rid.sort(function (p, q) { return p.s - q.s; });
  function rider(R) {
    var a = R.a, sn = R.s, sc = 0.84 + 0.16 * sn, px = x + Math.cos(a) * prx * 0.66, pb = y0 + sn * pry * 0.66, top = yr + sn * rry * 0.7;
    var bob = Math.sin(ang * 3 + R.i * 2.1) * k * 0.09, hy = pb - k * 0.5 + bob, u = k * 0.19 * sc, dir = sn > 0 ? -1 : 1, col = HORSE[R.i % HORSE.length];
    ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = l * 1.9 * sc; ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, pb); ctx.stroke();
    ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = l * 0.9 * sc; ctx.stroke();
    if (sn < -0.55 && !o.simple) return;   // за столбом лошадку почти не видно — только шест
    var gal = Math.sin(ang * 6 + R.i) * 0.25;
    ctx.strokeStyle = OL; ctx.lineWidth = l * 1.7 * sc; ctx.beginPath();
    ctx.moveTo(px + dir * u * 0.6, hy + u * 0.3); ctx.lineTo(px + dir * (u * 1.05 + gal * u), hy + u * 0.95);
    ctx.moveTo(px - dir * u * 0.6, hy + u * 0.3); ctx.lineTo(px - dir * (u * 1.0 - gal * u), hy + u * 0.9); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = l * 0.8 * sc; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px - dir * u * 0.85, hy - u * 0.1); ctx.quadraticCurveTo(px - dir * u * 1.4, hy + u * 0.1, px - dir * u * 1.25, hy + u * 0.6); ctx.strokeStyle = OL; ctx.lineWidth = l * 1.4 * sc; ctx.stroke(); ctx.strokeStyle = '#c98a3a'; ctx.lineWidth = l * 0.7 * sc; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + dir * u * 0.45, hy - u * 0.2); ctx.lineTo(px + dir * u * 0.95, hy - u * 0.95); ctx.lineTo(px + dir * u * 1.25, hy - u * 0.55); ctx.lineTo(px + dir * u * 0.85, hy + u * 0.05); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = l * 0.8 * sc; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke();
    D.ell(px, hy, u, u * 0.5, col, l * 0.8 * sc);
    D.poly([px + dir * u * 0.98, hy - u * 1.02, px + dir * u * 0.9, hy - u * 1.38, px + dir * u * 1.12, hy - u * 1.08], col, l * 0.7 * sc);
    ctx.beginPath(); ctx.ellipse(px + dir * u * 1.22, hy - u * 0.84, u * 0.45, u * 0.25, dir * 0.55, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = l * 0.8 * sc; ctx.strokeStyle = OL; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + dir * u * 0.95, hy - u * 1.08); ctx.quadraticCurveTo(px + dir * u * 0.45, hy - u * 0.9, px + dir * u * 0.35, hy - u * 0.3); ctx.strokeStyle = '#c98a3a'; ctx.lineWidth = l * 1.1 * sc; ctx.stroke();
    D.rr(px - u * 0.38, hy - u * 0.62, u * 0.76, u * 0.3, u * 0.1); ctx.fillStyle = R.i % 2 ? '#3f6fc0' : '#d8364a'; ctx.fill(); ctx.lineWidth = l * 0.6 * sc; ctx.strokeStyle = OL; ctx.stroke();
    if (k > 26) D.circ(px + dir * u * 1.18, hy - u * 0.95, Math.max(0.8, u * 0.06), OL);
  }
  rid.forEach(function (R) { if (R.s < 0) rider(R); });
  // столб: золотой с красной спиралью
  var cw = k * 0.1; D.rr(x - cw, yr, cw * 2, y0 - yr, cw * 0.4); ctx.fillStyle = '#ffd54a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.rect(x - cw, yr, cw * 2, y0 - yr); ctx.clip(); ctx.strokeStyle = '#d8364a'; ctx.lineWidth = cw * 0.7; ctx.beginPath();
  var sh = ((ang * k * 0.25) % (k * 0.3) + k * 0.3) % (k * 0.3); for (var q = yr - k * 0.3 + sh; q < y0 + k * 0.3; q += k * 0.3) { ctx.moveTo(x - cw * 1.2, q + k * 0.12); ctx.lineTo(x + cw * 1.2, q - k * 0.12); } ctx.stroke(); ctx.restore();
  rid.forEach(function (R) { if (R.s >= 0) rider(R); });
  // купол: красно-белые клинья (крутятся вместе с каруселью)
  var M = o.simple ? 10 : 14, rim = [];
  for (var j = 0; j <= M; j++) { var ra = Math.PI * j / M; rim.push([x + Math.cos(ra) * rrx, yr + Math.sin(ra) * rry]); }
  var off = ((ang / (TAU / M)) % 2 + 2) % 2 >= 1 ? 1 : 0;
  ctx.lineJoin = 'round';
  for (j = 0; j < M; j++) { ctx.beginPath(); ctx.moveTo(x, yp); ctx.lineTo(rim[j][0], rim[j][1]); ctx.lineTo(rim[j + 1][0], rim[j + 1][1]); ctx.closePath(); ctx.fillStyle = (j + off) % 2 ? '#fff6ea' : '#e8384f'; ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(x, yp); ctx.lineTo(rim[0][0], rim[0][1]); for (j = 1; j <= M; j++) ctx.lineTo(rim[j][0], rim[j][1]); ctx.closePath(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  // блик на куполе
  ctx.save(); ctx.globalAlpha = 0.28; ctx.beginPath(); ctx.moveTo(x - k * 0.05, yp + k * 0.08); ctx.lineTo(x - rrx * 0.62, yr - k * 0.02); ctx.lineTo(x - rrx * 0.4, yr + k * 0.05); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
  // фестоны и огоньки по краю купола
  for (j = 0; j < M; j++) {
    var p1 = rim[j], p2 = rim[j + 1], mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2, hw = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 2;
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.quadraticCurveTo(mx, my + k * 0.2, p2[0], p2[1]); ctx.closePath(); ctx.fillStyle = j % 2 ? '#3f6fc0' : '#ffd54a'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
  }
  for (j = 0; j <= M; j++) {
    var on = o.lights === false ? 0.4 : 0.55 + 0.45 * Math.sin(t * (3 + sp * 5) + j * 1.3);
    if (!o.simple && on > 0.75 && k > 20) { ctx.save(); ctx.globalAlpha = (on - 0.75) * 1.6; D.circ(rim[j][0], rim[j][1], k * 0.11, 'rgba(255,240,150,0.6)'); ctx.restore(); }
    D.circ(rim[j][0], rim[j][1], Math.max(1, k * 0.045), on > 0.7 ? '#fff6b0' : '#e9c25a');
  }
  // верхушка: шарик и флажок
  D.circ(x, yp, k * 0.075, '#ffd54a', l * 0.8);
  if (!o.nest) { var fw = Math.sin(t * 5) * k * 0.05; ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(x, yp - k * 0.05); ctx.lineTo(x, yp - k * 0.42); ctx.stroke();
    D.poly([x, yp - k * 0.42, x + k * 0.34, yp - k * 0.34 + fw, x, yp - k * 0.24], '#e8384f', l * 0.7); }
  // раскрутилась: вихрь и искорки
  if (sp > 0.05) {
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = l * 1.4;
    for (var w = 0; w < 3; w++) { var wa = -ang * 1.3 + w * TAU / 3; ctx.globalAlpha = 0.55 * sp; ctx.beginPath(); ctx.ellipse(x, y - k * 0.62, prx * 1.25, pry * 1.5, 0, wa, wa + 1.1); ctx.stroke(); }
    for (w = 0; w < 5; w++) { var za = ang * 0.7 + w * 1.26, zr = (t * 0.8 + w * 0.2) % 1; ctx.globalAlpha = sp * (1 - zr); D.star(x + Math.cos(za) * prx * (1.1 + zr * 0.4), y - k * 0.7 - zr * k * 0.9 + Math.sin(za) * pry, k * 0.08, '#ffe066', 0); }
    ctx.restore();
  }
};

// ================= механика =================
function carInit(G) { return { st: 'charge', t: 0, ang: 0, spd: 0.6, spin: 0, tipped: false, said: 0 }; }
function enemiesIn(G, cx, cy, R) { return G.enemies.filter(function (e) { if (e.dead || e.air || e.neutral) return false; var p = epos(e); return Math.hypot(p.x - cx, p.y - cy) < R; }); }
function startSpin(G, byTap) {
  var C = G.car, ce = center(G); C.st = 'spin'; C.t = 0; C.said = 0;
  snd('bell', 0.8); snd('magic_ball', 0.45);
  if (!C.shown) { C.shown = 1; G.banner = { text: TT('Карусель закружилась!', 'The carousel is spinning!'), sub: TT('У врагов в круге кружится голова — они еле плетутся', 'Enemies inside the circle get dizzy and barely move'), t: 3 }; }
  if (Z._ && Z._.addText) Z._.addText(byTap ? TT('Кружись!', 'Spin!') : TT('Раскрутилась!', 'Spinning!'), ce.x, ce.y - 2.2, '#ffe066', 1, 0.9);
}
function carTick(G, dt) {
  var C = G.car, ce = center(G), fight = battle(G);
  if (C.st === 'charge') { if (fight) C.t += dt; if (C.t >= CHARGE) { C.st = 'ready'; C.t = 0; snd('star', 0.4); } }
  else if (C.st === 'ready') { C.t += dt; if (fight && C.t > 4 && enemiesIn(G, ce.x, ce.y, RAD - 0.4).length >= 2) startSpin(G, false); }
  else if (C.st === 'spin') {
    C.t += dt; if (C.t >= SPIN) { C.st = 'charge'; C.t = 0; }
    enemiesIn(G, ce.x, ce.y, RAD).forEach(function (e) { e.dizzyT = Math.max(e.dizzyT || 0, DIZZY); if (!C.said && Z._ && Z._.addText) { C.said = 1; var p = epos(e); Z._.addText(TT('Голова кружится!', 'So dizzy!'), p.x, p.y - 1.1, '#ffd0f0', 0.85, 0.9); } });
  }
  var want = C.st === 'spin' ? 5.2 : C.st === 'ready' ? 1.1 : 0.55;
  C.spd += (want - C.spd) * Math.min(1, dt * 1.6); C.ang += C.spd * dt;
  C.spin += ((C.st === 'spin' ? 1 : 0) - C.spin) * Math.min(1, dt * 3);
  G.enemies.forEach(function (e) { if (e.dizzyT > 0) e.dizzyT -= dt; });
  // подсказка в начале уровня
  if (!C.tipped && (G.t || 0) > 2.5 && !(G.banner && G.banner.t > 0)) { C.tipped = true; G.banner = { text: TT('Ярмарочная карусель', 'Fair carousel'), sub: TT('Наберёт силу — нажми на неё: закружит врагов рядом', 'When charged, tap it to make nearby enemies dizzy'), t: 3.4 }; }
}
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!lmOk(G)) return;
  try { if (!G.car) G.car = carInit(G); carTick(G, dt); } catch (e) { if (window.__rep) window.__rep(e); }
};
var oSpeed = Z.hk.speed;
Z.hk.speed = function (e, pos, k) {
  var r = oSpeed ? oSpeed(e, pos, k) : k;
  if (e.dizzyT > 0 && !e.air) r *= e.boss ? 0.7 : e.vehicle ? 0.6 : (Z.ENEMIES[e.type] && Z.ENEMIES[e.type].size >= 1.4) ? 0.6 : 0.4;
  return r;
};
// 2.12.37: готовая карусель — над ней прыгает «Нажми!» с пальцем (раньше было только свечение — непонятно, что делать);
// пока копит силу — «Копит силу N %» (круг действия рисуется ниже)
var oOverC = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  if (oOverC) oOverC(ctx, X, Y, cs, t);
  var G = Z.G; if (!lmOk(G) || !G.car || UI.screen !== 'level') return;
  try {
    var C = G.car, ce = center(G), x = X(ce.x), y = Y(ce.y - (G.L.lmLift || 0)) - cs * 2.0;
    if (C.st === 'ready' && battle(G)) {
      var b = Math.abs(Math.sin(t * 4)) * cs * 0.12, l = TT('Нажми!', 'Tap!');
      D.text(l, x, y - b, Math.max(12, cs * 0.34), '#ffe066', 'center', 'middle', 3);
    } else if (C.st === 'charge' && battle(G)) {
      var l2 = TT('Копит силу ', 'Charging ') + Math.round(C.t / CHARGE * 100) + '%';
      ctx.save(); ctx.globalAlpha = 0.8; D.text(l2, x, y, Math.max(9, cs * 0.2), '#fff', 'center', 'middle', 2); ctx.restore();
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
};
// нажатие по карусели (по куполу и лошадкам; гнездо сорок на макушке — их)
var oTap = UI.tapHook;
UI.tapHook = function (wx, wy, px, py) {
  var G = Z.G;
  if (G && UI.screen === 'level' && lmOk(G) && G.car) {
    var lm = G.L.landmark, base = lm.r + 1.67 - (G.L.lmLift || 0);
    if (Math.abs(wx - (lm.c + 1)) < 1.05 && wy > base - 1.55 && wy < base + 0.35) {
      var C = G.car;
      if (C.st === 'ready' && battle(G)) { startSpin(G, true); return true; }
      if (C.st === 'ready' || C.st === 'charge') { snd('error', 0.3); if (Z._ && Z._.addText) Z._.addText(C.st === 'ready' ? TT('Сначала враги!', 'Wait for enemies!') : TT('Набирает силу…', 'Charging…'), lm.c + 1, base - 2.1, '#fff', 0.8, 0.8); return true; }
      return true;
    }
  }
  return oTap ? oTap.apply(this, arguments) : false;
};
// круг действия и звёздочки над закружившимися
var oOver = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  if (oOver) oOver(ctx, X, Y, cs, t);
  var G = Z.G; if (!lmOk(G) || !G.car) return;
  try {
    var C = G.car, ce = center(G);
    var show = C.spin > 0.05 ? C.spin : C.st === 'ready' && battle(G) ? 0.35 : 0;
    if (show > 0) {
      ctx.save(); ctx.globalAlpha = 0.55 * show; ctx.strokeStyle = '#ffe066'; ctx.lineWidth = Math.max(1.5, cs * 0.05); ctx.setLineDash([cs * 0.28, cs * 0.18]); ctx.lineDashOffset = -C.ang * cs * 0.5;
      ctx.beginPath(); ctx.arc(X(ce.x), Y(ce.y), cs * RAD, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.1 * show; ctx.fillStyle = '#ffe9a0'; ctx.fill(); ctx.restore();
    }
    G.enemies.forEach(function (e) {
      if (!(e.dizzyT > 0) || e.dead) return;
      var p = epos(e), sz = (Z.ENEMIES[e.type] && Z.ENEMIES[e.type].size) || 1, hx = X(p.x), hy = Y(p.y - (e._lf || 0)) - cs * (0.62 + 0.3 * sz), al = Math.min(1, e.dizzyT * 2);
      ctx.save(); ctx.globalAlpha = al;
      for (var s = 0; s < 3; s++) { var a = t * 6 + s * 2.09; D.star(hx + Math.cos(a) * cs * 0.24 * sz, hy + Math.sin(a) * cs * 0.07, cs * 0.075, s === 1 ? '#ffb3e6' : '#ffe066', Math.max(0.8, cs * 0.012)); }
      ctx.restore();
    });
  } catch (er) { if (window.__rep) window.__rep(er); }
};
})();
