/* 2.13 · рисование объектов поля пачками на WebGL2 (подход GEngine). Включается ?gl=1 (window.__GL), пока идёт сравнение.
   Объекты поля (враги, вышки, герои, крепость, кусты, постройки) по-прежнему рисуются по глубине тем же кодом. Но каждый
   перенос готового кадра (drawImage листа кадров или готовой картинки) не идёт в Canvas 2D, а становится строчкой в пачке
   WebGL2: тысяча кадров — один вызов видеокарты. Как только объект рисует что-то вживую (заливка, обводка, текст), накопленная
   пачка сначала дорисовывается и переносится на основной холст — порядок по глубине тот же, что раньше.
   Полоски здоровья врагов — прямоугольниками в той же пачке. */
(function () {
'use strict';
var Z = window.Z, D = Z.D;
var ON = /[?&]gl=1(&|$)/.test(location.search) || window.__GL === true;
Z.glOn = function () { return ON && !!gl; };
if (!ON) return;
window.__FAST = true;   // готовые кадры толпы, крепости, стены и героев (2.12.52)
Z.cachesOff = function () { return false; };   // готовые кадры для всех объектов: в пачке они почти бесплатны
Z.atlasOn = true;   // кадры — на общих листах (меньше текстур и переключений)

// ---------- версии холстов: любой рисунок в холст меняет его версию (текстура перезаливается только при изменении) ----------
var P2 = CanvasRenderingContext2D.prototype, pendCanvases = [];
['fill', 'stroke', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'fillText', 'strokeText', 'putImageData'].forEach(function (name) {
  var f = P2[name];
  P2[name] = function () {
    var c = this.canvas;
    if (c._glp) flush();   // в холст рисуют, а пачка ещё ссылается на его старый рисунок — сначала дорисовать пачку
    c._ver = (c._ver | 0) + 1;
    if (c._sheet) sheetDirty(c, name, arguments);
    return f.apply(this, arguments);
  };
});

// лист кадров дописывается кусками (v30o, atlasPut): перезаливаем только изменённую область, а не весь лист 1024×1024
function sheetDirty(c, name, a) {
  var r = null;
  if (name === 'drawImage' && a.length === 9) r = [a[5], a[6], a[7], a[8]];
  else if ((name === 'clearRect' || name === 'fillRect') && a.length === 4) r = [a[0], a[1], a[2], a[3]];
  if (!r) { c._dirty = [0, 0, c.width, c.height]; return; }
  var x0 = Math.max(0, Math.floor(r[0])), y0 = Math.max(0, Math.floor(r[1])), x1 = Math.min(c.width, Math.ceil(r[0] + r[2])), y1 = Math.min(c.height, Math.ceil(r[1] + r[3]));
  if (x1 <= x0 || y1 <= y0) return;
  var d = c._dirty; c._dirty = d ? [Math.min(d[0], x0), Math.min(d[1], y0), Math.max(d[2], x1), Math.max(d[3], y1)] : [x0, y0, x1, y1];
}
// ---------- WebGL2 ----------
var cvGL = document.createElement('canvas'), gl = null, prog, vao, ibuf, uRes, white, MAXF = 40;
try { gl = cvGL.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true }); } catch (e) { gl = null; }
if (!gl) { ON = false; return; }
function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
prog = gl.createProgram();
gl.attachShader(prog, sh(gl.VERTEX_SHADER, '#version 300 es\n' +
  'layout(location=0) in vec2 q; layout(location=1) in vec2 o; layout(location=2) in vec2 u; layout(location=3) in vec2 v;\n' +
  'layout(location=4) in vec4 uv; layout(location=5) in vec4 col; uniform vec2 res; out vec2 tc; out vec4 c;\n' +
  'void main(){ vec2 p = o + q.x * u + q.y * v; gl_Position = vec4(p.x / res.x * 2.0 - 1.0, 1.0 - p.y / res.y * 2.0, 0.0, 1.0); tc = mix(uv.xy, uv.zw, q); c = col; }'));
gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, '#version 300 es\nprecision mediump float; in vec2 tc; in vec4 c; uniform sampler2D t; out vec4 o; void main(){ o = texture(t, tc) * c; }'));
gl.linkProgram(prog);
if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { ON = false; return; }
uRes = gl.getUniformLocation(prog, 'res');
var STRIDE = 14, cap = 4096, inst = new Float32Array(cap * STRIDE), n = 0;
vao = gl.createVertexArray(); gl.bindVertexArray(vao);
var qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
ibuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ibuf); gl.bufferData(gl.ARRAY_BUFFER, inst.byteLength, gl.DYNAMIC_DRAW);
[[1, 2, 0], [2, 2, 2], [3, 2, 4], [4, 4, 6], [5, 4, 10]].forEach(function (a) { gl.enableVertexAttribArray(a[0]); gl.vertexAttribPointer(a[0], a[1], gl.FLOAT, false, STRIDE * 4, a[2] * 4); gl.vertexAttribDivisor(a[0], 1); });
gl.bindVertexArray(null);
white = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, white); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

// ---------- текстуры: холст или картинка → текстура; перезаливка по версии; давно не нужные — удаляются ----------
var TEX = new Map(), frameNo = 0, stats = { flush: 0, inst: 0, up: 0, upPx: 0, live: 0 }, S = { flush: 0, inst: 0, up: 0, upPx: 0, live: 0, frames: 0 };
function srcSize(s) { return s.naturalWidth !== undefined ? [s.naturalWidth, s.naturalHeight] : [s.width, s.height]; }
// холст, который перерисовывают почти каждый кадр (слой на весь экран), — не в пачку: перезаливка дороже, чем рисовать по-старому
function capturable(s) {
  if (s instanceof HTMLCanvasElement) { if (s === cvGL) return false; var a = s.width * s.height; if (!(a > 0)) return false; if (s._sheet || a <= 360 * 360) return true; var T = TEX.get(s); return a <= 2048 * 2048 && !(T && T.dyn); }
  if (s instanceof HTMLImageElement) return s.complete && s.naturalWidth > 0 && s.naturalWidth * s.naturalHeight <= 1024 * 1024;
  return typeof ImageBitmap !== 'undefined' && s instanceof ImageBitmap;
}
function texFor(s) {
  var T = TEX.get(s), ver = s._ver | 0;
  if (!T) { T = { t: gl.createTexture(), ver: -1, used: 0 }; TEX.set(s, T); gl.bindTexture(gl.TEXTURE_2D, T.t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
  if (T.ver !== ver) {
    gl.bindTexture(gl.TEXTURE_2D, T.t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    var dr = s._sheet && T.ver >= 0 && T.w === s.width && T.h === s.height ? s._dirty : null;
    if (dr) {   // только дописанный кусок листа
      gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, dr[0]); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, dr[1]);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, dr[0], dr[1], dr[2] - dr[0], dr[3] - dr[1], gl.RGBA, gl.UNSIGNED_BYTE, s);
      gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
      T.ver = ver; s._dirty = null; T.used = frameNo; stats.up++; stats.upPx += (dr[2] - dr[0]) * (dr[3] - dr[1]);
      return T.t;
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, s); s._dirty = null; T.w = s.width; T.h = s.height;
    if (!s._sheet && T.ver >= 0 && frameNo - T.upF < 30) T.dyn = true; T.upF = frameNo;
    T.ver = ver; var sz = srcSize(s); stats.up++; stats.upPx += sz[0] * sz[1];
  }
  T.used = frameNo;
  return T.t;
}
function gcTex() { TEX.forEach(function (T, s) { if (frameNo - T.used > 300) { gl.deleteTexture(T.t); TEX.delete(s); } }); }

