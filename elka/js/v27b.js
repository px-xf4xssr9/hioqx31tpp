/* 2.7b · удержание: ежедневные задания, копилка Пломбира, герой на один бой за рекламу, предложение стартового набора,
   удалённые настройки Яндекса (getFlags) — частоту рекламы и цены можно менять в консоли без новой модерации */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, OL = D.OL, COL = D.COL;
function TT(r, e) { return Z.LANG === 'en' ? e : r; }
function T(k) { return Z.T(k); }
function A() { return UI.api(); }

// ---------- удалённые настройки ----------
var FL = {};
Z.FLAG = function (k, d) { var v = FL[k]; if (v === undefined || v === null || v === '') return d; var n = parseFloat(v); return isNaN(n) ? v : n; };
var tries = 0, iv = setInterval(function () {
  if (++tries > 60) { clearInterval(iv); return; }
  var S0 = Z.SDK; if (!S0) return;
  if (!S0._rew27) {   // считаем полученные бонусы за рекламу (для задания дня)
    S0._rew27 = true; var r0 = S0.rewarded;
    S0.rewarded = function (onR, onD) { return r0.call(this, function () { try { Z.save.stats.adsW = (Z.save.stats.adsW || 0) + 1; } catch (e) { if (window.__rep) window.__rep(e); } if (onR) onR(); }, onD); };
  }
  if (!S0.ysdk) return;
  clearInterval(iv);
  try { S0.ysdk.getFlags({ defaultFlags: {} }).then(function (f) { FL = f || {}; }).catch(function () {}); } catch (e) { if (window.__rep) window.__rep(e); }
}, 250);

// ---------- сохранение ----------
if (Z.save.dq === undefined) Z.save.dq = { day: '', base: {}, got: {}, all: 0 };
if (Z.save.bank === undefined) Z.save.bank = { t: 0 };
function fix() { if (!Z.save.dq || typeof Z.save.dq !== 'object') Z.save.dq = { day: '', base: {}, got: {}, all: 0 }; if (!Z.save.dq.base) Z.save.dq.base = {}; if (!Z.save.dq.got) Z.save.dq.got = {}; if (!Z.save.bank || typeof Z.save.bank !== 'object') Z.save.bank = { t: 0 }; if (Z.fixSave27) Z.fixSave27(); }

// ---------- задания дня: победы, бонус за рекламу и одно сменное ----------
var ROT = [['kills', 80, 'Победи 80 врагов', 'Defeat 80 enemies'], ['built', 10, 'Построй 10 вышек', 'Build 10 towers'], ['heroKills', 20, 'Героями победи 20 врагов', 'Defeat 20 enemies with heroes'],
  ['merges', 2, 'Объедини вышки 2 раза', 'Merge towers twice'], ['perfect', 1, 'Пройди уровень без потерь', 'Finish a level without losses']];
function dayNum() { var p = Z.todayStr().split('-'); return (+p[0]) * 372 + (+p[1]) * 31 + (+p[2]); }
function quests() {
  var r = ROT[dayNum() % ROT.length];
  return [{ id: 'wins', stat: 'wins27', need: 2, ru: 'Победи в 2 уровнях', en: 'Win 2 levels' },
    { id: 'rot', stat: r[0], need: r[1], ru: r[2], en: r[3] },
    { id: 'ads', stat: 'adsW', need: 1, ru: 'Получи любой бонус за рекламу', en: 'Claim any ad bonus' }];
}
function ensureDay() {
  fix(); var d = Z.todayStr(), q = Z.save.dq;
  if (q.day !== d) { q.day = d; q.base = {}; q.got = {}; q.all = 0; quests().forEach(function (x) { q.base[x.stat] = Z.save.stats[x.stat] || 0; }); Z.persist(); }
}
function prog(x) { return Math.max(0, (Z.save.stats[x.stat] || 0) - (Z.save.dq.base[x.stat] || 0)); }
function questReady() { ensureDay(); var n = 0, qs = quests(), done = 0; qs.forEach(function (x) { if (Z.save.dq.got[x.id]) done++; else if (prog(x) >= x.need) n++; }); if (done === qs.length && !Z.save.dq.all) n++; return n; }
var Q_RW = 2;

// ---------- копилка: снежинки копятся, пока игрока нет ----------
var BANK_CAP = 6;
function bankStep() { return Z.FLAG('bank_min', 90) * 60000; }
function bankNow() { fix(); var b = Z.save.bank; if (!b.t) { b.t = Date.now(); Z.persist(); } return Math.max(0, Math.min(BANK_CAP, Math.floor((Date.now() - b.t) / bankStep()))); }
function bankTake(mult) { var n = bankNow(); if (!n) return; Z.save.flakes += n * mult; Z.save.bank.t = Date.now(); Z.AU.sfx('reward'); UI.toast('+' + n * mult + ' ' + TT('снежинок из копилки', 'snowflakes from the bank'), '#9fdcff'); Z.persist(true); }

