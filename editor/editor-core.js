// Ядро редактора анимаций рук: модель руки, проекция в кадр, подбор позы по ключу (IK),
// проигрывание между ключами и быстрые проверки. Без DOM — работает и в браузере, и в node (тесты).
// Модель — порт tools/anim/motion/arm_dyn.py (fk, to_screen, ROM) и стоимостей ключей keyed.py:
// редактор показывает те же ключи, что потом решает keyed.py, но поза здесь — быстрая прикидка
// (IK на каждом ключе + монотонный сплайн в суставах), а точное движение даёт «полная проверка».
// Формат клипа — как tools/anim/motion/bioshock_throw.json (см. tools/anim/README.md, «Редактор»).

export const SEG = { upper: 0.335, fore: 0.267, hand: 0.105, handCom: 0.79 };
export const EYE = [-0.175, 0.242, 0.09];
export const CAM = { pitch: 8.0, vfov: 65.0, asp: 2.17 };
// Пределы суставов (arm_dyn.ROM) и запас, в котором сустав «упирается мягко» (как rom_margin в keyed.py).
export const ROM = { elev: [0, 180], plane: [-60, 135], hrot: [-90, 70], flex: [0, 150] };
export const MARGIN = 5;
export const JOINTS = ["elev", "plane", "hrot", "flex"];
export const JOINT_RU = { elev: "подъём плеча", plane: "плоскость подъёма плеча", hrot: "ротация плеча", flex: "сгиб локтя" };
// Живые броски KIT (anatomy/arm_mocap.json → kit_throws): разгиб локтя не быстрее самого быстрого
// броска +5% (как keyed.py), скорость кисти — не быстрее самой быстрой записи +5%.
export const HUMAN = { elbowExtVel: 1065.0 * 1.05, handSpeed: 5.71 * 1.05 };
export const NEAR = 0.12; // кисть не ближе 12 см к камере (keyed.py)
export const FPS = 30;

const d2r = Math.PI / 180;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => Math.hypot(a[0], a[1], a[2]);

function rotate(axis, deg, v) { // формула Родрига
  const n = norm(axis), k = mul(axis, 1 / n), a = deg * d2r, c = Math.cos(a), s = Math.sin(a);
  return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
}
function minRot(a, b, v) { // поворот a→b, применённый к v (arm_dyn.min_rot)
  a = mul(a, 1 / norm(a)); b = mul(b, 1 / norm(b));
  const w = cross(a, b), c = dot(a, b);
  if (norm(w) < 1e-9) return v.slice();
  const Kv = cross(w, v), KKv = cross(w, Kv);
  return add(add(v, Kv), mul(KKv, 1 / (1 + c)));
}

const OUT = [1, 0, 0], UP = [0, 1, 0], FWD = [0, 0, 1];

/** q = [подъём, плоскость, ротация, сгиб] (°) → точки от плеча (м), тело левой руки (x — наружу). */
export function fk(q) {
  const [el, pl, hr, fl] = q, e = el * d2r, p = pl * d2r;
  const u = add(mul(UP, -Math.cos(e)), mul(add(mul(OUT, Math.cos(p)), mul(FWD, Math.sin(p))), Math.sin(e)));
  const med = minRot(mul(UP, -1), u, mul(OUT, -1));
  const h = rotate(u, hr, med);
  const fa = rotate(h, fl, u);
  const E = mul(u, SEG.upper), W = add(E, mul(fa, SEG.fore));
  return { S: [0, 0, 0], E, W, fa, ball: add(W, mul(fa, 0.07)), tip: add(W, mul(fa, SEG.hand)) };
}

