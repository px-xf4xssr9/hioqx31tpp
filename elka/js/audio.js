/* Адаптивная оркестровая музыка (сэмплы VSCO 2 CE, CC0) и звуковые эффекты */
(function () {
'use strict';
var Z = window.Z;
var BPM = 96, BEAT = 60 / BPM, STEP = BEAT / 4;

// аккорды: бас, голоса пэда, тона для арпеджио
var CH = {
  Dm: { b: 38, pad: [50, 57, 62, 65], t: [62, 65, 69, 74], top: 74 },
  Bb: { b: 34, pad: [50, 58, 62, 65], t: [58, 62, 65, 70], top: 74 },
  F:  { b: 41, pad: [48, 57, 60, 65], t: [60, 65, 69, 72], top: 72 },
  C:  { b: 36, pad: [48, 55, 60, 64], t: [60, 64, 67, 72], top: 72 },
  Gm: { b: 43, pad: [50, 55, 62, 67], t: [62, 67, 70, 74], top: 74 },
  A:  { b: 45, pad: [49, 57, 61, 64], t: [61, 64, 69, 73], top: 73 },
  Eb: { b: 39, pad: [51, 55, 58, 63], t: [58, 63, 67, 70], top: 70 }
};
var PROG = {
  A: ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A'],
  B: ['Bb', 'C', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'],
  boss: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Eb', 'Gm', 'A']
};
// героическая тема валторн [такт, доля, нота, длительность в долях]
var MEL_A = [[0, 0, 62, 1.5], [0, 1.5, 64, 0.5], [0, 2, 65, 1], [0, 3, 69, 1], [1, 0, 70, 2], [1, 2, 69, 1], [1, 3, 65, 1],
  [2, 0, 69, 1.5], [2, 1.5, 67, 0.5], [2, 2, 65, 1], [2, 3, 64, 1], [3, 0, 64, 3], [3, 3, 60, 1],
  [4, 0, 62, 1.5], [4, 1.5, 64, 0.5], [4, 2, 65, 1], [4, 3, 69, 1], [5, 0, 74, 2], [5, 2, 72, 1], [5, 3, 70, 1],
  [6, 0, 70, 1.5], [6, 1.5, 69, 0.5], [6, 2, 67, 2], [7, 0, 69, 4]];
var MEL_B = [[0, 0, 65, 2], [0, 2, 70, 2], [1, 0, 72, 3], [1, 3, 67, 1], [2, 0, 69, 1.5], [2, 1.5, 70, 0.5], [2, 2, 72, 2], [3, 0, 74, 4],
  [4, 0, 70, 2], [4, 2, 74, 2], [5, 0, 76, 3], [5, 3, 72, 1], [6, 0, 73, 2], [6, 2, 76, 2], [7, 0, 73, 4]];
var MEL_BOSS = [[0, 0, 62, 2], [0, 2, 61, 1], [0, 3, 62, 1], [1, 0, 65, 2], [1, 2, 64, 1], [1, 3, 62, 1], [2, 0, 70, 2], [2, 2, 69, 2], [3, 0, 69, 4],
  [4, 0, 62, 2], [4, 2, 61, 1], [4, 3, 62, 1], [5, 0, 67, 2], [5, 2, 65, 2], [6, 0, 67, 2], [6, 2, 70, 2], [7, 0, 69, 4]];

// темы регионов: транспонирование, темп, гармония, мелодии, характер
var MEL_P = [[0, 0, 65, 1], [0, 1, 69, 1], [0, 2, 72, 2], [1, 0, 72, 1.5], [1, 1.5, 70, 0.5], [1, 2, 67, 2], [2, 0, 69, 1], [2, 1, 70, 1], [2, 2, 74, 2], [3, 0, 74, 4],
  [4, 0, 65, 1], [4, 1, 69, 1], [4, 2, 72, 1], [4, 3, 77, 1], [5, 0, 76, 2], [5, 2, 72, 2], [6, 0, 74, 1.5], [6, 1.5, 72, 0.5], [6, 2, 70, 2], [7, 0, 72, 3], [7, 3, 67, 1]];
var MEL_MAP = [[0, 0, 69, 2], [0, 2, 72, 2], [1, 0, 74, 3], [1, 3, 69, 1], [2, 0, 70, 2], [2, 2, 74, 2], [3, 0, 72, 4], [4, 0, 77, 2], [4, 2, 76, 1], [4, 3, 74, 1], [5, 0, 74, 2], [5, 2, 69, 2], [6, 0, 70, 2], [6, 2, 67, 2], [7, 0, 72, 4]];
var MEL_V = [[0, 0, 62, 0.5], [0, 0.5, 65, 0.5], [0, 1, 69, 1], [0, 2, 69, 0.5], [0, 2.5, 67, 0.5], [0, 3, 65, 1], [1, 0, 65, 0.5], [1, 0.5, 69, 0.5], [1, 1, 72, 1], [1, 2, 72, 0.5], [1, 2.5, 70, 0.5], [1, 3, 69, 1],
  [2, 0, 67, 0.5], [2, 0.5, 64, 0.5], [2, 1, 67, 1], [2, 2, 72, 1], [2, 3, 67, 1], [3, 0, 69, 1], [3, 1, 65, 1], [3, 2, 62, 2],
  [4, 0, 62, 0.5], [4, 0.5, 65, 0.5], [4, 1, 69, 1], [4, 2, 69, 0.5], [4, 2.5, 67, 0.5], [4, 3, 65, 1], [5, 0, 72, 0.5], [5, 0.5, 74, 0.5], [5, 1, 72, 1], [5, 2, 69, 1], [5, 3, 65, 1],
  [6, 0, 69, 1], [6, 1, 67, 0.5], [6, 1.5, 64, 0.5], [6, 2, 61, 1], [6, 3, 64, 1], [7, 0, 62, 3]];
var MEL_L = [[0, 0, 69, 4], [1, 0, 70, 2], [1, 2, 74, 2], [2, 0, 74, 3], [2, 3, 70, 1], [3, 0, 69, 4], [4, 0, 74, 2], [4, 2, 72, 1], [4, 3, 69, 1], [5, 0, 72, 4], [6, 0, 74, 2], [6, 2, 70, 2], [7, 0, 73, 4]];
var MEL_M = [[0, 0, 62, 1], [0, 1, 62, 0.5], [0, 1.5, 62, 0.5], [0, 2, 65, 1], [0, 3, 62, 1], [1, 0, 69, 3], [1, 3, 67, 1], [2, 0, 65, 2], [2, 2, 62, 2], [3, 0, 64, 4],
  [4, 0, 62, 1], [4, 1, 62, 0.5], [4, 1.5, 62, 0.5], [4, 2, 65, 1], [4, 3, 69, 1], [5, 0, 74, 3], [5, 3, 72, 1], [6, 0, 70, 2], [6, 2, 67, 2], [7, 0, 69, 4]];
var MEL_F = [[0, 0, 69, 1], [0, 1, 74, 1], [0, 2, 72, 0.5], [0, 2.5, 70, 0.5], [0, 3, 69, 1], [1, 0, 70, 1.5], [1, 1.5, 74, 0.5], [1, 2, 77, 2], [2, 0, 72, 1], [2, 1, 69, 1], [2, 2, 65, 2], [3, 0, 67, 1], [3, 1, 64, 1], [3, 2, 72, 2],
  [4, 0, 74, 1], [4, 1, 72, 0.5], [4, 1.5, 70, 0.5], [4, 2, 69, 1], [4, 3, 65, 1], [5, 0, 65, 1], [5, 1, 70, 1], [5, 2, 74, 2], [6, 0, 74, 1], [6, 1, 72, 1], [6, 2, 70, 1], [6, 3, 67, 1], [7, 0, 69, 3], [7, 3, 73, 1]];
// lead — ведущий инструмент темы, ost — рисунок остинато, kit — характер ударных
var THEMES = {
  forest:  { tr: 0,  bpm: 92,  A: PROG.A, B: PROG.B, boss: PROG.boss, mA: MEL_F, mB: MEL_A, lead: 'hn_sus', lead2: 'hrp', ost: [0, 0, 7, 0, 0, 0, 7, 12], kit: 'march' },
  village: { tr: -7, bpm: 108, A: ['Dm', 'F', 'C', 'Dm', 'Dm', 'F', 'A', 'Dm'], B: PROG.A, boss: PROG.boss, mA: MEL_V, mB: MEL_F, folk: true, lead: 'vln_spic', lead2: 'glk', ost: [0, 7, 0, 7, 0, 7, 12, 7], kit: 'polka' },
  lake:    { tr: -2, bpm: 80,  A: ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'F', 'Bb', 'A'], B: PROG.B, boss: PROG.boss, mA: MEL_L, mB: MEL_B, soft: true, lead: 'glk', lead2: 'vln_sus', ost: [0, 12, 7, 12, 0, 12, 7, 15], kit: 'soft' },
  mount:   { tr: -3, bpm: 90,  A: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Eb', 'A'], B: PROG.boss, boss: PROG.boss, mA: MEL_M, mB: MEL_BOSS, heavy: true, lead: 'tbn_sus', lead2: 'hn_sus', ost: [0, 0, 0, 3, 0, 0, 5, 3], kit: 'war' },
  pole:    { tr: 0,  bpm: 100, A: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C'], B: PROG.A, boss: PROG.boss, mA: MEL_P, mB: MEL_A, lead: 'tpt_sus', lead2: 'hn_sus', ost: [0, 7, 12, 7, 0, 7, 12, 16], kit: 'march' },
  map:     { tr: 0,  bpm: 86,  A: ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Gm', 'C'], B: ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Gm', 'C'], boss: PROG.boss, mA: MEL_MAP, mB: MEL_MAP, lead: 'hrp', lead2: 'glk', ost: [0, 7, 12, 7, 0, 7, 12, 7], kit: 'soft' },
  witch:   { tr: 1,  bpm: 112, A: ['Dm', 'Eb', 'Dm', 'A', 'Gm', 'Eb', 'A', 'A'], B: PROG.boss, boss: ['Dm', 'Eb', 'Dm', 'A', 'Gm', 'Eb', 'A', 'A'], mA: MEL_BOSS, mB: MEL_BOSS, heavy: true, lead: 'tbn_sus', lead2: 'vln_sus', ost: [0, 1, 0, 1, 0, 1, 3, 1], kit: 'war' }
};
var VOICES = {
  raccoon:  { n: 4, gap: 0.075, dur: 0.065, f: [950, 1400], form: [1400, 2600], wave: 'sawtooth', vib: 25 },
  engineer: { n: 3, gap: 0.1, dur: 0.08, f: [700, 900], form: [1200, 2400], wave: 'square', vib: 18 },
  sculptor: { n: 2, gap: 0.15, dur: 0.13, f: [420, 620], form: [800, 1800], wave: 'sawtooth', vib: 12 },
  thrower:  { n: 2, gap: 0.12, dur: 0.1, f: [700, 1100], form: [1100, 2400], wave: 'sawtooth' },
  splitkid: { n: 2, gap: 0.08, dur: 0.07, f: [500, 900], form: [900], wave: 'sine', vib: 30 },
  split:    { n: 1, gap: 0, dur: 0.3, f: [260, 520], form: [700, 1400], wave: 'triangle', vib: 18 },
  icicle:   { n: 3, gap: 0.05, dur: 0.05, f: [2600, 3400], form: [3000], wave: 'sine' },
  fat:      { n: 1, gap: 0, dur: 0.35, f: [120, 78], form: [450, 900], wave: 'sawtooth', vib: 9 },
  crow:     { n: 2, gap: 0.22, dur: 0.18, f: [620, 430], form: [1250, 2300], wave: 'sawtooth' },
  sled:     { n: 1, gap: 0, dur: 0.45, f: [70, 95], form: [300, 900], wave: 'sawtooth', vib: 22, noise: 900, vol: 0.7 },
  ram:      { n: 1, gap: 0, dur: 0.5, f: [55, 80], form: [250, 700], wave: 'sawtooth', vib: 14, noise: 600 },
  plow:     { n: 1, gap: 0, dur: 0.7, f: [45, 60], form: [200, 600], wave: 'sawtooth', vib: 11, noise: 500 },
  giant:    { n: 1, gap: 0, dur: 1.1, f: [85, 55], form: [350, 700, 1100], wave: 'sawtooth', vib: 6, noise: 400, vol: 1.3, sub: 70 },
  chariot:  { n: 2, gap: 0.3, dur: 0.4, f: [180, 120], form: [500, 1300], wave: 'sawtooth', vib: 8, noise: 700 },
  witch:    { n: 4, gap: 0.16, dur: 0.13, f: [520, 700], form: [900, 2200], wave: 'sawtooth', vib: 7, vol: 1.2 },
  // союзники: «Хо-хо-хо» Деда Мороза, звонкая Снегурочка, цокот Белки, басовитый Пломбир
  moroz:    { n: 3, gap: 0.16, dur: 0.14, f: [150, 120], form: [600, 1000], wave: 'sawtooth', vib: 5, vol: 1.1, sub: 90 },
  sneg:     { n: 3, gap: 0.11, dur: 0.1, f: [880, 1180], form: [1300, 2900], wave: 'triangle', vib: 9, vol: 0.9 },
  belka:    { n: 5, gap: 0.05, dur: 0.04, f: [1800, 2400], form: [2600], wave: 'square', vib: 40, vol: 0.7 },
  plombir:  { n: 2, gap: 0.2, dur: 0.22, f: [100, 140], form: [400, 800], wave: 'triangle', vib: 7, vol: 1.1, sub: 60 }
};
Z.AU_THEMES = THEMES; Z.AU_VOICES = VOICES;
var AU = Z.AU = {
  theme: THEMES.map, themeId: 'map', pendingTheme: null, tr: 0,
  boost: 0,
  setTheme: function (id) { if (!THEMES[id]) return; if (id === this.themeId && !this.pendingTheme) { this.applyBpm(); return; } this.pendingTheme = id; this.themeAt = this.ctx ? this.ctx.currentTime : 0; },
  // нарастание: каждый следующий уровень региона звучит плотнее и чуть быстрее (0..1)
  setBoost: function (k) { this.boost = Math.max(0, Math.min(1, k)); this.applyBpm(); },
  applyBpm: function () { if (this.pendingTheme) return; var th = this.theme; if (!th) return; var nb = th.bpm + Math.round(this.boost * 8); if (nb !== BPM && this.ctx) this.pendingBpm = nb; },
  themeName: function () { return this.themeId; },
  ctx: null, ready: false, bufs: {}, inst: {}, layers: {}, step: 0, nextT: 0, started: false,
  state: 'map', intensity: 0, musicVol: 0.7, sfxVol: 0.9, lastPlay: {}, phrase: 0, section: 'A', songT0: 0,
  init: function () {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || this.ctx) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    var c = this.ctx;
    this.comp = c.createDynamicsCompressor();
    try { this.comp.threshold.value = -20; this.comp.knee.value = 8; this.comp.ratio.value = 8; this.comp.attack.value = 0.003; this.comp.release.value = 0.25; } catch (e) { if (window.__rep) window.__rep(e); }
    this.lim = c.createDynamicsCompressor();
    try { this.lim.threshold.value = -4; this.lim.knee.value = 0; this.lim.ratio.value = 20; this.lim.attack.value = 0.001; this.lim.release.value = 0.1; } catch (e) { if (window.__rep) window.__rep(e); }
    this.limG = c.createGain(); this.limG.gain.value = 0.89;
    this.comp.connect(this.lim); this.lim.connect(this.limG); this.limG.connect(c.destination);
    this.master = c.createGain(); this.master.gain.value = 0.62; this.master.connect(this.comp);
    this.musG = c.createGain(); this.musG.gain.value = this.musicVol * 0.9; this.musG.connect(this.master);
    this.sfxG = c.createGain(); this.sfxG.gain.value = this.sfxVol; this.sfxG.connect(this.master);
    // ревербератор «большого зала»
    this.rev = c.createConvolver();
    var len = Math.floor(c.sampleRate * 2.6), ir = c.createBuffer(2, len, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch), y = 0; for (var i = 0; i < len; i++) { var k = i / len, a = 0.55 - 0.47 * Math.sqrt(k); y += a * ((Math.random() * 2 - 1) - y); d[i] = y * Math.pow(1 - k, 2.6) * (1.2 + k * 1.4); } }   // 2.11.5: хвост темнеет к концу (раньше белый шум — «шипение дождя» под каждым звуком)
    this.rev.buffer = ir;
    this.revG = c.createGain(); this.revG.gain.value = 0.32; this.rev.connect(this.revG); this.revG.connect(this.master);
    // 2.11.5: эхо музыки идёт через свою громкость — при музыке «0» тишина полная (раньше в зал уходил хвост)
    this.musRev = c.createGain(); this.musRev.gain.value = this.musicVol / 0.7; this.musRev.connect(this.rev);
    var self = this;
    ['pad', 'bass', 'harp', 'glock', 'bells', 'ost', 'drums', 'vln', 'horn', 'tuba', 'tpt', 'tbn', 'perc', 'sting'].forEach(function (n) {
      var g = c.createGain(); g.gain.value = 0; g.connect(self.musG);
      var s = c.createGain(); s.gain.value = n === 'drums' || n === 'tuba' ? 0.12 : 0.35; g.connect(s); s.connect(self.musRev);
      self.layers[n] = g;
    });
    this.layers.sting.gain.value = 1; this.layers.perc.gain.value = 1;
    var nb = c.createBuffer(1, c.sampleRate, c.sampleRate), nd = nb.getChannelData(0);
    for (var k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;
    this.noise = nb;
    this.load();
  },
  load: function () {
    var A = window.ASSETS, self = this, c = this.ctx, pending = 0;
    self.total = 0; self.loaded = 0;
    function get(url, name) {
      pending++; self.total++;
      fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (ab) {
        c.decodeAudioData(ab, function (b) { self.bufs[name] = b; pending--; self.loaded++; if (!pending) self.ready = true; }, function () { pending--; self.loaded++; if (!pending) self.ready = true; });
      }).catch(function () { pending--; self.loaded++; if (!pending) self.ready = true; });
    }
    for (var inst in A.music) {
      if (inst === 'perc') { A.music.perc.forEach(function (p) { get('music/' + p + '.mp3', p); }); continue; }
      this.inst[inst] = A.music[inst];
      A.music[inst].forEach(function (m) { get('music/' + inst + '_' + m + '.mp3', inst + '_' + m); });
    }
    A.sfx.forEach(function (s) { get('sfx/' + s + '.mp3', 'sfx_' + s); });
  },
  allowed: function () { return !Z.hidden && !Z.adShowing && !(Z.SDK && Z.SDK.sdkPaused); },
  unlock: function () { this.init(); this.resumeIfAllowed(); },
  resumeIfAllowed: function () {
    if (!this.ctx) return;
    try {
      if (this.allowed()) { if (this.ctx.state === 'suspended') this.ctx.resume(); }
      else if (this.ctx.state === 'running') this.ctx.suspend();
    } catch (e) { if (window.__rep) window.__rep(e); }
  },
  running: function () { return this.ctx && this.ctx.state === 'running'; },
  setVolumes: function (m, s) {
    this.musicVol = m; this.sfxVol = s;
    if (this.musG) this.musG.gain.setTargetAtTime(m * 0.9, this.ctx.currentTime, 0.05);
    if (this.sfxG) this.sfxG.gain.setTargetAtTime(s, this.ctx.currentTime, 0.05);
  },
  setState: function (state, intensity) { this.state = state; this.intensity = intensity; },

  // ---------- воспроизведение ----------
  note: function (inst, midi, t, vel, dur, layer, opts) {
    var list = this.inst[inst]; if (!list || !list.length) return;
    if (!(opts && opts.noTr)) midi += this.tr;
    var best = list[0];
    for (var i = 1; i < list.length; i++) if (Math.abs(list[i] - midi) < Math.abs(best - midi)) best = list[i];
    var buf = this.bufs[inst + '_' + best]; if (!buf) return;
    var c = this.ctx, src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf; src.playbackRate.value = Math.pow(2, (midi - best) / 12);
    var att = (opts && opts.att) || 0.01, rel = (opts && opts.rel) || 0.35;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + att);
    var end = t + Math.max(att + 0.02, dur);
    g.gain.setValueAtTime(vel, end); g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
    src.connect(g); g.connect(this.layers[layer]);
    src.start(t); src.stop(end + rel + 0.05);
    if (layer !== 'sting') { var A = this.active || (this.active = []); A.push({ g: g, src: src, end: end + rel }); if (A.length > 160) this.active = A.filter(function (q) { return q.end > c.currentTime; }); }
  },
  // при смене темы глушим всё, что ещё звучит и запланировано, — без наслоения
  cutMusic: function (t) {
    var A = this.active || [], c = this.ctx;
    for (var i = 0; i < A.length; i++) { var q = A[i]; if (q.end < c.currentTime) continue; try { q.g.gain.cancelScheduledValues(t); q.g.gain.setValueAtTime(q.g.gain.value, t); q.g.gain.linearRampToValueAtTime(0.0001, t + 0.25); q.src.stop(t + 0.3); } catch (e) { if (window.__rep) window.__rep(e); } }
    this.active = [];
  },
  hit: function (name, t, vel, layer, rate) {
    var buf = this.bufs[name]; if (!buf) return;
    var c = this.ctx, src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf; if (rate) src.playbackRate.value = rate; g.gain.value = vel;
    src.connect(g); g.connect(this.layers[layer || 'perc']); src.start(t);
    var A = this.active || (this.active = []); A.push({ g: g, src: src, end: t + buf.duration });
  },

  // ---------- партитура ----------
  update: function () {
    if (!this.running() || !this.ready) return;
    var c = this.ctx;
    if (!this.started) { this.started = true; this.nextT = c.currentTime + 0.1; this.step = 0; this.songT0 = this.nextT; this.applyLayers(this.nextT, true); }
    if (this.nextT < c.currentTime - 0.5) { this.nextT = c.currentTime + 0.05; } // после паузы
    while (this.nextT < c.currentTime + 0.25) {
      if (this.pendingBpm && !this.pendingTheme && this.step % 16 === 0) { BPM = this.pendingBpm; BEAT = 60 / BPM; STEP = BEAT / 4; this.songT0 = this.nextT; this.step = 0; this.pendingBpm = 0; }
      if (this.pendingTheme && (this.step % 16 === 0 || this.ctx.currentTime - (this.themeAt || 0) > 0.6)) {
        this.cutMusic(this.ctx.currentTime); this.nextT = Math.max(this.nextT, this.ctx.currentTime + 0.3);
        var th = THEMES[this.pendingTheme]; this.themeId = this.pendingTheme; this.pendingTheme = null; this.theme = th;
        this.pendingBpm = 0; BPM = th.bpm + Math.round(this.boost * 8); BEAT = 60 / BPM; STEP = BEAT / 4; this.tr = th.tr; this.step = 0; this.songT0 = this.nextT; this.phrase = 0;
        if (this.state !== 'map') this.hit('swell', this.nextT, 0.25, 'perc');
      }
      this.schedule(this.step, this.nextT);
      this.nextT += STEP; this.step++;
    }
  },
  levels: function () {
    var s = this.state, i = this.intensity, v = {};
    var calm = s === 'map' || s === 'build' || s === 'comic';
    v.pad = calm ? 0.5 : 0.55; v.bass = calm ? 0.3 : 0.48;
    v.harp = calm ? 0.55 : (i < 0.45 ? 0.25 : 0);
    v.glock = calm ? 0.28 : 0.12; v.bells = calm ? 0.12 : 0.16;
    v.ost = calm ? (s === 'build' ? 0.18 : 0) : Math.min(0.7, 0.35 + i * 0.4);
    v.drums = calm ? (s === 'build' ? 0.15 : 0) : Math.min(0.75, 0.38 + i * 0.4);
    v.vln = !calm && (i > 0.42 || s === 'boss') ? 0.4 : 0;
    v.horn = !calm && (i > 0.38 || s === 'boss') ? 0.7 : (s === 'map' ? 0.25 : 0);
    v.tuba = !calm && i > 0.45 ? 0.55 : 0;
    v.tpt = (!calm && i > 0.72) || s === 'boss' ? 0.45 : 0;
    v.tbn = (!calm && i > 0.6) || s === 'boss' ? 0.5 : 0;
    var th = this.theme || {}, bo = this.boost || 0;
    if (!calm) {
      // чем дальше по региону — тем больше оркестра даже в спокойные моменты боя
      v.ost = Math.min(0.75, v.ost + bo * 0.2); v.drums = Math.min(0.8, v.drums + bo * 0.2);
      if (bo > 0.3) v.vln = Math.max(v.vln, 0.25 + bo * 0.15);
      if (bo > 0.5) { v.horn = Math.max(v.horn, 0.5); v.tuba = Math.max(v.tuba, 0.35); }
      if (bo > 0.8) { v.tbn = Math.max(v.tbn, 0.35); v.tpt = Math.max(v.tpt, 0.3); }
    } else if (s === 'build') { v.ost += bo * 0.15; v.drums += bo * 0.1; v.horn = Math.max(v.horn, bo * 0.3); }
    if (th.soft) { v.drums *= 0.65; v.glock *= 1.6; v.harp = Math.max(v.harp, 0.35); v.tpt *= 0.6; }
    if (th.folk) { v.bells *= 1.8; v.harp = Math.max(v.harp, calm ? 0.55 : 0.3); }
    if (th.heavy) { v.tuba = !calm ? Math.max(v.tuba, 0.5) : v.tuba; v.bass *= 1.15; }
    return v;
  },
  applyLayers: function (t, instant) {
    var v = this.levels();
    for (var n in v) { var g = this.layers[n]; if (!g) continue; if (instant) g.gain.setValueAtTime(v[n], t); else g.gain.setTargetAtTime(v[n], t, 0.6); }
    this.lastLevels = v;
  },
  schedule: function (step, t) {
    var sub = step % 4, beat = Math.floor(step / 4) % 4, bar = Math.floor(step / 16) % 8;
    var boss = this.state === 'boss', calm = this.state === 'map' || this.state === 'build' || this.state === 'comic';
    var i = this.intensity;
    if (step % 16 === 0) {
      this.applyLayers(t, false);
      if (bar === 0) {
        this.phrase++;
        this.section = boss ? 'boss' : (this.phrase % 3 === 0 ? 'B' : 'A');
        if (this.themeId === 'witch' && boss) this.section = 'boss';
        if (!calm && (i > 0.7 || boss)) this.hit('crash', t, 0.5);
        if (boss) this.hit('gong', t, 0.6);
      }
    }
    var TH = this.theme || THEMES.forest, prog = TH[this.section] || PROG[this.section], chord = CH[prog[bar]];
    // пэд струнных и бас — раз в такт
    if (step % 16 === 0) {
      var padV = calm ? 0.28 : 0.32;
      this.note('vc_sus', chord.pad[0], t, padV, BEAT * 4, 'pad', { att: calm ? 0.4 : 0.15, rel: 0.6 });
      this.note('vla_sus', chord.pad[1], t, padV, BEAT * 4, 'pad', { att: calm ? 0.4 : 0.15, rel: 0.6 });
      this.note('vln_sus', chord.pad[2], t, padV * 0.9, BEAT * 4, 'pad', { att: calm ? 0.45 : 0.15, rel: 0.6 });
      this.note('vln_sus', chord.pad[3], t, padV * 0.8, BEAT * 4, 'pad', { att: calm ? 0.5 : 0.15, rel: 0.6 });
      this.note('cb_sus', chord.b, t, 0.5, BEAT * 4, 'bass', { att: 0.08, rel: 0.5 });
      if (!calm) this.note('vc_sus', chord.b, t, 0.35, BEAT * 4, 'bass', { att: 0.05, rel: 0.4 });
      // тромбоны — мощные квинты
      this.note('tbn_sus', chord.b + 12, t, 0.45, BEAT * 3.8, 'tbn', { att: 0.06, rel: 0.4 });
      this.note('tbn_sus', chord.b + 19, t, 0.38, BEAT * 3.8, 'tbn', { att: 0.06, rel: 0.4 });
      // труба — верхний голос
      this.note('tpt_sus', chord.top, t, 0.35, BEAT * 3.8, 'tpt', { att: 0.08, rel: 0.4 });
    }
    // арфа — восьмые
    if (sub % 2 === 0) {
      var k = (beat * 2 + sub / 2) % 8, tones = chord.t;
      var n = tones[k % 4] - 12 + 12 * Math.floor(k / 4);
      this.note('hrp', n, t, 0.45, BEAT * 1.5, 'harp', { rel: 0.6 });
    }
    // колокольчики
    if ((beat === 0 || beat === 2) && sub === 0 && (calm || bar % 2 === 0)) {
      var gt = chord.t[(bar + beat) % 4] + 24;
      while (gt > 100) gt -= 12;
      this.note('glk', gt, t + (beat === 2 ? STEP * 2 : 0), 0.4, BEAT * 2, 'glock', { rel: 0.8 });
    }
    // бубенцы
    if (calm ? (sub === 0) : (sub === 2)) this.hit(step % 8 < 4 ? 'sleigh' : 'sleigh2', t, calm ? 0.35 : 0.45, 'bells');
    if (TH.folk && sub === 2 && !calm) this.hit('shake', t, 0.3, 'bells');
    if (TH.kit === 'polka' && !calm && sub === 0 && (beat === 1 || beat === 3)) this.hit('sn2', t, 0.3, 'drums');
    if (TH.kit === 'war' && !calm && sub === 0 && beat === 3) this.hit('timp4', t, 0.5, 'drums');
    if (TH.kit === 'march' && !calm && this.boost > 0.3 && sub === 2 && beat === 3) this.hit('sn', t, 0.3, 'drums');
    if (TH.kit === 'soft' && calm && sub === 0 && beat === 0 && bar % 2 === 0) this.note('glk', chord.t[0] + 24, t, 0.25, BEAT * 2, 'glock', { rel: 1 });
    if (TH.heavy && !calm && sub === 0 && beat === 2) this.hit('timp1', t, 0.45, 'drums');
    // остинато виолончелей — восьмые
    if (sub % 2 === 0) {
      var pat = TH.ost || [0, 0, 7, 0, 0, 0, 7, 12], e8 = (beat * 2 + sub / 2) % 8;
      this.note('vc_spic', chord.b + 12 + pat[e8], t, e8 % 4 === 0 ? 0.6 : 0.42, STEP * 1.6, 'ost', { rel: 0.12 });
    }
    // скрипки — шестнадцатые
    var vp = [0, 1, 2, 1];
    this.note('vln_spic', chord.t[vp[sub]] + (bar % 2 ? 12 : 0) - 12 + 12, t, sub === 0 ? 0.45 : 0.3, STEP * 0.9, 'vln', { rel: 0.08 });
    // туба — удары
    if ((beat === 0 && sub === 0) || (beat === 1 && sub === 2)) this.note('tba_stac', chord.b, t, 0.6, STEP * 3, 'tuba', { rel: 0.2 });
    // мелодия валторн
    var mel = this.section === 'boss' ? MEL_BOSS : this.section === 'B' ? TH.mB : TH.mA;
    for (var m = 0; m < mel.length; m++) {
      var mm = mel[m];
      if (mm[0] === bar && Math.round(mm[1] * 4) === beat * 4 + sub) {
        var low = boss || (TH.heavy && mm[2] > 66) ? -12 : 0;
        var ld = boss ? 'hn_sus' : (TH.lead || 'hn_sus');
        if (ld === 'vln_spic') { for (var rp = 0; rp < Math.max(1, Math.round(mm[3] * 2)); rp++) this.note('vln_spic', mm[2] + low, t + rp * BEAT * 0.5, 0.6, BEAT * 0.4, 'horn', { rel: 0.08 }); }
        else if (ld === 'glk' || ld === 'hrp') { this.note(ld, mm[2] + low + 12, t, 0.5, mm[3] * BEAT, 'horn', { rel: 0.9 }); this.note('vln_sus', mm[2] + low, t, 0.25, mm[3] * BEAT * 0.95, 'horn', { att: 0.12, rel: 0.4 }); }
        else this.note(ld, mm[2] + low - (ld === 'tbn_sus' ? 12 : 0), t, 0.55, mm[3] * BEAT * 0.95, 'horn', { att: 0.04, rel: 0.35 });
        if (TH.lead2 && !calm && (this.boost > 0.4 || this.intensity > 0.6)) this.note(TH.lead2, mm[2] + low + (TH.lead2 === 'glk' ? 12 : 0), t, 0.35, mm[3] * BEAT * 0.95, 'horn', { att: 0.05, rel: 0.4 });
        if (boss) this.note('tbn_sus', mm[2] - 12, t, 0.4, mm[3] * BEAT * 0.95, 'horn', { att: 0.04, rel: 0.3 });
      }
    }
    // ударные
    if (sub === 0 && (beat === 0 || beat === 2)) this.hit(beat === 0 ? 'bd' : 'bd2', t, 0.75, 'drums');
    if (!calm && i > 0.75 && sub === 2) this.hit('bd2', t, 0.4, 'drums');
    if (sub === 0 && beat === 0) this.hit(bar % 2 ? 'timp3' : 'timp2', t, 0.6, 'drums');
    if (!calm && (i > 0.42 || boss) && sub === 0 && (beat === 1 || beat === 3)) this.hit('sn', t, 0.5, 'drums');
    if (!calm && (i > 0.7 || boss) && bar === 7 && beat === 3) this.hit('sn2', t, 0.25 + sub * 0.1, 'drums');
    if (!calm && (i > 0.7 || boss) && bar === 7 && beat === 2 && sub === 0) this.hit('timproll', t, 0.5, 'drums');
    if (boss && bar === 7 && sub === 0) this.note('tbn_sus', chord.b + 12, t, 0.5, STEP * 2, 'tbn', { rel: 0.15 });
  },
  beatPhase: function () {
    if (!this.running() || !this.started) return 0;
    var x = (this.ctx.currentTime - this.songT0) / BEAT;
    return x - Math.floor(x);
  },
  grid: function (div) {
    // ближайшая будущая доля сетки (div: 4 — шестнадцатые, 2 — восьмые)
    if (!this.started) return this.ctx.currentTime;
    var g = BEAT / div, now = this.ctx.currentTime, x = (now - this.songT0) / g;
    return this.songT0 + Math.ceil(x + 0.02) * g;
  },

  // ---------- стинги ----------
  sting: function (kind) {
    if (!this.running() || !this.ready) return;
    var c = this.ctx, t = c.currentTime + 0.02, nb = this.grid(1);
    if (kind === 'wave') {
      this.hit('swell2', t, 0.35, 'sting');
      this.hit('timp1', nb, 0.8, 'sting'); this.hit('crash', nb, 0.35, 'sting');
      [50, 57, 62].forEach(function (n) { AU.note('hn_sus', n, nb, 0.5, BEAT * 1.5, 'sting', { att: 0.02 }); });
      this.note('tbn_sus', 38 + 12, nb, 0.5, BEAT * 1.5, 'sting', { att: 0.02 });
    } else if (kind === 'boss') {
      this.hit('gong', t, 0.9, 'sting'); this.hit('timp1', t, 1, 'sting'); this.hit('timp2', t + BEAT * 0.5, 0.9, 'sting');
      this.note('tbn_sus', 38, t, 0.7, BEAT * 3, 'sting', { att: 0.05 }); this.note('tba_stac', 26 + 12, t, 0.8, BEAT, 'sting');
      this.note('hn_sus', 50, t, 0.6, BEAT * 3, 'sting'); this.note('hn_sus', 53, t, 0.6, BEAT * 3, 'sting');
    } else if (kind === 'win') {
      this.hit('crash', t, 0.6, 'sting'); this.hit('timp1', t, 0.9, 'sting');
      [62, 66, 69, 74].forEach(function (n, k) { AU.note('hn_sus', n - 12, t, 0.55, BEAT * 4, 'sting', { att: 0.03, rel: 0.8 }); AU.note('tpt_sus', n, t + 0.02, 0.45, BEAT * 4, 'sting', { att: 0.03, rel: 0.8 }); });
      [74, 78, 81, 86, 90, 93].forEach(function (n, k) { AU.note('glk', n + 12, t + k * 0.09, 0.4, 1, 'sting', { rel: 0.8 }); AU.note('hrp', n - 12, t + k * 0.06, 0.4, 1, 'sting'); });
      this.note('cb_sus', 38, t, 0.6, BEAT * 4, 'sting', { rel: 0.8 });
    } else if (kind === 'lose') {
      this.hit('gong', t, 0.8, 'sting'); this.hit('timp4', t, 0.8, 'sting');
      this.note('vc_sus', 38, t, 0.5, BEAT * 5, 'sting', { att: 0.2, rel: 1 }); this.note('cb_sus', 38, t, 0.6, BEAT * 5, 'sting', { att: 0.2, rel: 1 });
      this.note('vla_sus', 53, t, 0.4, BEAT * 5, 'sting', { att: 0.3, rel: 1 }); this.note('hn_sus', 57, t + 0.1, 0.4, BEAT * 4, 'sting', { att: 0.3, rel: 1 });
    } else if (kind === 'waveEnd') {
      [62, 65, 69, 74, 77, 81].forEach(function (n, k) { AU.note('hrp', n, t + k * 0.05, 0.4, 1, 'sting'); });
      this.note('glk', 86, t + 0.3, 0.4, 1, 'sting');
    }
  },

  // ---------- эффекты ----------
  sfx: function (name, vol, opts) {
    if (!this.running()) return;
    opts = opts || {};
    var c = this.ctx, now = c.currentTime;
    var key = name + (opts.gapKey || '');
    if (opts.gap && this.lastPlay[key] && now - this.lastPlay[key] < opts.gap) return;
    this.lastPlay[key] = now;
    var buf = this.bufs['sfx_' + name] || this.bufs[name]; if (!buf) return;
    var t = opts.quant ? this.grid(opts.quant) : now;
    var src = c.createBufferSource(), g = c.createGain();
    src.buffer = buf; if (opts.pitch) src.playbackRate.value = opts.pitch;
    g.gain.value = vol === undefined ? 1 : vol;
    src.connect(g); g.connect(this.sfxG); src.start(t);
  },
  noiseHit: function (t, dur, f0, f1, vol, type) {
    var c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise;
    var f = c.createBiquadFilter(); f.type = type || 'lowpass';
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    var g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxG); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  tone: function (t, f0, f1, dur, vol, type) {
    var c = this.ctx, o = c.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.sfxG); o.start(t); o.stop(t + dur + 0.02);
  },
  mg: function () {
    // очередь пулемёта — точно в шестнадцатые музыки
    if (!this.running()) return;
    var t = this.grid(4);
    if (this.lastMg && Math.abs(this.lastMg - t) < 0.01) return;
    this.lastMg = t;
    this.noiseHit(t, 0.07, 3000, 600, 0.38, 'bandpass');
    this.tone(t, 180, 60, 0.06, 0.3, 'square');
    this.sub(t, 110, 42, 0.09, 0.55);
  },
  sub: function (t, f0, f1, dur, vol) {
    var c = this.ctx, o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.sfxG); o.start(t); o.stop(t + dur + 0.02);
  },
  // выстрелы с низким «ударом»
  shot: function (kind) {
    if (!this.running()) return;
    var now = this.ctx.currentTime, k = 'shot_' + kind;
    if (this.lastPlay[k] && now - this.lastPlay[k] < 0.06) return;
    this.lastPlay[k] = now;
    if (kind === 'snow') { this.sub(now, 150, 55, 0.12, 0.45); this.noiseHit(now, 0.08, 2500, 400, 0.25, 'lowpass'); this.sfx('tap', 0.3, { pitch: 0.6 + Math.random() * 0.2 }); }
    else if (kind === 'ice') { this.sub(now, 120, 40, 0.2, 0.6); this.noiseHit(now, 0.18, 5000, 500, 0.3, 'bandpass'); this.sfx('freeze', 0.35); }
    else if (kind === 'mortar') { this.sub(now, 90, 30, 0.35, 0.85); this.noiseHit(now, 0.25, 1800, 120, 0.45, 'lowpass'); this.whistle(); }
    else if (kind === 'ballista') { this.sub(now, 140, 50, 0.15, 0.55); this.tone(now, 420, 160, 0.18, 0.18, 'sawtooth'); this.sfx('metal', 0.4, { pitch: 1.3 }); }
  },
  boom: function (k) {
    if (!this.running()) return;
    k = k || 1;
    var t = this.grid(2);
    if (this.lastBoom && Math.abs(this.lastBoom - t) < 0.01) return;
    this.lastBoom = t;
    this.sub(t, 75, 26, 0.55 * k, Math.min(1, 0.75 * k));
    var buf = this.bufs.bd; if (buf) { var s = this.ctx.createBufferSource(), g = this.ctx.createGain(); s.buffer = buf; s.playbackRate.value = 0.8; g.gain.value = 0.9; s.connect(g); g.connect(this.sfxG); s.start(t); }
    this.noiseHit(t, 0.5, 4000, 300, 0.4, 'lowpass');
    // искры салюта
    for (var i = 0; i < 4; i++) this.noiseHit(t + 0.08 + i * 0.05, 0.05, 8000, 4000, 0.12, 'highpass');
  },
  whistle: function () { if (this.running()) this.tone(this.ctx.currentTime, 900, 2200, 0.5, 0.06, 'sine'); },
  zap: function () {
    if (!this.running()) return;
    var n = 1 + Math.floor(Math.random() * 4);
    this.sfx('zap' + n, 0.32, { gap: 0.07, gapKey: 'z' });
  },
  // голоса врагов — синтез формант: у каждого свой тембр и интонация
  voice: function (type, act) {
    if (!this.running()) return;
    var c = this.ctx, now = c.currentTime, k = 'v_' + type;
    if (this.lastPlay[k] && now - this.lastPlay[k] < (act === 'attack' ? 0.35 : 0.9)) return;
    if (this.lastVoice && now - this.lastVoice < 0.12) return;
    this.lastPlay[k] = now; this.lastVoice = now;
    var V = VOICES[type]; if (!V) return;
    var vol = (act === 'idle' ? 0.6 : act === 'die' ? 0.75 : 0.9) * (V.vol || 1);
    for (var i = 0; i < V.n; i++) {
      var t = now + i * V.gap, f0 = V.f[0] * (0.92 + Math.random() * 0.16), f1 = V.f[1] * (0.92 + Math.random() * 0.16);
      if (act === 'attack') { f0 *= 1.12; f1 *= 1.2; }
      this.formant(t, f0, f1, V.dur, vol * (i ? 0.8 : 1), V.form, V.wave, V.vib);
    }
    if (V.noise) this.noiseHit(now, V.dur * V.n, V.noise, V.noise * 0.3, 0.3 * vol, 'bandpass');
    if (V.sub) this.sub(now, V.sub, V.sub * 0.6, V.dur * V.n + 0.2, 0.5 * vol);
  },
  formant: function (t, f0, f1, dur, vol, forms, wave, vib) {
    var c = this.ctx, o = c.createOscillator(); o.type = wave || 'sawtooth';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    if (vib) { var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = vib; lg.gain.value = f0 * 0.06; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.05); }
    var out = c.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.linearRampToValueAtTime(vol * 1.5, t + 0.012); out.gain.setValueAtTime(vol * 1.5, t + dur * 0.6); out.gain.exponentialRampToValueAtTime(0.001, t + dur);
    forms.forEach(function (fq, i) { var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = 3.2; var g = c.createGain(); g.gain.value = i ? 0.8 : 1.4; o.connect(bp); bp.connect(g); g.connect(out); });
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(4000, f0 * 4); var lg2 = c.createGain(); lg2.gain.value = 0.35; o.connect(lp); lp.connect(lg2); lg2.connect(out);
    out.connect(this.sfxG); o.start(t); o.stop(t + dur + 0.05);
  },
  pop: function () {
    if (!this.running()) return;
    var now = this.ctx.currentTime;
    if (this.lastPop && now - this.lastPop < 0.04) return;
    this.lastPop = now;
    this.tone(now, 650, 160, 0.14, 0.22, 'triangle');
    this.noiseHit(now, 0.1, 1500, 200, 0.2, 'lowpass');
  }
};
})();
