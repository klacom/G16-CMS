// ICG — Home (final direction) — Figma Plugin API script
//
// Chosen: Variant A layout ("Green Pulse" structure) + Hero 1 "Cinematic" without the
// story-card row + palette "Midnight & Marigold". Fonts: Anton + Public Sans.
//
// Run: open the ICG-Rebranding file > Plugins > Scripter > paste this file > Run.
// It draws on the page you currently have open, to the right of anything already
// there, so nothing existing is moved or covered. No new page is created.
// Photos reuse image fills already in the file.

const page = figma.currentPage;
// Start to the right of whatever is already on this page, aligned with its top.
let OX = 0, OY = 0;
if (page.children.length) {
  OX = Math.max(...page.children.map(n => n.x + n.width)) + 300;
  OY = Math.min(...page.children.map(n => n.y)) + 800; // leaves room above for the components row
}
await Promise.all([["Anton","Regular"],["Public Sans","Regular"],["Public Sans","Medium"],["Public Sans","SemiBold"],["Public Sans","Bold"],["Inter","Bold"],["Inter","Regular"]].map(([family, style]) => figma.loadFontAsync({ family, style })));

// ---------- Tokens (Midnight & Marigold) ----------
const T = {
  bg: "#0c1422",        // midnight: hero, strip, footer
  surface: "#16233a",   // cards and panels on dark
  line: "#25344f",      // dividers on dark
  marigold: "#f5b335",  // accent ON DARK and as fills only (1.7:1 on paper: never text there)
  onMarigold: "#1a1206",
  text: "#f6f1e7",      // text on dark (16.4:1)
  muted: "#9aa6bd",     // secondary text on dark (7.5:1)
  paper: "#f7f4ee",     // light body background
  ink: "#0c1422",       // text on paper (16.8:1)
  inkMuted: "#5b6475",  // secondary text on paper (5.4:1)
  amber: "#8a5a00",     // accent text/links on paper (5.4:1)
  rule: "#ddd7cc",      // dividers on paper
};

const hex = h => ({ r: parseInt(h.slice(1,3),16)/255, g: parseInt(h.slice(3,5),16)/255, b: parseInt(h.slice(5,7),16)/255 });
const fill = (h, o) => [{ type: "SOLID", color: hex(h), ...(o != null ? { opacity: o } : {}) }];
const rgba = (h, a) => ({ ...hex(h), a });
const LR = [[1,0,0],[0,1,0]], TB = [[0,1,0],[-1,0,1]];
const grad = (t, stops) => ({ type: "GRADIENT_LINEAR", gradientTransform: t, gradientStops: stops.map(([c,a,p]) => ({ color: rgba(c,a), position: p })) });
const IMG = { summit:"ea38dac14bbb7954e190c80d3c4d81adb7175dc6", officials:"d8ae3861374c97e5eebc9f095d26b1033f8d3e61", meeting:"55c1f10123a907c959188894b84b9a57f265af8f", stakeholders:"131a99766a6a637e61fca14c274d52a64774fd04", brigada:"3ed80841019c1ff4a269b29417f2ad00238b759d", leaders:"23767ad3ffc9631b4a09a372851b6afd876f6e0a", athletes:"54740ede896e8d9a0b2be7b1d42f2d52ef681192", comsoc:"e7fc3e0d5befd7ed000273bf2e5f0e671fb6bb6e", jobfair:"4b59b03cfef417782d8fe486f174ecd1ee10f891" };
const imgFill = k => ({ type: "IMAGE", imageHash: IMG[k], scaleMode: "FILL" });

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
function edge(f, color, side) { f.strokes = fill(color); f.strokeTopWeight = side === "top" ? 1 : 0; f.strokeBottomWeight = side === "bottom" ? 1 : 0; f.strokeLeftWeight = side === "left" ? 1 : 0; f.strokeRightWeight = 0; }
const icon = (svg, size) => { const n = figma.createNodeFromSvg(svg); n.resize(size, size); n.name = "icon"; return n; };
const searchSvg = c => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="${c}" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`;
const calSvg = c => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="16" rx="2" stroke="${c}" stroke-width="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`;

