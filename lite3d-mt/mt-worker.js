// Воркер lite3d-mt: ждёт шага, копирует вход из общей памяти в память WASM (crowdw),
// берёт порции юнитов через общий счётчик, считает и пишет силу обратно.
// Ядро — то же crowdk, что в Rust.
const EPOCH = 0, DONE = 1, N = 2, G = 3, NEXT = 4, CHUNKS = 5;

onmessage = async ({ data: { mod, S, w, CAP, CELLS } }) => {
  const { exports: k } = await WebAssembly.instantiate(mod, {});
  k.setup(CAP, CELLS);
  const mem = k.memory.buffer;
  const sx = new Float32Array(mem, k.ptr_sx(), CAP + 4), sz = new Float32Array(mem, k.ptr_sz(), CAP + 4);
  const starts = new Uint32Array(mem, k.ptr_starts(), CELLS + 1);
  const ox = new Float32Array(mem, k.ptr_out_x(), CAP), oz = new Float32Array(mem, k.ptr_out_z(), CAP);
  const { ctrl, owner, CH } = S;
  postMessage("ready");
  let seen = Atomics.load(ctrl, EPOCH);
  for (;;) {
    Atomics.wait(ctrl, EPOCH, seen);
    seen = Atomics.load(ctrl, EPOCH);
    const n = ctrl[N], g = ctrl[G], chunks = ctrl[CHUNKS];
    let copied = false;
    for (let c; (c = Atomics.add(ctrl, NEXT, 1)) < chunks;) {
      // Вход копируем, только если порция досталась (поздно проснувшись, можно не успеть).
      if (!copied) {
        sx.set(S.sx.subarray(0, n + 4)); sz.set(S.sz.subarray(0, n + 4));
        starts.set(S.starts.subarray(0, g * g + 1));
        copied = true;
      }
      const a = c * CH, b = Math.min(n, a + CH);
      k.run(g, a, b);
      S.ox.set(ox.subarray(0, b - a), a); S.oz.set(oz.subarray(0, b - a), a);
      owner[c] = w;
    }
    Atomics.add(ctrl, DONE, 1);
  }
};
