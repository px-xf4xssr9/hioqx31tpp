/* Генерация карт: прямоугольное поле под экран, сеть дорог с развилками, препятствия, река */
(function () {
'use strict';
var Z = window.Z;
var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
var W = 10, H = 10;
function key(c, r) { return r * W + c; }
function inb(c, r) { return c >= 0 && r >= 0 && c < W && r < H; }
function ri(rnd, a, b) { return a + Math.floor(rnd() * (b - a + 1)); }

// размер поля под пропорции окна
// большие карты: поле крупнее экрана — двигай и приближай
Z.bigDims = function (d) { return d.H > d.W ? { W: Math.round(d.W * 1.55), H: Math.round(d.H * 1.45) } : d.W > d.H ? { W: Math.round(d.W * 1.45), H: Math.round(d.H * 1.55) } : { W: 15, H: 15 }; };
Z.pickDims = function (aspect) {
  if (aspect < 0.85) return { W: 9, H: Math.max(11, Math.min(16, Math.round(9 / aspect))) };
  if (aspect > 1.18) return { W: Math.max(11, Math.min(16, Math.round(9 * aspect))), H: 9 };
  return { W: 10, H: 10 };
};

// Дейкстра по сетке со своими весами
function route(from, to, blocked, weights) {
  var n = W * H, dist = [], prev = [], done = [];
  for (var i = 0; i < n; i++) { dist[i] = Infinity; prev[i] = -1; done[i] = false; }
  var s = key(from[0], from[1]), t = key(to[0], to[1]);
  dist[s] = 0;
  for (;;) {
    var u = -1, best = Infinity;
    for (var j = 0; j < n; j++) if (!done[j] && dist[j] < best) { best = dist[j]; u = j; }
    if (u < 0 || u === t) break;
    done[u] = true;
    var uc = u % W, ur = Math.floor(u / W);
    for (var d = 0; d < 4; d++) {
      var nc = uc + DIRS[d][0], nr = ur + DIRS[d][1];
      if (!inb(nc, nr)) continue;
      var v = key(nc, nr);
      if (v !== t && blocked[v]) continue;
      var nd = dist[u] + weights[v];
      if (nd < dist[v]) { dist[v] = nd; prev[v] = u; }
    }
  }
  if (dist[t] === Infinity) return null;
  var path = [], cur = t;
  while (cur >= 0) { path.push([cur % W, Math.floor(cur / W)]); cur = prev[cur]; }
  return path.reverse();
}
function emptyGrid() { var g = []; for (var r = 0; r < H; r++) { g.push([]); for (var c = 0; c < W; c++) g[r].push(0); } return g; }
function falses() { var a = []; for (var i = 0; i < W * H; i++) a[i] = false; return a; }

Z.genLevel = function (idx, dims) {
  var info = Z.LEVELS[idx];
  dims = dims || { W: 10, H: 10 };
  for (var attempt = 0; attempt < 300; attempt++) {
    W = dims.W; H = dims.H;
    var rnd = Z.rng(1000 + idx * 7919 + attempt * 104729 + W * 31 + H * 7);
    var L = info.type === 'escort' ? genEscort(rnd, info) : genDefend(rnd, info);
    if (L) { L.W = W; L.H = H; decorate(L, rnd, info); return L; }
  }
  throw new Error('level gen failed ' + idx);
};

function entrancesFor(rnd, info, fort) {
  var n = Z.endlessGen ? (W * H > 260 ? 5 : 4) :   /* 2.11.5: в бесконечном режиме норы открываются по ходу — до пяти */ info.idx < 2 ? 1 : info.idx < 9 ? 2 : (info.region >= 3 || info.type === 'boss' ? 3 : 2);
  var list = [], tries = 0;
  while (list.length < n && tries++ < 60) {
    var e, side = list.length === 0 ? 0 : Math.floor(rnd() * 3);
    if (side === 0) e = [ri(rnd, 1, W - 2), 0];
    else if (side === 1) e = [0, ri(rnd, 1, Math.max(1, Math.floor(H * 0.5)))];
    else e = [W - 1, ri(rnd, 1, Math.max(1, Math.floor(H * 0.5)))];
    var ok = true;
    for (var i = 0; i < list.length; i++) if (Math.abs(list[i][0] - e[0]) + Math.abs(list[i][1] - e[1]) < Math.max(4, Math.floor((W + H) / 4))) ok = false;
    if (ok) list.push(e);
  }
  return list.length ? list : null;
}

function genDefend(rnd, info) {
  var fort = [ri(rnd, 2, W - 3), H - 1];
  var ents = entrancesFor(rnd, info, fort); if (!ents) return null;
  var blocked = falses();
  [[-1, 0], [1, 0], [-1, -1], [1, -1]].forEach(function (d) { var c = fort[0] + d[0], r = fort[1] + d[1]; if (inb(c, r)) blocked[key(c, r)] = true; });
  for (var wc = 0; wc < W; wc++) if (wc !== fort[0]) blocked[key(wc, H - 1)] = true; // нижний ряд — крепостная стена
  var roadMask = falses(), paths = [];
  function wts(roadW, otherW) { var w = []; for (var i = 0; i < W * H; i++) w[i] = roadMask[i] ? roadW : otherW(); return w; }
  for (var e = 0; e < ents.length; e++) {
    var ent = ents[e];
    var wp = [ri(rnd, 1, W - 2), ri(rnd, Math.floor(H * 0.3), Math.floor(H * 0.7))];
    var w1 = wts(0.6, function () { return 1 + rnd() * 7; });
    var a = route(ent, wp, blocked, w1); if (!a) return null;
    var w2 = wts(0.6, function () { return 1 + rnd() * 7; });
    var b = route(wp, fort, blocked, w2); if (!b) return null;
    var p = a.concat(b.slice(1));
    // без петель: если клетка повторяется, вырезаем кусок
    var seen = {}, clean = [];
    for (var i = 0; i < p.length; i++) { var k = key(p[i][0], p[i][1]); if (seen[k] !== undefined) { clean = clean.slice(0, seen[k] + 1); var tmp = {}; clean.forEach(function (q, ii) { tmp[key(q[0], q[1])] = ii; }); seen = tmp; continue; } seen[k] = clean.length; clean.push(p[i]); }
    if (clean.length < Math.floor(H * 0.9)) return null;
    clean.forEach(function (q) { roadMask[key(q[0], q[1])] = true; });
    paths.push(clean);
  }
  // объездные дороги — альтернативы, чтобы враги могли выбирать маршрут
  var loops = info.idx < 3 ? 0 : Math.min(2, 1 + Math.floor(info.idx / 14));
  var made = 0;
  for (var l = 0; l < loops * 4 && made < loops; l++) {
    var pa = paths[Math.floor(rnd() * paths.length)], pb = paths[Math.floor(rnd() * paths.length)];
    var A = pa[Math.floor(pa.length * (0.15 + rnd() * 0.3))], B = pb[Math.floor(pb.length * (0.55 + rnd() * 0.3))];
    if (!A || !B || (A[0] === B[0] && A[1] === B[1])) continue;
    var w3 = wts(9, function () { return 1 + rnd() * 3; });
    var bl2 = blocked.slice();
    var seg = route(A, B, bl2, w3);
    if (!seg || seg.length < 5) continue;
    var newCells = 0; seg.forEach(function (q) { if (!roadMask[key(q[0], q[1])]) newCells++; });
    if (newCells < 3) continue;
    seg.forEach(function (q) { roadMask[key(q[0], q[1])] = true; });
    paths.push(seg); made++;
  }
  var g = emptyGrid();
  for (var r = 0; r < H; r++) for (var c = 0; c < W; c++) if (roadMask[key(c, r)]) g[r][c] = 1;
  [[-1, 0], [1, 0], [-1, -1], [1, -1]].forEach(function (d) { var c = fort[0] + d[0], r = fort[1] + d[1]; if (inb(c, r) && g[r][c] === 0) g[r][c] = 9; });
  for (var wc2 = 0; wc2 < W; wc2++) if (wc2 !== fort[0]) g[H - 1][wc2] = 9;
  return { greatWall: true, idx: info.idx, type: info.type, grid: g, paths: paths, fort: fort, entrances: ents, main: paths[0] };
}

function genEscort(rnd, info) {
  // сани идут вдоль длинной стороны поля
  var vertical = H > W;
  var start, end, w1, w2;
  if (vertical) { start = [ri(rnd, 2, W - 3), 0]; end = [ri(rnd, 2, W - 3), H - 1]; w1 = [ri(rnd, 1, W - 2), Math.floor(H * 0.33)]; w2 = [ri(rnd, 1, W - 2), Math.floor(H * 0.66)]; }
  else { start = [0, ri(rnd, 2, H - 3)]; end = [W - 1, ri(rnd, 2, H - 3)]; w1 = [Math.floor(W * 0.33), ri(rnd, 1, H - 2)]; w2 = [Math.floor(W * 0.66), ri(rnd, 1, H - 2)]; }
  var blocked = falses(), main = [], pts = [start, w1, w2, end];
  for (var p = 0; p < 3; p++) {
    var wts = []; for (var i = 0; i < W * H; i++) wts[i] = 1 + rnd() * 6;
    var b2 = blocked.slice();
    var seg = route(pts[p], pts[p + 1], b2, wts); if (!seg) return null;
    if (main.length) seg.shift();
    seg.forEach(function (q) { blocked[key(q[0], q[1])] = true; });
    blocked[key(pts[p + 1][0], pts[p + 1][1])] = false;
    main = main.concat(seg);
  }
  var len = vertical ? H : W;
  if (main.length < len + 2 || main.length > len * 3) return null;
  var roadMask = falses(); main.forEach(function (q) { roadMask[key(q[0], q[1])] = true; });
  // боковые входы с дорожками к главной дороге
  var sides = [], fr = [0.38, 0.72];
  for (var s = 0; s < 2; s++) {
    var ji = Math.floor(main.length * fr[s]), j = main[ji];
    var ent = vertical ? [s === 0 ? 0 : W - 1, ri(rnd, 2, H - 3)] : [ri(rnd, 2, W - 3), s === 0 ? 0 : H - 1];
    if (roadMask[key(ent[0], ent[1])]) return null;
    var ww = []; for (var q = 0; q < W * H; q++) ww[q] = roadMask[q] ? 50 : 1 + rnd() * 4;
    var sp = route(ent, j, falses(), ww);
    if (!sp || sp.length < 3) return null;
    sp.forEach(function (c) { roadMask[key(c[0], c[1])] = true; });
    sides.push({ cells: sp, junction: ji });
  }
  var g = emptyGrid();
  for (var r = 0; r < H; r++) for (var c = 0; c < W; c++) if (roadMask[key(c, r)]) g[r][c] = 1;
  var houses = [];
  [0.3, 0.58, 0.86].forEach(function (f) {
    var ii = Math.floor(main.length * f);
    for (var tries = 0; tries < 6; tries++) {
      var cell = main[Math.min(main.length - 2, ii + tries)], opts = [];
      for (var d = 0; d < 4; d++) { var nc = cell[0] + DIRS[d][0], nr = cell[1] + DIRS[d][1]; if (inb(nc, nr) && g[nr][nc] === 0) opts.push([nc, nr]); }
      if (opts.length) { var h = opts[Math.floor(rnd() * opts.length)]; g[h[1]][h[0]] = 8; houses.push({ c: h[0], r: h[1], at: Math.min(main.length - 2, ii + tries), done: false }); break; }
    }
  });
  if (houses.length < 3) return null;
  return { idx: info.idx, type: 'escort', grid: g, main: main, sides: sides, houses: houses, start: start, end: end, entrances: sides.map(function (s) { return s.cells[0]; }), paths: [main].concat(sides.map(function (s) { return s.cells; })), vertical: vertical };
}

function tallFree(g, c, r) {
  for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) { var rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= H || cc >= W) continue; var v = g[rr][cc]; if (v === 8 || v === 11 || v === 9) return false; }
  return true;
}
function decorate(L, rnd, info) {
  var g = L.grid, reg = info.region;
  L.bridges = {}; L.ice = {};
  // река поперёк поля: мосты там, где её пересекает дорога; на Ледяном озере — замёрзшая (по льду можно идти)
  if (L.type !== 'escort' && rnd() < (reg === 2 ? 1 : 0.6)) {
    var opts = [];
    for (var r = 3; r <= H - 4; r++) { var cr = 0; for (var c = 0; c < W; c++) if (g[r][c] === 1) cr++; if (cr >= 1) opts.push(r); }
    if (opts.length) {
      var rr = opts[Math.floor(rnd() * opts.length)];
      for (var c2 = 0; c2 < W; c2++) {
        if (g[rr][c2] === 1) L.bridges[key(c2, rr)] = true;
        else if (g[rr][c2] === 0) g[rr][c2] = reg === 2 ? 5 : 4;
      }
      L.riverRow = rr; L.riverFrozen = reg === 2;
    }
  }
  var road = {}; for (var r2 = 0; r2 < H; r2++) for (var c3 = 0; c3 < W; c3++) if (g[r2][c3] === 1) road[key(c3, r2)] = 1;
  var nearEnt = {}; (L.entrances || []).forEach(function (e) { for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) nearEnt[key(e[0] + dc, e[1] + dr)] = 1; });
  // ориентир региона 2x2
  var blocks = [];
  for (var lr = 0; lr < H - 1; lr++) for (var lc = 0; lc < W - 1; lc++) {
    var okb = true;
    for (var q1 = 0; q1 < 2; q1++) for (var q2 = 0; q2 < 2; q2++) if (g[lr + q1][lc + q2] !== 0 || nearEnt[key(lc + q2, lr + q1)]) okb = false;
    if (okb) blocks.push([lc, lr]);
  }
  var blocksHi = blocks.filter(function (q) { return q[1] <= H - 4; }); if (blocksHi.length) blocks = blocksHi;   // 2.11.5: не прячем ориентир за крепостной стеной внизу
  if (blocks.length) {
    var bl = blocks[Math.floor(rnd() * blocks.length)];
    for (var q3 = 0; q3 < 2; q3++) for (var q4 = 0; q4 < 2; q4++) g[bl[1] + q3][bl[0] + q4] = 11;
    L.landmark = { c: bl[0], r: bl[1] };
  }
  // рощи и камни кластерами (не у входов)
  var forest = [0.22, 0.14, 0.12, 0.16, 0.12][reg], rocks = [0.04, 0.03, 0.05, 0.12, 0.06][reg];
  var seeds = Math.round(W * H * forest / 3);
  for (var sd = 0; sd < seeds; sd++) {
    var sc = ri(rnd, 0, W - 1), sr = ri(rnd, 0, H - 1), n = 1 + Math.floor(rnd() * 4);
    for (var k = 0; k < n; k++) {
      var cc = sc + ri(rnd, -1, 1), rr2 = sr + ri(rnd, -1, 1);
      if (inb(cc, rr2) && g[rr2][cc] === 0 && !nearEnt[key(cc, rr2)]) g[rr2][cc] = 6;
    }
  }
  for (var r3 = 0; r3 < H; r3++) for (var c4 = 0; c4 < W; c4++) if (g[r3][c4] === 0 && !nearEnt[key(c4, r3)] && rnd() < rocks) g[r3][c4] = 7;
  // в деревне — избы
  if (reg === 1 && L.type !== 'escort') for (var hh = 0; hh < 8; hh++) { var hc = ri(rnd, 0, W - 1), hr = ri(rnd, 1, H - 2); if (g[hr][hc] === 0 && !nearEnt[key(hc, hr)] && tallFree(g, hc, hr)) g[hr][hc] = 8; }
  // высокие объекты не стоят друг над другом: над домом/ориентиром не может быть дома, дерева или камня
  for (var r6 = 1; r6 < H; r6++) for (var c7 = 0; c7 < W; c7++) {
    var v6 = g[r6][c7], up = g[r6 - 1][c7];
    if ((v6 === 8 || v6 === 11) && (up === 8 || up === 6 || up === 7)) { if (up === 8 && v6 === 8) g[r6][c7] = 0; else if (up !== 11) g[r6 - 1][c7] = 0; }
    if (v6 === 6 && up === 8) g[r6][c7] = 0;
  }
  // плато (уровень высоты 1), кусты, сугробы
  L.hgt = []; for (var hr0 = 0; hr0 < H; hr0++) { L.hgt.push([]); for (var hc0 = 0; hc0 < W; hc0++) L.hgt[hr0].push(0); }
  var nPl = [1, 1, 1, 3, 2][reg] + (W * H > 130 ? 1 : 0);
  if (info.idx < 2) nPl = 0;
  for (var pl = 0; pl < nPl; pl++) {
    for (var ptry = 0; ptry < 30; ptry++) {
      var pc = ri(rnd, 0, W - 1), pr0 = ri(rnd, 1, H - 3);
      if (g[pr0][pc] !== 0 || nearEnt[key(pc, pr0)] || L.hgt[pr0][pc]) continue;
      var blob = [[pc, pr0]], want = 4 + Math.floor(rnd() * 6), seenB = {}; seenB[key(pc, pr0)] = 1;
      for (var bi = 0; bi < blob.length && blob.length < want; bi++) {
        for (var dd = 0; dd < 4; dd++) {
          var nc = blob[bi][0] + DIRS[(dd + bi) % 4][0], nr = blob[bi][1] + DIRS[(dd + bi) % 4][1];
          if (!inb(nc, nr) || seenB[key(nc, nr)] || nr >= H - 1) continue;
          var gv = g[nr][nc]; if (gv !== 0 && gv !== 6 && gv !== 7) continue;
          if (nearEnt[key(nc, nr)] || (L.fort && Math.abs(nc - L.fort[0]) <= 1 && nr >= L.fort[1] - 1)) continue;
          seenB[key(nc, nr)] = 1; blob.push([nc, nr]); if (blob.length >= want) break;
        }
      }
      if (blob.length < 4) continue;
      blob.forEach(function (b) { L.hgt[b[1]][b[0]] = 1; });
      break;
    }
  }
  L.bush = {}; L.drift = {};
  var bushD = [0.09, 0.07, 0.06, 0.03, 0.02][reg], driftD = [0.03, 0.04, 0.04, 0.06, 0.08][reg];
  for (var r7 = 0; r7 < H; r7++) for (var c8 = 0; c8 < W; c8++) {
    var k7 = key(c8, r7); if (nearEnt[k7]) continue;
    if (L.fort && Math.abs(c8 - L.fort[0]) <= 1 && r7 >= L.fort[1] - 1) continue;
    if (g[r7][c8] === 0 && rnd() < bushD) L.bush[k7] = 1;
    else if ((g[r7][c8] === 0 || (g[r7][c8] === 1 && !L.bridges[k7] && !L.ice[k7])) && rnd() < driftD) { L.drift[k7] = 2 + Math.floor(rnd() * 2); var nb2 = DIRS[Math.floor(rnd() * 4)], c9 = c8 + nb2[0], r9 = r7 + nb2[1]; if (inb(c9, r9) && g[r9][c9] === 0 && !nearEnt[key(c9, r9)]) L.drift[key(c9, r9)] = 1 + Math.floor(rnd() * 2); }
  }
  // возвышенности: свободные клетки рядом с дорогой
  var cand = [];
  for (var r4 = 0; r4 < H; r4++) for (var c5 = 0; c5 < W; c5++) {
    if (g[r4][c5] !== 0 || L.bush[key(c5, r4)] || L.drift[key(c5, r4)] || (L.hgt && L.hgt[r4][c5])) continue;
    var adj = 0; for (var d = 0; d < 4; d++) if (road[key(c5 + DIRS[d][0], r4 + DIRS[d][1])] && inb(c5 + DIRS[d][0], r4 + DIRS[d][1])) adj++;
    if (adj) cand.push([c5, r4, rnd()]);
  }
  cand.sort(function (a, b) { return a[2] - b[2]; });
  var nh = Math.min(cand.length, 3 + (reg === 3 ? 2 : 0));
  for (var h = 0; h < nh; h++) g[cand[h][1]][cand[h][0]] = 3;
  // лёд на дороге
  var routeCells = L.paths[0];
  var nIce = 1 + Math.floor(rnd() * 2) + (reg >= 2 ? 1 : 0);
  for (var ni = 0; ni < nIce; ni++) {
    var at = 3 + Math.floor(rnd() * Math.max(1, routeCells.length - 8));
    for (var m = 0; m < 2; m++) { var ic = routeCells[at + m]; if (ic && !L.bridges[key(ic[0], ic[1])]) L.ice[key(ic[0], ic[1])] = true; }
  }
  // площадки (для совместимости с ботом и подсказками): лучшие клетки для вышек у дороги
  var spots = [];
  for (var r5 = 0; r5 < H; r5++) for (var c6 = 0; c6 < W; c6++) {
    if (g[r5][c6] !== 0 && g[r5][c6] !== 3) continue;
    if (L.bush[key(c6, r5)] || L.drift[key(c6, r5)]) continue;
    var cov = 0; for (var dr2 = -2; dr2 <= 2; dr2++) for (var dc2 = -2; dc2 <= 2; dc2++) if (inb(c6 + dc2, r5 + dr2) && road[key(c6 + dc2, r5 + dr2)]) cov += (Math.abs(dr2) <= 1 && Math.abs(dc2) <= 1) ? 2 : 1;
    if (cov) spots.push({ c: c6, r: r5, cov: cov + rnd() * 2, hill: g[r5][c6] === 3 });
  }
  spots.sort(function (a, b) { return b.cov - a.cov; });
  L.spots = spots.slice(0, 24);
}
Z.cellKey = function (c, r) { return r * Z.G.L.W + c; };
})();
