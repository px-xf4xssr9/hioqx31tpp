/* 2.6 · «режиссёр» мультфильмов: персонажи входят и уходят, двигаются по эмоциям реплики, реагируют друг на друга,
   камера работает крупными и общими планами, у каждого свой рост (Великан и Горыныч огромные, Колобок маленький) */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, TT = Z.TT, T = Z.T, OL = D.OL, COL = D.COL;
function c() { return D.ctx; }
function ease(p) { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); }

// рост относительно Деда Мороза
var SCL = { MOR: 1, SNE: 0.88, MET: 1.05, EME: 1.05, BEL: 0.66, KOL: 0.5, PLO: 0.98, ESK: 0.86, VAS: 0.9, KOT: 0.7, YAG: 1.0, LES: 1.3, KIK: 0.85, GIA: 1.65, GOR: 1.55, KOS: 1.2, RAZ: 0.88, SOL: 0.92, ENO: 0.62, SHU: 0.55, EN2: 0.64, EN3: 0.6, CRW: 0.62 };
// сколько радиусов R занимает рисунок по высоте (чтобы рост был честным)
var HF = { moroz: 2.6, sneg: 2.5, met: 2.6, belka: 1.9, plombir: 2.3, eskimo: 2.05, emelya: 1.9, kolobok: 1.25, vasilisa: 2.25, kot: 2.0 };
var EH = { engineer: 2.0, thrower: 2.0, crow: 2.4, raccoon: 2.0, raz: 2.0, leshy: 2.5, yaga: 1.9, kiki: 2.0, giant: 2.4, gorynych: 2.5, koschei: 2.5, solovey: 1.75 };
var AKEY = { EME: 'emelya', BEL: 'belka', KOL: 'kolobok', PLO: 'plombir', ESK: 'eskimo', VAS: 'vasilisa', KOT: 'kot' };
var EKEY = { EN2: 'engineer', EN3: 'thrower', CRW: 'crow', ENO: 'raccoon', RAZ: 'raz', SOL: 'solovey', YAG: 'yaga', LES: 'leshy', KIK: 'kiki', GIA: 'giant', GOR: 'gorynych', KOS: 'koschei' };
var VILL = { EN2: 1, EN3: 1, CRW: 1, MET: 1, KOS: 1, GOR: 1, GIA: 1, YAG: 1, LES: 1, KIK: 1, RAZ: 1, SOL: 1, ENO: 1 };
var FLY = { MET: 1, YAG: 1, GOR: 1 };
// смены места действия и особые моменты: [индекс реплики, сцена]
var SEG = { M1: [[0, 'storm'], [7, 'night']], M2: [[0, 'night'], [7, 'village']], M3: [[0, 'village']], M4: [[0, 'storm'], [6, 'village']], M5: [[0, 'mount']], M6: [[0, 'lake']],
  M7: [[0, 'lake']], M8: [[0, 'mount']], M9: [[0, 'mount'], [6, 'storm'], [7, 'mount']], M10: [[0, 'storm'], [8, 'pole']], M11: [[0, 'fest']], M12: [[0, 'night']],
  M13: [[0, 'camp'], [7, 'campdone']], M20: [[0, 'title'], [1, 'bar'], [6, 'title'], [7, 'bar'], [12, 'title'], [13, 'bar'], [16, 'title'], [17, 'bar']] };
// молчаливые участники сцены (о них говорят — значит, они на экране): по сегментам
var ALLH = ['MOR', 'SNE', 'EME', 'BEL', 'KOL', 'PLO', 'ESK', 'VAS', 'KOT'];   // 2.11.1: Эскимо, брат Пломбира, — тоже со всеми
var EXTRA = { M21: [['MOR', 'SNE', 'PLO']], M22: [['MOR', 'SNE']], M3: [['MOR', 'SNE']], M4: [[], ['MOR', 'SNE', 'EME']], M6: [['MOR', 'SNE']], M7: [['MOR', 'SNE', 'BEL', 'KOL', 'EME']], M8: [['MOR', 'SNE', 'BEL', 'EME', 'PLO']],
  M9: [['MOR', 'SNE', 'VAS', 'BEL'], [], ['MOR', 'SNE', 'VAS', 'BEL']], M10: [[], ALLH], M11: [ALLH.concat(['MET', 'KOS'])],
  M20: [[], ['SOL', 'RAZ'], [], ['ENO', 'EN2'], [], ['ENO', 'EN2'], [], ['SOL', 'RAZ']] };
