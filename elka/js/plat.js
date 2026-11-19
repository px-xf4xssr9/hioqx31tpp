/* 2.11 · Площадка: Яндекс Игры, VK Игры или просто сайт.
   Площадка определяется по тому, какой SDK подключён в index.html (сборка подставляет нужный):
     /sdk.js (Яндекс)           → Z.PLAT = 'yandex'
     js/vk-bridge.min.js (VK)   → Z.PLAT = 'vk'
     ничего                     → Z.PLAT = 'web' (тестовая копия по ссылке)
   Z.platHas(f) — есть ли на площадке: pay (покупки), login (вход), shortcut (ярлык), review (оценка), lb (рейтинг).
   Правила VK (dev.vk.ru/mini-apps-rules), которые здесь учтены:
     • VKWebAppInit сразу при старте; звук и игра на паузе при VKWebAppViewHide;
     • реклама только из VK: межстраничная — лишь при загрузке уровня, не на старте, не чаще раза в 30 с (в игре и так ≥ 90 с);
       за награду — только по нажатию игрока и с указанной наградой; одна реклама за одно нажатие;
     • то, чего на площадке нет (покупки Яндекса, вход, рейтинг, ярлык, оценка), — скрыто; упоминаний Яндекса на экране нет;
     • тестового содержимого нет (кнопка «Все уровни (тест)» и тестовые игроки рейтинга — только на 'web');
     • прогресс в облаке VK (синхронизируется между телефоном и компьютером); интерфейс по умолчанию русский;
     • возрастная маркировка видна при первом запуске. */
