/* 2.6i · настоящая ночь со светом, избушка на курьих ножках, атаки Бабы-Яги, фонарь и петарды на карте */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = D.OL;
function c() { return D.ctx; }
function TT(r, e) { return Z.lang === 'en' ? e : r; }
function ease(p) { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); }

// ---------- синтез звуков ----------
var SMP = { cluck: 'hut_cluck', bawk: 'hut_bawk', creak: 'hut_creak', stomp: 'hut_land', steps: 'hut_steps' };
function snd(kind, vol, raw) {
  var AU = Z.AU; if (!AU || !AU.ctx || !AU.running || !AU.running()) return;
  // записанные звуки избушки (ElevenLabs), синтез — запасной вариант, пока пачка не загрузилась
  var sm = SMP[kind]; if (sm && AU.bufs && AU.bufs[sm]) { if (raw && AU.raw) AU.raw(sm, Math.min(1, (vol || 0.4) * 1.6)); else AU.sfx(sm, Math.min(1, (vol || 0.4) * 1.6)); if (kind !== 'stomp') return; }
  if (kind === 'steps') return;
  try {
    var ac = AU.ctx, t0 = ac.currentTime, out = ac.createGain(); out.gain.value = vol || 0.4; out.connect(AU.master);
    var noise = function (d) { var b = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * d)), ac.sampleRate), a = b.getChannelData(0); for (var i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; var n = ac.createBufferSource(); n.buffer = b; return n; };
    var env = function (st, a, d, pk) { var g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0 + st); g.gain.exponentialRampToValueAtTime(pk || 1, t0 + st + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + st + a + d); g.connect(out); return g; };
    var filt = function (type, f, q) { var b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 1; return b; };
    var nz = function (st, d, type, f, q, a, dd, pk, f2) { var n = noise(d), b = filt(type, f, q); if (f2) b.frequency.exponentialRampToValueAtTime(f2, t0 + st + d); n.connect(b); b.connect(env(st, a, dd, pk)); n.start(t0 + st); n.stop(t0 + st + d + 0.05); };
    var osc = function (st, type, f1, f2, a, d, pk, fl) { var o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f1, t0 + st); o.frequency.exponentialRampToValueAtTime(f2, t0 + st + a + d); var g = env(st, a, d, pk); if (fl) { var b = filt('bandpass', fl, 3); o.connect(b); b.connect(g); } else o.connect(g); o.start(t0 + st); o.stop(t0 + st + a + d + 0.05); };
    if (kind === 'cluck') { var n = 2 + Math.floor(Math.random() * 2); for (var i = 0; i < n; i++) { var s = i * 0.13, f = 640 + Math.random() * 120 - i * 40; osc(s, 'sawtooth', f, f * 0.62, 0.008, 0.07, 0.9, 1300); osc(s, 'square', f * 0.5, f * 0.33, 0.006, 0.05, 0.25, 800); } }
    else if (kind === 'bawk') { osc(0, 'sawtooth', 520, 900, 0.03, 0.16, 0.9, 1500); osc(0.17, 'sawtooth', 900, 420, 0.01, 0.22, 0.8, 1200); }
    else if (kind === 'creak') { osc(0, 'sawtooth', 85 + Math.random() * 30, 150, 0.08, 0.35, 0.7, 700); nz(0, 0.4, 'bandpass', 900, 6, 0.05, 0.3, 0.25); }
    else if (kind === 'thud') { osc(0, 'sine', 110, 38, 0.005, 0.28, 1); nz(0, 0.2, 'lowpass', 380, 0.8, 0.004, 0.16, 0.7); }
    else if (kind === 'stomp') { osc(0, 'sine', 90, 28, 0.004, 0.55, 1); nz(0, 0.5, 'lowpass', 500, 0.7, 0.004, 0.45, 1); nz(0.02, 0.6, 'bandpass', 260, 1, 0.02, 0.5, 0.6, 120); }
    else if (kind === 'thwack') { nz(0, 0.14, 'bandpass', 1800, 1.2, 0.002, 0.11, 1); osc(0, 'triangle', 240, 70, 0.003, 0.14, 0.8); nz(0.02, 0.3, 'highpass', 3000, 0.7, 0.01, 0.25, 0.35); }
    else if (kind === 'swing') nz(0, 0.32, 'bandpass', 500, 1.5, 0.08, 0.22, 0.9, 2400);
    else if (kind === 'glass') { for (var g = 0; g < 5; g++) osc(g * 0.025, 'sine', 2400 + Math.random() * 2600, 1800 + Math.random() * 1000, 0.002, 0.12 + Math.random() * 0.1, 0.35); nz(0, 0.25, 'highpass', 3500, 0.7, 0.002, 0.2, 0.8); nz(0.04, 0.35, 'bandpass', 700, 1, 0.02, 0.3, 0.5); }
    else if (kind === 'door') { osc(0, 'sawtooth', 160, 260, 0.1, 0.4, 0.5, 900); }
  } catch (err) { if (window.__rep) window.__rep(err); }
}
Z.nsnd = snd;

// ---------- фонарь и петарды на карте (раньше не рисовались) ----------
var oldTrap = D.trap;
D.trap = function (tr, x, y, cs, t) {
  var ctx = c(), l = Math.max(1, cs * 0.035);
  if (tr.type === 'lamp') {
    D.ell(x, y + cs * 0.14, cs * 0.2, cs * 0.07, 'rgba(30,40,80,0.25)');
    ctx.strokeStyle = OL; ctx.lineWidth = l * 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y + cs * 0.12); ctx.lineTo(x, y - cs * 0.62); ctx.lineTo(x + cs * 0.16, y - cs * 0.62); ctx.stroke();
    ctx.strokeStyle = '#5a4030'; ctx.lineWidth = l * 1.2; ctx.beginPath(); ctx.moveTo(x, y + cs * 0.12); ctx.lineTo(x, y - cs * 0.62); ctx.lineTo(x + cs * 0.16, y - cs * 0.62); ctx.stroke();
    var lx = x + cs * 0.16, ly = y - cs * 0.48, fl = 0.85 + 0.15 * Math.sin(t * 9 + x) * Math.sin(t * 5.3);
    ctx.globalAlpha = 0.35 * fl; D.circ(lx, ly, cs * 0.3, '#ffd27a'); ctx.globalAlpha = 1;
    D.rr(lx - cs * 0.09, ly - cs * 0.12, cs * 0.18, cs * 0.22, cs * 0.04); ctx.fillStyle = 'rgb(255,' + Math.round(200 + 30 * fl) + ',110)'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    D.poly([lx - cs * 0.11, ly - cs * 0.12, lx, ly - cs * 0.2, lx + cs * 0.11, ly - cs * 0.12], '#3d3d3d', l * 0.8);
    D.circ(lx, ly, cs * 0.04 * fl, '#fffbe8');
    return;
  }
  if (tr.type === 'fw') {
    D.ell(x, y + cs * 0.14, cs * 0.24, cs * 0.08, 'rgba(30,40,80,0.25)');
    D.rr(x - cs * 0.2, y - cs * 0.06, cs * 0.4, cs * 0.2, cs * 0.03); ctx.fillStyle = '#9a6a3a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    var cols = ['#e8484f', '#4aa3ff', '#ffd54a', '#4cc77d'];
    for (var i = 0; i < 4; i++) { var rx = x - cs * 0.14 + i * cs * 0.093, h = cs * (0.22 + (i % 2) * 0.06); D.rr(rx - cs * 0.035, y - cs * 0.06 - h, cs * 0.07, h, cs * 0.02); ctx.fillStyle = cols[i]; ctx.fill(); ctx.stroke(); D.poly([rx - cs * 0.04, y - cs * 0.06 - h, rx, y - cs * 0.12 - h, rx + cs * 0.04, y - cs * 0.06 - h], '#fff', l * 0.6); }
    ctx.strokeStyle = '#3d3d3d'; ctx.lineWidth = l * 0.7; ctx.beginPath(); ctx.moveTo(x + cs * 0.2, y + cs * 0.04); ctx.quadraticCurveTo(x + cs * 0.32, y, x + cs * 0.3, y - cs * 0.1); ctx.stroke();
    return;
  }
  return oldTrap(tr, x, y, cs, t);
};

