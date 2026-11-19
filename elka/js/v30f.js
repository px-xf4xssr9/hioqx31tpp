/* 2.11.5 · Дед Мороз морозит посохом, удары героев видны на самом враге, ледяные шипы — по глубине.
   1) Морозный луч: Дед Мороз наводит посох на врага и бьёт ледяным лучом с набалдашника — урон по одному и сильное
      замедление (боссов морозит слабее). Если враг дальше удара посохом (но не дальше 2,6 клетки) — бьёт лучом;
      если рядом — чередует: удар о землю, затем луч.
   2) Попадание: когда герой бьёт врага (вблизи, снарядом или лучом), на самом враге — вспышка, «звёздочка» удара
      в цвете героя, снежные осколки и короткая отдача.
   3) Ледяные шипы от удара Деда Мороза встают в общую сортировку по глубине: те, что позади него, — за ним. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = D.OL || '#1b2448';
Z.fxDepth = true;
function G() { return Z.G; }
function R() { return Math.random(); }
function rnd(a, b) { return a + R() * (b - a); }
var HCOL = { moroz: ['#bfefff', '#4aa3ff'], sneg: ['#dff6ff', '#7fc8ff'], belka: ['#ffe2b0', '#ff8a3d'], plombir: ['#ffffff', '#7fd8ff'], kot: ['#e9d8ff', '#9a7bff'], eskimo: ['#fff3c4', '#ffb84a'] };
function push(f) { var g = G(); if (!g || g.fx.length > 440) return; f.t = 0; g.fx.push(f); }
function bodyH(e) { return (e.air ? 1.3 : 0) + 0.45 * (e.size || 1); }
function impact(e, type, big) {
  if (!e || e.dead && !big) return; var c = HCOL[type] || HCOL.moroz;
  push({ k: 'himp', x: e.x, y: e.y, z: bodyH(e), col: c[0], col2: c[1], s: big ? 1.25 : 1, seed: R() * 6, dur: 0.32 });
  e.hitT = Math.max(e.hitT || 0, 0.14);
}
// ---------- морозный луч ----------
function canHit(e) { return !e.dead && !(Z.heroCant ? Z.heroCant(e) : (Z.hk.untargetable && Z.hk.untargetable(e))); }
function beam(H, e) {
  var g = G(), A = Z.ALLIES.moroz, d = Math.hypot(e.x - H.x, e.y - H.y), K = (Z.ui.heroK && Z.ui.heroK.moroz) || 1, Rc = 0.4 * K;
  H.dir = e.x >= H.x ? 1 : -1; H.beamT = 0.65; H.cd = A.cd;
  // посох целится прямо во врага: угол от вертикали по экранному вектору от руки к цели (выше по полю — выше на экране)
  var px = H.x + H.dir * 0.8 * Rc, pz = 0.47 * Rc, tz = bodyH(e) + (H.y - e.y), vx = Math.abs(e.x - px), vz = tz - pz;
  var a = Math.max(0.15, Math.min(2.3, Math.atan2(vx, vz))); H.beamA = a;
  var tipX = px + H.dir * 2.8 * Rc * Math.sin(a), tipZ = pz + 2.8 * Rc * Math.cos(a);
  push({ k: 'mbeam', x0: tipX, y0: H.y, z0: tipZ, tgt: e, x1: e.x, y1: e.y, z1: bodyH(e), seed: R() * 6, d: 0.1, dur: 0.6 });
  setTimeout(function () {
    if (!e.dead && Z.damage) { Z.damage(e, H.dmg * 1.1, { frozenBonus: 1.3 }); if (e.dead) { g.heroKills = (g.heroKills || 0) + 1; } }
    if (!e.dead) { var sl = e.boss ? 0.25 : 0.5; e.slow = Math.max(e.slow || 0, sl); e.slowT = Math.max(e.slowT || 0, e.boss ? 1 : 1.6); }
    impact(e, 'moroz', true);
    for (var i = 0; i < 4; i++) push({ k: 'hspike', x: e.x + rnd(-0.28, 0.28), y: e.y + rnd(-0.1, 0.12), h: rnd(0.16, 0.28), w: 0.05, tilt: rnd(-0.35, 0.35), col: '#bfefff', ol: '#3f86c0', dur: 0.7 });
    if (Z.AU) { try { Z.AU.at(e.x, e.y); Z.AU.sfx('ice_break', 0.32, { pitch: rnd(1.05, 1.2), gap: 0.1 }); } catch (x) { if (window.__rep) window.__rep(x); } }
  }, 120);
  if (Z.AU) { try { Z.AU.at(H.x, H.y); Z.AU.sfx('freeze', 0.35, { pitch: rnd(1.1, 1.25), gap: 0.15 }); } catch (x) { if (window.__rep) window.__rep(x); } }
}
function morozTick(g, dt) {
  (g.squad || []).forEach(function (H) {
    if (H.type !== 'moroz') return;
    if (H.beamT > 0) H.beamT = Math.max(0, H.beamT - dt);
    if (H.dead || H.cd - dt > 0 || H.beamT > 0) return;
    var best = null, bd = 1e9, near = false;
    g.enemies.forEach(function (e) { if (!canHit(e)) return; var d = Math.hypot(e.x - H.x, e.y - H.y); if (d <= H.r) near = true; if (d <= 2.6 && d < bd) { bd = d; best = e; } });
    if (!best) return;
    if (!near) { beam(H, best); return; }
    H._bc = (H._bc || 0) + 1; if (H._bc % 2 === 0) beam(H, best);
  });
}
// ---------- попадания: вблизи — по таймингу удара, снаряд — при прилёте ----------
var oSnd = Z.heroAtkSnd;
Z.heroAtkSnd = function (H, aoe) {
  var r = oSnd ? oSnd.apply(this, arguments) : false;
  try { if (aoe) { var g = G(), list = g.enemies.filter(function (e) { return !e.dead && Math.hypot(e.x - H.x, e.y - H.y) <= H.r + 0.05; }).slice(0, 4);
    setTimeout(function () { list.forEach(function (e, i) { setTimeout(function () { impact(e, H.type, false); }, i * 30); }); }, H.type === 'moroz' ? 260 : 110); } } catch (x) { if (window.__rep) window.__rep(x); }
  return r;
};
var SH = new WeakMap(), lastShots = [];
function shotsTick(g) {
  var now = g.shots.filter(function (s) { return s.k === 'ally'; });
  lastShots.forEach(function (s) { if (now.indexOf(s) < 0) { var e = s.tgt; if (e && !e._noimp) impact(e, s.hero || 'sneg', false); } });
  lastShots = now;
}
var oU = Z.update;
Z.update = function (dt) { var g = G(); if (g && g.squad && g.phase !== 'paused') { try { morozTick(g, dt); } catch (x) { if (window.__rep) window.__rep(x); } } var r = oU.apply(this, arguments); g = G(); if (g && g.shots) { try { shotsTick(g); } catch (x) { if (window.__rep) window.__rep(x); } } return r; };
// ---------- рисование ----------
var oFx = D.fx;
D.fx = function (f, X, Y, cs, t, B) {
  if (f.k !== 'mbeam' && f.k !== 'himp') return oFx.apply(this, arguments);
  var c = D.ctx, tt = f.t - (f.d || 0); if (tt < 0) return; var pr = Math.min(1, tt / Math.max(0.01, f.dur - (f.d || 0)));
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  try {
    if (f.k === 'mbeam') {
      if (f.tgt && !f.tgt.dead) { f.x1 = f.tgt.x; f.y1 = f.tgt.y; }
      var x0 = X(f.x0), y0 = Y(f.y0) - f.z0 * cs, x1 = X(f.x1), y1 = Y(f.y1) - f.z1 * cs, grow = Math.min(1, tt / 0.08), fade = pr > 0.6 ? 1 - (pr - 0.6) / 0.4 : 1;
      var ex = x0 + (x1 - x0) * grow, ey = y0 + (y1 - y0) * grow, len = Math.hypot(ex - x0, ey - y0), nx = -(ey - y0) / (len || 1), ny = (ex - x0) / (len || 1);
      function path(amp, ph) { c.beginPath(); c.moveTo(x0, y0); var n = 10; for (var i = 1; i <= n; i++) { var u = i / n, w = Math.sin(u * Math.PI) * amp * Math.sin(u * 9 + ph + t * 30); c.lineTo(x0 + (ex - x0) * u + nx * w, y0 + (ey - y0) * u + ny * w); } }
      c.globalAlpha = 0.55 * fade; path(cs * 0.06, f.seed); c.strokeStyle = '#1f4f9a'; c.lineWidth = cs * 0.36; c.stroke(); c.globalAlpha = 0.6 * fade; c.strokeStyle = '#4aa3ff'; c.lineWidth = cs * 0.28; c.stroke();
      c.globalAlpha = 0.85 * fade; path(cs * 0.04, f.seed + 1); c.strokeStyle = '#9fe3ff'; c.lineWidth = cs * 0.16; c.stroke();
      c.globalAlpha = fade; path(cs * 0.02, f.seed + 2); c.strokeStyle = '#ffffff'; c.lineWidth = cs * 0.065; c.stroke();
      for (var k = 0; k < 5; k++) { var u2 = ((t * 2.5 + k / 5 + f.seed) % 1); c.globalAlpha = fade * (1 - Math.abs(u2 - 0.5)); D.flake(x0 + (ex - x0) * u2 + nx * Math.sin(k * 3) * cs * 0.1, y0 + (ey - y0) * u2 + ny * Math.sin(k * 3) * cs * 0.1, cs * 0.06, '#ffffff', Math.max(0.6, cs * 0.012)); }
      c.globalAlpha = fade; var gl = c.createRadialGradient(x0, y0, 0, x0, y0, cs * 0.3); gl.addColorStop(0, 'rgba(255,255,255,0.95)'); gl.addColorStop(1, 'rgba(160,230,255,0)'); c.fillStyle = gl; c.beginPath(); c.arc(x0, y0, cs * 0.3, 0, 7); c.fill();
      if (grow >= 1) { var g3 = c.createRadialGradient(ex, ey, 0, ex, ey, cs * 0.4); g3.addColorStop(0, 'rgba(255,255,255,0.9)'); g3.addColorStop(1, 'rgba(120,200,255,0)'); c.fillStyle = g3; c.beginPath(); c.arc(ex, ey, cs * 0.4, 0, 7); c.fill(); }
    } else {   // «звёздочка» удара на самом враге
      var x = X(f.x), y = Y(f.y) - f.z * cs, s = cs * 0.2 * f.s * (0.6 + 0.6 * Math.min(1, pr * 3)), al = (1 - pr) * 0.9;
      c.globalAlpha = al * 0.85; var g4 = c.createRadialGradient(x, y, 0, x, y, s * 1.1); g4.addColorStop(0, '#ffffff'); g4.addColorStop(0.5, f.col); g4.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g4; c.beginPath(); c.arc(x, y, s * 1.1, 0, 7); c.fill();
      c.globalAlpha = al; var pts = []; for (var i = 0; i < 16; i++) { var a = f.seed + i / 16 * Math.PI * 2, rr = i % 2 ? s * 0.42 : s; pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.85); }
      D.poly(pts, f.col, Math.max(1, cs * 0.03)); c.strokeStyle = f.col2; c.lineWidth = Math.max(1, cs * 0.02); c.stroke();
      D.circ(x, y, s * 0.28, '#ffffff');
      for (var j = 0; j < 6; j++) { var a2 = f.seed * 2 + j * 1.05, r2 = s * (0.9 + pr * 1.4); c.globalAlpha = al; D.circ(x + Math.cos(a2) * r2, y + Math.sin(a2) * r2 * 0.8 + pr * cs * 0.15, cs * 0.035 * (1 - pr * 0.5), j % 2 ? '#ffffff' : f.col2); }
    }
  } catch (x) { if (window.__rep) window.__rep(x); }
  c.restore();
};

// ---------- самовар: латунный, с гранями, медалями, ручками, краником, конфоркой и заварочным чайником; пар из чайника ----------
D.samovar = function (x, y, s, t, l) {
  var c = D.ctx; l = l || Math.max(1.2, s * 0.03); c.save(); c.translate(x, y);
  function G2(x0, y0, x1, y1, a, b, m) { var g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); if (m) g.addColorStop(0.45, m); g.addColorStop(1, b); return g; }
  var BR = G2(-s * 0.4, 0, s * 0.4, 0, '#fff0b0', '#9a6418', '#e0a838');
  // поднос и ножки
  D.ell(0, 0, s * 0.42, s * 0.06, '#c98a2c', l); [-0.22, 0, 0.22].forEach(function (q) { D.ell(q * s, -s * 0.03, s * 0.04, s * 0.03, '#b07a20', l * 0.6); });
  // подставка-шейка
  c.beginPath(); c.moveTo(-s * 0.16, -s * 0.04); c.lineTo(-s * 0.1, -s * 0.16); c.lineTo(s * 0.1, -s * 0.16); c.lineTo(s * 0.16, -s * 0.04); c.closePath(); c.fillStyle = BR; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  // ручки
  [-1, 1].forEach(function (d) { c.beginPath(); c.moveTo(d * s * 0.27, -s * 0.5); c.quadraticCurveTo(d * s * 0.45, -s * 0.48, d * s * 0.36, -s * 0.34); c.lineWidth = l * 2.4; c.strokeStyle = OL; c.stroke(); c.lineWidth = l * 1.2; c.strokeStyle = '#3a2a1a'; c.stroke(); });
  // тулово с гранями
  c.beginPath(); c.moveTo(-s * 0.12, -s * 0.16); c.quadraticCurveTo(-s * 0.36, -s * 0.2, -s * 0.32, -s * 0.42); c.quadraticCurveTo(-s * 0.3, -s * 0.6, -s * 0.16, -s * 0.62); c.lineTo(s * 0.16, -s * 0.62); c.quadraticCurveTo(s * 0.3, -s * 0.6, s * 0.32, -s * 0.42); c.quadraticCurveTo(s * 0.36, -s * 0.2, s * 0.12, -s * 0.16); c.closePath();
  c.fillStyle = BR; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  c.save(); c.clip(); c.strokeStyle = 'rgba(120,70,10,0.35)'; c.lineWidth = l * 0.6; for (var g = -3; g <= 3; g++) { c.beginPath(); c.moveTo(g * s * 0.09, -s * 0.62); c.quadraticCurveTo(g * s * 0.12, -s * 0.4, g * s * 0.06, -s * 0.16); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(-s * 0.17, -s * 0.44, s * 0.04, s * 0.13, -0.1, 0, 7); c.fill(); c.restore();
  // пояс с медалями
  c.fillStyle = '#b07a20'; c.fillRect(-s * 0.32, -s * 0.47, s * 0.64, s * 0.035); c.lineWidth = l * 0.5; c.strokeStyle = OL; c.strokeRect(-s * 0.32, -s * 0.47, s * 0.64, s * 0.035);
  [-0.15, 0, 0.15].forEach(function (q) { D.circ(q * s, -s * 0.36, s * 0.035, '#ffe27a', l * 0.5); D.circ(q * s, -s * 0.36, s * 0.015, '#c98a2c'); });
  // краник
  c.beginPath(); c.moveTo(s * 0.02, -s * 0.24); c.lineTo(s * 0.14, -s * 0.24); c.lineTo(s * 0.16, -s * 0.18); c.lineWidth = l * 1.8; c.strokeStyle = OL; c.stroke(); c.lineWidth = l * 0.9; c.strokeStyle = '#e0a838'; c.stroke();
  D.circ(s * 0.06, -s * 0.27, s * 0.025, '#3a2a1a', l * 0.4);
  // конфорка, корона и чайник
  D.rr(-s * 0.13, -s * 0.7, s * 0.26, s * 0.08, s * 0.02); c.fillStyle = BR; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  for (var cr = 0; cr < 5; cr++) D.poly([-s * 0.12 + cr * s * 0.06, -s * 0.7, -s * 0.09 + cr * s * 0.06, -s * 0.76, -s * 0.06 + cr * s * 0.06, -s * 0.7], '#e0a838', l * 0.5);
  var ty = -s * 0.76; D.ell(0, ty - s * 0.1, s * 0.13, s * 0.1, '#ffffff', l); c.save(); c.beginPath(); c.ellipse(0, ty - s * 0.1, s * 0.13, s * 0.1, 0, 0, 7); c.clip();
  for (var dt2 = 0; dt2 < 3; dt2++) D.circ(-s * 0.06 + dt2 * s * 0.06, ty - s * 0.09, s * 0.025, dt2 === 1 ? '#3f86c0' : '#e8484f'); c.restore();
  c.beginPath(); c.moveTo(s * 0.12, ty - s * 0.1); c.quadraticCurveTo(s * 0.22, ty - s * 0.12, s * 0.24, ty - s * 0.2); c.lineWidth = l * 1.6; c.strokeStyle = OL; c.stroke(); c.lineWidth = l * 0.7; c.strokeStyle = '#ffffff'; c.stroke();
  D.ell(0, ty - s * 0.2, s * 0.05, s * 0.02, '#ffffff', l * 0.6); D.circ(0, ty - s * 0.23, s * 0.022, '#e8484f', l * 0.5);
  // пар из носика
  for (var st = 0; st < 4; st++) { var sp = (t * 0.45 + st / 4) % 1; c.globalAlpha = 0.55 * (1 - sp) * Math.min(1, sp * 6); D.circ(s * 0.25 + Math.sin(sp * 5 + st) * s * 0.05, ty - s * 0.22 - sp * s * 0.5, s * (0.03 + sp * 0.06), '#ffffff'); } c.globalAlpha = 1;
  // чашка с блюдцем рядом
  D.ell(s * 0.36, -s * 0.01, s * 0.1, s * 0.025, '#ffffff', l * 0.6); D.rr(s * 0.29, -s * 0.1, s * 0.14, s * 0.09, s * 0.03); c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = l * 0.8; c.strokeStyle = OL; c.stroke();
  c.beginPath(); c.arc(s * 0.43, -s * 0.06, s * 0.03, -Math.PI / 2, Math.PI / 2); c.stroke(); D.circ(s * 0.36, -s * 0.055, s * 0.02, '#3f86c0');
  c.restore();
};
// ---------- шипы — по глубине ----------
var oO = Z.drawObjs;
Z.drawObjs = function (objs, X, Y, cs, t) {
  if (oO) oO.apply(this, arguments);
  var g = G(); if (!g || !g.fx) return;
  g.fx.forEach(function (f) { if (f.k === 'hspike') objs.push({ y: f.y + 0.02, f: function () { try { D.fx(f, X, Y, cs, t); } catch (x) { if (window.__rep) window.__rep(x); } }, o: f }); });
};
})();