// ---------- Page wrapper ----------
const W = AL("VERTICAL");
W.name = "Home — Desktop 1440"; W.resize(1440, 100); W.primaryAxisSizingMode = "AUTO"; W.counterAxisSizingMode = "FIXED";
W.fills = fill(T.paper); W.itemSpacing = 0; W.clipsContent = true; W.x = OX; W.y = OY;
page.appendChild(W);

// ---------- Components ----------
const holder = box("HORIZONTAL", { gap: 40, p: 40, bg: "#ffffff", name: "Components" });
page.appendChild(holder); holder.x = OX; holder.y = OY - 700;

function buildEventRow() {
  const r = box("HORIZONTAL", { gap: 32, p: [24, 0], name: "EventRow" });
  edge(r, T.rule, "bottom");
  holder.appendChild(r); r.resize(820, 100); r.counterAxisSizingMode = "AUTO";
  const tc = add(r, box("VERTICAL", { gap: 2 }), { w: 110 });
  txt(tc, "9:00", { f: "Anton", size: 44, c: T.ink, lh: 100, name: "big" });
  txt(tc, "AM", { s: "SemiBold", size: 13, c: T.inkMuted, name: "small" });
  const m = add(r, box("VERTICAL", { gap: 8 }), { w: "fill" });
  const pill = add(m, box("HORIZONTAL", { p: [4, 10], r: 999, bg: T.marigold, name: "Category" }));
  txt(pill, "Academic", { s: "SemiBold", size: 12, c: T.onMarigold, name: "category" });
  txt(m, "Event title", { s: "Bold", size: 22, lh: 125, w: "fill", name: "title" });
  txt(m, "Place and detail", { size: 15, c: T.inkMuted, lh: 145, w: "fill", name: "detail" });
  rect(r, 180, 120, [imgFill("leaders")], { r: 6, name: "thumb" });
  return figma.createComponentFromNode(r);
}
function buildNewsCard() {
  const c = box("VERTICAL", { gap: 10, name: "NewsCard" });
  holder.appendChild(c); c.resize(400, 100); c.counterAxisSizingMode = "FIXED"; c.primaryAxisSizingMode = "AUTO";
  rect(c, 400, 240, [imgFill("meeting")], { r: 6, name: "photo", fillW: true });
  txt(c, "Campus", { s: "Bold", size: 13, c: T.amber, name: "kicker" });
  txt(c, "Headline", { s: "Bold", size: 21, lh: 125, w: "fill", name: "title" });
  txt(c, "November 10", { size: 13, c: T.inkMuted, name: "date" });
  return figma.createComponentFromNode(c);
}
function buildDayCell() {
  const c = box("VERTICAL", { gap: 4, p: [24, 18], name: "DayCell" });
  edge(c, T.line, "left");
  holder.appendChild(c); c.resize(150, 100); c.counterAxisSizingMode = "FIXED"; c.primaryAxisSizingMode = "AUTO";
  txt(c, "Mon", { s: "SemiBold", size: 13, c: T.muted, upper: true, ls: 6, name: "weekday" });
  txt(c, "9", { f: "Anton", size: 88, c: T.text, lh: 100, name: "day" });
  txt(c, "1 event", { s: "SemiBold", size: 13, c: T.marigold, name: "events" });
  return figma.createComponentFromNode(c);
}
const EventRow = buildEventRow(), NewsCard = buildNewsCard(), DayCell = buildDayCell();
const setT = (i, n, v) => { const t = i.findOne(x => x.type === "TEXT" && x.name === n); if (t) t.characters = v; return t; };
const setImg = (i, n, k) => { const r = i.findOne(x => x.name === n); if (r) r.fills = [imgFill(k)]; };

