/* 2.6 · отряд: 8 героев, очки командования, уровни героев, связки, испытания, приёмы, точки сбора и «Авто» */
(function () {
'use strict';
var Z = window.Z, _ = Z._;
function TT(ru, en) { return Z.LANG === 'en' ? en : ru; }
Z.TT = TT;

// ---------- герои ----------
Object.assign(Z.ALLIES, {
  eskimo:   { unlock: 5,  hp: 105, hpL: 18, dmg: 10, dmgL: 3,   r: 3.1, cd: 1.5, spd: 1.35, block: 0, shot: 'snowb', structX: 3, heavy: true, col: '#5fb8ff' },
  emelya:   { unlock: 9,  hp: 130, hpL: 22, dmg: 13, dmgL: 4,   r: 3.0, cd: 1.7, spd: 1.15, block: 0, shot: 'pot', structX: 4, heavy: true, col: '#ff7a3d' },
  kolobok:  { unlock: 15, hp: 62,  hpL: 12, dmg: 7,  dmgL: 2.5, r: 0.85, cd: 0.6, spd: 3.3, block: 1, aoe: true, structX: 1.5, light: true, col: '#f2b544' },
  vasilisa: { unlock: 22, hp: 72,  hpL: 13, dmg: 9,  dmgL: 3,   r: 2.8, cd: 1.1, spd: 2.0, block: 0, shot: 'ball', structX: 1, col: '#b07cff' },
  kot:      { unlock: 25, hp: 95,  hpL: 16, dmg: 6,  dmgL: 2,   r: 1.0, cd: 0.8, spd: 2.0, block: 1, aoe: true, structX: 1, aura: 2, col: '#8a95b5' }
});
Z.ALLIES.plombir.heavy = true; Z.ALLIES.belka.light = true;
Z.ALLY_ORDER = ['moroz', 'eskimo', 'sneg', 'emelya', 'belka', 'kolobok', 'plombir', 'vasilisa', 'kot'];
Z.OK_COST = { eskimo: 2, belka: 1, kolobok: 1, sneg: 2, vasilisa: 2, kot: 2, moroz: 3, emelya: 3, plombir: 3 };
Z.ULT_CD = { eskimo: 16, moroz: 14, sneg: 14, emelya: 18, belka: 14, kolobok: 16, plombir: 14, vasilisa: 20, kot: 20 };
Z.VKEY = { eskimo: 'ESK', moroz: 'MOR', sneg: 'SNE', emelya: 'EME', belka: 'BEL', kolobok: 'KOL', plombir: 'PLO', vasilisa: 'VAS', kot: 'KOT' };
var OK_STEPS = [[32, 17], [27, 13], [23, 10], [15, 9], [11, 7], [7, 5], [5, 5], [3, 3]];
Z.trialsDone = function () { var n = 0, t = Z.save.trials || {}; for (var k in t) if (t[k]) n++; return n; };
// 2.12.21: очков командования больше нет — в отряд можно взять всех открытых героев. Чтобы игра не стала слишком лёгкой,
// враги крепче на столько, на сколько отряд сильнее прежнего лимита (см. v27b.js, Z.assist). Прежний лимит — Z.okLimitBase.
Z.OKP_OFF = true;
Z.okLimitBase = function (idx) {
  if (idx >= 99) return 17;
  var top = Math.max(idx, Z.unlockedLevel ? Z.unlockedLevel() : idx), b = 0;
  for (var i = 0; i < OK_STEPS.length; i++) if (top >= OK_STEPS[i][0]) { b = OK_STEPS[i][1]; break; }
  return Math.min(17, b + Math.min(4, Z.trialsDone()));
};
Z.okLimit = function (idx) { return Z.OKP_OFF ? 99 : Z.okLimitBase(idx); };
Z.squadMax = function () { return 9; };
Z.okUsed = function (list) { return list.reduce(function (s, t) { return s + (Z.OK_COST[t] || 0); }, 0); };
// на уровнях сопровождения Снегурочка едет в санях — в отряд её не берём, чтобы не было двух Снегурочек
Z.inSleigh = function (idx) { var info = Z.LEVELS[idx]; return info && info.type === 'escort' ? 'sneg' : null; };
// открытый герой доступен на любом уровне (в т.ч. при перепрохождении) — баланс держит лимит очков командования
// 2.12.38: в «Ночи перед Новым годом» (idx 99) — только герои, до которых игрок уже дошёл по сюжету (раньше там были открыты все)
Z.heroOpen = function (t, idx) { var u = Z.ALLIES[t].unlock; if (idx >= 99) return u <= Z.unlockedLevel() || Z.save.stars[u] > 0; return idx >= u || (idx >= 3 && Z.save.stars[u] > 0); };
Z.squadFor = function (idx) {
  if (Z.trialHero) return [Z.trialHero];
  var sl = Z.inSleigh(idx);
  var lim = Z.okLimit(idx), want = (Z.save.squad || ['moroz']).filter(function (t) { return Z.ALLIES[t] && t !== sl && Z.heroOpen(t, idx); });
  // новый герой на уровне открытия — сразу в отряде, но игрок может его убрать (тогда больше не навязываем)
  var touched = Z.save.sqT && Z.save.sqT[idx];
  if (!touched) Z.ALLY_ORDER.forEach(function (t) { if (Z.ALLIES[t].unlock === idx && t !== sl && want.indexOf(t) < 0) want.unshift(t); });
  // 2.12.36: лимита очков больше нет — в отряд идут ВСЕ открытые герои, кроме тех, кого игрок сам убрал (Z.save.sqOff).
  // Раньше отряд брался из сохранённого списка (часто урезанного старым лимитом до 1–2 героев) — остальные открытые не выходили
  if (Z.OKP_OFF) { var off = Z.save.sqOff || {}; Z.ALLY_ORDER.forEach(function (t) { if (Z.ALLIES[t] && t !== sl && !off[t] && Z.heroOpen(t, idx) && want.indexOf(t) < 0) want.push(t); }); }
  if (!want.length && idx >= 3) want = ['moroz'];
  var out = [], used = 0;
  want.forEach(function (t) { if (out.indexOf(t) < 0 && used + Z.OK_COST[t] <= lim) { out.push(t); used += Z.OK_COST[t]; } });
  return out;
};

// ---------- уровни героев ----------
Z.allyXp = function (t) { return (Z.save.ax || {})[t] || 0; };
Z.allyLvl = function (t) { return Math.min(10, 1 + Math.floor(Math.sqrt(Z.allyXp(t) / 22))); };
Z.allyXpNext = function (t) { var l = Z.allyLvl(t); return l >= 10 ? 1 : (l * l * 22 - Z.allyXp(t)) / (l * l * 22 - (l - 1) * (l - 1) * 22); };
Z.addAllyXp = function (t, n) { Z.save.ax = Z.save.ax || {}; var l0 = Z.allyLvl(t); Z.save.ax[t] = (Z.save.ax[t] || 0) + Math.round(n); return Z.allyLvl(t) > l0; };
Z.allyPerk = function (t) { return (Z.save.au || {})[t] || 'a'; };
Z.PERK3 = {
  moroz: ['Держит на 1 врага больше', 'Holds 1 more enemy'], sneg: ['Лечение рядом +50%', 'Nearby healing +50%'], emelya: ['Горшки поджигают землю', 'Pots set the ground on fire'],
  belka: ['Подбирает монетки с врагов', 'Picks up coins from enemies'], kolobok: ['+15% скорости', '+15% speed'], plombir: ['Получает на 20% меньше урона', 'Takes 20% less damage'],
  eskimo: ['Снежки замедляют вдвое дольше', 'Snowballs slow twice as long'],
  vasilisa: ['Клубок прыгает на 1 врага больше', 'Ball bounces to 1 more enemy'], kot: ['Дремлет и лечится вдвое быстрее', 'Naps and heals twice as fast']
};
Z.PERK5 = {
  moroz: [['Посох шире на 30%', 'Staff radius +30%'], ['Оглушение на 1 с дольше', 'Stun lasts 1 s longer']],
  sneg: [['Хоровод лечит на 50% больше', 'Round dance heals 50% more'], ['Враги замедлены вдвое дольше', 'Slow lasts twice as long']],
  emelya: [['Горшки оставляют огонь', 'Pots leave fire'], ['Щука замораживает воду', 'The Pike freezes the water']],
  belka: [['Шишкопад: 12 шишек', 'Cone rain: 12 cones'], ['Шишки оглушают', 'Cones stun']],
  kolobok: [['Урон качения ×1,5', 'Rolling damage ×1.5'], ['Отбрасывает врагов назад', 'Knocks enemies back']],
  plombir: [['Отброс сильнее', 'Stronger knockback'], ['Щит всему отряду', 'Shield for the whole squad']],
  eskimo: [['Залп из 5 снежков', 'Volley of 5 snowballs'], ['Залп замораживает на 3 с', 'Volley freezes for 3 s']],
  vasilisa: [['Отмотка на 6 клеток', 'Rewind 6 cells'], ['Зона больше на 40%', 'Zone +40%']],
  kot: [['Сон 6 секунд', 'Sleep lasts 6 s'], ['Радиус песни больше', 'Bigger song radius']]
};

// ---------- связки ----------
Z.SYNERGY = [
  { a: 'emelya', b: 'kot', ru: 'Кот на печи: печь бьёт дальше, кот неуязвим', en: 'Cat on the stove: longer range, cat is invulnerable' },
  { a: 'eskimo', b: 'plombir', ru: 'Братья: снежки Эскимо бьют на 25% сильнее', en: 'Brothers: Eskimo\'s snowballs hit 25% harder' },
  { a: 'sneg', b: 'plombir', ru: 'Пломбир лечится в 1,5 раза сильнее', en: 'Plombir heals 1.5× more' },
  { a: 'belka', b: 'kolobok', ru: '+20% скорости обоим', en: '+20% speed for both' },
  { a: 'vasilisa', b: 'moroz', ru: 'Посох Деда Мороза +30% радиуса', en: 'Frost staff radius +30%' },
  { a: 'kolobok', b: 'emelya', ru: 'Горячий Колобок поджигает постройки', en: 'Hot Kolobok burns enemy structures' },
  { a: 'sneg', b: 'moroz', ru: 'Оба восстанавливаются вдвое быстрее', en: 'Both recover twice as fast' }
];
function unit(G, t) { for (var i = 0; i < (G.squad || []).length; i++) if (G.squad[i].type === t && !G.squad[i].dead) return G.squad[i]; return null; }
Z.unitOf = unit;
Z.synOn = function (G, a, b) { var A = unit(G, a), B = unit(G, b); return !!(A && B && Math.hypot(A.x - B.x, A.y - B.y) <= 2.2); };
function syn(G, H, other) { return Z.synOn(G, H.type, other); }

// ---------- создание отряда ----------
Z.makeUnit = function (G, t, x, y) {
  var A = Z.ALLIES[t], lv = Z.allyLvl(t), m = 1 + (lv - 1) * 0.08;
  return { type: t, x: x, y: y, tx: x, ty: y, home: { x: x, y: y }, lvl: lv, max: Math.round((A.hp + 4 * A.hpL) * m), hp: Math.round((A.hp + 4 * A.hpL) * m), dmg: (A.dmg + 4 * A.dmgL) * m, r: A.r,
    cd: 0.4, dead: false, respawn: 0, walk: 0, dir: 1, atk: 0, blockN: 0, hitT: 0, ult: 4, auto: lv < 5 || Z.save.autoAll !== false, kills: 0, joinT: 0 };
};
var oldStart = Z.startLevel;
Z.startLevel = function (idx, heroic, dims) {
  var r = oldStart.apply(this, arguments), G = Z.G;
  if (G && G.squad && G.squad.length) {
    G.squad = G.squad.map(function (U) { var N = Z.makeUnit(G, U.type, U.home.x, U.home.y); return N; });
    G.hero = G.squad[0];
  }
  if (G) { G.v26 = { lines: {}, syn: {}, okBench: [] }; }
  return r;
};
var oldEndless = Z.startEndless;
Z.startEndless = function () {
  var r = oldEndless.apply(this, arguments), G = Z.G;
  if (G && G.squad) { G.squad = G.squad.map(function (U) { return Z.makeUnit(G, U.type, U.home.x, U.home.y); }); G.hero = G.squad[0]; }
  if (G) G.v26 = { lines: {}, syn: {}, okBench: [] };
  return r;
};

// приказ двигаться = новая точка сбора; любой ручной приказ выключает «Авто»
Z.heroMove = function (x, y, unitArg, keepAuto) {
  var G = Z.G, H = unitArg || (Z.ui && Z.ui.heroSel && Z.ui.heroSel.type ? Z.ui.heroSel : G && G.hero); if (!H || H.dead) return false;
  var L = G.L; x = Math.max(0.3, Math.min(L.W - 0.3, x)); y = Math.max(0.3, Math.min(L.H - 0.3, y));
  H.tx = H.home.x = x; H.ty = H.home.y = y; H.order = 1.2; H.roll = null;
  if (!keepAuto) H.auto = false;
  Z.AU.sfx('sleigh', 0.25, { gap: 0.2 });
  if (Z.say) Z.say(H.type, 'move', H);
  return true;
};
Z.allHere = function (x, y) {
  var G = Z.G, n = 0, list = (G.squad || []).filter(function (U) { return !U.dead; });
  list.forEach(function (U, i) { var a = i / Math.max(1, list.length) * Math.PI * 2; Z.heroMove(x + (list.length > 1 ? Math.cos(a) * 0.55 : 0), y + (list.length > 1 ? Math.sin(a) * 0.4 : 0), U); n++; });
  if (n && Z.say) Z.say('moroz', 'all', unit(G, 'moroz'));
  return n;
};

// ---------- ИИ отряда: зона у точки сбора, «Авто», отступление ----------
var ZONE = 2.5;
function threatAt(G, x, y) {
  var s = 0;
  for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (e.dead || e.air) continue; var d = Math.hypot(e.x - x, e.y - y); if (d < 3) s += (e.boss ? 6 : 1 + (e.atkTower ? 1 : 0)) * (1 + 3 / (1 + (e.dleft || 9))) * (1 - d / 3.2); }
  return s;
}
function pickTarget(G, H, rad) {
  var best = null, bs = -1e9;
  for (var i = 0; i < G.enemies.length; i++) {
    var e = G.enemies[i]; if (e.dead || (e.air && !Z.ALLIES[H.type].shot)) continue; if (Z.heroCant ? Z.heroCant(e) : (Z.hk.untargetable && Z.hk.untargetable(e))) continue;
    var d = Math.hypot(e.x - H.home.x, e.y - H.home.y); if (d > rad) continue;
    var sc = (e.boss ? 400 : 0) + (e.type === 'raz' ? 200 : 0) + (e.atkTower ? 100 : 0) - (e.dleft || 0) * 3 - d;
    if (sc > bs) { bs = sc; best = e; }
  }
  return best;
}
function squadAI(G, H, dt) {
  var A = Z.ALLIES[H.type];
  if (H.order > 0) { H.order -= dt; return; }
  if (H.roll) return;
  // Кощей: авто-герои ломают сундук и гонятся за зайцем и уткой
  if (H.auto && G.kos && G.enemies.some(function (e) { return e.type === 'koschei' && !e.dead; })) {
    var fl = G.enemies.filter(function (e) { return !e.dead && (e.type === 'hare' || (e.type === 'duck' && A.shot)); })[0];
    var ch = G.kos.chest && !G.kos.chest.dead && G.kos.stage === 0 ? G.kos.chest : null;
    if (fl) { H.home.x = fl.x; H.home.y = fl.y; }
    else if (ch && (H.type === 'belka' || H.type === 'moroz' || H.type === 'emelya' || H.type === 'kolobok' || H.type === 'plombir')) { H.home.x = ch.c + 0.5; H.home.y = ch.r + 1.1; }
  }
  // сопровождение: авто-герои расчищают завалы перед санями
  if (H.auto && G.L.type === 'escort') {
    var blk = (G.structs || []).filter(function (q) { return (q.type === 'log' || q.type === 'rocks') && !q.dead; })[0];
    if (blk) { H.home.x = blk.c + 0.5; H.home.y = blk.r + 0.9; H.tx = H.home.x; H.ty = H.home.y; return; }
  }
  // авто: раз в 2 секунды ищем самый опасный участок
  H.aiT = (H.aiT || 0) - dt;
  if (H.auto && H.aiT <= 0 && (G.phase === 'wave' || G.phase === 'escortRun')) {
    H.aiT = 2;
    var cur = threatAt(G, H.home.x, H.home.y), best = null, bt = cur * 1.3 + 0.5, taken = (G.squad || []).filter(function (o) { return o !== H && o.auto && !o.dead; });
    for (var i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i]; if (e.dead || e.air) continue;
      var th = threatAt(G, e.x, e.y); if (e.siege) th = th * 2.5 + 3;   // 2.10.4: авто-герои спешат к ёлке, когда её бьют
      if (!e.boss && taken.some(function (o) { return Math.hypot(o.home.x - e.x, o.home.y - e.y) < 2.2; })) th *= 0.4;
      if (th > bt) { bt = th; best = e; }
    }
    if (best) { H.home.x = best.x; H.home.y = best.y; }
  }
  // слабый — отступает к точке
  if (H.hp < H.max * 0.2) { H.tx = H.home.x; H.ty = H.home.y; H.weak = true; if (!H.weakSaid) { H.weakSaid = 1; Z.say && Z.say(H.type, 'hurt', H); } return; }
  H.weak = false; if (H.hp > H.max * 0.5) H.weakSaid = 0;
  var tg = pickTarget(G, H, ZONE + (A.shot ? A.r * 0.5 : 0));
  if (tg) {
    var dx = tg.x - H.x, dy = tg.y - H.y, d = Math.hypot(dx, dy), want = A.shot ? A.r * 0.8 : 0.35;
    if (d > want) { H.tx = tg.x - dx / d * want; H.ty = tg.y - dy / d * want; } else { H.tx = H.x; H.ty = H.y; }
  } else { H.tx = H.home.x; H.ty = H.home.y; }
}

