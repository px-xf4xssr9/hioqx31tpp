/* 2.11.5 · «живой» снег: снежный слой на земле, который продавливается.
   - следы ног и полозьев вдавливаются в снег (тень + светлый валик), где ходят часто — протаптывается тропа;
   - взрывы выбивают яму до земли и разбрасывают комья — те падают и оставляют вмятинки; попадания взметают снежную пыль;
   - при постройке вышки вокруг утаптывается площадка; герои тоже оставляют следы;
   - снегопад понемногу засыпает следы.
   Слой лежит на самой земле: под водой, болотом, мостом, ловушками, деревьями, вышками, героями и врагами — ничего не закрывает.
   Только на снежной земле и дорогах (не на воде, льду, мосту, плато, горе, ориентирах, стене). */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui;
var S = null;   // { G, cv, c, k, mask, fadeT }
function allowed(L, c, r) {
  if (r < 0 || c < 0 || r >= L.H - 1 || c >= L.W) return false;
  var v = L.grid[r][c]; if (v === 4 || v === 5 || v === 9 || v === 11 || v === 12) return false;
  if (L.hgt && L.hgt[r] && L.hgt[r][c]) return false;
  if (L.mtn && L.mtn.dec && L.mtn.dec[r * L.W + c]) return false;
  if (Z.cellLift && Z.cellLift(c, r) > 0.01) return false;
  if (L.kb && r === L.kb.r && c >= L.kb.c0 - 1 && c <= L.kb.c1 + 1) return false;
  if (L.bridges && L.bridges[r * L.W + c]) return false;
  return true;
}
function init(G) {
  var L = G.L, k = Z.lowGfx ? 20 : 40, cv = document.createElement('canvas'); cv.width = L.W * k; cv.height = L.H * k;
  var c = cv.getContext('2d'), mask = new Path2D();
  for (var r = 0; r < L.H; r++) for (var cc = 0; cc < L.W; cc++) if (allowed(L, cc, r)) mask.rect(cc * k - 0.5, r * k - 0.5, k + 1, k + 1);
  S = { G: G, cv: cv, c: c, k: k, mask: mask, fadeT: 0, P: [] }; Z._snowS = S;
}
function cur() { var G = Z.G; if (!G || !G.L || G.endless === undefined && false) return null; if (!S || S.G !== G) { try { init(G); } catch (e) { S = null; } } return S; }
function stamp(fn) { var s = cur(); if (!s) return; s.ver = (s.ver || 0) + 1; var c = s.c; c.save(); c.clip(s.mask); c.scale(s.k, s.k); try { fn(c); } catch (e) { if (window.__rep) window.__rep(e); } c.restore(); }
// ---------- оттиски ----------
var SH = 'rgba(70,92,150,', HL = 'rgba(255,255,255,';
function step(x, y, ang, sz, side) {
  stamp(function (c) {
    var px = x + Math.cos(ang + Math.PI / 2) * side * 0.1 * sz, py = y + Math.sin(ang + Math.PI / 2) * side * 0.1 * sz, w = 0.1 * sz, h = 0.068 * sz;
    c.save(); c.translate(px, py); c.rotate(ang);
    c.fillStyle = HL + '0.55)'; c.beginPath(); c.ellipse(-0.012, -0.012, w * 1.25, h * 1.35, 0, 0, 7); c.fill();   // валик
    c.fillStyle = SH + '0.5)'; c.beginPath(); c.ellipse(0, 0, w, h, 0, 0, 7); c.fill();
    c.fillStyle = SH + '0.2)'; c.beginPath(); c.ellipse(w * 0.9, 0, w * 0.35, h * 0.7, 0, 0, 7); c.fill();   // носок
    c.restore();
    c.fillStyle = SH + '0.035)'; c.beginPath(); c.arc(x, y, 0.22 * sz, 0, 7); c.fill();   // тропа протаптывается
  });
}
function runner(x, y, ang, sz) {
  stamp(function (c) {
    var ca = Math.cos(ang), sa = Math.sin(ang), len = 0.3;
    [-1, 1].forEach(function (s) { var ox = -sa * s * 0.16 * sz, oy = ca * s * 0.16 * sz; c.lineCap = 'round';
      c.strokeStyle = HL + '0.5)'; c.lineWidth = 0.075 * sz; c.beginPath(); c.moveTo(x + ox - ca * len - 0.01, y + oy - sa * len - 0.012); c.lineTo(x + ox + ca * len - 0.01, y + oy + sa * len - 0.012); c.stroke();
      c.strokeStyle = SH + '0.4)'; c.lineWidth = 0.05 * sz; c.beginPath(); c.moveTo(x + ox - ca * len, y + oy - sa * len); c.lineTo(x + ox + ca * len, y + oy + sa * len); c.stroke(); });
    c.fillStyle = SH + '0.04)'; c.beginPath(); c.arc(x, y, 0.3 * sz, 0, 7); c.fill();
  });
}
function crater(x, y, r) {
  stamp(function (c) {
    var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(96,82,78,0.55)'); g.addColorStop(0.35, SH + '0.5)'); g.addColorStop(0.8, SH + '0.18)'); g.addColorStop(1, SH + '0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, 7); c.fill();
    c.strokeStyle = HL + '0.75)'; c.lineWidth = r * 0.14; c.beginPath(); c.ellipse(x, y, r * 0.95, r * 0.78, 0, Math.PI * 0.9, Math.PI * 2.1); c.stroke();
    c.strokeStyle = HL + '0.35)'; c.lineWidth = r * 0.1; c.beginPath(); c.ellipse(x, y, r * 1.05, r * 0.86, 0, Math.PI * 2.1, Math.PI * 2.9); c.stroke();
  });
}
function dent(x, y, r) { stamp(function (c) { c.fillStyle = HL + '0.5)'; c.beginPath(); c.ellipse(x - r * 0.15, y - r * 0.15, r * 1.2, r * 0.95, 0, 0, 7); c.fill(); c.fillStyle = SH + '0.38)'; c.beginPath(); c.ellipse(x, y, r, r * 0.75, 0, 0, 7); c.fill(); }); }
function trample(x, y, r) { stamp(function (c) { var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, SH + '0.16)'); g.addColorStop(0.75, SH + '0.12)'); g.addColorStop(1, SH + '0)'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r * 0.85, 0, 0, 7); c.fill(); }); }
// ---------- комья и пыль ----------
function burst(x, y, n, pow, big) {
  var s = cur(); if (!s) return;
  if (!big) { for (var d = 0; d < 3 && s.P.length < 120; d++) s.P.push({ dust: 1, x: x + (Math.random() - 0.5) * 0.3, y: y + (Math.random() - 0.5) * 0.15, t: 0, dur: 0.45 + Math.random() * 0.2, r: 0.12 + Math.random() * 0.1 }); return; }   // попадание / постройка — лёгкая снежная пыль у земли
  n = Math.min(n, 10);
  for (var i = 0; i < n && s.P.length < 120; i++) { var a = Math.random() * Math.PI * 2, sp = pow * (0.5 + Math.random() * 0.8);
    s.P.push({ x: x, y: y, z: 0.05, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.75, vz: pow * (1.4 + Math.random() * 1.2), r: 0.018 + Math.random() * 0.022, lump: Math.random() < 0.6 }); }
  for (var d2 = 0; d2 < 4; d2++) s.P.push({ dust: 1, x: x + (Math.random() - 0.5) * 0.6, y: y + (Math.random() - 0.5) * 0.3, t: -d2 * 0.05, dur: 0.6, r: 0.25 + Math.random() * 0.15 });
}
// ---------- шаги: берём существующие следы игры и вдавливаем их в снег ----------
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!G || !G.L || !UI || UI.screen !== 'level') return;
  var s = cur(); if (!s) return;
  try {
    var keep = [];
    for (var i = 0; i < G.decals.length; i++) { var d = G.decals[i];
      if (d.k === 'step') { d._s = d._s ? -d._s : 1; step(d.x, d.y - 0.05, d.rot || 0, Math.max(0.7, Math.min(2.2, d.s || 1)), (s.alt = -(s.alt || 1))); continue; }
      if (d.k === 'track') { runner(d.x, d.y - 0.05, d.rot || 0, Math.max(0.8, Math.min(2, d.s || 1))); continue; }
      if ((d.k === 'crater' || d.k === 'scorch') && !d._snow) { d._snow = 1; var rr = Math.max(0.3, (d.s || 1) * (d.k === 'crater' ? 0.55 : 0.4)); crater(d.x, d.y, rr); burst(d.x, d.y, d.k === 'crater' ? 10 : 4, d.k === 'crater' ? 1.6 : 1.1, d.k === 'crater'); if (allowed(G.L, Math.floor(d.x), Math.floor(d.y))) continue; }   // на снегу яму рисует снежный слой — старая наклейка с шариками не нужна
      keep.push(d); }
    G.decals = keep;
    // герои оставляют свои следы
    (G.squad || []).forEach(function (U) { if (U.dead) return; if (U._sx === undefined) { U._sx = U.x; U._sy = U.y; return; } var dx = U.x - U._sx, dy = U.y - U._sy, dd = Math.hypot(dx, dy); if (dd > 0.4) { U._ss = -(U._ss || 1); step(U.x, U.y + 0.05, Math.atan2(dy, dx), 0.9, U._ss); U._sx = U.x; U._sy = U.y; } });
    // сани в сопровождении
    if (G.sleigh && Z.sleighPos) { var sp = Z.sleighPos(); if (sp) { if (S.slx === undefined) { S.slx = sp.x; S.sly = sp.y; } var sdx = sp.x - S.slx, sdy = sp.y - S.sly; if (Math.hypot(sdx, sdy) > 0.25) { runner(sp.x, sp.y + 0.1, Math.atan2(sdy, sdx), 1.3); S.slx = sp.x; S.sly = sp.y; } } }
    // частицы: летят, падают, оставляют вмятинки
    s.P = s.P.filter(function (p) { if (p.dust) { p.t += dt; return p.t < p.dur; } p.vz -= 9 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z <= 0) { if (p.lump) dent(p.x, p.y, p.r * 0.8); return false; } return true; });
    // снегопад засыпает следы
    var wx = G.v26 && G.v26.wx, snowy = wx === 'snow' || wx === 'blizzard' || wx === 'storm';
    s.fadeT -= dt; if (s.fadeT <= 0) { s.fadeT = snowy ? 0.8 : 1.6; var c = s.c; c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = 'rgba(0,0,0,' + (snowy ? 0.06 : 0.035) + ')'; c.fillRect(0, 0, s.cv.width, s.cv.height); c.restore(); s.ver = (s.ver || 0) + 1; }
  } catch (e) { if (window.__rep) window.__rep(e); }
};
// попадания взметают снежную пыль (не чаще пары раз в секунду на врага)
var oDmg = Z.hk.dmg;
Z.hk.dmg = function (e, real, opts) {
  var r = oDmg ? oDmg.apply(this, arguments) : real;
  try { if (e && !e.air && r > 0 && S && S.G === Z.G && (Z.time - (e._puffT || 0)) > 0.45 && allowed(Z.G.L, Math.floor(e.x), Math.floor(e.y))) { e._puffT = Z.time; burst(e.x, e.y + 0.2, 5, 0.7, false); } } catch (er) { if (window.__rep) window.__rep(er); }
  return r;
};
// вышка утаптывает площадку
var oBuild = Z.buildTower;
Z.buildTower = function (type, c, r) { var res = oBuild.apply(this, arguments); try { if (res !== false) { trample(c + 0.5, r + 0.6, 0.62); burst(c + 0.5, r + 0.6, 8, 0.8, false); } } catch (e) { if (window.__rep) window.__rep(e); } return res; };
// ---------- отрисовка: слой — на земле (вызывается из drawDecals до следов-наклеек), частицы — в воздухе ----------
Z.drawSnowLayer = function (G, ctx, X, Y, cs) {
  var s = S; if (!s || s.G !== G) return;
  if (Z.save && Z.save.fxTracks === false) return;   // 2.12.12: настройка «Следы на снегу»
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(s.cv, X(0), Y(0), G.L.W * cs, G.L.H * cs); ctx.restore();
};
var oOver = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  if (oOver) oOver.apply(this, arguments);
  var s = S, G = Z.G; if (!s || s.G !== G || !s.P.length) return;
  try { s.P.forEach(function (p) { if (p.dust) { if (p.t < 0) return; var u = p.t / p.dur; ctx.globalAlpha = 0.32 * (1 - u); D.ell(X(p.x), Y(p.y) - u * cs * 0.15, p.r * cs * (0.6 + u * 0.8), p.r * cs * (0.35 + u * 0.4), '#ffffff'); return; } var x = X(p.x), y = Y(p.y), h = p.z * cs; ctx.globalAlpha = 0.25; D.ell(x, y, p.r * cs, p.r * cs * 0.4, '#5a6a9a'); ctx.globalAlpha = 0.95; if (p.lump) { D.circ(x, y - h, p.r * cs, '#f4f8ff'); ctx.globalAlpha = 0.6; D.circ(x + p.r * cs * 0.25, y - h + p.r * cs * 0.25, p.r * cs * 0.6, '#c3d2ee'); } else { ctx.globalAlpha = 0.7; D.circ(x, y - h, p.r * cs, '#ffffff'); } }); ctx.globalAlpha = 1; } catch (e) { ctx.globalAlpha = 1; }
};
})();
