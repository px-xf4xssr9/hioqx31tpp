/* 2.11.5 · мультики: передний план с параллаксом, ящики-укрытие, новый дуб, постановка «Белки Шишки». */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = D.OL || '#1b2448';
function C() { return D.ctx; }
function H(i, k) { var x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }

// ---------- передний план: ближе камеры, едет быстрее неё ----------
var SNOWY = { night: 1, village: 1, lake: 1, mount: 1, pole: 1, storm: 1, fest: 1, camp: 1, campdone: 1, thicket: 1, airfield: 1, isle: 1, drift: 1, plowyard: 1 };
var WOODS = { night: 1, storm: 1, thicket: 1, camp: 1, campdone: 1 };
Z.cutFG = function (ctx, P, t) {
  var k = P.sc, SW = P.SW, gy = P.gy, B = P.base, z = P.z, F = 1.6, zG = 1 + (z - 1) * F, camG = 0.5 + (P.cx - 0.5) * F;
  if (!SNOWY[k] && k !== 'cellar' && k !== 'bar') return;
  ctx.save(); ctx.translate(SW * P.cx, gy); ctx.scale(zG / z, zG / z); ctx.translate(-SW * camG, -gy);
  var eL = SW * camG - P.W / (2 * zG), eR = SW * camG + P.W / (2 * zG);   // 2.11.5: края кадра в координатах переднего плана
  var bot = gy + (P.sy + P.sh - gy) / zG + 4, top = gy - (gy - P.sy) / zG - 4, l = Math.max(1.5, B * 0.02);
  if (SNOWY[k]) {
    // сугробы у самого края кадра — ниже ног героев
    var base0 = gy + B * 0.16;
    var dL = Math.min(-SW * 0.4, eL - 20), dW = Math.max(SW * 1.4, eR + 20) - dL;   // сугробы — от края до края кадра
    ctx.beginPath(); ctx.moveTo(dL, bot); ctx.lineTo(dL, base0);
    for (var i = 0; i <= 24; i++) { var u = i / 24, xx = dL + u * dW, bump = Math.pow(Math.max(0, Math.sin(u * 23 + 1.3)), 2) * B * 0.12 + Math.pow(Math.max(0, Math.sin(u * 7.1)), 6) * B * 0.18; ctx.lineTo(xx, base0 - bump); }
    ctx.lineTo(dL + dW, bot); ctx.closePath();
    var g = ctx.createLinearGradient(0, base0 - B * 0.3, 0, bot); g.addColorStop(0, '#f4f8ff'); g.addColorStop(1, '#c9d6ee'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    // сухие травинки и веточки из сугробов
    ctx.lineCap = 'round';
    for (var s = 0; s < 9; s++) { var sx = -SW * 0.3 + H(s, 3) * SW * 1.6, sh0 = B * (0.18 + H(s, 5) * 0.22), sw = Math.sin(t * 1.3 + s) * B * 0.02;
      ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = Math.max(1.5, B * 0.018); ctx.beginPath(); ctx.moveTo(sx, base0); ctx.quadraticCurveTo(sx + sw, base0 - sh0 * 0.5, sx + sw * 2 + B * 0.03, base0 - sh0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + sw, base0 - sh0 * 0.5); ctx.lineTo(sx + sw - B * 0.06, base0 - sh0 * 0.75); ctx.stroke(); D.ell(sx + sw * 2 + B * 0.03, base0 - sh0 - B * 0.01, B * 0.03, B * 0.015, '#ffffff'); }
    // в лесу — тёмные еловые лапы, свисающие сверху по краям
    if (WOODS[k]) [[-0.12, 1], [1.12, -1]].forEach(function (q, j) {
      var bx = q[1] > 0 ? Math.min(SW * q[0], eL - B * 0.08) : Math.max(SW * q[0], eR + B * 0.08),   /* 2.11.5: лапа растёт из-за края кадра — на широком экране не висит в воздухе */ d = q[1], sway = Math.sin(t * 0.7 + j) * B * 0.03;
      ctx.fillStyle = '#163a2c'; ctx.strokeStyle = '#0d241b'; ctx.lineWidth = l;
      for (var b = 0; b < 3; b++) { var by = top + B * (0.15 + b * 0.32), len = B * (1.2 - b * 0.25);
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + d * len * 0.5, by + B * 0.05 + sway, bx + d * len, by + B * 0.22 + sway);
        for (var n = 8; n >= 0; n--) { var u2 = n / 8, px = bx + d * len * u2, py = by + B * 0.22 * u2 * u2 + sway * u2; ctx.lineTo(px - d * B * 0.05, py + B * 0.16 * (1 - u2 * 0.4)); ctx.lineTo(px - d * B * 0.09, py + B * 0.04); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(bx + d * len * 0.45, by + B * 0.03 + sway * 0.5, len * 0.32, B * 0.035, d * 0.12, 0, 7); ctx.fill(); ctx.fillStyle = '#163a2c'; }
    });
  } else if (k === 'cellar' || k === 'bar') {
    // балка под потолком и бочка у края — тёмными силуэтами
    var bt = top + B * 0.05; ctx.fillStyle = k === 'cellar' ? '#2a1c14' : '#2c1a22'; ctx.fillRect(-SW * 0.4, bt - B, SW * 1.8, B * 1.18); ctx.strokeStyle = '#140c08'; ctx.lineWidth = l; ctx.strokeRect(-SW * 0.4, bt - B, SW * 1.8, B * 1.18);
    for (var pg = 0; pg < 7; pg++) D.circ(-SW * 0.3 + pg * SW * 0.27, bt + B * 0.08, B * 0.025, '#5a4030');
    if (k === 'cellar') { ctx.strokeStyle = 'rgba(230,230,240,0.45)'; ctx.lineWidth = 1; var wx = -SW * 0.05, wy = bt + B * 0.18; for (var r = 1; r <= 3; r++) { ctx.beginPath(); ctx.arc(wx, wy, B * 0.12 * r, 0, Math.PI / 2); ctx.stroke(); } for (var a = 0; a <= 4; a++) { ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a / 4 * Math.PI / 2) * B * 0.4, wy + Math.sin(a / 4 * Math.PI / 2) * B * 0.4); ctx.stroke(); } }
    else { for (var lp = 0; lp < 6; lp++) { var lx = -SW * 0.2 + lp * SW * 0.3, ly = bt + B * 0.25 + Math.sin(lp) * B * 0.04; ctx.strokeStyle = '#140c08'; ctx.beginPath(); ctx.moveTo(lx, bt + B * 0.1); ctx.lineTo(lx, ly); ctx.stroke(); ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 4 + lp); D.circ(lx, ly + B * 0.04, B * 0.05, ['#ffd54a', '#ff8a5a', '#8ad0ff'][lp % 3]); ctx.globalAlpha = 1; } }
    [[-0.08, 1], [1.08, -1]].forEach(function (q) { var bx = SW * q[0], bw = B * 0.55, bh = B * 0.7; D.rr(bx - bw / 2, bot - bh, bw, bh + 4, bw * 0.25); ctx.fillStyle = '#24160f'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = '#120a06'; ctx.stroke(); ctx.fillStyle = '#3a2a20'; ctx.fillRect(bx - bw / 2, bot - bh * 0.7, bw, B * 0.04); ctx.fillRect(bx - bw / 2, bot - bh * 0.3, bw, B * 0.04); });
  }
  ctx.restore();
  // крупные хлопья у самой камеры (своя скорость, не привязаны к миру)
  if (SNOWY[k] && k !== 'fest') {
    ctx.save(); var W = P.W;
    for (var f = 0; f < 10; f++) { var q2 = (t * (0.05 + H(f, 9) * 0.05) + H(f, 1)) % 1, fx = ((H(f, 2) * 1.4 - 0.2 - (P.cx - 0.5) * 0.6 * (1 + H(f, 4))) % 1.2 + 1.2) % 1.2 * W - W * 0.1 + Math.sin(t * 0.8 + f) * 12, fy = P.sy + q2 * P.sh * 1.1 - P.sh * 0.05, fr = B * (0.025 + H(f, 6) * 0.03);
      ctx.globalAlpha = 0.55 * Math.sin(q2 * Math.PI); D.circ(fx, fy, fr, '#ffffff'); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
};

// ---------- реквизит ----------
var oProp = Z.MDIR.drawProp;
Z.MDIR.drawProp = function (k, x, gy, B, t, p) {
  var ctx = C(), l = Math.max(2, B * 0.02);
  if (k === 'crates') {   // ящики и бочки — за ними прячется белка
    p = p || {}; var wob = 0, who = p.who;
    if (who) { var ph = (t * 0.8) % 2.4; if (ph < 0.5) wob = Math.sin(ph * 40) * (1 - ph * 2) * 0.05; if (ph < 0.05 && !p.rs) { p.rs = 1; try { Z.AU.sfx('a_magpie_flap', 0.35, { gap: 1.5, gapKey: 'rust' }); } catch (e) { if (window.__rep) window.__rep(e); } } if (ph > 0.6) p.rs = 0; }
    if (p.burst > 0) { p.burst += 0.016; wob = Math.sin(p.burst * 30) * Math.max(0, 0.12 - p.burst * 0.2); }
    // хвост и глаза — до ящиков (за ними)
    if (who) { var tw = Math.sin(t * 5) * 0.25; ctx.save(); ctx.translate(x + B * 0.18, gy - B * 0.62); ctx.rotate(tw); D.ell(0, -B * 0.12, B * 0.1, B * 0.2, '#ff8a3d', l); D.ell(-B * 0.02, -B * 0.24, B * 0.06, B * 0.09, '#ffb07a'); ctx.restore(); }
    ctx.save(); ctx.translate(x, gy); ctx.rotate(wob);
    D.rr(-B * 0.42, -B * 0.5, B * 0.5, B * 0.5, B * 0.04); ctx.fillStyle = '#a8784a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-B * 0.42, -B * 0.5); ctx.lineTo(B * 0.08, 0); ctx.moveTo(B * 0.08, -B * 0.5); ctx.lineTo(-B * 0.42, 0); ctx.strokeStyle = 'rgba(60,35,15,0.55)'; ctx.lineWidth = l * 0.8; ctx.stroke();
    D.rr(B * 0.04, -B * 0.62, B * 0.36, B * 0.62, B * 0.12); ctx.fillStyle = '#7f5332'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.fillStyle = '#5a6078'; ctx.fillRect(B * 0.04, -B * 0.5, B * 0.36, B * 0.04); ctx.fillRect(B * 0.04, -B * 0.16, B * 0.36, B * 0.04);
    D.rr(-B * 0.3, -B * 0.78, B * 0.3, B * 0.28, B * 0.03); ctx.fillStyle = '#c7925f'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.restore();
    if (who) { var bl = ((t * 0.7) % 3) < 0.12; if (!bl) { ctx.globalAlpha = 0.9; D.circ(x + B * 0.02, gy - B * 0.56, B * 0.028, '#fff6c0'); D.circ(x + B * 0.08, gy - B * 0.56, B * 0.028, '#fff6c0'); D.circ(x + B * 0.025, gy - B * 0.56, B * 0.012, OL); D.circ(x + B * 0.085, gy - B * 0.56, B * 0.012, OL); ctx.globalAlpha = 1; } }
    return;
  }
  if (k === 'oak') {   // могучий дуб: корни, кора, дупло, ветви, крона в два слоя со снегом; на цепи — сундук
    var tr = B * 0.24;
    ctx.fillStyle = '#5e3f26'; [[-1, 0.5], [1, 0.55], [-0.4, 0.4]].forEach(function (q) { ctx.beginPath(); ctx.moveTo(x + q[0] * tr * 0.6, gy - B * 0.15); ctx.quadraticCurveTo(x + q[0] * tr * 1.3, gy - B * 0.02, x + q[0] * tr * (1.5 + q[1]), gy + B * 0.02); ctx.lineTo(x + q[0] * tr * 0.3, gy + B * 0.02); ctx.closePath(); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(x - tr, gy); ctx.quadraticCurveTo(x - tr * 0.75, gy - B * 0.8, x - tr * 0.85, gy - B * 1.55); ctx.lineTo(x + tr * 0.85, gy - B * 1.55); ctx.quadraticCurveTo(x + tr * 0.75, gy - B * 0.8, x + tr, gy); ctx.closePath();
    var g2 = ctx.createLinearGradient(x - tr, 0, x + tr, 0); g2.addColorStop(0, '#7a5434'); g2.addColorStop(1, '#4e331e'); ctx.fillStyle = g2; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.strokeStyle = 'rgba(30,18,8,0.45)'; ctx.lineWidth = l * 0.6; for (var b2 = 0; b2 < 4; b2++) { ctx.beginPath(); ctx.moveTo(x - tr * 0.5 + b2 * tr * 0.3, gy - B * 0.15); ctx.quadraticCurveTo(x - tr * 0.45 + b2 * tr * 0.32, gy - B * 0.8, x - tr * 0.5 + b2 * tr * 0.3, gy - B * 1.35); ctx.stroke(); }
    D.ell(x - tr * 0.15, gy - B * 0.9, tr * 0.32, tr * 0.45, '#2a180c', l * 0.7);
    // ветви
    [[-1, 1.45, 0.85], [1, 1.4, 0.95]].forEach(function (q) { ctx.strokeStyle = OL; ctx.lineWidth = B * 0.12 + l * 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, gy - B * q[1]); ctx.quadraticCurveTo(x + q[0] * B * q[2] * 0.5, gy - B * (q[1] + 0.05), x + q[0] * B * q[2], gy - B * (q[1] + 0.25)); ctx.stroke(); ctx.strokeStyle = '#5e3f26'; ctx.lineWidth = B * 0.12; ctx.stroke(); });
    // крона: задний тёмный слой, передний светлый, снежные шапки
    var blobs = [[-0.7, 1.75, 0.48], [0.7, 1.72, 0.5], [0, 2.05, 0.58], [-0.38, 2.15, 0.42], [0.4, 2.12, 0.42]];
    blobs.forEach(function (q) { D.circ(x + q[0] * B, gy - B * q[1], B * q[2], '#2f5a32', l); });
    blobs.forEach(function (q) { D.circ(x + q[0] * B - B * 0.06, gy - B * q[1] - B * 0.06, B * q[2] * 0.82, '#4f8a48'); });
    blobs.forEach(function (q, i) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x + q[0] * B - B * 0.05, gy - B * (q[1] + q[2] * 0.62), B * q[2] * 0.62, B * 0.1, 0, Math.PI, 0); ctx.fill(); });
    // цепь и сундук на правой ветви
    var hx = x + B * 0.85, hy = gy - B * 1.6, sw = Math.sin(t * 1.4) * 0.08, ch = B * 0.6;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(sw);
    for (var cl = 0; cl < 8; cl++) { ctx.strokeStyle = '#d4a628'; ctx.lineWidth = Math.max(1.5, B * 0.014); ctx.beginPath(); ctx.ellipse(0, cl * ch / 8 + ch / 16, B * 0.018, ch / 14, cl % 2 ? 0 : Math.PI / 2 * 0, 0, 7); ctx.stroke(); }
    D.rr(-B * 0.24, ch, B * 0.48, B * 0.34, B * 0.05); ctx.fillStyle = '#8a5a35'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-B * 0.24, ch + B * 0.08); ctx.quadraticCurveTo(0, ch - B * 0.06, B * 0.24, ch + B * 0.08); ctx.stroke();
    ctx.fillStyle = '#ffd54a'; ctx.fillRect(-B * 0.24, ch + B * 0.12, B * 0.48, B * 0.045); D.rr(-B * 0.05, ch + B * 0.14, B * 0.1, B * 0.1, B * 0.02); ctx.fill(); ctx.stroke();
    // 2.12.46: табличка на сундуке — о ней говорит Белка («у тебя на сундуке табличка „Тут игла“»)
    ctx.save(); ctx.translate(0, ch + B * 0.44); ctx.rotate(-0.07);
    ctx.strokeStyle = OL; ctx.lineWidth = Math.max(1, l * 0.5); ctx.beginPath(); ctx.moveTo(-B * 0.16, -B * 0.07); ctx.lineTo(-B * 0.1, -B * 0.12); ctx.moveTo(B * 0.16, -B * 0.07); ctx.lineTo(B * 0.1, -B * 0.12); ctx.stroke();
    D.rr(-B * 0.3, -B * 0.075, B * 0.6, B * 0.15, B * 0.02); ctx.fillStyle = '#fff3d6'; ctx.fill(); ctx.lineWidth = Math.max(1.2, l * 0.7); ctx.strokeStyle = OL; ctx.stroke();
    D.text(Z.TT ? Z.TT('ТУТ ИГЛА', 'NEEDLE HERE') : 'ТУТ ИГЛА', 0, B * 0.004, B * 0.09, '#c8283c');
    ctx.restore();
    ctx.restore();
    return;
  }
  return oProp.apply(this, arguments);
};

