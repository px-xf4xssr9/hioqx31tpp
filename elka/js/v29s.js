/* 2.11.5 · нейтральные звери: у каждого своя загадка, выбор и последствия (звуки — ElevenLabs, a_*).
   МЕДВЕДЬ («Берлога великана»): спит у берлоги. Шум рядом (мортира, гирлянда-тесла, пулемёт, бомба, тычки) будит его злым —
     бьёт всех вокруг, и врагов, и наши вышки. Если до прихода Великана медведя ни разу не разозлили — проснётся отдохнувшим
     и пойдёт драться с Великаном; разозлили один раз — проснётся ворчуном и только охраняет берлогу; дважды — обиделся и спит.
   БОБРЫ («Бобровая плотина»): между делом грызут деревья и роняют брёвна на дорогу — брёвна тормозят всех, и врагов, и наши сани
     (бревно можно откатить нажатием). Вышка у самой плотины — бобры её подгрызают. Прорвёшь плотину (мощная волна) — бобры без дома, уходят.
   СОРОКИ («Ярмарка»): тащат блестящее у всех — у разбойников бочки (бабах!), у енотов инструменты, у нас монеты.
     Отбить монеты (нажать на сороку с монетой) — сразу вернёшь, но сороки обидятся и будут воровать чаще. Стерпеть три раза —
     подружатся: вернут монеты вдвое и будут таскать только у врагов.
   СОВЫ («Ледяные пещеры»): сидя спокойно, подсвечивают врагов в темноте. Шумные вышки и фонари рядом пугают — сова перелетает;
     напугать четыре раза — совы покидают пещеры.
   ЛИСА («Околица»): хитрая — смотрит, кто сильнее. Враги гибнут рядом с ней — уважает тебя и начинает охотиться на енотов;
     враги проходят мимо невредимыми — переходит к ним и ворует наши монеты. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, OL = D.OL || '#1b2448', TT = Z.TT || function (r, e) { return Z.LANG === 'en' ? e : r; };
var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// 2.11.5: высота земли под зверем (плато, гора) — рисуем его на верху плато, а не на нижнем уровне; переход плавный
Z.gLift = function (x, y) { var G = Z.G, L = G && G.L; if (!L) return 0; var c = Math.floor(x), r = Math.floor(y); return ((L.hgt && L.hgt[r] && L.hgt[r][c]) ? 0.32 : 0) + (Z.cellLift ? Z.cellLift(c, r) : 0); };
Z.oLift = function (o) { var tg = Z.gLift(o.x, o.y); o._lf = o._lf === undefined ? tg : o._lf + (tg - o._lf) * 0.25; return o._lf; };
function snd(n, v) { try { var B = Z.AU.bufs || {}; if (B[n]) Z.AU.sfx(n, v || 0.6, { gap: 0.25, gapKey: n }); } catch (e) { if (window.__rep) window.__rep(e); } }
function say(txt, x, y, col, sz) { if (Z._ && Z._.addText) Z._.addText(txt, x, y, col || '#fff', sz || 0.9, 0.8); }
function banner(good, title, sub) { var G = Z.G; if (!G) return; G.banner = { text: title, sub: sub, t: 3.2 }; snd(good ? 'a_trust_up' : 'a_trust_down', 0.7); }
function battle(G) { return G.phase === 'wave' || G.phase === 'escortRun'; }
function epos(e) { return Z.enemyPos ? Z.enemyPos(e) : e; }
function alive(G, f) { return G.enemies.filter(function (e) { return !e.dead && !e.neutral && (!f || f(e)); }); }
function near(G, x, y, r, f) { return alive(G, function (e) { if (f && !f(e)) return false; var p = epos(e); return Math.hypot(p.x - x, p.y - y) < r; }); }
function lm(G) { return G.L.landmark; }
function freeCell(G, c, r) { var L = G.L; return L.grid[r] && L.grid[r][c] === 0 && !G.towers[r * L.W + c]; }
function towersNear(G, x, y, r) { var o = []; for (var k in G.towers) { var tw = G.towers[k]; if (Math.hypot(tw.c + 0.5 - x, tw.r + 0.5 - y) < r) o.push(tw); } return o; }
var SMALL = { raccoon: 1, thrower: 1, sculptor: 1, engineer: 1, splitkid: 1, icicle: 1, hare: 1 };

// ================= рисунки =================
function C() { return D.ctx; }
function lw(R) { return Math.max(1.2, R * 0.09); }
function G2(x0, y0, x1, y1, a, b) { var g = C().createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
D.bear = function (x, y, R, o) {
  var c = C(), l = lw(R), t = Z.time, d = o.dir || 1, br = 1 + Math.sin(t * 1.4) * 0.03;
  c.save(); c.translate(x, y); c.scale(d, 1);
  D.ell(0, 0, R * 1.05, R * 0.22, 'rgba(30,40,80,0.22)');
  if (o.mode === 'sleep') {
    var tw = o.toss || 0; c.rotate(Math.sin(t * 9) * 0.03 * tw);
    c.save(); c.scale(1, br);
    D.ell(-R * 0.1, -R * 0.42, R * 0.95, R * 0.48, G2(0, -R * 0.9, 0, 0, '#9a6a42', '#5e3c22'), l);   // спина
    D.ell(-R * 0.75, -R * 0.2, R * 0.28, R * 0.22, '#7a5232', l * 0.8);   // задняя лапа
    c.restore();
    D.ell(R * 0.55, -R * 0.12, R * 0.3, R * 0.14, '#7a5232', l * 0.8);   // передние лапы под головой
    D.circ(R * 0.62, -R * 0.38, R * 0.36, G2(0, -R * 0.7, 0, 0, '#a8774c', '#6a4628'), l);   // голова
    D.circ(R * 0.42, -R * 0.68, R * 0.12, '#7a5232', l * 0.7); D.circ(R * 0.42, -R * 0.68, R * 0.06, '#c99a70');
    D.ell(R * 0.88, -R * 0.3, R * 0.17, R * 0.13, '#d8b08a', l * 0.7); D.circ(R * 0.99, -R * 0.34, R * 0.05, OL);
    c.strokeStyle = OL; c.lineWidth = l * 0.8; c.lineCap = 'round';
    if (tw > 0.5) { D.eyeR(R * 0.66, -R * 0.45, R * 0.06, 0.3); } else { c.beginPath(); c.arc(R * 0.66, -R * 0.46, R * 0.07, 0.3, Math.PI - 0.3); c.stroke(); }
    var zq = (t * 0.45) % 1; c.globalAlpha = (1 - zq) * (tw > 0.5 ? 0.3 : 1); D.text('Z', R * 0.8 + zq * R * 0.4, -R * 0.9 - zq * R * 0.7, R * (0.25 + zq * 0.15), '#ffffff', 'center', 'middle', 2); c.globalAlpha = 1;
    if (tw > 0.5) { c.globalAlpha = Math.min(1, (tw - 0.5) * 2); D.text('?!', R * 0.4, -R * 1.05, R * 0.32, '#ffd54a', 'center', 'middle', 2); c.globalAlpha = 1; }
  } else {
    var walk = o.walk || 0, sw = o.swipe || 0, angry = o.mode === 'angry';
    var leg = function (lx, ph) { var a = Math.sin(walk * 6 + ph) * 0.35; c.save(); c.translate(lx, -R * 0.35); c.rotate(a); D.rr(-R * 0.13, 0, R * 0.26, R * 0.4, R * 0.1); c.fillStyle = '#6a4628'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke(); c.restore(); };
    leg(-R * 0.55, 0); leg(R * 0.35, 2);
    D.ell(-R * 0.05, -R * 0.62, R * 0.85, R * 0.48, G2(0, -R * 1.1, 0, -R * 0.15, '#a8774c', '#5e3c22'), l);
    D.ell(R * 0.1, -R * 0.55, R * 0.45, R * 0.28, 'rgba(255,220,180,0.25)');
    leg(-R * 0.35, 3);
    // передняя лапа — замах
    c.save(); c.translate(R * 0.45, -R * 0.55); c.rotate(-sw * 1.6 + Math.sin(walk * 6 + 1) * 0.3 * (1 - sw)); D.rr(-R * 0.13, 0, R * 0.26, R * 0.45, R * 0.1); c.fillStyle = '#7a5232'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
    if (sw > 0.3) { c.strokeStyle = '#fffbe8'; c.lineWidth = l * 0.7; for (var cl = 0; cl < 3; cl++) { c.beginPath(); c.moveTo(-R * 0.08 + cl * R * 0.08, R * 0.43); c.lineTo(-R * 0.08 + cl * R * 0.08, R * 0.53); c.stroke(); } }
    c.restore();
    if (sw > 0.5) { c.globalAlpha = (sw - 0.5) * 2; c.strokeStyle = '#ffffff'; c.lineWidth = l * 1.2; for (var s2 = 0; s2 < 3; s2++) { c.beginPath(); c.arc(R * 0.6, -R * 0.5, R * (0.6 + s2 * 0.1), -1.2, 0.4); c.stroke(); } c.globalAlpha = 1; }
    // голова
    var hx = R * 0.72, hy = -R * 0.95;
    D.circ(hx - R * 0.2, hy - R * 0.28, R * 0.13, '#7a5232', l * 0.7); D.circ(hx + R * 0.15, hy - R * 0.3, R * 0.13, '#7a5232', l * 0.7);
    D.circ(hx, hy, R * 0.36, G2(0, hy - R * 0.36, 0, hy + R * 0.3, '#b08050', '#6a4628'), l);
    D.ell(hx + R * 0.22, hy + R * 0.1, R * 0.18, R * 0.13, '#d8b08a', l * 0.7); D.circ(hx + R * 0.34, hy + R * 0.05, R * 0.055, OL);
    D.eyeR(hx - R * 0.02, hy - R * 0.08, R * 0.07, 1); D.eyeR(hx + R * 0.16, hy - R * 0.1, R * 0.06, 1);
    c.strokeStyle = OL; c.lineWidth = l * 0.9;
    if (angry) { c.beginPath(); c.moveTo(hx - R * 0.12, hy - R * 0.24); c.lineTo(hx + R * 0.06, hy - R * 0.16); c.moveTo(hx + R * 0.1, hy - R * 0.17); c.lineTo(hx + R * 0.26, hy - R * 0.26); c.stroke();
      D.ell(hx + R * 0.22, hy + R * 0.22, R * 0.1, R * 0.06, '#5a1a22', l * 0.5); c.fillStyle = '#fff'; c.fillRect(hx + R * 0.15, hy + R * 0.17, R * 0.04, R * 0.04); c.fillRect(hx + R * 0.25, hy + R * 0.17, R * 0.04, R * 0.04);
      c.globalAlpha = 0.25 + 0.15 * Math.sin(t * 10); D.circ(0, -R * 0.7, R * 1.1, '#ff5a5a'); c.globalAlpha = 1; }
    else { c.beginPath(); c.arc(hx + R * 0.2, hy + R * 0.18, R * 0.08, 0.2, Math.PI - 0.2); c.stroke(); if (o.mode === 'ally') { c.globalAlpha = 0.3; D.circ(hx - R * 0.12, hy + R * 0.08, R * 0.07, '#ff8a8a'); c.globalAlpha = 1; } }
  }
  c.restore();
};
D.beaver = function (x, y, R, o) {
  var c = C(), l = lw(R), t = Z.time, d = o.dir || 1, chew = o.chew ? Math.sin(t * 22) * R * 0.04 : 0;
  c.save(); c.translate(x, y); c.scale(d, 1);
  D.ell(0, 0, R * 0.6, R * 0.15, 'rgba(30,40,80,0.2)');
  // хвост-весло с сеткой
  c.save(); c.translate(-R * 0.45, -R * 0.12); c.rotate(-0.25 + (o.slap ? Math.sin(t * 20) * 0.4 : 0)); D.ell(-R * 0.3, 0, R * 0.36, R * 0.14, '#5a4636', l);
  c.strokeStyle = 'rgba(30,20,10,0.5)'; c.lineWidth = l * 0.4; c.beginPath(); for (var k = -2; k <= 2; k++) { c.moveTo(-R * 0.55 + (k + 2) * R * 0.11, -R * 0.12); c.lineTo(-R * 0.45 + (k + 2) * R * 0.11, R * 0.12); } c.stroke(); c.restore();
  D.ell(0, -R * 0.42, R * 0.48, R * 0.42, G2(0, -R * 0.85, 0, 0, '#a8774c', '#6a4628'), l);
  D.ell(R * 0.1, -R * 0.36, R * 0.22, R * 0.26, '#d8b08a');
  D.ell(-R * 0.15, -R * 0.04, R * 0.14, R * 0.07, '#5a3a22', l * 0.6); D.ell(R * 0.22, -R * 0.04, R * 0.14, R * 0.07, '#5a3a22', l * 0.6);
  var hx = R * 0.32, hy = -R * 0.9 + chew;
  D.circ(hx - R * 0.15, hy - R * 0.2, R * 0.08, '#6a4628', l * 0.6); D.circ(hx + R * 0.12, hy - R * 0.22, R * 0.08, '#6a4628', l * 0.6);
  D.circ(hx, hy, R * 0.3, G2(0, hy - R * 0.3, 0, hy + R * 0.3, '#b08050', '#7a5232'), l);
  D.ell(hx + R * 0.15, hy + R * 0.08, R * 0.16, R * 0.12, '#d8b08a', l * 0.6); D.circ(hx + R * 0.26, hy + R * 0.02, R * 0.05, OL);
  D.rr(hx + R * 0.09, hy + R * 0.16, R * 0.12, R * 0.13, R * 0.02); c.fillStyle = '#ff9a3c'; c.fill(); c.lineWidth = l * 0.5; c.strokeStyle = OL; c.stroke(); c.beginPath(); c.moveTo(hx + R * 0.15, hy + R * 0.16); c.lineTo(hx + R * 0.15, hy + R * 0.29); c.stroke();
  D.eyeR(hx - R * 0.02, hy - R * 0.06, R * 0.065, 1); D.eyeR(hx + R * 0.13, hy - R * 0.08, R * 0.055, 1);
  c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = l * 0.3; c.beginPath(); c.moveTo(hx + R * 0.24, hy + R * 0.08); c.lineTo(hx + R * 0.45, hy + R * 0.04); c.moveTo(hx + R * 0.24, hy + R * 0.11); c.lineTo(hx + R * 0.44, hy + R * 0.14); c.stroke();
  if (o.chew) for (var ch = 0; ch < 3; ch++) { var q = (t * 3 + ch / 3) % 1; c.globalAlpha = 1 - q; D.rr(hx + R * (0.35 + q * 0.4), hy + R * (0.1 - q * 0.3 + ch * 0.05), R * 0.08, R * 0.04, R * 0.01); c.fillStyle = '#d8a060'; c.fill(); }
  c.globalAlpha = 1;
  c.restore();
};
D.magpie = function (x, y, R, o) {
  var c = C(), l = lw(R), t = Z.time, d = o.dir || 1, fly = !!o.fly, fl = fly ? Math.sin(t * 18) : Math.sin(t * 2) * 0.1;
  c.save(); c.translate(x, y); c.scale(d, 1);
  if (!fly) D.ell(0, 0, R * 0.4, R * 0.1, 'rgba(30,40,80,0.2)');
  // хвост длинный, сине-зелёный отлив
  c.save(); c.translate(-R * 0.35, -R * 0.5); c.rotate(fly ? 0.1 : 0.45); D.poly([0, -R * 0.06, -R * 0.75, -R * 0.02, -R * 0.8, R * 0.08, 0, R * 0.08], G2(-R * 0.8, 0, 0, 0, '#1a5a6a', '#1a2440'), l * 0.7); c.restore();
  if (fly) { c.save(); c.translate(-R * 0.05, -R * 0.62); c.rotate(-0.4 - fl * 0.7); D.poly([0, 0, -R * 0.2, -R * 0.62, R * 0.25, -R * 0.4], G2(0, -R * 0.6, 0, 0, '#2a7a8a', '#1a2440'), l * 0.7); c.restore(); }
  D.ell(0, -R * 0.52, R * 0.36, R * 0.24, '#1a2440', l);
  D.ell(R * 0.04, -R * 0.45, R * 0.22, R * 0.14, '#ffffff');
  if (!fly) { D.ell(-R * 0.1, -R * 0.56, R * 0.24, R * 0.12, G2(0, -R * 0.66, 0, -R * 0.44, '#2a7a8a', '#1a2440'), l * 0.6); D.ell(-R * 0.05, -R * 0.56, R * 0.1, R * 0.06, '#ffffff'); }
  else { c.save(); c.translate(-R * 0.05, -R * 0.55); c.rotate(0.4 + fl * 0.8); D.poly([0, 0, -R * 0.15, R * 0.55, R * 0.25, R * 0.35], G2(0, 0, 0, R * 0.55, '#2a7a8a', '#1a2440'), l * 0.7); D.ell(R * 0.05, R * 0.25, R * 0.07, R * 0.05, '#ffffff'); c.restore(); }
  D.circ(R * 0.32, -R * 0.72, R * 0.17, '#1a2440', l * 0.8);
  D.poly([R * 0.46, -R * 0.74, R * 0.64, -R * 0.69, R * 0.46, -R * 0.66], '#2c2f45', l * 0.5);
  D.eyeR(R * 0.36, -R * 0.75, R * 0.055, 1);
  if (!fly) { c.strokeStyle = '#2c2f45'; c.lineWidth = l * 0.6; c.beginPath(); c.moveTo(-R * 0.02, -R * 0.3); c.lineTo(-R * 0.04, 0); c.moveTo(R * 0.1, -R * 0.3); c.lineTo(R * 0.1, 0); c.stroke(); }
  if (o.carry === 'coin') { var w = Math.abs(Math.cos(t * 6)); c.save(); c.translate(R * 0.6, -R * 0.62); c.scale(Math.max(0.2, w), 1); D.circ(0, 0, R * 0.13, '#ffd54a', l * 0.5); c.restore(); }
  else if (o.carry === 'item') { c.save(); c.translate(R * 0.58, -R * 0.6); c.rotate(0.6); c.fillStyle = '#8a93ad'; c.fillRect(-R * 0.03, -R * 0.15, R * 0.06, R * 0.3); c.fillStyle = '#c08a50'; c.fillRect(-R * 0.08, -R * 0.2, R * 0.16, R * 0.08); c.restore(); }
  c.restore();
};
D.owl = function (x, y, R, o) {
  var c = C(), l = lw(R), t = Z.time, fly = !!o.fly, turn = o.turn || 0, fl = fly ? Math.sin(t * 14) : 0;
  c.save(); c.translate(x, y);
  if (!fly) { // ветка
    c.strokeStyle = OL; c.lineWidth = l * 2.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-R * 0.6, 0); c.lineTo(R * 0.6, -R * 0.05); c.stroke(); c.strokeStyle = '#7a5232'; c.lineWidth = l * 1.1; c.stroke();
    D.ell(R * 0.5, -R * 0.12, R * 0.1, R * 0.05, '#4cc77d', l * 0.4);
  }
  if (o.glow) { var g = c.createRadialGradient(0, -R * 0.6, 0, 0, -R * 0.6, R * 2.6); g.addColorStop(0, 'rgba(255,240,160,0.28)'); g.addColorStop(1, 'rgba(255,240,160,0)'); c.fillStyle = g; c.fillRect(-R * 2.6, -R * 3.2, R * 5.2, R * 5.2); }
  if (fly) { [-1, 1].forEach(function (s) { c.save(); c.translate(s * R * 0.25, -R * 0.7); c.rotate(s * (0.4 + fl * 0.7)); D.ell(s * R * 0.4, 0, R * 0.45, R * 0.16, '#8a7a6a', l * 0.7); c.restore(); }); }
  D.ell(0, -R * 0.55, R * 0.42, R * 0.52, G2(0, -R * 1.05, 0, -R * 0.05, '#a08a72', '#6a5a4a'), l);
  D.ell(0, -R * 0.42, R * 0.26, R * 0.34, '#e8dcc8');
  c.strokeStyle = 'rgba(120,100,80,0.6)'; c.lineWidth = l * 0.4; for (var v = 0; v < 3; v++) for (var u = 0; u < 2; u++) { var vx = -R * 0.1 + u * R * 0.2 - (v % 2) * R * 0.1, vy = -R * (0.55 - v * 0.12); c.beginPath(); c.moveTo(vx - R * 0.04, vy); c.lineTo(vx, vy + R * 0.04); c.lineTo(vx + R * 0.04, vy); c.stroke(); }
  if (!fly) { D.ell(-R * 0.36, -R * 0.55, R * 0.12, R * 0.32, '#7a6a5a', l * 0.7); D.ell(R * 0.36, -R * 0.55, R * 0.12, R * 0.32, '#7a6a5a', l * 0.7); }
  // голова поворачивается
  c.save(); c.translate(0, -R * 1.1); c.scale(Math.cos(turn) || 0.05, 1);
  D.poly([-R * 0.3, -R * 0.2, -R * 0.36, -R * 0.52, -R * 0.12, -R * 0.3], '#8a7a6a', l * 0.7); D.poly([R * 0.3, -R * 0.2, R * 0.36, -R * 0.52, R * 0.12, -R * 0.3], '#8a7a6a', l * 0.7);
  D.ell(0, 0, R * 0.42, R * 0.34, G2(0, -R * 0.34, 0, R * 0.3, '#b09a82', '#7a6a5a'), l);
  D.ell(-R * 0.17, 0, R * 0.17, R * 0.16, '#efe4d0'); D.ell(R * 0.17, 0, R * 0.17, R * 0.16, '#efe4d0');
  var bl = D.blinkNow && D.blinkNow();
  [-1, 1].forEach(function (s) { var ex = s * R * 0.17; if (bl || o.sleepy) { c.strokeStyle = OL; c.lineWidth = l * 0.8; c.beginPath(); c.arc(ex, 0, R * 0.09, 0.2, Math.PI - 0.2); c.stroke(); return; }
    D.circ(ex, 0, R * 0.12, o.glow ? '#ffd23a' : '#ffbe3a', l * 0.5); D.circ(ex, R * 0.01, R * 0.065, OL); D.circ(ex + R * 0.03, -R * 0.03, R * 0.025, '#fff'); });
  D.poly([-R * 0.05, R * 0.06, R * 0.05, R * 0.06, 0, R * 0.18], '#ffb347', l * 0.5);
  c.restore();
  if (!fly) { c.strokeStyle = '#ffb347'; c.lineWidth = l * 0.8; c.beginPath(); c.moveTo(-R * 0.12, -R * 0.06); c.lineTo(-R * 0.14, 0); c.moveTo(R * 0.12, -R * 0.06); c.lineTo(R * 0.14, 0); c.stroke(); }
  c.restore();
};
D.fox = function (x, y, R, o) {
  var c = C(), l = lw(R), t = Z.time, d = o.dir || 1, run = !!o.run, wk = (o.walk || 0);
  c.save(); c.translate(x, y); c.scale(d, 1);
  D.ell(0, 0, R * 0.6, R * 0.14, 'rgba(30,40,80,0.2)');
  if (o.pounce) c.rotate(-0.35);
  // пушистый хвост с белым кончиком: сидя — обёрнут вокруг лап, на бегу — вытянут назад
  var tsw = Math.sin(t * 3) * 0.15;
  if (run) { c.save(); c.translate(-R * 0.42, -R * 0.45); c.rotate(0.25 + tsw); D.ell(-R * 0.38, 0, R * 0.42, R * 0.17, G2(-R * 0.8, 0, 0, 0, '#ffffff', '#ff8a3d'), l * 0.9); c.restore(); }
  var leg = function (lx, ph, col) { var a = run ? Math.sin(wk * 8 + ph) * 0.5 : 0; c.save(); c.translate(lx, -R * 0.3); c.rotate(a); c.strokeStyle = OL; c.lineWidth = R * 0.1 + l; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, R * 0.3); c.stroke(); c.strokeStyle = col; c.lineWidth = R * 0.1; c.stroke(); c.restore(); };
  var hx, hy;
  if (run) { leg(-R * 0.25, 0, '#2c2f45'); leg(R * 0.25, 2, '#2c2f45'); D.ell(0, -R * 0.42, R * 0.5, R * 0.22, G2(0, -R * 0.64, 0, -R * 0.2, '#ff9a4a', '#d8642a'), l); D.ell(R * 0.15, -R * 0.33, R * 0.25, R * 0.1, '#ffffff'); leg(-R * 0.15, 3, '#2c2f45'); leg(R * 0.35, 1, '#2c2f45'); hx = R * 0.48; hy = -R * 0.62; }
  else { // сидит: грушевидное тело, белая грудка, лапки, хвост обвит спереди
    c.beginPath(); c.moveTo(-R * 0.3, -R * 0.02); c.quadraticCurveTo(-R * 0.42, -R * 0.55, -R * 0.08, -R * 0.82); c.quadraticCurveTo(R * 0.26, -R * 0.6, R * 0.3, -R * 0.02); c.closePath();
    c.fillStyle = G2(0, -R * 0.82, 0, 0, '#ff9a4a', '#d8642a'); c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
    D.ell(R * 0.06, -R * 0.4, R * 0.15, R * 0.3, '#ffffff');
    leg(R * 0.0, 0, '#2c2f45'); leg(R * 0.16, 0, '#2c2f45');
    c.save(); c.translate(-R * 0.28, -R * 0.12); c.rotate(-0.15 + tsw * 0.5); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(R * 0.1, R * 0.18, R * 0.55, R * 0.08); c.quadraticCurveTo(R * 0.7, R * 0.02, R * 0.62, -R * 0.06); c.quadraticCurveTo(R * 0.25, R * 0.02, R * 0.02, -R * 0.2); c.closePath();
    c.fillStyle = G2(0, 0, R * 0.7, 0, '#ff8a3d', '#ffffff'); c.fill(); c.lineWidth = l * 0.9; c.strokeStyle = OL; c.stroke(); c.restore();
    hx = R * 0.06; hy = -R * 0.92; }
  var tilt = o.tilt || 0, hs = 1.3;
  c.save(); c.translate(hx, hy); c.rotate(tilt); c.scale(hs, hs);
  D.poly([-R * 0.2, -R * 0.1, -R * 0.15, -R * 0.42, R * 0.0, -R * 0.15], '#ff8a3d', l * 0.6); D.poly([R * 0.05, -R * 0.15, R * 0.15, -R * 0.44, R * 0.22, -R * 0.08], '#ff8a3d', l * 0.6);
  D.poly([-R * 0.15, -R * 0.15, -R * 0.13, -R * 0.33, -R * 0.04, -R * 0.17], '#2c2f45'); D.poly([R * 0.09, -R * 0.17, R * 0.15, -R * 0.35, R * 0.18, -R * 0.12], '#2c2f45');
  c.beginPath(); c.moveTo(-R * 0.24, -R * 0.05); c.quadraticCurveTo(-R * 0.2, -R * 0.24, R * 0.05, -R * 0.2); c.quadraticCurveTo(R * 0.25, -R * 0.15, R * 0.48, R * 0.04); c.quadraticCurveTo(R * 0.2, R * 0.16, -R * 0.24, -R * 0.05); c.closePath();
  c.fillStyle = G2(0, -R * 0.24, 0, R * 0.14, '#ffa45a', '#e06a2a'); c.fill(); c.lineWidth = l / hs; c.strokeStyle = OL; c.stroke();
  c.beginPath(); c.moveTo(-R * 0.05, R * 0.04); c.quadraticCurveTo(R * 0.2, R * 0.12, R * 0.46, R * 0.04); c.quadraticCurveTo(R * 0.2, R * 0.0, -R * 0.05, R * 0.04); c.fillStyle = '#ffffff'; c.fill();
  D.circ(R * 0.48, R * 0.03, R * 0.04, OL);
  if (o.sly) { c.strokeStyle = OL; c.lineWidth = l * 0.8; c.beginPath(); c.moveTo(R * 0.0, -R * 0.08); c.quadraticCurveTo(R * 0.06, -R * 0.12, R * 0.13, -R * 0.08); c.stroke(); }
  else D.eyeR(R * 0.06, -R * 0.08, R * 0.055, 1);
  c.restore();
  if (o.mark) { var col = o.mark > 0 ? '#4cc77d' : o.mark < 0 ? '#ff5a5a' : '#b8c0d8'; D.circ(hx, hy - R * 0.8, R * 0.11, col, l * 0.6); D.text(o.mark > 0 ? '♥' : o.mark < 0 ? '!' : '?', hx, hy - R * 0.79, R * 0.14, '#fff', 'center', 'middle', 0); }
  c.restore();
};

// ================= МЕДВЕДЬ =================
var LOUD = { mortar: 20, tesla: 8, mg: 3, snow: 1.2, ice: 1.8 };
function bearInit(G) { var m = lm(G); if (!m) return null; return { x: m.c + 1, y: m.r + 2.05, home: { x: m.c + 1, y: m.r + 2.05 }, mode: 'sleep', noise: 0, angry: 0, t: 0, swT: 0, walk: 0, dir: 1, woke: 0 }; }
function bearNoise(G, n) { var B = G.bear; if (!B || B.mode !== 'sleep' || B.woke) return; B.noise += n; }
function bearTick(G, dt) {
  var B = G.bear; if (!B) return;
  B.noise = Math.max(0, B.noise - dt * 1.6); B.swipe = Math.max(0, (B.swipe || 0) - dt * 3); B.t += dt;
  if (B.mode === 'sleep') {
    if (B.t > 4 && Math.random() < dt * 0.25) snd('a_bear_snore', 0.35);
    if (B.noise >= 100) { B.mode = 'angry'; B.angry++; B.t = 0; snd('a_bear_roar', 0.9); G.shake = Math.max(G.shake || 0, 0.4);
      banner(false, TT('Медведь проснулся!', 'The bear woke up!'), B.angry === 1 ? TT('Шум у берлоги разбудил его — он злой и бьёт всех вокруг', 'Noise by the den woke him — he is angry and hits everyone near') : TT('Опять разбудили! Теперь он точно обиделся', 'Woken again! Now he is really upset')); }
    // пришёл Великан — проснётся отдохнувшим, если его не злили
    var giant = alive(G, function (e) { return e.type === 'giant'; })[0];
    if (giant && !B.woke && B.angry < 2) { B.woke = 1; B.mode = B.angry === 0 ? 'ally' : 'grump'; B.t = 0; snd('a_bear_yawn', 0.8);
      if (B.angry === 0) banner(true, TT('Медведь против Великана!', 'Bear vs Giant!'), TT('Ты не шумел у берлоги — медведь выспался и идёт на помощь', 'You kept the den quiet — the bear is rested and comes to help'));
      else banner(true, TT('Медведь ворчит…', 'The bear grumbles…'), TT('Проснулся не в духе: только охраняет берлогу', 'Woke grumpy: he only guards his den')); }
    return;
  }
  var tg = null, range = 1.5, home = B.home;
  if (B.mode === 'angry') {
    if (B.t > 9) { B.mode = 'sleep'; B.t = 0; B.noise = 0; B.x = home.x; B.y = home.y; return; }
    tg = near(G, home.x, home.y, 3)[0]; if (!tg) { var tw0 = towersNear(G, home.x, home.y, 3.2)[0]; if (tw0) tg = { x: tw0.c + 0.5, y: tw0.r + 0.6, tw: tw0 }; }
  } else if (B.mode === 'ally') {
    tg = alive(G, function (e) { return e.type === 'giant'; })[0] || near(G, B.x, B.y, 5)[0] || null;
    if (!tg && B.t > 3) { var any = alive(G)[0]; if (!any) { B.mode = 'sleep'; B.woke = 2; } }
  } else if (B.mode === 'grump') tg = near(G, home.x, home.y, 2.6)[0];
  var tp = tg ? (tg.tw ? tg : epos(tg)) : home, dx = tp.x - B.x, dy = tp.y - B.y, dd = Math.hypot(dx, dy);
  if (dd > range * 0.8) { var sp = (B.mode === 'ally' ? 1.4 : 1.1) * dt; B.x += dx / dd * Math.min(sp, dd); B.y += dy / dd * Math.min(sp, dd); B.walk += dt; B.dir = dx >= 0 ? 1 : -1; }
  B.swT -= dt;
  if (tg && dd < range && B.swT <= 0) {
    B.swT = 1.1; B.swipe = 1; snd('a_bear_swipe', 0.8); G.shake = Math.max(G.shake || 0, 0.25);
    if (tg.tw) { var tw = tg.tw; tw.hp = Math.max(1, tw.hp - tw.max * 0.22); tw.hitT = 0.3; tw.stun = Math.max(tw.stun || 0, 1.2); say(TT('Медведь бьёт вышку!', 'The bear hits a tower!'), tg.x, tg.y - 1, '#ffb3a0'); }
    else {
      var big = tg.type === 'giant';
      near(G, B.x + B.dir * 0.6, B.y, 1.6).forEach(function (e) { Z._.damage(e, big ? e.max * 0.035 : (e.boss ? e.max * 0.03 : 70 * (Z.hpScale ? Math.pow(Z.hpScale(G.idx), 0.7) : 1)), { pierceArmor: true }); if (!e.boss) { e.stun = Math.max(e.stun || 0, 0.8); e.kb = 0.15; } else e.stun = Math.max(e.stun || 0, 0.35); });
      if (B.mode === 'angry') towersNear(G, B.x, B.y, 1.4).forEach(function (tw) { tw.hp = Math.max(1, tw.hp - tw.max * 0.15); tw.hitT = 0.3; });
      if (G.fx && G.fx.length < 400) G.fx.push({ k: 'ring', x: B.x + B.dir * 0.6, y: B.y, r: 1.2, t: 0, dur: 0.35, col: '#ffffff' });
    }
  }
}

// ================= БОБРЫ =================
function beavInit(G) {
  var m = lm(G); if (!m) return null;
  var s = { list: [], logs: [], gone: false, damWas: !!G.damGone };
  [[0.4, 2.1], [1.7, 2.2]].forEach(function (q, i) { s.list.push({ x: m.c + q[0], y: m.r + q[1], home: { x: m.c + q[0], y: m.r + q[1] }, st: 'home', t: 6 + i * 9, dir: i ? -1 : 1 }); });
  return s;
}
function treeCellsNearPath(G) {
  var L = G.L, out = [], seen = {};
  (L.paths || [L.main]).forEach(function (p) { (p || []).forEach(function (cl, i) { if (i < 3) return; DIRS.forEach(function (d) { var c = cl[0] + d[0], r = cl[1] + d[1], k = r * L.W + c; if (seen[k] || !L.grid[r]) return; seen[k] = 1; if (L.grid[r][c] !== 0 || G.towers[k]) return; out.push({ c: c, r: r, pc: cl[0], pr: cl[1] }); }); }); });
  return out;
}
function beavTick(G, dt) {
  var S = G.beav; if (!S) return;
  if (G.damGone && !S.damWas) { S.damWas = true; S.gone = true; snd('a_beaver_slap', 0.8); banner(false, TT('Бобры остались без дома', 'The beavers lost their home'), TT('Плотину прорвало — бобры уплыли, брёвен больше не будет', 'The dam burst — the beavers swam away, no more logs')); S.list.forEach(function (b) { b.st = 'leave'; }); }
  S.logs.forEach(function (lg) { lg.t -= dt; }); S.logs = S.logs.filter(function (lg) { return lg.t > 0; });
  // брёвна тормозят врагов (и сани — в escortTick)
  if (S.logs.length) G.enemies.forEach(function (e) { if (e.dead || e.air) return; var p = epos(e); S.logs.forEach(function (lg) { if (Math.abs(p.x - lg.c - 0.5) < 0.6 && Math.abs(p.y - lg.r - 0.5) < 0.6) { e.slow = Math.max(e.slow || 0, 0.6); e.slowT = Math.max(e.slowT || 0, 0.3); } }); });
  var m = lm(G);
  S.list.forEach(function (b) {
    b.t -= dt;
    if (b.st === 'leave') { b.x += dt * 1.2 * (b.dir || 1); b.chew = false; return; }
    if (b.st === 'home') { b.chew = false;
      if (b.t <= 0) {
        // вышка у самой плотины — подгрызть её
        var tw = m ? towersNear(G, m.c + 1, m.r + 1, 2.4)[0] : null;
        if (tw) { b.st = 'go'; b.tg = { x: tw.c + 0.5, y: tw.r + 0.9, tw: tw }; }
        else { var cells = treeCellsNearPath(G); if (cells.length) { var pick = cells[Math.floor(Math.random() * cells.length)]; b.st = 'go'; b.tg = { x: pick.c + 0.5, y: pick.r + 0.6, cell: pick }; } else b.t = 10; }
      } return; }
    var tg = b.tg, dx = tg.x - b.x, dy = tg.y - b.y, dd = Math.hypot(dx, dy);
    if (b.st === 'go') { if (dd > 0.1) { var sp = 1.6 * dt; b.x += dx / dd * Math.min(sp, dd); b.y += dy / dd * Math.min(sp, dd); b.dir = dx >= 0 ? 1 : -1; } else { b.st = 'chew'; b.t = 3; snd('a_beaver_chew', 0.55); } return; }
    if (b.st === 'chew') { b.chew = true; if (b.t > 0) return; b.chew = false;
      if (tg.tw) { if (G.towers[tg.tw.r * G.L.W + tg.tw.c] === tg.tw) { tg.tw.hp = Math.max(1, tg.tw.hp - tg.tw.max * 0.3); tg.tw.hitT = 0.3; say(TT('Бобры грызут вышку у плотины!', 'Beavers gnaw the tower by the dam!'), tg.x, tg.y - 1, '#ffb3a0'); } }
      else { var cl = tg.cell; S.logs.push({ c: cl.pc, r: cl.pr, t: 35, rot: Math.random() < 0.5 ? 0 : 1 }); snd('a_beaver_slap', 0.6); say(TT('Бревно на дороге!', 'A log on the road!'), cl.pc + 0.5, cl.pr - 0.3, '#ffe9a0'); if (G.fx && G.fx.length < 400) G.fx.push({ k: 'ring', x: cl.pc + 0.5, y: cl.pr + 0.5, r: 0.8, t: 0, dur: 0.3, col: '#ffffff' }); }
      b.st = 'back'; b.tg = b.home; return; }
    if (b.st === 'back') { if (dd > 0.1) { var sp2 = 1.4 * dt; b.x += dx / dd * Math.min(sp2, dd); b.y += dy / dd * Math.min(sp2, dd); b.dir = dx >= 0 ? 1 : -1; } else { b.st = 'home'; b.t = 18 + Math.random() * 10; if (Math.random() < 0.5) snd('a_beaver_chirp', 0.4); } }
  });
}

// ================= СОРОКИ =================
var ITEM = { raz: 1, thrower: 1, engineer: 1, sculptor: 1 };
function magInit(G) { var m = lm(G); if (!m) return null; var nest = { x: m.c + 1, y: m.r - 0.1 }; return { nest: nest, birds: [{ x: nest.x - 0.3, y: nest.y, hx: nest.x - 0.3, hy: nest.y, st: 'nest', t: 8 }, { x: nest.x + 0.3, y: nest.y, hx: nest.x + 0.3, hy: nest.y, st: 'nest', t: 15 }], stash: 0, ok: 0, grudge: 0, friend: false }; }
function magTick(G, dt) {
  var S = G.mag; if (!S) return;
  var bt = battle(G), fort = G.L.fort ? { x: G.L.fort[0] + 0.5, y: G.L.fort[1] - 0.3 } : { x: G.L.W / 2, y: G.L.H - 1 };
  S.birds.forEach(function (b) {
    b.t -= dt;
    if (b.st === 'nest') { if (!bt || b.t > 0) return;
      b.t = S.grudge >= 2 ? 7 : 14 + Math.random() * 4;
      var item = near(G, S.nest.x, S.nest.y, 8, function (e) { return ITEM[e.type] && !e.robbed; })[0], toPlayer = !S.friend && G.coins >= 8 && (S.grudge > 0 || !item || Math.random() < 0.5);
      if (item && !toPlayer) { b.st = 'fly'; b.tg = { e: item }; } else if (toPlayer) { b.st = 'fly'; b.tg = { fort: 1 }; } else return;
      snd('a_magpie_flap', 0.5); return; }
    // 2.12.37: домой — ровно на своё место в гнезде (раньше цель была на 0,6 клетки выше, и сорока «висела» над каруселью)
    var home = b.st === 'back', tp = b.tg.e ? epos(b.tg.e) : b.tg.fort ? fort : { x: b.hx !== undefined ? b.hx : S.nest.x, y: b.hy !== undefined ? b.hy : S.nest.y }, dx = tp.x - b.x, dy = (tp.y - (home ? 0 : 0.6)) - b.y, dd = Math.hypot(dx, dy);
    b.dir = dx >= 0 ? 1 : -1;
    if (b.st === 'fly') {
      if (b.tg.e && b.tg.e.dead) { b.st = 'back'; b.tg = {}; return; }
      var sp = 4.2 * dt; if (dd > 0.25) { b.x += dx / dd * Math.min(sp, dd); b.y += dy / dd * Math.min(sp, dd); return; }
      snd('a_magpie', 0.6);
      if (b.tg.e) { var e = b.tg.e, p = epos(e); e.robbed = 1; e.stun = Math.max(e.stun || 0, 1.2);
        if (e.type === 'raz') { Z._.explode(p.x, p.y, 1.2, 60 * (Z.hpScale ? Math.pow(Z.hpScale(G.idx), 0.7) : 1), false, true); say(TT('Сорока утащила фитиль — бабах!', 'A magpie took the fuse — boom!'), p.x, p.y - 1.1, '#ffb347'); }
        else { Z._.damage(e, e.max * 0.25, { pierceArmor: true }); say(TT('Сорока утащила инструмент!', 'A magpie stole a tool!'), p.x, p.y - 1.1, '#ffe9a0'); }
        if (S.friend) { G.coins += 3; say('+3', p.x + 0.4, p.y - 0.7, '#ffd54a'); }
        b.carry = 'item'; }
      else { var n = Math.min(8, G.coins); G.coins -= n; b.carry = 'coin'; b.loot = n;
        if (!S.told) { S.told = 1; G.banner = { text: TT('Сорока утащила монеты!', 'A magpie took your coins!'), sub: TT('Потерпи 3 раза — сороки подружатся, вернут монеты вдвое и будут воровать только у врагов. Нажмёшь на сороку — вернёшь монеты, но дружбы не будет', 'Let it go 3 times — the magpies will become friends, return coins doubled and rob only enemies. Tap a magpie to get coins back, but no friendship'), t: 5.5 }; }
        say(TT('Сорока утащила ' + n + ' монет!', 'A magpie took ' + n + ' coins!'), fort.x, fort.y - 0.8, '#ffb3a0'); }
      b.st = 'back'; b.tg = {}; return;
    }
    if (b.st === 'back') { var sp2 = 3.2 * dt; if (dd > 0.15) { b.x += dx / dd * Math.min(sp2, dd); b.y += dy / dd * Math.min(sp2, dd); return; }
      b.st = 'nest'; b.x = tp.x; b.y = tp.y; if (b.carry === 'coin') { S.stash += b.loot || 0; S.ok++;
        if (!S.friend && S.grudge === 0 && S.ok >= 3) { S.friend = true; var back = S.stash * 2; G.coins += back; S.stash = 0; banner(true, TT('Сороки подружились!', 'The magpies are friends!'), TT('Ты не отбирал у них добычу — вернули монеты вдвое (+' + back + ') и теперь таскают только у врагов', 'You let them keep their loot — they returned it double (+' + back + ') and now rob only enemies')); } }
      b.carry = null; b.loot = 0; }
  });
}
function magTap(G, wx, wy) {
  var S = G.mag; if (!S) return false;
  var b = S.birds.filter(function (q) { return q.carry === 'coin' && Math.hypot(q.x - wx, q.y - 0.4 - (q._lf || 0) - wy) < 0.9; })[0]; if (!b) return false;
  G.coins += b.loot || 0; say(TT('Отбил! +' + (b.loot || 0), 'Got it back! +' + (b.loot || 0)), b.x, b.y - 0.6, '#ffd54a'); b.carry = null; b.loot = 0; S.grudge++; snd('a_magpie', 0.8);
  banner(false, TT('Сороки обиделись', 'The magpies are offended'), S.grudge >= 2 ? TT('Теперь они воруют у тебя чаще и дружить не станут', 'Now they steal from you more often and will never be friends') : TT('Отобрал добычу — сороки это запомнят', 'You took their loot — they will remember'));
  return true;
}

// ================= СОВЫ =================
function owlInit(G) {
  var L = G.L, cand = [], seen = {};
  (L.paths || [L.main]).forEach(function (p) { (p || []).forEach(function (cl, i) { if (i % 3) return; [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, -1]].forEach(function (d) { var c = cl[0] + d[0], r = cl[1] + d[1], k = r * L.W + c; if (seen[k] || r < 2 || r > L.H - 3 || c < 1 || c > L.W - 2 || !freeCell(G, c, r) || (Z.inEnemyZone && Z.inEnemyZone(c, r))) return; seen[k] = 1; cand.push({ x: c + 0.5, y: r + 0.7 }); }); }); });
  var per = []; cand.forEach(function (q) { if (per.every(function (o) { return Math.hypot(o.x - q.x, o.y - q.y) > 3.2; })) per.push(q); });
  if (per.length < 2) return null;
  var owls = [{ p: 0 }, { p: Math.floor(per.length / 2) }].map(function (o) { var q = per[o.p]; return { x: q.x, y: q.y, p: o.p, st: 'perch', irk: 0, turn: 0, hoot: 3 + Math.random() * 5 }; });
  return { per: per, owls: owls, scared: 0, gone: false };
}
function owlTick(G, dt) {
  var S = G.owlz; if (!S || S.gone) return;
  S.owls.forEach(function (o) {
    o.irk = Math.max(0, o.irk - dt * 0.6); o.turnT = (o.turnT || 0) - dt; if (o.turnT <= 0) { o.turnT = 3 + Math.random() * 4; o.turnTo = Math.random() < 0.3 ? Math.PI : 0; } o.turn += ((o.turnTo || 0) - o.turn) * Math.min(1, dt * 4);
    if (o.st === 'fly') { var q = S.per[o.p], dx = q.x - o.x, dy = q.y - o.y, dd = Math.hypot(dx, dy); if (dd > 0.1) { var sp = 4 * dt; o.x += dx / dd * Math.min(sp, dd); o.y += dy / dd * Math.min(sp, dd); } else o.st = 'perch'; return; }
    if (o.st === 'leave') { o.y -= dt * 3; o.x += dt * 2; return; }
    // фонари рядом раздражают
    if (G.traps) for (var k in G.traps) { var tr = G.traps[k]; if (tr && tr.type === 'lamp' && Math.hypot(tr.c + 0.5 - o.x, tr.r + 0.5 - o.y) < 2.2) o.irk += dt * 1.2; }
    if (o.irk >= 6) { owlScare(G, o); return; }
    // спокойная сова видит врагов в темноте
    o.see = (o.see || 0) - dt; if (o.see <= 0) { o.see = 0.2; near(G, o.x, o.y, 2.8).forEach(function (e) { e.spotT = Math.max(e.spotT || 0, 1.5); e.owlSeen = 1; }); }
    o.hoot -= dt; if (o.hoot <= 0) { o.hoot = 7 + Math.random() * 6; snd('a_owl_hoot', 0.4); }
  });
}
function owlScare(G, o) {
  var S = G.owlz; o.irk = 0; S.scared++; snd('a_owl_screech', 0.7);
  if (S.scared >= 4) { S.gone = true; S.owls.forEach(function (q) { q.st = 'leave'; }); banner(false, TT('Совы покинули пещеры', 'The owls left the caves'), TT('Слишком шумно и светло — больше никто не подсветит врагов в темноте', 'Too loud and bright — nobody will spot enemies in the dark now')); return; }
  var far = -1, best = o.p; S.per.forEach(function (q, i) { if (S.owls.some(function (w) { return w !== o && w.p === i; })) return; var d = towersNear(G, q.x, q.y, 2.4).length ? -1 : Math.hypot(q.x - o.x, q.y - o.y); if (d > far) { far = d; best = i; } });
  o.p = best; o.st = 'fly';
  say(TT('Сова испугалась шума!', 'The owl was startled!'), o.x, o.y - 1.3, '#ffe9a0');
}

// ================= ЛИСА =================
function foxInit(G) {
  var m = lm(G), L = G.L; if (!m) return null; var spot = null;
  for (var rad = 1; rad < 4 && !spot; rad++) for (var dr = -rad; dr <= rad && !spot; dr++) for (var dc = -rad; dc <= rad; dc++) { var c = m.c + 2 + dc, r = m.r + 1 + dr; if (freeCell(G, c, r) && !(Z.inEnemyZone && Z.inEnemyZone(c, r))) { spot = { x: c + 0.5, y: r + 0.7 }; break; } }
  if (!spot) return null;
  return { x: spot.x, y: spot.y, home: spot, loyal: 0, st: 'sit', t: 0, walk: 0, dir: 1, inZone: [], side: 0 };
}
function foxSide(F) { return F.loyal >= 4 ? 1 : F.loyal <= -4 ? -1 : 0; }
function foxTick(G, dt) {
  var F = G.fox; if (!F) return;
  F.t -= dt; F.tilt = Math.sin(Z.time * 1.3) * 0.1;
  // кто сильнее: враги, вошедшие в зону лисы, — погибли рядом или ушли дальше?
  var Rz = 3.2;
  G.enemies.forEach(function (e) { if (e.neutral) return; var p = epos(e), inz = !e.dead && Math.hypot(p.x - F.home.x, p.y - F.home.y) < Rz;
    if (inz && !e._fz) e._fz = 1;
    if (e._fz === 1 && e.dead) { e._fz = 2; if (e._killed) { F.loyal = Math.min(6, F.loyal + 1); F.puff = 0.8; } }
    else if (e._fz === 1 && !inz && !e.dead) { e._fz = 2; F.loyal = Math.max(-6, F.loyal - 1); F.puff = -0.8; } });
  F.puff = F.puff > 0 ? Math.max(0, F.puff - dt) : Math.min(0, (F.puff || 0) + dt);
  var side = foxSide(F);
  if (side !== F.side) { var was = F.side; F.side = side; snd('a_fox_yip', 0.7);
    if (side === 1) banner(true, TT('Лиса на твоей стороне', 'The fox is on your side'), TT('Видит, что ты сильнее, — теперь охотится на енотов', 'She sees you are stronger — now she hunts raccoons'));
    else if (side === -1) banner(false, TT('Лиса переметнулась', 'The fox switched sides'), TT('Враги ходят мимо невредимыми — лиса решила, что они сильнее, и ворует твои монеты', 'Enemies pass unharmed — the fox thinks they are stronger and steals your coins'));
    else if (was) banner(false, TT('Лиса сомневается…', 'The fox hesitates…'), TT('Она снова присматривается, кто сильнее', 'She is watching again who is stronger')); }
  var bt = battle(G);
  if (F.st === 'sit') {
    if (!bt || F.t > 0) return;
    if (side === 1) { var tg = near(G, F.home.x, F.home.y, 4.5, function (e) { return SMALL[e.type] && !e.boss; })[0]; if (tg) { F.st = 'hunt'; F.tg = tg; F.t = 6; } }
    else if (side === -1 && G.coins >= 6) { F.st = 'steal'; F.t = 13; F.tg = null; }
    return;
  }
  var fort = G.L.fort ? { x: G.L.fort[0] + 0.5, y: G.L.fort[1] - 0.2 } : F.home, tp = F.st === 'hunt' ? (F.tg && !F.tg.dead ? epos(F.tg) : null) : F.st === 'steal' ? fort : F.home;
  if (!tp) { F.st = 'home'; return; }
  var dx = tp.x - F.x, dy = tp.y - F.y, dd = Math.hypot(dx, dy); F.dir = dx >= 0 ? 1 : -1; F.walk += dt;
  if (dd > 0.35) { var sp = 3.2 * dt; F.x += dx / dd * Math.min(sp, dd); F.y += dy / dd * Math.min(sp, dd); F.pounce = F.st === 'hunt' && dd < 1.2; return; }
  F.pounce = false;
  if (F.st === 'hunt') { var e = F.tg; snd('a_fox_pounce', 0.8); Z._.damage(e, e.max * 0.75, { pierceArmor: true }); e.stun = Math.max(e.stun || 0, 1); say(TT('Лиса сцапала!', 'The fox pounced!'), tp.x, tp.y - 1, '#ffb36b'); F.st = 'home'; }
  else if (F.st === 'steal') { var n = Math.min(6, G.coins); G.coins -= n; snd('a_fox_yip', 0.6); say(TT('Лиса утащила ' + n + ' монет!', 'The fox stole ' + n + ' coins!'), fort.x, fort.y - 0.8, '#ffb3a0'); F.st = 'home'; }
  else { F.st = 'sit'; }
}

// ================= общий цикл =================
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!G || !G.L || G.endless) return;
  try {
    var m = G.mech;
    if (m === 'stomp') { if (G.bear === undefined) G.bear = bearInit(G); bearTick(G, dt); }
    else if (m === 'dam') { if (G.beav === undefined) G.beav = beavInit(G); beavTick(G, dt); }
    else if (m === 'carousel') { if (G.mag === undefined) G.mag = magInit(G); magTick(G, dt); }
    else if (m === 'dark') { if (G.owlz === undefined) G.owlz = owlInit(G); owlTick(G, dt); }
    else if (G.idx === 7 && !G.endless) { if (G.fox === undefined) { G.fox = foxInit(G); G._foxTip = 0; } foxTick(G, dt);
      if (G.fox && !G._foxTip && (G.t || 0) > 3.5 && !(G.banner && G.banner.t > 0)) { G._foxTip = 1; G.banner = { text: TT('У пугала живёт лиса', 'A fox lives by the scarecrow'), sub: TT('Бей врагов рядом с ней (в круге) — перейдёт к тебе и будет ловить енотов. Пропустишь их мимо — станет воровать монеты', 'Defeat enemies near her (in the circle) — she joins you and hunts raccoons. Let them pass — she steals coins'), t: 5.5 }; } }
  } catch (er) { if (window.__rep) window.__rep(er); }
};
// убит врагом-игроком: пометка для лисы
var oKill = Z.hk.kill;
Z.hk.kill = function (e) { if (oKill) oKill(e); if (e) e._killed = 1; };
// шум у берлоги и у сов — от выстрелов вышек
var oFire = Z.hk.towerFire;
Z.hk.towerFire = function (tw, st, e, fire) {
  var r = oFire ? oFire(tw, st, e, fire) : fire(tw, st, e), G = Z.G;
  try {
    if (G && G.bear && G.bear.mode === 'sleep') { var B = G.bear, d = Math.hypot(tw.c + 0.5 - B.x, tw.r + 0.5 - B.y); if (d < 3.6) bearNoise(G, (LOUD[tw.type] || 1) * (1.4 - d / 3.6)); }
    if (G && G.owlz && !G.owlz.gone) G.owlz.owls.forEach(function (o) { if (o.st !== 'perch') return; var d = Math.hypot(tw.c + 0.5 - o.x, tw.r + 0.5 - o.y); if (d < 2.4) o.irk += (LOUD[tw.type] || 1) * 0.35; });
  } catch (er) { if (window.__rep) window.__rep(er); }
  return r;
};
var oSkill = Z.useSkill;
Z.useSkill = function (id, x, y) { var r = oSkill.apply(this, arguments), G = Z.G; try { if (r !== false && id === 'bomb' && G && G.bear && x !== undefined && Math.hypot(x - G.bear.x, y - G.bear.y) < 4) bearNoise(G, 60); } catch (er) { if (window.__rep) window.__rep(er); } return r; };
// сани в сопровождении тормозят на брёвнах бобров
var oSl = Z.sleighPos;
var oUpd2 = Z.update;
Z.update = function (dt) {
  var G = Z.G, S = G && G.beav, f0 = G && G.sleigh ? G.sleigh.f : 0;
  oUpd2.apply(this, arguments);
  try { if (S && S.logs.length && G.sleigh && G.sleigh.f > f0) { var p = Z.sleighPos(); if (S.logs.some(function (lg) { return Math.abs(p.x - lg.c - 0.5) < 0.6 && Math.abs(p.y - lg.r - 0.5) < 0.6; })) { G.sleigh.f = f0 + (G.sleigh.f - f0) * 0.35; G._logSay = (G._logSay || 0) - dt; if (G._logSay <= 0) { G._logSay = 3; say(TT('Сани застряли на бревне!', 'The sleigh is stuck on a log!'), p.x, p.y - 1, '#ffe9a0'); } } } } catch (er) { if (window.__rep) window.__rep(er); }
};

// ================= нажатия =================
var oTap = UI.tapHook;
UI.tapHook = function (wx, wy, px, py) {
  var G = Z.G;
  if (G && UI.screen === 'level') {
    try {
      if (G.mag && magTap(G, wx, wy)) return true;
      var B = G.bear; if (B && Math.hypot(B.x - wx, B.y - 0.5 - (B._lf || 0) - wy) < 1.1) { if (B.mode === 'sleep') { bearNoise(G, 35); B.poke = 1; snd('a_bear_snore', 0.6); say(TT('Тсс… спит', 'Shh… sleeping'), B.x, B.y - 1.3, '#dfe7ff'); } else say(B.mode === 'angry' ? TT('Лучше не трогать!', 'Better not!') : TT('Ррр!', 'Grr!'), B.x, B.y - 1.6, '#ffe9a0'); return true; }
      var S = G.beav; if (S) { var lg = S.logs.filter(function (q) { return Math.abs(q.c + 0.5 - wx) < 0.6 && Math.abs(q.r + 0.5 - Z.gLift(q.c + 0.5, q.r + 0.5) - wy) < 0.6; })[0]; if (lg) { lg.t = 0; S.logs = S.logs.filter(function (q) { return q !== lg; }); say(TT('Откатил бревно', 'Rolled the log away'), lg.c + 0.5, lg.r - 0.2, '#dfe7ff'); snd('a_beaver_chirp', 0.4); return true; }
        var bv = S.list.filter(function (q) { return Math.hypot(q.x - wx, q.y - 0.3 - (q._lf || 0) - wy) < 0.7; })[0]; if (bv) { snd('a_beaver_chirp', 0.6); say(TT('Бобр занят делом', 'The beaver is busy'), bv.x, bv.y - 0.9, '#dfe7ff'); return true; } }
      var O = G.owlz; if (O && !O.gone) { var ow = O.owls.filter(function (q) { return Math.hypot(q.x - wx, q.y - 0.8 - (q._lf || 0) - wy) < 0.7; })[0]; if (ow) { ow.turnTo = ow.turnTo ? 0 : Math.PI; ow.turnT = 2; snd('a_owl_hoot', 0.6); ow.irk += 1.5; return true; } }
      var F = G.fox; if (F && Math.hypot(F.x - wx, F.y - 0.4 - (F._lf || 0) - wy) < 0.8) { F.tilt = 0.4; snd('a_fox_yip', 0.5); say(TT('Хитрая…', 'Sly…'), F.x, F.y - 1.1, '#ffd0a0'); return true; }
    } catch (er) { if (window.__rep) window.__rep(er); }
  }
  return oTap ? oTap.apply(this, arguments) : false;
};

// ================= отрисовка по глубине =================
var oObjs = Z.drawObjs;
Z.drawObjs = function (objs, X, Y, cs, t) {
  if (oObjs) oObjs.apply(this, arguments);
  var G = Z.G; if (!G) return;
  try {
    var B = G.bear; if (B) objs.push({ y: B.y, f: function () { D.bear(X(B.x), Y(B.y - Z.oLift(B)), cs * 0.62, { mode: B.mode === 'grump' ? 'ally' : B.mode, dir: B.dir, walk: B.walk, swipe: B.swipe, toss: Math.min(1, B.noise / 70) }); } });
    var S = G.beav; if (S) {
      S.logs.forEach(function (lg) { objs.push({ y: lg.r + 0.6, f: function () { var x = X(lg.c + 0.5), y = Y(lg.r + 0.6 - Z.gLift(lg.c + 0.5, lg.r + 0.5)), w = cs * 0.42, hh = cs * 0.13; D.rr(x - w, y - hh * 2, w * 2, hh * 2, hh); D.ctx.fillStyle = '#9a6a42'; D.ctx.fill(); D.ctx.lineWidth = Math.max(1.2, cs * 0.03); D.ctx.strokeStyle = OL; D.ctx.stroke(); D.ell(x - w + hh * 0.6, y - hh, hh * 0.5, hh * 0.85, '#d8b080', Math.max(1, cs * 0.02)); D.circ(x - w + hh * 0.6, y - hh, hh * 0.25, '#b08050'); D.ctx.strokeStyle = 'rgba(60,35,15,0.5)'; D.ctx.lineWidth = Math.max(1, cs * 0.015); D.ctx.beginPath(); D.ctx.moveTo(x - w * 0.4, y - hh * 1.4); D.ctx.lineTo(x + w * 0.7, y - hh * 1.5); D.ctx.stroke(); } }); });
      S.list.forEach(function (b) { objs.push({ y: b.y, f: function () { D.beaver(X(b.x), Y(b.y - Z.oLift(b)), cs * 0.36, { dir: b.dir, chew: b.chew, slap: b.st === 'leave' }); } }); });
    }
    var M = G.mag; if (M) {
      var nestY = G.L.landmark ? G.L.landmark.r + 1.95 : M.nest.y;   // гнездо на макушке карусели — рисуется поверх неё
      objs.push({ y: nestY, f: function () { var x = X(M.nest.x), y = Y(M.nest.y - (G.L.lmLift || 0)); D.ell(x, y, cs * 0.42, cs * 0.16, '#8a5a30', Math.max(1.2, cs * 0.03)); D.ctx.strokeStyle = '#5a3a1a'; D.ctx.lineWidth = Math.max(1, cs * 0.02); D.ctx.beginPath(); for (var k = 0; k < 6; k++) { D.ctx.moveTo(x - cs * 0.4 + k * cs * 0.15, y - cs * 0.12); D.ctx.lineTo(x - cs * 0.3 + k * cs * 0.13, y + cs * 0.1); } D.ctx.stroke();
        if (M.stash > 0) for (var q = 0; q < Math.min(5, Math.ceil(M.stash / 8)); q++) D.circ(x - cs * 0.2 + q * cs * 0.1, y - cs * 0.12, cs * 0.06, '#ffd54a', Math.max(1, cs * 0.015)); } });
      M.birds.forEach(function (b) { objs.push({ y: b.st === 'nest' ? nestY + 0.01 : Math.max(b.y + 1.2, nestY + 0.02), f: function () { D.magpie(X(b.x), Y(b.y - (b.st === 'nest' ? (G.L.lmLift || 0) : Z.oLift(b))), cs * 0.4, { dir: b.dir || 1, fly: b.st !== 'nest', carry: b.carry }); } }); });
    }
    var O = G.owlz; if (O) O.owls.forEach(function (o) { objs.push({ y: o.y, f: function () { D.owl(X(o.x), Y(o.y - Z.oLift(o)), cs * 0.36, { fly: o.st !== 'perch', turn: o.turn, glow: o.st === 'perch' && !O.gone, sleepy: false }); if (o.st === 'perch' && o.irk > 2) { D.ctx.globalAlpha = Math.min(1, (o.irk - 2) / 3); D.text('!', X(o.x) + cs * 0.3, Y(o.y) - cs * 0.8, cs * 0.3, '#ffd54a', 'center', 'middle', 2); D.ctx.globalAlpha = 1; } } }); });
    var F = G.fox; if (F) objs.push({ y: F.y, f: function () { D.fox(X(F.x), Y(F.y - Z.oLift(F)), cs * 0.4, { dir: F.dir, run: F.st !== 'sit', walk: F.walk, pounce: F.pounce, tilt: F.tilt, sly: F.side < 0, mark: F.side }); if (F.puff) { D.ctx.globalAlpha = Math.abs(F.puff); D.text(F.puff > 0 ? '+' : '−', X(F.x) + cs * 0.3, Y(F.y) - cs * 0.85, cs * 0.3, F.puff > 0 ? '#4cc77d' : '#ff5a5a', 'center', 'middle', 2); D.ctx.globalAlpha = 1; } } });
  } catch (er) { if (window.__rep) window.__rep(er); }
};
// 2.12.37: видно, как идёт дружба. Над гнездом сорок — три сердечка (сколько раз стерпел кражу; отобрал — сердечки серые),
// подружились — золотое. Над лисой — полоска «враг ← → друг», вокруг неё на земле — круг, где она смотрит, кто сильнее
var oOverF = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  if (oOverF) oOverF(ctx, X, Y, cs, t);
  var G = Z.G; if (!G || UI.screen !== 'level') return;
  try {
    var M = G.mag;
    if (M && (M.told || M.friend || M.grudge)) {
      var nx = X(M.nest.x), ny = Y(M.nest.y - (G.L.lmLift || 0)) - cs * 0.95, r = cs * 0.13;
      ctx.save();
      if (M.friend) { D.heart(nx, ny, r * 1.5); D.text(TT('друзья', 'friends'), nx, ny - r * 2.6, Math.max(9, cs * 0.2), '#ffe28a', 'center', 'middle', 2); }
      else for (var i = 0; i < 3; i++) { var hx = nx + (i - 1) * r * 2.6; if (M.grudge) { ctx.globalAlpha = 0.55; } if (!M.grudge && i < (M.ok || 0)) D.heart(hx, ny, r); else { ctx.globalAlpha = M.grudge ? 0.5 : 0.45; D.heart(hx, ny, r); } ctx.globalAlpha = 1; }
      ctx.restore();
    }
    var F = G.fox;
    if (F) {
      var fx = X(F.home.x), fy = Y(F.home.y - (F._lf || 0));
      if (battle(G) && F.side === 0) { ctx.save(); ctx.globalAlpha = 0.22 + 0.06 * Math.sin(t * 2); ctx.strokeStyle = '#ffb36b'; ctx.lineWidth = Math.max(1.5, cs * 0.04); ctx.setLineDash([cs * 0.16, cs * 0.12]); ctx.beginPath(); ctx.ellipse(fx, fy, cs * 3.2, cs * 3.2 * 0.62, 0, 0, 7); ctx.stroke(); ctx.restore(); }
      var bx = X(F.x), by = Y(F.y - (F._lf || 0)) - cs * 1.05, bw = cs * 0.95, bh = Math.max(4, cs * 0.12), v = Math.max(-1, Math.min(1, F.loyal / 4));
      ctx.save(); D.rr(bx - bw / 2, by - bh / 2, bw, bh, bh / 2); ctx.fillStyle = 'rgba(27,36,72,0.55)'; ctx.fill();
      var g = ctx.createLinearGradient(bx - bw / 2, 0, bx + bw / 2, 0); g.addColorStop(0, '#ff6b6b'); g.addColorStop(0.5, '#ffe28a'); g.addColorStop(1, '#5fd38a');
      D.rr(bx - bw / 2 + 1, by - bh / 2 + 1, bw - 2, bh - 2, bh / 2); ctx.fillStyle = g; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
      var mx = bx + v * (bw / 2 - bh / 2); D.circ(mx, by, bh * 0.85, '#fff', Math.max(1.2, cs * 0.025));
      if (F.side !== 0) D.text(F.side > 0 ? TT('за нас', 'ally') : TT('за врагов', 'enemy'), bx, by - bh * 1.6, Math.max(9, cs * 0.19), F.side > 0 ? '#c8f7c5' : '#ffb3a0', 'center', 'middle', 2);
      ctx.restore();
    }
  } catch (er) { if (window.__rep) window.__rep(er); }
};
// совы подсвечивают тех, кого видят: тонкий жёлтый ореол на враге
var oOver = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  if (oOver) oOver(ctx, X, Y, cs, t);
  var G = Z.G; if (!G || !G.owlz || G.owlz.gone) return;
  try { G.owlz.owls.forEach(function (o) { var R = cs * 0.36, hx = X(o.x), hy = Y(o.y - (o._lf || 0)) - R * 1.1, bl = D.blinkNow && D.blinkNow(), sx = Math.cos(o.turn || 0);   // светящиеся глаза видны и в темноте
    if (!bl && sx > 0.2) [-1, 1].forEach(function (k) { var ex = hx + k * R * 0.17 * sx, g = ctx.createRadialGradient(ex, hy, 0, ex, hy, R * 0.35); g.addColorStop(0, 'rgba(255,220,90,0.75)'); g.addColorStop(1, 'rgba(255,220,90,0)'); ctx.fillStyle = g; ctx.fillRect(ex - R * 0.35, hy - R * 0.35, R * 0.7, R * 0.7); D.circ(ex, hy, R * 0.1, '#ffd23a'); D.circ(ex, hy + R * 0.01, R * 0.05, '#1b2448'); });
    if (o.st !== 'perch') return; ctx.save(); ctx.globalAlpha = 0.18 + 0.06 * Math.sin(t * 2); ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = Math.max(1, cs * 0.03); ctx.setLineDash([cs * 0.12, cs * 0.12]); ctx.beginPath(); ctx.arc(X(o.x), Y(o.y - 0.4), cs * 2.8, 0, 7); ctx.stroke(); ctx.restore(); }); } catch (er) { if (window.__rep) window.__rep(er); }
};
})();
