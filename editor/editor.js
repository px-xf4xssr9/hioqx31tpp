// Редактор анимаций рук: таймлайн, ключи, отмена, автосохранение, проверки, команды. Формат клипа —
// как tools/anim/motion/*.json (keyed.py); новые поля описаны в tools/anim/README.md («Редактор»).
import { solveClip, checkFrames, FPS } from "./editor-arm.js";
import { TEMPLATES, resolveAttach, mirror, autofix, command } from "./editor-ai.js";
import { View, PROP_NAMES } from "./editor-view.js";

const $ = (id) => document.getElementById(id);
const r3 = (v) => Math.round(v * 1000) / 1000;
const S = { name: "", clip: { T: 1, keys: [] }, frames: [], checks: [], cur: 0, sel: null, selProp: null,
  undo: [], redo: [], playing: false, server: false, full: null, diskText: "" };
const view = new View($("view"));
const LS = (n) => `gengine-editor:${n}`;
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* приватный режим */ } } };

export const text = () => JSON.stringify(S.clip, null, 1) + "\n";
function status(s, cls) { $("status").textContent = s; $("status").className = cls || ""; }

function solve() {
  resolveAttach(S.clip);
  S.frames = solveClip(S.clip); S.checks = checkFrames(S.clip, S.frames);
  S.cur = Math.min(S.cur, S.frames.length - 1);
  if (S.full) S.full = null; // результат полной проверки относится к старой версии
  const red = S.checks.filter((c) => c.length).length;
  status(red ? `красных кадров: ${red} из ${S.frames.length}` : `все быстрые проверки зелёные (${S.frames.length} кадров)`, red ? "red" : "green");
  $("hint").style.display = S.clip.keys.length ? "none" : "block";
  draw(); inspector();
}
function draw() { view.layout(); view.draw({ ...S }); timeline(); }

// ---- правки: снимок до, отмена/возврат, автосохранение ----
function begin() { S.undo.push(text()); if (S.undo.length > 200) S.undo.shift(); S.redo = []; }
function commit() { store.set(LS(S.name), text()); solve(); }
function edit(fn) { begin(); fn(); commit(); }
function restore(t) { const i = S.sel ? S.clip.keys.indexOf(S.sel) : -1; S.clip = JSON.parse(t); S.sel = S.clip.keys[i] || null; commit(); }
function undo() { if (!S.undo.length) return; S.redo.push(text()); restore(S.undo.pop()); }
function redo() { if (!S.redo.length) return; S.undo.push(text()); restore(S.redo.pop()); }

function load(name, t, fromDisk) {
  S.name = name; S.clip = JSON.parse(t); S.clip.keys = S.clip.keys || [];
  S.sel = null; S.undo = []; S.redo = []; S.cur = 0;
  if (fromDisk) S.diskText = t;
  solve();
}
async function openClip(name) {
  const saved = store.get(LS(name));
  let disk = null;
  try { const r = await fetch(`clips/${name}.json`, { cache: "no-store" }); if (r.ok) disk = await r.text(); } catch { /* нет файла */ }
  S.diskText = disk || "";
  load(name, saved || disk || JSON.stringify(TEMPLATES.empty.clip()), false);
  if (saved && disk && saved !== disk) status("открыта автосохранённая версия (Сохранить — записать в файл; Ctrl+Z работает)", "");
  history.replaceState(null, "", `?clip=${encodeURIComponent(name)}`);
}
async function save() {
  const t = text();
  store.set(LS(S.name), t);
  if (S.server) {
    const r = await fetch(`clips/${S.name}.json`, { method: "PUT", body: t });
    if (r.ok) { S.diskText = t; status(`сохранено: tools/anim/motion/${S.name}.json`, "green"); return; }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([t], { type: "application/json" })); a.download = `${S.name}.json`; a.click();
  status(`скачано ${S.name}.json (положить в tools/anim/motion/)`, "green");
}

