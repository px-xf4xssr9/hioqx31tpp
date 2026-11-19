/* 2.12.35 · Режиссёр боя: держит игрока в «потоке» — не скучно и не обидно.
   Не весы «играешь хорошо — враги толще», а режиссёр напряжения (как ИИ-режиссёр в Left 4 Dead):
   1) Модель игрока между уровнями: поражения подряд, выход посреди боя, перерыв, первый бой за сессию.
      — 2 поражения подряд на уровне: 3-я попытка почти наверняка проходима; вышел посреди боя — в следующий раз мягче;
        после перерыва больше 6 часов и в первом бою за сессию — разминка.
   2) Ритм волн: после волны, где ёлку сильно били, — «передышка» (враги слабее — игрок их разносит),
      перед последней волной — затишье, финал не трогаем: он должен быть ярким.
   3) Скрытая помощь, похожая на заслугу игрока, — только когда трудно: «Меткий!» (двойной урон), с врагов больше монет,
      ёлка держит удар крепче, враг у самой ёлки «поскользнулся на льду».
   4) Сильному — не толще враги, а интереснее: «Элитный отряд!» вместо прибавки здоровья всей волне.
   5) Переменная награда: иногда «золотой» враг — тройные монеты и снежинка. Волна без потерь — «Чистая волна!» и бонус.
   6) Пик и конец: победа на волоске — «Вот это оборона!»; поражение — полоска «прошёл N % уровня» (см. ui.js).
   Сложность не связана с покупками: помощь бесплатная и одинаковая для всех. Героический, бесконечный режим и испытания — честные. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, _ = Z._;
function TT(r, e) { return Z.TT ? Z.TT(r, e) : r; }
function on(G) { return G && !G.endless && !G.heroic && !G.trial && G.info && G.L && G.idx >= 1; }
function pm() { var s = Z.save; if (!s.pm || typeof s.pm !== 'object') s.pm = { quit: {}, last: 0 }; if (!s.pm.quit) s.pm.quit = {}; return s.pm; }
var session = { n: 0 };   // боёв за эту загрузку игры
function hpf(G) { return G.L.type === 'escort' ? (G.sleigh ? G.sleigh.hp : 1) / Math.max(1, G.hpMax) : G.hp / Math.max(1, G.hpMax); }
// насколько игроку сейчас нужна помощь: 0 — всё хорошо, 1 — вот-вот проиграет
function need(G) {
  if (!on(G)) return 0;
  var h = hpf(G), n = Math.max(0, Math.min(1, (0.62 - h) / 0.42));
  if (h < 0.85 && G.dr && G.dr.near >= 3) n = Math.max(n, 0.45);
  return n;
}
Z.ddaNeed = function () { return need(Z.G); };

// ---------- 1. старт уровня: разминка и страховка ----------
function startEase(G) {
  var P = pm(), f = (Z.save.fails && Z.save.fails[G.idx]) || 0, k = 1, why = '';
  if (f >= 2) { k *= 0.8; why = 'третья попытка'; }                       // вместе со скидкой v27b (−14 %) — около −30 %
  if (P.quit[G.idx]) { k *= 0.9; why = why || 'вышел посреди боя'; }
  if (P.last && Date.now() - P.last > 6 * 3600e3) { k *= 0.92; why = why || 'перерыв'; }
  else if (session.n <= 1) { k *= 0.96; why = why || 'первый бой'; }
  return { k: Math.max(0.62, k), why: why };
}
var oAssist = Z.assist;
Z.assist = function (G) {
  var a = oAssist ? oAssist.apply(this, arguments) : 1;
  if (!on(G)) return a;
  if (!G.dr) initDr(G);
  return a * G.dr.ease * (G.dr.relief || 1);
};
function initDr(G) { var e = startEase(G); G.dr = { ease: e.k, why: e.why, near: 0, hp0: G.hp, lfPrev: 0, relief: 1, golden: 0, phPrev: G.phase, waveN: 0 }; }
var oGo = UI.goLevel;
UI.goLevel = function () {
  var r = oGo.apply(this, arguments), G = Z.G;
  session.n++;
  if (G) { G.dr = null; if (on(G)) initDr(G); }
  return r;
};
// вышел посреди боя — запомнить (в следующий раз мягче); дошёл до конца — забыть
var oMap = UI.goMap;
UI.goMap = function () {
  var G = Z.G;
  if (UI.screen === 'level' && on(G) && G.phase !== 'won' && G.phase !== 'lost' && (G.t || 0) > 25) { pm().quit[G.idx] = 1; Z.persist && Z.persist(); }
  return oMap.apply(this, arguments);
};
var oWon = Z.levelWon;
Z.levelWon = function () {
  var G = Z.G, first = G && G.phase !== 'won', r = oWon.apply(this, arguments);
  if (first && on(G)) {
    var P = pm(); delete P.quit[G.idx]; P.last = Date.now(); Z.persist && Z.persist();
    // пик и конец: победа на волоске запоминается сильнее всего — скажем об этом
    var h = hpf(G);
    if (h <= 0.25 && UI.toast) setTimeout(function () { UI.toast(TT('На волоске! Вот это оборона!', 'By a hair! What a defense!'), '#ffe28a'); }, 400);
    else if (h >= 0.999 && UI.toast) setTimeout(function () { UI.toast(G.L.type === 'escort' ? TT('Ни царапины! Подарки доставлены!', 'Not a scratch! Gifts delivered!') : TT('Ни царапины! Ёлка цела!', 'Not a scratch! The tree is safe!'), '#c8f7c5'); }, 400);
  }
  return r;
};
var oLost = Z.levelLost;
Z.levelLost = function () { var G = Z.G, r = oLost.apply(this, arguments); if (G && on(G)) { pm().last = Date.now(); if (G.dr) G.dr.ease = startEase(G).k; } return r; };   // «С этой волны» после 2-го поражения — уже с поблажкой

// ---------- 2 и 4. ритм волн и «элитный отряд» ----------
var oCall = Z.callWave;
Z.callWave = function () {
  var G = Z.G, w0 = G && G.wave, nQ = G && G.spawnQ ? G.spawnQ.length : 0;
  if (G && G.spawnQ) G.spawnQ.forEach(function (q) { q._old = 1; });
  var r = oCall.apply(this, arguments);
  if (!on(G) || G.L.type === 'escort' || G.wave === w0) return r;
  if (!G.dr) initDr(G);
  var D0 = G.dr, total = G.waves.length, last = G.wave >= total, lf = D0.lfPrev;
  D0.relief = 1; D0.waveN++;
  if (!last) {
    if (lf > 0.15) D0.relief = 0.82;                        // передышка после тяжёлой волны
    else if (G.wave === total - 1) D0.relief = 0.93;        // затишье перед финалом
  }
  // слишком легко: вместо толстой волны — пара элитных врагов и надпись (интересно, а не нудно)
  if (!last && (G.flow || 1) >= 1.22 && lf === 0 && hpf(G) >= 0.95 && D0.waveN >= 2) {
    var fresh = G.spawnQ.filter(function (q) { return !q._old && Z.ENEMIES[q.type] && !Z.ENEMIES[q.type].boss; }), n = Math.min(3, Math.max(1, Math.round(fresh.length * 0.12)));
    for (var i = 0; i < n && fresh.length; i++) { var q = fresh.splice(Math.floor(Math.random() * fresh.length), 1)[0]; q.elite = true; }
    G.waveMul *= 0.93; G.flow = Math.max(1, (G.flow || 1) - 0.08);
    G.banner = { text: Z.T('wave') + ' ' + G.wave, sub: TT('Элитный отряд! Покажи им!', 'Elite squad! Show them!'), t: 2.6, big: true };
  }
  // переменная награда: иногда в волне «золотой» враг
  var fresh2 = G.spawnQ.filter(function (q) { return !q._old && Z.ENEMIES[q.type] && !Z.ENEMIES[q.type].boss && !Z.ENEMIES[q.type].air; });
  if (fresh2.length && Math.random() < 0.22) fresh2[Math.floor(Math.random() * fresh2.length)].gold = true;
  D0.hp0 = G.hp;
  return r;
};
// золотой — отметка из очереди переходит на врага
var oWS = Z.hk.waveSpawn;
Z.hk.waveSpawn = function (e, q) { if (oWS) oWS(e, q); if (q && q.gold && e) { e.gold = true; e.coinMul = (e.coinMul || 1) * 3; } };

// ---------- 3. скрытая помощь ----------
var oDmg = Z.hk.dmg;
Z.hk.dmg = function (e, real, opts) {
  var r = oDmg ? oDmg(e, real, opts) : real, G = Z.G;
  if (r > 0 && !e.boss && on(G)) {
    var n = need(G);
    if (n > 0 && Math.random() < 0.22 * n && (!G.dr.critT || G.t - G.dr.critT > 0.6)) {   // «Меткий!» — выглядит как удача и мастерство
      G.dr.critT = G.t; r *= 2; e.crit = true;
      if (_.addText) _.addText(TT('Меткий!', 'Sharp!'), e.x, e.y - 0.6 * (e.size || 1), '#ffcf4a', 1, 0.55);
    }
  }
  return r;
};
var oKill = Z.hk.kill;
Z.hk.kill = function (e) {
  if (oKill) oKill(e);
  var G = Z.G; if (!on(G)) return;
  var n = need(G); if (n > 0) e.coinMul = (e.coinMul || 1) * (1 + 0.35 * n);
  if (e.gold) {
    Z.save.flakes = (Z.save.flakes || 0) + 1; Z.persist && Z.persist();
    if (_.addText) _.addText(TT('Золотой! +1 ❄', 'Golden! +1 ❄'), e.x, e.y - 0.9, '#ffe28a', 1.2, 0.8);
    if (Z.AU) Z.AU.sfx('reward', 0.6);
    for (var i = 0; i < 8 && G.fx.length < 400; i++) G.fx.push({ k: 'star', x: e.x + (Math.random() - 0.5) * 0.8, y: e.y - Math.random() * 0.8, t: 0, dur: 0.6 + Math.random() * 0.3 });
  }
};
Z.hk.fortDmg = function (dmg, e) {
  var G = Z.G; if (!on(G)) return dmg;
  var n = need(G), h = hpf(G);
  // «поскользнулся»: у самой ёлки, когда ей совсем плохо, враг иногда падает на льду — секунда передышки
  if (h < 0.3 && !e.boss && !e.air && !e.slipped && Math.random() < 0.45) {
    e.slipped = true; e.stun = Math.max(e.stun || 0, 1.3);
    if (_.addText) _.addText(TT('Поскользнулся!', 'Slipped!'), e.x, e.y - 0.7, '#bfe9ff', 1, 0.6);
    return 0;
  }
  return dmg * (1 - 0.35 * n);
};

// ---------- слежение: близко ли враги, конец волны ----------
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!on(G) || !G.dr) return;
  var D0 = G.dr, near = 0;
  for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (!e.dead && !e.neutral && e.dleft < 3) near++; }
  D0.near = near;
  // конец волны (волна → передышка): итоги для ритма и награда за чистую волну
  if (D0.phPrev === 'wave' && (G.phase === 'between' || G.phase === 'won') && G.L.type !== 'escort') {
    var lost = Math.max(0, D0.hp0 - G.hp); D0.lfPrev = lost / Math.max(1, G.hpMax); D0.relief = 1;
    if (lost <= 0 && G.phase === 'between') {
      var b = Math.round((8 + G.wave * 2) * (1 + G.idx * 0.04)); G.coins += b;
      if (_.addText) _.addText(TT('Чистая волна! +', 'Clean wave! +') + b, G.L.fort[0] + 0.5, G.L.fort[1] - 1.6, '#c8f7c5', 1.2, 0.75);
    }
  }
  D0.phPrev = G.phase;
};

// ---------- золотой враг: сияние ----------
var oEn = D.enemy;
D.enemy = function (e, x, y, cs, t) {
  if (e && e.gold && !e.dead) { var c = D.ctx; c.save(); c.globalAlpha = 0.35 + 0.15 * Math.sin(t * 6); D.circ(x, y - cs * 0.25 * (e.size || 1), cs * 0.42 * (e.size || 1), '#ffe066'); c.restore(); }
  var r = oEn.apply(this, arguments);
  if (e && e.gold && !e.dead && Math.random() < 0.08 && Z.G && Z.G.fx.length < 400) Z.G.fx.push({ k: 'star', x: e.x + (Math.random() - 0.5) * 0.5, y: e.y - 0.4 - Math.random() * 0.4, t: 0, dur: 0.5 });
  return r;
};

// ---------- 6. поражение: сколько уровня пройдено (для окна «Крепость пала») ----------
Z.levelProgress = function (G) {
  G = G || Z.G; if (!G) return 0;
  if (G.L.type === 'escort') { var m = G.L.main || []; return m.length > 1 && G.sleigh ? Math.max(0, Math.min(0.99, G.sleigh.f / (m.length - 1))) : 0; }
  var tot = G.waves ? G.waves.length : 1, w = Math.max(1, G.wave), wl = G.waves && G.waves[w - 1] ? G.waves[w - 1].list.length : 1;
  var left = (G.spawnQ ? G.spawnQ.length : 0) + G.enemies.filter(function (e) { return !e.dead && !e.neutral; }).length;
  var inWave = Math.max(0, Math.min(1, 1 - left / Math.max(1, wl)));
  return Math.max(0, Math.min(0.99, (w - 1 + inWave) / tot));
};
})();
