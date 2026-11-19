/* 2.6 · интерфейс: портреты отряда, точки сбора, «Все сюда», приёмы, постройка с призраком, окно отряда, замены, настройки, мультфильмы с озвучкой */
(function () {
'use strict';
var Z = window.Z, UI = Z.ui, D = Z.D, OL = D.OL, COL = D.COL, TT = Z.TT, T = Z.T;
function A() { return UI.api(); }
function ctx() { return D.ctx; }
var portRects = [], autoRects = [], hint = null;

// ---------- портреты отряда ----------
// 2.12.22: в портрете — лицо героя крупно (раньше герой целиком, мелко — лица не разобрать). [сдвиг x, ступни, рост] в долях 60
var FACE = { moroz: [0, 1.9, 1], eskimo: [8, 1.5, 1], sneg: [0, 1.75, 1], emelya: [-8, 1.35, 1], belka: [-22, 1.6, 1], kolobok: [0, 1.0, 1.1], plombir: [0, 1.55, 1], vasilisa: [-6, 1.85, 1], kot: [0, 1.65, 1] };
Z.portraitFace = function (t, cx0, cy0, r) { var f = FACE[t] || [0, 1.7, 1], c = D.ctx; c.save(); c.translate(cx0, cy0); c.scale(r / 60, r / 60); D.ally(t, f[0], 60 * f[1], 60 * f[2], { dir: 1 }); c.restore(); };
UI.drawSquadBar = function () {
  var G = Z.G, L = UI.L; portRects = []; autoRects = []; UI.portRects = portRects;
  if (!G || UI.screen !== 'level') return;
  var S = L.s, cx = ctx();
  drawRally(G, cx);
  drawGhost(G, cx, S);
  autoZoom(G);
  if (!G.squad || !G.squad.length || UI.modal || (L.portrait && UI.sel)) { UI._sqRight = 0; drawSubs(cx, S, L); return; }
  var ps = 46 * S, gap = 6 * S, n = G.squad.length, x0, y0, vert = !L.portrait;
  // 2.12.22: герои, «Все сюда» и «Замена» — ячейки одной сетки. Стоя — внизу в один-два ряда, лёжа — слева в одну-три колонки;
  // число рядов/колонок — наименьшее, при котором портреты не мельче ~40 пикс. (лица видны), а сетка занимает как можно меньше поля
  var benchN = Z.ALLY_ORDER.filter(function (t) { return Z.heroOpen(t, G.idx) && !Z.unitOf(G, t) && !G.squad.some(function (U) { return U.type === t; }); }).length;
  var swapOn = (G.phase === 'build' || G.phase === 'between') && benchN > 0 && !G.trial, slots = n + 1 + (swapOn ? 1 : 0), per = slots, lines = 1, lab = 14 * S, pitchX, pitchY;
  if (L.portrait) {
    x0 = L.ox + 8 * S; var maxW = L.sw - 16 * S;
    for (lines = 1; lines <= 2; lines++) { per = Math.ceil(slots / lines); ps = Math.min(46 * S, maxW / per - gap); if (ps >= 40 * S) break; }
    if (lines > 2) lines = 2;
    pitchX = ps + gap; pitchY = ps + gap + lab; y0 = L.bot.y - ps - 20 * S - (lines - 1) * pitchY;
  } else {
    x0 = L.ox + 12 * S; y0 = L.inT + 12 * S; var maxH = L.sh - L.inT - 24 * S;
    for (lines = 1; lines <= 3; lines++) { per = Math.ceil(slots / lines); ps = Math.min(48 * S, maxH / per - gap - 13 * S); if (ps >= 32 * S) break; }
    if (lines > 3) lines = 3;
    pitchX = ps + gap + 10 * S; pitchY = ps + gap + 13 * S;
  }
  var SX = function (k) { return vert ? x0 + Math.floor(k / per) * pitchX : x0 + (k % per) * pitchX; }, SY = function (k) { return vert ? y0 + (k % per) * pitchY : y0 + Math.floor(k / per) * pitchY; };
  var PX = SX, PY = SY;
  // 2.12.23: лёжа полоску отряда можно свернуть — тап по «‹» прячет портреты в узкий язычок у края, тап по язычку возвращает
  if (vert) {
    var fold = !!(Z.save && Z.save.sqFold), anyReady = G.squad.some(function (U) { return !U.dead && U.ult <= 0; });
    if (fold) {
      var tw0 = 30 * S, th0 = 84 * S, tx0 = L.ox, ty0 = y0;
      A().button('sqUnfold', tx0, ty0, tw0, th0, { r: 10 * S, c1: '#ffffff', c2: COL.panelD, fn: function () { Z.save.sqFold = 0; Z.persist(); Z.AU.sfx('select'); },
        draw: function (bx, by, bw, bh) {
          D.text('›', bx + bw / 2 + 1 * S, by + 18 * S, 22 * S, OL);
          D.circ(bx + bw / 2, by + bh - 24 * S, 11 * S, anyReady ? '#ffd54a' : '#4cc77d'); D.text('' + n, bx + bw / 2, by + bh - 23.5 * S, 13 * S, '#fff', 'center', 'middle', 2 * S);
          if (anyReady) { cx.globalAlpha = 0.35 + 0.25 * Math.sin(Z.time * 8); cx.lineWidth = 3 * S; cx.strokeStyle = '#ffd54a'; cx.beginPath(); cx.arc(bx + bw / 2, by + bh - 24 * S, 15 * S, 0, 7); cx.stroke(); cx.globalAlpha = 1; }
        } });
      UI._sqRight = 0; drawSubs(cx, S, L); return;
    }
    // язычок «‹» — справа от сетки, посередине по высоте (сверху его закрывали всплывающие сообщения)
    var tw1 = 22 * S, th1 = 64 * S, gx = x0 + Math.min(lines, Math.ceil(slots / per)) * pitchX - 6 * S, gy = y0 + Math.min(per, slots) * pitchY / 2 - th1 / 2;
    A().button('sqFold', gx, gy, tw1, th1, { r: 9 * S, c1: '#ffffff', c2: COL.panelD, fn: function () { Z.save.sqFold = 1; Z.persist(); Z.AU.sfx('select'); UI.heroSel = null; },
      draw: function (bx, by, bw, bh) { D.text('‹', bx + bw / 2 - 1 * S, by + bh / 2 - 1 * S, 22 * S, OL); } });
  }
  G.squad.forEach(function (U, i) {
    var x = PX(i), y = PY(i), A0 = Z.ALLIES[U.type], sel = UI.heroSel === U, ready = !U.dead && U.ult <= 0;
    portRects.push({ x: x, y: y, w: ps, h: ps, U: U });
    // 2.11.5: портрет — готовой картинкой (герой в кружке перерисовывался каждый кадр)
    var pdraw = function () { var c = D.ctx; c.save();
      D.circ(x + ps / 2, y + ps / 2, ps / 2 + 2, OL);
      D.circ(x + ps / 2, y + ps / 2, ps / 2 - 1, U.dead ? '#6a7290' : sel ? '#fff3c4' : '#e8eefb');
      c.beginPath(); c.arc(x + ps / 2, y + ps / 2, ps / 2 - 2, 0, 7); c.clip();
      if (U.dead) c.globalAlpha = 0.4;
      Z.portraitFace(U.type, x + ps / 2, y + ps / 2, ps / 2);
      c.restore(); c.globalAlpha = 1; };
    if (Z.cachedDraw && (!Z.cachesOff() || (Z.fastDraw && Z.fastDraw()))) Z.cachedDraw('port' + i, [U.type, U.dead ? 1 : 0, sel ? 1 : 0, Math.round(ps), (Z.save.skins && JSON.stringify(Z.save.skins)) || '', (Z.save.cos && JSON.stringify(Z.save.cos)) || '', Z.LANG].join('|'), x - 4, y - 4, ps + 8, ps + 8, pdraw, 0.5);
    else pdraw();
    cx.globalAlpha = 1;
    // здоровье и готовность приёма
    var hp = Math.max(0, U.hp / U.max);
    cx.lineWidth = 3.5 * S; cx.strokeStyle = 'rgba(27,36,72,0.5)'; cx.beginPath(); cx.arc(x + ps / 2, y + ps / 2, ps / 2 + 4 * S, Math.PI * 0.75, Math.PI * 2.25); cx.stroke();
    cx.strokeStyle = hp > 0.5 ? '#6fe07a' : hp > 0.2 ? '#ffd54a' : '#ff6b6b'; cx.beginPath(); cx.arc(x + ps / 2, y + ps / 2, ps / 2 + 4 * S, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * hp)); cx.stroke();
    var cdv = U.dead ? 0 : 1 - Math.max(0, U.ult) / Z.ultCd(U);
    cx.strokeStyle = ready ? 'rgba(255,213,74,' + (0.6 + 0.4 * Math.sin(Z.time * 8)).toFixed(2) + ')' : '#ffd54a'; cx.lineWidth = 3 * S;
    cx.beginPath(); cx.arc(x + ps / 2, y + ps / 2, ps / 2 - 1 * S, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cdv); cx.stroke();
    if (ready) { cx.globalAlpha = 0.25 + 0.2 * Math.sin(Z.time * 8); D.circ(x + ps / 2, y + ps / 2, ps / 2 + 7 * S, A0.col); cx.globalAlpha = 1; }
    if (sel) { cx.lineWidth = 2.5 * S; cx.strokeStyle = '#7dff8a'; cx.beginPath(); cx.arc(x + ps / 2, y + ps / 2, ps / 2 + 8 * S, 0, 7); cx.stroke(); }
    // уровень, «АВТО», клавиша
    D.circ(x + ps * 0.12, y + ps * 0.12, Math.max(7.5, 8.5 * S), OL); D.text('' + U.lvl, x + ps * 0.12, y + ps * 0.13, Math.max(10, 11 * S), '#ffd54a');
    // 2.10.3: «АВТО» всегда видно и нажимается: зелёное — включено, серое — выключено (после приказа идти)
    if (!U.dead) { var afs = Math.max(9.5, 10 * S); cx.font = D.font(afs); var aw0 = cx.measureText(T('auto')).width + 10 * S, ar = { x: x + ps * 0.5 - aw0 / 2, y: y + ps - afs * 0.15, w: aw0, h: afs * 1.4, U: U }; autoRects.push(ar); D.rr(ar.x, ar.y, ar.w, ar.h, 5 * S); cx.fillStyle = U.auto ? '#4cc77d' : 'rgba(90,100,130,0.92)'; cx.fill(); cx.lineWidth = 1.5 * S; cx.strokeStyle = U.auto ? 'rgba(255,255,255,0.9)' : OL; cx.stroke(); D.text(T('auto'), x + ps / 2, ar.y + ar.h / 2, afs, U.auto ? '#fff' : '#e0e6f5'); }
    if (U.dead) D.text(Math.ceil(U.respawn) + '', x + ps / 2, y + ps / 2, 18 * S, '#fff', 'center', 'middle', 3 * S);
    if (!L.portrait && Z.isDesktop !== false) D.text('' + (i + 1), x + ps - 4 * S, y + 6 * S, 9 * S, 'rgba(255,255,255,0.85)', 'center', 'middle', 2 * S);
    if (ready && !Z.save.seen.ultHint) { hint = { x: x + ps / 2, y: y - 12 * S, s: TT('Нажми — приём готов!', 'Tap — ability ready!') }; }
  });
  // «Все сюда» и замена
  var bs = ps * 0.85, bx = SX(n) + (ps - bs) / 2, by = SY(n) + (ps - bs) / 2 - (vert ? 4 * S : 0);
  A().button('allHere', bx, by, bs, bs, { r: bs / 2, c1: UI.allMode ? '#ffe066' : '#ffffff', c2: UI.allMode ? COL.goldD : COL.panelD, fn: function () { UI.allMode = !UI.allMode; UI.allModeT = Z.time; UI.heroSel = null; UI.aimUlt = null; if (UI.allMode) flash(T('allHereT')); },
    draw: function (x, y, w, h) { flag(x + w / 2, y + h * 0.75, h * 0.5, '#e8484f'); D.text(T('allHere'), x + w / 2, y + h + 8 * S, D.fitText(T('allHere'), w + 8 * S, 11.5 * S), '#fff', 'center', 'middle', 2.5 * S); } });
  var bench = Z.ALLY_ORDER.filter(function (t) { return Z.heroOpen(t, G.idx) && !Z.unitOf(G, t) && !G.squad.some(function (U) { return U.type === t; }); });
  if (swapOn && bench.length) {
    A().button('swapB', SX(n + 1) + (ps - bs) / 2, SY(n + 1) + (ps - bs) / 2 - (vert ? 4 * S : 0), bs, bs, { r: bs / 2, c1: '#dfe7f7', c2: '#aab6d6', fn: function () { UI.openModal({ type: 'swap' }); },
      draw: function (x, y, w, h) { D.text('⇄', x + w / 2, y + h / 2, h * 0.5, OL); D.text(T('swap'), x + w / 2, y + h + 8 * S, D.fitText(T('swap'), w + 8 * S, 11.5 * S), '#fff', 'center', 'middle', 2.5 * S); } });
  }
  UI._sqRight = vert ? 0 : x0 + Math.min(slots, per) * pitchX + 10 * S;
  if (UI.aimUlt) flashText(cx, T('tapUlt'), L);
  // подсказки первого знакомства
  if (G.idx === 3 && !Z.save.seen.hintPort && G.phase === 'build') hint = { x: x0 + ps / 2, y: y0 - 12 * S, s: TT('Нажми портрет, потом место на поле', 'Tap a portrait, then a spot on the field') };
  if (G.idx === 7 && !Z.save.seen.hintAuto && G.squad.length > 1) hint = { x: bx + bs / 2, y: by - 12 * S, s: TT('«Все сюда» — весь отряд. «АВТО» под портретом — герой воюет сам', '"All here" moves the squad. AUTO under a portrait — the hero fights on his own') };
  if (hint) { drawHint(cx, hint, S); hint = null; }
  drawSubs(cx, S, L);
};
function flag(x, y, h, col) { var cx = ctx(); cx.strokeStyle = OL; cx.lineWidth = Math.max(1.5, h * 0.08); cx.beginPath(); cx.moveTo(x - h * 0.2, y); cx.lineTo(x - h * 0.2, y - h); cx.stroke(); D.poly([x - h * 0.2, y - h, x + h * 0.4, y - h * 0.8, x - h * 0.2, y - h * 0.6], col, Math.max(1, h * 0.06)); }
function drawRally(G, cx) {
  var cs = UI.L.cs, X = UI.X, Y = UI.Y;
  (G.squad || []).forEach(function (U) {
    if (U.dead) return;
    var sel = UI.heroSel === U, far = Math.hypot(U.home.x - U.x, U.home.y - U.y) > 0.6;
    if (sel) { cx.setLineDash([6, 6]); cx.strokeStyle = 'rgba(125,255,138,0.8)'; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(X(U.home.x), Y(U.home.y), cs * 2.5, cs * 2.5 * 0.92, 0, 0, 7); cx.stroke(); cx.setLineDash([]); }
    if (sel || far) { cx.globalAlpha = sel ? 1 : 0.7; flag(X(U.home.x), Y(U.home.y), cs * 0.6, Z.ALLIES[U.type].col); cx.globalAlpha = 1; }
  });
  if (UI.pDrag && UI.pDrag.moved) { var U = UI.pDrag.U; cx.setLineDash([8, 6]); cx.strokeStyle = Z.ALLIES[U.type].col; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(X(U.x), Y(U.y)); cx.lineTo(UI.pDrag.x, UI.pDrag.y); cx.stroke(); cx.setLineDash([]); flag(UI.pDrag.x, UI.pDrag.y, cs * 0.7, Z.ALLIES[U.type].col); }
  if (UI.aimUlt && UI.ptrHover) { cx.globalAlpha = 0.25; D.circ(UI.ptrHover.x, UI.ptrHover.y, cs * 2.5, Z.ALLIES[UI.aimUlt.type].col); cx.globalAlpha = 1; }
}
function drawHint(cx, h, S) {
  var w = Math.min(UI.L.sw - 20 * S, D.fitText(h.s, 9999, 13 * S) ? 0 : 0); cx.font = D.font(13 * S); w = Math.min(UI.L.sw - 20 * S, cx.measureText(h.s).width + 24 * S);
  var x = Math.max(UI.L.ox + 10 * S, Math.min(UI.L.ox + UI.L.sw - w - 10 * S, h.x - w / 2)), y = h.y - 30 * S + Math.sin(Z.time * 4) * 3 * S;
  D.rr(x, y, w, 26 * S, 10 * S); cx.fillStyle = 'rgba(255,253,245,0.96)'; cx.fill(); cx.lineWidth = 2 * S; cx.strokeStyle = OL; cx.stroke();
  D.text(h.s, x + w / 2, y + 13 * S, D.fitText(h.s, w - 12 * S, 13 * S), OL);
}
var flashT = 0, flashS = '';
function flash(s) { flashS = s; flashT = 2.2; }
UI.flash = flash;
function flashText(cx, s, L) { D.text(s, L.ox + L.sw / 2, L.inT + 28 * L.s, D.fitText(s, L.sw - 24 * L.s, 15 * L.s), '#ffe066', 'center', 'middle', 3 * L.s); }
function drawSubs(cx, S, L) {
  if (flashT > 0) { flashT -= 1 / 60; flashText(cx, flashS, L); }
  var sub = Z.sub; if (!sub || sub.t <= 0 || !sub.text || Z.save.subs === false || (UI.modal && UI.modal.type === 'comic')) return;   // в сцене уровня текст уже в облачке
  // 2.11.4: ширина окна считается до переноса строк — раньше в горизонтальном режиме окно сужалось уже после переноса и текст вылезал за край
  var w = Math.min(L.sw - 24 * S, 560 * S); if (!L.portrait) w = Math.min(w, L.sa.w - 20 * S);
  var fs = 14 * S, lines = D.wrap(sub.text, w - 28 * S, fs); if (lines.length > 3) { fs = 12.5 * S; lines = D.wrap(sub.text, w - 28 * S, fs); }
  var h = 26 * S + lines.length * fs * 1.28;
  var x = L.ox + (L.sw - w) / 2, y = L.portrait ? L.inT + 6 * S : L.sh - h - 74 * S, G0 = Z.G;
  if (L.portrait && G0 && G0.phase === 'build' && G0.wave === 0 && !G0.adStartUsed) y += 42 * S;   // 2.10.3: не закрывать кнопку «+100 монет на старт»
  if (!L.portrait) { x = L.sa.x + (L.sa.w - w) / 2; y = L.sh - h - 10 * S; }
  cx.globalAlpha = Math.min(1, sub.t * 3);
  D.rr(x, y, w, h, 12 * S); cx.fillStyle = 'rgba(20,28,60,0.82)'; cx.fill();
  D.text(sub.who, x + 14 * S, y + 13 * S, D.fitText(sub.who, w - 28 * S, 12 * S), sub.col, 'left');
  lines.forEach(function (ln, i) { D.text(ln, x + 14 * S, y + 32 * S + i * fs * 1.28, D.fitText(ln, w - 28 * S, fs), '#ffffff', 'left'); });
  cx.globalAlpha = 1;
}

// ---------- постройка с «призраком» и приближение камеры ----------
UI.ghostPick = function (t, m) {
  if (Z.save.quickBuild !== false) return false;
  if (Z.G.coins < Z.towerCost(t, 1)) { Z.AU.sfx('error'); return true; }
  UI.ghost = { t: t, c: m.c, r: m.r }; Z.AU.sfx('select', 0.6);
  return true;
};
function drawGhost(G, cx, S) {
  var g = UI.ghost, m = UI.menu;
  if (!g) return;
  if (!m || m.kind !== 'build' || m.c !== g.c || m.r !== g.r || UI.modal) { UI.ghost = null; return; }
  var cs = UI.L.cs, X = UI.X, Y = UI.Y, x = X(g.c + 0.5), y = Y(g.r + 0.5);
  var st = Z.towerStat(g.t, 1, Z.save.research), hill = G.L.grid[g.r][g.c] === 3, rg = st.range * (hill ? 1.25 : 1) * (Z.hk.rangeMul ? Z.hk.rangeMul({ c: g.c, r: g.r }) : 1);
  cx.beginPath(); cx.arc(x, y, rg * cs, 0, 7); cx.fillStyle = 'rgba(125,255,138,0.12)'; cx.fill(); cx.strokeStyle = 'rgba(125,255,138,0.9)'; cx.lineWidth = 2.5; cx.setLineDash([8, 6]); cx.stroke(); cx.setLineDash([]);
  cx.globalAlpha = 0.65; D.tower({ type: g.t, lvl: 1, ang: -0.6, recoil: 0, spin: Z.time * 3, pop: 0, stun: 0, firing: false }, x, Y(g.r + 0.92), cs, Z.time); cx.globalAlpha = 1;
  var bs = Math.max(40 * S, cs * 0.8), by = y + cs * 0.75; if (by + bs > UI.L.sh - (UI.L.inB || 0) - 10 * S) by = y - cs * 1.6 - bs;
  // у края экрана пара «да/нет» сдвигается внутрь, но остаётся рядом с клеткой
  var vp = UI.L.vp, gx = Math.max(vp.x + 6 * S, Math.min(vp.x + vp.w - bs * 2 - 16 * S, x - bs - 5 * S)); x = gx + bs + 5 * S; by = Math.max(vp.y + (UI.L.inT || 0) + 4 * S, by);
  A().button('gOk', x - bs - 5 * S, by, bs, bs, { r: bs / 2, c1: '#6fe07a', c2: COL.greenD, fn: function () { if (Z.buildTower(g.t, g.c, g.r)) { UI.menu = null; UI.ghost = null; UI.tutStep && UI.tutStep('built'); } else Z.AU.sfx('error'); }, draw: function (bx, byy, w, h) { D.text('✓', bx + w / 2, byy + h / 2, h * 0.55, '#fff', 'center', 'middle', 3 * S); } });
  A().button('gNo', x + 5 * S, by, bs, bs, { r: bs / 2, c1: '#ff8a8a', c2: '#c94a4a', fn: function () { UI.ghost = null; }, draw: function (bx, byy, w, h) { D.text('✕', bx + w / 2, byy + h / 2, h * 0.5, '#fff', 'center', 'middle', 3 * S); } });
}
function autoZoom(G) {
  var m = UI.menu, L = UI.L;
  if (m && (m.kind === 'build' || m.kind === 'bar') && !UI.azPrev && L.cs < 30 * L.s && !UI.pinch && Z.save.autoZoom !== false) {
    UI.azPrev = { z: UI.cam.z, px: UI.cam.px, py: UI.cam.py };
    var sx = UI.X(m.c + 0.5), sy = UI.Y(m.r + 0.5), z = UI.cam.z * Math.min(2.2, 48 * L.s / L.cs);
    UI.zoomAt(z, sx, sy);
    // клетка — ближе к центру
    var nx = UI.X(m.c + 0.5), ny = UI.Y(m.r + 0.5); UI.cam.px += (L.ox + L.sw / 2 - nx) * 0.6; UI.cam.py += (L.sh / 2 - ny) * 0.6; UI.applyCam();
  } else if (!m && UI.azPrev) { UI.cam.z = UI.azPrev.z; UI.cam.px = UI.azPrev.px; UI.cam.py = UI.azPrev.py; UI.azPrev = null; UI.applyCam(); }
}
UI.trapBtn = function (m, cx0, cy0, cs) {
  if (!Z.canTrapCell(m.c, m.r) || UI.ghost) return;
  var S = UI.L.s, bs = Math.max(34 * S, Math.min(cs * 0.85, 46 * S));
  A().button('toTrap', cx0 - bs / 2, cy0 - bs / 2, bs, bs, { r: bs / 2, c1: '#fdf7ec', c2: COL.panelD, fn: function () { UI.menu = { kind: 'bar', c: m.c, r: m.r }; }, draw: function (bx, by, bw, bh) { D.trap({ type: 'spike', t: 0 }, bx + bw / 2, by + bh * 0.62, bw * 0.62, Z.time); } });
};

// ---------- нажатия: приоритет героев, портреты, перетаскивание на поле ----------
var oldDown = UI.down, oldMove = UI.move, oldUp = UI.up;
function inRect(r, x, y) { return x >= r.x - 6 && y >= r.y - 6 && x <= r.x + r.w + 6 && y <= r.y + r.h + 6; }
function unitAtScreen(px, py) {
  var G = Z.G; if (!G || !G.squad) return null;
  var L = UI.L, best = null, bd = Math.max(L.cs * 0.75, 26 * L.s);
  G.squad.forEach(function (U) { if (U.dead) return; var d = Math.hypot(UI.X(U.x) - px, UI.Y(U.y - 0.35) - py); if (d < bd) { bd = d; best = U; } });
  return best;
}
UI.down = function (px, py, id) {
  if (UI.screen === 'level' && !UI.modal && Z.G && Object.keys(UI.ptrs).length === 0) {
    for (var ai = 0; ai < autoRects.length; ai++) { var ar = autoRects[ai]; if (px >= ar.x - 4 && px <= ar.x + ar.w + 4 && py >= ar.y - 3 && py <= ar.y + ar.h + 5) { var AU0 = ar.U; AU0.auto = !AU0.auto; if (AU0.auto) AU0.order = 0; Z.AU.sfx('select', 0.7); flash((AU0.auto ? '✓ ' : '✕ ') + T('auto') + ' · ' + T('al_' + AU0.type)); Z.save.seen.hintAuto = 1; return; } }
    for (var i = 0; i < portRects.length; i++) if (inRect(portRects[i], px, py)) { UI.ptrs[id === undefined ? 0 : id] = { x: px, y: py }; UI.pDrag = { U: portRects[i].U, sx: px, sy: py, x: px, y: py, t0: Z.time, moved: false }; return; }
    var btn = UI.btns().some(function (b) { return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h; });
    if (!btn && unitAtScreen(px, py) && !UI.aim) {
      UI.ptrs[id === undefined ? 0 : id] = { x: px, y: py }; UI.downXY = { x: px, y: py };
      UI.tap = { sx: px, sy: py, x: px, y: py, px0: UI.cam.px, py0: UI.cam.py, moved: false }; return;
    }
  }
  oldDown.apply(this, arguments);
};
UI.move = function (px, py, id) {
  UI.ptrHover = { x: px, y: py };
  if (UI.pDrag) { var d = UI.pDrag; d.x = px; d.y = py; if (Math.hypot(px - d.sx, py - d.sy) > 14) d.moved = true; return; }
  oldMove.apply(this, arguments);
};
UI.up = function (px, py, id) {
  if (UI.pDrag) {
    var d = UI.pDrag, U = d.U; UI.pDrag = null; delete UI.ptrs[id === undefined ? 0 : id];
    var G = Z.G; if (!G) return;
    if (d.moved) {
      var wx = (px - UI.L.fx) / UI.L.cs, wy = (py - UI.L.fy) / UI.L.cs;
      if (wx >= 0 && wy >= 0 && wx <= UI.L.gw && wy <= UI.L.gh && !U.dead) { Z.heroMove(wx, wy, U); Z.save.seen.hintPort = 1; }
      return;
    }
    if (Z.time - d.t0 > 0.5) { U.auto = !U.auto; Z.AU.sfx('select', 0.7); flash((U.auto ? '✓ ' : '✕ ') + T('auto') + ' · ' + T('al_' + U.type)); Z.save.seen.hintAuto = 1; return; }
    portraitTap(G, U);
    return;
  }
  oldUp.apply(this, arguments);
};
function portraitTap(G, U) {
  if (U.dead) { Z.AU.sfx('error', 0.5); return; }
  Z.save.seen.hintPort = 1;
  if (UI.heroSel === U && U.ult <= 0) {
    Z.save.seen.ultHint = 1;
    if (Z.save.ultManual) { UI.aimUlt = U; UI.heroSel = null; Z.AU.sfx('select'); }
    else { Z.castUlt(U, U.x, U.y, false); UI.heroSel = null; }
    return;
  }
  if (U.ult <= 0 && Z.save.ultManual) { UI.aimUlt = U; Z.save.seen.ultHint = 1; Z.AU.sfx('select'); return; }
  if (UI.heroSel === U) { UI.heroSel = null; Z.AU.sfx('select', 0.4); return; }
  UI.heroSel = U; UI.heroSelT = Z.time; UI.sel = null; UI.menu = null; UI.allMode = false; Z.AU.sfx('sleigh', 0.4);
  // показать героя камерой, если он за краем экрана
  var sx = UI.X(U.x), sy = UI.Y(U.y), L = UI.L;
  if (sx < L.ox + 30 || sx > L.ox + L.sw - 30 || sy < L.inT + 20 || sy > L.sh - 40) { UI.cam.px += L.ox + L.sw / 2 - sx; UI.cam.py += L.sh / 2 - sy; UI.applyCam(); }
}
UI.tapHook = function (wx, wy) {
  var G = Z.G, L = UI.L, inside = wx >= 0 && wy >= 0 && wx <= L.gw && wy <= L.gh;
  if (UI.aimUlt) { var U = UI.aimUlt; UI.aimUlt = null; if (inside) Z.castUlt(U, wx, wy, true); return true; }
  if (UI.allMode) { UI.allMode = false; if (inside) Z.allHere(wx, wy); Z.save.seen.hintAuto = 1; return true; }
  if (!UI.heroSel && inside && Z.mechTap && Z.mechTap(Math.floor(wx), Math.floor(wy))) return true;
  return false;
};
// клавиши: 1–8 герои, Q — «Все сюда», E — «Авто», Z/X/C — умения
var oldKey = UI.key;
UI.key = function (code) {
  var G = Z.G;
  if (UI.modal || UI.screen !== 'level' || !G) return oldKey.call(this, code);
  var m = /^Digit([1-8])$/.exec(code);
  if (m) { var U = (G.squad || [])[+m[1] - 1]; if (U) portraitTap(G, U); return; }
  if (code === 'KeyQ') { UI.allMode = !UI.allMode; return; }
  if (code === 'KeyE') { var S0 = UI.heroSel; if (S0) { S0.auto = !S0.auto; flash((S0.auto ? '✓ ' : '✕ ') + T('auto')); } return; }
  if (code === 'KeyZ') return Z.useSkill('blizzard');
  if (code === 'KeyX') { if (Z.skillUnlocked('bomb', G.idx)) UI.aim = 'bomb'; return; }
  if (code === 'KeyC') { if (Z.skillUnlocked('santa', G.idx)) Z.useSkill('santa'); return; }
  return oldKey.call(this, code);
};

// ---------- окно уровня: карта, механика, отряд по очкам командования ----------
function oneRow() { return UI.L.sh < 720 || UI.L.sh < UI.L.sw; }
UI.squadPickerH = function (m) { var S = UI.L.s; return (oneRow() ? 30 : 46) * S + (m.idx >= 3 ? 38 * S + (oneRow() ? 56 * S : 2 * 70 * S) : 0); };
UI.squadPicker = function (m, f, w, yy, sqH) {
  var S = UI.L.s, cx = ctx(), mp = Z.mapOf(m.idx), one = oneRow();
  if (mp) {
    var mt = Z.MECH[mp.mech] ? TT(Z.MECH[mp.mech][0], Z.MECH[mp.mech][1]) : '';
    // 2.7.21: описание механики — не мельче 10,5 пикс., при нехватке места в две строки
    if (one) { var ln = '«' + mp.name + '» — ' + mt; D.textLines(D.fitLines(ln, w - 40 * S, 13 * S, 10.5, 2), f.x + w / 2, yy + 9 * S, '#2a6fb0'); }
    else { D.text('«' + mp.name + '»', f.x + w / 2, yy + 4 * S, D.fitText('«' + mp.name + '»', w - 40 * S, 15 * S), '#2a6fb0'); D.textLines(D.fitLines(mt, w - 40 * S, 12.5 * S, 10.5, 2), f.x + w / 2, yy + 27 * S, '#4a5378'); }
  }
  yy += (one ? 30 : 46) * S;
  if (m.idx < 3) return yy;
  var lim = Z.okLimit(m.idx), cur = Z.squadFor(m.idx), used = Z.okUsed(cur);
  var nOpen = Z.ALLY_ORDER.filter(function (t) { return Z.heroOpen(t, m.idx); }).length;
  var hdr = Z.OKP_OFF ? T('squadT') + ' · ' + TT('в отряде ', 'in squad ') + cur.length + ' · ' + TT('открыто ', 'unlocked ') + nOpen + '/' + Z.ALLY_ORDER.length : T('squadT') + ' · ' + T('okp') + ' ' + used + '/' + lim + ' · ' + TT('открыто ', 'unlocked ') + nOpen + '/' + Z.ALLY_ORDER.length;
  D.text(hdr, f.x + 22 * S, yy + 6 * S, Math.max(10.5, D.fitText(hdr, w - 128 * S, 13 * S)), '#4a5378', 'left');
  A().button('heroesB', f.x + w - 22 * S - 96 * S, yy - 7 * S, 96 * S, 26 * S, { modal: true, r: 9 * S, c1: '#9a7ce8', c2: '#6b3fa0', label: TT('Герои ›', 'Heroes ›'), px: 13.5 * S, fn: function () { UI.goModal({ type: 'heroes', back: m }); } });
  var hn = Z.OKP_OFF ? TT('Бери хоть всех — враги станут чуть крепче', 'Take them all — enemies get a bit tougher') : TT('Открытые герои доступны на любом уровне', 'Unlocked heroes can join any level');
  D.text(hn, f.x + 22 * S, yy + 22 * S, Math.max(10.5, D.fitText(hn, w - 44 * S, 12 * S)), '#6a7394', 'left');
  yy += 34 * S;
  var nAll = Z.ALLY_ORDER.length, per = one ? nAll : Math.ceil(nAll / 2), gp = one ? (nAll > 8 ? 3 : 4) * S : (nAll > 8 ? 4 : 6) * S, aw = (w - 44 * S - (per - 1) * gp) / per, ah = one ? 54 * S : 64 * S;
  Z.ALLY_ORDER.forEach(function (at, k) {
    var sled = Z.inSleigh(m.idx) === at, un = Z.heroOpen(at, m.idx) && !sled, on = cur.indexOf(at) >= 0, row = Math.floor(k / per), col = k % per;
    var ax = f.x + 22 * S + col * (aw + gp), ay = yy + row * (ah + 6 * S);
    var canTry = !un && !sled && m.idx >= 3 && !!Z.heroTryOffer;   // закрытого героя можно взять на один бой за рекламу
    A().button('sq_' + at, ax, ay, aw, ah, { modal: true, r: 10 * S, enabled: un || canTry, c1: on ? '#fff3c4' : canTry ? '#e9dcff' : '#dfe7f7', c2: on ? COL.goldD : canTry ? '#9a7ce8' : '#aab6d6',
      fn: function () {
        if (!un) { Z.heroTryOffer(at, m); return; }
        var sel = Z.squadFor(m.idx).slice(), i = sel.indexOf(at);
        Z.save.sqT = Z.save.sqT || {}; Z.save.sqT[m.idx] = 1;
        Z.save.sqOff = Z.save.sqOff || {};
        if (i >= 0) { if (sel.length > 1) { sel.splice(i, 1); Z.save.sqOff[at] = 1; } }   // 2.12.36: убранного сам игроком больше не добавляем
        else {
          if (Z.OK_COST[at] > lim) { Z.AU.sfx('error'); flash(TT('Не хватает очков командования', 'Not enough command points')); return; }
          // не помещается — заменяем: убираем последних взятых, пока не влезет
          var out = []; while (sel.length && Z.okUsed(sel) + Z.OK_COST[at] > lim) out.push(sel.pop());
          sel.push(at); delete Z.save.sqOff[at];
          if (out.length) flash(TT('Замена: ', 'Swapped out: ') + out.map(function (t) { return T('al_' + t); }).join(', '));
        }
        Z.save.squad = sel; Z.persist(); Z.AU.sfx('select');
      },
      draw: function (bx, by, bw, bh) {
        cx.save(); cx.beginPath(); cx.rect(bx + 2, by + 2, bw - 4, bh - 4); cx.clip(); if (!un) cx.globalAlpha = 0.35; D.ally(at, bx + bw / 2, by + bh - 4 * S, Math.min(bh * 0.3, bw * 0.42), { dir: 1 }); cx.restore(); cx.globalAlpha = 1;
        if (sled) D.textLines(D.fitLines(TT('в санях', 'in sleigh'), bw - 6 * S, 12 * S, 10.5, 2), bx + bw / 2, by + bh / 2, OL);
        if (!Z.OKP_OFF) for (var p = 0; p < Z.OK_COST[at]; p++) D.circ(bx + 7 * S + p * 7 * S, by + 8 * S, 3 * S, un ? '#6b3fa0' : '#9aa3b8');
        if (un) D.text('' + Z.allyLvl(at), bx + bw - 6 * S, by + 9 * S, Math.max(11, 12 * S), OL, 'right');
        if (on) D.text('✓', bx + bw - 9 * S, by + bh - 10 * S, 13 * S, COL.greenD, 'center', 'middle', 0);
        if (!un && !sled) { var lk = TT('ур.', 'lv.') + (Z.ALLIES[at].unlock + 1); D.text('🔒', bx + bw / 2, by + bh * 0.26, Math.max(10, 11 * S), OL, 'center', 'middle', 0); var lfs = D.fitText(lk, bw - 6 * S, 12 * S); if (lfs < 9.5) { lk = '' + (Z.ALLIES[at].unlock + 1); lfs = Math.min(12 * S, D.fitText(lk, bw - 4 * S, 12 * S)); } D.text(lk, bx + bw / 2, by + bh * 0.5, lfs, OL, 'center', 'middle', 0); if (canTry) { var tl = TT('на бой ▶', 'try ▶'), tfs = D.fitText(tl, bw - 4 * S, 11.5 * S); if (tfs < 9.5) { tl = '▶'; tfs = 12 * S; } D.text(tl, bx + bw / 2, by + bh - 10 * S, tfs, '#6b3fa0', 'center', 'middle', 0); } }
      } });
  });
  return yy + (one ? ah + 4 * S : 2 * (ah + 6 * S));
};

// ---------- свои окна ----------
UI.customModal = function (m, w) {
  var api = A(), S = UI.L.s, cx = ctx(), f, y, H = UI.L.sh;
  if (m.type === 'opt26') {
    var s = Z.voiceSettings(), on = function (v) { return v ? T('on') : T('off'); };
    var BN = { often: TT('Часто', 'Often'), normal: TT('Обычно', 'Normal'), rare: TT('Редко', 'Rarely'), off: T('off') };
    var SP = Z.save.spatial === false ? T('off') : Z.save.hrtf ? TT('Наушники 3D', 'Headphones 3D') : T('on');
    var rows = [
      [TT('Громкость по видам', 'Volume by type'), TT('Музыка, бой, голоса…', 'Music, battle, voices…'), function () { UI.goModal({ type: 'mix', back: m }); }],
      [TT('Озвучка (рус.)', 'Russian voices'), on(s.voiceOn), function () { s.voiceOn = !s.voiceOn; }],
      [TT('Субтитры', 'Subtitles'), on(s.subs !== false), function () { s.subs = s.subs === false; }],
      [TT('Графика', 'Graphics'), Z.gfxName ? Z.gfxName() : on(!Z.save.shadowsOff), function () { if (Z.gfxNext) Z.gfxNext(); else Z.save.shadowsOff = !Z.save.shadowsOff; UI.fieldCache = null; if (Z.G) Z.G.fieldDirty = true; }],
      [TT('Разрешение отрисовки', 'Render resolution'), Z.rscaleName ? Z.rscaleName() : '', function () { if (Z.rscaleNext) Z.rscaleNext(); }],
      [TT('Кадров в секунду', 'Frame rate'), Z.fpsName ? Z.fpsName() : '60', function () { if (Z.fpsNext) Z.fpsNext(); }],
      [TT('Резкость', 'Sharpness'), Z.sharpName ? Z.sharpName() : '', function () { if (Z.sharpNext) Z.sharpNext(); }],
      [TT('Вечерний свет', 'Evening light'), on(!!Z.save.eveLight), function () { Z.save.eveLight = !Z.save.eveLight; }],
      [TT('Перепалки', 'Banter'), BN[s.banter], function () { var o = ['often', 'normal', 'rare', 'off']; s.banter = o[(o.indexOf(s.banter) + 1) % 4]; }],
      // 2.11.4: переключатель «Шутка с бубенцом» убран — шутка всегда включена
      [TT('Объёмный звук', 'Positional sound'), SP, function () { if (Z.save.spatial === false) { Z.save.spatial = true; Z.save.hrtf = false; } else if (!Z.save.hrtf) Z.save.hrtf = true; else { Z.save.spatial = false; Z.save.hrtf = false; } }],
      [T('ultMode'), Z.save.ultManual ? T('ultManual') : T('ultAuto'), function () { Z.save.ultManual = !Z.save.ultManual; }],
      [TT('Подтверждать постройку', 'Confirm building'), on(Z.save.quickBuild === false), function () { Z.save.quickBuild = Z.save.quickBuild === false; }],
      [TT('Приближать при постройке', 'Zoom when building'), on(Z.save.autoZoom !== false), function () { Z.save.autoZoom = Z.save.autoZoom === false; }]
    ];
    // только вне Яндекса (тестовая копия по ссылке): открыть все уровни; свои звёзды не трогаем, выключение убирает лишь «технические»
    if (!(Z.SDK && Z.SDK.ysdk) && Z.platHas && Z.platHas('test')) rows.push([TT('Все уровни (тест)', 'All levels (test)'), Z.save.testAdded ? TT('Открыты', 'Unlocked') : T('off'), function () {
      var st = Z.save.stars;
      if (Z.save.testAdded) { Z.save.testAdded.forEach(function (i) { if (st[i] === 1) delete st[i]; }); Z.save.testAdded = null; }
      else { var add = []; for (var i = 0; i < Z.LEVELS.length - 1; i++) if (!st[i]) { st[i] = 1; add.push(i); } Z.save.testAdded = add; }
      UI.mapCache = null; UI.scrollToCurrent = true;
    }]);
    var cols = UI.L.portrait ? 1 : 2, rh = 50 * S, nr = Math.ceil(rows.length / cols), fw = cols === 2 ? Math.min(UI.L.sw * 0.94, 640 * S) : w;
    f = api.frame(fw, 56 * S + nr * rh + 66 * S, T('opt26'));
    var cw = (fw - 44 * S - (cols - 1) * 8 * S) / cols;
    rows.forEach(function (r, i) {
      var col = cols === 2 ? i % 2 : 0, row = cols === 2 ? Math.floor(i / 2) : i;
      api.button('o_' + i, f.x + 22 * S + col * (cw + 8 * S), f.y + 44 * S + row * rh, cw, rh - 6 * S, { modal: true, r: 12 * S, c1: '#ffffff', c2: COL.panelD, fn: function () { r[2](); Z.persist(); },
        draw: function (bx, by, bw, bh) { D.text(r[0], bx + 12 * S, by + bh * 0.32, Math.max(11, D.fitText(r[0], bw - 24 * S, 13 * S)), '#4a5378', 'left'); D.text(r[1], bx + 12 * S, by + bh * 0.72, Math.max(11.5, D.fitText(r[1], bw - 24 * S, 15 * S)), OL, 'left'); } });
    });
    api.bigBtn('o_back', f, f.y + 44 * S + nr * rh + 4 * S, T('resume'), function () { UI.closeModal(); }, '#ff8a3d', '#d4602a');
    return true;
  }
  if (m.type === 'heroes') {
    // 2.7.21: на низком экране (телефон лёжа) — две колонки, чтобы строки были высокими и текст читался
    var list = Z.ALLY_ORDER, rh1 = Math.min(84 * S, (H * 0.92 - 80 * S) / list.length), hc = rh1 < 70 * S && UI.L.sw > 600 ? 2 : 1;
    var nrw = Math.ceil(list.length / hc), rh = Math.min(84 * S, (H * 0.92 - 80 * S) / nrw), cwH = w, fwH = hc === 2 ? Math.min(UI.L.sw - 16 * S, w * 2 + 10 * S) : w;
    if (hc === 2) cwH = (fwH - 10 * S) / 2;
    f = api.frame(fwH, 70 * S + nrw * rh, TT('Герои', 'Heroes'));
    var fx0 = f.x, f0y = f.y;
    api.closeX(f);
    var back = m.back;
    list.forEach(function (t, k) {
      var hcol = hc === 2 ? (k < nrw ? 0 : 1) : 0, hrow = hc === 2 ? k % nrw : k, w = cwH, f = { x: fx0 + hcol * (cwH + 10 * S) - (hc === 2 ? 0 : 0), y: f0y };
      var ry = f.y + 44 * S + hrow * rh, un = Z.allyUnlocked(t), lv = Z.allyLvl(t), sm = rh < 70 * S;
      if (un) api.button('hrow_' + t, f.x + 10 * S, ry, w - 100 * S, rh - 4 * S, { modal: true, hidden: true, fn: function () { UI.goModal({ type: 'hero', ht: t, back: m }); } });
      D.rr(f.x + 10 * S, ry, w - 20 * S, rh - 4 * S, 10 * S); cx.fillStyle = un ? COL.panelD : '#c9cfdc'; cx.fill();
      // 2.7.21: иконка уже, текст крупнее (не мельче ~10,5 пикс.): цена ОК — рядом с полоской опыта, улучшения в две строки
      var icw = rh * 0.78;
      cx.save(); cx.beginPath(); cx.rect(f.x + 12 * S, ry + 2 * S, icw - 6 * S, rh - 8 * S); cx.clip(); if (!un) cx.globalAlpha = 0.35; D.ally(t, f.x + 12 * S + (icw - 6 * S) / 2, ry + rh - 8 * S, rh * 0.33, { dir: 1 }); cx.restore(); cx.globalAlpha = 1;
      var tx = f.x + icw + 10 * S, tw = f.x + w - 14 * S - tx, trW = 80 * S;
      var hnm = T('al_' + t).split(' — ')[0] + (un ? ' · ' + T('heroLvl') + ' ' + lv : '');   // роль героя — в его карточке, здесь только имя
      D.text(hnm, tx, ry + 13 * S, Math.max(10.5, D.fitText(hnm, tw - trW - 6 * S, 14 * S)), OL, 'left');
      var okTxt = Z.OKP_OFF ? '' : T('okp') + ' ' + Z.OK_COST[t];
      if (!un) { var lt = T('lvl') + ' ' + (Z.ALLIES[t].unlock + 1) + (okTxt ? ' · ' + okTxt : ''); D.text(lt, tx, ry + 34 * S, Math.max(10.5, D.fitText(lt, tw, 13 * S)), '#4a5378', 'left'); return; }
      var xpw = tw * 0.5; D.rr(tx, ry + 23 * S, xpw, 6 * S, 3 * S); cx.fillStyle = '#c9cfdc'; cx.fill(); D.rr(tx, ry + 23 * S, xpw * (lv >= 10 ? 1 : Z.allyXpNext(t)), 6 * S, 3 * S); cx.fillStyle = '#6b3fa0'; cx.fill();
      D.text(okTxt, tx + xpw + 8 * S, ry + 26 * S, Math.max(10.5, 12 * S), '#4a5378', 'left');
      var p3 = TT(Z.PERK3[t][0], Z.PERK3[t][1]), p3t = (lv >= 3 ? '✓ ' : '🔒 ') + T('perk3') + ': ' + p3;
      if (rh >= 50 * S) D.text(p3t, tx, ry + 39 * S, Math.max(10.5, D.fitText(p3t, tw, 12 * S)), lv >= 3 ? '#2f7a4a' : '#6a7394', 'left');
      if (!sm) {
        var ch = Z.allyPerk(t), bw2 = (tw - 6 * S) / 2, pbh = Math.min(32 * S, rh - 54 * S);
        ['a', 'b'].forEach(function (o, i) {
          var lbl = (ch === o && lv >= 5 ? '✓ ' : '') + TT(Z.PERK5[t][i][0], Z.PERK5[t][i][1]);
          api.button('pk_' + t + o, tx + i * (bw2 + 6 * S), ry + 48 * S, bw2, pbh, { modal: true, r: 8 * S, enabled: lv >= 5, c1: ch === o ? '#fff3c4' : '#ffffff', c2: ch === o ? COL.goldD : COL.panelD, fn: function () { Z.save.au = Z.save.au || {}; Z.save.au[t] = o; Z.persist(); Z.AU.sfx('select'); },
            draw: function (bx, by, bw, bh) { D.textLines(D.fitLines(lbl, bw - 10 * S, 12 * S, 10.5, 2), bx + bw / 2, by + bh / 2, OL, 'center', 0, 1.05); } });
        });
      }
      // испытание
      var open = Z.trialOpen(t), done = Z.save.trials && Z.save.trials[t];
      api.button('tr_' + t, f.x + w - 14 * S - trW, ry + 3 * S, trW, 24 * S, { modal: true, r: 8 * S, enabled: open, c1: done ? '#6fe07a' : '#ff8fb1', c2: done ? COL.greenD : '#d45a80',
        fn: function () { var mm = UI.modal; while (UI.modal) { UI.modal.noBack = true; UI.closeModal(); } Z.startTrial(t); }, draw: function (bx, by, bw, bh) { var tl = done ? '✓ ' + T('trial') : T('trial'); D.text(tl, bx + bw / 2, by + bh / 2, Math.max(10.5, D.fitText(tl, bw - 8 * S, 12.5 * S)), '#fff', 'center', 'middle', 2 * S); } });
    });
    
    return true;
  }
  if (m.type === 'hero') {
    var t = m.ht, lv = Z.allyLvl(t), ch = Z.allyPerk(t);
    f = api.frame(w, 420 * S, T('al_' + t));
    api.closeX(f);
    var fy = f.y + 40 * S;
    D.ally(t, f.x + 64 * S, fy + 110 * S, 56 * S, { dir: 1 });
    var tx = f.x + 124 * S, tw = w - 144 * S;
    D.text(T('heroLvl') + ' ' + lv + (Z.OKP_OFF ? '' : ' · ' + T('okp') + ' ' + Z.OK_COST[t]), tx, fy + 12 * S, 15 * S, OL, 'left');
    D.rr(tx, fy + 24 * S, tw, 8 * S, 4 * S); cx.fillStyle = '#c9cfdc'; cx.fill(); D.rr(tx, fy + 24 * S, tw * (lv >= 10 ? 1 : Z.allyXpNext(t)), 8 * S, 4 * S); cx.fillStyle = '#6b3fa0'; cx.fill();
    D.wrap(T('al_' + t + 'D'), tw, 11 * S).slice(0, 5).forEach(function (ln, i) { D.text(ln, tx, fy + 46 * S + i * 15 * S, 11 * S, '#4a5378', 'left'); });
    var yy2 = fy + 136 * S;
    if (rh >= 50 * S) D.text((lv >= 3 ? '✓ ' : '🔒 ') + T('perk3') + ': ' + TT(Z.PERK3[t][0], Z.PERK3[t][1]), f.x + 22 * S, yy2, D.fitText(T('perk3') + ': ' + TT(Z.PERK3[t][0], Z.PERK3[t][1]) + '00', w - 44 * S, 13 * S), lv >= 3 ? '#2f7a4a' : '#7a83a3', 'left');
    D.text(T('perk5'), f.x + 22 * S, yy2 + 24 * S, 13 * S, lv >= 5 ? OL : '#7a83a3', 'left');
    var bw2 = (w - 44 * S - 8 * S) / 2;
    ['a', 'b'].forEach(function (o, i) {
      var lbl = TT(Z.PERK5[t][i][0], Z.PERK5[t][i][1]);
      api.button('hp_' + o, f.x + 22 * S + i * (bw2 + 8 * S), yy2 + 36 * S, bw2, 44 * S, { modal: true, r: 10 * S, enabled: lv >= 5, c1: ch === o ? '#fff3c4' : '#ffffff', c2: ch === o ? COL.goldD : COL.panelD, fn: function () { Z.save.au = Z.save.au || {}; Z.save.au[t] = o; Z.persist(); Z.AU.sfx('select'); },
        draw: function (bx, by, bw, bh) { D.wrap(lbl, bw - 12 * S, 12 * S).slice(0, 2).forEach(function (ln, k, arr) { D.text(ln, bx + bw / 2, by + bh / 2 + (k - (arr.length - 1) / 2) * 14 * S, 12 * S, OL); }); } });
    });
    D.text((lv >= 10 ? '✓ ' : '🔒 ') + T('perk10'), f.x + 22 * S, yy2 + 98 * S, D.fitText(T('perk10') + '00', w - 44 * S, 12 * S), lv >= 10 ? '#2f7a4a' : '#7a83a3', 'left');
    var syns = Z.SYNERGY.filter(function (q) { return q.a === t || q.b === t; });
    D.text(T('syn') + ':', f.x + 22 * S, yy2 + 122 * S, 12 * S, OL, 'left');
    syns.slice(0, 2).forEach(function (q, i) { var o2 = q.a === t ? q.b : q.a, ln = '🔗 ' + T('al_' + o2) + ' — ' + TT(q.ru, q.en); D.text(ln, f.x + 22 * S, yy2 + 140 * S + i * 16 * S, D.fitText(ln + '0', w - 44 * S, 11 * S), '#4a5378', 'left'); });
    var open = Z.trialOpen(t), done = Z.save.trials && Z.save.trials[t];
    api.bigBtn('htr', f, f.y + f.h - 62 * S, (done ? '✓ ' : '') + T('trial') + ': ' + TT(Z.TRIALS[t].ru, Z.TRIALS[t].en), function () { if (!open) { Z.AU.sfx('error'); return; } while (UI.modal) { UI.modal.noBack = true; UI.closeModal(); } Z.startTrial(t); }, open ? '#ff8fb1' : '#9aa3b8', open ? '#d45a80' : '#737c93');
    
    return true;
  }
  if (m.type === 'swap') {
    var G = Z.G; if (!G) { UI.closeModal(); return true; }
    var bench = Z.ALLY_ORDER.filter(function (t) { return Z.heroOpen(t, G.idx) && t !== Z.inSleigh(G.idx) && !G.squad.some(function (U) { return U.type === t; }); });
    var lim = Z.okLimit(G.endless ? 99 : G.idx), used = Z.okUsed(G.squad.map(function (U) { return U.type; }));
    m.out = m.out || G.squad[0];
    f = api.frame(w, 150 * S + 2 * 90 * S, Z.OKP_OFF ? T('swap') : T('swap') + ' · ' + T('okp') + ' ' + used + '/' + lim);
    api.closeX(f);
    D.text(T('inBattle'), f.x + 22 * S, f.y + 44 * S, 13 * S, '#4a5378', 'left');
    var cw = Math.min(70 * S, (w - 44 * S) / Math.max(4, G.squad.length) - 6 * S);
    G.squad.forEach(function (U, i) {
      api.button('so_' + i, f.x + 22 * S + i * (cw + 6 * S), f.y + 56 * S, cw, 80 * S, { modal: true, r: 10 * S, c1: m.out === U ? '#fff3c4' : '#dfe7f7', c2: m.out === U ? COL.goldD : '#aab6d6', fn: function () { m.out = U; },
        draw: function (bx, by, bw, bh) { D.ally(U.type, bx + bw / 2, by + bh - 6 * S, bh * 0.3, { dir: 1 }); if (!Z.OKP_OFF) D.text(T('okp') + Z.OK_COST[U.type], bx + bw / 2, by + 10 * S, 10 * S, OL); } });
    });
    var shl = D.wrap(T('reserve') + ' — ' + T('swapHint'), w - 44 * S, Math.max(11, 12 * S)).slice(0, 2); shl.forEach(function (ln, i) { D.text(ln, f.x + 22 * S, f.y + 146 * S + i * 13 * S, Math.max(11, 12 * S), '#4a5378', 'left'); });   // 2.10.3: в две строки, а не мелко
    bench.forEach(function (t, i) {
      var fits = used - Z.OK_COST[m.out.type] + Z.OK_COST[t] <= lim;
      api.button('sb_' + t, f.x + 22 * S + i * (cw + 6 * S), f.y + 164 * S, cw, 80 * S, { modal: true, r: 10 * S, enabled: fits, c1: '#ffffff', c2: COL.panelD,
        fn: function () { swapUnit(G, m.out, t); UI.closeModal(); },
        draw: function (bx, by, bw, bh) { D.ally(t, bx + bw / 2, by + bh - 6 * S, bh * 0.3, { dir: 1 }); if (!Z.OKP_OFF) D.text(T('okp') + Z.OK_COST[t], bx + bw / 2, by + 10 * S, 10 * S, OL); } });
    });
    return true;
  }
  if (m.type === 'mult') { (UI.drawMultHook || drawMult)(m); return true; }
  return false;
};
// вложенные окна: открываются поверх и по закрытию возвращают предыдущее (раньше вставали в очередь — «не закрывалось»)
UI.goModal = function (m) { if (UI.modal) m.back = m.back || UI.modal; m.t = 0; UI.modal = m; };
var oldClose = UI.closeModal;
UI.closeModal = function () { var m = UI.modal; if (m && m.back && !m.noBack) { var b = m.back; m.back = null; b.t = 1; UI.modal = b; return; } var r = oldClose.apply(this, arguments); if (m && m.onClose) m.onClose(); return r; };
function swapUnit(G, out, t) {
  var L = G.L, gx = L.fort ? L.fort[0] + 0.5 : out.home.x, gy = L.fort ? L.fort[1] - 0.2 : out.home.y;
  if (L.type === 'escort' && Z.sleighPos) { var p = Z.sleighPos(); gx = p.x; gy = p.y; }
  var N = Z.makeUnit(G, t, gx, gy); N.home = { x: out.home.x, y: out.home.y }; N.tx = N.home.x; N.ty = N.home.y; N.order = 2;
  var i = G.squad.indexOf(out); G.squad[i] = N; if (G.hero === out) G.hero = N;
  var sq = (Z.save.squad || []).filter(function (q) { return q !== out.type; }); sq.push(t); Z.save.squad = sq; Z.save.sqOff = Z.save.sqOff || {}; Z.save.sqOff[out.type] = 1; delete Z.save.sqOff[t]; Z.persist();
  Z._.puff(gx, gy, 12, 1); Z.AU.sfx('levelup', 0.6); Z.say(t, 'start', N);
}

// ---------- мультфильмы М1–М11 с озвучкой ----------
Z.MULTS = {
  M1: { sc: 'night', ru: 'Приглашения', en: 'The Invitations', at: 0 }, M2: { sc: 'night', ru: 'Великан проснулся', en: 'The Giant Wakes', at: 6 },
  M3: { sc: 'village', ru: 'Печь на лыжах', en: 'A Stove on Skis', at: 9 }, M4: { sc: 'storm', ru: 'Колесница', en: 'The Chariot', at: 13 },
  M5: { sc: 'mount', ru: 'Договор', en: 'The Contract', at: 14 }, M6: { sc: 'lake', ru: 'Колобок', en: 'Kolobok', at: 15 },
  M7: { sc: 'lake', ru: 'Калинов мост', en: 'Kalinov Bridge', at: 20 }, M8: { sc: 'mount', ru: 'Премудрая', en: 'The Wise One', at: 22 },
  M9: { sc: 'mount', ru: 'Игла в яйце', en: 'The Needle in the Egg', at: 25 }, M10: { sc: 'pole', ru: 'Двое против всех', en: 'Two Against All', at: 34 },
  M11: { sc: 'fest', ru: 'Новый год', en: 'New Year', at: 35 },
  M12: { sc: 'night', ru: 'Разбойничья планёрка', en: 'The Bandits\' Meeting', at: 8 },
  M13: { sc: 'camp', ru: 'Стройка века', en: 'The Build of the Century', at: 4 }, M14: { sc: 'thicket', ru: 'Леший заблудился', en: 'Leshy Gets Lost', at: 5 },
  M15: { sc: 'airfield', ru: 'Снегоходы и шары', en: 'Snowmobiles and Balloons', at: 7 }, M16: { sc: 'cellar', ru: 'Белка Шишка', en: 'Shishka the Squirrel', at: 11 },
  M17: { sc: 'isle', ru: 'Снеговик-богатырь', en: 'The Snowman Hero', at: 16 }, M18: { sc: 'drift', ru: 'Таран на льду', en: 'A Ram on the Ice', at: 17 },
  M21: { sc: 'isle', ru: 'Фамильное ведро', en: 'The Family Bucket', at: 16, n: 2, free: true }, M22: { sc: 'isle', ru: 'Братья по морозилке', en: 'Freezer Brothers', at: 16, n: 3, free: true },
  M19: { sc: 'plowyard', ru: 'Снегоуборщик', en: 'The Snowplow', at: 21 }, M20: { sc: 'bar', ru: 'Бешеные еноты', en: 'Rabid Raccoons', at: 24 }
};
function multLines(id) { return Object.keys(Z.VL).filter(function (k) { return k.indexOf(id + '-') === 0; }).sort(function (a, b) { return parseInt(a.split('-')[1], 10) - parseInt(b.split('-')[1], 10); }); }
var oldShow = Z.showComic;
Z.showComic = function (id, then) {
  if (id === 'intro') id = 'M1'; else if (id === 'finale') id = 'M11'; else if (/^r[1-4]$/.test(id)) { if (then) then(); return; }
  if (Z.MULTS[id]) {
    if (Z.save.seen['cut_' + id] && !Z.forceCut) { if (then) then(); return; }
    Z.forceCut = false;
    UI.openModal({ type: 'mult', id: id, i: -1, lt: 0, then: then, ids: multLines(id) });
    Z.AU.setState('comic', 0);
    return;
  }
  return oldShow.apply(this, arguments);
};
var oldStory = Z.showStory;
Z.showStory = function (idx) {
  // перед уровнем может идти несколько мультиков подряд (М17 → М21); мультик с пометкой post показывается после победы
  var hits = []; for (var k in Z.MULTS) if (Z.MULTS[k].at === idx && k !== 'M11' && !Z.MULTS[k].free && !Z.save.seen['cut_' + k]) hits.push(k);
  hits.sort(function (a, b) { return (Z.MULTS[a].n || 1) - (Z.MULTS[b].n || 1); });
  // братья-снеговики: мультик-встреча идёт перед первым боем, в который взяты оба (на любом уровне), примирение — после победы в этом бою
  Z.broBattle = false;
  if (Z.brosIn() && !Z.save.seen.cut_M21 && !Z.trialHero) { hits.push('M21'); Z.broBattle = true; }
  if (hits.length) { var runH = function (i) { if (i < hits.length) Z.showComic(hits[i], function () { runH(i + 1); }); }; runH(0); return; }
  if (idx === 0) return;
  Z.showComic('lv_' + idx);
};
Z.TXT.ru.watchMult = 'Смотреть мультик'; Z.TXT.en.watchMult = 'Watch the cartoon'; Z.TXT.ru.watchScene = 'Смотреть сцену'; Z.TXT.en.watchScene = 'Watch the scene';
Z.COMIC_AFTER = Z.COMIC_AFTER || {}; Z.COMIC_AFTER[34] = 'M11';
Z.brosIn = function () { var G = Z.G, sq = (G && G.squad) || [], a = 0, b = 0; sq.forEach(function (U) { if (U.type === 'eskimo') a = 1; if (U.type === 'plombir') b = 1; }); return !!(a && b); };
Z.afterComicFor = function (G) { if (Z.COMIC_AFTER[G.idx] === 'M11' || Z.COMIC_AFTER[G.idx] === 'finale') return null; return (Z.broBattle || (Z.save.seen.cut_M21 && Z.brosIn())) && !Z.save.seen.cut_M22 ? 'M22' : null; };
// мультики уровня (для значка на карте и кнопки «Смотреть» в окне уровня); финальный М11 показывается после 35-го
Z.multsAt = function (idx) { var o = []; for (var k in Z.MULTS) { var a = Z.MULTS[k].at; if (Z.MULTS[k].free) continue; if (a === idx || (a === 35 && idx === 34)) o.push(k); } return o.sort(function (a, b) { return Z.MULTS[a].at - Z.MULTS[b].at || (Z.MULTS[a].n || 1) - (Z.MULTS[b].n || 1); }); };
// пересмотр по желанию: мультик (или сцена уровня) без отметки «уже видел»
Z.replayStory = function (idx, then) {
  var ms = Z.multsAt(idx).filter(function (k) { return Z.MULTS[k].at === idx; });
  var run = function (list) { if (!list.length) { if (then) then(); return; } Z.forceCut = true; Z.showComic(list[0], function () { run(list.slice(1)); }); };
  if (ms.length) run(ms);
  else if (Z.COMICS && Z.COMICS['lv_' + idx]) { var k = 'comic_lv_' + idx, was = Z.save.seen[k]; Z.save.seen[k] = 0; Z.showComic('lv_' + idx, function () { Z.save.seen[k] = was || 1; if (then) then(); }); }
  else if (then) then();
};
var CUT_ORDER = Object.keys(Z.MULTS).sort(function (a, b) { return Z.MULTS[a].at - Z.MULTS[b].at || (Z.MULTS[a].n || 1) - (Z.MULTS[b].n || 1) || parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10); });
UI.cutList = function () { return CUT_ORDER.map(function (k) { return [k, Z.MULTS[k].at]; }); };
CUT_ORDER.forEach(function (k, i) { Z.TXT.ru['cutT_' + k] = (i + 1) + '. ' + Z.MULTS[k].ru; Z.TXT.en['cutT_' + k] = (i + 1) + '. ' + Z.MULTS[k].en; });
function drawer(v) {
  return function (x, y, R, d, act, talk) {
    var o = { dir: d, walk: act, talk: talk, noTalk: !talk };
    var M = Z.mouthAt && talk ? Z.mouthAt : function () {};
    if (v === 'MOR') D.moroz(x, y, R * 0.95, o); else if (v === 'SNE') D.snegurochka(x, y, R * 0.9, o); else if (v === 'MET') D.metelitsa(x, y, R, o);
    else if (v === 'PLO') D.ally('plombir', x, y, R * 0.78, o);
    else if (v === 'EME') D.ally('emelya', x, y, R * 1.35, o);
    else if (v === 'BEL' || v === 'KOL' || v === 'VAS' || v === 'KOT') D.ally({ EME: 'emelya', BEL: 'belka', KOL: 'kolobok', PLO: 'plombir', VAS: 'vasilisa', KOT: 'kot' }[v], x, y, R, o);
    else if (v === 'SHU') { var cx = ctx(); cx.save(); cx.translate(x, y - R * 0.4); cx.scale(d, 1); D.ell(0, 0, R * 0.55, R * 0.2, '#7a9aa8', 2); D.poly([R * 0.5, 0, R * 0.8, -R * 0.2, R * 0.8, R * 0.2], '#7a9aa8', 2); D.circ(-R * 0.3, -R * 0.05, R * 0.05, OL); D.poly([-R * 0.45, -R * 0.14, -R * 0.32, -R * 0.36, -R * 0.2, -R * 0.14], '#ffd54a', 1.5); cx.restore(); }
    else { var tp = { ENO: 'raccoon', RAZ: 'raz', SOL: 'raz', YAG: 'yaga', LES: 'leshy', KIK: 'kiki', GIA: 'giant', GOR: 'gorynych', GOR2: 'gorynych', GOR3: 'gorynych', KOS: 'koschei' }[v] || 'raccoon'; var sz = Z.ENEMIES[tp].size; D.enemy({ type: tp, size: sz, dir: d, talk: talk, walk: act ? Z.time * 6 : 0, ph: 0, hitT: 0, slow: 0, kb: 0, hp: 1, max: 1, air: false }, x, y, R * (tp === 'gorynych' ? 0.75 : 0.62) / (0.31 * sz), Z.time); }
  };
}
function drawMult(m) {
  var cx = ctx(), L = UI.L, W = L.vp.w + L.ox * 2, H = L.sh, S = L.s, t = Z.time, M = Z.MULTS[m.id];
  m.lt += 1 / 60;
  var ids = m.ids;
  var next = function () {
    if (m.i >= ids.length - 1) { end(); return; }
    m.i++; m.lt = 0; m.wait = true; var my = m.i;
    Z.playLine(ids[m.i], function () { if (UI.modal === m && m.i === my) { m.wait = false; m.doneT = Z.time; } });
  };
  var end = function () { if (m.ended) return; m.ended = true; Z.save.seen['cut_' + m.id] = 1; Z.persist(); Z.sub.t = 0; UI.closeModal(); if (m.then) m.then(); };
  if (m.i < 0) next();
  if (!m.wait && m.doneT && Z.time - m.doneT > 0.45) { m.doneT = 0; next(); }
  var id = ids[Math.max(0, m.i)], v = Z.VL[id] ? Z.VL[id][0] : 'NAR', nar = v === 'NAR';
  // сцена
  var sh = H * 0.72, sy = (H - sh) / 2 - 20 * S;
  cx.fillStyle = '#0b1028'; cx.fillRect(0, 0, W, H);
  Z.drawScene(M.sc, 0, sy, W, sh, t);
  // актёры: все голоса мультфильма стоят на сцене, говорящий — крупнее и подпрыгивает
  var cast = []; ids.forEach(function (q) { var vv = Z.VL[q][0]; if (vv !== 'NAR' && cast.indexOf(vv) < 0 && vv !== 'GOR2' && vv !== 'GOR3') cast.push(vv); });
  var gy = sy + sh * 0.9, R = Math.min(sh * 0.32, W / (cast.length + 1) * 0.55);
  cast.forEach(function (vv, i) {
    var x = W * (i + 1) / (cast.length + 1), speak = vv === v || (v.indexOf('GOR') === 0 && vv === 'GOR'), d = x < W / 2 ? 1 : -1;
    var bob = speak ? Math.abs(Math.sin(t * 6)) * R * 0.06 : 0, sc = speak ? 1.12 : 0.92;
    cx.globalAlpha = speak || nar ? 1 : 0.75;
    drawer(vv)(x, gy - bob, R * sc, d, speak, speak && m.wait);
    cx.globalAlpha = 1;
    if (speak) D.poly([x - 8 * S, gy - R * sc * 2.3, x + 8 * S, gy - R * sc * 2.3, x, gy - R * sc * 2.1], '#fff');
  });
  // «как в старых фильмах»: у рассказчика сепия, виньетка, царапины
  if (nar) {
    cx.globalAlpha = 0.35; cx.fillStyle = '#704a1a'; cx.fillRect(0, sy, W, sh); cx.globalAlpha = 1;
    var vg = cx.createRadialGradient(W / 2, sy + sh / 2, sh * 0.3, W / 2, sy + sh / 2, sh * 0.9); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); cx.fillStyle = vg; cx.fillRect(0, sy, W, sh);
    cx.strokeStyle = 'rgba(255,240,200,0.35)'; cx.lineWidth = 1; for (var s = 0; s < 3; s++) { var sx = (Math.sin(t * 13 + s * 7) * 0.5 + 0.5) * W; cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(sx + 3, sy + sh); cx.stroke(); }
    if (Math.random() < 0.3) { cx.globalAlpha = 0.06; cx.fillStyle = '#fff'; cx.fillRect(0, sy, W, sh); cx.globalAlpha = 1; }
  }
  // заголовок и субтитры
  D.text(TT(M.ru, M.en), W / 2, sy - 18 * S, 20 * S, '#ffd54a', 'center', 'middle', 3 * S);
  var txt = Z.lineText(id), lines = D.wrap(txt, Math.min(W - 40 * S, 640 * S), 17 * S).slice(0, 3);
  var by = sy + sh + 10 * S, nm = Z.VNAME[v] ? TT(Z.VNAME[v][0], Z.VNAME[v][1]) : '';
  D.text(nm, W / 2, by + 6 * S, 14 * S, Z.VCOL[v] || '#fff');
  lines.forEach(function (ln, i) { D.text(ln, W / 2, by + 28 * S + i * 22 * S, 17 * S, nar ? '#ffe9a8' : '#ffffff', 'center', 'middle', 3 * S); });
  for (var d2 = 0; d2 < ids.length; d2++) D.circ(W / 2 - (ids.length - 1) * 6 * S + d2 * 12 * S, H - 14 * S, 3 * S, d2 === m.i ? COL.gold : '#5a6385');
  var api = A();
  api.button('mTap', 0, sy, W, sh, { modal: true, hidden: true, fn: function () { if (Z.time - (m.tapT || 0) < 0.25) return; m.tapT = Z.time; Z.stopLine && Z.stopLine(); m.wait = false; m.doneT = Z.time - 1; } });
  api.button('mSkip', W - 110 * S, 10 * S, 100 * S, 36 * S, { modal: true, c1: 'rgba(95,116,184,0.85)', c2: '#43579a', label: T('skip'), fn: function () { Z.stopLine && Z.stopLine(); end(); } });
}

