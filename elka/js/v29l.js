// v2.10.7: динамика.
// 1) Ритм волны: разведка (несколько быстрых) → пауза → основная группа → пауза → «Натиск!» (плотная группа в конце).
//    Раньше враги шли ровной струйкой — не было ни передышки, ни пика.
// 2) Вожак: с 7-го уровня в каждой волне с 3-й — один «вожак» (корона, ×3 здоровья, броня); за него ×3 монет.
// 3) Характер волны (с 4-го уровня, через волну): «Быстрые», «Толпа», «В броне», «С двух сторон».
//    Видно заранее — плашка над кнопкой волны, и баннер при старте.
// 4) Базовый темп ×1,15 — без ускорения за рекламу игра не тянется.
(function () {
var Z = window.Z, TT = Z.TT, D = Z.D, UI = Z.ui;
if (Z.timeScale === undefined) Z.timeScale = 1.15;
var MODS = {
  fast: { n: ['Быстрые', 'Fast'], s: ['Враги быстрее, но слабее', 'Faster but weaker'], c: '#ffb84a', i: '⚡' },
  swarm: { n: ['Толпа', 'Swarm'], s: ['Врагов больше, но они хрупкие', 'More of them, but fragile'], c: '#ff8a9a', i: '✚' },
  armor: { n: ['В броне', 'Armored'], s: ['Броня крепче — нужны пушки помощнее', 'Tougher armor — bring heavy guns'], c: '#b8c6e6', i: '⛨' },
  flank: { n: ['С двух сторон', 'Flanking'], s: ['Идут сразу по всем дорогам', 'They come by every road'], c: '#7fd8ff', i: '⇄' }
};
Z.WAVE_MODS = MODS;
var FASTT = { sled: 1, icicle: 1, raccoon: 1, crow: 1, kiki: 1 };
function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function shape(waves, info, L) {
  var rnd = rng(4242 + info.idx * 13), nPaths = (L && L.entrances) ? L.entrances.length : 1, nW = waves.length;
  var pool = ['fast', 'swarm']; if (info.region >= 1) pool.push('armor'); if (info.region >= 2 && nPaths >= 2) pool.push('flank');
  for (var sh = pool.length - 1; sh > 0; sh--) { var j0 = Math.floor(rnd() * (sh + 1)), tp = pool[sh]; pool[sh] = pool[j0]; pool[j0] = tp; }
  var km = 0;
  waves.forEach(function (w, wi) {
    var last = wi === nW - 1, list = w.list || [];
    var boss = list.filter(function (s) { return Z.ENEMIES[s.type] && Z.ENEMIES[s.type].boss; }), units = list.filter(function (s) { return boss.indexOf(s) < 0; });
    // характер волны
    if (info.idx >= 3 && wi >= 2 && !last && wi % 2 === 0) w.mod = pool[km++ % pool.length];
    if (w.mod === 'swarm') { var add = []; units.forEach(function (s, i) { if (i % 2 === 0) add.push({ t: s.t + 0.2, type: s.type, path: s.path }); }); units = units.concat(add); }
    if (w.mod === 'flank') units.forEach(function (s, i) { s.path = i % nPaths; });
    var n = units.length;
    if (info.idx >= 2 && n >= 6) {
      units.sort(function (a, b) { return a.t - b.t; });
      var span = Math.max(1, units[n - 1].t - units[0].t), gap = Math.max(0.45, span / n);
      var ns = Math.max(2, Math.round(n * 0.15)), nr = Math.round(n * (last ? 0.4 : 0.3)), nm = n - ns - nr;
      // разведка — быстрые типы вперёд
      var scouts = units.filter(function (s) { return FASTT[s.type]; }).slice(0, ns); units.forEach(function (s) { if (scouts.length < ns && scouts.indexOf(s) < 0) scouts.push(s); });
      var rest = units.filter(function (s) { return scouts.indexOf(s) < 0; }), main = rest.slice(0, nm), rush = rest.slice(nm);
      var t = 0.5; scouts.forEach(function (s, i) { s.t = t + i * 0.9; }); t += scouts.length * 0.9 + 2.2;
      main.forEach(function (s, i) { s.t = t + i * gap * 0.95; }); t += main.length * gap * 0.95 + 3.0;
      w.rushT = t; rush.forEach(function (s, i) { s.t = t + i * 0.28 + (i % 3 === 2 ? 0.25 : 0); s.rush = i === 0 ? 2 : 1; });
      boss.forEach(function (s) { s.t = Math.min(s.t, t * 0.6); });
    }
    // вожак
    if (info.idx >= 6 && wi >= 2 && units.length) {
      var cand = units.filter(function (s) { return !s.rush && !(Z.ENEMIES[s.type] || {}).vehicle; }); if (!cand.length) cand = units;
      cand[Math.floor(cand.length * 0.5)].elite = true;
    }
    if (w.mod) units.forEach(function (s) { s.m = w.mod; });
    w.list = units.concat(boss).sort(function (a, b) { return a.t - b.t; });
  });
  return waves;
}
var oMW = Z.makeWaves;
Z.makeWaves = function (info, heroic, L) { var W = oMW.apply(this, arguments); try { if (W && info && !info.endless) shape(W, info, L); } catch (e) { if (window.__rep) window.__rep(e); } return W; };

// характер волны — на вышедшем враге
var oWS = Z.hk.waveSpawn;
Z.hk.waveSpawn = function (e, q) {
  if (oWS) oWS(e, q);
  var G = Z.G;
  if (q.m === 'fast') { e.spd *= 1.25; e.hp *= 0.8; e.max = e.hp; e.wmod = 'fast'; }
  else if (q.m === 'swarm') { e.hp *= 0.6; e.max = e.hp; e.coinMul = 0.6; }
  else if (q.m === 'armor') { e.armor += 2; e.wmod = 'armor'; }
  if (q.rush === 2 && G && !G._rushShown) {
    G._rushShown = 1; G.banner = { text: TT('Натиск!', 'Rush!'), sub: TT('Самая плотная часть волны', 'The thickest part of the wave'), t: 1.6 };
    Z.AU.sfx('drum', 0.8); Z.AU.sfx('boss_horn', 0.35, { pitch: 1.3 }); G.shake = Math.max(G.shake || 0, 0.25);
  }
};
// вожак: ×3 монет
var oKill = Z.hk.kill;
Z.hk.kill = function (e) {
  if (oKill) oKill(e);
  var G = Z.G; if (!G || !e || !e.elite || e.boss || e._eb) return;
  e._eb = 1; var b = Math.round(((Z.ENEMIES[e.type] || {}).coin || 10) * 2); G.coins += b;
  if (Z._.addText) Z._.addText(TT('Вожак! +', 'Leader! +') + b, e.x, e.y - 0.8, '#ffd54a', 1.3, 0.7);
};
// баннер характера волны при старте
var oCall = Z.callWave;
Z.callWave = function () {
  var G = Z.G, w0 = G && G.wave, r = oCall.apply(this, arguments);
  if (!G || !G.waves || G.wave === w0) return r;
  G._rushShown = 0;
  var w = G.waves[w0], M = w && w.mod && MODS[w.mod];
  if (M) G.banner = { text: TT('Волна ', 'Wave ') + (w0 + 1) + ': ' + TT(M.n[0], M.n[1]), sub: TT(M.s[0], M.s[1]), t: 2.4 };
  return r;
};
// плашка «Дальше: …» над кнопкой волны
var oRender = UI.render;
UI.render = function () {
  var res = oRender.apply(this, arguments);
  try {
    var G = Z.G; if (UI.screen !== 'level' || UI.modal || !G || !G.waves || G.L.type === 'escort') return res;
    if (!(G.phase === 'build' || G.phase === 'between' || G.phase === 'wave')) return res;
    var w = G.waves[G.wave], M = w && w.mod && MODS[w.mod]; if (!M) return res;
    var b = (UI.btns ? UI.btns() : []).filter(function (q) { return q.id === 'wave'; })[0]; if (!b) return res;
    var A = UI.api(), S = A.S || 1, ctx = A.ctx, lab = TT('Дальше: ', 'Next: ') + TT(M.n[0], M.n[1]), fs = 13 * S;
    ctx.save(); ctx.font = D.font(fs); var tw = ctx.measureText(lab).width; ctx.restore();
    var cw = Math.min(b.w * 1.25, tw + 34 * S), ch = 24 * S, cx = b.x + b.w / 2 - cw / 2, cy = b.y - ch - 6 * S;
    D.rr(cx, cy, cw, ch, ch / 2); ctx.fillStyle = 'rgba(30,36,70,0.88)'; ctx.fill(); ctx.lineWidth = 2 * S; ctx.strokeStyle = M.c; ctx.stroke();
    D.text(M.i, cx + 13 * S, cy + ch / 2, 14 * S, M.c, 'center', 'middle');
    D.text(lab, cx + 24 * S + (cw - 30 * S) / 2, cy + ch / 2, D.fitText(lab, cw - 32 * S, fs), '#ffffff', 'center', 'middle', 2 * S);
  } catch (e) { if (window.__rep) window.__rep(e); }
  return res;
};
// «быстрые» — с полоской скорости за спиной, «в броне» — с синим отблеском
var oE = D.enemy;
D.enemy = function (e, x, y, cs, t) {
  var r = oE.apply(this, arguments);
  if (e && e.wmod && !e.dead) {
    var c = D.ctx; c.save();
    if (e.wmod === 'fast') { c.globalAlpha = 0.6; c.strokeStyle = '#ffb84a'; c.lineWidth = Math.max(1.2, cs * 0.04); for (var i = 0; i < 3; i++) { var yy = y - cs * (0.25 + i * 0.18) * (e.size || 1); c.beginPath(); c.moveTo(x - (e.dir || 1) * cs * 0.35, yy); c.lineTo(x - (e.dir || 1) * cs * (0.6 + (i % 2) * 0.12), yy); c.stroke(); } }
    else if (e.wmod === 'armor') { c.globalAlpha = 0.85; D.circ(x + (e.dir || 1) * cs * 0.28 * (e.size || 1), y - cs * 0.45 * (e.size || 1), cs * 0.11, '#b8c6e6', Math.max(1, cs * 0.03)); }
    c.restore();
  }
  return r;
};
})();
