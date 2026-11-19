// v2.10.1: враги бьют героев, тревога у ёлки.
// - Метатели кидают снежки и в героев (раньше — только в вышки).
// - Громилы, тараны, леший и кикимора сворачивают к герою рядом и бьют его (недолго, потом идут дальше).
// - Баба-Яга пикирует не только на вышки, но и на героев.
// - Враг у ёлки бьёт, пока его не убьют пушки или герои (до 6 ударов; стражи нет) — «Тревога у ёлки!».
(function () {
var Z = window.Z, D = Z.D, TT = Z.TT, _ = Z._;
var CHASE = { fat: 1, ram: 1, leshy: 1, kiki: 1 };

function heroScale(G) { return Math.pow(G.waveMul || 1, 0.5) * (1 + (G.idx || 0) * 0.015); }
function nearestHero(G, x, y, R) { var b = null, bd = R; (G.squad || []).forEach(function (U) { if (U.dead) return; var d = Math.hypot(U.x - x, U.y - y); if (d < bd) { bd = d; b = U; } }); return b; }
function inDen(G, x, y) { var L = G._den && G._den.g === G ? G._den.list : null; if (!L) return false; var R = G.L.W <= 16 ? 2.5 : 3; for (var i = 0; i < L.length; i++) if (Math.hypot(x - L[i].x, y - L[i].y) <= R + 0.3) return true; return false; }
function hitHero(G, H, dmg, stun) {
  if (!H || H.dead) return;
  H.hp -= dmg; H.hitT = 0.2; if (stun) H.stunT = Math.max(H.stunT || 0, stun);
  if (G.fx.length < 420) G.fx.push({ k: 'spark', x: H.x, y: H.y - 0.4, t: 0, dur: 0.25 });
}

// ---------- метатель: снежки по героям ----------
function throwerStep(G, e, dt) {
  e.hThrowCd = (e.hThrowCd === undefined ? 1 + Math.random() : e.hThrowCd) - dt;
  if (e.hThrowT > 0) { e.hThrowT -= dt; e.busyT = 0.4; return true; }
  if (e.hThrowCd > 0 || inDen(G, e.x, e.y)) return false;
  var H = nearestHero(G, e.x, e.y, 2.6); if (!H) { e.hThrowCd = 0.4; return false; }
  e.hThrowCd = 2.4; e.hThrowT = 0.45; e.lunge = 0.25; e.dir = H.x > e.x ? 1 : -1;
  (G.hShots || (G.hShots = [])).push({ x0: e.x, y0: e.y - 0.35, H: H, t: 0, dur: 0.55, dmg: 7 * heroScale(G) });
  Z.AU.sfx('back', 0.3, { pitch: 0.85, gap: 0.1 });
  return true;
}
// ---------- громилы: сворачивают к герою ----------
function chaseStep(G, e, dt, v) {
  e.chCd = (e.chCd || 0) - dt;
  var H = e.chH;
  if (H && (H.dead || e.chT <= 0 || Math.hypot(H.x - e.x, H.y - e.y) > 2.4 || inDen(G, e.x, e.y))) { e.chH = H = null; e.chCd = 5; }
  if (!H) {
    if (e.chCd > 0 || e.siege || inDen(G, e.x, e.y)) return false;
    H = nearestHero(G, e.x, e.y, 1.5); if (!H) { e.chCd = 0.3; return false; }
    e.chH = H; e.chT = 4; e.hbCd2 = 0.3;
  }
  e.chT -= dt; e.busyT = 0.4;
  var dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy);
  e.dir = dx > 0 ? 1 : -1;
  if (d > 0.5) { var st = Math.min(d - 0.45, (v || e.spd) * 1.1 * dt); var nx = e.x + dx / d * st, ny = e.y + dy / d * st; if (Z.walkable(Math.floor(nx), Math.floor(ny))) { e.x = nx; e.y = ny; } else { e.chH = null; e.chCd = 3; return false; } e.walk += dt * 6; return true; }
  var et = Z.ENEMIES[e.type], per = et.atkRate || 1.2;
  e.hbCd2 -= dt;
  if (e.hbCd2 <= 0) {
    e.hbCd2 = per; e.lunge = 0.2;
    hitHero(G, H, et.dmg * 5 * per * (1 + (G.idx || 0) * 0.03), 0);
    if (!G._hbSnd2 || G.t - G._hbSnd2 > 0.25) { G._hbSnd2 = G.t; Z.AU.sfx('crack', 0.3, { pitch: 0.9 + Math.random() * 0.2 }); }
  }
  return true;
}
// ---------- Баба-Яга: пикирует и на героев ----------
function yagaHeroStep(G, e, dt) {
  if (e.ys === 'diveH') {
    var H = e.dvH;
    if (!H || H.dead) { e.ys = 'back'; e.swT = -1; return true; }
    var side = e.dv.side, px = H.x - side * 0.7, py = H.y - 0.3, dx = px - e.x, dy = py - e.y, d = Math.hypot(dx, dy);
    if (d > 0.08) { var st = Math.min(d, 3.2 * dt); e.x += dx / d * st; e.y += dy / d * st; }
    e.dir = side;
    if (d < 0.3 && !(e.swT >= 0) && !e.dv.done) e.swT = 0;
    if (e.swT >= 0) {
      var p0 = e.swT; e.swT += dt / 0.75;
      if (p0 < 0.52 && e.swT >= 0.52) { hitHero(G, H, H.max * 0.14 + 4 * heroScale(G), 1.2); G.fx.push({ k: 'v_vortex', x: H.x, y: H.y - 0.3, t: 0, dur: 0.8 }); Z.AU.sfx('timp2', 0.4); G.shake = Math.max(G.shake || 0, 0.12); }
      if (e.swT >= 1) { e.swT = -1; e.dv.done = true; e.ys = 'back'; }
    }
    return true;
  }
  e.abilH = (e.abilH === undefined ? 4 : e.abilH) - dt;
  if (!e.ys && !e.ysg && e.abilH <= 0) {
    var H2 = nearestHero(G, e.x, e.y, 3.2);
    if (H2 && Math.random() < 0.6) { e.abilH = 8; e.ys = 'diveH'; e.dvH = H2; e.dv = { x0: e.x, y0: e.y, side: H2.x >= e.x ? 1 : -1 }; if (Z.AU.sfx) Z.AU.sfx('stupa_fly', 0.5); return true; }
    e.abilH = 1.5;
  }
  return false;
}
var oEnemy = Z.hk.enemy;
Z.hk.enemy = function (e, dt, v) {
  var G = Z.G;
  if (G && G.squad && G.squad.length && !e.dead && !(e.emT > 0) && !e.neutral && !e.repairOf && !(e.garT > 0)) {
    if (e.type === 'thrower' && throwerStep(G, e, dt)) return true;
    if (CHASE[e.type] && !e.boss && chaseStep(G, e, dt, v)) return true;
    if (e.type === 'yaga' && yagaHeroStep(G, e, dt)) return true;
  }
  return oEnemy ? oEnemy(e, dt, v) : false;
};

// ---------- обновление: снежки по героям, тревога у ёлки ----------
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!G || !G.L) return;
  try {
    if (G.hShots) for (var i = G.hShots.length - 1; i >= 0; i--) {
      var s = G.hShots[i]; s.t += dt;
      if (s.t >= s.dur) { G.hShots.splice(i, 1); if (!s.H.dead) { hitHero(G, s.H, s.dmg, 0); _.snowPuff && _.snowPuff(s.H.x, s.H.y - 0.3, 6); } }
    }
    (G.squad || []).forEach(function (H) { if (H.dead && !H._wd) G._hd = (G._hd || 0) + 1; H._wd = !!H.dead; });
    var n = 0; for (var j = 0; j < G.enemies.length; j++) { var e = G.enemies[j]; if (!e.dead && e.siege && !e.air) n++; }
    G.alarmN = n;
    if (n > 0) {
      G.alarmT = Math.min(1, (G.alarmT || 0) + dt * 3);
      if (!G._alarmTold && G.L.type !== 'escort') {
        G._alarmTold = true; if (Z.sndAlarm) Z.sndAlarm();
        G.banner = { text: TT('Тревога у ёлки!', 'The tree is under attack!'), sub: TT('Враги бьют ёлку, пока их не собьют твои пушки и герои. Пошли героев на помощь!', 'Enemies keep hitting the tree until your towers and heroes take them down. Send your heroes!'), t: 3, big: true };
      }
    } else G.alarmT = Math.max(0, (G.alarmT || 0) - dt * 1.5);
  } catch (er) { if (window.__rep) window.__rep(er); }
};
var oOver = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  if (oOver) oOver(ctx, X, Y, cs, t);
  var G = Z.G; if (!G || !G.L) return;
  try {
    (G.hShots || []).forEach(function (s) { var p = Math.min(1, s.t / s.dur), x = s.x0 + (s.H.x - s.x0) * p, y = s.y0 + (s.H.y - 0.4 - s.y0) * p - Math.sin(p * Math.PI) * 0.5; D.circ(X(x), Y(y), cs * 0.09, '#ffffff', Math.max(1, cs * 0.03)); });
    // тревога: красный пульс вокруг ёлки
    if (G.alarmT > 0 && G.L.fort && G.L.type !== 'escort') {
      var f = G.L.fort, a = G.alarmT * (0.35 + 0.25 * Math.sin(t * 8));
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#ff4a4a'; ctx.lineWidth = Math.max(2, cs * 0.1);
      var r = cs * (1.4 + 0.15 * Math.sin(t * 8));
      ctx.beginPath(); ctx.ellipse(X(f[0] + 0.5), Y(f[1] + 0.2), r * 1.3, r * 0.6, 0, 0, 7); ctx.stroke();
      ctx.globalAlpha = Math.min(1, a * 1.6); D.text('!', X(f[0] + 0.5), Y(f[1] - 2.3) + Math.sin(t * 8) * cs * 0.05, cs * 0.6, '#ff4a4a', 'center', 'middle', Math.max(2, cs * 0.06));
      ctx.restore();
    }
  } catch (er) { ctx.globalAlpha = 1; }
};
})();