/** Точка тела → камера (x вправо, y вверх, z вглубь, м). */
export function toCam(P) {
  const v = sub(P, EYE), a = CAM.pitch * d2r;
  return [-v[0], v[1] * Math.cos(a) + v[2] * Math.sin(a), -v[1] * Math.sin(a) + v[2] * Math.cos(a)];
}
const TN = Math.tan((CAM.vfov * d2r) / 2);
/** Камера → NDC [x, y] и глубина (как arm_dyn.to_screen). */
export function camToNdc(c) { const d = Math.max(c[2], 1e-3); return [c[0] / (d * TN * CAM.asp), c[1] / (d * TN), c[2]]; }
export const toScreen = (P) => camToNdc(toCam(P));
export const TAN_HALF = TN;

/** Стоимость позы для ключа — те же слагаемые и масштабы, что в keyed.py (без динамики). */
export function keyTerms(q, key, f = fk(q)) {
  const sc = toScreen(f.ball), se = toScreen(f.E), sw = toScreen(f.W), out = {};
  let c = 0;
  const w = key.w ?? 1;
  if (key.ndc) { const e = Math.hypot(sc[0] - key.ndc[0], sc[1] - key.ndc[1]); out.ndc = e; c += (e / 0.05) ** 2 * w; }
  if (key.elbow != null) { const e = Math.abs(q[3] - key.elbow); out.elbow = e; c += (e / 5) ** 2 * w; }
  if (key.depth) { const e = Math.max(key.depth[0] - sc[2], 0) + Math.max(sc[2] - key.depth[1], 0); out.depth = e; c += (e / 0.02) ** 2 * w; }
  if (key.forearm_dir) {
    let vx = sw[0] - se[0], vy = sw[1] - se[1]; const n = Math.hypot(vx, vy) + 1e-9; vx /= n; vy /= n;
    const tn = Math.hypot(key.forearm_dir[0], key.forearm_dir[1]) || 1;
    const e = Math.acos(Math.max(-1, Math.min(1, (vx * key.forearm_dir[0] + vy * key.forearm_dir[1]) / tn))) / d2r;
    out.forearm = e; c += (e / 8) ** 2 * w;
  }
  if (key.elbow_off) { const e = Math.max(0, 1.05 - Math.max(Math.abs(se[0]), Math.abs(se[1]))); out.elbow_off = e; c += (e / 0.05) ** 2; }
  if (key.below != null) { const e = Math.max(sc[1] - key.below, 0); out.below = e; c += (e / 0.05) ** 2 * w; }
  c += (Math.max(NEAR - sc[2], 0) / 0.02) ** 2;
  return { cost: c, terms: out, screen: sc };
}

export const lim = (j, m = MARGIN) => [ROM[j][0] + (j === "flex" && ROM[j][0] === 0 ? 0 : m), ROM[j][1] - m];
const clampQ = (q) => q.map((v, i) => { const [lo, hi] = lim(JOINTS[i]); return Math.min(hi, Math.max(lo, v)); });

/** Поза по ключу: поиск по образцу в пределах суставов (вывернуть нельзя — сустав упирается в предел). */
export function solveKey(key, prior, starts) {
  const pr = prior || [40, 60, 0, 90];
  const f = (q) => keyTerms(q, key).cost + 2e-3 * q.reduce((s, v, i) => s + ((v - pr[i]) / 10) ** 2, 0);
  let best = null;
  const tries = [pr, ...(starts || [])];
  for (const s0 of tries) {
    let q = clampQ(s0), c = f(q);
    for (let step = 16; step > 0.02; step /= 2) {
      for (let it = 0, moved = true; moved && it < 40; it++) {
        moved = false;
        for (let j = 0; j < 4; j++) for (const sg of [1, -1]) {
          const t = q.slice(); t[j] += sg * step; const tq = clampQ(t), tc = f(tq);
          if (tc < c - 1e-12) { q = tq; c = tc; moved = true; }
        }
      }
    }
    if (!best || c < best.c) best = { q, c };
  }
  return best.q;
}
export const STARTS = [[40, 60, 0, 90], [60, 70, -20, 110], [30, 40, 10, 120], [90, 90, 0, 30]];

