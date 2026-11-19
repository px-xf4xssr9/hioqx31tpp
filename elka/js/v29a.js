// v2.10: враги строят с умом, фургон-енотовоз, гаражи.
// 1) Стройка у нор — ответ на кемпинг: если у входа стоят наши пушки или герои, из норы выходит плотник
//    и ставит частокол (прикрывает врагов от прямых выстрелов) или дозорную вышку (теперь стреляет) между норой и пушками.
// 2) Плотник на дороге ставит вышку не где попало, а рядом с нашими пушками.
// 3) Фургон-енотовоз: водитель, громила в клетке, еноты на крыше. Едет до ёлки; у баррикады еноты спрыгивают;
//    сломал фургон — пассажиры вываливаются оглушёнными. Выезжает из гаража у норы (на крепостях — из мастерской).
(function () {
var Z = window.Z, D = Z.D, TT = Z.TT, _ = Z._;
var VAN_FROM = 8;

Z.ENEMIES.van = { prof: 'vehicle', role: 'run', hp: 170, spd: 1.5, armor: 3, coin: 22, dmg: 2, size: 1.6, vehicle: true, slowResist: 0.3, bar: 30 };
Z.FIRST.van = 99;   // в обычный набор волн не попадает — добавляется отдельно
Object.assign(Z.TXT.ru, {
  e_van: 'Енотовоз', e_vanD: 'Фургон с громилой в клетке и енотами на крыше. Едет до самой ёлки. Сломай его по дороге — пассажиры вывалятся оглушёнными',
  st_watchD: 'Ослабляет и обстреливает наши вышки рядом. Сломай бомбой, мортирой или любым героем.',
  st_palD: 'Прикрывает врагов рядом от выстрелов (взрывы бьют полностью). Сломай бомбой, мортирой или любым героем.'
});
Object.assign(Z.TXT.en, {
  e_van: 'Raccoon van', e_vanD: 'A van with a brute in a cage and raccoons on the roof. Drives all the way to the tree. Break it on the way and the passengers tumble out dazed',
  st_watchD: 'Weakens and shoots our towers nearby. Break it with a bomb, a mortar or any hero.',
  st_palD: 'Shields enemies next to it from shots (explosions still hit fully). Break it with a bomb, a mortar or any hero.'
});

function vs(G) { return G._vanStat || (G._vanStat = { n: 0, arrived: 0, killed: 0 }); }
function key(c, r) { return r * Z.G.L.W + c; }
function denR(G) { return G.L.W <= 16 ? 2.5 : 3; }
function struggling(G) { return (G.flow || 1) < (G.flow0 || 1) - 0.03 || G.hp < G.hpMax * 0.5; }
function flowK(G) { return struggling(G) ? 0.6 : 1; }
function structCap(G) { return G.endless ? 10 : G.idx < 10 ? 2 : G.idx < 20 ? 4 : 6; }
function liveStructs(G) { return (G.structs || []).filter(function (s) { return !s.dead && ['log', 'rocks', 'chest'].indexOf(s.type) < 0; }).length; }
function denList(G) { return G._den && G._den.g === G ? G._den.list : null; }
function inAnyDen(G, x, y, extra) { var L = denList(G); if (!L) return false; var R = denR(G) + (extra || 0); for (var i = 0; i < L.length; i++) if (Math.hypot(x - L[i].x, y - L[i].y) <= R) return true; return false; }
function isGarage(G, c, r) { var g = G.garage; return !!(g && g.c === c && g.r === r); }
// свободная клетка земли под постройку
function freeCell(G, c, r) {
  var L = G.L; if (c < 0 || r < 0 || c >= L.W || r >= L.H) return false;
  var k = r * L.W + c;
  if (L.grid[r][c] !== 0 || L.bush[k] || L.drift[k] || G.towers[k] || G.traps[k] || G.barricades[k]) return false;
  if (L.fort && Math.abs(c - L.fort[0]) <= 2 && r >= L.fort[1] - 2) return false;
  if (isGarage(G, c, r)) return false;
  if (G.base && r < G.base.S + 1) return false;
  if ((G.structs || []).some(function (s) { return s.c === c && s.r === r; })) return false;
  if ((G.squad || []).some(function (H) { return !H.dead && Math.floor(H.x) === c && Math.floor(H.y) === r; })) return false;
  return true;
}
function nearRoad(G, c, r) { var L = G.L; return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (d) { var g = L.grid[r + d[1]]; return g && g[c + d[0]] === 1; }); }

// ---------- постройки: гараж не занимать ----------
var oAdd = Z.addStruct;
Z.addStruct = function (type, c, r, dur, force) {
  var G = Z.G;
  if (G && isGarage(G, c, r)) return { done: true, dead: true, prog: 1, type: type, c: c, r: r };
  return oAdd.apply(this, arguments);
};

// ---------- плотник у норы: ответ на кемпинг ----------
function pickCounter(G, d) {
  var anchors = (d.tw || []).map(function (tw) { return { x: tw.c + 0.5, y: tw.r + 0.5, w: 1 + 0.5 * (tw.lvl - 1) }; }).concat((d.hs || []).filter(function (H) { return !H.dead; }).map(function (H) { return { x: H.x, y: H.y, w: 1.2 }; }));
  if (!anchors.length) return null;
  // главная цель — самая весомая пушка у входа, при равенстве — ближняя к норе
  anchors.sort(function (a, b) { return b.w - a.w || Math.hypot(a.x - d.x, a.y - d.y) - Math.hypot(b.x - d.x, b.y - d.y); });
  var A = anchors[0], R = denR(G), best = null, bs = -1e9, r0 = Math.ceil(R + 1);
  for (var dr = -r0; dr <= r0; dr++) for (var dc = -r0; dc <= r0; dc++) {
    var c = Math.floor(d.x) + dc, r = Math.floor(d.y) + dr;
    if (!freeCell(G, c, r)) continue;
    var cx = c + 0.5, cy = r + 0.5, dd = Math.hypot(cx - d.x, cy - d.y);
    if (dd < 1.3 || dd > R + 0.4) continue;   // у самого края круга — чтобы герой снаружи мог дотянуться
    var da = Math.hypot(cx - A.x, cy - A.y);
    if (da < 0.9) continue;
    var dot = ((cx - d.x) * (A.x - d.x) + (cy - d.y) * (A.y - d.y)) / ((dd || 1) * (Math.hypot(A.x - d.x, A.y - d.y) || 1));
    var s = -da * 0.9 - Math.abs(dd - 1.9) * 0.6 + dot * 1.6 + (nearRoad(G, c, r) ? 1.4 : 0) + Math.random() * 0.3;
    if (s > bs) { bs = s; best = [c, r]; }
  }
  return best;
}
function cbCount(G, i) { return (G.structs || []).filter(function (s) { return s.cb === i && !s.dead; }).length; }
function tryCounter(G, d) {
  var cap = d.P >= 6 ? 3 : 2, n = cbCount(G, d.i);
  if (n >= cap) return;
  if (G.enemies.some(function (e) { return !e.dead && e.cbDen === d.i && !e.cbDone; })) return;
  var cell = pickCounter(G, d); if (!cell) return;
  var type = n === 1 ? 'watch' : 'palisade';
  var opts = { cbDen: d.i, cbC: cell[0], cbR: cell[1], cbType: type };
  if (G.base) { opts.x = d.x; opts.y = d.y - 0.4; }   // у крепости — выходит из ворот
  var e = Z.spawn('engineer', d.i, (G.waveMul || 1) * 0.9, opts);
  if (!e) return;
  if (!G._cbTold) {
    G._cbTold = true;
    G.banner = { text: TT('Плотники укрепляют нору!', 'Carpenters fortify the den!'), sub: TT('Частокол прикрывает врагов от выстрелов, вышка обстреливает пушки. Ломай бомбой, мортирой или героем', 'A palisade shields enemies from shots, a watchtower shoots towers. Break them with a bomb, mortar or a hero'), t: 3.6, big: true };
  }
}
// короткий путь по проходимым клеткам (BFS), чтобы плотник не шёл сквозь ёлки и дома
function bfs(G, c0, r0, c1, r1) {
  var L = G.L, W = L.W, start = r0 * W + c0, goal = r1 * W + c1, prev = {}, q = [start], seen = {}; seen[start] = 1;
  for (var qi = 0; qi < q.length && qi < 400; qi++) {
    var u = q[qi]; if (u === goal) break;
    var uc = u % W, ur = (u - uc) / W;
    for (var k = 0; k < 4; k++) {
      var nc = uc + (k === 0 ? 1 : k === 1 ? -1 : 0), nr = ur + (k === 2 ? 1 : k === 3 ? -1 : 0), v = nr * W + nc;
      if (seen[v] || !(Z.walkable(nc, nr) || v === goal)) continue;
      seen[v] = 1; prev[v] = u; q.push(v);
    }
  }
  if (!seen[goal]) return null;
  var path = [], x = goal; while (x !== start && x !== undefined) { path.unshift([x % W, Math.floor(x / W)]); x = prev[x]; }
  return path;
}
function cbStep(G, e, dt, v) {
  if (e.building) {
    var s = e.building;
    if (s.done || s.dead || s.stalled) { e.building = null; e.cbDone = true; return false; }
    e.walk += dt * 6; e.lunge = Math.sin(G.t * 12) > 0.6 ? 0.12 : e.lunge; e.busyT = 0.4; e.dir = s.c + 0.5 > e.x ? 1 : -1;
    return true;
  }
  var c = e.cbC, r = e.cbR;
  if (!freeCell(G, c, r)) { e.cbDone = true; return false; }
  var tx = c + 0.5, ty = r + 0.5, d = Math.hypot(tx - e.x, ty - e.y);
  if (d < 0.85 && e.x >= 0 && e.y >= 0) {
    var st = Z.addStruct(e.cbType, c, r, 3.0, true);
    if (!st || st.dead) { e.cbDone = true; return false; }
    st.cb = e.cbDen; st.by = e; e.building = st; e.busyT = 0.4; if (Z.sndHammer) Z.sndHammer(c + 0.5, r + 0.5);
    if (Z.AU.voice) Z.AU.voice('sculptor', 'attack');
    return true;
  }
  var ec = Math.floor(e.x), er = Math.floor(e.y);
  if (!e.cbPath || e.cbPathAt !== ec + ',' + er) {
    e.cbPath = ec >= 0 && er >= 0 && ec < G.L.W && er < G.L.H ? bfs(G, ec, er, c, r) : [[c, r]];
    e.cbPathAt = ec + ',' + er;
    if (!e.cbPath) e.cbPath = [[c, r]];
  }
  var wp = e.cbPath[0] || [c, r], wx = wp[0] + 0.5, wy = wp[1] + 0.5, wd = Math.hypot(wx - e.x, wy - e.y);
  if (wd < 0.15 && e.cbPath.length > 1) { e.cbPath.shift(); return true; }
  var step = Math.min(wd, (v || e.spd) * dt);
  if (wd > 0.001) { e.x += (wx - e.x) / wd * step; e.y += (wy - e.y) / wd * step; e.dir = wx > e.x ? 1 : wx < e.x ? -1 : e.dir; }
  e.walk += dt * (4 + (v || e.spd) * 6); e.busyT = 0.4; e.dleft = 30;
  return true;
}
// плотник на дороге: если рядом наши пушки — ставит вышку возле них
function roadBuild(G, e) {
  if (e.building || (e.built || 0) >= 2 || e.moved < 1.2 || e.dleft <= 2.5 || G.base && e.y < G.base.S + 1) return false;
  if (inAnyDen(G, e.x, e.y, 0.3)) return false;
  var tw = null, bd = 2.3;
  for (var k in G.towers) { var t = G.towers[k], dd = Math.hypot(t.c + 0.5 - e.x, t.r + 0.5 - e.y); if (dd < bd) { bd = dd; tw = t; } }
  if (!tw || liveStructs(G) >= structCap(G)) return false;
  var ec = Math.floor(e.x), er = Math.floor(e.y), best = null, bs = 1e9;
  for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
    var c = ec + dc, r = er + dr; if (!freeCell(G, c, r)) continue;
    var s = Math.hypot(c + 0.5 - tw.c - 0.5, r + 0.5 - tw.r - 0.5); if (s < 0.9) s += 2;
    if (s < bs) { bs = s; best = [c, r]; }
  }
  if (!best) return false;
  var type = G.idx >= 8 ? (Math.random() < 0.6 ? 'watch' : 'snowtower') : 'palisade';
  if (!Z.STRUCT[type]) type = 'watch';
  var st = Z.addStruct(type, best[0], best[1], 3.2, true);
  if (!st || st.dead) return false;
  st.by = e; e.building = st; e.moved = 0; e.busyT = 0.4;
  if (Z.AU.voice) Z.AU.voice('sculptor', 'attack');
  return true;
}