// ---------- приёмы ----------
function ultCd(H) { var c = Z.ULT_CD[H.type]; if (H.lvl >= 10) c *= 0.75; return c; }
Z.ultCd = ultCd;
function enemiesIn(G, x, y, r, air) { return G.enemies.filter(function (e) { return !e.dead && (air || !e.air) && Math.hypot(e.x - x, e.y - y) < r && !(Z.heroCant ? Z.heroCant(e) : (Z.hk.untargetable && Z.hk.untargetable(e))); }); }
function clusterPoint(G, H, r) {
  var best = null, bn = 0;
  G.enemies.forEach(function (e) { if (e.dead || e.air || Math.hypot(e.x - H.x, e.y - H.y) > r) return; var n = enemiesIn(G, e.x, e.y, 1.3).length + (e.boss ? 3 : 0); if (n > bn) { bn = n; best = e; } });
  return best ? { x: best.x, y: best.y, n: bn } : null;
}
function ultWanted(G, H) {
  var t = H.type;
  if (t === 'sneg') { if (Object.keys(G.towers).some(function (k) { var tw = G.towers[k]; return tw.hp < tw.max * 0.6 && Math.hypot(tw.c + 0.5 - H.x, tw.r + 0.5 - H.y) < 3; })) return { x: H.x, y: H.y }; }
  if (t === 'emelya' || t === 'eskimo') { var cp = clusterPoint(G, H, 4.5); return cp && cp.n >= 3 ? cp : null; }
  if (t === 'kolobok') return enemiesIn(G, H.x, H.y, 4).length >= 3 ? { x: H.x, y: H.y } : null;
  var r = t === 'belka' ? 3.6 : t === 'vasilisa' || t === 'kot' ? 3 : t === 'sneg' ? 3 : 1.9, inR = enemiesIn(G, H.x, H.y, r);
  return inR.length >= 3 || inR.some(function (e) { return e.boss; }) ? { x: H.x, y: H.y } : null;
}
Z.castUlt = function (H, x, y, manual) {
  var G = Z.G; if (!H || H.dead || H.ult > 0) return false;
  var A = Z.ALLIES[H.type], P = Z.allyPerk(H.type), lv5 = H.lvl >= 5, pw = (manual ? 1.15 : 1) * (H.lvl >= 10 ? 1.3 : 1), t = H.type;
  if (x === undefined) { x = H.x; y = H.y; }
  H.ult = ultCd(H); H.ready = false; H.atk = 0.5; G.shake = Math.max(G.shake || 0, 0.2);
  _.addText(Z.T('ult_' + t), H.x, H.y - 1.5, A.col, 1.6, 0.8);
  if (Z.say) Z.say(t, 'ult', H);
  Z.fxBurst && Z.fxBurst(H.x, H.y, A.col);
  if (t === 'moroz') {
    var ur = 1.9 * (lv5 && P === 'a' ? 1.3 : 1) * (syn(G, H, 'vasilisa') ? 1.3 : 1);
    enemiesIn(G, H.x, H.y, ur).forEach(function (e) { _.damage(e, H.dmg * 2 * pw, {}); if (!e.boss) e.stun = Math.max(e.stun || 0, 1.3 + (lv5 && P === 'b' ? 1 : 0)); else { e.slow = Math.max(e.slow, 0.4); e.slowT = 1.5; } });
    if (Z.WAT) Z.WAT.freezeArea(H.x, H.y, ur);
    G.fx.push({ k: 'ring', x: H.x, y: H.y, r: ur, t: 0, dur: 0.7, col: '#bfe6ff' }); G.fx.push({ k: 'flash', x: H.x, y: H.y, r: ur * 0.45, t: 0, dur: 0.3, col: '#d8f2ff' }); _.puff(H.x, H.y, 22, ur);
    Z.AU.sfx('freeze', 0.9); Z.AU.sfx('gong', 0.4);
  } else if (t === 'sneg') {
    var hm = (lv5 && P === 'a' ? 1.5 : 1) * pw;
    for (var k in G.towers) { var tw = G.towers[k]; if (Math.hypot(tw.c + 0.5 - H.x, tw.r + 0.5 - H.y) < 3) { tw.hp = Math.min(tw.max, tw.hp + tw.max * 0.35 * hm); G.fx.push({ k: 'star', x: tw.c + 0.5, y: tw.r, t: 0, dur: 0.9 }); } }
    G.squad.forEach(function (o) { if (!o.dead) o.hp = Math.min(o.max, o.hp + o.max * 0.4 * hm * (o.type === 'plombir' && syn(G, H, 'plombir') ? 1.5 : 1)); });
    enemiesIn(G, H.x, H.y, 3).forEach(function (e) { e.slow = Math.max(e.slow, 0.5); e.slowT = Math.max(e.slowT, 2.2 * (lv5 && P === 'b' ? 2 : 1)); });
    G.fx.push({ k: 'ring', x: H.x, y: H.y, r: 3, t: 0, dur: 0.8, col: '#ffd1f0' }); Z.AU.sfx('levelup', 0.6); Z.AU.sfx('magic_ball', 0.5);
  } else if (t === 'emelya') {
    if (Z.say) setTimeout(function () { Z.say('emelya', 'shuka', H); }, 600);
    G.fx.push({ k: 'v_pike', x: H.x + 0.6, y: H.y + 0.3, t: 0, dur: 1.4 });
    for (var p = 0; p < 6; p++) {
      (function (p) {
        var px = x + (Math.random() - 0.5) * 1.6, py = y + (Math.random() - 0.5) * 1.6;
        G.shots.push({ k: 'ally', kind: 'pot', x: H.x, y: H.y - 0.8, x0: H.x, y0: H.y - 0.8, tx: px, ty: py, t: -p * 0.14, dur: 0.6, dmg: H.dmg * 2.2 * pw, ult: true, fire: lv5 && P === 'a', freeze: lv5 && P === 'b' });
      })(p);
    }
    Z.AU.sfx('pot_launch', 0.8);
  } else if (t === 'belka') {
    var inR = enemiesIn(G, H.x, H.y, 3.6, true), n = lv5 && P === 'a' ? 12 : 8;
    for (var b = 0; b < n && inR.length; b++) { var tg = inR[b % inR.length]; G.shots.push({ k: 'ally', kind: 'cone', x: H.x, y: H.y - 0.5, x0: H.x, y0: H.y - 0.5, tgt: tg, tx: tg.x, ty: tg.y, t: 0, dur: 0.22 + b * 0.05, dmg: H.dmg * 1.6 * pw, stun: lv5 && P === 'b' ? 0.6 : 0 }); }
    Z.AU.sfx('tap', 0.6, { pitch: 1.6 });
  } else if (t === 'kolobok') {
    // катится по дороге к входу врагов, сбивая всех
    var L = G.L, best = null, bd = 1e9, path = null;
    (L.paths || [L.main]).forEach(function (pp) { pp.forEach(function (c, i) { var d = Math.hypot(c[0] + 0.5 - H.x, c[1] + 0.5 - H.y); if (d < bd) { bd = d; best = i; path = pp; } }); });
    if (path) { var pts = path.slice(0, best + 1).reverse().map(function (c) { return { x: c[0] + 0.5, y: c[1] + 0.5 }; }); pts.push({ x: H.home.x, y: H.home.y }); H.roll = { pts: pts, i: 0, hit: {}, mul: pw * (lv5 && P === 'a' ? 1.5 : 1), back: lv5 && P === 'b', burn: syn(G, H, 'emelya') }; }
    Z.AU.sfx('kolobok_roll', 0.9);
  } else if (t === 'plombir') {
    enemiesIn(G, H.x, H.y, 1.9).forEach(function (e) { _.damage(e, H.dmg * 1.6 * pw, {}); if (!e.boss) { e.kb = lv5 && P === 'a' ? 1.2 : 0.7; e.stun = Math.max(e.stun || 0, 0.6); } });
    H.hp = Math.min(H.max * 1.3, H.hp + H.max * 0.3);
    if (lv5 && P === 'b') G.squad.forEach(function (o) { if (!o.dead) o.shield = 4; });
    if (Z.WAT) Z.WAT.splash(H.x, H.y, 1.4);
    G.fx.push({ k: 'ring', x: H.x, y: H.y, r: 1.9, t: 0, dur: 0.6, col: '#7fd8ff' }); Z.AU.sfx('crash', 0.5); Z.AU.sfx('ice_break', 0.5);
  } else if (t === 'eskimo') {
    // «Большой залп»: большие снежки по скоплению врагов — урон по площади и заморозка
    var en = enemiesIn(G, x, y, 2.2, true), nb = lv5 && P === 'a' ? 5 : 3;
    for (var q = 0; q < nb; q++) { var e0 = en.length ? en[q % en.length] : null, ox = e0 ? e0.x : x + (q - 1) * 0.6, oy = e0 ? e0.y : y; G.shots.push({ k: 'ally', kind: 'snowb', big: true, x: H.x, y: H.y - 0.6, x0: H.x, y0: H.y - 0.6, tgt: e0, tx: ox, ty: oy, t: -q * 0.14, dur: 0.38, dmg: H.dmg * 1.8 * pw, frz: lv5 && P === 'b' ? 3 : 1.5 }); }
    H.atk = 0.5; H.dir = x > H.x ? 1 : -1; G.fx.push({ k: 'flash', x: H.x + H.dir * 0.5, y: H.y - 0.6, t: 0, dur: 0.2, r: 0.6, col: '#bfefff' }); Z.AU.sfx('barrel_boom', 0.35, { pitch: 1.5 }); Z.AU.sfx('ice', 0.6);
  } else if (t === 'vasilisa') {
    var vr = 3 * (lv5 && P === 'b' ? 1.4 : 1), steps = lv5 && P === 'a' ? 6 : 4;
    enemiesIn(G, x, y, vr).forEach(function (e) { if (!e.boss) Z.rewind(e, steps); else Z.rewind(e, 1); });
    G.fx.push({ k: 'ring', x: x, y: y, r: vr, t: 0, dur: 1, col: '#d9b8ff' }); G.fx.push({ k: 'v_clock', x: x, y: y, r: vr, t: 0, dur: 1.2 });
    Z.AU.sfx('magic_ball', 0.9); Z.AU.sfx('star', 0.35);
  } else if (t === 'kot') {
    var kr = 3 * (lv5 && P === 'b' ? 1.35 : 1), dur = lv5 && P === 'a' ? 6 : 4;
    enemiesIn(G, x, y, kr).forEach(function (e) { if (!e.boss) { e.stun = Math.max(e.stun || 0, dur * pw); e.sleep = true; } });
    if (G.soloveyTree) { var st = G.soloveyTree; if (Math.hypot(st.x - x, st.y - y) < kr + 1) st.sleep = 6; }
    G.fx.push({ k: 'ring', x: x, y: y, r: kr, t: 0, dur: 1.2, col: '#c9d2ff' }); G.fx.push({ k: 'v_zzz', x: x, y: y - 0.6, t: 0, dur: 2.4 });
    Z.AU.sfx('purr', 0.9);
  }
  return true;
};
// откат врага назад по полю расстояний (Василиса)
Z.rewind = function (e, steps) {
  var G = Z.G, L = G.L, nav = G.nav && G.nav[e.air ? 'walk' : 'walk'];
  if (!nav) return;
  var c = Math.floor(e.x), r = Math.floor(e.y);
  for (var s = 0; s < steps; s++) {
    var bc = c, br = r, bv = nav[r * L.W + c];
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var nc = c + d[0], nr = r + d[1]; if (nc < 0 || nr < 0 || nc >= L.W || nr >= L.H) return; var v = nav[nr * L.W + nc]; if (v < 1e8 && v > bv) { bv = v; bc = nc; br = nr; } });
    if (bc === c && br === r) break; c = bc; r = br;
  }
  G.fx.push({ k: 'v_ghost', x: e.x, y: e.y, t: 0, dur: 0.5 });
  e.x = c + 0.5; e.y = r + 0.5; e.path = null; e.next = null; e.cell = null; e.stun = Math.max(e.stun || 0, 0.4);
};

