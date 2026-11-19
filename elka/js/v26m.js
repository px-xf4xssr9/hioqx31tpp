// v2.6m: декорации новых мультиков М13–М20 — у каждого своё место, предметы не клонируются (разный размер, цвет, поворот)
(function () {
  var Z = window.Z, D = Z.D, OL = '#26304f';
  function c() { return D.ctx; }
  function G2(x0, y0, x1, y1, a, b) { var g = c().createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
  function sky(x, y, w, h, a, b) { var ctx = c(); ctx.fillStyle = G2(0, y, 0, y + h, a, b); ctx.fillRect(x, y, w, h); }
  function stars(x, y, w, h, t, n, seed) { var ctx = c(), r = Z.rng(seed); for (var i = 0; i < n; i++) { var sx = x + r() * w, sy = y + r() * h * 0.45; ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.3 * Math.sin(t * 1.3 + i)).toFixed(2) + ')'; ctx.fillRect(sx, sy, 2, 2); } }
  var STOP = { stop: 1 }, muted = false;   // 2.11.5: слои параллакса — всё до земли (небо, луна, дальний лес) идёт в дальний план
  function snowGround(x, y, w, h, col, seed) {
    if (Z.SCP === 'far') throw STOP;
    if (muted) { muted = false; c().restore(); }
    var ctx = c(), gy = y + h * 0.78, r = Z.rng(seed);
    ctx.fillStyle = col || '#e8eefc'; ctx.beginPath(); ctx.moveTo(x, y + h);
    for (var xx = 0; xx <= w; xx += 12) ctx.lineTo(x + xx, gy - (0.5 + 0.5 * Math.sin(xx * 0.011 + seed)) * h * 0.03 - (0.5 + 0.5 * Math.sin(xx * 0.031)) * h * 0.01);   // 2.11.5: сугробы только вверх от линии земли — что стоит на ней, всегда в снегу, а не над пустотой
    ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
    for (var i = 0; i < 26; i++) { ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.8)' : 'rgba(150,170,215,0.22)'; ctx.beginPath(); ctx.ellipse(x + r() * w, gy + h * 0.02 + r() * h * 0.2, h * (0.02 + r() * 0.05), h * (0.006 + r() * 0.012), 0, 0, 7); ctx.fill(); }
    return gy;
  }
  function pines(x, y, w, h, n, seed, y0, yk, colA) { var r = Z.rng(seed); for (var i = 0; i < n; i++) { var px = x + (i + 0.2 + r() * 0.6) / n * w; D.pine(px, y0 + r() * h * 0.02, h * (yk + r() * yk * 0.6), r() < 0.5 ? (colA || '#24804f') : '#2f8f5b'); } }

  var S = {};
  // М13: енотовый лагерь-стройка — палатки разных цветов, бочки, ящики, леса, бетономешалка-кадка
  S.camp = S.campdone = function (k, x, y, w, h, t) {
    var ctx = c(); sky(x, y, w, h, '#3a4f8a', '#b7c4e6');
    ctx.fillStyle = 'rgba(255,240,200,0.5)'; ctx.beginPath(); ctx.arc(x + w * 0.82, y + h * 0.2, h * 0.07, 0, 7); ctx.fill();
    pines(x, y, w, h, 9, 31, y + h * 0.805, 0.24, '#1f6f45');   // 2.11.5: стволы уходят под снег — ёлки растут из земли, а не висят над ней
    var gy = snowGround(x, y, w, h, '#eef2fb', 3), r = Z.rng(77);
    var tents = [['#d9533f', 0.12, 0.17], ['#3f8fd9', 0.32, 0.13], ['#e3a93a', 0.86, 0.15], ['#5aa86a', 0.66, 0.11]];
    function shadowAt(cx, ww) { ctx.fillStyle = 'rgba(60,80,140,0.2)'; ctx.beginPath(); ctx.ellipse(cx + ww * 0.08, gy + h * 0.004, ww * 0.62, h * 0.014, 0, 0, 7); ctx.fill(); }
    function lipAt(cx, ww) { ctx.fillStyle = '#eef2fb'; ctx.beginPath(); ctx.ellipse(cx, gy + h * 0.006, ww * 0.55, h * 0.011, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(120,140,190,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, gy + h * 0.006, ww * 0.55, h * 0.011, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    var lips = [];
    tents.forEach(function (q) { var tx = x + w * q[1], th = h * q[2], tw = th * (1.3 + r() * 0.4); shadowAt(tx, tw); lips.push([tx, tw * 1.05]); D.poly([tx - tw / 2, gy, tx, gy - th, tx + tw / 2, gy], q[0], 2); D.poly([tx - th * 0.18, gy, tx, gy - th * 0.55, tx + th * 0.18, gy], D.shade(q[0], -40), 1.5); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, gy - th); ctx.lineTo(tx, gy - th * 1.15); ctx.stroke(); });
    // леса из жердей
    var sx = x + w * 0.46, sw = w * 0.12, shh = h * 0.24; ctx.strokeStyle = '#8a5a35'; ctx.lineWidth = Math.max(2, h * 0.01);
    shadowAt(sx + sw / 2, sw * 1.1); for (var li = 0; li < 3; li++) lips.push([sx + li * sw / 2, h * 0.04]);
    ctx.beginPath(); for (var i = 0; i < 3; i++) { ctx.moveTo(sx + i * sw / 2, gy); ctx.lineTo(sx + i * sw / 2, gy - shh); } for (var j = 1; j < 4; j++) { ctx.moveTo(sx - 4, gy - j * shh / 4); ctx.lineTo(sx + sw + 4, gy - j * shh / 4); } ctx.moveTo(sx, gy); ctx.lineTo(sx + sw, gy - shh); ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = Math.max(2, h * 0.01) + 3; ctx.stroke(); ctx.strokeStyle = '#8a5a35'; ctx.lineWidth = Math.max(2, h * 0.01); ctx.stroke();
    // бочки и ящики — все разные
    for (var b = 0; b < 6; b++) { var bx = x + w * (0.04 + r() * 0.92), bs = h * (0.035 + r() * 0.03), by = gy + h * (0.005 + r() * 0.04);
      if (r() < 0.5) { D.rr(bx - bs * 0.6, by - bs * 1.4, bs * 1.2, bs * 1.4, bs * 0.25); ctx.fillStyle = ['#9c6c40', '#7f5332', '#b98a5a'][b % 3]; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = OL; ctx.stroke(); ctx.fillStyle = '#5a6385'; ctx.fillRect(bx - bs * 0.6, by - bs * 1.05, bs * 1.2, bs * 0.12); ctx.fillRect(bx - bs * 0.6, by - bs * 0.45, bs * 1.2, bs * 0.12); }
      else { D.rr(bx - bs * 0.7, by - bs * 1.1, bs * 1.4, bs * 1.1, 2); ctx.fillStyle = ['#c7925f', '#d4a26c', '#a87348'][b % 3]; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = OL; ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx - bs * 0.7, by - bs * 1.1); ctx.lineTo(bx + bs * 0.7, by); ctx.stroke(); } }
    // табличка
    // 2.11.5: табличка — на верху лесов, над головами (раньше стояла за Метелицей и её не было видно)
    var scx = sx + sw / 2, sbw = Math.max(w * 0.13, sw * 1.25), sbh = h * 0.07, sby = gy - shh - sbh - h * 0.03;
    // 2.11.5: табличка прибита к крайним жердям лесов — жерди продолжаются вверх до таблички, сверху лесов поперечина
    var pw = Math.max(2, h * 0.01); ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = pw + 3; ctx.beginPath(); ctx.moveTo(sx, gy - shh); ctx.lineTo(sx, sby + sbh * 0.5); ctx.moveTo(sx + sw, gy - shh); ctx.lineTo(sx + sw, sby + sbh * 0.5); ctx.moveTo(sx - 4, gy - shh); ctx.lineTo(sx + sw + 4, gy - shh); ctx.stroke();
    ctx.strokeStyle = '#8a5a35'; ctx.lineWidth = pw; ctx.stroke();
    D.rr(scx - sbw / 2, sby, sbw, sbh, 3); ctx.fillStyle = '#ffd54a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
    D.text(Z.LANG === 'en' ? 'BUILD SITE' : 'СТРОЙКА', scx, sby + sbh * 0.5, Math.max(8, h * 0.028), OL);
    if (k === 'campdone') {   // «замок» — аккуратная будка
      var dx = x + w * 0.56, ds = h * 0.11; shadowAt(dx, ds * 2.2); lips.push([dx, ds * 2.3]); D.poly([dx - ds, gy, dx - ds, gy - ds, dx, gy - ds * 1.7, dx + ds, gy - ds, dx + ds, gy], '#bfe6ff', 2);
      D.ell(dx, gy - ds * 0.35, ds * 0.35, ds * 0.4, '#3a4a7a'); ctx.fillStyle = '#3a4a7a'; ctx.fillRect(dx - ds * 0.35, gy - ds * 0.35, ds * 0.7, ds * 0.35);
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dx, gy - ds * 1.7); ctx.lineTo(dx, gy - ds * 2.3); ctx.stroke(); D.poly([dx, gy - ds * 2.3, dx + ds * 0.5, gy - ds * 2.15 + Math.sin(t * 5) * 2, dx, gy - ds * 2.0], '#c7b8ff', 1.5);
    }
    lips.forEach(function (q) { lipAt(q[0], q[1]); });   // снег у основания: палатки, леса и будка стоят В снегу
  };
  // М14: чаща Лешего — разные деревья с глазами, туман, светлячки
  S.thicket = function (k, x, y, w, h, t) {
    var ctx = c(); sky(x, y, w, h, '#0f1d22', '#3b5a5a'); stars(x, y, w, h, t, 14, 5);
    var gy = y + h * 0.78, r = Z.rng(141);
    for (var i = 0; i < 7; i++) {
      var tx = x + (i + 0.3 + r() * 0.4) / 7 * w, th = h * (0.35 + r() * 0.3), tw = h * (0.03 + r() * 0.03), lean = (r() - 0.5) * 0.25;
      ctx.save(); ctx.translate(tx, gy); ctx.rotate(lean);
      D.rr(-tw / 2, -th, tw, th, tw * 0.3); ctx.fillStyle = ['#4a3a2a', '#3d3226', '#574332'][i % 3]; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
      ctx.strokeStyle = '#3d3226'; ctx.lineWidth = tw * 0.4; ctx.beginPath(); ctx.moveTo(0, -th * 0.7); ctx.lineTo(tw * (1.5 + r()), -th * (0.85 + r() * 0.1)); ctx.moveTo(0, -th * 0.55); ctx.lineTo(-tw * (1.5 + r()), -th * (0.7 + r() * 0.1)); ctx.stroke();
      ctx.fillStyle = ['#1f4a3a', '#24553f', '#2a5d44'][i % 3]; ctx.beginPath(); ctx.arc(0, -th, tw * (2 + r() * 1.5), 0, 7); ctx.fill();
      if (r() < 0.75) { var ey = -th * (0.45 + r() * 0.2), bl = Math.sin(t * (0.7 + i * 0.13) + i * 3) > 0.95 ? 0.1 : 1; ctx.fillStyle = '#d8ff7a'; ctx.beginPath(); ctx.ellipse(-tw * 0.18, ey, tw * 0.13, tw * 0.13 * bl, 0, 0, 7); ctx.ellipse(tw * 0.18, ey, tw * 0.13, tw * 0.13 * bl, 0, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    snowGround(x, y, w, h, '#c9d6d8', 14);
    ctx.fillStyle = 'rgba(200,230,220,0.18)'; for (var f = 0; f < 4; f++) { ctx.beginPath(); ctx.ellipse(x + ((f * 0.29 * w + t * 12) % (w + 200)) - 100, gy - h * 0.02, w * 0.25, h * 0.05, 0, 0, 7); ctx.fill(); }
    for (var s = 0; s < 9; s++) { var fx = x + (r() * w + Math.sin(t * 0.7 + s) * 20), fy = y + h * (0.35 + r() * 0.35) + Math.cos(t + s) * 10; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + s * 2); D.circ(fx, fy, 2.5, '#fff6a8'); } ctx.globalAlpha = 1;
  };
  // М15: лётное поле — шары разных цветов и размеров, колдобины снегоходов, флюгер-колбаса
  S.airfield = function (k, x, y, w, h, t) {
    var ctx = c(); sky(x, y, w, h, '#4a6fb0', '#cfe0f6');
    var r = Z.rng(151);
    for (var cl = 0; cl < 4; cl++) { var cx = x + ((r() * w + t * 6 * (cl + 1)) % (w + 120)) - 60, cy = y + h * (0.1 + r() * 0.2); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(cx, cy, h * 0.08, h * 0.03, 0, 0, 7); ctx.ellipse(cx + h * 0.05, cy - h * 0.015, h * 0.05, h * 0.025, 0, 0, 7); ctx.fill(); }
    var cols = [['#e84a4f', '#ffd54a'], ['#4aa3ff', '#ffffff'], ['#7a3fa0', '#ffb86a'], ['#2f8f5b', '#e8e8e8']];
    cols.forEach(function (q, i) { var bx = x + w * (0.1 + i * 0.27 + r() * 0.06), by = y + h * (0.18 + r() * 0.22) + Math.sin(t * 0.8 + i) * h * 0.015, br = h * (0.045 + r() * 0.04);
      D.circ(bx, by, br, q[0], 2); ctx.save(); ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); ctx.clip(); ctx.fillStyle = q[1]; ctx.fillRect(bx - br * 0.25, by - br, br * 0.5, br * 2); ctx.restore(); D.circ(bx, by, br, null); ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
      ctx.strokeStyle = OL; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - br * 0.6, by + br * 0.8); ctx.lineTo(bx - br * 0.3, by + br * 1.6); ctx.moveTo(bx + br * 0.6, by + br * 0.8); ctx.lineTo(bx + br * 0.3, by + br * 1.6); ctx.stroke();
      D.rr(bx - br * 0.32, by + br * 1.6, br * 0.64, br * 0.5, 2); ctx.fillStyle = '#9c6c40'; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke(); });
    var gy = snowGround(x, y, w, h, '#eef2fb', 15);
    ctx.strokeStyle = 'rgba(120,140,190,0.35)'; ctx.lineWidth = h * 0.012; for (var tr = 0; tr < 2; tr++) { ctx.beginPath(); for (var xx = 0; xx <= w; xx += 20) ctx.lineTo(x + xx, gy + h * (0.06 + tr * 0.03) + Math.sin(xx * 0.02 + tr) * h * 0.02); ctx.stroke(); }
    var wx = x + w * 0.93; ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx, gy); ctx.lineTo(wx, gy - h * 0.25); ctx.stroke();
    var sw = Math.sin(t * 2) * 0.15; ctx.save(); ctx.translate(wx, gy - h * 0.24); ctx.rotate(-1.5 + sw); for (var st = 0; st < 4; st++) { ctx.fillStyle = st % 2 ? '#fff' : '#ff7a3d'; ctx.fillRect(st * h * 0.025, -h * 0.012 + st * 0.6, h * 0.025, h * 0.024 - st * 1.2); } ctx.restore();
  };
  // М16: погреб — каменная кладка, полки с банками (у каждой своя крышка и варенье), бочки, фонарь
  S.cellar = function (k, x, y, w, h, t) {
    var ctx = c(); ctx.fillStyle = '#2a2230'; ctx.fillRect(x, y, w, h);
    var r = Z.rng(161), bh = h * 0.06, bw = h * 0.12;
    for (var row = 0; row * bh < h * 0.8; row++) for (var col = -1; col * bw < w + bw; col++) { var bx = x + col * bw + (row % 2) * bw / 2, by = y + row * bh; D.rr(bx + 1, by + 1, bw - 2, bh - 2, 3); ctx.fillStyle = ['#4a3e52', '#544660', '#3f3548'][(row * 7 + col) % 3]; ctx.fill(); }
    var gy = y + h * 0.78; ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x, gy, w, h); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, gy, w, h * 0.02);
    var jars = ['#c0392b', '#e67e22', '#8e44ad', '#f1c40f', '#27ae60', '#d35400'];
    [0.28, 0.5].forEach(function (sy, si) { var shY = y + h * sy, sx0 = x + w * (si ? 0.55 : 0.05), sw0 = w * 0.38; ctx.fillStyle = '#8a5a35'; ctx.fillRect(sx0, shY, sw0, h * 0.02); ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.strokeRect(sx0, shY, sw0, h * 0.02);
      for (var j = 0; j < 6; j++) { var jx = sx0 + sw0 * (0.08 + j * 0.16 + r() * 0.03), jh = h * (0.05 + r() * 0.04), jw = jh * (0.55 + r() * 0.3); D.rr(jx - jw / 2, shY - jh, jw, jh, 3); ctx.fillStyle = jars[(j * 5 + si * 2) % 6]; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = OL; ctx.stroke(); ctx.fillStyle = ['#fff', '#e0d0b0', '#c0d0e0'][j % 3]; ctx.fillRect(jx - jw * 0.55, shY - jh - 3, jw * 1.1, 4); } });
    // фонарь и световое пятно
    var lx = x + w * 0.5, ly = y + h * 0.12, fl = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 3.7);
    var lg = ctx.createRadialGradient(lx, ly, 0, lx, ly + h * 0.3, h * 0.6); lg.addColorStop(0, 'rgba(255,210,120,' + (0.35 * fl).toFixed(2) + ')'); lg.addColorStop(1, 'rgba(255,210,120,0)'); ctx.fillStyle = lg; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx, ly - h * 0.03); ctx.stroke(); D.rr(lx - h * 0.025, ly - h * 0.03, h * 0.05, h * 0.06, 3); ctx.fillStyle = '#ffcf6b'; ctx.fill(); ctx.stroke();
    // куча орехов (пустая полка — орехи украдены) и бочки
    for (var n = 0; n < 5; n++) { var nx = x + w * (0.08 + r() * 0.2), ny = gy + h * 0.02 + r() * h * 0.03; D.circ(nx, ny, h * 0.012, '#a0703a', 1); }
    for (var b = 0; b < 3; b++) { var bx2 = x + w * (0.78 + b * 0.08), bs = h * (0.06 + r() * 0.03); D.rr(bx2 - bs * 0.6, gy - bs * 1.3 + h * 0.03, bs * 1.2, bs * 1.3, bs * 0.25); ctx.fillStyle = ['#7f5332', '#9c6c40', '#6b4428'][b]; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = OL; ctx.stroke(); }
  };
  // М17: остров посреди озера — маяк, рыбацкие домики вдалеке, лунки
  S.isle = function (k, x, y, w, h, t) {
    var ctx = c(); sky(x, y, w, h, '#1b3a5c', '#8fc4e0'); stars(x, y, w, h, t, 12, 7);
    var gy = y + h * 0.78; ctx.fillStyle = '#cfeaf8'; ctx.fillRect(x, y + h * 0.7, w, h);
    var r = Z.rng(171);
    for (var f = 0; f < 4; f++) { var fx = x + w * (0.05 + f * 0.09 + r() * 0.03), fy = y + h * 0.7, fs = h * (0.03 + r() * 0.02); D.rr(fx - fs, fy - fs, fs * 2, fs, 2); ctx.fillStyle = ['#c7925f', '#a87348', '#d4a26c', '#b88250'][f]; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = OL; ctx.stroke(); D.poly([fx - fs * 1.2, fy - fs, fx, fy - fs * 1.8, fx + fs * 1.2, fy - fs], ['#3d6fc4', '#b8323a', '#2f8f5b', '#7a3fa0'][f], 1.2); }
    // остров и маяк
    var ix = x + w * 0.78; ctx.fillStyle = '#f3f7ff'; ctx.beginPath(); ctx.ellipse(ix, y + h * 0.71, w * 0.14, h * 0.04, 0, Math.PI, 0); ctx.fill();
    var lw = h * 0.05; ctx.fillStyle = G2(ix - lw, 0, ix + lw, 0, '#ffffff', '#c9d6f0'); ctx.beginPath(); ctx.moveTo(ix - lw, y + h * 0.7); ctx.lineTo(ix - lw * 0.6, y + h * 0.36); ctx.lineTo(ix + lw * 0.6, y + h * 0.36); ctx.lineTo(ix + lw, y + h * 0.7); ctx.closePath(); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
    ctx.fillStyle = '#e84a4f'; ctx.fillRect(ix - lw * 0.78, y + h * 0.5, lw * 1.56, h * 0.04); ctx.fillRect(ix - lw * 0.68, y + h * 0.42, lw * 1.36, h * 0.03);
    var beam = -Math.PI / 2 + Math.sin(t * 0.5) * 1.15;   // луч ходит по небу, а не по снегу ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff6c4'; ctx.beginPath(); ctx.moveTo(ix, y + h * 0.33); ctx.arc(ix, y + h * 0.33, w * 0.6, beam - 0.12, beam + 0.12); ctx.fill(); ctx.restore(); D.circ(ix, y + h * 0.33, lw * 0.4, '#ffe08a', 2);
    snowGround(x, y, w, h, '#e3f2fb', 17);
    for (var hl = 0; hl < 3; hl++) { var hx = x + w * (0.12 + hl * 0.3 + r() * 0.05), hy = gy + h * (0.012 + r() * 0.012), hr = h * (0.025 + r() * 0.01); D.ell(hx, hy, hr * 1.25, hr * 0.42, '#f6fbff', 1.2); D.ell(hx, hy + hr * 0.05, hr, hr * 0.3, '#4f9ad0'); D.ell(hx - hr * 0.3, hy, hr * 0.3, hr * 0.08, 'rgba(255,255,255,0.7)'); }   // 2.11.5: лунки — у горизонта, со снежным краем (а не тёмные «тени» под ногами)
  };
  // М18: ледоход — тёмная вода, плывущие льдины разной формы
  S.drift = function (k, x, y, w, h, t) {
    var ctx = c(); sky(x, y, w, h, '#2a3f6a', '#a9c4e6');
    pines(x, y, w, h, 6, 181, y + h * 0.635, 0.16, '#2a6f4f');
    ctx.fillStyle = '#e3eaf6'; ctx.beginPath(); ctx.moveTo(x, y + h * 0.62); for (var xx = 0; xx <= w; xx += 20) ctx.lineTo(x + xx, y + h * 0.62 + Math.sin(xx * 0.02) * 4); ctx.lineTo(x + w, y + h * 0.66); ctx.lineTo(x, y + h * 0.66); ctx.fill();
    ctx.fillStyle = G2(0, y + h * 0.66, 0, y + h * 0.78, '#3d6f9e', '#5aa7d6'); ctx.fillRect(x, y + h * 0.66, w, h * 0.13);
    var r = Z.rng(182);
    for (var i = 0; i < 6; i++) { var fw = h * (0.06 + r() * 0.08), fx = x + ((r() * w + t * (14 + i * 3)) % (w + fw * 2)) - fw, fy = y + h * (0.68 + r() * 0.08), pts = [];
      for (var p = 0; p < 6; p++) { var a = p / 6 * Math.PI * 2, rr = fw * (0.7 + r() * 0.4); pts.push(fx + Math.cos(a) * rr, fy + Math.sin(a) * rr * 0.25); } D.poly(pts, '#f3f8ff', 1.5); }
    // таран на своей льдине — медленно уплывает
    var rx = x + w * 0.62 + ((t * 9) % (w * 0.5)), ry = y + h * 0.735; D.poly([rx - h * 0.13, ry, rx - h * 0.1, ry - h * 0.025, rx + h * 0.12, ry - h * 0.03, rx + h * 0.15, ry + h * 0.005, rx + h * 0.05, ry + h * 0.025], '#f3f8ff', 1.5);
    D.enemy({ type: 'ram', size: 1.3, dir: 1, walk: 0, ph: 0, hitT: 0, slow: 0, kb: 0, hp: 1, max: 1 }, rx, ry - h * 0.005, h * 0.17, t);
    snowGround(x, y, w, h, '#eef2fb', 18);
  };
  // М19: горный гараж — сугробы рядами, как в тетрисе, ворота гаража
  S.plowyard = function (k, x, y, w, h, t) {
    var ctx = c(); sky(x, y, w, h, '#1e2240', '#7a80ae'); stars(x, y, w, h, t, 18, 9);
    D.poly([x - w * 0.05, y + h * 0.78, x + w * 0.22, y + h * 0.22, x + w * 0.5, y + h * 0.78], '#8f9bc6', 2); D.poly([x + w * 0.12, y + h * 0.4, x + w * 0.22, y + h * 0.22, x + w * 0.31, y + h * 0.38, x + w * 0.24, y + h * 0.42, x + w * 0.18, y + h * 0.37], '#fff', 1.5);
    D.poly([x + w * 0.6, y + h * 0.78, x + w * 0.82, y + h * 0.3, x + w * 1.05, y + h * 0.78], '#a9b4da', 2);
    var gx = x + w * 0.38, gw = w * 0.24, gt = y + h * 0.5; D.rr(gx, gt, gw, h * 0.28, 4); ctx.fillStyle = '#5a6385'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OL; ctx.stroke();
    for (var s = 0; s < 6; s++) { ctx.fillStyle = s % 2 ? '#6f7899' : '#7f88aa'; ctx.fillRect(gx + gw * 0.1, gt + h * 0.06 + s * h * 0.035, gw * 0.8, h * 0.035); }
    D.poly([gx - gw * 0.1, gt, gx + gw / 2, gt - h * 0.1, gx + gw * 1.1, gt], '#e8484f', 2);
    var gy = snowGround(x, y, w, h, '#eef2fb', 19);
    D.enemy({ type: 'plow', size: 1.6, dir: 1, walk: 0, ph: 0, hitT: 0, slow: 0, kb: 0, hp: 1, max: 1 }, x + w * 0.2, gy + h * 0.05, h * 0.3, 0);   // супероружие у ворот
    var cols = ['#ffffff', '#e8f0ff', '#dde8fb'], r = Z.rng(191);
    for (var row = 0; row < 2; row++) for (var b = 0; b < 7; b++) { if (r() < 0.25) continue; var bx = x + w * (0.66 + b * 0.045), by = gy + h * (0.05 - row * 0.05); D.rr(bx, by - h * 0.05, w * 0.043, h * 0.05, 3); ctx.fillStyle = cols[(b + row) % 3]; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(60,80,130,0.6)'; ctx.stroke(); }
  };
  // М20: бар «Сосулька» — нуар, но уютно: обшитые доской стены, окно с морозным узором и луной, полки с вареньем и морсом
  // (банки с крышками и наклейками, бутылки, кружки), связка баранок, гармонь и часы с маятником, афиша «Разыскивается»,
  // стойка с филёнками, граммофон, бочонок мёда, пол в клетку, полосы света. Самовар — на столе (реквизит «pies»).
  S.bar = function (k, x, y, w, h, t) {
    var ctx = c(), L2 = Math.max(1.5, h * 0.004);
    ctx.fillStyle = G2(0, y, 0, y + h, '#3a2630', '#4e3440'); ctx.fillRect(x, y, w, h);
    for (var i = 0; i < 28; i++) { var px = x + i * w / 28; ctx.fillStyle = i % 2 ? 'rgba(255,220,180,0.035)' : 'rgba(0,0,0,0.06)'; ctx.fillRect(px, y, w / 28, h * 0.78); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(px, y, 1, h * 0.78); }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + h * 0.5, w, h * 0.012);   // поясок обшивки
    // окно: морозный узор и луна
    var wx = x + w * 0.83, wy = y + h * 0.17, ww = w * 0.11, wh = h * 0.2;
    D.rr(wx - ww / 2 - 4, wy - 4, ww + 8, wh + 8, 4); ctx.fillStyle = '#5a3a2a'; ctx.fill(); ctx.lineWidth = L2; ctx.strokeStyle = OL; ctx.stroke();
    ctx.fillStyle = G2(0, wy, 0, wy + wh, '#1c2350', '#3a4a8a'); ctx.fillRect(wx - ww / 2, wy, ww, wh); D.circ(wx + ww * 0.22, wy + wh * 0.28, wh * 0.12, '#fff3c4');
    ctx.save(); ctx.beginPath(); ctx.rect(wx - ww / 2, wy, ww, wh); ctx.clip(); ctx.strokeStyle = 'rgba(220,240,255,0.55)'; ctx.lineWidth = 1.2;
    for (var f = 0; f < 6; f++) { var fx0 = wx - ww / 2 + (f % 3) * ww * 0.45, fy0 = wy + wh * (f < 3 ? 1 : 0); for (var b = 0; b < 5; b++) { var a = -Math.PI / 2 + (f < 3 ? 0 : Math.PI) + (b - 2) * 0.45; ctx.beginPath(); ctx.moveTo(fx0, fy0); ctx.lineTo(fx0 + Math.cos(a) * wh * 0.35, fy0 + Math.sin(a) * wh * 0.35); ctx.stroke(); } }
    ctx.restore(); ctx.fillStyle = '#5a3a2a'; ctx.fillRect(wx - 2, wy, 4, wh); ctx.fillRect(wx - ww / 2, wy + wh / 2 - 2, ww, 4);
    // вывеска
    var sx = x + w * 0.5, sy = y + h * 0.1, glow = 0.7 + 0.3 * (Math.sin(t * 13) > -0.92 ? 1 : 0);
    ctx.save(); ctx.globalAlpha = glow; ctx.shadowColor = '#7fd8ff'; ctx.shadowBlur = 14; D.text(Z.LANG === 'en' ? '"ICICLE" BAR' : 'БАР «СОСУЛЬКА»', sx, sy, Math.max(10, h * 0.06), '#bff0ff'); ctx.restore();
    D.flake(sx - D.mw(Z.LANG === 'en' ? '"ICICLE" BAR' : 'БАР «СОСУЛЬКА»', Math.max(10, h * 0.06)) / 2 - h * 0.04, sy, h * 0.022, '#bff0ff', 1.5);
    // полки
    var r = Z.rng(201), shY = y + h * 0.42, JC = ['#c0392b', '#e67e22', '#8e44ad', '#f1c40f', '#27ae60', '#e84393'];
    [shY, shY - h * 0.15].forEach(function (yy, si) {
      ctx.fillStyle = '#6b4428'; ctx.fillRect(x + w * 0.04, yy, w * 0.72, h * 0.018); ctx.fillStyle = '#4a2c18'; ctx.fillRect(x + w * 0.04, yy + h * 0.018, w * 0.72, h * 0.006);
      for (var j = 0; j < 12; j++) {
        var jx = x + w * (0.07 + j * 0.058), kind = (j * 5 + si * 3) % 4, col = JC[(j * 3 + si) % 6], jh = h * (0.055 + r() * 0.03);
        if (kind === 0 || kind === 1) {   // банка варенья: крышка-тряпочка с бечёвкой, наклейка
          var jw = jh * 0.85; D.rr(jx - jw / 2, yy - jh, jw, jh, jw * 0.18); ctx.fillStyle = col; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = L2 * 0.7; ctx.strokeStyle = OL; ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(jx - jw * 0.32, yy - jh * 0.85, jw * 0.12, jh * 0.6);
          D.rr(jx - jw * 0.3, yy - jh * 0.6, jw * 0.6, jh * 0.3, 2); ctx.fillStyle = '#fff4dc'; ctx.fill();
          ctx.beginPath(); ctx.moveTo(jx - jw * 0.6, yy - jh); ctx.quadraticCurveTo(jx, yy - jh * 1.3, jx + jw * 0.6, yy - jh); ctx.lineTo(jx + jw * 0.45, yy - jh * 0.88); ctx.lineTo(jx - jw * 0.45, yy - jh * 0.88); ctx.closePath(); ctx.fillStyle = (j + si) % 2 ? '#e8484f' : '#3fb6e6'; ctx.fill(); ctx.stroke();
          for (var dd = 0; dd < 3; dd++) D.circ(jx - jw * 0.3 + dd * jw * 0.3, yy - jh * 1.0, jw * 0.05, '#ffffff');
        } else if (kind === 2) {   // бутылка морса с пробкой
          var bw = jh * 0.42; ctx.beginPath(); ctx.moveTo(jx - bw / 2, yy); ctx.lineTo(jx - bw / 2, yy - jh * 0.75); ctx.quadraticCurveTo(jx - bw / 2, yy - jh * 0.95, jx - bw * 0.2, yy - jh * 1.05); ctx.lineTo(jx - bw * 0.2, yy - jh * 1.3); ctx.lineTo(jx + bw * 0.2, yy - jh * 1.3); ctx.lineTo(jx + bw * 0.2, yy - jh * 1.05); ctx.quadraticCurveTo(jx + bw / 2, yy - jh * 0.95, jx + bw / 2, yy - jh * 0.75); ctx.lineTo(jx + bw / 2, yy); ctx.closePath();
          ctx.fillStyle = col; ctx.globalAlpha = 0.75; ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = L2 * 0.7; ctx.strokeStyle = OL; ctx.stroke();
          ctx.fillStyle = '#c99a5a'; ctx.fillRect(jx - bw * 0.22, yy - jh * 1.42, bw * 0.44, jh * 0.14); ctx.fillStyle = '#fff4dc'; ctx.fillRect(jx - bw / 2 + 1, yy - jh * 0.55, bw - 2, jh * 0.25);
        } else {   // кружка с ручкой
          var mw = jh * 0.65, mh = jh * 0.7; D.rr(jx - mw / 2, yy - mh, mw, mh, 2); ctx.fillStyle = (j % 2) ? '#f4f0e6' : '#9fd2ff'; ctx.fill(); ctx.lineWidth = L2 * 0.7; ctx.strokeStyle = OL; ctx.stroke();
          ctx.beginPath(); ctx.arc(jx + mw / 2, yy - mh * 0.5, mh * 0.25, -Math.PI / 2, Math.PI / 2); ctx.stroke(); D.flake(jx, yy - mh * 0.5, mh * 0.18, '#3f86c0', 1);
        }
      }
    });
    // связка баранок
    var bgx = x + w * 0.8, bgy = y + h * 0.43; ctx.strokeStyle = '#a07040'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bgx, bgy - h * 0.05); ctx.lineTo(bgx, bgy + h * 0.12); ctx.stroke();
    for (var bg = 0; bg < 5; bg++) { var by2 = bgy + bg * h * 0.025, bxo = (bg % 2 ? 1 : -1) * h * 0.015; ctx.beginPath(); ctx.ellipse(bgx + bxo, by2, h * 0.028, h * 0.02, 0, 0, 7); ctx.lineWidth = h * 0.013; ctx.strokeStyle = OL; ctx.stroke(); ctx.lineWidth = h * 0.009; ctx.strokeStyle = '#e0a050'; ctx.stroke(); }
    // гармонь на стене
    var ax = x + w * 0.88, ay = y + h * 0.5; ctx.save(); ctx.translate(ax, ay); ctx.rotate(-0.12);
    D.rr(-h * 0.07, -h * 0.045, h * 0.04, h * 0.09, 3); ctx.fillStyle = '#b3203a'; ctx.fill(); ctx.lineWidth = L2; ctx.strokeStyle = OL; ctx.stroke(); D.rr(h * 0.03, -h * 0.045, h * 0.04, h * 0.09, 3); ctx.fill(); ctx.stroke();
    for (var m = 0; m < 5; m++) { ctx.fillStyle = m % 2 ? '#e8e0d0' : '#c9b8a0'; ctx.fillRect(-h * 0.03 + m * h * 0.012, -h * 0.04, h * 0.012, h * 0.08); }
    for (var kb = 0; kb < 3; kb++) { D.circ(-h * 0.05, -h * 0.025 + kb * h * 0.025, h * 0.006, '#ffe9a8'); D.circ(h * 0.05, -h * 0.025 + kb * h * 0.025, h * 0.006, '#ffe9a8'); }
    ctx.restore();
    // часы с маятником
    var cx2 = x + w * 0.035, cy2 = y + h * 0.2; D.rr(cx2 - h * 0.035, cy2 - h * 0.04, h * 0.07, h * 0.17, 6); ctx.fillStyle = '#6b4428'; ctx.fill(); ctx.lineWidth = L2; ctx.strokeStyle = OL; ctx.stroke();
    D.circ(cx2, cy2, h * 0.028, '#fff4dc', L2 * 0.8); ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(cx2 + h * 0.015, cy2 - h * 0.008); ctx.moveTo(cx2, cy2); ctx.lineTo(cx2, cy2 - h * 0.02); ctx.lineWidth = 1.5; ctx.stroke();
    var pa = Math.sin(t * 3) * 0.35; ctx.beginPath(); ctx.moveTo(cx2, cy2 + h * 0.04); ctx.lineTo(cx2 + Math.sin(pa) * h * 0.07, cy2 + h * 0.04 + Math.cos(pa) * h * 0.07); ctx.strokeStyle = '#d9a520'; ctx.lineWidth = 2; ctx.stroke(); D.circ(cx2 + Math.sin(pa) * h * 0.07, cy2 + h * 0.04 + Math.cos(pa) * h * 0.07, h * 0.012, '#ffd54a', 1);
    // афиша «Разыскивается»
    var px2 = x + w * 0.72, py2 = y + h * 0.2; ctx.save(); ctx.translate(px2, py2); ctx.rotate(0.06);
    ctx.fillStyle = '#f0deb0'; ctx.fillRect(-h * 0.055, -h * 0.07, h * 0.11, h * 0.15); ctx.lineWidth = L2 * 0.7; ctx.strokeStyle = '#8a6a3a'; ctx.strokeRect(-h * 0.055, -h * 0.07, h * 0.11, h * 0.15);
    D.text(Z.LANG === 'en' ? 'WANTED' : 'РОЗЫСК', 0, -h * 0.05, h * 0.02, '#6a3a1a');
    D.circ(0, -h * 0.005, h * 0.03, '#9aa0b8'); ctx.fillStyle = '#2a2a3a'; ctx.fillRect(-h * 0.03, -h * 0.015, h * 0.06, h * 0.012); D.circ(-h * 0.022, -h * 0.03, h * 0.01, '#9aa0b8'); D.circ(h * 0.022, -h * 0.03, h * 0.01, '#9aa0b8');
    D.text('100 ❄', 0, h * 0.055, h * 0.018, '#6a3a1a'); D.circ(0, -h * 0.068, h * 0.006, '#c0392b'); ctx.restore();
    // стойка с филёнками
    var gy = y + h * 0.78, ct = gy - h * 0.1;
    ctx.fillStyle = G2(0, ct, 0, gy, '#8a5a35', '#5a3a22'); ctx.fillRect(x, ct, w, h * 0.12); ctx.fillStyle = '#b07a42'; ctx.fillRect(x, ct, w, h * 0.016); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, ct + h * 0.016, w, h * 0.004);
    for (var pn = 0; pn < 12; pn++) { var pnx = x + pn * w / 12 + w * 0.012; D.rr(pnx, ct + h * 0.03, w / 12 - w * 0.024, h * 0.06, 3); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(40,20,10,0.45)'; ctx.stroke(); }
    // граммофон на стойке
    var gx2 = x + w * 0.62, gby = ct; D.rr(gx2 - h * 0.04, gby - h * 0.035, h * 0.08, h * 0.035, 3); ctx.fillStyle = '#6b4428'; ctx.fill(); ctx.lineWidth = L2; ctx.strokeStyle = OL; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx2, gby - h * 0.035); ctx.lineTo(gx2 + h * 0.01, gby - h * 0.08); ctx.lineWidth = h * 0.008; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx2 + h * 0.01, gby - h * 0.08); ctx.lineTo(gx2 + h * 0.06, gby - h * 0.15); ctx.lineTo(gx2 + h * 0.1, gby - h * 0.09); ctx.closePath(); ctx.fillStyle = G2(gx2, 0, gx2 + h * 0.1, 0, '#ffe27a', '#c98a1c'); ctx.fill(); ctx.lineWidth = L2; ctx.stroke();
    for (var nt = 0; nt < 2; nt++) { var np = (t * 0.5 + nt * 0.5) % 1; ctx.globalAlpha = 1 - np; D.text('♪', gx2 + h * 0.09 + np * h * 0.05, gby - h * 0.15 - np * h * 0.08, h * 0.035, '#ffe9a8'); ctx.globalAlpha = 1; }
    // бочонок мёда на стойке
    var hx2 = x + w * 0.1; D.ell(hx2, ct - h * 0.035, h * 0.03, h * 0.035, G2(hx2 - h * 0.03, 0, hx2 + h * 0.03, 0, '#d08a40', '#8a5020'), L2);
    ctx.strokeStyle = '#3d3d4d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(hx2, ct - h * 0.05, h * 0.028, h * 0.006, 0, 0, Math.PI); ctx.stroke(); ctx.beginPath(); ctx.ellipse(hx2, ct - h * 0.02, h * 0.028, h * 0.006, 0, 0, Math.PI); ctx.stroke();
    D.text(Z.LANG === 'en' ? 'HONEY' : 'МЁД', hx2, ct - h * 0.035, h * 0.013, '#ffe9a8');
    // пол в клетку
    ctx.fillStyle = '#3a2a30'; ctx.fillRect(x, gy + h * 0.02, w, h); for (var tx = 0; tx < 30; tx++) for (var ty = 0; ty < 4; ty++) if ((tx + ty) % 2) { ctx.fillStyle = '#4a3640'; ctx.fillRect(x + tx * w / 30, gy + h * 0.02 + ty * h * 0.06, w / 30, h * 0.06); }
    // полосы света
    ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = '#ffe9b0'; for (var bb = 0; bb < 5; bb++) { ctx.beginPath(); ctx.moveTo(x + w * (0.6 + bb * 0.05), y); ctx.lineTo(x + w * (0.65 + bb * 0.05), y); ctx.lineTo(x + w * (0.35 + bb * 0.05), y + h); ctx.lineTo(x + w * (0.3 + bb * 0.05), y + h); ctx.fill(); } ctx.restore();
  };
  // титры глав (тарантиновские)
  S.title = function (k, x, y, w, h, t) { var ctx = c(); ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h); };

  var old = Z.drawScene;
  var INDOOR = { cellar: 1, bar: 1, title: 1 };
  Z.sceneLayered = function (k) { return !Z.lowGfx && !INDOOR[k] && !!(S[k] || { night: 1, village: 1, lake: 1, mount: 1, pole: 1, storm: 1, fest: 1 }[k]); };
  Z.drawScene = function (k, x, y, w, h, t) {
    if (!S[k]) return old.apply(this, arguments);
    if (!Z.SCP || INDOOR[k]) { if (Z.SCP !== 'far') S[k](k, x, y, w, h, t); return; }
    if (Z.SCP === 'far') { try { S[k](k, x, y, w, h, t); } catch (e) { if (e !== STOP) throw e; } return; }
    var ctx = c(); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 0, 0); ctx.clip(); muted = true;   // ближний план: до земли рисуем «в пустоту»
    try { S[k](k, x, y, w, h, t); } finally { if (muted) { muted = false; ctx.restore(); } }
  };
  Z.SCENE_NEW = S;
})();

