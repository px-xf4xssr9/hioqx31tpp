/* Игровая логика уровня: волны, враги, вышки, бой, сопровождение саней */
(function () {
'use strict';
var Z = window.Z;
var CW = 10;
var key = function (c, r) { return r * CW + c; };
Z.hk = Z.hk || {}; // 2.6: точки расширения (вода, отряд, боссы, карты)

// первое появление врагов (индекс уровня)
var FIRST = { raccoon: 0, icicle: 1, thrower: 4, engineer: 4, sculptor: 9, fat: 3, sled: 7, crow: 8, ram: 14, split: 15, plow: 21, giant: 0, chariot: 0, witch: 0 };
Z.FIRST = FIRST;

Z.save = {
  v: 2, stars: {}, heroic: {}, flakes: 0, research: {}, seen: {}, chests: {}, daily: '',
  music: 0.7, sfx: 0.9, tut: 0, t: 0,
  diff: 'normal', tipsOff: false, squad: ['moroz', 'sneg', 'belka'], heroXp: 0, stats: {}, ach: {}, cos: { fort: 'base', trim: 'base' }, endlessBest: 0, testAdded: null,
  inv: { up: {}, ad: { d: '', n: 0, t: 0 } }, buffs: { lvl: {}, on: [] }, trial: null, sync: { rev: 0, n: 0, sn: 0 }   // 2.11.5: запасы, улучшения, усиления, примерка — должны быть в шаблоне, иначе при загрузке не переносятся
};
// 2.12.13: сохранение переносится целиком, а не только поля из шаблона выше: раньше настройки, которых нет в шаблоне
// (разрешение, кадры, резкость, эффекты, звук, озвучка и т. п.), терялись при перезапуске.
Z.adoptSave = function (src, skip) { if (!src) return; for (var k in src) if (src[k] !== undefined && k !== skip) Z.save[k] = src[k]; };
Z.stat = function (k, n) { var st = Z.save.stats; st[k] = (st[k] || 0) + (n === undefined ? 1 : n); };
Z.heroUnlocked = function (idx) { return idx >= 3; };
Z.heroLevel = function () { return Math.min(15, 1 + Math.floor(Math.sqrt((Z.save.heroXp || 0) / 30))); };
Z.unlockedLevel = function () {
  var n = 0; while (n < Z.LEVELS.length && Z.save.stars[n]) n++;
  return Math.min(n, Z.LEVELS.length - 1);
};
Z.totalStars = function () { var s = 0; for (var k in Z.save.stars) s += Z.save.stars[k]; return s; };
Z.towerUnlocked = function (type, idx) { var u = Z.TOWERS[type].unlock; return idx >= u || (idx >= 3 && Z.save.stars[u] > 0); };
Z.skillUnlocked = function (id, idx) { var u = Z.SKILLS[id].unlock; return idx >= u || (idx >= 3 && Z.save.stars[u] > 0); };

// ---------- ВОЛНЫ ----------
function hpScale(idx, heroic) {
  // середина кампании чуть плотнее, чтобы не было скучно; поздние уровни не усложняем
  var mid = 1 + 0.22 * Math.max(0, Math.min(1, (idx - 3) / 5)) * Math.max(0, Math.min(1, (22 - idx) / 6));
  var late = 1 - 0.18 * Math.max(0, Math.min(1, (idx - 20) / 10));   // 2.8: было −30% к 30-му уровню — к концу игры было слишком легко
  // 2.7.4: вход мягче — первые три уровня без надбавки, дальше до 11-го она вдвое меньше прежней (было 1.18); первый босс (7-й уровень) ещё чуть легче
  // 2.7.4б: по прогонам «слабого» и «среднего» ботов — надбавка на 4–11-м уровнях убрана; первый босс (7-й), сопровождение на 10-м и первые ночные (11–12-й) легче на 10–12%
  var early = idx === 1 ? 0.88 : idx === 6 ? 0.85 : idx === 9 ? 0.85 : (idx === 10 || idx === 11) ? 0.88 : idx === 27 ? 0.84 : 1;   // 2.11.5: босс гор (28-й) был стеной — бот не проходил за 9 попыток
  return Math.pow(1.105, idx) * mid * late * early * 1.06 * (heroic ? 1.6 : 1);
}
Z.hpScale = hpScale;
function typesFor(info) {
  var pool = Z.REGIONS[info.region].pool;
  return pool.filter(function (t) { return FIRST[t] <= info.idx; });
}
Z.makeWaves = function (info, heroic, L) {
  var waves = [], types = typesFor(info), rnd = Z.rng(5000 + info.idx * 31);
  var nPaths = L.entrances ? L.entrances.length : 2;
  var newest = types.filter(function (t) { return FIRST[t] === info.idx || FIRST[t] === info.idx - 1; });
  for (var w = 0; w < info.waves; w++) {
    var list = [], t = 0.5, hv = 0;
    var count = Math.min(34, 6 + w * 2 + info.region * 2 + Math.floor(info.k / 2));
    if (info.idx === 0) count = 3 + w * 2; else if (info.idx === 1) count = 5 + w * 2;
    if (info.type === 'boss' && w === info.waves - 1) count = Math.round(count * (info.region === 4 ? 0.45 : info.region === 3 ? 0.48 : 0.6));
    // 2.11.5: поздние бои шли по 12–16 минут — врагов в волне меньше (сила волны ниже на 12–20 %), бой короче; проверено ботом
    if (info.region >= 2 && info.idx > 0) count = Math.max(4, Math.round(count * (info.region === 2 ? 0.88 : 0.8)));
    var avail = types.slice(0, Math.max(1, Math.min(types.length, 1 + Math.floor((w + 2) * types.length / info.waves))));
    var heavy = { plow: 1, ram: 1, fat: 1 };
    if (newest.length && w >= 1) newest.forEach(function (n) { if (avail.indexOf(n) < 0 && (!heavy[n] || w >= Math.floor(info.waves * 0.4))) avail.push(n); });
    var i = 0;
    while (i < count) {
      var path = Math.floor(rnd() * nPaths);
      var type = avail[Math.floor(rnd() * avail.length)];
      if (newest.indexOf(type) < 0 && newest.length && rnd() < 0.3 && w >= 1) { var nt = newest[Math.floor(rnd() * newest.length)]; if (avail.indexOf(nt) >= 0) type = nt; }
      // тяжёлая техника дозированно — иначе поздние волны превращаются в стену из снегоуборщиков
      if (type === 'plow' || type === 'ram') { hv = (hv || 0) + 1; if (hv > 1 + Math.floor(w / 3)) type = rnd() < 0.5 ? 'sled' : 'raccoon'; }
      var grp = type === 'icicle' || type === 'raccoon' ? 2 + Math.floor(rnd() * 3) : 1 + Math.floor(rnd() * 2);
      for (var g = 0; g < grp && i < count; g++, i++) { list.push({ t: t, type: type, path: path }); t += type === 'icicle' ? 0.3 : 0.5; }
      t += 0.5 + rnd() * 1.1;
    }
    if (info.type === 'boss' && w === info.waves - 1) list.push({ t: t * 0.4, type: Z.REGIONS[info.region].boss, path: 0 });
    list.sort(function (a, b) { return a.t - b.t; });
    waves.push({ list: list, hpMul: hpScale(info.idx, heroic) * Math.pow(1.1, w) });
  }
  return waves;
};
Z.makeEscortSpawns = function (info, heroic) {
  var types = typesFor(info), rnd = Z.rng(7000 + info.idx * 17), list = [];
  var t = 3, dur = 70, gap = Math.max(1.1, 2.4 - info.region * 0.25 - info.k * 0.05);
  while (t < dur) {
    var type = types[Math.floor(rnd() * types.length)];
    var grp = type === 'raccoon' || type === 'icicle' ? 1 + Math.floor(rnd() * 3) : 1;
    var side = Math.floor(rnd() * 2);
    for (var g = 0; g < grp; g++) list.push({ t: t + g * 0.4, type: type, path: side });
    t += gap * (0.7 + rnd() * 0.8) * grp;
  }
  return { list: list, hpMul: hpScale(info.idx, heroic) * 1.25 };
};

// ---------- СОЗДАНИЕ УРОВНЯ ----------
Z.startLevel = function (idx, heroic, dims) {
  var info = Z.LEVELS[idx], L = Z.genLevel(idx, dims || Z.levelDims || { W: 10, H: 10 }), R = Z.save.research;
  CW = L.W;
  var G = {
    idx: idx, info: info, L: L, heroic: !!heroic, t: 0, speed: 1,
    phase: 'build', coins: 150 + idx * 15 + (R.gold || 0) * 25 + (info.type === 'escort' ? 90 : 0),
    hpMax: info.type === 'escort' ? 16 + (R.fort || 0) * 2 : 20 + (R.fort || 0) * 4,
    wave: 0, waves: null, spawnQ: [], spawnT: 0, waveMul: 1, enemies: [], towers: {}, barricades: {}, shots: [], fx: [], texts: [],
    skills: { blizzard: 0, bomb: 0, santa: 0 }, skillAdUsed: {}, blizT: 0, adBliz: false, betweenT: 0, losses: 0, weaker: false,
    adStartUsed: false, checkpoint: null, aim: null, sel: null, menu: null, drag: null, shake: 0, flash: 0, hpLost: 0, intensity: 0, sleigh: null,
    seenThisLevel: {}, traps: {}, decals: [], nav: null, navDirty: true, sway: {}, dtrail: {}, structs: []
  };
  G.diff = heroic ? 'heroic' : (Z.save.diff === 'easy' ? 'easy' : 'normal');
  if (G.diff === 'easy') G.coins = Math.round(G.coins * 1.2);
  G.hp = G.hpMax;
  G.kills = 0; G.heroKills = 0; G.slowT = 0;
  if (info.type === 'escort') {
    var sp = Z.makeEscortSpawns(info, heroic);
    G.escort = sp;
    G.sleigh = { f: 0, hp: G.hpMax, stopT: 0, house: 0, moving: false, bells: 0 };
  } else {
    G.waves = Z.makeWaves(info, heroic, L);
  }
  Z.G = G;
  if (Z.heroUnlocked(idx)) initHero(G); else { G.hero = null; G.squad = []; }
  G.structs = []; G.baseBuilt = 0;
  var lm = Z.LEVEL_MOD[idx];
  if (lm) {
    G.mut = { spd: 1, armor: 0, swarm: 1, elite: 0, air: 0, build: 0, list: [lm], story: true };
    if (lm === 'fast') G.mut.spd = 1.1; else if (lm === 'armor') G.mut.armor = 1.5; else if (lm === 'elite') G.mut.elite = 0.08; else if (lm === 'air') G.mut.air = 0.15; else if (lm === 'build') G.mut.build = 1;
    // компенсация: аномалия делает уровень интереснее, а не просто толще
    (G.waves || []).forEach(function (w) { w.hpMul *= 0.93; }); if (G.escort) G.escort.hpMul *= 0.93;
  }
  buildNav();
  return G;
};
// бесконечный режим «Ночь перед Новым годом»
// каждый забег — случайный регион, огромная карта (больше «больших» уровней), 3–4 входа, нарастающие аномалии
Z.startEndless = function (dims) {
  var pool = Z.LEVELS.filter(function (l) { return l.type === 'defend' && l.idx >= 5; }), seed = pool[Math.floor(Math.random() * pool.length)].idx;
  Z.endlessGen = true;
  var G; try { G = Z.startLevel(seed, false, dims); } finally { Z.endlessGen = false; }
  var reg = Z.LEVELS[seed].region;
  G.endless = true; G.info = { idx: seed, region: reg, k: 3, type: 'defend', waves: 0 }; G.waves = [];
  G.coins = 340 + (Z.save.research.gold || 0) * 25; G.diff = 'normal'; G.mut = { spd: 1, armor: 0, swarm: 1, elite: 0, air: 0, build: 0, list: [] };
  G.endSeed = Math.floor(Math.random() * 1e6);
  for (var i = 0; i < 3; i++) G.waves.push(endlessWave(G, i));
  return G;
};
Z.MUTS = ['fast', 'armor', 'swarm', 'elite', 'air', 'build'];
function endlessMutate(G, w) {
  // каждые 5 волн ночь становится злее: новая аномалия (накопительно)
  if (w < 4 || (w + 1) % 5 !== 0) return null;
  var m = Z.MUTS[(Math.floor((w + 1) / 5) - 1 + (G.endSeed || 0)) % Z.MUTS.length], M = G.mut;
  if (m === 'fast') M.spd += 0.08; else if (m === 'armor') M.armor += 1.5; else if (m === 'swarm') M.swarm += 0.25; else if (m === 'elite') M.elite += 0.06; else if (m === 'air') M.air += 0.12; else M.build += 1;
  M.list.push(m); return m;
}
function endlessWave(G, w) {
  var rnd = Z.rng(9000 + w * 13 + G.idx + (G.endSeed || 0)), all = ['raccoon', 'icicle', 'thrower', 'fat', 'engineer', 'sled', 'sculptor', 'crow', 'split', 'ram', 'plow'];
  var avail = all.slice(0, Math.min(all.length, 3 + Math.floor(w / 2))), M = G.mut || { swarm: 1, elite: 0, air: 0 };
  var nPaths = G.L.entrances.length, list = [], t = 0.5, count = Math.min(90, Math.round((8 + w * 2.6) * M.swarm));
  // волна идёт «пачками» с разных входов одновременно — приходится думать о каждом фланге
  var packs = Math.min(nPaths, 1 + Math.floor(w / 4)), packPaths = [];
  for (var p = 0; p < packs; p++) packPaths.push(Math.floor(rnd() * nPaths));
  for (var i = 0; i < count; i++) {
    var ty = avail[Math.floor(rnd() * avail.length)];
    if (rnd() < M.air) ty = 'crow';
    list.push({ t: t, type: ty, path: packPaths[i % packs], elite: rnd() < M.elite });
    t += Math.max(0.18, (0.5 + rnd() * 0.9) * Math.pow(0.97, w)) / Math.max(1, packs * 0.6);
  }
  if ((w + 1) % 10 === 0) { var nb = 1 + Math.floor(w / 30); for (var b = 0; b < nb; b++) list.push({ t: t * (0.3 + b * 0.3), type: ['giant', 'chariot', 'witch'][(Math.floor(w / 10) + b) % 3], path: b % nPaths }); }
  else if ((w + 1) % 5 === 0) list.push({ t: t * 0.5, type: w > 12 ? 'plow' : 'fat', path: Math.floor(rnd() * nPaths), elite: true });
  list.sort(function (a, b) { return a.t - b.t; });
  return { list: list, hpMul: Math.pow(1.105, w) * 0.85 * (1 + Math.max(0, w - 20) * 0.03) };
}
Z.endlessMutate = endlessMutate;

// ---------- ОТРЯД СОЮЗНИКОВ ----------
// Дед Мороз — командир (бьёт по площади, держит двоих), Снегурочка — лекарь (лечит вышки и отряд, морозит),
// Белка Шишка — разведчица (быстрая, шишками издалека, сносит постройки, видит в кустах), Пломбир — снеговик-богатырь (держит четверых)
Z.ALLIES = {
  moroz:   { unlock: 3,  hp: 90,  hpL: 20, dmg: 8, dmgL: 3,   r: 1.0, cd: 1.05, spd: 1.9, block: 2, aoe: true, structX: 4, col: '#e8484f' },
  sneg:    { unlock: 7,  hp: 70,  hpL: 14, dmg: 5, dmgL: 2,   r: 2.3, cd: 0.95, spd: 2.1, block: 0, shot: 'ice', heal: 0.04, structX: 1, col: '#4aa3ff' },
  belka:   { unlock: 11, hp: 55,  hpL: 12, dmg: 4, dmgL: 2,   r: 2.7, cd: 0.5,  spd: 2.9, block: 0, shot: 'cone', structX: 8, reveal: 3, col: '#ff8a3d' },
  plombir: { unlock: 16, hp: 240, hpL: 45, dmg: 10, dmgL: 4,  r: 0.95, cd: 1.35, spd: 1.25, block: 4, aoe: true, structX: 2, col: '#7fd8ff' }
};
Z.ALLY_ORDER = ['moroz', 'sneg', 'belka', 'plombir'];
Z.SQUAD_MAX = 3;
Z.squadMax = function (idx) { return idx >= 23 ? 4 : 3; };
// аномалии в сюжете — новизна на каждом уровне второй половины игры
Z.LEVEL_MOD = { 15: 'elite', 18: 'build', 21: 'armor', 22: 'fast', 24: 'elite', 25: 'air', 28: 'build', 29: 'armor', 31: 'fast', 32: 'elite' };
Z.allyUnlocked = function (t) { return Z.unlockedLevel() >= Z.ALLIES[t].unlock || Z.save.stars[Z.ALLIES[t].unlock - 1] > 0; };
Z.squadFor = function (idx) {
  var sel = (Z.save.squad || ['moroz', 'sneg', 'belka']).filter(function (t) { return Z.ALLIES[t] && idx >= Z.ALLIES[t].unlock; });
  if (!sel.length && idx >= 3) sel = ['moroz'];
  // новый союзник впервые — обязательно в отряде
  Z.ALLY_ORDER.forEach(function (t) { if (Z.ALLIES[t].unlock === idx && sel.indexOf(t) < 0) { sel.unshift(t); } });
  return sel.slice(0, Z.squadMax(idx));
};
function initHero(G) {
  var L = G.L, lv = Z.heroLevel(), c;
  if (L.type === 'escort') c = L.main[Math.min(5, L.main.length - 1)];
  else { var p = L.paths[0]; c = p[Math.max(0, p.length - 4)]; }
  G.squad = Z.squadFor(G.endless ? 99 : G.idx).map(function (t, i) {
    var A = Z.ALLIES[t], ox = (i - 1) * 0.6, oy = (i % 2) * 0.4;
    return { type: t, x: c[0] + 0.5 + ox, y: c[1] + 0.5 + oy, tx: c[0] + 0.5 + ox, ty: c[1] + 0.5 + oy, home: { x: c[0] + 0.5 + ox, y: c[1] + 0.5 + oy }, lvl: lv,
      max: A.hp + lv * A.hpL, hp: A.hp + lv * A.hpL, dmg: A.dmg + lv * A.dmgL, r: A.r + lv * 0.02, cd: 0.5 + i * 0.2, dead: false, respawn: 0, walk: 0, dir: 1, atk: 0, blockN: 0, hitT: 0 };
  });
  G.hero = G.squad[0] || null;
}
Z.heroMove = function (x, y, unit) {
  var G = Z.G, H = unit || (Z.ui && Z.ui.heroSel && Z.ui.heroSel.type ? Z.ui.heroSel : G && G.hero); if (!H || H.dead) return false;
  var L = G.L; H.tx = Math.max(0.3, Math.min(L.W - 0.3, x)); H.ty = Math.max(0.3, Math.min(L.H - 0.3, y));
  Z.AU.sfx('sleigh', 0.25, { gap: 0.2 });
  if (Z.AU.voice) Z.AU.voice(H.type, 'idle');
  if (Math.random() < 0.5) { var lines = Z.T('say_' + H.type).split('|'); G.texts.push({ s: lines[Math.floor(Math.random() * lines.length)], x: H.x, y: H.y - 1.4, c: Z.ALLIES[H.type].col, t: 0, dur: 1.4, sz: 0.65 }); }
  return true;
};
function updateHero(dt) { var G = Z.G; (G.squad || []).forEach(function (U) { updateUnit(G, U, dt); }); }
function updateUnit(G, H, dt) {
  var A = Z.ALLIES[H.type];
  H.hitT = Math.max(0, H.hitT - dt); H.atk = Math.max(0, H.atk - dt);
  if (H.dead) {
    H.respawn -= dt;
    if (H.respawn <= 0) { H.dead = false; H.hp = H.max; H.x = H.tx = H.home.x; H.y = H.ty = H.home.y; puff(H.x, H.y, 12, 1.2); Z.AU.sfx('levelup', 0.6); }
    return;
  }
  var dx = H.tx - H.x, dy = H.ty - H.y, d = Math.sqrt(dx * dx + dy * dy), sp = A.spd * dt * (Z.hk.unitSpd ? Z.hk.unitSpd(H) : 1);
  if (H.stunT > 0) { H.stunT -= dt; sp = 0; H.cd = Math.max(H.cd, 0.2); }
  if (d > 0.02) { var m = Math.min(d, sp); H.x += dx / d * m; H.y += dy / d * m; H.walk += dt * 8; H.dir = dx > 0 ? 1 : dx < 0 ? -1 : H.dir; H.moving = true; } else H.moving = false;
  H.cd -= dt;
  var near = 0;
  // Снегурочка лечит вышки и отряд рядом
  if (A.heal) {
    for (var k in G.towers) { var tw = G.towers[k], tx = tw.c + 0.5 - H.x, ty = tw.r + 0.5 - H.y; if (tx * tx + ty * ty < 2.6 && tw.hp < tw.max) { tw.hp = Math.min(tw.max, tw.hp + tw.max * A.heal * dt); if (Math.random() < dt * 3) G.fx.push({ k: 'star', x: tw.c + 0.5, y: tw.r, t: 0, dur: 0.6 }); } }
    G.squad.forEach(function (o) { if (o !== H && !o.dead && Math.hypot(o.x - H.x, o.y - H.y) < 1.6) o.hp = Math.min(o.max, o.hp + o.max * A.heal * dt); });
  }
  if (H.cd <= 0) {
    var r2 = H.r * H.r, hits = [], best = null, bd = 1e9;
    for (var i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i]; if (e.dead || (Z.heroCant ? Z.heroCant(e) : (Z.hk.untargetable && Z.hk.untargetable(e)))) continue;
      var ex = e.x - H.x, ey = e.y - H.y, dd = ex * ex + ey * ey;
      if (dd <= r2) { hits.push(e); if (dd < bd) { bd = dd; best = e; } }
    }
    // 2.11.5: до постройки считаем от края её клетки (раньше — от центра: подойдя наискось, герой стоял в 1,33 клетки и не бил);
    // постройка у норы — бьём с края круга, куда героя выталкивает (Z.structReach)
    var sHits = (G.structs || []).filter(function (s) { if (s.dead) return false; var sx = Math.max(s.c - H.x, 0, H.x - (s.c + 1)), sy = Math.max(s.r - H.y, 0, H.y - (s.r + 1)), rr = H.r + 0.45 + (Z.structReach ? Z.structReach(s) : 0); return sx * sx + sy * sy <= rr * rr; });
    if (sHits.length && !hits.length) {
      sHits.forEach(function (s) { Z.damageStruct(s, H.dmg * A.structX); });
      if (A.shot) { var s0 = sHits[0]; G.shots.push({ k: 'ally', kind: A.shot, x: H.x, y: H.y - 0.5, x0: H.x, y0: H.y - 0.5, tx: s0.c + 0.5, ty: s0.r + 0.3, t: 0, dur: 0.3, dmg: 0 }); }
      else G.fx.push({ k: 'ring', x: H.x, y: H.y, r: H.r, t: 0, dur: 0.45, col: '#ffd54a' });
      H.atk = 0.3; H.cd = A.cd; Z.AU.sfx('crack', 0.5);
    }
    if (hits.length) {
      if (A.aoe) {
        hits.forEach(function (e) { damage(e, H.dmg, { frozenBonus: 1.3 }); if (e.dead) { G.heroKills++; Z.stat('heroKills'); } else if (!e.boss && H.type === 'moroz') { e.slow = Math.max(e.slow, 0.3); e.slowT = Math.max(e.slowT, 0.8); } else if (!e.boss) e.kb = 0.15; });
        G.fx.push({ k: 'ring', x: H.x, y: H.y, r: H.r, t: 0, dur: 0.45, col: H.type === 'moroz' ? '#bfe6ff' : '#ffffff' });
        if (!(Z.heroAtkSnd && Z.heroAtkSnd(H, true))) { Z.AU.sfx(H.type === 'moroz' ? 'freeze' : 'bd2', 0.4, { gap: 0.1 }); Z.AU.sfx('timp4', 0.25, { pitch: H.type === 'moroz' ? 1.3 : 0.9 }); }
      } else {
        G.shots.push({ k: 'ally', kind: A.shot, x: H.x, y: H.y - 0.5, x0: H.x, y0: H.y - 0.5, tgt: best, tx: best.x, ty: best.y, t: 0, dur: 0.25, dmg: H.dmg, slow: H.type === 'sneg' ? 0.35 : 0 });
        if (!(Z.heroAtkSnd && Z.heroAtkSnd(H, false))) Z.AU.sfx(H.type === 'sneg' ? 'ice' : 'tap', 0.35, { gap: 0.06, pitch: H.type === 'belka' ? 1.4 : 1.1 });
      }
      H.atk = 0.3; H.cd = A.cd; near = 1; H.dir = best.x > H.x ? 1 : -1;
    } else if (!sHits.length) H.cd = 0.15;
  }
  // фирменный приём каждого союзника — по перезарядке, когда врагов рядом много или рядом босс
  H.ult = (H.ult === undefined ? 6 : H.ult) - dt;
  if (Z.hk.ult) Z.hk.ult(G, H, dt);
  else if (H.ult <= 0) {
    var ur = H.type === 'sneg' ? 3 : H.type === 'belka' ? 3.6 : 1.9, inR = G.enemies.filter(function (e) { return !e.dead && Math.hypot(e.x - H.x, e.y - H.y) < ur && !(Z.heroCant ? Z.heroCant(e) : (Z.hk.untargetable && Z.hk.untargetable(e))); });
    var hurt = H.type === 'sneg' && Object.keys(G.towers).some(function (k) { var tw = G.towers[k]; return tw.hp < tw.max * 0.6 && Math.hypot(tw.c + 0.5 - H.x, tw.r + 0.5 - H.y) < ur; });
    if (inR.length >= 3 || inR.some(function (e) { return e.boss; }) || hurt) {
      H.ult = 14; H.ready = false; H.atk = 0.5; G.shake = Math.max(G.shake || 0, 0.15);
      G.texts.push({ s: Z.T('ult_' + H.type), x: H.x, y: H.y - 1.5, c: Z.ALLIES[H.type].col, t: 0, dur: 1.6, sz: 0.8 });
      if (Z.AU.voice) Z.AU.voice(H.type, 'attack');
      if (H.type === 'moroz') {
        inR.forEach(function (e) { damage(e, H.dmg * 2, {}); if (!e.boss) e.stun = Math.max(e.stun || 0, 1.3); else { e.slow = Math.max(e.slow, 0.4); e.slowT = 1.5; } });
        G.fx.push({ k: 'ring', x: H.x, y: H.y, r: ur, t: 0, dur: 0.7, col: '#bfe6ff' }); G.fx.push({ k: 'flash', x: H.x, y: H.y, r: ur * 0.45, t: 0, dur: 0.3, col: '#d8f2ff' }); puff(H.x, H.y, 22, ur);
        Z.AU.sfx('freeze', 0.8); Z.AU.sfx('gong', 0.4);
      } else if (H.type === 'sneg') {
        for (var k2 in G.towers) { var tw2 = G.towers[k2]; if (Math.hypot(tw2.c + 0.5 - H.x, tw2.r + 0.5 - H.y) < ur) { tw2.hp = Math.min(tw2.max, tw2.hp + tw2.max * 0.35); for (var q = 0; q < 3; q++) G.fx.push({ k: 'star', x: tw2.c + 0.3 + Math.random() * 0.4, y: tw2.r + Math.random() * 0.3, t: 0, dur: 0.9 }); } }
        G.squad.forEach(function (o) { if (!o.dead) o.hp = Math.min(o.max, o.hp + o.max * 0.4); });
        inR.forEach(function (e) { e.slow = Math.max(e.slow, 0.5); e.slowT = Math.max(e.slowT, 2.2); });
        G.fx.push({ k: 'ring', x: H.x, y: H.y, r: ur, t: 0, dur: 0.8, col: '#ffd1f0' }); Z.AU.sfx('levelup', 0.6); Z.AU.sfx('ice', 0.5);
      } else if (H.type === 'belka') {
        for (var b = 0; b < 8 && inR.length; b++) { var tg = inR[b % inR.length]; G.shots.push({ k: 'ally', kind: 'cone', x: H.x, y: H.y - 0.5, x0: H.x, y0: H.y - 0.5, tgt: tg, tx: tg.x, ty: tg.y, t: 0, dur: 0.22 + b * 0.05, dmg: H.dmg * 1.6 }); }
        Z.AU.sfx('tap', 0.6, { pitch: 1.6 }); Z.AU.sfx('back', 0.4, { pitch: 1.5 });
      } else {
        inR.forEach(function (e) { damage(e, H.dmg * 1.6, {}); if (!e.boss) { e.kb = 0.7; e.stun = Math.max(e.stun || 0, 0.6); } });
        H.hp = Math.min(H.max * 1.3, H.hp + H.max * 0.3);
        G.fx.push({ k: 'ring', x: H.x, y: H.y, r: ur, t: 0, dur: 0.6, col: '#7fd8ff' }); G.fx.push({ k: 'deb', x: H.x, y: H.y, t: 0, dur: 0.8 }); Z.AU.sfx('crash', 0.5); Z.AU.sfx('timp2', 0.6, { pitch: 0.6 });
      }
    } else { H.ult = 0.6; H.ready = true; }
  }
  H.calm = near || H.blockN ? 0 : (H.calm || 0) + dt;
  if (H.calm > 3 && H.hp < H.max) H.hp = Math.min(H.max, H.hp + H.max * 0.03 * dt);
  if (H.hp <= 0) { H.dead = true; H.respawn = 15; puff(H.x, H.y, 16, 1.3); Z.AU.sfx('crack', 0.7); Z.AU.sfx('timp2', 0.5); }
}
function heroBlock(e, pos, dt) {
  var G = Z.G;
  if (e.boss || e.air || !G.squad) return false;
  // 2.8.1: снегоуборщик не останавливается — расталкивает героев и едет дальше
  if (Z.ENEMIES[e.type].crush || e.shove) {   // 2.10: и фургон-енотовоз
    G.squad.forEach(function (H) { if (H.dead) return; var dx = H.x - pos.x, dy = H.y - pos.y, d = Math.hypot(dx, dy); if (d > 0.7 || (H.plowT > 0)) return; var dd = d || 0.01, nx = dx / dd, ny = dy / dd; if (d < 0.05) { nx = 0; ny = 1; } H.x = Math.max(0.3, Math.min(G.L.W - 0.3, H.x + nx * 0.9)); H.y = Math.max(0.3, Math.min(G.L.H - 0.3, H.y + ny * 0.9)); H.stunT = Math.max(H.stunT || 0, 1.2); H.hp -= H.max * 0.12; H.hitT = 0.2; H.plowT = 1.5; puff(H.x, H.y, 8, 1); Z.AU.sfx('crack', 0.5); });
    return false;
  }
  // 2.8.1: у логова героям врагов не удержать — из входа выходят напором
  // 2.12.36: в круге у входа герои тоже держат врагов (раньше враги там проходили сквозь героев)
  for (var i = 0; i < G.squad.length; i++) {
    var H = G.squad[i], A = Z.ALLIES[H.type];
    if (H.dead || !A.block) continue;
    var dx = pos.x - H.x, dy = pos.y - H.y;
    if (dx * dx + dy * dy > (H.type === 'plombir' ? 0.55 : 0.36)) continue;
    if (H.blockN >= A.block) continue;
    H.blockN++;
    // 2.7.19: остановленный враг дерётся с героем видимыми ударами (выпад, искра, звук), урон в секунду прежний
    e.dir = dx < 0 ? 1 : -1;
    var et = Z.ENEMIES[e.type], per = et.atkRate || 0.8;
    if (e.hbCd === undefined || e.hbCd > per) e.hbCd = Math.random() * 0.3;
    e.hbCd -= dt;
    if (e.hbCd <= 0) {
      e.hbCd = per; e.lunge = 0.2;
      H.hp -= et.dmg * 5 * per; H.hitT = 0.15;
      G.fx.push({ k: 'spark', x: H.x - (dx < 0 ? 0.15 : -0.15), y: H.y - 0.35, t: 0, dur: 0.22 });
      if (!G._hbSnd || G.t - G._hbSnd > 0.18) { G._hbSnd = G.t; Z.AU.sfx('crack', 0.18, { pitch: 1.3 + Math.random() * 0.3 }); }
    }
    return true;
  }
  return false;
}

// ---------- ГЕОМЕТРИЯ ----------
function cellCenter(c) { return { x: c[0] + 0.5, y: c[1] + 0.5 }; }
function routePos(route, f) {
  var i = Math.max(0, Math.min(route.length - 1, Math.floor(f))), j = Math.min(route.length - 1, i + 1), t = f - i;
  var a = route[i], b = route[j];
  return { x: a[0] + 0.5 + (b[0] - a[0]) * t, y: a[1] + 0.5 + (b[1] - a[1]) * t };
}
Z.routePos = routePos;
Z.enemyPos = function (e) { return { x: e.x, y: e.y }; };
Z.sleighPos = function () { var G = Z.G; return routePos(G.L.main, G.sleigh.f); };

// ---------- НАВИГАЦИЯ: поля расстояний для разных типов поведения ----------
// road/ground — цена шага; danger — насколько избегает зон обстрела; trap — ловушек; bar — баррикад
var PROFILES = {
  walk:    { road: 1, ground: 1.7, danger: 0.5, trap: 1.5, bar: 10 },
  walk2:   { road: 1, ground: 1.5, danger: 0.8, trap: 3, bar: 10 },
  sneak:   { road: 1, ground: 1.25, danger: 1.2, trap: 5, bar: 14 },
  vehicle: { road: 1, ground: 3.2, danger: 0.15, trap: 0.5, bar: 3 },
  brute:   { road: 1, ground: 1.3, danger: 0, trap: 0, bar: 2 }
};
var WALK = { 0: 1, 1: 1, 3: 1, 5: 1, 10: 1 };
Z.walkable = function (c, r) {
  var G = Z.G, L = G.L;
  if (c < 0 || r < 0 || c >= L.W || r >= L.H) return false;
  var v = L.grid[r][c];
  if (!WALK[v] && !(L.fort && c === L.fort[0] && r === L.fort[1])) return false;
  return !G.towers[key(c, r)];
};
function navTarget() {
  var G = Z.G;
  if (G.L.type === 'escort') { var p = Z.sleighPos(); return [Math.floor(p.x), Math.floor(p.y)]; }
  return G.L.fort;
}
Z.navDirty = function () { if (Z.G) Z.G.navDirty = true; };
function heapPush(h, x) { h.push(x); var i = h.length - 1; while (i > 0) { var p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; var tmp = h[p]; h[p] = h[i]; h[i] = tmp; i = p; } }
function heapPop(h) { var top = h[0], last = h.pop(); if (h.length) { h[0] = last; var i = 0; for (;;) { var l = 2 * i + 1, r = l + 1, m = i; if (l < h.length && h[l][0] < h[m][0]) m = l; if (r < h.length && h[r][0] < h[m][0]) m = r; if (m === i) break; var tmp = h[m]; h[m] = h[i]; h[i] = tmp; i = m; } } return top; }
function buildNav() {
  var G = Z.G, L = G.L, Wd = L.W, Hd = L.H, n = Wd * Hd;
  var danger = []; for (var i = 0; i < n; i++) danger[i] = 0;
  var R = Z.save.research;
  for (var k in G.towers) {
    var tw = G.towers[k], st = Z.towerStat(tw.type, tw.lvl, R, tw.branch), rg = st.range * (tw.hill ? 1.25 : 1) * (tw.high ? 1.2 : 1), w = 1 + tw.lvl * 0.3;
    var r0 = Math.ceil(rg);
    for (var dr = -r0; dr <= r0; dr++) for (var dc = -r0; dc <= r0; dc++) {
      var c = tw.c + dc, r = tw.r + dr; if (c < 0 || r < 0 || c >= Wd || r >= Hd) continue;
      if (dc * dc + dr * dr <= rg * rg) danger[r * Wd + c] += w;
    }
  }
  var tgt = navTarget(), t = tgt[1] * Wd + tgt[0];
  G.nav = {};
  for (var pn in PROFILES) {
    var P = PROFILES[pn], dist = [], done = [];
    for (var j = 0; j < n; j++) { dist[j] = Infinity; done[j] = false; }
    dist[t] = 0;
    var hp = [[0, t]];
    while (hp.length) {
      var top = heapPop(hp), u = top[1];
      if (done[u]) continue;
      done[u] = true;
      var uc = u % Wd, ur = (u - uc) / Wd;
      for (var d = 0; d < 4; d++) {
        var nc = uc + (d === 0 ? 1 : d === 1 ? -1 : 0), nr = ur + (d === 2 ? 1 : d === 3 ? -1 : 0);
        if (!Z.walkable(nc, nr)) continue;
        var v = nr * Wd + nc;
        var gv = L.grid[nr][nc];
        var climb = L.hgt[nr][nc] !== L.hgt[ur][uc];
        if (climb && pn === 'vehicle') continue;
        var cost = (gv === 1 ? P.road : P.ground) * (L.bridges[v] ? 1.15 : 1) * (L.ice[v] ? 0.85 : 1);
        if (climb) cost += 2.2;
        if (L.drift[v]) cost += (pn === 'vehicle' ? 0.2 : 0.45) * L.drift[v] * (1 - (G.dtrail[v] || 0) * 0.7);
        if (L.bush[v]) cost += pn === 'sneak' ? -0.25 : pn === 'vehicle' ? 0.8 : 0.4;
        cost += danger[v] * P.danger * 0.6;
        if (G.traps[v]) cost += P.trap;
        if (G.barricades[v]) cost += P.bar;
        if (gv === 4) cost += pn === 'vehicle' ? 7 : 2.2;
        if (Z.hk.navCost) cost += Z.hk.navCost(v, nc, nr, pn);
        var nd = dist[u] + cost;
        if (nd < dist[v]) { dist[v] = nd; heapPush(hp, [nd, v]); }
      }
    }
    G.nav[pn] = dist;
  }
  G.navTgt = t; G.navDirty = false; G.navVer = (G.navVer || 0) + 1; G.navT = G.t;
}
Z.buildNav = buildNav;
function profileOf(e) {
  var et = Z.ENEMIES[e.type];
  if (et.prof === 'walk' && e.smart) return 'walk2';
  return et.prof || 'walk';
}
// путь от клетки до цели по профилю — для стрелок-подсказок
Z.tracePath = function (c, r, prof) {
  var G = Z.G, L = G.L, d = G.nav && G.nav[prof || 'walk'], out = [[c, r]];
  if (!d) return out;
  for (var s = 0; s < 80; s++) {
    var cur = d[r * L.W + c], best = cur, bc = -1, br = -1;
    for (var k = 0; k < 4; k++) {
      var nc = c + (k === 0 ? 1 : k === 1 ? -1 : 0), nr = r + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nc < 0 || nr < 0 || nc >= L.W || nr >= L.H) continue;
      var v = d[nr * L.W + nc]; if (v < best) { best = v; bc = nc; br = nr; }
    }
    if (bc < 0) break;
    c = bc; r = br; out.push([c, r]);
    if (best === 0) break;
  }
  return out;
};
function nextCell(e) {
  var G = Z.G, L = G.L, pf = profileOf(e), d = G.nav[pf];
  var c = Math.floor(e.x), r = Math.floor(e.y);
  if (c < 0 || r < 0 || c >= L.W || r >= L.H) return null;
  var cur = d[r * L.W + c], best = Infinity, bc = null;
  for (var k = 0; k < 4; k++) {
    var nc = c + (k === 0 ? 1 : k === 1 ? -1 : 0), nr = r + (k === 2 ? 1 : k === 3 ? -1 : 0);
    if (nc < 0 || nr < 0 || nc >= L.W || nr >= L.H) continue;
    var cl = L.hgt[nr][nc] !== L.hgt[r][c];
    if (cl && pf === 'vehicle') continue;
    var v = d[nr * L.W + nc] + e.bias[k] + (cl ? 2.2 : 0);
    if (v < best) { best = v; bc = [nc, nr]; }
  }
  if (!bc || (cur !== Infinity && best - 0.8 > cur && cur < Infinity && cur > 0 && best === Infinity)) return null;
  return bc;
}