Z.hk.ult = function (G, H, dt) {
  if (H.ult > 0) return;
  H.ready = true;
  var manual = Z.save.ultManual && !G.endlessAuto;
  if (manual) return;
  var w = ultWanted(G, H);
  if (w) Z.castUlt(H, w.x, w.y, false); else H.ult = 0.5;
};

// скорость героя: вода, связки, качение, болото
Z.hk.unitSpd = function (H) {
  var G = Z.G, A = Z.ALLIES[H.type], k = 1;
  if (H.roll) return 4.2;
  if (H.type === 'kolobok' && H.lvl >= 3) k *= 1.15;
  if ((H.type === 'belka' || H.type === 'kolobok') && Z.synOn(G, 'belka', 'kolobok')) k *= 1.2;
  if (Z.WAT) k *= Z.WAT.unitSpeed(H, A);
  if (H.mire > 0) k *= 0.35;
  return k;
};

// ---------- каждый кадр: ИИ, качение Колобка, аура Кота, связки, лечение ----------
Z.unitTick = function (G, dt) {
  (G.squad || []).forEach(function (H) {
    if (H.dead) return;
    var A = Z.ALLIES[H.type];
    if (H.mire > 0) H.mire -= dt;
    if (H.shield > 0) H.shield -= dt;
    // урон по Коту на печи/с щитом не проходит: запоминаем здоровье
    if (H.lastHp !== undefined && H.hp < H.lastHp) {
      var lost = H.lastHp - H.hp;
      if (H.type === 'kot' && Z.synOn(G, 'kot', 'emelya')) H.hp = H.lastHp;
      else if (H.shield > 0) H.hp += lost * 0.6;
      else if (H.type === 'plombir' && H.lvl >= 3) H.hp += lost * 0.2;
    }
    if (H.roll) {
      var R = H.roll, p = R.pts[R.i];
      if (!p) { H.roll = null; } else {
        H.tx = p.x; H.ty = p.y;
        if (Math.hypot(H.x - p.x, H.y - p.y) < 0.25) R.i++;
        G.enemies.forEach(function (e) { if (e.dead || e.air || R.hit[e.id]) return; if (Math.hypot(e.x - H.x, e.y - H.y) < 0.7) { R.hit[e.id] = 1; _.damage(e, H.dmg * 3 * R.mul, {}); if (!e.boss) { e.kb = 0.5; e.stun = Math.max(e.stun || 0, 0.5); if (R.back) Z.rewind(e, 2); } Z.AU.sfx('bd2', 0.5, { gap: 0.05 }); } });
        if (R.burn) (G.structs || []).forEach(function (s) { if (Math.hypot(s.c + 0.5 - H.x, s.r + 0.5 - H.y) < 0.9 && !R.hit['s' + s.c + '_' + s.r]) { R.hit['s' + s.c + '_' + s.r] = 1; Z.damageStruct(s, H.dmg * 12); G.fires && G.fires.push({ x: s.c + 0.5, y: s.r + 0.5, t: 4 }); } });
        if (G.fx.length < 400 && Math.random() < 0.6) G.fx.push({ k: 'v_dust', x: H.x, y: H.y + 0.2, t: 0, dur: 0.5 });
        return;
      }
    }
    // аура Кота-Баюна: мурлыканье замедляет
    if (A.aura) G.enemies.forEach(function (e) { if (!e.dead && !e.air && Math.hypot(e.x - H.x, e.y - H.y) < A.aura) { e.slow = Math.max(e.slow, 0.22); e.slowT = Math.max(e.slowT, 0.3); } });
    // лечение вне боя (ТЗ: 2% в секунду), связка Снегурочка + Дед Мороз — вдвое быстрее
    if ((H.calm || 0) > 2 && H.hp < H.max) {
      var rg = 0.02 * ((H.type === 'sneg' || H.type === 'moroz') && Z.synOn(G, 'sneg', 'moroz') ? 2 : 1) * (H.type === 'kot' && H.lvl >= 3 ? 2 : 1);
      H.hp = Math.min(H.max, H.hp + H.max * rg * dt);
    }
    if (H.type === 'sneg' && H.lvl >= 3) for (var k in G.towers) { var tw = G.towers[k]; if (tw.hp < tw.max && Math.hypot(tw.c + 0.5 - H.x, tw.r + 0.5 - H.y) < 1.6) tw.hp = Math.min(tw.max, tw.hp + tw.max * 0.02 * dt); }
    if (H.type === 'moroz' && H.lvl >= 3) A.block = 3; else if (H.type === 'moroz') A.block = 2;
    if (H.type === 'emelya') H.r = A.r + (Z.synOn(G, 'emelya', 'kot') ? 1 : 0);
    squadAI(G, H, dt);
    H.lastHp = H.hp;
  });
  // связки: появление — перепалка и значок
  Z.SYNERGY.forEach(function (s, i) {
    var on = Z.synOn(G, s.a, s.b), was = G.v26.syn[i];
    if (on && !was) { G.v26.syn[i] = 1; var U = unit(G, s.a); if (U) { if (Z.ui.flash) Z.ui.flash('🔗 ' + TT(s.ru, s.en)); else _.addText('🔗 ' + TT(s.ru, s.en), G.L.W / 2, Math.max(1.2, U.y - 1.8), '#ffd54a', 2, 0.5); } if (Z.duoFor) Z.duoFor(s.a, s.b); }
    else if (!on && was) G.v26.syn[i] = 0;
  });
};

