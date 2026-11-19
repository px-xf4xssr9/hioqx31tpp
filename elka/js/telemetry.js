/* 2.11.5 · Журнал ошибок и игровых событий.
   Ошибки: необработанные (window.onerror, отклонённые промисы) и те, что раньше молча глотались в try/catch (window.__rep).
   Одинаковые ошибки считаются один раз, за сессию — не больше 25 разных. События: запуск, загрузка, начало и конец уровня,
   выход из боя, покупки, реклама. Копятся в памяти и отправляются пачкой раз в минуту и при сворачивании игры
   (на ВК — нашему серверу, в журнал Yandex Cloud Logging; на других площадках пока никуда). Личных данных нет — только id игрока ВК. */
(function () {
'use strict';
var Q = { log: [], ev: [] }, seen = {}, nErr = 0, T0 = Date.now(), VER = '2.12.52';
function short(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; }
function rep(e, where) {
  try {
    var msg = short(e && (e.message || e.reason || e) || 'unknown', 200), st = short(e && e.stack || '', 600);
    var key = msg + '|' + st.split('\n').slice(0, 2).join('|');
    if (seen[key]) { seen[key].n++; return; }
    if (nErr >= 25) return; nErr++;
    var it = { m: msg, s: st, w: where || '', t: Math.round((Date.now() - T0) / 1000), sc: (window.Z && Z.ui && Z.ui.screen) || '', n: 1 };
    seen[key] = it; Q.log.push(it);
  } catch (x) { }
}
window.__rep = function (e) { rep(e, 'catch'); };
window.addEventListener('error', function (ev) { rep(ev.error || { message: ev.message, stack: (ev.filename || '') + ':' + ev.lineno + ':' + ev.colno }, 'onerror'); });
window.addEventListener('unhandledrejection', function (ev) { var r = ev.reason; if (r && r.timeout) return; rep(r && r.message ? r : { message: 'rejection: ' + short(JSON.stringify(r), 150) }, 'promise'); });
var Z = window.Z = window.Z || {};
Z.ev = function (name, data) {
  try { if (Q.ev.length > 300) return; var it = { e: name, t: Math.round((Date.now() - T0) / 1000) }; if (data) for (var k in data) it[k] = data[k]; Q.ev.push(it); } catch (x) { }
};
// отправка: площадка ставит Z.telSend(kind, items, keepalive) — функция, которая шлёт пачку на сервер
function flush(keep) {
  if (!Z.telSend) return;
  ['log', 'ev'].forEach(function (k) {
    if (!Q[k].length) return;
    var items = Q[k].splice(0, 40);
    try { Z.telSend(k, items, keep, VER); } catch (x) { }
  });
}
Z.telFlush = flush; Z.telQ = Q;
setInterval(function () { flush(false); }, 60000);
document.addEventListener('visibilitychange', function () { if (document.hidden) flush(true); });
window.addEventListener('pagehide', function () { flush(true); });
Z.ev('session', { dev: short(navigator.userAgent.replace(/^Mozilla\/5\.0 /, ''), 80), w: innerWidth, h: innerHeight, dpr: window.devicePixelRatio || 1 });
// игровые события — подключаются, когда игра загрузилась
var hooked = false;
function hook() {
  if (hooked || !Z.ui || !Z.levelWon || !Z.levelLost || !Z.ui.goLevel || !Z.ui.goMap) return;
  hooked = true;
  var UI = Z.ui, cur = null;
  var oGo = UI.goLevel; UI.goLevel = function (idx, heroic) { var r = oGo.apply(this, arguments); var G = Z.G; cur = { l: idx, t0: Date.now() }; Z.ev('lv_start', { l: idx + 1, h: heroic ? 1 : 0, en: G && G.endless ? 1 : 0 }); return r; };
  var oWin = Z.levelWon; Z.levelWon = function () { var G = Z.G, was = G && G.phase; var r = oWin.apply(this, arguments); if (G && was !== 'won') { Z.ev('lv_win', { l: G.idx + 1, st: G.result && G.result.stars, w: G.wave, s: Math.round(G.t || 0), hp: G.hp }); if (cur) cur.done = 1; } return r; };
  var oLose = Z.levelLost; Z.levelLost = function () { var G = Z.G, was = G && G.phase; var r = oLose.apply(this, arguments); if (G && was !== 'lost') Z.ev('lv_lose', { l: G.idx + 1, w: G.wave, s: Math.round(G.t || 0), en: G.endless ? 1 : 0 }); return r; };
  var oMap = UI.goMap; UI.goMap = function () { var G = Z.G; if (UI.screen === 'level' && G && G.phase !== 'won' && G.phase !== 'lost') Z.ev('lv_quit', { l: G.idx + 1, w: G.wave, s: Math.round(G.t || 0) }); return oMap.apply(this, arguments); };
  if (Z.SDK27 && Z.SDK27.buy) { var oBuy = Z.SDK27.buy; Z.SDK27.buy = function (id, cb) { Z.ev('buy_open', { id: id }); return oBuy.call(this, id, function (ok) { Z.ev(ok ? 'buy_ok' : 'buy_no', { id: id }); if (cb) cb(ok); }); }; }
  (function hookRw() { if (!(Z.SDK && Z.SDK.rewarded)) { setTimeout(hookRw, 1000); return; } var oRw = Z.SDK.rewarded; Z.SDK.rewarded = function (a, b) { var got = false, sc = UI.screen; Z.ev('ad_rw', { sc: sc }); return oRw.call(this, function () { got = true; if (a) a.apply(this, arguments); }, function () { Z.ev(got ? 'ad_rw_ok' : 'ad_rw_no', {}); if (b) b.apply(this, arguments); }); }; })();
}
var iv = setInterval(function () { hook(); if (hooked) clearInterval(iv); }, 500);
// 2.11.5: производительность — в бою раз в 20 с средний кадр (не больше 4 записей за уровень): видно, как идёт на реальных телефонах
(function () {
  var last = performance.now(), sum = 0, n = 0, slow = 0, t0 = 0, perLv = 0, lvKey = null;
  function f() {
    var now = performance.now(), dt = now - last; last = now;
    var Zg = window.Z, G = Zg && Zg.G, inLv = Zg && Zg.ui && Zg.ui.screen === 'level' && G && !(Zg.isPaused && Zg.isPaused()) && !document.hidden;
    if (inLv && dt < 1000) {
      if (lvKey !== G) { lvKey = G; perLv = 0; sum = 0; n = 0; slow = 0; t0 = now; }
      sum += dt; n++; if (dt > 34) slow++;
      if (now - t0 > 20000 && n > 30 && perLv < 4) { perLv++; Z.ev('perf', { l: G.idx + 1, ms: Math.round(sum / n * 10) / 10, slow: Math.round(slow * 100 / n), dpr: Zg.DPR, q: Zg.quality || 1, ph: Zg.isPhone ? 1 : 0, sh: (Zg.save && Zg.save.sharp) || 0, w: Zg.W, h: Zg.H, en: (G.enemies || []).length }); sum = 0; n = 0; slow = 0; t0 = now; }
    } else { t0 = now; sum = 0; n = 0; slow = 0; }
    requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
})();
// время до игры: когда исчез экран загрузки
var lv = setInterval(function () { if (Z.loaded && Z.loadDone) { clearInterval(lv); Z.ev('loaded', { ms: Date.now() - T0 }); } }, 500);
})();