// ---------- ночь ----------
function nightLevel(G) { var wx = G.v26 && G.v26.wx || G.weather; return wx === 'night' || wx === 'dark' || G.weather === 'night' || G.weather === 'dark' || G.mech === 'lights' || G.mech === 'dark'; }
function darkness(G) { if (G.dayK !== undefined) return 0.91; /* 2.11.5: бесконечный режим — своя смена дня и ночи */ var wx = G.v26 && G.v26.wx || G.weather; if (G.weather === 'night' || G.weather === 'dark') wx = G.weather; /* 2.10.3: ночь не пропадает от смены погоды на карте */ if (wx === 'dark' || G.mech === 'dark') return 0.94; if (wx === 'night') return 0.91; if (G.mech === 'lights') return 0.86; if (wx === 'dusk') return 0.3; if (wx === 'storm') return 0.22; return 0; }
var FXL = { boom: 3, v_big: 2.6, v_fw: 2.2, v_salute: 2.6, v_barrel: 3, ring: 1.3, frost: 1.4, v_mushroom: 2.6, big: 2.6, deb: 0, nflash: 1 };
// список источников света за кадр: [x, y, r, тёплый]
function collectLights(G) {
  var Ls = [], L = G.L, t = Z.time || 0;
  if (L.fort && L.type !== 'escort') Ls.push([L.fort[0] + 0.5, L.fort[1] - 0.2, 3.2 * (1 + 0.04 * Math.sin(t * 3)), 1]);
  if (L.landmark) Ls.push([L.landmark.c + 1, L.landmark.r + 1, 2.8, 1]);
  (G.fires || []).forEach(function (f) { Ls.push([f.x, f.y, 2.4 * (0.92 + 0.08 * Math.sin(t * 11 + f.x)), 1]); });
  for (var k in G.towers) { var tw = G.towers[k]; Ls.push([tw.c + 0.5, tw.r + 0.3, 1.1 + 0.25 * (tw.lvl - 1) + (tw.firing ? 0.3 + 0.2 * Math.sin(t * 40) : 0), 1]); }
  for (var tk in G.traps) { var tr = G.traps[tk]; if (tr.type === 'lamp') Ls.push([tr.c + 0.66, tr.r + 0.1, 3.2, 1]); }
  (G.squad || []).forEach(function (U) { if (!U.dead) Ls.push([U.x, U.y - 0.3, U.type === 'sneg' || U.type === 'moroz' || U.type === 'emelya' ? 1.45 : 0.85, 0]); });
  if (L.type === 'escort' && Z.sleighPos) { var p = Z.sleighPos(); Ls.push([p.x, p.y, 3.2, 1]); }
  G.shots.forEach(function (s) { if (s.k === 'esnow' || s.k === 'ebomb') return; if (s.x !== undefined) Ls.push([s.x, s.y, 0.65, 1]); });
  G.fx.forEach(function (f) { var r = FXL[f.k]; if (!r || f.t < 0 || f.x === undefined) return; var p = Math.min(1, f.t / (f.dur || 1)); Ls.push([f.x, f.y, r * (f.r ? Math.max(1, f.r * 0.8) : 1) * (1 - p * 0.7), 1, 1 - p]); });
  (G.pots || []).forEach(function (q) { Ls.push([q.x, q.y, 0.9, 0]); });
  if (G.hut) Ls.push([G.hut.x + 0.1, G.hut.y - 0.7, G.hut.turnT > 0 ? 0.6 : 1.5, 1]);
  (G.enemies || []).forEach(function (e) { if (!e.dead && (e.type === 'gorynych' || e.type === 'koschei') && e.boss) Ls.push([e.x, e.y - 0.5, 1.8, 1]); });
  return Ls;
}
function litBy(Ls, x, y, k) { for (var i = 0; i < Ls.length; i++) { var q = Ls[i], dx = q[0] - x, dy = q[1] - y, r = q[2] * k; if (dx * dx + dy * dy < r * r) return true; } return false; }
function belkaSees(G, e) { return (G.squad || []).some(function (U) { return U.type === 'belka' && !U.dead && Math.hypot(U.x - e.x, U.y - e.y) < 3; }); }
// башни во тьме бьют только вблизи — засвеченного врага видят на полную
Z.hk.unseen = function (e) { var G = Z.G; return !!(G && G.night && !(e.spotT > 0) && !e.boss && !belkaSees(G, e)); };
function nightTick(G, dt) {
  if (G.night === undefined) { G.night = nightLevel(G); if (G.night) G.nightHintT = 4.2; }
  if (!G.night) return;
  if (G.nightHintT > 0) { G.nightHintT -= dt; if (G.nightHintT <= 0) { if (!G.banner) G.banner = { text: TT('Ночь', 'Night'), sub: TT('Во тьме башни видят только вблизи. Фонари, костры и выстрелы освещают путь', 'In the dark towers only see up close. Lanterns, fires and shots light the way'), t: 3.4 }; else G.nightHintT = 1; } }
  G.spotTk = (G.spotTk || 0) - dt; if (G.spotTk > 0) { G.enemies.forEach(function (e) { if (e.spotT > 0) e.spotT -= dt; }); return; }
  var step = 0.15 - G.spotTk; G.spotTk = 0.15;
  var Ls = collectLights(G);
  G.enemies.forEach(function (e) { if (e.dead) return; if (e.spotT > 0) e.spotT -= step; if (litBy(Ls, e.x, e.y, 0.85)) e.spotT = 1.5; });
}
var oldDmg = Z.hk.dmg;
Z.hk.dmg = function (e, real, opts) { var r = oldDmg ? oldDmg(e, real, opts) : real; if (r > 0) e.spotT = Math.max(e.spotT || 0, 1.5); return r; };