var BEAT = {
  'M3-01': { snore: 1 }, 'M7-02': { breath: 'GOR' }, 'M8-02': { run: 'BEL' },
  'M10-01': { run: 'KOS' }, 'M12-03': { barrel: 1 }, 'M12-09': { fuse: 1, shake: 0.2 }, 'M12-10': { fuse: 1 }, 'M12-12': { sooty: 1 }, 'M20-15': { fuse: 1, shake: 0.3 }, 'M18-08': { shake: 0.2 }, 
};
function emo(id) {
  var tg = (Z.VTAG && Z.VTAG[id]) || '';
  if (/shout|outraged|angry|panick|threaten|furious/.test(tg)) return 'shout';
  if (/excited|heroic|surprised|proud|dramatic/.test(tg)) return 'jump';
  if (/laugh|cheerful|happy|playful|mischiev/.test(tg)) return 'bounce';
  if (/sad|sigh|tired|lazy|grumbl|embarrass/.test(tg)) return 'sag';
  if (/whisper|sly|sweet|smug|sarcast|suspicious|deadpan/.test(tg)) return 'lean';
  if (/sleepy|snor|purr/.test(tg)) return 'sleepy';
  return 'talk';
}
function drawActor(v, x, y, H, d, o) {
  var ctx = c();
  if (v === 'MOR') D.moroz(x, y, H / HF.moroz, { dir: d, walk: o.walk, talk: o.talk, noTalk: !o.talk });
  else if (v === 'SNE' && o.ride) {   // Снегурочка правит санями: сидит в санях, держит вожжи
    var Rr = H * 0.62, cs0 = Rr / 0.55, sx0 = x + d * 0.63 * Rr; D.sleighTalk = !!o.talk; D.sleigh(sx0, y, cs0, d, o.walk ? Z.time : 0, 0); D.sleighTalk = null;   // рот — у самой Снегурочки (раньше второй рисовался поверх)
  }
  else if (v === 'SNE') { var r = H / HF.sneg; D.snegurochka(x, y, r, { dir: d, walk: o.walk, talk: o.talk, noTalk: !o.talk }); }
  else if (v === 'MET') { var r2 = H / HF.met; D.metelitsa(x, y, r2, { dir: d, walk: o.walk, talk: o.talk, noTalk: !o.talk }); }
  else if (AKEY[v]) { var a = AKEY[v]; D.ally(a, x, y, H / HF[a], { dir: d, walk: o.walk, talk: o.talk, noTalk: !o.talk }); }
  else if (v === 'SHU') { Z.drawPike(x, y, H * 1.15, d, o.talk, Z.time); }
  else {
    var tp = EKEY[v] || 'raccoon', sz = Z.ENEMIES[tp].size, cs = H / ((EH[tp] || 2.1) * 0.31 * sz);
    D.enemy({ type: tp, size: sz, dir: d, talk: o.talk, point: o.point, walk: o.walk ? Z.time * 8 : 0, ph: 0, hitT: 0, slow: 0, kb: 0, hp: 1, max: 1, air: false, mortal: true, headsLost: 0, noTree: true, whistle: v === 'SOL' && o.whistle ? 1 : 0 }, x, y, cs, Z.time);
  }
}
function setup(m) {
  var segs = SEG[m.id] || [[0, Z.MULTS[m.id].sc]];
  m.segs = segs; m.actors = {}; m.cam = { z: 1, x: 0.5 }; m.fx = []; m.props = {}; m.camMode = 'wide';
}
function segOf(m, i) { var s = 0; m.segs.forEach(function (q, k) { if (i >= q[0]) s = k; }); return s; }
function segCast(m, si) {
  var a = m.segs[si][0], b = si + 1 < m.segs.length ? m.segs[si + 1][0] : m.ids.length, cast = [];
  for (var i = a; i < b; i++) { var v = Z.VL[m.ids[i]][0]; if (v.indexOf('GOR') === 0) v = 'GOR'; if (v !== 'NAR' && cast.indexOf(v) < 0) cast.push(v); }
  var ex = (EXTRA[m.id] || [])[si] || []; m.extra = ex; ex.forEach(function (v) { if (cast.indexOf(v) < 0) cast.push(v); });
  var heroes = cast.filter(function (v) { return !VILL[v]; }), vil = cast.filter(function (v) { return VILL[v]; });
  return heroes.concat(vil);
}
function enterSeg(m, si) {
  m.seg = si; m.segT = 0; m.actors = {}; m.props = {};
  var cast = segCast(m, si), n = cast.length;
  // места по ширине персонажей: крупным — больше места, никто ни на кого не наезжает
  var WW = function (v) { return (SCL[v] || 1) * ({ EME: 1.25, GOR: 1.9, GIA: 1.1, KOL: 1.0, KOT: 0.8 }[v] || 0.62); };
  var tot = cast.reduce(function (a, v) { return a + WW(v); }, 0), cum = 0, lo = n > 5 ? 0.05 : n > 2 ? 0.12 : 0.22;
  cast.forEach(function (v, k) {
    var slot = n === 1 ? 0.5 : lo + (1 - 2 * lo) * (cum + WW(v) / 2) / tot; cum += WW(v);
    m.actors[v] = { v: v, slot: slot, x: slot < 0.5 ? -0.25 : 1.25, st: 'off', dir: slot < 0.5 ? 1 : -1, react: null, rt: 0, kx: 0, rot: 0 };
  });
  (m.extra || []).forEach(function (v) { if (m.actors[v]) { m.actors[v].st = 'on'; m.actors[v].x = m.actors[v].slot; } });
  // кто говорит в первых двух репликах сегмента — уже на сцене
  for (var i = m.segs[si][0]; i < Math.min(m.ids.length, m.segs[si][0] + 2); i++) { var v = Z.VL[m.ids[i]][0]; if (v.indexOf('GOR') === 0) v = 'GOR'; if (m.actors[v]) { m.actors[v].st = 'on'; m.actors[v].x = m.actors[v].slot; } }
}
function actor(m, v) {
  if (!m.actors[v]) m.actors[v] = { v: v, slot: 0.5, x: 0.5, st: 'off', dir: 1, react: null, rt: 0 };
  return m.actors[v];
}
// ---- синтезированные шумы: шаги по снегу, взмахи, бумага, перо, удары ----
function syn(kind, vol) {
  var AU = Z.AU; if (!AU || !AU.ctx || !AU.running || !AU.running()) return;
  try {
  var c = AU.ctx, t0 = c.currentTime, out = c.createGain(); out.gain.value = vol || 0.4; out.connect(AU.master);
  var noise = function (d) { var b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * d)), c.sampleRate), a = b.getChannelData(0); for (var i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; var n = c.createBufferSource(); n.buffer = b; return n; };
  var env = function (a, d, pk) { var g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(pk || 1, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d); g.connect(out); return g; };
  var filt = function (type, f, q) { var b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 1; return b; };
  var nz = function (d, type, f, q, a, dd, pk, f2) { var n = noise(d), b = filt(type, f, q); if (f2) b.frequency.exponentialRampToValueAtTime(f2, t0 + d); n.connect(b); b.connect(env(a, dd, pk)); n.start(t0); n.stop(t0 + d + 0.05); };
  var osc = function (type, f1, f2, a, d, pk) { var o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + a + d); o.connect(env(a, d, pk)); o.start(t0); o.stop(t0 + a + d + 0.05); };
  if (kind === 'step') nz(0.14, 'bandpass', 700 + Math.random() * 700, 0.9, 0.006, 0.11, 1);
  else if (kind === 'whoosh') nz(0.6, 'bandpass', 300, 1.4, 0.18, 0.4, 1, 2200);
  else if (kind === 'swish') nz(0.22, 'bandpass', 900, 1.2, 0.04, 0.16, 0.8, 2600);
  else if (kind === 'paper') { nz(0.3, 'highpass', 2600, 0.7, 0.02, 0.26, 0.9); nz(0.18, 'bandpass', 1500, 2, 0.01, 0.15, 0.6); }
  else if (kind === 'scratch') nz(0.16, 'bandpass', 4200 + Math.random() * 1500, 5, 0.01, 0.13, 1);
  else if (kind === 'boing') osc('sine', 260, 720, 0.01, 0.2, 0.9);
  else if (kind === 'pop') osc('triangle', 500, 1100, 0.005, 0.07, 0.7);
  else if (kind === 'thud') { osc('sine', 140, 45, 0.005, 0.25, 1); nz(0.12, 'lowpass', 500, 0.7, 0.004, 0.1, 0.8); }
  else if (kind === 'sub') { osc('sine', 70, 24, 0.01, 1.3, 1); nz(1.4, 'lowpass', 260, 0.7, 0.01, 1.3, 1); }
  else if (kind === 'stamp') { nz(0.08, 'lowpass', 900, 0.8, 0.002, 0.07, 1); osc('square', 160, 70, 0.002, 0.09, 0.35); }
  else if (kind === 'brr') osc('sawtooth', 90, 70, 0.02, 0.3, 0.25);
  } catch (e) { if (window.__rep) window.__rep(e); }
}
Z.cutSyn = syn; Z.cutExplode = function (m, bx) { explode(m, bx); };
function explode(m, bx) {
  var AU = Z.AU; m.boom = 0.001; m.boomX = bx; m.shake = 1.4; m.flash = 1; m.soot = 0.001;
  AU.raw('big_boom', 2.6); AU.raw('barrel_boom', 2.0, 0.75); AU.raw('avalanche', 1.1, 1.4); syn('sub', 1.6);
  setTimeout(function () { if (UI.modal === m) { AU.raw('tower_fall', 1.1); AU.raw('chest_crack', 1.0, 0.8); } }, 420);
  var P = m.props.pies; if (!P || P.gone) return; P.gone = true; m.debris = [];
  var bA = typeof bx === 'string' && m.actors[bx.slice(1)], bxf = bA ? bA.x : (+bx || 0.5), sg = bxf < P.x ? 1 : -1;
  var add = function (k, n, y0) { for (var i = 0; i < n; i++) m.debris.push({ k: k, dx: (Math.random() - 0.5) * 0.5, y: y0, vx: sg * (0.8 + Math.random() * 4) + (Math.random() - 0.5) * 2.5, vy: 3 + Math.random() * 4.5, r: 0, vr: (Math.random() - 0.5) * 16, rest: 0 }); };
  m.debrisX = P.x; add('plank', 3, 0.55); add('leg', 4, 0.3); add('pie', 7, 0.62); add('samovar', 1, 0.95); add('cloth', 1, 0.6);
}
// скелетные руки в мультиках: какая рука жестикулирует и поза покоя (как на статичной картинке)
var RIG = { MOR: { arm: 'b', f: [0.35, 0], b: [-0.2, 0] }, KOS: { arm: 'f', f: [0.54, 0], b: [-0.54, 0] }, MET: { arm: 'f', f: [0, 0], b: [0, 0] },
  SNE: { arm: 'f', f: [0.25, 0], b: [-0.25, 0] }, VAS: { arm: 'f', f: [0.6, 0.6], b: [-0.1, 0] }, BEL: { arm: 'f', f: [0.9, 0.7], b: [0, 0] }, PLO: { arm: 'f', f: [1.3, 1.0], b: [0, 0] },
  RAZ: { arm: 'b', f: [1.15, 0.95], b: [-0.3, 0.3], fBoom: [0.4, 0.3] }, SOL: { arm: 'f', f: [0.3, 0.2], b: [-0.3, 0.2] }, ENO: { arm: 'f', f: [0.15, 0.6], b: [0.3, 0.3] }, EME: { arm: 'f', f: [1.57, 0.1], b: [0, 0] } };
