// 2.11.5: страховка — отрицательный радиус (крошечная кнопка, сжатый экран) больше не роняет кадр, а рисует пустоту
(function (P) { if (!P || P._rGuard) return; P._rGuard = true;
  var oA = P.arc, oE = P.ellipse, oG = P.createRadialGradient;
  P.arc = function (x, y, r, a0, a1, ccw) { return oA.call(this, x, y, r > 0 ? r : 0, a0, a1, ccw); };
  if (oE) P.ellipse = function (x, y, rx, ry, rot, a0, a1, ccw) { return oE.call(this, x, y, rx > 0 ? rx : 0, ry > 0 ? ry : 0, rot, a0, a1, ccw); };
  P.createRadialGradient = function (x0, y0, r0, x1, y1, r1) { return oG.call(this, x0, y0, r0 > 0 ? r0 : 0, x1, y1, r1 > 0 ? r1 : 0); };
})(window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype);
/* Графика: всё рисуется кодом в едином мультяшном стиле */
(function () {
'use strict';
var Z = window.Z;
var D = Z.D = {};
var OL = D.OL = '#1b2448';
var COL = D.COL = {
  snow: '#f6f9ff', snowS: '#c8d5ef', green: '#2fa36b', greenD: '#1d7a4e', red: '#e8484f', redD: '#b8323a',
  gold: '#f7c843', goldD: '#c9961c', orange: '#ff9a3c', purple: '#7b5cd6', purpleD: '#5a3fb0', blue: '#4aa3ff', blueD: '#2b74c9',
  panel: '#fdf7ec', panelD: '#e8dcc6', ice: '#9fe3ff', wood: '#8a5a35', woodD: '#6b4626', stone: '#9aa7c2', stoneD: '#6f7d9c'
};
var ctx;
D.setCtx = function (c) { ctx = c; D.ctx = c; };

// ---------- примитивы ----------
var rr = D.rr = function (x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
};
var circ = D.circ = function (x, y, r, fill, lw) {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = OL; ctx.stroke(); }
};
var ell = D.ell = function (x, y, rx, ry, fill, lw) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = OL; ctx.stroke(); }
};
var poly = D.poly = function (pts, fill, lw) {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke(); }
};
D.font = function (px, w) { return (w || '900') + ' ' + Math.round(px) + "px 'Trebuchet MS', 'Segoe UI', Verdana, Arial, sans-serif"; };
var text = D.text = function (s, x, y, px, col, align, base, outline) {
  ctx.font = D.font(px); ctx.textAlign = align || 'center'; ctx.textBaseline = base || 'middle';
  if (outline) { ctx.lineJoin = 'round'; ctx.lineWidth = outline; ctx.strokeStyle = OL; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col || '#fff'; ctx.fillText(s, x, y);
};
D.fitText = function (s, maxW, px) { ctx.font = D.font(px); var w = ctx.measureText(s).width; return w > maxW ? px * maxW / w : px; };
D.wrap = function (s, maxW, px) {
  ctx.font = D.font(px); var words = s.split(' '), lines = [], cur = '';   // 2.7.21: меряем тем же жирным начертанием, каким рисуем (раньше строки вылезали)
  for (var i = 0; i < words.length; i++) { var t = cur ? cur + ' ' + words[i] : words[i]; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = words[i]; } else cur = t; }
  if (cur) lines.push(cur); return lines;
};
// 2.7.21: текст не мельче minPx — сначала в одну строку, если не влезает — переносим до maxLines строк; только потом ужимаем
D.fitLines = function (s, maxW, px, minPx, maxLines) {
  maxLines = maxLines || 2; minPx = Math.min(minPx || px, px);
  var one = D.fitText(s, maxW, px); if (one >= minPx || maxLines < 2) return { lines: [s], px: Math.max(one, Math.min(minPx, one)) };
  for (var p = px; p >= minPx - 0.01; p -= 0.5) { var L = D.wrap(s, maxW, p); if (L.length <= maxLines) { ctx.font = D.font(p); var ok = L.every(function (q) { return ctx.measureText(q).width <= maxW; }); if (ok) return { lines: L, px: p }; } }
  var L2 = D.wrap(s, maxW, minPx); if (L2.length > maxLines) { L2 = L2.slice(0, maxLines - 1).concat([L2.slice(maxLines - 1).join(' ')]); }
  ctx.font = D.font(minPx); var wmax = Math.max.apply(null, L2.map(function (q) { return ctx.measureText(q).width; }));
  return { lines: L2, px: wmax > maxW ? minPx * maxW / wmax : minPx };
};
// рисует строки из fitLines с центром блока по cy
D.textLines = function (F, x, cy, col, align, outline, lh) {
  lh = lh || 1.12; var n = F.lines.length, y0 = cy - (n - 1) * F.px * lh / 2;
  for (var i = 0; i < n; i++) D.text(F.lines[i], x, y0 + i * F.px * lh, F.px, col, align, 'middle', outline);
};
D.flake = function (x, y, r, col, w) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
  for (var i = 0; i < 6; i++) {
    var a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke();
    var bx = x + Math.cos(a) * r * 0.6, by = y + Math.sin(a) * r * 0.6;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a + 0.7) * r * 0.3, by + Math.sin(a + 0.7) * r * 0.3);
    ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a - 0.7) * r * 0.3, by + Math.sin(a - 0.7) * r * 0.3); ctx.stroke();
  }
  ctx.restore();
};
D.star = function (x, y, r, fill, lw) {
  var p = [];
  for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r; p.push(x + Math.cos(a) * rad, y + Math.sin(a) * rad); }
  poly(p, fill || COL.gold, lw);
};
D.heart = function (x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.2, x, y - r * 0.45);
  ctx.bezierCurveTo(x + r * 0.7, y - r * 1.2, x + r * 1.4, y - r * 0.1, x, y + r * 0.9); ctx.closePath();
  ctx.fillStyle = COL.red; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.2); ctx.strokeStyle = OL; ctx.stroke();
  circ(x - r * 0.4, y - r * 0.35, r * 0.18, 'rgba(255,255,255,0.7)');
};
D.coin = function (x, y, r) {
  circ(x, y, r, COL.gold, Math.max(1.5, r * 0.18));
  ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, Math.PI * 2); ctx.strokeStyle = COL.goldD; ctx.lineWidth = r * 0.14; ctx.stroke();
  D.flake(x, y, r * 0.42, COL.goldD, r * 0.13);
};
D.flakeIcon = function (x, y, r) { D.flake(x, y, r, OL, r * 0.42); D.flake(x, y, r, '#9fdcff', r * 0.2); };
D.adIcon = function (x, y, r) {
  rr(x - r, y - r * 0.7, r * 2, r * 1.4, r * 0.35); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = Math.max(1.5, r * 0.15); ctx.strokeStyle = OL; ctx.stroke();
  poly([x - r * 0.3, y - r * 0.4, x + r * 0.5, y, x - r * 0.3, y + r * 0.4], COL.purple);
};
// подарок в три четверти: передняя грань, боковая, крышка, лента и бант
D.gift3 = function (x, y, w, h, col, rib, l) {
  var d = w * 0.28;
  poly([x + w / 2, y, x + w / 2 + d, y - d * 0.6, x + w / 2 + d, y - h - d * 0.6, x + w / 2, y - h], shade(col, -45), l);
  poly([x - w / 2, y - h, x - w / 2 + d, y - h - d * 0.6, x + w / 2 + d, y - h - d * 0.6, x + w / 2, y - h], shade(col, 30), l);
  rr(x - w / 2, y - h, w, h, w * 0.06); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  ctx.fillStyle = rib; ctx.fillRect(x - w * 0.08, y - h, w * 0.16, h);
  ctx.beginPath(); ctx.moveTo(x - w * 0.08 + d * 0.5, y - h - d * 0.3); ctx.lineTo(x + w * 0.08 + d * 0.5, y - h - d * 0.3); ctx.lineWidth = w * 0.14; ctx.strokeStyle = rib; ctx.stroke();
  ell(x - w * 0.16 + d * 0.5, y - h - d * 0.45, w * 0.17, w * 0.1, rib, l * 0.7); ell(x + w * 0.16 + d * 0.5, y - h - d * 0.45, w * 0.17, w * 0.1, rib, l * 0.7);
};
// гора подарков под ёлкой
D.giftPile = function (x, y, W, t, lost) {
  var l = Math.max(1, W * 0.012), cols = [['#e8484f', '#ffd54a'], ['#4aa3ff', '#ffffff'], ['#4cc77d', '#e8484f'], ['#b77dff', '#ffd54a'], ['#ffd54a', '#e8484f'], ['#ff8fb1', '#ffffff'], ['#5ac8ff', '#ffd54a']];
  var items = [[-0.42, 0, 0.22, 0.17], [0.38, 0, 0.24, 0.2], [-0.15, 0.02, 0.2, 0.14], [0.12, 0.03, 0.18, 0.22], [-0.3, -0.15, 0.16, 0.13], [0.3, -0.18, 0.15, 0.12], [0.02, -0.2, 0.14, 0.11]];
  var n = items.length - (lost || 0);
  for (var i = 0; i < n; i++) { var it = items[i], c = cols[i % cols.length]; D.gift3(x + it[0] * W, y + it[1] * W, it[2] * W, it[3] * W, c[0], c[1], l); }
  for (var s = 0; s < 3; s++) { var a = 0.5 + 0.5 * Math.sin(t * 3 + s * 2); ctx.globalAlpha = a; D.star(x + (s - 1) * W * 0.3, y - W * (0.28 + (s % 2) * 0.08), W * 0.03, '#ffffff', 0); ctx.globalAlpha = 1; }
};
D.gift = function (x, y, r, col) {
  var lw = Math.max(1.5, r * 0.15);
  rr(x - r * 0.8, y - r * 0.3, r * 1.6, r * 1.1, r * 0.15); ctx.fillStyle = col || COL.red; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = OL; ctx.stroke();
  rr(x - r * 0.95, y - r * 0.65, r * 1.9, r * 0.45, r * 0.12); ctx.fillStyle = col ? shade(col, -30) : COL.redD; ctx.fill(); ctx.stroke();
  ctx.fillStyle = COL.gold; ctx.fillRect(x - r * 0.14, y - r * 0.65, r * 0.28, r * 1.45);
  ell(x - r * 0.35, y - r * 0.85, r * 0.35, r * 0.22, COL.gold, lw * 0.8); ell(x + r * 0.35, y - r * 0.85, r * 0.35, r * 0.22, COL.gold, lw * 0.8);
};
function shade(hex, amt) {
  var n = parseInt(hex.slice(1), 16), r = Math.max(0, Math.min(255, (n >> 16) + amt)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt)), b = Math.max(0, Math.min(255, (n & 255) + amt));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
D.shade = shade;
D.pine = function (x, y, h, col, snowy) {
  var w = h * 0.6, l = Math.max(1.2, h * 0.055);
  ctx.fillStyle = COL.woodD; ctx.fillRect(x - h * 0.06, y - h * 0.16, h * 0.12, h * 0.16);
  for (var i = 0; i < 3; i++) {
    var ty = y - h * 0.14 - i * h * 0.25, tw = w * (1 - i * 0.25);
    poly([x - tw / 2, ty, x, ty - h * 0.42, x + tw / 2, ty], i % 2 ? shade(col, 12) : col, l);
    ctx.fillStyle = 'rgba(10,30,40,0.2)'; ctx.beginPath(); ctx.moveTo(x + l * 0.5, ty - h * 0.4); ctx.lineTo(x + tw / 2 - l, ty - l * 0.5); ctx.lineTo(x + l * 0.5, ty - l * 0.5); ctx.closePath(); ctx.fill();
    if (snowy !== false) { ctx.beginPath(); ctx.moveTo(x - tw * 0.3, ty - h * 0.12); ctx.lineTo(x, ty - h * 0.42); ctx.lineTo(x + tw * 0.25, ty - h * 0.14); ctx.strokeStyle = '#fff'; ctx.lineWidth = l * 1.3; ctx.lineCap = 'round'; ctx.stroke(); }
  }
};

// ---------- снеговик ----------
// объём для круглых форм: тень снизу-справа и блик сверху-слева
D.vol = function (x, y, r) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r * 0.96, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = 'rgba(70,95,150,0.22)'; ctx.beginPath(); ctx.arc(x + r * 0.35, y + r * 0.35, r * 0.95, 0, Math.PI * 2); ctx.arc(x - r * 0.1, y - r * 0.1, r * 0.9, 0, Math.PI * 2, true); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};
D.snowman = function (x, y, R, opts) {
  opts = opts || {};
  var l = Math.max(1.2, R * 0.11), face = opts.face || 1;
  circ(x, y - R * 0.8, R, COL.snow, l); D.vol(x, y - R * 0.8, R);
  circ(x, y - R * 1.85, R * 0.72, COL.snow, l); D.vol(x, y - R * 1.85, R * 0.72);
  if (opts.scarf) { rr(x - R * 0.62, y - R * 2.62, R * 1.24, R * 0.28, R * 0.12); ctx.fillStyle = opts.scarf; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); }
  var hy = y - R * 2.95;
  circ(x, hy, R * 0.55, COL.snow, l); D.vol(x, hy, R * 0.55);
  circ(x - R * 0.19 + face * R * 0.04, hy - R * 0.08, R * 0.09, OL); circ(x + R * 0.19 + face * R * 0.04, hy - R * 0.08, R * 0.09, OL);
  poly([x, hy + R * 0.02, x + face * R * 0.55, hy + R * 0.1, x, hy + R * 0.16], COL.orange, l * 0.8);
  if (opts.hat) {
    ell(x, hy - R * 0.38, R * 0.62, R * 0.3, opts.hat, l);
  }
};

