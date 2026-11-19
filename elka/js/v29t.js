/* 2.11.5 · болото Кикиморы красивее: клетки сливаются в одну заводь с илистым берегом, тёмная вода с рябью и пузырями,
   ряска и кувшинки (на некоторых — цветок), рогоз с коричневыми початками. */
(function () {
'use strict';
var Z = window.Z, D = Z.D;
function h(c, r, k) { var x = Math.sin(c * 127.1 + r * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); }
var MODE = 0, PERM = 0;   // 2.12: MODE 1 — только неподвижное (ил, вода, ряска, кувшинки) для готовой картинки; 2 — только живое (каустики, рябь, пузыри); PERM: 1 — только устоявшиеся клетки, -1 — только растущие/тающие
Z.drawSwamp = function (G, ctx, X, Y, cs, t) {
  var L = G.L, keys = []; for (var k in G.swamp || {}) { var v = G.swamp[k]; if (v > 0 && (!PERM || (PERM > 0) === (v >= 2))) keys.push(+k); } if (!keys.length) return;
  if (!MODE && Z.sceneSprite && ctx === D.ctx) {
    var st = keys.filter(function (k) { return G.swamp[k] >= 2; }).join(',');
    if (st) Z.sceneSprite('swamp|' + st, function () { MODE = 1; PERM = 1; try { Z.drawSwamp(G, D.ctx, X, Y, cs, 0); } finally { MODE = 0; PERM = 0; } });   // устоявшееся болото — одна картинка
    MODE = 2; try { Z.drawSwamp(G, ctx, X, Y, cs, t); } finally { MODE = 0; }   // живое — поверх
    MODE = 3; PERM = -1; try { Z.drawSwamp(G, ctx, X, Y, cs, t); } finally { MODE = 0; PERM = 0; }   // растущие клетки — целиком живьём
    return;
  }
  var ST = MODE !== 2, LV = MODE !== 1;
  var has = function (c, r) { return G.swamp[r * L.W + c] > 0; };
  // 2.11.5: правила местности. Болото на дороге — только в пределах полотна дороги (заболоченная дорога), в стороне — лужа
  // внутри своей клетки; соседние клетки сливаются, только если они на одном уровне земли (плато, гора) и одного вида.
  var isRoad = function (c, r) { var v = L.grid[r] && L.grid[r][c]; return v === 1 || !!L.bridges[r * L.W + c]; };
  var lift = function (c, r) { return ((L.hgt && L.hgt[r] && L.hgt[r][c]) ? 0.32 : 0) + (Z.cellLift ? Z.cellLift(c, r) : 0); };
  var cy = function (c, r) { return Y(r + 0.5 - lift(c, r)); };
  var same = function (c, r, c2, r2) { return has(c2, r2) && isRoad(c, r) === isRoad(c2, r2) && Math.abs(lift(c, r) - lift(c2, r2)) < 0.05; };
  var blob = function (c, r, grow) {
    var x = X(c + 0.5), y = cy(c, r);
    if (isRoad(c, r)) {   // в пределах полотна дороги: со стороны дороги — до края клетки, со стороны обочины — отступ
      var rd = function (dc, dr) { var c2 = c + dc, r2 = r + dr; return !!(L.grid[r2] && (isRoad(c2, r2) || L.grid[r2][c2] === 9)); };
      var ins = cs * Math.max(0.02, 0.2 - grow), x0 = X(c) + (rd(-1, 0) ? 0 : ins), x1 = X(c + 1) - (rd(1, 0) ? 0 : ins), y0 = y - cs * 0.5 + (rd(0, -1) ? 0 : ins), y1 = y + cs * 0.5 - (rd(0, 1) ? 0 : ins);
      ctx.moveTo(x0, y0); ctx.rect(x0, y0, x1 - x0, y1 - y0);
      return;
    }
    var rr = cs * (0.4 + grow); ctx.moveTo(x + rr, y); ctx.ellipse(x, y, rr, rr * 0.8, 0, 0, Math.PI * 2);
    if (same(c, r, c + 1, r)) ctx.rect(x, y - rr * 0.8, cs, rr * 1.6);
    if (same(c, r, c, r + 1)) ctx.rect(x - rr, y, rr * 2, cs);
  };
  ctx.save();
  // ил по берегу
  if (ST) { ctx.beginPath(); keys.forEach(function (k) { blob(k % L.W, Math.floor(k / L.W), 0.1); }); ctx.fillStyle = 'rgba(92,98,60,0.75)'; ctx.fill();
  ctx.beginPath(); keys.forEach(function (k) { blob(k % L.W, Math.floor(k / L.W), 0.03); }); ctx.fillStyle = 'rgba(120,140,80,0.9)'; ctx.fill(); }
  // вода
  ctx.beginPath(); keys.forEach(function (k) { blob(k % L.W, Math.floor(k / L.W), -0.06); });
  var g = ctx.createLinearGradient(0, Y(0), 0, Y(L.H)); g.addColorStop(0, '#4f8070'); g.addColorStop(1, '#2e5a52'); if (ST) { ctx.fillStyle = g; ctx.fill(); }
  ctx.clip();
  if (Z.waterFx && LV) Z.waterFx(ctx, X(0), Y(0), cs, t, 'swamp', Z.waterCellsRect ? Z.waterCellsRect(G, keys.map(function (k) { return [k % L.W, Math.floor(k / L.W)]; }), X, Y, cs) : null);
  keys.forEach(function (k) {
    var c = k % L.W, r = Math.floor(k / L.W), x = X(c + 0.5), y = cy(c, r), sp = isRoad(c, r) ? 0.4 : 1, fade = Math.min(1, G.swamp[k] / 2);
    ctx.globalAlpha = fade;
    // блики и рябь
    ctx.strokeStyle = 'rgba(200,240,220,0.35)'; ctx.lineWidth = Math.max(1, cs * 0.025);
    if (LV) {
    var rp = (t * 0.4 + h(c, r, 1)) % 1; ctx.globalAlpha = fade * (1 - rp) * 0.8;
    var rx = x + (h(c, r, 2) - 0.5) * sp * cs * 0.4, ry = y + (h(c, r, 3) - 0.5) * sp * cs * 0.3, rq = Math.round(rp * 12) / 12, ra = cs * (0.08 + rq * 0.25), rb = cs * (0.04 + rq * 0.12), rl = Math.max(1, cs * 0.025);
    if (!(Z.sharedSprite && Z.sharedSprite('swr|' + rq + '|' + Math.round(cs * 4), rx, ry, ra * 2 + rl * 2 + 2, rb * 2 + rl * 2 + 2, ra + rl + 1, rb + rl + 1, function () { var c2 = D.ctx; c2.strokeStyle = 'rgba(200,240,220,0.35)'; c2.lineWidth = rl; c2.beginPath(); c2.ellipse(rx, ry, ra, rb, 0, 0, 7); c2.stroke(); }))) {   // 2.12: рябь — готовыми кольцами (12 размеров)
      ctx.beginPath(); ctx.ellipse(rx, ry, cs * (0.08 + rp * 0.25), cs * (0.04 + rp * 0.12), 0, 0, 7); ctx.stroke(); }
    ctx.globalAlpha = fade;
    }
    if (ST) {
    // ряска
    ctx.fillStyle = 'rgba(150,200,90,0.85)'; for (var d = 0; d < 7; d++) { ctx.beginPath(); ctx.arc(x + (h(c, r, 10 + d) - 0.5) * sp * cs * 0.8, y + (h(c, r, 20 + d) - 0.5) * sp * cs * 0.55, cs * (0.02 + h(c, r, 30 + d) * 0.025), 0, 7); ctx.fill(); }
    }
    if (LV) {
    // пузырь
    var bq = (t * 0.7 + h(c, r, 4) * 3) % 3; if (bq < 1) { ctx.globalAlpha = fade * (1 - bq); ctx.strokeStyle = 'rgba(220,255,230,0.8)';
      var bx = x + (h(c, r, 5) - 0.5) * sp * cs * 0.5, by = y + (h(c, r, 6) - 0.5) * sp * cs * 0.3, bqq = Math.round(bq * 8) / 8, br = cs * (0.03 + bqq * 0.04), bl = Math.max(1, cs * 0.025);
      if (!(Z.sharedSprite && Z.sharedSprite('swb|' + bqq + '|' + Math.round(cs * 4), bx, by, br * 2 + bl * 2 + 2, br * 2 + bl * 2 + 2, br + bl + 1, br + bl + 1, function () { var c2 = D.ctx; c2.strokeStyle = 'rgba(220,255,230,0.8)'; c2.lineWidth = bl; c2.beginPath(); c2.arc(bx, by, br, 0, 7); c2.stroke(); }))) { ctx.beginPath(); ctx.arc(bx, by, cs * (0.03 + bq * 0.04), 0, 7); ctx.stroke(); }
      ctx.globalAlpha = fade; }
    }
  });
  ctx.restore();
  // кувшинки поверх воды (не обрезаются)
  if (ST) {
  ctx.save();
  keys.forEach(function (k) {
    var c = k % L.W, r = Math.floor(k / L.W), fade = Math.min(1, G.swamp[k] / 2), sp = isRoad(c, r) ? 0.4 : 1; if (h(c, r, 7) > 0.75) return;
    var x = X(c + 0.5) + (h(c, r, 8) - 0.5) * sp * cs * 0.35, y = cy(c, r) + (h(c, r, 9) - 0.5) * sp * cs * 0.25, pr = cs * 0.15, rot = h(c, r, 11) * 6 + Math.sin(t * 0.8 + c) * 0.1;
    ctx.globalAlpha = fade;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.7); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, pr, 0.35, Math.PI * 2 - 0.05); ctx.closePath(); ctx.fillStyle = '#5ab04a'; ctx.fill(); ctx.lineWidth = Math.max(1, cs * 0.025); ctx.strokeStyle = '#2f6a2a'; ctx.stroke();
    ctx.strokeStyle = 'rgba(30,80,30,0.5)'; ctx.lineWidth = Math.max(0.8, cs * 0.012); ctx.beginPath(); for (var v2 = 0; v2 < 5; v2++) { var a = 0.6 + v2 * 1.15; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * pr * 0.85, Math.sin(a) * pr * 0.85); } ctx.stroke();
    ctx.restore();
    if (h(c, r, 12) < 0.45) { // цветок
      var fc = h(c, r, 13) < 0.5 ? ['#ffc6e0', '#ff8fb8'] : ['#ffffff', '#e8eefc'];
      for (var p = 0; p < 6; p++) { var pa = p / 6 * Math.PI * 2 + t * 0.1; ctx.beginPath(); ctx.ellipse(x + Math.cos(pa) * cs * 0.05, y - cs * 0.03 + Math.sin(pa) * cs * 0.03, cs * 0.05, cs * 0.025, pa, 0, 7); ctx.fillStyle = fc[0]; ctx.fill(); ctx.lineWidth = Math.max(0.8, cs * 0.012); ctx.strokeStyle = fc[1]; ctx.stroke(); }
      D.circ(x, y - cs * 0.03, cs * 0.025, '#ffd54a');
    }
  });
  ctx.restore(); }
  ctx.globalAlpha = 1;
};
// болото — поверх дороги (оно растёт прямо на ней), но под всеми объектами
var oObjs = Z.drawObjs;
Z.drawObjs = function (objs, X, Y, cs, t) {
  if (oObjs) oObjs.apply(this, arguments);
  var G = Z.G; if (G && G.swamp) { for (var k in G.swamp) { objs.push({ y: -99, f: function () { Z.drawSwamp(G, D.ctx, X, Y, cs, t); } }); break; } }
};
})();
