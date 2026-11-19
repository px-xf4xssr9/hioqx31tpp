/* Интерфейс: карта регионов, экран боя, меню, окна, ввод */
(function () {
'use strict';
var Z = window.Z, D = Z.D, T = Z.T;
var UI = Z.ui = {};
var OL = D.OL, COL = D.COL;
var ctx, W = 0, H = 0, S = 1;
var buttons = [];
UI.screen = 'map';
UI.modal = null; UI.modalQ = [];
UI.mapScroll = 0; UI.mapVel = 0;
UI.press = null;

// ---------- кнопки ----------
function button(id, x, y, w, h, o) {
  o = o || {};
  if (o.hidden) { buttons.push({ id: id, x: x, y: y, w: w, h: h, en: true, fn: o.fn, modal: !!o.modal, sfx: o.sfx, hidden: true }); return; }
  var en = o.enabled !== false, c1 = en ? (o.c1 || COL.green) : '#9aa3b8', c2 = en ? (o.c2 || COL.greenD) : '#737c93';
  var press = UI.press === id ? 1 : 0, r = o.r !== undefined ? o.r : Math.min(h * 0.32, 16 * S), d = Math.max(3, h * 0.09);
  var pulse = o.pulse && en ? 1 + Math.sin(Z.time * 6) * 0.035 : 1;
  ctx.save();
  if (pulse !== 1) { ctx.translate(x + w / 2, y + h / 2); ctx.scale(pulse, pulse); ctx.translate(-x - w / 2, -y - h / 2); }
  var yy = y + press * d * 0.7;
  // 2.11.5: «тело» кнопки (5 заливок и обводка) — готовой картинкой
  var lwB = Math.max(2, 2.5 * S), faceF = function (c, X0, Y0) {
    D.rr(X0, Y0 + d - press * d * 0.7, w, h - d, r); c.fillStyle = OL; c.fill();
    D.rr(X0, Y0, w, h - d, r); c.fillStyle = c2; c.fill();
    D.rr(X0 + 2, Y0 + 2, w - 4, h - d - 6, r * 0.85); c.fillStyle = c1; c.fill();
    D.rr(X0, Y0, w, h - d, r); c.lineWidth = lwB; c.strokeStyle = OL; c.stroke();
    c.globalAlpha = 0.22; D.rr(X0 + 6, Y0 + 4, w - 12, (h - d) * 0.32, r * 0.6); c.fillStyle = '#fff'; c.fill(); c.globalAlpha = 1; };
  if (!shapeSprite('b|' + [w, h, r, d, c1, c2, press, lwB].join('|'), x, yy, w, h, lwB, faceF)) faceF(ctx, x, yy);
  if (o.draw) o.draw(x, yy, w, h - d);
  else if (o.label) D.text(o.label, x + w / 2, yy + (h - d) / 2, D.fitText(o.label, w - 16 * S, o.px || 20 * S), '#fff', 'center', 'middle', 3 * S);
  ctx.restore();
  if (!o.noHit) buttons.push({ id: id, x: x, y: y, w: w, h: h, en: en, fn: o.fn, modal: !!o.modal, sfx: o.sfx });
}
function adButton(id, x, y, w, h, label, fn) {
  button(id, x, y, w, h, { modal: true, c1: '#9a7ce8', c2: COL.purpleD, pulse: true, fn: fn, draw: function (bx, by, bw, bh) {
    D.adIcon(bx + 26 * S, by + bh / 2 - 4 * S, 11 * S);
    D.text(T('ad'), bx + 26 * S, by + bh / 2 + 12 * S, Math.max(9, D.fitText(T('ad'), 40 * S, 9.5 * S)), '#fff', 'center', 'middle', 2 * S);
    D.text(label, bx + 44 * S + (bw - 54 * S) / 2, by + bh / 2, D.fitText(label, bw - 64 * S, 19 * S), '#fff', 'center', 'middle', 3 * S);
  } });
}
function pill(x, y, w, h) { var lw = Math.max(1.5, 2 * S), f = function (c, X0, Y0) { D.rr(X0, Y0, w, h, h / 2); c.fillStyle = 'rgba(10,16,40,0.6)'; c.fill(); c.lineWidth = lw; c.strokeStyle = 'rgba(255,255,255,0.18)'; c.stroke(); }; if (!shapeSprite('p|' + [w, h, lw].join('|'), x, y, w, h, lw, f)) f(ctx, x, y); }
// 2.11.5: неподвижные фигуры интерфейса (тело кнопки, плашка) рисуются один раз и дальше ставятся готовыми, точка в точку.
// Ключ — всё, от чего зависит вид. Пока поворот/наклон — рисуем напрямую. Возвращает false, если не получилось (тогда рисует вызывающий).
// 2.12.12: готовые картинки (кэши земли, кадров, надписей, построек) выключены насовсем: на устройствах владельца они
// давали рывки при приближении и мыло. Включить их нельзя ни настройкой, ни автоматически.
Z.cachesOff = function () { return true; };
// 2.12.52: «быстрая отрисовка» — готовые кадры врагов при толпе и портреты отряда (см. v30o.js); пока только в тестовой версии
Z.fastDraw = function () { return !!window.__FAST; };
var SHP = new Map();
function shapeSprite(key, x, y, w, h, lw, draw) {
  if (Z.cachesOff() || !ctx.getTransform || !(w > 0) || !(h > 0) || w * h > 4e5) return false;
  var m = ctx.getTransform(); if (Math.abs(m.b) > 1e-4 || Math.abs(m.c) > 1e-4 || !(m.a > 0)) return false;
  var dpr = Z.DPR || 1, pad = Math.ceil(lw / 2 + 2), k = key + '|' + dpr, I = SHP.get(k);
  if (!I) {
    var cv = document.createElement('canvas'); cv.width = Math.ceil((w + pad * 2) * dpr); cv.height = Math.ceil((h + pad * 2) * dpr);
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, pad * dpr, pad * dpr);
    var prev = D.ctx; D.setCtx(c); try { draw(c, 0, 0); } finally { D.setCtx(prev); }
    I = { cv: cv, pad: pad }; SHP.set(k, I); if (SHP.size > 260) SHP.delete(SHP.keys().next().value);
  }
  var ga = ctx.globalAlpha;
  if (Math.abs(m.a - dpr) < 1e-4 && Math.abs(m.d - dpr) < 1e-4) { var dx = Math.round((x - I.pad) * m.a + m.e), dy = Math.round((y - I.pad) * m.d + m.f); ctx.drawImage(I.cv, (dx - m.e) / m.a, (dy - m.f) / m.d, I.cv.width / dpr, I.cv.height / dpr); }
  else ctx.drawImage(I.cv, x - I.pad, y - I.pad, I.cv.width / dpr, I.cv.height / dpr);
  ctx.globalAlpha = ga; return true;
}
function badge(x, y, r) { D.circ(x, y, r, COL.red, Math.max(1.5, r * 0.25)); D.text('!', x, y + r * 0.05, r * 1.4, '#fff'); }

// ---------- макет ----------
UI.cam = { z: 1, px: 0, py: 0 };
UI.layout = function (w, h) {
  W = w; H = h;
  var sw = W, sh = H, ox = 0;
  // 2.12.24: на очень широком экране (телефон лёжа 2,5:1) интерфейс раньше ужимался в середину 2:1 — кнопки висели в стороне от краёв.
  // Теперь — до краёв экрана, с небольшим отступом под вырез камеры и скруглённые углы
  if (sw / sh > 2) { ox = Math.min((W - sh * 2) / 2, 30); sw = W - 2 * ox; }
  S = Math.max(0.7, Math.min(1.5, Math.min(sw, sh) / 420));
  // 2.11.5: телефон лёжа — высота экрана 330–400 px, и всё выходило мелким; масштаб от высоты под телефон
  if (Z.isPhone && sw > sh * 1.3) S = Math.max(S, Math.min(1.25, sh / 330));
  var portrait = sh >= sw * 1.05;
  var L = UI.L = { s: S, portrait: portrait, ox: ox, sw: sw, sh: sh };
  var top = 52 * S;
  // 2.6: поле на весь экран, интерфейс поверх поля; inT/inB/inR — «безопасные» отступы под панелями
  L.vp = { x: ox, y: 0, w: sw, h: sh };
  L.top = { x: ox, y: 0, w: sw, h: top };
  if (portrait) {
    var bottom = 112 * S;
    L.bot = { x: ox, y: sh - bottom, w: sw, h: bottom }; L.inT = top; L.inB = bottom; L.inR = 0;
  } else {
    var pw = Math.min(104 * S, sw * 0.16);
    L.bot = { x: ox + sw - pw, y: top, w: pw, h: sh - top }; L.inT = top; L.inB = 0; L.inR = pw;
  }
  var gd = Z.G && Z.G.L ? Z.G.L : (Z.levelDims || { W: 10, H: 10 });
  L.gw = gd.W; L.gh = gd.H;
  L.cs0 = UI.fitCs(L);
  UI.applyCam();
  UI.fieldCache = null;
};
// 2.6: «безопасная зона» — часть экрана, не закрытая панелями. Поле целиком вписывается в неё:
// ёлка, ворота и края карты всегда видны, интерфейс поля не перекрывает
UI.safe = function (L) {
  var S0 = L.s, bar = 70 * S0;
  // отступы от краёв экрана, чтобы вышки и герои в крайних клетках (и то, что выступает за рамку поля) не обрезались
  // 2.6l: запас для крайних вышек и саней теперь внутри рамки поля (D.fieldPad), снаружи отступы как в 2.6
  if (L.portrait) return { x: L.ox + 4 * S0, y: L.inT + 4 * S0, w: L.sw - 8 * S0, h: L.bot.y - bar - L.inT - 8 * S0 };
  return { x: L.ox + bar, y: L.inT + 4 * S0, w: L.bot.x - L.ox - bar - 6 * S0, h: L.sh - L.inT - 8 * S0 };
};
UI.fitCs = function (L) {
  var sa = L.sa = UI.safe(L);
  // клетки — как в 2.6: в экран вписываются сами клетки, запас рамки может заходить под кнопки у краёв
  return Math.max(8, Math.min(sa.w / L.gw, sa.h / L.gh));
};
var VSF = ['ox', 'sw', 'sh', 'inT', 'inB', 'inR', 'vp', 'top', 'bot', 'sa'];
UI.applyCam = function () {
  if (UI._vs) { var o0 = UI._vs.o; for (var vi = 0; vi < VSF.length; vi++) UI.L[VSF[vi]] = o0[VSF[vi]]; }
  var L = UI.L, c = UI.cam, vp = L.vp;
  c.z = Math.max(1, Math.min(3.6, c.z));
  var gd = Z.G && Z.G.L ? Z.G.L : null;
  if (gd && (gd.W !== L.gw || gd.H !== L.gh || gd !== L.padL)) { L.gw = gd.W; L.gh = gd.H; L.padL = gd; L.cs0 = UI.fitCs(L); }
  L.cs = L.cs0 * c.z; L.BW = L.cs * L.gw; L.BH = L.cs * L.gh; L.B = Math.min(L.BW, L.BH);
  var sa = L.sa || (L.sa = UI.safe(L));
  var cx = sa.x + (sa.w - L.BW) / 2, cy = sa.y + (sa.h - L.BH) / 2;
  // поле двигается всегда (и без приближения), но край не уходит дальше середины безопасной зоны
  // 2.8.5: при приближении край поля можно увести дальше — видно и то, что выступает над рамкой (крепость врага сверху), и то, что под панелями героев
  var omT = UI.objMargin ? UI.objMargin(L.cs).t : L.cs * 1.4;
  var ex = Math.max(sa.w * 0.35, (L.BW - sa.w) / 2 + L.cs * 2), eyT = Math.max(sa.h * 0.35, (L.BH - sa.h) / 2 + L.cs * 1.5 + omT), eyB = Math.max(sa.h * 0.35, (L.BH - sa.h) / 2 + L.cs * 2);
  c.px = Math.max(-ex, Math.min(ex, c.px)); c.py = Math.max(-eyB, Math.min(eyT, c.py));
  L.fx = cx + c.px; L.fy = cy + c.py;
  if (UI._vs) vsScale(L, 1 / UI._vs.k);
};
// 2.12.8: во время жеста приближения мир рисуется в «ступенчатом» масштабе (тот, для которого готовые кадры уже есть) и
// растягивается преобразованием холста: раньше каждый новый масштаб значил новые кадры для всех врагов, вышек и декораций.
// Раскладка на время рисования мира пересчитана в этот масштаб; холст «думает», что точек экрана в k раз меньше.
function vsScale(L, f) {
  L.cs *= f; L.BW *= f; L.BH *= f; L.B *= f; L.fx *= f; L.fy *= f; L.ox *= f; L.sw *= f; L.sh *= f; L.inT *= f; L.inB *= f; L.inR *= f;
  ['vp', 'top', 'bot', 'sa'].forEach(function (n) { var r = L[n]; if (r) L[n] = { x: r.x * f, y: r.y * f, w: r.w * f, h: r.h * f }; });
}
var VS0 = null;
function vsEnter(k) {
  var P = CanvasRenderingContext2D.prototype, c = ctx;
  VS0 = { W: W, H: H, ZW: Z.W, ZH: Z.H, nb: buttons.length, k: k, c: c };
  var o = {}; VSF.forEach(function (n) { o[n] = UI.L[n]; });
  UI._vs = { k: k, o: o }; UI.applyCam();
  W /= k; H /= k; Z.W /= k; Z.H /= k;
  c.save(); c.scale(k, k);
  c.getTransform = function () { var m = P.getTransform.call(this); return new DOMMatrix([m.a / k, m.b / k, m.c / k, m.d / k, m.e / k, m.f / k]); };
  c.setTransform = function (a, b, cc, d, e, f) { if (a && typeof a === 'object') { f = a.f; e = a.e; d = a.d; cc = a.c; b = a.b; a = a.a; } if (a === undefined) { a = 1; b = 0; cc = 0; d = 1; e = 0; f = 0; } P.setTransform.call(this, a * k, b * k, cc * k, d * k, e * k, f * k); };
  c.resetTransform = function () { P.setTransform.call(this, k, 0, 0, k, 0, 0); };
}
function vsExit() {
  if (!VS0) return;
  var v = VS0, c = v.c; VS0 = null;
  delete c.getTransform; delete c.setTransform; delete c.resetTransform;
  try { c.restore(); } catch (e) {}
  W = v.W; H = v.H; Z.W = v.ZW; Z.H = v.ZH;
  for (var i = v.nb; i < buttons.length; i++) { var b = buttons[i]; b.x *= v.k; b.y *= v.k; b.w *= v.k; b.h *= v.k; }
  var o = UI._vs && UI._vs.o; if (o) VSF.forEach(function (n) { UI.L[n] = o[n]; });
  UI._vs = null; UI.applyCam();
}
UI.zoomAt = function (z, mx, my) {
  var L = UI.L, c = UI.cam, wx = (mx - L.fx) / L.cs, wy = (my - L.fy) / L.cs;
  c.z = Math.max(1, Math.min(3.6, z));
  var cs = L.cs0 * c.z, vp = L.vp;
  var sa = L.sa || (L.sa = UI.safe(L));
  c.px = (mx - wx * cs) - (sa.x + (sa.w - cs * L.gw) / 2); c.py = (my - wy * cs) - (sa.y + (sa.h - cs * L.gh) / 2);
  UI.applyCam();
};
UI.resetCam = function () {
  UI.cam = { z: 1, px: 0, py: 0 }; if (!UI.L) return; UI.applyCam();
  // на большой карте стартуем крупно у крепости, общий вид — двойным касанием
  var G = Z.G, L = UI.L;
  if (G && G.info && ((Z.LEVELS[G.idx] && Z.LEVELS[G.idx].big) || G.endless) && L.cs0 < 34 * S) {
    var z = Math.min(2.2, 38 * S / L.cs0), f = G.L.fort || G.L.start;
    UI.zoomAt(z, X(f[0] + 0.5), Y(f[1] + 0.5)); UI.centerOn(f[0] + 0.5, f[1] - 2);
  } else if (G && G.L && G.idx > 0 && Math.min(W, H) < 520) {
    // 2.7.10: на телефоне клетки мелкие — начинаем чуть крупнее (≈46 px на клетку), центр немного смещён к ёлке
    var zp = Math.min(1.22, 46 / L.cs0), fp = G.L.fort || G.L.start, cx = G.L.W / 2, cy = G.L.H / 2;
    if (fp) { cx = cx * 0.75 + (fp[0] + 0.5) * 0.25; cy = cy * 0.75 + (fp[1] + 0.5) * 0.25; }
    if (zp > 1.04) { UI.zoomAt(zp, X(cx), Y(cy)); UI.centerOn(cx, cy); }
  }
};
UI.centerOn = function (wx, wy) {
  var L = UI.L, v = L.sa || L.vp; UI.cam.px += (v.x + v.w / 2) - X(wx); UI.cam.py += (v.y + v.h / 2) - Y(wy); UI.applyCam();
};
// прямоугольник рамки поля на экране (клетки + запас вокруг) и обрезка по её скруглённому краю
UI.frame = function () { var L = UI.L, cs = L.cs, P = UI.pad(); return { x: L.fx - P.l * cs, y: L.fy - P.t * cs, w: L.BW + (P.l + P.r) * cs, h: L.BH + (P.t + P.b) * cs, r: cs * 0.7 }; };
UI.frameClip = function (c) { var F = UI.frame(); c.beginPath(); D.rr(F.x, F.y, F.w, F.h, F.r); c.clip(); };
// значок «плёнка» мультика
UI.filmBadge = function (x, y, r, on) {
  D.rr(x - r * 1.25, y - r * 0.95, r * 2.5, r * 1.9, r * 0.35); ctx.fillStyle = on ? '#2b2f4a' : '#6b7290'; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.2); ctx.strokeStyle = '#fff'; ctx.stroke();
  ctx.fillStyle = '#fff'; for (var i = 0; i < 3; i++) { ctx.fillRect(x - r * 0.95 + i * r * 0.75, y - r * 0.78, r * 0.38, r * 0.3); ctx.fillRect(x - r * 0.95 + i * r * 0.75, y + r * 0.48, r * 0.38, r * 0.3); }
  D.poly([x - r * 0.3, y - r * 0.35, x + r * 0.45, y, x - r * 0.3, y + r * 0.35], on ? '#ff8fb1' : '#c9cfdc');
};
UI.pad = function () { var G = Z.G; return G && G.L ? D.fieldPad(G.L) : { l: 0.4, r: 0.4, t: 0.3, b: 0.2 }; };
UI.objMargin = function (cs) { return { x: cs * 0.9, t: cs * 1.4, b: cs * 0.6 }; };
function X(x) { return UI.L.fx + x * UI.L.cs; }
UI.X = X; UI.Y = function (y) { return UI.L.fy + y * UI.L.cs; };
function Y(y) { return UI.L.fy + y * UI.L.cs; }

// ---------- вступительные карточки ----------
UI.intro = function (o) { UI.openModal({ type: 'intro', o: o }); };
UI.openModal = function (m) {
  if (UI.modal) { UI.modalQ.push(m); return; }
  m.t = 0; UI.modal = m; Z.onPauseChange();
};
UI.closeModal = function () {
  UI.modal = null;
  if (UI.modalQ.length) { var m = UI.modalQ.shift(); m.t = 0; UI.modal = m; }
  Z.onPauseChange();
};
UI.onLevelEnd = function () {
  var G = Z.G;
  setTimeout(function () { if (Z.G === G) UI.openModal({ type: G.result.win ? 'win' : G.endless ? 'endlessOver' : 'lose' }); }, G.result.win ? 900 : 700);
};

// ---------- переходы ----------
UI.goLevel = function (idx, heroic) {
  Z.levelDims = Z.pickDims(UI.L.vp.w / UI.L.vp.h);
  if (Z.LEVELS[idx].big) Z.levelDims = Z.bigDims(Z.levelDims);
  // 2.11.5: у босса сверху стоит его крепость (4–5 рядов) — поле больше, чтобы места для обороны было не меньше, чем на большой карте
  if (Z.LEVELS[idx].type === 'boss') Z.levelDims = { W: Math.round(Z.levelDims.W * 1.1), H: Z.levelDims.H + 5 };
  Z.startLevel(idx, heroic, Z.levelDims);
  UI.layout(W, H);
  UI.screen = 'level'; UI.fieldCache = null; UI.resetCam(); UI.heroSel = false; UI.menu = null; UI.sel = null;
  if (Z.showStory) Z.showStory(idx);
  UI.trackLb('stars', function () { return Z.totalStars(); });
  var G = Z.G;
  // новые вышки и способности
  Z.TOWER_ORDER.forEach(function (t) { if (Z.TOWERS[t].unlock === idx && idx > 0 && !Z.save.seen['u_' + t]) { Z.save.seen['u_' + t] = 1; UI.intro({ kind: 'tower', id: t }); } });
  for (var sk in Z.SKILLS) if (Z.SKILLS[sk].unlock === idx && idx > 0 && !Z.save.seen['s_' + sk]) { Z.save.seen['s_' + sk] = 1; UI.intro({ kind: 'skill', id: sk }); }
  if (G.L.type === 'escort' && !Z.save.seen.escort) { Z.save.seen.escort = 1; UI.intro({ kind: 'escort' }); }
  (G.squad || []).forEach(function (U) { if (!Z.save.seen['ally_' + U.type]) { Z.save.seen['ally_' + U.type] = 1; UI.intro({ kind: 'ally', id: U.type }); } });
  Z.TRAP_ORDER.forEach(function (t) { if (Z.trapUnlocked(t, idx) && !Z.save.seen['tr_' + t])   /* фонарь «открыт» с 1-го уровня, но доступен только ночью — раньше про него сообщали на первом же уровне */ { Z.save.seen['tr_' + t] = 1; UI.intro({ kind: 'trap', id: t }); } });
  if (Z.LEVELS[idx].big) setTimeout(function () { if (Z.G === G) UI.toast(T('bigMap'), '#7fd8ff'); }, 1200);
  if (idx >= 23 && !Z.save.seen.squad4) { Z.save.seen.squad4 = 1; setTimeout(function () { if (Z.G === G) UI.toast(T('squad4'), '#ffd54a'); }, 2400); }
  if (Z.AU.setTheme) Z.AU.setTheme(G.info.type === 'boss' && G.info.region === 4 ? 'witch' : Z.REGIONS[G.info.region].id);
  if (Z.AU.setBoost) Z.AU.setBoost(G.info.type === 'boss' ? 1 : G.info.k / 5);
  Z.AU.setState('build', 0);
  Z.onPauseChange();
};
UI.goEndless = function () {
  if (Z.unlockedLevel() < 7) { UI.toast(T('endlessLock'), '#ffd54a'); return; }   // 2.11.5: не запускать до открытия ни с какой кнопки
  var bd = Z.bigDims(Z.pickDims(UI.L.vp.w / UI.L.vp.h));
  Z.levelDims = { W: Math.round(bd.W * 1.12), H: Math.round(bd.H * 1.12) };
  Z.startEndless(Z.levelDims); UI.layout(W, H);
  UI.trackLb('endless', function () { return Z.save.endlessBest || 0; });
  UI.screen = 'level'; UI.fieldCache = null; UI.resetCam(); UI.heroSel = false;
  if (Z.AU.setTheme) Z.AU.setTheme(Z.REGIONS[Z.G.info.region].id);
  setTimeout(function () { UI.toast(T('bigMap'), '#7fd8ff'); }, 900);
  if (Z.AU.setBoost) Z.AU.setBoost(0.2);
  Z.AU.setState('build', 0); Z.onPauseChange();
};
UI.goMap = function (withAd) {
  var go = function () { Z.G = null; UI.screen = 'map'; UI.scrollToCurrent = true; if (Z.AU.setTheme) Z.AU.setTheme('map'); Z.AU.setState('map', 0); Z.onPauseChange(); Z.persist(true); };
  if (withAd && (Z.canInter ? Z.canInter() : Z.time - (Z.lastFullAd || -999) > 150 && Z.unlockedLevel() >= 2)) { Z.lastFullAd = Z.time; Z.SDK.fullscreen(go); }
  else go();
};

