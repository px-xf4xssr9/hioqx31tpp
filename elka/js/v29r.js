/* 2.11.5 · «Заячьи тропы»: зайцев не купить — их доверие заслуживают поступками, у решений есть последствия.
   Доверие общее (сердечки над зайцами):
   + победить енота-ловца, который несёт в мешке зайчонка, — зайчонок свободен и сразу друг, доверие +2;
   + волна прошла, а к норе ни один враг не подошёл — +1;
   − енот-ловец ушёл с зайчонком — −1 и одним зайцем меньше;
   − вышка у самой норы — заяц пугается и уходит с карты, −1;
   − дикий заяц подорвался на нашей мине — сбегает навсегда, −1.
   Дикие зайцы пугливы (нажатие — отпрыгнет) и случайно разряжают ловушки обеих сторон.
   При доверии 2 оставшиеся зайцы — друзья: засада у дороги и испуг врагов, грызут постройки врагов, находят монетки. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, TT = Z.TT || function (r, e) { return Z.LANG === 'en' ? e : r; };
var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function hares(G) { return (G && G.critters || []).filter(function (h) { return h && h.k === 'hare'; }); }
function hopAway(G, h, ex, ey) {
  var L = G.L, best = null, bd = -1;
  DIRS.forEach(function (d) { for (var k = 2; k >= 1; k--) { var c = Math.floor(h.x) + d[0] * k, r = Math.floor(h.y) + d[1] * k; if (L.grid[r] && L.grid[r][c] === 0 && !G.towers[r * L.W + c]) { var dd = Math.hypot(c + 0.5 - ex, r + 0.5 - ey); if (dd > bd) { bd = dd; best = [c, r, d[0]]; } break; } } });
  if (!best) return;
  h.fx = h.x; h.fy = h.y; h.x = best[0] + 0.5; h.y = best[1] + 0.5; h.hop = 0.35; h.dir = best[2] || h.dir || 1; h.t = 1.6 + Math.random();
}
// засада: свободная клетка рядом с дорогой, ближайшая к зайцу (и не занятая другим зайцем)
function ambushSpot(G, h) {
  var L = G.L, best = null, bd = 1e9, cells = [];
  (L.paths || [L.main]).forEach(function (p) { (p || []).forEach(function (c) { cells.push(c); }); });
  var taken = (G.critters || []).filter(function (o) { return o && o !== h && o.amb; }).map(function (o) { return o.amb; });
  cells.forEach(function (c) { DIRS.forEach(function (d) { var cc = c[0] + d[0], rr = c[1] + d[1]; if (!L.grid[rr] || L.grid[rr][cc] !== 0 || G.towers[rr * L.W + cc] || (Z.inEnemyZone && Z.inEnemyZone(cc, rr))) return;
    var x = cc + 0.5, y = rr + 0.5; if (taken.some(function (q) { return Math.hypot(q.x - x, q.y - y) < 2.5; })) return; var dd = Math.hypot(x - h.x, y - h.y); if (dd < bd) { bd = dd; best = { x: x, y: y }; } }); });
  return best;
}
// шаг по клеткам к цели в обход деревьев, камней и вышек (поиск в ширину)
function stepToward(G, h, tg) {
  var L = G.L, W = L.W, H = L.H, sc = Math.floor(h.x), sr = Math.floor(h.y), tc = Math.floor(tg.x), tr = Math.floor(tg.y);
  var ok = function (c, r) { return r >= 0 && r < H && c >= 0 && c < W && (L.grid[r][c] === 0 || L.grid[r][c] === 1) && !G.towers[r * W + c]; };
  var prev = {}, q = [[sc, sr]], key = function (c, r) { return r * W + c; }; prev[key(sc, sr)] = -1;
  for (var qi = 0; qi < q.length && qi < 600; qi++) { var c = q[qi][0], r = q[qi][1];
    if (Math.abs(c - tc) + Math.abs(r - tr) <= 1) { var k = key(c, r), path = []; while (prev[k] !== -1) { path.push(k); k = prev[k]; } if (!path.length) return null; var f = path[path.length - 1]; return [f % W + 0.5, Math.floor(f / W) + 0.5]; }
    for (var d = 0; d < 4; d++) { var nc = c + DIRS[d][0], nr = r + DIRS[d][1], nk = key(nc, nr); if (prev[nk] === undefined && ok(nc, nr)) { prev[nk] = key(c, r); q.push([nc, nr]); } } }
  return null;
}
// дикий заяц приземлился на клетку: случайно разряжает нашу ловушку или задевает постройку врагов
function say(txt, x, y, col) { if (Z._ && Z._.addText) Z._.addText(txt, x, y, col || '#fff', 0.9, 0.75); }
function wildLanding(G, h, c, r, battle) {
  var L = G.L, tr = G.traps && G.traps[r * L.W + c];
  if (tr && battle && Math.random() < 0.45) {
    if (tr.type === 'mine') { Z._.explode(c + 0.5, r + 0.5, 1.3, 90, false, true); delete G.traps[r * L.W + c]; loseHare(G, h, TT('Заяц подорвался на мине и сбежал…', 'A hare hit our mine and fled…')); return; }
    tr.uses--; say(TT('Заяц разрядил ловушку!', 'A hare set off the trap!'), c + 0.5, r - 0.3, '#ffb3a0'); h.bang = 0.8; return;
  }
  if (h.accCd > G.t) return;
  var st = (G.structs || []).filter(function (s) { return s.done && !s.dead && Math.abs(s.c - c) <= 1 && Math.abs(s.r - r) <= 1; })[0];
  if (st && Math.random() < 0.35) {
    h.accCd = (G.t || 0) + 6; h.bang = 0.8;
    if (st.type === 'powder') { say(TT('Заяц задел порох!', 'A hare knocked the powder!'), st.c + 0.5, st.r - 0.4, '#ffb347'); Z.damageStruct(st, st.hp + 1); }
    else { Z.damageStruct(st, Math.ceil((st.max || 100) * 0.3)); say(TT('Заяц задел!', 'A hare bumped it!'), st.c + 0.5, st.r - 0.4, '#ffe9a0'); }
  }
}
// заяц-друг между волнами грызёт ближайшую постройку врагов
function gnaw(G, h, dt) {
  var st = null, bd = 1e9; (G.structs || []).forEach(function (s) { if (!s.done || s.dead) return; var d = Math.hypot(s.c + 0.5 - h.x, s.r + 0.5 - h.y); if (d < bd) { bd = d; st = s; } });
  if (!st) return;
  h.t = 3;   // не скачет просто так — идёт к постройке
  if (bd > 1.6) { h.seekT = (h.seekT || 0) - dt; if (h.seekT <= 0) { h.seekT = 0.8; var sp = stepToward(G, h, { x: st.c + 0.5, y: st.r + 0.5 }); if (sp) { h.fx = h.x; h.fy = h.y; h.dir = sp[0] > h.x ? 1 : sp[0] < h.x ? -1 : h.dir || 1; h.x = sp[0]; h.y = sp[1]; h.hop = 0.35; } } return; }
  h.gnT = (h.gnT || 0) - dt; if (h.gnT > 0) return; h.gnT = 1.5; h.hop = 0.2; h.fx = h.x; h.fy = h.y;
  if (st.type === 'powder') { say(TT('Заяц подгрыз бочку!', 'The hare gnawed the keg!'), st.c + 0.5, st.r - 0.4, '#ffb347'); Z.damageStruct(st, st.hp + 1); return; }
  Z.damageStruct(st, Math.max(4, Math.ceil((st.max || 100) * 0.06))); say(TT('хрум!', 'crunch!'), st.c + 0.5, st.r - 0.5, '#ffe9a0');
}
// ---------- доверие ----------
function trust(G, d, txt, col) {
  G.hareTrust = Math.max(0, (G.hareTrust || 0) + d);
  if (txt) G.banner = { text: d > 0 ? TT('Зайцы оценили', 'The hares noticed') : TT('Зайцы обиделись', 'The hares are upset'), sub: txt, t: 3 };
  hares(G).forEach(function (h) { h.love = d > 0 ? 1.2 : 0; if (d < 0) h.bang = 0.8; });
  if (G.hareTrust >= 2) hares(G).forEach(function (h) { if (!h.friend) { h.friend = true; h.giftCd = 3; } });
  try { var BF = Z.AU.bufs || {}; Z.AU.sfx(BF[d > 0 ? 'a_trust_up' : 'a_trust_down'] ? (d > 0 ? 'a_trust_up' : 'a_trust_down') : (d > 0 ? 'reward' : 'ice_break'), 0.6); if (BF.a_hare_thump) Z.AU.sfx('a_hare_thump', 0.5); } catch (er) { if (window.__rep) window.__rep(er); }
}
function loseHare(G, h, txt) {
  var i = G.critters.indexOf(h); if (i >= 0) G.critters.splice(i, 1);
  if (G.fx && G.fx.length < 400) for (var k = 0; k < 6; k++) G.fx.push({ k: 'star', x: h.x + (Math.random() - 0.5) * 0.6, y: h.y - 0.4, t: 0, dur: 0.5 });
  trust(G, -1, txt);
}
function burrowPos(G) { var lm = G.L.landmark; return lm ? { x: lm.c + 1, y: lm.r + 1.6 } : null; }
function trustTick(G, dt, battle) {
  var B = burrowPos(G); if (!B) return;
  // вышка у самой норы — заяц уходит
  G._twSeen = G._twSeen || {};
  for (var k in G.towers) { if (G._twSeen[k]) continue; G._twSeen[k] = 1; var tw = G.towers[k]; if (!G._twInit) continue;
    if (Math.hypot(tw.c + 0.5 - B.x, tw.r + 0.5 - B.y) < 2.3) { var hs = hares(G).filter(function (q) { return !q.friend; }); var victim = hs[0] || hares(G)[0]; if (victim) loseHare(G, victim, TT('Стройка у самой норы — один заяц ушёл с этих мест', 'Building right by the burrow — a hare left for good')); } }
  G._twInit = 1;
  // враги у норы
  if (battle) { G._wasBattle = 1; if (!G._burrowHit) G.enemies.some(function (e) { if (e.dead || e.neutral) return false; var p = Z.enemyPos ? Z.enemyPos(e) : e; if (Math.hypot(p.x - B.x, p.y - B.y) < 2.2) { G._burrowHit = 1; say(TT('Враги у норы!', 'Enemies at the burrow!'), B.x, B.y - 1.2, '#ffb3a0'); return true; } return false; }); }
  else if (G._wasBattle) { G._wasBattle = 0; if (!G._burrowHit && hares(G).length) trust(G, 1, TT('Нора цела — к ней ни один враг не подошёл', 'The burrow is safe — no enemy came near')); G._burrowHit = 0; }
  // енот-ловец с зайчонком в мешке — во второй волне
  if (battle && G.wave >= 2 && !G._trapper) { G._trapT = (G._trapT || 0) + dt; if (G._trapT > 4) { G._trapper = Z.spawn('raccoon', 0, 1.6 * (Z.hpScale ? Math.pow(Z.hpScale(G.idx), 0.6) : 1), { hareSack: true }); hares(G).forEach(function (q) { q.bang = 1.2; }); } }
  var T = G._trapper; if (T && T.dead && !T._done) { T._done = 1; if (!T._freed) { var hs2 = hares(G); if (hs2.length) { var v = hs2[hs2.length - 1], i2 = G.critters.indexOf(v); if (i2 >= 0) G.critters.splice(i2, 1); } trust(G, -1, TT('Енот унёс зайчонка… Зайцы это запомнят', 'The raccoon carried off a leveret… The hares will remember')); } }
}
var oKill = Z.hk.kill;
Z.hk.kill = function (e) {
  if (oKill) oKill(e);
  var G = Z.G; if (!e || !e.hareSack || !G) return;
  e._freed = 1; var p = Z.enemyPos ? Z.enemyPos(e) : e;
  G.critters.push({ k: 'hare', x: Math.floor(p.x) + 0.5, y: Math.floor(p.y) + 0.5, t: 2, dir: 1, hop: 0.35, friend: true, giftCd: 4 });
  trust(G, 2, TT('Зайчонок спасён из мешка! Он теперь с тобой', 'You freed the leveret! It is on your side now'));
};
// мешок с зайчонком на спине енота-ловца (торчат уши, мешок дёргается)
var oEn = D.enemy;
D.enemy = function (e, x, y, cs, t) {
  var r = oEn.apply(this, arguments);
  if (e && e.hareSack && !e.dead) {
    var ctx = D.ctx, R = cs * 0.31 * (e.size || 1), d = e.dir || 1, wig = Math.sin(t * 9) * R * 0.05, sx = x - d * R * 0.55, sy = y - R * 1.15 + wig, l = Math.max(1.2, R * 0.1);
    [-1, 1].forEach(function (k) { ctx.save(); ctx.translate(sx + k * R * 0.1, sy - R * 0.32); ctx.rotate(k * 0.25 + Math.sin(t * 7 + k) * 0.15); D.ell(0, -R * 0.22, R * 0.07, R * 0.24, '#ffffff', l * 0.7); D.ell(0, -R * 0.22, R * 0.03, R * 0.15, '#ffc1cf'); ctx.restore(); });
    D.ell(sx, sy, R * 0.42, R * 0.38, '#b88a52', l); ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = l * 0.8; ctx.beginPath(); ctx.moveTo(sx - R * 0.2, sy - R * 0.3); ctx.lineTo(sx + R * 0.2, sy - R * 0.3); ctx.stroke();
    if ((t * 0.7) % 3 < 0.8) D.text(TT('пи-пи!', 'eep!'), sx, sy - R * 1.0, R * 0.3, '#ffffff', 'center', 'middle', 2);
  }
  return r;
};
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!G || !G.L || G.mech !== 'hares') return;
  try {
    var battle = G.phase === 'wave' || G.phase === 'escortRun';
    trustTick(G, dt, battle);
    hares(G).forEach(function (h) {
      h.scareCd = Math.max(0, (h.scareCd || 0) - dt); h.giftCd = Math.max(0, (h.giftCd === undefined ? 4 : h.giftCd) - dt); h.bang = Math.max(0, (h.bang || 0) - dt); h.love = Math.max(0, (h.love || 0) - dt);
      var hc = Math.floor(h.x), hr = Math.floor(h.y), moved = hc !== h.cx || hr !== h.cy; h.cx = hc; h.cy = hr;
      if (!h.friend) { if (moved) wildLanding(G, h, hc, hr, battle); return; }
      if (!battle) { gnaw(G, h, dt); return; }
      // в бою заяц сам скачет навстречу ближайшему врагу (в пределах 5 клеток), чтобы напугать
      h.seekT = (h.seekT === undefined ? 1.5 : h.seekT) - dt;
      if (h.seekT <= 0 && h.scareCd <= 0) {
        h.seekT = 0.9 + Math.random() * 0.5;
        if (!h.amb) h.amb = ambushSpot(G, h);
        var tg = h.amb && Math.hypot(h.amb.x - h.x, h.amb.y - h.y) > 0.3 ? h.amb : null;
        if (!tg) h.t = 3;   // на месте засады сидит, не прыгает просто так
        if (tg) { var st = stepToward(G, h, tg); if (st) { h.fx = h.x; h.fy = h.y; h.dir = st[0] > h.x ? 1 : st[0] < h.x ? -1 : h.dir || 1; h.x = st[0]; h.y = st[1]; h.hop = 0.35; h.t = 2; } }
      }
      if (h.scareCd > 0) return;
      for (var i = 0; i < G.enemies.length; i++) {
        var e = G.enemies[i]; if (e.dead || e.neutral || e.air || e.boss || e.vehicle) continue;
        var p = Z.enemyPos ? Z.enemyPos(e) : e; if (Math.hypot(p.x - h.x, p.y - h.y) > 1.4) continue;
        e.stun = Math.max(e.stun || 0, 0.9); h.scareCd = 3; h.bang = 0.8;
        if (Z._ && Z._.addText) Z._.addText(TT('Испугался!', 'Spooked!'), p.x, p.y - 1.0, '#ffe9a0', 0.9, 0.7);
        try { Z.AU.sfx((Z.AU.bufs || {}).a_hare_squeak ? 'a_hare_squeak' : 'select', 0.45, { pitch: (Z.AU.bufs || {}).a_hare_squeak ? 1 : 1.9, gap: 0.3 }); } catch (er) { if (window.__rep) window.__rep(er); }
        hopAway(G, h, p.x, p.y); break;
      }
    });
  } catch (er) { if (window.__rep) window.__rep(er); }
};
// нажатие на зайца — монетки
var oTap = UI.tapHook;
UI.tapHook = function (wx, wy, px, py) {
  var G = Z.G;
  if (G && G.mech === 'hares' && UI.screen === 'level') {
    var h = hares(G).filter(function (q) { return Math.hypot(q.x - wx, q.y - 0.3 - (q._lf || 0) - wy) < 0.7; })[0];
    if (h) {
      if (!h.friend) {   // дикий: пугливый — отпрыгивает, ничего не даёт (доверие заслуживают поступками)
        hopAway(G, h, wx, wy); h.bang = 0.6; say(TT('Пугливый…', 'Skittish…'), h.x, h.y - 0.9, '#dfe7ff'); try { if ((Z.AU.bufs || {}).a_hare_thump) Z.AU.sfx('a_hare_thump', 0.5); } catch (er) { if (window.__rep) window.__rep(er); } return true;
      }
      if (h.giftCd <= 0) { h.giftCd = 20; G.coins += 5; h.hop = 0.35; h.fx = h.x; h.fy = h.y;
        if (Z._ && Z._.addText) Z._.addText('+5', h.x, h.y - 0.9, '#ffd54a', 1.1, 0.9);
        if (G.fx && G.fx.length < 400) for (var k = 0; k < 6; k++) G.fx.push({ k: 'star', x: h.x + (Math.random() - 0.5) * 0.6, y: h.y - 0.5 + (Math.random() - 0.5) * 0.4, t: 0, dur: 0.5 });
        try { Z.AU.sfx('coin', 0.7); } catch (er) { if (window.__rep) window.__rep(er); } }
      else if (Z._ && Z._.addText) Z._.addText(TT('Ищет ещё…', 'Looking for more…'), h.x, h.y - 0.9, '#dfe7ff', 0.8, 0.6);
      return true;
    }
  }
  return oTap ? oTap.apply(this, arguments) : false;
};
// над зайцем с подарком — крутится монетка; испуг — «!»
var oOver = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  if (oOver) oOver(ctx, X, Y, cs, t);
  var G = Z.G; if (!G || G.mech !== 'hares') return;
  hares(G).forEach(function (h) {
    var hp = h.hop > 0 ? Math.sin(h.hop / 0.35 * Math.PI) * cs * 0.3 : 0, x = X(h.x), y = Y(h.y - (h._lf || 0)) - cs * 0.62 - hp + Math.sin(t * 3 + h.x) * cs * 0.03;   // вплотную над зайцем, вместе с прыжком
    if (h.bang > 0) { ctx.globalAlpha = Math.min(1, h.bang * 3); D.text('!', x, y - cs * 0.1, cs * 0.4, '#ffd54a', 'center', 'middle', 3); ctx.globalAlpha = 1; return; }
    var heart = function (hx, hy, r, full) { ctx.beginPath(); ctx.moveTo(hx, hy + r * 0.9); ctx.bezierCurveTo(hx - r * 1.4, hy - r * 0.1, hx - r * 0.7, hy - r * 1.2, hx, hy - r * 0.4); ctx.bezierCurveTo(hx + r * 0.7, hy - r * 1.2, hx + r * 1.4, hy - r * 0.1, hx, hy + r * 0.9); ctx.closePath(); ctx.fillStyle = full ? '#ff5a7a' : 'rgba(255,255,255,0.75)'; ctx.fill(); ctx.lineWidth = Math.max(1, cs * 0.025); ctx.strokeStyle = '#1b2448'; ctx.stroke(); };
    if (!h.friend) {   // дикий: две сердечки — общее доверие зайцев
      var r0 = cs * 0.08, kk = G.hareTrust || 0; heart(x - r0 * 1.3, y + cs * 0.12, r0, kk >= 1); heart(x + r0 * 1.3, y + cs * 0.12, r0, kk >= 2);
      if (h.love > 0) { ctx.globalAlpha = h.love; heart(x + cs * 0.25, y - cs * 0.3 - (1 - h.love) * cs * 0.3, cs * 0.1, true); ctx.globalAlpha = 1; }
      return;
    }
    heart(x - cs * 0.22, y + cs * 0.15, cs * 0.07, true);
    if (h.giftCd <= 0) { var w = Math.abs(Math.cos(t * 3)); ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.15, w), 1); D.circ(0, 0, cs * 0.13, '#ffd54a', Math.max(1.2, cs * 0.03)); ctx.restore(); if (w > 0.4) D.text('5', x, y + cs * 0.005, cs * 0.14, '#b07a10', 'center', 'middle', 0); }
  });
};
})();