// ---------- снаряды новых героев ----------
Z.hk.allyHit = function (s) {
  var G = Z.G;
  if (s.kind === 'snowb') {
    // снежок Эскимо: урон по небольшой площади и замедление; большой (приём) — ещё и заморозка
    var es = Z.unitOf(G, 'eskimo'), mul = es && Z.synOn(G, 'eskimo', 'plombir') ? 1.25 : 1, rr = s.big ? 1.5 : 0.75;
    enemiesIn(G, s.tx, s.ty, rr, true).forEach(function (e) {
      _.damage(e, s.dmg * mul * (e === s.tgt ? 1 : 0.5), { frozenBonus: 1.2 }); if (e.dead) { G.heroKills++; Z.stat('heroKills'); return; }
      if (!e.boss) { e.slow = Math.max(e.slow || 0, 0.4); e.slowT = Math.max(e.slowT || 0, es && es.lvl >= 3 ? 2.4 : 1.2); if (s.frz) e.stun = Math.max(e.stun || 0, s.frz); }
    });
    G.fx.push({ k: 'ring', x: s.tx, y: s.ty, r: rr, t: 0, dur: 0.4, col: '#dff6ff' }); _.puff(s.tx, s.ty, s.big ? 10 : 5, s.big ? 1.2 : 0.7); if (_.snowPuff) _.snowPuff(s.tx, s.ty);
    Z.AU.sfx(s.big ? 'ice_break' : 'bd2', s.big ? 0.5 : 0.3, { gap: 0.05 }); if (s.big) G.shake = Math.max(G.shake, 0.12);
    return true;
  }
  if (s.kind === 'pot') {
    _.explode(s.tx, s.ty, s.ult ? 1.1 : 0.9, s.dmg, false, true);
    G.fx.push({ k: 'boom', x: s.tx, y: s.ty, t: 0, dur: 0.5 }); G.fx.push({ k: 'v_crater', x: s.tx, y: s.ty, t: 0, dur: 9 });
    Z.AU.sfx('barrel_boom', s.ult ? 0.6 : 0.35, { gap: 0.05 });
    if (Z.WAT) { Z.WAT.splash(s.tx, s.ty, 1); Z.WAT.breakIce(s.tx, s.ty, 0.8); if (s.freeze) Z.WAT.freezeArea(s.tx, s.ty, 1.2); }
    var em = Z.unitOf(G, 'emelya');
    if (s.fire || (em && em.lvl >= 3 && Math.random() < 0.3)) { G.fires = G.fires || []; if (G.fires.length < 14) G.fires.push({ x: s.tx, y: s.ty, t: 4, dmgFire: 1 }); }
    G.shake = Math.max(G.shake, s.ult ? 0.25 : 0.1);
    return true;
  }
  if (s.kind === 'ball') {
    // клубок скачет между врагами
    if (s.tgt && !s.tgt.dead) _.damage(s.tgt, s.dmg, {});
    s.hops = (s.hops === undefined ? (Z.unitOf(G, 'vasilisa') && Z.unitOf(G, 'vasilisa').lvl >= 3 ? 3 : 2) : s.hops) - 1;
    if (s.hops >= 0) {
      var from = s.tgt || { x: s.tx, y: s.ty }, nxt = null, nd = 2.6; s.seen = s.seen || {}; if (s.tgt) s.seen[s.tgt.id] = 1;
      G.enemies.forEach(function (e) { if (e.dead || s.seen[e.id]) return; var d = Math.hypot(e.x - from.x, e.y - from.y); if (d < nd) { nd = d; nxt = e; } });
      if (nxt) G.shots.push({ k: 'ally', kind: 'ball', x: from.x, y: from.y - 0.3, x0: from.x, y0: from.y - 0.3, tgt: nxt, tx: nxt.x, ty: nxt.y, t: 0, dur: 0.2, dmg: s.dmg * 0.85, hops: s.hops, seen: s.seen });
    }
    Z.AU.sfx('magic_ball', 0.25, { gap: 0.08, pitch: 1.2 });
    return true;
  }
  if (s.kind === 'cone' && s.stun && s.tgt && !s.tgt.boss) s.tgt.stun = Math.max(s.tgt.stun || 0, s.stun);
  return false;
};

