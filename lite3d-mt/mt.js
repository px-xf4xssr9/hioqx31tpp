// Многопоточность для lite3d-mt: общая память и воркеры с WASM-ядром crowdw.
// Задаёт window.gengineMt = { workers, chunk, begin, next, end } (их зовёт Rust, crates/lite/src/mt.rs).
// Без изоляции страницы (нет SharedArrayBuffer) ничего не задаёт — сборка считает в одном потоке.
// Воркеров: ?threads=N; по умолчанию все ядра, кроме главного потока и одного для браузера.
// Работа делится на порции (?chunk=, по умолчанию 512 юнитов): каждый поток берёт следующую
// свободную через общий счётчик — быстрые ядра делают больше, медленные меньше.

const params = new URLSearchParams(location.search);
const isolated = self.crossOriginIsolated === true && typeof SharedArrayBuffer !== "undefined";
const cores = navigator.hardwareConcurrency || 1;
const want = params.has("threads") ? Number(params.get("threads")) : cores - 2;
const W = isolated ? Math.max(0, Math.min(15, cores - 1, want | 0)) : 0;
const CH = Math.max(64, Number(params.get("chunk")) || 512);

// Панель (harness.js) подключается позже этого файла: строки пишем, когда она готова.
const note = (k, v) => {
  if (window.gengineNote) window.gengineNote(k, v);
  else addEventListener("DOMContentLoaded", () => window.gengineNote?.(k, v), { once: true });
};
note("Изоляция", isolated ? "да" : "нет (общей памяти нет)");

// Управление: [0] эпоха шага, [1] сколько воркеров закончили, [2] n, [3] g, [4] следующая порция, [5] порций.
const EPOCH = 0, DONE = 1, N = 2, G = 3, NEXT = 4, CHUNKS = 5;

if (W > 0) {
  const units = Math.max(1, Number(params.get("units") ?? 1000));
  const CAP = units, CELLS = 1 << 16, PAD = 4, MAXCH = Math.ceil(CAP / CH);
  const sab = (T, len) => new T(new SharedArrayBuffer(T.BYTES_PER_ELEMENT * len));
  const S = {
    ctrl: sab(Int32Array, 8), CH,
    sx: sab(Float32Array, CAP + PAD), sz: sab(Float32Array, CAP + PAD),
    starts: sab(Uint32Array, CELLS + 1),
    ox: sab(Float32Array, CAP), oz: sab(Float32Array, CAP),
    // Кто посчитал порцию: номер воркера или -1 (главный поток).
    owner: sab(Int32Array, MAXCH),
  };
  const ctrl = S.ctrl, owner = S.owner;
  let ready = 0;
  note("Потоков", `1 + ${W} (ядер ${cores}), воркеры запускаются…`);
  WebAssembly.compileStreaming(fetch(new URL("./crowdw.wasm", import.meta.url))).then((mod) => {
    for (let w = 0; w < W; w++) {
      const worker = new Worker(new URL("./mt-worker.js", import.meta.url), { type: "module" });
      worker.onmessage = () => {
        if (++ready === W) note("Потоков", `1 + ${W} (ядер ${cores}), порции по ${CH}`);
      };
      worker.onerror = (e) => note("Потоков", `ошибка воркера: ${e.message}`);
      worker.postMessage({ mod, S, w, CAP, CELLS });
    }
  });

  // Средние за 2 секунды: сколько стоят копии и ожидание, какую долю сделал главный поток.
  let sn = 0, sCopy = 0, sWait = 0, sShare = 0, sLast = performance.now();
  let chunks = 0, mine = 0, tCopy = 0;
  const stats = (wait) => {
    sn++; sCopy += tCopy; sWait += wait; sShare += mine / chunks;
    const now = performance.now();
    if (now - sLast < 2000) return;
    note("Воркеры", `копирование ${(sCopy / sn).toFixed(2)} мс, ожидание ${(sWait / sn).toFixed(2)} мс, главный посчитал ${Math.round((sShare / sn) * 100)}%`);
    sn = 0; sCopy = 0; sWait = 0; sShare = 0; sLast = now;
  };

  window.gengineMt = {
    workers: W,
    chunk: CH,
    begin(sx, sz, starts, n, g) {
      if (ready < W || n > CAP || g * g > CELLS) return false;
      const t = performance.now();
      S.sx.set(sx); S.sz.set(sz); S.starts.set(starts);
      chunks = Math.ceil(n / CH); mine = 0;
      ctrl[N] = n; ctrl[G] = g; ctrl[CHUNKS] = chunks;
      Atomics.store(ctrl, NEXT, 0);
      Atomics.store(ctrl, DONE, 0);
      Atomics.add(ctrl, EPOCH, 1);
      Atomics.notify(ctrl, EPOCH);
      tCopy = performance.now() - t;
      return true;
    },
    next() {
      const c = Atomics.add(ctrl, NEXT, 1);
      if (c >= chunks) return -1;
      owner[c] = -1; mine++;
      return c;
    },
    end(ox, oz, n) {
      // Главному потоку ждать через Atomics.wait нельзя — короткое активное ожидание.
      const t = performance.now();
      while (Atomics.load(ctrl, DONE) < W) { /* ждём воркеров */ }
      const t1 = performance.now();
      for (let c = 0; c < chunks; c++) {
        if (owner[c] < 0) continue;
        const a = c * CH, b = Math.min(n, a + CH);
        ox.set(S.ox.subarray(a, b), a); oz.set(S.oz.subarray(a, b), a);
      }
      tCopy += performance.now() - t1;
      stats(t1 - t);
    },
  };
} else {
  note("Потоков", "1");
}
