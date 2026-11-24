// Редактор анимаций рук (этап 1): интерфейс поверх web/editor-core.js.
// Запуск локально (сохранение в tools/anim/motion, полная проверка, команды ИИ): python3 tools/anim/editor_server.py
// В опубликованной сборке — те же клипы только для просмотра/правки, сохранение — скачать файл и автосохранение в браузере.
import * as C from "./editor-core.js";

const $ = (id) => document.getElementById(id);
const cv = $("cv"), g = cv.getContext("2d"), tl = $("tlc"), tg = tl.getContext("2d");
const ED = (window.ED = {
  clip: C.emptyClip(), name: "", server: false, sel: null, time: 0, playing: false, onion: true,
  undo: [], redo: [], cache: new Map(), traj: null, issues: [], full: [], mtime: 0, dirty: false,
});

// ---------- состояние и правки ----------
function snapshot() { return C.dumpClip(ED.clip); }
function edit(fn, label) {
  const before = snapshot();
  fn();
  if (snapshot() === before) return;
  ED.undo.push(before); ED.redo = []; if (ED.undo.length > 300) ED.undo.shift();
  changed(label);
}
function changed(label) { ED.full = []; recompute(); autosave(); if (label) say(label); }
function restore(text) { ED.clip = C.parseClip(text); if (ED.sel != null && ED.sel >= ED.clip.keys.length) ED.sel = null; recompute(); autosave(); }
function undo() { if (!ED.undo.length) return; ED.redo.push(snapshot()); restore(ED.undo.pop()); say("отменено"); }
function redo() { if (!ED.redo.length) return; ED.undo.push(snapshot()); restore(ED.redo.pop()); say("возвращено"); }
function recompute() {
  ED.traj = C.trajectory(ED.clip, ED.cache);
  ED.issues = C.quickCheck(ED.clip, ED.traj);
  ED.time = Math.min(ED.time, ED.clip.T);
  if (ED.cache.size > 4000) ED.cache.clear();
  panel(); draw();
}
const say = (s) => { $("msg").textContent = s; };

let saveTimer = null;
function autosave() {
  ED.dirty = true;
  try { localStorage.setItem("gengine-editor:" + (ED.name || "новый"), snapshot()); } catch (e) { /* приватное окно */ }
  if (!ED.server || !ED.name) return;
  clearTimeout(saveTimer); saveTimer = setTimeout(() => saveServer(), 700);
}
async function saveServer() {
  const c = C.parseClip(snapshot()); C.bakeAttach(c);
  const r = await fetch("api/clip?name=" + encodeURIComponent(ED.name), { method: "PUT", body: C.dumpClip(c) });
  if (r.ok) { ED.mtime = (await r.json()).mtime; ED.dirty = false; $("status").dataset.saved = "сохранено " + ED.name; }
  else say("не сохранилось: " + (await r.text()));
}
async function save() {
  if (ED.server && ED.name) { clearTimeout(saveTimer); await saveServer(); say("сохранено: tools/anim/motion/" + ED.name); return; }
  const c = C.parseClip(snapshot()); C.bakeAttach(c);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([C.dumpClip(c)], { type: "application/json" }));
  a.download = ED.name || "clip.json"; a.click(); say("скачан файл " + a.download);
}

async function load(name) {
  let text = null;
  if (ED.server) { const r = await fetch("api/clip?name=" + encodeURIComponent(name)); if (r.ok) { text = await r.text(); ED.mtime = Number(r.headers.get("X-Mtime") || 0); } }
  else {
    try { text = localStorage.getItem("gengine-editor:" + name); } catch (e) { text = null; }
    if (!text) { const r = await fetch("clips/" + name); if (r.ok) text = await r.text(); }
  }
  if (text == null) { say("нет клипа " + name); return; }
  ED.name = name; ED.sel = null; ED.undo = []; ED.redo = []; ED.time = 0; ED.cache.clear();
  ED.clip = C.parseClip(text); recompute(); ED.dirty = false; say("открыт " + name);
}

// ---------- окно кадра ----------
let view = { x: 0, y: 0, w: 1, h: 1 };
function layout() {
  const r = cv.parentElement.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  cv.width = r.width * dpr; cv.height = r.height * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const pad = r.width < 600 ? 6 : 24, W = r.width - pad * 2, H = r.height - pad * 2;
  const w = Math.min(W, H * C.CAM.asp); const h = w / C.CAM.asp;
  view = { x: (r.width - w) / 2, y: (r.height - h) / 2, w, h };
  const t = tl.parentElement.getBoundingClientRect(); tl.width = t.width * dpr; tl.height = t.height * dpr; tg.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}
const sideX = (x) => (ED.clip.side === "r" ? -x : x); // модель — левая рука; правая рисуется зеркально
const n2p = (n) => [view.x + ((sideX(n[0]) + 1) / 2) * view.w, view.y + ((1 - n[1]) / 2) * view.h];
const p2n = (x, y) => [sideX(((x - view.x) / view.w) * 2 - 1), 1 - ((y - view.y) / view.h) * 2];
const p2nRaw = (x, y) => [((x - view.x) / view.w) * 2 - 1, 1 - ((y - view.y) / view.h) * 2]; // в осях клипа (с учётом стороны)
const keyN2p = (n) => [view.x + ((n[0] + 1) / 2) * view.w, view.y + ((1 - n[1]) / 2) * view.h];

