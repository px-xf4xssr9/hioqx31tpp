/* v27e — герой «Снеговик Эскимо»: младший брат Пломбира, пушкарь с ледяной пушкой (он же на обложке).
   Здесь только рисунок; характеристики, приём и реплики — в v26a.js / v26e.js / voice_data.js. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, OL = '#1b2147';
function grad(ctx, x0, y0, x1, y1, a, b) { var g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
D.eskimo = function (x, y, R, o) {
  var ctx = D.ctx; o = o || {}; var l = Math.max(1.4, R * 0.08), dir = o.dir || 1, t = Z.time;
  var bob = o.walk ? Math.abs(Math.sin(t * 6)) * R * 0.05 : 0, rec = o.atk ? R * 0.1 : 0;
  ctx.save(); ctx.translate(x, y - bob); ctx.scale(dir, 1); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  D.ell(0, bob, R * 0.8, R * 0.19, 'rgba(30,40,80,0.22)');
  function ball(bx, by, r) { var g = ctx.createRadialGradient(bx - r * 0.35, by - r * 0.4, r * 0.1, bx, by, r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cbd9f2'); ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); }
  // хвост шарфа развевается назад
  var fl = Math.sin(t * 5) * R * 0.06;
  ctx.beginPath(); ctx.moveTo(-R * 0.3, -R * 0.98); ctx.quadraticCurveTo(-R * 0.75, -R * 1.1 + fl, -R * 0.95, -R * 0.82 + fl); ctx.lineTo(-R * 0.85, -R * 0.66 + fl); ctx.quadraticCurveTo(-R * 0.6, -R * 0.86, -R * 0.3, -R * 0.82); ctx.closePath(); ctx.fillStyle = '#c93640'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
  ball(0, -R * 0.5, R * 0.56); ball(0, -R * 1.26, R * 0.43);
  D.circ(0, -R * 0.62, R * 0.045, OL); D.circ(0, -R * 0.4, R * 0.045, OL);
  // шарф
  D.rr(-R * 0.42, -R * 1.0, R * 0.84, R * 0.17, R * 0.08); ctx.fillStyle = '#e8484f'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.strokeStyle = OL; ctx.stroke();
  // лицо: угольки, хитрые брови, морковка, ухмылка
  D.eyeR(R * 0.02, -R * 1.32, R * 0.066, 0.3, 'coal'); D.eyeR(R * 0.26, -R * 1.32, R * 0.066, 0.3, 'coal');
  ctx.strokeStyle = OL; ctx.lineWidth = l * 1.05; ctx.beginPath(); ctx.moveTo(-R * 0.08, -R * 1.47); ctx.lineTo(R * 0.08, -R * 1.41); ctx.moveTo(R * 0.2, -R * 1.41); ctx.lineTo(R * 0.36, -R * 1.47); ctx.stroke();
  D.poly([R * 0.14, -R * 1.25, R * 0.6, -R * 1.19, R * 0.14, -R * 1.14], '#ff8a2b', l * 0.7);
  if (o.talk) { var mo = (0.35 + 0.65 * Math.abs(Math.sin(t * 13))) * R * 0.09; D.ell(R * 0.14, -R * 1.04, R * 0.1, mo, OL); }
  else { ctx.strokeStyle = OL; ctx.lineWidth = l * 0.9; ctx.beginPath(); ctx.moveTo(-R * 0.04, -R * 1.07); ctx.quadraticCurveTo(R * 0.16, -R * 0.96, R * 0.32, -R * 1.1); ctx.stroke(); }
  // ведро набекрень
  ctx.save(); ctx.translate(0, -R * 1.56); ctx.rotate(-0.16);
  ctx.beginPath(); ctx.moveTo(-R * 0.4, 0); ctx.lineTo(-R * 0.3, -R * 0.46); ctx.lineTo(R * 0.3, -R * 0.46); ctx.lineTo(R * 0.4, 0); ctx.closePath(); ctx.fillStyle = grad(ctx, -R * 0.4, 0, R * 0.4, 0, '#8fb4e8', '#4f76b8'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  D.rr(-R * 0.46, -R * 0.06, R * 0.92, R * 0.11, R * 0.04); ctx.fillStyle = '#a9c6f0'; ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = l * 0.7; ctx.beginPath(); ctx.moveTo(-R * 0.2, -R * 0.38); ctx.lineTo(-R * 0.26, -R * 0.12); ctx.stroke();
  ctx.restore();
  // ледяная пушка на плече (отдача при выстреле) и красные варежки
  ctx.save(); ctx.translate(R * 0.1 - rec, -R * 0.78); ctx.rotate(-0.12);
  D.rr(-R * 0.3, -R * 0.2, R * 1.05, R * 0.4, R * 0.12); ctx.fillStyle = grad(ctx, 0, -R * 0.2, 0, R * 0.2, '#e4f7ff', '#6fbdf0'); ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
  D.rr(-R * 0.02, -R * 0.24, R * 0.14, R * 0.48, R * 0.05); ctx.fillStyle = '#9fd6fb'; ctx.fill(); ctx.lineWidth = l * 0.8; ctx.stroke();
  D.rr(R * 0.62, -R * 0.26, R * 0.2, R * 0.52, R * 0.07); ctx.fillStyle = '#bfe9ff'; ctx.fill(); ctx.lineWidth = l; ctx.stroke();
  D.ell(R * 0.8, 0, R * 0.05, R * 0.16, '#2b5fa8');
  if (o.atk) { ctx.globalAlpha = 0.85; D.circ(R * 0.98, 0, R * 0.2, '#ffffff'); ctx.globalAlpha = 0.45; D.circ(R * 0.98, 0, R * 0.32, '#bfefff'); ctx.globalAlpha = 1; }
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = l * 0.7; ctx.beginPath(); ctx.moveTo(-R * 0.2, -R * 0.1); ctx.lineTo(R * 0.5, -R * 0.1); ctx.stroke();
  ctx.restore();
  D.circ(R * 0.42 - rec, -R * 0.6, R * 0.15, '#e8484f', l * 0.9); D.circ(-R * 0.12 - rec, -R * 0.66, R * 0.14, '#e8484f', l * 0.9);
  ctx.restore();
};
var prev = D.ally;
D.ally = function (type, x, y, R, o) {
  if (type !== 'eskimo') return prev.apply(this, arguments);
  o = o || {}; var talk = o.talk || (Z.talkKey && Z.talkKey() === 'ESK' && !o.noTalk);
  D.eskimo(x, y, R * 0.95, { dir: o.dir, walk: o.walk, atk: o.atk, talk: talk });
};
})();
