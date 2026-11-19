/* 2.11.5 · разрушение ловушек и баррикад.
   Ловушка не исчезает, а разваливается по-своему: шипы раскалываются на осколки, капкан разжимается и разлетается
   (челюсти, пружина, болты), у фонаря бьётся стекло и падает столб, ящик петард разламывается на дощечки, у мины
   разлетается корпус, лужа трескается и тает. Баррикада рассыпается на куски своего облика.
   Обломки летят по дуге, падают, отскакивают, скользят и тают; над водой тонут с кругами. Цвета — от облика. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = D.OL || '#1b2448';
function C() { return D.ctx; }
function R(a, b) { return a + Math.random() * (b - a); }
var SH = {   // осколки шипов: [светлый, тёмный]
  base: ['#ffffff', '#8fd0f0'], gift: ['#ffffff', '#e8484f'], ginger: ['#e2ad72', '#a86a34'], crystal: ['#ffffff', '#6fc6f0'], garland: ['#3c9a5f', '#174a2c'], royal: ['#fff1a8', '#c98a1c'] };
var MET = { base: '#c9d2e3', gift: '#e8484f', ginger: '#a86a34', crystal: '#9fe8ff', garland: '#4caf6e', royal: '#ffd54a' };
var BOX = { base: '#9a6a3a', gift: '#e8484f', ginger: '#c98a4e', crystal: '#bfe9ff', garland: '#2c7a4b', royal: '#ffd54a' };
var PUD = { base: '#bfe6ff', gift: '#ffb3ba', ginger: '#f2c084', crystal: '#e6fbff', garland: '#bfe6ff', royal: '#fff1a8' };
var WR = [];
function piece(w, o) { o.x = w.x + (o.dx || 0); o.y = w.y + (o.dy || 0); o.z = o.z || R(0.05, 0.2); o.rot = o.rot != null ? o.rot : R(0, 6.28); o.vr = o.vr != null ? o.vr : R(-9, 9); o.life = o.life || R(1.8, 2.6); o.age = 0; w.p.push(o); return o; }
function burst(w, n, sp, up, mk) { for (var i = 0; i < n; i++) { var a = (i / n) * 6.28 + R(-0.4, 0.4), v = R(sp * 0.5, sp); piece(w, mk(i, { vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: R(up * 0.6, up) })); } }
var MAKE = {
  spike: function (w, id) { var c = SH[id] || SH.base; burst(w, 9, 0.9, 2.1, function (i, o) { o.k = 'shard'; o.s = R(0.09, 0.15); o.c0 = c[0]; o.c1 = c[1]; return o; }); w.fx.push({ k: 'hole', r: 0.34, life: 1.6 }); w.fx.push({ k: 'snow', life: 0.5 }); },
  puddle: function (w, id) { w.fx.push({ k: 'crack', life: 1.8, col: PUD[id] || PUD.base }); for (var i = 0; i < 6; i++) { var a = i / 6 * 6.28 + R(-0.3, 0.3); piece(w, { k: 'plate', s: R(0.08, 0.13), c0: PUD[id] || PUD.base, vx: Math.cos(a) * R(0.3, 0.7), vy: Math.sin(a) * R(0.2, 0.4), vz: R(0.4, 0.9), z: 0.02, vr: R(-3, 3), life: R(1.4, 2) }); } },
  mine: function (w, id) { var col = id === 'base' ? '#c22a36' : BOX[id] || '#c22a36'; burst(w, 8, 1.2, 2.8, function (i, o) { o.k = i % 3 ? 'plank' : 'shard'; o.s = R(0.05, 0.09); o.c0 = i % 2 ? col : '#3d3d4a'; o.c1 = '#3d3d4a'; return o; }); w.fx.push({ k: 'snow', life: 0.7 }); },
  snare: function (w, id) { var m = MET[id] || MET.base;
    piece(w, { k: 'jaw', s: 0.3, c0: m, vx: -0.6, vy: R(-0.15, 0.15), vz: 2.2, vr: -6 }); piece(w, { k: 'jaw', s: 0.3, c0: m, vx: 0.6, vy: R(-0.15, 0.15), vz: 2.4, vr: 6, flip: 1 });
    piece(w, { k: 'coil', s: 0.12, c0: m, vx: R(-0.3, 0.3), vy: 0.2, vz: 3.6, vr: R(-12, 12) });
    burst(w, 4, 0.8, 1.8, function (i, o) { o.k = 'circ'; o.s = 0.03; o.c0 = '#6b7592'; return o; }); },
  fw: function (w, id) { var b = BOX[id] || BOX.base, cols = ['#e8484f', '#4aa3ff', '#ffd54a', '#4cc77d'];
    burst(w, 4, 0.7, 1.6, function (i, o) { o.k = 'plank'; o.s = R(0.09, 0.13); o.c0 = b; return o; });
    burst(w, 3, 0.6, 2.2, function (i, o) { o.k = 'tube'; o.s = 0.1; o.c0 = cols[i]; return o; });
    for (var i = 0; i < 3; i++) w.fx.push({ k: 'smoke', dx: R(-0.15, 0.15), life: R(1, 1.6), d: i * 0.15 }); },
  lamp: function (w, id) { var post = id === 'base' ? '#3c4f8c' : id === 'ginger' ? '#a86a34' : id === 'gift' ? '#ffffff' : MET[id];
    piece(w, { k: 'pole', s: 0.62, c0: post, ang: 0, va: R(0.4, 0.8) * (Math.random() < 0.5 ? -1 : 1), z: 0, vz: 0, vx: 0, vy: 0, vr: 0, life: 2.8 });
    burst(w, 6, 0.6, 1.4, function (i, o) { o.k = 'shard'; o.s = R(0.045, 0.07); o.c0 = '#fffbe8'; o.c1 = '#ffd27a'; o.dz = 0.5; o.z = 0.5; return o; });
    w.fx.push({ k: 'flash', life: 0.5 }); }
};
var BAR = {
  base: function (w) { burst(w, 6, 0.8, 1.9, function (i, o) { o.k = i < 4 ? 'block' : 'shard'; o.s = i < 4 ? R(0.1, 0.14) : 0.12; o.c0 = '#ffffff'; o.c1 = '#a9c8ec'; return o; }); w.fx.push({ k: 'snow', life: 0.8, big: 1 }); },
  gift: function (w) { var bc = ['#e8484f', '#4cc77d', '#3fb6e6']; burst(w, 7, 0.85, 2.1, function (i, o) { o.k = i < 3 ? 'box' : 'plank'; o.s = i < 3 ? R(0.1, 0.13) : 0.08; o.c0 = i < 3 ? bc[i] : '#ffd54a'; o.c1 = '#ffd54a'; return o; }); },
  ginger: function (w) { var gd = ['#e8484f', '#4cc77d', '#ffd54a']; burst(w, 8, 0.85, 2, function (i, o) { o.k = i < 5 ? 'plank' : 'circ'; o.s = i < 5 ? R(0.1, 0.14) : 0.035; o.c0 = i < 5 ? '#c98a4e' : gd[i - 5]; return o; }); },
  crystal: function (w) { burst(w, 9, 0.9, 2.2, function (i, o) { o.k = 'shard'; o.s = R(0.08, 0.15); o.c0 = '#ffffff'; o.c1 = '#6fc6f0'; return o; }); w.fx.push({ k: 'flash', life: 0.35, col: '191,239,255' }); },
  garland: function (w) { burst(w, 2, 0.5, 1.4, function (i, o) { o.k = 'log'; o.s = 0.2; o.c0 = '#a8723f'; o.vr = R(-3, 3); return o; });
    burst(w, 6, 0.85, 2, function (i, o) { o.k = i < 3 ? 'plank' : 'circ'; o.s = i < 3 ? 0.09 : 0.03; o.c0 = i < 3 ? '#2c7a4b' : ['#ff5a5f', '#ffd54a', '#5ac8ff'][i - 3]; return o; }); },
  royal: function (w) { burst(w, 8, 0.85, 2.1, function (i, o) { o.k = i < 5 ? 'stake' : 'circ'; o.s = i < 5 ? R(0.11, 0.15) : 0.035; o.c0 = i < 5 ? '#c22a36' : '#ffd54a'; return o; }); }
};
function spawn(kind, type, id, c, r, L) {
  if (WR.length > 24) WR.shift();
  var w = { x: c + 0.5, y: r + 0.55, r: r, p: [], fx: [], t: 0, sink: !!(L && L.grid[r] && L.grid[r][c] === 4) };
  try { if (kind === 'trap') (MAKE[type] || MAKE.spike)(w, id || 'base'); else (BAR[id] || BAR.base)(w); } catch (e) { if (window.__rep) window.__rep(e); }
  WR.push(w);
}
Z.trapWreck = spawn; Z._wr = { WR: WR, step: step, draw: function (w, X, Y, cs, t) { drawW(w, X, Y, cs, t); } };
function step(dt) {
  for (var i = WR.length - 1; i >= 0; i--) { var w = WR[i]; w.t += dt; var alive = false;
    w.p.forEach(function (p) { p.age += dt; if (p.age < p.life) alive = true;
      if (p.k === 'pole') { var dr = p.dir || (p.dir = Math.sign(p.va) || 1); if (!p.hit) { p.va += dr * 9 * dt; p.ang += p.va * dt; if (p.ang * dr >= 1.45) { p.ang = 1.45 * dr; p.hit = 1; p.va = -p.va * 0.18; } } else { p.va += dr * 9 * dt; p.ang += p.va * dt; if (p.ang * dr >= 1.45) { p.ang = 1.45 * dr; p.va = 0; } } return; }
      if (p.sunk) { p.z -= dt * 0.3; return; }
      p.vz -= 9 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt;
      if (p.z <= 0) { p.z = 0; if (w.sink) { p.sunk = 1; p.life = Math.min(p.life, p.age + 0.6); w.fx.push({ k: 'ring', dx: p.x - w.x, dy: p.y - w.y, life: 0.8 }); return; }
        if (Math.abs(p.vz) > 0.6) { p.vz = -p.vz * 0.35; p.vx *= 0.6; p.vy *= 0.6; p.vr *= 0.5; } else { p.vz = 0; p.vx *= Math.pow(0.02, dt); p.vy *= Math.pow(0.02, dt); p.vr *= Math.pow(0.02, dt); } } });
    w.fx.forEach(function (f) { f.age = (f.age || 0) + dt; if (f.age < f.life + (f.d || 0)) alive = true; });
    if (!alive) WR.splice(i, 1); }
}
function shape(c, p, cs, l) {
  var s = p.s * cs; l = Math.min(l, Math.max(0.8, s * 0.22));
  if (p.k === 'shard') { var g = c.createLinearGradient(-s * 0.5, 0, s * 0.5, 0); g.addColorStop(0, p.c0); g.addColorStop(1, p.c1 || p.c0); D.poly([-s * 0.45, s * 0.4, 0, -s, s * 0.45, s * 0.4], g, l * 0.6); }
  else if (p.k === 'plate') { c.globalAlpha *= 0.85; D.poly([-s, -s * 0.2, -s * 0.2, -s * 0.5, s, -s * 0.1, s * 0.4, s * 0.4, -s * 0.6, s * 0.3], p.c0, l * 0.5); }
  else if (p.k === 'plank' || p.k === 'stake') { D.rr(-s, -s * 0.32, s * 2, s * 0.64, s * 0.12); c.fillStyle = p.c0; c.fill(); c.lineWidth = l * 0.6; c.strokeStyle = OL; c.stroke(); if (p.k === 'stake') D.poly([s, -s * 0.32, s * 1.5, 0, s, s * 0.32], '#ffd54a', l * 0.5); }
  else if (p.k === 'block') { D.rr(-s, -s * 0.6, s * 2, s * 1.2, s * 0.35); c.fillStyle = p.c0; c.fill(); c.lineWidth = l * 0.6; c.strokeStyle = OL; c.stroke(); D.rr(-s * 0.7, -s * 0.45, s * 0.9, s * 0.18, s * 0.09); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill(); }
  else if (p.k === 'box') { c.fillStyle = p.c0; c.fillRect(-s, -s, s * 2, s * 2); c.fillStyle = p.c1; c.fillRect(-s * 0.18, -s, s * 0.36, s * 2); c.lineWidth = l * 0.6; c.strokeStyle = OL; c.strokeRect(-s, -s, s * 2, s * 2); }
  else if (p.k === 'circ') D.circ(0, 0, s, p.c0, l * 0.4);
  else if (p.k === 'tube') { D.rr(-s * 0.3, -s, s * 0.6, s * 2, s * 0.15); c.fillStyle = p.c0; c.fill(); c.lineWidth = l * 0.5; c.strokeStyle = OL; c.stroke(); D.poly([-s * 0.32, -s, 0, -s * 1.5, s * 0.32, -s], '#ffffff', l * 0.4); }
  else if (p.k === 'log') { D.rr(-s, -s * 0.35, s * 2, s * 0.7, s * 0.35); c.fillStyle = p.c0; c.fill(); c.lineWidth = l * 0.6; c.strokeStyle = OL; c.stroke(); D.ell(s * 0.75, 0, s * 0.2, s * 0.3, '#e2b47e', l * 0.4); }
  else if (p.k === 'jaw') { c.scale(p.flip ? -1 : 1, 1); c.beginPath(); c.ellipse(0, 0, s, s * 0.6, 0, Math.PI, 0); c.lineCap = 'round'; c.strokeStyle = OL; c.lineWidth = l * 1.9; c.stroke(); c.strokeStyle = p.c0; c.lineWidth = l * 1; c.stroke();
    for (var k = 1; k < 5; k++) { var a = Math.PI + k / 5 * Math.PI, tx = Math.cos(a) * s, ty = Math.sin(a) * s * 0.6; D.poly([tx - s * 0.07, ty, tx, ty + s * 0.2, tx + s * 0.07, ty], '#eef2fa', Math.max(0.6, l * 0.3)); } }
  else if (p.k === 'coil') { c.beginPath(); for (var j = 0; j <= 8; j++) { var px = -s + j * s / 4, py = j % 2 ? -s * 0.5 : s * 0.5; if (j) c.lineTo(px, py); else c.moveTo(px, py); } c.strokeStyle = OL; c.lineWidth = l * 1.2; c.stroke(); c.strokeStyle = p.c0; c.lineWidth = l * 0.6; c.stroke(); }
}
function drawW(w, X, Y, cs, t) {
  var c = C(), l = Math.max(1.2, cs * 0.04), bx = X(w.x), by = Y(w.y);
  w.fx.forEach(function (f) { var a = f.age - (f.d || 0); if (a < 0 || a > f.life) return; var q = a / f.life;
    if (f.k === 'hole') { c.globalAlpha = 0.55 * (1 - q); D.ell(bx, by, f.r * cs, f.r * cs * 0.42, '#1e2a50'); c.globalAlpha = 1; }
    else if (f.k === 'crack') { c.globalAlpha = 1 - q; D.ell(bx, by, cs * 0.44 * (1 - q * 0.5), cs * 0.24 * (1 - q * 0.5), f.col); c.strokeStyle = 'rgba(40,70,120,0.8)'; c.lineWidth = Math.max(1, l * 0.5); c.beginPath();
      for (var k = 0; k < 7; k++) { var an = k / 7 * 6.28 + 0.3, rr = Math.min(1, a * 4) * cs * 0.4; c.moveTo(bx, by); c.lineTo(bx + Math.cos(an) * rr * 0.5 + cs * 0.03, by + Math.sin(an) * rr * 0.28); c.lineTo(bx + Math.cos(an) * rr, by + Math.sin(an) * rr * 0.55); } c.stroke(); c.globalAlpha = 1; }
    else if (f.k === 'snow') { var n = f.big ? 10 : 7; c.globalAlpha = 0.85 * (1 - q); for (var j = 0; j < n; j++) { var an2 = j / n * 6.28; D.circ(bx + Math.cos(an2) * cs * (0.15 + q * 0.45), by - cs * 0.1 + Math.sin(an2) * cs * (0.08 + q * 0.2) - Math.sin(q * 3.14) * cs * 0.2, cs * (0.07 + q * 0.06), '#ffffff'); } c.globalAlpha = 1; }
    else if (f.k === 'smoke') { c.globalAlpha = 0.55 * (1 - q); D.circ(bx + (f.dx || 0) * cs, by - cs * (0.25 + q * 0.9), cs * (0.1 + q * 0.22), '#d7deec'); c.globalAlpha = 1; }
    else if (f.k === 'flash') { var g = c.createRadialGradient(bx, by - cs * 0.45, 0, bx, by - cs * 0.45, cs * 0.6); g.addColorStop(0, 'rgba(' + (f.col || '255,236,170') + ',' + (0.8 * (1 - q)).toFixed(2) + ')'); g.addColorStop(1, 'rgba(' + (f.col || '255,236,170') + ',0)'); c.fillStyle = g; c.beginPath(); c.arc(bx, by - cs * 0.45, cs * 0.6, 0, 7); c.fill(); }
    else if (f.k === 'ring') { c.globalAlpha = 0.8 * (1 - q); c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1, l * 0.5); c.beginPath(); c.ellipse(bx + f.dx * cs, by + f.dy * cs, cs * (0.05 + q * 0.2), cs * (0.025 + q * 0.1), 0, 0, 7); c.stroke(); c.globalAlpha = 1; } });
  w.p.forEach(function (p) { if (p.age >= p.life) return; var fade = Math.min(1, (p.life - p.age) / 0.5), px = X(p.x), py = Y(p.y);
    if (p.k === 'pole') { c.save(); c.globalAlpha = fade; c.translate(px, py); c.rotate(p.ang); var h = p.s * cs; line2(c, 0, 0, 0, -h, OL, l * 2.6); line2(c, 0, 0, 0, -h, p.c0, l * 1.3); line2(c, 0, -h, cs * 0.16, -h, OL, l * 2.2); line2(c, 0, -h, cs * 0.16, -h, p.c0, l * 1.1); D.rr(cs * 0.09, -h + cs * 0.04, cs * 0.14, cs * 0.17, cs * 0.03); c.fillStyle = '#5a5f76'; c.fill(); c.lineWidth = l * 0.8; c.strokeStyle = OL; c.stroke(); c.restore(); return; }
    c.save(); c.globalAlpha = fade * (p.sunk ? Math.max(0, 1 + p.z * 4) : 1);
    if (p.z > 0.02 && !p.sunk) { c.globalAlpha *= 0.25; D.ell(px, py, p.s * cs * 0.9, p.s * cs * 0.35, '#1e2a50'); c.globalAlpha = fade; }
    c.translate(px, py - Math.max(0, p.z) * cs - p.s * cs * 0.4); c.rotate(p.rot); shape(c, p, cs, l); c.restore(); });
}
function line2(c, x0, y0, x1, y1, col, w) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }

// ---------- что пропало за кадр — то и развалилось ----------
var ST = {}, SB = {}, lastG = null;
var SND = { spike: 'tp_shatter', snare: 'tp_spring', fw: 'tp_crumble', lamp: 'tp_glass', puddle: 'w_icecrack', mine: null };
function has(n) { var A = Z.AU; return !!(A && A.bufs && (A.bufs[n] || A.bufs['sfx_' + n])); }
function snd(n, x, y, v) { var A = Z.AU; if (!n || !A || !A.running || !A.running() || !has(n)) return; try { A.at(x, y); A.sfx(n, v, { pitch: 0.94 + Math.random() * 0.12 }); } catch (e) { if (window.__rep) window.__rep(e); } }
function watch(G, dt) {
  if (G !== lastG) { lastG = G; ST = {}; SB = {}; WR.length = 0; }
  var L = G.L, k;
  for (k in ST) if (!G.traps[k]) { var s = ST[k]; delete ST[k]; spawn('trap', s.type, s.id, s.c, s.r, L); snd(SND[s.type], s.c + 0.5, s.r + 0.5, 0.55); }
  for (k in SB) if (!G.barricades[k]) { var b = SB[k]; delete SB[k]; spawn('barr', null, b.id, b.c, b.r, L); }
  for (k in G.traps) { var tr = G.traps[k], o = ST[k] || (ST[k] = { type: tr.type, c: tr.c, r: tr.r }); o.type = tr.type; if (!o.id || Math.random() < 0.05) o.id = Z.trapSkin ? Z.trapSkin(tr) : 'base'; }
  for (k in G.barricades) { var bb = G.barricades[k], ob = SB[k] || (SB[k] = { c: bb.c, r: bb.r }); if (!ob.id || Math.random() < 0.05) ob.id = Z.barrSkin ? Z.barrSkin(bb) : 'base'; }
  step(dt);
}
var oU = Z.update;
Z.update = function (dt) { oU.apply(this, arguments); var G = Z.G; if (!G || !G.traps) return; try { watch(G, dt); } catch (e) { if (window.__rep) window.__rep(e); } };
var oO = Z.drawObjs;
Z.drawObjs = function (objs, X, Y, cs, t) { if (oO) oO.apply(this, arguments); WR.forEach(function (w) { objs.push({ y: w.r + 0.6, f: function () { try { drawW(w, X, Y, cs, t); } catch (e) { if (window.__rep) window.__rep(e); } }, o: w }); }); };
})();