// ---------- клип ----------
export const mirrorKey = (k) => {
  const o = JSON.parse(JSON.stringify(k));
  if (o.ndc) o.ndc[0] = -o.ndc[0];
  if (o.forearm_dir) o.forearm_dir[0] = -o.forearm_dir[0];
  return o;
};
/** Ключ в осях левой руки (модель и keyed.py — левая рука; правая — зеркало по x экрана). */
export const leftKey = (clip, k) => (clip.side === "r" ? mirrorKey(k) : k);

/** Ключ с учётом «прилепленного» предмета (attach): кисть идёт в точку предмета. */
export function effKey(clip, k) {
  if (!k.attach) return k;
  const [id, end] = String(k.attach).split("@");
  const tg = (clip.targets || []).find((t) => t.id === id);
  if (!tg) return k;
  const o = { ...k, ndc: tg.ndc.slice() };
  if (end === "end" && tg.throw) o.ndc = [tg.ndc[0] + tg.throw[0], tg.ndc[1] + tg.throw[1]];
  if (tg.depth != null) o.depth = [tg.depth - 0.03, tg.depth + 0.03];
  return o;
}

/** Применить предметы: у ключей с attach обновить ndc/depth (файл всегда читается keyed.py без редактора). */
export function bakeAttach(clip) {
  for (const k of clip.keys) if (k.attach) { const e = effKey(clip, k); k.ndc = e.ndc.map(r3); if (e.depth) k.depth = e.depth.map(r3); }
}
export const r3 = (v) => Math.round(v * 1000) / 1000;

/** Позы ключей (по порядку времени): каждый ключ ищется от позы предыдущего — движение непрерывно. */
export function keyPoses(clip, cache) {
  const keys = clip.keys.map((k, i) => ({ k, i })).sort((a, b) => a.k.t - b.k.t);
  const res = new Array(clip.keys.length);
  let prev = clip.q0 || null;
  for (const { k, i } of keys) {
    const lk = leftKey(clip, effKey(clip, k));
    const sig = JSON.stringify([lk, prev]);
    let q = cache && cache.get(sig);
    if (!q) { q = solveKey(lk, prev || STARTS[0], prev ? [] : STARTS); cache && cache.set(sig, q); }
    res[i] = q; prev = q;
  }
  return res;
}

function hermiteSlopes(ts, ys) { // монотонный сплайн (Fritsch–Carlson), нулевая скорость на концах
  const n = ts.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / Math.max(ts[i + 1] - ts[i], 1e-6));
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  return m;
}

/** Траектория: n кадров по 30 кадр/с — суставы, скорости, точки руки на экране. */
export function trajectory(clip, cache) {
  const T = clip.T, n = Math.max(2, Math.round(T * FPS) + 1);
  const kp = keyPoses(clip, cache);
  const order = clip.keys.map((k, i) => i).sort((a, b) => clip.keys[a].t - clip.keys[b].t);
  const ts = order.map((i) => clip.keys[i].t), Q = order.map((i) => kp[i]);
  const slopes = JOINTS.map((_, j) => hermiteSlopes(ts, Q.map((q) => q[j])));
  const at = (t) => {
    if (!ts.length) return { q: [40, 60, 0, 90], qd: [0, 0, 0, 0] };
    if (t <= ts[0]) return { q: Q[0].slice(), qd: [0, 0, 0, 0] };
    if (t >= ts[ts.length - 1]) return { q: Q[Q.length - 1].slice(), qd: [0, 0, 0, 0] };
    let i = 0; while (ts[i + 1] < t) i++;
    const h = Math.max(ts[i + 1] - ts[i], 1e-6), s = (t - ts[i]) / h;
    const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
    const d00 = (6 * s ** 2 - 6 * s) / h, d10 = 3 * s ** 2 - 4 * s + 1, d01 = (-6 * s ** 2 + 6 * s) / h, d11 = 3 * s ** 2 - 2 * s;
    const q = [], qd = [];
    for (let j = 0; j < 4; j++) {
      const a = Q[i][j], b = Q[i + 1][j], ma = slopes[j][i], mb = slopes[j][i + 1];
      q.push(h00 * a + h10 * h * ma + h01 * b + h11 * h * mb);
      qd.push(d00 * a + d10 * ma + d01 * b + d11 * mb);
    }
    return { q, qd };
  };
  const frames = [];
  for (let f = 0; f < n; f++) {
    const t = (f / (n - 1)) * T, { q, qd } = at(t), p = fk(q);
    frames.push({ f, t, q, qd, p, ball: toScreen(p.ball) });
  }
  for (let f = 0; f < n; f++) { // скорость кисти (м/с) по соседним кадрам
    const a = frames[Math.max(0, f - 1)].p.ball, b = frames[Math.min(n - 1, f + 1)].p.ball;
    const dt = (frames[Math.min(n - 1, f + 1)].t - frames[Math.max(0, f - 1)].t) || 1;
    frames[f].handSpeed = norm(sub(b, a)) / dt;
  }
  return { n, frames, keyQ: kp, at };
}