// ---------- герой на один бой ----------
Z.adHero = {};
var oldHO = Z.heroOpen;
Z.heroOpen = function (t, idx) { return oldHO(t, idx) || Z.adHero[t] === idx; };
Z.heroTryOffer = function (t, m) { UI.goModal({ type: 'heroTry', hero: t, idx: m.idx, back: m }); };
function takeHero(t, idx) {
  Z.adHero[t] = idx;
  var sel = Z.squadFor(idx).slice(), lim = Z.okLimit(idx);
  if (sel.indexOf(t) < 0) { var prev = sel; sel = [t]; prev.forEach(function (p) { if (Z.okUsed(sel) + Z.OK_COST[p] <= lim) sel.push(p); }); }   // новичок в отряде, остальные — кто поместится по очкам
  Z.save.squad = sel; if (Z.save.sqT) Z.save.sqT[idx] = 1; Z.persist(); Z.AU.sfx('levelup');
}
var oldMap = UI.goMap;
UI.goMap = function () { Z.adHero = {}; return oldMap.apply(this, arguments); };

// ---------- победы: счётчик для заданий и разовое предложение стартового набора ----------
var pendOffer = false, oldEnd = UI.onLevelEnd;
UI.onLevelEnd = function () {
  var G = Z.G, r = oldEnd.apply(this, arguments);
  try {
    if (G && G.result && G.result.win && !G.endless) {
      Z.save.stats.wins27 = (Z.save.stats.wins27 || 0) + 1;
      if (Z.save.meta && Z.save.meta.wins === 4 && !Z.save.meta.offer && !Z.save.shop.starter && Z.FLAG('offer_starter', 1)) pendOffer = true;
    }
  } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};

// ---------- первые три уровня: отряда ещё нет, поэтому бой шёл молча. Теперь его ведут голоса из мультика —
// Снегурочка командует обороной («Ставим пушки!»), еноты и Метелица отвечают. Все реплики уже озвучены. ----------
var oUpd27 = Z.hk.update;
Z.hk.update = function (dt) {
  if (oUpd27) oUpd27.apply(this, arguments);
  var G = Z.G; if (!G || G.idx > 2 || G.endless || (G.squad && G.squad.length) || !Z.sayLine) return;
  var v = G.v27 || (G.v27 = { t: 0, idle: 0, nTw: 0, said: {} });
  var say = function (id, pr) { if (v.said[id]) return false; if (Z.sayLine(id, pr === undefined ? 0.6 : pr)) { v.said[id] = 1; return true; } return false; };
  v.t += dt;
  var nTw = Object.keys(G.towers).length, wave = G.phase === 'wave';
  if (G.phase === 'build') {
    if (G.idx === 0 && v.t > 1.2) say('SNE-02', 1);                       // «Всем привет, мы в эфире! Сегодня защищаем ёлку.»
    if (G.idx === 1 && v.t > 1.2) say('SNE-01', 1);                       // «Лечу, чиню, стреляю. И всё это в кокошнике.»
    if (G.idx === 2 && v.t > 1.2) say('SNE-11', 1);                       // «Олени сыты, подарки пристёгнуты. Поехали!»
    v.idle = nTw > v.nTw ? 0 : v.idle + dt; if (v.idle > 9 && nTw < 2) say('SNE-15');   // «Пока тихо, можно и пушку поставить. Намёк.»
  }
  if (nTw < v.nTw) say('SNE-10');                                         // «Эту башню мы не спасли. Но я её сфоткала на память.»
  v.nTw = nTw;
  if (wave || G.phase === 'escortRun') {
    v.wt = (v.wt || 0) + dt;
    if (v.wt > 2.5 && G.enemies.some(function (e) { return !e.dead && e.type === 'raccoon'; })) say(G.idx === 1 ? 'ENO-02' : 'ENO-01');   // «Шарики наши!» / «Хозяйка сказала — всё в мешок!»
    if (G.wave >= 2 && v.wt > 6) say('ANO-03');                           // Метелица: «Позвала всех родственников. И соседей.»
  } else v.wt = 0;
  var hpN = G.L.type === 'escort' && G.sleigh ? G.sleigh.hp : G.hp;
  if (v.hp !== undefined && hpN < v.hp) { if (G.L.type === 'escort') say('SNE-12'); else say('MOR-13', 0.8); }   // «Эй! Это сани, а не мишень!» / Дед Мороз по связи: «Внучата, ёлку бьют! Все к ёлке!»
  v.hp = hpN;
  if (G.phase === 'between' && G.wave >= 2) say('ENO-05');                // «Блинский блин, шарики раскатились!»
};
var oEnd27 = UI.onLevelEnd;
UI.onLevelEnd = function () {
  var G = Z.G;
  try { if (G && G.idx <= 2 && !(G.squad && G.squad.length) && G.result && Z.sayLine) Z.sayLine(G.result.win ? (G.L.type === 'escort' ? 'SNE-13' : 'SNE-14') : 'MOR-16', 1); } catch (e) { if (window.__rep) window.__rep(e); }
  return oEnd27.apply(this, arguments);
};

// ---------- подкрепление после поражения: при новой попытке на том же уровне — больше монет на старте (до +30%) ----------
if (Z.save.fail === undefined) Z.save.fail = {};
var oGo27 = UI.goLevel;
UI.goLevel = function (idx, heroic) {
  var r = oGo27.apply(this, arguments), G = Z.G;
  try {
    var n = Math.min(3, (Z.save.fail && Z.save.fail[idx]) || 0);
    if (G && !heroic && !G.endless && !G.trial && n > 0) { var add = Math.round(G.coins * 0.1 * n); G.coins += add; setTimeout(function () { if (Z.G === G) UI.toast(TT('Подкрепление: +', 'Reinforcements: +') + add + TT(' монет', ' coins'), '#ffd54a'); }, 900); }
  } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};
