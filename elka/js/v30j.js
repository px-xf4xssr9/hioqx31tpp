/* 2.11.5 · «места героев сказки» — карта выглядит как место, где живёт хозяин:
   Лешачья чаща — густой тёмный лес: корявые старые деревья с дуплами (в них моргают глаза), тёмные ели, пни во мху,
   мухоморы, папоротник, корни, лесная подстилка, по краю поля — стена леса;
   Берлога великана — следы огромных ног, сломанные ели, ледяные глыбы; Избушка Яги — кривые ели, плетень, котелок, травы;
   Камыши Кикиморы — сухие деревья, камыш и рогоз, вмёрзшие кувшинки; Замок Кощея — мёртвые деревья, тёмные камни, кованые пики.
   Баланс почти не меняется: новые деревья-препятствия встают только вдали от дороги (≥3 клеток), рядом с ней — плоский декор. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = D.OL || '#1b2448';
function C() { return D.ctx; }
function H(c, r, k) { var x = Math.sin(c * 127.1 + r * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); }
function line(pts, col, w) { var c = C(); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); }
function bline(pts, col, w) { line(pts, OL, w + Math.max(1.2, w * 0.7)); line(pts, col, w); }
function E(x, y, rx, ry, f, l) { D.ell(x, y, rx, ry, f, l); }
function O(x, y, r, f, l) { D.circ(x, y, r, f, l); }

var TH = {
  leshy: { trees: [['oldtree', 0.3], ['darkfir', 0.3], ['firpair', 0.22], ['mossstump', 0.18]], deco: [['amanita', 0.24], ['fern', 0.26], ['roots', 0.2], ['branch', 0.12], ['moss', 0.18]], near: 0.62, mid: 0.72, far: 0.9, edge: 'forest', tint: [22, 64, 54, 0.3], eyes: true, dk: 1.3 },
  stomp: { trees: [['darkfir', 0.35], ['broken', 0.35], ['iceboulder', 0.3]], deco: [['footprint', 0.45], ['iceshard', 0.3], ['branch', 0.25]], near: 0.22, far: 0.35, edge: 'forest', tint: [90, 130, 200, 0.08] },
  hut: { trees: [['crooked', 0.4], ['darkfir', 0.3], ['mossstump', 0.3]], deco: [['amanita', 0.3], ['wattle', 0.25], ['herbs', 0.25], ['pot', 0.2]], near: 0.24, far: 0.45, edge: 'forest', tint: [60, 50, 80, 0.1] },
  swamp: { trees: [['deadtree', 0.4], ['cattails', 0.4], ['mossstump', 0.2]], deco: [['lily', 0.3], ['cattail', 0.4], ['moss', 0.3]], near: 0.3, far: 0.5, edge: 'reeds', tint: [60, 90, 60, 0.12] },
  koschei: { trees: [['deadtree', 0.5], ['darkrock', 0.5]], deco: [['spikes', 0.35], ['crack', 0.35], ['darkstone', 0.3]], near: 0.2, far: 0.4, edge: 'rocks', tint: [50, 40, 80, 0.12] }
};
function themeOf(idx) { var m = Z.MAPS && Z.MAPS[idx]; return m && TH[m[3]] ? m[3] : null; }
Z.mapTheme = function (G) { G = G || Z.G; return G && !G.endless && G.L && G.L.theme ? G.L.theme : null; };
function pick(set, v) { var a = 0; for (var i = 0; i < set.length; i++) { a += set[i][1]; if (v < a) return set[i][0]; } return set[0][0]; }

// ---------- карта: деревья вдали от дороги и места для плоского декора ----------
var oGen = Z.genLevel;
Z.genLevel = function (idx, dims) {
  var L = oGen.apply(this, arguments);
  try {
    var th = themeOf(idx); if (!th || !L || !L.grid) return L;
    var T = TH[th], W = L.W, Hh = L.H, g = L.grid, far = [], dist = [], INF = 99;
    for (var r = 0; r < Hh; r++) { dist.push([]); for (var c = 0; c < W; c++) { var v = g[r][c]; dist[r].push(v === 1 || v === 8 || v === 11 || v === 9 || (L.bridges && L.bridges[r * W + c]) ? 0 : INF); } }
    (L.entrances || []).forEach(function (e) { if (dist[e[1]] && dist[e[1]][e[0]] !== undefined) dist[e[1]][e[0]] = 0; });
    [L.start, L.end, L.fort].forEach(function (p) { if (Array.isArray(p) && dist[p[1]] && dist[p[1]][p[0]] !== undefined) dist[p[1]][p[0]] = 0; });
    for (var it = 0; it < 4; it++) for (var r1 = 0; r1 < Hh; r1++) for (var c1 = 0; c1 < W; c1++) for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      var rr = r1 + dr, cc = c1 + dc; if (rr < 0 || cc < 0 || rr >= Hh || cc >= W) continue; if (dist[rr][cc] + 1 < dist[r1][c1]) dist[r1][c1] = dist[rr][cc] + 1; }
    var deco = [];
    for (var r2 = 0; r2 < Hh; r2++) for (var c2 = 0; c2 < W; c2++) {
      if (g[r2][c2] !== 0 || (L.hgt && L.hgt[r2][c2]) || (L.bush && L.bush[r2 * W + c2])) continue;
      var d = dist[r2][c2], h = H(c2, r2, idx + 41);
      if (((d >= 3 && h < T.far) || (d === 2 && T.mid && h < T.mid)) && r2 < Hh - 1 && !(L.greatWall && r2 >= Hh - 3)) { g[r2][c2] = 6; continue; }   // густой лес вдали от дороги
      if (d >= 1 && H(c2, r2, idx + 57) < T.near) deco.push([c2, r2, pick(T.deco, H(c2, r2, idx + 63))]);
    }
    // над высоким не бывает высокого: дерево прямо под домом/ориентиром не ставим
    for (var r3 = 1; r3 < Hh; r3++) for (var c3 = 0; c3 < W; c3++) if ((g[r3][c3] === 8 || g[r3][c3] === 11) && g[r3 - 1][c3] === 6 && dist[r3 - 1][c3] >= 2) g[r3 - 1][c3] = 0;
    L.theme = th; L.themeDeco = deco;
  } catch (e) { if (window.__rep) window.__rep(e); }
  return L;
};

// ---------- деревья места ----------
var TREE = {};
TREE.darkfir = function (x, y, cs, s, j) { D.pine(x, y, s * (1.12 + j * 0.15), '#1f5646'); };
TREE.firpair = function (x, y, cs, s, j) { D.pine(x - cs * 0.17, y - cs * 0.05, s * 0.95, '#22604c'); D.pine(x + cs * 0.15, y + cs * 0.02, s * 0.8, '#1b4f40'); };
TREE.oldtree = function (x, y, cs, s, j, c0, r0) {   // корявый старый дуб: толстый ствол, корни, ветви-руки, дупло, мох
  var c = C(), l = Math.max(1.2, cs * 0.045), th = cs * (1.05 + j * 0.25), sw = (j - 0.5) * cs * 0.08;
  [[-1, 0.28], [1, 0.3], [-0.4, 0.2]].forEach(function (q) { bline([x + q[0] * cs * 0.08, y - cs * 0.06, x + q[0] * cs * q[1], y + cs * 0.02], '#5e4128', l * 1.1); });
  c.beginPath(); c.moveTo(x - cs * 0.24, y); c.quadraticCurveTo(x - cs * 0.1, y - th * 0.4, x - cs * 0.15 + sw, y - th); c.lineTo(x + cs * 0.13 + sw, y - th); c.quadraticCurveTo(x + cs * 0.06, y - th * 0.45, x + cs * 0.26, y); c.closePath();
  var g = c.createLinearGradient(x - cs * 0.24, 0, x + cs * 0.26, 0); g.addColorStop(0, '#7a5a3a'); g.addColorStop(1, '#4a3020'); c.fillStyle = g; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  line([x - cs * 0.06, y - th * 0.18, x - cs * 0.1, y - th * 0.5], 'rgba(30,20,10,0.45)', l * 0.5); line([x + cs * 0.08, y - th * 0.25, x + cs * 0.06, y - th * 0.45], 'rgba(30,20,10,0.35)', l * 0.5);
  bline([x - cs * 0.1 + sw, y - th * 0.86, x - cs * 0.38 + sw, y - th * 1.04, x - cs * 0.46 + sw, y - th * 1.2], '#5a4028', l * 1.1);
  bline([x - cs * 0.3 + sw, y - th * 0.99, x - cs * 0.42 + sw, y - th * 0.98], '#5a4028', l * 0.7);
  bline([x + cs * 0.08 + sw, y - th * 0.9, x + cs * 0.34 + sw, y - th * 1.1, x + cs * 0.36 + sw, y - th * 1.26], '#5a4028', l);
  E(x - cs * 0.01 + sw, y - th + cs * 0.02, cs * 0.22, cs * 0.075, '#ffffff');
  E(x - cs * 0.14, y - th * 0.7, cs * 0.1, cs * 0.05, '#6a9a4a', l * 0.4); E(x + cs * 0.12, y - cs * 0.06, cs * 0.12, cs * 0.05, '#6a9a4a', l * 0.4);
  E(x + cs * 0.005, y - th * 0.52, cs * 0.12, cs * 0.15, '#1a1008', l * 0.6);   // дупло (глаза в нём — живые, рисуются поверх)
  var G = Z.G; if (G && G.L && c0 !== undefined) { G.L._hol = G.L._hol || {}; G.L._hol[c0 + ',' + r0] = [(x + cs * 0.005) / cs, (y - th * 0.52) / cs]; }
};
TREE.mossstump = function (x, y, cs, s, j) {
  var c = C(), l = Math.max(1.2, cs * 0.045);
  D.rr(x - cs * 0.24, y - cs * 0.26, cs * 0.48, cs * 0.28, cs * 0.06); c.fillStyle = '#7a5434'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  E(x, y - cs * 0.26, cs * 0.24, cs * 0.08, '#c9a271', l * 0.8); E(x, y - cs * 0.26, cs * 0.14, cs * 0.045, null); c.strokeStyle = 'rgba(110,70,40,0.6)'; c.lineWidth = l * 0.5; c.stroke();
  E(x - cs * 0.06, y - cs * 0.31, cs * 0.17, cs * 0.05, '#ffffff');
  E(x - cs * 0.18, y - cs * 0.05, cs * 0.12, cs * 0.05, '#5f8f45'); E(x + cs * 0.14, y - cs * 0.12, cs * 0.08, cs * 0.04, '#6a9a4a');
  amanita(x + cs * 0.3, y + cs * 0.01, cs * 0.75); amanita(x + cs * 0.4, y + cs * 0.04, cs * 0.5);
};
TREE.broken = function (x, y, cs, s, j) {   // ель, сломанная великаном: пень с щепой и лежащая верхушка
  var c = C(), l = Math.max(1.2, cs * 0.045);
  c.save(); c.translate(x + cs * 0.12, y - cs * 0.1); c.rotate(1.25 + j * 0.2); D.pine(0, cs * 0.05, s * 0.75, '#2a6a52'); c.restore();
  D.poly([x - cs * 0.12, y, x - cs * 0.12, y - cs * 0.3, x - cs * 0.06, y - cs * 0.22, x, y - cs * 0.36, x + cs * 0.05, y - cs * 0.24, x + cs * 0.12, y - cs * 0.3, x + cs * 0.12, y], '#8a5a35', l);
  D.poly([x - cs * 0.06, y - cs * 0.22, x, y - cs * 0.36, x + cs * 0.05, y - cs * 0.24], '#e6c89a');
};
TREE.iceboulder = function (x, y, cs, s, j) {
  var l = Math.max(1.2, cs * 0.045);
  D.poly([x - cs * 0.4, y, x - cs * 0.34, y - cs * 0.38, x - cs * 0.08, y - cs * 0.58, x + cs * 0.3, y - cs * 0.42, x + cs * 0.4, y], '#a9d6f2', l);
  D.poly([x - cs * 0.08, y - cs * 0.58, x - cs * 0.02, y - cs * 0.1, x - cs * 0.34, y - cs * 0.38], 'rgba(255,255,255,0.55)');
  D.poly([x + cs * 0.3, y - cs * 0.42, x + cs * 0.4, y, x + cs * 0.08, y], 'rgba(60,110,170,0.3)');
  E(x - cs * 0.06, y - cs * 0.55, cs * 0.14, cs * 0.045, '#ffffff');
};
TREE.crooked = function (x, y, cs, s, j) { var c = C(); c.save(); c.translate(x, y); c.rotate((j - 0.5) * 0.35); D.pine(0, 0, s * 1.05, '#24584a'); c.restore(); };
TREE.deadtree = function (x, y, cs, s, j) {   // сухое дерево без листьев
  var l = Math.max(1.2, cs * 0.045), h = cs * (1.0 + j * 0.3), sw = (j - 0.5) * cs * 0.1, col = '#6a5a52';
  bline([x, y, x + sw * 0.4, y - h * 0.55, x + sw, y - h], col, l * 2.2);
  bline([x + sw * 0.4, y - h * 0.5, x - cs * 0.3, y - h * 0.78, x - cs * 0.36, y - h * 0.92], col, l * 1.2);
  bline([x + sw * 0.6, y - h * 0.68, x + cs * 0.32, y - h * 0.86, x + cs * 0.3, y - h * 1.0], col, l);
  bline([x - cs * 0.2, y - h * 0.72, x - cs * 0.14, y - h * 0.9], col, l * 0.7);
  E(x + sw, y - h, cs * 0.08, cs * 0.03, '#ffffff'); E(x - cs * 0.33, y - h * 0.86, cs * 0.07, cs * 0.025, '#ffffff');
};
TREE.cattails = function (x, y, cs, s, j) {
  for (var i = 0; i < 6; i++) { var rx = x - cs * 0.28 + i * cs * 0.11, rh = cs * (0.5 + H(i, j * 10, 3) * 0.35); line([rx, y, rx + cs * 0.04, y - rh], '#6f7d4a', Math.max(1.2, cs * 0.04)); if (i % 2 === 0) { D.rr(rx + cs * 0.01, y - rh - cs * 0.02, cs * 0.06, cs * 0.16, cs * 0.03); C().fillStyle = '#6a4630'; C().fill(); } }
  E(x, y, cs * 0.34, cs * 0.07, 'rgba(190,225,245,0.8)');
};
TREE.darkrock = function (x, y, cs, s, j) {
  var l = Math.max(1.2, cs * 0.045);
  D.poly([x - cs * 0.36, y, x - cs * 0.28, y - cs * 0.5, x - cs * 0.02, y - cs * 0.72, x + cs * 0.2, y - cs * 0.46, x + cs * 0.36, y], '#4a4660', l);
  D.poly([x - cs * 0.02, y - cs * 0.72, x + cs * 0.02, y - cs * 0.2, x - cs * 0.28, y - cs * 0.5], 'rgba(255,255,255,0.12)');
  E(x - cs * 0.04, y - cs * 0.68, cs * 0.12, cs * 0.04, '#ffffff');
};
function amanita(x, y, k) {   // мухомор под снежной шапкой
  var cs = k, l = Math.max(1, cs * 0.03);
  D.rr(x - cs * 0.04, y - cs * 0.16, cs * 0.08, cs * 0.16, cs * 0.03); C().fillStyle = '#f4ead8'; C().fill(); C().lineWidth = l; C().strokeStyle = OL; C().stroke();
  var c = C(); c.beginPath(); c.moveTo(x - cs * 0.14, y - cs * 0.14); c.quadraticCurveTo(x, y - cs * 0.34, x + cs * 0.14, y - cs * 0.14); c.closePath(); c.fillStyle = '#e8484f'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  O(x - cs * 0.06, y - cs * 0.19, cs * 0.022, '#fff'); O(x + cs * 0.05, y - cs * 0.21, cs * 0.018, '#fff'); O(x, y - cs * 0.25, cs * 0.016, '#fff');
  c.beginPath(); c.moveTo(x - cs * 0.08, y - cs * 0.24); c.quadraticCurveTo(x, y - cs * 0.31, x + cs * 0.07, y - cs * 0.25); c.quadraticCurveTo(x, y - cs * 0.27, x - cs * 0.08, y - cs * 0.24); c.fillStyle = '#ffffff'; c.fill();
}
var oTree = D.regionTree;
D.regionTree = function (x, y, cs, s, regI, treeCol, c, r, idx) {
  var G = Z.G, th = G && G.L && G.L.theme && !G.endless ? TH[G.L.theme] : null;
  if (!th) return oTree.apply(this, arguments);
  var k = pick(th.trees, H(c, r, (idx || 0) + 3)), j = H(c, r, (idx || 0) + 9);
  try { TREE[k](x, y, cs, s, j, c, r); } catch (e) { return oTree.apply(this, arguments); }
};

// ---------- земля места: подстилка, плоский декор, стена леса по краю ----------
var DECO = {};
DECO.amanita = function (x, y, cs, j) { amanita(x - cs * 0.1, y, cs * 0.9); if (j > 0.5) amanita(x + cs * 0.12, y + cs * 0.06, cs * 0.6); };
DECO.fern = function (x, y, cs, j) { var c = C(); for (var i = 0; i < 5; i++) { var a = -1.1 + i * 0.55, len = cs * (0.26 + (i % 2) * 0.06); c.save(); c.translate(x, y); c.rotate(a); line([0, 0, 0, -len], '#3f7a4a', Math.max(1.2, cs * 0.035)); for (var f = 1; f < 5; f++) { line([0, -len * f / 5, -cs * 0.05, -len * f / 5 + cs * 0.03], '#4f8f55', Math.max(1, cs * 0.025)); line([0, -len * f / 5, cs * 0.05, -len * f / 5 + cs * 0.03], '#4f8f55', Math.max(1, cs * 0.025)); } c.restore(); } E(x, y + cs * 0.02, cs * 0.16, cs * 0.05, '#ffffff'); };
DECO.roots = function (x, y, cs, j) { var c = C(), w = Math.max(1.2, cs * 0.045); c.strokeStyle = 'rgba(94,65,40,0.75)'; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - cs * 0.4, y - cs * 0.05); c.bezierCurveTo(x - cs * 0.2, y - cs * 0.15, x - cs * 0.05, y + cs * 0.1, x + cs * 0.15, y - cs * 0.02); c.quadraticCurveTo(x + cs * 0.3, y - cs * 0.1, x + cs * 0.4, y + cs * 0.04); c.moveTo(x - cs * 0.1, y + cs * 0.02); c.quadraticCurveTo(x - cs * 0.05, y + cs * 0.15, x + cs * 0.05, y + cs * 0.2); c.stroke(); };
DECO.branch = function (x, y, cs, j) { var w = Math.max(1.2, cs * 0.05); bline([x - cs * 0.3, y + cs * 0.05, x + cs * 0.28, y - cs * 0.06], '#7a5434', w); bline([x - cs * 0.02, y, x + cs * 0.06, y - cs * 0.14], '#7a5434', w * 0.6); E(x - cs * 0.05, y - cs * 0.02, cs * 0.16, cs * 0.03, '#ffffff'); };
DECO.moss = function (x, y, cs, j) { E(x, y, cs * 0.3, cs * 0.1, 'rgba(90,140,70,0.45)'); E(x + cs * 0.12, y - cs * 0.04, cs * 0.12, cs * 0.05, 'rgba(110,160,80,0.5)'); };
DECO.footprint = function (x, y, cs, j) { var c = C(); c.save(); c.translate(x, y); c.rotate((j - 0.5) * 0.8); c.fillStyle = 'rgba(90,120,180,0.28)'; c.beginPath(); c.ellipse(0, 0, cs * 0.2, cs * 0.34, 0, 0, 7); c.fill(); for (var t = 0; t < 4; t++) { c.beginPath(); c.ellipse(-cs * 0.15 + t * cs * 0.1, -cs * 0.42, cs * 0.05, cs * 0.06, 0, 0, 7); c.fill(); } c.restore(); };
DECO.iceshard = function (x, y, cs, j) { var l = Math.max(1, cs * 0.03); D.poly([x - cs * 0.12, y, x - cs * 0.04, y - cs * 0.3, x + cs * 0.02, y], '#bfe6ff', l); D.poly([x + cs * 0.02, y, x + cs * 0.1, y - cs * 0.2, x + cs * 0.16, y], '#d9f2ff', l); };
DECO.wattle = function (x, y, cs, j) { var w = Math.max(1.2, cs * 0.04); for (var p = 0; p < 4; p++) bline([x - cs * 0.3 + p * cs * 0.2, y + cs * 0.04, x - cs * 0.3 + p * cs * 0.2 + (p % 2 ? 0.03 : -0.03) * cs, y - cs * 0.32], '#7a5434', w); for (var q = 0; q < 2; q++) bline([x - cs * 0.34, y - cs * (0.1 + q * 0.12), x + cs * 0.34, y - cs * (0.12 + q * 0.12)], '#9a6a3a', w * 0.8); };
DECO.herbs = function (x, y, cs, j) { for (var i = 0; i < 4; i++) line([x - cs * 0.1 + i * cs * 0.06, y, x - cs * 0.14 + i * cs * 0.09, y - cs * 0.22], i % 2 ? '#8a9a5a' : '#a8925a', Math.max(1, cs * 0.03)); E(x, y + cs * 0.01, cs * 0.14, cs * 0.04, '#ffffff'); };
DECO.pot = function (x, y, cs, j) { var l = Math.max(1, cs * 0.035); bline([x - cs * 0.18, y, x - cs * 0.1, y - cs * 0.12], '#7a5434', l); bline([x + cs * 0.18, y, x + cs * 0.1, y - cs * 0.12], '#7a5434', l); E(x, y - cs * 0.12, cs * 0.14, cs * 0.11, '#3d4252', l); E(x, y - cs * 0.2, cs * 0.12, cs * 0.035, '#8fd06a'); };
DECO.lily = function (x, y, cs, j) { E(x, y, cs * 0.22, cs * 0.09, 'rgba(180,220,245,0.85)'); E(x - cs * 0.04, y - cs * 0.01, cs * 0.12, cs * 0.05, '#5f8f55', Math.max(1, cs * 0.025)); };
DECO.cattail = function (x, y, cs, j) { for (var i = 0; i < 3; i++) { var rx = x - cs * 0.08 + i * cs * 0.08; line([rx, y, rx + cs * 0.02, y - cs * 0.3], '#6f7d4a', Math.max(1, cs * 0.03)); } D.rr(x - cs * 0.01, y - cs * 0.36, cs * 0.05, cs * 0.12, cs * 0.025); C().fillStyle = '#6a4630'; C().fill(); };
DECO.spikes = function (x, y, cs, j) { var w = Math.max(1.2, cs * 0.035); for (var p = 0; p < 3; p++) { var px = x - cs * 0.2 + p * cs * 0.2; bline([px, y + cs * 0.02, px, y - cs * 0.3], '#4a4660', w); D.poly([px - cs * 0.04, y - cs * 0.3, px, y - cs * 0.4, px + cs * 0.04, y - cs * 0.3], '#4a4660', w * 0.6); } bline([x - cs * 0.26, y - cs * 0.18, x + cs * 0.26, y - cs * 0.18], '#4a4660', w * 0.8); };
DECO.crack = function (x, y, cs, j) { line([x - cs * 0.3, y, x - cs * 0.1, y - cs * 0.05, x, y + cs * 0.06, x + cs * 0.2, y - cs * 0.02, x + cs * 0.3, y + cs * 0.04], 'rgba(70,60,110,0.45)', Math.max(1.2, cs * 0.04)); };
DECO.darkstone = function (x, y, cs, j) { E(x, y - cs * 0.04, cs * 0.16, cs * 0.1, '#5a5670', Math.max(1, cs * 0.03)); E(x - cs * 0.03, y - cs * 0.1, cs * 0.1, cs * 0.035, '#ffffff'); };

function edgeForest(c2, L, cs, BW, BH, T) {
  var P = D.fieldPad(L), PL = P.l * cs, PT = P.t * cs, PR = P.r * cs, PB = P.b * cs, ents = (L.entrances || []).concat(L.start ? [L.start] : []);
  function nearEnt(px, py) { return ents.some(function (e) { return Math.abs((e[0] + 0.5) * cs - px) < cs * 1.2 && Math.abs((e[1] + 0.5) * cs - py) < cs * 1.2; }); }
  var col = T.edge === 'rocks' ? '#3f3c58' : T.edge === 'reeds' ? '#5f6a42' : '#1d4a3e';
  c2.save(); c2.globalAlpha = 0.9;
  // верхний край — ряд тёмных елей (силуэты), ниже по краям — пореже
  var n = Math.ceil(BW / (cs * 0.45));
  for (var i = 0; i <= n; i++) {
    var x = -PL * 0.5 + i * (BW + PL) / n, h = cs * (0.55 + H(i, 3, 7) * 0.45); if (nearEnt(x, 0)) continue;
    if (T.edge === 'rocks') D.poly([x - cs * 0.3, PT * 0.1, x - cs * 0.1, PT * 0.1 - h * 0.7, x + cs * 0.15, PT * 0.1 - h * 0.5, x + cs * 0.3, PT * 0.1], col);
    else if (T.edge === 'reeds') { for (var q = 0; q < 3; q++) line([x + q * cs * 0.08, PT * 0.05, x + q * cs * 0.08 + cs * 0.03, PT * 0.05 - h * 0.7], col, Math.max(1.2, cs * 0.04)); }
    else D.poly([x - cs * 0.24, PT * 0.12, x, PT * 0.12 - h, x + cs * 0.24, PT * 0.12], col);
  }
  [[-1, -PL * 0.45], [1, BW + PR * 0.45]].forEach(function (sd) {
    var m = Math.ceil(BH / (cs * 0.6));
    for (var k = 1; k < m; k++) { var y = k * BH / m, h2 = cs * (0.4 + H(k, sd[0] + 5, 9) * 0.3); if (nearEnt(sd[1] - sd[0] * cs * 0.5, y)) continue; if (T.edge === 'forest') D.poly([sd[1] - cs * 0.17, y, sd[1], y - h2, sd[1] + cs * 0.17, y], col); }
  });
  c2.restore();
}
var oGround = D.regionGround;
D.regionGround = function (c2, reg, BW, BH, cs, rnd) {
  var r = oGround.apply(this, arguments), G = Z.G, L = G && G.L;
  try {
    if (!L || !L.theme || G.endless) return r; var T = TH[L.theme];
    var tc = T.tint, P = D.fieldPad(L);
    c2.save();
    // подстилка: тень от крон — пятнами, к краям гуще
    var vg = c2.createRadialGradient(BW / 2, BH / 2, Math.min(BW, BH) * 0.25, BW / 2, BH / 2, Math.max(BW, BH) * 0.75);
    vg.addColorStop(0, 'rgba(' + tc[0] + ',' + tc[1] + ',' + tc[2] + ',' + tc[3] * 0.4 + ')'); vg.addColorStop(1, 'rgba(' + tc[0] + ',' + tc[1] + ',' + tc[2] + ',' + tc[3] * 1.8 + ')');
    c2.fillStyle = vg; c2.fillRect(-P.l * cs, -P.t * cs, BW + (P.l + P.r) * cs, BH + (P.t + P.b) * cs);
    for (var i = 0; i < 24; i++) { var x = H(i, 1, 13) * BW, y = H(i, 2, 13) * BH; c2.fillStyle = 'rgba(' + tc[0] + ',' + tc[1] + ',' + tc[2] + ',' + tc[3] * 0.7 + ')'; c2.beginPath(); c2.ellipse(x, y, cs * (0.6 + H(i, 3, 13)), cs * (0.3 + H(i, 4, 13) * 0.3), H(i, 5, 13) * 3, 0, 7); c2.fill(); }
    c2.restore();
    var oc = D.ctx; D.setCtx(c2);
    try {
      edgeForest(c2, L, cs, BW, BH, T);
      (L.themeDeco || []).forEach(function (q) { var fx = (q[0] + 0.25 + H(q[0], q[1], 71) * 0.5) * cs, fy = (q[1] + 0.55 + H(q[0], q[1], 72) * 0.3) * cs; if (L.grid[q[1]][q[0]] !== 0) return; if (DECO[q[2]]) DECO[q[2]](fx, fy, cs * (T.dk || 1), H(q[0], q[1], 73)); });
    } finally { D.setCtx(oc); }
  } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};

// ---------- живые глаза в дуплах старых деревьев Лешего ----------
var oOver = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  if (oOver) oOver(ctx, X, Y, cs, t);
  var G = Z.G, L = G && G.L; if (!L || L.theme !== 'leshy' || G.endless || !TH.leshy.eyes) return;
  try {
    var hol = L._hol; if (!hol) return;
    Object.keys(hol).forEach(function (key, i) {
      if (L.grid[+key.split(',')[1]][+key.split(',')[0]] !== 6) return;   // дерево срубили — глаз нет
      var bl = ((t * 0.55 + i * 1.37) % 4.1) < 0.16, look = Math.sin(t * 0.7 + i) * cs * 0.012;
      if (bl) return;
      var hx = X(hol[key][0]), hy = Y(hol[key][1]), glow = 0.75 + 0.25 * Math.sin(t * 2.2 + i);
      ctx.save(); ctx.globalAlpha = glow; D.circ(hx - cs * 0.045 + look, hy - cs * 0.02, cs * 0.035, '#ffe066'); D.circ(hx + cs * 0.045 + look, hy - cs * 0.02, cs * 0.035, '#ffe066'); ctx.globalAlpha = 1;
      D.circ(hx - cs * 0.04 + look * 1.6, hy - cs * 0.018, cs * 0.014, OL); D.circ(hx + cs * 0.05 + look * 1.6, hy - cs * 0.018, cs * 0.014, OL); ctx.restore();
    });
  } catch (e) { if (window.__rep) window.__rep(e); }
};
})();

/* 2.11.5 · реки и болота
   - Реки шире (2 ряда): у моста длиннее настил, вода — заметная преграда.
   - Мороз: кто в воде — вмерзает надолго (враги 5 с, герои 3 с, Мороз и Снегурочка 1,5 с) и виден во льду.
     Великаны, боссы и машины не вмерзают — проламывают лёд вокруг себя.
   - Оттепель: стоявшие на льду проваливаются в воду (барахтаются, медленно выбираются).
   - Калинов мост: река глубокая — кто в воде, того уносит течением (враг пропадает, герой возвращается через время).
     Переправа — только мост или лёд; герои сами идут через мост, а не вброд.
   - Камыши Кикиморы: карта в болотных окнах и камыше, лягушек больше, из болота у дороги выскакивают «плюшки». */