// ---------- фургон-енотовоз ----------
function roofN(G) { return G.info.region >= 3 ? 3 : G.info.region >= 2 ? 2 : 1; }
function passenger(G, type, x, y, hm, stun) {
  var e = Z.spawn(type, 0, hm, { x: x, y: y });
  if (e && stun) { e.stun = stun; e.dazeT = stun; }
  return e;
}
function unloadRoof(G, e, stun) {
  var n = e.roof || 0; e.roof = 0; e.roofOff = true;
  for (var i = 0; i < n; i++) passenger(G, 'raccoon', e.x + (i - (n - 1) / 2) * 0.35, e.y + 0.25 + (i % 2) * 0.15, e.hm || 1, stun);
  return n;
}
function vanStep(G, e, dt) {
  e.engT = (e.engT || 0) - dt;
  if (e.engT <= 0) { e.engT = 0.18 + Math.random() * 0.1; if (G.fx.length < 400) G.fx.push({ k: 'smoke', x: e.x - (e.dir || 1) * 0.7, y: e.y - 0.25, vy: -0.4, t: 0, dur: 0.7, r: 0.09 }); }
  var hpk = e.hp / e.max;
  if (hpk < 0.6) { e.smT = (e.smT || 0) - dt; if (e.smT <= 0) { e.smT = hpk < 0.3 ? 0.12 : 0.28; if (G.fx.length < 420) G.fx.push({ k: 'smoke', x: e.x + (Math.random() - 0.5) * 0.4, y: e.y - 0.9, vy: -0.6, t: 0, dur: 1.2, r: hpk < 0.3 ? 0.22 : 0.16 }); } }
  // упёрся в баррикаду — еноты с крыши спрыгивают и помогают ломать
  if (!e.roofOff && e.tc) {
    var b = G.barricades[key(e.tc[0], e.tc[1])];
    if (b && Math.hypot(e.tc[0] + 0.5 - e.x, e.tc[1] + 0.5 - e.y) < 1.0) {
      if (unloadRoof(G, e, 0)) { _.addText(TT('Еноты спрыгнули!', 'Raccoons jump off!'), e.x, e.y - 1.4, '#ffcf6a', 1.2, 0.7); Z.AU.sfx('hut_land', 0.5); }
    }
  }
}
var oSiege = Z.hk.siege;
Z.hk.siege = function (e, dt, sp) {
  if (e.type === 'van' && !sp) {
    var G = Z.G;
    // врезается в ёлку и высаживает всех прямо у стены — каждый бьёт сам
    G.hp -= 1; G.hpLost += 1; G.fortHit = 0.5; G.shake = Math.max(G.shake || 0, 0.6);
    _.puff(e.x, e.y - 0.2, 14, 1.4); _.debris(e.x, e.y - 0.3, 10, ['#e8484f', '#8a5a30', '#3d4252', '#ffd54a']);
    G.fx.push({ k: 'ring', x: e.x, y: e.y, r: 1.4, t: 0, dur: 0.5, col: '#ffe1a8' });
    Z.AU.sfx('crash', 0.9); Z.AU.sfx('metal', 0.7); Z.AU.boom && Z.AU.boom(1.1);
    var hm = e.hm || 1;
    passenger(G, 'raccoon', e.x - 0.3, e.y, hm, 0);
    passenger(G, 'fat', e.x + 0.25, e.y, hm * 0.9, 0);
    unloadRoof(G, e, 0);
    e.dead = true; e.arrived = true; vs(G).arrived++;
    return true;
  }
  return oSiege ? oSiege(e, dt, sp) : false;
};
var oKill = Z.hk.kill;
Z.hk.kill = function (e) {
  if (e.type === 'van' && !e.arrived) {
    var G = Z.G, hm = e.hm || 1; vs(G).killed++;
    e.chained = true;   // не взрывается — разваливается, клетка распахивается
    G.fx.push({ k: 'boom', x: e.x, y: e.y - 0.3, t: 0, dur: 0.45 }); G.fx.push({ k: 'ring', x: e.x, y: e.y, r: 1.2, t: 0, dur: 0.4, col: '#ffe1a8' });
    _.debris(e.x, e.y - 0.4, 12, ['#3d4252', '#6a7080', '#e8484f', '#8a5a30']);
    G.shake = Math.max(G.shake || 0, 0.3); Z.AU.sfx('metal', 0.8); Z.AU.sfx('crack', 0.7);
    passenger(G, 'raccoon', e.x + (e.dir || 1) * 0.45, e.y + 0.1, hm, 1.5);
    passenger(G, 'fat', e.x - (e.dir || 1) * 0.3, e.y + 0.05, hm * 0.9, 1.5);
    unloadRoof(G, e, 1.5);
    _.addText(TT('Фургон разбит!', 'Van wrecked!'), e.x, e.y - 1.5, '#ffd54a', 1.3, 0.8);
  }
  if (oKill) oKill(e);
};
var oSpeed = Z.hk.speed;
Z.hk.speed = function (e, pos, k) {
  var r = oSpeed ? oSpeed(e, pos, k) : k;
  if (e.type === 'van') r *= 0.6 + 0.4 * Math.max(0, e.hp / e.max);   // подбитый фургон плетётся
  return r;
};