/** Доля руки (предплечье у запястья + кисть) в кадре. */
export function armInFrame(p) {
  let vis = 0, tot = 0;
  for (let s = 0; s <= 1.0001; s += 0.1) {
    const P = add(add(p.E, mul(sub(p.W, p.E), 0.5)), mul(sub(p.tip, add(p.E, mul(sub(p.W, p.E), 0.5))), s));
    const c = toScreen(P); tot++; if (c[2] > 0.03 && Math.abs(c[0]) <= 1 && Math.abs(c[1]) <= 1) vis++;
  }
  return vis / tot;
}

/** Быстрые проверки: на кадр — список нарушений {sev, msg, fix}. Красные — нарушения, жёлтые — предупреждения. */
export function quickCheck(clip, traj) {
  const issues = traj.frames.map(() => []);
  const fOf = (t) => Math.max(0, Math.min(traj.n - 1, Math.round((t / clip.T) * (traj.n - 1))));
  const deg = (v) => `${Math.round(v)}°`;
  clip.keys.forEach((k0, i) => {
    const k = leftKey(clip, effKey(clip, k0)), f = fOf(k.t), q = traj.keyQ[i];
    if (k.elbow != null) {
      const [lo, hi] = lim("flex");
      // ближайший допустимый сгиб: упор в предел; если так кисть не достаёт до ключа — сгиб, при котором достаёт
      const near = (v) => {
        const kc = { ...k, elbow: v }, qc = solveKey(kc, q, STARTS);
        if ((keyTerms(qc, kc).terms.ndc ?? 0) <= 0.06) return v;
        const { elbow, ...free } = k, qf = solveKey(free, q, STARTS);
        return Math.round(Math.min(hi, Math.max(lo, qf[3])));
      };
      if (k.elbow > hi) issues[f].push({ sev: "red", key: i, msg: `${JOINT_RU.flex} ${deg(k.elbow)} > ${deg(hi)} (предел ${ROM.flex[1]}° − запас ${MARGIN}°)`, fix: { op: "elbow", key: i, v: near(hi) } });
      if (k.elbow < lo) issues[f].push({ sev: "red", key: i, msg: `${JOINT_RU.flex} ${deg(k.elbow)} < ${deg(lo)}`, fix: { op: "elbow", key: i, v: near(lo) } });
    }
    const { terms, screen } = keyTerms(q, k);
    const elbowBad = k.elbow != null && (k.elbow > lim("flex")[1] || k.elbow < lim("flex")[0]);
    if (elbowBad) return; // промах кисти и глубины тут — следствие сгиба за пределом: показываем одну причину
    if (k0.attach) return; // кисть на предмете ставит движок (хват, досягаемость) — его проверки, см. gripAt
    if (terms.ndc > 0.06) issues[f].push({ sev: "red", key: i, msg: `кисть не достаёт до ключа: промах ${terms.ndc.toFixed(2)} экрана (суставы в пределе)`, fix: { op: "ndc", key: i, v: [r3(clip.side === "r" ? -screen[0] : screen[0]), r3(screen[1])] } });
    if (terms.depth > 0.03) issues[f].push({ sev: "red", key: i, msg: `глубина кисти ${screen[2].toFixed(2)} м вне [${k.depth.map((v) => Number(v).toFixed(2)).join("; ")}]`, fix: { op: "depth", key: i, v: [r3(Math.max(NEAR + 0.03, screen[2] - 0.05)), r3(screen[2] + 0.05)] } });
    if (terms.forearm > 25) issues[f].push({ sev: "warn", key: i, msg: `направление предплечья мимо на ${deg(terms.forearm)}` });
  });
  traj.frames.forEach((fr, f) => {
    if (fr.ball[2] < NEAR) issues[f].push({ sev: "red", msg: `кисть ближе ${NEAR * 100} см к камере: ${(fr.ball[2] * 100).toFixed(0)} см`, fix: { op: "near", f } });
    const ext = -fr.qd[3];
    if (ext > HUMAN.elbowExtVel) issues[f].push({ sev: "red", msg: `разгиб локтя ${Math.round(ext)}°/с > ${Math.round(HUMAN.elbowExtVel)}°/с (быстрее живых бросков KIT)`, fix: { op: "slow", f, k: ext / HUMAN.elbowExtVel } });
    if (fr.handSpeed > HUMAN.handSpeed) issues[f].push({ sev: "red", msg: `скорость кисти ${fr.handSpeed.toFixed(1)} м/с > ${HUMAN.handSpeed.toFixed(1)} м/с (живые броски KIT)`, fix: { op: "slow", f, k: fr.handSpeed / HUMAN.handSpeed } });
    JOINTS.forEach((j, ji) => {
      const [lo, hi] = lim(j);
      if (fr.q[ji] > hi + 0.5) issues[f].push({ sev: "red", msg: `${JOINT_RU[j]} ${deg(fr.q[ji])} > ${deg(hi)}` });
      if (fr.q[ji] < lo - 0.5) issues[f].push({ sev: "red", msg: `${JOINT_RU[j]} ${deg(fr.q[ji])} < ${deg(lo)}` });
    });
    fr.inFrame = armInFrame(fr.p);
  });
  return issues;
}