// ---------- ВРАГИ ----------
function spawn(type, pathIdx, hpMul, opts) {
  var G = Z.G, L = G.L, et = Z.ENEMIES[type];
  var ent = L.entrances[pathIdx % L.entrances.length];
  var e = {
    type: type, hp: et.hp * hpMul * (G.weaker ? 0.75 : 1) * (Z.assist ? Z.assist(G) : 1), armor: et.armor * (1 + G.info.region * 0.05), spd: et.spd, air: !!et.air, vehicle: !!et.vehicle,
    boss: !!et.boss, size: et.size, slow: 0, slowT: 0, stun: 0, dead: false, walk: Math.random() * 6, hitT: 0, ph: Math.random() * 6,
    abil: 4, age: 0, lane: (Math.random() - 0.5) * 0.3, id: Math.random(), x: ent[0] + 0.5, y: ent[1] + 0.5, dleft: 99, atkCd: 0, throws: 0, moved: 0,
    bias: [Math.random() * 0.35, Math.random() * 0.35, Math.random() * 0.35, Math.random() * 0.35], smart: Math.random() < 0.4, voiceT: 1 + Math.random() * 4
  };
  // входы за краем поля: сдвигаем снаружи внутрь
  if (ent[1] === 0) e.y = -0.3; else if (ent[0] === 0) e.x = -0.3; else if (ent[0] === L.W - 1) e.x = L.W + 0.3; else if (ent[1] === L.H - 1) e.y = L.H + 0.3;
  if (e.boss && !G.endless && G.info.region === 3) e.hp *= 0.55; // перевал: на большой карте с 3 входами босс иначе выбивается из плавной кривой
  if (G.mut && !e.boss) { e.spd *= G.mut.spd; e.armor += G.mut.armor; }
  if (opts && opts.elite) { e.hp *= 3; e.size *= 1.22; e.armor += 2; e.elite = true; delete opts.elite; }
  e.max = e.hp;
  if (opts) for (var k in opts) e[k] = opts[k];
  G.enemies.push(e);
  if (e.boss) {
    G.slowT = 1.6; G.shake = 0.5; G.flash = 0.3;
    G.banner = { text: Z.T('bn_' + type), sub: Z.T('boss'), t: 2.8, boss: true, big: true };
    Z.AU.sting('boss'); Z.AU.sfx('gong', 1); Z.AU.sfx('timproll', 0.8);
  }
  if (Z.AU.voice && !opts) Z.AU.voice(type, 'spawn');
  if (!Z.save.seen['e_' + type]) { Z.save.seen['e_' + type] = 1; Z.ui && Z.ui.intro && Z.ui.intro({ kind: 'enemy', id: type }); }
  return e;
}
Z.spawn = spawn;
Z._ = {};
function spawnAt(type, x, y, hpMul) { var m = spawn(type, 0, hpMul, { x: x + (Math.random() - 0.5) * 0.4, y: y + (Math.random() - 0.5) * 0.4 }); return m; }