// ---------- Hero (Cinematic, no card row) ----------
const hero = figma.createFrame(); hero.name = "Hero"; hero.resize(1440, 720);
hero.fills = [imgFill("jobfair"), grad(LR, [[T.bg, 0.95, 0], [T.bg, 0.75, 0.38], [T.bg, 0, 0.72]]), grad(TB, [[T.bg, 0, 0.55], [T.bg, 1, 1]])];
W.appendChild(hero);

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
const nr = add(nav, box("HORIZONTAL", { gap: 22, align: "CENTER" }));
nr.appendChild(icon(searchSvg(T.text), 20));
const login = add(nr, box("HORIZONTAL", { p: [10, 20], r: 999, stroke: T.text, so: 0.5 }));
txt(login, "Log in", { s: "SemiBold", size: 14, c: T.text });

const lead = box("VERTICAL", { gap: 20, name: "Lead text" });
hero.appendChild(lead); lead.resize(660, 100); lead.counterAxisSizingMode = "FIXED"; lead.primaryAxisSizingMode = "AUTO"; lead.x = 64; lead.y = 190;
const meta = add(lead, box("HORIZONTAL", { gap: 14, align: "CENTER" }));
txt(meta, "Featured event", { s: "Bold", size: 14, c: T.marigold });
txt(meta, "May 11, 2026", { s: "Medium", size: 14, c: T.text });
txt(meta, "PLP campus", { size: 14, c: T.muted });
txt(lead, "PLP Job Fair connects 1,200 graduates with 40 employers", { f: "Anton", size: 80, c: T.text, upper: true, lh: 98, w: "fill" });
txt(lead, "Students lined up from 8 AM for interviews, career talks and on-the-spot hiring at the auditorium and facade area.", { size: 18, c: T.text, lh: 150, w: 560 });
const ctas = add(lead, box("HORIZONTAL", { gap: 14, align: "CENTER" }));
const b1 = add(ctas, box("HORIZONTAL", { bg: T.marigold, r: 999, p: [15, 30], name: "Primary button" }));
txt(b1, "Read the story", { s: "Bold", size: 15, c: T.onMarigold });
const b2 = add(ctas, box("HORIZONTAL", { r: 999, p: [14, 22], gap: 8, align: "CENTER", stroke: T.text, so: 0.6, name: "Secondary button" }));
b2.appendChild(icon(calSvg(T.text), 18));
txt(b2, "Add to calendar", { s: "SemiBold", size: 15, c: T.text });
const dots = box("HORIZONTAL", { gap: 8, align: "CENTER", name: "Slide indicator" }); hero.appendChild(dots); dots.x = 64; dots.y = 660;
[40, 12, 12, 12].forEach((w, i) => rect(dots, w, 4, fill(i === 0 ? T.marigold : T.text, i === 0 ? 1 : 0.35), { r: 2 }));

// ---------- This week strip ----------
const strip = add(W, box("HORIZONTAL", { bg: T.bg, p: [0, 64], name: "This week strip" }), { w: "fill" });
edge(strip, T.line, "top");
const lab = add(strip, box("VERTICAL", { gap: 8, p: [28, 28, 28, 0] }), { w: 210 });
txt(lab, "This week", { f: "Anton", size: 40, c: T.text, upper: true, lh: 100 });
txt(lab, "November 9 to 15", { size: 14, c: T.muted });
txt(lab, "Open the calendar", { s: "SemiBold", size: 14, c: T.marigold });
for (const [wd, d, n] of [["Mon",9,1],["Tue",10,1],["Wed",11,0],["Thu",12,2],["Fri",13,0],["Sat",14,3],["Sun",15,0]]) {
  const today = d === 14;
  const i = DayCell.createInstance(); strip.appendChild(i);
  i.layoutSizingHorizontal = "FILL"; i.layoutSizingVertical = "FILL";
  setT(i, "weekday", today ? `${wd}, today` : wd);
  setT(i, "day", String(d));
  const ev = setT(i, "events", n ? `${n} event${n > 1 ? "s" : ""}` : "No events");
  if (!n) { ev.fills = fill(T.muted); ev.fontName = { family: "Public Sans", style: "Regular" }; }
  if (today) {
    i.fills = fill(T.marigold);
    for (const t of i.findAll(x => x.type === "TEXT")) t.fills = fill(T.onMarigold);
  }
}