// ---- таймлайн ----
const tl = $("tl"), tg = tl.getContext("2d");
const tx = (t) => 30 + (t / S.clip.T) * (tl.width - 60);
const tt = (x) => Math.max(0, Math.min(S.clip.T, ((x - 30) / (tl.width - 60)) * S.clip.T));
function timeline() {
  const dpr = window.devicePixelRatio || 1, r = tl.getBoundingClientRect();
  tl.width = Math.round(r.width * dpr); tl.height = Math.round(r.height * dpr);
  tg.setTransform(1, 0, 0, 1, 0, 0); tg.fillStyle = "#11151a"; tg.fillRect(0, 0, tl.width, tl.height);
  const n = S.frames.length, h = tl.height, fw = (tl.width - 60) / Math.max(1, n - 1);
  for (let i = 0; i < n; i++) { // кадры: красные — с нарушениями
    const x = tx(S.frames[i].t);
    tg.fillStyle = S.checks[i]?.length ? "#e74c3c" : S.full?.frames?.[i]?.length ? "#e67e22" : "#24303a";
    tg.fillRect(x - fw / 2 + 1, h * 0.55, Math.max(1, fw - 2), h * 0.25);
    if (i % 5 === 0) { tg.fillStyle = "#8b97a3"; tg.font = `${10 * dpr}px system-ui`; tg.fillText(String(i), x - 3, h * 0.95); }
  }
  if (S.clip.release_t !== undefined) { tg.fillStyle = "#9b59b6"; tg.fillRect(tx(S.clip.release_t) - 1, 0, 2, h * 0.8); }
  for (const k of S.clip.keys) {
    const x = tx(k.t), y = h * 0.3, s = 7 * dpr;
    tg.fillStyle = k === S.sel ? "#f1c40f" : "#ecf0f1";
    tg.beginPath(); tg.moveTo(x, y - s); tg.lineTo(x + s, y); tg.lineTo(x, y + s); tg.lineTo(x - s, y); tg.fill();
  }
  const x = tx(S.frames[S.cur]?.t || 0);
  tg.fillStyle = "#3498db"; tg.fillRect(x - 1, 0, 2, h);
}
let tlDrag = null;
tl.addEventListener("pointerdown", (e) => {
  const dpr = window.devicePixelRatio || 1, x = e.offsetX * dpr, y = e.offsetY * dpr;
  const k = S.clip.keys.find((k) => Math.abs(tx(k.t) - x) < 9 * dpr && y < tl.height * 0.55);
  tl.setPointerCapture(e.pointerId);
  if (k) { S.sel = k; begin(); tlDrag = { key: k }; inspector(); draw(); return; }
  tlDrag = { scrub: true }; seek(tt(x));
});
tl.addEventListener("pointermove", (e) => {
  const dpr = window.devicePixelRatio || 1, x = e.offsetX * dpr, y = e.offsetY * dpr;
  if (tlDrag?.key) { tlDrag.key.t = r3(Math.round(tt(x) * FPS) / FPS); tlDrag.moved = true; solve(); }
  else if (tlDrag?.scrub) seek(tt(x));
  const i = Math.round((tt(x) / S.clip.T) * (S.frames.length - 1)), bad = [...(S.checks[i] || []), ...(S.full?.frames?.[i] || []).map((t) => ({ text: "полная: " + t }))];
  const tip = $("tip");
  if (bad.length && y > tl.height * 0.5) {
    tip.innerHTML = `<b>кадр ${i}</b><br>` + bad.map((b) => "• " + b.text).join("<br>") + "<br><i>«Поправить» — ближайшая допустимая поза</i>";
    tip.style.display = "block"; tip.style.left = e.clientX + 12 + "px"; tip.style.top = e.clientY - 20 - tip.offsetHeight + "px";
  } else tip.style.display = "none";
});
tl.addEventListener("pointerup", () => { if (tlDrag?.key) { if (!tlDrag.moved) S.undo.pop(); else commit(); } tlDrag = null; });
tl.addEventListener("pointerleave", () => ($("tip").style.display = "none"));
tl.addEventListener("dblclick", (e) => addKey(tt(e.offsetX * (window.devicePixelRatio || 1))));
function seek(t) { S.cur = Math.round((t / S.clip.T) * (S.frames.length - 1)); draw(); inspector(); }

function addKey(t) {
  t = r3(Math.round(t * FPS) / FPS);
  const fr = S.frames[Math.round((t / S.clip.T) * (S.frames.length - 1))];
  const k = { t, ndc: [r3(fr.p.B[0]), r3(fr.p.B[1])], depth: [r3(fr.p.B[2] - 0.04), r3(fr.p.B[2] + 0.04)] };
  edit(() => { S.clip.keys.push(k); S.clip.keys.sort((a, b) => a.t - b.t); S.sel = k; });
}
function delKey() { if (!S.sel) return; edit(() => { S.clip.keys.splice(S.clip.keys.indexOf(S.sel), 1); S.sel = null; }); }

