// v2.6j: враги вылезают из нор — с замахом и выбросом:
// нора дрожит и светится, по снегу бегут трещины → взрыв снега и комьев, ударная волна, дым →
// враг выпрыгивает дугой и приземляется с пылью; у боссов всё крупнее, с тряской экрана.
(function () {
  var Z = window.Z, D = Z.D, OL = '#26304f';
  var lastSnd = 0, lastLand = 0;
  var WU = 0.32, WUB = 0.45; // доля замаха

  function H(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function snd(name, vol, pitch, x, y, force) { var now = Z.time || 0; if (!force && now - lastSnd < 0.18) return; lastSnd = now; if (Z.AU.at) Z.AU.at(x, y); Z.AU.sfx(name, vol, { pitch: pitch }); }

  var oldSpawn = Z.spawn;
  Z.spawn = function (type, pathIdx, hpMul, opts) {
    var fromHole = !(opts && (opts.x !== undefined || opts.y !== undefined));
    var e = oldSpawn.apply(this, arguments);
    var G = Z.G, L = G && G.L;
    if (!e || !fromHole || !L || !L.entrances || !L.entrances.length) return e;
    var ent = L.entrances[(pathIdx || 0) % L.entrances.length];
    e.x = ent[0] + 0.5; e.y = ent[1] + 0.5;
    e.emX = e.x; e.emY = e.y;
    var dur = e.boss ? 1.9 : e.air ? 0.8 : 1.05;
    e.emD = e.emT = dur; e.emW = e.boss ? WUB : WU; e.emBurst = false; e.emLand = false;
    var fx = { x: e.x, y: e.y, t: 0, dur: dur + 0.9, w: dur * e.emW, boss: !!e.boss, air: !!e.air, seed: Math.random() * 100, size: e.size || 1 };
    (G._emFx || (G._emFx = [])).push(fx); e._emFx = fx;
    if (G._emFx.length > 24) G._emFx.shift();
    if (e.boss) { snd('avalanche', 0.6, 0.7, e.x, e.y, true); }
    return e;
  };

  // пока вылезает — стоит на месте; события: выброс, приземление
  var oldHE = Z.hk.enemy;
  Z.hk.enemy = function (e, dt, v) {
    if (e.emT > 0) {
      e.emT -= dt;
      var G = Z.G, p = 1 - Math.max(0, e.emT) / e.emD, w = e.emW;
      if (e.boss && p < w) G.shake = Math.max(G.shake || 0, 0.12 + p / w * 0.3);
      if (!e.emBurst && p >= w) {
        e.emBurst = true;
        if (e.boss) G.fx.push({ k: 'ring', x: e.emX, y: e.emY, r: 2.4, t: 0, dur: 0.7, col: '#ff6b6b' });
        if (Z._.snowPuff) Z._.snowPuff(e.emX, e.emY - 0.1, e.boss ? 18 : 8);
        if (e.boss) { G.shake = Math.max(G.shake || 0, 0.7); G.flash = Math.max(G.flash || 0, 0.15); G.decals && G.decals.push({ k: 'crack', x: e.emX, y: e.emY, s: 1.8, rot: Math.random() * 6 }); }
        snd('mine_pop', e.boss ? 0.7 : 0.32, e.boss ? 0.55 : 0.8 + Math.random() * 0.25, e.emX, e.emY, e.boss);
        if (e.boss || Math.random() < 0.4) snd('ice_break', e.boss ? 0.5 : 0.14, e.boss ? 0.6 : 1.1, e.emX, e.emY, true);
      }
      if (!e.emLand && !e.air && p >= w + (1 - w) * 0.85) {
        e.emLand = true;
        if (Z._.snowPuff) Z._.snowPuff(e.emX, e.emY + 0.2, e.boss ? 12 : 5);
        if (e.boss) { G.shake = Math.max(G.shake || 0, 0.6); Z.AU.boom && Z.AU.boom(1.1); }
        else if ((Z.time || 0) - lastLand > 0.25) { lastLand = Z.time || 0; if (Z.AU.at) Z.AU.at(e.emX, e.emY); Z.AU.sfx('build', 0.12, { pitch: 1.3 }); }
      }
      e.walk += dt * 6;
      return true;
    }
    return oldHE ? oldHE(e, dt, v) : false;
  };
  // во время замаха врага ещё нет — дальние вышки по пустой норе не стреляют
  var oldUnseen = Z.hk.unseen;
  Z.hk.unseen = function (e) { if (e.emT > 0 && 1 - e.emT / e.emD < e.emW) return true; return oldUnseen ? oldUnseen(e) : false; };

  var oldUpd = Z.hk.update;
  Z.hk.update = function (dt) {
    var G = Z.G;
    if (G && G._emFx) { for (var i = G._emFx.length - 1; i >= 0; i--) { G._emFx[i].t += dt; if (G._emFx[i].t > G._emFx[i].dur) G._emFx.splice(i, 1); } }
    if (oldUpd) return oldUpd(dt);
  };

  // ---- нора дрожит во время замаха ----
  var oldEnt = D.entrance;
  D.entrance = function (x, y, cs, t, warn) {
    var G = Z.G, f = null;
    if (G && G._emFx && Z.ui && Z.ui.X) for (var i = 0; i < G._emFx.length; i++) { var q = G._emFx[i]; if (q.t < q.w + 0.25 && Math.abs(Z.ui.X(q.x) - x) < 2 && Math.abs(Z.ui.Y(q.y) - y) < 2) f = q; }
    if (!f) return oldEnt.apply(this, arguments);
    var ctx = D.ctx, k = Math.min(1, f.t / f.w), amp = cs * (f.boss ? 0.07 : 0.04) * k * (f.t < f.w ? 1 : Math.max(0, 1 - (f.t - f.w) / 0.25));
    ctx.save();
    ctx.translate(x + Math.sin(t * 90 + f.seed) * amp, y + Math.cos(t * 77) * amp * 0.5);
    var sc = 1 + 0.12 * k * (0.5 + 0.5 * Math.sin(t * 30));
    ctx.scale(sc, sc);
    oldEnt.call(this, 0, 0, cs, t, warn);
    ctx.restore();
  };

  // ---- под объектами: свечение, трещины, ударная волна ----
  var oldUnder = Z.drawUnder;
  Z.drawUnder = function (ctx, X, Y, cs, t) {
    if (oldUnder) oldUnder(ctx, X, Y, cs, t);
    var G = Z.G; if (!G || !G._emFx) return;
    G._emFx.forEach(function (f) {
      var hx = X(f.x), hy = Y(f.y), B = f.boss ? 1.9 : 1, tb = f.t - f.w;
      // свечение из глубины
      var gk = tb < 0 ? f.t / f.w : Math.max(0, 1 - tb / 0.5);
      if (gk > 0.01) {
        var gr = ctx.createRadialGradient(hx, hy, 0, hx, hy, cs * 1.1 * B);
        gr.addColorStop(0, 'rgba(255,70,90,' + (0.55 * gk).toFixed(3) + ')'); gr.addColorStop(0.5, 'rgba(150,60,200,' + (0.25 * gk).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(120,60,200,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(hx, hy, cs * 1.1 * B, cs * 0.8 * B, 0, 0, 7); ctx.fill();
      }
      // трещины бегут по снегу
      var ck = Math.min(1, f.t / f.w), ca = tb < 0.15 ? 1 : Math.max(0, 1 - (tb - 0.15) / (f.boss ? 1.2 : 0.4));
      if (ck > 0 && ca > 0) {
        ctx.save(); ctx.globalAlpha *= ca * 0.75; ctx.strokeStyle = 'rgba(70,60,120,0.7)'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        var n = f.boss ? 8 : 5;
        for (var i = 0; i < n; i++) {
          var a = i / n * Math.PI * 2 + H(f.seed + i) * 0.8, len = cs * (0.25 + H(f.seed + i * 3) * 0.25) * B * ck;
          ctx.lineWidth = Math.max(1, cs * 0.03 * (f.boss ? 1.5 : 1));
          ctx.beginPath(); var px = hx + Math.cos(a) * cs * 0.38, py = hy + Math.sin(a) * cs * 0.28; ctx.moveTo(px, py);
          for (var s = 1; s <= 3; s++) { var aa = a + (H(f.seed + i * 7 + s) - 0.5) * 0.9, d = len * s / 3; ctx.lineTo(hx + Math.cos(a) * cs * 0.38 + Math.cos(aa) * d, hy + Math.sin(a) * cs * 0.28 + Math.sin(aa) * d * 0.7); }
          ctx.stroke();
        }
        ctx.restore();
      }
      // ударная волна по земле
      if (tb > 0 && tb < 0.5) {
        var wk = tb / 0.5;
        ctx.save(); ctx.globalAlpha *= (1 - wk) * 0.8; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = cs * 0.12 * (1 - wk) * B + 1;
        ctx.beginPath(); ctx.ellipse(hx, hy, cs * (0.4 + wk * 1.3) * B, cs * (0.28 + wk * 0.9) * B, 0, 0, 7); ctx.stroke(); ctx.restore();
      }
    });
  };

  // ---- над объектами: комья, снежный гейзер, дым ----
  function drawFx(f, X, Y, cs, t) {
    var ctx = D.ctx, hx = X(f.x), hy = Y(f.y), B = f.boss ? 1.7 : 1, tb = f.t - f.w, l = Math.max(1, cs * 0.035);
    // замах: снежинки подпрыгивают на краю норы
    if (tb < 0) {
      for (var i = 0; i < 6; i++) {
        var a = i / 6 * Math.PI * 2 + f.seed, jump = Math.abs(Math.sin(t * 22 + i * 1.7)) * cs * 0.12 * (f.t / f.w) * B;
        D.circ(hx + Math.cos(a) * cs * 0.44 * B, hy + Math.sin(a) * cs * 0.32 * B - jump, cs * 0.05, '#ffffff', l * 0.6);
      }
      return;
    }
    // дым
    for (var s = 0; s < (f.boss ? 7 : 4); s++) {
      var st = tb - s * 0.04; if (st < 0 || st > 0.9) continue;
      var sk = st / 0.9, sa = H(f.seed + s * 11) * Math.PI * 2;
      ctx.save(); ctx.globalAlpha *= (1 - sk) * 0.55;
      D.circ(hx + Math.cos(sa) * cs * 0.5 * sk * B, hy - cs * (0.2 + sk * 0.9) * B + Math.sin(sa) * cs * 0.15, cs * (0.18 + sk * 0.35) * B, s % 2 ? '#8c7fb3' : '#b9b3d6');
      ctx.restore();
    }
    // снежный гейзер
    var n = f.boss ? 30 : 16, g = cs * 9;
    for (var k = 0; k < n; k++) {
      var life = 0.45 + H(f.seed + k) * 0.35, tt = tb - H(f.seed + k * 5) * 0.08; if (tt < 0 || tt > life) continue;
      var ang = -Math.PI / 2 + (H(f.seed + k * 13) - 0.5) * 1.6, sp = cs * (2.6 + H(f.seed + k * 17) * 2.6) * Math.sqrt(B);
      var px = hx + Math.cos(ang) * sp * tt, py = hy + Math.sin(ang) * sp * tt + g * tt * tt * 0.5;
      ctx.save(); ctx.globalAlpha *= 1 - tt / life; D.circ(px, py, cs * (0.035 + H(f.seed + k * 3) * 0.05) * B, '#ffffff'); ctx.restore();
    }
    // комья земли и снега с обводкой, вращаются
    for (var c = 0; c < (f.boss ? 12 : 6); c++) {
      var lf = 0.7, tc = tb; if (tc > lf) continue;
      var an = -Math.PI / 2 + (H(f.seed + c * 23) - 0.5) * 2.4, v = cs * (2 + H(f.seed + c * 29) * 1.8) * Math.sqrt(B);
      var cx = hx + Math.cos(an) * v * tc, cy = hy + Math.sin(an) * v * tc + g * tc * tc * 0.5, r = cs * (0.06 + H(f.seed + c) * 0.05) * B;
      ctx.save(); ctx.globalAlpha *= Math.min(1, (lf - tc) / 0.15); ctx.translate(cx, cy); ctx.rotate(tc * 12 + c);
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(-r * 0.3, -r * 0.9); ctx.lineTo(r * 0.8, -r * 0.6); ctx.lineTo(r, r * 0.4); ctx.lineTo(0, r * 0.9); ctx.closePath();
      ctx.fillStyle = c % 3 ? '#e8eefb' : '#6a5a6e'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
      ctx.restore();
    }
    // пыль при приземлении
    var tl = f.t - (f.w + ((f.dur - 0.9) - f.w) * 0.85);
    if (!f.air && tl > 0 && tl < 0.4) {
      var dk = tl / 0.4;
      [-1, 1].forEach(function (sd) { ctx.save(); ctx.globalAlpha *= (1 - dk) * 0.8; D.circ(hx + sd * cs * (0.25 + dk * 0.45) * B, hy + cs * 0.1 - dk * cs * 0.12, cs * (0.1 + dk * 0.14) * B, '#ffffff', l * 0.5); ctx.restore(); });
    }
  }
  var oldObjs = Z.drawObjs;
  Z.drawObjs = function (objs, X, Y, cs, t) {
    if (oldObjs) oldObjs(objs, X, Y, cs, t);
    var G = Z.G; if (!G || !G._emFx) return;
    G._emFx.forEach(function (f) { objs.push({ y: f.y + 0.45, f: function () { drawFx(f, X, Y, cs, Z.time); } }); });
  };

  // ---- сам враг: прячется в норе, выпрыгивает дугой, приземляется с приседом ----
  var oldEnemy = D.enemy;
  D.enemy = function (e, x, y, cs, t) {
    if (!(e.emT > 0) || !Z.ui || !Z.ui.X) return oldEnemy.apply(this, arguments);
    var ctx = D.ctx; if (!ctx) return oldEnemy.apply(this, arguments);
    var p = 1 - Math.max(0, e.emT) / e.emD, w = e.emW;
    if (p < w) return; // ещё в глубине
    var u = (p - w) / (1 - w), hx = Z.ui.X(e.emX), hy = Z.ui.Y(e.emY), sz = e.size || 1;
    ctx.save();
    if (e.air) {
      var ka = Math.min(1, u / 0.6), up = Math.sin(Math.min(1, u) * Math.PI) * cs * 0.6;
      ctx.globalAlpha *= ka;
      ctx.translate(x, y - up); ctx.scale(0.4 + 0.6 * ka, 0.4 + 0.6 * ka); ctx.translate(-x, -(y - up));
      oldEnemy.call(this, e, x, y - up, cs, t);
      ctx.restore(); return;
    }
    var depth = cs * 1.0 * sz, peak = cs * (e.boss ? 0.35 : 0.75), yo, sx = 1, sy = 1, rot = 0;
    if (u < 0.3) { var k = u / 0.3; yo = depth * (1 - (1 - (1 - k) * (1 - k))); sy = 1.15; sx = 0.9; }
    else if (u < 0.85) { var v = (u - 0.3) / 0.55; yo = -peak * 4 * v * (1 - v); rot = Math.sin(v * Math.PI) * 0.22 * (H(e.id * 50) < 0.5 ? -1 : 1); sy = 1.08 - v * 0.08; sx = 1 / sy; }
    else { var q = (u - 0.85) / 0.15; yo = 0; sy = 1 - 0.22 * Math.sin(q * Math.PI); sx = 1 + 0.18 * Math.sin(q * Math.PI); }
    ctx.beginPath(); ctx.rect(hx - cs * 5 * sz, hy - cs * 7 * sz, cs * 10 * sz, cs * 7 * sz + cs * 0.06); ctx.clip();
    ctx.translate(x, y + yo); ctx.rotate(rot); ctx.scale(sx, sy); ctx.translate(-x, -(y + yo));
    oldEnemy.call(this, e, x, y + yo, cs, t);
    ctx.restore();
    if (u < 0.3) { // передний край норы поверх ног
      ctx.save(); ctx.beginPath(); ctx.ellipse(hx, hy, cs * 0.46, cs * 0.36, 0, 0, Math.PI); ctx.lineWidth = Math.max(1.5, cs * 0.05); ctx.strokeStyle = '#2a2f55'; ctx.stroke(); ctx.restore();
    }
  };
})();
