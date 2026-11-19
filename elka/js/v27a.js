/* 2.7 · удержание и доход: вход через Яндекс, оценка, ярлык, новогодний календарь, «Наряди ёлку» (игрушки, верхушка,
   гирлянда, мишура), скины героев, магазин на покупках Яндекса, новые достижения, рейтинг и подарки на карте */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, OL = D.OL, COL = D.COL;
function TT(r, e) { return Z.LANG === 'en' ? e : r; }
function T(k) { return Z.T(k); }
function A() { return UI.api(); }
function now() { try { var y = Z.SDK.ysdk; if (y && y.serverTime) return y.serverTime(); } catch (e) { if (window.__rep) window.__rep(e); } return Date.now(); }

// ---------- сохранение: новые поля (старые сейвы получают значения по умолчанию) ----------
var DEF = {
  deco: { top: 'star', lights: 'multi', tinsel: 'white', toys: {}, hang: [], own: {} },
  cal: { n: 0, last: '' },
  skins: { own: {}, on: {} },
  shop: { noads: 0, starter: 0, heroes: 0, tok: {}, adFl: 0 },
  meta: { review: 0, shortcut: 0, loginAsk: 0, adGift: 0, wins: 0 }
};
for (var dk in DEF) if (Z.save[dk] === undefined) Z.save[dk] = JSON.parse(JSON.stringify(DEF[dk]));
function fix() { for (var k in DEF) { if (!Z.save[k] || typeof Z.save[k] !== 'object') Z.save[k] = {}; for (var q in DEF[k]) if (Z.save[k][q] === undefined) Z.save[k][q] = JSON.parse(JSON.stringify(DEF[k][q])); } }
Z.fixSave27 = fix;

// календарный день — по времени сервера Яндекса, чтобы перевод часов не давал лишних подарков
Z.todayStr = function () { var d = new Date(now()); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
Z.daysToNY = function () { var d = new Date(now()), ny = new Date(d.getFullYear() + 1, 0, 1), today = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return Math.round((ny - today) / 86400000); };

// =====================================================================================
// ИГРУШКИ НА ЁЛКУ
// =====================================================================================
var TOYS = [
  ['ball_r', 'Красный шар', 'Red bauble'], ['ball_b', 'Синий шар', 'Blue bauble'], ['ball_g', 'Золотой шар', 'Gold bauble'],
  ['icicle', 'Сосулька', 'Icicle'], ['cone', 'Шишка', 'Pine cone'], ['snowman', 'Снеговик', 'Snowman'], ['rocket', 'Ракета', 'Rocket'],
  ['corn', 'Кукуруза', 'Corn'], ['matr', 'Матрёшка', 'Matryoshka'], ['owl', 'Совушка', 'Owl'], ['samovar', 'Самовар', 'Samovar'],
  ['bullfinch', 'Снегирь', 'Bullfinch'], ['airship', 'Дирижабль', 'Airship'], ['clock', 'Часы без пяти двенадцать', 'Clock at five to twelve'],
  ['lantern', 'Фонарик', 'Lantern'], ['cosmo', 'Космонавт', 'Cosmonaut'], ['fish', 'Рыбка', 'Fish'], ['mushroom', 'Мухомор', 'Toadstool'],
  ['house', 'Избушка', 'Little hut'], ['bear', 'Мишка', 'Teddy'], ['heart', 'Сердечко', 'Heart'], ['squirrel', 'Белочка', 'Squirrel'],
  ['kolobok', 'Колобок', 'Kolobok'], ['penguin', 'Пингвин', 'Penguin'], ['bunny', 'Зайчик', 'Bunny'], ['fir', 'Ёлочка', 'Tiny fir'],
  ['moon', 'Месяц', 'Crescent'], ['pepper', 'Перчик', 'Pepper'], ['grapes', 'Виноград', 'Grapes'], ['parrot', 'Попугай', 'Parrot'],
  ['gold_nut', 'Золотой орешек', 'Golden nut'], ['gold_fish', 'Золотая рыбка', 'Goldfish'], ['gold_egg', 'Золотое яичко', 'Golden egg']
];
var TOY = {}; TOYS.forEach(function (q, i) { TOY[q[0]] = { id: q[0], ru: q[1], en: q[2], i: i }; });
var PREMIUM = { gold_nut: 1, gold_fish: 1, gold_egg: 1 };
var HMAX = 16;
Z.TOYS = TOYS;
Z.toyName = function (id) { var t = TOY[id]; return t ? (Z.LANG === 'en' ? t.en : t.ru) : id; };
Z.hasToy = function (id) { return !!Z.save.deco.toys[id]; };
Z.giveToy = function (id, quiet) {
  fix(); if (!TOY[id] || Z.save.deco.toys[id]) return false;
  Z.save.deco.toys[id] = 1;
  if (Z.save.deco.hang.length < HMAX) Z.save.deco.hang.push(id);
  if (!quiet) UI.toast(TT('Игрушка на ёлку: ', 'New ornament: ') + Z.toyName(id), '#9dff6a');
  Z.persist(true); return true;
};
// случайная ещё не найденная игрушка (кроме золотых из стартового набора)
Z.randomToy = function () { var l = TOYS.filter(function (q) { return !PREMIUM[q[0]] && !Z.save.deco.toys[q[0]] && !CAL_TOYS[q[0]]; }); if (!l.length) l = TOYS.filter(function (q) { return !PREMIUM[q[0]] && !Z.save.deco.toys[q[0]]; });
  // 2.11.4: где нет покупок (VK) золотые игрушки из набора не купить — они последними выпадают как обычные, все 33 достижимы
  if (!l.length && Z.platHas && !Z.platHas('pay')) l = TOYS.filter(function (q) { return !Z.save.deco.toys[q[0]]; }); return l.length ? l[Math.floor(Math.random() * l.length)][0] : null; };

function lw(r) { return Math.max(1, r * 0.16); }
// игрушка: x,y — центр, r — радиус
function drawToy(id, x, y, r, t) {
  var c = D.ctx, l = lw(r), C = D.circ, E = D.ell, P = D.poly; var AT = c.globalAlpha;
  var hi = function (dx, dy, k) { c.globalAlpha = AT * (0.55); E(x + dx * r, y + dy * r, r * (k || 0.22), r * (k || 0.22) * 0.7, '#fff'); c.globalAlpha = AT; };
  switch (id) {
    case 'ball_r': case 'ball_b': case 'ball_g': case 'gold_nut':
      var bc = { ball_r: '#e8484f', ball_b: '#3f8fe8', ball_g: '#ffc93a', gold_nut: '#f2b52b' }[id];
      C(x, y, r, bc, l); if (id !== 'gold_nut') { c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = r * 0.18; c.beginPath(); c.ellipse(x, y, r * 0.95, r * 0.32, 0, 0, Math.PI); c.stroke(); }
      else { c.strokeStyle = '#b07a12'; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x - r * 0.3, y, x, y + r); c.stroke(); }
      D.rr(x - r * 0.28, y - r * 1.25, r * 0.56, r * 0.32, r * 0.08); c.fillStyle = '#c9d0de'; c.fill(); c.lineWidth = l * 0.7; c.strokeStyle = OL; c.stroke(); hi(-0.35, -0.4); break;
    case 'icicle': P([x - r * 0.45, y - r, x + r * 0.45, y - r, x, y + r * 1.4], '#bfeaff', l); c.globalAlpha = AT * (0.6); P([x - r * 0.15, y - r * 0.8, x, y - r * 0.8, x - r * 0.05, y + r * 0.6], '#fff'); c.globalAlpha = AT; break;
    case 'cone': E(x, y, r * 0.62, r * 1.05, '#9a6a3a', l); for (var k = 0; k < 3; k++) { c.strokeStyle = '#6b4424'; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(x - r * 0.55, y - r * 0.5 + k * r * 0.5); c.lineTo(x, y - r * 0.2 + k * r * 0.5); c.lineTo(x + r * 0.55, y - r * 0.5 + k * r * 0.5); c.stroke(); } break;
    case 'snowman': C(x, y + r * 0.45, r * 0.62, '#fff', l); C(x, y - r * 0.35, r * 0.45, '#fff', l); D.rr(x - r * 0.3, y - r * 1.2, r * 0.6, r * 0.42, r * 0.06); c.fillStyle = '#e8484f'; c.fill(); c.lineWidth = l * 0.7; c.strokeStyle = OL; c.stroke(); P([x, y - r * 0.32, x + r * 0.35, y - r * 0.26, x, y - r * 0.2], '#ff8a3d'); break;
    case 'rocket': P([x - r * 0.45, y + r * 0.7, x - r * 0.75, y + r * 1.15, x - r * 0.3, y + r * 0.95], '#e8484f', l * 0.8); P([x + r * 0.45, y + r * 0.7, x + r * 0.75, y + r * 1.15, x + r * 0.3, y + r * 0.95], '#e8484f', l * 0.8); E(x, y, r * 0.5, r * 1.15, '#eef3fb', l); P([x - r * 0.35, y - r * 0.75, x, y - r * 1.35, x + r * 0.35, y - r * 0.75], '#e8484f', l * 0.8); C(x, y - r * 0.15, r * 0.24, '#5ac8ff', l * 0.7); break;
    case 'corn': E(x, y, r * 0.5, r * 1.1, '#ffd54a', l); for (var a = 0; a < 3; a++) for (var b = 0; b < 4; b++) C(x - r * 0.22 + a * r * 0.22, y - r * 0.6 + b * r * 0.38, r * 0.09, '#e0a13a'); P([x - r * 0.15, y + r * 1.1, x - r * 0.8, y - r * 0.2, x - r * 0.35, y + r * 0.2], '#4cc77d', l * 0.8); P([x + r * 0.15, y + r * 1.1, x + r * 0.8, y - r * 0.2, x + r * 0.35, y + r * 0.2], '#4cc77d', l * 0.8); break;
    case 'matr': E(x, y + r * 0.3, r * 0.72, r * 0.85, '#e8484f', l); C(x, y - r * 0.55, r * 0.55, '#e8484f', l); C(x, y - r * 0.5, r * 0.36, '#ffe1c4', l * 0.6); C(x - r * 0.12, y - r * 0.52, r * 0.05, OL); C(x + r * 0.12, y - r * 0.52, r * 0.05, OL); C(x, y + r * 0.35, r * 0.25, '#ffd54a', l * 0.6); break;
    case 'owl': E(x, y, r * 0.8, r, '#9a6a3a', l); C(x - r * 0.33, y - r * 0.3, r * 0.3, '#fff', l * 0.6); C(x + r * 0.33, y - r * 0.3, r * 0.3, '#fff', l * 0.6); C(x - r * 0.33, y - r * 0.3, r * 0.13, OL); C(x + r * 0.33, y - r * 0.3, r * 0.13, OL); P([x - r * 0.1, y - r * 0.05, x + r * 0.1, y - r * 0.05, x, y + r * 0.15], '#ffb84a'); break;
    case 'samovar': D.rr(x - r * 0.75, y - r * 0.55, r * 1.5, r * 1.2, r * 0.5); c.fillStyle = '#ffc93a'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke(); D.rr(x - r * 0.35, y - r * 1.05, r * 0.7, r * 0.5, r * 0.1); c.fill(); c.stroke(); D.rr(x - r * 0.5, y + r * 0.62, r, r * 0.3, r * 0.1); c.fill(); c.stroke(); P([x + r * 0.7, y, x + r * 1.15, y + r * 0.15, x + r * 0.7, y + r * 0.25], '#e0a13a', l * 0.6); hi(-0.35, -0.2); break;
    case 'bullfinch': C(x, y, r * 0.85, '#6a7394', l); E(x + r * 0.1, y + r * 0.25, r * 0.6, r * 0.5, '#ff5a4a'); C(x - r * 0.1, y - r * 0.55, r * 0.42, '#1b2448'); C(x + r * 0.12, y - r * 0.4, r * 0.08, '#fff'); P([x + r * 0.42, y - r * 0.4, x + r * 0.75, y - r * 0.3, x + r * 0.42, y - r * 0.2], OL); break;
    case 'airship': E(x, y, r * 1.2, r * 0.6, '#c9d6ea', l); c.strokeStyle = '#8a9ab8'; c.lineWidth = r * 0.1; c.beginPath(); c.moveTo(x - r * 1.1, y); c.lineTo(x + r * 1.1, y); c.stroke(); D.rr(x - r * 0.35, y + r * 0.62, r * 0.7, r * 0.3, r * 0.08); c.fillStyle = '#e8484f'; c.fill(); c.lineWidth = l * 0.7; c.strokeStyle = OL; c.stroke(); P([x - r * 1.1, y, x - r * 1.45, y - r * 0.45, x - r * 1.45, y + r * 0.45], '#e8484f', l * 0.6); break;
    case 'clock': C(x, y, r, '#fff6dc', l); c.strokeStyle = OL; c.lineWidth = r * 0.14; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - r * 0.12, y - r * 0.7); c.moveTo(x, y); c.lineTo(x - r * 0.05, y - r * 0.5); c.stroke(); for (var hh = 0; hh < 12; hh++) { var an = hh / 12 * Math.PI * 2; C(x + Math.sin(an) * r * 0.78, y - Math.cos(an) * r * 0.78, r * 0.06, OL); } D.rr(x - r * 0.2, y - r * 1.3, r * 0.4, r * 0.3, 2); c.fillStyle = '#ffd54a'; c.fill(); c.stroke(); break;
    case 'lantern': c.globalAlpha = AT * (0.35); C(x, y, r * 1.3, '#fff3b0'); c.globalAlpha = AT; P([x - r * 0.55, y - r * 0.8, x + r * 0.55, y - r * 0.8, x + r * 0.75, y, x + r * 0.55, y + r * 0.8, x - r * 0.55, y + r * 0.8, x - r * 0.75, y], '#ffcf5a', l); c.strokeStyle = '#e8484f'; c.lineWidth = r * 0.16; c.beginPath(); c.moveTo(x, y - r * 0.8); c.lineTo(x, y + r * 0.8); c.stroke(); break;
    case 'cosmo': E(x, y + r * 0.45, r * 0.6, r * 0.6, '#eef3fb', l); C(x, y - r * 0.3, r * 0.62, '#eef3fb', l); C(x, y - r * 0.3, r * 0.42, '#3a4f8a', l * 0.6); c.globalAlpha = AT * (0.6); C(x - r * 0.15, y - r * 0.42, r * 0.12, '#fff'); c.globalAlpha = AT; C(x, y + r * 0.45, r * 0.15, '#e8484f'); break;
    case 'fish': case 'gold_fish': var fc = id === 'fish' ? '#ff8a3d' : '#ffc93a'; P([x + r * 0.6, y, x + r * 1.2, y - r * 0.5, x + r * 1.2, y + r * 0.5], fc, l); E(x - r * 0.1, y, r * 0.85, r * 0.6, fc, l); C(x - r * 0.45, y - r * 0.1, r * 0.12, OL); if (id === 'gold_fish') hi(-0.2, -0.3, 0.3); break;
    case 'mushroom': D.rr(x - r * 0.25, y, r * 0.5, r * 0.9, r * 0.15); c.fillStyle = '#fff6dc'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke(); c.beginPath(); c.ellipse(x, y, r, r * 0.75, 0, Math.PI, 0); c.closePath(); c.fillStyle = '#e8484f'; c.fill(); c.stroke(); C(x - r * 0.4, y - r * 0.3, r * 0.14, '#fff'); C(x + r * 0.25, y - r * 0.5, r * 0.12, '#fff'); C(x + r * 0.5, y - r * 0.15, r * 0.1, '#fff'); break;
    case 'house': D.rr(x - r * 0.65, y - r * 0.2, r * 1.3, r, r * 0.05); c.fillStyle = '#c98a4a'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke(); P([x - r * 0.85, y - r * 0.15, x, y - r * 1.05, x + r * 0.85, y - r * 0.15], '#fff', l); D.rr(x - r * 0.2, y + r * 0.1, r * 0.4, r * 0.35, 2); c.fillStyle = '#ffe28a'; c.fill(); c.stroke(); break;
    case 'bear': C(x - r * 0.6, y - r * 0.6, r * 0.32, '#a0703f', l); C(x + r * 0.6, y - r * 0.6, r * 0.32, '#a0703f', l); C(x, y, r * 0.85, '#a0703f', l); E(x, y + r * 0.25, r * 0.38, r * 0.28, '#e8c79a'); C(x, y + r * 0.15, r * 0.1, OL); C(x - r * 0.3, y - r * 0.2, r * 0.09, OL); C(x + r * 0.3, y - r * 0.2, r * 0.09, OL); break;
    case 'heart': c.beginPath(); c.moveTo(x, y + r * 0.9); c.bezierCurveTo(x - r * 1.4, y, x - r * 0.7, y - r * 1.2, x, y - r * 0.45); c.bezierCurveTo(x + r * 0.7, y - r * 1.2, x + r * 1.4, y, x, y + r * 0.9); c.fillStyle = '#ff5a7a'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke(); hi(-0.4, -0.35); break;
    case 'squirrel': c.beginPath(); c.ellipse(x + r * 0.55, y - r * 0.2, r * 0.45, r * 0.95, 0.3, 0, Math.PI * 2); c.fillStyle = '#e8873a'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke(); E(x - r * 0.15, y + r * 0.25, r * 0.5, r * 0.6, '#e8873a', l); C(x - r * 0.2, y - r * 0.45, r * 0.4, '#e8873a', l); C(x - r * 0.3, y - r * 0.5, r * 0.08, OL); break;
    case 'kolobok': C(x, y, r * 0.95, '#ffcf5a', l); C(x - r * 0.3, y - r * 0.15, r * 0.1, OL); C(x + r * 0.3, y - r * 0.15, r * 0.1, OL); c.strokeStyle = OL; c.lineWidth = r * 0.12; c.beginPath(); c.arc(x, y + r * 0.1, r * 0.4, 0.2, Math.PI - 0.2); c.stroke(); break;
    case 'penguin': E(x, y, r * 0.75, r, '#2a3358', l); E(x, y + r * 0.15, r * 0.5, r * 0.7, '#fff'); C(x - r * 0.2, y - r * 0.45, r * 0.09, '#fff'); C(x + r * 0.2, y - r * 0.45, r * 0.09, '#fff'); P([x - r * 0.12, y - r * 0.28, x + r * 0.12, y - r * 0.28, x, y - r * 0.1], '#ffb84a'); break;
    case 'bunny': E(x - r * 0.3, y - r * 0.9, r * 0.2, r * 0.55, '#fff', l * 0.8); E(x + r * 0.3, y - r * 0.9, r * 0.2, r * 0.55, '#fff', l * 0.8); C(x, y, r * 0.8, '#fff', l); C(x - r * 0.28, y - r * 0.1, r * 0.09, OL); C(x + r * 0.28, y - r * 0.1, r * 0.09, OL); C(x, y + r * 0.15, r * 0.1, '#ff8fb1'); break;
    case 'fir': D.pine(x, y + r * 1.1, r * 2.3, '#2a8a5c', true); break;
    case 'moon': c.beginPath(); c.arc(x, y, r, 0.6, Math.PI * 2 - 0.6, true); c.arc(x + r * 0.45, y, r * 0.75, Math.PI * 2 - 1.0, 1.0, false); c.closePath(); c.fillStyle = '#ffe28a'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke(); break;
    case 'pepper': E(x, y + r * 0.15, r * 0.45, r * 1.0, '#e8484f', l); D.rr(x - r * 0.15, y - r * 1.15, r * 0.3, r * 0.4, 2); c.fillStyle = '#4cc77d'; c.fill(); c.stroke(); hi(-0.15, -0.3, 0.15); break;
    case 'grapes': for (var gy = 0; gy < 3; gy++) for (var gx = 0; gx < 3 - gy; gx++) C(x - (2 - gy) * r * 0.27 + gx * r * 0.54, y - r * 0.4 + gy * r * 0.5, r * 0.32, '#9a7ce8', l * 0.7); break;
    case 'parrot': E(x, y + r * 0.1, r * 0.6, r * 0.95, '#4cc77d', l); C(x, y - r * 0.55, r * 0.45, '#ffd54a', l); P([x + r * 0.35, y - r * 0.6, x + r * 0.75, y - r * 0.45, x + r * 0.35, y - r * 0.35], '#ff8a3d', l * 0.6); C(x + r * 0.1, y - r * 0.62, r * 0.08, OL); break;
    case 'gold_egg': E(x, y, r * 0.75, r, '#ffc93a', l); c.strokeStyle = '#e0a13a'; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(x - r * 0.7, y); c.lineTo(x - r * 0.3, y - r * 0.2); c.lineTo(x, y); c.lineTo(x + r * 0.3, y - r * 0.2); c.lineTo(x + r * 0.7, y); c.stroke(); hi(-0.3, -0.45); break;
    default: C(x, y, r, '#ccc', l);
  }
}
Z.drawToy = drawToy;

// ---------- верхушки, гирлянды, мишура ----------
var TOPS = [['star', 0, 'Звезда', 'Star'], ['snowflake', 'cal', 'Снежинка', 'Snowflake'], ['comet', 'cal', 'Комета', 'Comet'], ['crystal', 60, 'Кристалл', 'Crystal']];
var LIGHTS = {
  multi: [0, 'Разноцветная', 'Multicolor', ['#ff5a5f', '#ffd54a', '#5ac8ff', '#9dff6a', '#ff8fd6']],
  gold: ['cal', 'Золотая', 'Golden', ['#ffd54a', '#ffe28a', '#ffb84a']],
  blue: [30, 'Ледяная', 'Icy', ['#5ac8ff', '#bfeaff', '#8fa8ff']],
  candy: [80, 'Карамельная', 'Candy', ['#ff5a5f', '#ffffff']],
  rainbow: ['shop', 'Бегущая радуга', 'Running rainbow', null]
};
var LORDER = ['multi', 'gold', 'blue', 'candy', 'rainbow'];
var TINSEL = { white: [0, 'Белая', 'White', 'rgba(255,255,255,0.85)'], silver: [20, 'Серебряная', 'Silver', '#cfd8ea'], gold: ['cal', 'Золотая', 'Golden', '#ffd54a'], red: [45, 'Красная', 'Red', '#ff6f7f'] };
var TORDER = ['white', 'silver', 'gold', 'red'];
function ownDeco(kind, id, need) { if (typeof need === 'number') return Z.totalStars() >= need; return !!Z.save.deco.own[kind + '_' + id]; }
Z.ownDeco = ownDeco;
function topNeed(id) { for (var i = 0; i < TOPS.length; i++) if (TOPS[i][0] === id) return TOPS[i][1]; return 0; }

function drawTop(id, x, y, s, t, l) {
  var c = D.ctx; var AP = c.globalAlpha;
  if (id === 'snowflake') { c.save(); c.translate(x, y); c.rotate(t * 0.4); D.flake(0, 0, s * 1.15, OL, s * 0.42); D.flake(0, 0, s * 1.15, '#bfeaff', s * 0.22); c.restore(); }
  else if (id === 'comet') { c.globalAlpha = AP * (0.7); for (var k = 0; k < 4; k++) D.poly([x - s * 0.3, y - s * 0.2 + k * s * 0.15, x - s * (1.6 + k * 0.25), y + s * (0.5 + k * 0.35), x - s * 0.1, y + s * 0.3 + k * s * 0.1], ['#fff3b0', '#ffd54a', '#ff8fd6', '#5ac8ff'][k]); c.globalAlpha = AP; D.star(x, y, s, '#ffe28a', l); }
  else if (id === 'crystal') { D.poly([x, y - s * 1.3, x + s * 0.7, y - s * 0.2, x, y + s * 0.9, x - s * 0.7, y - s * 0.2], '#9fe8ff', l); c.globalAlpha = AP * (0.6); D.poly([x, y - s * 1.3, x + s * 0.2, y - s * 0.2, x, y + s * 0.9], '#fff'); c.globalAlpha = AP; }
  else D.star(x, y, s, COL.gold, l);
}

// ---------- ёлка: прежний рисунок + наряд игрока ----------
var SLOTS = [[0, -0.36, 0.13], [0, -0.12, 0.08], [0, 0.12, 0.12], [0, 0.34, 0.08], [0, 0.02, 0.2], [1, -0.3, 0.12], [1, -0.05, 0.08], [1, 0.22, 0.13], [1, 0.08, 0.2],
  [2, -0.22, 0.1], [2, 0.18, 0.1], [2, -0.02, 0.17], [3, -0.12, 0.08], [3, 0.14, 0.1], [0, -0.22, 0.24], [1, 0.32, 0.06]];
// 2.11.5: вид ёлки — новая модель целиком; ярусы на тех же местах, поэтому огоньки, мишура, игрушки и верхушка крепятся как прежде
var TKIND = [['base', 0, 'Лесная', 'Forest'], ['ice', 60, 'Ледяная', 'Icy'], ['candy', 60, 'Пряничная', 'Gingerbread'], ['gold', 80, 'Золотая', 'Golden'], ['night', 80, 'Ночная', 'Night']];
var TKM = {}; TKIND.forEach(function (q) { TKM[q[0]] = { id: q[0], cost: q[1], ru: q[2], en: q[3] }; });
Z.TKIND = TKIND;
function treeKind(dc) { var k = dc && dc.kind; return k && TKM[k] && (k === 'base' || (Z.save.deco.own && Z.save.deco.own['kind_' + k]) || dc.preview) ? k : 'base'; }
function tierPath(ctx, x, yy, tw, h) { ctx.beginPath(); ctx.moveTo(x - tw / 2, yy); ctx.lineTo(x, yy - h * 0.34); ctx.lineTo(x + tw / 2, yy); ctx.closePath(); }

