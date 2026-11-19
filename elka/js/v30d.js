/* 2.11.5 · полный объёмный звук: каждый игровой звук — из своей точки карты.
   Раньше по месту звучали только взрывы, гибель врагов, постройка, герои и новые ловушки; выстрелы вышек, попадания,
   шаги и удары врагов, удары по вышкам шли по центру. Теперь всё, что происходит в бою, звучит оттуда, где происходит:
   враг — там, где он идёт (летящий — выше), вышка — со своей клетки, попадание — в цель, тревога — у ёлки.
   Вокруг — «живой» фон: птицы, сова ночью, лиса, бульканье и лягушки у воды, ветер в горах — из разных точек карты. */
(function () {
'use strict';
var Z = window.Z, AU = Z.AU; if (!AU) return;
function at(x, y, h) { if (AU.at) AU.at(x, y, h); }
var hk = Z.hk;
// враг: всё, что он делает в свой ход (шаги, голос, удар по вышке или герою), — из его точки
var oE = hk.enemy;
hk.enemy = function (e, dt, v) { var p = Z.enemyPos ? Z.enemyPos(e) : e; at(p.x, p.y, e.air ? 1.3 : 0); return oE ? oE.apply(this, arguments) : false; };
// вышка: выстрел — с её клетки, чуть выше земли
var oF = hk.towerFire;
hk.towerFire = function (tw, st, e, fire) { at(tw.c + 0.5, tw.r + 0.5, 0.45); if (oF) return oF.apply(this, arguments); return fire(tw, st, e); };
// попадание — в цели
var oD = hk.dmg;
hk.dmg = function (e, real, opts) { at(e.x, e.y, e.air ? 1.3 : 0); return oD ? oD.apply(this, arguments) : real; };
// герой: его шаги, удары и крики — от него
var oS = hk.unitSpd;
hk.unitSpd = function (H) { at(H.x, H.y, 0); return oS ? oS.apply(this, arguments) : 1; };
// удар по вышке — с вышки
var oDT = Z.damageTower;
Z.damageTower = function (tw) { at(tw.c + 0.5, tw.r + 0.5, 0.3); return oDT.apply(this, arguments); };
// тревога — у ёлки
var oAl = Z.sndAlarm;
if (oAl) Z.sndAlarm = function () { var L = Z.G && Z.G.L; if (L && L.fort) { at(L.fort[0] + 0.5, L.fort[1] + 0.5, 0.6); var A = AU, n = A.bufs && A.bufs.alarm_bell ? 'alarm_bell' : 'bell'; A.sfx(n, 0.5); return; } return oAl.apply(this, arguments); };
// между кадрами точка сбрасывается: звук, у которого нет своего места, не «прилипает» к последнему врагу
var oU = Z.update;
Z.update = function (dt) { AU.pos = null; var r = oU.apply(this, arguments); AU.pos = null; return r; };

// ---------- живой фон: случайные звуки природы из разных точек карты ----------
function has(n) { return !!(AU.bufs && (AU.bufs[n] || AU.bufs['sfx_' + n])); }
var SPOT = {   // [звук, громкость, высота над землёй, где: edge — у края поля, water — у воды, sky — в небе]
  forest: [['a_magpie', 0.16, 1.6, 'edge'], ['a_magpie_flap', 0.14, 1.4, 'sky'], ['a_fox_yip', 0.12, 0, 'edge'], ['a_owl_hoot', 0.14, 1.2, 'edge', 'night']],
  village: [['a_magpie', 0.15, 1.6, 'edge'], ['hut_cluck', 0.12, 0, 'edge'], ['a_owl_hoot', 0.12, 1.2, 'edge', 'night']],
  lake: [['w_bubble', 0.16, 0, 'water'], ['a_frog', 0.12, 0, 'water'], ['a_magpie_flap', 0.12, 1.4, 'sky'], ['w_splash', 0.1, 0, 'water']],
  mount: [['a_owl_screech', 0.1, 1.6, 'edge', 'night'], ['a_magpie_flap', 0.12, 1.6, 'sky'], ['w_icecrack', 0.1, 0, 'edge']],
  pole: [['w_icecrack', 0.12, 0, 'edge'], ['a_owl_hoot', 0.12, 1.2, 'edge'], ['a_magpie_flap', 0.1, 1.6, 'sky']]
};
var spotT = 4;
function inPlay(G) { return G && G.L && !G.paused && !(Z.ui && Z.ui.modal) && (G.phase === 'wave' || G.phase === 'build' || G.phase === 'between' || G.phase === 'escortRun'); }
function pickSpot(G, where) {
  var L = G.L;
  if (where === 'water') { var w = []; for (var r = 0; r < L.H; r++) for (var c = 0; c < L.W; c++) if (L.grid[r][c] === 4) w.push([c + 0.5, r + 0.5]); if (w.length) return w[Math.floor(Math.random() * w.length)]; }
  if (where === 'sky') return [Math.random() * L.W, Math.random() * L.H * 0.6];
  var side = Math.floor(Math.random() * 3);
  return side === 0 ? [0.3, Math.random() * L.H] : side === 1 ? [L.W - 0.3, Math.random() * L.H] : [Math.random() * L.W, 0.4];
}
setInterval(function () {
  try {
    var G = Z.G; if (!AU.running || !AU.running() || !inPlay(G) || Z.save.spatial === false) return;
    spotT -= 1; if (spotT > 0) return; spotT = G.phase === 'wave' ? 22 + Math.random() * 14 : 10 + Math.random() * 10;   // 2.11.5: реже — в бою птицы не перебивают бой
    var reg = Z.REGIONS[G.info.region].id, night = G.night === true || G.weather === 'night' || G.weather === 'dark' || G.mech === 'dark', list = (SPOT[reg] || SPOT.forest).filter(function (q) { return has(q[0]) && (!q[4] || night); });
    if (G.mech === 'dark') list = list.filter(function (q) { return q[3] !== 'sky'; });
    if (!list.length) return; var q = list[Math.floor(Math.random() * list.length)], p = pickSpot(G, q[3]);
    AU.sfx(q[0], q[1] * (G.phase === 'wave' ? 0.4 : 0.65), { pos: { x: p[0], y: p[1], h: q[2], t: 0 }, pitch: 0.92 + Math.random() * 0.16 });
  } catch (e) { if (window.__rep) window.__rep(e); }
}, 1000);
})();
// 2.11.5: звук нажатия кнопки не накладывается на «свой» звук действия: кнопка сначала выполняет действие, и если оно
// само сыграло звук (выбор, назад, ошибка, покупка, постройка…), общий «тук» не играет. Без задержки — звук сразу.
// «Тук» — три варианта (Ре, Ля, Соль: ноты есть во всех тональностях музыки игры), чтобы частый звук не надоедал.
(function () {
  var Z = window.Z, AU = Z.AU; if (!AU || !AU.sfx) return;
  var o = AU.sfx, last = -1, UIS = { select: 1, back: 1, error: 1, buy: 1, reward: 1, build: 1, unlock: 1, upgrade: 1, levelup: 1, coin: 1, star: 1, place: 1, tw_build: 1 }, TAPS = ['ui_tap', 'ui_tap2', 'ui_tap3'];
  AU._uiN = 0;
  AU.sfx = function (n, v, op) {
    if (UIS[n]) AU._uiN++;
    if (n === 'ui_tap') { var k; do { k = Math.floor(Math.random() * 3); } while (k === last); last = k; n = TAPS[k]; return o.call(this, n, v, op); }
    return o.apply(this, arguments);
  };
})();
// 2.11.5: громкость по видам звука. Все звуки идут через общий регулятор «Все звуки» (sfxG), а перед ним — свои шины:
// бой (выстрелы, удары, враги, герои), интерфейс (кнопки, покупки), природа (птицы, звери, вода). Голоса — своя громкость.
(function () {
  var Z = window.Z, AU = Z.AU; if (!AU) return;
  var UI_N = { ui_tap: 1, ui_tap2: 1, ui_tap3: 1, select: 1, back: 1, error: 1, buy: 1, unlock: 1, star: 1, reward: 1 };
  function cat(n) { return UI_N[n] ? 'ui' : /^(a_|w_|amb_|hut_cluck|hut_bawk)/.test(n) ? 'nat' : 'bat'; }
  function vol(k) { var v = Z.save && Z.save['v_' + k]; return v == null ? 1 : v; }
  var bus = null, main = null, T0 = Date.now();
  function build() {
    if (bus || !AU.ctx || !AU.sfxG || (!AU.pres && Date.now() - T0 < 4000)) return !!bus;
    var c = AU.ctx; main = AU.sfxG; bus = {};
    ['bat', 'ui', 'nat'].forEach(function (k) { var g = c.createGain(); g.gain.value = vol(k); g.connect(main); bus[k] = g; });
    AU.sfxG = bus.bat; AU.sfxMain = main;   // всё, что подключается к sfxG напрямую (синтез выстрелов и т. п.), — это бой
    var oSet = AU.setVolumes;
    AU.setVolumes = function () { var cur = this.sfxG; this.sfxG = main; try { return oSet.apply(this, arguments); } finally { this.sfxG = cur; } };
    return true;
  }
  AU.applyMix = function () { if (!build()) return; var t = AU.ctx.currentTime; for (var k in bus) bus[k].gain.setTargetAtTime(vol(k), t, 0.05); };
  var o = AU.sfx;
  AU.sfx = function (n, v, op) {
    if (!build()) return o.apply(this, arguments);
    var k = cat(n); if (k === 'bat') return o.apply(this, arguments);
    var cur = this.sfxG; this.sfxG = bus[k]; try { return o.apply(this, arguments); } finally { this.sfxG = cur; }
  };
  var TT = function (r, e) { return Z.LANG === 'en' ? e : r; };
  AU.mixRows = function () {
    function row(k, ru, en, demo) { return { k: k, label: TT(ru, en), get: function () { return vol(k); }, set: function (v) { Z.save['v_' + k] = v; AU.applyMix(); }, demo: demo }; }
    return [
      row('bat', 'Бой', 'Battle', function () { AU.sfx('hit_snow', 0.6); }),
      { k: 'voice', label: TT('Голоса', 'Voices'), get: function () { return Z.save.vVoice == null ? 1 : Z.save.vVoice; }, set: function (v) { Z.save.vVoice = v; } },
      row('ui', 'Кнопки', 'Buttons', function () { AU.sfx('ui_tap', 0.5); }),
      row('nat', 'Природа', 'Nature', function () { AU.sfx('a_magpie', 0.4); })
    ];
  };
  setTimeout(function wait() { if (!build()) setTimeout(wait, 500); }, 500);
})();
// 2.11.5: разрешение отрисовки (меньше точек — выше FPS; картинка растягивается до экрана, как апскейл)
(function () {
  var Z = window.Z, R = [0, 1, 0.85, 0.7, 0.55];
  Z.rscaleName = function () { var r = Z.save.rscale || 0; return r ? Math.round(r * 100) + '%' + (r < 1 ? (Z.LANG === 'en' ? ' (faster)' : ' (быстрее)') : '') : (Z.LANG === 'en' ? 'Auto' : 'Авто'); };
  Z.rscaleNext = function () { var i = R.indexOf(Z.save.rscale || 0); Z.save.rscale = R[(i + 1) % R.length] || null; Z.quality = 1; if (Z.resize) Z.resize(); if (Z.ui) Z.ui.fieldCache = null; if (Z.G) Z.G.fieldDirty = true; };
})();
// 2.11.5: кадров в секунду — 30, 45, 60, 90, 120, 144, 240. Выше частоты экрана браузер не рисует, поэтому рядом
// показываем, сколько герц у экрана (меряем по requestAnimationFrame в первые секунды).
(function () {
  var Z = window.Z, F = [30, 45, 60, 90, 120, 144, 240], hz = 0;
  (function meas() { var n = 0, t0 = 0, best = 0; function f(t) { if (!t0) t0 = t; n++; if (t - t0 < 1500) requestAnimationFrame(f); else { var r = (n - 1) / ((t - t0) / 1000); hz = [30, 48, 50, 60, 75, 90, 100, 120, 144, 165, 240].reduce(function (a, b) { return Math.abs(b - r) < Math.abs(a - r) ? b : a; }, 60); } } setTimeout(function () { requestAnimationFrame(f); }, 2500); })();
  Z.screenHz = function () { return hz; };
  Z.fpsName = function () { var v = Z.save.fps || 60, s = '' + v; if (hz && v > hz) s += Z.LANG === 'en' ? ' (screen ' + hz + ' Hz)' : ' (экран ' + hz + ' Гц)'; else if (hz) s += Z.LANG === 'en' ? ' · screen ' + hz + ' Hz' : ' · экран ' + hz + ' Гц'; return s; };
  Z.fpsNext = function () { var v = Z.save.fps || 60, i = F.indexOf(v); Z.save.fps = F[(i + 1) % F.length]; };
})();