// ---------- фон уровня (статичный слой) ----------
// запас поля в клетках с каждой стороны; где дорога саней выходит в бок — шире, чтобы сани с оленем помещались
D.roadExt = function (L) {
  if (L._rext) return L._rext;
  var out = [];
  (L.paths || []).slice(0, 1).forEach(function (p) {
    if (p.length < 2) return;
    [0, p.length - 1].forEach(function (i) {
      var e = p[i], isSE = (L.start && e[0] === L.start[0] && e[1] === L.start[1]) || (L.end && e[0] === L.end[0] && e[1] === L.end[1]);
      if (!isSE) return;
      var dx = 0, dy = 0;
      if (e[0] === 0) dx = -1; else if (e[0] === L.W - 1) dx = 1; else if (e[1] === 0) dy = -1; else if (e[1] === L.H - 1) dy = 1; else return;
      out.push({ c: e[0], r: e[1], dx: dx, dy: dy, start: i === 0 });
    });
  });
  return (L._rext = out);
};
// нижний край рамки поверх стены и ворот: они уходят под рамку, а не обрываются в воздухе
D.frameBottom = function (L, X, Y, cs) {
  var P = D.fieldPad(L), x0 = X(-P.l), y0 = Y(-P.t), w = (L.W + P.l + P.r) * cs, h = (L.H + P.t + P.b) * cs;
  ctx.save(); ctx.beginPath(); ctx.rect(x0 - cs, Y(L.H) - cs * 3.2, w + cs * 2, cs * 4); ctx.clip();   // 2.11.4: выше — крыши домов у края тоже уходят под рамку
  rr(x0, y0, w, h, cs * 0.7); ctx.lineWidth = Math.max(2, cs * 0.08); ctx.strokeStyle = OL; ctx.stroke();
  ctx.restore();
};
D.frameClip = function (L, X, Y, cs) { var P = D.fieldPad(L); rr(X(-P.l), Y(-P.t), (L.W + P.l + P.r) * cs, (L.H + P.t + P.b) * cs, cs * 0.7); ctx.clip(); };
D.fieldPad = function (L) {
  var P = { l: 0.4, r: 0.4, t: 0.3, b: L.greatWall ? 0.3 : 0.2 }; // 2.11.4: под стеной — полоса снега, стена стоит на земле, а не «висит» на рамке
  D.roadExt(L).forEach(function (e) { if (e.dx < 0) P.l = 0.75; if (e.dx > 0) P.r = 0.75; if (e.dy < 0) P.t = 0.6; if (e.dy > 0) P.b = 0.6; });
  return P;
};
if (Z.RICH === undefined) Z.RICH = 4;   // 2.7.7: синяя дорога, рельеф снега, светлый дым (проверено вслепую против прежнего вида)
D.buildFieldLayer = function (G, cs, dpr) {
  var L = G.L, reg = Z.REGIONS[G.info.region], N = L.W, BW = cs * L.W, BH = cs * L.H, B = BW;
  var can = document.createElement('canvas');
  // 2.6l: запас вокруг клеток внутри рамки — сани, вышки и герои у края стоят на поле, а не выпирают за рамку
  var P = D.fieldPad(L), PL = P.l * cs, PT = P.t * cs, FW = BW + (P.l + P.r) * cs, FH = BH + (P.t + P.b) * cs, RR = cs * 0.7;
  can.width = Math.ceil(FW * dpr); can.height = Math.ceil(FH * dpr);
  var c2 = can.getContext('2d'); var prev = ctx; D.setCtx(c2);
  c2.setTransform(dpr, 0, 0, dpr, PL * dpr, PT * dpr);
  var rnd = Z.rng(99 + G.idx);
  // земля
  var g = c2.createLinearGradient(0, 0, 0, BH); g.addColorStop(0, reg.ground); g.addColorStop(1, reg.tint);
  rr(-PL, -PT, FW, FH, RR); c2.fillStyle = g; c2.fill();
  c2.save(); rr(-PL, -PT, FW, FH, RR); c2.clip();
  D.regionGround(c2, G.info.region, BW, BH, cs, rnd);
  for (var i = 0; i < L.W * L.H * 2.6; i++) { c2.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.8)' : 'rgba(150,170,215,0.18)'; var sx = rnd() * BW, sy = rnd() * BH; ell(sx, sy, cs * (0.05 + rnd() * 0.25), cs * (0.03 + rnd() * 0.08)); c2.fill(); }
  // те же снежные пятна на запасе вокруг клеток (отдельный генератор — карта внутри не меняется)
  var rp2 = Z.rng(555 + G.idx), padN = Math.round((FW * FH - BW * BH) / (cs * cs) * 2.6);
  for (var pi2 = 0; pi2 < padN; pi2++) { var qx = -PL + rp2() * FW, qy = -PT + rp2() * FH; if (qx > 0 && qx < BW && qy > 0 && qy < BH) continue; c2.fillStyle = rp2() < 0.5 ? 'rgba(255,255,255,0.8)' : 'rgba(150,170,215,0.18)'; ell(qx, qy, cs * (0.05 + rp2() * 0.25), cs * (0.03 + rp2() * 0.08)); c2.fill(); }
  // 2.7c: сугробы — мягкие светлые бугры с голубой тенью (свет слева-сверху); свой генератор, карта не меняется
  var FXON = !(Z.save && Z.save.shadowsOff);   // настройка «Тени и блёстки»
  var R4 = Z.RICH === 4;
  var rdn = Z.rng(4242 + G.idx), nd = FXON ? Math.round(FW * FH / (cs * cs) / 5) : 0;
  for (var dn = 0; dn < nd; dn++) {
    var dx = -PL + rdn() * FW, dy = -PT + rdn() * FH, dw = cs * (1.1 + rdn() * 1.6), dh = dw * (0.28 + rdn() * 0.12);
    var sg0 = c2.createRadialGradient(dx + dw * 0.12, dy + dh * 0.35, 0, dx + dw * 0.12, dy + dh * 0.35, dw * 0.75); sg0.addColorStop(0, R4 ? 'rgba(96,128,200,0.2)' : 'rgba(96,128,200,0.08)'); sg0.addColorStop(1, 'rgba(96,128,200,0)');
    c2.fillStyle = sg0; c2.beginPath(); c2.ellipse(dx + dw * 0.12, dy + dh * 0.35, dw * 0.75, dh * 0.9, 0, 0, Math.PI * 2); c2.fill();
    var hg0 = c2.createRadialGradient(dx - dw * 0.1, dy - dh * 0.2, 0, dx, dy, dw * 0.6); hg0.addColorStop(0, 'rgba(255,255,255,0.6)'); hg0.addColorStop(1, 'rgba(255,255,255,0)');
    c2.fillStyle = hg0; c2.beginPath(); c2.ellipse(dx, dy, dw * 0.6, dh * 0.7, 0, 0, Math.PI * 2); c2.fill();
    if (R4) { c2.strokeStyle = 'rgba(110,140,205,0.38)'; c2.lineWidth = Math.max(1, cs * 0.035); c2.lineCap = 'round'; c2.beginPath(); c2.ellipse(dx, dy, dw * 0.5, dh * 0.6, 0, 0.15 * Math.PI, 0.8 * Math.PI); c2.stroke(); }
  }
  // река
  if (L.riverRow !== undefined && Z.riverStatic) Z.riverStatic(c2, L, cs, -PL - cs, B + P.r * cs + cs);   // 2.11.5: та же река, что сверху (v30g)
  else if (L.riverRow !== undefined) {
    var ry = (L.riverRow + 0.5) * cs;
    c2.beginPath();
    for (var x = -PL - cs; x <= B + P.r * cs + cs; x += cs / 4) c2.lineTo(x, ry - cs * 0.42 + Math.sin(x / cs * 1.3) * cs * 0.06);
    for (var x2 = B + P.r * cs + cs; x2 >= -PL - cs; x2 -= cs / 4) c2.lineTo(x2, ry + cs * 0.42 + Math.sin(x2 / cs * 1.1 + 2) * cs * 0.06);
    c2.closePath();
    var rg = c2.createLinearGradient(0, ry - cs * 0.4, 0, ry + cs * 0.4); if (L.riverFrozen) { rg.addColorStop(0, '#d8f1ff'); rg.addColorStop(1, '#a9dcf7'); } else { rg.addColorStop(0, '#8fd0f0'); rg.addColorStop(1, '#5aa7d6'); }
    c2.fillStyle = rg; c2.fill(); c2.lineWidth = Math.max(1.5, cs * 0.05); c2.strokeStyle = OL; c2.stroke();
    for (var k = 0; k < 14; k++) { c2.strokeStyle = 'rgba(255,255,255,0.6)'; c2.lineWidth = cs * 0.04; var kx = rnd() * B; c2.beginPath(); c2.moveTo(kx, ry + (rnd() - 0.5) * cs * 0.4); c2.lineTo(kx + cs * 0.3, ry + (rnd() - 0.5) * cs * 0.4); c2.stroke(); }
  }
  // дороги
  var roads = L.paths;
  function roadPath(p) { c2.beginPath(); for (var i = 0; i < p.length; i++) { var px = (p[i][0] + 0.5) * cs, py = (p[i][1] + 0.5) * cs; if (!i) c2.moveTo(px, py); else c2.lineTo(px, py); } }
  // дорога саней, выходящая на край, продолжается по запасу до рамки
  var rExt = D.roadExt(L);
  if (rExt.length) roads = roads.map(function (p, pi) { if (pi) return p; var q = p.slice(); rExt.forEach(function (R) { var o = [R.c + R.dx * 3, R.r + R.dy * 3]; if (R.start) q.unshift(o); else q.push(o); }); return q; });
  c2.lineCap = 'round'; c2.lineJoin = 'round';
  var RC = (Z.ROADCOL && Z.ROADCOL[G.info.region]) || null;   // 2.11.5: у каждого региона своя дорога
  roads.forEach(function (p) { roadPath(p); c2.strokeStyle = OL; c2.lineWidth = cs * 0.9; c2.stroke(); });
  var R2 = Z.RICH === 2 || Z.RICH === 3 || R4, R3 = Z.RICH === 3 || R4;
  roads.forEach(function (p) { roadPath(p); c2.strokeStyle = RC ? RC[0] : R3 ? '#6d92d6' : R2 ? '#8fa6d4' : '#b9c7e4'; c2.lineWidth = cs * 0.8; c2.stroke(); });
  roads.forEach(function (p) { roadPath(p); c2.strokeStyle = RC ? RC[1] : R3 ? '#a3c4f3' : R2 ? '#b4c7ec' : '#d6e0f3'; c2.lineWidth = cs * 0.62; c2.stroke(); });
  if (RC && D.roadTexture) D.roadTexture(c2, roads, roadPath, cs, G.info.region, Z.rng(919 + G.idx));
  if (R4) { roads.forEach(function (p) { roadPath(p); c2.strokeStyle = 'rgba(255,255,255,0.2)'; c2.lineWidth = cs * 0.34; c2.stroke(); }); var rr4 = Z.rng(313 + G.idx); roads.forEach(function (p) { for (var i4 = 0; i4 < p.length; i4++) for (var j4 = 0; j4 < 2; j4++) { var sx4 = (p[i4][0] + 0.5 + (rr4() - 0.5) * 0.9) * cs, sy4 = (p[i4][1] + 0.5 + (rr4() < 0.5 ? -0.3 : 0.3) + (rr4() - 0.5) * 0.08) * cs; c2.fillStyle = 'rgba(255,255,255,0.75)'; c2.beginPath(); c2.ellipse(sx4, sy4, cs * (0.08 + rr4() * 0.1), cs * 0.045, 0, 0, Math.PI * 2); c2.fill(); } }); }
  roads.forEach(function (p) { roadPath(p); c2.setLineDash([cs * 0.12, cs * 0.18]); c2.strokeStyle = RC ? RC[2] : 'rgba(120,140,190,0.45)'; c2.lineWidth = cs * 0.05; c2.stroke(); c2.setLineDash([]); });
  // лёд и мосты
  for (var kk in L.ice) { var ic = +kk % N, ir = Math.floor(+kk / N); rr(ic * cs + cs * 0.14, ir * cs + cs * 0.14, cs * 0.72, cs * 0.72, cs * 0.25); c2.fillStyle = R3 ? 'rgba(232,248,255,0.95)' : 'rgba(140,215,255,0.75)'; c2.fill(); c2.strokeStyle = R3 ? '#2b86cf' : '#5ab4e6'; c2.lineWidth = cs * (R3 ? 0.06 : 0.04); c2.stroke(); c2.strokeStyle = 'rgba(255,255,255,0.9)'; c2.lineWidth = cs * 0.05; c2.beginPath(); c2.moveTo(ic * cs + cs * 0.3, ir * cs + cs * 0.65); c2.lineTo(ic * cs + cs * 0.55, ir * cs + cs * 0.3); c2.stroke(); }
  for (var bk in L.bridges) {
    var bc = +bk % N, br = Math.floor(+bk / N), bx = bc * cs, by = br * cs;
    rr(bx + cs * 0.06, by + cs * 0.02, cs * 0.88, cs * 0.96, cs * 0.1); c2.fillStyle = COL.wood; c2.fill(); c2.lineWidth = cs * 0.05; c2.strokeStyle = OL; c2.stroke();
    for (var pl = 1; pl < 5; pl++) { c2.beginPath(); c2.moveTo(bx + cs * 0.08, by + pl * cs * 0.19); c2.lineTo(bx + cs * 0.92, by + pl * cs * 0.19); c2.strokeStyle = COL.woodD; c2.lineWidth = cs * 0.03; c2.stroke(); }
    c2.fillStyle = 'rgba(255,255,255,0.85)'; c2.fillRect(bx + cs * 0.08, by + cs * 0.04, cs * 0.84, cs * 0.08);
  }
  if (D.mtnLayer && L.mtn) D.mtnLayer(c2, L, cs, G);   // 2.10.6: горный перевал
  // плато: верхняя площадка и обрыв спереди — объём
  var LF = cs * 0.32, hg = L.hgt || [];
  for (var pr = 0; pr < L.H; pr++) for (var pc = 0; pc < L.W; pc++) {
    if (!hg[pr] || !hg[pr][pc]) continue;
    var px = pc * cs, py = pr * cs - LF;
    var below = pr + 1 >= L.H || !hg[pr + 1][pc];
    if (below) { var fg = c2.createLinearGradient(0, py + cs, 0, py + cs + LF); fg.addColorStop(0, '#8d9bbd'); fg.addColorStop(1, '#5f6c8f'); c2.fillStyle = fg; c2.fillRect(px - 0.5, py + cs, cs + 1, LF); c2.fillStyle = 'rgba(30,40,70,0.18)'; c2.fillRect(px - 0.5, py + cs + LF, cs + 1, cs * 0.12);
      c2.strokeStyle = 'rgba(40,50,80,0.35)'; c2.lineWidth = 1; for (var rk = 1; rk < 4; rk++) { c2.beginPath(); c2.moveTo(px + rk * cs / 4, py + cs + 2); c2.lineTo(px + rk * cs / 4 - cs * 0.05, py + cs + LF - 1); c2.stroke(); } }
    if (pc === L.W - 1 || !hg[pr][pc + 1]) { c2.fillStyle = 'rgba(60,75,115,0.35)'; c2.fillRect(px + cs - cs * 0.06, py + cs * 0.1, cs * 0.06, cs * 0.9 + (below ? LF : 0)); }
    var tg = c2.createLinearGradient(px, py, px + cs, py + cs); tg.addColorStop(0, '#ffffff'); tg.addColorStop(1, '#dde7f7'); c2.fillStyle = tg; c2.fillRect(px - 0.5, py, cs + 1, cs + 0.5);
    for (var sp = 0; sp < 5; sp++) { c2.fillStyle = sp % 2 ? 'rgba(150,170,215,0.25)' : 'rgba(255,255,255,0.9)'; c2.beginPath(); c2.ellipse(px + rnd() * cs, py + rnd() * cs, cs * (0.06 + rnd() * 0.12), cs * 0.04, 0, 0, Math.PI * 2); c2.fill(); }
    c2.strokeStyle = OL; c2.lineWidth = Math.max(1.5, cs * 0.045); c2.beginPath();
    if (pr === 0 || !hg[pr - 1][pc]) { c2.moveTo(px, py); c2.lineTo(px + cs, py); }
    if (pc === 0 || !hg[pr][pc - 1]) { c2.moveTo(px, py); c2.lineTo(px, py + cs + (below ? LF : 0)); }
    if (pc === L.W - 1 || !hg[pr][pc + 1]) { c2.moveTo(px + cs, py); c2.lineTo(px + cs, py + cs + (below ? LF : 0)); }
    if (below) { c2.moveTo(px, py + cs + LF); c2.lineTo(px + cs, py + cs + LF); }
    c2.stroke();
    if (below) { c2.fillStyle = '#ffffff'; for (var dr = 0; dr < 3; dr++) { c2.beginPath(); c2.ellipse(px + cs * (0.2 + dr * 0.3), py + cs + 1, cs * 0.12, cs * 0.06, 0, 0, Math.PI); c2.fill(); } }
  }
  // мягкий свет: слева-сверху светлее, справа-снизу темнее
  var lg = c2.createLinearGradient(0, 0, BW, BH); lg.addColorStop(0, 'rgba(255,255,255,0.10)'); lg.addColorStop(1, R3 ? 'rgba(40,60,120,0.03)' : 'rgba(40,60,120,0.10)'); c2.fillStyle = lg; c2.fillRect(-PL, -PT, FW, FH);
  // клетки: сначала длинные тени от всего, что стоит на поле (свет слева-сверху), потом сами объекты
  var items = [];
  for (var r = 0; r < L.H; r++) for (var cc = 0; cc < L.W; cc++) {
    if (L.mtn && L.mtn.dec[r * L.W + cc]) continue;   // пики, скалы и ели горы рисует сама гора
    var v = L.grid[r][cc], cx = (cc + 0.5) * cs, cy = (r + 0.5) * cs - (hg[r] && hg[r][cc] ? LF : 0);
    if (v === 3 || v === 10 || v === 7 || v === 8) items.push({ v: v, x: cx, y: cy, r: r, c: cc });
    else if (v === 6) items.push({ v: 6, x: cx + (rnd() - 0.5) * cs * 0.3, y: cy + (rnd() - 0.5) * cs * 0.12, s: cs * (0.8 + rnd() * 0.42), r: r, c: cc });
  }
  var shadow = D.longShadow = function (c, x, y, len, wid, a) { c.save(); c.translate(x, y); c.rotate(0.42); var g0 = c.createLinearGradient(0, 0, len, 0); g0.addColorStop(0, 'rgba(46,70,140,' + a + ')'); g0.addColorStop(1, 'rgba(46,70,140,0)'); c.fillStyle = g0; c.beginPath(); c.ellipse(len * 0.5, 0, len * 0.5, wid, 0, 0, Math.PI * 2); c.fill(); c.restore(); };
  items.forEach(function (o) {
    if (!FXON) { if (o.v === 6 || o.v === 7 || o.v === 8) { c2.fillStyle = 'rgba(40,60,110,0.16)'; c2.beginPath(); c2.ellipse(o.x + cs * 0.16, o.y + cs * 0.36, cs * 0.38, cs * 0.12, -0.2, 0, Math.PI * 2); c2.fill(); } return; }
    if (o.v === 6) shadow(c2, o.x, o.y + cs * 0.38, o.s * 1.2, o.s * 0.2, 0.46);
    else if (o.v === 8) shadow(c2, o.x + cs * 0.05, o.y + cs * 0.36, cs * 1.15, cs * 0.3, 0.46);
    else if (o.v === 7) shadow(c2, o.x, o.y + cs * 0.24, cs * 0.7, cs * 0.16, 0.4);
    else if (o.v === 3) shadow(c2, o.x, o.y + cs * 0.3, cs * 0.9, cs * 0.24, 0.36);
  });
  // 2.11.5: предметы рисуются на отдельный прозрачный слой — по нему потом делаем «маску предметов»,
  // чтобы вода, болото и прочая плоская анимация не наезжали на деревья, камни и дома
  var objCan = document.createElement('canvas'); objCan.width = can.width; objCan.height = can.height;
  var o2 = objCan.getContext('2d'); o2.setTransform(dpr, 0, 0, dpr, PL * dpr, PT * dpr); var c2Base = c2; c2 = o2; D.setCtx(o2);
  // 2.11.5: каждый ряд клеток — своя полоска: потом ряд рисуется по глубине вместе с врагами (враг за ёлкой — за ёлкой)
  var strips = {}, stripOf = function (r, gnd) { var sk = r * 2 + (gnd ? 0 : 1); if (strips[sk]) return strips[sk]; var y0 = Math.max(0, Math.floor((PT + (r - 1.6) * cs) * dpr)), hS = Math.min(can.height - y0, Math.ceil(3.0 * cs * dpr)); if (hS <= 0) return null; var cv = document.createElement('canvas'); cv.width = can.width; cv.height = hS; var cx2 = cv.getContext('2d'); cx2.setTransform(dpr, 0, 0, dpr, PL * dpr, PT * dpr - y0); return (strips[sk] = { cv: cv, c: cx2, y0: y0, r: r, ground: !!gnd }); };
  items.forEach(function (o) {
    var Sr = stripOf(o.r, o.v === 3 || o.v === 10); if (Sr) { c2 = Sr.c; D.setCtx(Sr.c); } else { c2 = o2; D.setCtx(o2); }
    var v = o.v, cx = o.x, cy = o.y;
    if (v === 3) { if (G.L.ledges && G.L.ledges[o.r * G.L.W + o.c] && D.ledgeSpot) D.ledgeSpot(cx, cy, cs, o.c, o.r); else if (G.L.stumps && G.L.stumps[o.r * G.L.W + o.c] && D.stumpSpot) D.stumpSpot(cx, cy, cs); else D.hill(cx, cy, cs); }   // 2.11.4: высота-пенёк
    else if (v === 10) { ell(cx, cy + cs * 0.15, cs * 0.18, cs * 0.1, COL.woodD, Math.max(1, cs * 0.03)); ell(cx, cy + cs * 0.12, cs * 0.14, cs * 0.07, '#d9b38a'); }
    else if (v === 6) { if (D.regionTree) D.regionTree(cx, cy + cs * 0.4, cs, o.s, G.info ? G.info.region : 0, reg.tree, o.c, o.r, G.idx || 0); else D.pine(cx, cy + cs * 0.4, o.s, reg.tree); }   // 2.10.4: у каждого региона свои «деревья»
    else if (v === 7 && L.ridge && L.ridge[o.r * L.W + o.c] && D.ridgeRock) D.ridgeRock(cx, cy, cs, o.c, o.r, L);   // 2.10.5: скальная гряда
    else if (v === 7 && D.regionStone) D.regionStone(cx, cy, cs, G.info.region, o.c, o.r, G.idx || 0);
    else if (v === 7) { var sg = c2.createLinearGradient(cx - cs * 0.3, cy, cx + cs * 0.3, cy + cs * 0.3); sg.addColorStop(0, '#b9c3d8'); sg.addColorStop(1, '#6f7a95'); ell(cx, cy + cs * 0.15, cs * 0.32, cs * 0.2, sg, Math.max(1.2, cs * 0.04)); ell(cx - cs * 0.06, cy + cs * 0.06, cs * 0.2, cs * 0.09, '#fff'); }
    else if (v === 8) {
      // 2.11.5: изба посреди реки стоит на заснеженном островке с берегом, а не «висит» над водой
      var isl = false, gW = function (cc, rr) { return rr >= 0 && rr < L.H && cc >= 0 && cc < L.W && L.grid[rr][cc] === 4; };
      if (gW(o.c - 1, o.r) || gW(o.c + 1, o.r) || gW(o.c, o.r + 1)) {
        var iw = cs * 0.96, ih = cs * 0.56, ix = cx - iw / 2, iy = cy - cs * 0.31, il = Math.max(1.2, cs * 0.04); isl = true;
        D.rr(ix, iy + cs * 0.07, iw, ih, cs * 0.18); c2.fillStyle = '#9fb2cf'; c2.fill(); c2.lineWidth = il; c2.strokeStyle = OL; c2.stroke();   // берег — боковина островка
        D.rr(ix, iy, iw, ih, cs * 0.18); c2.fillStyle = '#f5f8ff'; c2.fill(); c2.lineWidth = il; c2.strokeStyle = OL; c2.stroke();
        c2.fillStyle = 'rgba(160,185,225,0.35)'; c2.beginPath(); c2.ellipse(cx - cs * 0.22, iy + ih * 0.78, cs * 0.16, cs * 0.05, 0, 0, 7); c2.ellipse(cx + cs * 0.3, iy + ih * 0.3, cs * 0.1, cs * 0.035, 0, 0, 7); c2.fill();
      }
      D.house(cx, cy + cs * (isl ? 0.2 : 0.35), cs, o.r * 31 + o.c * 7 + G.idx * 101);
    }
  });
  Object.keys(strips).map(Number).sort(function (a, b) { return a - b; }).forEach(function (r) { var S = strips[r]; o2.save(); o2.setTransform(1, 0, 0, 1, 0, 0); o2.drawImage(S.cv, 0, S.y0); o2.restore(); });
  c2 = c2Base; D.setCtx(c2); c2.save(); c2.setTransform(1, 0, 0, 1, 0, 0); c2.drawImage(objCan, 0, 0); c2.restore();
  // тёплый свет от ёлки и города, прохладная виньетка по краям, блёстки на снегу
  // 2.7.7 (проба): день сочнее — снег голубее, тени и дороги темнее, тёплый свет у ёлки ярче. Ночные карты не трогаем.
  var wxR = (G.v26 && G.v26.wx) || '', dayR = Z.RICH === true && FXON && !(wxR === 'night' || wxR === 'dark' || wxR === 'dusk' || wxR === 'storm' || G.mech === 'lights');
  if (dayR) {
    c2.globalCompositeOperation = 'multiply'; c2.fillStyle = Z.RICH_COL || '#c4d8fa'; c2.fillRect(-PL, -PT, FW, FH);
    var sgR = c2.createLinearGradient(0, 0, BW, BH); sgR.addColorStop(0, 'rgba(255,255,255,1)'); sgR.addColorStop(1, 'rgba(226,236,252,1)'); c2.fillStyle = sgR; c2.fillRect(-PL, -PT, FW, FH);
    c2.globalCompositeOperation = 'source-over';
    if (L.fort) { var fxR = (L.fort[0] + 0.5) * cs, fyR = (L.fort[1] + 0.3) * cs, wR = c2.createRadialGradient(fxR, fyR, cs * 0.3, fxR, fyR, cs * 5.2); wR.addColorStop(0, 'rgba(255,214,130,0.42)'); wR.addColorStop(0.45, 'rgba(255,196,120,0.16)'); wR.addColorStop(1, 'rgba(255,190,120,0)'); c2.globalCompositeOperation = 'screen'; c2.fillStyle = wR; c2.fillRect(-PL, -PT, FW, FH); c2.globalCompositeOperation = 'source-over'; }
  }
  if (R2 && FXON && L.fort && !(wxR === 'night' || wxR === 'dark' || wxR === 'dusk' || wxR === 'storm' || G.mech === 'lights')) { var fx2 = (L.fort[0] + 0.5) * cs, fy2 = (L.fort[1] + 0.2) * cs, w2 = c2.createRadialGradient(fx2, fy2, cs * 0.3, fx2, fy2, cs * 4.2); w2.addColorStop(0, 'rgba(255,186,84,0.38)'); w2.addColorStop(0.5, 'rgba(255,190,100,0.15)'); w2.addColorStop(1, 'rgba(255,190,100,0)'); c2.fillStyle = w2; c2.fillRect(-PL, -PT, FW, FH); }
  if (FXON && L.fort) { var fx0 = (L.fort[0] + 0.5) * cs, fy0 = (L.fort[1] + 0.3) * cs, wg = c2.createRadialGradient(fx0, fy0, cs * 0.3, fx0, fy0, cs * 4.6); wg.addColorStop(0, 'rgba(255,205,120,0.24)'); wg.addColorStop(0.5, 'rgba(255,190,120,0.09)'); wg.addColorStop(1, 'rgba(255,190,120,0)'); c2.fillStyle = wg; c2.fillRect(-PL, -PT, FW, FH); }
  if (FXON) { var vg0 = c2.createRadialGradient(BW * 0.42, BH * 0.4, Math.min(BW, BH) * 0.3, BW * 0.5, BH * 0.5, Math.max(BW, BH) * 0.78); vg0.addColorStop(0, 'rgba(40,60,130,0)'); vg0.addColorStop(1, R3 ? 'rgba(40,60,130,0.06)' : 'rgba(40,60,130,0.2)'); c2.fillStyle = vg0; c2.fillRect(-PL, -PT, FW, FH);
  var rsp = Z.rng(777 + G.idx); c2.fillStyle = '#fff';
  for (var sq = 0; sq < L.W * L.H * 0.7; sq++) { var qx2 = -PL + rsp() * FW, qy2 = -PT + rsp() * FH, qs = cs * (0.02 + rsp() * 0.035); c2.globalAlpha = 0.5 + rsp() * 0.5; c2.beginPath(); c2.moveTo(qx2, qy2 - qs * 2); c2.lineTo(qx2 + qs * 0.5, qy2 - qs * 0.5); c2.lineTo(qx2 + qs * 2, qy2); c2.lineTo(qx2 + qs * 0.5, qy2 + qs * 0.5); c2.lineTo(qx2, qy2 + qs * 2); c2.lineTo(qx2 - qs * 0.5, qy2 + qs * 0.5); c2.lineTo(qx2 - qs * 2, qy2); c2.lineTo(qx2 - qs * 0.5, qy2 - qs * 0.5); c2.closePath(); c2.fill(); }
  c2.globalAlpha = 1; }
  c2.restore();
  rr(-PL, -PT, FW, FH, RR); c2.lineWidth = Math.max(2, cs * 0.08); c2.strokeStyle = OL; c2.stroke();
  try { var over = document.createElement('canvas'); over.width = can.width; over.height = can.height; var ov = over.getContext('2d'); ov.drawImage(can, 0, 0); ov.globalCompositeOperation = 'destination-in'; ov.drawImage(objCan, 0, 0); can._over = over;
    // полоски рядов: берём уже готовые (подкрашенные) пиксели поля по маске предметов ряда
    can._rows = Object.keys(strips).map(function (r) { var S = strips[r], sc = S.c; sc.save(); sc.setTransform(1, 0, 0, 1, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.drawImage(can, 0, -S.y0); sc.restore();
      var cv = S.cv, h0 = cv.height;
      if (Z.lowGfx) { var hc = document.createElement('canvas'); hc.width = Math.max(1, Math.round(cv.width / 2)); hc.height = Math.max(1, Math.round(h0 / 2)); var hx = hc.getContext('2d'); hx.imageSmoothingQuality = 'high'; hx.drawImage(cv, 0, 0, hc.width, hc.height); cv = hc; }   // слабое устройство: полоски вдвое мельче — память почти не растёт
      return { r: S.r, cv: cv, y0: S.y0, h: h0, ground: S.ground }; });
    if (Z.lowGfx && can._rows.length) can._over = null;   // общий слой больше не нужен — освобождаем память
  } catch (eO) { if (window.__rep) window.__rep(eO); }
  D.setCtx(prev);
  return can;
};
D.hill = function (x, y, cs) {
  var l = Math.max(1.2, cs * 0.04);
  ell(x, y + cs * 0.14, cs * 0.46, cs * 0.3, '#c9d6f0', l); ell(x, y + cs * 0.06, cs * 0.4, cs * 0.24, '#eef4ff');
  ctx.strokeStyle = COL.woodD; ctx.lineWidth = l * 1.2; ctx.beginPath(); ctx.moveTo(x + cs * 0.3, y + cs * 0.08); ctx.lineTo(x + cs * 0.3, y - cs * 0.36); ctx.stroke();
  poly([x + cs * 0.3, y - cs * 0.36, x + cs * 0.5, y - cs * 0.29, x + cs * 0.3, y - cs * 0.22], COL.red, l * 0.8);
};
// своя земля у каждого региона
D.regionGround = function (c2, reg, BW, BH, cs, rnd) {
  var i;
  if (reg === 0) { for (i = 0; i < 18; i++) { c2.fillStyle = 'rgba(60,120,90,0.07)'; c2.beginPath(); c2.ellipse(rnd() * BW, rnd() * BH, cs * (0.6 + rnd()), cs * (0.3 + rnd() * 0.4), 0, 0, Math.PI * 2); c2.fill(); } }
  else if (reg === 1) { c2.strokeStyle = 'rgba(140,100,60,0.12)'; c2.lineWidth = cs * 0.05; for (i = 0; i < 10; i++) { var y = rnd() * BH; c2.beginPath(); c2.moveTo(0, y); c2.lineTo(BW, y + (rnd() - 0.5) * cs); c2.stroke(); } }
  else if (reg === 2) { for (i = 0; i < 14; i++) { var x = rnd() * BW, yy = rnd() * BH; c2.fillStyle = 'rgba(160,220,255,0.25)'; c2.beginPath(); c2.ellipse(x, yy, cs * (0.5 + rnd()), cs * 0.3, rnd(), 0, Math.PI * 2); c2.fill(); c2.strokeStyle = 'rgba(255,255,255,0.7)'; c2.lineWidth = 1.5; c2.beginPath(); c2.moveTo(x - cs * 0.3, yy); c2.lineTo(x + cs * 0.2, yy - cs * 0.1); c2.stroke(); } }
  else if (reg === 3) { for (i = 0; i < 22; i++) { c2.fillStyle = 'rgba(90,100,130,0.12)'; var px = rnd() * BW, py = rnd() * BH, s = cs * (0.15 + rnd() * 0.3); c2.beginPath(); c2.moveTo(px - s, py); c2.lineTo(px, py - s * 0.7); c2.lineTo(px + s, py); c2.closePath(); c2.fill(); } }
  else { for (i = 0; i < 30; i++) { c2.fillStyle = 'rgba(255,255,255,0.9)'; D.flake(rnd() * BW, rnd() * BH, cs * 0.08, 'rgba(200,220,255,0.5)', 1); } }
};
// куст: три снежных пучка, качается от ветра, шагов и взрывов
D.bush = function (x, y, cs, t, sway, seed) {
  var l = Math.max(1, cs * 0.035), a = sway + Math.sin(t * 1.3 + seed) * 0.03;
  ctx.save(); ctx.translate(x, y + cs * 0.3);
  ell(cs * 0.08, cs * 0.02, cs * 0.36, cs * 0.1, 'rgba(40,60,110,0.16)');
  var cols = ['#2f8f5b', '#257a4c', '#38a066'];
  for (var i = 0; i < 3; i++) {
    ctx.save(); ctx.rotate(a * (0.7 + i * 0.25)); var ox = (i - 1) * cs * 0.18, oy = -cs * (0.16 + (i === 1 ? 0.08 : 0));
    circ(ox, oy, cs * (0.17 + (i === 1 ? 0.04 : 0)), cols[i], l);
    ell(ox - cs * 0.03, oy - cs * 0.1, cs * 0.11, cs * 0.05, '#ffffff');
    ctx.restore();
  }
  ctx.restore();
};
// сугроб: высота от запаса, колея от шагов
D.drift = function (x, y, cs, amt, trail) {
  var l = Math.max(1, cs * 0.03), h = cs * (0.1 + 0.07 * amt);
  ctx.save(); ctx.translate(x, y + cs * 0.22);
  ctx.beginPath(); ctx.moveTo(-cs * 0.45, 0); ctx.quadraticCurveTo(-cs * 0.25, -h * 1.3, 0, -h); ctx.quadraticCurveTo(cs * 0.25, -h * 1.5, cs * 0.45, 0); ctx.closePath();
  var g = ctx.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfdcf3'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = 'rgba(60,80,130,0.55)'; ctx.stroke();
  if (trail > 0.05) { ctx.strokeStyle = 'rgba(110,130,180,' + (0.25 + trail * 0.4).toFixed(2) + ')'; ctx.lineWidth = cs * 0.08 * trail; ctx.beginPath(); ctx.moveTo(-cs * 0.35, -h * 0.25); ctx.quadraticCurveTo(0, -h * (1 - trail * 0.6), cs * 0.35, -h * 0.25); ctx.stroke(); }
  ctx.restore();
};
// постройки врагов
D.struct = function (s, x, y, cs, t) {
  var l = Math.max(1.2, cs * 0.04), rise = s.done ? 1 : Math.max(0.08, s.prog);
  if (!s.done) {
    // строительные леса
    ctx.save(); ctx.globalAlpha = s.stalled ? Math.max(0, 1 - (s.fade || 0) / 2.5) : 1;
    ctx.strokeStyle = '#8a5a35'; ctx.lineWidth = l * 1.1;
    ctx.beginPath(); ctx.moveTo(x - cs * 0.38, y); ctx.lineTo(x - cs * 0.38, y - cs * 1.1); ctx.moveTo(x + cs * 0.38, y); ctx.lineTo(x + cs * 0.38, y - cs * 1.1); ctx.moveTo(x - cs * 0.38, y - cs * 0.55); ctx.lineTo(x + cs * 0.38, y - cs * 0.55); ctx.moveTo(x - cs * 0.38, y - cs * 1.05); ctx.lineTo(x + cs * 0.38, y - cs * 0.1); ctx.stroke();
    var bw = cs * 0.7; ctx.fillStyle = OL; rr(x - bw / 2 - 1, y + cs * 0.12 - 1, bw + 2, cs * 0.08 + 2, 3); ctx.fill(); ctx.fillStyle = '#c79bff'; ctx.fillRect(x - bw / 2, y + cs * 0.12, bw * s.prog, cs * 0.08);
    ctx.restore();
  }
  ctx.save(); ctx.translate(x, y); ctx.scale(1, rise); if (s.hitT > 0) ctx.translate(Math.sin(t * 70) * cs * 0.03, 0);
  ell(cs * 0.08, cs * 0.02, cs * 0.42, cs * 0.12, 'rgba(30,40,80,0.22)');
  if (s.type === 'palisade') {
    ctx.fillStyle = '#4a3a55'; ctx.fillRect(-cs * 0.42, -cs * 0.12, cs * 0.84, cs * 0.1); ctx.strokeStyle = OL; ctx.lineWidth = l; ctx.strokeRect(-cs * 0.42, -cs * 0.12, cs * 0.84, cs * 0.1);
    for (var i = 0; i < 5; i++) { var px = -cs * 0.36 + i * cs * 0.18, h = cs * (0.5 + (i % 2) * 0.15); poly([px - cs * 0.07, 0, px, -h, px + cs * 0.07, 0], i % 2 ? '#bfe6ff' : '#8fd0f0', l); }
  } else if (s.type === 'watch') {
    poly([-cs * 0.3, 0, -cs * 0.18, -cs * 1.0, cs * 0.18, -cs * 1.0, cs * 0.3, 0], '#5b4a73', l);
    rr(-cs * 0.28, -cs * 1.25, cs * 0.56, cs * 0.28, cs * 0.05); ctx.fillStyle = '#8fd0f0'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    var g = 0.6 + 0.4 * Math.sin(t * 4); circ(0, -cs * 1.11, cs * 0.08, 'rgba(255,60,80,' + g.toFixed(2) + ')');
    ctx.strokeStyle = OL; ctx.lineWidth = l * 0.8; ctx.beginPath(); ctx.moveTo(0, -cs * 1.25); ctx.lineTo(0, -cs * 1.55); ctx.stroke();
    poly([0, -cs * 1.55, cs * 0.28, -cs * 1.47 + Math.sin(t * 5) * cs * 0.03, 0, -cs * 1.38], '#6b3fa0', l * 0.7);
    ctx.globalAlpha = 0.12 + 0.05 * Math.sin(t * 3); circ(0, -cs * 0.4, cs * 2.6, '#6b3fa0'); ctx.globalAlpha = 1;
  } else {
    circ(0, -cs * 0.22, cs * 0.26, '#e8eef9', l); circ(0, -cs * 0.6, cs * 0.18, '#e8eef9', l);
    circ(-cs * 0.06, -cs * 0.63, cs * 0.03, '#ff4060'); circ(cs * 0.06, -cs * 0.63, cs * 0.03, '#ff4060');
    poly([-cs * 0.16, -cs * 0.74, -cs * 0.1, -cs * 0.92, 0, -cs * 0.8, cs * 0.1, -cs * 0.92, cs * 0.16, -cs * 0.74], '#8fd0f0', l * 0.8);
    ctx.strokeStyle = '#5b4a73'; ctx.lineWidth = l * 1.4; ctx.beginPath(); ctx.moveTo(cs * 0.22, -cs * 0.3); ctx.lineTo(cs * 0.42, -cs * 0.62); ctx.stroke();
  }
  ctx.restore();
  if (s.hp < s.max) { var bw = cs * 0.6, bh = Math.max(3, cs * 0.06); ctx.fillStyle = OL; rr(x - bw / 2 - 1, y + cs * 0.12 - 1, bw + 2, bh + 2, 2); ctx.fill(); ctx.fillStyle = '#b77dff'; ctx.fillRect(x - bw / 2, y + cs * 0.12, bw * Math.max(0, s.hp / s.max), bh); }
};
// ловушки
D.trap = function (tr, x, y, cs, t) {
  var l = Math.max(1, cs * 0.035), T = tr.type, act = tr.t > 0 ? 1 : 0;
  if (T === 'spike') { ell(x, y + cs * 0.1, cs * 0.34, cs * 0.18, 'rgba(120,150,200,0.35)'); for (var i = 0; i < 5; i++) { var sx = x + (i - 2) * cs * 0.13, h = cs * (0.2 + (i % 2) * 0.08) * (act ? 1.3 : 1); poly([sx - cs * 0.05, y + cs * 0.12, sx, y + cs * 0.12 - h, sx + cs * 0.05, y + cs * 0.12], '#dff6ff', l); } }
  else if (T === 'puddle') { ell(x, y + cs * 0.08, cs * 0.42, cs * 0.24, 'rgba(127,216,255,0.75)', l); ell(x - cs * 0.1, y + cs * 0.03, cs * 0.16, cs * 0.06, 'rgba(255,255,255,0.8)'); }
  else if (T === 'mine') { ell(x, y + cs * 0.12, cs * 0.2, cs * 0.08, 'rgba(30,40,80,0.25)'); rr(x - cs * 0.13, y - cs * 0.1, cs * 0.26, cs * 0.22, cs * 0.05); ctx.fillStyle = COL.red; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(x - cs * 0.13, y - cs * 0.02, cs * 0.26, cs * 0.05); var bl = 0.5 + 0.5 * Math.sin(t * 8); circ(x, y - cs * 0.16, cs * 0.04, 'rgba(255,220,80,' + bl.toFixed(2) + ')'); }
  else if (T === 'snare') { ctx.beginPath(); ctx.arc(x, y + cs * 0.05, cs * 0.24, Math.PI * (act ? 0.1 : 0), Math.PI * (act ? 0.9 : 1)); ctx.strokeStyle = '#6b7592'; ctx.lineWidth = cs * 0.06; ctx.stroke(); for (var j = 0; j < 6; j++) { var a = Math.PI * j / 5; poly([x + Math.cos(a) * cs * 0.24, y + cs * 0.05 + Math.sin(a) * cs * 0.04, x + Math.cos(a) * cs * 0.3, y - cs * 0.06, x + Math.cos(a) * cs * 0.18, y + cs * 0.03], '#9aa1b5', 1); } }
};
D.plot = function (x, y, cs, hill) {
  var l = Math.max(1.2, cs * 0.04);
  if (hill) {
    ell(x, y + cs * 0.12, cs * 0.5, cs * 0.34, '#c9d6f0', l);
    ell(x, y + cs * 0.02, cs * 0.44, cs * 0.28, '#e9f0fc');
    ctx.strokeStyle = COL.woodD; ctx.lineWidth = l * 1.2; ctx.beginPath(); ctx.moveTo(x + cs * 0.3, y + cs * 0.05); ctx.lineTo(x + cs * 0.3, y - cs * 0.42); ctx.stroke();
    poly([x + cs * 0.3, y - cs * 0.42, x + cs * 0.52, y - cs * 0.34, x + cs * 0.3, y - cs * 0.26], COL.red, l * 0.8);
  }
  ell(x, y + cs * 0.14, cs * 0.38, cs * 0.24, COL.stoneD, l);
  ell(x, y + cs * 0.08, cs * 0.36, cs * 0.21, COL.stone);
  ell(x - cs * 0.05, y + cs * 0.03, cs * 0.26, cs * 0.12, '#f3f7ff');
};
D.house = function (x, y, cs) {
  var w = cs * 0.75, h = cs * 0.5, l = Math.max(1.2, cs * 0.045);
  // боковая стена — изба в три четверти
  poly([x + w / 2, y, x + w / 2 + cs * 0.16, y - cs * 0.08, x + w / 2 + cs * 0.16, y - h - cs * 0.08, x + w / 2, y - h], '#9c6c40', l);
  rr(x - w / 2, y - h, w, h, cs * 0.05); ctx.fillStyle = '#c7925f'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  ctx.strokeStyle = 'rgba(90,55,30,0.45)'; ctx.lineWidth = l * 0.6; for (var lg = 1; lg < 4; lg++) { ctx.beginPath(); ctx.moveTo(x - w / 2, y - h * lg / 4); ctx.lineTo(x + w / 2, y - h * lg / 4); ctx.stroke(); }
  poly([x + w * 0.62, y - h, x, y - h - cs * 0.42, x + w * 0.62 + cs * 0.16, y - h - cs * 0.08], '#8e2630', l);
  poly([x - w * 0.62, y - h, x, y - h - cs * 0.42, x + w * 0.62, y - h], '#b8323a', l);
  ctx.beginPath(); ctx.moveTo(x - w * 0.55, y - h - cs * 0.03); ctx.lineTo(x, y - h - cs * 0.38); ctx.lineTo(x + w * 0.55, y - h - cs * 0.03); ctx.strokeStyle = '#fff'; ctx.lineWidth = l * 1.6; ctx.stroke();
  rr(x - w * 0.15, y - h * 0.62, w * 0.3, h * 0.36, 2); ctx.fillStyle = '#ffcf6b'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
};

// 2.11.5: гирлянда «фестонами» — провисает между крюками на башнях, лампочки ровно по всей длине, без обрывов
D.festoon = function (x0, x1, yA, cs, l, t, seed, dark) {
  if (x1 - x0 < cs * 0.2) return;
  var sag = Math.min(cs * 0.16, (x1 - x0) * 0.08), cols = ['#ff5a5f', '#ffd54a', '#5ac8ff', '#9dff6a'];
  var Yf = function (xx) { var u = (xx - x0) / (x1 - x0); return yA + sag * 4 * u * (1 - u); };
  ctx.strokeStyle = OL; ctx.lineWidth = Math.max(1, l * 0.45); ctx.beginPath(); ctx.moveTo(x0, yA);
  for (var q = 1; q <= 16; q++) { var xx = x0 + (x1 - x0) * q / 16; ctx.lineTo(xx, Yf(xx)); } ctx.stroke();
  var n = Math.max(1, Math.round((x1 - x0) / (cs * 0.28))), step = (x1 - x0) / n;
  for (var i = 0; i < n; i++) { var bx = x0 + step * (i + 0.5), by = Yf(bx) + cs * 0.035, k = (seed + i) % 4, on = !dark && Math.sin(t * 4 + seed + i) > -0.3;
    if (on) { ctx.globalAlpha = 0.35; circ(bx, by, cs * 0.06, cols[k]); ctx.globalAlpha = 1; } circ(bx, by, cs * 0.026, on ? cols[k] : '#5a6385', Math.max(1, l * 0.3)); }
  circ(x0, yA, cs * 0.022, OL); circ(x1, yA, cs * 0.022, OL);
};
// ---------- крепостная стена на всю ширину поля, за ней — город ----------
D.greatWall = function (G, X, Y, cs, t, hpFrac, part) {   // part: 'town' — только крыши города за стеной, 'wall' — только стена (2.11.5: крыши — позади всего на поле)
  var L = G.L, f = L.fort, l = Math.max(1.5, cs * 0.05), y = Y(L.H - 0.02), h = cs * 0.8, gx0 = X(f[0] + 0.5) - cs * 1.15, gx1 = X(f[0] + 0.5) + cs * 1.15;
  var st = hpFrac > 0.75 ? 0 : hpFrac > 0.5 ? 1 : hpFrac > 0.25 ? 2 : 3, fc = D.fortTheme();
  var wallC = FTH[fc].wall;
  var rnd = Z.rng(77 + G.idx), rnd0 = rnd, P = D.fieldPad(L);
  // 2.6l: стена и город — во всю ширину рамки, обрезаны по её скруглённому краю
  ctx.save(); rr(X(-P.l), Y(-P.t), (L.W + P.l + P.r) * cs, (L.H + P.t + P.b) * cs, cs * 0.7); ctx.clip();
  // крыши города за стеной, дым из труб; крайние избы под запасом рамки — отдельным генератором, остальные как в 2.6
  var extra = [[-1.25, 1], [L.W - 0.25, 1]], rx = Z.rng(177 + G.idx);
  if (part !== 'wall') for (var c2 = -2; c2 < L.W * 2 + 2; c2++) {
    var back, c;
    if (c2 < 0) { back = true; c = extra[c2 + 2][0]; rnd = rx; }
    else if (c2 >= L.W * 2) { back = false; c = c2 === L.W * 2 ? -0.8 : L.W + 0.2; rnd = rx; }
    else { back = c2 < L.W; c = back ? c2 - 0.25 : c2 - L.W + 0.2; rnd = rnd0; }
    if (Math.abs(c + 0.25 - f[0]) <= 1.3) continue;
    var hx = X(c + 0.5) + (rnd() - 0.5) * cs * 0.2, hh = cs * (back ? 0.75 + rnd() * 0.3 : 0.45 + rnd() * 0.25) * 0.42;   // 2.11.5: город лишь выглядывает из-за стены — не залезает в клетки поля (иначе камни и ёлки нижнего ряда «стоят на крышах»)
    if (back) { var wy = y - h - hh * 0.12; ctx.fillStyle = '#e9dccb'; ctx.fillRect(hx - cs * 0.3, wy, cs * 0.6, hh * 0.12 + 2); ctx.strokeStyle = OL; ctx.lineWidth = l * 0.6; ctx.strokeRect(hx - cs * 0.3, wy, cs * 0.6, hh * 0.12 + 2); var lit = Math.sin(t * 0.7 + c2 * 1.7) > -0.6; ctx.fillStyle = lit ? '#ffcf6b' : '#5a6a8a'; ctx.fillRect(hx - cs * 0.1, wy + hh * 0.1, cs * 0.2, hh * 0.18); }
    var _unused = 0, roof = ['#b8323a', '#4a8fe0', '#2f8f5b', '#8a5a35'][Math.floor(rnd() * 4)];
    var by0 = back ? y - h - hh * 0.12 + cs * 0.04 : y - h + cs * 0.05; if (back) hh *= 0.75;
    poly([hx - cs * 0.42, by0, hx, by0 - hh, hx + cs * 0.42, by0], roof, l * 0.8);
    ctx.beginPath(); ctx.moveTo(hx - cs * 0.36, by0 - cs * 0.07); ctx.lineTo(hx, by0 - hh + cs * 0.06); ctx.lineTo(hx + cs * 0.36, by0 - cs * 0.07); ctx.strokeStyle = '#fff'; ctx.lineWidth = l * 1.2; ctx.stroke();
    if (back && rnd() < 0.6) { ctx.fillStyle = '#7a5a45'; ctx.fillRect(hx + cs * 0.15, by0 - hh * 0.7, cs * 0.08, hh * 0.4); var ph = (t * 0.4 + c2 * 0.37) % 1; ctx.globalAlpha = (1 - ph) * 0.4; D.circ(hx + cs * 0.19, by0 - hh * 0.8 - ph * cs * 0.9, cs * (0.06 + ph * 0.12), '#c9d2e6'); ctx.globalAlpha = 1; }
  }
  if (part === 'town') { ctx.restore(); return; }
  // стена слева и справа от ворот
  [[X(-P.l) - 2, gx0], [gx1, X(L.W + P.r) + 2]].forEach(function (seg) {
    var x0 = seg[0], x1 = seg[1]; if (x1 - x0 < 2) return;
    var g = ctx.createLinearGradient(0, y - h, 0, y); g.addColorStop(0, wallC); g.addColorStop(1, D.shade(wallC, -35));
    ctx.fillStyle = g; ctx.fillRect(x0, y - h, x1 - x0, h + cs * 0.4); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.strokeRect(x0, y - h, x1 - x0, h + cs * 0.4);
    if (fc === 'base') { ctx.strokeStyle = 'rgba(120,150,200,0.45)'; ctx.lineWidth = l * 0.5;
      for (var row = 0; row < 2; row++) for (var bx = x0 + (row % 2) * cs * 0.25; bx < x1; bx += cs * 0.5) ctx.strokeRect(bx, y - h + row * h / 2, Math.min(cs * 0.5, x1 - bx), h / 2); }
    else fWallTex(fc, x0, y - h, x1 - x0, h, cs, l, t, 9);
    ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL;
    for (var zb = x0 + cs * 0.06; zb < x1 - cs * 0.15; zb += cs * 0.33) { if (st >= 2 && Math.floor(zb / cs) % 3 === 1) continue; fMerlon(fc, zb, y - h + cs * 0.03, cs * 0.2, cs, l * 0.8, wallC); }
    fWallTop(fc, x0, x1, y - h, cs, l, t);
    // гирлянда: от края до края, провисает между сторожевыми башнями (и уходит за башню ворот)
    var anc = [x0]; for (var tc0 = 1; tc0 < L.W - 1; tc0 += 3) { if (Math.abs(tc0 - f[0]) <= 2) continue; var tcx = X(tc0 + 0.5); if (tcx > x0 && tcx < x1) anc.push(tcx - cs * 0.25, tcx + cs * 0.25); } anc.push(x1);
    for (var ai = 0; ai + 1 < anc.length; ai += 2) D.festoon(anc[ai], anc[ai + 1], y - cs * 0.5, cs, l, t, ai * 3 + Math.round(x0), st >= 3);
  });
  // сторожевые башни по стене
  for (var tc = 1; tc < L.W - 1; tc += 3) {
    if (Math.abs(tc - f[0]) <= 2) continue;
    var tx = X(tc + 0.5), bw = cs * 0.5, bh = h * 1.7, broken = st >= 3 && tc % 2;
    var tg = ctx.createLinearGradient(tx - bw / 2, 0, tx + bw / 2, 0); tg.addColorStop(0, wallC); tg.addColorStop(1, D.shade(wallC, -40));
    rr(tx - bw / 2, y - bh * (broken ? 0.7 : 1), bw, bh * (broken ? 0.7 : 1), cs * 0.05); ctx.fillStyle = tg; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    if (broken) { D.fire(tx, y - bh * 0.7, cs * 0.3, t + tc); continue; }
    if (fc !== 'base') fWallTex(fc, tx - bw / 2, y - bh, bw, bh, cs, l, t, tc);
    if (fc === 'base') {
      poly([tx - bw * 0.62, y - bh, tx, y - bh - cs * 0.5, tx + bw * 0.62, y - bh], '#4a8fe0', l);
      ctx.strokeStyle = OL; ctx.lineWidth = l * 0.7; ctx.beginPath(); ctx.moveTo(tx, y - bh - cs * 0.5); ctx.lineTo(tx, y - bh - cs * 0.8); ctx.stroke();
      poly([tx, y - bh - cs * 0.8, tx + cs * 0.26, y - bh - cs * 0.72 + Math.sin(t * 5 + tc) * cs * 0.03, tx, y - bh - cs * 0.64], COL.red, l * 0.6);
    } else fRoof(fc, tx, y - bh, bw, cs * 0.8, l, t, tc);
    rr(tx - cs * 0.07, y - bh * 0.7, cs * 0.14, cs * 0.2, 3); ctx.fillStyle = fc === 'night' ? '#c9b8ff' : fc === 'ice' ? '#ffffff' : '#ffcf6b'; ctx.fill();
  }
  // 2.11.4: сугроб вдоль подножия стены — стена и ворота стоят в снегу, а не висят над рамкой
  var sx0 = X(-P.l - 1), sx1 = X(L.W + P.r + 1), sy = y - cs * 0.15, sb = Y(L.H + P.b) + cs;
  var sg = ctx.createLinearGradient(0, sy, 0, sy + cs * 0.3); sg.addColorStop(0, '#f4f8ff'); sg.addColorStop(1, '#dbe6fa');
  ctx.beginPath(); ctx.moveTo(sx0, sb); ctx.lineTo(sx0, sy);
  var ox0 = X(0);   // волна привязана к полю, а не к экрану — при сдвиге и приближении камеры не «ползёт»
  for (var sxx = sx0; sxx <= sx1; sxx += cs * 0.25) ctx.lineTo(sxx, sy + Math.sin((sxx - ox0) / cs * 2.3) * cs * 0.035 + Math.sin((sxx - ox0) / cs * 0.9 + 1) * cs * 0.03);
  ctx.lineTo(sx1, sb); ctx.closePath(); ctx.fillStyle = sg; ctx.fill();
  ctx.beginPath(); for (var sx2 = sx0; sx2 <= sx1; sx2 += cs * 0.25) { var yy2 = sy + Math.sin((sx2 - ox0) / cs * 2.3) * cs * 0.035 + Math.sin((sx2 - ox0) / cs * 0.9 + 1) * cs * 0.03; if (sx2 === sx0) ctx.moveTo(sx2, yy2); else ctx.lineTo(sx2, yy2); }
  ctx.lineWidth = l * 0.8; ctx.strokeStyle = 'rgba(120,145,200,0.7)'; ctx.stroke();
  ctx.restore();
};

// ---------- 2.11.5: облик крепости — отдельные модели (а не только цвет) ----------
// base — снежная крепость; ice — Ледяной дворец; candy — Пряничный домик; gold — Царский терем; night — Звёздный замок
var FTH = {
  base: { wall: '#dcecff', roof: '#4a8fe0', line: 'rgba(120,150,200,0.45)' },
  ice: { wall: '#c9f0ff', roof: '#7fd8ff', line: 'rgba(255,255,255,0.75)' },
  candy: { wall: '#c98a4e', roof: '#ff6f91', line: 'rgba(120,70,30,0.35)' },
  gold: { wall: '#d9a066', roof: '#ffd54a', line: 'rgba(110,60,25,0.45)' },
  night: { wall: '#2e3a82', roof: '#3d2f8f', line: 'rgba(140,160,255,0.35)' }
};
D.fortTheme = function () { var fc = Z.save && Z.save.cos ? Z.save.cos.fort : 'base'; return FTH[fc] ? fc : 'base'; };
// крыша башни по облику: шпиль-кристалл, сливочный купол с вишенкой, луковка, остроконечная со звездой и месяцем
function fRoof(th, bx, top, bw, cs, l, t, s) {
  if (th === 'ice') {
    poly([bx - bw * 0.5, top, bx - bw * 0.18, top - cs * 0.95, bx, top - cs * 1.15, bx + bw * 0.18, top - cs * 0.95, bx + bw * 0.5, top], '#bfefff', l);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = l * 0.6; ctx.beginPath(); ctx.moveTo(bx - bw * 0.1, top - cs * 0.1); ctx.lineTo(bx - bw * 0.02, top - cs * 0.95); ctx.stroke();
    var k = 0.5 + 0.5 * Math.sin(t * 3 + s); ctx.globalAlpha = 0.4 + 0.5 * k; D.star(bx, top - cs * 1.2, cs * 0.09, '#ffffff', 0); ctx.globalAlpha = 1; return top - cs * 1.15;
  }
  if (th === 'candy') {
    ctx.beginPath(); ctx.moveTo(bx - bw * 0.62, top); ctx.bezierCurveTo(bx - bw * 0.62, top - cs * 0.55, bx + bw * 0.62, top - cs * 0.55, bx + bw * 0.62, top); ctx.closePath(); ctx.fillStyle = '#fff6f0'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    for (var d = -2; d <= 2; d++) { var dx = bx + d * bw * 0.25; ctx.beginPath(); ctx.moveTo(dx - bw * 0.08, top); ctx.quadraticCurveTo(dx, top + cs * (0.12 + (d & 1) * 0.06), dx + bw * 0.08, top); ctx.fillStyle = '#fff6f0'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.stroke(); }
    circ(bx, top - cs * 0.47, cs * 0.1, '#e8343c', l * 0.7); circ(bx - cs * 0.03, top - cs * 0.5, cs * 0.03, '#fff');
    ctx.strokeStyle = '#2f7a3f'; ctx.lineWidth = l * 0.7; ctx.beginPath(); ctx.moveTo(bx, top - cs * 0.56); ctx.quadraticCurveTo(bx + cs * 0.08, top - cs * 0.72, bx + cs * 0.16, top - cs * 0.7); ctx.stroke(); return top - cs * 0.6;
  }
  if (th === 'gold') {
    ctx.beginPath(); ctx.moveTo(bx - bw * 0.42, top); ctx.bezierCurveTo(bx - bw * 0.95, top - cs * 0.45, bx - bw * 0.1, top - cs * 0.6, bx, top - cs * 0.95); ctx.bezierCurveTo(bx + bw * 0.1, top - cs * 0.6, bx + bw * 0.95, top - cs * 0.45, bx + bw * 0.42, top); ctx.closePath();
    var g = ctx.createLinearGradient(bx - bw * 0.6, 0, bx + bw * 0.6, 0); g.addColorStop(0, '#fff1a8'); g.addColorStop(0.5, '#ffd54a'); g.addColorStop(1, '#c98a1c'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = l * 0.6; ctx.beginPath(); ctx.moveTo(bx - bw * 0.25, top - cs * 0.1); ctx.quadraticCurveTo(bx - bw * 0.35, top - cs * 0.4, bx - bw * 0.05, top - cs * 0.75); ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = l * 0.8; ctx.beginPath(); ctx.moveTo(bx, top - cs * 0.95); ctx.lineTo(bx, top - cs * 1.2); ctx.stroke(); D.star(bx, top - cs * 1.24, cs * 0.08, COL.gold, 1); return top - cs * 1.2;
  }
  if (th === 'night') {
    poly([bx - bw * 0.62, top, bx, top - cs * 0.8, bx + bw * 0.62, top], '#3d2f8f', l);
    ctx.globalAlpha = 0.8; for (var q = 0; q < 3; q++) { var kk = 0.5 + 0.5 * Math.sin(t * 3 + q * 2 + s); ctx.globalAlpha = 0.3 + 0.6 * kk; circ(bx + (q - 1) * bw * 0.18, top - cs * (0.18 + (q % 2) * 0.22), cs * 0.025, '#fff3b0'); } ctx.globalAlpha = 1;
    var mx = bx, my = top - cs * 0.95, mr = cs * 0.13; ctx.globalAlpha = 0.35; circ(mx, my, mr * 2, '#fff3b0'); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(mx, my, mr, 0.35 * Math.PI, 1.65 * Math.PI); ctx.arc(mx + mr * 0.45, my - mr * 0.1, mr * 0.8, 1.55 * Math.PI, 0.45 * Math.PI, true); ctx.closePath(); ctx.fillStyle = '#ffe680'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke(); return top - cs * 1.05;
  }
  poly([bx - bw * 0.62, top, bx, top - cs * 0.6, bx + bw * 0.62, top], '#4a8fe0', l); return top - cs * 0.6;
}
// кладка стены по облику
function fWallTex(th, x0, y0, w, h, cs, l, t, seed) {
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  if (th === 'ice') { ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = l * 0.5; for (var i = -2; i < w / (cs * 0.4) + 2; i++) { var xx = x0 + i * cs * 0.4; ctx.beginPath(); ctx.moveTo(xx, y0 + h); ctx.lineTo(xx + cs * 0.3, y0); ctx.moveTo(xx + cs * 0.15, y0 + h); ctx.lineTo(xx - cs * 0.1, y0 + h * 0.4); ctx.stroke(); }
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, y0, w, h * 0.18); ctx.globalAlpha = 1; }
  else if (th === 'candy') { ctx.fillStyle = 'rgba(255,255,255,0.0)'; for (var j = 0; j < w / (cs * 0.32); j++) { var dx = x0 + j * cs * 0.32 + cs * 0.16, dy = y0 + h * (0.45 + ((j * 7 + seed) % 3) * 0.12); circ(dx, dy, cs * 0.045, ['#ff5a5f', '#4cc77d', '#ffd54a', '#5ac8ff'][(j + seed) % 4], l * 0.4); } }
  else if (th === 'gold') { ctx.strokeStyle = 'rgba(110,60,25,0.5)'; ctx.lineWidth = l * 0.6; for (var r = 1; r < 5; r++) { var yy = y0 + h * r / 5; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + w, yy); ctx.stroke(); }
    for (var e = 0; e < w / (cs * 0.5); e++) { circ(x0 + e * cs * 0.5 + cs * 0.1, y0 + h * 0.1, cs * 0.035, 'rgba(110,60,25,0.55)'); } }
  else if (th === 'night') { for (var n = 0; n < w * h / (cs * cs) * 3; n++) { var sx = x0 + ((n * 97.13 + seed * 13) % 1) * w, sy = y0 + ((n * 53.71 + seed * 7) % 1) * h; sx = x0 + ((n * 37 + seed * 11) % 100) / 100 * w; sy = y0 + ((n * 61 + seed * 5) % 100) / 100 * h; var kk = 0.5 + 0.5 * Math.sin(t * 2 + n); ctx.globalAlpha = 0.3 + 0.6 * kk; circ(sx, sy, cs * 0.02, '#fff3b0'); } ctx.globalAlpha = 1; }
  ctx.restore();
}
// верх стены: сосульки, глазурь с потёками, резной подзор
function fWallTop(th, x0, x1, y, cs, l, t) {
  if (th === 'ice') { for (var x = x0 + cs * 0.12; x < x1 - cs * 0.05; x += cs * 0.24) { var len = cs * (0.1 + ((x / cs * 7) % 3) * 0.05); poly([x - cs * 0.05, y, x, y + len, x + cs * 0.05, y], 'rgba(220,246,255,0.95)', l * 0.5); } }
  else if (th === 'candy') { ctx.beginPath(); ctx.moveTo(x0, y - cs * 0.02); for (var x2 = x0; x2 <= x1; x2 += cs * 0.2) { var dr = ((x2 / cs * 13) % 5) < 1 ? cs * 0.16 : cs * 0.05; ctx.quadraticCurveTo(x2 + cs * 0.1, y + dr, x2 + cs * 0.2, y + cs * 0.02); } ctx.lineTo(x1, y - cs * 0.06); ctx.lineTo(x0, y - cs * 0.06); ctx.closePath(); ctx.fillStyle = '#fffaf2'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke(); }
  else if (th === 'gold') { ctx.beginPath(); for (var x3 = x0; x3 < x1; x3 += cs * 0.2) { ctx.moveTo(x3, y); ctx.lineTo(x3 + cs * 0.1, y + cs * 0.1); ctx.lineTo(x3 + cs * 0.2, y); } ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = l * 0.9; ctx.stroke(); ctx.fillStyle = '#c9302c'; ctx.fillRect(x0, y - cs * 0.04, x1 - x0, cs * 0.05); }
}
// зубцы по облику
function fMerlon(th, bx, y, w, cs, l, wallC) {
  if (th === 'ice') { poly([bx, y, bx + w * 0.5, y - cs * 0.3, bx + w, y], '#e6f9ff', l * 0.8); return; }
  if (th === 'candy') { ctx.beginPath(); ctx.arc(bx + w / 2, y, w * 0.55, Math.PI, 0); ctx.closePath(); ctx.fillStyle = ['#ff5a5f', '#4cc77d', '#ffd54a', '#b47cff'][Math.round(bx / (w + 1)) & 3]; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke(); return; }
  if (th === 'gold') { ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx, y - cs * 0.08); ctx.arc(bx + w / 2, y - cs * 0.08, w / 2, Math.PI, 0); ctx.lineTo(bx + w, y); ctx.closePath(); ctx.fillStyle = '#ffd54a'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke(); circ(bx + w / 2, y - cs * 0.1, w * 0.15, '#c9302c'); return; }
  rr(bx, y - cs * 0.16, w, cs * 0.2, 2); ctx.fillStyle = wallC; ctx.fill(); ctx.stroke();
}
// ворота по облику
function fGate(th, x, y, h, cs, l) {
  ctx.beginPath(); ctx.moveTo(x - cs * 0.3, y); ctx.lineTo(x - cs * 0.3, y - h * 0.55); ctx.arc(x, y - h * 0.55, cs * 0.3, Math.PI, 0); ctx.lineTo(x + cs * 0.3, y); ctx.closePath();
  ctx.fillStyle = th === 'ice' ? '#7fbfe6' : th === 'candy' ? '#5a3418' : th === 'gold' ? '#c9302c' : th === 'night' ? '#1b1f4a' : COL.woodD; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  ctx.save(); ctx.clip();
  if (th === 'candy') { ctx.strokeStyle = '#3a200c'; ctx.lineWidth = l * 0.7; for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * cs * 0.15, y); ctx.lineTo(x + i * cs * 0.15, y - h); ctx.stroke(); } for (var j = 1; j < 4; j++) { ctx.beginPath(); ctx.moveTo(x - cs * 0.3, y - j * h * 0.22); ctx.lineTo(x + cs * 0.3, y - j * h * 0.22); ctx.stroke(); } }
  else if (th === 'gold') { ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = l * 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke(); D.star(x, y - h * 0.62, cs * 0.08, COL.gold, 1); }
  else if (th === 'ice') { ctx.globalAlpha = 0.6; ctx.strokeStyle = '#fff'; ctx.lineWidth = l * 0.6; ctx.beginPath(); ctx.moveTo(x - cs * 0.2, y); ctx.lineTo(x + cs * 0.1, y - h * 0.8); ctx.stroke(); ctx.globalAlpha = 1; }
  else if (th === 'night') { var k = 0.6 + 0.4 * Math.sin(Z.time * 2); ctx.globalAlpha = 0.5 * k; circ(x, y - h * 0.5, cs * 0.25, '#b9a6ff'); ctx.globalAlpha = 1; }
  ctx.restore();
}
// ---------- крепость с ёлкой ----------
D.fortress = function (x, y, cs, hpFrac, hit, t) {
  var AF = ctx.globalAlpha;   // 2.12: прозрачность снаружи сохраняется
  var l = Math.max(1.5, cs * 0.05), w = cs * 2.3, h = cs * 0.95;
  x += hit > 0 && !Z._fortPart ? Math.sin(hit * 60) * cs * 0.06 : 0;
  var st = hpFrac > 0.75 ? 0 : hpFrac > 0.5 ? 1 : hpFrac > 0.25 ? 2 : 3;
  var FP = Z._fortPart || '';   // 2.11.9: '' — всё; 'tree' — тень и ёлка; 'front' — всё, что перед ёлкой
  if (FP !== 'front' && Z._treeLayer !== 'live') ell(x, y + cs * 0.05, w * 0.6, cs * 0.18, 'rgba(30,40,80,0.2)');
  // большая светящаяся ёлка во дворе — главное, что мы защищаем, — и гора подарков под ней
  h = cs * 0.62;
  var GT = Z.G; if (GT) { if (GT._tph === 'wave' && GT.phase !== 'wave') GT._tcel = t; GT._tph = GT.phase; }   // 2.11.5: ёлка празднует конец волны и победу, вздрагивает от ударов
  if (FP !== 'front') D.bigTree(x, y - h * 0.95, cs * 2.6, t, { layer: FP ? Z._treeLayer : null, deco: true, dim: hpFrac < 0.3, lost: hpFrac > 0.75 ? 0 : hpFrac > 0.5 ? 1 : hpFrac > 0.25 ? 2 : 4, hit: hit, ev: GT, cel: GT && GT._tcel != null ? t - GT._tcel : null, win: GT && GT.phase === 'won' });
  if (FP === 'tree') return;
  D.giftPile(x, y - h * 0.82, cs * 1.5, t, st === 0 ? 0 : st === 1 ? 2 : st === 2 ? 4 : 6);
  // стены
  var fc = D.fortTheme(), FT = FTH[fc];
  var wallC = FT.wall;
  if (hpFrac <= 0.3) wallC = D.shade(wallC, -30);
  var wg = ctx.createLinearGradient(0, y - h, 0, y); wg.addColorStop(0, fc === 'ice' ? '#effcff' : wallC); wg.addColorStop(1, D.shade(wallC, fc === 'night' ? -15 : -25));
  rr(x - w / 2, y - h, w, h, cs * 0.08); ctx.fillStyle = wg; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  // зубцы: с повреждениями часть выбита
  ctx.lineWidth = l; ctx.strokeStyle = OL;
  for (var b = 0; b < 7; b++) { if (st >= 1 && (b === 2 || (st >= 2 && b === 5) || (st >= 3 && b === 0))) continue; var bx = x - w / 2 + b * w / 6.6; fMerlon(fc, bx, y - h + cs * 0.04, w / 11, cs, l, wallC); }
  if (st >= 2) { poly([x - w * 0.12, y - h, x - w * 0.02, y - h * 0.7, x + w * 0.08, y - h * 0.82, x + w * 0.14, y - h], '#9fb3d6', l * 0.8); }
  if (fc === 'base') { for (var row = 0; row < 3; row++) for (var col = 0; col < 6; col++) { ctx.strokeStyle = FT.line; ctx.lineWidth = l * 0.5; ctx.strokeRect(x - w / 2 + col * w / 6 + (row % 2) * w / 12, y - h + row * h / 3, w / 6, h / 3); } }
  else fWallTex(fc, x - w / 2, y - h, w, h, cs, l, t, 3);
  fWallTop(fc, x - w / 2 + cs * 0.05, x + w / 2 - cs * 0.05, y - h, cs, l, t);
  // ворота
  fGate(fc, x, y, h, cs, l);
  // башни
  [-1, 1].forEach(function (s) {
    var bx = x + s * w * 0.5, bw = cs * 0.55, bh = h * 2.1;
    var broken = (s === -1 && st >= 2) || (s === 1 && st >= 3);
    if (broken) bh *= 0.72;
    var tg2 = ctx.createLinearGradient(bx - bw / 2, 0, bx + bw / 2, 0); tg2.addColorStop(0, fc === 'ice' ? '#effcff' : wallC); tg2.addColorStop(1, D.shade(wallC, -30));
    rr(bx - bw / 2, y - bh, bw, bh, cs * 0.06); ctx.fillStyle = tg2; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    if (broken) { poly([bx - bw / 2, y - bh, bx - bw * 0.2, y - bh - cs * 0.12, bx + bw * 0.1, y - bh - cs * 0.02, bx + bw / 2, y - bh - cs * 0.15, bx + bw / 2, y - bh], wallC, l); D.fire(bx, y - bh - cs * 0.05, cs * 0.35, t + s); return; }
    if (fc === 'candy') { ctx.save(); rr(bx - bw / 2, y - bh, bw, bh, cs * 0.06); ctx.clip(); ctx.fillStyle = '#fff6f0'; ctx.fillRect(bx - bw / 2, y - bh, bw, bh); ctx.strokeStyle = '#e8343c'; ctx.lineWidth = bw * 0.22; for (var cst = -2; cst < 9; cst++) { ctx.beginPath(); ctx.moveTo(bx - bw, y - bh + cst * bw * 0.6); ctx.lineTo(bx + bw, y - bh + cst * bw * 0.6 - bw * 0.9); ctx.stroke(); } ctx.restore(); rr(bx - bw / 2, y - bh, bw, bh, cs * 0.06); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); }
    else if (fc !== 'base') fWallTex(fc, bx - bw / 2, y - bh, bw, bh, cs, l, t, s + 5);
    if (fc === 'ice') fWallTop('ice', bx - bw / 2, bx + bw / 2, y - bh, cs, l, t);
    var rTop = fRoof(fc, bx, y - bh, bw, cs, l, t, s);
    if (fc === 'base') {
      ctx.strokeStyle = OL; ctx.lineWidth = l * 0.8; ctx.beginPath(); ctx.moveTo(bx, y - bh - cs * 0.6); ctx.lineTo(bx, y - bh - cs * 0.95); ctx.stroke();
      var fw = Math.sin(t * 5 + s) * cs * 0.04;
      poly([bx, y - bh - cs * 0.95, bx + cs * 0.32, y - bh - cs * 0.86 + fw, bx, y - bh - cs * 0.76], COL.red, l * 0.7);
    }
    rr(bx - cs * 0.08, y - bh * 0.7, cs * 0.16, cs * 0.24, 3); ctx.fillStyle = fc === 'night' ? '#c9b8ff' : fc === 'ice' ? '#ffffff' : '#ffcf6b'; ctx.fill();
  });
  // трещины
  if (hpFrac < 0.6) { ctx.strokeStyle = OL; ctx.lineWidth = l * 0.8; ctx.beginPath(); ctx.moveTo(x - w * 0.3, y - h); ctx.lineTo(x - w * 0.25, y - h * 0.6); ctx.lineTo(x - w * 0.33, y - h * 0.35); ctx.stroke(); }
  if (hpFrac < 0.3) { ctx.beginPath(); ctx.moveTo(x + w * 0.2, y - h); ctx.lineTo(x + w * 0.27, y - h * 0.55); ctx.lineTo(x + w * 0.18, y - h * 0.2); ctx.stroke(); }
  // гирлянда по стене двора — между башнями, двумя фестонами над воротами
  var gx0f = x - w / 2 + cs * 0.28, gx1f = x + w / 2 - cs * 0.28; D.festoon(gx0f, x, y - cs * 0.48, cs, l, t, 1, st >= 3); D.festoon(x, gx1f, y - cs * 0.48, cs, l, t, 3, st >= 3);
  // фонари у ворот и стража-снеговики
  [-1, 1].forEach(function (s) {
    var fx = x + s * cs * 0.48;
    ctx.strokeStyle = OL; ctx.lineWidth = l * 0.8; ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx, y - cs * 0.55); ctx.stroke();
    var fl = 0.7 + 0.3 * Math.sin(t * 7 + s); ctx.globalAlpha = AF * (0.3 * fl); D.circ(fx, y - cs * 0.6, cs * 0.2, '#ffd56b'); ctx.globalAlpha = AF;
    rr(fx - cs * 0.06, y - cs * 0.68, cs * 0.12, cs * 0.14, cs * 0.03); ctx.fillStyle = '#ffd56b'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke();
    if (st < 3 && D.fortGuard && D.fortTheme() !== 'base') { D.fortGuard(x + s * w * 0.72, y + cs * 0.05, cs * 0.12, -s, t, D.fortTheme()); }   // 2.11.5: стража — под облик крепости
    else if (st < 3) { D.snowman(x + s * w * 0.72, y + cs * 0.05, cs * 0.12, { face: -s, scarf: COL.red, hat: '#4a8fe0' }); ctx.strokeStyle = COL.woodD; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(x + s * w * 0.72 + s * cs * 0.12, y); ctx.lineTo(x + s * w * 0.72 + s * cs * 0.14, y - cs * 0.55); ctx.stroke(); D.poly([x + s * w * 0.72 + s * cs * 0.1, y - cs * 0.55, x + s * w * 0.72 + s * cs * 0.14, y - cs * 0.68, x + s * w * 0.72 + s * cs * 0.18, y - cs * 0.55], '#dfe7f7', l * 0.6); }
  });
  if (st >= 1) for (var sm = 0; sm < st + 1; sm++) { var ph = (t * 0.5 + sm / (st + 1)) % 1, sx = x + (sm - st / 2) * w * 0.25; ctx.globalAlpha = AF * ((1 - ph) * 0.45); circ(sx + Math.sin(t + sm) * cs * 0.15, y - h - cs * 0.3 - ph * cs * 1.6, cs * (0.15 + ph * 0.35), st >= 3 ? '#4a4a5a' : '#9aa1b5'); ctx.globalAlpha = AF; }
  if (st >= 3) D.fire(x - w * 0.3, y - h * 0.6, cs * 0.4, t * 1.3);
};
// пламя
D.fire = function (x, y, s, t) {
  for (var i = 0; i < 3; i++) {
    var f = 0.75 + 0.25 * Math.sin(t * 14 + i * 2), ox = (i - 1) * s * 0.3;
    ctx.globalAlpha = 0.85; poly([x + ox - s * 0.2, y, x + ox + Math.sin(t * 9 + i) * s * 0.1, y - s * f, x + ox + s * 0.2, y], i === 1 ? '#ff8a3d' : '#ffb347');
    poly([x + ox - s * 0.09, y, x + ox, y - s * f * 0.55, x + ox + s * 0.09, y], '#fff3b0');
  }
  ctx.globalAlpha = 1;
};
D.entrance = function (x, y, cs, t, warn) {
  var l = Math.max(1.5, cs * 0.05);
  ell(x, y, cs * 0.46, cs * 0.36, '#2a2f55', l);
  ell(x, y + cs * 0.05, cs * 0.34, cs * 0.24, '#151a35');
  var g = 0.5 + 0.5 * Math.sin(t * 3);
  circ(x - cs * 0.12, y, cs * 0.05, 'rgba(255,90,90,' + (0.4 + g * 0.6).toFixed(2) + ')'); circ(x + cs * 0.12, y, cs * 0.05, 'rgba(255,90,90,' + (0.4 + g * 0.6).toFixed(2) + ')');
  if (warn) {
    var a = 0.5 + 0.5 * Math.sin(t * 8);
    ctx.globalAlpha = a; circ(x, y, cs * 0.75, null); ctx.strokeStyle = '#ff5a5f'; ctx.lineWidth = cs * 0.08; ctx.stroke(); ctx.globalAlpha = 1;
  }
};