function seg(a, b, r, col, thin) { // отрезок руки в 3D: обрезка ближней плоскостью, толщина по глубине
  let A = C.toCam(a), B = C.toCam(b); const zn = 0.04;
  if (A[2] < zn && B[2] < zn) return;
  if (A[2] < zn) A = A.map((v, i) => v + (B[i] - v) * ((zn - A[2]) / (B[2] - A[2])));
  if (B[2] < zn) B = B.map((v, i) => v + (A[i] - v) * ((zn - B[2]) / (A[2] - B[2])));
  const pa = n2p(C.camToNdc(A)), pb = n2p(C.camToNdc(B));
  const px = (z) => Math.min(view.h * 0.06, (r / (z * C.TAN_HALF)) * (view.h / 2));
  g.strokeStyle = col; g.lineCap = "round";
  g.lineWidth = thin ? 3 : (px(A[2]) + px(B[2])) * 0.7; g.beginPath(); g.moveTo(...pa); g.lineTo(...pb); g.stroke();
}
function drawArm(p, alpha, tint) { // tint — «луковица»: тонкий силуэт, чтобы не закрывать кадр
  const thin = !!tint;
  g.globalAlpha = alpha * 0.45; seg(p.S, p.E, 0.045, tint || "#566070", thin);
  g.globalAlpha = alpha * 0.8; seg(p.E, p.W, 0.033, tint || "#6b7688", thin);
  g.globalAlpha = alpha * 0.85; seg(p.W, p.tip, 0.04, tint || "#d9a98c", thin);
  g.globalAlpha = 1;
}
function drawTarget(t) {
  const [x, y] = keyN2p(t.ndc); g.lineWidth = 3; g.strokeStyle = "#c8b06a"; g.fillStyle = "#c8b06a";
  if (t.kind === "lever") {
    const [ex, ey] = keyN2p([t.ndc[0] + t.throw[0], t.ndc[1] + t.throw[1]]);
    g.fillRect(x - 18, y + 30, 36, 14);
    g.beginPath(); g.moveTo(x, y + 34); g.lineTo(x, y); g.stroke();
    g.setLineDash([4, 4]); g.beginPath(); g.moveTo(x, y + 34); g.lineTo(ex, ey); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.beginPath(); g.arc(ex, ey, 5, 0, 7); g.stroke();
  } else if (t.kind === "door") { g.fillRect(x - 22, y - 5, 44, 10); g.fillRect(x + 14, y - 5, 8, 24); }
  else { g.fillRect(x - 70, y + 16, 140, 6); g.beginPath(); g.rect(x - 10, y - 14, 20, 30); g.stroke(); }
  g.fillStyle = "#c8b06a"; g.font = "12px system-ui"; g.fillText(t.label || t.id, x + 26, y - 10);
}

