/* 2.7.5 · события для статистики (Яндекс Метрика). Счётчик включается без пересборки: в консоли Яндекс Игр задайте флаг
   metrika_id = номер счётчика. Пока флага нет, ничего не загружается и никуда не отправляется. Личных данных в событиях нет. */
(function () {
'use strict';
var Z = window.Z, UI = Z.ui, id = 0, queue = [], tries = 0;
function send(name, p) { try { window.ym(id, 'reachGoal', name, p || {}); } catch (e) { if (window.__rep) window.__rep(e); } }
Z.track = function (name, p) { if (id && window.ym) send(name, p); else if (queue.length < 60) queue.push([name, p]); };
var iv = setInterval(function () {
  if (++tries > 80) { clearInterval(iv); queue = []; return; }
  var v = Z.FLAG ? Z.FLAG('metrika_id', 0) : 0; if (!v || isNaN(+v)) return;
  clearInterval(iv); id = +v;
  try {
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); }; window.ym.l = +new Date();
    var s = document.createElement('script'); s.async = true; s.src = 'https://mc.yandex.ru/metrika/tag.js'; document.head.appendChild(s);
    window.ym(id, 'init', { clickmap: false, trackLinks: false, accurateTrackBounce: true });
    queue.forEach(function (q) { send(q[0], q[1]); }); queue = [];
  } catch (e) { if (window.__rep) window.__rep(e); }
}, 500);
function wrap(o, k, fn) { var old = o[k]; if (typeof old !== 'function') return; o[k] = function () { try { fn.apply(this, arguments); } catch (e) { if (window.__rep) window.__rep(e); } return old.apply(this, arguments); }; }
// воронка: запуск → уровень начат → победа/поражение
Z.track('game_open', { lvl: 0 });
wrap(UI, 'goLevel', function (idx, heroic) { Z.track('level_start', { level: idx + 1, heroic: heroic ? 1 : 0, replay: Z.save.stars[idx] ? 1 : 0 }); });
var oW = Z.levelWon; Z.levelWon = function () { var G = Z.G, first = G && G.phase !== 'won', r = oW.apply(this, arguments); try { if (first && G && !G.endless) Z.track('level_win', { level: G.idx + 1, stars: G.result && G.result.stars, sec: Math.round(G.t) }); } catch (e) { if (window.__rep) window.__rep(e); } return r; };
var oL = Z.levelLost; Z.levelLost = function () { var G = Z.G, first = G && G.phase !== 'lost', r = oL.apply(this, arguments); try { if (first && G) Z.track(G.endless ? 'endless_over' : 'level_lose', { level: G.idx + 1, wave: G.wave, sec: Math.round(G.t) }); } catch (e) { if (window.__rep) window.__rep(e); } return r; };
// реклама и покупки
var t2 = 0, iv2 = setInterval(function () {
  if (++t2 > 40) clearInterval(iv2);
  var S = Z.SDK; if (!S || S._trk) return; S._trk = 1; clearInterval(iv2);
  var r0 = S.rewarded; S.rewarded = function (onR, onD) { var m = UI.modal, where = m ? m.type : (UI.screen === 'level' ? 'battle' : UI.screen); Z.track('ad_reward_click', { where: where }); return r0.call(this, function () { Z.track('ad_reward_done', { where: where }); if (onR) onR(); }, onD); };
  var f0 = S.fullscreen; S.fullscreen = function (cb) { return f0.call(this, function (shown) { if (shown) Z.track('ad_inter', {}); if (cb) cb(shown); }); };
  if (Z.SDK27) { var b0 = Z.SDK27.buy; Z.SDK27.buy = function (pid, cb) { Z.track('buy_click', { id: pid }); return b0.call(this, pid, function (ok) { if (ok) Z.track('buy_done', { id: pid }); if (cb) cb(ok); }); }; }
}, 250);
// какие окна открывают
var SEEN = { shop: 1, cos: 1, gifts: 1, daily: 1, quests: 1, lb: 1, endless: 1, login: 1, offer: 1, heroTry: 1, research: 1 };
wrap(UI, 'openModal', function (m) { if (m && SEEN[m.type]) Z.track('open_' + m.type, {}); });
})();
