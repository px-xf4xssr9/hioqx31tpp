// Редактор анимаций: вид из глаз (экран игры 2.17:1), рука, предметы, манипулятор ключа, onion skin.
import { CAM, inFrameShare } from "./editor-arm.js";

const PROP_DRAW = {
  lever(g, x, y, s) { // основание и ручка рычага
    g.fillStyle = "#5b636e"; g.fillRect(x - 14 * s, y + 40 * s, 28 * s, 16 * s);
    g.strokeStyle = "#8a939e"; g.lineWidth = 6 * s; g.beginPath(); g.moveTo(x, y + 44 * s); g.lineTo(x, y); g.stroke();
    g.fillStyle = "#c0392b"; g.beginPath(); g.arc(x, y, 9 * s, 0, 7); g.fill();
  },
  door(g, x, y, s) { // полотно двери и ручка
    g.fillStyle = "#6b4f36"; g.fillRect(x - 90 * s, y - 200 * s, 110 * s, 400 * s);
    g.fillStyle = "#d4b25a"; g.fillRect(x - 18 * s, y - 4 * s, 26 * s, 8 * s);
  },
  item(g, x, y, s) { // стол и кружка
    g.fillStyle = "#4a3b2c"; g.fillRect(x - 160 * s, y + 18 * s, 320 * s, 14 * s);
    g.fillStyle = "#e8e2d4"; g.fillRect(x - 10 * s, y - 16 * s, 20 * s, 34 * s);
  },
};
export const PROP_NAMES = { lever: "рычаг", door: "ручка двери", item: "предмет на столе" };

