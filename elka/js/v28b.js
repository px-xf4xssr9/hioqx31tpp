/* 2.8.3 · логова боссов — база врага во всю ширину: стены со всех сторон, двор, здания, турели, ворота */
(function () {
'use strict';
var Z = window.Z, D = Z.D, TT = Z.TT;

// уровни с логовом (Калинов мост — отдельный, со своим поединком)
var LAIRS = {
  6:  { th: 'rock', name: ['Берлога великана', 'The Giant\'s Den'], bld: ['hq', 'barracks', 'works', 'power'], tur: 3 },
  13: { th: 'wood', name: ['Острог разбойников', 'The Bandits\' Stockade'], bld: ['hq', 'barracks', 'works', 'power'], tur: 4 },
  27: { th: 'dark', name: ['Замок Кощея', 'Koschei\'s Castle'], bld: ['hq', 'barracks', 'works', 'power'], tur: 5 },
  34: { th: 'ice', name: ['Чертоги Метелицы', 'The Blizzard\'s Halls'], bld: ['hq', 'barracks', 'works', 'power'], tur: 5 }
};
var DEPTH = 5;   // база занимает верхние 5 рядов: задний двор, ряды зданий, плац и передняя стена
var TH = {
  rock: { wall: '#9a8f82', face: '#6e655b', top: '#c2b8aa', dark: '#4e463e', floor: '#cfc6ba', acc: '#ffb347', roof: '#7a6e62', shot: '#7a6e62', ground: 'rgba(120,105,90,' },
  wood: { wall: '#a8743e', face: '#7a5228', top: '#d09a5e', dark: '#5a3a1a', floor: '#e6d6bc', acc: '#e8484f', roof: '#c0392b', shot: '#5a3a20', ground: 'rgba(150,110,70,' },
  dark: { wall: '#5a4e6e', face: '#3a3150', top: '#7a6e90', dark: '#241d34', floor: '#8a8298', acc: '#7fffd0', roof: '#2a2340', shot: '#7fffd0', ground: 'rgba(60,50,80,' },
  ice:  { wall: '#bfe6ff', face: '#86c2ea', top: '#eef9ff', dark: '#5f9fd0', floor: '#dff2ff', acc: '#9fd8ff', roof: '#a8dcff', shot: '#d8f2ff', ground: 'rgba(150,200,240,' }
};
var NAMES = { hq: ['Штаб', 'HQ'], barracks: ['Казарма', 'Barracks'], works: ['Мастерская', 'Workshop'], power: ['Котельная', 'Boiler'], tur: ['Турель', 'Turret'] };
var ICON = { hq: '★', barracks: '⚔', works: '⚙', power: '🔥' };
function lairOf(G) { return G && !G.endless && G.info && G.info.type === 'boss' && LAIRS[G.idx] ? LAIRS[G.idx] : null; }
Z.lairOf = lairOf;

// ---------- карта: генерируем поле на 3 ряда ниже и надстраиваем базу сверху ----------
function shiftLevel(L, S) {
  var W = L.W, k, o;
  var row9 = function () { var a = []; for (var c = 0; c < W; c++) a.push(9); return a; }, row0 = function () { var a = []; for (var c = 0; c < W; c++) a.push(0); return a; };
  for (var i = 0; i < S; i++) { L.grid.unshift(row9()); if (L.hgt) L.hgt.unshift(row0()); }
  ['bush', 'drift', 'ice', 'bridges'].forEach(function (n) { if (!L[n]) return; o = {}; for (k in L[n]) o[+k + S * W] = L[n][k]; L[n] = o; });
  var mainI = L.paths ? L.paths.indexOf(L.main) : -1;
  if (L.paths) L.paths = L.paths.map(function (p) { return p.map(function (q) { return [q[0], q[1] + S]; }); });
  L.main = mainI >= 0 ? L.paths[mainI] : L.main && L.main.map(function (q) { return [q[0], q[1] + S]; });
  if (L.fort) L.fort = [L.fort[0], L.fort[1] + S];
  L.entrances = L.entrances.map(function (e) { return [e[0], e[1] + S]; });
  if (L.spots) L.spots = L.spots.map(function (s) { var n = {}; for (var kk in s) n[kk] = s[kk]; n.r += S; return n; });
  if (L.landmark) L.landmark = { c: L.landmark.c, r: L.landmark.r + S };
  if (L.riverRow !== undefined) L.riverRow += S;
  L.H += S;
}
// дорога от (c, S) вниз до ближайшей существующей дороги — поиск в ширину по пустой земле
function digRoad(L, c, S) {
  var W = L.W, H = L.H, prev = {}, q = [[c, S]], seen = {}; seen[S * W + c] = 1;
  while (q.length) {
    var p = q.shift(), pc = p[0], pr = p[1], v = L.grid[pr][pc];
    if (v === 1 && pr >= S + 2) { var path = [], k = pr * W + pc; while (k !== undefined) { path.unshift([k % W, Math.floor(k / W)]); k = prev[k]; } return path; }
    [[0, 1], [-1, 0], [1, 0], [0, -1]].forEach(function (d) { var nc = pc + d[0], nr = pr + d[1], nk = nr * W + nc; if (nc < 1 || nc > W - 2 || nr < S || nr >= H - 1 || seen[nk]) return; var g = L.grid[nr][nc]; if (g !== 0 && g !== 1) return; if (L.fort && Math.abs(nc - L.fort[0]) <= 1 && nr >= L.fort[1] - 1) return; seen[nk] = 1; prev[nk] = pr * W + pc; q.push([nc, nr]); });
  }
  return null;
}
function addGates(L, want) {
  var W = L.W, S = DEPTH, have = L.entrances.filter(function (e) { return e[1] === S && e[0] > 0 && e[0] < W - 1; }).map(function (e) { return e[0]; });
  var cand = [Math.round(W * 0.2), Math.round(W * 0.8), Math.round(W * 0.5), Math.round(W * 0.35), Math.round(W * 0.65)];
  for (var i = 0; i < cand.length && have.length < want; i++) {
    var c = cand[i]; if (c < 2 || c > W - 3 || have.some(function (h) { return Math.abs(h - c) < 4; })) continue;
    if (L.grid[S][c] !== 0 && L.grid[S][c] !== 1) continue;
    var path = digRoad(L, c, S); if (!path || path.length > W) continue;
    path.forEach(function (q) { L.grid[q[1]][q[0]] = 1; var k = q[1] * W + q[0]; if (L.bush) delete L.bush[k]; if (L.drift) delete L.drift[k]; });
    if (L.spots) L.spots = L.spots.filter(function (sp) { return L.grid[sp.r][sp.c] !== 1; });
    L.entrances.push([c, S]); (L.paths || []).push(path); have.push(c);
  }
}
function layoutBase(L, cfg) {
  var W = L.W, S = DEPTH, gates = [];
  addGates(L, W >= 20 ? 3 : 2);
  L.entrances = L.entrances.map(function (e) {
    if (e[1] !== S || e[0] <= 0 || e[0] >= W - 1) return e;
    gates.push(e[0]);
    for (var r = 0; r < S; r++) L.grid[r][e[0]] = 1;
    (L.paths || []).forEach(function (p) { if (p[0] && p[0][0] === e[0] && p[0][1] === S) for (var r2 = S - 1; r2 >= 0; r2--) p.unshift([e[0], r2]); });
    return [e[0], 0];
  });
  // свободные отрезки двора между воротами и боковыми стенами
  var segs = [], cur = null;
  for (var c = 1; c < W - 1; c++) { var free = gates.indexOf(c) < 0; if (free) { if (!cur) { cur = [c, c]; segs.push(cur); } else cur[1] = c; } else cur = null; }
  var bld = [], mid = (W - 1) / 2;
  function take(w, prefCenter) {
    var best = null, bs = 1e9;
    segs.forEach(function (s) { var len = s[1] - s[0] + 1; if (len < w) return; var c0 = prefCenter ? Math.max(s[0], Math.min(s[1] - w + 1, Math.round(mid - (w - 1) / 2))) : s[0]; var sc = prefCenter ? Math.abs(c0 + (w - 1) / 2 - mid) : -len; if (sc < bs) { bs = sc; best = { s: s, c0: c0 }; } });
    if (!best) return null;
    var s = best.s, a = [s[0], best.c0 - 2], b = [best.c0 + w + 1, s[1]];   // с зазором в клетку
    segs.splice(segs.indexOf(s), 1); if (a[1] >= a[0]) segs.push(a); if (b[1] >= b[0]) segs.push(b);
    return best.c0;
  }
  cfg.bld.forEach(function (k) { var w = k === 'hq' ? 3 : k === 'barracks' ? 3 : 2, c0 = take(w, k === 'hq'); if (c0 === null && w === 3) { w = 2; c0 = take(2, false); } if (c0 === null && w === 2) { c0 = take(1, false); w = 1; } if (c0 !== null) bld.push({ k: k, c: c0, r: k === 'hq' ? 0 : 1, w: w, h: k === 'hq' ? S - 2 : S - 3 }); });
  // турели на передней стене: у ворот, потом по краям
  var tur = [], cand = [];
  gates.forEach(function (g) { cand.push(g - 1, g + 1); }); cand.push(1, W - 2, Math.round(W * 0.3), Math.round(W * 0.7));
  cand.forEach(function (c2) { if (tur.length >= cfg.tur || c2 < 1 || c2 > W - 2 || gates.indexOf(c2) >= 0) return; if (tur.some(function (t) { return Math.abs(t - c2) < 2; })) return; tur.push(c2); });
  if (L.spots) L.spots = L.spots.filter(function (s) { return s.r >= S; });
  // плац перед стеной — проход от дверей зданий к воротам
  for (var yc = 1; yc < W - 1; yc++) L.grid[S - 2][yc] = 1;
  // передняя стена — участки по 2–4 клетки между воротами
  var secs = [], run = null;
  for (var wc = 0; wc < W; wc++) { if (gates.indexOf(wc) >= 0) { run = null; continue; } if (!run || run.c1 - run.c0 + 1 >= 4) { run = { c0: wc, c1: wc }; secs.push(run); } else run.c1 = wc; }
  L.base = { th: cfg.th, S: S, gates: gates, bld: bld, tur: tur, secs: secs };
}
var oGen = Z.genLevel;
Z.genLevel = function (idx, dims) {
  var cfg = LAIRS[idx], info = Z.LEVELS[idx];
  if (!cfg || !info || info.type !== 'boss' || Z.endlessGen) return oGen.apply(this, arguments);
  dims = dims || { W: 10, H: 10 };
  var L = oGen.call(this, idx, { W: dims.W, H: dims.H - DEPTH });
  try {
    if (L.landmark && idx === 27) L.landmark = null;   // «будка» Кощея — теперь настоящий замок
    shiftLevel(L, DEPTH); layoutBase(L, cfg);
  } catch (e) { if (window.__rep) window.__rep(e); }
  return L;
};

// ---------- здания и турели — неподвижные «враги»: по ним бьют вышки, герои и способности ----------
Z.ENEMIES.lairB = { role: 'hut', hp: 300, spd: 0, armor: 4, coin: 80, dmg: 0, size: 1.6, air: false };
Z.ENEMIES.lairT = { role: 'hut', hp: 200, spd: 0, armor: 4, coin: 50, dmg: 0, size: 1.3, air: false };
Z.ENEMIES.lairW = { role: 'hut', hp: 300, spd: 0, armor: 3, coin: 20, dmg: 0, size: 1.4, air: false };
// пушкари: катят пушку, встают и обстреливают вышки издалека
Z.ENEMIES.cannon = { prof: 'walk', role: 'artillery', tdmg: 0, hp: 150, spd: 0.55, armor: 2, coin: 18, dmg: 2, size: 1.2, bar: 30 };
// строитель логова — тот же инженер, но чинит пробитую стену
Z.FIRST.cannon = 99; Z.FIRST.lairW = 99;
Object.assign(Z.TXT.ru, { e_cannon: 'Пушкари', e_cannonD: 'Два енота с пушкой. Выезжают из мастерской логова, встают и обстреливают вышки издалека — бей их первыми', e_lairB: 'Здание логова', e_lairBD: 'За целой стеной неуязвимо. Проломи стену рядом', e_lairT: 'Турель логова', e_lairTD: 'Бьёт по вышкам и героям у стены', e_lairW: 'Стена логова', e_lairWD: 'Проломи — и здания за ней можно бить' });
Object.assign(Z.TXT.en, { e_cannon: 'Cannon crew', e_cannonD: 'Two raccoons with a cannon. They roll out of the lair workshop, set up and shell your towers from afar — hit them first', e_lairB: 'Lair building', e_lairBD: 'Invulnerable behind an intact wall. Breach the wall next to it', e_lairT: 'Lair turret', e_lairTD: 'Hits towers and heroes near the wall', e_lairW: 'Lair wall', e_lairWD: 'Breach it to hit the buildings behind' });
function initBase(G) {
  if (G._baseG === G) return G.base;
  G._baseG = G; G.base = null;
  var cfg = lairOf(G), B = G.L.base; if (!cfg || !B) return null;
  Z.save.seen.e_lairB = 1; Z.save.seen.e_lairT = 1; Z.save.seen.e_lairW = 1;
  var bossT = Z.REGIONS[G.info.region].boss, bh = (Z.ENEMIES[bossT] || { hp: 1500 }).hp * (Z.hpScale ? Z.hpScale(G.idx) : 1);
  var base = G.base = { cfg: cfg, th: B.th, S: B.S, bld: [], tur: [], secs: [], gates: B.gates.map(function (c) { return { c: c, open: 0, hold: 0, wait: 0, iced: 0, cool: 0, n: 0 }; }), shots: [], told: false, fallen: false, hornT: 22, barT: 14, worksT: 18, sorties: 0, strikeUsed: false };
  var HPK = { hq: 0.3, barracks: 0.14, works: 0.14, power: 0.12 };
  B.bld.forEach(function (b) {
    var e = Z.spawn('lairB', 0, 1, { x: b.c + b.w / 2, y: b.r + b.h - 0.02, lane: 0, neutral: true, dleft: 99 });
    if (!e) return; e.bk = b.k; e.bw = b.w; e.bh = b.h; e.hp = e.max = bh * HPK[b.k]; e.armor = 3 + G.info.region; e.size = b.w * 0.8;
    base.bld.push(e);
  });
  (B.secs || []).forEach(function (sc, i) {
    var len = sc.c1 - sc.c0 + 1, e = Z.spawn('lairW', 0, 1, { x: (sc.c0 + sc.c1 + 1) / 2, y: B.S - 0.04, lane: 0, neutral: true, dleft: 99, secI: i });
    if (!e) return; e.hp = e.max = bh * 0.045 * len; e.armor = 2 + G.info.region; e.sec = { c0: sc.c0, c1: sc.c1, broken: false, repT: 0, rep: 0, crew: [] };
    base.secs.push(e);
  });
  B.tur.forEach(function (c, i) {
    var e = Z.spawn('lairT', 0, 1, { x: c + 0.5, y: B.S - 0.03, lane: 0, neutral: true, dleft: 99, lairI: i });
    if (!e) return; e.hp = e.max = bh * 0.07; e.armor = 3 + G.info.region; e.cd = 1.5 + i * 0.6;
    base.tur.push(e);
  });
  return base;
}
function has(b, k) { return !!b && b.bld.some(function (e) { return e.bk === k && !e.dead; }); }
function aliveAll(b) { return b ? b.bld.concat(b.tur).filter(function (e) { return !e.dead; }).length : 0; }
Z.baseHas = function (k) { return has(Z.G && Z.G.base, k); };

// ---------- турели ----------
function turHas(G, b, e) {
  var R = 3.3 * (has(b, 'power') ? 1.25 : 1), x = e.x, y = e.y - 0.4;
  for (var k in G.towers) { var tw = G.towers[k]; if (Math.hypot(tw.c + 0.5 - x, tw.r + 0.5 - y) < R) return true; }
  return (G.squad || []).some(function (H) { return !H.dead && Math.hypot(H.x - x, H.y - y) < R * 0.9; });
}
function turShoot(G, b, e) {
  var pw = has(b, 'power'), R = 3.3 * (pw ? 1.25 : 1), best = null, bd = R, x = e.x, y = e.y - 0.4;
  for (var k in G.towers) { var tw = G.towers[k], d = Math.hypot(tw.c + 0.5 - x, tw.r + 0.5 - y); if (d < bd) { bd = d; best = { tw: tw, x: tw.c + 0.5, y: tw.r + 0.3 }; } }
  (G.squad || []).forEach(function (H) { if (H.dead) return; var d = Math.hypot(H.x - x, H.y - y); if (d < Math.min(bd, R * 0.9)) { bd = d; best = { h: H, x: H.x, y: H.y - 0.4 }; } });
  if (!best) return false;
  e.firedAt = Z.time; e.aimX = best.x - x;
  b.shots.push({ x0: x, y0: y - 0.6, x1: best.x, y1: best.y, t: 0, dur: b.th === 'rock' ? 0.9 : b.th === 'wood' ? 0.35 : 0.6, tgt: best });
  if (Z.AU.at) Z.AU.at(x, y); Z.AU.sfx(b.th === 'rock' ? 'pot_launch' : b.th === 'ice' ? 'freeze' : b.th === 'dark' ? 'magic_ball' : 'whistle', 0.4);
  return true;
}
function shotHit(G, b, s) {
  var t = s.tgt, k = 1 + G.info.region * 0.05;
  if (t.tw && G.towers[Z.cellKey(t.tw.c, t.tw.r)]) {
    Z.damageTower(t.tw, t.tw.max * (b.th === 'ice' ? 0.07 : b.th === 'rock' ? 0.11 : 0.08) * k);
    t.tw.stun = Math.max(t.tw.stun || 0, b.th === 'ice' ? 1.6 : b.th === 'rock' ? 0.8 : 0.4);
  } else if (t.h && !t.h.dead) { t.h.hp -= t.h.max * 0.1 * k; t.h.hitT = 0.2; if (b.th === 'ice') t.h.stunT = Math.max(t.h.stunT || 0, 1.2); }
  if (b.th === 'dark') { var boss = G.enemies.filter(function (q) { return q.boss && !q.dead; })[0]; if (boss) boss.hp = Math.min(boss.max, boss.hp + boss.max * 0.005); }
  G.fx.push({ k: 'ring', x: s.x1, y: s.y1, r: 0.6, t: 0, dur: 0.4, col: TH[b.th].acc });
  if (b.th === 'rock') { G.shake = Math.max(G.shake || 0, 0.15); Z.AU.sfx('crack', 0.35); }
}

// ---------- выходы из базы: казарма, мастерская ----------
function gateIndex(G, g) { var i = G.L.entrances.findIndex(function (e) { return e[0] === g.c && e[1] === 0; }); return i < 0 ? 0 : i; }
function release(G, b, types, n, mul) {
  var gs = b.gates; if (!gs.length) return;
  var g = gs[b.sorties % gs.length]; b.sorties++;
  for (var i = 0; i < n; i++) Z.spawn(types[i % types.length], gateIndex(G, g), (G.waveMul || 1) * mul, { x: g.c + 0.5 + (Math.random() - 0.5) * 0.3, y: -0.3 - i * 0.4 });
}
function barracks(G, b) {
  var LIGHT = { raccoon: 1, icicle: 1, thrower: 1, split: 1 }, pool = Z.REGIONS[G.info.region].pool.filter(function (t) { return LIGHT[t] && (Z.FIRST[t] === undefined || Z.FIRST[t] <= G.idx); });
  if (!pool.length) pool = ['raccoon'];
  var grow = Math.min(4, Math.floor(b.sorties / 2));   // если казарму не трогать, отряды растут
  var n = 2 + Math.floor(G.info.region / 3) + grow, types = [];
  for (var i = 0; i < n; i++) types.push(pool[Math.floor(Math.random() * pool.length)]);
  release(G, b, types, n, 0.45);
  Z._.addText(TT('Казарма: отряд ×', 'Barracks: squad ×') + n, G.L.W / 2, b.S + 0.3, '#ff9a9a', 1.4, 0.7);
}
function works(G, b) {
  b.worksN = (b.worksN || 0) + 1;
  var m3 = b.worksN % 3, t = m3 === 1 ? 'cannon' : m3 === 2 && Z.ENEMIES.van && G.idx >= 8 ? 'van' : G.info.region >= 3 && (Z.FIRST.plow === undefined || Z.FIRST.plow <= G.idx) && Math.random() < 0.5 ? 'plow' : 'sled';   // 2.10: и фургон-енотовоз
  if (t === 'cannon') { release(G, b, ['cannon'], 1, 0.55); Z._.addText(TT('Мастерская: пушкари!', 'Workshop: cannon crew!'), G.L.W / 2, b.S + 0.3, '#ffcf6a', 1.6, 0.8); return; }
  release(G, b, [t], 1, 0.6);
  Z._.addText(TT('Мастерская: ', 'Workshop: ') + (t === 'van' ? TT('енотовоз', 'raccoon van') : t === 'plow' ? TT('снегоуборщик', 'snowplow') : TT('сани', 'sled')), G.L.W / 2, b.S + 0.3, '#ffcf6a', 1.4, 0.7);
}


// ---------- стена по участкам, пролом, строители ----------
function secOfCol(b, c) { for (var i = 0; i < b.secs.length; i++) { var q = b.secs[i].sec; if (c >= q.c0 && c <= q.c1) return b.secs[i]; } return null; }
function breachNear(b, c0, c1) { return b.secs.some(function (w) { return w.sec.broken && w.sec.c1 >= c0 - 1 && w.sec.c0 <= c1 + 1; }); }
function bldProtected(b, e) { if (!b || b.fallen || e.type !== 'lairB') return false; var c0 = Math.floor(e.x - e.bw / 2), c1 = Math.ceil(e.x + e.bw / 2) - 1; return !breachNear(b, c0, c1); }
Z.lairProtected = function (e) { var G = Z.G; return bldProtected(G && G.base, e); };
function setSecGrid(G, b, sec, v) { for (var c = sec.c0; c <= sec.c1; c++) G.L.grid[b.S - 1][c] = v; if (Z.navDirty) Z.navDirty(); }
function doorOf(b, kinds) { for (var i = 0; i < kinds.length; i++) { var e = b.bld.filter(function (q) { return q.bk === kinds[i] && !q.dead; })[0]; if (e) return e; } return null; }
function breakSec(G, b, w) {
  var sec = w.sec; if (!sec) return; sec.broken = true; sec.repT = 18; sec.rep = 0; sec.crew = [];
  setSecGrid(G, b, sec, 1);
  for (var c = sec.c0; c <= sec.c1; c++) { G.decals.push({ k: 'rubble', x: c + 0.5, y: b.S - 0.5, s: 1.3, rot: Math.random() * 6, col: TH[b.th].wall }); Z._.snowPuff(c + 0.5, b.S - 0.6, 10); }
  // турели на этом участке рушатся вместе с ним
  b.tur.forEach(function (t2) { if (!t2.dead && t2.x - 0.5 >= sec.c0 && t2.x - 0.5 <= sec.c1) Z.damage(t2, t2.max * 3, { pierceArmor: true }); });
  G.shake = Math.max(G.shake || 0, 0.8); Z.AU.sfx('big_boom', 0.8); Z.AU.sfx('tower_fall', 0.7);
  G.banner = { text: TT('Стена проломлена!', 'The wall is breached!'), sub: TT('Здания за проломом теперь можно бить. Скоро придут строители — не дай им залатать', 'Buildings behind the breach can be hit now. Builders will come soon — stop them'), t: 2.8 };
}
function repairTick(G, b, w, dt) {
  var sec = w.sec; if (!sec.broken || b.fallen) return;
  sec.crew = sec.crew.filter(function (e) { return !e.dead; });
  if (!sec.crew.length) {
    if (sec.rep > 0 && sec.sent) { sec.repT = 22; sec.sent = false; }   // бригаду перебили — пролом остаётся, новая придёт позже
    sec.repT -= dt;
    if (sec.repT <= 0) {
      var home = doorOf(b, ['works', 'hq', 'barracks', 'power']); if (!home) { sec.repT = 1e9; return; }
      for (var i = 0; i < 2; i++) { var e = oSpawn('engineer', 0, (G.waveMul || 1) * 0.6, { x: home.x + (i - 0.5) * 0.3, y: b.S - 1.75, repairOf: w, fromDoor: home }); if (e) { e.emT = 0; sec.crew.push(e); } }
      home.doorT = 0.8; sec.sent = true; sec.repT = 999;
      Z._.addText(TT('Строители!', 'Builders!'), (sec.c0 + sec.c1 + 1) / 2, b.S + 0.3, '#ffcf6a', 1.6, 0.8);
    }
  }
}
function finishRepair(G, b, w) {
  var sec = w.sec; sec.broken = false; sec.rep = 0; sec.sent = false;
  setSecGrid(G, b, sec, 9);
  // убрать врагов, оказавшихся внутри стены
  G.enemies.forEach(function (q) { if (!q.dead && !q.neutral && Math.floor(q.y) === b.S - 1 && q.x >= sec.c0 && q.x < sec.c1 + 1) q.y = b.S - 1.6; });
  var e = oSpawn('lairW', 0, 1, { x: (sec.c0 + sec.c1 + 1) / 2, y: b.S - 0.04, lane: 0, neutral: true, dleft: 99, secI: w.secI });
  if (e) { e.hp = w.max * 0.6; e.max = w.max; e.armor = w.armor; e.sec = sec; b.secs[b.secs.indexOf(w)] = e; }
  sec.crew.forEach(function (q) { q.dead = true; q.gone = true; }); sec.crew = [];
  Z.AU.sfx('tw_build', 0.7); Z._.addText(TT('Стену залатали', 'Wall repaired'), (sec.c0 + sec.c1 + 1) / 2, b.S + 0.3, '#ff9a9a', 1.6, 0.8);
}
// строитель идёт к пролому и чинит; пушкарь выбирает позицию и стреляет
function builderStep(G, b, e, dt) {
  var w = e.repairOf, sec = w.sec;
  if (!sec.broken) { e.dead = true; e.gone = true; return true; }
  var tx = (sec.c0 + sec.c1 + 1) / 2 + (sec.crew.indexOf(e) ? 0.35 : -0.35), ty = b.S - 1.45, dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
  if (d > 0.08) { var st = Math.min(d, 1.1 * dt); e.x += dx / d * st; e.y += dy / d * st; e.dir = dx > 0 ? 1 : -1; e.walk += dt * 6; return true; }
  e.busyT = 0.3; e.lunge = (Z.time * 3) % 1 < 0.2 ? 0.2 : 0; e.walk += dt;
  sec.rep += dt / 10 * (sec.crew.length >= 2 ? 0.5 : 0.35);
  if (sec.rep >= 1) finishRepair(G, b, w);
  return true;
}
function towerNear(G, x, y, R) { var best = null, bd = R; for (var k in G.towers) { var tw = G.towers[k], d = Math.hypot(tw.c + 0.5 - x, tw.r + 0.5 - y); if (d < bd) { bd = d; best = tw; } } return best; }
function cannonStep(G, e, dt) {
  e.fk = e.fk === undefined ? 9 : e.fk + dt;
  var S = G.base ? G.base.S : 0, tw = e.y > S + 0.6 ? towerNear(G, e.x, e.y, 4.3) : null;
  if (e.cst === 'roll' || !e.cst) {
    if (tw) { e.cst = 'aim'; e.aimT = 1.1; e.lostT = 0; }
    return false;
  }
  if (!tw) { e.lostT = (e.lostT || 0) + dt; if (e.lostT > 1.5) e.cst = 'roll'; return true; }
  e.lostT = 0; e.busyT = 0.3; e.dir = tw.c + 0.5 > e.x ? 1 : -1;
  e.aimT -= dt;
  if (e.aimT <= 0) {
    e.aimT = 3.4; e.fk = 0; e.cst = 'aim';
    (G.cShots || (G.cShots = [])).push({ x0: e.x + e.dir * 0.5, y0: e.y - 0.55, x1: tw.c + 0.5, y1: tw.r + 0.3, t: 0, dur: 0.75, tw: tw, k: 1 + G.info.region * 0.05 });
    Z.AU.at && Z.AU.at(e.x, e.y); Z.AU.sfx('barrel_boom', 0.55); G.shake = Math.max(G.shake || 0, 0.12);
  }
  return true;
}
// ---------- ворота: враги копятся во дворе и выходят толпой ----------
var oEnemy = Z.hk.enemy;
Z.hk.enemy = function (e, dt, v) {
  if (e.repairOf) { var Gb = Z.G; return Gb.base ? builderStep(Gb, Gb.base, e, dt) : true; }
  if (e.type === 'cannon' && cannonStep(Z.G, e, dt)) return true;
  if (e.type === 'lairW') { e.dleft = 99; e.kb = 0; e.stun = 0; return true; }
  if (e.type === 'lairB' || e.type === 'lairT') {
    var G = Z.G, b = G.base; e.dleft = 99; e.kb = 0; e.stun = 0;
    if (!b) { e.dead = true; return true; }
    if (e.type === 'lairT') {
      e.cd -= dt;
      // 2.11.5: турель замахивается только в бою и когда в досягаемости есть вышка или герой — иначе стоит спокойно
      if (e.cd < 0.8 && !(G.phase === 'wave' && turHas(G, b, e))) { e.cd = 0.8; return true; }
      if (e.cd <= 0) e.cd = turShoot(G, b, e) ? Math.max(2.3, 2.9 - G.info.region * 0.12) * (has(b, 'power') ? 0.75 : 1) : 0.8;
    }
    return true;
  }
  // замороженные ворота держат врагов во дворе (там их не достать)
  var G2 = Z.G, b2 = G2 && G2.base;
  if (b2 && !b2.fallen && !e.air && e.y < b2.S - 0.25 && e.y > b2.S - 1.6) {
    var g = b2.gates.filter(function (q) { return Math.abs(e.x - q.c - 0.5) < 0.7; })[0];
    if (g && g.iced > 0) { g.n++; e.busyT = 0.3; e.walk += dt; return true; }
  }
  return oEnemy ? oEnemy(e, dt, v) : false;
};
// трубит штаб — вышедшие враги бегут быстрее
var oSpeed = Z.hk.speed;
Z.hk.speed = function (e, pos, k) { var r = oSpeed ? oSpeed(e, pos, k) : k; return e.hornT > 0 ? r * 1.35 : r; };

var oKill = Z.hk.kill;
Z.hk.kill = function (e) {
  if (oKill) oKill(e);
  var G = Z.G, b = G.base; if (!b) return;
  if (e.type === 'lairW') { breakSec(G, b, e); return; }
  if (e.type !== 'lairB' && e.type !== 'lairT') return;
  G.decals.push({ k: 'rubble', x: e.x, y: e.y - 0.2, s: e.type === 'lairB' ? 2 : 1.4, rot: Math.random() * 6, col: TH[b.th].wall });
  G.shake = Math.max(G.shake || 0, 0.6); Z.AU.sfx('tower_fall', 0.9); G.fx.push({ k: 'boom', x: e.x, y: e.y - 0.5, t: 0, dur: 0.7 });
  if (!aliveAll(b)) { fall(G, b); return; }
  var k = e.bk || 'tur', nm = TT(NAMES[k][0], NAMES[k][1]);
  var what = { hq: TT('Щит с босса снят, сбор больше не трубят', 'The boss loses its shield, no more war horn'), barracks: TT('Отряды из казармы больше не выходят', 'No more squads from the barracks'), works: TT('Сани, фургоны и снегоуборщики больше не выходят', 'No more sleds, vans and snowplows'), power: TT('Турели стреляют реже и ближе', 'Turrets fire slower and shorter'), tur: TT('Осталось зданий и турелей: ', 'Buildings and turrets left: ') + aliveAll(b) }[k];
  G.banner = { text: nm + TT(k === 'hq' ? ' разрушен!' : ' разрушена!', ' destroyed!'), sub: what, t: 2.4 };
};
function fall(G, b) {
  b.fallen = true; b.gates.forEach(function (g) { g.open = 1; g.iced = 0; });
  G.banner = { text: TT('Логово пало!', 'The lair has fallen!'), sub: TT('Босс оглушён и ослаб', 'The boss is stunned and weakened'), t: 3, big: true };
  G.shake = 1; G.flash = 0.35; Z.AU.sfx('big_boom', 1);
  G.coins += 150; Z._.addText('+150', G.L.W / 2, 1.4, '#ffd54a', 1.6, 1);
  G.enemies.forEach(function (e) { if (e.boss && !e.dead) { e.stun = Math.max(e.stun || 0, 4); Z.damage(e, e.max * 0.15, { pierceArmor: true }); } });
}
var oUnt = Z.hk.untargetable;
Z.hk.untargetable = function (e) { if (oUnt && oUnt(e)) return true; var G = Z.G, b = G && G.base; if (!b) return false; if (e.type === 'lairB') return bldProtected(b, e); if (e.repairOf) return false; return !!(!b.fallen && !e.neutral && e.y < b.S - 0.15); };
function turretsAlive(b) { return b ? b.tur.filter(function (e) { return !e.dead; }).length : 0; }
function coverK(G, b, e) { if (!b || b.fallen || e.neutral || e.air) return 0; if (e.y > b.S + 3 || e.y < b.S - 0.2) return 0; var n = turretsAlive(b); return Math.min(0.6, 0.15 * n); }
// штаб держит щит на боссе; у стены враги под прикрытием турелей
var oDmg = Z.hk.dmg;
Z.hk.dmg = function (e, real, opts) {
  var r = oDmg ? oDmg(e, real, opts) : real, G = Z.G, b = G && G.base;
  if (r > 0 && e.boss && has(b, 'hq')) { r *= 0.55; e.lairHit = 0.3; }
  if (r > 0 && b) { var k = coverK(G, b, e); if (k) { r *= 1 - k; e.covT = 0.25; } }
  if (r > 0 && b && !b.fallen && !e.neutral && !e.repairOf && e.y < b.S - 0.15) r = 0;   // за стеной (брызги взрыва) — не задевает
  if (r > 0 && e.type === 'lairB' && bldProtected(b, e)) r = 0;   // здание за целой стеной
  return r;
};
var oSpawn = Z.spawn;
// враги выходят из дверей зданий (казарма, мастерская, чертог), а не из-за края карты
Z.spawn = function (type, pathIdx, hpMul, opts) {
  var e = oSpawn.apply(this, arguments), G = Z.G, b = G && G.base;
  if (!e || !b || e.neutral || e.repairOf) return e;
  if (e.boss && b.fallen) e.hp *= 0.85;
  if (e.y < 1 && !e.air) {
    var home = e.boss ? doorOf(b, ['hq', 'barracks', 'works']) : type === 'cannon' || Z.ENEMIES[type].vehicle ? doorOf(b, ['works', 'barracks', 'hq']) : doorOf(b, ['barracks', 'hq', 'works', 'power']);
    if (home) { e.x = home.x + (Math.random() - 0.5) * Math.min(1, home.bw * 0.4); e.y = b.S - 1.75; home.doorT = 0.7; }
    else { var g = b.gates[Math.floor(Math.random() * b.gates.length)]; if (g !== undefined) { e.x = g.c + 0.5; e.y = b.S - 1.6; } }
    e.emT = 0; e.doorIn = 0.5;
  }
  return e;
};
var oDS = Z.denShield;
if (oDS) Z.denShield = function (e) { return e && e.neutral ? 0 : oDS(e); };

var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!G || !lairOf(G)) return;
  var b = initBase(G); if (!b) return;
  var fight = G.phase === 'wave';
  if (fight && !b.told) { b.told = true; G.banner = { text: TT(b.cfg.name[0], b.cfg.name[1]), sub: TT('За стенами врагов не достать, у ворот их прикрывают турели. Ломай турели и здания! Ворота можно заморозить (40 монет)', 'Turrets hit your towers, barracks send squads, the HQ shields the boss. Break the buildings! Tap a gate to freeze it (40 coins)'), t: 4.5, big: true }; }
  b.shots = b.shots.filter(function (s) { s.t += dt; if (s.t >= s.dur) { shotHit(G, b, s); return false; } return true; });
  b.gates.forEach(function (g) {
    g.waiting = g.n; g.n = 0;
    if (g.iced > 0) { g.iced -= dt; g.open = Math.max(0, g.open - dt * 2); return; }
    if (b.fallen) { g.open = 1; return; }
    var near = G.enemies.some(function (q) { return !q.dead && !q.neutral && !q.air && Math.abs(q.x - g.c - 0.5) < 0.9 && q.y > b.S - 2.2 && q.y < b.S + 0.6; });
    if (near && g.open < 0.05) Z.AU.sfx('metal', 0.35, { pitch: 0.7, gap: 0.5 });
    g.open = near ? Math.min(1, g.open + dt * 4) : Math.max(0, g.open - dt * 1.5);
  });
  // герои за стены не заходят
  // 2.12.36: через пролом (и когда логово пало) — во двор, на плац перед зданиями: оттуда герои бьют здания
  var limAt = function (x) { if (b.fallen) return 0.6; for (var i = 0; i < b.secs.length; i++) { var q = b.secs[i].sec; if (q && q.broken && x >= q.c0 - 0.2 && x <= q.c1 + 1.2) return b.S - 1.75; } return b.S + 0.3; };
  (G.squad || []).forEach(function (H) { if (H.dead) return; var lim = limAt(H.x); if (H.y < lim) H.y = lim; if (H.ty !== undefined && H.ty < limAt(H.tx !== undefined ? H.tx : H.x)) H.ty = limAt(H.tx !== undefined ? H.tx : H.x); if (H.home && H.home.y < limAt(H.home.x)) H.home.y = limAt(H.home.x); });
  if (b.strike) strikeTick(G, b, dt);
  b.secs.forEach(function (w) { if (w.sec.broken) repairTick(G, b, w, dt); });
  b.bld.forEach(function (q) { if (q.doorT > 0) q.doorT -= dt; });
  G.enemies.forEach(function (q) { if (q.doorIn > 0) q.doorIn -= dt; });
  if (G.cShots) G.cShots = G.cShots.filter(function (c2) { c2.t += dt; if (c2.t < c2.dur) return true; var tw = c2.tw; if (tw && G.towers[Z.cellKey(tw.c, tw.r)]) { Z.damageTower(tw, tw.max * 0.09 * c2.k); tw.stun = Math.max(tw.stun || 0, 0.6); } G.fx.push({ k: 'boom', x: c2.x1, y: c2.y1, t: 0, dur: 0.5 }); Z.AU.sfx('crack', 0.4); return false; });
  if (b.hornFx > 0) b.hornFx -= dt;
  G.enemies.forEach(function (e) { if (e.hornT > 0) e.hornT -= dt; });
  if (!fight || b.fallen) return;
  if (has(b, 'barracks') && G.wave >= 2) { b.barT -= dt; if (b.barT <= 0) { b.barT = 30 - G.info.region; barracks(G, b); } }
  if (has(b, 'works') && G.wave >= 3) { b.worksT -= dt; if (b.worksT <= 0) { b.worksT = 36 - G.info.region * 1.5; works(G, b); } }
  if (has(b, 'hq')) {
    b.hornT -= dt;
    if (b.hornT <= 0) { b.hornT = 32; b.hornFx = 1.2; Z.AU.sfx('boss_horn', 0.7); Z._.addText(TT('Сбор! Враги бегут быстрее', 'War horn! Enemies run faster'), G.L.W / 2, b.S + 0.6, '#ff6b6b', 2, 0.8); G.enemies.forEach(function (e) { if (!e.dead && !e.neutral && !e.boss && e.y < G.L.H * 0.55) e.hornT = 6; }); }
  }
};
// ворота: нажать — заморозить на 20 с за 40 монет (враги копятся во дворе)
var oTap = Z.mechTap;
Z.mechTap = function (c, r) {
  var G = Z.G, b = G && G.base;
  if (b && !b.fallen && r <= b.S) {
    var g = b.gates.filter(function (q) { return q.c === c; })[0];
    if (g && r >= b.S - 1) {
      if (g.iced > 0) { Z._.addText(TT('Уже заморожены', 'Already frozen'), c + 0.5, b.S + 0.3, '#bfe6ff', 1, 0.6); return true; }
      if (G.coins < 40) { Z._.addText(TT('Нужно 40 монет', 'Need 40 coins'), c + 0.5, b.S + 0.3, '#ff8a8a', 1, 0.6); Z.AU.sfx('error', 0.5); return true; }
      G.coins -= 40; g.iced = 20; g.hold = 0;
      Z._.snowPuff(c + 0.5, b.S - 0.4, 16); Z.AU.sfx('freeze', 0.9); Z.AU.sfx('ice_break', 0.5);
      Z._.addText(TT('Ворота заморожены!', 'Gate frozen!'), c + 0.5, b.S + 0.3, '#bfe6ff', 1.3, 0.7);
      return true;
    }
    if (r < b.S) return true;   // по базе — не строим
  }
  return oTap ? oTap(c, r) : false;
};