function speedMod(e, pos) {
  var G = Z.G, k = 1, L = G.L;
  var c = Math.floor(pos.x), r = Math.floor(pos.y), ck = key(c, r);
  if (!e.air && L.grid[r] && L.grid[r][c] !== undefined) {
    if (L.ice[ck] || L.grid[r][c] === 5) k *= 1.4;
    if (L.bridges[ck]) k *= 0.75;
    if (L.grid[r][c] !== 1 && !e.vehicle) k *= 0.9;
    if (L.grid[r][c] === 4 && !L.bridges[ck]) k *= e.vehicle ? 0.6 : 0.55;   // 2.12.32: вброд по воде — вдвое медленнее (было почти как по снегу)
    var tr = G.traps[ck]; if (tr && tr.type === 'puddle') k *= 0.45;
    if (L.drift[ck]) k *= e.vehicle ? 0.9 : 1 - 0.14 * L.drift[ck] * (1 - (G.dtrail[ck] || 0) * 0.7);
    if (L.bush[ck] && !e.vehicle) k *= 0.8;
    if (e.climbing) k *= 0.6;
  }
  var res = Z.ENEMIES[e.type].slowResist || 0;
  var sl = Math.max(e.slow, G.blizT > 0 || G.adBliz ? 0.5 : 0);
  k *= 1 - sl * (1 - res);
  return Z.hk.speed ? Z.hk.speed(e, pos, k) : k;
}
function nearestTower(x, y, r) {
  var G = Z.G, best = null, bd = r * r;
  for (var k in G.towers) { var tw = G.towers[k], dx = tw.c + 0.5 - x, dy = tw.r + 0.5 - y, d = dx * dx + dy * dy; if (d <= bd) { bd = d; best = tw; } }
  return best;
}
Z.damageTower = function (tw, amt) {
  var G = Z.G; if (!G.towers[key(tw.c, tw.r)]) return;
  tw.hp -= amt; tw.hitT = 0.15;
  if (tw.hp <= 0) {
    delete G.towers[key(tw.c, tw.r)]; Z.navDirty(); Z.stat('towersLost');
    var ctw = {}; for (var q in tw) ctw[q] = tw[q]; ctw.hp = ctw.max; ctw.hitT = 0; ctw.build = 0; G.fx.push({ k: 'collapse', x: tw.c + 0.5, y: tw.r + 0.66 - (tw.high ? 0.32 : 0), tw: ctw, dir: Math.random() < 0.5 ? -1 : 1, t: 0, dur: 0.7 });
    var salv = Math.round(tw.spent * 0.3); G.coins += salv; addText('+' + salv, tw.c + 0.5, tw.r + 0.4, '#ffd54a', 1.2);
    G.decals.push({ k: 'rubble', x: tw.c + 0.5, y: tw.r + 0.6, s: 1, rot: Math.random() * 6, col: Z.TOWERS[tw.type].col });
    G.fx.push({ k: 'boom', x: tw.c + 0.5, y: tw.r + 0.4, t: 0, dur: 0.6 }); G.fx.push({ k: 'ring', x: tw.c + 0.5, y: tw.r + 0.5, r: 1.2, t: 0, dur: 0.5, col: '#ffd9a0' });
    debris(tw.c + 0.5, tw.r + 0.3, 10, ['#8a5a35', '#c9d6ea', '#ffffff', Z.TOWERS[tw.type].col]);
    G.shake = Math.max(G.shake, 0.35); Z.AU.boom(1.2); Z.AU.sfx('crack', 1);
    addText(Z.T('towerLost'), tw.c + 0.5, tw.r - 0.2, '#ff7a7a', 1.4, 1);
    if (Z.ui && Z.ui.sel === tw) Z.ui.sel = null;
  }
};
// поведение «нападающих»: бьют вышки рядом, метатели кидают снежки, вороны сбрасывают бомбы
function attackBehaviour(e, pos, dt) {
  var G = Z.G, et = Z.ENEMIES[e.type], role = et.role;
  e.atkCd -= dt;
  if (role === 'melee') {
    if (e.aggro === undefined) e.aggro = e.boss || Math.random() < 0.6;
    if (e.atkTime > 5) { if (e.moved > 2) { e.atkTime = 0; e.moved = 0; } else return false; }
    var tw = e.aggro ? nearestTower(pos.x, pos.y, 1.05 + e.size * 0.15) : null;
    if (tw) {
      e.atkTime = (e.atkTime || 0) + dt;
      if (e.atkCd <= 0) { e.atkCd = et.atkRate || 1; Z.damageTower(tw, et.tdmg * Math.pow(G.waveMul, 0.5) * 0.45); e.lunge = 0.2; G.fx.push({ k: 'spark', x: tw.c + 0.5, y: tw.r + 0.3, t: 0, dur: 0.25 }); if (!(Z.meleeSnd && Z.meleeSnd(e))) { Z.AU.sfx('crack', 0.35, { gap: 0.1 }); Z.AU.sfx('bd2', 0.4, { pitch: 0.7, gap: 0.1 }); } if (Z.AU.voice) Z.AU.voice(e.type, 'attack'); }
      e.dir = tw.c + 0.5 > pos.x ? 1 : -1; e.walk += dt * 2;
      return true;
    }
  } else if (role === 'ranged') {
    if (e.throws < 3) {
      var tw2 = nearestTower(pos.x, pos.y, 2.3);
      if (tw2) {
        if (e.atkCd <= 0) { e.atkCd = 1.5; e.throws++; e.lunge = 0.25; G.shots.push({ k: 'esnow', x: pos.x, y: pos.y - 0.3, x0: pos.x, y0: pos.y - 0.3, tx: tw2.c + 0.5, ty: tw2.r + 0.3, t: 0, dur: 0.6, tw: tw2, dmg: et.tdmg * Math.pow(G.waveMul, 0.5) * 0.55 }); Z.AU.sfx('back', 0.35, { pitch: 0.8, gap: 0.1 }); if (Z.AU.voice) Z.AU.voice(e.type, 'attack'); }
        e.dir = tw2.c + 0.5 > pos.x ? 1 : -1;
        return true;
      }
    } else if (e.moved > 2.5) { e.throws = 0; e.moved = 0; }
  } else if (role === 'bomber') {
    var tw3 = nearestTower(pos.x, pos.y, 0.6);
    if (tw3 && e.atkCd <= 0) { e.atkCd = 2.5; G.shots.push({ k: 'ebomb', x: pos.x, y: pos.y - 1.3, x0: pos.x, y0: pos.y - 1.3, tx: tw3.c + 0.5, ty: tw3.r + 0.4, t: 0, dur: 0.5, tw: tw3, dmg: et.tdmg * Math.pow(G.waveMul, 0.5) * 0.55 }); Z.AU.whistle(); }
  }
  return false;
}
function updateEnemies(dt) {
  var G = Z.G, L = G.L;
  if (!G.nav || (G.navDirty && G.t - (G.navT === undefined ? -9 : G.navT) > 0.2)) buildNav();
  if (L.type === 'escort') { var nt = navTarget(); if (nt[1] * L.W + nt[0] !== G.navTgt) buildNav(); }
  (G.squad || []).forEach(function (U) { U.blockN = 0; });
  for (var i = 0; i < G.enemies.length; i++) {
    var e = G.enemies[i];
    if (e.dead) continue;
    if (e.age !== undefined) e.age += dt; e.hitT = Math.max(0, e.hitT - dt); e.lunge = Math.max(0, (e.lunge || 0) - dt); e.kb = Math.max(0, (e.kb || 0) - dt);
    if (e.dmgAcc) { e.dmgT = (e.dmgT || 0) - dt; if (e.dmgT <= 0) { if (G.texts.filter(function (q) { return q.dmg; }).length < 7 || e.crit) addText(Math.round(e.dmgAcc) + '', e.x + (Math.random() - 0.5) * 0.3, e.y - 0.45 * e.size, e.crit ? '#ffcf4a' : '#ffffff', 0.55, e.crit ? 0.7 : 0.46, true); e.dmgAcc = 0; e.crit = false; e.dmgT = 0.7; } }
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slow = 0; }
    e.voiceT -= dt; if (e.voiceT <= 0) { e.voiceT = 4 + Math.random() * 6; if (Z.AU.voice && Math.random() < 0.6) Z.AU.voice(e.type, 'idle'); }
    if (e.stun > 0) { e.stun -= dt; if (e.stun <= 0) e.sleep = false; continue; }
    var pos = { x: e.x, y: e.y }, v = e.spd * speedMod(e, pos);
    if (Z.hk.enemy && Z.hk.enemy(e, dt, v)) continue;
    e.walk += dt * (4 + v * 6);
    // способности боссов
    if (e.boss) {
      e.abil -= dt;
      if (!e.enraged && e.hp < e.max * 0.5) {
        e.enraged = true; e.spd *= 1.4; e.abil = Math.min(e.abil, 1);
        G.banner = { text: Z.T('enrage'), t: 1.8, boss: true, big: true }; G.shake = 0.6; G.slowT = 0.8;
        Z.AU.sting('boss'); Z.AU.sfx('crash', 0.9); Z.AU.sfx('anvil', 0.6); if (Z.AU.voice) Z.AU.voice(e.type, 'attack');
      }
      if (e.abil <= 0) {
        var ek = e.enraged ? 0.65 : 1;
        if (Z.AU.voice) Z.AU.voice(e.type, 'attack');
        if (e.type === 'witch') {
          e.abil = 7.5 * (e.enraged ? 0.8 : 1);
          for (var wk in G.towers) { var wt = G.towers[wk], wx = wt.c + 0.5 - pos.x, wy = wt.r + 0.5 - pos.y; if (wx * wx + wy * wy < 4) wt.stun = 1.5; }
          G.fx.push({ k: 'frost', x: pos.x, y: pos.y, r: 2, t: 0, dur: 0.7 }); G.fx.push({ k: 'ring', x: pos.x, y: pos.y, r: 2, t: 0, dur: 0.6, col: '#a7e0ff' });
          for (var wq = 0; wq < 2; wq++) spawnAt('icicle', pos.x, pos.y, G.waveMul * 0.7);
          Z.AU.sfx('freeze', 1); Z.AU.sfx('swell', 0.6);
        } else if (e.type === 'giant') {
          e.abil = 6 * ek;
          for (var tk in G.towers) { var tw = G.towers[tk], dx = tw.c + 0.5 - pos.x, dy = tw.r + 0.5 - pos.y; if (dx * dx + dy * dy < 4.5) { tw.stun = 1.6; Z.damageTower(tw, 25 * Math.pow(G.waveMul, 0.5) * 0.6); } }
          G.fx.push({ k: 'stomp', x: pos.x, y: pos.y, t: 0, dur: 0.6 }); G.decals.push({ k: 'crack', x: pos.x, y: pos.y, s: 1.6, rot: Math.random() * 6 });
          G.shake = 0.45; Z.AU.boom(1.4); Z.AU.sfx('crack', 0.6);
        } else {
          e.abil = 5 * ek;
          for (var q = 0; q < 2; q++) spawnAt('raccoon', pos.x, pos.y, G.waveMul * 0.8);
          Z.AU.sfx('anvil', 0.5);
        }
      }
    }
    if (e.air) {
      var tx, ty;
      if (L.type === 'escort') { var sp = Z.sleighPos(); tx = sp.x; ty = sp.y; } else { tx = L.fort[0] + 0.5; ty = L.fort[1] + 0.3; }
      attackBehaviour(e, pos, dt);
      var dx2 = tx - e.x, dy2 = ty - e.y, d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      e.dleft = d;
      if (d < 0.6) { e.busyT = 0.4; siege(e, dt); continue; }
      e.x += dx2 / d * v * dt; e.y += dy2 / d * v * dt; e.dir = dx2 > 0 ? 1 : -1;
      continue;
    }
    if (heroBlock(e, pos, dt)) { e.busyT = 0.4; continue; }
    // цель достигнута?
    if (L.type === 'escort') { var sp2 = Z.sleighPos(); if (Math.hypot(sp2.x - e.x, sp2.y - e.y) < 0.6) { e.busyT = 0.4; siege(e, dt, sp2); continue; } }
    else if (e.siege || (Math.abs(e.x - L.fort[0] - 0.5) < 0.7 && Math.abs(e.y - L.fort[1] - 0.5) < 0.75)) { e.busyT = 0.4; siege(e, dt); continue; }
    if (attackBehaviour(e, pos, dt)) { e.busyT = 0.4; continue; }
    if (Z.ENEMIES[e.type].role === 'builder' && builderBehaviour(e, pos, dt)) { e.busyT = 0.4; continue; }
    if (e.building && e.building.done) e.building = null;
    // бульдозер давит ловушки
    var ckey = key(Math.floor(e.x), Math.floor(e.y));
    if (ckey !== e.ck) { var ock = e.ck; e.ck = ckey; enterCell(e, ckey, ock); }
    var tl = ((L.hgt[Math.floor(e.y)] && L.hgt[Math.floor(e.y)][Math.floor(e.x)]) || 0) + (Z.liftAt && !e.air ? Z.liftAt(e.x, e.y) / 0.32 : 0); e.lift = (e.lift || 0) + (tl - (e.lift || 0)) * Math.min(1, dt * 6); e.climbing = Math.abs(tl - e.lift) > 0.1 && !(L.mtn && Z.mtnH && Z.mtnH(e.x, e.y) > 0.02);
    if (Z.ENEMIES[e.type].crush && G.traps[ckey]) { delete G.traps[ckey]; Z.navDirty(); puff(e.x, e.y, 8, 1); Z.AU.sfx('crack', 0.6); }
    // за краем — сначала заходим на поле
    var inside = e.x >= 0 && e.y >= 0 && e.x < L.W && e.y < L.H, tc;
    if (!inside) { var ce = L.entrances.reduce(function (a, b) { return Math.hypot(a[0] + 0.5 - e.x, a[1] + 0.5 - e.y) < Math.hypot(b[0] + 0.5 - e.x, b[1] + 0.5 - e.y) ? a : b; }); tc = ce; }
    else {
      if (!e.tc || e.navVer !== G.navVer || (Math.floor(e.x) === e.tc[0] && Math.floor(e.y) === e.tc[1] && Math.hypot(e.tc[0] + 0.5 - e.x, e.tc[1] + 0.5 - e.y) < 0.25)) {
        var nc = nextCell(e); if (nc) { e.tc = nc; e.navVer = G.navVer; }
      }
      tc = e.tc;
    }
    if (!tc) continue;
    // баррикада впереди
    var bar = G.barricades[key(tc[0], tc[1])];
    var gx = tc[0] + 0.5, gy = tc[1] + 0.5;
    if (bar && Math.hypot(gx - e.x, gy - e.y) < 0.85) { e.busyT = 0.4; attackBarricade(e, bar, dt); continue; }
    // смещение по полосе — перпендикулярно движению
    var mx = gx - e.x, my = gy - e.y, md = Math.sqrt(mx * mx + my * my) || 1;
    var lx = -my / md * e.lane, ly = mx / md * e.lane;
    var ax = gx + lx * 0.6 - e.x, ay = gy + ly * 0.6 - e.y, ad = Math.sqrt(ax * ax + ay * ay) || 1;
    var step = Math.min(ad, v * dt);
    e.x += ax / ad * step; e.y += ay / ad * step; e.moved += step;
    if (Math.abs(ax) > 0.05) e.dir = ax > 0 ? 1 : -1;
    var dd = G.nav[profileOf(e)][key(tc[0], tc[1])];
    e.dleft = (dd === Infinity ? 99 : dd) + md;
    // следы на снегу
    e.trail = (e.trail || 0) - step; if (e.trail <= 0 && G.decals.length < 400) { e.trail = e.vehicle ? 0.25 : 0.45; G.decals.push({ k: e.vehicle ? 'track' : 'step', x: e.x, y: e.y + 0.1, s: e.size, rot: Math.atan2(ay, ax), life: 8 }); }
    // ловушки
    trapStep(e, ckey, dt);
  }
  if (G.enemies.length > 120) G.enemies = G.enemies.filter(function (e) { return !e.dead; });
}
// физика кустов и сугробов
function enterCell(e, k, prev) {
  var G = Z.G, L = G.L;
  if (L.bush[k]) { var s = G.sway[k] || (G.sway[k] = { a: 0, v: 0 }); s.v += (e.dir || 1) * (2 + e.size * 2); if (Math.random() < 0.5) snowPuff(k % L.W + 0.5, Math.floor(k / L.W) + 0.3, 4); }
  if (L.drift[k]) {
    G.dtrail[k] = Math.min(1, (G.dtrail[k] || 0) + (e.vehicle ? 0.35 : 0.12)); Z.navDirty();
    if (e.vehicle) { L.drift[k] -= Z.ENEMIES[e.type].crush ? 3 : 0.5; snowPuff(k % L.W + 0.5, Math.floor(k / L.W) + 0.5, 8); if (L.drift[k] <= 0) { delete L.drift[k]; delete G.dtrail[k]; } }
  }
}
function snowPuff(x, y, n) { var G = Z.G; if (G.fx.length > 420) return; for (var i = 0; i < n; i++) G.fx.push({ k: 'p', x: x + (Math.random() - 0.5) * 0.4, y: y + (Math.random() - 0.5) * 0.2, vx: (Math.random() - 0.5) * 1.6, vy: -0.6 - Math.random() * 1.2, t: 0, dur: 0.5 + Math.random() * 0.4, r: 0.04 + Math.random() * 0.05 }); }
Z.snowPuff = snowPuff;
function terrainBlast(x, y, r, big) {
  var G = Z.G, L = G.L, rr = Math.ceil(r + 1), c0 = Math.floor(x), r0 = Math.floor(y);
  for (var ty = r0 - rr; ty <= r0 + rr; ty++) for (var tx = c0 - rr; tx <= c0 + rr; tx++) {
    if (tx < 0 || ty < 0 || tx >= L.W || ty >= L.H) continue;
    var k = ty * L.W + tx, dx = tx + 0.5 - x, dy = ty + 0.5 - y, d2 = dx * dx + dy * dy;
    if (L.bush[k]) {
      var s = G.sway[k] || (G.sway[k] = { a: 0, v: 0 }); s.v += (dx >= 0 ? 1 : -1) * 9 / (0.5 + d2);
      if (d2 <= r * r * 0.6 && Math.random() < (big ? 0.6 : 0.25)) { delete L.bush[k]; debris(tx + 0.5, ty + 0.4, 6, ['#2f8f5b', '#257a4c', '#ffffff']); Z.navDirty(); }
      else if (d2 <= r * r * 2) snowPuff(tx + 0.5, ty + 0.3, 3);
    }
    if (L.grid[ty][tx] === 8 && d2 <= (r + 0.4) * (r + 0.4) && !(L.houses && L.houses.some(function (h) { return h.c === tx && h.r === ty; }))) {
      G.houseHp = G.houseHp || {}; G.houseHp[k] = (G.houseHp[k] === undefined ? 3 : G.houseHp[k]) - (big ? 2 : 1);
      debris(tx + 0.5, ty + 0.2, 4, ['#c58a55', '#d33a3a', '#ffffff']);
      if (G.houseHp[k] <= 0) { L.grid[ty][tx] = 10; G.fieldDirty = true; Z.navDirty(); G.decals.push({ k: 'rubble', x: tx + 0.5, y: ty + 0.6, s: 1.3, rot: Math.random() * 6, col: '#c58a55' }); debris(tx + 0.5, ty + 0.2, 12, ['#c58a55', '#8a5a35', '#d33a3a', '#ffffff']); G.fx.push({ k: 'boom', x: tx + 0.5, y: ty + 0.3, t: 0, dur: 0.6 }); G.fires = G.fires || []; G.fires.push({ x: tx + 0.5, y: ty + 0.5, t: 12, spread: 1 }); Z.AU.sfx('crack', 1); Z.AU.boom(1.1); Z.stat('housesDown'); }
    }
    if (L.drift[k] && d2 <= r * r) { L.drift[k] -= big ? 2 : 1; snowPuff(tx + 0.5, ty + 0.5, 10); if (L.drift[k] <= 0) { delete L.drift[k]; delete G.dtrail[k]; } Z.navDirty(); }
  }
}
Z.terrainBlast = terrainBlast;
function updateSway(dt) {
  var G = Z.G;
  for (var k in G.sway) { var s = G.sway[k]; s.v += -s.a * 40 * dt; s.v *= Math.pow(0.04, dt); s.a += s.v * dt; if (Math.abs(s.a) < 0.002 && Math.abs(s.v) < 0.01) delete G.sway[k]; }
}
// ---------- ПОСТРОЙКИ ВРАГОВ ----------
// частокол и дозорные вышки у их входов, снеговики-часовые от Лепил: рядом нельзя строить, вышка врага ослабляет наши
Z.STRUCT = { palisade: { hp: 90, zone: 1.5 }, watch: { hp: 140, zone: 1.6, aura: 2.6 }, sentry: { hp: 70, zone: 1.6 } };
function freeGroundNear(c, r, rad, avoid) {
  var G = Z.G, L = G.L, out = [];
  for (var dr = -rad; dr <= rad; dr++) for (var dc = -rad; dc <= rad; dc++) {
    var cc = c + dc, rr = r + dr; if (cc < 0 || rr < 0 || cc >= L.W || rr >= L.H) continue;
    var k = rr * L.W + cc;
    if (L.grid[rr][cc] !== 0 || L.bush[k] || L.drift[k] || G.towers[k] || G.traps[k] || (avoid && avoid[k])) continue;
    if (L.fort && Math.abs(cc - L.fort[0]) <= 2 && rr >= L.fort[1] - 2) continue;
    if (G.structs.some(function (s) { return s.c === cc && s.r === rr; })) continue;
    out.push([cc, rr]);
  }
  return out;
}
Z.addStruct = function (type, c, r, buildDur) {
  var G = Z.G, sc = Math.pow(Z.hpScale(G.idx), 0.8), s = { type: type, c: c, r: r, hp: Z.STRUCT[type].hp * sc, max: Z.STRUCT[type].hp * sc, hitT: 0, rise: 0, prog: buildDur ? 0 : 1, dur: buildDur || 0, done: !buildDur };
  if (buildDur) s.hp = s.max * 0.3;
  G.structs.push(s); Z.navDirty(); puff(c + 0.5, r + 0.5, 8, 1);
  return s;
};
Z._growBase = function (G) { return growEnemyBase(G); };
function growEnemyBase(G) {
  var rnd = Math.random, step = G.baseBuilt++;
  G.L.entrances.forEach(function (en, i) {
    var opts = freeGroundNear(en[0], en[1], 2); if (!opts.length) return;
    var o = opts[Math.floor(rnd() * opts.length)];
    var type = step === 0 ? 'palisade' : (step === 1 && G.idx >= 8 && i === 0) || (step >= 2 && G.idx >= 15) ? 'watch' : 'palisade';
    Z.addStruct(type, o[0], o[1], 2.5 + i * 0.6);
  });
}
function buildEnemyBase(G) {
  G.structs = [];
  if (G.idx < 4 || G.L.type === 'escort') return;
  var rnd = Z.rng(500 + G.idx);
  G.L.entrances.forEach(function (en, i) {
    var opts = freeGroundNear(en[0], en[1], 2);
    opts.sort(function () { return rnd() - 0.5; });
    var n = G.idx >= 15 ? 2 : 1;
    for (var q = 0; q < n && q < opts.length; q++) Z.addStruct('palisade', opts[q][0], opts[q][1]);
    if (G.idx >= 8 && opts.length > n && (i === 0 || G.idx >= 20)) Z.addStruct('watch', opts[n][0], opts[n][1]);
  });
  G.structs.forEach(function (s) { s.rise = 0; });
}
Z.damageStruct = function (s, amt) {
  var G = Z.G; if (s.dead) return;
  s.hp -= amt; s.hitT = 0.15;
  if (s.hp <= 0) {
    s.dead = true; G.structs = G.structs.filter(function (q) { return !q.dead; }); Z.navDirty();
    debris(s.c + 0.5, s.r + 0.3, 10, ['#bfe6ff', '#8fd0f0', '#3d4256', '#ffffff']); G.fx.push({ k: 'ring', x: s.c + 0.5, y: s.r + 0.5, r: 1.4, t: 0, dur: 0.5, col: '#bfe6ff' });
    G.decals.push({ k: 'planks', x: s.c + 0.5, y: s.r + 0.5, s: 1, rot: Math.random() * 6 });
    var bonus = Math.round(15 + G.idx * 1.5); G.coins += bonus; addText('+' + bonus, s.c + 0.5, s.r, '#ffd54a', 1.2);
    Z.AU.sfx('crack', 1); Z.AU.sfx('ice', 0.6); Z.stat('structsDown');
    if (Z.ui && Z.ui.menu && Z.ui.menu.st === s) Z.ui.menu = null;
  }
};
Z.inEnemyZone = function (c, r) {
  var G = Z.G, L = G.L;
  for (var e = 0; e < L.entrances.length; e++) if (Math.max(Math.abs(L.entrances[e][0] - c), Math.abs(L.entrances[e][1] - r)) <= 1) return true;
  for (var i = 0; i < (G.structs || []).length; i++) { var s = G.structs[i], dx = s.c - c, dy = s.r - r; if (s.done && dx * dx + dy * dy <= Z.STRUCT[s.type].zone * Z.STRUCT[s.type].zone) return true; if (dx === 0 && dy === 0) return true; }
  return false;
};
Z.structAt = function (c, r) { var G = Z.G; for (var i = 0; i < (G.structs || []).length; i++) if (G.structs[i].c === c && G.structs[i].r === r) return G.structs[i]; return null; };
Z.watchSlow = function (tw) {
  var G = Z.G, k = 1;
  for (var i = 0; i < (G.structs || []).length; i++) { var s = G.structs[i]; if (s.type !== 'watch' || !s.done) continue; var dx = s.c - tw.c, dy = s.r - tw.r; if (dx * dx + dy * dy <= 6.8) k = 0.7; }
  return k;
};
// Лепила: катает ком из сугроба — строит часового или скатывает ком в вышку
function builderBehaviour(e, pos, dt) {
  var G = Z.G, L = G.L;
  if (e.type === 'engineer') {
    if (e.building) { e.walk += dt * 6; e.lunge = (Math.sin(G.t * 12) > 0.6) ? 0.12 : e.lunge; if (e.building.done) { e.building = null; e.built = (e.built || 0) + 1; e.moved = 0; } return !!e.building; }
    if ((e.built || 0) < 2 && e.moved > 2.5 + (e.built || 0) * 3 && e.dleft > 4 && G.structs.length < 12) {
      var sp = freeGroundNear(Math.floor(pos.x), Math.floor(pos.y), 1);
      if (sp.length) { var c = sp[Math.floor(Math.random() * sp.length)]; e.building = Z.addStruct(Math.random() < 0.35 && G.idx >= 8 ? 'watch' : 'palisade', c[0], c[1], 3.2); e.building.by = e; if (Z.AU.voice) Z.AU.voice('sculptor', 'attack'); return true; }
    }
    return false;
  }
  if (e.rolling > 0) { e.rolling -= dt; e.ball = Math.min(1, (e.ball || 0) + dt / 2.2); e.walk += dt * 3; if (e.rolling <= 0) { e.carry = 1; } return true; }
  if (!e.carry) {
    var c = Math.floor(pos.x), r = Math.floor(pos.y);
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      var k = (r + dr) * L.W + (c + dc); if (r + dr < 0 || c + dc < 0 || r + dr >= L.H || c + dc >= L.W) continue;
      if (L.drift[k] >= 1 && !e.usedDrift) { L.drift[k] -= 1; if (L.drift[k] <= 0) { delete L.drift[k]; delete G.dtrail[k]; } Z.navDirty(); e.usedDrift = true; e.rolling = 2.2; e.ball = 0.1; snowPuff(c + dc + 0.5, r + dr + 0.5, 6); return true; }
    }
    return false;
  }
  var tw = nearestTower(pos.x, pos.y, 3.2);
  if (tw) {
    G.shots.push({ k: 'eball', x: pos.x, y: pos.y, x0: pos.x, y0: pos.y, tx: tw.c + 0.5, ty: tw.r + 0.5, t: 0, dur: Math.hypot(tw.c + 0.5 - pos.x, tw.r + 0.5 - pos.y) / 3, tw: tw, dmg: 45 * Math.pow(G.waveMul, 0.5) });
    e.carry = 0; e.ball = 0; e.lunge = 0.3; Z.AU.sfx('back', 0.5, { pitch: 0.5 }); if (Z.AU.voice) Z.AU.voice(e.type, 'attack');
    return true;
  }
  var spots = freeGroundNear(Math.floor(pos.x), Math.floor(pos.y), 1);
  if (spots.length && G.structs.length < 10) { var sp = spots[Math.floor(Math.random() * spots.length)]; Z.addStruct('sentry', sp[0], sp[1]); e.carry = 0; e.ball = 0; Z.AU.sfx('place', 0.6); return true; }
  return false;
}
// ---------- ЛОВУШКИ ----------
Z.TRAP_MAX = 6;
Z.canTrap = function (c, r) {
  var G = Z.G, L = G.L; if (c < 0 || r < 0 || c >= L.W || r >= L.H) return false;
  var v = L.grid[r][c], k = key(c, r);
  if (v !== 1 && v !== 0 && v !== 10) return false;
  if (G.towers[k] || G.traps[k] || G.barricades[k]) return false;
  if (L.fort && c === L.fort[0] && r === L.fort[1]) return false;
  return Object.keys(G.traps).length < Z.TRAP_MAX;
};
Z.canTrapCell = function (c, r) {
  var G = Z.G, L = G.L; if (c < 0 || r < 0 || c >= L.W || r >= L.H || L.grid[r][c] !== 1) return false;
  if (!Z.TRAP_ORDER.some(function (t) { return Z.trapUnlocked(t, G.idx); })) return false;
  var k = key(c, r); return !G.towers[k] && !G.traps[k] && !G.barricades[k] && !(L.fort && c === L.fort[0] && r === L.fort[1]);
};
Z.trapUnlocked = function (t, idx) { var u = Z.TRAPS[t].unlock; return idx >= u || (idx >= 3 && Z.save.stars[u] > 0); };
Z.buildTrap = function (type, c, r) {
  var G = Z.G, T = Z.TRAPS[type];
  if (G.coins < T.cost || !Z.canTrap(c, r)) return false;
  G.coins -= T.cost;
  G.traps[key(c, r)] = { type: type, c: c, r: r, uses: T.uses, cd: 0, t: 0 };
  Z.navDirty(); puff(c + 0.5, r + 0.5, 8, 0.8); Z.AU.sfx('place', 0.8); Z.AU.sfx('metal', 0.4, { pitch: 1.4 }); Z.stat('traps');
  return true;
};
function trapStep(e, ck, dt) {
  var G = Z.G, tr = G.traps[ck]; if (!tr || e.air) return;
  var T = Z.TRAPS[tr.type], sc = Math.pow(Z.hpScale(G.idx), 0.85);
  if (tr.type === 'spike') { if (tr.cd <= 0) { tr.cd = 0.45; damage(e, T.dmg * sc); tr.uses--; tr.t = 0.2; G.fx.push({ k: 'spark', x: e.x, y: e.y, t: 0, dur: 0.2 }); Z.AU.sfx('ice', 0.3, { gap: 0.1, pitch: 1.3 }); } }
  else if (tr.type === 'mine') { tr.boom = true; explode(tr.c + 0.5, tr.r + 0.5, 1.3, T.dmg * sc, false, true); tr.uses = 0; G.decals.push({ k: 'crater', x: tr.c + 0.5, y: tr.r + 0.5, s: 1.2, rot: Math.random() * 6 }); }
  else if (tr.type === 'snare') { if (tr.cd <= 0 && !e.boss) { tr.cd = 4.5; e.stun = Math.max(e.stun, 2.4); tr.uses--; tr.t = 0.4; Z.AU.sfx('metal', 0.8); Z.AU.sfx('crack', 0.3); } }
  if (tr.uses <= 0) { delete G.traps[ck]; Z.navDirty(); }
}
function updateTraps(dt) { var G = Z.G; for (var k in G.traps) { var tr = G.traps[k]; tr.cd -= dt; tr.t = Math.max(0, tr.t - dt); } }
function attackBarricade(e, b, dt) {
  var G = Z.G;
  b.hp -= Z.ENEMIES[e.type].bar * dt * (G.info.region * 0.25 + 1) * (Z.denNoBlock && Z.denNoBlock(b.c + 0.5, b.r + 0.5) ? 3 : 1);
  if (Z.ENEMIES[e.type].crush) b.hp = 0;   // 2.8.1: снегоуборщик сносит баррикаду с ходу
  b.hitT = 0.1;
  e.walk += dt * 3;
  if (b.hp <= 0) {
    delete G.barricades[key(b.c, b.r)]; Z.navDirty(); G.decals.push({ k: 'planks', x: b.c + 0.5, y: b.r + 0.5, s: 1, rot: Math.random() * 6 });
    puff(b.c + 0.5, b.r + 0.5, 16, 1.4); Z.AU.sfx('crack', 0.9); Z.AU.sfx('timp3', 0.4);
  }
}
// штурм: враг дошёл и бьёт крепость (или сани), пока его не уничтожат
function siege(e, dt, sp) {
  var G = Z.G, et = Z.ENEMIES[e.type];
  if (e.enterT > 0) {   // уходит в ворота: идёт к створкам и растворяется в проёме
    e.enterT -= dt; var gx = G.L.fort[0] + 0.5, gy = G.L.fort[1] + 0.35; e.x += (gx - e.x) * Math.min(1, dt * 3); e.y += (gy - e.y) * Math.min(1, dt * 3); e.walk += dt * 6; e.dir = gx > e.x ? 1 : -1;
    if (e.enterT <= 0) { e.dead = true; e.gone = true; }
    return;
  }
  if (Z.hk.siege && Z.hk.siege(e, dt, sp)) return;
  if (!e.siege) {
    e.siege = true; e.siegeCd = 0.3; e.siegeN = 0;
    // занимает место у стены, чтобы не стоять кучей в одной точке
    if (!sp && !e.air) { var a = (G.siegeSlot = ((G.siegeSlot || 0) + 1) % 7); e.sx = G.L.fort[0] + 0.5 + (a - 3) * 0.32; e.sy = G.L.fort[1] - 0.15 + (a % 2) * 0.2; }
  }
  if (sp) { e.x += (sp.x - e.x) * Math.min(1, dt * 3); e.y += (sp.y + 0.1 - e.y) * Math.min(1, dt * 3); }
  else if (e.sx !== undefined) { e.x += (e.sx - e.x) * Math.min(1, dt * 4); e.y += (e.sy - e.y) * Math.min(1, dt * 4); e.dir = G.L.fort[0] + 0.5 > e.x ? 1 : -1; }
  e.walk += dt * 1.5;
  e.siegeCd -= dt;
  if (e.siegeCd <= 0) {
    e.siegeCd = e.boss ? 1.6 : ((G.flow || 1) < (G.flow0 || 1) - 0.03 || G.hp < G.hpMax * 0.5) && !sp ? 2.1 : 1.6; e.siegeN++; e.lunge = 0.2;   // проигрывающему — удары реже
    var dmg = e.air ? et.dmg : Math.max(0.5, et.dmg * (e.boss ? 0.3 : 0.35));   // босс бьёт без конца — каждый удар слабее
    if (Z.hk.fortDmg) dmg = Z.hk.fortDmg(dmg, e);   // 2.12.35: режиссёр (v31a) — незаметная помощь в трудный момент
    if (G.L.type === 'escort') { G.sleigh.hp -= dmg; G.sleighHit = 0.4; }
    else {
      G.hp -= dmg; G.fortHit = 0.4; fortChunks(e.x, G.L.fort[1] + 0.2);
      var fs = G.hp / G.hpMax > 0.75 ? 0 : G.hp / G.hpMax > 0.5 ? 1 : G.hp / G.hpMax > 0.25 ? 2 : 3;
      if (fs > (G.fortStage || 0)) { G.fortStage = fs; G.shake = 0.6; Z.AU.boom(1.3); Z.AU.sfx('crack', 1); for (var o = 0; o < 6; o++) G.fx.push({ k: 'deb', x: G.L.fort[0] + 0.5 + (Math.random() - 0.5) * 1.2, y: G.L.fort[1] - 1.8, vx: (Math.random() - 0.5) * 2, vy: -1 - Math.random(), rot: 0, vr: 6, s: 0.07, col: ['#ff5a5f', '#ffd54a', '#5ac8ff'][o % 3], t: 0, dur: 1.1 }); G.fx.push({ k: 'boom', x: G.L.fort[0] + 0.5, y: G.L.fort[1] - 0.4, t: 0, dur: 0.6 }); }
    }
    G.hpLost += dmg;
    G.shake = Math.max(G.shake, 0.15 + (e.boss ? 0.3 : 0));
    puff(e.x, e.y - 0.2, 5, 0.8);
    Z.AU.sfx('timp2', 0.55, { gap: 0.08 }); Z.AU.sfx('crack', 0.4, { gap: 0.08 }); if (Z.AU.voice) Z.AU.voice(e.type, 'attack');
    // выдохся: после нескольких ударов разбивается о стены
    // 2.10.4: стражи нет. Враг у ёлки бьёт 6 раз (если его не убили), потом пробирается в ворота крепости с подарком —
    // не «умирает сам», а уходит внутрь; урон за пропуск предсказуемый (енот −3, громила −6). У саней и у боссов — как раньше.
    var cap = e.boss ? 1e9 : e.air ? 1 : sp ? 4 : 6;   // 2.11.5: босс у ёлки не «выдыхается» — бьёт, пока его не одолеют
    if (e.siegeN >= cap) {
      if (!sp && !e.air && !e.boss && G.L.fort) { e.enterT = 0.9; e.siegeN = -99; G.gateT = 1.2; addText(Z.TT ? Z.TT('Пробрался в крепость!', 'Got into the fortress!') : '', e.x, e.y - 1.1, '#ff9a9a', 1, 0.6); G.fx.push({ k: 'giftfly', x: G.L.fort[0] + 0.5, y: G.L.fort[1] - 0.4, vx: (Math.random() - 0.5) * 2, vy: -3, rot: 0, vr: 8, col: '#e8484f', t: 0, dur: 1 }); }
      else { e.dead = true; puff(e.x, e.y, 12, e.size); debris(e.x, e.y - 0.2, 6, ['#ffffff', '#c9d6ea', '#8b93a7']); }
    }
  }
}
function fortChunks(x, y) {
  var G = Z.G; if (G.fx.length > 430) return;
  // подарки разлетаются от ударов по крепости
  if (Math.random() < 0.5) { var f = G.L.fort; G.fx.push({ k: 'giftfly', x: f[0] + 0.5 + (Math.random() - 0.5) * 0.8, y: f[1] - 0.2, vx: (Math.random() - 0.5) * 3, vy: -2.5 - Math.random() * 1.5, rot: 0, vr: (Math.random() - 0.5) * 10, col: ['#e8484f', '#4aa3ff', '#4cc77d', '#b77dff'][Math.floor(Math.random() * 4)], t: 0, dur: 1.1 }); }
  for (var i = 0; i < 4; i++) G.fx.push({ k: 'deb', x: x + (Math.random() - 0.5) * 0.6, y: y - 0.6, vx: (Math.random() - 0.5) * 2.5, vy: -1.5 - Math.random() * 1.5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12, s: 0.05 + Math.random() * 0.05, col: Math.random() < 0.5 ? '#dcecff' : '#a9c4e8', t: 0, dur: 0.8 });
}
// гарнизон крепости отстреливается от штурмующих
function updateGarrison(dt) {
  var G = Z.G; if (G.L.type === 'escort' || !Z.GARRISON) return;   // 2.10.2: стража у ёлки убрана — защищает только игрок
  G.garT = (G.garT || 0) - dt; if (G.garT > 0) return;
  var list = []; for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (!e.dead && e.siege) list.push(e); }
  if (!list.length) { G.garT = 0.2; return; }
  // 2.10: стража бьёт залпом — по нескольким сразу, каждый выстрел снимает не меньше 12% здоровья цели;
  // если игрок проигрывает, стража злее
  list.sort(function (a, b) { return a.hp - b.hp; });
  G.garT = 0.6;
  var f = G.L.fort, sc = Math.pow(Z.hpScale(G.idx), 0.9) * (1 + (Z.save.research.fort || 0) * 0.15), angry = (G.flow || 1) < (G.flow0 || 1) - 0.03 || G.hp < G.hpMax * 0.5 ? 1.4 : 1;
  var n = Math.min(4, 1 + Math.floor(list.length / 2));
  for (var q = 0; q < n && q < list.length; q++) { var tg = list[q]; G.shots.push({ k: 'snow', x: f[0] + 0.5 + (Math.random() - 0.5) * 1.6, y: f[1] - 0.6, tgt: tg, tx: tg.x, ty: tg.y, spd: 9, dmg: (tg.boss ? 9 * sc : Math.max(9 * sc, tg.max * 0.12 + tg.armor)) * angry, frozen: 1 }); }
  Z.AU.shot('snow');
}
function hitTarget(e) {
  var G = Z.G, dmg = Z.ENEMIES[e.type].dmg;
  e.dead = true;
  var p = Z.enemyPos(e);
  if (G.L.type === 'escort') { G.sleigh.hp -= dmg; G.sleighHit = 0.4; }
  else { G.hp -= dmg; G.fortHit = 0.4; }
  G.hpLost += dmg;
  G.shake = Math.max(G.shake, 0.2);
  puff(p.x, p.y, 10, 1.1);
  Z.AU.sfx('timp2', 0.8); Z.AU.sfx('crack', 0.5);
}

