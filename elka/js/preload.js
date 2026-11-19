/* 2.11.5 · настоящая загрузка ресурсов.
   Раньше звуки начинали качаться вместе с игрой без порядка (около 200 запросов разом), пачка эффектов и музыка — только после
   первого касания, а экран загрузки уходил через 9 секунд, даже если ничего не загрузилось.
   Теперь с самого открытия страницы качается очередь по важности (не больше 6 запросов одновременно):
     A — без чего игра звучит пусто: сэмплы музыки, эффекты, пачка эффектов, тема меню. Экран загрузки показывает её настоящий процент
         и ждёт её (не дольше 40 с на очень плохой сети).
     B — фоном: голоса героев, музыка региона и уровня. Перед уровнем подкачиваются его треки; в углу виден процент, пока качается.
   Скачанное отдаётся игре через fetch() из памяти — повторно по сети ничего не тянется. */
(function () {
'use strict';
var A = window.ASSETS || { music: {}, sfx: [] }, PF = {}, Q = [], active = 0, MAX = 6, seq = 0;
var GR = { a: { items: [] }, b: { items: [] } };
var origFetch = window.fetch ? window.fetch.bind(window) : null;
function norm(u) { if (!u) return ''; try { var a = document.createElement('a'); a.href = u; return a.pathname.replace(/^.*?\/(?=(music|sfx|voice|sfx_pack|voice_pack))/, '') + (a.search || ''); } catch (e) { return u; } }
function add(url, grp, prio) {
  var k = norm(url); if (PF[k]) { if (PF[k].it.prio > prio) { PF[k].it.prio = prio; } return PF[k].p; }
  var it = { url: url, k: k, grp: grp, prio: prio + (seq++) * 1e-6, got: 0, len: 0, done: false, ok: null, no: null };
  var p = new Promise(function (ok, no) { it.ok = ok; it.no = no; }); p.catch(function () { });
  PF[k] = { p: p, it: it, used: false }; GR[grp].items.push(it); Q.push(it); pump(); return p;
}
// 2.12.17: сначала только то, что ждёт экран загрузки (группа A), потом фоновое (B). Раньше музыка меню и пачка эффектов (2 МБ)
// шли в очереди раньше A и вместе со скриптами игры делили сеть — экран загрузки ждал лишние секунды.
var bOpen = false;
function pump() {
  if (!origFetch) return;
  if (!bOpen && (ready('a') && (window.Z && Z.loaded || GR.a.items.length === 0))) bOpen = true;
  Q.sort(function (a, b) { return a.prio - b.prio; });
  for (var i = 0; i < Q.length && active < MAX;) { var it = Q[i]; if (it.grp === 'b' && !bOpen && it.prio >= 0) { i++; continue; } Q.splice(i, 1); run(it); }
}
setInterval(function () { if (!bOpen) pump(); }, 250);
function run(it) {
  active++;
  origFetch(it.url).then(function (r) {
    if (!r.ok) throw new Error('http ' + r.status);
    it.len = +r.headers.get('content-length') || 0;
    if (!r.body || !r.body.getReader) return r.arrayBuffer();
    var rd = r.body.getReader(), parts = [], n = 0;
    function step() { return rd.read().then(function (x) { if (x.done) { var u = new Uint8Array(n), o = 0; parts.forEach(function (q) { u.set(q, o); o += q.length; }); return u.buffer; } parts.push(x.value); n += x.value.length; it.got = n; return step(); }); }
    return step();
  }).then(function (ab) { it.done = true; it.got = it.len = ab.byteLength; active--; it.ok(ab); pump(); },
    function (e) { it.done = true; it.fail = true; active--; delete PF[it.k]; it.no(e); pump(); });
}
// игра качает через fetch(): если файл уже в очереди — отдаём из памяти (и забываем: держать вторую копию незачем)
if (origFetch) window.fetch = function (u, o) {
  var url = typeof u === 'string' ? u : u && u.url, k = norm(url), e = k && PF[k];
  if (e && !e.used && !(o && o.method && o.method !== 'GET')) {
    e.used = true; if (!e.it.done && e.it.prio > 0) { e.it.prio = -1; pump(); }   // игре нужно прямо сейчас — вперёд очереди
    return e.p.then(function (ab) { delete PF[k]; return new Response(ab, { status: 200, headers: { 'Content-Type': 'audio/mpeg' } }); });
  }
  return origFetch(u, o);
};
function frac(g) { var its = GR[g].items; if (!its.length) return 1; var s = 0; its.forEach(function (it) { s += it.done ? 1 : it.len ? Math.min(0.99, it.got / it.len) : 0; }); return s / its.length; }
function ready(g) { return GR[g].items.every(function (it) { return it.done; }); }
// ---------- очередь A: без этого игра звучит пусто ----------
// 2.11.5: экран загрузки ждёт только короткие звуки интерфейса (~0,5 МБ). Музыка меню, пачка боевых эффектов и сэмплы
// музыки боя качаются сразу следом, первыми в фоне (пока игрок в меню, на карте и в мультике), — так в игру пускает в разы быстрее.
// 2.12.17: короткие звуки экрана загрузки — одной пачкой sfx_a.mp3 (раньше ~70 запросов по одному); каждый звук отдаётся игре
// из пачки как отдельный файл. Звук, которого нет в пачке, качается как раньше. Если пачка не скачалась — по одному.
var PK = window.SFXA_IDX;
if (PK && origFetch) {
  var pkP = add('sfx_a.mp3', 'a', 0);
  (A.sfx || []).forEach(function (s) {
    var e = PK[s]; if (!e) { add('sfx/' + s + '.mp3', 'a', 3); return; }
    var k = norm('sfx/' + s + '.mp3'), it = { k: k, prio: 0, done: false };
    var p = pkP.then(function (ab) { it.done = true; return ab.slice(e[0], e[0] + e[1]); }, function () { delete PF[k]; return origFetch('sfx/' + s + '.mp3').then(function (r) { return r.arrayBuffer(); }); });
    p.catch(function () { }); PF[k] = { p: p, it: it, used: false };
  });
  pkP.then(function () { delete PF[norm('sfx_a.mp3')]; }, function () { });
} else (A.sfx || []).forEach(function (s) { add('sfx/' + s + '.mp3', 'a', 3); });
add('music/tracks/mus_map.mp3', 'b', 1);
add('sfx_pack.mp3', 'b', 2);
for (var inst in A.music) {
  if (inst === 'perc') { A.music.perc.forEach(function (p) { add('music/' + p + '.mp3', 'b', 4); }); continue; }
  A.music[inst].forEach(function (m) { add('music/' + inst + '_' + m + '.mp3', 'b', 4); });
}
// ---------- очередь B: фоном ----------
add('music/tracks/mus_r0.mp3', 'b', 20);
add('voice_pack.mp3', 'b', 30); add('voice_pack2.mp3', 'b', 31);
window.__LD = {
  progress: function () { return frac('a'); }, readyA: function () { return ready('a'); },
  bg: function () { var its = GR.b.items.filter(function (it) { return !it.fail; }); if (!its.length || its.every(function (it) { return it.done; })) return 1; var s = 0; its.forEach(function (it) { s += it.done ? 1 : it.len ? Math.min(0.99, it.got / it.len) : 0; }); return s / its.length; },
  want: function (url, prio) { return add(url, 'b', prio === undefined ? 10 : prio); }
};
})();