var warmSpr = null, coolSpr = null;
function mkSpr(c0, c1) {
  var cv = document.createElement('canvas'); cv.width = cv.height = 128; var g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(' + c0 + ',1)'); gr.addColorStop(0.3, 'rgba(' + c0 + ',0.8)'); gr.addColorStop(0.65, 'rgba(' + c1 + ',0.25)'); gr.addColorStop(1, 'rgba(' + c1 + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return cv;
}
function sprites() { if (warmSpr) return; warmSpr = mkSpr('255,214,150', '200,170,110'); coolSpr = mkSpr('205,220,255', '140,160,210'); }
// освещение умножением: тьма окрашивает всё в ночной синий, огни — тёплые пятна
// целые пиксели: иначе на стыке тьмы поля и тьмы фона видна светлая полоска
// где у рисунка врага глаза: рисуем его в пустой холст через «записывающий» контекст и ловим белые круги
var eyeCv = null, eyeCtx = null;
function eyeSpots(e, x, y, cs, t) {
  if (!eyeCv) { eyeCv = document.createElement('canvas'); eyeCv.width = eyeCv.height = 2; eyeCtx = eyeCv.getContext('2d'); }
  var real = D.ctx, rec = [], path = [];
  var P = new Proxy(eyeCtx, {
    get: function (o, k) {
      if (k === 'beginPath') return function () { path = []; o.beginPath(); };
      if (k === 'arc') return function (ax, ay, r) { var m = o.getTransform(); path.push([m.a * ax + m.c * ay + m.e, m.b * ax + m.d * ay + m.f, Math.abs(r * m.a)]); return o.arc.apply(o, arguments); };
      if (k === 'ellipse') return function (ax, ay, rx, ry) { var m = o.getTransform(); path.push([m.a * ax + m.c * ay + m.e, m.b * ax + m.d * ay + m.f, Math.abs(Math.min(rx, ry) * m.a), Math.abs(Math.max(rx, ry) / Math.max(1e-3, Math.min(rx, ry)))]); return o.ellipse.apply(o, arguments); };
      if (k === 'fill') return function () { var f = String(o.fillStyle).toLowerCase(); if (path.length === 1 && (f === '#ffffff' || f === '#fff' || f === 'white' || f === '#fffef8' || f === '#fffdf5')) rec.push(path[0]); return o.fill.apply(o, arguments); };
      var v = o[k]; return typeof v === 'function' ? v.bind(o) : v;
    },
    set: function (o, k, v) { o[k] = v; return true; }
  });
  var m0 = real.getTransform();
  eyeCtx.setTransform(m0); eyeCtx.globalAlpha = 1;
  D.setCtx(P);
  try { D.enemy(e, x, y, cs, t); } catch (err) { if (window.__rep) window.__rep(err); }
  D.setCtx(real);
  var dpr = Math.hypot(m0.a, m0.b) || 1, R = cs * dpr * (e.size || 1), yDev = m0.b * x + m0.d * y + m0.f;
  var c = rec.filter(function (q) { return q[2] > R * 0.012 && q[2] < R * 0.1 && (!q[3] || q[3] < 1.8) && q[1] < yDev - R * 0.12; });
  // глаза — пары кругов на одной высоте и близко друг к другу; блики внутри зрачков отбрасываем
  var out = [];
  c.forEach(function (a, i) {
    if (out.some(function (b) { return Math.hypot(a[0] - b[0], a[1] - b[1]) < Math.max(a[2], b[2]); })) return;
    var pair = c.some(function (b, j) { return j !== i && Math.abs(a[1] - b[1]) < Math.max(a[2], b[2]) * 1.2 && Math.abs(a[0] - b[0]) > Math.max(a[2], b[2]) * 1.2 && Math.abs(a[0] - b[0]) < R * 0.45 && b[2] > a[2] * 0.6 && b[2] < a[2] * 1.6; });
    if (pair) out.push(a);
  });
  out.sort(function (a, b) { return b[2] - a[2]; });
  return out.slice(0, 4).filter(function (a, i, arr) { return a[2] > arr[0][2] * 0.6; });
}
// 2.8: разбор рисунка дорогой — делаем его раз в ~0,4 с на врага, а между разами просто сдвигаем найденные глаза вслед за ним
function eyeSpotsCached(e, x, y, cs, t) {
  var m = D.ctx.getTransform(), dx = m.a * x + m.c * y + m.e, dy = m.b * x + m.d * y + m.f, c = e._eye;
  if (!c || t - c.t > (Z.perfLite && Z.perfLite() ? 0.9 : 0.4) + (e.ph || 0) % 0.1 || t < c.t || Math.abs(c.cs - cs) > cs * 0.04) {   // 2.11.5: на телефоне глаза пересчитываются реже
    var sp = eyeSpots(e, x, y, cs, t); c = e._eye = { t: t, cs: cs, dx: dx, dy: dy, s: sp };
    return sp;
  }
  var ox = dx - c.dx, oy = dy - c.dy;
  return c.s.map(function (q) { return [q[0] + ox, q[1] + oy, q[2], q[3]]; });
}
Z.eyeSpots = eyeSpots;
function nightRect(L, OM) { var x0 = Math.round(L.fx - OM.x), y0 = Math.round(L.fy - OM.t), x1 = Math.round(L.fx + L.BW + OM.x), y1 = Math.round(L.fy + L.BH + OM.b); return [x0, y0, x1 - x0, y1 - y0]; }
// ночь и вокруг поля: фон экрана тоже в темноте, а не дневной снег
Z.drawNightOuter = function (ctx, G, L, cs) {
  var eve = !G.night && !(G.dayK >= 0.02) && !!(Z.save && Z.save.eveLight); if (eve && !Z._eveAmb) Z._eveAmb = AMB_EVE[(G.info && G.info.region) || 0] || AMB_EVE[0];   // вечерний свет: фон вокруг поля в том же тоне
  if (!eve && (!(G.dayK !== undefined ? G.dayK >= 0.02 : G.night) || !Z._nightAmb || !darkness(G))) return;
  var OM = Z.ui.objMargin(cs), v = L.vp;
  ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgb(' + (eve ? Z._eveAmb : Z._nightAmb).join(',') + ')';
  // вне рамки поля темно всё; внутри рамки темноту даёт ночной слой (он обрезан той же скруглённой рамкой) — без светлой каймы
  var F = Z.ui.frame ? Z.ui.frame() : { x: L.fx, y: L.fy, w: L.BW, h: L.BH, r: 0 }, x = F.x, y = F.y, w = F.w, h = F.h, r = Math.max(0, Math.min(F.r, w / 2, h / 2));
  // 2.7.10: всё, что вне области поля (боковые полосы экрана), — темно целиком, даже если рамка поля туда заходит при перетаскивании
  ctx.beginPath(); ctx.rect(-4, -4, (Z.W || v.w) + 8, (Z.H || v.h) + 8); ctx.rect(v.x, v.y, v.w, v.h); ctx.fill('evenodd');
  ctx.beginPath(); ctx.rect(v.x, v.y, v.w, v.h); ctx.clip();
  ctx.beginPath(); ctx.rect(v.x - 2, v.y - 2, v.w + 4, v.h + 4);
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  ctx.fill('evenodd'); ctx.restore();
};
// ---------- 2.7c: вечерний свет на обычных уровнях ----------
// Снег уходит в мягкую голубую тень, а вокруг ёлки, окон домов, вышек, героев, костров и выстрелов — светло и тепло.
// Та же карта света, что и ночью, только воздух светлый: врагов видно всегда, на игру не влияет. Слабым устройствам отключается само.
var AMB_EVE = [[186, 200, 240], [196, 198, 236], [176, 204, 238], [190, 194, 232], [178, 190, 242]];
function houseLights(G) { if (G._hl) return G._hl; var a = [], L = G.L; for (var r = 0; r < L.H; r++) for (var c = 0; c < L.W; c++) if (L.grid[r][c] === 8) a.push([c + 0.5, r + 0.5, 1.35, 1]); if (L.greatWall && L.fort) for (var tc = 0.8; tc < L.W; tc += 1.7) if (Math.abs(tc - L.fort[0] - 0.5) > 1.6) a.push([tc, L.fort[1] + 0.3, 1.15, 1]); return (G._hl = a); }
var eveSlow = 0, eveOff = false, eveLast = 0;   // объявлены выше drawNightOuter по времени выполнения: обе функции вызываются уже после загрузки файла
function evening(ctx, G, L, cs, t, X, Y) {
  if (!(Z.save && Z.save.eveLight) || !Z.ui.frame) return;   // только если игрок сам включил «Вечерний свет» в настройках
  // 2.7.20: автоотключение на медленных кадрах убрано — свет не пропадает сам
  Z._eveAmb = AMB_EVE[G.info.region] || AMB_EVE[0];
  sprites();
  var F = Z.ui.frame(), sc = 0.3, w = Math.max(2, Math.ceil(F.w * sc)), h = Math.max(2, Math.ceil(F.h * sc));
  var cv = Z.eveCan || (Z.eveCan = document.createElement('canvas')); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  var dc = cv.getContext('2d'); dc.globalCompositeOperation = 'source-over'; dc.globalAlpha = 1;
  var amb = AMB_EVE[G.info.region] || AMB_EVE[0]; dc.fillStyle = 'rgb(' + amb.join(',') + ')'; dc.fillRect(0, 0, w, h);
  var Ls0 = collectLights(G), nDyn = Ls0.length, Ls = Ls0.concat(houseLights(G)); dc.globalCompositeOperation = 'lighter'; Z._eveAmb = amb;
  for (var i = 0; i < Ls.length; i++) { var q = Ls[i], r = Math.min(q[2], q[4] !== undefined ? 2 : 9) * cs * sc * 1.35, px = (X(q[0]) - F.x) * sc, py = (Y(q[1]) - F.y) * sc; if (px < -r || py < -r || px > w + r || py > h + r) continue; dc.globalAlpha = (q[4] === undefined ? 1 : Math.max(0, Math.min(1, q[4] * 1.4))) * (q[4] !== undefined ? 0.3 : q[2] >= 2.2 ? 0.48 : i >= nDyn ? 0.55 : 0.38); dc.drawImage(q[3] ? warmSpr : coolSpr, px - r, py - r, r * 2, r * 2); }
  dc.globalAlpha = 1; dc.globalCompositeOperation = 'source-over';
  ctx.save(); Z.ui.frameClip(ctx);
  ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(cv, F.x, F.y, F.w, F.h);
  // тёплое сияние поверх: ёлка, костры, сани, вспышки
  ctx.globalCompositeOperation = 'lighter';
  for (var j = 0; j < Ls.length; j++) { var g = Ls[j]; if (!g[3]) continue; var big = g[2] >= 2.2, house = j >= nDyn; if (!big && !house && g[4] === undefined) continue; var gr = Math.min(g[2], g[4] !== undefined ? 1.8 : 9) * cs * (house ? 1.2 : 1.15); ctx.globalAlpha = (g[4] !== undefined ? 0.07 : big ? (j === 0 && L.fort && L.type !== 'escort' ? 0.12 : 0.06) : house ? 0.17 : 0.06) * (g[4] === undefined ? 1 : Math.max(0, Math.min(1, g[4]))); ctx.drawImage(warmSpr, X(g[0]) - gr, Y(g[1]) - gr, gr * 2, gr * 2); }
  ctx.restore();
}
Z.drawNight = function (ctx, G, L, cs, t, wx, X, Y) {
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';   // 2.10.3: чужая прозрачность не должна делать ночь светлой
  var dk = darkness(G), dyn = G.dayK !== undefined;   // 2.11.5: в бесконечном режиме — смена дня и ночи (G.dayK: 0 — день, 1 — ночь)
  if (dyn ? G.dayK < 0.02 : (!dk || !G.night)) { evening(ctx, G, L, cs, t, X, Y); return false; }   // не ночь — «вечерний свет» (2.7c)
  sprites();
  var OM = Z.ui.objMargin ? Z.ui.objMargin(cs) : { x: 0, t: 0, b: 0 }; // тьма покрывает и выступающие за рамку объекты
  // 2.8.1: слой тьмы — только на видимую часть поля и в размер экрана, а не всего поля в текущем приближении
  // (при сильном зуме на телефоне огромный слой не накладывался — ночь «светлела» при перетаскивании)
  var R0 = nightRect(L, OM), vp = L.vp, vx0 = Math.max(R0[0], Math.floor(vp.x) - 2), vy0 = Math.max(R0[1], Math.floor(vp.y) - 2), vx1 = Math.min(R0[0] + R0[2], Math.ceil(vp.x + vp.w) + 2), vy1 = Math.min(R0[1] + R0[3], Math.ceil(vp.y + vp.h) + 2);
  var amb = dk >= 0.94 ? [20, 24, 52] : dk >= 0.9 ? [30, 38, 80] : [48, 58, 100];
  if (G.auroraOn) amb = [60, 105, 115];
  if (dyn) { var k = G.dayK, dusk = [250, 206, 178], a0 = k < 0.4 ? [255, 255, 255] : dusk, a1 = k < 0.4 ? dusk : amb, u = k < 0.4 ? k / 0.4 : (k - 0.4) / 0.6; amb = [0, 1, 2].map(function (i) { return Math.round(a0[i] + (a1[i] - a0[i]) * u); }); }
  Z._nightAmb = amb;
  var Ls = collectLights(G); G._lights = Ls;
  if (vx1 > vx0 && vy1 > vy0) {
    var VW = vx1 - vx0, VH = vy1 - vy0, sc = Math.min(0.5, 900 / Math.max(VW, VH)), w = Math.max(2, Math.ceil(VW * sc)), h = Math.max(2, Math.ceil(VH * sc));
    var cv = Z.nightCan || (Z.nightCan = document.createElement('canvas'));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    var dc = cv.getContext('2d'); dc.setTransform(1, 0, 0, 1, 0, 0); dc.globalCompositeOperation = 'source-over'; dc.globalAlpha = 1;
    dc.fillStyle = 'rgb(' + amb.join(',') + ')'; dc.fillRect(0, 0, w, h);
    dc.globalCompositeOperation = 'lighter';
    Ls.forEach(function (q) { var r = q[2] * cs * sc * 1.1, px = (X(q[0]) - vx0) * sc, py = (Y(q[1]) - vy0) * sc; if (px < -r || py < -r || px > w + r || py > h + r) return; dc.globalAlpha = q[4] === undefined ? 1 : Math.max(0, Math.min(1, q[4] * 1.4)); dc.drawImage(q[3] ? warmSpr : coolSpr, px - r, py - r, r * 2, r * 2); });
    dc.globalAlpha = 1; dc.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(cv, 0, 0, w, h, vx0, vy0, VW, VH); ctx.restore();
  }
  if (dyn && !G.night) { ctx.globalAlpha = 1; return true; }
  // глаза во тьме: светятся собственные глаза врага — рисунок проигрывается «вхолостую», белки глаз (пары небольших белых кругов) запоминаются и зажигаются
  G.enemies.forEach(function (e) {
    if (e.dead || e.spotT > 0 || e.boss || e.neutral) return;
    var p = Z.enemyPos ? Z.enemyPos(e) : e; if (litBy(Ls, p.x, p.y, 0.75)) return;
    var es = eyeSpotsCached(e, X(p.x), Y(p.y - (e.lift || 0) * 0.32), cs, t); if (!es.length) return;
    var bl = Math.sin(t * 0.9 + (e.ph || 0) * 7) > 0.96 ? 0.15 : 1, col = e.type === 'kiki' || e.type === 'leshy' ? '#a8ff7a' : '#ffe86a';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    es.forEach(function (q) {
      ctx.globalAlpha = 0.3; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(q[0], q[1], q[2] * 2.6, 0, 7); ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.ellipse(q[0], q[1], q[2], q[2] * bl, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fffbe0'; ctx.beginPath(); ctx.ellipse(q[0], q[1], q[2] * 0.45, q[2] * 0.45 * bl, 0, 0, 7); ctx.fill(); ctx.fillStyle = col;
    });
    ctx.restore();
  });
  ctx.globalAlpha = 1;
  return true;
};

// двор Бабы-Яги вместо второй избушки: плетень с горшками и котёл с зельем на огне
Z.drawYagaYard = function (x, y, cs, t) {
  var ctx = c(), l = Math.max(1.3, cs * 0.04);
  D.ell(x, y - cs * 0.05, cs * 1.0, cs * 0.3, 'rgba(30,40,80,0.18)');
  // плетень
  var fy = y - cs * 0.55;
  for (var i = 0; i < 6; i++) { var px = x - cs * 0.95 + i * cs * 0.38; ctx.strokeStyle = OL; ctx.lineWidth = l * 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px, fy + cs * 0.1); ctx.lineTo(px, fy - cs * 0.5); ctx.stroke(); ctx.strokeStyle = '#7a5530'; ctx.lineWidth = l * 1.4; ctx.stroke(); }
  for (var w = 0; w < 3; w++) { ctx.strokeStyle = '#9a7040'; ctx.lineWidth = l * 1.6; ctx.beginPath(); ctx.moveTo(x - cs * 0.98, fy - cs * (0.05 + w * 0.13)); for (var j = 0; j < 6; j++) ctx.quadraticCurveTo(x - cs * 0.95 + (j + 0.5) * cs * 0.38, fy - cs * (0.05 + w * 0.13) + ((j + w) % 2 ? cs * 0.05 : -cs * 0.05), x - cs * 0.95 + (j + 1) * cs * 0.38, fy - cs * (0.05 + w * 0.13)); ctx.stroke(); }
  [0, 2, 4, 5].forEach(function (i, k) { var px = x - cs * 0.95 + i * cs * 0.38; D.ell(px, fy - cs * 0.58, cs * 0.1, cs * 0.09, ['#b06a3a', '#8a4a2a', '#c88a4a', '#9a5a3a'][k], l * 0.7); D.rr(px - cs * 0.05, fy - cs * 0.7, cs * 0.1, cs * 0.05, cs * 0.02); ctx.fillStyle = '#6a3a20'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke(); });
  // треножник, огонь, котёл
  var kx = x + cs * 0.05, ky = y - cs * 0.12;
  ctx.strokeStyle = OL; ctx.lineWidth = l * 1.8; ctx.beginPath(); ctx.moveTo(kx - cs * 0.42, ky + cs * 0.05); ctx.lineTo(kx, ky - cs * 0.85); ctx.lineTo(kx + cs * 0.42, ky + cs * 0.05); ctx.stroke();
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = l; ctx.stroke();
  if (D.fire) D.fire(kx, ky + cs * 0.05, cs * 0.32, t);
  ctx.strokeStyle = '#3d3d3d'; ctx.lineWidth = l * 0.7; ctx.beginPath(); ctx.moveTo(kx, ky - cs * 0.85); ctx.lineTo(kx, ky - cs * 0.58); ctx.stroke();
  D.ell(kx, ky - cs * 0.32, cs * 0.34, cs * 0.26, '#2f3340', l);
  D.ell(kx, ky - cs * 0.52, cs * 0.3, cs * 0.08, '#5ab84a', l * 0.8);
  for (var b = 0; b < 4; b++) { var bp = (t * 0.7 + b / 4) % 1; ctx.globalAlpha = 1 - bp; D.circ(kx - cs * 0.15 + b * cs * 0.1, ky - cs * 0.55 - bp * cs * 0.5, cs * (0.03 + bp * 0.05), '#b8ff9a'); }
  ctx.globalAlpha = 1;
  D.ell(kx - cs * 0.12, ky - cs * 0.38, cs * 0.06, cs * 0.04, 'rgba(255,255,255,0.25)');
};

// ---------- избушка на курьих ножках ----------
// x,y — земля под ногами; cs — масштаб; o: {walk, dir, sit, crouch, jump, turned, door, smoke}
function chickenLeg(ctx, hx, hy, fx, fy, s, l, back) {
  // бедро с перьями → колено назад → цевка в чешуе → пальцы с когтями
  var kx = (hx + fx) / 2 - s * 0.2, ky = (hy + fy) / 2 - s * 0.04;
  var leg = back ? '#c8822e' : '#e8a040', legD = back ? '#9a6020' : '#b87a2a';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = OL; ctx.lineWidth = s * 0.17 + l * 2; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy - s * 0.05); ctx.stroke();
  ctx.strokeStyle = leg; ctx.lineWidth = s * 0.17; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy - s * 0.05); ctx.stroke();
  ctx.strokeStyle = legD; ctx.lineWidth = l * 0.6;
  for (var i = 1; i < 5; i++) { var q = i / 5, sx = kx + (fx - kx) * q, sy = ky + (fy - s * 0.05 - ky) * q; ctx.beginPath(); ctx.moveTo(sx - s * 0.07, sy - s * 0.02); ctx.lineTo(sx + s * 0.07, sy + s * 0.02); ctx.stroke(); }
  D.circ(kx, ky, s * 0.1, leg, l);
  // пальцы: три вперёд, один назад
  [[0.32, 0.02], [0.26, 0.09], [0.18, -0.05], [-0.16, 0.0]].forEach(function (tq, j) {
    var tx = fx + tq[0] * s, ty = fy + tq[1] * s * 0.3;
    ctx.strokeStyle = OL; ctx.lineWidth = s * 0.07 + l * 1.6; ctx.beginPath(); ctx.moveTo(fx, fy - s * 0.04); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.strokeStyle = leg; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.moveTo(fx, fy - s * 0.04); ctx.lineTo(tx, ty); ctx.stroke();
    var dd = tq[0] > 0 ? 1 : -1; D.poly([tx, ty - s * 0.035, tx + dd * s * 0.08, ty + s * 0.01, tx, ty + s * 0.03], '#f4f0e0', l * 0.6);
  });
  // перья над бедром
  for (var f = 0; f < 5; f++) { var fa = -0.5 + f * 0.25, fxx = hx - s * 0.16 + f * s * 0.08; ctx.save(); ctx.translate(fxx, hy + s * 0.02); ctx.rotate(fa); D.ell(0, s * 0.08, s * 0.045, s * 0.11, back ? '#c8b090' : '#f2e2c4', l * 0.6); ctx.restore(); }
}
function drawHutNew(x, y, cs, t, walk, o) {
  o = o || {}; var ctx = c(), s = cs, l = Math.max(1.5, cs * 0.04), d = o.dir || 1;
  var ph = o.walk !== undefined ? o.walk : (walk ? t * 6 : 0), moving = walk && o.moving !== false;
  var crouch = o.crouch || 0, jump = o.jump || 0, sit = o.sit || 0;
  var legH = o.noLegs ? 0 : s * (0.78 - crouch * 0.3 - sit * 0.55), bob = moving ? Math.abs(Math.sin(ph)) * s * 0.06 : Math.sin(t * 1.5) * s * 0.012;
  var by = y - legH - bob - jump * s * 0.55;
  ctx.save(); ctx.translate(x, 0); ctx.scale(d, 1); ctx.translate(-x, 0);
  D.ell(x, y + s * 0.03, s * (0.62 - jump * 0.2), s * 0.12, 'rgba(30,40,80,' + (0.25 - jump * 0.1) + ')');
  var hipY = by + s * 0.02;
  // ноги: дальняя и ближняя
  for (var lg = 0; lg < (o.noLegs ? 0 : 2); lg++) {
    var back = lg === 0, phs = ph + (back ? Math.PI : 0), sw = moving ? Math.sin(phs) : 0, lift = moving ? Math.max(0, Math.cos(phs)) : 0;
    var hx = x + (back ? -s * 0.2 : s * 0.12), fx = hx + sw * s * 0.28 - s * 0.05, fy = y - lift * s * 0.16 - jump * s * 0.3;
    if (sit) { fx = hx + s * 0.18; fy = Math.min(y, hipY + s * 0.25); }
    chickenLeg(ctx, hx, hipY, fx, fy, s * (sit ? 0.8 : 1), l, back);
  }
  // сруб
  var W = s * 1.05, H = s * 0.72, X0 = x - W / 2, top = by - H;
  // боковая стена (глубина)
  D.poly([X0 + W, by, X0 + W + s * 0.2, by - s * 0.1, X0 + W + s * 0.2, top - s * 0.1, X0 + W, top], '#7a5030', l);
  D.rr(X0, top, W, H, s * 0.03); ctx.fillStyle = '#a8733f'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  // брёвна
  var n = 5, lh = H / n;
  for (var i = 0; i < n; i++) {
    var ly = top + i * lh;
    ctx.fillStyle = i % 2 ? '#b8834c' : '#a87440'; ctx.fillRect(X0 + l * 0.5, ly + l * 0.5, W - l, lh - l * 0.5);
    ctx.strokeStyle = 'rgba(70,40,20,0.7)'; ctx.lineWidth = l * 0.6; ctx.beginPath(); ctx.moveTo(X0, ly + lh); ctx.lineTo(X0 + W, ly + lh); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,180,0.35)'; ctx.lineWidth = l * 0.5; ctx.beginPath(); ctx.moveTo(X0 + s * 0.06, ly + lh * 0.3); ctx.lineTo(X0 + W - s * 0.06, ly + lh * 0.3); ctx.stroke();
    // торцы брёвен на углах
    [X0 - s * 0.02, X0 + W + s * 0.02].forEach(function (ex) { D.circ(ex, ly + lh * 0.55, lh * 0.55, '#c99a62', l * 0.8); ctx.strokeStyle = 'rgba(110,70,35,0.8)'; ctx.lineWidth = l * 0.45; ctx.beginPath(); ctx.arc(ex, ly + lh * 0.55, lh * 0.28, 0, 7); ctx.stroke(); });
    // мох
    if (i > 0) for (var m = 0; m < 3; m++) D.ell(X0 + W * (0.2 + m * 0.3 + (i % 2) * 0.1), ly + s * 0.005, s * 0.05, s * 0.015, '#6a8a4a');
  }
  // окно с наличником и ставнями — или глухая задняя стена
  var wx2 = x + s * 0.02, wy = top + H * 0.42;
  if (!o.turned) {
    var ww = s * 0.3, wh = s * 0.27, glow = 0.75 + 0.25 * Math.sin(t * 4.3) * Math.sin(t * 2.1);
    // ставни
    D.rr(wx2 - ww / 2 - s * 0.15, wy - wh / 2, s * 0.14, wh, s * 0.02); ctx.fillStyle = '#4a8a5a'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
    D.rr(wx2 + ww / 2 + s * 0.01, wy - wh / 2, s * 0.14, wh, s * 0.02); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#2f6a40'; ctx.lineWidth = l * 0.5; [wx2 - ww / 2 - s * 0.08, wx2 + ww / 2 + s * 0.08].forEach(function (sx) { ctx.beginPath(); ctx.moveTo(sx - s * 0.04, wy - wh * 0.25); ctx.lineTo(sx + s * 0.04, wy + wh * 0.25); ctx.moveTo(sx + s * 0.04, wy - wh * 0.25); ctx.lineTo(sx - s * 0.04, wy + wh * 0.25); ctx.stroke(); });
    // стекло со светом
    D.rr(wx2 - ww / 2, wy - wh / 2, ww, wh, s * 0.02); ctx.fillStyle = 'rgb(255,' + Math.round(190 + 40 * glow) + ',100)'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.strokeStyle = '#6a4020'; ctx.lineWidth = l * 0.9; ctx.beginPath(); ctx.moveTo(wx2, wy - wh / 2); ctx.lineTo(wx2, wy + wh / 2); ctx.moveTo(wx2 - ww / 2, wy); ctx.lineTo(wx2 + ww / 2, wy); ctx.stroke();
    // резной наличник
    D.poly([wx2 - ww / 2 - s * 0.05, wy - wh / 2, wx2, wy - wh / 2 - s * 0.12, wx2 + ww / 2 + s * 0.05, wy - wh / 2, wx2 + ww / 2 + s * 0.05, wy - wh / 2 + s * 0.03, wx2 - ww / 2 - s * 0.05, wy - wh / 2 + s * 0.03], '#f0e6d0', l * 0.8);
    D.circ(wx2, wy - wh / 2 - s * 0.05, s * 0.025, '#e8484f');
    D.rr(wx2 - ww / 2 - s * 0.05, wy + wh / 2, ww + s * 0.1, s * 0.05, s * 0.015); ctx.fillStyle = '#f0e6d0'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
    for (var z = 0; z < 4; z++) D.poly([wx2 - ww / 2 + z * ww / 3 - s * 0.03, wy + wh / 2 + s * 0.05, wx2 - ww / 2 + z * ww / 3, wy + wh / 2 + s * 0.1, wx2 - ww / 2 + z * ww / 3 + s * 0.03, wy + wh / 2 + s * 0.05], '#f0e6d0', l * 0.5);
    // дверь на боковой стене, открывается когда вылетает Яга
    var dop = o.door || 0;
    D.poly([X0 + W + s * 0.04, by - s * 0.02, X0 + W + s * 0.16, by - s * 0.08, X0 + W + s * 0.16, by - s * 0.48, X0 + W + s * 0.04, by - s * 0.42], dop > 0 ? '#2a1a10' : '#6a4020', l * 0.8);
    if (dop > 0) D.poly([X0 + W + s * 0.04, by - s * 0.02, X0 + W + s * 0.04 + s * 0.2 * dop, by + s * 0.01, X0 + W + s * 0.04 + s * 0.2 * dop, by - s * 0.39, X0 + W + s * 0.04, by - s * 0.42], '#8a5a30', l * 0.8);
  } else {
    // задом к нам: глухая стена и поленница
    for (var pq = 0; pq < 3; pq++) for (var pr = 0; pr < 2; pr++) D.circ(x - s * 0.15 + pq * s * 0.15 + pr * s * 0.07, by - s * 0.12 - pr * s * 0.12, s * 0.07, '#c99a62', l * 0.6);
  }
  // крыша из тёса со снегом
  var rT = top - s * 0.5;
  D.poly([X0 - s * 0.14, top + s * 0.04, x + s * 0.02, rT, X0 + W + s * 0.14, top + s * 0.04], '#6a4a35', l);
  D.poly([X0 + W + s * 0.14, top + s * 0.04, x + s * 0.02, rT, x + s * 0.22, rT - s * 0.1, X0 + W + s * 0.34, top - s * 0.06], '#dfe8f6', l);
  ctx.strokeStyle = '#4a3020'; ctx.lineWidth = l * 1.6; ctx.beginPath(); ctx.moveTo(X0 + W + s * 0.14, top + s * 0.05); ctx.lineTo(X0 + W + s * 0.34, top - s * 0.05); ctx.stroke();
  ctx.strokeStyle = 'rgba(40,25,15,0.6)'; ctx.lineWidth = l * 0.5;
  for (var rb = 1; rb < 6; rb++) { var q2 = rb / 6; ctx.beginPath(); ctx.moveTo(x + s * 0.02 + (X0 - s * 0.14 - x - s * 0.02) * q2 * 0.98, rT + (top + s * 0.04 - rT) * q2); ctx.lineTo(x + s * 0.02, rT + s * 0.02); ctx.stroke(); }
  // снег на крыше
  ctx.beginPath(); ctx.moveTo(X0 - s * 0.16, top + s * 0.02); ctx.lineTo(x + s * 0.02, rT - s * 0.04); ctx.lineTo(X0 + W + s * 0.16, top + s * 0.02);
  for (var sn = 0; sn <= 6; sn++) { var sxx = X0 + W + s * 0.16 - sn * (W + s * 0.32) / 6; ctx.quadraticCurveTo(sxx + s * 0.05, top + s * 0.1, sxx - (W + s * 0.32) / 12, top + s * 0.03); }
  ctx.closePath(); ctx.fillStyle = '#f4f8ff'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
  // конёк-причелина
  D.circ(x + s * 0.02, rT - s * 0.05, s * 0.05, '#f0e6d0', l * 0.7);
  // труба и дым
  D.rr(x + s * 0.24, rT + s * 0.06, s * 0.13, s * 0.24, s * 0.02); ctx.fillStyle = '#9a6050'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
  D.rr(x + s * 0.22, rT + s * 0.03, s * 0.17, s * 0.06, s * 0.02); ctx.fillStyle = '#f4f8ff'; ctx.fill(); ctx.stroke();
  if (o.smoke !== false) for (var sm = 0; sm < 4; sm++) { var sp = (t * 0.35 + sm / 4) % 1; ctx.globalAlpha = (1 - sp) * 0.45; D.circ(x + s * 0.3 + Math.sin(sp * 5 + sm) * s * 0.08 - sp * s * 0.2 * d, rT - sp * s * 0.7, s * (0.06 + sp * 0.1), '#c8ccd8'); }
  ctx.globalAlpha = 1;
  ctx.restore();
}
Z.drawHut = function (x, y, cs, t, walk, o) { drawHutNew(x, y, cs, t, walk, o); };