// 2.11.5: лесная ёлка — лапник: ярус с рваным краем из веточек, объём (свет слева-сверху), хвоинки, тень от яруса выше, снег на лапах
function basePath(ctx, x, yy, tw, h, i) {
  var top = yy - h * 0.34, n = 7 - i, hw = tw / 2;
  ctx.beginPath(); ctx.moveTo(x, top);
  ctx.quadraticCurveTo(x + hw * 0.45, top + h * 0.15, x + hw * 1.02, yy - h * 0.01);
  for (var k = 0; k < n; k++) { var x0 = x + hw - tw * k / n, x1 = x + hw - tw * (k + 1) / n, xm = (x0 + x1) / 2, dip = h * (0.035 + ((k + i) % 2) * 0.012);
    ctx.quadraticCurveTo(x0 - (x0 - x1) * 0.15, yy + dip, xm, yy + dip * 0.55); ctx.quadraticCurveTo(x1 + (x0 - x1) * 0.2, yy - dip * 0.2, x1, yy - h * 0.006); }
  ctx.quadraticCurveTo(x - hw * 0.45, top + h * 0.15, x, top); ctx.closePath();
}
function baseTier(ctx, x, yy, tw, h, i, l, t) {
  var top = yy - h * 0.34, n = 7 - i, hw = tw / 2;
  basePath(ctx, x, yy, tw, h, i);
  var g = ctx.createLinearGradient(x - hw, top, x + hw * 0.8, yy + h * 0.04); g.addColorStop(0, '#4fc07c'); g.addColorStop(0.45, i % 2 ? '#2e9c5e' : '#289257'); g.addColorStop(1, '#17603d');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); basePath(ctx, x, yy, tw, h, i); ctx.clip();
  // тень под ярусом выше
  if (i < 3) { var sg = ctx.createLinearGradient(0, yy - h * 0.2, 0, yy - h * 0.1); sg.addColorStop(0, 'rgba(8,40,24,0.42)'); sg.addColorStop(1, 'rgba(8,40,24,0)'); ctx.fillStyle = sg; ctx.fillRect(x - hw, yy - h * 0.2, tw, h * 0.1); }
  // хвоинки — веером от ствола к краям
  ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, h * 0.006);
  for (var r = 0; r < 3; r++) for (var k = 0; k <= 10; k++) {
    var u = (k / 10 - 0.5) * 2, ry = yy - h * (0.05 + r * 0.085), sx = x + u * hw * (0.25 + r * -0.06 + 0.7) * (1 - r * 0.22), len = h * 0.04;
    ctx.strokeStyle = (k + r) % 3 ? 'rgba(130,220,160,0.35)' : 'rgba(10,50,30,0.35)';
    ctx.beginPath(); ctx.moveTo(sx - u * len * 0.3, ry - len); ctx.lineTo(sx + u * len * 0.5, ry); ctx.stroke(); }
  // блик слева
  ctx.globalAlpha = 0.18; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - h * 0.01, top + h * 0.04); ctx.quadraticCurveTo(x - hw * 0.35, top + h * 0.17, x - hw * 0.7, yy - h * 0.03); ctx.lineTo(x - hw * 0.55, yy - h * 0.03); ctx.quadraticCurveTo(x - hw * 0.2, top + h * 0.18, x - h * 0.01, top + h * 0.04); ctx.fill(); ctx.globalAlpha = 1;
  ctx.restore();
  basePath(ctx, x, yy, tw, h, i); ctx.lineWidth = l * 0.85; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke();
  // снег на лапах — шапками на кончиках
  ctx.save(); basePath(ctx, x, yy, tw, h, i); ctx.clip();   // 2.11.5: снег лежит на лапах — внутри силуэта, не торчит
  for (var q = 1; q < n - 1; q++) { if ((q + i) % 2) continue; var cx = x + hw - tw * (q + 0.5) / n, cy = yy + h * 0.004; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(cx, cy, tw / n * 0.36, h * 0.02, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = 'rgba(190,210,240,0.7)'; ctx.beginPath(); ctx.ellipse(cx + tw / n * 0.08, cy - h * 0.004, tw / n * 0.2, h * 0.005, 0, 0, 7); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, top + h * 0.03, h * 0.035, h * 0.02, 0, 0, 7); ctx.fill();
}
// мишура: пушистая гирлянда — основа, бахрома и бегущие блики
function tinselSwag(ctx, ax, ay, bx, by, sag, col, h, t, seed) {
  var mx = (ax + bx) / 2, my = (ay + by) / 2 + sag;
  function P(u) { var v = 1 - u; return [v * v * ax + 2 * v * u * mx + u * u * bx, v * v * ay + 2 * v * u * my + u * u * by]; }
  ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(27,36,72,0.5)'; ctx.lineWidth = h * 0.03; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, my, bx, by); ctx.stroke();
  ctx.strokeStyle = col; ctx.lineWidth = h * 0.022; ctx.stroke();
  ctx.lineWidth = Math.max(1, h * 0.006);
  for (var k = 0; k <= 22; k++) { var u = k / 22, p = P(u), a = k * 2.4 + seed, r = h * 0.017;
    ctx.strokeStyle = k % 2 ? 'rgba(255,255,255,0.75)' : col; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r); ctx.stroke(); }
  for (var gl = 0; gl < 2; gl++) { var uu = (t * 0.35 + gl * 0.5 + seed * 0.13) % 1, pp = P(uu), k2 = Math.sin(uu * Math.PI); ctx.globalAlpha = 0.9 * k2; D.star(pp[0], pp[1], h * 0.022, '#ffffff', 0); ctx.globalAlpha = 1; }
}
// шар-игрушка по умолчанию: блик, колпачок
function ballToy(ctx, x, y, r, col, t, s) {
  // 2.12: шар с колпачком — готовой картинкой (под поворотом), живьём только мерцание блика
  if (Z.rotSprite && Z._treeLayer === 'live' && ctx === D.ctx && Z.rotSprite('ball|' + col + '|' + Math.round(r * 4), x, y, r * 2.6, r * 2.8, r * 1.3, r * 1.5, function () { ballBody(D.ctx, x, y, r, col); })) {
    var tw0 = (Math.sin(t * 2.2 + s * 1.7) + 1) / 2, A1 = ctx.globalAlpha; ctx.globalAlpha = A1 * (0.4 + 0.6 * tw0); D.circ(x - r * 0.35, y - r * 0.35, r * 0.18, '#ffffff'); ctx.globalAlpha = A1; return;
  }
  ballBody(ctx, x, y, r, col);
  var tw = (Math.sin(t * 2.2 + s * 1.7) + 1) / 2, A2 = ctx.globalAlpha; ctx.globalAlpha = A2 * (0.4 + 0.6 * tw); D.circ(x - r * 0.35, y - r * 0.35, r * 0.18, '#ffffff'); ctx.globalAlpha = A2;
}
function ballBody(ctx, x, y, r, col) {
  var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, col); g.addColorStop(1, D.shade ? D.shade(col, -45) : col);
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(1, r * 0.18); ctx.strokeStyle = OL; ctx.stroke();
  D.rr(x - r * 0.3, y - r * 1.25, r * 0.6, r * 0.32, r * 0.08); ctx.fillStyle = '#d9b44a'; ctx.fill(); ctx.stroke();
}
var BALLC = ['#e8343c', '#ffd54a', '#3f8fe0', '#c94ad8', '#ffffff', '#3fbf7f'];
function drawTier(kind, ctx, x, yy, tw, h, i, l, t) {
  if (kind === 'base') { baseTier(ctx, x, yy, tw, h, i, l, t); return; }
  // 2.11.5: остальные виды — тот же «лапник» (рваный край из веточек, тень под ярусом выше, блик), но свой материал
  var top = yy - h * 0.34, n = 7 - i, hw = tw / 2, g, k;
  var shade = function (col) { if (i < 3) { var sg = ctx.createLinearGradient(0, yy - h * 0.2, 0, yy - h * 0.1); sg.addColorStop(0, col); sg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sg; ctx.fillRect(x - hw, yy - h * 0.2, tw, h * 0.1); } };
  var sheen = function (a) { ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - h * 0.01, top + h * 0.04); ctx.quadraticCurveTo(x - hw * 0.35, top + h * 0.17, x - hw * 0.7, yy - h * 0.03); ctx.lineTo(x - hw * 0.55, yy - h * 0.03); ctx.quadraticCurveTo(x - hw * 0.2, top + h * 0.18, x - h * 0.01, top + h * 0.04); ctx.fill(); ctx.globalAlpha = 1; };
  var tipX = function (q) { return x + hw - tw * (q + 0.5) / n; };
  if (kind === 'ice') {   // ледяная: прозрачный лёд с гранями и инеем, сосульки с кончиков лап, искры
    basePath(ctx, x, yy, tw, h, i); g = ctx.createLinearGradient(x - hw, top, x + hw * 0.6, yy); g.addColorStop(0, '#f6feff'); g.addColorStop(0.5, i % 2 ? '#b9e8fb' : '#a6def8'); g.addColorStop(1, '#6fbfe6'); ctx.fillStyle = g; ctx.fill();
    ctx.save(); basePath(ctx, x, yy, tw, h, i); ctx.clip(); shade('rgba(40,110,170,0.35)');
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(1, l * 0.5); ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x - tw * 0.18, yy); ctx.moveTo(x, top); ctx.lineTo(x + tw * 0.26, yy); ctx.moveTo(x - tw * 0.35, yy - h * 0.06); ctx.lineTo(x + tw * 0.05, yy - h * 0.2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = Math.max(1, h * 0.005); for (k = 0; k < 9; k++) { var fx = x - hw * 0.7 + k * hw * 0.18, fy = yy - h * (0.05 + (k % 3) * 0.06); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx - h * 0.018, fy - h * 0.022); ctx.moveTo(fx, fy); ctx.lineTo(fx + h * 0.018, fy - h * 0.022); ctx.stroke(); }
    sheen(0.35); ctx.restore();
    basePath(ctx, x, yy, tw, h, i); ctx.lineWidth = l * 0.85; ctx.strokeStyle = '#2f6f9e'; ctx.lineJoin = 'round'; ctx.stroke();
    for (k = 1; k < n - 1; k++) { if ((k + i) % 3 === 2) continue; var ix = tipX(k) + tw / n * 0.12, len = h * (0.018 + ((k + i) % 3) * 0.009), iy = yy + h * 0.022; var ig = ctx.createLinearGradient(0, iy - h * 0.01, 0, iy + len); ig.addColorStop(0, 'rgba(235,250,255,0.95)'); ig.addColorStop(1, 'rgba(170,225,250,0.6)'); ctx.beginPath(); ctx.moveTo(ix - h * 0.007, iy - h * 0.008); ctx.quadraticCurveTo(ix - h * 0.003, iy + len * 0.5, ix, iy + len); ctx.quadraticCurveTo(ix + h * 0.003, iy + len * 0.5, ix + h * 0.007, iy - h * 0.008); ctx.closePath(); ctx.fillStyle = ig; ctx.fill(); ctx.lineWidth = Math.max(0.6, l * 0.22); ctx.strokeStyle = 'rgba(47,111,158,0.7)'; ctx.stroke(); }   // 2.11.5: сосульки тонкие, с внутренних лап
    for (k = 0; k < 3; k++) { var sp = (Math.sin(t * 2.4 + k * 2.1 + i * 1.3) + 1) / 2; if (sp < 0.6) continue; ctx.globalAlpha = (sp - 0.6) * 2.5; D.star(x - hw * 0.5 + k * hw * 0.5, yy - h * (0.08 + k % 2 * 0.1), h * 0.018, '#ffffff', 0); ctx.globalAlpha = 1; }
    return;
  }
  if (kind === 'candy') {   // карамельная: полоски леденца, глазурь каплями по краю, посыпка
    basePath(ctx, x, yy, tw, h, i); ctx.fillStyle = '#fff6f0'; ctx.fill();
    ctx.save(); basePath(ctx, x, yy, tw, h, i); ctx.clip(); ctx.strokeStyle = i % 2 ? '#e8343c' : '#3fbf7f'; ctx.lineWidth = h * 0.045;
    for (k = -6; k < 9; k++) { ctx.beginPath(); ctx.moveTo(x - hw + k * h * 0.09, yy + h * 0.04); ctx.lineTo(x - hw + k * h * 0.09 + h * 0.38, yy - h * 0.38); ctx.stroke(); }
    shade('rgba(120,20,40,0.28)'); sheen(0.35); ctx.restore();
    basePath(ctx, x, yy, tw, h, i); ctx.lineWidth = l * 0.85; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.save(); basePath(ctx, x, yy, tw, h, i); ctx.clip(); for (k = 1; k < n - 1; k++) { var gx = tipX(k), gy = yy + h * 0.006; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(gx, gy, tw / n * 0.38, h * 0.02, 0, Math.PI, 0); ctx.fill(); if ((k + i) % 2 === 0) { ctx.beginPath(); ctx.ellipse(gx + tw / n * 0.1, gy + h * 0.004, h * 0.007, h * 0.016, 0, 0, 7); ctx.fill(); } } ctx.restore();
    var spc = ['#ffd54a', '#5ac8ff', '#ff8fd6', '#9dff6a']; for (k = 0; k < 7; k++) { var sx = x - hw * 0.6 + ((k * 37 + i * 13) % 100) / 100 * hw * 1.2, sy = yy - h * (0.04 + ((k * 53 + i * 7) % 100) / 100 * 0.2); ctx.save(); ctx.translate(sx, sy); ctx.rotate(k); D.rr(-h * 0.009, -h * 0.003, h * 0.018, h * 0.006, h * 0.003); ctx.fillStyle = spc[k % 4]; ctx.fill(); ctx.restore(); }
    return;
  }
  if (kind === 'gold') {   // золотая: металл с завитками, бусины на кончиках, по ёлке пробегает блеск
    basePath(ctx, x, yy, tw, h, i); g = ctx.createLinearGradient(x - hw, 0, x + hw, 0); g.addColorStop(0, '#fff1a8'); g.addColorStop(0.5, i % 2 ? '#ffd54a' : '#f4c33a'); g.addColorStop(1, '#c98a1c'); ctx.fillStyle = g; ctx.fill();
    ctx.save(); basePath(ctx, x, yy, tw, h, i); ctx.clip(); shade('rgba(120,70,10,0.4)');
    ctx.strokeStyle = 'rgba(140,90,20,0.55)'; ctx.lineWidth = Math.max(1, l * 0.45);
    for (k = 0; k < 3; k++) { var cx = x - tw * 0.25 + k * tw * 0.25, cy = yy - h * 0.08; ctx.beginPath(); ctx.arc(cx, cy, h * 0.035, 0, Math.PI * 1.6); ctx.stroke(); ctx.beginPath(); ctx.arc(cx + h * 0.045, cy - h * 0.055, h * 0.022, Math.PI, Math.PI * 2.6); ctx.stroke(); }
    var sw = ((t * 0.35 + i * 0.12) % 1.6 - 0.3) * tw * 1.6, sg2 = ctx.createLinearGradient(x - hw + sw - h * 0.1, 0, x - hw + sw + h * 0.1, 0); sg2.addColorStop(0, 'rgba(255,255,255,0)'); sg2.addColorStop(0.5, 'rgba(255,255,255,0.6)'); sg2.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg2; ctx.fillRect(x - hw, top, tw, h * 0.4);
    sheen(0.25); ctx.restore();
    basePath(ctx, x, yy, tw, h, i); ctx.lineWidth = l * 0.85; ctx.strokeStyle = '#6a4210'; ctx.lineJoin = 'round'; ctx.stroke();
    for (k = 1; k < n - 1; k++) D.circ(tipX(k), yy + h * 0.016, h * 0.009, '#fff1a8', Math.max(0.8, l * 0.3));
    return;
  }
  if (kind === 'night') {   // ночная: тёмно-синяя хвоя со светящейся каймой, внутри мерцают звёзды, на кончиках — светлячки
    basePath(ctx, x, yy, tw, h, i); g = ctx.createLinearGradient(0, top, 0, yy); g.addColorStop(0, '#3a3f9a'); g.addColorStop(1, i % 2 ? '#1b2160' : '#232a74'); ctx.fillStyle = g; ctx.fill();
    ctx.save(); basePath(ctx, x, yy, tw, h, i); ctx.clip(); shade('rgba(5,8,30,0.5)');
    for (k = 0; k < 7; k++) { var nx = x - tw * 0.4 + ((k * 37 + i * 11) % 100) / 100 * tw * 0.8, ny = yy - h * (0.04 + ((k * 53 + i * 7) % 100) / 100 * 0.24), kk = (Math.sin(t * 2.5 + k + i) + 1) / 2; ctx.globalAlpha = 0.3 + 0.7 * kk; D.star(nx, ny, h * (0.008 + 0.009 * kk), '#fff3b0', 0); }
    ctx.globalAlpha = 1; sheen(0.12); ctx.restore();
    basePath(ctx, x, yy, tw, h, i); ctx.lineJoin = 'round'; ctx.lineWidth = l * 2.4; ctx.strokeStyle = 'rgba(127,216,255,0.3)'; ctx.stroke(); ctx.lineWidth = l * 0.85; ctx.strokeStyle = '#9fe8ff'; ctx.stroke();
    for (k = 1; k < n - 1; k++) { var fl = (Math.sin(t * 3 + k * 1.7 + i) + 1) / 2; ctx.globalAlpha = 0.25 * fl; D.circ(tipX(k), yy + h * 0.018, h * 0.02, '#b8fff0'); ctx.globalAlpha = 0.6 + 0.4 * fl; D.circ(tipX(k), yy + h * 0.018, h * 0.006, '#e8fff8'); ctx.globalAlpha = 1; }
  }
}
function treeGlow(kind) { return kind === 'ice' ? '170,230,255' : kind === 'candy' ? '255,170,200' : kind === 'gold' ? '255,215,110' : kind === 'night' ? '160,140,255' : '255,230,150'; }
var TOL = { ice: '#2f6f9e', gold: '#6a4210', night: '#9fe8ff' };
// 2.11.5: ствол — сужается кверху, корни расходятся в снег, кора с бороздами, тень от нижнего яруса
function treeTrunk(kind, ctx, x, y, h, l) {
  var top = y - h * 0.13, wB = h * 0.07, wT = h * 0.042;
  var C0 = { base: ['#9a6a40', '#5a3a20'], ice: ['#d6f2ff', '#7fbfe0'], night: ['#4a4290', '#221d4a'], gold: ['#b8783a', '#6a3e18'], candy: ['#ffffff', '#f0d6d6'] }[kind] || ['#9a6a40', '#5a3a20'];
  var path = function () { ctx.beginPath(); ctx.moveTo(x - wT, top); ctx.lineTo(x + wT, top); ctx.quadraticCurveTo(x + wT * 1.05, y - h * 0.04, x + wB * 1.35, y + h * 0.005); ctx.quadraticCurveTo(x + wB * 0.6, y - h * 0.012, x + wB * 0.2, y + h * 0.006); ctx.quadraticCurveTo(x - wB * 0.3, y - h * 0.014, x - wB * 0.75, y + h * 0.004); ctx.quadraticCurveTo(x - wB * 1.1, y - h * 0.008, x - wB * 1.4, y + h * 0.006); ctx.quadraticCurveTo(x - wT * 1.05, y - h * 0.04, x - wT, top); ctx.closePath(); };
  path(); var g = ctx.createLinearGradient(x - wB, 0, x + wB, 0); g.addColorStop(0, C0[0]); g.addColorStop(1, C0[1]); ctx.fillStyle = g; ctx.fill();
  ctx.save(); path(); ctx.clip();
  if (kind === 'candy') { ctx.strokeStyle = '#e8343c'; ctx.lineWidth = h * 0.022; for (var q = -3; q < 5; q++) { ctx.beginPath(); ctx.moveTo(x - wB * 1.5, top + q * h * 0.04); ctx.lineTo(x + wB * 1.5, top + q * h * 0.04 + h * 0.06); ctx.stroke(); } }
  else { ctx.strokeStyle = kind === 'ice' ? 'rgba(255,255,255,0.7)' : kind === 'night' ? 'rgba(160,150,255,0.45)' : 'rgba(40,20,8,0.45)'; ctx.lineWidth = Math.max(1, h * 0.005); ctx.lineCap = 'round';
    [[-0.55, 0.1, 0.9], [-0.15, 0.3, 0.7], [0.25, 0.05, 0.8], [0.6, 0.35, 0.6]].forEach(function (b) { var bx = x + b[0] * wT, by = top + h * 0.13 * b[1]; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + h * 0.004, by + h * 0.13 * b[2] * 0.5, bx - h * 0.002 + b[0] * h * 0.012, by + h * 0.13 * b[2]); ctx.stroke(); });
    if (kind === 'base') { ctx.fillStyle = 'rgba(40,20,8,0.5)'; ctx.beginPath(); ctx.ellipse(x + wT * 0.25, top + h * 0.06, h * 0.008, h * 0.012, 0, 0, 7); ctx.fill(); } }
  if (kind === 'gold') { ctx.fillStyle = '#ffd54a'; ctx.fillRect(x - wB * 2, top + h * 0.05, wB * 4, h * 0.014); }
  var sg = ctx.createLinearGradient(0, top, 0, top + h * 0.05); sg.addColorStop(0, 'rgba(10,20,15,0.55)'); sg.addColorStop(1, 'rgba(10,20,15,0)'); ctx.fillStyle = sg; ctx.fillRect(x - wB * 2, top, wB * 4, h * 0.05);
  ctx.restore();
  path(); ctx.lineWidth = Math.max(1.2, l * 0.7); ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke();
}
D.bigTree = function (x, y, h, t, o) {
  if (!(h > 4)) return;   // 2.11.5: в слишком низкой кнопке ёлку не рисуем (раньше отрицательный размер ронял всю вкладку)
  var ctx = D.ctx; o = o || {}; var l = Math.max(1.5, h * 0.025), w = h * 0.72, A0 = ctx.globalAlpha;   // 2.12: прозрачность крепости (враги у стен) сохраняется — все alpha внутри относительно A0
  var dc = o.deco ? (o.preview || Z.save.deco || {}) : null, kind = o.kind || (dc ? treeKind(dc) : 'base'), gc = treeGlow(kind);
  // 2.11.5: события (только у ёлки в крепости): удар, конец волны, победа, частицы — снег с лап и упавшие игрушки
  var EV = o.ev || null, ST = EV ? (EV._tree = EV._tree || { p: [], lost: o.lost || 0, snowT: 3 }) : null, dt = Math.min(0.05, Z.frameDt || 0.016);
  var hitK = o.hit > 0 ? Math.min(1, o.hit * 3) : 0, cel = o.cel != null && o.cel < 2.5 ? o.cel : -1, win = !!o.win;
  // 2.11.9: слои для крепости — 'base' (сама ёлка, огоньки погашены; готовая картинка) и 'live' (только то, что движется: огоньки, игрушки, звезда, частицы; каждый кадр)
  var LB = o.layer === 'base', LV = o.layer === 'live'; if (LB) ST = null;
  var glow = ctx.createRadialGradient(x, y - h * 0.45, h * 0.05, x, y - h * 0.45, h * 0.75);
  glow.addColorStop(0, 'rgba(' + gc + ',' + (o.dim ? 0.12 : cel >= 0 || win ? 0.65 : 0.45) + ')'); glow.addColorStop(1, 'rgba(' + gc + ',0)');
  if (!o.noGlow && !LV) { ctx.fillStyle = glow; ctx.fillRect(x - h, y - h * 1.3, h * 2, h * 1.6); }
  if (ST) {
    if ((o.lost || 0) > ST.lost) { for (var fb = 0; fb < (o.lost - ST.lost); fb++) ST.p.push({ k: 'ball', x: (Math.random() - 0.5) * 0.4, y: -0.3 - Math.random() * 0.3, vx: (Math.random() - 0.5) * 0.5, vy: -0.3, c: BALLC[Math.floor(Math.random() * BALLC.length)], life: 2.5 }); }
    ST.lost = o.lost || 0;
    ST.snowT -= dt; if (ST.snowT <= 0 || (hitK > 0.9 && !ST.hitDone)) { var nn = hitK > 0.9 ? 10 : 3; for (var sn = 0; sn < nn; sn++) ST.p.push({ k: 'snow', x: (Math.random() - 0.5) * 0.5, y: -0.15 - Math.random() * 0.55, vx: (Math.random() - 0.5) * 0.08, vy: 0.05, life: 1.6 }); ST.snowT = 4 + Math.random() * 5; ST.hitDone = hitK > 0.9; }
    if (hitK < 0.5) ST.hitDone = false;
  }
  // покачивание от ветра: макушка ходит, ствол стоит
  var sway = o.layer ? 0 : Math.sin(t * 0.9) * 0.012 + Math.sin(t * 2.3 + 1) * 0.005 + (hitK ? Math.sin(t * 50) * 0.03 * hitK : 0);
  ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -sway, 1, 0, 0); ctx.translate(-x, -y);
  // сияние звезды — позади ёлки
  if (o.star !== false && !LV) { var sy0 = y - h * 0.1 - 3 * h * 0.2 - h * 0.36, pl0 = cel >= 0 ? 1 + Math.max(0, 1 - cel) * 0.35 : 1; ctx.save(); ctx.translate(x, sy0); ctx.rotate(t * 0.25);
    for (var r0 = 0; r0 < 8; r0++) { ctx.rotate(Math.PI / 4); ctx.globalAlpha = A0 * (0.22 + 0.16 * Math.sin(t * 3 + r0)) * (o.dim ? 0.45 : 1) * pl0; D.poly([0, 0, -h * 0.022, -h * 0.22 * pl0, h * 0.022, -h * 0.22 * pl0], '#fff3b0'); }
    ctx.restore(); ctx.globalAlpha = A0; }
  if (!LV) treeTrunk(kind, ctx, x, y, h, l);
  if (!LV) { ctx.fillStyle = kind === 'night' ? '#dfe6ff' : kind === 'ice' ? '#f2fbff' : '#ffffff'; ctx.beginPath(); ctx.moveTo(x - h * 0.15, y + h * 0.012); ctx.quadraticCurveTo(x - h * 0.08, y - h * 0.022, x - h * 0.02, y - h * 0.008); ctx.quadraticCurveTo(x + h * Math.min(0.07, (o && o.moundR || 0.15) * 0.5), y - h * 0.026, x + h * (o && o.moundR || 0.15), y + h * 0.012); ctx.closePath(); ctx.fill(); ctx.lineWidth = Math.max(1, l * 0.4); ctx.strokeStyle = 'rgba(120,140,190,0.35)'; ctx.stroke(); }   // ствол стоит в сугробе
  var lk = dc && LIGHTS[dc.lights] ? dc.lights : 'multi', cols = LIGHTS[lk][3], tins = dc && TINSEL[dc.tinsel] ? TINSEL[dc.tinsel][3] : (kind === 'base' ? '#dfe7f5' : TINSEL.white[3]);
  var lightsOff = hitK > 0.6;
  for (var i = 0; i < 4; i++) {
    var yy = y - h * 0.1 - i * h * 0.2, tw = w * (1 - i * 0.2);
    if (!LV) drawTier(kind, ctx, x, yy, tw, h, i, l, t);
    // мишура — диагональной провисающей гирляндой, ярус за ярусом в разные стороны (выглядит как спираль)
    // 2.11.5: мишура и гирлянда доходят до самого края яруса и обрезаются по нему — будто оборачивают ёлку и уходят назад
    var tTop = yy - h * 0.34, halfAt = function (yq) { return tw / 2 * Math.max(0, Math.min(1, (yq - tTop) / (yy - tTop))) * 1.15; };
    ctx.save(); if (!LV) { basePath(ctx, x, yy, tw, h, i); ctx.clip(); }   // 2.12: живой слой — без обрезки по ярусу (там только огоньки)
    var dir = i % 2 ? -1 : 1, ay = yy - h * 0.15, by = yy - h * 0.04, ax = x - dir * halfAt(ay), bx = x + dir * halfAt(by);
    if (!LV) tinselSwag(ctx, ax, ay, bx, by, h * 0.035, tins, h, t, i * 3 + 1);
    // огоньки — на проводе в обратную сторону, мигают волной снизу вверх
    var ly0 = yy - h * 0.12, ly1 = yy - h * 0.035, lx0 = x + dir * halfAt(ly0), lx1 = x - dir * halfAt(ly1), lmx = (lx0 + lx1) / 2, lmy = (ly0 + ly1) / 2 + h * 0.03;
    if (!LV) { ctx.strokeStyle = 'rgba(27,36,72,0.7)'; ctx.lineWidth = Math.max(1, h * 0.005); ctx.beginPath(); ctx.moveTo(lx0, ly0); ctx.quadraticCurveTo(lmx, lmy, lx1, ly1); ctx.stroke(); }
    var n = 6 - i; for (var k = 0; k < n; k++) {
      if (o.lost && (k * 7 + i * 3) % 6 < o.lost) continue;
      var f = (k + 0.5) / n, vv = 1 - f, px = vv * vv * lx0 + 2 * vv * f * lmx + f * f * lx1, py = vv * vv * ly0 + 2 * vv * f * lmy + f * f * ly1 + h * 0.012, gidx = i * 6 + k;
      var cc = cols ? cols[(k + i) % cols.length] : 'hsl(' + Math.round((t * 120 + gidx * 40) % 360) + ',95%,62%)';
      var on = lightsOff || LB ? false : o.dim ? Math.sin(t * 9 + k) > 0.6 && Math.sin(t * 2.3 + i) > -0.2 : cel >= 0 || win ? Math.sin(t * 14 - gidx * 0.9) > -0.6 : lk === 'rainbow' ? true : Math.sin(t * 3 - gidx * 0.55) > -0.35;
      if (LV && !on) continue;
      if (LV && Z.treeLight && Z.treeLight(px, py, h, cc, cel >= 0 || win)) continue;   // 2.12: горящий огонёк — готовой картинкой
      if (on) { ctx.globalAlpha = A0 * (cel >= 0 || win ? 0.55 : 0.35); D.circ(px, py, h * 0.032, cc); ctx.globalAlpha = A0; }
      if (!LV) { D.rr(px - h * 0.006, py - h * 0.02, h * 0.012, h * 0.01, 1); ctx.fillStyle = '#3a4060'; ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(px, py, h * 0.011, h * 0.015, 0, 0, 7); ctx.fillStyle = on ? cc : '#4a5070'; ctx.fill(); ctx.lineWidth = Math.max(0.6, l * 0.18); ctx.strokeStyle = 'rgba(27,36,72,0.8)'; ctx.stroke();
      if (on) D.circ(px - h * 0.004, py - h * 0.005, h * 0.004, 'rgba(255,255,255,0.85)');
    }
    ctx.restore();
    // кромка яруса поверх — мишура уходит «за» неё
    if (LV) continue;
    var hw0 = tw / 2; ctx.beginPath(); ctx.moveTo(x - hw0 * 1.02, yy - h * 0.01); ctx.quadraticCurveTo(x - hw0 * 0.45, tTop + h * 0.15, x, tTop); ctx.quadraticCurveTo(x + hw0 * 0.45, tTop + h * 0.15, x + hw0 * 1.02, yy - h * 0.01); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = l * 0.85; ctx.strokeStyle = TOL[kind] || OL; ctx.stroke();   // только боковые кромки (снег и сосульки по низу не трогаем)
  }
  // игрушки: наряд игрока, а если его нет — шары по умолчанию; под ударами часть падает
  var tr = h * 0.042, list = dc && dc.hang && dc.hang.length ? dc.hang : null, nDef = kind === 'base' ? 9 : 0;
  for (var s = 0; !LB && s < (list ? list.length : nDef) && s < SLOTS.length; s++) {
    var sl = SLOTS[s]; if (o.lost && (s * 5) % 6 < o.lost) continue;
    var ti = sl[0], ty0 = y - h * 0.1 - ti * h * 0.2, tw2 = w * (1 - ti * 0.2), yh = ty0 - h * sl[2], half = tw2 / 2 * (1 - sl[2] / 0.34);
    var tx = x + sl[1] * 2 * half * 0.92, ang = Math.sin(t * 1.8 + s * 1.3) * 0.12 + (hitK ? Math.sin(t * 30 + s) * 0.3 * hitK : 0);
    ctx.save(); ctx.translate(tx, yh - tr * 1.6); ctx.rotate(ang);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(0.6, tr * 0.12); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, tr * 0.5); ctx.stroke();
    if (list) { if (!(Z.rotSprite && Z._treeLayer === 'live' && Z.rotSprite('toy|' + list[s] + '|' + Math.round(tr * 4), 0, tr * 1.6, tr * 3.2, tr * 3.4, tr * 1.6, tr * 1.8, function () { drawToy(list[s], 0, tr * 1.6, tr, 0); }))) drawToy(list[s], 0, tr * 1.6, tr, t); } else ballToy(ctx, 0, tr * 1.75, tr * (0.75 + (s % 3) * 0.12), BALLC[s % BALLC.length], t, s);
    ctx.restore();
  }
  var sy = y - h * 0.1 - 3 * h * 0.2 - h * 0.36;
  if (LB) { } else if (o.star !== false) {
    var top = dc && dc.top ? dc.top : 'star', pulse = cel >= 0 ? 1 + Math.max(0, 1 - cel) * 0.35 : 1, sDim = o.dim ? 0.45 : 1;
    ctx.save(); ctx.translate(x, sy); ctx.rotate(Math.sin(t * 1.5) * 0.08);
    ctx.globalAlpha = A0 * sDim;
    if (top === 'star') facetStar(ctx, 0, 0, h * 0.078 * pulse, l, t); else drawTop(top, 0, 0, h * 0.075, t, l);
    ctx.globalAlpha = A0; ctx.restore();
  } else if (!LV) { ctx.globalAlpha = A0 * 0.6; D.star(x, sy, h * 0.06, 'rgba(120,130,160,0.5)', l * 0.5); ctx.globalAlpha = A0; }
  ctx.restore();
  // частицы: снег с лап, упавшие шары катятся по земле
  if (ST) ST.p = ST.p.filter(function (p) {
    p.life -= dt; if (p.life <= 0) return false;
    if (p.k === 'snow') { p.vy += 0.6 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.y > 0) return false; ctx.globalAlpha = A0 * Math.min(1, p.life); D.circ(x + p.x * h, y + p.y * h, h * 0.008, '#ffffff'); ctx.globalAlpha = A0; return true; }
    p.vy += 2.2 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.y > 0.02) { p.y = 0.02; p.vy = -p.vy * 0.35; p.vx *= 0.8; }
    ctx.globalAlpha = A0 * Math.min(1, p.life * 2); ballToy(ctx, x + p.x * h, y + p.y * h - h * 0.02, h * 0.03, p.c, t, 0); ctx.globalAlpha = A0; return true; });
};
function facetStar(ctx, x, y, s, l, t) {
  if (Z.rotSprite && Z._treeLayer === 'live' && ctx === D.ctx && Z.rotSprite('fstar|' + Math.round(s * 4) + '|' + l.toFixed(1), x, y, s * 2.4, s * 2.4, s * 1.2, s * 1.2, function () { starBody(D.ctx, x, y, s, l); })) {   // 2.12: звезда — готовой картинкой, живьём только мерцание
    var tw0 = (Math.sin(t * 2.6) + 1) / 2, A1 = ctx.globalAlpha; ctx.globalAlpha = A1 * (0.5 + 0.5 * tw0); D.star(x - s * 0.25, y - s * 0.3, s * 0.18, '#ffffff', 0); ctx.globalAlpha = A1; return;
  }
  starBody(ctx, x, y, s, l);
  var tw = (Math.sin(t * 2.6) + 1) / 2, A2 = ctx.globalAlpha; ctx.globalAlpha = A2 * (0.5 + 0.5 * tw); D.star(x - s * 0.25, y - s * 0.3, s * 0.18, '#ffffff', 0); ctx.globalAlpha = A2;
}
function starBody(ctx, x, y, s, l) {
  D.star(x, y, s, '#ffd54a', l);
  for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * Math.PI * 2 / 5, tx = x + Math.cos(a) * s, ty = y + Math.sin(a) * s, a1 = a + Math.PI / 5, a0 = a - Math.PI / 5;
    D.poly([x, y, tx, ty, x + Math.cos(a1) * s * 0.45, y + Math.sin(a1) * s * 0.45], 'rgba(255,248,200,0.75)');
    D.poly([x, y, tx, ty, x + Math.cos(a0) * s * 0.45, y + Math.sin(a0) * s * 0.45], 'rgba(200,130,20,0.45)'); }
  D.star(x, y, s, null, l);
}