// ---------- волны: фургоны со второго региона ----------
var oMW = Z.makeWaves;
Z.makeWaves = function (info, heroic, L) {
  var W = oMW.apply(this, arguments);
  if (!L || L.type === 'escort' || L.base || info.idx < VAN_FROM || info.type === 'escort') return W;
  var rnd = Z.rng(8800 + info.idx * 7), late = info.region >= 3;
  W.forEach(function (w, i) {
    if (i < 1 || !w.list.length) return;
    if (info.type === 'boss' && i === W.length - 1) return;
    // 2.10.1: фургон в каждой волне со второй, к концу уровня — по два; на первом знакомстве — два за уровень
    var n = 1;
    if (i >= W.length - (late ? 3 : 2)) n = 2;
    if (info.idx === VAN_FROM) n = i === 2 || i === 4 ? 1 : 0;
    for (var q = 0; q < n; q++) { var at = w.list[Math.min(w.list.length - 1, Math.floor(w.list.length * (0.3 + 0.35 * q + rnd() * 0.1)))]; w.list.push({ t: (at ? at.t : 1) + 0.05, type: 'van', path: Math.floor(rnd() * (L.entrances ? L.entrances.length : 1)) }); }
    w.list.sort(function (a, b) { return a.t - b.t; });
  });
  return W;
};

