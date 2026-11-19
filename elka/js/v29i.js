// v2.10.5–2.10.6: музыка — записанные треки (ElevenLabs Music) вместо синтезатора, где они загрузились.
// Карта — своя тема; у каждого региона своя; эскорт — своя; у каждого босса (Великан, Колесница, Горыныч, Кощей, Метелица) — своя.
// Треки бесшовно закольцованы (вступление звучит один раз, дальше петля по долям такта), смена — плавная.
// Если трек не загрузился (нет сети, страница-превью без файлов) — играет прежняя синтезированная музыка.
(function () {
var Z = window.Z, AU = Z.AU;
var LOOPS = { mus_b_chariot: [29.187, 69.985], mus_b_giant: [23.429, 65.086], mus_b_gorynych: [38.081, 78.089], mus_b_koschei: [17.229, 53.267], mus_b_witch: [21.478, 72.609], mus_escort: [16.602, 72.609], mus_map: [33.646, 68.22], mus_r0: [27.609, 73.607], mus_r1: [24.543, 70.774], mus_r2: [30.186, 70.194], mus_r3: [11.61, 75.604], mus_r4: [26.889, 65.596] };
var BASE = 'music/tracks/', VOL = 0.85, XF = 1.6;
var t0 = null, bufs = {}, loading = {}, failed = {}, order = [], cur = null, tg = null, lastT = 0, wantName = null, active = false;
Z.musTracks = { cur: function () { return cur && cur.name; }, loaded: function () { return Object.keys(bufs); }, failed: failed, has: function (n) { return !!bufs[n]; }, preload: function (n) { load(n); } };
function load(name) {
  if (bufs[name] || loading[name] || failed[name] >= 2 || !AU.ctx) return;
  loading[name] = true;
  fetch(BASE + name + '.mp3').then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (ab) {
    return new Promise(function (ok, no) { AU.ctx.decodeAudioData(ab, ok, no); });
  }).then(function (b) {
    loading[name] = false; bufs[name] = b; order.push(name);
    // в памяти держим не больше трёх (72 с стерео ≈ 25 МБ каждый)
    for (var k = 0; order.length > 3 && k < order.length; ) { var old = order[k]; if ((cur && cur.name === old) || old === wantName || old === name) { k++; continue; } order.splice(k, 1); delete bufs[old]; }
  }).catch(function () { loading[name] = false; failed[name] = (failed[name] || 0) + 1; });
}
function want() {
  var UI = Z.ui, G = Z.G;
  if (UI.screen !== 'level' || !G) return 'mus_map';
  if (G.phase === 'won' || G.phase === 'lost') return '';   // тишина под фанфары победы/поражения
  for (var i = 0; i < G.enemies.length; i++) { var e = G.enemies[i]; if (e.boss && !e.dead && LOOPS['mus_b_' + e.type]) return 'mus_b_' + e.type; }
  if (G.L && G.L.type === 'escort') return 'mus_escort';
  var reg = (G.info && G.info.region) || 0;
  if (AU.state === 'boss') { var rb = Z.REGIONS[reg] && Z.REGIONS[reg].boss; if (LOOPS['mus_b_' + rb]) return 'mus_b_' + rb; }
  return 'mus_r' + Math.max(0, Math.min(4, reg));
}
function stop(tr, now, tc) {
  if (!tr) return;
  try { tr.g.gain.cancelScheduledValues(now); tr.g.gain.setValueAtTime(tr.g.gain.value, now); tr.g.gain.linearRampToValueAtTime(0, now + tc); tr.src.stop(now + tc + 0.05); } catch (e) { if (window.__rep) window.__rep(e); }
}
function play(name, now) {
  var b = bufs[name], L = LOOPS[name], c = AU.ctx;
  var src = c.createBufferSource(); src.buffer = b; src.loop = true;
  src.loopStart = Math.min(L[0], b.duration - 1); src.loopEnd = Math.min(L[1], b.duration);
  var g = c.createGain(); g.gain.value = 0; src.connect(g); g.connect(tg);
  // на смене внутри уровня (босс вышел) вступление пропускаем — сразу в петлю
  var off = cur && Z.G && name.indexOf('mus_b_') === 0 ? src.loopStart : name === 'mus_map' ? 0 : Math.max(0, src.loopStart - 6);   /* у уровней вступление короткое */
  src.start(now + 0.02, off);
  g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(1, now + (off ? 0.8 : XF));
  return { name: name, src: src, g: g };
}
function tick() {
  var c = AU.ctx; if (!c || !AU.musG || c.state !== 'running') return;
  var now = c.currentTime; if (now - lastT < 0.2) return; lastT = now;
  if (!tg) { tg = c.createGain(); tg.gain.value = VOL; tg.connect(AU.musG); }
  if (!AU.musicVol) return;
  if (Z._musOff) { if (cur) { stop(cur, now, 0.3); cur = null; } active = false; return; }
  var w = want(); wantName = w;
  // 2.11.4: тема карты маленькая (0,8 МБ) — качаем сразу, не дожидаясь голосов: в меню и на карте сразу своя музыка
  if (!bufs.mus_map) load('mus_map');
  // пока качается пачка голосов — треки не грузим (на мобильном интернете голоса иначе опаздывают и реплики идут без звука)
  // 2.11.5: очередь загрузки (js/preload.js) сама ставит голоса и треки по важности — ждать голоса тут больше не нужно
  if (w && !bufs[w]) load(w);
  if (!cur && !bufs.mus_map) load('mus_map');
  if (cur && cur.name === w) return;
  if (!w) { if (cur) { stop(cur, now, 1.0); cur = null; } return; }
  if (!bufs[w]) return;   // пока грузится — играет то, что было (или синтезатор)
  var old = cur; cur = play(w, now); active = true; if (old) stop(old, now, XF);
}
// пока звучит реплика героя — трек приглушается сильнее синтезатора (он плотный, иначе голос тонет)
var oDuck = Z.duckMusic;
Z.duckMusic = function (on) { if (oDuck) oDuck(on); if (tg && AU.ctx) tg.gain.setTargetAtTime(on ? VOL * 0.35 : VOL, AU.ctx.currentTime, on ? 0.08 : 0.4); };
var oUpd = AU.update;
AU.update = function () { try { tick(); } catch (e) { if (window.__rep) window.__rep(e); } return oUpd.apply(this, arguments); };
// пока звучит трек — синтезатор молчит (фанфары победы/поражения и удары «стингов» остаются)
var oSched = AU.schedule;
// 2.11.4: пока нужный трек ещё грузится — тишина, а не старая синтезированная музыка (раньше в начале звучала она, потом резко менялась);
// синтезатор включается, только если трек так и не загрузился (нет сети)
function synthOff() { return cur || (active && wantName === '') || (wantName && (failed[wantName] || 0) < 2); }
AU.schedule = function (step, t) {
  if (synthOff()) { if (step % 16 === 0) { for (var n in this.layers) if (n !== 'sting' && n !== 'perc') this.layers[n].gain.setTargetAtTime(0, t, 0.3); } return; }
  return oSched.apply(this, arguments);
};
var oApply = AU.applyLayers;
AU.applyLayers = function (t, instant) { if (synthOff()) return; return oApply.apply(this, arguments); };
})();
