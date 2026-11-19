/* 2.11.4 · звук: реплики героев замолкают, когда игрок уходит с уровня, из мультфильма или комикса.
   Раньше голос мог доигрывать на карте уровней после выхода из боя. */
(function () {
'use strict';
var Z = window.Z;
var last = { scr: '', G: null, mt: '' };
setInterval(function () {
  var UI = Z.ui; if (!UI || !Z.stopLine) return;
  var scr = UI.screen, G = Z.G, m = UI.modal, mt = m ? m.type : '';
  var leftLevel = last.scr === 'level' && scr !== 'level';
  var newGame = last.G && G !== last.G;
  var closedShow = (last.mt === 'mult' || last.mt === 'cut' || last.mt === 'comic') && mt !== last.mt;
  if (leftLevel || newGame || closedShow) Z.stopLine();
  last.scr = scr; last.G = G; last.mt = mt;
}, 120);
})();

/* 2.11.4 · главное меню: параллакс — луна, дальние горы, лес на холмах и два слоя снега двигаются с разной скоростью
   (медленный дрейф + за пальцем/мышью). Передний план (ёлка, герои, кнопки) стоит на месте. */
(function () {
'use strict';
var Z = window.Z, D = Z.D;
var P = { tx: 0, ty: 0, x: 0, y: 0 };
function mv(e) { var w = innerWidth || 1, h = innerHeight || 1; P.tx = Math.max(-1, Math.min(1, (e.clientX / w) * 2 - 1)); P.ty = Math.max(-1, Math.min(1, (e.clientY / h) * 2 - 1)); }
window.addEventListener('pointermove', mv, { passive: true });
window.addEventListener('pointerdown', mv, { passive: true });
function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
var lt = 0;
function off(t) {
  var dt = Math.min(0.1, Math.max(0, t - lt)); lt = t;
  var k = 1 - Math.exp(-dt * 2.2); P.x += (P.tx - P.x) * k; P.y += (P.ty - P.y) * k;
  return { x: P.x * 0.8 + Math.sin(t * 0.13) * 0.35, y: P.y * 0.5 + Math.sin(t * 0.09 + 1) * 0.2 };
}
var O = { x: 0, y: 0 };
function ridge(c, W, base, amp, seed, step, sh, col, capCol) {
  c.fillStyle = col; c.beginPath(); c.moveTo(-W * 0.2 + sh, base + 400);
  var pts = [];
  for (var x = -W * 0.2, i = 0; x <= W * 1.2 + step; x += step, i++) { var y = base - amp * (0.35 + 0.65 * rnd(seed + i)); pts.push([x + sh, y]); c.lineTo(x + sh, y); }
  c.lineTo(W * 1.2 + sh + step, base + 400); c.closePath(); c.fill();
  if (capCol) { c.fillStyle = capCol; for (var j = 1; j < pts.length - 1; j++) { var p = pts[j]; if (p[1] > pts[j - 1][1] || p[1] > pts[j + 1][1]) continue; var w = step * 0.22; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] - w, p[1] + w * 0.8); c.lineTo(p[0] - w * 0.3, p[1] + w * 0.55); c.lineTo(p[0], p[1] + w * 0.9); c.lineTo(p[0] + w * 0.35, p[1] + w * 0.55); c.lineTo(p[0] + w, p[1] + w * 0.8); c.closePath(); c.fill(); } }
}
function fir(c, x, y, h, col) { c.fillStyle = col; for (var k = 0; k < 3; k++) { var yy = y - h * (0.3 * k), w = h * (0.42 - 0.1 * k); c.beginPath(); c.moveTo(x, yy - h * 0.45); c.lineTo(x - w, yy); c.lineTo(x + w, yy); c.closePath(); c.fill(); } c.fillStyle = 'rgba(235,244,255,.75)'; c.beginPath(); c.moveTo(x, y - h * 1.05); c.lineTo(x - h * 0.1, y - h * 0.86); c.lineTo(x + h * 0.1, y - h * 0.86); c.closePath(); c.fill(); }
function snow(c, W, H, t, n, seed, r0, sp, sh, a) {
  c.fillStyle = '#fff';
  for (var i = 0; i < n; i++) {
    var d = rnd(seed + i), r = r0 * (0.6 + d * 0.8), x = ((rnd(seed + i + 50) * W * 1.2 + Math.sin(t * 0.7 + i) * 18 * r0 + sh) % (W * 1.2) + W * 1.2) % (W * 1.2) - W * 0.1;
    var y = ((rnd(seed + i + 90) * H + t * sp * (0.6 + d * 0.6)) % (H + 20)) - 10;
    c.globalAlpha = a * (0.5 + d * 0.5); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
}
Z.menuBack = function (W, H, ground, s, t, th) {
  var c = D.ctx; O = off(t);
  // луна
  var mx = W * 0.82 - O.x * W * 0.012, my = Math.max(70 * s, H * 0.13) - O.y * 6 * s, mr = Math.min(34 * s, W * 0.06);
  var g = c.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 4); g.addColorStop(0, 'rgba(255,244,200,.35)'); g.addColorStop(1, 'rgba(255,244,200,0)');
  c.fillStyle = g; c.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
  c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill();
  c.fillStyle = 'rgba(214,200,150,.5)'; c.beginPath(); c.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.18, 0, 7); c.arc(mx + mr * 0.25, my + mr * 0.3, mr * 0.12, 0, 7); c.fill();
  // дальний снег (позади гор)
  snow(c, W, H, t, 36, 7, 1.3 * s, 14 * s, -O.x * W * 0.02, 0.55);
  // горы и лес
  var port = W < H * 0.8, hM = port ? H * 0.17 : Math.min(th * 0.55, H * 0.22);
  // узкий экран: над ёлкой много неба — северное сияние и горы повыше заполняют его
  if (port) { c.save(); c.globalCompositeOperation = 'lighter'; for (var b = 0; b < 3; b++) { var ay = H * (0.2 + b * 0.07) - O.y * 8 * s, ag = c.createLinearGradient(0, ay - 60 * s, 0, ay + 60 * s), col = ['80,255,190', '90,180,255', '190,120,255'][b];
    ag.addColorStop(0, 'rgba(' + col + ',0)'); ag.addColorStop(0.5, 'rgba(' + col + ',' + (0.15 + 0.05 * Math.sin(t * 0.6 + b)).toFixed(3) + ')'); ag.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = ag; c.beginPath(); c.moveTo(-20, ay);
    for (var x = -20; x <= W + 20; x += 20) c.lineTo(x, ay + Math.sin(x * 0.012 + t * 0.35 + b * 1.7 - O.x) * 28 * s - 60 * s); for (x = W + 20; x >= -20; x -= 20) c.lineTo(x, ay + Math.sin(x * 0.012 + t * 0.35 + b * 1.7 - O.x) * 28 * s + 60 * s); c.closePath(); c.fill(); } c.restore(); }
  ridge(c, W, ground - th * (port ? 0.42 : 0.18), hM, 3, Math.max(70 * s, W / 9), -O.x * W * 0.022, '#22336b', 'rgba(205,222,255,.55)');
  var hB = ground - th * (port ? 0.2 : 0.06), shF = -O.x * W * 0.045;
  ridge(c, W, hB, hM * 0.35, 21, Math.max(46 * s, W / 16), shF, '#2c4283', null);
  for (var i = 0; i < 26; i++) { var fx = ((i / 26) * W * 1.3 - W * 0.15 + shF), fh = (16 + rnd(i + 5) * 16) * s; fir(c, fx, hB - hM * 0.12 * rnd(i + 9) + 2 * s, fh, '#1d3166'); }
};
Z.menuFront = function (W, H, s, t) { snow(Z.D.ctx, W, H, t, 22, 101, 2.6 * s, 34 * s, -O.x * W * 0.07, 0.8); };
})();

