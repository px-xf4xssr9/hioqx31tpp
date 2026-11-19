/* 2.11.5 · «Ночь перед Новым годом» 2.0 — бесконечный режим, который меняется по ходу забега.
   • Карта: каждый забег — случайный регион и новая большая карта (как и раньше), но норы открываются постепенно:
     сначала две, потом каждые 6 волн — новая (до пяти). За волну до открытия засыпанная нора трескается и мигает,
     игра предупреждает, где она; в волну открытия часть врагов идёт из новой норы.
   • Темы волн: «Налёт ворон», «Бронеколонна», «Орда сосулек», «Стройбат», «Делёжка», «Метатели», «Лесная нечисть» —
     с 3-й волны почти каждая волна со своей темой (подпись под номером волны).
   • Боссы: каждая 5-я волна — малый босс (Леший с дружиной, Баба-Яга, Кикимора, разбойники), каждая 10-я — большой
     (Великан, Колесница, Метелица, с 30-й — Змей Горыныч), с 20-й — по два.
   • В забег добавлены враги, которых раньше там не было: Леший, Яга, Кикимора, разбойник-подрывник. */
(function () {
'use strict';
var Z = window.Z, D = Z.D;
var TT = function (r, e) { return Z.LANG === 'en' ? e : r; };
var OPEN_EVERY = 6, START_N = 2;
function ok(G) { return G && G.endless && G.L; }

// ---------- норы открываются по ходу забега ----------
var oStart = Z.startEndless;
Z.startEndless = function () {
  var r = oStart.apply(this, arguments), G = Z.G;
  try {
    if (ok(G)) {
      var L = G.L; L.allEnt = L.entrances.slice();
      // первая нора всегда открыта; вторая — самая дальняя от первой
      var first = L.allEnt[0], rest = L.allEnt.slice(1).sort(function (a, b) { return Math.hypot(b[0] - first[0], b[1] - first[1]) - Math.hypot(a[0] - first[0], a[1] - first[1]); });
      L.entrances = [first].concat(rest.slice(0, START_N - 1)); L.closedEnt = rest.slice(START_N - 1);
      G.e2 = { opened: [], warn: null };
      G.dayK = 0; G.dayTgt = 0; G.night = false; G.nightHintT = 0;   // смена дня и ночи — по волнам
      G.fieldDirty = true;
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};
// 2.11.5: если засыпанных нор не осталось — на краю поля появляется новая (до 6 открытых): клетка, куда враги могут
// пройти до ёлки, подальше от других нор и не под вышкой
var MAX_OPEN = 6;
function makeLair(G) {
  var L = G.L, all = L.entrances.concat(L.closedEnt || []), cand = [], md = Math.max(5, Math.floor((L.W + L.H) / 6)), nav = G.nav && G.nav.walk;
  for (var c = 1; c < L.W - 1; c++) cand.push([c, 0]);
  for (var r = 1; r < Math.floor(L.H * 0.6); r++) { cand.push([0, r]); cand.push([L.W - 1, r]); }
  cand = cand.filter(function (q) {
    if (!Z.walkable(q[0], q[1])) return false;
    if (nav && !(nav[q[1] * L.W + q[0]] < Infinity)) return false;
    return all.every(function (e) { return Math.abs(e[0] - q[0]) + Math.abs(e[1] - q[1]) >= md; });
  });
  if (!cand.length) return null;
  var q = cand[Math.floor(Math.random() * cand.length)]; (L.closedEnt = L.closedEnt || []).push(q); G.fieldDirty = true; return q;
}
function nextOpenWave(G) { var n = G.L.entrances.length - START_N + 1; return n * OPEN_EVERY; }   // 6, 12, 18 …
// предупреждение — когда кончилась предыдущая волна
var oUpd = Z.update;
Z.update = function (dt) {
  var r = oUpd.apply(this, arguments), G = Z.G;
  try {
    if (ok(G) && G.dayK !== undefined) {
      var st = Math.min(1, dt / 6); G.dayK += (G.dayTgt - G.dayK) * Math.min(1, st * 3) + Math.sign(G.dayTgt - G.dayK) * Math.min(Math.abs(G.dayTgt - G.dayK), dt / 8);
      var nn = G.dayK > 0.6; if (nn !== G.night) { G.night = nn; }
    }
    if (ok(G) && G.phase !== 'wave' && !G.e2.warn && G.wave + 1 === nextOpenWave(G) && G.L.entrances.length < MAX_OPEN && !(G.L.closedEnt && G.L.closedEnt.length)) { if (G.navDirty && Z.buildNav) Z.buildNav(); makeLair(G); }
    if (ok(G) && G.L.closedEnt && G.L.closedEnt.length && G.phase !== 'wave' && !G.e2.warn && G.wave + 1 === nextOpenWave(G)) {
      G.e2.warn = G.L.closedEnt[0];
      Z._.addText(TT('Здесь откроется нора!', 'A new lair opens here!'), G.e2.warn[0] + 0.5, G.e2.warn[1] + 0.2, '#ff8a8a', 1.6, 1);
      if (Z.ui && Z.ui.toast) Z.ui.toast(TT('В следующей волне откроется новая нора!', 'A new lair opens next wave!'), '#ff8a8a');
      Z.AU.sfx('w_icecrack', 0.6);
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};
// ---------- волна: открыть нору, тема, боссы ----------
var THEMES = [
  ['crows', 'Налёт ворон', 'Crow raid', function (t, rnd) { return rnd() < 0.55 ? 'crow' : t; }, 3],
  ['armor', 'Бронеколонна', 'Armored column', function (t, rnd) { return rnd() < 0.6 ? ['ram', 'plow', 'fat', 'sled'][Math.floor(rnd() * 4)] : t; }, 6],
  ['swarm', 'Орда сосулек', 'Icicle horde', function (t, rnd) { return rnd() < 0.7 ? (rnd() < 0.7 ? 'icicle' : 'raccoon') : t; }, 3, 1.45, 0.7],
  ['build', 'Стройбат', 'Builder squad', function (t, rnd) { return rnd() < 0.45 ? (rnd() < 0.5 ? 'engineer' : 'sculptor') : t; }, 5],
  ['split', 'Делёжка', 'Splitters', function (t, rnd) { return rnd() < 0.5 ? 'split' : t; }, 7],
  ['throw', 'Метатели', 'Throwers', function (t, rnd) { return rnd() < 0.5 ? 'thrower' : t; }, 4],
  ['forest', 'Лесная нечисть', 'Forest spirits', function (t, rnd) { return rnd() < 0.4 ? ['leshy', 'kiki', 'raz', 'yaga'][Math.floor(rnd() * 4)] : t; }, 6]
];
var MINI = [['leshy', 3, 'Леший с дружиной', 'Leshy and his band'], ['yaga', 2, 'Баба-Яга', 'Baba Yaga'], ['kiki', 3, 'Кикиморы', 'Kikimoras'], ['raz', 5, 'Разбойники', 'Robbers']];
var BIG = ['giant', 'chariot', 'witch'];
var oCall = Z.callWave;
Z.callWave = function () {
  var G = Z.G;
  if (!ok(G) || !Z.canCallWave() || !G.waves[G.wave]) return oCall.apply(this, arguments);
  var w = G.wave, W = G.waves[w], L = G.L, rnd = Z.rng(4242 + w * 31 + (G.endSeed || 0)), sub = [];
  try {
    if (!W.e2) {
      W.e2 = 1;
      // новая нора
      var newIdx = -1;
      if (L.closedEnt && L.closedEnt.length && w + 1 >= nextOpenWave(G)) {
        var en = L.closedEnt.shift(); L.entrances.push(en); newIdx = L.entrances.length - 1; G.e2.opened.push(en); G.e2.warn = null; G.e2.popT = 0; G.e2.pop = en;
        G.fieldDirty = true; Z.navDirty(); G.shake = Math.max(G.shake || 0, 0.4); Z.AU.sfx('ice_break', 0.8);
        sub.push(TT('Новая нора!', 'New lair!'));
      }
      var n = L.entrances.length;
      // тема
      var th = null;
      if (w >= 2 && (w + 1) % 5 !== 0 && rnd() < 0.8) { var pool = THEMES.filter(function (q) { return w + 1 >= q[4]; }); th = pool[Math.floor(rnd() * pool.length)]; }
      var list = W.list.filter(function (s) { return !Z.ENEMIES[s.type].boss; });
      if (th) {
        list.forEach(function (s) { s.type = th[3](s.type, rnd); });
        if (th[5]) { var extra = Math.round(list.length * (th[5] - 1)); for (var i = 0; i < extra; i++) { var b = list[Math.floor(rnd() * list.length)]; list.push({ t: b.t + rnd() * 0.6, type: b.type, path: b.path, elite: false, m: th[6] }); } }
        if (th[0] === 'build') for (var gb = 0; gb < 2; gb++) try { Z._growBase && Z._growBase(G); } catch (e1) { if (window.__rep) window.__rep(e1); }
        sub.push(Z.LANG === 'en' ? th[2] : th[1]);
      }
      // пути: все открытые норы; из новой — заметная часть волны
      list.forEach(function (s, i) { s.path = newIdx >= 0 && rnd() < 0.4 ? newIdx : (s.path % n + (rnd() < 0.3 ? Math.floor(rnd() * n) : 0)) % n; });
      // боссы
      var tEnd = list.length ? list[list.length - 1].t : 6;
      if ((w + 1) % 10 === 0) {
        var nb = w + 1 >= 20 ? 2 : 1, big = BIG.concat(w + 1 >= 30 ? ['gorynych'] : []);
        for (var k = 0; k < nb; k++) { var bt = big[(Math.floor(w / 10) + k + (G.endSeed || 0)) % big.length]; list.push({ t: tEnd * (0.35 + k * 0.3), type: bt, path: k % n }); }
        sub.push(TT('Босс!', 'Boss!'));
      } else if ((w + 1) % 5 === 0) {
        var mb = MINI[(Math.floor(w / 5) + (G.endSeed || 0)) % MINI.length], cnt = mb[1] + Math.floor(w / 15);
        for (var q = 0; q < cnt; q++) list.push({ t: tEnd * 0.4 + q * 0.7, type: mb[0], path: (q + (newIdx >= 0 ? newIdx : 0)) % n, elite: q === 0 });
        sub.push(Z.LANG === 'en' ? mb[3] : mb[2]);
      }
      list.sort(function (a, b) { return a.t - b.t; });
      W.list = list; W.sub = sub.join(' · ');
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
  try {
    if (G.dayK !== undefined) {   // день 1–3, закат 4, ночь 5–7, рассвет 8, снова день…
      var ph = w % 8, tg = ph < 3 ? 0 : ph === 3 ? 0.4 : ph < 7 ? 1 : 0.4, was = G.dayTgt; G.dayTgt = tg;
      if (tg !== was) W.sub = [tg === 1 ? TT('Ночь: вышки видят только вблизи', 'Night: towers only see up close') : tg === 0 ? TT('Рассвело', 'Morning') : was === 0 ? TT('Закат', 'Dusk') : TT('Рассвет', 'Dawn')].concat(W.sub ? [W.sub] : []).join(' · ');
    }
  } catch (e3) { if (window.__rep) window.__rep(e3); }
  var r = oCall.apply(this, arguments);
  try { if (G.banner && W.sub) { G.banner.sub = (G.banner.sub ? G.banner.sub + ' · ' : '') + W.sub; G.banner.t = Math.max(G.banner.t || 0, 2.8); G.banner.big = true; } } catch (e2) { if (window.__rep) window.__rep(e2); }
  return r;
};
// ---------- засыпанные норы на поле: сугроб, перед открытием — трещины и мигание ----------
var oUnder = Z.drawUnder;
Z.drawUnder = function (ctx, X, Y, cs, t) {
  if (oUnder) oUnder.apply(this, arguments);
  var G = Z.G; if (!ok(G) || !G.L.closedEnt) return;
  try {
    G.L.closedEnt.forEach(function (en) {
      var x = X(en[0] + 0.5), y = Y(en[1] + 0.5), warn = G.e2 && G.e2.warn === en, l = Math.max(1.2, cs * 0.04);
      D.ell(x, y + cs * 0.08, cs * 0.42, cs * 0.2, 'rgba(30,40,80,0.18)');
      ctx.beginPath(); ctx.ellipse(x, y + cs * 0.06, cs * 0.4, cs * 0.3, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#f5f8ff'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = D.OL; ctx.stroke();
      ctx.fillStyle = '#d6e0f2'; ctx.beginPath(); ctx.ellipse(x + cs * 0.1, y + cs * 0.02, cs * 0.18, cs * 0.08, 0, Math.PI, 0); ctx.fill();
      if (warn) {
        var a = 0.5 + 0.5 * Math.sin(t * 7);
        ctx.strokeStyle = 'rgba(40,30,60,0.85)'; ctx.lineWidth = l * 0.9; ctx.beginPath(); ctx.moveTo(x - cs * 0.22, y); ctx.lineTo(x - cs * 0.05, y - cs * 0.1); ctx.lineTo(x + cs * 0.06, y - cs * 0.02); ctx.lineTo(x + cs * 0.2, y - cs * 0.14); ctx.moveTo(x - cs * 0.05, y - cs * 0.1); ctx.lineTo(x - cs * 0.02, y - cs * 0.2); ctx.stroke();
        D.circ(x - cs * 0.08, y - cs * 0.05, cs * 0.04, 'rgba(255,90,90,' + (0.4 + a * 0.6).toFixed(2) + ')'); D.circ(x + cs * 0.08, y - cs * 0.05, cs * 0.04, 'rgba(255,90,90,' + (0.4 + a * 0.6).toFixed(2) + ')');
        ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, cs * 0.75, 0, Math.PI * 2); ctx.strokeStyle = '#ff5a5f'; ctx.lineWidth = cs * 0.07; ctx.stroke(); ctx.globalAlpha = 1;
      }
    });
  } catch (e) { ctx.globalAlpha = 1; }
};
})();
// ---------- окно рейтинга бесконечного режима (VK) ----------
(function () {
  var Z = window.Z, D = Z.D, UI = Z.ui, TT = function (r, e) { return Z.LANG === 'en' ? e : r; };
  var oCustom = UI.customModal;
  UI.customModal = function (m, w) {
    if (m.type !== 'vklb') return oCustom ? oCustom(m, w) : false;
    var a = UI.api(), S = a.S, c = a.ctx;
    if (!m.req && Z.vkTopLoad) { m.req = 1; Z.vkTopLoad().then(function () { m.done = 1; }, function () { m.err = 1; }); }
    var d = Z.vkTop, rows = d && d.top ? d.top.slice(0, 10) : [], fw = Math.min(a.W * 0.94, 440 * S), rh = 34 * S;
    var f = a.frame(fw, 44 * S + 34 * S + 10 * rh + 24 * S + 128 * S, TT('Рейтинг: Ночь перед Новым годом', 'Leaderboard: New Year\'s Eve')); a.closeX(f);
    var y = f.y + 40 * S, best = Z.save.endlessBest || 0, myId = (function () { var mm = location.search.match(/[?&]vk_user_id=(\d+)/); return mm ? mm[1] : ''; })();
    D.text(TT('Сколько волн продержался — больше всех волн у первого', 'Waves survived — most waves wins'), f.x + fw / 2, y + 6 * S, Math.max(10, D.fitText(TT('Сколько волн продержался — больше всех волн у первого', 'Waves survived — most waves wins'), fw - 40 * S, 12 * S)), '#6a7394');
    y += 26 * S;
    if (!rows.length) D.text(m.err ? TT('Не удалось загрузить — проверьте интернет', 'Could not load — check your connection') : !m.done ? TT('Загрузка…', 'Loading…') : TT('Пока никого — стань первым!', 'Nobody yet — be the first!'), f.x + fw / 2, y + 5 * rh, 14 * S, '#4a5378');
    rows.forEach(function (r, i) {
      var ry = y + i * rh, mine = r.id === myId;
      D.rr(f.x + 16 * S, ry, fw - 32 * S, rh - 4 * S, 9 * S); c.fillStyle = mine ? '#fff3c4' : i % 2 ? '#f2ede0' : '#ece5d4'; c.fill();
      var medal = ['#ffd54a', '#cfd6e6', '#e0a46a'][i];
      if (medal) D.circ(f.x + 34 * S, ry + (rh - 4 * S) / 2, 11 * S, medal, 1.5);
      D.text('' + (i + 1), f.x + 34 * S, ry + (rh - 4 * S) / 2, 13 * S, D.OL, 'center', 'middle');
      var nm = r.n || TT('Игрок', 'Player'); D.text(nm, f.x + 56 * S, ry + (rh - 4 * S) / 2, Math.max(11, D.fitText(nm, fw - 170 * S, 14 * S)), D.OL, 'left', 'middle');
      var vt = r.v + ' ' + TT('волн', 'waves'); D.text(vt, f.x + fw - 28 * S, ry + (rh - 4 * S) / 2, 14 * S, '#6b3fa0', 'right', 'middle');
    });
    y += 10 * rh + 6 * S;
    var mr = d && d.me ? d.me : null, ml = best ? TT('Твой рекорд: ', 'Your best: ') + best + (mr && mr.rank ? TT(' · место ', ' · place ') + mr.rank : '') : TT('Сыграй, чтобы попасть в рейтинг', 'Play to get on the board');
    D.text(ml, f.x + fw / 2, y + 8 * S, 15 * S, D.OL); y += 26 * S;
    var eUn = Z.unlockedLevel() >= 7;   // режим открывается после 1-го региона — из рейтинга тоже
    if (eUn) a.bigBtn('lbplay', f, y, TT('Играть: Ночь перед Новым годом', 'Play: New Year\'s Eve'), function () { UI.closeModal(); if (UI.goEndless) UI.goEndless(); }, '#9a7ce8', '#6b3fa0');
    else a.bigBtn('lbplay', f, y, '🔒 ' + Z.T('endlessLock'), function () { if (UI.toast) UI.toast(Z.T('endlessLock'), '#ffd54a'); }, '#b7bfd6', '#8a93ad');
    return true;
  };
})();
