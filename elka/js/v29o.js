/* 2.11.5 · боевка героев: частицы с физикой (высота над землёй, гравитация, отскок), ударные волны,
   ледяные шипы из-под земли, след на земле, свой звук попадания у каждого героя.
   Облик героя меняет частицы, звук и даёт небольшое свойство в бою:
   Ледяной — Стужа (замедляет), Полночный — Полночь (двойной удар), Мятный — Свежесть (лечит себя),
   Золотой — Богатство (монеты за добивание), Розовый — Вдохновение (бьёт чаще). */
(function () {
'use strict';
var Z = window.Z, D = Z.D;
function TT(r, e) { return Z.LANG === 'en' ? e : r; }
var R = Math.random;
function rnd(a, b) { return a + R() * (b - a); }
function G() { return Z.G; }
function push(f) { var g = G(); if (!g || g.fx.length > 440) return; f.t = 0; g.fx.push(f); }
function snd(n, v, o) { try { Z.AU.sfx(n, v, o); } catch (e) { if (window.__rep) window.__rep(e); } }
function has(n) { return !!(Z.AU && Z.AU.bufs && Z.AU.bufs[n]); }
function sndA(n, alt, v, o) { snd(has(n) ? n : alt, v, o); }
// отложенные события — по игровому времени (ускорение x2 и пауза не сбивают удар с анимацией)
function later(ms, fn) { var g = G(); if (!g) return; (g._hq || (g._hq = [])).push({ t: (g.t || 0) + ms / 1000, fn: fn, g: g }); }
function runQ() { var g = G(); if (!g || !g._hq || !g._hq.length || g._hqT === g.t) return; g._hqT = g.t; var q = g._hq; for (var i = q.length - 1; i >= 0; i--) if (q[i].t <= g.t) { var it = q.splice(i, 1)[0]; try { if (it.g === Z.G) it.fn(); } catch (e) { if (window.__rep) window.__rep(e); } } }
function react(x, y, r) { var g = G(); g.enemies.forEach(function (e) { if (!e.dead && Math.hypot(e.x - x, e.y - y) <= r) { e.hitT = 0.12; if (!e.boss) e.kb = 0.15; } }); }

// ---------- свойства обликов героев ----------
var HPERK = {
  ice:   { ru: 'Стужа', en: 'Deep frost', d: ['удары замедляют врагов на 25%', 'hits slow enemies by 25%'] },
  night: { ru: 'Полночь', en: 'Midnight', d: ['15% шанс двойного удара', '15% chance of a double hit'] },
  mint:  { ru: 'Свежесть', en: 'Freshness', d: ['каждый удар лечит героя на 4%', 'each hit heals the hero by 4%'] },
  gold:  { ru: 'Богатство', en: 'Riches', d: ['+1 монета за врага, добитого героем', '+1 coin for each enemy the hero finishes'] },
  rose:  { ru: 'Вдохновение', en: 'Inspiration', d: ['герой бьёт на 12% чаще', 'the hero attacks 12% more often'] }
};
Z.heroPerkText = function (id) { var p = HPERK[id]; if (!p) return null; var en = Z.LANG === 'en'; return { name: en ? p.en : p.ru, desc: p.d[en ? 1 : 0] }; };
function hsk(H) { var s = Z.heroSkin && Z.heroSkin(H.type); return s ? s.id : null; }

// палитры частиц: облик важнее «родных» частиц героя
var PAL = {
  ice:   { k: ['shard', 'flake'], c: ['#dff6ff', '#9fe3ff', '#ffffff'], glow: '#bfefff', snd: ['ice', 0.2, 1.7] },
  night: { k: ['star', 'glit'], c: ['#c9a6ff', '#7d6bff', '#fff3b0'], glow: '#9d7bff', snd: ['magic_ball', 0.14, 1.5] },
  mint:  { k: ['leaf', 'glit'], c: ['#8dffbf', '#3fcf8e', '#e9fff3'], glow: '#9dffc8', snd: ['select', 0.16, 1.9] },
  gold:  { k: ['coin', 'glit'], c: ['#ffd54a', '#fff1a8', '#e6a91d'], glow: '#ffe27a', snd: ['coin', 0.16, 1.3] },
  rose:  { k: ['petal', 'heart'], c: ['#ff8fc8', '#ffc2e0', '#ff4f9a'], glow: '#ffc2e0', snd: ['select', 0.16, 1.45] }
};
var HPAL = {
  moroz:    { k: ['shard', 'flake'], c: ['#ffffff', '#bfefff', '#7fd0ff'], glow: '#bfefff' },
  sneg:     { k: ['star', 'flake'], c: ['#ffd1f0', '#bfe6ff', '#ffffff'], glow: '#d8ecff' },
  belka:    { k: ['chip', 'chip'], c: ['#b9773d', '#7d4a22', '#e3b07a'], glow: '#ffd9a0' },
  plombir:  { k: ['spark', 'shard'], c: ['#ffffff', '#dff6ff', '#ffe27a'], glow: '#dff6ff' },
  eskimo:   { k: ['chunk', 'flake'], c: ['#ffffff', '#e6f3ff', '#c8def5'], glow: '#ffffff' },
  vasilisa: { k: ['star', 'glit'], c: ['#d6a8ff', '#ffe27a', '#ffffff'], glow: '#e2c4ff' },
  kot:      { k: ['spark', 'glit'], c: ['#ffffff', '#ffe27a', '#ffd0a0'], glow: '#fff3c2' },
  kolobok:  { k: ['crumb', 'chunk'], c: ['#f0b85a', '#c98a3a', '#ffffff'], glow: '#ffe2a8' },
  emelya:   { k: ['chunk', 'glit'], c: ['#ffffff', '#ffd54a', '#bfe6ff'], glow: '#fff3c2' }
};
function palOf(H, type) { var s = H ? hsk(H) : null; return PAL[s] || HPAL[type || (H && H.type)] || HPAL.moroz; }

// одна частица в мире: x,y — точка на земле, z — высота над ней
function part(x, y, z, pal, o) {
  o = o || {};
  var k = o.k || pal.k[(R() * pal.k.length) | 0], a = o.a != null ? o.a : R() * Math.PI * 2, sp = o.sp != null ? o.sp : rnd(0.6, 1.8);
  push({ k: 'hx', pk: k, x: x, y: y, z: z, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.55, vz: o.vz != null ? o.vz : rnd(1.2, 3), g: o.g != null ? o.g : (k === 'flake' || k === 'petal' || k === 'leaf' || k === 'star' ? 2.2 : 7), drag: k === 'flake' || k === 'petal' || k === 'leaf' ? 2.2 : 0.8,
    s: (o.s || 1) * (k === 'coin' ? 0.075 : k === 'chunk' ? 0.07 : k === 'shard' ? 0.07 : k === 'heart' ? 0.07 : 0.055) * rnd(0.75, 1.25), col: pal.c[(R() * pal.c.length) | 0], rot: R() * 6, vr: rnd(-12, 12), dur: o.dur || rnd(0.7, 1.2), d: o.d || 0, ph: R() * 6 });
}
function burst(x, y, z, pal, n, o) { for (var i = 0; i < n; i++) part(x, y, z, pal, o); }

// ---------- рисование своих эффектов ----------
var oldFx = D.fx;
D.fx = function (f, X, Y, cs, t, B) {
  if (f.k !== 'hx' && f.k !== 'hwave' && f.k !== 'hspike' && f.k !== 'hslash' && f.k !== 'hvortex' && f.k !== 'hglow' && f.k !== 'hclaw') return oldFx.apply(this, arguments);
  var c = D.ctx, tt = f.t - (f.d || 0); if (tt < 0) return; var pr = Math.min(1, tt / Math.max(0.01, f.dur - (f.d || 0)));
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  try {
    if (f.k === 'hx') stepDraw(c, f, X, Y, cs, tt);
    else if (f.k === 'hwave') {   // ударная волна по земле: светящееся кольцо + ледяная/цветная корка
      var rr = f.r * (0.25 + 0.75 * (1 - Math.pow(1 - pr, 3))), x = X(f.x), y = Y(f.y);
      c.globalAlpha = 0.3 * (1 - pr); c.beginPath(); c.ellipse(x, y, rr * cs, rr * cs * 0.42, 0, 0, 7); c.fillStyle = f.col; c.fill();
      c.globalAlpha = 0.85 * (1 - pr); c.lineWidth = Math.max(1.2, cs * 0.05 * (1 - pr)); c.strokeStyle = '#ffffff'; c.stroke(); c.lineWidth = Math.max(1, cs * 0.04 * (1 - pr)); c.strokeStyle = f.col2 || f.col; c.stroke();
      if (f.cracks) { c.globalAlpha = 0.7 * (1 - pr); c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1, cs * 0.025); for (var i = 0; i < 7; i++) { var a = f.seed + i * 0.9, l1 = rr * (0.5 + ((i * 7) % 3) * 0.2); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l1 * cs * 0.6, y + Math.sin(a) * l1 * cs * 0.25); c.lineTo(x + Math.cos(a + 0.3) * l1 * cs, y + Math.sin(a + 0.3) * l1 * cs * 0.42); c.stroke(); } }
    } else if (f.k === 'hspike') {   // ледяной шип вырастает из земли и тает
      var gr = tt < 0.1 ? tt / 0.1 : 1, fade = pr > 0.65 ? 1 - (pr - 0.65) / 0.35 : 1, h = f.h * cs * (tt < 0.1 ? 1 - Math.pow(1 - gr, 3) : 1) * (0.6 + 0.4 * fade), w = f.w * cs, sx = X(f.x), sy = Y(f.y);
      c.globalAlpha = fade; c.beginPath(); c.moveTo(sx - w, sy); c.lineTo(sx + f.tilt * h - w * 0.15, sy - h); c.lineTo(sx + f.tilt * h + w * 0.25, sy - h * 0.9); c.lineTo(sx + w, sy); c.closePath();
      var g2 = c.createLinearGradient(0, sy - h, 0, sy); g2.addColorStop(0, '#ffffff'); g2.addColorStop(1, f.col); c.fillStyle = g2; c.fill(); c.lineWidth = Math.max(1, cs * 0.025); c.strokeStyle = f.ol || '#3f86c0'; c.stroke();
      c.beginPath(); c.moveTo(sx - w * 0.35, sy - h * 0.1); c.lineTo(sx + f.tilt * h * 0.7 - w * 0.25, sy - h * 0.72); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = Math.max(1, cs * 0.02); c.stroke();
    } else if (f.k === 'hslash') {   // дуга удара мечом
      var sx2 = X(f.x), sy2 = Y(f.y) - cs * 0.45, rad = cs * f.r, a0 = f.dir > 0 ? -2.2 : Math.PI + 2.2, a1 = f.dir > 0 ? 0.7 : Math.PI - 0.7, k = Math.min(1, pr * 2.2), aa = a0 + (a1 - a0) * k;
      c.globalAlpha = 1 - pr; c.beginPath(); c.arc(sx2, sy2, rad, Math.min(a0, aa), Math.max(a0, aa)); c.lineWidth = cs * 0.16 * (1 - pr * 0.6); c.strokeStyle = f.col; c.stroke(); c.lineWidth = cs * 0.06; c.strokeStyle = '#ffffff'; c.stroke();
    } else if (f.k === 'hclaw') {   // три следа когтей
      var cx = X(f.x), cy = Y(f.y) - cs * 0.35; c.globalAlpha = 1 - pr;
      for (var j = -1; j <= 1; j++) { c.beginPath(); c.moveTo(cx - cs * 0.22 + j * cs * 0.09, cy - cs * 0.22 + j * cs * 0.03); c.quadraticCurveTo(cx + j * cs * 0.06, cy, cx + cs * 0.2 + j * cs * 0.09, cy + cs * 0.2 + j * cs * 0.03); c.lineWidth = cs * 0.07 * (1 - pr * 0.5); c.strokeStyle = f.col; c.stroke(); c.lineWidth = cs * 0.025; c.strokeStyle = '#fff'; c.stroke(); }
    } else if (f.k === 'hglow') {   // вспышка-сияние
      var gx = X(f.x), gy = Y(f.y) - cs * (f.z || 0), gr2 = cs * f.r * (0.6 + pr * 0.6), gg = c.createRadialGradient(gx, gy, 0, gx, gy, gr2); gg.addColorStop(0, f.col); gg.addColorStop(1, 'rgba(255,255,255,0)');
      c.globalAlpha = (1 - pr) * 0.9; c.fillStyle = gg; c.fillRect(gx - gr2, gy - gr2, gr2 * 2, gr2 * 2);
    } else if (f.k === 'hvortex') {   // метель: снежинки по спирали поднимаются кольцом
      var vx = X(f.x), vy = Y(f.y), n = 26;
      for (var q = 0; q < n; q++) { var ph = q / n, ang = ph * Math.PI * 2 + tt * (4 + ph * 2), rad2 = f.r * (0.35 + 0.65 * ((q * 7) % 5) / 4) * (0.6 + 0.4 * Math.min(1, tt * 3)), hz = ((tt * 1.6 + ph) % 1);
        c.globalAlpha = Math.min(1, (1 - pr) * 1.6) * (1 - hz * 0.6); var px = vx + Math.cos(ang) * rad2 * cs, py = vy + Math.sin(ang) * rad2 * cs * 0.42 - hz * cs * 1.4;
        if (q % 3 === 0) flake(c, px, py, cs * 0.08, f.col); else { c.beginPath(); c.arc(px, py, cs * 0.035, 0, 7); c.fillStyle = '#ffffff'; c.fill(); } }
      c.globalAlpha = 0.25 * (1 - pr); c.beginPath(); c.ellipse(vx, vy, f.r * cs, f.r * cs * 0.42, 0, 0, 7); c.fillStyle = f.col; c.fill();
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
  c.restore();
};
function flake(c, x, y, r, col) { c.save(); c.translate(x, y); c.strokeStyle = col; c.lineWidth = Math.max(1, r * 0.22); for (var i = 0; i < 3; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.moveTo(r * 0.55, 0); c.lineTo(r * 0.8, -r * 0.25); c.moveTo(r * 0.55, 0); c.lineTo(r * 0.8, r * 0.25); c.moveTo(-r * 0.55, 0); c.lineTo(-r * 0.8, -r * 0.25); c.moveTo(-r * 0.55, 0); c.lineTo(-r * 0.8, r * 0.25); c.stroke(); } c.restore(); }
function stepDraw(c, f, X, Y, cs, tt) {
  var dt = Math.max(0, Math.min(0.05, tt - (f.pt || 0))); f.pt = tt;
  if (dt) {
    f.vz -= f.g * dt; var dr = Math.max(0, 1 - f.drag * dt); f.vx *= dr; f.vy *= dr; if (f.g < 3) f.vz = Math.max(f.vz, -0.9);
    f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt; f.rot += f.vr * dt;
    if (f.z < 0) { f.z = 0; if (f.vz < -0.6 && f.g >= 3) { f.vz = -f.vz * 0.38; f.vx *= 0.55; f.vy *= 0.55; f.vr *= 0.5; } else { f.vz = 0; f.vx *= 0.7; f.vy *= 0.7; f.vr = 0; } }
  }
  var life = f.dur - (f.d || 0), a = Math.min(1, (life - tt) / 0.25, tt / 0.04 + 0.2), px = X(f.x), py = Y(f.y) - f.z * cs, s = f.s * cs, k = f.pk;
  if (f.z > 0.05 && (k === 'coin' || k === 'chunk' || k === 'shard')) { c.globalAlpha = 0.18 * a; c.beginPath(); c.ellipse(px, Y(f.y), s, s * 0.35, 0, 0, 7); c.fillStyle = '#28386e'; c.fill(); }
  c.globalAlpha = Math.max(0, a); c.translate(px, py);
  // 2.12: поворот и сплющивание — у холста, сама частица — готовой картинкой (v30o rotSprite), иначе каждая — несколько штрихов за кадр
  if (k === 'flake') c.rotate(f.rot * 0.3);
  else if (k === 'shard' || k === 'chip' || k === 'crumb') c.rotate(f.rot);
  else if (k === 'star' || k === 'spark' || k === 'glit') { var tw = k === 'glit' ? 0.5 + 0.5 * Math.sin(tt * 20 + f.ph) : 1; c.rotate(f.rot * 0.2); c.globalAlpha = Math.max(0, a * tw); }
  else if (k === 'petal') { c.rotate(f.rot); c.scale(1, Math.max(0.3, Math.abs(Math.cos(tt * 5 + f.ph)))); }
  else if (k === 'leaf') { c.rotate(f.rot); c.scale(1, Math.max(0.3, Math.abs(Math.cos(tt * 4 + f.ph)))); }
  else if (k === 'heart') c.rotate(f.rot * 0.15);
  else if (k === 'coin') c.scale(Math.max(0.15, Math.abs(Math.cos(f.rot))), 1);
  var sq = Math.max(0.5, Math.round(s * 2) / 2);
  if (Z.rotSprite && Z.rotSprite('hxp|' + k + '|' + f.col + '|' + sq, 0, 0, sq * 3.4, sq * 3.4, sq * 1.7, sq * 1.7, function () { pbody(D.ctx, k, sq, f.col); })) return;
  pbody(c, k, s, f.col);
}
function pbody(c, k, s, col) {
  if (k === 'flake') { flake(c, 0, 0, s, col); }
  else if (k === 'shard') { c.beginPath(); c.moveTo(0, -s * 1.5); c.lineTo(s * 0.5, 0); c.lineTo(0, s * 1.2); c.lineTo(-s * 0.5, 0); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = '#4f9bd0'; c.lineWidth = Math.max(0.8, s * 0.22); c.stroke(); }
  else if (k === 'star' || k === 'spark' || k === 'glit') { c.beginPath(); for (var i = 0; i < 8; i++) { var an = i * Math.PI / 4, r2 = i % 2 ? s * (k === 'spark' ? 0.25 : 0.38) : s * (k === 'glit' ? 0.8 : 1.15); c.lineTo(Math.cos(an) * r2, Math.sin(an) * r2); } c.closePath(); c.fillStyle = col; c.fill(); }
  else if (k === 'petal') { c.beginPath(); c.ellipse(0, 0, s * 1.1, s * 0.6, 0, 0, 7); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(160,40,90,0.6)'; c.lineWidth = Math.max(0.8, s * 0.15); c.stroke(); }
  else if (k === 'leaf') { c.beginPath(); c.moveTo(-s * 1.2, 0); c.quadraticCurveTo(0, -s * 0.8, s * 1.2, 0); c.quadraticCurveTo(0, s * 0.8, -s * 1.2, 0); c.fillStyle = col; c.fill(); c.strokeStyle = '#1f7a4b'; c.lineWidth = Math.max(0.8, s * 0.15); c.stroke(); }
  else if (k === 'heart') { c.beginPath(); c.moveTo(0, s * 0.9); c.bezierCurveTo(-s * 1.3, 0, -s * 0.6, -s * 1.1, 0, -s * 0.35); c.bezierCurveTo(s * 0.6, -s * 1.1, s * 1.3, 0, 0, s * 0.9); c.fillStyle = col; c.fill(); c.strokeStyle = '#a8225a'; c.lineWidth = Math.max(0.8, s * 0.15); c.stroke(); }
  else if (k === 'coin') { c.beginPath(); c.arc(0, 0, s, 0, 7); c.fillStyle = '#ffd54a'; c.fill(); c.strokeStyle = '#b07d10'; c.lineWidth = Math.max(0.8, s * 0.2); c.stroke(); c.beginPath(); c.arc(0, 0, s * 0.55, 0, 7); c.stroke(); }
  else if (k === 'chip' || k === 'crumb') { c.beginPath(); c.moveTo(-s, -s * 0.4); c.lineTo(s * 0.7, -s); c.lineTo(s, s * 0.5); c.lineTo(-s * 0.3, s); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(40,30,20,0.5)'; c.lineWidth = Math.max(0.7, s * 0.15); c.stroke(); }
  else { c.beginPath(); c.arc(0, 0, s, 0, 7); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(80,110,160,0.5)'; c.lineWidth = Math.max(0.7, s * 0.15); c.stroke(); }
}

// ---------- удар героя ----------
function txt(s, x, y, col, sz) { if (Z._ && Z._.addText) Z._.addText(s, x, y, col, 0.8, sz || 0.85); }
function moroz(H, pal) {
  var dir = H.dir || 1, ix = H.x + dir * 0.32, iy = H.y, g = G(), sk = hsk(H), D0 = 0.25;
  // замах 0,25 с (анимация удлиняется до 0,5 с), удар посохом о землю — в момент касания
  H._long = 1; sndA('m_raise', 'freeze', 0.22, { pitch: rnd(0.95, 1.08), gap: 0.2 });
  push({ k: 'hglow', x: ix, y: iy, z: 0.08, r: 0.75, col: '#ffffff', dur: D0 + 0.2, d: D0 });
  push({ k: 'hwave', x: ix, y: iy, r: H.r * 1.05, col: pal.glow, col2: pal.c[1], cracks: true, seed: R() * 6, dur: D0 + 0.55, d: D0 });
  var ns = 6;
  for (var i = 0; i < ns; i++) { var a = -0.25 + (i / (ns - 1)) * (Math.PI + 0.5) + rnd(-0.15, 0.15), rr = H.r * rnd(0.35, 0.85), dd = D0 + 0.03 + rr * 0.12; push({ k: 'hspike', x: ix + Math.cos(a) * rr, y: iy + Math.sin(a) * rr * 0.6, h: rnd(0.22, 0.38), w: rnd(0.05, 0.08), tilt: Math.cos(a) * 0.35, col: sk ? pal.c[1] : '#bfefff', ol: sk === 'gold' ? '#b07d10' : sk === 'rose' ? '#a8225a' : sk === 'night' ? '#4b3a9a' : sk === 'mint' ? '#1f7a4b' : '#3f86c0', dur: dd + 0.65 + R() * 0.2, d: dd }); }
  burst(ix, iy, 0.05, pal, 16, { d: D0, sp: 1.8, dur: D0 + 0.9 });
  for (var j = 0; j < 8; j++) part(ix, iy, 0.05, { k: ['chunk'], c: ['#ffffff', '#eef6ff'] }, { d: D0, sp: rnd(0.4, 1.2), vz: rnd(1.5, 2.6), dur: D0 + 0.8, s: 0.8 });
  for (var j2 = 0; j2 < 5; j2++) part(ix, iy, 2.5, { k: ['flake'], c: ['#ffffff', pal.c[0]] }, { sp: rnd(0.2, 0.5), vz: rnd(0.4, 1.0), g: 1.2, dur: 1, s: 0.8 });
  later(D0 * 1000, function () {
    sndA('m_slam', 'ice_break', 0.5, { pitch: rnd(0.94, 1.06), gap: 0.2 }); if (has('m_spikes')) snd('m_spikes', 0.22, { pitch: rnd(0.95, 1.1), gap: 0.2 }); else snd('timp4', 0.18, { pitch: 1.5, gap: 0.2 });
    g.shake = Math.max(g.shake || 0, 0.12); react(ix, iy, H.r + 0.1);
  });
}
function onAttack(H, aoe) {
  var g = G(), pal = palOf(H), sk = hsk(H), last = g.shots[g.shots.length - 1], shot = !aoe && last && last.k === 'ally' && !last._hx ? last : null, dir = H.dir || 1;
  if (shot) { shot._hx = 1; shot.hero = H.type; shot.hsk = sk; shot.hU = H; }
  if (H.type === 'moroz' && aoe) moroz(H, pal);
  else if (aoe) {
    if (H.type === 'plombir') { push({ k: 'hslash', x: H.x + dir * 0.15, y: H.y, r: 0.55, dir: dir, col: pal.glow, dur: 0.3 }); later(120, function () { snd('metal', 0.16, { pitch: rnd(1.2, 1.4), gap: 0.15 }); }); }
    else if (H.type === 'kot') push({ k: 'hclaw', x: H.x + dir * 0.35, y: H.y, col: pal.glow, dur: 0.3 });
    push({ k: 'hwave', x: H.x + dir * 0.2, y: H.y, r: H.r, col: pal.glow, col2: pal.c[0], dur: 0.45, d: 0.08 });
    burst(H.x + dir * 0.35, H.y, 0.3, pal, 9, { d: 0.1 });
    later(100, function () { sndA('h_impact', 'crack', 0.3, { pitch: rnd(0.9, 1.15), gap: 0.08, gapKey: 'hm' + H.type }); react(H.x + dir * 0.3, H.y, H.r + 0.1); G().shake = Math.max(G().shake || 0, 0.04); });
  } else {
    // выстрел: искры у руки
    var hx = H.x + dir * 0.25; burst(hx, H.y, 0.75, pal, 4, { sp: 0.7, vz: 0.6, dur: 0.45 });
  }
  if (sk && PAL[sk]) { var q = PAL[sk].snd; if (has('sk_' + sk)) snd('sk_' + sk, 0.22, { pitch: rnd(0.95, 1.06), gap: 0.12, gapKey: 'hs' + H.type }); else snd(q[0], q[1], { pitch: q[2] * rnd(0.95, 1.05), gap: 0.12, gapKey: 'hs' + H.type }); }
  // свойства облика для ударов по площади (по снаряду — при попадании)
  if (aoe && sk) {
    var hit = g.enemies.filter(function (e) { return Math.hypot(e.x - H.x, e.y - H.y) <= H.r + 0.05; });
    perkHit(H, sk, hit, H.dmg);
  } else if (sk === 'mint' || sk === 'rose') perkHit(H, sk, [], 0);
}
function perkHit(H, sk, list, dmg) {
  var g = G();
  if (sk === 'ice') list.forEach(function (e) { if (!e.dead && !e.boss) { e.slow = Math.max(e.slow || 0, 0.25); e.slowT = Math.max(e.slowT || 0, 1); } });
  if (sk === 'night' && R() < 0.15 && list.length) {
    var p0 = null; list.forEach(function (e) { if (!e.dead) { Z.damage(e, dmg, {}); p0 = p0 || e; } });
    if (p0) { txt('×2!', p0.x, p0.y - 0.9, '#c9a6ff', 1.05); burst(p0.x, p0.y, 0.4, PAL.night, 8, {}); sndA('hit_crit', 'magic_ball', 0.3, { pitch: rnd(0.95, 1.1), gap: 0.2 }); }
  }
  if (sk === 'mint' && H.hp < H.max) { H.hp = Math.min(H.max, H.hp + H.max * 0.04); burst(H.x, H.y, 0.6, PAL.mint, 3, { sp: 0.4, vz: 1, dur: 0.7 }); }
  if (sk === 'rose') H._rose = 1;
  if (sk === 'gold') list.forEach(function (e) { if (e.dead && !e._gc) { e._gc = 1; g.coins += 1; txt('+1', e.x + 0.2, e.y - 0.6, '#ffd54a', 0.85); burst(e.x, e.y, 0.3, PAL.gold, 4, { k: 'coin' }); } });
}
var oldSnd = Z.heroAtkSnd;
Z.heroAtkSnd = function (H, aoe) {
  var r = H.type === 'moroz' && aoe ? true : (oldSnd ? oldSnd(H, aoe) : false);   // у Деда Мороза свой звук: замах, затем удар в момент касания
  try { onAttack(H, aoe); } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};
// попадание снаряда героя
var IMP = { sneg: 'ice', belka: 'wood', eskimo: 'snow', vasilisa: 'magic', emelya: 'snow' };
var oldHit = Z.hk.allyHit;
Z.hk.allyHit = function (s) {
  var g = G(), wasDead = s.tgt && s.tgt.dead, r = oldHit ? oldHit(s) : false;
  if (s.hero) try {
    var H = s.hU, pal = palOf(H, s.hero), x = s.tx, y = s.ty + 0.2, tp = IMP[s.hero];
    burst(x, y, 0.35, pal, s.big || s.ult ? 12 : 6, { sp: 1.1, dur: 0.7 });
    push({ k: 'hglow', x: x, y: y, z: 0.35, r: 0.32, col: pal.glow, dur: 0.18 });
    if (tp === 'ice') { for (var i = 0; i < 3; i++) push({ k: 'hspike', x: x + rnd(-0.18, 0.18), y: y + rnd(-0.08, 0.08), h: rnd(0.12, 0.2), w: 0.035, tilt: rnd(-0.4, 0.4), col: pal.c[1], ol: '#3f86c0', dur: 0.5 }); snd('ice', 0.12, { pitch: rnd(1.8, 2.1), gap: 0.08, gapKey: 'hi' + s.hero }); }
    else if (tp === 'wood') snd('tap', 0.14, { pitch: rnd(0.8, 0.95), gap: 0.08, gapKey: 'hi' + s.hero });
    else if (tp === 'magic') { push({ k: 'hwave', x: x, y: y, r: 0.45, col: pal.glow, col2: pal.c[0], dur: 0.35 }); snd('magic_ball', 0.12, { pitch: 1.6, gap: 0.12, gapKey: 'hi' + s.hero }); }
    if (H && s.hsk && s.tgt) { var hk = s.tgt; if (!wasDead) perkHit(H, s.hsk, [hk], s.dmg || 0); }
  } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};
// приём героя: большой эффект
var oldUlt = Z.castUlt;
Z.castUlt = function (H, x, y, manual) {
  var r = oldUlt.apply(this, arguments);
  if (r !== false && H && !H.dead) try {
    var pal = palOf(H), g = G();
    if (H.type === 'moroz') {
      push({ k: 'hvortex', x: H.x, y: H.y, r: 1.9, col: pal.glow, dur: 1.3 });
      push({ k: 'hwave', x: H.x, y: H.y, r: 2.1, col: pal.glow, col2: pal.c[1], cracks: true, seed: R() * 6, dur: 0.9 });
      for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2, rr = rnd(0.9, 1.8); push({ k: 'hspike', x: H.x + Math.cos(a) * rr, y: H.y + Math.sin(a) * rr * 0.6, h: rnd(0.35, 0.6), w: rnd(0.07, 0.11), tilt: Math.cos(a) * 0.3, col: pal.c[1], ol: '#3f86c0', dur: 1.3, d: 0.05 + i * 0.03 }); }
      burst(H.x, H.y, 0.2, pal, 26, { sp: 2.4, vz: 3.4 });
      if (has('m_ult')) snd('m_ult', 0.55); else later(60, function () { snd('ice_break', 0.4, { pitch: 0.9 }); });
    } else {
      push({ k: 'hwave', x: H.x, y: H.y, r: 2, col: pal.glow, col2: pal.c[0], dur: 0.8 });
      push({ k: 'hglow', x: H.x, y: H.y, z: 0.6, r: 1, col: pal.glow, dur: 0.45 });
      burst(H.x, H.y, 0.4, pal, 22, { sp: 2.2, vz: 3 });
    }
    var sk = hsk(H); if (sk && PAL[sk]) { var q = PAL[sk].snd; if (has('sk_' + sk)) snd('sk_' + sk, 0.4, { pitch: 0.85 }); else snd(q[0], 0.35, { pitch: q[2] * 0.9 }); }
  } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};
// Розовый облик: перезарядка короче (после того как игра выставила её)
var oldU = Z.hk.ult;
Z.hk.ult = function (g, H, dt) { runQ(); if (H._long) { H._long = 0; if (H.atk > 0 && H.atk < 0.5) H.atk = 0.5; } if (H._rose) { H._rose = 0; H.cd *= 0.88; } return oldU ? oldU(g, H, dt) : undefined; };
var paE = D.ally;
D.ally = function (type, x, y, R, o) { var self = this, args = arguments; if (type === 'eskimo' && Z.skinWrapAlly) return Z.skinWrapAlly(type, x, y, R, o || {}, function () { return paE.apply(self, args); }); return paE.apply(this, arguments); };
var lastT = -1;
// облик героя: лёгкое сияние частиц вокруг героя в бою (не в меню)
setInterval(function () {
  var g = Z.G; if (!g || !g.squad || !Z.ui || Z.ui.screen !== 'level' || Z.ui.modal || g.t === lastT) return; lastT = g.t;
  g.squad.forEach(function (H) { var sk = !H.dead && hsk(H); if (!sk || !PAL[sk] || R() > 0.6) return; part(H.x + rnd(-0.3, 0.3), H.y + rnd(-0.1, 0.1), rnd(0.3, 1.1), PAL[sk], { sp: 0.15, vz: sk === 'gold' || sk === 'night' ? 0.4 : 0.1, g: 0.6, dur: 1.1, s: 0.8, k: PAL[sk].k[1] }); });
}, 450);
})();