// ---------- опыт после уровня ----------
var oldWon = Z.levelWon;
Z.levelWon = function () {
  var G = Z.G, ups = [];
  if (G && !G.xpGiven) {
    G.xpGiven = true;
    var inB = (G.squad || []).map(function (U) { return U.type; });
    Z.ALLY_ORDER.forEach(function (t) {
      if (!Z.allyUnlocked(t)) return;
      var U = (G.squad || []).filter(function (u) { return u.type === t; })[0];
      var xp = 18 + G.idx * 0.6 + (U ? (U.kills || 0) * 0.6 : 0);
      if (inB.indexOf(t) < 0) xp *= 0.5;
      if (Z.addAllyXp(t, xp)) ups.push(t);
    });
    if (Z.trialHero) { Z.save.trials = Z.save.trials || {}; if (!Z.save.trials[Z.trialHero] && Z.OKP_OFF) { Z.save.flakes += 20; if (Z.ui && Z.ui.toast) Z.ui.toast(TT('Испытание пройдено: +20 снежинок', 'Trial complete: +20 snowflakes'), '#9fdcff'); } Z.save.trials[Z.trialHero] = 1; if (Z.say) Z.say(Z.trialHero, 'trialWin'); }   // 2.12.21: награда за испытание — 20 снежинок (раньше +1 очко командования)
    G.allyUps = ups;
  }
  return oldWon.apply(this, arguments);
};
Z.allyUnlocked = function (t) { var u = Z.ALLIES[t].unlock; return Z.unlockedLevel() >= u || (Z.save.stars[u - 1] > 0); };