function hutTick(G, dt, battle) {
  var H = G.hut; if (!H) return;
  var L = G.L;
  H.turnCd = Math.max(0, (H.turnCd || 0) - dt); H.door = Math.max(0, (H.door || 0) - dt);
  if (H.ko > 0) { H.ko -= dt; H.moving = false; H.stompT = undefined; H.crouch = H.jump = 0; if (H.ko <= 0) { snd('bawk', 0.45); snd('creak', 0.4); if (Z._.addText) Z._.addText(TT('Избушка очнулась!', 'The hut is back up!'), H.x, H.y - 1.6, '#ffd9a0', 1, 0.8); } return; }
  // избушка — живая цель: по ней бьют башни и герои
  if (!H.e || H.e.dead || G.enemies.indexOf(H.e) < 0) {
    Z.save.seen.e_hutE = 1;
    var sc0 = Z.hpScale ? Z.hpScale(G.idx) : 1, he = Z._.spawnAt ? Z._.spawnAt('hutE', H.x, H.y, 1) : null;
    if (he) { he.hp = he.max = 160 * sc0; he.neutral = true; he.lane = 0; he.x = H.x; he.y = H.y; he.dleft = 99; H.e = he; }
  }
  H.cluckT = (H.cluckT === undefined ? 3 : H.cluckT) - dt;
  if (H.cluckT <= 0) { H.cluckT = 5 + Math.random() * 6; snd(Math.random() < 0.25 ? 'bawk' : 'cluck', 0.22); }
  if (H.turnT > 0) { H.turnT -= dt; H.sit = Math.min(1, (H.sit || 0) + dt * 2); H.moving = false; if (H.turnT <= 0) { snd('bawk', 0.35); snd('creak', 0.3); } return; }
  H.sit = Math.max(0, (H.sit || 0) - dt * 2);
  H.stompCd = (H.stompCd === undefined ? 6 : H.stompCd) - dt;
  // топот
  if (H.stompT !== undefined) {
    H.stompT += dt; var p = H.stompT;
    H.crouch = p < 0.35 ? ease(p / 0.35) : p < 0.7 ? 1 - ease((p - 0.35) / 0.15) : p < 0.85 ? ease((p - 0.7) / 0.15) * 0.6 : 0.6 * (1 - ease((p - 0.85) / 0.35));
    H.jump = p >= 0.35 && p < 0.7 ? Math.sin((p - 0.35) / 0.35 * Math.PI) : 0;
    if (p >= 0.7 && !H.landed) {
      H.landed = true; G.shake = Math.max(G.shake || 0, 0.4); snd('stomp', 0.7); snd('creak', 0.35); if (Z.AU.boom) Z.AU.boom(0.7);
      G.fx.push({ k: 'stomp', x: H.x, y: H.y + 0.3, t: 0, dur: 0.6 }); G.fx.push({ k: 'ring', x: H.x, y: H.y + 0.3, r: 2.2, t: 0, dur: 0.5, col: '#ffffff' });
      G.decals.push({ k: 'crack', x: H.x, y: H.y + 0.35, s: 1.2, rot: Math.random() * 6 });
      var sc = Math.pow(G.waveMul || 1, 0.5);
      for (var k in G.towers) { var tw = G.towers[k]; if (Math.hypot(tw.c + 0.5 - H.x, tw.r + 0.5 - H.y) < 2.2) { tw.stun = Math.max(tw.stun || 0, 2.2); Z.damageTower(tw, 14 * sc); G.fx.push({ k: 'v_dust', x: tw.c + 0.5, y: tw.r + 0.5, t: 0, dur: 0.5 }); } }
      (G.squad || []).forEach(function (U) { if (U.dead) return; var dx = U.x - H.x, dy = U.y - H.y, dd = Math.hypot(dx, dy); if (dd < 2.2) { U.hp -= U.max * 0.16; U.hitT = 0.2; U.stunT = Math.max(U.stunT || 0, 1.2); var ps = (2.2 - dd) * 0.5 / (dd || 1); var nx = U.x + dx * ps, ny = U.y + dy * ps; if (L.grid[Math.floor(ny)] && L.grid[Math.floor(ny)][Math.floor(nx)] !== undefined && L.grid[Math.floor(ny)][Math.floor(nx)] <= 1) { U.x = nx; U.y = ny; } } });
      if (Z.sayLine && Math.random() < 0.3) Z.sayLine('YAG-04', 0.4);
    }
    if (p >= 1.2) { H.stompT = undefined; H.landed = false; H.crouch = 0; H.jump = 0; H.stompCd = 5 + Math.random() * 1.5; H.wait = 0.8; }
    return;
  }
  // выпускает Ягу
  if (battle) { H.ny -= dt; if (H.ny <= 1 && H.ny + dt > 1) { H.door = 1.6; snd('door', 0.4); } if (H.ny <= 0) { H.ny = 28; if (Z._.spawnAt) Z._.spawnAt('yaga', H.x + 0.6 * (H.dir || 1), H.y - 0.5, (G.waveMul || 1) * 0.8); if (Z.sayLine) Z.sayLine('YAG-04', 0.6); } }
  var nearTw = null, nd = 1.9; for (var k2 in G.towers) { var t2 = G.towers[k2], d2 = Math.hypot(t2.c + 0.5 - H.x, t2.r + 0.5 - H.y); if (d2 < nd) { nd = d2; nearTw = { x: t2.c + 0.5 }; } }
  (G.squad || []).forEach(function (U) { if (!U.dead) { var d3 = Math.hypot(U.x - H.x, U.y - H.y); if (d3 < nd) { nd = d3; nearTw = { x: U.x }; } } });
  // 2.10: получила урон — злится и бежит на ближнюю цель
  if (H.e && !H.e.dead) { if (H.lastHp !== undefined && H.e.hp < H.lastHp - 0.5 && !(H.rage > 0) && !(H.rageCd > 0)) { H.rage = 3; H.rageCd = 9; snd('bawk', 0.6); if (Z._.addText) Z._.addText(TT('Ко-ко-ко!', 'Bawk!'), H.x, H.y - 1.7, '#ff9a6a', 0.9, 0.8); var tg = hutTarget(G, H, true); if (tg) { H.tx = tg.x; H.ty = tg.y; } } H.lastHp = H.e.hp; }
  if (H.rage > 0) H.rage -= dt; if (H.rageCd > 0) H.rageCd -= dt;
  if (battle && nearTw && (H.stompCd <= 0 || (H.rage > 0 && nd < 1.4 && H.stompCd < 3))) { H.stompT = 0; H.moving = false; H.dir = nearTw.x > H.x ? 1 : -1; snd('bawk', 0.35); return; }
  if (!H.tx || Math.hypot(H.tx - H.x, H.ty - H.y) < 0.1) {
    H.moving = false;
    if ((H.wait = (H.wait || 0) - dt) <= 0) {
      var keys = Object.keys(G.towers), g = battle ? hutTarget(G, H, false) : null;
      if (!g && keys.length && Math.random() < 0.65) { var tw3 = G.towers[keys[Math.floor(Math.random() * keys.length)]]; for (var tr = 0; tr < 8 && !g; tr++) { var cc = tw3.c + Math.floor(Math.random() * 3) - 1, rr = tw3.r + Math.floor(Math.random() * 3) - 1; if (L.grid[rr] && L.grid[rr][cc] === 0 && !G.towers[rr * L.W + cc]) g = { x: cc + 0.5, y: rr + 0.5 }; } }
      if (!g && Z.randGround) g = Z.randGround(G, {});
      if (g) { H.tx = g.x; H.ty = g.y; }
      H.wait = battle ? 0.8 + Math.random() : 3 + Math.random() * 3;
    }
  } else {
    var dx = H.tx - H.x, dy = H.ty - H.y, dd = Math.hypot(dx, dy), st = Math.min(dd, (H.rage > 0 ? 1.6 : battle ? 0.75 : 0.55) * dt);
    H.x += dx / dd * st; H.y += dy / dd * st; var pw = H.walk || 0; H.walk = pw + dt * 6; H.dir = dx > 0.02 ? 1 : dx < -0.02 ? -1 : H.dir || 1; H.moving = true;
    if (Math.floor(H.walk / Math.PI) !== Math.floor(pw / Math.PI)) { snd('thud', 0.16); if (Math.random() < 0.25) snd('creak', 0.12); }
  }
}
Z.hutTick = hutTick;
// 2.10: избушка идёт к скоплению вышек или к героям
function hutTarget(G, H, near) {
  var L = G.L, best = null, bs = -1e9, cand = [];
  for (var k in G.towers) { var tw = G.towers[k], n = 0; for (var k2 in G.towers) { var o = G.towers[k2]; if (Math.hypot(o.c - tw.c, o.r - tw.r) < 2.3) n++; } cand.push({ x: tw.c + 0.5, y: tw.r + 0.5, w: n + tw.lvl * 0.3 }); }
  (G.squad || []).forEach(function (U) { if (!U.dead) cand.push({ x: U.x, y: U.y, w: 2.2 }); });
  cand.forEach(function (c) { var d = Math.hypot(c.x - H.x, c.y - H.y), s = c.w - d * (near ? 0.8 : 0.25) + Math.random() * 0.8; if (s > bs) { bs = s; best = c; } });
  if (!best) return null;
  for (var tr = 0; tr < 12; tr++) { var cc = Math.floor(best.x) + Math.floor(Math.random() * 3) - 1, rr = Math.floor(best.y) + Math.floor(Math.random() * 3) - 1; if (L.grid[rr] && L.grid[rr][cc] === 0 && !G.towers[rr * L.W + cc] && !(Z.inEnemyZone && Z.inEnemyZone(cc, rr) && L.entrances.some(function (en) { return en[0] === cc && en[1] === rr; }))) return { x: cc + 0.5, y: rr + 0.5 }; }
  return null;
}
function drawHutState(H, x, y, cs, t) {
  var ko = H.ko > 0, ctx = c();
  if (ko) { ctx.save(); ctx.translate(x, y); ctx.rotate(0.22 * (H.dir || 1)); ctx.translate(-x, -y); }
  drawHutNew(x, y, cs * 1.1, t, true, { walk: H.walk || 0, moving: !!H.moving && !ko, dir: H.dir || 1, sit: ko ? 1 : H.sit || 0, crouch: H.crouch || 0, jump: H.jump || 0, turned: H.turnT > 0, door: Math.min(1, (H.door || 0) * 2), smoke: !ko });
  if (ko) { ctx.restore(); for (var i = 0; i < 3; i++) { var a = t * 3 + i * 2.09; D.star(x + Math.cos(a) * cs * 0.45, y - cs * 1.55 + Math.sin(a) * cs * 0.12, cs * 0.12, '#ffd54a', 1); } }
}
Z.drawHutObj = function (objs, X, Y, cs, t) {
  var G = Z.G, H = G.hut; if (!H) return;
  if (H.e && !H.e.dead && G.enemies.indexOf(H.e) >= 0) return; // живую избушку рисует D.enemy вместе с врагами
  objs.push({ y: H.y + 0.4, f: function () { drawHutState(H, X(H.x), Y(H.y + 0.4), cs, t); } });
};
var oldTap = Z.mechTap;
Z.mechTap = function (c0, r0) {
  var G = Z.G, H = G && G.hut;
  if (H && Math.abs(c0 + 0.5 - H.x) < 0.8 && r0 + 0.5 > H.y - 1.4 && r0 + 0.5 < H.y + 0.7) {
    if (H.turnT > 0) return true;
    if (H.turnCd > 0) { if (Z._.addText) Z._.addText(TT('Не слушается… ещё ' + Math.ceil(H.turnCd) + ' с', 'Not listening… ' + Math.ceil(H.turnCd) + 's'), H.x, H.y - 1.4, '#ffd9a0', 0.9, 0.6); snd('cluck', 0.3); return true; }
    H.turnT = 10; H.turnCd = 30; H.stompT = undefined; H.crouch = H.jump = 0; H.landed = false; H.tx = H.x; H.ty = H.y;
    G.banner = { text: TT('Избушка, избушка, повернись к лесу задом!', 'Little hut, turn your back to us!'), sub: TT('10 секунд не топает и не выпускает Ягу', 'No stomping and no Baba Yaga for 10 seconds'), t: 2.2 };
    snd('creak', 0.5); snd('bawk', 0.4); if (Z.AU.sfx) Z.AU.sfx('place', 0.5);
    return true;
  }
  return oldTap ? oldTap(c0, r0) : false;
};