// ---------- гараж у норы ----------
function pickGarage(G) { return pickGarage2(G, 2, 4, false) || pickGarage2(G, 1, 6, true); }
function pickGarage2(G, D0, D1, loose) {
  // 2.10.1: гараж — отдельная постройка у обочины в 2–4 клетках от норы, а не вплотную к ней
  var ROAD = { 1: 1, 3: 1, 5: 1 }, L = G.L, W = L.W, best = null, bs = -1e9, ENT = L.entrances || [];
  function nearEnt(c, r) { return ENT.some(function (en) { return Math.max(Math.abs(en[0] - c), Math.abs(en[1] - r)) <= 1; }); }
  ENT.forEach(function (en, i) {
    var start = en[1] * W + en[0], dist = {}, q = [start]; dist[start] = 0;
    for (var qi = 0; qi < q.length; qi++) {
      var u = q[qi], uc = u % W, ur = (u - uc) / W; if (dist[u] >= D1) continue;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var nc = uc + d[0], nr = ur + d[1], v = nr * W + nc; if (nc < 0 || nr < 0 || nc >= W || nr >= L.H || dist[v] !== undefined || !ROAD[L.grid[nr][nc]]) return; dist[v] = dist[u] + 1; q.push(v); });
    }
    q.forEach(function (u) {
      var du = dist[u]; if (du < D0 || du > D1) return;
      var uc = u % W, ur = (u - uc) / W;
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var c = uc + d[0], r = ur + d[1]; if (c < 0 || r < 0 || c >= W || r >= L.H) return;
        var k = r * W + c; if (L.grid[r][c] !== 0 || L.bush[k] || L.drift[k] || L.hgt[r][c] !== L.hgt[ur][uc] || (!loose && nearEnt(c, r)) || (c === en[0] && r === en[1])) return;
        if (L.fort && Math.abs(c - L.fort[0]) <= 2 && r >= L.fort[1] - 2) return;
        var s2 = -Math.abs(du - 3) * 0.8 - i * 0.4 + (d[1] === -1 ? 0.6 : 0) + (r > 0 ? 0.3 : 0);
        if (s2 > bs) { bs = s2; best = { c: c, r: r, ent: i, open: 0, lamp: 0, out: [-d[0], -d[1]] }; }
      });
    });
  });
  return best;
}
var oCB = Z.canBuildAt;
Z.canBuildAt = function (c, r) { var G = Z.G; if (G && isGarage(G, c, r)) return false; return oCB.apply(this, arguments); };
var oEZ = Z.inEnemyZone;
Z.inEnemyZone = function (c, r) { var G = Z.G; if (G && isGarage(G, c, r)) return true; return oEZ.apply(this, arguments); };
var oStart = Z.startLevel;
Z.startLevel = function () {
  var r = oStart.apply(this, arguments), G = Z.G;
  try {
    G.garage = null;
    if (G && G.L && !G.L.base && !G.endless && G.L.type !== 'escort' && (G.waves || []).some(function (w) { return w.list.some(function (s) { return s.type === 'van'; }); })) G.garage = pickGarage(G);
  } catch (e) { G.garage = null; }
  return r;
};
var oSpawn = Z.spawn;
Z.spawn = function (type, pathIdx, hpMul, opts) {
  var G = Z.G;
  if (type === 'van' && !(opts && opts.x !== undefined)) {
    if (G && struggling(G) && Math.random() < 0.5) return oSpawn.call(this, 'sled', pathIdx, hpMul, opts);   // проигрывающему — реже
  }
  var e = oSpawn.apply(this, arguments);
  if (!e || type !== 'van') return e;
  e.hm = hpMul || 1; e.shove = true; e.roof = roofN(G); vs(G).n++;
  var gar = G.garage;
  if (gar && !G.base && !(opts && opts.x !== undefined)) {
    e.emT = 0; if (e._emFx && G._emFx) { var ix = G._emFx.indexOf(e._emFx); if (ix >= 0) G._emFx.splice(ix, 1); }
    e.x = gar.c + 0.5; e.y = gar.r + 0.55; e.garT = 2.4; e.dir = gar.out[0] < 0 ? -1 : 1;
    gar.lamp = 2.4;
    if (Z.AU.at) Z.AU.at(e.x, e.y); Z.AU.sfx('hut_creak', 0.7); if (Z.sndVan) Z.sndVan(e.x, e.y); else Z.AU.sfx('sleigh', 0.35, { pitch: 0.6 });
  }
  if (!G._vanTold) {
    G._vanTold = true;
    G.banner = { text: TT('Енотовоз!', 'Raccoon van!'), sub: TT('Везёт громилу и енотов к ёлке. Сломай его по дороге!', 'It carries a brute and raccoons to the tree. Break it on the way!'), t: 3.2, big: true };
  }
  return e;
};
var oUnt = Z.hk.untargetable;
Z.hk.untargetable = function (e) { if (e.garT > 0) return true; return oUnt ? oUnt(e) : false; };
var oDmg = Z.hk.dmg;
Z.hk.dmg = function (e, real, opts) {
  var r = oDmg ? oDmg(e, real, opts) : real;
  if (r <= 0) return r;
  if (e.garT > 0) return 0;
  // частокол прикрывает от прямых выстрелов; взрывы (без опций) бьют полностью
  var G = Z.G, P = G && G._pal;
  if (P && P.length && opts && !e.neutral && !e.boss) {
    var direct = false; for (var k in opts) { direct = true; break; }
    if (direct) for (var i = 0; i < P.length; i++) if (Math.abs(P[i].x - e.x) < 1.2 && Math.abs(P[i].y - e.y) < 1.2 && Math.hypot(P[i].x - e.x, P[i].y - e.y) < 1.15) { e.coverT = 0.35; return r * 0.5; }
  }
  return r;
};
var oEnemy = Z.hk.enemy;
Z.hk.enemy = function (e, dt, v) {
  var G = Z.G;
  if (e.garT > 0) {
    e.garT -= dt; e.busyT = 0.4; e.dleft = 99;
    var gar = G.garage; if (gar) { e.x = gar.c + 0.5; e.y = gar.r + 0.55; }
    if (e.garT <= 0 && gar) { _.puff(e.x, e.y + 0.2, 8, 1); Z.AU.sfx('sleigh', 0.5, { pitch: 0.7 }); }
    return true;
  }
  if (e.type === 'van') vanStep(G, e, dt);
  if (e.cbDen !== undefined && !e.cbDone && !(e.emT > 0)) return cbStep(G, e, dt, v);
  if (e.type === 'engineer' && e.cbDen === undefined && !(e.emT > 0) && !e.repairOf && roadBuild(G, e)) return true;
  return oEnemy ? oEnemy(e, dt, v) : false;
};