var oEnd27b = UI.onLevelEnd;
UI.onLevelEnd = function () {
  var G = Z.G;
  try { if (G && G.result && !G.endless && !G.heroic && !G.trial) { if (!Z.save.fail || typeof Z.save.fail !== 'object') Z.save.fail = {}; if (G.result.win) delete Z.save.fail[G.idx]; else Z.save.fail[G.idx] = (Z.save.fail[G.idx] || 0) + 1; Z.persist(); } } catch (e) { if (window.__rep) window.__rep(e); }
  return oEnd27b.apply(this, arguments);
};

// ---------- карта: кнопка заданий ----------
function scroll(x, y, r) { var c = D.ctx; D.rr(x - r * 0.8, y - r, r * 1.6, r * 2, r * 0.2); c.fillStyle = '#fff6dc'; c.fill(); c.lineWidth = Math.max(1.5, r * 0.14); c.strokeStyle = OL; c.stroke(); for (var i = 0; i < 3; i++) { D.circ(x - r * 0.45, y - r * 0.5 + i * r * 0.5, r * 0.13, i === 0 ? COL.green : '#c9cfdc'); c.strokeStyle = '#8a93b0'; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(x - r * 0.2, y - r * 0.5 + i * r * 0.5); c.lineTo(x + r * 0.5, y - r * 0.5 + i * r * 0.5); c.stroke(); } }
var oldExtra = UI.mapExtra;
UI.mapExtra = function (s, bh2, by2) {
  if (oldExtra) oldExtra(s, bh2, by2);
  ensureDay();
  var a = A(), bs = 56 * s, bh = 60 * s, slot = UI._ls || 0, y = by2 - (slot + 1) * 70 * s, n = questReady() + (bankNow() >= 3 ? 1 : 0);
  // одна кнопка «Подарки» вместо трёх: календарь, подарок под ёлкой, задания и копилка
  var cal = Z.save.daily !== Z.todayStr(), adg = !!UI._adGiftReady && Z.unlockedLevel() >= 1, tot = n + (cal ? 1 : 0) + (adg ? 1 : 0);
  y = by2 - 70 * s;
  a.button('mgifts', 10 * s, y, bs, bh, { r: 14 * s, c1: '#ff7a7f', c2: COL.redD, pulse: tot > 0, fn: function () { UI.openModal({ type: 'gifts' }); },
    draw: function (bx, by, bw, bhh) { D.gift(bx + bw / 2, by + bhh * 0.42, 14 * s); var l = TT('Подарки', 'Gifts'); D.text(l, bx + bw / 2, by + bhh - 9 * s, Math.max(10.5, D.fitText(l, bw - 6 * s + 2 * s, 12.5 * s)), '#fff', 'center', 'middle', 2 * s); } });
  if (tot > 0) a.badge(10 * s + bs - 6 * s, y + 6 * s, 9 * s);
  // бесконечный режим «Ночь перед Новым годом» — кнопка и на карте (раньше был только в главном меню), с объявлением при открытии
  if (Z.unlockedLevel() >= 7) {
    var W0 = a.W;
    a.button('mnight', 10 * s, by2 - 140 * s - 14 * s, bs, bh,   /* 2.11.5: слева над «Подарками» — справа его закрывал «Набор» */ { r: 14 * s, c1: '#9a7ce8', c2: COL.purpleD, pulse: !Z.save.seen.endlessTried, fn: function () { Z.save.seen.endlessTried = 1; Z.persist(); UI.openModal({ type: 'endless' }); },
      draw: function (bx, by, bw, bhh) { D.circ(bx + bw / 2 + 2 * s, by + bhh * 0.4, 11 * s, '#fff3b0'); D.circ(bx + bw / 2 + 7 * s, by + bhh * 0.35, 9.5 * s, '#9a7ce8'); D.text('∞', bx + bw / 2 - 6 * s, by + bhh * 0.48, 14 * s, '#fff', 'center', 'middle', 2 * s); var l = TT('Ночь', 'Night'); D.text(l, bx + bw / 2, by + bhh - 9 * s, Math.max(10.5, D.fitText(l, bw - 6 * s + 2 * s, 12.5 * s)), '#fff', 'center', 'middle', 2 * s);
        var eb = Z.save.endlessBest || 0; if (eb > 0) { var rt = eb + ' ' + TT('волн', 'waves'); D.rr(bx + 2 * s, by - 17 * s, bw - 4 * s, 15 * s, 7 * s); D.ctx.fillStyle = 'rgba(27,36,72,0.85)'; D.ctx.fill(); D.text(rt, bx + bw / 2, by - 9.5 * s, Math.max(9.5, D.fitText(rt, bw - 8 * s, 11 * s)), '#ffd54a', 'center', 'middle', 0); }   /* 2.11.5: личный рекорд под кнопкой */ } });
    if (!Z.save.seen.endlessNew && !UI.modal) { Z.save.seen.endlessNew = 1; Z.persist(); UI.toast(TT('Открыт бесконечный режим «Ночь перед Новым годом»!', 'Endless mode unlocked: New Year\'s Eve Night!'), '#c7b8ff'); }
  }
  if (pendOffer && !UI.modal && UI.screen === 'map' && Z.SDK27 && Z.SDK27.payReady()) { pendOffer = false; Z.save.meta.offer = 1; Z.persist(true); UI.openModal({ type: 'offer' }); }
};

