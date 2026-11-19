// v2.10.3: управление.
// - Сани Снегурочки (способность «Хо-хо-хо!») управляются: нажал способность → нажми на поле, где лететь;
//   в полёте сани рулятся пальцем (веди по полю). Бьют тех, над кем пролетают.
// - После приказа идти у героя выключается «Авто» — видно надписью у героя (вернуть: «АВТО» под портретом).
(function () {
var Z = window.Z, D = Z.D, TT = Z.TT, _ = Z._, UI = Z.ui;

// ---------- сани ----------
var oUse = Z.useSkill;
Z.useSkill = function (id, x, y) {
  var G = Z.G;
  if (id === 'santa' && G && x === undefined) {
    if (G.skills.santa > 0 || G.santaFly) return false;
    UI.aim = UI.aim === 'santa' ? null : 'santa';
    if (UI.aim) G.banner = { text: TT('Сани Снегурочки', 'Snow Maiden\'s sleigh'), sub: TT('Нажми на поле — туда полетят сани. В полёте веди пальцем, чтобы рулить', 'Tap the field to send the sleigh there. Drag to steer it in flight'), t: 2.4 };
    return false;
  }
  if (id === 'santa' && G) { startFly(G, y); return true; }
  return oUse.apply(this, arguments);
};
function startFly(G, wy) {
  var L = G.L, H = L.H;
  wy = Math.max(0.6, Math.min(H - 0.6, wy));
  G.santaFly = { x: -1.6, y: wy, ty: wy, t: 0, hit: [] };
  snegPuff(G);
  G.skills.santa = Z.skillCd('santa');
  G.flash = Math.max(G.flash || 0, 0.25); G.shake = Math.max(G.shake || 0, 0.3);
  if (Z.sndSleigh) Z.sndSleigh(); else { Z.AU.sfx('sleigh', 1); Z.AU.sfx('sleigh2', 0.8); } Z.AU.sfx('gong', 0.4);
}
function flyTick(G, dt) {
  var f = G.santaFly; if (!f) return;
  f.t += dt; f.x += 5.2 * dt;
  var dy = f.ty - f.y; f.y += Math.max(-4.5 * dt, Math.min(4.5 * dt, dy)); f.tilt = Math.max(-0.35, Math.min(0.35, dy * 0.4));
  for (var i = 0; i < G.enemies.length; i++) {
    var e = G.enemies[i]; if (e.dead || f.hit.indexOf(e) >= 0 || e.neutral) continue;
    if (Math.abs(e.x - f.x) < 1.25 && Math.abs(e.y - f.y) < 1.35) {
      f.hit.push(e); _.damage(e, (e.max * (e.boss ? 0.15 : 0.6) + 20) * (Z.supK ? Z.supK('santa') : 1));
      if (G.fx.length < 420) G.fx.push({ k: 'star', x: e.x, y: e.y - 0.4, t: 0, dur: 0.6 });
    }
  }
  f.drop = (f.drop || 0) - dt;
  if (f.drop <= 0 && f.x > 0 && f.x < G.L.W) { f.drop = 0.12; if (G.fx.length < 420) G.fx.push({ k: 'giftfly', x: f.x - 0.4, y: f.y - 0.6, vx: (Math.random() - 0.5) * 1.5, vy: 0.5, rot: 0, vr: (Math.random() - 0.5) * 8, col: ['#e8484f', '#4aa3ff', '#4cc77d', '#ffd54a'][Math.floor(Math.random() * 4)], t: 0, dur: 0.6 }); }
  if (f.x > G.L.W + 1.6) { G.santaFly = null; snegPuff(G); }
}
// 2.11.5: кто правит летучими санями — без двойников: Снегурочка (если она на поле — пересаживается),
// а если она уже правит санями сопровождения — Дед Мороз; если и он на поле — сани летят с одним оленем
Z.flyRider = function (G) {
  var on = function (tp) { return (G.squad || []).some(function (U) { return U.type === tp && !U.dead; }); };
  if (on('sneg') || !(G.L && G.L.type === 'escort')) return 'sneg';
  return on('moroz') ? 'none' : 'moroz';
};
// Снегурочка с поля садится в сани и возвращается обратно — вспышка искр на её месте
function snegPuff(G) { if (Z.flyRider(G) !== 'sneg') return; (G.squad || []).forEach(function (U) { if (U.type !== 'sneg' || U.dead) return; for (var i = 0; i < 8; i++) if (G.fx.length < 420) G.fx.push({ k: 'star', x: U.x + Math.cos(i * 0.8) * 0.35, y: U.y - 0.4 + Math.sin(i * 0.8) * 0.3, t: 0, dur: 0.5 + i * 0.03 }); }); }
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!G || !G.L) return;
  try { if (G.santaFly) flyTick(G, dt); } catch (er) { G.santaFly = null; }
};
// нажатие на поле: выбрать линию полёта / порулить
var oHook = UI.tapHook;
UI.tapHook = function (wx, wy, px, py) {
  var G = Z.G;
  if (G && UI.aim === 'santa') { UI.aim = null; if (wx >= -0.5 && wy >= -0.5 && wx <= G.L.W + 0.5 && wy <= G.L.H + 0.5) Z.useSkill('santa', wx, wy); return true; }
  if (G && G.santaFly) { G.santaFly.ty = Math.max(0.6, Math.min(G.L.H - 0.6, wy)); return true; }
  return oHook ? oHook.apply(this, arguments) : false;
};
// в полёте палец на поле рулит санями (камеру не тащит)
var steer = null;
var oDown = UI.down, oMove = UI.move, oUp = UI.up;
UI.down = function (px, py, id) {
  var G = Z.G;
  if (G && G.santaFly && UI.screen === 'level' && !UI.modal) {
    var L = UI.L, wy = (py - L.fy) / L.cs, wx = (px - L.fx) / L.cs;
    var onBtn = UI.btns && UI.btns().some(function (b) { return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h; });
    if (!onBtn && wx > -1 && wx < G.L.W + 1 && wy > -1 && wy < G.L.H + 1) { steer = id === undefined ? 0 : id; G.santaFly.ty = Math.max(0.6, Math.min(G.L.H - 0.6, wy)); return; }
  }
  return oDown.apply(this, arguments);
};
UI.move = function (px, py, id) {
  var G = Z.G;
  if (steer !== null && (id === undefined ? 0 : id) === steer && G && G.santaFly) { var L = UI.L; G.santaFly.ty = Math.max(0.6, Math.min(G.L.H - 0.6, (py - L.fy) / L.cs)); return; }
  return oMove.apply(this, arguments);
};
UI.up = function (px, py, id) {
  if (steer !== null && (id === undefined ? 0 : id) === steer) { steer = null; return; }
  return oUp.apply(this, arguments);
};
var oOver = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  if (oOver) oOver(ctx, X, Y, cs, t);
  var G = Z.G, f = G && G.santaFly; if (!f) return;
  try {
    // тень и полоса удара на земле
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#1b2448'; ctx.beginPath(); ctx.ellipse(X(f.x), Y(f.y + 0.3), cs * 1.1, cs * 0.3, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.12; ctx.fillStyle = '#ffe9a0'; ctx.fillRect(X(Math.max(0, f.x - 3)), Y(f.y - 1.35), Math.max(0, X(f.x) - X(Math.max(0, f.x - 3))), cs * 2.7);
    // след из звёзд
    for (var i = 0; i < 12; i++) { ctx.globalAlpha = 0.8 - i * 0.06; D.star(X(f.x - 0.3 - i * 0.28), Y(f.y - 1.0) + Math.sin(i + t * 10) * cs * 0.06, cs * 0.1, i % 2 ? '#fff' : '#ffd54a'); }
    ctx.globalAlpha = 1;
    ctx.translate(X(f.x), Y(f.y - 0.9)); ctx.rotate(f.tilt || 0);
    D.sleighRider = Z.flyRider ? Z.flyRider(G) : 'sneg'; D.sleighAir = true; D.sleigh(0, 0, cs * 1.3, 1, t, 0); D.sleighAir = false; D.sleighRider = null;
    ctx.restore();
    // прицел линии полёта
    if (Math.abs(f.ty - f.y) > 0.2) { ctx.save(); ctx.globalAlpha = 0.5; ctx.setLineDash([cs * 0.2, cs * 0.15]); ctx.strokeStyle = '#ffe066'; ctx.lineWidth = Math.max(1.5, cs * 0.05); ctx.beginPath(); ctx.moveTo(X(f.x + 0.6), Y(f.y)); ctx.lineTo(X(f.x + 2.2), Y(f.ty)); ctx.stroke(); ctx.restore(); }
  } catch (er) { ctx.restore && ctx.restore(); }
};
// пока выбираешь линию — полоса под пальцем/курсором
var oOver2 = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  if (oOver2) oOver2(ctx, X, Y, cs, t);
  var G = Z.G; if (!G || UI.aim !== 'santa' || !UI.ptrHover) return;
  var L = UI.L, wy = (UI.ptrHover.y - L.fy) / L.cs; if (wy < 0 || wy > G.L.H) return;
  ctx.save(); ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 6); ctx.fillStyle = '#ffe066'; ctx.fillRect(X(0), Y(wy - 1.3), X(G.L.W) - X(0), cs * 2.6); ctx.restore();
};

