// v2.10.4: кривая сложности по уровням, подобранная ботом «как человек» (ставит вышки по охвату дороги, улучшает,
// сливает, чинит, жмёт способности, при штурме ёлки шлёт героев). Цель: обычный уровень — с 40–70% жизней,
// босс — 20–35%, первый уровень региона — передышка. Множитель здоровья врагов на уровень.
(function () {
var Z = window.Z;
var K = [1.0,  1.0,  1.0,  1.29,  2.2,  0.93,  0.94,  1.36,  1.14,  1.85,  0.71,  0.7,  1.19,  0.66,  0.86,  0.97,  1.03,  0.96,  0.61,  1.16,  0.66,  0.85,  0.56,  0.66,  0.63,  0.62,  0.7,  1.27,  0.71,  0.64,  0.7,  0.71,  0.57,  0.7,  0.71];   // 2-я итерация: медиана трёх прогонов на уровень
Z.LEVEL_K = K;
var oMW = Z.makeWaves;
Z.makeWaves = function (info, heroic, L) { var W = oMW.apply(this, arguments), k = K[info.idx] || 1; if (k !== 1) W.forEach(function (w) { w.hpMul *= k; }); return W; };
var oME = Z.makeEscortSpawns;
Z.makeEscortSpawns = function (info, heroic) { var r = oME.apply(this, arguments), k = K[info.idx] || 1; if (r && k !== 1) r.hpMul *= k; return r; };
})();