// ---------- Баба-Яга: пикирует, бьёт помелом, сбрасывает горшки ----------
function nearestTw(G, x, y, r) { var b = null, bd = r * r; for (var k in G.towers) { var tw = G.towers[k], dx = tw.c + 0.5 - x, dy = tw.r + 0.5 - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; b = tw; } } return b; }
function swingTick(e, dt, onStrike) {
  if (!(e.swT >= 0)) return;
  var p0 = e.swT; e.swT += dt / 0.75;
  if (p0 < 0.4 && e.swT >= 0.4) snd('swing', 0.4);
  if (p0 < 0.52 && e.swT >= 0.52) onStrike();
  if (e.swT >= 1) e.swT = -1;
}
function yagaTick(e, dt, v) {
  var G = Z.G;
  if (e.hideT > 0) e.hideT -= dt;
  e.flyT = (e.flyT === undefined ? 0.5 : e.flyT) - dt;
  if (e.flyT <= 0) { e.flyT = 3.5; if (Z.AU.sfx) Z.AU.sfx('stupa_fly', 0.3, { pos: { x: e.x, y: e.y } }); }
  if (e.ysg) { Z.hk.siege(e, dt, null); return true; }
  swingTick(e, dt, function () {
    var tw = e.dv && e.dv.tw;
    if (tw && G.towers[tw.r * G.L.W + tw.c] === tw) {
      tw.stun = Math.max(tw.stun || 0, 2.5); Z.damageTower(tw, 10 * Math.pow(G.waveMul || 1, 0.5));
      G.fx.push({ k: 'v_vortex', x: tw.c + 0.5, y: tw.r + 0.4, t: 0, dur: 1 });
      for (var s = 0; s < 3; s++) G.fx.push({ k: 'star', x: tw.c + 0.5 + (s - 1) * 0.25, y: tw.r - 0.1, t: 0, dur: 0.7 });
      snd('thwack', 0.55); G.shake = Math.max(G.shake || 0, 0.12);
      if (Z.sayLine && Math.random() < 0.4) Z.sayLine('YAG-02', 0.6);
    }
    // помелом заметает следы — ближние враги пропадают из виду
    G.enemies.forEach(function (o) { if (!o.dead && !o.air && !o.neutral && Math.hypot(o.x - e.x, o.y - e.y) < 2.2) o.hideT = 2; });
  });
  if (e.ys === 'dive') {
    var tw = e.dv.tw; if (!G.towers[tw.r * G.L.W + tw.c]) { e.ys = 'back'; return true; }
    var side = e.dv.side, px = tw.c + 0.5 - side * 0.7, py = tw.r + 0.3, dx = px - e.x, dy = py - e.y, d = Math.hypot(dx, dy);
    if (d > 0.08) { var st = Math.min(d, 3.2 * dt); e.x += dx / d * st; e.y += dy / d * st; }
    e.dir = side;
    if (d < 0.25 && !e.dv.sw) { e.dv.sw = 1; e.swT = 0; }
    if (e.dv.sw && !(e.swT >= 0)) { e.dv.n = (e.dv.n || 0) + 1; if (e.dv.n < 2) { e.swT = 0; } else e.ys = 'back'; }
    return true;
  }
  if (e.ys === 'back') {
    var bx = e.dv.x0 - e.x, by = e.dv.y0 - e.y, bd = Math.hypot(bx, by);
    if (bd < 0.1) { e.ys = null; e.x = e.dv.x0; e.y = e.dv.y0; return false; }
    var s2 = Math.min(bd, 2.6 * dt); e.x += bx / bd * s2; e.y += by / bd * s2; e.dir = bx > 0 ? 1 : -1;
    return true;
  }
  e.abil = (e.abil === undefined ? 3 : e.abil) - dt;
  if (e.abil <= 0) {
    var tw2 = nearestTw(G, e.x, e.y, 3.2);
    if (tw2) { e.abil = 7; e.ys = 'dive'; e.dv = { tw: tw2, x0: e.x, y0: e.y, side: tw2.c + 0.5 >= e.x ? 1 : -1 }; if (Z.AU.sfx) Z.AU.sfx('stupa_fly', 0.5); return true; }
    e.abil = 1;
  }
  e.potT = (e.potT === undefined ? 2 : e.potT) - dt;
  if (e.potT <= 0) {
    var tgt = null, best = 2.6;
    (G.squad || []).forEach(function (U) { if (!U.dead) { var dd = Math.hypot(U.x - e.x, U.y - e.y); if (dd < best) { best = dd; tgt = { x: U.x, y: U.y }; } } });
    if (!tgt) { var tw4 = nearestTw(G, e.x, e.y, 2.6); if (tw4) tgt = { x: tw4.c + 0.5, y: tw4.r + 0.5 }; }
    if (tgt) { e.potT = 5.5; G.pots = G.pots || []; G.pots.push({ x: e.x, y: e.y - 1, x0: e.x, y0: e.y - 1, tx: tgt.x, ty: tgt.y, t: 0, rot: 0 }); snd('swing', 0.2); e.throwT = 0.3; }
    else e.potT = 1;
  }
  return false;
}
function potsTick(G, dt) {
  if (G.pots) for (var i = G.pots.length - 1; i >= 0; i--) {
    var q = G.pots[i]; q.t += dt / 0.8; q.rot += dt * 9;
    var p = Math.min(1, q.t); q.x = q.x0 + (q.tx - q.x0) * p; q.y = q.y0 + (q.ty - q.y0) * p - Math.sin(p * Math.PI) * 0.5;
    if (q.t >= 1) {
      G.pots.splice(i, 1); snd('glass', 0.45);
      G.puddles = G.puddles || []; G.puddles.push({ x: q.tx, y: q.ty, t: 0, dur: 4 });
      G.fx.push({ k: 'nflash', x: q.tx, y: q.ty, t: 0, dur: 0.4 });
      for (var s = 0; s < 8; s++) G.fx.push({ k: 'deb', x: q.tx, y: q.ty - 0.1, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 1.5, rot: Math.random() * 6, vr: 10, s: 0.05, col: s % 2 ? '#7ad86a' : '#b06a3a', t: 0, dur: 0.6 });
      (G.squad || []).forEach(function (U) { if (!U.dead && Math.hypot(U.x - q.tx, U.y - q.ty) < 1) { U.hp -= 7 + (G.idx || 0) * 0.35; U.hitT = 0.2; U.stunT = Math.max(U.stunT || 0, 0.8); } });
      for (var k in G.towers) { var tw = G.towers[k]; if (Math.hypot(tw.c + 0.5 - q.tx, tw.r + 0.5 - q.ty) < 0.95) { tw.stun = Math.max(tw.stun || 0, 1.6); Z.damageTower(tw, 5 * Math.pow(G.waveMul || 1, 0.5)); } }
    }
  }
  if (G.puddles) for (var j = G.puddles.length - 1; j >= 0; j--) { var pu = G.puddles[j]; pu.t += dt; if (pu.t >= pu.dur) G.puddles.splice(j, 1); else (G.squad || []).forEach(function (U) { if (!U.dead && Math.hypot(U.x - pu.x, U.y - pu.y) < 0.8) U.hp -= 2.5 * dt; }); }
}
// у ёлки Яга не разбивается, а зависает и дубасит помелом
Z.hk.siege = function (e, dt, sp) {
  if (e.type !== 'yaga') return false;
  var G = Z.G, L = G.L;
  if (!sp && L.type === 'escort' && Z.sleighPos) sp = Z.sleighPos();
  if (!e.ysg) { e.ysg = { n: 0, cd: 0.4, side: Math.random() < 0.5 ? -1 : 1 }; e.siege = true; e.swT = -1; }
  var Y0 = e.ysg;
  if (Y0.leave !== undefined) { Y0.leave += dt; e.y -= dt * 2.2; e.x += Y0.side * dt * 1.5; e.dir = Y0.side; if (Y0.leave > 1.4) { e.dead = true; e.escaped = true; } return true; }
  var hx = sp ? sp.x - Y0.side * 0.8 : L.fort[0] + 0.5 + Y0.side * 0.85, hy = sp ? sp.y - 0.3 : L.fort[1] - 0.5;
  e.x += (hx - e.x) * Math.min(1, dt * 3); e.y += (hy - e.y) * Math.min(1, dt * 3); e.dir = -Y0.side;
  swingTick(e, dt, function () {
    var dmg = Math.max(0.5, Z.ENEMIES.yaga.dmg * 0.5);
    if (L.type === 'escort' && G.sleigh) { G.sleigh.hp -= dmg; G.sleighHit = 0.4; }
    else { G.hp -= dmg; G.fortHit = 0.4; for (var s = 0; s < 5; s++) G.fx.push({ k: 'deb', x: e.x - Y0.side * 0.5, y: e.y, vx: (Math.random() - 0.5) * 2.5, vy: -1 - Math.random() * 1.4, rot: Math.random() * 6, vr: 10, s: 0.06, col: s % 2 ? '#4cc77d' : '#d8b86a', t: 0, dur: 0.8 }); }
    G.hpLost += dmg; G.shake = Math.max(G.shake || 0, 0.2); snd('thwack', 0.6); if (Z.AU.sfx) Z.AU.sfx('timp2', 0.4);
    Y0.n++;
  });
  if (!(e.swT >= 0)) { Y0.cd -= dt; if (Y0.cd <= 0) { if (Y0.n >= 3) { Y0.leave = 0; snd('swing', 0.3); if (Z.sayLine && Math.random() < 0.5) Z.sayLine('YAG-03', 0.6); } else { e.swT = 0; Y0.cd = 0.7; } } }
  return true;
};
Z.ENEMIES.hutE = { role: 'hut', hp: 380, spd: 0, armor: 3, coin: 45, dmg: 0, size: 1.6, air: false };
var oldKill = Z.hk.kill;
Z.hk.kill = function (e) {
  if (oldKill) oldKill(e);
  var G = Z.G;
  if (e.type === 'hutE' && G.hut) { var H = G.hut; H.ko = 10; H.e = null; H.turnT = 0; G.shake = Math.max(G.shake || 0, 0.5); snd('stomp', 0.8); snd('bawk', 0.5); G.fx.push({ k: 'ring', x: H.x, y: H.y, r: 1.6, t: 0, dur: 0.5, col: '#ffd9a0' }); G.banner = { text: TT('Избушка повержена!', 'The hut is down!'), sub: TT('10 секунд без топота и без Яги', '10 seconds without stomps or Baba Yaga'), t: 2 }; }
};
var oldEnemyDraw = D.enemy;
D.enemy = function (e, x, y, cs, t) {
  if (e.type !== 'hutE') return oldEnemyDraw(e, x, y, cs, t);
  var H = Z.G && Z.G.hut; if (!H) return;
  if (e._drawnT === t) return; e._drawnT = t; // рентген-слой рисует врагов второй раз — избушке не нужно
  drawHutState(H, x, y + cs * 0.4, cs, t);
  if (e.hp < e.max && !e.dead) { var ctx = c(), w = cs * 1.0, bx = x - w / 2, by = y - cs * 1.9; ctx.fillStyle = 'rgba(20,24,48,0.7)'; ctx.fillRect(bx - 1, by - 1, w + 2, cs * 0.1 + 2); ctx.fillStyle = e.hitT > 0 ? '#fff' : '#ff9a3d'; ctx.fillRect(bx, by, w * Math.max(0, e.hp / e.max), cs * 0.1); }
};
var oldHE = Z.hk.enemy;
Z.hk.enemy = function (e, dt, v) { if (e.type === 'hutE') { var H = Z.G.hut; if (!H || H.e !== e) { e.dead = true; return true; } e.x = H.x; e.y = H.y; e.dir = H.dir || 1; e.dleft = 99; e.kb = 0; return true; } if (e.type === 'yaga' && !e.ride) return yagaTick(e, dt, v); return oldHE ? oldHE(e, dt, v) : false; };
// угол помела для рисования: 0 — метёт сзади, замах через голову, удар вперёд-вниз, доводка
Z.yagaBroom = function (e) {
  var p = e && e.swT >= 0 ? e.swT : -1; if (p < 0) return { a: 0, lift: 0, blur: 0 };
  if (p < 0.4) return { a: ease(p / 0.4) * 1.75, lift: ease(p / 0.4), blur: 0 };
  if (p < 0.55) { var q = (p - 0.4) / 0.15; return { a: 1.75 + q * 2.61, lift: 1 - q * 0.6, blur: 1, from: 1.75 }; }
  var r = ease((p - 0.55) / 0.45); return { a: 4.36 + r * 1.92, lift: 0.4 * (1 - r), blur: 0 };
};

