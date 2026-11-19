/* 2.11.5 · Апскейл с повышением резкости (по идее AMD FSR: кадр рисуется в меньшем разрешении, затем
   растягивается до экрана и подтачивается фильтром RCAS — «резкость с учётом контраста»: тонкие края становятся
   чётче, а гладкие места и шум не перешариваются). Делается видеокартой (WebGL): кадр игры — текстура, поверх
   основного холста — второй холст во весь экран. Включается, только если выбрана резкость; без WebGL — выключено. */
(function () {
'use strict';
var Z = window.Z, K = [0, 0.35, 0.6, 0.9], N = ['Выкл', 'Слабая', 'Средняя', 'Сильная'], NE = ['Off', 'Low', 'Medium', 'High'];
var gl = null, can = null, prog = null, tex = null, uSh = null, uTx = null, failed = false;
var VS = 'attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }';
// RCAS по мотивам FidelityFX: крест из 5 точек, вес резкости ограничен так, чтобы не выйти за min/max соседей (без ореолов)
var FS = 'precision mediump float; varying vec2 v; uniform sampler2D t; uniform vec2 tx; uniform float sh;' +
  'void main(){ vec3 b = texture2D(t, v + vec2(0.0, -tx.y)).rgb, d = texture2D(t, v + vec2(-tx.x, 0.0)).rgb, e = texture2D(t, v).rgb, f = texture2D(t, v + vec2(tx.x, 0.0)).rgb, h = texture2D(t, v + vec2(0.0, tx.y)).rgb;' +
  ' vec3 mn = min(min(min(b, d), min(f, h)), e), mx = max(max(max(b, d), max(f, h)), e);' +
  ' vec3 hitMin = mn / (4.0 * mx + 1e-4), hitMax = (1.0 - mx) / (4.0 * mn - 4.0 - 1e-4);' +
  ' vec3 lobeRGB = max(-hitMin, hitMax); float lobe = max(-0.1875, min(max(lobeRGB.r, max(lobeRGB.g, lobeRGB.b)), 0.0)) * sh;' +
  ' vec3 c = (lobe * (b + d + f + h) + e) / (4.0 * lobe + 1.0); gl_FragColor = vec4(c, 1.0); }';
function init(cv) {
  if (gl || failed) return !!gl;
  try {
    can = document.createElement('canvas'); can.setAttribute('style', 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1;display:none');
    cv.parentNode.insertBefore(can, cv.nextSibling);
    gl = can.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
    if (!gl) throw 0;
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s); return s; }
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw 0;
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    uSh = gl.getUniformLocation(prog, 'sh'); uTx = gl.getUniformLocation(prog, 'tx');
    return true;
  } catch (e) { failed = true; gl = null; if (can && can.parentNode) can.parentNode.removeChild(can); can = null; return false; }
}
var costT = 0, costN = 0, offWarned = false;
Z.post = function (cv) {
  var a = K[(Z.save && Z.save.sharp) || 0] || 0;
  if (a && (Z.sharpAutoOff || Z.isPhone)) a = 0;   // 2.11.5: на телефоне — выключена: перенос кадра в видеокарту каждый кадр стоил больше, чем давал
  if (!a || Z.splashOn) { if (can) can.style.display = 'none'; return; }
  if (!init(cv)) return;
  // выходной холст — в полном разрешении экрана (до ×2), вход — кадр игры в его разрешении
  var dpr = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(Z.W * dpr), H = Math.round(Z.H * dpr);
  if (can.width !== W || can.height !== H) { can.width = W; can.height = H; }
  can.style.height = cv.style.height || '100%'; can.style.display = 'block';
  gl.viewport(0, 0, W, H);
  var tu = performance.now(); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cv); Z._postUp = performance.now() - tu;
  // шаг выборки — одна точка экрана; при апскейле крест берёт соседние точки уже растянутой картинки
  gl.uniform2f(uTx, 1 / W, 1 / H); gl.uniform1f(uSh, a);
  var t0 = performance.now();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  // если на этом устройстве копирование кадра дорогое (больше 6 мс в среднем за 2 с) — резкость выключается сама
  costT += performance.now() - t0 + (Z._postUp || 0); costN++;
  if (costN >= 120) { if (costT / costN > 6) { Z.sharpAutoOff = true; can.style.display = 'none'; if (!offWarned && Z.ui && Z.ui.toast) { offWarned = true; Z.ui.toast(Z.LANG === 'en' ? 'Sharpness is too heavy for this device — turned off' : 'Резкость слишком тяжёлая для этого устройства — выключена', '#ffd54a'); } } costT = 0; costN = 0; }
};
Z.sharpName = function () { var i = (Z.save && Z.save.sharp) || 0, n = Z.LANG === 'en' ? NE[i] : N[i]; if (i && (Z.sharpAutoOff || failed)) n += Z.LANG === 'en' ? ' (off: device too slow)' : ' (выкл.: не тянет устройство)'; return n; };
Z.sharpNext = function () { Z.save.sharp = ((Z.save.sharp || 0) + 1) % K.length; Z.sharpAutoOff = false; costT = 0; costN = 0; };
})();