// ---------- экран боя ----------
function drawLevel() {
  if (VS0) vsExit();
  UI.applyCam();
  (function () {
    var Lr = UI.L, csR = Lr.cs, now = performance.now();
    if (UI.vsLast !== csR) { UI.vsLast = csR; UI.vsT = now; }
    var gest = !!UI.pinch || now - (UI.vsT || 0) < 300;
    if (!gest || Z._noVS || Z.cachesOff() || !ctx.getTransform || typeof DOMMatrix === 'undefined' || (Z.G && Z.G.shake > 0)) { UI.vsQ = csR; return; }
    var q = UI.vsQ || csR;
    if (!(csR / q > 0.9995 && csR / q < 1.6)) q = Lr.cs0 * Math.pow(1.6, Math.max(0, Math.floor(Math.log(csR / Lr.cs0) / Math.log(1.6) + 1e-6)));   // ступени: ×1, ×1,6, ×2,56 от исходного
    UI.vsQ = q;
    var k = csR / q; if (k > 1.002) vsEnter(k);
  })();
  var G = Z.G, L = UI.L, cs = L.cs, t = Z.time;
  var reg = Z.REGIONS[G.info.region];
  // небо и снег вокруг
  // 2.6: за краями поля — та же земля региона (никакого «синего поля с домиками»)
  var fcq = UI.fieldCache;
  // 2.11.5: слой поля не перерисовывается на каждом шаге зума (было — на каждый щелчок колеса, 0,1–0,5 с на кадр):
  // пока масштаб меняется, растягиваем готовый; перерисовываем, когда зум замер на 0,25 с и картинка заметно размылась
  // (приблизили) или слой вдвое крупнее нужного. Размер слоя ограничен — на большом приближении не создаём гигантский холст.
  var fdpr = Math.min(Z.DPR, 2), FPc = D.fieldPad(G.L), fcw = G.L.W + FPc.l + FPc.r, fch = G.L.H + FPc.t + FPc.b;
  // 2.12.6: слой поля строится один раз в разрешении максимального приближения (в пределах памяти) и дальше только
  // уменьшается при переносе — пересборок после жеста приближения (0,3 с на телефоне) больше нет
  var maxZ = Math.min(3.6, Z.perfPick ? Z.perfPick(3.6, 2.5, 2) : 3.6), tcs = Math.min(Math.max(cs, L.cs0 * maxZ), 4096 / (fdpr * fcw), 4096 / (fdpr * fch), Math.sqrt((Z.perfPick ? Z.perfPick(9e6, 6e6, 4e6) : 9e6) / (fdpr * fdpr * fcw * fch)));
  var nowT = performance.now(); if (UI.fcLastCs !== cs) { UI.fcLastCs = cs; UI.fcCsT = nowT; }
  var zIdle = !UI.pinch && nowT - (UI.fcCsT || 0) > 250;
  if (!fcq || fcq.g !== G || G.fieldDirty || (zIdle && tcs > fcq.cs * 1.1) || tcs > fcq.cs * 2.2) {
    G.fieldDirty = false;
    UI.fieldCache = { cs: tcs, g: G, idx: G.idx, can: D.buildFieldLayer(G, tcs, fdpr) };
    D.setCtx(ctx);
  }
  // 2.11.5: земля целиком (фон за полем, поле, продавливаемый снег) — одна готовая картинка размером с экран:
  // пересобирается, только когда сдвинули/приблизили поле или в снегу появились следы (не чаще ~7 раз в секунду).
  // Раньше каждый кадр трижды заливался весь экран — на слабых телефонах это была треть кадра.
  var shk = G.shake > 0, cvM = ctx.canvas, gc = UI.gcache, useGC = !shk && !VS0 && !Z.cachesOff() && cvM && cvM.width * cvM.height <= 9e6;
  var groundOps = function (c, snow, noField) {
    c.fillStyle = reg.tint; c.fillRect(0, 0, W, H);
    c.fillStyle = reg.ground; c.globalAlpha = 0.55;
    c.beginPath(); for (var sp = 0; sp < 60; sp++) { var sx0 = ((sp * 197.3 + L.fx * 0.3) % W + W) % W, sy0 = ((sp * 83.7 + L.fy * 0.3) % H + H) % H; c.moveTo(sx0 + cs * 0.9, sy0); c.ellipse(sx0, sy0, cs * 0.9, cs * 0.35, 0, 0, 7); } c.fill();
    c.globalAlpha = 1;
    if (noField) return;
    c.save(); c.beginPath(); c.rect(L.vp.x, L.vp.y, L.vp.w, L.vp.h); c.clip();
    var FPg = D.fieldPad(G.L); c.drawImage(UI.fieldCache.can, L.fx - FPg.l * cs, L.fy - FPg.t * cs, L.BW + (FPg.l + FPg.r) * cs, L.BH + (FPg.t + FPg.b) * cs);
    if (snow) { c.save(); UI.frameClip(c); try { if (Z.drawSnowLayer) Z.drawSnowLayer(G, c, X, Y, cs); if (Z.drawYard) gcYard = Z.drawYard(c, X, Y, cs); } catch (eS) { if (window.__rep) window.__rep(eS); } c.restore(); }   // двор вражеской базы — тоже часть земли
    c.restore();
  };
  UI.gcSnow = false; UI.gcYard = false; var gcYard = false;
  if (useGC) {
    if (!gc) gc = UI.gcache = { can: document.createElement('canvas'), base: '', t: -9 };
    var SS = Z._snowS, sv = SS && SS.G === G ? (SS.ver || 0) : -1;
    var gbase = [cvM.width, cvM.height, Z.DPR, W, H, L.fx, L.fy, cs, L.vp.x, L.vp.y, L.vp.w, L.vp.h, G.info.region].join('|');
    // 2.11.8: поле двигают пальцем (вид меняется кадр за кадром) — слой земли не пересобираем в каждом кадре:
    // при простом сдвиге (масштаб тот же) переносим готовый слой на сдвиг поля, пересобираем, когда поле остановится;
    // при изменении масштаба — рисуем прямо
    var gbase2 = [cvM.width, cvM.height, Z.DPR, W, H, cs, L.vp.x, L.vp.y, L.vp.w, L.vp.h, G.info.region].join('|'), panning = false;
    if (gc.base !== gbase && gc.t2 !== undefined && t - gc.t2 < 0.25 && t >= gc.t2) {
      gc.t2 = t;
      if (gc.base2 === gbase2 && gc.g === G && gc.fc === UI.fieldCache) panning = true; else { gc.base = ''; useGC = false; }
    } else if (gc.base !== gbase) gc.t2 = t;
    if (panning) {
      var pdx = Math.round((L.fx - gc.fx0) * Z.DPR), pdy = Math.round((L.fy - gc.fy0) * Z.DPR);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = reg.tint; ctx.fillRect(0, 0, cvM.width, cvM.height); ctx.drawImage(gc.can, pdx, pdy); ctx.restore();
      UI.gcSnow = true; UI.gcYard = !!gc.yard; useGC = false;
    } else
    if (useGC && (gc.base !== gbase || gc.fc !== UI.fieldCache || gc.g !== G) || useGC && (gc.sv !== sv && (t - gc.t > (Z.perfPick ? Z.perfPick(0.14, 0.2, 0.33) : 0.14) || t < gc.t))) {
      if (gc.can.width !== cvM.width || gc.can.height !== cvM.height) { gc.can.width = cvM.width; gc.can.height = cvM.height; }
      var gx = gc.can.getContext('2d', { alpha: false });   // непрозрачный: перенос на экран — простое копирование, без смешивания
      gx.setTransform(1, 0, 0, 1, 0, 0); gx.clearRect(0, 0, gc.can.width, gc.can.height); gx.setTransform(Z.DPR, 0, 0, Z.DPR, 0, 0);
      groundOps(gx, true); gc.base = gbase; gc.base2 = gbase2; gc.fx0 = L.fx; gc.fy0 = L.fy; gc.fc = UI.fieldCache; gc.g = G; gc.sv = sv; gc.t = t; gc.yard = gcYard;
    }
    if (panning) { } else if (useGC) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(gc.can, 0, 0); ctx.restore();
    UI.gcSnow = true; UI.gcYard = !!gc.yard; } else groundOps(ctx, false, shk);
  } else groundOps(ctx, false, shk);
  ctx.save();
  ctx.beginPath(); ctx.rect(L.vp.x, L.vp.y, L.vp.w, L.vp.h); ctx.clip();
  if (shk) ctx.translate((Math.random() - 0.5) * cs * 0.25 * G.shake, (Math.random() - 0.5) * cs * 0.25 * G.shake);
  var FP = D.fieldPad(G.L); if (shk) ctx.drawImage(UI.fieldCache.can, L.fx - FP.l * cs, L.fy - FP.t * cs, L.BW + (FP.l + FP.r) * cs, L.BH + (FP.t + FP.b) * cs);
  // земля (норы, следы, сетка, подсветка) — по рамке поля вместе с запасом вокруг клеток
  ctx.save(); UI.frameClip(ctx);
  // двор базы уже в слое земли: следы, сетка и стрелки пути под ним, как раньше, — не рисуются поверх двора
  if (UI.gcYard && Z.yardRect) { var YR = Z.yardRect(X, Y, cs); if (YR) { ctx.beginPath(); ctx.rect(-1e4, -1e4, 3e4, 3e4); ctx.rect(YR[0], YR[1], YR[2], YR[3]); ctx.clip('evenodd'); } }
  drawDecals(G, cs, t);
  drawBuildGrid(G, cs, t);
  // входы
  var warn = Z.canCallWave() && G.phase !== 'build' || G.phase === 'build';
  (G.L.entrances || []).forEach(function (e) { D.entrance(X(e[0] + 0.5), Y(e[1] + 0.5), cs, t, warn && G.phase !== 'wave'); });
  drawPathPreview(G, cs, t);
  if (Z.drawUnder) {
    // 2.11.5: телефон, уровень с водой — вода (каустики, блики, пена), мосты и всё «под ногами» обновляются 10 раз в секунду
    // в своём слое размером с экран, а каждый кадр слой лишь переносится (вода — две узорные заливки на всю воду каждый кадр)
    var uc = UI.ucache, useU = false;   // 2.11.6: выключено — в отдельном слое вода рисовалась не вся (на телефонах река была узкой полоской)
    if (useU) {
      if (!uc) uc = UI.ucache = { can: document.createElement('canvas'), base: '', t: -9 };
      if (uc.base !== gbase || uc.g !== G || t - uc.t >= 0.1 || t < uc.t) {
        if (uc.can.width !== cvM.width || uc.can.height !== cvM.height) { uc.can.width = cvM.width; uc.can.height = cvM.height; }
        var ux = uc.can.getContext('2d'); ux.setTransform(1, 0, 0, 1, 0, 0); ux.clearRect(0, 0, uc.can.width, uc.can.height); ux.setTransform(Z.DPR, 0, 0, Z.DPR, 0, 0);
        ux.save(); ux.beginPath(); ux.rect(L.vp.x, L.vp.y, L.vp.w, L.vp.h); ux.clip(); UI.frameClip(ux);
        if (UI.gcYard && Z.yardRect) { var YR2 = Z.yardRect(X, Y, cs); if (YR2) { ux.beginPath(); ux.rect(-1e4, -1e4, 3e4, 3e4); ux.rect(YR2[0], YR2[1], YR2[2], YR2[3]); ux.clip('evenodd'); } }
        D.setCtx(ux); try { Z.drawUnder(ux, X, Y, cs, t); } catch (eU) { if (window.__rep) window.__rep(eU); } finally { D.setCtx(ctx); }
        ux.restore(); uc.base = gbase; uc.g = G; uc.t = t;
      }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(uc.can, 0, 0); ctx.restore();
    } else Z.drawUnder(ctx, X, Y, cs, t);
  }
  // объекты по глубине: земля обрезана по полю, а вышки, герои, сани и постройки у края могут выступать за рамку
  ctx.restore();
  // 2.11.4: рамка поля — поверх земли, во всю толщину по всему кругу: раньше земля прикрывала её внутреннюю половину,
  // а у стены города рамка перерисовывалась целиком — линия становилась толще «ступенькой»
  (function () { var F = UI.frame(); D.rr(F.x, F.y, F.w, F.h, F.r); ctx.lineWidth = Math.max(2, cs * 0.08); ctx.strokeStyle = OL; ctx.stroke(); })();
  ctx.save(); var OM = UI.objMargin(cs); ctx.beginPath(); ctx.rect(L.fx - OM.x, L.fy - OM.t, L.BW + OM.x * 2, L.BH + OM.t + OM.b); ctx.clip();
  var objs = [];
  for (var k in G.towers) { var tw = G.towers[k]; if (!(UI.drag && UI.drag.tw === tw && UI.drag.moved)) objs.push({ y: tw.r + 0.6, f: drawTowerObj, o: tw }); }
  for (var b in G.barricades) objs.push({ y: G.barricades[b].r + 0.55, f: drawBarricade, o: G.barricades[b] });
  var LL = G.L;
  (G.fires || []).forEach(function (fr) { objs.push({ y: fr.y + 0.2, f: function () { ctx.globalAlpha = Math.min(1, fr.t / 3); D.fire(X(fr.x), Y(fr.y + 0.1), cs * 0.45, t + fr.x); ctx.globalAlpha = 1; } }); });
  for (var dk in LL.drift) { (function (k) { var dc = k % LL.W, dr = Math.floor(k / LL.W), lf = LL.hgt[dr][dc] ? 0.32 : 0; objs.push({ y: dr + 0.3, f: function () { D.drift(X(dc + 0.5), Y(dr + 0.5 - lf), cs, LL.drift[k], G.dtrail[k] || 0); } }); })(+dk); }
  for (var bk in LL.bush) { (function (k) { var bc = k % LL.W, br = Math.floor(k / LL.W), lf = LL.hgt[br][bc] ? 0.32 : 0; objs.push({ y: br + 0.62, f: function () { D.bush(X(bc + 0.5), Y(br + 0.5 - lf), cs, t, G.sway[k] ? G.sway[k].a : 0, k); } }); })(+bk); }
  (G.structs || []).forEach(function (st) { objs.push({ y: st.r + 0.6, f: function () { var lf = (LL.hgt[st.r][st.c] ? 0.32 : 0) + (Z.cellLift ? Z.cellLift(st.c, st.r) : 0); D.struct(st, X(st.c + 0.5), Y(st.r + 0.72 - lf), cs, t); } }); });
  for (var tk in G.traps) { var trp = G.traps[tk]; D.trap(trp, X(trp.c + 0.5), Y(trp.r + 0.5 - (LL.hgt && LL.hgt[trp.r] && LL.hgt[trp.r][trp.c] ? 0.32 : 0) - (Z.cellLift ? Z.cellLift(trp.c, trp.r) : 0)), cs, t); }
  for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (!e.dead && !e.air) objs.push({ y: Z.enemyPos(e).y + e.lane * 0.3 + (e.siege ? 1.5 : 0), f: drawEnemyObj, o: e }); }
  if (G.L.type === 'escort') {
    objs.push({ y: Z.sleighPos().y + 0.2, f: drawSleighObj });
    var en = G.L.end, st = G.L.start;
    objs.push({ y: en[1] + 0.9, f: function () { drawArch(X(en[0] + 0.5), Y(en[1] + 0.95), cs); } });
  } else {
    var fo = G.L.fort;
    // крепость просвечивает, когда у стен враги — их видно во время штурма
    var nearFort = G.enemies.some(function (e) { return !e.dead && (e.siege || (Math.abs(e.x - fo[0] - 0.5) < 1.6 && e.y > fo[1] - 1.6)); });
    G.fortAlpha = (G.fortAlpha === undefined ? 1 : G.fortAlpha) + ((nearFort ? 0.5 : 1) - (G.fortAlpha === undefined ? 1 : G.fortAlpha)) * 0.15;
    if (G.L.greatWall) { objs.push({ y: fo[1] - 1.6, f: function () { D.greatWall(G, X, Y, cs, t, G.hp / G.hpMax, 'town'); } }); objs.push({ y: fo[1] + 0.9, f: function () { D.greatWall(G, X, Y, cs, t, G.hp / G.hpMax, 'wall'); } }); }   // 2.11.5: крыши города — позади вышек и героев нижнего ряда
    objs.push({ y: fo[1] + 0.95, f: function () {
      // у стены во всю ширину ворота стоят на нижнем крае рамки и обрезаются по нему, как стена
      var gw = !!G.L.greatWall, fd = function () { if (gw) { ctx.save(); D.frameClip(G.L, X, Y, cs); } D.fortress(X(fo[0] + 0.5), Y(fo[1] + 0.92), cs, G.hp / G.hpMax, G.fortHit || 0, t); if (gw) ctx.restore(); };
      if (G.fortAlpha > 0.97) fd(); else if (Z.fortCached && Z.fortCached(G)) { ctx.save(); ctx.globalAlpha *= G.fortAlpha; fd(); ctx.restore(); }   // 2.11.5: крепость — одна готовая картинка, прозрачность — прямо при переносе, без отдельного слоя
      else withLayer(G.fortAlpha, fd, 1, gw ? null : [X(fo[0] + 0.5) - cs * 2.4, Y(fo[1] + 0.92) - cs * 3.6, cs * 4.8, cs * 4.3]);
      if (gw) D.frameBottom(G.L, X, Y, cs);
    } });
  }
  (G.squad || []).forEach(function (U) { objs.push({ y: U.y + 0.05, f: drawHero, o: U }); });
  if (G.L.landmark) { var lm = G.L.landmark; objs.push({ y: lm.r + 1.9, f: function () { D.landmark(G.info.region, X(lm.c + 1), Y(lm.r + 1.9), cs, t); } }); }
  if (Z.drawObjs) Z.drawObjs(objs, X, Y, cs, t);
  objs.sort(function (a, b) { return a.y - b.y; });
  if (Z.glBegin) Z.glBegin(ctx);   // 2.13: готовые кадры объектов — пачками на WebGL2 (v32gl, пока ?gl=1)
  try { objs.forEach(function (o) { o.f(o.o); }); } finally { if (Z.glEnd) Z.glEnd(ctx); }
  // 2.13 (прототип ?sp=1, v33sp): дальше — на верхний холст поверх слоя кадров, с той же обрезкой
  if (Z.spTop) { var tcx = Z.spTop(ctx, L.vp, [L.fx - OM.x, L.fy - OM.t, L.BW + OM.x * 2, L.BH + OM.t + OM.b]); if (tcx) { ctx = tcx; D.setCtx(tcx); } }
  // рентген: враги за деревьями, домами и вышками видны полупрозрачным силуэтом
  // 2.8: только те враги, что действительно заслонены (вышкой, постройкой, кустом, крепостью), и слой — лишь по их рамке
  if (!(Z.save && Z.save.fxXray === false)) { var xr = xrayList(G); if (xr.list.length) withLayer(0.32, function () { for (var xi = 0; xi < xr.list.length; xi++) drawEnemyObj(xr.list[xi]); }, 0.5, xr.rect); }
  // воздушные
  for (var j = 0; j < G.enemies.length; j++) { var a = G.enemies[j]; if (!a.dead && a.air && !(Z.enemySprite && Z.enemySprite(a, X(a.x), Y(a.y), cs))) D.enemy(a, X(a.x), Y(a.y), cs, t); }   // 2.12: летающие — общими кадрами
  for (var s = 0; s < G.shots.length; s++) D.shot(G.shots[s], X, Y, cs, t);
  var pB = Z.cachesOff() ? null : {};
  for (var f = 0; f < G.fx.length; f++) {
    var fx = G.fx[f];
    if (fx.k === 'hspike' && Z.fxDepth) continue;   // 2.11.5: ледяные шипы — в сортировке по глубине (за героем — позади него)
    if (fx.k === 'p' && pB) { if (fx.t >= 0) { var pa = Math.max(0, 1 - fx.t / fx.dur), pk = Math.round(pa * 6); if (pk > 0) (pB[pk] || (pB[pk] = [])).push(fx); } continue; }   // снежные брызги — пачками
    if (fx.k === 'bliz') drawBlizFx(fx); else if (fx.k === 'santa') drawSantaFx(fx); else D.fx(fx, X, Y, cs, t, L.B);
  }
  // 2.11.5: белые брызги (их бывает 100+) — одной заливкой на каждую ступень прозрачности, а не по кружку
  if (pB) { ctx.fillStyle = '#fff'; for (var pk2 in pB) { var pl = pB[pk2]; ctx.globalAlpha = pk2 / 6; ctx.beginPath(); for (var pi = 0; pi < pl.length; pi++) { var pf = pl[pi], ppx = X(pf.x), ppy = Y(pf.y), prr = cs * pf.r; ctx.moveTo(ppx + prr, ppy); ctx.arc(ppx, ppy, prr, 0, Math.PI * 2); } ctx.fill(); } ctx.globalAlpha = 1; }
  // 2.10.3: эффекты могли оставить прозрачность или режим смешивания — ночной слой тогда становился почти невидимым
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  drawWeather(G, cs, t);
  if (Z.drawOver) Z.drawOver(ctx, X, Y, cs, t);
  if (G.blizT > 0 || G.adBliz) { ctx.save(); UI.frameClip(ctx); ctx.globalAlpha = 0.14; ctx.fillStyle = '#dff3ff'; var FRb = UI.frame(); ctx.fillRect(FRb.x, FRb.y, FRb.w, FRb.h); ctx.globalAlpha = 1; drawSnowStorm(); ctx.restore(); }
  // подсветка выбранного
  if (UI.menu && UI.menu.kind === 'build' && UI.press && /^b_/.test(UI.press)) {
    var pt = UI.press.slice(2), ps = Z.towerStat(pt, 1, Z.save.research), hill = G.L.grid[UI.menu.r][UI.menu.c] === 3, prg = ps.range * (hill ? 1.25 : 1) * (G.L.hgt && G.L.hgt[UI.menu.r] && G.L.hgt[UI.menu.r][UI.menu.c] ? 1.2 : 1) * (Z.hk.rangeMul ? Z.hk.rangeMul({ c: UI.menu.c, r: UI.menu.r }) : 1);   // 2.11.4: круг — с бонусом высоты, как в бою
    ctx.beginPath(); ctx.arc(X(UI.menu.c + 0.5), Y(UI.menu.r + 0.5), prg * cs, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,220,90,0.14)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,220,90,0.9)'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]);
  }
  if (UI.sel && G.towers[Z.cellKey(UI.sel.c, UI.sel.r)] === UI.sel) {
    var stt = Z.towerStat(UI.sel.type, UI.sel.lvl, Z.save.research, UI.sel.branch), rg = stt.range * (UI.sel.hill ? 1.25 : 1) * (UI.sel.high ? 1.2 : 1) * (Z.hk.rangeMul ? Z.hk.rangeMul(UI.sel) : 1);
    ctx.beginPath(); ctx.arc(X(UI.sel.c + 0.5), Y(UI.sel.r + 0.5), rg * cs, 0, Math.PI * 2); ctx.fillStyle = 'rgba(90,200,255,0.12)'; ctx.fill(); ctx.strokeStyle = 'rgba(90,200,255,0.8)'; ctx.lineWidth = 2; ctx.stroke();
  }
  // тексты
  for (var q = 0; q < G.texts.length; q++) {
    var tx = G.texts[q], p = tx.t / tx.dur;
    ctx.globalAlpha = (p > 0.7 ? (1 - p) / 0.3 : 1) * (tx.dmg ? 0.72 : 1);
    var tsz = Math.max(tx.dmg ? 9.5 : 12, cs * 0.36 * (tx.sz || 1)) * (p < 0.15 ? 0.7 + p * 2 : 1);   // 2.7.21: не мельче 9,5 (урон) и 12 (остальное) на любом масштабе
    D.text(tx.s, X(tx.x), Y(tx.y), tsz, tx.c, 'center', 'middle', Math.max(2, tsz * 0.2));
    ctx.globalAlpha = 1;
  }
  // перетаскивание
  if (UI.drag && UI.drag.moved) {
    var dt = UI.drag.tw, cell = UI.cellAt(UI.drag.x, UI.drag.y);
    if (cell) {
      var tgt = G.towers[Z.cellKey(cell.c, cell.r)];
      var okMerge = tgt && tgt !== dt && tgt.type === dt.type && tgt.lvl === dt.lvl && dt.lvl < Z.TOWER_MAX;
      var okMove = Z.canBuildAt(cell.c, cell.r);
      if (okMerge || okMove) { D.rr(X(cell.c) + 2, Y(cell.r) + 2, cs - 4, cs - 4, cs * 0.2); ctx.fillStyle = okMerge ? 'rgba(120,255,140,0.35)' : 'rgba(255,255,255,0.3)'; ctx.fill(); }
    }
    // подсветить такие же вышки
    for (var k2 in G.towers) { var o2 = G.towers[k2]; if (o2 !== dt && o2.type === dt.type && o2.lvl === dt.lvl && dt.lvl < Z.TOWER_MAX) { ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 8); D.circ(X(o2.c + 0.5), Y(o2.r + 0.5), cs * 0.48, null); ctx.strokeStyle = '#7dff8a'; ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1; } }
    D.tower(dt, UI.drag.x, UI.drag.y + cs * 0.3, cs * 1.1, t);
  }
  ctx.restore();
  ctx.restore();
  if (VS0) { vsExit(); L = UI.L; cs = L.cs; }
  if (Z.drawNightOuter) Z.drawNightOuter(ctx, G, L, cs);   // после снятия обрезки по области поля — ночью темнеют и боковые полосы экрана
  var hpf = (G.L.type === 'escort' ? G.sleigh.hp : G.hp) / G.hpMax;
  if (hpf < 0.4 && G.phase !== 'won') { var vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7); vg.addColorStop(0, 'rgba(255,0,0,0)'); vg.addColorStop(1, 'rgba(220,30,40,' + ((0.4 - hpf) * 1.2 * (0.7 + 0.3 * Math.sin(Z.time * 5))).toFixed(2) + ')'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); }
  if (G.flash > 0) { ctx.globalAlpha = G.flash; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  drawMenu();
  drawHud();
  drawBanner();
  drawMinimap(G);
  drawTutorial();
}
// рисует во временный слой и накладывает с прозрачностью (рисовалки внутри сами трогают globalAlpha)
// k — доля разрешения слоя (силуэтам «рентгена» хватает половины: вчетверо меньше точек очищать и накладывать каждый кадр)
// rect — [x, y, w, h] в экранных точках или список таких: очищается, рисуется и накладывается только там (2.8: в разы дешевле на телефоне)
function withLayer(alpha, fn, k, rect) {
  k = k || 1;
  var main = ctx, cv = main.canvas, lw = Math.max(2, Math.ceil(cv.width * k)), lh = Math.max(2, Math.ceil(cv.height * k)), key = k === 1 ? 'layerCan' : 'layerCanH';
  if (!UI[key] || UI[key].width !== lw || UI[key].height !== lh) { UI[key] = document.createElement('canvas'); UI[key].width = lw; UI[key].height = lh; }
  var lc = UI[key].getContext('2d'), m = main.getTransform(), R = [];
  if (rect) {
    var sx = Math.hypot(m.a, m.b) * k, sy = Math.hypot(m.c, m.d) * k, ex = m.e * k, ey = m.f * k;
    (typeof rect[0] === 'number' ? [rect] : rect).forEach(function (q) {
      var x0 = Math.max(0, Math.floor(q[0] * sx + ex) - 2), y0 = Math.max(0, Math.floor(q[1] * sy + ey) - 2), x1 = Math.min(lw, Math.ceil((q[0] + q[2]) * sx + ex) + 2), y1 = Math.min(lh, Math.ceil((q[1] + q[3]) * sy + ey) + 2);
      if (x1 > x0 && y1 > y0) R.push([x0, y0, x1, y1]);
    });
    // пересекающиеся прямоугольники сливаются: иначе общий кусок наложится дважды
    for (var i = 0; i < R.length; i++) for (var j = i + 1; j < R.length; j++) { var A = R[i], B = R[j]; if (A[0] < B[2] && B[0] < A[2] && A[1] < B[3] && B[1] < A[3]) { R[i] = [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.max(A[2], B[2]), Math.max(A[3], B[3])]; R.splice(j, 1); j = i; } }
    if (!R.length) return;
  } else R.push([0, 0, lw, lh]);
  lc.setTransform(1, 0, 0, 1, 0, 0); lc.save(); lc.beginPath();
  R.forEach(function (q) { lc.clearRect(q[0], q[1], q[2] - q[0], q[3] - q[1]); lc.rect(q[0], q[1], q[2] - q[0], q[3] - q[1]); });
  if (rect) lc.clip();
  lc.setTransform(m.a * k, m.b * k, m.c * k, m.d * k, m.e * k, m.f * k);
  ctx = lc; D.setCtx(lc);
  try { fn(); } finally { ctx = main; D.setCtx(main); lc.restore(); }
  main.save(); main.setTransform(1, 0, 0, 1, 0, 0); main.globalAlpha = alpha;
  R.forEach(function (q) { var w = q[2] - q[0], h = q[3] - q[1]; main.drawImage(UI[key], q[0], q[1], w, h, q[0] / k, q[1] / k, w / k, h / k); });
  main.restore();
}
// враги, которых заслоняет что-то высокое, нарисованное позже (ниже по экрану): вышки, постройки, кусты, крепость, ориентир, сани
function xrayList(G) {
  var occ = [], L = G.L, k;
  for (k in G.towers) { var tw = G.towers[k]; occ.push(tw.c + 0.5, tw.r + 0.6, 0.85, 1.7); }
  (G.structs || []).forEach(function (st) { occ.push(st.c + 0.5, st.r + 0.6, 0.9, 1.7); });
  for (k in (L.bush || {})) { var bk = +k; occ.push(bk % L.W + 0.5, Math.floor(bk / L.W) + 0.62, 0.8, 1.4); }
  if (L.fort && L.type !== 'escort') occ.push(L.fort[0] + 0.5, L.fort[1] + 0.95, L.greatWall ? 99 : 1.7, 2.6);
  if (L.landmark) occ.push(L.landmark.c + 1, L.landmark.r + 1.9, 1.6, 2.8);
  if (L.type === 'escort' && Z.sleighPos) { var sp = Z.sleighPos(); occ.push(sp.x, sp.y + 0.2, 1.1, 1.4); }
  var list = [], rects = [], cs = UI.L.cs;
  for (var i = 0; i < G.enemies.length; i++) {
    var e = G.enemies[i]; if (e.dead || e.air) continue;
    var p = Z.enemyPos(e), ey = p.y + e.lane * 0.3 + (e.siege ? 1.5 : 0), hit = false;
    for (var j = 0; j < occ.length; j += 4) { var dy = occ[j + 1] - ey; if (dy > 0 && dy < occ[j + 3] && Math.abs(occ[j] - p.x) < occ[j + 2]) { hit = true; break; } }
    if (!hit) continue;
    list.push(e); var sz = (e.size || 1) * (e.boss ? 1.8 : 1) * (e.elite ? 1.15 : 1);
    rects.push([X(p.x) - cs * 0.95 * sz, Y(p.y) - cs * (1.5 + (e.lift || 0) * 0.4) * sz, cs * 1.9 * sz, cs * (1.95 + (e.lift || 0) * 0.4) * sz]);
  }
  return { list: list, rect: rects };
}
// мини-карта для больших полей и стрелки к врагам за краем экрана
function drawMinimap(G) {
  var L = UI.L, v = L.vp;
  if (L.BW <= v.w + 2 && L.BH <= v.h + 2) return;
  var noMap = !!(UI.sel || UI.menu);
  var ib = 40 * S, ix = (L.portrait ? v.x + v.w : L.bot.x) - ib - 6 * S, iy = v.y + (L.inT || 0) + 6 * S;
  if (!noMap) button('mmToggle', ix, iy, ib, ib, { r: 10 * S, c1: UI.mmOpen ? '#ffd54a' : '#5f74b8', c2: UI.mmOpen ? COL.goldD : '#43579a', pulse: !UI.mmUsed, fn: function () { UI.mmOpen = !UI.mmOpen; UI.mmUsed = true; }, draw: function (bx, by, bw, bh) {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * S; ctx.strokeRect(bx + bw * 0.22, by + bh * 0.25, bw * 0.56, bh * 0.44); ctx.fillStyle = '#ff6a6a'; ctx.fillRect(bx + bw * 0.45, by + bh * 0.5, bw * 0.1, bw * 0.1); ctx.fillStyle = '#ffd54a'; ctx.fillRect(bx + bw * 0.3, by + bh * 0.33, bw * 0.08, bw * 0.08); } });
  if (!UI.mmOpen) noMap = true;
  var mw = Math.min(118 * S, v.w * 0.32), k = mw / G.L.W, mh = G.L.H * k;
  if (mh > v.h * 0.35) { mh = v.h * 0.35; k = mh / G.L.H; mw = G.L.W * k; }
  var mx = v.x + v.w - mw - 6 * S, my = iy + ib + 6 * S;
  if (!noMap) button('minimap', mx, my, mw, mh, { r: 6 * S, c1: 'rgba(230,238,252,0.92)', c2: 'rgba(0,0,0,0)', fn: function () { var p = UI.downXY; if (p) UI.centerOn((p.x - mx) / k, (p.y - my) / k); }, draw: function () {
    ctx.fillStyle = '#b9c7e4'; for (var r = 0; r < G.L.H; r++) for (var c = 0; c < G.L.W; c++) { var gv = G.L.grid[r][c]; if (gv === 1) ctx.fillRect(mx + c * k, my + r * k, k, k); else if (gv === 6) { ctx.fillStyle = '#4c9a6a'; ctx.fillRect(mx + c * k + k * 0.2, my + r * k + k * 0.2, k * 0.6, k * 0.6); ctx.fillStyle = '#b9c7e4'; } else if (gv === 4) { ctx.fillStyle = '#7fc6ee'; ctx.fillRect(mx + c * k, my + r * k, k, k); ctx.fillStyle = '#b9c7e4'; } }
    for (var tk in G.towers) { var tw = G.towers[tk]; ctx.fillStyle = '#ffd54a'; ctx.fillRect(mx + tw.c * k + k * 0.15, my + tw.r * k + k * 0.15, k * 0.7, k * 0.7); }
    (G.structs || []).forEach(function (s) { ctx.fillStyle = '#9a5cd8'; ctx.fillRect(mx + s.c * k, my + s.r * k, k, k); });
    if (G.L.fort) { ctx.fillStyle = '#e8484f'; ctx.fillRect(mx + (G.L.fort[0] - 1) * k, my + (G.L.fort[1] - 1) * k, k * 3, k * 2); }
    G.enemies.forEach(function (e) { if (e.dead) return; ctx.fillStyle = e.boss ? '#ff2a2a' : '#e8484f'; ctx.beginPath(); ctx.arc(mx + e.x * k, my + e.y * k, Math.max(1.5, k * (e.boss ? 0.6 : 0.35)), 0, Math.PI * 2); ctx.fill(); });
    (G.squad || []).forEach(function (U) { if (U.dead) return; ctx.fillStyle = Z.ALLIES[U.type].col; ctx.beginPath(); ctx.arc(mx + U.x * k, my + U.y * k, Math.max(2, k * 0.45), 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); });
    var vx0 = (v.x - L.fx) / L.cs, vy0 = (v.y - L.fy) / L.cs, vw = v.w / L.cs, vh = v.h / L.cs;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(mx + Math.max(0, vx0) * k, my + Math.max(0, vy0) * k, Math.min(G.L.W, vw) * k, Math.min(G.L.H, vh) * k);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.strokeRect(mx, my, mw, mh);
  } });
  // стрелки к опасности за краем экрана
  G.enemies.forEach(function (e) {
    if (e.dead || !(e.siege || e.atkTime > 0 || e.boss || e.dleft < 4)) return;
    var sx = X(e.x), sy = Y(e.y);
    if (sx > v.x && sx < v.x + v.w && sy > v.y && sy < v.y + v.h) return;
    var cx = v.x + v.w / 2, cy = v.y + v.h / 2, ang = Math.atan2(sy - cy, sx - cx), ax = Math.max(v.x + 18 * S, Math.min(v.x + v.w - 18 * S, sx)), ay = Math.max(v.y + 18 * S, Math.min(v.y + v.h - 18 * S, sy));
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Z.time * 8);
    D.poly([12 * S, 0, -8 * S, -9 * S, -4 * S, 0, -8 * S, 9 * S], e.boss ? '#ff2a2a' : '#ff6a6a', 2 * S); ctx.restore(); ctx.globalAlpha = 1;
  });
}
// союзник: рисунок по типу
D.ally = function (type, x, y, R, o) {
  if (type === 'moroz') D.moroz(x, y, R, o);
  else if (type === 'sneg') D.snegurochka(x, y, R * 0.92, o);
  else if (type === 'belka') D.belka(x, y, R, o);
  else D.plombir(x, y, R, o);
};
// рост героев на поле относительно Деда Мороза: белка и кот маленькие, Пломбир-богатырь выше всех
UI.heroK = { eskimo: 1.3, belka: 0.55, kot: 0.6, kolobok: 0.75, plombir: 1.55 };
function drawHero(H) {
  H = H || Z.G.hero;
  var G = Z.G, cs = UI.L.cs, hl = (G.L.hgt[Math.floor(H.y)] && G.L.hgt[Math.floor(H.y)][Math.floor(H.x)] ? 0.32 : 0) + (Z.liftAt ? Z.liftAt(H.x, H.y) : 0); H.lift = (H.lift || 0) + (hl - (H.lift || 0)) * 0.2; var x = X(H.x), y = Y(H.y - H.lift);
  if (H.type === 'sneg' && G.santaFly && !H.dead && (!Z.flyRider || Z.flyRider(G) === 'sneg')) {   // 2.11.5: Снегурочка улетела в своих санях — на поле её нет, на месте — искры
    var sq = (Z.time * 3) % 1; for (var si = 0; si < 6; si++) { var sa = si / 6 * Math.PI * 2 + Z.time * 2; ctx.globalAlpha = 0.7 * (1 - sq * 0.5); D.star(x + Math.cos(sa) * cs * 0.3, y - cs * 0.35 + Math.sin(sa) * cs * 0.2, cs * 0.07, si % 2 ? '#fff' : '#9fe3ff'); } ctx.globalAlpha = 1;
    return; }
  if (H.dead) {
    ctx.globalAlpha = 0.35; D.ally(H.type, X(H.home.x), Y(H.home.y), cs * 0.4 * (UI.heroK[H.type] || 1), { dir: 1 }); ctx.globalAlpha = 1;
    D.text(Math.ceil(H.respawn) + '', X(H.home.x), Y(H.home.y) - cs * 0.55, cs * 0.34, '#fff', 'center', 'middle', 3);
    return;
  }
  if (UI.heroSel === H) { ctx.globalAlpha = 0.6 + 0.3 * Math.sin(Z.time * 8); D.ell(x, y, cs * 0.45, cs * 0.18, null); ctx.strokeStyle = '#7dff8a'; ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(x, y, H.r * cs, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(125,255,138,0.45)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([]); }
  if (H.moving) { var mtx = X(H.tx), mty = Y(H.ty), mtD = function () { D.circ(mtx, mty, cs * 0.08, 'rgba(125,255,138,0.8)'); }; if (!(Z.glSprite && Z.glSprite('hmv|' + Math.round(cs * 4), mtx, mty, cs * 0.2, cs * 0.2, cs * 0.1, cs * 0.1, mtD))) mtD(); }   // 2.13: в пачке — готовым кадром
  // готовность фирменного приёма — дуга под ногами, горит, когда готов
  if (!Z.promoClean) {   // 2.11.5: в промо-съёмке без индикаторов
  var up = H.ready ? 1 : H.ult === undefined ? 0 : Math.max(0, Math.min(1, 1 - H.ult / 14));
  // 2.13: в пачке WebGL2 (v32gl) дуга — готовым кадром: заполнение 48 ступенями, мерцание готового приёма — 8
  var ulA = up >= 1 ? (Z.glOn && Z.glOn() ? 0.6 + 0.4 * Math.sin(Math.round(((Z.time * 6) % (Math.PI * 2)) / (Math.PI / 4)) * Math.PI / 4) : 0.6 + 0.4 * Math.sin(Z.time * 6)) : 0, upq = Z.glOn && Z.glOn() ? Math.round(up * 48) / 48 : up;
  var ulD = function () { ctx = D.ctx; ctx.beginPath(); ctx.ellipse(x, y + cs * 0.02, cs * 0.34, cs * 0.13, 0, -Math.PI / 2, -Math.PI / 2 + upq * Math.PI * 2); ctx.strokeStyle = up >= 1 ? 'rgba(255,213,74,' + ulA + ')' : Z.ALLIES[H.type].col; ctx.lineWidth = Math.max(2, cs * 0.05); ctx.stroke(); }, mc = ctx;
  if (!(Z.glSprite && Z.glSprite(['hult', H.type, Math.round(upq * 48), up >= 1 ? ulA.toFixed(2) : '', Math.round(cs * 4)].join('|'), x, y + cs * 0.02, cs * 0.8, cs * 0.4, cs * 0.4, cs * 0.2, ulD))) ulD();
  ctx = mc;
  }
  if (H.atk > 0) { ctx.globalAlpha = H.atk / 0.3 * 0.5; var akD = function () { D.circ(x, y - cs * 0.3, cs * 0.5, '#dff4ff'); }; if (!(Z.glSprite && Z.glSprite('hak|' + Math.round(cs * 4), x, y - cs * 0.3, cs * 1.1, cs * 1.1, cs * 0.55, cs * 0.55, akD))) akD(); ctx.globalAlpha = 1; }   // 2.13: прозрачность — при переносе кадра
  if (H.hitT > 0) { ctx.save(); ctx.translate(Math.sin(Z.time * 60) * 1.5, 0); }
  var bob = H.moving ? Math.abs(Math.sin(H.walk)) * cs * 0.06 : Math.sin(Z.time * 2) * cs * 0.015;
  ctx.save(); ctx.translate(x, y - bob);
  if (H.atk > 0 && H.type === 'plombir') { var pp = 1 - H.atk / (H.atkD || 0.3), lw0 = pp < 0.28 ? -0.08 * (pp / 0.28) : pp < 0.55 ? -0.08 + 0.26 * ((pp - 0.28) / 0.27) : 0.18 * (1 - (pp - 0.55) / 0.45); ctx.rotate(H.dir * lw0); }
  else if (H.atk > 0 && H.type === 'moroz') {   // 2.11.5: замах назад, наклон в удар и приседание в момент удара
    var mp = 1 - H.atk / (H.atkD || 0.3), ml = mp < 0.4 ? -0.08 * (1 - (1 - mp / 0.4) * (1 - mp / 0.4)) : mp < 0.5 ? -0.08 + 0.2 * ((mp - 0.4) / 0.1) : mp < 0.64 ? 0.12 : 0.12 * (1 - (mp - 0.64) / 0.36), mq = mp >= 0.5 && mp < 0.64 ? 1 - (mp - 0.5) / 0.14 : 0;
    ctx.rotate(H.dir * ml); ctx.scale(1 + mq * 0.08, 1 - mq * 0.1);
  }
  else if (H.atk > 0) { var sw = Math.sin(H.atk / 0.3 * Math.PI); ctx.rotate(H.dir * sw * 0.12); ctx.scale(1 + sw * 0.08, 1 + sw * 0.08); }
  if (H.atk > (H._ap || 0) + 1e-4) H.atkD = H.atk; H._ap = H.atk;
  var hR = cs * 0.4 * (UI.heroK[H.type] || 1), hO = { dir: H.dir, walk: H.moving, atk: H.atk > 0, atkP: H.atk > 0 ? 1 - H.atk / (H.atkD || 0.3) : -1, beam: H.beamT > 0 ? 1 - H.beamT / 0.65 : -1, beamA: H.beamA };
  if (Z.heroSprite) Z.heroSprite(H, hR, hO, function () { D.ally(H.type, 0, 0, hR, hO); }); else D.ally(H.type, 0, 0, hR, hO);
  ctx.restore();
  if (H.atk > 0.15 && H.type === 'moroz') { ctx.globalAlpha = (H.atk - 0.15) / 0.15; D.flake(x + H.dir * cs * 0.3, y - cs * 0.95, cs * 0.18, '#ffffff', 2); ctx.globalAlpha = 1; }
  if (H.hitT > 0) ctx.restore();
  var bw = cs * 0.7, bh = Math.max(3, cs * 0.07), bx = x - bw / 2, by = y - (Z.heroBarTop ? Z.heroBarTop(H.type, cs) : cs * 0.95) - bh;   // 2.11.5: над головой по росту героя
  if (Z.promoClean) return;
  var hc = Z.ALLIES[H.type].col, lx = bx - Math.max(cs * 0.1, 4), lsz = Math.max(9.5, cs * 0.2);
  // 2.13: в пачке WebGL2 — полоска прямоугольниками, уровень — готовым кадром
  if (Z.glRect && Z.glRect(ctx, bx, by - 1, bw, bh + 2, OL)) { Z.glRect(ctx, bx - 1, by, bw + 2, bh, OL); Z.glRect(ctx, bx, by, bw * Math.max(0, H.hp / H.max), bh, hc);
    var lvD = function () { D.text('' + H.lvl, lx, by + bh / 2, lsz, '#ffd54a', 'center', 'middle', 2); };
    if (!Z.glSprite(['hlvl', H.lvl, Math.round(lsz * 4)].join('|'), lx, by + bh / 2, lsz * 2.4, lsz * 1.6, lsz * 1.2, lsz * 0.8, lvD)) lvD();
    return; }
  ctx.fillStyle = OL; D.rr(bx - 1, by - 1, bw + 2, bh + 2, 2); ctx.fill();
  ctx.fillStyle = hc; ctx.fillRect(bx, by, bw * Math.max(0, H.hp / H.max), bh);
  D.text('' + H.lvl, lx, by + bh / 2, lsz, '#ffd54a', 'center', 'middle', 2);
}
// стрелки пути следующей волны
function drawPathPreview(G, cs, t) {
  if (!(G.phase === 'build' || G.phase === 'between' || G.phase === 'wave') || !G.nav) return;
  if (G.phase === 'wave' && !(UI.menu || UI.drag)) return;
  if (G.L.type === 'escort' && G.phase !== 'build') return;
  // стрелки: обычные враги (красные) и хитрые сосульки (голубые) — видно, как маршрут меняется от стройки
  var profs = [['walk', '#ff5a5f'], ['sneak', '#5ac8ff']];
  if (G.idx < 1) profs = [profs[0]];
  ctx.save();
  G.L.entrances.forEach(function (en, ei) {
    profs.forEach(function (pr, pi) {
      var p = Z.tracePath(en[0], en[1], pr[0]);
      for (var i = 0; i < p.length - 1; i++) {
        var ph = ((i - t * 3 + pi * 2) % 4 + 4) % 4; if (ph > 1.6) continue;
        var a = p[i], b = p[i + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        var amx = a[0] + 0.5 + (b[0] - a[0]) * 0.5 + pi * 0.12, amy = a[1] + 0.5 + (b[1] - a[1]) * 0.5 + pi * 0.12; ctx.save(); ctx.translate(X(amx), Y(amy - (Z.liftAt ? Z.liftAt(amx, amy) : 0))); ctx.rotate(ang);
        ctx.globalAlpha = 0.9 * (1 - ph / 1.6);
        if (!(Z.rotSprite && Z.rotSprite('parrow|' + pr[1] + '|' + Math.round(cs), 0, 0, cs * 0.4, cs * 0.36, cs * 0.2, cs * 0.18, function () { D.poly([cs * 0.17, 0, -cs * 0.11, -cs * 0.15, -cs * 0.03, 0, -cs * 0.11, cs * 0.15], pr[1], Math.max(1, cs * 0.03)); })))   // 2.12.5: стрелка — готовой картинкой
        D.poly([cs * 0.17, 0, -cs * 0.11, -cs * 0.15, -cs * 0.03, 0, -cs * 0.11, cs * 0.15], pr[1], Math.max(1, cs * 0.03));
        ctx.restore();
      }
    });
  });
  ctx.restore(); ctx.globalAlpha = 1;
}
// следы, воронки, обломки — поле боя меняется
// погода своя в каждом регионе
function drawWeather(G, cs, t) {
  if (Z.save && Z.save.fxWeather === false) return;   // 2.12.12: настройка «Погода»
  var L = UI.L, reg = G.info.region, i, x, y, BW = L.BW, BH = L.BH;
  if (reg === 0) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (i = 0; i < 40; i++) { x = L.fx + ((i * 97.3 + Math.sin(t + i) * 20) % BW); y = L.fy + ((i * 61.7 + t * 30 * (1 + i % 3)) % BH); if (!(Z.dotSprite && Z.dotSprite(x, y, 1.5 + i % 3, 'rgba(255,255,255,0.85)'))) { ctx.beginPath(); ctx.arc(x, y, 1.5 + i % 3, 0, Math.PI * 2); ctx.fill(); } } }   // 2.12: снежинки — готовыми точками
  else if (reg === 1) { for (i = 0; i < 14; i++) { x = L.fx + (i * 131.7) % BW; y = L.fy + (i * 77.1) % BH; ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 3 + i); if (!(Z.dotSprite && Z.dotSprite(x, y, cs * 0.06, '#ffd56b'))) D.circ(x, y, cs * 0.06, '#ffd56b'); } ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (i = 0; i < 20; i++) { x = L.fx + ((i * 97.3) % BW); y = L.fy + ((i * 53.7 + t * 40) % BH); ctx.fillRect(x, y, 2, 2); } }
  else if (reg === 2) { for (i = 0; i < 8; i++) { x = L.fx + ((i * 173 + t * 12) % BW); y = L.fy + (i * 89) % BH; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4 + i * 2); D.star(x, y, cs * 0.06, '#ffffff', 0); } ctx.globalAlpha = 1; }
  else if (reg === 3) { ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; for (i = 0; i < 30; i++) { x = L.fx + ((i * 97 + t * 260) % (BW + 60)) - 30; y = L.fy + ((i * 41.3 + t * 40) % BH); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 18, y - 4); ctx.stroke(); } ctx.globalAlpha = 0.12 + 0.05 * Math.sin(t * 0.5); ctx.fillStyle = '#dfe6f7'; ctx.fillRect(L.fx, L.fy, BW, BH * 0.3); ctx.globalAlpha = 1; }
  else { for (i = 0; i < 3; i++) { ctx.globalAlpha = 0.12 + 0.06 * Math.sin(t * 0.7 + i); ctx.fillStyle = ['#7dffb2', '#7fd8ff', '#c79bff'][i]; ctx.beginPath(); ctx.moveTo(L.fx, L.fy + BH * (0.05 + i * 0.05)); ctx.quadraticCurveTo(L.fx + BW / 2, L.fy + BH * (0.0 + i * 0.07) + Math.sin(t + i) * cs, L.fx + BW, L.fy + BH * (0.08 + i * 0.04)); ctx.lineTo(L.fx + BW, L.fy + BH * (0.14 + i * 0.04)); ctx.quadraticCurveTo(L.fx + BW / 2, L.fy + BH * (0.07 + i * 0.07), L.fx, L.fy + BH * (0.12 + i * 0.05)); ctx.fill(); } ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (i = 0; i < 25; i++) { x = L.fx + ((i * 97.3 + Math.sin(t * 0.5 + i) * 30) % BW); y = L.fy + ((i * 51.7 + t * 22) % BH); ctx.fillRect(x, y, 2, 2); } }
}
// 2.8: следы собираются в один контур (одна заливка вместо сотен), пятна гари и воронки — из готовых картинок, за краем экрана не рисуется ничего
var decalSpr = {};
function decalSprite(kind) {
  var key = kind + (Z.RICH === 4 ? '4' : ''); if (decalSpr[key]) return decalSpr[key];
  var cv = document.createElement('canvas'); cv.width = cv.height = 96; var g = cv.getContext('2d'), gr = g.createRadialGradient(48, 48, 4.8, 48, 48, 48);
  if (kind === 'crater') { gr.addColorStop(0, 'rgba(70,85,120,0.55)'); gr.addColorStop(0.6, 'rgba(120,140,185,0.35)'); gr.addColorStop(1, 'rgba(160,180,220,0)'); }
  else if (Z.RICH === 4) { gr.addColorStop(0, 'rgba(84,104,160,0.3)'); gr.addColorStop(1, 'rgba(120,140,190,0)'); }
  else { gr.addColorStop(0, 'rgba(95,85,95,0.32)'); gr.addColorStop(1, 'rgba(120,120,140,0)'); }
  g.fillStyle = gr; g.fillRect(0, 0, 96, 96); return (decalSpr[key] = cv);
}
// 2.11.5: следы, воронки и подпалины лежат на своём уровне земли: на плато — на его верху, внизу — не залезают на обрыв плато
function drawDecals(G, cs, t) {
  if (Z.drawSnowLayer && !UI.gcSnow) { try { Z.drawSnowLayer(G, ctx, X, Y, cs); } catch (eS) { if (window.__rep) window.__rep(eS); } }   // 2.11.5: продавливаемый снег — самый нижний слой на земле
  var L = G.L, hg = L.hgt, any = false; if (hg) for (var r0 = 0; r0 < L.H && !any; r0++) for (var c0 = 0; c0 < L.W; c0++) if (hg[r0][c0]) { any = true; break; }
  if (!any) { drawDecalsRaw(G, cs, t, null); return; }
  var up = function (c, r) { return !!(hg[r] && hg[r][c]); };
  [0, 1].forEach(function (lv) {
    ctx.save(); ctx.beginPath();
    for (var r = -1; r <= L.H; r++) for (var c = -1; c <= L.W; c++) {
      var inb = r >= 0 && r < L.H && c >= 0 && c < L.W, u = inb && up(c, r);
      if (lv === 1) { if (u) ctx.rect(X(c), Y(r - 0.32), cs, cs); }
      else if (!u) { var cut = up(c, r + 1) ? 0.32 : 0; ctx.rect(X(c) - (c < 0 ? cs * 2 : 0), Y(r) - (r < 0 ? cs * 2 : 0), cs * (c < 0 || c >= L.W ? 3 : 1) + 0.5, cs * (1 - cut) + (r < 0 || r >= L.H ? cs * 2 : 0) + 0.5); }
    }
    ctx.clip(); if (lv === 1) ctx.translate(0, -cs * 0.32);
    drawDecalsRaw(G, cs, t, lv); ctx.restore();
  });
}
function drawDecalsRaw(G, cs, t, lvF) {
  var HG = G.L.hgt, lvOf = function (d) { var r = Math.floor(d.y), c = Math.floor(d.x); return HG[r] && HG[r][c] ? 1 : 0; };
  var v = UI.L.vp, mx = cs * 1.2, vx0 = v.x - mx, vy0 = v.y - mx, vx1 = v.x + v.w + mx, vy1 = v.y + v.h + mx, i, d, x, y;
  // следы ног и полозьев: одной заливкой
  ctx.globalAlpha = 1; ctx.beginPath();
  for (i = 0; i < G.decals.length; i++) { d = G.decals[i]; if (lvF !== null && lvOf(d) !== lvF) continue; if (d.k !== 'step' || d.life !== undefined) continue; x = X(d.x); y = Y(d.y); if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue; var rx = cs * 0.05 * d.s, ry = cs * 0.035 * d.s; ctx.moveTo(x + rx * Math.cos(d.rot), y + rx * Math.sin(d.rot)); ctx.ellipse(x, y, rx, ry, d.rot, 0, Math.PI * 2); }
  ctx.fillStyle = 'rgba(110,130,180,0.28)'; ctx.fill();
  ctx.beginPath();
  for (i = 0; i < G.decals.length; i++) { d = G.decals[i]; if (lvF !== null && lvOf(d) !== lvF) continue; if (d.k !== 'track' || d.life !== undefined) continue; x = X(d.x); y = Y(d.y); if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue;
    var ca = Math.cos(d.rot), sa = Math.sin(d.rot);
    [[-cs * 0.14 * d.s], [cs * 0.09 * d.s]].forEach(function (oy) { var x0 = -cs * 0.12, x1 = cs * 0.12, y0 = oy[0], y1 = oy[0] + cs * 0.05;
      ctx.moveTo(x + x0 * ca - y0 * sa, y + x0 * sa + y0 * ca); ctx.lineTo(x + x1 * ca - y0 * sa, y + x1 * sa + y0 * ca); ctx.lineTo(x + x1 * ca - y1 * sa, y + x1 * sa + y1 * ca); ctx.lineTo(x + x0 * ca - y1 * sa, y + x0 * sa + y1 * ca); ctx.closePath(); }); }
  ctx.fillStyle = 'rgba(90,105,150,0.25)'; ctx.fill();
  for (i = 0; i < G.decals.length; i++) {
    d = G.decals[i]; if (lvF !== null && lvOf(d) !== lvF) continue; x = X(d.x); y = Y(d.y); if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue;
    var a = d.life !== undefined ? Math.min(1, d.life / 3) : 1;
    if ((d.k === 'step' || d.k === 'track') && d.life === undefined) continue;
    ctx.globalAlpha = a;
    if (d.k === 'step') { ctx.fillStyle = 'rgba(110,130,180,0.28)'; ctx.beginPath(); ctx.ellipse(x, y, cs * 0.05 * d.s, cs * 0.035 * d.s, d.rot, 0, Math.PI * 2); ctx.fill(); }
    else if (d.k === 'track') { ctx.save(); ctx.translate(x, y); ctx.rotate(d.rot); ctx.fillStyle = 'rgba(90,105,150,0.25)'; ctx.fillRect(-cs * 0.12, -cs * 0.14 * d.s, cs * 0.24, cs * 0.05); ctx.fillRect(-cs * 0.12, cs * 0.09 * d.s, cs * 0.24, cs * 0.05); ctx.restore(); }
    else if (d.k === 'scorch' || d.k === 'crater') {
      var r = cs * d.s * (d.k === 'crater' ? 0.5 : 0.42);
      ctx.drawImage(decalSprite(d.k), x - r, y - r * 0.68, r * 2, r * 1.36);
      if (d.k === 'crater') {
        ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath();
        for (var q = 0; q < 7; q++) { var an = q / 7 * Math.PI * 2 + d.rot, cx = x + Math.cos(an) * r * 0.95, cy = y + Math.sin(an) * r * 0.62, cr = r * (0.16 + (q % 3) * 0.05); ctx.moveTo(cx + cr, cy); ctx.arc(cx, cy, cr, 0, Math.PI * 2); }
        ctx.fill();
        ctx.fillStyle = 'rgba(60,50,60,0.5)'; for (var q2 = 0; q2 < 4; q2++) ctx.fillRect(x + Math.cos(d.rot + q2 * 1.9) * r * 0.4, y + Math.sin(d.rot + q2 * 2.3) * r * 0.25, cs * 0.03, cs * 0.03);
      }
    } else if (d.k === 'crack') {
      ctx.strokeStyle = 'rgba(60,80,130,0.5)'; ctx.lineWidth = cs * 0.04; ctx.beginPath();
      for (var c2 = 0; c2 < 6; c2++) { var an2 = d.rot + c2; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(an2) * cs * d.s * 0.5, y + Math.sin(an2) * cs * d.s * 0.35); ctx.lineTo(x + Math.cos(an2 + 0.3) * cs * d.s * 0.9, y + Math.sin(an2 + 0.3) * cs * d.s * 0.6); }
      ctx.stroke();
    } else if (d.k === 'rubble' || d.k === 'planks') {
      for (var p = 0; p < 6; p++) { var px = x + Math.cos(d.rot + p * 1.7) * cs * 0.22, py = y + Math.sin(d.rot + p * 2.3) * cs * 0.12; ctx.save(); ctx.translate(px, py); ctx.rotate(d.rot + p); ctx.fillStyle = d.k === 'planks' ? '#8a5a35' : (p % 2 ? '#9aa6bf' : d.col || '#c9d6ea'); ctx.fillRect(-cs * 0.08, -cs * 0.04, cs * 0.16, cs * 0.08); ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.strokeRect(-cs * 0.08, -cs * 0.04, cs * 0.16, cs * 0.08); ctx.restore(); }
      if (d.k === 'rubble') { ctx.globalAlpha = a * 0.5 * (0.6 + 0.4 * Math.sin(t * 2 + d.rot)); D.circ(x, y - cs * 0.35 - (t * 8 % 10) * cs * 0.03, cs * 0.1, 'rgba(120,120,140,0.6)'); }
    }
  }
  ctx.globalAlpha = 1;
}
// сетка свободных клеток во время стройки — понятно, что ставить можно куда угодно
function drawBuildGrid(G, cs, t) {
  if (G.phase !== 'build' && G.phase !== 'between' && !UI.menu && !(UI.drag && UI.drag.moved)) return;
  var cells = function () { ctx.fillStyle = 'rgba(80,110,180,0.10)'; for (var r = 0; r < G.L.H; r++) for (var c = 0; c < G.L.W; c++) if (Z.canBuildAt(c, r)) { D.rr(X(c) + cs * 0.08, Y(r) + cs * 0.08, cs * 0.84, cs * 0.84, cs * 0.18); ctx.fill(); } };
  // 2.12.5: сетка свободных клеток — готовой картинкой (сотни заливок за кадр), заново при смене построек
  if (Z.sceneSprite) { var L0 = G.L, sig = [Object.keys(G.towers).join(','), Object.keys(G.barricades || {}).join(','), Object.keys(G.traps || {}).join(','), (G.structs || []).length, (G.walls || []).length, Object.keys(G.swamp || {}).length, Object.keys(L0.ice || {}).length, Object.keys(L0.bridges || {}).length, G.waterVer || 0, (L0.closedEnt || []).length].join('|'); Z.sceneSprite('bgrid|' + sig, cells); }
  else cells();
}
function drawTowerObj(tw) {
  var GL = Z.G && Z.G.L, onSt = !!(GL && ((GL.stumps && GL.stumps[tw.r * GL.W + tw.c]) || (GL.ledges && GL.ledges[tw.r * GL.W + tw.c])));   // 2.11.4: на пеньке вышка стоит на спиле, без каменной площадки
  var cs = UI.L.cs, lf = (tw.high ? 0.32 : 0) + (Z.cellLift ? Z.cellLift(tw.c, tw.r) : 0) + (onSt ? 0.19 : 0), b = tw.build || 0;
  // тень и каменная площадка — вместе с вышкой в готовой картинке (2.11.5), иначе — каждый кадр
  var padDraw = function (ctx) {
    if (!onSt) { ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#28386e'; ctx.beginPath(); ctx.ellipse(X(tw.c + 0.66), Y(tw.r + 0.82 - lf), cs * 0.4, cs * 0.12, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  // каменная площадка-цилиндр под вышкой
    var px = X(tw.c + 0.5), py = Y(tw.r + 0.7 - lf);
    if (!onSt && !(D.twPad && D.twPad(tw, px, py, cs))) {
    ctx.fillStyle = '#7f8aa6'; ctx.beginPath(); ctx.ellipse(px, py + cs * 0.06, cs * 0.36, cs * 0.13, 0, 0, Math.PI); ctx.lineTo(px - cs * 0.36, py); ctx.ellipse(px, py, cs * 0.36, cs * 0.13, 0, Math.PI, 0, true); ctx.fill();
    ctx.fillStyle = '#c9d2e6'; ctx.beginPath(); ctx.ellipse(px, py, cs * 0.36, cs * 0.13, 0, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = Math.max(1, cs * 0.03); ctx.strokeStyle = OL; ctx.stroke();
    }
  };
  var liteT = Z.perfLite && Z.perfLite();   // 2.11.5: телефон — отдача выстрела тоже из готовой картинки, обновление 12 раз в секунду
  if (Z.towerSprite && !(b > 0) && Z.towerSprite(tw, X(tw.c + 0.5), Y(tw.r + 0.66 - lf), cs, onSt, padDraw)) return;   // 2.12: общие кадры по типу/уровню/углу (v30o)
  if (Z.cachedDraw && !(b > 0) && !(tw.recoil > 0.02 && !liteT) && !(tw.pop > 0)) {   // 2.11.5: вышка — готовой картинкой, 20 раз в секунду (выстрел и постройка — каждый кадр)
    var tx0 = X(tw.c + 0.5), ty0 = Y(tw.r + 0.66 - lf);
    Z.cachedDraw('tw' + tw.c + '_' + tw.r, [tw.type, tw.lvl, tw.branch || '', Math.round((tw.hp || 1) / (tw.max || 1) * 10), cs.toFixed(1), (Z.save.skins && Z.save.skins.twT && Z.save.skins.twT[tw.type]) || '', onSt ? 1 : 0, cosSig()].join('|'), tx0 - cs * 0.9, ty0 - cs * 1.9, cs * 1.8, cs * 2.3, function () { padDraw(D.ctx); D.tower(tw, tx0, ty0, cs * 1.18, Z.time); }, Z.perfPick ? Z.perfPick(20, 12, 8) : 20);
    return;
  }
  padDraw(ctx);
  if (b > 0) { var k = 1 - b / 0.5, sc = k < 0.7 ? k / 0.7 * 1.1 : 1.1 - (k - 0.7) / 0.3 * 0.1; ctx.save(); ctx.translate(X(tw.c + 0.5), Y(tw.r + 0.66 - lf)); ctx.scale(1, Math.max(0.05, sc)); ctx.translate(-X(tw.c + 0.5), -Y(tw.r + 0.66 - lf)); }
  D.tower(tw, X(tw.c + 0.5), Y(tw.r + 0.66 - lf), cs * 1.18, Z.time);
  if (b > 0) ctx.restore();
}
var cosT = -1, cosS = '';
function cosSig() { if (cosT !== Z.time) { cosT = Z.time; cosS = (Z.save && Z.save.cos && JSON.stringify(Z.save.cos)) || ''; } return cosS; }
function drawEnemyObj(e) {
  var cs = UI.L.cs, ex = X(e.x), ey = Y(e.y - (e.lift || 0) * 0.32);
  if (e.elite) { var pu = 0.5 + 0.5 * Math.sin(Z.time * 5 + e.ph); ctx.globalAlpha = 0.25 + pu * 0.2; ctx.beginPath(); ctx.ellipse(ex, ey, cs * 0.42 * e.size, cs * 0.16 * e.size, 0, 0, Math.PI * 2); ctx.fillStyle = '#c66bff'; ctx.fill(); ctx.globalAlpha = 1; }
  // 2.7.21: враг не возникает из воздуха — выпрыгивает из сугроба с облачком снега
  var ag = e.age == null ? 1 : Math.min(1, e.age / 0.4);
  if (ag < 1 && !(e.emT > 0) && e.corpse === undefined) {
    var ak = 1 - Math.pow(1 - ag, 3), asc = 0.2 + 0.8 * ak + Math.sin(ag * Math.PI) * 0.12;
    ctx.save(); ctx.translate(ex, ey); ctx.scale(asc, asc); ctx.translate(-ex, -ey); D.enemy(e, ex, ey, cs, Z.time); ctx.restore();
    ctx.globalAlpha = 0.75 * (1 - ag); for (var ap = 0; ap < 5; ap++) { var aa = ap * 1.26 + e.ph; D.circ(ex + Math.cos(aa) * cs * (0.15 + ag * 0.3) * e.size, ey - cs * 0.05 + Math.sin(aa) * cs * 0.08, cs * (0.1 + ag * 0.08) * e.size, '#ffffff'); } ctx.globalAlpha = 1;
  } else if (Z.enemySprite && Z.enemySprite(e, ex, ey, cs)) {   // 2.12: общие кадры анимации по типу/направлению/фазе шага (v30o)
  } else if (Z.posSprite && !e.boss && !(e.hitT > 0 && !(Z.perfLite && Z.perfLite())) && !(e.dying > 0) && e.corpse === undefined && (e.size || 1) < 1.7) {   // на телефоне и вспышка попадания — из готовой картинки (11 раз в секунду она туда попадает)   // 2.11.5: враг — готовой картинкой, 15 раз в секунду
    var esz = e.size || 1, ew = cs * 2.6 * esz, eh = cs * 3.0 * esz;
    Z.posSprite(e, ex, ey, ew, eh, ew / 2, eh * 0.8, [e.type, e.dir > 0 ? 1 : -1, Math.round((e.hp / (e.max || 1)) * 24), e.slow > 0 ? 1 : 0, e.elite ? 1 : 0, e.iced ? 1 : 0, e.stunT > 0 ? 1 : 0, e.shield > 0 ? 1 : 0, e.armor || 0, Math.round(cs * 4)].join('|'), Z.perfPick ? Z.perfPick(15, 11, 8) : 15, function () { D.enemy(e, ex, ey, cs, Z.time); }, [e.type, e.dir > 0 ? 1 : -1, e.slow > 0 ? 1 : 0, e.elite ? 1 : 0, e.iced ? 1 : 0, e.stunT > 0 ? 1 : 0, e.shield > 0 ? 1 : 0, e.armor || 0, e.air ? 1 : 0, Z.LANG].join('|'));
  } else D.enemy(e, ex, ey, cs, Z.time);
  if (e.elite) { var cy = ey - cs * 0.62 * e.size; ctx.fillStyle = '#ffd54a'; ctx.strokeStyle = '#3a2a5a'; ctx.lineWidth = Math.max(1, cs * 0.03); ctx.beginPath(); ctx.moveTo(ex - cs * 0.12, cy); ctx.lineTo(ex - cs * 0.12, cy - cs * 0.1); ctx.lineTo(ex - cs * 0.06, cy - cs * 0.05); ctx.lineTo(ex, cy - cs * 0.13); ctx.lineTo(ex + cs * 0.06, cy - cs * 0.05); ctx.lineTo(ex + cs * 0.12, cy - cs * 0.1); ctx.lineTo(ex + cs * 0.12, cy); ctx.closePath(); ctx.fill(); ctx.stroke(); }
}
function drawSleighObj() {
  var G = Z.G, p = Z.sleighPos(), cs = UI.L.cs, m = G.L.main, i = Math.min(m.length - 1, Math.floor(G.sleigh.f) + 1), j = Math.max(0, i - 1);
  // направление по участку пути на 3 клетки вперёд, с задержкой: сани не дёргаются на зигзагах
  var k2 = Math.min(m.length - 1, j + 3), want = m[k2][0] > m[j][0] ? 1 : m[k2][0] < m[j][0] ? -1 : 0;
  if (!UI.sDir) UI.sDir = want || 1;
  if (want && want !== UI.sDir) { UI.sDirT = (UI.sDirT || 0) + 1 / 60; if (UI.sDirT > 0.7) { UI.sDir = want; UI.sDirT = 0; } } else UI.sDirT = 0;
  var dir = UI.sDir;
  var onF = function (tp) { return (G.squad || []).some(function (U) { return U.type === tp; }); };
  D.sleighRider = !onF('sneg') ? 'sneg' : !onF('moroz') ? 'moroz' : 'none';   // 2.11.5: без двойников — если Снегурочка воюет на поле, правит Дед Мороз
  var slT = G.sleigh.moving && G.sleigh.stopT <= 0 ? Z.time : 0; if (!(Z.sleighSprite && Z.sleighSprite(X(p.x), Y(p.y + 0.3), cs, dir, slT, G.sleighHit || 0))) D.sleigh(X(p.x), Y(p.y + 0.3), cs, dir, slT, G.sleighHit || 0);   // 2.12: сани — общими кадрами (v30o)
  D.sleighRider = null;
  if (Z.promoClean) return;   // 2.11.5: в промо-съёмке без полоски саней
  var bw = cs * 1.2, bx = X(p.x) - bw / 2, by = Y(p.y) - cs * 1.05;
  ctx.fillStyle = OL; D.rr(bx - 1, by - 1, bw + 2, cs * 0.13 + 2, 3); ctx.fill();
  ctx.fillStyle = '#6fe07a'; ctx.fillRect(bx, by, bw * Math.max(0, G.sleigh.hp / G.hpMax), cs * 0.13);
}
function drawBarricade(b) {
  if (Z.drawBarr) { try { Z.drawBarr(b, X(b.c + 0.5), Y(b.r + 0.75), UI.L.cs, Z.time); return; } catch (e) { if (window.__rep) window.__rep(e); } }   // 2.11.5: новая баррикада с обликами (v30b)
  var cs = UI.L.cs, x = X(b.c + 0.5), y = Y(b.r + 0.75), l = Math.max(1.5, cs * 0.05), sh = b.hitT > 0 ? Math.sin(Z.time * 80) * cs * 0.03 : 0;
  D.rr(x - cs * 0.42 + sh, y - cs * 0.5, cs * 0.84, cs * 0.45, cs * 0.12); ctx.fillStyle = '#e9f2ff'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  for (var i = 0; i < 3; i++) { ctx.strokeStyle = 'rgba(120,150,200,0.6)'; ctx.lineWidth = l * 0.6; ctx.beginPath(); ctx.moveTo(x - cs * 0.42 + sh, y - cs * 0.5 + (i + 1) * cs * 0.11); ctx.lineTo(x + cs * 0.42 + sh, y - cs * 0.5 + (i + 1) * cs * 0.11); ctx.stroke(); }
  [-0.3, 0, 0.3].forEach(function (o) { D.poly([x + o * cs - cs * 0.06 + sh, y - cs * 0.5, x + o * cs + sh, y - cs * 0.72, x + o * cs + cs * 0.06 + sh, y - cs * 0.5], COL.ice, l * 0.6); });
  var bw = cs * 0.8; ctx.fillStyle = OL; ctx.fillRect(x - bw / 2 - 1, y - cs * 0.82 - 1, bw + 2, cs * 0.09 + 2); ctx.fillStyle = '#8fd0ff'; ctx.fillRect(x - bw / 2, y - cs * 0.82, bw * Math.max(0, b.hp / b.max), cs * 0.09);
}
function drawArch(x, y, cs) {
  var l = Math.max(1.5, cs * 0.05);
  ctx.strokeStyle = OL; ctx.lineWidth = l * 3; ctx.beginPath(); ctx.moveTo(x - cs * 0.45, y); ctx.lineTo(x - cs * 0.45, y - cs * 0.9); ctx.moveTo(x + cs * 0.45, y); ctx.lineTo(x + cs * 0.45, y - cs * 0.9); ctx.stroke();
  ctx.strokeStyle = COL.wood; ctx.lineWidth = l * 1.6; ctx.stroke();
  D.rr(x - cs * 0.6, y - cs * 1.15, cs * 1.2, cs * 0.32, cs * 0.08); ctx.fillStyle = COL.red; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  D.star(x, y - cs * 0.99, cs * 0.1, COL.gold, l * 0.6);
  for (var i = 0; i < 5; i++) D.circ(x - cs * 0.4 + i * cs * 0.2, y - cs * 0.78, cs * 0.04, ['#ff5a5f', '#ffd54a', '#5ac8ff', '#9dff6a', '#ff8fd6'][(i + Math.floor(Z.time * 3)) % 5]);
}
function drawBlizFx(f) {
  var L = UI.L, p = f.t / f.dur;
  var FR = UI.frame(); ctx.save(); UI.frameClip(ctx); ctx.globalAlpha = 0.4 * Math.sin(p * Math.PI); ctx.fillStyle = '#e8f6ff'; ctx.fillRect(FR.x, FR.y, FR.w, FR.h); ctx.globalAlpha = 1; ctx.restore();
}
function drawSnowStorm() {
  var L = UI.L, t = Z.time;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  var FR = UI.frame();
  for (var i = 0; i < 70; i++) { var x = FR.x + ((i * 97.3 + t * 160) % FR.w), y = FR.y + ((i * 53.7 + t * 90 + Math.sin(i) * 30) % FR.h); ctx.fillRect(x, y, 2.5, 2.5); }
}
function drawSantaFx(f) {
  var L = UI.L, p = f.t / f.dur, x = L.fx - L.cs * 2 + (L.BW + L.cs * 4) * p, y = L.fy + L.BH * 0.25 - Math.sin(p * Math.PI) * L.cs * 1.5;
  for (var i = 0; i < 12; i++) { ctx.globalAlpha = 0.8 - i * 0.06; D.star(x - i * L.cs * 0.25, y + Math.sin(i + Z.time * 10) * 4, L.cs * 0.1, i % 2 ? '#fff' : COL.gold); }
  ctx.globalAlpha = 1;
  D.sleighAir = true; D.sleigh(x, y, L.cs * 1.4, 1, Z.time, 0); D.sleighAir = false;
}
function drawScenery(groundOnly) {
  var s = S, t = Z.time;
  if (!groundOnly) {
    var mx = W * 0.86, my = Math.min(H * 0.1, 90 * s) + 30 * s, mr = 24 * s;
    if (UI.screen === 'level' && UI.L.portrait) { mx = W * 0.85; my = UI.L.fy * 0.55 + 20 * s; mr = Math.min(24 * s, UI.L.fy * 0.25); }
    if (UI.screen === 'level' && !UI.L.portrait) mr = 0;
    if (mr > 6) { ctx.globalAlpha = 0.15; D.circ(mx, my, mr * 2.2, '#fff6d6'); ctx.globalAlpha = 0.25; D.circ(mx, my, mr * 1.5, '#fff6d6'); ctx.globalAlpha = 1; D.circ(mx, my, mr, '#fff4cf'); D.circ(mx - mr * 0.3, my - mr * 0.15, mr * 0.18, '#f0e2b4'); }
  }
  ctx.fillStyle = '#26356b'; ctx.beginPath(); ctx.moveTo(0, H);
  for (var x = 0; x <= W + 20; x += 20) ctx.lineTo(x, H - H * 0.22 - Math.sin(x * 0.006) * H * 0.04 - Math.sin(x * 0.017 + 1) * H * 0.015);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  for (var i = 0; i < 8; i++) {
    var hx = (i + 0.5) * W / 8, hy = H - H * 0.22 - Math.sin(hx * 0.006) * H * 0.04 - Math.sin(hx * 0.017 + 1) * H * 0.015 + 4 * s, hw = 20 * s, hh = 14 * s;
    ctx.fillStyle = '#1b2650'; ctx.fillRect(hx - hw / 2, hy - hh, hw, hh);
    D.poly([hx - hw * 0.65, hy - hh, hx, hy - hh * 1.8, hx + hw * 0.65, hy - hh], '#e8eefc');
    ctx.fillStyle = Math.sin(t * 0.5 + i * 2) > -0.6 ? '#ffcf6b' : '#3a4670'; ctx.fillRect(hx - hw * 0.25, hy - hh * 0.7, hw * 0.22, hh * 0.35); ctx.fillRect(hx + hw * 0.05, hy - hh * 0.7, hw * 0.22, hh * 0.35);
  }
  ctx.fillStyle = '#dfe8fb'; ctx.beginPath(); ctx.moveTo(0, H);
  for (var x2 = 0; x2 <= W + 20; x2 += 20) ctx.lineTo(x2, H - H * 0.11 - Math.sin(x2 * 0.004 + 2) * H * 0.03);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  // падающий снег
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (var k = 0; k < 60; k++) { var fx = (k * 113.7 + Math.sin(t * 0.6 + k) * 20) % W, fy = (k * 71.1 + t * (18 + (k % 5) * 6)) % H; ctx.beginPath(); ctx.arc(fx < 0 ? fx + W : fx, fy, 1 + (k % 3) * 0.7, 0, Math.PI * 2); ctx.fill(); }
}
function drawStars() { for (var i = 0; i < 40; i++) { var x = (i * 137.5) % W, y = (i * 71.3) % (H * 0.9); ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.3 * Math.sin(Z.time * 1.5 + i)).toFixed(2) + ')'; ctx.fillRect(x, y, 2, 2); } }

// ---------- меню постройки / вышки ----------
function drawMenu() {
  var G = Z.G, L = UI.L, cs = L.cs, m = UI.menu;
  if (!m || UI.modal) return;
  var cx = X(m.c + 0.5), cy = Y(m.r + 0.5);
  if (m.kind === 'build') {
    var opts = Z.TOWER_ORDER.filter(function (t) { return Z.towerUnlocked(t, G.endless ? Z.unlockedLevel() : G.idx); });   // 2.12.38: в «Ночи» — вышки по сюжетному прогрессу, а не по случайной карте
    var R = Math.max(cs * 1.25, 52 * S), br = Math.max(cs * 0.55, 25 * S);
    // ограничиваем, чтобы кольцо не вылезало
    var vx0 = Math.max(L.fx, L.vp.x), vx1 = Math.min(L.fx + L.BW, L.vp.x + L.vp.w - (L.inR || 0)), vy0 = Math.max(L.fy, L.vp.y + (L.inT || 0)), vy1 = Math.min(L.fy + L.BH, L.vp.y + L.vp.h - (L.inB || 0));
    // точные края кольца по углам кнопок, чтобы ни одна не уходила за экран; ловушка — в центре кольца
    var stepA = Math.min(0.95, 5.5 / opts.length), mnx = 0, mxx = 0, mny = 0;
    opts.forEach(function (t2, i2) { var a2 = -Math.PI / 2 + (i2 - (opts.length - 1) / 2) * stepA; mnx = Math.min(mnx, Math.cos(a2) * R); mxx = Math.max(mxx, Math.cos(a2) * R); mny = Math.min(mny, Math.sin(a2) * R); });
    var cb = Math.max(br, 23 * S);
    cx = Math.max(vx0 - mnx + br + 2 * S, Math.min(vx1 - mxx - br - 2 * S, cx)); cy = Math.max(vy0 - mny + br + 2 * S, Math.min(vy1 - cb - 2 * S, cy));
    D.circ(X(m.c + 0.5), Y(m.r + 0.5), cs * 0.5, 'rgba(255,255,255,0.35)');
    opts.forEach(function (t, i) {
      var a = -Math.PI / 2 + (i - (opts.length - 1) / 2) * Math.min(0.95, 5.5 / opts.length);
      var bx = cx + Math.cos(a) * R, by = cy + Math.sin(a) * R;
      var cost = Z.towerCost(t, 1), can = G.coins >= cost;
      button('b_' + t, bx - br, by - br, br * 2, br * 2 + 6, { r: br, enabled: can, c1: can ? '#fdf7ec' : '#c9cfdc', c2: can ? COL.panelD : '#9aa3b8', fn: function () { if (UI.ghostPick && UI.ghostPick(t, m)) return; if (Z.buildTower(t, m.c, m.r)) { UI.menu = null; UI.tutStep && UI.tutStep('built'); } else Z.AU.sfx('error'); },
        draw: function (x, y, w, h) {
          var fake = { type: t, lvl: 1, ang: -0.6, recoil: 0, spin: Z.time * 3, pop: 0, stun: 0, firing: false };
          ctx.save(); ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, br - 2, 0, Math.PI * 2); ctx.clip();
          D.tower(fake, x + w / 2, y + h * 0.78, br * 1.15, Z.time); ctx.restore();
          D.rr(x + w / 2 - br * 0.75, y + h - br * 0.42, br * 1.5, br * 0.5, br * 0.25); ctx.fillStyle = OL; ctx.fill();
          D.text('' + cost, x + w / 2, y + h - br * 0.17, br * 0.38, can ? '#ffd54a' : '#ff9a9a');
        } });
    });
    var info = UI.menuHover || opts[0];
    if (UI.trapBtn) UI.trapBtn(m, cx, cy, cs);
  } else if (m.kind === 'struct') {
    var stt = m.st, sw = Math.min(L.vp.w * 0.9, 300 * S), sh = 104 * S;
    var sx0 = Math.max(L.vp.x + 6 * S, Math.min(L.vp.x + L.vp.w - sw - 6 * S, cx - sw / 2)), sy0 = cy - cs * 0.8 - sh; if (sy0 < L.vp.y + 4 * S) sy0 = cy + cs * 0.7;
    D.rr(sx0, sy0, sw, sh, 14 * S); ctx.fillStyle = 'rgba(255,253,245,0.97)'; ctx.fill(); ctx.lineWidth = 2.5 * S; ctx.strokeStyle = OL; ctx.stroke();
    D.text(T('st_' + stt.type), sx0 + sw / 2, sy0 + 16 * S, 15 * S, '#6b3fa0');
    var sl = D.wrap(stt.type === 'watch' ? T('st_watchD') : stt.type === 'palisade' ? T('st_palD') : T('st_D'), sw - 20 * S, 11 * S);
    for (var q = 0; q < Math.min(2, sl.length); q++) D.text(sl[q], sx0 + sw / 2, sy0 + 36 * S + q * 14 * S, 11 * S, '#4a5378');
    var dem = null, ddm = 1e9; (G.squad || []).forEach(function (U) { if (U.dead) return; var d = Math.hypot(U.x - stt.c, U.y - stt.r) / (Z.ALLIES[U.type].structX); if (d < ddm) { ddm = d; dem = U; } });
    var hasH = !!dem;
    button('demol', sx0 + 14 * S, sy0 + sh - 40 * S, sw - 28 * S, 32 * S, { enabled: hasH, r: 10 * S, c1: '#ff8a3d', c2: '#d4602a', label: hasH ? T('demolish') : T('noHero'), fn: function () { Z.heroMove(stt.c + 0.5, stt.r + 1.2, dem); UI.menu = null; } });
  } else if (m.kind === 'bar') {
    // дорога: баррикада и ловушки
    var items = [];
    if (Z.canBarricade(m.c, m.r)) items.push({ id: 'barr', label: T('barricade'), cost: Z.barCost(), fn: function () { return Z.buildBarricade(m.c, m.r); }, icon: function (x, y, r) { D.rr(x - r * 0.8, y - r * 0.35, r * 1.6, r * 0.7, 3); ctx.fillStyle = COL.wood; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = OL; ctx.stroke(); } });
    Z.TRAP_ORDER.forEach(function (tp) { if (Z.trapUnlocked(tp, G.idx)) items.push({ id: 'trap_' + tp, label: T('tr_' + tp), cost: Z.TRAPS[tp].cost, en: Z.canTrap(m.c, m.r, tp), fn: function () { return Z.buildTrap(tp, m.c, m.r); }, icon: function (x, y, r) { D.trap({ type: tp, t: 0 }, x, y, r * 1.6, Z.time); } }); });
    var bw = 74 * S, bh = 66 * S, tot = items.length * (bw + 6 * S) - 6 * S;
    var vx0 = Math.max(L.fx, L.vp.x), vx1 = Math.min(L.fx + L.BW, L.vp.x + L.vp.w - (L.inR || 0));
    if (tot > vx1 - vx0 - 8 * S) { vx0 = L.vp.x; vx1 = L.vp.x + L.vp.w - (L.inR || 0); } // широкий ряд ловушек — по всему экрану, а не только над полем
    // 2.10.3: не влезает в ширину экрана — в два ряда
    var cols = Math.max(1, Math.min(items.length, Math.floor((vx1 - vx0 - 2 * S) / (bw + 6 * S)))), rows = Math.ceil(items.length / cols); tot = cols * (bw + 6 * S) - 6 * S; var bhT = rows * (bh + 6 * S) - 6 * S;
    var bx2 = Math.max(vx0 + 4 * S, Math.min(vx1 - tot - 4 * S, cx - tot / 2)), by2 = Math.max(Math.max(L.fy, L.vp.y + (L.inT || 0)) + 4 * S, cy - cs * 0.6 - bhT);
    if (by2 + bhT > cy - cs * 0.4) by2 = Math.min(cy + cs * 0.6, Math.min(L.fy + L.BH, L.vp.y + L.vp.h - (L.inB || 0)) - bhT - 4 * S);
    D.circ(cx, cy, cs * 0.5, 'rgba(255,255,255,0.35)');
    items.forEach(function (it, i) {
      var can = G.coins >= it.cost && it.en !== false;
      button(it.id, bx2 + (i % cols) * (bw + 6 * S), by2 + Math.floor(i / cols) * (bh + 6 * S), bw, bh, { enabled: can, r: 12 * S, c1: '#fdf7ec', c2: COL.panelD, fn: function () { if (it.fn()) { UI.menu = null; UI.tutStep && UI.tutStep('trap'); } else Z.AU.sfx('error'); },
        draw: function (x, y, w, h) { it.icon(x + w / 2, y + h * 0.36, 13 * S); D.text(it.label, x + w / 2, y + h * 0.66, D.fitText(it.label, w - 8 * S, 11 * S), OL); D.coin(x + w / 2 - 12 * S, y + h * 0.86, 5 * S); D.text('' + it.cost, x + w / 2 - 5 * S, y + h * 0.86, 11 * S, can ? OL : COL.red, 'left'); } });
    });
  }
}

