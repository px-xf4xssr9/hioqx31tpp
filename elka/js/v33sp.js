/* 2.13 · ПРОТОТИП: объекты поля — отдельным слоем WebGL2 из готовых кадров (подход GEngine). Включается ?sp=1.
   Слои экрана (холсты один над другим, браузер складывает их сам, без переносов между ними):
     1) основной холст #c — земля, вода, сетка и всё, что пока рисуется вживую;
     2) слой WebGL2 — все готовые кадры объектов по глубине (враги, вышки, герои, крепость, кусты…), одним проходом;
     3) верхний холст Canvas 2D — снаряды, эффекты, погода, тексты, интерфейс.
   Кадры не строятся во время боя: первые секунды уровня — разогрев (кадры строятся быстро), дальше — по 2 за кадр,
   а если кадра нет, берётся ближайший готовый (соседняя фаза шага, соседний угол), а не рисунок вживую.
   ПРОТОТИП для замера: живые части объектов (кольца героев, корона элитных, особые враги) пока остаются на нижнем
   холсте — под слоем кадров. Ночь (затемнение умножением) на этом уровне не используется. */
(function () {
'use strict';
var Z = window.Z, D = Z.D;
var ON = /[?&]sp=1(&|$)/.test(location.search) || window.__SP === true;
Z.spOn = function () { return ON && !!gl; };
if (!ON) return;
window.__FAST = true;
Z.cachesOff = function () { return false; };
Z.atlasOn = true;
var ONLY = /[?&]only=1(&|$)/.test(location.search);   // замер «пола»: живые части объектов и эффекты не рисуются вовсе

// ---------- версии холстов (как в v32gl): рисунок в холст меняет его версию; лист кадров — грязная область ----------
var P2 = CanvasRenderingContext2D.prototype;
function sheetDirty(c, name, a) {
  var r = null;
  if (name === 'drawImage' && a.length === 9) r = [a[5], a[6], a[7], a[8]];
  else if ((name === 'clearRect' || name === 'fillRect') && a.length === 4) r = [a[0], a[1], a[2], a[3]];
  if (!r) { c._dirty = [0, 0, c.width, c.height]; return; }
  var x0 = Math.max(0, Math.floor(r[0])), y0 = Math.max(0, Math.floor(r[1])), x1 = Math.min(c.width, Math.ceil(r[0] + r[2])), y1 = Math.min(c.height, Math.ceil(r[1] + r[3]));
  if (x1 <= x0 || y1 <= y0) return;
  var d = c._dirty; c._dirty = d ? [Math.min(d[0], x0), Math.min(d[1], y0), Math.max(d[2], x1), Math.max(d[3], y1)] : [x0, y0, x1, y1];
}
['fill', 'stroke', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'fillText', 'strokeText', 'putImageData'].forEach(function (name) {
  var f = P2[name];
  P2[name] = function () { var c = this.canvas; c._ver = (c._ver | 0) + 1; if (c._sheet) sheetDirty(c, name, arguments); return f.apply(this, arguments); };
});

// ---------- слои ----------
var cvMain = document.getElementById('c'), cvGL = document.createElement('canvas'), cvTop = document.createElement('canvas'), top = cvTop.getContext('2d');
cvGL.style.pointerEvents = cvTop.style.pointerEvents = 'none';
cvMain.parentNode.insertBefore(cvGL, cvMain.nextSibling); cvMain.parentNode.insertBefore(cvTop, cvGL.nextSibling);
var gl = null;
try { gl = cvGL.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false }); } catch (e) { gl = null; }
if (!gl) { ON = false; cvGL.remove(); cvTop.remove(); return; }
function syncSize() {
  var W = cvMain.width, H = cvMain.height;
  [cvGL, cvTop].forEach(function (c) { if (c.width !== W || c.height !== H) { c.width = W; c.height = H; } c.style.width = cvMain.style.width; c.style.height = cvMain.style.height; });
}

