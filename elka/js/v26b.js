/* 2.6 · мир: 35 карт с названиями и механиками, погода, вода и лёд, новые враги и боссы, вражеские постройки, ловушки везде */
(function () {
'use strict';
var Z = window.Z, _ = Z._, TT = Z.TT;
var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ---------- 35 карт: [название, name, ориентир, механика, погода] ----------
Z.MAPS = [
  ['Опушка', 'Forest Edge', 'stump', 'tut', 'clear'], ['Пеньки-лесенки', 'Stump Steps', 'stumps', 'heights', 'morning'], ['Санная просека', 'Sleigh Clearing', 'arch', 'none', 'snow'],
  ['Заячьи тропы', 'Hare Trails', 'hares', 'hares', 'day'], ['Замёрзший ручей', 'Frozen Brook', 'mill', 'water', 'clear'], ['Лешачья чаща', 'Leshy Thicket', 'eyetrees', 'leshy', 'fog'],
  ['Берлога великана', 'Giant\'s Den', 'den', 'stomp', 'day'], ['Околица', 'Village Outskirts', 'scarecrow', 'none', 'sunset'], ['Ярмарка', 'The Fair', 'carousel', 'carousel', 'garland'],
  ['Мельница у пруда', 'Pond Mill', 'windmill', 'pond', 'wind'], ['Избушка на курьих ножках', 'Hut on Chicken Legs', 'hut', 'hut', 'night'], ['Погреба', 'The Cellars', 'well', 'cellars', 'night'],
  ['Большая деревня', 'Big Village', 'bridges', 'bridges', 'snow'], ['Площадь с горкой', 'Square with a Slide', 'slide', 'slide', 'festive'], ['Полыньи', 'Ice Holes', 'boat', 'water', 'wind'],
  ['Рыбацкие мостки', 'Fishing Piers', 'fishhuts', 'bridges', 'day'], ['Остров посреди озера', 'Island in the Lake', 'lighthouse', 'water', 'day'], ['Ледоход', 'Ice Drift', 'river', 'floes', 'thaw'],
  ['Камыши Кикиморы', 'Kikimora\'s Reeds', 'lights', 'swamp', 'fog'], ['Бобровая плотина', 'Beaver Dam', 'dam', 'dam', 'day'], ['Калинов мост', 'Kalinov Bridge', 'stonebridge', 'water', 'storm'],
  ['Перевал', 'The Pass', 'slopes', 'avalanche', 'dusk'], ['Канатная дорога', 'Cable Car', 'cable', 'cable', 'clear'], ['Горячие источники', 'Hot Springs', 'springs', 'springs', 'steam'],
  ['Ледяные пещеры', 'Ice Caves', 'crystals', 'dark', 'dark'], ['Висячий мост', 'Rope Bridge', 'ropebridge', 'bridges', 'wind'], ['Горное ущелье', 'Mountain Gorge', 'gates', 'rockfall', 'blizzard'],
  ['Замок Кощея', 'Koschei\'s Castle', 'castle', 'koschei', 'storm'], ['Северное сияние', 'Northern Lights', 'aurora', 'aurora', 'night'], ['Метеостанция', 'Weather Station', 'vane', 'station', 'clear'],
  ['Дрейфующие льдины', 'Drifting Floes', 'icebergs', 'floes', 'night'], ['Ледокол', 'The Icebreaker', 'ship', 'icebreaker', 'night'], ['Ледяной лабиринт', 'Ice Maze', 'icewalls', 'maze', 'night'],
  ['Последняя дорога', 'The Last Road', 'mileposts', 'lights', 'blizzard'], ['Чертоги Метелицы', 'Blizzard\'s Halls', 'palace', 'finale', 'aurora']
];
Z.MECH = {
  tut: ['Обучение: один вход', 'Tutorial: one entrance'], heights: ['Высоты: вышка на пеньке бьёт дальше', 'Heights: a tower on a stump shoots farther'], none: ['Враги выходят из леса с боков', 'Enemies come out of the woods'],
  hares: ['Зайцы пугливы и присматриваются к тебе. Скачут где попало — и по ловушкам. Может, им нужна помощь?', 'The hares are skittish and watching you. They hop anywhere — even onto traps. Maybe they need help?'], water: ['Вода замерзает и тает: кто в ней — вмерзает', 'Water freezes and thaws: whoever is in it gets stuck'],
  leshy: ['Леший валит деревья на дорогу — сани ждут расчистки', 'Leshy fells trees onto the road — the sleigh waits'], stomp: ['Шаги великана сбрасывают снег с елей на башни. А в берлоге кто-то спит — тише…', 'The giant\'s steps shake snow onto towers. Someone sleeps in the den — hush…'],
  carousel: ['Нажми на готовую карусель — у врагов рядом закружится голова. А сороки любят всё блестящее', 'Tap the charged carousel to make nearby enemies dizzy. And magpies love shiny things'], pond: ['По льду сани скользят быстро, по воде пруда идут вброд — медленно. Мороз — помощник', 'The sleigh glides fast on ice and wades slowly through the pond. Frost is your friend'],
  hut: ['Избушка бродит по карте, из неё вылетает Баба-Яга', 'The hut wanders the map; Baba Yaga flies out of it'], cellars: ['Враги лезут из погребов. Нажми люк — завалить сугробом', 'Enemies climb out of cellars. Tap a hatch to block it'],
  bridges: ['Мосты можно подорвать — и врагам, и нам', 'Bridges can be blown up — by enemies and by us'], slide: ['На горке все разгоняются', 'Everyone speeds up on the slide'],
  floes: ['Льдины плывут — по ним переходят реку', 'Ice floes drift — they are the way across'], swamp: ['Болото растёт, камыш прячет врагов', 'The swamp grows, reeds hide enemies'],
  dam: ['Нажми плотину — волна смоет врагов. Только это чей-то дом…', 'Tap the dam — a wave washes enemies away. But it is someone\'s home…'], avalanche: ['Взрывы у склонов вызывают лавины', 'Explosions near slopes cause avalanches'],
  cable: ['Кабинки перевозят врагов. Нажми трос — перерезать', 'Cabins carry enemies. Tap the cable to cut it'], springs: ['Тёплая вода не замерзает и лечит всех', 'Warm water never freezes and heals everyone'],
  dark: ['Темнота: башни видят только освещённое. Где-то ухают совы…', 'Darkness: towers only see lit areas. Owls hoot somewhere…'], rockfall: ['Камнепады перекрывают дорогу — расчищай', 'Rockfalls block the road — clear them'],
  koschei: ['Сундук → заяц → утка → яйцо → игла', 'Chest → hare → duck → egg → needle'], aurora: ['В свете сияния башни сильнее', 'Towers are stronger in the aurora\'s light'],
  station: ['Герой у станции включает ясную погоду, враг — вьюгу', 'A hero at the station clears the weather, an enemy brings a blizzard'], icebreaker: ['Нажми ледокол — он прорежет канал', 'Tap the icebreaker — it cuts a channel'],
  maze: ['Ледяные стены тают от огня и снова нарастают', 'Ice walls melt from fire and grow back'], lights: ['Вьюга: видно только у огней и саней', 'Blizzard: only lit areas are visible'], finale: ['Две фазы: Метелица, затем Кощей', 'Two phases: the Blizzard Witch, then Koschei']
};
var WATER_MAPS = { 4: 1, 9: 1, 14: 1, 15: 1, 16: 1, 17: 1, 18: 1, 19: 1, 20: 1, 23: 1, 25: 1, 30: 1, 31: 1, 12: 1 };
Z.mapOf = function (idx) { var m = Z.MAPS[idx]; return m ? { name: TT(m[0], m[1]), lm: m[2], mech: m[3], weather: m[4] } : null; };

// ---------- новые враги и боссы ----------
Object.assign(Z.ENEMIES, {
  leshy:    { prof: 'sneak', role: 'melee', tdmg: 14, atkRate: 1.5, hp: 150, spd: 0.6, armor: 1, coin: 14, dmg: 2, size: 1.3, bar: 20 },
  raz:      { prof: 'walk', role: 'raz', hp: 70, spd: 1.05, armor: 0, coin: 9, dmg: 1, size: 1.05, bar: 12 },
  yaga:     { role: 'yaga', hp: 210, spd: 0.62, armor: 2, coin: 25, dmg: 2, size: 1.35, air: true },
  kiki:     { prof: 'walk', role: 'melee', tdmg: 10, atkRate: 1.2, hp: 150, spd: 0.8, armor: 1, coin: 14, dmg: 1, size: 1.1, bar: 14 },
  solovey:  { prof: 'walk', role: 'solovey', hp: 950, spd: 0, armor: 3, coin: 90, dmg: 0, size: 1.5, mini: true, bar: 40 },
  hare:     { prof: 'walk', role: 'flee', hp: 260, spd: 1.9, armor: 0, coin: 20, dmg: 0, size: 0.9 },
  duck:     { role: 'flee', hp: 300, spd: 0.85, armor: 0, coin: 20, dmg: 0, size: 0.95, air: true },
  gorynych: { prof: 'brute', role: 'melee', tdmg: 40, atkRate: 1.6, hp: 2700, spd: 0.3, armor: 6, coin: 220, dmg: 12, size: 2.7, boss: true, slowResist: 0.5, bar: 80 },
  koschei:  { prof: 'walk', role: 'melee', tdmg: 30, atkRate: 1.2, hp: 1700, spd: 0.4, armor: 5, coin: 250, dmg: 12, size: 1.9, boss: true, slowResist: 0.5, bar: 80 }
});
Object.assign(Z.FIRST, { leshy: 5, raz: 8, yaga: 10, kiki: 15, solovey: 99, hare: 99, duck: 99, gorynych: 0, koschei: 0 });
Z.REGIONS[0].pool.push('leshy');
Z.REGIONS[1].pool.push('raz', 'yaga', 'leshy');
Z.REGIONS[2].pool.push('kiki', 'raz', 'yaga');
Z.REGIONS[3].pool.push('raz', 'yaga', 'leshy', 'kiki');
Z.REGIONS[4].pool.push('raz', 'yaga', 'leshy', 'kiki');
Z.REGIONS[2].boss = 'gorynych'; Z.REGIONS[3].boss = 'koschei';
_.WALK[4] = 1; _.WALK[12] = 0;

// ---------- вражеские постройки ----------
Object.assign(Z.STRUCT, {
  snowtower: { hp: 120, zone: 1.4 }, catapult: { hp: 150, zone: 1.4 }, workshop: { hp: 200, zone: 1.6 }, crossing: { hp: 90, zone: 1 },
  totem: { hp: 110, zone: 1.4 }, drum: { hp: 100, zone: 1.4 }, powder: { hp: 80, zone: 1.4 }, frostgun: { hp: 140, zone: 1.4 }, lodge: { hp: 180, zone: 1.6 },
  log: { hp: 70, zone: 0 }, rocks: { hp: 120, zone: 0 }, chest: { hp: 520, zone: 1 }
});
var ST_FROM = { snowtower: 5, watch: 7, catapult: 10, workshop: 12, crossing: 14, totem: 15, drum: 17, powder: 19, frostgun: 21, lodge: 24 };
function structCap(G) { return G.endless ? 10 : G.idx < 10 ? 2 : G.idx < 20 ? 4 : 6; }
function liveStructs(G) { return (G.structs || []).filter(function (s) { return !s.dead && ['log', 'rocks', 'chest'].indexOf(s.type) < 0; }).length; }
var oldAdd = Z.addStruct;
Z.addStruct = function (type, c, r, dur, force) {
  var G = Z.G;
  if (!force && dur && (type === 'palisade' || type === 'watch' || type === 'sentry')) {
    if (liveStructs(G) >= structCap(G)) return { done: true, dead: true, prog: 1 };
    var pool = type === 'sentry' ? ['sentry', 'catapult', 'frostgun'] : ['palisade', 'snowtower', 'watch', 'workshop', 'crossing', 'drum', 'powder', 'lodge'];
    pool = pool.filter(function (t) { return t === 'palisade' || t === 'sentry' || G.idx >= (ST_FROM[t] || 0) || (G.endless && Math.random() < 0.5); });
    if (pool.indexOf('crossing') >= 0 && !nearWater(G, c, r)) pool.splice(pool.indexOf('crossing'), 1);
    type = pool[Math.floor(Math.random() * pool.length)];
  }
  var s = oldAdd.call(this, type, c, r, dur);
  s.cd = 2 + Math.random() * 2;
  if (type === 'crossing') { var L = G.L; for (var dr = -1; dr <= 1 && s.wk === undefined; dr++) for (var dc = -1; dc <= 1; dc++) { var gr = L.grid[r + dr]; if (gr && (gr[c + dc] === 4 || gr[c + dc] === 5)) { s.wk = (r + dr) * L.W + c + dc; break; } } }
  if (type === 'snowtower' && Z.sayLine) Z.sayLine('STR-01', 0.4);
  return s;
};
function nearWater(G, c, r) { var L = G.L; for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) { var g = L.grid[r + dr]; if (g && (g[c + dc] === 4 || g[c + dc] === 5)) return true; } return false; }
var oldDS = Z.damageStruct;
Z.damageStruct = function (s, amt) {
  var G = Z.G, was = s.dead;
  if (s.type === 'chest' && G.kos && G.kos.stage > 0) return;
  oldDS.call(this, s, amt);
  if (!was && s.dead) {
    Z.fxBig && Z.fxBig(s.c + 0.5, s.r + 0.5, 1);
    if (s.type === 'powder') { _.explode(s.c + 0.5, s.r + 0.5, 2.6, 320, false, true); G.fx.push({ k: 'v_mushroom', x: s.c + 0.5, y: s.r + 0.5, t: 0, dur: 1.4 }); G.shake = 0.8; Z.AU.sfx('big_boom', 1); _.addText(TT('Бабах!', 'Kaboom!'), s.c + 0.5, s.r - 0.8, '#ffb347', 1.4, 1); }
    if (s.type === 'workshop') { G.coins += 40; _.addText('+40', s.c + 0.5, s.r - 0.6, '#ffd54a', 1.2); if (Z.sayLine) Z.sayLine('STR-02', 0.8); }
    if (s.type === 'chest' && G.kos) kosStage(G, 1, s);
    if (s.type === 'crossing') delete G.L.bridges[s.wk];
    Z.AU.sfx('tower_fall', 0.5);
  }
};
function tickStructs(G, dt) {
  (G.structs || []).forEach(function (s) {
    if (!s.done || s.dead) return;
    s.cd = (s.cd || 0) - dt; if (s.sleep > 0) { s.sleep -= dt; return; }
    var x = s.c + 0.5, y = s.r + 0.5;
    // 2.11.5: постройка «замахивается» и стреляет только в бою и только когда есть цель — иначе стоит спокойно (таймер держим перед замахом)
    var AN = { snowtower: 1, catapult: 1, frostgun: 1, workshop: 1, lodge: 1 };
    if (AN[s.type] && s.cd < 0.7) {
      var battle = G.phase === 'wave' || G.phase === 'escortRun', tgt = battle && (
        s.type === 'snowtower' ? !!(nearestTowerTo(G, x, y, 3) || (G.squad || []).some(function (U) { return !U.dead && Math.hypot(U.x - x, U.y - y) < 3; })) :
        s.type === 'catapult' ? !!nearestTowerTo(G, x, y, 6) : s.type === 'frostgun' ? !!nearestTowerTo(G, x, y, 3) :
        s.type === 'lodge' ? (G.v26.dead || []).some(function (q) { return G.t - q.t < 10 && Math.hypot(q.x - x, q.y - y) < 2.2 && !Z.ENEMIES[q.type].boss; }) : true);
      if (!tgt) { s.cd = 0.7; s.idle = true; return; }
      s.idle = false;
    }
    if (s.type === 'snowtower' && s.cd <= 0) {
      s.cd = 3;
      var tw = nearestTowerTo(G, x, y, 3), H = (G.squad || []).filter(function (U) { return !U.dead && Math.hypot(U.x - x, U.y - y) < 3; })[0];
      if (H && (!tw || Math.random() < 0.5)) { H.hp -= 8 + G.idx * 0.4; H.hitT = 0.15; G.fx.push({ k: 'v_snowhit', x: H.x, y: H.y - 0.4, sx: x, sy: y - 1, t: 0, dur: 0.35 }); Z.AU.sfx('back', 0.3, { pitch: 0.8, gap: 0.2 }); }
      else if (tw) { G.shots.push({ k: 'eball', x: x, y: y - 1, x0: x, y0: y - 1, tx: tw.c + 0.5, ty: tw.r + 0.5, t: 0, dur: 0.45, tw: tw, dmg: 12 * Math.pow(G.waveMul || 1, 0.5) }); }
    } else if (s.type === 'catapult' && s.cd <= 0) {
      s.cd = 7;
      var best = null, bv = -1; for (var k in G.towers) { var t2 = G.towers[k]; if (Math.hypot(t2.c + 0.5 - x, t2.r + 0.5 - y) < 6 && t2.spent > bv) { bv = t2.spent; best = t2; } }
      if (best) { G.shots.push({ k: 'eball', x: x, y: y - 0.8, x0: x, y0: y - 0.8, tx: best.c + 0.5, ty: best.r + 0.5, t: 0, dur: 1.6, tw: best, dmg: 40 * Math.pow(G.waveMul || 1, 0.5), arc: true }); G.fx.push({ k: 'v_warn', x: best.c + 0.5, y: best.r + 0.5, t: 0, dur: 1.6 }); Z.AU.sfx('pot_launch', 0.4, { pitch: 0.7 }); }
    } else if (s.type === 'workshop' && s.cd <= 0) {
      s.cd = 15; for (var q = 0; q < 2; q++) _.spawnAt('raccoon', x, y + 0.4, (G.waveMul || 1) * 0.8); Z.AU.sfx('build', 0.4);
    } else if (s.type === 'totem') {
      G.enemies.forEach(function (e) { if (!e.dead && !e.boss && Math.hypot(e.x - x, e.y - y) < 2) e.hp = Math.min(e.max, e.hp + e.max * 0.008 * dt); });
    } else if (s.type === 'frostgun' && s.cd <= 0) {
      s.cd = 6; var ft = nearestTowerTo(G, x, y, 3); if (ft) { ft.stun = Math.max(ft.stun || 0, 3); ft.frost = 3; G.fx.push({ k: 'frost', x: ft.c + 0.5, y: ft.r + 0.5, r: 0.8, t: 0, dur: 0.8 }); Z.AU.sfx('freeze', 0.4); }
    } else if (s.type === 'lodge' && s.cd <= 0) {
      s.cd = 10; var d = (G.v26.dead || []).filter(function (q) { return G.t - q.t < 10 && Math.hypot(q.x - x, q.y - y) < 2.2 && !Z.ENEMIES[q.type].boss; })[0];
      if (d) { G.v26.dead.splice(G.v26.dead.indexOf(d), 1); var m = _.spawnAt(d.type, d.x, d.y, (G.waveMul || 1) * 0.5); G.fx.push({ k: 'v_ghost', x: d.x, y: d.y, t: 0, dur: 0.8 }); Z.AU.sfx('magic_ball', 0.3, { pitch: 0.6 }); }
    }
  });
}
function nearestTowerTo(G, x, y, r) { var b = null, bd = r; for (var k in G.towers) { var t = G.towers[k], d = Math.hypot(t.c + 0.5 - x, t.r + 0.5 - y); if (d < bd) { bd = d; b = t; } } return b; }
function structNear(G, type, x, y, r) { return (G.structs || []).some(function (s) { return s.type === type && s.done && !s.dead && !(s.sleep > 0) && Math.hypot(s.c + 0.5 - x, s.r + 0.5 - y) < r; }); }

// ---------- вода и лёд ----------
var W = Z.WAT = {};
function wcell(L, c, r) { return L.grid[r] && (L.grid[r][c] === 4 || L.grid[r][c] === 5); }
W.init = function (G) {
  var L = G.L, mp = Z.mapOf(G.idx) || {};
  G.wc = null; G.swamp = {}; G.ripples = []; G.v26.dead = [];
  if (G.endless) mp = { mech: Math.random() < 0.5 ? 'water' : 'none', weather: ['snow', 'clear', 'fog', 'night'][Math.floor(Math.random() * 4)] };
  G.mech = mp.mech; G.weather = mp.weather;
  // вода обязательна на «водных» картах — прорезаем реку поперёк поля
  var needW = WATER_MAPS[G.idx] || mp.mech === 'water' || mp.mech === 'pond' || mp.mech === 'floes';
  var has = false; for (var r = 0; r < L.H; r++) for (var c = 0; c < L.W; c++) if (wcell(L, c, r)) has = true;
  if (needW && !has && !G.endless) carveRiver(G);
  L.water = []; for (var r2 = 0; r2 < L.H; r2++) for (var c2 = 0; c2 < L.W; c2++) if (wcell(L, c2, r2)) L.water.push([c2, r2]);
  if (L.water.length) {
    // глубина от берега: для волны замерзания
    var depth = {}; L.water.forEach(function (q) { var d = 9; DIRS.forEach(function (dd) { if (!wcell(L, q[0] + dd[0], q[1] + dd[1])) d = 0; }); depth[q[1] * L.W + q[0]] = d; });
    for (var it = 0; it < 4; it++) L.water.forEach(function (q) { var k = q[1] * L.W + q[0]; DIRS.forEach(function (dd) { var k2 = (q[1] + dd[1]) * L.W + q[0] + dd[0]; if (depth[k2] !== undefined) depth[k] = Math.min(depth[k], depth[k2] + 1); }); });
    L.wdepth = depth;
    var frozen = L.water.some(function (q) { return L.grid[q[1]][q[0]] === 5; });
    if (mp.mech !== 'springs') G.wc = { phase: frozen ? 'cold' : 'warm', t: frozen ? 16 : 30 + Math.random() * 10, warn: 0, q: [] };
  }
  Z.TRAP_MAX = 6 + Math.floor(G.idx / 5);
};
function carveRiver(G) {
  var L = G.L, best = -1, bs = -1;
  for (var r = 3; r <= L.H - 4; r++) { var road = 0, bad = 0; for (var c = 0; c < L.W; c++) { var v = L.grid[r][c]; if (v === 1) road++; if (v === 9 || v === 11) bad++; } if (road && !bad) { var sc = road * 2 - Math.abs(r - L.H / 2); if (sc > bs) { bs = sc; best = r; } } }
  if (best < 0) return;
  for (var c2 = 0; c2 < L.W; c2++) {
    var v2 = L.grid[best][c2], k = best * L.W + c2;
    if (v2 === 1) { if (G.mech === 'pond') { L.grid[best][c2] = 4; L.pondRoad = L.pondRoad || {}; L.pondRoad[k] = 1; } else L.bridges[k] = true; }
    else if (v2 === 0 || v2 === 6 || v2 === 7) { L.grid[best][c2] = G.info.region === 2 ? 5 : 4; delete L.bush[k]; delete L.drift[k]; }
  }
  L.riverRow = best; G.fieldDirty = true;
}
W.setCell = function (G, c, r, v) {
  var L = G.L; if (L.grid[r][c] === v) return;
  L.grid[r][c] = v; Z.navDirty();
  // 2.12: на уровнях с водой лёд рисуется в самой воде (v30g) — слой поля целиком (сотни миллисекунд на телефоне) не пересобираем
  if (!(Z.waterBase && L.water && L.water.length && (v === 4 || v === 5))) G.fieldDirty = true;
  var k = r * L.W + c;
  if (v === 5) { L.ice[k] = 1; L.iceT = L.iceT || {}; L.iceT[k] = G.t; }
  else { delete L.ice[k]; if (G.traps[k] && G.traps[k].type !== 'fw') { delete G.traps[k]; _.addText(TT('Утонула', 'Sank'), c + 0.5, r, '#7fd8ff', 1, 0.5); } }
};
function unitsIn(G, c, r) {
  var out = [];
  G.enemies.forEach(function (e) { if (!e.dead && !e.air && Math.floor(e.x) === c && Math.floor(e.y) === r) out.push(e); });
  (G.squad || []).forEach(function (U) { if (!U.dead && Math.floor(U.x) === c && Math.floor(U.y) === r) out.push(U); });
  return out;
}
function bridgeAt(G, k) { return G.L.bridges[k] || (G.structs || []).some(function (s) { return s.type === 'crossing' && s.done && !s.dead && s.wk === k; }); }
W.freezeCell = function (G, c, r) {
  var L = G.L, k = r * L.W + c; if (L.grid[r][c] !== 4 || bridgeAt(G, k)) return;
  if (structNear(G, 'totem', c + 0.5, r + 0.5, 1.6)) return;
  W.setCell(G, c, r, 5);
  unitsIn(G, c, r).forEach(function (u) {
    if (u.type && Z.ALLIES[u.type]) { if (u.type !== 'sneg' && u.type !== 'moroz') { u.stunT = 2.5; u.iced = 2.5; } }
    else { u.stun = Math.max(u.stun || 0, u.vehicle ? 6 : 2.5); u.iced = u.vehicle ? 6 : 2.5; }
  });
};
W.thawCell = function (G, c, r) {
  var L = G.L; if (L.grid[r][c] !== 5) return;
  W.setCell(G, c, r, 4);
  unitsIn(G, c, r).forEach(function (u) { if (!u.type || !Z.ALLIES[u.type]) { u.slow = Math.max(u.slow || 0, 0.5); u.slowT = Math.max(u.slowT || 0, 1); } });
  W.splash(c + 0.5, r + 0.5, 0.6);
};
W.freezeArea = function (x, y, rad) {
  var G = Z.G; if (!G || !G.L.water) return;
  G.L.water.forEach(function (q) { if (Math.hypot(q[0] + 0.5 - x, q[1] + 0.5 - y) <= rad) W.freezeCell(G, q[0], q[1]); });
};
W.breakIce = function (x, y, rad) {
  var G = Z.G; if (!G || !G.L.water || G.mech === 'springs') return;
  var broke = 0, veh = 0;
  G.L.water.forEach(function (q) {
    if (G.L.grid[q[1]][q[0]] !== 5 || Math.hypot(q[0] + 0.5 - x, q[1] + 0.5 - y) > rad) return;
    unitsIn(G, q[0], q[1]).forEach(function (u) { if (u.vehicle) { veh++; _.damage(u, u.max * 0.25, { pierceArmor: true }); } });
    W.thawCell(G, q[0], q[1]); broke++;
  });
  if (broke) { Z.AU.sfx('ice_break', 0.7, { gap: 0.1 }); if (veh) { G.coins += 25; G.banner = { text: TT('Ледокол!', 'Icebreaker!'), t: 1.4 }; } }
};
W.splash = function (x, y, r) {
  var G = Z.G; if (!G || !G.L.water) return;
  var L = G.L, c = Math.floor(x), rr = Math.floor(y), hit = false;
  for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) if (L.grid[rr + dr] && L.grid[rr + dr][c + dc] === 4) hit = true;
  if (!hit) return;
  G.ripples.push({ x: x, y: y, t: 0, big: r });
  if (r >= 1) {
    Z.AU.sfx('splash', 0.6, { gap: 0.1 });
    // большая волна отбрасывает лёгких
    G.enemies.forEach(function (e) { if (e.dead || e.air || e.boss || Z.ENEMIES[e.type].size > 1.1) return; var dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy); if (d < r * 1.6 && d > 0.01 && L.grid[Math.floor(e.y)] && L.grid[Math.floor(e.y)][Math.floor(e.x)] === 4) { e.x += dx / d * 0.5; e.y += dy / d * 0.5; e.tc = null; } });
  }
};
W.cellAt = function (x, y) { var G = Z.G, L = G.L, r = Math.floor(y), c = Math.floor(x); return L.grid[r] ? L.grid[r][c] : -1; };
W.unitSpeed = function (H, A) {
  var G = Z.G, v = W.cellAt(H.x, H.y), k = (G.v26 && G.v26.wx === 'blizzard') ? 0.9 : 1;
  if (v === 4 && !bridgeAt(G, Math.floor(H.y) * G.L.W + Math.floor(H.x))) k *= H.type === 'emelya' ? 0.5 : A.heavy ? 0.75 : 0.6;
  else if (v === 5) k *= 1.2;
  if (G.swamp && G.swamp[Math.floor(H.y) * G.L.W + Math.floor(H.x)] > 0) k *= 0.45;
  return k;
};
W.tick = function (G, dt) {
  var L = G.L, wc = G.wc;
  // цикл погоды: тёплая фаза 40–60 с, морозная 15–20 с
  if (wc && (G.phase === 'wave' || G.phase === 'escortRun' || G.phase === 'between' || G.mech === 'pond')) {
    wc.t -= dt;
    if (wc.phase === 'warm' && wc.t < 3 && !wc.warned) { wc.warned = 1; Z.AU.sfx('freeze', 0.35); }
    if (wc.t <= 0) {
      wc.warned = 0;
      if (wc.phase === 'warm') { wc.phase = 'cold'; wc.t = 15 + Math.random() * 5; L.water.forEach(function (q) { wc.q.push({ c: q[0], r: q[1], at: G.t + (L.wdepth[q[1] * L.W + q[0]] || 0) * 0.6, f: 1 }); }); Z.AU.sfx('freeze', 0.7); }
      else { wc.phase = 'warm'; wc.t = 40 + Math.random() * 20; L.water.forEach(function (q) { wc.q.push({ c: q[0], r: q[1], at: G.t + Math.random() * 1.5, f: 0 }); }); Z.AU.sfx('ice_break', 0.6); }
    }
    for (var i = wc.q.length - 1; i >= 0; i--) { var q = wc.q[i]; if (q.at <= G.t) { wc.q.splice(i, 1); if (q.f) W.freezeCell(G, q.c, q.r); else W.thawCell(G, q.c, q.r); } }
  }
  // тонкий лёд проламывают тяжёлые
  if (L.iceT) G.enemies.forEach(function (e) {
    if (e.dead || e.air || !(e.vehicle || e.boss || Z.ENEMIES[e.type].size >= 1.4)) return;
    var c = Math.floor(e.x), r = Math.floor(e.y), k = r * L.W + c;
    if (L.grid[r] && L.grid[r][c] === 5 && G.t - (L.iceT[k] || -99) < 5 && G.mech !== 'pond') W.thawCell(G, c, r);
  });
  // вмёрзшие враги получают урон, течение сносит плывущих, круги на воде
  G.enemies.forEach(function (e) {
    if (e.dead || e.air) return;
    if (e.iced > 0) { e.iced -= dt; _.damage(e, e.max * 0.04 * dt, { pierceArmor: true }); }
    var v = W.cellAt(e.x, e.y);
    if (v === 4) { if (L.riverRow !== undefined && G.mech !== 'dam') e.x += 0.12 * dt; if ((e.rip = (e.rip || 0) - dt) <= 0) { e.rip = 0.5; G.ripples.push({ x: e.x, y: e.y + 0.15, t: 0, big: 0 }); } if (e.vehicle && !bridgeAt(G, Math.floor(e.y) * L.W + Math.floor(e.x))) _.damage(e, e.max * 0.01 * dt, { pierceArmor: true }); }
  });
  (G.squad || []).forEach(function (U) { if (!U.dead && W.cellAt(U.x, U.y) === 4 && U.moving && (U.rip = (U.rip || 0) - dt) <= 0) { U.rip = 0.45; G.ripples.push({ x: U.x, y: U.y + 0.15, t: 0, big: 0 }); } });
  for (var j = G.ripples.length - 1; j >= 0; j--) { G.ripples[j].t += dt; if (G.ripples[j].t > (G.ripples[j].big ? 1.4 : 0.9)) G.ripples.splice(j, 1); }
  if (G.ripples.length > 80) G.ripples.splice(0, G.ripples.length - 80);
  // болото Кикиморы
  for (var sk in G.swamp) { G.swamp[sk] -= dt; if (G.swamp[sk] <= 0) delete G.swamp[sk]; }
  // льдины плывут: полосы льда движутся вдоль реки
  if (G.mech === 'floes' && L.water.length) {
    G.floeT = (G.floeT || 0) - dt;
    if (G.floeT <= 0) { G.floeT = 0.6; L.water.forEach(function (q) { var on = Math.sin(q[0] * 0.9 - G.t * 0.5) > 0.15; if (on) W.freezeCell(G, q[0], q[1]); else W.thawCell(G, q[0], q[1]); }); }
  }
};

