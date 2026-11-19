/* 2.12 · общие кадры анимации.
   Раньше каждый враг и каждая вышка держали свою картинку и перерисовывали её 11–15 раз в секунду: на поле 25 врагов —
   это ~300 перерисовок в секунду, каждая на десятки штрихов. Теперь кадр зависит только от вида (тип, направление,
   фаза шага, состояние), поэтому все еноты одного направления берут одни и те же 12 кадров шага, нарисованные один раз.
   Полоска здоровья, наклон на склоне и прочее «своё» рисуется поверх живьём — это пара прямоугольников.
   Кадр обрезается по краске (по измерению в памяти процессора), так что на экран переносится только рисунок. */
(function () {
'use strict';
var Z = window.Z, D = Z.D;
function off() { return Z.cachesOff(); }
function pick(a, b, c) { return Z.perfPick ? Z.perfPick(a, b, c) : a; }
var FR = new Map(), SC = null, zoomT = -9, lastCs = 0, building = 0;   // building — идёт построение кадра (вложенные картинки рисуются напрямую: черновик один)
function maxFrames() { return pick(2000, 1400, 1000); }
var frPx = 0; function maxFrPx() { return pick(40e6, 10e6, 6e6); }   // память картинок: телефон — до ~40 МБ
// построений кадров за один кадр игры — не больше нескольких: иначе в начале уровня, пока набор кадров собирается, кадр
// растягивается на десятки миллисекунд (подёргивания). Сверх лимита объект рисуется в этот кадр напрямую.
var bT = -1, bN = 0;
// 2.12.9 · листы кадров. Раньше каждый кадр жил в своём маленьком холсте, и за кадр игры на экран переносились картинки
// из сотни разных холстов; на части устройств каждый такой перенос — отдельная пересылка в видеокарту (замер: 150 картинок
// из 150 холстов — больше секунды на кадр, те же 150 с одного листа — 17 мс). Теперь кадры лежат на нескольких больших листах
// (как текстурные атласы в играх): полками по высоте. Лист, которым давно не пользовались, очищается целиком и идёт под новые кадры.
var SHEET = 1024, PAD = 2, sheets = [], cur = null;   // лист небольшой: при дорисовке кадра браузер копирует лист целиком
function maxSheets() { return pick(40, 20, 12); }
function sheetAlloc(S, w, h) {
  var hh = Math.ceil((h + PAD) / 16) * 16, ww = w + PAD, R = S.rows;
  for (var i = 0; i < R.length; i++) if (R[i].h === hh && R[i].x + ww <= SHEET) { var x = R[i].x; R[i].x += ww; return { x: x, y: R[i].y }; }
  if (S.y + hh > SHEET) return null;
  R.push({ y: S.y, h: hh, x: ww }); S.y += hh; return { x: 0, y: S.y - hh };
}
function atlasPut(src, sx, sy, w, h) {
  if (!Z.atlasOn || w > 400 || h > 400 || w < 1 || h < 1) return null;
  var S = null, p = null, i;
  if (cur) { p = sheetAlloc(cur, w, h); if (p) S = cur; }   // дорисовываем только в текущий лист: остальные не меняются
  if (!p) {
    if (sheets.length < maxSheets()) { var cv = document.createElement('canvas'); cv.width = cv.height = SHEET; cv._sheet = true; S = { cv: cv, ctx: cv.getContext('2d'), gen: 0, y: 0, rows: [], used: -1 }; sheets.push(S); }
    else {
      var now = Z.time || 0; for (i = 0; i < sheets.length; i++) if (sheets[i].used !== now && (!S || sheets[i].used < S.used)) S = sheets[i];
      if (!S) return null;   // все листы заняты кадрами этого кадра игры — этот кадр останется отдельным холстом
      S.gen++; S.y = 0; S.rows = []; S.ctx.clearRect(0, 0, SHEET, SHEET);
    }
    cur = S; p = sheetAlloc(S, w, h); if (!p) return null;
  }
  S.ctx.drawImage(src, sx, sy, w, h, p.x, p.y, w, h);
  return { S: S, gen: S.gen, ax: p.x, ay: p.y };
}
function alive(F) { return !F.S || F.S.gen === F.gen; }
function blit(ctx, F, pw, ph, x, y, w, h) {
  if (F.S) { F.S.used = Z.time || 0; ctx.drawImage(F.S.cv, F.ax, F.ay, pw, ph, x, y, w, h); } else ctx.drawImage(F.can, x, y, w, h);
}
function toAtlas(F, cv, pw, ph) { var a = atlasPut(cv, 0, 0, pw, ph); if (a) { F.S = a.S; F.gen = a.gen; F.ax = a.ax; F.ay = a.ay; F.can = null; cv.width = cv.height = 0; } return F; }
Z.atlasInfo = function () { return sheets.length; };
function budget(cost) { var t = Z.time || 0; if (t !== bT) { bT = t; bN = 0; } if (bN >= (Z.glOn && Z.glOn() ? pick(16, 10, 8) : pick(10, 4, 3))) return false; bN += cost; return true; }
Z.spriteBudget = budget;
// рисунок в память процессора, обрезка по краске, готовый кадр — маленький холст ровно по рисунку
function build(pw, ph, sc, dx, dy, draw) {
  if (!SC) { var c0 = document.createElement('canvas'); SC = { cv: c0, ctx: c0.getContext('2d', { willReadFrequently: true }) }; }
  if (SC.cv.width < pw || SC.cv.height < ph) { SC.cv.width = Math.max(SC.cv.width, pw); SC.cv.height = Math.max(SC.cv.height, ph); }
  var c = SC.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, pw, ph); c.setTransform(sc, 0, 0, sc, dx, dy); c.globalAlpha = 1;
  var prev = D.ctx; D.setCtx(c);
  try { draw(); } catch (e) { if (window.__rep) window.__rep(e); return { bad: true }; } finally { D.setCtx(prev); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; }
  var d, x0 = pw, y0 = ph, x1 = -1, y1 = -1;
  try { d = c.getImageData(0, 0, pw, ph).data; } catch (e) { return { bad: true }; }
  for (var y = 0; y < ph; y++) { var row = y * pw * 4 + 3; for (var x = 0; x < pw; x++) if (d[row + x * 4] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  if (x1 < 0) return { empty: true };
  var m = 2; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(pw - 1, x1 + m); y1 = Math.min(ph - 1, y1 + m);
  var w = x1 - x0 + 1, h = y1 - y0 + 1, a = atlasPut(SC.cv, x0, y0, w, h);
  if (a) return { S: a.S, gen: a.gen, ax: a.ax, ay: a.ay, x: x0, y: y0, w: w, h: h };
  var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(SC.cv, x0, y0, w, h, 0, 0, w, h);
  return { can: cv, x: x0, y: y0, w: w, h: h };
}
// key — всё, от чего зависит рисунок; (ax, ay) — точка привязки на экране, рамка w×h, в ней привязка на (ox, oy);
// draw рисует в текущий D.ctx так, как если бы рисовал на экран в точку (ax, ay). Возвращает false, если надо рисовать по-старому.
Z.sharedSprite = function (key, ax, ay, w, h, ox, oy, draw) {
  var ctx = D.ctx;
  if ((off() && !Z._crowdE) || !ctx || !ctx.getTransform) return false;
  var m = ctx.getTransform(), sc = Math.sqrt(m.a * m.a + m.b * m.b);
  if (!(sc > 0) || Math.abs(m.b) > 1e-3 || Math.abs(m.c) > 1e-3) return false;
  var pw = Math.ceil(w * sc), ph = Math.ceil(h * sc); if (pw * ph > 2.5e6 || pw < 2 || ph < 2) return false;
  var fk = key + '|' + pw + 'x' + ph, F = FR.get(fk);
  if (F && !alive(F)) { FR.delete(fk); if (F.w) frPx -= F.w * F.h; F = null; }
  if (F) { FR.delete(fk); FR.set(fk, F); }
  else {
    if (building || !budget(1) || (Z._crowdE && !crowdBudget())) return false;
    building++; try { F = build(pw, ph, sc, (ox - ax) * sc, (oy - ay) * sc, draw); } finally { building--; }
    if (F.bad) return false;
    FR.set(fk, F); if (F.w) frPx += F.w * F.h;
    while ((FR.size > maxFrames() || frPx > (Z._crowdE && off() ? CROWD_PX : maxFrPx())) && FR.size > 1) { var k0 = FR.keys().next().value, F0 = FR.get(k0); FR.delete(k0); if (F0.w) frPx -= F0.w * F0.h; }
    if (Z._ssN) { Z._ssN[key.split('|')[0]] = (Z._ssN[key.split('|')[0]] || 0) + 1; if (Z._ssK) Z._ssK.push(fk); }
  }
  if (F.empty) return true;
  // точка в точку: начало — на целой точке экрана
  var dx = Math.round((ax - ox) * m.a + m.e) + F.x, dy = Math.round((ay - oy) * m.d + m.f) + F.y;
  blit(ctx, F, F.w, F.h, (dx - m.e) / m.a, (dy - m.f) / m.d, F.w / sc, F.h / sc);
  return true;
};
Z.sharedSpriteClear = function () { FR.clear(); SCN.clear(); BBX.clear(); RS.clear(); scnPx = 0; frPx = 0; sheets.forEach(function (S) { S.gen++; S.y = 0; S.rows = []; S.used = -1; S.ctx.clearRect(0, 0, SHEET, SHEET); }); };
Z.sharedSpriteCount = function () { return FR.size + SCN.size; };
// ---------- декорации уровня: мост, гараж, логово, частокол, деревья, реликвии ----------
// Рисунок зависит от уровня, масштаба и (для качающихся) фазы анимации, но не от сдвига поля: кадр строится один раз,
// его рамка находится сама (черновой рисунок в уменьшенном масштабе в памяти процессора), затем картинка нужного
// размера ровно по рамке. При прокрутке кадр лишь переносится. draw рисует в D.ctx в экранных координатах через X/Y.
var SCN = new Map(), scnPx = 0, SB = null;
function scnMax() { return pick(48e6, 12e6, 8e6); }
var BBX = new Map();
function buildScene(draw, ox, oy, dpr, bbKey) {
  var UI = Z.ui, L = UI.L, G = Z.G, P = D.fieldPad(G.L), cs = L.cs, bb = bbKey ? BBX.get(bbKey) : null, bx, by, bw, bh, prev = D.ctx;
  if (bb) { bx = ox + bb[0]; by = oy + bb[1]; bw = bb[2]; bh = bb[3]; }
  else {
  var Rx = L.fx - (P.l + 3) * cs, Ry = L.fy - (P.t + 4) * cs, Rw = (G.L.W + P.l + P.r + 6) * cs, Rh = (G.L.H + P.t + P.b + 7) * cs;
  var q = Math.min(1, 420 / Math.max(Rw, Rh)), sw = Math.ceil(Rw * q), sh = Math.ceil(Rh * q);
  if (!SB) { var c0 = document.createElement('canvas'); SB = { cv: c0, ctx: c0.getContext('2d', { willReadFrequently: true }) }; }
  if (SB.cv.width < sw || SB.cv.height < sh) { SB.cv.width = Math.max(SB.cv.width, sw); SB.cv.height = Math.max(SB.cv.height, sh); }
  var c = SB.ctx;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, sw, sh); c.setTransform(q, 0, 0, q, -Rx * q, -Ry * q); c.globalAlpha = 1;
  D.setCtx(c); try { draw(); } catch (e) { if (window.__rep) window.__rep(e); return { bad: true }; } finally { D.setCtx(prev); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; }
  var d, x0 = sw, y0 = sh, x1 = -1, y1 = -1;
  try { d = c.getImageData(0, 0, sw, sh).data; } catch (e) { return { bad: true }; }
  for (var y = 0; y < sh; y++) { var row = y * sw * 4 + 3; for (var x = 0; x < sw; x++) if (d[row + x * 4] > 1) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  if (x1 < 0) return { empty: true };
  if (x0 <= 0 || y0 <= 0 || x1 >= sw - 1 || y1 >= sh - 1) return { bad: true };   // рисунок выходит за поле с запасом — по-старому
  var mg = 3 / q + 2; if (bbKey) mg += Math.max(cs * 0.25, 0.08 * Math.max(x1 - x0, y1 - y0) / q);   // рамка на все фазы качания — с запасом
  bx = Rx + x0 / q - mg; by = Ry + y0 / q - mg; bw = (x1 - x0 + 1) / q + mg * 2; bh = (y1 - y0 + 1) / q + mg * 2;
  if (bbKey) { BBX.set(bbKey, [bx - ox, by - oy, bw, bh]); if (BBX.size > 400) BBX.delete(BBX.keys().next().value); }
  }
  var W = Math.ceil(bw * dpr), H = Math.ceil(bh * dpr); if (W * H > 4e6) return { bad: true };
  var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  var oc = cv.getContext('2d'); oc.setTransform(dpr, 0, 0, dpr, -bx * dpr, -by * dpr);
  D.setCtx(oc); try { draw(); } catch (e2) { if (window.__rep) window.__rep(e2); return { bad: true }; } finally { D.setCtx(prev); }
  return toAtlas({ can: cv, rx: bx - ox, ry: by - oy, w: W, h: H }, cv, W, H);
}
Z.sceneSprite = function (key, draw, bbKey) {
  var ctx = D.ctx, UI = Z.ui, L = UI && UI.L;
  if (off() || !ctx || !ctx.getTransform || !L || !Z.G || UI.screen !== 'level' || zooming(L.cs)) { draw(); return; }
  var m = ctx.getTransform(), dpr = m.a;
  if (!(dpr > 0) || Math.abs(m.b) > 1e-4 || Math.abs(m.c) > 1e-4 || Math.abs(m.d - m.a) > 1e-4) { draw(); return; }
  var ox = L.fx, oy = L.fy, fk = key + '|' + L.cs.toFixed(2) + '|' + dpr.toFixed(3) + '|' + Z.G.idx, F = SCN.get(fk);
  if (F && !F.bad && !F.empty && !alive(F)) { SCN.delete(fk); if (F.w) scnPx -= F.w * F.h; F = null; }
  if (F) { SCN.delete(fk); SCN.set(fk, F); }
  else {
    var bk = bbKey ? bbKey + '|' + L.cs.toFixed(2) + '|' + Z.G.idx : null;
    if (building || !budget(bk && BBX.has(bk) ? 1 : 3)) { draw(); return; }   // с известной рамкой построение дешёвое
    building++; try { F = buildScene(draw, ox, oy, dpr, bk); } finally { building--; }
    SCN.set(fk, F); if (F.w) scnPx += F.w * F.h;
    if (Z._ssN) Z._ssN['sc:' + key.split('|')[0]] = (Z._ssN['sc:' + key.split('|')[0]] || 0) + 1;
    while (scnPx > scnMax() && SCN.size > 1) { var k0 = SCN.keys().next().value, F0 = SCN.get(k0); SCN.delete(k0); if (F0.w) scnPx -= F0.w * F0.h; }
  }
  if (F.bad) { if (Z._scnBad) Z._scnBad[key] = 1; draw(); return; }
  if (F.empty) return;
  var dx = Math.round((ox + F.rx) * m.a + m.e), dy = Math.round((oy + F.ry) * m.d + m.f);
  blit(ctx, F, F.w, F.h, (dx - m.e) / m.a, (dy - m.f) / m.d, F.w / dpr, F.h / dpr);
};
// то же для качающихся: время t делится на n фаз по кругу loop секунд, drawAt(tq) рисует момент tq (Z.time на это время = tq)
Z.sceneAnim = function (key, t, loop, n, drawAt) {
  // большая картинка (камыши на всё поле) — фаз меньше, чтобы набор кадров умещался в память
  var L = Z.ui && Z.ui.L, bb = L && Z.G ? BBX.get(key + '|' + L.cs.toFixed(2) + '|' + Z.G.idx) : null;
  if (bb) { var px = bb[2] * bb[3] * (Z.DPR || 1) * (Z.DPR || 1), cap = Math.floor(scnMax() * 0.45 / Math.max(1, px)); if (cap < n) n = cap < 8 ? 1 : cap; }   // совсем большая — без качания (одна картинка), чем дёргаться раз в секунду
  var b = Math.floor((((t % loop) + loop) % loop) / loop * n) % n, tq = (b + 0.5) / n * loop;
  Z.sceneSprite(key + '|' + n + '|' + b, function () { var sv = Z.time; Z.time = tq; try { drawAt(tq); } finally { Z.time = sv; } }, key);
};
// количество фаз для декораций: компьютер — чаще, слабый телефон — реже
Z.scenePhases = function (a, b, c) { return pick(a, b, c); };
// во время смены масштаба (щипок) размер клетки меняется каждый кадр — общие кадры не строим (каждый был бы на один кадр)
function zooming(cs) { var t = Z.time || 0; if (Math.abs(cs - lastCs) > 1e-6) { zoomT = t; lastCs = cs; } return t - zoomT < 0.25; }
// ---------- враги ----------
var SKIP_T = { hutE: 1, lairB: 1, lairT: 1, lairW: 1, cannon: 1, van: 1, gorynych: 1 };
function phases() { return pick(24, 16, 10); }
function special(e) {
  return !!(SKIP_T[e.type] || e.boss || e.dying > 0 || e.corpse !== undefined || (e.size || 1) >= 1.7 || e.emT > 0 || e.enterT > 0 || e.garT > 0 || e.hideT > 0 || e.doorIn > 0
    || e.talk || e.kb > 0 || e.ball > 0 || e.building || e.headsLost || e.headSt || e.dv || e.ys || e.ysg || e.neutral || e.cbPath || e.siege || e.carry || e.chained || e.point);
}
// полоска здоровья — как в D.enemy (draw.js), поверх готового кадра
function enemyBar(e, x, y, cs, t) {
  var ctx = D.ctx, R = cs * 0.31 * (e.size || 1);
  var hop = e.air ? Math.sin(t * 2 + (e.ph || 0)) * R * 0.15 : Math.abs(Math.sin(e.walk || 0)) * R * (e.vehicle ? 0.05 : 0.18);
  var bw = R * 1.8, bh = Math.max(3, R * 0.16), bx = x - bw / 2, tb = Z.enemyBarTop ? Z.enemyBarTop(e, cs) : null, by = tb != null ? y - tb - bh - hop : y - R * (e.air ? 4.2 : 2.3) - hop;
  var ol = D.OL || '#1b2448', fc = e.vehicle ? '#ffb347' : '#ff5a5f';
  // 2.13: в пачке WebGL2 (v32gl) — прямоугольниками; рамка со скруглением 2 — крест из двух прямоугольников
  if (Z.glRect && Z.glRect(ctx, bx, by - 1, bw, bh + 2, ol)) { Z.glRect(ctx, bx - 1, by, bw + 2, bh, ol); Z.glRect(ctx, bx, by, bw * Math.max(0, e.hp / e.max), bh, fc); return; }
  ctx.fillStyle = ol; D.rr(bx - 1, by - 1, bw + 2, bh + 2, 2); ctx.fill();
  ctx.fillStyle = fc; ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.max), bh);
}
var cosT = -1, cosS = '';
function cosSig() { if (cosT !== Z.time) { cosT = Z.time; cosS = (Z.save && Z.save.cos && JSON.stringify(Z.save.cos)) || ''; } return cosS; }
// 2.12.52: «толпа» — кэши выключены (2.12.12), но когда на поле много врагов, каждый рисовался живьём (~40 штрихов),
// и при 70+ врагах телефон не успевал. Теперь при толпе (от 24 живых врагов, выход ниже 16) враги берут готовые кадры по
// типу и фазе шага. Пока пальцы на экране и 0,25 с после смены масштаба — всегда живьём (как раз там лагали старые кэши);
// новых кадров строится не больше 3 за кадр, память кадров — не больше ~32 МБ. Включено, пока идёт сравнение, только в
// тестовой «быстрой» версии (window.__FAST); после проверки — для всех.
var CROWD_PX = 8e6, crowdOn = false, crowdT = -1, cbT = -1, cbN = 0;
function crowdBudget() { var t = Z.time || 0; if (t !== cbT) { cbT = t; cbN = 0; } if (cbN >= (Z.glOn && Z.glOn() ? 8 : 3)) return false; cbN++; return true; }
function crowd() {
  if (!Z.fastDraw()) return false;
  var t = Z.time || 0, G = Z.G;
  if (t !== crowdT) { crowdT = t; var n = 0; if (G && G.enemies) for (var i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) n++; crowdOn = crowdOn ? n >= 16 : n >= 24; }
  return crowdOn && !(Z.ui && Z.ui.pinch);
}
Z.crowdMode = function () { return crowd(); };
Z.enemySprite = function (e, ex, ey, cs) {
  var G = Z.G, cr = off() && crowd(); if ((off() && !cr) || !G || !Z.ui || Z.ui.screen !== 'level' || special(e) || zooming(cs)) return false;
  var N = cr ? 12 : phases(), tau = Math.PI * 2, wk = ((e.walk || 0) % tau + tau) % tau, b = Math.floor(wk / tau * N) % N, phi = (b + 0.5) / N * tau;
  var fl = e.hitT > 0 ? 1 : 0, lb = e.lunge > 0.1 ? 2 : e.lunge > 0 ? 1 : 0;
  if (cr) { fl = 0; lb = 0; }   // в толпе вспышка попадания и выпад не дают своих кадров: иначе кадров в разы больше, а при 30+ врагах их и не разглядеть
  var key = ['en', e.type, (e.dir || 1) > 0 ? 1 : -1, Math.round((e.size || 1) * 20), Math.round(cs * 4), b, fl, lb, e.slow > 0 || G.blizT > 0 || G.adBliz ? 1 : 0, e.elite ? 1 : 0, e.iced ? 1 : 0,
    e.stunT > 0 || e.stun > 0 ? 1 : 0, e.shield > 0 ? 1 : 0, e.armor || 0, e.wmod || '', e.enraged ? 1 : 0, e.hareSack ? 1 : 0, e.whistle > 0 ? 1 : 0, e.snore ? 1 : 0, e.sledV === undefined ? '' : e.sledV,
    G.night ? 1 : 0, Z.LANG, cosSig()].join('|');
  var esz = e.size || 1, ew = cs * 2.6 * esz, eh = cs * 3.0 * esz, ctx = D.ctx;
  var sl = e._sl, rot = G.L && G.L.mtn && sl && !e.air && Math.abs(sl) >= 0.12 ? Math.max(-1, Math.min(1, sl)) * (sl > 0 ? 0.22 : 0.16) * (e.dir || 1) : 0;
  if (rot) { ctx.save(); ctx.translate(ex, ey); ctx.rotate(rot); ctx.translate(-ex, -ey); }
  var ok;
  try {
    Z._crowdE = cr;
    ok = Z.sharedSprite(key, ex, ey, ew, eh, ew / 2, eh * 0.8, function () {
      // кадр — для «типового» врага этой фазы: шаг, время и случайная фаза заданы, здоровье полное (полоска — отдельно)
      var sv = { walk: e.walk, ph: e.ph, hitT: e.hitT, lunge: e.lunge, hp: e.hp, _sl: e._sl, time: Z.time };
      e.walk = phi; e.ph = 0; e.hitT = fl ? 0.08 : 0; e.lunge = lb === 2 ? 0.16 : lb ? 0.05 : 0; e.hp = e.max; e._sl = 0; Z.time = phi / 2;
      try { D.enemy(e, ex, ey, cs, Z.time); } finally { e.walk = sv.walk; e.ph = sv.ph; e.hitT = sv.hitT; e.lunge = sv.lunge; e.hp = sv.hp; e._sl = sv._sl; Z.time = sv.time; }
    });
  } finally { Z._crowdE = false; if (rot) ctx.restore(); }
  if (!ok) { D.enemy(e, ex, ey, cs, Z.time); return true; }   // кадра ещё нет (лимит построений) — в этот кадр напрямую
  if (e.hp < e.max && !Z.promoClean) enemyBar(e, ex, ey, cs, Z.time);
  return true;
};
// ---------- вышки ----------
// Кадр: тип, уровень, ветка, облик, здоровье, угол прицела (24 деления) и, для вышек 5-го уровня, фаза свечения.
// Стоящая вышка не перерисовывается вовсе; поворачивающаяся берёт готовые кадры по углу.
Z.towerSprite = function (tw, tx0, ty0, cs, onSt, padDraw) {
  var G = Z.G; if (off() || !G || !Z.ui || Z.ui.screen !== 'level' || zooming(cs) || tw.build > 0 || tw.pop > 0 || tw.hitT > 0) return false;
  var glm = Z.glOn && Z.glOn();
  if (!glm && (tw.recoil > 0.02 || tw.firing)) return false;   // стреляющая вышка — по-старому (вспышка, отдача и стволы меняются слишком часто для общих кадров)
  // 2.13: в пачке WebGL2 кадры дешёвые — и у стреляющей вышки: отдача 5 ступенями, вспышка ствола — отдельный кадр
  var rb = glm ? Math.round(Math.min(1, Math.max(0, (tw.recoil || 0) / 0.12)) * 4) : 0, fl = glm && tw.firing && Math.sin(Z.time * 60) > 0 ? 1 : 0;
  var NA = 32, tau = Math.PI * 2, a = ((tw.ang || 0) % tau + tau) % tau, ab = Math.floor(a / tau * NA) % NA, ang = (ab + 0.5) / NA * tau;
  var NS = 16, sb = tw.spin ? Math.floor(((tw.spin % tau) + tau) % tau / tau * NS) % NS : 0, spin = tw.spin ? (sb + 0.5) / NS * tau : 0;   // стволы пулемёта: 16 положений по кругу
  var gN = tw.lvl >= 5 ? 6 : 1, gb = gN > 1 ? Math.floor(((Z.time * 4) % tau + tau) % tau / tau * gN) % gN : 0, gt = gN > 1 ? (gb + 0.5) / gN * tau / 4 : 7.1;
  var key = ['tw', tw.type, tw.lvl, tw.branch || '', Math.round((tw.hp || 1) / (tw.max || 1) * 10), cs.toFixed(1), (Z.save.skins && Z.save.skins.twT && Z.save.skins.twT[tw.type]) || '', onSt ? 1 : 0, cosSig(), ab, gb,
    tw.stun > 0 ? 1 : 0, sb, rb, fl].join('|');
  var ok = Z.sharedSprite(key, tx0, ty0, cs * 1.8, cs * 2.3, cs * 0.9, cs * 1.9, function () {
    var sv = { ang: tw.ang, recoil: tw.recoil, spin: tw.spin, firing: tw.firing, time: Z.time };
    // вспышка ствола видна, когда sin(60·t) > 0: время кадра сдвигается не больше чем на 0,1 с
    var ft = fl ? gt + ((((Math.PI / 2 - gt * 60) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / 60 : gt;
    tw.ang = ang; tw.recoil = rb / 4 * 0.12; tw.firing = !!fl; if (tw.spin) tw.spin = spin; Z.time = ft;
    try { padDraw(D.ctx); D.tower(tw, tx0, ty0, cs * 1.18, Z.time); } finally { tw.ang = sv.ang; tw.recoil = sv.recoil; tw.spin = sv.spin; tw.firing = sv.firing; Z.time = sv.time; }
  });
  if (!ok) { padDraw(D.ctx); D.tower(tw, tx0, ty0, cs * 1.18, Z.time); }   // кадра ещё нет — в этот кадр напрямую
  return true;
};
// ---------- кусты: раньше каждый куст перерисовывался 3 раза в секунду; теперь кадры по фазе качания, один раз ----------
var oBush = D.bush;
D.bush = function (x, y, cs, t, sway, seed) {
  var G = Z.G, self = this, args = arguments;
  if (off() || Math.abs(sway || 0) > 0.01 || !G || !Z.ui || Z.ui.screen !== 'level' || zooming(cs)) return oBush.apply(self, args);
  var loop = Math.PI * 4, n = pick(24, 16, 10), b = Math.floor((((t % loop) + loop) % loop) / loop * n) % n, tq = (b + 0.5) / n * loop;
  var key = ['bush', G.info ? G.info.region : 0, G.idx, seed || 0, Math.round(cs * 4), b].join('|');
  if (!Z.sharedSprite(key, x, y, cs * 1.7, cs * 1.7, cs * 0.85, cs * 1.25, function () { var sv = Z.time; Z.time = tq; Z._noPos = true; try { oBush.call(self, x, y, cs, tq, sway, seed); } finally { Z.time = sv; Z._noPos = false; } })) oBush.apply(self, args);
};
// ---------- огоньки на ёлке: каждый — готовой картинкой (вместо 4 заливок на огонёк каждый кадр) ----------
Z.treeLight = function (px, py, h, cc, bright) {
  if (cc.charAt(0) === 'h') { var hm = /hsl\((\d+)/.exec(cc); if (hm) cc = 'hsl(' + Math.round(+hm[1] / 12) * 12 + ',95%,62%)'; }   // радуга: оттенок с шагом 12°, иначе каждый кадр новая картинка
  var r = h * 0.04, key = ['lt', cc, Math.round(h), bright ? 1 : 0].join('|');
  return Z.sharedSprite(key, px, py, r * 2.2, r * 2.2, r * 1.1, r * 1.1, function () {
    var ctx = D.ctx; ctx.globalAlpha = bright ? 0.55 : 0.35; D.circ(px, py, h * 0.032, cc); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.ellipse(px, py, h * 0.011, h * 0.015, 0, 0, 7); ctx.fillStyle = cc; ctx.fill(); ctx.lineWidth = Math.max(0.6, Math.max(1.5, h * 0.025) * 0.18); ctx.strokeStyle = 'rgba(27,36,72,0.8)'; ctx.stroke();
    D.circ(px - h * 0.004, py - h * 0.005, h * 0.004, 'rgba(255,255,255,0.85)');
  });
};
// ---------- сани: ход, снег из-под полозьев и возница — общими кадрами по фазе (раньше ~150 штрихов каждый кадр) ----------
Z.sleighSprite = function (x, y, cs, dir, t, hit) {
  if (off() || hit > 0 || !Z.G || !Z.ui || Z.ui.screen !== 'level' || zooming(cs)) return false;
  var run = !!t, loop = run ? Math.PI * 2 / 9 * 3 : Math.PI * 4, n = run ? pick(48, 32, 20) : pick(40, 28, 18), tt = run ? t : (Z.time || 0);
  var b = Math.floor((((tt % loop) + loop) % loop) / loop * n) % n, tq = (b + 0.5) / n * loop;
  var key = ['sl', dir, run ? 1 : 0, D.sleighAir ? 1 : 0, D.noRider ? 'n' : (D.sleighRider || 'sneg'), Math.round(cs * 4), b, cosSig()].join('|');
  var R = cs * 0.55;
  return Z.sharedSprite(key, x, y, R * 6, R * 4.4, R * 3, R * 3.6, function () { var sv = Z.time; Z.time = tq; try { D.sleigh(x, y, cs, dir, run ? tq : 0, 0); } finally { Z.time = sv; } });
};
// ---------- точка (снежинка, искра) — готовой картинкой ----------
Z.dotSprite = function (x, y, r, col) {
  var rq = Math.round(r * 4) / 4; if (!(rq > 0)) return false;
  return Z.sharedSprite('dot|' + rq + '|' + col, x, y, rq * 2 + 2, rq * 2 + 2, rq + 1, rq + 1, function () { var c = D.ctx; c.fillStyle = col; c.beginPath(); c.arc(x, y, rq, 0, Math.PI * 2); c.fill(); });
};
// ---------- картинка под поворотом: рисуется в масштабе текущего преобразования и ставится как есть (поворот, наклон — у холста) ----------
var RS = new Map();
Z.rotSprite = function (key, x, y, w, h, ox, oy, draw) {
  var ctx = D.ctx; if (off() || !ctx || !ctx.getTransform) return false;
  var m = ctx.getTransform(), sc = Math.sqrt(m.a * m.a + m.b * m.b); if (!(sc > 0)) return false;
  var pw = Math.ceil(w * sc) + 2, ph = Math.ceil(h * sc) + 2; if (pw * ph > 1e6 || pw < 3 || ph < 3) return false;
  var fk = key + '|' + Math.round(sc * 12), F = RS.get(fk);
  if (F && !alive(F)) { RS.delete(fk); F = null; }
  if (F) { RS.delete(fk); RS.set(fk, F); }
  else {
    var cv = document.createElement('canvas'); cv.width = pw; cv.height = ph;
    var oc = cv.getContext('2d'); oc.setTransform(sc, 0, 0, sc, (ox - x) * sc + 1, (oy - y) * sc + 1);
    var prev = D.ctx; D.setCtx(oc); building++; try { draw(); } catch (e) { return false; } finally { building--; D.setCtx(prev); }
    F = toAtlas({ can: cv }, cv, pw, ph); RS.set(fk, F); if (RS.size > 600) RS.delete(RS.keys().next().value);
    if (Z._ssN) { Z._ssN['rs:' + key.split('|')[0]] = (Z._ssN['rs:' + key.split('|')[0]] || 0) + 1; if (Z._ssK) Z._ssK.push(fk); }
  }
  blit(ctx, F, pw, ph, x - ox - 1 / sc, y - oy - 1 / sc, pw / sc, ph / sc);
  return true;
};
Z.sparkSprite = function (x, y, r) {
  var rq = Math.max(0.5, Math.round(r * 2) / 2);
  return Z.sharedSprite('spk|' + rq, x, y, rq * 4.4 + 2, rq * 4.4 + 2, rq * 2.2 + 1, rq * 2.2 + 1, function () {
    var c = D.ctx; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x, y - rq * 2.2); c.lineTo(x + rq * 0.4, y - rq * 0.4); c.lineTo(x + rq * 2.2, y); c.lineTo(x + rq * 0.4, y + rq * 0.4); c.lineTo(x, y + rq * 2.2); c.lineTo(x - rq * 0.4, y + rq * 0.4); c.lineTo(x - rq * 2.2, y); c.lineTo(x - rq * 0.4, y - rq * 0.4); c.closePath(); c.fill();
  });
};
// ---------- снежинка (12 штрихов) — готовой картинкой; внутри героев и эффектов их десятки за кадр ----------
var oFlake = D.flake;
D.flake = function (x, y, r, col, w) {
  if (building || off() || !(r > 1) || typeof col !== 'string') return oFlake.apply(this, arguments);
  var rq = Math.round(r * 2) / 2, wq = Math.max(0.5, Math.round((w || 1) * 4) / 4), self = this, args = arguments;
  if (!Z.sharedSprite('flk|' + rq + '|' + col + '|' + wq, x, y, rq * 2 + wq * 2 + 2, rq * 2 + wq * 2 + 2, rq + wq + 1, rq + wq + 1, function () { oFlake.call(D, x, y, rq, col, wq); })) oFlake.apply(self, args);
};
// ---------- лягушки: готовыми картинками по позе (прыжок и «пых» — 8 ступеней), «z» спящей — живьём ----------
var oFrog = D.frog;
if (oFrog) D.frog = function (x, y, s, o) {
  o = o || {}; var self = this, args = arguments;
  if (off() || building || !Z.G || !Z.ui || Z.ui.screen !== 'level') return oFrog.apply(self, args);
  var jq = Math.round((o.jump || 0) * 8) / 8, pq = Math.round((o.puff || 0) * 8) / 8, key = ['frog', o.dir || 1, jq, pq, o.sleep ? 1 : 0, o.noPad ? 1 : 0, Math.round(s * 4)].join('|');
  var ok = Z.sharedSprite(key, x, y, s * 2.6, s * 3.2, s * 1.3, s * 2.4, function () { Z._noZ = true; try { oFrog.call(self, x, y, s, { dir: o.dir, jump: jq, puff: pq, sleep: o.sleep, noPad: o.noPad }); } finally { Z._noZ = false; } });
  if (!ok) return oFrog.apply(self, args);
  if (o.sleep) { var c = D.ctx, zt = (Z.time || 0) % 2; c.globalAlpha = 1 - zt / 2; D.text('z', x + s * 0.5, y - s * (0.7 + zt * 0.4), s * 0.3, '#dff4ff', 'center', 'middle', 2); c.globalAlpha = 1; }
};
// при смене уровня, облика, языка — кадры заново
var oGo = Z.ui && Z.ui.goLevel;
if (oGo) Z.ui.goLevel = function () { Z.sharedSpriteClear(); return oGo.apply(this, arguments); };
})();
