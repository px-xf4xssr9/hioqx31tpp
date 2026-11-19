/* 2.11.5 · Запасы, усиления, кнопка «купить снежинки», примерка облика в бою, жизни ёлке за рекламу.
   ЗАПАСЫ — штучные вещи для боя: Заморозка, Подарок-бабах, Сани Деда Мороза (это готовые заряды способностей:
   способность на перезарядке — нажми, и сработает сразу) и Аптечка (герой встаёт сразу, без ожидания).
   Берутся за снежинки, за рекламу (одна штука раз в 30 с, до 30 в день — чтобы реклама не была главным способом, п. 5.1.5.2 «е» правил ВК) и наборами за голоса.
   Пределов на бой нет — запас оплачен снежинками, временем на рекламу или голосами. У каждого запаса 3 уровня улучшения за снежинки
   (30/70/140): метель дольше, подарок сильнее и шире, сани больнее, аптечка ещё и лечит остальных героев — улучшение действует
   и на обычную способность.
   УСИЛЕНИЯ — постоянные, у каждого 3 уровня (за снежинки). Действуют только надетые: 3 места, 4-е и 5-е — за голоса.
   Защита от подделки: места за голоса и наборы выдаёт только наш сервер после оплаты (подпись ВК), и при каждом запуске
   игра сверяет с ним купленные места — вписанное в сохранение руками снимается. Счётчики запасов ограничены (не больше 99),
   а пределы на бой не дают «бесконечными» запасами пройти уровень. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, OL = D.OL || '#1b2448', COL = D.COL, TT = Z.TT || function (r, e) { return Z.LANG === 'en' ? e : r; };
var INV = [
  { id: 'blizzard', ru: 'Заморозка', en: 'Freeze', dru: 'Метель сразу, без перезарядки', den: 'Blizzard right away', fl: 8, cap: 2 },
  { id: 'bomb', ru: 'Подарок-бабах', en: 'Gift bomb', dru: 'Подарок сразу, без перезарядки', den: 'Gift bomb right away', fl: 8, cap: 2 },
  { id: 'santa', ru: 'Сани Деда Мороза', en: 'Santa\'s sleigh', dru: 'Сани сразу, без перезарядки', den: 'Sleigh right away', fl: 15, cap: 1 },
  { id: 'medkit', ru: 'Аптечка', en: 'First aid', dru: 'Упавший герой встаёт сразу', den: 'A fallen hero is back at once', fl: 10, cap: 2 }
];
var BUFFS = [
  { id: 'dmg', ru: 'Острый снег', en: 'Sharp snow', v: [0.06, 0.12, 0.18], f: function (v) { return '+' + Math.round(v * 100) + '% ' + TT('урона вышек', 'tower damage'); } },
  { id: 'coin', ru: 'Казна', en: 'Treasury', v: [40, 80, 120], f: function (v) { return '+' + v + ' ' + TT('монет на старте', 'starting coins'); } },
  { id: 'tree', ru: 'Крепкая ёлка', en: 'Sturdy tree', v: [2, 4, 6], f: function (v) { return '+' + v + ' ' + TT('жизней ёлки', 'tree lives'); } },
  { id: 'hero', ru: 'Богатыри', en: 'Mighty heroes', v: [0.1, 0.2, 0.3], f: function (v) { return '+' + Math.round(v * 100) + '% ' + TT('здоровья героев', 'hero health'); } },
  { id: 'cd', ru: 'Быстрые чары', en: 'Quick magic', v: [0.08, 0.16, 0.24], f: function (v) { return '−' + Math.round(v * 100) + '% ' + TT('перезарядки', 'cooldowns'); } },
  { id: 'cost', ru: 'Мастера', en: 'Craftsmen', v: [0.04, 0.08, 0.12], f: function (v) { return '−' + Math.round(v * 100) + '% ' + TT('цены вышек', 'tower price'); } }
];
var BCOST = [40, 80, 150], UCOST = [30, 70, 140], INV_MAX = 999, AD_CD = 30000, AD_DAY = 30;
var IB = {}; INV.forEach(function (q) { IB[q.id] = q; }); var BB = {}; BUFFS.forEach(function (q) { BB[q.id] = q; });
Z.INV = INV; Z.BUFFS = BUFFS;
// улучшения запасов (и самих способностей): 3 уровня за снежинки
var UPK = { blizzard: [1, 1.25, 1.5, 1.75], bomb: [1, 1.25, 1.5, 1.8], santa: [1, 1.2, 1.4, 1.6], medkit: [0, 0.3, 0.6, 1] };
function supLvl(id) { var u = Z.save && Z.save.inv && Z.save.inv.up; return u ? Math.max(0, Math.min(3, +u[id] || 0)) : 0; }
Z.supK = function (id) { return UPK[id][supLvl(id)]; };
function upTxt(id, l) {
  var k = UPK[id][l];
  if (id === 'blizzard') return TT('Метель ', 'Blizzard ') + String(Math.round(6 * k * 10) / 10).replace('.', ',') + TT(' с', ' s');
  if (id === 'bomb') return TT('Урон и размах ', 'Power and reach ') + Math.round(k * 100) + '%';
  if (id === 'santa') return TT('Урон саней ', 'Sleigh damage ') + Math.round(k * 100) + '%';
  return k ? TT('Лечит остальных героев на ', 'Also heals the others by ') + Math.round(k * 100) + '%' : TT('Упавший герой встаёт сразу', 'A fallen hero is back at once');
}
function upVal(id, l) { var k = UPK[id][l]; return id === 'blizzard' ? String(Math.round(6 * k * 10) / 10).replace('.', ',') + TT(' с', ' s') : Math.round(k * 100) + '%'; }
function upLine(id, l) {   // «сейчас → после улучшения»
  if (l >= 3) return upTxt(id, l);
  if (id === 'medkit') return l ? upTxt(id, l) + ' → ' + upVal(id, l + 1) : TT('Встаёт сразу; улучшение — ещё и лечит остальных', 'Instant revive; upgrade also heals the others');
  return upTxt(id, l) + ' → ' + upVal(id, l + 1);
}

function fix() {
  var s = Z.save; if (!s) return;
  if (!s.inv || typeof s.inv !== 'object') s.inv = {};
  if (!s.inv.up || typeof s.inv.up !== 'object') s.inv.up = {};
  INV.forEach(function (q) { var n = +s.inv[q.id] || 0; s.inv.up[q.id] = Math.max(0, Math.min(3, Math.floor(+s.inv.up[q.id] || 0))); s.inv[q.id] = Math.max(0, Math.min(INV_MAX, Math.floor(n))); });
  if (!s.inv.ad || typeof s.inv.ad !== 'object') s.inv.ad = { d: '', n: 0, t: 0 };
  if (!s.buffs || typeof s.buffs !== 'object') s.buffs = { lvl: {}, on: [] };
  if (!s.buffs.lvl) s.buffs.lvl = {}; if (!Array.isArray(s.buffs.on)) s.buffs.on = [];
  BUFFS.forEach(function (b) { var l = +s.buffs.lvl[b.id] || 0; s.buffs.lvl[b.id] = Math.max(0, Math.min(3, Math.floor(l))); });
  var sl = slots(); s.buffs.on = s.buffs.on.filter(function (id, i, a) { return BB[id] && s.buffs.lvl[id] > 0 && a.indexOf(id) === i; }).slice(0, sl);
}
function slots() { var sh = (Z.save && Z.save.shop) || {}; return 3 + (sh.slot4 ? 1 : 0) + (sh.slot5 ? 1 : 0); }
Z.buffSlots = slots;
function snd(n, v) { try { Z.AU.sfx(n, v || 0.7); } catch (e) { if (window.__rep) window.__rep(e); } }
function toast(t, c) { if (UI.toast) UI.toast(t, c || '#9fdcff'); }

// ================= бой =================
var oStart = Z.startLevel;
Z.startLevel = function () {
  var r = oStart.apply(this, arguments), G = Z.G; fix();
  if (!G) return r;
  G.invUsed = {}; G.buffs = {};
  if (!G.endless || true) Z.save.buffs.on.forEach(function (id) { var l = Z.save.buffs.lvl[id]; if (l > 0) G.buffs[id] = BB[id].v[l - 1]; });
  if (G.buffs.coin) G.coins += G.buffs.coin;
  if (G.buffs.tree && G.L.type !== 'escort') { G.hpMax += G.buffs.tree; G.hp = G.hpMax; }
  // примерка облика: действует один бой
  Z.trialSkin = null;
  if (Z.save.trial && Z.save.trial.h) { Z.trialSkin = Z.save.trial; Z.save.trial = null; Z.persist && Z.persist(); }
  return r;
};
var oStat = Z.towerStat;
if (oStat) Z.towerStat = function () { var s = oStat.apply(this, arguments), G = Z.G; if (s && G && G.buffs && G.buffs.dmg && Z.ui.screen === 'level') s.dmg *= 1 + G.buffs.dmg; return s; };
var oCost = Z.towerCost;
Z.towerCost = function (type, lvl) { var c = oCost.apply(this, arguments), G = Z.G; return G && G.buffs && G.buffs.cost && Z.ui.screen === 'level' ? Math.round(c * (1 - G.buffs.cost)) : c; };
var oCd = Z.skillCd;
Z.skillCd = function (id) { var c = oCd.apply(this, arguments), G = Z.G; return G && G.buffs && G.buffs.cd ? c * (1 - G.buffs.cd) : c; };
var oUpd = Z.update;
Z.update = function (dt) {
  oUpd.apply(this, arguments);
  var G = Z.G; if (!G || !G.buffs) return;
  if (G.buffs.hero) (G.squad || []).forEach(function (U) { if (U._bf) return; U._bf = 1; U.max = Math.round(U.max * (1 + G.buffs.hero)); U.hp = Math.min(U.max, Math.round(U.hp * (1 + G.buffs.hero))); });
};
// заряд способности из запаса: способность на перезарядке — нажатие тратит одну штуку и она срабатывает сразу
Z.invLeft = function (id) { fix(); return Z.G ? Z.save.inv[id] || 0 : 0; };   // без предела на бой: запас оплачен временем или деньгами
Z.invUse = function (id) {
  var G = Z.G; if (!G || !(G.phase === 'wave' || G.phase === 'escortRun' || G.phase === 'between')) return false;
  if (Z.invLeft(id) <= 0) return false;
  Z.save.inv[id]--; if (G.skills && id in G.skills) G.skills[id] = 0;
  snd('reward', 0.6); Z.persist && Z.persist(); return true;
};
Z.invBadge = function (id, cx, cy, r) {
  var n = Z.invLeft(id); if (n <= 0) return;
  var S = UI.api().S || 1, w = r * 0.95, h = r * 0.55, x = cx - r * 1.05, y = cy + r * 0.45;
  D.rr(x, y, w, h, h / 2); D.ctx.fillStyle = '#4cc77d'; D.ctx.fill(); D.ctx.lineWidth = Math.max(1.5, 2 * S); D.ctx.strokeStyle = OL; D.ctx.stroke();
  D.text('×' + n, x + w / 2, y + h / 2 + 0.5, h * 0.78, '#fff', 'center', 'middle', 2 * S);
};
// аптечка над упавшим героем (или «встать за рекламу» — раз за волну)
var oSquad = UI.drawSquadBar;
UI.drawSquadBar = function () {
  oSquad.apply(this, arguments);
  var G = Z.G; if (!G || UI.screen !== 'level' || !UI.portRects || UI.modal) return;
  var A = UI.api(), S = A.S || 1, L = UI.L;
  UI.portRects.forEach(function (p, i) {
    var U = p.U; if (!U.dead || U.respawn < 1.5) return;
    var have = Z.invLeft('medkit') > 0, adOk = !have && !(G.medAd && G.medAd[G.wave]) && Z.SDK && Z.SDK.rewarded;
    if (!have && !adOk) return;
    var bs = Math.max(30 * S, p.w * 0.7), bx = L.portrait ? p.x + (p.w - bs) / 2 : p.x + p.w + 6 * S, by = L.portrait ? p.y - bs - 8 * S : p.y + (p.h - bs) / 2;
    A.button('med' + i, bx, by, bs, bs, { r: bs * 0.3, pulse: true, c1: have ? '#ffffff' : '#9a7ce8', c2: have ? COL.panelD : COL.purpleD,
      fn: function () {
        if (have) { if (Z.invLeft('medkit') <= 0) return; Z.save.inv.medkit--; U.respawn = 0.05; var hk = Z.supK('medkit'); if (hk) (G.squad || []).forEach(function (V) { if (!V.dead) V.hp = Math.min(V.max, V.hp + V.max * hk); }); snd('levelup', 0.7); Z.persist && Z.persist(); return; }
        Z.SDK.rewarded(function () { G.medAd = G.medAd || {}; G.medAd[G.wave] = 1; U.respawn = 0.05; snd('levelup', 0.7); }, function () { Z.lastReward = Z.time; });
      },
      draw: function (x, y, w, h) {
        var cx = x + w / 2, cy = y + h / 2 - 1, k = w * 0.2;
        if (have) { D.rr(cx - k * 1.5, cy - k * 1.2, k * 3, k * 2.4, k * 0.5); D.ctx.fillStyle = '#ff5a6a'; D.ctx.fill(); D.ctx.fillStyle = '#fff'; D.ctx.fillRect(cx - k * 0.25, cy - k * 0.85, k * 0.5, k * 1.7); D.ctx.fillRect(cx - k * 0.85, cy - k * 0.25, k * 1.7, k * 0.5); var pw = w * 0.62, ph2 = w * 0.36; D.rr(x + w - pw * 0.55, y + h - ph2 * 0.9, pw, ph2, ph2 / 2); D.ctx.fillStyle = '#4cc77d'; D.ctx.fill(); D.ctx.lineWidth = Math.max(1.2, 1.6 * S); D.ctx.strokeStyle = OL; D.ctx.stroke(); D.text('×' + Z.invLeft('medkit'), x + w - pw * 0.55 + pw / 2, y + h - ph2 * 0.9 + ph2 / 2 + 0.5, ph2 * 0.78, '#fff', 'center', 'middle', 1.5 * S); }
        else { D.adIcon(cx, cy - k * 0.3, k * 0.9); D.text('+', cx, cy + k * 1.1, k * 1.2, '#fff', 'center', 'middle', 2 * S); }
      } });
  });
};

// ================= примерка облика в бою =================
var oSkin = Z.heroSkin;
if (oSkin) Z.heroSkin = function (t) {
  var tr = Z.trialSkin; if (!tr || tr.h !== t || !Z.G || Z.ui.screen !== 'level') return oSkin.apply(this, arguments);
  var sk = Z.save.skins, k = t + ':' + tr.s, so = sk.own[k], sv = sk.on[t]; sk.own[k] = 1; sk.on[t] = tr.s;
  try { return oSkin.apply(this, arguments); } finally { if (so) sk.own[k] = so; else delete sk.own[k]; if (sv === undefined) delete sk.on[t]; else sk.on[t] = sv; }
};
Z.startTrial = function (h, s) {
  Z.SDK.rewarded(function () { Z._trialOk = 1; }, function () { Z.lastReward = Z.time; if (!Z._trialOk) return; Z._trialOk = 0; Z.save.trial = { h: h, s: s }; Z.persist && Z.persist(true); snd('reward');
    toast(TT('Облик будет на герое в следующем бою — возьми его в отряд!', 'The look is on for your next battle — take the hero along!'), '#9dff6a'); });
};
// после боя с примеркой — предложить оставить облик
var oMap = UI.goMap;
UI.goMap = function () {
  var tr = Z.trialSkin, r = oMap.apply(this, arguments);
  if (tr) { Z.trialSkin = null; if (!(Z.save.skins.own[tr.h + ':' + tr.s])) setTimeout(function () { UI.openModal({ type: 'trialOffer', h: tr.h, s: tr.s }); }, 400); }
  return r;
};

// ================= «не хватает снежинок» → окно покупки =================
var oToast = UI.toast;
UI.toast = function (txt) {
  if (txt === TT('Не хватает снежинок', 'Not enough snowflakes') && UI.modal && UI.modal.type !== 'needFl') { Z.needFlakes(); return; }
  return oToast.apply(this, arguments);
};
Z.needFlakes = function (need) {
  var back = UI.modal; UI.modal = null; UI.openModal({ type: 'needFl', back: back, need: need });
};

// ================= окна =================
function invIcon(id, x, y, r) {
  var c = D.ctx;
  if (id === 'blizzard') { D.flake(x, y, r * 0.9, OL, r * 0.34); D.flake(x, y, r * 0.9, '#5ac8ff', r * 0.17); }
  else if (id === 'bomb') D.gift(x, y + r * 0.2, r * 0.8, COL.red);
  else if (id === 'santa') { c.save(); c.translate(x, y + r * 0.45); D.sleigh(0, 0, r * 0.62, 1, 0, 0); c.restore(); }
  else { var k = r * 0.45; D.rr(x - k * 1.6, y - k * 1.3, k * 3.2, k * 2.6, k * 0.5); c.fillStyle = '#ff5a6a'; c.fill(); c.lineWidth = Math.max(1.5, r * 0.08); c.strokeStyle = OL; c.stroke(); c.fillStyle = '#fff'; c.fillRect(x - k * 0.28, y - k * 0.9, k * 0.56, k * 1.8); c.fillRect(x - k * 0.9, y - k * 0.28, k * 1.8, k * 0.56); }
}
Z.invIcon = invIcon;
function buffIcon(id, x, y, r, on) {
  var c = D.ctx, col = on ? '#ffd54a' : '#c9cfdc';
  D.circ(x, y, r, on ? '#fff3c4' : '#eef1f7', Math.max(1.5, r * 0.08));
  if (id === 'dmg') { D.flake(x, y, r * 0.62, OL, r * 0.22); D.flake(x, y, r * 0.62, '#5ac8ff', r * 0.11); D.poly([x + r * 0.2, y - r * 0.75, x + r * 0.55, y - r * 0.2, x + r * 0.3, y - r * 0.2, x + r * 0.5, y + r * 0.35, x + r * 0.05, y - r * 0.3, x + r * 0.3, y - r * 0.3], '#ffd54a', 1); }
  else if (id === 'coin') { D.circ(x, y + r * 0.12, r * 0.5, '#ffd54a', Math.max(1.2, r * 0.07)); D.star(x, y + r * 0.12, r * 0.26, '#fff3a0', 0); D.circ(x - r * 0.25, y - r * 0.32, r * 0.3, '#ffe27a', Math.max(1, r * 0.06)); }
  else if (id === 'tree') { D.pine(x, y + r * 0.62, r * 1.25, '#2f8f5b', true); D.text('+', x + r * 0.5, y - r * 0.45, r * 0.6, '#4cc77d', 'center', 'middle', 2); }
  else if (id === 'hero') { D.rr(x - r * 0.42, y - r * 0.5, r * 0.84, r * 1.0, r * 0.4); c.fillStyle = '#d8364a'; c.fill(); c.lineWidth = Math.max(1, r * 0.07); c.strokeStyle = OL; c.stroke(); c.fillStyle = '#fff'; c.fillRect(x - r * 0.08, y - r * 0.35, r * 0.16, r * 0.6); c.fillRect(x - r * 0.28, y - r * 0.12, r * 0.56, r * 0.16); }
  else if (id === 'cd') { c.beginPath(); c.arc(x, y, r * 0.55, -Math.PI / 2, Math.PI); c.lineWidth = r * 0.16; c.strokeStyle = '#9a7ce8'; c.stroke(); D.poly([x - r * 0.75, y - r * 0.05, x - r * 0.35, y - r * 0.05, x - r * 0.55, y + r * 0.3], '#9a7ce8'); D.circ(x, y, r * 0.12, OL); }
  else if (id === 'cost') { c.save(); c.translate(x, y); c.rotate(-0.6); D.rr(-r * 0.12, -r * 0.6, r * 0.24, r * 1.0, r * 0.08); c.fillStyle = '#a8784a'; c.fill(); c.lineWidth = Math.max(1, r * 0.07); c.strokeStyle = OL; c.stroke(); D.rr(-r * 0.42, -r * 0.75, r * 0.84, r * 0.32, r * 0.1); c.fillStyle = '#9aa3b8'; c.fill(); c.stroke(); c.restore(); }
}
Z.buffIcon = buffIcon;
function adReady() { fix(); var a = Z.save.inv.ad, today = Z.todayStr ? Z.todayStr() : ''; if (a.d !== today) { a.d = today; a.n = 0; } return a.n < AD_DAY && Date.now() - (a.t || 0) > AD_CD && !!(Z.SDK && Z.SDK.rewarded); }
function adWait() { var a = Z.save.inv.ad; return Math.max(0, Math.ceil((AD_CD - (Date.now() - (a.t || 0))) / 1000)); }

// вкладка магазина «Запасы»: запасы и усиления
Z.tabBoost = function (m, f, a, top, bot) {
  fix();
  var S = a.S, w = f.w, ctx = a.ctx, sub = m.sub || 'inv';
  var sw = Math.min(150 * S, (w - 44 * S) / 2);
  [['inv', TT('Запасы для боя', 'Battle supplies')], ['buff', TT('Усиления', 'Boosts')]].forEach(function (q, i) {
    var on = sub === q[0];
    a.button('bsub_' + q[0], f.x + w / 2 - sw - 4 * S + i * (sw + 8 * S), top, sw, 30 * S, { modal: true, r: 9 * S, c1: on ? '#4cc77d' : '#dfe7f7', c2: on ? COL.greenD : '#aab6d6', fn: function () { m.sub = q[0]; snd('select'); },
      draw: function (bx, by, bw, bh) { D.text(q[1], bx + bw / 2, by + bh / 2, D.fitText(q[1], bw - 10 * S, 13 * S), on ? '#fff' : OL, 'center', 'middle', on ? 2 * S : 0); } });
  });
  D.flakeIcon(f.x + w - 62 * S, top + 46 * S, 8 * S); D.text(Z.fmt ? Z.fmt(Z.save.flakes) : '' + Z.save.flakes, f.x + w - 50 * S, top + 47 * S, 16 * S, OL, 'left');
  var y0 = top + 66 * S;
  if (sub === 'inv') {
    var lowH0 = (bot - top - 66 * S) < 300 * S && w > 560 * S;
    if (!lowH0) { var HT = D.fitLines(TT('Способность на перезарядке — нажми, сработает запас. Улучшение усиливает и саму способность', 'Tap a skill on cooldown to use a supply. Upgrades boost the skill itself too'), w - 110 * S, 11.5 * S, 9.5, 2); HT.lines.forEach(function (ln, li) { D.text(ln, f.x + 18 * S, top + 47 * S + (li - (HT.lines.length - 1) / 2) * HT.px * 1.15, HT.px, '#5a6b8f', 'left'); }); }
    var lowH = (bot - y0) < 300 * S && w > 560 * S, packH = lowH ? 0 : 64 * S, avail = bot - y0 - packH - 10 * S, cols = (avail / INV.length < 76 * S && w > 560 * S) ? 2 : 1, rowsN = Math.ceil(INV.length / cols), rh = Math.min(104 * S, avail / rowsN - 6 * S), cw = (w - 28 * S - (cols - 1) * 8 * S) / cols, ar = adReady();   // 2.11.5: телефон лёжа — карточки в две колонки
    INV.forEach(function (q, i) {
      var cx = f.x + 14 * S + (i % cols) * (cw + 8 * S), ry = y0 + Math.floor(i / cols) * (rh + 6 * S); D.rr(cx, ry, cw, rh, 12 * S); ctx.fillStyle = COL.panelD; ctx.fill();
      invIcon(q.id, cx + rh * 0.5, ry + rh / 2, rh * 0.3);
      var bw = Math.min(70 * S, cw * 0.2), tx = cx + rh + 2 * S, tw = cw - rh - bw * 2 - 22 * S, nm = Z.LANG === 'en' ? q.en : q.ru, ds = Z.LANG === 'en' ? q.den : q.dru;
      D.text(nm + '  ×' + (Z.save.inv[q.id] || 0), tx, ry + rh * 0.24, D.fitText(nm + '  ×' + (Z.save.inv[q.id] || 0), tw, 14 * S), OL, 'left');
      var ul = supLvl(q.id); ds = upLine(q.id, ul);
      var F2 = D.fitLines ? D.fitLines(ds, tw, 11 * S, 9, 2) : { lines: [ds], px: 10 }; F2.lines.forEach(function (ln, li) { D.text(ln, tx, ry + rh * 0.5 + li * F2.px * 1.15, F2.px, '#5a6385', 'left'); });
      for (var p0 = 0; p0 < 3; p0++) D.star(tx + 6 * S + p0 * 13 * S, ry + rh * 0.82, 5.5 * S, p0 < ul ? COL.gold : '#c9cfdc', 1);
      var bh0 = Math.min(40 * S, rh * 0.42), bx = cx + cw - 4 * S - bw * 2 - 6 * S, by = ry + 6 * S, full = Z.save.inv[q.id] >= INV_MAX;
      (function () { var umax = ul >= 3, uc = umax ? 0 : UCOST[ul], ut = umax ? TT('Улучшено полностью', 'Fully upgraded') : TT('Улучшить ', 'Upgrade ') + uc;
        a.button('ivup_' + q.id, bx, ry + rh - 6 * S - Math.min(32 * S, rh * 0.34), bw * 2 + 6 * S, Math.min(32 * S, rh * 0.34), { modal: true, r: 9 * S, enabled: !umax, c1: '#ffb04a', c2: '#d9822a',
          fn: function () { if (Z.save.flakes < uc) { Z.needFlakes(uc); return; } Z.save.flakes -= uc; Z.save.inv.up[q.id] = ul + 1; snd('levelup'); Z.persist(true); toast((Z.LANG === 'en' ? q.en : q.ru) + ': ' + upTxt(q.id, ul + 1), '#9dff6a'); },
          draw: function (x, y, bw2, bh2) { var fs = D.fitText(ut, bw2 - 26 * S, 12.5 * S); D.text(ut, x + bw2 / 2 - (umax ? 0 : 7 * S), y + bh2 / 2 - 1, fs, '#fff', 'center', 'middle', 2 * S); if (!umax) D.flakeIcon(x + bw2 / 2 + D.mw(ut, fs) / 2 + 2 * S, y + bh2 / 2 - 1, 6 * S); } }); })();
      a.button('ivfl_' + q.id, bx, by, bw, bh0, { modal: true, r: 10 * S, enabled: !full, c1: '#3fb6e6', c2: '#2a8bbd',
        fn: function () { if (Z.save.flakes < q.fl) { Z.needFlakes(q.fl); return; } Z.save.flakes -= q.fl; Z.save.inv[q.id]++; snd('buy'); Z.persist(true); },
        draw: function (x, y, bw2, bh2) { D.flakeIcon(x + bw2 / 2 - 12 * S, y + bh2 / 2 - 2 * S, 7 * S); D.text('' + q.fl, x + bw2 / 2 - 2 * S, y + bh2 / 2 - 1 * S, 15 * S, '#fff', 'left', 'middle', 2 * S); } });
      a.button('ivad_' + q.id, bx + bw + 6 * S, by, bw, bh0, { modal: true, r: 10 * S, enabled: ar && !full, c1: '#9a7ce8', c2: COL.purpleD,
        fn: function () { Z.SDK.rewarded(function () { m.rw = q.id; }, function () { Z.lastReward = Z.time; if (m.rw === q.id) { m.rw = null; var A0 = Z.save.inv.ad; A0.n++; A0.t = Date.now(); Z.save.inv[q.id] = Math.min(INV_MAX, Z.save.inv[q.id] + 1); snd('reward'); Z.persist(true); } }); },
        draw: function (x, y, bw2, bh2) { if (ar) { D.adIcon(x + bw2 / 2 - 12 * S, y + bh2 / 2 - 1 * S, 8 * S); D.text('+1', x + bw2 / 2 + 10 * S, y + bh2 / 2, 14 * S, '#fff', 'center', 'middle', 2 * S); } else { var wt = adWait(); D.text(Z.save.inv.ad.n >= AD_DAY ? TT('завтра', 'tomorrow') : Math.floor(wt / 60) + ':' + ('0' + wt % 60).slice(-2), x + bw2 / 2, y + bh2 / 2, 12 * S, '#fff', 'center', 'middle', 2 * S); } } });
    });
    // набор запасов за голоса (в низком окне — маленькими кнопками в строке подсказки)
    var py = lowH ? top + 36 * S : y0 + rowsN * (rh + 6 * S) + 4 * S, pw2 = lowH ? Math.min(190 * S, (w - 150 * S) / 2) : (w - 36 * S) / 2;
    if (lowH) packH = 30 * S;
    var pw2x = pw2, pay = Z.PLAT === 'vk' && Z.SDK27 && Z.SDK27.payReady && Z.SDK27.payReady();
    [['supply', TT('Сундучок запасов', 'Supply box'), TT('по 3 каждого', '3 of each')], ['supply2', TT('Сундук запасов', 'Supply chest'), TT('по 10 каждого + 50 ❄', '10 of each + 50 ❄')]].forEach(function (q, i) {
      a.button('ivp_' + q[0], f.x + 14 * S + i * (pw2x + 8 * S), py, pw2x, packH - (lowH ? 2 : 6) * S, { modal: true, r: 12 * S, enabled: !!pay, c1: '#ffd54a', c2: COL.goldD,
        fn: function () { Z.SDK27.buy(q[0]); },
        draw: function (x, y, bw2, bh2) { if (bh2 < 34 * S) { var one = q[1] + ' · ' + Z.SDK27.priceOf(q[0]); D.text(one, x + bw2 / 2, y + bh2 / 2 - 1, D.fitText(one, bw2 - 8 * S, 12 * S), OL); return; } D.text(q[1], x + bw2 / 2, y + bh2 * 0.3, D.fitText(q[1], bw2 - 10 * S, 13.5 * S), OL); D.text(q[2] + ' · ' + Z.SDK27.priceOf(q[0]), x + bw2 / 2, y + bh2 * 0.66, D.fitText(q[2] + ' · ' + Z.SDK27.priceOf(q[0]), bw2 - 10 * S, 11.5 * S), '#7a5a10'); } });
    });
    return;
  }
  // усиления
  var sl = slots(), on = Z.save.buffs.on;
  D.text(TT('Надето: ', 'Equipped: ') + on.length + '/' + sl, f.x + 18 * S, top + 47 * S, 13 * S, '#5a6b8f', 'left');
  var nextSlot = !Z.save.shop.slot4 ? 'slot4' : !Z.save.shop.slot5 ? 'slot5' : null, payOk = Z.PLAT === 'vk' && Z.SDK27 && Z.SDK27.payReady && Z.SDK27.payReady();
  if (nextSlot) a.button('bslot', f.x + 120 * S, top + 36 * S, 150 * S, 24 * S, { modal: true, r: 8 * S, enabled: !!payOk, c1: '#ffd54a', c2: COL.goldD, fn: function () { Z.SDK27.buy(nextSlot); },
    draw: function (x, y, bw2, bh2) { var t = TT('+1 место · ', '+1 slot · ') + Z.SDK27.priceOf(nextSlot); D.text(t, x + bw2 / 2, y + bh2 / 2, D.fitText(t, bw2 - 8 * S, 12 * S), OL); } });
  var cols = w > 520 * S ? 3 : 2, gap = 8 * S, cw = (w - 28 * S - gap * (cols - 1)) / cols, rows = Math.ceil(BUFFS.length / cols), ch = Math.min(150 * S, (bot - y0 - gap * (rows - 1)) / rows);
  BUFFS.forEach(function (b, i) {
    var lvl = Z.save.buffs.lvl[b.id] || 0, eq = on.indexOf(b.id) >= 0, bx = f.x + 14 * S + (i % cols) * (cw + gap), by = y0 + Math.floor(i / cols) * (ch + gap);
    a.button('bf_' + b.id, bx, by, cw, ch - 40 * S, { modal: true, r: 12 * S, c1: eq ? '#4cc77d' : '#fdf7ec', c2: eq ? COL.greenD : COL.panelD,
      fn: function () { if (lvl <= 0) { toast(TT('Сначала открой усиление — кнопка ниже', 'Unlock it first — button below'), '#ffb84a'); return; } if (eq) { Z.save.buffs.on = on.filter(function (q) { return q !== b.id; }); snd('select'); Z.persist(); return; } if (on.length >= sl) { toast(nextSlot ? TT('Все места заняты — сними усиление или купи место', 'All slots are full — unequip one or buy a slot') : TT('Все места заняты — сними одно усиление', 'All slots are full — unequip one'), '#ffb84a'); snd('error'); return; } on.push(b.id); snd('select'); Z.persist(); },
      draw: function (x, y, bw2, bh2) {
        if (lvl <= 0) ctx.globalAlpha = 0.6;
        buffIcon(b.id, x + bh2 * 0.42, y + bh2 * 0.45, bh2 * 0.27, eq);
        var tx = x + bh2 * 0.8, tw2 = bw2 - bh2 * 0.8 - 6 * S, nm = Z.LANG === 'en' ? b.en : b.ru;
        D.text(nm, tx, y + bh2 * 0.28, D.fitText(nm, tw2, 13.5 * S), eq ? '#fff' : OL, 'left', 'middle', eq ? 2 * S : 0);
        var ds = b.f(b.v[Math.max(0, lvl - 1)]), F3 = D.fitLines(ds, tw2, 11 * S, 9, 2); F3.lines.forEach(function (ln, li) { D.text(ln, tx, y + bh2 * (F3.lines.length > 1 ? 0.48 : 0.55) + li * F3.px * 1.12, F3.px, eq ? '#eaffef' : '#5a6385', 'left'); });
        for (var p = 0; p < 3; p++) D.star(tx + 6 * S + p * 13 * S, y + bh2 * 0.8, 5.5 * S, p < lvl ? COL.gold : '#c9cfdc', 1);
        ctx.globalAlpha = 1;
        if (eq) D.text('✓', x + bw2 - 10 * S, y + 10 * S, 12 * S, '#fff', 'center', 'middle', 2 * S);
      } });
    var max = lvl >= 3, cost = max ? 0 : BCOST[lvl];
    a.button('bu_' + b.id, bx, by + ch - 36 * S, cw, 32 * S, { modal: true, r: 10 * S, enabled: !max, c1: '#3fb6e6', c2: '#2a8bbd',
      fn: function () { if (Z.save.flakes < cost) { Z.needFlakes(cost); return; } Z.save.flakes -= cost; Z.save.buffs.lvl[b.id] = lvl + 1; if (lvl === 0 && on.length < sl) on.push(b.id); snd('levelup'); Z.persist(true); },
      draw: function (x, y, bw2, bh2) { if (max) { D.text(TT('Максимум', 'Max'), x + bw2 / 2, y + bh2 / 2, 13 * S, '#fff', 'center', 'middle', 2 * S); return; } var t = (lvl ? TT('Улучшить ', 'Upgrade ') : TT('Открыть ', 'Unlock ')) + cost; var fs = D.fitText(t, bw2 - 26 * S, 13 * S); D.text(t, x + bw2 / 2 - 7 * S, y + bh2 / 2, fs, '#fff', 'center', 'middle', 2 * S); D.flakeIcon(x + bw2 / 2 + D.mw(t, fs) / 2 + 2 * S, y + bh2 / 2, 6 * S); } });
  });
};

var oCustom = UI.customModal;
UI.customModal = function (m, w) {
  if (m.type === 'needFl') { needFl(m, w, UI.api()); return true; }
  if (m.type === 'trialOffer') { trialOffer(m, w, UI.api()); return true; }
  return oCustom ? oCustom(m, w) : false;
};
function closeBack(m) { UI.closeModal(); if (m.back) { var b = m.back; m.back = null; if (UI.modal) UI.modalQ.unshift(b); else { b.t = 1; UI.modal = b; } } }
function needFl(m, w, a) {
  // 2.12.15б: крупно — сколько нужно, сколько есть и сколько не хватает; наборы снежинок видны всегда (пока оплата не готова — серые), подходящий отмечен «Хватит»
  var S = a.S, pay = !!(Z.platHas && Z.platHas('pay') && Z.SDK27 && (Z.PLAT === 'vk' || Z.PLAT === 'yandex')), ready = !!(pay && Z.SDK27.payReady && Z.SDK27.payReady()), packs = pay ? ['fl30', 'fl100', 'fl250'] : [], ar = Z.SDK && Z.SDK.rewarded && Date.now() - (Z.save.shop.adFl || 0) > 3 * 60000;
  var have = Z.save.flakes, need = m.need || 0, miss = Math.max(0, need - have), fit = null;
  packs.forEach(function (id) { var P = (Z.PRODUCTS || []).filter(function (p) { return p.id === id; })[0]; if (P && !fit && P.fl >= miss) fit = id; });
  var f = a.frame(w, 140 * S + packs.length * 58 * S + (ar ? 58 * S : 0) + 58 * S, TT('Не хватает снежинок', 'Not enough snowflakes')), cx = f.x + w / 2;
  if (need) {
    var t1 = TT('Нужно ', 'Need ') + need + TT('  ·  у тебя ', '  ·  you have ') + have, fs1 = D.fitText(t1, w - 60 * S, 15 * S);
    D.text(t1, cx - 8 * S, f.y + 42 * S, fs1, '#5a6385'); D.flakeIcon(cx - 8 * S + D.mw(t1, fs1) / 2 + 10 * S, f.y + 42 * S, 7 * S);
    var t2 = TT('Не хватает ', 'Short by ') + miss, fs2 = D.fitText(t2, w - 80 * S, 24 * S);
    D.text(t2, cx - 12 * S, f.y + 70 * S, fs2, '#e8484f', 'center', 'middle', 0); D.flakeIcon(cx - 12 * S + D.mw(t2, fs2) / 2 + 16 * S, f.y + 70 * S, 11 * S);
  } else { var t0 = TT('У тебя ', 'You have ') + have; D.text(t0, cx - 8 * S, f.y + 56 * S, 18 * S, OL); D.flakeIcon(cx - 8 * S + D.mw(t0, 18 * S) / 2 + 12 * S, f.y + 56 * S, 9 * S); }
  D.text(TT('Снежинки дают за звёзды, задания и календарь — или их можно купить:', 'Earn them with stars, quests and the calendar — or get some now:'), cx, f.y + 100 * S, D.fitText(TT('Снежинки дают за звёзды, задания и календарь — или их можно купить:', 'Earn them with stars, quests and the calendar — or get some now:'), w - 40 * S, 12 * S), '#5a6385');
  var y = f.y + 122 * S;
  packs.forEach(function (id) {
    var P = (Z.PRODUCTS || []).filter(function (p) { return p.id === id; })[0]; if (!P) return;
    var okP = id === fit;
    a.button('nf_' + id, f.x + 22 * S, y, w - 44 * S, 50 * S, { modal: true, enabled: ready, pulse: okP && ready, r: 12 * S, c1: okP ? '#ff8a3d' : '#4cc77d', c2: okP ? '#d4602a' : COL.greenD, fn: function () { Z.SDK27.buy(id, function (ok) { if (ok) closeBack(m); }); },
      draw: function (x, yy, bw, bh) { D.flakeIcon(x + 24 * S, yy + bh / 2 - 2 * S, 10 * S); D.text('+' + P.fl, x + 40 * S, yy + bh / 2 - 1 * S, 18 * S, '#fff', 'left', 'middle', 2 * S); var nm = Z.LANG === 'en' ? P.en : P.ru; D.text(nm, x + bw / 2 + 10 * S, yy + bh / 2 - 1 * S, D.fitText(nm, bw * 0.4, 13 * S), '#fff', 'center', 'middle', 2 * S); D.text(Z.SDK27.priceOf(id), x + bw - 14 * S, yy + bh / 2 - 1 * S, 14 * S, '#fff', 'right', 'middle', 2 * S); } });
    if (okP && need) { var hl = TT('Хватит', 'Enough'), hfs = 10.5 * S, hw = D.mw(hl, hfs) + 14 * S; D.rr(f.x + w - 30 * S - hw, y - 8 * S, hw, 17 * S, 8.5 * S); D.ctx.fillStyle = '#e8484f'; D.ctx.fill(); D.ctx.lineWidth = 1.5 * S; D.ctx.strokeStyle = OL; D.ctx.stroke(); D.text(hl, f.x + w - 30 * S - hw / 2, y + 0.5 * S, hfs, '#fff', 'center', 'middle', 2 * S); }
    y += 58 * S;
  });
  if (ar) { a.button('nf_ad', f.x + 22 * S, y, w - 44 * S, 50 * S, { modal: true, r: 12 * S, c1: '#9a7ce8', c2: COL.purpleD, fn: function () { Z.SDK.rewarded(function () { m.rw = 1; }, function () { Z.lastReward = Z.time; if (m.rw) { m.rw = 0; Z.save.shop.adFl = Date.now(); Z.save.flakes += 3; snd('reward'); Z.persist(true); } }); },
    draw: function (x, yy, bw, bh) { D.adIcon(x + 26 * S, yy + bh / 2 - 2 * S, 9 * S); D.text(TT('Реклама: +3 снежинки', 'Watch an ad: +3 snowflakes'), x + bw / 2 + 10 * S, yy + bh / 2 - 1 * S, D.fitText(TT('Реклама: +3 снежинки', 'Watch an ad: +3 snowflakes'), bw - 70 * S, 14 * S), '#fff', 'center', 'middle', 2 * S); } }); y += 58 * S; }
  a.button('nf_x', f.x + 22 * S, y, w - 44 * S, 46 * S, { modal: true, r: 12 * S, c1: '#5f74b8', c2: '#43579a', label: TT('Назад', 'Back'), fn: function () { closeBack(m); } });
}
function trialOffer(m, w, a) {
  var S = a.S, cost = Z.FLAG ? Z.FLAG('skin_cost', 45) : 45, f = a.frame(w, 330 * S, TT('Понравился облик?', 'Like this look?'));
  var sv = Z.save.skins.on[m.h], so = Z.save.skins.own[m.h + ':' + m.s]; Z.save.skins.on[m.h] = m.s; Z.save.skins.own[m.h + ':' + m.s] = 1;
  D.rr(f.x + 22 * S, f.y + 44 * S, w - 44 * S, 140 * S, 14 * S); D.ctx.fillStyle = '#e9f1ff'; D.ctx.fill();
  try { D.ally(m.h, f.x + w / 2, f.y + 172 * S, 52 * S * ((UI.heroK && UI.heroK[m.h]) ? Math.min(1.2, Math.max(0.8, UI.heroK[m.h])) : 1), { dir: 1, walk: true }); } finally { if (sv === undefined) delete Z.save.skins.on[m.h]; else Z.save.skins.on[m.h] = sv; if (!so) delete Z.save.skins.own[m.h + ':' + m.s]; }
  var t = TT('Оставить его навсегда за ', 'Keep it forever for ') + cost;
  a.button('to_buy', f.x + 22 * S, f.y + f.h - 124 * S, w - 44 * S, 54 * S, { modal: true, r: 12 * S, pulse: true, c1: '#3fb6e6', c2: '#2a8bbd',
    fn: function () { if (Z.save.flakes < cost) { Z.needFlakes(cost); return; } Z.save.flakes -= cost; Z.giveSkin(m.h, m.s); snd('levelup'); Z.persist(true); UI.closeModal(); },
    draw: function (x, y, bw, bh) { var fs = D.fitText(t, bw - 40 * S, 16 * S); D.text(t, x + bw / 2 - 9 * S, y + bh / 2 - 2 * S, fs, '#fff', 'center', 'middle', 2.5 * S); D.flakeIcon(x + bw / 2 + D.mw(t, fs) / 2 + 3 * S, y + bh / 2 - 2 * S, 8 * S); } });
  a.button('to_no', f.x + 22 * S, f.y + f.h - 64 * S, w - 44 * S, 50 * S, { modal: true, r: 12 * S, c1: '#5f74b8', c2: '#43579a', label: TT('Не сейчас', 'Not now'), fn: function () { UI.closeModal(); } });
}

// ================= покупки за голоса: места, наборы, стартовый набор =================
var oApply = Z.applyProduct;
Z.applyProduct = function (id, restoring) {
  fix(); var sh = Z.save.shop;
  if (id === 'slot4' || id === 'slot5') { if (!sh[id]) { sh[id] = 1; if (!restoring) toast(TT('Новое место для усиления!', 'New boost slot!'), '#9dff6a'); } Z.persist(true); return; }
  if (id === 'supply' || id === 'supply2') { var n = id === 'supply' ? 3 : 10; INV.forEach(function (q) { Z.save.inv[q.id] = Math.min(INV_MAX, Z.save.inv[q.id] + n); }); if (id === 'supply2') Z.save.flakes += 50; toast(TT('Запасы получены!', 'Supplies received!'), '#ffd54a'); Z.persist(true); return; }
  var had = sh.starter; oApply.apply(this, arguments);
  if (id === 'starter' && !had) { INV.forEach(function (q) { Z.save.inv[q.id] = Math.min(INV_MAX, Z.save.inv[q.id] + 3); }); starterExtras(); Z.persist(true); }
};
// «царское» в стартовом наборе: Царский терем (облик крепости) и усиление «Казна» сразу 2-го уровня — и у тех, кто купил набор раньше
function starterExtras() {
  var s = Z.save; if (!s || !s.shop || !s.shop.starter || !s.deco) return; fix();
  if (!s.deco.own.fort_gold) s.deco.own.fort_gold = 1;
  ['kind_gold', 'tinsel_gold', 'lights_gold'].forEach(function (k) { s.deco.own[k] = 1; });   // 2.12.13: золотая ёлка, мишура и гирлянда — тоже в наборе
  if ((s.buffs.lvl.coin || 0) < 2) { s.buffs.lvl.coin = 2; if (s.buffs.on.indexOf('coin') < 0 && s.buffs.on.length < slots()) s.buffs.on.push('coin'); }
}
setInterval(function () { try { if (Z.save && Z.save.shop && Z.save.shop.starter && !(Z.save.deco && Z.save.deco.own && Z.save.deco.own.fort_gold && Z.save.deco.own.kind_gold)) { starterExtras(); Z.persist && Z.persist(); } } catch (e) { if (window.__rep) window.__rep(e); } }, 3000);
(Z.PRODUCTS || []).forEach(function (p) {
  if (p.id === 'starter') { p.dru = 'Золотой Дед Мороз, всё «Царское» для вышек, ловушек и крепости, золотая ёлка, «Казна», по 3 запаса, 60 ❄ и золотые игрушки'; p.den = 'Golden Grandfather Frost, Royal towers, traps and fortress, golden tree, Treasury boost, 3 of each supply, 60 ❄ and golden toys'; }
});
if (Z.PRODUCTS) {
  [{ id: 'supply', vk: 1, ru: 'Сундучок запасов', en: 'Supply box', dru: 'По 3 заморозки, подарка, саней и аптечки', den: '3 of each battle supply', price: 49 },
   { id: 'supply2', vk: 1, ru: 'Сундук запасов', en: 'Supply chest', dru: 'По 10 заморозок, подарков, саней и аптечек + 50 снежинок', den: '10 of each battle supply + 50 snowflakes', price: 149 },
   { id: 'slot4', vk: 1, perm: true, ru: '4-е место для усиления', en: '4th boost slot', dru: 'Можно надеть четыре усиления сразу', den: 'Equip four boosts at once', price: 69 },
   { id: 'slot5', vk: 1, perm: true, ru: '5-е место для усиления', en: '5th boost slot', dru: 'Можно надеть пять усилений сразу', den: 'Equip five boosts at once', price: 99 }
  ].forEach(function (p) { if (!Z.PRODUCTS.some(function (q) { return q.id === p.id; })) Z.PRODUCTS.push(p); });
}
})();