function draw() {
  if (!ED.traj) return;
  const W = cv.width / (devicePixelRatio || 1), H = cv.height / (devicePixelRatio || 1);
  g.clearRect(0, 0, W, H);
  g.fillStyle = "#23262d"; g.fillRect(view.x, view.y, view.w, view.h);
  g.strokeStyle = "#3a3f49"; g.lineWidth = 1; g.strokeRect(view.x, view.y, view.w, view.h);
  g.beginPath(); g.moveTo(view.x + view.w / 2 - 8, view.y + view.h / 2); g.lineTo(view.x + view.w / 2 + 8, view.y + view.h / 2);
  g.moveTo(view.x + view.w / 2, view.y + view.h / 2 - 8); g.lineTo(view.x + view.w / 2, view.y + view.h / 2 + 8); g.stroke();
  const tr = ED.traj, fi = frameAt(ED.time);
  if (ED.onion) for (const d of [-6, -3, 3, 6]) { const f = fi + d; if (f >= 0 && f < tr.n) drawArm(tr.frames[f].p, 0.35, d < 0 ? "#7aa7ff" : "#ff9d7a"); }
  const cur = tr.at(ED.time); const p = C.fk(cur.q);
  drawArm(p, 1);
  g.globalAlpha = 0.85; for (const t of ED.clip.targets || []) drawTarget(t); g.globalAlpha = 1; // поверх руки — чтобы было за что тянуть
  // путь кисти
  g.strokeStyle = "#5aa9ff55"; g.lineWidth = 1.5; g.beginPath();
  tr.frames.forEach((fr, i) => { const q = n2p(fr.ball); i ? g.lineTo(...q) : g.moveTo(...q); }); g.stroke();
  // ключи: цель (кольцо) и достигнутая кисть (точка)
  ED.clip.keys.forEach((k, i) => {
    const e = C.effKey(ED.clip, k), q = tr.keyQ[i], ach = n2p(C.toScreen(C.fk(q).ball));
    const red = keyRed(i);
    g.fillStyle = red ? "#ff5a5a" : i === ED.sel ? "#5aa9ff" : "#9aa3b2"; g.beginPath(); g.arc(...ach, 4, 0, 7); g.fill();
    if (e.ndc) {
      const tp = keyN2p(e.ndc); g.strokeStyle = g.fillStyle; g.lineWidth = i === ED.sel ? 3 : 1.5;
      g.beginPath(); g.arc(...tp, i === ED.sel ? 11 : 8, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(...tp); g.lineTo(...ach); g.stroke();
      g.font = "11px system-ui"; g.fillText(String(i + 1), tp[0] + 12, tp[1] - 8);
    }
  });
  if (ED.sel != null) { // манипулятор локтя выбранного ключа: тянуть — направление предплечья
    const q = tr.keyQ[ED.sel], f = C.fk(q), pe = elbowHandle(f);
    g.fillStyle = "#f2c14e"; g.beginPath(); g.rect(pe[0] - 6, pe[1] - 6, 12, 12); g.fill();
  }
  const fr = tr.frames[fi], bad = ED.issues[fi].filter((x) => x.sev === "red").length + fullAt(fi).length;
  $("status").textContent = `${ED.time.toFixed(2)} с · кадр ${fi}/${tr.n - 1}${bad ? " · КРАСНЫЙ КАДР" : ""} · рука в кадре ${Math.round(fr.inFrame * 100)}% · ` +
    `локоть ${Math.round(cur.q[3])}°, плечо: подъём ${Math.round(cur.q[0])}°, плоскость ${Math.round(cur.q[1])}°, ротация ${Math.round(cur.q[2])}°`;
  $("hint").style.display = ED.clip.keys.length ? "none" : "block";
  $("hint").innerHTML = "<b>С чего начать</b><br>1. Двойной щелчок по кадру — ключ: кисть в этом месте в этот момент.<br>" +
    "2. Сдвиньте ползунок времени внизу и поставьте ещё 2–4 ключа (взмах: слева → вверху справа → обратно).<br>" +
    "3. Пробел — проиграть. Колесо над кольцом ключа — ближе/дальше, жёлтый квадрат — локоть.<br>" +
    "Красное на шкале — нарушение анатомии; «Поправить» — ближайшая допустимая поза.";
  drawTimeline();
}
function elbowHandle(f) { const a = n2p(C.toScreen(f.W)), b = n2p(C.toScreen(f.E)); const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [a[0] + (dx / l) * 60, a[1] + (dy / l) * 60]; }
const keyRed = (i) => ED.issues.some((fs) => fs.some((x) => x.key === i && x.sev === "red"));
const frameAt = (t) => Math.max(0, Math.min(ED.traj.n - 1, Math.round((t / ED.clip.T) * (ED.traj.n - 1))));
const fullAt = (f) => ED.full.filter((r) => r.f === f);

// ---------- шкала времени ----------
const TLP = 14;
const t2x = (t) => TLP + (t / ED.clip.T) * (tl.width / (devicePixelRatio || 1) - TLP * 2);
const x2t = (x) => Math.max(0, Math.min(ED.clip.T, ((x - TLP) / (tl.width / (devicePixelRatio || 1) - TLP * 2)) * ED.clip.T));
function drawTimeline() {
  const W = tl.width / (devicePixelRatio || 1), H = tl.height / (devicePixelRatio || 1), tr = ED.traj;
  tg.clearRect(0, 0, W, H);
  for (let f = 0; f < tr.n; f++) { // полоса кадров: красные/жёлтые
    const x0 = t2x(tr.frames[f].t) - 3, sev = ED.issues[f].some((x) => x.sev === "red") || fullAt(f).length ? "#ff5a5a" : ED.issues[f].length ? "#f2c14e" : "#2f6b45";
    tg.fillStyle = sev; tg.fillRect(x0, 8, 6, 14);
  }
  tg.fillStyle = "#8a909c"; tg.font = "11px system-ui";
  for (let t = 0; t <= ED.clip.T + 1e-6; t += 0.1) { const x = t2x(t); tg.fillRect(x, 26, 1, 6); tg.fillText(t.toFixed(1), x - 8, 44); }
  if (ED.clip.release_t != null) { const x = t2x(ED.clip.release_t); tg.fillStyle = "#ff9d7a"; tg.fillRect(x - 1, 26, 2, 70); tg.fillText("выпуск", x + 4, 92); }
  ED.clip.keys.forEach((k, i) => {
    const x = t2x(k.t); tg.fillStyle = keyRed(i) ? "#ff5a5a" : i === ED.sel ? "#5aa9ff" : "#d0d4dc";
    tg.beginPath(); tg.moveTo(x, 54); tg.lineTo(x + 8, 64); tg.lineTo(x, 74); tg.lineTo(x - 8, 64); tg.fill();
  });
  const x = t2x(ED.time); tg.fillStyle = "#5aa9ff"; tg.fillRect(x - 1, 0, 2, H);
}

// ---------- панель ----------
function el(tag, attrs = {}, kids = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (k.startsWith("on")) e[k] = v; else if (k === "text") e.textContent = v; else e.setAttribute(k, v); }
  for (const c of kids) e.append(c);
  return e;
}
function numIn(val, on, step, tip = "", min) {
  const i = el("input", { type: "number", step, title: tip }); if (min != null) i.min = min;
  i.value = val == null ? "" : String(Math.round(Number(val) * 1000) / 1000);
  i.onchange = () => on(i.value === "" ? null : Number(i.value)); return i;
}
const row = (label, tip, ...inputs) => el("div", { class: "row" }, [el("label", { title: tip, text: label }), inputs.length > 1 ? el("div", { class: "pair" }, inputs) : inputs[0]]);
// Условия ключа, кроме места кисти и глубины: показываются только заданные, добавляются из списка.
const CONDS = {
  elbow: { ru: "сгиб локтя, °", tip: () => `0 — прямая рука; допустимо ${C.lim("flex").join("…")}°`, def: () => 90 },
  forearm_dir: { ru: "направление предплечья", tip: () => "Куда смотрит предплечье на экране (локоть → запястье). Тяните жёлтый квадрат в кадре", def: () => [0.6, 0.8] },
  below: { ru: "уход вниз: не выше y", tip: () => "Кисть не выше этой линии экрана (−1 — нижний край): рука уходит за кадр", def: () => -0.8 },
  elbow_off: { ru: "локоть за кадром", tip: () => "Рука входит из-за края экрана, как в BioShock", def: () => true },
  w: { ru: "вес ключа", tip: () => "Насколько строго держать ключ (1 — обычно, 2 — вдвое строже)", def: () => 2 },
};
function panel() {
  const kp = $("keyp"); kp.innerHTML = "";
  const n = ED.clip.keys.length;
  $("keytitle").textContent = ED.sel == null ? `Ключи (${n})` : `Ключ ${ED.sel + 1} из ${n}`;
  $("kprev").disabled = !n; $("knext").disabled = !n; $("kdel").disabled = ED.sel == null;
  if (ED.sel == null) kp.append(el("div", { class: "note", text: n ? "Выберите ключ: кольцо в кадре или ромб на шкале (‹ › — по очереди). Двойной щелчок по кадру — новый ключ, K — ключ в текущем моменте." : "Ключей нет. Двойной щелчок по кадру — первый ключ." }));
  else {
    const k = ED.clip.keys[ED.sel], set = (f, v, lbl) => edit(() => { if (v == null) delete k[f]; else k[f] = v; }, lbl);
    kp.append(row("время, с", "Момент ключа", numIn(k.t, (v) => edit(() => { k.t = C.r3(Math.max(0, Math.min(ED.clip.T, v ?? 0))); ED.clip.keys.sort((a, b) => a.t - b.t); ED.sel = ED.clip.keys.indexOf(k); }, "время ключа"), 0.01, "", 0)));
    if (k.attach) {
      const t = (ED.clip.targets || []).find((x) => x.id === String(k.attach).split("@")[0]);
      kp.append(row("кисть", "Ключ прилеплен к предмету: кисть идёт за ним", el("div", { class: "pair" }, [el("span", { text: (t ? t.label || t.id : k.attach) + (String(k.attach).endsWith("@end") ? " (конец хода)" : "") }), el("button", { class: "x", text: "отлепить", title: "Ключ больше не следует за предметом", onclick: () => edit(() => { const e = C.effKey(ED.clip, k); k.ndc = e.ndc.map(C.r3); delete k.attach; }, "отлеплен") })])));
    } else if (k.ndc) {
      kp.append(row("кисть ←→ / ↑↓", "Место кисти на экране: −1…+1 от края до края (тяните кольцо в кадре)",
        numIn(k.ndc[0], (v) => set("ndc", [v ?? 0, k.ndc[1]]), 0.01, "←→: −1 левый край, +1 правый"), numIn(k.ndc[1], (v) => set("ndc", [k.ndc[0], v ?? 0]), 0.01, "↑↓: −1 низ, +1 верх")));
    } else kp.append(row("кисть", "", el("button", { text: "задать место", title: "Ключ сейчас без места на экране — поставить туда, где кисть сейчас", onclick: () => { const p = C.toScreen(C.fk(ED.traj.keyQ[ED.sel]).ball); set("ndc", [C.r3(sideX(p[0])), C.r3(p[1])], "место задано"); } })));
    const d = k.depth;
    if (d) kp.append(row("глубина, м", "Расстояние кисти от камеры (от–до): чем меньше, тем крупнее кисть. Колесо над кольцом — ближе/дальше",
      numIn(d[0], (v) => set("depth", v == null ? null : [v, Math.max(v, d[1])]), 0.01, "от", C.NEAR), numIn(d[1], (v) => set("depth", v == null ? null : [Math.min(d[0], v), v]), 0.01, "до", C.NEAR)));
    for (const [f, c] of Object.entries(CONDS)) {
      if (k[f] == null) continue;
      let input;
      if (f === "elbow_off") input = el("span", { class: "note", text: "да" });
      else if (f === "forearm_dir") input = el("span", { class: "note", text: `${Math.round(Math.atan2(k[f][1], k[f][0]) * 57.3)}° к горизонту` });
      else input = numIn(k[f], (v) => set(f, v), f === "elbow" ? 1 : f === "w" ? 0.5 : 0.05, c.tip());
      kp.append(el("div", { class: "cond" }, [el("label", { title: c.tip(), text: c.ru }), input, el("button", { class: "x", text: "✕", title: "Убрать условие", onclick: () => set(f, null, "условие убрано") })]));
    }
    const add = el("select", { title: "Добавить условие к ключу" }, [el("option", { value: "", text: "+ условие…" })]);
    if (!k.depth) add.append(el("option", { value: "depth", text: "глубина" }));
    for (const [f, c] of Object.entries(CONDS)) if (k[f] == null) add.append(el("option", { value: f, text: c.ru }));
    add.onchange = () => { const f = add.value; if (!f) return; if (f === "depth") { const z = C.toScreen(C.fk(ED.traj.keyQ[ED.sel]).ball)[2]; set("depth", [C.r3(z - 0.05), C.r3(z + 0.05)], "глубина"); } else set(f, CONDS[f].def(), CONDS[f].ru); };
    if (add.options.length > 1) kp.append(el("div", { class: "row" }, [el("span"), add]));
  }
  $("T").value = Number(ED.clip.T); $("rel").value = ED.clip.release_t != null ? Number(ED.clip.release_t) : "";
  $("side_").textContent = ED.clip.side === "r" ? "правая" : "левая";
  issuesPanel();
}
function groupIssues() { // одинаковые нарушения в соседних кадрах — одной строкой «кадры 9–12», худшее значение
  const all = [];
  ED.issues.forEach((xs, f) => xs.forEach((x) => all.push({ ...x, f })));
  ED.full.forEach((r) => all.push({ sev: "red", f: r.f, msg: "полная: " + r.msg }));
  const groups = [];
  for (const x of all.sort((a, b) => (a.sev === b.sev ? a.f - b.f : a.sev === "red" ? -1 : 1))) {
    const kind = x.msg.replace(/-?[\d.]+/g, "#"), g0 = groups.find((g) => g.kind === kind && g.key === x.key && x.f - g.f1 <= 1);
    if (g0) { g0.f1 = x.f; g0.items.push(x); } else groups.push({ kind, key: x.key, sev: x.sev, f0: x.f, f1: x.f, items: [x] });
  }
  for (const g of groups) { // худшее — по первому числу в сообщении
    const v = (m) => Math.abs(Number((m.match(/-?[\d.]+/) || [0])[0]));
    g.worst = g.items.reduce((a, b) => (v(b.msg) > v(a.msg) ? b : a));
  }
  return groups;
}
function issuesPanel() {
  const groups = groupIssues(), reds = groups.filter((g) => g.sev === "red").length, warns = groups.length - reds;
  $("sum").innerHTML = reds ? `<span class="bad">Красных: ${reds}</span>${warns ? ` · предупреждений ${warns}` : ""}`
    : `<span class="good">Всё зелёное</span>${warns ? ` · предупреждений ${warns}` : ""} <span class="note">— суставы, скорости живых людей (KIT), кадр</span>`;
  $("fix").disabled = !groups.some((g) => g.sev === "red" && g.items.some((x) => x.fix));
  $("fullinfo").textContent = ED.fullInfo || (ED.server ? "" : "Полная проверка (кожа, форма кисти) — при запуске через tools/anim/editor_server.py");
  const box = $("issues"); box.innerHTML = "";
  for (const g of groups.slice(0, 40)) {
    const where = g.f0 === g.f1 ? `кадр ${g.f0}` : `кадры ${g.f0}–${g.f1}`, who = g.key != null ? ` · ключ ${g.key + 1}` : "";
    const fix = g.items.find((x) => x.fix);
    const btn = fix ? el("button", { text: "Поправить", title: "Ближайшая допустимая правка", onclick: (e) => { e.stopPropagation(); fixOne(fix); } }) : el("span");
    box.append(el("div", { class: "it " + g.sev, title: "Показать кадр", onclick: () => { ED.time = ED.traj.frames[g.worst.f].t; if (g.key != null) ED.sel = g.key; panel(); draw(); } },
      [el("div", {}, [el("div", { class: "w", text: where + who }), el("div", { text: g.worst.msg })]), btn]));
  }
}
function fixOne(x) { edit(() => C.applyFix(ED.clip, ED.traj, x.fix), "поправлено: " + x.msg); }

