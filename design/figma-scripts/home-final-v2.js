// ICG — Home v2 (polish pass) — Figma Plugin API script
//
// Same chosen direction as home-final.js (Variant A layout, Cinematic hero, Midnight &
// Marigold, Anton + Public Sans), refined with the impeccable craft floor and
// ui-ux-pro-max guidelines. What changed is listed in the notes it draws on the canvas.
//
// Run: open the page you want > Plugins > Scripter > paste this file > Run.
// It draws on the CURRENT page, to the right of anything already there.
// Nothing existing is moved or deleted. Photos reuse image fills already in the file.

const page = figma.currentPage;
let OX = 0, OY = 0;
if (page.children.length) {
  OX = Math.max(...page.children.map(n => n.x + n.width)) + 400;
  OY = Math.min(...page.children.map(n => n.y)) + 900;
}
await Promise.all([["Anton","Regular"],["Public Sans","Regular"],["Public Sans","Medium"],["Public Sans","SemiBold"],["Public Sans","Bold"],["Inter","Bold"],["Inter","Regular"]].map(([family, style]) => figma.loadFontAsync({ family, style })));

// ---------- Tokens: Midnight & Marigold ----------
const T = {
  bg: "#0c1422", surface: "#16233a", surfaceHi: "#1e2e4a", line: "#25344f",
  marigold: "#f5b335", marigoldHi: "#ffc552", onMarigold: "#1a1206",
  text: "#f6f1e7", muted: "#9aa6bd", disabledBg: "#2a3650", disabledText: "#7d879b",
  paper: "#f7f4ee", ink: "#0c1422", inkMuted: "#5b6475", amber: "#8a5a00", rule: "#ddd7cc",
};
const hex = h => ({ r: parseInt(h.slice(1,3),16)/255, g: parseInt(h.slice(3,5),16)/255, b: parseInt(h.slice(5,7),16)/255 });
const fill = (h, o) => [{ type: "SOLID", color: hex(h), ...(o != null ? { opacity: o } : {}) }];
const rgba = (h, a) => ({ ...hex(h), a });
const LR = [[1,0,0],[0,1,0]], TB = [[0,1,0],[-1,0,1]];
const grad = (t, stops) => ({ type: "GRADIENT_LINEAR", gradientTransform: t, gradientStops: stops.map(([c,a,p]) => ({ color: rgba(c,a), position: p })) });
const IMG = { summit:"ea38dac14bbb7954e190c80d3c4d81adb7175dc6", officials:"d8ae3861374c97e5eebc9f095d26b1033f8d3e61", meeting:"55c1f10123a907c959188894b84b9a57f265af8f", stakeholders:"131a99766a6a637e61fca14c274d52a64774fd04", brigada:"3ed80841019c1ff4a269b29417f2ad00238b759d", leaders:"23767ad3ffc9631b4a09a372851b6afd876f6e0a", athletes:"54740ede896e8d9a0b2be7b1d42f2d52ef681192", comsoc:"e7fc3e0d5befd7ed000273bf2e5f0e671fb6bb6e", jobfair:"4b59b03cfef417782d8fe486f174ecd1ee10f891" };
const imgFill = k => ({ type: "IMAGE", imageHash: IMG[k], scaleMode: "FILL" });