// ---------- окна ----------
UI.giftHub = true;
var oldCustom = UI.customModal, M = {};
UI.customModal = function (m, w) {
  if (oldCustom && oldCustom(m, w)) return true;
  var fn = M[m.type]; if (!fn) return false;
  fix(); var a = A(); a.ctx.save(); fn(m, w, a); a.ctx.restore(); return true;
};
M.quests = function (m, w, a) {
  ensureDay();
  var S = a.S, ctx = a.ctx, qs = quests(), q = Z.save.dq, rh = 58 * S, f = a.frame(w, 150 * S + qs.length * (rh + 6 * S) + 70 * S, TT('Задания дня', 'Daily quests'));
  // копилка
  var by = f.y + 34 * S, bn = bankNow(), bhh = 84 * S;
  D.rr(f.x + 12 * S, by, w - 24 * S, bhh, 12 * S); ctx.fillStyle = '#e3f4ff'; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.rect(f.x + 12 * S, by, 70 * S, bhh); ctx.clip(); D.ally('plombir', f.x + 46 * S, by + bhh - 6 * S, 22 * S, { dir: 1 }); ctx.restore();
  var bt = TT('Копилка Пломбира: ', "Plombir's bank: ") + bn + '/' + BANK_CAP; D.text(bt, f.x + 84 * S, by + 16 * S, D.fitText(bt, w - 110 * S, 14 * S), OL, 'left');
  var mins = Math.round(bankStep() / 60000), bd = bn >= BANK_CAP ? TT('Полная! Забери, чтобы копила дальше', 'Full! Collect to keep it filling') : TT('+1 снежинка каждые ', '+1 snowflake every ') + (mins >= 60 ? (mins / 60).toFixed(mins % 60 ? 1 : 0).replace('.', ',') + TT(' ч', ' h') : mins + TT(' мин', ' min')) + TT(', даже когда тебя нет', ', even while you are away');
  D.text(bd, f.x + 84 * S, by + 33 * S, D.fitText(bd, w - 110 * S, 10.5 * S), '#5a6385', 'left');
  var bw2 = (w - 110 * S - 6 * S) / 2;
  a.button('bkTake', f.x + 84 * S, by + 44 * S, bw2, 36 * S, { modal: true, enabled: bn > 0, r: 9 * S, c1: '#4cc77d', c2: COL.greenD, label: TT('Забрать', 'Collect') + (bn ? ' +' + bn : ''), px: 13 * S, fn: function () { bankTake(1); } });
  a.button('bkAd', f.x + 84 * S + bw2 + 6 * S, by + 44 * S, bw2, 36 * S, { modal: true, enabled: bn > 0, r: 9 * S, c1: '#9a7ce8', c2: COL.purpleD, fn: function () { Z.SDK.rewarded(function () { m.rew = true; }, function () { Z.lastReward = Z.time; if (m.rew) { m.rew = false; bankTake(2); } }); },
    draw: function (x, y, bw, bh) { D.adIcon(x + 20 * S, y + bh / 2 - 4 * S, 7 * S); D.text(T('ad'), x + 20 * S, y + bh / 2 + 9 * S, Math.max(8, D.fitText(T('ad'), 32 * S, 8.5 * S)), '#fff', 'center', 'middle', 2 * S); D.text('x2' + (bn ? '  +' + bn * 2 : ''), x + bw / 2 + 10 * S, y + bh / 2, 13 * S, '#fff', 'center', 'middle', 3 * S); } });
  // задания
  var y0 = by + bhh + 10 * S, done = 0;
  qs.forEach(function (x, i) {
    var ry = y0 + i * (rh + 6 * S), have = Math.min(x.need, prog(x)), got = !!q.got[x.id], ready = !got && have >= x.need; if (got) done++;
    D.rr(f.x + 12 * S, ry, w - 24 * S, rh, 10 * S); ctx.fillStyle = got ? '#e6f6e9' : COL.panelD; ctx.fill();
    var nm = Z.LANG === 'en' ? x.en : x.ru, bw = 92 * S;
    D.text(nm, f.x + 22 * S, ry + rh * 0.34, D.fitText(nm, w - 60 * S - bw, 13 * S), OL, 'left');
    var pw = w - 62 * S - bw - 40 * S; D.rr(f.x + 22 * S, ry + rh * 0.62, pw, 8 * S, 4 * S); ctx.fillStyle = '#c9cfdc'; ctx.fill(); D.rr(f.x + 22 * S, ry + rh * 0.62, pw * have / x.need, 8 * S, 4 * S); ctx.fillStyle = got ? '#4cc77d' : '#3fb6e6'; ctx.fill();
    D.text(have + '/' + x.need, f.x + 22 * S + pw + 6 * S, ry + rh * 0.62 + 4 * S, Math.max(11, 12 * S), OL, 'left');   // 2.10.3: счётчик рядом с полоской, читаемым шрифтом
    if (got) { D.text('✓', f.x + w - 20 * S - bw / 2, ry + rh / 2, 18 * S, COL.greenD); return; }
    a.button('dq_' + x.id, f.x + w - 20 * S - bw, ry + 8 * S, bw, rh - 14 * S, { modal: true, enabled: ready, pulse: ready, c1: '#ffd54a', c2: COL.goldD, r: 9 * S,
      fn: function () { q.got[x.id] = 1; Z.save.flakes += Q_RW; Z.AU.sfx('reward'); Z.persist(true); },
      draw: function (bx, byy, bww, bh) { D.flakeIcon(bx + 20 * S, byy + bh / 2, 8 * S); D.text('+' + Q_RW, bx + 34 * S, byy + bh / 2 + 1, 16 * S, '#fff', 'left', 'middle', 3 * S); } });
  });
  // награда за все три
  var cy = y0 + qs.length * (rh + 6 * S) + 4 * S, all = done === qs.length;
  if (q.all) D.text(TT('Все задания выполнены. Новые — завтра!', 'All done. New quests tomorrow!'), f.x + w / 2, cy + 26 * S, D.fitText(TT('Все задания выполнены. Новые — завтра!', 'All done. New quests tomorrow!'), w - 40 * S, 14 * S), COL.greenD);
  else a.button('dqAll', f.x + 22 * S, cy, w - 44 * S, 54 * S, { modal: true, enabled: all, pulse: all, c1: '#ff7a7f', c2: COL.redD,
    fn: function () { q.all = 1; var tq = Z.randomToy ? Z.randomToy() : null; if (tq) { Z.giveToy(tq); } else { Z.save.flakes += 5; UI.toast('+5 ' + TT('снежинок', 'snowflakes'), '#9fdcff'); } Z.AU.sfx('reward'); Z.persist(true); },
    draw: function (bx, byy, bw, bh) { D.gift(bx + 30 * S, byy + bh / 2 + 2 * S, 14 * S); var l = all ? TT('Забрать сундук с игрушкой', 'Claim the ornament chest') : TT('Все три задания — сундук с игрушкой', 'All three quests — an ornament chest'); D.text(l, bx + 50 * S + (bw - 60 * S) / 2, byy + bh / 2, D.fitText(l, bw - 70 * S, 15 * S), '#fff', 'center', 'middle', 3 * S); } });
  a.closeX(f);
};
M.gifts = function (m, w, a) {
  ensureDay();
  var S = a.S, cal = Z.save.daily !== Z.todayStr(), adg = !!UI._adGiftReady, qn = questReady() + (bankNow() > 0 ? 1 : 0);
  var rows = [
    [Z.calDone && Z.calDone() ? TT('Подарок дня', 'Daily gift') : TT('Новогодний календарь', 'New Year calendar'), cal ? TT('Сегодня есть окошко!', 'A window is waiting!') : TT('Следующее окошко — завтра', 'Next window tomorrow'), cal, 'daily', function (x, y, r) { D.gift(x, y, r); }],
    [TT('Подарок под ёлкой', 'Gift under the tree'), adg ? TT('Игрушка за просмотр рекламы', 'An ornament for watching an ad') : TT('Скоро появится новый', 'A new one is coming soon'), adg, 'adGift', function (x, y, r) { Z.drawToy('ball_r', x, y, r * 0.8, Z.time); }],
    [TT('Задания и копилка', 'Quests & bank'), qn ? TT('Есть награды!', 'Rewards are ready!') : TT('Три задания на сегодня', 'Three quests for today'), qn > 0, 'quests', function (x, y, r) { scroll(x, y, r * 0.8); }]
  ], rh = 74 * S, f = a.frame(w, 60 * S + rows.length * (rh + 8 * S) + 8 * S, TT('Подарки', 'Gifts'));
  rows.forEach(function (r, i) {
    var ry = f.y + 46 * S + i * (rh + 8 * S);
    a.button('gf' + i, f.x + 16 * S, ry, w - 32 * S, rh, { modal: true, r: 14 * S, pulse: r[2], c1: r[2] ? '#fff3c4' : '#fdf7ec', c2: r[2] ? COL.goldD : COL.panelD, fn: function () { UI.closeModal(); UI.openModal({ type: r[3] }); },
      draw: function (bx, by, bw, bh) { r[4](bx + 38 * S, by + bh / 2, 20 * S); D.text(r[0], bx + 72 * S, by + bh * 0.36, D.fitText(r[0], bw - 110 * S, 17 * S), OL, 'left'); D.text(r[1], bx + 72 * S, by + bh * 0.68, D.fitText(r[1], bw - 110 * S, 12.5 * S), r[2] ? '#b8860b' : '#6a7394', 'left'); D.text('›', bx + bw - 20 * S, by + bh / 2, 26 * S, OL); if (r[2]) a.badge(bx + bw - 44 * S, by + bh / 2, 9 * S); } });
  });
  a.closeX(f);
};
M.howto = function (m, w, a) {
  // 2.12.29: вместо сплошного абзаца — карточки: картинка + короткий заголовок + одна строка пояснения
  var S = a.S, W = a.W, H = a.H, c = a.ctx, t = Z.time;
  var R = [
    ['tw', TT('Ставь вышки', 'Build towers'), TT('на любую свободную клетку снега', 'on any free snow cell')],
    ['trap', TT('Баррикады и ловушки', 'Barricades & traps'), TT('ставь прямо на дорогу', 'go right on the road')],
    ['arrow', TT('Смотри на стрелки', 'Watch the arrows'), TT('они показывают, куда пойдут враги', 'they show where enemies will go')],
    ['up', TT('Улучшай и чини', 'Upgrade & repair'), TT('нажми на вышку', 'tap a tower')],
    ['merge', TT('Объединяй', 'Merge'), TT('перетащи на такую же вышку', 'drag a tower onto the same one')],
    ['moroz', TT('Веди Деда Мороза', 'Lead Grandfather Frost'), TT('нажми на него, потом — куда идти', 'tap him, then where to go')],
    ['skill', TT('Способности', 'Abilities'), TT('кнопки внизу экрана', 'buttons at the bottom — for tough moments')]
  ];
  var two = W > H * 1.15, cols = two ? 2 : 1, perCol = Math.ceil(R.length / cols);
  var cfs = Math.max(10, 11 * S), fw = two ? Math.min(W * 0.96, 820 * S) : w, cw = (fw - 36 * S - (cols - 1) * 10 * S) / cols;
  var cl = [], rh = 58 * S, gap = 6 * S;
  var fh = 46 * S + perCol * (rh + gap) + 6 * S + cl.length * cfs * 1.25 + 70 * S, k = Math.min(1, H * 0.94 / fh);
  if (k < 1) { rh *= k; gap *= k; fh = 46 * S + perCol * (rh + gap) + 6 * S + cl.length * cfs * 1.25 + 62 * S; }
  var f = a.frame(fw, fh, TT('Как играть', 'How to play'));
  var pic = function (id, x, y, r) {
    c.save();
    try {
      if (id === 'tw') D.tower({ type: 'snow', lvl: 1, recoil: 0, hp: 1, max: 1, c: 0, r: 0 }, x, y + r * 0.5, r * 1.9, t);
      else if (id === 'trap') { D.trap({ type: 'spike', t: 0, cd: 0 }, x - r * 0.25, y + r * 0.3, r * 1.6, t); c.fillStyle = '#b07a45'; D.rr(x + r * 0.05, y - r * 0.35, r * 0.75, r * 0.5, 3 * S); c.fill(); c.lineWidth = 2 * S; c.strokeStyle = OL; c.stroke(); c.beginPath(); c.moveTo(x + r * 0.1, y - r * 0.1); c.lineTo(x + r * 0.75, y - r * 0.1); c.stroke(); }
      else if (id === 'arrow') { for (var i = 0; i < 3; i++) { var ax = x - r * 0.55 + i * r * 0.5, ay = y + Math.sin(t * 3 + i) * 2 * S; c.beginPath(); c.moveTo(ax - r * 0.18, ay - r * 0.3); c.lineTo(ax + r * 0.15, ay); c.lineTo(ax - r * 0.18, ay + r * 0.3); c.lineWidth = r * 0.2; c.strokeStyle = '#e8484f'; c.lineCap = 'round'; c.lineJoin = 'round'; c.globalAlpha = 0.45 + 0.55 * ((i + Math.floor(t * 3)) % 3 === 2 ? 1 : 0.4); c.stroke(); } c.globalAlpha = 1; }
      else if (id === 'up') { D.tower({ type: 'snow', lvl: 3, recoil: 0, hp: 1, max: 1, c: 0, r: 0 }, x - r * 0.2, y + r * 0.5, r * 1.7, t); D.circ(x + r * 0.55, y - r * 0.45, r * 0.33, '#4cc77d', 2 * S); c.beginPath(); c.moveTo(x + r * 0.55, y - r * 0.62); c.lineTo(x + r * 0.55, y - r * 0.28); c.moveTo(x + r * 0.42, y - r * 0.5); c.lineTo(x + r * 0.55, y - r * 0.63); c.lineTo(x + r * 0.68, y - r * 0.5); c.strokeStyle = '#fff'; c.lineWidth = 2.5 * S; c.lineCap = 'round'; c.stroke(); }
      else if (id === 'merge') { var ph = (t * 0.8) % 1, mx = -r * 0.5 + Math.min(1, ph * 1.6) * r * 0.5; D.tower({ type: 'snow', lvl: 1, recoil: 0, hp: 1, max: 1, c: 0, r: 0 }, x + r * 0.32, y + r * 0.5, r * 1.4, t); c.globalAlpha = ph > 0.65 ? 0.3 : 0.9; D.tower({ type: 'snow', lvl: 1, recoil: 0, hp: 1, max: 1, c: 0, r: 0 }, x + mx - r * 0.1, y + r * 0.42, r * 1.4, t); c.globalAlpha = 1; }
      else if (id === 'moroz') D.ally('moroz', x, y + r * 0.75, r * 0.85, { dir: 1, walk: true });
      else if (id === 'skill') { D.circ(x, y, r * 0.75, '#dff3ff', 2.5 * S); D.flake(x, y, r * 0.5, '#3fb6e6', Math.max(2, r * 0.14)); }
    } catch (e) { }
    c.restore();
  };
  R.forEach(function (q, i) {
    var col = Math.floor(i / perCol), row = i % perCol, x = f.x + 18 * S + col * (cw + 10 * S), y = f.y + 42 * S + row * (rh + gap);
    D.rr(x, y, cw, rh, 12 * S); c.fillStyle = i % 2 ? '#f3ead9' : '#efe3cc'; c.fill();
    var pr = rh * 0.45, px = x + rh * 0.55; D.circ(px, y + rh / 2, pr, '#ffffff'); c.save(); c.beginPath(); c.arc(px, y + rh / 2, pr, 0, 7); c.clip(); pic(q[0], px, y + rh / 2, pr * 0.95); c.restore(); c.beginPath(); c.arc(px, y + rh / 2, pr, 0, 7); c.lineWidth = 2 * S; c.strokeStyle = 'rgba(27,36,72,0.25)'; c.stroke();
    var tx = x + rh * 1.1 + 4 * S, tw = cw - (tx - x) - 10 * S;
    D.text(q[1], tx, y + rh * 0.34, Math.max(12, D.fitText(q[1], tw, 16.5 * S)), OL, 'left', 'middle');
    D.text(q[2], tx, y + rh * 0.7, Math.max(10.5, D.fitText(q[2], tw, 13 * S)), '#5a6385', 'left', 'middle');
  });
  a.bigBtn('hwok', f, f.y + f.h - 64 * S, TT('Понятно!', 'Got it!'), function () { UI.closeModal(); });
};
M.heroTry = function (m, w, a) {
  var S = a.S, t = m.hero, nm = T('al_' + t).split(' — ')[0], f = a.frame(w, 376 * S, nm);
  a.ctx.save(); a.ctx.globalAlpha = 0.35; a.ctx.translate(f.x + w / 2, f.y + 120 * S); a.ctx.rotate(Z.time * 0.5); for (var r = 0; r < 10; r++) { a.ctx.rotate(Math.PI / 5); D.poly([0, 0, -10 * S, -80 * S, 10 * S, -80 * S], '#ffe28a'); } a.ctx.restore();
  D.ally(t, f.x + w / 2, f.y + 160 * S, 44 * S * (UI.heroK && UI.heroK[t] ? Math.min(1.2, Math.max(0.8, UI.heroK[t])) : 1), { dir: 1, walk: true });
  var l = D.wrap(TT('Герой откроется на уровне ', 'This hero unlocks at level ') + (Z.ALLIES[t].unlock + 1) + TT('. Хочешь взять его в отряд на этот бой?', '. Want them in your squad for this battle?'), w - 44 * S, 14 * S);
  for (var i = 0; i < l.length; i++) D.text(l[i], f.x + w / 2, f.y + 186 * S + i * 18 * S, 14 * S, '#4a5378');
  a.adButton('htAd', f.x + 22 * S, f.y + f.h - 128 * S, w - 44 * S, 54 * S, TT('Взять на этот бой', 'Take for this battle'), function () {
    Z.SDK.rewarded(function () { m.rew = true; }, function () { Z.lastReward = Z.time; if (m.rew) { takeHero(t, m.idx); UI.closeModal(); } });
  });
  a.bigBtn('htNo', f, f.y + f.h - 66 * S, TT('Назад', 'Back'), function () { UI.closeModal(); }, '#5f74b8', '#43579a');
};
M.offer = function (m, w, a) {
  var S = a.S, f = a.frame(w, 380 * S, TT('Стартовый набор', 'Starter pack')), cx = f.x + w / 2;
  D.text(TT('Подарок для вашей ёлки — один раз', 'A gift for your tree — one time only'), cx, f.y + 44 * S, D.fitText(TT('Подарок для вашей ёлки — один раз', 'A gift for your tree — one time only'), w - 40 * S, 14 * S), '#4a5378');
  Z.drawToy('gold_nut', cx - 80 * S, f.y + 100 * S, 24 * S, Z.time); Z.drawToy('gold_fish', cx, f.y + 96 * S, 26 * S, Z.time); Z.drawToy('gold_egg', cx + 80 * S, f.y + 100 * S, 24 * S, Z.time);
  var rows = [TT('60 снежинок', '60 snowflakes'), TT('3 золотые игрушки', '3 golden ornaments'), TT('Гирлянда «Бегущая радуга»', 'Running Rainbow lights'), TT('Золотой Дед Мороз', 'Golden Grandfather Frost')];
  rows.forEach(function (s0, i) { D.star(f.x + 40 * S, f.y + 150 * S + i * 24 * S, 7 * S, COL.gold, 1.5); D.text(s0, f.x + 56 * S, f.y + 151 * S + i * 24 * S, D.fitText(s0, w - 90 * S, 14 * S), OL, 'left'); });
  var pr = Z.SDK27.priceOf('starter');
  a.bigBtn('ofBuy', f, f.y + f.h - 128 * S, TT('Купить за ', 'Buy for ') + pr, function () { Z.SDK27.buy('starter', function (ok) { if (ok) UI.closeModal(); }); }, '#4cc77d', COL.greenD);
  a.bigBtn('ofNo', f, f.y + f.h - 66 * S, TT('Не сейчас', 'Not now'), function () { UI.closeModal(); }, '#5f74b8', '#43579a');
};
})();

