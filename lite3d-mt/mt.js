// Многопоточность для lite3d-mt: общая память и воркеры с WASM-ядром crowdw.
// Задаёт window.gengineMt = { workers, begin, end } (их зовёт Rust, crates/lite/src/mt.rs).
// Без изоляции страницы (нет SharedArrayBuffer) ничего не задаёт — сборка считает в одном потоке.
// Воркеров: ?threads=N (по умолчанию 3, то есть 4 потока вместе с главным).

const params = new URLSearchParams(location.search);
const isolated = self.crossOriginIsolated === true && typeof SharedArrayBuffer !== "undefined";
const cores = navigator.hardwareConcurrency || 1;
const W = Math.max(0, Math.min(15, Number(params.get("threads") ?? 3), cores - 1));

// Панель (harness.js) подключается позже этого файла: строки пишем, когда она готова.
const note = (k, v) => {
  if (window.gengineNote) window.gengineNote(k, v);
  else addEventListener("DOMContentLoaded", () => window.gengineNote?.(k, v), { once: true });
};
note("Изоляция", isolated ? "да" : "нет (общей памяти нет)");

if (isolated && W > 0) {
  const units = Math.max(1, Number(params.get("units") ?? 1000));
  const CAP = units, CELLS = 1 << 16, PAD = 4;
  // Управление: [0] эпоха шага, [1] сколько воркеров закончили, [2] n, [3] g, [8 + 2w] k0, [9 + 2w] k1.
  const ctrl = new Int32Array(new SharedArrayBuffer(4 * (8 + 2 * W)));
  const f32 = (len) => new Float32Array(new SharedArrayBuffer(4 * len));
  const S = {
    ctrl,
    sx: f32(CAP + PAD), sz: f32(CAP + PAD),
    starts: new Uint32Array(new SharedArrayBuffer(4 * (CELLS + 1))),
    ox: f32(CAP), oz: f32(CAP),
  };
  let ready = 0;
  note("Потоков", `1 + ${W} (ядер ${cores}), воркеры запускаются…`);
  const module = WebAssembly.compileStreaming(fetch(new URL("./crowdw.wasm", import.meta.url)));
  module.then((mod) => {
    for (let w = 0; w < W; w++) {
      const worker = new Worker(new URL("./mt-worker.js", import.meta.url), { type: "module" });
      worker.onmessage = () => {
        if (++ready === W) note("Потоков", `1 + ${W} (ядер ${cores})`);
      };
      worker.onerror = (e) => note("Потоков", `ошибка воркера: ${e.message}`);
      worker.postMessage({ mod, S, w, CAP, CELLS });
    }
  });

  window.gengineMt = {
    workers: W,
    begin(sx, sz, starts, n, g, kMain) {
      if (ready < W || n > CAP || g * g > CELLS) return false;
      S.sx.set(sx); S.sz.set(sz); S.starts.set(starts);
      const per = Math.ceil((n - kMain) / W);
      ctrl[2] = n; ctrl[3] = g;
      for (let w = 0; w < W; w++) {
        const k0 = Math.min(n, kMain + w * per);
        ctrl[8 + 2 * w] = k0; ctrl[9 + 2 * w] = Math.min(n, k0 + per);
      }
      Atomics.store(ctrl, 1, 0);
      Atomics.add(ctrl, 0, 1);
      Atomics.notify(ctrl, 0);
      return true;
    },
    end(ox, oz, kMain, n) {
      // Главному потоку ждать через Atomics.wait нельзя — короткое активное ожидание.
      while (Atomics.load(ctrl, 1) < W) { /* ждём воркеров */ }
      ox.set(S.ox.subarray(kMain, n), kMain);
      oz.set(S.oz.subarray(kMain, n), kMain);
    },
  };
} else {
  note("Потоков", "1");
}