// ---------- погода и свет ----------
function lit(G, x, y) {
  var L = G.L;
  if (L.fort && Math.hypot(L.fort[0] + 0.5 - x, L.fort[1] + 0.5 - y) < 3.5) return true;
  if (L.landmark && Math.hypot(L.landmark.c + 1 - x, L.landmark.r + 1 - y) < 3) return true;
  if ((G.fires || []).some(function (f) { return Math.hypot(f.x - x, f.y - y) < 2.2; })) return true;
  for (var k in G.traps) { var t = G.traps[k]; if (t.type === 'lamp' && Math.hypot(t.c + 0.5 - x, t.r + 0.5 - y) < 3) return true; }
  if (G.sleigh && Z.sleighPos && L.type === 'escort') { var p = Z.sleighPos(); if (Math.hypot(p.x - x, p.y - y) < 3.2) return true; }
  return (G.squad || []).some(function (U) { return !U.dead && (U.type === 'sneg' || U.type === 'moroz' || U.type === 'emelya') && Math.hypot(U.x - x, U.y - y) < 2; });
}
Z.isLit = lit;
Z.hk.rangeMul = function (tw) {
  var G = Z.G, wx = G.v26 && G.v26.wx, k = 1;
  if (wx === 'fog' || wx === 'steam') k *= 0.82;
  if (wx === 'blizzard') k *= 0.85;
  if ((wx === 'dark' || G.mech === 'lights') && tw.lvl < 2 && !lit(G, tw.c + 0.5, tw.r + 0.5)) k *= 0.8;
  if (G.auroraOn) k *= 1.15;
  return k;
};
function weatherTick(G, dt) {
  var v = G.v26; if (!v.wx) v.wx = G.weather;
  if (G.mech === 'aurora' || G.weather === 'aurora') { G.auroraT = (G.auroraT || 0) + dt; G.auroraOn = (G.auroraT % 14) < 5; }
  if (G.mech === 'station' && G.L.landmark) {
    var lm = G.L.landmark, cx = lm.c + 1, cy = lm.r + 1;
    var hero = (G.squad || []).some(function (U) { return !U.dead && Math.hypot(U.x - cx, U.y - cy) < 1.8; }), foe = G.enemies.some(function (e) { return !e.dead && !e.air && Math.hypot(e.x - cx, e.y - cy) < 1.8; });
    v.stT = (v.stT || 0) + (hero !== foe ? dt : -dt); v.stT = Math.max(0, v.stT);
    if (v.stT > 3) { v.stT = 0; var nw = hero ? 'clear' : 'blizzard'; if (v.wx !== nw) { v.wx = nw; G.banner = { text: hero ? TT('Ясно!', 'Clear skies!') : TT('Вьюга!', 'Blizzard!'), t: 1.4 }; Z.AU.sfx(hero ? 'chime' : 'wave', 0.6); } }
  }
}