function drawTowerCard() {
  var G = Z.G, tw = UI.sel, L = UI.L;
  if (!tw || G.towers[Z.cellKey(tw.c, tw.r)] !== tw || UI.modal) { UI.sel = null; return; }
  var st = Z.towerStat(tw.type, tw.lvl, Z.save.research, tw.branch);
  var w, h = 118 * S, x, y;
  if (L.portrait) { w = Math.min(L.sw - 16 * S, 420 * S); x = L.ox + (L.sw - w) / 2; y = L.bot.y - h - 6 * S; }
  else { w = Math.min(300 * S, L.sw * 0.34); x = L.bot.x - w - 8 * S; y = L.inT + 54 * S; }
  D.rr(x, y, w, h, 16 * S); ctx.fillStyle = 'rgba(253,247,236,0.97)'; ctx.fill(); ctx.lineWidth = 2.5 * S; ctx.strokeStyle = OL; ctx.stroke();
  var nm = tw.branch ? T('br_' + tw.type + '_' + tw.branch) : T('t_' + tw.type);
  D.text(nm, x + 14 * S, y + 18 * S, D.fitText(nm, w * 0.6, 17 * S), tw.branch ? '#b8860b' : OL, 'left');
  for (var i = 0; i < tw.lvl; i++) D.star(x + w - 18 * S - i * 16 * S, y + 18 * S, 7 * S, COL.gold, 1.5);
  var stats = Math.round(st.dmg) + ' ⚔  ' + (Math.round(st.rate * 10) / 10) + '/с  ' + (Math.round(st.range * (tw.hill ? 1.25 : 1) * (tw.high ? 1.2 : 1) * (Z.hk.rangeMul ? Z.hk.rangeMul(tw) : 1) * 10) / 10);
  D.text(T('t_' + tw.type + 'D'), x + 14 * S, y + 44 * S, Math.max(10.5, D.fitText(T('t_' + tw.type + 'D'), w - 28 * S, 12 * S)), '#4a5378', 'left');
  var hpw = w * 0.36; D.rr(x + w - 14 * S - hpw, y + 32 * S, hpw, 7 * S, 3 * S); ctx.fillStyle = '#c9cfdc'; ctx.fill(); D.rr(x + w - 14 * S - hpw, y + 32 * S, hpw * Math.max(0, tw.hp / tw.max), 7 * S, 3 * S); ctx.fillStyle = tw.hp / tw.max > 0.5 ? '#4cc77d' : tw.hp / tw.max > 0.25 ? '#ffb347' : '#ff5a5f'; ctx.fill();
  var dmgd = tw.hp < tw.max - 0.5;
  var bw = (w - (dmgd ? 50 : 40) * S) / (dmgd ? 4 : 3), by = y + 56 * S, bh = 52 * S;
  var maxed = tw.lvl >= Z.TOWER_MAX, uc = Z.towerCost(tw.type, tw.lvl), canU = !maxed && G.coins >= uc;
  var canB = maxed && !tw.branch;
  button('tUp', x + 10 * S, by, bw, bh, { enabled: canU || canB, c1: canB ? '#ffd54a' : undefined, c2: canB ? COL.goldD : undefined, pulse: canB && G.coins >= Z.branchCost(tw.type), fn: function () { if (canB) UI.openModal({ type: 'branch', tw: tw }); else Z.upgradeTower(tw); }, draw: function (bx, byy, bww, bhh) {
    if (maxed && !tw.branch) { D.text(T('branch'), bx + bww / 2, byy + bhh * 0.32, D.fitText(T('branch'), bww - 8 * S, 13 * S), '#fff', 'center', 'middle', 2.5 * S); D.coin(bx + bww / 2 - 16 * S, byy + bhh * 0.7, 7 * S); D.text(Z.fmt(Z.branchCost(tw.type)), bx + bww / 2 - 6 * S, byy + bhh * 0.7, 13 * S, '#fff', 'left', 'middle', 2.5 * S); return; }
    if (maxed) { D.text(T('max'), bx + bww / 2, byy + bhh / 2, 16 * S, '#fff', 'center', 'middle', 3 * S); return; }
    D.text(T('upgrade'), bx + bww / 2, byy + bhh * 0.32, D.fitText(T('upgrade'), bww - 10 * S, 13 * S), '#fff', 'center', 'middle', 2.5 * S);
    D.coin(bx + bww / 2 - 16 * S, byy + bhh * 0.7, 7 * S); D.text(Z.fmt(uc), bx + bww / 2 - 6 * S, byy + bhh * 0.7, 13 * S, '#fff', 'left', 'middle', 2.5 * S);
  } });
  var modes = ['first', 'strong', 'vehicle', 'close'];
  button('tMode', x + 20 * S + bw, by, bw, bh, { c1: '#5f74b8', c2: '#43579a', fn: function () { tw.mode = modes[(modes.indexOf(tw.mode) + 1) % modes.length]; }, draw: function (bx, byy, bww, bhh) {
    D.text(T('target'), bx + bww / 2, byy + bhh * 0.32, D.fitText(T('target'), bww - 10 * S, 13 * S), '#fff', 'center', 'middle', 2.5 * S);
    D.text(T('tg_' + tw.mode), bx + bww / 2, byy + bhh * 0.7, D.fitText(T('tg_' + tw.mode), bww - 10 * S, 14 * S), '#ffe9a8', 'center', 'middle', 2.5 * S);
  } });
  var back = Math.round(tw.spent * 0.7);
  if (dmgd) { var rc = Z.repairCost(tw); button('tRep', x + 40 * S + bw * 3, by, bw, bh, { enabled: G.coins >= rc, pulse: tw.hp < tw.max * 0.4, c1: '#4cc77d', c2: COL.greenD, fn: function () { Z.repairTower(tw); }, draw: function (bx, byy, bww, bhh) {
    D.text(T('repair'), bx + bww / 2, byy + bhh * 0.32, D.fitText(T('repair'), bww - 8 * S, 13 * S), '#fff', 'center', 'middle', 2.5 * S);
    D.coin(bx + bww / 2 - 14 * S, byy + bhh * 0.7, 7 * S); D.text('' + rc, bx + bww / 2 - 4 * S, byy + bhh * 0.7, 13 * S, '#fff', 'left', 'middle', 2.5 * S); } }); }
  button('tSell', x + 30 * S + bw * 2, by, bw, bh, { c1: '#ff7a7f', c2: COL.redD, fn: function () { Z.sellTower(tw); UI.sel = null; }, draw: function (bx, byy, bww, bhh) {
    D.text(T('sell'), bx + bww / 2, byy + bhh * 0.32, D.fitText(T('sell'), bww - 10 * S, 13 * S), '#fff', 'center', 'middle', 2.5 * S);
    D.text('+' + Z.fmt(back), bx + bww / 2, byy + bhh * 0.7, D.fitText('+' + Z.fmt(back), bww - 10 * S, 13 * S), '#fff', 'center', 'middle', 2.5 * S);
  } });
  UI.cardRect = { x: x, y: y, w: w, h: h };
}

