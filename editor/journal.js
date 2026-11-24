// Дневник героя (как в Uncharted 4, только от первого лица): страницы рисуются здесь, на холсте;
// Rust (crates/lite/src/arena/web/journal.rs) кладёт холст текстурой на блокнот в левой руке и ведёт
// правую руку с ручкой. Чернила ложатся там, где кончик ручки, а не где курсор: рука догоняет курсор
// с живой скоростью, и линия идёт за рукой.
// Связь с Rust (всё необязательно — без этого файла игра работает как раньше):
//   window.gengineJournalInput() → [открыть/закрыть, курсор x, y (NDC), нажато, авто, u, v, авто-нажато]
//   window.gengineInk(u, v, down) ← кончик ручки на развороте (0..1), каждый кадр, пока дневник открыт
//   window.gengineJournalOpen(0|1) ← дневник открылся/закрылся (мир на паузе, мышь свободна)
//   window.gengineJournalCanvas, window.gengineJournalDirty ← холст разворота и «перерисован» (Rust сбрасывает)
// Записи: assets/journal/entries.json (сюжет и задания) + свои заметки и рисунки игрока — в localStorage.
(() => {
  const W = 2048, H = 1582;           // разворот 22 × 17 см
  const PAGE = W / 2, MX = 96, TOP = 150, LINE = 64;
  const INK = "#1c2747", FONT = "600 50px Caveat, cursive";
  const KEY = "gengine.journal.v1";
  const J = { open: 0, toggle: 0, px: 0, py: 0, down: 0, auto: null, autoQ: [], lastInk: null, stroke: null };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch {} };
  const D = Object.assign({ strokes: [], texts: [], written: [], done: [], line: { l: 0, r: 0 } }, load());
  let entries = [];

  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  const paper = document.createElement("canvas"); paper.width = W; paper.height = H;
  window.gengineJournalCanvas = cv;
  const dirty = () => (window.gengineJournalDirty = true);

  // бумага: тёплый тон, волокна, линовка, тень у корешка, края темнее
  function drawPaper() {
    const p = paper.getContext("2d");
    p.fillStyle = "#e9dfc6"; p.fillRect(0, 0, W, H);
    const im = p.getImageData(0, 0, W, H), d = im.data;
    let s = 1234567;
    const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let i = 0; i < d.length; i += 4) {
      const n = (rnd() - 0.5) * 14;
      d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.8;
    }
    p.putImageData(im, 0, 0);
    p.strokeStyle = "rgba(70,90,130,.22)"; p.lineWidth = 2;
    for (const x0 of [0, PAGE]) {
      for (let y = TOP; y < H - 60; y += LINE) { p.beginPath(); p.moveTo(x0 + 50, y); p.lineTo(x0 + PAGE - 50, y); p.stroke(); }
    }
    const gut = p.createLinearGradient(PAGE - 90, 0, PAGE + 90, 0);
    gut.addColorStop(0, "rgba(0,0,0,0)"); gut.addColorStop(0.5, "rgba(60,40,10,.35)"); gut.addColorStop(1, "rgba(0,0,0,0)");
    p.fillStyle = gut; p.fillRect(PAGE - 90, 0, 180, H);
    const vg = p.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.7);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(80,50,20,.35)");
    p.fillStyle = vg; p.fillRect(0, 0, W, H);
  }

  function setFont() { g.font = FONT; g.fillStyle = INK; g.textBaseline = "alphabetic"; }
  // небольшая неровность почерка: наклон и прыгающая базовая линия, у каждой буквы своя
  function glyph(ch, x, y, k) {
    const j = Math.sin(k * 12.9898) * 43758.5453; const r = j - Math.floor(j);
    g.save(); g.translate(x, y + (r - 0.5) * 4); g.rotate((r - 0.5) * 0.06); g.fillText(ch, 0, 0); g.restore();
  }
  function textAt(t, x, y) {
    setFont(); let cx = x, k = x * 0.37 + y;
    for (const ch of t) { glyph(ch, cx, y, k++); cx += g.measureText(ch).width; }
    return cx;
  }
  function strikeAt(x0, x1, y) {
    g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y - 16);
    for (let x = x0; x <= x1; x += 24) g.lineTo(x, y - 16 + Math.sin(x * 0.11) * 3);
    g.stroke();
  }
  function inkLine(a, b) {
    g.strokeStyle = INK; g.lineCap = "round"; g.lineWidth = 3.4;
    g.beginPath(); g.moveTo(a[0] * W, a[1] * H); g.lineTo(b[0] * W, b[1] * H); g.stroke();
  }
  function redraw() {
    g.drawImage(paper, 0, 0);
    setFont(); g.fillText("Дневник", MX, 96);
    for (const t of D.texts) {
      const x1 = textAt(t.t, t.x, t.y);
      if (t.id && D.done.includes(t.id) && t.struck) strikeAt(t.x, x1, t.y);
    }
    for (const s of D.strokes) for (let i = 2; i < s.length; i += 2) inkLine([s[i - 2], s[i - 1]], [s[i], s[i + 1]]);
    dirty();
  }

  // место для новой строки: левая страница — сюжет и задания, правая — заметки игрока
  // правая страница — там, куда дотягивается рука с ручкой (сетка поз письма: v 0.2…0.8 разворота)
  const R_TOP = TOP + Math.ceil((0.2 * H + 12 - TOP) / LINE) * LINE - 12, R_BOTTOM = 0.8 * H;
  function nextLine(side) {
    const n = D.line[side]++;
    const x = (side === "l" ? 0 : PAGE) + MX;
    const y = side === "l" ? TOP + LINE * (n + 1) - 12 : R_TOP + LINE * n;
    return y < (side === "l" ? H - 80 : R_BOTTOM) ? [x, y] : null;
  }

  // ----- рука пишет сама: задание рукой героя, заметка игрока, зачёркивание -----
  // Ручка идёт по буквам (по 9 знаков в секунду, с петлями вверх-вниз внутри буквы); буква появляется,
  // когда ручка её прошла. Rust получает цель ручки (u, v) и «прижата ли».
  function queueText(t, side, id) {
    for (const line of t.split("\n")) {
      const at = nextLine(side); if (!at) return;
      J.autoQ.push({ kind: "text", t: line, x: at[0], y: at[1], id });
    }
  }
  function queueStrike(id) {
    const t = D.texts.find((e) => e.id === id && e.task); if (!t) return;
    setFont(); let w = 0; for (const ch of t.t) w += g.measureText(ch).width;
    J.autoQ.push({ kind: "strike", x0: t.x, x1: t.x + w, y: t.y, id });
  }
  function autoStep(dt) {
    if (!J.auto && J.autoQ.length) {
      const a = J.autoQ.shift(); J.auto = Object.assign(a, { s: 0, k: 0, cx: a.x ?? a.x0 });
      if (a.kind === "text") { setFont(); a.adv = [...a.t].map((ch) => g.measureText(ch).width); a.chars = [...a.t]; }
    }
    const a = J.auto; if (!a) return null;
    a.s += dt;
    if (a.s < 0.35) return [(a.x ?? a.x0) / W, (a.y - 10) / H, 0];        // подвести ручку к строке
    const t = a.s - 0.35;
    if (a.kind === "strike") {
      const x = a.x0 + Math.min(t / 0.6, 1) * (a.x1 - a.x0);
      if (t >= 0.6) { strikeAt(a.x0, a.x1, a.y); const e = D.texts.find((e) => e.id === a.id && e.task); if (e) e.struck = 1; save(); dirty(); J.auto = null; }
      return [x / W, (a.y - 16) / H, 1];
    }
    const per = 1 / 9;
    while (a.k < a.chars.length && t >= (a.k + 1) * per) {
      glyph(a.chars[a.k], a.cx, a.y, a.cx * 0.37 + a.y); a.cx += a.adv[a.k]; a.k++; dirty();
    }
    if (a.k >= a.chars.length) {
      D.texts.push({ t: a.t, x: a.x, y: a.y, id: a.id, task: !!(a.id && entries.find((e) => e.id === a.id)?.task) });
      if (a.id && !D.written.includes(a.id)) D.written.push(a.id);
      save(); J.auto = null; return null;
    }
    const f = (t / per) % 1, ch = a.chars[a.k];
    const up = ch === " " ? 0 : 1;
    // петля буквы: вверх на высоту строчной и обратно, ручка прижата (на пробеле — приподнята)
    return [(a.cx + a.adv[a.k] * f) / W, (a.y - 4 - 22 * Math.abs(Math.sin(f * Math.PI * 1.5))) / H, up];
  }

  // ----- задания: дописать новые, зачеркнуть выполненные -----
  let kills = 0;
  const hinted = new Set();
  function tasksUpdate() {
    for (const e of entries) {
      if (!e.task) continue;
      const open = !e.after || D.done.includes(e.after);
      if (open && !D.written.includes(e.id) && !J.autoQ.some((q) => q.id === e.id) && J.auto?.id !== e.id) {
        if (J.open) queueText(e.text, "r", e.id); else if (!hinted.has(e.id)) { hinted.add(e.id); hint("Новая запись в дневнике — J"); }
      }
      if (e.done && kills >= (e.done.kills ?? Infinity) && D.written.includes(e.id) && !D.done.includes(e.id)) {
        D.done.push(e.id); save();
        if (J.open) queueStrike(e.id); else hint("Задание выполнено — J");
      }
    }
    if (J.open) for (const id of D.done) { const t = D.texts.find((x) => x.id === id && x.task && !x.struck); if (t && !J.autoQ.some((q) => q.kind === "strike" && q.id === id)) queueStrike(id); }
  }

  // ----- интерфейс -----
  let hintEl, ui, input;
  function hint(t) {
    if (!hintEl) return;
    hintEl.textContent = t; hintEl.style.opacity = 1;
    clearTimeout(hint.t); hint.t = setTimeout(() => (hintEl.style.opacity = 0), 3500);
  }
  function setOpen(o) {
    if (J.open === o) return;
    J.toggle = 1;
  }
  window.gengineJournalIsOpen = () => !!J.open;
  window.gengineJournalOpen = (o) => {
    J.open = o ? 1 : 0;
    ui.style.display = o ? "flex" : "none";
    document.body.classList.toggle("journal", !!o);
    if (o) { document.exitPointerLock?.(); tasksUpdate(); }
    else { input.style.display = "none"; J.down = 0; J.stroke = null; }
  };
  window.gengineJournalInput = () => {
    const now = performance.now(), dt = Math.min((now - (J.t || now)) / 1000, 0.1); J.t = now;
    const a = J.open ? autoStep(dt) : null;
    const out = new Float32Array([J.toggle, J.px, J.py, J.down && !a ? 1 : 0, a ? 1 : 0, a ? a[0] : 0, a ? a[1] : 0, a ? a[2] : 0]);
    J.toggle = 0;
    return out;
  };
  // кончик ручки: пока игрок рисует — линия за ручкой; рука пишет сама — буквы рисует autoStep
  window.gengineInk = (u, v, down) => {
    if (J.auto || !J.open) { J.lastInk = null; return; }
    if (down && u >= 0 && u <= 1 && v >= 0 && v <= 1) {
      if (!J.stroke) { J.stroke = [u, v]; D.strokes.push(J.stroke); }
      else if (Math.hypot(u - J.stroke.at(-2), v - J.stroke.at(-1)) > 0.0015) {
        inkLine([J.stroke.at(-2), J.stroke.at(-1)], [u, v]); J.stroke.push(u, v); dirty();
      }
    } else if (J.stroke) { if (J.stroke.length < 4) D.strokes.pop(); J.stroke = null; save(); }
  };

  const css = `
#jbtn{right:28px;bottom:220px;width:70px;height:70px;border-radius:12px;background:#6b4a2b;opacity:.85;pointer-events:auto;display:flex;align-items:center;justify-content:center;font:700 11px system-ui;color:#f3e6c8;text-shadow:0 1px 2px #000}
#jhint{left:50%;top:18%;transform:translateX(-50%);padding:6px 12px;border-radius:8px;background:rgba(0,0,0,.5);font:600 15px system-ui;color:#fff;opacity:0;transition:opacity .4s}
#jui{left:0;right:0;bottom:10px;display:none;justify-content:center;gap:10px;pointer-events:none}
#jui button{pointer-events:auto;font:600 14px system-ui;padding:8px 14px;border-radius:8px;border:0;background:rgba(40,28,16,.8);color:#f3e6c8}
#jui span{font:500 12px system-ui;color:#fff;opacity:.7;align-self:center;text-shadow:0 1px 2px #000}
body.journal #cross,body.journal #cast,body.journal #stick,body.journal #hitm{display:none!important}
#jin{position:fixed;left:50%;bottom:60px;transform:translateX(-50%);width:min(520px,80vw);display:none;font:600 22px Caveat,cursive;padding:6px 10px;border-radius:6px;border:1px solid #6b4a2b;background:#f3ead2;color:#1c2747}
`;
  addEventListener("DOMContentLoaded", () => {
    const st = document.createElement("style");
    st.textContent = css + "@font-face{font-family:Caveat;font-weight:600;src:url(fonts/caveat-cyrillic-600-normal.woff2) format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}"
      + "@font-face{font-family:Caveat;font-weight:600;src:url(fonts/caveat-latin-600-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+2000-206F,U+25A1}";
    document.head.appendChild(st);
    const mk = (id, cls, html) => { const d = document.createElement("div"); d.id = id; d.className = cls; d.innerHTML = html; document.body.appendChild(d); return d; };
    const btn = mk("jbtn", "hud", "ДНЕВНИК");
    hintEl = mk("jhint", "hud", "");
    ui = mk("jui", "hud", '<button id="jwrite">Написать</button><button id="jclose">Закрыть</button><span>рисуй мышью или пальцем · Enter — запись · J — закрыть</span>');
    input = document.createElement("input"); input.id = "jin"; input.placeholder = "заметка…"; input.maxLength = 60; document.body.appendChild(input);
    const toggle = (e) => { e?.preventDefault?.(); e?.stopPropagation?.(); setOpen(!J.open); };
    btn.addEventListener("click", toggle); btn.addEventListener("touchstart", toggle, { passive: false });
    document.getElementById("jclose").addEventListener("click", toggle);
    const write = (e) => { e?.stopPropagation?.(); input.style.display = "block"; input.value = ""; input.focus(); };
    document.getElementById("jwrite").addEventListener("click", write);
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") { const t = input.value.trim(); if (t) queueText(t, "r"); input.style.display = "none"; input.blur(); }
      if (e.key === "Escape") { input.style.display = "none"; input.blur(); }
    });
    addEventListener("keydown", (e) => {
      if (document.activeElement === input) return;
      if (e.code === "KeyJ" && !e.repeat) toggle();
      if (J.open && e.code === "Escape") toggle();
      if (J.open && e.code === "Enter") write();
    });
    // курсор и касание → NDC; пока дневник открыт, ими рисуют (обзор и стрельба стоят)
    const canvas = document.getElementById("bevy");
    const ndc = (x, y) => { const r = canvas.getBoundingClientRect(); J.px = ((x - r.left) / r.width) * 2 - 1; J.py = 1 - ((y - r.top) / r.height) * 2; };
    addEventListener("mousemove", (e) => { if (J.open) ndc(e.clientX, e.clientY); });
    canvas.addEventListener("mousedown", (e) => { if (J.open && e.button === 0) { ndc(e.clientX, e.clientY); J.down = 1; } });
    addEventListener("mouseup", () => (J.down = 0));
    canvas.addEventListener("touchstart", (e) => { if (!J.open) return; const t = e.changedTouches[0]; ndc(t.clientX, t.clientY); J.down = 1; }, { passive: true });
    canvas.addEventListener("touchmove", (e) => { if (!J.open) return; const t = e.changedTouches[0]; ndc(t.clientX, t.clientY); }, { passive: true });
    canvas.addEventListener("touchend", () => (J.down = 0));
    // задания по убитым: оборачиваем gengineFx из arena-ui.js
    const prev = window.gengineFx;
    window.gengineFx = (k, v) => { prev?.(k, v); if (k === "kills") { kills = v; tasksUpdate(); } if (k === "restart") kills = 0; };
    drawPaper(); redraw();
    const ready = document.fonts?.load ? document.fonts.load(FONT, "Дневник□") : Promise.resolve();
    Promise.all([ready.catch(() => {}), fetch("entries.json").then((r) => r.json()).catch(() => ({ entries: [] }))]).then(([, j]) => {
      entries = j.entries || [];
      // при первом запуске сюжетные записи уже написаны (без анимации)
      for (const e of entries) if (!e.task && !D.written.includes(e.id)) {
        for (const line of e.text.split("\n")) { const at = nextLine("l"); if (at) D.texts.push({ t: line, x: at[0], y: at[1], id: e.id }); }
        D.written.push(e.id);
      }
      save(); redraw(); tasksUpdate();
    });
  });
})();
