// ICG — Home hero + color variants (Figma Plugin API script)
//
// How to run without the Figma MCP (Starter plan limit reached):
//   1. Open the ICG-Rebranding file in Figma (desktop or browser).
//   2. Menu > Plugins > search "Scripter" (by Rasmus Andersson) > run it.
//   3. Paste this whole file into Scripter and press Run.
// It creates a page "Home — Hero & Color" with a palette board and four hero
// variants, each followed by the "This week" strip. It only ADDS a page; it does
// not change anything else in the file. Photos reuse image fills already in the file.

const page = figma.createPage();
page.name = "Home — Hero & Color";
await figma.setCurrentPageAsync(page);
await Promise.all([["Anton","Regular"],["Public Sans","Regular"],["Public Sans","Medium"],["Public Sans","SemiBold"],["Public Sans","Bold"],["Inter","Bold"],["Inter","Regular"]].map(([family, style]) => figma.loadFontAsync({ family, style })));

const hex = h => ({ r: parseInt(h.slice(1,3),16)/255, g: parseInt(h.slice(3,5),16)/255, b: parseInt(h.slice(5,7),16)/255 });
const fill = (h, o) => [{ type: "SOLID", color: hex(h), ...(o != null ? { opacity: o } : {}) }];
const rgba = (h, a) => ({ ...hex(h), a });
const LR = [[1,0,0],[0,1,0]], TB = [[0,1,0],[-1,0,1]];
const grad = (t, stops) => ({ type: "GRADIENT_LINEAR", gradientTransform: t, gradientStops: stops.map(([c,a,p]) => ({ color: rgba(c,a), position: p })) });
const IMG = { summit:"ea38dac14bbb7954e190c80d3c4d81adb7175dc6", officials:"d8ae3861374c97e5eebc9f095d26b1033f8d3e61", meeting:"55c1f10123a907c959188894b84b9a57f265af8f", stakeholders:"131a99766a6a637e61fca14c274d52a64774fd04", brigada:"3ed80841019c1ff4a269b29417f2ad00238b759d", leaders:"23767ad3ffc9631b4a09a372851b6afd876f6e0a", athletes:"54740ede896e8d9a0b2be7b1d42f2d52ef681192", comsoc:"e7fc3e0d5befd7ed000273bf2e5f0e671fb6bb6e", jobfair:"4b59b03cfef417782d8fe486f174ecd1ee10f891" };
const imgFill = k => ({ type: "IMAGE", imageHash: IMG[k], scaleMode: "FILL" });

const PAL = {
  marigold: { name: "Midnight & Marigold", bg: "#0c1422", surface: "#16233a", line: "#25344f", accent: "#f5b335", onAccent: "#1a1206", text: "#f6f1e7", muted: "#9aa6bd" },
  teal:     { name: "Pasig Teal & Sun",    bg: "#062b2d", surface: "#0c3a3d", line: "#1b5054", accent: "#ffd23f", onAccent: "#1d1600", text: "#f2f7f5", muted: "#8fb5ae" },
  coral:    { name: "Ink & Coral",         bg: "#141313", surface: "#1f1d1c", line: "#34302d", accent: "#ff6a4d", onAccent: "#1e0b06", text: "#f5efe6", muted: "#a8a19a" },
  violet:   { name: "Night & Violet",      bg: "#120e24", surface: "#1d1838", line: "#2f2952", accent: "#9b7bff", onAccent: "#120a2e", text: "#f4f1ff", muted: "#aaa3cc" },
};

