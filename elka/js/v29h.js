// v2.10.4: «Финальный удар» — сцена от первого лица на боссах Великан, Колесница и Метелица.
// Когда у босса остаётся меньше четверти здоровья, вверху появляется кнопка «Финальный удар!» (8 с).
// В сцене — босс крупно, на нём бегает прицел; жми, когда прицел в золотом круге (три попытки).
// Каждое попадание снимает треть оставшегося здоровья; три из трёх — босс повержен. Не нажал — бой идёт как обычно.
(function () {
var Z = window.Z, D = Z.D, TT = Z.TT, UI = Z.ui, _ = Z._, OL = D.OL || '#26304f';
var BOSS = { giant: 1, chariot: 1, witch: 1 };
function bossOf(G) { return G.enemies.filter(function (e) { return BOSS[e.type] && !e.dead && e.boss; })[0]; }
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!G || G.endless || G.trial) return;
  var b = bossOf(G); if (!b) { G.finOffer = 0; return; }
  if (!b.finUsed && !b.finOffered && b.hp < b.max * 0.25 && b.hp > b.max * 0.03) { b.finOffered = true; G.finOffer = 8; G.finBoss = b; Z.AU.sfx('gong', 0.6); }
  if (G.finOffer > 0) G.finOffer -= dt;
};
function startFin(G) {
  var b = G.finBoss; if (!b || b.dead) return;
  b.finUsed = true; G.finOffer = 0;
  UI.openModal({ type: 'finisher', t: 0, shots: 0, hits: 0, res: [], ph: 'aim', boss: b, noBack: true, sp: 2.2 + Math.random() * 0.6 });
}
var oRender = UI.render;
UI.render = function () {
  var r = oRender.apply(this, arguments);
  try {
    var G = Z.G;
    if (UI.screen === 'level' && !UI.modal && G && G.finOffer > 0 && G.finBoss && !G.finBoss.dead) {
      var A = UI.api(), S = A.S || 1, L = UI.L, bw = Math.min(250 * S, L.sw * 0.7), bh = 44 * S, bx = L.ox + (L.sw - bw) / 2, by = L.inT + (L.portrait ? 110 : 60) * S;
      A.button('finBtn', bx, by, bw, bh, { r: 14 * S, c1: '#5ac8ff', c2: '#2a8bbd', pulse: true, fn: function () { startFin(G); },
        draw: function (x, y, w, h) { if (D.flake) D.flake(x + h * 0.55, y + h / 2, h * 0.3, '#fff', h * 0.08); var l = TT('Финальный удар!', 'Final strike!'); D.text(l, x + h + (w - h * 1.2) / 2, y + h / 2, D.fitText(l, w - h * 1.3, 18 * S), '#fff', 'center', 'middle', 3 * S); var p = G.finOffer / 8; A.ctx.fillStyle = 'rgba(255,255,255,0.5)'; A.ctx.fillRect(x + 8 * S, y + h - 6 * S, (w - 16 * S) * p, 3 * S); } });
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};
var oDown = UI.down;
UI.down = function (px, py, id) {
  var m = UI.modal;
  if (m && m.type === 'finisher') {
    if (m.ph === 'aim' && m.cool <= 0) {
      var hit = Math.abs(m.ax) < 0.16; m.shots++; m.cool = 0.55; m.flash = 0.3; m.res.push(hit); if (hit) m.hits++;
      Z.AU.sfx(hit ? 'freeze' : 'tap', hit ? 0.9 : 0.5); if (hit) { Z.AU.sfx('ice_break', 0.7); m.shake = 0.35; }
      if (m.shots >= 3) { m.ph = 'end'; m.et = 0; }
    }
    return;
  }
  return oDown.apply(this, arguments);
};
function finish(G, m) {
  var b = m.boss; if (!b || b.dead) return;
  var part = m.hits >= 3 ? 1 : m.hits / 3;
  if (part > 0) {
    var amt = b.hp * part + (part >= 1 ? 10 : 0);
    b.hp = Math.max(part >= 1 ? 0 : 1, b.hp - amt); b.hitT = 0.3;
    G.fx.push({ k: 'ring', x: b.x, y: b.y, r: 2.4, t: 0, dur: 0.7, col: '#bfe6ff' }); G.fx.push({ k: 'frost', x: b.x, y: b.y, r: 1.8, t: 0, dur: 0.8 });
    if (b.hp <= 0) { b.hp = 0; _.kill(b); }
    G.shake = 0.7; G.slowT = 0.9;
  }
  G.banner = { text: m.hits >= 3 ? TT('Сокрушительный удар!', 'Crushing blow!') : m.hits ? TT('Попаданий: ', 'Hits: ') + m.hits + '/3' : TT('Мимо! Бой продолжается', 'Missed! The fight goes on'), t: 2, big: true };
}
var oCustom = UI.customModal;
UI.customModal = function (m, w) {
  if (m.type !== 'finisher') return oCustom ? oCustom(m, w) : false;
  var A = UI.api(), ctx = A.ctx, W = A.W, H = A.H, S = A.S, dt = 1 / 60, G = Z.G;
  m.t += dt; m.cool = (m.cool || 0) - dt; if (m.flash > 0) m.flash -= dt; if (m.shake > 0) m.shake -= dt;
  m.ax = Math.sin(m.t * m.sp) * 0.9 * (m.ph === 'aim' ? 1 : 0) + Math.sin(m.t * m.sp * 2.3) * 0.08;
  if (m.ph === 'end') { m.et += dt; if (m.et > 1.2) { UI.closeModal(); if (G) finish(G, m); return true; } }
  if (m.t > 30 && m.ph === 'aim') { m.ph = 'end'; m.et = 0; }
  var b = m.boss, u = Math.min(W, H) / 400, cx = W / 2 + (m.shake > 0 ? Math.sin(m.t * 80) * 8 * u : 0), cy = H * 0.52;
  // арена
  var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b3d7a'); g.addColorStop(0.62, '#7f9fd8'); g.addColorStop(0.63, '#dfe9fb'); g.addColorStop(1, '#ffffff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (var s = 0; s < 40; s++) { var sx = (s * 131 + m.t * 40 * (1 + s % 3)) % W, sy = (s * 71 + m.t * 60 * (1 + s % 2)) % H; D.circ(sx, sy, (1 + s % 3) * u, 'rgba(255,255,255,0.8)'); }
  // босс крупно
  var fake = { type: b.type, size: 1, dir: -1, walk: m.t * 2, ph: 1, hitT: m.flash > 0 && m.res[m.res.length - 1] ? 0.1 : 0, lunge: 0, lift: 0, kb: 0, slow: 0, enraged: true };
  var bs = 210 * u; ctx.save(); D.enemy(fake, cx, cy + 90 * u, bs, m.t); ctx.restore();
  // слабое место и прицел
  var RG = Math.min(220 * u, W * 0.4), wy = cy + 90 * u - bs * 0.31 * 1.15, sweet = 0.16 * RG;
  ctx.save(); ctx.globalAlpha = 0.6 + 0.3 * Math.sin(m.t * 6); ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.arc(cx, wy, sweet, 0, 7); ctx.stroke(); ctx.restore();
  var rx = cx + m.ax * RG;
  ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.arc(rx, wy, 22 * u, 0, 7); ctx.moveTo(rx - 34 * u, wy); ctx.lineTo(rx - 12 * u, wy); ctx.moveTo(rx + 12 * u, wy); ctx.lineTo(rx + 34 * u, wy); ctx.moveTo(rx, wy - 34 * u); ctx.lineTo(rx, wy - 12 * u); ctx.moveTo(rx, wy + 12 * u); ctx.lineTo(rx, wy + 34 * u); ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = 1.5 * u; ctx.stroke(); ctx.restore();
  // посох Деда Мороза
  ctx.save(); ctx.translate(W * 0.82, H * 1.02); ctx.rotate(-0.5 - (m.flash > 0 ? 0.15 : 0)); ctx.fillStyle = '#c0c8dc'; ctx.fillRect(-9 * u, -260 * u, 18 * u, 260 * u); ctx.strokeStyle = OL; ctx.lineWidth = 3 * u; ctx.strokeRect(-9 * u, -260 * u, 18 * u, 260 * u);
  if (D.flake) D.flake(0, -280 * u, 34 * u, '#bfe9ff', 9 * u); ctx.restore();
  if (m.flash > 0) { var hit = m.res[m.res.length - 1]; ctx.save(); ctx.globalAlpha = m.flash / 0.3; ctx.strokeStyle = hit ? '#bfe9ff' : 'rgba(255,255,255,0.6)'; ctx.lineWidth = (hit ? 16 : 6) * u; ctx.beginPath(); ctx.moveTo(W * 0.82 - 120 * u, H - 230 * u); ctx.lineTo(rx, wy); ctx.stroke(); ctx.restore(); if (hit) D.text(TT('Попал!', 'Hit!'), rx, wy - 60 * u, 30 * S, '#ffe066', 'center', 'middle', 4 * S); else D.text(TT('Мимо', 'Miss'), rx, wy - 60 * u, 24 * S, '#fff', 'center', 'middle', 4 * S); }
  // подсказка и попытки
  D.text(m.ph === 'aim' ? TT('Жми, когда прицел в золотом круге!', 'Tap when the sight is in the gold ring!') : m.hits >= 3 ? TT('Три из трёх!', 'Three for three!') : TT('Попаданий: ', 'Hits: ') + m.hits + '/3', W / 2, H * 0.1, D.fitText(TT('Жми, когда прицел в золотом круге!', 'Tap when the sight is in the gold ring!'), W - 30 * S, 22 * S), '#ffe066', 'center', 'middle', 4 * S);
  for (var k = 0; k < 3; k++) { var c = m.res[k] === undefined ? 'rgba(255,255,255,0.3)' : m.res[k] ? '#4cc77d' : '#ff6b6b'; D.circ(W / 2 - 30 * S + k * 30 * S, H * 0.17, 9 * S, c, 2 * S); }
  if (m.ph === 'end') { ctx.globalAlpha = Math.min(1, m.et / 1.2) * 0.8; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  return true;
};
})();