// убийства героями — опыт; Белка с пассивкой подбирает монетки
var oldKillHook = Z.hk.kill;
Z.hk.kill = function (e) {
  if (oldKillHook) oldKillHook(e);
  var G = Z.G;
  (G.squad || []).forEach(function (H) { if (!H.dead && Math.hypot(H.x - e.x, H.y - e.y) < H.r + 0.8) { H.kills = (H.kills || 0) + 1; if (H.type === 'belka' && H.lvl >= 3) { G.coins += 1; } } });
};

// ---------- испытания героев ----------
Z.TRIALS = {
  moroz:    { lvl: 4,  waves: 5, towers: ['snow', 'ice'],     ru: 'Тряхни стариной', en: 'Still Got It' },
  eskimo:   { lvl: 6,  waves: 5, towers: ['snow', 'ice'],     ru: 'Точно в цель', en: 'Right on Target' },
  sneg:     { lvl: 8,  waves: 5, towers: ['snow', 'mg'],      ru: 'Без дедушки', en: 'Without Grandpa' },
  emelya:   { lvl: 10, waves: 5, towers: ['mortar', 'snow'],  ru: 'Печной рейд', en: 'Stove Raid' },
  belka:    { lvl: 12, waves: 5, towers: ['mg', 'snow'],      ru: 'Рекорд в орешках', en: 'A Record in Nuts' },
  kolobok:  { lvl: 16, waves: 6, towers: ['snow', 'ice'],     ru: 'Убеги от лисы', en: 'Outrun the Fox' },
  plombir:  { lvl: 17, waves: 6, towers: ['ice', 'mg'],       ru: 'Испытание доблести', en: 'Trial of Valour' },
  vasilisa: { lvl: 23, waves: 6, towers: ['tesla', 'snow'],   ru: 'Задача с подвохом', en: 'A Tricky Problem' },
  kot:      { lvl: 26, waves: 6, towers: ['ice', 'mortar'],   ru: 'Тихий час', en: 'Quiet Hour' }
};
Z.trialOpen = function (t) { return Z.allyUnlocked(t) && Z.unlockedLevel() >= Z.TRIALS[t].lvl; };
Z.startTrial = function (t) {
  var T = Z.TRIALS[t];
  Z.trialHero = t; Z.trialTowers = T.towers;
  var idx = T.lvl - 1;
  if (Z.ui.goLevel) Z.ui.goLevel(idx, false);
  var G = Z.G; if (!G) return;
  G.trial = t; G.waves = G.waves.slice(0, T.waves); G.coins = Math.round(G.coins * 1.2);
  if (Z.say) setTimeout(function () { Z.say(t, 'trial'); }, 900);
};
var oldTU = Z.towerUnlocked;
Z.towerUnlocked = function (type, idx) { if (Z.trialHero && Z.G && Z.G.trial) return Z.trialTowers.indexOf(type) >= 0; return oldTU(type, idx); };