function AL(dir) {
  const f = figma.createFrame();
  f.layoutMode = dir; f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "AUTO";
  f.fills = []; f.clipsContent = false;
  return f;
}
function box(dir, o = {}) {
  const f = AL(dir);
  f.fills = o.bg ? fill(o.bg, o.bgo) : [];
  if (o.gap != null) f.itemSpacing = o.gap;
  if (o.p != null) { const p = Array.isArray(o.p) ? (o.p.length === 2 ? [o.p[0],o.p[1],o.p[0],o.p[1]] : o.p) : [o.p,o.p,o.p,o.p]; [f.paddingTop,f.paddingRight,f.paddingBottom,f.paddingLeft] = p; }
  if (o.name) f.name = o.name;
  if (o.r) f.cornerRadius = o.r;
  if (o.align) f.counterAxisAlignItems = o.align;
  if (o.justify) f.primaryAxisAlignItems = o.justify;
  if (o.stroke) { f.strokes = fill(o.stroke, o.so); f.strokeWeight = o.sw || 1; }
  return f;
}
function add(parent, child, o = {}) {
  parent.appendChild(child);
  if (o.w === "fill") child.layoutSizingHorizontal = "FILL";
  else if (typeof o.w === "number") { child.resize(o.w, child.height); child.layoutSizingHorizontal = "FIXED"; if (child.layoutMode && child.layoutMode !== "NONE") child.layoutSizingVertical = "HUG"; }
  return child;
}
function txt(parent, s, o = {}) {
  const t = figma.createText();
  t.fontName = { family: o.f || "Public Sans", style: o.s || "Regular" };
  t.characters = s; t.fontSize = o.size || 16; t.fills = fill(o.c || "#ffffff");
  if (o.lh) t.lineHeight = { unit: "PERCENT", value: o.lh };
  if (o.ls != null) t.letterSpacing = { unit: "PERCENT", value: o.ls };
  if (o.upper) t.textCase = "UPPER";
  if (o.name) t.name = o.name;
  parent.appendChild(t);
  if (o.w === "fill") { t.layoutSizingHorizontal = "FILL"; t.textAutoResize = "HEIGHT"; }
  else if (typeof o.w === "number") { t.resize(o.w, t.height); t.textAutoResize = "HEIGHT"; }
  return t;
}
const icon = (svg, size) => { const n = figma.createNodeFromSvg(svg); n.resize(size, size); n.name = "icon"; return n; };
const searchSvg = c => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="${c}" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`;
const calSvg = c => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="16" rx="2" stroke="${c}" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`;