function damage(e, amt, opts) {
  if (e.dead) return 0;
  opts = opts || {};
  var G = Z.G; if (!G) return 0;   // 2.11.5: отложенный удар после выхода из боя (нашёл журнал ошибок)
  if (opts.vsVehicle && e.vehicle) amt *= opts.vsVehicle;
  if (opts.frozenBonus && (e.slow > 0 || G.blizT > 0)) amt *= opts.frozenBonus;
  if (G.diff === 'easy') amt *= 1.15;
  var real = opts.pierceArmor ? amt : Math.max(amt * 0.2, amt - e.armor);
  if (Z.hk.dmg) { real = Z.hk.dmg(e, real, opts); if (real <= 0) return 0; }
  e.hp -= real; e.hitT = 0.1;
  e.dmgAcc = (e.dmgAcc || 0) + real; if (amt >= 60) e.crit = true;
  if (!e.boss) e.kb = 0.15;
  if (e.hp <= 0) kill(e);
  return real;
}
Z.damage = damage;
function kill(e) {
  var G = Z.G;
  if (e.dead) return;
  e.dead = true;
  if (Z.hk.kill) Z.hk.kill(e);
  var et = Z.ENEMIES[e.type], p = Z.enemyPos(e);
  if (e.building && !e.building.done) e.building.stalled = true;
  var c = Math.round(et.coin * (1 + G.idx * 0.075) * (e.coinMul || 1));
  G.coins += c; G.kills++; Z.stat('kills');
  addText('+' + c, p.x, p.y - 0.5 * e.size, '#ffd54a');
  puff(p.x, p.y, 4 + Math.round(e.size * 3), e.size);
  // смерть у каждого своя
  if (!e.boss && G.fx.length < 430) {
    var T = e.type;
    if (T === 'icicle') debris(p.x, p.y - 0.2, 8, ['#dff6ff', '#8fd0f0', '#ffffff']);
    else if (e.vehicle) { G.fx.push({ k: 'wheel', x: p.x, y: p.y, vx: (e.dir || 1) * 1.6, vy: 0, t: 0, dur: 1.2, dir: e.dir || 1 }); }
    else { var ce = {}; for (var kk in e) ce[kk] = e[kk]; ce.dead = false; ce.slow = 0; G.fx.push({ k: 'corpse', x: p.x, y: p.y - (e.lift || 0) * 0.32, e: ce, t: 0, dur: e.air ? 0.8 : 0.6 }); }
  }
  if (e.boss) {
    G.shake = 0.9; G.flash = 0.6; G.slowT = 1.4; Z.stat('bossKills'); if (e.type === 'witch') Z.stat('witch');
    Z.AU.sfx('gong', 1); Z.AU.sfx('crash', 0.8); Z.AU.sfx('timproll', 0.7);
    for (var b = 0; b < 7; b++) G.fx.push({ k: 'boom', x: p.x + (Math.random() - 0.5) * 1.6, y: p.y + (Math.random() - 0.5) * 1.6, t: -b * 0.14, dur: 0.6 });
    G.fx.push({ k: 'ring', x: p.x, y: p.y, r: 3.2, t: 0, dur: 0.9, col: '#fff3c4' });
    debris(p.x, p.y, 14, ['#6b4a2f', '#c9d6ea', '#e8484f', '#ffd54a']);
  }
  else if (e.vehicle && !e.chained) { e.chained = true; G.pendingBlasts = G.pendingBlasts || []; G.pendingBlasts.push({ x: p.x, y: p.y, t: 0.12, r: 0.9 + e.size * 0.25, dmg: et.hp * 0.15 * (G.waveMul || 1) * 0.3 }); G.fx.push({ k: 'boom', x: p.x, y: p.y, t: 0, dur: 0.5 }); G.fx.push({ k: 'ring', x: p.x, y: p.y, r: 1.1, t: 0, dur: 0.4, col: '#ffe1a8' }); debris(p.x, p.y, 7, ['#6b4a2f', '#9a6a40', '#8090a8', '#d33a3a']); G.shake = Math.max(G.shake, 0.15); Z.AU.sfx('bd', 0.7, { pitch: 1.2 }); Z.AU.sfx('metal', 0.4); }
  else if (!(Z.AU.ownDie && Z.AU.ownDie(e.type))) Z.AU.pop();   // 2.11.5: у кого свой звук падения — без енотового «попа»
  if (Z.AU.voice) Z.AU.voice(e.type, 'die');
  if (et.splits) {
    for (var k = 0; k < 2; k++) {
      var kid = spawn('splitkid', 0, e.max / et.hp * 1, { x: p.x + (k ? 0.2 : -0.2), y: p.y });
      kid.lane = e.lane + (k ? 0.12 : -0.12);
    }
  }
}

