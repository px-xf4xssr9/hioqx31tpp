/* 2.8 · звук слышен на телефоне, быстрее отрисовка, умнее враги */
(function () {
'use strict';
var Z = window.Z, AU = Z.AU;

// ---------- звук: эффекты не тонут в музыке ----------
// На динамике телефона низкие «удары» не слышны, а музыка в бою шла на ~12 дБ громче эффектов.
// Эффекты получают «присутствие» (подъём 2–4 кГц), музыка в бою и при боссе стихает, а частые
// выстрелы на миг приглушают её ещё немного.
var BED = { battle: 0.5, boss: 0.55, build: 0.8, map: 1, comic: 1 };
function bed() { return BED[AU.state] || 1; }
var ducking = false;
function musTarget() { return AU.musicVol * 0.9 * bed() * (ducking ? 0.4 : 1); }
function applyMus(tc) { if (AU.musG && AU.ctx) { var m = musTarget(); AU.musG.gain.setTargetAtTime(m, AU.ctx.currentTime, tc || 0.4); if (AU.musRev) AU.musRev.gain.setTargetAtTime(m / 0.63, AU.ctx.currentTime, tc || 0.4); } }
var SFX_K = 1.6;
var oldInit = AU.init;
AU.init = function () {
  var had = !!this.ctx; oldInit.apply(this, arguments);
  if (had || !this.ctx || !this.sfxG || this.pres) return;
  var c = this.ctx;
  try {
    this.sfxG.disconnect();
    var lo = c.createBiquadFilter(); lo.type = 'lowshelf'; lo.frequency.value = 110; lo.gain.value = -4;
    var pres = c.createBiquadFilter(); pres.type = 'peaking'; pres.frequency.value = 2800; pres.Q.value = 0.7; pres.gain.value = 7;
    this.sfxG.connect(lo); lo.connect(pres); pres.connect(this.master);
    this.pres = pres;
    this.sfxG.gain.value = this.sfxVol * SFX_K;
  } catch (e) { try { this.sfxG.connect(this.master); } catch (e2) { if (window.__rep) window.__rep(e2); } }
};
AU.setVolumes = function (m, s) {
  this.musicVol = m; this.sfxVol = s;
  if (!this.ctx) return;
  applyMus(0.05);
  if (this.sfxG) this.sfxG.gain.setTargetAtTime(s * SFX_K, this.ctx.currentTime, 0.05);
};
var oldSet = AU.setState;
AU.setState = function (st, k) { var was = this.state; oldSet.apply(this, arguments); if (was !== st) applyMus(0.6); };
// приглушение под реплику (v26e) — с учётом боя
Z.duckMusic = function (on) { ducking = !!on; applyMus(0.12); };
// iPhone: звук игры не глушится переключателем «без звука» (iOS 16.4+); после звонка контекст «прерван» — будим его
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { if (window.__rep) window.__rep(e); }
var oldRes = AU.resumeIfAllowed;
AU.resumeIfAllowed = function () {
  oldRes.apply(this, arguments);
  try { if (this.ctx && this.ctx.state === 'interrupted' && this.allowed()) this.ctx.resume(); } catch (e) { if (window.__rep) window.__rep(e); }
};

// ---------- графика ----------
// 2.12.12: видов качества больше нет — всегда самое высокое; при нехватке кадров игра сама уменьшает разрешение (настройка «Разрешение»),
// а отдельные эффекты выключаются во вкладке «Эффекты». Старые сохранения с «Экономной»: тени возвращаются.
function applyGfx() {
  if (Z.save && Z.save.gfx) { if (Z.save.gfx === 'eco') Z.save.shadowsOff = false; Z.save.gfx = null; }
  Z.lowGfx = false;
  if (Z.resize) Z.resize();
  if (Z.ui) Z.ui.fieldCache = null; if (Z.G) Z.G.fieldDirty = true;
}
Z.gfxSet = function () { applyGfx(); };

// ---------- ширина текста запоминается: подписи кнопок меряются один раз, а не каждый кадр ----------
var D = Z.D, MW = new Map();
function mw(s, px) {
  var k = Math.round(px * 2) + '|' + s, w = MW.get(k);
  if (w === undefined) { var c = D.ctx; c.font = D.font(px); w = c.measureText(s).width; if (MW.size > 6000) MW.clear(); MW.set(k, w); }
  return w;
}
D.mw = mw;
try { document.fonts.addEventListener('loadingdone', function () { MW.clear(); }); } catch (e) { if (window.__rep) window.__rep(e); }
D.fitText = function (s, maxW, px) { var w = mw(s, px); D.ctx.font = D.font(px); return w > maxW ? px * maxW / w : px; };
D.wrap = function (s, maxW, px) {
  var words = String(s).split(' '), lines = [], cur = '';
  for (var i = 0; i < words.length; i++) { var t = cur ? cur + ' ' + words[i] : words[i]; if (mw(t, px) > maxW && cur) { lines.push(cur); cur = words[i]; } else cur = t; }
  if (cur) lines.push(cur); D.ctx.font = D.font(px); return lines;
};

// ---------- «Логово огрызается»: вышки впритык ко входу больше не выигрывают уровень сами ----------
// У каждого входа — логово радиусом DEN_R клеток. Если в нём стоят вышки:
//  1) враги, пока они в логове, идут под ледяной скорлупой — урон по ним сильно режется;
//  2) логово раз в несколько секунд «выдыхает» стужу: вышки в круге мёрзнут (не стреляют) и трескаются;
//  3) если у входа целая батарея, из логова выходят вышибалы — тяжёлые враги, которые идут ломать эти вышки.
// Чем больше и сильнее вышек у входа, тем злее логово. Стройте дальше по дороге — там всё по-прежнему.
var DEN_R = 3, TT = Z.TT;
function denR(G) { return G.L.W <= 16 ? 2.5 : 3; }   // на маленьких картах логово меньше — места у входа и так мало
function denOn(G) { return G && G.L && G.L.entrances && G.L.entrances.length && G.idx >= 5 && !G.tutorial; }
function dens(G) {
  if (G._den && G._den.g === G) return G._den.list;
  var B = G.L.base, list = G.L.entrances.map(function (en, i) { var y = en[1] + 0.5; if (B && en[1] === 0) y = B.S + 0.5; return { i: i, x: en[0] + 0.5, y: y, P: 0, breathT: 6, warn: 0, flash: 0, brutes: 0 }; });   // у логова босса — круг у выхода из ворот
  G._den = { g: G, list: list, recT: 0, told: false };
  return list;
}
function towerP(tw) { return 1 + 0.5 * (tw.lvl - 1); }
function recalc(G) {
  var L = dens(G);
  L.forEach(function (d) { d.P = 0; d.tw = []; });
  for (var k in G.towers) {
    var tw = G.towers[k], tx = tw.c + 0.5, ty = tw.r + 0.5; tw.den = -1;
    for (var j = 0; j < L.length; j++) { var d = L[j]; if (Math.hypot(tx - d.x, ty - d.y) <= denR(G)) { d.P += towerP(tw); d.tw.push(tw); tw.den = j; break; } }
  }
  // 2.8.1: герои, засевшие у входа, тоже злят логово
  L.forEach(function (d) { d.hs = []; });
  // 2.12.36: герои логово больше не злят и стужей не отбрасываются — злит только батарея вышек у входа
}
// у логова героям врагов не удержать (game.js → heroBlock), баррикады там ломаются втрое быстрее
Z.denNoBlock = function (x, y, e) {
  var G = Z.G; if (!denOn(G)) return false; var R = denR(G), en = G.L.entrances;
  var B = G.L.base;
  for (var i = 0; i < en.length; i++) { var ey = en[i][1] + 0.5; if (B && en[i][1] === 0) ey = B.S + 0.5; if (Math.hypot(x - en[i][0] - 0.5, y - ey) <= R) { if (e) e.rushT = 3; return true; } }
  return !!(e && e.rushT > 0);   // вышедшие из логова ещё 3 с идут напором
};
function denAt(G, x, y) {
  if (!G._den) return null; var L = G._den.list;
  for (var j = 0; j < L.length; j++) { var d = L[j]; if (d.P >= 1.5 && Math.hypot(x - d.x, y - d.y) <= denR(G)) return d; }
  return null;
}
// доля урона, которую съедает скорлупа (растёт с числом вышек у входа и к концу игры)
function shieldK(G, d) { return Math.min(0.75, 0.1 + 0.11 * d.P + 0.003 * G.idx); }
Z.denShield = function (e) { var G = Z.G; if (!denOn(G) || e.dead) return 0; var p = Z.enemyPos ? Z.enemyPos(e) : e, d = denAt(G, p.x, p.y); return d ? shieldK(G, d) : 0; };

var oldDmg = Z.hk.dmg;
Z.hk.dmg = function (e, real, opts) {
  var r = oldDmg ? oldDmg(e, real, opts) : real;
  if (r <= 0) return r;
  var G = Z.G; if (!denOn(G) || (opts && opts.hero)) return r;
  var k = Z.denShield(e); if (!k) return r;
  e.shHit = 0.25;
  return r * (1 - k);
};

function breathe(G, d) {
  var P = d.P, stun = Math.min(3.6, 2.2 + 0.2 * P), part = Math.min(0.2, 0.08 + 0.02 * P);
  d.flash = 1;
  d.tw.forEach(function (tw) {
    if (!G.towers[Z.cellKey(tw.c, tw.r)]) return;
    tw.stun = Math.max(tw.stun || 0, stun); tw.denIce = stun;
    Z.damageTower(tw, tw.max * part);
    G.fx.push({ k: 'v_breath', x: d.x, y: d.y, tx: tw.c + 0.5, ty: tw.r + 0.4, t: 0, dur: 0.7, col: 'rgba(170,220,255,0.75)' });
  });
  (d.hs || []).forEach(function (H) {
    if (H.dead) return;
    H.stunT = Math.max(H.stunT || 0, Math.min(3, stun)); H.hp -= H.max * (0.1 + part); H.hitT = 0.2; H.denIce = stun;
    // отбросить за край логова
    var dx = H.x - d.x, dy = H.y - d.y, dd = Math.hypot(dx, dy) || 0.01, R = denR(G) + 0.4;
    if (dd < R) { H.x = Math.max(0.3, Math.min(G.L.W - 0.3, d.x + dx / dd * R)); H.y = Math.max(0.3, Math.min(G.L.H - 0.3, d.y + dy / dd * R)); }
    G.fx.push({ k: 'v_breath', x: d.x, y: d.y, tx: H.x, ty: H.y - 0.4, t: 0, dur: 0.7, col: 'rgba(170,220,255,0.75)' });
  });
  G.shake = Math.max(G.shake || 0, 0.25);
  if (Z.AU.at) Z.AU.at(d.x, d.y); Z.AU.sfx('freeze', 0.8); Z.AU.sfx('ice_break', 0.6);
  // батарея у входа: логово выпускает вышибал
  if (P >= 6 && d.brutes < 6 && Z.spawn) {
    var reg = Z.REGIONS[G.info.region], pool = reg.pool.filter(function (t) { return Z.ENEMIES[t] && Z.ENEMIES[t].role === 'melee'; });
    if (!pool.length) pool = ['fat'];
    var n = P >= 9 ? 2 : 1;
    for (var i = 0; i < n; i++) { var e = Z.spawn(pool[(d.brutes + i) % pool.length], d.i, (G.waveMul || 1) * 1.1, { x: d.x + (Math.random() - 0.5) * 0.4, y: d.y + (Math.random() - 0.5) * 0.4 }); if (e) { e.denBrute = true; e.coin = Math.round((e.coin || 0) * 0.5); } }
    d.brutes += n;
  }
}

var oldUpd = Z.update;
Z.update = function (dt) {
  oldUpd.apply(this, arguments);
  var G = Z.G; if (!denOn(G)) return;
  var st = G._den || (dens(G), G._den);
  st.recT -= dt; if (st.recT <= 0) { st.recT = 0.4; recalc(G); }
  var fight = G.phase === 'wave' || G.phase === 'escortRun';
  st.list.forEach(function (d) {
    d.flash = Math.max(0, d.flash - dt * 1.6);
    if (d.warn > 0) { d.warn -= dt; if (d.warn <= 0) { d.warn = 0; if (fight && d.P >= 3) breathe(G, d); } }
    if (!fight || d.P < 3) { d.breathT = Math.max(d.breathT, 3); return; }
    d.breathT -= dt;
    if (d.breathT <= 0) { d.breathT = Math.max(5.5, 9.5 - d.P * 0.45); d.warn = 1.3; }
    if (!st.told && d.P >= 3 && d.warn > 0) {
      st.told = true;
      G.banner = { text: TT('Логово злится!', 'The den is angry!'), sub: TT('У входа враги под ледяной защитой, а вышки мёрзнут. Стройте дальше по дороге', 'Near the entrance enemies are shielded and towers freeze. Build further down the road'), t: 3.6, big: true };
    }
  });
  for (var k in G.towers) { var tw = G.towers[k]; if (tw.denIce > 0) tw.denIce -= dt; }
  (G.squad || []).forEach(function (H) { if (H.plowT > 0) H.plowT -= dt; if (H.denIce > 0) H.denIce -= dt; });
  for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (e.shHit > 0) e.shHit -= dt; if (e.rushT > 0) e.rushT -= dt; }
};

// ---------- рисование логова ----------
function drawDens(ctx, X, Y, cs, t) {
  var G = Z.G; if (!denOn(G) || !G._den) return;
  var UI = Z.ui, building = !!(UI.menu && UI.menu.kind === 'build') || !!(UI.drag && UI.drag.moved);
  G._den.list.forEach(function (d) {
    var heroNear = (G.squad || []).some(function (H) { return !H.dead && Math.hypot(H.x - d.x, H.y - d.y) < denR(G) + 1.6; });
    var on = d.P >= 1.5, a = on ? 1 : building ? 0.55 : heroNear ? 0.45 : 0;
    if (!a && !d.flash) return;
    var x = X(d.x), y = Y(d.y), r = denR(G) * cs, pul = 0.5 + 0.5 * Math.sin(t * (d.warn > 0 ? 18 : 3));
    ctx.save();
    ctx.globalAlpha = a * (on ? 0.12 + 0.06 * pul : 0.07) + d.flash * 0.35;
    ctx.fillStyle = d.warn > 0 || d.flash > 0 ? '#bfe6ff' : '#7a5ad8';
    ctx.beginPath(); ctx.ellipse(x, y, r, r, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = a * (on ? 0.65 : 0.45);
    ctx.setLineDash([cs * 0.25, cs * 0.18]); ctx.lineDashOffset = -t * cs * 0.4;
    ctx.strokeStyle = d.warn > 0 ? '#ffffff' : on ? '#b48cff' : '#9a86d8'; ctx.lineWidth = Math.max(1.5, cs * (d.warn > 0 ? 0.09 : 0.05));
    ctx.beginPath(); ctx.ellipse(x, y, r, r, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    if (d.warn > 0) { var p = 1 - d.warn / 1.3; ctx.globalAlpha = 0.25 + 0.35 * p; ctx.fillStyle = '#dff3ff'; ctx.beginPath(); ctx.ellipse(x, y, r * p, r * p, 0, 0, 7); ctx.fill(); }
    if (d.flash > 0) { ctx.globalAlpha = d.flash * 0.8; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = cs * 0.12 * d.flash; ctx.beginPath(); ctx.ellipse(x, y, r * (1.05 - d.flash * 0.3), r * (1.05 - d.flash * 0.3), 0, 0, 7); ctx.stroke(); }
    ctx.restore();
  });
}
function drawShields(ctx, X, Y, cs, t) {
  var G = Z.G; if (!denOn(G) || !G._den) return;
  var any = G._den.list.some(function (d) { return d.P >= 1.5; }); if (!any) return;
  ctx.save();
  for (var i = 0; i < G.enemies.length; i++) {
    var e = G.enemies[i]; if (e.dead || e.air || e.neutral) continue;
    var p = Z.enemyPos ? Z.enemyPos(e) : e; if (!denAt(G, p.x, p.y)) continue;
    var sz = (e.size || 1) * (e.boss ? 1.6 : 1), x = X(p.x), y = Y(p.y - (e.lift || 0) * 0.32) - cs * 0.42 * sz, h = e.shHit > 0 ? e.shHit * 4 : 0;
    ctx.globalAlpha = 0.22 + h * 0.3; ctx.fillStyle = '#cfefff'; ctx.beginPath(); ctx.ellipse(x, y, cs * 0.42 * sz, cs * 0.52 * sz, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.7 + h * 0.3; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, cs * 0.035); ctx.stroke();
    ctx.globalAlpha = 0.8; ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - cs * 0.14 * sz, y - cs * 0.2 * sz, cs * 0.12 * sz, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
  }
  // замёрзшие стужей вышки — ледяная корка
  for (var k in G.towers) {
    var tw = G.towers[k]; if (!(tw.denIce > 0)) continue;
    var tx = X(tw.c + 0.5), ty = Y(tw.r + 0.5), aa = Math.min(1, tw.denIce);
    ctx.globalAlpha = 0.45 * aa; ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.ellipse(tx, ty - cs * 0.2, cs * 0.42, cs * 0.5, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.9 * aa; D.flake && D.flake(tx, ty - cs * 0.95, cs * 0.16, '#ffffff');
  }
  ctx.restore();
}
var oldUnder = Z.drawUnder;
Z.drawUnder = function (ctx, X, Y, cs, t) { if (oldUnder) oldUnder(ctx, X, Y, cs, t); try { drawDens(ctx, X, Y, cs, t); } catch (e) { ctx.globalAlpha = 1; ctx.setLineDash([]); } };
var oldOver = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) { try { drawShields(ctx, X, Y, cs, t); } catch (e) { ctx.globalAlpha = 1; } if (oldOver) oldOver(ctx, X, Y, cs, t); };



// ---------- Болото (Камыши Кикиморы): болото — на самой дороге, растёт вдоль неё, в камышах враги прячутся ----------
// Раньше болотные пятна ставились на пустую землю в стороне от дороги — враги туда не заходили, «прятки» не работали.
// настоящие маршруты врагов (по полю обхода), а не нарисованные дорожки карты
function swPaths(G) {
  var L = G.L, out = [];
  if (Z.tracePath) L.entrances.forEach(function (en) { try { var p = Z.tracePath(en[0], en[1], 'walk'); if (p && p.length > 6) out.push(p); } catch (e) { if (window.__rep) window.__rep(e); } });
  if (!out.length) out = (L.paths && L.paths.length ? L.paths : [L.main]).filter(function (p) { return p && p.length > 6; });
  return out;
}
function swOk(G, c, r) {
  var L = G.L; if (!L.grid[r] || L.grid[r][c] !== 1) return false;
  if (L.entrances.some(function (e) { return Math.hypot(c - e[0], r - e[1]) < denR(G) + 1; })) return false;
  if (L.fort && Math.hypot(c - L.fort[0], r - L.fort[1]) < 3) return false;
  return true;
}
Z.swampSeed = function (G) { G.swNeed = true; };   // сеем на первом кадре боя-уровня: тогда уже известны маршруты врагов
function swampSeedNow(G) {
  G.swNeed = false;
  var L = G.L, ps = swPaths(G).slice().sort(function (a, b) { return b.length - a.length; }).slice(0, 2);
  G.swRoad = {};
  ps.forEach(function (p, pi) {
    var mid = Math.floor(p.length * (pi ? 0.6 : 0.45));
    for (var i = mid - 1; i <= mid + 1; i++) { var q = p[i]; if (q && swOk(G, q[0], q[1])) { var k = q[1] * L.W + q[0]; G.swamp[k] = 9999; G.swRoad[k] = 1; } }
  });
  Z.navDirty && Z.navDirty();
};
Z.swampGrow = function (G) {
  var L = G.L, keys = Object.keys(G.swRoad || {}); if (!keys.length) { swampSeedNow(G); return; }
  if (keys.length >= 14) return;
  var cand = [];
  keys.forEach(function (k) { k = +k; var c = k % L.W, r = Math.floor(k / L.W); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var cc = c + d[0], rr = r + d[1], kk = rr * L.W + cc; if (!G.swRoad[kk] && swOk(G, cc, rr)) cand.push(kk); }); });
  if (!cand.length) return;
  var k2 = cand[Math.floor(Math.random() * cand.length)]; G.swamp[k2] = 9999; G.swRoad[k2] = 1;
  _textAt(G, TT('Болото растёт', 'The swamp grows'), k2 % L.W + 0.5, Math.floor(k2 / L.W) + 0.2, '#b8e07a');
  Z.navDirty && Z.navDirty();
};
function _textAt(G, s, x, y, col) { G.texts.push({ s: s, x: x, y: y, c: col, t: 0, dur: 1.4, sz: 0.6 }); }
function belkaNear(G, e) { return (G.squad || []).some(function (U) { return U.type === 'belka' && !U.dead && Math.hypot(U.x - e.x, U.y - e.y) < 3; }); }
function inReeds(G, e) { if (!G.swamp || e.air || e.boss) return false; var k = Math.floor(e.y) * G.L.W + Math.floor(e.x); return G.swamp[k] > 0; }
var oldUnseen = Z.hk.unseen;
Z.hk.unseen = function (e) {
  if (oldUnseen && oldUnseen(e)) return true;
  var G = Z.G; if (!G || !inReeds(G, e)) return false;
  return !(e.spotT > 0) && !belkaNear(G, e);   // попадание (e.spotT) и Белка рядом — выдают врага
};
// камыши поверх врагов: видно, что там кто-то прячется
function drawReeds(ctx, X, Y, cs, t) {
  var G = Z.G; if (!G || !G.swamp) return;
  var L = G.L, any = false; for (var k in G.swamp) { any = true; break; } if (!any) return;
  // 2.12: камыши (тысячи штрихов за кадр) — готовыми кадрами по фазе качания (v30o); глаза в камышах — живьём
  if (Z.sceneAnim && ctx === D.ctx && !reedsIn) {
    var st = []; for (var kq in G.swamp) { if (G.swamp[kq] >= 2) st.push(kq); }
    if (st.length) { reedsIn = 1; try { Z.sceneAnim('reeds|' + st.join(','), t, Math.PI * 2 / 1.6, Z.scenePhases(48, 32, 20), function (tq) { drawReeds(D.ctx, X, Y, cs, tq); }); } finally { reedsIn = 0; } }   // устоявшиеся — кадрами
    reedsIn = -1; try { drawReeds(ctx, X, Y, cs, t); } finally { reedsIn = 0; }   // растущие — живьём
    ctx.save(); reedEyes(ctx, X, Y, cs, G); ctx.restore(); return;
  }
  ctx.save(); ctx.lineCap = 'round';
  for (var k2 in G.swamp) {
    var v = G.swamp[k2]; if (!(v > 0) || (reedsIn && (reedsIn > 0) !== (v >= 2))) continue;
    var c = k2 % L.W, r = Math.floor(k2 / L.W), road = L.grid[r] && L.grid[r][c] === 1; if (!road && v < 9000) continue;
    var a = Math.min(1, v / 2) * (road ? 1 : 0.7), x0 = X(c), y0 = Y(r - (((L.hgt && L.hgt[r] && L.hgt[r][c]) ? 0.32 : 0) + (Z.cellLift ? Z.cellLift(c, r) : 0)));
    for (var i = 0; i < 6; i++) {
      var bx = x0 + cs * (road ? 0.3 + ((i * 37 + c * 11 + r * 7) % 40) / 100 : 0.12 + ((i * 37 + c * 11 + r * 7) % 76) / 100), by = y0 + cs * (road ? 0.62 + ((i * 53 + c * 5) % 22) / 100 : 0.55 + ((i * 53 + c * 5) % 40) / 100), h = cs * (0.45 + ((i * 29 + r) % 30) / 100), sw = Math.sin(t * 1.6 + i + c) * cs * 0.05;
      ctx.globalAlpha = 0.95 * a; ctx.strokeStyle = '#3d5a2a'; ctx.lineWidth = Math.max(1.5, cs * 0.06); ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + sw * 0.5, by - h * 0.5, bx + sw, by - h); ctx.stroke();
      ctx.strokeStyle = '#7aa64a'; ctx.lineWidth = Math.max(1, cs * 0.035); ctx.stroke();
      if (i % 2 === 0) { var hx = bx + sw, hy = by - h - cs * 0.05; ctx.fillStyle = '#6a3a1e'; ctx.beginPath(); ctx.ellipse(hx, hy, cs * 0.05, cs * 0.11, sw / cs, 0, 7); ctx.fill(); ctx.strokeStyle = '#2a1a0e'; ctx.lineWidth = Math.max(1, cs * 0.015); ctx.stroke(); ctx.fillStyle = 'rgba(255,220,180,0.45)'; ctx.beginPath(); ctx.ellipse(hx - cs * 0.015, hy - cs * 0.03, cs * 0.015, cs * 0.05, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#7aa64a'; ctx.lineWidth = Math.max(1, cs * 0.02); ctx.beginPath(); ctx.moveTo(hx, hy - cs * 0.1); ctx.lineTo(hx + sw * 0.2, hy - cs * 0.17); ctx.stroke(); }
      else { var lx = bx + cs * 0.04, ld = (i % 4 === 1 ? 1 : -1); ctx.fillStyle = '#5a8a3a'; ctx.beginPath(); ctx.moveTo(lx, by); ctx.quadraticCurveTo(lx + ld * cs * 0.05, by - h * 0.6, lx + ld * cs * 0.22 + sw, by - h * 0.85); ctx.quadraticCurveTo(lx + ld * cs * 0.02, by - h * 0.5, lx - ld * cs * 0.03, by); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#2f5a2a'; ctx.lineWidth = Math.max(0.8, cs * 0.015); ctx.stroke(); }
    }
  }
  if (!reedsIn) reedEyes(ctx, X, Y, cs, G);
  ctx.restore();
}
var reedsIn = 0;
// спрятавшиеся враги — глаза в камышах
function reedEyes(ctx, X, Y, cs, G) {
  G.enemies.forEach(function (e) { if (e.dead || !inReeds(G, e) || !(Z.hk.unseen(e))) return; var x = X(e.x), y = Y(e.y) - cs * 0.35; ctx.globalAlpha = 0.85; ctx.fillStyle = '#ffe86a'; ctx.beginPath(); ctx.arc(x - cs * 0.07, y, cs * 0.035, 0, 7); ctx.arc(x + cs * 0.07, y, cs * 0.035, 0, 7); ctx.fill(); });
}

// ---------- Канатная дорога: настоящий трос от станции у входа до станции посреди дороги ----------
// Кабинка забирает до трёх врагов у входа и везёт их над обороной. Перерезать трос можно, только когда кабинка едет
// с врагами: они падают и разбиваются. Потом трос чинят (20 с).
function groundNear(G, x, y, avoid) {
  var L = G.L, best = null, bd = 1e9;
  for (var r = 0; r < L.H; r++) for (var c = 0; c < L.W; c++) {
    if (L.grid[r][c] !== 0 || G.towers[r * L.W + c] || (L.bush && L.bush[r * L.W + c])) continue;
    if (avoid && avoid.some(function (q) { return Math.abs(q[0] - c) + Math.abs(q[1] - r) < 2; })) continue;
    var lm = L.landmark; if (lm && c >= lm.c && c <= lm.c + 1 && r >= lm.r && r <= lm.r + 1) continue;
    var d = Math.hypot(c + 0.5 - x, r + 0.5 - y); if (d < bd) { bd = d; best = [c, r]; }
  }
  return bd < 3.5 ? best : null;
}
var CAB_H = 1.45;
function cableInit(G) {
  if (G.cable2 !== undefined) return G.cable2;
  G.cable2 = null;
  if (G.mech !== 'cable') return null;
  var p = swPaths(G).sort(function (a, b) { return b.length - a.length; })[0]; if (!p) return null;
  var i0 = Math.min(3, p.length - 1), i1 = Math.floor(p.length * 0.62), a = groundNear(G, p[i0][0] + 0.5, p[i0][1] + 0.5), b = a && groundNear(G, p[i1][0] + 0.5, p[i1][1] + 0.5, [a]);
  if (!a || !b) return null;
  G.cable2 = { a: a, b: b, pick: p[i0], drop: p[i1], t: 8, cab: null, broken: 0 };
  return G.cable2;
}
function cTop(q) { return { x: q[0] + 0.5, y: q[1] + 0.55 - CAB_H }; }
function cablePt(C, u) { var A = cTop(C.a), B = cTop(C.b); return { x: A.x + (B.x - A.x) * u, y: A.y + (B.y - A.y) * u + Math.sin(u * Math.PI) * 0.35 }; }
function cableUpdate(G, dt) {
  var C = cableInit(G); if (!C) return;
  var fight = G.phase === 'wave' || G.phase === 'escortRun';
  if (C.broken > 0) { C.broken -= dt; if (C.broken <= 0) { C.broken = 0; C.t = 6; _textAt(G, TT('Трос починили', 'Cable repaired'), C.a[0] + 0.5, C.a[1] - 1, '#bfe6ff'); } return; }
  if (C.cab) {
    var cb = C.cab; cb.u += dt / cb.dur;
    var P = cablePt(C, Math.min(1, cb.u));
    cb.who.forEach(function (e, i) { if (e.dead) return; e.stun = Math.max(e.stun || 0, 0.2); e.ride = 1; e.x = P.x + (i - (cb.who.length - 1) / 2) * 0.16; e.y = P.y + 0.42; });
    if (cb.u >= 1) { cb.who.forEach(function (e, i) { if (e.dead) return; e.ride = 0; e.stun = 0; e.x = C.drop[0] + 0.5 + (i - 1) * 0.15; e.y = C.drop[1] + 0.5; e.tc = null; }); C.cab = null; C.t = 12; Z.AU.sfx('metal', 0.5); }
    return;
  }
  if (!fight) return;
  C.t -= dt; if (C.t > 0) return;
  var who = G.enemies.filter(function (e) { return !e.dead && !e.air && !e.boss && !e.ride && Math.hypot(e.x - C.pick[0] - 0.5, e.y - C.pick[1] - 0.5) < 1.6; }).slice(0, 3);
  if (!who.length) { C.t = 1; return; }
  var A = cTop(C.a), B = cTop(C.b);
  C.cab = { who: who, u: 0, dur: Math.max(2.6, Math.hypot(B.x - A.x, B.y - A.y) / 2.2) };
  who.forEach(function (e) { e.ride = 1; e.stun = 0.3; });
  Z.AU.sfx('metal', 0.6, { pitch: 0.8 });
  if (!G._cabTold) { G._cabTold = true; G.banner = { text: TT('Кабинка поехала!', 'The cable car is moving!'), sub: TT('Нажми на трос, пока она едет, — враги упадут', 'Tap the cable while it moves — the enemies will fall'), t: 3, big: true }; }
}
function segDist(px, py, A, B) { var vx = B.x - A.x, vy = B.y - A.y, l2 = vx * vx + vy * vy || 1, u = Math.max(0, Math.min(1, ((px - A.x) * vx + (py - A.y) * vy) / l2)); return Math.hypot(px - A.x - vx * u, py - A.y - vy * u); }
var oldMechTap = Z.mechTap;
Z.mechTap = function (c, r) {
  var G = Z.G, C = G && G.mech === 'cable' ? cableInit(G) : null;
  if (C) {
    var px = c + 0.5, py = r + 0.5, A = cTop(C.a), B = cTop(C.b), mid = cablePt(C, 0.5);
    var near = Math.min(segDist(px, py, A, mid), segDist(px, py, mid, B)) < 0.85 || (c === C.a[0] && r === C.a[1]) || (c === C.b[0] && r === C.b[1]);
    if (near) {
      if (C.broken > 0) { _textAt(G, TT('Трос чинят…', 'Being repaired…'), px, py - 0.3, '#bfe6ff'); return true; }
      if (!C.cab) { _textAt(G, TT('Режь, когда кабинка едет с врагами!', 'Cut it while the car carries enemies!'), px, py - 0.3, '#ffe066'); Z.AU.sfx('error', 0.4); return true; }
      var P = cablePt(C, C.cab.u);
      C.cab.who.forEach(function (e) { if (e.dead) return; e.ride = 0; e.x = P.x; e.y = Math.min(G.L.H - 0.5, P.y + CAB_H + 0.2); e.tc = null; e.stun = 1.5; Z.damage(e, e.max * 0.65, { pierceArmor: true }); });
      G.fx.push({ k: 'boom', x: P.x, y: P.y + CAB_H, t: 0, dur: 0.6 });
      C.cabFall = { x: P.x, y: P.y, t: 0 }; C.cab = null; C.broken = 20; G.shake = Math.max(G.shake || 0, 0.4);
      Z.AU.sfx('crack', 0.9); Z.AU.sfx('crash', 0.5);
      G.banner = { text: TT('Трос перерезан!', 'Cable cut!'), sub: TT('Починят через 20 секунд', 'Repaired in 20 seconds'), t: 1.8 };
      return true;
    }
    // старое «перерезать по ориентиру» больше не действует
    var lm = G.L.landmark; if (lm && c >= lm.c && c <= lm.c + 1 && r >= lm.r && r <= lm.r + 1) return true;
  }
  return oldMechTap ? oldMechTap(c, r) : false;
};
Z.canBuildAt = (function (old) { return function (c, r) { var G = Z.G, C = G && G.cable2; if (C && ((c === C.a[0] && r === C.a[1]) || (c === C.b[0] && r === C.b[1]))) return false; return old.apply(this, arguments); }; })(Z.canBuildAt);
function drawStation(ctx, X, Y, cs, q, t, spin) {
  var x = X(q[0] + 0.5), y = Y(q[1] + 0.55), h = CAB_H * cs, l = Math.max(1.5, cs * 0.05), OL = D.OL;
  D.ell(x, y, cs * 0.42, cs * 0.14, 'rgba(40,50,90,0.25)');
  ctx.lineCap = 'round';
  [[-0.28, 0], [0.28, 0]].forEach(function (o) { ctx.strokeStyle = OL; ctx.lineWidth = l * 3; ctx.beginPath(); ctx.moveTo(x + o[0] * cs, y); ctx.lineTo(x, y - h); ctx.stroke(); ctx.strokeStyle = '#7a7f8e'; ctx.lineWidth = l * 1.6; ctx.stroke(); });
  ctx.strokeStyle = '#7a7f8e'; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(x - cs * 0.16, y - h * 0.45); ctx.lineTo(x + cs * 0.16, y - h * 0.45); ctx.stroke();
  D.circ(x, y - h, cs * 0.13, '#c9cfdc', l); ctx.save(); ctx.translate(x, y - h); ctx.rotate(spin); ctx.strokeStyle = OL; ctx.lineWidth = l * 0.7; ctx.beginPath(); ctx.moveTo(-cs * 0.1, 0); ctx.lineTo(cs * 0.1, 0); ctx.moveTo(0, -cs * 0.1); ctx.lineTo(0, cs * 0.1); ctx.stroke(); ctx.restore();
}
function drawCabin(ctx, x, y, cs, sw, full) {
  var l = Math.max(1.5, cs * 0.05), OL = D.OL, w = cs * 0.62, h = cs * 0.5;
  ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
  ctx.strokeStyle = OL; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, cs * 0.18); ctx.stroke();
  D.rr(-w / 2, cs * 0.18, w, h, cs * 0.08); ctx.fillStyle = '#e8484f'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  D.rr(-w / 2 + cs * 0.07, cs * 0.25, w - cs * 0.14, h * 0.45, cs * 0.05); ctx.fillStyle = full ? 'rgba(40,40,70,0.55)' : '#bfe6ff'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.stroke();
  ctx.restore();
}
function drawCable(ctx, X, Y, cs, t) {
  var G = Z.G, C = G && G.cable2; if (!C) return;
  var A = cTop(C.a), B = cTop(C.b), l = Math.max(1.5, cs * 0.05);
  var moving = !!C.cab, spin = moving ? t * 6 : 0;
  drawStation(ctx, X, Y, cs, C.a, t, spin); drawStation(ctx, X, Y, cs, C.b, t, -spin);
  ctx.save(); ctx.lineCap = 'round';
  if (C.broken > 0) {
    // оборванный трос свисает от верхней станции, рядом — бригада чинит (полоса времени)
    ctx.strokeStyle = '#3d3d3d'; ctx.lineWidth = l * 0.9; ctx.beginPath(); ctx.moveTo(X(A.x), Y(A.y)); ctx.quadraticCurveTo(X(A.x + (B.x - A.x) * 0.15), Y(A.y + 0.6), X(A.x + (B.x - A.x) * 0.18), Y(A.y + CAB_H * 0.9)); ctx.stroke();
    var f = 1 - C.broken / 20, bx = X(A.x) - cs * 0.4, by = Y(A.y) - cs * 0.45;
    D.rr(bx, by, cs * 0.8, cs * 0.12, cs * 0.06); ctx.fillStyle = 'rgba(30,35,60,0.6)'; ctx.fill(); D.rr(bx, by, cs * 0.8 * f, cs * 0.12, cs * 0.06); ctx.fillStyle = '#ffd54a'; ctx.fill();
    D.text('🔧', X(A.x) + cs * 0.55, by + cs * 0.06, cs * 0.28, '#fff', 'center', 'middle', 0);
  } else {
    ctx.strokeStyle = '#3d3d3d'; ctx.lineWidth = l * 0.9; ctx.beginPath(); ctx.moveTo(X(A.x), Y(A.y));
    for (var i = 1; i <= 12; i++) { var P = cablePt(C, i / 12); ctx.lineTo(X(P.x), Y(P.y)); } ctx.stroke();
    var u = moving ? Math.min(1, C.cab.u) : 0.04, Q = cablePt(C, u);
    drawCabin(ctx, X(Q.x), Y(Q.y), cs, moving ? Math.sin(t * 5) * 0.06 : 0, moving);
    if (moving) { var M = cablePt(C, Math.min(0.92, u + 0.18)), pu = 0.6 + 0.4 * Math.sin(t * 10); ctx.globalAlpha = pu; D.circ(X(M.x), Y(M.y), cs * 0.26, 'rgba(255,224,102,0.35)'); D.text('✂', X(M.x), Y(M.y), cs * 0.32, '#3a2a10', 'center', 'middle', 0); ctx.globalAlpha = 1; }
  }
  if (C.cabFall) { var cf = C.cabFall; cf.t += Z.frameDt || 0.016; if (cf.t < 0.8) { ctx.globalAlpha = 1 - cf.t / 0.8; drawCabin(ctx, X(cf.x), Y(cf.y + cf.t * cf.t * 4), cs, cf.t * 3, false); ctx.globalAlpha = 1; } else C.cabFall = null; }
  ctx.restore();
}
var oldUpd2 = Z.update;
Z.update = function (dt) { oldUpd2.apply(this, arguments); var G = Z.G; if (!G) return; if (G.swNeed) { try { swampSeedNow(G); } catch (e) { G.swNeed = false; } } if (G.mech === 'cable') { try { cableUpdate(G, dt); } catch (e) { if (window.__rep) window.__rep(e); } } };
var oldOver2 = Z.drawOver;
Z.drawOver = function (ctx, X, Y, cs, t) {
  try { drawReeds(ctx, X, Y, cs, t); } catch (e) { ctx.globalAlpha = 1; }
  try { if (Z.drawFrogs) Z.drawFrogs(ctx, X, Y, cs, t); } catch (e) { ctx.globalAlpha = 1; }
  try { drawCable(ctx, X, Y, cs, t); } catch (e) { ctx.globalAlpha = 1; }
  if (oldOver2) oldOver2(ctx, X, Y, cs, t);
};


// ---------- толпа: враги не слипаются в одну кучу и не застревают ----------
// 1) личное пространство: соседи мягко расходятся поперёк и вдоль дороги (только по проходимым клеткам);
// 2) если враг 2,5 с не продвигается и ничем не занят (не бьёт, не строит, не стоит у героя/баррикады) — ищет путь заново
//    и смещается в соседнюю полосу; через 5 с — делает шаг к ближайшей клетке ближе к цели.
function navOf(G, e) { var pf = Z._.profileOf ? Z._.profileOf(e) : 'walk'; return G.nav && (G.nav[pf] || G.nav.walk); }
function crowd(G, dt) {
  var L = G.L, W = L.W, H = L.H, list = [], cellMap = {}, i, j;
  for (i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (e.dead || e.air || e.neutral || e.ride || e.siege || e.type === 'hutE') continue; list.push(e); var k = Math.floor(e.x) + ',' + Math.floor(e.y); (cellMap[k] || (cellMap[k] = [])).push(e); }
  for (i = 0; i < list.length; i++) {
    var a = list[i], ca = Math.floor(a.x), ra = Math.floor(a.y), px = 0, py = 0, ra0 = 0.22 * (a.size || 1) * (a.boss ? 1.4 : 1);
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      var arr = cellMap[(ca + dx) + ',' + (ra + dy)]; if (!arr) continue;
      for (j = 0; j < arr.length; j++) {
        var b = arr[j]; if (b === a) continue;
        var rb = 0.22 * (b.size || 1) * (b.boss ? 1.4 : 1), mx = a.x - b.x, my = a.y - b.y, d = Math.sqrt(mx * mx + my * my), md = ra0 + rb;
        if (d >= md) continue;
        if (d < 1e-3) { mx = (a.id - b.id) || 0.01; my = 0; d = Math.abs(mx); }
        var push = (md - d) / md, w = (b.boss || (b.size || 1) > (a.size || 1) * 1.2) ? 1.4 : 1;
        px += mx / d * push * w; py += my / d * push * w;
      }
    }
    if (!px && !py) continue;
    // назад не толкаем: встречная часть толчка превращается в шаг вбок (обход стоящего впереди)
    if (a.tc) { var fx = a.tc[0] + 0.5 - a.x, fy = a.tc[1] + 0.5 - a.y, fl = Math.hypot(fx, fy); if (fl > 0.01) { fx /= fl; fy /= fl; var back = px * fx + py * fy; if (back < 0) { px -= fx * back; py -= fy * back; var sg = (a.lane || 0) >= 0 ? 1 : -1; px += -fy * sg * -back; py += fx * sg * -back; } } }
    var sp = Math.min(1.2, Math.hypot(px, py)) * dt * 1.6, n = Math.hypot(px, py) || 1, nx = a.x + px / n * sp, ny = a.y + py / n * sp;
    var c2 = Math.floor(nx), r2 = Math.floor(ny);
    if (c2 === ca && r2 === ra) { a.x = nx; a.y = ny; continue; }
    // в другую клетку — только если она проходима для этого врага
    var nav = navOf(G, a); if (c2 < 0 || r2 < 0 || c2 >= W || r2 >= H) continue;
    if (nav && nav[r2 * W + c2] !== undefined && nav[r2 * W + c2] !== Infinity) { a.x = nx; a.y = ny; }
  }
  // застрявшие
  for (i = 0; i < list.length; i++) {
    var q = list[i]; if (q.busyT > 0) { q.busyT -= dt; q.stk = 0; q.stkD = q.dleft; continue; }
    if (q.stun > 0 || q.boss) { q.stk = 0; q.stkD = q.dleft; continue; }
    if (q.stkD === undefined || q.dleft < q.stkD - 0.08) { q.stkD = q.dleft; q.stk = 0; continue; }
    q.stk = (q.stk || 0) + dt;
    if (q.stk > 2.5 && !q.unst1) { q.unst1 = true; q.tc = null; q.lane = (Math.random() - 0.5) * 0.5; }
    if (q.stk > 5) {
      var nv = navOf(G, q), cx = Math.floor(q.x), cy = Math.floor(q.y), best = null, bv = nv ? nv[cy * W + cx] : Infinity;
      if (nv) for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) { var x2 = cx + ox, y2 = cy + oy; if (x2 < 0 || y2 < 0 || x2 >= W || y2 >= H) continue; var vv = nv[y2 * W + x2]; if (vv !== undefined && vv < bv) { bv = vv; best = [x2, y2]; } }
      if (best) { var tx = best[0] + 0.5 - q.x, ty = best[1] + 0.5 - q.y, tl = Math.hypot(tx, ty) || 1; q.x += tx / tl * Math.min(tl, 0.35); q.y += ty / tl * Math.min(tl, 0.35); }
      q.tc = null; q.stk = 2.6; q.unst1 = false; q.stkD = q.dleft + 0.5;
    }
  }
}
var oUpdCrowd = Z.update;
Z.update = function (dt) { oUpdCrowd.apply(this, arguments); var G = Z.G; if (G && G.enemies && G.enemies.length && (G.phase === 'wave' || G.phase === 'escortRun' || G.phase === 'between')) { try { crowd(G, dt); } catch (e) { if (window.__rep) window.__rep(e); } } };