function nav(P) {
  const h = box("HORIZONTAL", { p: [28, 64], justify: "SPACE_BETWEEN", align: "CENTER", name: "Nav" });
  h.resize(1440, 100); h.counterAxisSizingMode = "AUTO";
  const b = add(h, box("HORIZONTAL", { gap: 12, align: "CENTER" }));
  txt(b, "ICG", { f: "Anton", size: 40, c: P.text, lh: 100 });
  const bt = add(b, box("VERTICAL", { gap: 1 }));
  txt(bt, "Integrated Communications Group", { s: "SemiBold", size: 12, c: P.text });
  txt(bt, "Pamantasan ng Lungsod ng Pasig", { size: 12, c: P.muted });
  const n = add(h, box("HORIZONTAL", { gap: 34, align: "CENTER" }));
  ["Home","News","Events","Calendar","Archive","About"].forEach((x, i) => txt(n, x, { s: i === 0 ? "Bold" : "Medium", size: 15, c: i === 0 ? P.accent : P.text }));
  const r = add(h, box("HORIZONTAL", { gap: 22, align: "CENTER" }));
  r.appendChild(icon(searchSvg(P.text), 20));
  const l = add(r, box("HORIZONTAL", { p: [10, 20], r: 999, stroke: P.text, so: 0.5 }));
  txt(l, "Log in", { s: "SemiBold", size: 14, c: P.text });
  return h;
}
function strip(P, o = {}) {
  const s = box("HORIZONTAL", { bg: o.glass ? P.bg : P.surface, bgo: o.glass ? 0.78 : null, p: [0, o.inset ? 40 : 64], name: "This week strip", r: o.r || 0 });
  s.resize(o.width || 1440, 100); s.counterAxisSizingMode = "AUTO";
  const lab = add(s, box("VERTICAL", { gap: 8, p: [28, 28, 28, 0] }), { w: 210 });
  txt(lab, "This week", { f: "Anton", size: 40, c: P.text, upper: true, lh: 100 });
  txt(lab, "November 9 to 15", { size: 14, c: P.muted });
  txt(lab, "Open the calendar", { s: "SemiBold", size: 14, c: P.accent });
  for (const [wd, d, n] of [["Mon",9,1],["Tue",10,1],["Wed",11,0],["Thu",12,2],["Fri",13,0],["Sat",14,3],["Sun",15,0]]) {
    const t = d === 14;
    const c = add(s, box("VERTICAL", { gap: 4, p: [24, 18], bg: t ? P.accent : null, name: `Day ${d}` }), { w: "fill" });
    c.layoutSizingVertical = "FILL";
    c.strokes = fill(P.line); c.strokeLeftWeight = 1; c.strokeRightWeight = 0; c.strokeTopWeight = 0; c.strokeBottomWeight = 0;
    txt(c, t ? `${wd}, today` : wd, { s: "SemiBold", size: 13, c: t ? P.onAccent : P.muted, upper: true, ls: 6 });
    txt(c, String(d), { f: "Anton", size: o.small ? 72 : 88, c: t ? P.onAccent : P.text, lh: 100 });
    txt(c, n ? `${n} event${n > 1 ? "s" : ""}` : "No events", { s: n ? "SemiBold" : "Regular", size: 13, c: t ? P.onAccent : (n ? P.accent : P.muted) });
  }
  return s;
}
function wrapper(name, P, x) {
  const w = AL("VERTICAL");
  w.name = name; w.resize(1440, 100); w.primaryAxisSizingMode = "AUTO"; w.counterAxisSizingMode = "FIXED";
  w.fills = fill(P.bg); w.itemSpacing = 0; w.clipsContent = true; w.x = x; w.y = 0;
  page.appendChild(w);
  const lab = figma.createText(); lab.fontName = { family: "Inter", style: "Bold" }; lab.fontSize = 36; lab.characters = name; lab.x = x; lab.y = -110; page.appendChild(lab);
  const sub = figma.createText(); sub.fontName = { family: "Inter", style: "Regular" }; sub.fontSize = 18; sub.characters = `Palette: ${P.name}`; sub.x = x; sub.y = -58; page.appendChild(sub);
  return w;
}
function heroText(parent, P, o = {}) {
  const v = add(parent, box("VERTICAL", { gap: 20, name: "Lead text" }), { w: o.w || 640 });
  const meta = add(v, box("HORIZONTAL", { gap: 14, align: "CENTER" }));
  txt(meta, o.kicker || "Featured event", { s: "Bold", size: 14, c: P.accent });
  txt(meta, o.date || "May 11, 2026", { s: "Medium", size: 14, c: P.text });
  txt(meta, o.place || "PLP campus", { size: 14, c: P.muted });
  txt(v, o.title || "PLP Job Fair connects 1,200 graduates with 40 employers", { f: "Anton", size: o.size || 80, c: P.text, upper: true, lh: 98, w: "fill" });
  txt(v, o.dek || "Students lined up from 8 AM for interviews, career talks and on-the-spot hiring at the auditorium and facade area.", { size: 18, c: P.text, lh: 150, w: o.dekW || 560 });
  const ctas = add(v, box("HORIZONTAL", { gap: 14, align: "CENTER" }));
  const b1 = add(ctas, box("HORIZONTAL", { bg: P.accent, r: 999, p: [15, 30] }));
  txt(b1, "Read the story", { s: "Bold", size: 15, c: P.onAccent });
  const b2 = add(ctas, box("HORIZONTAL", { r: 999, p: [14, 22], gap: 8, align: "CENTER", stroke: P.text, so: 0.6 }));
  b2.appendChild(icon(calSvg(P.text), 18));
  txt(b2, "Add to calendar", { s: "SemiBold", size: 15, c: P.text });
  return v;
}
function card(P, k, title, date, w = 176, h = 236) {
  const c = box("VERTICAL", { r: 10, p: 14, gap: 4, justify: "MAX", name: "Story card" });
  c.fills = [imgFill(k), grad(TB, [[P.bg, 0, 0.35], [P.bg, 0.95, 1]])];
  c.resize(w, h); c.primaryAxisSizingMode = "FIXED"; c.counterAxisSizingMode = "FIXED";
  txt(c, date, { s: "SemiBold", size: 12, c: P.accent });
  txt(c, title, { s: "Bold", size: 15, c: P.text, lh: 125, w: w - 28 });
  return c;
}

// ---------- Palette board ----------
const board = box("HORIZONTAL", { gap: 24, p: 40, bg: "#ffffff", name: "Palette options" });
page.appendChild(board); board.x = 0; board.y = -760;
for (const P of Object.values(PAL)) {
  const col = add(board, box("VERTICAL", { gap: 0, r: 14, name: P.name }), { w: 320 });
  col.clipsContent = true;
  const top = add(col, box("VERTICAL", { bg: P.bg, p: 24, gap: 10 }), { w: "fill" });
  txt(top, P.name, { s: "Bold", size: 20, c: P.text });
  txt(top, "14", { f: "Anton", size: 72, c: P.accent, lh: 100 });
  const btn = add(top, box("HORIZONTAL", { bg: P.accent, r: 999, p: [10, 20] }));
  txt(btn, "Read the story", { s: "Bold", size: 13, c: P.onAccent });
  for (const [label, h] of [["Background", P.bg], ["Surface", P.surface], ["Accent", P.accent], ["Text", P.text], ["Muted", P.muted]]) {
    const row = add(col, box("HORIZONTAL", { bg: h, p: [12, 24], justify: "SPACE_BETWEEN" }), { w: "fill" });
    const dark = ["Background","Surface"].includes(label);
    txt(row, label, { s: "SemiBold", size: 13, c: dark ? P.text : P.bg });
    txt(row, h.toUpperCase(), { size: 13, c: dark ? P.text : P.bg });
  }
}