// ---------- HUD ----------
function drawHud() {
  var G = Z.G, L = UI.L, tb = L.top, y = tb.y + tb.h / 2;
  var cw = Math.min(130 * S, tb.w * 0.27), x = tb.x + 8 * S;
  pill(x, y - 17 * S, cw, 34 * S); if (Z.iconCached) Z.iconCached('hudCoin', x + 16 * S, y, 30 * S, function (ox, oy) { D.coin(ox, oy, 12 * S); }); else D.coin(x + 16 * S, y, 12 * S);
  var ct = Z.fmt(G.coins); D.text(ct, x + 33 * S, y + 1, D.fitText(ct, cw - 38 * S, 19 * S), '#fff', 'left', 'middle', 3 * S);
  var hx = x + cw + 6 * S, hw = Math.min(96 * S, tb.w * 0.2);
  pill(hx, y - 17 * S, hw, 34 * S);
  var hpNow = G.L.type === 'escort' ? G.sleigh.hp : G.hp;
  if (Z.iconCached) Z.iconCached('hudHeart', hx + 16 * S, y, 26 * S, function (ox, oy) { D.heart(ox, oy, 9 * S); }); else D.heart(hx + 16 * S, y, 9 * S);
  D.text(Math.max(0, Math.ceil(hpNow)) + '', hx + 30 * S, y + 1, D.fitText('' + Math.ceil(hpNow), hw - 34 * S, 19 * S), (G.fortHit || G.sleighHit) ? '#ff9a9a' : '#fff', 'left', 'middle', 3 * S);
  // волна
  var bwid = 40 * S, rx = tb.x + tb.w - 8 * S;
  button('pause', rx - bwid, y - bwid / 2, bwid, bwid, { c1: '#5f74b8', c2: '#43579a', r: 12 * S, fn: function () { UI.openModal({ type: 'pause' }); }, draw: function (bx, by, bw, bh) {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = OL; ctx.lineWidth = 2 * S; D.rr(bx + bw * 0.3, by + bh * 0.25, bw * 0.14, bh * 0.5, 2); ctx.fill(); ctx.stroke(); D.rr(bx + bw * 0.56, by + bh * 0.25, bw * 0.14, bh * 0.5, 2); ctx.fill(); ctx.stroke(); } });
  button('speed', rx - bwid * 2 - 6 * S, y - bwid / 2, bwid, bwid, { c1: G.speed > 1 ? '#ff8a3d' : '#5f74b8', c2: G.speed > 1 ? '#d4602a' : '#43579a', r: 12 * S, fn: function () {
    // 2.10.3: ускорение — за рекламу, один раз на уровень (дальше переключается свободно до конца уровня)
    if (G.speed > 1) { G.speed = 1; return; }
    if (!G.speedAd && Z.SDK && Z.SDK.rewarded) { Z.SDK.rewarded(function () { G.speedAd = true; G.speed = 2; Z.AU.sfx('reward'); }, function () { Z.lastReward = Z.time; }); return; }
    G.speed = 2; }, draw: function (bx, by, bw, bh) {
    if (!G.speedAd && G.speed <= 1 && D.adIcon) { D.poly([bx + bw * 0.16, by + bh * 0.3, bx + bw * 0.38, by + bh * 0.48, bx + bw * 0.16, by + bh * 0.66], '#fff', 1.5 * S); D.poly([bx + bw * 0.38, by + bh * 0.3, bx + bw * 0.6, by + bh * 0.48, bx + bw * 0.38, by + bh * 0.66], '#fff', 1.5 * S); D.adIcon(bx + bw * 0.8, by + bh * 0.78, bh * 0.17); return; }
    D.poly([bx + bw * 0.22, by + bh * 0.28, bx + bw * 0.5, by + bh * 0.48, bx + bw * 0.22, by + bh * 0.68], '#fff', 1.5 * S);
    if (G.speed > 1) D.poly([bx + bw * 0.5, by + bh * 0.28, bx + bw * 0.78, by + bh * 0.48, bx + bw * 0.5, by + bh * 0.68], '#fff', 1.5 * S);
    else D.text('1', bx + bw * 0.66, by + bh * 0.48, bh * 0.38, '#fff', 'center', 'middle', 2 * S);
  } });
  var wx = hx + hw + 6 * S, ww = rx - bwid * 2 - 12 * S - wx;
  if (ww > 50 * S) {
    pill(wx, y - 17 * S, ww, 34 * S);
    var wt = G.L.type === 'escort' ? (T('sleighShort') + ' ' + G.sleigh.house + '/3') : G.endless ? ('∞ ' + T('wave') + ' ' + G.wave) : (T('wave') + ' ' + G.wave + '/' + G.waves.length);
    D.text(wt, wx + ww / 2, y + 1, D.fitText(wt, ww - 14 * S, 17 * S), G.info.type === 'boss' ? '#ffd54a' : '#fff', 'center', 'middle', 3 * S);
  }
  drawBottom();
  if (UI.drawSquadBar) UI.drawSquadBar();
  drawTowerCard();
}
function drawBottom() {
  var G = Z.G, L = UI.L, b = L.bot, pad = 8 * S;
  var skills = ['blizzard', 'bomb', 'santa'];
  var sr, wbx, wby, wbw, wbh, sxs = [], sy, sy0;
  if (L.portrait) {
    sr = Math.min(32 * S, (b.w - pad * 6) / 10);
    wbw = b.w - (sr * 2 + pad) * 3 - pad * 2.5; wbh = sr * 2 + 8 * S; wbx = b.x + b.w - wbw - pad; wby = b.y + (b.h - wbh) / 2 + 4 * S;
    sy = wby + wbh / 2 - 4 * S;
    for (var i = 0; i < 3; i++) sxs.push(b.x + pad + sr + i * (sr * 2 + pad));
  } else {
    sr = Math.min(32 * S, (b.w - pad * 2) / 2, (b.h - 96 * S) / 8);
    wbw = b.w - pad * 2; wbh = Math.min(84 * S, b.h * 0.22); wbx = b.x + pad; wby = b.y + b.h - wbh - pad;
    sy = []; for (var j = 0; j < 3; j++) { sxs.push(b.x + b.w / 2); sy.push(wby - pad * 2 - sr - (2 - j) * (sr * 2 + 12 * S)); }
  }
  sy0 = sy;
  skills.forEach(function (sk, i) {
    var sy = Array.isArray(sy0) ? sy0[i] : sy0, x = sxs[i], unlocked = Z.skillUnlocked(sk, G.idx), cd = G.skills[sk], max = Z.skillCd(sk);
    var ready = unlocked && cd <= 0 && (G.phase === 'wave' || G.phase === 'escortRun' || G.phase === 'between');
    var active = UI.aim === sk;
    button('sk_' + sk, x - sr, sy - sr, sr * 2, sr * 2 + 5, { r: sr, enabled: unlocked, c1: active ? '#ffe066' : ready ? '#ffffff' : '#c9cfdc', c2: active ? '#c9961c' : ready ? COL.panelD : '#9aa3b8',
      fn: function () {
        if (!unlocked) return;
        if (cd > 0 && !(Z.invUse && Z.invUse(sk))) { Z.AU.sfx('error'); return; }   // 2.11.5: на перезарядке — заряд из запаса, если есть
        if (sk === 'bomb') { UI.aim = UI.aim === 'bomb' ? null : 'bomb'; return; }
        Z.useSkill(sk);
      },
      draw: function (bx, by, bw, bh) {
        var cx = bx + bw / 2, cy = by + bh / 2;
        if (!unlocked) { D.text('?', cx, cy, sr * 0.9, '#fff', 'center', 'middle', 3 * S); return; }
        if (Z.iconCached) Z.iconCached('sk_' + sk, cx, cy, sr * 2, function (ox, oy) { if (sk === 'blizzard') { D.flake(ox, oy, sr * 0.55, OL, sr * 0.22); D.flake(ox, oy, sr * 0.55, '#5ac8ff', sr * 0.11); } else if (sk === 'bomb') D.gift(ox, oy + sr * 0.15, sr * 0.48, COL.red); else { var c0 = D.ctx; c0.save(); c0.translate(ox, oy + sr * 0.32); D.sleigh(0, 0, sr * 0.6, 1, 0, 0); c0.restore(); } });   // 2.11.5: значок рисуется один раз
        else if (sk === 'blizzard') { D.flake(cx, cy, sr * 0.55, OL, sr * 0.22); D.flake(cx, cy, sr * 0.55, '#5ac8ff', sr * 0.11); }
        else if (sk === 'bomb') D.gift(cx, cy + sr * 0.15, sr * 0.48, COL.red);
        else { ctx.save(); ctx.translate(cx, cy + sr * 0.32); D.sleigh(0, 0, sr * 0.6, 1, 0, 0); ctx.restore(); }   // 2.11.5: олень крупнее — сани меньше, целиком в кнопке
        if (cd > 0) {
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, sr - 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (cd / max)); ctx.closePath(); ctx.fillStyle = 'rgba(20,28,60,0.55)'; ctx.fill();
          D.text('' + Math.ceil(cd), cx, cy, sr * 0.6, '#fff', 'center', 'middle', 3 * S);
        }
        if (cd > 0 && Z.invBadge) Z.invBadge(sk, cx, cy, sr);
      } });
    // перезарядка за рекламу
    if (unlocked && cd > 4 && !G.skillAdUsed[sk + G.wave]) {
      var ab = sr * 0.62;
      button('ska_' + sk, x + sr * 0.35, sy - sr * 1.25, ab * 1.6, ab * 1.2, { r: ab * 0.4, c1: '#9a7ce8', c2: COL.purpleD, fn: function () {
        Z.SDK.rewarded(function () { G.skills[sk] = 0; G.skillAdUsed[sk + G.wave] = 1; Z.AU.sfx('reward'); }, function () { Z.lastReward = Z.time; });
      }, draw: function (bx, by, bw, bh) { D.adIcon(bx + bw / 2, by + bh / 2, bh * 0.32); } });
    }
  });
  // кнопка волны
  var can = Z.canCallWave();
  var isEsc = G.L.type === 'escort';
  var lbl, sub = '';
  if (isEsc) lbl = G.phase === 'build' ? T('start') : T('escort');
  else if (G.phase === 'between') { lbl = T('nextWave') + ' ' + (G.wave + 1); sub = Math.ceil(G.betweenT) + 'с · ' + T('callEarly') + Math.round(G.betweenT * 2); }
  else if (G.phase === 'wave' && can) { lbl = T('nextWave') + ' ' + (G.wave + 1); sub = T('callEarly') + (15 + G.wave * 3); }
  else if (G.phase === 'build') lbl = T('nextWave') + ' ' + (G.wave + 1);
  else lbl = T('wave') + ' ' + G.wave;
  button('wave', wbx, wby, wbw, wbh, { enabled: can, c1: '#ff8a3d', c2: '#d4602a', pulse: can && (G.phase === 'build' || G.phase === 'between'), fn: function () { Z.callWave(); UI.menu = null; UI.tutStep && UI.tutStep('wave'); },
    draw: function (x, y, w, h) {
      if (w < 130 * S) {
        // 2.10.3: узкая кнопка (сбоку в альбомной ориентации) — значок сверху, надпись крупно под ним
        D.poly([x + w / 2 - 7 * S, y + h * 0.16, x + w / 2 + 9 * S, y + h * 0.3, x + w / 2 - 7 * S, y + h * 0.44], '#fff', 2 * S);
        D.text(lbl, x + w / 2, y + h * (sub ? 0.6 : 0.68), D.fitText(lbl, w - 10 * S, 16 * S), '#fff', 'center', 'middle', 3 * S);
        if (sub) D.text(sub, x + w / 2, y + h * 0.84, D.fitText(sub, w - 8 * S, 11 * S), '#ffe9a8', 'center', 'middle', 2 * S);
      } else {
      D.poly([x + 14 * S, y + h * 0.3, x + 30 * S, y + h * 0.5, x + 14 * S, y + h * 0.7], '#fff', 2 * S);
      D.text(lbl, x + 36 * S + (w - 44 * S) / 2, y + h * (sub ? 0.34 : 0.5), D.fitText(lbl, w - 52 * S, 19 * S), '#fff', 'center', 'middle', 3 * S);
      if (sub) D.text(sub, x + 36 * S + (w - 44 * S) / 2, y + h * 0.72, D.fitText(sub, w - 52 * S, 12 * S), '#ffe9a8', 'center', 'middle', 2 * S);
      }
      // превью врагов
      if (!isEsc && G.wave < G.waves.length && (G.phase === 'build' || G.phase === 'between') && !sub) {
        var types = {}; G.waves[G.wave].list.forEach(function (s) { types[s.type] = 1; });
      }
    } });
  // превью следующей волны над кнопкой
  if (!isEsc && G.wave < G.waves.length && G.phase !== 'won' && G.phase !== 'lost') {
    var tps = {}, order = []; G.waves[G.wave].list.forEach(function (s) { if (!tps[s.type]) { tps[s.type] = 0; order.push(s.type); } tps[s.type]++; });
    var icS = 24 * S, total = order.length * (icS + 30 * S), px0 = wbx + wbw / 2 - total / 2, py0 = wby - icS * 0.6;
    if (L.portrait) py0 = L.fy + L.BH + Math.max(4 * S, (b.y - L.fy - L.BH) / 2) - icS * 0.25;
    // на телефоне превью стоит в одном ряду с портретами отряда: прижато вправо и не залезает на кнопки «Все сюда» и «Замена»
    if (L.portrait) { var per = icS + 30 * S, nfit = Math.max(0, Math.floor((W - 8 * S - ((UI._sqRight || 0) + 10 * S)) / per)); if (order.length > nfit) order = order.slice(0, nfit); total = order.length * per; px0 = W - 8 * S - total; }
    // 2.10.3: сбоку (альбомная) — превью в несколько рядов, не за краем экрана
    var pcols = order.length, per2 = icS + 30 * S;
    // 2.11.5: сбоку (альбомная) — слева от кнопки волны, на тёмной подложке: над кнопкой стоят навыки, подписи «x4» залезали на них
    if (!L.portrait) {
      var leftLim = (L.sa ? L.sa.x : 0) + 10 * S, room = b.x - 10 * S - leftLim;
      pcols = Math.max(1, Math.min(order.length, 5, Math.floor(room / per2)));
      var prows = Math.ceil(order.length / pcols); pcols = Math.ceil(order.length / prows); px0 = b.x - 8 * S - pcols * per2 + 6 * S; py0 = wby + wbh / 2 - icS * 0.55;
      ctx.save(); ctx.globalAlpha = 0.6; D.rr(px0 - 8 * S, py0 - (prows - 1) * (icS + 6 * S) - 3 * S, pcols * per2 + 4 * S, prows * (icS + 6 * S) + 6 * S, 12 * S); ctx.fillStyle = '#1b2448'; ctx.fill(); ctx.restore();
    }
    if (!L.portrait || b.y - (L.fy + L.BH) > icS * 0.8) {
      order.forEach(function (tp, k0) {
        var k = k0 % pcols, prow = Math.floor(k0 / pcols), pyk = py0 - prow * (icS + 6 * S);
        var ex = px0 + k * (icS + 30 * S) + icS / 2;
        var fake = { type: tp, size: Math.min(1.1, Z.ENEMIES[tp].size), dir: 1, walk: 0, ph: 0, hitT: 0, slow: 0, hp: 1, max: 1, air: false, boss: false };
        if (Z.iconCached) Z.iconCached('wp_' + tp, ex, pyk + icS * 0.2, icS * 1.6, function (ox, oy) { D.enemy(fake, ox, oy + icS * 0.35, icS * 0.36 / 0.31 / fake.size, 0); });
        else { ctx.save(); D.enemy(fake, ex, pyk + icS * 0.55, icS * 0.36 / 0.31 / fake.size, 0); ctx.restore(); }
        D.text('x' + tps[tp], ex + icS * 0.55, pyk + icS * 0.25, 12 * S, '#fff', 'left', 'middle', 2.5 * S);
      });
    }
  }
  // реклама: монеты на старт / метель на волну с боссом
  var chipH = 34 * S;
  var chipW = Math.min(240 * S, L.sw * 0.62), chipX = L.sa.x + (L.sa.w - chipW) / 2, chipY = L.inT + 8 * S;
  if (G.phase === 'build' && G.wave === 0 && !G.adStartUsed && !UI.sel && !UI.menu && Z.save.tut >= 3) {
    adChip('adStart', chipX, chipY, chipW, chipH, T('adStart'), function () { Z.SDK.rewarded(function () { G.coins += 100; G.adStartUsed = true; Z.AU.sfx('reward'); }, function () { Z.lastReward = Z.time; }); });
  } else if (G.phase === 'build' && G.wave === 0 && G.adStartUsed && !G.adLife && !isEsc && !UI.sel && !UI.menu && Z.save.tut >= 3) {   // 2.11.5: вторая награда до боя — жизни ёлке
    adChip('adLife', chipX, chipY, chipW, chipH, Z.LANG === 'en' ? 'Ad: +5 tree lives' : 'Реклама: +5 жизней ёлке', function () { Z.SDK.rewarded(function () { G.adLife = true; G.hpMax += 5; G.hp += 5; Z.AU.sfx('reward'); }, function () { Z.lastReward = Z.time; }); });
  } else if (!isEsc && G.phase === 'between' && G.info.type === 'boss' && G.wave === G.waves.length - 1 && !G.adBliz && !UI.sel && !UI.menu) {
    adChip('adBliz', chipX, chipY, chipW, chipH, T('adBliz'), function () { Z.SDK.rewarded(function () { G.adBliz = true; Z.AU.sfx('freeze'); }, function () { Z.lastReward = Z.time; }); });
  }
  if (UI.aim === 'bomb') D.text(T('tapToBomb'), L.vp.x + L.vp.w / 2, L.vp.y + 24 * S, D.fitText(T('tapToBomb'), L.vp.w - 20 * S, 16 * S), '#ffe066', 'center', 'middle', 3 * S);
}
function adChip(id, x, y, w, h, label, fn) {
  button(id, x, y, w, h, { r: 12 * S, c1: '#9a7ce8', c2: COL.purpleD, pulse: true, fn: fn, draw: function (bx, by, bw, bh) {
    D.adIcon(bx + 22 * S, by + bh / 2 - 4 * S, 9 * S); D.text(T('ad'), bx + 22 * S, by + bh / 2 + 11 * S, Math.max(8, D.fitText(T('ad'), 36 * S, 9 * S)), '#fff', 'center', 'middle', 2 * S);
    D.text(label, bx + 32 * S + (bw - 38 * S) / 2, by + bh / 2, D.fitText(label, bw - 44 * S, 14 * S), '#fff', 'center', 'middle', 2.5 * S);
  } });
}
function drawBanner() {
  var G = Z.G, b = G.banner; if (!b || UI.modal) return;
  var L = UI.L, v0 = L.vp, bx0 = Math.max(v0.x, L.fx), bx1 = Math.min(v0.x + v0.w, L.fx + L.BW), v = { x: bx0, y: v0.y, w: Math.max(50, bx1 - bx0), h: v0.h }, a = Math.min(1, b.t * 3), sz = Math.min(v.w, v.h) * (b.big ? 0.1 : b.boss ? 0.09 : 0.075);
  var cx = v.x + v.w / 2, cy = v.y + v.h * 0.36;
  if (b.big) {
    var ap = Math.min(1, (2.8 - b.t) * 4);
    ctx.globalAlpha = a * 0.7; ctx.fillStyle = '#0b0f26'; ctx.fillRect(v.x, cy - sz * 1.1, v.w * ap, sz * (b.sub ? 2.4 : 1.8)); ctx.globalAlpha = 1;
    ctx.fillStyle = '#ff5a5f'; ctx.fillRect(v.x, cy - sz * 1.1, v.w * ap, 3); ctx.fillRect(v.x + v.w * (1 - ap), cy - sz * 1.1 + sz * (b.sub ? 2.4 : 1.8) - 3, v.w * ap, 3);
    sz *= 0.5 + 0.5 * ap;
  }
  var tx = D.fitText(b.text, v.w * 0.92, sz);
  ctx.globalAlpha = a;
  if (b.sub) {   // подзаголовок переносится в две строки и ужимается, чтобы не вылезать за край узкого экрана
    var sU = b.sub.toUpperCase(), sp = tx * 0.42, sl = D.wrap(sU, v.w * 0.92, sp);
    while (sl.length > 2 && sp > 9) { sp *= 0.9; sl = D.wrap(sU, v.w * 0.92, sp); }
    for (var si = 0; si < sl.length; si++) D.text(sl[si], cx, cy - sz * 0.62 - (sl.length > 1 ? sp * 1.1 : 0) - (sl.length - 1 - si) * sp * 1.15, D.fitText(sl[si], v.w * 0.94, sp), '#ffd54a', 'center', 'middle', 3);
  }
  D.text(b.text, cx, cy + (b.sub ? sz * 0.2 : 0), tx, b.boss ? '#ff6a6a' : '#ffd54a', 'center', 'middle', Math.max(3, tx * 0.12)); ctx.globalAlpha = 1;
}

