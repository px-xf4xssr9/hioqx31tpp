/* 2.11.5 · облики вышек — не только красота: у каждого своё свойство в бою и свой звук выстрела.
   Набор: 3 вышки в одном облике усиливают его свойство. Праздник: 4 разных облика на поле —
   все наряженные вышки стреляют на 6% быстрее. Свойства небольшие, чтобы не ломать баланс уровней. */
(function () {
'use strict';
var Z = window.Z;
function TT(r, e) { return Z.LANG === 'en' ? e : r; }
var PERK = {
  gift:    { ru: 'Щедрость', en: 'Generosity', d: ['+1 монета за врага, добитого этой вышкой', '+1 coin for each enemy it finishes'], s: ['+2 монеты', '+2 coins'] },
  ginger:  { ru: 'Липкая глазурь', en: 'Sticky icing', d: ['попадания замедляют врагов на 20%', 'hits slow enemies by 20%'], s: ['замедление 30%', '30% slow'] },
  crystal: { ru: 'Иней', en: 'Hoarfrost', d: ['+20% урона по замедленным и замёрзшим', '+20% damage to slowed and frozen foes'], s: ['+35% урона', '+35% damage'] },
  garland: { ru: 'Искра', en: 'Spark', d: ['каждый 4-й выстрел бьёт искрой ещё одного врага', 'every 4th shot sparks another enemy'], s: ['каждый 3-й выстрел', 'every 3rd shot'] },
  royal:   { ru: 'Царский удар', en: 'Royal strike', d: ['12% шанс двойного урона', '12% chance of double damage'], s: ['шанс 20%', '20% chance'] }
};
Z.TPERK = PERK;
Z.towerPerkText = function (id) {
  var p = PERK[id]; if (!p) return null; var en = Z.LANG === 'en';
  return { name: en ? p.en : p.ru, desc: p.d[en ? 1 : 0], set: TT('3 вышки в облике: ', '3 towers in this look: ') + p.s[en ? 1 : 0], fest: TT('4 разных облика на поле: наряженные вышки стреляют на 6% быстрее', '4 different looks on the field: dressed towers fire 6% faster') };
};
function skinOf(tw) { var s = tw && Z.towerSkin && Z.towerSkin(tw.type); return s ? s.id : null; }
var memo = { t: -1, cnt: {}, kinds: 0 };
function counts() {
  var G = Z.G; if (!G) return memo; var tm = G.t || 0; if (memo.G === G && memo.t === tm) return memo;
  var cnt = {}, k, n = 0; for (k in G.towers) { var id = skinOf(G.towers[k]); if (id) { if (!cnt[id]) n++; cnt[id] = (cnt[id] || 0) + 1; } }
  memo = { G: G, t: tm, cnt: cnt, kinds: n }; return memo;
}
Z.towerSetInfo = function () { return counts(); };
function isSet(id) { return (counts().cnt[id] || 0) >= 3; }
var SND = { gift: ['select', 0.22, 1.7], ginger: ['tap', 0.3, 1.25], crystal: ['ice', 0.22, 1.6], garland: ['select', 0.2, 2.1], royal: ['coin', 0.2, 1.45] };
function snd(id, crit) {
  try { var B = Z.AU.bufs || {}, q = SND[id]; if (B['t_' + id]) Z.AU.sfx('t_' + id, 0.2, { pitch: 0.95 + Math.random() * 0.1, gap: 0.16, gapKey: 'tsk' + id }); else if (q) Z.AU.sfx(q[0], q[1], { pitch: q[2] * (0.95 + Math.random() * 0.1), gap: 0.16 }); if (crit) Z.AU.sfx(B.hit_crit ? 'hit_crit' : 'metal', 0.3, { pitch: 1.1, gap: 0.2 }); } catch (e) { if (window.__rep) window.__rep(e); }
}
function txt(s, x, y, c, sz) { if (Z._ && Z._.addText) Z._.addText(s, x, y, c, 0.8, sz || 0.9); }
Z.hk.towerRate = function (tw) { return skinOf(tw) && counts().kinds >= 4 ? 1.06 : 1; };
Z.hk.towerFire = function (tw, st, e, fire) {
  var id = skinOf(tw); if (!id) return fire(tw, st, e);
  var G = Z.G, set = isSet(id), st2 = st, crit = false;
  if (id === 'royal' && Math.random() < (set ? 0.2 : 0.12)) { crit = true; st2 = {}; for (var k in st) st2[k] = st[k]; st2.dmg = st.dmg * 2; }
  var n0 = G.shots.length, prev = Z._shot; Z._shot = { skn: id, skset: set };
  try { fire(tw, st2, e); } finally { Z._shot = prev; }
  for (var i = n0; i < G.shots.length; i++) { G.shots[i].skn = id; G.shots[i].skset = set; }
  if (crit) { var p = Z.enemyPos(e); txt('×2!', p.x, p.y - 0.9, '#ffd54a', 1.1); }
  if (id === 'garland') {
    tw.skN = (tw.skN || 0) + 1;
    if (tw.skN >= (set ? 3 : 4)) {
      tw.skN = 0; var pe = Z.enemyPos(e), best = null, bd = 2.4 * 2.4;
      for (var j = 0; j < G.enemies.length; j++) { var o = G.enemies[j]; if (o === e || o.dead) continue; var op = Z.enemyPos(o), d2 = (op.x - pe.x) * (op.x - pe.x) + (op.y - pe.y) * (op.y - pe.y); if (d2 < bd) { bd = d2; best = o; } }
      var tgt = best || e, tp = Z.enemyPos(tgt), pv = Z._shot; Z._shot = { skn: id, skset: set };
      try { Z.damage(tgt, st.dmg * 0.5, {}); } finally { Z._shot = pv; }
      G.fx.push({ k: 'bolt', pts: [{ x: tw.c + 0.5, y: tw.r + 0.2 }, tp], t: 0, dur: 0.16, seed: Math.random() * 100 });
      try { if (Z.AU.bufs && Z.AU.bufs.t_spark) Z.AU.sfx('t_spark', 0.25, { pitch: 0.95 + Math.random() * 0.1, gap: 0.2 }); else Z.AU.sfx('select', 0.25, { pitch: 2.4, gap: 0.2 }); } catch (e2) { if (window.__rep) window.__rep(e2); }
    }
  }
  snd(id, crit);
};
var oldDmg = Z.hk.dmg;
Z.hk.dmg = function (e, real, opts) {
  var r = oldDmg ? oldDmg(e, real, opts) : real; if (r <= 0) return r;
  var s = Z._shot, id = s && s.skn; if (!id) return r;
  if (id === 'crystal' && (e.slow > 0 || (Z.G && Z.G.blizT > 0))) r *= s.skset ? 1.35 : 1.2;
  if (id === 'ginger' && !e.boss) { e.slow = Math.max(e.slow || 0, s.skset ? 0.3 : 0.2); e.slowT = Math.max(e.slowT || 0, 0.8); }
  return r;
};
var oldKill = Z.hk.kill;
Z.hk.kill = function (e) {
  if (oldKill) oldKill(e);
  var s = Z._shot; if (!s || s.skn !== 'gift' || !Z.G) return;
  var n = s.skset ? 2 : 1, p = Z.enemyPos(e); Z.G.coins += n; txt('+' + n, p.x + 0.2, p.y - 0.6, '#ffd54a', 0.85);
};
})();