// ---------- Body ----------
const body = add(W, box("HORIZONTAL", { bg: T.paper, p: [64, 64, 72, 64], gap: 64, name: "Body" }), { w: "fill" });
const left = add(body, box("VERTICAL", { gap: 0, name: "Programme" }), { w: "fill" });
const lh = add(left, box("HORIZONTAL", { justify: "SPACE_BETWEEN", align: "MAX", p: [0, 0, 16, 0] }), { w: "fill" });
txt(lh, "Saturday, November 14", { f: "Anton", size: 52, upper: true, lh: 100 });
txt(lh, "All November events", { s: "SemiBold", size: 15, c: T.amber });
rect(left, 10, 4, fill(T.ink), { fillW: true });
const rows = (list) => { for (const [a,b,cat,t,d,im] of list) { const i = EventRow.createInstance(); left.appendChild(i); i.layoutSizingHorizontal = "FILL"; setT(i,"big",a); setT(i,"small",b); setT(i,"category",cat); setT(i,"title",t); setT(i,"detail",d); setImg(i,"thumb",im); } };
rows([
  ["9:00","AM","Academic","Intercollegiate debate qualifiers","Audio-visual room. Eight teams compete for two slots in the regional finals.","leaders"],
  ["1:00","PM","Sports","Varsity taekwondo exhibition","Gymnasium. Free entry for students and families.","athletes"],
  ["3:30","PM","Student life","Computer Society general assembly","Computer Lab 3. Officers present plans for the hackathon on November 18.","comsoc"],
]);
const up = add(left, box("HORIZONTAL", { p: [48, 0, 12, 0] }), { w: "fill" });
txt(up, "Coming up", { f: "Anton", size: 36, upper: true });
rect(left, 10, 2, fill(T.ink), { fillW: true });
rows([
  ["16","MON, 8 AM","Community","Blood donation drive","Gymnasium. Walk-ins welcome until 3 PM.","brigada"],
  ["18","WED, 1 PM","Academic","Computer Studies hackathon kickoff","Computer Lab 3. Teams of three, registration closes Monday.","officials"],
  ["20","FRI, 7:30 AM","Academic","Midterm examinations begin","All colleges. Check the posted schedule for your section.","stakeholders"],
]);
const more = add(left, box("HORIZONTAL", { p: [28, 0, 0, 0] }));
const mb = add(more, box("HORIZONTAL", { r: 999, p: [12, 22], stroke: T.ink, gap: 8, align: "CENTER", name: "See calendar button" }));
mb.appendChild(icon(calSvg(T.ink), 18));
txt(mb, "See the full November calendar", { s: "SemiBold", size: 15 });

const right = add(body, box("VERTICAL", { gap: 28, name: "Latest news" }), { w: 400 });
txt(right, "Latest news", { f: "Anton", size: 44, upper: true, lh: 100 });
for (const [im,k,t,d] of [
  ["summit","Campus","ICG summit asks every college to tell its own story","November 12"],
  ["meeting","Campus","PLP and the city sign a scholarship partnership for 500 students","November 10"],
  ["athletes","Sports","Taekwondo team brings home three medals from the city meet","November 7"],
]) { const i = NewsCard.createInstance(); right.appendChild(i); i.layoutSizingHorizontal = "FILL"; setImg(i,"photo",im); setT(i,"kicker",k); setT(i,"title",t); setT(i,"date",d); }
const ann = add(right, box("VERTICAL", { bg: T.bg, p: 28, gap: 16, r: 6, name: "Announcements" }), { w: "fill" });
txt(ann, "Announcements", { f: "Anton", size: 30, c: T.text, upper: true });
for (const [t,d] of [["Midterm exam schedule is posted","November 13"],["Library open until 8 PM during exam weeks","November 11"],["Claim lost items at the security office by November 20","November 9"]]) {
  const a = add(ann, box("VERTICAL", { gap: 4, p: [0,0,14,0] }), { w: "fill" });
  edge(a, T.line, "bottom");
  txt(a, t, { s: "SemiBold", size: 16, c: T.text, lh: 140, w: "fill" });
  txt(a, d, { size: 13, c: T.muted });
}
txt(ann, "All announcements", { s: "SemiBold", size: 14, c: T.marigold });

