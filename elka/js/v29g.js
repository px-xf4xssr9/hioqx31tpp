// v2.10.4: Кощей понятен и интерактивен.
// - Вверху — путь к смерти Кощея из пяти шагов: сундук → заяц → утка → яйцо → игла, текущий шаг подписан.
// - Над текущей целью — прыгающая стрелка, а если цель за краем экрана — стрелка у края в её сторону.
// - Нажми на цель — весь отряд побежит туда.
// - Яйцо падает на поле: нажми на него — откроется сцена «от первого лица»: тапами разбей скорлупу,
//   зажми и держи, чтобы сломать иглу. Если не нажать за 14 с — герои справятся сами (игра не застрянет).
(function () {
var Z = window.Z, D = Z.D, TT = Z.TT, UI = Z.ui, _ = Z._, OL = D.OL || '#26304f';
var STEP = [
  [TT('Разбей сундук — в нём заяц', 'Smash the chest — a hare is inside')],
  [TT('Догони зайца, пока не убежал!', 'Catch the hare before it escapes!')],
  [TT('Сбей утку — у неё яйцо', 'Shoot down the duck — it has the egg')],
  [TT('Нажми на яйцо — сломай иглу!', 'Tap the egg — break the needle!')],
  [TT('Игла сломана — бей Кощея!', 'Needle broken — hit Koschei!')]
];
function kosAlive(G) { return G.enemies.some(function (e) { return e.type === 'koschei' && !e.dead; }); }
function target(G) {
  var K = G.kos; if (!K) return null;
  if (K.stage === 0 && K.chest && !K.chest.dead) return { x: K.chest.c + 0.5, y: K.chest.r + 0.4, k: 'chest' };
  if (K.stage === 1) { var h = G.enemies.filter(function (e) { return e.type === 'hare' && !e.dead; })[0]; if (h) return { x: h.x, y: h.y, k: 'hare', e: h }; }
  if (K.stage === 2) { var d = G.enemies.filter(function (e) { return e.type === 'duck' && !e.dead; })[0]; if (d) return { x: d.x, y: d.y, k: 'duck', e: d }; }
  if (K.stage === 3 && K.egg) return { x: K.egg.x, y: K.egg.y, k: 'egg' };
  if (K.stage >= 4) { var k = G.enemies.filter(function (e) { return e.type === 'koschei' && !e.dead; })[0]; if (k) return { x: k.x, y: k.y, k: 'kos', e: k }; }
  return null;
}
function active(G) { return G && G.kos && (kosAlive(G) || (G.kos.chest && !G.kos.chest.dead && G.phase === 'wave')); }

// ---------- яйцо на поле ----------
Z.kosEgg = function (G, K, s) {
  var L = G.L, x = Math.max(0.8, Math.min(L.W - 0.8, s.x)), y = Math.max(0.8, Math.min(L.H - 1, s.y));
  K.egg = { x: x, y: y, t: 0, auto: 14, open: 1.3 };   // 2.12.48: через 1,3 с мини-игра открывается сама (раньше — только по нажатию, и за 14 с яйцо «разбивали герои»)
  G.banner = { text: TT('Яйцо упало!', 'The egg fell!'), sub: TT('Нажми на яйцо и сломай иглу', 'Tap the egg and break the needle'), t: 2.6, big: true };
  Z.AU.sfx('mine_pop', 0.6);
};
function breakNeedle(G) {
  var K = G.kos; if (!K || K.stage >= 4) return;
  K.stage = 4; K.egg = null;
  G.banner = { text: TT('Игла сломана! Кощей уязвим!', 'Needle broken! Koschei is vulnerable!'), t: 2.4, big: true, boss: true };
  G.shake = 0.8; G.slowT = 0.8; Z.AU.sfx('ice_break', 1); Z.AU.sfx('gong', 0.8);
  if (Z.sayLine) Z.sayLine('KOS-05', 1);
}
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G, K = G && G.kos; if (!K || !K.egg) return;
  K.egg.t += dt; K.egg.auto -= dt;
  if (K.egg.open > 0) { K.egg.open -= dt; if (K.egg.open <= 0) { if (!UI.modal) { UI.openModal({ type: 'kosEgg', t: 0, taps: 0, hold: 0, ph: 'crack', bits: [], noBack: true }); return; } K.egg.open = 0.5; } }
  if (K.egg.auto <= 0) { _.addText(TT('Герои сломали иглу!', 'The heroes broke the needle!'), K.egg.x, K.egg.y - 1, '#ffd54a', 1.6, 0.8); breakNeedle(G); }
};
// нажатие по цели
var oHook = UI.tapHook;
UI.tapHook = function (wx, wy, px, py) {
  var G = Z.G;
  if (G && G.kos && !UI.aim && !UI.aimUlt) {
    var tg = target(G);
    if (tg && Math.hypot(tg.x - wx, tg.y - 0.3 - wy) < 1.1) {
      if (tg.k === 'egg') { UI.openModal({ type: 'kosEgg', t: 0, taps: 0, hold: 0, ph: 'crack', bits: [], noBack: true }); return true; }
      if (Z.allHere && (G.squad || []).length) { Z.allHere(tg.x, tg.y + 0.4); if (Z.ui.flash) Z.ui.flash(TT('Отряд — к цели!', 'Squad — to the target!')); }
      return true;
    }
  }
  return oHook ? oHook.apply(this, arguments) : false;
};

// ---------- рисование: стрелка над целью, яйцо ----------
var oOver = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  if (oOver) oOver(ctx, X, Y, cs, t);
  var G = Z.G; if (!active(G) && !(G && G.kos && G.kos.egg)) return;
  try {
    var K = G.kos;
    if (K.egg) {
      var ex = X(K.egg.x), ey = Y(K.egg.y), b = Math.abs(Math.sin(t * 4)) * cs * 0.12;
      ctx.save(); ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t * 6); D.circ(ex, ey - cs * 0.3, cs * 0.75, '#ffe9a0'); ctx.restore();
      D.ell(ex, ey + cs * 0.05, cs * 0.25, cs * 0.08, 'rgba(30,40,80,0.25)');
      D.ell(ex, ey - cs * 0.28 - b, cs * 0.24, cs * 0.31, '#fff6dc', Math.max(1.5, cs * 0.05));
      ctx.save(); ctx.strokeStyle = '#d9b05a'; ctx.lineWidth = Math.max(1, cs * 0.03); ctx.beginPath(); ctx.moveTo(ex - cs * 0.2, ey - cs * 0.3 - b); ctx.lineTo(ex + cs * 0.2, ey - cs * 0.3 - b); ctx.stroke(); ctx.restore();
      D.text(TT('Нажми!', 'Tap!'), ex, ey - cs * 0.95 - b, Math.max(12, cs * 0.32), '#ffe066', 'center', 'middle', Math.max(2, cs * 0.06));
      var aw = Math.max(0, K.egg.auto / 14); ctx.fillStyle = 'rgba(20,24,48,0.7)'; ctx.fillRect(ex - cs * 0.4, ey + cs * 0.15, cs * 0.8, cs * 0.08); ctx.fillStyle = '#ffd54a'; ctx.fillRect(ex - cs * 0.4, ey + cs * 0.15, cs * 0.8 * aw, cs * 0.08);
    }
    var tg = target(G); if (!tg || tg.k === 'kos' && K.stage < 4) return;
    var L = UI.L, vp = L.vp, sx = X(tg.x), sy = Y(tg.y) - cs * (tg.k === 'duck' ? 2.2 : 1.3) - Math.abs(Math.sin(t * 5)) * cs * 0.25;
    var inV = sx > vp.x + 10 && sx < vp.x + vp.w - 10 && sy > vp.y + 30 && sy < vp.y + vp.h - 10;
    ctx.save(); ctx.lineWidth = Math.max(2, cs * 0.06); ctx.strokeStyle = OL;
    if (inV) {
      D.poly([sx - cs * 0.25, sy - cs * 0.3, sx + cs * 0.25, sy - cs * 0.3, sx, sy + cs * 0.05], K.stage >= 4 ? '#ff6b6b' : '#ffd54a', Math.max(2, cs * 0.05));
    } else {
      var cx = Math.max(vp.x + 28, Math.min(vp.x + vp.w - 28, sx)), cy = Math.max(vp.y + 70, Math.min(vp.y + vp.h - 40, sy)), a = Math.atan2(sy - cy, sx - cx), r = 18;
      ctx.translate(cx, cy); ctx.rotate(a); D.circ(0, 0, r, 'rgba(20,24,48,0.75)'); D.poly([r * 0.9, 0, -r * 0.4, -r * 0.6, -r * 0.4, r * 0.6], '#ffd54a', 2);
    }
    ctx.restore();
  } catch (er) { if (window.__rep) window.__rep(er); }
};
// ---------- полоса шагов вверху ----------
function icon(ctx, k, x, y, r, done, cur) {
  D.circ(x, y, r, done ? '#4cc77d' : cur ? '#ffd54a' : 'rgba(255,255,255,0.25)', 2);
  var s = r * 0.62;
  if (k === 0) { D.rr(x - s, y - s * 0.5, s * 2, s * 1.2, s * 0.2); ctx.fillStyle = '#8a5a30'; ctx.fill(); ctx.fillStyle = '#ffd54a'; ctx.fillRect(x - s * 0.15, y - s * 0.5, s * 0.3, s * 1.2); }
  else if (k === 1) { D.ell(x, y + s * 0.2, s * 0.7, s * 0.55, '#fff'); D.ell(x - s * 0.25, y - s * 0.6, s * 0.15, s * 0.45, '#fff'); D.ell(x + s * 0.15, y - s * 0.6, s * 0.15, s * 0.45, '#fff'); }
  else if (k === 2) { D.ell(x, y + s * 0.15, s * 0.75, s * 0.5, '#f2c94c'); D.circ(x + s * 0.45, y - s * 0.35, s * 0.35, '#2f8f5b'); D.poly([x + s * 0.75, y - s * 0.4, x + s * 1.1, y - s * 0.3, x + s * 0.75, y - s * 0.2], '#ff9a3d'); }
  else if (k === 3) D.ell(x, y, s * 0.6, s * 0.8, '#fff6dc');
  else { ctx.strokeStyle = '#c9d2e3'; ctx.lineWidth = Math.max(2, r * 0.18); ctx.beginPath(); ctx.moveTo(x - s * 0.7, y + s * 0.7); ctx.lineTo(x + s * 0.7, y - s * 0.7); ctx.stroke(); D.circ(x + s * 0.55, y - s * 0.55, s * 0.18, '#ffd54a'); }
  if (done) D.text('✓', x + r * 0.7, y - r * 0.7, r * 0.8, '#fff', 'center', 'middle', 2);
}
var oRender = UI.render;
UI.render = function () {
  var r = oRender.apply(this, arguments);
  try {
    var G = Z.G;
    if (UI.screen === 'level' && !UI.modal && active(G)) {
      var A = UI.api(), S = A.S || 1, ctx = A.ctx, L = UI.L, K = G.kos, st = Math.min(4, K.stage), w = Math.min(330 * S, L.sw * 0.92), h = 50 * S, x = L.ox + (L.sw - w) / 2, y = L.inT + (L.portrait ? 54 : 8) * S;
      ctx.save(); D.rr(x, y, w, h, 14 * S); ctx.fillStyle = 'rgba(20,24,48,0.82)'; ctx.fill(); ctx.lineWidth = 2 * S; ctx.strokeStyle = '#b48cff'; ctx.stroke();
      for (var i = 0; i < 5; i++) { var ix = x + 22 * S + i * 28 * S; icon(ctx, i, ix, y + 17 * S, 10 * S, i < st, i === st); if (i < 4) { ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5 * S; ctx.beginPath(); ctx.moveTo(ix + 12 * S, y + 17 * S); ctx.lineTo(ix + 16 * S, y + 17 * S); ctx.stroke(); } }
      var tx = x + 22 * S + 5 * 28 * S - 8 * S, lbl = STEP[st][0];
      D.text(TT('Смерть Кощея', 'Koschei\'s death'), tx, y + 15 * S, Math.max(10, 11 * S), '#c7b8ff', 'left', 'middle', 0);
      var fl = D.wrap ? D.wrap(lbl, x + w - tx - 8 * S, Math.max(10.5, 12 * S)).slice(0, 2) : [lbl];
      fl.forEach(function (ln, k) { D.text(ln, tx, y + 31 * S + k * 13 * S - (fl.length > 1 ? 4 * S : 0), Math.max(10.5, 12 * S), '#fff', 'left', 'middle', 0); });
      ctx.restore();
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};

// ---------- сцена «от первого лица»: скорлупа и игла ----------
var hold = false;
var oDown = UI.down, oUp = UI.up;
UI.down = function (px, py, id) { var m = UI.modal; if (m && m.type === 'kosEgg') { hold = true; if (m.ph === 'crack') tapEgg(m); return; } return oDown.apply(this, arguments); };
UI.up = function (px, py, id) { var m = UI.modal; if (m && m.type === 'kosEgg') { hold = false; return; } return oUp.apply(this, arguments); };
function tapEgg(m) {
  if (m.taps >= 5 || (m.punch && m.punch.t < 0.16)) return;   // 2.11.3: удар ещё летит — следующий тап подождёт
  m.taps++; m.punch = { sd: m.taps % 2 ? -1 : 1, t: 0, hit: false };   // варежки бьют по очереди; треск, тряска и переход к игле — в момент попадания
}
var oCustom = UI.customModal;
UI.customModal = function (m, w) {
  if (m.type !== 'kosEgg') return oCustom ? oCustom(m, w) : false;
  var A = UI.api(), ctx = A.ctx, W = A.W, H = A.H, S = A.S, dt = 1 / 60, G = Z.G;
  m.t += dt; if (m.shk > 0) m.shk -= dt;
  if (m.ph === 'needle') { m.hold = Math.max(0, Math.min(1, m.hold + (hold ? dt / 1.3 : -dt * 0.9))); if (hold && Math.random() < 0.2) Z.AU.sfx('tap', 0.25, { pitch: 0.6 + m.hold, gap: 0.08 }); if (m.hold >= 1) { m.ph = 'done'; m.dt = 0; Z.AU.sfx('ice_break', 1); Z.AU.sfx('gong', 0.7); } }
  if (m.ph === 'done') { m.dt += dt; if (m.dt > 1.1) { UI.closeModal(); hold = false; if (G) breakNeedle(G); return true; } }
  if (m.t > 25 && m.ph !== 'done') { m.ph = 'done'; m.dt = 0; }
  // фон: тёмная сцена с лучом света
  var g = ctx.createRadialGradient(W / 2, H * 0.48, 10, W / 2, H * 0.5, Math.max(W, H) * 0.7); g.addColorStop(0, '#3a3466'); g.addColorStop(1, '#0c0c1e'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  var u = Math.min(W, H) / 400, cx = W / 2 + (m.shk > 0 ? Math.sin(m.t * 90) * 10 * u * m.shk / 0.3 : 0), cy = H * 0.5 + (m.shk > 0 ? Math.cos(m.t * 77) * 6 * u * m.shk / 0.3 : 0);
  for (var s = 0; s < 18; s++) { ctx.globalAlpha = 0.25 + 0.25 * Math.sin(m.t * 2 + s); D.circ((s * 97) % W, (s * 53 + m.t * 20) % H, 1.5 * u, '#c7b8ff'); } ctx.globalAlpha = 1;
  // 2.11.1: сияние иглы — позади варежек
  if (m.ph !== 'crack') { var glow = 0.5 + 0.5 * Math.sin(m.t * 8); (function (cx, cy) {
    // 2.11.1: тёплое сияние вокруг иглы (раньше серое пятно) и лучи
    ctx.save();
    var gr = ctx.createRadialGradient(cx, cy, 4 * u, cx, cy, 150 * u); gr.addColorStop(0, 'rgba(255,240,170,' + (0.75 + 0.2 * glow) + ')'); gr.addColorStop(0.35, 'rgba(255,200,80,0.35)'); gr.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, 150 * u, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.18 + 0.1 * glow; ctx.fillStyle = '#ffe9a0';
    for (var ry = 0; ry < 10; ry++) { var ra = m.t * 0.35 + ry * Math.PI / 5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 190 * u, ra - 0.06, ra + 0.06); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  })(cx, cy + 38 * u); }
  // 2.11.3: варежки живые — бьют кулаками по яйцу (замах, удар, отскок), потом хватают иглу за концы и ломают пальцами
  m.fx = m.fx || [];
  function mitt(x, y, rot, sd, sc, grip) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
    D.rr(-45 * u, -40 * u, 90 * u, 110 * u, 40 * u); ctx.fillStyle = '#d33a3a'; ctx.fill(); ctx.lineWidth = 3 * u; ctx.strokeStyle = OL; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; D.rr(-30 * u, -32 * u, 22 * u, 60 * u, 11 * u); ctx.fill();
    D.rr(-48 * u, 50 * u, 96 * u, 26 * u, 10 * u); ctx.fillStyle = '#f4f8ff'; ctx.fill(); ctx.stroke();
    if (grip) D.ell(sd * -30 * u, -28 * u, 16 * u, 22 * u, '#d33a3a', 3 * u); else D.ell(sd * -38 * u, -5 * u, 18 * u, 30 * u, '#d33a3a', 3 * u);
    ctx.restore();
  }
  function burst(x, y, n, col, sp) { for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, v = (0.6 + Math.random()) * sp; m.fx.push({ k: 'p', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.3, t: 0, life: 0.45 + Math.random() * 0.35, c: col, r: (3 + Math.random() * 4) * u }); } }
  var P = m.punch;
  if (P) { P.t += dt; if (!P.hit && P.t >= 0.11) { P.hit = true; m.shk = 0.3; m.sq = 0.22; var hx = cx + P.sd * 62 * u, hy = cy + 10 * u; burst(hx, hy, 14, '#fff6dc', 420 * u); burst(hx, hy, 8, '#ffd54a', 300 * u); m.fx.push({ k: 'ring', x: hx, y: hy, t: 0, life: 0.3 }); m.fx.push({ k: 'star', x: hx, y: hy, t: 0, life: 0.18 });
      Z.AU.sfx('chest_crack', 0.5 + m.taps * 0.08, { pitch: 1.2 + m.taps * 0.06 }); Z.AU.sfx('hit_snow', 0.6, { pitch: 0.8 });
      if (m.taps >= 5) { m.ph = 'needle'; for (var i = 0; i < 16; i++) m.bits.push({ x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.5, vx: (Math.random() - 0.5) * 2.8, vy: -1.5 - Math.random() * 1.8, r: Math.random() * 6, t: 0 }); Z.AU.sfx('ice_break', 0.7); } }
    if (P.t > 0.34) m.punch = null; }
  if (m.sq > 0) m.sq -= dt;
  if (m.ph === 'crack') {
    // яйцо: сплющивается от удара и качается
    var sq = Math.max(0, m.sq || 0) / 0.22, wob = P ? P.sd * sq * 0.12 : Math.sin(m.t * 2) * 0.03;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-wob); ctx.scale(1 + 0.14 * sq, 1 - 0.12 * sq);
    D.ell(0, 0, 78 * u, 100 * u, '#fff6dc', 4 * u); D.ell(-28 * u, -40 * u, 16 * u, 24 * u, 'rgba(255,255,255,0.8)');
    ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 3 * u;
    for (var c2 = 0; c2 < m.taps - (P && !P.hit ? 1 : 0); c2++) { var a0 = c2 * 1.3 + 0.4; ctx.beginPath(); ctx.moveTo(Math.cos(a0) * 15 * u, Math.sin(a0) * 20 * u); for (var q = 1; q < 5; q++) ctx.lineTo(Math.cos(a0 + (q % 2 ? 0.25 : -0.2)) * (15 + q * 16) * u, Math.sin(a0 + (q % 2 ? 0.25 : -0.2)) * (20 + q * 18) * u); ctx.stroke(); }
    ctx.restore();
    // варежки: покачиваются, бьющая — замах, удар, отскок
    [-1, 1].forEach(function (sd) {
      var bx = cx + sd * 150 * u, by = cy + 60 * u + Math.sin(m.t * 3 + sd) * 4 * u, rot = sd * -0.35, sc = 1;
      if (P && P.sd === sd) { var k = P.t;
        if (k < 0.07) { var e = k / 0.07; bx += sd * 26 * u * e; by += 14 * u * e; rot += sd * 0.25 * e; }
        else if (k < 0.11) { var e2 = (k - 0.07) / 0.04; bx = cx + sd * (176 - 106 * e2) * u; by = cy + (74 - 64 * e2) * u; rot = sd * (-0.1 - 0.5 * e2); sc = 1 + 0.12 * e2; }
        else { var e3 = Math.min(1, (k - 0.11) / 0.23); bx = cx + sd * (70 + 80 * e3) * u; by = cy + (10 + 50 * e3) * u; rot = sd * (-0.6 + 0.25 * e3); sc = 1.12 - 0.12 * e3; } }
      mitt(bx, by, rot, sd, sc, false);
    });
    D.text(TT('Стучи по яйцу!', 'Tap the egg!'), W / 2, H * 0.14, 26 * S, '#ffe066', 'center', 'middle', 4 * S);
    for (var d = 0; d < 5; d++) D.circ(W / 2 - 40 * S + d * 20 * S, H * 0.21, 6 * S, d < m.taps ? '#ffd54a' : 'rgba(255,255,255,0.25)');
  } else {
    // скорлупа разлетается
    m.bits.forEach(function (b) { b.t += dt; b.x += b.vx * dt * 0.4; b.y += b.vy * dt * 0.4; b.vy += 3 * dt; ctx.save(); ctx.translate(cx + b.x * 260 * u, cy + b.y * 260 * u); ctx.rotate(b.r + b.t * 5); D.poly([-12 * u, 0, 0, -10 * u, 12 * u, 2 * u, 2 * u, 9 * u], '#fff6dc', 2 * u); ctx.restore(); });
    cy += 38 * u;
    if (m.ph !== 'done') {
      // игла в пальцах: концы сводятся и опускаются, середина выгибается, руки дрожат от усилия
      var hd = m.hold, tr = hold ? (Math.random() - 0.5) * 4 * u * (0.4 + hd) : 0, ex = (128 - 26 * hd) * u, ey = 16 * hd * u, qy = cy - hd * 80 * u + tr;
      ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 14 * u; ctx.beginPath(); ctx.moveTo(cx - ex, cy + ey + tr); ctx.quadraticCurveTo(cx, qy, cx + ex, cy + ey - tr); ctx.stroke();
      var ng = ctx.createLinearGradient(0, cy - 8 * u, 0, cy + 8 * u); ng.addColorStop(0, '#fff6c8'); ng.addColorStop(0.5, '#ffd54a'); ng.addColorStop(1, '#e0a020');
      ctx.strokeStyle = ng; ctx.lineWidth = 8 * u; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.moveTo(cx - ex + 20 * u, cy + ey - 2 * u); ctx.quadraticCurveTo(cx, qy - 3 * u, cx + 40 * u, cy - 2 * u + (qy - cy) * 0.5); ctx.stroke(); ctx.lineCap = 'butt';
      if (hd > 0.55) { ctx.globalAlpha = (hd - 0.55) * 2; D.circ(cx, qy + 4 * u, (10 + 8 * Math.sin(m.t * 30)) * u, '#fffbe0'); ctx.globalAlpha = 1; }   // в середине — вот-вот треснет
      [-1, 1].forEach(function (sd) { mitt(cx + sd * (ex + 18 * u), cy + ey + 34 * u + (sd < 0 ? tr : -tr), sd * (-0.15 - 0.55 * hd), sd, 0.92, true); });
      D.text(TT('Зажми и держи — ломай иглу!', 'Press and hold — break the needle!'), W / 2, H * 0.14, D.fitText(TT('Зажми и держи — ломай иглу!', 'Press and hold — break the needle!'), W - 30 * S, 24 * S), '#ffe066', 'center', 'middle', 4 * S);
      var bw = Math.min(280 * S, W * 0.7); D.rr(W / 2 - bw / 2, H * 0.82, bw, 18 * S, 9 * S); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill(); D.rr(W / 2 - bw / 2, H * 0.82, bw * m.hold, 18 * S, 9 * S); ctx.fillStyle = '#ff8a3d'; ctx.fill();
    } else {
      // перелом: ударная волна, золотые искры, половинки и варежки разлетаются
      if (!m.brk) { m.brk = 1; m.shk = 0.45; burst(cx, cy - 40 * u, 34, '#ffd54a', 700 * u); burst(cx, cy - 40 * u, 18, '#fffbe0', 520 * u); m.fx.push({ k: 'ring', x: cx, y: cy - 40 * u, t: 0, life: 0.55, big: 1 }); }
      [-1, 1].forEach(function (sd) { ctx.save(); ctx.translate(cx + sd * (40 + m.dt * 260) * u, cy - 40 * u + m.dt * m.dt * 260 * u); ctx.rotate(sd * (0.4 + m.dt * 6)); ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 12 * u; ctx.beginPath(); ctx.moveTo(-60 * u, 0); ctx.lineTo(60 * u, 0); ctx.stroke(); ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = 7 * u; ctx.stroke(); ctx.restore(); });
      [-1, 1].forEach(function (sd) { mitt(cx + sd * (110 + m.dt * 340) * u, cy + 40 * u + m.dt * 120 * u, sd * (-0.7 - m.dt * 2), sd, 0.92, true); });
      ctx.globalAlpha = Math.max(0, 1 - m.dt * 1.4); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      var tk = Math.min(1, m.dt * 5), tz = 1 + 0.6 * (1 - tk) * (1 - tk);
      ctx.save(); ctx.translate(W / 2, H * 0.14); ctx.scale(tz, tz); D.text(TT('Игла сломана!', 'Needle broken!'), 0, 0, 34 * S, '#ffe066', 'center', 'middle', 5 * S); ctx.restore();
    }
  }
  // искры, кольца ударной волны, вспышки
  m.fx = m.fx.filter(function (f) { f.t += dt; return f.t < f.life; });
  m.fx.forEach(function (f) { var k = f.t / f.life;
    if (f.k === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 900 * u * dt; ctx.globalAlpha = 1 - k; D.circ(f.x, f.y, f.r * (1 - k * 0.5), f.c); }
    else if (f.k === 'ring') { ctx.globalAlpha = (1 - k) * 0.9; ctx.strokeStyle = f.big ? '#ffe9a0' : '#ffffff'; ctx.lineWidth = (f.big ? 10 : 6) * u * (1 - k); ctx.beginPath(); ctx.arc(f.x, f.y, (f.big ? 40 + 420 * k : 14 + 90 * k) * u, 0, Math.PI * 2); ctx.stroke(); }
    else if (f.k === 'star') { ctx.globalAlpha = 1 - k; var r1 = (34 + 30 * k) * u, r2 = r1 * 0.35, pts = []; for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8; pts.push(f.x + Math.cos(a) * (i % 2 ? r2 : r1), f.y + Math.sin(a) * (i % 2 ? r2 : r1)); } D.poly(pts, '#fffbe0', 0); }
    ctx.globalAlpha = 1; });
  return true;
};
})();