// ---------- Hero 1: Cinematic (like the reference) ----------
{
  const P = PAL.marigold; const W = wrapper("Hero 1 — Cinematic", P, 0);
  const hero = figma.createFrame(); hero.name = "Hero"; hero.resize(1440, 860);
  hero.fills = [imgFill("jobfair"), grad(LR, [[P.bg, 0.95, 0], [P.bg, 0.75, 0.38], [P.bg, 0, 0.72]]), grad(TB, [[P.bg, 0, 0.5], [P.bg, 1, 1]])];
  W.appendChild(hero);
  const n = nav(P); hero.appendChild(n); n.x = 0; n.y = 0;
  const tbox = AL("VERTICAL"); hero.appendChild(tbox); tbox.x = 64; tbox.y = 170;
  heroText(tbox, P);
  const rowWrap = box("VERTICAL", { gap: 14 }); hero.appendChild(rowWrap); rowWrap.x = 64; rowWrap.y = 590;
  txt(rowWrap, "Also on the front page", { f: "Anton", size: 22, c: P.text, upper: true });
  const row = add(rowWrap, box("HORIZONTAL", { gap: 16 }));
  for (const [k, t, d] of [["summit","ICG summit asks every college to tell its story","Nov 12"],["meeting","City and PLP sign a scholarship deal","Nov 10"],["athletes","Taekwondo team wins three medals","Nov 7"],["comsoc","Hackathon registration is open","Nov 5"],["leaders","Student leaders plan the second semester","Nov 6"],["stakeholders","Partners honored at recognition night","Nov 8"],["brigada","Volunteers ready classrooms for exams","Nov 4"]]) row.appendChild(card(P, k, t, d));
  W.appendChild(strip(P));
}

// ---------- Hero 2: This week strip sits on the photo ----------
{
  const P = PAL.teal; const W = wrapper("Hero 2 — Strip on the photo", P, 1640);
  const hero = figma.createFrame(); hero.name = "Hero"; hero.resize(1440, 900);
  hero.fills = [imgFill("summit"), grad(LR, [[P.bg, 0.92, 0], [P.bg, 0.55, 0.45], [P.bg, 0.1, 0.8]]), grad(TB, [[P.bg, 0, 0.45], [P.bg, 0.9, 1]])];
  W.appendChild(hero);
  const n = nav(P); hero.appendChild(n);
  const tbox = AL("VERTICAL"); hero.appendChild(tbox); tbox.x = 64; tbox.y = 190;
  heroText(tbox, P, { kicker: "Campus", date: "November 12, 2026", place: "Auditorium", title: "ICG summit asks every college to tell its own story", dek: "More than 300 student journalists, organization officers and faculty filled the auditorium for the first campus-wide communications summit.", size: 76 });
  const dots = box("HORIZONTAL", { gap: 8, align: "CENTER" }); hero.appendChild(dots); dots.x = 64; dots.y = 610;
  [40, 12, 12, 12].forEach((w, i) => { const r = figma.createRectangle(); r.resize(w, 4); r.cornerRadius = 2; r.fills = fill(i === 0 ? P.accent : P.text, i === 0 ? 1 : 0.4); dots.appendChild(r); });
  const s = strip(P, { glass: true, inset: true, width: 1360, r: 18, small: true }); hero.appendChild(s); s.x = 40; s.y = 900 - s.height - 40;
}

