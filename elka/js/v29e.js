// v2.10.4: карты регионов выглядят по-разному, баланс не меняется.
// Клетка-препятствие («дерево») остаётся той же клеткой — нельзя строить и ходить, — но рисуется по региону:
// лес — ели разной высоты и пары; деревня — ели, стога, поленницы и фонари; озеро — ели, камыш, вмёрзшие лодки;
// горы — тёмные пихты, валуны и кристаллы; полюс — ледяные пики, иглу, снеговики и полосатые столбы.
// Плюс аккуратность: детерминированный разброс внутри клетки, разный рост, тени на месте.
(function () {
var Z = window.Z, D = Z.D, OL = D.OL || '#26304f';
function H(c, r, k) { var x = Math.sin(c * 127.1 + r * 311.7 + k * 74.7) * 43758.5453; return x - Math.floor(x); }
function shade(hex, a) { var n = parseInt(hex.slice(1), 16), r = Math.min(255, Math.max(0, (n >> 16) + a)), g = Math.min(255, Math.max(0, ((n >> 8) & 255) + a)), b = Math.min(255, Math.max(0, (n & 255) + a)); return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
var SETS = [
  [['pine', 0.62], ['pine2', 0.28], ['stump', 0.1]],
  [['pine', 0.45], ['hay', 0.2], ['logs', 0.2], ['lamp', 0.15]],
  [['pine', 0.45], ['reed', 0.3], ['boat', 0.25]],
  [['fir', 0.5], ['boulder', 0.3], ['crystal', 0.2]],
  [['spike', 0.4], ['igloo', 0.2], ['snowman', 0.2], ['cane', 0.2]]
];
function pick(reg, c, r, idx) { var set = SETS[reg] || SETS[0], v = H(c, r, idx + 3), a = 0; for (var i = 0; i < set.length; i++) { a += set[i][1]; if (v < a) return set[i][0]; } return set[0][0]; }
D.regionTree = function (x, y, cs, s, regI, treeCol, c, r, idx) {
  var ctx = D.ctx, l = Math.max(1.2, cs * 0.04), k = pick(regI, c, r, idx || 0), j = H(c, r, idx + 9);
  switch (k) {
    case 'pine': D.pine(x, y, s, treeCol); break;
    case 'pine2': D.pine(x - cs * 0.17, y - cs * 0.04, s * 0.78, shade(treeCol, -8)); D.pine(x + cs * 0.17, y + cs * 0.03, s * 0.66, treeCol); break;
    case 'fir': D.pine(x, y, s * 1.05, shade(treeCol, -22)); break;
    case 'stump':
      D.pine(x + cs * 0.12, y - cs * 0.02, s * 0.6, treeCol);
      D.rr(x - cs * 0.28, y - cs * 0.16, cs * 0.24, cs * 0.16, cs * 0.04); ctx.fillStyle = '#8a5a35'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); D.ell(x - cs * 0.16, y - cs * 0.16, cs * 0.12, cs * 0.05, '#f4f8ff', l * 0.7); break;
    case 'hay':
      ctx.beginPath(); ctx.moveTo(x - cs * 0.34, y); ctx.quadraticCurveTo(x - cs * 0.36, y - cs * 0.62, x, y - cs * 0.66); ctx.quadraticCurveTo(x + cs * 0.36, y - cs * 0.62, x + cs * 0.34, y); ctx.closePath(); ctx.fillStyle = '#d9b05a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
      ctx.strokeStyle = 'rgba(140,100,40,0.6)'; ctx.lineWidth = l * 0.7; for (var h = 0; h < 4; h++) { ctx.beginPath(); ctx.moveTo(x - cs * 0.25 + h * cs * 0.15, y - cs * 0.05); ctx.lineTo(x - cs * 0.2 + h * cs * 0.12, y - cs * 0.45); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(x - cs * 0.2, y - cs * 0.5); ctx.quadraticCurveTo(x, y - cs * 0.78, x + cs * 0.2, y - cs * 0.5); ctx.fillStyle = '#ffffff'; ctx.fill(); break;
    case 'logs':
      for (var q = 0; q < 3; q++) { var lx = x - cs * 0.24 + (q % 2) * cs * 0.2 + (q === 2 ? cs * 0.1 : 0), ly = y - cs * 0.1 - (q === 2 ? cs * 0.17 : 0); D.rr(lx - cs * 0.02, ly - cs * 0.09, cs * 0.4, cs * 0.17, cs * 0.08); ctx.fillStyle = '#9a6a3a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); D.circ(lx, ly - cs * 0.005, cs * 0.075, '#e0b57a', l * 0.7); }
      D.ell(x - cs * 0.02, y - cs * 0.36, cs * 0.24, cs * 0.06, '#ffffff'); break;
    case 'lamp':
      D.pine(x + cs * 0.16, y, s * 0.62, treeCol);
      ctx.strokeStyle = OL; ctx.lineWidth = l * 2; ctx.beginPath(); ctx.moveTo(x - cs * 0.18, y); ctx.lineTo(x - cs * 0.18, y - cs * 0.82); ctx.stroke(); ctx.strokeStyle = '#3d4252'; ctx.lineWidth = l; ctx.stroke();
      D.rr(x - cs * 0.27, y - cs * 0.98, cs * 0.18, cs * 0.18, cs * 0.04); ctx.fillStyle = '#ffe08a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke(); break;
    case 'reed':
      for (var rd = 0; rd < 6; rd++) { var rx = x - cs * 0.25 + rd * cs * 0.1, rh = cs * (0.42 + H(c, r, rd) * 0.3); ctx.strokeStyle = '#6f7d4a'; ctx.lineWidth = l * 1.2; ctx.beginPath(); ctx.moveTo(rx, y); ctx.quadraticCurveTo(rx + cs * 0.04, y - rh * 0.6, rx + (rd % 2 ? 0.06 : -0.04) * cs, y - rh); ctx.stroke(); if (rd % 2) D.ell(rx + cs * 0.05, y - rh, cs * 0.025, cs * 0.07, '#6a4a2a'); }
      D.ell(x, y, cs * 0.32, cs * 0.07, 'rgba(190,225,245,0.8)'); break;
    case 'boat':
      ctx.beginPath(); ctx.moveTo(x - cs * 0.4, y - cs * 0.2); ctx.lineTo(x + cs * 0.4, y - cs * 0.24); ctx.quadraticCurveTo(x + cs * 0.3, y + cs * 0.02, x, y + cs * 0.02); ctx.quadraticCurveTo(x - cs * 0.3, y + cs * 0.02, x - cs * 0.4, y - cs * 0.2); ctx.fillStyle = '#a0603a'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - cs * 0.38, y - cs * 0.2); ctx.lineTo(x + cs * 0.38, y - cs * 0.24); ctx.lineTo(x + cs * 0.3, y - cs * 0.3); ctx.lineTo(x - cs * 0.3, y - cs * 0.27); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
      D.ell(x, y + cs * 0.04, cs * 0.44, cs * 0.06, 'rgba(160,210,240,0.7)'); break;
    case 'boulder':
      D.poly([x - cs * 0.36, y, x - cs * 0.3, y - cs * 0.32, x - cs * 0.05, y - cs * 0.46, x + cs * 0.28, y - cs * 0.34, x + cs * 0.36, y], '#8b93a7', l);
      D.poly([x - cs * 0.3, y - cs * 0.32, x - cs * 0.05, y - cs * 0.46, x + cs * 0.28, y - cs * 0.34, x + cs * 0.1, y - cs * 0.28, x - cs * 0.12, y - cs * 0.3], '#f4f8ff');
      D.poly([x + cs * 0.05, y, x + cs * 0.12, y - cs * 0.25, x + cs * 0.36, y], 'rgba(60,70,100,0.25)'); break;
    case 'crystal':
      D.pine(x - cs * 0.16, y, s * 0.6, shade(treeCol, -22));
      D.poly([x + cs * 0.02, y, x + cs * 0.1, y - cs * 0.62, x + cs * 0.2, y], '#9fdcff', l); D.poly([x + cs * 0.16, y, x + cs * 0.3, y - cs * 0.42, x + cs * 0.36, y], '#c9eeff', l); break;
    case 'spike':
      D.poly([x - cs * 0.3, y, x - cs * 0.16, y - cs * 0.75 - j * cs * 0.2, x - cs * 0.04, y - cs * 0.28, x + cs * 0.1, y - cs * 0.58, x + cs * 0.3, y], '#bfe9ff', l);
      D.poly([x - cs * 0.16, y - cs * 0.75 - j * cs * 0.2, x - cs * 0.1, y - cs * 0.2, x - cs * 0.22, y - cs * 0.1], 'rgba(255,255,255,0.7)'); break;
    case 'igloo':
      ctx.beginPath(); ctx.arc(x, y, cs * 0.36, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#f4f8ff'; ctx.fill(); ctx.lineWidth = l; ctx.strokeStyle = OL; ctx.stroke();
      ctx.strokeStyle = 'rgba(120,150,200,0.5)'; ctx.lineWidth = l * 0.7; for (var b = 1; b < 3; b++) { ctx.beginPath(); ctx.arc(x, y, cs * 0.36 * b / 3, Math.PI, 0); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x + cs * 0.14, y, cs * 0.1, Math.PI, 0); ctx.fillStyle = '#3d4a7a'; ctx.fill(); break;
    case 'snowman':
      if (D.snowman) D.snowman(x, y - cs * 0.02, cs * 0.24); else { D.circ(x, y - cs * 0.18, cs * 0.2, '#fff', l); D.circ(x, y - cs * 0.5, cs * 0.14, '#fff', l); }
      break;
    case 'cane':
      ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = cs * 0.13; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - cs * 0.6); ctx.arc(x + cs * 0.1, y - cs * 0.6, cs * 0.1, Math.PI, 0); ctx.stroke();
      for (var cq = 0; cq < 5; cq++) { ctx.strokeStyle = cq % 2 ? '#fff' : '#e8484f'; ctx.lineWidth = cs * 0.08; ctx.beginPath(); ctx.moveTo(x, y - cq * cs * 0.12); ctx.lineTo(x, y - cq * cs * 0.12 - cs * 0.12); ctx.stroke(); }
      ctx.lineCap = 'butt'; break;
  }
};
})();
