/* 2.7c · глубина кадра: длинные тени от вышек, героев, врагов и ёлки (свет слева-сверху) и мерцающие блёстки на снегу.
   Статичные тени деревьев и домов, сугробы и утопленная дорога запечены в слой поля (draw.js), вечерний свет — в v26i.js. */
(function () {
'use strict';
var Z = window.Z, D = Z.D;
if (Z.save.eveLight === undefined) Z.save.eveLight = false;   // настройка «Вечерний свет» (в окне озвучки и звука), по умолчанию выключена: день остаётся днём
// тень — готовая картинка (градиентный овал), которая растягивается и поворачивается: дёшево даже для полусотни объектов
var spr = null;
function mk() { spr = document.createElement('canvas'); spr.width = 128; spr.height = 32; var g = spr.getContext('2d'), gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, 'rgba(40,62,132,1)'); gr.addColorStop(1, 'rgba(40,62,132,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(64, 16, 64, 16, 0, 0, Math.PI * 2); g.fill(); }
var CS = Math.cos(0.42), SN = Math.sin(0.42);
function sh(c, x, y, len, wid, a) { if (!spr) mk(); c.globalAlpha = a; c.setTransform(CS * len / 128 * KX, SN * len / 128 * KX, -SN * wid / 16 * KX, CS * wid / 16 * KX, (x + SN * wid) * KX + TX, (y - CS * wid) * KX + TY); c.drawImage(spr, 0, 0); }
var KX = 1, TX = 0, TY = 0;
var old = Z.drawUnder;
Z.drawUnder = function (ctx, X, Y, cs, t) {
  if (old) old(ctx, X, Y, cs, t);
  var G = Z.G; if (!G || G.night || (Z.save && Z.save.shadowsOff)) return;   // на слабых устройствах подвижные тени отключаются сами
  var L = G.L, k, hg = L.hgt || [], m0 = ctx.getTransform(); KX = m0.a; TX = m0.e; TY = m0.f; ctx.save();
  for (k in G.towers) { var tw = G.towers[k], lf = hg[tw.r] && hg[tw.r][tw.c] ? 0.32 : 0; sh(ctx, X(tw.c + 0.5), Y(tw.r + 0.78 - lf), cs * (0.95 + 0.08 * tw.lvl), cs * 0.2, 0.44); }
  (G.structs || []).forEach(function (st) { sh(ctx, X(st.c + 0.5), Y(st.r + 0.8), cs * 1.0, cs * 0.22, 0.4); });
  for (k in G.barricades) { var b = G.barricades[k]; sh(ctx, X(b.c + 0.5), Y(b.r + 0.7), cs * 0.6, cs * 0.2, 0.24); }
  if (L.fort && L.type !== 'escort') sh(ctx, X(L.fort[0] + 0.7), Y(L.fort[1] + 0.75), cs * 2.6, cs * 0.5, 0.4);
  (G.squad || []).forEach(function (U) { if (!U.dead) sh(ctx, X(U.x), Y(U.y + 0.08), cs * 0.62, cs * 0.13, 0.42); });
  for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (e.dead) continue; var p = Z.enemyPos ? Z.enemyPos(e) : e, s = (e.size || 1); if (e.air) sh(ctx, X(p.x + 0.35), Y(p.y + 0.55), cs * 0.5 * s, cs * 0.12 * s, 0.16); else sh(ctx, X(p.x), Y(p.y + 0.1), cs * 0.6 * s, cs * 0.13 * s, 0.4); }
  if (L.type === 'escort' && Z.sleighPos) { var sp = Z.sleighPos(); sh(ctx, X(sp.x), Y(sp.y + 0.2), cs * 1.3, cs * 0.3, 0.28); }
  ctx.restore(); ctx.globalAlpha = 1;
  // блёстки: несколько искр вспыхивают и гаснут в разных местах поля
  ctx.fillStyle = '#fff';
  for (var q = 0; q < 16; q++) {
    var ph = t * 0.55 + q * 0.37, cyc = Math.floor(ph), fr = ph - cyc, a = Math.sin(fr * Math.PI); if (a < 0.05) continue;
    var rx = ((cyc * 127.1 + q * 311.7) % 97) / 97, ry = ((cyc * 269.5 + q * 183.3) % 89) / 89, x = X(rx * L.W), y = Y(ry * L.H), r = cs * 0.09 * a;
    ctx.globalAlpha = a * 0.9; if (Z.sparkSprite && Z.sparkSprite(x, y, r)) continue;   // 2.12: искра — готовой картинкой
    ctx.beginPath(); ctx.moveTo(x, y - r * 2.2); ctx.lineTo(x + r * 0.4, y - r * 0.4); ctx.lineTo(x + r * 2.2, y); ctx.lineTo(x + r * 0.4, y + r * 0.4); ctx.lineTo(x, y + r * 2.2); ctx.lineTo(x - r * 0.4, y + r * 0.4); ctx.lineTo(x - r * 2.2, y); ctx.lineTo(x - r * 0.4, y - r * 0.4); ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
};
})();