// ---------- 2.12.34: адаптивная сложность ----------
// Игра незаметно следит, как идёт бой, и подстраивает силу врагов (их здоровье) в обе стороны:
//  • умение игрока Z.save.skill (0,7…1,2; новичок — 0,95) — запоминается между уровнями: растёт за чистые победы, падает за поражения;
//  • внутри уровня G.flow: после каждой волны — смотрим, задели ли ёлку и как близко к ней враги успевали дойти
//    (бьёт далеко и без потерь — следующая волна крепче, до +40 %; ёлку бьют — мягче, до −30 %);
//  • «спасение» посреди волны: ёлка упала ниже 50 % и 30 % — оставшиеся враги волны выходят на 12 % слабее (каждый порог — один раз за волну);
//  • стратегия: если монеты копятся, а ёлку бьют — подсказка «потрать монеты» (а не наказание).
// Работает со 2-го уровня (1-й — обучение), кроме героического, бесконечного и испытаний. В сопровождении — только умение на старте.
function ddaOn(G) { return G && !G.endless && !G.heroic && !G.trial && G.info && G.idx >= 1 && G.L; }
function skill() { var k = Z.save && Z.save.skill; if (typeof k !== 'number') { k = 0.95; if (Z.save && Z.save.flowSkill > 1) k = Math.min(1.1, Z.save.flowSkill); } return Math.max(0.7, Math.min(1.2, k)); }
function setSkill(k) { if (Z.save) { Z.save.skill = +Math.max(0.7, Math.min(1.2, k)).toFixed(3); Z.persist && Z.persist(); } }
Z.ddaSkill = skill;
var oCall = Z.callWave;
Z.callWave = function () {
  var G = Z.G, w0 = G && G.wave, ph0 = G && G.phase, r = oCall.apply(this, arguments);
  if (!ddaOn(G)) return r;
  if (G.flow === undefined) G.flow = G.flow0 = skill();
  if (G.L.type === 'escort') { if (ph0 === 'build' && G.phase === 'escortRun') G.waveMul *= G.flow; return r; }
  if (G.wave === w0) return r;
  if (G.fl) {
    var lost = Math.max(0, G.fl.hp0 - G.hp), p = G.fl.n ? G.fl.sum / G.fl.n : 1, lf = lost / Math.max(1, G.hpMax);
    if (lost <= 0 && p < 0.3) G.flow += 0.07;
    else if (lost <= 0 && p < 0.5) G.flow += 0.04;
    else if (lost <= 0) G.flow -= 0.02;            // без потерь, но враги доходили почти до ёлки — на грани
    else G.flow -= 0.05 + lf * 1.1;                 // ёлку били: чем сильнее, тем мягче следующая
    G.flow = Math.max(0.7, Math.min(1.4, G.flow));
  }
  G.fl = { hp0: G.hp, sum: 0, n: 0, r50: false, r30: false };
  G.waveMul *= G.flow;
  return r;
};
var oKillF = Z.hk.kill;
Z.hk.kill = function (e) {
  if (oKillF) oKillF(e);
  var G = Z.G; if (!ddaOn(G) || !G.fl || e.neutral || e.boss || !(e.d0 > 0)) return;
  G.fl.sum += Math.max(0, Math.min(1, 1 - e.dleft / e.d0)); G.fl.n++;
};
var oUpdF = Z.update;
Z.update = function (dt) {
  oUpdF.apply(this, arguments);
  var G = Z.G; if (!ddaOn(G)) return;
  for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (e.d0 === undefined && e.dleft > 0 && e.dleft < 90) e.d0 = e.dleft; }
  // спасение посреди волны: дальше выходят враги послабее (уже вышедших не трогаем — незаметно)
  if (G.fl && G.phase === 'wave' && G.L.type !== 'escort') {
    if (!G.fl.r50 && G.hp < G.hpMax * 0.5) { G.fl.r50 = true; G.waveMul *= 0.88; G.flow = Math.max(0.7, (G.flow || 1) - 0.06); }
    if (!G.fl.r30 && G.hp < G.hpMax * 0.3) { G.fl.r30 = true; G.waveMul *= 0.88; G.flow = Math.max(0.7, (G.flow || 1) - 0.06); }
    // копит монеты, а ёлку бьют — подсказка (раз за уровень)
    if (!G.tipCoins && G.hp < G.hpMax * 0.7 && G.coins >= 150 && UI0() && UI0().toast) { G.tipCoins = true; UI0().toast(Z.TT ? Z.TT('Монеты копятся — поставь или улучши вышки!', 'Coins are piling up — build or upgrade towers!') : '', '#ffe28a'); }
  }
  if ((G.phase === 'won' || G.phase === 'lost') && !G.flowSaved && Z.save) {
    G.flowSaved = true; var k = skill(), hpf = G.hp / Math.max(1, G.hpMax);
    if (G.phase === 'lost') k -= 0.08;
    else if (hpf >= 0.8) k += 0.04;
    else if (hpf >= 0.4) k += 0.01;
    else k -= 0.02;
    setSkill(k);
  }
};
function UI0() { return Z.ui; }