// ---------- мышь: кадр ----------
let drag = null;
const HIT = matchMedia("(pointer: coarse)").matches ? 26 : 14; // палец толще курсора
const mpos = (e, el) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
function hitKey(x, y) {
  let best = null;
  ED.clip.keys.forEach((k, i) => {
    const e = C.effKey(ED.clip, k); const pts = [n2p(C.toScreen(C.fk(ED.traj.keyQ[i]).ball))]; if (e.ndc) pts.push(keyN2p(e.ndc));
    for (const p of pts) { const d = Math.hypot(p[0] - x, p[1] - y); if (d < HIT && (!best || d < best.d)) best = { i, d }; }
  });
  return best && best.i;
}
function hitTarget(x, y) { return (ED.clip.targets || []).find((t) => Math.hypot(keyN2p(t.ndc)[0] - x, keyN2p(t.ndc)[1] - y) < 20); }
function nearTarget(n) { // прилипание: кисть рядом с предметом (или концом хода рычага)
  for (const t of ED.clip.targets || []) {
    if (Math.hypot(t.ndc[0] - n[0], t.ndc[1] - n[1]) < 0.08) return t.id;
    if (t.throw && Math.hypot(t.ndc[0] + t.throw[0] - n[0], t.ndc[1] + t.throw[1] - n[1]) < 0.08) return t.id + "@end";
  }
  return null;
}
let lastTap = { t: 0, x: 0, y: 0 };
cv.addEventListener("pointerdown", (e) => {
  const [x, y] = mpos(e, cv);
  if (e.pointerType !== "mouse") { // двойное касание на телефоне = двойной щелчок
    const now = performance.now();
    if (now - lastTap.t < 350 && Math.hypot(x - lastTap.x, y - lastTap.y) < 30 && hitKey(x, y) == null) { lastTap.t = 0; addKey(p2nRaw(x, y).map(C.r3)); return; }
    lastTap = { t: now, x, y };
  }
  if (ED.sel != null) { const pe = elbowHandle(C.fk(ED.traj.keyQ[ED.sel])); if (Math.hypot(pe[0] - x, pe[1] - y) < 10) { drag = { kind: "elbow", before: snapshot() }; return; } }
  const i = hitKey(x, y);
  if (i != null) { ED.sel = i; ED.time = Number(ED.clip.keys[i].t); drag = { kind: "key", before: snapshot() }; panel(); draw(); return; }
  const t = hitTarget(x, y);
  if (t) { drag = { kind: "target", t, before: snapshot() }; return; }
  ED.sel = null; panel(); draw();
});
window.addEventListener("pointermove", (e) => {
  if (!drag) return tipView(e);
  const [x, y] = mpos(e, cv), n = p2nRaw(x, y).map(C.r3);
  if (drag.kind === "key") { const k = ED.clip.keys[ED.sel]; delete k.attach; k.ndc = n; const a = nearTarget(n); if (a) k.attach = a; }
  else if (drag.kind === "target") drag.t.ndc = n;
  else if (drag.kind === "elbow") { // направление предплечья (локоть → запястье) на экране, в осях левой руки
    const f = C.fk(ED.traj.keyQ[ED.sel]), w = n2p(C.toScreen(f.W)); let dx = w[0] - x, dy = -(w[1] - y); const l = Math.hypot(dx, dy) || 1;
    ED.clip.keys[ED.sel].forearm_dir = [C.r3(dx / l), C.r3(dy / l)];
  }
  recompute();
});
window.addEventListener("pointerup", () => {
  if (!drag) return;
  if (drag.before !== snapshot()) { ED.undo.push(drag.before); ED.redo = []; changed(drag.kind === "target" ? "предмет сдвинут" : "ключ сдвинут"); }
  drag = null;
});
cv.addEventListener("dblclick", (e) => {
  const [x, y] = mpos(e, cv), n = p2nRaw(x, y).map(C.r3);
  if (hitKey(x, y) != null) return;
  addKey(n);
});
function addKey(n) {
  edit(() => {
    const cur = ED.traj.at(ED.time), z = C.toScreen(C.fk(cur.q).ball)[2];
    const k = { t: C.r3(ED.time), ndc: n, depth: [C.r3(Math.max(C.NEAR + 0.04, z - 0.05)), C.r3(Math.max(C.NEAR + 0.1, z + 0.05))] };
    const a = nearTarget(n); if (a) k.attach = a;
    const same = ED.clip.keys.findIndex((q) => Math.abs(q.t - k.t) < 0.005);
    if (same >= 0) { ED.clip.keys[same] = { ...ED.clip.keys[same], ...k }; ED.sel = same; }
    else { ED.clip.keys.push(k); ED.clip.keys.sort((a, b) => a.t - b.t); ED.sel = ED.clip.keys.indexOf(k); }
  }, "ключ добавлен");
}
cv.addEventListener("wheel", (e) => {
  if (ED.sel == null) return; e.preventDefault();
  const k = ED.clip.keys[ED.sel], d = k.depth || [0.2, 0.3], s = e.deltaY > 0 ? 0.01 : -0.01;
  edit(() => { k.depth = [C.r3(Math.max(C.NEAR + 0.02, d[0] + s)), C.r3(Math.max(C.NEAR + 0.05, d[1] + s))]; }, "глубина " + k.depth?.join("–"));
}, { passive: false });
function tipView(e) {
  if (e.target !== cv) return;
  const [x, y] = mpos(e, cv), i = hitKey(x, y);
  if (i == null) return hideTip();
  const k = ED.clip.keys[i], f = frameAt(k.t), xs = ED.issues[f].filter((v) => v.key === i || v.key == null);
  showTip(e, `ключ ${i + 1} · ${Number(k.t).toFixed(2)} с${k.attach ? " · прилеплен к " + k.attach : ""}<br>` + (xs.length ? xs.map((v) => v.msg).join("<br>") : "без нарушений") +
    "<br><span style='color:#8a909c'>тянуть — кисть; колесо — глубина; жёлтый квадрат — локоть</span>");
}
const showTip = (e, html) => { const t = $("tip"); t.innerHTML = html; t.style.display = "block"; t.style.left = e.clientX + 14 + "px"; t.style.top = e.clientY + 14 + "px"; };
const hideTip = () => { $("tip").style.display = "none"; };