(function () {
'use strict';
var Z = window.Z;
var P = Z.PLAT = typeof YaGames !== 'undefined' ? 'yandex' : (window.vkBridge && window.vkBridge.send ? 'vk' : 'web');
var FEAT = { yandex: { pay: 1, login: 1, shortcut: 1, review: 1, lb: 1 }, web: { pay: 1, login: 1, shortcut: 1, review: 1, lb: 1, test: 1 }, vk: { pay: 1, lb: 1 } };   // 2.11.5: на VK свой рейтинг бесконечного режима (наш сервер + таблица лидеров ВК)   // 2.11.5: покупки за голоса ВК
Z.platHas = function (f) { return !!(FEAT[P] || {})[f]; };
Z.AGE = '6+';   // возрастная маркировка — должна совпадать с той, что указана в настройках игры на площадке
if (P !== 'vk') return;

var B = window.vkBridge, UI = Z.ui;
function qp(k) { var m = location.search.match(new RegExp('[?&]' + k + '=([^&]*)')); return m ? decodeURIComponent(m[1]) : ''; }
function send(method, params, ms) {
  // у каждого вызова — свой срок: если клиент VK не ответил, игра не зависает
  return new Promise(function (ok, no) {
    var done = false, tm = setTimeout(function () { if (!done) { done = true; no({ timeout: true }); } }, ms || 8000);
    try { B.send(method, params || {}).then(function (d) { if (!done) { done = true; clearTimeout(tm); ok(d); } }, function (e) { if (!done) { done = true; clearTimeout(tm); no(e); } }); }
    catch (e) { done = true; clearTimeout(tm); no(e); }
  });
}
// рейтинга на VK нет — и тестовых игроков с «обгонами» тоже
UI.trackLb = function () { UI.lbAbove = null; };
UI.checkLb = function () { };
// 2.11.5: окна рейтинга и входа — только для Яндекса; на VK их не открыть никаким путём (там упоминается Яндекс)
(function () { var oOpen = UI.openModal; UI.openModal = function (m) { if (m && m.type === 'login') return; if (m && m.type === 'lb') m = { type: 'vklb' }; return oOpen.call(this, m); }; var oGo = UI.goModal; if (oGo) UI.goModal = function (m) { if (m && m.type === 'login') return; if (m && m.type === 'lb') m = { type: 'vklb', back: m.back }; return oGo.call(this, m); }; })();

Z.platInit = function (SDK) {
  SDK.vk = B;
  function aOpen() { SDK.setGameplay(false); Z.adShowing = true; Z.onPauseChange(); }
  function aClose() { Z.adShowing = false; Z.onPauseChange(); }

  // ---------- запуск ----------
  SDK.init = function (done) {
    var fin = false; function f() { if (!fin) { fin = true; done(); } }
    setTimeout(f, 4000);
    // 2.11.4: правило VK 5.1.5.2 — медиареклама не при запуске: первая межстраничная не раньше чем через 60 с после старта
    Z.lastFullAd = Z.time || 0;
    send('VKWebAppInit', {}, 5000).catch(function () { });
    // язык: английский только если он выбран во VK, иначе русский (по правилам VK русский — основной)
    var l = (qp('vk_language') || '').toLowerCase(); Z.LANG = l === 'en' ? 'en' : 'ru';
    try {
      B.subscribe(function (ev) {
        var t = ev && ev.detail && ev.detail.type;
        if (t === 'VKWebAppViewHide') { SDK.sdkPaused = true; try { Z.persist(true); } catch (e) { if (window.__rep) window.__rep(e); } Z.onPauseChange(); }
        else if (t === 'VKWebAppViewRestore') { SDK.sdkPaused = false; Z.onPauseChange(); }
      });
    } catch (e) { if (window.__rep) window.__rep(e); }
    preload(); setInterval(preload, 45000);
    f();
  };
  SDK.ready = function () { };

  // ---------- реклама ----------
  var has = { interstitial: false, reward: false }, busy = false;
  function check(fmt) { send('VKWebAppCheckNativeAds', { ad_format: fmt }, 15000).then(function (d) { has[fmt] = !!(d && d.result); }, function () { has[fmt] = false; }); }
  function preload() { check('interstitial'); check('reward'); }
  // межстраничная: только если уже загружена — игрок не ждёт перед уровнем
  SDK.fullscreen = function (cb) {
    if (busy || !has.interstitial) { cb(false); return; }
    busy = true; has.interstitial = false; aOpen();
    send('VKWebAppShowNativeAds', { ad_format: 'interstitial' }, 45000).then(function (d) { busy = false; aClose(); cb(!!(d && d.result)); check('interstitial'); },
      function () { busy = false; aClose(); cb(false); check('interstitial'); });
  };
  // за награду: награда только если ролик досмотрен; если рекламы нет — честно говорим
  SDK.rewarded = function (onReward, onDone) {
    if (busy) return;
    // 2.11.4: правило VK 5.1.5.2 — реклама за награду не подряд и не чаще раза в 30 с
    var wait = 30 - (Z.time - (Z.lastReward == null ? -999 : Z.lastReward));
    if (wait > 0) { var n = Math.ceil(wait); UI.toast(Z.LANG === 'en' ? 'Next ad bonus in ' + n + ' s' : 'Следующий бонус за рекламу — через ' + n + ' с', '#9fdcff'); return; }
    function fail() { UI.toast(Z.LANG === 'en' ? 'No ad right now — try a bit later' : 'Реклама пока не загрузилась — попробуйте чуть позже', '#ffb3b3'); }
    // 2.11.4: ролик не загружен (или игра открыта не во ВКонтакте) — сразу говорим об этом, а не ставим игру на паузу в ожидании ответа
    if (!has.reward) { fail(); check('reward'); return; }
    busy = true; has.reward = false; aOpen();
    send('VKWebAppShowNativeAds', { ad_format: 'reward' }, 45000).then(function (d) {
      busy = false; aClose(); var ok = !!(d && d.result), prev = Z.lastReward; if (ok) onReward(); else fail(); if (onDone) onDone(); if (!ok) Z.lastReward = prev; check('reward');
    }, function () { var prev = Z.lastReward; busy = false; aClose(); fail(); if (onDone) onDone(); Z.lastReward = prev; check('reward'); });
  };
  SDK.adReady = function (fmt) { return !!has[fmt || 'reward']; };

  // ---------- межстраничная реклама на VK: не чаще раза в 60 с (правило VK — не чаще раза в 30 с) ----------
  // Остальные условия прежние: только при загрузке уровня, не в первых двух уровнях, не сразу после рекламы за награду.
  if (Z.FLAG) { var oFlag = Z.FLAG; Z.FLAG = function (k, d) { if (k === 'inter_cd') return 60; if (k === 'gift_cd_min') return 3; return oFlag(k, d); }; }

  // ---------- баннер VK внизу: на карте уровней и в главном меню, не в бою, не на заставке и не в начале игры ----------
  // Окно игры VK сам уменьшает на высоту баннера (resize); между кнопками игры и баннером — полоса 24 px (правило VK: не ближе 20 px).
  // Игрок закрыл баннер — до следующего возвращения на карту после уровня не показываем.
  var ban = { on: false, busy: false, closed: false, failT: 0, wantT: 0, lastScreen: '' };
  function banWant() {
    // 2.11.5: баннер везде — меню, карта и бой (окно игры ВК само уменьшает на высоту баннера, поле его не перекрывает);
    // не на заставке, не в первые 5 с и не на обучении (первые два уровня)
    var UI2 = Z.ui; if (!Z.loaded || Z.splashOn || (UI2.screen !== 'map' && UI2.screen !== 'menu' && UI2.screen !== 'level') || Z.time < 5) return false;
    if (!Z.unlockedLevel || Z.unlockedLevel() < 2) return false;
    if (UI2.screen === 'level' && Z.isPhone) return false;   // 2.11.5: на телефоне в бою без баннера — баннер с полосой отнимал до трети экрана
    if (Z.save && Z.save.shop && Z.save.shop.noads) return false;
    return !ban.closed && Date.now() > ban.failT;
  }
  function banGap(px, pxR) { Z.bannerGap = px; Z.bannerGapR = pxR || 0; try { Z.resize && Z.resize(); Z.ui.fieldCache = null; Z.ui.mapCache = null; } catch (e) { if (window.__rep) window.__rep(e); } }
  setInterval(function () {
    var UI2 = Z.ui, scr = UI2.screen;
    if (scr === 'level' && ban.lastScreen !== 'level') ban.closed = false;   // после уровня снова можно показывать
    ban.lastScreen = scr;
    var want = banWant();
    if (want && !ban.on && !ban.busy) {
      if (!ban.wantT) { ban.wantT = Date.now(); return; }
      if (Date.now() - ban.wantT < 1500) return;   // не выскакивает сразу под пальцем после перехода на карту
      ban.busy = true;
      // на компьютере (широкое окно) — вертикальный баннер сбоку справа, на телефоне — полоса снизу
      var side = ban.side = !ban.noSide && innerWidth > innerHeight * 1.3 && innerWidth >= 900 && !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
      var prm = side ? { banner_location: 'bottom', banner_align: 'right', orientation: 'vertical', layout_type: 'resize', can_close: true } : { banner_location: 'bottom', layout_type: 'resize', height_type: 'compact', can_close: true };
      send('VKWebAppShowBannerAd', prm, 10000).then(function (d) {
        ban.busy = false; if (d && d.result) { ban.on = true; banGap(side ? 0 : 100, side ? 100 : 0); } else if (side) { ban.noSide = true; ban.failT = Date.now() + 3000; } else ban.failT = Date.now() + 60000;
        if (!banWant()) hideBan();
      }, function () { ban.busy = false; if (side) { ban.noSide = true; ban.failT = Date.now() + 3000; } else ban.failT = Date.now() + 60000; });   // сбоку не вышло — снизу
    } else if (!want) { ban.wantT = 0; if (ban.on && !ban.busy) hideBan(); }
  }, 500);
  function hideBan() { ban.on = false; banGap(0); send('VKWebAppHideBannerAd', {}, 5000).catch(function () { }); }
  try { B.subscribe(function (ev) { var t = ev && ev.detail && ev.detail.type; if (t && /BannerAd(Closed|ClosedByUser)/.test(t)) { ban.on = false; ban.closed = true; banGap(0); } }); } catch (e) { if (window.__rep) window.__rep(e); }
  SDK.banner = ban;

  // ---------- сохранения в облаке VK ----------
  // В одной переменной VK — не больше 4096 байт, всего 1000 вызовов в час. Сохранение режется на части по 3800 байт;
  // пишутся по очереди в две ячейки (a/b), заголовок — последним: оборванная запись не портит прошлую.
  // Частые сохранения прореживаются: обычные — не чаще раза в 60 с, срочные (конец уровня, сворачивание) — не чаще раза в 2 с.
  var MAXB = 3800, slot = 'a', pend = null, writing = false, lastW = -1e9, timer = 0, calls = [], cache = {};
  function split(s) {
    var out = [], st = 0, b = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i), n = c < 0x80 ? 1 : c < 0x800 ? 2 : (c >= 0xD800 && c < 0xDC00) ? 4 : (c >= 0xDC00 && c < 0xE000) ? 0 : 3;
      if (b + n > MAXB) { out.push(s.slice(st, i)); st = i; b = 0; }
      b += n;
    }
    out.push(s.slice(st)); return out;
  }
  function budget(n) { var now = Date.now(); calls = calls.filter(function (t) { return now - t < 3600000; }); if (calls.length + n > 900) return false; for (var i = 0; i < n; i++) calls.push(now); return true; }
  function put(k, v) { if (cache[k] === v) return Promise.resolve(); return send('VKWebAppStorageSet', { key: k, value: v }).then(function () { cache[k] = v; }); }
  function flushNow() {
    if (writing || pend === null) return;
    var str = pend, parts = split(str), sl = slot === 'a' ? 'b' : 'a', hdr = JSON.stringify({ s: sl, n: parts.length, len: str.length });
    var need = parts.filter(function (p, i) { return cache['sv' + sl + i] !== p; }).length + 1;
    if (!budget(need)) { sched(60000); return; }
    pend = null; writing = true; lastW = Date.now();
    var chain = Promise.resolve();
    parts.forEach(function (p, i) { chain = chain.then(function () { return put('sv' + sl + i, p); }); });
    chain.then(function () { return put('svh', hdr); }).then(function () { slot = sl; }, function () { if (pend === null) pend = str; })
      .then(function () { writing = false; if (pend !== null) sched(2000); });
  }
  function sched(gap) {
    if (timer) return;
    var wait = Math.max(0, lastW + gap - Date.now());
    timer = setTimeout(function () { timer = 0; if (writing) { sched(gap); return; } flushNow(); }, wait);
  }
  // 2.11.4: облако не ответило при запуске — не перезаписываем его новой (возможно, пустой) игрой, пока не прочитаем
  var blocked = false;
  SDK.saveCloud = function (str, flush) {
    pend = str;
    if (blocked) return;
    if (flush) { if (timer) { clearTimeout(timer); timer = 0; } sched(2000); } else sched(60000);
  };
  function readCloud(end) {
    send('VKWebAppStorageGet', { keys: ['svh'] }).then(function (d) {
      var h = null; try { h = JSON.parse(((d && d.keys) || [])[0].value || 'null'); } catch (e) { if (window.__rep) window.__rep(e); }
      if (!h || !h.n || h.n > 60) { end(null); return; }
      var keys = []; for (var i = 0; i < h.n; i++) keys.push('sv' + h.s + i);
      cache.svh = JSON.stringify(h);
      return send('VKWebAppStorageGet', { keys: keys }).then(function (d2) {
        var m = {}; ((d2 && d2.keys) || []).forEach(function (q) { m[q.key] = q.value; });
        var s = keys.map(function (k) { return m[k] || ''; }).join('');
        try { JSON.parse(s); } catch (e) { end(null); return; }
        keys.forEach(function (k) { cache[k] = m[k]; }); slot = h.s; end(s);
      });
    }).catch(function () { end(null, true); });
  }
  function score(o) { if (!o) return -1; var n = 0; for (var k in (o.stars || {})) n += +o.stars[k] || 0; return n * 1000 + Math.min(999, (o.flakes || 0) / 10); }
  SDK.loadCloud = function (cb) {
    var done = false; function end(v, fail) { if (done) return; done = true; if (fail) { blocked = true; retry(); } cb(v); }
    setTimeout(function () { end(null, true); }, 6000);
    readCloud(end);
  };
  // не прочитали облако при запуске — пробуем ещё; если там прогресс больше, берём его (а не затираем облако пустой игрой)
  function retry() {
    setTimeout(function () {
      var got = false;
      readCloud(function (v, fail) {
        if (got) return; got = true;
        if (fail) { retry(); return; }
        var co = null; try { co = v ? JSON.parse(v) : null; } catch (e) { if (window.__rep) window.__rep(e); }
        var apply = function () {
          if (Z.ui && Z.ui.screen === 'level') { setTimeout(apply, 3000); return; }
          if (co && co.v === 2 && score(co) > score(Z.save)) {
            var was = JSON.parse(JSON.stringify(Z.save));
            try { localStorage.setItem('elka2_save_prev', JSON.stringify(was)); } catch (e) { if (window.__rep) window.__rep(e); }
            Z.adoptSave(co);
            if (Z.mergeOwned) Z.mergeOwned(Z.save, was);
            if (Z.fixSave27) Z.fixSave27();
            try { localStorage.setItem('elka2_save', JSON.stringify(Z.save)); } catch (e) { if (window.__rep) window.__rep(e); }
            if (Z.ui) { Z.ui.fieldCache = null; if (Z.ui.toast) Z.ui.toast(Z.LANG === 'en' ? 'Progress restored from the cloud' : 'Прогресс загружен из облака', '#9dff6a'); }
          }
          blocked = false; if (pend !== null) sched(2000);
        };
        apply();
      });
    }, 8000);
  }
  SDK.player = null;

  // ---------- 2.11.5: сохранение на нашем сервере — главный источник ----------
  // Сервер хранит ревизии: игра пишет поверх той ревизии, которую знает. Играли на другом устройстве — сервер отвечает
  // «конфликт» и отдаёт свежую: берём её и добавляем всё купленное и открытое отсюда. Пока сервер не прочитан
  // (нет сети), на него ничего не пишется — пустая игра не затрёт настоящую. Копия в телефоне и в хранилище ВК остаётся запасной.
  var SV = { ok: false, rev: 0, busy: false, timer: 0, cbs: [], tries: 0 };
  // значок «нет связи»: сервер не прочитан или последняя запись не дошла, а несохранённое есть — просим не закрывать игру
  setInterval(function () {
    if (!Z.loaded || !Z.save) return;
    var sy = Z.save.sync || {}, unsynced = (sy.n || 0) > (sy.sn || 0), off = SV.tried && (!SV.ok || SV.fail) && (unsynced || !SV.ok);
    var el = document.getElementById('netoff');
    if (!off) { if (el) el.style.display = 'none'; return; }
    if (!el) { el = document.createElement('div'); el.id = 'netoff'; var st = el.style; st.position = 'fixed'; st.left = '50%'; st.top = '64px'; st.transform = 'translateX(-50%)'; st.zIndex = '50'; st.pointerEvents = 'none';
      st.padding = '5px 12px'; st.borderRadius = '14px'; st.background = 'rgba(27,36,72,0.86)'; st.color = '#fff'; st.font = "800 12px 'Trebuchet MS', Verdana, sans-serif"; st.whiteSpace = 'nowrap'; st.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
      document.body.appendChild(el); }
    el.textContent = Z.LANG === 'en' ? '☁ No connection — progress will be saved when it is back' : '☁ Нет связи — прогресс сохранится, когда появится сеть';
    el.style.display = 'block'; el.style.opacity = String(0.75 + 0.25 * Math.sin(Date.now() / 400));
  }, 250);
  function pj(s) { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  // счётчики (снежинки, запасы): при встрече двух устройств складываем то, что каждое добавило или потратило с общей ревизии
  var CNT = ['blizzard', 'bomb', 'santa', 'medkit'];
  function counts(o) { var c = { fl: +(o && o.flakes) || 0, inv: {} }; CNT.forEach(function (k) { c.inv[k] = +(o && o.inv && o.inv[k]) || 0; }); return c; }
  function sAt(o) { return o ? o.t || 0 : 0; }
  function keepPrev() { try { var l = localStorage.getItem('elka2_save'); if (l) localStorage.setItem('elka2_save_prev', l); } catch (e) { if (window.__rep) window.__rep(e); } }
  function writeLocal() { try { localStorage.setItem('elka2_save', JSON.stringify(Z.save)); } catch (e) { if (window.__rep) window.__rep(e); } }
  function srvSchedule(ms) { if (!SV.ok) return; if (SV.timer) { if (ms > 2000) return; clearTimeout(SV.timer); } SV.timer = setTimeout(function () { SV.timer = 0; srvSend(); }, ms); }
  function srvSend() {
    if (!SV.ok || SV.busy || !Z.save) return;
    var sy = Z.save.sync || (Z.save.sync = { rev: 0, n: 0, sn: 0 });
    if ((sy.n || 0) <= (sy.sn || 0) && sy.rev === SV.rev) { var c0 = SV.cbs; SV.cbs = []; c0.forEach(function (f) { f(true); }); return; }
    SV.busy = true; var sentN = sy.n || 0, str = JSON.stringify(Z.save), sentC = counts(Z.save);
    api('save_put', { save: str, base: SV.rev }).then(function (d) {
      SV.busy = false; SV.fail = false;
      if (d && d.rev && !d.conflict) {
        SV.rev = d.rev; sy = Z.save.sync; sy.rev = d.rev; sy.sn = Math.max(sy.sn || 0, sentN); sy.bf = sentC;
        if (d.clamp && d.save) srvAdopt(d.save, d.rev);   // сервер поправил невозможные значения — берём его версию
        writeLocal();
        if ((sy.n || 0) > sentN) srvSchedule(30000);
        var c = SV.cbs; SV.cbs = []; c.forEach(function (f) { f(true); });
      } else if (d && d.conflict) srvConflict(d);
      else srvSchedule(15000);
    }, function () { SV.busy = false; SV.fail = true; srvSchedule(15000); });
  }
  function srvConflict(d, enable) {
    // в бою состояние не подменяем — разберёмся после боя (и до этого на сервер ничего не пишем)
    if (Z.ui && Z.ui.screen === 'level') { setTimeout(function () { srvConflict(d, enable); }, 4000); return; }
    if (enable) SV.ok = true;
    var so = pj(d.save); SV.rev = d.rev || 0;
    if (so && so.v === 2) {
      var was = JSON.parse(JSON.stringify(Z.save)); keepPrev();
      var bf = (was.sync && was.sync.bf) || counts(null), mine = counts(was), srv = counts(so);
      Z.adoptSave(so);
      if (Z.mergeOwned) Z.mergeOwned(Z.save, was); if (Z.fixSave27) Z.fixSave27();
      // снежинки и запасы: серверные + то, что изменилось здесь с общей ревизии (покупка на этом устройстве не пропадёт)
      Z.save.flakes = Math.max(0, srv.fl + (mine.fl - bf.fl));
      if (Z.save.inv) CNT.forEach(function (q) { Z.save.inv[q] = Math.max(0, srv.inv[q] + (mine.inv[q] - (bf.inv[q] || 0))); });
      Z.save.sync = { rev: SV.rev, n: (was.sync && was.sync.n || 0) + 1, sn: 0, bf: srv };
      writeLocal(); if (Z.ui) { Z.ui.fieldCache = null; Z.ui.mapCache = null; }
    } else { Z.save.sync.rev = SV.rev; }
    srvSchedule(1500);
  }
  function srvAdopt(str, rev) {
    var so = pj(str); if (!so || so.v !== 2) return;
    if (Z.ui && Z.ui.screen === 'level') { setTimeout(function () { srvAdopt(str, rev); }, 4000); return; }
    Z.adoptSave(so, 'sync');
    if (Z.fixSave27) Z.fixSave27(); Z.save.sync = { rev: rev, n: (Z.save.sync.n || 0), sn: (Z.save.sync.n || 0), bf: counts(so) }; writeLocal();
  }
  SDK.srvFlush = function (cb) { if (!SV.ok) { setTimeout(function () { cb(false); }, 6000); return; } SV.cbs.push(cb); srvSchedule(800); };
  SDK.srvState = function () { return { ok: SV.ok, rev: SV.rev, busy: SV.busy }; };
  var oSave = SDK.saveCloud;
  SDK.saveCloud = function (str, flush) { oSave.apply(this, arguments); srvSchedule(flush ? 1500 : 30000); };
  // сервер не ответил при запуске — пробуем ещё; на сервере прогресс с другого устройства — берём его (купленное отсюда сохраняем)
  function srvRetry() {
    setTimeout(function () {
      api('save_get').then(function (d) {
        if (!d || d.rev === undefined) { srvRetry(); return; }
        var so = pj(d.save), sy = Z.save.sync || { rev: 0 };
        if (so && d.rev > (sy.rev || 0)) { srvConflict({ rev: d.rev, save: d.save }, true); return; }
        SV.ok = true; SV.rev = d.rev; srvSchedule(1500);
      }, srvRetry);
    }, Math.min(60000, 10000 * (++SV.tries)));
  }
  SDK.loadAuth = function (local, cb) {
    var lo = pj(local), done = false;
    function fin(best, other) { if (done) return; done = true; SV.tried = true; cb(best, other); }
    function fromVk(push) { SDK.loadCloud(function (cloud) { var co = pj(cloud), best = sAt(co) > sAt(lo) ? co : lo; if (best === co && local) keepPrev(); if (push && best) best.sync = { rev: 0, n: ((best.sync && best.sync.n) || 0) + 1, sn: 0, bf: counts(best) }; fin(best, best === co ? lo : co); if (push) srvSchedule(2500); }); }
    var tmo = setTimeout(function () { if (!done) { fromVk(false); srvRetry(); } }, 8000);
    api('save_get').then(function (d) {
      if (done) return; clearTimeout(tmo);
      if (!d || d.rev === undefined) { fromVk(false); srvRetry(); return; }
      SV.ok = true; SV.rev = d.rev;
      var so = pj(d.save), ls = lo && lo.sync;
      if (!so) { fromVk(true); return; }   // на сервере ещё пусто (первый запуск этой версии) — переносим туда лучшее из телефона и ВК
      if (lo && ls && ls.rev === d.rev && (ls.n || 0) > (ls.sn || 0)) { fin(lo, so); srvSchedule(2500); return; }   // здесь есть несохранённое поверх той же ревизии
      if (local) keepPrev();
      so.sync = { rev: d.rev, n: (so.sync && so.sync.n) || 0, sn: (so.sync && so.sync.n) || 0, bf: counts(so) };
      fin(so, lo);
    }, function () { if (!done) { clearTimeout(tmo); fromVk(false); srvRetry(); } });
  };

  // ---------- 2.11.5: покупки за голоса ВК ----------
  // Окно оплаты — VKWebAppShowOrderBox; ВК сообщает об оплате нашему серверу (Yandex Cloud Functions), игра забирает
  // оплаченное запросом claim, подписанным параметрами запуска ВК, выдаёт и подтверждает (ack). Ключей в игре нет.
  var API = 'https://functions.yandexcloud.net/d4enb5d7fi9js7gthnd2', LAUNCH = location.search.replace(/^\?/, '');
  var VOTES = { starter: 7, noads: 14, heroes: 14, fl30: 4, fl100: 11, fl250: 21, supply: 7, supply2: 19, slot4: 9, slot5: 14 };
  function votes(n) { var a = n % 10, b = n % 100; return n + ' ' + (Z.LANG === 'en' ? (n === 1 ? 'vote' : 'votes') : (a === 1 && b !== 11 ? 'голос' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'голоса' : 'голосов')); }
  // 2.11.5: журнал ошибок и событий (telemetry.js) — пачками на сервер
  Z.telSend = function (kind, items, keep, ver) { try { fetch(API + '?op=' + kind, { method: 'POST', keepalive: !!keep, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ launch: LAUNCH, items: items, ver: ver }) }).catch(function () { }); } catch (e) { if (window.__rep) window.__rep(e); } };
  function api(op, data) { return fetch(API + '?op=' + op, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ launch: LAUNCH }, data || {})) }).then(function (r) { return r.json(); }); }
  var claiming = false;
  function claim(tries) {
    if (claiming) return; claiming = true;
    api('claim').then(function (d) {
      claiming = false; var got = [], sh = Z.save.shop; sh.vkDone = sh.vkDone || {};
      // 2.11.5: места для усилений — только те, что сервер подтвердил оплатой (вписанное в сохранение руками снимается)
      if (d && Array.isArray(d.orders)) { var pm = {}; d.orders.forEach(function (o) { if (o.perm) pm[o.item] = 1; }); ['slot4', 'slot5'].forEach(function (k) { if (sh[k] && !pm[k]) delete sh[k]; }); }
      (d && d.orders || []).forEach(function (o) {
        if (!VOTES[o.item]) return;
        if (o.perm) { if (!sh[o.item]) Z.applyProduct(o.item, false); }
        else if (!sh.vkDone[o.order]) Z.applyProduct(o.item, false);
        sh.vkDone[o.order] = 1; if (!o.done) got.push(o.order);
      });
      if (got.length) { Z.persist(true); var ackNow = function () { api('ack', { orders: got }).catch(function () { }); }; if (SDK.srvFlush) SDK.srvFlush(function () { ackNow(); }); else setTimeout(ackNow, 6000); }   // 2.11.5: выдачу подтверждаем серверу, когда сохранение с покупкой уже записано на сервере   // 2.11.5: подтверждаем выдачу, когда сохранение уже ушло в облако; закрыли игру раньше — заказ выдастся при следующем запуске (дубль не выдастся: номер заказа записан)
      if (got.length || !(tries > 0)) { if (!got.length && sh.vkPend && Date.now() - sh.vkPend > 600000) delete sh.vkPend; else if (got.length) delete sh.vkPend; Z.persist(true); }
      else setTimeout(function () { claim(tries - 1); }, 2500);   // уведомление об оплате могло прийти на сервер чуть позже
    }).catch(function () { claiming = false; if (tries > 0) setTimeout(function () { claim(tries - 1); }, 4000); });
  }
  function hookPay() {
    var S27 = Z.SDK27; if (!S27 || !Z.applyProduct) { setTimeout(hookPay, 500); return; }
    S27.payReady = function () { return true; };
    S27.priceOf = function (id) { return VOTES[id] ? votes(VOTES[id]) : '—'; };
    S27.buy = function (id, cb) {
      if (!VOTES[id]) { if (cb) cb(false); return; }
      Z.save.shop.vkPend = Date.now(); Z.persist(true);
      aOpen();
      send('VKWebAppShowOrderBox', { type: 'item', item: id }, 600000).then(function (d) {
        aClose(); if (d && (d.success || d.order_id || d.result || d.status === 'success')) { claim(6); if (cb) cb(true); } else if (cb) cb(false);
      }, function () { aClose(); if (cb) cb(false); });
    };
    // оплатили, но игра закрылась до выдачи — заберём при следующем запуске
    (function wait() { if (!Z.loaded || !Z.save || !Z.save.shop) { setTimeout(wait, 1000); return; } setTimeout(function () { claim(Z.save.shop.vkPend ? 3 : 0); }, 3000); })();   // 2.11.5: сверка покупок с сервером — при каждом запуске
  }
  hookPay();

  // ---------- 2.11.5: рейтинг бесконечного режима ----------
  var me = null;
  function myInfo() { if (me) return Promise.resolve(me); return send('VKWebAppGetUserInfo', {}, 6000).then(function (u) { me = { name: ((u.first_name || '') + ' ' + (u.last_name ? u.last_name.charAt(0) + '.' : '')).trim(), photo: u.photo_100 || '' }; return me; }, function () { me = { name: '', photo: '' }; return me; }); }
  Z.vkTop = null;
  Z.vkTopLoad = function () { return api('top').then(function (d) { if (d && d.top) Z.vkTop = d; return d; }); };
  SDK.scoreEndless = function (waves) {
    if (!(waves > 0)) return;
    myInfo().then(function (u) { return api('score', { v: waves, name: u.name, photo: u.photo }); }).then(function (d) {
      if (!d || !d.top) return; Z.vkTop = d; var r = d.me.rank, b = d.me.before, T = Z.TT;
      if (r && (!b || r < b)) {
        var passed = d.top[r] && (!b || r < b) ? d.top[r] : null;
        UI.toast(passed ? T('Новый рекорд! Ты обогнал ', 'New best! You passed ') + passed.n + ' (' + passed.v + ')' : T('Новый рекорд! Ты ' + r + '-й в рейтинге', 'New best! You are #' + r), '#ffd54a');
      }
    }).catch(function () { });
  };

  // ---------- возрастная маркировка на экране загрузки (слева сверху — не закрывает «Пропустить» в комиксе; исчезает, когда началась игра) ----------
  try {
    var age = document.createElement('div');
    age.textContent = Z.AGE;
    age.setAttribute('style', 'position:fixed;left:12px;top:12px;z-index:2147483647;font:700 15px/1 sans-serif;color:#fff;border:2px solid rgba(255,255,255,.85);border-radius:8px;padding:5px 7px;background:rgba(0,0,0,.25);pointer-events:none;transition:opacity .6s');
    document.body.appendChild(age);
    var t0 = Date.now(), iv = setInterval(function () { if (Z.loaded && Date.now() - t0 > 2500 && Z.ui.screen !== 'loading' && !Z.splashOn) { clearInterval(iv); age.style.opacity = '0'; setTimeout(function () { if (age.parentNode) age.parentNode.removeChild(age); }, 800); } }, 500);
  } catch (e) { if (window.__rep) window.__rep(e); }
};
})();
