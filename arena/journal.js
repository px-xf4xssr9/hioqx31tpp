// Дневник героя (как в Uncharted 4, только от первого лица): страницы рисуются здесь, на холсте;
// Rust (crates/lite/src/arena/web/journal.rs) кладёт холст текстурой на блокнот в левой руке и ведёт
// правую руку с ручкой. Чернила ложатся там, где кончик ручки, а не где курсор: рука догоняет курсор
// с живой скоростью, и линия идёт за рукой.
// Связь с Rust (всё необязательно — без этого файла игра работает как раньше):
//   window.gengineJournalInput() → [открыть/закрыть, курсор x, y (NDC), нажато, авто, u, v, авто-нажато]
//   window.gengineInk(u, v, down) ← кончик ручки на развороте (0..1), каждый кадр, пока дневник открыт
//   window.gengineJournalOpen(0|1) ← дневник открылся/закрылся (мир на паузе, мышь свободна)
//   window.gengineJournalCanvas, window.gengineJournalDirty ← холст разворота и «перерисован» (Rust сбрасывает)
//   window.gengineJournalFlip(±1) ← Rust начал переворот листа: под ним — следующий разворот, сам лист —
//     window.gengineJournalSheet (левая половина — лицо, правая — оборот); gengineJournalFlipDone() — лист лёг
//   window.gengineJournalMode() → 0 читать (две руки держат), 1 писать (карандаш)
// Записи: assets/journal/entries.json (сюжет и задания) + свои заметки и рисунки игрока — в localStorage.
(() => {
  const W = 2048, H = 1453;           // разворот A5: 29.6 × 21 см (чтение, journal4_spec.json — по кадрам Uncharted 4)
  const PAGE = W / 2, MX = 96, TOP = 150, LINE = 64;
  const INK = "#1c2747", FONT = "600 50px Caveat, cursive";
  const KEY = "gengine.journal.v2", SPREADS = 12;
  const J = { open: 0, toggle: 0, px: 0, py: 0, down: 0, auto: null, autoQ: [], lastInk: null, stroke: null, flip: 0, mode: 0 };
  const load = () => {
    try {
      const v2 = JSON.parse(localStorage.getItem(KEY));
      if (v2) return v2;
      const v1 = JSON.parse(localStorage.getItem("gengine.journal.v1"));  // прежний формат: один разворот
      if (v1) return { ...v1, s: 0, strokes: (v1.strokes || []).map((p) => ({ s: 0, pts: p })), texts: (v1.texts || []).map((t) => ({ ...t, s: 0 })),
        line: { "0l": v1.line?.l || 0, "0r": v1.line?.r || 0 } };
    } catch {}
    return {};
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch {} };
  const D = Object.assign({ s: 0, strokes: [], texts: [], written: [], done: [], line: {} }, load());
  let entries = [];

  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  const paper = document.createElement("canvas"); paper.width = W; paper.height = H;
  window.gengineJournalCanvas = cv;
  const sheet = document.createElement("canvas"); sheet.width = W; sheet.height = H;
  window.gengineJournalSheet = sheet;
  const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H;
  const dirty = () => (window.gengineJournalDirty = true);

  // бумага старого полевого блокнота (как у Нейтана в U4): без линовки, кремовая, неровный тон пятнами,
  // края каждой страницы потемнели от рук и времени, редкие рыжие точки (фоксинг), волокна, тень у корешка
  function drawPaper() {
    const p = paper.getContext("2d");
    let s = 1234567;
    const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    p.fillStyle = "#efe3c6"; p.fillRect(0, 0, W, H);
    // крупные пятна тона: то светлее, то желтее
    for (let i = 0; i < 70; i++) {
      const x = rnd() * W, y = rnd() * H, r = 120 + rnd() * 380, warm = rnd() < 0.6;
      const gr = p.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, warm ? `rgba(170,125,60,${0.03 + rnd() * 0.05})` : `rgba(250,244,225,${0.06 + rnd() * 0.08})`);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      p.fillStyle = gr; p.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    // края страниц темнее (каждая страница отдельно), сильнее у внешнего края и низа — там берут руками
    for (const [x0, outer] of [[0, 0], [PAGE, PAGE]]) {
      const edge = (x, y, w, h, gx0, gy0, gx1, gy1, a) => {
        const gr = p.createLinearGradient(gx0, gy0, gx1, gy1);
        gr.addColorStop(0, `rgba(105,70,30,${a})`); gr.addColorStop(1, "rgba(105,70,30,0)");
        p.fillStyle = gr; p.fillRect(x, y, w, h);
      };
      const ox = outer === 0 ? x0 : x0 + PAGE;  // внешний край: у левой — слева, у правой — справа
      if (outer === 0) edge(x0, 0, 110, H, x0, 0, x0 + 110, 0, 0.3); else edge(ox - 110, 0, 110, H, ox, 0, ox - 110, 0, 0.3);
      edge(x0, 0, PAGE, 70, 0, 0, 0, 70, 0.2);
      edge(x0, H - 90, PAGE, 90, 0, H, 0, H - 90, 0.32);
    }
    // фоксинг — рыжие точки
    for (let i = 0; i < 60; i++) {
      const x = rnd() * W, y = rnd() * H, r = 2 + rnd() * rnd() * 10;
      p.fillStyle = `rgba(160,105,55,${0.05 + rnd() * 0.12})`;
      p.beginPath(); p.arc(x, y, r, 0, Math.PI * 2); p.fill();
    }
    // волокна и зерно
    const im = p.getImageData(0, 0, W, H), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rnd() - 0.5) * 12;
      d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.8;
    }
    p.putImageData(im, 0, 0);
    p.strokeStyle = "rgba(120,90,50,.07)"; p.lineWidth = 1;
    for (let i = 0; i < 900; i++) {
      const x = rnd() * W, y = rnd() * H, a = rnd() * Math.PI, l = 6 + rnd() * 22;
      p.beginPath(); p.moveTo(x, y); p.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke();
    }
    // у корешка — тень сгиба (сам прогиб даёт сетка страницы в движке)
    const gut = p.createLinearGradient(PAGE - 70, 0, PAGE + 70, 0);
    gut.addColorStop(0, "rgba(0,0,0,0)"); gut.addColorStop(0.5, "rgba(60,40,10,.38)"); gut.addColorStop(1, "rgba(0,0,0,0)");
    p.fillStyle = gut; p.fillRect(PAGE - 70, 0, 140, H);
  }

  let gg = g;  // куда рисуем: разворот на экране или вспомогательный холст при перевороте
  function setFont() { gg.font = FONT; gg.fillStyle = INK; gg.textBaseline = "alphabetic"; }
  // небольшая неровность почерка: наклон и прыгающая базовая линия, у каждой буквы своя
  function glyph(ch, x, y, k) {
    const j = Math.sin(k * 12.9898) * 43758.5453; const r = j - Math.floor(j);
    gg.save(); gg.translate(x, y + (r - 0.5) * 4); gg.rotate((r - 0.5) * 0.06); gg.fillText(ch, 0, 0); gg.restore();
  }
  function textAt(t, x, y) {
    setFont(); let cx = x, k = x * 0.37 + y;
    for (const ch of t) { glyph(ch, cx, y, k++); cx += gg.measureText(ch).width; }
    return cx;
  }
  function strikeAt(x0, x1, y) {
    gg.strokeStyle = INK; gg.lineWidth = 4; gg.beginPath(); gg.moveTo(x0, y - 16);
    for (let x = x0; x <= x1; x += 24) gg.lineTo(x, y - 16 + Math.sin(x * 0.11) * 3);
    gg.stroke();
  }
  function inkLine(a, b) {
    gg.strokeStyle = INK; gg.lineCap = "round"; gg.lineWidth = 3.4;
    gg.beginPath(); gg.moveTo(a[0] * W, a[1] * H); gg.lineTo(b[0] * W, b[1] * H); gg.stroke();
  }
  // разворот s целиком — на холст ctx
  function drawSpread(ctx, s) {
    const was = gg; gg = ctx;
    gg.drawImage(paper, 0, 0);
    if (s === 0) { setFont(); gg.fillText("Дневник", MX, 96); }
    for (const t of D.texts) {
      if ((t.s || 0) !== s) continue;
      const x1 = textAt(t.t, t.x, t.y);
      if (t.id && D.done.includes(t.id) && t.struck) strikeAt(t.x, x1, t.y);
    }
    for (const st of D.strokes) { if (st.s !== s) continue; const p = st.pts; for (let i = 2; i < p.length; i += 2) inkLine([p[i - 2], p[i - 1]], [p[i], p[i + 1]]); }
    gg = was;
  }
  function redraw() { drawSpread(g, D.s); dirty(); }
  // переворот: под листом — левая половина старого и правая нового разворота (вперёд) или наоборот;
  // лист: лицо — уходящая страница, оборот — та, что ляжет
  window.gengineJournalFlip = (dir) => {
    const to = D.s + dir;
    if (to < 0 || to >= SPREADS || J.auto) return false;
    const sc = sheet.getContext("2d"), H2 = PAGE;
    drawSpread(tmp.getContext("2d"), to);
    if (dir > 0) {
      sc.drawImage(cv, H2, 0, H2, H, 0, 0, H2, H);          // лицо — правая страница сейчас
      sc.drawImage(tmp, 0, 0, H2, H, H2, 0, H2, H);         // оборот — левая страница следующего
      g.drawImage(tmp, H2, 0, H2, H, H2, 0, H2, H);         // под листом — правая следующего
    } else {
      sc.drawImage(cv, 0, 0, H2, H, 0, 0, H2, H);           // лицо — левая страница сейчас
      sc.drawImage(tmp, H2, 0, H2, H, H2, 0, H2, H);        // оборот — правая предыдущего
      g.drawImage(tmp, 0, 0, H2, H, 0, 0, H2, H);           // под листом — левая предыдущего
    }
    J.flipTo = to; dirty(); window.gengineJournalSheetDirty = true;
    return true;
  };
  window.gengineJournalFlipDone = () => { if (J.flipTo != null) { D.s = J.flipTo; J.flipTo = null; save(); redraw(); } };
  window.gengineJournalMode = () => J.mode;

  // место для новой строки: левая страница — сюжет и задания, правая — заметки игрока
  // правая страница — там, куда дотягивается рука с ручкой (сетка поз письма: v 0.2…0.8 разворота)
  const R_TOP = TOP + Math.ceil((0.2 * H + 12 - TOP) / LINE) * LINE - 12, R_BOTTOM = 0.8 * H;
  function nextLine(side) {
    const key = D.s + side; D.line[key] = D.line[key] || 0;
    const n = D.line[key]++;
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
      J.autoQ.push({ kind: "text", t: line, x: at[0], y: at[1], id, s: D.s });
    }
  }
  // в чтении (карандаш не в руке) запись уже сделана — как в Uncharted 4: открыл, а она там
  function instantText(t, side, id) {
    for (const line of t.split("\n")) { const at = nextLine(side); if (at) D.texts.push({ t: line, x: at[0], y: at[1], id, s: D.s, task: !!entries.find((e) => e.id === id)?.task }); }
    if (id && !D.written.includes(id)) D.written.push(id);
    save(); redraw();
  }
  function instantStrike(id) {
    const t = D.texts.find((e) => e.id === id && e.task); if (t) { t.struck = 1; save(); redraw(); }
  }
  function queueStrike(id) {
    const t = D.texts.find((e) => e.id === id && e.task); if (!t) return;
    setFont(); let w = 0; for (const ch of t.t) w += g.measureText(ch).width;
    J.autoQ.push({ kind: "strike", x0: t.x, x1: t.x + w, y: t.y, id, s: t.s || 0 });
  }
  function autoStep(dt) {
    if (!J.auto && J.autoQ.length) {
      const a = J.autoQ.shift(); J.auto = Object.assign(a, { s0: a.s, s: 0, k: 0, cx: a.x ?? a.x0 });
      if (a.kind === "text") { setFont(); a.adv = [...a.t].map((ch) => g.measureText(ch).width); a.chars = [...a.t]; }
    }
    const a = J.auto; if (!a) return null;
    if ((a.s0 ?? a.s) !== D.s) { if (!J.flip && !J.flipTo) J.flip = (a.s0 ?? a.s) > D.s ? 1 : -1; return null; }  // запись на другом развороте — сперва долистать
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
      D.texts.push({ t: a.t, x: a.x, y: a.y, id: a.id, s: a.s0, task: !!(a.id && entries.find((e) => e.id === a.id)?.task) });
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
        if (J.open) { if (J.mode) queueText(e.text, "r", e.id); else instantText(e.text, "r", e.id); } else if (!hinted.has(e.id)) { hinted.add(e.id); hint("Новая запись в дневнике — J"); }
      }
      if (e.done && kills >= (e.done.kills ?? Infinity) && D.written.includes(e.id) && !D.done.includes(e.id)) {
        D.done.push(e.id); save();
        if (J.open) { if (J.mode) queueStrike(e.id); else instantStrike(e.id); } else hint("Задание выполнено — J");
      }
    }
    if (J.open) for (const id of D.done) { const t = D.texts.find((x) => x.id === id && x.task && !x.struck); if (t && !J.autoQ.some((q) => q.kind === "strike" && q.id === id)) { if (J.mode) queueStrike(id); else instantStrike(id); } }
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
    else { input.style.display = "none"; J.down = 0; J.stroke = null; J.mode = 0; const b = document.getElementById("jwrite"); if (b) b.textContent = "Написать"; }
  };
  window.gengineJournalInput = () => {
    const now = performance.now(), dt = Math.min((now - (J.t || now)) / 1000, 0.1); J.t = now;
    const a = J.open ? autoStep(dt) : null;
    const out = new Float32Array([J.toggle, J.px, J.py, J.down && !a ? 1 : 0, a ? 1 : 0, a ? a[0] : 0, a ? a[1] : 0, a ? a[2] : 0, J.flip]);
    J.toggle = 0; J.flip = 0;
    return out;
  };
  // кончик ручки: пока игрок рисует — линия за ручкой; рука пишет сама — буквы рисует autoStep
  window.gengineInk = (u, v, down) => {
    if (J.auto || !J.open) { J.lastInk = null; return; }
    if (down && u >= 0 && u <= 1 && v >= 0 && v <= 1) {
      if (!J.stroke) { J.stroke = [u, v]; D.strokes.push({ s: D.s, pts: J.stroke }); }
      else if (Math.hypot(u - J.stroke.at(-2), v - J.stroke.at(-1)) > 0.0015) {
        inkLine([J.stroke.at(-2), J.stroke.at(-1)], [u, v]); J.stroke.push(u, v); dirty();
      }
    } else if (J.stroke) { if (J.stroke.length < 4) D.strokes.pop(); J.stroke = null; save(); }
  };
  window.gengineInkAllowed = () => J.mode === 1 && !J.auto;

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
    ui = mk("jui", "hud", '<button id="jprev">◀</button><button id="jwrite">Написать</button><button id="jnext">▶</button><button id="jclose">Закрыть</button><span id="jhelp">← → листать · «Написать» — карандаш · J — закрыть</span>');
    input = document.createElement("input"); input.id = "jin"; input.placeholder = "заметка…"; input.maxLength = 60; document.body.appendChild(input);
    const toggle = (e) => { e?.preventDefault?.(); e?.stopPropagation?.(); setOpen(!J.open); };
    btn.addEventListener("click", toggle); btn.addEventListener("touchstart", toggle, { passive: false });
    document.getElementById("jclose").addEventListener("click", toggle);
    // «Написать»: правая рука берёт карандаш, блокнот ложится на левую ладонь; ещё раз — заметка с клавиатуры
    const help = document.getElementById("jhelp"), wbtn = document.getElementById("jwrite");
    const setMode = (m) => {
      J.mode = m; wbtn.textContent = m ? "Читать" : "Написать";
      help.textContent = m ? "рисуй мышью или пальцем · Enter — заметка · J — закрыть" : "← → листать · «Написать» — карандаш · J — закрыть";
    };
    const write = (e) => { e?.stopPropagation?.(); if (!J.mode) return setMode(1); input.style.display = "block"; input.value = ""; input.focus(); };
    wbtn.addEventListener("click", (e) => { e.stopPropagation(); setMode(J.mode ? 0 : 1); });
    const flip = (d) => (e) => { e?.stopPropagation?.(); if (J.open) J.flip = d; };
    document.getElementById("jprev").addEventListener("click", flip(-1));
    document.getElementById("jnext").addEventListener("click", flip(1));
    addEventListener("wheel", (e) => { if (J.open && Math.abs(e.deltaY) > 20) J.flip = e.deltaY > 0 ? 1 : -1; });
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") { const t = input.value.trim(); if (t) { queueText(t, "r"); J.mode = 1; } input.style.display = "none"; input.blur(); }
      if (e.key === "Escape") { input.style.display = "none"; input.blur(); }
    });
    addEventListener("keydown", (e) => {
      if (document.activeElement === input) return;
      if (e.code === "KeyJ" && !e.repeat) toggle();
      if (J.open && e.code === "Escape") toggle();
      if (J.open && e.code === "Enter") write();
      if (J.open && (e.code === "ArrowRight" || e.code === "KeyD")) J.flip = 1;
      if (J.open && (e.code === "ArrowLeft" || e.code === "KeyA")) J.flip = -1;
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