// ---------- титры глав и игровые отсылки ----------
(function () {
  var Z = window.Z, D = Z.D, UI = Z.ui, TT = Z.TT;
  var TITLE = { 'M20-01': ['ГЛАВА ПЕРВАЯ', '«ПИРОЖОК»', 'CHAPTER ONE', '"THE PIE"'], 'M20-07': ['ГЛАВА ВТОРАЯ', '«КЛИЧКИ»', 'CHAPTER TWO', '"CODE NAMES"'],
    'M20-13': ['ГЛАВА ТРЕТЬЯ', '«ДЕЛО»', 'CHAPTER THREE', '"THE JOB"'], 'M20-17': ['ГЛАВА ЧЕТВЁРТАЯ', '«НЕМАЯ СЦЕНА»', 'CHAPTER FOUR', '"THE STANDOFF"'] };
  var curId = null;
  var oldHook = UI.drawMultHook;
  UI.drawMultHook = function (m) { curId = m && m.ids && m.i >= 0 ? m.ids[Math.min(m.i, m.ids.length - 1)] : null; return oldHook.apply(this, arguments); };
  var S = Z.SCENE_NEW, oldT = S.title;
  S.title = function (k, x, y, w, h, t) {
    oldT(k, x, y, w, h, t);
    var q = TITLE[curId]; if (!q) return; var ctx = D.ctx, en = Z.LANG === 'en', fs = Math.max(14, h * 0.07);
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.font = '700 ' + fs + 'px Georgia, "Times New Roman", serif';
    var cx = x + w / 2; ctx.fillText(en ? q[2] : q[0], cx, y + h * 0.42); ctx.fillStyle = '#ffd54a'; ctx.font = '700 ' + fs * 1.3 + 'px Georgia, "Times New Roman", serif'; ctx.fillText(en ? q[3] : q[1], cx, y + h * 0.42 + fs * 1.6); ctx.restore();
  };
  // разбойник: «Бомба заложена!» у цели, «Потрачено» при поражении (иногда — чтобы не приедалось)
  var oldE = Z.hk.enemy;
  Z.hk.enemy = function (e, dt, v) {
    if (e.type === 'raz' && e.goal && !e.saidB && !e.blew) { var d = Math.hypot(e.goal.c + 0.5 - e.x, e.goal.r + 0.5 - e.y); if (d < 1.4) { e.saidB = true; if (Math.random() < 0.35) { if (Z.sayLine) Z.sayLine('RAZ-20', 0.5); if (Z._.addText) Z._.addText(TT('Бомба заложена!', 'Bomb planted!'), e.x, e.y - 0.8, '#ffb38a', 1.4, 0.7); } } }
    return oldE ? oldE(e, dt, v) : false;
  };
  var oldK = Z.hk.kill;
  Z.hk.kill = function (e) { if (oldK) oldK(e); if (e.type === 'raz' && !e.blew && Math.random() < 0.3 && Z._.addText) { Z._.addText(TT('ПОТРАЧЕНО', 'WASTED'), e.x, e.y - 0.7, '#ff5a5f', 1.8, 0.95); if (Z.sayLine && Math.random() < 0.5) Z.sayLine('RAZ-21', 0.4); } };
  // поражение — «Вы замёрзли!»
  Z.TXT.ru.lose = 'Вы замёрзли!'; Z.TXT.en.lose = 'You froze!';
})();