// ---------- мышь: шкала ----------
let tdrag = null;
tl.addEventListener("pointerdown", (e) => {
  const [x, y] = mpos(e, tl);
  const i = ED.clip.keys.findIndex((k) => Math.abs(t2x(k.t) - x) < 9 && y > 50 && y < 78);
  if (i >= 0) { ED.sel = i; tdrag = { key: ED.clip.keys[i], before: snapshot() }; }
  else { tdrag = { scrub: true }; ED.time = x2t(x); }
  panel(); draw();
});
window.addEventListener("pointermove", (e) => {
  if (e.target === tl && !tdrag) {
    const [x] = mpos(e, tl), f = frameAt(x2t(x)), xs = [...ED.issues[f], ...fullAt(f)];
    xs.length ? showTip(e, `кадр ${f}: ` + xs.map((v) => v.msg).join("<br>")) : hideTip();
  }
  if (!tdrag) return;
  const [x] = mpos(e, tl);
  if (tdrag.scrub) { ED.time = x2t(x); draw(); return; }
  tdrag.key.t = C.r3(Math.round(x2t(x) * C.FPS) / C.FPS); ED.time = Number(tdrag.key.t); recompute();
});
window.addEventListener("pointerup", () => {
  if (tdrag && tdrag.key) {
    ED.clip.keys.sort((a, b) => a.t - b.t); ED.sel = ED.clip.keys.indexOf(tdrag.key);
    if (tdrag.before !== snapshot()) { ED.undo.push(tdrag.before); ED.redo = []; changed("ключ сдвинут по времени"); }
  }
  tdrag = null;
});