function debris(x, y, n, cols) {
  var G = Z.G; if (G.fx.length > 450) return;
  for (var i = 0; i < n; i++) { var a = -Math.PI * Math.random(), sp = 1.5 + Math.random() * 2.5; G.fx.push({ k: 'deb', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, s: 0.06 + Math.random() * 0.08, col: cols[i % cols.length], t: 0, dur: 0.8 + Math.random() * 0.4 }); }
}
// ---------- ВЫШКИ ----------
// свободная стройка: любая свободная клетка земли (не дорога), кроме входов
var BUILD = { 0: 1, 3: 1, 10: 1 };
Z.canBuildAt = function (c, r) {
  var G = Z.G, L = G.L; if (c < 0 || r < 0 || c >= L.W || r >= L.H) return false;
  var v = L.grid[r][c], k = key(c, r);
  if (!BUILD[v] || G.towers[k] || G.traps[k] || L.bush[k] || L.drift[k]) return false;
  if (Z.inEnemyZone(c, r)) return false;
  return true;
};
Z.towerMaxHp = function (tw) { return Math.round((140 + 80 * (tw.lvl - 1)) * (1 + (Z.save.research.fort || 0) * 0.1) * (Z.G.info ? 1 + Z.G.info.region * 0.15 : 1)); };
Z.repairCost = function (tw) { return Math.max(5, Math.round(tw.spent * 0.35 * (1 - tw.hp / tw.max))); };
Z.repairTower = function (tw) { var G = Z.G, c = Z.repairCost(tw); if (tw.hp >= tw.max || G.coins < c) return false; G.coins -= c; tw.hp = tw.max; tw.pop = 0.3; Z.AU.sfx('tw_build', 0.55); puff(tw.c + 0.5, tw.r + 0.3, 8, 0.8); return true; };
Z.buildTower = function (type, c, r, lvl) {
  var G = Z.G, cost = Z.towerCost(type, lvl || 1);
  if (G.coins < cost || !Z.canBuildAt(c, r)) return false;
  G.coins -= cost;
  Z.stat('built');
  var ntw = G.towers[key(c, r)] = { type: type, lvl: lvl || 1, c: c, r: r, cd: 0.2, ang: -Math.PI / 2, mode: type === 'ballista' ? 'vehicle' : 'first', stun: 0, recoil: 0, pop: 0.3, spent: cost, spin: 0, hill: G.L.grid[r][c] === 3, hitT: 0 };
  ntw.max = ntw.hp = Z.towerMaxHp(ntw); Z.navDirty(); ntw.high = !!G.L.hgt[r][c]; ntw.build = 0.5;
  G.fx.push({ k: 'ring', x: c + 0.5, y: r + 0.6, r: 0.8, t: 0, dur: 0.35, col: '#ffffff' });
  puff(c + 0.5, r + 0.5, 10, 1); Z.AU.sfx('tw_build', 0.75);   // 2.11.5: один мягкий звук постройки (раньше три слоя: щелчок, «бух» и ещё раз щелчок)
  if (!Z.save.seen['t_' + type]) Z.save.seen['t_' + type] = 1;
  return true;
};
Z.upgradeTower = function (tw) {
  var G = Z.G;
  if (tw.lvl >= Z.TOWER_MAX) return false;
  var cost = Z.towerCost(tw.type, tw.lvl);
  if (G.coins < cost) return false;
  G.coins -= cost; tw.lvl++; tw.spent += cost; tw.pop = 0.4; var om = tw.max; tw.max = Z.towerMaxHp(tw); tw.hp = Math.min(tw.max, tw.hp + (tw.max - om)); Z.navDirty();
  G.fx.push({ k: 'star', x: tw.c + 0.5, y: tw.r + 0.2, t: 0, dur: 0.6 }); Z.AU.sfx('levelup', 0.9);
  return true;
};
Z.mergeTowers = function (a, b) {
  var G = Z.G;
  if (a === b || a.type !== b.type || a.lvl !== b.lvl || b.lvl >= Z.TOWER_MAX) return false;
  b.lvl++; b.spent += a.spent; b.pop = 0.45; Z.stat('merges'); b.max = Z.towerMaxHp(b); b.hp = b.max;
  delete G.towers[key(a.c, a.r)]; Z.navDirty();
  G.fx.push({ k: 'star', x: b.c + 0.5, y: b.r + 0.2, t: 0, dur: 0.6 }); puff(b.c + 0.5, b.r + 0.3, 14, 1.3);
  Z.AU.sfx('merge', 1); Z.AU.sfx('levelup', 0.6);
  return true;
};
Z.branchCost = function (type) { return Math.round(Z.TOWERS[type].cost * 5); };
Z.setBranch = function (tw, br) {
  var G = Z.G, cost = Z.branchCost(tw.type);
  if (tw.lvl < Z.TOWER_MAX || tw.branch || G.coins < cost) return false;
  G.coins -= cost; tw.spent += cost; tw.branch = br; tw.pop = 0.5; Z.stat('branches');
  G.fx.push({ k: 'ring', x: tw.c + 0.5, y: tw.r + 0.5, r: 1.2, t: 0, dur: 0.5, col: '#ffd54a' }); G.fx.push({ k: 'star', x: tw.c + 0.5, y: tw.r + 0.2, t: 0, dur: 0.8 });
  Z.AU.sfx('levelup', 1); Z.AU.sfx('gong', 0.5);
  return true;
};
Z.moveTower = function (a, c, r) {
  var G = Z.G;
  if (!Z.canBuildAt(c, r)) return false;
  delete G.towers[key(a.c, a.r)]; a.c = c; a.r = r; a.hill = G.L.grid[r][c] === 3; a.high = !!G.L.hgt[r][c]; G.towers[key(c, r)] = a; Z.navDirty();
  Z.AU.sfx('place', 0.7);
  return true;
};
Z.sellTower = function (tw) {
  var G = Z.G, back = Math.round(tw.spent * 0.7);
  G.coins += back; delete G.towers[key(tw.c, tw.r)]; Z.navDirty();
  addText('+' + back, tw.c + 0.5, tw.r + 0.2, '#ffd54a'); puff(tw.c + 0.5, tw.r + 0.5, 10, 1); Z.AU.sfx('coin', 0.8);
};
Z.BARRICADE_COST = 40;
// 2.12.34: баррикад до 8 (было жёстко 3 — и кнопка просто пропадала); каждая следующая дороже на 30 %
Z.BAR_MAX = 8;
Z.barCost = function () { var G = Z.G, n = G ? Object.keys(G.barricades).length : 0; return Math.round(Z.BARRICADE_COST * (1 + 0.3 * n) / 5) * 5; };
Z.canBarricade = function (c, r) {
  var G = Z.G, L = G.L;
  if (!L.grid[r] || !(L.grid[r][c] === 1 || L.grid[r][c] === 0 || L.grid[r][c] === 10) || G.barricades[key(c, r)] || G.towers[key(c, r)]) return false;   // 2.11.5: как ловушки — на любой проходимой земле, не только на дороге
  if (L.grid[r][c] !== 1 && Z.inEnemyZone && Z.inEnemyZone(c, r)) return false;
  if (Object.keys(G.barricades).length >= Z.BAR_MAX) return false;
  if (G.traps[key(c, r)]) return false;
  if (L.type === 'escort') {
    for (var i = 0; i < 2; i++) if (L.main[i][0] === c && L.main[i][1] === r) return false;
    if (L.main[L.main.length - 1][0] === c && L.main[L.main.length - 1][1] === r) return false;
    // не ставим на клетку, где стоят сани
    var sf = Math.round(G.sleigh.f), sc = L.main[sf];
    if (sc && sc[0] === c && sc[1] === r) return false;
    return true;
  }
  if (Math.abs(c - L.fort[0]) + Math.abs(r - L.fort[1]) <= 1) return false;
  for (var e = 0; e < L.entrances.length; e++) if (L.entrances[e][0] === c && L.entrances[e][1] === r) return false;
  return true;
};
Z.buildBarricade = function (c, r) {
  var G = Z.G;
  var bcost = Z.barCost();
  if (G.coins < bcost || !Z.canBarricade(c, r)) return false;
  G.coins -= bcost;
  var hp = 220 * (1 + G.idx * 0.12);
  G.barricades[key(c, r)] = { c: c, r: r, hp: hp, max: hp, hitT: 0 }; Z.navDirty();
  puff(c + 0.5, r + 0.5, 10, 1); Z.AU.sfx('tw_build', 0.7);
  return true;
};

