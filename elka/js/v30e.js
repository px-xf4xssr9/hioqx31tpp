/* 2.11.5 · полоска здоровья — над головой, а не на лице.
   Рост каждого героя и врага измеряется один раз: фигура рисуется в невидимый холст и ищется верх «тела»
   (голова, шапка, капюшон), тонкие посохи, перья и антенны не считаются. Полоска ставится чуть выше этой точки. */
(function () {
'use strict';
var Z = window.Z, D = Z.D, UI = Z.ui;
var CV = null, S = 100, CX = 300, CY = 520, TOPH = {}, TOPE = {};
function canvas() { if (!CV) { CV = document.createElement('canvas'); CV.width = 600; CV.height = 640; } return CV; }
// верх фигуры в долях S: первая строка, где закрашено не меньше 18% от самой широкой строки
function measure(draw) {
  var cv = canvas(), c = cv.getContext('2d'), prev = D.ctx;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
  try { D.setCtx(c); draw(c); } catch (e) { if (window.__rep) window.__rep(e); } finally { D.setCtx(prev); }
  var d = c.getImageData(0, 0, cv.width, CY + 10).data, W = cv.width, rows = [], mx = 0;
  for (var y = 0; y < CY + 10; y++) { var n = 0; for (var x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 60) n++; rows.push(n); if (n > mx) mx = n; }
  if (!mx) return null;
  for (var y2 = 0; y2 < rows.length; y2++) if (rows[y2] >= mx * 0.18) return (CY - y2) / S;
  return null;
}
// герой: рост в клетках (cs)
Z.heroBarTop = function (type, cs) {
  if (TOPH[type] === undefined) {
    var k = (UI.heroK && UI.heroK[type]) || 1;
    TOPH[type] = measure(function () { D.ally(type, CX, CY, S * 0.4 * k, { dir: 1 }); });
  }
  var v = TOPH[type]; return v == null ? cs * 0.95 : cs * (v + 0.1);
};
// враг: рост в клетках с учётом размера и полёта
Z.enemyBarTop = function (e, cs) {
  var key = e.type + '|' + (e.air ? 1 : 0) + '|' + (e.size || 1).toFixed(2);
  if (TOPE[key] === undefined) {
    var q = {}; for (var k in e) { var v = e[k]; if (typeof v !== 'object' || v === null) q[k] = v; }
    q.hp = q.max = 1; q.boss = false; q.hitT = 0; q.walk = 0; q.ph = 0; q.lunge = 0; q.kb = 0; q.corpse = undefined; q.dead = false; q.talk = false; q.slow = 0;
    TOPE[key] = measure(function () { D.enemy(q, CX, CY, S, 0); });
  }
  var v2 = TOPE[key]; return v2 == null ? null : cs * (v2 + 0.08);
};
})();