/* 2.11.4 · пеньки: на карте «Опушка» большой пень стал клеткой-высотой (на него ставится вышка, бьёт на 25% дальше),
   на «Пеньках-лесенках» все высоты — пеньки, а не холмики с флажком. */
(function () {
'use strict';
var Z = window.Z, D = Z.D;
D.stumpSpot = function (x, y, cs) {
  var c = D.ctx, l = Math.max(1.2, cs * 0.045), OL = '#1b2448', w = cs * 0.4, top = y - cs * 0.02, bot = y + cs * 0.26;
  c.save();
  c.fillStyle = 'rgba(46,70,140,0.18)'; c.beginPath(); c.ellipse(x + cs * 0.06, bot + cs * 0.05, w * 1.15, cs * 0.12, 0, 0, 7); c.fill();
  // корни
  c.fillStyle = '#7a4b2a'; c.strokeStyle = OL; c.lineWidth = l;
  [[-1, 0.9], [1, 0.8], [-0.35, 1]].forEach(function (q) { c.beginPath(); c.moveTo(x + q[0] * w * 0.7, bot - cs * 0.06); c.quadraticCurveTo(x + q[0] * w * 1.15, bot, x + q[0] * w * 1.25 * q[1], bot + cs * 0.05); c.lineTo(x + q[0] * w * 0.85, bot + cs * 0.02); c.closePath(); c.fill(); c.stroke(); });
  // бок
  c.beginPath(); c.moveTo(x - w, top); c.lineTo(x - w, bot); c.ellipse(x, bot, w, cs * 0.11, 0, Math.PI, 0, true); c.lineTo(x + w, top); c.closePath();
  var g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, '#6e4224'); g.addColorStop(0.45, '#9a6438'); g.addColorStop(1, '#5e3820');
  c.fillStyle = g; c.fill(); c.stroke();
  c.strokeStyle = 'rgba(40,20,10,0.35)'; c.lineWidth = l * 0.7; for (var i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x + i * w * 0.5, top + cs * 0.08); c.lineTo(x + i * w * 0.55, bot + cs * 0.04); c.stroke(); }
  // спил с кольцами и шапкой снега по краю
  c.beginPath(); c.ellipse(x, top, w, cs * 0.13, 0, 0, 7); c.fillStyle = '#e9c48f'; c.fill(); c.strokeStyle = OL; c.lineWidth = l; c.stroke();
  c.strokeStyle = 'rgba(150,100,55,0.75)'; c.lineWidth = l * 0.6; c.beginPath(); c.ellipse(x, top, w * 0.66, cs * 0.085, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(x, top, w * 0.33, cs * 0.045, 0, 0, 7); c.stroke();
  c.fillStyle = '#f4f8ff'; c.beginPath(); c.ellipse(x - w * 0.45, top - cs * 0.02, w * 0.5, cs * 0.06, -0.15, 0, 7); c.fill();
  // фонарь на столбике у края спила — как у большого пня (вышка встаёт рядом и его не закрывает)
  var lx = x + w * 0.78, ly = top - cs * 0.02, ph = cs * 0.5;
  var gl = c.createRadialGradient(lx, ly - ph, 0, lx, ly - ph, cs * 0.3); gl.addColorStop(0, 'rgba(255,214,110,.55)'); gl.addColorStop(1, 'rgba(255,214,110,0)');
  c.fillStyle = gl; c.beginPath(); c.arc(lx, ly - ph, cs * 0.3, 0, 7); c.fill();
  c.strokeStyle = OL; c.lineWidth = l * 1.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx, ly - ph + cs * 0.06); c.stroke();
  c.beginPath(); c.rect(lx - cs * 0.07, ly - ph - cs * 0.09, cs * 0.14, cs * 0.16); c.fillStyle = '#ffd36a'; c.fill(); c.lineWidth = l; c.stroke();
  c.fillStyle = '#26304f'; c.fillRect(lx - cs * 0.085, ly - ph - cs * 0.11, cs * 0.17, cs * 0.035);
  c.restore();
};
function stumpify(G) {
  if (!G || G.endless || !Z.mapOf) return;
  var L = G.L, mp = Z.mapOf(G.idx); if (!mp || (mp.lm !== 'stump' && mp.lm !== 'stumps')) return;
  L.stumps = L.stumps || {};
  if (mp.lm === 'stumps') for (var r = 0; r < L.H; r++) for (var c = 0; c < L.W; c++) if (L.grid[r][c] === 3) L.stumps[r * L.W + c] = 1;
  var lm = L.landmark;
  if (lm) {
    // большой пень 2×2 → одна клетка-пенёк (верхняя левая), остальные три — снег под постройку
    for (var q = 0; q < 2; q++) for (var p = 0; p < 2; p++) if (L.grid[lm.r + q] && L.grid[lm.r + q][lm.c + p] === 11) L.grid[lm.r + q][lm.c + p] = 0;
    var sc = lm.c, sr = lm.r; L.grid[sr][sc] = 3; L.stumps[sr * L.W + sc] = 1;   // верхняя клетка — не прячется за стеной города
    delete L.landmark;
  }
  G.fieldDirty = true; UI0().fieldCache = null; if (Z.navDirty) Z.navDirty();
}
function UI0() { return Z.ui || {}; }
var W = Z.WAT; if (W && W.init) { var oi = W.init; W.init = function (G) { var r = oi.apply(this, arguments); try { stumpify(G); } catch (e) { if (window.__rep) window.__rep(e); } return r; }; }

})();

