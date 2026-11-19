/* 2.11.5 · главное меню живее и аккуратнее:
   - реплики в меню заканчиваются (раньше таймер субтитра шёл только в бою — облачко Мороза висело, остальные молчали);
   - задний ряд героев стоит на снежной террасе, а не на почти невидимых сугробах;
   - на узком экране враги тоже есть: Змей Горыныч пролетает по небу (нажми — рыкнет и умчится), Метелица проносится вьюгой;
   - эффекты: сияние огней ёлки и звезды, искры от подарков, падающие звёзды, мягкое затемнение по краям, искры и кольцо от нажатия;
   - в бою: вспышка и разлёт искр при победе над врагом. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui;
function inMenu() { return UI && UI.screen === 'menu' && !UI.modal; }
function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
var geo = null;   // последняя раскладка меню: W, H, ground, th, s, wide

// ---------- терраса для заднего ряда ----------
Z.menuTerrace = function (W, ground, th, s) {
  var base = ground - th * (geo && geo.H > W * 1.25 ? 0.4 : 0.27);   // высокий экран — терраса выше, ряды не слипаются
  return { y: function (x) { return base + Math.sin(x / W * Math.PI * 2.6 + 0.6) * th * 0.025; } };
};
function terrace(c, W, ground, th, s, t) {
  var TR = Z.menuTerrace(W, ground, th, s);
  // ёлочки за террасой
  for (var i = 0; i < 14; i++) { var fx = W * (i + 0.5) / 14 + (rnd(i) - 0.5) * W * 0.04, fy = TR.y(fx) + 2 * s, fh = th * (0.1 + rnd(i + 3) * 0.08); if (fx > W * 0.32 && fx < W * 0.68) continue;
    c.fillStyle = '#2b4685'; for (var k = 0; k < 3; k++) { var yy = fy - fh * 0.3 * k, w = fh * (0.42 - 0.1 * k); c.beginPath(); c.moveTo(fx, yy - fh * 0.45); c.lineTo(fx - w, yy); c.lineTo(fx + w, yy); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(235,244,255,0.8)'; c.beginPath(); c.moveTo(fx, fy - fh * 1.05); c.lineTo(fx - fh * 0.1, fy - fh * 0.86); c.lineTo(fx + fh * 0.1, fy - fh * 0.86); c.fill(); }
  // сам снежный уступ
  c.beginPath(); c.moveTo(-10, ground + 60 * s); for (var x = -10; x <= W + 10; x += 8) c.lineTo(x, TR.y(x)); c.lineTo(W + 10, ground + 60 * s); c.closePath();   // до самой земли — без щелей под волнистым краем
  var g = c.createLinearGradient(0, ground - th * 0.3, 0, ground); g.addColorStop(0, '#f6f9ff'); g.addColorStop(0.45, '#dfe8fb'); g.addColorStop(1, '#b9c8ec'); c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(60,80,140,0.55)'; c.lineWidth = 2.5 * s; c.beginPath(); for (x = -10; x <= W + 10; x += 8) c[x < -9 ? 'moveTo' : 'lineTo'](x, TR.y(x)); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 1.5 * s; c.beginPath(); for (x = -10; x <= W + 10; x += 8) c[x < -9 ? 'moveTo' : 'lineTo'](x, TR.y(x) + 3 * s); c.stroke();
  // фонари на террасе — тёплый свет
  [0.3, 0.7].forEach(function (q, j) { var lx = W * (q < 0.5 ? 0.3 : 0.7) + (q < 0.5 ? -1 : 1) * th * 0.32, ly = TR.y(lx) + 3 * s, lh = th * 0.2, fl = 0.85 + 0.15 * Math.sin(t * 9 + j * 3) * Math.sin(t * 5.3 + j);
    c.strokeStyle = '#1b2448'; c.lineWidth = 3.5 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx, ly - lh); c.stroke(); c.strokeStyle = '#3c4f8c'; c.lineWidth = 1.8 * s; c.stroke();
    var gl = c.createRadialGradient(lx, ly - lh, 0, lx, ly - lh, lh * 0.9 * fl); gl.addColorStop(0, 'rgba(255,220,140,0.6)'); gl.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = gl; c.fillRect(lx - lh, ly - lh * 2, lh * 2, lh * 2);
    D.rr(lx - lh * 0.12, ly - lh * 1.18, lh * 0.24, lh * 0.26, lh * 0.05); c.fillStyle = '#ffe9a0'; c.fill(); c.lineWidth = 2 * s; c.strokeStyle = '#1b2448'; c.stroke();
    c.beginPath(); c.moveTo(lx - lh * 0.17, ly - lh * 1.18); c.lineTo(lx, ly - lh * 1.32); c.lineTo(lx + lh * 0.17, ly - lh * 1.18); c.closePath(); c.fillStyle = '#2b3a6e'; c.fill(); c.stroke();
    D.ell(lx, ly - lh * 1.34, lh * 0.14, lh * 0.05, '#ffffff'); });
  // блёстки на снегу
  for (i = 0; i < 18; i++) { var bx = rnd(i + 40) * W, by = TR.y(bx) + (6 + rnd(i + 60) * 0.7 * th * 0.2) * s, k2 = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7); if (k2 < 0.75) continue; c.globalAlpha = (k2 - 0.75) * 4; D.star(bx, by, 2.5 * s, '#ffffff'); }
  c.globalAlpha = 1;
}

// ---------- небо: враги пролетают ----------
var gor = { speed: 1, roarT: -9, kick: 0 };
function gorPos(W, H, top, ground, th, s, t) {
  var per = 17, ph = ((t + 6) % per) / per, dur = 0.55; if (ph > dur) return null;
  var u = ph / dur; if (gor.kick && t - gor.kick < 3) u = Math.min(1, u + (t - gor.kick) * 0.25);
  var R = Math.min(th * (geo && geo.wide ? 0.14 : 0.11), W * 0.08), x = W * (1.15 - u * 1.3), y = Math.max(top + Math.max(30 * s, (ground - th - top) * 0.45), 86 * s + R * 2.6) + Math.sin(u * Math.PI * 3) * 12 * s;
  return { x: x, y: y, R: R };
}
function drawGor(c, p, t, s) {
  var cs = p.R / (0.31 * Z.ENEMIES.gorynych.size);
  c.save(); c.globalAlpha = 0.92;
  D.enemy({ type: 'gorynych', size: Z.ENEMIES.gorynych.size, dir: -1, walk: t * 6, ph: 0, hitT: 0, slow: 0, kb: 0, air: false, mortal: true, headsLost: 0 }, p.x, p.y, cs, t * 2.2);
  c.restore();
  if (t - gor.roarT < 1) { var q = t - gor.roarT; c.globalAlpha = 1 - q; c.strokeStyle = '#ffd54a'; c.lineWidth = 3 * s; for (var r = 0; r < 3; r++) { c.beginPath(); c.arc(p.x - p.R * 1.2, p.y - p.R * 1.4, p.R * (0.4 + q * 1.5 + r * 0.35), 2.2, 4.0); c.stroke(); } c.globalAlpha = 1; }
}
function metSwoop(c, W, top, ground, th, s, t) {
  var per = 31, ph = ((t + 19) % per) / per, dur = 0.22; if (ph > dur) return;
  var u = ph / dur, x = W * (-0.15 + u * 1.3), y = top + (ground - th - top) * 0.25 + Math.sin(u * Math.PI) * -20 * s, R = Math.min(th * 0.08, W * 0.06);
  for (var i = 1; i < 14; i++) { c.globalAlpha = 0.5 * (1 - i / 14); D.flake(x - i * R * 0.35, y - R * 1.0 + Math.sin(t * 8 + i) * R * 0.2, R * 0.12, '#ffffff', 1); }
  c.globalAlpha = 1; c.save(); c.translate(x, y); c.rotate(0.18); D.metelitsa(0, 0, R, { dir: 1, noTalk: true }); c.restore();
}

// ---------- замок Кощея вдали: Кощей иногда выглядывает из башни ----------
var kos = { force: -99 }, castleGeo = null;
function castle(c, W, ground, th, s, t, wide) {
  var port = W < ground * 0.9, ch = th * (wide ? 0.38 : port ? 0.55 : 0.5), cx = W * (wide ? 0.27 : port ? 0.2 : 0.17), by = ground - th * (port ? 0.95 : 0.5);   // на свободном небе слева, на дальней скале
  // скала под замком
  c.fillStyle = '#26326a'; c.beginPath(); c.moveTo(cx - ch * 0.9, ground); c.quadraticCurveTo(cx - ch * 0.75, by + ch * 0.05, cx - ch * 0.45, by); c.lineTo(cx + ch * 0.5, by); c.quadraticCurveTo(cx + ch * 0.8, by + ch * 0.05, cx + ch * 0.95, ground); c.closePath(); c.fill();
  var wall = '#3a4688', dark = '#2a3470', win = 'rgba(125,255,176,' + (0.65 + 0.35 * Math.sin(t * 3.1) * Math.sin(t * 1.7)).toFixed(2) + ')';
  var tower = function (x, w, h, roofH) { c.fillStyle = wall; c.fillRect(x - w / 2, by - h, w, h); c.fillStyle = dark; c.fillRect(x + w * 0.15, by - h, w * 0.35, h);
    c.fillStyle = '#4a347e'; c.beginPath(); c.moveTo(x - w * 0.62, by - h); c.lineTo(x, by - h - roofH); c.lineTo(x + w * 0.62, by - h); c.closePath(); c.fill();
    c.strokeStyle = '#3b2f6e'; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(x, by - h - roofH); c.lineTo(x, by - h - roofH - ch * 0.08); c.stroke(); c.fillStyle = '#7d3cff'; c.beginPath(); c.moveTo(x, by - h - roofH - ch * 0.08); c.lineTo(x + ch * 0.07 + Math.sin(t * 4 + x) * ch * 0.01, by - h - roofH - ch * 0.065); c.lineTo(x, by - h - roofH - ch * 0.05); c.fill();
    c.fillStyle = win; c.beginPath(); c.arc(x, by - h * 0.62, w * 0.14, Math.PI, 0); c.lineTo(x + w * 0.14, by - h * 0.5); c.lineTo(x - w * 0.14, by - h * 0.5); c.fill(); };
  // стена с зубцами
  c.fillStyle = wall; c.fillRect(cx - ch * 0.5, by - ch * 0.32, ch, ch * 0.32);
  for (var m = 0; m < 7; m++) c.fillRect(cx - ch * 0.5 + m * ch * 0.16, by - ch * 0.38, ch * 0.08, ch * 0.07);
  c.fillStyle = dark; c.beginPath(); c.arc(cx, by - ch * 0.08, ch * 0.08, Math.PI, 0); c.lineTo(cx + ch * 0.08, by); c.lineTo(cx - ch * 0.08, by); c.fill();   // ворота
  tower(cx - ch * 0.45, ch * 0.18, ch * 0.55, ch * 0.22); tower(cx + ch * 0.45, ch * 0.18, ch * 0.5, ch * 0.2);
  // главная башня с площадкой — отсюда выглядывает Кощей
  var kw = ch * 0.3, kh = ch * 0.78, ky = by - kh;
  // Кощей: поднимается из-за зубцов, вертит головой, опускается
  var per = 12, ph = (t + 4) % per, up = 0, fk = t - kos.force;
  if (fk >= 0 && fk < 3.2) ph = fk;
  if (ph < 0.7) up = ph / 0.7; else if (ph < 2.5) up = 1; else if (ph < 3.2) up = 1 - (ph - 2.5) / 0.7;
  castleGeo = { x: cx, y: ky, w: kw, ch: ch, up: up };
  if (up > 0) {
    var Rk = ch * 0.21, cs = Rk / (0.31 * Z.ENEMIES.koschei.size), look = Math.sin(t * 2.2) > 0 ? 1 : -1;
    c.save(); c.beginPath(); c.rect(cx - kw, 0, kw * 2, ky + 1); c.clip();
    D.enemy({ type: 'koschei', size: Z.ENEMIES.koschei.size, dir: look, walk: 0, ph: 0, hitT: 0, slow: 0, kb: 0, air: false, mortal: true, headsLost: 0, talk: !!(Z.talkKey && Z.talkKey() === 'KOS') }, cx, ky + Rk * (2.6 - up * 1.55), cs, t);
    c.restore();
  }
  c.fillStyle = wall; c.fillRect(cx - kw / 2, ky, kw, kh); c.fillStyle = dark; c.fillRect(cx + kw * 0.1, ky, kw * 0.4, kh);
  for (m = 0; m < 4; m++) c.fillRect(cx - kw / 2 + m * kw * 0.29, ky - ch * 0.06, kw * 0.14, ch * 0.065);
  c.fillStyle = wall; for (m = 0; m < 4; m++) c.fillRect(cx - kw / 2 + m * kw * 0.29, ky - ch * 0.06, kw * 0.12, ch * 0.065);
  c.fillStyle = 'rgba(200,215,255,0.35)'; c.fillRect(cx - kw / 2, ky, kw * 0.08, kh);
  c.fillStyle = win; c.fillRect(cx - kw * 0.12, ky + kh * 0.22, kw * 0.24, kh * 0.12); c.fillRect(cx - kw * 0.28, ky + kh * 0.5, kw * 0.14, kh * 0.08); c.fillRect(cx + kw * 0.14, ky + kh * 0.5, kw * 0.14, kh * 0.08);
  if (fk >= 0 && fk < 0.5) { c.globalAlpha = 1 - fk * 2; c.strokeStyle = '#9dffcf'; c.lineWidth = 2.5 * s; c.beginPath(); var lx = cx + ch * 0.1, ly = ky - ch * 0.4; c.moveTo(lx, ly); c.lineTo(lx + ch * 0.12, ly + ch * 0.15); c.lineTo(lx + ch * 0.04, ly + ch * 0.18); c.lineTo(lx + ch * 0.18, ly + ch * 0.38); c.stroke(); c.globalAlpha = 1; }
}

// ---------- разбойник крадётся к подаркам, падает в сугроб и удирает ----------
var rob = { t0: 3, slip: -1 }, robGeo = null;
function robber(c, W, ground, th, s, t, wide, yAt, stopX) {
  var cyc = 26, lt = t - rob.t0; if (lt > cyc) { rob.t0 = t; rob.slip = -1; lt = 0; }
  var R = th * 0.15, cs = R / (0.31 * Z.ENEMIES.raz.size), x0 = W * 1.06, x1 = stopX || W * 0.64, slipAt = rob.slip >= 0 ? rob.slip : 7;
  var x, rot = 0, sink = 0, walk = 0, dir = -1, run = false;
  if (lt < slipAt) { var u = lt / 7; x = x0 + (x1 - x0) * u; walk = lt * 5; }
  else { var xs = x0 + (x1 - x0) * Math.min(1, slipAt / 7), q = lt - slipAt; x = xs;
    if (q < 0.35) { rot = -dir * (q / 0.35) * 2.7; sink = q / 0.35; }
    else if (q < 3.2) { rot = -dir * 2.7 + Math.sin(q * 14) * 0.08; sink = 1; }
    else if (q < 3.6) { rot = -dir * 2.7 * (1 - (q - 3.2) / 0.4); sink = 1 - (q - 3.2) / 0.4; }
    else { dir = 1; run = true; x = xs + (q - 3.6) * W * 0.35; walk = q * 14; if (x > W * 1.1) { robGeo = null; return; } }
    if (q >= 0 && !rob.said) { rob.said = 1; try { Z.AU.sfx('hit_snow', 0.6); } catch (e) { if (window.__rep) window.__rep(e); } if (Z.sayLine && !(Z.sub && Z.sub.t > 0.3)) Z.sayLine(['RAZ-09', 'RAZ-10', 'RAZ-06'][Math.floor(Math.random() * 3)], 0.9); for (var i = 0; i < 10; i++) add({ x: x + (Math.random() - 0.5) * R, y: yAt(x), vx: (Math.random() - 0.5) * 90 * s, vy: -(40 + Math.random() * 60) * s, g: 200 * s, life: 0.6, t: 0, r: 2.5 * s, col: '#ffffff' }); }
  }
  if (lt < 0.1) rob.said = 0;
  var gy = yAt(x) + 2 * s;
  robGeo = { x: x, y: gy, R: R, sneaking: lt < slipAt };
  c.save();
  if (sink > 0) { c.beginPath(); c.rect(x - R * 3, 0, R * 6, gy + 1); c.clip(); }
  c.translate(x, gy - (run ? Math.abs(Math.sin(walk)) * R * 0.15 : 0)); c.rotate(rot); c.translate(0, sink * R * 1.1);
  // мешок за спиной
  if (!run || true) { c.save(); c.scale(dir, 1); D.ell(R * 0.55, -R * 0.95, R * 0.38, R * 0.42, '#b88a52', Math.max(1.2, R * 0.1)); c.strokeStyle = '#7a5a30'; c.lineWidth = R * 0.06; c.beginPath(); c.moveTo(R * 0.4, -R * 1.3); c.lineTo(R * 0.7, -R * 1.3); c.stroke(); c.restore(); }
  var nb = D.noBarrel; D.noBarrel = true;
  D.enemy({ type: 'raz', size: Z.ENEMIES.raz.size, dir: dir, walk: walk, ph: 0, hitT: 0, slow: 0, kb: 0, air: false, talk: !!(Z.talkKey && Z.talkKey() === 'RAZ') }, 0, 0, cs, t);
  D.noBarrel = nb;
  c.restore();
  if (lt < slipAt && lt > 0.5) { c.globalAlpha = 0.7; D.text('?', x - R * 0.2, gy - R * 2.6 + Math.sin(t * 5) * 2 * s, R * 0.5, '#ffd54a', 'center', 'middle', 2 * s); c.globalAlpha = 1; }   // озирается
  if (sink >= 1 && lt - slipAt < 3.2) { c.globalAlpha = 0.85; D.text('!?', x, gy - R * 1.7, R * 0.5, '#ffffff', 'center', 'middle', 2 * s); c.globalAlpha = 1; }
}

// ---------- разбойник прячется в подарке у ёлки: крышка приподнимается, озирается, прячется; нажми — выскочит и удерёт ----------
var box = { t0: 0, out: -99 }, boxGeo = null;
function giftRobber(c, W, ground, th, s, t) {
  var bw = th * 0.16, bh = th * 0.13, bx = W / 2 + th * 0.27, by = ground + 4 * s, lt = (t + 5) % 15, peek = 0, ot = t - box.out;
  if (lt > 2 && lt < 5.5) { var u = lt - 2; peek = u < 0.5 ? u / 0.5 : u > 3 ? (3.5 - u) / 0.5 : 1; }
  var jump = ot >= 0 && ot < 2.2, shake = peek > 0 && peek < 1 ? Math.sin(t * 40) * 1.2 * s : 0;
  boxGeo = { x: bx, y: by - bh, w: bw, h: bh, R: bw * 0.9 };
  var R = bw * 0.62, cs = R / (0.31 * Z.ENEMIES.raz.size), nb = D.noBarrel, lid = jump ? Math.min(1, ot * 4) * 1.2 : peek * 0.55;
  // тень и задняя стенка
  D.ell(bx, by, bw * 0.75, bh * 0.15, 'rgba(30,40,80,0.2)');
  if (jump) {   // выпрыгнул: дуга вверх и бегом за край экрана
    var jx = bx + ot * W * 0.32, jy = by - bh - Math.max(0, Math.sin(Math.min(1, ot / 0.6) * Math.PI)) * th * 0.25;
    D.noBarrel = true; c.save(); c.translate(jx, jy); c.rotate(ot < 0.6 ? ot * 1.2 : 0);
    D.enemy({ type: 'raz', size: Z.ENEMIES.raz.size, dir: 1, walk: t * 14, ph: 0, hitT: 0, slow: 0, kb: 0, air: false, talk: !!(Z.talkKey && Z.talkKey() === 'RAZ') }, 0, 0, cs, t);
    c.restore(); D.noBarrel = nb;
    for (var dsh = 0; dsh < 3; dsh++) { c.globalAlpha = 0.5 - dsh * 0.15; D.circ(jx - (dsh + 1) * R * 0.5, by - R * 0.1, R * (0.18 + dsh * 0.06), '#ffffff'); } c.globalAlpha = 1;
    robGeo2 = { x: jx, y: jy, R: R };
  } else if (peek > 0) {
    c.save(); c.beginPath(); c.rect(bx - bw, 0, bw * 2, by - bh + 1); c.clip();
    D.noBarrel = true; var look = Math.sin(t * 3) > 0 ? 1 : -1;
    D.enemy({ type: 'raz', size: Z.ENEMIES.raz.size, dir: look, walk: 0, ph: 0, hitT: 0, slow: 0, kb: 0, air: false, talk: !!(Z.talkKey && Z.talkKey() === 'RAZ') }, bx + shake, by - bh + R * (2.0 - peek * 0.75), cs, t);
    D.noBarrel = nb; c.restore();
    robGeo2 = { x: bx, y: by - bh, R: R };
  } else robGeo2 = null;
  // коробка спереди
  D.rr(bx - bw / 2 + shake, by - bh, bw, bh, bw * 0.06); c.fillStyle = '#4cc77d'; c.fill(); c.lineWidth = Math.max(1.5, bw * 0.05); c.strokeStyle = '#1b2448'; c.stroke();
  c.fillStyle = '#ffd54a'; c.fillRect(bx - bw * 0.07 + shake, by - bh, bw * 0.14, bh); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(bx - bw * 0.42 + shake, by - bh * 0.9, bw * 0.08, bh * 0.75);
  // крышка на петле слева
  c.save(); c.translate(bx - bw * 0.55 + shake, by - bh); c.rotate(-lid);
  D.rr(0, -bh * 0.24, bw * 1.1, bh * 0.26, bw * 0.05); c.fillStyle = '#5ad88d'; c.fill(); c.lineWidth = Math.max(1.5, bw * 0.05); c.strokeStyle = '#1b2448'; c.stroke();
  c.fillStyle = '#ffd54a'; c.fillRect(bw * 0.48, -bh * 0.24, bw * 0.14, bh * 0.26);
  [-1, 1].forEach(function (d) { c.beginPath(); c.ellipse(bw * 0.55 + d * bw * 0.16, -bh * 0.34, bw * 0.17, bw * 0.09, d * 0.5, 0, 7); c.fillStyle = '#ffd54a'; c.fill(); c.stroke(); });
  c.restore();
}
var robGeo2 = null;

// ---------- Соловей-разбойник на дубе ----------
var sol = { wh: -9 }, solGeo = null;
function solovey(c, x, gy, R, t, s) {
  var whT = t - sol.wh, cs = R / (0.31 * Z.ENEMIES.solovey.size), e = { type: 'solovey', size: Z.ENEMIES.solovey.size, dir: -1, walk: 0, ph: 0, hitT: 0, slow: 0, kb: 0, air: false, whistle: whT < 1.6 ? 1 : 0, snore: whT > 6 && (t % 20) > 12 ? 1 : 0, talk: !!(Z.talkKey && Z.talkKey() === 'SOL') };
  D.enemy(e, x, gy, cs, t);
  solGeo = { x: x, y: gy, R: R };
  if (whT < 1.6) for (var i = 0; i < 3; i++) { var q = (whT * 1.4 + i * 0.3) % 1; c.globalAlpha = 1 - q; c.strokeStyle = '#ffffff'; c.lineWidth = 2.2 * s; c.beginPath(); c.arc(x - R * 0.9 - q * R * 2.2, gy - R * 2.0, R * (0.25 + q * 0.5), 2.4, 3.9); c.stroke(); }
  c.globalAlpha = 1;
}

// ---------- частицы и эффекты ----------
var P = [], rip = [], shoot = null, lastT = 0;
function add(o) { if (P.length < 260) P.push(o); }
function burst(x, y, n, s, cols) { for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, v = (60 + Math.random() * 140) * s; add({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * s, g: 160 * s, life: 0.7 + Math.random() * 0.4, t: 0, r: (2 + Math.random() * 3) * s, col: cols[i % cols.length], star: Math.random() < 0.4 }); } }
function stepFx(dt, W, H, s) {
  for (var i = P.length - 1; i >= 0; i--) { var p = P[i]; p.t += dt; if (p.t > p.life) { P.splice(i, 1); continue; } p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.5; }
  for (i = rip.length - 1; i >= 0; i--) { rip[i].t += dt; if (rip[i].t > 0.6) rip.splice(i, 1); }
}
function drawFx(c, s) {
  c.save(); c.globalCompositeOperation = 'lighter';
  P.forEach(function (p) { var a = Math.max(0, 1 - p.t / p.life); c.globalAlpha = a; if (p.star) D.star(p.x, p.y, p.r * 1.6, p.col); else { var g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5); g.addColorStop(0, p.col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(p.x - p.r * 2.5, p.y - p.r * 2.5, p.r * 5, p.r * 5); } });
  rip.forEach(function (r) { var q = r.t / 0.6; c.globalAlpha = (1 - q) * 0.8; c.strokeStyle = '#bfe8ff'; c.lineWidth = 3 * s * (1 - q); c.beginPath(); c.arc(r.x, r.y, 8 * s + q * 46 * s, 0, 7); c.stroke(); });
  c.restore(); c.globalAlpha = 1;
}
function treeGlow(c, W, ground, th, s, t) {
  var cx = W / 2, top = ground - th;
  c.save(); c.globalCompositeOperation = 'lighter';
  // звезда на верхушке
  var k = 0.7 + 0.3 * Math.sin(t * 2.3), sy = top + th * 0.05, g = c.createRadialGradient(cx, sy, 0, cx, sy, th * 0.32 * k);
  g.addColorStop(0, 'rgba(255,240,170,0.55)'); g.addColorStop(0.4, 'rgba(255,210,110,0.18)'); g.addColorStop(1, 'rgba(255,200,100,0)'); c.fillStyle = g; c.fillRect(cx - th * 0.4, sy - th * 0.4, th * 0.8, th * 0.8);
  // огни гирлянды — мерцающие ореолы по ярусам
  var cols = ['255,90,95', '255,213,74', '90,200,255', '157,255,106', '255,143,214'];
  for (var i = 0; i < 16; i++) { var tier = i % 4, fy = ground - th * (0.2 + tier * 0.2) - th * 0.03, w = th * 0.36 * (1 - tier * 0.2), fx = cx + (rnd(i + 7) - 0.5) * w * 1.4, b = 0.5 + 0.5 * Math.sin(t * (2 + rnd(i) * 3) + i * 1.9);
    if (b < 0.45) continue; var rr = th * 0.032 * b, gg = c.createRadialGradient(fx, fy, 0, fx, fy, rr * 2); gg.addColorStop(0, 'rgba(' + cols[i % 5] + ',' + (0.38 * b).toFixed(2) + ')'); gg.addColorStop(1, 'rgba(' + cols[i % 5] + ',0)'); c.fillStyle = gg; c.fillRect(fx - rr * 2, fy - rr * 2, rr * 4, rr * 4); }
  c.restore();
}
function shootingStar(c, W, H, s, t, dt) {
  if (!shoot && Math.random() < dt * 0.12) shoot = { x: W * (0.2 + Math.random() * 0.7), y: H * (0.05 + Math.random() * 0.2), t: 0 };
  if (!shoot) return; shoot.t += dt; var q = shoot.t / 0.9; if (q > 1) { shoot = null; return; }
  var x = shoot.x - q * 180 * s, y = shoot.y + q * 70 * s, g = c.createLinearGradient(x, y, x + 70 * s, y - 27 * s);
  g.addColorStop(0, 'rgba(255,255,255,' + (1 - q).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.strokeStyle = g; c.lineWidth = 2.2 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 70 * s, y - 27 * s); c.stroke();
}
function vignette(c, W, H, gy) {   // рисуется в фоне, до земли: снег её закрывает — затемнено только небо
  var g = c.createRadialGradient(W / 2, gy, Math.min(W, H) * 0.3, W / 2, gy, Math.max(W, H) * 0.85);
  g.addColorStop(0, 'rgba(10,14,40,0)'); g.addColorStop(1, 'rgba(10,14,40,0.34)'); c.fillStyle = g; c.fillRect(0, 0, W, gy + 20);
}

// ---------- фон: терраса и небо ----------
var oBack = Z.menuBack;
Z.menuBack = function (W, H, ground, s, t, th) {
  var self0 = this, args0 = arguments, r;
  // 2.11.5: дальний фон меню (небо, луна, горы, лес) медленный — рисуем его в готовую картинку 12 раз в секунду, а не каждый кадр
  if (oBack && Z.cachedDraw && !Z.cachesOff()) Z.cachedDraw('menuBase', [W, H, th.toFixed(1), s.toFixed(3)].join('|'), 0, 0, W, H, function () { r = oBack.apply(self0, args0); }); else r = oBack ? oBack.apply(this, arguments) : undefined;
  var c = D.ctx, wide = W / 2 > th * 2.35, top = Math.max(70 * s, ground - th * 2.2);
  geo = { W: W, H: H, ground: ground, th: th, s: s, wide: wide };
  try {
    vignette(c, W, H, ground); shootingStar(c, W, H, s, t, Z.frameDt || 1 / 60);
    castle(c, W, ground, th, s, t, wide);
    metSwoop(c, W, 90 * s, ground, th, s, t); var gp = gorPos(W, H, 90 * s, ground, th, s, t); geo.gor = gp; if (gp) drawGor(c, gp, t, s);   // 2.11.5: и на широком экране — как на телефоне
    if (!wide) terrace(c, W, ground, th, s, t);
    var TR = Z.menuTerrace(W, ground, th, s), yAt = wide ? function () { return ground - th * 0.06; } : TR.y;
    // Соловей на дубе — где есть место между Емелей и Дедом Морозом (широкий экран — справа за Горынычем)
    solGeo = null;
    if (wide) { if (W / 2 > th * 2.95) solovey(c, W / 2 + th * 2.78, ground + 4 * s, th * 0.13, t, s); }
    else { var gapL = W * 0.13 + th * 0.22, gapR = W / 2 - th * 0.38; if (gapR - gapL > th * 0.3) solovey(c, (gapL + gapR) / 2 + th * 0.08, TR.y((gapL + gapR) / 2) + 2 * s, th * 0.12, t, s); }

  } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};

// ---------- передний план: свечение, искры, затемнение ----------
var oFront = Z.menuFront;
Z.menuFront = function (W, H, s, t) {
  var c = D.ctx, dt = Math.min(0.1, Math.max(0, t - lastT)); lastT = t;
  // таймер реплики идёт и в меню
  if (inMenu() && Z.sub && Z.sub.t > 0) Z.sub.t -= dt;
  if (!UI.modal && geo) {
    try {
      treeGlow(c, W, geo.ground, geo.th, s, t);
      giftRobber(c, W, geo.ground, geo.th, s, t);
      // широкий экран: по свободному снегу справа от кнопок крадётся разбойник (передний план — поверх снега)
      var bwM = Math.min(W * 0.84, 360 * s), room = W - (W + bwM) / 2, g0 = geo.ground, th0 = geo.th;
      if (geo.wide && room > th0 * 0.7) robber(c, W, g0, th0, s, t, true, function () { return g0 + th0 * 0.42; }, (W + bwM) / 2 + th0 * 0.3); else robGeo = null;
      // искры от подарков и ёлки поднимаются вверх
      if (Math.random() < dt * 9) add({ x: W / 2 + (Math.random() - 0.5) * geo.th * 0.7, y: geo.ground - Math.random() * geo.th * 0.5, vx: (Math.random() - 0.5) * 12 * s, vy: -(14 + Math.random() * 22) * s, g: 0, life: 1.6 + Math.random(), t: 0, r: (1.4 + Math.random() * 1.6) * s, col: ['#ffe9a0', '#ffffff', '#ffc6e6', '#bfe8ff'][Math.floor(Math.random() * 4)], star: Math.random() < 0.3 });
      stepFx(dt, W, H, s);
    } catch (e) { if (window.__rep) window.__rep(e); }
  }
  var r = oFront ? oFront.apply(this, arguments) : undefined;
  if (!UI.modal) {
    try {
      drawFx(c, s);
      var gp = geo && geo.gor; if (gp && inMenu()) UI.api().button('mmGor', gp.x - gp.R * 1.5, gp.y - gp.R * 2.4, gp.R * 3, gp.R * 2.6, { hidden: true, fn: function () {
        gor.roarT = Z.time; gor.kick = Z.time; try { Z.AU.sfx(Z.AU.bufs && Z.AU.bufs.dragon_roar ? 'dragon_roar' : 'boom', 0.7); } catch (e) { if (window.__rep) window.__rep(e); }
        if (Z.sayLine && Z.VL['GOR-02'] && !(Z.sub && Z.sub.t > 0.3)) Z.sayLine('GOR-02', 1, ['GOR-03', 'GOR-04']);
        burst(gp.x, gp.y - gp.R, 14, s, ['#ffd54a', '#ff8a5a', '#ffffff']); } });
      var a = UI.api(), quiet = function () { return !(Z.sub && Z.sub.t > 0.3); };
      if (castleGeo && inMenu()) { var K = castleGeo; a.button('mmKos', K.x - K.w, K.y - K.ch * 0.45, K.w * 2, K.ch * 0.9, { hidden: true, fn: function () {
        kos.force = Z.time; try { Z.AU.sfx('magic_ball', 0.6); } catch (e) { if (window.__rep) window.__rep(e); } if (quiet()) Z.sayLine(['KOS-01', 'KOS-06', 'KOS-08'][Math.floor(Math.random() * 3)], 1); burst(K.x, K.y - K.ch * 0.2, 12, s, ['#9dffcf', '#b48cff', '#ffffff']); } }); }
      if (boxGeo && inMenu() && !(Z.time - box.out < 2.2)) { var Bx = boxGeo; a.button('mmBox', Bx.x - Bx.w * 0.7, Bx.y - Bx.h * 1.4, Bx.w * 1.4, Bx.h * 2.4, { hidden: true, fn: function () {
        box.out = Z.time; try { Z.AU.sfx('chest_crack', 0.6); } catch (e) { if (window.__rep) window.__rep(e); } if (quiet()) Z.sayLine(Math.random() < 0.5 ? 'RAZ-02' : 'RAZ-03', 1); burst(Bx.x, Bx.y, 12, s, ['#ffd54a', '#4cc77d', '#ffffff']); } }); }
      if (robGeo && robGeo.sneaking && inMenu()) { var Rb = robGeo; a.button('mmRob', Rb.x - Rb.R * 0.8, Rb.y - Rb.R * 2.2, Rb.R * 1.6, Rb.R * 2.3, { hidden: true, fn: function () { rob.slip = Z.time - rob.t0; } }); }
      if (solGeo && inMenu()) { var So = solGeo; a.button('mmSol', So.x - So.R * 1.4, So.y - So.R * 3.6, So.R * 2.4, So.R * 3.6, { hidden: true, fn: function () {
        sol.wh = Z.time; try { Z.AU.sfx(Z.AU.bufs && Z.AU.bufs.whistle ? 'whistle' : 'select', 0.6); } catch (e) { if (window.__rep) window.__rep(e); } if (quiet()) Z.sayLine(Math.random() < 0.5 ? 'SOL-01' : 'SOL-02', 1); } }); }
    } catch (e) { if (window.__rep) window.__rep(e); }
  }
  return r;
};
// нажатие в меню — кольцо и искры там, куда нажал
var oDown = UI.down;
UI.down = function (px, py, id) {
  if (inMenu()) { rip.push({ x: px, y: py, t: 0 }); burst(px, py, 8, Z.ui.api ? Z.ui.api().S || 1 : 1, ['#ffffff', '#bfe8ff', '#ffe9a0']); }
  return oDown.apply(this, arguments);
};
Z.menuExtraPos = function (code) {
  if (code === 'KOS' && castleGeo) return { x: castleGeo.x, y: castleGeo.y - castleGeo.ch * 0.05, R: castleGeo.ch * 0.16 };
  if (code === 'RAZ' && (robGeo || robGeo2)) { var rg = robGeo2 || robGeo; return { x: rg.x, y: rg.y, R: rg.R }; }
  if (code === 'SOL' && solGeo) return { x: solGeo.x, y: solGeo.y - solGeo.R * 1.2, R: solGeo.R };
  if (code.indexOf('GOR') === 0 && geo && geo.gor) return { x: geo.gor.x, y: geo.gor.y, R: geo.gor.R };
  return null;
};
Z.menuBurst = function (x, y, s) { burst(x, y, 16, s, ['#ffd54a', '#ffffff', '#9fe3ff', '#ff8fd6']); };

// ---------- бой: вспышка и искры при победе над врагом ----------
var oKill = Z.hk.kill;
Z.hk.kill = function (e) {
  if (oKill) oKill(e);
  var G = Z.G; if (!G || !G.fx || G.fx.length > 380) return;
  try { var p = Z.enemyPos ? Z.enemyPos(e) : e; G.fx.push({ k: 'pburst', x: p.x, y: p.y - 0.4 * (e.size || 1), t: 0, dur: 0.45, big: !!e.boss, seed: Math.random() * 100 }); } catch (er) { if (window.__rep) window.__rep(er); }
};
var oFx = D.fx;
D.fx = function (f, X, Y, cs, t, B) {
  if (f.k !== 'pburst') return oFx.apply(this, arguments);
  var c = D.ctx, q = f.t / f.dur, x = X(f.x), y = Y(f.y), R = cs * (f.big ? 1.4 : 0.55);
  c.save(); c.globalCompositeOperation = 'lighter';
  var g = c.createRadialGradient(x, y, 0, x, y, R * (0.4 + q)); g.addColorStop(0, 'rgba(255,250,220,' + (0.75 * (1 - q)).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = g; c.fillRect(x - R * 1.5, y - R * 1.5, R * 3, R * 3);
  for (var i = 0; i < 9; i++) { var a = i / 9 * Math.PI * 2 + f.seed, d = R * (0.2 + q * 1.1), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.8 + q * q * R * 0.5; c.globalAlpha = 1 - q; D.star(px, py, cs * 0.06 * (1 - q * 0.5), i % 3 ? '#ffe9a0' : '#ffffff'); }
  c.restore(); c.globalAlpha = 1;
};
})();