// тексты
var RU = {
  al_emelya: 'Емеля на печи', al_emelyaD: 'Подрывник: печь стреляет горшками по площади. Приём «По щучьему велению» — Щука выныривает, залп из 6 горшков.',
  al_kolobok: 'Колобок', al_kolobokD: 'Самый быстрый. Катится сквозь врагов. Приём «Я от бабушки ушёл» — прокатывается по дороге до входа, сбивая всех.',
  al_vasilisa: 'Василиса Премудрая', al_vasilisaD: 'Чародейка: клубок скачет между врагами. Приём «Утро вечера мудренее» — отматывает врагов назад по пути.',
  al_eskimo: 'Снеговик Эскимо — пушкарь', al_eskimoD: 'Младший брат Пломбира. Бьёт издалека из ледяной пушки: снежки задевают соседей и замедляют. Приём «Большой залп» — три больших снежка замораживают толпу.', ult_eskimo: 'Большой залп!',
  al_kot: 'Кот-Баюн', al_kotD: 'Мурлыканьем замедляет всех рядом. Приём «Колыбельная» — враги засыпают, удар будит.',
  ult_emelya: 'По щучьему велению!', ult_kolobok: 'Я от бабушки ушёл!', ult_vasilisa: 'Утро вечера мудренее!', ult_kot: 'Колыбельная!',
  okp: 'ОК', okFull: 'Очки командования', okHint: 'Нажми на героя, чтобы взять или убрать. Бери в отряд хоть всех открытых героев — чем больше отряд, тем крепче враги.',
  reserve: 'Запас', inBattle: 'В бою', swap: 'Замена', swapHint: 'Нажми героя в запасе — он выйдет из ворот вместо выбранного',
  auto: 'АВТО', allHere: 'Все сюда', allHereT: 'Нажми место — весь отряд пойдёт туда', trial: 'Испытание', trialDone: 'Пройдено', trialReward: '+20 снежинок, 2 новые реплики',
  heroLvl: 'ур.', perk3: 'Ур. 3', perk5: 'Ур. 5 — выбери усиление', perk10: 'Ур. 10: приём сильнее на 30% и чаще', syn: 'Связки', ultMode: 'Приёмы', ultAuto: 'Сами', ultManual: 'Вручную (+15%)',
  tapUlt: 'Нажми место для приёма', respawnIn: 'Вернётся через', chooseLeader: 'Нажми героя на портрете или на поле'
};
var EN = {
  al_emelya: 'Emelya on the Stove', al_emelyaD: 'Demolisher: the stove lobs pots that explode. Ability "By the Pike\'s Command" — the Pike surfaces, a 6-pot volley.',
  al_kolobok: 'Kolobok', al_kolobokD: 'The fastest. Rolls through enemies. Ability "I Ran Away from Grandma" — rolls down the road to the gate, bowling everyone over.',
  al_eskimo: 'Eskimo the Snowman — gunner', al_eskimoD: 'Plombir\'s little brother. Fires an ice cannon from afar: snowballs splash and slow. Ability "Big Volley" — three huge snowballs freeze the crowd.', ult_eskimo: 'Big Volley!',
  al_vasilisa: 'Vasilisa the Wise', al_vasilisaD: 'Sorceress: a magic ball bounces between enemies. Ability "Morning Is Wiser" — rewinds enemies back along their path.',
  al_kot: 'Bayun the Cat', al_kotD: 'His purring slows everyone nearby. Ability "Lullaby" — enemies fall asleep; a hit wakes them.',
  ult_emelya: 'By the Pike\'s command!', ult_kolobok: 'I ran away from Grandma!', ult_vasilisa: 'Morning is wiser!', ult_kot: 'Lullaby!',
  okp: 'CP', okFull: 'Command points', okHint: 'Tap a hero to add or remove. Take every unlocked hero if you like — a bigger squad meets tougher enemies.',
  reserve: 'Reserve', inBattle: 'In battle', swap: 'Swap', swapHint: 'Tap a reserve hero — they will come out of the gate instead of the selected one',
  auto: 'AUTO', allHere: 'All here', allHereT: 'Tap a spot — the whole squad goes there', trial: 'Trial', trialDone: 'Completed', trialReward: '+20 snowflakes, 2 new lines',
  heroLvl: 'lv', perk3: 'Lv 3', perk5: 'Lv 5 — pick an upgrade', perk10: 'Lv 10: ability 30% stronger and faster', syn: 'Combos', ultMode: 'Abilities', ultAuto: 'Automatic', ultManual: 'Manual (+15%)',
  tapUlt: 'Tap a spot for the ability', respawnIn: 'Back in', chooseLeader: 'Tap a hero portrait or on the field'
};
Object.assign(Z.TXT.ru, RU); Object.assign(Z.TXT.en, EN);
})();