// ---------- механики карт ----------
function mechInit(G) {
  var L = G.L, m = G.mech, rnd = Math.random;
  G.critters = []; G.hatches = []; G.cable = null; G.hut = null; G.kos = null;
  if (m === 'hares') for (var i = 0; i < 3; i++) G.critters.push(randGround(G, { k: 'hare', t: rnd() * 3 }));
  if (m === 'cellars') {
    var mid = []; (L.paths || []).forEach(function (p) { var c = p[Math.floor(p.length * 0.5)]; if (c) mid.push(c); });
    mid.slice(0, 2).forEach(function (c) { var sp = groundNear(G, c[0], c[1]); if (sp) G.hatches.push({ c: sp[0], r: sp[1], open: true, path: c }); });
  }
  if (m === 'hut') G.hut = randGround(G, { k: 'hut', t: 0, ny: 25 });
  if (m === 'cable' && L.landmark) G.cable = { on: true, t: 10, cab: null };
  if (m === 'maze') { G.walls = []; for (var w = 0; w < 10; w++) { var g = randGround(G, {}); if (g && !G.walls.some(function (q) { return q.c === Math.floor(g.x) && q.r === Math.floor(g.y); })) { var c2 = Math.floor(g.x), r2 = Math.floor(g.y); L.grid[r2][c2] = 12; G.walls.push({ c: c2, r: r2, melt: 0 }); } } G.fieldDirty = true; Z.navDirty(); }
  if (m === 'swamp') { if (Z.swampSeed) Z.swampSeed(G); else for (var s = 0; s < 6; s++) { var sw = randGround(G, {}); if (sw) G.swamp[Math.floor(sw.y) * L.W + Math.floor(sw.x)] = 9999; } }
  if (G.info.type === 'boss' && G.info.region === 3) {
    // 2.12.49: дуб с сундуком — у ориентира, а если его нет (в «Замке Кощея» вместо него замок) — посередине поля, а не в случайном месте
    var lm = L.landmark, cp = lm ? groundNear(G, lm.c, lm.r + 2) : groundNear(G, Math.floor(L.W / 2), Math.floor(L.H * 0.55)); if (!cp) { var gg = randGround(G, {}); cp = gg ? [Math.floor(gg.x), Math.floor(gg.y)] : [2, 2]; }
    G.kos = { stage: 0, chest: null, pos: cp };
  }
}
function randGround(G, o) {
  var L = G.L;
  for (var t = 0; t < 80; t++) { var c = Math.floor(Math.random() * L.W), r = 1 + Math.floor(Math.random() * (L.H - 3)); if (L.grid[r][c] === 0 && !G.towers[r * L.W + c] && !Z.inEnemyZone(c, r)) { o.x = c + 0.5; o.y = r + 0.5; return o; } }
  return null;
}
function groundNear(G, c, r) { var L = G.L; for (var rad = 0; rad < 4; rad++) for (var dr = -rad; dr <= rad; dr++) for (var dc = -rad; dc <= rad; dc++) { var cc = c + dc, rr = r + dr; if (L.grid[rr] && L.grid[rr][cc] === 0 && !G.towers[rr * L.W + cc]) return [cc, rr]; } return null; }
function mechTick(G, dt) {
  var L = G.L, m = G.mech, battle = G.phase === 'wave' || G.phase === 'escortRun';
  // зайцы прыгают и иногда наступают на ловушки
  (G.critters || []).forEach(function (h) {
    if (!h) return; h.t -= dt;
    if (h.t <= 0) { h.t = 1.4 + Math.random() * 2; var d = DIRS[Math.floor(Math.random() * 4)], c = Math.floor(h.x) + d[0], r = Math.floor(h.y) + d[1]; if (L.grid[r] && (L.grid[r][c] === 0 || L.grid[r][c] === 1)) { h.fx = h.x; h.fy = h.y; h.x = c + 0.5; h.y = r + 0.5; h.hop = 0.35; h.dir = d[0] || h.dir || 1; /* 2.11.5: зайцы больше не задевают ловушки игрока — они пугают врагов (v29r) */ } }
    if (h.hop > 0) h.hop -= dt;
  });
  if (m === 'cable' && G.cable && G.cable.on && battle && !G.cable2) {
    var C = G.cable; C.t -= dt;
    if (!C.cab && C.t <= 0) {
      var en = L.entrances[0], who = G.enemies.filter(function (e) { return !e.dead && !e.air && !e.boss && Math.hypot(e.x - en[0] - 0.5, e.y - en[1] - 0.5) < 3; }).slice(0, 3);
      var p = ((L.paths || [])[0] || L.main), dst = p[Math.floor(p.length * 0.55)];
      if (who.length && dst) { C.cab = { who: who, x0: who[0].x, y0: who[0].y, x1: dst[0] + 0.5, y1: dst[1] + 0.5, t: 0 }; who.forEach(function (e) { e.stun = 3.2; e.ride = 1; }); }
      C.t = 14;
    }
    if (C.cab) { var cb = C.cab; cb.t += dt / 3; cb.who.forEach(function (e, i) { if (e.dead) return; e.x = cb.x0 + (cb.x1 - cb.x0) * cb.t + i * 0.2; e.y = cb.y0 + (cb.y1 - cb.y0) * cb.t - Math.sin(cb.t * Math.PI) * 1.2; }); if (cb.t >= 1) { cb.who.forEach(function (e) { e.ride = 0; e.tc = null; }); C.cab = null; } }
  }
  if (m === 'springs' && L.water) G.enemies.concat(G.squad || []).forEach(function (u) { if (!u.dead && W.cellAt(u.x, u.y) === 4) u.hp = Math.min(u.max, u.hp + u.max * 0.03 * dt); });
  if (m === 'swamp' && battle) { G.swT = (G.swT || 0) - dt; if (G.swT <= 0) { G.swT = 12; if (Z.swampGrow) Z.swampGrow(G); else { var sw = randGround(G, {}); if (sw) G.swamp[Math.floor(sw.y) * L.W + Math.floor(sw.x)] = 9999; } } }
  if (m === 'maze' && G.walls) G.walls.forEach(function (w) { if (w.melt > 0) { w.melt -= dt; if (w.melt <= 0 && !G.enemies.some(function (e) { return !e.dead && Math.floor(e.x) === w.c && Math.floor(e.y) === w.r; }) && !G.towers[w.r * L.W + w.c]) { L.grid[w.r][w.c] = 12; G.fieldDirty = true; Z.navDirty(); } } });
  if (m === 'rockfall' && G.phase === 'escortRun') { G.rfT = (G.rfT === undefined ? 14 : G.rfT) - dt; if (G.rfT <= 0) { G.rfT = 18; blockAhead(G, 'rocks', 3 + Math.floor(Math.random() * 3)); Z.AU.sfx('avalanche', 0.6); G.shake = 0.4; } }
  if (m === 'stomp') G.enemies.forEach(function (e) { if (e.dead || e.type !== 'giant') return; e.snowT = (e.snowT || 4) - dt; if (e.snowT <= 0) { e.snowT = 5; for (var k in G.towers) { var tw = G.towers[k]; if (Math.hypot(tw.c + 0.5 - e.x, tw.r + 0.5 - e.y) < 4.5 && nearTree(L, tw.c, tw.r)) { tw.stun = Math.max(tw.stun || 0, 1.4); _.snowPuff(tw.c + 0.5, tw.r, 10); } } } });
  // сани ждут: завал впереди или пруд не замёрз
  if (L.type === 'escort' && G.sleigh && G.sleigh.moving) {
    var f = G.sleigh.f, nx = L.main[Math.min(L.main.length - 1, Math.floor(f) + 1)];
    if (nx) {
      var blk = (G.structs || []).some(function (s) { return (s.type === 'log' || s.type === 'rocks') && !s.dead && s.c === nx[0] && s.r === nx[1]; });
      var pond = false;   // 2.12.42: сани у пруда больше не ждут льда — идут вброд медленно (Z.hk.sleighSpd ниже), как и враги
      // страховка: сани не стоят вечно — через 12 с завал разваливается, а пруд сани переходят вброд
      if (blk || pond) { G.v26.waitT = (G.v26.waitT || 0) + dt; } else G.v26.waitT = 0;
      if (G.v26.waitT > 12) { G.v26.waitT = 0; (G.structs || []).forEach(function (s) { if ((s.type === 'log' || s.type === 'rocks') && !s.dead && s.c === nx[0] && s.r === nx[1]) Z.damageStruct(s, 99999); }); if (pond) { L.pondRoad[nx[1] * L.W + nx[0]] = 0; W.freezeCell(G, nx[0], nx[1]); } blk = pond = false; }
      if (blk || pond) { G.sleigh.stopT = Math.max(G.sleigh.stopT || 0, 0.25); if (!G.v26.waitSaid) { G.v26.waitSaid = 1; _.addText(blk ? TT('Завал!', 'Blocked!') : TT('Ждём лёд…', 'Waiting for ice…'), nx[0] + 0.5, nx[1] - 0.3, '#ffd54a', 1.6, 0.8); } }
      else G.v26.waitSaid = 0;
    }
  }
}
function nearTree(L, c, r) { for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) if (L.grid[r + dr] && L.grid[r + dr][c + dc] === 6) return true; return false; }
function blockAhead(G, type, ahead) {
  var L = G.L, m = L.main, i = Math.min(m.length - 2, Math.floor(G.sleigh ? G.sleigh.f : 0) + ahead), c = m[i]; if (!c) return null;
  if ((G.structs || []).some(function (s) { return s.c === c[0] && s.r === c[1]; })) return null;
  var s = Z.addStruct(type, c[0], c[1], 0, true); s.rise = 0.3;
  return s;
}
Z.blockAhead = blockAhead; Z.randGround = randGround;
// нажатия по ориентирам и люкам (вызывает интерфейс)
Z.mechTap = function (c, r) {
  var G = Z.G, L = G.L, m = G.mech;
  var hatch = (G.hatches || []).filter(function (h) { return h.open && h.c === c && h.r === r; })[0];
  if (hatch) { if (G.coins < 30) { Z.AU.sfx('error'); return true; } G.coins -= 30; hatch.open = false; _.snowPuff(c + 0.5, r + 0.5, 14); _.addText(TT('Завалено!', 'Blocked!'), c + 0.5, r - 0.2, '#bfe6ff', 1.2, 0.7); Z.AU.sfx('place', 0.7); return true; }
  var lm = L.landmark; if (!lm || c < lm.c || c > lm.c + 1 || r < lm.r || r > lm.r + 1) return false;
  if (m === 'dam' && !G.damGone && (G.phase === 'wave' || G.phase === 'between')) {
    G.damGone = true; G.shake = 1; G.slowT = 0.8; Z.AU.sfx('big_boom', 1); Z.AU.sfx('wave', 1);
    G.enemies.forEach(function (e) { if (e.dead || e.air) return; var v = W.cellAt(e.x, e.y); if (v === 4 || v === 5 || (L.riverRow !== undefined && Math.abs(e.y - L.riverRow) < 2.5)) { _.damage(e, e.boss ? 200 : 400, { pierceArmor: true }); if (!e.dead && !e.boss) Z.rewind(e, 3); } });
    G.fx.push({ k: 'v_flood', y: L.riverRow || L.H / 2, t: 0, dur: 1.6 }); G.banner = { text: TT('Плотину прорвало!', 'The dam burst!'), t: 1.6, big: true };
    return true;
  }
  if (m === 'icebreaker' && !G.channel) {
    G.channel = true; Z.AU.sfx('ice_break', 1); Z.AU.sfx('boss_horn', 0.5);
    for (var rr = lm.r - 1; rr >= 0; rr--) { var v2 = L.grid[rr][lm.c]; if (v2 === 0 || v2 === 1 || v2 === 5 || v2 === 6 || v2 === 7) { L.grid[rr][lm.c] = 4; delete L.bush[rr * L.W + lm.c]; delete L.drift[rr * L.W + lm.c]; } }
    G.fieldDirty = true; Z.navDirty(); W.init(G); G.mech = 'icebreaker'; G.banner = { text: TT('Канал прорезан!', 'Channel cut!'), t: 1.4 };
    return true;
  }
  if (m === 'cable' && G.cable && G.cable.on) { G.cable.on = false; if (G.cable.cab) G.cable.cab.who.forEach(function (e) { if (!e.dead && !e.boss) _.damage(e, e.max, { pierceArmor: true }); }); G.cable.cab = null; Z.AU.sfx('crack', 0.9); G.banner = { text: TT('Трос перерезан!', 'Cable cut!'), t: 1.4 }; return true; }
  return false;
};

