/* 2.11.5 · «Калинов мост»: логово Змея Горыныча — пещера в скале у верхнего входа. Пока Змея нет, во тьме моргают
   три пары глаз (три головы), из пасти пещеры тянет морозным паром; Змей выходит именно оттуда — с облаком снега и тряской.
   Вокруг — следы трёхпалых лап к мосту, брошенные шлемы, щиты и копья богатырей, заиндевевшая земля у входа. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, OL = D.OL || '#1b2448';
function C() { return D.ctx; }
function h(i, k) { var x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }
var LAIR_Y = 1.55, MW = 1.25, MH = 1.75;
Z.lairArch = function (G, X, Y, cs) { var lr = G.L.lair, x = X(lr.c + 0.5), y = Y(lr.r + LAIR_Y), mw = cs * MW, mh = cs * MH; return function (c) { c.moveTo(x - mw, y + cs * 0.06); c.quadraticCurveTo(x - mw * 1.05, y - mh * 0.9, x, y - mh); c.quadraticCurveTo(x + mw * 1.05, y - mh * 0.9, x + mw, y + cs * 0.06); c.closePath(); }; };
function lairOf(G) { var L = G && G.L; return L && L.kb && L.lair ? L.lair : null; }

// где логово: у первого входа (по нему и пойдёт Змей), плюс места для «реликвий» и следы
var oGen = Z.genLevel;
Z.genLevel = function (idx, dims) {
  var L = oGen.apply(this, arguments);
  try { if (L.kb) { var KB = L.kb; for (var br0 = KB.r - 1; br0 <= KB.r + 1; br0++) for (var bc0 = KB.c0 - 2; bc0 <= KB.c1 + 2; bc0++) { var bk0 = br0 * L.W + bc0; if (L.drift) delete L.drift[bk0]; if (L.bush) delete L.bush[bk0]; } } } catch (er0) { if (window.__rep) window.__rep(er0); }   // у моста нет сугробов и камыша — не ложатся на парапет и столбы
  try {
    if (L.kb && L.entrances && L.entrances.length && L.paths && L.paths[0] && Z.LEVELS[idx] && Z.LEVELS[idx].type === 'boss') {
      var e = L.entrances[0]; L.lair = { c: e[0], r: e[1] };
      var road = {}; L.paths.forEach(function (p) { p.forEach(function (q) { road[q[1] * L.W + q[0]] = 1; }); });
      for (var hr0 = 0; hr0 <= 3; hr0++) for (var hc0 = e[0] - 4; hc0 <= e[0] + 4; hc0++) if (L.hgt && L.hgt[hr0] && L.hgt[hr0][hc0] !== undefined) L.hgt[hr0][hc0] = 0;   // у логова — без плато
      for (var lr0 = 0; lr0 <= 1; lr0++) for (var lc0 = e[0] - 2; lc0 <= e[0] + 2; lc0++) { if (lc0 < 0 || lc0 >= L.W || road[lr0 * L.W + lc0]) continue; L.grid[lr0][lc0] = 11; var kk0 = lr0 * L.W + lc0; if (L.bush) delete L.bush[kk0]; if (L.drift) delete L.drift[kk0]; if (L.hgt && L.hgt[lr0]) L.hgt[lr0][lc0] = 0; }   // скала логова — не для стройки
      var rel = [], p0 = L.paths[0];
      for (var i = 2; i < p0.length && rel.length < 6; i += 2) { var q = p0[i]; if (q[0] >= L.kb.c0) break;
        [[1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1]].some(function (d) { var c = q[0] + d[0], r = q[1] + d[1]; if (c < 0 || r < 1 || c >= L.W || r >= L.H - 1 || road[r * L.W + c] || L.grid[r][c] !== 0) return false; if (rel.some(function (o) { return Math.abs(o.c - c) + Math.abs(o.r - r) < 2; })) return false; rel.push({ c: c, r: r, k: rel.length % 3, s: h(c, r) }); return true; }); }
      L.relics = rel;
      // ещё «жизни» на поле: вмёрзшие в лёд богатыри (дыхание Змея), мёртвые заиндевевшие деревья, руины дозорной башни, брошенные сани, рваный стяг, груда валунов
      var dec = [], cand = [];
      for (var r1 = 1; r1 < L.H - 2; r1++) for (var c1 = 0; c1 < L.W; c1++) { if (L.grid[r1][c1] !== 0) continue; var near = 9;
        for (var dr = -2; dr <= 2; dr++) for (var dc = -2; dc <= 2; dc++) if (road[(r1 + dr) * L.W + c1 + dc]) near = Math.min(near, Math.abs(dr) + Math.abs(dc));
        if (near < 2) continue; if (Math.abs(c1 - e[0]) <= 3 && r1 <= 3) continue; if (L.fort && Math.abs(c1 - L.fort[0]) <= 2 && r1 >= L.H - 3) continue;
        cand.push([c1, r1, h(c1 * 3 + idx, r1 * 7)]); }
      cand.sort(function (a2, b2) { return a2[2] - b2[2]; });
      cand.forEach(function (q) { if (dec.length >= 9) return; if (dec.some(function (o) { return Math.abs(o.c - q[0]) + Math.abs(o.r - q[1]) < 3; })) return; dec.push({ c: q[0], r: q[1], k: dec.length % 6, s: q[2] }); L.grid[q[1]][q[0]] = 11; var kk1 = q[1] * L.W + q[0]; if (L.bush) delete L.bush[kk1]; if (L.drift) delete L.drift[kk1]; });
      L.kdecor = dec;
      var tr = []; for (var j = 1; j < p0.length; j++) { var a = p0[j - 1], b = p0[j]; if (a[0] >= L.kb.c0) break; for (var u = 0; u < 1; u += 0.5) tr.push({ x: a[0] + 0.5 + (b[0] - a[0]) * u, y: a[1] + 0.5 + (b[1] - a[1]) * u, ang: Math.atan2(b[1] - a[1], b[0] - a[0]), side: tr.length % 2 ? 1 : -1 }); }
      L.gtrack = tr;
    }
  } catch (er) { if (window.__rep) window.__rep(er); }
  return L;
};
// Змей выходит из логова
var oSpawn = Z.spawn;
Z.spawn = function (type, pathIdx) {
  var G = Z.G, lr = lairOf(G), args = Array.prototype.slice.call(arguments);
  if (lr && type === 'gorynych') args[1] = 0;
  var e = oSpawn.apply(this, args);
  if (lr && type === 'gorynych' && e) { G.lairOut = Z.time; G.shake = Math.max(G.shake || 0, 0.8); }
  return e;
};

// ---------- рисунок ----------
function rock(c, pts, g, l) { D.poly(pts, g, l); }
function drawLair(G, X, Y, cs, t, part) {   // part: 'back' — пик позади и глубина пасти (за Змеем), 'front' — скала вокруг пасти (перед ним)
  var c = C(), L = G.L, lr = L.lair, x = X(lr.c + 0.5), y = Y(lr.r + LAIR_Y), l = Math.max(1.5, cs * 0.05);
  var out = G.lairOut != null || G.enemies.some(function (e) { return !e.dead && e.type === 'gorynych'; });
  var W2 = cs * 2.0, H2 = cs * 2.55;
  var mw = cs * MW, mh = cs * MH, arch = function () { c.moveTo(x - mw, y + cs * 0.06); c.quadraticCurveTo(x - mw * 1.05, y - mh * 0.9, x, y - mh); c.quadraticCurveTo(x + mw * 1.05, y - mh * 0.9, x + mw, y + cs * 0.06); c.closePath(); };
  if (part === 'back') {
  var g0 = c.createLinearGradient(x, y - H2 * 1.4, x + W2, y); g0.addColorStop(0, '#b4bcd8'); g0.addColorStop(1, '#5e6688'); D.poly([x + W2 * 0.05, y - H2 * 0.6, x + W2 * 0.55, y - H2 * 1.18, x + W2 * 0.75, y - H2 * 1.1, x + W2 * 1.3, y - H2 * 0.45, x + W2 * 1.3, y], g0, l); D.poly([x + W2 * 0.45, y - H2 * 1.07, x + W2 * 0.55, y - H2 * 1.18, x + W2 * 0.75, y - H2 * 1.1, x + W2 * 0.82, y - H2 * 1.08, x + W2 * 0.62, y - H2 * 1.12], '#ffffff', l * 0.5);   // пик позади
  // пасть пещеры
    c.beginPath(); c.moveTo(x - mw, y + cs * 0.06); c.quadraticCurveTo(x - mw * 1.05, y - mh * 0.9, x, y - mh); c.quadraticCurveTo(x + mw * 1.05, y - mh * 0.9, x + mw, y + cs * 0.06); c.closePath();
  var mg = c.createRadialGradient(x, y - mh * 0.35, cs * 0.1, x, y - mh * 0.4, mw * 1.2); mg.addColorStop(0, '#070912'); mg.addColorStop(1, '#262c4a'); c.fillStyle = mg; c.fill();
  // глаза в темноте — три головы (лёд, ветер, крикун), пока Змей не вышел
  if (!out) {
    [[-0.42, 0.62, '#9ff0ff'], [0.05, 0.78, '#c9ffb0'], [0.45, 0.6, '#ffb070']].forEach(function (q, i) {
      var cyc = (t * 0.45 + i * 0.37) % 4, bl = cyc > 3.75, ex = x + q[0] * mw, ey = y - mh * q[1] + Math.sin(t * 0.8 + i) * cs * 0.03;
      if (bl) return; var gl = 0.7 + 0.3 * Math.sin(t * 2 + i);
      var eg = c.createRadialGradient(ex, ey, 0, ex, ey, cs * 0.22); eg.addColorStop(0, q[2]); eg.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.globalAlpha = 0.75 * gl; c.fillStyle = eg; c.fillRect(ex - cs * 0.22, ey - cs * 0.22, cs * 0.44, cs * 0.44); c.restore();
      [-1, 1].forEach(function (s) { c.save(); c.translate(ex + s * cs * 0.1, ey); c.rotate(s * 0.25); c.beginPath(); c.ellipse(0, 0, cs * 0.085, cs * 0.045, 0, 0, 7); c.fillStyle = q[2]; c.globalAlpha = gl; c.fill(); c.globalAlpha = 1; c.fillStyle = '#05060c'; c.fillRect(-cs * 0.008, -cs * 0.03, cs * 0.016, cs * 0.06); c.restore(); });
    });
    // морозный пар клубится в глубине (дышит)
    var br = 0.5 + 0.5 * Math.sin(t * 1.3), mg2 = c.createRadialGradient(x, y - mh * 0.2, 0, x, y - mh * 0.2, mw * 0.9); mg2.addColorStop(0, 'rgba(200,225,255,' + (0.12 + br * 0.12).toFixed(3) + ')'); mg2.addColorStop(1, 'rgba(200,225,255,0)'); c.fillStyle = mg2; c.beginPath(); c.ellipse(x, y - mh * 0.2, mw * 0.85, mh * 0.45, 0, 0, 7); c.fill();
  }
    return;
  }
  c.save(); c.beginPath(); c.rect(x - W2 * 3, y - H2 * 3, W2 * 6, H2 * 4); arch(); c.clip('evenodd');   // скала — с дырой пасти: Змей внутри виден
  // скала: три массива с тенью и снегом на уступах
  var g1 = c.createLinearGradient(x - W2, y - H2, x + W2, y); g1.addColorStop(0, '#9aa4c4'); g1.addColorStop(1, '#4e5678');
  var RP = [x - W2 * 1.15, y + cs * 0.1, x - W2 * 1.05, y - H2 * 0.55, x - W2 * 0.7, y - H2 * 0.95, x - W2 * 0.2, y - H2 * 1.1, x + W2 * 0.35, y - H2 * 1.0, x + W2 * 0.85, y - H2 * 0.7, x + W2 * 1.15, y - H2 * 0.3, x + W2 * 1.2, y + cs * 0.1];
  rock(c, RP, g1, l);
  c.save(); c.beginPath(); c.moveTo(RP[0], RP[1]); for (var rp = 2; rp < RP.length; rp += 2) c.lineTo(RP[rp], RP[rp + 1]); c.closePath(); c.clip();
  D.poly([x + W2 * 0.35, y - H2 * 1.0, x + W2 * 0.85, y - H2 * 0.7, x + W2 * 1.15, y - H2 * 0.3, x + W2 * 1.2, y + cs * 0.1, x + W2 * 0.4, y + cs * 0.1, x + W2 * 0.2, y - H2 * 0.5], 'rgba(20,24,50,0.25)');
    // снег на уступах — внутри силуэта скалы
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(RP[2], RP[3]); for (var sp0 = 4; sp0 <= 12; sp0 += 2) c.lineTo(RP[sp0], RP[sp0 + 1]); for (var sp1 = 12; sp1 >= 2; sp1 -= 2) c.lineTo(RP[sp1] + (x - RP[sp1]) * 0.06, RP[sp1 + 1] + cs * (0.16 + ((sp1 / 2) % 2) * 0.08)); c.closePath(); c.fill();
  c.restore(); rock(c, RP, null, l);
  c.strokeStyle = 'rgba(20,24,50,0.45)'; c.lineWidth = Math.max(1, l * 0.6); c.beginPath();
  c.moveTo(x - W2 * 0.75, y - H2 * 0.5); c.lineTo(x - W2 * 0.6, y - H2 * 0.25); c.lineTo(x - W2 * 0.72, y - H2 * 0.05);
  c.moveTo(x + W2 * 0.6, y - H2 * 0.55); c.lineTo(x + W2 * 0.75, y - H2 * 0.3); c.stroke();
  // следы когтей
  c.strokeStyle = 'rgba(230,240,255,0.55)'; c.lineWidth = Math.max(1, l * 0.5); for (var k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x + W2 * (0.62 + k * 0.08), y - H2 * 0.48); c.lineTo(x + W2 * (0.55 + k * 0.08), y - H2 * 0.22); c.stroke(); }
  c.restore(); c.beginPath(); arch(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
  // сосульки над входом
  for (var ic = 0; ic < 7; ic++) { var u = (ic + 0.5) / 7, dxu = (u - 0.5) * 1.7, ixx = x + dxu * mw, iyy = y - mh * Math.sqrt(Math.max(0, 1 - dxu * dxu)) * 0.96 + cs * 0.02, len = cs * (0.1 + ((ic * 7) % 3) * 0.06);
    D.poly([ixx - cs * 0.035, iyy, ixx, iyy + len, ixx + cs * 0.035, iyy], 'rgba(220,245,255,0.95)', Math.max(0.8, l * 0.4)); }
  D.ell(x - W2 * 1.05, y + cs * 0.02, cs * 0.28, cs * 0.18, '#7a82a2', l * 0.8); D.ell(x - W2 * 1.1, y - cs * 0.08, cs * 0.18, cs * 0.06, '#ffffff'); D.ell(x + W2 * 1.1, y + cs * 0.04, cs * 0.22, cs * 0.14, '#6a7292', l * 0.8);
  // иней на земле у входа
  c.save(); c.globalAlpha = 0.6; var fg = c.createRadialGradient(x, y + cs * 0.2, cs * 0.1, x, y + cs * 0.2, cs * 1.2); fg.addColorStop(0, 'rgba(190,235,255,0.7)'); fg.addColorStop(1, 'rgba(190,235,255,0)'); c.fillStyle = fg; c.beginPath(); c.ellipse(x, y + cs * 0.25, cs * 1.25, cs * 0.45, 0, 0, 7); c.fill(); c.restore();
  // выход Змея: облако снега и осколки
  if (G.lairOut != null) { var p = (Z.time - G.lairOut) / 2.2; if (p < 1) { for (var rk = 0; rk < 7; rk++) { var ra = rk * 0.9, rpx = x + Math.cos(ra) * mw * (0.5 + p * 1.3), rpy = y - mh * 0.8 + p * p * cs * 2.4 - Math.sin(rk) * cs * 0.3 * (1 - p); c.globalAlpha = 1 - p * 0.6; D.poly([rpx - cs * 0.08, rpy, rpx, rpy - cs * 0.1, rpx + cs * 0.09, rpy - cs * 0.02, rpx + cs * 0.03, rpy + cs * 0.06], '#7a82a2', l * 0.5); } c.globalAlpha = 1; for (var s2 = 0; s2 < 12; s2++) { var a = -Math.PI + s2 / 11 * Math.PI, rr = cs * (0.4 + p * 1.8); c.globalAlpha = (1 - p) * 0.8; D.circ(x + Math.cos(a) * rr, y - cs * 0.5 + Math.sin(a) * rr * 0.6, cs * (0.2 + p * 0.3), '#f4f8ff'); } c.globalAlpha = 1; } }
}
function drawDecor(o, X, Y, cs, t) {
  var c = C(), x = X(o.c + 0.5), y = Y(o.r + 0.85), l = Math.max(1.2, cs * 0.04), k = o.k;
  D.ell(x + cs * 0.06, y + cs * 0.02, cs * 0.42, cs * 0.1, 'rgba(30,40,80,0.18)');
  if (k === 0) {   // снеговик в богатырском шлеме и с деревянным мечом — богатыри лепили, пока ждали Змея
    var R = cs * 0.2; D.circ(x, y - R * 0.85, R, '#f6f9ff', l); D.circ(x, y - R * 2.0, R * 0.72, '#f6f9ff', l); var hy = y - R * 3.05; D.circ(x, hy, R * 0.55, '#f6f9ff', l);
    D.circ(x - R * 0.18, hy - R * 0.05, R * 0.08, OL); D.circ(x + R * 0.2, hy - R * 0.05, R * 0.08, OL); D.poly([x, hy + R * 0.05, x + R * 0.5, hy + R * 0.12, x, hy + R * 0.2], '#ff8a3d', l * 0.6);
    c.strokeStyle = OL; c.lineWidth = l * 0.6; c.beginPath(); c.arc(x, hy + R * 0.12, R * 0.22, 0.3, Math.PI - 0.3); c.stroke();
    c.beginPath(); c.moveTo(x - R * 0.58, hy - R * 0.15); c.quadraticCurveTo(x - R * 0.6, hy - R * 0.95, x, hy - R * 1.15); c.quadraticCurveTo(x + R * 0.6, hy - R * 0.95, x + R * 0.58, hy - R * 0.15); c.closePath();
    var gh = c.createLinearGradient(x - R * 0.6, 0, x + R * 0.6, 0); gh.addColorStop(0, '#eef2fa'); gh.addColorStop(1, '#8a93ad'); c.fillStyle = gh; c.fill(); c.lineWidth = l; c.stroke();
    D.rr(x - R * 0.62, hy - R * 0.25, R * 1.24, R * 0.16, R * 0.05); c.fillStyle = '#c9a03a'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(x, hy - R * 1.15); c.lineTo(x, hy - R * 1.5); c.stroke(); D.circ(x, hy - R * 1.52, R * 0.08, '#e8484f', l * 0.5);
    D.rr(x - R * 0.62, y - R * 2.6, R * 1.24, R * 0.26, R * 0.1); c.fillStyle = '#c0323f'; c.fill(); c.stroke();
    var sw = Math.sin(t * 1.5 + o.s * 5) * 0.08; c.save(); c.translate(x + R * 0.8, y - R * 1.9); c.rotate(-0.5 + sw); c.lineCap = 'round'; c.strokeStyle = OL; c.lineWidth = l * 2.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -R * 1.6); c.stroke(); c.strokeStyle = '#c99a5a'; c.lineWidth = l * 1.1; c.stroke(); c.strokeStyle = OL; c.lineWidth = l * 1.6; c.beginPath(); c.moveTo(-R * 0.3, -R * 0.2); c.lineTo(R * 0.3, -R * 0.2); c.stroke(); c.restore();
    c.strokeStyle = '#6a4628'; c.lineWidth = l * 0.9; c.beginPath(); c.moveTo(x - R * 0.65, y - R * 2.0); c.lineTo(x - R * 1.2, y - R * 2.4); c.stroke();
  } else if (k === 1) {   // мёртвое заиндевевшее дерево
    c.lineCap = 'round'; var br = function (x0, y0, a, len, w, d) { var x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len; c.strokeStyle = OL; c.lineWidth = w + l * 1.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = '#6a5a5a'; c.lineWidth = w; c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = w * 0.4; c.beginPath(); c.moveTo(x0, y0 - w * 0.3); c.lineTo(x1, y1 - w * 0.3); c.stroke(); if (d > 0) { br(x1, y1, a - 0.5, len * 0.62, w * 0.62, d - 1); br(x1, y1, a + 0.45, len * 0.55, w * 0.6, d - 1); } };
    br(x, y, -Math.PI / 2 + (o.s - 0.5) * 0.2, cs * 0.55, cs * 0.12, 3);
  } else if (k === 2) {   // руины дозорной башни
    c.beginPath(); c.moveTo(x - cs * 0.42, y); c.lineTo(x - cs * 0.42, y - cs * 0.85); c.lineTo(x - cs * 0.2, y - cs * 0.7); c.lineTo(x - cs * 0.05, y - cs * 1.0); c.lineTo(x + cs * 0.15, y - cs * 0.62); c.lineTo(x + cs * 0.42, y - cs * 0.72); c.lineTo(x + cs * 0.42, y); c.closePath();
    var g2 = c.createLinearGradient(x - cs * 0.42, 0, x + cs * 0.42, 0); g2.addColorStop(0, '#b4b8cc'); g2.addColorStop(1, '#7a7e98'); c.fillStyle = g2; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
    c.strokeStyle = 'rgba(40,44,80,0.35)'; c.lineWidth = l * 0.5; for (var rr = 1; rr < 5; rr++) { c.beginPath(); c.moveTo(x - cs * 0.42, y - rr * cs * 0.17); c.lineTo(x + cs * 0.42, y - rr * cs * 0.17); c.stroke(); }
    D.rr(x - cs * 0.07, y - cs * 0.55, cs * 0.14, cs * 0.22, cs * 0.06); c.fillStyle = '#2a2438'; c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x - cs * 0.44, y - cs * 0.86); c.lineTo(x - cs * 0.2, y - cs * 0.72); c.lineTo(x - cs * 0.05, y - cs * 1.02); c.lineTo(x + cs * 0.15, y - cs * 0.64); c.lineTo(x + cs * 0.44, y - cs * 0.74); c.lineTo(x + cs * 0.44, y - cs * 0.66); c.lineTo(x + cs * 0.15, y - cs * 0.56); c.lineTo(x - cs * 0.05, y - cs * 0.9); c.lineTo(x - cs * 0.2, y - cs * 0.62); c.lineTo(x - cs * 0.44, y - cs * 0.76); c.closePath(); c.fill();
    D.ell(x + cs * 0.5, y - cs * 0.03, cs * 0.13, cs * 0.08, '#8a8ea6', l * 0.6); D.ell(x - cs * 0.55, y, cs * 0.1, cs * 0.06, '#8a8ea6', l * 0.6);
  } else if (k === 3) {   // брошенные сани с бочонком
    c.save(); c.translate(x, y); c.rotate(-0.12);
    c.strokeStyle = OL; c.lineWidth = l * 1.4; c.beginPath(); c.moveTo(-cs * 0.45, 0); c.lineTo(cs * 0.3, 0); c.quadraticCurveTo(cs * 0.45, 0, cs * 0.42, -cs * 0.16); c.stroke(); c.strokeStyle = '#8a5a35'; c.lineWidth = l * 0.7; c.stroke();
    D.rr(-cs * 0.4, -cs * 0.3, cs * 0.7, cs * 0.2, cs * 0.04); c.fillStyle = '#a8784a'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
    D.rr(-cs * 0.15, -cs * 0.6, cs * 0.26, cs * 0.3, cs * 0.06); c.fillStyle = '#7f5332'; c.fill(); c.stroke(); c.fillStyle = '#5a6078'; c.fillRect(-cs * 0.15, -cs * 0.52, cs * 0.26, cs * 0.03); c.fillRect(-cs * 0.15, -cs * 0.4, cs * 0.26, cs * 0.03);
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(-cs * 0.1, -cs * 0.31, cs * 0.3, cs * 0.05, 0, Math.PI, 0); c.fill(); c.restore();
  } else if (k === 4) {   // рваный стяг на копье
    c.strokeStyle = OL; c.lineWidth = l * 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - cs * 1.25); c.stroke(); c.strokeStyle = '#8a5a35'; c.lineWidth = l * 0.8; c.stroke();
    var fw = Math.sin(t * 2.2 + o.s * 6) * cs * 0.05; c.beginPath(); c.moveTo(x, y - cs * 1.18); c.quadraticCurveTo(x + cs * 0.25, y - cs * 1.2 + fw, x + cs * 0.5, y - cs * 1.12 + fw); c.lineTo(x + cs * 0.38, y - cs * 0.98 + fw); c.lineTo(x + cs * 0.48, y - cs * 0.84 + fw); c.quadraticCurveTo(x + cs * 0.22, y - cs * 0.86 + fw * 0.5, x, y - cs * 0.82); c.closePath(); c.fillStyle = '#c0323f'; c.fill(); c.lineWidth = l * 0.8; c.strokeStyle = OL; c.stroke();
    D.circ(x + cs * 0.2, y - cs * 1.0 + fw * 0.6, cs * 0.06, '#ffd54a'); D.poly([x - cs * 0.05, y - cs * 1.25, x, y - cs * 1.4, x + cs * 0.05, y - cs * 1.25], '#d6dde9', l * 0.5); D.ell(x, y, cs * 0.16, cs * 0.05, '#ffffff');
  } else {   // груда валунов
    [[-0.22, -0.02, 0.24, 0.17], [0.2, 0, 0.2, 0.15], [0, -0.2, 0.17, 0.13]].forEach(function (q) { var g3 = c.createLinearGradient(x + q[0] * cs - q[2] * cs, 0, x + q[0] * cs + q[2] * cs, 0); g3.addColorStop(0, '#aaa6c4'); g3.addColorStop(1, '#66628a'); D.ell(x + q[0] * cs, y + q[1] * cs - q[3] * cs * 0.6, q[2] * cs, q[3] * cs, g3, l); D.ell(x + q[0] * cs - q[2] * cs * 0.15, y + q[1] * cs - q[3] * cs * 1.15, q[2] * cs * 0.7, q[3] * cs * 0.35, '#ffffff'); });
  }
}
function drawRelic(o, X, Y, cs, t) {
  var c = C(), x = X(o.c + 0.3 + o.s * 0.4), y = Y(o.r + 0.62), l = Math.max(1.2, cs * 0.035);
  D.ell(x, y + cs * 0.04, cs * 0.3, cs * 0.07, 'rgba(30,40,80,0.18)');
  if (o.k === 0) {   // шлем-шишак: купол с шипом, наносник, бармица из кольчуги — лежит набок в снегу
    c.save(); c.translate(x, y - cs * 0.04); c.rotate(-0.35);
    c.fillStyle = '#9aa4bc'; c.beginPath(); c.moveTo(-cs * 0.17, -cs * 0.02); c.quadraticCurveTo(0, cs * 0.12, cs * 0.17, -cs * 0.02); c.lineTo(cs * 0.15, cs * 0.1); c.quadraticCurveTo(0, cs * 0.2, -cs * 0.15, cs * 0.1); c.closePath(); c.fill(); c.lineWidth = l * 0.7; c.strokeStyle = OL; c.stroke();
    c.strokeStyle = 'rgba(40,50,80,0.5)'; c.lineWidth = Math.max(0.8, l * 0.4); for (var mq = -2; mq <= 2; mq++) { c.beginPath(); c.arc(mq * cs * 0.06, cs * 0.07, cs * 0.03, 0, Math.PI); c.stroke(); }
    c.beginPath(); c.moveTo(-cs * 0.17, 0); c.quadraticCurveTo(-cs * 0.18, -cs * 0.22, 0, -cs * 0.3); c.quadraticCurveTo(cs * 0.18, -cs * 0.22, cs * 0.17, 0); c.closePath();
    var g = c.createLinearGradient(-cs * 0.17, 0, cs * 0.17, 0); g.addColorStop(0, '#eef2fa'); g.addColorStop(1, '#8a93ad'); c.fillStyle = g; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
    D.rr(-cs * 0.18, -cs * 0.03, cs * 0.36, cs * 0.06, cs * 0.02); c.fillStyle = '#c9a03a'; c.fill(); c.stroke();
    c.strokeStyle = OL; c.lineWidth = l * 1.2; c.beginPath(); c.moveTo(0, -cs * 0.3); c.lineTo(0, -cs * 0.44); c.stroke(); D.circ(0, -cs * 0.45, cs * 0.025, '#c9a03a', l * 0.5);
    D.rr(-cs * 0.022, -cs * 0.01, cs * 0.044, cs * 0.14, cs * 0.01); c.fillStyle = '#c9d2e3'; c.fill(); c.lineWidth = l * 0.6; c.stroke();
    c.restore(); c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(x + cs * 0.06, y + cs * 0.02, cs * 0.2, cs * 0.05, 0, 0, 7); c.fill();
  } else if (o.k === 1) {   // щит воткнут в снег
    c.save(); c.translate(x, y); c.rotate(-0.25 + o.s * 0.3);
    c.beginPath(); c.moveTo(-cs * 0.2, -cs * 0.42); c.lineTo(cs * 0.2, -cs * 0.42); c.quadraticCurveTo(cs * 0.22, -cs * 0.08, 0, cs * 0.04); c.quadraticCurveTo(-cs * 0.22, -cs * 0.08, -cs * 0.2, -cs * 0.42); c.closePath(); c.fillStyle = '#c0323f'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
    c.strokeStyle = '#ffd54a'; c.lineWidth = l * 0.8; c.beginPath(); c.moveTo(0, -cs * 0.38); c.lineTo(0, -cs * 0.02); c.moveTo(-cs * 0.15, -cs * 0.25); c.lineTo(cs * 0.15, -cs * 0.25); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = l * 0.6; c.beginPath(); c.moveTo(cs * 0.08, -cs * 0.42); c.lineTo(cs * 0.03, -cs * 0.3); c.lineTo(cs * 0.1, -cs * 0.2); c.stroke();   // трещина
    c.restore(); D.ell(x, y, cs * 0.16, cs * 0.05, '#ffffff');
  } else {   // сломанное копьё и бердыш крест-накрест
    c.lineCap = 'round';
    c.strokeStyle = OL; c.lineWidth = l * 2.2; c.beginPath(); c.moveTo(x - cs * 0.3, y - cs * 0.02); c.lineTo(x + cs * 0.15, y - cs * 0.36); c.moveTo(x + cs * 0.28, y); c.lineTo(x - cs * 0.05, y - cs * 0.3); c.stroke();
    c.strokeStyle = '#8a5a35'; c.lineWidth = l; c.stroke();
    D.poly([x + cs * 0.15, y - cs * 0.36, x + cs * 0.26, y - cs * 0.48, x + cs * 0.2, y - cs * 0.32], '#d6dde9', l * 0.6);
    c.beginPath(); c.moveTo(x - cs * 0.05, y - cs * 0.3); c.quadraticCurveTo(x - cs * 0.22, y - cs * 0.34, x - cs * 0.14, y - cs * 0.16); c.closePath(); c.fillStyle = '#d6dde9'; c.fill(); c.lineWidth = l * 0.6; c.strokeStyle = OL; c.stroke();
    D.ell(x, y, cs * 0.18, cs * 0.05, '#ffffff');
  }
}
// Змей в пещере: виден только через пасть (хвост, крылья и головы не просвечивают сквозь скалу), в глубине — в тени
var oObjs0 = Z.drawObjs;
Z.drawObjs = function (objs, X, Y, cs, t) {
  if (oObjs0) oObjs0.apply(this, arguments);
  var G = Z.G, lr = lairOf(G); if (!lr) return;
  var yL = lr.r + LAIR_Y;
  objs.forEach(function (o) {
    var e = o.o; if (!e || e.type !== 'gorynych' || e.dead || e.y > yL - 0.02 || o._lair) return; o._lair = 1;
    var f0 = o.f; o.f = function (ee) {
      var c = D.ctx, A = Z.lairArch(G, X, Y, cs), yb = Y(yL) + cs * 0.06, k = Math.max(0, Math.min(1, (e.y - (lr.r + 0.3)) / (yL - lr.r - 0.3)));
      c.save(); c.beginPath(); A(c); c.rect(X(-3), yb, X(G.L.W + 3) - X(-3), Y(G.L.H + 3) - yb); c.clip();
      f0.apply(this, arguments);
      if (k < 1) { c.globalAlpha = (1 - k) * 0.7; c.fillStyle = '#070912'; c.beginPath(); A(c); c.fill(); c.globalAlpha = 1; }
      c.restore();
    };
  });
};
var oOM = UI.objMargin; UI.objMargin = function (cs) { var m = oOM.apply(this, arguments), G = Z.G; if (lairOf(G)) m = { x: m.x, t: Math.max(m.t, cs * 2.1), b: m.b }; return m; };   // скала логова выше рамки
var oObjs = Z.drawObjs;
Z.drawObjs = function (objs, X, Y, cs, t) {
  if (oObjs) oObjs.apply(this, arguments);
  var G = Z.G, lr = lairOf(G); if (!lr) return;
  // 2.12: логово, украшения и реликвии — готовыми кадрами (v30o): скала не перерисовывается, качание — по фазам
  var burst = G.lairOut != null && Z.time - G.lairOut < 2.3, out = G.lairOut != null || G.enemies.some(function (e) { return !e.dead && e.type === 'gorynych'; });
  var SA = Z.sceneAnim && !burst, SS = Z.sceneSprite && !burst, nph = Z.scenePhases ? Z.scenePhases(40, 16, 12) : 40;
  objs.push({ y: -50, f: function () { try { if (SA) Z.sceneAnim('lairB|' + (out ? 1 : 0), t, Math.PI * 4, nph, function (tq) { drawLair(G, X, Y, cs, tq, 'back'); }); else drawLair(G, X, Y, cs, t, 'back'); } catch (e) { if (window.__rep) window.__rep(e); } } });
  objs.push({ y: lr.r + LAIR_Y - 0.05, f: function () { try { if (SS) Z.sceneSprite('lairF|' + (out ? 1 : 0), function () { drawLair(G, X, Y, cs, t, 'front'); }); else drawLair(G, X, Y, cs, t, 'front'); } catch (e) { if (window.__rep) window.__rep(e); } } });
  (G.L.kdecor || []).forEach(function (o, i) { objs.push({ y: o.r + 0.85, f: function () { try { if (Z.sceneAnim) Z.sceneAnim('kdec' + i + '|' + o.k + '|' + o.c + '|' + o.r, t, Math.PI * 4, nph, function (tq) { drawDecor(o, X, Y, cs, tq); }); else drawDecor(o, X, Y, cs, t); } catch (e) { if (window.__rep) window.__rep(e); } } }); });
  (G.L.relics || []).forEach(function (o, i) { objs.push({ y: o.r + 0.62, f: function () { try { if (Z.sceneSprite) Z.sceneSprite('relic' + i + '|' + o.k + '|' + o.c + '|' + o.r + '|' + o.s, function () { drawRelic(o, X, Y, cs, t); }); else drawRelic(o, X, Y, cs, t); } catch (e) { if (window.__rep) window.__rep(e); } } }); });
};
// следы трёхпалых лап — на земле, к мосту
var oUnder = Z.drawUnder;
var trackIn = false;
Z.drawUnder = function (ctx, X, Y, cs, t) {
  if (oUnder && !trackIn) oUnder.apply(this, arguments);
  var G = Z.G; if (!lairOf(G) || !G.L.gtrack) return;
  if (Z.sceneSprite && ctx === D.ctx && !trackIn) { trackIn = true; try { Z.sceneSprite('gtrack|' + G.L.gtrack.length, function () { Z.drawUnder(D.ctx, X, Y, cs, t); }); } finally { trackIn = false; } return; }   // 2.12.5: следы — одной картинкой
  try { ctx.save(); ctx.fillStyle = 'rgba(90,110,160,0.28)';
    G.L.gtrack.forEach(function (p) { var px = X(p.x) + Math.cos(p.ang + Math.PI / 2) * p.side * cs * 0.18, py = Y(p.y) + Math.sin(p.ang + Math.PI / 2) * p.side * cs * 0.18;
      ctx.save(); ctx.translate(px, py); ctx.rotate(p.ang); ctx.beginPath(); ctx.ellipse(0, 0, cs * 0.1, cs * 0.075, 0, 0, 7); ctx.fill();
      [-0.5, 0, 0.5].forEach(function (a) { ctx.beginPath(); ctx.ellipse(Math.cos(a) * cs * 0.17, Math.sin(a) * cs * 0.13, cs * 0.06, cs * 0.028, a, 0, 7); ctx.fill(); }); ctx.restore(); });
    ctx.restore(); } catch (e) { ctx.restore(); }
};
})();