// =====================================================================================
// СКИНЫ ГЕРОЕВ — перекраска одежды (лица, бороды, глаза не трогаем)
// =====================================================================================
var SKINS = [['ice', 205, 1, 'Ледяной', 'Icy'], ['night', 272, 1, 'Полночный', 'Midnight'], ['mint', 158, 0.9, 'Мятный', 'Mint'], ['gold', 44, 1.15, 'Золотой', 'Golden'], ['rose', 335, 1, 'Розовый', 'Rose']];
// у каждого героя свои варианты: без «ледяной» Снегурочки (она и так голубая) и т. п.; золотой — только Дед Мороз из стартового набора
// 2.12.41: облик, почти совпадавший с обычным цветом, заменён: Белка «Мятный» → «Розовый» (шарф и так зелёный), Пломбир «Ледяной» → «Розовый» (щит и так голубой),
// Эскимо «Розовый» → «Золотой» (шарф и так красный). Купленные остаются и выбираются в гардеробе
// 2.12.40: у Колобка вместо «Розового» — «Полночный» (розовая повязка почти как обычная красная)
// 2.12.39: у Эскимо вместо «Ледяного» — «Мятный»: голубой шарф сливался с синим ведром (уже купленный ледяной остаётся)
var HSK = { moroz: ['ice', 'night', 'mint', 'gold'], sneg: ['rose', 'night', 'mint'], belka: ['ice', 'night', 'rose'], emelya: ['ice', 'night', 'rose'], kolobok: ['ice', 'mint', 'night'], vasilisa: ['ice', 'mint', 'rose'], kot: ['night', 'mint', 'rose'], plombir: ['rose', 'night', 'mint'], eskimo: ['mint', 'night', 'gold'] };
// 2.11.5: у белых героев (снеговики) перекрашиваются и светлые части — иначе облик почти не отличался
var WHITE_HERO = { plombir: 1, eskimo: 1 };
var SKIN = {}; SKINS.forEach(function (q) { SKIN[q[0]] = { id: q[0], hue: q[1], sat: q[2], ru: q[3], en: q[4] }; });
function SKIN_COST() { return Z.FLAG ? Z.FLAG('skin_cost', 45) : 45; }   // 2.11.5: облик со свойством в бою — 45
Z.SKINS = SKINS;
function parseCol(s) {
  var m;
  if (s[0] === '#') { var h = s.slice(1); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; if (h.length !== 6) return null; return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1]; }
  if ((m = /^rgba?\(([^)]+)\)/.exec(s))) { var p = m[1].split(',').map(parseFloat); return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]]; }
  return null;
}
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2; if (mx !== mn) { var d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
var memo = {};
var protectBody = false, tintMode = '';   // '' — только насыщенные цвета; 'white' — ещё и белые/светлые (снеговики); 'grey' — ещё и серые (вышки)
// 2.12.39: перекрашиваем только «семейство» главного цвета одежды героя (оттенок ± допуск), со сдвигом оттенка —
// отделка, пуговицы, волосы, очки, шары, книги и обводка остаются своими. Раньше в один цвет красилось всё насыщенное,
// и детали сливались (у золотой Василисы — платье, отделка, волосы и платок одного цвета; обводка тоже меняла цвет)
var HFAM = { moroz: [356, 26], sneg: [210, 26], eskimo: [356, 22], emelya: [10, 14], belka: [145, 26], kolobok: [356, 22], plombir: [200, 26], vasilisa: [262, 30], kot: [232, 28] }, curFam = null, curHeroT = '';
function hueDist(a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
function skinCol(s, sk) {
  var key = sk.id + tintMode + (protectBody || '') + curHeroT + s; if (memo[key] !== undefined) return memo[key];
  var c = parseCol(String(s).toLowerCase().trim()), out = s;
  if (c) {
    var hsl = rgb2hsl(c[0], c[1], c[2]), h = hsl[0], sa = hsl[1], li = hsl[2];
    // 2.11.5: кожа, румянец, нос и мех зверей не перекрашиваются — только одежда
    var skinTone = (h >= 8 && h <= 45 && li > 0.6) || ((h >= 340 || h <= 15) && li > 0.68) || c[3] < 0.6, fur = (protectBody === 1 && ((h >= 10 && h <= 50 && li > 0.3 && sa > 0.3) || (sa < 0.45 && li > 0.3))) || (protectBody === 2 && li > 0.72);
    var keep = sa < 0.28 || li < (curFam ? 0.24 : 0.14) || li > 0.93 || skinTone || fur;
    if (!keep && curFam && hueDist(h, curFam[0]) > curFam[1]) keep = true;
    // 2.12.41: яркая деталь (пояс, пуговицы, шапочка), совпавшая по оттенку с новым цветом одежды, берёт прежний цвет одежды —
    // у золотого Деда Мороза пояс красный, у мятной Василисы шапочка фиолетовая и т. п. Кожа, мех, светлые блики не трогаются
    if (keep && curFam && !skinTone && !fur && sa >= 0.5 && li >= 0.28 && li <= 0.75 && hueDist(h, curFam[0]) > curFam[1] && hueDist(h, sk.hue) < 16) { memo[key] = 'hsla(' + curFam[0] + ',' + Math.round(sa * 90) + '%,' + Math.round(li * 92) + '%,' + c[3] + ')'; return memo[key]; }
    if (!keep && curFam) out = 'hsla(' + ((sk.hue + (((h - curFam[0] + 540) % 360) - 180) * 0.6 + 360) % 360).toFixed(0) + ',' + Math.round(Math.min(100, sa * sk.sat * 100)) + '%,' + Math.round(li * 100) + '%,' + c[3] + ')';
    else if (!keep) out = 'hsla(' + sk.hue + ',' + Math.round(Math.min(100, sa * sk.sat * 100)) + '%,' + Math.round(li * 100) + '%,' + c[3] + ')';
    else if (tintMode === 'white' && sa < 0.28 && li >= 0.55 && li <= 0.99) out = 'hsla(' + sk.hue + ',' + Math.round(Math.min(70, 42 * sk.sat)) + '%,' + Math.round(Math.min(94, li * 96)) + '%,' + c[3] + ')';
    else if (tintMode === 'grey' && sa < 0.28 && li >= 0.2 && li <= 0.9) out = 'hsla(' + sk.hue + ',' + Math.round(Math.min(80, 48 * sk.sat)) + '%,' + Math.round(li * 100) + '%,' + c[3] + ')';
  }
  memo[key] = out; return out;
}
var proxies = typeof WeakMap !== 'undefined' ? new WeakMap() : null, curSkin = null, capeHook = null;
function skinCtx(real) {
  var p = proxies && proxies.get(real); if (p) return p;
  var fns = {};
  p = new Proxy(real, {
    get: function (o, k) {
      var v = o[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return function () { var g = v.apply(o, arguments), add = g.addColorStop.bind(g); g.addColorStop = function (p, c) { add(p, curSkin && typeof c === 'string' ? skinCol(c, curSkin) : c); }; return g; };
      if (k === 'translate') return function (a, b) { o.translate(a, b); if (capeHook) capeHook(a, b); };   // 2.11.5: накидка крепится к телу героя
      if (typeof v === 'function') { if (!fns[k]) fns[k] = v.bind(o); return fns[k]; }
      return v;
    },
    set: function (o, k, v) { if ((k === 'fillStyle' || k === 'strokeStyle') && typeof v === 'string' && curSkin) v = skinCol(v, curSkin); o[k] = v; return true; }
  });
  if (proxies) proxies.set(real, p);
  return p;
}
Z.heroSkin = function (t) { var id = Z.save.skins && Z.save.skins.on[t]; return id && SKIN[id] && Z.save.skins.own[t + ':' + id] ? SKIN[id] : null; };
var oldAlly = D.ally;
// 2.11.5: облик виден везде — в бою, в меню, на карте и в мультфильмах/комиксах; у особых обликов — искры вокруг героя
function sparkles(sk, x, y, R) {
  var fx = { gold: ['#fff3b0', 4], ice: ['#d8f4ff', 4], night: ['#c9b8ff', 3], rose: ['#ffc2dc', 3] }[sk.id]; if (!fx) return;
  var c = D.ctx, t = Z.time || 0;
  for (var i = 0; i < fx[1]; i++) {
    var ph = t * 1.6 + i * 2.1, k = (Math.sin(ph) + 1) / 2, a = i * 1.7 + t * 0.4;
    var px = x + Math.cos(a) * R * 0.85, py = y - R * (0.8 + 1.3 * ((i * 0.37 + t * 0.15) % 1)), r = R * (0.05 + 0.06 * k);
    c.save(); c.globalAlpha = 0.25 + 0.65 * k; c.fillStyle = fx[0]; c.beginPath();
    c.moveTo(px, py - r * 2); c.lineTo(px + r * 0.5, py - r * 0.5); c.lineTo(px + r * 2, py); c.lineTo(px + r * 0.5, py + r * 0.5); c.lineTo(px, py + r * 2); c.lineTo(px - r * 0.5, py + r * 0.5); c.lineTo(px - r * 2, py); c.lineTo(px - r * 0.5, py - r * 0.5); c.closePath(); c.fill(); c.restore();
  }
}
// 2.11.5: облик героя — не только цвет: у каждого облика свой убор и своя накидка/крылья,
// закреплённые по точкам фигуры каждого героя (верх головы, плечи, низ), и они колышутся.
var HA = {   // в долях R: hx,hy — верх головы/шапки; hw — полуширина головы; sy — плечи; sw — полуширина плеч; bw — полуширина низа
  moroz: [0, -2.6, 0.34, -1.45, 0.42, 0.62], sneg: [0, -2.33, 0.3, -1.35, 0.38, 0.55], belka: [0.2, -1.72, 0.24, -1.0, 0.3, 0.38],
  plombir: [0, -2.1, 0.4, -1.15, 0.5, 0.7], eskimo: [-0.1, -2.0, 0.34, -0.95, 0.45, 0.55], vasilisa: [0, -2.15, 0.3, -1.45, 0.38, 0.62],
  kot: [0, -1.85, 0.3, -0.95, 0.38, 0.45], kolobok: [0, -1.3, 0.34, -0.9, 0.5, 0.65], emelya: [-0.28, -1.72, 0.24, -1.25, 0.55, 0.72]
};
var OLh = '#1b2448';
function hl(c, R, m) { c.lineWidth = Math.max(1, R * 0.06 * (m || 1)); c.strokeStyle = OLh; c.stroke(); }
function star4(c, x, y, r, col) { c.beginPath(); for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4, rr = i % 2 ? r * 0.3 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fillStyle = col; c.fill(); }
function capePath(c, A, R, t, bot, wave) {
  // 2.11.5: плащ начинается ровно на плечах и развевается назад (против хода), низ шире — как настоящий плащ, а не щит за спиной
  var sx = A[4] * R * 0.98, sy = A[3] * R + R * 0.04, bx = A[5] * R * 1.3, back = R * (0.26 + Math.sin(t * 2) * 0.04) + (CAPE_MOVE ? R * 0.14 : 0), n = 7, i;
  c.beginPath(); c.moveTo(-sx, sy);
  c.bezierCurveTo(-sx - R * 0.12, sy + (bot - sy) * 0.35, -bx - back * 0.8, sy + (bot - sy) * 0.7, -bx - back, bot);
  for (i = 1; i <= n; i++) { var k = i / n, x = (-bx - back) + (2 * bx + back * 0.55) * k, yy = bot + Math.sin(t * 3 + i * 1.3) * R * wave + (i % 2 ? R * 0.06 : 0) - k * R * 0.05; c.lineTo(x, yy); }
  c.bezierCurveTo(bx * 0.9, sy + (bot - sy) * 0.6, sx + R * 0.08, sy + (bot - sy) * 0.25, sx, sy);
  c.quadraticCurveTo(0, sy - R * 0.1, -sx, sy); c.closePath();
}
var CAPE_MOVE = false, CAPEC = { ice: ['rgba(200,240,255,0.95)', 'rgba(120,200,240,0.95)', '#3f86c0'], night: ['#28245e', '#120f33', '#0a0820'], mint: ['#e9fff3', '#59d69a', '#1f7a4b'], gold: ['#d1213f', '#8e1328', '#5a0a18'] };
// накладки плаща на плечах — поверх тела: видно, что плащ надет, а не висит отдельно
function capeFront(id, A, R, t) {
  var cols = CAPEC[id]; if (!cols) return; var c = D.ctx, sx = A[4] * R, sy = A[3] * R;
  [-1, 1].forEach(function (d) {
    c.beginPath(); c.moveTo(d * sx * 0.5, sy - R * 0.02);
    c.quadraticCurveTo(d * sx * 1.02, sy - R * 0.06, d * sx * 1.13, sy + R * 0.16);
    c.quadraticCurveTo(d * sx * 0.92, sy + R * 0.2, d * sx * 0.62, sy + R * 0.1); c.closePath();
    var g = c.createLinearGradient(0, sy - R * 0.06, 0, sy + R * 0.2); g.addColorStop(0, cols[0]); g.addColorStop(1, cols[1]); c.fillStyle = g; c.fill(); hl(c, R, 0.7);
    if (id === 'gold' || id === 'night') { c.strokeStyle = id === 'gold' ? '#ffd54a' : '#8f7bff'; c.lineWidth = R * 0.035; c.beginPath(); c.moveTo(d * sx * 0.62, sy + R * 0.1); c.quadraticCurveTo(d * sx * 0.92, sy + R * 0.2, d * sx * 1.13, sy + R * 0.16); c.stroke(); }
  });
}
function heroBack(id, A, R, t) {
  var c = D.ctx, bot = -R * 0.12;
  if (id === 'rose') {   // крылышки феи машут
    var fl = Math.sin(t * 7) * 0.18;
    [-1, 1].forEach(function (d) { c.save(); c.translate(d * A[4] * R * 0.4, A[3] * R + R * 0.1); c.rotate(d * (0.35 + fl)); c.scale(d, 1);
      [[0, -0.75, 0.5, 0.32, -0.5], [0, -0.25, 0.36, 0.22, 0.4]].forEach(function (w) { c.beginPath(); c.ellipse(w[2] * R * 0.9, w[1] * R * 0.9, w[2] * R, w[3] * R, w[4], 0, 7);
        var g = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.9); g.addColorStop(0, 'rgba(255,200,230,0.95)'); g.addColorStop(1, 'rgba(255,140,200,0.55)'); c.fillStyle = g; c.fill(); c.lineWidth = Math.max(1, R * 0.04); c.strokeStyle = '#c2347a'; c.stroke(); });
      c.restore(); });
    return;
  }
  var cols = CAPEC[id]; if (!cols) return;
  c.save(); capePath(c, A, R, t, bot, 0.03); var g2 = c.createLinearGradient(0, A[3] * R, 0, bot); g2.addColorStop(0, cols[0]); g2.addColorStop(1, cols[1]); c.fillStyle = g2; c.fill(); hl(c, R, 0.8);
  c.clip();
  if (id === 'night') for (var i = 0; i < 9; i++) { var sx = Math.sin(i * 12.9) * A[5] * R, sy = A[3] * R + ((i * 0.37) % 1) * (bot - A[3] * R), k = (Math.sin(t * 3 + i * 1.7) + 1) / 2; c.globalAlpha = 0.4 + 0.6 * k; star4(c, sx, sy, R * (0.05 + 0.04 * k), '#fff3b0'); }
  if (id === 'mint') { c.globalAlpha = 0.85; c.strokeStyle = '#ffffff'; c.lineWidth = R * 0.1; for (var j = -4; j < 5; j++) { c.beginPath(); c.moveTo(j * R * 0.28 - R, A[3] * R); c.lineTo(j * R * 0.28 + R * 0.4, bot + R * 0.2); c.stroke(); } }
  if (id === 'ice') { c.globalAlpha = 0.7; for (var q = 0; q < 4; q++) { var fx = Math.sin(q * 7.3) * A[5] * R * 0.8, fy = A[3] * R + (q + 0.6) / 4.6 * (bot - A[3] * R); c.save(); c.translate(fx, fy); c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1, R * 0.03); for (var r3 = 0; r3 < 3; r3++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-R * 0.1, 0); c.lineTo(R * 0.1, 0); c.stroke(); } c.restore(); } }
  c.restore();
  c.save();
  if (id === 'gold') { capePath(c, A, R, t, bot, 0.03); c.strokeStyle = '#ffd54a'; c.lineWidth = R * 0.07; c.stroke(); }
  if (id === 'night') { capePath(c, A, R, t, bot, 0.03); c.strokeStyle = '#8f7bff'; c.lineWidth = R * 0.05; c.stroke(); }
  if (id === 'ice') { var bx = A[5] * R * 1.3, bk = R * (0.26 + Math.sin(t * 2) * 0.04) + (CAPE_MOVE ? R * 0.14 : 0); for (var k2 = 0; k2 < 7; k2++) { var kk = (k2 + 0.5) / 7, ix = (-bx - bk) + (2 * bx + bk * 0.55) * kk, len = R * (0.14 + (k2 % 2) * 0.1); c.beginPath(); var iy = bot - kk * R * 0.05; c.moveTo(ix - R * 0.05, iy + R * 0.03); c.lineTo(ix, iy + len); c.lineTo(ix + R * 0.05, iy + R * 0.03); c.closePath(); c.fillStyle = 'rgba(220,246,255,0.95)'; c.fill(); c.lineWidth = Math.max(1, R * 0.03); c.strokeStyle = '#4f9bd0'; c.stroke(); } }
  c.restore();
}
var CLASP = { ice: '#bfefff', night: '#ffe680', mint: '#ff4f5f', gold: '#ffd54a' };
function heroAcc(type, look, x, y, R, o, front) {
  var A = HA[type]; if (!A || !look) return; var c = D.ctx, dir = (o && o.dir) || 1, t = Z.time || 0;
  c.save(); c.translate(x, y); c.scale(dir, 1);
  try {
    if (!front) heroBack(look, A, R, t);
    else if (false) {   // застёжка убрана накидки на плечах
      var cy = A[3] * R + R * 0.04, cr = R * 0.085;
      [-1, 1].forEach(function (d) { c.beginPath(); c.moveTo(d * A[4] * R * 1.0, A[3] * R - R * 0.02); c.quadraticCurveTo(d * A[4] * R * 0.5, cy + R * 0.06, d * cr, cy); c.lineWidth = R * 0.05; c.strokeStyle = OLh; c.stroke(); c.lineWidth = R * 0.028; c.strokeStyle = CLASP[look]; c.stroke(); });
      c.beginPath(); c.arc(0, cy, cr, 0, 7); c.fillStyle = CLASP[look]; c.fill(); hl(c, R, 0.5); c.beginPath(); c.arc(-cr * 0.3, cy - cr * 0.3, cr * 0.3, 0, 7); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill();
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
  c.restore();
}
// гардероб: накидка выбирается отдельно от цвета одежды и покупается для каждого героя
var ACC = [['cape_ice', 'ice', 30, 'Ледяная накидка', 'Ice cape'], ['cape_star', 'night', 30, 'Звёздный плащ', 'Starry cloak'], ['cape_mint', 'mint', 30, 'Мятная накидка', 'Mint cape'], ['cape_royal', 'gold', 35, 'Царская мантия', 'Royal mantle'], ['wings', 'rose', 35, 'Крылышки феи', 'Fairy wings']];
var ACCM = {}; ACC.forEach(function (q) { ACCM[q[0]] = { id: q[0], look: q[1], cost: q[2], ru: q[3], en: q[4] }; });
Z.HACC = ACC;
function accSave() { var s = Z.save.skins; s.acc = s.acc || {}; s.accOwn = s.accOwn || {}; return s; }
Z.heroAccOk = function (t) { return t !== 'emelya'; };   // Емеля на печи — накидку на печь не надеваем
Z.heroAccOn = function (t) { if (t === 'emelya') return null; var s = Z.save && Z.save.skins; if (!s || !s.acc) return null; var id = s.acc[t]; return id && ACCM[id] && s.accOwn && s.accOwn[t + ':' + id] ? id : null; };
// к какому сдвигу тела крепить накидку: Белка подпрыгивает вторым сдвигом, Колобок сдвигается к центру шара
var HOOK = { belka: { n: 2 }, kolobok: { dy: 0.62 } }, NOFRONT = { kolobok: 1, moroz: 1, belka: 1, plombir: 1, eskimo: 1 };   // накладки на плечах — только где плечи открыты: у Деда Мороза их закрывает борода, у Белки и снеговиков плеч нет
var inHero = 0, ANIMAL = { belka: 1, kolobok: 1, kot: 1 }, SNOWY = { plombir: 1, eskimo: 1 };
function heroDraw(type, x, y, R, o, fn) {
  if (inHero || typeof Proxy === 'undefined') return fn();
  var sk = Z.heroSkin(type), acc = Z.heroAccOn(type); if (!sk && !acc) return fn();
  inHero++;
  var real = D.ctx, prev = curSkin, pm = tintMode, pb = protectBody, ph = capeHook;
  // накидка рисуется внутри системы координат героя — в момент, когда его функция сдвинулась к своей точке
  // (вместе с подпрыгиванием при ходьбе, наклоном и приседанием), поэтому двигается вместе с телом
  var hk = HOOK[type] || {}, nT = 0;
  var frontM = null;
  if (acc && HA[type]) capeHook = function (a, b) {
    if (++nT < (hk.n || 1)) return;
    capeHook = null; var cs = curSkin; curSkin = null;
    try { var c = D.ctx; c.save(); if (hk.dy) c.translate(0, R * hk.dy); if (!hk.n) c.scale((o && o.dir) || 1, 1); CAPE_MOVE = !!(o && (o.moving || o.walk)); heroBack(ACCM[acc].look, HA[type], R, Z.time || 0); try { frontM = real.getTransform(); } catch (e2) { frontM = null; } c.restore(); } catch (e) { if (window.__rep) window.__rep(e); }
    curSkin = cs;
  };
  var pf = curFam, pht = curHeroT; curFam = HFAM[type] || null; curHeroT = type;
  curSkin = sk || null; tintMode = ''; protectBody = ANIMAL[type] ? 1 : SNOWY[type] ? 2 : false; D.setCtx(skinCtx(real));
  try { return fn(); } finally { D.setCtx(real); curSkin = prev; tintMode = pm; protectBody = pb; capeHook = ph; curFam = pf; curHeroT = pht; inHero--;
    if (frontM && acc && !NOFRONT[type]) { try { real.save(); real.setTransform(frontM); capeFront(ACCM[acc].look, HA[type], R, Z.time || 0); } catch (e3) { if (window.__rep) window.__rep(e3); } real.restore(); }
    if (sk) try { sparkles(sk, x, y, R); } catch (e) { if (window.__rep) window.__rep(e); } }
}
D.ally = function (type, x, y, R, o) { var self = this, args = arguments; return heroDraw(type, x, y, R, o || {}, function () { return oldAlly.apply(self, args); }); };
// для героев, которых рисуют более поздние модули мимо этой обёртки (Эскимо)
Z.skinWrapAlly = function (type, x, y, R, o, fn) { return heroDraw(type, x, y, R, o, fn); };
// Дед Мороз и Снегурочка в меню и в сценах рисуются отдельными функциями — облик и там
['moroz', 'snegurochka'].forEach(function (fn) {
  var hero = fn === 'moroz' ? 'moroz' : 'sneg', o = D[fn]; if (!o) return;
  D[fn] = function (x, y, R) { var self = this, args = arguments; return heroDraw(hero, x, y, fn === 'moroz' ? R : R / 0.92, args[3] || {}, function () { return o.apply(self, args); }); };
});
// 2.11.5: облики вышек — у каждой вышки свой; это не просто цвет: перекраска + украшения (лента с бантом, глазурь,
// ледяные шипы со снежной шапкой, корона с самоцветами, гирлянда со звездой)
var TSK = [['gift', 355, 1.2, 'Подарок', 'Gift box', 50], ['ginger', 26, 0.85, 'Пряник', 'Gingerbread', 50], ['crystal', 195, 1.05, 'Кристалл', 'Crystal', 50], ['garland', 140, 0.95, 'Ёлочка', 'Fir tree', 50], ['royal', 44, 1.35, 'Царская', 'Royal', 0]];   // 2.11.5: «Царская» — только в Стартовом наборе
var TSKIN = {}; TSK.forEach(function (q) { TSKIN[q[0]] = { id: q[0], hue: q[1], sat: q[2], ru: q[3], en: q[4], cost: q[5] }; });
var TTOP = { snow: 0.71, mg: 0.45, ice: 0.45, mortar: 0.66, tesla: 0.85, ballista: 0.4 }, TW = { snow: 0.32, mg: 0.27, ice: 0.34, mortar: 0.33, tesla: 0.25, ballista: 0.37 };
Z.TSK = TSK; Z.TSKIN = TSKIN;
function twSk() { var sk = Z.save && Z.save.skins; if (!sk) return null; sk.tw = sk.tw || {}; sk.twT = sk.twT || {}; return sk; }
Z.towerSkin = function (type) { var sk = twSk(), id = sk && sk.twT[type]; return id && TSKIN[id] && sk.tw[type + ':' + id] ? TSKIN[id] : null; };
function bow(c, x, y, r, col, dk) {
  c.fillStyle = col; c.strokeStyle = '#1b2448'; c.lineWidth = Math.max(1, r * 0.14);
  [-1, 1].forEach(function (d) { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + d * r * 1.3, y - r * 1.1, x + d * r * 1.1, y + r * 0.2); c.closePath(); c.fill(); c.stroke(); });
  c.beginPath(); c.arc(x, y, r * 0.32, 0, 7); c.fillStyle = dk; c.fill(); c.stroke();
}
function star5(c, x, y, r, col) { c.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = Math.max(1, r * 0.16); c.strokeStyle = '#1b2448'; c.stroke(); }
// 2.11.5: облик вышки встроен в саму модель: украшения рисуются в точках модели (основание, корпус,
// поворотный ствол, верхушка) и двигаются вместе с ней; ленты, гирлянды, кисти и корона качаются на пружинах,
// а частицы (снежинки, конфетти, крошки, искры, золотой блеск) летят с гравитацией и отскакивают от земли.
var HK = null;   // текущая вышка с обликом: { sk, tw, c, st, t, cs }
var OL2 = '#1b2448', PV = {};
function hkState(tw, x, y) {
  if (tw.c != null) return tw._ts || (tw._ts = { p: [], sw: 0, sv: 0, t: -1, a: tw.ang || 0, rc: 0, em: 0 });
  var k = tw.type + '|' + Math.round(x / 4) + '|' + Math.round(y / 4); if (!PV[k] && Object.keys(PV).length > 80) PV = {}; return PV[k] || (PV[k] = { p: [], sw: 0, sv: 0, t: -1, a: tw.ang || 0, rc: 0, em: 0 });
}
function lwT(m) { return Math.max(1, (HK ? HK.cs : 40) * 0.03 * (m || 1)); }
function strk(c, m) { c.lineWidth = lwT(m); c.strokeStyle = OL2; c.stroke(); }
function blink(i, t, sp) { return (Math.floor(t * (sp || 4)) + i) % 4; }
var BULB = ['#ff5a5f', '#ffd54a', '#3fb6e6', '#9dff6a', '#ff8fd6'];
function bulb(c, x, y, r, i, t, dim) {
  var on = blink(i, t, 4) !== 0, col = BULB[i % 5];
  if (on && !dim) { c.globalAlpha = 0.35; c.beginPath(); c.arc(x, y, r * 2.2, 0, 7); c.fillStyle = col; c.fill(); c.globalAlpha = 1; }
  c.beginPath(); c.ellipse(x, y, r * 0.8, r, 0, 0, 7); c.fillStyle = on ? col : '#4a4f66'; c.fill(); strk(c, 0.45);
  if (on) { c.beginPath(); c.arc(x - r * 0.25, y - r * 0.3, r * 0.28, 0, 7); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill(); }
}
function gem(c, x, y, r, col) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.8, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.8, y); c.closePath(); c.fillStyle = col; c.fill(); strk(c, 0.5); c.beginPath(); c.moveTo(x - r * 0.3, y - r * 0.35); c.lineTo(x, y - r * 0.7); c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = lwT(0.4); c.stroke(); }
function ribbonV(c, x, y0, y1, w) { c.beginPath(); c.rect(x - w / 2, y0, w, y1 - y0); c.fillStyle = '#ffd54a'; c.fill(); strk(c, 0.7); c.beginPath(); c.moveTo(x - w * 0.15, y0 + w * 0.3); c.lineTo(x - w * 0.15, y1 - w * 0.3); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = lwT(0.5); c.stroke(); }
function ribbonH(c, x0, x1, y, w) { c.beginPath(); c.rect(x0, y - w / 2, x1 - x0, w); c.fillStyle = '#ffd54a'; c.fill(); strk(c, 0.7); }
// бант с хвостами: хвосты всегда свисают вниз по миру (dx,dy — «вниз» в текущих координатах) и качаются
function bowT(c, x, y, r, dn, sw) {
  var dx = dn[0], dy = dn[1], ca = Math.cos(sw), sa = Math.sin(sw), ux = dx * ca - dy * sa, uy = dx * sa + dy * ca;
  [-1, 1].forEach(function (d) {   // хвост ленты: полоса с вырезом «ласточкин хвост», свисает и качается
    var an = d * 0.38 + sw * 0.4 * d, vx = ux * Math.cos(an) - uy * Math.sin(an), vy = ux * Math.sin(an) + uy * Math.cos(an), px = -vy, py = vx, L = r * 2.1, w = r * 0.42;
    var ex = x + vx * L, ey = y + vy * L;
    c.beginPath(); c.moveTo(x + px * w * 0.5, y + py * w * 0.5); c.lineTo(ex + px * w * 0.6, ey + py * w * 0.6); c.lineTo(ex - vx * w * 0.7, ey - vy * w * 0.7); c.lineTo(ex - px * w * 0.6, ey - py * w * 0.6); c.lineTo(x - px * w * 0.5, y - py * w * 0.5); c.closePath();
    c.fillStyle = '#ffc93a'; c.fill(); strk(c, 0.55);
  });
  [-1, 1].forEach(function (d) { c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + d * r * 1.5, y - r * 1.3, x + d * r * 1.7, y + r * 0.5, x, y); c.fillStyle = '#ffd54a'; c.fill(); strk(c, 0.6); });
  c.beginPath(); c.arc(x, y, r * 0.33, 0, 7); c.fillStyle = '#e0a81e'; c.fill(); strk(c, 0.5);
}
function icing(c, x0, x1, y, cs, seed) {
  var n = Math.max(3, Math.round((x1 - x0) / (cs * 0.07))), w = (x1 - x0) / n, i;
  c.beginPath(); c.moveTo(x0, y - cs * 0.012);
  for (i = 0; i < n; i++) {
    var xa = x0 + i * w, dr = ((i * 37 + seed) % 5 === 0) ? cs * (0.05 + ((i * 13) % 3) * 0.02) : 0;
    c.quadraticCurveTo(xa + w * 0.5, y + cs * 0.035, xa + w, y + cs * 0.005);
    if (dr) { c.lineTo(xa + w * 0.92, y + dr); c.arc(xa + w * 0.8, y + dr, w * 0.14, 0, Math.PI); c.lineTo(xa + w * 0.66, y + cs * 0.02); c.lineTo(xa + w, y + cs * 0.005); }
  }
  c.lineTo(x1, y - cs * 0.03); c.lineTo(x0, y - cs * 0.03); c.closePath(); c.fillStyle = '#fffaf2'; c.fill(); strk(c, 0.5);
}
function icicles(c, x0, x1, y, cs, n, dn) {
  dn = dn || [0, 1];
  for (var i = 0; i < n; i++) {
    var x = x0 + (x1 - x0) * (i + 0.5) / n, len = cs * (0.06 + ((i * 7) % 3) * 0.035), w = cs * 0.028;
    c.beginPath(); c.moveTo(x - w - dn[1] * 0, y); c.lineTo(x + dn[0] * len, y + dn[1] * len); c.lineTo(x + w, y); c.closePath();
    c.fillStyle = 'rgba(214,244,255,0.95)'; c.fill(); c.lineWidth = lwT(0.5); c.strokeStyle = '#4f9bd0'; c.stroke();
    c.beginPath(); c.moveTo(x - w * 0.3, y + cs * 0.01); c.lineTo(x + dn[0] * len * 0.5 - w * 0.2, y + dn[1] * len * 0.5); c.strokeStyle = '#fff'; c.lineWidth = lwT(0.35); c.stroke();
  }
}
function frost(c, x, y, r) {   // ледяной кристалл-шестигранник
  c.save(); c.translate(x, y); c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, r * 0.22); c.lineCap = 'round';
  for (var i = 0; i < 3; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.moveTo(r * 0.5, 0); c.lineTo(r * 0.75, -r * 0.25); c.moveTo(r * 0.5, 0); c.lineTo(r * 0.75, r * 0.25); c.moveTo(-r * 0.5, 0); c.lineTo(-r * 0.75, -r * 0.25); c.moveTo(-r * 0.5, 0); c.lineTo(-r * 0.75, r * 0.25); c.stroke(); }
  c.restore();
}
function shard(c, x, y, h, w, tilt) { c.beginPath(); c.moveTo(x - w, y); c.lineTo(x + Math.sin(tilt) * h - w * 0.2, y - Math.cos(tilt) * h); c.lineTo(x + Math.sin(tilt) * h + w * 0.2, y - Math.cos(tilt) * h + w * 0.3); c.lineTo(x + w, y); c.closePath(); c.fillStyle = 'rgba(200,240,255,0.95)'; c.fill(); c.lineWidth = lwT(0.6); c.strokeStyle = '#3f86c0'; c.stroke(); c.beginPath(); c.moveTo(x - w * 0.3, y - h * 0.15); c.lineTo(x + Math.sin(tilt) * h * 0.6 - w * 0.3, y - Math.cos(tilt) * h * 0.6); c.strokeStyle = '#fff'; c.lineWidth = lwT(0.4); c.stroke(); }
function needles(c, x0, x1, y, cs, t) {   // еловая гирлянда-венок
  var n = Math.max(4, Math.round((x1 - x0) / (cs * 0.05))), i;
  c.beginPath(); c.moveTo(x0, y);
  for (i = 0; i <= n; i++) { var xx = x0 + (x1 - x0) * i / n; c.lineTo(xx, y + (i % 2 ? -cs * 0.045 : cs * 0.045)); }
  c.lineWidth = cs * 0.06; c.strokeStyle = '#1f6b43'; c.stroke(); c.lineWidth = cs * 0.025; c.strokeStyle = '#3fa065'; c.stroke();
  for (i = 0; i < n / 2; i++) bulb(c, x0 + (x1 - x0) * (i + 0.5) / (n / 2), y + ((i % 2) ? -cs * 0.02 : cs * 0.02), cs * 0.026, i, t);
}
function crown(c, x, y, cs, wob, sq) {
  c.save(); c.translate(x, y); c.rotate(wob * 0.35); c.scale(1 + sq * 0.15, 1 - sq * 0.2);
  var w = cs * 0.14, h = cs * 0.12;
  c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w * 1.05, -h); c.lineTo(-w * 0.5, -h * 0.45); c.lineTo(0, -h * 1.2); c.lineTo(w * 0.5, -h * 0.45); c.lineTo(w * 1.05, -h); c.lineTo(w, 0); c.closePath();
  var g = c.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, '#fff1a8'); g.addColorStop(1, '#e6a91d'); c.fillStyle = g; c.fill(); strk(c, 0.8);
  [-1.05, 0, 1.05].forEach(function (k, i) { c.beginPath(); c.arc(k * w * (i === 1 ? 0 : 1), i === 1 ? -h * 1.2 : -h, cs * 0.022, 0, 7); c.fillStyle = '#fff6d0'; c.fill(); strk(c, 0.4); });
  c.beginPath(); c.rect(-w, -h * 0.28, w * 2, h * 0.28); c.fillStyle = '#c9302c'; c.fill(); strk(c, 0.5);
  gem(c, 0, -h * 0.6, cs * 0.032, '#3fb6e6'); gem(c, -w * 0.55, -h * 0.14, cs * 0.02, '#4cc77d'); gem(c, w * 0.55, -h * 0.14, cs * 0.02, '#4cc77d');
  c.restore();
}
function star5b(c, x, y, r, col, t) { c.globalAlpha = 0.35 + 0.2 * Math.sin(t * 3); c.beginPath(); c.arc(x, y, r * 1.9, 0, 7); c.fillStyle = '#fff3b0'; c.fill(); c.globalAlpha = 1; star5(c, x, y, r, col); c.beginPath(); c.arc(x - r * 0.2, y - r * 0.25, r * 0.18, 0, 7); c.fillStyle = '#fff'; c.fill(); }
// ---------- украшения по точкам модели ----------
var DRESS = {
  gift: {
    base: function (c, b, cs, H) {
      var mx = (b.x0 + b.x1) / 2 * cs, y0 = b.y0 * cs, y1 = b.y1 * cs;
      if (b.legs) { bowT(c, 0, y0, cs * 0.075, [0, 1], H.st.sw); return; }
      ribbonV(c, mx, y0, y1, cs * 0.08); ribbonH(c, b.x0 * cs, b.x1 * cs, (y0 + y1) / 2, cs * 0.06);
    },
    body: function (c, b, cs, H) { var mx = (b.x0 + b.x1) / 2 * cs, my = (b.y0 * 0.45 + b.y1 * 0.55) * cs; ribbonV(c, mx, b.y0 * cs, b.y1 * cs, cs * 0.07); ribbonH(c, b.x0 * cs + cs * 0.01, b.x1 * cs - cs * 0.01, my, cs * 0.055); bowT(c, mx, my, cs * 0.085, [0, 1], H.st.sw); },
    turret: function (c, b, cs, H) { var x = (b.x0 * 0.35 + b.x1 * 0.65) * cs; ribbonV(c, x, -b.h * cs, b.h * cs, cs * 0.065); ribbonH(c, b.x0 * cs + cs * 0.02, b.x1 * cs - cs * 0.04, 0, cs * 0.04); bowT(c, x, -b.h * cs, cs * 0.085, [Math.sin(b.a), Math.cos(b.a)], H.st.sw); },
    top: function (c, p, cs, H) { bowT(c, p.x * cs, p.y * cs + cs * 0.03, cs * 0.1, [0, 1], H.st.sw); }
  },
  ginger: {
    base: function (c, b, cs) {
      if (b.legs) { [[-0.25, 0.02], [0.25, 0.02]].forEach(function (q) { c.beginPath(); c.arc(q[0] * cs, q[1] * cs - cs * 0.01, cs * 0.04, Math.PI, 0); c.fillStyle = '#fffaf2'; c.fill(); strk(c, 0.5); }); gem(c, 0, b.y0 * cs + cs * 0.02, cs * 0.035, '#ff5a5f'); return; }
      icing(c, b.x0 * cs, b.x1 * cs, b.y0 * cs + cs * 0.03, cs, 3);
      var n = Math.max(1, Math.round((b.x1 - b.x0) / 0.14)); for (var i = 0; i < n; i++) { c.beginPath(); c.arc((b.x0 + (b.x1 - b.x0) * (i + 0.5) / n) * cs, (b.y0 * 0.35 + b.y1 * 0.65) * cs, cs * 0.028, 0, 7); c.fillStyle = ['#ff5a5f', '#4cc77d', '#ffd54a', '#3fb6e6'][i % 4]; c.fill(); strk(c, 0.45); }
    },
    body: function (c, b, cs) {
      icing(c, b.x0 * cs + cs * 0.02, b.x1 * cs - cs * 0.02, (b.y0 + 0.05) * cs, cs, 1);
      for (var i = 0; i < 3; i++) { var y = (b.y0 + (b.y1 - b.y0) * (0.4 + i * 0.2)) * cs; c.beginPath(); c.arc((b.x0 + b.x1) / 2 * cs, y, cs * 0.026, 0, 7); c.fillStyle = ['#ff5a5f', '#4cc77d', '#ffd54a'][i]; c.fill(); strk(c, 0.45); }
      c.beginPath(); for (var k = 0; k <= 8; k++) { var xx = (b.x0 + (b.x1 - b.x0) * k / 8) * cs, yy = (b.y1 - 0.04) * cs + (k % 2 ? -cs * 0.025 : 0); if (!k) c.moveTo(xx, yy); else c.lineTo(xx, yy); } c.strokeStyle = '#fffaf2'; c.lineWidth = cs * 0.03; c.stroke();
    },
    turret: function (c, b, cs) {
      for (var i = 0; i < 4; i++) { var x = (b.x0 + (b.x1 - b.x0) * (0.2 + i * 0.2)) * cs; c.beginPath(); c.moveTo(x - cs * 0.03, -b.h * cs * 0.85); c.quadraticCurveTo(x + cs * 0.03, 0, x - cs * 0.03, b.h * cs * 0.85); c.strokeStyle = '#fffaf2'; c.lineWidth = cs * 0.028; c.stroke(); }
      for (var k = 0; k < 3; k++) { c.beginPath(); c.arc((b.x0 + (b.x1 - b.x0) * (0.3 + k * 0.2)) * cs, -b.h * cs * 0.15, cs * 0.02, 0, 7); c.fillStyle = ['#ff5a5f', '#4cc77d', '#ffd54a'][k]; c.fill(); }
    },
    top: function (c, p, cs) { var x = p.x * cs, y = p.y * cs; c.beginPath(); c.arc(x, y - cs * 0.02, cs * 0.06, Math.PI, 0); c.lineTo(x + cs * 0.06, y + cs * 0.01); c.lineTo(x - cs * 0.06, y + cs * 0.01); c.closePath(); c.fillStyle = '#fffaf2'; c.fill(); strk(c, 0.5); c.beginPath(); c.arc(x, y - cs * 0.07, cs * 0.04, 0, 7); c.fillStyle = '#e8343c'; c.fill(); strk(c, 0.5); c.beginPath(); c.arc(x - cs * 0.012, y - cs * 0.082, cs * 0.012, 0, 7); c.fillStyle = '#fff'; c.fill(); c.beginPath(); c.moveTo(x, y - cs * 0.11); c.quadraticCurveTo(x + cs * 0.03, y - cs * 0.16, x + cs * 0.05, y - cs * 0.15); c.strokeStyle = '#2f7a3f'; c.lineWidth = lwT(0.8); c.stroke(); }
  },
  crystal: {
    base: function (c, b, cs) {
      if (b.legs) { icicles(c, -cs * 0.08, cs * 0.08, b.y0 * cs + cs * 0.02, cs, 3); shard(c, -0.25 * cs, 0.02 * cs, cs * 0.12, cs * 0.035, -0.3); shard(c, 0.25 * cs, 0.02 * cs, cs * 0.12, cs * 0.035, 0.3); return; }
      icicles(c, b.x0 * cs + cs * 0.02, b.x1 * cs - cs * 0.02, b.y0 * cs + cs * 0.02, cs, Math.max(2, Math.round((b.x1 - b.x0) / 0.1)));
      shard(c, b.x0 * cs + cs * 0.02, b.y1 * cs, cs * 0.17, cs * 0.04, -0.35); shard(c, b.x0 * cs + cs * 0.08, b.y1 * cs, cs * 0.1, cs * 0.03, -0.1);
      shard(c, b.x1 * cs - cs * 0.02, b.y1 * cs, cs * 0.15, cs * 0.04, 0.35);
    },
    body: function (c, b, cs, H) {
      c.globalAlpha = 0.85; c.beginPath(); c.moveTo(b.x0 * cs + cs * 0.01, b.y0 * cs + cs * 0.08); c.quadraticCurveTo(b.x0 * cs + cs * 0.1, (b.y0 + b.y1) / 2 * cs, b.x0 * cs + cs * 0.02, b.y1 * cs - cs * 0.04); c.lineTo(b.x0 * cs + cs * 0.005, b.y1 * cs - cs * 0.04); c.closePath(); c.fillStyle = '#f4fbff'; c.fill(); c.globalAlpha = 1;
      frost(c, (b.x0 * 0.3 + b.x1 * 0.7) * cs, (b.y0 * 0.55 + b.y1 * 0.45) * cs, cs * 0.045); frost(c, (b.x0 * 0.6 + b.x1 * 0.4) * cs, (b.y0 * 0.25 + b.y1 * 0.75) * cs, cs * 0.03);
      icicles(c, b.x0 * cs + cs * 0.03, b.x1 * cs - cs * 0.03, b.y0 * cs + cs * 0.01, cs, 3);
    },
    turret: function (c, b, cs) {
      var dn = [Math.sin(b.a), Math.cos(b.a)], n = 4;
      for (var i = 0; i < n; i++) { var x = (b.x0 + (b.x1 - b.x0) * (i + 0.6) / (n + 0.4)) * cs; shard(c, x, -b.h * cs + cs * 0.01, cs * (0.07 + (i % 2) * 0.04), cs * 0.026, 0.5); }
      // сосульки висят вниз по миру, как бы ни был повёрнут ствол
      for (var k = 0; k < 3; k++) { var x2 = (b.x0 + (b.x1 - b.x0) * (0.3 + k * 0.25)) * cs, y2 = (dn[1] >= 0 ? 1 : -1) * b.h * cs, len = cs * (0.07 + (k % 2) * 0.04);
        c.beginPath(); c.moveTo(x2 - cs * 0.024, y2); c.lineTo(x2 + dn[0] * len, y2 + dn[1] * len); c.lineTo(x2 + cs * 0.024, y2); c.closePath(); c.fillStyle = 'rgba(214,244,255,0.95)'; c.fill(); c.lineWidth = lwT(0.5); c.strokeStyle = '#4f9bd0'; c.stroke(); }
      frost(c, (b.x0 * 0.4 + b.x1 * 0.6) * cs, 0, cs * 0.035);
    },
    top: function (c, p, cs) { var x = p.x * cs, y = p.y * cs + cs * 0.02; shard(c, x - cs * 0.06, y, cs * 0.09, cs * 0.025, -0.45); shard(c, x + cs * 0.06, y, cs * 0.09, cs * 0.025, 0.45); shard(c, x, y - cs * 0.01, cs * 0.15, cs * 0.032, 0); }
  },
  garland: {
    base: function (c, b, cs, H) { if (b.legs) { needles(c, -0.22 * cs, 0.22 * cs, -0.02 * cs, cs, H.t); return; } needles(c, b.x0 * cs - cs * 0.02, b.x1 * cs + cs * 0.02, b.y1 * cs - cs * 0.02, cs, H.t); },
    body: function (c, b, cs, H) {
      var n = 22, pts = [], i;
      for (i = 0; i <= n; i++) { var k = i / n, y = (b.y1 - (b.y1 - b.y0) * k) * cs, half = ((b.x1 - b.x0) / 2) * (1 - (b.taper || 0) * k * 0.5) * cs, ph = k * Math.PI * 4.2, mx = (b.x0 + b.x1) / 2 * cs; pts.push([mx + Math.sin(ph) * half, y + Math.cos(ph) * cs * 0.025, Math.cos(ph)]); }
      for (i = 1; i <= n; i++) { c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.globalAlpha = pts[i][2] < 0 ? 0.35 : 1; c.strokeStyle = '#1f6b43'; c.lineWidth = lwT(0.9); c.stroke(); }
      c.globalAlpha = 1; for (i = 1; i < n; i += 2) bulb(c, pts[i][0], pts[i][1] + cs * 0.02, cs * 0.025, i, H.t, pts[i][2] < 0);
    },
    turret: function (c, b, cs, H) {
      var i, n = 18, x0 = b.x0 * cs, x1 = b.x1 * cs;
      c.beginPath(); for (i = 0; i <= n; i++) { var x = x0 + (x1 - x0) * i / n, y = Math.sin(i / n * Math.PI * 3) * b.h * cs * 0.85; if (!i) c.moveTo(x, y); else c.lineTo(x, y); } c.strokeStyle = '#1f6b43'; c.lineWidth = lwT(0.9); c.stroke();
      for (i = 1; i < n; i += 3) bulb(c, x0 + (x1 - x0) * i / n, Math.sin(i / n * Math.PI * 3) * b.h * cs * 0.85, cs * 0.024, i, H.t);
      // провисшая нитка под стволом: провисает вниз по миру и раскачивается
      var sw = H.st.sw, a = b.a + sw, dx = Math.sin(a), dy = Math.cos(a), sag = cs * (0.13 + Math.abs(sw) * 0.05), ax = x0 + cs * 0.04, bx = x1 - cs * 0.06, mx = (ax + bx) / 2 + dx * sag, my = dy * sag;
      c.beginPath(); c.moveTo(ax, 0); c.quadraticCurveTo(mx, my, bx, 0); c.strokeStyle = '#1f6b43'; c.lineWidth = lwT(0.8); c.stroke();
      for (i = 1; i < 5; i++) { var q = i / 5, px = (1 - q) * (1 - q) * ax + 2 * q * (1 - q) * mx + q * q * bx, py = 2 * q * (1 - q) * my; bulb(c, px + dx * cs * 0.02, py + dy * cs * 0.02, cs * 0.026, i + 2, H.t); }
    },
    top: function (c, p, cs, H) { star5b(c, p.x * cs, p.y * cs - cs * 0.05, cs * 0.08, '#ffd54a', H.t); }
  },
  royal: {
    base: function (c, b, cs, H) {
      if (b.legs) { [-0.25, 0.25].forEach(function (x) { c.beginPath(); c.arc(x * cs, 0, cs * 0.04, 0, 7); c.fillStyle = '#ffd54a'; c.fill(); strk(c, 0.5); }); gem(c, 0, b.y0 * cs, cs * 0.04, '#ff4f7b'); return; }
      var x0 = b.x0 * cs - cs * 0.015, x1 = b.x1 * cs + cs * 0.015, y0 = b.y0 * cs, h = (b.y1 - b.y0) * cs * 0.62, n = Math.max(2, Math.round((b.x1 - b.x0) / 0.15)), w = (x1 - x0) / n, i;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); for (i = n; i > 0; i--) { c.quadraticCurveTo(x0 + w * (i - 0.5), y0 + h * 1.25, x0 + w * (i - 1), y0 + h * 0.75); } c.closePath();
      c.fillStyle = '#b3203a'; c.fill(); strk(c, 0.7);
      c.beginPath(); for (i = n; i > 0; i--) { if (i === n) c.moveTo(x0 + w * i, y0 + h * 0.75); c.quadraticCurveTo(x0 + w * (i - 0.5), y0 + h * 1.25, x0 + w * (i - 1), y0 + h * 0.75); } c.strokeStyle = '#ffd54a'; c.lineWidth = cs * 0.025; c.stroke();
      ribbonH(c, x0, x1, y0 + cs * 0.012, cs * 0.035);
      for (i = 0; i < n; i++) gem(c, x0 + w * (i + 0.5), y0 + h * 0.45, cs * 0.026, ['#3fb6e6', '#4cc77d', '#ff4f7b'][i % 3]);
      // кисти на углах качаются маятником
      [x0, x1].forEach(function (tx, k) { var ang = H.st.sw * (k ? 1 : -1) * 0.8, ex = tx + Math.sin(ang) * cs * 0.1, ey = y0 + Math.cos(ang) * cs * 0.1; c.beginPath(); c.moveTo(tx, y0); c.lineTo(ex, ey); c.strokeStyle = '#e0a81e'; c.lineWidth = lwT(0.7); c.stroke(); c.beginPath(); c.moveTo(ex, ey - cs * 0.015); c.lineTo(ex - cs * 0.025, ey + cs * 0.05); c.lineTo(ex + cs * 0.025, ey + cs * 0.05); c.closePath(); c.fillStyle = '#ffd54a'; c.fill(); strk(c, 0.45); });
    },
    body: function (c, b, cs) {
      [b.y0 + 0.03, b.y1 - 0.04].forEach(function (y) { c.beginPath(); c.rect(b.x0 * cs, y * cs - cs * 0.022, (b.x1 - b.x0) * cs, cs * 0.044); c.fillStyle = '#ffd54a'; c.fill(); strk(c, 0.55); });
      gem(c, (b.x0 + b.x1) / 2 * cs, (b.y0 + b.y1) / 2 * cs, cs * 0.045, '#ff4f7b');
      [-1, 1].forEach(function (d) { gem(c, ((b.x0 + b.x1) / 2 + d * (b.x1 - b.x0) * 0.27) * cs, (b.y0 + b.y1) / 2 * cs, cs * 0.026, '#3fb6e6'); });
    },
    turret: function (c, b, cs) {
      [b.x0 + 0.04, b.x1 - 0.05].forEach(function (x) { c.beginPath(); c.rect(x * cs - cs * 0.022, -b.h * cs - cs * 0.01, cs * 0.044, (b.h * 2 + 0.02) * cs); c.fillStyle = '#ffd54a'; c.fill(); strk(c, 0.55); });
      var gx = (b.x0 * 0.45 + b.x1 * 0.55), gy = b.pv && Math.abs(gx) < b.pv + 0.04 ? -b.h * 0.6 : 0; gem(c, gx * cs, gy * cs, cs * 0.038, '#ff4f7b');
    },
    top: function (c, p, cs, H) { crown(c, p.x * cs, p.y * cs + cs * 0.03, cs, H.st.sw, H.tw.recoil ? Math.min(1, H.tw.recoil / 0.12) : 0); }
  }
};
D.twHook = function (part, b) {
  if (!HK) return; var d = DRESS[HK.sk.id], f = d && d[part]; if (!f) return;
  var c = HK.c; c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; try { f(c, b, HK.cs, HK); } catch (e) { if (window.__rep) window.__rep(e); } c.restore();
};
// ---------- частицы с физикой ----------
function muzzle(tw, cs) {
  var a = tw.ang || 0, T = tw.type;
  if (T === 'mg' || T === 'ice') return [Math.cos(a) * 0.46, -0.3 + Math.sin(a) * 0.46];
  if (T === 'ballista') return [Math.cos(a) * 0.4, -0.32 + Math.sin(a) * 0.4];
  if (T === 'mortar') return [Math.cos(a) * 0.06, -0.62]; if (T === 'tesla') return [0, -0.72];
  return [Math.cos(a) * 0.3, -0.62];
}
function emit(st, id, x, y, burst) {
  var P = st.p; if (P.length > 46) return; var r = Math.random, q;
  if (id === 'crystal') q = burst ? { k: 'sh', x: x, y: y, vx: (r() - 0.5) * 2.2, vy: (r() - 0.7) * 2, g: 3, life: 0.6, s: 0.03 + r() * 0.02, rot: r() * 6, vr: (r() - 0.5) * 12, col: '#e6f8ff' } : { k: 'fl', x: (r() - 0.5) * 0.9, y: -0.95 - r() * 0.2, vx: (r() - 0.5) * 0.1, vy: 0.22 + r() * 0.12, g: 0, life: 2.6, s: 0.025 + r() * 0.02, rot: r() * 6, vr: (r() - 0.5) * 2, ph: r() * 6, col: '#ffffff' };
  else if (id === 'gift') q = { k: 'cf', x: x, y: y, vx: (r() - 0.5) * 2.4, vy: -0.6 - r() * 1.6, g: 4, life: 1.1, s: 0.025 + r() * 0.015, rot: r() * 6, vr: (r() - 0.5) * 18, col: BULB[(r() * 5) | 0] };
  else if (id === 'ginger') q = { k: 'cr', x: x, y: y, vx: (r() - 0.5) * 1.6, vy: -0.4 - r() * 1.1, g: 5, life: 1, s: 0.018 + r() * 0.018, rot: r() * 6, vr: (r() - 0.5) * 10, col: r() < 0.3 ? '#fffaf2' : r() < 0.6 ? '#b8743c' : '#8a5426' };
  else if (id === 'garland') q = burst ? { k: 'sp', x: x, y: y, vx: (r() - 0.5) * 2, vy: (r() - 0.6) * 1.8, g: 2.5, life: 0.5, s: 0.03, rot: 0, vr: 0, col: BULB[(r() * 5) | 0] } : { k: 'tw', x: (r() - 0.5) * 0.7, y: -0.2 - r() * 0.5, vx: 0, vy: -0.05, g: 0, life: 0.7, s: 0.035, rot: 0, vr: 0, col: BULB[(r() * 5) | 0] };
  else if (id === 'royal') q = burst ? { k: 'cn', x: x, y: y, vx: (r() - 0.5) * 1.8, vy: -0.8 - r() * 1.2, g: 5, life: 1.3, s: 0.035, rot: r() * 6, vr: (r() - 0.5) * 14, col: '#ffd54a' } : { k: 'gl', x: (r() - 0.5) * 0.6, y: -0.6 - r() * 0.3, vx: (r() - 0.5) * 0.2, vy: 0, g: 0.9, life: 1.4, s: 0.02 + r() * 0.015, rot: 0, vr: 0, col: r() < 0.5 ? '#ffe680' : '#fff6d0' };
  if (q) { q.t = 0; P.push(q); }
}
function stepParts(st, dt, t) {
  var P = st.p;
  for (var i = P.length - 1; i >= 0; i--) {
    var q = P[i]; q.t += dt; if (q.t >= q.life) { P.splice(i, 1); continue; }
    q.vy += q.g * dt; if (q.k === 'fl') q.vx = Math.sin(t * 2 + q.ph) * 0.12; else { q.vx *= (1 - 1.2 * dt); }
    if (q.k === 'cf') { q.vy = Math.min(q.vy, 0.9); }   // конфетти парит
    q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt;
    if (q.y > 0.12 && q.g > 0) { q.y = 0.12; q.vy *= -0.38; q.vx *= 0.6; q.vr *= 0.5; if (Math.abs(q.vy) < 0.15) { q.vy = 0; q.g = 0; q.vx = 0; q.vr = 0; } }
    if (q.k === 'fl' && q.y > 0.1) q.life = Math.min(q.life, q.t + 0.15);
  }
}
function drawParts(c, st, x, y, cs, t) {
  var P = st.p; if (!P.length) return; c.save();
  for (var i = 0; i < P.length; i++) {
    var q = P[i], a = Math.min(1, (q.life - q.t) / 0.3), px = x + q.x * cs, py = y + q.y * cs, s = q.s * cs;
    c.globalAlpha = a; c.save(); c.translate(px, py); c.rotate(q.rot);
    if (q.k === 'fl') frost(c, 0, 0, s);
    else if (q.k === 'sh') { c.beginPath(); c.moveTo(0, -s * 1.4); c.lineTo(s * 0.5, 0); c.lineTo(0, s * 1.4); c.lineTo(-s * 0.5, 0); c.closePath(); c.fillStyle = q.col; c.fill(); c.strokeStyle = '#5fa8dc'; c.lineWidth = Math.max(0.8, s * 0.25); c.stroke(); }
    else if (q.k === 'cf') { c.scale(1, Math.cos(q.rot * 1.7)); c.fillStyle = q.col; c.fillRect(-s, -s * 0.5, s * 2, s); }
    else if (q.k === 'cr') { c.beginPath(); c.moveTo(-s, -s * 0.4); c.lineTo(s * 0.6, -s); c.lineTo(s, s * 0.6); c.lineTo(-s * 0.4, s); c.closePath(); c.fillStyle = q.col; c.fill(); }
    else if (q.k === 'cn') { c.scale(Math.max(0.15, Math.abs(Math.cos(q.rot))), 1); c.beginPath(); c.arc(0, 0, s, 0, 7); c.fillStyle = '#ffd54a'; c.fill(); c.lineWidth = Math.max(0.8, s * 0.2); c.strokeStyle = '#b07d10'; c.stroke(); c.beginPath(); c.arc(0, 0, s * 0.55, 0, 7); c.stroke(); }
    else { var k = q.k === 'tw' ? Math.sin(q.t / q.life * Math.PI) : 1; c.globalAlpha = a * k; c.fillStyle = q.col; c.beginPath(); for (var j = 0; j < 8; j++) { var an = j * Math.PI / 4, rr2 = j % 2 ? s * 0.3 : s; c.lineTo(Math.cos(an) * rr2, Math.sin(an) * rr2); } c.closePath(); c.fill(); }
    c.restore();
  }
  c.restore();
}
function physStep(st, tw, sk, t, cs) {
  var dt = st.t < 0 ? 0 : Math.max(0, Math.min(0.05, t - st.t)); st.t = t; if (!dt) return 0;
  var a = tw.ang || 0, da = a - st.a; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; st.a = a;
  var rc = tw.recoil || 0, kick = rc > st.rc + 0.01; st.rc = rc;
  // пружина: качается от поворота ствола и от выстрела, затухает
  st.sv += (-70 * st.sw - 6 * st.sv) * dt - da * 18 + (kick ? (Math.random() < 0.5 ? -1 : 1) * 3 : 0); st.sw += st.sv * dt; st.sw = Math.max(-0.9, Math.min(0.9, st.sw));
  stepParts(st, dt, t);
  if (kick && (t - (st.kt || 0)) > 0.14) { st.kt = t; var m = muzzle(tw, cs), n = sk.id === 'gift' ? 7 : sk.id === 'royal' ? 3 : 5; for (var i = 0; i < n; i++) emit(st, sk.id, m[0], m[1], true); }
  var rate = { crystal: 3, royal: 2.5, garland: 2, gift: 0, ginger: 0 }[sk.id] || 0;
  st.em += rate * dt; while (st.em >= 1) { st.em -= 1; emit(st, sk.id, 0, 0, false); }
  return dt;
}
function twBack(sk, tw, x, y, cs, t) {
  var c = D.ctx;
  if (sk.id === 'crystal') { var g = c.createRadialGradient(x, y - cs * 0.4, 0, x, y - cs * 0.4, cs * 0.7); g.addColorStop(0, 'rgba(160,225,255,0.45)'); g.addColorStop(1, 'rgba(160,225,255,0)'); c.fillStyle = g; c.fillRect(x - cs * 0.7, y - cs * 1.1, cs * 1.4, cs * 1.4); }
  if (sk.id === 'royal') { var g2 = c.createRadialGradient(x, y - cs * 0.4, 0, x, y - cs * 0.4, cs * 0.65); g2.addColorStop(0, 'rgba(255,214,90,0.35)'); g2.addColorStop(1, 'rgba(255,214,90,0)'); c.fillStyle = g2; c.fillRect(x - cs * 0.7, y - cs * 1.1, cs * 1.4, cs * 1.4); }
}
var oldTower = D.tower;
D.tower = function (tw, x, y, cs, t) {
  var sk = tw && Z.towerSkin(tw.type); if (!sk || typeof Proxy === 'undefined') return oldTower.apply(this, arguments);
  t = t || 0; var real = D.ctx, st = hkState(tw, x, y);
  try { physStep(st, tw, sk, t, cs); twBack(sk, tw, x, y, cs, t); } catch (e) { if (window.__rep) window.__rep(e); }
  var prev = curSkin, pm = tintMode, ph = HK; curSkin = sk; tintMode = 'grey'; HK = { sk: sk, tw: tw, c: real, st: st, t: t, cs: cs }; D.setCtx(skinCtx(real));
  try { return oldTower.apply(this, arguments); } finally { D.setCtx(real); curSkin = prev; tintMode = pm; HK = ph; try { drawParts(real, st, x, y, cs, t); } catch (e) { if (window.__rep) window.__rep(e); } }
};
// площадка под вышкой — в стиле облика
D.twPad = function (tw, px, py, cs) {
  var sk = tw && Z.towerSkin(tw.type); if (!sk) return false; var c = D.ctx, id = sk.id, l = Math.max(1, cs * 0.03);
  var side = { gift: '#c9302c', ginger: '#9a5a2a', crystal: '#7cc4ea', garland: '#2c7a4b', royal: '#d39a1c' }[id], top = { gift: '#e8484f', ginger: '#c98a4e', crystal: '#d6f1ff', garland: '#eef6ff', royal: '#ffd54a' }[id];
  c.save(); c.beginPath(); c.ellipse(px, py + cs * 0.06, cs * 0.36, cs * 0.13, 0, 0, Math.PI); c.lineTo(px - cs * 0.36, py); c.ellipse(px, py, cs * 0.36, cs * 0.13, 0, Math.PI, 0, true); c.fillStyle = side; c.fill(); c.lineWidth = l; c.strokeStyle = OL2; c.stroke();
  c.beginPath(); c.ellipse(px, py, cs * 0.36, cs * 0.13, 0, 0, Math.PI * 2); c.fillStyle = top; c.fill(); c.stroke();
  if (id === 'gift') { c.fillStyle = '#ffd54a'; c.fillRect(px - cs * 0.035, py - cs * 0.13, cs * 0.07, cs * 0.32); c.beginPath(); c.ellipse(px, py, cs * 0.36, cs * 0.035, 0, 0, Math.PI * 2); c.fill(); }
  else if (id === 'ginger') { for (var i = 0; i < 10; i++) { var a = i / 10 * Math.PI * 2; c.beginPath(); c.arc(px + Math.cos(a) * cs * 0.3, py + Math.sin(a) * cs * 0.1, cs * 0.022, 0, 7); c.fillStyle = i % 2 ? '#fffaf2' : ['#ff5a5f', '#4cc77d', '#ffd54a'][i % 3]; c.fill(); } }
  else if (id === 'crystal') { c.globalAlpha = 0.7; c.beginPath(); c.ellipse(px - cs * 0.1, py - cs * 0.03, cs * 0.14, cs * 0.04, -0.15, 0, 7); c.fillStyle = '#fff'; c.fill(); c.globalAlpha = 1; }
  else if (id === 'garland') { c.save(); c.beginPath(); c.ellipse(px, py + cs * 0.03, cs * 0.38, cs * 0.14, 0, 0, Math.PI); c.lineWidth = cs * 0.07; c.strokeStyle = '#1f6b43'; c.stroke(); c.restore(); for (var j = 0; j < 6; j++) { var b2 = Math.PI * (j + 0.5) / 6; bulbW(c, px + Math.cos(b2) * cs * 0.38, py + cs * 0.03 + Math.sin(b2) * cs * 0.14, cs * 0.026, j); } }
  else if (id === 'royal') { c.beginPath(); c.ellipse(px, py, cs * 0.27, cs * 0.09, 0, 0, Math.PI * 2); c.fillStyle = '#b3203a'; c.fill(); c.stroke(); }
  c.restore(); return true;
};
function bulbW(c, x, y, r, i) { var hk = HK; HK = { cs: r / 0.026 }; bulb(c, x, y, r, i, Z.time); HK = hk; }
Z.giveSkin = function (hero, id, quiet) { fix(); var k = hero + ':' + id; if (Z.save.skins.own[k]) return false; Z.save.skins.own[k] = 1; Z.save.skins.on[hero] = id; if (!quiet) UI.toast(TT('Новый облик: ', 'New look: ') + T('al_' + hero).split(' — ')[0] + ' — ' + (Z.LANG === 'en' ? SKIN[id].en : SKIN[id].ru), '#ff8fd6'); Z.persist(true); return true; };