// ---------- у нор и ворот героям не место ----------
// Враг, который только вылезает из норы, неуязвим для всех. Пока враг внутри круга у входа (логова),
// герои его не бьют, а сами герои в круг не заходят — их выталкивает к краю.
function denCenters(G) { if (!denOn(G)) return []; return dens(G).map(function (d) { return d; }); }
Z.heroCant = function (e) {
  if (Z.hk.untargetable && Z.hk.untargetable(e)) return true;
  if (e.emT > 0) return true;
  var G = Z.G; if (!denOn(G) || e.neutral || e.repairOf) return false;
  return false;   // 2.12.36: в круге у входа герои бьют врагов как везде (неуязвим только враг, который ещё вылезает из норы)
};
var oDmgE = Z.hk.dmg;
Z.hk.dmg = function (e, real, opts) { var r = oDmgE ? oDmgE(e, real, opts) : real; if (r > 0 && e.emT > 0 && !e.neutral) return 0; return r; };
// 2.11.5: постройку у самой норы бьют с края круга
Z.structReach = function (s) { var G = Z.G; if (!denOn(G)) return 0; var R = denR(G), L = dens(G); for (var i = 0; i < L.length; i++) if (Math.hypot(s.c + 0.5 - L[i].x, s.r + 0.5 - L[i].y) < R + 0.9) return R * 0.85; return 0; };
function keepOut(G, dt) {
  var L = dens(G), R = denR(G) + 0.25;
  (G.squad || []).forEach(function (H) {
    if (H.dead) return;
    L.forEach(function (d) {
      var dx = H.x - d.x, dy = H.y - d.y, dd = Math.hypot(dx, dy);
      // 2.11.5: путь к цели идёт через круг — обходим его по краю, а не упираемся (герой «зависал» у норы и не шёл к приказу)
      if (dd < R + 0.05 && dd > 0.01 && H.tx !== undefined && dt) {
        var gx = H.tx - H.x, gy = H.ty - H.y, gd = Math.hypot(gx, gy);
        if (gd > 0.3 && (gx * dx + gy * dy) / (gd * dd) < 0.2) {
          var ux = -dy / dd, uy = dx / dd; if (ux * gx + uy * gy < 0) { ux = -ux; uy = -uy; }
          var st = (Z.ALLIES[H.type].spd || 1.5) * dt * 1.1, px = H.x + ux * st, py = H.y + uy * st;
          if (px < 0.35 || px > G.L.W - 0.35 || py < 0.35 || py > G.L.H - 0.35) { ux = -ux; uy = -uy; px = H.x + ux * st; py = H.y + uy * st; }
          H.x = px; H.y = py; dx = H.x - d.x; dy = H.y - d.y; dd = Math.hypot(dx, dy);
        }
      }
      if (dd < R) { if (dd < 0.01) { dx = 0; dy = 1; dd = 1; } var nx = d.x + dx / dd * R, ny = d.y + dy / dd * R; H.x += (nx - H.x) * 0.25; H.y += (ny - H.y) * 0.25; }
      if (H.tx !== undefined) { var tx = H.tx - d.x, ty = H.ty - d.y, td = Math.hypot(tx, ty); if (td < R) { if (td < 0.01) { tx = 0; ty = 1; td = 1; } H.tx = d.x + tx / td * R; H.ty = d.y + ty / td * R; } }
      if (H.home) { var hx = H.home.x - d.x, hy = H.home.y - d.y, hd = Math.hypot(hx, hy); if (hd < R) { if (hd < 0.01) { hx = 0; hy = 1; hd = 1; } H.home.x = d.x + hx / hd * R; H.home.y = d.y + hy / hd * R; } }
    });
    H.x = Math.max(0.3, Math.min(G.L.W - 0.3, H.x)); H.y = Math.max(0.3, Math.min(G.L.H - 0.3, H.y));
  });
}
var oUpdK = Z.update;
// 2.12.36: герои снова заходят в круги у входов — выталкивание отключено (игрок не понимал, почему отряд не идёт к цели)
Z.update = function (dt) { oUpdK.apply(this, arguments); };
})();