// ---------- «Авто» выключилось — сказать об этом у героя ----------
var oMoveH = Z.heroMove;
Z.heroMove = function (x, y, U, keepAuto) {
  var G = Z.G, H = U || (UI.heroSel && UI.heroSel.type ? UI.heroSel : G && G.hero), was = H && H.auto;
  var r = oMoveH.apply(this, arguments);
  if (r && was && H && !H.auto && _.addText) _.addText(TT('АВТО выкл.', 'AUTO off'), H.x, H.y - 1.3, '#dfe7ff', 1.1, 0.55);
  return r;
};
})();
// 2.10.4: враг, пробирающийся в ворота, растворяется в проёме и уже не цель
(function () {
var Z = window.Z, D = Z.D;
var oE = D.enemy;
D.enemy = function (e, x, y, cs, t) {
  if (e && e.enterT > 0) { var c = D.ctx, a0 = c.globalAlpha; c.globalAlpha = a0 * Math.max(0, Math.min(1, e.enterT / 0.9)); var r = oE.apply(this, arguments); c.globalAlpha = a0; return r; }
  return oE.apply(this, arguments);
};
var oU = Z.hk.untargetable;
Z.hk.untargetable = function (e) { if (e.enterT > 0) return true; return oU ? oU(e) : false; };
})();