// =====================================================================================
// НОВОГОДНИЙ КАЛЕНДАРЬ: 24 окошка, одно в день; пропуски не сгорают
// =====================================================================================
var CAL = [['toy', 'ball_r'], ['fl', 4], ['toy', 'icicle'], ['toy', 'cone'], ['fl', 5], ['toy', 'snowman'], ['top', 'snowflake'], ['toy', 'rocket'],
  ['fl', 6], ['toy', 'corn'], ['toy', 'matr'], ['lights', 'gold'], ['toy', 'owl'], ['skin', 'moroz:ice'], ['toy', 'samovar'], ['fl', 8],
  ['toy', 'bullfinch'], ['toy', 'airship'], ['tinsel', 'gold'], ['toy', 'clock'], ['toy', 'lantern'], ['fl', 10], ['toy', 'cosmo'], ['top', 'comet']];
var CAL_TOYS = {}; CAL.forEach(function (q) { if (q[0] === 'toy') CAL_TOYS[q[1]] = 1; });
function grant(g) {
  if (g[0] === 'toy') { if (!Z.giveToy(g[1])) { Z.save.flakes += 4; UI.toast('+4 ' + TT('снежинки', 'snowflakes'), '#9fdcff'); } }
  else if (g[0] === 'fl') { Z.save.flakes += g[1]; UI.toast('+' + g[1] + ' ' + TT('снежинок', 'snowflakes'), '#9fdcff'); }
  else if (g[0] === 'skin') { var p = g[1].split(':'); Z.giveSkin(p[0], p[1]); }
  else { Z.save.deco.own[g[0] + '_' + g[1]] = 1; Z.save.deco[g[0]] = g[1]; UI.toast(TT('Новое украшение для ёлки!', 'New tree decoration!'), '#9dff6a'); }
  Z.AU.sfx('reward'); Z.persist(true);
}
function grantIcon(g, x, y, r) {
  if (g[0] === 'toy') drawToy(g[1], x, y, r * 0.75, Z.time);
  else if (g[0] === 'fl') { D.flakeIcon(x, y - r * 0.15, r * 0.55); D.text('+' + g[1], x, y + r * 0.62, r * 0.6, '#2a8bbd', 'center', 'middle'); }
  else if (g[0] === 'top') drawTop(g[1], x, y, r * 0.6, Z.time, Math.max(1, r * 0.08));
  else if (g[0] === 'lights') { for (var k = 0; k < 4; k++) D.circ(x - r * 0.6 + k * r * 0.4, y + Math.sin(k * 1.6) * r * 0.2, r * 0.17, LIGHTS[g[1]][3][k % LIGHTS[g[1]][3].length], 1); }
  else if (g[0] === 'tinsel') { var c = D.ctx; c.strokeStyle = TINSEL[g[1]][3]; c.lineWidth = r * 0.22; c.beginPath(); c.moveTo(x - r * 0.75, y - r * 0.2); c.quadraticCurveTo(x, y + r * 0.5, x + r * 0.75, y - r * 0.2); c.stroke(); }
  else if (g[0] === 'skin') { var p = g[1].split(':'), sv = Z.save.skins.on[p[0]], so = Z.save.skins.own[g[1]]; Z.save.skins.on[p[0]] = p[1]; Z.save.skins.own[g[1]] = 1; D.ally(p[0], x, y + r * 0.8, r * 0.8, { dir: 1 }); Z.save.skins.on[p[0]] = sv; if (!so) delete Z.save.skins.own[g[1]]; }
}
Z.calDone = function () { return (Z.save.cal.n || 0) >= CAL.length; };