/** «Поправить»: ближайшая допустимая правка для нарушения. Меняет clip на месте; true — что-то поменяно. */
export function applyFix(clip, traj, fix) {
  if (!fix) return false;
  const K = clip.keys;
  if (fix.op === "elbow") { K[fix.key].elbow = fix.v; return true; }
  if (fix.op === "ndc") { delete K[fix.key].attach; K[fix.key].ndc = fix.v; return true; }
  if (fix.op === "depth") { K[fix.key].depth = fix.v; return true; }
  if (fix.op === "near") {
    const t = traj.frames[fix.f].t; let bi = 0;
    K.forEach((k, i) => { if (Math.abs(k.t - t) < Math.abs(K[bi].t - t)) bi = i; });
    const d = K[bi].depth || [0.2, 0.3]; K[bi].depth = [Math.max(d[0], NEAR + 0.04), Math.max(d[1], NEAR + 0.1)];
    return true;
  }
  if (fix.op === "leverCloser") { // рычаг ближе к плечу: та же точка на экране, меньше глубина
    const L = lever(clip); if (!L) return false;
    L.depth = r3(Math.max(NEAR + 0.08, Number(L.depth ?? 0.4) / (fix.k * 1.04)));
    return true;
  }
  if (fix.op === "slow") { // растянуть промежуток между ключами вокруг кадра — скорость падает пропорционально
    const t = traj.frames[fix.f].t, ts = K.map((k) => k.t).sort((a, b) => a - b);
    let a = ts.filter((x) => x <= t).pop(); let b = ts.find((x) => x > t);
    if (a == null) a = 0; if (b == null) return false;
    const delta = r3((b - a) * (Math.min(fix.k, 3) * 1.08 - 1));
    for (const k of K) if (k.t > a + 1e-9) k.t = r3(k.t + delta);
    if (clip.release_t != null && clip.release_t > a + 1e-9) clip.release_t = r3(clip.release_t + delta);
    clip.T = r3(clip.T + delta);
    return true;
  }
  return false;
}