// ---------- обновление: стройка у нор, стрельба вышек, гараж ----------
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!G || !G.L) return;
  try {
    var fight = G.phase === 'wave' || G.phase === 'escortRun';
    // частоколы — кэш на кадр
    G._pal = (G.structs || []).filter(function (s) { return s.type === 'palisade' && s.done && !s.dead; }).map(function (s) { return { x: s.c + 0.5, y: s.r + 0.5 }; });
    var L = denList(G);
    if (L && fight && G.idx >= 5 && !G.tutorial) L.forEach(function (d) {
      if (d.cbT === undefined) d.cbT = 10;
      if (!(d.P >= 1.5)) { d.cbT = Math.min(10, d.cbT + dt); return; }
      d.cbT -= dt;
      if (d.cbT <= 0) { d.cbT = Math.max(8, 15 - d.P * 0.8) / (struggling(G) ? 0.7 : 1); tryCounter(G, d); }
    });
    // дозорные вышки теперь и стреляют
    (G.structs || []).forEach(function (s) {
      if (s.type !== 'watch' || !s.done || s.dead) return;
      s.wcd = (s.wcd === undefined ? 2 : s.wcd) - dt; if (s.wcd > 0 || !fight) return;
      var x = s.c + 0.5, y = s.r + 0.5, tw = null, bd = 2.7;
      for (var k in G.towers) { var t = G.towers[k], dd = Math.hypot(t.c + 0.5 - x, t.r + 0.5 - y); if (dd < bd) { bd = dd; tw = t; } }
      if (!tw) { s.wcd = 0.5; return; }
      s.wcd = 4.5; s.fireT = 0.3;
      G.shots.push({ k: 'eball', x: x, y: y - 1.1, x0: x, y0: y - 1.1, tx: tw.c + 0.5, ty: tw.r + 0.5, t: 0, dur: 0.5, tw: tw, dmg: 10 * Math.pow(G.waveMul || 1, 0.5) * flowK(G) });
      Z.AU.sfx('back', 0.3, { pitch: 0.75, gap: 0.2 });
    });
    (G.structs || []).forEach(function (s) { if (s.fireT > 0) s.fireT -= dt; });
    // гараж: фонарь и ворота
    var gar = G.garage;
    if (gar) {
      var inside = G.enemies.some(function (e) { return !e.dead && e.garT > 0; });
      if (gar.lamp > 0) gar.lamp -= dt;
      var want = inside ? (G.enemies.some(function (e) { return !e.dead && e.garT > 0 && e.garT < 1.7; }) ? 1 : 0) : 0;
      if (!inside && gar.open > 0) { gar.hold = (gar.hold || 0) + dt; if (gar.hold < 0.8) want = 1; } else gar.hold = 0;
      gar.open += (want - gar.open) * Math.min(1, dt * (want ? 2.2 : 3));
    }
    for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (e.dazeT > 0) e.dazeT -= dt; if (e.coverT > 0) e.coverT -= dt; }
  } catch (er) { if (window.__rep) window.__rep(er); }
};