// ---------- «Удар Деда Мороза» за рекламу: гигантская сосулька сносит здание ----------
function strike(G, b) {
  var t = b.bld.filter(function (e) { return !e.dead; }).sort(function (p, q) { return ((q.bk === 'hq') - (p.bk === 'hq')) || (q.hp - p.hp); })[0] || b.tur.filter(function (e) { return !e.dead; })[0];
  if (t) b.strike = { e: t, t: 0 };
}
function strikeTick(G, b, dt) {
  var s = b.strike; s.t += dt;
  if (s.t >= 1.1 && !s.hit) { s.hit = true; Z.damage(s.e, s.e.max * 2, { pierceArmor: true }); G.shake = 1; G.flash = 0.4; Z.AU.sfx('ice_break', 1); Z.AU.sfx('big_boom', 0.9); for (var i = 0; i < 3; i++) Z._.snowPuff(s.e.x, s.e.y - 0.5, 20); }
  if (s.t > 1.8) b.strike = null;
}

// ---------- рисование ----------
function block(ctx, x, y, w, h, topH, T) { ctx.fillStyle = T.face; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); ctx.fillStyle = T.top; ctx.fillRect(x, y - topH, w, topH); ctx.strokeRect(x, y - topH, w, topH); }
function crenels(ctx, x0, x1, y, h, col) { var n = Math.max(2, Math.round((x1 - x0) / (h * 1.6))), w = (x1 - x0) / n; ctx.fillStyle = col; for (var i = 0; i < n; i += 2) { ctx.fillRect(x0 + i * w, y - h, w, h); ctx.strokeRect(x0 + i * w, y - h, w, h); } }
function stoneLines(ctx, x, y, w, h, col, lw, rows) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw * 0.6; var rh = h / rows, bw = rh * 1.8; for (var r = 1; r <= rows; r++) { var yy = y + rh * r; if (r < rows) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); } for (var xx = x + (r % 2) * bw * 0.5 + bw; xx < x + w - 1; xx += bw) { ctx.beginPath(); ctx.moveTo(xx, yy - rh); ctx.lineTo(xx, yy); ctx.stroke(); } } ctx.restore(); }
function palisade(ctx, x, y, w, h, T) { var n = Math.max(2, Math.round(w / (h * 0.32))), sw = w / n; for (var i = 0; i < n; i++) { var sx = x + i * sw; ctx.fillStyle = i % 2 ? T.wall : T.face; ctx.beginPath(); ctx.moveTo(sx, y + h); ctx.lineTo(sx, y + sw * 0.6); ctx.lineTo(sx + sw / 2, y); ctx.lineTo(sx + sw, y + sw * 0.6); ctx.lineTo(sx + sw, y + h); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
function iceSpikes(ctx, x, y, w, T) { var n = Math.max(2, Math.round(w / 14)); ctx.fillStyle = T.top; ctx.beginPath(); ctx.moveTo(x, y); for (var i = 0; i < n; i++) { var a = x + w * i / n, b = x + w * (i + 1) / n; ctx.lineTo((a + b) / 2, y - (b - a) * (0.7 + (i % 2) * 0.5)); ctx.lineTo(b, y); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
function wallSeg(ctx, th, x, y, w, h, cs, lw) {
  var T = TH[th];
  if (th === 'wood') { palisade(ctx, x, y - h - cs * 0.25, w, h + cs * 0.25, T); return; }
  block(ctx, x, y - h, w, h, cs * 0.22, T);
  if (th === 'ice') { iceSpikes(ctx, x, y - h - cs * 0.22, w, T); ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x + w * 0.2, y - h * 0.15); ctx.lineTo(x + w * 0.35, y - h * 0.85); ctx.stroke(); ctx.restore(); }
  else { stoneLines(ctx, x, y - h, w, h, T.dark, lw, 3); crenels(ctx, x, x + w, y - h - cs * 0.22, cs * 0.18, T.top); }
}
function cornerTower(ctx, th, x, y, cs, lw, t) {
  var T = TH[th], w = cs * 0.8, h = cs * 1.45;
  if (th === 'wood') { ctx.fillStyle = T.face; ctx.fillRect(x - w / 2, y - h, w, h); ctx.strokeRect(x - w / 2, y - h, w, h); ctx.strokeStyle = T.dark; for (var yy = y - h + cs * 0.25; yy < y; yy += cs * 0.25) { ctx.beginPath(); ctx.moveTo(x - w / 2, yy); ctx.lineTo(x + w / 2, yy); ctx.stroke(); } ctx.strokeStyle = D.OL; ctx.fillStyle = T.roof; ctx.beginPath(); ctx.moveTo(x - w * 0.65, y - h); ctx.lineTo(x, y - h - cs * 0.55); ctx.lineTo(x + w * 0.65, y - h); ctx.closePath(); ctx.fill(); ctx.stroke(); return; }
  if (th === 'ice') { ctx.fillStyle = T.face; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w * 0.4, y - h); ctx.lineTo(x, y - h - cs * 0.6); ctx.lineTo(x + w * 0.4, y - h); ctx.lineTo(x + w / 2, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.save(); ctx.globalAlpha = 0.6; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - w * 0.1, y - h * 0.2); ctx.lineTo(x - w * 0.02, y - h); ctx.stroke(); ctx.restore(); return; }
  ctx.fillStyle = T.face; ctx.fillRect(x - w / 2, y - h, w, h); ctx.strokeRect(x - w / 2, y - h, w, h); stoneLines(ctx, x - w / 2, y - h, w, h, T.dark, lw, 4);
  ctx.fillStyle = T.top; ctx.fillRect(x - w / 2 - cs * 0.06, y - h - cs * 0.2, w + cs * 0.12, cs * 0.2); ctx.strokeRect(x - w / 2 - cs * 0.06, y - h - cs * 0.2, w + cs * 0.12, cs * 0.2);
  crenels(ctx, x - w / 2 - cs * 0.06, x + w / 2 + cs * 0.06, y - h - cs * 0.2, cs * 0.17, T.top);
  if (th === 'dark') { ctx.fillStyle = T.roof; ctx.beginPath(); ctx.moveTo(x - w * 0.45, y - h - cs * 0.37); ctx.lineTo(x, y - h - cs * 1.05); ctx.lineTo(x + w * 0.45, y - h - cs * 0.37); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 4 + x); D.circ(x, y - h - cs * 1.1, cs * 0.07, T.acc); ctx.globalAlpha = 1; }
  D.rr(x - cs * 0.07, y - h * 0.62, cs * 0.14, cs * 0.24, cs * 0.06); ctx.fillStyle = '#2a2230'; ctx.fill();
}
// задняя и боковые стены
function drawBack(ctx, X, Y, cs, t, b, G) {
  var T = TH[b.th], W = G.L.W, S = b.S, lw = Math.max(1.5, cs * 0.05);
  ctx.save(); ctx.lineWidth = lw; ctx.strokeStyle = D.OL;
  for (var c = 0; c < W; c++) { if (b.gates.indexOf(c) >= 0) { ctx.fillStyle = '#1a1620'; ctx.fillRect(X(c) + cs * 0.12, Y(0) - cs * 0.85, cs * 0.76, cs * 0.9); } else wallSeg(ctx, b.th, X(c), Y(0) + cs * 0.05, cs, cs * 0.8, cs, lw); }
  [0, W - 1].forEach(function (c2) {
    var x = X(c2) + (c2 === 0 ? cs * 0.08 : cs * 0.42), w = cs * 0.5, y0 = Y(0) - cs * 0.6, y1 = Y(S) - cs * 0.3;
    if (b.th === 'wood') { palisade(ctx, x - cs * 0.05, y0, w + cs * 0.1, y1 - y0, T); return; }
    ctx.fillStyle = T.top; ctx.fillRect(x, y0, w, y1 - y0); ctx.strokeRect(x, y0, w, y1 - y0);
    var fx = c2 === 0 ? x + w : x - cs * 0.14; ctx.fillStyle = T.face; ctx.fillRect(fx, y0, cs * 0.14, y1 - y0); ctx.strokeRect(fx, y0, cs * 0.14, y1 - y0);
    if (b.th !== 'ice') { var cx0 = c2 === 0 ? x + w * 0.55 : x; ctx.fillStyle = T.top; for (var yy = y0 + cs * 0.15; yy < y1 - cs * 0.1; yy += cs * 0.42) { ctx.fillRect(cx0, yy, w * 0.45, cs * 0.2); ctx.strokeRect(cx0, yy, w * 0.45, cs * 0.2); } }
  });
  cornerTower(ctx, b.th, X(0) + cs * 0.33, Y(0) + cs * 0.1, cs, lw, t); cornerTower(ctx, b.th, X(W) - cs * 0.33, Y(0) + cs * 0.1, cs, lw, t);
  ctx.restore();
}
// передняя стена с воротами — после врагов во дворе
function drawFront(ctx, X, Y, cs, t, b, G) {
  var T = TH[b.th], W = G.L.W, S = b.S, lw = Math.max(1.5, cs * 0.05), y = Y(S) - cs * 0.04, h = cs * 1.0;
  ctx.save(); ctx.lineWidth = lw; ctx.strokeStyle = D.OL;
  for (var c = 0; c < W; c++) {
    if (b.gates.indexOf(c) >= 0) continue;
    var w0 = secOfCol(b, c), sec = w0 && w0.sec;
    if (sec && sec.broken) {
      // пролом: груда обломков
      var rx = X(c), rnd2 = Z.rng(c * 13 + 7);
      for (var q = 0; q < 6; q++) { var px = rx + cs * (0.1 + rnd2() * 0.8), py = y - cs * (0.05 + rnd2() * 0.3), pw2 = cs * (0.18 + rnd2() * 0.18); D.rr(px - pw2 / 2, py - pw2 * 0.6, pw2, pw2 * 0.6, pw2 * 0.15); ctx.fillStyle = q % 2 ? T.face : T.wall; ctx.fill(); ctx.stroke(); }
      if (sec.rep > 0) {
        // леса растут вместе с ремонтом
        var hh = h * Math.min(1, sec.rep) + cs * 0.2; ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = lw * 1.2;
        [0.15, 0.85].forEach(function (q2) { ctx.beginPath(); ctx.moveTo(rx + cs * q2, y); ctx.lineTo(rx + cs * q2, y - hh); ctx.stroke(); });
        for (var pl = 0.3; pl < Math.min(1, sec.rep) + 0.01; pl += 0.35) { ctx.beginPath(); ctx.moveTo(rx + cs * 0.05, y - h * pl); ctx.lineTo(rx + cs * 0.95, y - h * pl); ctx.stroke(); }
        ctx.strokeStyle = D.OL; ctx.lineWidth = lw;
        wallSeg(ctx, b.th, rx, y, cs, h * Math.min(1, sec.rep) * 0.9, cs, lw);
      }
      continue;
    }
    wallSeg(ctx, b.th, X(c), y, cs, b.fallen && c % 3 === 1 ? h * 0.45 : h, cs, lw);
  }
  // полоски ремонта
  b.secs.forEach(function (w1) { var s1 = w1.sec; if (!s1.broken || !(s1.rep > 0)) return; var cx = X((s1.c0 + s1.c1 + 1) / 2), by = y - h - cs * 0.7; D.rr(cx - cs * 0.6, by, cs * 1.2, cs * 0.14, cs * 0.07); ctx.fillStyle = 'rgba(20,24,48,0.75)'; ctx.fill(); D.rr(cx - cs * 0.6, by, cs * 1.2 * Math.min(1, s1.rep), cs * 0.14, cs * 0.07); ctx.fillStyle = '#ffcf6a'; ctx.fill(); D.text('🔨', cx - cs * 0.78, by + cs * 0.08, Math.max(9, cs * 0.22), '#fff', 'center', 'middle', 0); });
  b.gates.forEach(function (g) {
    var x = X(g.c + 0.5), gw = cs, top = y - h - cs * 0.25, ih = y - top - cs * 0.1;
    ctx.fillStyle = '#1a1620'; ctx.fillRect(x - gw * 0.42, top + cs * 0.1, gw * 0.84, ih);
    if (!b.fallen) {
      var bars = ih * (1 - g.open * 0.9);
      ctx.strokeStyle = '#3d3d3d'; ctx.lineWidth = lw * 1.1;
      for (var bi = -2; bi <= 2; bi++) { ctx.beginPath(); ctx.moveTo(x + bi * gw * 0.16, top + cs * 0.1); ctx.lineTo(x + bi * gw * 0.16, top + cs * 0.1 + bars); ctx.stroke(); }
      for (var bj = 1; bj <= 2; bj++) { var yy = top + cs * 0.1 + bars * bj / 3; ctx.beginPath(); ctx.moveTo(x - gw * 0.4, yy); ctx.lineTo(x + gw * 0.4, yy); ctx.stroke(); }
      ctx.strokeStyle = D.OL; ctx.lineWidth = lw;
      if (g.iced > 0) { ctx.globalAlpha = 0.85; ctx.fillStyle = '#d8f2ff'; ctx.fillRect(x - gw * 0.42, top + cs * 0.1, gw * 0.84, ih); ctx.globalAlpha = 1; D.flake(x, top + cs * 0.1 + ih / 2, cs * 0.22, '#ffffff'); D.text(Math.ceil(g.iced) + '', x, top - cs * 0.55, Math.max(11, cs * 0.3), '#bfe6ff', 'center', 'middle', 2); }
      else if (g.waiting) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 12); D.text('!', x, top - cs * 0.55, Math.max(13, cs * 0.42), '#ff6b6b', 'center', 'middle', 3); ctx.globalAlpha = 1; }
    }
    ctx.fillStyle = T.top; ctx.fillRect(x - gw * 0.62, top - cs * 0.08, gw * 1.24, cs * 0.24); ctx.strokeRect(x - gw * 0.62, top - cs * 0.08, gw * 1.24, cs * 0.24);
    [-1, 1].forEach(function (sd) { var px = x + sd * gw * 0.54; ctx.fillStyle = T.face; ctx.fillRect(px - cs * 0.14, top - cs * 0.35, cs * 0.28, y - top + cs * 0.35); ctx.strokeRect(px - cs * 0.14, top - cs * 0.35, cs * 0.28, y - top + cs * 0.35); ctx.fillStyle = T.top; ctx.fillRect(px - cs * 0.17, top - cs * 0.45, cs * 0.34, cs * 0.12); ctx.strokeRect(px - cs * 0.17, top - cs * 0.45, cs * 0.34, cs * 0.12); });
  });
  cornerTower(ctx, b.th, X(0) + cs * 0.33, y + cs * 0.05, cs, lw, t); cornerTower(ctx, b.th, X(W) - cs * 0.33, y + cs * 0.05, cs, lw, t);
  ctx.restore();
}
function hpBar(ctx, x, y, w, f, cs) { D.rr(x - w / 2, y, w, cs * 0.13, cs * 0.065); ctx.fillStyle = 'rgba(20,24,48,0.75)'; ctx.fill(); D.rr(x - w / 2, y, w * Math.max(0, f), cs * 0.13, cs * 0.065); ctx.fillStyle = '#ff6b6b'; ctx.fill(); }
function drawBuilding(e, x, y, cs, t) {
  var G = Z.G, b = G.base, th = b ? b.th : 'dark', T = TH[th], ctx = D.ctx, lw = Math.max(1.5, cs * 0.05), OL = D.OL;
  var w = e.bw * cs * 0.94, h = cs * (e.bk === 'hq' ? 1.9 : 1.25), x0 = x - w / 2, rt = y - h, i;
  ctx.save(); ctx.lineWidth = lw; ctx.strokeStyle = OL;
  D.ell(x, y - cs * 0.02, w * 0.55, cs * 0.16, 'rgba(30,30,60,0.22)');
  // стены дома
  if (th === 'wood') { ctx.fillStyle = T.wall; ctx.fillRect(x0, rt, w, h); ctx.strokeRect(x0, rt, w, h); ctx.strokeStyle = T.dark; for (i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x0, y - h * i / 5); ctx.lineTo(x0 + w, y - h * i / 5); ctx.stroke(); } ctx.strokeStyle = OL; }
  else if (th === 'ice') { ctx.fillStyle = T.wall; ctx.fillRect(x0, rt, w, h); ctx.strokeRect(x0, rt, w, h); ctx.save(); ctx.globalAlpha = 0.45; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x0 + w * 0.15, y - h * 0.1); ctx.lineTo(x0 + w * 0.3, y - h * 0.9); ctx.stroke(); ctx.restore(); }
  else { ctx.fillStyle = th === 'rock' ? T.wall : T.face; ctx.fillRect(x0, rt, w, h); ctx.strokeRect(x0, rt, w, h); stoneLines(ctx, x0, rt, w, h, T.dark, lw, 3); }
  if (e.bk === 'hq' && th === 'rock') { ctx.restore(); drawRockKeep(e, x, y, cs, t, T, lw); return; }
  if (e.bk === 'hq') {
    if (th === 'dark') { [-0.36, 0, 0.36].forEach(function (q, j) { var sx = x + q * w, sh = cs * (j === 1 ? 1.3 : 0.9); ctx.fillStyle = T.face; ctx.fillRect(sx - cs * 0.22, rt - sh * 0.45, cs * 0.44, sh * 0.45); ctx.strokeRect(sx - cs * 0.22, rt - sh * 0.45, cs * 0.44, sh * 0.45); ctx.fillStyle = T.roof; ctx.beginPath(); ctx.moveTo(sx - cs * 0.3, rt - sh * 0.45); ctx.lineTo(sx, rt - sh); ctx.lineTo(sx + cs * 0.3, rt - sh * 0.45); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 3 + j); D.circ(sx, rt - sh - cs * 0.06, cs * 0.07, T.acc); ctx.globalAlpha = 1; }); }
    else if (th === 'ice') { [-0.3, -0.1, 0.1, 0.3].forEach(function (q, j) { var sx = x + q * w, sh = cs * (0.7 + (j % 2) * 0.45 + (j === 1 ? 0.3 : 0)); ctx.fillStyle = j % 2 ? T.face : T.top; ctx.beginPath(); ctx.moveTo(sx - cs * 0.22, rt); ctx.lineTo(sx, rt - sh); ctx.lineTo(sx + cs * 0.22, rt); ctx.closePath(); ctx.fill(); ctx.stroke(); }); }
    else if (th === 'wood') { ctx.fillStyle = T.roof; ctx.beginPath(); ctx.moveTo(x0 - cs * 0.1, rt); ctx.lineTo(x, rt - cs * 0.85); ctx.lineTo(x0 + w + cs * 0.1, rt); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = T.wall; ctx.fillRect(x - cs * 0.18, rt - cs * 1.25, cs * 0.36, cs * 0.5); ctx.strokeRect(x - cs * 0.18, rt - cs * 1.25, cs * 0.36, cs * 0.5); ctx.fillStyle = T.roof; ctx.beginPath(); ctx.moveTo(x - cs * 0.28, rt - cs * 1.25); ctx.lineTo(x, rt - cs * 1.6); ctx.lineTo(x + cs * 0.28, rt - cs * 1.25); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle = T.top; ctx.beginPath(); ctx.ellipse(x, rt, w * 0.5, cs * 0.75, 0, Math.PI, 0); ctx.fill(); ctx.stroke(); stoneLines(ctx, x - w * 0.3, rt - cs * 0.55, w * 0.6, cs * 0.5, T.dark, lw, 2); }
    D.rr(x - cs * 0.24, y - cs * 0.62, cs * 0.48, cs * 0.62, cs * 0.2); ctx.fillStyle = '#1a1424'; ctx.fill(); ctx.stroke();
    D.circ(x - cs * 0.09, y - cs * 0.36, cs * 0.045, th === 'dark' ? T.acc : '#ffcf6a'); D.circ(x + cs * 0.09, y - cs * 0.36, cs * 0.045, th === 'dark' ? T.acc : '#ffcf6a');
    ctx.beginPath(); ctx.moveTo(x0 + w - cs * 0.15, rt); ctx.lineTo(x0 + w - cs * 0.15, rt - cs * 0.95); ctx.stroke(); D.poly([x0 + w - cs * 0.15, rt - cs * 0.95, x0 + w + cs * 0.3 + Math.sin(t * 4) * cs * 0.05, rt - cs * 0.82, x0 + w - cs * 0.15, rt - cs * 0.68], T.acc, lw * 0.6);
  } else {
    ctx.fillStyle = th === 'ice' ? T.face : T.roof; ctx.beginPath(); ctx.moveTo(x0 - cs * 0.08, rt); ctx.lineTo(x0 + w * 0.2, rt - cs * 0.45); ctx.lineTo(x0 + w * 0.8, rt - cs * 0.45); ctx.lineTo(x0 + w + cs * 0.08, rt); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (e.bk === 'barracks') { D.rr(x - cs * 0.2, y - cs * 0.55, cs * 0.4, cs * 0.55, cs * 0.12); ctx.fillStyle = '#2a1e14'; ctx.fill(); ctx.stroke(); [-0.32, 0.32].forEach(function (q) { D.rr(x + q * w - cs * 0.1, y - h * 0.72, cs * 0.2, cs * 0.18, cs * 0.04); ctx.fillStyle = '#ffcf6a'; ctx.fill(); ctx.stroke(); }); }
    if (e.bk === 'works') { ctx.fillStyle = T.dark; ctx.fillRect(x0 + w * 0.7, rt - cs * 0.75, cs * 0.18, cs * 0.5); ctx.strokeRect(x0 + w * 0.7, rt - cs * 0.75, cs * 0.18, cs * 0.5); for (var sm = 0; sm < 3; sm++) { var sp = (t * 0.5 + sm / 3) % 1; ctx.globalAlpha = 0.5 * (1 - sp); D.circ(x0 + w * 0.7 + cs * 0.09 + sp * cs * 0.3, rt - cs * 0.8 - sp * cs * 0.8, cs * (0.1 + sp * 0.15), '#8a8f9e'); } ctx.globalAlpha = 1; ctx.save(); ctx.translate(x - cs * 0.15, y - h * 0.5); ctx.rotate(t * (G.phase === 'wave' ? 2 : 0.3)); ctx.fillStyle = '#c9cfdc'; for (var gi = 0; gi < 6; gi++) { ctx.rotate(Math.PI / 3); ctx.fillRect(-cs * 0.045, -cs * 0.27, cs * 0.09, cs * 0.1); } D.circ(0, 0, cs * 0.18, '#c9cfdc', lw * 0.7); D.circ(0, 0, cs * 0.07, T.dark); ctx.restore(); }
    if (e.bk === 'power') { var gl = 0.6 + 0.4 * Math.sin(t * 6); D.rr(x - cs * 0.3, y - h * 0.62, cs * 0.6, cs * 0.4, cs * 0.08); ctx.fillStyle = '#2a1e14'; ctx.fill(); ctx.stroke(); ctx.globalAlpha = gl; D.rr(x - cs * 0.24, y - h * 0.56, cs * 0.48, cs * 0.28, cs * 0.06); ctx.fillStyle = th === 'ice' ? '#9fe8ff' : th === 'dark' ? T.acc : '#ff8a3d'; ctx.fill(); ctx.globalAlpha = 1; for (var st = 0; st < 3; st++) { var sp2 = (t * 0.6 + st / 3) % 1; ctx.globalAlpha = 0.45 * (1 - sp2); D.circ(x - cs * 0.15 + st * cs * 0.15, rt - cs * 0.5 - sp2 * cs, cs * (0.1 + sp2 * 0.18), th === 'ice' ? '#e8f6ff' : '#b8bcc8'); } ctx.globalAlpha = 1; }
  }
  if (e.doorT > 0) { ctx.globalAlpha = Math.min(1, e.doorT * 2) * 0.8; D.rr(x - cs * 0.24, y - cs * 0.62, cs * 0.48, cs * 0.62, cs * 0.18); ctx.fillStyle = '#ffd88a'; ctx.fill(); ctx.globalAlpha = 1; }
  if (e.hitT > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff'; ctx.fillRect(x0, rt, w, h); }
  ctx.restore();
  var bw = Math.min(w, cs * 1.4), by = rt - cs * (e.bk === 'hq' ? 1.15 : 0.75);
  if (bldProtected(b, e)) { D.text('🛡', x + bw / 2 + cs * 0.22, by + cs * 0.08, Math.max(9, cs * 0.24), '#fff', 'center', 'middle', 0); }
  hpBar(ctx, x, by, bw, e.hp / e.max, cs);
  D.circ(x - bw / 2 - cs * 0.2, by + cs * 0.065, cs * 0.18, 'rgba(20,24,48,0.85)'); D.text(ICON[e.bk] || '', x - bw / 2 - cs * 0.2, by + cs * 0.075, Math.max(9, cs * 0.2), '#fff', 'center', 'middle', 0);
}
function drawTurret(e, x, y, cs, t) {
  var G = Z.G, b = G.base, th = b ? b.th : 'dark', T = TH[th], ctx = D.ctx, lw = Math.max(1.5, cs * 0.05), OL = D.OL, w = cs * 0.9, h = cs * 2.1, pw = has(b, 'power');
  ctx.save(); ctx.lineWidth = lw; ctx.strokeStyle = OL;
  var since = Z.time - (e.firedAt === undefined ? -9 : e.firedAt), wind = e.cd < 0.7 ? 1 - Math.max(0, e.cd) / 0.7 : 0, dirA = (e.aimX || 0) < 0 ? -1 : 1;
  // башня
  if (th === 'wood') {
    ctx.fillStyle = T.face; [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.moveTo(x + s * w * 0.45, y); ctx.lineTo(x + s * w * 0.3, y - h * 0.72); ctx.lineTo(x + s * w * 0.18, y - h * 0.72); ctx.lineTo(x + s * w * 0.3, y); ctx.closePath(); ctx.fill(); ctx.stroke(); });
    ctx.strokeStyle = T.dark; ctx.beginPath(); ctx.moveTo(x - w * 0.36, y - h * 0.2); ctx.lineTo(x + w * 0.27, y - h * 0.55); ctx.moveTo(x + w * 0.36, y - h * 0.2); ctx.lineTo(x - w * 0.27, y - h * 0.55); ctx.stroke(); ctx.strokeStyle = OL;
    ctx.fillStyle = T.wall; ctx.fillRect(x - w * 0.5, y - h * 0.78, w, h * 0.12); ctx.strokeRect(x - w * 0.5, y - h * 0.78, w, h * 0.12);
  } else if (th === 'ice') {
    ctx.fillStyle = T.face; ctx.beginPath(); ctx.moveTo(x - w * 0.45, y); ctx.lineTo(x - w * 0.34, y - h * 0.78); ctx.lineTo(x + w * 0.34, y - h * 0.78); ctx.lineTo(x + w * 0.45, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - w * 0.15, y - h * 0.1); ctx.lineTo(x - w * 0.05, y - h * 0.7); ctx.stroke(); ctx.restore();
  } else {
    ctx.fillStyle = T.face; ctx.fillRect(x - w * 0.42, y - h * 0.8, w * 0.84, h * 0.8); ctx.strokeRect(x - w * 0.42, y - h * 0.8, w * 0.84, h * 0.8); stoneLines(ctx, x - w * 0.42, y - h * 0.8, w * 0.84, h * 0.8, T.dark, lw, 4);
    ctx.fillStyle = T.top; ctx.fillRect(x - w * 0.5, y - h * 0.8 - cs * 0.14, w, cs * 0.14); ctx.strokeRect(x - w * 0.5, y - h * 0.8 - cs * 0.14, w, cs * 0.14);
  }
  var py = y - h * 0.8 - (th === 'rock' || th === 'dark' ? cs * 0.14 : 0);
  // оружие на площадке
  if (th === 'rock') {
    // требушет: рама, рычаг с противовесом, камень в ложке; замах → бросок → возврат
    var ang = -1.95 - 0.45 * wind; if (since < 0.22) ang = -2.4 + (since / 0.22) * 1.9; else if (since < 1) ang = -0.5 - (since - 0.22) / 0.78 * 1.45;
    ctx.fillStyle = '#7a5530'; D.poly([x - cs * 0.3, py, x - cs * 0.06, py - cs * 0.55, x + cs * 0.06, py - cs * 0.55, x + cs * 0.3, py], '#7a5530', lw);
    var pvx = x, pvy = py - cs * 0.52, L1 = cs * 0.75, L2 = cs * 0.3, ca = Math.cos(ang) * dirA, sa = Math.sin(ang);
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2.6; ctx.beginPath(); ctx.moveTo(pvx - ca * L2, pvy - sa * L2); ctx.lineTo(pvx + ca * L1, pvy + sa * L1); ctx.stroke(); ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = lw * 1.4; ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = lw;
    D.rr(pvx - ca * L2 - cs * 0.12, pvy - sa * L2 - cs * 0.02, cs * 0.24, cs * 0.24, cs * 0.04); ctx.fillStyle = '#5e554c'; ctx.fill(); ctx.stroke();
    if (since > 1 || since < 0) D.circ(pvx + ca * L1, pvy + sa * L1 - cs * 0.06, cs * 0.12, T.shot, lw * 0.7);
    D.circ(pvx, pvy, cs * 0.05, '#3d3d3d');
  } else if (th === 'wood') {
    // баллиста: лук натягивается, болт уходит, плечи пружинят
    var pull = since < 0.15 ? 0 : wind, bx = x, by = py - cs * 0.12, arm = cs * 0.48, bend = cs * (0.08 + 0.14 * pull) * (since < 0.3 ? 1 - since / 0.3 * 0.3 : 1);
    D.rr(bx - cs * 0.42 * dirA - (dirA < 0 ? 0 : 0), by - cs * 0.05, cs * 0.84, cs * 0.1, cs * 0.04); ctx.fillStyle = '#6e4a26'; ctx.save(); ctx.translate(bx, by); ctx.scale(dirA, 1);
    D.rr(-cs * 0.42, -cs * 0.05, cs * 0.84, cs * 0.1, cs * 0.04); ctx.fillStyle = '#7a5228'; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 1.8; ctx.beginPath(); ctx.moveTo(cs * 0.25, -arm); ctx.quadraticCurveTo(cs * 0.25 + bend, 0, cs * 0.25, arm * 0.0001 + arm); ctx.stroke(); ctx.strokeStyle = '#a8743e'; ctx.lineWidth = lw; ctx.stroke();
    ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = Math.max(1, lw * 0.5); var sx2 = cs * 0.25 - cs * 0.35 * pull; ctx.beginPath(); ctx.moveTo(cs * 0.25, -arm); ctx.lineTo(sx2, 0); ctx.lineTo(cs * 0.25, arm); ctx.stroke();
    if (since > 0.4 || since < 0) { ctx.strokeStyle = '#3d2a14'; ctx.lineWidth = lw * 1.1; ctx.beginPath(); ctx.moveTo(sx2, 0); ctx.lineTo(cs * 0.55, 0); ctx.stroke(); D.poly([cs * 0.55, -cs * 0.06, cs * 0.68, 0, cs * 0.55, cs * 0.06], '#9aa1b5', lw * 0.5); }
    ctx.restore();
    ctx.fillStyle = T.acc; ctx.strokeStyle = OL; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x - w * 0.6, py - cs * 0.62); ctx.lineTo(x, py - cs * 1.0); ctx.lineTo(x + w * 0.6, py - cs * 0.62); ctx.closePath(); ctx.fill(); ctx.stroke();
    [-1, 1].forEach(function (s5) { ctx.beginPath(); ctx.moveTo(x + s5 * w * 0.45, py - cs * 0.62); ctx.lineTo(x + s5 * w * 0.45, py); ctx.stroke(); });
  } else if (th === 'dark') {
    // шпиль с шаром силы: шар растёт перед выстрелом, вспышка при выстреле
    ctx.fillStyle = T.roof; ctx.beginPath(); ctx.moveTo(x - w * 0.5, py); ctx.lineTo(x - w * 0.2, py - cs * 0.9); ctx.lineTo(x + w * 0.2, py - cs * 0.9); ctx.lineTo(x + w * 0.5, py); ctx.closePath(); ctx.fill(); ctx.stroke();
    var orb = cs * (0.1 + 0.14 * wind) * (since < 0.3 ? since / 0.3 : 1), oy = py - cs * 1.15;
    [-1, 1].forEach(function (s6) { ctx.beginPath(); ctx.moveTo(x + s6 * w * 0.2, py - cs * 0.9); ctx.quadraticCurveTo(x + s6 * w * 0.4, oy, x + s6 * cs * 0.05, oy - cs * 0.28); ctx.stroke(); });
    ctx.globalAlpha = 0.3 + 0.3 * wind; D.circ(x, oy, orb * 2.2, T.acc); ctx.globalAlpha = 1; D.circ(x, oy, Math.max(1, orb), T.acc, lw * 0.6); D.circ(x - orb * 0.3, oy - orb * 0.3, Math.max(1, orb * 0.3), '#ffffff');
    if (since < 0.25) { ctx.globalAlpha = 1 - since / 0.25; D.star(x, oy, cs * 0.45, '#d8fff0', 1); ctx.globalAlpha = 1; }
  } else {
    // ледяная пушка: сосулька-ствол наращивается и выстреливает
    var grow = since < 0.2 ? 0 : wind, iy = py - cs * 0.15;
    ctx.save(); ctx.translate(x, iy); ctx.scale(dirA, 1); ctx.rotate(-0.35);
    D.rr(-cs * 0.2, -cs * 0.16, cs * 0.5, cs * 0.32, cs * 0.12); ctx.fillStyle = T.dark; ctx.fill(); ctx.stroke();
    var len = cs * (0.15 + 0.45 * grow); D.poly([cs * 0.28, -cs * 0.1, cs * 0.28 + len, 0, cs * 0.28, cs * 0.1], '#e8f6ff', lw * 0.7);
    ctx.restore();
    if (since < 0.3) { ctx.globalAlpha = 1 - since / 0.3; for (var q = 0; q < 6; q++) { var qa = q / 6 * 6.28; D.circ(x + Math.cos(qa) * cs * 0.4 * (0.5 + since * 2), iy + Math.sin(qa) * cs * 0.25 * (0.5 + since * 2), cs * 0.05, '#ffffff'); } ctx.globalAlpha = 1; }
  }
  ctx.globalAlpha = (pw ? 0.75 : 0.35) + 0.25 * Math.sin(t * 5 + (e.lairI || 0)); D.circ(x, y - h * 0.55, cs * 0.12, th === 'rock' ? '#ffb347' : T.acc); ctx.globalAlpha = 1;
  if (e.hitT > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff'; ctx.fillRect(x - w * 0.45, y - h, w * 0.9, h); }
  ctx.restore();
  hpBar(ctx, x, y - h - cs * 1.0, cs * 0.9, e.hp / e.max, cs);
}