function revealed(e) { var G = Z.G; return (G.squad || []).some(function (U) { return U.type === 'belka' && !U.dead && Math.hypot(U.x - e.x, U.y - e.y) < 3; }); }
function targetFor(tw, st) {
  var G = Z.G, best = null, bv = -1e9, cx = tw.c + 0.5, cy = tw.r + 0.5;
  var range = st.range * (tw.hill ? 1.25 : 1) * (tw.high ? 1.2 : 1) * (Z.hk.rangeMul ? Z.hk.rangeMul(tw) : 1), r2 = range * range, mn2 = st.minRange * st.minRange;
  var sp = G.sleigh ? Z.sleighPos() : null, LB = G.L.bush, LW = G.L.W;
  for (var i = 0; i < G.enemies.length; i++) {
    var e = G.enemies[i];
    if (e.dead || (e.air && !st.air)) continue;
    if (Z.hk.untargetable && Z.hk.untargetable(e)) continue;   // 2.8.4: за стенами логова не достать
    if (e.hideT > 0 && !revealed(e)) continue;
    var p = Z.enemyPos(e), dx = p.x - cx, dy = p.y - cy, d2 = dx * dx + dy * dy;
    if (d2 > r2 || d2 < mn2) continue;
    if (d2 > r2 * 0.36 && Z.hk.unseen && Z.hk.unseen(e)) continue;
    if (!e.air && !e.vehicle && !e.boss && LB[Math.floor(p.y) * LW + Math.floor(p.x)] && d2 > r2 * 0.42 && !revealed(e)) continue;
    var prog;
    if (sp) { var sx = p.x - sp.x, sy = p.y - sp.y; prog = -(sx * sx + sy * sy); }
    else prog = -e.dleft;
    var v;
    if (tw.mode === 'strong') v = e.hp * 1000 + prog;
    else if (tw.mode === 'close') v = -d2;
    else if (tw.mode === 'vehicle') v = (e.vehicle || e.boss ? 1e6 : 0) + prog;
    else v = prog;
    if (v > bv) { bv = v; best = e; }
  }
  return best;
}

function fire(tw, st, e) {
  var G = Z.G, p = Z.enemyPos(e), cx = tw.c + 0.5, cy = tw.r + 0.5 - 0.25;
  tw.ang = Math.atan2(p.y - cy, p.x - cx);
  tw.recoil = 0.12;
  var T = tw.type;
  if (T === 'snow' || T === 'mg') {
    G.shots.push({ k: T, x: cx, y: cy, tgt: e, tx: p.x, ty: p.y, spd: T === 'mg' ? 11 : 8, dmg: st.dmg * (st.airBonus && e.air ? st.airBonus : 1), frozen: T === 'mg' ? 2 : 1, splash: st.splash, big: !!tw.branch });
    if (T === 'mg') Z.AU.mg(); else Z.AU.shot('snow');
    G.fx.push({ k: 'flash', x: cx + Math.cos(tw.ang) * 0.3, y: cy + Math.sin(tw.ang) * 0.3, t: 0, dur: 0.08, r: T === 'mg' ? 0.16 : 0.22 });
    if (T === 'mg' && Math.random() < 0.5 && G.fx.length < 420) G.fx.push({ k: 'shell', x: cx, y: cy, vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random(), t: 0, dur: 0.5 });
  } else if (T === 'ice') {
    G.shots.push({ k: 'ice', x: cx, y: cy, tgt: e, tx: p.x, ty: p.y, spd: 6, dmg: st.dmg, splash: st.splash, slow: st.slow, slowT: st.slowT });
    Z.AU.shot('ice'); G.fx.push({ k: 'flash', x: cx + Math.cos(tw.ang) * 0.35, y: cy + Math.sin(tw.ang) * 0.35, t: 0, dur: 0.1, r: 0.3, col: '#bfefff' });
  } else if (T === 'mortar') {
    G.shots.push({ k: 'mortar', x: cx, y: cy, x0: cx, y0: cy, tgt: e, tx: p.x, ty: p.y, t: 0, dur: 0.85, dmg: st.dmg, splash: st.splash, cluster: st.cluster, big: tw.branch === 'b' });
    Z.AU.shot('mortar'); G.fx.push({ k: 'flash', x: cx, y: cy - 0.25, t: 0, dur: 0.12, r: 0.4 }); puff(cx, cy - 0.3, 4, 0.6);
  } else if (T === 'tesla') {
    var hit = [e], cur = e, pts = [{ x: cx, y: cy - 0.2 }, p];
    for (var c = 1; c < st.chain; c++) {
      var nb = null, nd = 2.4;
      for (var i = 0; i < G.enemies.length; i++) {
        var o = G.enemies[i]; if (o.dead || hit.indexOf(o) >= 0) continue;
        var op = Z.enemyPos(o), cp = Z.enemyPos(cur), d2 = (op.x - cp.x) * (op.x - cp.x) + (op.y - cp.y) * (op.y - cp.y);
        if (d2 < nd) { nd = d2; nb = o; }
      }
      if (!nb) break;
      hit.push(nb); pts.push(Z.enemyPos(nb)); cur = nb;
    }
    hit.forEach(function (h, idx) { damage(h, st.dmg * Math.pow(0.85, idx), { frozenBonus: 1.5 }); if (st.stunHit && !h.boss) h.stun = Math.max(h.stun, st.stunHit); });
    G.fx.push({ k: 'bolt', pts: pts, t: 0, dur: 0.18, seed: Math.random() * 100 });
    Z.AU.zap();
  } else if (T === 'ballista') {
    var ang = tw.ang, len = st.range * (tw.hill ? 1.25 : 1) + 1;
    var nb2 = st.multi || 1;
    for (var bi = 0; bi < nb2; bi++) G.shots.push({ k: 'bolt', x: cx, y: cy, ang: ang + (bi - (nb2 - 1) / 2) * 0.22, len: len, d: 0, spd: 12, dmg: st.dmg, vsVehicle: st.vsVehicle, hit: [], air: true, pierceArmor: st.pierceArmor });
    Z.AU.shot('ballista');
  }
}

function updateTowers(dt) {
  var G = Z.G, R = Z.save.research;
  for (var k in G.towers) {
    var tw = G.towers[k];
    tw.recoil = Math.max(0, tw.recoil - dt); tw.pop = Math.max(0, tw.pop - dt); if (tw.build > 0) { tw.build -= dt; if (tw.build <= 0) puff(tw.c + 0.5, tw.r + 0.6, 6, 0.7); } tw.hitT = Math.max(0, (tw.hitT || 0) - dt);
    if (tw.stun > 0) { tw.stun -= dt; continue; }
    var st = Z.towerStat(tw.type, tw.lvl, R, tw.branch);
    tw.cd -= dt * Z.watchSlow(tw);
    if (tw.type === 'mg') tw.spin += dt * (tw.firing ? 20 : 2);
    if (tw.cd <= 0) {
      var e = targetFor(tw, st);
      if (e) { if (Z.hk.towerFire) Z.hk.towerFire(tw, st, e, fire); else fire(tw, st, e); tw.cd += 1 / (st.rate * (Z.hk.towerRate ? Z.hk.towerRate(tw) : 1)); tw.firing = true; if (tw.cd < 0) tw.cd = 0; }   // 2.11.5: облики вышек
      else { tw.cd = 0.08; tw.firing = false; }
    }
  }
}