// ---------- WebGL2: экземпляры-четырёхугольники (позиция, две стороны, текстурные координаты, цвет) ----------
function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
var prog = gl.createProgram();
gl.attachShader(prog, sh(gl.VERTEX_SHADER, '#version 300 es\n' +
  'layout(location=0) in vec2 q; layout(location=1) in vec2 o; layout(location=2) in vec2 u; layout(location=3) in vec2 v;\n' +
  'layout(location=4) in vec4 uv; layout(location=5) in vec4 col; uniform vec2 res; out vec2 tc; out vec4 c;\n' +
  'void main(){ vec2 p = o + q.x * u + q.y * v; gl_Position = vec4(p.x / res.x * 2.0 - 1.0, 1.0 - p.y / res.y * 2.0, 0.0, 1.0); tc = mix(uv.xy, uv.zw, q); c = col; }'));
gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, '#version 300 es\nprecision mediump float; in vec2 tc; in vec4 c; uniform sampler2D t; out vec4 o; void main(){ o = texture(t, tc) * c; }'));
gl.linkProgram(prog);
var uRes = gl.getUniformLocation(prog, 'res'), STRIDE = 14, cap = 4096, inst = new Float32Array(cap * STRIDE), n = 0;
var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
var qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
var ibuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ibuf); gl.bufferData(gl.ARRAY_BUFFER, inst.byteLength, gl.DYNAMIC_DRAW);
var SZ = [0, 2, 2, 2, 4, 4], OF = [0, 0, 2, 4, 6, 10];
for (var a0 = 1; a0 <= 5; a0++) { gl.enableVertexAttribArray(a0); gl.vertexAttribPointer(a0, SZ[a0], gl.FLOAT, false, STRIDE * 4, OF[a0] * 4); gl.vertexAttribDivisor(a0, 1); }
gl.bindVertexArray(null);
var white = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, white); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

var TEX = new Map(), frameNo = 0, st = { inst: 0, up: 0, upPx: 0, live: 0 }, S = { inst: 0, up: 0, upPx: 0, live: 0, frames: 0, gl: 0 };
function srcSize(s) { return s.naturalWidth !== undefined ? [s.naturalWidth, s.naturalHeight] : [s.width, s.height]; }
function capturable(s) {
  if (s instanceof HTMLCanvasElement) { if (s === cvGL || s === cvTop || s === cvMain) return false; var a = s.width * s.height; if (!(a > 0)) return false; if (s._sheet || a <= 360 * 360) return true; var T = TEX.get(s); return a <= 2048 * 2048 && !(T && T.dyn); }
  if (s instanceof HTMLImageElement) return s.complete && s.naturalWidth > 0;
  return false;
}
function texFor(s) {
  var T = TEX.get(s), ver = s._ver | 0;
  if (!T) { T = { t: gl.createTexture(), ver: -1, used: 0, upF: -99 }; TEX.set(s, T); gl.bindTexture(gl.TEXTURE_2D, T.t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
  T.used = frameNo;
  if (T.ver === ver) return T.t;
  gl.bindTexture(gl.TEXTURE_2D, T.t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  var dr = s._sheet && T.ver >= 0 && T.w === s.width && T.h === s.height ? s._dirty : null;
  if (dr) {
    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, dr[0]); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, dr[1]);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, dr[0], dr[1], dr[2] - dr[0], dr[3] - dr[1], gl.RGBA, gl.UNSIGNED_BYTE, s);
    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
    st.upPx += (dr[2] - dr[0]) * (dr[3] - dr[1]);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, s); T.w = s.width; T.h = s.height;
    var sz = srcSize(s); st.upPx += sz[0] * sz[1];
    if (!s._sheet && T.ver >= 0 && frameNo - T.upF < 30) T.dyn = true;
  }
  s._dirty = null; T.ver = ver; T.upF = frameNo; st.up++;
  return T.t;
}
function gcTex() { TEX.forEach(function (T, s) { if (frameNo - T.used > 300) { gl.deleteTexture(T.t); TEX.delete(s); } }); }