(function () {
'use strict';
var Z = window.Z, W = Z.WAT, TT = Z.TT || function (r, e) { return Z.LANG === 'en' ? e : r; };
if (!W) return;
function txt(G, s, x, y, col) { G.texts.push({ s: s, x: x, y: y, c: col || '#fff', t: 0, dur: 1.3, sz: 0.62 }); }
function heavy(u) { var et = Z.ENEMIES[u.type]; return !!(u.boss || u.vehicle || (et && et.size >= 1.4) || u.type === 'giant'); }
function isHero(u) { return !!(u.type && Z.ALLIES[u.type] && Z.G && (Z.G.squad || []).indexOf(u) >= 0); }
function unitsIn(G, c, r) { var o = []; G.enemies.forEach(function (e) { if (!e.dead && !e.air && Math.floor(e.x) === c && Math.floor(e.y) === r) o.push(e); }); (G.squad || []).forEach(function (U) { if (!U.dead && Math.floor(U.x) === c && Math.floor(U.y) === r) o.push(U); }); return o; }
function bridgeAt(G, k) { return G.L.bridges[k] || (G.structs || []).some(function (s) { return s.type === 'crossing' && s.done && !s.dead && s.wk === k; }); }
function deep(G) { return !!(G && G.L && G.L.kb && !G.endless); }

// ---------- шире реки ----------
function widen(G) {
  var L = G.L; if (L.kb || L.riverRow === undefined || L._wide || G.endless) return false;
  if (G.mech === 'pond' || G.mech === 'dam' || G.mech === 'floes' || G.mech === 'springs' || G.mech === 'icebreaker') return false;
  var rr = L.riverRow, best = null, bs = 1e9, typ = L.grid[rr].some(function (v) { return v === 5; }) ? 5 : 4;
  // ищем пару рядов, где дорога пересекает реку прямо (дорога вдоль реки стала бы длинным мостом)
  for (var a = 2; a <= L.H - 4; a++) {
    var bad = 0, cross = 0, turn = 0;
    for (var c = 0; c < L.W; c++) {
      var va = a === rr ? (L.bridges[a * L.W + c] ? 1 : L.grid[a][c] === 4 || L.grid[a][c] === 5 ? 0 : L.grid[a][c]) : L.grid[a][c];
      var vb = a + 1 === rr ? (L.bridges[(a + 1) * L.W + c] ? 1 : L.grid[a + 1][c] === 4 || L.grid[a + 1][c] === 5 ? 0 : L.grid[a + 1][c]) : L.grid[a + 1][c];
      [va, vb].forEach(function (v) { if (v === 8 || v === 9 || v === 11 || v === 3 || v === 10) bad++; });
      if (va === 1 && vb === 1) cross++; else if (va === 1 || vb === 1) turn++;
    }
    if (L.fort && (L.fort[1] === a || L.fort[1] === a + 1 || L.fort[1] === a + 2)) bad += 99;
    if (!cross || turn > 6 || bad > 2) continue;
    var sc = bad * 10 + turn * 3 + Math.abs(a + 0.5 - rr) * 0.8 - cross * 0.5;
    if (sc < bs) { bs = sc; best = a; }
  }
  if (best === null) return false;
  // старую реку — обратно в снег, новую — двумя рядами
  for (var c1 = 0; c1 < L.W; c1++) { var k1 = rr * L.W + c1; if (L.grid[rr][c1] === 4 || L.grid[rr][c1] === 5) L.grid[rr][c1] = 0; delete L.bridges[k1]; delete L.ice[k1]; }
  [best, best + 1].forEach(function (r) { for (var c2 = 0; c2 < L.W; c2++) { var k = r * L.W + c2, v2 = L.grid[r][c2];
    if (v2 === 1) L.bridges[k] = true;
    else if (v2 === 0 || v2 === 6 || v2 === 7) { L.grid[r][c2] = typ; if (L.hgt[r]) L.hgt[r][c2] = 0; delete L.bush[k]; delete L.drift[k]; } } });
  L.riverRow = best;
  if (L.spots) L.spots = L.spots.filter(function (s) { var v = L.grid[s.r][s.c]; return v === 0 || v === 3; });
  L._wide = true; G.fieldDirty = true; Z.navDirty && Z.navDirty();
  return true;
}
var oInit = W.init;
W.init = function (G) {
  oInit.apply(this, arguments);
  try { if (widen(G)) oInit.apply(this, arguments); } catch (e) { if (window.__rep) window.__rep(e); }
  try { if (G.mech === 'swamp' && !G.endless) kikiSeed(G); } catch (e) { if (window.__rep) window.__rep(e); }
  try { if (deep(G) && !G._deepTold) { G._deepTold = 1; G.deepBanner = 1; } } catch (e) { if (window.__rep) window.__rep(e); }
};

// ---------- мороз: вмерзают все, кроме тяжёлых — те ломают лёд ----------
W.freezeCell = function (G, c, r) {
  var L = G.L, k = r * L.W + c; if (L.grid[r][c] !== 4 || bridgeAt(G, k)) return;
  if ((G.structs || []).some(function (s) { return s.type === 'totem' && s.done && !s.dead && !(s.sleep > 0) && Math.hypot(s.c + 0.5 - c - 0.5, s.r + 0.5 - r - 0.5) < 1.6; })) return;
  var us = unitsIn(G, c, r), big = us.filter(function (u) { return !isHero(u) && heavy(u); });
  if (big.length) {   // великан стоит в воде — лёд под ним трескается, клетка не замерзает
    if (!big[0]._crackT || G.t - big[0]._crackT > 2) { big[0]._crackT = G.t; txt(G, TT('Трах! Ломает лёд', 'Crack! Breaks the ice'), c + 0.5, r - 0.3, '#bfe6ff'); Z.AU.sfx('ice_break', 0.5, { gap: 0.3 }); }
    return;
  }
  W.setCell(G, c, r, 5);
  us.forEach(function (u) {
    if (isHero(u)) { var d = u.type === 'sneg' || u.type === 'moroz' ? 1.5 : 3; u.stunT = Math.max(u.stunT || 0, d); u.iced = d; u.drown = 0; }
    else { u.stun = Math.max(u.stun || 0, 5); u.iced = 5; u.swim = 0; }
    if (!G._iceTold) { G._iceTold = 1; txt(G, TT('Вмёрз!', 'Frozen in!'), u.x, u.y - 1, '#bfe6ff'); }
    if (Math.random() < 0.5) txt(G, TT('Вмёрз!', 'Frozen in!'), u.x, u.y - 1, '#bfe6ff');
  });
  if (us.length) Z.AU.sfx('freeze', 0.45, { gap: 0.2 });
};
var oThaw = W.thawCell;
W.thawCell = function (G, c, r) {
  var L = G.L; if (L.grid[r][c] !== 5) return;
  var us = unitsIn(G, c, r);
  oThaw.apply(this, arguments);
  us.forEach(function (u) {
    if (u.dead || u.air) return; u.iced = 0;
    if (deep(G)) { drown(G, u); return; }
    u.swim = 2.5; if (isHero(u)) u.stunT = Math.max(u.stunT || 0, 0.6); else { u.slow = Math.max(u.slow || 0, 0.6); u.slowT = Math.max(u.slowT || 0, 2.5); }
    txt(G, TT('Плюх!', 'Splash!'), u.x, u.y - 0.9, '#7fd8ff');
  });
};

// ---------- Калинов мост: глубокая река ----------
function drown(G, u) {
  if (u.dead || u.air || u._drowned) return;
  W.splash(u.x, u.y, 1); G.ripples.push({ x: u.x, y: u.y, t: 0, big: 1.4 });
  for (var i = 0; i < 6; i++) G.fx.push({ k: 'deb', x: u.x, y: u.y - 0.2, vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random(), rot: 0, vr: 6, s: 0.06, col: i % 2 ? '#bfe9ff' : '#ffffff', t: 0, dur: 0.7 });
  if (isHero(u)) {
    u.dead = true; u.respawn = 8; u.iced = 0; u.stunT = 0; u._drowned = false;
    txt(G, TT('Унесло течением! Вернётся', 'Swept away! Will be back'), u.x, u.y - 1, '#7fd8ff');
    if (Z.say) Z.say(u.type, 'hurt', u);
  } else if (heavy(u)) {
    u.swim = 3;   // великан и машины не тонут — бредут по дну
  } else {
    u._drowned = true; u.iced = 0; txt(G, TT('Буль! Унесло', 'Gone with the current'), u.x, u.y - 0.9, '#7fd8ff');
    Z.damage(u, u.hp * 10 + 999, { pierceArmor: true });
  }
  Z.AU.sfx('splash', 0.7, { gap: 0.08 });
}
var oTick = W.tick;
W.tick = function (G, dt) {
  oTick.apply(this, arguments);
  try {
    var L = G.L;
    if (deep(G)) {
      if (G.deepBanner && G.phase === 'build' && !(G.banner && G.banner.t > 0)) { G.deepBanner = 0; G.banner = { text: TT('Река глубокая', 'The river is deep'), sub: TT('Кто в воду — того уносит течением. Переправа — по мосту, а в мороз — по льду. Растает под ногами — утонут!', 'Whoever falls in is swept away. Cross by the bridge — or on the ice when it freezes. If it thaws underfoot, they sink!'), t: 4.5, big: true }; }
      G.enemies.forEach(function (e) { if (!e.dead && !e.air && W.cellAt(e.x, e.y) === 4 && !bridgeAt(G, Math.floor(e.y) * L.W + Math.floor(e.x)) && !(e.swim > 0)) drown(G, e); });
      (G.squad || []).forEach(function (U) { if (!U.dead && W.cellAt(U.x, U.y) === 4 && !bridgeAt(G, Math.floor(U.y) * L.W + Math.floor(U.x))) { U.drown = (U.drown || 0) + dt; if (U.drown > 0.35) drown(G, U); } else U.drown = 0; });
    }
    G.enemies.forEach(function (e) { if (e.swim > 0) { e.swim -= dt; if ((e.rip = (e.rip || 0) - dt) <= 0) { e.rip = 0.3; G.ripples.push({ x: e.x, y: e.y + 0.1, t: 0, big: 0.6 }); } } });
  } catch (er) { if (window.__rep) window.__rep(er); }
};
// герои на Калиновом идут через мост, а не вброд; приказ «в воду» — на ближний берег
var oUT = Z.unitTick;
Z.unitTick = function (G, dt) {
  oUT.apply(this, arguments);
  if (!deep(G)) return;
  try {
    var kb = G.L.kb, L = G.L, bx0 = kb.c0 - 0.5, bx1 = kb.c1 + 1.5, by = kb.r + 0.5;
    var wet = function (x, y) { var c = Math.floor(x), r = Math.floor(y); return L.grid[r] && L.grid[r][c] === 4 && !bridgeAt(G, r * L.W + c); };
    (G.squad || []).forEach(function (H) {
      if (H.dead || H.roll) return;
      if (H.home && wet(H.home.x, H.home.y)) { H.home.x = Math.abs(H.home.x - bx0) < Math.abs(H.home.x - bx1) ? kb.c0 - 0.45 : kb.c1 + 1.45; }
      if (H.tx === undefined) return;
      var cross = false; for (var i = 1; i <= 12; i++) { var u = i / 12; if (wet(H.x + (H.tx - H.x) * u, H.y + (H.ty - H.y) * u)) { cross = true; break; } }
      if (!cross || wet(H.x, H.y)) return;
      var onBr = Math.abs(H.y - by) < 0.45 && H.x > bx0 - 0.3 && H.x < bx1 + 0.3, west = H.tx > H.x;
      if (onBr) { H.tx = west ? bx1 + 0.3 : bx0 - 0.3; H.ty = by; }
      else { var nx = H.x < kb.c0 ? bx0 : bx1; if (Math.hypot(H.x - nx, H.y - by) < 0.3) { H.tx = H.x < kb.c0 ? bx1 : bx0; H.ty = by; } else { H.tx = nx; H.ty = by; } }
    });
  } catch (e) { if (window.__rep) window.__rep(e); }
};
// во льду и в воде — видно: льдинка-кокон и брызги рисует игра (iced); барахтаются — круги на воде (swim)

// ---------- Камыши Кикиморы ----------
function kikiSeed(G) {
  var L = G.L, W2 = L.W, Hh = L.H, road = {}, n = 0;
  for (var r = 0; r < Hh; r++) for (var c = 0; c < W2; c++) if (L.grid[r][c] === 1) road[r * W2 + c] = 1;
  function nearRoad(c, r, d) { for (var dr = -d; dr <= d; dr++) for (var dc = -d; dc <= d; dc++) if (road[(r + dr) * W2 + c + dc]) return true; return false; }
  var ents = L.entrances || [];
  function okCell(c, r) { if (c < 0 || r < 0 || c >= W2 || r >= Hh - 1) return false; var v = L.grid[r][c]; if (v !== 0 && v !== 6) return false; if (L.hgt && L.hgt[r][c]) return false; if (ents.some(function (e) { return Math.abs(e[0] - c) <= 1 && Math.abs(e[1] - r) <= 1; })) return false; if (L.fort && Math.abs(L.fort[0] - c) <= 1 && r >= L.fort[1] - 1) return false; return true; }
  // болотные окна: пятна по 2–6 клеток по всему полю, у самой дороги — пореже (там строят)
  var rnd = Z.rng(777 + G.idx * 13 + W2), blobs = Math.round(W2 * Hh / 11);
  for (var b = 0; b < blobs; b++) {
    var c0 = Math.floor(rnd() * W2), r0 = Math.floor(rnd() * Hh); if (!okCell(c0, r0)) continue;
    var want = 3 + Math.floor(rnd() * 5), q = [[c0, r0]];
    for (var i = 0; i < q.length && q.length < want; i++) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var cc = q[i][0] + d[0], rr = q[i][1] + d[1]; if (q.length < want && okCell(cc, rr) && rnd() < 0.7 && !q.some(function (p) { return p[0] === cc && p[1] === rr; })) q.push([cc, rr]); });
    q.forEach(function (p) { if (nearRoad(p[0], p[1], 0)) return; if (nearRoad(p[0], p[1], 1) && rnd() < 0.5) return; var k = p[1] * W2 + p[0]; if (L.grid[p[1]][p[0]] === 6) { L.grid[p[1]][p[0]] = 0; } G.swamp[k] = 99999; n++; });
  }
  G.kikiMore = n; G.fieldDirty = true; Z.navDirty && Z.navDirty();
}
// лягушек больше; из болота у дороги выскакивают «плюшки»
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!G || !G.L || G.mech !== 'swamp' || G.endless || !G.kikiMore) return;
  try {
    var L = G.L;
    if (G.frogs && !G._frogMore && G.frogs.pads && G.frogs.pads.length > 6) {
      G._frogMore = 1; var used = {}; G.frogs.list.forEach(function (f) { used[f.k] = 1; });
      for (var i = 0; i < G.frogs.pads.length && G.frogs.list.length < 9; i++) { var k = G.frogs.pads[(i * 7 + 3) % G.frogs.pads.length]; if (used[k]) continue; var c = k % L.W, r = Math.floor(k / L.W);
        if (G.frogs.list.some(function (f) { return Math.hypot(f.x - c - 0.5, f.y - r - 0.6) < 1.6; })) continue; used[k] = 1;
        G.frogs.list.push({ x: c + 0.5, y: r + 0.62, k: k, dir: (i % 2) ? -1 : 1, croak: 2 + Math.random() * 6, cd: 0, puff: 0, cold: 0, sleep: 0, jump: 0 }); }
    }
    if (G.phase !== 'wave') return;
    G.kikiT = (G.kikiT === undefined ? 9 : G.kikiT) - dt; if (G.kikiT > 0) return; G.kikiT = 10 + Math.random() * 8;
    var cand = []; for (var sk in G.swamp) { if (!(G.swamp[sk] > 0)) continue; var c2 = sk % L.W, r2 = Math.floor(sk / L.W);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var cc = c2 + d[0], rr = r2 + d[1]; if (L.grid[rr] && L.grid[rr][cc] === 1 && G.nav && G.nav.walk && isFinite(G.nav.walk[rr * L.W + cc])) cand.push([c2 + 0.5, r2 + 0.5, cc + 0.5, rr + 0.5]); }); }
    if (!cand.length) return;
    var p = cand[Math.floor(Math.random() * cand.length)], n = 1 + (G.wave > 3 ? 1 : 0);
    for (var j = 0; j < n; j++) { var e = Z.spawn('splitkid', 0, G.waveMul || 1, { x: p[2] + (j - 0.5) * 0.3, y: p[3] }); if (e) { e.stun = 0.5; e.fromSwamp = 1; } }
    if (W.splash) G.ripples.push({ x: p[0], y: p[1], t: 0, big: 1 });
    for (var q = 0; q < 6; q++) G.fx.push({ k: 'deb', x: p[0], y: p[1] - 0.1, vx: (Math.random() - 0.5) * 2.4, vy: -1.6 - Math.random(), rot: 0, vr: 6, s: 0.06, col: q % 2 ? '#7fae5a' : '#bfe9ff', t: 0, dur: 0.7 });
    txt(G, TT('Плюх! Из болота!', 'Splash! From the swamp!'), p[0], p[1] - 0.8, '#b8e07a');
    Z.AU.sfx('w_squelch', 0.6, { gap: 0.2 }); Z.AU.sfx('a_frog', 0.4, { gap: 0.4 });
  } catch (er) { if (window.__rep) window.__rep(er); }
};
})();