// =====================================================================================
// SDK: покупки, вход, оценка, ярлык
// =====================================================================================
var SDK = Z.SDK27 = {}, PAY = null, CAT = {}, payTried = false;
var PRODUCTS = [
  { id: 'starter', perm: true, ru: 'Стартовый набор', en: 'Starter pack', dru: 'Золотой Дед Мороз, «Царская» для всех вышек, 60 снежинок, 3 золотые игрушки, гирлянда «Бегущая радуга»', den: 'Golden Grandfather Frost, Royal look for all towers, 60 snowflakes, 3 golden ornaments, Running Rainbow lights, golden Grandfather Frost', price: 49 },
  { id: 'noads', perm: true, ru: 'Отключить рекламу', en: 'Remove ads', dru: 'Без рекламы между уровнями и без баннера. Бонусы за рекламу — только если сам захочешь', den: 'Removes ads between levels. Optional reward ads stay', price: 99 },
  { id: 'heroes', perm: true, ru: 'Все герои сразу', en: 'All heroes now', dru: 'Открывает всех героев для отряда на любом уровне с 4-го', den: 'Unlocks every hero for squads from level 4 on', price: 99 },
  { id: 'fl30', fl: 30, ru: 'Горсть снежинок', en: 'Handful of snowflakes', dru: '30 снежинок', den: '30 snowflakes', price: 29 },
  { id: 'fl100', fl: 100, ru: 'Мешок снежинок', en: 'Bag of snowflakes', dru: '100 снежинок', den: '100 snowflakes', price: 79 },
  { id: 'fl250', fl: 250, ru: 'Сугроб снежинок', en: 'Drift of snowflakes', dru: '250 снежинок', den: '250 snowflakes', price: 149 }
];
var PROD = {}; PRODUCTS.forEach(function (p) { PROD[p.id] = p; });
Z.PRODUCTS = PRODUCTS;
Z.applyProduct = function (id, restoring) { applyProduct(id, restoring); };
// 2.11.5: в Стартовом наборе — «Царская» для всех вышек (и у тех, кто купил набор раньше)
function royalTowers() { var sk = twSk(); if (!sk) return; (Z.TOWER_ORDER || []).forEach(function (t) { sk.tw[t + ':royal'] = 1; }); }
setInterval(function () { try { if (Z.save && Z.save.shop && Z.save.shop.starter) { var sk = twSk(); if (sk && !sk.tw['snow:royal']) royalTowers(); } } catch (e) { if (window.__rep) window.__rep(e); } }, 3000);   // 2.11.5: для оплаты голосами ВК (plat.js)
function applyProduct(id, restoring) {
  fix(); var p = PROD[id]; if (!p) return;
  if (p.fl) { Z.save.flakes += p.fl; UI.toast('+' + p.fl + ' ' + TT('снежинок', 'snowflakes'), '#9fdcff'); }
  else if (id === 'noads') { if (!Z.save.shop.noads) { Z.save.shop.noads = 1; if (!restoring) UI.toast(TT('Реклама между уровнями отключена', 'Ads between levels are off'), '#9dff6a'); } try { Z.SDK.ysdk.adv.hideBannerAdv(); } catch (e) { if (window.__rep) window.__rep(e); } }
  else if (id === 'heroes') { if (!Z.save.shop.heroes) { Z.save.shop.heroes = 1; if (!restoring) UI.toast(TT('Все герои открыты!', 'All heroes unlocked!'), '#9dff6a'); } }
  else if (id === 'starter') {
    if (!Z.save.shop.starter) {
      Z.save.shop.starter = 1;
      if (!restoring || !Z.save.deco.toys.gold_nut) { Z.save.flakes += 60; }
      ['gold_nut', 'gold_fish', 'gold_egg'].forEach(function (q) { Z.giveToy(q, true); });
      Z.save.deco.own.lights_rainbow = 1; Z.save.deco.lights = 'rainbow';
      Z.giveSkin('moroz', 'gold', true);
      if (!restoring) UI.toast(TT('Стартовый набор получен!', 'Starter pack received!'), '#ffd54a');
    }
    royalTowers();
  }
  Z.persist(true);
}
// незавершённые покупки: постоянные — восстанавливаем, расходуемые — начисляем и списываем (consumePurchase)
function processPurchases() {
  if (!PAY) return;
  try {
    PAY.getPurchases().then(function (list) {
      (list || []).forEach(function (pur) {
        var p = PROD[pur.productID]; if (!p) return;
        if (p.perm) applyProduct(p.id, true);
        else {
          if (!Z.save.shop.tok[pur.purchaseToken]) { Z.save.shop.tok[pur.purchaseToken] = 1; applyProduct(p.id); }
          PAY.consumePurchase(pur.purchaseToken).then(function () { delete Z.save.shop.tok[pur.purchaseToken]; Z.persist(true); }).catch(function () {});
        }
      });
    }).catch(function () {});
  } catch (e) { if (window.__rep) window.__rep(e); }
}
function initPay() {
  if (payTried || !Z.SDK.ysdk || !Z.loaded) return; payTried = true;
  try {
    Z.SDK.ysdk.getPayments({ signed: false }).then(function (p) {
      PAY = p;
      p.getCatalog().then(function (list) { (list || []).forEach(function (q) { CAT[q.id] = q; }); }).catch(function () {});
      processPurchases();
    }).catch(function () {});
  } catch (e) { if (window.__rep) window.__rep(e); }
  try { Z.SDK.ysdk.shortcut.canShowPrompt().then(function (r) { SDK.canShortcut = !!(r && r.canShow); }).catch(function () {}); } catch (e) { if (window.__rep) window.__rep(e); }
  try { Z.SDK.ysdk.feedback.canReview().then(function (r) { SDK.canReview = !!(r && r.value); }).catch(function () {}); } catch (e) { if (window.__rep) window.__rep(e); }
  if (Z.save.shop.noads) { try { Z.SDK.ysdk.adv.hideBannerAdv(); } catch (e) { if (window.__rep) window.__rep(e); } }
}
SDK.payReady = function () { return !!PAY || !!Z.testPay; };
SDK.priceOf = function (id) { var c = CAT[id]; if (c) return c.price || (c.priceValue + ' ' + (c.priceCurrencyCode || '')); return Z.testPay ? PROD[id].price + ' YAN' : '—'; };
SDK.buy = function (id, cb) {
  if (Z.testPay && !PAY) { applyProduct(id); if (cb) cb(true); return; }
  if (!PAY) { if (cb) cb(false); return; }
  adOpenSoft();
  PAY.purchase({ id: id }).then(function (pur) {
    adCloseSoft();
    var p = PROD[id];
    if (p.perm) applyProduct(id);
    else { Z.save.shop.tok[pur.purchaseToken] = 1; applyProduct(id); PAY.consumePurchase(pur.purchaseToken).then(function () { delete Z.save.shop.tok[pur.purchaseToken]; Z.persist(true); }).catch(function () {}); }
    if (cb) cb(true);
  }).catch(function () { adCloseSoft(); if (cb) cb(false); });
};
function adOpenSoft() { Z.adShowing = true; Z.onPauseChange(); }
function adCloseSoft() { Z.adShowing = false; Z.onPauseChange(); }
SDK.authorized = function () { var p = Z.SDK.player; try { if (!p) return false; if (p.isAuthorized) return !!p.isAuthorized(); return p.getMode ? p.getMode() !== 'lite' : false; } catch (e) { return false; } };
SDK.playerName = function () { try { return Z.SDK.player && Z.SDK.player.getName ? Z.SDK.player.getName() : ''; } catch (e) { return ''; } };
// вход: после диалога заново берём игрока и сводим прогресс — остаётся тот, где больше звёзд
SDK.login = function (done) {
  var y = Z.SDK.ysdk; if (!y || !y.auth) { if (done) done(false); return; }
  adOpenSoft();
  y.auth.openAuthDialog().then(function () {
    y.getPlayer().then(function (p) {
      Z.SDK.player = p; adCloseSoft();
      Z.SDK.loadCloud(function (cloud) {
        var co = null; try { co = cloud ? JSON.parse(cloud) : null; } catch (e) { if (window.__rep) window.__rep(e); }
        var cs = 0; if (co && co.stars) for (var k in co.stars) cs += co.stars[k] || 0;
        if (co && co.v === 2 && cs > Z.totalStars()) { var was0 = JSON.parse(JSON.stringify(Z.save)); Z.adoptSave(co); if (Z.mergeOwned) Z.mergeOwned(Z.save, was0); fix(); UI.toast(TT('Прогресс загружен из облака', 'Progress loaded from the cloud'), '#9dff6a'); }
        Z.persist(true); processPurchases(); if (done) done(true);
      });
    }).catch(function () { adCloseSoft(); if (done) done(false); });
  }).catch(function () { adCloseSoft(); if (done) done(false); });
};
SDK.askShortcut = function (done) {
  var y = Z.SDK.ysdk; if (!y || !y.shortcut) { if (done) done(false); return; }
  y.shortcut.showPrompt().then(function (r) {
    var ok = r && r.outcome === 'accepted'; SDK.canShortcut = false;
    if (ok && !Z.save.meta.shortcut) { Z.save.meta.shortcut = 1; Z.save.flakes += 10; UI.toast(TT('Спасибо! +10 снежинок', 'Thanks! +10 snowflakes'), '#9fdcff'); Z.persist(true); }
    if (done) done(ok);
  }).catch(function () { if (done) done(false); });
};
SDK.askReview = function () {
  var y = Z.SDK.ysdk; if (!y || !y.feedback) return;
  try { y.feedback.canReview().then(function (r) { if (r && r.value) y.feedback.requestReview().catch(function () {}); }).catch(function () {}); } catch (e) { if (window.__rep) window.__rep(e); }
};

// межстраничная реклама: не чаще раза в 90 с, не сразу после рекламы за награду, не у купивших «без рекламы»
Z.canInter = function () { fix(); return !Z.save.shop.noads && Z.unlockedLevel() >= 2 && Z.time - (Z.lastFullAd || -999) > F('inter_cd', 90) && Z.time - (Z.lastReward || -999) > 40; };

// «Все герои сразу»
var oldHO = Z.heroOpen;
Z.heroOpen = function (t, idx) { return oldHO(t, idx) || (!!Z.save.shop.heroes && idx >= 3); };
var oldAU = Z.allyUnlocked;
Z.allyUnlocked = function (t) { return oldAU(t) || !!Z.save.shop.heroes; };

// =====================================================================================
// ПОБЕДЫ: игрушка за первые три звезды, просьба оценить, вход, ярлык — по одной за возвращение на карту
// =====================================================================================
var prevStars = 0, after = null;
var oldGo = UI.goLevel;
UI.goLevel = function (idx, h) { prevStars = Z.save.stars[idx] || 0; return oldGo.apply(this, arguments); };
var oldEnd = UI.onLevelEnd;
UI.onLevelEnd = function () {
  var G = Z.G; fix();
  if (G && G.result && G.result.win && !G.endless) {
    Z.save.meta.wins = (Z.save.meta.wins || 0) + 1;
    var w = Z.save.meta.wins;
    after = { t: Z.time, toy: null };
    if (G.result.stars >= 3 && prevStars < 3) after.toy = Z.randomToy();
    if (w === 3 && !Z.save.meta.review) after.ask = 'review';
    else if (w >= 5 && !Z.save.meta.loginAsk && !SDK.authorized() && Z.SDK.ysdk) after.ask = 'login';
    else if (w >= 7 && !Z.save.meta.shortcut && SDK.canShortcut && !Z.save.meta.scAsk) after.ask = 'shortcut';
    Z.persist(true);
  }
  return oldEnd.apply(this, arguments);
};
function afterWin() {
  if (!after || UI.modal || UI.screen !== 'map') return;
  var a = after; after = null;
  if (a.toy && Z.giveToy(a.toy, true)) UI.openModal({ type: 'toyNew', toy: a.toy });
  if (a.ask === 'review') { Z.save.meta.review = 1; Z.persist(true); setTimeout(function () { SDK.askReview(); }, 600); }
  else if (a.ask === 'login') { Z.save.meta.loginAsk = 1; Z.persist(true); UI.openModal({ type: 'login' }); }
  else if (a.ask === 'shortcut') { Z.save.meta.scAsk = 1; Z.persist(true); UI.openModal({ type: 'scOffer' }); }
}

// =====================================================================================
// ДОСТИЖЕНИЯ: новые цели с игрушками в награду
// =====================================================================================
Z.ACH.push(
  { id: 'toys10', stat: 'toys', need: 10, rw: 5, toy: 'heart' }, { id: 'toys25', stat: 'toys', need: 25, rw: 10, toy: 'parrot' },
  { id: 'cal7', stat: 'calDays', need: 7, rw: 5, toy: 'house' }, { id: 'cal24', stat: 'calDays', need: 24, rw: 12, toy: 'fir' },
  { id: 'stars50', stat: 'starsT', need: 50, rw: 6, toy: 'bear' }, { id: 'stars105', stat: 'starsT', need: 105, rw: 15, toy: 'moon' },
  { id: 'skin1', stat: 'skins', need: 1, rw: 3, toy: 'penguin' }, { id: 'hang12', stat: 'hung', need: 12, rw: 4, toy: 'bunny' }
);
function syncStats() {
  var st = Z.save.stats; st.toys = Object.keys(Z.save.deco.toys).length; st.calDays = Z.save.cal.n || 0; st.starsT = Z.totalStars();
  st.skins = Object.keys(Z.save.skins.own).length; st.hung = Z.save.deco.hang.length;
}
Z.syncStats27 = syncStats;

// =====================================================================================
// ТЕКСТЫ
// =====================================================================================
Object.assign(Z.TXT.ru, {
  tr_fwD: 'Салют по летающим врагам: бьёт ворон, шары и ступу Бабы-Яги рядом. Ставится рядом с вышкой, 8 залпов', tr_lampD: 'Светит ночью: в круге света враги видны и вышки по ним стреляют',
  e_splitkidD: 'Малыш Снегоплюха: быстрый, но хрупкий', e_hutE: 'Избушка на курьих ножках', e_hutED: 'Топает по полю и оглушает вышки. Сбей её, пока не выпустила Бабу-Ягу',
  acctT: 'Аккаунт и бонусы', a_toys10: 'Найти 10 игрушек', a_toys25: 'Найти 25 игрушек', a_cal7: '7 дней календаря', a_cal24: 'Весь календарь',
  a_stars50: 'Собрать 50 звёзд', a_stars105: 'Собрать все 105 звёзд', a_skin1: 'Новый облик героя', a_hang12: 'Повесить 12 игрушек'
});
Object.assign(Z.TXT.en, {
  tr_fwD: 'Fireworks against flying enemies: hits crows, balloons and Baba Yaga nearby. Place next to a tower, 8 volleys', tr_lampD: 'Lights up the night: enemies in its circle are visible and towers can shoot them',
  e_splitkidD: 'A Slushling kid: fast but fragile', e_hutE: 'Hut on Chicken Legs', e_hutED: 'Stomps around and stuns towers. Knock it down before it lets Baba Yaga out',
  acctT: 'Account & bonuses', a_toys10: 'Find 10 ornaments', a_toys25: 'Find 25 ornaments', a_cal7: '7 calendar days', a_cal24: 'Whole calendar',
  a_stars50: 'Collect 50 stars', a_stars105: 'Collect all 105 stars', a_skin1: 'New hero look', a_hang12: 'Hang 12 ornaments'
});