// ---------- обучение ----------
UI.tutStep = function (ev) { var G = Z.G; if (!G) return; G.tutEv = G.tutEv || {}; G.tutEv[ev] = (G.tutEv[ev] || 0) + 1; };
// подсказки по ходу игры: каждая показывается один раз, пока игрок не сделает то, о чём она
var TIPS = [
  { id: 'build', when: function (G) { return G.idx === 0 && G.wave === 0 && !Object.keys(G.towers).length; }, done: function (G) { return Object.keys(G.towers).length >= 1 || !!UI.menu; }, spot: true, keep: true },
  { id: 'wave', txt: 'tut3', when: function (G) { return G.idx === 0 && G.phase === 'build' && Object.keys(G.towers).length >= 1 && !UI.menu; }, done: function (G) { return G.wave > 0; } },
  { id: 'route', when: function (G) { return G.idx >= 1 && G.phase === 'build' && G.L.type !== 'escort'; }, done: function (G) { return G.wave > 0; } },
  { id: 'trap', when: function (G) { return G.idx >= 1 && (G.phase === 'between' || (G.phase === 'build' && G.idx >= 2)); }, done: function (G) { return Object.keys(G.traps).length > 0 || Object.keys(G.barricades).length > 0; } },
  { id: 'skill', when: function (G) { return G.idx >= 2 && G.phase === 'wave' && G.alive > 6; }, done: function (G) { return G.skills.blizzard > 0; } },
  { id: 'hero', when: function (G) { return !!G.hero && !G.hero.dead; }, done: function () { return !!UI.heroSel; }, hero: true },
  { id: 'repair', when: function (G) { for (var k in G.towers) if (G.towers[k].hp < G.towers[k].max * 0.7) return true; return false; }, done: function () { return UI.sel && UI.sel.hp < UI.sel.max; }, hurt: true },
  { id: 'merge', when: function (G) { var cnt = {}; for (var k in G.towers) { var tw = G.towers[k], kk = tw.type + tw.lvl; cnt[kk] = (cnt[kk] || 0) + 1; if (cnt[kk] >= 2 && tw.lvl < 5) return true; } return false; }, done: function (G) { return G.tutEv && G.tutEv.merge; } },
  { id: 'struct', when: function (G) { return G.structs && G.structs.length > 0 && G.phase === 'build'; }, done: function () { return UI.menu && UI.menu.kind === 'struct'; } },
  { id: 'tree', when: function () { return (Z.save.stats.treesDown || 0) > 0; }, done: function (G) { return G.tipT > 6; } },
  { id: 'zoom', txt: 'zoomHint', when: function (G) { return G.idx >= 2 && G.phase === 'build'; }, done: function () { return UI.cam.z > 1.05; } }
];
function drawTutorial() {
  var G = Z.G, L = UI.L, msg = '', tip = null;
  if (UI.modal || Z.save.tipsOff || UI.mmOpen) return;
  G.tipT = G.tipT || 0;
  if (G.tip !== null && G.tip !== undefined && (TIPS[G.tip].done(G) || G.tipT > (TIPS[G.tip].keep ? 30 : 8) || G.tipClose)) { Z.save.seen['tip_' + TIPS[G.tip].id] = 1; G.tip = null; G.tipT = 0; G.tipClose = false; }
  if (G._tip0 === undefined) G._tip0 = Z.time;
  if ((G.tip === null || G.tip === undefined) && ((G.banner && G.banner.t > 0) || Z.time - G._tip0 < 0.6)) return;   // 2.11.4: подсказка ждёт, пока сойдёт название карты, — не налезают друг на друга
  if (G.tip === null || G.tip === undefined) { for (var i = 0; i < TIPS.length; i++) if (!Z.save.seen['tip_' + TIPS[i].id] && TIPS[i].when(G)) { G.tip = i; G.tipT = 0; break; } }
  if (G.tip === null || G.tip === undefined) return;
  tip = TIPS[G.tip]; G.tipT += Z.frameDt || 0.016;
  msg = T(tip.txt || ('tip_' + tip.id));
  if (G.banner && G.banner.big) return;
  var pulse = 0.6 + 0.4 * Math.sin(Z.time * 6);
  if (tip.hero && G.hero) { var hx = X(G.hero.x), hy = Y(G.hero.y) - L.cs * 0.3; ctx.globalAlpha = pulse; D.circ(hx, hy, L.cs * 0.6, null); ctx.strokeStyle = '#7dff8a'; ctx.lineWidth = 4; ctx.stroke(); ctx.globalAlpha = 1; drawHand(hx + L.cs * 0.3, hy + L.cs * 0.4 + Math.sin(Z.time * 6) * 5); }
  if (tip.hurt) { for (var k in G.towers) { var tw = G.towers[k]; if (tw.hp < tw.max * 0.7) { var tx = X(tw.c + 0.5), ty = Y(tw.r + 0.4); ctx.globalAlpha = pulse; D.circ(tx, ty, L.cs * 0.6, null); ctx.strokeStyle = '#ff7a7a'; ctx.lineWidth = 4; ctx.stroke(); ctx.globalAlpha = 1; drawHand(tx + L.cs * 0.3, ty + L.cs * 0.4); break; } } }
  if (tip.spot && !UI.menu) {
    var best = null;
    for (var j = 0; j < G.L.spots.length; j++) if (Z.canBuildAt(G.L.spots[j].c, G.L.spots[j].r)) { best = G.L.spots[j]; break; }
    if (best) { var px = X(best.c + 0.5), py = Y(best.r + 0.5); ctx.globalAlpha = pulse; D.circ(px, py, L.cs * 0.6, null); ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 4; ctx.stroke(); ctx.globalAlpha = 1; drawHand(px + L.cs * 0.3, py + L.cs * 0.3 + Math.sin(Z.time * 6) * 5); }
  }
  var vv = L.vp, bigF = L.BW > vv.w + 2 || L.BH > vv.h + 2, bw = Math.min(vv.w * 0.94 - (bigF ? 52 * S : 0), 460 * S), lines = D.wrap(msg, bw - 48 * S, 15 * S), bh = (18 + lines.length * 19) * S, bx = bigF ? vv.x + 6 * S : vv.x + (vv.w - bw) / 2, by = Math.max(vv.y, L.fy) + 8 * S;
  button('tipx', bx, by, bw, bh, { r: 14 * S, c1: 'rgba(255,253,245,0.96)', c2: 'rgba(0,0,0,0)', fn: function () { G.tipClose = true; }, draw: function () {
    for (var q = 0; q < lines.length; q++) D.text(lines[q], bx + bw / 2 - 8 * S, by + 18 * S + q * 19 * S, 15 * S, OL);
    D.text('×', bx + bw - 14 * S, by + 14 * S, 18 * S, '#8a93b0');
    ctx.fillStyle = 'rgba(80,90,130,0.25)'; ctx.fillRect(bx + 12 * S, by + bh - 5 * S, (bw - 24 * S) * Math.max(0, 1 - G.tipT / (tip.keep ? 30 : 8)), 3 * S); } });
}
function drawHand(x, y) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.4); var r = 13 * S;
  D.rr(-r * 0.35, -r * 1.6, r * 0.7, r * 1.6, r * 0.35); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5 * S; ctx.strokeStyle = OL; ctx.stroke();
  D.rr(-r * 0.75, -r * 0.4, r * 1.6, r * 1.4, r * 0.5); ctx.fill(); ctx.stroke(); ctx.restore();
}