/* 2.7.4 · первые уровни без отряда (1–3): чтобы игра сразу «разговаривала», Снегурочка, Дед Мороз и еноты комментируют бой
   уже записанными репликами — подсказывают поставить пушку, торопят с волной, радуются победе. */
(function () {
'use strict';
var Z = window.Z, old = Z.banterTick;
Z.banterTick = function (G, dt) {
  if (old) old.apply(this, arguments);
  if (!G || G.idx > 2 || G.endless || G.trial || (G.squad && G.squad.length)) return;
  var v = G.v26; if (!v) return; var e = v.early || (v.early = { t: 0, idle: 0 });
  e.t += dt;
  var n = Object.keys(G.towers).length, waiting = G.phase === 'build' || G.phase === 'between';
  if (!e.hello && e.t > 1.2 && G.idx > 0) { e.hello = 1; Z.sayLine(G.L.type === 'escort' ? 'SNE-11' : 'MOR-02', 0.5); }
  e.idle = waiting ? e.idle + dt : 0;
  if (waiting && n === 0 && e.idle > 9 && !e.hint) { e.hint = 1; Z.sayLine('SNE-15', 0.4); }            // «Пока тихо, можно и пушку поставить. Намёк.»
  if (waiting && n > 0 && e.idle > 14 && !e.hurry && !(Z.sub && Z.sub.t > 0)) { e.hurry = 1; Z.sayLine('MOR-17', 0.7); }            // «Ну что, волну-то зовём? Я тут не молодею.»
  if (G.phase === 'wave' && !e.rac && G.enemies.length >= 2) { e.rac = 1; Z.sayLine(G.idx === 0 ? 'ENO-02' : 'ENO-01', 0.2); }
};
var oldKill = Z.hk.kill;
Z.hk.kill = function (en) {
  if (oldKill) oldKill.apply(this, arguments);
  var G = Z.G; if (!G || G.idx > 2 || (G.squad && G.squad.length) || !G.v26) return;
  var e = G.v26.early || (G.v26.early = { t: 0, idle: 0 }); e.k = (e.k || 0) + 1;
  if (e.k === 3 && en.type === 'raccoon') Z.sayLine('ENO-05', 0.2);                                       // «Блинский блин, шарики раскатились!»
};
var oldLost = Z.levelLost;
Z.levelLost = function () { var G = Z.G, first = G && G.phase !== 'lost', r = oldLost.apply(this, arguments); if (first && G && G.idx <= 2 && !(G.squad && G.squad.length)) Z.sayLine('MOR-16', 1); return r; };   // «Ничего. Новый год всё равно наступит. Давай ещё разок.»
var oldWon = Z.levelWon;
Z.levelWon = function () {
  var G = Z.G, first = G && G.phase !== 'won', r = oldWon.apply(this, arguments);
  if (first && G && G.idx <= 2 && !(G.squad && G.squad.length) && G.L.type !== 'escort') Z.sayLine('SNE-14', 1);   // «Победа! Это точно в сторис.»
  return r;
};
})();

