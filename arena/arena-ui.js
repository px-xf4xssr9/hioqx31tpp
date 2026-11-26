// Серая арена: ввод (телефон и ПК) и интерфейс поверх игры. Rust читает window.gengineInput()
// каждый кадр и шлёт события в window.gengineFx(kind, value) (crates/lite/src/arena/web.rs).
// Телефон: левая половина — плавающий стик, правая — обзор; огонь сам при наведении.
// ПК: клик — захват мыши, WASD/стрелки, мышь — обзор, ЛКМ — огонь.

const TOUCH_SENS = 0.0055, MOUSE_SENS = 0.0025, STICK_PX = 60;
const S = { right: 0, forward: 0, dx: 0, dy: 0, fire: 0, restart: 0, cast: 0, castHeld: 0 };
const keys = new Set();

const css = `
#panel{top:6px;bottom:auto;max-width:42vw;font-size:10px;line-height:1.3;opacity:.55;pointer-events:none}
#panel button{display:none}
.hud{position:fixed;pointer-events:none;user-select:none;-webkit-user-select:none}
#cross{left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#fff;box-shadow:0 0 2px #000}
#hitm{left:50%;top:50%;width:28px;height:28px;margin:-14px 0 0 -14px;opacity:0;transition:opacity .12s}
#hitm::before,#hitm::after{content:"";position:absolute;left:12px;top:-2px;width:4px;height:32px;background:currentColor;transform:rotate(45deg)}
#hitm::after{transform:rotate(-45deg)}
#vig{inset:0;opacity:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(200,0,0,.75) 100%);transition:opacity .25s}
#stats{left:12px;bottom:12px;font:700 20px system-ui;color:#fff;text-shadow:0 1px 3px #000}
#dead{inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:8px;background:rgba(40,0,0,.7);font:700 26px system-ui;color:#fff;pointer-events:auto}
#cast{right:28px;bottom:120px;width:84px;height:84px;border-radius:50%;background:radial-gradient(circle,#ffb347,#d6261e);opacity:.85;pointer-events:auto;display:flex;align-items:center;justify-content:center;font:700 13px system-ui;color:#fff;text-shadow:0 1px 2px #000}
#stick{width:110px;height:110px;margin:-55px 0 0 -55px;border:2px solid rgba(255,255,255,.35);border-radius:50%;display:none}
#gfx{left:12px;top:12px;padding:4px 8px;border-radius:6px;background:rgba(0,0,0,.35);font:600 12px system-ui;color:#fff;pointer-events:auto;cursor:pointer}
#knob{left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.35);position:absolute}
`;
const el = (id, html = "") => {
  const d = document.createElement("div");
  d.id = id; d.className = "hud"; d.innerHTML = html;
  document.body.appendChild(d);
  return d;
};
// Руки героя: модель со скинингом, текстура, карта рельефа и микрорельеф кожи (последние два необязательны);
// Rust забирает их из window.gengineHands.
const loadImg = (src) => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });
// Номер сборки — из адреса этого скрипта (arena-ui.js?b=…): без него браузер держал старые анимации из кэша.
const BUILD_Q = new URL(document.currentScript?.src || location.href).search;
Promise.all([
  fetch(new URL("hands.ghnd" + BUILD_Q, location.href)).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status))),
  loadImg("hands.jpg" + BUILD_Q),
  loadImg("hands_n.jpg" + BUILD_Q).catch(() => null),
  loadImg("hands_d.jpg" + BUILD_Q).catch(() => null),
]).then(([bin, img, rel, det]) => (window.gengineHands = { bin: new Uint8Array(bin), img, ...(rel ? { rel } : {}), ...(det ? { det } : {}) }))
  .catch((e) => console.warn("gengine: руки не загрузились", e));

// Качество графики рук: ?q=0/1 в адресе, иначе выбор игрока (кнопка «Графика»), по умолчанию высокое.
const Q_KEY = "gengine.q";
const savedQ = () => { try { return localStorage.getItem(Q_KEY); } catch { return null; } };
// (обёртка ставится после загрузки страницы: gengineParam задаёт harness.js — модуль, он выполняется позже)
const wrapParam = () => {
  const base = window.gengineParam;
  window.gengineParam = (name) => {
    const v = base ? base(name) : NaN;
    if (name === "q" && Number.isNaN(v)) return Number(savedQ() ?? 1);
    return v;
  };
};

addEventListener("DOMContentLoaded", () => {
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  for (const id of ["vig", "cross", "hitm", "stats", "dead"]) el(id);
  el("cast", "СИЛА");
  wrapParam();
  const gfx = el("gfx");
  const showQ = () => (gfx.textContent = `Графика: ${window.gengineParam("q") > 0.5 ? "высокая" : "простая"}`);
  showQ();
  gfx.addEventListener("click", (e) => {
    e.stopPropagation();
    try { localStorage.setItem(Q_KEY, window.gengineParam("q") > 0.5 ? "0" : "1"); } catch {}
    showQ();
  });
  el("stick", '<div id="knob"></div>');
  setup();
});

