// Общий загрузчик и панель замера для всех сборок этапа 0.
// Даёт сборке window.gengineReport / window.gengineParam, считает загрузку
// и показывает итог, который можно скопировать одной кнопкой.

const params = new URLSearchParams(location.search);
const state = { variant: document.body.dataset.variant || "?", downloaded: 0 };
const panel = document.getElementById("panel");
const splash = document.getElementById("splash");

function row(key, label) {
  let el = panel.querySelector(`[data-k="${key}"]`);
  if (!el) {
    el = document.createElement("div");
    el.dataset.k = key;
    panel.querySelector(".rows").appendChild(el);
  }
  el.dataset.label = label;
  return el;
}

function set(key, label, value) {
  row(key, label).textContent = `${label}: ${value}`;
  state[key] = value;
}

function kb(bytes) {
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(2)} МБ` : `${(bytes / 1024).toFixed(0)} КБ`;
}

window.gengineParam = (name) => {
  const v = params.get(name);
  return v === null ? NaN : Number(v);
};

window.gengineReport = (kind, value) => {
  if (kind === "first_frame") {
    const t = performance.now();
    set("first_frame", "Первый кадр", `${t.toFixed(0)} мс`);
    splash.classList.add("hidden");
    // Сколько реально скачали (сжатые байты) — по данным браузера.
    const bytes = performance
      .getEntriesByType("resource")
      .concat(performance.getEntriesByType("navigation"))
      .reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0);
    if (bytes) set("transfer", "Скачано", kb(bytes));
    set("fps_avg", "Средний FPS", "меряю 12 с…");
  } else if (kind === "fps_avg") {
    set("fps_avg", "Средний FPS", value.toFixed(1));
  } else if (kind === "cpu_ms") {
    set("cpu_ms", "Процессор на кадр", `${value.toFixed(2)} мс`);
  } else if (kind === "check") {
    set("check", "Контроль (шаг 640)", value.toFixed(4));
  } else if (kind === "sim_ms") {
    set("sim_ms", "  из них логика", `${value.toFixed(2)} мс`);
  } else if (kind === "fps_low") {
    set("fps_low", "1% худших", `${value.toFixed(1)} FPS`);
    panel.classList.add("done");
  }
};

function fail(msg) {
  if (String(msg).includes("Using exceptions for control flow")) return;
  const box = document.getElementById("error");
  box.querySelector(".msg").textContent = String(msg).slice(0, 400);
  box.classList.remove("hidden");
}
window.addEventListener("error", (e) => fail(e.message || e.error));
window.addEventListener("unhandledrejection", (e) => fail(e.reason));
document.getElementById("restart").onclick = () => location.reload();

document.getElementById("copy").onclick = () => {
  const ua = navigator.userAgent.replace(/\s+/g, " ");
  const lines = [...panel.querySelectorAll(".rows div")].map((d) => d.textContent);
  const text = [`${state.variant} units=${params.get("units") || "по умолчанию"}`, ...lines, ua].join("\n");
  navigator.clipboard?.writeText(text);
  document.getElementById("copy").textContent = "Скопировано";
};

// Показ прогресса скачивания WASM с сохранением потоковой компиляции.
export async function fetchWithProgress(url, total) {
  const res = await fetch(url);
  const len = Number(res.headers.get("content-length")) || total || 0;
  if (!res.body) return res;
  let got = 0;
  const bar = splash.querySelector(".bar > div");
  const stream = res.body.pipeThrough(
    new TransformStream({
      transform(chunk, ctrl) {
        got += chunk.byteLength;
        if (len) bar.style.width = `${Math.min(100, (got / len) * 100).toFixed(0)}%`;
        ctrl.enqueue(chunk);
      },
    }),
  );
  return new Response(stream, { headers: res.headers, status: res.status });
}

set("variant", "Сборка", state.variant);
set("gpu", "Графика", (() => {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return "WebGL2 недоступен";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "WebGL2";
  } catch {
    return "?";
  }
})());
