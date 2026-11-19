/* 2.11.5 · вода и звуки местности:
   - «шейдер» воды: анимированные каустики (заранее посчитанные кадры-плитки), течение реки, глубина, блики, пена у берега;
     лёд — бегущий отблеск и искры; болото — мутные каустики;
   - лягушки на болоте Кикиморы: квакают, когда рядом крадётся враг, и выдают его. От холода (ледяные вышки рядом) засыпают;
   - звуки: шлёпанье по воде, хлюпанье в болоте, треск льда, пузыри; фоновая атмосфера у каждого региона; гул лавины. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, OL = D.OL || '#1b2448', TT = Z.TT || function (r, e) { return Z.LANG === 'en' ? e : r; };
function h(c, r, k) { var x = Math.sin(c * 127.1 + r * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); }
function snd(n, v, o) { try { var A = Z.AU; if (A && A.bufs && A.bufs[n]) A.sfx(n, v, o); } catch (e) { if (window.__rep) window.__rep(e); } }
function sndAt(n, v, x, y, o) { try { if (Z.AU.at) Z.AU.at(x, y); } catch (e) { if (window.__rep) window.__rep(e); } snd(n, v, o); }
function say(txt, x, y, col) { if (Z._ && Z._.addText) Z._.addText(txt, x, y, col || '#fff', 0.85, 0.8); }
function inLevel() { return UI && UI.screen === 'level'; }

// ================= каустики =================
var S = 96, F = 24, tiles = null, pats = {};
function buildTiles() {
  tiles = [];
  for (var f = 0; f < F; f++) {
    var cv = document.createElement('canvas'); cv.width = cv.height = S; var cx = cv.getContext('2d'), im = cx.createImageData(S, S), d = im.data, ph = Math.PI * 2 * f / F;
    for (var j = 0; j < S; j++) for (var i = 0; i < S; i++) {
      var u = Math.PI * 2 * i / S, v = Math.PI * 2 * j / S;
      var w = Math.cos(2 * u + v + ph) + Math.cos(-u + 2 * v - ph) + Math.cos(u - 2 * v + 2 * ph) * 0.8 + Math.cos(3 * u + 2 * v - ph) * 0.4;
      var a = Math.pow(Math.max(0, 1 - Math.abs(w) * 0.7), 4), p = (j * S + i) * 4;
      d[p] = 235; d[p + 1] = 250; d[p + 2] = 255; d[p + 3] = Math.round(a * 255);
    }
    cx.putImageData(im, 0, 0); tiles.push(cv);
  }
}
// 2.12.2: узор заранее в нужном масштабе (узор с масштабом в setTransform на телефоне шёл медленным путём — 15–30 мс за заливку),
// заливка только по видимой части воды (раньше — прямоугольник 12000×12000 с обрезкой: даже без воды на экране 15 мс),
var scaled = {};
function tileAt(f, px) {
  var k = px, T = scaled[k];
  if (!T) { var ks = Object.keys(scaled); if (ks.length > 3) delete scaled[ks[0]]; T = scaled[k] = []; }
  if (!T[f]) { if (!tiles) buildTiles(); var cv = document.createElement('canvas'); cv.width = cv.height = px; var c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.drawImage(tiles[f], 0, 0, px, px); T[f] = cv; }
  return T[f];
}
function pat(ctx, f, px) { var k = f + '@' + px; if (!pats[k] || pats[k].c !== ctx) { var ks = Object.keys(pats); if (ks.length > 80) pats = {}; pats[k] = { c: ctx, p: ctx.createPattern(tileAt(f, px), 'repeat') }; } return pats[k].p; }
// заливка каустиками внутри текущего clip. mode: river | still | swamp; R — [x, y, w, h] области воды на экране (если есть)
Z.waterFx = function (ctx, ox, oy, cs, t, mode, R) {
  if (Z.save && Z.save.fxCaust === false) return;   // 2.12.12: настройка «Блики на воде»
  try {
    var vw = Z.W || ctx.canvas.width, vh = Z.H || ctx.canvas.height, x0 = 0, y0 = 0, x1 = vw, y1 = vh;
    if (R) { x0 = Math.max(0, R[0]); y0 = Math.max(0, R[1]); x1 = Math.min(vw, R[0] + R[2]); y1 = Math.min(vh, R[1] + R[3]); if (x1 <= x0 || y1 <= y0) return; }
    var layers = mode === 'swamp' ? [[1.0, 0.16, 0.05, 0.02, 6]] : mode === 'river' ? [[1.0, 0.42, 0.45, 0.06, 10], [1.9, 0.22, 0.2, -0.04, 7]] : [[1.0, 0.36, 0.06, 0.05, 8], [1.7, 0.2, -0.04, 0.03, 6]];
    var dpr = Z.DPR || 1;
    ctx.save();
    // 2.12.3: плитки кладём обычным drawImage (заливка узором-pattern на телефонах шла ~10 мс даже на узкой полоске воды)
    layers.forEach(function (Ly, li) {
      var f = Math.floor(t * Ly[4] + li * 7) % F, px = Math.max(16, Math.round(cs * 1.5 * Ly[0] * dpr)), tile = tileAt(f, px), w = px / dpr;
      var sx = ox + t * Ly[2] * cs, sy = oy + t * Ly[3] * cs;
      sx = sx - Math.ceil((sx - x0) / w) * w; sy = sy - Math.ceil((sy - y0) / w) * w;   // первая плитка — чуть левее/выше области
      sx = Math.round(sx * dpr) / dpr; sy = Math.round(sy * dpr) / dpr;   // по сетке точек экрана — без швов между плитками
      ctx.globalAlpha = Ly[1];
      for (var yy = sy; yy < y1; yy += w) for (var xx = sx; xx < x1; xx += w) ctx.drawImage(tile, xx, yy, w, w);
    });
    ctx.restore();
  } catch (e) { if (window.__rep) window.__rep(e); }
};
// область клеток воды на экране (CSS-пиксели) для заливки каустиками
function cellsRect(G, cells, X, Y, cs) {
  if (!cells.length) return null;
  var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  cells.forEach(function (q) { var R = cellRect(G, q, X, Y, cs); if (R[0] < x0) x0 = R[0]; if (R[1] < y0) y0 = R[1]; if (R[0] + R[2] > x1) x1 = R[0] + R[2]; if (R[1] + R[3] > y1) y1 = R[1] + R[3]; });
  return [x0 - cs * 0.2, y0 - cs * 0.2, x1 - x0 + cs * 0.4, y1 - y0 + cs * 0.4];
}
Z.waterCellsRect = function (G, cells, X, Y, cs) { return cellsRect(G, cells, X, Y, cs); };
function waterCells(G) { var L = G.L, o = { open: [], ice: [] }; (L.water || []).forEach(function (q) { var k = q[1] * L.W + q[0]; if (L.bridges[k]) return; var v = L.grid[q[1]][q[0]]; if (v === 4) o.open.push(q); else if (v === 5) o.ice.push(q); }); return o; }
function cellRect(G, q, X, Y, cs) {
  var L = G.L, FPw = D.fieldPad ? D.fieldPad(L) : { l: 0, r: 0 }, x = X(q[0]), y = Y(q[1]), rx = x, rw = cs + 0.5, ry = y, rh = cs + 0.5;
  if (q[0] === 0) { rx -= FPw.l * cs + 2; rw += FPw.l * cs + 2; }
  if (q[0] === L.W - 1) rw += FPw.r * cs + 2;
  if (L.riverRow === q[1]) { ry = y + cs * 0.13; rh = cs * 0.74; }
  return [rx, ry, rw, rh];
}
function isW(G, c, r) { var L = G.L; if (c < 0 || c >= L.W) return true; var v = L.grid[r] && L.grid[r][c]; return v === 4 || v === 5 || !!L.bridges[r * L.W + c]; }
var oUnder = Z.drawUnder;
Z.drawUnder = function (ctx, X, Y, cs, t) {
  oUnder.apply(this, arguments);
  var G = Z.G; if (!G || !G.L.water || !G.L.water.length || Z.RICH === 0) return;
  try {
    var L = G.L, WC = waterCells(G), river = G.mech !== 'springs';
    if (WC.open.length) {
      ctx.save();
      // глубина: к середине темнее
      if (Z.waterClip) Z.waterClip(ctx, G, X, Y, cs, 'open');   // 2.11.5: глубина — в основе воды (v30g), здесь только каустики по контуру воды
      else { ctx.beginPath(); WC.open.forEach(function (q) { var R = cellRect(G, q, X, Y, cs); ctx.rect(R[0], R[1], R[2], R[3]); }); ctx.clip(); }
      Z.waterFx(ctx, X(0), Y(0), cs, t, L.riverRow !== undefined && river ? 'river' : 'still', cellsRect(G, WC.open, X, Y, cs));
      // блики солнца
      WC.open.forEach(function (q) { for (var g = 0; g < 2; g++) { var a = Math.pow(Math.max(0, Math.sin(t * 1.7 + h(q[0], q[1], g) * 40)), 10); if (a < 0.05) continue; var gx = X(q[0] + 0.15 + h(q[0], q[1], g + 3) * 0.7), gy = Y(q[1] + 0.3 + h(q[0], q[1], g + 5) * 0.45), r = cs * 0.09 * a; ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(gx - r * 2, gy); ctx.lineTo(gx, gy - r * 0.5); ctx.lineTo(gx + r * 2, gy); ctx.lineTo(gx, gy + r * 0.5); ctx.closePath(); ctx.moveTo(gx, gy - r * 1.4); ctx.lineTo(gx + r * 0.4, gy); ctx.lineTo(gx, gy + r * 1.4); ctx.lineTo(gx - r * 0.4, gy); ctx.closePath(); ctx.fill(); } });
      ctx.restore();
      // пена у берега: бегущий пунктир
      if (Z.waterFoam) Z.waterFoam(ctx, X, Y, cs, t); else {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, cs * 0.04); ctx.lineCap = 'round'; ctx.setLineDash([cs * 0.16, cs * 0.22]); ctx.lineDashOffset = -t * cs * 0.35;
      ctx.beginPath();
      WC.open.forEach(function (q) { var R = cellRect(G, q, X, Y, cs), c = q[0], r = q[1], ins = cs * 0.06;
        if (!isW(G, c, r - 1) || L.riverRow === r) { ctx.moveTo(R[0], R[1] + ins); ctx.lineTo(R[0] + R[2], R[1] + ins); }
        if (!isW(G, c, r + 1) || L.riverRow === r) { ctx.moveTo(R[0], R[1] + R[3] - ins); ctx.lineTo(R[0] + R[2], R[1] + R[3] - ins); }
        if (!isW(G, c - 1, r)) { ctx.moveTo(R[0] + ins, R[1]); ctx.lineTo(R[0] + ins, R[1] + R[3]); }
        if (!isW(G, c + 1, r)) { ctx.moveTo(R[0] + R[2] - ins, R[1]); ctx.lineTo(R[0] + R[2] - ins, R[1] + R[3]); } });
      ctx.globalAlpha = 0.55 + 0.2 * Math.sin(t * 2); ctx.stroke(); ctx.restore(); }
    }
    if (WC.ice.length) {
      ctx.save(); if (Z.waterClip) Z.waterClip(ctx, G, X, Y, cs, 'ice'); else { ctx.beginPath(); WC.ice.forEach(function (q) { var R = cellRect(G, q, X, Y, cs); ctx.rect(R[0], R[1], R[2], R[3]); }); ctx.clip(); }
      var span = (L.W + L.H) * cs, p = ((t * 0.12) % 1.6 - 0.3) * span, x0 = X(0) + p, y0 = Y(0);
      var gr = ctx.createLinearGradient(x0, y0, x0 + cs * 2.4, y0 + cs * 1.2); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.save(); ctx.translate(x0, y0); ctx.transform(1, 0, -0.5, 1, 0, 0); ctx.translate(-x0, -y0); ctx.fillRect(x0, Y(-2), cs * 2.4, (L.H + 4) * cs); ctx.restore();
      ctx.globalAlpha = 0.6; Z.waterFx(ctx, X(0), Y(0), cs * 1.6, t * 0.15, 'still', cellsRect(G, WC.ice, X, Y, cs));
      ctx.globalAlpha = 1; WC.ice.forEach(function (q) { var a = Math.pow(Math.max(0, Math.sin(t * 2.3 + h(q[0], q[1], 9) * 50)), 12); if (a < 0.05) return; D.flake(X(q[0] + 0.2 + h(q[0], q[1], 4) * 0.6), Y(q[1] + 0.3 + h(q[0], q[1], 6) * 0.4), cs * 0.08 * a, '#ffffff', 1); });
      ctx.restore();
    }
  } catch (e) { ctx.globalAlpha = 1; ctx.setLineDash([]); }
};

// ================= лягушки =================
D.frog = function (x, y, s, o) {
  var c = D.ctx, l = Math.max(1, s * 0.07), dir = o.dir || 1, j = o.jump || 0, sl = !!o.sleep, pf = o.puff || 0;
  if (!o.noPad) { D.ell(x, y + s * 0.12, s * 0.95, s * 0.36, '#4f9a4a', l); c.fillStyle = '#2e5a52'; c.beginPath(); c.moveTo(x, y + s * 0.12); c.lineTo(x + s * 0.9, y + s * 0.02); c.lineTo(x + s * 0.9, y + s * 0.22); c.closePath(); c.fill(); c.strokeStyle = 'rgba(30,70,30,0.5)'; c.lineWidth = Math.max(1, l * 0.5); c.beginPath(); for (var v = 0; v < 5; v++) { c.moveTo(x, y + s * 0.12); c.lineTo(x - s * 0.8 + v * s * 0.3, y + s * (v % 2 ? 0.0 : 0.3)); } c.stroke(); }
  c.save(); c.translate(x, y - j * s * 0.9); c.scale(dir, 1);
  if (sl) { c.fillStyle = 'rgba(200,235,255,0.5)'; }
  // задние лапы
  D.ell(-s * 0.32, -s * 0.05, s * 0.26, s * 0.16, '#5fae4a', l); D.ell(-s * 0.42, s * 0.06, s * 0.2, s * 0.07, '#5fae4a', l * 0.8);
  // тело
  D.ell(0, -s * 0.18, s * 0.42, s * 0.3, sl ? '#8fbf9a' : '#6cc04f', l); D.ell(s * 0.08, -s * 0.08, s * 0.26, s * 0.16, sl ? '#d8ecd8' : '#d8f0a8');
  for (var sp = 0; sp < 3; sp++) D.circ(-s * 0.15 + sp * s * 0.12, -s * 0.34 + (sp % 2) * s * 0.06, s * 0.035, 'rgba(40,100,30,0.6)');
  // горловой мешок
  if (pf > 0.05) { D.circ(s * 0.28, -s * 0.06, s * (0.08 + pf * 0.16), '#f2f0b8', l * 0.6); c.globalAlpha = 0.5; D.circ(s * 0.24, -s * 0.1, s * 0.05 * pf, '#ffffff'); c.globalAlpha = 1; }
  // передние лапки
  D.ell(s * 0.26, s * 0.06, s * 0.1, s * 0.05, '#5fae4a', l * 0.7);
  // глаза
  [[s * 0.08, -s * 0.44], [s * 0.3, -s * 0.4]].forEach(function (q) {
    D.circ(q[0], q[1], s * 0.11, sl ? '#8fbf9a' : '#6cc04f', l * 0.8);
    if (sl) { c.strokeStyle = OL; c.lineWidth = l * 0.7; c.beginPath(); c.arc(q[0], q[1], s * 0.06, 0.2, Math.PI - 0.2); c.stroke(); }
    else { var bl = D.blinkNow ? D.blinkNow() : false; if (bl) { c.strokeStyle = OL; c.lineWidth = l * 0.7; c.beginPath(); c.moveTo(q[0] - s * 0.07, q[1]); c.lineTo(q[0] + s * 0.07, q[1]); c.stroke(); } else { D.circ(q[0], q[1], s * 0.075, '#fff8d8'); D.ell(q[0] + s * 0.02, q[1], s * 0.03, s * 0.05, '#1b2448'); D.circ(q[0] + s * 0.035, q[1] - s * 0.025, s * 0.015, '#ffffff'); } }
  });
  // рот
  c.strokeStyle = OL; c.lineWidth = l * 0.6; c.beginPath(); c.moveTo(s * 0.12, -s * 0.2); c.quadraticCurveTo(s * 0.28, -s * (pf > 0.3 ? 0.1 : 0.16), s * 0.4, -s * 0.24); c.stroke();
  c.restore();
  if (sl && !Z._noZ) { var zt = (Z.time || 0) % 2; c.globalAlpha = 1 - zt / 2; D.text('z', x + s * 0.5, y - s * (0.7 + zt * 0.4), s * 0.3, '#dff4ff', 'center', 'middle', 2); c.globalAlpha = 1; }
};
function swampKeys(G) { var o = []; for (var k in G.swamp || {}) if (G.swamp[k] > 0) o.push(+k); return o; }
function frogInit(G) {
  var L = G.L, ks = swampKeys(G); if (ks.length < 3) return undefined;
  ks = ks.filter(function (k) { var c = k % L.W, r = Math.floor(k / L.W), v = L.grid[r] && L.grid[r][c]; return v !== 4 && v !== 5 && v !== 11 && !L.bridges[k]; });
  var pads = ks.filter(function (k) { var c = k % L.W, r = Math.floor(k / L.W); return L.grid[r] && L.grid[r][c] !== 1; });
  if (pads.length < 2) pads = ks.slice(); if (!pads.length) return null;
  var list = [], used = {};
  for (var i = 0; i < pads.length && list.length < 4; i++) { var k = pads[Math.floor(h(i, G.idx, 3) * pads.length)]; if (used[k]) continue; used[k] = 1; var c = k % L.W, r = Math.floor(k / L.W);
    if (list.some(function (f) { return Math.hypot(f.x - c - 0.5, f.y - r - 0.6) < 2; })) continue;
    list.push({ x: c + 0.5, y: r + 0.62, k: k, dir: h(c, r, 1) < 0.5 ? -1 : 1, croak: 2 + Math.random() * 6, cd: 0, puff: 0, cold: 0, sleep: 0, jump: 0 }); }
  return { list: list, pads: pads, told: 0, sleepTold: 0 };
}
function hopTo(G, f, k) { var L = G.L, c = k % L.W, r = Math.floor(k / L.W); f.from = { x: f.x, y: f.y }; f.to = { x: c + 0.5, y: r + 0.62 }; f.k = k; f.hop = 0.55; f.dir = f.to.x >= f.x ? 1 : -1; sndAt('a_frog_plop', 0.5, f.x, f.y, { gap: 0.1, gapKey: 'fplop' }); }
function frogTick(G, dt) {
  var FG = G.frogs; if (!FG) return;
  if (!FG.told && (G.t || 0) > 4 && !(G.banner && G.banner.t > 0) && FG.list.length) { FG.told = 1; G.banner = { text: TT('В камышах живут лягушки', 'Frogs live in the reeds'), sub: TT('Сторожа болота. Только вот холода не любят…', 'Guardians of the swamp. Though they hate the cold…'), t: 4 }; }
  FG.list.forEach(function (f) {
    f.puff = Math.max(0, f.puff - dt * 1.6); f.cd -= dt;
    if (f.hop > 0) { f.hop -= dt; var u = 1 - Math.max(0, f.hop) / 0.55; f.x = f.from.x + (f.to.x - f.from.x) * u; f.y = f.from.y + (f.to.y - f.from.y) * u; f.jump = Math.sin(u * Math.PI); if (f.hop <= 0) { f.jump = 0; f.x = f.to.x; f.y = f.to.y; } return; }
    f.cold = Math.max(0, f.cold - dt * 0.25);
    if (f.sleep > 0) { f.sleep -= dt; if (f.sleep <= 0) { f.cold = 0; say(TT('Оттаяла!', 'Thawed!'), f.x, f.y - 0.9, '#b8ff9a'); } return; }
    if (f.cold >= 6) { f.sleep = 25; snd('a_trust_down', 0.5); say(TT('Замёрзла и уснула', 'Froze and fell asleep'), f.x, f.y - 0.9, '#bfe6ff'); if (!FG.sleepTold) { FG.sleepTold = 1; G.banner = { text: TT('Лягушка уснула от холода', 'A frog fell asleep from the cold'), sub: TT('Ледяные вышки рядом — и сторож болота больше не квакает', 'Icy towers nearby — and the swamp guard stops croaking'), t: 3.4 }; } return; }
    // крадущийся враг рядом — громкое кваканье выдаёт его
    if (f.cd <= 0) {
      var hid = G.enemies.filter(function (e) { if (e.dead || e.air) return false; var p = Z.enemyPos ? Z.enemyPos(e) : e; return Math.hypot(p.x - f.x, p.y - f.y) < 2.6 && Z.hk.unseen && Z.hk.unseen(e); });
      if (hid.length) { f.cd = 2.6; f.puff = 1; f.dir = (Z.enemyPos ? Z.enemyPos(hid[0]) : hid[0]).x >= f.x ? 1 : -1; sndAt('a_frog2', 0.75, f.x, f.y, { gap: 0.4, gapKey: 'frog' }); hid.forEach(function (e) { e.spotT = Math.max(e.spotT || 0, 2.2); e.frogSeen = 1; }); say(TT('Ква!', 'Croak!'), f.x, f.y - 1.0, '#b8ff9a'); return; }
    }
    f.croak -= dt; if (f.croak <= 0) { f.croak = 6 + Math.random() * 8; f.puff = 0.8; sndAt('a_frog', 0.32, f.x, f.y, { gap: 0.8, gapKey: 'frog' }); if (Math.random() < 0.25 && FG.pads.length > 1) { var k = FG.pads[Math.floor(Math.random() * FG.pads.length)]; if (!FG.list.some(function (o) { return o.k === k; })) hopTo(G, f, k); } }
  });
}
var COLD = { ice: 1.2, snow: 0.35, freeze: 1.5 };
var oFire = Z.hk.towerFire;
Z.hk.towerFire = function (tw, st, e, fire) {
  var r = oFire ? oFire(tw, st, e, fire) : fire(tw, st, e), G = Z.G;
  try { if (G && G.frogs && COLD[tw.type]) G.frogs.list.forEach(function (f) { if (f.sleep > 0) return; var d = Math.hypot(tw.c + 0.5 - f.x, tw.r + 0.5 - f.y); if (d < 2.4) f.cold += COLD[tw.type] * 0.3; }); } catch (er) { if (window.__rep) window.__rep(er); }
  return r;
};

// ================= звуки шагов по воде / болоту / льду =================
function stepSounds(G, dt) {
  var L = G.L, any = (L.water && L.water.length) || G.swamp; if (!any) return;
  var ul = G.enemies.concat(G.squad || []), hs = G.squad || [];
  for (var i = 0; i < ul.length; i++) {
    var u = ul[i]; if (u.dead || u.air || u.ride) continue; var hero = hs.indexOf(u) >= 0, hk = hero ? 'H' + u.type : '';   // у героя свои ключи: всплески врагов его не заглушают
    var c = Math.floor(u.x), r = Math.floor(u.y), k = r * L.W + c, v = L.grid[r] ? L.grid[r][c] : -1, sw = G.swamp && G.swamp[k] > 0;
    var kind = L.bridges[k] ? 0 : v === 4 ? 1 : v === 5 ? 2 : sw ? 3 : 0, moved = u._wx !== undefined && Math.hypot(u.x - u._wx, u.y - u._wy) > 0.004;
    u._wx = u.x; u._wy = u.y;
    if (kind !== u._wk) { var prev = u._wk; u._wk = kind; u._wt = 0.4;
      if (prev !== undefined) { if (kind === 1) sndAt('w_splash', hero ? 0.45 : 0.38, u.x, u.y, { gap: 0.25, gapKey: 'wsp' + hk }); else if (kind === 2 && Math.random() < 0.4) sndAt('w_icecrack', 0.3, u.x, u.y, { gap: 1.2, gapKey: 'wic' }); else if (kind === 3) sndAt('w_squelch', 0.32, u.x, u.y, { gap: 0.3, gapKey: 'wsq' }); }
      continue; }
    if (!kind || !moved) continue;
    u._wt = (u._wt || 0) - dt; if (u._wt > 0) continue; u._wt = hero ? 0.42 + Math.random() * 0.15 : 0.75 + Math.random() * 0.6;
    if (kind === 1) sndAt('w_wade', hero ? 0.34 : 0.26, u.x, u.y, { gap: 0.22, gapKey: 'wade' + hk, pitch: 0.9 + Math.random() * 0.2 });
    else if (kind === 3) sndAt('w_squelch', hero ? 0.3 : 0.24, u.x, u.y, { gap: 0.3, gapKey: 'wsq' + hk, pitch: 0.85 + Math.random() * 0.3 });
  }
  G._bubT = (G._bubT || 3) - dt; if (G._bubT <= 0) { G._bubT = 4 + Math.random() * 6; if (G.swamp || (L.water || []).some(function (q) { return L.grid[q[1]][q[0]] === 4; })) snd('w_bubble', 0.18, { gap: 1, gapKey: 'wbub', pitch: 0.8 + Math.random() * 0.4 }); }
}
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!G || !G.L || !inLevel()) return;
  try {
    if (G.frogs === undefined && G.swamp) G.frogs = frogInit(G);
    if (G.frogs) frogTick(G, dt);
    if (G.phase !== 'won' && G.phase !== 'lost') stepSounds(G, dt);   // 2.11.5: и между волнами — героя водят по воде и до боя
  } catch (er) { if (window.__rep) window.__rep(er); }
};
var oTap = UI.tapHook;
UI.tapHook = function (wx, wy) {
  var G = Z.G;
  if (G && G.frogs && UI.screen === 'level') {
    try {
      var f = G.frogs.list.filter(function (q) { return Math.hypot(q.x - wx, q.y - 0.25 - (Z.gLift ? Z.gLift(q.x, q.y) : 0) - wy) < 0.6 && !(q.hop > 0); })[0];
      if (f) {
        if (f.sleep > 0) { f.sleep = Math.min(f.sleep, 0.01); f.cold = 3; }
        else { f.puff = 1; snd('a_frog', 0.6, { gap: 0.3, gapKey: 'frog' }); say(TT('Ква?', 'Croak?'), f.x, f.y - 0.9, '#b8ff9a'); var FG = G.frogs, k = FG.pads[Math.floor(Math.random() * FG.pads.length)]; if (FG.pads.length > 1 && !FG.list.some(function (o) { return o.k === k; })) hopTo(G, f, k); }
        return true;
      }
    } catch (er) { if (window.__rep) window.__rep(er); }
  }
  return oTap ? oTap.apply(this, arguments) : false;
};
// предметы поля (деревья, камни, дома) — поверх воды и болота: плоское не наезжает на объёмное
var oObjsW = Z.drawObjs;
Z.drawObjs = function (objs, X, Y, cs, t) {
  if (oObjsW) oObjsW.apply(this, arguments);
  var FC = UI.fieldCache, G = Z.G; if (!G || !FC || !FC.can || !(FC.can._over || FC.can._rows)) return;
  var L = UI.L, FP = D.fieldPad(G.L), bx = L.fx - FP.l * cs, by = L.fy - FP.t * cs, sw = L.BW + (FP.l + FP.r) * cs, k = sw / FC.can.width;
  if (FC.can._rows) {   // ряд за рядом, по глубине: враг за деревом — за деревом
    if (Z.trimRows) Z.trimRows(FC.can);
    FC.can._rows.forEach(function (R) { objs.push({ y: R.ground ? R.r + 0.05 : R.r + 0.9, f: function () {
      if (R.segs) { var kk = k * (R.sx || 1); R.segs.forEach(function (g) { D.ctx.drawImage(g.cv, bx + g.x * kk, by + R.y0 * k + g.y * kk, g.w * kk, g.h * kk); }); return; }   // 2.11.5: только непрозрачные куски
      D.ctx.drawImage(R.cv, bx, by + R.y0 * k, sw, (R.h || R.cv.height) * k); } }); });
    return;
  }
  objs.push({ y: -98.5, f: function () { D.ctx.drawImage(FC.can._over, bx, by, sw, L.BH + (FP.t + FP.b) * cs); } });
};
Z.drawFrogs = function (ctx, X, Y, cs, t) {   // поверх камыша (рисуется сразу после него), иначе лягушек не видно
  var G = Z.G; if (!G || !G.frogs) return;
  G.frogs.list.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (f) { var Lg = G.L, fc = Math.floor(f.x), fr = Math.floor(f.y), lf = ((Lg.hgt && Lg.hgt[fr] && Lg.hgt[fr][fc]) ? 0.32 : 0) + (Z.cellLift ? Z.cellLift(fc, fr) : 0); D.frog(X(f.x), Y(f.y - lf), cs * 0.44, { dir: f.dir, puff: f.puff, sleep: f.sleep > 0, jump: f.jump, noPad: f.hop > 0 }); });
};

// ================= атмосфера региона =================
var AMB = ['amb_forest', 'amb_village', 'amb_lake', 'amb_mountain', 'amb_north'], amb = null;
function ambWant() {
  if (!Z.AMB_BED) return null;   // 2.11.5: постоянную подложку (ветер/вода) убрали — записи шумные и звучат как шипение; оставлены только редкие звуки природы
  var G = Z.G, A = Z.AU; if (!G || !G.info || !inLevel() || !A || !A.ctx || !(A.running && A.running())) return null;
  if (G.mech === 'swamp') return 'amb_swamp';
  if (G.mech === 'dark') return 'amb_cave';
  return AMB[G.info.region] || null;
}
function ambStop(fade) { if (!amb) return; var A = Z.AU, a = amb, now = A.ctx.currentTime; amb = null; try { (a.ch || []).forEach(function (q) { q.lfo.stop(now + fade + 0.1); }); } catch (e0) { if (window.__rep) window.__rep(e0); } try { a.g.gain.cancelScheduledValues(now); a.g.gain.setValueAtTime(a.g.gain.value, now); a.g.gain.linearRampToValueAtTime(0, now + fade); a.srcs.forEach(function (s) { try { s.stop(now + fade + 0.05); } catch (e) { if (window.__rep) window.__rep(e); } }); } catch (e) { if (window.__rep) window.__rep(e); } }
function ambTick() {
  try {
    var A = Z.AU, want = ambWant();
    if (!want) { if (amb) ambStop(1.2); return; }
    if (amb && amb.name !== want) ambStop(1.5);
    var buf = A.bufs && A.bufs[want]; if (!buf) return;
    var c = A.ctx, now = c.currentTime, paused = Z.G && (Z.G.paused || UI.modal);
    // 2.11.5: фон местности — тихая подложка, а не «шум ливня»: одна копия (раньше две со сдвигом складывались в сплошной шипящий шум),
    // громкость по реальной громкости файла (озеро было в 6 раз громче леса), срез верхов (шипение) и плавная склейка кругов
    var LV = 0.0075 / Math.max(0.02, amb && amb.rms || A._ambRms && A._ambRms[want] || 0.05);
    if (!amb) {
      if (!A._ambRms) A._ambRms = {};
      if (!A._ambRms[want]) { try { var ch0 = buf.getChannelData(0), sm = 0, st = Math.max(1, Math.floor(ch0.length / 20000)), nn = 0; for (var k = 0; k < ch0.length; k += st) { sm += ch0[k] * ch0[k]; nn++; } A._ambRms[want] = Math.sqrt(sm / nn) || 0.05; } catch (e1) { A._ambRms[want] = 0.05; } }
      var g = c.createGain(); g.gain.value = 0; var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = want === 'amb_lake' ? 1200 : 2600; lp.Q.value = 0.5;
      lp.connect(g); g.connect(A.sfxG || A.master);
      amb = { name: want, g: g, lp: lp, srcs: [], next: now + 0.05, buf: buf, ch: [], rms: A._ambRms[want] };
      LV = 0.0075 / Math.max(0.02, amb.rms); g.gain.linearRampToValueAtTime(LV, now + 3);
    }
    var wave = Z.G && Z.G.phase === 'wave', tgt = paused ? LV * 0.35 : wave ? LV * 0.7 : LV;
    if (amb.lastT === undefined || Math.abs(amb.lastT - tgt) > LV * 0.02) { amb.g.gain.setTargetAtTime(tgt, now, 0.8); amb.lastT = tgt; }
    amb.srcs = amb.srcs.filter(function (s) { return s._end > now; });
    var d = amb.buf.duration, X = Math.min(2, d * 0.25);
    while (amb.next < now + 1.5) {
      var s = c.createBufferSource(), sg = c.createGain(), t0 = amb.next; s.buffer = amb.buf; s.connect(sg); sg.connect(amb.lp);
      sg.gain.setValueAtTime(0, t0); sg.gain.linearRampToValueAtTime(1, t0 + X); sg.gain.setValueAtTime(1, t0 + d - X); sg.gain.linearRampToValueAtTime(0, t0 + d);
      s.start(t0); s.stop(t0 + d + 0.05); s._end = t0 + d; amb.srcs.push(s); amb.next = t0 + d - X;
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
}
setInterval(ambTick, 300);

// ================= лавина гудит =================
try {
  var oS = Z.AU.sfx;
  Z.AU.sfx = function (n, v, o) { var r = oS.apply(this, arguments); if (n === 'avalanche' && this.bufs && this.bufs.m_avalanche_rumble) { try { oS.call(this, 'm_avalanche_rumble', (v || 0.8) * 0.9, { gap: 1.5, gapKey: 'avr' }); } catch (e) { if (window.__rep) window.__rep(e); } } return r; };
} catch (e) { if (window.__rep) window.__rep(e); }
})();
// 2.11.5: у стены крепости клетки частично закрыты крышами города — в режиме стройки их контур рисуем поверх
(function () {
  var Z = window.Z, D = Z.D, UI = Z.ui;
  var oOver = Z.drawOver;
  Z.drawOver = function (ctx, X, Y, cs, t) {
    if (oOver) oOver.apply(this, arguments);
    var G = Z.G; if (!G || !G.L || !G.L.greatWall || !UI) return;
    if (G.phase !== 'build' && G.phase !== 'between' && !UI.menu && !(UI.drag && UI.drag.moved)) return;
    try {
      ctx.save(); ctx.setLineDash([cs * 0.1, cs * 0.08]); ctx.lineWidth = Math.max(1.2, cs * 0.035);
      for (var r = Math.max(0, G.L.H - 3); r < G.L.H; r++) for (var c = 0; c < G.L.W; c++) {
        if (!Z.canBuildAt(c, r)) continue;
        var sel = UI.menu && UI.menu.c === c && UI.menu.r === r;
        D.rr(X(c) + cs * 0.1, Y(r) + cs * 0.1, cs * 0.8, cs * 0.8, cs * 0.16);
        ctx.fillStyle = sel ? 'rgba(255,230,120,0.28)' : 'rgba(150,190,255,0.14)'; ctx.fill();
        ctx.strokeStyle = sel ? 'rgba(255,215,80,0.95)' : 'rgba(120,160,235,0.7)'; ctx.stroke();
      }
      ctx.restore();
    } catch (e) { ctx.restore(); }
  };
})();