// Порядок по глубине сохраняется: экземпляры идут в пачку в том порядке, в котором их рисует проход объектов.
// Текстуры меняются по ходу — пачка режется на прогоны «одна текстура»; кадров на общих листах немного, прогонов тоже.
var runs = [], curTex = null;
function grow() { var b = new Float32Array(inst.length * 2); b.set(inst); inst = b; cap *= 2; gl.bindBuffer(gl.ARRAY_BUFFER, ibuf); gl.bufferData(gl.ARRAY_BUFFER, inst.byteLength, gl.DYNAMIC_DRAW); }
function push(tex, ox, oy, ux, uy, vx, vy, s0, t0, s1, t1, r, g, b, a) {
  if (tex !== curTex) { runs.push({ tex: tex, start: n, count: 0 }); curTex = tex; }
  if (n >= cap) grow();
  var k = n * STRIDE; inst[k] = ox; inst[k + 1] = oy; inst[k + 2] = ux; inst[k + 3] = uy; inst[k + 4] = vx; inst[k + 5] = vy;
  inst[k + 6] = s0; inst[k + 7] = t0; inst[k + 8] = s1; inst[k + 9] = t1; inst[k + 10] = r; inst[k + 11] = g; inst[k + 12] = b; inst[k + 13] = a;
  n++; runs[runs.length - 1].count++; st.inst++;
}
var main = null, inPass = false, depth = 0, clips = [], oSave = P2.save, oRestore = P2.restore, oClip = P2.clip, oDI = P2.drawImage;
function plain(c) { return c.globalCompositeOperation === 'source-over' && !c.shadowBlur && (c.filter === undefined || c.filter === 'none') && !clips.length; }
function capture(c, args) {
  var s = args[0]; if (!capturable(s) || !plain(c)) return false;
  var sz = srcSize(s), iw = sz[0], ih = sz[1], sx = 0, sy = 0, sw = iw, sh2 = ih, dx, dy, dw, dh;
  if (args.length === 3) { dx = args[1]; dy = args[2]; dw = iw; dh = ih; }
  else if (args.length === 5) { dx = args[1]; dy = args[2]; dw = args[3]; dh = args[4]; }
  else if (args.length === 9) { sx = args[1]; sy = args[2]; sw = args[3]; sh2 = args[4]; dx = args[5]; dy = args[6]; dw = args[7]; dh = args[8]; }
  else return false;
  if (!(sw > 0 && sh2 > 0 && dw && dh)) return true;
  var m = c.getTransform(), al = c.globalAlpha;
  push(texFor(s), m.a * dx + m.c * dy + m.e, m.b * dx + m.d * dy + m.f, m.a * dw, m.b * dw, m.c * dh, m.d * dh, sx / iw, sy / ih, (sx + sw) / iw, (sy + sh2) / ih, al, al, al, al);
  return true;
}
var COL = new Map();
function rgba(s) {
  var v = COL.get(s), m; if (v) return v; if (typeof s !== 'string') return null;
  if (s[0] === '#') { var h = s.slice(1); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; if (h.length !== 6) return null; v = [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255, 1]; }
  else if ((m = /^rgba?\(([^)]+)\)$/.exec(s))) { var p = m[1].split(',').map(parseFloat); v = [p[0] / 255, p[1] / 255, p[2] / 255, p.length > 3 ? p[3] : 1]; }
  else return null;
  COL.set(s, v); return v;
}
// прямоугольник цветом в слой кадров (полоски здоровья)
Z.glRect = function (c, x, y, w, h, color) {
  if (!inPass || c !== main || !plain(c)) return false;
  var col = rgba(color); if (!col) return false;
  var m = c.getTransform(), a = col[3] * c.globalAlpha;
  push(white, m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f, m.a * w, m.b * w, m.c * h, m.d * h, 0, 0, 1, 1, col[0] * a, col[1] * a, col[2] * a, a);
  return true;
};
Z.glSprite = function (key, ax, ay, w, h, ox, oy, draw) { return inPass && !!Z.sharedSprite && Z.sharedSprite(key, ax, ay, w, h, ox, oy, draw); };