// чертог великана: каменная громада с башней, огромной пещерной дверью и жаровнями
function drawRockKeep(e, x, y, cs, t, T, lw) {
  var ctx = D.ctx, OL = D.OL, w = e.bw * cs * 0.98, h = cs * 1.9, x0 = x - w / 2, rt = y - h;
  ctx.save(); ctx.lineWidth = lw; ctx.strokeStyle = OL;
  D.ell(x, y, w * 0.6, cs * 0.2, 'rgba(30,30,60,0.25)');
  // основной объём: передняя грань и верх
  ctx.fillStyle = T.wall; ctx.fillRect(x0, rt, w, h); ctx.strokeRect(x0, rt, w, h); stoneLines(ctx, x0, rt, w, h, T.dark, lw, 5);
  ctx.fillStyle = T.top; ctx.fillRect(x0 - cs * 0.06, rt - cs * 0.25, w + cs * 0.12, cs * 0.25); ctx.strokeRect(x0 - cs * 0.06, rt - cs * 0.25, w + cs * 0.12, cs * 0.25);
  crenels(ctx, x0 - cs * 0.06, x0 + w + cs * 0.06, rt - cs * 0.25, cs * 0.2, T.top);
  // центральная башня
  var tw = w * 0.42, th = cs * 1.75, tx = x - tw / 2, ty = rt - cs * 0.25 - th;
  ctx.fillStyle = T.face; ctx.fillRect(tx, ty, tw, th); ctx.strokeRect(tx, ty, tw, th); stoneLines(ctx, tx, ty, tw, th, T.dark, lw, 4);
  ctx.fillStyle = T.top; ctx.fillRect(tx - cs * 0.08, ty - cs * 0.22, tw + cs * 0.16, cs * 0.22); ctx.strokeRect(tx - cs * 0.08, ty - cs * 0.22, tw + cs * 0.16, cs * 0.22);
  crenels(ctx, tx - cs * 0.08, tx + tw + cs * 0.08, ty - cs * 0.22, cs * 0.2, T.top);
  // окна-бойницы башни со светом
  [0.3, 0.7].forEach(function (q) { D.rr(tx + tw * q - cs * 0.07, ty + th * 0.3, cs * 0.14, cs * 0.3, cs * 0.06); ctx.fillStyle = 'rgba(255,190,90,' + (0.7 + 0.3 * Math.sin(t * 3 + q * 5)).toFixed(2) + ')'; ctx.fill(); ctx.stroke(); });
  // огромная пещерная дверь
  ctx.fillStyle = '#1e1a16'; ctx.beginPath(); ctx.moveTo(x - cs * 0.55, y); ctx.lineTo(x - cs * 0.55, y - cs * 0.75); ctx.quadraticCurveTo(x, y - cs * 1.45, x + cs * 0.55, y - cs * 0.75); ctx.lineTo(x + cs * 0.55, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = T.top; for (var k = 0; k < 7; k++) { var a = Math.PI + k / 6 * Math.PI, rx = x + Math.cos(a) * cs * 0.62, ry = y - cs * 0.72 + Math.sin(a) * cs * 0.62; D.rr(rx - cs * 0.1, ry - cs * 0.08, cs * 0.2, cs * 0.16, cs * 0.04); ctx.fill(); ctx.stroke(); }
  var bl = Math.sin(t * 0.8) > 0.95 ? 0.15 : 1; [-1, 1].forEach(function (s2) { ctx.fillStyle = '#ffcf6a'; ctx.beginPath(); ctx.ellipse(x + s2 * cs * 0.16, y - cs * 0.62, cs * 0.07, cs * 0.07 * bl, 0, 0, 7); ctx.fill(); });
  // жаровни по бокам двери
  [-1, 1].forEach(function (s3) { var bx = x + s3 * cs * 0.95, by = y - cs * 0.05; ctx.fillStyle = '#4a3a2a'; ctx.fillRect(bx - cs * 0.05, by - cs * 0.45, cs * 0.1, cs * 0.45); ctx.strokeRect(bx - cs * 0.05, by - cs * 0.45, cs * 0.1, cs * 0.45); D.rr(bx - cs * 0.17, by - cs * 0.58, cs * 0.34, cs * 0.15, cs * 0.05); ctx.fillStyle = '#5a4a3a'; ctx.fill(); ctx.stroke(); if (D.fire) D.fire(bx, by - cs * 0.6, cs * 0.28, t + s3); });
  // знамёна
  [-1, 1].forEach(function (s4) { var fx = x + s4 * w * 0.33, fy = rt + cs * 0.15, sw = Math.sin(t * 2 + s4) * cs * 0.04; D.poly([fx - cs * 0.17, fy, fx + cs * 0.17, fy, fx + cs * 0.17 + sw, fy + cs * 0.7, fx + sw, fy + cs * 0.55, fx - cs * 0.17 + sw, fy + cs * 0.7], '#b8463a', lw * 0.7); D.circ(fx + sw * 0.5, fy + cs * 0.28, cs * 0.08, '#ffd54a'); });
  // флаг на башне
  ctx.beginPath(); ctx.moveTo(x, ty - cs * 0.22); ctx.lineTo(x, ty - cs * 1.0); ctx.stroke(); D.poly([x, ty - cs * 1.0, x + cs * 0.5 + Math.sin(t * 4) * cs * 0.06, ty - cs * 0.86, x, ty - cs * 0.72], T.acc, lw * 0.6);
  if (e.doorT > 0) { ctx.globalAlpha = Math.min(1, e.doorT * 2) * 0.7; ctx.fillStyle = '#ffd88a'; ctx.beginPath(); ctx.moveTo(x - cs * 0.5, y); ctx.lineTo(x - cs * 0.5, y - cs * 0.75); ctx.quadraticCurveTo(x, y - cs * 1.4, x + cs * 0.5, y - cs * 0.75); ctx.lineTo(x + cs * 0.5, y); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
  if (e.hitT > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff'; ctx.fillRect(x0, rt, w, h); }
  ctx.restore();
  var bw = Math.min(w, cs * 1.6), by2 = ty - cs * 1.25;
  if (bldProtected(Z.G.base, e)) D.text('🛡', x + bw / 2 + cs * 0.22, by2 + cs * 0.08, Math.max(9, cs * 0.24), '#fff', 'center', 'middle', 0);
  hpBar(ctx, x, by2, bw, e.hp / e.max, cs);
  D.circ(x - bw / 2 - cs * 0.2, by2 + cs * 0.065, cs * 0.18, 'rgba(20,24,48,0.85)'); D.text(ICON.hq, x - bw / 2 - cs * 0.2, by2 + cs * 0.075, Math.max(9, cs * 0.2), '#fff', 'center', 'middle', 0);
}
// реквизит двора: ящики, бочки, факелы, чучело для тренировки
function drawYard(ctx, X, Y, cs, t, b, G) {
  var W = G.L.W, S = b.S, T = TH[b.th], lw = Math.max(1.2, cs * 0.04), OL = D.OL, occ = {};
  b.bld.forEach(function (e) { for (var c = Math.floor(e.x - e.bw / 2); c < e.x + e.bw / 2; c++) occ[c] = 1; });
  ctx.save(); ctx.lineWidth = lw; ctx.strokeStyle = OL;
  for (var c = 1; c < W - 1; c++) {
    if (b.gates.indexOf(c) >= 0) continue;
    var r = (c * 7) % 3;
    if (!occ[c] && r === 0) { var bx = X(c + 0.3), by = Y(1.75); D.rr(bx - cs * 0.2, by - cs * 0.35, cs * 0.4, cs * 0.35, cs * 0.04); ctx.fillStyle = '#a07040'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx - cs * 0.2, by - cs * 0.35); ctx.lineTo(bx + cs * 0.2, by); ctx.moveTo(bx + cs * 0.2, by - cs * 0.35); ctx.lineTo(bx - cs * 0.2, by); ctx.stroke(); }
    if (!occ[c] && r === 1) { var kx = X(c + 0.6), ky = Y(2.7); D.ell(kx, ky - cs * 0.22, cs * 0.17, cs * 0.24, '#8a5a30', lw); ctx.strokeStyle = '#3d3d3d'; ctx.beginPath(); ctx.moveTo(kx - cs * 0.17, ky - cs * 0.3); ctx.lineTo(kx + cs * 0.17, ky - cs * 0.3); ctx.moveTo(kx - cs * 0.17, ky - cs * 0.14); ctx.lineTo(kx + cs * 0.17, ky - cs * 0.14); ctx.stroke(); ctx.strokeStyle = OL; }
    if (c % 4 === 2) { var fx = X(c + 0.5), fy = Y(0) + cs * 0.02; ctx.fillStyle = '#4a3a2a'; ctx.fillRect(fx - cs * 0.04, fy - cs * 0.55, cs * 0.08, cs * 0.3); if (D.fire) D.fire(fx, fy - cs * 0.55, cs * 0.18, t + c); }
  }
  // плац: следы и столбик-мишень для тренировки
  var dc = W - 3; if (!occ[dc] && b.gates.indexOf(dc) < 0) { var dx = X(dc + 0.5), dy = Y(3.6); ctx.fillStyle = '#7a5530'; ctx.fillRect(dx - cs * 0.04, dy - cs * 0.6, cs * 0.08, cs * 0.6); D.circ(dx, dy - cs * 0.72, cs * 0.16, '#d8c8a0', lw); ctx.strokeStyle = '#c0392b'; ctx.beginPath(); ctx.arc(dx, dy - cs * 0.72, cs * 0.08, 0, 7); ctx.stroke(); }
  ctx.restore();
}
// пушкари: два енота катят пушку на колёсах; state: 'roll' | 'aim' | 'fire'
function drawCannon(x, y, cs, t, dir, state, k) {
  var ctx = D.ctx, OL = D.OL, lw = Math.max(1.4, cs * 0.045), s = cs * 0.9;
  k = k || 0;   // 0..1 — фаза выстрела (отдача)
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); ctx.lineWidth = lw; ctx.strokeStyle = OL;
  D.ell(0, 0, s * 0.6, s * 0.14, 'rgba(30,30,60,0.25)');
  var rec = state === 'fire' ? Math.sin(Math.min(1, k * 3) * Math.PI) * s * 0.18 : 0, roll = state === 'roll' ? t * 6 : 0, ang = state === 'roll' ? 0.05 : -0.32;
  // лафет
  ctx.save(); ctx.translate(-rec, 0);
  D.rr(-s * 0.45, -s * 0.32, s * 0.6, s * 0.14, s * 0.04); ctx.fillStyle = '#8a5a30'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.2); ctx.lineTo(-s * 0.72, -s * 0.02); ctx.lineWidth = lw * 2.2; ctx.stroke(); ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = lw * 1.2; ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = lw;
  // ствол
  ctx.save(); ctx.translate(-s * 0.05, -s * 0.36); ctx.rotate(ang);
  D.rr(-s * 0.25, -s * 0.12, s * 0.75, s * 0.24, s * 0.1); ctx.fillStyle = '#3d4252'; ctx.fill(); ctx.stroke();
  D.rr(s * 0.42, -s * 0.15, s * 0.12, s * 0.3, s * 0.04); ctx.fillStyle = '#2a2e3a'; ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#6a7080'; ctx.beginPath(); ctx.moveTo(-s * 0.15, -s * 0.06); ctx.lineTo(s * 0.35, -s * 0.06); ctx.stroke(); ctx.strokeStyle = OL;
  D.circ(-s * 0.27, 0, s * 0.07, '#3d4252', lw * 0.8);
  if (state === 'aim') { var sp = (t * 6) % 1; ctx.globalAlpha = 1 - sp; D.circ(-s * 0.3, -s * 0.12 - sp * s * 0.2, s * 0.04, '#ffcf6a'); ctx.globalAlpha = 1; }
  if (state === 'fire' && k < 0.35) { var f = 1 - k / 0.35; ctx.globalAlpha = f; D.star(s * 0.7, 0, s * (0.25 + 0.15 * f), '#ffd54a', 1); D.circ(s * 0.62, 0, s * 0.16 * f, '#fff3c4'); ctx.globalAlpha = 1; }
  ctx.restore();
  // колёса
  [-0.32, 0.08].forEach(function (wx) { ctx.save(); ctx.translate(s * wx, -s * 0.13); ctx.rotate(roll); D.circ(0, 0, s * 0.16, '#a07040', lw); ctx.strokeStyle = '#5a3a20'; for (var i = 0; i < 4; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(-s * 0.14, 0); ctx.lineTo(s * 0.14, 0); ctx.stroke(); } D.circ(0, 0, s * 0.04, '#5a3a20'); ctx.restore(); });
  ctx.restore();
  // дым после выстрела
  if (state === 'fire' && k > 0.1) { for (var p = 0; p < 4; p++) { var q = Math.min(1, (k - 0.1) * 1.4 + p * 0.08); ctx.globalAlpha = 0.55 * (1 - q); D.circ(s * (0.75 + q * 0.6 + p * 0.1), -s * (0.55 + q * 0.5 + p * 0.06), s * (0.12 + q * 0.25), '#c9cfdc'); } ctx.globalAlpha = 1; }
  ctx.restore();
  // расчёт: двое енотов — один толкает/наводит, второй с фитилём
  var crew = [{ x: x - dir * s * 0.85, st: state === 'roll' ? 'push' : 'aim' }, { x: x - dir * s * 0.2 + dir * s * 0.05, st: 'wick' }];
  crew.forEach(function (c2, i) {
    var fake = { type: 'raccoon', size: 0.72, dir: dir, walk: state === 'roll' ? t * 9 + i : 0, ph: i * 2, hitT: 0, lunge: state === 'fire' && i === 1 && k < 0.2 ? 0.2 : 0, lift: 0 };
    if (i === 1 && state === 'roll') return;
    D.enemy(fake, c2.x, y + (i ? cs * 0.18 : cs * 0.05), cs, t);
    if (i === 1) { ctx.save(); ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = lw; var hx = c2.x + dir * cs * 0.2, hy = y - cs * 0.35; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + dir * cs * 0.25, hy - cs * 0.2); ctx.stroke(); if (state !== 'fire') { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 20); D.circ(hx + dir * cs * 0.26, hy - cs * 0.22, cs * 0.05, '#ffb347'); ctx.globalAlpha = 1; } ctx.restore(); }
  });
}
Z.drawCannonDemo = drawCannon;
var oEnemyDraw = D.enemy;
D.enemy = function (e, x, y, cs, t) {
  if (e && e.type === 'lairB') return drawBuilding(e, x, y, cs, t);
  if (e && e.type === 'lairT') return drawTurret(e, x, y, cs, t);
  if (e && e.type === 'lairW') { if (e.hp < e.max) { var ctx0 = D.ctx; hpBar(ctx0, x, y - cs * 1.55, Math.min(cs * 1.6, cs * (e.sec.c1 - e.sec.c0 + 1) * 0.8), e.hp / e.max, cs); } return; }
  if (e && e.type === 'cannon') return drawCannon(x, y, cs, t, e.dir || 1, e.cst === 'aim' || e.cst === 'fire' ? (e.fk < 1 ? 'fire' : 'aim') : 'roll', Math.min(1, e.fk || 0));
  if (e && e.doorIn > 0) { var c1 = D.ctx, a0 = c1.globalAlpha; c1.globalAlpha = a0 * (1 - e.doorIn / 0.5); var r = oEnemyDraw.apply(this, arguments); c1.globalAlpha = a0; return r; }
  return oEnemyDraw.apply(this, arguments);
};
// двор — поверх земли, под всем остальным; мощёный пол рисуется один раз в картинку (под текущий масштаб)
var yardCache = null;
function yardCanvas(G, B, cs) {
  var W = G.L.W, S = B.S, dpr = Math.min(2, Z.DPR || 1), key = B.th + '|' + W + '|' + S + '|' + Math.round(cs * 10) + '|' + dpr;
  if (yardCache && yardCache.key === key) return yardCache.cv;
  var T = TH[B.th], top = 0.7, cv = document.createElement('canvas'); cv.width = Math.ceil(W * cs * dpr); cv.height = Math.ceil((S + top) * cs * dpr);
  var c = cv.getContext('2d'); c.scale(dpr, dpr);
  c.fillStyle = T.floor; c.fillRect(0, 0, W * cs, (S + top) * cs);
  var rnd = Z.rng(77 + W * 3 + S), shades = B.th === 'wood' ? ['#d8c4a2', '#cdb894', '#e2d2b4'] : B.th === 'ice' ? ['#d2ecff', '#c4e4fb', '#e2f4ff'] : B.th === 'dark' ? ['#7e768e', '#746c84', '#8a8298'] : ['#c4bbae', '#b8ae9f', '#cfc6ba'];
  c.strokeStyle = T.ground + '0.45)'; c.lineWidth = Math.max(1, cs * 0.025);
  // булыжник: ряды камней со сдвигом
  var sh = cs * 0.34;
  for (var y = 0, row = 0; y < (S + top) * cs; y += sh, row++) {
    for (var x = -(row % 2) * sh * 0.6; x < W * cs; ) {
      var w = sh * (0.9 + rnd() * 0.7);
      c.fillStyle = shades[Math.floor(rnd() * shades.length)]; D.setCtx(c); D.rr(x + 1, y + 1, w - 2, sh - 2, sh * 0.25); c.fill(); c.stroke();
      x += w;
    }
  }
  // протоптанные дорожки к воротам и пятна снега
  B.gates.forEach(function (g) { c.fillStyle = T.ground + '0.28)'; c.fillRect(g * cs + cs * 0.12, 0, cs * 0.76, (S + top) * cs); });
  for (var k = 0; k < W * 1.2; k++) { c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(rnd() * W * cs, rnd() * (S + top) * cs, cs * (0.15 + rnd() * 0.25), cs * (0.06 + rnd() * 0.08), 0, 0, 7); c.fill(); }
  D.setCtx(Z.ui && Z.ui.ctx ? Z.ui.ctx : D.ctx);
  yardCache = { key: key, cv: cv };
  return cv;
}
var oUnder = Z.drawUnder;
// 2.11.5: двор базы — часть готового слоя земли (ui.js), если он есть; тогда здесь не рисуется
Z.yardRect = function (X, Y, cs) { var G = Z.G, B = G && G.L && G.L.base; if (!B) return null; return [X(0), Y(0) - cs * 0.7, G.L.W * cs, (B.S + 0.7) * cs]; };
Z.drawYard = function (ctx, X, Y, cs) {
  var G = Z.G, B = G && G.L && G.L.base; if (!B) return false;
  var prev = D.ctx, cv = yardCanvas(G, B, cs); D.setCtx(prev);
  var R = Z.yardRect(X, Y, cs); ctx.drawImage(cv, R[0], R[1], R[2], R[3]); return true;
};
Z.drawUnder = function (ctx, X, Y, cs, t) {
  if (oUnder) oUnder(ctx, X, Y, cs, t);
  if (Z.ui && Z.ui.gcYard) return;
  Z.drawYard(ctx, X, Y, cs);
};
var oObjs = Z.drawObjs;
Z.drawObjs = function (objs, X, Y, cs, t) {
  if (oObjs) oObjs(objs, X, Y, cs, t);
  var G = Z.G, b = G && G.base; if (!b) return;
  // 2.11.5: крепость врагов (стены-частокол, двор, постройки) — сотни штрихов за кадр; рисуется в картинку 5 раз в секунду
  var W0 = G.L.W, bsig = function () { return [b.th, b.S, (b.gates || []).join(','), (b.bld || []).map(function (e) { return e.dead ? 0 : Math.ceil(e.hp / (e.max || 1) * 4); }).join(''), (b.tur || []).map(function (e) { return e.dead ? 0 : 1; }).join(''), (b.secs || []).map(function (w) { var q = w.sec || {}; return (q.broken ? 'b' + Math.floor((q.rep || 0) * 4) : '') + Math.ceil((w.hp || 0) / (w.max || 1) * 4); }).join(','), cs.toFixed(1)].join('|'); };
  // 2.12: готовыми кадрами по фазам (v30o): частокол и постройки не перерисовываются, флажки и фонари — по кругу
  function cd(key, y0, y1, fn) {
    if (Z.sceneAnim) Z.sceneAnim(key + "|" + bsig(), t, Math.PI * 2, Z.scenePhases(12, 8, 6), fn);
    else if (Z.cachedDraw) Z.cachedDraw(key, bsig(), X(-1), Y(y0), (W0 + 2) * cs, (y1 - y0) * cs, function () { fn(t); }, 5); else fn(t);
  }
  objs.push({ y: -5, f: function () { cd('baseBack', -2.2, b.S + 0.6, function (tq) { drawBack(D.ctx, X, Y, cs, tq, b, G); drawYard(D.ctx, X, Y, cs, tq, b, G); }); } });
  objs.push({ y: b.S - 0.06, f: function () { cd('baseFront', b.S - 2.2, b.S + 0.8, function (tq) { drawFront(D.ctx, X, Y, cs, tq, b, G); }); } });
};
var oOM = Z.ui.objMargin;
Z.ui.objMargin = function (cs) { var m = oOM.apply(this, arguments), G = Z.G; if (G && G.L && G.L.base) m = { x: m.x, t: Math.max(m.t, cs * 1.9), b: m.b }; return m; };
// снаряды турелей, щит штаба над боссом, сигнал сбора, сосулька Деда Мороза
var oOver = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  try {
    var G = Z.G, b = G && G.base;
    if (b) {
      var T = TH[b.th];
      b.shots.forEach(function (s) {
        var p = s.t / s.dur, x = s.x0 + (s.x1 - s.x0) * p, y = s.y0 + (s.y1 - s.y0) * p - (b.th === 'rock' ? Math.sin(p * Math.PI) * 1.4 : 0);
        if (b.th === 'wood') { var a = Math.atan2(s.y1 - s.y0, s.x1 - s.x0); ctx.strokeStyle = T.shot; ctx.lineWidth = Math.max(1.5, cs * 0.06); ctx.beginPath(); ctx.moveTo(X(x), Y(y)); ctx.lineTo(X(x) - Math.cos(a) * cs * 0.35, Y(y) - Math.sin(a) * cs * 0.35); ctx.stroke(); }
        else { if (b.th !== 'rock') { ctx.globalAlpha = 0.35; D.circ(X(x), Y(y), cs * 0.22, T.acc); ctx.globalAlpha = 1; } D.circ(X(x), Y(y), cs * (b.th === 'rock' ? 0.15 : 0.1), T.shot, Math.max(1, cs * 0.03)); }
      });
      var boss = G.enemies.filter(function (q) { return q.boss && !q.dead; })[0], hq = b.bld.filter(function (e) { return e.bk === 'hq' && !e.dead; })[0];
      if (boss && hq) {
        var bp = Z.enemyPos(boss);
        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 6); ctx.strokeStyle = T.acc; ctx.lineWidth = Math.max(1.5, cs * 0.07); ctx.setLineDash([cs * 0.2, cs * 0.15]); ctx.lineDashOffset = -t * cs; ctx.beginPath(); ctx.moveTo(X(hq.x), Y(hq.y - 1.6)); ctx.lineTo(X(bp.x), Y(bp.y - 0.8)); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 0.22 + (boss.lairHit > 0 ? 0.3 : 0); D.circ(X(bp.x), Y(bp.y - 0.7 * (boss.size || 1)), cs * 0.85 * (boss.size || 1), T.acc); ctx.globalAlpha = 1;
        if (boss.lairHit > 0) boss.lairHit -= Z.frameDt || 0.016;
      }
      // прикрытие турелей у ворот: полоса перед стеной и блеск на прикрытых врагах
      var nT = turretsAlive(b);
      if (nT && !b.fallen) {
        ctx.globalAlpha = 0.08 + 0.03 * Math.sin(t * 2); ctx.fillStyle = T.acc; ctx.fillRect(X(0), Y(b.S), X(G.L.W) - X(0), cs * 3); ctx.globalAlpha = 1;
        G.enemies.forEach(function (q) { if (q.dead || !(q.covT > 0)) return; q.covT -= Z.frameDt || 0.016; var qp = Z.enemyPos(q); ctx.globalAlpha = 0.5; ctx.strokeStyle = T.acc; ctx.lineWidth = Math.max(1.5, cs * 0.05); ctx.beginPath(); ctx.arc(X(qp.x), Y(qp.y) - cs * 0.4 * (q.size || 1), cs * 0.42 * (q.size || 1), Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.globalAlpha = 1; });
      }
      (G.cShots || []).forEach(function (c2) { var p2 = c2.t / c2.dur, cx2 = c2.x0 + (c2.x1 - c2.x0) * p2, cy2 = c2.y0 + (c2.y1 - c2.y0) * p2 - Math.sin(p2 * Math.PI) * 1.1; ctx.globalAlpha = 0.35; D.circ(X(cx2 - (c2.x1 - c2.x0) * 0.04), Y(cy2 + 0.05), cs * 0.07, '#c9cfdc'); ctx.globalAlpha = 1; D.circ(X(cx2), Y(cy2), cs * 0.11, '#2a2e3a', Math.max(1, cs * 0.03)); });
      if (b.hornFx > 0) { ctx.globalAlpha = Math.min(1, b.hornFx) * 0.4; ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = cs * 0.12; var r2 = (1.2 - b.hornFx) * cs * 6; ctx.beginPath(); ctx.ellipse(X(G.L.W / 2), Y(1), r2, r2 * 0.5, 0, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      if (b.strike && !b.strike.hit) { var s2 = b.strike, e2 = s2.e, pp = Math.min(1, s2.t / 1.1), ix = X(e2.x), iy = Y(e2.y - 0.6) - (1 - pp) * cs * 8; ctx.save(); ctx.translate(ix, iy); ctx.fillStyle = '#bfefff'; ctx.strokeStyle = D.OL; ctx.lineWidth = Math.max(2, cs * 0.06); ctx.beginPath(); ctx.moveTo(-cs * 0.35, -cs * 1.6); ctx.lineTo(cs * 0.35, -cs * 1.6); ctx.lineTo(0, cs * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); ctx.globalAlpha = 0.3 * pp; D.ell(ix, Y(e2.y), cs * 0.9, cs * 0.3, '#3a4a80'); ctx.globalAlpha = 1; }
    }
  } catch (er) { ctx.globalAlpha = 1; ctx.setLineDash([]); }
  if (oOver) oOver(ctx, X, Y, cs, t);
};
// кнопка «Удар Деда Мороза» за рекламу — один раз за уровень, пока стоит логово
var oRender = Z.ui.render;
Z.ui.render = function (c, W, H) {
  var r = oRender.apply(this, arguments);
  try {
    var UI = Z.ui, G = Z.G, b = G && G.base;
    if (UI.screen === 'level' && b && !b.fallen && !b.strikeUsed && !b.strike && G.phase === 'wave' && !UI.modal && Z.SDK && Z.SDK.rewarded) {
      var A = UI.api(), S = A.S || 1, L = UI.L, bw = Math.min(200 * S, L.sw * 0.55), bh = 36 * S, bx = L.sa.x + (L.sa.w - bw) / 2, by = L.inT + 8 * S, lbl = TT('Удар Деда Мороза', 'Frost strike');
      A.button('lairStrike', bx, by, bw, bh, { r: 12 * S, c1: '#9a7ce8', c2: '#6b4fc0', fn: function () {
        Z.SDK.rewarded(function () { b.strikeUsed = true; strike(G, b); Z.AU.sfx('reward'); }, function () { Z.lastReward = Z.time; });
      }, draw: function (x, y, w, h) { if (D.adIcon) D.adIcon(x + h * 0.5, y + h / 2, h * 0.28); D.text(lbl, x + h * 0.95 + (w - h * 1.05) / 2, y + h / 2, Math.max(11, D.fitText(lbl, w - h * 1.15, 14 * S)), '#fff', 'center', 'middle', 2.5 * S); } });
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};
})();