// ---------- постановка: «Белка Шишка» ----------
// Снегурочка слышит шорох — белки не видно: только ящики ходят ходуном, хвост и глаза в щели. На «Стоять!» белка выпрыгивает.
var DIR = Z.MDIR;
DIR['M16-01'] = { cam: 'wide', do: [['prop', 'crates', 0.86], ['hide', 'BEL']], post: 0.3 };
var d2 = DIR['M16-02'] || {}; DIR['M16-02'] = { cam: d2.cam || 'close', do: [['leap', 'BEL', 0.6, 0.86], ['emote', 'BEL', 'jump']] };

// ---------- 2.11.5: стража у ворот — под облик крепости ----------
// ice — ледяной страж с короной и ледяным копьём; candy — пряничный человечек с леденцовой тростью;
// gold — снеговик-богатырь в золотом шлеме-шишаке с бердышом; night — звездочёт в колпаке со звёздным посохом
D.fortGuard = function (x, y, R, face, t, th) {
  var c = C(), l = Math.max(1.2, R * 0.11), f = face || 1;
  function eyes(hx, hy, col) { D.circ(hx - R * 0.17 + f * R * 0.05, hy - R * 0.06, R * 0.08, col || OL); D.circ(hx + R * 0.21 + f * R * 0.05, hy - R * 0.06, R * 0.08, col || OL); }
  function spear(px, top, shaft, head) { c.strokeStyle = OL; c.lineWidth = l * 2.2; c.beginPath(); c.moveTo(px, y); c.lineTo(px + f * R * 0.15, top); c.stroke(); c.strokeStyle = shaft; c.lineWidth = l * 1.1; c.stroke(); head(px + f * R * 0.15, top); }
  var px = x + f * R * 1.05, top = y - R * 4.6;
  if (th === 'ice') {
    var g = c.createLinearGradient(x - R, 0, x + R, 0); g.addColorStop(0, '#eafaff'); g.addColorStop(1, '#8fd3f5');
    D.circ(x, y - R * 0.8, R, g, l); D.circ(x, y - R * 1.85, R * 0.72, g, l); var hy = y - R * 2.95; D.circ(x, hy, R * 0.55, g, l);
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = l * 0.8; c.beginPath(); c.moveTo(x - R * 0.5, y - R * 1.1); c.lineTo(x - R * 0.2, y - R * 0.6); c.stroke();
    eyes(x, hy, '#1f6aa0');
    D.poly([x - R * 0.45, hy - R * 0.4, x - R * 0.35, hy - R * 0.95, x - R * 0.15, hy - R * 0.55, x, hy - R * 1.1, x + R * 0.15, hy - R * 0.55, x + R * 0.35, hy - R * 0.95, x + R * 0.45, hy - R * 0.4], '#bfefff', l * 0.8);
    spear(px, top, '#9fd8f5', function (sx, sy) { D.poly([sx - R * 0.22, sy + R * 0.25, sx, sy - R * 0.55, sx + R * 0.22, sy + R * 0.25], '#e6faff', l * 0.7); });
  } else if (th === 'candy') {
    var b = '#c98a4e', d = '#a86a34';
    c.save(); c.translate(x, y);
    [[-1, 0.55], [1, 0.55]].forEach(function (q) { D.ell(q[0] * R * 0.42, -R * 0.35, R * 0.28, R * 0.45, b, l); });
    D.ell(0, -R * 1.45, R * 0.75, R * 0.85, b, l); D.circ(0, -R * 2.75, R * 0.6, b, l);
    c.strokeStyle = '#ffffff'; c.lineWidth = l * 1.1; c.lineCap = 'round'; c.beginPath(); for (var z = 0; z < 5; z++) { var zx = -R * 0.5 + z * R * 0.25; c.lineTo(zx, -R * 0.75 + (z % 2) * R * 0.12); } c.stroke();
    [0, 1, 2].forEach(function (q) { D.circ(0, -R * (1.25 + q * 0.3), R * 0.1, ['#ff5a7a', '#5ac8ff', '#9dff6a'][q], l * 0.5); });
    D.circ(-R * 0.2 + f * R * 0.05, -R * 2.82, R * 0.08, OL); D.circ(R * 0.22 + f * R * 0.05, -R * 2.82, R * 0.08, OL);
    c.strokeStyle = OL; c.lineWidth = l * 0.8; c.beginPath(); c.arc(f * R * 0.05, -R * 2.68, R * 0.22, 0.3, Math.PI - 0.3); c.stroke();
    c.strokeStyle = '#ffffff'; c.lineWidth = l * 0.9; c.beginPath(); c.arc(0, -R * 2.75, R * 0.48, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    c.restore();
    // леденцовая трость
    var cx2 = px, ct = top + R * 0.6; c.lineCap = 'round'; c.strokeStyle = OL; c.lineWidth = l * 2.6; c.beginPath(); c.moveTo(cx2, y); c.lineTo(cx2, ct); c.arc(cx2 - f * R * 0.3, ct, R * 0.3, 0, Math.PI, f < 0); c.stroke();
    c.strokeStyle = '#ffffff'; c.lineWidth = l * 1.5; c.stroke(); c.setLineDash([R * 0.25, R * 0.25]); c.strokeStyle = '#e8484f'; c.stroke(); c.setLineDash([]);
  } else if (th === 'gold') {
    D.snowman(x, y, R, { face: f, scarf: '#c0323f' });
    var hy2 = y - R * 2.95;
    c.beginPath(); c.moveTo(x - R * 0.62, hy2 - R * 0.2); c.quadraticCurveTo(x - R * 0.6, hy2 - R * 0.95, x, hy2 - R * 1.35); c.quadraticCurveTo(x + R * 0.6, hy2 - R * 0.95, x + R * 0.62, hy2 - R * 0.2); c.closePath();
    var gg = c.createLinearGradient(x - R * 0.6, 0, x + R * 0.6, 0); gg.addColorStop(0, '#ffe58a'); gg.addColorStop(1, '#c99520'); c.fillStyle = gg; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
    c.strokeStyle = OL; c.lineWidth = l * 0.8; c.beginPath(); c.moveTo(x, hy2 - R * 1.35); c.lineTo(x, hy2 - R * 1.7); c.stroke(); D.circ(x, hy2 - R * 1.72, R * 0.1, '#e8484f', l * 0.5);
    D.rr(x - R * 0.65, hy2 - R * 0.28, R * 1.3, R * 0.16, R * 0.05); c.fillStyle = '#c99520'; c.fill(); c.stroke();
    spear(px, top, '#8a5a35', function (sx, sy) { c.beginPath(); c.moveTo(sx, sy - R * 0.4); c.quadraticCurveTo(sx - f * R * 0.65, sy + R * 0.1, sx, sy + R * 0.75); c.closePath(); c.fillStyle = '#e0e6f2'; c.fill(); c.lineWidth = l * 0.7; c.strokeStyle = OL; c.stroke(); });
  } else if (th === 'night') {
    var ng = c.createLinearGradient(x - R, 0, x + R, 0); ng.addColorStop(0, '#dfe6ff'); ng.addColorStop(1, '#9fa8e0');
    D.circ(x, y - R * 0.8, R, ng, l); D.circ(x, y - R * 1.85, R * 0.72, ng, l); var hy3 = y - R * 2.95; D.circ(x, hy3, R * 0.55, ng, l);
    D.rr(x - R * 0.62, y - R * 2.62, R * 1.24, R * 0.28, R * 0.12); c.fillStyle = '#3d2f8f'; c.fill(); c.lineWidth = l; c.strokeStyle = OL; c.stroke();
    eyes(x, hy3); D.poly([x, hy3 + R * 0.02, x + f * R * 0.55, hy3 + R * 0.1, x, hy3 + R * 0.16], '#ffb347', l * 0.8);
    D.poly([x - R * 0.62, hy3 - R * 0.3, x + f * R * 0.3, hy3 - R * 1.9, x + R * 0.62, hy3 - R * 0.3], '#3d2f8f', l);
    [[-0.15, -0.8], [0.15, -1.2], [0.05, -0.55]].forEach(function (q, i) { c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + i); D.star(x + q[0] * R, hy3 + q[1] * R, R * 0.09, '#ffe066', 0); c.globalAlpha = 1; });
    spear(px, top + R * 0.4, '#6a5aa0', function (sx, sy) { c.globalAlpha = 0.35 + 0.2 * Math.sin(t * 4); D.circ(sx, sy - R * 0.1, R * 0.45, '#ffe066'); c.globalAlpha = 1; D.star(sx, sy - R * 0.1, R * 0.28, '#ffe066', l * 0.6); });
  } else D.snowman(x, y, R, { face: f, scarf: '#e8484f', hat: '#4a8fe0' });
};