// ---- вид: перетаскивание ключа, предплечья, предмета; колесо — глубина ----
let vDrag = null;
const cv = $("view");
cv.addEventListener("pointerdown", (e) => {
  const h = view.hit(e.offsetX, e.offsetY);
  if (!h) { S.sel = null; S.selProp = null; draw(); inspector(); return; }
  cv.setPointerCapture(e.pointerId); begin(); vDrag = h;
  if (h.key) { S.sel = h.key; S.selProp = null; seek(h.key.t); } else { S.selProp = h.prop.id; S.sel = null; draw(); inspector(); }
});
cv.addEventListener("pointermove", (e) => {
  if (!vDrag) { const h = view.hit(e.offsetX, e.offsetY); cv.title = h ? { hand: "кисть в ключе: тянуть — где на экране; колесо — глубина", fdir: "предплечье: откуда идёт рука", prop: "предмет: тянуть; прилепленные ключи следуют" }[h.kind] : ""; return; }
  const n = view.ndc(e.offsetX, e.offsetY).map(r3);
  if (vDrag.kind === "hand") { const k = vDrag.key; if (k.attach) delete k.attach; k.ndc = n; }
  if (vDrag.kind === "fdir") { const k = vDrag.key, p = k.ndc || n; const d = [p[0] - n[0], p[1] - n[1]], l = Math.hypot(...d) || 1; k.forearm_dir = [r3(d[0] / l), r3(d[1] / l)]; }
  if (vDrag.kind === "prop") vDrag.prop.ndc = n;
  vDrag.moved = true; solve();
});
cv.addEventListener("pointerup", () => { if (vDrag) { if (!vDrag.moved) S.undo.pop(); else commit(); } vDrag = null; });
cv.addEventListener("wheel", (e) => {
  const k = S.sel; if (!k) return; e.preventDefault();
  edit(() => { const d = k.depth || [0.3, 0.38], s = e.deltaY > 0 ? 0.01 : -0.01; k.depth = [r3(Math.max(0.12, d[0] + s)), r3(Math.max(0.14, d[1] + s))]; delete k.attach; });
}, { passive: false });

// ---- инспектор ключа (русские названия, подсказки) ----
const FIELDS = [
  ["t", "время, с", "момент ключа"], ["ndc", "кисть на экране x, y", "−1…1, центр экрана — 0"],
  ["depth", "глубина от камеры, м (от–до)", "размер кисти в кадре"], ["elbow", "сгиб локтя, °", "0 — прямая рука, предел 150°"],
  ["forearm_dir", "направление предплечья x, y", "на экране: от локтя к запястью"], ["below", "кисть ниже, ndc y", "уход за нижний край"],
  ["elbow_off", "локоть за кадром", "рука входит из-за края экрана"], ["w", "вес ключа", "насколько строго держать ключ (1 — обычно)"],
];
function inspector() {
  const el = $("insp"), k = S.sel, fr = S.frames[S.cur];
  let h = `<b>${S.name || "клип"}</b> · ${S.clip.side === "right" ? "правая" : "левая"} рука<br>
    <label title="длительность клипа">длительность, с <input type=number step=0.05 data-c=T value=${S.clip.T}></label>
    <label title="момент отрыва шара/выпуска">выпуск, с <input type=number step=0.01 data-c=release_t value=${S.clip.release_t ?? ""}></label>`;
  if (k) {
    h += `<h3>Ключ t=${k.t}</h3>`;
    for (const [f, name, tip] of FIELDS) {
      const v = k[f], on = v !== undefined;
      const inp = f === "elbow_off" ? "" : Array.isArray(v) || f === "ndc" || f === "depth" || f === "forearm_dir"
        ? [0, 1].map((j) => `<input type=number step=0.01 data-f=${f} data-j=${j} value=${on ? v[j] : ""}>`).join("")
        : `<input type=number step=${f === "elbow" ? 1 : 0.01} data-f=${f} value=${on ? v : ""}>`;
      h += `<label title="${tip}"><span><input type=checkbox data-on=${f} ${on ? "checked" : ""}> ${name}</span><span>${inp}</span></label>`;
    }
    if (k.elbow !== undefined) h += `<label>локоть <input type=range min=0 max=150 data-f=elbow value=${k.elbow}></label>`;
    const props = S.clip.props || [];
    h += `<label title="ключ следует за предметом">прилепить к <select data-attach><option value="">—</option>${props.map((p) => `<option value=${p.id} ${k.attach === p.id ? "selected" : ""}>${PROP_NAMES[p.kind] || p.kind} (${p.id})</option>`).join("")}</select></label>
      <button data-del>Удалить ключ (Del)</button>`;
  } else h += `<p style="color:#8b97a3">Двойной щелчок по таймлайну или K — ключ. Щёлкнуть ромб — выбрать.</p>`;
  if (S.selProp) h += `<h3>Предмет ${S.selProp}</h3><button data-delprop>Убрать предмет</button>`;
  if (fr) {
    const bad = S.checks[S.cur];
    h += `<h3>Кадр ${S.cur}</h3>` + (bad.length ? bad.map((b) => `<div class=red>• ${b.text}</div>`).join("") : `<div class=green>проверки зелёные</div>`);
    h += `<div style="color:#8b97a3">плечо: подъём ${fr.q[0].toFixed(0)}°, плоскость ${fr.q[1].toFixed(0)}°, ротация ${fr.q[2].toFixed(0)}°<br>локоть ${fr.q[3].toFixed(0)}°</div>`;
  }
  h += `<div id=log>${S.log || ""}</div>`;
  el.innerHTML = h;
}
$("insp").addEventListener("change", (e) => {
  const t = e.target, k = S.sel;
  if (t.dataset.c) edit(() => { if (t.value === "") delete S.clip[t.dataset.c]; else S.clip[t.dataset.c] = +t.value; });
  else if (t.dataset.on && k) edit(() => {
    const f = t.dataset.on, fr = S.frames[S.cur];
    if (!t.checked) delete k[f];
    else k[f] = { ndc: [r3(fr.p.B[0]), r3(fr.p.B[1])], depth: [r3(fr.p.B[2] - 0.04), r3(fr.p.B[2] + 0.04)], elbow: Math.round(fr.q[3]),
      forearm_dir: [r3(fr.p.W[0] - fr.p.E[0]), r3(fr.p.W[1] - fr.p.E[1])], below: -1.1, elbow_off: true, w: 1, t: k.t }[f];
  });
  else if (t.dataset.f && k) edit(() => { const f = t.dataset.f; if (t.dataset.j !== undefined) { k[f] = k[f] || [0, 0]; k[f][+t.dataset.j] = +t.value; } else k[f] = +t.value; if (f !== "t" && f !== "w" && f !== "elbow") delete k.attach; S.clip.keys.sort((a, b) => a.t - b.t); });
  else if (t.dataset.attach !== undefined && k) edit(() => { if (t.value) { k.attach = t.value; delete k.attach_off; } else delete k.attach; });
});
$("insp").addEventListener("click", (e) => {
  if (e.target.dataset.del !== undefined) delKey();
  if (e.target.dataset.delprop !== undefined) edit(() => { S.clip.props = S.clip.props.filter((p) => p.id !== S.selProp); for (const k of S.clip.keys) if (k.attach === S.selProp) delete k.attach; S.selProp = null; });
});

