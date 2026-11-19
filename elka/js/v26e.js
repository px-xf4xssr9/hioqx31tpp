/* 2.6 · звук: озвученные реплики и перепалки, субтитры, приглушение музыки, звуки ElevenLabs, объёмный звук, народные темы */
(function () {
'use strict';
var Z = window.Z, AU = Z.AU, TT = Z.TT;

// ---------- настройки ----------
function S() { var s = Z.save; if (s.voiceOn === undefined) s.voiceOn = Z.LANG !== 'en'; if (!s.banter) s.banter = 'normal'; s.bellGag = true; if (s.subs === undefined) s.subs = true; return s; }
Z.voiceSettings = S;
var GAP = { often: 6, normal: 9, rare: 16, off: 1e9 };

// ---------- загрузка голосов и звуков по требованию ----------
var vbuf = {}, vload = {}, paks = {};
// озвучка и эффекты лежат в двух файлах-пачках: меньше запросов, быстрее на телефонах
function pakGet(kind, id) {
  var ix = Z.PAK && Z.PAK[kind] && Z.PAK[kind][id]; if (!ix) return Promise.reject(0);
  var part = ix[2] || 0, key = kind + (part ? part : '');
  pakFetch(kind, part);
  return paks[key].then(function (ab) { return ab.slice(ix[0], ix[0] + ix[1]); });
}
// пачка может быть разрезана на части: voice_pack.mp3, voice_pack2.mp3, …
function pakFetch(kind, part) { part = part || 0; var key = kind + (part ? part : ''), base = kind === 'voice' ? 'voice_pack' : 'sfx_pack'; if (!paks[key]) { var pr = paks[key] = fetch(base + (part ? part + 1 : '') + '.mp3').then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (ab) { (Z.pakDone = Z.pakDone || {})[key] = 1; return ab; }); pr.catch(function () { if (paks[key] === pr) setTimeout(function () { if (paks[key] === pr) delete paks[key]; }, 4000); }); } return paks[key]; }
// заставка: обе пачки качаются, пока она идёт; промис не падает (в превью пачек может не быть)
// голоса (11 МБ) качаются фоном и могут догрузиться уже в игре; ждём только пачку эффектов (0,5 МБ)
// 2.12.24: сначала пачка эффектов (2 МБ), голоса (16 МБ) — только после неё: раньше всё качалось разом, и заставка «Иней» ждала эффекты,
// пока сеть была занята голосами
var pfP = null;
Z.pakPrefetch = function () { if (pfP) return pfP; pfP = pakFetch('sfx').catch(function () { return null; }); pfP.then(function () { var np = 1; if (Z.PAK && Z.PAK.voice) for (var k in Z.PAK.voice) np = Math.max(np, (Z.PAK.voice[k][2] || 0) + 1); for (var i = 0; i < np; i++) pakFetch('voice', i).catch(function () {}); }); return pfP; };
Z.pakWarm = function () { pakGet('voice', 'MOR-01').catch(function () {}); };
function loadVoice(id, cb) {
  if (vbuf[id]) { cb && cb(vbuf[id]); return; }
  if (!AU.ctx) { cb && cb(null); return; }
  if (vload[id]) { vload[id].push(cb); return; }
  vload[id] = [cb];
  pakGet('voice', id).then(function (ab) {
    AU.ctx.decodeAudioData(ab, function (b) { vbuf[id] = b; var l = vload[id]; vload[id] = null; l.forEach(function (f) { f && f(b); }); }, function () { var l = vload[id]; vload[id] = null; l.forEach(function (f) { f && f(null); }); });
  }).catch(function () { var l = vload[id]; vload[id] = null; (l || []).forEach(function (f) { f && f(null); }); });
}
Z.preloadVoices = function (ids) { ids.forEach(function (id) { if (Z.VL[id]) loadVoice(id); }); };
var EL_SFX = ['tp_shatter', 'tp_crumble', 'tp_glass', 'tp_spring', 'tp_spike', 'tp_slip', 'tp_snap', 'tp_mine', 'tp_fw', 'tp_lamp', 'tp_set', 'bar_build', 'bar_hit', 'bar_break', 'st_throw', 'st_crank', 'st_catapult', 'st_saw', 'st_drum', 'st_frost', 'st_lodge', 'st_totem', 'st_horn', 'avalanche', 'barrel_boom', 'bell', 'big_boom', 'boss_horn', 'build', 'chest_crack', 'coin', 'defeat_sting', 'dragon_roar', 'drum', 'freeze', 'ice_break', 'kolobok_roll', 'magic_ball', 'mine_pop', 'pot_launch', 'purr', 'splash', 'stupa_fly', 'tower_fall', 'victory_sting', 'hut_cluck', 'hut_bawk', 'hut_creak', 'hut_steps', 'hut_land', 'wave', 'whistle',
  's_snow', 's_ice', 's_mortar', 's_ball', 's_mg', 'hit_snow', 'e_pop', 'boom_s', 'rac1', 'rac2', 'van_engine', 'alarm_bell', 'upgrade', 'sleigh_fly', 'hammer', 'place2',
  's_tesla', 'v_sled', 'v_ram', 'v_plow', 'v_chariot', 'h_staff', 'h_arrow', 'h_cone', 'h_sword', 'h_snowb', 'h_magic', 'h_claw', 'h_bump',
  'm_slam', 'm_spikes', 'm_ult', 'm_raise', 'sk_ice', 'sk_night', 'sk_mint', 'sk_gold', 'sk_rose', 'hit_crit', 'h_impact', 't_gift', 't_ginger', 't_crystal', 't_garland', 't_royal', 't_spark', 'a_beaver_chew', 'a_beaver_slap', 'a_beaver_chirp', 'a_bear_snore', 'a_bear_roar', 'a_bear_yawn', 'a_bear_swipe', 'a_magpie', 'a_magpie_flap', 'a_owl_hoot', 'a_owl_screech', 'a_fox_yip', 'a_fox_pounce', 'a_hare_squeak', 'a_hare_thump', 'a_trust_up', 'a_trust_down', 'w_wade', 'w_splash', 'w_squelch', 'w_bubble', 'w_icecrack', 'a_frog', 'a_frog2', 'a_frog_plop', 'amb_forest', 'amb_village', 'amb_lake', 'amb_mountain', 'amb_north', 'amb_swamp', 'amb_cave', 'm_avalanche_rumble'];   /* 2.11.5 */   /* 2.10.4–2.10.5: звуки ElevenLabs */
var elLoaded = false;
var elFail = 0;
function loadEl() {
  if (elLoaded || !AU.ctx) return; elLoaded = true;
  EL_SFX.forEach(function (n) {
    if (AU.bufs[n] || AU.bufs['el_' + n]) return;
    pakGet('sfx', n).then(function (ab) { AU.ctx.decodeAudioData(ab, function (b) { if (AU.bufs['sfx_' + n]) AU.bufs['el_' + n] = b; else AU.bufs[n] = b; }, function () {}); }).catch(function () { if (elLoaded && elFail++ < 40) setTimeout(function () { elLoaded = false; }, 5000); });
  });
}

Z.loadEl = loadEl;
var oldUnlock = AU.unlock; AU.unlock = function () { var r = oldUnlock.apply(this, arguments); loadEl(); if (Z.save.voiceOn !== false) Z.pakWarm(); return r; };
// ---------- объёмный звук: панорама, расстояние, реверберация по региону ----------
var REV = { forest: 0.1, village: 0.07, lake: 0.18, mount: 0.32, pole: 0.22 };
var oldSfx = AU.sfx;
AU.at = function (x, y, h) { if (this.ctx) this.pos = { x: x, y: y, h: h || 0, t: this.ctx.currentTime }; };
// 2.11.5: полный объёмный звук «как Atmos» — каждый звук стоит в своей точке карты.
// Слушатель — у ёлки внизу экрана, лицом к полю: лево–право — по экрану, верх экрана — вдаль (тише, глуше, больше эха),
// летящее (вороны, снаряды, петарды) — выше. В наушниках (HRTF) это настоящий 3D: впереди, слева, сверху;
// на динамиках — панорама, глубина громкостью и тембром, ранние отражения «комнаты» и эхо местности.
// Интерфейс (кнопки, награды, фанфары) звучит по центру. Голосов одновременно — не больше 32, лишние тихие отбрасываются.
var NONPOS = { tap: 1, ui_tap: 1, ui_tap2: 1, ui_tap3: 1, select: 1, back: 1, error: 1, reward: 1, levelup: 1, upgrade: 1, win: 1, lose: 1, star: 1, unlock: 1, buy: 1, wave: 1, whistle: 1, victory_sting: 1, defeat_sting: 1, coin: 1, bong: 1, sleigh_fly: 1 };
AU.nonPos = NONPOS; AU.voices = 0;
function er(A) {   // общая шина ранних отражений: две задержки по бокам, мягкие
  if (A.erIn || !A.ctx) return A.erIn; var c = A.ctx, i = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4500; i.connect(lp);
  [[0.017, -0.8], [0.029, 0.8], [0.041, -0.3]].forEach(function (q) { var d = c.createDelay(0.1); d.delayTime.value = q[0]; var g = c.createGain(); g.gain.value = 0.5; lp.connect(d); d.connect(g);
    if (c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = q[1]; g.connect(p); p.connect(A.sfxG); } else g.connect(A.sfxG); });
  A.erIn = i; return i;
}
AU.sfx = function (name, vol, opts) {
  if (!this.running()) return;
  loadEl();
  opts = opts || {};
  var c = this.ctx, now = c.currentTime;
  var p = opts.pos || (this.pos && now - this.pos.t < 0.03 ? this.pos : null);
  if (NONPOS[name] && !opts.pos) p = null;
  var G = Z.G, UI = Z.ui;
  if (!p || !G || !UI || !UI.L || Z.save.spatial === false) return oldSfx.call(this, name, vol, opts);
  var key = name + (opts.gapKey || '');
  if (opts.gap && this.lastPlay[key] && now - this.lastPlay[key] < opts.gap) return;
  var v0 = vol === undefined ? 1 : vol;
  if (this.voices > 32 && v0 < 0.5) return;
  this.lastPlay[key] = now;
  var buf = this.bufs['sfx_' + name] || this.bufs[name]; if (!buf) return;
  var L = UI.L, h = p.h || 0, sx = L.fx + p.x * L.cs, sy = L.fy + (p.y - h) * L.cs, W = L.vp.w, H = L.vp.h;
  var nx = Math.max(-1.4, Math.min(1.4, (sx - W / 2) / (W / 2))), ny = Math.max(-1, Math.min(1, (L.fy + p.y * L.cs - H / 2) / (H / 2)));
  var off = Math.max(0, Math.max(Math.abs(sx - W / 2) - W / 2, Math.abs(sy - H / 2) - H / 2)) / Math.max(W, H);
  var dist = Math.min(1, off * 2.2), depth = (1 - ny) / 2;   // 0 — у ёлки (низ экрана), 1 — дальний край поля
  var att = (1 - dist * 0.65) * (1 - depth * 0.25);
  var src = c.createBufferSource(), g = c.createGain(), lp = c.createBiquadFilter();
  src.buffer = buf; src.playbackRate.value = (opts.pitch || 1) * (opts.doppler || 1);
  g.gain.value = v0 * att;
  lp.type = 'lowpass'; lp.frequency.value = Math.max(1800, 18000 - dist * 14000 - depth * 6000 + Math.min(1, h) * 3000);
  src.connect(g); g.connect(lp);
  var out, hq = Z.save.hrtf && c.createPanner && this.voices < 20;
  if (hq) { out = c.createPanner(); out.panningModel = 'HRTF'; out.distanceModel = 'linear'; out.rolloffFactor = 0;
    var px = nx * 2.4, py = 0.2 + Math.min(2, h) * 1.1, pz = -(0.7 + depth * 2.8 + dist * 3);
    try { out.positionX.value = px; out.positionY.value = py; out.positionZ.value = pz; } catch (e) { out.setPosition(px, py, pz); } }
  else if (c.createStereoPanner) { out = c.createStereoPanner(); out.pan.value = Math.max(-1, Math.min(1, nx * 0.9 * (1 - depth * 0.2))); }
  if (out) { lp.connect(out); out.connect(this.sfxG); } else lp.connect(this.sfxG);
  var ei = er(this); if (ei) { var es = c.createGain(); es.gain.value = 0.12 + depth * 0.16 + dist * 0.1; lp.connect(es); es.connect(ei); }
  // реверберация региона (в пещерах и горах — сильнее), дальнее — с бо́льшим эхом
  if (this.rev) { var reg = Z.REGIONS[G.info.region].id, rs = c.createGain(); rs.gain.value = (REV[reg] || 0.1) * (G.weather === 'dark' || G.mech === 'dark' ? 2.2 : 1) * (0.5 + depth * 0.7 + dist); lp.connect(rs); rs.connect(this.rev); }
  var self = this; self.voices++; src.onended = function () { self.voices = Math.max(0, self.voices - 1); };
  src.start(opts.quant ? this.grid(opts.quant) : now);
};

// ---------- реплики ----------
var speaking = null, queue = [], lineGen = 0, curDone = null;
var SUB = Z.sub = { text: '', who: '', t: 0, col: '#fff' };
var VCOL = { EN2: '#c9cfe0', EN3: '#c9d6e8', CRW: '#b8bcc8', NAR: '#ffe9a8', MOR: '#ff8a8a', SNE: '#9fd2ff', MET: '#c7b8ff', ENO: '#d0d4e0', RAZ: '#ffb38a', SOL: '#ffd27a', EME: '#ffb27a', SHU: '#9fe0d0', BEL: '#ffc27a', KOL: '#ffe08a', PLO: '#bfefff', ESK: '#8fd0ff', VAS: '#d9b8ff', KOT: '#c9d2ff', YAG: '#d8b86a', LES: '#9fd89a', KIK: '#a8e0a0', GIA: '#bfe6ff', GOR: '#9fd89a', GOR2: '#9fd89a', GOR3: '#9fd89a', KOS: '#c7b8ff' };
var VNAME = { EN2: ['Енот', 'Raccoon'], EN3: ['Енот', 'Raccoon'], CRW: ['Ворона', 'Crow'], NAR: ['Рассказчик', 'Narrator'], MOR: ['Дед Мороз', 'Grandfather Frost'], ESK: ['Эскимо', 'Eskimo'], SNE: ['Снегурочка', 'Snow Maiden'], MET: ['Метелица', 'Blizzard Witch'], ENO: ['Енот', 'Raccoon'], RAZ: ['Разбойник', 'Bandit'], SOL: ['Соловей', 'Nightingale'],
  EME: ['Емеля', 'Emelya'], SHU: ['Щука', 'The Pike'], BEL: ['Белка', 'Belka'], KOL: ['Колобок', 'Kolobok'], PLO: ['Пломбир', 'Plombir'], VAS: ['Василиса', 'Vasilisa'], KOT: ['Кот-Баюн', 'Bayun'], YAG: ['Баба-Яга', 'Baba Yaga'], LES: ['Леший', 'Leshy'], KIK: ['Кикимора', 'Kikimora'], GIA: ['Великан', 'Giant'], GOR: ['Горыныч', 'Gorynych'], GOR2: ['Горыныч', 'Gorynych'], GOR3: ['Горыныч', 'Gorynych'], KOS: ['Кощей', 'Koschei'] };
Z.VNAME = VNAME; Z.VCOL = VCOL; Z.LINE_NAME = { 'M21-10': ['Братья', 'The brothers'], 'M22-07': ['Братья', 'The brothers'] };
function lineText(id) { var v = Z.VL[id]; if (!v) return ''; if (Z.LANG === 'en' && Z.VLEN && Z.VLEN[id]) return Z.VLEN[id]; return v[1]; }
Z.lineText = lineText;
function duck(on) {
  if (!AU.musG || !AU.ctx) return;
  if (Z.duckMusic) return Z.duckMusic(on);
  var base = AU.musicVol * 0.9; AU.musG.gain.setTargetAtTime(on ? base * 0.4 : base, AU.ctx.currentTime, 0.12);
}
function playId(id, done) {
  var s = S(), v = Z.VL[id]; if (!v) { done && done(); return; }
  var who = v[0];
  SUB.text = lineText(id); SUB.who = TT(VNAME[who] ? VNAME[who][0] : '', VNAME[who] ? VNAME[who][1] : ''); SUB.col = VCOL[who] || '#fff'; SUB.t = Math.max(2.2, SUB.text.length * 0.065); SUB.id = id;
  var my = ++lineGen;
  if (speaking) { try { speaking.onended = null; speaking.stop(); } catch (e) { if (window.__rep) window.__rep(e); } speaking = null; var d0 = curDone; curDone = null; if (d0) setTimeout(d0, 0); }
  if (!s.voiceOn || !AU.running()) { setTimeout(function () { if (my === lineGen) done && done(); }, SUB.t * 1000); return; }
  var asked = Date.now(), scr0 = Z.ui && Z.ui.screen, G0 = Z.G;
  loadVoice(id, function (b) {
    if (my !== lineGen) { done && done(); return; } // пока грузилось, реплику уже пролистали — не играть поверх новой
    // 2.11.4: игрок ушёл с экрана — не звучать; в бою реплика, догрузившаяся позже 3,5 с, уже не к месту — хватит субтитра (в комиксах ждём: реплика та же)
    if (b && ((scr0 === 'level' && Date.now() - asked > 3500) || (Z.ui && Z.ui.screen) !== scr0 || Z.G !== G0)) { if (my === lineGen) setTimeout(function () { if (my === lineGen) done && done(); }, 300); return; }
    if (!b || !AU.running()) { setTimeout(function () { if (my === lineGen) done && done(); }, SUB.t * 1000); return; }
    var c = AU.ctx, src = c.createBufferSource(), g = c.createGain();
    src.buffer = b; g.gain.value = 1.15 * (Z.save && Z.save.vVoice != null ? Z.save.vVoice : 1); src.connect(g); g.connect(AU.master);   /* 2.11.5: своя громкость голосов */
    duck(true); speaking = src; curDone = done; SUB.t = b.duration + 0.4;
    src.onended = function () { if (speaking === src) { speaking = null; curDone = null; duck(false); } done && done(); };
    src.start();
  });
}
Z.playLine = playId;
// звук прямо в общий выход (для мультфильмов: не зависит от игровой громкости эффектов и состояний)
AU.raw = function (name, vol, rate) {
  if (!this.running()) return; loadEl();
  var b = this.bufs['sfx_' + name] || this.bufs[name] || this.bufs['el_' + name]; if (!b) return;
  var c = this.ctx, src = c.createBufferSource(), g = c.createGain(); src.buffer = b; src.playbackRate.value = rate || 1; g.gain.value = vol === undefined ? 1 : vol; src.connect(g); g.connect(this.master); src.start();
};
Z.stopLine = function () { lineGen++; curDone = null; queue.length = 0; if (speaking) { try { speaking.onended = null; speaking.stop(); } catch (e) { if (window.__rep) window.__rep(e); } speaking = null; duck(false); } runQueue.busy = false; Z.sub.t = 0; };
function bellGag(then) { if (S().voiceOn) AU.sfx('bell', 0.9); setTimeout(then, 450); }
// очередь: одна реплика за раз; цепочки (a → b → c) идут подряд
function runQueue() {
  if (speaking || runQueue.busy || !queue.length) return;
  var item = queue.shift(); runQueue.busy = true;
  var seq = item.slice();
  (function next() {
    var id = seq.shift();
    if (!id) { runQueue.busy = false; runQueue(); return; }
    if (id === '#bell') { bellGag(next); return; }
    playId(id, function () { setTimeout(next, 180); });
  })();
}
Z.sayLine = function (id, prio, chain) {
  var G = Z.G, s = S(); if (!Z.VL[id]) return false;
  if (s.banter === 'off' && (prio || 0) < 1) return false;
  var now = Z.time || 0;
  if (G && G.v26) {
    if (G.v26.lines[id] && (prio || 0) < 1) return false;
    if ((prio || 0) < 1 && now - (Z.lastBark || -99) < GAP[s.banter]) return false;
    if (runQueue.busy && (prio || 0) < 1) return false;
    G.v26.lines[id] = 1;
  }
  Z.lastBark = now;
  queue.push([id].concat(chain || []));
  if (queue.length > 3) queue.splice(0, queue.length - 3);
  runQueue();
  return true;
};
// реплики героев по событиям
var POOL = {
  moroz: { start: ['MOR-01', 'MOR-02'], move: ['MOR-04', 'MOR-05', 'MOR-06'], all: ['MOR-02'], ult: ['MOR-07', 'MOR-08'], hurt: ['MOR-09'], dead: ['MOR-10'], back: ['MOR-11'], towerLost: ['MOR-12'], fortHit: ['MOR-13'], lastWave: ['MOR-14'], win: ['MOR-15'], lose: ['MOR-16'], idle: ['MOR-17', 'MOR-03'] },
  sneg: { start: ['SNE-01', 'SNE-15'], move: ['SNE-03', 'SNE-04'], ult: ['SNE-05', 'SNE-06'], hurt: ['SNE-07'], dead: ['SNE-08'], back: ['SNE-09'], towerLost: ['SNE-10'], escort: ['SNE-11'], sleighHit: ['SNE-12'], escortWin: ['SNE-13'], win: ['SNE-14'], idle: ['SNE-15'] },
  emelya: { intro: ['EME-01'], start: ['EME-02'], move: ['EME-03', 'EME-04'], ult: ['EME-05'], shuka: ['SHU-01', 'SHU-02'], chain: ['EME-06'], boom: ['EME-07'], hurt: ['EME-08'], dead: ['EME-09'], back: ['EME-10'], win: ['EME-11'], idle: ['EME-12'] },
  belka: { intro: ['BEL-01'], start: ['BEL-02'], move: ['BEL-03', 'BEL-04'], ult: ['BEL-05'], reveal: ['BEL-06'], demolish: ['BEL-07'], hurt: ['BEL-08'], dead: ['BEL-09'], win: ['BEL-10'], idle: ['BEL-11'] },
  kolobok: { intro: ['KOL-01'], start: ['KOL-02'], move: ['KOL-03', 'KOL-04'], ult: ['KOL-05'], strike: ['KOL-06'], hurt: ['KOL-07'], dead: ['KOL-08'], win: ['KOL-09'], idle: ['KOL-10'] },
  eskimo: { intro: ['ESK-01'], start: ['ESK-02', 'ESK-03'], move: ['ESK-04', 'ESK-05'], ult: ['ESK-06'], hurt: ['ESK-07'], dead: ['ESK-08'], win: ['ESK-09'], idle: ['ESK-10'] },
  plombir: { start: ['PLO-02', 'PLO-01'], move: ['PLO-03', 'PLO-04'], ult: ['PLO-05'], hurt: ['PLO-06', 'PLO-07'], win: ['PLO-08'], idle: ['PLO-09'] },
  vasilisa: { intro: ['VAS-01'], start: ['VAS-02'], move: ['VAS-03', 'VAS-04'], ult: ['VAS-05'], hurt: ['VAS-06'], dead: ['VAS-07'], win: ['VAS-08'], idle: ['VAS-09'] },
  kot: { intro: ['KOT-01'], start: ['KOT-02'], move: ['KOT-03'], ult: ['KOT-04'], hurt: ['KOT-05'], dead: ['KOT-06'], win: ['KOT-07'], idle: ['KOT-08'] }
};
Z.say = function (who, ev, U) {
  var G = Z.G;
  if (ev === 'trial' || ev === 'trialWin') { var k = 'TRY-' + Z.VKEY[who] + (ev === 'trial' ? '-a' : '-b'); return Z.sayLine(k, 1); }
  var p = POOL[who] && POOL[who][ev]; if (!p) return false;
  var free = p.filter(function (id) { return !(G && G.v26 && G.v26.lines[id]); });
  if (!free.length) { if (ev === 'move' || ev === 'ult' || ev === 'idle') return false; free = p; }
  var id = free[Math.floor(Math.random() * free.length)];
  var prio = ev === 'ult' || ev === 'dead' || ev === 'win' || ev === 'lose' || ev === 'intro' || ev === 'shuka' ? 0.6 : 0;
  if (ev === 'move' && Math.random() < 0.55) return false;
  return Z.sayLine(id, prio);
};
// перепалки: пары персонажей, которые сейчас на поле
var DUOS = [
  { need: ['eskimo', 'plombir'], ids: ['DUO-21a', 'DUO-21b', 'DUO-21c'] }, { need: ['plombir', 'eskimo'], ids: ['DUO-22a', 'DUO-22b'] }, { need: ['eskimo', 'plombir', 'sneg'], ids: ['DUO-23a', 'DUO-23b', 'DUO-23c'] }, { need: ['eskimo', 'moroz'], ids: ['DUO-24a', 'DUO-24b'] }, { need: ['koschei', 'eskimo'], ids: ['DUO-25a', 'DUO-25b'] },
  { need: ['yaga', 'emelya'], ids: ['DUO-01a', 'DUO-01b'] }, { need: ['kiki', 'kolobok'], ids: ['DUO-02a', 'DUO-02b'] }, { need: ['solovey', 'kot'], ids: ['DUO-03a', 'DUO-03b'] },
  { need: ['gorynych', 'plombir'], ids: ['DUO-04a', 'DUO-04b'] }, { need: ['giant', 'moroz'], ids: ['DUO-05a', 'DUO-05b'] }, { need: ['chariot', 'sneg'], ids: ['DUO-06a', 'DUO-06b'] },
  { need: ['koschei', 'vasilisa'], ids: ['DUO-07a', 'DUO-07b'] }, { need: ['leshy', 'belka'], ids: ['DUO-08a', 'DUO-08b'] }, { need: ['leshy', 'moroz'], ids: ['DUO-09a', 'DUO-09b'] },
  { need: ['kolobok', 'moroz'], ids: ['DUO-10a', 'DUO-10b', 'DUO-10c'] }, { need: ['sneg', 'plombir'], ids: ['DUO-11a', 'DUO-11b'] }, { need: ['vasilisa', 'emelya'], ids: ['DUO-12a', 'DUO-12b'] },
  { need: ['belka', 'kolobok'], ids: ['DUO-13a', 'DUO-13b', 'DUO-13c'] }, { need: ['kot', 'emelya'], ids: ['DUO-14a', 'DUO-14b'] }, { need: ['raz', 'emelya'], ids: ['DUO-15a', 'DUO-15b'] },
  { need: ['yaga', 'kot'], ids: ['DUO-16a', 'DUO-16b'] }, { need: ['plombir', 'solovey'], ids: ['DUO-17a', 'DUO-17b'] }, { need: ['moroz', 'sneg', 'plombir'], ids: ['DUO-18a', 'DUO-18b', 'DUO-18c'] },
  { need: ['gorynych', 'emelya'], ids: ['DUO-19a', 'DUO-19b', 'DUO-19c'] }, { need: ['witch', 'moroz'], ids: ['DUO-20a', 'DUO-20b'] }
];
function present(G, t) {
  if (Z.ALLIES[t]) return !!Z.unitOf(G, t);
  return G.enemies.some(function (e) { return !e.dead && e.type === t; });
}
Z.duoFor = function (a, b) {
  var G = Z.G; if (!G) return;
  var d = DUOS.filter(function (q) { return q.need.indexOf(a) >= 0 && q.need.indexOf(b) >= 0 && q.need.every(function (t) { return present(G, t); }) && !G.v26.lines[q.ids[0]]; })[0];
  if (d) Z.sayLine(d.ids[0], 0.3, d.ids.slice(1));
};
// отдельные строки текста (без голоса) — для английской версии с выключенной озвучкой работает так же

// ---------- тик перепалок и событий ----------
Z.banterTick = function (G, dt) {
  var v = G.v26;
  if (SUB.t > 0) SUB.t -= dt;
  if (!v.started && (G.phase === 'wave' || G.phase === 'escortRun')) {
    v.started = 1;
    // вступление нового героя или фраза командира
    var nu = (G.squad || []).filter(function (U) { return Z.ALLIES[U.type].unlock === G.idx; })[0];
    if (nu) Z.say(nu.type, POOL[nu.type].intro ? 'intro' : 'start');
    else if (G.squad && G.squad.length) {
      // 2.12.20: фраза в начале уровня не повторяется от уровня к уровню (раньше Снегурочка каждый раз говорила «мы в эфире»):
      // берём героя, у которого есть ещё не звучавшая в этот раз фраза; когда все прозвучали — молчим, а не повторяем
      var SS = Z._startSaid || (Z._startSaid = {}), opts = [];
      G.squad.forEach(function (U) { var ev = G.L.type === 'escort' && U.type === 'sneg' ? 'escort' : 'start', L = (POOL[U.type] || {})[ev] || []; L.forEach(function (id) { if (!SS[id]) opts.push(id); }); });
      if (opts.length) { var pid = opts[Math.floor(Math.random() * opts.length)]; if (Z.sayLine(pid, 0)) SS[pid] = 1; }
    }
    var mod = Z.LEVEL_MOD[G.idx]; var AN = { fast: 'ANO-01', armor: 'ANO-02', elite: 'ANO-04', air: 'ANO-05', build: 'ANO-06' };
    if (mod && AN[mod]) setTimeout(function () { Z.sayLine(AN[mod], 0.8); }, 3500);
    if (G.mut && G.mut.swarm) Z.sayLine('ANO-03', 0.5);
    Z.preloadVoices(Object.keys(Z.VL).filter(function (id) { return /^(DUO|RAZ|ENO|SOL|YAG|LES|KIK)/.test(id); }).slice(0, 40));
  }
  // события
  var squadDead = (G.squad || []).filter(function (U) { return U.dead; }).map(function (U) { return U.type; });
  (v.deadPrev || []).forEach(function (t) { if (squadDead.indexOf(t) < 0) Z.say(t, 'back'); });
  squadDead.forEach(function (t) { if ((v.deadPrev || []).indexOf(t) < 0) Z.say(t, 'dead'); });
  v.deadPrev = squadDead;
  var tw = Object.keys(G.towers).length; if (v.twPrev !== undefined && tw < v.twPrev && G.phase === 'wave') { var sp = Z.unitOf(G, 'moroz') ? 'moroz' : 'sneg'; Z.say(sp, 'towerLost'); } v.twPrev = tw;
  if (G.L.type !== 'escort') { if (v.hpPrev !== undefined && G.hp < v.hpPrev && G.hp < G.hpMax * 0.5 && !v.fortSaid) { v.fortSaid = 1; Z.say('moroz', 'fortHit'); } v.hpPrev = G.hp; }
  else if (G.sleigh && v.slPrev !== undefined && G.sleigh.hp < v.slPrev - 5 && Math.random() < 0.3) Z.say('sneg', 'sleighHit'); if (G.sleigh) v.slPrev = G.sleigh.hp;
  if (G.waves && G.wave === G.waves.length && G.phase === 'wave' && !v.lastSaid) { v.lastSaid = 1; Z.say('moroz', 'lastWave'); }
  // враги
  G.enemies.forEach(function (e) {
    if (e.dead || e.v26s) return; e.v26s = 1;
    var t = e.type;
    if (t === 'raz') { if (Math.random() < 0.35) { if (S().bellGag && !v.gag && Math.random() < 0.5) { v.gag = 1; Z.sayLine('RAZ-04a', 0.5, ['RAZ-04b', '#bell', 'RAZ-04c']); } else if (!v.r12 && Math.random() < 0.3) { v.r12 = 1; Z.sayLine('RAZ-12a', 0.4, ['RAZ-12b', 'RAZ-12c']); } else Z.sayLine(['RAZ-01', 'RAZ-02', 'RAZ-05', 'RAZ-07', 'RAZ-08', 'RAZ-09', 'RAZ-10', 'RAZ-11'][Math.floor(Math.random() * 8)], 0); } }
    else if (t === 'yaga') Z.sayLine('YAG-01', 0.4);
    else if (t === 'leshy') Z.sayLine('LES-01', 0.2);
    else if (t === 'kiki') Z.sayLine('KIK-01', 0.2);
    else if (t === 'giant') Z.sayLine('GIA-01', 1);
    else if (t === 'chariot') Z.sayLine('MET-01', 1);
    else if (t === 'gorynych') Z.sayLine('GOR-01', 1, ['GOR-03']);
    else if (t === 'koschei' && G.info.region === 4) Z.sayLine('KOS-08', 1);
    else if ((t === 'raccoon' || t === 'thrower') && Math.random() < 0.08) Z.sayLine(Math.random() < 0.5 ? 'ENO-01' : 'ENO-02', 0);
    else if ((t === 'engineer' || t === 'sculptor') && Math.random() < 0.3) Z.sayLine(t === 'engineer' ? 'ENO-03' : 'ENO-04', 0);
  });
  // перепалки в бою раз в 20–35 с
  v.duoT = (v.duoT === undefined ? 14 : v.duoT) - dt;
  if (v.duoT <= 0 && (G.phase === 'wave' || G.phase === 'escortRun' || G.phase === 'between')) {
    v.duoT = 20 + Math.random() * 15;
    var opts = DUOS.filter(function (q) { return !v.lines[q.ids[0]] && q.need.every(function (t) { return present(G, t); }); });
    if (opts.length) { var d = opts[Math.floor(Math.random() * opts.length)]; Z.sayLine(d.ids[0], 0.3, d.ids.slice(1)); }
    else if (G.phase === 'between' && G.squad && G.squad.length) { var U = G.squad[Math.floor(Math.random() * G.squad.length)]; Z.say(U.type, 'idle'); }
  }
  // боссы на половине здоровья
  G.enemies.forEach(function (e) {
    if (!e.boss || e.dead || e.v26half || e.hp > e.max * 0.5) return; e.v26half = 1;
    if (e.type === 'chariot') Z.sayLine('MET-02', 1); else if (e.type === 'giant') Z.sayLine('GIA-02', 1); else if (e.type === 'koschei' && e.mortal) Z.sayLine('KOS-05', 1);
  });
};
var oldKill = Z.hk.kill;
Z.hk.kill = function (e) {
  if (oldKill) oldKill(e);
  if (e.boss) { AU.sfx('big_boom', 1); if (e.type === 'chariot') Z.sayLine('MET-03', 1); else if (e.type === 'giant') Z.sayLine('GIA-03', 1); }
  if (e.type === 'engineer' && Math.random() < 0.3) Z.sayLine('ENO-06', 0);
  if (e.type === 'raccoon' && Math.random() < 0.05) Z.sayLine('ENO-05', 0);
};
var oldDT = Z.damageTower;
Z.damageTower = function (tw, amt) { var G = Z.G, had = G && G.towers[Z.cellKey(tw.c, tw.r)]; var r = oldDT.apply(this, arguments); if (had && G && !G.towers[Z.cellKey(tw.c, tw.r)]) { AU.at(tw.c + 0.5, tw.r + 0.5); AU.sfx('tower_fall', 0.8); Z.fxBig && Z.fxBig(tw.c + 0.5, tw.r + 0.5, 0.8); } return r; };
var oldBuild = Z.buildTower;
Z.buildTower = function (type, c, r) { AU.at(c + 0.5, r + 0.5); return oldBuild.apply(this, arguments); };   // 2.11.5: звук постройки — из её клетки, без второго слоя
var oldWon = Z.levelWon, oldLost = Z.levelLost;
Z.levelWon = function () {
  var G = Z.G, first = G && G.phase !== 'won';
  var r = oldWon.apply(this, arguments);
  if (first && G) {
    AU.sfx('victory_sting', 0.8); Z.salute && Z.salute();
    var U = (G.squad || [])[Math.floor(Math.random() * Math.max(1, (G.squad || []).length))];
    if (G.L.type === 'escort') Z.say('sneg', 'escortWin'); else if (U) Z.say(U.type, 'win');
  }
  return r;
};
Z.levelLost = function () { var G = Z.G, first = G && G.phase !== 'lost'; var r = oldLost.apply(this, arguments); if (first) { AU.sfx('defeat_sting', 0.7); if (G && Z.unitOf(G, 'moroz')) Z.say('moroz', 'lose'); } return r; };

// позиции для объёмного звука
var oldBlast = Z.hk.blast;
Z.hk.blast = function (x, y, r, dmg, big) { AU.at(x, y); if (oldBlast) oldBlast(x, y, r, dmg, big); };
var oldKill2 = Z.hk.kill;
Z.hk.kill = function (e) { AU.at(e.x, e.y); if (oldKill2) oldKill2(e); };
var oldSpawn = Z.spawn;
Z.spawn = function (type) { var e = oldSpawn.apply(this, arguments); if (e && e.boss) { AU.at(e.x, e.y); AU.sfx('boss_horn', 0.8); if (type === 'gorynych') AU.sfx('dragon_roar', 0.8); } return e; };

// ---------- музыка: народные темы (мелодии — общественное достояние) ----------
var TH = Z.AU_THEMES;
if (TH) {
  // «Во поле берёза стояла» — лес
  TH.forest.mA = [[0, 0, 69, 1], [0, 1, 69, 0.5], [0, 1.5, 69, 0.5], [0, 2, 69, 1], [0, 3, 67, 1], [1, 0, 65, 1], [1, 1, 65, 1], [1, 2, 64, 1], [1, 3, 62, 1],
    [2, 0, 69, 1], [2, 1, 69, 0.5], [2, 1.5, 69, 0.5], [2, 2, 69, 1], [2, 3, 67, 1], [3, 0, 65, 1], [3, 1, 65, 1], [3, 2, 64, 1], [3, 3, 62, 1],
    [4, 0, 65, 1], [4, 1, 67, 1], [4, 2, 69, 2], [5, 0, 67, 1], [5, 1, 65, 1], [5, 2, 64, 1], [5, 3, 62, 1], [6, 0, 64, 1], [6, 1, 65, 1], [6, 2, 67, 1], [6, 3, 64, 1], [7, 0, 64, 2], [7, 2, 61, 2]];
  // «Ах вы, сени» — деревня
  TH.village.mA = [[0, 0, 62, 0.5], [0, 0.5, 65, 0.5], [0, 1, 69, 1], [0, 2, 69, 0.5], [0, 2.5, 67, 0.5], [0, 3, 65, 1], [1, 0, 69, 0.5], [1, 0.5, 72, 0.5], [1, 1, 72, 1], [1, 2, 69, 1], [1, 3, 65, 1],
    [2, 0, 67, 0.5], [2, 0.5, 64, 0.5], [2, 1, 60, 1], [2, 2, 64, 1], [2, 3, 67, 1], [3, 0, 65, 1], [3, 1, 64, 0.5], [3, 1.5, 62, 0.5], [3, 2, 62, 2],
    [4, 0, 62, 0.5], [4, 0.5, 65, 0.5], [4, 1, 69, 1], [4, 2, 69, 0.5], [4, 2.5, 67, 0.5], [4, 3, 65, 1], [5, 0, 72, 1], [5, 1, 69, 1], [5, 2, 65, 1], [5, 3, 69, 1],
    [6, 0, 64, 1], [6, 1, 61, 1], [6, 2, 64, 1], [6, 3, 69, 1], [7, 0, 62, 3]];
  // «Вдоль по матушке по Волге» — озеро
  TH.lake.mA = [[0, 0, 69, 2], [0, 2, 74, 2], [1, 0, 74, 1], [1, 1, 72, 1], [1, 2, 70, 2], [2, 0, 70, 1], [2, 1, 69, 1], [2, 2, 67, 2], [3, 0, 69, 4],
    [4, 0, 65, 1], [4, 1, 69, 1], [4, 2, 74, 2], [5, 0, 72, 1], [5, 1, 69, 1], [5, 2, 65, 2], [6, 0, 67, 1], [6, 1, 70, 1], [6, 2, 69, 1], [6, 3, 67, 1], [7, 0, 69, 2], [7, 2, 73, 2]];
  // «Эй, ухнем!» — горы
  TH.mount.mA = [[0, 0, 69, 1], [0, 1, 69, 1], [0, 2, 74, 2], [1, 0, 69, 1], [1, 1, 69, 1], [1, 2, 74, 2], [2, 0, 74, 1], [2, 1, 77, 1], [2, 2, 76, 1], [2, 3, 74, 1], [3, 0, 72, 1], [3, 1, 76, 1], [3, 2, 74, 1], [3, 3, 72, 1],
    [4, 0, 69, 1], [4, 1, 69, 1], [4, 2, 74, 2], [5, 0, 69, 1], [5, 1, 69, 1], [5, 2, 74, 2], [6, 0, 70, 1], [6, 1, 67, 1], [6, 2, 70, 1], [6, 3, 67, 1], [7, 0, 64, 2], [7, 2, 69, 2]];
  // «В лесу родилась ёлочка» (мелодия Л. Бекмана) — полюс
  TH.pole.mA = [[0, 0, 60, 0.5], [0, 0.5, 65, 0.5], [0, 1, 65, 0.5], [0, 1.5, 64, 0.5], [0, 2, 65, 0.5], [0, 2.5, 60, 0.5], [0, 3, 60, 1], [1, 0, 60, 0.5], [1, 0.5, 65, 0.5], [1, 1, 65, 0.5], [1, 1.5, 67, 0.5], [1, 2, 69, 2],
    [2, 0, 69, 0.5], [2, 0.5, 74, 0.5], [2, 1, 74, 0.5], [2, 1.5, 72, 0.5], [2, 2, 74, 0.5], [2, 2.5, 69, 0.5], [2, 3, 69, 1], [3, 0, 69, 0.5], [3, 0.5, 67, 0.5], [3, 1, 65, 0.5], [3, 1.5, 64, 0.5], [3, 2, 65, 2],
    [4, 0, 60, 0.5], [4, 0.5, 65, 0.5], [4, 1, 65, 0.5], [4, 1.5, 64, 0.5], [4, 2, 65, 0.5], [4, 2.5, 60, 0.5], [4, 3, 60, 1], [5, 0, 60, 0.5], [5, 0.5, 65, 0.5], [5, 1, 65, 0.5], [5, 1.5, 67, 0.5], [5, 2, 69, 2],
    [6, 0, 70, 0.5], [6, 0.5, 69, 0.5], [6, 1, 67, 0.5], [6, 1.5, 65, 0.5], [6, 2, 64, 1], [6, 3, 67, 1], [7, 0, 65, 3]];
  // «Калинка» (И. Ларионов, 1860) — карта мира
  TH.map.mA = TH.map.mB = [[0, 0, 69, 0.5], [0, 0.5, 67, 0.5], [0, 1, 65, 1], [0, 2, 69, 0.5], [0, 2.5, 67, 0.5], [0, 3, 65, 1], [1, 0, 69, 0.5], [1, 0.5, 67, 0.5], [1, 1, 65, 0.5], [1, 1.5, 64, 0.5], [1, 2, 62, 2],
    [2, 0, 62, 0.5], [2, 0.5, 65, 0.5], [2, 1, 70, 1], [2, 2, 70, 0.5], [2, 2.5, 69, 0.5], [2, 3, 67, 1], [3, 0, 67, 1], [3, 1, 64, 1], [3, 2, 60, 2],
    [4, 0, 72, 1], [4, 1, 72, 1], [4, 2, 69, 1], [4, 3, 65, 1], [5, 0, 74, 1], [5, 1, 74, 1], [5, 2, 69, 1], [5, 3, 65, 1], [6, 0, 67, 0.5], [6, 0.5, 69, 0.5], [6, 1, 70, 1], [6, 2, 69, 1], [6, 3, 67, 1], [7, 0, 64, 1], [7, 1, 67, 1], [7, 2, 72, 2]];
}

// голоса союзников-новичков для старых «бормотаний»
if (Z.AU_VOICES) Object.assign(Z.AU_VOICES, {
  emelya: { n: 2, gap: 0.2, dur: 0.2, f: [160, 130], form: [500, 1100], wave: 'triangle', vib: 6, vol: 0.9 },
  kolobok: { n: 4, gap: 0.06, dur: 0.06, f: [700, 1000], form: [1500], wave: 'square', vib: 30, vol: 0.6 },
  vasilisa: { n: 3, gap: 0.12, dur: 0.1, f: [700, 900], form: [1200, 2600], wave: 'triangle', vib: 8, vol: 0.8 },
  kot: { n: 1, gap: 0, dur: 0.5, f: [220, 180], form: [600, 1200], wave: 'sawtooth', vib: 22, vol: 0.6 },
  leshy: { n: 1, gap: 0, dur: 0.6, f: [90, 70], form: [400, 800], wave: 'sawtooth', vib: 8, noise: 600 },
  raz: { n: 2, gap: 0.12, dur: 0.12, f: [300, 380], form: [800, 1700], wave: 'sawtooth', vib: 10 },
  yaga: { n: 3, gap: 0.1, dur: 0.12, f: [600, 800], form: [1000, 2400], wave: 'sawtooth', vib: 12 },
  kiki: { n: 3, gap: 0.08, dur: 0.08, f: [500, 700], form: [900], wave: 'sine', vib: 25 },
  solovey: { n: 1, gap: 0, dur: 0.4, f: [1800, 2600], form: [3000], wave: 'sine', vib: 30 },
  hare: { n: 2, gap: 0.08, dur: 0.05, f: [1500, 1900], form: [2500], wave: 'sine' }, duck: { n: 2, gap: 0.12, dur: 0.12, f: [400, 300], form: [900, 1800], wave: 'sawtooth' },
  gorynych: { n: 3, gap: 0.25, dur: 0.5, f: [90, 60], form: [350, 700], wave: 'sawtooth', vib: 6, noise: 500, vol: 1.2 },
  koschei: { n: 2, gap: 0.2, dur: 0.25, f: [220, 160], form: [700, 1500], wave: 'sawtooth', vib: 5, vol: 1.1 }
});
})();