// =====================================================================================
// КАРТА: магазин, рейтинг, подарок за рекламу
// =====================================================================================
function PH(f) { return !Z.platHas || Z.platHas(f); }   // 2.11: есть ли это на площадке (на VK нет покупок, входа, рейтинга)
function F(k, d) { return Z.FLAG ? Z.FLAG(k, d) : d; }   // удалённые настройки Яндекса (v27b)
function GIFT_CD() { return F('gift_cd_min', 8) * 60000; } function ADFL_CD() { return F('adfl_cd_min', 3) * 60000; }
function bag(x, y, r) { var c = D.ctx; D.rr(x - r, y - r * 0.55, r * 2, r * 1.55, r * 0.3); c.fillStyle = '#fff'; c.fill(); c.lineWidth = Math.max(1.5, r * 0.15); c.strokeStyle = OL; c.stroke(); c.beginPath(); c.arc(x, y - r * 0.55, r * 0.5, Math.PI, 0); c.stroke(); D.flakeIcon(x, y + r * 0.25, r * 0.45); }
function podium(x, y, r) { var c = D.ctx; [[-0.95, 0.1, '#dfe7f7'], [-0.32, -0.4, '#ffd54a'], [0.32, 0.25, '#ffb84a']].forEach(function (q) { D.rr(x + q[0] * r, y + q[1] * r, r * 0.64, r * (1 - q[1]) * 0.9 + r * 0.1, 2); c.fillStyle = q[2]; c.fill(); c.lineWidth = Math.max(1.5, r * 0.12); c.strokeStyle = OL; c.stroke(); }); D.text('1', x, y - r * 0.05, r * 0.6, OL); }
Z.bagIcon = bag;
UI.mapExtra = function (s, bh2, by2) {
  fix(); syncStats(); initPay(); afterWin();
  var a = A(), W = a.W, H = a.H, bs = 56 * s, bh = 60 * s;
  var yR1 = by2 - 70 * s, yR2 = by2 - 140 * s;
  a.button('mshop', W - bs - 10 * s, yR1, bs, bh, { r: 14 * s, c1: '#ffd54a', c2: COL.goldD, fn: function () { UI.openModal({ type: 'shop' }); }, draw: function (bx, by, bw, bhh) { bag(bx + bw / 2, by + bhh * 0.44, 13 * s); D.text(TT('Магазин', 'Shop'), bx + bw / 2, by + bhh - 9 * s, Math.max(10.5, D.fitText(TT('Магазин', 'Shop'), bw - 6 * s + 2 * s, 12.5 * s)), '#fff', 'center', 'middle', 2 * s); } });
  if (PH('lb') && Z.PLAT !== 'vk') a.button('mlb', W - bs - 10 * s, yR2, bs, bh, { r: 14 * s, c1: '#5f74b8', c2: '#43579a', fn: function () { UI.openModal({ type: 'lb', board: 'stars' }); }, draw: function (bx, by, bw, bhh) { podium(bx + bw / 2, by + bhh * 0.42, 14 * s); D.text(TT('Рейтинг', 'Top'), bx + bw / 2, by + bhh - 9 * s, Math.max(10.5, D.fitText(TT('Рейтинг', 'Top'), bw - 6 * s + 2 * s, 12.5 * s)), '#fff', 'center', 'middle', 2 * s); } });
  // подарок за рекламу: раз в 8 минут — игрушка (или снежинки, если всё собрано)
  var left = GIFT_CD() - (Date.now() - (Z.save.meta.adGift || 0)); UI._adGiftReady = left <= 0;
  UI._ls = Z.save.daily !== Z.todayStr() ? 1 : 0;
  if (UI.giftHub) UI._ls = 0;
  if (left <= 0 && Z.unlockedLevel() >= 1 && !UI.giftHub) {
    var gy = by2 - (UI._ls + 1) * 70 * s; UI._ls++;
    a.button('madgift', 10 * s, gy, bs, bh, { r: 14 * s, c1: '#9a7ce8', c2: COL.purpleD, pulse: true, fn: function () { UI.openModal({ type: 'adGift' }); },
      draw: function (bx, by, bw, bhh) { drawToy('ball_r', bx + bw / 2, by + bhh * 0.4, 11 * s, Z.time); D.text(T('ad'), bx + bw / 2, by + bhh - 9 * s, Math.max(10, 11 * s), '#fff', 'center', 'middle', 2 * s); } });
  }
};

// рейтинг: вход для попадания в таблицу
UI.lbExtra = function (m, f) {
  var a = A(), S = a.S;
  if (SDK.authorized() || !PH('login')) return;
  var t = TT('Войдите через Яндекс, чтобы попасть в рейтинг', 'Sign in with Yandex to join the leaderboard');
  D.textLines(D.fitLines(t, f.w - 40 * S, 12.5 * S, 10.5, 2), f.x + f.w / 2, f.y + f.h - 96 * S, '#4a5378');
  a.button('lblogin', f.x + 22 * S, f.y + f.h - 82 * S, f.w - 44 * S, 50 * S, { modal: true, enabled: !!Z.SDK.ysdk, c1: '#ffcc00', c2: '#d4a800', label: TT('Войти через Яндекс', 'Sign in with Yandex'), fn: function () { SDK.login(function () { m.data = null; }); } });
};

// =====================================================================================
// ОКНА
// =====================================================================================
var oldCustom = UI.customModal;
UI.customModal = function (m, w) {
  if (oldCustom && oldCustom(m, w)) return true;
  var fn = MODALS[m.type]; if (!fn) return false;
  fix(); var a = A(), ctx = a.ctx; ctx.save(); fn(m, w, a); ctx.restore(); return true;
};
var MODALS = {};

// ---------- календарь ----------
MODALS.daily = function (m, w, a) {
  var S = a.S, H = a.H, today = Z.todayStr(), avail = Z.save.daily !== today, n = Z.save.cal.n || 0;
  if (Z.calDone()) { return oldDaily(m, w, a, avail); }
  var dn = Z.daysToNY(), title = dn <= 60 ? TT('Новогодний календарь', 'New Year calendar') : TT('Зимний календарь', 'Winter calendar');
  var cols = 6, rows = 4, gap = 6 * S, cw = (w - 44 * S - (cols - 1) * gap) / cols, ch = Math.min(cw * 1.08, (H * 0.94 - 250 * S) / rows);
  var fh = 92 * S + rows * (ch + gap) + 128 * S, f = a.frame(w, fh, title);
  var sub = dn <= 60 && dn > 0 ? TT('До Нового года: ', 'Days until New Year: ') + dn + TT(' дн. · окошко в день', ' · one window a day') : TT('Одно окошко в день, пропуски не сгорают', 'One window a day — missed days wait for you');
  D.text(sub, f.x + w / 2, f.y + 40 * S, D.fitText(sub, w - 40 * S, 14 * S), '#4a5378');
  for (var i = 0; i < CAL.length; i++) (function (i) {
    var cx = f.x + 22 * S + (i % cols) * (cw + gap), cy = f.y + 62 * S + Math.floor(i / cols) * (ch + gap), g = CAL[i];
    var done = i < n || (m.got && i === m.got - 1), cur = i === n && avail && !m.got;
    if (cur) a.button('cal' + i, cx, cy, cw, ch, { modal: true, pulse: true, r: 10 * S, c1: '#ff7a7f', c2: COL.redD, fn: function () {
      grant(g); Z.save.cal.n = n + 1; Z.save.daily = today; m.got = n + 1; m.gi = i; Z.persist(true); },
      draw: function (bx, by, bw, bh) { D.gift(bx + bw / 2, by + bh * 0.52, bw * 0.3); D.text('' + (i + 1), bx + 10 * S, by + 11 * S, 11 * S, '#fff', 'center', 'middle', 2 * S); } });
    else {
      D.rr(cx, cy, cw, ch, 10 * S); a.ctx.fillStyle = done ? '#e6f6e9' : '#efe6d2'; a.ctx.fill(); a.ctx.lineWidth = 2 * S; a.ctx.strokeStyle = done ? '#7fcf96' : '#cdbf9f'; a.ctx.stroke();
      if (done) { a.ctx.globalAlpha = 0.85; grantIcon(g, cx + cw / 2, cy + ch * 0.5, cw * 0.36); a.ctx.globalAlpha = 1; D.text('✓', cx + cw - 9 * S, cy + 10 * S, 11 * S, COL.greenD); }
      else D.text('' + (i + 1), cx + cw / 2, cy + ch / 2, 18 * S, i === n ? '#d45a5a' : '#b3a586');
    }
  })(i);
  var by = f.y + f.h - 118 * S;
  if (m.got) {
    var g2 = CAL[m.gi], nm = g2[0] === 'toy' ? Z.toyName(g2[1]) : g2[0] === 'fl' ? '+' + g2[1] + ' ' + TT('снежинок', 'snowflakes') : g2[0] === 'skin' ? TT('Ледяной Дед Мороз', 'Icy Grandfather Frost') : TT('Украшение для ёлки', 'Tree decoration');
    D.text(TT('Сегодня: ', 'Today: ') + nm, f.x + w / 2, by - 6 * S, D.fitText(TT('Сегодня: ', 'Today: ') + nm, w - 40 * S, 15 * S), OL);
    if (!m.bonus) a.adButton('calad', f.x + 22 * S, by + 6 * S, w - 44 * S, 50 * S, TT('Бонус: ещё игрушка', 'Bonus: one more ornament'), function () {
      Z.SDK.rewarded(function () { m.rew = true; }, function () { Z.lastReward = Z.time; if (m.rew && !m.bonus) { m.bonus = 1; var tq = Z.randomToy(); if (tq) Z.giveToy(tq); else { Z.save.flakes += 4; UI.toast('+4 ' + TT('снежинки', 'snowflakes'), '#9fdcff'); Z.persist(true); } } });
    });
    a.bigBtn('calok', f, by + 62 * S, T('ok'), function () { UI.closeModal(); });
  } else if (avail) {
    D.text(TT('Открой окошко № ', 'Open window #') + (n + 1), f.x + w / 2, by + 20 * S, 16 * S, OL);
    a.bigBtn('calok2', f, by + 62 * S, TT('Позже', 'Later'), function () { UI.closeModal(); }, '#5f74b8', '#43579a');
  } else {
    D.text(TT('Следующее окошко — завтра', 'Next window opens tomorrow'), f.x + w / 2, by + 20 * S, 16 * S, OL);
    a.bigBtn('calok3', f, by + 62 * S, T('ok'), function () { UI.closeModal(); });
  }
  a.closeX(f);
};
function oldDaily(m, w, a, avail) {
  var S = a.S, f = a.frame(w, 320 * S, T('dailyT')), rew = 3;
  var dn = Z.daysToNY(), line = dn <= 70 ? T('daysLeft') + dn + T('days') : dn >= 345 ? T('happyNY') : T('dailyGen');
  D.text(line, f.x + w / 2, f.y + 50 * S, D.fitText(line, w - 40 * S, 16 * S), OL);
  D.gift(f.x + w / 2 - 50 * S, f.y + 112 * S, 24 * S); D.flakeIcon(f.x + w / 2, f.y + 112 * S, 14 * S); D.text('+' + rew, f.x + w / 2 + 20 * S, f.y + 113 * S, 26 * S, '#2a8bbd', 'left');
  if (!avail) { a.bigBtn('dok', f, f.y + f.h - 66 * S, T('ok'), function () { UI.closeModal(); }); a.closeX(f); return; }
  var give = function (mult) { Z.save.flakes += rew * mult; Z.save.daily = Z.todayStr(); Z.AU.sfx('reward'); Z.persist(true); UI.closeModal(); };
  a.adButton('dx2', f.x + 22 * S, f.y + f.h - 128 * S, w - 44 * S, 54 * S, T('x2'), function () { Z.SDK.rewarded(function () { m.rew = true; }, function () { Z.lastReward = Z.time; if (m.rew) give(2); }); });
  a.bigBtn('dtake', f, f.y + f.h - 66 * S, T('take'), function () { give(1); });
  a.closeX(f);
}

// ---------- подарок за рекламу ----------
MODALS.adGift = function (m, w, a) {
  // 2.11.4: подарок чаще (на VK — раз в 3 мин); игрушка — в первом и каждом третьем подарке, в остальных — снежинки, чтобы игрушек хватило на сезон
  var S = a.S, f = a.frame(w, 300 * S, TT('Подарок под ёлкой', 'Gift under the tree')), mins = Math.round(GIFT_CD() / 60000);
  var txt = m.got === 'fl' ? TT('Все игрушки уже собраны — держи снежинки!', 'You have every ornament — have some snowflakes!')
    : m.got === 'fs' ? TT('+5 снежинок! Игрушки тоже попадаются в подарках — заглядывай чаще.', '+5 snowflakes! Ornaments turn up in gifts too — check back often.')
    : m.got ? TT('Новая игрушка: ', 'New ornament: ') + Z.toyName(m.got)
    : TT('Посмотри рекламу и открой подарок: игрушка на ёлку или снежинки. Новый подарок — каждые ' + mins + ' мин.', 'Watch an ad to open the gift: an ornament or snowflakes. A new gift every ' + mins + ' min.');
  var l = D.wrap(txt, w - 44 * S, 15 * S);
  for (var i = 0; i < l.length; i++) D.text(l[i], f.x + w / 2, f.y + 46 * S + i * 19 * S, 15 * S, OL);
  if (m.got && m.got !== 'fl' && m.got !== 'fs') drawToy(m.got, f.x + w / 2, f.y + 150 * S, 34 * S, Z.time); else D.gift(f.x + w / 2, f.y + 150 * S, 34 * S);
  if (!m.got) a.adButton('agad', f.x + 22 * S, f.y + f.h - 70 * S, w - 44 * S, 54 * S, TT('Открыть подарок', 'Open the gift'), function () {
    Z.SDK.rewarded(function () { m.rew = true; }, function () {
      Z.lastReward = Z.time; if (!m.rew || m.got) return;
      var n = Z.save.meta.adGiftN || 0; Z.save.meta.adGift = Date.now(); Z.save.meta.adGiftN = n + 1;
      var tq = n % 3 === 0 ? Z.randomToy() : null;
      if (tq) { Z.giveToy(tq, true); m.got = tq; } else if (n % 3 === 0) { Z.save.flakes += 4; m.got = 'fl'; } else { Z.save.flakes += 5; m.got = 'fs'; }
      Z.AU.sfx('reward'); Z.persist(true);
    });
  });
  else a.bigBtn('agok', f, f.y + f.h - 70 * S, T('ok'), function () { UI.closeModal(); });
  a.closeX(f);
};

// ---------- новая игрушка за три звезды ----------
MODALS.toyNew = function (m, w, a) {
  var S = a.S, f = a.frame(w, 340 * S, TT('Три звезды!', 'Three stars!'));
  var l = TT('Новая игрушка на ёлку: ', 'New ornament: ') + Z.toyName(m.toy);
  D.text(l, f.x + w / 2, f.y + 48 * S, D.fitText(l, w - 40 * S, 16 * S), OL);
  a.ctx.save(); a.ctx.globalAlpha = 0.35; a.ctx.translate(f.x + w / 2, f.y + 140 * S); a.ctx.rotate(Z.time * 0.5); for (var r = 0; r < 10; r++) { a.ctx.rotate(Math.PI / 5); D.poly([0, 0, -10 * S, -80 * S, 10 * S, -80 * S], '#ffe28a'); } a.ctx.restore();
  drawToy(m.toy, f.x + w / 2, f.y + 140 * S, 36 * S, Z.time);
  a.bigBtn('tnok', f, f.y + f.h - 128 * S, TT('Нарядить ёлку', 'Decorate the tree'), function () { UI.closeModal(); UI.openModal({ type: 'cos', tab: 'tree' }); }, '#4cc77d', COL.greenD);
  a.bigBtn('tnok2', f, f.y + f.h - 66 * S, T('ok'), function () { UI.closeModal(); }, '#5f74b8', '#43579a');
};

// ---------- вход ----------
var LOGIN_WHY = ['Прогресс сохранится на всех устройствах', 'Ваше имя появится в рейтинге', 'Покупки не потеряются'];
var LOGIN_WHY_EN = ['Your progress is kept on every device', 'Your name appears on the leaderboard', 'Purchases are never lost'];
MODALS.login = function (m, w, a) {
  var S = a.S, f = a.frame(w, 330 * S, TT('Войти через Яндекс', 'Sign in with Yandex'));
  D.text(TT('Зачем входить:', 'Why sign in:'), f.x + w / 2, f.y + 46 * S, 16 * S, OL);
  (Z.LANG === 'en' ? LOGIN_WHY_EN : LOGIN_WHY).forEach(function (s0, i) { D.star(f.x + 34 * S, f.y + 80 * S + i * 30 * S, 8 * S, COL.gold, 1.5); D.text(s0, f.x + 50 * S, f.y + 81 * S + i * 30 * S, D.fitText(s0, w - 80 * S, 14 * S), '#4a5378', 'left'); });
  a.bigBtn('lgyes', f, f.y + f.h - 128 * S, TT('Войти', 'Sign in'), function () { UI.closeModal(); SDK.login(); }, '#ffcc00', '#d4a800');
  a.bigBtn('lgno', f, f.y + f.h - 66 * S, TT('Не сейчас', 'Not now'), function () { UI.closeModal(); }, '#5f74b8', '#43579a');
};

// ---------- ярлык ----------
MODALS.scOffer = function (m, w, a) {
  var S = a.S, f = a.frame(w, 300 * S, TT('Ёлка всегда под рукой', 'Keep the tree close'));
  var l = D.wrap(TT('Добавьте ярлык игры на рабочий стол — вернуться к ёлке будет проще. В подарок 10 снежинок.', 'Add a game shortcut to your desktop to come back easily. Get 10 snowflakes as a thank-you.'), w - 44 * S, 15 * S);
  for (var i = 0; i < l.length; i++) D.text(l[i], f.x + w / 2, f.y + 50 * S + i * 19 * S, 15 * S, OL);
  D.flakeIcon(f.x + w / 2 - 14 * S, f.y + 150 * S, 14 * S); D.text('+10', f.x + w / 2 + 6 * S, f.y + 151 * S, 22 * S, '#2a8bbd', 'left');
  a.bigBtn('scyes', f, f.y + f.h - 128 * S, TT('Добавить ярлык', 'Add shortcut'), function () { UI.closeModal(); SDK.askShortcut(); }, '#4cc77d', COL.greenD);
  a.bigBtn('scno', f, f.y + f.h - 66 * S, TT('Не сейчас', 'Not now'), function () { UI.closeModal(); }, '#5f74b8', '#43579a');
};

// ---------- аккаунт ----------
MODALS.acct = function (m, w, a) {
  var S = a.S, rows = [];
  var au = SDK.authorized();
  if (!au) rows.push([TT('Войти через Яндекс', 'Sign in with Yandex'), '#ffcc00', '#d4a800', !!Z.SDK.ysdk, function () { SDK.login(); }]);
  if (!Z.save.meta.shortcut) rows.push([TT('Ярлык на рабочий стол  +10', 'Desktop shortcut  +10'), '#4cc77d', COL.greenD, !!SDK.canShortcut, function () { SDK.askShortcut(); }]);
  rows.push([TT('Оценить игру', 'Rate the game'), '#ff8fb1', '#d45a80', !!Z.SDK.ysdk, function () { Z.save.meta.review = 1; SDK.askReview(); }]);
  rows.push([TT('Восстановить покупки', 'Restore purchases'), '#3fb6e6', '#2a8bbd', !!PAY, function () { processPurchases(); UI.toast(TT('Покупки проверены', 'Purchases checked'), '#9dff6a'); }]);
  var f = a.frame(w, 96 * S + rows.length * 62 * S, T('acctT'));
  var st = au ? TT('Вы вошли: ', 'Signed in: ') + (SDK.playerName() || TT('игрок', 'player')) : Z.SDK.ysdk ? TT('Вы играете как гость', 'Playing as a guest') : TT('Вход доступен на Яндекс Играх', 'Sign-in works on Yandex Games');
  D.text(st, f.x + w / 2, f.y + 46 * S, D.fitText(st, w - 40 * S, 15 * S), '#4a5378');
  var y = f.y + 70 * S;
  rows.forEach(function (r, i) { a.button('ac' + i, f.x + 22 * S, y, w - 44 * S, 54 * S, { modal: true, enabled: r[3], c1: r[1], c2: r[2], label: r[0], fn: r[4] }); y += 62 * S; });
  a.closeX(f);
};

