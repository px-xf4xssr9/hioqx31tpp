// Редактор анимаций: заготовки клипов, «поправить» (ближайшая допустимая поза) и простые текстовые
// команды («замах медленнее, кисть выше»). Сложные команды уходят в сессию ИИ через editor_server.py,
// она правит тот же JSON, редактор подхватывает изменения как обычную правку (с отменой).
import { solveClip, checkFrames, ELBOW_VEL_MAX, NEAR_MIN } from "./editor-arm.js";

const r3 = (v) => Math.round(v * 1000) / 1000;
const HOLD = { ndc: [-0.54, -0.17], depth: [0.21, 0.29] }; // удержание из bioshock_hold.json

export const TEMPLATES = {
  empty: { name: "пустой", clip: () => ({ T: 1.0, keys: [] }) },
  wave: {
    name: "взмах",
    clip: () => ({
      _doc: "Взмах рукой: из удержания вверх-вправо, два маха, назад.",
      T: 1.4,
      keys: [
        { t: 0, ...HOLD },
        { t: 0.4, ndc: [-0.35, 0.35], depth: [0.3, 0.4] },
        { t: 0.7, ndc: [-0.6, 0.3], depth: [0.3, 0.4] },
        { t: 1.0, ndc: [-0.35, 0.35], depth: [0.3, 0.4] },
        { t: 1.4, ...HOLD },
      ],
    }),
  },
  lever: {
    name: "дёрнуть рычаг",
    clip: () => ({
      _doc: "Дёрнуть рычаг: дотянуться до ручки, взяться, потянуть вниз.",
      T: 1.2,
      props: [{ id: "lever", kind: "lever", ndc: [-0.3, 0.05], depth: 0.4 }],
      keys: [
        { t: 0, ...HOLD },
        { t: 0.5, attach: "lever", ndc: [-0.3, 0.05], depth: [0.36, 0.44] },
        { t: 1.0, attach: "lever", attach_off: [0, -0.35], ndc: [-0.3, -0.3], depth: [0.36, 0.44] },
      ],
    }),
  },
  door: {
    name: "открыть дверь",
    clip: () => ({
      _doc: "Открыть дверь: взяться за ручку, повернуть, потянуть на себя.",
      T: 1.4,
      props: [{ id: "door", kind: "door", ndc: [-0.2, -0.2], depth: 0.45 }],
      keys: [
        { t: 0, ...HOLD },
        { t: 0.5, attach: "door", ndc: [-0.2, -0.2], depth: [0.41, 0.49] },
        { t: 0.8, attach: "door", attach_off: [0, -0.08], ndc: [-0.2, -0.28], depth: [0.41, 0.49] },
        { t: 1.4, ndc: [-0.45, -0.3], depth: [0.28, 0.36] },
      ],
    }),
  },
  pick: {
    name: "взять предмет",
    clip: () => ({
      _doc: "Взять предмет со стола: потянуться вниз, взять, поднести к себе.",
      T: 1.3,
      props: [{ id: "item", kind: "item", ndc: [-0.25, -0.55], depth: 0.45 }],
      keys: [
        { t: 0, ...HOLD },
        { t: 0.6, attach: "item", ndc: [-0.25, -0.55], depth: [0.41, 0.49] },
        { t: 1.3, ndc: [-0.45, -0.25], depth: [0.25, 0.33] },
      ],
    }),
  },
};

/** Ключи, прилепленные к предмету, следуют за ним (ndc и глубина пишутся в ключ — keyed.py их видит). */
export function resolveAttach(clip) {
  const props = Object.fromEntries((clip.props || []).map((p) => [p.id, p]));
  for (const k of clip.keys || []) {
    const p = k.attach && props[k.attach];
    if (!p) continue;
    const o = k.attach_off || [0, 0];
    k.ndc = [r3(p.ndc[0] + o[0]), r3(p.ndc[1] + o[1])];
    k.depth = [r3(p.depth - 0.04), r3(p.depth + 0.04)];
  }
}

export function mirror(clip) {
  clip.side = (clip.side || "left") === "left" ? "right" : "left";
  for (const k of clip.keys || []) {
    if (k.ndc) k.ndc[0] = -k.ndc[0];
    if (k.forearm_dir) k.forearm_dir[0] = -k.forearm_dir[0];
    if (k.attach_off) k.attach_off[0] = -k.attach_off[0];
  }
  for (const p of clip.props || []) p.ndc[0] = -p.ndc[0];
}

const nearestKey = (clip, t) =>
  (clip.keys || []).reduce((b, k) => (!b || Math.abs(k.t - t) < Math.abs(b.t - t) ? k : b), null);