// ---------- главное меню: выбор режима ----------
function drawMainMenu() {
  var s = S, t = Z.time;
  var grd = ctx.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#16224a'); grd.addColorStop(1, '#3a4f96'); ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
  drawStars();
  var bw = Math.min(W * 0.84, 360 * s), bh = 58 * s, bx = (W - bw) / 2, endUn = Z.unlockedLevel() >= 7;
  var stOn = !!(Z._canSell && Z._canSell()), stH = stOn ? 54 * s : 0;   // 2.12.13: Стартовый набор — отдельной золотой кнопкой в меню
  var total = bh * 2 + 46 * s + 20 * s + 50 * s + (stOn ? stH + 10 * s : 0), by = Math.min(H * 0.74, H - total - 14 * s);
  // 2.11.5: название не налезает на кнопки Магазин/Набор/Друзья — если рядом с ними не помещается, уходит строкой ниже
  var tt = T('title'), tfs = D.fitText(tt, W * 0.9, 46 * s), iconsR = Z.menuIconsW ? Z.menuIconsW(s) : 0, ttw = D.mw ? D.mw(tt, tfs) : W * 0.6;
  var tY = 40 * s, tX = W / 2;
  if (iconsR && (W - ttw) / 2 < iconsR + 8 * s) {
    var avail = W - iconsR - 14 * s, f2 = D.fitText(tt, avail, 46 * s);
    if (f2 >= 34 * s) { tfs = f2; tX = iconsR + 6 * s + avail / 2; }   // справа от кнопок
    else { tfs = D.fitText(tt, W * 0.92, 44 * s); tY = 10 * s + 62 * s + 12 * s + tfs * 0.5; }   // узко — строкой ниже
  }
  var ground = by - 6 * s, top = tY + 30 * s, th = Math.max(60 * s, Math.min(ground - top - 10 * s, W * (W < H * 0.8 ? 0.46 : 0.55)));
  if (Z.menuBack) Z.menuBack(W, H, ground, s, t, th);   // 2.11.4: параллакс (луна, горы, лес, дальний снег)
  ctx.fillStyle = '#eef4ff'; ctx.beginPath(); ctx.moveTo(0, ground); for (var x = 0; x <= W; x += 20) ctx.lineTo(x, ground - Math.sin(x * 0.01) * 18 * s); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  if (Z.cachedDraw && !Z.cachesOff()) Z.cachedDraw('menuTree', [W, th.toFixed(1)].join('|'), W / 2 - th * 0.75, ground - th * 1.3, th * 1.5, th * 1.45, function () { D.bigTree(W / 2, ground, th, t, { deco: true }); D.giftPile(W / 2, ground + 4 * s, th * 0.62, t, 0); });   // 2.11.5: ёлка меню — 12 раз в секунду
  else { D.bigTree(W / 2, ground, th, t, { deco: true });
  D.giftPile(W / 2, ground + 4 * s, th * 0.62, t, 0); }
  var mpos = Z.drawMenuCast ? Z.drawMenuCast(W, ground, th, s, t) : null;
  D.moroz(mpos ? mpos.mx : W / 2 - th * 0.55, ground + 4 * s, th * 0.17 * (mpos ? mpos.k : 1), { dir: 1 }); D.snegurochka(mpos ? mpos.sx : W / 2 + th * 0.55, ground + 4 * s, th * 0.15 * (mpos ? mpos.k : 1), { dir: -1 });
  if (Z.menuFront) Z.menuFront(W, H, s, t);   // 2.11.4: ближний снег перед героями
  // 2.11.4: название — золотое, как на обложке, слегка покачивается
  ctx.save(); ctx.translate(tX, tY + Math.sin(t * 1.6) * 2 * s); ctx.rotate(-0.025 + Math.sin(t * 0.8) * 0.008); D.text(tt, 0, 0, tfs, '#ffd54a', 'center', 'middle', 6 * s); ctx.restore();
  button('modeStory', bx, by, bw, bh, { c1: '#4cc77d', c2: COL.greenD, pulse: true, fn: function () { UI.screen = 'map'; UI.scrollToCurrent = true; }, draw: function (x, y, w, h) { D.text(T('modeStory'), x + w / 2, y + h * 0.4, D.fitText(T('modeStory'), w - 20 * s, 22 * s), '#fff', 'center', 'middle', 3 * s); D.text(T('stars') + ': ' + Z.totalStars() + '/' + (Z.LEVELS.length * 3), x + w / 2, y + h * 0.75, Math.max(11.5, 13 * s), 'rgba(255,255,255,0.9)', 'center', 'middle', 2 * s); } });
  button('modeEndless', bx, by + bh + 10 * s, bw, bh, { enabled: endUn, c1: '#9a7ce8', c2: COL.purpleD, fn: function () { UI.openModal({ type: 'endless' }); }, draw: function (x, y, w, h) { D.text(T('endless'), x + w / 2, y + h * 0.4, D.fitText(T('endless'), w - 20 * s, 20 * s), '#fff', 'center', 'middle', 3 * s); D.text(endUn ? T('best') + (Z.save.endlessBest || 0) : T('endlessLock'), x + w / 2, y + h * 0.75, Math.max(11, D.fitText(T('endlessLock'), w - 16 * s, 13 * s)), 'rgba(255,255,255,0.9)', 'center', 'middle', 2 * s); } });
  var sb = (bw - 10 * s) / 2, sy = by + (bh + 10 * s) * 2;
  if (stOn) { if (Z.menuStarterBtn) Z.menuStarterBtn(bx, sy, bw, stH, s, t); sy += stH + 10 * s; }
  // галерея мультфильмов
  var cuts = [['intro', 0], ['r1', 7], ['r2', 14], ['r3', 21], ['r4', 28], ['finale', 35]];
  var TT0 = function (r, e) { return Z.LANG === 'en' ? e : r; }, naOn = !!(Z._canNoAds && Z._canNoAds()), cw0 = naOn ? sb : bw;   // 2.12.13б: «Без рекламы» — рядом с мультфильмами
  button('modeCuts', bx, sy + 56 * s, cw0, 40 * s, { c1: '#ff8fb1', c2: '#d45a80', fn: function () { UI.openModal({ type: 'cuts' }); }, draw: function (x, y, w, h) { D.text('▶ ' + T('cartoons'), x + w / 2, y + h / 2, D.fitText(T('cartoons'), w - 40 * s, 15 * s), '#fff', 'center', 'middle', 2.5 * s); } });
  if (naOn) button('modeNoAds', bx + sb + 10 * s, sy + 56 * s, sb, 40 * s, { c1: '#ff8fb1', c2: '#d45a80', fn: function () { Z.openNoAds(); }, draw: function (x, y, w, h) { var l = TT0('Без рекламы', 'No ads'); if (Z.noAdIcon) Z.noAdIcon(x + 20 * s, y + h / 2, 8 * s); D.text(l, x + w / 2 + 10 * s, y + h / 2, D.fitText(l, w - 46 * s, 15 * s), '#fff', 'center', 'middle', 2.5 * s); } });
  var lbOn = !Z.platHas || Z.platHas('lb');   // 2.11: на VK рейтинга нет — кнопка настроек на всю ширину
  if (lbOn) button('modeLb', bx, sy, sb, 46 * s, { c1: '#ffd54a', c2: COL.goldD, fn: function () { UI.openModal({ type: 'lb', board: 'endless' }); }, draw: function (x, y, w, h) { trophy(x + 22 * s, y + h / 2, 10 * s); D.text(T('rating'), x + w / 2 + 10 * s, y + h / 2, D.fitText(T('rating'), w - 50 * s, 16 * s), '#fff', 'center', 'middle', 3 * s); } });
  button('modeSet', lbOn ? bx + sb + 10 * s : bx, sy, lbOn ? sb : bw, 46 * s, { c1: '#5f74b8', c2: '#43579a', fn: function () { UI.openModal({ type: 'pause', map: true }); }, draw: function (x, y, w, h) { gear(x + 22 * s, y + h / 2, 10 * s); D.text(T('options'), x + w / 2 + 10 * s, y + h / 2, D.fitText(T('options'), w - 50 * s, 16 * s), '#fff', 'center', 'middle', 3 * s); } });
}
// всплывающие сообщения (обгон в рейтинге и т.п.)
UI.toasts = [];
UI.toast = function (txt, col) { UI.toasts.push({ s: txt, t: 0, col: col || '#ffd54a' }); Z.AU.sfx('reward', 0.7); };
function drawToasts() {
  for (var i = UI.toasts.length - 1; i >= 0; i--) {
    var o = UI.toasts[i]; o.t += Z.frameDt || 0.016; if (o.t > 3.2) { UI.toasts.splice(i, 1); continue; }
    var a = Math.min(1, o.t * 5, (3.2 - o.t) * 3), w = Math.min(W * 0.9, 380 * S), h = 44 * S, x = (W - w) / 2, y = 64 * S + i * (h + 6 * S) - (1 - Math.min(1, o.t * 5)) * 30 * S;
    ctx.globalAlpha = a; D.rr(x, y, w, h, 14 * S); ctx.fillStyle = '#1c2752'; ctx.fill(); ctx.lineWidth = 3 * S; ctx.strokeStyle = o.col; ctx.stroke();
    trophy(x + 24 * S, y + h / 2, 9 * S); D.textLines(D.fitLines(o.s, w - 60 * S, 15 * S, 11.5, 2), x + w / 2 + 12 * S, y + h / 2, o.col, 'center', 2 * S, 1.05); ctx.globalAlpha = 1;   // 2.7.21: длинное сообщение — в две строки, не мелко
  }
}
// следим за соседями сверху в рейтинге и сообщаем об обгоне
UI.trackLb = function (board, getScore) {
  Z.SDK.lb(board, function (r) {
    var my = getScore();
    UI.lbAbove = { board: board, list: r.entries.filter(function (e) { return !e.me && e.score > my; }).sort(function (a, b) { return a.score - b.score; }), test: r.test };
  });
};
UI.checkLb = function (board, score) {
  var A = UI.lbAbove; if (!A || A.board !== board) return;
  while (A.list.length && score > A.list[0].score) { var e = A.list.shift(); UI.toast(T('overtook') + ' ' + e.name + '!' + (e.rank ? '  #' + e.rank : '')); }
};
// ---------- карта регионов ----------
var MAP = { nodeGap: 74, regionPad: 150 };
function mapGeom() {
  var s = S, col = Math.min(W - 40 * s, 460 * s), cx = W / 2;
  var nodes = [], y = 120 * s, regions = [];
  for (var r = 0; r < Z.REGIONS.length; r++) {
    var top = y; y += 128 * s;
    for (var k = 0; k < 7; k++) {
      var idx = r * 7 + k, ph = (idx % 4);
      var nx = cx + [-0.32, 0, 0.32, 0][ph] * col;
      nodes.push({ idx: idx, x: nx, y: y });
      y += MAP.nodeGap * s * (k === 5 ? 1.25 : 1);
      Z.CHESTS.forEach(function (c, ci) { if (c.after === idx) { var PX = [-0.32, 0, 0.32, 0], nxt = PX[(idx + 1) % 4] || PX[ph]; nodes.push({ chest: ci, x: cx + (nxt > 0 ? -0.3 : 0.3) * col, y: y - MAP.nodeGap * s * 0.5 }); } });
    }
    y += 40 * s;
    regions.push({ r: r, top: top, bottom: y });
  }
  return { nodes: nodes, regions: regions, height: y + 120 * s, col: col };
}
// узлы идут сверху вниз: первый регион вверху
function drawMap() {
  var g = mapGeom(), maxScroll = Math.max(0, g.height - H);
  if (UI.scrollToCurrent) {
    UI.scrollToCurrent = false;
    var cur = Z.unlockedLevel(), n = g.nodes.filter(function (q) { return q.idx === cur; })[0];
    if (n) UI.mapScroll = Math.max(0, Math.min(maxScroll, n.y - H * 0.55));
  }
  if (!UI.mapDrag) { UI.mapScroll += UI.mapVel; UI.mapVel *= 0.92; }
  UI.mapScroll = Math.max(0, Math.min(maxScroll, UI.mapScroll));
  var off = -UI.mapScroll, t = Z.time, s = S;
  var grd = ctx.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#16224a'); grd.addColorStop(1, '#2c3c78');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
  drawStars();
  var unlocked = Z.unlockedLevel();
  g.regions.forEach(function (R) {
    var y0 = R.top + off, y1 = R.bottom + off; if (y1 < -50 || y0 > H + 50) return;
    var reg = Z.REGIONS[R.r];
    var band = ctx.createLinearGradient(0, y0, 0, y1); band.addColorStop(0, reg.ground); band.addColorStop(1, reg.tint);
    ctx.fillStyle = band;
    ctx.beginPath(); ctx.moveTo(0, y0 + 30 * s);
    for (var x = 0; x <= W; x += 20) ctx.lineTo(x, y0 + 30 * s - Math.sin(x * 0.02 + R.r) * 14 * s);
    ctx.lineTo(W, y1); ctx.lineTo(0, y1); ctx.closePath(); ctx.fill();
    regionDecor(R.r, y0, y1, g.col);
  });
  // тропа
  ctx.setLineDash([10 * s, 10 * s]); ctx.lineCap = 'round';
  ctx.beginPath(); var first = true;
  g.nodes.forEach(function (n) { if (n.chest !== undefined) return; if (first) { ctx.moveTo(n.x, n.y + off); first = false; } else ctx.lineTo(n.x, n.y + off); });
  ctx.strokeStyle = 'rgba(110,130,180,0.7)'; ctx.lineWidth = 6 * s; ctx.stroke(); ctx.setLineDash([]);
  // 2.7.21: таблички регионов — поверх тропы (линия больше не перечёркивает название)
  g.regions.forEach(function (R) {
    var y0 = R.top + off, y1 = R.bottom + off; if (y1 < -50 || y0 > H + 50) return;
    if (R.r * 7 > unlocked) return;   // у закрытого региона название пишется под замком — без двойной таблички
    var reg = Z.REGIONS[R.r], nm = T('r_' + reg.id), pw = Math.min(W * 0.8, 300 * s);
    D.rr(W / 2 - pw / 2, y0 + 36 * s, pw, 40 * s, 14 * s); ctx.fillStyle = COL.red; ctx.fill(); ctx.lineWidth = 3 * s; ctx.strokeStyle = OL; ctx.stroke();
    D.text(nm, W / 2, y0 + 56 * s, D.fitText(nm, pw - 20 * s, 21 * s), '#fff', 'center', 'middle', 3 * s);
  });
  // узлы
  var topBar = 62 * s, botBar = H - 86 * s;
  // 2.7.21: узлы не исчезают у панелей рывком — плавно уходят под край; нажимаются только видимые целиком
  ctx.save(); ctx.beginPath(); ctx.rect(0, topBar, W, botBar - topBar); ctx.clip();
  g.nodes.forEach(function (n) {
    var y = n.y + off; if (y < -80 || y > H + 80) return;
    var nh = y - 26 * s < topBar || y + 34 * s > botBar;   // частично под панелью: видно, но не нажимается
    if (n.chest !== undefined) {
      var ch = Z.CHESTS[n.chest], open = Z.save.chests[n.chest], avail = unlocked > ch.after;
      var cr = 22 * s;
      if (open) { D.rr(n.x - cr * 0.8, y - cr * 0.3, cr * 1.6, cr * 0.8, 5 * s); ctx.fillStyle = COL.wood; ctx.fill(); ctx.lineWidth = 2 * s; ctx.strokeStyle = OL; ctx.stroke();
        D.poly([n.x - cr * 0.8, y - cr * 0.3, n.x - cr * 0.6, y - cr * 1.0, n.x + cr * 1.0, y - cr * 0.8, n.x + cr * 0.8, y - cr * 0.3], COL.woodD, 2 * s);
        D.text('✓', n.x, y + cr * 0.1, cr * 0.7, '#7dff8a', 'center', 'middle', 2 * s); return; }
      button('chest' + n.chest, n.x - cr * 1.2, y - cr, cr * 2.4, cr * 2, { r: 8 * s, noHit: nh, enabled: avail, c1: avail ? '#ffd54a' : '#9aa3b8', c2: avail ? COL.goldD : '#737c93', pulse: avail, fn: function () {
        Z.save.chests[n.chest] = 1; Z.save.flakes += ch.reward; Z.AU.sfx('reward'); Z.AU.sting('waveEnd'); Z.persist(true);
        UI.openModal({ type: 'chest', reward: ch.reward });
      }, draw: function (bx, by, bw, bh) { D.rr(bx + bw * 0.2, by + bh * 0.25, bw * 0.6, bh * 0.5, 4 * s); ctx.fillStyle = COL.wood; ctx.fill(); ctx.lineWidth = 2 * s; ctx.strokeStyle = OL; ctx.stroke(); ctx.fillStyle = COL.gold; ctx.fillRect(bx + bw * 0.46, by + bh * 0.25, bw * 0.08, bh * 0.5); if (!avail) D.text('?', bx + bw / 2, by + bh / 2, bh * 0.4, '#fff', 'center', 'middle', 2 * s); } });
      return;
    }
    var info = Z.LEVELS[n.idx], stars = Z.save.stars[n.idx] || 0, isUn = n.idx <= unlocked;
    var big = info.type === 'boss', r = (big ? 30 : 24) * s;
    var c1 = !isUn ? '#9aa3b8' : info.type === 'boss' ? '#9a7ce8' : info.type === 'escort' ? '#ff7a7f' : '#4aa3ff';
    var c2 = !isUn ? '#737c93' : info.type === 'boss' ? COL.purpleD : info.type === 'escort' ? COL.redD : COL.blueD;
    var isCur = n.idx === unlocked && !stars;
    button('node' + n.idx, n.x - r, y - r, r * 2, r * 2 + 5, { r: r, noHit: nh, enabled: isUn, c1: c1, c2: c2, pulse: isCur, fn: function () { UI.openModal({ type: 'levelStart', idx: n.idx, heroic: false }); },
      draw: function (bx, by, bw, bh) {
        var cx = bx + bw / 2, cy = by + bh / 2;
        if (info.type === 'escort') { if (Z.iconCached) Z.iconCached('mapSleigh', cx, cy - r * 0.05, r * 1.7, function (ox, oy) { var c0 = D.ctx; c0.save(); c0.translate(ox, oy + r * 0.3); D.sleigh(0, 0, r * 0.47, 1, 0, 0); c0.restore(); }); else { ctx.save(); ctx.translate(cx, cy + r * 0.25); D.sleigh(0, 0, r * 0.47, 1, 0, 0); ctx.restore(); } }
        else if (info.type === 'boss') { var fake = { type: Z.REGIONS[info.region].boss, size: 1, dir: 1, walk: 0, ph: 0, hitT: 0, slow: 0, hp: 1, max: 1 }; ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, Math.PI * 2); ctx.clip(); D.enemy(fake, cx, cy + r * 0.75, r * 0.85, 0); ctx.restore(); }
        else D.text('' + (n.idx + 1), cx, cy, r * 0.8, '#fff', 'center', 'middle', 3 * s);
        if (!isUn) { D.rr(cx - r * 0.3, cy - r * 0.1, r * 0.6, r * 0.5, 3); ctx.fillStyle = '#5a6385'; ctx.fill(); ctx.beginPath(); ctx.arc(cx, cy - r * 0.1, r * 0.2, Math.PI, 0); ctx.strokeStyle = '#5a6385'; ctx.lineWidth = 3 * s; ctx.stroke(); }
      } });
    if (info.big) { D.rr(n.x + r * 0.4, y - r - 6 * s, 30 * s, 19 * s, 7 * s); ctx.fillStyle = '#ff8a3d'; ctx.fill(); ctx.lineWidth = 2 * s; ctx.strokeStyle = OL; ctx.stroke(); D.text('XL', n.x + r * 0.4 + 15 * s, y - r + 3.5 * s, Math.max(11, 12.5 * s), '#fff', 'center', 'middle', 2 * s); }
    if (isUn) for (var st = 0; st < 3; st++) D.star(n.x - r * 0.62 + st * r * 0.62, y + r + 4 * s, 8 * s, st < stars ? COL.gold : '#5a6385', 1.5);
    // мультик на этом уровне — значок «плёнка» (пересмотреть можно в окне уровня)
    // 2.11.5: мультики и сцена уровня — кружки на тропе перед уровнем, по порядку показа (можно пересмотреть)
    if (Z.mapStoryDots) { var pvN = null; for (var pj = g.nodes.indexOf(n) - 1; pj >= 0; pj--) if (g.nodes[pj].chest === undefined) { pvN = g.nodes[pj]; break; } Z.mapStoryDots(n, pvN, y, off, r, isUn, nh); }
    else if (Z.multsAt && Z.multsAt(n.idx).length) UI.filmBadge(n.x - r * 0.95, y - r * 0.85, 9 * s, isUn);
    if (Z.save.heroic[n.idx]) { D.poly([n.x - 10 * s, y - r - 2 * s, n.x - 12 * s, y - r - 14 * s, n.x - 4 * s, y - r - 8 * s, n.x, y - r - 16 * s, n.x + 4 * s, y - r - 8 * s, n.x + 12 * s, y - r - 14 * s, n.x + 10 * s, y - r - 2 * s], COL.gold, 1.5); }
  });
  ctx.restore();
  // туман на закрытых регионах
  g.regions.forEach(function (R) {
    var firstIdx = R.r * 7; if (firstIdx <= unlocked) return;
    var y0 = R.top + off + 24 * s, y1 = R.bottom + off; if (y1 < 0 || y0 > H) return;
    ctx.fillStyle = 'rgba(200,212,238,0.88)'; ctx.fillRect(0, y0, W, y1 - y0);
    // 2.7.21: мягкие облака тумана вместо плоских кругов
    ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, y1 - y0); ctx.clip();
    for (var c = 0; c < 22; c++) { var cx = (c * 97) % W + Math.sin(t * 0.3 + c) * 12 * s, cy = y0 + ((c * 61) % Math.max(1, (y1 - y0))), cr = (52 + (c * 37) % 30) * s;
      var fg = ctx.createRadialGradient(cx, cy, cr * 0.15, cx, cy, cr); fg.addColorStop(0, 'rgba(240,244,253,0.85)'); fg.addColorStop(0.6, 'rgba(236,241,252,0.45)'); fg.addColorStop(1, 'rgba(232,238,250,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(cx, cy, cr * 1.35, cr, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  });
  // 2.7.21: замки и подписи закрытых регионов — после всего тумана, чтобы туман соседнего региона их не перекрывал
  ctx.save(); ctx.beginPath(); ctx.rect(0, topBar, W, botBar - topBar); ctx.clip();
  g.regions.forEach(function (R) {
    var firstIdx = R.r * 7; if (firstIdx <= unlocked) return;
    var y0 = R.top + off + 24 * s, y1 = R.bottom + off; if (y1 < 0 || y0 > H) return;
    var my = Math.max(y0 + 50 * s, Math.min(y1 - 96 * s, Math.max(62 * s + 40 * s, Math.min(H - 86 * s - 90 * s, H / 2))));   // 2.7.21: весь блок внутри региона, не на полосе между регионами
    D.rr(W / 2 - 22 * s, my - 10 * s, 44 * s, 34 * s, 6 * s); ctx.fillStyle = '#5a6385'; ctx.fill(); ctx.lineWidth = 3 * s; ctx.strokeStyle = OL; ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, my - 10 * s, 14 * s, Math.PI, 0); ctx.strokeStyle = '#5a6385'; ctx.lineWidth = 6 * s; ctx.stroke();
    D.text(T('r_' + Z.REGIONS[R.r].id), W / 2, my + 44 * s, 22 * s, OL);
    D.text(T('locked'), W / 2, my + 70 * s, D.fitText(T('locked'), W - 40 * s, 15 * s), '#4a5378');
  });
  ctx.restore();
  // панели сверху и снизу — сплошные, под ними ничего не просвечивает
  var pg1 = ctx.createLinearGradient(0, 0, 0, topBar); pg1.addColorStop(0, 'rgba(22,34,74,0.97)'); pg1.addColorStop(1, 'rgba(22,34,74,0.85)'); ctx.fillStyle = pg1; ctx.fillRect(0, 0, W, topBar);
  var pg2 = ctx.createLinearGradient(0, botBar, 0, H); pg2.addColorStop(0, 'rgba(22,34,74,0.85)'); pg2.addColorStop(1, 'rgba(22,34,74,0.97)'); ctx.fillStyle = pg2; ctx.fillRect(0, botBar, W, H - botBar);
  // верхняя панель
  var ty = 30 * s;
  button('mhome', 10 * s, ty - 20 * s, 40 * s, 40 * s, { r: 12 * s, c1: '#5f74b8', c2: '#43579a', fn: function () { UI.screen = 'menu'; }, draw: function (bx, by, bw, bh) { D.poly([bx + bw * 0.2, by + bh * 0.52, bx + bw * 0.5, by + bh * 0.22, bx + bw * 0.8, by + bh * 0.52], '#fff', 2 * s); D.rr(bx + bw * 0.3, by + bh * 0.5, bw * 0.4, bh * 0.3, 2); ctx.fillStyle = '#fff'; ctx.fill(); } });
  var pw1 = Math.min(96 * s, (W - 3 * 50 * s - 70 * s) / 2);
  pill(56 * s, ty - 17 * s, pw1, 34 * s); D.flakeIcon(72 * s, ty, 10 * s); D.text(Z.fmt(Z.save.flakes), 86 * s, ty + 1, D.fitText(Z.fmt(Z.save.flakes), pw1 - 34 * s, 18 * s), '#fff', 'left', 'middle', 3 * s);
  pill(62 * s + pw1, ty - 17 * s, pw1, 34 * s); D.star(78 * s + pw1, ty, 10 * s, COL.gold, 1.5); D.text('' + Z.totalStars(), 92 * s + pw1, ty + 1, D.fitText('' + Z.totalStars(), pw1 - 34 * s, 18 * s), '#fff', 'left', 'middle', 3 * s);
  var bs = 44 * s;
  button('mpause', W - bs - 10 * s, ty - bs / 2, bs, bs, { r: 12 * s, c1: '#5f74b8', c2: '#43579a', fn: function () { UI.openModal({ type: 'pause', map: true }); }, draw: function (bx, by, bw, bh) { gear(bx + bw / 2, by + bh / 2, bh * 0.3); } });
  var achN = Z.achReady();
  button('mach', W - bs * 2 - 16 * s, ty - bs / 2, bs, bs, { r: 12 * s, c1: '#ffd54a', c2: COL.goldD, pulse: achN > 0, fn: function () { UI.openModal({ type: 'ach' }); }, draw: function (bx, by, bw, bh) { trophy(bx + bw / 2, by + bh / 2, bh * 0.28); } });
  if (achN) badge(W - bs - 20 * s, ty - bs / 2 + 4 * s, 8 * s);
  button('mcos', W - bs * 3 - 22 * s, ty - bs / 2, bs, bs, { r: 12 * s, c1: '#ff8fb1', c2: '#d45a80', fn: function () { UI.openModal({ type: 'cos' }); }, draw: function (bx, by, bw, bh) { D.pine(bx + bw / 2, by + bh * 0.82, bh * 0.62, '#2a8a5c', true); } });
  if (W - bs * 3 - 22 * s < 225 * s) { /* узкий экран: кнопки уже не помещаются рядом с плашками — сдвиг не нужен, плашки короче */ }
  var endUn = false;
  if (endUn) button('mendless', W - 66 * s, H - 60 * s - 12 * s - 70 * s, 56 * s, 60 * s, { r: 14 * s, enabled: endUn, c1: '#9a7ce8', c2: COL.purpleD, fn: function () { UI.openModal({ type: 'endless' }); },
    draw: function (bx, by, bw, bh) { D.circ(bx + bw / 2 + 6 * s, by + bh * 0.42, 12 * s, '#fff3b0'); D.circ(bx + bw / 2 + 11 * s, by + bh * 0.37, 10 * s, endUn ? '#9a7ce8' : '#c9cfdc'); D.text('∞', bx + bw / 2, by + bh * 0.72, 18 * s, '#fff', 'center', 'middle', 2.5 * s); } });
  // нижние кнопки
  var bh2 = 60 * s, bw2 = Math.min((W - 40 * s) / 2, 200 * s), by2 = H - bh2 - 12 * s;
  var canRes = Z.RESEARCH.some(function (rs) { return (Z.save.research[rs.id] || 0) < rs.max && Z.save.flakes >= Z.researchCost(Z.save.research[rs.id] || 0); });
  button('research', W / 2 - bw2 - 6 * s, by2, bw2, bh2, { c1: '#3fb6e6', c2: '#2a8bbd', pulse: canRes, fn: function () { UI.openModal({ type: 'research' }); }, draw: function (bx, by, bw, bh) { D.flakeIcon(bx + 22 * s, by + bh / 2, 11 * s); D.text(T('research'), bx + 38 * s + (bw - 44 * s) / 2, by + bh / 2, D.fitText(T('research'), bw - 50 * s, 17 * s), '#fff', 'center', 'middle', 3 * s); } });
  if (canRes) badge(W / 2 - 14 * s, by2 + 6 * s, 9 * s);
  var dAvail = Z.save.daily !== Z.todayStr();
  button('play', W / 2 + 6 * s, by2, bw2, bh2, { c1: '#4cc77d', c2: COL.greenD, pulse: true, fn: function () { UI.openModal({ type: 'levelStart', idx: Z.unlockedLevel(), heroic: false }); }, draw: function (bx, by, bw, bh) { D.poly([bx + 16 * s, by + bh * 0.3, bx + 32 * s, by + bh * 0.5, bx + 16 * s, by + bh * 0.7], '#fff', 2 * s); D.text(T('play'), bx + 36 * s + (bw - 44 * s) / 2, by + bh / 2, D.fitText(T('play'), bw - 50 * s, 22 * s), '#fff', 'center', 'middle', 3 * s); } });
  if (dAvail && !UI.giftHub) {
    button('daily', 10 * s, H - bh2 - 12 * s - 70 * s, 56 * s, 60 * s, { r: 14 * s, c1: '#ff7a7f', c2: COL.redD, pulse: true, fn: function () { UI.openModal({ type: 'daily' }); }, draw: function (bx, by, bw, bh) { D.gift(bx + bw / 2, by + bh / 2 + 4 * s, 16 * s); } });
    badge(10 * s + 50 * s, H - bh2 - 12 * s - 64 * s, 9 * s);
  }
  // заголовок
  if (UI.mapScroll < 80 * s) {
    var tt = T('title'), px = D.fitText(tt, W - 40 * s, 40 * s);
    D.text(tt, W / 2, 84 * s + off * 0.3, px, '#ffd54a', 'center', 'middle', Math.max(4, px * 0.16));
  }
  if (UI.mapExtra) UI.mapExtra(s, bh2, by2);
}
function trophy(x, y, r) {
  D.poly([x - r, y - r, x + r, y - r, x + r * 0.7, y + r * 0.2, x - r * 0.7, y + r * 0.2], '#fff', Math.max(1.5, r * 0.15));
  D.rr(x - r * 0.2, y + r * 0.2, r * 0.4, r * 0.5, 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  D.rr(x - r * 0.6, y + r * 0.7, r * 1.2, r * 0.3, 2); ctx.fill(); ctx.stroke();
}
// 2.10.4: декор карты расставляется аккуратно: группами, без наложений, не на узлах и тропе, по глубине;
// у каждого региона свой набор (лес, деревня, озеро, горы, полюс). Раскладка считается один раз на размер экрана.
var decCache = {};
function regionLayout(r, y0, y1, col) {
  var s = S, key = r + '|' + Math.round(W) + '|' + Math.round(s * 100) + '|' + Math.round(y1 - y0);
  if (decCache[key]) return decCache[key];
  var g = mapGeom(), R = g.regions[r], nodes = g.nodes.filter(function (n) { return n.y >= R.top - 40 * s && n.y <= R.bottom + 40 * s; });
  var segs = []; for (var q = 1; q < nodes.length; q++) if (nodes[q].chest === undefined && nodes[q - 1].chest === undefined) segs.push([nodes[q - 1], nodes[q]]);
  function segD(px, py, a, b) { var dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(px - a.x - dx * t, py - a.y - dy * t); }
  var rnd = Z.rng(300 + r * 17), items = [], top = R.top + 92 * s, bot = R.bottom - 20 * s;
  // 2.11.5: у каждого предмета — своя «коробка» (ширина и высота над землёй); предметы не пересекаются коробками,
  // не лезут на узлы уровней (с их звёздами) и на тропу. Рядом с каждым уровнем — его ориентир в миниатюре.
  var BOX = { pine: [12, 38], fir: [10, 32], house: [22, 40], mound: [19, 11], stump: [8, 12], lamp: [7, 42], reed: [11, 26], hole: [17, 9], peak: [38, 60], rock: [13, 14], spike: [9, 31], igloo: [21, 21], cane: [6, 40] };
  function box(it) { var hw, hh; if (it.k === 'lm') { hw = it.cs * 1.05; hh = it.cs * 2.3; } else { var b = BOX[it.k] || [14, 30]; hw = b[0] * s * it.sz; hh = b[1] * s * it.sz; } return { x0: it.x - hw, x1: it.x + hw, y0: it.y - hh, y1: it.y + 4 * s, hw: hw, hh: hh }; }
  function hit(a, b, gap) { return a.x0 < b.x1 + gap && b.x0 < a.x1 + gap && a.y0 < b.y1 + gap && b.y0 < a.y1 + gap; }
  var nodeBoxes = nodes.map(function (n) { var rr = (n.chest !== undefined ? 26 : 34) * s; return { x0: n.x - rr, x1: n.x + rr, y0: n.y - rr - 8 * s, y1: n.y + rr + 14 * s }; });
  // 2.11.5: у первого уровня региона кружки мультика и сцены стоят сбоку от узла — туда предметы не ставим
  nodes.forEach(function (n) { if (n.chest !== undefined || n.idx % 7 !== 0 || !(Z.storyItems && Z.storyItems(n.idx).length)) return; var dd = n.x > W / 2 + 2 ? -1 : 1, ln = (34 + 12 + 27 * Z.storyItems(n.idx).length) * s; nodeBoxes.push({ x0: dd > 0 ? n.x : n.x - ln, x1: dd > 0 ? n.x + ln : n.x, y0: n.y - 16 * s, y1: n.y + 16 * s }); });
  function free(it) {
    var B = box(it);
    if (B.x0 < 4 * s || B.x1 > W - 4 * s || B.y0 < R.top + 80 * s || it.y > bot) return false;
    for (var k = 0; k < nodeBoxes.length; k++) if (hit(B, nodeBoxes[k], 2 * s)) return false;
    for (var k2 = 0; k2 < segs.length; k2++) { var a0 = segs[k2][0], b0 = segs[k2][1]; if (segD(it.x, it.y, a0, b0) < B.hw + 12 * s || segD(it.x, it.y - B.hh * 0.5, a0, b0) < B.hw + 10 * s || segD(it.x, it.y - B.hh, a0, b0) < B.hw * 0.6 + 8 * s) return false; }
    if (it.k !== 'lm' && r === 2 && Math.pow((it.x - W / 2) / (col * 0.62), 2) + Math.pow((it.y - (R.top + R.bottom) / 2) / ((R.bottom - R.top) * 0.3), 2) < 1) return false;   // на льду озера — пусто
    for (var k3 = 0; k3 < items.length; k3++) if (hit(B, box(items[k3]), 3 * s)) return false;
    return true;
  }
  // ориентиры уровней — первыми, рядом со своим узлом
  if (Z.mapLm) nodes.forEach(function (n) {
    if (n.chest !== undefined || n.idx === undefined || n.y < R.top || n.y > R.bottom) return;
    var cs = 21 * s, cand = [[66, 24], [-66, 24], [72, 4], [-72, 4], [60, 50], [-60, 50], [100, 24], [-100, 24], [0, 70], [40, 72], [-40, 72]];
    if (n.x > W / 2 + 10 * s) cand.sort(function (a, b) { return a[0] - b[0]; }); else if (n.x < W / 2 - 10 * s) cand.sort(function (a, b) { return b[0] - a[0]; });
    for (var ci = 0; ci < cand.length; ci++) { var it = { k: 'lm', idx: n.idx, x: n.x + cand[ci][0] * s, y: n.y + cand[ci][1] * s, cs: cs, sz: 1 }; if (free(it)) { items.push(it); return; } }
    for (var cj = 0; cj < cand.length; cj++) { var it2 = { k: 'lm', idx: n.idx, x: n.x + cand[cj][0] * 0.9 * s, y: n.y + cand[cj][1] * s, cs: cs * 0.72, sz: 1 }; if (free(it2)) { items.push(it2); return; } }
  });
  var KIND = [
    [['pine', 0.76], ['mound', 0.18], ['stump', 0.06]],
    [['house', 0.38], ['pine', 0.47], ['lamp', 0.15]],
    [['pine', 0.6], ['reed', 0.25], ['hole', 0.15]],
    [['peak', 0.3], ['fir', 0.45], ['rock', 0.25]],
    [['spike', 0.4], ['igloo', 0.25], ['cane', 0.35]]
  ][r];
  function pick() { var v = rnd(), a = 0; for (var k = 0; k < KIND.length; k++) { a += KIND[k][1]; if (v < a) return KIND[k][0]; } return KIND[0][0]; }
  var groups = Math.round((W / s) / 32) + 5;
  for (var gi = 0; gi < groups * 4 && items.length < groups * 4; gi++) {
    var gx = rnd() * W, gy = top + rnd() * (bot - top), kind = pick(), n = kind === 'peak' || kind === 'igloo' || kind === 'house' ? 1 + Math.floor(rnd() * 2) : 2 + Math.floor(rnd() * 3);
    for (var m = 0; m < n; m++) {
      var it3 = { x: gx + (rnd() - 0.5) * 70 * s, y: gy + (rnd() - 0.5) * 44 * s, k: m === 0 || rnd() < 0.7 ? kind : pick(), sz: 0.8 + rnd() * 0.45, sd: Math.floor(rnd() * 999) }; if (it3.k === 'peak') it3.sz *= 0.72;
      if (!free(it3)) continue;
      items.push(it3);
    }
  }
  items.forEach(function (it) { it.y -= R.top; });
  items.sort(function (a, b) { return a.y - b.y; });   // по глубине: дальние (выше) — раньше
  return (decCache[key] = items);
}
function regionDecor(r, y0, y1, col) {
  var s = S, reg = Z.REGIONS[r], R0 = mapGeom().regions[r];
  if (r === 2) { D.ell(W / 2, (y0 + y1) / 2, col * 0.6, (y1 - y0) * 0.28, 'rgba(140,210,245,0.45)'); D.ell(W / 2 - col * 0.2, (y0 + y1) / 2 - (y1 - y0) * 0.08, col * 0.18, (y1 - y0) * 0.03, 'rgba(255,255,255,0.35)'); }
  var items = regionLayout(r, y0, y1, col), base = y0 - (R0 ? 0 : 0);
  items.forEach(function (it) {
    var x = it.x, y = base + it.y, z = it.sz, sd = it.sd; if (y < -80 * s || y > H + 80 * s) return;
    D.ell(x + 4 * s, y + 1 * s, 15 * s * z, 4 * s * z, 'rgba(30,40,80,0.13)');
    if (it.k === 'lm') { if (Z.mapLm) Z.mapLm(it.idx, x, y, it.cs, Z.time); return; }
    if (it.k === 'pine' || it.k === 'fir') { var ph0 = (it.k === 'fir' ? 30 : 36) * s * z; if (Z.iconCached) Z.iconCached('pine' + reg.tree, x, y - ph0 * 0.5, ph0 * 1.15, function (ox, oy) { D.pine(ox, oy + ph0 * 0.5, ph0, reg.tree); }); else D.pine(x, y, ph0, reg.tree); }   // 2.11.5: ели карты — готовые картинки
    else if (it.k === 'house') D.house(x, y, 40 * s * z, sd);
    else if (it.k === 'mound') { D.ell(x, y - 5 * s * z, 18 * s * z, 9 * s * z, '#ffffff', 1.5 * s); D.ell(x - 5 * s * z, y - 8 * s * z, 6 * s * z, 3 * s * z, 'rgba(200,220,245,0.8)'); }
    else if (it.k === 'stump') { D.rr(x - 7 * s * z, y - 10 * s * z, 14 * s * z, 10 * s * z, 3 * s); ctx.fillStyle = '#8a5a35'; ctx.fill(); ctx.lineWidth = 1.5 * s; ctx.strokeStyle = OL; ctx.stroke(); D.ell(x, y - 10 * s * z, 7 * s * z, 3 * s * z, '#f4f8ff', 1.2 * s); }
    else if (it.k === 'lamp') { ctx.strokeStyle = OL; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 34 * s * z); ctx.stroke(); D.circ(x, y - 36 * s * z, 5 * s * z, '#ffe08a', 1.5 * s); ctx.globalAlpha = 0.25; D.circ(x, y - 36 * s * z, 13 * s * z, '#ffe08a'); ctx.globalAlpha = 1; }
    else if (it.k === 'reed') { for (var q = 0; q < 4; q++) { ctx.strokeStyle = '#7a8a5a'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x + (q - 1.5) * 3 * s, y); ctx.lineTo(x + (q - 1.5) * 5 * s, y - (16 + q % 2 * 6) * s * z); ctx.stroke(); } D.ell(x + 1 * s, y - 20 * s * z, 2.5 * s, 5 * s, '#6a4a2a'); }
    else if (it.k === 'hole') { D.ell(x, y - 2 * s, 10 * s * z, 4 * s * z, '#3f6f9f', 1.5 * s); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x + 8 * s, y); ctx.lineTo(x + 16 * s, y - 22 * s * z); ctx.stroke(); ctx.strokeStyle = 'rgba(40,40,60,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 16 * s, y - 22 * s * z); ctx.lineTo(x + 2 * s, y - 2 * s); ctx.stroke(); }
    else if (it.k === 'peak') { var ph = 58 * s * z; D.poly([x - ph * 0.65, y, x, y - ph, x + ph * 0.65, y], '#aab6d6', 2 * s); D.poly([x - ph * 0.65, y, x - ph * 0.12, y - ph * 0.82, x, y - ph, x - ph * 0.05, y], 'rgba(120,135,180,0.55)'); D.poly([x - ph * 0.24, y - ph * 0.63, x, y - ph, x + ph * 0.24, y - ph * 0.63, x + ph * 0.08, y - ph * 0.7, x - ph * 0.06, y - ph * 0.6], '#fff'); }
    else if (it.k === 'rock') { D.poly([x - 12 * s * z, y, x - 8 * s * z, y - 10 * s * z, x + 3 * s * z, y - 13 * s * z, x + 12 * s * z, y - 4 * s * z, x + 11 * s * z, y], '#8b93a7', 1.5 * s); D.poly([x - 8 * s * z, y - 10 * s * z, x + 3 * s * z, y - 13 * s * z, x + 6 * s * z, y - 9 * s * z, x - 4 * s * z, y - 8 * s * z], '#f4f8ff'); }
    else if (it.k === 'spike') { D.poly([x - 7 * s * z, y, x - 2 * s * z, y - 30 * s * z, x + 2 * s * z, y - 10 * s * z, x + 6 * s * z, y - 22 * s * z, x + 9 * s * z, y], '#bfe9ff', 1.5 * s); }
    else if (it.k === 'igloo') { ctx.beginPath(); ctx.arc(x, y, 20 * s * z, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#f4f8ff'; ctx.fill(); ctx.lineWidth = 2 * s; ctx.strokeStyle = OL; ctx.stroke(); ctx.strokeStyle = 'rgba(120,150,200,0.5)'; ctx.lineWidth = 1.2 * s; for (var b = 1; b < 3; b++) { ctx.beginPath(); ctx.arc(x, y, 20 * s * z * b / 3, Math.PI, 0); ctx.stroke(); } D.rr(x + 4 * s * z, y - 9 * s * z, 12 * s * z, 9 * s * z, 4 * s); ctx.fillStyle = '#3d4a7a'; ctx.fill(); }
    else if (it.k === 'cane') { ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 6 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 36 * s * z); ctx.stroke(); for (var k = 0; k < 4; k++) { ctx.strokeStyle = k % 2 ? '#fff' : COL.red; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.moveTo(x, y - k * 9 * s * z); ctx.lineTo(x, y - k * 9 * s * z - 9 * s * z); ctx.stroke(); } ctx.lineCap = 'butt'; }
  });
}
function gear(x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.beginPath();
  for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8, rad = (i % 2 === 0) ? r : r * 0.78; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  ctx.closePath(); ctx.fillStyle = '#dfe7f7'; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.16); ctx.strokeStyle = OL; ctx.stroke();
  D.circ(0, 0, r * 0.32, '#8b98b8', Math.max(1.5, r * 0.14)); ctx.restore();
}