// ---------- магазин ----------
function allHeroesOpen() { var ok = true; for (var t in Z.ALLIES) if (Z.ALLIES[t].unlock && !(Z.allyUnlocked && Z.allyUnlocked(t))) ok = false; return ok; }
MODALS.shop = function (m, w, a) {
  var S = a.S, H = a.H, list = [], c = a.ctx;
  // 2.12.13: вкладка «Купить» — сначала Стартовый набор (крупной карточкой), потом снежинки, потом остальное, снежинки за рекламу — в конце
  if (PH('pay')) {
    if (!Z.save.shop.starter && PROD.starter) list.push(PROD.starter);
    ['fl30', 'fl100', 'fl250'].forEach(function (id) { if (PROD[id]) list.push(PROD[id]); });
    if (!Z.save.shop.noads && PROD.noads) list.push(PROD.noads);
    if (!Z.save.shop.heroes && PROD.heroes && !allHeroesOpen()) list.push(PROD.heroes);
  }
  list.push({ ad: true });
  var WT = function (p) { return p.id === 'starter' ? 1.75 : 1; };
  // телефон лёжа — две колонки
  var TBx = (tabRows(w, S) > 1 ? 40 : 0) * S, sumW = list.reduce(function (q, p) { return q + WT(p); }, 0), avail = H * 0.92 - 154 * S - TBx;
  var nc = avail / sumW < 56 * S && UI.L && !UI.L.portrait && UI.L.sw > 600 ? 2 : 1, cols = [[], [], []], top = null;
  // телефон лёжа: Стартовый набор — широкой полосой сверху (пониже), остальное — в 2–3 колонки поровну
  if (nc > 1) { var rest = list.filter(function (p) { if (p.id === 'starter') { top = p; return false; } return true; }), hn = Math.ceil(rest.length / nc); for (var ci0 = 0; ci0 < nc; ci0++) cols[ci0] = rest.slice(ci0 * hn, (ci0 + 1) * hn); WT = function (p) { return p.id === 'starter' ? 1.25 : 1; }; } else cols[0] = list;
  var cW = function (cl) { return cl.reduce(function (q, p) { return q + WT(p); }, 0); };
  var topW = top ? WT(top) : 0, colW = Math.max(cW(cols[0]), cW(cols[1]), cW(cols[2])) + topW, colN = Math.max(cols[0].length, cols[1].length, cols[2].length) + (top ? 1 : 0);
  var cwS = w; if (nc > 1) { var fw2 = Math.min(UI.L.sw - 16 * S, w * nc + 10 * S * (nc - 1)); cwS = (fw2 - 10 * S * (nc - 1)) / nc; w = fw2; }
  var TB = (tabRows(w, S) > 1 ? 84 : 44) * S, rh = Math.min(80 * S, nc > 1 ? (H * 0.95 - 72 * S - TB - colN * 4 * S) / colW : (avail + 28 * S - colN * 4 * S) / colW), PBH = Math.min(44 * S, rh - 8 * S);
  Z.shopFrameL('shop');
  var f = a.frame(w, 56 * S + TB + colW * rh + colN * 4 * S + 16 * S, TT('Магазин', 'Shop')), fx0 = f.x;
  shopTabs(a, f, w, 'shop', function () { });
  var y0 = f.y + 34 * S + TB, ready = SDK.payReady();
  if (top) { starterCard(a, fx0 + 12 * S, y0, w - 24 * S, rh * topW, ready); y0 += rh * topW + 4 * S; }
  var BADGE = { fl100: TT('Чаще берут', 'Popular'), fl250: TT('Выгоднее всего', 'Best value') };
  cols.forEach(function (cl, ci) { var ry = y0; cl.forEach(function (p) {
    var w = cwS, f = { x: fx0 + ci * (cwS + 10 * S) }, h = rh * WT(p), bw = 88 * S, x0 = f.x + 12 * S, rw = w - 24 * S;
    if (p.id === 'starter') { starterCard(a, x0, ry, rw, h, ready); ry += h + 4 * S; return; }
    D.rr(x0, ry, rw, h, 12 * S); c.fillStyle = p.id === 'noads' ? '#ffe1ea' : p.fl ? '#e4f3ff' : COL.panelD; c.fill();
    var ix = x0 + h * 0.44, iy = ry + h / 2, ir = h * 0.3;
    if (p.ad || p.fl) { D.flakeIcon(ix, iy - (p.fl ? 4 * S : 0), ir * (p.fl ? 0.7 + 0.1 * ['fl30', 'fl100', 'fl250'].indexOf(p.id) : 0.85)); if (p.fl) D.text('+' + p.fl, ix, iy + ir * 0.95, Math.min(16 * S, ir * 0.8), '#2a8bbd', 'center', 'middle', 3 * S); }
    else if (p.id === 'noads') { D.adIcon(ix, iy, ir * 0.8); c.strokeStyle = COL.red; c.lineWidth = 3 * S; c.beginPath(); c.moveTo(ix - ir, iy + ir); c.lineTo(ix + ir, iy - ir); c.stroke(); }
    else if (p.id === 'heroes') { D.ally('kot', ix, iy + ir * 0.95, ir * 0.85, { dir: 1 }); }
    var nm = p.ad ? TT('Снежинки за рекламу', 'Snowflakes for an ad') : Z.LANG === 'en' ? p.en : p.ru;
    var ds = p.ad ? TT('+3 снежинки, раз в 3 минуты', '+3 snowflakes, every 3 minutes') : p.id === 'noads' ? TT('Без рекламы между уровнями и баннера', 'No ads between levels, no banner') : p.id === 'heroes' ? TT('Все герои для отряда с 4-го уровня', 'Every hero for your squad from level 4') : p.fl ? TT(p.fl + ' снежинок — на облики и исследования', p.fl + ' snowflakes for looks and research') : (Z.LANG === 'en' ? p.den : p.dru);
    var tx = x0 + h * 0.84 + 2 * S, tw = rw - h * 0.84 - bw - 12 * S;
    var lowB = !!BADGE[p.id] && h < 62 * S;   // низкая строка (телефон лёжа): метка — под названием вместо описания
    var nfs = Math.max(12, D.fitText(nm, tw, 15 * S)), dfs = Math.max(11.5, 12 * S), F2 = lowB ? { lines: [], px: dfs } : D.fitLines(ds, tw, dfs, 11, Math.max(1, Math.floor((h - nfs - 10 * S) / (dfs * 1.13)))), dl = F2.lines, lh = F2.px * 1.13, blk = nfs + 3 * S + (lowB ? 16 * S : dl.length * lh), y0b = ry + (h - blk) / 2;
    D.text(nm, tx, y0b + nfs / 2, nfs, OL, 'left');
    for (var q = 0; q < dl.length; q++) D.text(dl[q], tx, y0b + nfs + 3 * S + lh * (q + 0.5), F2.px, '#5a6385', 'left');
    var bx = f.x + w - 18 * S - bw, bby = ry + (h - PBH) / 2 + (BADGE[p.id] && !lowB ? Math.min(9 * S, (h - PBH) / 2 - 2 * S) : 0);
    if (p.ad) {
      var cd = ADFL_CD() - (Date.now() - (Z.save.shop.adFl || 0)), can = cd <= 0;
      a.button('shad', bx, bby, bw, PBH, { modal: true, enabled: can, c1: '#9a7ce8', c2: COL.purpleD, r: 10 * S, fn: function () {
        Z.SDK.rewarded(function () { m.rew = true; }, function () { Z.lastReward = Z.time; if (m.rew) { m.rew = false; Z.save.shop.adFl = Date.now(); Z.save.flakes += 3; Z.AU.sfx('reward'); Z.persist(true); } }); },
        draw: function (x, yb, bw2, bh2) { if (can) { D.adIcon(x + 21 * S, yb + bh2 / 2 - 5 * S, 8 * S); D.text(T('ad'), x + 21 * S, yb + bh2 / 2 + 9 * S, Math.max(8, D.fitText(T('ad'), 34 * S, 9 * S)), '#fff', 'center', 'middle', 2 * S); D.text('+3', x + bw2 / 2 + 10 * S, yb + bh2 / 2, 16 * S, '#fff', 'center', 'middle', 3 * S); } else { var sec = Math.ceil(cd / 1000), tt = Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2); D.text(tt, x + bw2 / 2, yb + bh2 / 2, 15 * S, '#fff', 'center', 'middle', 3 * S); } } });
    } else {
      var pr = SDK.priceOf(p.id);
      a.button('sh_' + p.id, bx, bby, bw, PBH, { modal: true, enabled: ready, c1: '#4cc77d', c2: COL.greenD, r: 10 * S, label: pr, px: Math.min(15 * S, PBH * 0.42), fn: function () { SDK.buy(p.id); } });
    }
    if (lowB) { var lbl = BADGE[p.id], lbc = p.id === 'fl250' ? '#ff5a5f' : '#ff8a3d', lfs = 10.5 * S, lwd = D.mw(lbl, lfs) + 14 * S; D.rr(x0, ry, rw, h, 12 * S); c.lineWidth = 2.5 * S; c.strokeStyle = lbc; c.stroke(); D.rr(tx, y0b + nfs + 3 * S, lwd, 16 * S, 8 * S); c.fillStyle = lbc; c.fill(); c.lineWidth = 1.5 * S; c.strokeStyle = OL; c.stroke(); D.text(lbl, tx + lwd / 2, y0b + nfs + 11 * S, lfs, '#fff', 'center', 'middle', 2 * S); }
    else if (BADGE[p.id]) {   // 2.12.14б: метка — внутри своей строки, над её кнопкой, и строка обведена цветом метки (раньше висела между строками)
      var bl = BADGE[p.id], bcol = p.id === 'fl250' ? '#ff5a5f' : '#ff8a3d', bfs = Math.min(11 * S, Math.max(9.5, (bby - ry - 4 * S) * 0.62)), bwd = Math.min(bw + 8 * S, D.mw(bl, bfs) + 14 * S), bhh = bfs * 1.5;
      D.rr(x0, ry, rw, h, 12 * S); c.lineWidth = 2.5 * S; c.strokeStyle = bcol; c.stroke();
      D.rr(bx + bw / 2 - bwd / 2, ry + 3 * S, bwd, bhh, bhh / 2); c.fillStyle = bcol; c.fill(); c.lineWidth = 1.5 * S; c.strokeStyle = OL; c.stroke(); D.text(bl, bx + bw / 2, ry + 3 * S + bhh / 2, D.fitText(bl, bwd - 8 * S, bfs), '#fff', 'center', 'middle', 2 * S);
    }
    ry += h + 4 * S;
  }); });
  if (!ready && PH('pay')) { var nt = Z.PLAT === 'vk' ? TT('Покупки сейчас недоступны — попробуйте чуть позже', 'Purchases are unavailable right now — please try again later') : TT('Покупки работают на Яндекс Играх', 'Purchases work on Yandex Games');   /* 2.11.5: на VK — без упоминания Яндекса */ D.text(nt, f.x + w / 2, f.y + f.h - 12 * S, Math.max(10.5, D.fitText(nt, w - 40 * S, 12 * S)), '#8a93b0'); }
  a.closeX(f);
};
// 2.12.13: карточка Стартового набора в магазине — золотая, с Золотым Дедом Морозом, нажатие — витрина набора
// 2.12.13б: витрина набора поверх текущего окна (раньше вставала в очередь за ним — казалось, что не открылась); закрыл — вернулся назад
Z.openOffer = function () { if (UI.modal) UI.goModal({ type: 'offer' }); else UI.openModal({ type: 'offer' }); };
Z.openNoAds = function () { if (UI.modal) UI.goModal({ type: 'noads' }); else UI.openModal({ type: 'noads' }); };
function starterCard(a, x, y, w, h, ready) {
  var S = a.S, c = a.ctx, t = Z.time;
  c.save(); D.rr(x, y, w, h, 14 * S); c.clip();
  var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffe37a'); g.addColorStop(1, '#ffb52e'); c.fillStyle = g; c.fillRect(x, y, w, h);
  var sx = x + ((t * 0.35) % 1.6 - 0.3) * w; c.globalAlpha = 0.35; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(sx, y); c.lineTo(sx + 30 * S, y); c.lineTo(sx - 10 * S, y + h); c.lineTo(sx - 40 * S, y + h); c.closePath(); c.fill(); c.globalAlpha = 1;
  // 2.12.13б: Золотой Дед Мороз — на тёмно-синем окошке с лучами (на золотом фоне он сливался)
  var mw0 = Math.min(h * 0.8, w * 0.3), px = x + 6 * S, py = y + 6 * S, pw = mw0 - 8 * S, ph = h - 12 * S;
  c.save(); D.rr(px, py, pw, ph, 11 * S); c.clip();
  var g2 = c.createLinearGradient(0, py, 0, py + ph); g2.addColorStop(0, '#2a3f8f'); g2.addColorStop(1, '#16224a'); c.fillStyle = g2; c.fillRect(px, py, pw, ph);
  c.translate(px + pw / 2, py + ph * 0.55); c.rotate(t * 0.25); for (var ri = 0; ri < 10; ri++) { c.rotate(Math.PI / 5); c.beginPath(); c.moveTo(0, 0); c.lineTo(ph, -ph * 0.14); c.lineTo(ph, ph * 0.14); c.closePath(); c.fillStyle = 'rgba(255,214,90,0.16)'; c.fill(); }
  c.restore();
  c.fillStyle = '#eef4ff'; c.fillRect(px, py + ph * 0.88, pw, ph * 0.12);
  if (Z.goldMoroz) Z.goldMoroz(px + pw / 2, py + ph * 0.96, Math.min(ph * 0.3, pw * 0.42));
  c.restore();
  c.save(); D.rr(px, py, pw, ph, 11 * S); c.lineWidth = 2 * S; c.strokeStyle = '#d79a1c'; c.stroke(); c.restore();
  D.rr(x, y, w, h, 14 * S); c.lineWidth = 2.5 * S; c.strokeStyle = '#d79a1c'; c.stroke();
  var bw = 96 * S, bh = Math.min(46 * S, h * 0.36), tx = x + mw0 + 4 * S, tw = w - mw0 - 14 * S, nm = TT('Стартовый набор', 'Starter pack');
  if (h < 92 * S) {   // низкая полоса (телефон лёжа): название и одна строка слева, цена справа по центру
    var cbh = Math.min(42 * S, h - 12 * S), ctw = w - mw0 - bw - 26 * S, cn = Math.max(13, D.fitText(nm, ctw, 18 * S)), cds = TT('Золотой Дед Мороз и всё «Царское» — что внутри ›', 'Golden Grandfather Frost and all Royal looks — see inside ›');
    D.text(nm, tx, y + h * 0.36, cn, '#fff', 'left', 'middle', 3.5 * S); D.text(cds, tx, y + h * 0.72, Math.max(11, D.fitText(cds, ctw, 12.5 * S)), '#6b4300', 'left', 'middle');
    var rl0 = TT('Лучшее для старта', 'Best to start'), rf0 = 10.5 * S, rw0 = D.mw(rl0, rf0) + 14 * S; D.rr(x + w - rw0 - 8 * S, y - 7 * S, rw0, 18 * S, 9 * S); c.fillStyle = '#ff5a5f'; c.fill(); c.lineWidth = 1.5 * S; c.strokeStyle = OL; c.stroke(); D.text(rl0, x + w - rw0 / 2 - 8 * S, y + 2 * S, rf0, '#fff', 'center', 'middle', 2 * S);
    var op0 = function () { Z.openOffer(); };
    a.button('sh_starterCard', x, y, w - bw - 12 * S, h, { modal: true, hidden: true, fn: op0 });
    a.button('sh_starter', x + w - bw - 8 * S, y + (h - cbh) / 2 + 2 * S, bw, cbh, { modal: true, pulse: true, c1: '#ff8a3d', c2: '#d4602a', r: 12 * S, label: SDK.priceOf('starter'), px: 16 * S, fn: op0 });
    return;
  }
  var nfs = Math.max(14, D.fitText(nm, tw, 19 * S)); D.text(nm, tx, y + 8 * S + nfs * 0.6, nfs, '#fff', 'left', 'middle', 3.5 * S);
  var dl2 = [TT('Золотой Дед Мороз', 'Golden Grandfather Frost'), TT('и всё «Царское» и золотое', 'and every Royal & golden look')], dTop = y + 12 * S + nfs * 1.2, dfs2 = Math.min(14 * S, D.fitText(dl2[1], tw, 14 * S), D.fitText(dl2[0], tw, 14 * S));
  dl2.forEach(function (l, q) { D.text(l, tx, dTop + dfs2 * 1.15 * (q + 0.5), Math.max(12, dfs2), '#6b4300', 'left'); });
  var more = TT('Что внутри ›', 'What\'s inside ›'); D.text(more, tx, y + h - 8 * S - bh / 2, Math.max(12, 13 * S), '#fff', 'left', 'middle', 3 * S);
  var rl = TT('Лучшее для старта', 'Best to start'), rfs = 10.5 * S, rwd = D.mw(rl, rfs) + 14 * S;
  D.rr(x + w - rwd - 8 * S, y - 7 * S, rwd, 18 * S, 9 * S); c.fillStyle = '#ff5a5f'; c.fill(); c.lineWidth = 1.5 * S; c.strokeStyle = OL; c.stroke(); D.text(rl, x + w - rwd / 2 - 8 * S, y + 2 * S, rfs, '#fff', 'center', 'middle', 2 * S);
  var open = function () { Z.openOffer(); };
  a.button('sh_starterCard', x, y, w - bw - 12 * S, h, { modal: true, hidden: true, fn: open });
  a.button('sh_starter', x + w - bw - 8 * S, y + h - bh - 8 * S, bw, bh, { modal: true, pulse: true, c1: '#ff8a3d', c2: '#d4602a', r: 12 * S, label: SDK.priceOf('starter'), px: 16 * S, fn: open });
}
// ---------- «Наряди ёлку»: ёлка · герои · крепость ----------
// 2.11.5: одна строка вкладок для всего магазина: снежинки и наборы · ёлка · герои · вышки · мир (крепость и фон меню)
var SHOP_TABS = [['shop', 'Купить', 'Buy'], ['boost', 'Запасы', 'Supplies'], ['tree', 'Ёлка', 'Tree'], ['heroes', 'Герои', 'Heroes'], ['towers', 'Вышки', 'Towers'], ['traps', 'Ловушки', 'Traps'], ['fort', 'Мир', 'World']];
// 2.11.5: на узком экране (телефон стоя) вкладки в два ряда — иначе подписи не умещаются
function tabRows(w, S) { return (w - 36 * S) / SHOP_TABS.length < 66 * S ? 2 : 1; }
Z.shopTabRows = function (w) { return tabRows(w, UI.api().S); };
// 2.12.15б: баланс снежинок — на каждой вкладке магазина, слева на ленте заголовка; «+» ведёт во вкладку «Купить»
function chipW(h, cur) { var fs = h * 0.6; return h * 0.9 + D.mw(Z.fmt(Z.save.flakes), fs) + (cur === 'shop' ? h * 0.45 : h * 1.05); }
// 2.12.25: баланс — внутри красной ленты заголовка слева (раньше торчал за угол окна); место под него оставляет frame через UI._frameL
Z.shopFrameL = function (cur) { var S = UI.api().S; UI._frameL = chipW(28 * S, cur) + 14 * S; };
function flakeChip(a, x, y, h, cur) {
  var S = a.S, c = a.ctx, n = Z.fmt(Z.save.flakes), fs = h * 0.6, cw = chipW(h, cur);
  a.button('ct_bal', x, y, cw, h, { modal: true, r: h / 2, c1: '#e4f3ff', c2: '#2a8bbd', fn: function () { if (cur === 'shop') return; Z.AU.sfx('select'); UI.closeModal(); UI.openModal({ type: 'shop' }); }, draw: function (bx, by, bw, bh) {
    D.flakeIcon(bx + bh * 0.5, by + bh / 2 - 1 * S, bh * 0.3); D.text(n, bx + bh * 0.9, by + bh / 2 - 1 * S, fs, '#2a8bbd', 'left', 'middle');
    if (cur !== 'shop') { var px = bx + bw - bh * 0.5, py = by + bh / 2 - 1 * S; c.beginPath(); c.arc(px, py, bh * 0.34, 0, 7); c.fillStyle = '#4cc77d'; c.fill(); c.lineWidth = 1.5 * S; c.strokeStyle = OL; c.stroke(); D.text('+', px, py + 0.5 * S, bh * 0.5, '#fff', 'center', 'middle', 1.5 * S); } } });
}
Z.flakeChip = flakeChip;
function shopTabs(a, f, w, cur, pick) {
  var S = a.S, rows = tabRows(w, S), per = Math.ceil(SHOP_TABS.length / rows);
  flakeChip(a, f.x + f.w * 0.1 + 7 * S, f.y + 2 * S - 14 * S, 28 * S, cur);
  SHOP_TABS.forEach(function (q, i) {
    var row = Math.floor(i / per), col = i % per, nRow = row < rows - 1 ? per : SHOP_TABS.length - per * (rows - 1), tw = (w - 36 * S - (nRow - 1) * 5 * S) / nRow;
    var on = cur === q[0], lb = Z.LANG === 'en' ? q[2] : q[1];
    a.button('ct_' + q[0], f.x + 18 * S + col * (tw + 5 * S), f.y + 30 * S + row * 40 * S, tw, 36 * S, { modal: true, r: 10 * S, c1: on ? '#4cc77d' : q[0] === 'shop' ? '#ffd54a' : '#dfe7f7', c2: on ? COL.greenD : q[0] === 'shop' ? COL.goldD : '#aab6d6',
      fn: function () { if (on) return; Z.AU.sfx('select'); if (q[0] === 'shop') { UI.closeModal(); UI.openModal({ type: 'shop' }); } else if (cur === 'shop') { UI.closeModal(); UI.openModal({ type: 'cos', tab: q[0] }); } else pick(q[0]); },
      draw: function (bx, by, bw, bh) { var ic = q[0] === 'shop' && bw > 60 * S; if (ic) { D.flakeIcon(bx + 13 * S, by + bh / 2, 6 * S); } var fs = D.fitText(lb, bw - (ic ? 26 : 8) * S, 14 * S); D.text(lb, bx + bw / 2 + (ic ? 8 * S : 0), by + bh / 2, Math.max(9.5, fs), on || q[0] === 'shop' ? '#fff' : OL, 'center', 'middle', on || q[0] === 'shop' ? 2.5 * S : 0); } });
  });
}
Z.shopTabs = shopTabs;
MODALS.cos = function (m, w, a) {
  var S = a.S, H = a.H, ctx = a.ctx; m.tab = m.tab || 'tree';
  if (UI.L && !UI.L.portrait && H < 640 && UI.L.sw > 600) w = Math.min(UI.L.sw - 16 * S, w * 1.9);   // 2.7.21: телефон лёжа — окно шире, игрушки и значки крупнее
  Z.shopFrameL(m.tab);
  var fh = Math.min(H * 0.95, 660 * S), f = a.frame(w, fh, TT('Магазин', 'Shop'));   // 2.11.5: это магазин — так и называется
  shopTabs(a, f, w, m.tab, function (id) { m.tab = id; m.sel = null; });
  var top = f.y + (tabRows(w, S) > 1 ? 116 : 76) * S, bot = f.y + f.h - 14 * S;
  if (m.tab === 'tree') tabTree(m, f, a, top, bot); else if (m.tab === 'heroes') tabHeroes(m, f, a, top, bot); else if (m.tab === 'towers') tabTowers(m, f, a, top, bot); else if (m.tab === 'traps' && Z.tabTraps) Z.tabTraps(m, f, a, top, bot); else if (m.tab === 'boost' && Z.tabBoost) Z.tabBoost(m, f, a, top, bot); else tabFort(m, f, a, top, bot);
  a.closeX(f);
};
function chip(a, id, x, y, w, h, on, lock, draw, fn, needTxt) {
  var S = a.S;
  a.button(id, x, y, w, h, { modal: true, r: 9 * S, enabled: !lock, c1: on ? '#4cc77d' : '#fdf7ec', c2: on ? COL.greenD : COL.panelD, fn: fn,
    draw: function (bx, by, bw, bh) { if (lock) a.ctx.globalAlpha = 0.45; draw(bx + bw / 2, by + bh * 0.46, Math.min(bw, bh) * 0.32); a.ctx.globalAlpha = 1; if (lock && needTxt) needMark(needTxt, bx + bw / 2, by + bh - 9 * S, bw, S); else if (on) D.text('✓', bx + bw - 8 * S, by + 8 * S, 11 * S, '#fff', 'center', 'middle', 2 * S); } });
}
function needLabel(need) { return typeof need === 'number' ? '★' + need : need === 'cal' ? '#cal' : '#shop'; }
// 2.7.21: условие открытия — значком (календарь, сумка магазина) или «★N» крупно, вместо сжатых слов «календ.», «магазин»
function needMark(t, x, y, bw, S) {
  var c = D.ctx, r = Math.min(8 * S, bw * 0.2);
  if (t === '#cal') { D.rr(x - r, y - r * 0.8, r * 2, r * 1.8, r * 0.3); c.fillStyle = '#fff'; c.fill(); c.lineWidth = Math.max(1.2, r * 0.18); c.strokeStyle = OL; c.stroke(); D.rr(x - r, y - r * 0.8, r * 2, r * 0.55, r * 0.3); c.fillStyle = '#e8484f'; c.fill(); c.stroke(); D.text('31', x, y + r * 0.42, r * 0.95, OL, 'center', 'middle'); return; }
  if (t === '#shop') { bag(x, y + r * 0.1, r * 0.85); return; }
  D.text(t, x, y, Math.max(10, D.fitText(t, bw - 2 * S, 11 * S)), OL, 'center', 'middle', 0);
}
function tabTree(m, f, a, top, bot) {
  var S = a.S, w = f.w, dc = Z.save.deco, ctx = a.ctx;
  // предпросмотр
  // 2.11.5: низкий широкий экран (телефон лёжа) — две колонки: слева ёлка и ряды выбора на всю высоту, справа игрушки
  var wide = (bot - top) < 380 * S && w > (bot - top) * 1.9, lw = wide ? w * 0.6 : w;
  var pw = wide ? lw * 0.34 : w * 0.42, ph = wide ? (bot - top) - 4 * S : Math.min(230 * S, (bot - top) * 0.46);
  D.rr(f.x + 14 * S, top, pw, ph, 14 * S); ctx.fillStyle = '#20305e'; ctx.fill();
  ctx.save(); D.rr(f.x + 14 * S, top, pw, ph, 14 * S); ctx.clip(); ctx.fillStyle = '#eef4ff'; ctx.fillRect(f.x + 14 * S, top + ph * 0.86, pw, ph); var kTry = m.kTry && m.kTry !== 'base' && !(dc.own && dc.own['kind_' + m.kTry]) ? m.kTry : null; D.bigTree(f.x + 14 * S + pw / 2, top + ph * 0.93, ph * 0.72, Z.time, { deco: true, kind: m.kTry || undefined }); ctx.restore();   // 2.11.5: верхушка целиком в окне
  // верхушка / гирлянда / мишура
  var rx = f.x + 22 * S + pw, rw = lw - pw - 36 * S, rowH = (ph - 6 * S) / 4;
  var sec = function (k, label, ids, draw, need, cur, set) {
    var yy = top + k * rowH; D.text(label, rx, yy + 9 * S, 12 * S, '#4a5378', 'left');
    var cw = Math.min(46 * S, (rw - (ids.length - 1) * 4 * S) / ids.length);
    ids.forEach(function (id, i) { var nd = need(id), own = typeof nd === 'number' ? Z.totalStars() >= nd : nd === 0 || Z.ownDeco(kindOf(set), id, nd); chip(a, 'dc' + set + id, rx + i * (cw + 4 * S), yy + 18 * S, cw, rowH - 22 * S, cur === id, !own, function (x, y, r) { draw(id, x, y, r); }, function () { dc[set] = id; Z.AU.sfx('select'); Z.persist(); }, needLabel(nd)); });
  };
  function kindOf(set) { return set; }
  // 2.11.5: вид ёлки — примерка и покупка за снежинки
  (function () {
    var yy = top, ids = TKIND.map(function (q) { return q[0]; }), cw = Math.min(46 * S, (rw - (ids.length - 1) * 4 * S) / ids.length), cur = treeKind(dc);
    D.text(TT('Ёлка', 'Tree'), rx, yy + 9 * S, 12 * S, '#4a5378', 'left');
    ids.forEach(function (id, i) {
      var q = TKM[id], own = id === 'base' || !!(dc.own && dc.own['kind_' + id]), on = (m.kTry || cur) === id;
      a.button('tk_' + id, rx + i * (cw + 4 * S), yy + 18 * S, cw, rowH - 22 * S, { modal: true, r: 9 * S, c1: on ? (own ? '#4cc77d' : '#ffe9a8') : '#fdf7ec', c2: on ? (own ? COL.greenD : COL.goldD) : COL.panelD,
        fn: function () { Z.AU.sfx('select'); if (own) { dc.kind = id; m.kTry = null; Z.persist(); } else m.kTry = id; },
        draw: function (bx, by, bw, bh) { ctx.save(); ctx.beginPath(); ctx.rect(bx + 2, by + 2, bw - 4, bh - 4); ctx.clip(); D.bigTree(bx + bw / 2, by + bh - (own ? 3 : 12) * S, (bh - (own ? 6 : 14) * S) * 1.0, Z.time, { kind: id, noGlow: true, star: true }); ctx.restore();
          if (!own) { D.flakeIcon(bx + bw / 2 - 8 * S, by + bh - 7 * S, 4.5 * S); D.text('' + q.cost, bx + bw / 2 - 2 * S, by + bh - 6 * S, 10 * S, OL, 'left'); } } });
    });
    if (kTry) {
      var q2 = TKM[kTry], lb = TT('Купить «', 'Buy "') + (Z.LANG === 'en' ? q2.en : q2.ru) + TT('» за ', '" for ') + q2.cost, bx2 = f.x + 20 * S, bw2 = pw - 12 * S;
      a.button('tkbuy', bx2, top + ph - 34 * S, bw2, 28 * S, { modal: true, r: 9 * S, c1: '#3fb6e6', c2: '#2a8bbd', pulse: true,
        fn: function () { if (Z.save.flakes < q2.cost) { Z.AU.sfx('error'); Z.needFlakes(q2.cost); return; } Z.save.flakes -= q2.cost; dc.own['kind_' + kTry] = 1; dc.kind = kTry; m.kTry = null; Z.AU.sfx('levelup'); Z.persist(true); },
        draw: function (bx, by, bw, bh) { var fs = D.fitText(lb, bw - 28 * S, 12 * S); D.text(lb, bx + bw / 2 - 8 * S, by + bh / 2, fs, '#fff', 'center', 'middle', 2 * S); D.flakeIcon(bx + bw / 2 + D.mw(lb, fs) / 2 + 2 * S, by + bh / 2, 5.5 * S); } });
    }
  })();
  sec(1, TT('Верхушка', 'Topper'), TOPS.map(function (q) { return q[0]; }), function (id, x, y, r) { drawTop(id, x, y, r * 0.95, Z.time, Math.max(1, r * 0.1)); }, function (id) { return topNeed(id); }, dc.top, 'top');
  sec(2, TT('Гирлянда', 'Lights'), LORDER, function (id, x, y, r) { var cl = LIGHTS[id][3]; for (var k = 0; k < 3; k++) D.circ(x - r * 0.7 + k * r * 0.7, y + (k % 2) * r * 0.3, r * 0.3, cl ? cl[k % cl.length] : 'hsl(' + ((Z.time * 120 + k * 120) % 360) + ',95%,62%)', 1); }, function (id) { return LIGHTS[id][0]; }, dc.lights, 'lights');
  sec(3, TT('Мишура', 'Tinsel'), TORDER, function (id, x, y, r) { var c = a.ctx; c.strokeStyle = TINSEL[id][3] === 'rgba(255,255,255,0.85)' ? '#c9d6ea' : TINSEL[id][3]; c.lineWidth = r * 0.45; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - r, y - r * 0.2); c.quadraticCurveTo(x, y + r * 0.7, x + r, y - r * 0.2); c.stroke(); }, function (id) { return TINSEL[id][0]; }, dc.tinsel, 'tinsel');
  // игрушки
  var gx0 = wide ? f.x + lw : f.x, gw = wide ? w - lw : w, gy = wide ? top - 6 * S : top + ph + 10 * S, have = Object.keys(dc.toys).length;
  var hdr = TT('Игрушки: ', 'Ornaments: ') + have + '/' + TOYS.length + TT(' · на ёлке ', ' · hung ') + dc.hang.length + '/' + HMAX;
  D.text(hdr, gx0 + gw / 2, gy + 8 * S, D.fitText(hdr, gw - 30 * S, 13 * S), OL);
  var hint = TT('Нажми на игрушку — повесить или снять. Новые: календарь, три звезды, сундуки, подарок за рекламу', 'Tap an ornament to hang or remove it. Get more: calendar, three stars, chests, ad gift');
  var hF = D.fitLines(hint, gw - 30 * S, 11.5 * S, 10.5, 2); D.textLines(hF, gx0 + gw / 2, gy + (hF.lines.length > 1 ? 30 : 24) * S, '#6a7394');
  var gTop = hF.lines.length > 1 ? 46 * S : 34 * S;
  var cols = wide ? 6 : w / S > 600 ? 12 : 8, gap = 4 * S, cw = (gw - 28 * S - (cols - 1) * gap) / cols, rowsN = Math.ceil(TOYS.length / cols), chh = Math.min(cw, (bot - gy - gTop - 2 * S - (rowsN - 1) * gap) / rowsN);
  TOYS.forEach(function (q, i) {
    var id = q[0], own = !!dc.toys[id], on = dc.hang.indexOf(id) >= 0, x = gx0 + 14 * S + (i % cols) * (cw + gap), y = gy + gTop + Math.floor(i / cols) * (chh + gap);
    if (!own) { D.rr(x, y, cw, chh, 8 * S); ctx.fillStyle = '#e4dccb'; ctx.fill(); ctx.save(); ctx.globalAlpha = 0.18; drawToy(id, x + cw / 2, y + chh / 2, chh * 0.28, 0); ctx.restore(); D.text('?', x + cw / 2, y + chh / 2, chh * 0.32, '#b3a586'); return; }
    a.button('ty_' + id, x, y, cw, chh, { modal: true, r: 8 * S, c1: on ? '#bff0cf' : '#fdf7ec', c2: on ? COL.greenD : COL.panelD,
      fn: function () { var k = dc.hang.indexOf(id); if (k >= 0) dc.hang.splice(k, 1); else if (dc.hang.length < HMAX) dc.hang.push(id); else { UI.toast(TT('На ёлке нет места — сними другую игрушку', 'No room — take another ornament off first'), '#ffb84a'); return; } Z.AU.sfx('select'); Z.persist(); },
      draw: function (bx, by, bw, bh) { drawToy(id, bx + bw / 2, by + bh * 0.5, bh * 0.27, Z.time); } });
  });
}
function tabHeroes(m, f, a, top, bot) {
  var S = a.S, w = f.w, ctx = a.ctx, heroes = Z.ALLY_ORDER.filter(function (t) { return Z.ALLIES[t]; });
  m.sel = m.sel || heroes[0];
  // 2.7.21: все герои помещаются в рамку (девятый раньше вылезал за край): в один ряд или в два
  var cols = heroes.length, cw = (w - 28 * S - (cols - 1) * 4 * S) / cols;
  if (cw < 36 * S) { cols = Math.ceil(heroes.length / 2); cw = (w - 28 * S - (cols - 1) * 4 * S) / cols; }
  var ch = Math.min(cw * 1.15, 54 * S), hrows = Math.ceil(heroes.length / cols);
  heroes.forEach(function (t, i) {
    var x = f.x + 14 * S + (i % cols) * (cw + 4 * S), hy = top + Math.floor(i / cols) * (ch + 4 * S);
    a.button('hs_' + t, x, hy, cw, ch, { modal: true, r: 8 * S, c1: m.sel === t ? '#4cc77d' : '#fdf7ec', c2: m.sel === t ? COL.greenD : COL.panelD, fn: function () { m.sel = t; },
      draw: function (bx, by, bw, bh) { ctx.save(); ctx.beginPath(); ctx.rect(bx + 2, by + 2, bw - 4, bh - 4); ctx.clip(); D.ally(t, bx + bw / 2, by + bh * 0.92, bh * 0.36, { dir: 1 }); ctx.restore(); } });
  });
  var t = m.sel, py = top + hrows * (ch + 4 * S) + 8 * S;
  // 2.11.5: низкий широкий экран (телефон лёжа) — герой слева на всю высоту, облики и накидки справа
  var wide = (bot - top) < 380 * S && w > (bot - top) * 1.9, PW = wide ? w * 0.4 : w - 28 * S, CX0 = f.x + 14 * S + PW / 2, RX = wide ? f.x + 26 * S + PW : f.x + 14 * S, RW = wide ? w - 40 * S - PW : w - 28 * S;
  var ph = wide ? bot - py - 32 * S : Math.min(170 * S, (bot - py) * 0.42);
  D.rr(f.x + 14 * S, py, PW, ph, 14 * S); ctx.fillStyle = '#20305e'; ctx.fill();
  ctx.save(); D.rr(f.x + 14 * S, py, PW, ph, 14 * S); ctx.clip(); ctx.fillStyle = '#eef4ff'; ctx.fillRect(f.x, py + ph * 0.84, w, ph);
  // 2.11.5: примерка — выбранный, но не купленный облик показывается на большом герое до покупки
  var tr = m.try && m.try.h === t ? m.try.id : null, svT = Z.save.skins.on[t], soT = tr && Z.save.skins.own[t + ':' + tr];
  if (tr) { Z.save.skins.on[t] = tr; Z.save.skins.own[t + ':' + tr] = 1; }
  var as = accSave(), atr = m.atry && m.atry.h === t ? m.atry.id : null, svA = as.acc[t], soA = atr && as.accOwn[t + ':' + atr];
  if (atr) { if (atr === 'none') delete as.acc[t]; else { as.acc[t] = atr; as.accOwn[t + ':' + atr] = 1; } }
  D.ally(t, CX0, py + ph * 0.93, ph * 0.29 * (UI.heroK && UI.heroK[t] ? Math.min(1.15, Math.max(0.8, UI.heroK[t])) : 1), { dir: 1, walk: true });   // 2.11.5: мельче — посох и шапка целиком в окне
  if (tr) { Z.save.skins.on[t] = svT; if (!soT) delete Z.save.skins.own[t + ':' + tr]; }
  if (atr) { if (svA) as.acc[t] = svA; else delete as.acc[t]; if (atr !== 'none' && !soA) delete as.accOwn[t + ':' + atr]; }
  var aq = atr && atr !== 'none' && !as.accOwn[t + ':' + atr] ? ACCM[atr] : null, tryAny = tr || aq;
  var hsh = tr || (Z.heroSkin(t) && Z.heroSkin(t).id), hpk = hsh && Z.heroPerkText ? Z.heroPerkText(hsh) : null;
  if (hpk) {   // 2.11.5: свойство облика героя в бою — слева, чтобы не залезать на героя
    var hx0 = f.x + 26 * S, hw = PW / 2 - 56 * S, hd = hpk.desc, hl = [hd];
    if (D.fitText(hd, hw, 12 * S) < 10.5 * S) { var ws = hd.split(' '), h1 = ''; while (ws.length && D.mw(h1 + ws[0], 12 * S) < hw * 0.95) h1 += ws.shift() + ' '; hl = [h1.trim(), ws.join(' ')]; }
    D.text('✦ ' + hpk.name, hx0, py + (tr ? 48 : 22) * S, D.fitText('✦ ' + hpk.name, hw, 14 * S), '#ffd54a', 'left', 'middle', 0);
    hl.forEach(function (ln, i) { D.text(ln, hx0, py + (tr ? 67 : 41) * S + i * 15 * S, D.fitText(ln, hw, 12 * S), '#ffffff', 'left', 'middle', 0); });
  }

  if (tryAny) { D.rr(f.x + 22 * S, py + 8 * S, 96 * S, 22 * S, 8 * S); ctx.fillStyle = 'rgba(255,213,74,0.95)'; ctx.fill(); D.text(TT('Примерка', 'Preview'), f.x + 70 * S, py + 19 * S, 12 * S, OL); }
  ctx.restore();
  if (aq && !tr) {   // покупка накидки
    var alab = TT('Купить «', 'Buy "') + (Z.LANG === 'en' ? aq.en : aq.ru) + TT('» за ', '" for ') + aq.cost, abw = Math.min(PW - 12 * S, 300 * S);
    a.button('accbuy', CX0 - abw / 2, py + ph + 2 * S, abw, 26 * S, { modal: true, r: 9 * S, c1: '#3fb6e6', c2: '#2a8bbd', pulse: true,
      fn: function () {
        if (Z.save.flakes < aq.cost) { Z.AU.sfx('error'); Z.needFlakes(aq.cost); return; }
        Z.save.flakes -= aq.cost; as.accOwn[t + ':' + aq.id] = 1; as.acc[t] = aq.id; m.atry = null; Z.AU.sfx('levelup'); Z.persist(true);
      },
      draw: function (bx, by, bw2, bh2) { var fs = D.fitText(alab, bw2 - 34 * S, 13 * S); D.text(alab, bx + bw2 / 2 - 9 * S, by + bh2 / 2, fs, '#fff', 'center', 'middle', 2.5 * S); D.flakeIcon(bx + bw2 / 2 + D.mw(alab, fs) / 2 + 2 * S, by + bh2 / 2, 6 * S); } });
  } else if (tr) {
    var spc = tr === 'gold', blab = spc ? TT('Золотой — в «Стартовом наборе»', 'Golden — in the Starter pack') : TT('Купить «', 'Buy "') + (Z.LANG === 'en' ? SKIN[tr].en : SKIN[tr].ru) + TT('» за ', '" for ') + SKIN_COST(), bww = Math.min(w - 40 * S, 300 * S);
    bww = Math.min(bww, PW - 12 * S); a.button('skbuy', CX0 - bww / 2, py + ph + 2 * S, bww, 26 * S, { modal: true, r: 9 * S, c1: spc ? '#ffd54a' : '#3fb6e6', c2: spc ? COL.goldD : '#2a8bbd', pulse: true,
      fn: function () {
        if (spc) { Z.openOffer(); return; }
        if (Z.save.flakes < SKIN_COST()) { Z.AU.sfx('error'); Z.needFlakes(SKIN_COST()); return; }
        Z.save.flakes -= SKIN_COST(); Z.giveSkin(t, tr); Z.AU.sfx('levelup'); m.try = null;
      },
      draw: function (bx, by, bw2, bh2) { var tx = blab, fs = D.fitText(tx, bw2 - (spc ? 16 : 34) * S, 13 * S); D.text(tx, bx + bw2 / 2 - (spc ? 0 : 9 * S), by + bh2 / 2, fs, '#fff', 'center', 'middle', 2.5 * S); if (!spc) D.flakeIcon(bx + bw2 / 2 + D.mw(tx, fs) / 2 + 2 * S, by + bh2 / 2, 6 * S); } });
    // 2.11.5: примерить облик в настоящем бою — за рекламу, на один бой
    if (!spc && Z.startTrial && Z.SDK && Z.SDK.rewarded) { var tlab = TT('▶ Взять в бой на пробу', '▶ Try it in one battle'), trOn = Z.save.trial && Z.save.trial.h === t && Z.save.trial.s === tr;
      a.button('sktrial', CX0 - Math.min(bww * 0.36, 115 * S), py + ph - 27 * S, Math.min(bww * 0.72, 230 * S), 22 * S, { modal: true, r: 8 * S, enabled: !trOn, c1: '#9a7ce8', c2: COL.purpleD, fn: function () { Z.startTrial(t, tr); },
        draw: function (bx, by, bw2, bh2) { var tl = trOn ? TT('✓ Будет в следующем бою', '✓ On in your next battle') : tlab; D.text(tl, bx + bw2 / 2, by + bh2 / 2, D.fitText(tl, bw2 - 12 * S, 12 * S), '#fff', 'center', 'middle', 2 * S); } }); }
  } else D.text(T('al_' + t).split(' — ')[0], CX0, py + ph + 14 * S, 16 * S, OL);
  var opts = [['base', TT('Обычный', 'Classic')]].concat((HSK[t] || ['ice', 'night', 'mint']).concat(Object.keys(SKIN).filter(function (id) { return (HSK[t] || []).indexOf(id) < 0 && Z.save.skins && Z.save.skins.own && Z.save.skins.own[t + ':' + id]; })).map(function (id) { return [id, Z.LANG === 'en' ? SKIN[id].en : SKIN[id].ru]; }));
  var sw = (RW - (opts.length - 1) * 6 * S) / opts.length, sy = wide ? py + 18 * S : py + ph + 46 * S, sh = Z.heroAccOk(t) ? Math.min(96 * S, (bot - sy - 30 * S) / 2) : Math.min(96 * S, bot - sy - 6 * S);
  D.text(TT('Цвет одежды', 'Outfit colour'), RX + 4 * S, sy - 9 * S, 12 * S, '#5a6b8f', 'left');
  opts.forEach(function (o, i) {
    var id = o[0], own = id === 'base' || !!Z.save.skins.own[t + ':' + id], on = (Z.save.skins.on[t] || 'base') === id || (id === 'base' && !Z.heroSkin(t));
    var special = id === 'gold' && !own;  // золотой — только из стартового набора
    var tryOn = m.try && m.try.h === t && m.try.id === id;
    a.button('sk_' + id, RX + i * (sw + 6 * S), sy, sw, sh, { modal: true, r: 10 * S, c1: on ? '#4cc77d' : tryOn ? '#ffe9a8' : '#fdf7ec', c2: on ? COL.greenD : tryOn ? COL.goldD : COL.panelD,
      fn: function () {
        if (own) { Z.save.skins.on[t] = id; m.try = null; Z.AU.sfx('select'); Z.persist(); return; }
        m.try = { h: t, id: id }; m.atry = null; Z.AU.sfx('select');   // 2.11.5: сначала примерка, покупка — отдельной кнопкой
      },
      draw: function (bx, by, bw, bh) {
        var sv = Z.save.skins.on[t], so = Z.save.skins.own[t + ':' + id]; Z.save.skins.on[t] = id; if (id !== 'base') Z.save.skins.own[t + ':' + id] = 1;
        ctx.save(); ctx.beginPath(); ctx.rect(bx + 2, by + 2, bw - 4, bh - 24 * S); ctx.clip(); D.ally(t, bx + bw / 2, by + bh - 26 * S, (bh - 30 * S) * 0.36, { dir: 1 }); ctx.restore();
        Z.save.skins.on[t] = sv; if (id !== 'base' && !so) delete Z.save.skins.own[t + ':' + id];
        var lab = own ? (on ? '✓ ' : '') + o[1] : special ? TT('набор', 'pack') : '';
        if (own || special) D.text(lab, bx + bw / 2, by + bh - 11 * S, Math.max(10, D.fitText(lab, bw - 4 * S, 12 * S)), on ? '#fff' : OL, 'center', 'middle', on ? 2 * S : 0);
        else { D.flakeIcon(bx + bw / 2 - 10 * S, by + bh - 11 * S, 6 * S); D.text('' + SKIN_COST(), bx + bw / 2, by + bh - 10 * S, 12 * S, OL, 'left'); }
      } });
  });
  if (!Z.heroAccOk(t)) return;
  // гардероб: накидка
  var ay = sy + sh + 24 * S, aopts = [['none', TT('Без накидки', 'None'), 0]].concat(ACC.map(function (q) { return [q[0], Z.LANG === 'en' ? q[4] : q[3], q[2]]; }));
  D.text(TT('Накидка', 'Cape'), RX + 4 * S, ay - 9 * S, 12 * S, '#5a6b8f', 'left');
  var aw = (RW - (aopts.length - 1) * 5 * S) / aopts.length, ah = Math.min(sh, bot - ay - 4 * S);
  aopts.forEach(function (o, i) {
    var id = o[0], own = id === 'none' || !!as.accOwn[t + ':' + id], on = (Z.heroAccOn(t) || 'none') === id, tryOn = m.atry && m.atry.h === t && m.atry.id === id;
    a.button('ac_' + id, RX + i * (aw + 5 * S), ay, aw, ah, { modal: true, r: 9 * S, c1: on ? '#4cc77d' : tryOn ? '#ffe9a8' : '#fdf7ec', c2: on ? COL.greenD : tryOn ? COL.goldD : COL.panelD,
      fn: function () { if (own) { if (id === 'none') delete as.acc[t]; else as.acc[t] = id; m.atry = null; Z.AU.sfx('select'); Z.persist(); return; } m.atry = { h: t, id: id }; m.try = null; Z.AU.sfx('select'); },
      draw: function (bx, by, bw, bh) {
        var sv = as.acc[t], so = as.accOwn[t + ':' + id]; if (id === 'none') delete as.acc[t]; else { as.acc[t] = id; as.accOwn[t + ':' + id] = 1; }
        ctx.save(); ctx.beginPath(); ctx.rect(bx + 2, by + 2, bw - 4, bh - 22 * S); ctx.clip(); D.ally(t, bx + bw / 2, by + bh - 24 * S, (bh - 28 * S) * 0.36, { dir: 1 }); ctx.restore();
        if (sv) as.acc[t] = sv; else delete as.acc[t]; if (id !== 'none' && !so) delete as.accOwn[t + ':' + id];
        if (own) { var lb = (on ? '✓ ' : '') + o[1]; D.text(lb, bx + bw / 2, by + bh - 10 * S, Math.max(9, D.fitText(lb, bw - 4 * S, 11 * S)), on ? '#fff' : OL, 'center', 'middle', on ? 2 * S : 0); }
        else { D.flakeIcon(bx + bw / 2 - 10 * S, by + bh - 10 * S, 6 * S); D.text('' + o[2], bx + bw / 2, by + bh - 9 * S, 12 * S, OL, 'left'); }
      } });
  });
}
// 2.11.5: облики вышек — у каждой вышки свой; сверху выбор вышки, по центру примерка, снизу облики
function tabTowers(m, f, a, top, bot) {
  var S = a.S, w = f.w, ctx = a.ctx, sk = twSk(), types = Z.TOWER_ORDER.slice(), isOpen = function (t) { return Z.towerUnlocked ? Z.towerUnlocked(t, Z.unlockedLevel ? Z.unlockedLevel() : 99) : true; };   // 2.11.5: все вышки — облик можно подобрать заранее
  m.tsel = m.tsel || types[0]; var t = m.tsel;
  var cw = (w - 28 * S - (types.length - 1) * 4 * S) / types.length, chh = Math.min(cw * 0.95, 52 * S);
  types.forEach(function (ty, i) {
    a.button('tt_' + ty, f.x + 14 * S + i * (cw + 4 * S), top, cw, chh, { modal: true, r: 8 * S, c1: t === ty ? '#4cc77d' : '#fdf7ec', c2: t === ty ? COL.greenD : COL.panelD, fn: function () { m.tsel = ty; m.ttry = null; },
      draw: function (bx, by, bw, bh) { ctx.save(); ctx.beginPath(); ctx.rect(bx + 2, by + 2, bw - 4, bh - 4); ctx.clip(); D.tower({ type: ty, lvl: 1, ang: -0.6, recoil: 0, spin: 0, pop: 0, stun: 0 }, bx + bw / 2, by + bh * 0.86, bh * 0.85, Z.time); ctx.restore(); if (!isOpen(ty)) { ctx.fillStyle = 'rgba(40,50,90,0.35)'; D.rr(bx + 2, by + 2, bw - 4, bh - 4, 6 * S); ctx.fill(); D.text('🔒', bx + bw - 10 * S, by + 11 * S, 10 * S, '#fff'); } } });
  });
  var py = top + chh + 8 * S, ph = Math.min((innerHeight > innerWidth ? 240 : 165) * S, (bot - py) * 0.5), cur = sk.twT[t] && sk.tw[t + ':' + sk.twT[t]] ? sk.twT[t] : 'base', tr = m.ttry && m.ttry.t === t ? m.ttry.id : null, show = tr || cur;
  D.rr(f.x + 14 * S, py, w - 28 * S, ph, 14 * S); ctx.fillStyle = '#20305e'; ctx.fill();
  ctx.save(); D.rr(f.x + 14 * S, py, w - 28 * S, ph, 14 * S); ctx.clip(); ctx.fillStyle = '#eef4ff'; ctx.fillRect(f.x, py + ph * 0.82, w, ph);
  var svT = sk.twT[t], svO = show !== 'base' && sk.tw[t + ':' + show]; if (show === 'base') delete sk.twT[t]; else { sk.twT[t] = show; sk.tw[t + ':' + show] = 1; }
  var pvT = { type: t, lvl: 1, ang: -0.7 + Math.sin(Z.time * 0.8) * 0.4, recoil: (Z.time % 1.6) < 0.12 ? 0.12 - (Z.time % 1.6) : 0, spin: Z.time * 4, pop: 0, stun: 0 }, pvY = py + ph * 0.8, pvS = ph * 0.72;
  D.twPad(pvT, f.x + w / 2, pvY + pvS * 0.034, pvS / 1.18); D.tower(pvT, f.x + w / 2, pvY, pvS, Z.time);
  if (svT) sk.twT[t] = svT; else delete sk.twT[t]; if (show !== 'base' && !svO) delete sk.tw[t + ':' + show];
  var pk = show !== 'base' && Z.towerPerkText ? Z.towerPerkText(show) : null;
  if (pk) {   // 2.11.5: свойство облика в бою
    var px0 = f.x + (tr ? 128 : 26) * S, pw = f.x + w - 26 * S - px0, fs1 = D.fitText('✦ ' + pk.name, pw, 14 * S), fs2 = D.fitText(pk.desc, pw, 11.5 * S), fs3 = D.fitText(pk.set, pw, 10.5 * S);
    D.text('✦ ' + pk.name, f.x + w - 26 * S, py + 19 * S, fs1, '#ffd54a', 'right', 'middle', 0);
    D.text(pk.desc, f.x + w - 26 * S, py + 37 * S, fs2, '#ffffff', 'right', 'middle', 0);
    D.text(pk.set, f.x + w - 26 * S, py + 53 * S, fs3, '#9fd8ff', 'right', 'middle', 0);
  }
  if (tr) { D.rr(f.x + 22 * S, py + 8 * S, 96 * S, 22 * S, 8 * S); ctx.fillStyle = 'rgba(255,213,74,0.95)'; ctx.fill(); D.text(TT('Примерка', 'Preview'), f.x + 70 * S, py + 19 * S, 12 * S, OL); }
  ctx.restore();
  if (tr) {
    var q = TSKIN[tr], spc = !q.cost, bl = spc ? TT('«Царская» — в «Стартовом наборе»', '"Royal" — in the Starter pack') : TT('Купить «', 'Buy "') + (Z.LANG === 'en' ? q.en : q.ru) + TT('» за ', '" for ') + q.cost, bww = Math.min(w - 40 * S, 300 * S);
    a.button('twbuy', f.x + (w - bww) / 2, py + ph + 4 * S, bww, 28 * S, { modal: true, r: 9 * S, c1: spc ? '#ffd54a' : '#3fb6e6', c2: spc ? COL.goldD : '#2a8bbd', pulse: true,
      fn: function () { if (spc) { Z.openOffer(); return; } if (Z.save.flakes < q.cost) { Z.AU.sfx('error'); Z.needFlakes(q.cost); return; }
        Z.save.flakes -= q.cost; sk.tw[t + ':' + tr] = 1; sk.twT[t] = tr; m.ttry = null; Z.AU.sfx('levelup'); UI.toast(TT('Новый облик: ', 'New look: ') + (Z.LANG === 'en' ? q.en : q.ru), '#9dff6a'); Z.persist(true); },
      draw: function (bx, by, bw2, bh2) { var fs = D.fitText(bl, bw2 - (spc ? 16 : 34) * S, 13 * S); D.text(bl, bx + bw2 / 2 - (spc ? 0 : 9 * S), by + bh2 / 2, fs, '#fff', 'center', 'middle', 2.5 * S); if (!spc) D.flakeIcon(bx + bw2 / 2 + D.mw(bl, fs) / 2 + 2 * S, by + bh2 / 2, 6 * S); } });
  } else D.text(T('t_' + t), f.x + w / 2, py + ph + 18 * S, 15 * S, OL);
  var opts = [['base', TT('Обычный', 'Classic'), 0]].concat(TSK.map(function (q2) { return [q2[0], Z.LANG === 'en' ? q2[4] : q2[3], q2[5]]; }));
  var sw = (w - 28 * S - (opts.length - 1) * 5 * S) / opts.length, sy = py + ph + 40 * S, sh = Math.min(96 * S, bot - sy - 6 * S);
  opts.forEach(function (o, i) {
    var id = o[0], own = id === 'base' || !!sk.tw[t + ':' + id], on = cur === id, tryOn = tr === id;
    a.button('tw_' + id, f.x + 14 * S + i * (sw + 5 * S), sy, sw, sh, { modal: true, r: 10 * S, c1: on ? '#4cc77d' : tryOn ? '#ffe9a8' : '#fdf7ec', c2: on ? COL.greenD : tryOn ? COL.goldD : COL.panelD,
      fn: function () { if (own) { if (id === 'base') delete sk.twT[t]; else sk.twT[t] = id; m.ttry = null; Z.AU.sfx('select'); Z.persist(); } else { m.ttry = { t: t, id: id }; Z.AU.sfx('select'); } },
      draw: function (bx, by, bw, bh) {
        var so = sk.twT[t], sow = id !== 'base' && sk.tw[t + ':' + id]; if (id === 'base') delete sk.twT[t]; else { sk.twT[t] = id; sk.tw[t + ':' + id] = 1; }
        ctx.save(); ctx.beginPath(); ctx.rect(bx + 2, by + 2, bw - 4, bh - 24 * S); ctx.clip(); D.tower({ type: t, lvl: 1, ang: -0.6, recoil: 0, spin: 0, pop: 0, stun: 0 }, bx + bw / 2, by + bh - 28 * S, (bh - 30 * S) * 0.85, Z.time); ctx.restore();
        if (so) sk.twT[t] = so; else delete sk.twT[t]; if (id !== 'base' && !sow) delete sk.tw[t + ':' + id];
        if (own) D.text((on ? '✓ ' : '') + o[1], bx + bw / 2, by + bh - 11 * S, Math.max(9.5, D.fitText((on ? '✓ ' : '') + o[1], bw - 4 * S, 12 * S)), on ? '#fff' : OL, 'center', 'middle', on ? 2 * S : 0);
        else if (!o[2]) D.text(TT('набор', 'pack'), bx + bw / 2, by + bh - 11 * S, 12 * S, OL);
        else { D.flakeIcon(bx + bw / 2 - 10 * S, by + bh - 11 * S, 6 * S); D.text('' + o[2], bx + bw / 2, by + bh - 10 * S, 12 * S, OL, 'left'); }
      } });
  });
  var fy = sy + sh + 16 * S; if (Z.towerPerkText && bot - fy > 10 * S) { var ft = Z.towerPerkText('gift').fest; D.text(ft, f.x + w / 2, fy, D.fitText(ft, w - 36 * S, 11.5 * S), '#5a6b8f'); }
}
var FNAME = { base: ['Снежная крепость', 'Snow fort'], ice: ['Ледяной дворец', 'Ice palace'], candy: ['Пряничный домик', 'Gingerbread house'], gold: ['Царский терем', 'Tsar\'s tower'], night: ['Звёздный замок', 'Star castle'] };
Z.fortOwn = function (id) {   // 2.11.5: облик крепости покупается за снежинки; кто открыл его звёздами раньше — оставляем
  var own = Z.save.deco.own, list = Z.COS.fort;
  if (!Z.save.seen.fortMig) { Z.save.seen.fortMig = 1; var st = Z.totalStars ? Z.totalStars() : 0; list.forEach(function (c) { if (c.fl && st >= c.need) own['fort_' + c.id] = 1; }); if (Z.save.cos.fort && Z.save.cos.fort !== 'base') own['fort_' + Z.save.cos.fort] = 1; }
  var c = list.filter(function (q) { return q.id === id; })[0]; return !c || !c.fl || !!own['fort_' + id];
};
function tabFort(m, f, a, top, bot) {   // 2.11.5: «Мир» — облик крепости и фон главного меню (всё за снежинки)
  var S = a.S, w = f.w, ctx = a.ctx, list = Z.COS.fort, BG = Z.MENU_BG || [];
  D.flakeIcon(f.x + w - 62 * S, top + 10 * S, 8 * S); D.text('' + Z.save.flakes, f.x + w - 50 * S, top + 11 * S, 16 * S, OL, 'left');
  var bgH = BG.length ? Math.min(110 * S, (bot - top) * 0.3) : 0, gy = top + 26 * S, gap = 8 * S, cols = 3, rows = Math.ceil(list.length / cols);
  var cw2 = (w - 36 * S - gap * (cols - 1)) / cols, ch2 = Math.min(cw2 * 0.9, (bot - gy - bgH - 30 * S - gap * (rows - 1)) / rows);
  D.text(m.fortTry ? TT('Нажми ещё раз — купить', 'Tap again to buy') : TT('Облик крепости', 'Fortress look'), f.x + 18 * S, top + 11 * S, 13 * S, m.fortTry ? COL.goldD : '#5a6b8f', 'left');
  list.forEach(function (c, i) {
    var own = Z.fortOwn(c.id), on = (Z.save.cos.fort || 'base') === c.id, tryOn = m.fortTry === c.id, bx0 = f.x + 18 * S + (i % cols) * (cw2 + gap), by0 = gy + Math.floor(i / cols) * (ch2 + gap);
    a.button('cs_fort' + c.id, bx0, by0, cw2, ch2, { modal: true, r: 12 * S, c1: on ? '#4cc77d' : tryOn ? '#ffe9a8' : '#fdf7ec', c2: on ? COL.greenD : tryOn ? COL.goldD : COL.panelD,
      fn: function () {
        Z.AU.sfx('select');
        if (own) { Z.save.cos.fort = c.id; m.fortTry = null; Z.persist(); return; }
        if (m.fortTry !== c.id) { m.fortTry = c.id; return; }
        if (Z.save.flakes < c.fl) { Z.AU.sfx('error'); Z.needFlakes(c.fl); return; }
        Z.save.flakes -= c.fl; Z.save.deco.own['fort_' + c.id] = 1; Z.save.cos.fort = c.id; m.fortTry = null; Z.AU.sfx('levelup'); Z.persist(true);
      },
      draw: function (bx, by, bw, bh) {
        ctx.save(); var sv = Z.save.cos.fort; Z.save.cos.fort = c.id; ctx.beginPath(); ctx.rect(bx + 3, by + 3, bw - 6, bh - 22 * S); ctx.clip(); if (!own && !tryOn) ctx.globalAlpha = 0.7; D.fortress(bx + bw / 2, by + bh - 26 * S, Math.min(bw * 0.28, (bh - 26 * S) * 0.33), 1, 0, Z.time); Z.save.cos.fort = sv; ctx.restore(); ctx.globalAlpha = 1;
        var nm = FNAME[c.id] ? FNAME[c.id][Z.LANG === 'en' ? 1 : 0] : c.id;
        if (!own) { D.flakeIcon(bx + bw / 2 - 12 * S, by + bh - 11 * S, 6.5 * S); D.text('' + c.fl, bx + bw / 2 - 3 * S, by + bh - 10 * S, 12.5 * S, OL, 'left'); }
        else D.text((on ? '✓ ' : '') + nm, bx + bw / 2, by + bh - 11 * S, Math.max(9, D.fitText((on ? '✓ ' : '') + nm, bw - 6 * S, 11.5 * S)), on ? '#fff' : OL, 'center', 'middle', on ? 2 * S : 0);
      } });
  });
  if (!BG.length) return;
  var by1 = bot - bgH, own = Z.save.deco.own, curBg = Z.save.cos.bg || 'night';
  D.text(TT('Фон главного меню', 'Main menu background'), f.x + 18 * S, by1 - 8 * S, 12 * S, '#5a6b8f', 'left');
  var bw3 = (w - 36 * S - gap * (BG.length - 1)) / BG.length;
  BG.forEach(function (q, i) {
    var id = q[0], ow = !q[1] || !!own['bg_' + id], on = curBg === id, tryOn = m.bgTry === id;
    a.button('bg_' + id, f.x + 18 * S + i * (bw3 + gap), by1, bw3, bgH, { modal: true, r: 10 * S, c1: on ? '#4cc77d' : tryOn ? '#ffe9a8' : '#fdf7ec', c2: on ? COL.greenD : tryOn ? COL.goldD : COL.panelD,
      fn: function () { Z.AU.sfx('select'); if (ow) { Z.save.cos.bg = id; m.bgTry = null; Z.persist(); return; }
        if (m.bgTry !== id) { m.bgTry = id; return; }
        if (Z.save.flakes < q[1]) { Z.AU.sfx('error'); Z.needFlakes(q[1]); return; }
        Z.save.flakes -= q[1]; own['bg_' + id] = 1; Z.save.cos.bg = id; m.bgTry = null; Z.AU.sfx('levelup'); Z.persist(true); },
      draw: function (bx, by, bw, bh) {
        ctx.save(); D.rr(bx + 4 * S, by + 4 * S, bw - 8 * S, bh - 26 * S, 7 * S); ctx.clip(); if (Z.menuBgThumb) Z.menuBgThumb(id, bx + 4 * S, by + 4 * S, bw - 8 * S, bh - 26 * S, Z.time); ctx.restore();
        var nm = Z.LANG === 'en' ? q[3] : q[2];
        if (ow) D.text((on ? '✓ ' : '') + nm, bx + bw / 2, by + bh - 11 * S, Math.max(9, D.fitText((on ? '✓ ' : '') + nm, bw - 6 * S, 11.5 * S)), on ? '#fff' : OL, 'center', 'middle', on ? 2 * S : 0);
        else if (tryOn) D.text(TT('Купить: ', 'Buy: ') + q[1], bx + bw / 2, by + bh - 11 * S, 11 * S, OL);
        else { D.flakeIcon(bx + bw / 2 - 9 * S, by + bh - 11 * S, 5.5 * S); D.text('' + q[1], bx + bw / 2 - 1 * S, by + bh - 10 * S, 12 * S, OL, 'left'); }
      } });
  });
}

