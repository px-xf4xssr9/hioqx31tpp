// Редактор анимаций рук: модель руки, быстрый решатель позы и быстрые проверки (в браузере).
// Кинематика и камера — копия tools/anim/motion/arm_dyn.py (fk, to_screen), числа те же:
// длины ANSUR II, камера рук (глаз от плеча, наклон 8°, FOV 65°, экран 2.17:1), пределы суставов
// из anatomy/arm_rom.json (ROM в arm_dyn), скорость разгиба локтя — живые броски KIT +5%.
// Это предпросмотр: точное движение строит keyed.py («Сгенерировать» через editor_server.py).

export const SEG = { upper: 0.335, fore: 0.267, hand: 0.105 };
export const EYE = [-0.175, 0.242, 0.09];
export const CAM = { pitch: 8, vfov: 65, asp: 2.17 };
// [мин, макс] и русское имя; порядок как q в keyed.py: подъём, плоскость, ротация, сгиб локтя
export const JOINTS = [
  { id: "elev", name: "плечо: подъём", lim: [0, 180] },
  { id: "plane", name: "плечо: плоскость подъёма", lim: [-60, 135] },
  { id: "hrot", name: "плечо: ротация", lim: [-90, 70] },
  { id: "flex", name: "локоть: сгиб", lim: [0, 150] },
];
// anatomy/arm_mocap.json kit_throws.elbow_ext_vel_max[2] = 1065 °/с, ×1.05 как в keyed.py
export const ELBOW_VEL_MAX = 1065 * 1.05;
export const NEAR_MIN = 0.12; // не ближе 12 см к камере (keyed.py)
export const FPS = 30;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));
const rad = (d) => (d * Math.PI) / 180;

function rotv(axis, ang, x) { // формула Родрига: поворот x вокруг axis на ang°
  const k = norm(axis), a = rad(ang), c = Math.cos(a), s = Math.sin(a);
  return add(add(mul(x, c), mul(cross(k, x), s)), mul(k, dot(k, x) * (1 - c)));
}
function minRotv(a, b, x) { // кратчайший поворот a → b, применённый к x
  a = norm(a); b = norm(b);
  const v = cross(a, b), c = dot(a, b);
  if (Math.hypot(...v) < 1e-9) return x;
  const vx = cross(v, x);
  return add(add(x, vx), mul(cross(v, vx), 1 / (1 + c)));
}

/** q (°) → точки тела от плеча: локоть E, запястье W, кисть (точка мяча) B, кончик H. */
export function fk(q) {
  const [el, pl, hr, fl] = q, e = rad(el), p = rad(pl);
  const UP = [0, 1, 0], OUT = [1, 0, 0], FWD = [0, 0, 1];
  const u = add(mul(UP, -Math.cos(e)), mul(add(mul(OUT, Math.cos(p)), mul(FWD, Math.sin(p))), Math.sin(e)));
  const med = minRotv(mul(UP, -1), u, mul(OUT, -1));
  const h = rotv(u, hr, med);
  const fa = rotv(h, fl, u);
  const E = mul(u, SEG.upper), W = add(E, mul(fa, SEG.fore));
  return { S: [0, 0, 0], E, W, B: add(W, mul(fa, 0.07)), H: add(W, mul(fa, SEG.hand)) };
}

/** точка тела → [ndc x, ndc y, глубина]; side 'right' — зеркально по x. */
export function toScreen(P, side) {
  const v = sub(P, EYE), a = rad(CAM.pitch);
  const y = v[1] * Math.cos(a) + v[2] * Math.sin(a);
  const z = -v[1] * Math.sin(a) + v[2] * Math.cos(a);
  const tn = Math.tan(rad(CAM.vfov) / 2), d = Math.max(z, 1e-3);
  const x = -v[0] / (d * tn * CAM.asp);
  return [side === "right" ? -x : x, y / (d * tn), z];
}

export function pose2d(q, side) {
  const f = fk(q), o = {};
  for (const k of ["S", "E", "W", "B", "H"]) o[k] = toScreen(f[k], side);
  return o;
}