// ---------- вышки ----------
D.tower = function (tw, x, y, cs, t) {
  var l = Math.max(1.2, cs * 0.045), T = tw.type, lv = tw.lvl, rec = tw.recoil / 0.12, pop = tw.pop || 0;
  var trim = lv >= 5 ? COL.gold : lv >= 3 ? '#dfe7f7' : COL.wood;   // 2.11.5: старая «отделка вышек» за звёзды заменена обликами вышек
  ctx.save(); ctx.translate(x, y); var sc = 1 + pop * 0.6; ctx.scale(sc, sc);
  if (lv >= 5) { ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 4); circ(0, -cs * 0.25, cs * 0.55, '#fff3b0'); ctx.globalAlpha = 1; }
  var a = tw.ang, hk = D.twHook || function () { };   // 2.11.5: точки модели для украшений облика
  if (T === 'snow') {
    rr(-cs * 0.28, -cs * 0.16, cs * 0.56, cs * 0.2, cs * 0.05); ctx.fillStyle = COL.wood; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.fillStyle = trim; ctx.fillRect(-cs * 0.28, -cs * 0.18, cs * 0.56, cs * 0.06);
    hk('base', { x0: -0.28, y0: -0.18, x1: 0.28, y1: 0.04 });
    // кучка снежков
    circ(cs * 0.2, -cs * 0.2, cs * 0.06, '#fff', l * 0.6); circ(cs * 0.27, -cs * 0.17, cs * 0.05, '#fff', l * 0.6);
    D.snowman(-cs * 0.02, -cs * 0.16 + rec * cs * 0.04, cs * 0.17, { face: Math.cos(a) >= 0 ? 1 : -1, scarf: lv >= 2 ? COL.red : null, hat: lv >= 4 ? '#4a8fe0' : lv >= 3 ? COL.wood : null });
    hk('body', { x0: -0.18, y0: -0.46 + rec * 0.04, x1: 0.14, y1: -0.15 + rec * 0.04 }); hk('top', { x: -0.02, y: (lv >= 3 ? -0.78 : -0.75) + rec * 0.04 });
    if (rec > 0) circ(Math.cos(a) * cs * 0.3, -cs * 0.62 + Math.sin(a) * cs * 0.2, cs * 0.07, '#fff', l * 0.6);
  } else if (T === 'mg') {
    var A0mg = ctx.globalAlpha;
    ctx.strokeStyle = OL; ctx.lineWidth = l * 1.4; ctx.beginPath(); ctx.moveTo(-cs * 0.25, cs * 0.02); ctx.lineTo(0, -cs * 0.22); ctx.lineTo(cs * 0.25, cs * 0.02); ctx.stroke();
    hk('base', { legs: 1, x0: -0.25, y0: -0.22, x1: 0.25, y1: 0.02 });
    ctx.save(); ctx.translate(0, -cs * 0.3); ctx.rotate(a);
    // 2.12.13: блок стволов вращается как у настоящего многоствольного: дальние стволы темнее и рисуются первыми, ближние — светлее и поверх;
    // корни стволов уходят под корпус (раньше палочки лежали поверх корпуса и перекрывали друг друга как попало), на дульной накладке
    // крутятся отверстия стволов — видно, что вращается весь блок
    var nb = 3 + Math.min(3, lv - 1), BR = [], sp0 = tw.spin || 0, bx0 = cs * 0.04 - rec * cs * 0.04;
    for (var b = 0; b < nb; b++) { var ba = sp0 + b * Math.PI * 2 / nb; BR.push({ off: Math.sin(ba) * cs * 0.075, dep: Math.cos(ba) }); }
    BR.sort(function (p, q) { return p.dep - q.dep; });
    ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL;
    for (var b2 = 0; b2 < nb; b2++) {
      var B = BR[b2], k = (B.dep + 1) / 2, cv = Math.round(118 + k * 92), cg = Math.round(132 + k * 86), cb = Math.round(165 + k * 70);
      rr(bx0, B.off - cs * 0.026, cs * 0.38, cs * 0.052, cs * 0.022); ctx.fillStyle = 'rgb(' + cv + ',' + cg + ',' + cb + ')'; ctx.fill(); ctx.stroke();
    }
    rr(-cs * 0.16, -cs * 0.14, cs * 0.3, cs * 0.28, cs * 0.06); ctx.fillStyle = '#6f7d9c'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    rr(cs * 0.4, -cs * 0.11, cs * 0.06, cs * 0.22, 2); ctx.fillStyle = trim; ctx.fill(); ctx.stroke();
    for (var b3 = 0; b3 < nb; b3++) { var B3 = BR[b3]; if (B3.dep < -0.2) continue; ctx.globalAlpha = A0mg * (0.45 + 0.55 * (B3.dep + 1) / 2); circ(cs * 0.43, B3.off, cs * 0.017, '#2a3150'); }
    ctx.globalAlpha = A0mg;
    hk('turret', { x0: -0.16, x1: 0.14, h: 0.14, a: a, pv: 0.06 });   // 2.11.5: украшения — на корпусе; стволы вращаются, между ними пусто (бриллиант «висел» между стволами)
    if (tw.firing && Math.sin(t * 60) > 0) { circ(cs * 0.52, 0, cs * 0.08, '#fff6c2'); }
    ctx.restore();
    circ(0, -cs * 0.3, cs * 0.06, trim, l * 0.6);
  } else if (T === 'ice') {
    poly([-cs * 0.32, cs * 0.02, -cs * 0.22, -cs * 0.25, cs * 0.22, -cs * 0.25, cs * 0.32, cs * 0.02], '#cdeaff', l);
    for (var cr = 0; cr < 3; cr++) poly([-cs * 0.2 + cr * cs * 0.2, -cs * 0.22, -cs * 0.14 + cr * cs * 0.2, -cs * 0.42, -cs * 0.08 + cr * cs * 0.2, -cs * 0.22], COL.ice, l * 0.6);
    hk('base', { x0: -0.3, y0: -0.25, x1: 0.3, y1: 0.02 });
    ctx.save(); ctx.translate(0, -cs * 0.3); ctx.rotate(a);
    rr(-cs * 0.05 - rec * cs * 0.06, -cs * 0.11, cs * 0.5, cs * 0.22, cs * 0.08); ctx.fillStyle = '#5ab4e6'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    rr(cs * 0.36 - rec * cs * 0.06, -cs * 0.14, cs * 0.1, cs * 0.28, cs * 0.04); ctx.fillStyle = trim; ctx.fill(); ctx.stroke();
    hk('turret', { x0: 0.1 - rec * 0.06, x1: 0.44 - rec * 0.06, h: 0.11, a: a });
    ctx.restore();
    circ(0, -cs * 0.3, cs * 0.14, '#7fd8ff', l);
  } else if (T === 'mortar') {
    rr(-cs * 0.3, -cs * 0.2, cs * 0.6, cs * 0.24, cs * 0.06); ctx.fillStyle = COL.woodD; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    hk('base', { x0: -0.3, y0: -0.2, x1: 0.3, y1: 0.04 });
    var mx = Math.cos(a) * cs * 0.06;
    ctx.save(); ctx.translate(mx, -cs * 0.2 + rec * cs * 0.05);
    poly([-cs * 0.22, 0, -cs * 0.17, -cs * 0.42, cs * 0.17, -cs * 0.42, cs * 0.22, 0], COL.red, l);
    ell(0, -cs * 0.42, cs * 0.18, cs * 0.07, '#5a1a1f', l * 0.8);
    hk('body', { x0: -0.2, y0: -0.4, x1: 0.2, y1: -0.02, taper: 0.4 });
    D.star(0, -cs * 0.2, cs * 0.08, trim === COL.wood ? COL.gold : trim, l * 0.5);
    ctx.restore();
  } else if (T === 'tesla') {
    poly([-cs * 0.22, cs * 0.02, -cs * 0.1, -cs * 0.62, cs * 0.1, -cs * 0.62, cs * 0.22, cs * 0.02], '#3d4a7a', l);
    hk('body', { x0: -0.19, y0: -0.6, x1: 0.19, y1: 0, taper: 1 });
    var cols = ['#ff5a5f', '#ffd54a', '#5ac8ff', '#9dff6a', '#ff8fd6'];
    for (var g = 0; g < 4 + lv; g++) {
      var gy = -cs * 0.08 - g * cs * 0.52 / (4 + lv), gx = Math.sin(g * 1.7) * cs * 0.13;
      var on = Math.sin(t * 6 + g * 1.3) > -0.2;
      if (on) { ctx.globalAlpha = 0.35; circ(gx, gy, cs * 0.07, cols[g % 5]); ctx.globalAlpha = 1; }
      circ(gx, gy, cs * 0.035, on ? cols[g % 5] : '#556', l * 0.4);
    }
    var glow = 0.6 + 0.4 * Math.sin(t * 9) + rec * 0.8;
    ctx.globalAlpha = Math.min(1, 0.3 * glow); circ(0, -cs * 0.72, cs * 0.22, '#fff3b0'); ctx.globalAlpha = 1;
    circ(0, -cs * 0.72, cs * 0.12, '#ffe066', l * 0.8);
    rr(-cs * 0.12, -cs * 0.62, cs * 0.24, cs * 0.06, 2); ctx.fillStyle = trim; ctx.fill(); ctx.stroke();
    hk('top', { x: 0, y: -0.84 });
  } else if (T === 'ballista') {
    rr(-cs * 0.08, -cs * 0.3, cs * 0.16, cs * 0.32, 2); ctx.fillStyle = COL.woodD; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    hk('base', { x0: -0.08, y0: -0.26, x1: 0.08, y1: 0.02 });
    ctx.save(); ctx.translate(0, -cs * 0.32); ctx.rotate(a);
    rr(-cs * 0.25, -cs * 0.05, cs * 0.6, cs * 0.1, cs * 0.03); ctx.fillStyle = COL.wood; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cs * 0.15, -cs * 0.36); ctx.quadraticCurveTo(cs * 0.32, 0, cs * 0.15, cs * 0.36); ctx.strokeStyle = OL; ctx.lineWidth = l * 2.2; ctx.stroke();
    ctx.strokeStyle = trim === COL.wood ? COL.woodD : trim; ctx.lineWidth = l * 1.1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cs * 0.15, -cs * 0.36); ctx.lineTo(-cs * 0.12 + rec * cs * 0.1, 0); ctx.lineTo(cs * 0.15, cs * 0.36); ctx.strokeStyle = '#eee'; ctx.lineWidth = l * 0.5; ctx.stroke();
    if (rec <= 0.2) poly([-cs * 0.12, -cs * 0.025, cs * 0.42, -cs * 0.025, cs * 0.52, 0, cs * 0.42, cs * 0.025, -cs * 0.12, cs * 0.025], COL.ice, l * 0.5);
    hk('turret', { x0: -0.25, x1: 0.35, h: 0.05, a: a });
    ctx.restore();
  }
  ctx.restore();
  // уровень
  if (tw.branch) {
    var ex = x + cs * 0.3, ey = y - cs * 0.05, er = Math.max(cs * 0.13, 5.5);   // 2.7.21: значок ветки читается и при отдалении
    circ(ex, ey, er, tw.branch === 'a' ? '#4aa3ff' : '#ff5a5f', Math.max(1, l * 0.6));
    D.text(tw.branch === 'a' ? 'I' : 'II', ex, ey + er * 0.05, er * 1.1, '#fff', 'center', 'middle', 0);
    if (lv >= 5) { ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 6); D.star(x, y - cs * 1.0, cs * 0.1, COL.gold, 1); ctx.globalAlpha = 1; }
  }
  if (lv >= 2 && !Z.promoClean) for (var p = 0; p < lv; p++) D.star(x - (lv - 1) * cs * 0.09 + p * cs * 0.18, y + cs * 0.22, cs * 0.075, lv >= 5 ? COL.gold : '#fff', Math.max(1, l * 0.5));
  if (tw.max && tw.hp < tw.max && !Z.promoClean) {
    var hf = Math.max(0, tw.hp / tw.max), bw = cs * 0.62, bh = Math.max(3, cs * 0.06);
    ctx.fillStyle = OL; rr(x - bw / 2 - 1, y + cs * 0.3 - 1, bw + 2, bh + 2, 2); ctx.fill();
    ctx.fillStyle = hf > 0.5 ? '#4cc77d' : hf > 0.25 ? '#ffb347' : '#ff5a5f'; ctx.fillRect(x - bw / 2, y + cs * 0.3, bw * hf, bh);
    if (hf < 0.6) { ctx.strokeStyle = OL; ctx.lineWidth = Math.max(1, l * 0.7); ctx.beginPath(); ctx.moveTo(x - cs * 0.2, y - cs * 0.1); ctx.lineTo(x - cs * 0.1, y - cs * 0.3); ctx.lineTo(x - cs * 0.18, y - cs * 0.42); ctx.stroke(); }
    if (hf < 0.4) for (var sm = 0; sm < 3; sm++) { var ph = (t * 0.7 + sm / 3) % 1; ctx.globalAlpha = (1 - ph) * 0.6; circ(x + Math.sin(t * 2 + sm) * cs * 0.1, y - cs * 0.6 - ph * cs * 0.7, cs * (0.08 + ph * 0.14), hf < 0.2 ? '#4a4a5a' : '#9aa1b5'); ctx.globalAlpha = 1; }
    if (hf < 0.2) { var fl = 0.6 + 0.4 * Math.sin(t * 20); ctx.globalAlpha = fl; poly([x - cs * 0.08, y - cs * 0.45, x, y - cs * 0.7, x + cs * 0.08, y - cs * 0.45], '#ff8a3d'); ctx.globalAlpha = 1; }
  }
  if (tw.hitT > 0) { ctx.globalAlpha = tw.hitT / 0.15 * 0.5; circ(x, y - cs * 0.3, cs * 0.45, '#ff6a6a'); ctx.globalAlpha = 1; }
  if (tw.stun > 0) { for (var s = 0; s < 3; s++) { var sa = t * 5 + s * 2.1; D.star(x + Math.cos(sa) * cs * 0.25, y - cs * 0.85 + Math.sin(sa) * cs * 0.08, cs * 0.06, '#ffe066', 1); } }
};