// сундуки на карте теперь ещё и с игрушкой
var oldOpen = UI.openModal;
UI.openModal = function (m) {
  if (m && m.type === 'chest' && !m.toy) { var tq = Z.randomToy(); if (tq && Z.giveToy(tq, true)) m.toy = tq; }
  return oldOpen.apply(this, arguments);
};
MODALS.chest = function (m, w, a) {
  var S = a.S, f = a.frame(w, 300 * S, T('chest'));
  D.text(T('chestD'), f.x + w / 2, f.y + 48 * S, D.fitText(T('chestD'), w - 40 * S, 15 * S), OL);
  D.gift(f.x + w / 2 - 70 * S, f.y + 118 * S, 24 * S); D.flakeIcon(f.x + w / 2 - 22 * S, f.y + 118 * S, 13 * S); D.text('+' + m.reward, f.x + w / 2 - 4 * S, f.y + 119 * S, 24 * S, '#2a8bbd', 'left');
  if (m.toy) { drawToy(m.toy, f.x + w / 2 + 70 * S, f.y + 118 * S, 20 * S, Z.time); D.text(Z.toyName(m.toy), f.x + w / 2 + 70 * S, f.y + 154 * S, D.fitText(Z.toyName(m.toy), 140 * S, 12 * S), '#4a5378'); }
  a.bigBtn('ctake', f, f.y + f.h - 66 * S, T('ok'), function () { UI.closeModal(); });
};
})();