// ---- цели по кадрам из ключей (интерполяция каналов между ключами, где канал задан) ----
function track(keys, get, t) {
  const ks = keys.filter((k) => get(k) !== undefined).sort((a, b) => a.t - b.t);
  if (!ks.length) return undefined;
  const eps = 1e-6;
  if (t < ks[0].t - eps || t > ks[ks.length - 1].t + eps) return undefined; // вне ключей канал свободен
  if (t <= ks[0].t) return get(ks[0]);
  if (t >= ks[ks.length - 1].t) return get(ks[ks.length - 1]);
  let i = 0;
  while (ks[i + 1].t < t) i++;
  const P = (j) => get(ks[Math.max(0, Math.min(ks.length - 1, j))]);
  const T = (j) => ks[Math.max(0, Math.min(ks.length - 1, j))].t;
  const t0 = T(i), t1 = T(i + 1), s = (t - t0) / (t1 - t0 || 1);
  const p0 = P(i), p1 = P(i + 1), pm = P(i - 1), pp = P(i + 2);
  const h00 = 2 * s ** 3 - 3 * s * s + 1, h10 = s ** 3 - 2 * s * s + s, h01 = -2 * s ** 3 + 3 * s * s, h11 = s ** 3 - s * s;
  const one = (a0, a1, am, ap) => {
    const m0 = ((a1 - am) / (t1 - T(i - 1) || 1)) * (t1 - t0), m1 = ((ap - a0) / (T(i + 2) - t0 || 1)) * (t1 - t0);
    return h00 * a0 + h10 * m0 + h01 * a1 + h11 * m1; // Катмулл — Ром по неравномерному времени
  };
  return Array.isArray(p0) ? p0.map((_, j) => one(p0[j], p1[j], pm[j], pp[j])) : one(p0, p1, pm, pp);
}

export function targetsAt(clip, t) {
  const keys = clip.keys || [], dt = 0.5 / FPS;
  const at = keys.filter((k) => Math.abs(k.t - t) <= dt);
  const g = {
    ndc: track(keys, (k) => k.ndc, t),
    depth: track(keys, (k) => k.depth, t),
  };
  // локоть и направление предплечья — подсказки только рядом с ключом (как в keyed.py: в момент ключа)
  const near = keys.filter((k) => Math.abs(k.t - t) <= 0.05);
  for (const k of near) {
    if (k.elbow !== undefined) g.elbow = k.elbow;
    if (k.forearm_dir) g.fdir = k.forearm_dir;
  }
  for (const k of at) {
    if (k.below !== undefined) g.below = k.below;
    if (k.elbow_off) g.elbowOff = true;
  }
  return g;
}

function cost(q, g, side, qprev, hard) {
  const p = pose2d(q, side);
  let c = 0;
  if (g.ndc) c += ((p.B[0] - g.ndc[0]) ** 2 + (p.B[1] - g.ndc[1]) ** 2) / 0.0025;
  if (g.below !== undefined) c += (Math.max(p.B[1] - g.below, 0) / 0.05) ** 2;
  if (g.depth) c += ((Math.max(g.depth[0] - p.B[2], 0) + Math.max(p.B[2] - g.depth[1], 0)) / 0.02) ** 2;
  if (g.elbow !== undefined) c += ((q[3] - g.elbow) / 5) ** 2;
  if (g.fdir) {
    const v = [p.W[0] - p.E[0], p.W[1] - p.E[1]], n = Math.hypot(...v) + 1e-9, tn = Math.hypot(...g.fdir) + 1e-9;
    const cs = (v[0] * g.fdir[0] + v[1] * g.fdir[1]) / n / tn;
    c += ((Math.acos(Math.max(-1, Math.min(1, cs))) * 180) / Math.PI / 8) ** 2;
  }
  if (g.elbowOff) c += (Math.max(0, 1.05 - Math.max(Math.abs(p.E[0]), Math.abs(p.E[1]))) / 0.05) ** 2;
  c += (Math.max(NEAR_MIN - p.B[2], 0) / 0.02) ** 2;
  for (let j = 0; j < 4; j++) {
    const [lo, hi] = JOINTS[j].lim, ex = Math.max(lo - q[j], 0) + Math.max(q[j] - hi, 0);
    c += hard ? (ex / 0.5) ** 2 * 100 : (ex / 3) ** 2;
    if (qprev) c += ((q[j] - qprev[j]) / 25) ** 2;
  }
  return c;
}

function search(q, g, side, qprev, hard) { // поиск по координатам с уменьшением шага
  q = q.slice();
  let best = cost(q, g, side, qprev, hard);
  for (let step = 16; step > 0.05; step /= 2) {
    for (let it = 0, moved = true; moved && it < 12; it++) {
      moved = false;
      for (let j = 0; j < 4; j++) for (const s of [step, -step]) {
        q[j] += s;
        const c = cost(q, g, side, qprev, hard);
        if (c < best - 1e-9) { best = c; moved = true; } else q[j] -= s;
      }
    }
  }
  return { q, c: best };
}

const STARTS = [[40, 60, 0, 90], [60, 70, -20, 110], [30, 40, 10, 120], [75, 57, 3, 117]];