// ---------- клавиши, проигрывание ----------
let last = 0;
function tick(ts) {
  if (ED.playing) {
    const dt = last ? (ts - last) / 1000 : 0; ED.time += dt * Number($("speed").value);
    if (ED.time > ED.clip.T) ED.time = 0; draw();
  }
  last = ts; requestAnimationFrame(tick);
}
const play = (on = !ED.playing) => { ED.playing = on; $("play").textContent = on ? "■" : "▶"; };
window.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") { if (e.key === "Enter" && e.target.id === "cmd") command(); return; }
  const ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (ctrl && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
  else if (ctrl && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
  else if (e.key === " ") { e.preventDefault(); play(); }
  else if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); play(false); const f = frameAt(ED.time) + (e.key === "ArrowLeft" ? -1 : 1); ED.time = ED.traj.frames[Math.max(0, Math.min(ED.traj.n - 1, f))].t; draw(); }
  else if ((e.key === "Delete" || e.key === "Backspace") && ED.sel != null) { const i = ED.sel; ED.sel = null; edit(() => ED.clip.keys.splice(i, 1), "ключ удалён"); }
  else if (e.key.toLowerCase() === "k" || e.key.toLowerCase() === "л") { const p = C.toScreen(C.fk(ED.traj.at(ED.time).q).ball); addKey([C.r3(sideX(p[0])), C.r3(p[1])]); }
});

