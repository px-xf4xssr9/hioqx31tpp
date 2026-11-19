// v2.10.4: звук — вместо синтезированных «пиков» записанные звуки (ElevenLabs): выстрелы вышек, попадание, «пуф» врага,
// взрыв, голоса енотов, фургон, тревога у ёлки, улучшение, сани, постройка. Пока звук не загрузился — старый синтез.
(function () {
var Z = window.Z, AU = Z.AU;
function has(n) { return !!(AU.bufs && AU.bufs[n]); }
function rnd(a, b) { return a + Math.random() * (b - a); }
var SHOT = { snow: 's_snow', ice: 's_ice', mortar: 's_mortar', ballista: 's_ball' };
var oShot = AU.shot;
AU.shot = function (kind) {
  var n = SHOT[kind]; if (!n || !has(n) || !this.running()) return oShot.apply(this, arguments);
  var now = this.ctx.currentTime, k = 'shot_' + kind; if (this.lastPlay[k] && now - this.lastPlay[k] < 0.07) return; this.lastPlay[k] = now;
  this.sfx(n, kind === 'mortar' ? 0.55 : kind === 'snow' ? 0.32 : 0.42, { pitch: rnd(0.92, 1.08) });
  if (kind === 'mortar') this.sub(now, 80, 30, 0.25, 0.35);   // немного низа под выстрелом мортиры
};
var oMg = AU.mg;
AU.mg = function () {
  if (!has('s_mg') || !this.running()) return oMg.apply(this, arguments);
  var t = this.grid(4); if (this.lastMg && Math.abs(this.lastMg - t) < 0.01) return; this.lastMg = t;
  this.sfx('s_mg', 0.26, { quant: 4, pitch: rnd(0.9, 1.1) });
};
var oPop = AU.pop;
AU.pop = function () {
  if (!has('e_pop') || !this.running()) return oPop.apply(this, arguments);
  var now = this.ctx.currentTime; if (this.lastPop && now - this.lastPop < 0.05) return; this.lastPop = now;
  this.sfx('e_pop', 0.38, { pitch: rnd(0.88, 1.15) });
};
var oBoom = AU.boom;
AU.boom = function (k) {
  if (!has('boom_s') || !this.running()) return oBoom.apply(this, arguments);
  k = k || 1; var t = this.grid(2); if (this.lastBoom && Math.abs(this.lastBoom - t) < 0.01) return; this.lastBoom = t;
  this.sfx('boom_s', Math.min(0.9, 0.5 * k), { quant: 2, pitch: rnd(0.9, 1.05) / Math.sqrt(Math.max(0.7, k)) });
  this.sub(t, 70, 26, 0.4 * k, Math.min(0.6, 0.45 * k));
};
// еноты — записанное «чирик-чирик» вместо синтеза; остальные — как были
var RAC = { raccoon: 1, thrower: 1, engineer: 1, sculptor: 1 };   // 2.11.5: снегоплюхи — свои «хлюп» (EV ниже)
var oVoice = AU.voice;
AU.voice = function (type, act) {
  if (!RAC[type] || !has('rac1') || !this.running()) return oVoice.apply(this, arguments);
  var now = this.ctx.currentTime, k = 'v_' + type;
  if (this.lastPlay[k] && now - this.lastPlay[k] < (act === 'attack' ? 0.5 : 1.2)) return;
  if (this.lastVoice && now - this.lastVoice < 0.18) return;
  if (act === 'idle' && Math.random() < 0.5) return;
  this.lastPlay[k] = now; this.lastVoice = now;
  this.sfx(act === 'attack' || Math.random() < 0.5 ? 'rac1' : 'rac2', act === 'die' ? 0.3 : 0.22, { pitch: RAC[type] * rnd(0.92, 1.12) * (act === 'die' ? 1.15 : 1) });
};
// 2.11.5: толстяк — свой голос (добродушное «хм», «хоп!» при ударе, смешное «уф» и мягкое падение в снег) вместо синтеза
var oVoice2 = AU.voice, FAT = { idle: ['fat_idle'], spawn: ['fat_idle'], attack: ['fat_atk1', 'fat_atk2'], die: ['fat_die1', 'fat_die2'] };
AU.voice = function (type, act) {
  if (type !== 'fat' || !this.bufs['sfx_fat_idle'] || !this.running()) return oVoice2.apply(this, arguments);
  var L = FAT[act] || FAT.idle, now = this.ctx.currentTime, k = 'v_fat';
  if (act !== 'die') { if (this.lastPlay[k] && now - this.lastPlay[k] < (act === 'attack' ? 1.2 : 2.5)) return; if (this.lastVoice && now - this.lastVoice < 0.18) return; if (act === 'idle' && Math.random() < 0.6) return; }
  this.lastPlay[k] = now; this.lastVoice = now;
  this.sfx(L[Math.floor(Math.random() * L.length)], act === 'die' ? 0.55 : act === 'attack' ? 0.4 : 0.32, { pitch: rnd(0.9, 1.05) });
};
// 2.11.5: у всех врагов — записанные голоса (ElevenLabs). Синтез «формант» больше не звучит ни у кого:
// на низких нотах он был похож на неприличный звук (великан, сани, таран, снегоуборщик, Горыныч, Леший).
// Машины «говорят» мотором (VEH ниже), при поломке — треск досок.
var EV = {
  icicle: { idle: ['en_icicle_idle'], die: ['en_icicle_die'] },
  crow: { idle: ['en_crow_idle'], attack: ['en_crow_idle'], die: ['en_crow_die'] },
  split: { idle: ['en_slush_idle'], die: ['en_slush_die'], p: 0.85 }, splitkid: { idle: ['en_slush_idle'], die: ['en_slush_die'], p: 1.25 },
  giant: { idle: ['en_giant_idle'], attack: ['en_giant_atk'], die: ['en_giant_die'] },
  witch: { idle: ['en_witch_idle'], attack: ['en_witch_atk'], die: ['en_witch_die'] },
  chariot: { idle: ['en_witch_idle'], attack: ['en_witch_atk'], die: ['en_big_die', 'en_witch_die'] },
  leshy: { idle: ['en_leshy_idle'], attack: ['en_leshy_atk'], die: ['en_leshy_die'] },
  raz: { idle: ['en_raz_idle'], attack: ['en_raz_idle'], die: ['en_raz_die'] },
  yaga: { idle: ['en_yaga_idle'], attack: ['en_yaga_atk'], die: ['en_yaga_die'] },
  kiki: { idle: ['en_kiki_idle'], attack: ['en_kiki_idle'], die: ['en_kiki_die'] },
  solovey: { attack: ['en_solo_atk'], die: ['en_raz_die'], p: 0.85 },
  hare: { idle: ['en_hare'], die: ['en_hare'] }, duck: { idle: ['en_duck'], die: ['en_duck'] },
  gorynych: { idle: ['en_gory_idle'], attack: ['en_gory_atk'], die: ['en_gory_die'] },
  koschei: { idle: ['en_kos_idle'], attack: ['en_kos_atk'], die: ['en_kos_die'] },
  hutE: { idle: ['en_hut'], attack: ['en_hut'], die: ['en_veh_die'] },
  sled: { die: ['en_veh_die'] }, ram: { die: ['en_veh_die'] }, plow: { die: ['en_big_die'] }, van: { die: ['en_big_die'] }, cannon: { die: ['en_veh_die'] }
};
var oVoice3 = AU.voice, VVOL = { idle: 0.3, spawn: 0.3, attack: 0.4, die: 0.45 };
AU.ownDie = function (type) { return type === 'fat' || !!(EV[type] && EV[type].die && has('sfx_' + EV[type].die[0])); };
AU.voice = function (type, act) {
  if (RAC[type] || type === 'fat') return oVoice3.apply(this, arguments);
  var V = EV[type]; if (!V || !this.running()) return;          // нет записи — тишина, а не синтез
  var L = V[act] || (act === 'spawn' ? V.idle : null); if (!L || !has('sfx_' + L[0])) return;
  var now = this.ctx.currentTime, k = 'v_' + type + (act === 'die' ? 'd' : '');
  var gap = act === 'die' ? 0.15 : act === 'attack' ? 1.0 : 2.5;
  if (this.lastPlay[k] && now - this.lastPlay[k] < gap) return;
  if (act !== 'die') { if (this.lastVoice && now - this.lastVoice < 0.18) return; if ((act === 'idle' || act === 'spawn') && Math.random() < 0.5) return; }
  this.lastPlay[k] = now; if (act !== 'die') this.lastVoice = now;
  this.sfx(L[Math.floor(Math.random() * L.length)], VVOL[act] || 0.35, { pitch: (V.p || 1) * rnd(0.93, 1.07) });
};
// подмена звуков по имени
var MAP = {};   // 2.11.5: постройка, улучшение, покупка — свои басовые звуки без звона (sfx/*.mp3), подмена на «upgrade/place2» больше не нужна
var oSfx = AU.sfx;
AU.sfx = function (name, vol, opts) { var m = MAP[name]; if (m && has(m)) name = m; return oSfx.call(this, name, vol, opts); };
// фургон, тревога, сани, стройка
Z.sndVan = function (x, y) { if (AU.at) AU.at(x, y); AU.sfx(has('van_engine') ? 'van_engine' : 'sleigh', 0.55, has('van_engine') ? {} : { pitch: 0.6 }); };
Z.sndAlarm = function () { AU.sfx(has('alarm_bell') ? 'alarm_bell' : 'bell', 0.5); };
Z.sndSleigh = function () { AU.sfx(has('sleigh_fly') ? 'sleigh_fly' : 'sleigh', 0.8); };
Z.sndHammer = function (x, y) { if (AU.at) AU.at(x, y); AU.sfx(has('hammer') ? 'hammer' : 'build', 0.45, { gap: 0.8 }); };
})();
// 2.10.5: ещё звуки ElevenLabs — тесла, машины (снегоход, таран, снегоуборщик, колесница), оружие героев
(function () {
var Z = window.Z, AU = Z.AU;
function has(n) { return !!(AU.bufs && AU.bufs[n]); }
function rnd(a, b) { return a + Math.random() * (b - a); }
// тесла: живой электрический разряд вместо «пиу»
var oZap = AU.zap;
AU.zap = function () {
  if (!has('s_tesla') || !this.running()) return oZap.apply(this, arguments);
  this.sfx('s_tesla', 0.3, { gap: 0.09, gapKey: 'z', pitch: rnd(0.9, 1.12) });
};
// машины: звук при выезде, у тяжёлых — рокот время от времени
var VEH = { sled: ['v_sled', 0.32, 1.2, 0], ram: ['v_ram', 0.38, 1.5, 0], plow: ['v_plow', 0.45, 2, 6], chariot: ['v_chariot', 0.6, 0, 7], van: ['van_engine', 0.4, 1.5, 0] };
var oHE = Z.hk.enemy;
Z.hk.enemy = function (e, dt, v) {
  var V = VEH[e.type];
  if (V && !e.dead && has(V[0]) && !(e.garT > 0)) {
    e._vt = (e._vt === undefined ? 0 : e._vt) - dt;
    if (e._vt <= 0 && (!e._vs || V[3])) {
      var p = Z.enemyPos ? Z.enemyPos(e) : e;
      if (AU.at && p) AU.at(p.x, p.y);
      if (!(e.type === 'van' && !e._vs)) AU.sfx(V[0], V[1] * (e._vs ? 0.6 : 1), { gap: V[2], gapKey: 'veh', pitch: rnd(0.94, 1.06) });
      e._vs = true; e._vt = V[3] ? V[3] * rnd(0.8, 1.3) : 99999;
    }
  }
  return oHE ? oHE(e, dt, v) : false;
};
// удар тарана / громилы по вышке
Z.meleeSnd = function (e) {
  if (e.type === 'ram' && has('v_ram')) { AU.sfx('v_ram', 0.42, { gap: 0.3, pitch: rnd(0.92, 1.08) }); AU.sfx('crack', 0.25, { gap: 0.1 }); return true; }
  return false;
};
// оружие героев: у каждого своё
var HW = { moroz: ['h_staff', 0.4], sneg: ['h_arrow', 0.34], belka: ['h_cone', 0.32], plombir: ['h_sword', 0.38], eskimo: ['h_snowb', 0.36], vasilisa: ['h_magic', 0.32], kot: ['h_claw', 0.36], kolobok: ['h_bump', 0.4], emelya: ['pot_launch', 0.22] };
Z.heroAtkSnd = function (H, aoe) {
  var w = HW[H.type]; if (!w || !has(w[0])) return false;
  if (AU.at) AU.at(H.x, H.y);
  AU.sfx(w[0], w[1], { gap: 0.12, gapKey: 'h' + H.type, pitch: rnd(0.93, 1.08) });
  if (aoe && H.type === 'moroz') AU.sfx('freeze', 0.18, { gap: 0.3 });
  return true;
};
})();
