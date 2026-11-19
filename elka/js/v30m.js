/* 2.11.5 · Мультики и сцены уровня — по порядку и с пересмотром.
   Раньше, если перед уровнем был мультик, сцена уровня (реплика героя перед боем) не показывалась вовсе — её можно было пропустить.
   Теперь перед уровнем идут все новые мультики, а за ними — сцена. На карте перед каждым уровнем на тропе стоят кружки
   в том же порядке: фиолетовый с плёнкой — мультик, оранжевый с облачком — сцена. Новые (ещё не виденные) пульсируют,
   нажатие — пересмотреть. До закрытых уровней кружки серые и не нажимаются. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui, OL = D.OL || '#1b2448', TT = Z.TT || function (r, e) { return Z.LANG === 'en' ? e : r; };

// ---------- что идёт перед уровнем, по порядку ----------
function storyItems(idx) {
  var o = [];
  if (Z.multsAt) Z.multsAt(idx).forEach(function (k) { if (Z.MULTS[k].at === idx) o.push({ k: 'm', id: k }); });
  if (idx > 0 && Z.COMICS && Z.COMICS['lv_' + idx]) o.push({ k: 's', id: 'lv_' + idx });
  return o;
}
Z.storyItems = storyItems;
function seen(it) { return it.k === 'm' ? !!Z.save.seen['cut_' + it.id] : !!Z.save.seen['comic_' + it.id]; }
function play(it, then) {
  if (it.k === 'm') { Z.forceCut = true; Z.showComic(it.id, then); return; }
  var k = 'comic_' + it.id; Z.save.seen[k] = 0;
  Z.showComic(it.id, function () { Z.save.seen[k] = 1; if (then) then(); });
}
Z.playStoryItem = play;

// перед боем: новые мультики, потом сцена (раньше сцена при мультике пропадала)
Z.showStory = function (idx) {
  var hits = []; for (var k in Z.MULTS) if (Z.MULTS[k].at === idx && k !== 'M11' && !Z.MULTS[k].free && !Z.save.seen['cut_' + k]) hits.push(k);
  hits.sort(function (a, b) { return (Z.MULTS[a].n || 1) - (Z.MULTS[b].n || 1); });
  Z.broBattle = false;
  if (Z.brosIn && Z.brosIn() && !Z.save.seen.cut_M21 && !Z.trialHero) { hits.push('M21'); Z.broBattle = true; }
  var run = function (i) {
    if (i < hits.length) { Z.showComic(hits[i], function () { run(i + 1); }); return; }
    if (idx > 0) Z.showComic('lv_' + idx);
  };
  run(0);
};

// ---------- значки ----------
function iconFilm(x, y, r, on) {
  var c = D.ctx;
  D.rr(x - r * 0.62, y - r * 0.32, r * 1.24, r * 0.82, r * 0.12); c.fillStyle = on ? '#2b2f4a' : '#7a819c'; c.fill();
  c.save(); c.translate(x - r * 0.62, y - r * 0.36); c.rotate(-0.32);
  D.rr(0, -r * 0.26, r * 1.24, r * 0.26, r * 0.06); c.fillStyle = on ? '#2b2f4a' : '#7a819c'; c.fill();
  c.fillStyle = '#fff'; for (var i = 0; i < 3; i++) { c.beginPath(); c.moveTo(r * (0.12 + i * 0.38), 0); c.lineTo(r * (0.3 + i * 0.38), -r * 0.26); c.lineTo(r * (0.44 + i * 0.38), -r * 0.26); c.lineTo(r * (0.26 + i * 0.38), 0); c.closePath(); c.fill(); }
  c.restore();
  D.poly([x - r * 0.16, y - r * 0.12, x + r * 0.26, y + r * 0.09, x - r * 0.16, y + r * 0.3], on ? '#ffd54a' : '#d5d9e4');
}
function iconScene(x, y, r, on) {
  var c = D.ctx;
  c.beginPath(); c.ellipse(x, y - r * 0.08, r * 0.62, r * 0.44, 0, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill();
  c.beginPath(); c.moveTo(x - r * 0.3, y + r * 0.22); c.lineTo(x - r * 0.42, y + r * 0.58); c.lineTo(x - r * 0.04, y + r * 0.3); c.closePath(); c.fill();
  for (var i = 0; i < 3; i++) D.circ(x - r * 0.28 + i * r * 0.28, y - r * 0.08, r * 0.09, on ? '#e0702a' : '#9aa3b8');
}
// n — узел уровня, pv — предыдущий узел уровня (или null), y — экранная y узла, r — радиус узла
Z.mapStoryDots = function (n, pv, y, off, r, isUn, nh) {
  var its = storyItems(n.idx); if (!its.length) return;
  var A = UI.api(), s = A.S || 1, ctx = A.ctx, t = Z.time || 0;
  var px = pv ? pv.x : n.x, py = pv ? pv.y + off : y - 120 * s, dx = px - n.x, dy = py - y, len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  // первый уровень региона: сверху табличка региона — кружки встают сбоку от узла, в сторону середины карты
  if (!pv || n.y - pv.y > 140 * s) { dx = n.x > A.W / 2 + 2 ? -1 : 1; dy = 0; len = 200 * s; pv = null; }
  var rr = 11.5 * s, gap = Math.min(27 * s, Math.max(20 * s, (len - r - (pv ? 26 * s : 0) - 14 * s) / its.length)), d0 = r + 7 * s + rr;
  its.forEach(function (it, k) {
    var dd = d0 + (its.length - 1 - k) * gap, x = n.x + dx * dd, yy = y + dy * dd, on = isUn, nw = on && !seen(it);
    var c1 = !on ? '#b3bacb' : it.k === 'm' ? '#9a7ce8' : '#ffb04a', c2 = !on ? '#8a92a8' : it.k === 'm' ? '#6d4fc0' : '#d9822a';
    A.button('sd' + n.idx + '_' + k, x - rr, yy - rr, rr * 2, rr * 2 + 3 * s, { r: rr, noHit: nh, enabled: on, c1: c1, c2: c2, pulse: nw,
      fn: function () { Z.AU.sfx('select'); play(it); },
      draw: function (bx, by, bw, bh) {
        var cx = bx + bw / 2, cy = by + bh / 2;
        if (it.k === 'm') iconFilm(cx, cy, rr * 0.95, on); else iconScene(cx, cy, rr * 0.95, on);
        if (nw) { D.circ(cx + rr * 0.72, cy - rr * 0.72, rr * 0.3, '#ff4d5e', Math.max(1, s * 1.2)); }
      } });
  });
};
})();
