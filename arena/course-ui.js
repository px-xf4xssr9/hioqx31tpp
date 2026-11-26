// Трасса механик (?course=1): клавиши движения, Blink, меч; кнопки на телефоне; HUD.
// Ходьба и обзор — из window.gengineInput (web/arena-ui.js); здесь — остальное.
// Rust читает window.gengineCourseInput() каждый кадр и шлёт состояние в window.gengineCourseFx(json)
// (crates/lite/src/arena/web/course.rs).
(() => {
  if (new URLSearchParams(location.search).get("course") !== "1") return;
  const keys = new Set();
  const B = { jump: 0, crouch: 0, blink: 0, attack: 0, reset: 0, tier: 0, agility: 0, holster: 0 };
  const has = (...c) => c.some((x) => keys.has(x));
  addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code.startsWith("Control") || e.code.startsWith("Alt")) e.preventDefault();
    keys.add(e.code);
    if (e.repeat) return;
    if (e.code === "KeyC" || e.code.startsWith("Control")) B.crouch = 1;
    if (e.code === "KeyR") B.reset = 1;
    if (e.code === "Digit1") B.tier = 1;
    if (e.code === "Digit2") B.tier = 2;
    if (e.code === "Digit3") B.agility = 1;
    if (e.code === "KeyX") B.holster = 1;
  });
  addEventListener("keyup", (e) => keys.delete(e.code));
  addEventListener("blur", () => keys.clear());
  let lmb = 0, rmb = 0;
  addEventListener("mousedown", (e) => {
    if (document.pointerLockElement !== document.getElementById("bevy")) return;
    if (e.button === 0) lmb = 1;
    if (e.button === 2) rmb = 1;
  });
  addEventListener("mouseup", (e) => { if (e.button === 0) lmb = 0; if (e.button === 2) rmb = 0; });

  // [прыжок, присед (нажатие), бег, медленно, наклон -1..1, наклон вперёд, Blink, меч, сброс, уровень Blink, Agility, убрать/достать меч]
  window.gengineCourseInput = () => {
    const out = new Float32Array([
      has("Space") || B.jump ? 1 : 0, B.crouch,
      has("ShiftLeft", "ShiftRight") ? 1 : 0, has("AltLeft", "AltRight") ? 1 : 0,
      (has("KeyE") ? 1 : 0) - (has("KeyQ") ? 1 : 0), has("KeyZ") ? 1 : 0,
      has("KeyF") || rmb || B.blink ? 1 : 0, lmb || B.attack ? 1 : 0,
      B.reset, B.tier, B.agility, B.holster,
    ]);
    B.crouch = B.reset = B.tier = B.agility = B.holster = 0;
    return out;
  };

  addEventListener("DOMContentLoaded", () => {
    const st = document.createElement("style");
    st.textContent = `
#cast,#stats{display:none!important}
#chud{left:12px;top:44px;font:600 12px/1.45 system-ui;color:#fff;text-shadow:0 1px 2px #000;white-space:pre}
#chelp{right:12px;bottom:12px;font:500 11px/1.4 system-ui;color:#fff;opacity:.75;text-align:right;white-space:pre;text-shadow:0 1px 2px #000}
#cblink{left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border:2px solid #8fd3ff;border-radius:50%;opacity:0}
#cbtns{right:14px;bottom:18px;display:none;gap:10px;flex-direction:column;align-items:flex-end;pointer-events:auto}
#cbtns div{width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,.22);border:2px solid rgba(255,255,255,.5);
  display:flex;align-items:center;justify-content:center;font:700 12px system-ui;color:#fff;text-shadow:0 1px 2px #000;user-select:none;-webkit-user-select:none}
#cbtns .bl{background:rgba(80,160,255,.45)}
#csword{display:none!important;right:22%;bottom:-8%;width:18px;height:46%;background:linear-gradient(#dfe6ee,#7a8794 70%,#3b2a1c 72%);
  transform-origin:50% 100%;transform:rotate(-18deg);border-radius:3px 3px 2px 2px;box-shadow:0 0 6px #0008;transition:transform .09s}
@media (pointer:coarse){#cbtns{display:flex}#chelp{display:none}}`;
    document.head.appendChild(st);
    const mk = (id, html = "") => { const d = document.createElement("div"); d.id = id; d.className = "hud"; d.innerHTML = html; document.body.appendChild(d); return d; };
    const hud = mk("chud"), blink = mk("cblink"), sword = mk("csword");
    mk("chelp", "WASD — ходьба, Shift — бег, Alt — медленно\nПробел — прыжок / уступ, C или Ctrl — присед\nбег + присед — подкат, Q/E/Z — выглядывание\nF или ПКМ (держать) — Blink, 1/2 — уровень\n3 — Agility, ЛКМ — меч / убийство, R — на старт\nX — убрать / достать меч");
    const btns = mk("cbtns", '<div data-b="blink" class="bl">BLINK</div><div data-b="attack">МЕЧ</div><div data-b="jump">ПРЫЖОК</div><div data-b="crouch">ПРИСЕД</div><div data-b="holster">УБРАТЬ</div>');
    for (const d of btns.children) {
      const b = d.dataset.b;
      d.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); B[b] = 1; }, { passive: false });
      const up = (e) => { e.preventDefault(); if (b !== "crouch" && b !== "holster") B[b] = 0; };
      d.addEventListener("touchend", up); d.addEventListener("touchcancel", up);
    }
    let swingT = 0;
    window.gengineCourseFx = (json) => {
      const s = JSON.parse(json);
      window.gengineCourse = s;
      const t = s.tally;
      hud.textContent = `${s.state}${s.crouched ? " · присед" : ""}  ${s.speed.toFixed(1)} м/с  Blink ${s.tier}  Agility ${s.agility}\n` +
        `прыжков ${t.jumps}  уступов ${t.mantles}  Blink ${t.blinks}  подкатов ${t.slides}\n` +
        `убито: мечом ${t.kills_sword}, со спины ${t.kills_back}, с прыжка ${t.kills_drop}` +
        (s.prompt ? `\n${s.prompt}` : "") + (s.auto ? `\nавтопилот: ${s.auto}` : "");
      blink.style.opacity = s.aiming ? 1 : 0;
      if (s.swing) { swingT = performance.now(); sword.style.transform = "rotate(-70deg) translateX(-40%)"; }
      else if (performance.now() - swingT > 160) sword.style.transform = "rotate(-18deg)";
    };
  });
})();