// ---------- проход объектов ----------
var LIVE = ['fill', 'stroke', 'fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText', 'putImageData'];
function install(c) {
  c.drawImage = function () { if (capture(c, arguments)) return; st.live++; if (ONLY) return; return oDI.apply(c, arguments); };
  LIVE.forEach(function (name) { var f = P2[name]; c[name] = function () { st.live++; if (ONLY) return; return f.apply(c, arguments); }; });
  c.save = function () { depth++; return oSave.call(c); };
  c.restore = function () { if (depth > 0) depth--; while (clips.length && clips[clips.length - 1] > depth) clips.pop(); return oRestore.call(c); };
  c.clip = function () { clips.push(depth); return oClip.apply(c, arguments); };
}
function uninstall(c) { ['drawImage', 'save', 'restore', 'clip'].concat(LIVE).forEach(function (name) { delete c[name]; }); }
var lvlG = null, lvlT = 0;
Z.spWarm = function () { return inPass && Z.G && (Z.time || 0) - lvlT < 3; };   // первые 3 с уровня — разогрев: кадры строятся быстро
Z.glOn = function () { return inPass; };   // v30o/ui.js: кадры стреляющих вышек, дуги и уровня героя
Z.glBegin = function (c) {
  if (!ON || inPass || c !== MAIN) return;
  if (Z.G !== lvlG) { lvlG = Z.G; lvlT = Z.time || 0; }
  main = c; n = 0; runs = []; curTex = null; depth = 0; clips = []; inPass = true; install(c);
};
Z.glEnd = function (c) {
  if (!inPass || c !== main) return;
  uninstall(c); inPass = false;
  var W = cvGL.width, H = cvGL.height;
  gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  if (n) {
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, ibuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, inst, 0, n * STRIDE);
    gl.useProgram(prog); gl.bindVertexArray(vao); gl.uniform2f(uRes, W, H); gl.activeTexture(gl.TEXTURE0);
    for (var i = 0; i < runs.length; i++) { var R = runs[i]; gl.bindTexture(gl.TEXTURE_2D, R.tex);
      for (var a = 1; a <= 5; a++) gl.vertexAttribPointer(a, SZ[a], gl.FLOAT, false, STRIDE * 4, (R.start * STRIDE + OF[a]) * 4);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, R.count); S.gl++; }
    gl.bindVertexArray(null);
  }
  glDrawn = true;
  frameNo++; if (frameNo % 120 === 0) gcTex();
  S.inst += st.inst; S.up += st.up; S.upPx += st.upPx; S.live += st.live; S.frames++; st.inst = st.up = st.upPx = st.live = 0;
};
// после прохода объектов всё остальное (снаряды, эффекты, тексты, интерфейс) — на верхний холст: та же точка отсчёта и обрезка
Z.spTop = function (c, vp, om) {
  if (c !== MAIN || !topOn) return null;
  var m = c.getTransform();
  oRestore.call(c); oRestore.call(c);   // на основном холсте снимаем обе обрезки прохода (по экрану и по полю)
  top.setTransform(m); oSave.call(top); top.beginPath(); top.rect(vp.x, vp.y, vp.w, vp.h); oClip.call(top);
  oSave.call(top); top.beginPath(); top.rect(om[0], om[1], om[2], om[3]); oClip.call(top);
  return top;
};
// кадр игры: верхний холст очищается в начале; если прохода объектов не было (меню, карта) — слой кадров тоже
var glDrawn = false, topOn = false, MAIN = null, oRender = Z.ui.render;
Z.ui.render = function (c, w, h) {
  MAIN = c; syncSize();
  top.setTransform(1, 0, 0, 1, 0, 0); top.clearRect(0, 0, cvTop.width, cvTop.height);
  topOn = Z.ui.screen === 'level' && !!Z.G && !(Z.G.night || Z.G.L && Z.G.L.dark);   // прототип: ночь — по-старому (умножение на верхнем холсте не затемнит нижние)
  glDrawn = false;
  try { return oRender.apply(this, arguments); }
  finally { if (!glDrawn) { gl.viewport(0, 0, cvGL.width, cvGL.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } }
};
Z.glStats = function () { var f = Math.max(1, S.frames), r = { flush: 0, gl: S.gl / f, inst: S.inst / f, up: S.up / f, upMpx: S.upPx / f / 1e6, live: S.live / f, tex: TEX.size }; S.inst = S.up = S.upPx = S.live = S.frames = S.gl = 0; return r; };
})();
