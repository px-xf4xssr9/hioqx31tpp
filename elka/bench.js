/* Замер боя «Ёлки» на телефоне (GEngine, шаг 1). Не часть игры.
   ?lvl=35&n=84&fast=1 — уровень (с 1), врагов, «быстрая» отрисовка 2.12.52.
   Меряет 15 с: время кадра (FPS, 1% худших), логика (Z.update), рисование на процессоре (Z.ui.render + Z.post),
   и сколько кадр ждёт видеокарту/браузер (интервал кадра минус работа JS). */
(function () {
  'use strict';
  var P = new URLSearchParams(location.search);
  var LV = Math.max(1, +P.get('lvl') || 35) - 1, N = +P.get('n') || 84, FAST = P.get('fast') !== '0', DUR = 15000;
  window.__FAST = FAST;
  var panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;left:6px;right:6px;bottom:6px;z-index:99999;background:rgba(10,14,30,.88);color:#fff;font:13px/1.35 monospace;padding:8px;border-radius:8px;white-space:pre-wrap;pointer-events:auto';
  panel.textContent = 'Замер: загрузка игры…';
  document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(panel); });
  var SETUP = function (lvl) {
    try { localStorage.clear(); } catch (e) {}
    Z.save.tut = 5; for (var e in Z.ENEMIES) Z.save.seen['e_' + e] = 1; Z.save.seen.hero = 1; Z.save.seen.heroTut = 1; Z.save.seen.zoomTut = 1;
    for (var i = 0; i < lvl; i++) Z.save.stars[i] = 3; Z.save.music = 0; Z.save.sfx = 0; Z.save.voiceOn = false;
    Z.ui.goLevel(lvl, false); Z.ui.modal = null; Z.ui.modalQ = [];
    ['route', 'trap', 'hero', 'repair', 'merge', 'skill', 'zoom', 'tree', 'build', 'wave'].forEach(function (k) { Z.save.seen['tip_' + k] = 1; });
    var G = Z.G, sp = G.L.spots; G.coins = 99999;
    var plan = ['mg', 'tesla', 'mortar', 'snow', 'ballista', 'ice', 'mg', 'tesla', 'mortar', 'snow', 'ice', 'ballista'];
    for (var j = 0; j < sp.length && j < 28; j++) Z.buildTower(plan[j % plan.length], sp[j].c, sp[j].r);
    var ks = Object.keys(G.towers); for (var q = 0; q < ks.length; q++) { var tw = G.towers[ks[q]]; for (var u = 0; u < q % 3; u++) Z.upgradeTower(tw); }
    Z.callWave(); Z.timeScale = 1;
    setInterval(function () { if (Z.ui.modal) Z.ui.closeModal(); if (Z.G && Z.G.phase === 'between') Z.callWave(); }, 50);
  };
  var SPAWN = function (n) {
    var G = Z.G, mul = Z.hpScale(G.idx) * 40; G.spawnQ = []; G.enemies = [];
    var types = ['raccoon', 'sled', 'crow', 'ram', 'icicle', 'fat', 'thrower', 'split'];
    function at(frac, ei) { var en = G.L.entrances[ei % G.L.entrances.length], p = Z.tracePath(en[0], en[1], 'walk'); var c = p[Math.min(p.length - 2, Math.floor(p.length * frac))]; return { x: c[0] + 0.5 + (Math.random() - 0.5) * 0.4, y: c[1] + 0.5 + (Math.random() - 0.5) * 0.4 }; }
    for (var i = 0; i < n; i++) Z.spawn(types[i % types.length], i, mul, at(0.1 + (i / n) * 0.75, i));
    G.phase = 'wave'; G.wave = 3; G.banner = null;
  };
  function wrap(obj, name, acc) {
    var f = obj[name]; if (typeof f !== 'function') return;
    obj[name] = function () { var t = performance.now(); try { return f.apply(this, arguments); } finally { acc.v += performance.now() - t; } };
  }
  function start() {
    try { if (Z.splash && Z.splash.abort) Z.splash.abort(); } catch (e) {}
    Z.LANG = 'ru'; for (var k in Z.MULTS) Z.save.seen['cut_' + k] = 1; Z.loadDone = true;
    try { Z.ui.loadTap(); } catch (e) {}
    while (Z.ui.modal) { Z.ui.modal.noBack = true; Z.ui.closeModal(); }
    SETUP(LV);
    setTimeout(function () { SPAWN(N); setTimeout(measure, 3000); }, 1500);
    panel.textContent = 'Замер: уровень ' + (LV + 1) + ', врагов ' + N + ', быстрая отрисовка ' + (FAST ? 'да' : 'нет') + '. Разгон 4 с…';
  }
  function measure() {
    var upd = { v: 0 }, rnd = { v: 0 }, post = { v: 0 };
    wrap(Z, 'update', upd); wrap(Z.ui, 'render', rnd); if (Z.post) wrap(Z, 'post', post);
    var ts = [], t0 = performance.now(), last = t0, alive0 = 0;
    panel.textContent = 'Замер идёт 15 с — не трогай экран…';
    function f(now) {
      ts.push(now - last); last = now;
      if (now - t0 < DUR) { requestAnimationFrame(f); return; }
      var n = ts.length, tot = now - t0, s = ts.slice().sort(function (a, b) { return a - b; }), p99 = s[Math.min(n - 1, Math.floor(n * 0.99))];
      var G = Z.G, en = G.enemies.filter(function (e) { return !e.dead; }).length, tw = Object.keys(G.towers).length;
      var lines = [
        'Ёлка ' + (window.__ELKA_VER || '') + ' · уровень ' + (LV + 1) + ' · врагов ' + en + ' · вышек ' + tw + ' · быстрая ' + (FAST ? 'да' : 'нет'),
        'экран ' + innerWidth + '×' + innerHeight + ' · DPR ' + (window.devicePixelRatio || 1).toFixed(2) + ' · качество ' + (Z.quality || 1).toFixed(2),
        'FPS ' + (n * 1000 / tot).toFixed(1) + ' · 1% худших ' + (1000 / p99).toFixed(1),
        'кадр ' + (tot / n).toFixed(2) + ' мс:',
        '  логика (update) ' + (upd.v / n).toFixed(2) + ' мс',
        '  рисование на процессоре (render) ' + (rnd.v / n).toFixed(2) + ' мс',
        '  резкость (post) ' + (post.v / n).toFixed(2) + ' мс',
        '  ожидание видеокарты и браузера ' + Math.max(0, tot / n - (upd.v + rnd.v + post.v) / n).toFixed(2) + ' мс',
        navigator.userAgent
      ];
      panel.textContent = lines.join('\n');
      var b = document.createElement('button'); b.textContent = 'Скопировать результат'; b.style.cssText = 'display:block;margin-top:6px;padding:8px 12px;font:14px sans-serif';
      b.onclick = function () { var t = lines.join('\n'); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = 'Скопировано'; }, function () { prompt('Скопируй:', t); }); };
      panel.appendChild(b);
    }
    requestAnimationFrame(f);
  }
  var iv = setInterval(function () { if (window.Z && Z.loaded && Z.ui && Z.ui.loadTap && Z.loadDone !== undefined) { clearInterval(iv); setTimeout(start, 500); } }, 200);
})();