export class View {
  constructor(canvas) {
    this.c = canvas; this.g = canvas.getContext("2d");
    this.onion = true;
  }
  layout() {
    const r = this.c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr);
    const w = this.c.width, h = this.c.height, sw = Math.min(w, h * CAM.asp) * 0.86;
    this.sw = sw; this.sh = sw / CAM.asp; this.ox = (w - sw) / 2; this.oy = (h - this.sh) / 2; this.dpr = dpr;
  }
  px(n) { return [this.ox + ((n[0] + 1) / 2) * this.sw, this.oy + ((1 - n[1]) / 2) * this.sh]; }
  ndc(x, y) { // координаты мыши (css px) → ndc
    const X = x * this.dpr, Y = y * this.dpr;
    return [((X - this.ox) / this.sw) * 2 - 1, 1 - ((Y - this.oy) / this.sh) * 2];
  }
  arm(p, alpha, color) {
    const g = this.g, E = this.px(p.E), W = this.px(p.W), H = this.px(p.H), sc = this.sh / 1000;
    const thick = (z) => Math.max(6, (40 / Math.max(z, 0.08)) * sc);
    g.globalAlpha = alpha; g.lineCap = "round";
    g.strokeStyle = color || "#3d4a5a"; g.lineWidth = thick((p.E[2] + p.W[2]) / 2) * 1.2;
    g.beginPath(); g.moveTo(...E); g.lineTo(...W); g.stroke(); // рукав (предплечье)
    g.strokeStyle = color || "#d9a88a"; g.lineWidth = thick(p.H[2]);
    g.beginPath(); g.moveTo(...W); g.lineTo(...H); g.stroke(); // кисть
    g.globalAlpha = 1;
  }
  draw(st) {
    const g = this.g, { clip, frames, checks, cur } = st;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#14171c"; g.fillRect(0, 0, this.c.width, this.c.height);
    g.save(); g.beginPath(); g.rect(this.ox, this.oy, this.sw, this.sh); g.clip();
    const bg = g.createLinearGradient(0, this.oy, 0, this.oy + this.sh);
    bg.addColorStop(0, "#2b3440"); bg.addColorStop(1, "#1d2229");
    g.fillStyle = bg; g.fillRect(this.ox, this.oy, this.sw, this.sh);
    for (const p of clip.props || []) {
      const [x, y] = this.px(p.ndc), s = (0.4 / p.depth) * (this.sh / 600);
      (PROP_DRAW[p.kind] || PROP_DRAW.item)(g, x, y, s);
      if (st.selProp === p.id) { g.strokeStyle = "#f1c40f"; g.lineWidth = 2; g.strokeRect(x - 20, y - 20, 40, 40); }
    }
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; // прицел
    const [cx, cy] = this.px([0, 0]);
    g.beginPath(); g.moveTo(cx - 8, cy); g.lineTo(cx + 8, cy); g.moveTo(cx, cy - 8); g.lineTo(cx, cy + 8); g.stroke();
    if (frames.length) {
      // путь кисти: зелёный, красные кадры красным
      for (let i = 1; i < frames.length; i++) {
        g.strokeStyle = checks[i].length ? "#e74c3c" : "rgba(46,204,113,.7)"; g.lineWidth = 2;
        g.beginPath(); g.moveTo(...this.px(frames[i - 1].p.B)); g.lineTo(...this.px(frames[i].p.B)); g.stroke();
      }
      if (this.onion) for (const d of [-6, -3, 3, 6]) {
        const f = frames[cur + d];
        if (f) this.arm(f.p, 0.16, d < 0 ? "#6fa8dc" : "#e69138");
      }
      this.arm(frames[cur].p, 1);
    }
    g.restore();
    g.strokeStyle = "#7f8c8d"; g.lineWidth = 1; g.strokeRect(this.ox, this.oy, this.sw, this.sh);
    this.handles = [];
    for (const k of clip.keys || []) { // ключи на экране: ромб; выбранный — с ручками
      const fr = frames[Math.round((k.t / clip.T) * (frames.length - 1))];
      if (!fr) continue;
      const pos = k.ndc || [fr.p.B[0], fr.p.B[1]], [x, y] = this.px(pos), sel = k === st.sel;
      g.fillStyle = sel ? "#f1c40f" : k.ndc ? "#ecf0f1" : "rgba(236,240,241,.35)";
      g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x + 7, y); g.lineTo(x, y + 7); g.lineTo(x - 7, y); g.fill();
      this.handles.push({ kind: "hand", key: k, x, y });
      if (!sel) continue;
      g.strokeStyle = "#f1c40f"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 16, 0, 7); g.stroke();
      const fd = k.forearm_dir || [fr.p.W[0] - fr.p.E[0], fr.p.W[1] - fr.p.E[1]], n = Math.hypot(...fd) || 1;
      const hx = x - (fd[0] / n) * 90, hy = y + (fd[1] / n) * 90; // ручка предплечья: откуда идёт рука
      g.setLineDash([4, 4]); g.beginPath(); g.moveTo(x, y); g.lineTo(hx, hy); g.stroke(); g.setLineDash([]);
      g.fillStyle = k.forearm_dir ? "#f1c40f" : "rgba(241,196,15,.4)"; g.beginPath(); g.arc(hx, hy, 8, 0, 7); g.fill();
      this.handles.push({ kind: "fdir", key: k, x: hx, y: hy });
    }
    for (const p of clip.props || []) { const [x, y] = this.px(p.ndc); this.handles.push({ kind: "prop", prop: p, x, y }); }
    if (frames.length) {
      const fr = frames[cur];
      g.fillStyle = "#bdc3c7"; g.font = `${12 * this.dpr}px system-ui`;
      g.fillText(`t ${fr.t.toFixed(2)} с · кадр ${cur} · глубина кисти ${(fr.p.B[2] * 100).toFixed(0)} см · рука в кадре ${Math.round(inFrameShare(fr.p) * 100)}% · локоть ${fr.q[3].toFixed(0)}°`, this.ox, this.oy - 8 * this.dpr);
    }
  }
  hit(x, y) { // ближайшая ручка под мышью (css px)
    const X = x * this.dpr, Y = y * this.dpr;
    let best = null, bd = 18 * this.dpr;
    for (const h of this.handles || []) {
      const d = Math.hypot(h.x - X, h.y - Y) - (h.kind === "prop" ? 0 : 6);
      if (d < bd) { bd = d; best = h; }
    }
    return best;
  }
}
