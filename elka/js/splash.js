/* Заставки при запуске: студия Godunov Goxvpe и движок «Иней». Собрано tools/splash/build_splash.py — не править вручную. */

/* =====================================================================
   «Иней» / Iney Engine — заставка движка. Canvas 2D, без библиотек.

   drawSplash(ctx, w, h, t[, opts])
     Рисует кадр по времени t (секунды); w×h — размер в CSS-пикселях
     (контекст уже масштабирован под devicePixelRatio). Очищает холст сам —
     рисуйте на отдельном canvas поверх игры. Возвращает true, пока заставка
     видна, и false, когда она закончилась (t >= IneySplash.DURATION).
     opts.glint — фаза дополнительного блика 0..1 (для удержания логотипа).

   IneySplash.start(canvas, { isReady, onDone, sound, maxDpr })
     Готовый запуск: DPR, ресайз, пропуск по тапу/клавише, удержание логотипа,
     пока игра грузится, и звук (если аудио уже разблокировано касанием).
   IneySplash.unlockAudio() — вызвать в обработчике первого касания.
   ===================================================================== */
(function (global) {
  'use strict';

  var OUT = '#26304f', ICE = '#a9e1ff', ICE_DEEP = '#5fb4ea', WHITE = '#ffffff', GLOW = '120,210,255';
  var T = {
    grow: 0.04,      // ветки срываются из углов
    stamp: [0.56, 0.68, 0.80, 0.92], // буквы впечатываются по одной
    stampDur: 0.16,
    lock: 1.06,      // надпись собрана: вспышка, луч, ударная волна
    sub: 1.12,       // подпись INEY ENGINE
    glint: 1.26,     // блик по буквам
    hold: 1.60,      // точка удержания, если игра ещё грузится
    crack: 1.62,     // трещины, сквозь которые бьёт свет
    shatter: 1.80,   // стекло летит на зрителя
    end: 2.45
  };
  var DURATION = T.end;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeOut(p) { return 1 - (1 - p) * (1 - p) * (1 - p); }
  function easeIn(p) { return p * p * p; }
  function easeBack(p) { var c = 2.2; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function angDiff(a, b) { var d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }

  /* ---------- Буквы «ИНЕЙ», нарисованные линиями (ширина 0.62, высота 1) ---------- */
  var GW = 0.62, GAP = 0.26;
  function breve() { var p = []; for (var i = 0; i <= 8; i++) { var a = Math.PI * i / 8; p.push([0.31 - Math.cos(a) * 0.2, -0.25 + Math.sin(a) * 0.13]); } return p; }
  var GLYPHS = [
    [[[0, 0], [0, 1], [GW, 0], [GW, 1]]],                                       // И
    [[[0, 0], [0, 1]], [[GW, 0], [GW, 1]], [[0, 0.5], [GW, 0.5]]],              // Н
    [[[GW, 0], [0, 0], [0, 1], [GW, 1]], [[0, 0.5], [GW * 0.82, 0.5]]],         // Е
    [[[0, 0], [0, 1], [GW, 0], [GW, 1]], breve()]                               // Й
  ];
  var SUBTITLE = 'INEY ENGINE';

  /* ---------- Предрасчёт сцены (один раз на размер экрана) ---------- */
  var cache = null;
  function build(w, h) {
    var r = rng(20261110);
    var em = Math.min(w * 0.7 / (GW * 4 + GAP * 3), h * 0.19);
    var textW = em * (GW * 4 + GAP * 3);
    var cx = w / 2, cy = h * 0.46;
    var x0 = cx - textW / 2, y0 = cy - em * 0.55;
    var diag = Math.hypot(w, h);
    var S = {
      w: w, h: h, em: em, cx: cx, cy: cy, diag: diag,
      box: { x: x0, y: y0 - em * 0.3, w: textW, h: em * 1.3 },
      lw: {
        b0: Math.max(2.4, em * 0.055), b1: Math.max(1.6, em * 0.032), b2: Math.max(1.2, em * 0.022),
        letter: em * 0.17, spike: Math.max(1.4, em * 0.032), out: Math.max(2, em * 0.036)
      },
      segs: [[], [], []], letters: [], tips: [], dust: [], bursts: [], cells: [], edges: [], debris: []
    };

    // Ветки инея «папоротником»: 4 угла × 2 главные ветки, иголки под 60°,
    // останавливаются у края надписи — обрамляют её.
    var step = Math.max(10, Math.min(w, h) * 0.034);
    var corners = [[0, 0], [w, 0], [0, h], [w, h]];
    var bx = S.box, pad = em * 0.3;
    var keep = { x1: bx.x - pad, y1: bx.y - pad * 0.6, x2: bx.x + bx.w + pad, y2: y0 + em * 1.72 };
    function blocked(x, y) { return x > keep.x1 && x < keep.x2 && y > keep.y1 && y < keep.y2; }
    var targets = [
      [[bx.x + em * 0.2, bx.y + em * 0.3], [bx.x + em * 1.1, bx.y - em * 0.2]],
      [[bx.x + bx.w - em * 0.2, bx.y + em * 0.3], [bx.x + bx.w - em * 1.1, bx.y - em * 0.2]],
      [[bx.x + em * 0.2, keep.y2 - em * 0.2], [bx.x + em * 1.1, keep.y2 + em * 0.1]],
      [[bx.x + bx.w - em * 0.2, keep.y2 - em * 0.2], [bx.x + bx.w - em * 1.1, keep.y2 + em * 0.1]]
    ];
    // время роста ускоряется: ветки «срываются» из углов
    function grow(x, y, a, len, st, lv, t0, speed, target) {
      var n = Math.max(1, Math.ceil(len / st)), tt = t0;
      for (var i = 0; i < n; i++) {
        if (target) a += angDiff(Math.atan2(target[1] - y, target[0] - x), a) * 0.12;
        a += (r() - 0.5) * (lv === 0 ? 0.16 : 0.05);
        var nx = x + Math.cos(a) * st, ny = y + Math.sin(a) * st, dt = st / speed;
        if (blocked(nx, ny) || nx < -st || ny < -st || nx > w + st || ny > h + st) break;
        S.segs[lv].push(x, y, nx, ny, tt, tt + dt);
        var fall = 1 - 0.55 * i / n;
        if (lv === 0) {
          var side = i % 2 ? 1 : -1;
          grow(nx, ny, a + side * 1.05, st * (2.0 + r() * 1.3) * fall, st * 0.72, 1, tt + dt, speed * 0.9, null);
        } else if (lv === 1) {
          if (i % 2 === 1) {
            grow(nx, ny, a + 1.05, st * 0.95 * fall, st * 0.6, 2, tt + dt, speed, null);
            grow(nx, ny, a - 1.05, st * 0.95 * fall, st * 0.6, 2, tt + dt, speed, null);
          }
          if (i === n - 1 && r() < 0.45) S.tips.push(nx, ny, tt + dt, r());
        }
        x = nx; y = ny; tt += dt; speed *= 1.03;
      }
    }
    for (var c = 0; c < 4; c++) {
      for (var k = 0; k < 2; k++) {
        var sx = corners[c][0], sy = corners[c][1], tg = targets[c][k];
        var d = Math.hypot(tg[0] - sx, tg[1] - sy);
        var a0 = Math.atan2(tg[1] - sy, tg[0] - sx) + (k ? 0.3 : -0.3) * (c === 1 || c === 2 ? -1 : 1);
        grow(sx, sy, a0, d * 1.2, step, 0, T.grow + r() * 0.05, d / (0.62 + r() * 0.08), tg);
      }
    }

    // Буквы: каждая — набор линий + иголочки; впечатывается целиком в свой момент
    for (var g = 0; g < 4; g++) {
      var gx = x0 + g * em * (GW + GAP), L = { lines: [], spikes: [], cx: gx + em * GW / 2, cy: y0 + em * 0.45, ts: T.stamp[g] };
      var kk = 0;
      GLYPHS[g].forEach(function (pl) {
        var line = [];
        pl.forEach(function (p) { line.push(gx + p[0] * em, y0 + p[1] * em); });
        L.lines.push(line);
        for (var i = 1; i < pl.length; i++) {
          var ax = gx + pl[i - 1][0] * em, ay = y0 + pl[i - 1][1] * em, bx2 = gx + pl[i][0] * em, by = y0 + pl[i][1] * em;
          var len = Math.hypot(bx2 - ax, by - ay); if (len < em * 0.3) continue;
          var ang = Math.atan2(by - ay, bx2 - ax), m = Math.floor(len / (em * 0.24));
          for (var j = 1; j < m; j++) {
            var u = j / m, mx = ax + (bx2 - ax) * u, my = ay + (by - ay) * u, sd = (kk++ % 2 ? 1 : -1), sl = em * (0.1 + r() * 0.06), aa = ang + sd * 1.05;
            L.spikes.push(mx, my, mx + Math.cos(aa) * sl, my + Math.sin(aa) * sl);
          }
        }
      });
      // выброс ледяных осколков при ударе буквы
      for (var b = 0; b < 12; b++) {
        var ba = r() * Math.PI * 2, bs = em * (1.2 + r() * 1.6);
        S.bursts.push({ g: g, x: L.cx, y: L.cy, vx: Math.cos(ba) * bs, vy: Math.sin(ba) * bs - em * 0.6, s: em * (0.03 + r() * 0.04), rot: r() * 6 });
      }
      S.letters.push(L);
    }

    // Ледяная пыль в воздухе
    for (var s = 0; s < 46; s++) S.dust.push(r() * w, r() * h, 0.8 + r() * 1.8, r() * 6.28, 6 + r() * 14);

    S.subFont = Math.max(11, Math.round(em * 0.2));
    S.subY = y0 + em * 1.42;

    // Осколки: лучи из центра надписи × кольца
    var K = 13, R = [0, 0.11, 0.25, 0.44, 0.7, 1.15], V = [], ix = cx, iy = cy, baseA = [];
    for (var i = 0; i < K; i++) baseA.push((i + r() * 0.6) * Math.PI * 2 / K);
    for (var i = 0; i < K; i++) {
      V.push([]);
      for (var j = 0; j < R.length; j++) {
        if (j === 0) { V[i].push([ix, iy]); continue; }
        var rr = R[j] * diag * (j === R.length - 1 ? 1 : 0.85 + r() * 0.3), aj = baseA[i] + (r() - 0.5) * 0.25;
        V[i].push([ix + Math.cos(aj) * rr, iy + Math.sin(aj) * rr]);
      }
    }
    for (var i = 0; i < K; i++) {
      var i2 = (i + 1) % K;
      for (var j = 0; j < R.length - 1; j++) {
        var poly = j === 0 ? [V[i][0], V[i][1], V[i2][1]] : [V[i][j], V[i2][j], V[i2][j + 1], V[i][j + 1]];
        var mx2 = 0, my2 = 0; poly.forEach(function (p) { mx2 += p[0]; my2 += p[1]; }); mx2 /= poly.length; my2 /= poly.length;
        var dx = mx2 - ix, dy = my2 - iy, dl = Math.hypot(dx, dy) || 1, near = 1 - clamp(dl / (diag * 0.6), 0, 1);
        var sp = diag * (0.16 + 0.34 * near) * (0.7 + r() * 0.6);
        S.cells.push({ poly: poly, cx: mx2, cy: my2, vx: dx / dl * sp, vy: dy / dl * sp, rot: (r() - 0.5) * 2.8, zoom: 0.5 + near * 1.3 + r() * 0.4, delay: (dl / diag) * 0.1 });
        S.edges.push([poly[0], poly[1], Math.min(Math.hypot(poly[0][0] - ix, poly[0][1] - iy), Math.hypot(poly[1][0] - ix, poly[1][1] - iy))]);
        if (j > 0) S.edges.push([V[i][j], V[i][j + 1], Math.hypot(V[i][j][0] - ix, V[i][j][1] - iy)]);
      }
    }
    // блёстки при разбивании
    for (var q = 0; q < 70; q++) { var da = r() * Math.PI * 2, ds = diag * (0.15 + r() * 0.55); S.debris.push(ix, iy, Math.cos(da) * ds, Math.sin(da) * ds, 0.8 + r() * 2.2, r()); }

    // спрайт холодного свечения (рисуется один раз, потом только drawImage)
    var gs = 256, gc = document.createElement('canvas'); gc.width = gc.height = gs;
    var gx2 = gc.getContext('2d'), gg = gx2.createRadialGradient(gs / 2, gs / 2, 0, gs / 2, gs / 2, gs / 2);
    gg.addColorStop(0, 'rgba(235,250,255,1)'); gg.addColorStop(0.18, 'rgba(' + GLOW + ',0.7)'); gg.addColorStop(0.5, 'rgba(' + GLOW + ',0.18)'); gg.addColorStop(1, 'rgba(' + GLOW + ',0)');
    gx2.fillStyle = gg; gx2.fillRect(0, 0, gs, gs);
    S.glowSprite = gc;
    S.snap = null;
    return S;
  }

  /* ---------- Рисование ---------- */
  function strokeSegs(ctx, arr, t, color, width, alpha) {
    ctx.beginPath();
    for (var i = 0; i < arr.length; i += 6) {
      var ts = arr[i + 4]; if (t <= ts) continue;
      var te = arr[i + 5], p = t >= te ? 1 : (t - ts) / (te - ts);
      ctx.moveTo(arr[i], arr[i + 1]);
      ctx.lineTo(arr[i] + (arr[i + 2] - arr[i]) * p, arr[i + 1] + (arr[i + 3] - arr[i + 1]) * p);
    }
    ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }

  function letterPath(ctx, L) {
    for (var i = 0; i < L.lines.length; i++) {
      var ln = L.lines[i]; ctx.moveTo(ln[0], ln[1]);
      for (var k = 2; k < ln.length; k += 2) ctx.lineTo(ln[k], ln[k + 1]);
    }
  }
  function spikePath(ctx, L) {
    for (var i = 0; i < L.spikes.length; i += 4) { ctx.moveTo(L.spikes[i], L.spikes[i + 1]); ctx.lineTo(L.spikes[i + 2], L.spikes[i + 3]); }
  }
  function strokeLetter(ctx, L, color, width, alpha, spikes) {
    ctx.beginPath(); if (spikes) spikePath(ctx, L); else letterPath(ctx, L);
    ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }

  function drawLetters(ctx, S, t, flash) {
    var lw = S.lw, o = lw.out * 2;
    for (var g = 0; g < 4; g++) {
      var L = S.letters[g], p = clamp((t - L.ts) / T.stampDur, 0, 1); if (p <= 0) continue;
      var sc = 1 + 0.45 * (1 - easeBack(p)), a = clamp(p * 3, 0, 1), white = 1 - easeOut(p);
      ctx.save();
      ctx.translate(L.cx, L.cy); ctx.scale(sc, sc); ctx.translate(-L.cx, -L.cy);
      // холодное свечение (широкие полупрозрачные штрихи, без blur)
      ctx.globalCompositeOperation = 'lighter';
      strokeLetter(ctx, L, 'rgb(' + GLOW + ')', lw.letter * 3.2, 0.07 * a + 0.12 * flash);
      strokeLetter(ctx, L, 'rgb(' + GLOW + ')', lw.letter * 1.9, 0.12 * a + 0.15 * flash);
      ctx.globalCompositeOperation = 'source-over';
      var sp = clamp((t - L.ts - T.stampDur * 0.6) / 0.12, 0, 1);
      if (sp > 0) strokeLetter(ctx, L, OUT, lw.spike + o, sp, true);
      strokeLetter(ctx, L, OUT, lw.letter + o * 1.3, a);
      if (sp > 0) strokeLetter(ctx, L, ICE, lw.spike, sp, true);
      strokeLetter(ctx, L, ICE_DEEP, lw.letter, a);
      strokeLetter(ctx, L, ICE, lw.letter * 0.62, a);
      strokeLetter(ctx, L, WHITE, lw.letter * 0.22, 0.95 * a);
      if (white > 0.01) strokeLetter(ctx, L, WHITE, lw.letter, white);   // буква влетает раскалённо-белой
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawBursts(ctx, S, t) {
    ctx.fillStyle = ICE; ctx.strokeStyle = OUT; ctx.lineWidth = Math.max(1, S.em * 0.012);
    for (var i = 0; i < S.bursts.length; i++) {
      var b = S.bursts[i], q = (t - S.letters[b.g].ts - T.stampDur * 0.5) / 0.5; if (q <= 0 || q >= 1) continue;
      var e = easeOut(q), x = b.x + b.vx * e, y = b.y + b.vy * e + S.em * 2.2 * q * q, s = b.s * (1 - q * 0.6);
      ctx.globalAlpha = 1 - q;
      ctx.save(); ctx.translate(x, y); ctx.rotate(b.rot + q * 6);
      ctx.beginPath(); ctx.moveTo(0, -s * 1.6); ctx.lineTo(s, 0); ctx.lineTo(0, s * 1.6); ctx.lineTo(-s, 0); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawIce(ctx, S, t, flash) {
    var lw = S.lw, o = lw.out * 2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var layers = [[S.segs[0], lw.b0], [S.segs[1], lw.b1], [S.segs[2], lw.b2]];
    layers.forEach(function (L) { strokeSegs(ctx, L[0], t, OUT, L[1] + o, 1); });
    layers.forEach(function (L) { strokeSegs(ctx, L[0], t, ICE, L[1], 1); });
    strokeSegs(ctx, S.segs[0], t, WHITE, lw.b0 * 0.38, 0.9);
    if (flash > 0.01) {                                // ветки вспыхивают в момент сборки
      ctx.globalCompositeOperation = 'lighter';
      layers.forEach(function (L) { strokeSegs(ctx, L[0], t, 'rgb(' + GLOW + ')', L[1] * 2.2, 0.5 * flash); });
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  function star(ctx, x, y, s) { ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); }
  function drawSparkles(ctx, S, t) {
    ctx.lineCap = 'round'; ctx.strokeStyle = WHITE; ctx.lineWidth = Math.max(1, S.em * 0.012);
    ctx.beginPath();
    for (var i = 0; i < S.tips.length; i += 4) {
      var age = t - S.tips[i + 2]; if (age <= 0) continue;
      var tw = 0.5 + 0.5 * Math.sin(t * 13 + S.tips[i + 3] * 20), s = S.em * 0.09 * clamp(age * 6, 0, 1) * (0.4 + 0.6 * tw);
      star(ctx, S.tips[i], S.tips[i + 1], s);
    }
    ctx.globalAlpha = 0.9; ctx.stroke();
    // ледяная пыль
    ctx.fillStyle = '#d8f2ff';
    for (var j = 0; j < S.dust.length; j += 5) {
      var x = S.dust[j] + Math.sin(t * 0.9 + S.dust[j + 3]) * S.dust[j + 4], y = (S.dust[j + 1] - t * S.dust[j + 4] * 2 + S.h) % S.h;
      ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 5 + S.dust[j + 3]));
      ctx.fillRect(x, y, S.dust[j + 2], S.dust[j + 2]);
    }
    ctx.globalAlpha = 1;
  }

  function subtitleLayout(ctx, S, spacing) {
    ctx.font = '800 ' + S.subFont + 'px system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif';
    var sp = S.subFont * spacing, xs = [], tot = 0;
    for (var i = 0; i < SUBTITLE.length; i++) { var cw = ctx.measureText(SUBTITLE[i]).width; xs.push(tot); tot += cw + sp; }
    return { xs: xs, x0: S.cx - (tot - sp) / 2 };
  }
  function drawSubtitle(ctx, S, t, fillColor) {
    var p = clamp((t - T.sub) / 0.32, 0, 1); if (p <= 0) return;
    var e = easeOut(p), L = subtitleLayout(ctx, S, 0.42 + 0.9 * (1 - e)), y = S.subY;
    ctx.globalAlpha = e; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, S.subFont * 0.28); ctx.strokeStyle = OUT; ctx.fillStyle = fillColor;
    for (var i = 0; i < SUBTITLE.length; i++) ctx.strokeText(SUBTITLE[i], L.x0 + L.xs[i], y);
    for (var i = 0; i < SUBTITLE.length; i++) ctx.fillText(SUBTITLE[i], L.x0 + L.xs[i], y);
    ctx.globalAlpha = 1;
  }

  function drawGlint(ctx, S, phase) {
    if (phase <= 0 || phase >= 1) return;
    var b = S.box, band = S.em * 0.5, slope = S.em * 0.5;
    var x = b.x - band - slope + (b.w + band * 2 + slope * 2) * easeOut(phase);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, b.y - S.em * 0.3); ctx.lineTo(x + band, b.y - S.em * 0.3);
    ctx.lineTo(x + band - slope, S.subY + S.em * 0.3); ctx.lineTo(x - slope, S.subY + S.em * 0.3); ctx.closePath();
    ctx.clip();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var g = 0; g < 4; g++) strokeLetter(ctx, S.letters[g], WHITE, S.lw.letter, 1);
    drawSubtitle(ctx, S, 99, WHITE);
    ctx.restore();
    // звёздочка на гребне блика
    var sx = x + band * 0.5 - slope * 0.1, sy = b.y + S.em * 0.05, s = S.em * 0.22 * Math.sin(phase * Math.PI);
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = WHITE; ctx.lineWidth = Math.max(1.5, S.em * 0.02);
    ctx.beginPath(); star(ctx, sx, sy, s); ctx.globalAlpha = 0.95; ctx.stroke(); ctx.restore();
  }

  function drawGlass(ctx, S, alpha, t) {
    var g = ctx.createRadialGradient(S.cx, S.cy, S.em * 0.4, S.cx, S.cy, S.diag * 0.62);
    g.addColorStop(0, '#1b3c7c'); g.addColorStop(0.5, '#0d214f'); g.addColorStop(1, '#040b1d');
    ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(0, 0, S.w, S.h);
    ctx.globalAlpha = 1;
  }

  function drawLockFx(ctx, S, t) {
    var q = t - T.lock; if (q < 0) return 0;
    var flash = Math.exp(-q * 4.5);
    var glowA = 0.35 + 0.65 * flash, gsz = S.em * (5 + 3 * flash);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = glowA * 0.55;
    ctx.drawImage(S.glowSprite, S.cx - gsz, S.cy - gsz * 0.6, gsz * 2, gsz * 1.2);   // холодный свет за надписью
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    return flash;
  }

  function drawLockFront(ctx, S, t) {
    var q = t - T.lock; if (q < 0) return;
    ctx.globalCompositeOperation = 'lighter';
    if (q < 0.9) {                                     // анаморфный луч через весь экран
      var a = Math.exp(-q * 3.2), hh = S.em * (0.06 + 0.1 * a);
      var lg = ctx.createLinearGradient(0, 0, S.w, 0);
      lg.addColorStop(0, 'rgba(' + GLOW + ',0)'); lg.addColorStop(0.5, 'rgba(235,250,255,' + (0.9 * a) + ')'); lg.addColorStop(1, 'rgba(' + GLOW + ',0)');
      ctx.globalAlpha = 1; ctx.fillStyle = lg; ctx.fillRect(0, S.cy - hh / 2, S.w, hh);
      ctx.globalAlpha = 0.6 * a; ctx.drawImage(S.glowSprite, S.cx - S.w * 0.5, S.cy - S.em * 0.35, S.w, S.em * 0.7);
    }
    if (q < 0.6) {                                     // ударная волна
      var R = S.em * 1.2 + S.diag * 0.7 * easeOut(q / 0.6);
      ctx.globalAlpha = (1 - q / 0.6) * 0.8; ctx.strokeStyle = 'rgb(200,240,255)'; ctx.lineWidth = Math.max(2, S.em * 0.05) * (1 - q / 0.6) + 1;
      ctx.beginPath(); ctx.ellipse(S.cx, S.cy, R, R * 0.92, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  function drawCracks(ctx, S, t) {
    var p = clamp((t - T.crack) / (T.shatter - T.crack), 0, 1); if (p <= 0) return;
    var R = easeIn(p) * S.diag * 0.75 + S.em * 0.25;
    ctx.lineCap = 'round';
    var passes = [[OUT, Math.max(2.5, S.em * 0.045), 'source-over', 0.95], ['rgb(' + GLOW + ')', Math.max(3, S.em * 0.06), 'lighter', 0.55], [WHITE, Math.max(1, S.em * 0.016), 'source-over', 1]];
    passes.forEach(function (st) {
      ctx.beginPath();
      for (var i = 0; i < S.edges.length; i++) { var e = S.edges[i]; if (e[2] > R) continue; ctx.moveTo(e[0][0], e[0][1]); ctx.lineTo(e[1][0], e[1][1]); }
      ctx.globalCompositeOperation = st[2]; ctx.strokeStyle = st[0]; ctx.lineWidth = st[1]; ctx.globalAlpha = st[3]; ctx.stroke();
    });
    // свет, пробивающийся из центра удара
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 * p;
    var gs = S.em * (1 + 3 * p); ctx.drawImage(S.glowSprite, S.cx - gs, S.cy - gs, gs * 2, gs * 2);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }

  function camera(ctx, S, t) {
    var z = 1 + 0.07 * easeOut(clamp(t / T.shatter, 0, 1)), sx = 0, sy = 0;
    var q = t - T.lock;
    if (q > 0 && q < 0.3) { var a = S.em * 0.06 * Math.exp(-q * 14); sx = Math.sin(q * 90) * a; sy = Math.cos(q * 71) * a; }
    var q2 = t - T.shatter;
    if (q2 > 0 && q2 < 0.3) { var a2 = S.em * 0.09 * Math.exp(-q2 * 12); sx += Math.sin(q2 * 80) * a2; sy += Math.cos(q2 * 63) * a2; }
    ctx.translate(S.cx + sx, S.cy + sy); ctx.scale(z, z); ctx.translate(-S.cx, -S.cy);
  }

  function drawWhole(ctx, S, t, glintPhase) {
    ctx.save();
    drawGlass(ctx, S, easeOut(clamp(t / 0.14, 0, 1)), t);
    camera(ctx, S, t);
    var flash = drawLockFx(ctx, S, t);
    drawIce(ctx, S, t, flash);
    drawSparkles(ctx, S, t);
    drawLetters(ctx, S, t, flash);
    drawBursts(ctx, S, t);
    drawSubtitle(ctx, S, t, '#d6f1ff');
    drawLockFront(ctx, S, t);
    drawGlint(ctx, S, clamp((t - T.glint) / 0.34, 0, 1));
    if (glintPhase) drawGlint(ctx, S, glintPhase);
    drawCracks(ctx, S, t);
    ctx.restore();
  }

  function snapshot(ctx, S) {
    // Один раз в первом кадре: готовый кадр «с трещинами» для осколков
    var m = ctx.getTransform ? ctx.getTransform() : { a: 1 }, sc = m.a || 1;
    var c = document.createElement('canvas');
    c.width = Math.ceil(S.w * sc); c.height = Math.ceil(S.h * sc);
    var x = c.getContext('2d'); x.setTransform(sc, 0, 0, sc, 0, 0);
    drawWhole(x, S, T.shatter - 0.001, 0);
    S.snap = c;
  }

  function drawShatter(ctx, S, t) {
    var life = T.end - T.shatter, q0 = clamp((t - T.shatter) / life, 0, 1);
    for (var i = 0; i < S.cells.length; i++) {
      var c = S.cells[i], q = clamp((t - T.shatter - c.delay * 0.5) / (life - 0.05), 0, 1);
      var a = 1 - easeIn(q); if (a <= 0.01) continue;
      var e = easeOut(q), zz = 1 + c.zoom * e;            // осколки летят на зрителя
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(c.cx + c.vx * e, c.cy + c.vy * e); ctx.rotate(c.rot * e); ctx.scale(zz, zz); ctx.translate(-c.cx, -c.cy);
      ctx.beginPath(); ctx.moveTo(c.poly[0][0], c.poly[0][1]);
      for (var k = 1; k < c.poly.length; k++) ctx.lineTo(c.poly[k][0], c.poly[k][1]);
      ctx.closePath();
      ctx.save(); ctx.clip(); ctx.drawImage(S.snap, 0, 0, S.w, S.h); ctx.restore();
      ctx.lineWidth = Math.max(2, S.em * 0.03) / zz; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.lineWidth = Math.max(1, S.em * 0.014) / zz; ctx.strokeStyle = 'rgba(220,245,255,0.9)'; ctx.stroke();
      ctx.restore();
    }
    // блёстки
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.strokeStyle = WHITE; ctx.lineWidth = Math.max(1, S.em * 0.012);
    ctx.beginPath();
    var e0 = easeOut(q0);
    for (var j = 0; j < S.debris.length; j += 6) {
      var x = S.debris[j] + S.debris[j + 2] * e0, y = S.debris[j + 1] + S.debris[j + 3] * e0 + S.diag * 0.25 * q0 * q0;
      var s = S.debris[j + 4] * (1 - q0) * (0.6 + 0.4 * Math.sin(t * 30 + S.debris[j + 5] * 9)) * S.em * 0.03;
      if (s > 0.3) star(ctx, x, y, s);
    }
    ctx.globalAlpha = 1 - q0; ctx.stroke();
    // вспышка удара
    var f = Math.exp(-(t - T.shatter) * 16);
    if (f > 0.02) { ctx.globalAlpha = f * 0.85; ctx.fillStyle = 'rgb(225,245,255)'; ctx.fillRect(0, 0, S.w, S.h); }
    ctx.restore();
  }

  function drawSplash(ctx, w, h, t, opts) {
    if (!cache || cache.w !== w || cache.h !== h) cache = build(w, h);
    var S = cache;
    ctx.clearRect(0, 0, w, h);
    if (t >= T.end) return false;
    if (!S.snap) snapshot(ctx, S);   // готовим кадр для осколков сразу, пока экран тёмный
    if (t < T.shatter) drawWhole(ctx, S, t, opts && opts.glint);
    else drawShatter(ctx, S, t);
    return true;
  }

  /* ---------- Звук: WebAudio, только после первого касания ---------- */
  var AC = null, master = null, buffers = {};
  var SAMPLES = { shimmer: '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jhV+GzeSOXs9sl2RmK2Mol3nNZtqloLJBmIjrEhlYlS56HTVRP/zUsTbGno+SADKRygrUP+rZ6n9f//I7haPsLfa7JVQjiWBKyYsT2JeuvP8Z+Kuq2kXaw+CqQSohMacGi4socc4ruaosx1jSmWouYKtI/Zm6hvuf1huxl01jEjZ5s2tpQOL6Pa/cjVKo82tICj9lej/3UevT/YqCnIO4SgWOXkBJWBF//NQxOcfAcowAtPMfNlznLfJsMxm2z+x2rNP9KoaidBFWHNhaLcAC2oKAvA3WBJEsM41yeCREGnAGMinGpOnIhBZEtspLmF5uZTgnQNT1NVhH8ZSsAdQEMbNRmVMm/6ZQ8q0NV8n8+5bAg7b2FdqdQGXexDaiy3XerZ/16YJl7BnwP/zUsTgF4l6OBTD0BzSlxtZLPN6tJibbyrkZiLitmtPuNyMsfOgKtheUHy8BIvhDdi/GLp0qqe4pXVTEY+Q2H1qFVi5g99LT3R9+u8zfPZZw96H/hKxYmKocYJCbO1jGStzGCTzKER1d6GOMfQd3CTSRumWuAz2367G7bebetyoo7TU//NSxPce8iIQAsJHKAl4dWp9/3yeYSraSgGYGFhgMIuM0Z7UuP3pXF+T19p2B7Ic/N0fofeQI7M1t6qvkiwdBZVhhtKqDU4gyOqKj2HtkBrWtwiK8SNK1dHZHxarQiGdWbh1sgermHca3unDrrK5Z+dldpZYyVx0K5HPSuyp8SKNnjr/81DE8SGy+fgCywq8C7p2TEFNRaqqqhID/9VCkCQmlpECRNKSpLCVNf3nVyaEw4RcmYcTkQs0IR4SCFfifEYfU8JhxZhfX1K3CiW/oby+Uvt/mNyt//obZBT25V0sVhqRnu2IniU7GPgq6d509QGVakRUVKI2H5v////9Xm5K6u6j//NSxN8bMmHoBHoK7CisVOHTpRdg0SkQyNDQycXUXUXUSThMYUFBA7HQ/6sscjI+yyyyWVlBAwQIsy43HapqTjRQGBCgMo+Li2KLa82W///7s7tNScWUWWVYZAQsKioqKigsaCoqLCwsLC7P//9QqK/iospMQU1FMy4xMDCqqqqqqqr/81DE4RWqydAUSET4qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NSxP8emnDsVEjNaKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=', impact: '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' };
  function unlockAudio() {
    try {
      if (!AC) {
        var C = global.AudioContext || global.webkitAudioContext; if (!C) return;
        AC = (global.Z && global.Z.AU && global.Z.AU.ctx) || new C(); master = AC.createGain(); master.gain.value = 0.75;
        var comp = AC.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 4;
        master.connect(comp); comp.connect((global.Z && global.Z.AU && global.Z.AU.sfxG) || AC.destination);
        Object.keys(SAMPLES).forEach(function (k) {
          var bin = atob(SAMPLES[k]), u = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
          AC.decodeAudioData(u.buffer, function (b) { buffers[k] = b; }, function () {});
        });
      }
      if (AC.state === 'suspended') AC.resume();
    } catch (e) { if (window.__rep) window.__rep(e); }
  }
  function audioOn() { return AC && AC.state === 'running'; }
  var noiseBuf = null;
  function noise() {
    if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 1, AC.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    return noiseBuf;
  }
  function crackle(at, freq, gain, dur, type) {
    var s = AC.createBufferSource(); s.buffer = noise();
    var f = AC.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = 2.5;
    var g = AC.createGain(); g.gain.setValueAtTime(gain, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(at, Math.random() * 0.5, dur + 0.02);
  }
  function ping(at, freq, gain, dur) {
    var o = AC.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(freq, at);
    var g = AC.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(gain, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(master); o.start(at); o.stop(at + dur + 0.02);
  }
  function sub(at, f0, f1, gain, dur) {          // низкий саб-удар
    var o = AC.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f1, at + dur);
    var g = AC.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(gain, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(master); o.start(at); o.stop(at + dur + 0.02);
  }
  function riser(at, dur, gain) {                // нарастающий свист перед ударом
    var s = AC.createBufferSource(); s.buffer = noise();
    var f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 4; f.frequency.setValueAtTime(600, at); f.frequency.exponentialRampToValueAtTime(7000, at + dur);
    var g = AC.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(gain, at + dur * 0.95); g.gain.linearRampToValueAtTime(0, at + dur + 0.02);
    s.connect(f); f.connect(g); g.connect(master); s.start(at, 0, dur + 0.05);
  }
  function sample(name, at, gain) {
    if (!buffers[name]) return;
    var s = AC.createBufferSource(); s.buffer = buffers[name];
    var g = AC.createGain(); g.gain.value = gain; s.connect(g); g.connect(master); s.start(at);
  }
  function stampSfx() { var n = AC.currentTime; sub(n, 140, 55, 0.22, 0.16); crackle(n, 900, 0.16, 0.08); crackle(n + 0.005, 4800, 0.08, 0.03); }
  var SFX = {
    grow: function () {
      var n = AC.currentTime; sample('shimmer', n, 0.22);
      for (var i = 0; i < 16; i++) { var tt = n + 0.06 + Math.pow(i / 16, 0.7) * 0.6 + Math.random() * 0.03; crackle(tt, 2600 + Math.random() * 3500, 0.05 + Math.random() * 0.07, 0.012 + Math.random() * 0.02); }
    },
    s0: stampSfx, s1: stampSfx, s2: stampSfx, s3: stampSfx,
    lock: function () {
      var n = AC.currentTime; sub(n, 90, 32, 0.5, 0.9); crackle(n, 400, 0.18, 0.35, 'lowpass');
      [2093, 2637, 3136, 4186].forEach(function (f, i) { ping(n + 0.03 + i * 0.045, f, 0.04, 0.7); });
    },
    glint: function () { var n = AC.currentTime; [3136, 4186, 5274].forEach(function (f, i) { ping(n + i * 0.06, f, 0.03, 0.45); }); },
    crack: function () {
      var n = AC.currentTime; riser(n, T.shatter - T.crack, 0.12);
      for (var i = 0; i < 7; i++) crackle(n + i * 0.022, 3000 + Math.random() * 3000, 0.12, 0.02);
    },
    shatter: function () {
      var n = AC.currentTime; sample('impact', n, 0.55); sub(n, 75, 28, 0.55, 0.7); crackle(n, 1800, 0.28, 0.14);
      for (var i = 0; i < 40; i++) {
        var tt = n + 0.03 + Math.pow(Math.random(), 1.6) * 0.65;
        if (i % 3) ping(tt, 2400 + Math.random() * 4600, 0.015 + Math.random() * 0.03, 0.06 + Math.random() * 0.2);
        else crackle(tt, 3000 + Math.random() * 4000, 0.05 + Math.random() * 0.06, 0.015 + Math.random() * 0.03);
      }
    }
  };

  /* ---------- Готовый запуск ---------- */
  function start(canvas, opts) {
    opts = opts || {};
    var isReady = opts.isReady || function () { return true; };
    var ctx = canvas.getContext('2d'), dpr = 1, cw = 0, ch = 0;
    var t = 0, last = 0, speed = 1, done = false, holdT = 0, raf = 0, shattered = false;
    var cues = [['grow', T.grow], ['s0', T.stamp[0] + 0.1], ['s1', T.stamp[1] + 0.1], ['s2', T.stamp[2] + 0.1], ['s3', T.stamp[3] + 0.1],
                ['lock', T.lock], ['glint', T.glint], ['crack', T.crack], ['shatter', T.shatter]], fired = {};
    function resize() {
      dpr = Math.min(global.devicePixelRatio || 1, opts.maxDpr || 2);
      cw = canvas.clientWidth || global.innerWidth; ch = canvas.clientHeight || global.innerHeight;
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function skip() {
      if (done || t >= T.shatter) return;
      if (!isReady()) { if (t < T.hold) t = T.hold; return; }   // игра ещё грузится — держим логотип
      t = T.shatter; speed = 1.5;
      cues.forEach(function (c) { if (c[0] !== 'shatter') fired[c[0]] = true; });
    }
    function finish() {
      done = true; global.cancelAnimationFrame(raf);
      global.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', skip); global.removeEventListener('keydown', skip);
      ctx.clearRect(0, 0, cw, ch);
      if (opts.onDone) opts.onDone();
    }
    function frame(now) {
      if (done) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      if (opts.paused && opts.paused()) { raf = global.requestAnimationFrame(frame); return; }   // свёрнуто — стоим
      var glint = 0;
      if (t + dt * speed >= T.hold && t < T.shatter && speed === 1 && !isReady()) {
        t = T.hold; holdT += dt; glint = (holdT % 1.8) / 0.4;   // держим логотип и повторяем блик
      } else t += dt * speed;
      if (opts.sound !== false && audioOn()) cues.forEach(function (c) { if (!fired[c[0]] && t >= c[1]) { fired[c[0]] = true; SFX[c[0]](); } });
      if (!shattered && t >= T.shatter) { shattered = true; if (opts.onShatter) opts.onShatter(); }   // стекло бьётся — под ним уже игра
      if (!drawSplash(ctx, cw, ch, t, { glint: glint > 0 && glint < 1 ? glint : 0 })) { finish(); return; }
      raf = global.requestAnimationFrame(frame);
    }
    resize();
    global.addEventListener('resize', resize);
    canvas.addEventListener('pointerdown', skip); global.addEventListener('keydown', skip);
    raf = global.requestAnimationFrame(frame);
    return { skip: skip, stop: finish };
  }

  global.drawSplash = drawSplash;
  global.IneySplash = { start: start, drawSplash: drawSplash, unlockAudio: unlockAudio, DURATION: DURATION, TIMELINE: T };
})(window);

/* ---------- Запуск игры: обложка с загрузкой → «Играть» → студия Godunov Goxvpe (только первый раз, 2,6 с) → «Иней» → экран игры ---------- */
(function () {
  var Z = window.Z, CSS = "\n@font-face{font-family:'Cinzel';font-weight:500;font-display:block;src:url(data:font/woff2;base64,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) format('woff2')}\n@font-face{font-family:'Cinzel';font-weight:600 700;font-display:block;src:url(data:font/woff2;base64,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) format('woff2')}\nhtml,body{margin:0;height:100%;overflow:hidden;background:#050102}\n#fit{position:fixed;left:0;top:0;width:1280px;height:720px;transform-origin:0 0;visibility:hidden;z-index:3}\n#fit > div{width:100% !important;height:100% !important}\n#iney{position:fixed;inset:0;width:100%;height:100%;display:none;z-index:5}\n#game{position:fixed;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 40%,#2f6b4f 0%,#163526 60%,#0b1a13 100%);color:#d9f5e6;font:700 clamp(18px,4vw,36px)/1.2 system-ui,-apple-system,\"Segoe UI\",Roboto,Arial,sans-serif;text-align:center}\n#gate{position:fixed;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;background:#050102}\n#gate button,#again{font:600 18px Cinzel,serif;letter-spacing:.12em;color:#EBDDBB;background:rgba(20,4,6,.85);border:1px solid #C8A04E;border-radius:6px;min-height:56px;padding:0 30px;cursor:pointer}\n#again{position:fixed;left:50%;bottom:max(24px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:11;font-size:15px;min-height:48px;display:none}\n\na{color:#C8A04E}a:hover{color:#EBDDBB}\n.gg-stage{animation:ggStage 12s ease-in-out infinite both}\n@keyframes ggStage{0%{opacity:0}4%{opacity:1}93%{opacity:1}100%{opacity:0}}\n.gg-bg{background:radial-gradient(ellipse at 50% 38%,#5a1a1c 0%,#2a0a0d 38%,#120305 70%,#050102 100%);background-size:cover;background-position:center;animation:ggBg 12s ease-out infinite both}\n@keyframes ggBg{0%{transform:scale(1.18);opacity:0;filter:blur(6px)}14%{opacity:1;filter:blur(2px)}100%{transform:scale(1.04);opacity:1;filter:blur(2px)}}\n.gg-shake{animation:ggShake 12s linear infinite both}\n@keyframes ggShake{0%,45.5%{transform:translate(0,0)}46%{transform:translate(-5px,3px)}46.6%{transform:translate(4px,-4px)}47.2%{transform:translate(-3px,2px)}47.8%{transform:translate(2px,-1px)}48.4%,100%{transform:translate(0,0)}}\n.gg-halo{animation:ggHalo 12s ease-out infinite both}\n@keyframes ggHalo{0%,10%{opacity:0;transform:scale(.6)}30%{opacity:.7;transform:scale(1)}46%{opacity:.7}48%{opacity:1;transform:scale(1.15)}62%,100%{opacity:.6;transform:scale(1)}}\n.gg-frame{animation:ggFrame 12s cubic-bezier(.16,.84,.24,1) infinite both}\n@keyframes ggFrame{0%,7%{opacity:0;transform:scale(.55) rotate(-40deg);filter:blur(10px) brightness(2)}26%{opacity:1;transform:scale(1.02) rotate(2deg);filter:blur(0) brightness(1.2)}32%,100%{opacity:1;transform:scale(1) rotate(0);filter:blur(0) brightness(1)}}\n.gg-portrait{animation:ggPortrait 12s cubic-bezier(.2,.7,.2,1) infinite both}\n@keyframes ggPortrait{0%,18%{opacity:0;transform:scale(1.25);filter:brightness(3) blur(6px)}34%{opacity:1;filter:brightness(1.4) blur(0)}44%,100%{opacity:1;transform:scale(1);filter:brightness(1) blur(0)}}\n.gg-crown{animation:ggCrown 12s cubic-bezier(.55,0,.75,.2) infinite both}\n@keyframes ggCrown{0%,30%{opacity:0;transform:translateY(-150px) scale(1.15)}36%{opacity:1}46%{transform:translateY(0) scale(1)}47.5%{transform:translateY(-6px) scale(1)}49%,100%{opacity:1;transform:translateY(0) scale(1)}}\n.gg-burst{animation:ggBurst 12s ease-out infinite both}\n@keyframes ggBurst{0%,45.5%{opacity:0;transform:scale(.3)}47%{opacity:1;transform:scale(1)}60%,100%{opacity:0;transform:scale(1.8)}}\n.gg-flash{animation:ggFlash 12s ease-out infinite both}\n@keyframes ggFlash{0%,45.6%{opacity:0}46.2%{opacity:.85}50.5%,100%{opacity:0}}\n.gg-sound{opacity:.42;transition:opacity .25s}.gg-sound:hover,.gg-sound:focus-visible{opacity:1}\n.gg-ring{animation:ggRingWave 12s ease-out infinite both}\n@keyframes ggRingWave{0%,45.8%{opacity:0;transform:scale(.55)}46.6%{opacity:1}60%,100%{opacity:0;transform:scale(2.6)}}\n.gg-ring2{animation:ggRingWave2 12s ease-out infinite both}\n@keyframes ggRingWave2{0%,46.4%{opacity:0;transform:scale(.6)}47.4%{opacity:.6}66%,100%{opacity:0;transform:scale(3.4)}}\n.gg-title{background:linear-gradient(100deg,#9C7632 0%,#C8A04E 40%,#FFF6DA 50%,#C8A04E 60%,#9C7632 100%);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 6px rgba(0,0,0,.85));animation:ggTitle 12s cubic-bezier(.2,.7,.2,1) infinite both}\n@keyframes ggTitle{0%,50%{opacity:0;letter-spacing:.5em;background-position:100% 0}63%{opacity:1;letter-spacing:.16em;background-position:100% 0}78%{background-position:0% 0}100%{opacity:1;letter-spacing:.16em;background-position:0% 0}}\n.gg-rule{transform-origin:right center;animation:ggRule 12s cubic-bezier(.65,0,.35,1) infinite both}\n.gg-rule-r{transform-origin:left center;animation:ggRule 12s cubic-bezier(.65,0,.35,1) infinite both}\n@keyframes ggRule{0%,58%{transform:scaleX(0);opacity:0}70%,100%{transform:scaleX(1);opacity:1}}\n.gg-sub{animation:ggSub 12s ease-out infinite both}\n@keyframes ggSub{0%,62%{opacity:0;transform:translateY(10px)}72%,100%{opacity:1;transform:translateY(0)}}\n.gg-est{animation:ggEst 12s ease-out infinite both}\n@keyframes ggEst{0%,68%{opacity:0}78%,100%{opacity:1}}\n.gg-progress{transform-origin:left center;animation:ggProgress 12s cubic-bezier(.55,0,.25,1) infinite both}\n@keyframes ggProgress{0%,66%{transform:scaleX(0)}91%,100%{transform:scaleX(1)}}\n.gg-ember{position:absolute;bottom:-20px;border-radius:50%;background:#FFD27A;box-shadow:0 0 8px 2px rgba(255,180,80,.8);animation:ggEmber linear infinite}\n@keyframes ggEmber{0%{transform:translate(0,0);opacity:0}10%{opacity:.9}80%{opacity:.6}100%{transform:translate(40px,calc(var(--H,720px) * -1.05));opacity:0}}\n.gg-rays{animation:ggRays 12s ease-in-out infinite both}\n@keyframes ggRays{0%,8%{opacity:0}30%{opacity:.5}50%{opacity:.75}100%{opacity:.45}}\n\n\n#zs-fit > div{width:100% !important;height:100% !important}\n.gg-flash{background:radial-gradient(ellipse 45% 40% at 50% 40%, rgba(255,232,180,0.75) 0%, rgba(255,190,100,0.28) 35%, rgba(255,160,60,0) 70%) !important}\n#zs-fit.zs-port .gg-flash{background:radial-gradient(ellipse 60% 25% at 50% 45%, rgba(255,232,180,0.75) 0%, rgba(255,190,100,0.28) 35%, rgba(255,160,60,0) 70%) !important}\n#zs-fit.zs-quick [class*=\"gg-\"]:not(.gg-ember):not(.gg-sound){animation-duration:2.6s !important}\n#zs-fit.zs-pause *{animation-play-state:paused !important}\n#zs-fit.zs-port .gg-title{font-size:40px !important}\n#zs-fit.zs-port .gg-sub{font-size:15px !important}\n.gg-bokeh{position:absolute;inset:0;overflow:hidden}\n.gg-bokeh i{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,214,140,.55) 0%,rgba(255,180,90,.18) 45%,rgba(255,160,60,0) 70%);animation:ggBokeh linear infinite}\n@keyframes ggBokeh{0%{transform:translate(0,0) scale(1);opacity:0}15%{opacity:1}85%{opacity:.8}100%{transform:translate(30px,-90px) scale(1.15);opacity:0}}\n/* 2.11.4: \u0437\u0438\u043c\u043d\u044f\u044f \u043d\u043e\u0447\u044c \u0432\u043c\u0435\u0441\u0442\u043e \u0431\u043e\u0440\u0434\u043e\u0432\u043e\u0433\u043e \u0431\u0430\u0440\u0445\u0430\u0442\u0430 \u2014 \u043f\u043e\u0434 \u044d\u043c\u0431\u043b\u0435\u043c\u0443-\u0441\u043d\u0435\u0436\u0438\u043d\u043a\u0443 \u0438 \u0441\u0442\u0438\u043b\u044c \u0438\u0433\u0440\u044b */\n.gg-bg{background:radial-gradient(ellipse at 50% 38%,#2a55a8 0%,#14306e 36%,#0a1840 68%,#040a1f 100%) !important}\n.gg-bokeh i{background:radial-gradient(circle,rgba(190,225,255,.5) 0%,rgba(140,195,255,.16) 45%,rgba(120,180,255,0) 70%) !important}\n.gg-rays{background:conic-gradient(from 180deg at 50% 0%,transparent 0deg,rgba(200,230,255,.12) 8deg,transparent 16deg,transparent 22deg,rgba(200,230,255,.09) 28deg,transparent 36deg,transparent 330deg,rgba(200,230,255,.1) 338deg,transparent 346deg) !important}\n.gg-rays{-webkit-mask-image:radial-gradient(ellipse 50% 70% at 50% 0%,#000 40%,transparent 100%);mask-image:radial-gradient(ellipse 50% 70% at 50% 0%,#000 40%,transparent 100%)}\n.gg-halo{background:radial-gradient(circle,rgba(170,215,255,.32) 0%,rgba(90,150,255,.13) 35%,rgba(0,0,0,0) 65%) !important}\n.gg-ember{top:-20px !important;bottom:auto !important;background:#fff !important;box-shadow:0 0 6px 1px rgba(200,230,255,.9) !important;animation-name:ggSnowFall !important}\n@keyframes ggSnowFall{0%{transform:translate(0,0);opacity:0}10%{opacity:.9}100%{transform:translate(40px,110vh);opacity:.6}}\n.gg-flash{background:radial-gradient(ellipse 45% 40% at 50% 40%,rgba(225,240,255,.8) 0%,rgba(160,210,255,.3) 35%,rgba(120,180,255,0) 70%) !important}\n#zs-fit.zs-port .gg-flash{background:radial-gradient(ellipse 60% 25% at 50% 45%,rgba(225,240,255,.8) 0%,rgba(160,210,255,.3) 35%,rgba(120,180,255,0) 70%) !important}\n", HTML = "<div style=\"width: 1280px; height: 720px; position: relative; overflow: hidden; background: #050102\">\n<div class=\"gg-stage\" style=\"position: absolute; inset: 0; overflow: hidden\">\n<div class=\"gg-bg\" aria-hidden=\"true\" style=\"position: absolute; inset: -20px\"><div class=\"gg-bokeh\"><i style=\"left:8%;top:62%;width:140px;height:140px;animation-duration:14s;animation-delay:-3s\"></i><i style=\"left:22%;top:30%;width:90px;height:90px;animation-duration:11s;animation-delay:-7s\"></i><i style=\"left:36%;top:70%;width:170px;height:170px;animation-duration:16s;animation-delay:-1s\"></i><i style=\"left:64%;top:26%;width:120px;height:120px;animation-duration:13s;animation-delay:-5s\"></i><i style=\"left:78%;top:58%;width:190px;height:190px;animation-duration:17s;animation-delay:-9s\"></i><i style=\"left:90%;top:22%;width:80px;height:80px;animation-duration:10s;animation-delay:-2s\"></i><i style=\"left:50%;top:80%;width:110px;height:110px;animation-duration:12s;animation-delay:-6s\"></i><i style=\"left:14%;top:14%;width:70px;height:70px;animation-duration:9s;animation-delay:-4s\"></i></div></div>\n<div aria-hidden=\"true\" style=\"position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 42%, rgba(60,8,12,0.35) 0%, rgba(20,3,5,0.78) 55%, rgba(5,1,2,0.97) 100%)\"></div>\n<div class=\"gg-rays\" aria-hidden=\"true\" style=\"position: absolute; left: calc(50% - 300px); top: -120px; width: 600px; height: 760px; background: conic-gradient(from 180deg at 50% 0%, transparent 0deg, rgba(255,214,140,0.10) 8deg, transparent 16deg, transparent 22deg, rgba(255,214,140,0.08) 28deg, transparent 36deg, transparent 324deg, rgba(255,214,140,0.08) 332deg, transparent 338deg, transparent 344deg, rgba(255,214,140,0.10) 352deg, transparent 360deg)\"></div>\n\n<div aria-hidden=\"true\" style=\"position: absolute; inset: 0; pointer-events: none\">\n<div class=\"gg-ember\" style=\"left: 9.38%; width: 3px; height: 3px; animation-duration: 9s; animation-delay: -1s\"></div>\n<div class=\"gg-ember\" style=\"left: 16.41%; width: 2px; height: 2px; animation-duration: 11s; animation-delay: -6s\"></div>\n<div class=\"gg-ember\" style=\"left: 23.44%; width: 4px; height: 4px; animation-duration: 8s; animation-delay: -3s\"></div>\n<div class=\"gg-ember\" style=\"left: 29.69%; width: 2px; height: 2px; animation-duration: 12s; animation-delay: -9s\"></div>\n<div class=\"gg-ember\" style=\"left: 35.16%; width: 3px; height: 3px; animation-duration: 10s; animation-delay: -4s\"></div>\n<div class=\"gg-ember\" style=\"left: 40.62%; width: 2px; height: 2px; animation-duration: 9.5s; animation-delay: -7s\"></div>\n<div class=\"gg-ember\" style=\"left: 59.38%; width: 3px; height: 3px; animation-duration: 10.5s; animation-delay: -2s\"></div>\n<div class=\"gg-ember\" style=\"left: 64.84%; width: 2px; height: 2px; animation-duration: 8.5s; animation-delay: -5s\"></div>\n<div class=\"gg-ember\" style=\"left: 70.31%; width: 4px; height: 4px; animation-duration: 11.5s; animation-delay: -8s\"></div>\n<div class=\"gg-ember\" style=\"left: 76.56%; width: 2px; height: 2px; animation-duration: 9s; animation-delay: -0.5s\"></div>\n<div class=\"gg-ember\" style=\"left: 82.81%; width: 3px; height: 3px; animation-duration: 12s; animation-delay: -10s\"></div>\n<div class=\"gg-ember\" style=\"left: 89.84%; width: 2px; height: 2px; animation-duration: 10s; animation-delay: -3.5s\"></div>\n<div class=\"gg-ember\" style=\"left: 50.00%; width: 2px; height: 2px; animation-duration: 13s; animation-delay: -6.5s\"></div>\n<div class=\"gg-ember\" style=\"left: 4.69%; width: 2px; height: 2px; animation-duration: 10s; animation-delay: -8.5s\"></div>\n</div>\n\n<div class=\"gg-shake\" style=\"position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Cinzel', serif; color: #EBDDBB\">\n\n<div style=\"position: relative; width: 360px; height: 360px; flex-shrink: 0\">\n<div class=\"gg-halo\" aria-hidden=\"true\" style=\"position: absolute; left: -120px; top: -120px; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(255,200,110,0.30) 0%, rgba(200,120,50,0.12) 35%, rgba(0,0,0,0) 65%)\"></div>\n<div style=\"position: absolute; left: 0; top: 0; width: 360px; height: 360px\">\n<div style=\"position: absolute; left: 88px; top: 88px; width: 184px; height: 184px; border-radius: 50%; overflow: hidden\">\n<img class=\"gg-portrait\" src=\"splash_portrait.webp\" alt=\"\u042d\u043c\u0431\u043b\u0435\u043c\u0430 \u0441\u0442\u0443\u0434\u0438\u0438\" style=\"width: 184px; height: 184px; object-fit: cover; display: block\">\n</div>\n<img class=\"gg-frame\" src=\"splash_frame.webp\" alt=\"\" aria-hidden=\"true\" style=\"position: absolute; left: 0; top: 0; width: 360px; height: 360px; display: block; filter: drop-shadow(0 10px 24px rgba(0,0,0,0.8))\">\n<div class=\"gg-ring\" aria-hidden=\"true\" style=\"position: absolute; left: 30px; top: 30px; width: 300px; height: 300px; border-radius: 50%; border: 3px solid rgba(255,236,190,0.95); box-shadow: 0 0 22px 6px rgba(255,196,100,0.65), inset 0 0 22px 6px rgba(255,196,100,0.5)\"></div>\n<div class=\"gg-ring2\" aria-hidden=\"true\" style=\"position: absolute; left: 30px; top: 30px; width: 300px; height: 300px; border-radius: 50%; border: 1px solid rgba(255,226,160,0.7); box-shadow: 0 0 40px 10px rgba(255,170,70,0.35)\"></div>\n</div>\n<div class=\"gg-burst\" aria-hidden=\"true\" style=\"position: absolute; left: 30px; top: 30px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(255,246,214,0.95) 0%, rgba(255,200,110,0.5) 25%, rgba(255,160,60,0) 60%)\"></div>\n\n</div>\n\n<h1 class=\"gg-title\" style=\"margin: 18px 0 0; font-family: 'Cinzel', serif; font-weight: 600; font-size: 54px; line-height: 1.15; letter-spacing: 0.16em; padding-left: 0.16em; white-space: nowrap\">GODUNOV GOXVPE</h1>\n<div style=\"display: flex; align-items: center; gap: 22px; margin-top: 4px\">\n<div class=\"gg-rule\" aria-hidden=\"true\" style=\"width: 170px; height: 1px; background: linear-gradient(90deg, rgba(200,160,78,0), #C8A04E)\"></div>\n<p class=\"gg-sub\" style=\"margin: 0; font-family: 'Cinzel', serif; font-weight: 500; font-size: 19px; letter-spacing: 0.72em; padding-left: 0.72em; color: #EBDDBB; text-shadow: 0 2px 6px rgba(0,0,0,0.9)\">CORPORATION</p>\n<div class=\"gg-rule-r\" aria-hidden=\"true\" style=\"width: 170px; height: 1px; background: linear-gradient(90deg, #C8A04E, rgba(200,160,78,0))\"></div>\n</div>\n<p class=\"gg-est\" style=\"margin: 10px 0 0; font-family: 'Cinzel', serif; font-weight: 500; font-size: 12px; letter-spacing: 0.55em; padding-left: 0.55em; color: #D2AE62; text-shadow: 0 2px 6px rgba(0,0,0,0.9)\">EST. MMXXVI</p>\n<div class=\"gg-est\" style=\"margin-top: 22px; width: 340px; height: 1px; background: rgba(200,160,78,0.22)\">\n<div class=\"gg-progress\" style=\"width: 100%; height: 1px; background: #F0D48E; box-shadow: 0 0 6px rgba(255,210,130,0.9)\"></div>\n</div>\n</div>\n\n<div class=\"gg-flash\" aria-hidden=\"true\" style=\"position: absolute; inset: 0; background: radial-gradient(ellipse 55% 60% at 50% 30%, rgba(255,232,180,0.75) 0%, rgba(255,190,100,0.28) 35%, rgba(255,160,60,0) 70%); mix-blend-mode: screen\"></div>\n</div>\n</div>", SND = 'splash_studio.mp3';
  var sndPr = null; function sndP() { if (!sndPr) sndPr = fetch(SND).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }); return sndPr; }
  try { if (!/"splash":1/.test(localStorage.getItem('elka2_save') || '')) setTimeout(function () { sndP().catch(function () { }); }, 1500); } catch (e) { }   // заставку студии видят только в первый раз — звук качаем заранее только тогда
  var preload, root, fit, cv, gate, W = 1280, H = 720, state = '', opts = {}, buf = null, src = null, clk = 0, aT0 = 0, lastP = 0, raf = 0, from = 0, readyFlag = false, readyT = 0, revealed = false;
  var GD = 12, QUICK = false, HIT = 5.55;   // студийная заставка: 12 с при первом запуске, дальше та же анимация за 4 с; HIT — удар в музыке
  function paused() { return Z.hidden || Z.adShowing || (Z.SDK && Z.SDK.sdkPaused); }
  function en() { return Z.LANG === 'en'; }
  function layout() {
    if (!fit) return;
    var vw = innerWidth, vh = innerHeight;
    // сцена под пропорции экрана: фон на весь экран без полей по бокам, содержимое (по центру) целиком влезает
    if (vw >= vh) { W = 1280; H = Math.round(1280 * vh / vw); if (H < 600) { H = 600; W = Math.round(600 * vw / vh); } }
    else { W = 720; H = Math.round(720 * vh / vw); }
    var k = vw / W, ox = 0, oy = (vh - H * k) / 2;
    fit.style.width = W + 'px'; fit.style.height = H + 'px'; fit.style.setProperty('--H', H + 'px'); fit.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + k + ')';
  }
  // ---- 1. тёмный экран загрузки и кнопка старта (в стиле студии) ----
  function gateTick() {
    if (state !== 'gate') return;
    var AU = Z.AU, ps = window.__LD ? Math.min(window.__LD.progress(), AU && AU.total ? 0.15 + 0.85 * AU.loaded / AU.total : 1) : AU && AU.total ? AU.loaded / AU.total : 0, done = !!Z.loadDone;
    var pr = 0.35 + 0.65 * ps;   // 2.11.5: одна полоса на всю загрузку: код игры — первые 35% (экран до заставки), звуки — остальное
    var tt = en() ? 'Save the Tree!' : 'Защити Ёлку!'; if (gate.title.textContent !== tt) gate.title.textContent = tt;   // язык известен не сразу
    gate.bar.style.transform = 'scaleX(' + (done ? 1 : Math.max(0.03, pr)) + ')';
    if (!gate.bootGone) { gate.bootGone = 1; gate.bar.style.transition = 'none'; gate.bar.style.transform = 'scaleX(' + (done ? 1 : Math.max(0.03, pr)) + ')'; void gate.bar.offsetWidth; gate.bar.style.transition = ''; try { var bt = document.getElementById('boot'); if (bt) bt.parentNode.removeChild(bt); } catch (e) { if (window.__rep) window.__rep(e); } }   // 2.11.5: экран загрузки кода сменяется этим же экраном без скачка полосы
    gate.pct.textContent = (en() ? 'LOADING ' : 'ЗАГРУЗКА ') + Math.round((done ? 1 : pr) * 100) + '%';
    if (done && !gate.pf && Z.pakPrefetch) { gate.pf = 1; Z.pakPrefetch().then(function () { readyFlag = true; }); }   // 2.11.4: звуки качаются, пока игрок смотрит на обложку
    if (done && !gate.shown) {
      gate.shown = true; gate.load.style.opacity = '0'; gate.pct.style.opacity = '0';
      gate.btn.textContent = en() ? '▶ PLAY' : '▶ ИГРАТЬ'; gate.btn.style.display = 'block';
    }
    raf = requestAnimationFrame(gateTick);
  }
  function begin() {
    if (state !== 'gate' || !Z.loadDone) return;
    if (Z.AU) Z.AU.unlock();   // жест игрока — можно включать звук
    cancelAnimationFrame(raf); gate.el.style.display = 'none';
    from = 0; QUICK = !!(Z.save && Z.save.seen && Z.save.seen.splash) || !(Z.FLAG && Z.FLAG('splash_long', 0)); GD = QUICK ? 2.6 : 12;   // длинная (12 с) — только если включить флаг splash_long в консоли: новичок быстрее попадает в игру   // сжатая версия — та же анимация целиком, только быстрее
    readyT = Z.time;
    if (Z.pakPrefetch) Z.pakPrefetch().then(function () { readyFlag = true; }); else readyFlag = true;
    IneySplash.unlockAudio();
    // 2.11.4: повторный запуск — без заставки студии, сразу короткий «Иней» (он же ждёт звуки)
    if (Z.save && Z.save.seen && Z.save.seen.splash) { state = 'studio'; toIney(); return; }
    state = 'wait';
    var AC = Z.AU && Z.AU.ctx, started = false, go = function () { if (!started) { started = true; startStudio(); } };
    if (AC) {
      try {
        // 2.12.17: звук заставки — отдельным файлом (раньше 377 КБ внутри скрипта задерживали загрузку игры у всех)
        sndP().then(function (ab) { AC.decodeAudioData(ab, function (b) { buf = b; go(); }, function () { go(); }); }, go);
      } catch (e) { go(); }
      setTimeout(go, 700);   // звук не успел — начинаем без него
    } else go();
  }
  // ---- 2. студия ----
  function clock() { return src ? (Z.AU.ctx.currentTime - aT0) : clk; }
  function tick(now) {
    if (state !== 'studio') return;
    var dt = lastP ? Math.min(0.05, (now - lastP) / 1000) : 0; lastP = now;
    if (!paused()) clk += dt;
    var t = clock(), p = paused();
    if (fit.classList.contains('zs-pause') !== p) fit.classList.toggle('zs-pause', p);   // свернули — CSS-анимация встаёт
    if (t >= GD) { toIney(); return; }
    raf = requestAnimationFrame(tick);
  }
  function startStudio() {
    state = 'studio'; clk = from; lastP = 0;
    fit.className = (QUICK ? 'zs-quick' : '') + (innerWidth < innerHeight ? ' zs-port' : ''); fit.innerHTML = HTML; layout(); fit.style.visibility = 'visible';
    var AC = Z.AU.ctx;
    if (AC && buf && Z.AU.musG) {
      var t0 = AC.currentTime + 0.05, g = AC.createGain(); g.gain.value = 1.1; g.connect(Z.AU.musG);
      src = AC.createBufferSource(); src.buffer = buf; src.connect(g); src._g = g; aT0 = t0;
      if (!QUICK) src.start(t0);
      else {
        // быстрая версия: вступление до удара анимации (46%), затем сразу удар из музыки
        var hitAt = GD * 0.46, ga = AC.createGain(); src.disconnect(); src.connect(ga); ga.connect(g);
        ga.gain.setValueAtTime(1, t0); ga.gain.setValueAtTime(1, t0 + hitAt - 0.12); ga.gain.linearRampToValueAtTime(0, t0 + hitAt);
        src.start(t0, 0); src.stop(t0 + hitAt + 0.02);
        var s2 = AC.createBufferSource(); s2.buffer = buf; s2.connect(g); s2.start(t0 + hitAt - 0.03, HIT - 0.03); src._s2 = s2;
      }
    }
    raf = requestAnimationFrame(tick);
  }
  function stopMusic(fade) {
    if (!src) return; var AC = Z.AU.ctx;
    try { var n = AC.currentTime; src._g.gain.setValueAtTime(src._g.gain.value, n); src._g.gain.linearRampToValueAtTime(0, n + fade); src.stop(n + fade + 0.02); if (src._s2) src._s2.stop(n + fade + 0.02); } catch (e) { if (window.__rep) window.__rep(e); }
    clk = clock(); src = null;
  }
  // ---- 3. «Иней»: держит логотип, пока докачиваются голоса и звуки ----
  function isReady() { return readyFlag || (Z.time - readyT > 2.5); }   // 2.12.24: «Иней» ждёт пачку эффектов не дольше 2,5 с (было 8) — в меню они не нужны, к бою докачаются   // 2.11.4: ждём звуки эффектов до 8 с (раньше 4 — на медленной сети звуки не успевали)
  function toIney() {
    if (state !== 'studio') return;
    state = 'iney'; cancelAnimationFrame(raf); stopMusic(0.25);
    fit.style.visibility = 'hidden'; fit.innerHTML = '';
    cv.style.display = 'block';
    IneySplash.start(cv, { isReady: isReady, paused: paused, onShatter: reveal, onDone: finish });
  }
  // ---- 4. стекло бьётся — под ним экран игры «Защити Ёлку!» ----
  function reveal() {
    if (revealed) return; revealed = true;
    Z.splashOn = false; root.style.background = 'transparent'; root.style.pointerEvents = 'none';
    if (Z.save && Z.save.seen) { Z.save.seen.splash = 1; if (Z.persist) Z.persist(); }
    if (opts.onReveal) opts.onReveal();
  }
  function finish() {
    reveal(); state = '';
    window.removeEventListener('resize', layout); window.removeEventListener('keydown', onKey, true);
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = fit = cv = gate = preload = null; buf = null;
  }
  function onKey(e) {
    if (state === 'gate') { e.stopPropagation(); if (e.code === 'Enter' || e.code === 'Space') begin(); }
    else if (state === 'studio') { e.stopPropagation(); toIney(); }
    else if (state === 'iney' || state === 'wait') e.stopPropagation();
  }
  Z.splash = {
    // показывается сразу при открытии страницы, раньше всего остального
    mount: function (o) {
      opts = o || {}; revealed = false; Z.splashOn = true; state = 'gate';
      root = document.createElement('div'); root.id = 'zsplash';
      root.style.cssText = 'position:fixed;inset:0;z-index:20;background:#050102;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none';
      root.innerHTML = '<style>' + CSS + '#zs-gate{position:fixed;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:max(8vh,30px);box-sizing:border-box;background:url(cover.webp) 45% 40%/cover no-repeat,url(data:image/webp;base64,UklGRvQBAABXRUJQVlA4IOgBAADwCgCdASowABsAPsFSoUqnpSMhsBqqqPAYCWwAnTLLu07XOrhy9tjdpMoB0v+HBc6gX7/HFXCXz8cUthehf1qE42PNNbnEY7f/bDlyDymXdH8PIOXqUrgwUgPqzIN9DAAA/vaorZMiD2kEjofQinpWJQevbU3RJxU6qhe77gXV2cO4/gGfA6Q9dOZLXu8IQsHZXi3sTnuG9s0gFzii/nVI3XqHOd7/brtOrwVC4e/7NaEAS4hNwlws7xzcMwU1eyz5xOGrg+BQ1ReZoSJyDwMvLLJrFglxFspnFgjjiCu6I8NupJvOFdeBJullPBkcv/fFRR3vLYHHaQRRPtyaFV1OwA2c5o7svknS7x6DjkVteAX2dsONHsuKBIRSf/O8yv/81vzZ615PIh9OGlkKS+rjdxhEDjZR7HM0/Lkq/vwC+htVQeZOZhkScHjRj0kkvbZs3SNz19MNeKgCec0RFdXEhbGFpdqjJI4h5ojjHOUKCer8FQxaL6QfHo9qD2We4ZvwYG2pYjlliZJ68Npnd2OUaP3TeyW2UUP3k402TaPIRbWfN8p4ocadxKLDTq5EWeCKA4UR97LZ0ogojWu7mGIx5cotCR7GW5s/nkNF42y93rsOEMCQ5mqt9B0Wta/SVlekFFv0VuwAAA==) 45% 40%/cover no-repeat,#1b2448}' +
        '#zs-gate:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,14,44,0) 35%,rgba(11,14,44,.85) 100%)}#zs-gate>*{position:relative}' +
        '#zs-title{font:400 min(12vw,92px)/1.1 ElkaRubik,"Arial Black",sans-serif;color:#ffd54a;-webkit-text-stroke:min(1.5vw,11px) #1b2448;paint-order:stroke fill;text-shadow:0 .07em 0 #1b2448;transform:rotate(-2deg);margin-bottom:min(4vh,30px);white-space:nowrap;animation:zsIn .6s ease-out both}' +
        '#zs-gate button{font:400 min(8vw,34px) ElkaRubik,"Arial Black",sans-serif;color:#fff;-webkit-text-stroke:5px #1b2448;paint-order:stroke fill;background:linear-gradient(180deg,#6be39b,#2fa864);border:4px solid #1b2448;border-radius:20px;min-height:70px;min-width:min(70vw,300px);padding:0 40px;cursor:pointer;display:none;box-shadow:0 7px 0 #1b2448,0 0 26px rgba(120,255,170,.35);animation:zsPulse 1.4s ease-in-out infinite}' +
        '@keyframes zsPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes zsIn{from{opacity:0;transform:rotate(-2deg) translateY(20px)}to{opacity:1;transform:rotate(-2deg)}}' +
        '#zs-pct{font:400 15px ElkaRubik,"Arial Black",sans-serif;letter-spacing:.08em;color:#fff;-webkit-text-stroke:3px #1b2448;paint-order:stroke fill;transition:opacity .3s;margin-bottom:10px}#zs-load{transition:opacity .3s;width:min(60vw,320px);height:12px;border-radius:6px;background:rgba(27,36,72,.75);border:3px solid #1b2448;overflow:hidden}#zs-bar{height:100%;background:linear-gradient(90deg,#ffd54a,#ffb02e);transform-origin:left center;transform:scaleX(.03);transition:transform .25s}</style>' +
        '<div id="zs-fit" style="position:fixed;left:0;top:0;width:1280px;height:720px;transform-origin:0 0;visibility:hidden;z-index:3"></div>' +
        '<canvas id="zs-iney" style="position:fixed;inset:0;width:100%;height:100%;display:none;z-index:5"></canvas>' +
        '<div id="zs-gate"><div id="zs-title"></div><button type="button" id="zs-go"></button><div id="zs-pct"></div><div id="zs-load"><div id="zs-bar"></div></div></div>';
      document.body.appendChild(root);
      fit = root.querySelector('#zs-fit'); cv = root.querySelector('#zs-iney');
      gate = { el: root.querySelector('#zs-gate'), btn: root.querySelector('#zs-go'), load: root.querySelector('#zs-load'), bar: root.querySelector('#zs-bar'), pct: root.querySelector('#zs-pct'), title: root.querySelector('#zs-title'), shown: false };
      layout(); window.addEventListener('resize', layout);
      // картинки студии декодируем заранее, пока висит кнопка, — чтобы сцена появилась без мигания
      var tpl = document.createElement('div'); tpl.innerHTML = HTML; Array.prototype.forEach.call(tpl.querySelectorAll('img'), function (im) { try { im.decode && im.decode().catch(function () {}); } catch (e) { if (window.__rep) window.__rep(e); } }); preload = tpl;
      root.addEventListener('pointerdown', function (e) { e.preventDefault(); if (state === 'gate') begin(); else if (state === 'studio') toIney(); });
      window.addEventListener('keydown', onKey, true);
      raf = requestAnimationFrame(gateTick);
    },
    begin: begin,
    // для тестов: убрать заставку сразу
    abort: function () { if (!root) { Z.splashOn = false; return; } cancelAnimationFrame(raf); stopMusic(0); revealed = true; Z.splashOn = false; finish(); }
  };
})();