// ---------- пачка ----------
var runs = [], curTex = null, bx0, by0, bx1, by1, main = null, W = 0, H = 0, origDI = P2.drawImage, inPass = false, bypass = false;
var depth = 0, clips = [], oSave = P2.save, oRestore = P2.restore, oClip = P2.clip;
function grow() { var a = new Float32Array(inst.length * 2); a.set(inst); inst = a; cap *= 2; gl.bindBuffer(gl.ARRAY_BUFFER, ibuf); gl.bufferData(gl.ARRAY_BUFFER, inst.byteLength, gl.DYNAMIC_DRAW); }
function push(tex, ox, oy, ux, uy, vx, vy, s0, t0, s1, t1, r, g, b, a) {
  if (tex !== curTex) { runs.push({ tex: tex, start: n, count: 0 }); curTex = tex; }
  if (n >= cap) grow();
  var k = n * STRIDE; inst[k] = ox; inst[k + 1] = oy; inst[k + 2] = ux; inst[k + 3] = uy; inst[k + 4] = vx; inst[k + 5] = vy;
  inst[k + 6] = s0; inst[k + 7] = t0; inst[k + 8] = s1; inst[k + 9] = t1; inst[k + 10] = r; inst[k + 11] = g; inst[k + 12] = b; inst[k + 13] = a;
  n++; runs[runs.length - 1].count++;
  var xs = [ox, ox + ux, ox + vx, ox + ux + vx], ys = [oy, oy + uy, oy + vy, oy + uy + vy];
  for (var i = 0; i < 4; i++) { if (xs[i] < bx0) bx0 = xs[i]; if (xs[i] > bx1) bx1 = xs[i]; if (ys[i] < by0) by0 = ys[i]; if (ys[i] > by1) by1 = ys[i]; }
}
function plain(c) { return c.globalCompositeOperation === 'source-over' && !c.shadowBlur && (c.filter === undefined || c.filter === 'none') && !clips.length; }
// перенос кадра в пачку вместо Canvas 2D; false — рисовать по-старому
function capture(c, args) {
  var s = args[0]; if (!capturable(s) || !plain(c)) return false;
  var sz = srcSize(s), iw = sz[0], ih = sz[1], sx = 0, sy = 0, sw = iw, sh2 = ih, dx, dy, dw, dh;
  if (args.length === 3) { dx = args[1]; dy = args[2]; dw = iw; dh = ih; }
  else if (args.length === 5) { dx = args[1]; dy = args[2]; dw = args[3]; dh = args[4]; }
  else if (args.length === 9) { sx = args[1]; sy = args[2]; sw = args[3]; sh2 = args[4]; dx = args[5]; dy = args[6]; dw = args[7]; dh = args[8]; }
  else return false;
  if (!(sw > 0 && sh2 > 0 && dw && dh)) return true;
  var m = c.getTransform(), al = c.globalAlpha;
  var tex = texFor(s); s._glp = true; pendCanvases.push(s);
  push(tex, m.a * dx + m.c * dy + m.e, m.b * dx + m.d * dy + m.f, m.a * dw, m.b * dw, m.c * dh, m.d * dh,
    sx / iw, sy / ih, (sx + sw) / iw, (sy + sh2) / ih, al, al, al, al);
  stats.inst++;
  return true;
}
// цвета заливки: '#rgb', '#rrggbb', 'rgb()/rgba()'
var COL = new Map();
function rgba(s) {
  var v = COL.get(s); if (v) return v;
  var m;
  if (typeof s !== 'string') return null;
  if (s[0] === '#') { var h = s.slice(1); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; if (h.length !== 6) return null; v = [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255, 1]; }
  else if ((m = /^rgba?\(([^)]+)\)$/.exec(s))) { var p = m[1].split(',').map(parseFloat); v = [p[0] / 255, p[1] / 255, p[2] / 255, p.length > 3 ? p[3] : 1]; }
  else return null;
  COL.set(s, v); return v;
}
// прямоугольник цветом в пачку (x, y, w, h — в текущих координатах холста); false — рисовать по-старому
Z.glRect = function (c, x, y, w, h, color) {
  if (!inPass || bypass || c !== main || !plain(c)) return false;
  var col = rgba(color); if (!col) return false;
  var m = c.getTransform(), a = col[3] * c.globalAlpha;
  push(white, m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f, m.a * w, m.b * w, m.c * h, m.d * h, 0, 0, 1, 1, col[0] * a, col[1] * a, col[2] * a, a);
  stats.inst++;
  return true;
};
function flush() {
  if (!n) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, ibuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, inst, 0, n * STRIDE);
  gl.useProgram(prog); gl.bindVertexArray(vao); gl.uniform2f(uRes, W, H); gl.activeTexture(gl.TEXTURE0);
  for (var i = 0; i < runs.length; i++) { var R = runs[i]; gl.bindTexture(gl.TEXTURE_2D, R.tex);
    for (var a = 1; a <= 5; a++) { var sizes = [0, 2, 2, 2, 4, 4], offs = [0, 0, 2, 4, 6, 10]; gl.vertexAttribPointer(a, sizes[a], gl.FLOAT, false, STRIDE * 4, (R.start * STRIDE + offs[a]) * 4); }
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, R.count); }
  gl.bindVertexArray(null);
  // перенос дорисованного куска на основной холст — только по рамке пачки, затем этот кусок очищается
  var x0 = Math.max(0, Math.floor(bx0)), y0 = Math.max(0, Math.floor(by0)), x1 = Math.min(W, Math.ceil(bx1)), y1 = Math.min(H, Math.ceil(by1));
  if (x1 > x0 && y1 > y0) {
    var c = main; oSave.call(c); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    origDI.call(c, cvGL, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    oRestore.call(c);
    gl.enable(gl.SCISSOR_TEST); gl.scissor(x0, H - y1, x1 - x0, y1 - y0); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.disable(gl.SCISSOR_TEST);
  }
  n = 0; runs = []; curTex = null; stats.flush++;
  if (stats.flush > MAXF) bypass = true;   // слишком много переключений (щипок, построение кадров) — дальше в этом кадре по-старому
  for (var j = 0; j < pendCanvases.length; j++) pendCanvases[j]._glp = false; pendCanvases.length = 0;
  bx0 = by0 = Infinity; bx1 = by1 = -Infinity;
}
Z.glFlush = function () { if (inPass) flush(); };
// огоньки на ёлке рисуются вперемешку с живыми игрушками и звездой: в проходе — тоже вживую (иначе десятки переносов пачки)
var oTL = Z.treeLight;
if (oTL) Z.treeLight = function () { return inPass ? false : oTL.apply(this, arguments); };
// готовый кадр (Z.sharedSprite) — только в проходе объектов с WebGL2; false — рисовать по-старому
Z.glSprite = function (key, ax, ay, w, h, ox, oy, draw) { return inPass && !bypass && !!Z.sharedSprite && Z.sharedSprite(key, ax, ay, w, h, ox, oy, draw); };