/* 2.7.4 · незаметная помощь: после каждого поражения на уровне его враги становятся на 7% слабее (до −21%), пока уровень не пройден.
   Только обычная сложность, первые 20 уровней; героический и бесконечный режимы не трогаем. */
(function () {
'use strict';
var Z = window.Z;
if (Z.save.fails === undefined) Z.save.fails = {};
Z.assist = function (G) { if (!G || G.heroic || G.endless || G.trial || G.diff === 'heroic') return 1;   // 2.9: подмога после поражений — на всех уровнях
  var f = (Z.save.fails && Z.save.fails[G.idx]) || 0; return 1 - 0.07 * Math.min(3, f); };
var oL = Z.levelLost, oW = Z.levelWon;
Z.levelLost = function () { var G = Z.G, first = G && G.phase !== 'lost', r = oL.apply(this, arguments); if (first && G && !G.endless && !G.trial) { if (!Z.save.fails || typeof Z.save.fails !== 'object') Z.save.fails = {}; Z.save.fails[G.idx] = (Z.save.fails[G.idx] || 0) + 1; Z.persist(); } return r; };
Z.levelWon = function () { var G = Z.G, r = oW.apply(this, arguments); if (G && Z.save.fails && Z.save.fails[G.idx]) { delete Z.save.fails[G.idx]; Z.persist(); } return r; };
})();

