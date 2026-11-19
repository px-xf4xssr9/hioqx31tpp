// Воркер lite3d-mt: ждёт шага, копирует вход из общей памяти в память WASM (crowdw),
// считает свою долю юнитов и пишет силу обратно. Ядро — то же crowdk, что в Rust.
onmessage = async ({ data: { mod, S, w, CAP, CELLS } }) => {
  const { exports: k } = await WebAssembly.instantiate(mod, {});
  k.setup(CAP, CELLS);
  const mem = k.memory.buffer;
  const sx = new Float32Array(mem, k.ptr_sx(), CAP + 4), sz = new Float32Array(mem, k.ptr_sz(), CAP + 4);
  const starts = new Uint32Array(mem, k.ptr_starts(), CELLS + 1);
  const ox = new Float32Array(mem, k.ptr_out_x(), CAP), oz = new Float32Array(mem, k.ptr_out_z(), CAP);
  const ctrl = S.ctrl;
  postMessage("ready");
  let seen = Atomics.load(ctrl, 0);
  for (;;) {
    Atomics.wait(ctrl, 0, seen);
    seen = Atomics.load(ctrl, 0);
    const n = ctrl[2], g = ctrl[3], k0 = ctrl[8 + 2 * w], k1 = ctrl[9 + 2 * w];
    if (k1 > k0) {
      sx.set(S.sx.subarray(0, n + 4)); sz.set(S.sz.subarray(0, n + 4));
      starts.set(S.starts.subarray(0, g * g + 1));
      k.run(g, k0, k1);
      S.ox.set(ox.subarray(0, k1 - k0), k0);
      S.oz.set(oz.subarray(0, k1 - k0), k0);
    }
    Atomics.add(ctrl, 1, 1);
  }
};