// ---------- проход объектов поля (ui.js: drawLevel, сортировка по глубине) ----------
var LIVE = ['fill', 'stroke', 'fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText', 'putImageData'];
function install(c) {
  c.drawImage = function () {
    if (!bypass && capture(c, arguments)) return;
    flush(); stats.live++; return P2.drawImage.apply(c, arguments);
  };
  LIVE.forEach(function (name) { var f = P2[name]; c[name] = function () { flush(); stats.live++; return f.apply(c, arguments); }; });
  c.save = function () { depth++; return oSave.call(c); };
  c.restore = function () { if (depth > 0) depth--; while (clips.length && clips[clips.length - 1] > depth) clips.pop(); return oRestore.call(c); };
  c.clip = function () { flush(); clips.push(depth); return oClip.apply(c, arguments); };
}
function uninstall(c) { ['drawImage', 'save', 'restore', 'clip'].concat(LIVE).forEach(function (name) { delete c[name]; }); }
Z.glBegin = function (c) {
  if (!ON || inPass || (Z.ui && Z.ui.pinch)) return;
  main = c; W = c.canvas.width; H = c.canvas.height;
  if (cvGL.width !== W || cvGL.height !== H) { cvGL.width = W; cvGL.height = H; }
  gl.viewport(0, 0, W, H); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  n = 0; runs = []; curTex = null; bx0 = by0 = Infinity; bx1 = by1 = -Infinity; depth = 0; clips = []; bypass = false;
  inPass = true; install(c);
};
Z.glEnd = function (c) {
  if (!inPass || c !== main) return;
  flush(); uninstall(c); inPass = false; main = null;
  frameNo++; if (frameNo % 120 === 0) gcTex();
  S.flush += stats.flush; S.inst += stats.inst; S.up += stats.up; S.upPx += stats.upPx; S.live += stats.live; S.frames++;
  stats.flush = stats.inst = stats.up = stats.upPx = stats.live = 0;
};
// средние за кадр с прошлого вызова (для страницы замера)
Z.glStats = function () { var f = Math.max(1, S.frames), r = { flush: S.flush / f, inst: S.inst / f, up: S.up / f, upMpx: S.upPx / f / 1e6, live: S.live / f, tex: TEX.size }; S.flush = S.inst = S.up = S.upPx = S.live = S.frames = 0; return r; };
})();