// ---------- поведение новых врагов ----------
Z.hk.enemy = function (e, dt, v) {
  var G = Z.G, L = G.L, t = e.type;
  if (e.ride) return true;
  if (e.hideT > 0) e.hideT -= dt;
  if (t === 'solovey') {
    e.abil = (e.abil === undefined ? 4 : e.abil) - dt;
    if (G.soloveyTree && G.soloveyTree.sleep > 0) { G.soloveyTree.sleep -= dt; e.snore = true; return true; }
    e.snore = false;
    if (e.abil <= 0) {
      e.abil = 12; e.whistle = 1.2;
      if (Z.sayLine) Z.sayLine(Math.random() < 0.5 ? 'SOL-01' : 'SOL-02', 0.7);
      Z.AU.sfx('whistle', 1);
      (G.squad || []).forEach(function (U) { var dx = U.x - e.x, dy = U.y - e.y, d = Math.hypot(dx, dy); if (!U.dead && d < 4 && d > 0.01) { U.x += dx / d * 2; U.y += dy / d * 2; U.x = Math.max(0.3, Math.min(L.W - 0.3, U.x)); U.y = Math.max(0.3, Math.min(L.H - 0.3, U.y)); U.stunT = 0.8; } });
      for (var k in G.towers) { var tw = G.towers[k]; if (Math.hypot(tw.c + 0.5 - e.x, tw.r + 0.5 - e.y) < 4) { tw.stun = Math.max(tw.stun || 0, 2); tw.ang = (tw.ang || 0) + Math.PI; } }
      G.fx.push({ k: 'v_wind', x: e.x, y: e.y, r: 4, t: 0, dur: 1.1 }); G.shake = 0.35;
    }
    if (e.whistle > 0) e.whistle -= dt;
    e.dleft = 50;
    return true;
  }
  if (t === 'raz') {
    if (!e.goal || !G.towers[e.goal.c + e.goal.r * L.W] && !e.goal.fort) e.goal = null;
    if (!e.goal) { var tw2 = nearestTowerTo(G, e.x, e.y, 7); e.goal = tw2 ? { c: tw2.c, r: tw2.r, tw: tw2 } : null; }
    if (!e.goal) return false;
    var gx = e.goal.c + 0.5, gy = e.goal.r + 0.5, dx = gx - e.x, dy = gy - e.y, d = Math.hypot(dx, dy);
    if (d < 0.55) {
      // бах! — башне больно, сам улетает закопчённый
      Z.damageTower(e.goal.tw, 55 + G.idx * 3); G.fx.push({ k: 'boom', x: gx, y: gy, t: 0, dur: 0.6 }); G.fx.push({ k: 'v_sooty', x: e.x, y: e.y, t: 0, dur: 1.6, dir: -(e.dir || 1) });
      Z.AU.sfx('barrel_boom', 0.8); G.shake = Math.max(G.shake, 0.3); e.blew = true;
      if (Z.sayLine) Z.sayLine(Math.random() < 0.5 ? 'RAZ-03' : 'RAZ-06', 0.6);
      e.hp = 0; e.coinless = true; _.kill(e);
      return true;
    }
    var s = Math.min(d, v * dt); e.x += dx / d * s; e.y += dy / d * s; e.dir = dx > 0 ? 1 : -1; e.dleft = 30 + d;
    return true;
  }
  if (t === 'hare' || t === 'duck') {
    if (!e.route) e.route = t === 'duck' ? [{ x: L.W * 0.5, y: L.H * 0.55 }, { x: e.x < L.W / 2 ? L.W - 1.5 : 1.5, y: L.H * 0.35 }, { x: L.W * 0.5, y: L.H * 0.2 }, { x: e.x < L.W / 2 ? -2 : L.W + 2, y: -2 }] : (function () { var en = L.entrances[0]; return [{ x: en[0] + 0.5, y: en[1] - 1 }]; })();
    var tgt = e.route[0];
    var fx = tgt.x - e.x, fy = tgt.y - e.y, fd = Math.hypot(fx, fy);
    if (fd < 0.3 && e.route.length > 1) { e.route.shift(); return true; }
    if (fd < 0.3) { e.dead = true; e.escaped = true; fleeSnd(e, t, 'away'); if (G.kos) { G.kos.stage = 0; _.addText(t === 'duck' ? TT('Улетела! Сундук снова цел', 'Flew away! The chest is back') : TT('Убежал! Сундук снова цел', 'Escaped! The chest is back'), L.W / 2, 2, '#ff9a9a', 2, 0.8); spawnChest(G, 0.6); } return true; }
    fleeSnd(e, t, 'go', dt); if (e.safeT > 0) e.safeT -= dt;
    var s2 = Math.min(fd, v * dt * (t === 'hare' ? 1 : 1)); e.x += fx / fd * s2; e.y += fy / fd * s2; e.dir = fx > 0 ? 1 : -1; e.dleft = 60;
    return true;
  }
  if (t === 'yaga') {
    e.flyT = (e.flyT === undefined ? 0.5 : e.flyT) - dt;
    if (e.flyT <= 0) { e.flyT = 3.5; var vx = (e.x - (e.px0 === undefined ? e.x : e.px0)) / 3.5, toward = (L.W / 2 - e.x) * vx > 0 ? 1 : -1; e.px0 = e.x; Z.AU.sfx('stupa_fly', 0.35, { pos: { x: e.x, y: e.y }, doppler: 1 + toward * Math.min(0.12, Math.abs(vx) * 0.15) }); }
    e.abil = (e.abil === undefined ? 4 : e.abil) - dt;
    if (e.abil <= 0) {
      e.abil = 7; var tw3 = nearestTowerTo(G, e.x, e.y, 3.2);
      if (tw3) { tw3.stun = Math.max(tw3.stun || 0, 3); G.fx.push({ k: 'v_vortex', x: tw3.c + 0.5, y: tw3.r + 0.5, t: 0, dur: 1.2 }); Z.AU.sfx('stupa_fly', 0.6); if (Z.sayLine && Math.random() < 0.5) Z.sayLine('YAG-02', 0.6); }
      G.enemies.forEach(function (o) { if (!o.dead && !o.air && Math.hypot(o.x - e.x, o.y - e.y) < 2.2) o.hideT = 2; });
    }
    return false;
  }
  if (t === 'leshy') {
    e.abil = (e.abil === undefined ? 6 : e.abil) - dt;
    if (e.abil <= 0) {
      e.abil = 11;
      if (L.type === 'escort' && G.sleigh && G.phase === 'escortRun') { if (blockAhead(G, 'log', 2 + Math.floor(Math.random() * 2))) { if (Z.sayLine) Z.sayLine('LES-02', 0.6); Z.AU.sfx('tower_fall', 0.5); } }
      else if (G.idx >= 24 && liveStructs(G) < structCap(G)) { var sp = groundNear(G, Math.floor(e.x), Math.floor(e.y)); if (sp) Z.addStruct('lodge', sp[0], sp[1], 3.5, true); }
      else if (Z.sayLine && Math.random() < 0.3) Z.sayLine('LES-01', 0.5);
    }
    if (L.bush[Math.floor(e.y) * L.W + Math.floor(e.x)]) e.hideT = 0.3;
    return false;
  }
  if (t === 'kiki') {
    e.abil = (e.abil === undefined ? 3 : e.abil) - dt;
    if (e.abil <= 0) {
      e.abil = 6;
      var c = Math.floor(e.x), r = Math.floor(e.y);
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) { var cc = c + dc, rr = r + dr; if (L.grid[rr] && (L.grid[rr][cc] === 0 || L.grid[rr][cc] === 1)) G.swamp[rr * L.W + cc] = Math.max(G.swamp[rr * L.W + cc] || 0, 8); }
      if (Z.sayLine && Math.random() < 0.4) Z.sayLine(Math.random() < 0.5 ? 'KIK-01' : 'KIK-02', 0.5);
      if (G.idx >= 15 && liveStructs(G) < structCap(G) && Math.random() < 0.35) { var tp = groundNear(G, c, r); if (tp) Z.addStruct('totem', tp[0], tp[1], 3, true); }
    }
    return false;
  }
  if (t === 'gorynych') { e.abil = 99; gorynychTick(G, e, dt); return false; }
  if (t === 'koschei') { e.abil = 99; return false; }
  return false;
};
// скорость: болото, барабан, горка, карусель, переправы
Z.hk.speed = function (e, pos, k) {
  var G = Z.G, L = G.L, c = Math.floor(pos.x), r = Math.floor(pos.y), ck = r * L.W + c;
  if (!e.air) {
    var v = L.grid[r] ? L.grid[r][c] : 0;
    if (v === 4 && !bridgeAt(G, ck)) k *= e.vehicle ? 0.5 : (e.boss || Z.ENEMIES[e.type].size >= 1.4) ? 0.75 : 0.6;
    if (G.swamp && G.swamp[ck] > 0) k *= 1.2;
    if (G.mech === 'slide' && L.landmark && Math.hypot(pos.x - L.landmark.c - 1, pos.y - L.landmark.r - 1) < 3.2) k *= 1.6;
  } else if (G.v26 && G.v26.wx === 'blizzard') k *= 0.8;
  if (structNear(G, 'drum', pos.x, pos.y, 3)) k *= 1.2;
  return k;
};
Z.hk.navCost = function (v, c, r, pn) {
  var G = Z.G, add = 0;
  if (G.hut && Math.hypot(G.hut.x - c - 0.5, G.hut.y - r - 0.5) < 1) add += 6;
  if (G.swamp && G.swamp[r * G.L.W + c] > 0) add -= 0.3;   // 2.8.1: было G.swamp[v] (v — тип клетки), болото на путь не влияло
  return add;
};
// урон: сон, бессмертие Кощея, головы Горыныча, укрытие за завалом
Z.hk.dmg = function (e, real, opts) {
  var G = Z.G;
  if (e.sleep) { e.sleep = false; e.stun = Math.min(e.stun || 0, 0.15); }
  if (e.type === 'koschei' && !(G.kos && G.kos.stage >= 4) && !e.mortal) {
    e.immT = (e.immT || 0) - 0.016; if (e.immT <= 0) { e.immT = 1.2; _.addText(TT('Бессмертный!', 'Deathless!'), e.x, e.y - 1.6, '#c7b8ff', 0.8, 0.6); }
    if (!G.v26.kosSaid) { G.v26.kosSaid = 1; if (Z.sayLine) Z.sayLine('KOS-01', 1); }
    return 0;
  }
  if (e.type === 'gorynych') {
    var heads = Math.ceil((e.hp - real) / e.max * 3), was = Math.ceil(e.hp / e.max * 3);
    if (heads < was && heads >= 0) { e.headsLost = 3 - heads; G.fx.push({ k: 'boom', x: e.x + (heads - 1) * 0.4, y: e.y - 1.6, t: 0, dur: 0.7 }); G.shake = 0.6; Z.AU.sfx('dragon_roar', 0.9); if (Z.sayLine) Z.sayLine(heads === 2 ? 'GOR-04' : heads === 1 ? 'GOR-06' : 'GOR-07', 1); }
  }
  if ((G.structs || []).some(function (s) { return s.type === 'log' && !s.dead && Math.hypot(s.c + 0.5 - e.x, s.r + 0.5 - e.y) < 1.1; })) real *= 0.7;
  return real;
};
function gorynychTick(G, e, dt) {
  var lost = e.headsLost || 0;
  e.hIce = (e.hIce === undefined ? 5 : e.hIce) - dt; e.hWind = (e.hWind === undefined ? 8 : e.hWind) - dt; e.hLoud = (e.hLoud === undefined ? 11 : e.hLoud) - dt;
  // левая — лёд (живёт дольше всех), средняя — ветер, правая — крикливая
  if (lost < 3 && e.hIce <= 0) { e.hIce = 8; var tw = nearestTowerTo(G, e.x, e.y, 4); if (tw) { tw.stun = Math.max(tw.stun || 0, 3); G.fx.push({ k: 'v_breath', x: e.x - 0.5, y: e.y - 1.8, tx: tw.c + 0.5, ty: tw.r + 0.5, col: '#bfe6ff', t: 0, dur: 0.9 }); Z.AU.sfx('freeze', 0.8); } W.freezeArea(e.x, e.y, 3); if (Z.sayLine && Math.random() < 0.3) Z.sayLine('GOR-02', 0.7); }
  if (lost < 2 && e.hWind <= 0) { e.hWind = 9; (G.squad || []).forEach(function (U) { var dx = U.x - e.x, dy = U.y - e.y, d = Math.hypot(dx, dy); if (!U.dead && d < 4.5 && d > 0.01) { U.x = Math.max(0.3, Math.min(G.L.W - 0.3, U.x + dx / d * 2)); U.y = Math.max(0.3, Math.min(G.L.H - 0.3, U.y + dy / d * 2)); U.stunT = 1; U.roll = null; } }); G.fx.push({ k: 'v_wind', x: e.x, y: e.y, r: 4.5, t: 0, dur: 1 }); Z.AU.sfx('wave', 0.6); }
  if (lost < 1 && e.hLoud <= 0) { e.hLoud = 12; for (var q = 0; q < 3; q++) _.spawnAt('raccoon', e.x, e.y, (G.waveMul || 1) * 0.7); if (Z.sayLine) Z.sayLine('GOR-05a', 0.9, ['GOR-05b', 'GOR-05c']); }
}
// ---------- Кощей: сундук → заяц → утка → яйцо → игла ----------
// 2.12.50: звуки беглецов. Заяц пищит, выскочив из сундука, и топочет на бегу; утка крякает и хлопает крыльями.
function fleeSnd(e, t, ev, dt) {
  var AU = Z.AU, B = AU && AU.bufs || {}; if (!AU) return;
  var play = function (n, v) { if (!B[n] && !B['sfx_' + n]) return; try { if (AU.at) AU.at(e.x, e.y); AU.sfx(n, v, { gap: 0.12, gapKey: n }); } catch (er) { } };
  if (!e.sndInit) { e.sndInit = 1; e.sndT = 0.3; e.qT = 1.2; if (t === 'hare') play('a_hare_squeak', 0.7); else { play('en_duck', 0.7); play('a_magpie_flap', 0.6); } }
  if (ev === 'away') { if (t === 'hare') play('a_hare_squeak', 0.55); else play('en_duck', 0.55); return; }
  e.sndT -= dt || 0; e.qT -= dt || 0;
  if (e.sndT <= 0) { if (t === 'hare') { e.sndT = 0.32; play('a_hare_thump', 0.35); } else { e.sndT = 0.55; play('a_magpie_flap', 0.4); } }
  if (e.qT <= 0) { e.qT = t === 'hare' ? 2.2 + Math.random() : 1.8 + Math.random() * 1.2; if (t === 'hare') play('a_hare_squeak', 0.4); else play('en_duck', 0.5); }
}
function spawnChest(G, hpK) {
  var K = G.kos; if (!K) return;
  var s = Z.addStruct('chest', K.pos[0], K.pos[1], 0, true); s.hp = s.max * (hpK || 1); K.chest = s; K.stage = 0;
}
function kosStage(G, st, s) {
  var K = G.kos; K.stage = st;
  // 2.12.51: каждый шаг цепочки виден: крупная надпись, на миг замедление, и беглец 1,6 с неуязвим — раньше вышки у сундука
  // убивали зайца и утку в ту же секунду, и игрок видел только упавшее яйцо
  if (st === 1) { var h = _.spawnAt('hare', s.c + 0.5, s.r + 0.5, 1); h.max = h.hp = 260 * Math.pow(Z.hpScale(G.idx), 0.5); h.safeT = 1.6; G.banner = { text: TT('Заяц выскочил!', 'The hare jumped out!'), sub: TT('Догони, пока не убежал!', 'Catch it before it escapes!'), t: 2.2, big: true }; G.slowT = 0.6; _.addText(TT('Заяц убегает!', 'The hare runs!'), s.c + 0.5, s.r - 0.5, '#fff', 1.6, 0.8); if (Z.sayLine) Z.sayLine('KOS-02', 1); Z.AU.sfx('chest_crack', 1); }
  if (st === 2) { var d = _.spawnAt('duck', s.x, s.y, 1); d.max = d.hp = 300 * Math.pow(Z.hpScale(G.idx), 0.5); d.safeT = 1.6; G.banner = { text: TT('Из зайца — утка!', 'A duck from the hare!'), sub: TT('Сбей её, пока не улетела с яйцом!', 'Shoot it down before it flies off with the egg!'), t: 2.2, big: true }; G.slowT = 0.6; if (Z.sayLine) Z.sayLine('KOS-03', 1); }
  if (st === 3 && Z.kosEgg) { if (Z.sayLine) Z.sayLine('KOS-04', 1); Z.kosEgg(G, K, s); return; }   /* 2.10.4: яйцо падает на поле, иглу ломает игрок */
  if (st === 3) { G.fx.push({ k: 'v_egg', x: s.x, y: s.y, t: 0, dur: 1.2 }); if (Z.sayLine) Z.sayLine('KOS-04', 1); setTimeout(function () { if (Z.G === G) { K.stage = 4; G.banner = { text: TT('Игла сломана! Кощей уязвим!', 'Needle broken! Koschei is vulnerable!'), t: 2.4, big: true, boss: true }; G.shake = 0.8; G.slowT = 0.8; Z.AU.sfx('ice_break', 1); Z.AU.sfx('gong', 0.8); } }, 1200); }
}
var oldKill = Z.hk.kill;
Z.hk.kill = function (e) {
  if (oldKill) oldKill(e);
  var G = Z.G;
  if (!e.neutral && !e.repairOf && !/^lair/.test(e.type)) G.v26.dead.push({ type: e.type, x: e.x, y: e.y, t: G.t }); /* 2.10.4: «изба» не воскрешает стены и здания логова */ if (G.v26.dead.length > 30) G.v26.dead.shift();
  if (e.type === 'raz' && !e.blew) { G.pendingBlasts = G.pendingBlasts || []; G.pendingBlasts.push({ x: e.x, y: e.y, t: 0.15, r: 1.3, dmg: 70 * Math.pow(G.waveMul || 1, 0.6) }); G.fx.push({ k: 'v_barrel', x: e.x, y: e.y, t: 0, dur: 0.3 }); if (Z.sayLine && Math.random() < 0.4) Z.sayLine('DUO-15a', 0.6, ['DUO-15b']); }
  if (e.type === 'hare' && G.kos) kosStage(G, 2, e);
  if (e.type === 'duck' && G.kos) kosStage(G, 3, e);
  if (e.type === 'solovey') { if (Z.sayLine) Z.sayLine('SOL-04', 1); G.soloveyTree = null; }
  if (e.type === 'yaga' && Z.sayLine && Math.random() < 0.5) Z.sayLine('YAG-03', 0.7);
  if (e.type === 'leshy' && Z.sayLine && Math.random() < 0.4) Z.sayLine('LES-03', 0.6);
  if (e.type === 'koschei' && G.info.region === 4) { if (Z.sayLine) Z.sayLine('KOS-06', 1); }
  if (e.type === 'witch' && G.info.region === 4 && !G.kosCome) { /* финал: Кощей приходит на 50% — см. tick */ }
};
function bossTick(G, dt) {
  // финал: на половине здоровья Метелицы прилетает Кощей
  if (G.info.region === 4 && G.info.type === 'boss' && !G.endless) {
    var w = G.enemies.filter(function (e) { return e.type === 'witch' && !e.dead; })[0];
    if (w && w.hp < w.max * 0.5 && !G.kosCome) {
      G.kosCome = true; var en = G.L.entrances[G.L.entrances.length - 1];
      var k = _.spawnAt('koschei', en[0] + 0.5, en[1] + 0.5, G.waveMul * 0.6); k.mortal = true;
      if (Z.sayLine) { Z.sayLine('FIN-01', 1, ['FIN-02', 'FIN-03', 'FIN-04']); }
    }
  }
  // Кощей: сундук появляется вместе с боссом
  if (G.kos && !G.kos.chest && G.enemies.some(function (e) { return e.type === 'koschei' && !e.dead; })) { spawnChest(G, 1); _.addText(TT('Разбей сундук!', 'Smash the chest!'), G.kos.pos[0] + 0.5, G.kos.pos[1] - 0.8, '#ffd54a', 2.4, 0.9); }
  // Соловей сидит на дереве у дороги
  if (G.soloveyAt === undefined && !G.endless && (G.idx === 11 || G.idx >= 18) && G.info.type === 'defend') G.soloveyAt = G.idx === 11 ? Math.min(4, G.waves.length - 2) : 3 + (G.idx % 3);
  if (G.soloveyAt !== undefined && G.wave === G.soloveyAt && G.phase === 'wave' && !G.soloveySpawned) {
    G.soloveySpawned = true;
    var p = G.L.paths[0], c = p[Math.floor(p.length * 0.35)], sp = groundNear(G, c[0] + 1, c[1]) || c;
    var s = _.spawnAt('solovey', sp[0] + 0.5, sp[1] + 0.5, Math.pow(G.waveMul || 1, 0.6) * (G.idx === 11 ? 0.5 : 1)); s.x = sp[0] + 0.5; s.y = sp[1] + 0.5;
    G.soloveyTree = { x: s.x, y: s.y, sleep: 0 };
    if (Z.sayLine) Z.sayLine('SOL-05', 1);
  }
}