function stampLift(st) { var e = function (v) { return v * v * (3 - 2 * v); }; return st < 0.5 ? e(st / 0.5) : st < 0.62 ? 1 - (st - 0.5) / 0.12 : st < 1.1 ? 0 : st < 1.5 ? e((st - 1.1) / 0.4) * 0.7 : 0.7; }
function ik(H, tx, ty, dir) {
  var L1 = Math.hypot(H.ex - H.sx, H.ey - H.sy), L2 = Math.hypot(H.hx - H.ex, H.hy - H.ey); if (!(L1 > 0 && L2 > 0)) return null;
  var dx = (tx - H.sx) * dir, dy = ty - H.sy, Dd = Math.max(Math.abs(L1 - L2) + 1, Math.min((L1 + L2) * 0.97, Math.hypot(dx, dy)));
  var cl = function (v) { return Math.max(-1, Math.min(1, v)); }, b0 = Math.atan2(dx, dy), off = Math.acos(cl((L1 * L1 + Dd * Dd - L2 * L2) / (2 * L1 * Dd))), bend = Math.PI - Math.acos(cl((L1 * L1 + L2 * L2 - Dd * Dd) / (2 * L1 * L2)));
  return [b0 - off, bend];
}
function rigPose(m, A, k, RD) {
  var p = null, back = RD.arm === 'b', t = Z.time;
  if (A.st === 'on' && !A.knock && !A.sleep) {
    var holding = Object.keys(m.props).some(function (pk) { return m.props[pk].x === '@' + k; });
    if (holding) p = [1.5, 0.2];
    if (A.point) p = back ? [2.2, 0.2] : [1.85 + Math.sin((A.pt || 0) * 3) * 0.05, 0.05];
    if (A.wave) { var wv = 0.35 + Math.sin(A.wave * 11) * 0.5; p = back ? [-2.55, -wv] : [2.55, wv]; }
    if (A.signing) { var SP0 = m.props[A.signing], u = Math.min(1, SP0 && SP0.sign || 0), tp = m.ppt && m.ppt(A.signing, -m.base * 0.18 + u * m.base * 0.24, m.base * 0.24 - Math.sin(u * 19) * m.base * 0.03); A.nib = tp; p = (tp && A.handW && ik(A.handW, tp.x - A.dir * m.base * 0.05, tp.y - m.base * 0.075, A.dir)) || [1.15, 0.6]; }
    if (A.stamping) { var lift = stampLift(A.stt || 0), sp2 = m.ppt && m.ppt(A.stamping, m.base * 0.14, m.base * 0.12); p = (sp2 && A.handW && ik(A.handW, sp2.x, sp2.y - m.base * (0.135 + lift * 0.18), A.dir)) || [0.95 + lift * 0.9, 0.8 - lift * 0.5]; }
  }
  var fr = RD.fBoom && m.boom > 0 ? RD.fBoom : RD.f;
  return { f: p && !back ? p : fr, b: p && back ? p : RD.b, busy: !!p };
}
function finish(m) {
  Object.keys(m.actors).forEach(function (k) { var A = m.actors[k];
    if (A.st === 'enter') { A.st = 'on'; A.x = A.slot; }
    if (A.st === 'exit') { A.st = 'off'; }
    if (A.tgt != null) { A.x = A.slot = A.tgt; A.tgt = null; A.walking = false; }
    if (A.signing) { var P = m.props[A.signing]; if (P) P.sign = 1; A.signing = null; A.nib = null; }
    if (A.stamping) { var P2 = m.props[A.stamping]; if (P2 && !P2.stamp) P2.stamp = 1; A.stamping = null; A.stampDone = 0; }
    A.wave = 0; A.inReach = undefined;
    if (A.knock) { if (A.stayDown) { A.kt = Math.max(A.kt, 2); A.landed = 1; } else { A.knock = 0; A.upT = null; } }
    if (A.pop) A.pop = 1;
  });
  Object.keys(m.props).forEach(function (pk) { var P = m.props[pk]; if (P.sign > 0) P.sign = 1; });
}
function applyDir(m, list) {
  (list || []).forEach(function (q) {
    var op = q[0], v = q[1], A;
    if (op === 'place') { A = actor(m, v); A.slot = A.x = q[2]; A.st = 'on'; A.tgt = null; }
    else if (op === 'walk') { A = actor(m, v); if (A.st === 'off') { A.slot = q[2]; A.st = 'enter'; A.et = 0; A.ex = q[2] < 0.5 ? -0.25 : 1.25; A.ek = FLY[v] ? 'fly' : 'walk'; if (FLY[v]) syn('whoosh', 0.35); } else A.tgt = q[2]; }
    else if (op === 'turn') { A = actor(m, v); A.face = q[2]; }
    else if (op === 'emote') { A = actor(m, v); A.react = q[2]; A.rt = 0; var es = { jump: ['boing', 0.25], spin: ['whoosh', 0.25], bounce: ['pop', 0.15], shiver: ['brr', 0.3], nod: ['pop', 0.08] }[q[2]]; if (es && A.st !== 'off') syn(es[0], es[1]); }
    else if (op === 'sleep') { actor(m, v).sleep = true; }
    else if (op === 'wake') { actor(m, v).sleep = false; }
    else if (op === 'knock') { A = actor(m, v); A.knock = 1; A.kt = 0; A.upT = null; A.landed = 0; A.stayDown = false; Z.AU.raw('kolobok_roll', 0.8); m.shake = Math.max(m.shake || 0, 0.2); }
    else if (op === 'exit') { A = actor(m, v); A.st = 'exit'; A.et = 0; }
    // ушли в одну сторону — вернулись с другой (ходили кругами), устало и медленно
    // реквизит идёт рядом с героем (сани с подарками за Снегурочкой)
    else if (op === 'ride') { A = actor(m, v); A.ride = q[2]; A.dir = A.rd = q[3] || -1; }
    else if (op === 'follow') { m.props[v] = { x: 0, follow: q[2], off: q[3], t: 0 }; }
    else if (op === 'loop') { A = actor(m, v); A.st = 'enter'; A.et = 0; A.ex = A.slot < 0.5 ? 1.25 : -0.25; A.x = A.ex; A.ek = 'trudge'; }
    // показывает дорогу то в одну, то в другую сторону
    else if (op === 'still') { A = actor(m, v); A.still = q[2] !== false; }
    else if (op === 'directions') { A = actor(m, v); A.point = 'dir'; A.pt = 0; A.dseq = 0; syn('swish', 0.2); }
    else if (op === 'hide') { A = actor(m, v); A.st = 'off'; A.hid = 1; if (m.props.crates) m.props.crates.who = v; }   // 2.11.5: спрятался за ящиками — видно только хвост и глаза
    else if (op === 'leap') { A = actor(m, v); A.slot = q[2]; A.ex = A.x = q[3]; A.st = 'enter'; A.et = 0; A.ek = 'leap'; A.hid = 0; if (m.props.crates) { m.props.crates.who = null; m.props.crates.burst = 0.001; } Z.AU.raw('mine_pop', 0.45, 1.5); }
    else if (op === 'pop') { A = actor(m, v); A.slot = A.x = q[2]; A.st = 'on'; A.pop = 0.001; Z.AU.raw('mine_pop', 0.4, 1.4); }
    else if (op === 'hold') { actor(m, v).hold = q[2]; }
    else if (op === 'point') { A = actor(m, v); A.point = q[2]; A.pt = 0; syn('swish', 0.2); }
    else if (op === 'wave') { A = actor(m, v); A.wave = 0.001; syn('swish', 0.22); }
    else if (op === 'sign') { A = actor(m, v); A.signing = q[2]; if (m.props[q[2]]) m.props[q[2]].sign = 0.001; Z.AU.raw('build', 0.25, 2.2); }
    else if (op === 'stamp') { A = actor(m, v); A.stamping = q[2]; A.stt = 0; }
    else if (op === 'prop') { m.props[v] = { x: q[2], t: 0 }; if (/scroll|map|letters/.test(v)) syn('paper', 0.4); else if (/pies|throne|sleigh|oak|den|hut/.test(v)) syn('thud', 0.35); }
    else if (op === 'pass') { var PP = m.props[v]; if (PP) { PP.x = q[2]; PP.lx = PP.ly = null; PP.oy = 0; syn('paper', 0.3); } Object.keys(m.actors).forEach(function (k) { if (m.actors[k].signing === v) m.actors[k].signing = null; }); }
    else if (op === 'unprop') { delete m.props[v]; Object.keys(m.actors).forEach(function (k) { if (m.actors[k].hold === v) m.actors[k].hold = null; }); }
    else if (op === 'flip') { if (m.props[v]) { m.props[v].flip = true; m.props[v].flipAt = Z.time || 0; } if (v !== 'yhut') syn('paper', 0.45); }
    else if (op === 'pset') { if (m.props[v]) m.props[v][q[2]] = q[3]; }   // 2.12.46: свойство реквизита (план вместо договора, подписанный договор)
    else if (op === 'all') { Object.keys(m.actors).forEach(function (k) { var B = m.actors[k]; if (B.st === 'off') return; if (v === 'knockStay') { B.knock = 1; B.kt = 0; B.sooty = 1; B.stayDown = true; B.landed = 0; B.upT = null; } else { B.react = v; B.rt = 0; } }); }
    else if (op === 'fx') {
      if (v === 'shake') m.shake = Math.max(m.shake || 0, q[2]);
      else if (v === 'boom') explode(m, q[2]);
      else if (v === 'salute') { for (var s = 0; s < 10; s++) m.fx.push({ k: 'salute', x: 0.1 + Math.random() * 0.8, t: -s * 0.2, col: ['#ffd54a', '#ff6b8a', '#7fd8ff', '#9dff6a'][s % 4] }); Z.AU.raw('victory_sting', 0.6); }
      else if (v === 'breath') { m.fx.push({ k: 'breath', from: 'GOR', t: 0 }); Z.AU.raw('wave', 0.6); }
      else if (v === 'chariot') { m.fx.push({ k: 'chariot', t: 0 }); Z.AU.raw('stupa_fly', 0.6); }
      else { m.fx.push({ k: v, x: q[2], t: 0 }); if (v === 'splash') Z.AU.raw('splash', 0.7); if (v === 'puff') Z.AU.raw('mine_pop', 0.3, 0.8); }
    }
  });
}
function lineStart(m, id) {
  var DD = Z.MDIR && Z.MDIR[id];
  Object.keys(m.actors).forEach(function (k) { var Q = m.actors[k]; Q.face = null; Q.point = null; Q.dseq = null; Q.wave = 0; Q.signing = null; Q.stamping = null; });
  m.camLine = DD && DD.cam || null; if (DD) { if (DD.cam) m.camMode = DD.cam; applyDir(m, DD.do); }
  var v = Z.VL[id][0]; if (v.indexOf('GOR') === 0) v = 'GOR';
  var A = m.actors[v], b = BEAT[id] || {};
  if (A) {
    if (A.st === 'off') { A.st = 'enter'; A.et = 0; A.ex = A.x; A.ek = FLY[v] ? 'fly' : v === 'KOL' ? 'roll' : 'walk'; }
    A.react = emo(id); A.rt = 0;
  }
  m.speaker = v; m.emo = A ? A.react : 'narr';
  if (b.shake) m.shake = b.shake;
  if (b.knock && m.actors[b.knock]) { var K = m.actors[b.knock]; K.knock = 1; K.kt = 0; K.upT = null; K.landed = 0; Z.AU.raw('kolobok_roll', 0.7); }
  Object.keys(m.actors).forEach(function (q) { var Q = m.actors[q]; if (Q.knock && Q.kt > 1 && !Q.stayDown && Q.upT == null && q !== b.knock) Q.upT = 0; });
  if (b.fuse) Z.AU.raw('mine_pop', 0.25, 2.2);
  if (b.run && m.actors[b.run]) { var R = m.actors[b.run]; R.st = 'enter'; R.et = 0; R.ex = R.x < 0.5 ? -0.25 : 1.25; R.ek = 'run'; }
  if (b.salute) for (var s = 0; s < 8; s++) m.fx.push({ k: 'salute', x: 0.1 + Math.random() * 0.8, t: -s * 0.18, col: ['#ffd54a', '#ff6b8a', '#7fd8ff', '#9dff6a'][s % 4] });
  if (b.jumpAll) Object.keys(m.actors).forEach(function (k) { m.actors[k].react = 'jump'; m.actors[k].rt = 0; });
  if (b.breath) m.fx.push({ k: 'breath', from: b.breath, t: 0 });
  if (b.chariot) m.fx.push({ k: 'chariot', t: 0 });
  if (m.emo === 'shout') { m.shake = Math.max(m.shake || 0, 0.25); Object.keys(m.actors).forEach(function (k) { if (k !== v && m.actors[k].st === 'on') { m.actors[k].react = 'flinch'; m.actors[k].rt = 0; } }); }
  m.beat = b;
}
function lineEnd(m, id) {
  var b = BEAT[id] || {};
  if (b.after === 'exitENO' && m.actors.ENO) { m.actors.ENO.st = 'exit'; m.actors.ENO.et = 0; }
  if (b.after === 'boom') { explode(m, m.actors.RAZ ? '@RAZ' : 0.5); Object.keys(m.actors).forEach(function (k) { var A = m.actors[k]; A.knock = 1; A.kt = 0; A.sooty = 1; A.stayDown = true; A.landed = 0; A.upT = null; }); }
}
UI.drawMultHook = function (m) {
  var ctx = c(), L = UI.L, W = L.vp.w + L.ox * 2, H = L.sh, S = L.s, t = Z.time, M = Z.MULTS[m.id], dt = 1 / 60;
  if (!m.actors) setup(m);
  var ids = m.ids;
  var end = function () { if (m.ended) return; m.ended = true; if (m.wlObj) { try { m.wlObj.release(); } catch (e) { if (window.__rep) window.__rep(e); } } Z.save.seen['cut_' + m.id] = 1; Z.persist(); Z.sub.t = 0; UI.closeModal(); if (m.then) m.then(); };
  var next = function () {
    if (m.i >= 0) { var DP = Z.MDIR && Z.MDIR[ids[m.i]]; if (DP && DP.after && m.afterFor !== m.i) { m.afterFor = m.i; applyDir(m, DP.after); } lineEnd(m, ids[m.i]); finish(m); }
    if (m.i >= ids.length - 1) { m.outT = 0.001; return; }
    m.i++; var si = segOf(m, m.i); if (si !== m.seg) enterSeg(m, si);
    lineStart(m, ids[m.i]); m.wait = true; var my = m.i, DD = Z.MDIR && Z.MDIR[ids[m.i]];
    var go = function () { if (UI.modal !== m || m.i !== my || m.cut === my) return; m.speaking = true; Z.playLine(ids[m.i], function () { if (UI.modal === m && m.i === my) { m.speaking = false; m.wait = false; m.doneT = Z.time; m.post = DD && DD.post || 0; if (DD && DD.after && m.afterFor !== my) { m.afterFor = my; applyDir(m, DD.after); } } }); };
    m.speaking = false; if (DD && DD.pre) setTimeout(go, DD.pre * 1000); else go();
  };
  if (m.i < 0) { enterSeg(m, 0); next(); }
  if (!m.wait && m.doneT && Z.time - m.doneT > 0.4 + (m.post || 0) && !m.outT) { m.doneT = 0; next(); }
  if (m.outT) { m.outT += dt; if (m.outT > 0.7) { end(); return; } }
  m.segT += dt;
  var id = ids[Math.max(0, m.i)], v0 = Z.VL[id] ? Z.VL[id][0] : 'NAR', nar = v0 === 'NAR', spk = v0.indexOf('GOR') === 0 ? 'GOR' : v0;
  // ---- движение актёров ----
  var keys = Object.keys(m.actors), WF = { EME: 1.25, GOR: 1.7, GIA: 1.0, KOL: 1.0, KOT: 0.8, MET: 0.75, KOS: 0.7, RAZ: 1.3, ENO: 0.9 }, need = 0;
  keys.forEach(function (k) { need += (SCL[k] || 1) * (WF[k] || 0.62); });
  var PWN = { pies: 1.4, sleigh: 1.0, throne: 0.6, crates: 0.7, oak: 1.4, hut: 0.8, yhut: 0.8, den: 0.7, hole: 0.4, letters: 0.4 }; Object.keys(m.props || {}).forEach(function (pk) { var P = m.props[pk]; if (typeof P.x !== 'string' && !P.gone) need += PWN[pk] || 0; });
  var port = W < H * 0.9, base = port ? Math.min(H * 0.27, W * 0.5) : Math.min(H * 0.27, W * 0.42), SW = base * Math.max(4.6, need * 1.337), zfit = Math.min(1, W / SW), zw = port ? Math.min(1, W / (base * 3.6)) : zfit;
  keys.forEach(function (k) {
    var A = m.actors[k];
    if (A.st === 'enter') { A.et += dt / (A.ek === 'run' ? 0.5 : A.ek === 'leap' ? 0.75 : A.ek === 'fly' ? 1.1 : A.ek === 'trudge' ? 2.4 : 0.9); A.x = A.ex + (A.slot - A.ex) * ease(A.et); if (A.et >= 1) { A.st = 'on'; A.x = A.slot; } }
    if (A.st === 'exit') { A.et += dt / 0.8; A.x = A.slot + ((A.slot < 0.5 ? -0.3 : 1.3) - A.slot) * ease(A.et); }
    // смотрят на говорящего
    var S0 = m.actors[spk];
    if (A.ride) { /* сани не разворачиваются на каждого говорящего */ }
    else if (S0 && S0 !== A && A.st === 'on' && !A.walking && !A.still) A.dir = S0.x > A.x ? 1 : -1;
    else if (A === S0 && !A.still) { var other = keys.filter(function (q) { return q !== k && m.actors[q].st === 'on'; })[0]; if (other) A.dir = m.actors[other].x > A.x ? 1 : -1; }
    if (A.st === 'enter') A.dir = A.ex < A.slot ? 1 : -1;
    if (A.st === 'exit') A.dir = A.slot < 0.5 ? -1 : 1;
    if (A.tgt != null && A.st === 'on') { var dxw = A.tgt - A.x, stp = dt * 0.3; if (Math.abs(dxw) <= stp) { A.x = A.slot = A.tgt; A.tgt = null; A.walking = false; } else { A.x += Math.sign(dxw) * stp; A.walking = true; A.dir = Math.sign(dxw); } }
    if (A.face) A.dir = A.face;
    if (A.dseq != null && A.st === 'on') { A.dseq += dt; A.dir = [-1, 1, -1, 1][Math.min(3, Math.floor(A.dseq / 0.85))]; }
    if (A.pop) A.pop = Math.min(1, A.pop + dt * 2.5);
    A.rt += dt;
    if (A.knock) { A.kt += dt; }
  });
  keys.forEach(function (k) { var A = m.actors[k], wk = (A.st === 'enter' || A.st === 'exit') ? A.ek === 'walk' || !A.ek : A.walking; if (!wk || FLY[k]) { A.stepT = 0.2; return; } A.stepT = (A.stepT || 0) + dt; if (A.stepT > 0.3) { A.stepT = 0; syn('step', 0.16); } if (A.signing) {} });
  keys.forEach(function (k) { var A = m.actors[k], P0 = A.signing && m.props[A.signing]; if (P0 && P0.sign > 0 && P0.sign < 1) { A.scT = (A.scT || 0) + dt; if (A.scT > 0.17) { A.scT = 0; syn('scratch', 0.3); } } });
  // ---- раскладка: никто не стоит на предмете и не наезжает на соседа (мягко отходят в сторону) ----
  (function () {
    var WFk = { EME: 1.25, GOR: 1.9, GIA: 1.1, KOL: 1.0, KOT: 0.85, RAZ: 1.3, ENO: 0.9, BEL: 0.8, PLO: 0.85, ESK: 0.85, MOR: 0.7, KOS: 0.7, MET: 0.75, SOL: 0.7, VAS: 0.66, YAG: 0.8, LES: 0.8, KIK: 0.7, CRW: 0.6, EN2: 0.9 }, half = function (k) { return base * (SCL[k] || 1) * (WFk[k] || 0.62) / 2 / SW + 0.08 * base / SW; };
    var PW = { pies: 0.85, scroll: 0.3, map: 0.25, letters: 0.3, hole: 0.22, sleigh: 0.55, crates: 0.42, oak: 1.15, hut: 0.75, yhut: 0.62, tree: 0.62 };   // 2.11.5: крупный реквизит — тоже препятствие
    var obst = []; Object.keys(m.props).forEach(function (pk) { var P = m.props[pk]; if (typeof P.x === 'string' || !PW[pk] || P.gone) return; obst.push({ x: P.x, h: PW[pk] * base / SW }); });
    keys.forEach(function (k) { var A = m.actors[k], wk0 = A.signing || A.stamping; if (!wk0 || !A.handW || !m.ppt || A.st !== 'on') return; var tp = A.signing ? m.ppt(A.signing, -m.base * 0.06, m.base * 0.24) : m.ppt(A.stamping, m.base * 0.14, m.base * 0.12); if (!tp) return; var H0 = A.handW, reach = Math.hypot(H0.ex - H0.sx, H0.ey - H0.sy) + Math.hypot(H0.hx - H0.ex, H0.hy - H0.ey), off = H0.sx - A.x * SW; var want = (tp.x - A.dir * reach * (A.signing ? 0.55 : 0.62) - off) / SW; A.x += (want - A.x) * Math.min(1, dt * 3); A.slot = A.x; A.walking = Math.abs(want - A.x) > 0.004; A.inReach = Math.abs(want - A.x) < 0.012; });
    Object.keys(m.props).forEach(function (pk) { var P = m.props[pk], sg = null; keys.forEach(function (k) { if (m.actors[k].signing === pk && m.actors[k].handW) sg = m.actors[k]; }); var goal = 0; if (sg && m.ppt) { var H1 = sg.handW, rch = Math.hypot(H1.ex - H1.sx, H1.ey - H1.sy) + Math.hypot(H1.hx - H1.ex, H1.hy - H1.ey), sp = m.ppt(pk, 0, m.base * 0.22); if (sp) goal = (P.oy || 0) + (H1.sy + rch * 0.72) - sp.y; } P.oy = (P.oy || 0) + (goal - (P.oy || 0)) * Math.min(1, dt * 3); });
    var on = keys.filter(function (k) { var A = m.actors[k]; return A.st === 'on' && !A.knock && !A.signing && !A.stamping; }).map(function (k) { var A = m.actors[k], hw = half(k), hold = Object.keys(m.props).some(function (pk) { return m.props[pk].x === '@' + k; }); return { k: k, A: A, x: A.tgt != null ? A.tgt : A.slot, h: hw + (hold ? 0.7 * base / SW : 0) }; });
    on.sort(function (a, b) { return a.x - b.x; });
    for (var it = 0; it < 6; it++) {
      on.forEach(function (o) { obst.forEach(function (ob) { var d = o.x - ob.x, need = o.h + ob.h; if (Math.abs(d) < need) { var nx = ob.x + (d >= 0 ? need : -need); if (nx > 1 - o.h || nx < o.h) nx = ob.x + (d >= 0 ? -need : need); o.x = nx; } }); });   // упёрся в край — обходит предмет с другой стороны
      for (var q = 1; q < on.length; q++) { var a = on[q - 1], b = on[q], need2 = a.h + b.h; if (b.x - a.x < need2) { var mid = (a.x + b.x) / 2; a.x = mid - need2 / 2; b.x = mid + need2 / 2; } }
      on.forEach(function (o) { o.x = Math.max(o.h, Math.min(1 - o.h, o.x)); });
    }
    // последнее слово за предметами: с ящиком/дубом/избой никто не пересекается, соседей сдвигаем дальше в ту же сторону
    for (var it2 = 0; it2 < 4; it2++) { on.forEach(function (o) { obst.forEach(function (ob) { var d = o.x - ob.x, need = o.h + ob.h; if (Math.abs(d) < need) { var nx = ob.x + (d >= 0 ? need : -need); if (nx > 1 - o.h || nx < o.h) nx = ob.x + (d >= 0 ? -need : need); o.x = nx; } }); });
      for (var q3 = 1; q3 < on.length; q3++) { var a3 = on[q3 - 1], b3 = on[q3], n3 = a3.h + b3.h; if (b3.x - a3.x < n3) { var blocked = obst.some(function (ob) { return Math.abs(b3.x - ob.x) < b3.h + ob.h + 0.001 || b3.x + n3 > 1; }); if (blocked) a3.x = b3.x - n3; else b3.x = a3.x + n3; } }
      on.forEach(function (o) { o.x = Math.max(o.h, Math.min(1 - o.h, o.x)); }); }
    on.forEach(function (o) { if (o.A.tgt != null) o.A.tgt = o.x; else { o.A.slot = o.x; o.A.x += (o.x - o.A.x) * Math.min(1, dt * 4); } });
  })();
  // ---- камера: крупный план на говорящего, общий — на рассказчика ----
  var onN = keys.filter(function (k) { return m.actors[k].st !== 'off'; }).length;
  var Sp = m.actors[spk], spOn = Sp && Sp.st !== 'off', cm = m.camMode || 'wide', tz = zw, tx = 0.5;
  if (cm === 'close' && spOn) { var cap = SCL[spk] > 1.3 ? 1.06 : 1.24; tz = Math.min(cap, Math.max(zw * cap, W / (base * (SCL[spk] || 1) * 3.0))); tx = Sp.x; }
  else if (cm.indexOf('two:') === 0 && (nar || !spOn || cm.slice(4).split(',').indexOf(spk) >= 0)) { var pr = cm.slice(4).split(','), Pa = m.actors[pr[0]], Pb = m.actors[pr[1]]; if (Pa && Pb && Pa.st !== 'off' && Pb.st !== 'off') { tx = (Pa.x + Pb.x) / 2; tz = Math.max(port ? zw * 0.8 : zfit, Math.min(1.3, W / (Math.abs(Pa.x - Pb.x) * SW + base * 2.2))); } }
  else if (port && spOn && !nar) tx = Sp.x + (spk === 'YAG' && m.props.yhut ? base * 0.5 / SW : 0);
  if (nar) { tz = zw; tx = port ? 0.5 + Math.sin(t * 0.18) * 0.5 : 0.5 + Math.sin(t * 0.2) * 0.03 * zfit; }
  if (m.boom > 0 && m.boom < 3) { var bA0 = typeof m.boomX === 'string' && m.actors[m.boomX.slice(1)]; tx = bA0 ? bA0.x : (m.boomX || 0.5); }
  var hv = W / (2 * tz * SW); tx = hv >= 0.5 ? 0.5 : Math.max(hv, Math.min(1 - hv, tx));
  m.cam.z += (tz - m.cam.z) * 0.06; m.cam.x += (tx - m.cam.x) * 0.06;
  var sh = port ? Math.min(H * 0.72, W * 1.2) : H * 0.72, sy = (H - sh) / 2 - 20 * S, gy = sy + sh * 0.9;
  cx0();
  function cx0() {}
  ctx.fillStyle = '#0b1028'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath(); ctx.rect(0, sy, W, sh); ctx.clip();
  var shake = m.shake > 0 ? (m.shake -= dt, m.shake) : 0;
  ctx.translate(W / 2 + (Math.random() - 0.5) * shake * 30 * S, gy + (Math.random() - 0.5) * shake * 20 * S); ctx.scale(m.cam.z, m.cam.z); ctx.translate(-SW * m.cam.x, -gy);
  var vw = W / m.cam.z, vl = SW * m.cam.x - vw / 2; var vt = gy - (gy - sy) / m.cam.z - 10;
  // 2.11.5: декорация рисуется в ОДНОМ и том же прямоугольнике мира при любом зуме камеры (раньше он зависел от зума —
  // палатки, табличка, будка «уезжали» и повисали над землёй, когда камера приближалась). Прямоугольник — под общий план (зум 1),
  // приближение всегда внутри него.
  var scK = m.segs[m.seg][1], scX = Math.min(-SW * 0.1, SW * 0.5 - W / 2 - 30), scX1 = Math.max(SW * 1.1, SW * 0.5 + W / 2 + 30), scW = scX1 - scX, scY = Math.min(sy - sh * 0.05, sy - 10), scH = Math.max(sh * 1.1, sh + 30), hzN = scY + scH * 0.78;
  // 2.11.5: параллакс — дальний план (небо, горы, дальний лес, дома у горизонта) едет медленнее камеры, ближний — вместе с героями
  var LAY = Z.sceneLayered && Z.sceneLayered(scK);
  if (LAY) {
    // дальний план масштабируется вокруг линии горизонта — горизонт дальнего и ближнего плана совпадает при любом зуме (ничего не «всплывает»)
    var zF = 1 + (m.cam.z - 1) * 0.45, camF = 0.5 + (m.cam.x - 0.5) * 0.45, hz = hzN, yF = Math.min(scY, hzN - (gy - sy) + (gy - hzN) - 20), hF = (hz - yF) / 0.78;
    ctx.save(); ctx.translate(SW * m.cam.x, hzN); ctx.scale(zF / m.cam.z, zF / m.cam.z); ctx.translate(-SW * camF, -hzN);
    var fHalf = Math.max(SW * 0.7, W / 2 + 40, Math.abs(SW * camF - SW * 0.5) + W / (2 * zF) + 40);   // ширина постоянная, пока её хватает: дальние дома и ели не ездят при зуме
    Z.SCP = 'far'; try { Z.drawScene(scK, SW * 0.5 - fHalf, yF, fHalf * 2, hF, t); } catch (eF) { if (window.__rep) window.__rep(eF); } Z.SCP = undefined;
    ctx.restore(); Z.SCP = 'near';
    var hzG = ctx.createLinearGradient(0, hz - scH * 0.4, 0, hz - scH * 0.035); hzG.addColorStop(0, 'rgba(205,220,248,0)'); hzG.addColorStop(1, 'rgba(205,220,248,0.24)'); ctx.fillStyle = hzG; ctx.fillRect(-SW, hz - scH * 0.4, SW * 3, scH * 0.4 - scH * 0.035);   // 2.11.5: дымка кончается выше линии земли — без светлой полосы под ногами предметов   // дымка у горизонта — даль кажется дальше
  }
  try { Z.drawScene(scK, scX, scY, scW, scH, t); } finally { Z.SCP = undefined; }
  m.par = { SW: SW, gy: gy, sy: sy, sh: sh, W: W, z: m.cam.z, cx: m.cam.x, base: base, sc: scK };
  var FG = { pies: 1, scroll: 1, map: 1, letters: 1, crates: 1 };
  var HOLD_ANG = -0.15, aGeom = function (A, k, ang, ext) { var Hh = base * (SCL[k] || 1); return Z.armGeom(k, A.x * SW, gy, Hh, A.dir, ang, ext); };
  var handOf = function (v) { var A = m.actors[v]; if (!A || A.st === 'off') return null; if (RIG[v] && A.handW) return { hx: A.handW.hx, hy: A.handW.hy }; return aGeom(A, v, HOLD_ANG, 1); };
  var HW = { scroll: 0.2, map: 0.24, letters: 0.15 };
  var propX = function (k) { var P = m.props[k]; if (!P) return null; if (P.follow) { var FA = m.actors[P.follow]; if (!FA || FA.st === 'off') return null; P.mv = FA.st !== 'on' || FA.walking; return FA.x - (P.off || 0.2); } var px = P.x; if (k === 'yhut' && m.actors.YAG) { var YA = m.actors.YAG; return Math.min(1 - base * 0.45 / SW, YA.x + base * 1.05 / SW); } if (typeof px === 'string') { var v0 = px.slice(1), A0 = m.actors[v0]; if (A0 && (A0.stamping === k || A0.signing === k) && P.lx != null) return P.lx; var hg = handOf(v0); if (!hg) return null; P.lx = (hg.hx + A0.dir * (HW[k] || 0.15) * base) / SW; return P.lx; } return px; };
  m.base = base; m.ppt = function (k, lx, ly) { var px = propX(k); if (px == null) return null; var hy0 = propY(k), bob = Math.sin(t * 2) * base * 0.03; if (hy0 != null) { var pgy0 = hy0 - (({ scroll: -0.85, map: -0.62 })[k] || -0.6) * base * 0.62; return { x: px * SW + 0.62 * 1.35 * lx, y: pgy0 + 0.62 * (-base * 0.85 - bob + 1.35 * ly) }; } return { x: px * SW + 1.35 * lx, y: gy - base * 0.85 - bob + 1.35 * ly }; };
  var propY = function (k) { var P = m.props[k]; if (P && typeof P.x === 'string') { var A0 = m.actors[P.x.slice(1)]; if (A0 && (A0.stamping === k || A0.signing === k) && P.ly != null) return P.ly; var hg = handOf(P.x.slice(1)); if (hg) { P.ly = hg.hy + (P.oy || 0); return P.ly; } } return null; };
  var drawProps = function (front) { Object.keys(m.props).forEach(function (k) {
    var P = m.props[k]; if (!!(FG[k] || P.follow) !== front) return; if (P.gone) return; if (k === 'hole' && m.actors.SHU && m.actors.SHU.st !== 'off') return; if (!front) P.t += dt; var px = propX(k); if (px == null) return;
    if (front) { P.t += dt; if (P.sign > 0 && P.sign < 1 && Object.keys(m.actors).some(function (q) { return m.actors[q].signing === k; })) P.sign += dt / 2.2; if (P.stamp > 0) P.stamp += dt; }
    var hy0 = propY(k), GR = { scroll: -0.85, map: -0.62 }, pgy = hy0 != null ? hy0 - (GR[k] || -0.6) * base * 0.62 : gy;
    if (hy0 != null) { c().save(); c().translate(px * SW, pgy); c().scale(0.62, 0.62); Z.MDIR.drawProp(k, 0, 0, base, t, P); c().restore(); }
    else Z.MDIR.drawProp(k, px * SW, gy, base, t, P);
  }); };
  drawProps(false);
  // актёры: дальние — сначала (по росту), снизу — тень
  keys.slice().sort(function (a, b) { return SCL[b] - SCL[a]; }).forEach(function (k) {
    var A = m.actors[k]; if (A.st === 'off') return;
    A.fw = (A.fw || 0) + (((k === spk && A.st === 'on' && !A.still) ? 1 : 0) - (A.fw || 0)) * 0.08;
    var Hh = base * (SCL[k] || 1) * (1 + A.fw * 0.05), x = (A.x + A.fw * 0.01 * (A.x < 0.5 ? 1 : -1)) * SW, y = gy + A.fw * H * 0.015, talk = k === spk && m.wait && m.speaking, walk = A.st === 'enter' || A.st === 'exit' || A.walking;
    var dy = 0, sx = 1, syy = 1, rot = 0, lean = 0, r = A.react, p = A.rt;
    if (walk && A.ek === 'fly') dy -= Math.sin(Math.min(1, A.et) * Math.PI) * H * 0.18 + (1 - Math.min(1, A.et)) * H * 0.1;
    if (walk && A.ek === 'roll') rot = (A.x - A.slot) * 12;
    if (walk && A.ek === 'leap') dy -= Math.sin(Math.min(1, A.et) * Math.PI) * Hh * 0.75;
    if (FLY[k] && !(walk && A.st !== 'on')) dy -= Hh * 0.12 + Math.sin(t * 2 + A.slot * 5) * Hh * 0.04;
    if (r === 'jump' && p < 0.9) dy -= Math.abs(Math.sin(p * Math.PI * 2.2)) * Hh * 0.14 * (1 - p);
    if (r === 'shout') { if (p < 0.5) dy -= Math.sin(p * Math.PI * 2) * Hh * 0.1; sx = 1 + Math.sin(t * 40) * 0.02 * (talk ? 1 : 0); syy = 1.04; }
    if (r === 'bounce' && talk) dy -= Math.abs(Math.sin(t * 9)) * Hh * 0.05;
    if (r === 'sag') { syy = 0.95; sx = 1.03; }
    if (r === 'lean') lean = 0.08 * A.dir;
    if (r === 'flinch' && p < 0.4) { dy -= Math.sin(p / 0.4 * Math.PI) * Hh * 0.05; lean = -0.1 * A.dir; }
    if (talk && r === 'talk') dy -= Math.abs(Math.sin(t * 7)) * Hh * 0.02;
    // у кого нет скелетных рук (злодеи, мелкие герои) — говорят всем телом: покачивание и пружинка в такт словам
    if (talk && !RIG[k]) { var sy0 = Math.abs(Math.sin(t * 9 + A.slot * 3)); syy *= 1 + sy0 * 0.04; sx *= 1 - sy0 * 0.015; lean += Math.sin(t * 4.3 + A.slot) * 0.045 * A.dir; }
    if (A.st === 'on' && !walk) lean += Math.sin(t * 1.3 + A.slot * 6) * 0.014;
    if (r === 'nod' && p < 1.2) lean += Math.sin(p * 10) * 0.05;
    if (r === 'shiver') sx *= 1 + Math.sin(t * 50) * 0.025;
    if (r === 'spin' && p < 0.7) { sx *= Math.cos(p / 0.7 * Math.PI * 2); dy -= Math.sin(p / 0.7 * Math.PI) * Hh * 0.15; }
    if (r === 'sleepy') syy *= 0.97;
    // дыхание
    syy *= 1 + Math.sin(t * 2 + A.slot * 7) * 0.012;
    // 2.7.17: «замер» — ни дыхания, ни покачивания (Пломбир «загружается»)
    if (A.still) { lean = 0; dy = 0; sx = 1; syy = 1; rot = 0; }
    var sleeping = !!A.sleep;
    if (A.knock) {
      var down = Math.min(1, A.kt * 2.5), up = A.upT ? ease(A.upT / 0.7) : 0;
      if (A.upT !== undefined && A.upT !== null) { A.upT += dt; if (A.upT > 0.7) { A.knock = 0; A.upT = null; } }
      else if (!A.stayDown && A.kt > 2.2) A.upT = 0;
      rot = down * (1 - up) * -1.35 * A.dir; dy -= (Math.sin(Math.min(1, A.kt * 1.6) * Math.PI) * Hh * 0.45) * (A.kt < 0.62 ? 1 : 0);
      if (A.kt > 0.6 && A.kt < 0.8 && !A.landed) { A.landed = 1; m.shake = Math.max(m.shake || 0, 0.15); syn('thud', 0.55); }
    }
    if (k !== 'MET') D.ell(x, y + 2, Hh * 0.28 * (FLY[k] ? 0.6 : 1), Hh * 0.06, 'rgba(20,30,60,0.28)');   // 2.11.5: у Метелицы своя тень (она парит) — без второй
    var pk = A.pop ? (A.pop < 1 ? Math.sin(A.pop * Math.PI * 0.75) * 1.25 : 1) : 1;
    ctx.save(); ctx.translate(x, y + dy); ctx.rotate(rot + lean + (sleeping ? -1.45 * A.dir : 0)); ctx.scale(sx * pk, syy * pk);
    if (!talk && !nar && m.speaker !== 'NAR') ctx.globalAlpha = 0.92;
    var posed = A.st === 'on' && !A.knock && !A.sleep && (A.point || A.wave || A.signing || A.stamping || Object.keys(m.props).some(function (pk) { return m.props[pk].x === '@' + k; }));
    var RD = RIG[k]; D.rig = null; D.rigOut = null;
    if (RD) { var tg = rigPose(m, A, k, RD); A.rg = A.rg || { f: { a: RD.f[0], e: RD.f[1] }, b: { a: RD.b[0], e: RD.b[1] } }; var kk = Math.min(1, dt * 9); ['f', 'b'].forEach(function (sd) { var cur = A.rg[sd], T0 = tg[sd]; cur.a += (T0[0] - cur.a) * kk; cur.e += (T0[1] - cur.e) * kk; }); A.rg.f.busy = tg.busy && RD.arm === 'f'; D.rig = A.rg; }
    D.armOff = !!posed && !RD; D.noBarrel = k === 'RAZ' && m.boom > 0;
    if (A.ride) { if (A.rd == null) A.rd = A.dir; A.rd += (A.dir - A.rd) * Math.min(1, dt * 5); if (Math.abs(A.rd) < 0.08) A.rd = A.dir > 0 ? 0.08 : -0.08; }   // сани разворачиваются плавно, а не прыжком
    drawActor(k, 0, 0, Hh, A.ride ? A.rd : A.dir, { talk: talk && !sleeping, walk: walk, ride: A.ride, point: !!A.point && A.st === 'on', react: A.react });
    D.armOff = false; D.noBarrel = false;
    if (A.sooty) { ctx.globalAlpha = 0.45; D.ell(0, -Hh * 0.5, Hh * 0.32, Hh * 0.5, '#2a2a2a'); ctx.globalAlpha = 1; }
    ctx.restore(); ctx.globalAlpha = 1;
    if (RD && D.rigOut && D.rigOut[RD.arm]) { try { var Tc = ctx.getTransform(), ro = D.rigOut[RD.arm], wp = Tc.inverse().transformPoint(ro.p); var inv = Tc.inverse(), k2 = ro.s / Math.hypot(Tc.a, Tc.b), ws = inv.transformPoint(ro.ps), we = inv.transformPoint(ro.pe); A.handW = { hx: wp.x, hy: wp.y, sx: ws.x, sy: ws.y, ex: we.x, ey: we.y, r: ro.hr * k2, col: ro.hand, l: ro.l * k2, w: ro.w * k2, acol: ro.col, cuff: ro.cuff, bony: ro.bony }; } catch (er) { if (window.__rep) window.__rep(er); } } D.rig = null; D.rigOut = null;
    if (sleeping || (r === 'sleepy' && talk)) { var zp = (t * 0.6) % 1; ctx.globalAlpha = 1 - zp; D.text('Z', x + Hh * 0.3 + zp * Hh * 0.3, y - Hh * (sleeping ? 0.6 : 1.1) - zp * Hh * 0.4, Hh * 0.18, '#fff', 'center', 'middle', 3); ctx.globalAlpha = 1; }
    if (talk && r === 'shout') { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; for (var q = 0; q < 3; q++) { var a = -0.9 + q * 0.45; ctx.beginPath(); ctx.moveTo(x + A.dir * Hh * 0.35 + Math.cos(a) * Hh * 0.1 * A.dir, y - Hh * 0.95 + Math.sin(a) * Hh * 0.1); ctx.lineTo(x + A.dir * Hh * 0.35 + Math.cos(a) * Hh * 0.22 * A.dir, y - Hh * 0.95 + Math.sin(a) * Hh * 0.22); ctx.stroke(); } }
  });
  // бочка пороха у разбойника, фитиль, взрыв
  if (m.boom > 0) { m.boom += dt; var bp = Math.min(1, m.boom / 1.2), bA = typeof m.boomX === 'string' && m.actors[m.boomX.slice(1)], bxx = bA ? (bA.x * SW + bA.dir * base * 0.3) : (m.boomX || 0.5) * SW; ctx.globalAlpha = 1 - bp; D.circ(bxx, gy - base * 0.5, base * (0.5 + bp * 3), '#ffb347'); D.circ(bxx, gy - base * 0.5, base * (0.3 + bp * 2), '#fff3c4'); ctx.globalAlpha = 1; 
    m.bxx = bxx; var sw0 = Math.min(1, m.boom / 0.7); if (sw0 < 1) { ctx.globalAlpha = (1 - sw0) * 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = base * 0.12 * (1 - sw0) + 2; ctx.beginPath(); ctx.ellipse(bxx, gy - base * 0.3, base * (0.3 + sw0 * 7), base * (0.2 + sw0 * 2.2), 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; } }
  if (m.soot > 0 && m.soot < 3.5) { m.soot += dt; var sp0 = m.soot / 3.5; for (var si2 = 0; si2 < 9; si2++) { var sa = si2 * 2.4; ctx.globalAlpha = Math.max(0, 0.55 * (1 - sp0)); D.circ((m.bxx || SW / 2) + Math.cos(sa) * base * (0.3 + sp0 * 1.2), gy - base * (0.4 + sp0 * 1.6 + (si2 % 3) * 0.2), base * (0.25 + sp0 * 0.45), si2 % 2 ? '#5a5a66' : '#3a3a44'); } ctx.globalAlpha = 1; }
  if (m.debris) { var dX = m.debrisX * SW; m.debris.forEach(function (d) {
      if (!d.rest) { d.vy -= 9 * dt; d.dx += d.vx * dt; d.y += d.vy * dt; d.r += d.vr * dt; if (d.y <= 0) { d.y = 0; if (Math.abs(d.vy) < 1.2) { d.rest = 1; d.r = d.k === 'samovar' ? Math.PI / 2 : d.k === 'pie' ? 0 : Math.round(d.r / Math.PI) * Math.PI; } else { d.vy = -d.vy * 0.32; d.vx *= 0.55; d.vr *= 0.5; if (!d.snd && (d.k === 'plank' || d.k === 'samovar')) { d.snd = 1; syn('thud', 0.25); } } } }
      var px2 = dX + d.dx * base, py2 = gy - d.y * base - base * 0.03; ctx.save(); ctx.translate(px2, py2); ctx.rotate(d.r);
      if (d.k === 'plank') { D.rr(-base * 0.32, -base * 0.04, base * 0.64, base * 0.08, 3); ctx.fillStyle = '#8a5a35'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = D.OL; ctx.stroke(); }
      else if (d.k === 'leg') { D.rr(-base * 0.03, -base * 0.15, base * 0.06, base * 0.3, 2); ctx.fillStyle = '#6b4a2f'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = D.OL; ctx.stroke(); }
      else if (d.k === 'pie') { D.ell(0, 0, base * 0.07, base * 0.042, '#e8a64a', 2); D.ell(0, -base * 0.01, base * 0.045, base * 0.018, '#f6cf7a'); }
      else if (d.k === 'samovar') { D.rr(-base * 0.08, -base * 0.13, base * 0.16, base * 0.22, 5); ctx.fillStyle = '#ffd54a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = D.OL; ctx.stroke(); D.rr(-base * 0.04, -base * 0.19, base * 0.08, base * 0.06, 2); ctx.fillStyle = '#d9a520'; ctx.fill(); ctx.stroke(); }
      else if (d.k === 'cloth') { D.rr(-base * 0.3, -base * 0.03, base * 0.6, base * 0.06, 3); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = D.OL; ctx.stroke(); for (var cd = 0; cd < 5; cd++) D.circ(-base * 0.24 + cd * base * 0.12, 0, base * 0.015, '#e8484f'); }
      ctx.restore(); }); }
  drawProps(true);
  // руки — позами: держит предмет (рука вперёд), показывает (вперёд-вверх), машет, пишет пером, ставит печать
  keys.forEach(function (k) {
    var A = m.actors[k]; if (A.st !== 'on' || A.knock || A.sleep) return;
    var Hh = base * (SCL[k] || 1), x = A.x * SW, ang = null, ext = 1, tool = null;
    var holding = Object.keys(m.props).some(function (pk) { return m.props[pk].x === '@' + k; });
    if (holding) ang = HOLD_ANG;
    if (A.point) { A.pt = (A.pt || 0) + dt; ang = 0.35 + Math.sin(A.pt * 3) * 0.04; ext = 1.05; }
    if (A.wave) { A.wave += dt; ang = 1.15 + Math.sin(A.wave * 11) * 0.35; ext = 0.95; if (A.wave > 1.8) A.wave = 0; }
    if (A.signing) { var SP0 = m.props[A.signing]; var u = Math.min(1, SP0 && SP0.sign || 0); ang = -0.35 + Math.sin(u * 19) * 0.06; ext = 0.92 + u * 0.12; tool = 'quill'; }
    if (A.stamping) { if (A.inReach !== false) A.stt += dt; var lift = stampLift(A.stt); ang = -0.45 + lift * 1.2; tool = 'stamp';
      if (A.stt > 0.62 && !A.stampDone) { A.stampDone = 1; var SP = m.props[A.stamping]; if (SP) SP.stamp = 0.001; m.shake = 0.22; syn('thud', 1.0); syn('stamp', 0.8); Z.AU.raw('drum', 0.9, 1.3); setTimeout(function () { syn('paper', 0.25); }, 120); } }
    if (ang == null) return;
    // 2.7.16: персонажам без своих рук-риг (Леший и др.) чужую руку не дорисовываем — только для предметов и инструментов
    if (!RIG[k] && !holding && !tool) return;
    var hand = RIG[k] ? (A.handW ? { x: A.handW.hx, y: A.handW.hy } : null) : Z.drawArm(k, x, gy, Hh, A.dir, ang, ext);
    var HW0 = A.handW, over = RIG[k] && hand && HW0 && (holding || tool);
    if (over) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(HW0.sx, HW0.sy); ctx.lineTo(HW0.ex, HW0.ey); ctx.lineTo(HW0.hx, HW0.hy); ctx.strokeStyle = OL; ctx.lineWidth = HW0.w + HW0.l * 2; ctx.stroke(); ctx.strokeStyle = HW0.acol; ctx.lineWidth = HW0.w; ctx.stroke(); if (HW0.cuff) { var fa0 = Math.atan2(HW0.hx - HW0.ex, HW0.hy - HW0.ey); D.circ(HW0.hx - Math.sin(fa0) * HW0.r * 0.7, HW0.hy - Math.cos(fa0) * HW0.r * 0.7, HW0.w * 0.62, HW0.cuff, HW0.l * 0.7); } }
    if (hand && tool === 'quill') { var nb = A.nib || { x: hand.x + A.dir * base * 0.025, y: hand.y + base * 0.1 }; Z.drawQuill(nb.x, nb.y, base * 0.3, Math.atan2(hand.x - nb.x, nb.y - hand.y) - 0.09); }
    if (hand && tool === 'stamp') { var sl = stampLift(A.stt || 0), sc = 1 + sl * 0.18, bq = base * sc, hx2 = hand.x, hy2 = hand.y, olw = Math.max(1.5, base * 0.012);
      var box = function (x0, y0, w0, h0, r0, col) { D.rr(x0, y0, w0, h0, r0); c().fillStyle = col; c().fill(); c().lineWidth = olw; c().strokeStyle = OL; c().stroke(); };
      box(hx2 - bq * 0.03, hy2 - bq * 0.03, bq * 0.06, bq * 0.11, bq * 0.02, '#8a4a2a'); D.circ(hx2, hy2 - bq * 0.045, bq * 0.04, '#a8603a', olw);
      box(hx2 - bq * 0.08, hy2 + bq * 0.075, bq * 0.16, bq * 0.04, bq * 0.01, '#5a3a20'); box(hx2 - bq * 0.072, hy2 + bq * 0.112, bq * 0.144, bq * 0.024, bq * 0.008, '#c8283c');
      if (sl < 0.02 && A.stt > 0.62 && A.stt < 0.8) { var pf = (A.stt - 0.62) / 0.18; c().globalAlpha = 1 - pf; for (var dq = 0; dq < 6; dq++) { var dqa = dq / 6 * Math.PI * 2; D.circ(hx2 + Math.cos(dqa) * base * (0.1 + pf * 0.08), hy2 + base * 0.13 + Math.sin(dqa) * base * 0.03, base * 0.015, '#fff3d6'); } c().globalAlpha = 1; } }
    if (over) { if (HW0.bony) { ctx.strokeStyle = HW0.bony; ctx.lineWidth = Math.max(1.5, HW0.l * 0.5); ctx.beginPath(); var fa1 = Math.atan2(HW0.hx - HW0.ex, HW0.hy - HW0.ey); for (var fg = -1; fg <= 1; fg++) { var fa = fa1 + fg * 0.35; ctx.moveTo(HW0.hx, HW0.hy); ctx.lineTo(HW0.hx + Math.sin(fa) * HW0.r, HW0.hy + Math.cos(fa) * HW0.r); } ctx.stroke(); } else if (HW0.col) D.circ(HW0.hx, HW0.hy, HW0.r, HW0.col, HW0.l * 0.7); }
  });
  // эффекты: салют, дыхание Горыныча, колесница
  m.fx = m.fx.filter(function (f) {
    f.t += dt; if (f.t < 0) return true;
    if (f.k === 'salute') { var p2 = f.t / 1.6, fx = f.x * SW, fy = gy - Math.min(1, p2 * 3) * sh * 0.65; ctx.globalAlpha = Math.max(0, 1 - p2); if (p2 < 0.33) D.circ(fx, fy, 4 * S, '#fff'); else for (var s = 0; s < 14; s++) { var aa = s / 14 * 6.28, rr = (p2 - 0.33) * sh * 0.35; D.circ(fx + Math.cos(aa) * rr, fy + Math.sin(aa) * rr + (p2 - 0.33) * sh * 0.1, 4 * S, f.col); } ctx.globalAlpha = 1; return p2 < 1; }
    if (f.k === 'breath') { var G0 = m.actors[f.from]; if (!G0) return false; var p3 = f.t / 1.4; ctx.globalAlpha = Math.max(0, 1 - p3); for (var b = 0; b < 9; b++) D.circ(G0.x * SW + G0.dir * (base * 0.6 + b * base * 0.12 * Math.min(1, p3 * 2)), gy - base * SCL.GOR * 0.75 + Math.sin(b + t * 8) * 6, base * (0.06 + b * 0.025), '#cfeeff'); ctx.globalAlpha = 1; return p3 < 1; }
    if (f.k === 'puff') { var pp = f.t / 0.8; ctx.globalAlpha = Math.max(0, 1 - pp); for (var q = 0; q < 7; q++) { var aq = q / 7 * 6.28; D.circ(f.x * SW + Math.cos(aq) * base * 0.5 * pp, gy - base * 0.4 + Math.sin(aq) * base * 0.3 * pp, base * (0.18 + pp * 0.1), '#ffffff'); } ctx.globalAlpha = 1; return pp < 1; }
    if (f.k === 'splash') { var sp2 = f.t / 0.9; ctx.globalAlpha = Math.max(0, 1 - sp2); for (var q2 = 0; q2 < 9; q2++) { var a2 = Math.PI + q2 / 8 * Math.PI; D.circ(f.x * SW + Math.cos(a2) * base * 0.5 * sp2, gy - Math.sin(sp2 * Math.PI) * base * 0.5 + Math.sin(a2) * base * 0.2, base * 0.05, '#7fd8ff'); } ctx.globalAlpha = 1; return sp2 < 1; }
    if (f.k === 'snore') { for (var z = 0; z < 3; z++) { var zp = ((f.t * 0.5) + z / 3) % 1; ctx.globalAlpha = 1 - zp; D.text('Z', f.x * SW + zp * base * 0.4, gy - base * 1.6 - zp * base * 0.6, base * (0.16 + z * 0.04), '#fff', 'center', 'middle', 3); } ctx.globalAlpha = 1; return m.i < 2; }
    if (f.k === 'pigeon') { var pg = f.t / 2.4, pxp = SW * (1.1 - pg * 1.3), pyp = sy + sh * 0.3 - Math.sin(pg * 6) * 10; ctx.save(); ctx.translate(pxp, pyp); ctx.scale(-1, 1); D.ell(0, 0, base * 0.14, base * 0.08, '#c9cfdc', 2); D.circ(base * 0.12, -base * 0.05, base * 0.06, '#c9cfdc', 2); D.poly([0, 0, -base * 0.1, -base * 0.16 * Math.sin(t * 20), base * 0.06, 0], '#aab3c8', 1.5); D.rr(-base * 0.06, base * 0.04, base * 0.12, base * 0.08, 2); ctx.fillStyle = '#fff8e8'; ctx.fill(); ctx.restore(); return pg < 1; }
    if (f.k === 'chariot') { var p4 = f.t / 2.2, cxp = -0.2 * SW + p4 * 1.4 * SW; ctx.save(); ctx.translate(cxp, Math.max(gy - base * 1.9, gy - (gy - sy) / m.cam.z + base * 1.15) + Math.sin(p4 * 9) * 10); D.enemy({ type: 'chariot', size: Z.ENEMIES.chariot.size, dir: 1, walk: t * 8, ph: 0, hitT: 0, slow: 0, kb: 0, hp: 1, max: 1 }, 0, 0, base * 0.7, t); ctx.restore(); return p4 < 1; }
    return false;
  });
  if (Z.cutFG && m.par) { try { Z.cutFG(ctx, m.par, t); } catch (eG) { if (window.__rep) window.__rep(eG); } }   // 2.11.5: передний план — быстрее камеры
  ctx.restore();
  if (m.flash > 0) { ctx.globalAlpha = Math.min(1, m.flash) * 0.85; ctx.fillStyle = '#fff6dc'; ctx.fillRect(0, sy, W, sh); ctx.globalAlpha = 1; m.flash -= dt * 2.2; }
  // «старая плёнка» у рассказчика
  if (nar) {
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#704a1a'; ctx.fillRect(0, sy, W, sh); ctx.globalAlpha = 1;
    var vg = ctx.createRadialGradient(W / 2, sy + sh / 2, sh * 0.3, W / 2, sy + sh / 2, sh * 0.9); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); ctx.fillStyle = vg; ctx.fillRect(0, sy, W, sh);
    for (var sc = 0; sc < 14; sc++) { ctx.globalAlpha = 0.25; D.circ(((sc * 97.3 + t * 300) % W), sy + ((sc * 53.1 + t * 170) % sh), 1.5, '#fff3d0'); } ctx.globalAlpha = 1;
  }
  // шторка-диафрагма при смене сцены и в конце
  var iris = m.segT < 0.6 ? ease(m.segT / 0.6) : m.outT ? 1 - ease(m.outT / 0.6) : 1;
  if (iris < 1) { ctx.save(); ctx.fillStyle = '#0b1028'; ctx.beginPath(); ctx.rect(0, sy, W, sh); var ir = Math.max(1, iris * Math.hypot(W, sh) * 0.6); ctx.moveTo(W / 2 + ir, sy + sh / 2); ctx.arc(W / 2, sy + sh / 2, ir, 0, Math.PI * 2, true); ctx.closePath(); ctx.fill('evenodd'); ctx.restore(); }
  // заголовок и субтитры
  D.text(TT(M.ru, M.en), W / 2, sy - 18 * S, 20 * S, '#ffd54a', 'center', 'middle', 3 * S);
  var txt = Z.lineText(id), lines = D.wrap(txt, Math.min(W - 40 * S, 640 * S), 17 * S).slice(0, 3);
  var by = sy + sh + 10 * S, nm = Z.LINE_NAME && Z.LINE_NAME[id] ? TT(Z.LINE_NAME[id][0], Z.LINE_NAME[id][1]) : Z.VNAME[v0] ? TT(Z.VNAME[v0][0], Z.VNAME[v0][1]) : '';
  // узкий экран: длинная реплика не должна залезать под кнопку «Дальше» — поднимаем блок текста на подложке
  var over27 = (by + 28 * S + (lines.length - 1) * 22 * S + 12 * S) - (H - 54 * S);
  if (over27 > 0 && W < 900 * S) { by -= over27; ctx.fillStyle = 'rgba(11,16,40,0.82)'; ctx.fillRect(0, by - 6 * S, W, sy + sh - by + 6 * S); }
  D.text(nm, W / 2, by + 6 * S, 14 * S, Z.VCOL[v0] || '#fff');
  lines.forEach(function (ln, i) { D.text(ln, W / 2, by + 28 * S + i * 22 * S, 17 * S, nar ? '#ffe9a8' : '#ffffff', 'center', 'middle', 3 * S); });
  for (var d2 = 0; d2 < ids.length; d2++) D.circ(W / 2 - (ids.length - 1) * 6 * S + d2 * 12 * S, H - 14 * S, 3 * S, d2 === m.i ? COL.gold : '#5a6385');
  var api = UI.api();
  // касание экрана больше не листает сцену — только кнопка «Дальше»
  api.button('mNext', W - 120 * S, H - 50 * S, 110 * S, 38 * S, { modal: true, r: 12 * S, c1: 'rgba(95,116,184,0.85)', c2: '#43579a', label: Z.TT('Дальше ›', 'Next ›'), px: 14 * S, fn: function () { if (Z.time - (m.tapT || 0) < 0.25) return; m.tapT = Z.time; var DDc = Z.MDIR && Z.MDIR[ids[m.i]];
    // 1-е нажатие во время реплики: обрываем голос, но действие сцены (подпись, взрыв) доигрываем; 2-е — дальше
    if (m.wait || m.speaking) { m.cut = m.i; Z.stopLine && Z.stopLine(); m.speaking = false; m.wait = false; if (DDc && DDc.after && m.afterFor !== m.i) { m.afterFor = m.i; applyDir(m, DDc.after); m.doneT = Z.time; m.post = DDc.post || 1.2; return; } }
    m.doneT = Z.time - 5; m.post = 0; } });
  // экран не гаснет, пока идёт мультфильм
  if (!m.wl && navigator.wakeLock && navigator.wakeLock.request) { m.wl = 1; navigator.wakeLock.request('screen').then(function (l) { m.wlObj = l; if (UI.modal !== m) l.release(); }).catch(function () {}); }
  api.button('mSkip', W - 110 * S, 10 * S, 100 * S, 36 * S, { modal: true, c1: 'rgba(95,116,184,0.85)', c2: '#43579a', label: T('skip'), fn: function () { Z.stopLine && Z.stopLine(); end(); } });
};
})();