/** Команда словами (простой разбор на месте; что не понято — уходит ИИ-сессии). Возвращает список сделанного. */
export function localCommand(clip, text, sel) {
  const done = [], s = text.toLowerCase();
  const pct = (re, dflt) => { const m = s.match(re); return m ? Number(m[1]) / 100 : dflt; };
  let keys = clip.keys.map((_, i) => i);
  const rel = clip.release_t ?? clip.T / 2;
  if (/замах/.test(s)) keys = keys.filter((i) => clip.keys[i].t <= rel + 1e-9);
  else if (/бросок|выпуск|после/.test(s)) keys = keys.filter((i) => clip.keys[i].t >= rel - 1e-9);
  else if (/(этот|выбранн|текущ)/.test(s) && sel != null) keys = [sel];
  const span = keys.length ? [Math.min(...keys.map((i) => clip.keys[i].t)), Math.max(...keys.map((i) => clip.keys[i].t))] : [0, 0];
  const retime = (f) => {
    const [a, b] = span, delta = (b - a) * (f - 1);
    for (const k of clip.keys) { if (k.t > b + 1e-9) k.t = r3(k.t + delta); else if (k.t > a) k.t = r3(a + (k.t - a) * f); }
    if (clip.release_t != null) { if (clip.release_t > b + 1e-9) clip.release_t = r3(clip.release_t + delta); else if (clip.release_t > a) clip.release_t = r3(a + (clip.release_t - a) * f); }
    clip.T = r3(clip.T + delta);
  };
  if (/медлен/.test(s)) { const f = 1 + pct(/(\d+)\s*%/, 0.3); retime(f); done.push(`медленнее ×${f.toFixed(2)}`); }
  if (/быстр/.test(s)) { const f = 1 / (1 + pct(/(\d+)\s*%/, 0.3)); retime(f); done.push(`быстрее ×${f.toFixed(2)}`); }
  const mv = (dx, dy, what) => { for (const i of keys) { const k = clip.keys[i]; if (k.ndc) { k.ndc = [r3(k.ndc[0] + dx), r3(k.ndc[1] + dy)]; } } done.push(what); };
  const amt = /сильно|намного|много/.test(s) ? 0.2 : /чуть|немного|слегка/.test(s) ? 0.05 : 0.1;
  if (/выше/.test(s)) mv(0, amt, "кисть выше");
  if (/ниже/.test(s)) mv(0, -amt, "кисть ниже");
  if (/левее/.test(s)) mv(-amt, 0, "левее");
  if (/правее/.test(s)) mv(amt, 0, "правее");
  const dz = (d, what) => { for (const i of keys) { const k = clip.keys[i]; const z = k.depth || [0.2, 0.3]; k.depth = [r3(Math.max(NEAR + 0.03, z[0] + d)), r3(Math.max(NEAR + 0.06, z[1] + d))]; } done.push(what); };
  if (/ближе/.test(s)) dz(-amt / 2, "ближе к камере");
  if (/дальше/.test(s)) dz(amt / 2, "дальше от камеры");
  if (/зеркал/.test(s)) { mirrorClip(clip); done.push("зеркало рук"); }
  return done;
}