// ---------- 2.11.5: «куда идти» — один явный режим для героя и для «Все сюда» ----------
// Выбранный герой (или флажок «Все сюда») — режим на одно нажатие: его видно (подсказка сверху, флажок у курсора),
// он сам гаснет через несколько секунд, повторное нажатие на героя отменяет. Вне режима нажатие на поле героев не двигает.
(function () {
  var UI = Z.ui, TT = Z.TT || function (r, e) { return Z.LANG === 'en' ? e : r; };
  var oOver = Z.drawOver;
  Z.drawOver = function (ctx, X, Y, cs, t) {
    if (oOver) oOver.apply(this, arguments);
    var G = Z.G; if (!G || !UI || UI.screen !== 'level') return;
    try {
      if (UI.heroSel && (UI.heroSel.dead || Z.time - (UI.heroSelT || Z.time) > 5)) UI.heroSel = null;
      if (UI.allMode && Z.time - (UI.allModeT || (UI.allModeT = Z.time)) > 6) UI.allMode = false;
      var U = UI.heroSel, all = UI.allMode; if (!U && !all) { UI._selFor = null; return; }
      var col = U ? Z.ALLIES[U.type].col : '#ffd54a', S = Z.S || 1;
      var left = U ? Math.max(0, 5 - (Z.time - UI.heroSelT)) : Math.max(0, 6 - (Z.time - UI.allModeT));
      // флажок у курсора (на компьютере) и пунктир от героя
      var key = U || 'all'; if (UI._selFor !== key) { UI._selFor = key; UI._hv0 = UI.ptrHover ? { x: UI.ptrHover.x, y: UI.ptrHover.y } : null; }
      var hv = UI.ptrHover && (!UI._hv0 || Math.hypot(UI.ptrHover.x - UI._hv0.x, UI.ptrHover.y - UI._hv0.y) > 10) ? UI.ptrHover : null;   // флажок только когда курсор/палец сдвинулся
      if (hv) { ctx.save(); if (U) { ctx.setLineDash([7, 6]); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X(U.x), Y(U.y)); ctx.lineTo(hv.x, hv.y); ctx.stroke(); ctx.setLineDash([]); }
        var fh = cs * 0.6; ctx.strokeStyle = D.OL; ctx.lineWidth = Math.max(1.5, fh * 0.08); ctx.beginPath(); ctx.moveTo(hv.x - fh * 0.2, hv.y); ctx.lineTo(hv.x - fh * 0.2, hv.y - fh); ctx.stroke(); D.poly([hv.x - fh * 0.2, hv.y - fh, hv.x + fh * 0.4, hv.y - fh * 0.8, hv.x - fh * 0.2, hv.y - fh * 0.6], col, 1.5); ctx.restore(); }
      // кольцо вокруг выбранного героя
      if (U) { ctx.save(); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, cs * 0.06); ctx.beginPath(); ctx.ellipse(X(U.x), Y(U.y), cs * 0.5, cs * 0.2, 0, 0, 7); ctx.stroke(); ctx.restore(); }
      // подсказка сверху поля с полоской оставшегося времени
      var vp = UI.L.vp || { x: 0, y: 0, w: UI.L.sw || 600 }, txt = U ? TT('Нажми, куда идти · отмена — ещё раз на героя', 'Tap where to go · tap the hero again to cancel') : TT('Нажми место — весь отряд пойдёт туда', 'Tap a spot — the whole squad goes there');
      var fs = Math.max(11, 13 * S); ctx.font = D.font(fs); var w = Math.min(vp.w - 20, ctx.measureText(txt).width + 40 * S), h = 30 * S, x = vp.x + vp.w / 2 - w / 2, y = vp.y + 56 * S;
      ctx.save(); D.rr(x, y, w, h, h / 2); ctx.fillStyle = 'rgba(20,28,60,0.88)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.stroke();
      D.text(txt, x + w / 2, y + h / 2 - 1, D.fitText(txt, w - 24 * S, fs), '#fff', 'center', 'middle', 0);
      ctx.fillStyle = col; ctx.fillRect(x + h / 2, y + h - 4 * S, (w - h) * left / (U ? 5 : 6), 2.5 * S); ctx.restore();
    } catch (e) { if (window.__rep) window.__rep(e); }
  };
})();
})();