// ---------- взрывы: лёд, мосты, лавины, ледяные стены ----------
function reachOk(G) {   // от каждого входа можно дойти до ёлки по проходимым клеткам (лёд не считается — растает)
  var L = G.L, W2 = L.W, H2 = L.H, t = L.fort; if (!t || L.type === 'escort') return true;
  var seen = {}, q = [[t[0], t[1]]]; seen[t[1] * W2 + t[0]] = 1;
  for (var i = 0; i < q.length; i++) { var c = q[i][0], r = q[i][1]; DIRS.forEach(function (d) { var nc = c + d[0], nr = r + d[1], k = nr * W2 + nc; if (nc < 0 || nr < 0 || nc >= W2 || nr >= H2 || seen[k]) return; var v = L.grid[nr][nc]; if (!(v === 0 || v === 1 || v === 3 || v === 10 || v === 4 || v === 5)) return; /* 2.12.33: вода проходима вброд (WALK[4]) — последний мост тоже рушится */ seen[k] = 1; q.push([nc, nr]); }); }
  return (L.entrances || []).every(function (e) { return seen[e[1] * W2 + e[0]]; });
}
Z.hk.blast = function (x, y, r, dmg, big) {
  var G = Z.G, L = G.L;
  W.splash(x, y, big ? 1.2 : 0.7); W.breakIce(x, y, Math.min(1.2, r));
  if (big || r >= 1) {
    for (var k in L.bridges) {
      var c = k % L.W, rr = Math.floor(k / L.W);
      if (Math.hypot(c + 0.5 - x, rr + 0.5 - y) < r * 0.8 && !G.endless) {   // 2.11.5: мостки рвутся на любой карте с рекой (раньше — только на «водных»), ловушка на них тонет вместе с ними
        delete L.bridges[k]; L.grid[rr][c] = 1; W.setCell(G, c, rr, 4);
        if (!reachOk(G)) { L.grid[rr][c] = 1; L.bridges[k] = true; delete L.ice[k]; G.fieldDirty = true; Z.navDirty(); _.addText(TT('Мост устоял', 'The bridge held'), c + 0.5, rr - 0.3, '#ffe9a0', 1.1, 0.6); continue; }   // последнюю переправу не рвём — враги не должны застрять навсегда
        if (L.water) L.water.push([c, rr]);
        L.brokenBr = L.brokenBr || {}; L.brokenBr[k] = 1; if (L.drift) delete L.drift[k]; if (L.bush) delete L.bush[k];   // 2.12.31: на месте моста — глубокая вода, а не брод (брод полупрозрачный — доски и дорога просвечивали «под водой»)
        G.fx.push({ k: 'v_planks', x: c + 0.5, y: rr + 0.5, t: 0, dur: 1 }); Z.AU.sfx('tower_fall', 0.6);
        if (L.wdepth) L.wdepth[k] = 0;
        G.enemies.forEach(function (e) { if (!e.dead && !e.air && !e.boss && Math.floor(e.x) === c && Math.floor(e.y) === rr && G.idx === 25) { _.damage(e, e.max, { pierceArmor: true }); _.addText(TT('Плюх!', 'Splash!'), e.x, e.y - 0.4, '#7fd8ff', 1, 0.6); } });
        _.addText(TT('Мост рухнул!', 'Bridge down!'), c + 0.5, rr - 0.3, '#ffd54a', 1.4, 0.7);
      }
    }
  }
  if (G.mech === 'avalanche' && big && !G.avaCd) {
    var hillNear = false; for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) { var gr = L.grid[Math.floor(y) + dr]; if ((gr && gr[Math.floor(x) + dc] === 7) || (L.hgt[Math.floor(y) + dr] && L.hgt[Math.floor(y) + dr][Math.floor(x) + dc])) hillNear = true; }
    if (hillNear) { G.avaCd = 1; setTimeout(function () { if (Z.G === G) G.avaCd = 0; }, 3000); avalanche(G, x, y); }
  }
  if (G.walls) G.walls.forEach(function (w) { if (L.grid[w.r][w.c] === 12 && Math.hypot(w.c + 0.5 - x, w.r + 0.5 - y) < r + 0.3) { L.grid[w.r][w.c] = 0; w.melt = 25; G.fieldDirty = true; Z.navDirty(); _.snowPuff(w.c + 0.5, w.r + 0.5, 10); Z.AU.sfx('ice_break', 0.5, { gap: 0.1 }); } });
  if (big) Z.fxBig && Z.fxBig(x, y, r);
};
function avalanche(G, x, y) {
  G.fx.push({ k: 'v_avalanche', x: x, y: y, t: 0, dur: 1.8 }); G.shake = 0.9; Z.AU.sfx('avalanche', 1);
  setTimeout(function () {
    if (Z.G !== G) return;
    G.enemies.forEach(function (e) { if (!e.dead && !e.air && Math.abs(e.x - x) < 1.2 && e.y > y - 0.5 && e.y < y + 5) _.damage(e, e.boss ? 120 : 260, { pierceArmor: true }); });
    (G.squad || []).forEach(function (U) { if (!U.dead && Math.abs(U.x - x) < 1.2 && U.y > y - 0.5 && U.y < y + 5) { U.stunT = 2; U.hp -= U.max * 0.15; } });
  }, 700);
}
// петарды по летунам, фонари
Object.assign(Z.TRAPS, { fw: { cost: 50, uses: 8, dmg: 45, unlock: 10, col: '#ffb347' }, lamp: { cost: 20, uses: 9999, unlock: 0, col: '#ffe08a' } });
Z.TRAP_ORDER = ['spike', 'puddle', 'mine', 'snare', 'fw', 'lamp'];
var oldTU2 = Z.trapUnlocked;
Z.trapUnlocked = function (t, idx) { if (t === 'lamp') return !!(Z.G && (Z.G.dayK !== undefined || Z.G.mech === 'dark' || Z.G.mech === 'lights' || Z.G.weather === 'night' || Z.G.weather === 'dark')); return oldTU2(t, idx); };
function trapTick(G, dt) {
  for (var k in G.traps) {
    var tr = G.traps[k]; if (tr.type !== 'fw') continue;
    if (tr.cd > 0) continue;
    var x = tr.c + 0.5, y = tr.r + 0.5, tg = null, bd = 2.8;
    G.enemies.forEach(function (e) { if (e.dead || !e.air) return; var d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; tg = e; } });
    if (tg) { tr.cd = 1.2; tr.uses--; tr.t = 0.4; _.damage(tg, Z.TRAPS.fw.dmg * Math.pow(Z.hpScale(G.idx), 0.8), {}); G.fx.push({ k: 'v_fw', x: tg.x, y: tg.y - 1.2, t: 0, dur: 0.8, col: ['#ffd54a', '#ff6b8a', '#7fd8ff'][tr.uses % 3] }); Z.AU.sfx('mine_pop', 0.5, { gap: 0.1, pitch: 1.4 }); if (tr.uses <= 0) { delete G.traps[k]; } }
  }
}
// ловушки на любой проходимой земле (кроме воды, скал, домов, зоны врага, входов)
Z.canTrapCell = function (c, r) {
  var G = Z.G, L = G.L; if (c < 0 || r < 0 || c >= L.W || r >= L.H) return false;
  var v = L.grid[r][c]; if (v !== 1 && v !== 0 && v !== 10 && v !== 5) return false;
  if (!Z.TRAP_ORDER.some(function (t) { return Z.trapUnlocked(t, G.idx); })) return false;
  if (Z.inEnemyZone(c, r)) return false;
  var k = r * L.W + c; return !G.towers[k] && !G.traps[k] && !G.barricades[k] && !(L.fort && c === L.fort[0] && r === L.fort[1]) && !(L.fort && r >= L.H - 1);
};
Z.canTrap = function (c, r, type) {
  var G = Z.G; if (!Z.canTrapCell(c, r)) return false;
  if (type === 'fw' && !nearestTowerTo(G, c + 0.5, r + 0.5, 1.6)) return false;
  return Object.keys(G.traps).length < Z.TRAP_MAX;
};
var oldBT = Z.buildTrap;
Z.buildTrap = function (type, c, r) { if (!Z.canTrap(c, r, type)) return false; return oldBT.call(this, type, c, r); };