// ---- проигрывание, клавиши ----
let last = 0;
function tick(ts) {
  if (S.playing) {
    const dt = last ? ((ts - last) / 1000) * +$("speed").value : 0;
    S.ptime = ((S.ptime ?? S.frames[S.cur].t) + dt) % S.clip.T;
    S.cur = Math.round((S.ptime / S.clip.T) * (S.frames.length - 1)); draw();
  }
  last = ts; requestAnimationFrame(tick);
}
function play(on) { S.playing = on ?? !S.playing; S.ptime = undefined; $("play").textContent = S.playing ? "■" : "▶"; if (!S.playing) inspector(); }
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
  const c = e.ctrlKey || e.metaKey;
  if (e.code === "Space") { e.preventDefault(); play(); }
  else if (e.key === "ArrowRight") { S.cur = Math.min(S.frames.length - 1, S.cur + 1); draw(); inspector(); }
  else if (e.key === "ArrowLeft") { S.cur = Math.max(0, S.cur - 1); draw(); inspector(); }
  else if (c && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (c && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
  else if (c && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
  else if (e.key === "Delete" || e.key === "Backspace") delKey();
  else if (e.key.toLowerCase() === "k" || e.key.toLowerCase() === "л") addKey(S.frames[S.cur].t);
});

// ---- кнопки ----
const say = (lines) => { S.log = lines.join("\n"); inspector(); };
$("undo").onclick = undo; $("redo").onclick = redo; $("save").onclick = save; $("play").onclick = () => play();
$("onion").onclick = () => { view.onion = !view.onion; $("onion").classList.toggle("on", view.onion); draw(); };
$("mirror").onclick = () => edit(() => mirror(S.clip));
$("fix").onclick = () => { let d; edit(() => { d = autofix(S.clip, S.checks[S.cur]?.length ? S.cur : undefined); }); say(d.length ? ["Поправлено:", ...d] : ["Нечего поправлять"]); };
$("addprop").onchange = (e) => { const kind = e.target.value; e.target.value = ""; if (!kind) return;
  edit(() => { const ps = (S.clip.props = S.clip.props || []); let i = 1; while (ps.some((p) => p.id === kind + i)) i++; ps.push({ id: kind + i, kind, ndc: [-0.25, 0], depth: 0.4 }); S.selProp = kind + i; }); };
$("tpl").onchange = (e) => { const id = e.target.value; e.target.value = ""; if (!id) return;
  let n = prompt("Имя нового клипа (файл tools/anim/motion/<имя>.json):", id === "empty" ? "new_clip" : id); if (!n) return;
  n = n.replace(/[^\w-]/g, "_"); load(n, JSON.stringify(TEMPLATES[id].clip()), false); begin(); commit(); history.replaceState(null, "", `?clip=${n}`); };
$("clips").onchange = (e) => openClip(e.target.value);
$("open").onclick = () => $("file").click();
$("file").onchange = async (e) => { const f = e.target.files[0]; if (f) { load(f.name.replace(/\.json$/, ""), await f.text(), false); begin(); commit(); } };
async function runCommand() {
  const s = $("ai").value.trim(); if (!s) return;
  let d; edit(() => { d = command(S.clip, s, S.sel); });
  if (!d) S.undo.pop();
  if (S.server) fetch("api/ai", { method: "POST", body: JSON.stringify({ clip: S.name, text: s, done: d }) });
  say(d ? ["Команда:", ...d] : [S.server ? "Передано сессии ИИ (tools/anim/editor_inbox.jsonl); правка появится, когда она изменит файл" : "Не понял команду. Понимаю: медленнее/быстрее, выше/ниже/левее/правее, ближе/дальше, замах/бросок/всё, зеркало, поправь"]);
  $("ai").value = "";
}
$("aigo").onclick = runCommand; $("ai").addEventListener("keydown", (e) => e.key === "Enter" && runCommand());
$("full").onclick = async () => {
  if (!S.server) { say(["Полная проверка нужна локально: python3 tools/anim/editor_server.py, затем открыть http://127.0.0.1:8765/ — или попросить сессию ИИ: tools/anim/pipeline.sh check"]); return; }
  await save(); status("полная проверка идёт (keyed.py → check.py), это минуты…");
  const r = await (await fetch(`api/check?clip=${S.name}`, { method: "POST" })).json();
  S.full = r; draw(); say([r.ok ? "Полная проверка:" : "Полная проверка не прошла:", ...(r.summary || []), r.error || ""]);
  status(r.ok ? "полная проверка готова — оранжевые кадры на таймлайне" : "полная проверка упала", r.ok ? "green" : "red");
};

// ---- сервер (editor_server.py): сохранение в файл, слежение за правками ИИ ----
async function watch() {
  if (!S.server || !S.name) return;
  try {
    const r = await fetch(`clips/${S.name}.json`, { cache: "no-store" });
    if (!r.ok) return;
    const t = await r.text();
    if (S.diskText && t !== S.diskText && t !== text()) { S.diskText = t; begin(); restore(t); say(["Файл изменён снаружи (сессия ИИ) — подхвачено, Ctrl+Z отменит"]); }
    else S.diskText = t;
  } catch { /* сервер ушёл */ }
}

$("hint").innerHTML = `<b>С чего начать</b><br>1. «Новый…» → заготовка (взмах, рычаг, дверь, взять предмет) — или<br>2. двойной щелчок по таймлайну — ключ в этот момент,<br>3. тянуть ромб на экране — где кисть, колесо — ближе/дальше,<br>4. пробел — играть. Красные кадры — наведи, «Поправить» исправит.`;
for (const [id, t] of Object.entries(TEMPLATES)) $("tpl").insertAdjacentHTML("beforeend", `<option value=${id}>${t.name}</option>`);
window.addEventListener("resize", draw);
window.EDITOR = { S, text, undo, redo, save, load, openClip, addKey, solve, view, ready: false };
(async () => {
  try { S.server = (await fetch("api/ping")).ok; } catch { S.server = false; }
  let list = [];
  try { list = await (await fetch("clips/index.json", { cache: "no-store" })).json(); } catch { /* пусто */ }
  for (const n of list) $("clips").insertAdjacentHTML("beforeend", `<option>${n}</option>`);
  const q = new URLSearchParams(location.search).get("clip") || list[0] || "new_clip";
  $("clips").value = q;
  await openClip(q);
  if (S.server) setInterval(watch, 1500);
  requestAnimationFrame(tick);
  window.EDITOR.ready = true;
})();