// ---------- старт уровня: плашка с названием карты ----------
var oldGo = UI.goLevel;
UI.goLevel = function (idx, heroic) {
  if (!UI._trialStarting) Z.trialHero = null;
  var r = oldGo.apply(this, arguments); UI._trialStarting = false;
  var G = Z.G, mp = Z.mapOf(idx);
  if (G && mp && !G.endless) setTimeout(function () { if (Z.G === G) G.banner = { text: G.trial ? T('trial') + ': ' + TT(Z.TRIALS[G.trial].ru, Z.TRIALS[G.trial].en) : mp.name, sub: Z.MECH[mp.mech] ? TT(Z.MECH[mp.mech][0], Z.MECH[mp.mech][1]) : '', t: 3.2 }; }, 400);
  if (G && G.squad) Z.preloadVoices(G.squad.map(function (U) { return Z.VKEY[U.type] + '-0' + (2 + Math.floor(Math.random() * 3)); }));
  return r;
};
var oldStartTrial = Z.startTrial;
Z.startTrial = function (t) { Z.trialHero = t; UI._trialStarting = true; oldStartTrial(t); };

Object.assign(Z.TXT.ru, { opt26: 'Звук, графика, управление', trapsT: 'Ловушка' });
Object.assign(Z.TXT.en, { opt26: 'Sound, graphics, controls', trapsT: 'Trap' });
})();