// ---------- враги ----------
D.enemy = function (e, x, y, cs, t) {
  var R = cs * 0.31 * e.size, l = Math.max(1.2, R * 0.12), dir = e.dir || 1;
  var hop = e.air ? Math.sin(t * 2 + e.ph) * R * 0.15 : Math.abs(Math.sin(e.walk)) * R * (e.vehicle ? 0.05 : 0.18);
  var flash = e.hitT > 0, T = e.type;
  ctx.save(); ctx.translate(x, y);
  ell(0, e.air ? R * 0.8 : 0, R * 0.9, R * 0.28, e.air ? 'rgba(30,40,80,0.12)' : 'rgba(30,40,80,0.2)');
  ctx.translate((e.lunge > 0 ? dir * R * 0.35 * Math.sin(e.lunge / 0.2 * Math.PI) : 0) - (e.kb > 0 ? dir * R * 0.25 * e.kb / 0.15 : 0), -hop - (e.air ? R * 1.3 : 0));
  // сплющивание от попадания и тяжёлый шаг
  var sq = e.kb > 0 ? e.kb / 0.15 * 0.14 : 0, stp = e.vehicle || e.air ? 0 : Math.max(0, -Math.cos(e.walk * 2)) * 0.05;
  ctx.scale(1 + sq + stp, 1 - sq - stp);
  if (e.corpse !== undefined) { ctx.rotate(dir * e.corpse * 1.5); ctx.globalAlpha = Math.max(0, 1 - e.corpse); }
  if (e.slow > 0 || (Z.G && (Z.G.blizT > 0 || Z.G.adBliz))) { ctx.globalAlpha = 0.45; circ(0, -R * 0.8, R * 1.1, '#bfefff'); ctx.globalAlpha = 1; }
  if (T === 'raccoon' || T === 'thrower' || T === 'sculptor' || T === 'engineer') {
    ctx.save(); ctx.translate(-dir * R * 0.7, -R * 0.6); ctx.rotate(-dir * 0.8 + Math.sin(e.walk) * 0.2);
    ell(0, -R * 0.4, R * 0.25, R * 0.55, '#8b93a7', l); ctx.fillStyle = '#3d4256'; ctx.fillRect(-R * 0.22, -R * 0.55, R * 0.44, R * 0.12); ctx.fillRect(-R * 0.22, -R * 0.25, R * 0.44, R * 0.12);
    ctx.restore();
    ell(-dir * R * 0.55, -R * 1.0, R * 0.42, R * 0.48, '#c7925f', l);
    if (D.rig) { ctx.save(); ctx.scale(dir, 1); D.rigArm('b', -R * 0.5, -R * 1.05, D.rig.b.a, D.rig.b.e, R * 0.3, R * 0.28, R * 0.22, '#7d8498', l * 0.8, '#3d4256', R * 0.1, null); ctx.restore(); }
    ell(0, -R * 0.75, R * 0.75, R * 0.72, flash ? '#fff' : '#9aa1b5', l); ell(0, -R * 0.55, R * 0.42, R * 0.38, '#d8dce8');
    if (D.rig) { ctx.save(); ctx.scale(dir, 1); D.rigArm('f', R * 0.5, -R * 1.05, D.rig.f.a, D.rig.f.e, R * 0.3, R * 0.28, R * 0.22, '#9aa1b5', l * 0.8, '#3d4256', R * 0.1, null); ctx.restore(); }
    raccoonHead(dir * R * 0.15, -R * 1.45, R, l, flash, dir);
    if (T === 'engineer') {
      rr(dir * R * 0.15 - R * 0.45, -R * 1.95, R * 0.9, R * 0.22, R * 0.08); ctx.fillStyle = '#ffd54a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
      ctx.save(); ctx.translate(dir * R * 0.75, -R * 0.9); ctx.rotate(dir * (e.lunge > 0 ? -1.2 : 0.3)); ctx.fillStyle = '#8a5a35'; ctx.fillRect(-R * 0.05, -R * 0.6, R * 0.1, R * 0.6); rr(-R * 0.2, -R * 0.72, R * 0.4, R * 0.18, 2); ctx.fillStyle = '#9aa1b5'; ctx.fill(); ctx.stroke(); ctx.restore();
    }
    if (T === 'sculptor') {
      poly([dir * R * 0.15 - R * 0.42, -R * 1.8, dir * R * 0.15 - R * 0.3, -R * 2.15, dir * R * 0.15 + R * 0.3, -R * 2.15, dir * R * 0.15 + R * 0.42, -R * 1.8], '#5b4a73', l);
      if (e.ball > 0) circ(dir * R * 0.9, -R * 0.35 * e.ball, R * (0.25 + 0.45 * e.ball), '#ffffff', l);
    }
    if (T === 'thrower') {
      poly([dir * R * 0.15 - R * 0.45, -R * 1.85, dir * R * 0.15, -R * 2.45, dir * R * 0.15 + R * 0.45, -R * 1.85], COL.red, l);
      circ(dir * R * 0.15, -R * 2.45, R * 0.12, '#fff', l * 0.7);
      var thr = e.lunge > 0 ? -1.4 : 0.2;
      ctx.save(); ctx.translate(dir * R * 0.6, -R * 1.0); ctx.rotate(dir * thr); circ(0, -R * 0.5, R * 0.24, '#fff', l); ctx.restore();
    }
  } else if (T === 'icicle') {
    // 2.11.5: Сосулькин без ног, как раньше: скачет на остром кончике (сжимается при касании) и дрожит, гранёный, с бликом и капелью
    var hp0 = Math.abs(Math.sin((e.walk || 0) * 1.6 + (e.ph || 0))), hop = hp0 * R * 0.28, sq = 1 - (1 - hp0) * (1 - hp0) * 0.12, jit = Math.sin(t * 46 + (e.ph || 0) * 7) * R * 0.025;
    ctx.save(); ctx.translate(jit, -hop); ctx.scale(dir * (2 - sq), sq); ctx.rotate(Math.sin(t * 31 + (e.ph || 0)) * 0.035);
    poly([-R * 0.62, -R * 1.95, -R * 0.2, -R * 2.2, R * 0.25, -R * 2.12, R * 0.62, -R * 1.92, 0, R * 0.05], flash ? '#fff' : '#bfeaff', l);
    poly([-R * 0.2, -R * 2.2, R * 0.25, -R * 2.12, R * 0.62, -R * 1.92, 0, R * 0.05, R * 0.02, -R * 1.85], flash ? '#fff' : '#7fc6ee');
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = l * 1.1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-R * 0.42, -R * 1.85); ctx.lineTo(-R * 0.1, -R * 0.45); ctx.stroke();
    ctx.strokeStyle = 'rgba(70,140,200,0.6)'; ctx.lineWidth = l * 0.5; ctx.beginPath(); ctx.moveTo(R * 0.02, -R * 1.85); ctx.lineTo(R * 0.01, -R * 0.1); ctx.stroke();
    D.eyeR(-R * 0.2, -R * 1.5, R * 0.13, 1); D.eyeR(R * 0.2, -R * 1.5, R * 0.12, 1);
    ctx.strokeStyle = OL; ctx.lineWidth = l; ctx.beginPath(); ctx.moveTo(-R * 0.4, -R * 1.78); ctx.lineTo(-R * 0.06, -R * 1.64); ctx.moveTo(R * 0.4, -R * 1.78); ctx.lineTo(R * 0.08, -R * 1.64); ctx.stroke();
    ctx.lineWidth = l * 0.7; ctx.beginPath(); ctx.moveTo(-R * 0.1, -R * 1.22); ctx.lineTo(0, -R * 1.27); ctx.lineTo(R * 0.12, -R * 1.2); ctx.stroke();
    ctx.restore();
    var dp = (t * 1.2 + (e.ph || 0)) % 1; ctx.globalAlpha = 1 - dp; ell(0, -hop * (1 - dp) + dp * R * 0.12, R * 0.05, R * 0.07, '#9fe3ff'); ctx.globalAlpha = 1;
    if (hp0 < 0.15) { ctx.globalAlpha = (0.15 - hp0) / 0.15 * 0.8; for (var sp2 = -1; sp2 <= 1; sp2 += 2) circ(sp2 * R * 0.18, -R * 0.03, R * 0.05, '#e8f6ff'); ctx.globalAlpha = 1; }
  } else if (T === 'fat') {
    ctx.beginPath();
    for (var i = 0; i < 22; i++) { var a = i / 22 * Math.PI * 2, rad = R * (i % 2 ? 0.95 : 1.05); ctx.lineTo(Math.cos(a) * rad, -R * 0.95 + Math.sin(a) * rad * 0.92); }
    ctx.closePath(); ctx.fillStyle = flash ? '#fff' : '#7b6fd6'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ell(0, -R * 0.65, R * 0.55, R * 0.45, '#a79cf0');
    poly([-R * 0.55, -R * 1.65, -R * 0.4, -R * 2.15, -R * 0.25, -R * 1.75], '#fff', l); poly([R * 0.55, -R * 1.65, R * 0.4, -R * 2.15, R * 0.25, -R * 1.75], '#fff', l);
    circ(-R * 0.3, -R * 1.25, R * 0.16, '#fff', l * 0.7); circ(R * 0.3, -R * 1.25, R * 0.16, '#fff', l * 0.7);
    circ(-R * 0.27 + dir * R * 0.04, -R * 1.25, R * 0.07, OL); circ(R * 0.33 + dir * R * 0.04, -R * 1.25, R * 0.07, OL);
    ctx.beginPath(); ctx.arc(0, -R * 0.95, R * 0.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  } else if (T === 'split' || T === 'splitkid') {
    // 2.11.5: Снегоплюх — тающее слякотное чудище: комковатое тело с каплями и кусками льда, брови, ручки; Плюшка — малыш с одним зубом
    var kid = T === 'splitkid', wob = Math.sin(t * 5 + (e.ph || 0)) * R * 0.04;
    ctx.save(); ctx.scale(dir, 1);
    var arm = function (sd) { ctx.save(); ctx.translate(sd * R * 0.82, -R * 0.75); ctx.rotate(sd * (0.4 + Math.sin(t * 4 + sd) * 0.25)); ell(0, R * 0.18, R * 0.13, R * 0.24, flash ? '#fff' : '#9fb2cc', l * 0.8); ctx.restore(); };
    arm(-1);
    ctx.beginPath(); ctx.moveTo(-R, -R * 0.08);
    ctx.bezierCurveTo(-R * 1.15, -R * 0.9, -R * 0.75, -R * 1.55 - wob, -R * 0.2, -R * 1.6 - wob); ctx.bezierCurveTo(R * 0.15, -R * 1.85 - wob, R * 0.75, -R * 1.65, R * 0.9, -R * 1.15); ctx.quadraticCurveTo(R * 1.1, -R * 0.6, R, -R * 0.08);
    ctx.quadraticCurveTo(R * 0.75, R * 0.14, R * 0.45, R * 0.02); ctx.quadraticCurveTo(R * 0.2, R * 0.18, -R * 0.1, R * 0.03); ctx.quadraticCurveTo(-R * 0.45, R * 0.17, -R * 0.65, R * 0.02); ctx.quadraticCurveTo(-R * 0.85, R * 0.1, -R, -R * 0.08); ctx.closePath();
    var gs = ctx.createLinearGradient(0, -R * 1.7, 0, 0); gs.addColorStop(0, kid ? '#eaf4ff' : '#dde8f6'); gs.addColorStop(0.6, kid ? '#b8cde6' : '#a3b6d0'); gs.addColorStop(1, kid ? '#8aa6c8' : '#7890b4');
    ctx.fillStyle = flash ? '#fff' : gs; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(-R * 0.45, -R * 1.3, R * 0.22, R * 0.1, -0.5, 0, 7); ctx.fill();
    if (!kid) { poly([R * 0.35, -R * 0.55, R * 0.55, -R * 0.65, R * 0.62, -R * 0.42, R * 0.42, -R * 0.36], '#cfeeff', l * 0.5); poly([-R * 0.6, -R * 0.45, -R * 0.42, -R * 0.55, -R * 0.38, -R * 0.35], '#cfeeff', l * 0.5); }
    for (var dr = 0; dr < 3; dr++) { var dq = (t * 0.8 + dr * 0.33 + (e.ph || 0)) % 1, dx = (-0.6 + dr * 0.6) * R; ctx.globalAlpha = 1 - dq; ell(dx, R * 0.05 + dq * R * 0.18, R * 0.05, R * 0.07, '#8aa6c8'); }
    ctx.globalAlpha = 1;
    D.eyeR(-R * 0.3, -R * 0.98, R * (kid ? 0.2 : 0.16), 1); D.eyeR(R * 0.3, -R * 1.0, R * (kid ? 0.2 : 0.16), 1);
    ctx.strokeStyle = OL; ctx.lineWidth = l * 1.1; ctx.lineCap = 'round';
    if (!kid) { ctx.beginPath(); ctx.moveTo(-R * 0.52, -R * 1.25); ctx.lineTo(-R * 0.12, -R * 1.16); ctx.moveTo(R * 0.52, -R * 1.27); ctx.lineTo(R * 0.12, -R * 1.18); ctx.stroke();
      ctx.lineWidth = l * 0.8; ctx.beginPath(); ctx.moveTo(-R * 0.28, -R * 0.62); ctx.quadraticCurveTo(0, -R * 0.72, R * 0.28, -R * 0.6); ctx.stroke(); }
    else { ctx.lineWidth = l * 0.8; ctx.beginPath(); ctx.arc(0, -R * 0.72, R * 0.2, 0.2, Math.PI - 0.2); ctx.stroke(); rr(-R * 0.05, -R * 0.56, R * 0.1, R * 0.09, R * 0.02); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = l * 0.4; ctx.stroke();
      ctx.globalAlpha = 0.4; circ(-R * 0.55, -R * 0.72, R * 0.1, '#ff9ab0'); circ(R * 0.55, -R * 0.72, R * 0.1, '#ff9ab0'); ctx.globalAlpha = 1; }
    arm(1);
    ctx.restore();
  } else if (T === 'crow') {
    // 2.11.5: ворона-воздухоплаватель: шар с заплаткой и мешками с песком, ворона в лётных очках машет крылом
    ctx.save(); ctx.scale(dir, 1);
    ctx.strokeStyle = OL; ctx.lineWidth = l * 0.7; ctx.beginPath(); ctx.moveTo(-R * 0.45, -R * 0.58); ctx.lineTo(-R * 0.62, -R * 1.25); ctx.moveTo(R * 0.45, -R * 0.58); ctx.lineTo(R * 0.62, -R * 1.25); ctx.moveTo(0, -R * 0.6); ctx.lineTo(0, -R * 1.05); ctx.stroke();
    ell(0, -R * 2.0, R * 0.92, R * 1.02, flash ? '#fff' : '#e8484f', l);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, -R * 2.0, R * 0.92, R * 1.02, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#ffd54a'; ctx.fillRect(-R * 0.55, -R * 3.1, R * 0.3, R * 2.2); ctx.fillRect(R * 0.25, -R * 3.1, R * 0.3, R * 2.2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-R * 0.4, -R * 2.4, R * 0.15, R * 0.4, -0.3, 0, 7); ctx.fill(); ctx.restore();
    ell(0, -R * 2.0, R * 0.92, R * 1.02, null, l);
    rr(R * 0.2, -R * 1.85, R * 0.3, R * 0.26, R * 0.04); ctx.fillStyle = '#6ac0e8'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.stroke();   // заплатка
    ctx.strokeStyle = OL; ctx.lineWidth = l * 0.4; ctx.beginPath(); for (var st = 0; st < 3; st++) { ctx.moveTo(R * 0.22, -R * (1.8 - st * 0.08)); ctx.lineTo(R * 0.17, -R * (1.8 - st * 0.08)); } ctx.stroke();
    ell(0, -R * 1.02, R * 0.32, R * 0.1, '#c79055', l * 0.6);
    // корзина плетёная
    rr(-R * 0.52, -R * 0.62, R * 1.04, R * 0.56, R * 0.12); ctx.fillStyle = '#c08a50'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = l * 0.5; ctx.beginPath(); for (var wv = 0; wv < 4; wv++) { ctx.moveTo(-R * 0.5, -R * (0.5 - wv * 0.12)); ctx.lineTo(R * 0.5, -R * (0.5 - wv * 0.12)); } ctx.stroke();
    [[-0.55, 0], [0.55, 1]].forEach(function (q) { var sx = R * q[0], swg = Math.sin(t * 2 + q[1]) * R * 0.04; ctx.strokeStyle = OL; ctx.lineWidth = l * 0.5; ctx.beginPath(); ctx.moveTo(sx, -R * 0.5); ctx.lineTo(sx + swg, -R * 0.2); ctx.stroke(); ell(sx + swg, -R * 0.1, R * 0.1, R * 0.12, '#d8c08a', l * 0.5); });
    // ворона
    var wf = Math.sin(t * 9) * 0.5;
    circ(R * 0.02, -R * 0.82, R * 0.3, '#2c2f45', l * 0.8);
    ctx.save(); ctx.translate(-R * 0.18, -R * 0.75); ctx.rotate(-0.6 + wf); ell(-R * 0.15, 0, R * 0.25, R * 0.1, '#3a3d55', l * 0.6); ctx.restore();
    poly([R * 0.26, -R * 0.86, R * 0.62, -R * 0.78, R * 0.26, -R * 0.7], COL.orange, l * 0.6);
    rr(-R * 0.06, -R * 1.02, R * 0.36, R * 0.13, R * 0.05); ctx.fillStyle = '#7a5230'; ctx.fill(); ctx.lineWidth = l * 0.4; ctx.stroke();
    circ(R * 0.06, -R * 0.96, R * 0.075, '#bfefff', l * 0.4); circ(R * 0.22, -R * 0.96, R * 0.075, '#bfefff', l * 0.4); circ(R * 0.09, -R * 0.95, R * 0.03, OL); circ(R * 0.25, -R * 0.95, R * 0.03, OL);
    poly([-R * 0.1, -R * 1.08, -R * 0.02, -R * 1.25, R * 0.06, -R * 1.08], '#2c2f45', l * 0.4);
    ctx.restore();
  } else if (T === 'sled') {
    // 2.11.5: енот на снегоходе — обтекаемый корпус, лыжа, гусеница, фара и стекло; енот в очках, шарф развевается, выхлоп
    ctx.save(); ctx.scale(dir, 1);
    var vib = Math.sin(t * 40) * R * 0.015;
    var rc = e.sledV !== undefined ? e.sledV : Math.floor(Math.abs((e.ph || 0) * 997)) % 2;   // две разновидности: 0 — «лихач» (синий, шарф, очки на ремне), 1 — «гонщик» (красный, шлем, номер, хвост)
    for (var ex = 0; ex < 3; ex++) { var eq = (t * 2 + ex / 3) % 1; ctx.globalAlpha = 0.5 * (1 - eq); circ(-R * (1.25 + eq * 0.8), -R * (0.55 + eq * 0.25), R * (0.1 + eq * 0.18), '#dfe6f2'); }
    ctx.globalAlpha = 1;
    for (var sp2 = 0; sp2 < 7; sp2++) { var spq = (t * 3 + sp2 / 7) % 1; ctx.globalAlpha = 0.8 * (1 - spq); circ(-R * (1.15 + spq * 0.9), -R * (0.08 + Math.sin(spq * 3.1) * 0.35 + (sp2 % 2) * 0.06), R * (0.05 + spq * 0.06), '#ffffff'); }
    ctx.globalAlpha = 1;
    rr(-R * 1.32, -R * 0.62, R * 0.25, R * 0.09, R * 0.04); ctx.fillStyle = '#8a93ad'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.strokeStyle = OL; ctx.stroke();
    // гусеница
    rr(-R * 1.15, -R * 0.32, R * 1.3, R * 0.32, R * 0.16); ctx.fillStyle = '#2c2f45'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    for (var wh = 0; wh < 4; wh++) circ(-R * 1.0 + wh * R * 0.33, -R * 0.16, R * 0.09, '#8a93ad', l * 0.4);
    ctx.strokeStyle = '#555c78'; ctx.lineWidth = l * 0.5; ctx.beginPath(); for (var tr = 0; tr < 9; tr++) { var tx = -R * 1.1 + ((tr * R * 0.15 + t * R * 3) % (R * 1.3)); ctx.moveTo(tx, -R * 0.32); ctx.lineTo(tx, -R * 0.27); } ctx.stroke();
    // лыжа спереди
    ctx.strokeStyle = OL; ctx.lineWidth = l * 1.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(R * 0.55, -R * 0.4); ctx.lineTo(R * 0.7, -R * 0.06); ctx.stroke();
    ctx.lineWidth = l * 2.2; ctx.beginPath(); ctx.moveTo(R * 0.25, R * 0.0); ctx.lineTo(R * 1.15, R * 0.0); ctx.quadraticCurveTo(R * 1.45, R * 0.0, R * 1.42, -R * 0.22); ctx.stroke(); ctx.strokeStyle = '#c9d2e3'; ctx.lineWidth = l; ctx.stroke();
    // корпус
    ctx.beginPath(); ctx.moveTo(-R * 1.2, -R * 0.3 + vib); ctx.lineTo(-R * 1.15, -R * 0.62 + vib); ctx.lineTo(-R * 0.3, -R * 0.7 + vib); ctx.lineTo(R * 0.35, -R * 0.95 + vib); ctx.quadraticCurveTo(R * 1.2, -R * 0.75 + vib, R * 1.3, -R * 0.35 + vib); ctx.lineTo(R * 0.7, -R * 0.25 + vib); ctx.closePath();
    var gb = ctx.createLinearGradient(0, -R * 0.95, 0, -R * 0.25); gb.addColorStop(0, rc ? '#ff8a6a' : '#6ab0ff'); gb.addColorStop(1, rc ? '#c8323a' : '#2b6fc9'); ctx.fillStyle = flash ? '#fff' : gb; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = l * 0.9; ctx.beginPath(); ctx.moveTo(-R * 1.05, -R * 0.45 + vib); ctx.lineTo(R * 1.1, -R * 0.45 + vib); ctx.stroke();
    ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = l * 0.6; ctx.beginPath(); ctx.moveTo(-R * 1.05, -R * 0.38 + vib); ctx.lineTo(R * 1.15, -R * 0.38 + vib); ctx.stroke();
    if (rc) { circ(-R * 0.15, -R * 0.56 + vib, R * 0.12, '#ffffff', l * 0.5); D.text('13', -R * 0.15, -R * 0.555 + vib, R * 0.13, '#e8484f', 'center', 'middle', 0); }
    ell(R * 1.12, -R * 0.55 + vib, R * 0.11, R * 0.08, '#fff6c0', l * 0.5);   // фара
    ctx.globalAlpha = 0.25; poly([R * 1.2, -R * 0.62, R * 2.0, -R * 0.85, R * 2.0, -R * 0.25, R * 1.2, -R * 0.48], '#fff6c0'); ctx.globalAlpha = 1;
    // сиденье и енот
    rr(-R * 0.75, -R * 0.85 + vib, R * 0.65, R * 0.2, R * 0.08); ctx.fillStyle = '#2b3e75'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
    if (rc) { ctx.save(); ctx.translate(-R * 0.65, -R * 0.95 + vib); ctx.rotate(-1.35 + Math.sin(t * 9) * 0.12); }
    if (rc) { ell(0, -R * 0.4, R * 0.18, R * 0.42, '#8b93a7', l * 0.8); ctx.fillStyle = '#3d4256'; ctx.fillRect(-R * 0.16, -R * 0.5, R * 0.32, R * 0.09); ctx.fillRect(-R * 0.16, -R * 0.26, R * 0.32, R * 0.09); ctx.restore(); }
    ell(-R * 0.35, -R * 1.05 + vib, R * 0.35, R * 0.3, '#9aa1b5', l);
    ell(-R * 0.3, -R * 0.98 + vib, R * 0.18, R * 0.16, '#d8dce8');
    if (!rc) { var scf = Math.sin(t * 12) * R * 0.06; poly([-R * 0.45, -R * 1.25, -R * 1.15, -R * 1.2 + scf, -R * 1.05, -R * 1.05 - scf, -R * 0.45, -R * 1.12], '#e8484f', l * 0.6); }
    ctx.strokeStyle = OL; ctx.lineWidth = R * 0.12 + l; ctx.beginPath(); ctx.moveTo(-R * 0.15, -R * 1.1 + vib); ctx.lineTo(R * 0.35, -R * 1.05 + vib); ctx.stroke(); ctx.strokeStyle = '#9aa1b5'; ctx.lineWidth = R * 0.12; ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = l * 1.2; ctx.beginPath(); ctx.moveTo(R * 0.3, -R * 0.95 + vib); ctx.lineTo(R * 0.4, -R * 1.15 + vib); ctx.stroke();   // руль
    if (rc) { circ(R * 0.36, -R * 1.07 + vib, R * 0.09, '#e8484f', l * 0.6); }
    if (rc) { ctx.lineWidth = l * 0.6; ctx.beginPath(); ctx.moveTo(R * 0.4, -R * 1.15 + vib); ctx.lineTo(R * 0.45, -R * 1.3 + vib); ctx.stroke(); ell(R * 0.47, -R * 1.34 + vib, R * 0.06, R * 0.045, '#bfe8ff', l * 0.5); }
    poly([R * 0.42, -R * 0.95 + vib, R * 0.6, -R * 1.35 + vib, R * 0.78, -R * 0.88 + vib], 'rgba(170,220,255,0.7)', l * 0.6);   // стекло
    raccoonHead(-R * 0.2, -R * 1.5 + vib, R * 0.8, l, flash, 1);
    if (rc) {
    ctx.beginPath(); ctx.arc(-R * 0.2, -R * 1.55 + vib, R * 0.46, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); var gh = ctx.createLinearGradient(0, -R * 2.0, 0, -R * 1.55); gh.addColorStop(0, '#ff7a5a'); gh.addColorStop(1, '#d8323f'); ctx.fillStyle = flash ? '#fff' : gh; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();   // шлем
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-R * 0.24, -R * 1.98 + vib, R * 0.08, R * 0.42);
    ctx.globalAlpha = 0.4; ell(-R * 0.4, -R * 1.82 + vib, R * 0.1, R * 0.05, '#ffffff'); ctx.globalAlpha = 1;
    rr(-R * 0.62, -R * 1.64 + vib, R * 0.84, R * 0.12, R * 0.05); ctx.fillStyle = '#3d4256'; ctx.fill();
    circ(-R * 0.36, -R * 1.58 + vib, R * 0.12, 'rgba(255,190,80,0.9)', l * 0.6); circ(-R * 0.02, -R * 1.58 + vib, R * 0.12, 'rgba(255,190,80,0.9)', l * 0.6);
    circ(-R * 0.4, -R * 1.62 + vib, R * 0.035, 'rgba(255,255,255,0.9)'); circ(-R * 0.06, -R * 1.62 + vib, R * 0.035, 'rgba(255,255,255,0.9)');
    } else {   // «лихач»: лётные очки на кожаном ремне
    rr(-R * 0.6, -R * 1.62 + vib, R * 0.8, R * 0.2, R * 0.08); ctx.fillStyle = '#7a5230'; ctx.fill(); ctx.lineWidth = l * 0.5; ctx.strokeStyle = OL; ctx.stroke();
    circ(-R * 0.36, -R * 1.52 + vib, R * 0.11, 'rgba(160,230,255,0.85)', l * 0.5); circ(-R * 0.04, -R * 1.52 + vib, R * 0.11, 'rgba(160,230,255,0.85)', l * 0.5);
    circ(-R * 0.4, -R * 1.56 + vib, R * 0.03, 'rgba(255,255,255,0.9)'); circ(-R * 0.08, -R * 1.56 + vib, R * 0.03, 'rgba(255,255,255,0.9)'); }
    ctx.restore();
  } else if (T === 'ram') {
    // 2.11.5: сани-таран — бревно с железной головой барана (закрученные рога), на полозьях; толкают два енота в шлемах-кастрюлях
    ctx.save(); ctx.scale(dir, 1);
    var push = Math.sin(e.walk * 2) * R * 0.04;
    ctx.strokeStyle = OL; ctx.lineWidth = l * 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-R * 1.2, R * 0.02); ctx.lineTo(R * 0.85, R * 0.02); ctx.quadraticCurveTo(R * 1.2, R * 0.02, R * 1.15, -R * 0.25); ctx.stroke(); ctx.strokeStyle = '#c9d2e3'; ctx.lineWidth = l; ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = l * 1.2; ctx.beginPath(); ctx.moveTo(-R * 0.9, R * 0.02); ctx.lineTo(-R * 0.85, -R * 0.3); ctx.moveTo(R * 0.6, R * 0.02); ctx.lineTo(R * 0.55, -R * 0.3); ctx.stroke();
    rr(-R * 1.15, -R * 0.48, R * 1.95, R * 0.2, R * 0.05); ctx.fillStyle = flash ? '#fff' : '#a8703f'; ctx.fill(); ctx.lineWidth = l; ctx.stroke();
    // еноты толкают
    [-0.85, -0.38].forEach(function (px, k) { var bx = R * px + push * (k ? -1 : 1); ell(bx, -R * 0.85, R * 0.3, R * 0.36, '#9aa1b5', l * 0.8); ell(bx + R * 0.05, -R * 0.76, R * 0.17, R * 0.2, '#d8dce8');
      raccoonHead(bx + R * 0.1, -R * 1.28, R * 0.72, l * 0.85, flash, 1);
      ctx.beginPath(); ctx.arc(bx + R * 0.1, -R * 1.42, R * 0.42, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fillStyle = '#8a93ad'; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
      ctx.strokeStyle = OL; ctx.lineWidth = l * 0.9; ctx.beginPath(); ctx.moveTo(bx + R * 0.48, -R * 1.62); ctx.lineTo(bx + R * 0.62, -R * 1.62); ctx.stroke(); });
    // бревно с обручами
    var lx0 = -R * 0.35 + push, lx1 = R * 1.05 + push, ly = -R * 0.82;
    rr(lx0, ly - R * 0.2, lx1 - lx0, R * 0.4, R * 0.18); ctx.fillStyle = flash ? '#fff' : (function () { var g = ctx.createLinearGradient(0, ly - R * 0.2, 0, ly + R * 0.2); g.addColorStop(0, '#b07a45'); g.addColorStop(1, '#6a4422'); return g; })(); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.strokeStyle = 'rgba(60,35,15,0.55)'; ctx.lineWidth = l * 0.5; ctx.beginPath(); ctx.moveTo(lx0 + R * 0.1, ly - R * 0.06); ctx.lineTo(lx1 - R * 0.3, ly - R * 0.08); ctx.moveTo(lx0 + R * 0.3, ly + R * 0.08); ctx.lineTo(lx1 - R * 0.5, ly + R * 0.06); ctx.stroke();
    [0.25, 0.65].forEach(function (f) { var bx2 = lx0 + (lx1 - lx0) * f; rr(bx2 - R * 0.05, ly - R * 0.22, R * 0.1, R * 0.44, R * 0.02); ctx.fillStyle = '#5a6078'; ctx.fill(); ctx.lineWidth = l * 0.5; ctx.strokeStyle = OL; ctx.stroke(); circ(bx2, ly, R * 0.025, '#c9d2e3'); });
    ell(lx0 + R * 0.02, ly, R * 0.08, R * 0.2, '#d8b080', l * 0.6);
    // железная голова барана
    var hx = lx1 + R * 0.12;
    ell(hx, ly, R * 0.3, R * 0.26, flash ? '#fff' : '#8a93ad', l); ell(hx + R * 0.22, ly + R * 0.06, R * 0.14, R * 0.12, '#a8b0c8', l * 0.7);
    circ(hx + R * 0.28, ly + R * 0.04, R * 0.025, OL);
    ctx.strokeStyle = OL; ctx.lineWidth = R * 0.12 + l; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(hx - R * 0.08, ly - R * 0.12, R * 0.2, -Math.PI * 0.2, Math.PI * 1.25); ctx.stroke();
    ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = R * 0.12; ctx.stroke(); ctx.strokeStyle = '#c99a2a'; ctx.lineWidth = l * 0.5; ctx.beginPath(); ctx.arc(hx - R * 0.08, ly - R * 0.12, R * 0.09, 0, Math.PI * 1.6); ctx.stroke();
    ctx.globalAlpha = 0.85; D.eyeR ? D.eyeR(hx + R * 0.08, ly - R * 0.05, R * 0.06, 1) : circ(hx + R * 0.08, ly - R * 0.05, R * 0.05, '#ff5a5a'); ctx.globalAlpha = 1;
    ctx.restore();
  } else if (T === 'plow') {
    // 2.11.5: снегоуборщик — трактор с отвалом, перед ним растёт сугроб; кабина с енотом, полосы «опасно», мигалка, труба с дымом
    ctx.save(); ctx.scale(dir, 1);
    for (var sm = 0; sm < 3; sm++) { var sq2 = (t * 0.8 + sm / 3) % 1; ctx.globalAlpha = 0.5 * (1 - sq2); circ(-R * 0.35 - sq2 * R * 0.4, -R * (1.75 + sq2 * 0.8), R * (0.1 + sq2 * 0.2), '#8a93ad'); }
    ctx.globalAlpha = 1;
    // сугроб перед отвалом
    var pile = 0.7 + Math.sin(t * 3) * 0.05; ell(R * 1.45, -R * 0.12, R * 0.38 * pile, R * 0.3 * pile, '#ffffff', l * 0.7);
    for (var sf = 0; sf < 3; sf++) { var sfq = (t * 2 + sf / 3) % 1; ctx.globalAlpha = 1 - sfq; circ(R * (1.5 + sfq * 0.4), -R * (0.3 + Math.sin(sfq * 3) * 0.3), R * 0.05, '#ffffff'); } ctx.globalAlpha = 1;
    // корпус
    rr(-R * 0.95, -R * 0.95, R * 1.65, R * 0.7, R * 0.12); ctx.fillStyle = flash ? '#fff' : '#ff9a3c'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.save(); rr(-R * 0.95, -R * 0.45, R * 1.65, R * 0.2, 0); ctx.clip(); for (var hz = 0; hz < 8; hz++) poly([-R * 0.95 + hz * R * 0.26, -R * 0.25, -R * 0.82 + hz * R * 0.26, -R * 0.45, -R * 0.69 + hz * R * 0.26, -R * 0.45, -R * 0.82 + hz * R * 0.26, -R * 0.25], '#2c2f45'); ctx.restore();
    ctx.fillStyle = '#ffd54a'; ctx.fillRect(-R * 0.95, -R * 0.45, R * 1.65, R * 0.02);
    // кабина с енотом
    rr(-R * 0.85, -R * 1.65, R * 0.85, R * 0.72, R * 0.1); ctx.fillStyle = flash ? '#fff' : '#ffb35c'; ctx.fill(); ctx.lineWidth = l; ctx.stroke();
    rr(-R * 0.75, -R * 1.55, R * 0.65, R * 0.45, R * 0.06); ctx.fillStyle = '#bfe8ff'; ctx.fill(); ctx.stroke();
    ctx.save(); rr(-R * 0.75, -R * 1.55, R * 0.65, R * 0.45, R * 0.06); ctx.clip(); raccoonHead(-R * 0.4, -R * 1.22, R * 0.6, l * 0.8, flash, 1); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-R * 0.7, -R * 1.55, R * 0.12, R * 0.45); ctx.restore();
    // мигалка и труба
    rr(-R * 0.55, -R * 1.8, R * 0.25, R * 0.15, R * 0.05); var bl = Math.sin(t * 10) > 0; ctx.fillStyle = bl ? '#ffe066' : '#c9961c'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.stroke();
    if (bl) { ctx.globalAlpha = 0.35; circ(-R * 0.42, -R * 1.73, R * 0.3, '#ffe066'); ctx.globalAlpha = 1; }
    rr(-R * 0.25, -R * 1.85, R * 0.12, R * 0.6, R * 0.03); ctx.fillStyle = '#5a6078'; ctx.fill(); ctx.lineWidth = l * 0.6; ctx.stroke();
    // колёса: заднее большое, переднее малое
    var rot = t * 4;
    [[-R * 0.5, R * 0.42], [R * 0.4, R * 0.3]].forEach(function (w) { circ(w[0], -w[1] + R * 0.02, w[1], '#2c2f45', l); circ(w[0], -w[1] + R * 0.02, w[1] * 0.45, '#ffd54a', l * 0.6);
      ctx.strokeStyle = '#555c78'; ctx.lineWidth = l * 0.8; ctx.beginPath(); for (var k2 = 0; k2 < 6; k2++) { var a2 = rot + k2 * Math.PI / 3; ctx.moveTo(w[0] + Math.cos(a2) * w[1] * 0.6, -w[1] + R * 0.02 + Math.sin(a2) * w[1] * 0.6); ctx.lineTo(w[0] + Math.cos(a2) * w[1] * 0.95, -w[1] + R * 0.02 + Math.sin(a2) * w[1] * 0.95); } ctx.stroke(); });
    // отвал на рычагах
    ctx.strokeStyle = OL; ctx.lineWidth = l * 1.6; ctx.beginPath(); ctx.moveTo(R * 0.65, -R * 0.75); ctx.lineTo(R * 1.0, -R * 0.65); ctx.moveTo(R * 0.65, -R * 0.35); ctx.lineTo(R * 1.0, -R * 0.35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(R * 1.0, -R * 1.05); ctx.quadraticCurveTo(R * 1.25, -R * 0.6, R * 1.12, -R * 0.02); ctx.lineTo(R * 1.28, -R * 0.02); ctx.quadraticCurveTo(R * 1.42, -R * 0.6, R * 1.15, -R * 1.1); ctx.closePath();
    var gp2 = ctx.createLinearGradient(R * 1.0, 0, R * 1.4, 0); gp2.addColorStop(0, '#e6ecf6'); gp2.addColorStop(1, '#8a93ad'); ctx.fillStyle = flash ? '#fff' : gp2; ctx.fill(); ctx.lineWidth = l; ctx.stroke();
    ctx.restore();
  } else if (T === 'giant') {
    ell(0, -R * 0.95, R * 0.85, R * 0.95, flash ? '#fff' : '#a9d8f5', l);
    poly([-R * 0.8, -R * 1.2, -R * 1.25, -R * 0.4 + Math.sin(e.walk) * R * 0.1, -R * 0.9, -R * 0.3], '#8cc6ec', l);
    poly([R * 0.8, -R * 1.2, R * 1.25, -R * 0.4 - Math.sin(e.walk) * R * 0.1, R * 0.9, -R * 0.3], '#8cc6ec', l);
    ell(0, -R * 1.85, R * 0.55, R * 0.45, flash ? '#fff' : '#c5e7fb', l);
    poly([-R * 0.4, -R * 2.2, -R * 0.25, -R * 2.6, -R * 0.1, -R * 2.25, R * 0.05, -R * 2.65, R * 0.2, -R * 2.25, R * 0.38, -R * 2.55, R * 0.45, -R * 2.15], '#e6f6ff', l * 0.8);
    var eg = 0.6 + 0.4 * Math.sin(t * 5); ctx.globalAlpha = eg; circ(-R * 0.2, -R * 1.9, R * 0.12, '#5ac8ff'); circ(R * 0.2, -R * 1.9, R * 0.12, '#5ac8ff'); ctx.globalAlpha = 1;
    circ(-R * 0.2, -R * 1.9, R * 0.06, '#fff'); circ(R * 0.2, -R * 1.9, R * 0.06, '#fff');
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = l * 1.2; ctx.beginPath(); ctx.moveTo(-R * 0.4, -R * 1.3); ctx.lineTo(-R * 0.1, -R * 0.9); ctx.stroke();
  } else if (T === 'witch') {
    if (e.enraged) { ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 10); circ(0, -R * 1.1, R * 1.3, '#9fd8ff'); ctx.globalAlpha = 1; }
    if (flash) ctx.globalAlpha = 0.7;
    D.metelitsa(0, 0, R * 0.85, { dir: dir });
    ctx.globalAlpha = 1;
  } else if (T === 'chariot') {
    ctx.save(); ctx.scale(dir, 1);
    // 2.11.5: ледяные сани Метелицы — нос-волна, полозья с завитком, иней на бортах, позади снежный шлейф; в санях — сама Метелица
    for (var tr = 0; tr < 7; tr++) { var tp = ((t * 1.8 + tr / 7) % 1); ctx.globalAlpha = 0.55 * (1 - tp); circ(-R * (1.0 + tp * 1.4), -R * (0.15 + Math.sin(tr * 2.1 + t) * 0.12) - tp * R * 0.2, R * (0.1 + tp * 0.18), '#ffffff'); }
    ctx.globalAlpha = 1;
    if (!D.chariotNoRider) { ctx.save(); ctx.translate(-R * 0.15, -R * 0.62); D.metelitsa(0, 0, R * 0.72, { dir: 1 }); ctx.restore(); }
    // кузов из льда
    ctx.beginPath(); ctx.moveTo(-R * 1.1, -R * 1.0); ctx.quadraticCurveTo(-R * 1.15, -R * 0.4, -R * 0.85, -R * 0.32); ctx.lineTo(R * 0.7, -R * 0.32);
    ctx.bezierCurveTo(R * 1.2, -R * 0.35, R * 1.35, -R * 0.9, R * 1.12, -R * 1.25); ctx.bezierCurveTo(R * 1.0, -R * 1.42, R * 0.82, -R * 1.25, R * 0.95, -R * 1.12);
    ctx.quadraticCurveTo(R * 0.85, -R * 0.82, R * 0.45, -R * 0.82); ctx.lineTo(-R * 0.75, -R * 0.82); ctx.quadraticCurveTo(-R * 0.9, -R * 0.86, -R * 1.1, -R * 1.0); ctx.closePath();
    var gi = ctx.createLinearGradient(0, -R * 1.3, 0, -R * 0.3); gi.addColorStop(0, '#e9fbff'); gi.addColorStop(0.5, '#8fd3f5'); gi.addColorStop(1, '#4a8fd0'); ctx.fillStyle = flash ? '#fff' : gi; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = l * 0.7; ctx.beginPath(); ctx.moveTo(-R * 0.95, -R * 0.72); ctx.lineTo(R * 0.6, -R * 0.72); ctx.stroke();
    for (var fz = 0; fz < 3; fz++) D.flake(-R * 0.55 + fz * R * 0.5, -R * 0.53, R * 0.1, '#ffffff', l * 0.4);
    var gl2 = 0.5 + 0.5 * Math.sin(t * 4); ctx.globalAlpha = gl2; circ(R * 1.05, -R * 1.2, R * 0.08, '#ffffff'); ctx.globalAlpha = 1;
    // полозья с завитком
    ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = l * 2.4; ctx.beginPath(); ctx.moveTo(-R * 1.15, -R * 0.06); ctx.lineTo(R * 0.9, -R * 0.06); ctx.bezierCurveTo(R * 1.35, -R * 0.06, R * 1.35, -R * 0.5, R * 1.05, -R * 0.45); ctx.stroke();
    ctx.strokeStyle = '#bfefff'; ctx.lineWidth = l * 1.1; ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = l * 1.2; ctx.beginPath(); ctx.moveTo(-R * 0.75, -R * 0.06); ctx.lineTo(-R * 0.7, -R * 0.32); ctx.moveTo(R * 0.45, -R * 0.06); ctx.lineTo(R * 0.4, -R * 0.32); ctx.stroke();
    for (var s = 0; s < 6; s++) { var sa = t * 2 + s * 1.05; ctx.globalAlpha = 0.65; D.flake(Math.cos(sa) * R * 1.35, -R * 1.1 + Math.sin(sa) * R * 0.45, R * 0.07, '#ffffff', l * 0.3); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  ctx.restore();
  if ((e.hp < e.max || e.boss) && !Z.promoClean) {
    var bw = R * (e.boss ? 2.4 : 1.8), bh = Math.max(3, R * 0.16), bx = x - bw / 2, tb = Z.enemyBarTop ? Z.enemyBarTop(e, cs) : null, by = tb != null ? y - tb - bh - hop : y - R * (e.air ? 4.2 : e.boss ? 2.9 : 2.3) - hop;   // 2.11.5: над головой по росту врага
    ctx.fillStyle = OL; rr(bx - 1, by - 1, bw + 2, bh + 2, 2); ctx.fill();
    ctx.fillStyle = e.vehicle || e.boss ? '#ffb347' : '#ff5a5f'; ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.max), bh);
  }
};
function raccoonHead(x, y, R, l, flash, dir) {
  circ(x, y, R * 0.55, flash ? '#fff' : '#9aa1b5', l);
  circ(x - R * 0.38, y - R * 0.45, R * 0.17, '#9aa1b5', l); circ(x + R * 0.38, y - R * 0.45, R * 0.17, '#9aa1b5', l);
  rr(x - R * 0.48, y - R * 0.17, R * 0.96, R * 0.28, R * 0.12); ctx.fillStyle = '#3d4256'; ctx.fill();
  if (D.eyeR) { D.eyeR(x - R * 0.2, y - R * 0.03, R * 0.11, dir); D.eyeR(x + R * 0.2, y - R * 0.03, R * 0.11, dir); } else { circ(x - R * 0.2, y - R * 0.03, R * 0.1, '#fff'); circ(x + R * 0.2, y - R * 0.03, R * 0.1, '#fff'); }
  circ(x + dir * R * 0.35, y + R * 0.15, R * 0.08, OL);
}

