/* 2.7.23–24 · Поединок на Калиновом мосту: Пломбир против Змея Горыныча, вид от первого лица.
   Боёвка: замах головы с подсказкой → щит (держать) / парирование (нажать прямо перед ударом) → оглушение → контрудар.
   Головы не рубятся: они засыпают, а Дед Мороз накрывает уснувшую голову ледяным колпаком.
   Весь режим в этом файле: чтобы откатить, достаточно убрать его из index.html. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, OL = D.OL, TT = Z.TT;

// ---------- настройки (секунды) ----------
var CFG = {
  parry: 0.3,        // окно парирования: щит нажат не раньше чем за столько до удара
  parryLock: 0.45,   // повторное нажатие щита раньше этого — уже не парирование (против «долбёжки»)
  wind: 1.05,        // замах головы; с каждой уснувшей головой быстрее
  windHeavy: 1.3,    // замах средней головы сверху
  act: 0.12,         // сам бросок головы
  rec: 0.62,         // голова возвращается — в это время её можно бить
  stun: 1.6,         // оглушение после парирования
  wake: 4.2,         // уснувшая голова просыпается, если не заморозить
  wakeHp: 45,
  dmgSide: 14, dmgHeavy: 22, chip: 3, chipHeavy: 8,
  hit: [11, 11, 17], counter: 2.6, headBlock: 0.5,
  hitstop: 1, shake: 1,
  windFire: 1.2, breath: 1.0, fireTick: 0.12, fireDmg: 3.4, fireChip: 0.5
};

var DU = null; // состояние поединка
Z.duelCFG = CFG;

// ---------- звук: синтез поверх общего канала эффектов ----------
var SND = (function () {
  function ok() { var A = Z.AU; return A && A.ctx && A.sfxG && A.running && A.running(); }
  function tone(type, f0, f1, dur, vol, delay) { if (!ok()) return; var A = Z.AU, c = A.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(A.sfxG); o.start(t); o.stop(t + dur + 0.05); }
  function noise(dur, type, f0, f1, q, vol, delay) { if (!ok() || !Z.AU.noise) return; var A = Z.AU, c = A.ctx, t = c.currentTime + (delay || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = A.noise; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(A.sfxG); s.start(t); s.stop(t + dur + 0.05); }
  function ring(base, dur, vol) { [1, 2.76, 5.4].forEach(function (m, i) { tone(i < 2 ? 'triangle' : 'sine', base * m, base * m * 0.995, dur / (1 + i * 0.5), vol / (1 + i * 0.7)); }); }
  return {
    whoosh: function (p) { noise(0.22, 'bandpass', 500 * (p || 1), 1800 * (p || 1), 1.1, 0.35); },
    swing: function (p) { noise(0.16, 'bandpass', 900 * (p || 1), 2600 * (p || 1), 1.2, 0.28); },
    block: function () { ring(1300, 0.35, 0.16); noise(0.05, 'highpass', 3000, 5000, 0.7, 0.25); tone('sine', 160, 80, 0.09, 0.22); },
    heavy: function () { ring(900, 0.45, 0.2); tone('sine', 110, 55, 0.14, 0.35); noise(0.07, 'highpass', 2500, 4000, 0.7, 0.3); },
    parry: function () { ring(1900, 1.0, 0.24); ring(2600, 0.7, 0.1); noise(0.05, 'highpass', 5000, 7000, 0.7, 0.35); },
    clash: function () { ring(1500, 0.5, 0.2); ring(1800, 0.5, 0.14); noise(0.06, 'highpass', 3500, 5000, 0.7, 0.3); },
    bonk: function () { tone('sine', 320, 120, 0.12, 0.4); noise(0.08, 'lowpass', 1400, 300, 0.8, 0.35); },
    hurt: function () { tone('sine', 90, 45, 0.2, 0.5); noise(0.18, 'lowpass', 700, 150, 0.8, 0.5); },
    sleep: function () { tone('sine', 520, 260, 0.6, 0.12); tone('sine', 390, 200, 0.7, 0.1, 0.25); }
  };
})();
function sfx(n, v) { try { Z.AU.sfx(n, v); } catch (e) { if (window.__rep) window.__rep(e); } }

// ---------- помощники рисования ----------
function C() { return D.ctx; }
function lg(c, x0, y0, x1, y1, a, b) { var g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function rg(c, x, y, r, a, b) { var g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function strk(c, col, w, f) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); f(c); c.stroke(); }
function shape(c, f, fill, lw) { c.beginPath(); f(c); c.closePath(); c.fillStyle = fill; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = OL; c.lineJoin = 'round'; c.stroke(); } }
function kal(c, x, y, s) { var w = Math.max(1, s * 0.08); D.ell(x - s * 0.5, y - s * 0.2, s * 0.55, s * 0.3, '#3f7a4a', w); D.ell(x + s * 0.5, y - s * 0.25, s * 0.5, s * 0.28, '#5a9a52', w); for (var e = 0; e < 5; e++) D.circ(x + (e % 3 - 1) * s * 0.32, y + Math.floor(e / 3) * s * 0.28 + (e % 2) * s * 0.08, s * 0.2, '#e5323b', Math.max(1, s * 0.07)); D.circ(x - s * 0.38, y - s * 0.06, s * 0.06, '#ffd0d0'); }
function ease(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
function easeIn(t) { t = Math.max(0, Math.min(1, t)); return t * t * t; }
function easeOut(t) { t = Math.max(0, Math.min(1, t)); return 1 - Math.pow(1 - t, 3); }
function spring(k, d) { return { k: k, x: 0, v: 0, hit: function (peak) { this.v += peak * Math.sqrt(this.k) * 1.3; }, step: function (dt) { var n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n; for (var i = 0; i < n; i++) { this.v += (-k * this.x - d * this.v) * h; this.x += this.v * h; } } }; }

// голова анфас; mode: idle | angry | bite | dizzy | sleep; acc — цвет «характера» головы
function head(c, x, y, s, mode, rot, t, acc, flash) {
  c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s, s); var L = 4.5;
  shape(c, function (q) { q.moveTo(-58, -40); q.quadraticCurveTo(-92, -92, -70, -128); q.quadraticCurveTo(-58, -84, -30, -58); }, '#ffd54a', L);
  shape(c, function (q) { q.moveTo(58, -40); q.quadraticCurveTo(92, -92, 70, -128); q.quadraticCurveTo(58, -84, 30, -58); }, '#ffd54a', L);
  shape(c, function (q) { q.moveTo(-16, -66); q.lineTo(0, -104); q.lineTo(16, -66); }, acc, L * 0.8);
  D.ell(0, -6, 98, 74, rg(c, 0, -6, 110, '#8ad89a', '#3a8a4a'), L);
  shape(c, function (q) { q.moveTo(-92, -6); q.lineTo(-124, 8); q.lineTo(-90, 22); }, '#3f8a4a', L * 0.8); shape(c, function (q) { q.moveTo(92, -6); q.lineTo(124, 8); q.lineTo(90, 22); }, '#3f8a4a', L * 0.8);
  if (mode === 'bite') { D.ell(0, 50, 70, 52, '#7a2a2a', L); D.ell(0, 74, 38, 20, '#e86a7a'); [[-46, 14, -36, 40, -26, 16], [46, 14, 36, 40, 26, 16], [-30, 96, -22, 74, -14, 96], [30, 96, 22, 74, 14, 96]].forEach(function (f) { shape(c, function (q) { q.moveTo(f[0], f[1]); q.lineTo(f[2], f[3]); q.lineTo(f[4], f[5]); }, '#ffffff', L * 0.5); }); }
  D.ell(0, 30, 72, 42, rg(c, 0, 24, 76, '#7ccc8a', '#4a9a5a'), L);
  D.ell(-22, 24, 8, 6, OL); D.ell(22, 24, 8, 6, OL);
  if (mode !== 'bite') { strk(c, OL, L, function (q) { q.moveTo(-40, 52); q.quadraticCurveTo(0, mode === 'sleep' ? 58 : 64, 40, 52); }); if (mode !== 'sleep') { shape(c, function (q) { q.moveTo(-26, 55); q.lineTo(-20, 70); q.lineTo(-14, 57); }, '#ffffff', L * 0.5); shape(c, function (q) { q.moveTo(26, 55); q.lineTo(20, 70); q.lineTo(14, 57); }, '#ffffff', L * 0.5); } }
  if (mode === 'dizzy') D.ell(8, 68, 12, 18, '#e86a7a', L * 0.6);
  [-1, 1].forEach(function (sd) { var ex = sd * 40, ey = -28;
    if (mode === 'sleep') { strk(c, OL, L, function (q) { q.moveTo(ex - 18, ey); q.quadraticCurveTo(ex, ey + 12, ex + 18, ey); }); return; }
    D.ell(ex, ey, 22, 24, '#ffffff', L);
    if (mode === 'dizzy') { strk(c, OL, L * 0.8, function (q) { for (var a = 0; a < 14; a++) { var r = a * 1.4, an = a * 0.8 + t * 6 * sd; if (!a) q.moveTo(ex, ey); else q.lineTo(ex + Math.cos(an) * r, ey + Math.sin(an) * r); } }); return; }
    D.circ(ex - sd * 3, ey + 4, 11, OL); D.circ(ex - sd * 6, ey, 4, '#ffffff');
    if (mode === 'angry' || mode === 'bite') strk(c, OL, L * 1.6, function (q) { q.moveTo(ex - sd * 24, ey - 34); q.lineTo(ex + sd * 18, ey - 24); });
    else strk(c, OL, L * 1.2, function (q) { q.moveTo(ex - sd * 20, ey - 32); q.lineTo(ex + sd * 16, ey - 32); }); });
  if (flash > 0) { c.globalAlpha = Math.min(0.85, flash); D.ell(0, 0, 100, 80, '#ffffff'); c.globalAlpha = 1; }
  c.restore();
}

// ---------- раскладка экрана ----------
function lay(W, H) {
  var port = H > W * 1.05, U = Math.min(W, H) / 720;
  var GS = port ? Math.min(W / 780, H / 1000) : Math.min(W / 1280, H / 720) * 0.68;
  var hy = port ? H * 0.42 : H * 0.47, gy = hy + 280 * GS, cx = W / 2;
  return { W: W, H: H, port: port, U: U, GS: GS, hy: hy, gy: gy, cx: cx, AS: GS * 1.85, SS: (port ? Math.min(W / 720, H / 1280) * 1.15 : U) * 0.62, bx: 0, by: 0, bs: 1, GSb: GS };
}
// тело Змея живое: покачивается, подаётся к удару, отшатывается от контрудара
function bodyTf(d, Lo) {
  if (Lo.bodyDone) return; Lo.bodyDone = true;
  var GS = Lo.GS, t = d.t, bx = Math.sin(t * 0.75) * 28 * GS, by = Math.sin(t * 1.5) * 6 * GS, bs = d.dist || 1;
  d.heads.forEach(function (h) { var side = h.i - 1;
    if (h.st === 'wind') { var p = ease(h.t / windFor(d, h)); bx += side * 25 * GS * p; bs -= 0.03 * p; by -= 10 * GS * p; }
    else if (h.st === 'strike') { var q = easeIn(h.t / CFG.act); bx -= side * 22 * GS * q; bs += 0.08 * q; by += 20 * GS * q; }
    else if (h.st === 'rec') { var r = 1 - easeOut(h.t / CFG.rec), k = h.out === 'hurt' ? 1 : 0.4; bs += 0.08 * r * k; by += 20 * GS * r * k; }
  });
  bx += d.bod.x.x * GS; by += d.bod.y.x * GS; bs *= 1 + d.bod.s.x * 0.01;
  if (d.fall) { by += d.fall * 95 * GS; bs *= 1 - 0.08 * d.fall; bx += Math.sin(d.fall * 3) * 10 * GS; }
  Lo.bx = bx; Lo.by = by; Lo.bs = bs; Lo.GSb = GS * bs;
}
function toS(Lo, lx, ly) { return { x: Lo.cx + Lo.bx + (lx - Lo.cx) * Lo.GSb, y: Lo.gy + Lo.by + (ly - Lo.gy) * Lo.GSb }; }
var HEADS = [ // покой (в местных координатах тела), плечо, характер
  { lx: -240, ly: -445, rot: -0.15, s: 0.75, sh: [-70, -280], acc: '#bfe6ff', kind: 'L' },
  { lx: 0, ly: -500, rot: 0, s: 0.82, sh: [0, -300], acc: '#e8eef9', kind: 'O' },
  { lx: 240, ly: -445, rot: 0.15, s: 0.75, sh: [70, -280], acc: '#ffb347', kind: 'R' }
];
// ---------- фон (кэш) ----------
var bgCache = null;
function background(Lo) {
  var key = Lo.W + 'x' + Lo.H + '@' + Z.DPR;
  if (bgCache && bgCache.key === key) return bgCache.cv;
  var cv = document.createElement('canvas'); cv.width = Math.round(Lo.W * Z.DPR); cv.height = Math.round(Lo.H * Z.DPR);
  var c = cv.getContext('2d'); c.setTransform(Z.DPR, 0, 0, Z.DPR, 0, 0); var prev = D.ctx; D.setCtx(c);
  var W = Lo.W, H = Lo.H, cx = Lo.cx, hy = Lo.hy, U = Lo.U;
  try {
    c.fillStyle = lg(c, 0, 0, 0, hy, '#16214a', '#4a6aa8'); c.fillRect(0, 0, W, H);
    for (var s = 0; s < 70; s++) { c.globalAlpha = 0.3 + ((s * 37) % 10) / 16; D.circ((s * 211) % W, (s * 97) % (hy * 0.9), (1 + (s % 3) * 0.6) * Math.max(0.7, U), '#ffffff'); } c.globalAlpha = 1;
    var mx = W * 0.86, my = hy * 0.25; c.globalAlpha = 0.15; D.circ(mx, my, 70 * U, '#fff6d8'); c.globalAlpha = 0.9; D.circ(mx, my, 34 * U, '#fff6d8'); c.globalAlpha = 1;
    c.fillStyle = '#c9dcf0'; c.beginPath(); c.moveTo(0, hy + 10); for (var x = 0; x <= W; x += 30) c.lineTo(x, hy - 14 * U + Math.sin(x * 0.011) * 12 * U); c.lineTo(W, hy + 40); c.lineTo(0, hy + 40); c.fill();
    for (var k = 0; k < 18; k++) { var tx = (k * 83 + 20) % W, th = (40 + (k * 13) % 30) * U; if (Math.abs(tx - cx) < 210 * Lo.GS) continue; shape(c, function (q) { q.moveTo(tx, hy - th - 10 * U); q.lineTo(tx - th * 0.4, hy); q.lineTo(tx + th * 0.4, hy); }, '#2a5f62', 0); }
    c.fillStyle = lg(c, 0, hy + 20, 0, H, '#8fc6e8', '#cdeeff'); c.fillRect(0, hy + 20 * U, W, H - hy);
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; for (var q2 = 0; q2 < 12; q2++) { var yy = hy + 40 * U + q2 * q2 * 3.2 * U, xx = (q2 * 137) % W; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + (40 + q2 * 6) * U, yy + 4); c.lineTo(xx + (70 + q2 * 9) * U, yy - 2); c.stroke(); }
    var vy = hy - 30 * U, fw = 170 * Lo.GS / 0.68, nw = Math.max(W * 1.35, H * 0.9);
    var lx = function (y) { var k2 = (y - vy) / (H - vy); return cx - (fw + (nw / 2 - fw) * k2); }, rx = function (y) { return 2 * cx - lx(y); }, y0 = hy + 4 * U;
    shape(c, function (q) { q.moveTo(lx(y0), y0); q.lineTo(rx(y0), y0); q.lineTo(rx(H), H); q.lineTo(lx(H), H); }, lg(c, 0, y0, 0, H, '#dfe6f2', '#ffffff'), 0);
    c.globalAlpha = 0.25; for (var r = 0; r < 9; r++) { var yy2 = y0 + Math.pow(r / 9, 1.8) * (H - y0); strk(c, '#7a86a6', 1 + r * 0.5 * U, function (q) { q.moveTo(lx(yy2) + 20 * U, yy2); q.lineTo(rx(yy2) - 20 * U, yy2); }); } c.globalAlpha = 1;
    [-1, 1].forEach(function (sd) { var edge = function (y) { return sd < 0 ? lx(y) : rx(y); }, hgt = function (y) { return (12 + (y - y0) / (H - y0) * 150) * U; };
      shape(c, function (q) { q.moveTo(edge(y0), y0); q.lineTo(edge(H), H); q.lineTo(edge(H), H - hgt(H)); q.lineTo(edge(y0), y0 - hgt(y0)); }, lg(c, 0, y0, 0, H, '#9c9db4', '#b9b9cc'), 3);
      c.save(); c.beginPath(); c.moveTo(edge(y0), y0); c.lineTo(edge(H), H); c.lineTo(edge(H), H - hgt(H)); c.lineTo(edge(y0), y0 - hgt(y0)); c.closePath(); c.clip(); c.strokeStyle = 'rgba(38,48,79,0.3)'; c.lineWidth = 2;
      for (var b = 0; b < 14; b++) { var yb = y0 + Math.pow(b / 14, 1.6) * (H - y0); c.beginPath(); c.moveTo(edge(yb), yb); c.lineTo(edge(yb), yb - hgt(yb)); c.stroke(); } c.restore();
      shape(c, function (q) { q.moveTo(edge(y0), y0 - hgt(y0) - 2); q.lineTo(edge(H), H - hgt(H) - 14 * U); q.lineTo(edge(H) - sd * 40 * U, H - hgt(H) + 6 * U); q.lineTo(edge(y0) - sd * 4, y0 - hgt(y0) + 3); }, '#ffffff', 3);
      [0.12, 0.3, 0.55, 0.85].forEach(function (f) { var yk = y0 + f * f * (H - y0); kal(c, edge(yk) - sd * (4 + f * 20) * U, yk - hgt(yk) + (4 + f * 14) * U, (6 + f * 30) * U); }); });
  } catch (e) { if (window.__rep) window.__rep(e); }
  D.setCtx(prev);
  bgCache = { key: key, cv: cv };
  return cv;
}

// ---------- тело Змея ----------
function dragonBody(c, Lo, t, plop) {
  var cx = Lo.cx, gy = Lo.gy;
  c.save(); c.translate(cx + Lo.bx, gy + Lo.by); if (plop) c.rotate(plop * 0.1); c.scale(Lo.GSb, Lo.GSb); c.translate(-cx, -gy);
  var br = Math.sin(t * 2.2) * 4, wf = Math.sin(t * 2.6) * 14;
  strk(c, OL, 46, function (q) { q.moveTo(cx + 150, gy - 30); q.quadraticCurveTo(cx + 330, gy - 20, cx + 350, gy - 170 + Math.sin(t * 1.7) * 10); }); strk(c, '#3f8a4a', 32, function (q) { q.moveTo(cx + 150, gy - 30); q.quadraticCurveTo(cx + 330, gy - 20, cx + 350, gy - 170 + Math.sin(t * 1.7) * 10); });
  shape(c, function (q) { var ty = gy - 170 + Math.sin(t * 1.7) * 10; q.moveTo(cx + 330, ty); q.lineTo(cx + 352, ty - 56); q.lineTo(cx + 376, ty + 4); }, '#ffd54a', 4);
  [-1, 1].forEach(function (sd) { var sx = cx + sd * 110, sy = gy - 250;
    shape(c, function (q) { q.moveTo(sx, sy); q.lineTo(cx + sd * 470, gy - 430 - wf); q.lineTo(cx + sd * 440, gy - 330 - wf * 0.6); q.quadraticCurveTo(cx + sd * 400, gy - 300, cx + sd * 420, gy - 240 - wf * 0.3); q.quadraticCurveTo(cx + sd * 350, gy - 240, cx + sd * 330, gy - 180); q.quadraticCurveTo(cx + sd * 260, gy - 210, cx + sd * 200, gy - 140); }, sd < 0 ? '#2f6a3a' : '#3a7a45', 5);
    c.globalAlpha = 0.3; strk(c, '#ffffff', 4, function (q) { q.moveTo(sx, sy); q.lineTo(cx + sd * 440, gy - 330 - wf * 0.6); q.moveTo(sx, sy); q.lineTo(cx + sd * 420, gy - 240 - wf * 0.3); q.moveTo(sx, sy); q.lineTo(cx + sd * 330, gy - 180); }); c.globalAlpha = 1; });
  D.ell(cx, gy - 130, 215, 195 + br, rg(c, cx, gy - 130, 240, '#7ed08c', '#2f6a3a'), 5);
  shape(c, function (q) { for (var sp = 0; sp < 7; sp++) { var a = -Math.PI * 0.82 + sp * Math.PI * 0.64 / 6, bx = cx + Math.cos(a) * 200, by = gy - 150 + Math.sin(a) * 180; q.moveTo(bx - 14, by + 8); q.lineTo(bx + Math.cos(a) * 34, by + Math.sin(a) * 34); q.lineTo(bx + 14, by + 8); } }, '#ffd54a', 3.5);
  D.ell(cx, gy - 90, 128, 140 + br, '#d8e88a', 4);
  for (var bp = 0; bp < 6; bp++) strk(c, 'rgba(120,140,40,0.6)', 4, function (q) { var yy = gy - 200 + bp * 36, w = Math.sqrt(Math.max(0, 1 - Math.pow((yy - (gy - 90)) / 140, 2))) * 120; q.moveTo(cx - w, yy); q.quadraticCurveTo(cx, yy + 14, cx + w, yy); });
  [-1, 1].forEach(function (sd) { D.ell(cx + sd * 190, gy - 120, 46, 32, '#3f8a4a', 4); for (var cl = 0; cl < 3; cl++) shape(c, function (q) { var bx = cx + sd * (205 + cl * 12) - sd * 30, by = gy - 96 + cl * 2; q.moveTo(bx - 6, by); q.lineTo(bx, by + 16); q.lineTo(bx + 6, by); }, '#ffd54a', 2.5);
    D.ell(cx + sd * 110, gy + 20, 80, 40, '#2f6a3a', 5); for (var cl2 = 0; cl2 < 3; cl2++) shape(c, function (q) { var bx = cx + sd * 110 + (cl2 - 1) * 40, by = gy + 46; q.moveTo(bx - 10, by - 6); q.lineTo(bx, by + 16); q.lineTo(bx + 10, by - 6); }, '#ffd54a', 3); });
  c.restore();
}

// ---------- старт / конец ----------
function mkHead(i) { return { i: i, st: 'idle', t: 0, hp: 100, fl: 0, wakeT: 0, out: '', cp: null, snap: null, bt: 9, last: null, kx: spring(110, 9), ky: spring(110, 9), kr: spring(100, 8), ks: spring(160, 11) }; }
Z.duelStart = function (e) {
  var G = Z.G; if (!G || G.duelDone) return;
  G.duelDone = true;
  DU = { e: e, t: 0, ph: 'intro', pt: 0, hp: 100, hpMax: 100, hitstop: 0, slow: 0, trauma: 0, flash: 0, vig: 0,
    pl: { st: 'idle', t: 0, combo: 0, q: 0, blk: false, blkAt: -9, blkUp: -9, blkPtr: null, hit: false },
    heads: [0, 1, 2].map(mkHead),
    next: 1.4, sparks: [], pops: [], imp: [], tip: 'block', tipT: 0, parries: 0,
    kick: { x: spring(220, 18), y: spring(220, 18), r: spring(200, 16), bx: spring(240, 20), by: spring(240, 20), br: spring(200, 16) },
    cam: { x: spring(170, 15), y: spring(170, 15), r: spring(150, 13), z: spring(200, 20) },
    bod: { x: spring(70, 8), y: spring(70, 8), s: spring(90, 9) },
    dist: 1, distT: 1, distTimer: 2, blkSide: 0, frozen: 0, lastAtk: 1, flames: [], said: {}, talk: null, burn: 0, heat: 0, fall: 0, iceAll: 0 };
  UI.openModal({ type: 'duel', noBack: true });
  sfx('dragon_roar', 0.7); DU.iris = 0;
  try { Z.AU.setState && Z.AU.setState('boss', 0); } catch (er) { if (window.__rep) window.__rep(er); }
};
function finish() {
  var G = Z.G, d = DU; DU = null;
  if (UI.modal && UI.modal.type === 'duel') { UI.modal.noBack = true; UI.closeModal(); }
  if (!G || !d) return;
  if (G.cineDone) G.cineOut = { t: 0, x: G.cineDone.x, y: G.cineDone.y };
  if (Z.sub) Z.sub.t = 0;
  var e = d.e;
  if (!e || e.dead) return;
  var n = d.heads.filter(function (h) { return h.st === 'frozen'; }).length;
  if (d.ph === 'won') { e.headsLost = 3; e.hp = 0; try { Z._.kill(e); } catch (er) { e.dead = true; } }
  else if (n > 0) { e.headsLost = n; e.hp = Math.min(e.hp, e.max * (3 - n) / 3 - 1); }
  G.banner = { text: d.ph === 'won' ? TT('Змей Горыныч повержен!', 'Zmey Gorynych is defeated!') : TT('Змей идёт к ёлке — держите оборону!', 'The Dragon heads for the tree — hold the line!'), t: 2.2, big: true };
}

// ---------- логика ----------
function awake(d) { return d.heads.filter(function (h) { return h.st !== 'sleep' && h.st !== 'frozen' && h.st !== 'dizzy'; }); }
function windFor(d, h) { var k = 1 - 0.12 * d.frozen; return (h.fire ? CFG.windFire : h.i === 1 ? CFG.windHeavy : CFG.wind) * k; }
function pop(d, s, col, big) { d.pops = [{ s: s, t: 0, col: col || '#ffe066', big: big || 1 }]; }
function sparks(d, x, y, n, col, dir) { for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, v = 250 + Math.random() * 550; d.sparks.push({ x: x, y: y, vx: Math.cos(a) * v + (dir || 0) * 400, vy: Math.sin(a) * v - 150, life: 0.25 + Math.random() * 0.3, age: 0, col: col || '#fff2b0' }); } }
function impact(d, x, y, sz, col) { d.imp.push({ x: x, y: y, t: 0, s: sz, col: col || '#ffffff' }); }
function shake(d, a) { d.trauma = Math.min(1, d.trauma + a * CFG.shake); }
function hitstop(d, s) { d.hitstop = Math.max(d.hitstop, s * CFG.hitstop); }
function setSt(h, st) { h.snap = h.last; h.bt = 0; h.st = st; h.t = 0; }
function target(d) { // кого бьём: оглушённую, потом открытую после удара, потом последнюю бившую, потом любую неспящую
  var hs = d.heads, pick = null;
  hs.forEach(function (h) { if (!pick && h.st === 'stun') pick = h; });
  hs.forEach(function (h) { if (!pick && h.st === 'rec') pick = h; });
  if (!pick) { var la = hs[d.lastAtk]; if (la && la.st !== 'sleep' && la.st !== 'frozen' && la.st !== 'dizzy') pick = la; }
  if (!pick) pick = awake(d)[0] || null;
  return pick;
}
// куда приходится удар головы: в щит (с той стороны, откуда бьют) или в нас
function shieldBlockPos(Lo, side) { return { x: Lo.W * (Lo.port ? 0.47 + side * 0.17 : 0.43 + side * 0.11), y: Lo.H * (Lo.port ? 0.7 : 0.63) }; }
function contactPt(d, Lo, h) { var side = h.i - 1; if (d.pl.blk) { var b = shieldBlockPos(Lo, side), sc = Lo.SS * 1.25; return { x: b.x, y: b.y - 60 * sc, blk: true }; } return { x: Lo.W * (0.5 + side * 0.1), y: Lo.H * (Lo.port ? 0.6 : 0.58), blk: false }; }
function headPos(d, Lo, h) { // экранное положение, масштаб, наклон головы
  bodyTf(d, Lo);
  var H0 = HEADS[h.i], rest = toS(Lo, Lo.cx + H0.lx, Lo.gy + H0.ly), G = Lo.GSb, side = h.i - 1, t = d.t;
  var x = rest.x + Math.sin(t * 1.3 + h.i * 2.1) * 18 * G, y = rest.y + Math.sin(t * 1.9 + h.i) * 12 * G, s = H0.s * G, rot = H0.rot + Math.sin(t * 1.1 + h.i * 2) * 0.12;
  var big = Lo.AS, A = { x: h.i === 1 ? x : x + side * 150 * G, y: h.i === 1 ? y - 170 * G : y - 70 * G, s: s * 0.92, rot: rot + (h.i === 1 ? -0.25 : side * 0.5) };
  if (h.st === 'wind') { var p = ease(h.t / windFor(d, h)), tr = p > 0.7 ? (p - 0.7) * 20 * G : 0; x += (A.x - x) * p + (Math.random() - 0.5) * tr; y += (A.y - y) * p + (Math.random() - 0.5) * tr; s += (A.s - s) * p; rot += (A.rot - rot) * p; }
  else if (h.st === 'strike') { var P = contactPt(d, Lo, h), q = easeIn(h.t / CFG.act), cp = h.i === 1 ? { x: A.x, y: A.y - 40 * G } : { x: P.x + side * Lo.W * 0.24, y: A.y + (P.y - A.y) * 0.15 };
    x = (1 - q) * (1 - q) * A.x + 2 * (1 - q) * q * cp.x + q * q * P.x; y = (1 - q) * (1 - q) * A.y + 2 * (1 - q) * q * cp.y + q * q * P.y; s = A.s + (big - A.s) * q; rot = A.rot * (1 - q) - side * 0.3 * q; }
  else if (h.st === 'rec') { var c0 = h.cp || { x: x, y: y }, r = easeOut(h.t / CFG.rec), sb = big * (h.out === 'hurt' ? 1 : 0.8), bump = h.out === 'hurt' ? 0 : Math.sin(Math.min(1, h.t / 0.18) * Math.PI) * 0.18;
    x = c0.x + (x - c0.x) * r; y = c0.y + (y - c0.y) * r - bump * 60 * G; s = (sb + (s - sb) * r) * (1 - bump); rot = rot + side * 0.4 * (1 - r) * (h.out === 'hurt' ? 0 : 1); }
  else if (h.st === 'breath') { var Pb = contactPt(d, Lo, h), kb2 = 0.42 * ease(Math.min(1, h.t / 0.15)); x = A.x + (Pb.x - A.x) * kb2 + Math.sin(t * 30) * 3 * G; y = A.y + (Pb.y - A.y) * kb2 - 40 * G * kb2; s = A.s + (big - A.s) * kb2 * 0.8; rot = A.rot * (1 - kb2) - side * 0.2 * kb2; }
  else if (h.st === 'stun' || h.st === 'dizzy') { x += Math.sin(t * 9 + h.i) * 12 * G; y += 35 * G; rot += Math.sin(t * 5 + h.i) * 0.25; }
  else if (h.st === 'hblock') { var k2 = Math.sin(Math.min(1, h.t / 0.35) * Math.PI); y += 30 * k2 * G; s *= 1 + 0.06 * k2; }
  else if (h.st === 'sleep' || h.st === 'frozen') { y += 90 * G; x += side * 30 * G; rot += 0.35 * (side || 1); }
  // плавный переход из прошлого состояния (кроме броска — он резкий)
  if (h.snap && h.bt < 0.22 && h.st !== 'strike' && h.st !== 'rec') { var b = ease(h.bt / 0.22), o = h.snap; x = o.x + (x - o.x) * b; y = o.y + (y - o.y) * b; s = o.s + (s - o.s) * b; rot = o.rot + (rot - o.rot) * b; }
  x += h.kx.x * G; y += h.ky.x * G; rot += h.kr.x * 0.01; s *= 1 + h.ks.x * 0.01;
  return { x: x, y: y, s: s, rot: rot, sh: toS(Lo, Lo.cx + H0.sh[0], Lo.gy + H0.sh[1]) };
}

function startHeadAttack(d) {
  var hs = awake(d).filter(function (h) { return h.st === 'idle'; }); if (!hs.length) return false;
  var h = hs[Math.floor(Math.random() * hs.length)]; if (hs.length > 1 && h.i === d.lastAtk && Math.random() < 0.6) h = hs[(hs.indexOf(h) + 1) % hs.length];
  setSt(h, 'wind'); h.warned = false; d.lastAtk = h.i; h.fire = h.i === 2 && Math.random() < 0.6;
  if (h.fire) { sfx('dragon_roar', 0.4); banter(d, 'fire', [['GOR-02', 2]]); } else if (Math.random() < 0.6) sfx('dragon_roar', 0.25);
  return true;
}
function resolveHeadHit(d, Lo, h) {
  var pl = d.pl, now = d.t, heavy = h.i === 1, side = h.i - 1;
  var P = contactPt(d, Lo, h); h.cp = { x: P.x, y: P.y };
  // встречный удар меча в момент броска — клинки сталкиваются
  if (pl.st === 'atk' && pl.t >= 0.08 && pl.t <= 0.2) { SND.clash(); impact(d, P.x, P.y - 30, 1.2); sparks(d, P.x, P.y - 30, 22); hitstop(d, 0.08); shake(d, 0.35); setSt(h, 'rec'); h.out = 'block'; h.cp = { x: P.x, y: P.y }; pl.st = 'bounce'; pl.t = 0; d.kick.r.hit(-8); d.cam.x.hit(side * 10); h.kx.hit(side * 60); h.ks.hit(-10); pop(d, TT('Дзынь!', 'Clang!'), '#ffffff'); return; }
  if (pl.blk) {
    if (now - pl.blkAt <= CFG.parry && pl.parryOK) { // парирование: голову отбрасывает, мир «вздрагивает»
      SND.parry(); sfx('ice', 0.5); impact(d, P.x, P.y, 1.8, '#dff6ff'); sparks(d, P.x, P.y, 36, '#dff6ff', -side); hitstop(d, 0.1); d.slow = 0.4; shake(d, 0.3); d.flash = 0.45;
      d.kick.bx.hit(side * 18); d.kick.by.hit(-10); d.kick.br.hit(side * -8); d.cam.z.hit(-6); d.cam.y.hit(-8); d.cam.r.hit(side * -2);
      h.kx.hit(-side * 120 + (side ? 0 : 0)); h.ky.hit(-90); h.kr.hit(-side * 40 || 30); h.ks.hit(-14); d.bod.s.hit(-4); d.bod.x.hit(-side * 20); d.bod.y.hit(-12);
      setSt(h, 'stun'); h.snap = { x: P.x, y: P.y, s: Lo.AS * 0.8, rot: 0 }; h.bt = 0; h.out = 'parry'; pl.st = 'parry'; pl.t = 0; pl.parryOK = false; d.parries++;
      pop(d, TT('ОТБИЛ!', 'PARRY!'), '#ffe066', 1.3); if (d.tip === 'block' || d.tip === 'parry') { d.tip = 'counter'; d.tipT = 0; } banter(d, 'parry', [['PLO-02', 'p']]);
      return;
    }
    (heavy ? SND.heavy : SND.block)(); impact(d, P.x, P.y, heavy ? 1.5 : 1.1); sparks(d, P.x, P.y, 16, null, -side); hitstop(d, 0.06); shake(d, heavy ? 0.45 : 0.3);
    d.kick.bx.hit(side * (heavy ? 10 : 26)); d.kick.by.hit(heavy ? 34 : 14); d.kick.br.hit(side * 10); d.cam.x.hit(side * 9); d.cam.y.hit(heavy ? 14 : 4); d.cam.r.hit(side * 1.5);
    h.ks.hit(-6); h.kx.hit(-side * 40);
    var ch = heavy ? CFG.chipHeavy : CFG.chip; if (ch) { d.hp -= ch; if (heavy) pop(d, TT('Тяжело! Лучше отбить', 'Heavy! Better parry it'), '#ffd0a0', 0.8); if (d.hp <= 0) { d.hp = 0; startLost(d); } }
    setSt(h, 'rec'); h.out = 'block'; pl.st = 'blockhit'; pl.t = 0;
    if (d.tip === 'block') { d.tip = 'parry'; d.tipT = 0; }
    return;
  }
  // попал по герою: голова влетает в «камеру»
  var dmg = heavy ? CFG.dmgHeavy : CFG.dmgSide; d.hp -= dmg; SND.hurt(); sfx('crack', 0.35); impact(d, P.x, P.y, 2.2, '#ffd0d0'); hitstop(d, 0.05); shake(d, 0.7); d.vig = 1;
  d.cam.x.hit(side * 30); d.cam.y.hit(heavy ? 34 : 16); d.cam.r.hit(side * -5 || 3); d.cam.z.hit(5); d.kick.x.hit(side * 30); d.kick.y.hit(40); d.kick.r.hit(side * 8 || 6); d.kick.by.hit(40);
  setSt(h, 'rec'); h.out = 'hurt'; pl.st = 'hurt'; pl.t = 0; pl.q = 0;
  if (d.hp <= 0) { d.hp = 0; startLost(d); } else if (d.hp < 40) banter(d, 'low', [['PLO-07', 'p']]);
}
function playerHit(d, Lo) {
  var pl = d.pl, h = target(d); if (!h) return;
  var hp = headPos(d, Lo, h), i = pl.combo % 3, dir = i === 0 ? -1 : i === 1 ? 1 : 0, side = h.i - 1;
  pl.cp = { x: hp.x, y: hp.y };
  if (h.st === 'wind' || h.st === 'strike') { SND.clash(); impact(d, hp.x, hp.y, 1); sparks(d, hp.x, hp.y, 12, null, dir); hitstop(d, 0.05); shake(d, 0.2); pl.st = 'bounce'; pl.t = 0; d.kick.r.hit(-dir * 10 || -8); h.kx.hit(dir * 20); pop(d, TT('В замахе не сбить — щит!', 'Can\'t stop it — shield!'), '#bfe6ff', 0.8); return; }
  if ((h.st === 'idle' || h.st === 'wake') && Math.random() < CFG.headBlock) { SND.block(); impact(d, hp.x, hp.y - 70 * hp.s, 1); sparks(d, hp.x, hp.y - 70 * hp.s, 12, null, dir); hitstop(d, 0.05); shake(d, 0.2); setSt(h, 'hblock'); h.kx.hit(dir * 25); h.kr.hit(dir * 10); pl.st = 'bounce'; pl.t = 0; d.kick.r.hit(-dir * 10 || -8); d.cam.x.hit(-dir * 6); pop(d, TT('Рогами закрылся', 'Blocked with horns'), '#ffffff', 0.8); return; }
  var dmg = CFG.hit[i], counter = h.st === 'stun', k = counter ? 1.7 : 1; if (counter) dmg *= CFG.counter;
  h.hp -= dmg; h.fl = 1; SND.bonk(); impact(d, hp.x, hp.y, counter ? 1.7 : 1.1, counter ? '#ffe066' : '#ffffff'); sparks(d, hp.x, hp.y, counter ? 22 : 10, counter ? '#ffe066' : '#ffffff', dir);
  hitstop(d, counter ? 0.075 : 0.045); shake(d, counter ? 0.35 : 0.18);
  // куда пришёлся удар — туда и отлетает голова
  if (dir) { h.kx.hit(dir * 110 * k); h.kr.hit(dir * 35 * k); h.ky.hit(-15 * k); h.ks.hit(-6 * k); } else { h.ky.hit(90 * k); h.ks.hit(-16 * k); h.kr.hit((side || 1) * 10); }
  d.bod.x.hit(dir * 12 * k); d.bod.s.hit(-2.5 * k); d.bod.y.hit(dir ? -4 : 10 * k);
  d.cam.r.hit(dir * 1.5); d.cam.x.hit(dir * 5); d.kick.r.hit(-dir * 6);
  if (counter && i === 0) pop(d, TT('Контрудар!', 'Counter!'), '#ffe066');
  if (h.hp <= 0) { h.hp = 0; setSt(h, 'dizzy'); sfx('dragon_roar', 0.4); d.bod.s.hit(-5); if (d.tip !== 'freeze2') { d.tip = 'freeze'; d.tipT = 0; } banter(d, 'sleep', [['GOR-05a', h.i === 0 ? 1 : 0], ['GOR-05b', h.i === 2 ? 1 : 2]]); }
  else if (!counter) setSt(h, 'hit');
}
function freezeHead(d, h) {
  if (!h || h.st !== 'sleep') return false;
  setSt(h, 'frozen'); d.frozen++; sfx('freeze', 0.9); SND.parry(); d.flash = 0.3; h.ks.hit(8); d.cam.z.hit(-3); pop(d, TT('Под ледяной колпак!', 'Iced over!'), '#bfe6ff');
  if (d.tip === 'freeze') d.tip = 'freeze2';
  if (d.frozen >= 3) startFinale(d);
  else if (d.frozen === 2) banter(d, 'pies', [['M7-07', 2], ['M7-08', 1]]);
  return true;
}

function step(d, Lo, dt0) {
  d.t += dt0; d.pt += dt0;
  if (d.hitstop > 0) { d.hitstop -= dt0; dt0 = 0; }
  var dt = dt0 * (d.slow > 0 ? 0.35 : 1); if (d.slow > 0) d.slow -= dt0;
  var k; for (k in d.kick) d.kick[k].step(dt0); for (k in d.cam) d.cam[k].step(dt0); for (k in d.bod) d.bod[k].step(dt);
  d.heads.forEach(function (h) { h.kx.step(dt); h.ky.step(dt); h.kr.step(dt); h.ks.step(dt); h.bt += dt; });
  d.trauma = Math.max(0, d.trauma - dt0 * 1.6); d.flash = Math.max(0, d.flash - dt0 * 2.2); d.vig = Math.max(0, d.vig - dt0 * 1.4);
  d.sparks.forEach(function (s) { s.age += dt0; s.vy += 900 * dt0; s.x += s.vx * dt0; s.y += s.vy * dt0; }); d.sparks = d.sparks.filter(function (s) { return s.age < s.life; });
  d.imp.forEach(function (p) { p.t += dt0; }); d.imp = d.imp.filter(function (p) { return p.t < 0.28; });
  d.pops.forEach(function (p) { p.t += dt0; }); d.pops = d.pops.filter(function (p) { return p.t < 1.1; });
  d.tipT += dt0;
  // Змей переступает по мосту: то ближе, то дальше
  d.distTimer -= dt; if (d.distTimer <= 0) { d.distTimer = 2.5 + Math.random() * 2.5; d.distT = 0.95 + Math.random() * 0.1; }
  d.dist += (d.distT - d.dist) * Math.min(1, dt * 1.2);
  // щит тянется к стороне, откуда бьют
  var ws = 0; d.heads.forEach(function (h) { if (h.st === 'wind' || h.st === 'strike' || h.st === 'breath') ws = h.i - 1; });
  stepFlames(d, Lo, dt0); d.burn = Math.max(0, d.burn - dt0 * 1.5); d.heat = Math.max(0, d.heat - dt0 * 2); d.blkSide += (ws - d.blkSide) * Math.min(1, dt0 * 12);
  d.iris = Math.min(1, (d.iris || 0) + dt0 / 0.55);
  if (d.ph === 'intro') { if (d.pt > 2.9) { d.ph = 'fight'; d.pt = 0; } return; }
  if (d.ph === 'fight' && d.pt > 0.6) banter(d, 'start', [['M7-05', 1], ['M7-06', 0]]);
  if (d.ph === 'won' || d.ph === 'lost') { d.heads.forEach(function (h) { h.t += dt; if (h.st === 'breath') { h.bt2 = (h.bt2 || 0) + dt; spawnFlames(d, Lo, h, dt, true); } }); d.pl.t += dt; endStep(d, Lo, dt0, dt); return; }
  // герой
  var pl = d.pl; pl.t += dt;
  if (pl.st === 'atk') {
    if (!pl.hit && pl.t >= 0.13) { pl.hit = true; playerHit(d, Lo); }
    if (pl.st === 'atk' && pl.t >= 0.2 && pl.q > 0 && pl.combo < 2) { pl.q = 0; pl.combo++; pl.t = 0; pl.hit = false; SND.swing(1.1 + pl.combo * 0.1); d.cam.z.hit(2.5); }
    else if (pl.st === 'atk' && pl.t >= 0.46) { pl.st = 'idle'; pl.t = 0; pl.combo = 0; }
  } else if (pl.st === 'bounce' && pl.t > 0.32) { pl.st = 'idle'; pl.combo = 0; }
  else if (pl.st === 'hurt' && pl.t > 0.35) pl.st = 'idle';
  else if ((pl.st === 'parry' || pl.st === 'blockhit') && pl.t > 0.3) pl.st = 'idle';
  if (pl.st === 'idle' && pl.q > 0 && !pl.blk) { pl.q = 0; startAtk(d); }
  // головы
  var attacking = d.heads.some(function (h) { return h.st === 'wind' || h.st === 'strike' || h.st === 'breath'; });
  d.heads.forEach(function (h) {
    h.t += dt; h.fl = Math.max(0, h.fl - dt * 5);
    if (h.st === 'wind') { var w = windFor(d, h); if (!h.warned && h.t > w - 0.2) { h.warned = true; if (h.fire) SND.fireUp(); else SND.whoosh(h.i === 1 ? 0.8 : 1.05); } if (h.t >= w) { if (h.fire) breathStart(d, Lo, h); else { h.st = 'strike'; h.t = 0; } } }
    else if (h.st === 'breath') breathTick(d, Lo, h, dt);
    else if (h.st === 'strike') { if (h.t >= CFG.act) resolveHeadHit(d, Lo, h); }
    else if (h.st === 'rec') { if (h.t >= CFG.rec) setSt(h, 'idle'); }
    else if (h.st === 'stun') { if (h.t >= CFG.stun) setSt(h, 'idle'); }
    else if (h.st === 'hit') { if (h.t >= 0.3) setSt(h, 'idle'); }
    else if (h.st === 'hblock') { if (h.t >= 0.35) setSt(h, 'idle'); }
    else if (h.st === 'dizzy') { if (h.t >= 0.7) { setSt(h, 'sleep'); h.wakeT = CFG.wake; SND.sleep(); } }
    else if (h.st === 'sleep') { h.wakeT -= dt; if (h.wakeT <= 0) { setSt(h, 'wake'); h.hp = CFG.wakeHp; h.ky.hit(-60); sfx('dragon_roar', 0.35); pop(d, TT('Проснулась!', 'Woke up!'), '#ff9a9a', 0.9); } }
    else if (h.st === 'wake') { if (h.t >= 0.5) setSt(h, 'idle'); }
  });
  if (!attacking) { d.next -= dt; if (d.next <= 0) { var n = awake(d).length; if (startHeadAttack(d)) d.next = (n <= 1 ? 0.55 : 0.75) + Math.random() * (n <= 1 ? 0.5 : 0.9); else d.next = 0.3; } }
}
function startAtk(d) { var pl = d.pl; if (pl.blk) return; pl.st = 'atk'; pl.t = 0; pl.hit = false; pl.combo = 0; SND.swing(1.1); d.cam.z.hit(2.5); }

// ---------- огонь правой головы ----------
SND.fireUp = function () { SND.whoosh(0.6); };
function breathStart(d, Lo, h) {
  var pl = d.pl, P = contactPt(d, Lo, h);
  if (pl.blk && d.t - pl.blkAt <= CFG.parry && pl.parryOK) { // отразил пламя щитом — оно летит обратно в голову
    SND.parry(); sfx('ice', 0.5); impact(d, P.x, P.y, 1.8, '#ffd0a0'); sparks(d, P.x, P.y, 30, '#ffcf70', 0); hitstop(d, 0.1); d.slow = 0.4; d.flash = 0.35; shake(d, 0.3);
    d.kick.by.hit(-10); d.cam.z.hit(-6); h.kx.hit(80); h.ky.hit(-90); h.ks.hit(-14); d.bod.s.hit(-4);
    for (var i = 0; i < 26; i++) d.flames.push({ x: P.x, y: P.y, vx: (Math.random() - 0.3) * 600, vy: -500 - Math.random() * 500, age: 0, life: 0.5 + Math.random() * 0.3, s: 20 + Math.random() * 20, back: true });
    setSt(h, 'stun'); h.out = 'parry'; pl.st = 'parry'; pl.t = 0; pl.parryOK = false; d.parries++;
    pop(d, TT('Отразил пламя!', 'Fire reflected!'), '#ffcf70', 1.2); if (d.tip === 'block' || d.tip === 'parry') { d.tip = 'counter'; d.tipT = 0; }
    banter(d, 'refl', [['PLO-05', 'p']]);
    return;
  }
  setSt(h, 'breath'); h.tick = 0; sfx('big_boom', 0.35); SND.whoosh(0.5); shake(d, 0.25);
}
function breathTick(d, Lo, h, dt) {
  spawnFlames(d, Lo, h, dt, false);
  h.tick -= dt; if (h.tick > 0) { if (h.t >= CFG.breath) { setSt(h, 'rec'); h.out = 'block'; h.cp = h.last ? { x: h.last.x, y: h.last.y } : null; } return; }
  h.tick = CFG.fireTick;
  if (d.pl.blk) { d.hp -= CFG.fireChip; d.heat = 1; d.kick.by.hit(4); d.kick.bx.hit((Math.random() - 0.5) * 6); if (Math.random() < 0.5) SND.whoosh(1.6); }
  else { d.hp -= CFG.fireDmg; d.burn = 1; shake(d, 0.15); d.cam.x.hit((Math.random() - 0.5) * 6); if (!d.burnSaid) { d.burnSaid = 1; banter(d, 'hurt', [['PLO-06', 'p']]); } }
  if (d.hp <= 0) { d.hp = 0; startLost(d); }
}
function mouthOf(d, Lo, h) { var p = h.last || headPos(d, Lo, h); return { x: p.x, y: p.y + 60 * p.s, s: p.s }; }
function spawnFlames(d, Lo, h, dt, wild) {
  var m = mouthOf(d, Lo, h), P = wild ? { x: Lo.W / 2, y: Lo.H * 0.8 } : contactPt(d, Lo, h), n = Math.ceil(dt * 70);
  for (var i = 0; i < n; i++) { var dx = P.x - m.x, dy = P.y - m.y, L = Math.hypot(dx, dy) || 1, sp = 800 + Math.random() * 400, spr = (Math.random() - 0.5) * 0.5;
    var vx = dx / L * sp + dy / L * sp * spr, vy = dy / L * sp - dx / L * sp * spr;
    d.flames.push({ x: m.x, y: m.y, vx: vx, vy: vy, age: 0, life: Math.min(0.9, L / sp * (d.pl.blk && !wild ? 1 : 1.5)), s: (16 + Math.random() * 16) * Math.max(0.6, m.s * 2), blk: d.pl.blk && !wild }); }
  if (d.flames.length > 400) d.flames.splice(0, d.flames.length - 400);
}
function stepFlames(d, Lo, dt) {
  var add = [];
  d.flames.forEach(function (f) { f.age += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.s *= 1 + dt * 1.8;
    if (f.blk && f.age >= f.life && !f.spl) { f.spl = 1; for (var j = 0; j < 2; j++) add.push({ x: f.x, y: f.y, vx: (Math.random() < 0.5 ? -1 : 1) * (300 + Math.random() * 400), vy: -100 - Math.random() * 300, age: 0, life: 0.35, s: f.s * 0.7, steam: Math.random() < 0.4 }); } });
  d.flames = d.flames.filter(function (f) { return f.age < f.life + (f.blk ? 0 : 0.25); }).concat(add);
}
function drawFlames(c, d, Lo) {
  if (!d.flames.length) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  d.flames.forEach(function (f) { var k = Math.min(1, f.age / Math.max(0.01, f.life)), a = (1 - k) * 0.85;
    if (f.steam) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = a * 0.5; D.circ(f.x, f.y, f.s, '#e8eef9'); c.globalCompositeOperation = 'lighter'; return; }
    c.globalAlpha = a * 0.55; D.circ(f.x, f.y, f.s * 1.25, k < 0.5 ? '#ff6a2a' : '#c23a1a'); c.globalAlpha = a * 0.8; D.circ(f.x, f.y, f.s * 0.8, '#ffb347'); c.globalAlpha = a; D.circ(f.x, f.y, f.s * 0.4, '#fff3b0'); });
  c.restore(); c.globalAlpha = 1;
}

// ---------- разговор: озвученные реплики из мультика, облачками над говорящим ----------
var WHO = { GOR: 1, GOR2: 0, GOR3: 2, PLO: 'p' };
function say(d, id, who, then) {
  var txt = vtext(id); if (!txt) { if (then) then(); return; }
  if (who === undefined) who = WHO[(Z.VL[id] || [])[0]];
  d.talk = { id: id, who: who, text: txt, t: 0 };
  var done = false, fin = function () { if (done) return; done = true; if (d.talk && d.talk.id === id) d.talk.end = d.t; if (then) setTimeout(then, 200); };
  try { if (Z.playLine) Z.playLine(id, fin); else setTimeout(fin, 2400); } catch (e) { setTimeout(fin, 2400); }
  setTimeout(fin, Math.max(3000, txt.length * 110));   // страховка, если звук не пришёл
}
function chain(d, list, then) { var i = 0; (function nx() { if (DU !== d) return; if (i >= list.length) { if (then) then(); return; } var it = list[i++]; say(d, it[0], it[1], nx); })(); }
function banter(d, key, list) { if (d.said[key] || d.talking || (d.ph !== 'fight' && key !== 'fin')) return; d.said[key] = 1; d.talking = true; chain(d, list, function () { d.talking = false; }); }
function talkBubble(c, d, Lo, S, world) {
  var tk = d.talk; if (!tk) return; var isP = tk.who === 'p'; if (isP === world) return;
  var a = tk.end ? Math.max(0, 1 - (d.t - tk.end) / 0.4) : Math.min(1, (d.t - (tk.t0 === undefined ? (tk.t0 = d.t) : tk.t0)) * 6); if (a <= 0) return;
  var fs = Math.max(13, 17 * S), mw2 = Math.min(Lo.W * 0.6, 360 * S), lines = D.wrap(tk.text, mw2 - 24 * S, fs), bw = 24 * S + Math.max.apply(null, lines.map(function (l2) { C().font = D.font(fs); return C().measureText(l2).width; })), bh = 16 * S + lines.length * fs * 1.25;
  var ax, ay;
  if (isP) { ax = Lo.W * 0.25; ay = Lo.H - (Lo.port ? 0.36 : 0.42) * Lo.H; }
  else { var h = d.heads[tk.who]; if (!h || !h.last) return; ax = h.last.x + (tk.who - 1) * 60 * h.last.s; ay = h.last.y - 150 * h.last.s; }
  var bx = Math.max(8, Math.min(Lo.W - bw - 8, ax - bw / 2)), by = Math.max(70 * S, ay - bh);
  c.globalAlpha = a; D.rr(bx, by, bw, bh, 14 * S); c.fillStyle = isP ? '#eaf8ff' : '#fff6e0'; c.fill(); c.lineWidth = 3 * S; c.strokeStyle = OL; c.stroke();
  var tx = Math.max(bx + 16 * S, Math.min(bx + bw - 16 * S, ax)); D.poly([tx - 9 * S, by + bh - 1, tx + 9 * S, by + bh - 1, tx, by + bh + 14 * S], isP ? '#eaf8ff' : '#fff6e0', 0);
  if (isP) D.text(TT('Пломбир', 'Plombir'), bx + 12 * S, by - 9 * S, Math.max(11, 13 * S), '#ffe066', 'left', 'middle', 3 * S);
  lines.forEach(function (ln, j) { D.text(ln, bx + bw / 2, by + 8 * S + fs * 0.62 + j * fs * 1.25, fs, OL, 'center', 'middle', 0); });
  c.globalAlpha = 1;
}

// ---------- концовки ----------
function startFinale(d) {   // три колпака: «Пломбирный удар», Змей падает, потом короткий разговор
  d.ph = 'won'; d.pt = 0; d.fin = { charge: true }; d.flames = [];
  d.heads.forEach(function (h) { if (h.st !== 'frozen') setSt(h, 'frozen'); });
  say(d, 'PLO-05', 'p'); d.talking = true; d.slow = 0.6;
}
function startLost(d) {    // Пломбир не выстоял: Змей торжествует и пускает огонь
  if (d.ph === 'lost') return;
  d.ph = 'lost'; d.pt = 0; d.fin = {}; sfx('defeat_sting', 0.6); sfx('dragon_roar', 1); shake(d, 0.6);
  d.heads.forEach(function (h) { if (h.st !== 'frozen' && h.st !== 'sleep') { setSt(h, 'idle'); } });
  var fh = d.heads[2].st === 'frozen' || d.heads[2].st === 'sleep' ? d.heads.filter(function (h) { return h.st !== 'frozen' && h.st !== 'sleep'; })[0] : d.heads[2];
  if (fh) { setSt(fh, 'breath'); fh.bt2 = 0; d.fin.fh = fh; }
  d.talking = true; chain(d, [['GOR-01', 1]], function () { d.fin.bannerT = d.pt; setTimeout(function () { if (d.fin) d.fin.done = true; }, 1600); });
}
function endStep(d, Lo, dt0, dt) {
  var F = d.fin || {}, t = d.pt;
  if (d.ph === 'won') {
    if (F.charge && t > 0.55) { F.charge = false; d.pl.st = 'atk'; d.pl.t = 0; d.pl.combo = 2; d.pl.hit = true; SND.swing(0.8); d.cam.z.hit(6); }
    if (!F.hit && t > 0.68) { F.hit = true; var c0 = toS(Lo, Lo.cx, Lo.gy - 260); impact(d, c0.x, c0.y, 3, '#dff6ff'); sparks(d, c0.x, c0.y, 60, '#dff6ff'); d.flash = 0.9; hitstop(d, 0.16); shake(d, 1); d.iceAll = 1.4; sfx('ice_break', 1); sfx('big_boom', 0.8); SND.parry(); d.bod.x.hit(-30); d.bod.s.hit(-6); d.cam.z.hit(-8); }
    d.iceAll = Math.max(0, d.iceAll - dt0 * 0.8);
    if (t > 1.0 && t < 1.7) d.bod.x.hit(Math.sin(t * 40) * 1.5);
    if (t > 1.6) { var f0 = d.fall; d.fall = Math.min(1, easeIn((t - 1.6) / 0.45)); if (f0 < 1 && d.fall >= 1) { shake(d, 1); hitstop(d, 0.08); sfx('crash', 0.9); sfx('big_boom', 0.7); d.cam.y.hit(30); var gp = toS(Lo, Lo.cx, Lo.gy); for (var i = 0; i < 40; i++) d.sparks.push({ x: gp.x + (Math.random() - 0.5) * 500 * Lo.GS, y: gp.y, vx: (Math.random() - 0.5) * 700, vy: -300 - Math.random() * 500, life: 0.6 + Math.random() * 0.5, age: 0, col: '#ffffff' }); } }
    if (!F.banner && t > 2.2) { F.banner = t; sfx('victory_sting', 0.8); }
    if (F.banner && !F.talk && t > F.banner + 1.9) { F.talk = true; d.talking = true; chain(d, [['GOR-06', 2], ['GOR-07', 0], ['PLO-08', 'p']], function () { F.done = true; }); }
    if (F.banner) d.endSkip = function () { F.done = true; };
  } else {
    if (t > 1.2) d.endSkip = function () { F.done = true; };
    if (!F.bannerT && t > 4) F.bannerT = t;
    if (F.fh && F.fh.st === 'breath') { d.burn = Math.max(d.burn, 0.6); if (t > 2.4) setSt(F.fh, 'idle'); }
  }
  if (F.done || t > (d.ph === 'won' ? 16 : 9)) { if (F.doneT === undefined) F.doneT = t; if (t - F.doneT > 0.5) { d.irisOut = (d.irisOut || 0) + dt0; if (d.irisOut > 0.5) finish(); } }
}

// ---------- ввод ----------
var lastPtr = { type: 'mouse', button: 0 };
window.addEventListener('pointerdown', function (ev) { lastPtr = { type: ev.pointerType, button: ev.button }; }, true);
window.addEventListener('pointerup', function (ev) { lastPtr = { type: ev.pointerType, button: ev.button }; }, true);
function inDuel() { return !!(DU && UI.modal && UI.modal.type === 'duel'); }
function blockOn(d, ptr) { var pl = d.pl; if (pl.blk) return; pl.blk = true; pl.blkPtr = ptr; pl.parryOK = d.t - pl.blkUp > CFG.parryLock || pl.blkUp < 0; pl.blkAt = d.t; if (pl.st === 'atk') { pl.st = 'idle'; } pl.q = 0; }
function blockOff(d) { var pl = d.pl; if (!pl.blk) return; pl.blk = false; pl.blkPtr = null; pl.blkUp = d.t; }
function attack(d) { var pl = d.pl; if (pl.blk) return; if (pl.st === 'idle') startAtk(d); else if (pl.st === 'atk') pl.q = 1; else pl.q = 1; }
function sleepingAt(d, Lo, px, py) { var best = null; d.heads.forEach(function (h) { if (h.st !== 'sleep') return; var p0 = headPos(d, Lo, h), p = toScreen(Lo, p0); if (Math.hypot(px - p.x, py - p.y) < Math.max(70, 130 * p0.s * (Lo.cam ? Lo.cam.z : 1))) best = h; }); return best; }
var oDown = UI.down, oUp = UI.up, oKey = UI.key, oMove = UI.move;
UI.down = function (px, py, id) {
  var Gc = Z.G; if (!inDuel() && Gc && Gc.cine && UI.screen === 'level' && !UI.modal) { if (Gc.cine.t > 0.8 && Gc.cine.t < CINE_LEN) { Gc.cine.t = CINE_LEN; try { Z.stopLine(); } catch (er) { if (window.__rep) window.__rep(er); } } return; }
  if (!inDuel()) return oDown.apply(this, arguments);
  var d = DU, Lo = lay(Z.W, Z.H); camOf(d, Lo);
  if (d.ph === 'intro') { if (d.pt > 0.8) { d.ph = 'fight'; d.pt = 0; } return; }
  if (d.ph !== 'fight') { if (d.endSkip) d.endSkip(); return; }
  var sl = sleepingAt(d, Lo, px, py); if (sl) { freezeHead(d, sl); return; }
  if (lastPtr.type === 'mouse') { if (lastPtr.button === 2) blockOn(d, id); else attack(d); return; }
  if (px < Z.W / 2) blockOn(d, id); else attack(d);
};
UI.up = function (px, py, id) {
  if (!inDuel()) return oUp.apply(this, arguments);
  var d = DU; delete UI.ptrs[id === undefined ? 0 : id];
  if (d.pl.blk && (d.pl.blkPtr === id || (lastPtr.type === 'mouse' && lastPtr.button === 2))) blockOff(d);
};
UI.move = function (px, py, id) { if (!inDuel()) return oMove.apply(this, arguments); };
UI.key = function (code) { if (!inDuel()) return oKey.apply(this, arguments); };
window.addEventListener('keydown', function (ev) {
  if (!inDuel()) return; var d = DU, c = ev.code;
  if (c === 'Escape') return;
  if (ev.repeat) { ev.preventDefault(); return; }
  if (d.ph === 'intro') { d.ph = 'fight'; d.pt = 0; return; }
  if (d.ph !== 'fight') { if (d.endSkip) d.endSkip(); return; }
  if (c === 'KeyK' || c === 'ShiftLeft' || c === 'ShiftRight' || c === 'ArrowDown' || c === 'KeyS') blockOn(d, 'key');
  else if (c === 'KeyJ' || c === 'Space' || c === 'Enter' || c === 'ArrowUp' || c === 'KeyW') attack(d);
  else if (c === 'KeyF' || c === 'KeyL' || c === 'KeyE') { var h = d.heads.filter(function (q) { return q.st === 'sleep'; })[0]; freezeHead(d, h); }
  ev.preventDefault();
}, true);
window.addEventListener('keyup', function (ev) { if (!inDuel()) return; var c = ev.code; if ((c === 'KeyK' || c === 'ShiftLeft' || c === 'ShiftRight' || c === 'ArrowDown' || c === 'KeyS') && DU.pl.blkPtr === 'key') blockOff(DU); }, true);
window.addEventListener('blur', function () { if (DU) blockOff(DU); });

// пауза: поединок — это игра (для Яндекса «геймплей»), но само поле в это время стоит
var oPaused = Z.isPaused;
Z.isPaused = function () { if (inDuel()) { var m = UI.modal; UI.modal = null; var r = oPaused.apply(this, arguments); UI.modal = m; return r; } return oPaused.apply(this, arguments); };
var oUpdate = Z.update;
Z.update = function (dt) {
  if (inDuel()) return;
  oUpdate.apply(this, arguments);
  var G = Z.G; if (!G || G.duelDone || G.endless || G.phase === 'won' || G.phase === 'lost') return;
  var mp = Z.mapOf(G.idx); if (!mp || mp.lm !== 'stonebridge') return;
  if (G.cine || G.cineOut) return;
  var kb = G.L.kb;
  for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (e.type !== 'gorynych' || e.dead || e.hp <= 0) continue;
    var onBridge = kb ? (e.x > kb.c0 - 0.8 && e.x < kb.c1 + 2 && Math.abs(e.y - (kb.r + 0.5)) < 1.2) : (e.age || 0) > 3;
    var nearFort = G.L.fort && Math.hypot(e.x - G.L.fort[0] - 0.5, e.y - G.L.fort[1]) < 4.5;
    if (onBridge || nearFort || (e.age || 0) > 240) { cineStart(G, e); break; } }
};

// ---------- камера: мир (фон, Змей) двигается от ударов, руки героя — отдельно ----------
function camOf(d, Lo) { var U = Lo.U; Lo.cam = { ox: Lo.W / 2, oy: Lo.H * 0.55, tx: d.cam.x.x * U, ty: d.cam.y.x * U, r: d.cam.r.x * 0.01, z: 1.06 * (1 + d.cam.z.x * 0.01) }; }
function toWorld(Lo, p) { var C2 = Lo.cam; if (!C2) return p; var x = p.x - C2.ox - C2.tx, y = p.y - C2.oy - C2.ty, cs = Math.cos(-C2.r), sn = Math.sin(-C2.r); return { x: (x * cs - y * sn) / C2.z + C2.ox, y: (x * sn + y * cs) / C2.z + C2.oy }; }
function toScreen(Lo, p) { var C2 = Lo.cam; if (!C2) return p; var x = (p.x - C2.ox) * C2.z, y = (p.y - C2.oy) * C2.z, cs = Math.cos(C2.r), sn = Math.sin(C2.r); return { x: x * cs - y * sn + C2.ox + C2.tx, y: x * sn + y * cs + C2.oy + C2.ty }; }
var oContact = contactPt; contactPt = function (d, Lo, h) { var p = oContact(d, Lo, h), w = toWorld(Lo, p); w.blk = p.blk; return w; };

// ---------- отрисовка ----------
var oRender = UI.render;
UI.render = function (c, w, h) {
  if (!inDuel()) { var r0 = oRender.apply(this, arguments); var G0 = Z.G; if (G0 && UI.screen === 'level' && (G0.cine || G0.cineOut)) cineFrame(c, w, h, G0); return r0; }
  D.setCtx(c);
  var d = DU, Lo = lay(w, h), dt = Z.hidden ? 0 : Math.min(0.05, Z.frameDt || 0.016);
  camOf(d, Lo);
  step(d, Lo, dt);
  if (!DU) return oRender.apply(this, arguments); // поединок закончился в этом кадре
  Lo = lay(w, h); camOf(d, Lo);
  draw(c, d, Lo);
  if (UI.modal) UI.modal.t += dt;
};

function draw(c, d, Lo) {
  var W = Lo.W, H = Lo.H, S = (UI.api().S || 1), t = d.t, U = Lo.U, C2 = Lo.cam;
  bodyTf(d, Lo);
  var sh = d.trauma * d.trauma * 24 * U, sx = (Math.random() - 0.5) * sh, sy = (Math.random() - 0.5) * sh;
  c.fillStyle = '#16214a'; c.fillRect(0, 0, W, H);
  c.save(); c.translate(C2.ox + C2.tx + sx, C2.oy + C2.ty + sy); c.rotate(C2.r); c.scale(C2.z, C2.z); c.translate(-C2.ox, -C2.oy);
  c.drawImage(background(Lo), 0, 0, W, H);
  dragonBody(c, Lo, t, d.fall * 1.6);
  var list = d.heads.map(function (h) { var p = headPos(d, Lo, h); h.last = { x: p.x, y: p.y, s: p.s, rot: p.rot }; return { h: h, p: p }; });
  list.sort(function (a, b) { return a.p.s - b.p.s; });
  list.forEach(function (o) {
    var h = o.h, p = o.p, sh2 = p.sh, nw = 52 * Lo.GSb, mx = (sh2.x + p.x) / 2, my = Math.max(sh2.y, p.y) + 40 * Lo.GSb;
    var nwk = nw * Math.max(1, p.s / (HEADS[h.i].s * Lo.GSb) * 0.75);
    strk(c, OL, nwk + 14 * Lo.GSb, function (q) { q.moveTo(sh2.x, sh2.y); q.quadraticCurveTo(mx, my, p.x, p.y + 30 * p.s); }); strk(c, '#4a9a58', nwk, function (q) { q.moveTo(sh2.x, sh2.y); q.quadraticCurveTo(mx, my, p.x, p.y + 30 * p.s); });
    c.globalAlpha = 0.35; strk(c, '#d8e88a', nwk * 0.35, function (q) { q.moveTo(sh2.x, sh2.y); q.quadraticCurveTo(mx, my, p.x, p.y + 30 * p.s); }); c.globalAlpha = 1;
  });
  list.forEach(function (o) {
    var h = o.h, p = o.p;
    if (h.st === 'wind') { var k = ease(h.t / windFor(d, h)), r = (120 + 60 * k) * p.s, gc = h.fire ? '255,120,40' : '255,224,102'; var gg = c.createRadialGradient(p.x, p.y, r * 0.3, p.x, p.y, r * 1.6); gg.addColorStop(0, 'rgba(' + gc + ',' + (0.15 + 0.5 * k) + ')'); gg.addColorStop(1, 'rgba(' + gc + ',0)');
      if (h.fire) for (var sm = 0; sm < 3; sm++) { var sp2 = (t * 1.6 + sm / 3) % 1; c.globalAlpha = (1 - sp2) * 0.6 * k; D.circ(p.x + (sm - 1) * 30 * p.s + Math.sin(t * 4 + sm) * 8 * p.s, p.y - (20 + sp2 * 140) * p.s, (14 + sp2 * 30) * p.s, '#6b6f80'); c.globalAlpha = 1; } c.fillStyle = gg; c.beginPath(); c.arc(p.x, p.y, r * 1.6, 0, 7); c.fill();
      if (h.i === 1 && k > 0.4) { c.globalAlpha = (k - 0.4) / 0.6; D.star(p.x + 70 * p.s, p.y - 120 * p.s, 26 * p.s * (1 + 0.3 * Math.sin(t * 20)), '#ffffff', 2); c.globalAlpha = 1; }
      D.text('!', p.x + (h.i - 1 || 1) * 120 * p.s, p.y - 60 * p.s, Math.max(28 * S, 80 * p.s), '#ffe066', 'center', 'middle', Math.max(4, 12 * p.s)); }
    if (h.st === 'strike') { // шлейф броска
      c.globalAlpha = 0.55; for (var ln = 0; ln < 14; ln++) { var an = ln / 14 * Math.PI * 2, r0 = 125 * p.s, r1 = (165 + (ln % 3) * 30) * p.s; strk(c, '#ffffff', 4 * U + 1, function (q) { q.moveTo(p.x + Math.cos(an) * r0, p.y + Math.sin(an) * r0); q.lineTo(p.x + Math.cos(an) * r1, p.y + Math.sin(an) * r1); }); } c.globalAlpha = 1; }
    var mode = h.st === 'strike' || h.st === 'breath' || (h.st === 'wind' && ease(h.t / windFor(d, h)) > 0.75) || (h.st === 'rec' && h.t < 0.15 && h.out === 'hurt') ? 'bite' : h.st === 'wind' || h.st === 'hblock' ? 'angry' : h.st === 'stun' || h.st === 'dizzy' || (h.st === 'rec' && h.out === 'parry') ? 'dizzy' : h.st === 'sleep' || h.st === 'frozen' ? 'sleep' : h.st === 'hit' ? 'dizzy' : 'idle';
    head(c, p.x, p.y, p.s, mode, p.rot, t, HEADS[h.i].acc, h.fl);
    if ((h.st === 'wind' && h.fire && ease(h.t / windFor(d, h)) > 0.6) || h.st === 'breath') { c.globalAlpha = 0.55 + 0.3 * Math.sin(t * 25); D.ell(p.x, p.y + 55 * p.s, 55 * p.s, 38 * p.s, '#ffb347'); c.globalAlpha = 1; }
    if (h.st === 'strike' && h.i === 0) { c.globalAlpha = 0.5; for (var fr = 0; fr < 5; fr++) D.circ(p.x + (fr - 2) * 30 * p.s, p.y + (110 + fr % 2 * 20) * p.s, (14 + fr * 3) * p.s, '#dff6ff'); c.globalAlpha = 1; }
    if (h.st === 'stun' || h.st === 'dizzy') for (var st = 0; st < 3; st++) { var sa = t * 4 + st * 2.1; D.star(p.x + Math.cos(sa) * 110 * p.s, p.y - 120 * p.s + Math.sin(sa) * 24 * p.s, 18 * p.s, '#ffe066', 2); }
    if (h.st === 'sleep' || h.st === 'frozen') {
      for (var zz = 0; zz < 2; zz++) { var zp = (t * 0.6 + zz * 0.5 + h.i * 0.3) % 1; c.globalAlpha = 1 - zp; D.text('z', p.x + (60 + zp * 60) * p.s, p.y - (110 + zp * 90) * p.s, Math.max(14, (40 + zp * 30) * p.s), '#ffffff', 'center', 'middle', 3); c.globalAlpha = 1; }
      if (h.st === 'frozen') { c.globalAlpha = 0.55; D.ell(p.x, p.y - 10 * p.s, 135 * p.s, 115 * p.s, '#cfeeff', 3); c.globalAlpha = 0.9; strk(c, '#ffffff', 6 * p.s + 1, function (q) { q.moveTo(p.x - 80 * p.s, p.y - 60 * p.s); q.quadraticCurveTo(p.x - 40 * p.s, p.y - 100 * p.s, p.x + 10 * p.s, p.y - 100 * p.s); }); c.globalAlpha = 1; D.flake(p.x + 70 * p.s, p.y - 80 * p.s, 22 * p.s, '#ffffff', 2); }
      else { var fr2 = Math.max(0, h.wakeT / CFG.wake), rr = Math.max(46, 130 * p.s); c.lineWidth = Math.max(5, 9 * U); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(p.x, p.y, rr, 0, 7); c.stroke(); c.strokeStyle = fr2 < 0.35 ? '#ff7a7a' : '#ffe066'; c.beginPath(); c.arc(p.x, p.y, rr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fr2); c.stroke();
        var pul = 1 + 0.08 * Math.sin(t * 8); D.text(TT('Нажми!', 'Tap!'), p.x, p.y + rr + 20 * S, 20 * S * pul, '#ffffff', 'center', 'middle', 4 * S); }
    }
  });
  if (d.iceAll > 0) { var ib = toS(Lo, Lo.cx, Lo.gy - 260); c.globalAlpha = Math.min(0.6, d.iceAll * 0.6); D.ell(ib.x, ib.y, 520 * Lo.GSb, 380 * Lo.GSb, '#d8f4ff', 3); c.globalAlpha = Math.min(0.9, d.iceAll); for (var cr = 0; cr < 7; cr++) { var ca = cr * 0.9 + 0.4; strk(c, '#ffffff', 5 * Lo.U + 1, function (q) { q.moveTo(ib.x, ib.y); q.lineTo(ib.x + Math.cos(ca) * 300 * Lo.GSb, ib.y + Math.sin(ca) * 220 * Lo.GSb); }); } c.globalAlpha = 1; }
  drawFlames(c, d, Lo);
  talkBubble(c, d, Lo, S, true);
  // вспышки попаданий: там, куда пришёлся удар
  d.imp.forEach(function (m) { var k = m.t / 0.28, R = (60 + 120 * easeOut(k)) * m.s * U;
    c.globalAlpha = (1 - k) * 0.9; c.lineWidth = Math.max(2, 10 * (1 - k) * U * m.s); c.strokeStyle = m.col; c.beginPath(); c.arc(m.x, m.y, R, 0, 7); c.stroke();
    if (k < 0.45) { c.globalAlpha = 1 - k / 0.45; D.star(m.x, m.y, (70 - 40 * k) * m.s * U, m.col, 0); c.globalAlpha = (1 - k / 0.45) * 0.8; for (var j = 0; j < 8; j++) { var a = j / 8 * Math.PI * 2 + 0.3; strk(c, '#ffffff', 5 * U * m.s, function (q) { q.moveTo(m.x + Math.cos(a) * R * 0.5, m.y + Math.sin(a) * R * 0.5); q.lineTo(m.x + Math.cos(a) * R * 1.05, m.y + Math.sin(a) * R * 1.05); }); } }
    c.globalAlpha = 1; });
  c.lineCap = 'round'; d.sparks.forEach(function (s) { var k = 1 - s.age / s.life; c.globalAlpha = k; c.strokeStyle = s.col; c.lineWidth = 3 * U + 1; c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - s.vx * 0.03, s.y - s.vy * 0.03); c.stroke(); }); c.globalAlpha = 1;
  c.restore();
  viewmodel(c, d, Lo);
  if (d.flash > 0) { c.globalAlpha = d.flash * 0.6; c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  var vg = c.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(10,14,40,0)'); vg.addColorStop(1, 'rgba(10,14,40,0.5)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  if (d.burn > 0) { var vb = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.7); vb.addColorStop(0, 'rgba(255,120,30,0)'); vb.addColorStop(1, 'rgba(255,110,20,' + (0.6 * d.burn) + ')'); c.fillStyle = vb; c.fillRect(0, 0, W, H); }
  if (d.vig > 0) { var vr = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7); vr.addColorStop(0, 'rgba(200,40,40,0)'); vr.addColorStop(1, 'rgba(200,40,40,' + (0.55 * d.vig) + ')'); c.fillStyle = vr; c.fillRect(0, 0, W, H); }
  d.heads.forEach(function (h) { if (h.st !== 'wind') return; var k = ease(h.t / windFor(d, h)), side = h.i - 1, ew = 90 * U;
    var eg = side < 0 ? c.createLinearGradient(0, 0, ew, 0) : side > 0 ? c.createLinearGradient(W, 0, W - ew, 0) : c.createLinearGradient(0, 0, 0, ew);
    var ec = h.fire ? '255,120,40' : '255,224,102'; eg.addColorStop(0, 'rgba(' + ec + ',' + (0.65 * k) + ')'); eg.addColorStop(1, 'rgba(' + ec + ',0)'); c.fillStyle = eg; if (side < 0) c.fillRect(0, 0, ew, H); else if (side > 0) c.fillRect(W - ew, 0, ew, H); else c.fillRect(0, 0, W, ew); });
  talkBubble(c, d, Lo, S, false);
  hud(c, d, Lo, S);
  if (d.iris < 1) irisDraw(c, W, H, W / 2, H * 0.42, easeOut(d.iris));
  if (d.irisOut) irisDraw(c, W, H, W / 2, H * 0.42, 1 - ease(d.irisOut / 0.5));
}

// ---------- руки героя: меч бьёт в саму голову, щит встречает удар там, откуда он пришёл ----------
function swordPose(d, Lo) {
  var W = Lo.W, H = Lo.H, pl = d.pl, SS = Lo.SS, U = Lo.U, sk = SS / 0.62 * 0.85, Lb = 330 * sk;
  var Hr = { x: Lo.port ? W * 0.8 : W - 205 * SS / 0.62, y: Lo.port ? H * 0.84 : H - 160 * SS / 0.62 }, rest = -0.42;
  var pose = { x: Hr.x, y: Hr.y, a: rest, a0: rest, trail: 0, sk: sk, Lb: Lb };
  if (d.ph === 'won' && d.fin && d.fin.charge) { pose.x = W * 0.62; pose.y = H * 0.82; pose.a = -0.15 + Math.sin(d.t * 30) * 0.02; return pose; }
  if (pl.st !== 'atk' && pl.st !== 'bounce') { if (pl.blk) { pose.x += 50 * U; pose.y += 70 * U; pose.a = -0.15; } if (pl.st === 'hurt') pose.y += 50 * Math.sin(Math.min(1, pl.t / 0.35) * Math.PI) * U; return pose; }
  var tg = target(d), T;
  if (pl.cp && pl.hit) T = toScreen(Lo, pl.cp); else if (tg) { var hp = headPos(d, Lo, tg); T = toScreen(Lo, hp); } else T = { x: W / 2, y: H * 0.4 };
  var vx = T.x - Hr.x, vy = T.y - Hr.y, L0 = Math.hypot(vx, vy) || 1, reach = Math.max(0, L0 - Lb * 0.8);
  var Hc = { x: Hr.x + vx / L0 * reach, y: Math.max(H * 0.42, Hr.y + vy / L0 * reach) };
  var am = Math.atan2(T.x - Hc.x, -(T.y - Hc.y)), i = pl.combo % 3, dir = i === 0 ? -1 : i === 1 ? 1 : 0;
  var a0 = dir ? am - dir * 1.15 : am - 1.5, a1 = dir ? am + dir * 0.85 : am + 0.55;
  var Hw = { x: Hr.x - (dir || -0.5) * 50 * U, y: Hr.y - (dir ? 50 : 110) * U };
  var t = pl.t;
  if (pl.st === 'bounce') { var b = Math.min(1, t / 0.32), e = ease(b); pose.x = Hc.x + (Hr.x - Hc.x) * e; pose.y = Hc.y + (Hr.y - Hc.y) * e + Math.sin(b * Math.PI) * 30 * U; pose.a = am - (dir || 1) * 0.5 * Math.sin(b * Math.PI) + (rest - am) * e; return pose; }
  if (t < 0.09) { var p = ease(t / 0.09); pose.x = Hr.x + (Hw.x - Hr.x) * p; pose.y = Hr.y + (Hw.y - Hr.y) * p; pose.a = rest + (a0 - rest) * p; }
  else if (t < 0.19) { var q = (t - 0.09) / 0.1, qe = Math.pow(q, 1.3); pose.x = Hw.x + (Hc.x - Hw.x) * ease(q * 1.4); pose.y = Hw.y + (Hc.y - Hw.y) * ease(q * 1.4); pose.a = a0 + (a1 - a0) * qe; pose.a0 = a0; pose.trail = 1; }
  else { var r = ease((t - 0.19) / 0.27); pose.x = Hc.x + (Hr.x - Hc.x) * r; pose.y = Hc.y + (Hr.y - Hc.y) * r; pose.a = a1 + (rest - a1) * r; pose.a0 = a0; pose.trail = Math.max(0, 1 - r * 3); }
  return pose;
}
function viewmodel(c, d, Lo) {
  var W = Lo.W, H = Lo.H, pl = d.pl, SS = Lo.SS, U = Lo.U, kx = d.kick.x.x * U, ky = d.kick.y.x * U;
  var sp = swordPose(d, Lo), swX = sp.x + kx, swY = sp.y + ky + Math.sin(d.t * 2) * 3 * U, swR = sp.a + d.kick.r.x * 0.01 + Math.sin(d.t * 1.6) * 0.02;
  if (sp.trail > 0) { c.save(); c.translate(swX, swY); var g0 = sp.a0 - Math.PI / 2, g1 = swR - Math.PI / 2; c.globalAlpha = 0.45 * sp.trail; c.fillStyle = '#eaf8ff'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, sp.Lb, g0, g1, g1 < g0); c.closePath(); c.fill(); c.globalAlpha = 0.9 * sp.trail; c.strokeStyle = '#ffffff'; c.lineWidth = 6 * U; c.beginPath(); c.arc(0, 0, sp.Lb * 0.97, g0 + (g1 - g0) * 0.5, g1, g1 < g0); c.stroke(); c.restore(); c.globalAlpha = 1; }
  var arm = 40 * SS / 0.62, ax0 = W + 40, ay0 = H + 30;
  strk(c, OL, arm, function (q) { q.moveTo(ax0, ay0); q.quadraticCurveTo((ax0 + swX) / 2 + 40 * U, (ay0 + swY) / 2 + 40 * U, swX + 5, swY + 10); }); strk(c, '#6b4a2f', arm * 0.7, function (q) { q.moveTo(ax0, ay0); q.quadraticCurveTo((ax0 + swX) / 2 + 40 * U, (ay0 + swY) / 2 + 40 * U, swX + 5, swY + 10); });
  c.save(); c.translate(swX, swY); c.rotate(swR); c.scale(sp.sk, sp.sk);
  D.rr(-60, -14, 120, 28, 10); c.fillStyle = '#7fc8ee'; c.fill(); c.lineWidth = 4; c.strokeStyle = OL; c.stroke();
  shape(c, function (q) { q.moveTo(-26, -14); q.lineTo(0, -330); q.lineTo(26, -14); }, lg(c, -26, 0, 26, 0, '#eafaff', '#8fd6f5'), 4);
  c.globalAlpha = 0.8; strk(c, '#ffffff', 5, function (q) { q.moveTo(-8, -40); q.lineTo(-2, -260); }); c.globalAlpha = 1;
  if (d.ph === 'won' && d.fin && (d.fin.charge || d.pt < 0.9)) { var gk = 0.5 + 0.5 * Math.sin(d.t * 25); c.globalAlpha = 0.35 + 0.3 * gk; D.ell(0, -180, 70, 200, '#bfeaff'); c.globalAlpha = 0.8; D.star(0, -330, 40 + 15 * gk, '#ffffff', 0); c.globalAlpha = 1; }
  c.restore();
  // щит
  var shX = Lo.port ? W * 0.22 : Math.min(W * 0.17, 210 * U), shY = Lo.port ? H * 0.86 : H - 90 * SS / 0.62 * 0.9, shR = 0.16, shS = SS;
  var blkK = pl.blk ? Math.min(1, (d.t - pl.blkAt) / 0.07) : 0, bp = shieldBlockPos(Lo, d.blkSide);
  if (pl.blk || pl.st === 'parry' || pl.st === 'blockhit') { var k2 = pl.blk ? ease(blkK) : 1 - ease(pl.t / 0.3); shX += (bp.x - shX) * k2; shY += (bp.y - shY) * k2; shR = 0.16 * (1 - k2) - d.blkSide * 0.25 * k2; shS = SS * (1 + 0.25 * k2); }
  if (pl.st === 'parry') { var pk = Math.sin(Math.min(1, pl.t / 0.25) * Math.PI); shR -= 0.5 * pk * (d.blkSide >= 0 ? 1 : -1); }
  if (pl.st === 'hurt') shY += 50 * Math.sin(Math.min(1, pl.t / 0.35) * Math.PI) * U;
  shX += d.kick.bx.x * U + kx * 0.6; shY += d.kick.by.x * U + ky * 0.6 + Math.sin(d.t * 2 + 1) * 3 * U; shR += d.kick.br.x * 0.01;
  c.save(); c.translate(shX, shY); c.scale(shS, shS); c.rotate(shR);
  strk(c, OL, 40, function (q) { q.moveTo(-200, 300); q.quadraticCurveTo(-40, 160, 10, 40); }); strk(c, '#6b4a2f', 28, function (q) { q.moveTo(-200, 300); q.quadraticCurveTo(-40, 160, 10, 40); });
  shape(c, function (q) { q.moveTo(0, -250); q.quadraticCurveTo(205, -240, 180, 0); q.quadraticCurveTo(150, 230, 0, 300); q.quadraticCurveTo(-150, 230, -180, 0); q.quadraticCurveTo(-205, -240, 0, -250); }, lg(c, -180, -250, 180, 300, '#dff6ff', '#5ab4e6'), 6);
  shape(c, function (q) { q.moveTo(0, -220); q.quadraticCurveTo(175, -210, 152, 0); q.quadraticCurveTo(128, 200, 0, 262); q.quadraticCurveTo(-128, 200, -152, 0); q.quadraticCurveTo(-175, -210, 0, -220); }, 'rgba(255,255,255,0.18)', 0);
  D.flake(0, 10, 90, '#ffffff', 7);
  c.globalAlpha = 0.7; strk(c, '#ffffff', 10, function (q) { q.moveTo(-120, -150); q.quadraticCurveTo(-90, -200, -30, -210); }); c.globalAlpha = 1;
  if (pl.st === 'parry' || pl.st === 'blockhit') { c.globalAlpha = Math.max(0, 1 - pl.t / 0.3) * (pl.st === 'parry' ? 1 : 0.5); D.ell(0, 0, 230, 290, 'rgba(255,255,255,0.6)'); c.globalAlpha = 1; }
  if (d.heat > 0) { c.globalAlpha = Math.min(0.85, d.heat * 0.85); c.lineWidth = 26; c.strokeStyle = '#ff8a3d'; c.beginPath(); c.moveTo(0, -238); c.quadraticCurveTo(195, -228, 170, 0); c.quadraticCurveTo(142, 220, 0, 288); c.quadraticCurveTo(-142, 220, -170, 0); c.quadraticCurveTo(-195, -228, 0, -238); c.stroke(); c.globalAlpha = Math.min(0.25, d.heat * 0.25); D.ell(0, 20, 170, 240, '#ffb070'); c.globalAlpha = 1; }
  c.restore();
}

function hud(c, d, Lo, S) {
  var W = Lo.W, H = Lo.H, f = Math.max(13, 18 * S), pw = Math.min(W * 0.44, 300 * S), ph = 46 * S, mob = lastPtr.type !== 'mouse';
  // герой
  D.rr(12 * S, 12 * S, pw, ph, 14 * S); c.fillStyle = 'rgba(16,22,52,0.82)'; c.fill();
  var nm = TT('Пломбир', 'Plombir'); D.text(nm, 22 * S, 12 * S + ph / 2, D.fitText(nm, pw * 0.4 - 14 * S, f), '#fff', 'left', 'middle', 0);
  var bx = 12 * S + pw * 0.45, bw = pw * 0.5, by = 12 * S + ph / 2 - 8 * S; D.rr(bx, by, bw, 16 * S, 8 * S); c.fillStyle = '#3a2030'; c.fill(); D.rr(bx, by, Math.max(0.001, bw * d.hp / d.hpMax), 16 * S, 8 * S); c.fillStyle = d.hp / d.hpMax < 0.3 ? '#ff7a5a' : '#6fe06a'; c.fill();
  // головы
  var gx = W - 12 * S - pw; D.rr(gx, 12 * S, pw, ph, 14 * S); c.fillStyle = 'rgba(16,22,52,0.82)'; c.fill();
  var hr = Math.min(15 * S, pw * 0.075), hsp = hr * 2.6, gn = TT('Горыныч', 'Gorynych'); var gf = D.fitText(gn, pw - 3 * hsp - 22 * S, f); if (gf >= 11) D.text(gn, gx + 12 * S, 12 * S + ph / 2, gf, '#fff', 'left', 'middle', 0);
  d.heads.forEach(function (h, i) { var x = gx + pw - (3 - i) * hsp + hr * 0.6, y = 12 * S + ph / 2, r = hr;
    var col = h.st === 'frozen' ? '#bfe6ff' : h.st === 'sleep' ? '#8aa0c0' : h.st === 'wind' || h.st === 'strike' ? '#ffe066' : '#5ab06a';
    D.circ(x, y, r, col, 2.5 * S);
    if (h.st === 'frozen') D.flake(x, y, r * 0.7, '#ffffff', 2);
    else if (h.st === 'sleep') D.text('z', x, y, f * 0.9, '#fff', 'center', 'middle', 0);
    else { c.lineWidth = 3.5 * S; c.strokeStyle = '#ffffff'; c.beginPath(); c.arc(x, y, r - 1, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, h.hp) / 100); c.stroke(); } });
  // интро
  if (d.ph === 'intro') {
    var k = ease(d.pt / 0.35), bw2 = Math.min(W * 0.86, 460 * S), bh = 70 * S, bx2 = W / 2 - bw2 / 2, by2 = H * 0.16;
    c.globalAlpha = k; D.rr(bx2, by2, bw2, bh, 20 * S); c.fillStyle = '#e8484f'; c.fill(); c.lineWidth = 5 * S; c.strokeStyle = OL; c.stroke();
    D.text(TT('ЧЕСТНЫЙ БОЙ!', 'A FAIR FIGHT!'), W / 2, by2 + bh / 2, D.fitText(TT('ЧЕСТНЫЙ БОЙ!', 'A FAIR FIGHT!'), bw2 - 30 * S, 42 * S), '#fff', 'center', 'middle', 6 * S);
    var lines = mob ? [TT('Слева — держи щит', 'Left side — hold the shield'), TT('Справа — бей мечом', 'Right side — strike with the sword')] : [TT('ПКМ или K — щит (держать)', 'RMB or K — shield (hold)'), TT('ЛКМ или J — меч', 'LMB or J — sword')];
    var lw2 = Math.min(W * 0.86, 440 * S); D.rr(W / 2 - lw2 / 2, by2 + bh + 10 * S, lw2, 84 * S, 16 * S); c.fillStyle = 'rgba(16,22,52,0.85)'; c.fill();
    lines.forEach(function (s, j) { var yy = by2 + bh + (32 + j * 36) * S; D.text(s, W / 2, yy, D.fitText(s, lw2 - 24 * S, Math.max(14, 21 * S)), '#ffffff', 'center', 'middle', 0); });
    c.globalAlpha = 1;
  }
  // подсказка
  var tips = { block: TT('Голова светится — держи щит!', 'A head glows — hold the shield!'), parry: TT('Нажми щит точно перед ударом — отобьёшь!', 'Shield right before the hit to parry!'), counter: TT('Голова оглушена — бей мечом!', 'The head is stunned — strike!'), freeze: TT('Голова уснула — нажми на неё!', 'A head fell asleep — tap it!') };
  if (d.ph === 'fight' && tips[d.tip] && d.tipT < 6) { var a2 = Math.min(1, d.tipT * 3) * Math.min(1, (6 - d.tipT)); c.globalAlpha = a2; var ty = H - (mob ? 64 : 40) * S, tw2 = Math.min(W - 24 * S, 520 * S); D.rr(W / 2 - tw2 / 2, ty - 20 * S, tw2, 40 * S, 14 * S); c.fillStyle = 'rgba(16,22,52,0.82)'; c.fill(); D.text(tips[d.tip], W / 2, ty, D.fitText(tips[d.tip], tw2 - 20 * S, Math.max(14, 19 * S)), '#ffe066', 'center', 'middle', 0); c.globalAlpha = 1; }
  // метки сторон для пальцев
  if (d.ph === 'fight' && mob) { c.globalAlpha = 0.55; D.text(TT('щит', 'shield'), W * 0.08, H - 16 * S, Math.max(12, 15 * S), '#ffffff', 'left', 'middle', 3 * S); D.text(TT('меч', 'sword'), W * 0.92, H - 16 * S, Math.max(12, 15 * S), '#ffffff', 'right', 'middle', 3 * S); c.globalAlpha = 1; }
  // всплывающие слова
  d.pops.forEach(function (p, j) { var k = p.t < 0.12 ? p.t / 0.12 : 1, a = p.t > 0.8 ? (1.1 - p.t) / 0.3 : 1; c.globalAlpha = Math.max(0, a); D.text(p.s, W / 2, H * 0.36 - p.t * 30 * S - j * 4, Math.min(D.fitText(p.s, W - 30 * S, 60 * S), Math.max(18, 40 * S * p.big * (0.7 + 0.3 * k))), p.col, 'center', 'middle', 6 * S); c.globalAlpha = 1; });
  // финал
  var bT0 = d.ph === 'won' ? (d.fin && d.fin.banner) : d.ph === 'lost' ? (d.fin && d.fin.bannerT) : 0;
  if (bT0 && (d.ph === 'lost' || d.pt < bT0 + 2.2)) {
    var kk = ease((d.pt - bT0) / 0.4) * (d.ph === 'won' ? Math.max(0, 1 - (d.pt - bT0 - 1.8) / 0.4) : 1), win = d.ph === 'won', bw3 = Math.min(W * 0.86, 480 * S), bh3 = 72 * S, by3 = H * 0.18;
    c.globalAlpha = kk; D.rr(W / 2 - bw3 / 2, by3, bw3, bh3, 20 * S); c.fillStyle = win ? '#4caf50' : '#5a6aa0'; c.fill(); c.lineWidth = 5 * S; c.strokeStyle = OL; c.stroke();
    var tt = win ? TT('ЗМЕЙ ГОРЫНЫЧ ПОВЕРЖЕН!', 'ZMEY GORYNYCH IS DEFEATED!') : TT('Пломбир отступил…', 'Plombir falls back…');
    D.text(tt, W / 2, by3 + bh3 / 2, D.fitText(tt, bw3 - 30 * S, 40 * S), '#fff', 'center', 'middle', 6 * S);
    var sub = win ? TT('Калинов мост наш!', 'The Kalinov Bridge is ours!') : TT('Змей идёт к ёлке — добейте его башнями', 'The Dragon heads for the tree — finish him with towers');
    var sw3 = Math.min(W - 20 * S, 560 * S); D.rr(W / 2 - sw3 / 2, by3 + bh3 + 8 * S, sw3, 38 * S, 12 * S); c.fillStyle = 'rgba(16,22,52,0.85)'; c.fill();
    D.text(sub, W / 2, by3 + bh3 + 27 * S, D.fitText(sub, sw3 - 20 * S, Math.max(14, 19 * S)), '#ffffff', 'center', 'middle', 0); c.globalAlpha = 1;
  }
}

// ======================================================================
// Калинов мост на поле: широкая река сверху вниз через середину карты и большой каменный мост поперёк —
// единственная переправа, пока река не замёрзла. Враги идут слева, ёлка — справа.
// ======================================================================
function isKalinov(idx) { var m = Z.mapOf && Z.mapOf(idx); return !!(m && m.lm === 'stonebridge') && !Z.endlessGen; }
function kRoute(L, from, to, blocked, wts) {
  var W = L.W, H = L.H, n = W * H, dist = [], prev = [], done = [], i;
  for (i = 0; i < n; i++) { dist[i] = Infinity; prev[i] = -1; done[i] = false; }
  var s = from[1] * W + from[0], t = to[1] * W + to[0]; dist[s] = 0;
  for (;;) { var u = -1, b = Infinity; for (i = 0; i < n; i++) if (!done[i] && dist[i] < b) { b = dist[i]; u = i; } if (u < 0 || u === t) break; done[u] = true;
    var uc = u % W, ur = (u - uc) / W; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var nc = uc + d[0], nr = ur + d[1]; if (nc < 0 || nr < 0 || nc >= W || nr >= H) return; var v = nr * W + nc; if (v !== t && blocked(nc, nr)) return; var nd = dist[u] + wts[v]; if (nd < dist[v]) { dist[v] = nd; prev[v] = u; } }); }
  if (dist[t] === Infinity) return null;
  var p = [], cur = t; while (cur >= 0) { p.push([cur % W, Math.floor(cur / W)]); cur = prev[cur]; } return p.reverse();
}
function kalinovMap(L) {
  var W = L.W, H = L.H, g = L.grid, rnd = Z.rng(4242 + W * 31 + H * 7), ri = function (a, b) { return a + Math.floor(rnd() * (b - a + 1)); };
  var rw = W >= 20 ? 5 : W >= 14 ? 4 : 3, rc0 = Math.floor((W - rw) / 2), rc1 = rc0 + rw - 1, br = Math.round(H * 0.42);
  if (rc0 < 3 || W - 1 - rc1 < 4) return L;   // слишком узкое поле — оставляем обычную карту
  var old = { g: g.map(function (r) { return r.slice(); }), fort: L.fort.slice() };
  // 1) убрать старые дороги, реку, ориентир; стену у ёлки пересобрать справа
  for (var r = 0; r < H; r++) for (var c = 0; c < W; c++) { var v = g[r][c]; if (v === 1 || v === 4 || v === 5 || v === 11) g[r][c] = 0; if (v === 9 && r < H - 1) g[r][c] = 0; }
  for (var c2 = 0; c2 < W; c2++) g[H - 1][c2] = 9;
  var fx = Math.min(W - 3, Math.max(rc1 + 3, Math.round((rc1 + W) / 2))), fort = [fx, H - 1];
  [[-1, -1], [1, -1]].forEach(function (d) { g[H - 1 + d[1]][fx + d[0]] = 9; });
  g[H - 1][fx] = 1;
  // 2) река
  for (var r2 = 0; r2 < H - 1; r2++) for (var c3 = rc0; c3 <= rc1; c3++) g[r2][c3] = 4;
  // 3) входы: два слева (через мост), один справа сверху (напрямик)
  var e1 = [ri(1, Math.max(1, rc0 - 2)), 0], e2 = [0, ri(2, Math.max(2, Math.floor(H * 0.3)))], e3 = [ri(rc1 + 2, W - 2), 0];
  var ents = [e1, e2]; if (Z.LEVELS[L.idx] && Z.LEVELS[L.idx].type === 'boss') ents.push(e3);
  var blocked = function (cc, rr) { var q = g[rr][cc]; return q === 4 || q === 9 || q === 5; };
  var road = {}, mk = function (p) { p.forEach(function (q) { road[q[1] * W + q[0]] = 1; }); };
  var wts = function () { var w = []; for (var i = 0; i < W * H; i++) w[i] = road[i] ? 0.6 : 1 + rnd() * 6; return w; };
  var west = [rc0 - 1, br], east = [rc1 + 1, br], cross = []; for (var cb = rc0; cb <= rc1; cb++) cross.push([cb, br]);
  var after = kRoute(L, east, fort, blocked, wts()); if (!after) return restore();
  var paths = [];
  for (var k = 0; k < 2; k++) { var a = kRoute(L, ents[k], west, blocked, wts()); if (!a) return restore(); var p = a.concat(cross, after); mk(p); paths.push(p); }
  if (ents[2]) { var p3 = kRoute(L, e3, fort, function (cc, rr) { return blocked(cc, rr) || cc <= rc1 + 1; }, wts()); if (p3) { mk(p3); paths.push(p3); } else ents.pop(); }
  // 4) дороги поверх всего; у входов и на дороге — чисто
  var nearEnt = {}; ents.forEach(function (e) { for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) nearEnt[(e[1] + dr) * W + e[0] + dc] = 1; });
  for (var r3 = 0; r3 < H; r3++) for (var c4 = 0; c4 < W; c4++) { var kk = r3 * W + c4;
    if (road[kk]) { g[r3][c4] = 1; if (L.hgt[r3]) L.hgt[r3][c4] = 0; delete L.bush[kk]; delete L.drift[kk]; }
    else if (g[r3][c4] === 4) { if (L.hgt[r3]) L.hgt[r3][c4] = 0; delete L.bush[kk]; delete L.drift[kk]; }
    else if (nearEnt[kk] && g[r3][c4] !== 9) { g[r3][c4] = 0; delete L.bush[kk]; } }
  // берега у моста свободны — подходы к мосту
  [west, east].forEach(function (q) { for (var dr = 0; dr <= 1; dr++) { var rr = q[1] + dr; if (rr < H - 1 && g[rr][q[0]] !== 1) { g[rr][q[0]] = 0; if (L.hgt[rr]) L.hgt[rr][q[0]] = 0; } } });
  L.bridges = {}; L.ice = {}; delete L.riverRow; delete L.landmark;
  L.fort = fort; L.entrances = ents; L.paths = paths; L.main = paths[0];
  L.kb = { c0: rc0, c1: rc1, r: br };
  var spots = []; for (var r5 = 0; r5 < H; r5++) for (var c6 = 0; c6 < W; c6++) { if (g[r5][c6] !== 0 && g[r5][c6] !== 3) continue; var cov = 0; for (var d2 = -1; d2 <= 1; d2++) for (var d3 = -1; d3 <= 1; d3++) if (road[(r5 + d2) * W + c6 + d3]) cov++; if (cov) spots.push({ c: c6, r: r5, cov: cov + rnd(), hill: g[r5][c6] === 3 }); }
  spots.sort(function (a, b) { return b.cov - a.cov; }); L.spots = spots.slice(0, 24);
  return L;
  function restore() { L.grid = old.g; L.fort = old.fort; return L; }
}
var oGen = Z.genLevel;
Z.genLevel = function (idx, dims) { var L = oGen.apply(this, arguments); if (isKalinov(idx) && L.type !== 'escort') { try { kalinovMap(L); } catch (e) { if (window.__rep) window.__rep(e); } } return L; };
// река без льда — не переправа (вброд почти никто не пойдёт), лёд — переправа
if (Z.hk) { var oNav = Z.hk.navCost; Z.hk.navCost = function (v, c, r, pn) { var x = oNav ? oNav.apply(this, arguments) : 0, G = Z.G; if (G && G.L.kb && G.L.grid[r][c] === 4) x += 40; return x; }; }
// большой мост поверх реки, под героями и врагами: вид «три четверти» — настил, оба парапета, фасад с арками, горб посередине
var HUMP = 0.45;   // подъём середины моста, в клетках
Z.liftAt = function (x, y) {
  var G = Z.G, kb = G && G.L && G.L.kb; if (!kb || Math.abs(y - (kb.r + 0.5)) > 0.6) return 0;
  var a = kb.c0 - 1, b = kb.c1 + 2; if (x <= a || x >= b) return 0;
  var u = (x - a) / (b - a); return HUMP * (1 - Math.cos(u * Math.PI * 2)) / 2;
};
function drawKBridge(ctx, X, Y, cs, t, kb, part) {   // 2.11.5: part 'back' — всё, кроме переднего парапета; 'front' — передний парапет (рисуется поверх идущих по мосту)
  var a = kb.c0 - 1, b = kb.c1 + 2, xa = X(a), xb = X(b), l = Math.max(1.5, cs * 0.05), N = 40, i;
  var lift = function (x) { var u = (x - xa) / (xb - xa); return HUMP * cs * (1 - Math.cos(u * Math.PI * 2)) / 2; };
  var yT = function (x) { return Y(kb.r + 0.06) - lift(x); }, yB = function (x) { return Y(kb.r + 0.94) - lift(x); };
  var xr0 = X(kb.c0), xr1 = X(kb.c1 + 1), yW = Y(kb.r + 1.85);
  var bot = function (x) { var e = Math.min(1, Math.max(0, Math.min(x - xa, xb - x) / (xr0 - xa))); return Y(kb.r + 1.02) + (yW - Y(kb.r + 1.02)) * e; };
  var xs = []; for (i = 0; i <= N; i++) xs.push(xa + (xb - xa) * i / N);
  var path = function (fTop, fBot) { ctx.beginPath(); xs.forEach(function (x, k) { if (k) ctx.lineTo(x, fTop(x)); else ctx.moveTo(x, fTop(x)); }); for (var k = N; k >= 0; k--) ctx.lineTo(xs[k], fBot(xs[k])); ctx.closePath(); };
  var stoneG = function (y0, y1, c0, c1) { var g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
  ctx.save();
  if (part !== 'front') {
  // тень моста на воде
  ctx.globalAlpha = 0.25; ctx.fillStyle = '#1d2c5a'; ctx.fillRect(xr0, yW - cs * 0.1, xr1 - xr0, cs * 0.45); ctx.globalAlpha = 1;
  // задний парапет
  path(function (x) { return yT(x) - cs * 0.3; }, function (x) { return yT(x) + cs * 0.02; }); ctx.fillStyle = stoneG(yT(xa) - cs * 0.3, yT(xa), '#a3a4bb', '#8b8ca6'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  path(function (x) { return yT(x) - cs * 0.36; }, function (x) { return yT(x) - cs * 0.24; }); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.stroke();
  // настил: каменная мостовая со снегом по краям
  path(yT, yB); ctx.fillStyle = stoneG(yT(xa), yB(xa), '#d2d4e3', '#bfc1d4'); ctx.fill();
  ctx.save(); path(yT, yB); ctx.clip(); ctx.strokeStyle = 'rgba(60,70,110,0.22)'; ctx.lineWidth = l * 0.5;
  for (var r = 1; r < 4; r++) { ctx.beginPath(); xs.forEach(function (x, k) { var y = yT(x) + (yB(x) - yT(x)) * r / 4; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke(); }
  for (var j = 0; j <= Math.round((xb - xa) / (cs * 0.34)); j++) for (var r2 = 0; r2 < 4; r2++) { var x = xa + (j + (r2 % 2) * 0.5) * cs * 0.34; if (x > xb) continue; var y0 = yT(x) + (yB(x) - yT(x)) * r2 / 4, y1 = yT(x) + (yB(x) - yT(x)) * (r2 + 1) / 4; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); }
  ctx.globalAlpha = 0.85; ctx.fillStyle = '#ffffff'; ctx.beginPath(); xs.forEach(function (x, k) { if (k) ctx.lineTo(x, yT(x) + cs * 0.12); else ctx.moveTo(x, yT(x) + cs * 0.12); }); for (var k2 = N; k2 >= 0; k2--) ctx.lineTo(xs[k2], yT(xs[k2]) - 1); ctx.fill(); ctx.globalAlpha = 1;
  ctx.restore();
  // фасад с арками (арки — сквозные, в них видна вода)
  ctx.beginPath(); xs.forEach(function (x, k) { if (k) ctx.lineTo(x, yB(x)); else ctx.moveTo(x, yB(x)); }); for (var k3 = N; k3 >= 0; k3--) ctx.lineTo(xs[k3], bot(xs[k3])); ctx.closePath();
  var arches = []; for (var c = kb.c0; c <= kb.c1; c++) { var ax = X(c + 0.5), ar = cs * 0.4, top = yB(ax) + cs * 0.22, ah = Math.max(cs * 0.3, yW - top); arches.push([ax, ar, ah]); ctx.moveTo(ax + ar, yW); ctx.ellipse(ax, yW, ar, ah, 0, 0, Math.PI, true); ctx.closePath(); }
  ctx.fillStyle = stoneG(yB(xa) - cs * 0.4, yW, '#b9b9cc', '#8a8ba4'); ctx.fill('evenodd');
  ctx.save(); ctx.clip('evenodd'); ctx.strokeStyle = 'rgba(38,48,79,0.25)'; ctx.lineWidth = l * 0.5;
  for (var rr = 0; rr < 6; rr++) { var yy = yW - rr * cs * 0.22; ctx.beginPath(); ctx.moveTo(xa, yy); ctx.lineTo(xb, yy); ctx.stroke(); for (var q = 0; q < (xb - xa) / (cs * 0.4); q++) { var qx = xa + (q + (rr % 2) * 0.5) * cs * 0.4; ctx.beginPath(); ctx.moveTo(qx, yy); ctx.lineTo(qx, yy - cs * 0.22); ctx.stroke(); } }
  ctx.restore();
  ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  arches.forEach(function (A) { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.ellipse(A[0], yW, A[1], A[2], 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#1d2c5a'; ctx.fill(); ctx.globalAlpha = 1;
    var r2a = A[1] + cs * 0.1, h2a = A[2] + cs * 0.1; for (var v = 0; v < 7; v++) { var a0 = Math.PI + v * Math.PI / 7, a1 = a0 + Math.PI / 7; ctx.beginPath(); ctx.ellipse(A[0], yW, A[1], A[2], 0, a0, a1); ctx.ellipse(A[0], yW, r2a, h2a, 0, a1, a0, true); ctx.closePath(); ctx.fillStyle = v === 3 ? '#e2e0ea' : v % 2 ? '#b3b3c6' : '#c6c6d6'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke(); } });
  }
  if (part === 'back') { [[xa + cs * 0.08, 0], [xb - cs * 0.08, 0]].forEach(function (P) { kPost(P); }); ctx.restore(); return; }
  // передний парапет — низкий, со снегом и калиной
  path(function (x) { return yB(x) - cs * 0.2; }, function (x) { return yB(x) + cs * 0.08; }); ctx.fillStyle = stoneG(yB(xa) - cs * 0.2, yB(xa), '#cfcfe0', '#a9a9bf'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  path(function (x) { return yB(x) - cs * 0.26 - Math.abs(Math.sin(x * 0.05)) * cs * 0.03; }, function (x) { return yB(x) - cs * 0.14; }); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.stroke();
  for (var kq = 0; kq < kb.c1 - kb.c0 + 3; kq++) { var bx = X(kb.c0 - 0.5 + kq + 0.5), by = yB(bx) - cs * 0.02; if (bx < xa + cs * 0.4 || bx > xb - cs * 0.4) continue; D.ell(bx, by, cs * 0.09, cs * 0.045, '#4c8a4c', l * 0.4); for (var e3 = 0; e3 < 3; e3++) D.circ(bx + (e3 - 1) * cs * 0.05, by + cs * 0.06 + (e3 % 2) * cs * 0.04, cs * 0.045, '#e5323b', l * 0.4); }
  // столбы с фонарями на въездах (передние и задние)
  [[xa + cs * 0.08, 1], [xb - cs * 0.08, 1]].forEach(function (P) { kPost(P); });
  function kPost(P) { var front = P[1], px = P[0], py = front ? yB(px) + cs * 0.08 : yT(px) + cs * 0.02, ph = cs * (front ? 0.62 : 0.5), pw = cs * 0.16;
    D.rr(px - pw / 2, py - ph, pw, ph, pw * 0.15); ctx.fillStyle = '#a9a9bd'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); D.ell(px, py - ph, pw * 0.65, pw * 0.3, '#ffffff', l * 0.7);
    var gl = 0.55 + 0.25 * Math.sin(t * 3 + px); ctx.globalAlpha = 0.28 * gl; D.circ(px, py - ph - pw * 0.7, pw * 1.7, '#ffd27a'); ctx.globalAlpha = 1; D.rr(px - pw * 0.3, py - ph - pw * 1.05, pw * 0.6, pw * 0.62, pw * 0.12); ctx.fillStyle = '#ffd27a'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke(); }
  // кусты калины у въездов
  [[xa - cs * 0.2], [xb + cs * 0.2]].forEach(function (P) { var bx = P[0], by = Y(kb.r + 1.05), s = cs * 0.42, lv = ['#3f7a4a', '#5a9a52', '#4c8a4c']; for (var q2 = 0; q2 < 5; q2++) { var qa = -0.3 - q2 * 0.6; D.ell(bx + Math.cos(qa) * s * 0.5, by + Math.sin(qa) * s * 0.35, s * 0.42, s * 0.26, lv[q2 % 3], l * 0.6); }
    for (var b2 = 0; b2 < 3; b2++) { var cx2 = bx + (b2 - 1) * s * 0.42, cy2 = by - s * (0.15 + (b2 % 2) * 0.2); for (var e4 = 0; e4 < 4; e4++) D.circ(cx2 + (e4 % 2 - 0.5) * s * 0.2, cy2 + Math.floor(e4 / 2) * s * 0.17 + (e4 % 2) * s * 0.05, s * 0.12, '#e5323b', l * 0.45); } });
  ctx.restore();
}
// 2.12: мост — готовыми кадрами (v30o): камень не перерисовывается, фонари мигают по фазам
function kbDraw(ctx, X, Y, cs, t, kb, part) {
  if (Z.sceneAnim) Z.sceneAnim('kb' + part, t, Math.PI * 2, Z.scenePhases(24, 16, 12), function (tq) { drawKBridge(D.ctx, X, Y, cs, tq, kb, part); });
  else drawKBridge(ctx, X, Y, cs, t, kb, part);
}
Z._kbFront = function (ctx, X, Y, cs, t, kb) { var prev = D.ctx; D.setCtx(ctx); kbDraw(ctx, X, Y, cs, t, kb, 'front'); D.setCtx(prev); };
var oUnder = Z.drawUnder;
Z.drawUnder = function (ctx, X, Y, cs, t) {
  if (oUnder) oUnder.apply(this, arguments);
  var G = Z.G, kb = G && G.L.kb; if (!kb) return;
  var prev = D.ctx; D.setCtx(ctx);
  if (!Z._kbLate) { try { kbDraw(ctx, X, Y, cs, t, kb, 'back'); } catch (e) { if (window.__rep) window.__rep(e); } }   // 2.11.5: при v30g мост рисуется после воды и каустик
  D.setCtx(prev);
};
Z._kbBack = function (ctx, X, Y, cs, t, kb) { var prev = D.ctx; D.setCtx(ctx); try { kbDraw(ctx, X, Y, cs, t, kb, 'back'); } catch (e) { if (window.__rep) window.__rep(e); } D.setCtx(prev); };

// ---------- подводка к бою: замедление, кинополосы, наезд камеры, реплики, «диафрагма» ----------
var CINE_LEN = 11;
function vtext(id) { if (Z.LANG === 'en' && Z.VLEN && Z.VLEN[id]) return Z.VLEN[id]; return Z.VL && Z.VL[id] ? Z.VL[id][1] : ''; }
function irisDraw(c, W, H, x, y, k) { var R = Math.hypot(W, H) * k; c.save(); c.beginPath(); c.rect(0, 0, W, H); c.arc(x, y, Math.max(0.1, R), 0, Math.PI * 2, true); c.fillStyle = '#05070f'; c.fill(); c.restore(); }
function cineStart(G, e) {
  if (G.cine || G.duelDone) return;
  G.cine = { t: 0, e: e, said: 0 };
  G.cineSave = { cam: { z: UI.cam.z, px: UI.cam.px, py: UI.cam.py }, ts: Z.timeScale === undefined ? 1 : Z.timeScale };
  UI.menu = null; UI.sel = null; UI.heroSel = false; UI.aim = null;
  G.cineSave.subs = Z.save.subs; Z.save.subs = false;
  G.shake = Math.max(G.shake || 0, 0.6); sfx('dragon_roar', 1);
  if (UI.modal && UI.modal.type !== 'duel') UI.closeModal();
}
function cineFrame(c, w, h, G) {
  var dt = Math.min(0.05, Z.frameDt || 0.016), S = UI.api().S || 1, L = UI.L;
  if (G.cine) {
    var q = G.cine, e = q.e; q.t += dt;
    Z.timeScale = Math.max(0.18, 1 - q.t * 2);
    // Пломбир выходит на мост навстречу Змею
    // 2.11.5: Пломбир входит из-за края экрана (раньше возникал посреди кадра)
    if (q.t > 1.7 && q.px0 == null && L && L.cs) { q.px0 = Math.max(e.x + 5.5, e.x + (w + L.cs * 0.8 - UI.X(e.x)) / L.cs); }
    var pT = Math.min(1, Math.max(0, (q.t - 1.7) / 1.5)), px0 = q.px0 != null ? q.px0 : e.x + 5.5, pxT = e.x + 2.1, pX = px0 + (pxT - px0) * (1 - Math.pow(1 - pT, 2)), pY = e.y, show = q.t > 1.7;
    // наезд камеры: сперва на Змея, потом — на обоих
    if (L && L.cs && q.t < CINE_LEN) { var k = 1 - Math.exp(-dt * 3), zt = Math.min(3.2, Math.max(2.3, UI.cam.z)), fx = show ? (e.x + pX) / 2 : e.x, ex0 = UI.X(fx), ey0 = UI.Y(e.y);
      UI.zoomAt(UI.cam.z + ((show ? zt * 0.9 : zt) - UI.cam.z) * k, ex0, ey0);
      var ex1 = UI.X(fx), ey1 = UI.Y(e.y); UI.cam.px += (w / 2 - ex1) * k; UI.cam.py += (h * 0.64 - ey1) * k; UI.applyCam(); }
    e.dir = 1;
    if (q.said === 0 && q.t > 0.45) { q.said = 1; q.l1 = vtext('M7-02'); q.l1t = q.t; try { Z.playLine('M7-02', function () { q.l1e = q.t; }); } catch (er) { if (window.__rep) window.__rep(er); } }
    if (q.said === 1 && q.t > 2.9) { q.said = 2; q.l2 = vtext('M7-09'); q.l2t = q.t; try { Z.playLine('M7-09', function () { q.l2e = q.t; }); } catch (er) { if (window.__rep) window.__rep(er); } }
    var cs = L.cs, sx = UI.X(e.x), sy = UI.Y(e.y);
    if (show) { var walk = pT < 1, lf = Z.liftAt ? Z.liftAt(pX, pY) : 0; D.ally('plombir', UI.X(pX), UI.Y(pY - lf), cs * 0.4 * 1.55, { dir: -1, walk: walk }); }
    var bh = h * 0.12 * ease(Math.min(1, q.t / 0.45));
    c.fillStyle = '#05070f'; c.fillRect(0, 0, w, bh); c.fillRect(0, h - bh, w, bh);
    var bub = function (txt, ax, ay, col, a) { if (!txt || a <= 0) return; var fs = Math.max(13, 17 * S), lines = D.wrap(txt, Math.min(w * 0.62, 340 * S), fs); C().font = D.font(fs);
      var bw = 26 * S + Math.max.apply(null, lines.map(function (l2) { return C().measureText(l2).width; })), bh2 = 16 * S + lines.length * fs * 1.25, bx = Math.max(8, Math.min(w - bw - 8, ax - bw / 2)), by = Math.max(bh + 8 * S, ay - bh2 - 14 * S);
      c.globalAlpha = a; D.rr(bx, by, bw, bh2, 14 * S); c.fillStyle = col; c.fill(); c.lineWidth = 3 * S; c.strokeStyle = OL; c.stroke(); var tx2 = Math.max(bx + 16 * S, Math.min(bx + bw - 16 * S, ax));
      D.poly([tx2 - 9 * S, by + bh2 - 1, tx2 + 9 * S, by + bh2 - 1, tx2, by + bh2 + 13 * S], col, 0); lines.forEach(function (ln, j) { D.text(ln, bx + bw / 2, by + 8 * S + fs * 0.62 + j * fs * 1.25, fs, OL, 'center', 'middle', 0); }); c.globalAlpha = 1; };
    var fade = function (t0, t1) { return Math.min(1, (q.t - t0) * 5) * (t1 ? Math.max(0, 1 - (q.t - t1) / 0.35) : 1); };
    if (q.l1) bub(q.l1, sx, sy - cs * 2.9, '#fff6e0', fade(q.l1t, q.l2t || q.l1e));
    if (q.l2) bub(q.l2, UI.X(pX), UI.Y(pY) - cs * 1.5, '#eaf8ff', fade(q.l2t, q.l2e ? q.l2e + 0.6 : 0));
    var nm = q.t < 2.9 ? TT('Змей Горыныч', 'Zmey Gorynych') : TT('Пломбир, рыцарь Вечной Мерзлоты', 'Plombir, Knight of the Eternal Frost');
    c.globalAlpha = Math.min(1, q.t * 3); D.text(nm, w / 2, h - bh / 2, D.fitText(nm, w * 0.8, Math.max(16, 24 * S)), '#ffe066', 'center', 'middle', 0); c.globalAlpha = 1;
    if (q.said === 2 && q.l2e && q.t < CINE_LEN && q.t > q.l2e + 0.7) q.t = CINE_LEN;   // реплика кончилась — сразу в бой
    if (q.t >= CINE_LEN) { var ck = (q.t - CINE_LEN) / 0.5; irisDraw(c, w, h, sx, sy - L.cs * 1.2, 1 - ease(ck));
      if (ck >= 1) { G.cine = null; G.cineDone = { x: sx, y: sy }; if (G.cineSave) Z.save.subs = G.cineSave.subs; Z.duelStart(e); } }
    else if (q.t > 0.9) { c.globalAlpha = 0.5 + 0.3 * Math.sin(q.t * 4); D.text(TT('нажми — пропустить', 'tap to skip'), w - 12 * S, bh * 0.5, Math.max(11, 12 * S), '#ffffff', 'right', 'middle', 0); c.globalAlpha = 1; }
    return;
  }
  if (G.cineOut) {
    var o = G.cineOut; if (o.t === 0 && G.cineSave) { UI.cam = { z: G.cineSave.cam.z, px: G.cineSave.cam.px, py: G.cineSave.cam.py }; UI.applyCam(); Z.timeScale = G.cineSave.ts; }
    o.t += dt; var kk2 = Math.min(1, o.t / 0.6), bh2 = h * 0.12 * (1 - ease(kk2));
    irisDraw(c, w, h, w / 2, h / 2, easeOut(kk2)); c.fillStyle = '#05070f'; c.fillRect(0, 0, w, bh2); c.fillRect(0, h - bh2, w, bh2);
    if (kk2 >= 1) G.cineOut = null;
  }
}
// Горыныч всегда заходит слева — чтобы пройти через мост
var oUpd2 = Z.update;
Z.update = function (dt) {
  var G = Z.G;
  if (G && G.L && G.L.kb && !inDuel()) G.enemies.forEach(function (e) { if (e.type === 'gorynych' && !e.kbIn && (e.age || 0) < 0.5) { e.kbIn = true; var en = G.L.entrances[e.x < G.L.kb.c0 ? 0 : 1] || G.L.entrances[0]; if (e.x > G.L.kb.c1) { e.x = en[0] + 0.5; e.y = en[1] === 0 ? -0.3 : en[1] + 0.5; if (en[0] === 0) e.x = -0.3; } } });
  var r = oUpd2.apply(this, arguments);
  G = Z.G;
  if (G && !inDuel() && !G.cine && G.phase !== 'won' && G.phase !== 'lost') G.enemies.forEach(function (e) {
    if (e.type !== 'gorynych' || e.dead || (e.headsLost || 0) >= 1) return;
    e.fireT = (e.fireT === undefined ? 4 : e.fireT) - dt; if (e.fireT > 0) return; e.fireT = 6.5;
    var best = null, bd = 4.5; for (var k in G.towers) { var tw = G.towers[k], dd = Math.hypot(tw.c + 0.5 - e.x, tw.r + 0.5 - e.y); if (dd < bd) { bd = dd; best = tw; } }
    if (!best) return;
    G.fx.push({ k: 'v_breath', x: e.x + 0.6, y: e.y - 1.7, tx: best.c + 0.5, ty: best.r + 0.5, col: '#ff8a3d', t: 0, dur: 0.9 });
    G.fx.push({ k: 'v_breath', x: e.x + 0.6, y: e.y - 1.7, tx: best.c + 0.5, ty: best.r + 0.4, col: '#ffd060', t: -0.08, dur: 0.8 });
    G.fx.push({ k: 'boom', x: best.c + 0.5, y: best.r + 0.4, t: -0.3, dur: 0.5 });
    try { Z.damageTower(best, (best.max || 100) * 0.3); } catch (er) { if (window.__rep) window.__rep(er); }
    sfx('big_boom', 0.4); if (Z.sayLine && Math.random() < 0.35) Z.sayLine('GOR-02', 0.7);
  });
  return r;
};

// для тестов
Z.duelState = function () { return DU; };
})();

// 2.11.5: передний парапет — поверх тех, кто идёт по мосту (ноги за парапетом); по мосту идут посередине настила, не по краю
(function () {
  var Z = window.Z, D = Z.D;
  var oO = Z.drawObjs;
  Z.drawObjs = function (objs, X, Y, cs, t) { if (oO) oO.apply(this, arguments); var G = Z.G, kb = G && G.L && G.L.kb; if (!kb) return; objs.push({ y: kb.r + 0.97, f: function () { var p = D.ctx; try { Z._kbFront(D.ctx, X, Y, cs, t, kb); } catch (e) { if (window.__rep) window.__rep(e); } D.setCtx(p); } }); };
  var oU = Z.update;
  Z.update = function (dt) { oU.apply(this, arguments); var G = Z.G, kb = G && G.L && G.L.kb; if (!kb) return;
    var lo = kb.r + 0.28, hi = kb.r + 0.6, a = kb.c0 - 1, b = kb.c1 + 2;
    (G.enemies || []).concat(G.squad || []).forEach(function (u) { if (!u || u.dead || u.air || u.x <= a || u.x >= b || Math.abs(u.y - (kb.r + 0.5)) > 0.75) return; if (u.y < lo) u.y += Math.min(lo - u.y, dt * 2); else if (u.y > hi) u.y -= Math.min(u.y - hi, dt * 2); }); };
  var oT = Z.canTrapCell; Z.canTrapCell = function (c, r) { var G = Z.G, kb = G && G.L && G.L.kb; if (kb && r === kb.r && c >= kb.c0 - 1 && c <= kb.c1 + 1) return false; return oT.apply(this, arguments); };
  var oB = Z.canBarricade; if (oB) Z.canBarricade = function (c, r) { var G = Z.G, kb = G && G.L && G.L.kb; if (kb && r === kb.r && c >= kb.c0 - 1 && c <= kb.c1 + 1) return false; return oB.apply(this, arguments); };
})();