function updateShots(dt) {
  var G = Z.G;
  for (var i = G.shots.length - 1; i >= 0; i--) {
    var s = G.shots[i]; Z._shot = s;   // 2.11.5: чей снаряд попал — для свойств облика вышки
    if (s.k === 'ally') {
      s.t += dt; var ap = Math.min(1, s.t / s.dur); if (s.tgt && !s.tgt.dead) { s.tx = s.tgt.x; s.ty = s.tgt.y - 0.2; } s.x = s.x0 + (s.tx - s.x0) * ap; s.y = s.y0 + (s.ty - s.y0) * ap - Math.sin(ap * Math.PI) * 0.3; s.rot = (s.rot || 0) + dt * 14;
      if (ap >= 1 && Z.hk.allyHit && Z.hk.allyHit(s)) { G.shots.splice(i, 1); continue; }
      if (ap >= 1) { if (s.tgt && !s.tgt.dead && s.dmg) { damage(s.tgt, s.dmg, { frozenBonus: 1.2 }); if (s.slow && !s.tgt.boss) { s.tgt.slow = Math.max(s.tgt.slow, s.slow); s.tgt.slowT = Math.max(s.tgt.slowT, 1.2); } if (s.tgt.dead) { G.heroKills++; Z.stat('heroKills'); } } puff(s.tx, s.ty, 3, 0.5); G.shots.splice(i, 1); }
      continue;
    }
    if (s.k === 'eball') {
      s.t += dt; var bp = Math.min(1, s.t / s.dur); s.x = s.x0 + (s.tx - s.x0) * bp; s.y = s.y0 + (s.ty - s.y0) * bp; s.rot = (s.rot || 0) + dt * 8; s.pr = bp;
      if (bp >= 1) { Z.damageTower(s.tw, s.dmg); snowPuff(s.tx, s.ty, 14); G.shake = Math.max(G.shake, 0.2); Z.AU.boom(0.7); G.shots.splice(i, 1); }
      continue;
    }
    if (s.k === 'esnow' || s.k === 'ebomb') {
      s.t += dt; var ep = Math.min(1, s.t / s.dur);
      s.x = s.x0 + (s.tx - s.x0) * ep; s.y = s.y0 + (s.ty - s.y0) * ep - (s.k === 'esnow' ? Math.sin(ep * Math.PI) * 0.6 : 0); s.pr = ep;
      if (ep >= 1) { Z.damageTower(s.tw, s.dmg); puff(s.tx, s.ty, s.k === 'ebomb' ? 10 : 5, s.k === 'ebomb' ? 1 : 0.6); if (s.k === 'ebomb') { G.fx.push({ k: 'boom', x: s.tx, y: s.ty, t: 0, dur: 0.4 }); Z.AU.boom(0.8); } else Z.AU.sfx('tap', 0.4, { pitch: 0.6, gap: 0.05 }); G.shots.splice(i, 1); }
      continue;
    }
    if (s.k === 'bolt') {
      var step = s.spd * dt; s.d += step;
      s.x += Math.cos(s.ang) * step; s.y += Math.sin(s.ang) * step;
      for (var j = 0; j < G.enemies.length; j++) {
        var e = G.enemies[j]; if (e.dead || s.hit.indexOf(e) >= 0) continue;
        var p = Z.enemyPos(e), dx = p.x - s.x, dy = p.y - s.y;
        if (dx * dx + dy * dy < 0.2 * e.size + 0.1) { s.hit.push(e); damage(e, s.dmg, { vsVehicle: s.vsVehicle, pierceArmor: s.pierceArmor }); G.fx.push({ k: 'spark', x: p.x, y: p.y, t: 0, dur: 0.25 }); }
      }
      if (s.d >= s.len) G.shots.splice(i, 1);
      continue;
    }
    if (s.tgt && !s.tgt.dead) { var tp = Z.enemyPos(s.tgt); s.tx = tp.x; s.ty = tp.y; }
    if (s.k === 'mortar') {
      s.t += dt; var pr = Math.min(1, s.t / s.dur);
      s.x = s.x0 + (s.tx - s.x0) * pr; s.y = s.y0 + (s.ty - s.y0) * pr - Math.sin(pr * Math.PI) * 1.4; s.pr = pr;
      if (pr >= 1) {
        explode(s.tx, s.ty, s.splash, s.dmg, false, s.big);
        if (s.cluster) for (var cl = 0; cl < 3; cl++) { var ca = cl * 2.1 + Math.random(); G.shots.push({ k: 'mortar', x: s.tx, y: s.ty, x0: s.tx, y0: s.ty, tx: s.tx + Math.cos(ca) * 1.1, ty: s.ty + Math.sin(ca) * 1.1, t: 0, dur: 0.4, dmg: s.dmg * 0.4, splash: 0.7, small: true }); }
        G.shots.splice(i, 1);
      }
      continue;
    }
    var dx2 = s.tx - s.x, dy2 = s.ty - s.y, d = Math.sqrt(dx2 * dx2 + dy2 * dy2), st2 = s.spd * dt;
    if (d <= st2) {
      G.shots.splice(i, 1);
      if (s.k === 'ice') {
        for (var q = 0; q < G.enemies.length; q++) {
          var o = G.enemies[q]; if (o.dead || o.air) continue;
          var op = Z.enemyPos(o), ox = op.x - s.tx, oy = op.y - s.ty;
          if (ox * ox + oy * oy <= s.splash * s.splash) { damage(o, s.dmg); o.slow = Math.max(o.slow, s.slow); o.slowT = Math.max(o.slowT, s.slowT); }
        }
        G.fx.push({ k: 'frost', x: s.tx, y: s.ty, r: s.splash, t: 0, dur: 0.4 });
      } else if (s.splash) {
        for (var q2 = 0; q2 < G.enemies.length; q2++) {
          var o2 = G.enemies[q2]; if (o2.dead) continue;
          var op2 = Z.enemyPos(o2), ox2 = op2.x - s.tx, oy2 = op2.y - s.ty;
          if (ox2 * ox2 + oy2 * oy2 <= s.splash * s.splash) damage(o2, o2 === s.tgt ? s.dmg : s.dmg * 0.6, { frozenBonus: s.frozen });
        }
        G.fx.push({ k: 'ring', x: s.tx, y: s.ty, r: s.splash, t: 0, dur: 0.3, col: '#ffffff' });
      } else if (s.tgt && !s.tgt.dead) {
        damage(s.tgt, s.dmg, { frozenBonus: s.frozen });
        if (Math.random() < 0.5) puff(s.tx, s.ty, 2, 0.5);
      }
    } else { s.x += dx2 / d * st2; s.y += dy2 / d * st2; }
  }
}
function explode(x, y, r, dmg, air, big) {
  var G = Z.G;
  if (Z.hk.blast) Z.hk.blast(x, y, r, dmg, big);
  for (var j = 0; j < G.enemies.length; j++) {
    var e = G.enemies[j]; if (e.dead || (e.air && !air)) continue;
    var p = Z.enemyPos(e), dx = p.x - x, dy = p.y - y;
    if (dx * dx + dy * dy <= r * r) damage(e, dmg);
  }
  (G.structs || []).slice().forEach(function (s) { var sx = s.c + 0.5 - x, sy = s.r + 0.5 - y; if (sx * sx + sy * sy <= (r + 0.4) * (r + 0.4)) Z.damageStruct(s, dmg * 0.8); });
  G.fx.push({ k: 'firework', x: x, y: y, r: r, t: 0, dur: 0.7, hue: Math.floor(Math.random() * 4) });
  if (G.decals.length < 400) G.decals.push({ k: big ? 'crater' : 'scorch', x: x, y: y, s: r * (big ? 0.9 : 0.6), rot: Math.random() * 6, life: big ? 60 : 25 });
  terrainBlast(x, y, r, big);
  for (var mk in G.traps) { var mt = G.traps[mk]; if (mt.type === 'mine' && !mt.boom) { var mdx = mt.c + 0.5 - x, mdy = mt.r + 0.5 - y; if (mdx * mdx + mdy * mdy <= (r + 0.6) * (r + 0.6)) { mt.boom = true; G.pendingBlasts = G.pendingBlasts || []; G.pendingBlasts.push({ x: mt.c + 0.5, y: mt.r + 0.5, t: 0.15, r: 1.3, dmg: Z.TRAPS.mine.dmg * Math.pow(Z.hpScale(G.idx), 0.85) }); delete G.traps[mk]; } } }
  // дым столбом, искры-угольки, снежная пыль
  if (G.fx.length < 400) {
    for (var sm = 0; sm < (big ? 4 : 2); sm++) G.fx.push({ k: 'smoke', x: x + (Math.random() - 0.5) * r, y: y, vy: -0.5 - Math.random() * 0.4, t: -sm * 0.08, dur: 1.4 + Math.random() * 0.6, r: 0.25 + Math.random() * 0.2 });
    for (var em = 0; em < (big ? 10 : 5); em++) { var ea = Math.random() * Math.PI * 2, es = 1 + Math.random() * 2.5; G.fx.push({ k: 'ember', x: x, y: y, vx: Math.cos(ea) * es, vy: Math.sin(ea) * es - 1.5, t: 0, dur: 0.5 + Math.random() * 0.5 }); }
    G.fx.push({ k: 'ring', x: x, y: y + 0.1, r: r * 1.6, t: 0, dur: 0.5, col: 'rgba(255,255,255,0.8)' });
  }
  if (big && Math.random() < 0.5) Z.AU.sfx('crack', 0.35, { pitch: 0.6, gap: 0.1 });
  // взрывы валят деревья — открываются новые проходы
  var L2 = G.L, tc0 = Math.floor(x), tr0 = Math.floor(y), rr = Math.ceil(r);
  for (var ty = tr0 - rr; ty <= tr0 + rr; ty++) for (var tx = tc0 - rr; tx <= tc0 + rr; tx++) {
    if (!L2.grid[ty] || L2.grid[ty][tx] !== 6) continue;
    var ddx = tx + 0.5 - x, ddy = ty + 0.5 - y;
    if (ddx * ddx + ddy * ddy <= r * r * 0.7 && Math.random() < (big ? 0.5 : 0.18)) {
      L2.grid[ty][tx] = 10; Z.navDirty(); G.fieldDirty = true;
      G.fx.push({ k: 'treefall', x: tx + 0.5, y: ty + 0.9, dir: tx + 0.5 >= x ? 1 : -1, t: 0, dur: 0.9, h: 0.95, col: Z.REGIONS[G.info.region].tree });
      if (big && Math.random() < 0.35) { G.fires = G.fires || []; G.fires.push({ x: tx + 0.5, y: ty + 0.5, t: 6, spread: 1 }); }
      debris(tx + 0.5, ty + 0.3, 8, ['#24804f', '#1d6b42', '#8a5a35', '#ffffff']); puff(tx + 0.5, ty + 0.3, 10, 1.2);
      Z.AU.sfx('crack', 0.8); Z.stat('treesDown');
    }
  }
  G.fx.push({ k: 'ring', x: x, y: y, r: r * 1.25, t: 0, dur: 0.35, col: '#fff1c9' });
  if (big) { G.fx.push({ k: 'boom', x: x, y: y, t: 0, dur: 0.55 }); G.shake = Math.max(G.shake, 0.3); }
  G.shake = Math.max(G.shake, 0.12);
  Z.AU.boom(big ? 1.3 : 1);
}
Z.explode = explode;

// ---------- СПОСОБНОСТИ ----------
Z.skillCd = function (id) { return Z.SKILLS[id].cd * (1 - 0.04 * (Z.save.research.skills || 0)); };   // 2.10.3: подарок-бомба раз в 36…29 с
Z.useSkill = function (id, x, y) {
  var G = Z.G;
  if (G.skills[id] > 0) return false;
  if (id === 'blizzard') {
    G.blizT = 6 * (Z.supK ? Z.supK('blizzard') : 1); G.fx.push({ k: 'bliz', t: 0, dur: 1.2 }); Z.AU.sfx('swell2', 0.7); Z.AU.sfx('freeze', 1); Z.AU.sfx('sleigh', 0.6);
  } else if (id === 'bomb') {
    var bk = Z.supK ? Z.supK('bomb') : 1; explode(x, y, 1.7 + (bk - 1) * 0.8, 90 * hpScale(G.idx, G.heroic) * bk, true);   // 2.11.5: улучшение подарка — сильнее и шире
    Z.AU.sfx('crash', 0.7); Z.AU.sfx('bd', 1);
  } else if (id === 'santa') {
    G.fx.push({ k: 'santa', t: 0, dur: 2.2 }); G.flash = 0.6; G.shake = 0.5;
    Z.AU.sfx('sleigh', 1); Z.AU.sfx('sleigh2', 1); Z.AU.sfx('gong', 0.8); Z.AU.sfx('crash', 0.9);
    setTimeout(function () {
      if (Z.G !== G) return;
      for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (!e.dead) damage(e, e.max * (e.boss ? 0.15 : 0.6) + 20); }
    }, 600);
  }
  G.skills[id] = Z.skillCd(id);
  return true;
};

// ---------- ПОТОК ВОЛН ----------
Z.canCallWave = function () {
  var G = Z.G;
  if (G.L.type === 'escort') return G.phase === 'build';
  return (G.phase === 'build' || G.phase === 'between' || (G.phase === 'wave' && !G.spawnQ.length)) && G.wave < G.waves.length;
};
Z.callWave = function () {
  var G = Z.G;
  if (!Z.canCallWave()) return;
  if (G.L.type === 'escort') {
    G.phase = 'escortRun'; G.sleigh.moving = true; G.spawnQ = G.escort.list.slice(); G.spawnT = 0; G.waveMul = G.escort.hpMul;
    G.checkpoint = snapshot();
    Z.AU.sfx('sleigh', 1); Z.AU.sting('wave');
    return;
  }
  // бонус за ранний вызов
  if (G.phase === 'between' && G.betweenT > 0) { var bonus = Math.round(G.betweenT * 2); if (bonus > 0) { G.coins += bonus; addText('+' + bonus, 6, 1.2, '#ffd54a'); } }
  if (G.phase === 'wave') { var b2 = 15 + G.wave * 3; G.coins += b2; addText('+' + b2, 6, 1.2, '#ffd54a'); }
  if (G.phase !== 'wave') G.checkpoint = snapshot();
  // враги отстраивают базу у своих входов по ходу волн
  if (G.idx >= 4 && (G.wave === 0 || G.wave === 2 || G.wave === 4 || (G.endless && G.wave % 3 === 0))) growEnemyBase(G);
  var w = G.waves[G.wave];
  G.spawnQ = G.spawnQ.concat(w.list.map(function (s) { return { t: s.t + G.spawnT, type: s.type, path: s.path, elite: s.elite, m: s.m, rush: s.rush }; })); G.spawnQ.sort(function (a, b) { return a.t - b.t; });
  if (G.mut && G.mut.story && G.mut.build && G.idx >= 4 && G.wave % 2 === 1) growEnemyBase(G);
  if (G.mut && G.mut.story && G.wave === 0) G.mutBanner = { text: Z.T('mut_' + G.mut.list[0]) };
  if (G.endless) {
    for (var gb = 0; gb < (G.mut.build || 0); gb++) growEnemyBase(G);
    var mu = endlessMutate(G, G.wave);
    if (mu) { G.mutBanner = { text: Z.T('mut_' + mu), t: 3.2 }; Z.AU.sfx('gong', 0.8); }
  }
  G.waveMul = w.hpMul;
  G.wave++; G.phase = 'wave';
  if (G.endless && Z.AU.setBoost) Z.AU.setBoost(Math.min(1, 0.2 + G.wave / 25));
  var boss = G.info.type === 'boss' && G.wave === G.waves.length;
  Z.AU.sting(boss ? 'boss' : 'wave');
  G.banner = { text: boss ? Z.T('boss') + '!' : Z.T('wave') + ' ' + G.wave, t: 1.8, boss: boss };
  if (G.mutBanner) { G.banner = { text: Z.T('wave') + ' ' + G.wave, sub: Z.T('mutT') + ': ' + G.mutBanner.text, t: 3.2, big: true }; G.mutBanner = null; }
};
function snapshot() {
  var G = Z.G, towers = {}, bars = {};
  for (var k in G.towers) { var t = G.towers[k]; towers[k] = JSON.parse(JSON.stringify(t)); }
  for (var b in G.barricades) bars[b] = JSON.parse(JSON.stringify(G.barricades[b]));
  return { coins: G.coins, hp: G.hp, wave: G.wave, towers: towers, bars: bars, traps: JSON.parse(JSON.stringify(G.traps)), structs: G.structs.filter(function (s) { return s.done; }).map(function (s) { return { type: s.type, c: s.c, r: s.r, hp: s.hp, max: s.max, hitT: 0, rise: 0, prog: 1, dur: 0, done: true }; }), baseBuilt: G.baseBuilt, sleigh: G.sleigh ? JSON.parse(JSON.stringify(G.sleigh)) : null, spawnT: G.spawnT, spawnQ: G.spawnQ ? G.spawnQ.slice() : [] };
}
Z.restoreCheckpoint = function (opts) {
  var G = Z.G, s = G.checkpoint;
  opts = opts || {};
  if (!s) return;
  G.coins = s.coins; G.hp = Math.max(s.hp, opts.fullHp ? G.hpMax : Math.ceil(G.hpMax * 0.5));
  G.towers = {}; for (var k in s.towers) G.towers[k] = JSON.parse(JSON.stringify(s.towers[k]));
  G.barricades = {}; for (var b in s.bars) G.barricades[b] = JSON.parse(JSON.stringify(s.bars[b]));
  G.traps = JSON.parse(JSON.stringify(s.traps || {})); Z.navDirty();
  G.structs = (s.structs || []).map(function (q) { var o = {}; for (var k in q) o[k] = q[k]; return o; }); G.baseBuilt = s.baseBuilt || 0;
  (G.squad || []).forEach(function (U) { U.dead = false; U.hp = U.max; });
  G.enemies = []; G.shots = []; G.spawnQ = [];
  G.weaker = !!opts.weaker; G.adBliz = !!opts.blizzard; G.flowSaved = false; G.result = null;
  if (G.L.type === 'escort') {
    G.sleigh = JSON.parse(JSON.stringify(s.sleigh)); G.sleigh.hp = Math.max(G.sleigh.hp, opts.fullHp ? G.hpMax : Math.ceil(G.hpMax * 0.5));
    G.sleigh.moving = false; G.phase = 'build';
    // продолжаем расписание врагов с места остановки
    G.escort = { list: s.spawnQ.map(function (q) { return { t: q.t - s.spawnT, type: q.type, path: q.path }; }), hpMul: G.escort.hpMul };
  } else {
    G.wave = s.wave; G.phase = 'build';
  }
  G.spawnT = 0;
};

// 2.12.26: «Продолжить» за рекламу — продолжаем ЭТУ ЖЕ волну с места поражения, а не переигрываем её:
// стоящие вышки остаются, сломанные за волну возвращаются, все чинятся; ёлка (сани) целые; +монеты;
// враги отброшены назад от базы и до конца волны идут вдвое медленнее (метель), первые 2,5 с — заморожены
Z.contBonus = function (G) { return Math.round((40 + G.wave * 8) * (1 + G.idx * 0.04)); };
Z.reviveHere = function () {
  var G = Z.G, s = G.checkpoint || {}, L = G.L, cl = function (o) { return JSON.parse(JSON.stringify(o)); }, k;
  for (k in s.towers || {}) if (!G.towers[k] && !G.barricades[k] && !G.traps[k]) G.towers[k] = cl(s.towers[k]);
  for (k in G.towers) { var t = G.towers[k]; if (t.max) t.hp = t.max; t.stun = 0; }
  for (k in s.bars || {}) if (!G.barricades[k] && !G.towers[k] && !G.traps[k]) G.barricades[k] = cl(s.bars[k]);
  for (k in G.barricades) G.barricades[k].hp = G.barricades[k].max;
  for (k in s.traps || {}) if (!G.traps[k] && !G.towers[k] && !G.barricades[k]) G.traps[k] = cl(s.traps[k]);
  (G.squad || []).forEach(function (U) { U.dead = false; U.hp = U.max; });
  G.hp = G.hpMax; if (G.sleigh) G.sleigh.hp = G.hpMax;
  var bonus = Z.contBonus(G); G.coins += bonus;
  Z.navDirty(); buildNav();
  // отбрасываем врагов: по карте путей шагаем «в гору» — от базы к входам
  var push = L.type === 'escort' ? 3 : 4;   // 2.12.34: отбрасываем недалеко — на пару шагов от ёлки, а не к краю карты
  G.enemies.forEach(function (e) {
    if (e.dead || e.neutral) return;
    e.stun = Math.max(e.stun || 0, 2.5); e.busyT = 0; e.atkCd = Math.max(e.atkCd || 0, 1);
    // 2.12.27: снимаем «осаду» — иначе враг помнит своё место у стены и возвращается к ёлке (так и было: отбрасывало и тут же притягивало обратно)
    e.siege = false; e.siegeN = 0; delete e.sx; delete e.sy; e.enterT = 0; if (e.ysg && e.ysg.leave === undefined) delete e.ysg;
    var fx0 = e.x, fy0 = e.y;
    if (e.air) {
      var tx = L.type === 'escort' && Z.sleighPos ? Z.sleighPos().x : L.fort[0] + 0.5, ty = L.type === 'escort' && Z.sleighPos ? Z.sleighPos().y : L.fort[1] + 0.3;
      var dx = e.x - tx, dy = e.y - ty, d = Math.sqrt(dx * dx + dy * dy) || 1, nd = d + push * 0.8;
      e.x = Math.max(0.5, Math.min(L.W - 0.5, tx + dx / d * nd)); e.y = Math.max(0.5, Math.min(L.H - 0.5, ty + dy / d * nd));
    } else {
      var dd = G.nav && G.nav[profileOf(e)]; if (!dd) return;
      // поиск в ширину (до 14 шагов) — клетка, которая дальше от базы примерно на push; жадный подъём застревал в карманах у ёлки
      var c0 = Math.max(0, Math.min(L.W - 1, Math.floor(e.x))), r0 = Math.max(0, Math.min(L.H - 1, Math.floor(e.y))), i0 = r0 * L.W + c0, d0 = dd[i0];
      // 2.12.27: враг, который бьёт ёлку, стоит в клетке крепости — она непроходима (Infinity); тогда считаем от 0 и выходим из неё к ближайшей дороге
      var inFort = d0 === Infinity; if (inFort) d0 = 0;
      // ищем в ширину ровно на push шагов (клеток) и берём клетку, которая дальше всех от ёлки по карте путей —
      // враг оказывается на своей же дороге в push клетках позади, а не у края карты
      var seen = {}, fr = [i0], bi = i0, bv = d0, c, r; seen[i0] = 1;
      for (var st = 0; st < push && fr.length; st++) {
        var nx = [];
        for (var fi = 0; fi < fr.length; fi++) { var u = fr[fi], uc = u % L.W, ur = (u - uc) / L.W;
          for (var q = 0; q < 4; q++) { var nc = uc + (q === 0 ? 1 : q === 1 ? -1 : 0), nr = ur + (q === 2 ? 1 : q === 3 ? -1 : 0);
            if (nc < 0 || nr < 0 || nc >= L.W || nr >= L.H) continue; var ni = nr * L.W + nc; if (seen[ni]) continue; seen[ni] = 1;
            var v = dd[ni]; if (v === Infinity) { if (inFort && st < 3) nx.push(ni); continue; } nx.push(ni);
            if (v > bv) { bv = v; bi = ni; } } }
        fr = nx;
      }
      c = bi % L.W; r = (bi - c) / L.W;
      e.x = c + 0.5 + (Math.random() - 0.5) * 0.3; e.y = r + 0.5 + (Math.random() - 0.5) * 0.3;
    }
    e.dleft = 99;
    if (G.fx.length < 400) { G.fx.push({ k: 'ring', x: fx0, y: fy0, r: 0.8, t: 0, dur: 0.5, col: '#a7e0ff' }); snowPuff(e.x, e.y, 8); }
  });
  G.adBliz = true; G.blizT = Math.max(G.blizT || 0, 2.5);
  G.phase = G.prePhase || (L.type === 'escort' ? 'escortRun' : 'wave'); if (G.sleigh && L.type === 'escort') G.sleigh.moving = true;
  G.result = null; G.flowSaved = false;
  G.fx.push({ k: 'bliz', t: 0, dur: 1.2 }); G.flash = 0.4; G.shake = 0.3;
  addText('+' + bonus, 6, 1.5, '#ffd54a', 1.3);
  G.banner = { text: Z.T('blizOn'), sub: Z.TT ? Z.TT('Враги отброшены и замедлены', 'Enemies pushed back and slowed') : '', t: 2.2, big: true };
  Z.AU.sfx('freeze', 1); Z.AU.sfx('swell2', 0.7); Z.AU.sfx('sleigh', 0.6);
};