// ---------- окна ----------
function frame(w, h, title) {
  if (UI._baseT) { ctx.save(); ctx.setTransform(UI._baseT); ctx.fillStyle = 'rgba(8,12,30,0.62)'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  else { ctx.fillStyle = 'rgba(8,12,30,0.62)'; ctx.fillRect(0, 0, W, H); }
  UI._mh = Math.max(UI._mh || 0, h + 30 * S);   // высота окна с язычком заголовка — для ужимания
  var m = UI.modal, k = Math.min(1, m.t * 6), sc = 0.85 + 0.15 * (1 - Math.pow(1 - k, 3));
  var x = (W - w) / 2, y = (H - h) / 2 + 8 * S;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
  D.rr(x, y + 6 * S, w, h, 22 * S); ctx.fillStyle = OL; ctx.fill();
  D.rr(x, y, w, h, 22 * S); ctx.fillStyle = COL.panel; ctx.fill(); ctx.lineWidth = 3 * S; ctx.strokeStyle = OL; ctx.stroke();
  D.rr(x + w * 0.1, y - 20 * S, w * 0.8, 44 * S, 16 * S); ctx.fillStyle = COL.red; ctx.fill(); ctx.stroke();
  // 2.12.25: слева на ленте может стоять баланс (магазин) — тогда заголовок центрируется в оставшейся части ленты
  var rl = UI._frameL || 0; UI._frameL = 0;
  if (rl) { var tx0 = x + w * 0.1 + rl, tx1 = x + w * 0.9 - 8 * S; D.text(title, (tx0 + tx1) / 2, y + 2 * S, D.fitText(title, tx1 - tx0 - 8 * S, 22 * S), '#fff', 'center', 'middle', 3 * S); }
  else D.text(title, x + w / 2, y + 2 * S, D.fitText(title, w * 0.74, 22 * S), '#fff', 'center', 'middle', 3 * S);
  return { x: x, y: y, w: w, h: h, rl: rl };
}
function closeX(f) {
  var r = 18 * S;
  button('mclose', f.x + f.w - r * 2.2, f.y - r * 0.9, r * 2, r * 2, { modal: true, c1: COL.red, c2: COL.redD, r: r, fn: function () { UI.closeModal(); }, draw: function (bx, by, bw, bh) {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5 * S; ctx.lineCap = 'round'; var c = bx + bw / 2, d = by + bh / 2, q = r * 0.38;
    ctx.beginPath(); ctx.moveTo(c - q, d - q); ctx.lineTo(c + q, d + q); ctx.moveTo(c + q, d - q); ctx.lineTo(c - q, d + q); ctx.stroke(); } });
}
function mw() { return Math.min(W * 0.92, 430 * S); }
function bigBtn(id, f, yy, label, fn, c1, c2) { var bh = UI._bh || 54 * S; button(id, f.x + 22 * S, yy, f.w - 44 * S, bh, { modal: true, c1: c1, c2: c2, fn: fn, label: label }); return yy + bh + 8 * S; }

// 2.11.4: окно выше экрана (низкое окно VK 1000×640) — ужимаем его целиком, вместе с областями нажатия кнопок;
// раньше заголовок и нижние строки/кнопки уходили за край и до них было не добраться
function drawModal() {
  var m = UI.modal; if (!m || m.type === 'comic' || m.type === 'cut') { drawModal0(); return; }
  var k = m._fit || 1, n0 = buttons.length, cx = W / 2, cy = H / 2;
  UI._mh = 0; UI._baseT = ctx.getTransform();
  if (k < 1) { ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy); }
  drawModal0();
  if (k < 1) {
    ctx.restore();
    for (var i = n0; i < buttons.length; i++) { var b = buttons[i]; b.x = cx + (b.x - cx) * k; b.y = cy + (b.y - cy) * k; b.w *= k; b.h *= k; }
  }
  if (UI.modal === m && UI._mh > 0) { var need = Math.min(1, (H - 8 * S) / UI._mh); if (Math.abs(need - k) > 0.01) m._fit = need; }
}
function drawModal0() {
  var m = UI.modal; if (!m) return;
  if (m.type === 'comic') { Z.drawComic(m); return; }
  if (m.type === 'cut') { Z.drawCut(m); return; }
  var w = mw(), f, y;
  if (UI.customModal && UI.customModal(m, w)) return;
  if (m.type === 'intro') {
    var o = m.o, title = o.kind === 'enemy' ? T('newEnemy') : o.kind === 'tower' ? T('newTower') : o.kind === 'skill' ? T('newSkill') : o.kind === 'hero' ? T('hero') : o.kind === 'ally' ? T('newAlly') : o.kind === 'trap' ? T('newTrap') : T('escortT');
    var preDs = o.kind === 'enemy' ? T('e_' + o.id + 'D') : o.kind === 'tower' ? T('t_' + o.id + 'D') : o.kind === 'skill' ? '' : o.kind === 'trap' ? T('tr_' + o.id + 'D') + '. ' + T('tip_trap') : o.kind === 'ally' ? T('al_' + o.id + 'D') : o.kind === 'hero' ? T('heroD') : T('escortD');
    var preN = D.wrap(preDs, w - 44 * S, 15 * S).length;
    f = frame(w, Math.min(H * 0.94, 330 * S + Math.max(0, preN - 2) * 19 * S), title);
    var cx = f.x + w / 2, cy = f.y + 135 * S;
    ctx.save(); ctx.globalAlpha = 0.5; ctx.translate(cx, cy - 30 * S); ctx.rotate(Z.time * 0.5);
    for (var r2 = 0; r2 < 12; r2++) { ctx.rotate(Math.PI / 6); D.poly([0, 0, -12 * S, -85 * S, 12 * S, -85 * S], '#ffe9a8'); }
    ctx.restore();
    var nm, ds;
    if (o.kind === 'enemy') { var fake = { type: o.id, size: Math.min(1.6, Z.ENEMIES[o.id].size), dir: 1, walk: Z.time * 4, ph: 0, hitT: 0, slow: 0, hp: 1, max: 1, air: false, boss: false }; D.enemy(fake, cx, cy + (Z.ENEMIES[o.id].air ? -10 * S : 10 * S), 80 * S, Z.time); nm = T('e_' + o.id); ds = T('e_' + o.id + 'D'); }
    else if (o.kind === 'tower') { D.tower({ type: o.id, lvl: 1, ang: -0.5, recoil: 0, spin: Z.time * 6, pop: 0, stun: 0, firing: true }, cx, cy + 20 * S, 110 * S, Z.time); nm = T('t_' + o.id); ds = T('t_' + o.id + 'D'); }
    else if (o.kind === 'skill') { D.circ(cx, cy - 20 * S, 40 * S, '#fff', 3 * S); if (o.id === 'bomb') D.gift(cx, cy - 14 * S, 24 * S); else { ctx.save(); ctx.translate(cx, cy - 10 * S); D.sleighAir = true; D.sleigh(0, 0, 34 * S, 1, Z.time, 0); D.sleighAir = false; ctx.restore(); } nm = T('sk_' + o.id); ds = ''; }
    else if (o.kind === 'trap') { D.trap({ type: o.id, t: 0 }, cx, cy - 10 * S, 110 * S, Z.time); nm = T('tr_' + o.id); ds = T('tr_' + o.id + 'D') + '. ' + T('tip_trap'); }
    else if (o.kind === 'ally') { D.ally(o.id, cx, cy + 34 * S, 56 * S, { dir: 1 }); nm = T('al_' + o.id); ds = T('al_' + o.id + 'D'); }
    else if (o.kind === 'hero') { D.moroz(cx, cy + 30 * S, 62 * S, { dir: 1 }); nm = T('hero'); ds = T('heroD'); }
    else { ctx.save(); ctx.translate(cx, cy); D.sleigh(0, 0, 60 * S, 1, Z.time, 0); ctx.restore(); nm = T('escortT'); ds = T('escortD'); }
    D.text(nm, cx, f.y + 190 * S, D.fitText(nm, w - 40 * S, 24 * S), OL);
    var dl = D.wrap(ds, w - 44 * S, 15 * S);
    for (var i = 0; i < dl.length; i++) D.text(dl[i], cx, f.y + 218 * S + i * 19 * S, 15 * S, '#4a5378');
    bigBtn('mok', f, f.y + f.h - 70 * S, T('ok'), function () { UI.closeModal(); });
  } else if (m.type === 'levelStart') {
    if (!UI.L.portrait && H < 500) w = Math.min(UI.L.sw - 16 * S, 640 * S);   // 2.11.5: телефон лёжа — окно шире, отряд и сложность не налезают
    var info = Z.LEVELS[m.idx], st = Z.save.stars[m.idx] || 0;
    var hasHero = st >= 3, sq = m.idx >= 3, sqH = UI.squadPickerH ? UI.squadPickerH(m) : (sq ? 96 * S : 0);
    var wM = Z.multsAt && Z.multsAt(m.idx).some(function (k) { return Z.MULTS[k].at === m.idx; }) ? 'm' : (Z.COMICS && Z.COMICS['lv_' + m.idx] ? 'c' : '');
    var needH = 400 * S + sqH + (info.big ? 18 * S : 0) + (Z.LEVEL_MOD[m.idx] ? 20 * S : 0) + (wM ? 32 * S : 0), compact = needH > H * 0.96;
    f = frame(w, compact ? Math.min(H * 0.92, needH - 62 * S) : needH, T('r_' + Z.REGIONS[info.region].id));
    closeX(f);
    D.text(T('lvl') + ' ' + (m.idx + 1) + ' · ' + T(info.type), f.x + w / 2, f.y + 46 * S, 18 * S, OL);
    // 2.7.21: низкое окно (телефон лёжа) — звёзды слева, враги справа в одной строке, иначе кнопки внизу налезали на отряд и сложность
    var cmpL = compact && !UI.L.portrait, scx = cmpL ? f.x + w * 0.2 : f.x + w / 2;
    if (info.big) D.text(T('bigShort'), scx, f.y + (cmpL ? 98 : 66) * S, 13 * S, '#d4602a');
    for (var s2 = 0; s2 < 3; s2++) D.star(scx - 34 * S + s2 * 34 * S, f.y + (cmpL ? 78 : info.big ? 92 : 80) * S, 14 * S, s2 < st ? COL.gold : '#c9cfdc', 2);
    // враги уровня
    var pool = Z.REGIONS[info.region].pool.filter(function (t) { return Z.FIRST[t] <= info.idx; });
    if (info.type === 'boss') pool = pool.concat([Z.REGIONS[info.region].boss]);
    var ewA = cmpL ? w * 0.6 : w - 40 * S, ecx = cmpL ? f.x + w * 0.66 : f.x + w / 2, ew = Math.min(cmpL ? 46 * S : 56 * S, ewA / pool.length);
    pool.forEach(function (tp, k) {
      var ex = ecx - (pool.length - 1) * ew / 2 + k * ew;
      var fk = { type: tp, size: Math.min(1, Z.ENEMIES[tp].size), dir: 1, walk: Z.time * 4 + k, ph: k, hitT: 0, slow: 0, hp: 1, max: 1 };
      D.enemy(fk, ex, f.y + (cmpL ? 100 : 150) * S, ew * 0.95, Z.time);
    });
    var yy = cmpL ? f.y + 112 * S : f.y + 176 * S + (info.big ? 12 * S : 0);
    // пересмотреть мультик или сцену этого уровня
    if (wM && !cmpL) {   // 2.11.5: в низком окне без этой кнопки — мультик и сцену можно пересмотреть кружками на карте
      var wl = wM === 'm' ? T('watchMult') : T('watchScene'), bw0 = Math.min(220 * S, w - 44 * S);
      button('watchM', f.x + (w - bw0) / 2, yy - 5 * S, bw0, 30 * S, { modal: true, r: 9 * S, c1: '#ff8fb1', c2: '#d45a80',
        fn: function () { var keep = m; UI.closeModal(); Z.replayStory(keep.idx, function () { UI.openModal(keep); }); },
        draw: function (bx, by, bw, bh) { UI.filmBadge(bx + 18 * S, by + bh / 2, 7 * S, true); D.text(wl, bx + 30 * S + (bw - 36 * S) / 2, by + bh / 2, Math.max(11, D.fitText(wl, bw - 40 * S, 14 * S)), '#fff', 'center', 'middle', 2 * S); } });
      yy += 32 * S;
    }
    if (Z.LEVEL_MOD[m.idx]) { yy += 20 * S; D.text('⚡ ' + T('mutT') + ': ' + T('mut_' + Z.LEVEL_MOD[m.idx]), f.x + w / 2, yy - 10 * S, D.fitText('⚡ ' + T('mutT') + ': ' + T('mut_' + Z.LEVEL_MOD[m.idx]), w - 40 * S, 13 * S), '#8a3dd4'); }
    if (UI.squadPicker) yy = UI.squadPicker(m, f, w, yy, sqH);
    // 2.10.3: в низком окне сложность не налезает на кнопки — встаёт с ними в один ряд
    var ovl = compact && yy + 60 * S > f.y + f.h - 74 * S, dA = ovl ? (w - 44 * S) * 0.6 : w - 44 * S, dY = ovl ? f.y + f.h - 70 * S - 14 * S + 4 * S : yy;
    if (!ovl) D.text(T('diff'), f.x + w / 2, yy + 4 * S, Math.max(11.5, 13.5 * S), '#4a5378');
    var dsel = m.heroic ? 'heroic' : Z.save.diff === 'easy' ? 'easy' : 'normal', dw = (dA - 12 * S) / 3;
    ['easy', 'normal', 'heroic'].forEach(function (d, k) {
      var lockedH = d === 'heroic' && !hasHero, on = dsel === d;
      button('d_' + d, f.x + 22 * S + k * (dw + 6 * S), dY + 14 * S, dw, ovl ? 50 * S : 40 * S, { modal: true, r: 10 * S, enabled: !lockedH, c1: on ? (d === 'heroic' ? '#ffd54a' : '#4cc77d') : '#dfe7f7', c2: on ? (d === 'heroic' ? COL.goldD : COL.greenD) : '#aab6d6',
        fn: function () { if (d === 'heroic') m.heroic = true; else { m.heroic = false; Z.save.diff = d; Z.persist(); } },
        draw: function (bx, by, bw, bh) { var lb = (on && !ovl ? '✓ ' : '') + T('d_' + d); D.text(lb, bx + bw / 2, by + bh / 2, D.fitText(lb, bw - 8 * S, 14 * S), on ? '#fff' : OL, 'center', 'middle', on ? 2.5 * S : 0); if (lockedH) { D.star(bx + bw - 10 * S, by + 10 * S, 6 * S, COL.gold, 1); } } });
    });
    var dfs = Math.max(11, 12 * S), dd = dsel === 'heroic' ? T('heroicD') : T('d_' + dsel + 'D'), dl2 = D.wrap(dd, w - 44 * S, dfs);
    if (!ovl && (!compact || f.y + f.h - 70 * S > yy + 64 * S + dl2.length * dfs * 1.25)) for (var di = 0; di < dl2.length; di++) D.text(dl2[di], f.x + w / 2, yy + 68 * S + di * dfs * 1.25, dfs, '#4a5378');
    var goSt = function () { var idx = m.idx, h = m.heroic; UI.closeModal(); UI.goLevel(idx, h); };
    if (compact) {
      yy = f.y + f.h - 70 * S; var bx0 = f.x + 22 * S + (ovl ? dA + 10 * S : 0), bwA = w - 44 * S - (ovl ? dA + 10 * S : 0), hw = (bwA - 10 * S) / 2;
      button('mcancel', bx0, yy, hw * 0.7, 54 * S, { modal: true, c1: '#5f74b8', c2: '#43579a', fn: function () { UI.closeModal(); }, label: T('map') });
      button('mstart', bx0 + hw * 0.7 + 10 * S, yy, bwA - hw * 0.7 - 10 * S, 54 * S, { modal: true, c1: '#ff8a3d', c2: '#d4602a', fn: goSt, label: T('start') });
    } else {
      yy = f.y + f.h - 132 * S;
      bigBtn('mstart', f, yy, T('start'), goSt, '#ff8a3d', '#d4602a');
      bigBtn('mcancel', f, yy + 62 * S, T('map'), function () { UI.closeModal(); }, '#5f74b8', '#43579a');
    }
  } else if (m.type === 'win') {
    var G = Z.G, res = G.result;
    f = frame(w, (res.flakes > 0 && !m.mult ? 404 : 360) * S, T('win'));   // 2.11.4: выше — кнопка «x2 награда» не наезжает на «+снежинки»
    for (var s3 = 0; s3 < 3; s3++) {
      var appear = Math.min(1, Math.max(0, m.t * 3 - s3 * 0.6)), sz = (s3 === 1 ? 30 : 24) * S * (appear < 1 ? 0.5 + appear * 0.7 : 1);
      D.star(f.x + w / 2 + (s3 - 1) * 66 * S, f.y + (s3 === 1 ? 72 : 82) * S, sz, s3 < res.stars && appear > 0 ? COL.gold : '#c9cfdc', 3);
    }
    D.text(T('reward'), f.x + w / 2, f.y + 130 * S, 17 * S, OL);
    D.flakeIcon(f.x + w / 2 - 30 * S, f.y + 164 * S, 14 * S); D.text('+' + (res.flakes * (m.mult || 1)), f.x + w / 2 - 10 * S, f.y + 165 * S, 26 * S, '#2a8bbd', 'left');
    y = f.y + f.h - 3 * 62 * S - 6 * S;
    if (res.flakes > 0 && !m.mult) adButton('wx2', f.x + 22 * S, y, w - 44 * S, 54 * S, T('x2'), function () { Z.SDK.rewarded(function () { m.mult = 2; Z.save.flakes += res.flakes; Z.persist(true); Z.AU.sfx('reward'); }, function () { Z.lastReward = Z.time; }); });
    y += 62 * S;
    var nextIdx = Math.min(Z.LEVELS.length - 1, G.idx + 1);
    var afterC = (Z.afterComicFor && Z.afterComicFor(G)) || Z.COMIC_AFTER[G.idx];
    var withComic = function (fn) { UI.closeModal(); if (afterC && !Z.save.seen['cut_' + afterC]) { Z.G = null; UI.screen = 'map'; Z.showComic(afterC, fn); } else fn(); };
    bigBtn('wnext', f, y, T('next'), function () { withComic(function () { if (nextIdx !== G.idx && nextIdx <= Z.unlockedLevel()) { UI.goMap(true); setTimeout(function () { UI.openModal({ type: 'levelStart', idx: nextIdx }); }, 50); } else UI.goMap(true); }); });
    bigBtn('wmap', f, y + 62 * S, T('toMap'), function () { withComic(function () { UI.goMap(true); }); }, '#5f74b8', '#43579a');
  } else if (m.type === 'lose') {
    var G2 = Z.G, esc = G2.L.type === 'escort';
    // 2.12.27: отдельной кнопки «Ослабить волну» больше нет — со 2-го поражения «С этой волны» сама делает волну на 25% слабее, молча
    var showWeak = false, autoWeak = G2.losses >= 2 && !G2.heroic;
    f = frame(w, (showWeak ? 452 : 392) * S + (G2.heroic ? 0 : 20 * S) + 18 * S, esc ? T('loseEscort') : T('lose'));
    y = f.y + 40 * S;
    // 2.10.4: «почти!» — показываем, как близко была победа (эффект почти-выигрыша — хочется ещё раз)
    // 2.12.35: «почти-выигрыш» — сколько уровня пройдено, полоской: чем ближе к концу, тем сильнее хочется ещё раз
    var prg = Z.levelProgress ? Z.levelProgress(G2) : 0, pct = Math.round(prg * 100);
    if (pct > 0) {
      var pl = prg >= 0.75 ? Z.TT('Пройдено ' + pct + '% — совсем чуть-чуть!', pct + '% done — so close!') : Z.TT('Пройдено ' + pct + '% уровня', pct + '% of the level done');
      D.text(pl, f.x + w / 2, y, D.fitText(pl, w - 44 * S, 16 * S), prg >= 0.75 ? '#d4602a' : OL);
      var bx0 = f.x + 30 * S, bw0 = w - 60 * S, by0 = y + 14 * S, bh0 = 12 * S;
      D.rr(bx0, by0, bw0, bh0, bh0 / 2); ctx.fillStyle = '#e4dccb'; ctx.fill();
      D.rr(bx0, by0, Math.max(bh0, bw0 * prg), bh0, bh0 / 2); ctx.fillStyle = prg >= 0.75 ? '#ff8a3d' : '#4cc77d'; ctx.fill();
      D.rr(bx0, by0, bw0, bh0, bh0 / 2); ctx.lineWidth = 2 * S; ctx.strokeStyle = OL; ctx.stroke();
      D.star(bx0 + bw0, by0 + bh0 / 2, 9 * S);
      y += 40 * S;
    }
    var hint = ['hint4', 'hint1', 'hint2', 'hint3'][(G2.idx + G2.losses) % 4];
    var hl = D.wrap(T('hint') + ': ' + T(hint), w - 44 * S, 14 * S);
    for (var h2 = 0; h2 < hl.length; h2++) D.text(hl[h2], f.x + w / 2, y + h2 * 18 * S, 14 * S, '#4a5378');
    y = y + hl.length * 18 * S + 14 * S;
    if (!G2.heroic) {
      adButton('lcont', f.x + 22 * S, y, w - 44 * S, 54 * S, T('adContinue'), function () {
        Z.SDK.rewarded(function () { m.rew = true; }, function () { Z.lastReward = Z.time; if (m.rew) { UI.closeModal(); Z.reviveHere(); } });   // 2.12.26: продолжаем с места поражения
      });
      // что даёт «Продолжить» — мелкой строкой под кнопкой
      var cl = Z.TT('Вышки целы · +' + Z.contBonus(G2) + ' монет · враги отброшены и замедлены', 'Towers repaired · +' + Z.contBonus(G2) + ' coins · enemies pushed back & slowed');
      D.text(cl, f.x + w / 2, y + 66 * S, D.fitText(cl, w - 40 * S, 12.5 * S), '#2a8bbd', 'center', 'middle');
      y += 82 * S;
      y = bigBtn('lretry', f, y, T('retryWave'), function () { UI.closeModal(); Z.restoreCheckpoint({ weaker: autoWeak }); }, '#ff8a3d', '#d4602a');
      if (showWeak) y = bigBtn('lweak', f, y, T('weaker'), function () { UI.closeModal(); Z.restoreCheckpoint({ weaker: true }); }, '#3fb6e6', '#2a8bbd');
    }
    y = bigBtn('lrestart', f, y, T('retryLevel'), function () { var idx = G2.idx, h = G2.heroic; UI.closeModal(); var go = function () { UI.goLevel(idx, h); }; if (Z.canInter && Z.canInter()) { Z.lastFullAd = Z.time; Z.SDK.fullscreen(go); } else go(); });
    bigBtn('lmap', f, y, T('toMap'), function () { UI.closeModal(); UI.goMap(true); }, '#5f74b8', '#43579a');
  } else if (m.type === 'set2') {   // 2.11.5: настройки по вкладкам — всё видно сразу, у каждой строки пояснение, варианты — кнопками
    var TT2 = function (r, e) { return Z.LANG === 'en' ? e : r; }, VS = Z.voiceSettings(), sv = function () { Z.persist(); };
    var applyRes = function () { Z.quality = 1; if (Z.resize) Z.resize(); UI.fieldCache = null; if (Z.G) Z.G.fieldDirty = true; };
    var hz = Z.screenHz ? Z.screenHz() : 0;
    var TABS = [['vol', TT2('Громкость', 'Volume')], ['snd', TT2('Звук', 'Sound')], ['gfx', TT2('Графика', 'Graphics')], ['fx', TT2('Эффекты', 'Effects')], ['game', TT2('Игра', 'Game')]];
    var tab = m.tab || 'vol';
    var ROWS = {
      snd: [
        [TT2('Озвучка', 'Voices'), TT2('Голоса героев и мультфильмов', 'Hero and cartoon voices'), [[1, TT2('Вкл', 'On')], [0, TT2('Выкл', 'Off')]], VS.voiceOn ? 1 : 0, function (v) { VS.voiceOn = !!v; }],
        [TT2('Субтитры', 'Subtitles'), TT2('Текст реплик внизу экрана', 'Text of the lines at the bottom'), [[1, TT2('Вкл', 'On')], [0, TT2('Выкл', 'Off')]], VS.subs !== false ? 1 : 0, function (v) { VS.subs = !!v; }],
        [TT2('Перепалки', 'Banter'), TT2('Как часто герои шутят в бою', 'How often heroes chat in battle'), [['often', TT2('Часто', 'Often')], ['normal', TT2('Обычно', 'Normal')], ['rare', TT2('Редко', 'Rare')], ['off', TT2('Выкл', 'Off')]], VS.banter, function (v) { VS.banter = v; }],
        [TT2('Объёмный звук', 'Positional sound'), TT2('Звук слышен оттуда, где он на поле', 'Sounds come from their place on the field'), [['off', TT2('Выкл', 'Off')], ['on', TT2('Вкл', 'On')], ['hp', TT2('Наушники 3D', 'Headphones 3D')]], Z.save.spatial === false ? 'off' : Z.save.hrtf ? 'hp' : 'on', function (v) { Z.save.spatial = v !== 'off'; Z.save.hrtf = v === 'hp'; }]
      ],
      gfx: [
        [TT2('Разрешение', 'Resolution'), TT2('Меньше — выше FPS, картинка мягче', 'Lower = more FPS, softer image'), [[0, TT2('Авто', 'Auto')], [1, '100%'], [0.85, '85%'], [0.7, '70%'], [0.55, '55%']], Z.save.rscale || 0, function (v) { Z.save.rscale = v || null; applyRes(); }],
        [TT2('Кадров в секунду', 'Frame rate'), (hz ? TT2('Экран: ' + hz + ' Гц — выше не бывает', 'Screen: ' + hz + ' Hz — the maximum') : TT2('Больше — плавнее, меньше — дольше батарея', 'More = smoother, less = longer battery')), [[30, '30'], [45, '45'], [60, '60'], [90, '90'], [120, '120'], [144, '144'], [240, '240']], Z.save.fps || 60, function (v) { Z.save.fps = v; }],
        [TT2('Резкость', 'Sharpness'), Z.isPhone ? TT2('На телефоне не нужна — экран и так чёткий', 'Not needed on phones') : Z.sharpAutoOff ? TT2('Выключена: устройство не тянет', 'Off: device too slow') : TT2('Чётче картинка, особенно при 55–85%', 'Crisper image, best at 55–85%'), [[0, TT2('Выкл', 'Off')], [1, TT2('Слабая', 'Low')], [2, TT2('Средняя', 'Mid')], [3, TT2('Сильная', 'High')]], Z.save.sharp || 0, function (v) { Z.save.sharp = v; Z.sharpAutoOff = false; }],
        [TT2('Вечерний свет', 'Evening light'), TT2('Тёплый закатный свет на уровнях', 'Warm sunset light on levels'), [[1, TT2('Вкл', 'On')], [0, TT2('Выкл', 'Off')]], Z.save.eveLight ? 1 : 0, function (v) { Z.save.eveLight = !!v; }]
      ],
      fx: [   // 2.12.12: эффекты по отдельности — всё включено по умолчанию
        [TT2('Блики на воде', 'Water glints'), TT2('Бегущая сетка света на реках и болоте', 'Moving light pattern on rivers and swamp'), [[1, TT2('Вкл', 'On')], [0, TT2('Выкл', 'Off')]], Z.save.fxCaust === false ? 0 : 1, function (v) { Z.save.fxCaust = !!v; }],
        [TT2('Тени и блёстки', 'Shadows and sparkles'), TT2('Тени облаков и искры на снегу', 'Cloud shadows and snow sparkles'), [[1, TT2('Вкл', 'On')], [0, TT2('Выкл', 'Off')]], Z.save.shadowsOff ? 0 : 1, function (v) { Z.save.shadowsOff = !v; UI.fieldCache = null; if (Z.G) Z.G.fieldDirty = true; }],
        [TT2('Следы на снегу', 'Snow tracks'), TT2('Тропинки, следы саней и ямки от взрывов', 'Paths, sled tracks and blast pits'), [[1, TT2('Вкл', 'On')], [0, TT2('Выкл', 'Off')]], Z.save.fxTracks === false ? 0 : 1, function (v) { Z.save.fxTracks = !!v; }],
        [TT2('Погода', 'Weather'), TT2('Снегопад, дождь и туман над полем', 'Snowfall, rain and fog over the field'), [[1, TT2('Вкл', 'On')], [0, TT2('Выкл', 'Off')]], Z.save.fxWeather === false ? 0 : 1, function (v) { Z.save.fxWeather = !!v; }],
        [TT2('Силуэты врагов', 'Enemy outlines'), TT2('Враги видны сквозь постройки и деревья', 'Enemies show through buildings and trees'), [[1, TT2('Вкл', 'On')], [0, TT2('Выкл', 'Off')]], Z.save.fxXray === false ? 0 : 1, function (v) { Z.save.fxXray = !!v; }]
      ],
      game: [
        [TT2('Подсказки', 'Tips'), TT2('Обучающие подсказки во время игры', 'Tutorial tips during play'), [[1, TT2('Вкл', 'On')], [0, TT2('Выкл', 'Off')]], Z.save.tipsOff ? 0 : 1, function (v) { Z.save.tipsOff = !v; if (v) { for (var k in Z.save.seen) if (k.indexOf('tip_') === 0) delete Z.save.seen[k]; } }],
        [TT2('Приёмы героев', 'Hero skills'), TT2('Сами — герои применяют их сами', 'Auto — heroes use them on their own'), [[0, TT2('Сами', 'Auto')], [1, TT2('По нажатию', 'On tap')]], Z.save.ultManual ? 1 : 0, function (v) { Z.save.ultManual = !!v; }],
        [TT2('Подтверждать постройку', 'Confirm building'), TT2('Сначала призрак вышки, потом ✓', 'Show a ghost tower first, then ✓'), [[1, TT2('Вкл', 'On')], [0, TT2('Выкл', 'Off')]], Z.save.quickBuild === false ? 1 : 0, function (v) { Z.save.quickBuild = !v; }],
        [TT2('Приближать при постройке', 'Zoom when building'), TT2('Камера подъезжает к месту постройки', 'Camera moves in to the build spot'), [[1, TT2('Вкл', 'On')], [0, TT2('Выкл', 'Off')]], Z.save.autoZoom !== false ? 1 : 0, function (v) { Z.save.autoZoom = !!v; }]
      ]
    };
    var VOL = [[TT2('Музыка', 'Music'), function () { return Z.save.music; }, function (v) { Z.save.music = v; Z.AU.setVolumes(Z.save.music, Z.save.sfx); }],
      [TT2('Все звуки', 'All sounds'), function () { return Z.save.sfx; }, function (v) { Z.save.sfx = v; Z.AU.setVolumes(Z.save.music, Z.save.sfx); Z.AU.sfx('ui_tap'); }]];
    (Z.AU.mixRows ? Z.AU.mixRows() : []).forEach(function (r) { VOL.push([r.label, r.get, function (v) { r.set(v); if (r.demo) r.demo(); }]); });
    var fw2 = Math.min(W * 0.96, 640 * S), wide = fw2 >= 520 * S, rh2 = wide ? 58 * S : 86 * S, vh = 62 * S;
    var hTab = function (t) { return t === 'vol' ? VOL.length * vh : ROWS[t].length * rh2; };
    var maxC = Math.max(hTab('vol'), hTab('snd'), hTab('gfx'), hTab('fx'), hTab('game'));
    // 2.12.13: вкладки в один ряд, только если подписи помещаются крупно; на узком экране (телефон стоя) — два ряда
    var tRows = (fw2 - 44 * S) / TABS.length < 96 * S ? 2 : 1, tPer = Math.ceil(TABS.length / tRows), tExtra = (tRows - 1) * 44 * S;
    f = frame(fw2, 44 * S + 46 * S + tExtra + maxC + 70 * S, TT2('Настройки', 'Settings'));
    closeX(f);
    TABS.forEach(function (q, i) {
      var on2 = q[0] === tab, row = Math.floor(i / tPer), col = i % tPer, nRow = row < tRows - 1 ? tPer : TABS.length - tPer * (tRows - 1), tw = (fw2 - 44 * S - (nRow - 1) * 6 * S) / nRow;
      button('st_' + q[0], f.x + 22 * S + col * (tw + 6 * S), f.y + 36 * S + row * 44 * S, tw, 38 * S, { modal: true, r: 12 * S, c1: on2 ? '#ffd54a' : '#ffffff', c2: on2 ? COL.goldD : COL.panelD, fn: function () { m.tab = q[0]; },
        draw: function (bx, by, bw, bh) { D.text(q[1], bx + bw / 2, by + bh / 2, Math.max(12, D.fitText(q[1], bw - 12 * S, 16 * S)), on2 ? '#fff' : OL, 'center', 'middle', on2 ? 3 * S : 0); } });
    });
    y = f.y + 36 * S + 50 * S + tExtra;
    if (tab === 'vol') {
      VOL.forEach(function (r, i) { y = volRow('sv' + i, f, y, r[0], r[1](), function (v) { r[2](v); sv(); }); });
    } else {
      ROWS[tab].forEach(function (r, i) {
        var x0 = f.x + 22 * S, rw = fw2 - 44 * S;
        D.rr(x0, y, rw, rh2 - 6 * S, 12 * S); ctx.fillStyle = COL.panelD; ctx.fill();
        var lw = wide ? rw * 0.46 : rw - 24 * S, cx0 = wide ? x0 + rw * 0.46 : x0 + 8 * S, cw0 = wide ? rw * 0.54 - 8 * S : rw - 16 * S, cy0 = wide ? y + 9 * S : y + 44 * S, ch0 = wide ? rh2 - 24 * S : 34 * S;
        D.text(r[0], x0 + 12 * S, y + (wide ? 17 * S : 14 * S), Math.max(11, D.fitText(r[0], lw - 16 * S, 15 * S)), OL, 'left');
        D.text(r[1], x0 + 12 * S, y + (wide ? 36 * S : 31 * S), Math.max(9.5, D.fitText(r[1], lw - 16 * S, 11.5 * S)), '#6a7394', 'left');
        var n = r[2].length, gap = 4 * S, bw2 = (cw0 - gap * (n - 1)) / n;
        r[2].forEach(function (op, k) {
          var sel = op[0] === r[3];
          button('so_' + tab + i + '_' + k, cx0 + k * (bw2 + gap), cy0, bw2, ch0, { modal: true, r: 9 * S, c1: sel ? '#4cc77d' : '#ffffff', c2: sel ? COL.greenD : '#c9cfdc', fn: function () { r[4](op[0]); sv(); },
            draw: function (bx, by, bw, bh) { D.text(op[1], bx + bw / 2, by + bh / 2, Math.max(9.5, D.fitText(op[1], bw - 8 * S, 13 * S)), sel ? '#fff' : OL, 'center', 'middle', sel ? 2 * S : 0); } });
        });
        y += rh2;
      });
    }
    bigBtn('st_ok', f, f.y + f.h - 62 * S, TT2('Готово', 'Done'), function () { Z.persist(); UI.closeModal(); }, '#ff8a3d', '#d4602a');
  } else if (m.type === 'mix') {   // 2.11.5: громкость по видам звука
    var MX = Z.AU.mixRows ? Z.AU.mixRows() : [], kk = Math.min(1, (H * 0.9 - 110 * S) / ((MX.length + 2) * 62 * S)), rH = 62 * S * kk;
    f = frame(Math.min(w, 460 * S), 52 * S + (MX.length + 2) * rH + 64 * S, Z.LANG === 'en' ? 'Volume by type' : 'Громкость по видам');
    y = f.y + 44 * S;
    y = volRow('xm', f, y, T('music'), Z.save.music, function (v) { Z.save.music = v; Z.AU.setVolumes(Z.save.music, Z.save.sfx); Z.persist(); }, kk);
    y = volRow('xs', f, y, Z.LANG === 'en' ? 'All sounds' : 'Все звуки', Z.save.sfx, function (v) { Z.save.sfx = v; Z.AU.setVolumes(Z.save.music, Z.save.sfx); Z.AU.sfx('ui_tap'); Z.persist(); }, kk);
    MX.forEach(function (r) { y = volRow('x_' + r.k, f, y, r.label, r.get(), function (v) { r.set(v); Z.persist(); if (r.demo) r.demo(); }, kk); });
    bigBtn('x_back', f, y + 4 * S, T('resume'), function () { UI.closeModal(); }, '#ff8a3d', '#d4602a');
  } else if (m.type === 'pause') {
    // 2.12.28: пауза разгружена. Было: две строки громкости, мелкий текст авторов и 5–6 одинаковых длинных кнопок.
    // Стало: большая «Продолжить» сверху, ряд квадратных значков (музыка и звук — включить/выключить, как играть, настройки…)
    // и «Выйти на карту» внизу. Точная громкость — в «Настройках», авторы — в «Как играть»
    var TP = function (r, e) { return Z.LANG === 'en' ? e : r; };
    var fsAvail = (document.fullscreenEnabled || document.webkitFullscreenEnabled) && !Z.isPhone;
    var noAdBtn = !!(Z.platHas && Z.platHas('pay') && Z.save.shop && !Z.save.shop.noads);
    var acct = m.map && (!Z.platHas || Z.platHas('login'));
    var tog = function (kk) { var v = Z.save[kk]; if (v > 0) { Z.save[kk + 'Prev'] = v; Z.save[kk] = 0; } else Z.save[kk] = Z.save[kk + 'Prev'] || (kk === 'music' ? 0.7 : 0.9); Z.AU.setVolumes(Z.save.music, Z.save.sfx); if (Z.save.sfx > 0) Z.AU.sfx('ui_tap'); Z.persist(); };
    var tiles = [
      { id: 'pz_mus', t: TP('Музыка', 'Music'), off: !(Z.save.music > 0), ic: 'note', fn: function () { tog('music'); } },
      { id: 'pz_snd', t: TP('Звук', 'Sound'), off: !(Z.save.sfx > 0), ic: 'spk', fn: function () { tog('sfx'); } },
      { id: 'pz_how', t: TP('Как играть', 'How to'), ic: 'q', c1: '#4cc77d', c2: COL.greenD, fn: function () { UI.goModal({ type: 'howto', back: m }); } },
      { id: 'pz_set', t: TP('Настройки', 'Settings'), ic: 'gear', c1: '#9a7ce8', c2: '#6b3fa0', fn: function () { UI.goModal({ type: 'set2', tab: 'vol', back: m }); } }
    ];
    if (fsAvail) tiles.push({ id: 'pz_fs', t: TP('Экран', 'Screen'), ic: 'fs', c1: '#3fb6e6', c2: '#2a8bbd', fn: function () { Z.toggleFullscreen(); } });
    if (acct) tiles.push({ id: 'pz_acc', t: TP('Аккаунт', 'Account'), ic: 'acc', c1: '#9a7ce8', c2: '#6b3fa0', fn: function () { UI.goModal({ type: 'acct', back: m }); } });
    if (noAdBtn) tiles.push({ id: 'pz_noad', t: TP('Без рекламы', 'No ads'), ic: 'noad', c1: '#ff8fb1', c2: '#d45a80', fn: function () { if (Z.openNoAds) Z.openNoAds(); else { UI.closeModal(); UI.openModal({ type: 'shop' }); } } });
    var gap = 10 * S, perMax = Math.min(tiles.length, Math.max(3, Math.floor((w - 36 * S + gap) / (64 * S + gap)))), rowsN = Math.ceil(tiles.length / perMax), perRow = Math.ceil(tiles.length / rowsN);   // ряды поровну (3+2, а не 4+1)
    var tw0 = Math.min(84 * S, (w - 36 * S - (perRow - 1) * gap) / perRow), th0 = tw0 * 0.92;
    var resH = m.map ? 0 : 62 * S + 12 * S, quitH = m.map ? 0 : 54 * S + 6 * S;
    var hh = 46 * S + resH + rowsN * (th0 + gap) + quitH + 14 * S, kk = Math.min(1, (H * 0.92) / hh);
    if (kk < 1) { tw0 *= kk; th0 *= kk; resH *= kk; quitH *= kk; hh = 46 * S + resH + rowsN * (th0 + gap) + quitH + 14 * S; }
    f = frame(w, hh, m.map ? TP('Настройки', 'Settings') : T('settings'));
    y = f.y + 40 * S;
    if (!m.map) {
      var rh = resH - 12 * S;
      button('mres', f.x + 18 * S, y, w - 36 * S, rh, { modal: true, c1: '#4cc77d', c2: COL.greenD, r: 16 * S, fn: function () { Z.persist(); UI.closeModal(); }, draw: function (bx, by, bw, bh) {
        var tx = bx + bw / 2, ty = by + bh / 2; D.text(T('resume'), tx, ty, D.fitText(T('resume'), bw - 40 * S, 24 * S), '#fff', 'center', 'middle', 3.5 * S); } });
      y += resH;
    }
    var icon = function (ic, x, yy, r, off) {
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (ic === 'note') { ctx.fillStyle = '#fff'; ctx.strokeStyle = OL; ctx.lineWidth = Math.max(1.5, r * 0.14);
        ctx.beginPath(); ctx.ellipse(x - r * 0.45, yy + r * 0.55, r * 0.34, r * 0.26, -0.4, 0, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x + r * 0.5, yy + r * 0.35, r * 0.34, r * 0.26, -0.4, 0, 7); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - r * 0.14, yy + r * 0.5); ctx.lineTo(x - r * 0.14, yy - r * 0.6); ctx.lineTo(x + r * 0.82, yy - r * 0.8); ctx.lineTo(x + r * 0.82, yy + r * 0.3); ctx.lineWidth = r * 0.34; ctx.stroke(); ctx.lineWidth = r * 0.16; ctx.strokeStyle = '#fff'; ctx.stroke(); }
      else if (ic === 'spk') { ctx.beginPath(); ctx.moveTo(x - r * 0.9, yy - r * 0.32); ctx.lineTo(x - r * 0.45, yy - r * 0.32); ctx.lineTo(x + r * 0.1, yy - r * 0.8); ctx.lineTo(x + r * 0.1, yy + r * 0.8); ctx.lineTo(x - r * 0.45, yy + r * 0.32); ctx.lineTo(x - r * 0.9, yy + r * 0.32); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.14); ctx.strokeStyle = OL; ctx.stroke();
        if (!off) for (var wv = 0; wv < 2; wv++) { ctx.beginPath(); ctx.arc(x + r * 0.15, yy, r * (0.45 + wv * 0.38), -0.8, 0.8); ctx.lineWidth = r * 0.3; ctx.strokeStyle = OL; ctx.stroke(); ctx.lineWidth = r * 0.14; ctx.strokeStyle = '#fff'; ctx.stroke(); } }
      else if (ic === 'q') { D.circ(x, yy, r * 0.95, '#fff', Math.max(1.5, r * 0.14)); D.text('?', x, yy + r * 0.05, r * 1.35, '#2c9a5a', 'center', 'middle'); }
      else if (ic === 'gear') gear(x, yy, r * 0.95);
      else if (ic === 'fs') { ctx.strokeStyle = OL; ctx.lineWidth = r * 0.42; for (var pass = 0; pass < 2; pass++) { [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (q) { ctx.beginPath(); ctx.moveTo(x + q[0] * r * 0.85, yy + q[1] * r * 0.25); ctx.lineTo(x + q[0] * r * 0.85, yy + q[1] * r * 0.85); ctx.lineTo(x + q[0] * r * 0.25, yy + q[1] * r * 0.85); ctx.stroke(); }); ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.2; } }
      else if (ic === 'acc') { D.circ(x, yy - r * 0.35, r * 0.42, '#fff', Math.max(1.5, r * 0.14)); ctx.beginPath(); ctx.arc(x, yy + r * 0.95, r * 0.8, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.14); ctx.strokeStyle = OL; ctx.stroke(); }
      else if (ic === 'noad' && Z.noAdIcon) Z.noAdIcon(x, yy, r * 0.8);
      if (off) { ctx.beginPath(); ctx.moveTo(x - r, yy + r * 0.9); ctx.lineTo(x + r, yy - r * 0.9); ctx.lineWidth = r * 0.36; ctx.strokeStyle = OL; ctx.stroke(); ctx.lineWidth = r * 0.2; ctx.strokeStyle = '#ff5a5f'; ctx.stroke(); }
      ctx.restore();
    };
    tiles.forEach(function (tl, i) {
      var row = Math.floor(i / perRow), col = i % perRow, nRow = Math.min(perRow, tiles.length - row * perRow), rw = nRow * tw0 + (nRow - 1) * gap;
      var tx = f.x + (w - rw) / 2 + col * (tw0 + gap), ty = y + row * (th0 + gap);
      var c1 = tl.off ? '#9aa3b8' : (tl.c1 || '#5f74b8'), c2 = tl.off ? '#737c93' : (tl.c2 || '#43579a');
      button(tl.id, tx, ty, tw0, th0, { modal: true, r: 14 * S, c1: c1, c2: c2, fn: tl.fn, draw: function (bx, by, bw, bh) {
        icon(tl.ic, bx + bw / 2, by + bh * 0.4, bh * 0.2, tl.off);
        var cap = tl.t; /* выключенное — серым и перечёркнутым, подпись та же */ D.text(cap, bx + bw / 2, by + bh - 12 * S * Math.min(1, bh / (60 * S)), Math.max(10, D.fitText(cap, bw - 8 * S, 12.5 * S)), '#fff', 'center', 'middle', 2.5 * S); } });
    });
    y += rowsN * (th0 + gap);
    if (!m.map) button('mquit', f.x + 18 * S, y + 2 * S, w - 36 * S, quitH - 6 * S, { modal: true, c1: '#5f74b8', c2: '#43579a', label: T('quit'), fn: function () { UI.closeModal(); UI.goMap(false); } });
    if (m.map) closeX(f);
  } else if (m.type === 'research') {
    var rowH = 48 * S, list = Z.RESEARCH;
    f = frame(w, 70 * S + list.length * (rowH + 5 * S) + 20 * S, T('research'));
    D.flakeIcon(f.x + w / 2 - 22 * S, f.y + 40 * S, 11 * S); D.text(Z.fmt(Z.save.flakes), f.x + w / 2 - 6 * S, f.y + 41 * S, 19 * S, '#2a8bbd', 'left');
    list.forEach(function (rs, k) {
      var ry = f.y + 62 * S + k * (rowH + 5 * S), lvl = Z.save.research[rs.id] || 0, maxed = lvl >= rs.max, c = Z.researchCost(lvl), can = !maxed && Z.save.flakes >= c;
      D.rr(f.x + 12 * S, ry, w - 24 * S, rowH, 10 * S); ctx.fillStyle = COL.panelD; ctx.fill();
      var isT = rs.id.indexOf('t_') === 0, nm = isT ? T(rs.id) : T('r_' + rs.id), dsc = isT ? T('r_t') : T('r_' + rs.id + 'D');
      var lockedT = isT && !Z.save.seen['t_' + rs.id.slice(2)] && Z.TOWERS[rs.id.slice(2)].unlock > Z.unlockedLevel();
      var rtw = w - 24 * S - 92 * S - 22 * S;   // 2.7.21: текст до кнопки, не мельче 10,5 пикс.
      D.text(nm + ' (' + lvl + '/' + rs.max + ')', f.x + 22 * S, ry + rowH * 0.34, Math.max(11, D.fitText(nm + ' (5/5)', rtw, 14 * S)), lockedT ? '#9aa3b8' : OL, 'left');
      D.text(dsc, f.x + 22 * S, ry + rowH * 0.73, Math.max(10.5, D.fitText(dsc, rtw, 12 * S)), '#5a6385', 'left');
      var bw = 92 * S;
      button('rs_' + rs.id, f.x + w - 20 * S - bw, ry + 6 * S, bw, rowH - 8 * S, { modal: true, enabled: !maxed && !lockedT, c1: can ? '#3fb6e6' : '#9aa6c4', c2: can ? '#2a8bbd' : '#6f7c9c', r: 10 * S,
        fn: function () { if (!can) { Z.AU.sfx('error'); if (Z.needFlakes) Z.needFlakes(c); return; } Z.save.flakes -= c; Z.save.research[rs.id] = lvl + 1; Z.AU.sfx('levelup'); Z.persist(true); },
        draw: function (bx, by, bww, bhh) { if (maxed) { D.text(T('max'), bx + bww / 2, by + bhh / 2, 15 * S, '#fff', 'center', 'middle', 3 * S); return; } D.flakeIcon(bx + 18 * S, by + bhh / 2, 7 * S); D.text('' + c, bx + 30 * S, by + bhh / 2 + 1, 16 * S, '#fff', 'left', 'middle', 3 * S); } });
    });
    closeX(f);
  } else if (m.type === 'branch') {
    var tw = m.tw, G3 = Z.G, bc = Z.branchCost(tw.type);
    f = frame(Math.min(W * 0.94, 470 * S), 330 * S, T('branchT'));
    var cwid = (f.w - 56 * S) / 2;
    D.coin(f.x + f.w / 2 - 22 * S, f.y + 40 * S, 9 * S); D.text(Z.fmt(bc), f.x + f.w / 2 - 8 * S, f.y + 41 * S, 17 * S, G3.coins >= bc ? '#b8860b' : COL.red, 'left');
    ['a', 'b'].forEach(function (br, k) {
      var bx0 = f.x + 22 * S + k * (cwid + 12 * S), by0 = f.y + 58 * S;
      button('br_' + br, bx0, by0, cwid, 250 * S, { modal: true, r: 14 * S, enabled: G3.coins >= bc, c1: '#fdf7ec', c2: COL.panelD, fn: function () { if (Z.setBranch(tw, br)) UI.closeModal(); else Z.AU.sfx('error'); },
        draw: function (bx, by, bw, bh) {
          D.tower({ type: tw.type, lvl: 5, branch: br, ang: -0.6, recoil: 0, spin: Z.time * 6, pop: 0, stun: 0, firing: true }, bx + bw / 2, by + 100 * S, 80 * S, Z.time);
          var bn = T('br_' + tw.type + '_' + br); D.text(bn, bx + bw / 2, by + 158 * S, D.fitText(bn, bw - 12 * S, 17 * S), OL);
          var bl = D.wrap(T('br_' + tw.type + '_' + br + 'D'), bw - 16 * S, 12 * S);
          for (var q = 0; q < bl.length; q++) D.text(bl[q], bx + bw / 2, by + 184 * S + q * 15 * S, 12 * S, '#4a5378');
        } });
    });
    closeX(f);
  } else if (m.type === 'ach') {
    var rowA = 40 * S, perPage = Math.max(4, Math.floor((H * 0.86 - 90 * S) / (rowA + 4 * S))), pages = Math.ceil(Z.ACH.length / perPage);
    m.page = Math.min(m.page || 0, pages - 1);
    var items = Z.ACH.slice(m.page * perPage, m.page * perPage + perPage);
    f = frame(w, 70 * S + items.length * (rowA + 4 * S) + (pages > 1 ? 50 * S : 14 * S), T('ach'));
    items.forEach(function (a, k) {
      var ry = f.y + 50 * S + k * (rowA + 4 * S), have = Z.save.stats[a.stat] || 0, done = Z.save.ach[a.id], ready = !done && have >= a.need;
      D.rr(f.x + 12 * S, ry, w - 24 * S, rowA, 10 * S); ctx.fillStyle = done ? '#e6f6e9' : COL.panelD; ctx.fill();
      var an = T('a_' + a.id); D.text(an, f.x + 22 * S, ry + rowA * 0.36, D.fitText(an, w * 0.55, 13 * S), OL, 'left');
      var pr = Math.min(1, have / a.need); D.rr(f.x + 22 * S, ry + rowA * 0.64, w * 0.5, 6 * S, 3 * S); ctx.fillStyle = '#c9cfdc'; ctx.fill(); D.rr(f.x + 22 * S, ry + rowA * 0.64, w * 0.5 * pr, 6 * S, 3 * S); ctx.fillStyle = done ? '#4cc77d' : '#3fb6e6'; ctx.fill();
      var bw = 92 * S;
      if (done) { D.text(T('achDone'), f.x + w - 20 * S - bw / 2, ry + rowA / 2, 12 * S, COL.greenD); return; }
      button('ac_' + a.id, f.x + w - 20 * S - bw, ry + 5 * S, bw, rowA - 8 * S, { modal: true, enabled: ready, pulse: ready, c1: '#ffd54a', c2: COL.goldD, r: 9 * S,
        fn: function () { Z.save.ach[a.id] = 1; Z.save.flakes += a.rw; if (a.toy && Z.giveToy) Z.giveToy(a.toy); Z.AU.sfx('reward'); Z.persist(true); },
        draw: function (bx, by, bww, bhh) { D.flakeIcon(bx + 18 * S, by + bhh / 2, 7 * S); D.text('+' + a.rw, bx + 30 * S, by + bhh / 2 + 1, 15 * S, '#fff', 'left', 'middle', 3 * S); } });
    });
    if (pages > 1) {
      button('acPrev', f.x + 22 * S, f.y + f.h - 46 * S, 70 * S, 36 * S, { modal: true, enabled: m.page > 0, r: 10 * S, c1: '#5f74b8', c2: '#43579a', label: '‹', fn: function () { m.page--; } });
      D.text((m.page + 1) + '/' + pages, f.x + w / 2, f.y + f.h - 28 * S, 15 * S, OL);
      button('acNext', f.x + w - 92 * S, f.y + f.h - 46 * S, 70 * S, 36 * S, { modal: true, enabled: m.page < pages - 1, r: 10 * S, c1: '#5f74b8', c2: '#43579a', label: '›', fn: function () { m.page++; } });
    }
    closeX(f);
  } else if (m.type === 'cos') {
    var stars = Z.totalStars();
    f = frame(w, 330 * S, T('cos'));
    D.star(f.x + w / 2 - 20 * S, f.y + 40 * S, 10 * S, COL.gold, 1.5); D.text('' + stars, f.x + w / 2 - 4 * S, f.y + 41 * S, 18 * S, OL, 'left');
    ['fort', 'trim'].forEach(function (kind, k) {
      var ry = f.y + 64 * S + k * 122 * S, list = Z.COS[kind], cw2 = (w - 44 * S - 18 * S) / 4;
      D.text(T('cos_' + kind), f.x + w / 2, ry, 15 * S, OL);
      list.forEach(function (c, i) {
        var lock = stars < c.need, on = (Z.save.cos[kind] || 'base') === c.id;
        button('cs_' + kind + c.id, f.x + 22 * S + i * (cw2 + 6 * S), ry + 12 * S, cw2, 92 * S, { modal: true, r: 12 * S, enabled: !lock, c1: on ? '#4cc77d' : '#fdf7ec', c2: on ? COL.greenD : COL.panelD,
          fn: function () { Z.save.cos[kind] = c.id; Z.AU.sfx('select'); Z.persist(); },
          draw: function (bx, by, bw, bh) {
            if (kind === 'fort') { ctx.save(); var sv = Z.save.cos.fort; Z.save.cos.fort = c.id; ctx.beginPath(); ctx.rect(bx + 3, by + 3, bw - 6, bh - 26 * S); ctx.clip(); D.fortress(bx + bw / 2, by + bh * 0.66, bw * 0.36, 1, 0, Z.time); Z.save.cos.fort = sv; ctx.restore(); }
            else { var sv2 = Z.save.cos.trim; Z.save.cos.trim = c.id; D.tower({ type: 'snow', lvl: 1, ang: -0.6, recoil: 0, spin: 0, pop: 0, stun: 0 }, bx + bw / 2, by + bh * 0.62, bw * 0.62, Z.time); Z.save.cos.trim = sv2; }
            if (lock) { D.star(bx + bw / 2 - 9 * S, by + bh - 12 * S, 7 * S, COL.gold, 1); D.text('' + c.need, bx + bw / 2 + 2 * S, by + bh - 11 * S, 13 * S, OL, 'left'); }
            else if (on) D.text('✓', bx + bw / 2, by + bh - 12 * S, 15 * S, '#fff', 'center', 'middle', 2 * S);
          } });
      });
    });
    closeX(f);
  } else if (m.type === 'cuts') {
    var list = UI.cutList ? UI.cutList() : [['intro', 0], ['r1', 7], ['r2', 14], ['r3', 21], ['r4', 28], ['finale', 35]];
    var cc2 = list.length > 6 ? 2 : 1, rws = Math.ceil(list.length / cc2), cwd = (w - 44 * S - (cc2 - 1) * 8 * S) / cc2;
    f = frame(w, 70 * S + rws * 50 * S, T('cartoons'));
    list.forEach(function (q, i) {
      var open = (Z.MULTS && Z.MULTS[q[0]] && Z.MULTS[q[0]].free ? false : Z.unlockedLevel() >= q[1]) || (q[0] === 'finale' && Z.save.stars[34]) || (q[1] === 35 && Z.save.stars[34]) || Z.save.seen['cut_' + q[0]];
      button('cut_' + q[0], f.x + 22 * S + (i % cc2) * (cwd + 8 * S), f.y + 46 * S + Math.floor(i / cc2) * 50 * S, cwd, 44 * S, { modal: true, enabled: !!open, c1: '#ff8fb1', c2: '#d45a80', fn: function () { UI.closeModal(); Z.forceCut = true; Z.showComic(q[0]); },
        draw: function (x, y, bw, bh) { D.textLines(D.fitLines((open ? '▶ ' : '') + T('cutT_' + q[0]), bw - 14 * S, 14 * S, 11, 2), x + bw / 2, y + bh / 2 - 1 * S, '#fff', 'center', 2.5 * S, 1.02); } });   // 2.7.21: длинные названия — в две строки, а не мелко
    });
    closeX(f);
  } else if (m.type === 'lb') {
    f = frame(w, Math.min(H * 0.9, 470 * S), T('rating'));
    var tabs = ['endless', 'stars'], tw2 = (w - 44 * S - 8 * S) / 2;
    tabs.forEach(function (b, k) { button('lbt_' + b, f.x + 22 * S + k * (tw2 + 8 * S), f.y + 34 * S, tw2, 36 * S, { modal: true, r: 10 * S, c1: m.board === b ? '#4cc77d' : '#dfe7f7', c2: m.board === b ? COL.greenD : '#aab6d6', label: b === 'endless' ? T('lbNight') : T('lbStars'), fn: function () { if (m.board !== b) { m.board = b; m.data = null; } } }); });
    if (!m.data && !m.loading) { m.loading = true; Z.SDK.lb(m.board, function (r) { m.data = r; m.loading = false; }); }
    var ly = f.y + 84 * S;
    if (!m.data) D.text(T('loading') + '…', f.x + w / 2, ly + 40 * S, 15 * S, '#4a5378');
    else {
      var rows = m.data.entries.slice(0, Math.floor((f.h - (UI.lbExtra ? 186 : 130) * S) / (30 * S)));
      rows.forEach(function (e, i) {
        var ry = ly + i * 30 * S;
        D.rr(f.x + 16 * S, ry, w - 32 * S, 26 * S, 8 * S); ctx.fillStyle = e.me ? '#ffe9a6' : (i % 2 ? COL.panelD : '#f3ecdc'); ctx.fill();
        var lfs = Math.max(11.5, 13 * S); D.text('#' + e.rank, f.x + 26 * S, ry + 13 * S, lfs, e.rank <= 3 ? '#b8860b' : '#4a5378', 'left');
        D.text(e.name, f.x + 74 * S, ry + 13 * S, Math.max(10.5, D.fitText(e.name, w * 0.5, lfs)), OL, 'left');
        D.text('' + e.score, f.x + w - 28 * S, ry + 13 * S, lfs, OL, 'right');
      });
      if (m.data.test) D.textLines(D.fitLines(T('lbTest'), w - 30 * S, 11.5 * S, 10, 2), f.x + w / 2, f.y + f.h - 20 * S, '#8a93b0');
    }
    if (UI.lbExtra) UI.lbExtra(m, f);
    closeX(f);
  } else if (m.type === 'endless') {
    f = frame(w, 330 * S, T('endless'));
    ctx.save(); D.bigTree(f.x + w / 2, f.y + 150 * S, 110 * S, Z.time, {}); ctx.restore();
    var el = D.wrap(T('endlessD'), w - 44 * S, 14 * S);
    for (var ei = 0; ei < el.length; ei++) D.text(el[ei], f.x + w / 2, f.y + 178 * S + ei * 18 * S, 14 * S, '#4a5378');
    D.text(T('best') + (Z.save.endlessBest || 0), f.x + w / 2, f.y + 178 * S + el.length * 18 * S + 8 * S, 16 * S, OL);
    bigBtn('estart', f, f.y + f.h - 70 * S, T('start'), function () { UI.closeModal(); UI.goEndless(); }, '#ff8a3d', '#d4602a');
    closeX(f);
  } else if (m.type === 'endlessOver') {
    var res2 = Z.G.result;
    f = frame(w, 330 * S, T('endlessOver'));
    D.text(T('wavesHeld') + res2.waves, f.x + w / 2, f.y + 56 * S, 22 * S, OL);
    D.text(res2.record ? T('newRecord') : T('best') + res2.best, f.x + w / 2, f.y + 90 * S, 17 * S, res2.record ? '#d4602a' : '#4a5378');
    D.flakeIcon(f.x + w / 2 - 30 * S, f.y + 132 * S, 14 * S); D.text('+' + (res2.flakes * (m.mult || 1)), f.x + w / 2 - 10 * S, f.y + 133 * S, 26 * S, '#2a8bbd', 'left');
    y = f.y + f.h - 3 * 62 * S - 6 * S;
    if (res2.flakes > 0 && !m.mult) adButton('ex2', f.x + 22 * S, y, w - 44 * S, 54 * S, T('x2'), function () { Z.SDK.rewarded(function () { m.mult = 2; Z.save.flakes += res2.flakes; Z.persist(true); Z.AU.sfx('reward'); }, function () { Z.lastReward = Z.time; }); });
    y += 62 * S;
    bigBtn('eagain', f, y, T('retryLevel'), function () { UI.closeModal(); UI.goEndless(); }, '#ff8a3d', '#d4602a');
    bigBtn('emap', f, y + 62 * S, T('toMap'), function () { UI.closeModal(); UI.goMap(true); }, '#5f74b8', '#43579a');
  } else if (m.type === 'daily' || m.type === 'chest') {
    var isD = m.type === 'daily', rew = isD ? 3 : m.reward;
    f = frame(w, (isD ? 320 : 270) * S, isD ? T('dailyT') : T('chest'));
    var dn = Z.daysToNY(), line = isD ? (dn <= 70 ? T('daysLeft') + dn + T('days') : dn >= 345 ? T('happyNY') : T('dailyGen')) : T('chestD');
    var wl = D.wrap(line, w - 44 * S, 16 * S);
    for (var q = 0; q < wl.length; q++) D.text(wl[q], f.x + w / 2, f.y + 50 * S + q * 20 * S, 16 * S, OL);
    D.gift(f.x + w / 2 - 50 * S, f.y + 112 * S, 24 * S); D.flakeIcon(f.x + w / 2, f.y + 112 * S, 14 * S); D.text('+' + rew, f.x + w / 2 + 20 * S, f.y + 113 * S, 26 * S, '#2a8bbd', 'left');
    if (isD) {
      var give = function (mult) { Z.save.flakes += rew * mult; Z.save.daily = Z.todayStr(); Z.AU.sfx('reward'); Z.persist(true); UI.closeModal(); };
      adButton('dx2', f.x + 22 * S, f.y + f.h - 128 * S, w - 44 * S, 54 * S, T('x2'), function () { Z.SDK.rewarded(function () { m.rew = true; }, function () { Z.lastReward = Z.time; if (m.rew) give(2); }); });
      bigBtn('dtake', f, f.y + f.h - 66 * S, T('take'), function () { give(1); });
    } else bigBtn('ctake', f, f.y + f.h - 66 * S, T('ok'), function () { UI.closeModal(); });
  }
  if (UI.modal) { ctx.restore(); UI.modal.t += 0; }
}
function toggleRow(id, f, y, label, state, fn) {
  var h = 54 * S, bw = 114 * S;
  D.rr(f.x + 22 * S, y, f.w - 44 * S, h - 6 * S, 14 * S); ctx.fillStyle = COL.panelD; ctx.fill();
  D.text(label, f.x + 36 * S, y + (h - 6 * S) / 2, D.fitText(label, f.w - 44 * S - bw - 30 * S, 18 * S), OL, 'left');
  var on = state === T('on');
  button(id, f.x + f.w - 22 * S - bw, y + 2 * S, bw, h - 10 * S, { modal: true, c1: on ? '#4cc77d' : '#9aa3b8', c2: on ? COL.greenD : '#737c93', label: state, fn: fn });
  return y + h + 8 * S;
}
function volRow(id, f, y, label, val, set, k) {   // 2.11.5: 10 делений (шаг 10%) вместо 5; k — масштаб строки
  var h = 54 * S * (k || 1), bw = 54 * S * (k || 1), nb = 10, sw = 8 * S;
  D.rr(f.x + 22 * S, y, f.w - 44 * S, h - 6 * S, 14 * S); ctx.fillStyle = COL.panelD; ctx.fill();
  var steps = Math.round(val * nb), bx0 = f.x + f.w - 22 * S - bw * 2 - 6 * S - nb * sw - 8 * S;
  D.text(label, f.x + 36 * S, y + (h - 6 * S) / 2, Math.max(11, D.fitText(label, bx0 - f.x - 44 * S, 17 * S)), OL, 'left');
  for (var i = 0; i < nb; i++) { var bh0 = (h - 26 * S) * (0.35 + 0.65 * i / (nb - 1)); D.rr(bx0 + i * sw, y + (h - 6 * S) / 2 + (h - 26 * S) / 2 - bh0, 6 * S, bh0, 2 * S); ctx.fillStyle = i < steps ? '#4cc77d' : '#c9cfdc'; ctx.fill(); }
  button(id + 'm', f.x + f.w - 22 * S - bw * 2 - 6 * S, y + 2 * S, bw, h - 10 * S, { modal: true, c1: '#5f74b8', c2: '#43579a', label: '−', fn: function () { set(Math.max(0, Math.round(val * nb - 1) / nb)); } });
  button(id + 'p', f.x + f.w - 22 * S - bw, y + 2 * S, bw, h - 10 * S, { modal: true, c1: '#5f74b8', c2: '#43579a', label: '+', fn: function () { set(Math.min(1, Math.round(val * nb + 1) / nb)); } });
  return y + h + 8 * S;
}

