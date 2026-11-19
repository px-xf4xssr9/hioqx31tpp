/* Запуск: SDK Яндекс Игр, сохранения, цикл, пауза, ввод */
(function () {
'use strict';
var Z = window.Z;
var cv = document.getElementById('c'), ctx = cv.getContext('2d');
Z.mainCv = cv;   // 2.11.5: основной холст — по нему кэши понимают, что рисуют прямо на экран
Z.time = 0; Z.DPR = 1; Z.hidden = false; Z.adShowing = false; Z.loaded = false; Z.lastFullAd = -999; Z.lastReward = -999;

// ---------- SDK ----------
var SDK = Z.SDK = {
  ysdk: null, player: null, gameplayOn: false, sdkPaused: false,
  init: function (done) {
    var self = this, finished = false;
    function fin() { if (!finished) { finished = true; done(); } }
    setTimeout(fin, 4000);
    if (typeof YaGames === 'undefined') { fin(); return; }
    try {
      YaGames.init().then(function (ysdk) {
        self.ysdk = ysdk;
        try {
          ysdk.on('game_api_pause', function () { self.sdkPaused = true; Z.onPauseChange(); });
          ysdk.on('game_api_resume', function () { self.sdkPaused = false; Z.onPauseChange(); });
        } catch (e) { if (window.__rep) window.__rep(e); }
        try { Z.LANG = Z.detectLang(ysdk.environment.i18n.lang); } catch (e) { if (window.__rep) window.__rep(e); }
        ysdk.getPlayer().then(function (p) { self.player = p; fin(); }).catch(function () { fin(); });
      }).catch(function () { fin(); });
    } catch (e) { fin(); }
  },
  ready: function () { try { if (this.ysdk && this.ysdk.features.LoadingAPI) this.ysdk.features.LoadingAPI.ready(); } catch (e) { if (window.__rep) window.__rep(e); } },
  setGameplay: function (on) {
    if (on === this.gameplayOn) return;
    this.gameplayOn = on;
    try { if (this.ysdk && this.ysdk.features.GameplayAPI) { if (on) this.ysdk.features.GameplayAPI.start(); else this.ysdk.features.GameplayAPI.stop(); } } catch (e) { if (window.__rep) window.__rep(e); }
  },
  loadCloud: function (cb) {
    if (!this.player) { cb(null); return; }
    try { this.player.getData(['save2']).then(function (d) { cb(d && d.save2 ? d.save2 : null); }).catch(function () { cb(null); }); } catch (e) { cb(null); }
  },
  saveCloud: function (str, flush) { if (!this.player) return; try { this.player.setData({ save2: str }, !!flush).catch(function () {}); } catch (e) { if (window.__rep) window.__rep(e); } },
  fullscreen: function (cb) {
    if (!this.ysdk) { cb(false); return; }
    var called = false; function end(s) { if (!called) { called = true; cb(s); } }
    try {
      this.ysdk.adv.showFullscreenAdv({ callbacks: {
        onOpen: function () { adOpen(); },
        onClose: function (wasShown) { adClose(); end(wasShown); },
        onError: function () { adClose(); end(false); }
      } });
    } catch (e) { adClose(); end(false); }
  },
  rewarded: function (onReward, onDone) {
    if (!this.ysdk) { onReward(); if (onDone) onDone(); return; }
    var called = false; function end() { if (!called) { called = true; if (onDone) onDone(); } }
    try {
      this.ysdk.adv.showRewardedVideo({ callbacks: {
        onOpen: function () { adOpen(); },
        onRewarded: function () { onReward(); },
        onClose: function () { adClose(); end(); },
        onError: function () { adClose(); end(); }
      } });
    } catch (e) { adClose(); end(); }
  },
  scoreEndless: function (v) {
    var y = this.ysdk; if (!y) return;
    try { if (y.isAvailableMethod) y.isAvailableMethod('leaderboards.setScore').then(function (ok) { if (ok && y.leaderboards) y.leaderboards.setScore('endless', v).catch(function () {}); }).catch(function () {}); } catch (e) { if (window.__rep) window.__rep(e); }
  },
  // таблица лидеров: место игрока и соседи. Вне Яндекса — тестовые игроки (помечены в окне)
  lb: function (name, cb) {
    var y = this.ysdk, done = false;
    function fake() {
      if (done) return; done = true;
      var my = name === 'endless' ? (Z.save.endlessBest || 0) : Z.totalStars(), names = ['Снежок', 'Мишутка', 'Varya', 'Лёха', 'Морозко', 'Alina', 'Пельмень', 'Котя', 'Тимур', 'Ёжик', 'Nika', 'Вьюга'];
      var list = names.map(function (n, i) { return { name: n, score: name === 'endless' ? 4 + i * 4 : 4 + i * 8 }; });
      list.push({ name: Z.T('you'), score: my, me: true });
      list.sort(function (a, b) { return b.score - a.score; }); list.forEach(function (e, i) { e.rank = i + 1; });
      cb({ entries: list, test: true });
    }
    if (!y || !y.leaderboards || !y.leaderboards.getEntries) { fake(); return; }
    setTimeout(fake, 4000);
    try {
      y.leaderboards.getEntries(name, { quantityTop: 3, includeUser: true, quantityAround: 3 }).then(function (r) {
        if (done) return; done = true;
        var uid = r.userRank, list = (r.entries || []).map(function (e) { return { name: (e.player && e.player.publicName) || Z.T('anon'), score: e.score, rank: e.rank, me: e.rank === uid }; });
        cb({ entries: list, test: false });
      }).catch(fake);
    } catch (e) { fake(); }
  },
  score: function (v) {
    var y = this.ysdk; if (!y) return;
    try { if (y.isAvailableMethod) y.isAvailableMethod('leaderboards.setScore').then(function (ok) { if (ok && y.leaderboards) y.leaderboards.setScore('stars', v).catch(function () {}); }).catch(function () {}); } catch (e) { if (window.__rep) window.__rep(e); }
  }
};
if (Z.platInit) Z.platInit(SDK);   // 2.11: VK Игры подменяют запуск, рекламу и облачные сохранения (js/plat.js)
function adOpen() { SDK.setGameplay(false); Z.adShowing = true; Z.onPauseChange(); }
function adClose() { Z.adShowing = false; Z.onPauseChange(); }

// ---------- пауза ----------
Z.isPaused = function () { return Z.hidden || Z.adShowing || SDK.sdkPaused || !!Z.ui.modal; };
Z.onPauseChange = function () {
  Z.AU.resumeIfAllowed();
  var G = Z.G;
  SDK.setGameplay(!!Z.readyDone && Z.ui.screen === 'level' && !!G && G.phase !== 'won' && G.phase !== 'lost' && !Z.isPaused());
};
// 2.12.19: звук пропадал после сворачивания и иногда не включался вовсе:
//  - «потеря фокуса» (blur) ставила паузу и глушила звук, а «фокус» внутри окна ВК приходит не всегда — звук оставался выключенным навсегда;
//  - ВК присылает «скрыто», но «показано» — тоже не всегда;
//  - на Android после возврата звуковой контекст бывает «работает», но молчит — его надо перезапустить.
// Теперь: видимая вкладка снимает обе паузы; любое касание или клавиша — тоже (игрок явно в игре); после возврата контекст
// перезапускается (suspend → resume), а если он не ожил — оживёт при первом касании.
var hidT = 0;
function backInGame() {
  if (document.hidden) return;
  var was = Z.hidden || SDK.sdkPaused; Z.hidden = false; SDK.sdkPaused = false;
  if (was) Z.onPauseChange();
}
function kickAudio() {
  var c = Z.AU && Z.AU.ctx; if (!c || !Z.AU.allowed()) return;
  try {
    if (c.state === 'running') c.suspend().then(function () { return c.resume(); }).catch(function () { });
    else if (c.state !== 'closed') c.resume().catch(function () { });
  } catch (e) { if (window.__rep) window.__rep(e); }
}
document.addEventListener('visibilitychange', function () {
  Z.hidden = document.hidden;
  if (Z.hidden) { hidT = Date.now(); Z.persist(true); Z.onPauseChange(); return; }
  SDK.sdkPaused = false; Z.onPauseChange();
  if (Date.now() - hidT > 800) setTimeout(kickAudio, 60);
});
window.addEventListener('blur', function () { Z.hidden = true; Z.onPauseChange(); });
window.addEventListener('focus', function () { backInGame(); });
window.addEventListener('pageshow', function () { backInGame(); setTimeout(kickAudio, 60); });
['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { backInGame(); if (Z.AU && Z.AU.ctx && Z.AU.ctx.state !== 'running') kickAudio(); }, true); });
window.addEventListener('pagehide', function () { Z.persist(true); });

// ---------- сохранения ----------
var KEY = 'elka2_save';
var lastCloud = 0, dirty = false;
Z.persist = function (flush) {
  Z.save.t = Date.now(); if (!Z.save.sync || typeof Z.save.sync !== 'object') Z.save.sync = { rev: 0, n: 0, sn: 0 }; Z.save.sync.n = (Z.save.sync.n || 0) + 1; Z.save.music = Z.save.music === undefined ? 0.7 : Z.save.music;
  var s = JSON.stringify(Z.save);
  try { localStorage.setItem(KEY, s); } catch (e) { if (window.__rep) window.__rep(e); }
  dirty = true;
  if (flush) { SDK.saveCloud(s, true); dirty = false; lastCloud = Z.time; }
};
function cloudTick() { if (dirty && Z.time - lastCloud > 5) { SDK.saveCloud(JSON.stringify(Z.save), false); dirty = false; lastCloud = Z.time; } }
function load(cb) {
  var local = null; try { local = localStorage.getItem(KEY); } catch (e) { if (window.__rep) window.__rep(e); }
  // 2.11.5: ВК — сохранение берётся с нашего сервера (главный источник); телефон и хранилище ВК — запасные
  if (SDK.loadAuth) {
    SDK.loadAuth(local, function (best, other) {
      if (best && best.v === 2) Z.adoptSave(best);
      if (other && other.v === 2) Z.mergeOwned(Z.save, other);
      try { localStorage.setItem(KEY, JSON.stringify(Z.save)); } catch (e) { if (window.__rep) window.__rep(e); }
      cb();
    });
    return;
  }
  SDK.loadCloud(function (cloud) {
    var lt = 0, ct = 0, lo = null, co = null;
    try { lo = local ? JSON.parse(local) : null; lt = lo ? lo.t || 0 : 0; } catch (e) { if (window.__rep) window.__rep(e); }
    try { co = cloud ? JSON.parse(cloud) : null; ct = co ? co.t || 0 : 0; } catch (e) { if (window.__rep) window.__rep(e); }
    var best = ct > lt ? co : lo, other = best === co ? lo : co;
    // 2.11.5: локальная копия заменяется облачной — старую кладём в запас (на случай ошибки)
    if (best === co && local) { try { localStorage.setItem(KEY + '_prev', local); } catch (e) { if (window.__rep) window.__rep(e); } }
    if (best && best.v === 2) Z.adoptSave(best);
    if (other && other.v === 2) Z.mergeOwned(Z.save, other);
    cb();
  });
}
// 2.11.5: что куплено и открыто, не пропадает никогда. Берётся самое новое сохранение (облако или телефон),
// и в него добавляется всё, чем владеет второе: облики, игрушки, покупки, звёзды, исследования, уровни усилений и улучшений,
// выданные заказы ВК (чтобы покупка не выдалась дважды). Количества (снежинки, запасы) — из нового сохранения.
Z.mergeOwned = function (S, O) {
  try {
    function uni(a, b) { if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return; for (var k in b) if (b[k] && !a[k]) a[k] = b[k]; }
    function mx(a, b) { if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return; for (var k in b) { var v = +b[k] || 0; if (v > (+a[k] || 0)) a[k] = v; } }
    mx(S.stars, O.stars); uni(S.heroic, O.heroic); mx(S.research, O.research); uni(S.ach, O.ach); uni(S.chests, O.chests);
    if (S.skins && O.skins) { uni(S.skins.own, O.skins.own); if (O.skins.tw) { S.skins.tw = S.skins.tw || {}; uni(S.skins.tw, O.skins.tw); } if (O.skins.accOwn) { S.skins.accOwn = S.skins.accOwn || {}; uni(S.skins.accOwn, O.skins.accOwn); } }
    if (S.deco && O.deco) { uni(S.deco.own, O.deco.own); uni(S.deco.toys, O.deco.toys); }
    if (S.shop && O.shop) { ['starter', 'noads', 'heroes', 'slot4', 'slot5'].forEach(function (k) { if (O.shop[k] && !S.shop[k]) S.shop[k] = O.shop[k]; }); if (O.shop.vkDone) { S.shop.vkDone = S.shop.vkDone || {}; uni(S.shop.vkDone, O.shop.vkDone); } }
    if (S.buffs && O.buffs) mx(S.buffs.lvl, O.buffs.lvl);
    if (S.inv && O.inv) mx(S.inv.up, O.inv.up);
    if ((O.heroXp || 0) > (S.heroXp || 0)) S.heroXp = O.heroXp;
  } catch (e) { if (window.__rep) window.__rep(e); }
};
Z.todayStr = function () { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
Z.daysToNY = function () { var d = new Date(), ny = new Date(d.getFullYear() + 1, 0, 1), today = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return Math.round((ny - today) / 86400000); };
Z.toggleFullscreen = function () {
  try {
    var y = SDK.ysdk;
    if (y && y.screen && y.screen.fullscreen && y.screen.fullscreen.request) {
      var f = y.screen.fullscreen;
      var p0 = f.status === 'on' ? f.exit() : f.request();
      if (p0 && p0.catch) p0.catch(function () {});
      return;
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
  try {
    var de = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    else {
      // 2.11.5: внутри окна ВК браузер может не дать полный экран — тогда подсказываем кнопку самого ВК, а не молчим
      var fail = function () { if (Z.ui && Z.ui.toast) Z.ui.toast(Z.LANG === 'en' ? 'Use the VK fullscreen button (⤢) at the top of the game window' : 'Полный экран — кнопкой ВК ⤢ над окном игры', '#ffd54a'); };
      var p = (de.requestFullscreen || de.webkitRequestFullscreen).call(de); if (p && p.catch) p.catch(fail);
      setTimeout(function () { if (!(document.fullscreenElement || document.webkitFullscreenElement)) fail(); setTimeout(function () { try { resize(); } catch (e) { } }, 300); }, 900);
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
};

// ---------- размер ----------
function resize() {
  // 2.11.5: телефон — не больше 1,5 точки на пиксель экрана (на экране 6" разница с ×2 почти не видна, а рисовать вдвое меньше)
  Z.isPhone = Z.isPhone !== undefined ? Z.isPhone : (('ontouchstart' in window || navigator.maxTouchPoints > 0) && Math.min(screen.width, screen.height) < 600);
  var dprMax = 2;   // 2.12.6: телефон — до 2 точек на пиксель (1,5 давало «мыло» на экранах ×3); автокачество опустит, если не тянет
  Z.DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, dprMax) * (Z.quality || 1));
  // 2.11.5: разрешение отрисовки задано вручную — кадр рисуется в меньшем разрешении и растягивается до экрана (как апскейл): меньше точек — выше FPS
  var rs = Z.save && Z.save.rscale; if (rs) Z.DPR = Math.max(0.4, Math.min(window.devicePixelRatio || 1, dprMax) * rs);   // 2.8: экономная графика — одна точка экрана на точку   // Z.quality снижается сам, если устройство не тянет (см. цикл)
  var gap = Z.bannerGap || 0, gapR = Z.bannerGapR || 0, w = Math.max(1, window.innerWidth - gapR), h = Math.max(1, window.innerHeight - gap);   // 2.11.5: между игрой и баннером VK — полоса 100 px без кнопок (правило VK п. 5.1.4.2 «г»)
  cv.style.height = gap ? h + 'px' : ''; cv.style.width = gapR ? w + 'px' : '';
  gapDecor(gap, gapR);
  cv.width = Math.round(w * Z.DPR); cv.height = Math.round(h * Z.DPR);
  Z.W = w; Z.H = h;
  Z.ui.layout(w, h);
}
// полоса у баннера — снежный сугроб с ёлочками, без кнопок (чтобы баннер не был рядом с игрой)
function gapDecor(gap, gapR) {
  var el = document.getElementById('bgap');
  if (!gap && !gapR) { if (el) el.style.display = 'none'; return; }
  if (!el) { el = document.createElement('div'); el.id = 'bgap'; document.body.appendChild(el); }
  var pine = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60'><path d='M20 52 L30 18 L40 52Z' fill='%232f8f5b' stroke='%231b2448' stroke-width='2.5' stroke-linejoin='round'/><path d='M26 30 L30 18 L34 30Z' fill='%23fff'/><path d='M82 54 L90 28 L98 54Z' fill='%2324804f' stroke='%231b2448' stroke-width='2.5' stroke-linejoin='round'/><circle cx='60' cy='40' r='2' fill='%23fff' opacity='.8'/><circle cx='108' cy='22' r='1.6' fill='%23fff' opacity='.7'/></svg>\")";
  var st = el.style; st.position = 'fixed'; st.pointerEvents = 'none'; st.display = 'block'; st.zIndex = '0';
  st.backgroundImage = pine + ', linear-gradient(#cfd9f0, #eef3fc 55%, #ffffff)'; st.backgroundRepeat = 'repeat-x, no-repeat';
  if (gap) { st.left = '0'; st.right = '0'; st.bottom = '0'; st.top = 'auto'; st.width = 'auto'; st.height = gap + 'px'; st.backgroundPosition = 'left bottom, 0 0'; st.backgroundSize = '120px 60px, 100% 100%'; }
  else { st.top = '0'; st.bottom = '0'; st.right = '0'; st.left = 'auto'; st.height = 'auto'; st.width = gapR + 'px'; st.backgroundPosition = 'left bottom, 0 0'; st.backgroundSize = '120px 60px, 100% 100%'; }
}
Z.resize = resize;
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', function () { setTimeout(resize, 200); });

// ---------- ввод ----------
function pos(ev) { var r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
cv.addEventListener('pointerdown', function (ev) { ev.preventDefault(); Z.AU.unlock(); var p = pos(ev); Z.ui.down(p.x, p.y, ev.pointerId); });
cv.addEventListener('pointermove', function (ev) { var p = pos(ev); Z.ui.move(p.x, p.y, ev.pointerId); });
cv.addEventListener('pointerup', function (ev) { var p = pos(ev); Z.ui.up(p.x, p.y, ev.pointerId); });
cv.addEventListener('pointercancel', function (ev) { delete Z.ui.ptrs[ev.pointerId]; Z.ui.pinch = null; Z.ui.tap = null; Z.ui.drag = null; Z.ui.pressBtn = null; Z.ui.press = null; Z.ui.mapDrag = null; });
cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
cv.addEventListener('wheel', function (e) { var p = pos(e); Z.ui.wheel(e.deltaY, p.x, p.y); e.preventDefault(); }, { passive: false });
document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
window.addEventListener('keydown', function (e) { Z.AU.unlock(); Z.ui.key(e.code); if (e.code === 'Space') e.preventDefault(); });

// ---------- цикл ----------
var last = 0, qT = 0, qN = 0, due = 0, slowN = 0;
// 2.12.52: ошибка в одном кадре больше не останавливает игру навсегда (раньше цикл кадров обрывался — экран замирал)
var frameErrs = 0;
function frame(ts) {
  try { frameBody(ts); }
  catch (e) {
    if (frameErrs++ < 5 && window.__rep) window.__rep(e);
    try { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; } catch (e2) {}
    requestAnimationFrame(frame);
  }
}
function frameBody(ts) {
  // 2.8: не чаще 60 кадров в секунду (на экранах 90–120 Гц игра раньше рисовала вдвое больше кадров и захлёбывалась); «экономно» — 30
  var cap = Z.save && Z.save.fps ? Z.save.fps : 60, per = 1000 / cap;   // 2.11.5: 30–240 на выбор (выше частоты экрана не бывает)
  if (last && ts < due - 4) { requestAnimationFrame(frame); return; }
  due = (ts - due > per || !due) ? ts + per : due + per;
  var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
  Z.time += dt; Z.frameDt = dt;
  // 2.11.5: ждём настоящую загрузку звуков (очередь A, js/preload.js), а не 9 секунд
  if (Z.ui.screen === 'loading' && !Z.loadDone && ((window.__LD ? window.__LD.readyA() : Z.AU.ready) || Z.time - Z.loadT0 > 40 || !Z.AU.ctx)) { Z.loadDone = true; SDK.ready(); Z.readyDone = true; Z.onPauseChange(); }
  if (Z.ui.titleAuto && Z.time >= Z.ui.titleAuto && Z.ui.screen === 'loading' && !Z.isPaused()) Z.ui.loadTap();   // экран игры после заставок — дальше без второго нажатия
  // автокачество: если в бою кадры идут медленнее ~30 в секунду три секунды подряд — уменьшаем разрешение отрисовки (до ×1); обратно за сеанс не повышаем
  if (Z.ui.screen === 'level' && Z.G && !Z.isPaused() && !Z.splashOn && !document.hidden) {
    qT += dt; qN++;
    if (qT >= 3) { var avg = qT / qN, auto = Z.save.autoQ !== false && !Z.save.rscale, slowA = Z.isPhone ? 0.019 : 0.026; qT = 0; qN = 0;   // 2.11.5: телефон — цель 60 кадров: упрощаем, как только медленнее ~52
      // медленнее ~38 кадров: сначала меньше разрешение, потом (2.8) упрощаются эффекты — рентген, подвижные тени, блёстки
      if (avg > slowA && auto && Z.DPR > 1.05) { Z.quality = Math.max(Z.isPhone ? 0.7 : 0.5, (Z.quality || 1) * (avg > slowA * 1.6 ? 0.7 : 0.85));   // сильно не успеваем — шаг крупнее   // 2.11.5: не ниже ~1 точки на пиксель — иначе «мыло»
         resize(); Z.ui.fieldCache = null; }
      }   // 2.12.12: режима экономии больше нет — при нехватке кадров уменьшается только разрешение
  } else { qT = 0; qN = 0; }
  if (Z.ui.screen === 'level' && Z.G && !Z.isPaused()) {
    var sp = (Z.G.speed || 1) * (Z.timeScale || 1), n = Math.ceil(sp);
    for (var i = 0; i < n; i++) Z.update(dt * sp / n);
  } else if (Z.ui.screen === 'map' || Z.ui.screen === 'menu') Z.AU.setState('map', 0);
  // под заставкой музыка игры не играет, экран не перерисовывается — заставка непрозрачная
  if (!Z.splashOn) {
    Z.AU.update();
    ctx.setTransform(Z.DPR, 0, 0, Z.DPR, 0, 0);
    Z.ui.render(ctx, Z.W, Z.H);
    if (Z.post) Z.post(cv);   // 2.11.5: апскейл с повышением резкости (v30h)
  }
  cloudTick();
  requestAnimationFrame(frame);
}

// ---------- старт ----------
function boot() {
  try { Z.LANG = Z.detectLang(navigator.language); } catch (e) { if (window.__rep) window.__rep(e); }
  // заставки идут первыми: тёмный экран загрузки → «Нажмите, чтобы начать» → студия → «Иней» → экран игры, который сам переходит дальше
  if (Z.splash) Z.splash.mount({ onReveal: function () { Z.ui.titleAuto = Z.time; } });   // 2.11.5: после заставки — сразу в игру, без отдельного экрана с ёлкой
  resize();
  if (!Z.splash) try { var bt = document.getElementById('boot'); if (bt) bt.parentNode.removeChild(bt); } catch (e) { if (window.__rep) window.__rep(e); }
  Z.AU.init(); // контекст создаётся приостановленным, сэмплы грузятся в фоне
  try { if (Z.loadEl) Z.loadEl(); if (Z.musTracks && Z.musTracks.preload) Z.musTracks.preload('mus_map'); } catch (e) { if (window.__rep) window.__rep(e); }   // 2.11.5: пачка эффектов и тема меню раскодируются сразу, не после первого касания
  SDK.init(function () {
    document.title = Z.T('title') + (Z.LANG === 'en' ? ' Tower Defense' : ' Башенная защита');
    load(function () {
      Z.AU.setVolumes(Z.save.music, Z.save.sfx);
      if (Z.save.gfx) { if (Z.save.gfx === 'eco') Z.save.shadowsOff = false; Z.save.gfx = null; resize(); }   // 2.12.12: видов качества больше нет
      Z.loaded = true;
      Z.ui.screen = 'loading'; Z.loadT0 = Z.time;
      Z.ui.loadTap = function () {
        if (!Z.loadDone || Z.splashOn) return;
        Z.ui.titleAuto = 0;
        Z.AU.unlock();
        var first = !Z.save.stars[0];
        Z.ui.screen = 'menu'; Z.ui.scrollToCurrent = true;
        if (first) { Z.save.seen.cut_intro = 0; Z.ui.goLevel(0, false); }
        else if (!Z.save.seen.cut_intro) Z.showComic('intro');
        Z.onPauseChange();
      };
      requestAnimationFrame(frame);
    });
  });
}
boot();
})();