// ---------- главный тик 2.6 ----------
Z.hk.update = function (dt) {
  var G = Z.G; if (!G || !G.v26) return;
  if (!G.v26.init) { G.v26.init = 1; W.init(G); mechInit(G); }
  Z.unitTick(G, dt);
  W.tick(G, dt);
  weatherTick(G, dt);
  mechTick(G, dt);
  tickStructs(G, dt);
  bossTick(G, dt);
  trapTick(G, dt);
  if (Z.banterTick) Z.banterTick(G, dt);
};
// люки: часть врагов вылезает из погребов
var oldSpawn = Z.spawn;
var spawnWrap = function (type, pathIdx, hpMul, opts) {
  var G = Z.G, e = oldSpawn.apply(this, arguments);
  if (G && G.idx === 11 && !G.endless && e && !e.boss) { e.hp *= 0.82; e.max = e.hp; }
  if (G && G.hatches && G.hatches.length && !opts && !e.boss && !e.air && G.wave >= (G.idx === 11 ? 4 : 2) && Math.random() < (G.idx === 11 ? 0.12 : 0.18)) { var h = G.hatches.filter(function (q) { return q.open; })[Math.floor(Math.random() * 2)]; if (h) { e.x = h.c + 0.5; e.y = h.r + 0.5; e.tc = null; _.snowPuff(e.x, e.y, 6); } }
  return e;
};
Z.spawn = spawnWrap;