// ---------- кнопки ----------
$("undo").onclick = undo; $("redo").onclick = redo; $("save").onclick = save; $("play").onclick = () => play();
$("onion").onclick = () => { ED.onion = !ED.onion; $("onion").classList.toggle("on", ED.onion); draw(); };
$("mirror").onclick = () => edit(() => C.mirrorClip(ED.clip), "зеркало: теперь " + (ED.clip.side === "r" ? "левая" : "правая") + " рука");
$("new").onclick = () => { const b = snapshot(); ED.name = ""; ED.clip = C.emptyClip(); ED.undo.push(b); ED.redo = []; ED.sel = null; ED.time = 0; changed("новый клип"); };
$("open").onclick = () => $("file").click();
$("file").onchange = async () => { const f = $("file").files[0]; if (!f) return; const b = snapshot(); ED.clip = C.parseClip(await f.text()); ED.name = f.name; ED.undo.push(b); ED.sel = null; changed("открыт " + f.name); };
$("clips").onchange = () => load($("clips").value);
$("T").onchange = () => edit(() => { ED.clip.T = Math.max(0.1, Number($("T").value)); }, "длительность");
$("rel").onchange = () => edit(() => { if ($("rel").value === "") delete ED.clip.release_t; else ED.clip.release_t = Number($("rel").value); }, "выпуск");
$("addtg").onchange = () => {
  const kind = $("addtg").value; $("addtg").value = ""; if (!kind) return;
  edit(() => {
    ED.clip.targets = ED.clip.targets || [];
    const n = ED.clip.targets.filter((t) => t.kind === kind).length + 1, ru = { lever: "рычаг", door: "ручка двери", item: "предмет" }[kind];
    const t = { id: kind + n, kind, label: ru + (n > 1 ? " " + n : ""), ndc: [0.25, kind === "item" ? -0.35 : 0.1], depth: 0.4 };
    if (kind === "lever") t.throw = [0, -0.35];
    ED.clip.targets.push(t);
  }, "предмет поставлен: тяните его; ключ рядом с ним прилипнет");
};
function fixAll() {
  let n = 0;
  edit(() => {
    for (let pass = 0; pass < 6; pass++) {
      const tr = C.trajectory(ED.clip, ED.cache), is = C.quickCheck(ED.clip, tr);
      const x = is.flat().find((v) => v.sev === "red" && v.fix);
      if (!x || !C.applyFix(ED.clip, tr, x.fix)) break; n++;
    }
  });
  say(n ? `поправлено: ${n}` : "нечего поправлять автоматически");
}
$("fix").onclick = fixAll;
const selKey = (d) => { const n = ED.clip.keys.length; if (!n) return; ED.sel = ED.sel == null ? (d > 0 ? 0 : n - 1) : (ED.sel + d + n) % n; ED.time = Number(ED.clip.keys[ED.sel].t); panel(); draw(); };
$("kprev").onclick = () => selKey(-1); $("knext").onclick = () => selKey(1);
$("kdel").onclick = () => { if (ED.sel == null) return; const i = ED.sel; ED.sel = null; edit(() => ED.clip.keys.splice(i, 1), "ключ удалён"); };
$("cmdgo").onclick = () => command();
async function fullCheck() {
  if (!ED.server) { say("полная проверка — в редакторе через tools/anim/editor_server.py (или в сессии ИИ: tools/anim/pipeline.sh check)"); return; }
  await save(); say("полная проверка идёт…"); $("full").disabled = true;
  try {
    const r = await (await fetch("api/check?name=" + encodeURIComponent(ED.name), { method: "POST" })).json();
    ED.full = (r.rows || []).map((x) => ({ f: frameAt(x.t), msg: x.msg }));
    ED.fullInfo = r.summary || ""; say(r.summary || "готово"); panel(); draw();
  } finally { $("full").disabled = false; }
}
$("full").onclick = fullCheck;
async function command() {
  const text = $("cmd").value.trim(); if (!text) return;
  let done = [];
  edit(() => { done = C.localCommand(ED.clip, text, ED.sel); });
  if (done.length) { say("сделано: " + done.join(", ") + " (Ctrl+Z — отменить)"); $("cmd").value = ""; return; }
  if (ED.server) {
    await fetch("api/ai", { method: "POST", body: JSON.stringify({ name: ED.name, text }) });
    say("передано ИИ-сессии (tools/anim/editor_inbox.md); правка файла появится здесь сама"); $("cmd").value = "";
  } else say("не понял; полные команды — при запуске через editor_server.py (их выполняет ИИ-сессия)");
}