export function mirrorClip(clip) {
  clip.keys = clip.keys.map(mirrorKey);
  clip.side = clip.side === "r" ? "l" : "r";
  for (const t of clip.targets || []) { t.ndc[0] = -t.ndc[0]; if (t.throw) t.throw[0] = -t.throw[0]; }
}

/** Запись как у Python json.dumps(indent=1, ensure_ascii=False): файлы в репозитории не «прыгают». */
export function dumpClip(o, ind = "") {
  if (o instanceof Number) return o.f ? Number(o).toFixed(1) : String(Number(o));
  const n = ind + " ";
  if (Array.isArray(o)) return o.length ? "[\n" + o.map((v) => n + dumpClip(v, n)).join(",\n") + "\n" + ind + "]" : "[]";
  if (o && typeof o === "object") {
    const ks = Object.keys(o);
    return ks.length ? "{\n" + ks.map((k) => n + JSON.stringify(k) + ": " + dumpClip(o[k], n)).join(",\n") + "\n" + ind + "}" : "{}";
  }
  return JSON.stringify(o);
}

/** Чтение клипа: целые числа, записанные как «0.0», помечаются — запись вернёт их так же (байт в байт). */
export function parseClip(text) {
  // Номера в порядке исходника (reviver вызывается в том же порядке для чисел); строки пропускаются.
  const toks = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { for (i++; i < text.length && text[i] !== '"'; i++) if (text[i] === "\\") i++; continue; }
    if (c === "-" || (c >= "0" && c <= "9")) { let j = i; while (j < text.length && /[-+0-9.eE]/.test(text[j])) j++; toks.push(text.slice(i, j)); i = j - 1; }
  }
  let n = 0;
  return JSON.parse(text, function (k, v) {
    if (typeof v !== "number") return v;
    const src = toks[n++] || "";
    if (Number.isInteger(v) && /[.eE]/.test(src)) { const b = new Number(v); b.f = true; return b; }
    return v;
  });
}

/** Хват предмета-рычага во времени: доля хвата w (0 — рука своя, 1 — кисть на ручке) и доля хода phi.
 *  Берётся с ключа, прилепленного к ручке (attach = id), тянет до ключа на конце хода (id@end); после
 *  него, если дальше есть свои ключи, кисть отпускает ручку. Рычаг после хода остаётся внизу. */
export function lever(clip) { return (clip.targets || []).find((t) => t.kind === "lever" && t.throw) || null; }
export function gripAt(clip, t) {
  const L = lever(clip); if (!L) return { w: 0, phi: 0 };
  const ks = clip.keys.map((k) => ({ t: Number(k.t), a: k.attach })).sort((a, b) => a.t - b.t);
  const g = ks.find((k) => k.a === L.id), e = [...ks].reverse().find((k) => k.a === L.id + "@end");
  if (!g) return { w: 0, phi: 0 };
  const sm = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  const te = e && e.t > g.t ? e.t : null;
  const after = te != null && ks.some((k) => k.t > te + 1e-6 && !k.a);
  let w = sm((t - (g.t - 0.12)) / 0.12);
  if (after) w *= 1 - sm((t - (te + 0.05)) / 0.15);
  const phi = te == null ? 0 : sm((t - g.t) / (te - g.t));
  return { w, phi };
}
/** Числа рычага для движка: [есть, ручка в начале x, y, глубина, в конце x, y]. */
export function leverNums(clip) {
  const L = lever(clip); if (!L) return [0, 0, 0, 0, 0, 0];
  return [1, Number(L.ndc[0]), Number(L.ndc[1]), Number(L.depth ?? 0.4), Number(L.ndc[0]) + Number(L.throw[0]), Number(L.ndc[1]) + Number(L.throw[1])];
}

export const emptyClip = () => ({ _doc: "Новый клип (редактор анимаций). Двойной щелчок по кадру — ключ.", T: 1.0, release_t: 0.5, side: "l", keys: [] });