// ---------- рендер ----------
UI.render = function (c, w, h) {
  ctx = c; D.setCtx(c);
  buttons = [];
  if (UI.screen === 'loading') Z.drawLoading(); else if (UI.screen === 'menu') drawMainMenu(); else if (UI.screen === 'map') drawMap(); else if (Z.G) drawLevel();
  drawToasts();
  drawModal();
  if (UI.modal) UI.modal.t += Z.frameDt || 0.016;
};

// ---------- ввод ----------
UI.btns = function () { return buttons; };
UI.api = function () { return { button: button, adButton: adButton, pill: pill, frame: frame, bigBtn: bigBtn, badge: badge, closeX: closeX, toggleRow: toggleRow, volRow: volRow, mw: mw, S: S, W: W, H: H, ctx: ctx }; };
UI.cellAt = function (px, py) {
  var L = UI.L, c = Math.floor((px - L.fx) / L.cs), r = Math.floor((py - L.fy) / L.cs);
  // клетки плато нарисованы выше — учитываем подъём
  var r2 = Math.floor((py - L.fy) / L.cs + 0.32), G = Z.G;
  if (G && G.L.hgt && G.L.hgt[r2] && G.L.hgt[r2][c]) r = r2;
  if (c < 0 || r < 0 || c >= L.gw || r >= L.gh) return null;
  return { c: c, r: r };
};
function hit(px, py) {
  var modal = !!UI.modal;
  for (var i = buttons.length - 1; i >= 0; i--) {
    var b = buttons[i]; if (modal && !b.modal) continue;
    if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b;
  }
  return null;
}
UI.ptrs = {};
function pdist() { var k = Object.keys(UI.ptrs); if (k.length < 2) return 0; var a = UI.ptrs[k[0]], b = UI.ptrs[k[1]]; return Math.hypot(a.x - b.x, a.y - b.y); }
function pmid() { var k = Object.keys(UI.ptrs), a = UI.ptrs[k[0]], b = UI.ptrs[k[1]]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
function inVp(px, py) { var v = UI.L.vp; return px >= v.x && py >= v.y && px <= v.x + v.w && py <= v.y + v.h; }
UI.down = function (px, py, id) {
  UI.ptrs[id === undefined ? 0 : id] = { x: px, y: py }; UI.downXY = { x: px, y: py };
  if (UI.screen === 'level' && Object.keys(UI.ptrs).length === 2 && !UI.modal) {
    // начало щипка
    UI.drag = null; UI.tap = null; UI.pressBtn = null; UI.press = null;
    var m = pmid(); UI.pinch = { d0: pdist() || 1, z0: UI.cam.z, mx: m.x, my: m.y };
    return;
  }
  var b = hit(px, py);
  if (b) { if (b.en) UI.press = b.id; else Z.AU.sfx('error', 0.5); UI.pressBtn = b; return; }
  if (UI.modal) return;
  if (UI.screen === 'loading') { UI.loadTap && UI.loadTap(); return; }
  if (UI.screen === 'map') { UI.mapDrag = { y: py, s: UI.mapScroll, last: py, moved: false }; UI.mapVel = 0; return; }
  var G = Z.G; if (!G || G.phase === 'won' || G.phase === 'lost') return;
  if (!inVp(px, py)) return;
  var cell = UI.cellAt(px, py);
  var tw = cell && !UI.aim && !UI.heroSel ? G.towers[Z.cellKey(cell.c, cell.r)] : null;
  if (tw) { UI.drag = { tw: tw, x: px, y: py, sx: px, sy: py, moved: false }; UI.menu = null; return; }
  UI.tap = { sx: px, sy: py, x: px, y: py, px0: UI.cam.px, py0: UI.cam.py, moved: false };
};
UI.move = function (px, py, id) {
  if (UI.ptrs[id === undefined ? 0 : id]) UI.ptrs[id === undefined ? 0 : id] = { x: px, y: py };
  if (UI.pinch) {
    var d = pdist(); if (!d) return;
    var m = pmid();
    UI.zoomAt(UI.pinch.z0 * d / UI.pinch.d0, m.x, m.y);
    UI.cam.px += m.x - UI.pinch.mx; UI.cam.py += m.y - UI.pinch.my; UI.pinch.mx = m.x; UI.pinch.my = m.y; UI.applyCam();
    return;
  }
  if (UI.mapDrag) {
    var md = UI.mapDrag; UI.mapScroll = md.s - (py - md.y); UI.mapVel = -(py - md.last); md.last = py;
    if (Math.abs(py - md.y) > 8) md.moved = true;
    if (md.moved && UI.pressBtn) { UI.pressBtn = null; UI.press = null; }
    return;
  }
  if (UI.drag) { UI.drag.x = px; UI.drag.y = py; if (Math.abs(px - UI.drag.sx) + Math.abs(py - UI.drag.sy) > 10) UI.drag.moved = true; return; }
  if (UI.tap) {
    var t = UI.tap;
    if (Math.abs(px - t.sx) + Math.abs(py - t.sy) > 10) t.moved = true;
    if (t.moved) { UI.cam.px = t.px0 + (px - t.sx); UI.cam.py = t.py0 + (py - t.sy); UI.applyCam(); }
  }
};
UI.up = function (px, py, id) {
  delete UI.ptrs[id === undefined ? 0 : id];
  if (UI.pinch) { if (Object.keys(UI.ptrs).length < 2) { UI.pinch = null; UI.tap = null; } return; }
  if (UI.mapDrag) { var md = UI.mapDrag; UI.mapDrag = null; if (md.moved) { UI.pressBtn = null; UI.press = null; return; } }
  if (UI.pressBtn) {
    var b = UI.pressBtn; UI.pressBtn = null; UI.press = null;
    var b2 = hit(px, py);
    if (b2 && b2.id === b.id && b.en && b.fn) { var uiN = Z.AU._uiN || 0; b.fn(); if ((Z.AU._uiN || 0) === uiN) Z.AU.sfx('ui_tap', 0.5); }
    return;
  }
  var G = Z.G;
  if (UI.drag) {
    var d = UI.drag; UI.drag = null;
    if (!d.moved) { UI.sel = UI.sel === d.tw ? null : d.tw; UI.heroSel = false; Z.AU.sfx('select', 0.6); return; }
    var cell = UI.cellAt(px, py);
    if (!cell) return;
    var tgt = G.towers[Z.cellKey(cell.c, cell.r)];
    if (tgt && tgt !== d.tw) { if (Z.mergeTowers(d.tw, tgt)) { UI.sel = tgt; UI.tutStep('merge'); } else Z.AU.sfx('error'); }
    else if (!tgt) Z.moveTower(d.tw, cell.c, cell.r);
    return;
  }
  if (UI.tap) {
    var t = UI.tap; UI.tap = null;
    if (t.moved) return;
    // двойной тап по пустому месту — общий вид
    if (UI.lastTap && Z.time - UI.lastTap.t < 0.3 && Math.abs(UI.lastTap.x - px) + Math.abs(UI.lastTap.y - py) < 30) {
      if (UI.cam.z > 1.01) { UI.cam = { z: 1, px: 0, py: 0 }; UI.applyCam(); UI.lastTap = null; return; }
      if (Z.G && Z.LEVELS[Z.G.idx] && Z.LEVELS[Z.G.idx].big) { UI.zoomAt(2, px, py); UI.lastTap = null; return; }
    }
    UI.lastTap = { t: Z.time, x: px, y: py };
    tapField(px, py);
  }
};
function tapField(px, py) {
  var G = Z.G, L = UI.L, wx = (px - L.fx) / L.cs, wy = (py - L.fy) / L.cs;
  if (UI.aim === 'bomb') { if (wx >= 0 && wy >= 0 && wx <= L.gw && wy <= L.gh) Z.useSkill('bomb', wx, wy); UI.aim = null; return; }
  if (UI.tapHook && UI.tapHook(wx, wy, px, py)) return;
  var pick = null, pd = Math.max(0.75, 24 / L.cs);
  (G.squad || []).forEach(function (U) { if (U.dead) return; var d = Math.hypot(U.x - wx, U.y - 0.35 - wy); if (d < pd) { pd = d; pick = U; } });
  if (pick && pick === UI.heroSel) { UI.heroSel = null; Z.AU.sfx('select', 0.4); return; }   // 2.11.5: ещё раз на героя — отмена
  if (pick && pick !== UI.heroSel) { UI.heroSel = pick; UI.heroSelT = Z.time; UI.allMode = false; UI.sel = null; UI.menu = null; Z.AU.sfx('sleigh', 0.5); return; }
  if (UI.heroSel) { var hs = UI.heroSel; UI.heroSel = null; if (wx >= 0 && wy >= 0 && wx <= L.gw && wy <= L.gh) Z.heroMove(wx, wy, hs); return; }
  var cell = UI.cellAt(px, py);
  // 2.11.5: палец промахнулся на соседнюю «пустую» клетку (стена, крыши города, обочина) — берём ближайшую клетку,
  // где можно что-то сделать, если до её центра меньше ~0.8 клетки
  var act = function (q) { return q && (Z.canBuildAt(q.c, q.r) || Z.structAt(q.c, q.r) || Z.canBarricade(q.c, q.r) || Z.canTrapCell(q.c, q.r) || G.towers[Z.cellKey(q.c, q.r)]); };
  if (!act(cell)) { var fxq = (px - L.fx) / L.cs, fyq = (py - L.fy) / L.cs, best = null, bd = 0.8;
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) { var q = { c: Math.floor(fxq) + dc, r: Math.floor(fyq) + dr }; if (q.c < 0 || q.r < 0 || q.c >= L.gw || q.r >= L.gh || !act(q)) continue; var dd = Math.hypot(q.c + 0.5 - fxq, (q.r + 0.5 - fyq) * 0.9); if (dd < bd) { bd = dd; best = q; } }
    if (best) { var twq = G.towers[Z.cellKey(best.c, best.r)]; if (twq && !UI.menu) { UI.sel = UI.sel === twq ? null : twq; UI.menu = null; Z.AU.sfx('select', 0.6); return; } cell = best; } }
  if (!cell) { UI.menu = null; UI.sel = null; return; }
  if (Z.canBuildAt(cell.c, cell.r)) { UI.menu = UI.menu && UI.menu.c === cell.c && UI.menu.r === cell.r ? null : { kind: 'build', c: cell.c, r: cell.r }; UI.sel = null; Z.AU.sfx('select', 0.6); return; }
  var stc = Z.structAt(cell.c, cell.r);
  if (stc && !UI.menu) { UI.menu = { kind: 'struct', st: stc, c: cell.c, r: cell.r }; UI.sel = null; Z.AU.sfx('select', 0.5); return; }
  if (Z.inEnemyZone(cell.c, cell.r) && G.L.grid[cell.r][cell.c] !== 1 && !UI.menu) { G.texts.push({ s: T('enemyZone'), x: cell.c + 0.5, y: cell.r + 0.3, c: '#ff9a9a', t: 0, dur: 1.2, sz: 0.7 }); Z.AU.sfx('error', 0.5); return; }
  if ((Z.canBarricade(cell.c, cell.r) || Z.canTrapCell(cell.c, cell.r)) && !UI.menu) { UI.menu = { kind: 'bar', c: cell.c, r: cell.r }; UI.sel = null; Z.AU.sfx('select', 0.5); return; }
  UI.menu = null; UI.sel = null;
}
UI.wheel = function (dy, mx, my) {
  if (UI.screen === 'map' && !UI.modal) { UI.mapScroll += dy; return; }
  if (UI.screen === 'level' && !UI.modal && inVp(mx, my)) UI.zoomAt(UI.cam.z * (dy < 0 ? 1.12 : 1 / 1.12), mx, my);
};
UI.key = function (code) {
  if (UI.modal) { if (code === 'Escape' && (UI.modal.type === 'pause' || UI.modal.type === 'research')) UI.closeModal(); return; }
  if (UI.screen !== 'level' || !Z.G) return;
  if (code === 'Space' || code === 'Enter') Z.callWave();
  else if (code === 'Escape' || code === 'KeyP') UI.openModal({ type: 'pause' });
  else if (code === 'Digit1') Z.useSkill('blizzard');
  else if (code === 'Digit3' && Z.skillUnlocked('santa', Z.G.idx)) Z.useSkill('santa');
  else if (code === 'Digit2' && Z.skillUnlocked('bomb', Z.G.idx)) UI.aim = 'bomb';
};
})();