// ---------- Helpers (standard Plugin API only) ----------
function AL(dir) { const f = figma.createFrame(); f.layoutMode = dir; f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "AUTO"; f.fills = []; f.clipsContent = false; return f; }
function box(dir, o = {}) {
  const f = AL(dir);
  f.fills = o.bg ? fill(o.bg, o.bgo) : [];
  if (o.gap != null) f.itemSpacing = o.gap;
  if (o.p != null) { const p = Array.isArray(o.p) ? (o.p.length === 2 ? [o.p[0],o.p[1],o.p[0],o.p[1]] : o.p) : [o.p,o.p,o.p,o.p]; [f.paddingTop,f.paddingRight,f.paddingBottom,f.paddingLeft] = p; }
  if (o.name) f.name = o.name;
  if (o.r) f.cornerRadius = o.r;
  if (o.align) f.counterAxisAlignItems = o.align;
  if (o.justify) f.primaryAxisAlignItems = o.justify;
  if (o.stroke) { f.strokes = fill(o.stroke, o.so); f.strokeWeight = o.sw || 1; if (o.sa) f.strokeAlign = o.sa; }
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
  t.characters = s; t.fontSize = o.size || 16; t.fills = fill(o.c || T.ink);
  if (o.lh) t.lineHeight = { unit: "PERCENT", value: o.lh };
  if (o.ls != null) t.letterSpacing = { unit: "PERCENT", value: o.ls };
  if (o.upper) t.textCase = "UPPER";
  if (o.name) t.name = o.name;
  parent.appendChild(t);
  if (o.w === "fill") { t.layoutSizingHorizontal = "FILL"; t.textAutoResize = "HEIGHT"; }
  else if (typeof o.w === "number") { t.resize(o.w, t.height); t.textAutoResize = "HEIGHT"; }
  return t;
}
function rect(parent, w, h, paint, o = {}) { const r = figma.createRectangle(); r.resize(w, h); r.fills = paint; if (o.r) r.cornerRadius = o.r; if (o.name) r.name = o.name; parent.appendChild(r); if (o.fillW) r.layoutSizingHorizontal = "FILL"; return r; }
function edge(f, color, side, w = 1) { f.strokes = fill(color); f.strokeTopWeight = side === "top" ? w : 0; f.strokeBottomWeight = side === "bottom" ? w : 0; f.strokeLeftWeight = side === "left" ? w : 0; f.strokeRightWeight = 0; }
const svgIcon = (inner, c, size = 20) => { const n = figma.createNodeFromSvg(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${inner.split("CUR").join(c)}</svg>`); n.resize(size, size); n.name = "icon"; return n; };
const I = {
  search: '<circle cx="11" cy="11" r="7" stroke="CUR" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="CUR" stroke-width="2" stroke-linecap="round"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2" stroke="CUR" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="CUR" stroke-width="2" stroke-linecap="round"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" stroke="CUR" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5" stroke="CUR" stroke-width="2"/>',
  clock: '<circle cx="12" cy="12" r="9" stroke="CUR" stroke-width="2"/><path d="M12 7v5l3 2" stroke="CUR" stroke-width="2" stroke-linecap="round"/>',
  left: '<path d="M15 6l-6 6 6 6" stroke="CUR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  right: '<path d="M9 6l6 6-6 6" stroke="CUR" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16" stroke="CUR" stroke-width="2" stroke-linecap="round"/>',
};
function iconButton(parent, ic, color, ring, size = 44, name = "Icon button") {
  const b = add(parent, box("HORIZONTAL", { r: 999, stroke: ring, so: 0.5, justify: "CENTER", align: "CENTER", name }));
  b.resize(size, size); b.primaryAxisSizingMode = "FIXED"; b.counterAxisSizingMode = "FIXED";
  b.appendChild(svgIcon(I[ic], color, 20));
  return b;
}

// ---------- Frames ----------
function pageFrame(name, w, x, y) {
  const f = AL("VERTICAL"); f.name = name; f.resize(w, 100); f.primaryAxisSizingMode = "AUTO"; f.counterAxisSizingMode = "FIXED";
  f.fills = fill(T.paper); f.itemSpacing = 0; f.clipsContent = true; f.x = x; f.y = y; page.appendChild(f); return f;
}
const D = pageFrame("Home v2 — Desktop 1440", 1440, OX, OY);
const M = pageFrame("Home v2 — Mobile 390", 390, OX + 1440 + 160, OY);

// ---------- Components with states ----------
const holder = box("HORIZONTAL", { gap: 48, p: 40, bg: "#ffffff", name: "Components v2", align: "MIN" });
page.appendChild(holder); holder.x = OX; holder.y = OY - 820;

function buttonVariant(style, state) {
  const primary = style === "Primary";
  const b = box("HORIZONTAL", { r: 999, p: [15, 28], gap: 8, align: "CENTER" });
  holder.appendChild(b);
  let bg = null, stroke = null, so = 1, c = T.text;
  if (primary) { bg = state === "Hover" ? T.marigoldHi : state === "Disabled" ? T.disabledBg : T.marigold; c = state === "Disabled" ? T.disabledText : T.onMarigold; }
  else { bg = state === "Hover" ? T.text : null; so = state === "Hover" ? 0.08 : 1; stroke = state === "Disabled" ? T.disabledText : T.text; c = state === "Disabled" ? T.disabledText : T.text; }
  if (bg) b.fills = fill(bg, primary ? null : so);
  if (stroke) { b.strokes = fill(stroke, state === "Default" ? 0.6 : 1); b.strokeWeight = 1; }
  if (state === "Focus") { b.strokes = fill(primary ? T.text : T.marigold); b.strokeWeight = 2; b.strokeAlign = "OUTSIDE"; }
  if (!primary) b.appendChild(svgIcon(I.cal, c, 18));
  txt(b, primary ? "See event details" : "Add to calendar", { s: "Bold", size: 15, c, name: "label" });
  b.name = `Style=${style}, State=${state}`;
  return figma.createComponentFromNode(b);
}
const btnComps = [];
for (const st of ["Primary","Secondary"]) for (const s of ["Default","Hover","Focus","Disabled"]) btnComps.push(buttonVariant(st, s));
const Button = figma.combineAsVariants(btnComps, holder);
Button.name = "Button"; Button.layoutMode = "HORIZONTAL"; Button.layoutWrap = "WRAP"; Button.itemSpacing = 16; Button.counterAxisSpacing = 16;
Button.paddingTop = Button.paddingBottom = Button.paddingLeft = Button.paddingRight = 24; Button.fills = fill(T.bg);
Button.resize(560, Button.height); Button.primaryAxisSizingMode = "FIXED"; Button.counterAxisSizingMode = "AUTO";
const btn = (style, state = "Default") => Button.children.find(c => c.name === `Style=${style}, State=${state}`);

function dayVariant(state) {
  const c = box("VERTICAL", { gap: 4, p: [24, 18] });
  holder.appendChild(c); c.resize(150, 100); c.counterAxisSizingMode = "FIXED"; c.primaryAxisSizingMode = "AUTO";
  edge(c, T.line, "left");
  const today = state === "Today";
  if (today) c.fills = fill(T.marigold);
  if (state === "Hover") c.fills = fill(T.surface);
  if (state === "Selected") { c.fills = fill(T.surfaceHi); c.strokes = fill(T.marigold); c.strokeWeight = 2; c.strokeAlign = "INSIDE"; }
  txt(c, today ? "Sat, today" : "Mon", { s: "SemiBold", size: 13, c: today ? T.onMarigold : T.muted, upper: true, ls: 6, name: "weekday" });
  txt(c, today ? "14" : "9", { f: "Anton", size: 88, c: today ? T.onMarigold : T.text, lh: 100, name: "day" });
  txt(c, today ? "3 events" : "1 event", { s: "SemiBold", size: 13, c: today ? T.onMarigold : T.marigold, name: "events" });
  c.name = `State=${state}`;
  return figma.createComponentFromNode(c);
}
const DayCell = figma.combineAsVariants(["Default","Hover","Selected","Today"].map(dayVariant), holder);
DayCell.name = "DayCell"; DayCell.layoutMode = "HORIZONTAL"; DayCell.itemSpacing = 0; DayCell.fills = fill(T.bg);
DayCell.paddingTop = DayCell.paddingBottom = DayCell.paddingLeft = DayCell.paddingRight = 24;
const day = s => DayCell.children.find(c => c.name === `State=${s}`);

function buildEventRow() {
  const r = box("HORIZONTAL", { gap: 32, p: [24, 0], name: "EventRow" });
  edge(r, T.rule, "bottom");
  holder.appendChild(r); r.resize(820, 100); r.counterAxisSizingMode = "AUTO";
  const tc = add(r, box("VERTICAL", { gap: 2 }), { w: 110 });
  txt(tc, "9:00", { f: "Anton", size: 44, c: T.ink, lh: 100, name: "big" });
  txt(tc, "AM", { s: "SemiBold", size: 13, c: T.inkMuted, name: "small" });
  const m = add(r, box("VERTICAL", { gap: 10 }), { w: "fill" });
  txt(m, "Event title", { s: "Bold", size: 22, lh: 125, w: "fill", name: "title" });
  const meta = add(m, box("HORIZONTAL", { gap: 12, align: "CENTER" }));
  const pill = add(meta, box("HORIZONTAL", { p: [3, 10], r: 999, stroke: T.ink, so: 0.35, name: "Category" }));
  txt(pill, "Academic", { s: "SemiBold", size: 12, c: T.ink, name: "category" });
  meta.appendChild(svgIcon(I.pin, T.inkMuted, 16));
  txt(meta, "Place", { s: "Medium", size: 14, c: T.inkMuted, name: "place" });
  txt(m, "Detail", { size: 15, c: T.inkMuted, lh: 150, w: "fill", name: "detail" });
  rect(r, 180, 120, [imgFill("leaders")], { r: 6, name: "thumb" });
  return figma.createComponentFromNode(r);
}
function buildNewsCard() {
  const c = box("VERTICAL", { gap: 10, name: "NewsCard" });
  holder.appendChild(c); c.resize(400, 100); c.counterAxisSizingMode = "FIXED"; c.primaryAxisSizingMode = "AUTO";
  rect(c, 400, 240, [imgFill("meeting")], { r: 6, name: "photo", fillW: true });
  txt(c, "Headline", { s: "Bold", size: 21, lh: 125, w: "fill", name: "title" });
  const meta = add(c, box("HORIZONTAL", { gap: 10, align: "CENTER" }));
  txt(meta, "Campus", { s: "Bold", size: 13, c: T.amber, name: "kicker" });
  rect(meta, 3, 3, fill(T.inkMuted), { r: 2 });
  txt(meta, "November 10", { size: 13, c: T.inkMuted, name: "date" });
  return figma.createComponentFromNode(c);
}
function buildMobileEventRow() {
  const r = box("HORIZONTAL", { gap: 16, p: [18, 0], name: "EventRow / Mobile" });
  edge(r, T.rule, "bottom");
  holder.appendChild(r); r.resize(358, 100); r.counterAxisSizingMode = "AUTO";
  const tc = add(r, box("VERTICAL", { gap: 0 }), { w: 64 });
  txt(tc, "9:00", { f: "Anton", size: 30, c: T.ink, lh: 100, name: "big" });
  txt(tc, "AM", { s: "SemiBold", size: 12, c: T.inkMuted, name: "small" });
  const m = add(r, box("VERTICAL", { gap: 6 }), { w: "fill" });
  txt(m, "Event title", { s: "Bold", size: 17, lh: 130, w: "fill", name: "title" });
  txt(m, "Place", { s: "Medium", size: 14, c: T.inkMuted, w: "fill", name: "place" });
  return figma.createComponentFromNode(r);
}
const EventRow = buildEventRow(), NewsCard = buildNewsCard(), MEventRow = buildMobileEventRow();
const setT = (i, n, v) => { const t = i.findOne(x => x.type === "TEXT" && x.name === n); if (t) t.characters = v; return t; };
const setImg = (i, n, k) => { const r = i.findOne(x => x.name === n); if (r) r.fills = [imgFill(k)]; };

// ---------- Content ----------
const HERO = {
  title: "Mini job fair for graduating students",
  dek: "Forty employers return to the main grounds for interviews and on-the-spot hiring. Bring copies of your resume and your student ID.",
  when: "Wednesday, November 25, 9 AM to 4 PM", where: "Main grounds",
};
const TODAY_EVENTS = [
  ["9:00","AM","Academic","Intercollegiate debate qualifiers","Audio-visual room","Eight teams compete for two slots in the regional finals.","leaders"],
  ["1:00","PM","Sports","Varsity taekwondo exhibition","Gymnasium","Free entry for students and families.","athletes"],
  ["3:30","PM","Student life","Computer Society general assembly","Computer Lab 3","Officers present plans for the hackathon on November 18.","comsoc"],
];
const UPCOMING = [
  ["16","MON, 8 AM","Community","Blood donation drive","Gymnasium","Walk-ins welcome until 3 PM.","brigada"],
  ["18","WED, 1 PM","Academic","Computer Studies hackathon kickoff","Computer Lab 3","Teams of three. Registration closes Monday.","officials"],
  ["20","FRI, 7:30 AM","Academic","Midterm examinations begin","All colleges","Check the posted schedule for your section.","stakeholders"],
];
const NEWS = [
  ["summit","Campus","ICG summit asks every college to tell its own story","November 12"],
  ["meeting","Campus","PLP and the city sign a scholarship partnership for 500 students","November 10"],
  ["athletes","Sports","Taekwondo team brings home three medals from the city meet","November 7"],
];
const ANN = [["Midterm exam schedule is posted","November 13"],["Library open until 8 PM during exam weeks","November 11"],["Claim lost items at the security office by November 20","November 9"]];
const OTD = [["2025","Computer Society hosts its first city-wide coding bootcamp"],["2024","Nursing students run a free health check day for Pasig residents"],["2023","A new study hall opens on the fourth floor of the main building"]];
const WEEK = [["Mon",9,1],["Tue",10,1],["Wed",11,0],["Thu",12,2],["Fri",13,0],["Sat",14,3],["Sun",15,0]];

// ================= DESKTOP =================
const hero = figma.createFrame(); hero.name = "Hero"; hero.resize(1440, 720);
hero.fills = [imgFill("jobfair"), grad(LR, [[T.bg, 0.95, 0], [T.bg, 0.78, 0.4], [T.bg, 0, 0.74]]), grad(TB, [[T.bg, 0, 0.55], [T.bg, 1, 1]])];
D.appendChild(hero);
{
  const nav = box("HORIZONTAL", { p: [28, 64], justify: "SPACE_BETWEEN", align: "CENTER", name: "Nav" });
  hero.appendChild(nav); nav.resize(1440, 100); nav.counterAxisSizingMode = "AUTO"; nav.x = 0; nav.y = 0;
  const brand = add(nav, box("HORIZONTAL", { gap: 12, align: "CENTER", name: "Brand" }));
  txt(brand, "ICG", { f: "Anton", size: 40, c: T.text, lh: 100 });
  const bt = add(brand, box("VERTICAL", { gap: 1 }));
  txt(bt, "Integrated Communications Group", { s: "SemiBold", size: 12, c: T.text });
  txt(bt, "Pamantasan ng Lungsod ng Pasig", { size: 12, c: T.muted });
  const links = add(nav, box("HORIZONTAL", { gap: 34, align: "CENTER", name: "Links" }));
  ["Home","News","Events","Calendar","Archive","About","Contact"].forEach((x, i) => {
    const it = add(links, box("VERTICAL", { gap: 6, align: "CENTER" }));
    txt(it, x, { s: i === 0 ? "Bold" : "Medium", size: 15, c: T.text });
    rect(it, i === 0 ? 22 : 1, 3, i === 0 ? fill(T.marigold) : []);
  });
  const nr = add(nav, box("HORIZONTAL", { gap: 14, align: "CENTER" }));
  iconButton(nr, "search", T.text, T.text, 44, "Search");
  const login = add(nr, box("HORIZONTAL", { p: [12, 22], r: 999, stroke: T.text, so: 0.5 }));
  txt(login, "Log in", { s: "SemiBold", size: 14, c: T.text });

  const lead = box("VERTICAL", { gap: 22, name: "Lead" });
  hero.appendChild(lead); lead.resize(660, 100); lead.counterAxisSizingMode = "FIXED"; lead.primaryAxisSizingMode = "AUTO"; lead.x = 64; lead.y = 176;
  txt(lead, HERO.title, { f: "Anton", size: 84, c: T.text, upper: true, lh: 96, w: "fill" });
  txt(lead, HERO.dek, { size: 18, c: T.text, lh: 150, w: 560 });
  const meta = add(lead, box("HORIZONTAL", { gap: 24, align: "CENTER", name: "When and where" }));
  for (const [ic, s] of [["clock", HERO.when], ["pin", HERO.where]]) { const m = add(meta, box("HORIZONTAL", { gap: 8, align: "CENTER" })); m.appendChild(svgIcon(I[ic], T.marigold, 18)); txt(m, s, { s: "SemiBold", size: 15, c: T.text }); }
  const ctas = add(lead, box("HORIZONTAL", { gap: 14, align: "CENTER", name: "Actions" }));
  ctas.appendChild(btn("Primary").createInstance());
  ctas.appendChild(btn("Secondary").createInstance());

  const ctl = box("HORIZONTAL", { gap: 16, align: "CENTER", name: "Carousel controls" }); hero.appendChild(ctl); ctl.x = 64; ctl.y = 636;
  iconButton(ctl, "left", T.text, T.text, 44, "Previous story");
  iconButton(ctl, "right", T.text, T.text, 44, "Next story");
  txt(ctl, "1 of 4", { s: "SemiBold", size: 14, c: T.text });
  const bars = add(ctl, box("HORIZONTAL", { gap: 6, align: "CENTER" }));
  [1,0,0,0].forEach(on => rect(bars, 36, 3, fill(on ? T.marigold : T.text, on ? 1 : 0.3), { r: 2 }));
}

// This week strip
{
  const strip = add(D, box("HORIZONTAL", { bg: T.bg, p: [0, 64], name: "This week strip" }), { w: "fill" });
  edge(strip, T.line, "top");
  const lab = add(strip, box("VERTICAL", { gap: 10, p: [26, 28, 26, 0] }), { w: 220 });
  txt(lab, "This week", { f: "Anton", size: 40, c: T.text, upper: true, lh: 100 });
  txt(lab, "November 9 to 15", { size: 14, c: T.muted });
  const wn = add(lab, box("HORIZONTAL", { gap: 8, align: "CENTER" }));
  iconButton(wn, "left", T.text, T.text, 36, "Previous week");
  iconButton(wn, "right", T.text, T.text, 36, "Next week");
  txt(wn, "Calendar", { s: "SemiBold", size: 14, c: T.marigold });
  for (const [wd, d, n] of WEEK) {
    const today = d === 14;
    const i = day(today ? "Today" : "Default").createInstance(); strip.appendChild(i);
    i.layoutSizingHorizontal = "FILL"; i.layoutSizingVertical = "FILL";
    setT(i, "weekday", today ? `${wd}, today` : wd); setT(i, "day", String(d));
    const ev = setT(i, "events", n ? `${n} event${n > 1 ? "s" : ""}` : "No events");
    if (!n && !today) { ev.fills = fill(T.muted); ev.fontName = { family: "Public Sans", style: "Regular" }; }
  }
}

// Body
{
  const body = add(D, box("HORIZONTAL", { bg: T.paper, p: [72, 64, 80, 64], gap: 72, name: "Body" }), { w: "fill" });
  const left = add(body, box("VERTICAL", { gap: 0, name: "Programme" }), { w: "fill" });
  const lh = add(left, box("HORIZONTAL", { justify: "SPACE_BETWEEN", align: "MAX", p: [0, 0, 16, 0] }), { w: "fill" });
  txt(lh, "Saturday, November 14", { f: "Anton", size: 52, upper: true, lh: 100 });
  txt(lh, "3 events today", { s: "SemiBold", size: 15, c: T.inkMuted });
  rect(left, 10, 3, fill(T.ink), { fillW: true });
  const rows = list => { for (const [a,b,cat,t,pl,d,im] of list) { const i = EventRow.createInstance(); left.appendChild(i); i.layoutSizingHorizontal = "FILL"; setT(i,"big",a); setT(i,"small",b); setT(i,"category",cat); setT(i,"title",t); setT(i,"place",pl); setT(i,"detail",d); setImg(i,"thumb",im); } };
  rows(TODAY_EVENTS);
  const up = add(left, box("HORIZONTAL", { p: [56, 0, 14, 0] }), { w: "fill" });
  txt(up, "Coming up", { s: "Bold", size: 28, lh: 120 });
  rect(left, 10, 1, fill(T.ink), { fillW: true });
  rows(UPCOMING);
  const more = add(left, box("HORIZONTAL", { p: [32, 0, 0, 0] }));
  const mb = add(more, box("HORIZONTAL", { r: 999, p: [13, 22], stroke: T.ink, gap: 8, align: "CENTER", name: "Calendar link button" }));
  mb.appendChild(svgIcon(I.cal, T.ink, 18));
  txt(mb, "See the full November calendar", { s: "SemiBold", size: 15 });

  const right = add(body, box("VERTICAL", { gap: 32, name: "Latest news" }), { w: 400 });
  const rh = add(right, box("HORIZONTAL", { justify: "SPACE_BETWEEN", align: "MAX" }), { w: "fill" });
  txt(rh, "Latest news", { s: "Bold", size: 28, lh: 120 });
  txt(rh, "All news", { s: "SemiBold", size: 15, c: T.amber });
  for (const [im,k,t,d] of NEWS) { const i = NewsCard.createInstance(); right.appendChild(i); i.layoutSizingHorizontal = "FILL"; setImg(i,"photo",im); setT(i,"kicker",k); setT(i,"title",t); setT(i,"date",d); }
  const ann = add(right, box("VERTICAL", { bg: T.bg, p: 28, gap: 16, r: 6, name: "Announcements" }), { w: "fill" });
  txt(ann, "Announcements", { s: "Bold", size: 22, c: T.text });
  for (const [t,d] of ANN) { const a = add(ann, box("VERTICAL", { gap: 4, p: [0,0,14,0] }), { w: "fill" }); edge(a, T.line, "bottom"); txt(a, t, { s: "SemiBold", size: 16, c: T.text, lh: 140, w: "fill" }); txt(a, d, { size: 13, c: T.muted }); }
  txt(ann, "All announcements", { s: "SemiBold", size: 14, c: T.marigold });
}

// On this day
{
  const otd = add(D, box("HORIZONTAL", { bg: T.marigold, p: [64, 64], gap: 56, name: "On this day" }), { w: "fill" });
  const ol = add(otd, box("VERTICAL", { gap: 10 }), { w: 300 });
  txt(ol, "On this day", { s: "Bold", size: 32, lh: 115, c: T.onMarigold });
  txt(ol, "What PLP was doing on November 14 in earlier years.", { size: 16, lh: 150, w: "fill", c: T.onMarigold });
  for (const [y,t] of OTD) { const it = add(otd, box("VERTICAL", { gap: 10 }), { w: "fill" }); txt(it, y, { f: "Anton", size: 72, lh: 100, c: T.onMarigold }); txt(it, t, { s: "SemiBold", size: 18, lh: 140, w: "fill", c: T.onMarigold }); }
}

// Footer
function footer(parent, mobile) {
  const f = add(parent, box("VERTICAL", { bg: T.bg, p: mobile ? [40, 16] : [56, 64, 32, 64], gap: mobile ? 32 : 40, name: "Footer" }), { w: "fill" });
  const top = add(f, box(mobile ? "VERTICAL" : "HORIZONTAL", { gap: mobile ? 28 : 64, justify: "SPACE_BETWEEN" }), { w: "fill" });
  const fb = add(top, box("VERTICAL", { gap: 12 }), mobile ? { w: "fill" } : { w: 420 });
  txt(fb, "ICG", { f: "Anton", size: mobile ? 44 : 56, c: T.text });
  txt(fb, "The news and events record of Pamantasan ng Lungsod ng Pasig, published by the Integrated Communications Group.", { size: 15, c: T.muted, lh: 150, w: "fill" });
  for (const [h, items] of [["Sections",["News","Events","Calendar","Archive","About"]],["Visit",["Alcalde Jose Street, Kapasigan, Pasig City","Monday to Friday, 8 AM to 5 PM","Send us a message"]]]) {
    const c = add(top, box("VERTICAL", { gap: 10 }));
    txt(c, h, { s: "Bold", size: 14, c: T.marigold });
    for (const l of items) txt(c, l, { size: 15, c: T.text });
  }
  const bottom = add(f, box(mobile ? "VERTICAL" : "HORIZONTAL", { gap: 12, justify: "SPACE_BETWEEN", p: [20, 0, 0, 0] }), { w: "fill" });
  edge(bottom, T.line, "top");
  txt(bottom, "© 2026 Integrated Communications Group", { size: 13, c: T.muted });
  const soc = add(bottom, box("HORIZONTAL", { gap: 20 }));
  for (const s of ["Facebook","Instagram","Email us"]) txt(soc, s, { s: "SemiBold", size: 13, c: T.text });
}
footer(D, false);

// ================= MOBILE 390 =================
{
  const hm = figma.createFrame(); hm.name = "Hero"; hm.resize(390, 760);
  hm.fills = [imgFill("jobfair"), grad(TB, [[T.bg, 0.55, 0], [T.bg, 0.2, 0.25], [T.bg, 0.92, 0.6], [T.bg, 1, 1]])];
  M.appendChild(hm);
  const bar = box("HORIZONTAL", { p: [12, 8, 12, 16], justify: "SPACE_BETWEEN", align: "CENTER", name: "Top bar" });
  hm.appendChild(bar); bar.resize(390, 68); bar.counterAxisSizingMode = "AUTO"; bar.x = 0; bar.y = 0;
  const b = add(bar, box("HORIZONTAL", { gap: 10, align: "CENTER" }));
  txt(b, "ICG", { f: "Anton", size: 30, c: T.text, lh: 100 });
  const ib = add(bar, box("HORIZONTAL", { gap: 4 }));
  iconButton(ib, "search", T.text, null, 44, "Search");
  iconButton(ib, "menu", T.text, null, 44, "Menu");
  const lead = box("VERTICAL", { gap: 16, name: "Lead" }); hm.appendChild(lead);
  lead.resize(358, 100); lead.counterAxisSizingMode = "FIXED"; lead.primaryAxisSizingMode = "AUTO"; lead.x = 16; lead.y = 230;
  txt(lead, HERO.title, { f: "Anton", size: 46, c: T.text, upper: true, lh: 98, w: "fill" });
  txt(lead, HERO.dek, { size: 16, c: T.text, lh: 150, w: "fill" });
  for (const [ic, s] of [["clock", "Wed, Nov 25, 9 AM to 4 PM"], ["pin", HERO.where]]) { const m = add(lead, box("HORIZONTAL", { gap: 8, align: "CENTER" })); m.appendChild(svgIcon(I[ic], T.marigold, 18)); txt(m, s, { s: "SemiBold", size: 14, c: T.text }); }
  const acts = add(lead, box("VERTICAL", { gap: 10 }), { w: "fill" });
  for (const st of ["Primary","Secondary"]) { const i = btn(st).createInstance(); acts.appendChild(i); i.layoutSizingHorizontal = "FILL"; i.primaryAxisAlignItems = "CENTER"; }
  const pos = box("HORIZONTAL", { gap: 6, align: "CENTER", name: "Carousel position" }); hm.appendChild(pos); pos.x = 16; pos.y = 724;
  [1,0,0,0].forEach(on => rect(pos, on ? 28 : 12, 3, fill(on ? T.marigold : T.text, on ? 1 : 0.3), { r: 2 }));

  const st = add(M, box("VERTICAL", { bg: T.bg, gap: 0, name: "This week strip" }), { w: "fill" });
  const sh = add(st, box("HORIZONTAL", { p: [18, 16, 12, 16], justify: "SPACE_BETWEEN", align: "CENTER" }), { w: "fill" });
  txt(sh, "This week", { f: "Anton", size: 28, c: T.text, upper: true });
  txt(sh, "Calendar", { s: "SemiBold", size: 14, c: T.marigold });
  const row = add(st, box("HORIZONTAL", { gap: 0, name: "Scrollable days" }), { w: "fill" });
  row.clipsContent = true; edge(row, T.line, "top");
  for (const [wd, d, n] of [["Wed",11,0],["Thu",12,2],["Fri",13,0],["Sat",14,3],["Sun",15,0],["Mon",16,1]]) {
    const today = d === 14;
    const c = add(row, box("VERTICAL", { gap: 2, p: [14, 12], bg: today ? T.marigold : null }), { w: 76 });
    edge(c, T.line, "left");
    txt(c, today ? "Today" : wd, { s: "SemiBold", size: 12, c: today ? T.onMarigold : T.muted, upper: true, ls: 4 });
    txt(c, String(d), { f: "Anton", size: 44, c: today ? T.onMarigold : T.text, lh: 100 });
    const dots = add(c, box("HORIZONTAL", { gap: 4 })); for (let k = 0; k < n; k++) { const e = figma.createEllipse(); e.resize(6, 6); e.fills = fill(today ? T.onMarigold : T.marigold); dots.appendChild(e); }
    if (!n) { const e = figma.createEllipse(); e.resize(6, 6); e.fills = []; dots.appendChild(e); }
  }

  const sec = (name, p = [36, 16, 8, 16]) => add(M, box("VERTICAL", { p, gap: 0, name }), { w: "fill" });
  const td = sec("Today");
  txt(td, "Saturday, November 14", { f: "Anton", size: 30, upper: true, lh: 105, w: "fill" });
  const r1 = rect(td, 10, 3, fill(T.ink), { fillW: true }); r1.name = "rule";
  for (const [a,b,,t,pl] of TODAY_EVENTS) { const i = MEventRow.createInstance(); td.appendChild(i); i.layoutSizingHorizontal = "FILL"; setT(i,"big",a); setT(i,"small",b); setT(i,"title",t); setT(i,"place",pl); }
  const cu = sec("Coming up", [32, 16, 8, 16]);
  txt(cu, "Coming up", { s: "Bold", size: 22, lh: 120 });
  for (const [a,b,,t,pl] of UPCOMING) { const i = MEventRow.createInstance(); cu.appendChild(i); i.layoutSizingHorizontal = "FILL"; setT(i,"big",a); setT(i,"small",b); setT(i,"title",t); setT(i,"place",pl); }
  const cb = add(cu, box("HORIZONTAL", { p: [20, 0, 0, 0] }), { w: "fill" });
  const cbb = add(cb, box("HORIZONTAL", { r: 999, p: [14, 20], stroke: T.ink, gap: 8, align: "CENTER", justify: "CENTER" }), { w: "fill" });
  cbb.appendChild(svgIcon(I.cal, T.ink, 18)); txt(cbb, "See the full calendar", { s: "SemiBold", size: 15 });

  const ln = sec("Latest news", [40, 16, 8, 16]); ln.itemSpacing = 28;
  txt(ln, "Latest news", { s: "Bold", size: 22, lh: 120 });
  for (const [im,k,t,d] of NEWS) { const i = NewsCard.createInstance(); ln.appendChild(i); i.layoutSizingHorizontal = "FILL"; setImg(i,"photo",im); setT(i,"kicker",k); setT(i,"title",t); setT(i,"date",d); }
  const an = sec("Announcements", [32, 16, 40, 16]);
  const ab = add(an, box("VERTICAL", { bg: T.bg, p: 22, gap: 14, r: 6 }), { w: "fill" });
  txt(ab, "Announcements", { s: "Bold", size: 20, c: T.text });
  for (const [t,d] of ANN) { const a = add(ab, box("VERTICAL", { gap: 4, p: [0,0,12,0] }), { w: "fill" }); edge(a, T.line, "bottom"); txt(a, t, { s: "SemiBold", size: 15, c: T.text, lh: 140, w: "fill" }); txt(a, d, { size: 13, c: T.muted }); }

  const o = add(M, box("VERTICAL", { bg: T.marigold, p: [40, 16], gap: 24, name: "On this day" }), { w: "fill" });
  txt(o, "On this day", { s: "Bold", size: 24, c: T.onMarigold });
  for (const [y,t] of OTD) { const it = add(o, box("VERTICAL", { gap: 4 }), { w: "fill" }); txt(it, y, { f: "Anton", size: 44, lh: 100, c: T.onMarigold }); txt(it, t, { s: "SemiBold", size: 16, lh: 140, w: "fill", c: T.onMarigold }); }
  footer(M, true);
}

// ---------- Notes ----------
const title = figma.createText(); title.fontName = { family: "Inter", style: "Bold" }; title.fontSize = 40; title.characters = "Home v2 — polish pass"; title.x = OX + 1440 + 160 + 390 + 120; title.y = OY; page.appendChild(title);
const notes = figma.createText(); notes.fontName = { family: "Inter", style: "Regular" }; notes.fontSize = 18; notes.lineHeight = { unit: "PERCENT", value: 150 };
notes.characters = [
  "What changed from Home — final (and why):",
  "",
  "1. Hero features an UPCOMING event (Nov 25 mini job fair).",
  "   The old hero promoted a past event (May 11) with 'Add to calendar'.",
  "2. Labels moved below headings. No eyebrow above a title",
  "   (hero, event rows, news cards). Category + place/date sit under the title.",
  "3. Anton is reserved for the loud moments: hero headline, day numerals,",
  "   today's date, event times, past years. Section titles are Public Sans Bold.",
  "4. Carousel has real controls: previous/next (44 px) and '1 of 4'.",
  "5. Week strip can move: previous/next week buttons.",
  "6. Category pills are neutral outlines, so marigold keeps one meaning:",
  "   today and the main action.",
  "7. States drawn as variants: Button (default, hover, focus, disabled)",
  "   and DayCell (default, hover, selected, today).",
  "8. Mobile 390 frame added: menu + search as 44 px targets, swipeable",
  "   day strip with today in view, stacked full-width buttons.",
  "9. Footer gets a copyright and social row.",
  "",
  "Color rules: marigold never as text on paper (1.7:1). Amber #8A5A00",
  "for links on paper (5.4:1). Midnight text on marigold is 10:1.",
].join("\n");
notes.x = title.x; notes.y = OY + 70; notes.resize(620, notes.height); notes.textAutoResize = "HEIGHT"; page.appendChild(notes);

figma.currentPage.selection = [D, M];
figma.viewport.scrollAndZoomIntoView([D, M]);