function updateEscort(dt) {
  var G = Z.G, S = G.sleigh, L = G.L;
  if (!S.moving) return;
  if (S.stopT > 0) {
    S.stopT -= dt;
    if (S.stopT <= 0) Z.AU.sfx('sleigh2', 0.8);
    return;
  }
  var h = L.houses[S.house];
  var spd = 0.48 * (Z.hk.sleighSpd ? Z.hk.sleighSpd(S) : 1);   // 2.12.42: замедление саней по месту (вода пруда — вброд)
  S.f = Math.min(L.main.length - 1, S.f + spd * dt);
  S.bells -= dt; if (S.bells <= 0) { S.bells = 0.9; Z.AU.sfx('sleigh', 0.25, { gap: 0.3 }); }
  if (h && S.f >= h.at) {
    S.f = h.at; S.stopT = 2.6; h.done = true; S.house++;
    var bonus = 40 + G.idx * 4; G.coins += bonus;
    addText(Z.T('deliver') + ' +' + bonus, h.c + 0.5, h.r - 0.2, '#ffd54a', 1.6);
    G.fx.push({ k: 'gift', x: h.c + 0.5, y: h.r + 0.5, sx: Z.sleighPos().x, sy: Z.sleighPos().y, t: 0, dur: 0.8 });
    Z.AU.sfx('reward', 0.9); Z.AU.sfx('sleigh2', 0.7);
    G.checkpoint = snapshot();
  }
  // финиш — чуть раньше края поля: олени останавливаются у арки целиком на поле, а не уходят за рамку
  if (S.f >= L.main.length - 1.6) { S.f = Math.min(S.f, L.main.length - 1.6); S.moving = false; S.arrived = true; S.stopT = 0; var sp0 = Z.sleighPos(); for (var cf = 0; cf < 14 && G.fx.length < 400; cf++) G.fx.push({ k: 'star', x: sp0.x + (Math.random() - 0.5) * 1.6, y: sp0.y - Math.random() * 1.2, t: 0, dur: 0.7 + Math.random() * 0.5 }); Z.AU.sfx('reward', 0.8); Z.levelWon(); }   // 2.12.44: доехали — сани стоят (раньше олени продолжали бежать на месте)
}

// ---------- ГЛАВНЫЙ ШАГ ----------
Z.update = function (dt) {
  var G = Z.G;
  if (!G) return;
  if (G.slowT > 0) { G.slowT -= dt; dt *= 0.35; }
  G.t += dt;
  G.shake = Math.max(0, G.shake - dt); G.flash = Math.max(0, G.flash - dt);
  G.fortHit = Math.max(0, (G.fortHit || 0) - dt); G.sleighHit = Math.max(0, (G.sleighHit || 0) - dt);
  if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
  for (var s in G.skills) if (G.skills[s] > 0) G.skills[s] = Math.max(0, G.skills[s] - dt);
  if (G.blizT > 0) G.blizT -= dt;
  for (var bk in G.barricades) { var bb = G.barricades[bk]; bb.hitT = Math.max(0, bb.hitT - dt); }
  if (G.phase === 'won' || G.phase === 'lost') { updateFx(dt); return; }
  // спавн
  if (G.phase === 'wave' || G.phase === 'escortRun') {
    G.spawnT += dt;
    while (G.spawnQ.length && G.spawnQ[0].t <= G.spawnT) {
      var q = G.spawnQ.shift();
      var qt = q.type; if (G.mut && G.mut.story && G.mut.air && !Z.ENEMIES[qt].boss && Math.random() < G.mut.air) qt = 'crow';
      var el = q.elite || (G.mut && G.mut.story && !Z.ENEMIES[qt].boss && Math.random() < G.mut.elite);
      var n0 = G.enemies.length, ne = Z.spawn(qt, q.path, G.waveMul, el ? { elite: true } : undefined); ne = (ne && ne.type) ? ne : G.enemies[G.enemies.length - 1];
      if (ne && G.enemies.length > n0 && Z.hk.waveSpawn) Z.hk.waveSpawn(ne, q);
    }
  }
  updateHero(dt);
  if (Z.hk.update) Z.hk.update(dt);
  updateTraps(dt); updateSway(dt); updateGarrison(dt);
  if (G.pendingBlasts && G.pendingBlasts.length) { for (var pb = G.pendingBlasts.length - 1; pb >= 0; pb--) { var B = G.pendingBlasts[pb]; B.t -= dt; if (B.t <= 0) { G.pendingBlasts.splice(pb, 1); explode(B.x, B.y, B.r, B.dmg, false, true); G.chainN = (G.chainN || 0) + 1; } } }
  G.chainT = (G.chainT || 0) - dt; if (G.chainT <= 0) { if ((G.chainN || 0) >= 3 && !G.slowT) { G.slowT = 0.5; G.banner = { text: Z.T('chain') + ' x' + G.chainN, t: 1.2 }; Z.AU.sfx('crash', 0.7); } G.chainN = 0; G.chainT = 0.6; }
  if (G.fires) G.fires.forEach(function (fr) {
    if (!fr.spread) return; fr.sp = (fr.sp || 0) + dt; if (fr.sp < 3.5) return; fr.sp = 0;
    var L3 = G.L, c0 = Math.floor(fr.x), r0 = Math.floor(fr.y);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
      var cc = c0 + d[0], rr = r0 + d[1]; if (!L3.grid[rr] || Math.random() > 0.35 || G.fires.length > 14) return;
      var gv = L3.grid[rr][cc];
      if (gv === 6) { L3.grid[rr][cc] = 10; G.fieldDirty = true; Z.navDirty(); G.fx.push({ k: 'treefall', x: cc + 0.5, y: rr + 0.9, dir: d[0] || 1, t: 0, dur: 0.9, h: 0.95, col: '#3d3d3d' }); G.fires.push({ x: cc + 0.5, y: rr + 0.5, t: 6, spread: 1 }); Z.AU.sfx('crack', 0.5); }
      else if (gv === 8 && !(L3.houses && L3.houses.some(function (h) { return h.c === cc && h.r === rr; }))) { terrainBlast(cc + 0.5, rr + 0.5, 0.3, true); }
      var bk = rr * L3.W + cc; if (L3.bush[bk]) { delete L3.bush[bk]; Z.navDirty(); G.fires.push({ x: cc + 0.5, y: rr + 0.5, t: 4, spread: 1 }); }
    });
  });
  (G.structs || []).forEach(function (st) {
    st.hitT = Math.max(0, st.hitT - dt); if (st.rise > 0) st.rise -= dt;
    if (!st.done && !st.stalled) {
      st.prog += dt / st.dur; st.hp = Math.min(st.max, st.hp + st.max * 0.7 * dt / st.dur);
      st.knock = (st.knock || 0) - dt; if (st.knock <= 0) { st.knock = 0.35; Z.AU.sfx('tap', 0.35, { pitch: 0.55 + Math.random() * 0.2, gap: 0.05 }); if (G.fx.length < 420) G.fx.push({ k: 'spark', x: st.c + 0.5 + (Math.random() - 0.5) * 0.4, y: st.r + 0.1, t: 0, dur: 0.2 }); }
      if (st.prog >= 1) { st.done = true; st.prog = 1; Z.navDirty(); puff(st.c + 0.5, st.r + 0.5, 8, 1); Z.AU.sfx('place', 0.7); Z.AU.sfx('anvil', 0.3); addText(Z.T('built_' + st.type), st.c + 0.5, st.r - 0.3, '#c79bff', 1.2, 0.7); }
    }
    if (st.stalled) { st.fade = (st.fade || 0) + dt; if (st.fade > 2.5) st.dead = true; }
  });
  if (G.structs && G.structs.some(function (q) { return q.dead; })) G.structs = G.structs.filter(function (q) { return !q.dead; });
  if (G.fires) for (var fi = G.fires.length - 1; fi >= 0; fi--) { G.fires[fi].t -= dt; if (G.fires[fi].t <= 0) G.fires.splice(fi, 1); }
  updateEnemies(dt);
  updateTowers(dt);
  updateShots(dt); Z._shot = null;
  if (G.L.type === 'escort') updateEscort(dt);
  updateFx(dt);
  // окончание волны / уровня
  var alive = 0; for (var i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead && !G.enemies[i].neutral) alive++;
  G.alive = alive;
  if (G.L.type === 'escort') {
    if (G.sleigh.hp <= 0) { G.sleigh.hp = 0; Z.levelLost(); }
  } else {
    if (G.hp <= 0) { G.hp = 0; Z.levelLost(); }
    else if (G.phase === 'wave' && !G.spawnQ.length && !alive) {
      var bonus = Math.round((20 + G.wave * 6) * (1 + G.idx * 0.05));
      G.coins += bonus; addText('+' + bonus, 6, 1.5, '#ffd54a', 1.3);
      G.adBliz = false; G.weaker = false;
      if (G.endless) { G.waves.push(endlessWave(G, G.waves.length)); Z.stat('endlessWaves'); if (Z.ui.checkLb) Z.ui.checkLb('endless', G.wave); if (G.wave > (Z.save.endlessBest || 0)) Z.save.endlessBest = G.wave; }
      if (G.wave >= G.waves.length) Z.levelWon();
      else { G.phase = 'between'; G.betweenT = 10; Z.AU.sting('waveEnd'); }
    }
  }
  if (G.phase === 'between') { G.betweenT -= dt; if (G.betweenT <= 0) Z.callWave(); }
  // интенсивность для музыки
  var danger = 0;
  if (G.L.type !== 'escort') {
    for (var j = 0; j < G.enemies.length; j++) { var e = G.enemies[j]; if (!e.dead && e.dleft < 5) danger += 0.15; }
    danger += (1 - G.hp / G.hpMax) * 0.8;
  } else {
    var sp = G.sleigh.moving ? Z.sleighPos() : null;
    if (sp) for (var j2 = 0; j2 < G.enemies.length; j2++) { var e2 = G.enemies[j2]; if (e2.dead) continue; var ep = Z.enemyPos(e2); if (Math.hypot(ep.x - sp.x, ep.y - sp.y) < 3) danger += 0.2; }
    danger += (1 - G.sleigh.hp / G.hpMax) * 0.8;
  }
  var target = 0;
  if (G.phase === 'wave' || G.phase === 'escortRun') target = Math.min(1, 0.3 + alive * 0.035 + danger);
  else if (G.phase === 'between') target = 0.1;
  G.intensity += (target - G.intensity) * Math.min(1, dt * 0.8);
  var bossAlive = false; for (var b = 0; b < G.enemies.length; b++) if (!G.enemies[b].dead && G.enemies[b].boss) bossAlive = true;
  Z.AU.setState(bossAlive ? 'boss' : (G.phase === 'wave' || G.phase === 'escortRun') ? 'battle' : 'build', G.intensity);
};
function updateFx(dt) {
  var G = Z.G;
  for (var f = G.fx.length - 1; f >= 0; f--) {
    var fx = G.fx[f]; fx.t += dt;
    if (fx.k === 'p') { fx.x += fx.vx * dt; fx.y += fx.vy * dt; fx.vy += 2.2 * dt; }
    else if (fx.k === 'shell') { fx.x += fx.vx * dt; fx.y += fx.vy * dt; fx.vy += 9 * dt; }
    else if (fx.k === 'giftfly') { fx.x += fx.vx * dt; fx.y += fx.vy * dt; fx.vy += 7 * dt; fx.rot += fx.vr * dt; }
    else if (fx.k === 'smoke') { fx.y += fx.vy * dt; fx.x += Math.sin(fx.t * 2) * dt * 0.1; }
    else if (fx.k === 'ember') { fx.x += fx.vx * dt; fx.y += fx.vy * dt; fx.vy += 5 * dt; }
    else if (fx.k === 'wheel') { fx.x += fx.vx * dt; fx.vx *= 0.985; }
    else if (fx.k === 'corpse' && fx.e.air) { fx.y += dt * 2.5; }
    else if (fx.k === 'deb') { fx.x += fx.vx * dt; fx.y += fx.vy * dt; fx.vy += 6 * dt; fx.rot += fx.vr * dt; fx.vx *= 0.98; }
    if (fx.t >= fx.dur) G.fx.splice(f, 1);
  }
  for (var dc = G.decals.length - 1; dc >= 0; dc--) { var de = G.decals[dc]; if (de.life !== undefined) { de.life -= dt; if (de.life <= 0) G.decals.splice(dc, 1); } }
  if (G.decals.length > 380) G.decals.splice(0, G.decals.length - 380);
  for (var t = G.texts.length - 1; t >= 0; t--) { var tx = G.texts[t]; tx.t += dt; tx.y -= 0.5 * dt; if (tx.t >= tx.dur) G.texts.splice(t, 1); }
}
function puff(x, y, n, sz) {
  var G = Z.G;
  if (G.fx.length > 350) n = Math.min(n, 2);
  if (G.fx.length > 500) return;
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, sp = (0.6 + Math.random() * 1.4) * (sz || 1);
    G.fx.push({ k: 'p', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6, t: 0, dur: 0.35 + Math.random() * 0.35, r: (0.04 + Math.random() * 0.06) * (sz || 1) });
  }
}
Z.puff = puff;
// тексты не налезают друг на друга: монеты рядом складываются, остальные сдвигаются вверх
function addText(s, x, y, c, dur, sz, dmg) {
  var T = Z.G.texts; if (T.length > 60) T.shift();
  var num = /^\+\d+$/.test(s);
  for (var i = T.length - 1; i >= 0; i--) {
    var o = T[i]; if (o.t > 0.45) continue;
    if (Math.abs(o.x - x) < 0.6 && Math.abs(o.y - y) < 0.45) {
      if (num && o.c === c && /^\+\d+$/.test(o.s)) { o.s = '+' + (parseInt(o.s.slice(1), 10) + parseInt(s.slice(1), 10)); o.t = Math.min(o.t, 0.1); o.sz = Math.min(1.4, (o.sz || 1) + 0.08); return; }
      y = Math.min(y, o.y - 0.32);
    }
  }
  T.push({ s: s, x: x, y: y, c: c || '#fff', t: 0, dur: dur || 0.9, sz: sz || 1, dmg: !!dmg });
}
Z.addText = addText;

Z.levelWon = function () {
  var G = Z.G;
  if (G.phase === 'won') return;
  G.phase = 'won';
  var hpNow = G.L.type === 'escort' ? G.sleigh.hp : G.hp, frac = hpNow / G.hpMax;
  var stars = frac >= 0.9 ? 3 : frac >= 0.5 ? 2 : 1;
  var ta = Z.save.testAdded, ti = ta ? ta.indexOf(G.idx) : -1; if (ti >= 0) { ta.splice(ti, 1); delete Z.save.stars[G.idx]; }   // «техническая» звезда тестового режима — не настоящая победа
  var old = Z.save.stars[G.idx] || 0;
  var flakes = Math.max(0, stars - old) * 2;
  if (G.heroic && !Z.save.heroic[G.idx]) { Z.save.heroic[G.idx] = 1; flakes += 3; }
  if (stars > old) Z.save.stars[G.idx] = stars;
  if (!old) flakes += 1;
  Z.save.flakes += flakes;
  var xp = 10 + G.heroKills; Z.save.heroXp = (Z.save.heroXp || 0) + xp;
  Z.stat('wins'); if (stars === 3) Z.stat('perfect'); if (G.L.type === 'escort') Z.stat('escorts'); if (G.heroic) Z.stat('heroicWins');
  G.result = { win: true, stars: stars, flakes: flakes };
  if (stars > old) { if (Z.SDK && Z.SDK.score) Z.SDK.score(Z.totalStars()); if (Z.ui.checkLb) setTimeout(function () { Z.ui.checkLb('stars', Z.totalStars()); }, 1200); }
  Z.AU.sting('win');
  Z.persist(true);
  Z.ui && Z.ui.onLevelEnd && Z.ui.onLevelEnd();
};
Z.levelLost = function () {
  var G = Z.G;
  if (G.phase === 'lost') return;
  G.prePhase = G.phase; G.phase = 'lost'; G.losses++;
  G.result = { win: false };
  if (G.endless) {
    var waves = Math.max(0, G.wave - 1), fl = Math.floor(waves / 5);
    var best = Z.save.endlessBest || 0; if (waves > best) Z.save.endlessBest = waves;
    Z.save.flakes += fl; Z.save.heroXp = (Z.save.heroXp || 0) + G.heroKills;
    G.result = { win: false, endless: true, waves: waves, flakes: fl, best: Z.save.endlessBest, record: waves > best };
    Z.SDK && Z.SDK.scoreEndless && Z.SDK.scoreEndless(waves);
    Z.persist(true);
  }
  Z.AU.sting('lose');
  Z.ui && Z.ui.onLevelEnd && Z.ui.onLevelEnd();
};
Z._.profileOf = profileOf; Z._.spawnAt = spawnAt; Z._.damage = damage; Z._.kill = kill; Z._.explode = explode; Z._.puff = puff; Z._.addText = addText; Z._.debris = debris; Z._.snowPuff = snowPuff; Z._.terrainBlast = terrainBlast; Z._.WALK = WALK; Z._.PROFILES = PROFILES; Z._.updateUnit = updateUnit;
})();