/** Одна правка к ближайшей допустимой позе для кадра i. Возвращает текст, что сделано. */
function fixOne(clip, fr, bad) {
  const k = nearestKey(clip, fr.t);
  if (!k) return null;
  const b = bad[0];
  if (b.kind === "rom" && k.elbow !== undefined && k.elbow > 150) { k.elbow = 148; return "сгиб локтя в ключе → 148°"; }
  if (b.kind === "vel") {
    const ks = clip.keys.slice().sort((a, c) => a.t - c.t), i = ks.findIndex((c) => c.t > fr.t);
    if (i <= 0) return null;
    const gap = ks[i].t - ks[i - 1].t, add = r3(gap * Math.min(1, b.amount / ELBOW_VEL_MAX + 0.15));
    for (const c of ks.slice(i)) c.t = r3(c.t + add);
    if (clip.release_t !== undefined && clip.release_t >= ks[i].t - add) clip.release_t = r3(clip.release_t + add);
    clip.T = r3(clip.T + add);
    return `промежуток ${gap.toFixed(2)} с → ${(gap + add).toFixed(2)} с (медленнее)`;
  }
  if (b.kind === "near" && k.depth && k.depth[0] >= NEAR_MIN + 0.02 && k.elbow !== undefined) { delete k.elbow; return "убран сгиб локтя в ключе (не даёт отодвинуть кисть)"; }
  if (b.kind === "near" && k.depth && k.depth[0] >= NEAR_MIN + 0.02) { k.depth = k.depth.map((v) => r3(v + 0.05)); return "кисть ещё дальше от камеры"; }
  if (b.kind === "near") { k.depth = [r3(Math.max(NEAR_MIN + 0.02, (k.depth || [0])[0])), r3(Math.max(NEAR_MIN + 0.1, (k.depth || [0, 0])[1]))]; return "кисть дальше от камеры"; }
  if (k.attach) delete k.attach; // нельзя достать до предмета — отлепить и взять достижимое место
  if (b.kind === "frame") { const m = (clip.frame?.margin ?? 0.8) - 0.03; k.ndc = (k.ndc || [fr.p.B[0], fr.p.B[1]]).map((v) => r3(Math.max(-m, Math.min(m, v)))); return "кисть внутрь кадра"; }
  // предел сустава или недостижимо: ключ — туда, куда рука реально достаёт
  k.ndc = [r3(fr.p.B[0]), r3(fr.p.B[1])];
  const z = fr.p.B[2];
  if (k.depth && (z < k.depth[0] || z > k.depth[1])) k.depth = [r3(Math.min(k.depth[0], z - 0.02)), r3(Math.max(k.depth[1], z + 0.02))];
  return "ключ → ближайшая достижимая поза";
}

/** «Поправить»: исправлять, пока кадр (или все кадры) не зелёные; ≤ 8 шагов. */
export function autofix(clip, frameIdx) {
  const done = [];
  for (let it = 0; it < 8; it++) {
    const frames = solveClip(clip), checks = checkFrames(clip, frames);
    const i = frameIdx !== undefined && checks[frameIdx]?.length ? frameIdx : checks.findIndex((c) => c.length);
    if (i < 0 || (frameIdx !== undefined && !checks[frameIdx]?.length && it > 0)) break;
    const what = fixOne(clip, frames[i], checks[i]);
    if (!what) break;
    done.push(what);
  }
  return done;
}

/** Простые команды на русском. Возвращает список сделанного или null, если не поняли. */
export function command(clip, text, selected) {
  const s = text.toLowerCase(), done = [];
  const rel = clip.release_t ?? clip.T / 2;
  let keys = clip.keys || [];
  if (/замах/.test(s)) keys = keys.filter((k) => k.t <= rel);
  else if (/бросок|после/.test(s)) keys = keys.filter((k) => k.t >= rel);
  else if (selected && !/вс[ёе]|весь|клип/.test(s)) keys = [selected];
  const part = /замах/.test(s) ? "замах" : /бросок/.test(s) ? "бросок" : keys.length === 1 ? "ключ" : "клип";
  const tempo = /медленн/.test(s) ? 1.25 : /быстре/.test(s) ? 0.8 : 0;
  if (tempo) {
    const t0 = Math.min(...keys.map((k) => k.t)), t1 = Math.max(...keys.map((k) => k.t));
    const grow = (t1 - t0) * (tempo - 1);
    for (const k of clip.keys) {
      if (k.t > t1 + 1e-9) k.t = r3(k.t + grow);
      else if (k.t > t0) k.t = r3(t0 + (k.t - t0) * tempo);
    }
    if (clip.release_t !== undefined && clip.release_t > t0) clip.release_t = r3(clip.release_t > t1 ? clip.release_t + grow : t0 + (clip.release_t - t0) * tempo);
    clip.T = r3(Math.max(0.2, clip.T + grow));
    done.push(`${part} ${tempo > 1 ? "медленнее" : "быстрее"} (×${tempo})`);
  }
  const moves = [[/выше/, 1, 0.1], [/ниже/, 1, -0.1], [/правее/, 0, 0.1], [/левее/, 0, -0.1]];
  for (const [re, ax, d] of moves) if (re.test(s)) {
    for (const k of keys) if (k.ndc && !k.attach) k.ndc[ax] = r3(k.ndc[ax] + d);
    done.push(`кисть ${re.source} (${part})`);
  }
  for (const [re, d] of [[/ближе/, -0.05], [/дальше/, 0.05]]) if (re.test(s)) {
    for (const k of keys) if (k.depth && !k.attach) k.depth = k.depth.map((v) => r3(Math.max(NEAR_MIN, v + d)));
    done.push(`кисть ${re.source} (${part})`);
  }
  if (/зеркал/.test(s)) { mirror(clip); done.push("зеркало"); }
  if (/поправ|исправ/.test(s)) done.push(...autofix(clip));
  return done.length ? done : null;
}