// ---------- сани Деда Мороза и Снегурочки ----------
D.sleigh = function (x, y, cs, dir, t, hit) {
  // 2.11.5: олень как настоящий северный олень (грудь, шея с белой гривой, вытянутая морда, уши, рога от макушки с отростками,
  // ноги в суставах с копытами, галоп), возница держит вожжи рукой, сани покачиваются, из-под полозьев летит снег.
  // t = 0 — сани стоят (олень дышит, водит ушами); D.sleighAir — полёт (олень в прыжке, без снега); D.sleighTalk — возница говорит.
  var R = cs * 0.55, l = Math.max(1.5, R * 0.08), T = Z.time || 0, run = !!t, air = !!D.sleighAir;
  x += hit > 0 ? Math.sin(hit * 60) * cs * 0.05 : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); ctx.translate(-R * 0.95, 0);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  var ph = t * 9, sb = run ? Math.sin(ph * 2) * R * 0.015 : 0;          // ход саней
  if (!air) ell(R * 1.05, R * 0.12, R * 2.25, R * 0.3, 'rgba(30,40,80,0.22)');
  // снег из-под полозьев
  if (run && !air) {
    for (var k = 0; k < 9; k++) {
      var lf = (t * 1.7 + k / 9) % 1, jj = Math.sin(k * 12.9898) * 0.5 + 0.5;
      ctx.globalAlpha = 0.75 * (1 - lf);
      circ(-R * 1.05 - lf * R * (0.7 + jj * 0.5), R * 0.04 - lf * R * (0.25 + jj * 0.3) + lf * lf * R * 0.3, R * (0.05 + lf * 0.1), '#ffffff');
      var lf2 = (t * 2.3 + k / 9 + 0.37) % 1;
      ctx.globalAlpha = 0.6 * (1 - lf2);
      circ(R * 1.95 - lf2 * R * 0.6, R * 0.05 - lf2 * R * 0.18, R * (0.03 + lf2 * 0.06), '#f4f8ff');
    }
    ctx.globalAlpha = 1;
  }
  // ---------- северный олень ----------
  var bob = run ? -Math.abs(Math.sin(ph)) * R * 0.07 + R * 0.03 : Math.sin(T * 2.2) * R * 0.01;
  var pit = run ? Math.sin(ph + 0.6) * 0.04 : 0;
  var BODY = '#9a6a42', BODYL = '#b98a5c', BODYD = '#6e4a2e', PALE = '#efe2cc', LEG = '#7a5536', HOOF = '#4a4048';
  function seg3(hx, hy, a, L, w, col) {   // нога из трёх звеньев: бедро/плечо, голень, пясть; a — углы от вертикали (вперёд +)
    var px = hx, py = hy, pts = [px, py];
    for (var i = 0; i < 3; i++) { px += Math.sin(a[i]) * L[i]; py += Math.cos(a[i]) * L[i]; pts.push(px, py); }
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (var j = 2; j < 8; j += 2) ctx.lineTo(pts[j], pts[j + 1]);
    ctx.strokeStyle = OL; ctx.lineWidth = w + l * 1.1; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    // копыто
    ctx.save(); ctx.translate(pts[6], pts[7]); ctx.rotate(-a[2]); ctx.beginPath(); ctx.moveTo(-w * 0.75, -w * 0.2); ctx.lineTo(w * 0.85, -w * 0.2); ctx.lineTo(w * 1.0, w * 0.55); ctx.lineTo(-w * 0.8, w * 0.55); ctx.closePath();
    ctx.fillStyle = HOOF; ctx.fill(); ctx.lineWidth = l * 0.45; ctx.strokeStyle = OL; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-w * 0.5, -w * 0.1, w * 0.5, w * 0.18); ctx.restore();
  }
  function legA(front, o) {
    if (air) { var fl = Math.sin(T * 5 + o) * 0.12; return front ? [0.9 + fl, -0.2 + fl, -1.1 + fl] : [-0.55 + fl, -1.25 + fl, -1.45 + fl]; }
    if (!run) return o > 0.5 && o < 3 && o !== 2.2 ? (front ? [0.14, 0.08, 0.04] : [0.28, -0.58, -0.02]) : (front ? [-0.06, 0.02, 0] : [0.42, -0.5, 0.04]);
    var s = Math.sin(ph + o), c2 = Math.max(0, Math.cos(ph + o)), sw = s * 0.55;
    return front ? [sw, sw - c2 * 1.1, sw - c2 * 2.0] : [0.42 + sw * 0.9, -0.5 + sw * 0.7 - c2 * 0.35, 0.04 + sw * 0.5 + c2 * 0.9];
  }
  var FL = [R * 0.22, R * 0.2, R * 0.17], HL = [R * 0.22, R * 0.24, R * 0.16], lw = R * 0.068;
  var DS = 1.28; ctx.save(); ctx.translate(R * 2.05, R * 0.06); ctx.scale(DS, DS); ctx.translate(-R * 1.7, -R * 0.06);   // олень крупнее, ростом с сани
  ctx.save(); ctx.translate(R * 1.7, -R * 0.5 + bob); ctx.rotate(pit); ctx.translate(-R * 1.7, R * 0.5);
  // дальние ноги — темнее, за туловищем
  seg3(R * 1.38, -R * 0.52, legA(false, 0.55), HL, lw, BODYD);
  seg3(R * 2.02, -R * 0.52, legA(true, 2.75), FL, lw, BODYD);
  // хвостик
  var tw = run ? Math.sin(ph * 2) * 0.3 : Math.sin(T * 3) * 0.15;
  ctx.save(); ctx.translate(R * 1.2, -R * 0.74); ctx.rotate(-0.5 + tw); ell(0, -R * 0.06, R * 0.06, R * 0.1, PALE, l * 0.7); ctx.restore();
  // туловище: холка выше крупа, глубокая грудь, подтянутый живот
  ctx.beginPath(); ctx.moveTo(R * 1.22, -R * 0.74);
  ctx.bezierCurveTo(R * 1.45, -R * 0.86, R * 1.82, -R * 0.84, R * 2.04, -R * 0.86);
  ctx.bezierCurveTo(R * 2.24, -R * 0.8, R * 2.28, -R * 0.52, R * 2.12, -R * 0.4);
  ctx.bezierCurveTo(R * 1.9, -R * 0.33, R * 1.55, -R * 0.4, R * 1.36, -R * 0.42);
  ctx.bezierCurveTo(R * 1.12, -R * 0.46, R * 1.08, -R * 0.66, R * 1.22, -R * 0.74); ctx.closePath();
  var gb = ctx.createLinearGradient(0, -R * 0.88, 0, -R * 0.36); gb.addColorStop(0, BODYL); gb.addColorStop(0.55, BODY); gb.addColorStop(1, BODYD);
  ctx.fillStyle = gb; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  // светлое «зеркало» на крупе и светлый низ живота
  ctx.save(); ctx.clip();
  ell(R * 1.2, -R * 0.62, R * 0.12, R * 0.16, PALE);
  ell(R * 1.7, -R * 0.33, R * 0.4, R * 0.08, 'rgba(239,226,204,0.75)');
  ctx.restore();
  // ближние ноги
  seg3(R * 1.32, -R * 0.5, legA(false, 0), HL, lw, LEG);
  seg3(R * 1.98, -R * 0.5, legA(true, 2.2), FL, lw, LEG);
  // шея — от холки вверх-вперёд к затылку, с белой гривой спереди
  var nod = run ? Math.sin(ph) * 0.06 : Math.sin(T * 1.3) * 0.05 + (Math.sin(T * 0.37) > 0.92 ? 0.12 : 0);
  var hx = R * 2.33, hy = -R * 1.24;                           // затылок
  var nhx = R * 2.04 + (hx - R * 2.04) * Math.cos(nod) - (hy + R * 0.82) * Math.sin(nod), nhy = -R * 0.82 + (hx - R * 2.04) * Math.sin(nod) + (hy + R * 0.82) * Math.cos(nod);
  ctx.beginPath(); ctx.moveTo(R * 1.9, -R * 0.84);
  ctx.quadraticCurveTo(R * 2.05, -R * 1.08, nhx - R * 0.04, nhy - R * 0.06);
  ctx.lineTo(nhx + R * 0.12, nhy + R * 0.08);
  ctx.quadraticCurveTo(R * 2.26, -R * 0.82, R * 2.2, -R * 0.56); ctx.closePath();
  var gn = ctx.createLinearGradient(R * 1.9, 0, R * 2.3, 0); gn.addColorStop(0, BODY); gn.addColorStop(1, BODYL);
  ctx.fillStyle = gn; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  // грива — светлые пряди под горлом
  ctx.beginPath(); var mx0 = nhx + R * 0.1, my0 = nhy + R * 0.1, mx1 = R * 2.2, my1 = -R * 0.6;
  ctx.moveTo(mx0 - R * 0.05, my0 - R * 0.02);
  for (var q = 0; q <= 5; q++) { var kq = q / 5, qx = mx0 + (mx1 - mx0) * kq, qy = my0 + (my1 - my0) * kq; ctx.lineTo(qx + R * (0.09 + 0.03 * Math.sin(T * 4 + q)), qy + R * 0.03); ctx.lineTo(qx + R * 0.02, qy + R * 0.08); }
  ctx.lineTo(mx1 - R * 0.05, my1); ctx.closePath(); ctx.fillStyle = PALE; ctx.fill(); ctx.lineWidth = l * 0.7; ctx.strokeStyle = OL; ctx.stroke();
  // голова
  ctx.save(); ctx.translate(nhx, nhy); ctx.rotate(nod * 0.6 + (run ? 0.05 : 0)); ctx.scale(1.35, 1.35);
  function antler(dx, col, lwk) {
    ctx.save(); ctx.translate(dx, 0); ctx.scale(0.78, 0.78);
    var A = [[0.02, -0.12, -0.12, -0.32, -0.06, -0.55], [-0.06, -0.55, 0.0, -0.66, 0.14, -0.7]];
    var tines = [[-0.1, -0.3, 0.04, -0.4], [-0.08, -0.47, 0.02, -0.6], [-0.03, -0.6, -0.08, -0.74]];
    function draw(w, c3) { ctx.strokeStyle = c3; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(R * 0.02, -R * 0.1);
      ctx.bezierCurveTo(R * A[0][0], R * A[0][1], R * A[0][2], R * A[0][3], R * A[0][4], R * A[0][5]); ctx.quadraticCurveTo(R * A[1][2], R * A[1][3], R * A[1][4], R * A[1][5]);
      tines.forEach(function (p) { ctx.moveTo(R * p[0], R * p[1]); ctx.lineTo(R * p[2], R * p[3]); });
      ctx.moveTo(R * 0.03, -R * 0.15); ctx.quadraticCurveTo(R * 0.12, -R * 0.24, R * 0.2, -R * 0.2); ctx.lineTo(R * 0.24, -R * 0.15);   // надглазный отросток
      ctx.stroke(); }
    draw(R * 0.05 * lwk + l * 0.6, OL); draw(R * 0.05 * lwk, col);
    ctx.restore();
  }
  antler(R * 0.07, '#9c7d56', 0.95);                                     // дальний рог
  // ухо
  var ef = Math.sin(T * 0.9) > 0.85 ? Math.sin(T * 30) * 0.25 : 0;
  ctx.save(); ctx.translate(-R * 0.03, -R * 0.03); ctx.rotate(-2.0 + ef); ell(0, R * 0.1, R * 0.042, R * 0.105, BODYL, l * 0.55); ell(0, R * 0.1, R * 0.02, R * 0.065, '#e6c9a8'); ctx.restore();
  // череп и вытянутая морда
  ctx.beginPath(); ctx.moveTo(-R * 0.06, -R * 0.06);
  ctx.quadraticCurveTo(R * 0.04, -R * 0.17, R * 0.16, -R * 0.1);
  ctx.lineTo(R * 0.32, R * 0.03);
  ctx.quadraticCurveTo(R * 0.38, R * 0.1, R * 0.31, R * 0.15);
  ctx.lineTo(R * 0.18, R * 0.15);
  ctx.quadraticCurveTo(R * 0.06, R * 0.14, R * 0.0, R * 0.09);
  ctx.quadraticCurveTo(-R * 0.1, R * 0.03, -R * 0.06, -R * 0.06); ctx.closePath();
  var gh = ctx.createLinearGradient(0, -R * 0.15, 0, R * 0.15); gh.addColorStop(0, BODYL); gh.addColorStop(1, BODY);
  ctx.fillStyle = gh; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  ell(R * 0.27, R * 0.11, R * 0.07, R * 0.04, 'rgba(239,226,204,0.8)');   // светлая морда
  // нос и глаз
  ell(R * 0.33, R * 0.07, R * 0.045, R * 0.035, '#3a2a2a', l * 0.5); circ(R * 0.32, R * 0.055, R * 0.012, 'rgba(255,255,255,0.7)');
  if (D.eyeR) D.eyeR(R * 0.1, -R * 0.04, R * 0.032, 0.3, 'warm'); else circ(R * 0.1, -R * 0.04, R * 0.03, OL);
  ctx.strokeStyle = OL; ctx.lineWidth = l * 0.5; ctx.beginPath(); ctx.moveTo(R * 0.22, R * 0.13); ctx.quadraticCurveTo(R * 0.26, R * 0.145, R * 0.3, R * 0.135); ctx.stroke();
  // недоуздок
  ctx.strokeStyle = '#c9323c'; ctx.lineWidth = l * 0.45; ctx.beginPath(); ctx.moveTo(R * 0.22, -R * 0.045); ctx.quadraticCurveTo(R * 0.17, R * 0.06, R * 0.19, R * 0.155); ctx.moveTo(R * 0.0, R * 0.07); ctx.lineTo(R * 0.2, R * 0.05); ctx.stroke();
  circ(R * 0.19, R * 0.055, R * 0.018, COL.gold, l * 0.3);
  antler(0, '#c9ab80', 1.1);                                         // ближний рог — от макушки
  var bit = ctx.getTransform();
  ctx.restore();
  // упряжь: хомут с бубенцами и подпруга
  ctx.strokeStyle = OL; ctx.lineWidth = l * 2.4; ctx.beginPath(); ctx.moveTo(R * 1.98, -R * 0.88); ctx.quadraticCurveTo(R * 2.14, -R * 0.74, R * 2.22, -R * 0.56); ctx.stroke();
  ctx.strokeStyle = '#c9323c'; ctx.lineWidth = l * 1.4; ctx.stroke();
  var bj = run ? Math.sin(ph * 2) * R * 0.01 : 0;
  [[2.07, -0.8], [2.16, -0.68]].forEach(function (p) { circ(R * p[0], R * p[1] + R * 0.03 + bj, R * 0.04, COL.gold, l * 0.5); });
  var tr = ctx.getTransform();
  ctx.restore(); ctx.restore();
  // постромки: от хомута вдоль бока к саням
  var inv = ctx.getTransform().inverse(), P = function (M, px, py) { var p = inv.multiply(M).transformPoint(new DOMPoint(px, py)); return p; };
  var c1 = P(tr, R * 2.12, -R * 0.64), c2p = P(tr, R * 1.75, -R * 0.56);
  ctx.strokeStyle = OL; ctx.lineWidth = l * 1.5; ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2p.x, c2p.y); ctx.quadraticCurveTo(R * 1.25, -R * 0.5, R * 0.95, -R * 0.42); ctx.stroke();
  ctx.strokeStyle = '#8a2a33'; ctx.lineWidth = l * 0.7; ctx.stroke();
  // ---------- сани ----------
  ctx.save(); ctx.translate(0, sb);
  // полозья с завитком
  ctx.strokeStyle = OL; ctx.lineWidth = l * 2.4; ctx.beginPath(); ctx.moveTo(-R * 1.05, R * 0.06); ctx.lineTo(R * 0.85, R * 0.06); ctx.bezierCurveTo(R * 1.25, R * 0.06, R * 1.2, -R * 0.4, R * 0.95, -R * 0.35); ctx.stroke();
  ctx.strokeStyle = COL.gold; ctx.lineWidth = l * 1.2; ctx.stroke();
  ctx.strokeStyle = OL; ctx.lineWidth = l * 1.2; ctx.beginPath(); ctx.moveTo(-R * 0.7, R * 0.06); ctx.lineTo(-R * 0.65, -R * 0.15); ctx.moveTo(R * 0.5, R * 0.06); ctx.lineTo(R * 0.45, -R * 0.15); ctx.stroke();
  // возница: сидит в санях, рука держит вожжи (руки по скелету, рот — один, свой)
  var rider = D.noRider ? 'none' : (D.sleighRider || 'sneg'), hand = null;
  if (rider !== 'none') {
    var sn = rider === 'sneg', rx = sn ? R * 0.38 : R * 0.3, rS = sn ? R * 0.64 : R * 0.6, ry = -R * 0.3 + (run ? -Math.abs(Math.sin(ph)) * R * 0.025 : 0);
    var sh = sn ? { f: [0.36, -1.37, 0.29, 0.27], b: [-0.36, -1.37, 0.29, 0.27] } : { f: [0.47, -1.38, 0.33, 0.32], b: [-0.49, -1.36, 0.33, 0.32] };
    var rp = P(tr, R * 2.1, -R * 0.7), rsw = run ? Math.sin(ph) * 0.02 : Math.sin(T * 1.5) * 0.02;
    var tgx = (R * 0.8 - rx) / rS + rsw, tgy = (-R * 0.98 - ry) / rS;
    function ik(s, tx, ty) { var dx = tx - s[0], dy = ty - s[1], d = Math.min(s[2] + s[3] - 0.01, Math.max(0.05, Math.hypot(dx, dy))), base = Math.atan2(dx, dy),
      al = Math.acos(Math.max(-1, Math.min(1, (s[2] * s[2] + d * d - s[3] * s[3]) / (2 * s[2] * d)))), a = base - al, ex = s[0] + Math.sin(a) * s[2], ey = s[1] + Math.cos(a) * s[2], a2 = Math.atan2(tx - ex, ty - ey);
      return { a: a, e: a2 - a, hx: ex + Math.sin(a2) * s[3], hy: ey + Math.cos(a2) * s[3] }; }
    var kf = ik(sh.f, tgx, tgy), kb = { a: 0.35 + Math.sin(T * 1.1) * 0.05, e: 0.5 };
    var oRig = D.rig, oOff = D.armOff;
    D.rig = { f: { a: kf.a, e: kf.e }, b: kb }; D.armOff = true;
    var ro = { dir: 1 }; if (D.sleighTalk != null) { ro.talk = !!D.sleighTalk; ro.noTalk = !D.sleighTalk; }
    try { if (sn) D.snegurochka(rx, ry, rS, ro); else D.moroz(rx, ry, rS, ro); } finally { D.rig = oRig; D.armOff = oOff; }
    hand = { x: rx + kf.hx * rS, y: ry + kf.hy * rS, b: rp };
  }
  // кузов с объёмом и узором
  ctx.beginPath(); ctx.moveTo(-R * 1.05, -R * 0.15); ctx.bezierCurveTo(-R * 1.35, -R * 0.75, -R * 1.2, -R * 1.25, -R * 0.82, -R * 1.2); ctx.quadraticCurveTo(-R * 0.75, -R * 0.75, -R * 0.45, -R * 0.68);
  ctx.lineTo(R * 0.5, -R * 0.68); ctx.quadraticCurveTo(R * 0.9, -R * 0.66, R * 0.82, -R * 0.15); ctx.closePath();
  var gs = ctx.createLinearGradient(0, -R * 1.2, 0, -R * 0.15); gs.addColorStop(0, '#f0525a'); gs.addColorStop(1, '#a8222d'); ctx.fillStyle = gs; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  ctx.strokeStyle = COL.gold; ctx.lineWidth = l * 0.9; ctx.beginPath(); ctx.moveTo(-R * 0.95, -R * 0.38); ctx.lineTo(R * 0.72, -R * 0.38); ctx.stroke();
  for (var k2 = 0; k2 < 4; k2++) { var px = -R * 0.6 + k2 * R * 0.38; ctx.beginPath(); ctx.arc(px, -R * 0.38, R * 0.1, Math.PI, 0); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(-R * 0.98, -R * 1.02, R * 0.12, 0, Math.PI * 1.6); ctx.stroke();
  // подарки в мешке
  ell(-R * 0.6, -R * 0.95, R * 0.34, R * 0.36, '#c7925f', l);
  ctx.strokeStyle = COL.woodD; ctx.lineWidth = l * 0.8; ctx.beginPath(); ctx.moveTo(-R * 0.75, -R * 1.22); ctx.lineTo(-R * 0.45, -R * 1.22); ctx.stroke();
  rr(-R * 0.3, -R * 1.08, R * 0.36, R * 0.38, R * 0.05); ctx.fillStyle = '#4aa3ff'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke(); ctx.fillStyle = COL.gold; ctx.fillRect(-R * 0.14, -R * 1.08, R * 0.05, R * 0.38);
  rr(-R * 0.4, -R * 0.85, R * 0.28, R * 0.24, R * 0.04); ctx.fillStyle = '#9dff6a'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8484f'; ctx.fillRect(-R * 0.28, -R * 0.85, R * 0.05, R * 0.24);
  ctx.restore();
  // вожжи: из варежки возницы к недоуздку, провисают и покачиваются в такт бегу
  if (hand) {
    var bp = P(bit, R * 0.19, R * 0.055), hx2 = hand.x, hy2 = hand.y + sb, sag = R * (run ? 0.06 + Math.sin(ph * 2) * 0.03 : 0.12);
    ctx.strokeStyle = OL; ctx.lineWidth = l * 1.3; ctx.beginPath(); ctx.moveTo(hx2, hy2); ctx.quadraticCurveTo((hx2 + bp.x) / 2, Math.max(hy2, bp.y) + sag, bp.x, bp.y); ctx.stroke();
    ctx.strokeStyle = '#8a2a33'; ctx.lineWidth = l * 0.6; ctx.stroke();
    var mitt = rider === 'sneg' ? '#ffffff' : '#e8484f'; circ(hx2, hy2, R * (rider === 'sneg' ? 0.064 : 0.078), mitt, l * 0.7);   // варежка поверх вожжей — держит
  }
  ctx.restore();
};