/* 2.7.4 · мягче состав ранних волн (по прогонам ботов): на 2-м уровне быстрых сосулек не больше 3 за волну,
   на уровнях до 9-го Леших не больше 3 за волну — лишние заменяются енотами. Героический режим не трогаем. */
(function () {
'use strict';
var Z = window.Z, old = Z.makeWaves;
Z.makeWaves = function (info, heroic, L) {
  var w = old.apply(this, arguments);
  if (heroic || !w || !info) return w;
  var cap = info.idx === 1 ? { icicle: 3 } : info.idx <= 8 ? { leshy: 3 } : null;
  if (cap) w.forEach(function (wave) { var n = {}; (wave.list || []).forEach(function (s) { if (cap[s.type] === undefined) return; n[s.type] = (n[s.type] || 0) + 1; if (n[s.type] > cap[s.type]) s.type = 'raccoon'; }); });
  return w;
};
// 2.12.21: без лимита очков командования — враги крепче на 2 % за каждое очко отряда сверх прежнего лимита уровня, не больше чем на 15 %
// (прогоны бота на 9 уровнях: весь отряд без поправки — примерно как прежний лимит или чуть легче; с 6 % за очко — заметно тяжелее)
// (Белка и Колобок — 1 очко, Эскимо, Снегурочка, Василиса, Кот — 2, Дед Мороз, Емеля, Пломбир — 3)
Z.SQUAD_K = 0.02;
Z.squadExtra = function (G) { if (!Z.OKP_OFF || !G || !G.squad || G.trial || !Z.okLimitBase) return 0; var used = Z.okUsed(G.squad.map(function (U) { return U.type; })); return Math.max(0, used - Z.okLimitBase(G.endless ? 99 : G.idx)); };
var oAssist21 = Z.assist;
Z.assist = function (G) { var a = oAssist21 ? oAssist21.apply(this, arguments) : 1; return a * (1 + Math.min(0.15, Z.SQUAD_K * Z.squadExtra(G))); };
})();