// ---------- On this day ----------
const otd = add(W, box("HORIZONTAL", { bg: T.marigold, p: [56, 64], gap: 56, name: "On this day" }), { w: "fill" });
const ol = add(otd, box("VERTICAL", { gap: 8 }), { w: 300 });
txt(ol, "On this day", { f: "Anton", size: 56, upper: true, lh: 100, c: T.onMarigold });
txt(ol, "What PLP was doing on November 14 in earlier years.", { size: 16, lh: 150, w: "fill", c: T.onMarigold });
for (const [y,t] of [["2025","Computer Society hosts its first city-wide coding bootcamp"],["2024","Nursing students run a free health check day for Pasig residents"],["2023","A new study hall opens on the fourth floor of the main building"]]) {
  const it = add(otd, box("VERTICAL", { gap: 10 }), { w: "fill" });
  txt(it, y, { f: "Anton", size: 72, lh: 100, c: T.onMarigold });
  txt(it, t, { s: "SemiBold", size: 18, lh: 140, w: "fill", c: T.onMarigold });
}

// ---------- Footer ----------
const foot = add(W, box("HORIZONTAL", { bg: T.bg, p: [56, 64], gap: 64, justify: "SPACE_BETWEEN", name: "Footer" }), { w: "fill" });
const fb = add(foot, box("VERTICAL", { gap: 12 }), { w: 420 });
txt(fb, "ICG", { f: "Anton", size: 56, c: T.text });
txt(fb, "The news and events record of Pamantasan ng Lungsod ng Pasig, published by the Integrated Communications Group.", { size: 15, c: T.muted, lh: 150, w: "fill" });
for (const [h, items] of [["Sections",["News","Events","Calendar","Archive","About"]],["Visit",["Alcalde Jose Street, Kapasigan, Pasig City","Monday to Friday, 8 AM to 5 PM","Send us a message"]]]) {
  const c = add(foot, box("VERTICAL", { gap: 10 }));
  txt(c, h, { s: "Bold", size: 14, c: T.marigold });
  for (const l of items) txt(c, l, { size: 15, c: T.text });
}

// ---------- Title + notes above the page ----------
const title = figma.createText(); title.fontName = { family: "Inter", style: "Bold" }; title.fontSize = 40; title.characters = "Home — final direction"; title.x = OX + 1540; title.y = OY; page.appendChild(title);
const notes = figma.createText(); notes.fontName = { family: "Inter", style: "Regular" }; notes.fontSize = 18; notes.lineHeight = { unit: "PERCENT", value: 150 };
notes.characters = [
  "Layout: Variant A. Hero: Cinematic, without the story-card row.",
  "Palette: Midnight & Marigold. Fonts: Anton (display) + Public Sans (text).",
  "",
  "Color rules:",
  "• Marigold #F5B335 only on midnight or as a fill (buttons, today, pills).",
  "  It is 1.7:1 on the paper background, so never use it as text there.",
  "• Links and labels on paper use amber #8A5A00 (5.4:1).",
  "• Midnight #0C1422 text on marigold is 10:1.",
  "",
  "Components (above the page): EventRow, NewsCard, DayCell.",
].join("\n");
notes.x = OX + 1540; notes.y = OY + 70; notes.resize(560, notes.height); notes.textAutoResize = "HEIGHT"; page.appendChild(notes);

figma.currentPage.selection = [W];
figma.viewport.scrollAndZoomIntoView([W]);