// ---------- снаряды и эффекты ----------
D.shot = function (s, X, Y, cs, t) {
  var x = X(s.x), y = Y(s.y);
  if (s.k === 'snow') circ(x, y, cs * 0.07, '#fff', Math.max(1, cs * 0.025));
  else if (s.k === 'mg') { circ(x, y, cs * 0.035, '#fff'); }
  else if (s.k === 'ice') { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(s.ty - s.y, s.tx - s.x)); poly([cs * 0.14, 0, -cs * 0.1, -cs * 0.05, -cs * 0.1, cs * 0.05], COL.ice, Math.max(1, cs * 0.025)); ctx.restore(); }
  else if (s.k === 'mortar') {
    ell(X(s.x0 + (s.tx - s.x0) * s.pr), Y(s.y0 + (s.ty - s.y0) * s.pr), cs * 0.1, cs * 0.04, 'rgba(30,40,80,0.2)');
    circ(x, y, cs * 0.09, COL.red, Math.max(1, cs * 0.03));
    for (var i = 0; i < 3; i++) { ctx.globalAlpha = 0.6 - i * 0.18; circ(x - i * cs * 0.05, y + i * cs * 0.08, cs * 0.04, '#ffd54a'); } ctx.globalAlpha = 1;
  } else if (s.k === 'eball') { var br = cs * 0.22; ctx.save(); ctx.translate(x, y); ctx.rotate(s.rot || 0); circ(0, 0, br, '#ffffff', Math.max(1, cs * 0.035)); ctx.strokeStyle = 'rgba(120,140,190,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, br * 0.6, 0, 2); ctx.stroke(); ctx.restore(); }
  else if (s.k === 'esnow') { circ(x, y, cs * 0.08, '#ffffff', Math.max(1, cs * 0.03)); }
  else if (s.k === 'ebomb') { circ(x, y, cs * 0.08, '#3d4256', Math.max(1, cs * 0.03)); circ(x + cs * 0.04, y - cs * 0.08, cs * 0.03, '#ffd54a'); }
  else if (s.k === 'bolt') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(s.ang); poly([cs * 0.3, 0, -cs * 0.25, -cs * 0.04, -cs * 0.25, cs * 0.04], COL.ice, Math.max(1, cs * 0.025)); ctx.restore();
  }
};
D.fx = function (f, X, Y, cs, t, B) {
  var pr = Math.max(0, f.t / f.dur);
  if (f.t < 0) return;
  if (f.k === 'p') { ctx.globalAlpha = 1 - pr; circ(X(f.x), Y(f.y), cs * f.r, '#fff'); ctx.globalAlpha = 1; }
  else if (f.k === 'frost') {
    ctx.globalAlpha = 1 - pr; circ(X(f.x), Y(f.y), cs * f.r * (0.5 + pr * 0.6), 'rgba(160,230,255,0.35)');
    for (var i = 0; i < 6; i++) D.flake(X(f.x) + Math.cos(i) * cs * f.r * pr, Y(f.y) + Math.sin(i * 2) * cs * f.r * 0.6 * pr, cs * 0.08, '#fff', 1.5);
    ctx.globalAlpha = 1;
  } else if (f.k === 'firework') {
    var cols = [['#ff5a5f', '#ffd54a'], ['#5ac8ff', '#ffffff'], ['#9dff6a', '#ffd54a'], ['#ff8fd6', '#ffffff']][f.hue];
    ctx.globalAlpha = Math.max(0, 1 - pr);
    if (pr < 0.25) circ(X(f.x), Y(f.y), cs * f.r * pr * 3, 'rgba(255,240,200,0.6)');
    for (var k = 0; k < 14; k++) { var a = k / 14 * Math.PI * 2, d = cs * f.r * (0.2 + pr); circ(X(f.x) + Math.cos(a) * d, Y(f.y) + Math.sin(a) * d * 0.8 + pr * pr * cs * 0.4, cs * 0.06 * (1 - pr * 0.5), cols[k % 2]); }
    ctx.globalAlpha = 1;
  } else if (f.k === 'boom') {
    ctx.globalAlpha = 1 - pr; circ(X(f.x), Y(f.y), cs * (0.2 + pr * 0.6), pr < 0.3 ? '#fff3c2' : '#ffb347'); circ(X(f.x), Y(f.y) - pr * cs * 0.4, cs * (0.15 + pr * 0.5), 'rgba(120,130,160,0.5)'); ctx.globalAlpha = 1;
  } else if (f.k === 'stomp') {
    ctx.globalAlpha = 1 - pr; ctx.beginPath(); ctx.arc(X(f.x), Y(f.y), cs * 2 * pr, 0, Math.PI * 2); ctx.strokeStyle = '#bfefff'; ctx.lineWidth = cs * 0.12 * (1 - pr) + 1; ctx.stroke(); ctx.globalAlpha = 1;
  } else if (f.k === 'star') {
    ctx.save(); ctx.translate(X(f.x), Y(f.y)); ctx.scale(0.5 + pr, 0.5 + pr); ctx.globalAlpha = 1 - pr;
    for (var s = 0; s < 8; s++) { var sa = s * Math.PI / 4; ctx.strokeStyle = COL.gold; ctx.lineWidth = cs * 0.06; ctx.beginPath(); ctx.moveTo(Math.cos(sa) * cs * 0.25, Math.sin(sa) * cs * 0.25); ctx.lineTo(Math.cos(sa) * cs * 0.55, Math.sin(sa) * cs * 0.55); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  } else if (f.k === 'spark') { ctx.globalAlpha = 1 - pr; D.star(X(f.x), Y(f.y), cs * 0.12 * (1 + pr), '#fff', 1); ctx.globalAlpha = 1; }
  else if (f.k === 'bolt') {
    var rnd = Z.rng(Math.floor(f.seed + t * 30));
    ctx.globalAlpha = 1 - pr; ctx.lineCap = 'round';
    for (var pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      for (var q = 0; q < f.pts.length - 1; q++) {
        var a1 = f.pts[q], b1 = f.pts[q + 1];
        ctx.moveTo(X(a1.x), Y(a1.y) - cs * 0.3);
        for (var z = 1; z <= 4; z++) { var tt = z / 4; ctx.lineTo(X(a1.x + (b1.x - a1.x) * tt) + (z < 4 ? (rnd() - 0.5) * cs * 0.3 : 0), Y(a1.y + (b1.y - a1.y) * tt) - cs * 0.3 + (z < 4 ? (rnd() - 0.5) * cs * 0.3 : 0)); }
      }
      ctx.strokeStyle = pass ? '#fff' : '#ffe066'; ctx.lineWidth = pass ? cs * 0.03 : cs * 0.09; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (f.k === 'treefall') {
    var ang = Math.min(1, pr * 1.6) * 1.45 * f.dir;
    ctx.save(); ctx.translate(X(f.x), Y(f.y)); ctx.rotate(ang); ctx.globalAlpha = pr < 0.7 ? 1 : (1 - pr) / 0.3;
    D.pine(0, 0, cs * f.h, f.col); ctx.restore(); ctx.globalAlpha = 1;
    if (pr > 0.6 && pr < 0.65) { /* удар о землю */ }
  } else if (f.k === 'giftfly') {
    ctx.save(); ctx.translate(X(f.x), Y(f.y)); ctx.rotate(f.rot); ctx.globalAlpha = Math.min(1, (1 - pr) * 3); D.gift3(0, cs * 0.08, cs * 0.18, cs * 0.15, f.col, '#ffd54a', Math.max(1, cs * 0.02)); ctx.restore(); ctx.globalAlpha = 1;
  } else if (f.k === 'smoke') {
    if (pr < 0) return; ctx.globalAlpha = 0.45 * (1 - pr); circ(X(f.x), Y(f.y), cs * f.r * (1 + pr * 1.5), Z.RICH === 4 ? (pr < 0.2 ? '#aab6d6' : '#e6edfb') : pr < 0.2 ? '#5a5a6a' : '#9aa1b5'); ctx.globalAlpha = 1;
  } else if (f.k === 'ember') {
    ctx.globalAlpha = 1 - pr; circ(X(f.x), Y(f.y), Math.max(1, cs * 0.03), pr < 0.5 ? '#ffd56b' : '#ff7a3d'); ctx.globalAlpha = 1;
  } else if (f.k === 'corpse') {
    var ce = f.e; ce.corpse = pr; ce.walk = 0; ce.hitT = 0; ce.lunge = 0; ce.kb = 0;
    D.enemy(ce, X(f.x), Y(f.y) + cs * 0.15 * pr, cs, t); ctx.globalAlpha = 1;
  } else if (f.k === 'wheel') {
    ctx.save(); ctx.translate(X(f.x), Y(f.y)); ctx.rotate(f.t * 12 * f.dir); ctx.globalAlpha = Math.min(1, (1 - pr) * 3);
    circ(0, 0, cs * 0.14, '#3d4256', Math.max(1, cs * 0.03)); circ(0, 0, cs * 0.05, '#9aa1b5'); ctx.fillStyle = '#9aa1b5'; ctx.fillRect(-cs * 0.12, -cs * 0.015, cs * 0.24, cs * 0.03);
    ctx.restore(); ctx.globalAlpha = 1;
  } else if (f.k === 'collapse') {
    ctx.save(); ctx.translate(X(f.x), Y(f.y)); ctx.rotate(f.dir * pr * 0.5); ctx.scale(1, Math.max(0.05, 1 - pr * 0.9)); ctx.globalAlpha = 1 - pr * 0.8;
    D.tower(f.tw, 0, 0, cs * 1.18, t); ctx.restore(); ctx.globalAlpha = 1;
  } else if (f.k === 'flash') {
    ctx.globalAlpha = 1 - pr; circ(X(f.x), Y(f.y), cs * f.r * (1 + pr), f.col || '#fff3b0'); circ(X(f.x), Y(f.y), cs * f.r * 0.5, '#ffffff'); ctx.globalAlpha = 1;
  } else if (f.k === 'shell') {
    ctx.save(); ctx.translate(X(f.x), Y(f.y)); ctx.rotate(f.t * 20); ctx.fillStyle = COL.gold; ctx.fillRect(-cs * 0.03, -cs * 0.015, cs * 0.06, cs * 0.03); ctx.restore();
  } else if (f.k === 'ring') {
    ctx.globalAlpha = Math.max(0, 1 - pr) * 0.7; ctx.beginPath(); ctx.ellipse(X(f.x), Y(f.y), Math.max(1, cs * f.r * (0.3 + pr * 0.8)), Math.max(1, cs * f.r * (0.3 + pr * 0.8) * 0.7), 0, 0, Math.PI * 2);
    ctx.strokeStyle = f.col || '#fff'; ctx.lineWidth = cs * 0.05 * (1 - pr) + 1; ctx.stroke(); ctx.globalAlpha = 1;
  } else if (f.k === 'deb') {
    ctx.save(); ctx.translate(X(f.x), Y(f.y)); ctx.rotate(f.rot); ctx.globalAlpha = Math.min(1, (1 - pr) * 2);
    ctx.fillStyle = f.col; ctx.fillRect(-cs * f.s, -cs * f.s * 0.6, cs * f.s * 2, cs * f.s * 1.2); ctx.lineWidth = 1; ctx.strokeStyle = OL; ctx.strokeRect(-cs * f.s, -cs * f.s * 0.6, cs * f.s * 2, cs * f.s * 1.2);
    ctx.restore(); ctx.globalAlpha = 1;
  } else if (f.k === 'gift') {
    var gx = f.sx + (f.x - f.sx) * pr, gy = f.sy + (f.y - f.sy) * pr - Math.sin(pr * Math.PI) * 1.2;
    D.gift(X(gx), Y(gy), cs * 0.2);
  }
};
})();