// ---------- рисование ----------
function vanDraw(e, x, y, cs, t) {
  var ctx = D.ctx, OL = D.OL, s = cs * 0.56 * ((e.size || 1.6) / 1.6), lw = Math.max(1.3, cs * 0.045), dir = e.dir || 1, flash = e.hitT > 0;
  var hpk = e.max ? Math.max(0, e.hp / e.max) : 1, wob = hpk < 0.6 ? Math.sin(t * 9 + (e.ph || 0)) * (0.6 - hpk) * 0.12 : 0;
  var bump = Math.abs(Math.sin((e.walk || 0) * 1.3)) * s * 0.04;
  ctx.save(); ctx.translate(x, y);
  D.ell(0, s * 0.05, s * 1.25, s * 0.22, 'rgba(30,40,80,0.22)');
  ctx.translate(0, -bump); ctx.rotate(wob); ctx.scale(dir, 1);
  ctx.lineWidth = lw; ctx.strokeStyle = OL;
  // полозья
  ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.moveTo(-s * 1.15, s * 0.0); ctx.lineTo(s * 1.0, s * 0.0); ctx.quadraticCurveTo(s * 1.3, s * 0.0, s * 1.3, -s * 0.22); ctx.stroke();
  ctx.strokeStyle = '#c9d2e3'; ctx.lineWidth = lw * 0.6; ctx.stroke(); ctx.strokeStyle = OL; ctx.lineWidth = lw;
  [-0.8, -0.1, 0.6].forEach(function (px) { ctx.beginPath(); ctx.moveTo(s * px, 0); ctx.lineTo(s * px, -s * 0.18); ctx.stroke(); });
  // рама
  D.rr(-s * 1.15, -s * 0.36, s * 2.3, s * 0.2, s * 0.06); ctx.fillStyle = flash ? '#fff' : '#5a3a20'; ctx.fill(); ctx.stroke();
  // клетка сзади: громила внутри
  var cx0 = -s * 1.1, cw = s * 1.25, ch = s * 1.05, ctop = -s * 0.36 - ch;
  D.rr(cx0, ctop, cw, ch, s * 0.06); ctx.fillStyle = 'rgba(40,46,70,0.55)'; ctx.fill();
  var shake = Math.sin(t * 11 + (e.ph || 0)) * s * 0.03;
  ctx.save(); ctx.beginPath(); ctx.rect(cx0, ctop, cw, ch); ctx.clip();
  ctx.scale(dir, 1);   // обратно без зеркала: D.enemy сам разворачивает по своему dir
  var bx = (cx0 + cw / 2) * dir + shake, by = -s * 0.38;
  D.enemy({ type: 'fat', size: 1.05, dir: dir, walk: t * 3, ph: 1, hitT: 0, lunge: Math.sin(t * 3) > 0.7 ? 0.15 : 0, lift: 0, kb: 0, slow: 0, hp: 1, max: 1, cage: true }, bx, by, cs, t);
  ctx.restore();
  ctx.lineWidth = lw; ctx.strokeStyle = OL;
  // прутья (трясутся, когда громила толкает)
  for (var b = 0; b <= 5; b++) { var bxx = cx0 + cw * b / 5 + (b > 0 && b < 5 ? shake * (b % 2 ? 1 : -1) : 0); ctx.strokeStyle = OL; ctx.lineWidth = lw * 1.5; ctx.beginPath(); ctx.moveTo(bxx, ctop); ctx.lineTo(bxx, -s * 0.36); ctx.stroke(); ctx.strokeStyle = '#8b93a7'; ctx.lineWidth = lw * 0.7; ctx.stroke(); }
  ctx.strokeStyle = OL; ctx.lineWidth = lw;
  D.rr(cx0 - s * 0.04, ctop - s * 0.1, cw + s * 0.08, s * 0.14, s * 0.04); ctx.fillStyle = flash ? '#fff' : '#3d4252'; ctx.fill(); ctx.stroke();
  D.rr(cx0 - s * 0.04, -s * 0.44, cw + s * 0.08, s * 0.12, s * 0.04); ctx.fillStyle = '#3d4252'; ctx.fill(); ctx.stroke();
  // замок
  D.circ(cx0 + cw * 0.5, -s * 0.62, s * 0.07, '#ffd54a', lw * 0.7);
  // кабина спереди
  var kx = s * 0.2, kw = s * 0.95, kh = s * 0.8;
  ctx.beginPath(); ctx.moveTo(kx, -s * 0.36); ctx.lineTo(kx, -s * 0.36 - kh); ctx.lineTo(kx + kw * 0.55, -s * 0.36 - kh); ctx.quadraticCurveTo(kx + kw * 0.95, -s * 0.36 - kh * 0.95, kx + kw, -s * 0.36 - kh * 0.45); ctx.lineTo(kx + kw, -s * 0.36); ctx.closePath();
  ctx.fillStyle = flash ? '#fff' : '#e8484f'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(kx + s * 0.05, -s * 0.36 - kh * 0.35, kw * 0.85, s * 0.06);
  // окно и водитель-енот
  ctx.save(); ctx.beginPath(); ctx.moveTo(kx + kw * 0.3, -s * 0.36 - kh * 0.92); ctx.lineTo(kx + kw * 0.55, -s * 0.36 - kh * 0.92); ctx.quadraticCurveTo(kx + kw * 0.86, -s * 0.36 - kh * 0.86, kx + kw * 0.9, -s * 0.36 - kh * 0.5); ctx.lineTo(kx + kw * 0.3, -s * 0.36 - kh * 0.5); ctx.closePath();
  ctx.fillStyle = '#bfe9ff'; ctx.fill(); ctx.clip();
  var hx = kx + kw * 0.55, hy = -s * 0.36 - kh * 0.62, hr = s * 0.2;
  D.circ(hx - hr * 0.7, hy - hr * 0.8, hr * 0.32, '#9aa1b5', lw * 0.6); D.circ(hx, hy, hr, '#9aa1b5', lw * 0.6);
  D.rr(hx - hr * 0.85, hy - hr * 0.3, hr * 1.7, hr * 0.5, hr * 0.2); ctx.fillStyle = '#3d4256'; ctx.fill();
  D.circ(hx + hr * 0.35, hy - hr * 0.08, hr * 0.17, '#fff'); D.circ(hx + hr * 0.4, hy - hr * 0.08, hr * 0.08, '#26304f');
  D.rr(hx - hr * 0.9, hy - hr * 1.15, hr * 1.6, hr * 0.35, hr * 0.15); ctx.fillStyle = '#2b3e75'; ctx.fill();   // кепка
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(kx + kw * 0.3, -s * 0.36 - kh * 0.92); ctx.lineTo(kx + kw * 0.55, -s * 0.36 - kh * 0.92); ctx.quadraticCurveTo(kx + kw * 0.86, -s * 0.36 - kh * 0.86, kx + kw * 0.9, -s * 0.36 - kh * 0.5); ctx.lineTo(kx + kw * 0.3, -s * 0.36 - kh * 0.5); ctx.closePath(); ctx.stroke();
  // фара и бампер
  D.rr(kx + kw - s * 0.05, -s * 0.5, s * 0.16, s * 0.16, s * 0.05); ctx.fillStyle = '#c9d2e3'; ctx.fill(); ctx.stroke();
  D.circ(kx + kw - s * 0.02, -s * 0.6, s * 0.08, '#ffe066', lw * 0.6);
  ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 8); ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.moveTo(kx + kw, -s * 0.6); ctx.lineTo(kx + kw + s * 0.7, -s * 0.85); ctx.lineTo(kx + kw + s * 0.7, -s * 0.35); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  // выхлопная труба
  ctx.fillStyle = '#6a7080'; ctx.fillRect(cx0 - s * 0.12, -s * 0.5, s * 0.14, s * 0.1); ctx.strokeRect(cx0 - s * 0.12, -s * 0.5, s * 0.14, s * 0.1);
  ctx.restore();
  // еноты на крыше клетки
  var n = e.roof === undefined ? 2 : e.roof;
  for (var i = 0; i < n; i++) {
    var rx = x + dir * (-s * 0.95 + i * s * 0.42), ry = y - bump - s * 0.36 - ch - s * 0.12;
    D.enemy({ type: 'raccoon', size: 0.68, dir: dir, walk: Math.sin(t * 4 + i) * 0.3, ph: i * 2, hitT: 0, lunge: 0, lift: 0, kb: 0, slow: 0, hp: 1, max: 1 }, rx, ry, cs, t);
  }
  // полоска здоровья
  if (e.max && e.hp < e.max) { var bw = s * 1.9, bh = Math.max(3, s * 0.1), bxx2 = x - bw / 2, byy = y - bump - s * 0.36 - ch - s * 0.95; ctx.fillStyle = OL; D.rr(bxx2 - 1, byy - 1, bw + 2, bh + 2, 2); ctx.fill(); ctx.fillStyle = '#ffb347'; ctx.fillRect(bxx2, byy, bw * hpk, bh); }
}
Z.drawVanDemo = vanDraw;
var oEnemyDraw = D.enemy;
D.enemy = function (e, x, y, cs, t) {
  if (e && e.type === 'van') {
    if (e.garT > 0) {
      var gar = Z.G && Z.G.garage; if (gar && gar.open < 0.15) return;
      // в гараже видно только то, что в проёме ворот
      var c0 = D.ctx; c0.save(); c0.beginPath(); c0.rect(x - cs * 0.57, y + cs * 0.4 - cs * 1.035, cs * 1.14, cs * 1.035); c0.clip();
      vanDraw(e, x, y, cs, t); c0.restore(); return;
    }
    return vanDraw(e, x, y, cs, t);
  }
  return oEnemyDraw.apply(this, arguments);
};
// гараж: сарай с подъёмными воротами, фонарь мигает перед выездом
function garageBack(ctx, X, Y, cs, t, g) {
  var x = X(g.c + 0.5), y = Y(g.r + 0.95), w = cs * 0.96, h = cs * 1.05;   // 2.11.5: гараж — в своей клетке, не налезает на дорогу
  D.ell(x + cs * 0.08, y + cs * 0.02, w * 0.56, cs * 0.16, 'rgba(30,40,80,0.2)');
  ctx.fillStyle = '#2a2433'; ctx.fillRect(x - w * 0.42, y - h * 0.9, w * 0.84, h * 0.9);
}
function garageFront(ctx, X, Y, cs, t, g) {
  var OL = D.OL, lw = Math.max(1.3, cs * 0.045), x = X(g.c + 0.5), y = Y(g.r + 0.95), w = cs * 0.96, h = cs * 1.05;   // 2.11.5: гараж — в своей клетке, не налезает на дорогу
  ctx.save(); ctx.lineWidth = lw; ctx.strokeStyle = OL;
  // стены по бокам проёма
  [-1, 1].forEach(function (sd) { var x0 = sd < 0 ? x - w / 2 : x + w * 0.38; D.rr(x0, y - h, w * 0.12, h, cs * 0.03); ctx.fillStyle = '#a0703f'; ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(60,35,15,0.5)'; for (var k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x0, y - h * k / 4); ctx.lineTo(x0 + w * 0.12, y - h * k / 4); ctx.stroke(); } ctx.strokeStyle = OL; });
  // ворота: доски, поднимаются вверх
  var op = Math.max(0, Math.min(1, g.open || 0)), dh = h * 0.9 * (1 - op);
  if (dh > 1) {
    D.rr(x - w * 0.38, y - h * 0.9, w * 0.76, dh, cs * 0.02); ctx.fillStyle = '#c58a55'; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(80,45,20,0.55)'; for (var p = 1; p < 5; p++) { var py = y - h * 0.9 + dh * p / 5; ctx.beginPath(); ctx.moveTo(x - w * 0.38, py); ctx.lineTo(x + w * 0.38, py); ctx.stroke(); }
    ctx.strokeStyle = OL;
    if (op < 0.1) { ctx.beginPath(); ctx.moveTo(x - w * 0.38, y - h * 0.9); ctx.lineTo(x + w * 0.38, y - h * 0.9 + dh); ctx.moveTo(x + w * 0.38, y - h * 0.9); ctx.lineTo(x - w * 0.38, y - h * 0.9 + dh); ctx.strokeStyle = 'rgba(80,45,20,0.6)'; ctx.stroke(); ctx.strokeStyle = OL; }
  }
  // крыша со снегом
  D.poly([x - w * 0.62, y - h * 0.95, x, y - h * 1.5, x + w * 0.62, y - h * 0.95], '#7a4a2a', lw);
  D.poly([x - w * 0.62, y - h * 0.95, x - w * 0.5, y - h * 1.08, x, y - h * 1.55, x + w * 0.5, y - h * 1.08, x + w * 0.62, y - h * 0.95, x + w * 0.4, y - h * 1.02, x, y - h * 1.38, x - w * 0.4, y - h * 1.02], '#f4f8ff', lw * 0.8);
  // вывеска с колесом
  D.circ(x, y - h * 1.18, cs * 0.13, '#3d4252', lw * 0.8); D.circ(x, y - h * 1.18, cs * 0.05, '#c9d2e3');
  // фонарь: мигает перед выездом
  var blink = g.lamp > 0 && Math.sin(t * 16) > 0;
  ctx.fillStyle = '#3d4252'; ctx.fillRect(x + w * 0.42, y - h * 1.08, cs * 0.05, cs * 0.18);
  D.circ(x + w * 0.445, y - h * 1.12, cs * 0.09, blink ? '#ff5a3c' : '#7a3a30', lw * 0.7);
  if (blink) { ctx.globalAlpha = 0.35; D.circ(x + w * 0.445, y - h * 1.12, cs * 0.3, '#ff8a5c'); ctx.globalAlpha = 1; }
  ctx.restore();
}
var oObjs = Z.drawObjs;
Z.drawObjs = function (objs, X, Y, cs, t) {
  if (oObjs) oObjs(objs, X, Y, cs, t);
  var G = Z.G, g = G && G.garage; if (!g) return;
  // 2.12: гараж — готовыми кадрами (v30o); ворота в движении и мигающая лампа — своими кадрами по состоянию
  objs.push({ y: g.r + 0.2, f: function () { if (Z.sceneSprite) Z.sceneSprite('garB', function () { garageBack(D.ctx, X, Y, cs, t, g); }); else garageBack(D.ctx, X, Y, cs, t, g); } });
  objs.push({ y: g.r + 0.9, f: function () {
    if (!Z.sceneSprite) return garageFront(D.ctx, X, Y, cs, t, g);
    var op = Math.round(Math.max(0, Math.min(1, g.open || 0)) * 24), bl = g.lamp > 0 ? (Math.sin(t * 16) > 0 ? 2 : 1) : 0;
    Z.sceneSprite('garF|' + op + '|' + bl, function () { var sv = Z.time, tq = bl === 2 ? Math.PI / 32 : bl === 1 ? Math.PI * 3 / 32 : 0; Z.time = tq; try { garageFront(D.ctx, X, Y, cs, tq, g); } finally { Z.time = sv; } });
  } });
};
// оглушённые пассажиры (звёздочки), прикрытие частоколом, выстрел вышки
var oOver = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  if (oOver) oOver(ctx, X, Y, cs, t);
  var G = Z.G; if (!G || !G.enemies) return;
  try {
    for (var i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i]; if (e.dead) continue;
      var ex = X(e.x), ey = Y(e.y - (e.lift || 0) * 0.32), sz = e.size || 1;
      if (e.dazeT > 0) for (var k = 0; k < 3; k++) { var a = t * 5 + k * 2.1; D.star(ex + Math.cos(a) * cs * 0.28 * sz, ey - cs * 0.85 * sz + Math.sin(a) * cs * 0.08, cs * 0.08, '#ffe066', 1); }
      if (e.coverT > 0) {
        ctx.globalAlpha = Math.min(1, e.coverT / 0.2) * 0.85;
        var sx = ex - cs * 0.32 * sz, sy = ey - cs * 0.55 * sz;
        D.rr(sx - cs * 0.1, sy - cs * 0.14, cs * 0.2, cs * 0.26, cs * 0.05); ctx.fillStyle = '#a0703f'; ctx.fill(); ctx.lineWidth = Math.max(1, cs * 0.03); ctx.strokeStyle = D.OL; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx - cs * 0.1, sy - cs * 0.02); ctx.lineTo(sx + cs * 0.1, sy - cs * 0.02); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    (G.structs || []).forEach(function (s) { if (s.type === 'watch' && s.fireT > 0) { ctx.globalAlpha = s.fireT / 0.3; D.circ(X(s.c + 0.5), Y(s.r + 0.72) - cs * 1.15, cs * 0.22, '#fff3c4'); ctx.globalAlpha = 1; } });
  } catch (er) { ctx.globalAlpha = 1; }
};
})();