// ---------- общий тик и рисование поверх ----------
var oldUpd = Z.hk.update;
Z.hk.update = function (dt) {
  var G = Z.G;
  if (oldUpd) oldUpd(dt);
  if (!G || !G.v26) return;
  var battle = G.phase === 'wave' || G.phase === 'escortRun';
  if (G.hut) hutTick(G, dt, battle);
  potsTick(G, dt);
  nightTick(G, dt);
};
var oldOver = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  var G = Z.G;
  (G.puddles || []).forEach(function (pu) { var a = Math.min(1, (pu.dur - pu.t) / 1.2) * Math.min(1, pu.t * 5); ctx.globalAlpha = 0.6 * a; D.ell(X(pu.x), Y(pu.y), cs * 0.55, cs * 0.28, '#5ab84a'); ctx.globalAlpha = 0.8 * a; for (var b = 0; b < 3; b++) { var bp = (t * 0.8 + b / 3) % 1; D.circ(X(pu.x) + (b - 1) * cs * 0.2, Y(pu.y) - bp * cs * 0.15, cs * 0.04 * (1 - bp), '#b8ff9a'); } ctx.globalAlpha = 1; });
  (G.pots || []).forEach(function (q) { var x = X(q.x), y = Y(q.y), r = cs * 0.13; ctx.save(); ctx.translate(x, y); ctx.rotate(q.rot); D.ell(0, 0, r, r * 0.9, '#b06a3a', Math.max(1, cs * 0.03)); D.rr(-r * 0.5, -r * 1.2, r, r * 0.4, r * 0.1); ctx.fillStyle = '#8a4a2a'; ctx.fill(); ctx.stroke(); ctx.globalAlpha = 0.8; D.circ(0, -r * 1.25, r * 0.35, '#7ad86a'); ctx.restore(); });
  if (oldOver) oldOver(ctx, X, Y, cs, t);
};
})();