/** Поза на каждом кадре: свободная (что просят ключи) и с пределами (что показываем). */
export function solveClip(clip) {
  const n = Math.max(2, Math.round(clip.T * FPS) + 1), side = clip.side || "left";
  const out = [];
  let prevFree = null, prevHard = null;
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * clip.T, g = targetsAt(clip, t);
    let free, hardq;
    if (!prevFree) {
      const s0 = clip.q0 ? [clip.q0] : STARTS;
      free = s0.map((s) => search(s, g, side, null, false)).sort((a, b) => a.c - b.c)[0];
    } else free = search(prevFree, g, side, prevFree, false);
    hardq = search(prevHard || free.q, g, side, prevHard, true);
    hardq.q = hardq.q.map((v, j) => Math.max(JOINTS[j].lim[0], Math.min(JOINTS[j].lim[1], v)));
    prevFree = free.q; prevHard = hardq.q;
    // насколько упор в предел мешает попасть в ключи (0 — предел не мешает, поза просто упирается мягко)
    const lost = cost(hardq.q, g, side, null, false) - cost(free.q, g, side, null, false);
    out.push({ t, g, free: free.q, q: hardq.q, lost, p: pose2d(hardq.q, side) });
  }
  return out;
}

const f1 = (v) => (Math.round(v * 10) / 10).toString();

/** Быстрые проверки по кадрам: [{kind, text, amount}] на кадр. */
export function checkFrames(clip, frames) {
  const dt = clip.T / (frames.length - 1);
  return frames.map((fr, i) => {
    const bad = [];
    for (let j = 0; j < 4; j++) {
      if (fr.lost < 4) break; // поза в пределах попадает в цели не хуже 2σ — предел не нарушен
      const [lo, hi] = JOINTS[j].lim, v = fr.free[j];
      if (v > hi + 0.5) bad.push({ kind: "rom", j, text: `${JOINTS[j].name} ${f1(v)}° > ${hi}°`, amount: v - hi });
      if (v < lo - 0.5) bad.push({ kind: "rom", j, text: `${JOINTS[j].name} ${f1(v)}° < ${lo}°`, amount: lo - v });
    }
    if (fr.g.elbow !== undefined && fr.g.elbow > 150)
      bad.push({ kind: "rom", j: 3, text: `локоть: сгиб в ключе ${f1(fr.g.elbow)}° > 150°`, amount: fr.g.elbow - 150 });
    const a = frames[Math.max(0, i - 1)].q[3], b = frames[Math.min(frames.length - 1, i + 1)].q[3];
    const vel = Math.abs(b - a) / (dt * (Math.min(frames.length - 1, i + 1) - Math.max(0, i - 1)) || 1);
    if (vel > ELBOW_VEL_MAX)
      bad.push({ kind: "vel", text: `скорость локтя ${Math.round(vel)}°/с > ${Math.round(ELBOW_VEL_MAX)}°/с (живые броски KIT)`, amount: vel - ELBOW_VEL_MAX });
    if (fr.g.ndc) {
      const e = Math.hypot(fr.p.B[0] - fr.g.ndc[0], fr.p.B[1] - fr.g.ndc[1]);
      if (e > 0.08) bad.push({ kind: "reach", text: `кисть не достаёт до цели на ${e.toFixed(2)} экрана`, amount: e });
    }
    if (fr.p.B[2] < NEAR_MIN - 0.005) bad.push({ kind: "near", text: `кисть ближе ${NEAR_MIN * 100} см к камере (${f1(fr.p.B[2] * 100)} см)`, amount: NEAR_MIN - fr.p.B[2] });
    if (clip.frame && fr.t <= clip.frame.until) {
      const m = clip.frame.margin ?? 0.8, ex = Math.max(Math.abs(fr.p.B[0]), Math.abs(fr.p.B[1])) - m;
      if (ex > 0.02) bad.push({ kind: "frame", text: `кисть у края кадра: ${f1(Math.max(Math.abs(fr.p.B[0]), Math.abs(fr.p.B[1])))} > ${m}`, amount: ex });
    }
    return bad;
  });
}

/** Доля руки (предплечье + кисть) в кадре, 0…1 — для подсказки. */
export function inFrameShare(p) {
  let n = 0, k = 0;
  for (let s = 0; s <= 1; s += 0.1) {
    const x = p.E[0] + (p.H[0] - p.E[0]) * s, y = p.E[1] + (p.H[1] - p.E[1]) * s;
    k++; if (Math.abs(x) <= 1 && Math.abs(y) <= 1) n++;
  }
  return n / k;
}