// тексты врагов
Object.assign(Z.TXT.ru, {
  e_leshy: 'Леший', e_leshyD: 'Медленный. Валит деревья на дорогу, в кустах невидим. Белка его раскрывает.', e_raz: 'Разбойник-подрывник', e_razD: 'Несёт бочку к ближайшей башне и взрывает. Подстрели на подходе — бочка рванёт среди своих!',
  e_yaga: 'Баба-Яга в ступе', e_yagaD: 'Летает. Метлой оглушает башни и прячет врагов. Против неё — петарды и ПВО.', e_kiki: 'Кикимора', e_kikiD: 'Делает болото: герои вязнут, враги плывут быстрее. Строит тотемы.',
  e_solovey: 'Соловей-разбойник', e_soloveyD: 'Сидит у дороги. Свистом отбрасывает героев и сбивает прицел башням. Кот-Баюн его усыпляет.',
  e_hare: 'Заяц из сундука', e_hareD: 'Убегает! Догони, пока не скрылся.', e_duck: 'Утка', e_duckD: 'Улетает с яйцом. Сбей её!',
  e_gorynych: 'Змей Горыныч', e_gorynychD: 'Три головы: лёд, ветер и крикун. Каждая — треть здоровья.', e_koschei: 'Кощей Бессмертный', e_koscheiD: 'Неуязвим, пока цела игла: сундук → заяц → утка → яйцо.',
  bn_gorynych: 'Змей Горыныч', bn_koschei: 'Кощей Бессмертный', bn_solovey: 'Соловей-разбойник',
  st_snowtower: 'Снежковая вышка', st_catapult: 'Снежная катапульта', st_workshop: 'Мастерская', st_crossing: 'Переправа', st_totem: 'Ледяной тотем', st_drum: 'Барабан ватаги', st_powder: 'Пороховой склад', st_frostgun: 'Пушка-душегрейка', st_lodge: 'Костяная сторожка', st_log: 'Завал', st_rocks: 'Камнепад', st_chest: 'Сундук Кощея',
  built_snowtower: 'Вышка готова', built_catapult: 'Катапульта готова', built_workshop: 'Мастерская готова', built_crossing: 'Переправа готова', built_totem: 'Тотем готов', built_drum: 'Барабан готов', built_powder: 'Склад готов', built_frostgun: 'Пушка готова', built_lodge: 'Сторожка готова',
  tr_fw: 'Петарды', tr_lamp: 'Фонарь'
});
Object.assign(Z.TXT.en, {
  e_leshy: 'Leshy', e_leshyD: 'Slow. Fells trees onto the road, invisible in bushes. Belka reveals him.', e_raz: 'Barrel Bandit', e_razD: 'Carries a barrel to the nearest tower and blows it up. Shoot him early — the barrel explodes among his friends!',
  e_yaga: 'Baba Yaga', e_yagaD: 'Flies. Her broom stuns towers and hides enemies. Use firecrackers and anti-air.', e_kiki: 'Kikimora', e_kikiD: 'Makes swamps: heroes get stuck, enemies move faster. Builds totems.',
  e_solovey: 'Nightingale the Robber', e_soloveyD: 'Sits by the road. His whistle blows heroes away and spins towers. Bayun the Cat puts him to sleep.',
  e_hare: 'Hare from the Chest', e_hareD: 'Runs away! Catch it before it escapes.', e_duck: 'Duck', e_duckD: 'Flies off with the egg. Shoot it down!',
  e_gorynych: 'Zmey Gorynych', e_gorynychD: 'Three heads: ice, wind and the loud one. Each is a third of his health.', e_koschei: 'Koschei the Deathless', e_koscheiD: 'Invulnerable while the needle is intact: chest → hare → duck → egg.',
  bn_gorynych: 'Zmey Gorynych', bn_koschei: 'Koschei the Deathless', bn_solovey: 'Nightingale the Robber',
  st_snowtower: 'Snowball tower', st_catapult: 'Snow catapult', st_workshop: 'Workshop', st_crossing: 'Crossing', st_totem: 'Ice totem', st_drum: 'War drum', st_powder: 'Powder store', st_frostgun: 'Frost cannon', st_lodge: 'Bone lodge', st_log: 'Fallen tree', st_rocks: 'Rockfall', st_chest: 'Koschei\'s chest',
  built_snowtower: 'Tower built', built_catapult: 'Catapult built', built_workshop: 'Workshop built', built_crossing: 'Crossing built', built_totem: 'Totem built', built_drum: 'Drum built', built_powder: 'Powder store built', built_frostgun: 'Cannon built', built_lodge: 'Lodge built',
  tr_fw: 'Firecrackers', tr_lamp: 'Lantern'
});
})();
// 2.12.42: сани и вода. Раньше на «Мельнице у пруда» сани стояли у воды, пока она не замёрзнет («Ждём лёд…»), — выглядело как поломка.
// Теперь в воде (вброд) сани идут втрое медленнее, по льду — чуть быстрее обычного. Враги в воде тоже вдвое медленнее (game.js)
(function () {
  var Z = window.Z, oS = Z.hk.sleighSpd;
  Z.hk.sleighSpd = function (S) {
    var k = oS ? oS(S) : 1, G = Z.G, L = G && G.L; if (!L || !L.main) return k;
    var p = L.main[Math.min(L.main.length - 1, Math.floor(S.f + 0.5))]; if (!p || !L.grid[p[1]]) return k;
    var v = L.grid[p[1]][p[0]], key = p[1] * L.W + p[0];
    if (v === 4 && !L.bridges[key]) { if (!G._wadeSaid && Z._ && Z._.addText) { G._wadeSaid = 1; Z._.addText(Z.TT ? Z.TT('Вброд — медленно!', 'Wading — slowly!') : '', p[0] + 0.5, p[1] - 0.4, '#bfe9ff', 1.4, 0.75); } return k * 0.35; }
    if (v === 5) return k * 1.15;
    return k;
  };
})();
// 2.12.43: Метель замораживает воду. Вся открытая вода (реки, пруды, озёра) покрывается льдом волной от места удара;
// враги, стоявшие в воде, вмерзают (стоят и получают урон). Наших героев лёд не сковывает. Через 4 с после конца метели
// лёд снова тает (если в это время не морозная фаза погоды). На картах, где лёд — отдельная механика (ледокол, льдины), не трогаем
(function () {
  var Z = window.Z, W = Z.WAT, oSk = Z.useSkill;
  function ok(G) { return G && G.L && G.L.water && G.L.water.length && G.mech !== 'icebreaker' && G.mech !== 'floes'; }
  Z.useSkill = function (id, x, y) {
    var r = oSk.apply(this, arguments), G = Z.G;
    try {
      if (r !== false && id === 'blizzard' && ok(G)) {
        var L = G.L, cx = x !== undefined ? x : L.W / 2, cy = y !== undefined ? y : L.H / 2, list = G.blizIce = G.blizIce || {}, n = 0;
        L.water.forEach(function (q) {
          var c = q[0], rr = q[1], k = rr * L.W + c; if (L.grid[rr][c] !== 4 || L.bridges[k]) return;
          var d = Math.hypot(c + 0.5 - cx, rr + 0.5 - cy);
          setTimeout(function () { if (Z.G !== G || L.grid[rr][c] !== 4) return; W.setCell(G, c, rr, 5); list[k] = 1; L.iceT = L.iceT || {}; L.iceT[k] = G.t - 10;
            G.enemies.forEach(function (e) { if (e.dead || e.air || Math.floor(e.x) !== c || Math.floor(e.y) !== rr) return; e.stun = Math.max(e.stun || 0, e.vehicle ? 4 : 2.5); e.iced = e.vehicle ? 4 : 2.5; }); }, Math.min(900, d * 70));
          n++;
        });
        if (n && Z._ && Z._.addText) Z._.addText(Z.TT ? Z.TT('Вода замёрзла!', 'The water froze!') : '', cx, cy - 1.2, '#dff3ff', 1.4, 0.8);
        G.blizIceT = Math.max(G.blizIceT || 0, (G.blizT || 6) + 4);
      }
    } catch (e) { if (window.__rep) window.__rep(e); }
    return r;
  };
  var oU = Z.update;
  Z.update = function (dt) {
    oU.apply(this, arguments);
    var G = Z.G; if (!G || !G.blizIce || !(G.blizIceT > 0)) return;
    G.blizIceT -= dt;
    if (G.blizIceT <= 0) {
      var L = G.L, cold = G.wc && G.wc.phase === 'cold';
      if (!cold) for (var k in G.blizIce) { var c = k % L.W, r = Math.floor(k / L.W); if (L.grid[r] && L.grid[r][c] === 5) W.thawCell(G, c, r); }
      G.blizIce = {};
    }
  };
})();
// 2.12.51: только что выскочившего зайца и утку 1,6 с не берут ни вышки, ни герои (видно, что произошло)
(function () { var Z = window.Z, oD = Z.hk.dmg; Z.hk.dmg = function (e, real, opts) { var r = oD ? oD(e, real, opts) : real; if (r > 0 && e.safeT > 0 && (e.type === 'hare' || e.type === 'duck')) return 0; return r; }; })();