/* 2.11.4 · ВКонтакте: окно «Друзья» на карте (только VK). По правилам VK (п. 2.6): бонус дают только за вступление
   в официальное сообщество (+10 ❄, один раз) и за историю с прогрессом (+5 ❄, раз в день); приглашение друзей,
   пост на стене и избранное — без бонусов. Ничего не навязывается при запуске, отказ ничего не ограничивает. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, GROUP = 243274357, APP = 'https://vk.com/app54896398';
function vk() { return Z.PLAT === 'vk' && window.vkBridge; }
Z._vk = vk;
function TT(a, b) { return Z.LANG === 'en' ? b : a; }
function qp(k) { var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search); return m ? decodeURIComponent(m[1]) : ''; }
function storyOk() { return /^mobile_(android|iphone|ipad)/.test(qp('vk_platform')); }
function meta() { Z.save.meta = Z.save.meta || {}; return Z.save.meta; }
function send(m, p) { try { return window.vkBridge.send(m, p || {}); } catch (e) { return Promise.reject(e); } }
function give(n, why) { Z.save.flakes = (Z.save.flakes || 0) + n; Z.AU.sfx('reward'); Z.persist(true); UI.toast('+' + n + ' ' + TT('снежинок', 'snowflakes') + ' — ' + why, '#9fdcff'); }
Z._heads = function (x, y, r) { heads(x, y, r); };
function heads(x, y, r) { var c = D.ctx; [[-0.42, 0.1, '#ffd54a'], [0.42, 0.1, '#9fd2ff'], [0, -0.05, '#fff']].forEach(function (q) { c.fillStyle = q[2]; c.strokeStyle = '#1b2448'; c.lineWidth = Math.max(1.5, r * 0.14);
  c.beginPath(); c.arc(x + q[0] * r, y + q[1] * r - r * 0.35, r * 0.32, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.ellipse(x + q[0] * r, y + q[1] * r + r * 0.42, r * 0.48, r * 0.36, 0, Math.PI, 0); c.closePath(); c.fill(); c.stroke(); }); }
function icon(k, x, y, r) {
  var c = D.ctx, OL = '#1b2448', l = Math.max(1.5, r * 0.14); c.save(); c.lineWidth = l; c.strokeStyle = OL; c.lineJoin = 'round';
  if (k === 'grp') heads(x, y + r * 0.1, r);
  else if (k === 'cam') { D.rr(x - r, y - r * 0.6, r * 2, r * 1.4, r * 0.3); c.fillStyle = '#ff8fb1'; c.fill(); c.stroke(); c.beginPath(); c.arc(x, y + r * 0.1, r * 0.45, 0, 7); c.fillStyle = '#fff'; c.fill(); c.stroke(); }
  else if (k === 'mail') { D.rr(x - r, y - r * 0.65, r * 2, r * 1.3, r * 0.15); c.fillStyle = '#fff'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(x - r, y - r * 0.6); c.lineTo(x, y + r * 0.1); c.lineTo(x + r, y - r * 0.6); c.stroke(); }
  else if (k === 'wall') { D.rr(x - r * 0.8, y - r, r * 1.6, r * 2, r * 0.2); c.fillStyle = '#fff'; c.fill(); c.stroke(); for (var i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - r * 0.45, y - r * 0.45 + i * r * 0.45); c.lineTo(x + r * 0.45, y - r * 0.45 + i * r * 0.45); c.stroke(); } }
  else D.star(x, y, r, '#ffd54a', l);
  c.restore();
}
// кнопка на карте — справа над «Магазином» (место рейтинга, которого на VK нет)
var oExtra = UI.mapExtra;
UI.mapExtra = function (s, bh2, by2) {
  var r = oExtra ? oExtra.apply(this, arguments) : undefined;
  if (!vk() || !Z.unlockedLevel || Z.unlockedLevel() < 1) return r;
  var a = UI.api(), W = a.W, bs = 56 * s, bh = 60 * s, y = by2 - 140 * s, dot = !meta().joined;
  a.button('mfriends', W - bs - 10 * s, y, bs, bh, { r: 14 * s, c1: '#4cc77d', c2: '#2c9a5a', fn: function () { UI.openModal({ type: 'social' }); }, draw: function (bx, by, bw, bhh) {
    heads(bx + bw / 2, by + bhh * 0.44, 12 * s); D.text(TT('Друзья', 'Friends'), bx + bw / 2, by + bhh - 9 * s, Math.max(10, D.fitText(TT('Друзья', 'Friends'), bw - 6 * s, 11 * s)), '#fff', 'center', 'middle', 2 * s);
    if (dot) { var c = D.ctx; c.fillStyle = '#ff5a5f'; c.beginPath(); c.arc(bx + bw - 6 * s, by + 6 * s, 7 * s, 0, 7); c.fill(); c.lineWidth = 2 * s; c.strokeStyle = '#1b2448'; c.stroke(); D.text('!', bx + bw - 6 * s, by + 6.5 * s, 10 * s, '#fff'); } } });
  return r;
};
// окно
var oCustom = UI.customModal;
UI.customModal = function (m, w) {
  if (m.type !== 'social') return oCustom ? oCustom(m, w) : false;
  var a = UI.api(), S = a.S, M = meta(), today = Z.todayStr(), rows = [];
  rows.push({ ic: 'grp', t: TT('Вступить в сообщество игры', 'Join the game community'), d: TT('Новости, подсказки и поддержка', 'News, tips and support'),
    b: M.joined ? TT('Вы в нём ✓', 'Joined ✓') : '+10', fl: !M.joined, on: !M.joined, fn: function () { send('VKWebAppJoinGroup', { group_id: GROUP }).then(function (d) { if (d && d.result && !M.joined) { M.joined = 1; give(10, TT('спасибо, что с нами!', 'thanks for joining!')); } }).catch(function () { }); } });
  if (storyOk()) rows.push({ ic: 'cam', t: TT('Рассказать в истории', 'Share to your story'), d: TT('Раз в день — бонус', 'Bonus once a day'),
    b: M.storyDay === today ? TT('Завтра ещё', 'Tomorrow') : '+5', fl: M.storyDay !== today, on: M.storyDay !== today, fn: function () {
      var url = location.origin + location.pathname.replace(/[^\/]*$/, '') + 'story.jpg';
      send('VKWebAppShowStoryBox', { background_type: 'image', url: url, attachment: { text: 'go_to', type: 'url', url: APP } }).then(function (d) { if (d && d.result && M.storyDay !== Z.todayStr()) { M.storyDay = Z.todayStr(); give(5, TT('история опубликована', 'story posted')); } }).catch(function () { }); } });
  rows.push({ ic: 'mail', t: TT('Позвать друзей', 'Invite friends'), d: TT('Защищать ёлку веселее вместе', 'Defending the tree is more fun together'), b: TT('Позвать', 'Invite'), on: true,
    fn: function () { send('VKWebAppShowInviteBox').catch(function () { }); } });
  rows.push({ ic: 'wall', t: TT('Рассказать на стене', 'Post on your wall'), d: TT('Пост со ссылкой на игру', 'A post with a link to the game'), b: TT('Написать', 'Post'), on: true,
    fn: function () { var st = 0; for (var k in Z.save.stars) st += +Z.save.stars[k] || 0;
      send('VKWebAppShowWallPostBox', { message: TT('Защищаю ёлку от енотов и Кощея! У меня уже ★' + st + '. Присоединяйся: ', 'Saving the New Year tree from raccoons and Koschei! I have ★' + st + ' already. Join me: ') + APP, attachments: APP }).catch(function () { }); } });
  rows.push({ ic: 'star', t: TT('Добавить игру в избранное', 'Add the game to favorites'), d: TT('Чтобы быстро вернуться', 'To come back quickly'), b: M.fav ? TT('Добавлено ✓', 'Added ✓') : TT('Добавить', 'Add'), on: !M.fav,
    fn: function () { send('VKWebAppAddToFavorites').then(function (d) { if (d && d.result) { M.fav = 1; Z.persist(true); } }).catch(function () { }); } });
  var rh = 58 * S, f = a.frame(w, 56 * S + rows.length * (rh + 6 * S) + 34 * S, TT('Друзья и сообщество', 'Friends & community')), ctx = a.ctx;
  rows.forEach(function (q, i) {
    var y = f.y + 46 * S + i * (rh + 6 * S), bw = 104 * S, tw = f.w - 44 * S - bw - 46 * S;
    D.rr(f.x + 14 * S, y, f.w - 28 * S, rh, 12 * S); ctx.fillStyle = '#efe6d4'; ctx.fill();
    icon(q.ic, f.x + 36 * S, y + rh / 2, 13 * S);
    D.text(q.t, f.x + 56 * S, y + rh * 0.36, Math.max(10.5, D.fitText(q.t, tw, 15 * S)), '#1b2448', 'left');
    D.text(q.d, f.x + 56 * S, y + rh * 0.7, Math.max(9.5, D.fitText(q.d, tw, 11.5 * S)), '#5a6385', 'left');
    a.button('so' + i, f.x + f.w - 22 * S - bw, y + 8 * S, bw, rh - 14 * S, { modal: true, enabled: q.on, r: 10 * S, c1: q.on ? '#3fb6e6' : '#b9c2d6', c2: q.on ? '#2a8bbd' : '#8d97ad', fn: q.fn,
      draw: function (bx, by, bww, bhh) { if (q.fl) { D.flakeIcon(bx + bww / 2 - 16 * S, by + bhh / 2, 9 * S); D.text(q.b, bx + bww / 2 - 4 * S, by + bhh / 2, 16 * S, '#fff', 'left', 'middle', 2.5 * S); } else D.text(q.b, bx + bww / 2, by + bhh / 2, D.fitText(q.b, bww - 12 * S, 15 * S), '#fff', 'center', 'middle', 2.5 * S); } });
  });
  var nt = TT('Бонусы — только за сообщество и историю. Отказ ничего не ограничивает.', 'Bonuses only for the community and stories. Saying no limits nothing.');
  D.text(nt, f.x + f.w / 2, f.y + f.h - 16 * S, Math.max(9.5, D.fitText(nt, f.w - 30 * S, 11 * S)), '#7a83a3');
  a.closeX(f);
  return true;
};
})();

/* 2.11.5 · продажа «Стартового набора»: красивое окно с витриной (золотой Дед Мороз, золотые игрушки, гирлянда, снежинки),
   золотая кнопка «Набор» на карте, в магазине набор открывает это окно; значок на «Наряди ёлку», пока не заглядывали в облики. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui;
function TT(a, b) { return Z.LANG === 'en' ? b : a; }
Z._canSell = function () { return canSell(); };
function canSell() { return Z.platHas && Z.platHas('pay') && Z.save && Z.save.shop && !Z.save.shop.starter && !!Z.SDK27; }   // 2.12.14б: кнопки видны сразу, даже пока оплата ВК ещё готовится (кнопка «Купить» в витрине ждёт её)
Z.goldMoroz = goldMoroz;
function goldMoroz(x, y, h) {
  var sk = Z.save.skins, sv = sk.on.moroz, so = sk.own['moroz:gold']; sk.on.moroz = 'gold'; sk.own['moroz:gold'] = 1;
  try { D.ally('moroz', x, y, h, { dir: 1, walk: true }); } finally { sk.on.moroz = sv; if (!so) delete sk.own['moroz:gold']; }
}
function rays(c, x, y, r, t) { c.save(); c.translate(x, y); c.rotate(t * 0.25); for (var i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(r, -r * 0.13); c.lineTo(r, r * 0.13); c.closePath(); c.fillStyle = 'rgba(255,213,74,' + (i % 2 ? 0.10 : 0.18) + ')'; c.fill(); } c.restore(); }
function garland(c, x0, x1, y, t, s) {
  c.strokeStyle = '#1b2448'; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo((x0 + x1) / 2, y + 14 * s, x1, y); c.stroke();
  var cols = ['#ff5a5f', '#ffd54a', '#4cc77d', '#3fb6e6', '#b47cff'];
  for (var i = 0; i <= 10; i++) { var k = i / 10, bx = x0 + (x1 - x0) * k, by = y + 14 * s * 4 * k * (1 - k) * 0.5 + 3 * s, on = (Math.floor(t * 6) + i) % 5;
    c.globalAlpha = 0.35; c.fillStyle = cols[on]; c.beginPath(); c.arc(bx, by, 7 * s, 0, 7); c.fill(); c.globalAlpha = 1; c.beginPath(); c.arc(bx, by, 3.6 * s, 0, 7); c.fill(); c.lineWidth = 1.2 * s; c.stroke(); }
}
var oCustom = UI.customModal;
UI.customModal = function (m, w) {
  if (m.type !== 'offer') return oCustom ? oCustom(m, w) : false;
  var a = UI.api(), S = a.S, c = a.ctx, t = Z.time, own = !!(Z.save.shop && Z.save.shop.starter);
  var fw = Math.min(a.W * 0.94, 470 * S), f = a.frame(fw, 488 * S, TT('Стартовый набор', 'Starter pack')), cx = f.x + fw / 2;
  // витрина
  var vx = f.x + 16 * S, vy = f.y + 34 * S, vw = fw - 32 * S, vh = 176 * S;
  c.save(); D.rr(vx, vy, vw, vh, 16 * S); c.clip();
  var g = c.createLinearGradient(0, vy, 0, vy + vh); g.addColorStop(0, '#2a3f8f'); g.addColorStop(1, '#16224a'); c.fillStyle = g; c.fillRect(vx, vy, vw, vh);
  rays(c, vx + vw * 0.3, vy + vh * 0.55, vh * 1.1, t);
  for (var i = 0; i < 26; i++) { var sx = vx + ((i * 97) % 100) / 100 * vw, sy = vy + (((i * 53 + t * 18 * (1 + i % 3)) % 100) / 100) * vh; c.globalAlpha = 0.6; c.fillStyle = '#fff'; c.beginPath(); c.arc(sx, sy, (1 + i % 3) * S, 0, 7); c.fill(); }
  c.globalAlpha = 1; c.fillStyle = '#eef4ff'; c.fillRect(vx, vy + vh * 0.86, vw, vh);
  goldMoroz(vx + vw * 0.3, vy + vh * 0.9, vh * 0.34);
  try {   // 2.11.5: «Царская» вышка — тоже в наборе
    var sk = Z.save.skins; sk.tw = sk.tw || {}; sk.twT = sk.twT || {}; var o1 = sk.tw['mg:royal'], o2 = sk.twT.mg; sk.tw['mg:royal'] = 1; sk.twT.mg = 'royal';
    D.tower({ type: 'mg', lvl: 1, ang: -0.5 + Math.sin(t) * 0.2, recoil: 0, spin: t * 3, pop: 0, stun: 0 }, vx + vw * 0.1, vy + vh * 0.9, vh * 0.42, t);
    if (!o1) delete sk.tw['mg:royal']; if (o2) sk.twT.mg = o2; else delete sk.twT.mg;
  } catch (e) { if (window.__rep) window.__rep(e); }
  var tx = vx + vw * 0.68;
  Z.drawToy('gold_nut', tx - 46 * S, vy + 48 * S + Math.sin(t * 2) * 3 * S, 17 * S, t);
  Z.drawToy('gold_fish', tx, vy + 40 * S + Math.sin(t * 2 + 1) * 3 * S, 19 * S, t);
  Z.drawToy('gold_egg', tx + 46 * S, vy + 48 * S + Math.sin(t * 2 + 2) * 3 * S, 17 * S, t);
  garland(c, tx - 72 * S, tx + 72 * S, vy + 92 * S, t, S);
  D.flakeIcon(tx - 26 * S, vy + 132 * S, 13 * S); D.text('+60', tx - 8 * S, vy + 133 * S, 24 * S, '#fff', 'left', 'middle', 4 * S);
  c.restore();
  // лента «лучшее для старта»
  var rl = TT('Лучшее для старта', 'Best to start with'), rw = Math.min(vw * 0.6, D.mw(rl, 13 * S) + 28 * S);
  D.rr(cx - rw / 2, vy - 10 * S, rw, 24 * S, 12 * S); c.fillStyle = '#ff5a5f'; c.fill(); c.lineWidth = 2 * S; c.strokeStyle = '#1b2448'; c.stroke();
  D.text(rl, cx, vy + 2 * S, 13 * S, '#fff', 'center', 'middle', 2.5 * S);
  // что внутри
  var rows = [TT('Золотой Дед Мороз — облик героя', 'Golden Grandfather Frost — hero look'), TT('«Царские» вышки, ловушки и баррикады', 'Royal towers, traps and barricades'), TT('Царский терем — облик крепости', 'Royal fortress look'), TT('Золотая ёлка, мишура и гирлянда', 'Golden tree, tinsel and lights'), TT('3 золотые игрушки и «Бегущая радуга»', '3 golden toys and Running Rainbow'), TT('«Казна» и по 3 запаса каждого вида', 'Treasury boost, 3 of every supply'), TT('60 снежинок на исследования и облики', '60 snowflakes for research and looks')];
  rows.forEach(function (s0, i) { var ry = f.y + 228 * S + i * 23 * S; D.star(f.x + 34 * S, ry, 6.5 * S, '#ffd54a', 1.5); D.text(s0, f.x + 48 * S, ry + 1 * S, D.fitText(s0, fw - 62 * S, 14 * S), '#1b2448', 'left'); });
  var by = f.y + f.h - 68 * S;
  if (own) a.bigBtn('ofOk', f, by, TT('Уже у вас ✓', 'Already yours ✓'), function () { UI.closeModal(); }, '#4cc77d', '#2c9a5a');
  else {
    var pr = Z.SDK27.priceOf('starter');
    a.button('ofBuy', f.x + 22 * S, by, fw - 44 * S, 56 * S, { modal: true, pulse: true, c1: '#ffd54a', c2: '#d79a1c', fn: function () { Z.SDK27.buy('starter', function (ok) { if (ok) UI.closeModal(); }); },
      draw: function (bx, by2, bw, bh) { var l = TT('Забрать за ', 'Get it for ') + pr; D.text(l, bx + bw / 2, by2 + bh / 2, D.fitText(l, bw - 24 * S, 20 * S), '#fff', 'center', 'middle', 3.5 * S); } });
  }
  a.closeX(f);
  return true;
};
// 2.12.13: золотая кнопка «Стартовый набор» в главном меню — с Золотым Дедом Морозом, бегущим бликом и ценой
Z.menuStarterBtn = function (x, y, w, h, s, t) {
  var a = UI.api(), c = a.ctx, pr = Z.SDK27 && Z.SDK27.priceOf ? Z.SDK27.priceOf('starter') : '';
  a.button('mmStarterBig', x, y, w, h, { c1: '#ffd54a', c2: '#d79a1c', pulse: true, fn: function () { Z.openOffer(); }, draw: function (bx, by, bw, bh) {
    c.save(); D.rr(bx + 2, by + 2, bw - 4, bh - 6 * s, 12 * s); c.clip();
    var sx = bx + ((t * 0.3) % 1.7 - 0.35) * bw; c.globalAlpha = 0.4; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(sx, by); c.lineTo(sx + 26 * s, by); c.lineTo(sx - 6 * s, by + bh); c.lineTo(sx - 32 * s, by + bh); c.closePath(); c.fill(); c.globalAlpha = 1;
    c.restore();
    moroHead(bx + bh * 0.62, by + bh * 0.46, bh * 0.36);   // 2.12.13б: лицо Золотого Деда Мороза крупно на синем круге — видно с первого взгляда
    var pw = pr ? Math.max(56 * s, D.mw(pr, 15 * s) + 20 * s) : 0, tx = bx + bh * 1.2, tw = bw - bh * 1.2 - pw - 16 * s, l1 = TT('Стартовый набор', 'Starter pack'), l2 = TT('Всё золотое и «Царское»', 'All golden & Royal looks');
    D.text(l1, tx, by + bh * 0.36, Math.max(13, D.fitText(l1, tw, 19 * s)), '#fff', 'left', 'middle', 3.5 * s);
    D.text(l2, tx, by + bh * 0.7, Math.max(11, D.fitText(l2, tw, 12.5 * s)), '#7a4d00', 'left', 'middle');
    if (pr) { var px0 = bx + bw - pw - 10 * s; D.rr(px0, by + bh / 2 - 15 * s, pw, 28 * s, 14 * s); c.fillStyle = '#ff8a3d'; c.fill(); c.lineWidth = 2 * s; c.strokeStyle = '#1b2448'; c.stroke(); D.text(pr, px0 + pw / 2, by + bh / 2 - 1 * s, Math.max(11, D.fitText(pr, pw - 10 * s, 15 * s)), '#fff', 'center', 'middle', 2.5 * s); }
  } });
};
// 2.12.13б: на карте справа — «Набор» (Золотой Дед Мороз) и «Без рекламы», пока их не купили
function canNoAds() { return Z.platHas && Z.platHas('pay') && Z.save && Z.save.shop && !Z.save.shop.noads; }
Z._canNoAds = canNoAds;
function noAdIcon(x, y, r) { var c = D.ctx; D.adIcon(x, y, r); c.strokeStyle = '#ff5a5f'; c.lineCap = 'round'; c.lineWidth = Math.max(2, r * 0.28); c.beginPath(); c.moveTo(x - r * 1.05, y + r * 0.95); c.lineTo(x + r * 1.05, y - r * 0.95); c.stroke(); c.lineCap = 'butt'; }
Z.noAdIcon = noAdIcon;
function moroHead(x, y, r) { var c = D.ctx; c.save(); c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = '#2a3f8f'; c.fill(); c.clip(); c.translate(x, y); c.scale(r / 60, r / 60); goldMoroz(-8, 120, 62); c.restore();   // рисуем в масштабе 60 и уменьшаем — пропорции одинаковые при любом размере
  c.beginPath(); c.arc(x, y, r, 0, 7); c.lineWidth = Math.max(1.5, r * 0.14); c.strokeStyle = '#1b2448'; c.stroke(); }
Z.moroHead = moroHead;
var oExtra = UI.mapExtra;
UI.mapExtra = function (s, bh2, by2) {
  var r = oExtra ? oExtra.apply(this, arguments) : undefined;
  if (!Z.unlockedLevel || Z.unlockedLevel() < 1) return r;
  var a = UI.api(), bs = 56 * s, bh = 60 * s, y = by2 - 210 * s, x = a.W - bs - 10 * s;
  // 2.12.24: телефон лёжа — столбик справа не помещается по высоте, и «Без рекламы» залезал под верхние кнопки.
  // Тогда «Набор» и «Без рекламы» встают вторым столбиком левее, снизу вверх
  var topLim = 70 * s, n = (canSell() ? 1 : 0) + (canNoAds() ? 1 : 0), nxt = function () { y -= bh + 8 * s; if (y < topLim) { x -= bs + 10 * s; y = by2 - 70 * s; } };
  if (y - (n - 1) * (bh + 8 * s) < topLim) { x -= bs + 10 * s; y = by2 - 70 * s; }
  if (canSell()) { a.button('mstarter', x, y, bs, bh, { r: 14 * s, c1: '#ffd54a', c2: '#d79a1c', pulse: true, fn: function () { Z.openOffer(); }, draw: function (bx, by, bw, bhh) {
    moroHead(bx + bw / 2, by + bhh * 0.4, 15 * s); D.text(TT('Набор', 'Pack'), bx + bw / 2, by + bhh - 9 * s, Math.max(10, D.fitText(TT('Набор', 'Pack'), bw - 6 * s, 11 * s)), '#fff', 'center', 'middle', 2 * s); } }); nxt(); }
  if (canNoAds()) a.button('mnoads', x, y, bs, bh, { r: 14 * s, c1: '#ff8fb1', c2: '#d45a80', fn: function () { Z.openNoAds(); }, draw: function (bx, by, bw, bhh) {
    // 2.12.25: «Без рекламы» не влезало в ширину кнопки — теперь в две строки, как надпись под значком
    if (Z.lang === 'en') { noAdIcon(bx + bw / 2, by + bhh * 0.4, 11 * s); D.text('No ads', bx + bw / 2, by + bhh - 9 * s, Math.min(11 * s, D.fitText('No ads', bw - 10 * s, 11 * s)), '#fff', 'center', 'middle', 2 * s); }
    else { noAdIcon(bx + bw / 2, by + bhh * 0.32, 9.5 * s); var fs = Math.min(10.5 * s, D.fitText('рекламы', bw - 10 * s, 10.5 * s)); D.text('Без', bx + bw / 2, by + bhh - 19 * s, fs, '#fff', 'center', 'middle', 2 * s); D.text('рекламы', bx + bw / 2, by + bhh - 8.5 * s, fs, '#fff', 'center', 'middle', 2 * s); } } });
  return r;
};
// 2.12.13б: окно «Без рекламы» — что даёт и цена
var oCustom2 = UI.customModal;
UI.customModal = function (m, w) {
  if (m.type !== 'noads') return oCustom2 ? oCustom2(m, w) : false;
  var a = UI.api(), S = a.S, c = a.ctx, t = Z.time, own = !!(Z.save.shop && Z.save.shop.noads);
  var fw = Math.min(a.W * 0.94, 440 * S), f = a.frame(fw, 360 * S, TT('Без рекламы', 'No ads')), cx = f.x + fw / 2;
  var vx = f.x + 16 * S, vy = f.y + 34 * S, vw = fw - 32 * S, vh = 120 * S;
  c.save(); D.rr(vx, vy, vw, vh, 16 * S); c.clip();
  var g = c.createLinearGradient(0, vy, 0, vy + vh); g.addColorStop(0, '#ffd1e0'); g.addColorStop(1, '#ff9fbf'); c.fillStyle = g; c.fillRect(vx, vy, vw, vh);
  rays(c, cx, vy + vh * 0.5, vh * 1.2, t);
  c.restore();
  noAdIcon(cx, vy + vh * 0.48, 30 * S);
  var rows = [TT('Нет рекламы между уровнями', 'No ads between levels'), TT('Нет баннера внизу экрана', 'No banner at the bottom'), TT('Снежинки за рекламу — только если сам захочешь', 'Snowflakes for ads — only when you want'), TT('Навсегда', 'Forever')];
  rows.forEach(function (s0, i) { var ry = f.y + 178 * S + i * 24 * S; D.star(f.x + 34 * S, ry, 6.5 * S, '#ffd54a', 1.5); D.text(s0, f.x + 48 * S, ry + 1 * S, D.fitText(s0, fw - 62 * S, 14 * S), '#1b2448', 'left'); });
  var by = f.y + f.h - 68 * S;
  if (own) a.bigBtn('naOk', f, by, TT('Реклама уже отключена ✓', 'Ads are already off ✓'), function () { UI.closeModal(); }, '#4cc77d', '#2c9a5a');
  else {
    var pr = Z.SDK27.priceOf('noads'), ready = Z.SDK27.payReady && Z.SDK27.payReady();
    a.button('naBuy', f.x + 22 * S, by, fw - 44 * S, 56 * S, { modal: true, enabled: ready, pulse: true, c1: '#ff8fb1', c2: '#d45a80', fn: function () { Z.SDK27.buy('noads', function (ok) { if (ok) UI.closeModal(); }); },
      draw: function (bx, by2, bw, bh) { var l = TT('Отключить за ', 'Remove for ') + pr; D.text(l, bx + bw / 2, by2 + bh / 2, D.fitText(l, bw - 24 * S, 20 * S), '#fff', 'center', 'middle', 3.5 * S); } });
  }
  a.closeX(f);
  return true;
};
// после отрисовки: в магазине «Стартовый набор» открывает витрину; на «Наряди ёлку» — значок, пока не заглядывали в облики
var oRender = UI.render;
UI.render = function () {
  var r = oRender.apply(this, arguments);
  try {
    var m = UI.modal, bt = UI.btns();
    if (m && m.type === 'shop') bt.forEach(function (b) { if (b.id === 'sh_starter') b.fn = function () { Z.openOffer(); }; });
    if (m && m.type === 'cos') { Z.save.meta.cosSeen = 1; }
    if (!m && UI.screen === 'map' && !Z.save.meta.cosSeen && Z.save.flakes >= 20) bt.forEach(function (b) {
      if (b.id !== 'mcos') return; var c = D.ctx, x = b.x + b.w - 4, y = b.y + 4, rr = 8 * UI.L.s;
      c.fillStyle = '#ff5a5f'; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); c.lineWidth = 2; c.strokeStyle = '#1b2448'; c.stroke(); D.text('!', x, y + 1, rr * 1.4, '#fff');
    });
  } catch (e) { if (window.__rep) window.__rep(e); }
  return r;
};
})();