function setup() {
  const $ = (id) => document.getElementById(id);
  const canvas = $("bevy"), stick = $("stick"), knob = $("knob"), dead = $("dead");
  // Кнопка силы (сыворотка); на ПК — Q или правая кнопка мыши.
  $("cast").addEventListener("touchstart", (e) => { e.preventDefault(); S.cast = 1; S.castHeld = 1; }, { passive: false });
  $("cast").addEventListener("touchend", () => (S.castHeld = 0));
  $("cast").addEventListener("touchcancel", () => (S.castHeld = 0));
  $("cast").addEventListener("mousedown", () => { S.cast = 1; S.castHeld = 1; });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  let hp = 100, kills = 0, hitT = 0, hurt = 0;
  const stats = () => ($("stats").textContent = `❤ ${Math.ceil(hp)}   ☠ ${kills}`);
  const vibrate = (ms) => navigator.vibrate?.(ms);

  // Касания: у каждого пальца своя роль, выбранная по половине экрана при касании.
  let stickId = null, lookId = null, ox = 0, oy = 0, lx = 0, ly = 0;
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (window.gengineJournalIsOpen?.()) return; // дневник открыт: пальцем рисуют (web/journal.js)
    for (const t of e.changedTouches) {
      if (dead.style.display === "flex") { S.restart = 1; continue; }
      if (t.clientX < innerWidth / 2 && stickId === null) {
        stickId = t.identifier; ox = t.clientX; oy = t.clientY;
        Object.assign(stick.style, { display: "block", left: ox + "px", top: oy + "px" });
        knob.style.transform = "";
      } else if (lookId === null) {
        lookId = t.identifier; lx = t.clientX; ly = t.clientY;
      }
    }
  }, { passive: false });
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) {
        let vx = (t.clientX - ox) / STICK_PX, vy = (t.clientY - oy) / STICK_PX;
        const l = Math.hypot(vx, vy);
        if (l > 1) { vx /= l; vy /= l; }
        S.right = vx; S.forward = -vy;
        knob.style.transform = `translate(${vx * 32}px,${vy * 32}px)`;
      } else if (t.identifier === lookId) {
        S.dx += (t.clientX - lx) * TOUCH_SENS; S.dy += (t.clientY - ly) * TOUCH_SENS;
        lx = t.clientX; ly = t.clientY;
      }
    }
  }, { passive: false });
  const end = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) { stickId = null; S.right = S.forward = 0; stick.style.display = "none"; }
      if (t.identifier === lookId) lookId = null;
    }
  };
  canvas.addEventListener("touchend", end);
  canvas.addEventListener("touchcancel", end);

  // Мышь и клавиатура.
  canvas.addEventListener("mousedown", (e) => {
    if (window.gengineJournalIsOpen?.()) return; // дневник открыт: мышью рисуют
    if (dead.style.display === "flex") { S.restart = 1; return; }
    if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
    else if (e.button === 0) S.fire = 1;
    else if (e.button === 2) { S.cast = 1; S.castHeld = 1; }
  });
  dead.addEventListener("click", () => (S.restart = 1));
  addEventListener("mouseup", (e) => { if (e.button === 0) S.fire = 0; else S.castHeld = 0; });
  addEventListener("mousemove", (e) => {
    if (document.pointerLockElement !== canvas) return;
    S.dx += e.movementX * MOUSE_SENS; S.dy += e.movementY * MOUSE_SENS;
  });
  const keyAxis = () => {
    const k = (...c) => c.some((x) => keys.has(x));
    S.right = (k("KeyD", "ArrowRight") ? 1 : 0) - (k("KeyA", "ArrowLeft") ? 1 : 0);
    S.forward = (k("KeyW", "ArrowUp") ? 1 : 0) - (k("KeyS", "ArrowDown") ? 1 : 0);
  };
  addEventListener("keydown", (e) => { if (document.activeElement?.id === "jin") return; keys.add(e.code); keyAxis(); if (e.code === "KeyQ" && !e.repeat) { S.cast = 1; S.castHeld = 1; } if (e.code === "Space" && dead.style.display === "flex") S.restart = 1; });
  addEventListener("keyup", (e) => { keys.delete(e.code); keyAxis(); if (e.code === "KeyQ") S.castHeld = 0; });

  window.gengineInput = () => {
    const out = new Float32Array([S.right, S.forward, S.dx, S.dy, S.fire, S.restart, S.cast, S.castHeld]);
    S.dx = S.dy = 0; S.restart = 0; S.cast = 0;
    return out;
  };

  const hitm = $("hitm"), vig = $("vig");
  window.gengineFx = (kind, v) => {
    switch (kind) {
      case "shot": vibrate(15); break;
      case "cast": vibrate(20); break;
      case "boom": vibrate(60); break;
      case "hit":
        hitm.style.color = "#fff"; hitm.style.transition = "none"; hitm.style.opacity = 1;
        clearTimeout(hitT); hitT = setTimeout(() => { hitm.style.transition = ""; hitm.style.opacity = 0; }, 120);
        break;
      case "kill": hitm.style.color = "#ff3b30"; hitm.style.transform = "scale(1.3)"; vibrate(35);
        setTimeout(() => (hitm.style.transform = ""), 150); break;
      case "hurt": hurt = Math.min(1, hurt + v / 15); vig.style.opacity = hurt; break;
      case "hp": hp = v; stats(); hurt = Math.max(0, hurt - 0.08); vig.style.opacity = hurt; break;
      case "kills": kills = v; stats(); break;
      case "dead":
        dead.innerHTML = `<div>Погиб</div><div style="font-size:18px">убито: ${v}</div><div style="font-size:16px;opacity:.8">коснись, чтобы заново</div>`;
        dead.style.display = "flex"; document.exitPointerLock?.(); vibrate(200); break;
      case "restart": dead.style.display = "none"; hurt = 0; vig.style.opacity = 0; break;
    }
  };
  stats();
}
