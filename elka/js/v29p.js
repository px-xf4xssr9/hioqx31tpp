/* 2.11.5 · главное меню: фоны на выбор, заметные кнопки (Магазин, Набор, Друзья), живые герои —
   нажми на героя: подпрыгнет, скажет реплику своим голосом или разыграет мини-сценку с соседом,
   а кнопка «Переодеть» сразу откроет его гардероб. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui;
function TT(r, e) { return Z.LANG === 'en' ? e : r; }
var OL = '#1b2448';

// ---------- фоны ----------
Z.MENU_BG = [['night', 0, 'Зимняя ночь', 'Winter night'], ['aurora', 40, 'Северное сияние', 'Northern lights'], ['dawn', 40, 'Рассвет', 'Dawn'], ['fair', 60, 'Ярмарка', 'Fair']];
function bgId() { var b = Z.save && Z.save.cos && Z.save.cos.bg; if (b && b !== 'night' && !(Z.save.deco.own && Z.save.deco.own['bg_' + b])) return 'night'; return b || 'night'; }
function sky(c, id, x, y, w, h) {
  var g = c.createLinearGradient(0, y, 0, y + h), P = { night: ['#16224a', '#3a4f96'], aurora: ['#07122e', '#1d3a6e'], dawn: ['#5b6fc4', '#ffb3a1'], fair: ['#2a1450', '#6a3fb0'] }[id] || ['#16224a', '#3a4f96'];
  g.addColorStop(0, P[0]); g.addColorStop(1, P[1]); c.fillStyle = g; c.fillRect(x, y, w, h);
}
function stars(c, x, y, w, h, t, n) { for (var i = 0; i < n; i++) { var k = 0.4 + 0.4 * Math.sin(t * 1.3 + i); c.fillStyle = 'rgba(255,255,255,' + k.toFixed(2) + ')'; c.fillRect(x + (i * 97.3) % w, y + (i * 53.1) % (h * 0.6), 2, 2); } }
function aurora(c, x, y, w, h, t, s) {
  c.save(); c.globalCompositeOperation = 'lighter';
  [['80,255,190', 0.18], ['150,120,255', 0.24], ['90,200,255', 0.3]].forEach(function (q, b) {
    var ay = y + h * q[1], g = c.createLinearGradient(0, ay - h * 0.12, 0, ay + h * 0.12); g.addColorStop(0, 'rgba(' + q[0] + ',0)'); g.addColorStop(0.5, 'rgba(' + q[0] + ',' + (0.22 + 0.06 * Math.sin(t * 0.6 + b)).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + q[0] + ',0)');
    c.fillStyle = g; c.beginPath();
    for (var xx = x - 10; xx <= x + w + 10; xx += w / 30) c.lineTo(xx, ay + Math.sin(xx / w * 7 + t * 0.35 + b * 1.7) * h * 0.06 - h * 0.1);
    for (xx = x + w + 10; xx >= x - 10; xx -= w / 30) c.lineTo(xx, ay + Math.sin(xx / w * 7 + t * 0.35 + b * 1.7) * h * 0.06 + h * 0.1);
    c.closePath(); c.fill();
  });
  c.restore();
}
function fireworks(c, x, y, w, h, t, s) {
  var cols = ['#ff5a5f', '#ffd54a', '#5ac8ff', '#9dff6a', '#ff8fd6'];
  for (var f = 0; f < 4; f++) {
    var per = 2.4 + f * 0.37, ph = ((t + f * 0.9) % per) / per, fx = x + w * (0.12 + ((f * 0.29 + Math.floor((t + f * 0.9) / per) * 0.37) % 0.76)), fy = y + h * (0.12 + (f % 2) * 0.12);
    if (ph < 0.25) { var k = ph / 0.25; c.fillStyle = '#fff3b0'; c.fillRect(fx - 1, fy + (1 - k) * h * 0.4, 2, h * 0.05); continue; }
    var p = (ph - 0.25) / 0.75, r = Math.min(w, h) * 0.12 * Math.sqrt(p);
    c.globalAlpha = Math.max(0, 1 - p);
    for (var q = 0; q < 14; q++) { var a = q / 14 * Math.PI * 2; c.fillStyle = cols[(q + f) % 5]; c.beginPath(); c.arc(fx + Math.cos(a) * r, fy + Math.sin(a) * r + p * p * h * 0.06, Math.max(1, Math.min(w, h) * 0.008), 0, 7); c.fill(); }
    c.globalAlpha = 1;
  }
}
function flags(c, x, w, y, t, s) {
  var cols = ['#ff5a5f', '#ffd54a', '#4cc77d', '#3fb6e6', '#b47cff'];
  c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = Math.max(1, s); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y + 30 * s, x + w, y); c.stroke();
  for (var i = 1; i < 16; i++) { var k = i / 16, fx = x + w * k, fy = y + 30 * s * 2 * k * (1 - k) + Math.sin(t * 3 + i) * s; c.fillStyle = cols[i % 5]; c.beginPath(); c.moveTo(fx - 6 * s, fy); c.lineTo(fx + 6 * s, fy); c.lineTo(fx, fy + 14 * s); c.closePath(); c.fill(); }
}
Z.menuBgThumb = function (id, x, y, w, h, t) {
  var c = D.ctx; sky(c, id, x, y, w, h);
  if (id !== 'dawn') stars(c, x, y, w, h, t, 14);
  if (id === 'aurora') aurora(c, x, y, w, h, t, 1);
  if (id === 'fair') { fireworks(c, x, y, w, h, t, 1); flags(c, x, w, y + h * 0.08, t, w / 160); }
  if (id === 'dawn') { var g = c.createRadialGradient(x + w * 0.75, y + h * 0.55, 0, x + w * 0.75, y + h * 0.55, h * 0.6); g.addColorStop(0, 'rgba(255,240,180,0.95)'); g.addColorStop(0.25, 'rgba(255,210,140,0.6)'); g.addColorStop(1, 'rgba(255,200,150,0)'); c.fillStyle = g; c.fillRect(x, y, w, h); }
  else { c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(x + w * 0.8, y + h * 0.25, h * 0.1, 0, 7); c.fill(); }
  c.fillStyle = id === 'dawn' ? '#6b6fae' : '#22336b'; c.beginPath(); c.moveTo(x, y + h * 0.75); for (var i = 0; i <= 6; i++) c.lineTo(x + w * i / 6, y + h * (i % 2 ? 0.55 : 0.72)); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.fill();
  c.fillStyle = id === 'dawn' ? '#fff3ef' : '#eef4ff'; c.fillRect(x, y + h * 0.82, w, h * 0.2);
};
var oBack = Z.menuBack;
Z.menuBack = function (W, H, ground, s, t, th) {
  var c = D.ctx, id = bgId();
  if (id !== 'night') { sky(c, id, 0, 0, W, H); if (id !== 'dawn') stars(c, 0, 0, W, H, t, 60); }
  if (id === 'aurora') aurora(c, 0, 0, W, ground, t, s);
  if (id === 'fair') fireworks(c, 0, 0, W, ground, t, s);
  var r = oBack ? oBack.apply(this, arguments) : undefined;
  if (id === 'dawn') {
    var mx = W * 0.82, my = Math.max(70 * s, H * 0.13), g = c.createRadialGradient(mx, my, 0, mx, my, Math.min(W, H) * 0.45); g.addColorStop(0, 'rgba(255,244,190,1)'); g.addColorStop(0.12, 'rgba(255,220,150,0.85)'); g.addColorStop(1, 'rgba(255,190,150,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, ground); c.fillStyle = 'rgba(255,170,150,0.16)'; c.fillRect(0, 0, W, ground);
  }
  if (id === 'fair') flags(c, 0, W, 6 * s, t, s);
  return r;
};

// ---------- живые герои ----------
var LINES = {
  moroz: ['MOR-01', 'MOR-02', 'MOR-03', 'MOR-05', 'MOR-15', 'MOR-17'], sneg: ['SNE-01', 'SNE-02', 'SNE-13', 'SNE-14', 'SNE-15'], belka: ['BEL-01', 'BEL-02', 'BEL-10', 'BEL-11'],
  plombir: ['PLO-01', 'PLO-02', 'PLO-08', 'PLO-09'], eskimo: ['ESK-01', 'ESK-02', 'ESK-03', 'ESK-09', 'ESK-10'], vasilisa: ['VAS-01', 'VAS-02', 'VAS-08', 'VAS-09'],
  kot: ['KOT-01', 'KOT-02', 'KOT-07', 'KOT-08'], kolobok: ['KOL-01', 'KOL-02', 'KOL-04', 'KOL-09', 'KOL-10'], emelya: ['EME-01', 'EME-02', 'EME-11', 'EME-12']
};
// мини-сценки: перепалки героев (уже озвучены)
var DUO = [
  { need: ['eskimo', 'plombir'], ids: ['DUO-21a', 'DUO-21b', 'DUO-21c'] }, { need: ['plombir', 'eskimo'], ids: ['DUO-22a', 'DUO-22b'] }, { need: ['sneg', 'eskimo', 'plombir'], ids: ['DUO-23a', 'DUO-23b', 'DUO-23c'] },
  { need: ['kolobok', 'moroz'], ids: ['DUO-10a', 'DUO-10b', 'DUO-10c'] }, { need: ['sneg', 'plombir'], ids: ['DUO-11a', 'DUO-11b'] }, { need: ['vasilisa', 'emelya'], ids: ['DUO-12a', 'DUO-12b'] },
  { need: ['belka', 'kolobok'], ids: ['DUO-13a', 'DUO-13b', 'DUO-13c'] }, { need: ['kot', 'emelya'], ids: ['DUO-14a', 'DUO-14b'] }, { need: ['moroz', 'sneg', 'plombir'], ids: ['DUO-18a', 'DUO-18b', 'DUO-18c'] },
  { need: ['moroz', 'eskimo'], ids: ['DUO-24a', 'DUO-24b'] }
];
var CODE = {}; for (var k in Z.VKEY) CODE[Z.VKEY[k]] = k;
var POS = {}, frameN = 0, REACT = {}, picked = null, lastLine = null;
function inMenu() { return UI && UI.screen === 'menu' && !UI.modal; }
function rec(type, x, y, R) { if (!inMenu()) return; POS[type] = { x: x, y: y, R: R, f: frameN }; }
function jumpY(type, R) { var r = REACT[type]; if (!r) return 0; var p = (Z.time - r.t0) / 0.55; if (p < 0 || p > 1) return 0; return -Math.sin(p * Math.PI) * R * 0.55; }
function wrap(name, type, rk) {
  var o = D[name]; if (!o) return;
  D[name] = function (x, y, R) {
    if (!inMenu()) return o.apply(this, arguments);
    var tp = type || arguments[0], args = Array.prototype.slice.call(arguments);
    if (type) { rec(tp, x, y, R * (rk || 1)); args[1] = y + jumpY(tp, R); }
    else { rec(tp, args[1], args[2], args[3]); args[2] = args[2] + jumpY(tp, args[3]); }
    return o.apply(this, args);
  };
}
wrap('ally'); wrap('moroz', 'moroz'); wrap('snegurochka', 'sneg', 1 / 0.92);
var ATK = { moroz: 1, plombir: 1, kot: 1, kolobok: 1 };
function sparkle(type) {
  var p = POS[type]; if (!p) return; var c = D.ctx, r = REACT[type]; if (!r) return; var q = (Z.time - r.t0) / 0.8; if (q < 0 || q > 1) return;
  var cols = ['#ffd54a', '#ffffff', '#9fe3ff', '#ff8fd6'];
  for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2 + r.t0, d = p.R * (0.6 + q * 1.2); c.globalAlpha = 1 - q; D.star(p.x + Math.cos(a) * d, p.y - p.R * 1.2 + Math.sin(a) * d * 0.7, p.R * 0.12 * (1 - q * 0.5), cols[i % 4], 0); }
  c.globalAlpha = 1;
}
function speakerOf() { var sb = Z.sub; if (!sb || !(sb.t > 0) || !sb.id || !Z.VL[sb.id]) return null; return CODE[Z.VL[sb.id][0]] || null; }
function bubble(s) {
  var who = speakerOf(), p = who && POS[who];
  if (!p && Z.sub && Z.sub.t > 0 && Z.sub.id && Z.VL[Z.sub.id] && Z.menuExtraPos) { var q = Z.menuExtraPos(Z.VL[Z.sub.id][0]); if (q) p = { x: q.x, y: q.y, R: q.R, f: frameN }; }   // враги в меню: Кощей, разбойник, Соловей, Горыныч
  if (!p || p.f < frameN - 2) return;
  var c = D.ctx, txt = Z.sub.text, fs = Math.max(11, 13 * s), F = D.fitLines(txt, Math.min(260 * s, UI.api().W * 0.6), fs, 10.5, 3), lh = F.px * 1.15, w = 0;
  F.lines.forEach(function (l) { w = Math.max(w, D.mw(l, F.px)); }); w += 22 * s; var h = F.lines.length * lh + 14 * s;
  var bx = Math.max(8 * s, Math.min(UI.api().W - w - 8 * s, p.x - w / 2)), by = Math.max(70 * s, p.y - p.R * 2.9 - h);
  c.save(); D.rr(bx, by, w, h, 12 * s); c.fillStyle = 'rgba(255,255,255,0.96)'; c.fill(); c.lineWidth = 2.5 * s; c.strokeStyle = OL; c.stroke();
  c.beginPath(); c.moveTo(Math.max(bx + 14 * s, Math.min(bx + w - 14 * s, p.x)) - 8 * s, by + h - 1); c.lineTo(Math.max(bx + 14 * s, Math.min(bx + w - 14 * s, p.x)), by + h + 10 * s); c.lineTo(Math.max(bx + 14 * s, Math.min(bx + w - 14 * s, p.x)) + 8 * s, by + h - 1); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.96)'; c.fillRect(Math.max(bx + 14 * s, Math.min(bx + w - 14 * s, p.x)) - 6 * s, by + h - 3 * s, 12 * s, 4 * s);
  F.lines.forEach(function (l, i) { D.text(l, bx + w / 2, by + 7 * s + lh * (i + 0.5), F.px, OL); });
  c.restore();
}
function tapHero(type) {
  REACT[type] = { t0: Z.time }; picked = { type: type, t: Z.time };
  var pp = POS[type]; if (pp && Z.menuBurst) Z.menuBurst(pp.x, pp.y - pp.R * 1.2, UI.api().S || 1);
  try { Z.AU.sfx('select', 0.5, { pitch: 1.2 }); } catch (e) { if (window.__rep) window.__rep(e); }
  if (Z.sub && Z.sub.t > 0.3) return;   // ещё говорит прошлая реплика
  var here = function (t) { var p = POS[t]; return p && p.f >= frameN - 2; };
  var duos = DUO.filter(function (d) { return d.need.indexOf(type) >= 0 && d.need.every(here); });
  try {
    if (duos.length && Math.random() < 0.45) { var d = duos[Math.floor(Math.random() * duos.length)]; d.need.forEach(function (t2) { if (t2 !== type) REACT[t2] = { t0: Z.time + 0.3 }; }); Z.sayLine(d.ids[0], 1, d.ids.slice(1)); }
    else { var L = (LINES[type] || []).filter(function (id) { return id !== lastLine; }); if (L.length) { lastLine = L[Math.floor(Math.random() * L.length)]; Z.sayLine(lastLine, 1); } }   // 2.12.20: не одну и ту же фразу дважды подряд
  } catch (e) { if (window.__rep) window.__rep(e); }
}
function giftIcon(x, y, r) { var c = D.ctx; D.rr(x - r, y - r * 0.5, r * 2, r * 1.5, r * 0.2); c.fillStyle = '#e8484f'; c.fill(); c.lineWidth = Math.max(1.5, r * 0.15); c.strokeStyle = OL; c.stroke(); c.fillStyle = '#ffd54a'; c.fillRect(x - r * 0.18, y - r * 0.5, r * 0.36, r * 1.5); D.rr(x - r * 1.15, y - r * 0.85, r * 2.3, r * 0.45, r * 0.15); c.fillStyle = '#ff6f7f'; c.fill(); c.stroke(); c.fillStyle = '#ffd54a'; c.fillRect(x - r * 0.18, y - r * 0.85, r * 0.36, r * 0.45); [-1, 1].forEach(function (d) { c.beginPath(); c.ellipse(x + d * r * 0.4, y - r * 1.05, r * 0.42, r * 0.22, d * 0.5, 0, 7); c.fillStyle = '#ffd54a'; c.fill(); c.stroke(); }); }
function iconBtn(a, id, x, y, w, h, c1, c2, label, icon, fn, dot) {
  a.button(id, x, y, w, h, { r: 14 * a.S, c1: c1, c2: c2, fn: fn, draw: function (bx, by, bw, bh) {
    icon(bx + bw / 2, by + bh * 0.42); D.text(label, bx + bw / 2, by + bh - 9 * a.S, Math.max(10, D.fitText(label, bw - 6 * a.S, 11 * a.S)), '#fff', 'center', 'middle', 2 * a.S);
    if (dot) { var c = D.ctx; c.fillStyle = '#ff5a5f'; c.beginPath(); c.arc(bx + bw - 6 * a.S, by + 6 * a.S, 7 * a.S, 0, 7); c.fill(); c.lineWidth = 2 * a.S; c.strokeStyle = OL; c.stroke(); D.text('!', bx + bw - 6 * a.S, by + 6.5 * a.S, 10 * a.S, '#fff'); } } });
}
var oFront = Z.menuFront;
Z.menuFront = function (W, H, s, t) {
  var r = oFront ? oFront.apply(this, arguments) : undefined;
  if (UI.modal) return r;
  frameN++;
  var a = UI.api(), c = D.ctx;
  // невидимые кнопки поверх героев: нажатие — реакция
  Object.keys(POS).forEach(function (type) {
    var p = POS[type]; if (p.f < frameN - 1) return;
    a.button('mh_' + type, p.x - p.R * 0.75, p.y - p.R * 2.5, p.R * 1.5, p.R * 2.5, { hidden: true, fn: function () { tapHero(type); } });
  });
  Object.keys(REACT).forEach(sparkle);
  bubble(s);
  // «Переодеть» у выбранного героя — маленький значок-плечики у ног, 3 секунды (пока звучит реплика — дольше), плавно исчезает
  if (picked && POS[picked.type] && POS[picked.type].f >= frameN - 1 && Z.ALLIES[picked.type]) {
    var age = Z.time - picked.t, talking = Z.sub && Z.sub.t > 0, life = talking ? Math.min(6, Math.max(3, age + 0.1)) : 3;
    if (age > life + 0.3) picked = null;
    else {
      var p = POS[picked.type], bs0 = 30 * s, side = p.x < W / 2 ? 1 : -1, bx = Math.max(4 * s, Math.min(W - bs0 - 4 * s, p.x + side * (p.R * 0.72 + bs0 * 0.55) - bs0 / 2)), by = p.y - bs0 * 0.9, pt = picked.type, al = Math.min(1, age * 6, (life + 0.3 - age) * 3.3);
      c.globalAlpha = al;
      a.button('mdress', bx, by, bs0, bs0, { r: bs0 / 2, c1: '#ff8fb1', c2: '#d45a80', fn: function () { picked = null; UI.openModal({ type: 'cos', tab: 'heroes', sel: pt }); },
        draw: function (x, y, w, h) { var cx = x + w / 2, cy = y + h / 2, q = w * 0.3; c.strokeStyle = '#fff'; c.lineWidth = 2.2 * s; c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath(); c.arc(cx, cy - q * 0.75, q * 0.28, Math.PI, Math.PI * 2.4); c.lineTo(cx, cy - q * 0.2); c.lineTo(cx - q, cy + q * 0.45); c.lineTo(cx + q, cy + q * 0.45); c.closePath(); c.stroke(); } });
      c.globalAlpha = 1;
    }
  }
  // кнопки слева: Магазин, Набор, Друзья
  var bs = 58 * s, bh2 = 62 * s, gap = 8 * s, i = 0, pos = function (k) { return [10 * s + (bs + gap) * k, 10 * s]; };   // 2.11.5: всегда одной строкой сверху — название уходит ниже, если не помещается
  var shopDot = Z.save && Z.save.meta && !Z.save.meta.cosSeen;
  iconBtn(a, 'mmShop', pos(i)[0], pos(i++)[1], bs, bh2, '#ffd54a', '#d79a1c', TT('Магазин', 'Shop'), function (x, y) { if (Z.bagIcon) Z.bagIcon(x, y, 13 * s); }, function () { UI.openModal({ type: 'cos', tab: 'heroes' }); }, shopDot);
  if (false) iconBtn(a, 'mmStarter', pos(i)[0], pos(i++)[1], bs, bh2, '#ff8fb1', '#d45a80', TT('Набор', 'Pack'), function (x, y) { giftIcon(x, y, 12 * s); }, function () { UI.openModal({ type: 'offer' }); });
  if (false) iconBtn(a, 'mmNoAds', pos(i)[0], pos(i++)[1], bs, bh2, '#ff8fb1', '#d45a80', TT('Без рекламы', 'No ads'), function (x, y) { Z.noAdIcon(x, y, 11 * s); }, function () { Z.openNoAds(); });   // 2.12.13б
  if (Z._vk && Z._vk()) iconBtn(a, 'mmFriends', pos(i)[0], pos(i++)[1], bs, bh2, '#4cc77d', '#2c9a5a', TT('Друзья', 'Friends'), function (x, y) { if (Z._heads) Z._heads(x, y, 12 * s); }, function () { UI.openModal({ type: 'social' }); });
  // подсказка один раз: героев можно трогать
  if (!(Z.save.meta && Z.save.meta.menuTapHint) && Object.keys(POS).length) {
    var ht = TT('Нажми на героя!', 'Tap a hero!'), hp = POS.moroz || POS[Object.keys(POS)[0]];
    if (hp) { var k = 0.6 + 0.4 * Math.sin(t * 4); c.globalAlpha = k; D.text('👆 ' + ht, hp.x, hp.y - hp.R * 2.7, 13 * s, '#ffd54a', 'center', 'middle', 3 * s); c.globalAlpha = 1; }
  }
  return r;
};
Z.menuIconsW = function (s) { var n = 1 + (Z._vk && Z._vk() ? 1 : 0); return 10 * s + n * 66 * s; };
var oTap = tapHero;
tapHero = function (type) { if (Z.save.meta) Z.save.meta.menuTapHint = 1; return oTap(type); };
})();
