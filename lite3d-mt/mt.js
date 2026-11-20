// Многопоточность для lite3d-mt: общая память и воркеры с WASM-ядром crowdw.
// Задаёт window.gengineMt = { workers, chunk, begin, next, end } (их зовёт Rust, crates/lite/src/mt.rs)
// и window.gengineThreads = { mode, threads, set(mode, threads) } — выбор режима (настройки игрока).
// Режимы (ARCHITECTURE «Режимы потоков»): auto | 1 | workers | mt. Источник: ?mode= / ?threads=
// (только на этот запуск) → сохранённый выбор игрока → auto. threads — число воркеров (плюс главный).
// auto: изоляция есть → телефон 1 + 3, ПК ядра − 1; нет → 1 поток. mt без изоляции недоступен → 1 поток.
// workers (сообщения, без общей памяти): задач для него пока нет — ИИ групп появится с первой ареной.
// Страховка: воркер упал или не ответил за STALL мс → воркеры останавливаются, дальше 1 поток;
// шаг пересчитывается главным потоком, результат тот же (бит в бит).
// Работа делится на порции (?chunk=, по умолчанию 512 юнитов) через общий счётчик.
// Проверка страховки: ?fault=hang:K — воркер 0 зависает на шаге K (scripts/e2e).
const params = new URLSearchParams(location.search);
const isolated = self.crossOriginIsolated === true && typeof SharedArrayBuffer !== "undefined";
const cores = navigator.hardwareConcurrency || 1;
const mobile = navigator.userAgentData?.mobile ?? /Android|iPhone|iPad/i.test(navigator.userAgent);
const MODES = ["auto", "1", "workers", "mt"], KEY = "gengine.threads";
const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
const pick = (k) => (params.has(k) ? params.get(k) : saved[k]);
const mode = MODES.includes(pick("mode")) ? pick("mode") : "auto";
const asked = pick("threads") != null && pick("threads") !== "" ? Number(pick("threads")) | 0 : null;
const autoW = Math.max(0, mobile ? Math.min(3, cores - 2) : cores - 2);
const maxW = Math.max(0, Math.min(15, cores - 1));
let W = 0, why = "";
if (mode === "1") why = "выбран 1 поток";
else if (mode === "workers") why = "Воркеры: задач пока нет (ИИ групп — с первой ареной)";
else if (!isolated) why = mode === "mt" ? "«Все ядра» недоступны: нет изоляции страницы" : "нет изоляции";
else W = Math.max(0, Math.min(maxW, asked ?? autoW));
const CH = Math.max(64, Number(params.get("chunk")) || 512);
const STALL = 500;
const fault = /^hang:(\d+)$/.exec(params.get("fault") || "");

window.gengineThreads = {
  mode, threads: W, isolated, maxWorkers: isolated ? maxW : 0,
  // Сохранить выбор игрока и перезапустить страницу (режим меняется только на старте).
  set(m, threads) {
    try { localStorage.setItem(KEY, JSON.stringify({ mode: m, threads })); } catch { /* приватный режим */ }
    const u = new URL(location.href);
    u.searchParams.delete("mode"); u.searchParams.delete("threads");
    location.replace(u);
  },
};

// Панель (harness.js) подключается позже этого файла: строки пишем, когда она готова.
const note = (k, v) => {
  if (window.gengineNote) window.gengineNote(k, v);
  else addEventListener("DOMContentLoaded", () => window.gengineNote?.(k, v), { once: true });
};
note("Изоляция", isolated ? "да" : "нет (общей памяти нет)");
note("Режим", mode + (why ? ` — ${why}` : ""));

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
  let ready = 0, failed = false;
  const workers = [];
  // Сбой: остановить воркеров и дальше считать в одном потоке.
  const fail = (reason) => {
    if (failed) return;
    failed = true;
    workers.forEach((x) => x.terminate());
    note("Потоков", `1 — сбой воркеров (${reason}), переход на 1 поток`);
    console.warn("gengine: воркеры остановлены:", reason);
  };
  note("Потоков", `1 + ${W} (ядер ${cores}), воркеры запускаются…`);
  WebAssembly.compileStreaming(fetch(new URL("./crowdw.wasm", import.meta.url))).then((mod) => {
    for (let w = 0; w < W; w++) {
      const worker = new Worker(new URL("./mt-worker.js", import.meta.url), { type: "module" });
      worker.onmessage = () => {
        if (++ready === W) note("Потоков", `1 + ${W} (ядер ${cores}), порции по ${CH}`);
      };
      worker.onerror = (e) => fail(`ошибка: ${e.message}`);
      workers.push(worker);
      worker.postMessage({ mod, S, w, CAP, CELLS, hang: fault && w === 0 ? Number(fault[1]) : -1 });
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
      if (failed || ready < W || n > CAP || g * g > CELLS) return false;
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
    // false — воркеры не успели (сбой): шаг целиком пересчитает главный поток.
    end(ox, oz, n) {
      // Главному потоку ждать через Atomics.wait нельзя — короткое активное ожидание с пределом.
      const t = performance.now();
      while (Atomics.load(ctrl, DONE) < W) {
        if (performance.now() - t > STALL) { fail(`нет ответа ${STALL} мс`); return false; }
      }
      const t1 = performance.now();
      for (let c = 0; c < chunks; c++) {
        if (owner[c] < 0) continue;
        const a = c * CH, b = Math.min(n, a + CH);
        ox.set(S.ox.subarray(a, b), a); oz.set(S.oz.subarray(a, b), a);
      }
      tCopy += performance.now() - t1;
      stats(t1 - t);
      return true;
    },
  };
} else {
  note("Потоков", "1");
}