// ИИ-сессия правит файл клипа → редактор подхватывает изменение как обычную правку (отменяется Ctrl+Z).
async function watch() {
  if (!ED.server || !ED.name || ED.dirty) return;
  try {
    const r = await fetch("api/clip?name=" + encodeURIComponent(ED.name), { method: "HEAD" });
    const m = Number(r.headers.get("X-Mtime") || 0);
    if (m && ED.mtime && m !== ED.mtime) {
      const text = await (await fetch("api/clip?name=" + encodeURIComponent(ED.name))).text();
      ED.mtime = m; ED.undo.push(snapshot()); ED.redo = []; ED.clip = C.parseClip(text); ED.full = []; recompute(); ED.dirty = false;
      say("файл изменён снаружи (ИИ) — подхвачено; Ctrl+Z — отменить");
    }
  } catch (e) { /* сервер остановлен */ }
}

async function init() {
  let list = [];
  try { const r = await fetch("api/clips"); if (r.ok) { list = await r.json(); ED.server = true; } } catch (e) { /* статическая сборка */ }
  if (!ED.server) { try { list = await (await fetch("clips/index.json")).json(); } catch (e) { list = []; } }
  $("clips").innerHTML = '<option value="">— клип —</option>' + list.map((n) => `<option>${n}</option>`).join("");
  $("full").title += ED.server ? "" : " — недоступно в опубликованной сборке";
  window.addEventListener("resize", layout);
  recompute(); layout(); requestAnimationFrame(tick);
  const want = new URLSearchParams(location.search).get("clip");
  if (want) { $("clips").value = want; await load(want); }
  setInterval(watch, 1500);
  ED.ready = true;
}
ED.api = { load, save, undo, redo, addKey, fixAll, command, recompute };
init();