// ---------- Hero 3: Split feature with "up next" ----------
{
  const P = PAL.coral; const W = wrapper("Hero 3 — Split with up next", P, 3280);
  W.appendChild(nav(P));
  const hero = add(W, box("HORIZONTAL", { p: [8, 64, 56, 64], gap: 48, align: "CENTER", name: "Hero" }), { w: "fill" });
  const left = add(hero, box("VERTICAL", { gap: 28 }), { w: 520 });
  heroText(left, P, { kicker: "Sports", date: "November 7, 2026", place: "City sports complex", title: "Taekwondo team brings home three medals", dek: "Two golds and a bronze at the city meet, the varsity's best finish in four years.", size: 72, w: 520, dekW: 500 });
  const prog = add(left, box("HORIZONTAL", { gap: 10, align: "CENTER" }));
  txt(prog, "1 of 4", { s: "SemiBold", size: 13, c: P.muted });
  [1,0,0,0].forEach(on => { const r = figma.createRectangle(); r.resize(48, 3); r.fills = fill(on ? P.accent : P.line); prog.appendChild(r); });
  const rv = add(hero, box("VERTICAL", { gap: 16 }), { w: "fill" });
  const ph = figma.createRectangle(); ph.resize(760, 470); ph.cornerRadius = 14; ph.fills = [imgFill("athletes")]; rv.appendChild(ph); ph.layoutSizingHorizontal = "FILL";
  const un = add(rv, box("HORIZONTAL", { gap: 16 }), { w: "fill" });
  for (const [k, t, d] of [["summit","ICG summit asks every college to tell its story","Up next"],["meeting","City and PLP sign a scholarship deal","Nov 10"],["jobfair","Where the job fair class of 2026 landed","Nov 5"]]) {
    const c = add(un, box("HORIZONTAL", { gap: 12, align: "CENTER", bg: P.surface, r: 12, p: 10 }), { w: "fill" });
    const t2 = figma.createRectangle(); t2.resize(84, 64); t2.cornerRadius = 8; t2.fills = [imgFill(k)]; c.appendChild(t2);
    const v = add(c, box("VERTICAL", { gap: 4 }), { w: "fill" });
    txt(v, d, { s: "SemiBold", size: 12, c: P.accent });
    txt(v, t, { s: "SemiBold", size: 14, c: P.text, lh: 130, w: "fill" });
  }
  W.appendChild(strip(P));
}

// ---------- Hero 4: Event carousel ----------
{
  const P = PAL.violet; const W = wrapper("Hero 4 — Event carousel", P, 4920);
  W.appendChild(nav(P));
  const head = add(W, box("HORIZONTAL", { p: [16, 64, 32, 64], justify: "SPACE_BETWEEN", align: "MAX" }), { w: "fill" });
  const hv = add(head, box("VERTICAL", { gap: 8 }));
  txt(hv, "Happening at PLP", { s: "Bold", size: 14, c: P.accent });
  txt(hv, "This weekend on campus", { f: "Anton", size: 64, c: P.text, upper: true, lh: 100 });
  const arrows = add(head, box("HORIZONTAL", { gap: 10 }));
  for (const d of ["M15 6l-6 6 6 6","M9 6l6 6-6 6"]) { const a = add(arrows, box("HORIZONTAL", { r: 999, p: 12, stroke: P.text, so: 0.4 })); a.appendChild(icon(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${d}" stroke="${P.text}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`, 20)); }
  const car = add(W, box("HORIZONTAL", { p: [0, 0, 56, 64], gap: 24, align: "CENTER", name: "Carousel" }), { w: "fill" });
  car.clipsContent = true;
  function evCard(k, day, mo, title, meta, w, h, dim) {
    const c = box("VERTICAL", { r: 18, p: 28, gap: 10, justify: "MAX", name: "Event card" });
    c.fills = [imgFill(k), grad(TB, [[P.bg, 0, 0.3], [P.bg, 0.95, 1]])];
    c.resize(w, h); c.primaryAxisSizingMode = "FIXED"; c.counterAxisSizingMode = "FIXED";
    if (dim) c.opacity = 0.55;
    const dt = add(c, box("HORIZONTAL", { gap: 10, align: "MAX" }));
    txt(dt, day, { f: "Anton", size: dim ? 56 : 88, c: P.accent, lh: 90 });
    txt(dt, mo, { s: "Bold", size: dim ? 14 : 16, c: P.text, upper: true, ls: 8 });
    txt(c, title, { f: "Anton", size: dim ? 26 : 40, c: P.text, upper: true, lh: 104, w: w - 56 });
    txt(c, meta, { s: "Medium", size: dim ? 13 : 15, c: P.muted });
    return c;
  }
  car.appendChild(evCard("leaders","14","Sat","Intercollegiate debate qualifiers","9:00 AM, Audio-visual room", 720, 440, false));
  car.appendChild(evCard("athletes","14","Sat","Varsity taekwondo exhibition","1:00 PM, Gymnasium", 380, 360, true));
  car.appendChild(evCard("comsoc","15","Sun","Computer Society general assembly","3:30 PM, Computer Lab 3", 380, 360, true));
  W.appendChild(strip(P));
}
figma.viewport.scrollAndZoomIntoView(page.children);
