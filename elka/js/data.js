/* Данные игры: вышки, враги, регионы, уровни, исследования, тексты */
(function () {
'use strict';
var Z = window.Z = window.Z || {};

Z.GRID = 10;
// ловушки на дороге и земле
Z.TRAPS = {
  spike:  { cost: 30, uses: 30, dmg: 9, unlock: 4, col: '#bfefff' },
  puddle: { cost: 25, uses: 9999, unlock: 5, col: '#7fd8ff' },
  mine:   { cost: 45, uses: 1, dmg: 110, unlock: 6, col: '#e8484f' },
  snare:  { cost: 35, uses: 5, unlock: 8, col: '#9aa1b5' }
};
Z.TRAP_ORDER = ['spike', 'puddle', 'mine', 'snare'];

// ---------- ВЫШКИ ----------
// range — в клетках, rate — выстрелов в секунду
Z.TOWERS = {
  snow:     { cost: 50,  dmg: 13, rate: 1.25, range: 2.4, air: true,  col: '#f6f9ff', unlock: 0 },
  mg:       { cost: 70,  dmg: 4.2, rate: 6.67, range: 2.1, air: true,  col: '#9fb4d6', unlock: 0, beat: true },
  ice:      { cost: 80,  dmg: 16, rate: 0.8,  range: 2.3, air: false, col: '#7fd8ff', unlock: 1, splash: 0.9, slow: 0.4, slowT: 2.2 },
  mortar:   { cost: 110, dmg: 46, rate: 0.42, range: 3.6, air: false, col: '#e8484f', unlock: 3, splash: 1.25, minRange: 1.0 },
  tesla:    { cost: 130, dmg: 22, rate: 0.9,  range: 2.3, air: true,  col: '#ffd54a', unlock: 7, chain: 3 },
  ballista: { cost: 140, dmg: 64, rate: 0.5,  range: 3.3, air: true,  col: '#c7925f', unlock: 14, pierce: true, vsVehicle: 2 }
};
Z.TOWER_ORDER = ['snow', 'mg', 'ice', 'mortar', 'tesla', 'ballista'];
Z.TOWER_MAX = 5;
// специализации на 5 уровне
Z.BRANCHES = {
  snow:     { a: { dmg: 1.15, splash: 0.75 }, b: { dmg: 2.3, rate: 0.6, range: 1.6 } },
  mg:       { a: { rate: 1.6, dmg: 0.9 }, b: { dmg: 1.2, airBonus: 2.5, splash: 0.55 } },
  ice:      { a: { slow: 0.82, slowT: 1.8, dmg: 1.1 }, b: { dmg: 1.6, splashMul: 1.6 } },
  mortar:   { a: { cluster: true, dmg: 1.1 }, b: { dmg: 2.3, splashMul: 1.35, rate: 0.75 } },
  tesla:    { a: { chainAdd: 3, dmg: 1.1 }, b: { dmg: 2, stunHit: 0.35 } },
  ballista: { a: { multi: 3, dmg: 0.85 }, b: { dmg: 2.2, pierceArmor: true } }
};
Z.towerStat = function (type, lvl, research, branch) {
  var s = Z.towerStat0(type, lvl, research);
  var B = branch && Z.BRANCHES[type][branch];
  if (B) {
    if (B.dmg) s.dmg *= B.dmg; if (B.rate) s.rate *= B.rate; if (B.range) s.range += B.range;
    if (B.splash) s.splash = Math.max(s.splash, B.splash); if (B.splashMul) s.splash *= B.splashMul;
    if (B.slow) s.slow = B.slow; if (B.slowT) s.slowT += B.slowT; if (B.chainAdd) s.chain += B.chainAdd;
    s.airBonus = B.airBonus || 0; s.cluster = !!B.cluster; s.stunHit = B.stunHit || 0; s.multi = B.multi || 1; s.pierceArmor = !!B.pierceArmor;
  }
  return s;
};
Z.towerStat0 = function (type, lvl, research) {
  var b = Z.TOWERS[type], k = Math.pow(1.6, lvl - 1);
  var rb = research ? (1 + (research['t_' + type] || 0) * 0.12) : 1;
  return {
    dmg: b.dmg * k * rb, rate: b.rate * (b.beat ? 1 : (1 + (lvl - 1) * 0.08)), range: b.range + (lvl - 1) * 0.15,
    splash: b.splash ? b.splash + (lvl - 1) * 0.08 : 0, slow: b.slow ? Math.min(0.65, b.slow + (lvl - 1) * 0.05) : 0, slowT: b.slowT || 0,
    chain: b.chain ? b.chain + (lvl - 1) : 0, air: b.air, minRange: b.minRange || 0, pierce: !!b.pierce, vsVehicle: b.vsVehicle || 1
  };
};
Z.towerCost = function (type, lvl) { return Math.round(Z.TOWERS[type].cost * Math.pow(2, lvl - 1)); };

// ---------- ВРАГИ ----------
// hp — базовое, spd — клеток в секунду, armor — снижение урона за попадание
Z.ENEMIES = {
  raccoon:   { prof: 'walk', role: 'run', hp: 34,  spd: 0.95, armor: 0, coin: 4,  dmg: 1, size: 1.0, bar: 10 },
  icicle:    { prof: 'sneak', role: 'run', hp: 20,  spd: 1.5, armor: 0, coin: 4,  dmg: 1, size: 0.85, bar: 8 },
  fat:       { prof: 'brute', role: 'melee', tdmg: 14, atkRate: 1.2, hp: 170, spd: 0.55, armor: 1, coin: 12, dmg: 3, size: 1.45, bar: 25 },
  sled:      { prof: 'vehicle', role: 'run', hp: 60,  spd: 1.6,  armor: 3, coin: 8,  dmg: 1, size: 1.15, vehicle: true, bar: 12 },
  crow:      { role: 'bomber', tdmg: 12, hp: 48,  spd: 1.0,  armor: 0, coin: 7,  dmg: 1, size: 1.0, air: true },
  ram:       { prof: 'vehicle', role: 'melee', tdmg: 22, atkRate: 1.4, hp: 120, spd: 0.8,  armor: 4, coin: 12, dmg: 2, size: 1.3, vehicle: true, bar: 60 },
  split:     { prof: 'walk', role: 'run', hp: 80,  spd: 0.9,  armor: 0, coin: 6,  dmg: 1, size: 1.15, splits: true, bar: 12 },
  splitkid:  { prof: 'walk', role: 'run', hp: 26,  spd: 1.25, armor: 0, coin: 2,  dmg: 1, size: 0.7, bar: 6 },
  plow:      { prof: 'vehicle', role: 'run', crush: true, hp: 420, spd: 0.45, armor: 8, coin: 30, dmg: 3, size: 1.6, vehicle: true, slowResist: 0.5, bar: 45 },
  giant:     { prof: 'brute', role: 'melee', tdmg: 40, atkRate: 1.6, hp: 2600, spd: 0.32, armor: 6, coin: 150, dmg: 12, size: 2.6, boss: true, slowResist: 0.5, bar: 80 },
  chariot:   { prof: 'vehicle', role: 'run', hp: 1850, spd: 0.42, armor: 8, coin: 150, dmg: 12, size: 2.4, boss: true, vehicle: true, slowResist: 0.4, bar: 80 },
  thrower:   { prof: 'walk', role: 'ranged', tdmg: 10, hp: 44, spd: 0.85, armor: 0, coin: 6, dmg: 1, size: 1.0, bar: 10 },
  engineer:  { prof: 'walk', role: 'builder', hp: 70, spd: 0.8, armor: 2, coin: 10, dmg: 1, size: 1.05, bar: 12 },
  sculptor:  { prof: 'walk', role: 'builder', hp: 60, spd: 0.75, armor: 1, coin: 9, dmg: 1, size: 1.05, bar: 12 },
  witch:     { prof: 'brute', role: 'run', hp: 1500, spd: 0.34, armor: 7, coin: 250, dmg: 8, size: 2.4, boss: true, slowResist: 0.5, bar: 90 }
};

// ---------- РЕГИОНЫ И УРОВНИ ----------
Z.REGIONS = [
  { id: 'forest',  pool: ['raccoon', 'icicle', 'thrower', 'engineer', 'fat'],                         boss: 'giant',   ground: '#eaf2ff', tint: '#dbe8fb', tree: '#24804f' },
  { id: 'village', pool: ['raccoon', 'icicle', 'thrower', 'engineer', 'sculptor', 'fat', 'sled', 'crow'],         boss: 'chariot', ground: '#eef3fb', tint: '#dfe7f4', tree: '#2a8a5c' },
  { id: 'lake',    pool: ['raccoon', 'icicle', 'thrower', 'engineer', 'sculptor', 'sled', 'crow', 'ram', 'split'], boss: 'giant',  ground: '#e6f3fb', tint: '#cfe8f6', tree: '#2a7f6a' },
  { id: 'mount',   pool: ['icicle', 'fat', 'thrower', 'engineer', 'sculptor', 'sled', 'crow', 'ram', 'split', 'plow'], boss: 'chariot', ground: '#eceff8', tint: '#d6dcee', tree: '#2a6f5a' },
  { id: 'pole',    pool: ['raccoon', 'icicle', 'fat', 'thrower', 'engineer', 'sculptor', 'sled', 'crow', 'ram', 'split', 'plow'], boss: 'witch', ground: '#f2f6ff', tint: '#e2e9fa', tree: '#1f6b52' }
];
// 7 уровней на регион: 6 обычных (3-й и 6-й — сопровождение саней), 7-й — босс
Z.LEVELS = [];
(function () {
  for (var r = 0; r < Z.REGIONS.length; r++) {
    for (var k = 0; k < 7; k++) {
      var idx = r * 7 + k;
      var type = k === 6 ? 'boss' : (k === 2 || k === 5) ? 'escort' : 'defend';
      Z.LEVELS.push({ idx: idx, region: r, k: k, type: type, big: k === 6 || (idx >= 7 && k === 3) || (r >= 2 && k === 4), waves: type === 'escort' ? 0 : idx === 0 ? 3 : idx === 1 ? 4 : Math.min(12, 5 + Math.min(r, 3) + (k >= 3 ? 1 : 0) + (type === 'boss' ? 1 : 0)) });
    }
  }
})();
// сундуки-секреты на карте между уровнями
Z.CHESTS = [{ after: 3, reward: 4 }, { after: 9, reward: 5 }, { after: 16, reward: 6 }, { after: 24, reward: 7 }, { after: 31, reward: 8 }];

// ---------- ДОСТИЖЕНИЯ ----------
Z.ACH = [
  { id: 'k100', stat: 'kills', need: 100, rw: 3 }, { id: 'k1000', stat: 'kills', need: 1000, rw: 6 }, { id: 'k5000', stat: 'kills', need: 5000, rw: 10 },
  { id: 'boss1', stat: 'bossKills', need: 1, rw: 4 }, { id: 'boss5', stat: 'bossKills', need: 5, rw: 8 }, { id: 'witch', stat: 'witch', need: 1, rw: 12 },
  { id: 'merge10', stat: 'merges', need: 10, rw: 3 }, { id: 'branch1', stat: 'branches', need: 1, rw: 3 }, { id: 'branch10', stat: 'branches', need: 10, rw: 6 },
  { id: 'hero50', stat: 'heroKills', need: 50, rw: 3 }, { id: 'hero500', stat: 'heroKills', need: 500, rw: 8 },
  { id: 'perfect5', stat: 'perfect', need: 5, rw: 4 }, { id: 'perfect20', stat: 'perfect', need: 20, rw: 8 },
  { id: 'escort4', stat: 'escorts', need: 4, rw: 4 }, { id: 'heroic3', stat: 'heroicWins', need: 3, rw: 6 },
  { id: 'endless20', stat: 'endlessWaves', need: 20, rw: 5 }, { id: 'built100', stat: 'built', need: 100, rw: 4 }
];
Z.achReady = function () { var n = 0; Z.ACH.forEach(function (a) { if (!Z.save.ach[a.id] && (Z.save.stats[a.stat] || 0) >= a.need) n++; }); return n; };
// ---------- УКРАШЕНИЯ (за звёзды) ----------
Z.COS = {
  fort: [{ id: 'base', need: 0, fl: 0, col: '#c9d6ea' }, { id: 'ice', need: 12, fl: 50, col: '#a9e3ff' }, { id: 'candy', need: 30, fl: 80, col: '#ff8fb1' }, { id: 'gold', need: 60, fl: 120, col: '#ffd54a' }, { id: 'night', need: 90, fl: 150, col: '#5a4bb8' }],   // 2.11.5: облик крепости — за снежинки (need — сколько звёзд давало раньше; кто уже открыл звёздами, тому остаётся)   // 2.11.5: разные модели крепости
  trim: [{ id: 'base', need: 0, col: '#8a5a35' }, { id: 'silver', need: 15, col: '#dfe7f2' }, { id: 'candy', need: 45, col: '#ff6f91' }, { id: 'gold', need: 80, col: '#ffcc33' }]
};
Z.cosCol = function (kind) { var id = (Z.save.cos || {})[kind] || 'base'; var l = Z.COS[kind]; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i].col; return l[0].col; };

// ---------- ИССЛЕДОВАНИЯ ----------
Z.RESEARCH = [
  { id: 't_snow', max: 5 }, { id: 't_mg', max: 5 }, { id: 't_ice', max: 5 }, { id: 't_mortar', max: 5 },
  { id: 't_tesla', max: 5 }, { id: 't_ballista', max: 5 },
  { id: 'fort', max: 5 }, { id: 'gold', max: 5 }, { id: 'skills', max: 5 }
];
Z.researchCost = function (lvl) { return 2 + lvl * 2; };

// ---------- СПОСОБНОСТИ ----------
Z.SKILLS = {
  blizzard: { cd: 40, unlock: 0 },
  bomb:     { cd: 36, unlock: 2 },
  santa:    { cd: 90, unlock: 7 }
};

// ---------- ТЕКСТЫ ----------
Z.TXT = {
  ru: {
    title: 'Защити Ёлку!', play: 'Играть', map: 'Карта', wave: 'Волна', of: 'из',
    r_forest: 'Заснеженный лес', r_village: 'Деревня', r_lake: 'Ледяное озеро', r_mount: 'Горы', r_pole: 'Северный полюс',
    lvl: 'Уровень', escort: 'Сопровождение', boss: 'Босс', defend: 'Оборона', locked: 'Пройди предыдущий регион',
    start: 'В бой!', nextWave: 'Волна', callEarly: 'Раньше: +', coins: 'монет',
    t_snow: 'Снежкомёт', t_mg: 'Снежный пулемёт', t_ice: 'Ледяная пушка', t_mortar: 'Мортира-хлопушка', t_tesla: 'Гирлянда-тесла', t_ballista: 'Сосульная баллиста',
    t_snowD: 'Надёжная вышка. Бьёт и по воздуху.', t_mgD: 'Строчит быстрой очередью снежков. Урон x2 по замороженным.',
    t_iceD: 'Замораживает врагов вокруг цели.', t_mortarD: 'Салют по площади. Только наземные цели.',
    t_teslaD: 'Молния прыгает по цепочке. Сильнее по замороженным.', t_ballistaD: 'Пробивает насквозь. Урон x2 по транспорту.',
    e_raccoon: 'Енот-воришка', e_icicle: 'Сосулькин', e_fat: 'Морозяка', e_sled: 'Енот на снегоходе', e_crow: 'Ворона на шаре',
    e_ram: 'Сани-таран', e_split: 'Снегоплюх', e_splitkid: 'Плюшка', e_plow: 'Снегоуборщик', e_giant: 'Ледяной великан', e_chariot: 'Метелица на колеснице',
    e_raccoonD: 'Крадёт подарки. Обычный пехотинец.', e_icicleD: 'Очень быстрый, но хрупкий.', e_fatD: 'Медленный и толстый.',
    e_sledD: 'Быстрый транспорт с бронёй. Пулемёт почти бессилен — нужна баллиста.', e_crowD: 'Летит напрямик над дорогой. Пушка и мортира не достают.',
    e_ramD: 'Ломает баррикады в 5 раз быстрее.', e_splitD: 'Разваливается на двух малышей.', e_plowD: 'Тяжёлая броня, почти не замедляется.',
    e_giantD: 'Топает и оглушает вышки рядом.', e_chariotD: 'Бронированная колесница, призывает енотов.',
    armor: 'броня', air: 'летает', vehicle: 'транспорт',
    sell: 'Продать', upgrade: 'Улучшить', target: 'Цель', tg_first: 'Первый', tg_strong: 'Сильный', tg_vehicle: 'Транспорт', tg_close: 'Ближний',
    max: 'МАКС', barricade: 'Баррикада', barricadeD: 'Задерживает наземных врагов',
    sk_blizzard: 'Метель', sk_bomb: 'Подарок-бомба', sk_santa: 'Хо-хо-хо!', tapToBomb: 'Нажми на поле, куда бросить подарок',
    win: 'Победа!', lose: 'Крепость пала!', loseEscort: 'Сани остановлены!', retryWave: 'С этой волны', retryLevel: 'Уровень заново',
    adContinue: 'Продолжить бой', weaker: 'Ослабить волну', weakerD: 'Враги этой волны на 25% слабее',
    toMap: 'На карту', next: 'Дальше', reward: 'Награда', x2: 'x2 награда', take: 'Забрать',
    research: 'Исследования', r_fort: 'Крепкие стены', r_fortD: '+4 прочности крепости', r_gold: 'Казна', r_goldD: '+25 стартовых монет',
    r_skills: 'Быстрые чары', r_skillsD: '-4% перезарядка способностей', r_t: '+12% урона',
    settings: 'Пауза', music: 'Музыка', sound: 'Звуки', resume: 'Продолжить', fullscreen: 'Полный экран', quit: 'Выйти на карту',
    howto: 'Ставь вышки на любую свободную клетку снега, а на дорогу — баррикады и ловушки. Враги выбирают путь: стрелки показывают, куда пойдут. Нажми на вышку, чтобы улучшить или починить её. Дед Мороз ходит по полю: нажми на него, затем туда, куда идти. Приближай щипком или колесом. Перетащи вышку на такую же — они сольются в более сильную. Баррикады задерживают врагов. Способности — внизу экрана.',
    heroic: 'Героический', heroicD: 'Враги на 60% сильнее, нет повторов волн. Награда: +3 снежинки.',
    newTower: 'Новая вышка!', newEnemy: 'Новый враг!', newSkill: 'Новая способность!', ok: 'Отлично!',
    escortT: 'Защити сани!', escortD: 'Дед Мороз и Снегурочка развозят подарки. Не дай врагам догнать сани!',
    deliver: 'Подарок доставлен!', chest: 'Сундук!', chestD: 'Ты нашёл тайник с снежинками:',
    dailyT: 'Новогодний подарок', daysLeft: 'До Нового года: ', days: ' дн.', dailyGen: 'Подарок дня!', happyNY: 'С Новым годом!',
    adStart: '+100 монет на старт', adSkill: 'Зарядить', adBliz: 'Метель на волну', blizOn: 'Метель!',
    hint: 'Подсказка', hint1: 'Поставь баллисту против транспорта', hint2: 'Мортира и пушка не бьют ворон — нужен Снежкомёт, пулемёт или тесла',
    hint3: 'Перекрой дорогу баррикадой перед узким местом', hint4: 'Сливай одинаковые вышки — уровень сильно поднимает урон',
    tut1: 'Нажми на площадку у дороги и поставь вышку', tut2: 'Отлично! Поставь ещё одну', tut3: 'Нажимай «Волна», когда готов',
    tut4: 'Перетащи вышку на такую же — они сольются', speed: 'Скорость', stars: 'Звёзды',
    sleighHp: 'Сани', fortHp: 'Крепость', heroicDone: 'Героический пройден', ad: 'Реклама', record: 'Звёзд: ',
    bn_giant: 'Ледяной Великан', bn_chariot: 'Колесница Вьюги', bn_witch: 'Злая Метелица', enrage: 'Ярость!',
    e_witch: 'Злая Метелица', e_witchD: 'Замораживает вышки вокруг и вызывает сосульки. Сильнее всех.',
    hero: 'Дед Мороз', heroD: 'Нажми на Деда Мороза, затем на поле — он пойдёт туда. Посохом бьёт врагов вокруг и задерживает до 3 наземных.', heroLvl: 'Ур. героя',
    heroDead: 'Вернётся через', branch: 'Специализация', branchT: 'Выбери специализацию',
    br_snow_a: 'Лавина', br_snow_aD: 'Снежки бьют по площади', br_snow_b: 'Снайпер', br_snow_bD: 'x2.3 урон, дальше, но медленнее',
    br_mg_a: 'Миниган', br_mg_aD: '+60% скорострельность', br_mg_b: 'Зенитка', br_mg_bD: 'x2.5 по летающим, разрывные',
    br_ice_a: 'Вечная мерзлота', br_ice_aD: 'Замедление до 82%, дольше', br_ice_b: 'Ледяная буря', br_ice_bD: 'Шире и сильнее взрыв',
    br_mortar_a: 'Кассетный салют', br_mortar_aD: 'Разлетается на 3 малых взрыва', br_mortar_b: 'Царь-салют', br_mortar_bD: 'x2.3 урон, огромный взрыв',
    br_tesla_a: 'Шаровая гирлянда', br_tesla_aD: '+3 цели в цепи', br_tesla_b: 'Перегрузка', br_tesla_bD: 'x2 урон, оглушает',
    br_ballista_a: 'Тройной залп', br_ballista_aD: '3 сосульки веером', br_ballista_b: 'Копьё', br_ballista_bD: 'x2.2 урон, игнорирует броню',
    diff: 'Сложность', d_easy: 'Лёгкая', d_normal: 'Обычная', d_heroic: 'Героическая',
    d_easyD: 'Больше монет, урон вышек +15%. Для спокойной игры.', d_normalD: 'Задуманный баланс.',
    ach: 'Достижения', claim: 'Забрать', achDone: 'Получено',
    a_k100: 'Победи 100 врагов', a_k1000: 'Победи 1000 врагов', a_k5000: 'Победи 5000 врагов', a_boss1: 'Победи босса', a_boss5: 'Победи 5 боссов',
    a_witch: 'Победи Злую Метелицу', a_merge10: 'Слей 10 вышек', a_branch1: 'Выбери специализацию', a_branch10: '10 специализаций',
    a_hero50: 'Дед Мороз: 50 врагов', a_hero500: 'Дед Мороз: 500 врагов', a_perfect5: '5 уровней на 3 звезды', a_perfect20: '20 уровней на 3 звезды',
    a_escort4: 'Доставь 4 обоза подарков', a_heroic3: 'Пройди 3 героических', a_endless20: '20 волн в бесконечном режиме', a_built100: 'Построй 100 вышек',
    cos: 'Украшения', cos_fort: 'Крепость', cos_trim: 'Вышки', cosNeed: 'Нужно звёзд: ', cosOn: 'Выбрано',
    mut_fast: 'Враги быстрее', mut_armor: 'Враги в броне', mut_swarm: 'Орды стали больше', mut_elite: 'Больше элитных врагов', mut_air: 'Вороньи стаи', mut_build: 'Враги строят вдвое быстрее', mutT: 'Аномалия ночи', ult_moroz: 'Ледяной посох!', ult_sneg: 'Снежный хоровод!', ult_belka: 'Шишкопад!', ult_plombir: 'Пломбирный удар!', squad4: 'Отряд вырос: теперь 4 союзника!', elite: 'Элита', endless: 'Ночь перед Новым годом', endlessD: 'Огромная карта и случайный регион. День сменяется ночью, по ходу забега открываются новые норы, каждые 5 волн — малый босс, каждые 10 — большой. Сколько продержишься?', endlessLock: 'Откроется после 1-го региона',
    endlessOver: 'Ночь окончена', wavesHeld: 'Волн отбито: ', best: 'Рекорд: ', newRecord: 'Новый рекорд!',
    zoomHint: 'Щипок или колесо — приблизить, тяни — двигать, двойное касание — сброс',
    tutHero: 'Это Дед Мороз! Нажми на него, а потом на дорогу — он задержит врагов', loading: 'Загрузка', tapStart: 'Нажми, чтобы начать', tipsOpt: 'Подсказки', squadT: 'Отряд', newAlly: 'Новый союзник!',
    al_moroz: 'Дед Мороз — командир', al_morozD: 'Бьёт посохом по площади и замораживает, держит двоих врагов. Хорошо сносит постройки. Приём «Ледяной посох» — оглушает толпу.',
    al_sneg: 'Снегурочка — целительница', al_snegD: 'Чинит вышки и лечит отряд рядом с собой, издалека бьёт ледяными стрелами и замедляет. Приём «Снежный хоровод» — разом чинит вышки и лечит отряд.',
    al_belka: 'Белка Шишка — разведчица', al_belkaD: 'Самая быстрая. Кидает шишки издалека, видит врагов в кустах и лучше всех сносит постройки врагов. Приём «Шишкопад» — град шишек.',
    al_plombir: 'Снеговик Пломбир — богатырь', al_plombirD: 'Огромный и крепкий: держит до четырёх врагов, бьёт по площади сосулькой-мечом. Приём «Пломбирный удар» — отбрасывает толпу.',
    say_moroz: 'За мной!|Не пройдут!|Посох наготове!', say_sneg: 'Иду лечить!|Держитесь!|Сейчас помогу!', say_belka: 'Шишки к бою!|Я быстро!|Вижу их!', say_plombir: 'Стоять!|Я — стена!|Хо-хо!', cartoons: 'Мультфильмы', cutT_intro: 'Канун Нового года', cutT_r1: 'Падение Великана', cutT_r2: 'Деревня спасена', cutT_r3: 'Тонкий лёд', cutT_r4: 'Перевал', cutT_finale: 'Звезда возвращается', bigMap: 'Большая карта — двигай её, чтобы осмотреться', bigShort: 'Большая карта', map: 'Карта', chain: 'Цепная реакция', e_engineer: 'Енот-плотник', e_engineerD: 'Строит частоколы и дозорные вышки прямо во время волны. Убей его, пока не достроил!', built_palisade: 'Частокол готов', built_watch: 'Вышка готова', built_sentry: 'Часовой готов', options: 'Настройки', modeStory: 'Сюжет', rating: 'Рейтинг', lbNight: 'Ночь', lbStars: 'Звёзды', lbTest: 'Тестовые игроки — настоящий рейтинг появится на Яндекс Играх', overtook: 'Ты обогнал', you: 'Ты', anon: 'Игрок', e_sculptor: 'Лепила', e_sculptorD: 'Катает ком из сугроба: строит снеговика-часового (рядом нельзя строить) или скатывает ком в вышку.', st_palisade: 'Частокол врага', st_watch: 'Дозорная вышка', st_sentry: 'Снеговик-часовой', st_D: 'Рядом нельзя строить. Сломай бомбой, мортирой или любым героем.', st_watchD: 'Ослабляет наши вышки рядом. Сломай бомбой, мортирой или любым героем.', demolish: 'Снести', noHero: 'Взорви бомбой или мортирой', tip_struct: 'Враги строят у своих входов. Нажми на постройку — Дед Мороз пойдёт её сносить. За снос — монеты', enemyZone: 'Здесь стройка врага', on: 'Вкл', off: 'Выкл', sleighShort: 'Сани',
    e_thrower: 'Енот-метатель', e_throwerD: 'Останавливается и закидывает вышки снежками, потом бежит дальше.',
    towerLost: 'Вышка разрушена!', repair: 'Починить', trapsT: 'Ловушки', tr_spike: 'Шипы', tr_puddle: 'Лужа', tr_mine: 'Петарда', tr_snare: 'Капкан',
    tr_spikeD: 'Ранят всех, кто идёт по ним', tr_puddleD: 'Сильно замедляет', tr_mineD: 'Взрывается под врагом', tr_snareD: 'Обездвиживает врага',
    trapMax: 'Ловушек не больше 6', newTrap: 'Новая ловушка!',
    tip_build: 'Вышку можно поставить на любую свободную клетку снега', tip_route: 'Враги выбирают путь: где много вышек — обходят. Стрелки показывают, куда пойдут',
    tip_trap: 'Нажми на дорогу — там ставятся баррикады и ловушки', tip_repair: 'Толстяки и метатели ломают вышки! Нажми на вышку и почини её',
    tip_merge: 'Перетащи вышку на такую же — получится сильнее', tip_hero: 'Дед Мороз с тобой! Нажми на него, потом на поле',
    tip_skill: 'Внизу — способности: Метель замедляет всех врагов', tip_tree: 'Взрывы валят деревья — у врагов появляются новые проходы'
  },
  en: {
    title: 'Save the Tree!', play: 'Play', map: 'Map', wave: 'Wave', of: 'of',
    r_forest: 'Snowy Forest', r_village: 'Village', r_lake: 'Frozen Lake', r_mount: 'Mountains', r_pole: 'North Pole',
    lvl: 'Level', escort: 'Escort', boss: 'Boss', defend: 'Defense', locked: 'Clear the previous region',
    start: 'Fight!', nextWave: 'Wave', callEarly: 'Early: +', coins: 'coins',
    t_snow: 'Snowball Tower', t_mg: 'Snow Gatling', t_ice: 'Ice Cannon', t_mortar: 'Firework Mortar', t_tesla: 'Garland Tesla', t_ballista: 'Icicle Ballista',
    t_snowD: 'Reliable tower. Hits flying enemies too.', t_mgD: 'Fires rapid bursts of snowballs. x2 damage to frozen enemies.',
    t_iceD: 'Freezes enemies around the target.', t_mortarD: 'Firework splash. Ground targets only.',
    t_teslaD: 'Lightning chains between enemies. Stronger vs frozen.', t_ballistaD: 'Pierces through. x2 damage to vehicles.',
    e_raccoon: 'Raccoon Thief', e_icicle: 'Icicle', e_fat: 'Frostbelly', e_sled: 'Snowmobile Raccoon', e_crow: 'Balloon Crow',
    e_ram: 'Ram Sled', e_split: 'Slushling', e_splitkid: 'Slushlet', e_plow: 'Snowplow', e_giant: 'Ice Giant', e_chariot: 'Blizzard Chariot',
    e_raccoonD: 'Steals gifts. Basic foot soldier.', e_icicleD: 'Very fast but fragile.', e_fatD: 'Slow and tough.',
    e_sledD: 'Fast armored vehicle. The gatling barely scratches it — use a ballista.', e_crowD: 'Flies straight over the road. Cannon and mortar cannot hit it.',
    e_ramD: 'Breaks barricades 5 times faster.', e_splitD: 'Splits into two little ones.', e_plowD: 'Heavy armor, barely slows down.',
    e_giantD: 'Stomps and stuns nearby towers.', e_chariotD: 'Armored chariot that summons raccoons.',
    armor: 'armor', air: 'flying', vehicle: 'vehicle',
    sell: 'Sell', upgrade: 'Upgrade', target: 'Target', tg_first: 'First', tg_strong: 'Strong', tg_vehicle: 'Vehicle', tg_close: 'Close',
    max: 'MAX', barricade: 'Barricade', barricadeD: 'Holds back ground enemies',
    sk_blizzard: 'Blizzard', sk_bomb: 'Gift Bomb', sk_santa: 'Ho-ho-ho!', tapToBomb: 'Tap the field to drop the gift',
    win: 'Victory!', lose: 'The fortress has fallen!', loseEscort: 'The sleigh was stopped!', retryWave: 'From this wave', retryLevel: 'Restart level',
    adContinue: 'Keep fighting', weaker: 'Weaken wave', weakerD: 'Enemies of this wave are 25% weaker',
    toMap: 'To map', next: 'Next', reward: 'Reward', x2: 'x2 reward', take: 'Collect',
    research: 'Research', r_fort: 'Strong walls', r_fortD: '+4 fortress strength', r_gold: 'Treasury', r_goldD: '+25 starting coins',
    r_skills: 'Quick spells', r_skillsD: '-4% ability cooldown', r_t: '+12% damage',
    settings: 'Pause', music: 'Music', sound: 'Sounds', resume: 'Resume', fullscreen: 'Fullscreen', quit: 'Quit to map',
    howto: 'Build towers on any free snow cell; barricades and traps go on the road. Enemies pick their route — arrows show where they will go. Tap a tower to upgrade or repair it. Grandfather Frost walks the field: tap him, then where to go. Pinch or scroll to zoom. Drag a tower onto an identical one to merge them into a stronger one. Barricades hold enemies back. Abilities are at the bottom.',
    heroic: 'Heroic', heroicD: 'Enemies 60% stronger, no wave retries. Reward: +3 snowflakes.',
    newTower: 'New tower!', newEnemy: 'New enemy!', newSkill: 'New ability!', ok: 'Great!',
    escortT: 'Protect the sleigh!', escortD: 'Grandfather Frost and the Snow Maiden are delivering gifts. Do not let enemies catch the sleigh!',
    deliver: 'Gift delivered!', chest: 'Chest!', chestD: 'You found a hidden stash of snowflakes:',
    dailyT: 'Holiday gift', daysLeft: 'Days until New Year: ', days: '', dailyGen: 'Gift of the day!', happyNY: 'Happy New Year!',
    adStart: '+100 starting coins', adSkill: 'Recharge', adBliz: 'Blizzard for wave', blizOn: 'Blizzard!',
    hint: 'Hint', hint1: 'Build a ballista against vehicles', hint2: 'Mortar and cannon cannot hit crows — use snowball, gatling or tesla',
    hint3: 'Block the road with a barricade before a choke point', hint4: 'Merge identical towers — levels boost damage a lot',
    tut1: 'Tap a plot next to the road and build a tower', tut2: 'Great! Build one more', tut3: 'Press "Wave" when ready',
    tut4: 'Drag a tower onto an identical one to merge', speed: 'Speed', stars: 'Stars',
    sleighHp: 'Sleigh', fortHp: 'Fortress', heroicDone: 'Heroic cleared', ad: 'Ad', record: 'Stars: ',
    bn_giant: 'Ice Giant', bn_chariot: 'Blizzard Chariot', bn_witch: 'Wicked Blizzard Witch', enrage: 'Rage!',
    e_witch: 'Blizzard Witch', e_witchD: 'Freezes nearby towers and summons icicles. The strongest foe.',
    hero: 'Grandfather Frost', heroD: 'Tap Grandfather Frost, then the field — he walks there. His staff hits enemies around him and holds up to 3 ground foes.', heroLvl: 'Hero lvl',
    heroDead: 'Back in', branch: 'Specialize', branchT: 'Choose a specialization',
    br_snow_a: 'Avalanche', br_snow_aD: 'Snowballs deal splash damage', br_snow_b: 'Sniper', br_snow_bD: 'x2.3 damage, longer range, slower',
    br_mg_a: 'Minigun', br_mg_aD: '+60% fire rate', br_mg_b: 'Flak', br_mg_bD: 'x2.5 vs flying, explosive rounds',
    br_ice_a: 'Permafrost', br_ice_aD: 'Up to 82% slow, lasts longer', br_ice_b: 'Ice Storm', br_ice_bD: 'Wider, stronger blast',
    br_mortar_a: 'Cluster Fireworks', br_mortar_aD: 'Splits into 3 small blasts', br_mortar_b: 'Tsar Firework', br_mortar_bD: 'x2.3 damage, huge blast',
    br_tesla_a: 'Ball Garland', br_tesla_aD: '+3 chain targets', br_tesla_b: 'Overload', br_tesla_bD: 'x2 damage, stuns',
    br_ballista_a: 'Triple Volley', br_ballista_aD: '3 icicles in a fan', br_ballista_b: 'Spear', br_ballista_bD: 'x2.2 damage, ignores armor',
    diff: 'Difficulty', d_easy: 'Easy', d_normal: 'Normal', d_heroic: 'Heroic',
    d_easyD: 'More coins, towers +15% damage. Relaxed play.', d_normalD: 'The intended balance.',
    ach: 'Achievements', claim: 'Claim', achDone: 'Claimed',
    a_k100: 'Defeat 100 enemies', a_k1000: 'Defeat 1000 enemies', a_k5000: 'Defeat 5000 enemies', a_boss1: 'Defeat a boss', a_boss5: 'Defeat 5 bosses',
    a_witch: 'Defeat the Blizzard Witch', a_merge10: 'Merge 10 towers', a_branch1: 'Pick a specialization', a_branch10: '10 specializations',
    a_hero50: 'Grandfather Frost: 50 foes', a_hero500: 'Grandfather Frost: 500 foes', a_perfect5: '5 levels with 3 stars', a_perfect20: '20 levels with 3 stars',
    a_escort4: 'Deliver 4 gift convoys', a_heroic3: 'Clear 3 heroic levels', a_endless20: '20 waves in endless mode', a_built100: 'Build 100 towers',
    cos: 'Decorations', cos_fort: 'Fortress', cos_trim: 'Towers', cosNeed: 'Stars needed: ', cosOn: 'Selected',
    mut_fast: 'Enemies are faster', mut_armor: 'Enemies are armored', mut_swarm: 'Bigger hordes', mut_elite: 'More elite enemies', mut_air: 'Crow flocks', mut_build: 'Enemies build twice as fast', mutT: 'Night anomaly', ult_moroz: 'Frost Staff!', ult_sneg: 'Snow Dance!', ult_belka: 'Cone Storm!', ult_plombir: 'Ice-Cream Slam!', squad4: 'Squad grew: now 4 allies!', elite: 'Elite', endless: 'New Year\'s Eve Night', endlessD: 'Huge map, random region. Day turns to night, new lairs open as you go, a mini-boss every 5 waves and a big boss every 10. How long can you hold?', endlessLock: 'Unlocks after region 1',
    endlessOver: 'The night is over', wavesHeld: 'Waves held: ', best: 'Best: ', newRecord: 'New record!',
    zoomHint: 'Pinch or wheel to zoom, drag to pan, double-tap to reset',
    tutHero: 'This is Grandfather Frost! Tap him, then the road — he will hold enemies back', loading: 'Loading', tapStart: 'Tap to start', tipsOpt: 'Tips', squadT: 'Squad', newAlly: 'New ally!',
    al_moroz: 'Grandfather Frost — commander', al_morozD: 'Staff strikes hit an area and freeze, holds two enemies. Good at demolishing structures. Signature: Frost Staff stuns a crowd.',
    al_sneg: 'Snow Maiden — healer', al_snegD: 'Repairs towers and heals the squad nearby, shoots ice arrows that slow. Signature: Snow Dance repairs towers and heals everyone.',
    al_belka: 'Pinecone the Squirrel — scout', al_belkaD: 'The fastest. Throws pinecones from afar, spots enemies in bushes, best at demolishing enemy structures. Signature: Cone Storm.',
    al_plombir: 'Plombir the Snowman — warrior', al_plombirD: 'Huge and sturdy: holds up to four enemies, hits an area with his icicle sword. Signature: Ice-Cream Slam knocks a crowd back.',
    say_moroz: 'Follow me!|They shall not pass!|Staff ready!', say_sneg: 'Coming to heal!|Hold on!|I will help!', say_belka: 'Pinecones ready!|I am fast!|I see them!', say_plombir: 'Halt!|I am the wall!|Ho-ho!', cartoons: 'Cartoons', cutT_intro: 'New Year\'s Eve', cutT_r1: 'Fall of the Giant', cutT_r2: 'The Village Is Saved', cutT_r3: 'Thin Ice', cutT_r4: 'The Pass', cutT_finale: 'The Star Returns', bigMap: 'Big map — drag to explore', bigShort: 'Big map', map: 'Map', chain: 'Chain reaction', e_engineer: 'Carpenter Raccoon', e_engineerD: 'Builds palisades and watchtowers during the wave. Stop him before he finishes!', built_palisade: 'Palisade built', built_watch: 'Watchtower built', built_sentry: 'Sentry built', options: 'Settings', modeStory: 'Story', rating: 'Leaderboard', lbNight: 'Night', lbStars: 'Stars', lbTest: 'Test players — the real leaderboard appears on Yandex Games', overtook: 'You passed', you: 'You', anon: 'Player', e_sculptor: 'Sculptor', e_sculptorD: 'Rolls a snowball from a drift: builds a sentry snowman (no building nearby) or rolls it into a tower.', st_palisade: 'Enemy palisade', st_watch: 'Watchtower', st_sentry: 'Sentry snowman', st_D: 'No building nearby. Break it with a bomb, a mortar or any hero.', st_watchD: 'Weakens our nearby towers. Break it with a bomb, a mortar or any hero.', demolish: 'Demolish', noHero: 'Blow it up with a bomb or mortar', tip_struct: 'Enemies build near their gates. Tap a structure to send Grandfather Frost to demolish it. Coins for each one', enemyZone: 'Enemy ground', on: 'On', off: 'Off', sleighShort: 'Sleigh',
    e_thrower: 'Snowball Raccoon', e_throwerD: 'Stops to pelt towers with snowballs, then runs on.',
    towerLost: 'Tower destroyed!', repair: 'Repair', trapsT: 'Traps', tr_spike: 'Spikes', tr_puddle: 'Puddle', tr_mine: 'Firecracker', tr_snare: 'Snare',
    tr_spikeD: 'Hurts everyone walking over', tr_puddleD: 'Slows a lot', tr_mineD: 'Blows up under an enemy', tr_snareD: 'Holds an enemy in place',
    trapMax: 'At most 6 traps', newTrap: 'New trap!',
    tip_build: 'Build a tower on any free snow cell', tip_route: 'Enemies choose their path and avoid heavy defenses. Arrows show where they will go',
    tip_trap: 'Tap the road to place barricades and traps', tip_repair: 'Brutes and throwers break towers! Tap a tower to repair it',
    tip_merge: 'Drag a tower onto an identical one to make it stronger', tip_hero: 'Grandfather Frost joins you! Tap him, then the field',
    tip_skill: 'Abilities are at the bottom: Blizzard slows every enemy', tip_tree: 'Explosions knock down trees, opening new passages for enemies'
  }
};
Z.LANG = 'ru';
Z.T = function (k) { var d = Z.TXT[Z.LANG] || Z.TXT.ru; return d[k] !== undefined ? d[k] : (Z.TXT.ru[k] !== undefined ? Z.TXT.ru[k] : k); };
Z.detectLang = function (l) {
  l = (l || '').toLowerCase().slice(0, 2);
  return (['ru', 'be', 'kk', 'uk', 'uz', 'ky', 'tg', 'hy', 'az', 'ka', 'tk'].indexOf(l) >= 0) ? 'ru' : 'en';
};
Z.fmt = function (n) {
  n = Math.floor(n);
  if (n < 10000) return '' + n;
  var u = ['K', 'M', 'B'], i = -1, v = n;
  while (v >= 1000 && i < u.length - 1) { v /= 1000; i++; }
  return (v >= 100 ? Math.floor(v) : Math.floor(v * 10) / 10) + u[i];
};
Z.rng = function (seed) {
  var a = seed >>> 0;
  return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
};
})();