/* 2.11.5 · подгрузка по месту: перед уровнем (и уже на карте мира — для следующего уровня) качаются и раскодируются его треки
   (регион, сопровождение, босс). Пока что-то качается фоном — в углу экрана видно «Загрузка звуков NN%». */
(function () {
'use strict';
var Z = window.Z, UI = Z.ui, D = Z.D, TT = Z.TT || function (r, e) { return Z.LANG === 'en' ? e : r; };
function tracksFor(idx) {
  var info = Z.LEVELS && Z.LEVELS[idx]; if (!info) return [];
  var reg = Math.max(0, Math.min(4, info.region || 0)), out = ['mus_r' + reg];
  if (info.type === 'escort') out.push('mus_escort');
  if (info.type === 'boss' || info.k === 6) { var b = Z.REGIONS && Z.REGIONS[reg] && Z.REGIONS[reg].boss; if (b) out.push('mus_b_' + b); }
  return out;
}
var asked = {};
function prefetch(idx, now) {
  if (!window.__LD) return;
  tracksFor(idx).forEach(function (n, i) {
    if (!asked[n]) { asked[n] = 1; window.__LD.want('music/tracks/' + n + '.mp3', now ? 5 + i : 25 + i); }
    if (now && Z.musTracks && Z.musTracks.preload && !Z.musTracks.has(n)) Z.musTracks.preload(n);
  });
}
Z.prefetchLevel = prefetch;
var oGo = UI.goLevel;
UI.goLevel = function (idx) { try { prefetch(idx, true); } catch (e) { if (window.__rep) window.__rep(e); } return oGo.apply(this, arguments); };
var lastMapIdx = -1, oRender = UI.render;
UI.render = function (c, w, h) {
  var r = oRender.apply(this, arguments);
  try {
    if ((UI.screen === 'map' || UI.screen === 'menu') && Z.unlockedLevel) { var ni = Math.min(34, Z.unlockedLevel()); if (ni !== lastMapIdx) { lastMapIdx = ni; prefetch(ni, false); } }
    if (UI.screen !== 'loading' && window.__LD && !Z.splashOn) {
      var p = window.__LD.bg(), pa = window.__LD.readyA() ? 1 : window.__LD.progress(), q = Math.min(p, pa);
      if (q < 1) {
        var s = Math.max(0.8, Math.min(1.6, Math.min(w, h) / 480)), txt = '♪ ' + TT('Загрузка звуков ', 'Loading sounds ') + Math.floor(q * 100) + '%';
        c.save(); c.font = '600 ' + Math.round(12 * s) + 'px Rubik, sans-serif'; var tw = c.measureText(txt).width + 18 * s, th = 22 * s, x = 8 * s, y = h - th - 8 * s;
        c.globalAlpha = 0.72; D.rr(x, y, tw, th, th / 2); c.fillStyle = '#1b2448'; c.fill(); c.globalAlpha = 1;
        c.fillStyle = 'rgba(255,255,255,0.25)'; D.rr(x, y + th - 3 * s, tw * q, 3 * s, 1.5 * s); c.fill();
        c.fillStyle = '#dfe7ff'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText(txt, x + 9 * s, y + th / 2); c.restore();
      }
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};
})();
