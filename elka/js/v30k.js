/* 2.11.5 · оптимизация отрисовки.
   В бою кадр рисовал ~2700 заливок и обводок, из них около половины — то, что почти не меняется:
   крепость с большой ёлкой, стена с городом, значки навыков и превью волны. Теперь:
   - крепость и стена рисуются в отдельную картинку и обновляются 12 раз в секунду (огоньки и флажки живые),
     при ударе по ёлке, празднике и победе — каждый кадр, как раньше;
   - значки навыков и врагов в превью волны рисуются один раз и дальше берутся готовыми. */
(function () {
'use strict';
var Z = window.Z, D = Z.D;
var FPS = 12, caches = {};
function mainCtx() { return D.ctx; }
function cachedDraw(key, sig, bx, by, bw, bh, draw, fps) {
  var ctx = mainCtx(), dpr = Z.DPR || 1, now = Z.time || 0, C = caches[key];
  bw = Math.ceil(bw); bh = Math.ceil(bh);
  if (bw <= 0 || bh <= 0 || bw * bh * dpr * dpr > 9e6) { draw(); return; }
  // 2.11.8: картинка не зависит от места на экране — при прокрутке поля её только переносят (раньше при сдвиге поля
  // она каждый кадр рисовалась заново: ёлка, вышки, база — и прокрутка шла рывками)
  var rx = Math.round(bx * dpr) / dpr, ry = Math.round(by * dpr) / dpr;   // начало — на целой точке экрана
  var full = sig + '|' + bw + 'x' + bh + '|' + dpr;
  if (!C) C = caches[key] = { can: document.createElement('canvas'), sig: '', t: -9 };
  if (C.sig !== full || now - C.t >= 1 / (fps || FPS) || now < C.t) {
    var cv = C.can, W = Math.ceil(bw * dpr), H = Math.ceil(bh * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var oc = cv.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, W, H);
    oc.setTransform(dpr, 0, 0, dpr, -rx * dpr, -ry * dpr);
    var prev = D.ctx; D.setCtx(oc);
    try { draw(); } finally { D.setCtx(prev); }
    C.sig = full; C.t = now;
  }
  ctx.drawImage(C.can, rx, ry, C.can.width / dpr, C.can.height / dpr);   // точка в точку, без пересчёта пикселей
}
Z.cachedDraw = cachedDraw;
// 2.11.7: тяжёлые живые рисунки (ёлка в крепости, стена с городом) — несколько готовых кадров по кругу.
// Каждый кадр рисуется один раз (момент анимации k·loop/n), дальше кадры только сменяются: огоньки мигают как прежде,
// но перерисовок (а с ними и подёргиваний на телефонах) больше нет. Новый набор — только при смене вида (урон, тема, масштаб, сдвиг).
var frames = {}, cosT = -1, cosS = '';
function cosSig() { if (cosT !== Z.time) { cosT = Z.time; cosS = (Z.save && Z.save.cos && JSON.stringify(Z.save.cos)) || ''; } return cosS; }
function framedDraw(key, sig, bx, by, bw, bh, drawAt, n, loop, liveIfBig) {
  var ctx = mainCtx(), dpr = Z.DPR || 1, now = Z.time || 0;
  bw = Math.ceil(bw); bh = Math.ceil(bh);
  if (bw <= 0 || bh <= 0 || bw * bh * dpr * dpr > 9e6) { drawAt(now); return; }
  var rx = Math.round(bx * dpr) / dpr, ry = Math.round(by * dpr) / dpr, W = Math.ceil(bw * dpr), H = Math.ceil(bh * dpr);
  // 2.12.4: набор кадров — не больше бюджета точек (при приближении стена в 12 кадрах занимала ~70 МБ, телефон перезаливал
  // их в видеопамять каждый кадр); в бюджет не влезает — кадров меньше, вплоть до одной неподвижной картинки
  var cap = Math.floor(pick(40e6, 6e6, 4e6) / Math.max(1, W * H)); if (cap < n) { if (cap < 4 && liveIfBig) { drawAt(now); return; } n = cap < 4 ? 1 : cap; }
  var full = sig + '|' + bw + 'x' + bh + '|' + dpr + '|' + n, F = frames[key];   // без места на экране: при прокрутке кадры те же
  if (!F) F = frames[key] = { sig: '', cans: [], ok: [] };
  if (F.sig !== full) { F.sig = full; F.ok = []; }
  var k = Math.floor((((now % loop) + loop) % loop) / loop * n) % n;
  if (!F.ok[k]) {
    var cv = F.cans[k] || (F.cans[k] = document.createElement('canvas'));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var oc = cv.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, W, H);
    oc.setTransform(dpr, 0, 0, dpr, -rx * dpr, -ry * dpr);
    var prev = D.ctx; D.setCtx(oc);
    try { drawAt(k * loop / n); } finally { D.setCtx(prev); }
    F.ok[k] = true; if (Z._fdN) Z._fdN[key] = (Z._fdN[key] || 0) + 1;
  }
  ctx.drawImage(F.cans[k], rx, ry, W / dpr, H / dpr);
}
Z.framedDraw = framedDraw;
function off() { return Z.cachesOff(); }
// 2.11.5: «лёгкий» режим — телефон или слабое устройство: живые картинки обновляются реже (на маленьком экране разница не видна)
Z.perfLite = function () { return false; };   // 2.12.12: упрощений для телефонов больше нет
// уровень экономии: 0 — компьютер, 1 — телефон, 2 — телефон, который и после снижения разрешения не успевает (Z.lowGfx)
Z.perfLevel = function () { return 0; };
function pick(a, b, c) { var l = Z.perfLevel(); return l >= 2 ? c : l >= 1 ? b : a; }
Z.perfPick = pick;
// ---------- стена и город ----------
// 2.12.52: «быстрая отрисовка» (Z.fastDraw, пока только тестовая версия): стена, крепость и герои снова готовыми кадрами,
// но пока пальцы на экране и 0,3 с после смены масштаба — живьём (старые кэши лагали именно при приближении).
var fzT = -9, fzCs = 0;
function fastOK() {
  if (!(Z.fastDraw && Z.fastDraw()) || !Z.ui || !Z.ui.L) return false;
  var t = Z.time || 0, cs = Z.ui.L.cs;
  if (Z.ui.pinch) { fzT = t; return false; }
  if (Math.abs(cs - fzCs) > 1e-6) { fzCs = cs; fzT = t; }
  return t - fzT >= 0.3;
}
function noCache() { return off() && !fastOK(); }
var oWall = D.greatWall;
D.greatWall = function (G, X, Y, cs, t, hpFrac, part) {
  var self = this, args = arguments;
  var wn = Z._wallN != null ? Z._wallN : off() ? 12 : pick(0, 12, 4);   // 2.11.9: компьютер — живьём; телефон — 12 готовых кадров за 2 с (гирлянды мигают ровно), слабый — 4
  if (noCache() || !wn || !G || !G.L || G !== Z.G || Z.ui.screen !== 'level') return oWall.apply(self, args);
  var L = G.L, P = D.fieldPad(L), x0 = X(-P.l) - 2, x1 = X(L.W + P.r) + 2, y1 = part === 'town' ? Y(L.H - 0.5) : Y(L.H + P.b) + 2, y0 = Y(L.H - (part === 'town' ? 2.5 : 3.2));   // крыши города — лишь полоска над стеной (раньше картинка была в 6 рядов высотой и почти вся прозрачная)
  var st = hpFrac > 0.75 ? 0 : hpFrac > 0.5 ? 1 : hpFrac > 0.25 ? 2 : 3;
  framedDraw('wall_' + (part || 'all'), [G.idx, cs.toFixed(2), st, D.fortTheme ? D.fortTheme() : '', Z.LANG].join('|'), x0, y0, x1 - x0, y1 - y0, function (tq) { var a = [].slice.call(args); a[4] = tq; oWall.apply(self, a); }, wn, 2);   // 2.11.7: 4 готовых кадра (гирлянды, дым) по кругу за 2 с
};
// ---------- крепость с большой ёлкой ----------
var oFort = D.fortress;
// крепость сейчас рисуется готовой картинкой? (тогда полупрозрачность — прямо при переносе, без слоя)
Z.fortCached = function (G) { return !(noCache() || !G || Z.ui.screen !== 'level' || G.phase === 'won' || G.phase === 'lost'); };   // 2.12: праздник и удар — тоже из готовой ёлки (живой слой рисует их сам)
D.fortress = function (x, y, cs, hpFrac, hit, t) {
  var self = this, args = arguments, G = Z.G;
  if (G) { if (G._tph === 'wave' && G.phase !== 'wave') G._tcel = t; G._tph = G.phase; }   // конец волны отмечаем здесь, по настоящему времени (готовые кадры рисуются с другим)
  var cel = G && G._tcel != null ? t - G._tcel : null;
  if (noCache() || !G || Z.ui.screen !== 'level' || G.phase === 'won' || G.phase === 'lost') return oFort.apply(self, args);
  var celB = cel !== null && cel < 2.5 ? 1 : 0;   // 2.12: праздник после волны — свечение ярче (в картинке), огоньки и звезда — в живом слое; удар — дрожание картинки
  var shx = hit > 0 ? Math.sin(hit * 60) * cs * 0.06 : 0;
  // 2.11.7: ёлка — несколько готовых кадров (огоньки) по кругу; удар — дрожанием готовой картинки, без перерисовки
  var st = hpFrac > 0.75 ? 0 : hpFrac > 0.5 ? 1 : hpFrac > 0.25 ? 2 : 3, mc = mainCtx();
  if (shx) { mc.save(); mc.translate(shx, 0); }
  try {
    // 2.11.9: ёлка — одна готовая картинка (огоньки погашены) + каждый кадр только то, что движется: огоньки, игрушки, звезда.
    // Так анимация плавная на полной частоте, а дорогая ёлка (тысячи штрихов) рисуется один раз.
    var sig = [G.idx, cs.toFixed(2), st, hpFrac < 0.3 ? 1 : 0, D.fortTheme ? D.fortTheme() : '', cosSig(), celB].join('|');
    var at = function (tq, hh) { var a = [].slice.call(args); a[4] = hh || 0; a[5] = tq; oFort.apply(self, a); };
    Z._fortPart = 'tree'; Z._treeLayer = 'base';
    framedDraw('fortT', sig, x - cs * 3, y - cs * 5.6, cs * 6, cs * 5.9, function () { var tc = G._tcel; G._tcel = celB ? 0 : null; try { at(0); } finally { G._tcel = tc; } }, 1, 1);   // картинка при t=0: праздник — как cel=0
    Z._treeLayer = 'live'; at(t, hit);
    Z._fortPart = 'front'; Z._treeLayer = null;
    var fn = Z._fortFrontN != null ? Z._fortFrontN : off() ? 12 : pick(0, 24, 8);   // стены, флажки, фонари: компьютер — живьём, телефон — 24 готовых кадра за 2 с (картинка маленькая)
    var sigF = sig.slice(0, sig.length - 2);   // стены не зависят от праздника
    if (fn) framedDraw('fortF', sigF, x - cs * 2.1, y - cs * 3.4, cs * 4.2, cs * 3.8, function (tq) { at(tq); }, fn, 2, true); else at(t);   // при сильном приближении — живьём (кадры слишком велики)
  } finally { Z._fortPart = ''; Z._treeLayer = null; if (shx) mc.restore(); }
};
// ---------- ориентиры на карте мира: 10 раз в секунду ----------
var oLm = Z.mapLm;
if (oLm) Z.mapLm = function (idx, x, y, cs, t) {
  var self = this, args = arguments; if (off()) return oLm.apply(self, args);
  cachedDraw('lm' + idx, cs.toFixed(2), x - cs * 1.9, y - cs * 2.9, cs * 3.8, cs * 3.4, function () { oLm.apply(self, args); });
};
// ---------- герои в бою: картинка героя обновляется 15 раз в секунду (движение по полю и покачивание — каждый кадр) ----------
// Удар, луч и первые кадры после смены направления рисуются напрямую — там важна каждая фаза.
Z.heroSprite = function (H, R, o, draw) {
  var ctx = mainCtx();
  if (noCache() || !H || !ctx.getTransform) return draw();
  if (off() && (o.atk || (o.beam !== undefined && o.beam >= 0))) return draw();   // быстрая отрисовка: удар и луч — живьём
  if (o.atk || (o.beam !== undefined && o.beam >= 0)) {
    // 2.12: удар и луч — общими кадрами по фазе (12 ступеней), под поворотом и наклоном героя (раньше — живьём, ~150 штрихов за кадр)
    if (!Z.rotSprite) return draw();
    var aq = o.atk ? Math.round(Math.max(0, Math.min(1, o.atkP)) * 8) / 8 : -1, bq = o.beam !== undefined && o.beam >= 0 ? Math.round(o.beam * 8) / 8 : -1, baq = o.beamA !== undefined ? Math.round(o.beamA * 12) / 12 : 0;
    var k2 = ['hero', H.type, o.dir, o.walk ? 1 : 0, aq, bq, baq, Math.round(R * 4), (Z.save && Z.save.skins && JSON.stringify(Z.save.skins.on)) || '', Z.LANG].join('|');
    var S2 = Math.ceil(R * 7), sv = { atkP: o.atkP, beam: o.beam, beamA: o.beamA, time: Z.time };
    var ok = Z.rotSprite(k2, 0, 0, S2, S2, S2 / 2, S2 * 0.72, function () { o.atkP = aq; if (bq >= 0) o.beam = bq; o.beamA = baq; Z.time = 7.1; try { draw(); } finally { o.atkP = sv.atkP; o.beam = sv.beam; o.beamA = sv.beamA; Z.time = sv.time; } });
    if (!ok) draw();
    return;
  }
  var m = ctx.getTransform(), sc = Math.sqrt(m.a * m.a + m.b * m.b), now = Z.time || 0;
  if (!(sc > 0) || Math.abs(m.b) > 1e-3) return draw();
  var S = Math.ceil(R * 7), ox = S / 2, oy = S * 0.72, px = Math.ceil(S * sc);
  if (px * px > 4e6) return draw();
  var sig = [H.type, o.dir, o.walk ? 1 : 0, Math.round(R * 4), Math.round(sc * 100), (Z.save && Z.save.skins && JSON.stringify(Z.save.skins.on)) || ''].join('|');
  var C = H._spr; if (!C) { try { Object.defineProperty(H, '_spr', { value: { can: document.createElement('canvas'), sig: '', t: -9 }, writable: true, enumerable: false }); } catch (e) { return draw(); } C = H._spr; }
  var hfps = o.walk ? pick(20, 15, 10) : pick(15, 6, 4);   // 2.12: шаг героя на телефоне — 15 кадров в секунду (снежинки и прочее теперь готовыми картинками, перерисовка дешевле)   // 2.11.5: на телефоне стоящий герой (лишь «дышит») — 5 раз в секунду, идущий — 10
  if (C.sig !== sig || now - C.t >= 1 / hfps || now < C.t) {
    var cv = C.can; if (cv.width !== px || cv.height !== px) { cv.width = px; cv.height = px; }
    var oc = cv.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, px, px); oc.setTransform(sc, 0, 0, sc, ox * sc, oy * sc);
    oc.globalAlpha = 1; var prev = D.ctx; D.setCtx(oc);
    try { draw(); } finally { D.setCtx(prev); }
    C.sig = sig; C.t = now;
  }
  ctx.drawImage(C.can, -ox, -oy, px / sc, px / sc);
};
// ---------- 2.11.5: враги и прочее движущееся — картинка рисуется в своих (экранных) координатах и переносится к новому месту ----------
// Рисунок объекта не зависит от того, где он стоит, поэтому одну картинку можно ставить в любую точку; обновляется fps раз в секунду
// и сразу — если поменялась подпись sig (направление, вспышка удара, здоровье и т.п.). w, h — размер рамки, ox, oy — точка привязки в ней.
// trimKey — у картинок одного вида (тип врага, направление, эффекты) прозрачные поля одинаковые: первые кадры измеряем,
// где на картинке есть рисунок, и дальше переносим на экран только эту часть (рамка врага — с запасом в 2,6×3 клетки, рисунок — втрое меньше)
var TRIM = {};
// замер — на отдельном холсте в памяти процессора (readback с холста видеокарты на телефоне — долгая остановка):
// рисунок рисуется туда второй раз, только на время первых замеров
var LC = null;
function learnTrimDraw(T, pw, ph, sc, dx, dy, draw) {
  if (!LC) { var c0 = document.createElement('canvas'); LC = { cv: c0, ctx: c0.getContext('2d', { willReadFrequently: true }) }; }
  if (LC.cv.width < pw || LC.cv.height < ph) { LC.cv.width = Math.max(LC.cv.width, pw); LC.cv.height = Math.max(LC.cv.height, ph); }
  var lc = LC.ctx; lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, pw, ph); lc.setTransform(sc, 0, 0, sc, dx, dy); lc.globalAlpha = 1;
  var prev = D.ctx; D.setCtx(lc); try { draw(); } catch (e) { T.n = 99; T.bad = 1; return; } finally { D.setCtx(prev); }
  learnTrim(T, lc, pw, ph);
}
function learnTrim(T, c, W, H) {
  try {
    var d = c.getImageData(0, 0, W, H).data, x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (var y = 0; y < H; y++) { var row = y * W * 4; for (var x = 0; x < W; x++) if (d[row + x * 4 + 3] > 4) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    T.n++; if (x1 < 0) return;
    if (T.x1 < 0) { T.x0 = x0; T.y0 = y0; T.x1 = x1; T.y1 = y1; } else { T.x0 = Math.min(T.x0, x0); T.y0 = Math.min(T.y0, y0); T.x1 = Math.max(T.x1, x1); T.y1 = Math.max(T.y1, y1); }
  } catch (e) { T.n = 99; T.bad = 1; }
}
Z.posSprite = function (holder, ax, ay, w, h, ox, oy, sig, fps, draw, trimKey) {
  var ctx = mainCtx();
  if (off() || !holder || !ctx.getTransform) return draw();
  var m = ctx.getTransform(), sc = Math.sqrt(m.a * m.a + m.b * m.b), now = Z.time || 0;
  if (!(sc > 0) || Math.abs(m.b) > 1e-3) return draw();
  var pw = Math.ceil(w * sc), ph = Math.ceil(h * sc); if (pw * ph > 3e6 || pw < 2 || ph < 2) return draw();
  sig = sig + '|' + pw + 'x' + ph;
  var C = holder._ps; if (!C) { try { Object.defineProperty(holder, '_ps', { value: { can: document.createElement('canvas'), sig: '', t: -9 }, writable: true, enumerable: false }); } catch (e) { return draw(); } C = holder._ps; }
  if (C.sig !== sig || now - C.t >= 1 / fps || now < C.t) {
    var cv = C.can; if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    var oc = cv.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, pw, ph); oc.setTransform(sc, 0, 0, sc, (ox - ax) * sc, (oy - ay) * sc);
    oc.globalAlpha = 1; var prev = D.ctx; D.setCtx(oc);
    try { draw(); } finally { D.setCtx(prev); }
    C.sig = sig; C.t = now;
    if (trimKey) { var TK = trimKey + '|' + pw + 'x' + ph, TT = TRIM[TK] || (TRIM[TK] = { n: 0, x0: 0, y0: 0, x1: -1, y1: -1 }); if (TT.n < 6) learnTrimDraw(TT, pw, ph, sc, (ox - ax) * sc, (oy - ay) * sc, draw); C.trim = TT; } else C.trim = null;
  }
  // готовая часть с рисунком (после 6 замеров, с запасом по краям)
  var TR = C.trim;
  if (TR && TR.n >= 6 && !TR.bad && TR.x1 >= 0) {
    var mg = Math.ceil(Math.max(3, pw * 0.07)), sx = Math.max(0, TR.x0 - mg), sy = Math.max(0, TR.y0 - mg), sw = Math.min(pw, TR.x1 + mg + 1) - sx, sh = Math.min(ph, TR.y1 + mg + 1) - sy;
    if (sw > 0 && sh > 0) {
      var tx = Math.round((ax - ox) * m.a + m.e) + sx, ty = Math.round((ay - oy) * m.d + m.f) + sy;
      ctx.drawImage(C.can, sx, sy, sw, sh, (tx - m.e) / m.a, (ty - m.f) / m.d, sw / sc, sh / sc);
      return;
    }
  }
  // точка в точку: размер — ровно холст, начало — на целой точке экрана (иначе каждый спрайт пересчитывается с размытием, а это дорого)
  var dx = Math.round((ax - ox) * m.a + m.e), dy = Math.round((ay - oy) * m.d + m.f);
  ctx.drawImage(C.can, (dx - m.e) / m.a, (dy - m.f) / m.d, pw / sc, ph / sc);
};
// кусты на поле: их сотни штрихов за кадр, а они почти не меняются — готовой картинкой, 8 раз в секунду (качаются от удара — напрямую)
var oBush = D.bush, bushH = {};
D.bush = function (x, y, cs, t, sway, seed) {
  if (off() || Z._noPos || Math.abs(sway || 0) > 0.01 || !Z.G || Z.ui.screen !== 'level') return oBush.apply(this, arguments);
  var self = this, args = arguments, k = (seed || 0) + ':' + Math.round(x) % 7, h = bushH[seed] || (bushH[seed] = {});
  Z.posSprite(h, x, y, cs * 1.7, cs * 1.7, cs * 0.85, cs * 1.25, 'b|' + (Z.G.info ? Z.G.info.region : 0) + '|' + Z.G.idx + '|' + Math.round(cs * 4), 3, function () { oBush.apply(self, args); });
};
// ---------- 2.11.5: полоски рядов поля (деревья, камни, дома поверх врагов) — только там, где что-то нарисовано ----------
// Каждая полоска была во всю ширину поля и выше ряда: за кадр это ~3,5 экрана прозрачных пикселей. Теперь полоска режется на
// куски по непрозрачным местам (с зазором), лишнее прозрачное не рисуется — на телефоне это главное по видеокарте.
function trimRows(can) {
  if (!can || !can._rows || can._trimmed) return; can._trimmed = true;
  can._rows.forEach(function (R) {
    try {
      var cv = R.cv, W = cv.width, H = cv.height; if (W < 4 || H < 2) return;
      var d = cv.getContext('2d').getImageData(0, 0, W, H).data, colMin = new Int32Array(W).fill(H), colMax = new Int32Array(W).fill(-1);
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 8) { if (y < colMin[x]) colMin[x] = y; if (y > colMax[x]) colMax[x] = y; }
      var segs = [], x0 = -1, gap = 0, GAP = Math.max(12, Math.round(W / 60));
      for (var xx = 0; xx <= W; xx++) {
        var on = xx < W && colMax[xx] >= 0;
        if (on) { if (x0 < 0) x0 = xx; gap = 0; }
        else if (x0 >= 0 && (++gap > GAP || xx === W)) { var x1 = xx - gap + 1, yMin = H, yMax = -1; for (var q = x0; q < x1; q++) { if (colMin[q] < yMin) yMin = colMin[q]; if (colMax[q] > yMax) yMax = colMax[q]; } if (yMax >= yMin) segs.push([x0, yMin, x1 - x0, yMax - yMin + 1]); x0 = -1; gap = 0; }
      }
      R.segs = segs.map(function (g) { var c = document.createElement('canvas'); c.width = g[2]; c.height = g[3]; c.getContext('2d').drawImage(cv, g[0], g[1], g[2], g[3], 0, 0, g[2], g[3]); return { cv: c, x: g[0], y: g[1], w: g[2], h: g[3] }; });
      R.sx = (R.h || H) / H;   // полоска могла быть уменьшена (слабое устройство) — масштаб к исходной
    } catch (e) { R.segs = null; }
  });
}
Z.trimRows = trimRows;
// ---------- значки: рисуются один раз ----------
var icons = {};
Z.iconCached = function (key, x, y, size, draw) {   // size — сторона квадрата, (x, y) — центр
  var dpr = Z.DPR || 1, k = key + '@' + Math.round(size) + '@' + dpr, I = icons[k];
  if (!I) {
    var n = Math.ceil(size * dpr), cv = document.createElement('canvas'); cv.width = n; cv.height = n;
    var oc = cv.getContext('2d'); oc.setTransform(dpr, 0, 0, dpr, size / 2 * dpr, size / 2 * dpr);
    var prev = D.ctx; D.setCtx(oc); try { draw(0, 0); } finally { D.setCtx(prev); }
    I = icons[k] = cv; var ks = Object.keys(icons); if (ks.length > 160) delete icons[ks[0]];
  }
  var c = mainCtx(), m = c.getTransform ? c.getTransform() : null;
  if (m && m.b === 0 && m.c === 0 && Math.abs(m.a - dpr) < 1e-4 && Math.abs(m.d - dpr) < 1e-4) { var dx = Math.round((x - size / 2) * m.a + m.e), dy = Math.round((y - size / 2) * m.d + m.f); c.drawImage(I, (dx - m.e) / m.a, (dy - m.f) / m.d, I.width / dpr, I.height / dpr); }   // точка в точку
  else c.drawImage(I, x - size / 2, y - size / 2, size, size);
};
// ---------- сугробы: готовые картинки (раньше — по градиенту на каждый сугроб каждый кадр) ----------
var oDrift = D.drift, dSpr = {}, dN = 0;
D.drift = function (x, y, cs, amt, trail) {
  if (off() || !Z.ui || Z.ui.screen !== 'level') return oDrift.apply(this, arguments);
  var dpr = Z.DPR || 1, q = Math.round((amt || 0) * 10) / 10, tq = trail > 0.05 ? Math.round(trail * 10) / 10 : 0;
  var key = cs.toFixed(1) + '|' + q + '|' + tq + '|' + dpr, I = dSpr[key];
  var h = cs * (0.1 + 0.07 * q), pad = Math.max(2, cs * 0.08), L0 = -cs * 0.45 - pad, T0 = cs * 0.22 - h * 1.5 - pad, w = cs * 0.9 + pad * 2, hh = h * 1.5 + pad * 2;
  if (!I) {
    if (++dN > 240) { dSpr = {}; dN = 1; }
    var cv = document.createElement('canvas'); cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(hh * dpr);
    var oc = cv.getContext('2d'); oc.setTransform(dpr, 0, 0, dpr, -L0 * dpr, -T0 * dpr);
    var prev = D.ctx; D.setCtx(oc); try { oDrift.call(D, 0, 0, cs, q, tq); } finally { D.setCtx(prev); }
    I = dSpr[key] = cv;
  }
  var px = Math.round((x + L0) * dpr) / dpr, py = Math.round((y + T0) * dpr) / dpr;
  mainCtx().drawImage(I, px, py, I.width / dpr, I.height / dpr);
};
// ---------- надписи: готовыми картинками ----------
// Надпись с обводкой каждый кадр заново обводилась по контурам букв — это одна из самых дорогих операций холста.
// Теперь каждая надпись (текст, размер, цвет, обводка, масштаб) рисуется один раз и дальше ставится готовой, точка в точку.
var oText = D.text, TC = new Map(), meas = null, FONTS = {};
try { if (document.fonts) document.fonts.addEventListener('loadingdone', function () { TC.clear(); }); } catch (e) { }
D.text = function (s, x, y, px, col, align, base, outline) {
  var ctx = D.ctx;
  if (off() || !ctx || !ctx.getTransform || (col !== undefined && typeof col !== 'string') || !(px > 0)) return oText.apply(this, arguments);
  s = String(s); if (!s || s.length > 48 || (document.fonts && document.fonts.status !== 'loaded')) return oText.apply(this, arguments);   // пока шрифт грузится — напрямую (иначе запомнится запасной шрифт)
  var m = ctx.getTransform(); if (Math.abs(m.b) > 1e-4 || Math.abs(m.c) > 1e-4 || !(m.a > 0) || Math.abs(m.a - m.d) > 1e-4 || ctx.shadowBlur) return oText.apply(this, arguments);
  if (Math.abs(m.a - (Z.DPR || 1)) > 1e-3 && !(ctx.canvas !== Z.mainCv && TC.size < 400)) return oText.apply(this, arguments);   // надпись в «дышащей» кнопке (масштаб меняется каждый кадр) — напрямую, иначе каждый кадр новая картинка
  var sc = m.a, ol = outline || 0, pr = Math.round(px), font = FONTS[pr] || (FONTS[pr] = D.font(px)), key = s + '\u0001' + pr + '\u0001' + (col || '#fff') + '\u0001' + (align || 'c') + (base || 'm') + '\u0001' + ol + '\u0001' + sc;
  var I = TC.get(key);
  if (I) { TC.delete(key); TC.set(key, I); }
  else {
    if (!meas) meas = document.createElement('canvas').getContext('2d');
    meas.font = font; meas.textAlign = align || 'center'; meas.textBaseline = base || 'middle';
    var mt = meas.measureText(s), pad = ol / 2 + 2;
    var lft = Math.max(mt.actualBoundingBoxLeft || 0, 0) + pad, rgt = Math.max(mt.actualBoundingBoxRight || mt.width, 0) + pad, asc = (mt.actualBoundingBoxAscent || px) + pad, dsc = (mt.actualBoundingBoxDescent || px * 0.3) + pad;
    if (!(lft + rgt > 0) || !(asc + dsc > 0)) return oText.apply(this, arguments);
    var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil((lft + rgt) * sc)); cv.height = Math.max(1, Math.ceil((asc + dsc) * sc));
    var oc = cv.getContext('2d'); oc.setTransform(sc, 0, 0, sc, lft * sc, asc * sc);
    var prev = D.ctx; D.setCtx(oc); try { oText.call(D, s, 0, 0, px, col, align, base, outline); } finally { D.setCtx(prev); }
    I = { cv: cv, lx: lft, ay: asc };
    TC.set(key, I); if (TC.size > 500) TC.delete(TC.keys().next().value);
  }
  var dx = Math.round((x - I.lx) * m.a + m.e), dy = Math.round((y - I.ay) * m.d + m.f);
  ctx.drawImage(I.cv, (dx - m.e) / m.a, (dy - m.f) / m.d, I.cv.width / sc, I.cv.height / sc);
};
// ---------- ориентир уровня и постройки врагов: готовой картинкой ----------
// Где у рисунка есть краска, меряем один раз (в памяти, в четырёх фазах анимации, с запасом) — по этой рамке и храним картинку.
var BOX = {};
function measureBox(key, draw) {
  if (key in BOX) return BOX[key];
  var u = 40, W = u * 9, H = u * 11, ax = W / 2, ay = H * 0.72, bb = [1e9, 1e9, -1e9, -1e9], edge = false;
  try {
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var c = cv.getContext('2d', { willReadFrequently: true });
    var prev = D.ctx; D.setCtx(c);
    try {
      [0.13, 0.71, 1.37, 2.9].forEach(function (tt) {
        c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.globalAlpha = 1; draw(c, ax, ay, u, tt);
        var d = c.getImageData(0, 0, W, H).data;
        for (var y = 0; y < H; y++) { var row = y * W * 4; for (var x = 0; x < W; x++) if (d[row + x * 4 + 3] > 3) { if (x < bb[0]) bb[0] = x; if (x > bb[2]) bb[2] = x; if (y < bb[1]) bb[1] = y; if (y > bb[3]) bb[3] = y; } }
      });
    } finally { D.setCtx(prev); }
    if (bb[2] < 0) return (BOX[key] = null);
    if (bb[0] <= 1 || bb[1] <= 1 || bb[2] >= W - 2 || bb[3] >= H - 2) edge = true;   // рисунок шире пробного холста — не кэшируем
  } catch (e) { return (BOX[key] = null); }
  if (edge) return (BOX[key] = null);
  var m = 0.22;   // запас в клетках: анимация между замерами
  return (BOX[key] = [(bb[0] - ax) / u - m, (bb[1] - ay) / u - m, (bb[2] - ax) / u + m, (bb[3] - ay) / u + m]);
}
var oLmB = D.landmark;
D.landmark = function (kind, x, y, cs, t) {
  var G = Z.G, self = this, a = arguments;
  if (off() || !G || !G.L || !Z.ui || Z.ui.screen !== 'level' || !(cs > 4)) return oLmB.apply(self, a);
  var key = ['lmb', G.idx, kind, G.damGone ? 1 : 0, G.night ? 1 : 0, Z.LANG].join('|');
  var bx = measureBox(key, function (c, ax, ay, u, tt) { oLmB.call(self, kind, ax, ay, u, tt); });
  if (!bx) return oLmB.apply(self, a);
  cachedDraw('lmb', key + '|' + cs.toFixed(2), x + bx[0] * cs, y + bx[1] * cs, (bx[2] - bx[0]) * cs, (bx[3] - bx[1]) * cs, function () { oLmB.apply(self, a); }, pick(10, 6, 4));
};
var oSt = D.struct;
D.struct = function (s, x, y, cs, t) {
  var G = Z.G, self = this, a = arguments;
  if (off() || !G || !s || s.hitT > 0 || !Z.ui || Z.ui.screen !== 'level' || !(cs > 4)) return oSt.apply(self, a);
  var dn = !!s.done, key = ['st', s.type, s.lvl || 0, dn ? 1 : 0, Z.LANG].join('|');   // строящаяся — с лесами, рамка своя
  var bx = measureBox(key, function (c, ax, ay, u, tt) { oSt.call(self, { type: s.type, c: s.c, r: s.r, hp: s.max, max: s.max, hitT: 0, rise: 1, prog: dn ? 1 : 0.999, dur: dn ? 0 : 1, done: dn, lvl: s.lvl }, ax, ay, u, tt); });
  if (!bx) return oSt.apply(self, a);
  var H = s._spr || (function () { try { Object.defineProperty(s, '_spr', { value: {}, enumerable: false, writable: true }); } catch (e) { } return s._spr || {}; })();
  Z.posSprite(H, x, y, (bx[2] - bx[0]) * cs, (bx[3] - bx[1]) * cs, -bx[0] * cs, -bx[1] * cs, key + '|' + Math.round((s.hp / (s.max || 1)) * 10) + '|' + (dn ? '' : Math.round((s.prog || 0) * 40) + '|' + (s.stalled ? 1 : 0) + '|' + Math.round((s.fade || 0) * 8)) + '|' + Math.round(cs * 4), pick(10, 6, 4), function () { oSt.apply(self, a); });
};
})();
