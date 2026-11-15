"""Regenerate .impeccable/design.json from DESIGN.md.

Usage: python -I design/tools/gen_sidecar.py <repo-root>
Run after every DESIGN.md change. New colors need a display name in `names` below.
"""
import json, colorsys, re, sys, os

root = sys.argv[1]
md = open(os.path.join(root, 'DESIGN.md'), encoding='utf-8').read()
fm = md.split('---')[1]
colors = dict(re.findall(r'^  ([a-z0-9-]+): "(#[0-9a-f]{6})"$', fm.split('typography:')[0], re.M))
names = {
    "night": ("neutral", "Evergreen Night"), "night-end": ("neutral", "Forest"), "surface": ("neutral", "Night Surface"), "surface-raised": ("neutral", "Raised Night"),
    "line": ("neutral", "Night Line"), "text-on-dark": ("neutral", "Marquee White"), "muted-on-dark": ("neutral", "Night Muted"),
    "marigold": ("primary", "Marquee Marigold"), "marigold-bright": ("primary", "Lit Marigold"), "on-marigold": ("primary", "Lamp Black"),
    "paper": ("neutral", "Sage Mist"), "card": ("neutral", "Card White"), "card-hover": ("neutral", "Card Hover"), "ink": ("neutral", "Ink"),
    "ink-muted": ("neutral", "Ink Muted"), "ink-faint": ("neutral", "Ink Faint"), "amber": ("primary", "Amber Ink"), "rule": ("neutral", "Mist Rule"),
    "error": ("status", "Error Red"), "error-soft": ("status", "Error Wash"),
    "disabled-bg": ("neutral", "Disabled Background"), "disabled-text": ("neutral", "Disabled Text"),
}

def ramp(h):
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    hu, l, s = colorsys.rgb_to_hls(r, g, b)
    out = []
    for k in range(8):
        L = 0.15 + k * (0.80 / 7)
        S = s * (1 - abs(L - 0.5) * 0.9)
        rr, gg, bb = colorsys.hls_to_rgb(hu, L, S)
        out.append('#%02x%02x%02x' % (round(rr * 255), round(gg * 255), round(bb * 255)))
    return out

colorMeta = {k: {"role": names[k][0], "displayName": names[k][1], "canonical": v, "tonalRamp": ramp(v)} for k, v in colors.items()}

def section_of(name):
    i = md.find('**' + name)
    h = md.rfind('\n## ', 0, i)
    return md[h + 4: md.find('\n', h + 4)].split(' ')[0].lower()

rules = [{"name": m.group(1), "body": m.group(2), "section": section_of(m.group(1))}
         for m in re.finditer(r'\*\*(The [^*]+ Rule)\.\*\* ([^\n]+)', md)]
strip_bold = lambda s: s.replace('**', '')
dos = [strip_bold(l[2:]) for l in md.split('### Do:')[1].split("### Don't:")[0].strip().splitlines() if l.startswith('- ')]
donts = [strip_bold(l[2:]) for l in md.split("### Don't:")[1].strip().splitlines() if l.startswith('- ')]
ov = md.split('## Overview')[1].split('**Key Characteristics:**')[0]
overview = '\n\n'.join(p.strip() for p in ov.split('\n\n') if p.strip() and not p.strip().startswith('**Creative'))
keys = [l[2:] for l in md.split('**Key Characteristics:**')[1].split('## Colors')[0].strip().splitlines() if l.startswith('- ')]

PS = "'Public Sans',system-ui,sans-serif"
AN = "Anton,'Arial Narrow',sans-serif"
components = [
    {"name": "Primary Button", "kind": "button", "refersTo": "button-primary",
     "description": "The one main action per view: marigold pill.",
     "html": '<button class="ds-btn-primary">See event details</button>',
     "css": ".ds-btn-primary{height:48px;padding:0 28px;border:0;border-radius:999px;background:var(--color-marigold);color:var(--color-on-marigold);font:700 15px/1 " + PS + ";cursor:pointer;transition:background-color 150ms ease}.ds-btn-primary:hover{background:var(--color-marigold-bright)}.ds-btn-primary:focus-visible{outline:2px solid var(--color-ink);outline-offset:3px}.ds-btn-primary:disabled{background:var(--color-disabled-bg);color:var(--color-disabled-text);cursor:not-allowed}"},
    {"name": "Secondary Button (night)", "kind": "button", "refersTo": "button-secondary-night",
     "description": "Second action on night surfaces, usually with an icon.",
     "html": '<div class="ds-night"><button class="ds-btn-night"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>Add to calendar</button></div>',
     "css": ".ds-night{background:var(--color-midnight);padding:24px}.ds-btn-night{display:inline-flex;align-items:center;gap:8px;height:48px;padding:0 24px;border-radius:999px;border:1px solid rgba(246,241,231,.6);background:transparent;color:var(--color-text-on-dark);font:700 15px/1 " + PS + ";cursor:pointer;transition:background-color 150ms ease}.ds-btn-night:hover{background:rgba(246,241,231,.08)}.ds-btn-night:focus-visible{outline:2px solid var(--color-marigold);outline-offset:3px}"},
    {"name": "Secondary Button (day)", "kind": "button", "refersTo": "button-secondary-day",
     "description": "Second action on day surfaces; fills ink on hover.",
     "html": '<button class="ds-btn-day">See the full November calendar</button>',
     "css": ".ds-btn-day{height:48px;padding:0 22px;border-radius:999px;border:1px solid var(--color-ink);background:transparent;color:var(--color-ink);font:600 15px/1 " + PS + ";cursor:pointer;transition:background-color 150ms ease,color 150ms ease}.ds-btn-day:hover{background:var(--color-ink);color:var(--color-paper)}.ds-btn-day:focus-visible{outline:2px solid var(--color-ink);outline-offset:3px}"},
    {"name": "Filter Chips", "kind": "chip", "refersTo": "filter-chip",
     "description": "Category filters on night surfaces; selected is marigold.",
     "html": '<div class="ds-night ds-chips"><button class="ds-chip" aria-pressed="true">All</button><button class="ds-chip" aria-pressed="false">Academic</button><button class="ds-chip" aria-pressed="false">Sports</button></div>',
     "css": ".ds-night{background:var(--color-midnight);padding:24px}.ds-chips{display:flex;gap:8px}.ds-chip{height:40px;padding:0 16px;border-radius:999px;border:1px solid rgba(246,241,231,.35);background:transparent;color:var(--color-text-on-dark);font:600 14px/1 " + PS + ";cursor:pointer}.ds-chip:hover{background:var(--color-surface)}.ds-chip[aria-pressed=\"true\"]{background:var(--color-marigold);border-color:var(--color-marigold);color:var(--color-on-marigold)}.ds-chip:focus-visible{outline:2px solid var(--color-marigold);outline-offset:3px}"},
    {"name": "This Week Strip", "kind": "custom", "refersTo": "day-cell",
     "description": "Signature element: big Anton numerals, today in marigold.",
     "html": '<div class="ds-strip"><button class="ds-day"><span class="ds-wd">Fri</span><span class="ds-num">13</span><span class="ds-ev ds-none">No events</span></button><button class="ds-day ds-today"><span class="ds-wd">Today</span><span class="ds-num">14</span><span class="ds-ev">3 events</span></button><button class="ds-day" aria-pressed="true"><span class="ds-wd">Sun</span><span class="ds-num">15</span><span class="ds-ev">1 event</span></button></div>',
     "css": ".ds-strip{display:flex;background:var(--color-midnight)}.ds-day{display:flex;flex-direction:column;align-items:flex-start;gap:4px;width:150px;padding:24px 18px;border:0;border-left:1px solid var(--color-line);background:transparent;color:var(--color-text-on-dark);text-align:left;cursor:pointer;transition:background-color 150ms ease}.ds-day:hover{background:var(--color-surface)}.ds-day[aria-pressed=\"true\"]{background:var(--color-surface-raised);box-shadow:inset 0 0 0 2px var(--color-marigold)}.ds-wd{font:600 13px/1.3 " + PS + ";letter-spacing:.06em;text-transform:uppercase;color:var(--color-muted-on-dark)}.ds-num{font:400 88px/.96 " + AN + "}.ds-ev{font:600 13px/1.3 " + PS + ";color:var(--color-marigold)}.ds-ev.ds-none{font-weight:400;color:var(--color-muted-on-dark)}.ds-today,.ds-today:hover{background:var(--color-marigold);color:var(--color-on-marigold)}.ds-today .ds-wd,.ds-today .ds-ev{color:var(--color-on-marigold)}.ds-day:focus-visible{outline:2px solid var(--color-marigold);outline-offset:-4px}"},
    {"name": "Event Row", "kind": "custom", "refersTo": "calendar-cell",
     "description": "One event in a list: Anton time, title, category pill and place.",
     "html": '<a class="ds-row" href="#"><span><span class="ds-time">9:00</span><span class="ds-ampm">AM</span></span><span><span class="ds-title">Intercollegiate debate qualifiers</span><span class="ds-meta"><span class="ds-pill">Academic</span><span>Audio-visual room</span></span></span></a>',
     "css": ".ds-row{display:grid;grid-template-columns:110px 1fr;gap:32px;padding:24px 0;border-bottom:1px solid var(--color-rule);color:var(--color-ink);text-decoration:none;background:var(--color-paper)}.ds-time{display:block;font:400 44px/.96 " + AN + "}.ds-ampm{display:block;margin-top:4px;font:600 13px/1 " + PS + ";color:var(--color-ink-muted)}.ds-title{display:block;font:700 22px/1.3 " + PS + "}.ds-row:hover .ds-title{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}.ds-meta{display:flex;gap:12px;align-items:center;margin-top:8px;font:500 14px/1.4 " + PS + ";color:var(--color-ink-muted)}.ds-pill{padding:2px 10px;border:1px solid rgba(12,20,34,.3);border-radius:999px;font-size:12px;font-weight:600;color:var(--color-ink)}.ds-row:focus-visible{outline:2px solid var(--color-ink);outline-offset:3px}"},
    {"name": "News Card", "kind": "card", "refersTo": "panel-day",
     "description": "Photo, title, then category and date below the title.",
     "html": '<a class="ds-news" href="#"><span class="ds-photo"></span><span class="ds-ntitle">PLP and the city sign a scholarship partnership for 500 students</span><span class="ds-nmeta"><b>Campus</b><i></i>November 10</span></a>',
     "css": ".ds-news{display:block;width:400px;color:var(--color-ink);text-decoration:none}.ds-photo{display:block;aspect-ratio:5/3;border-radius:6px;background:var(--color-rule)}.ds-ntitle{display:block;margin-top:12px;font:700 21px/1.3 " + PS + "}.ds-news:hover .ds-ntitle{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}.ds-nmeta{display:flex;align-items:center;gap:10px;margin-top:8px;font:400 13px/1 " + PS + ";color:var(--color-ink-muted)}.ds-nmeta b{color:var(--color-amber)}.ds-nmeta i{width:3px;height:3px;border-radius:50%;background:var(--color-ink-muted)}.ds-news:focus-visible{outline:2px solid var(--color-ink);outline-offset:3px}"},
    {"name": "Site Header", "kind": "nav", "refersTo": "panel-night",
     "description": "Midnight header with Anton wordmark, nav and a marigold current-page bar.",
     "html": '<header class="ds-header"><span class="ds-mark">ICG</span><nav><a href="#" aria-current="page">Home</a><a href="#">News</a><a href="#">Calendar</a><a href="#">Archive</a></nav><a class="ds-login" href="#">Log in</a></header>',
     "css": ".ds-header{display:flex;align-items:center;justify-content:space-between;height:92px;padding:0 64px;background:var(--color-midnight);color:var(--color-text-on-dark);border-bottom:1px solid var(--color-line)}.ds-mark{font:400 40px/1 " + AN + "}.ds-header nav{display:flex;gap:32px}.ds-header nav a{position:relative;color:inherit;text-decoration:none;font:500 15px/1 " + PS + "}.ds-header nav a:hover{color:var(--color-marigold)}.ds-header nav a[aria-current]{font-weight:700}.ds-header nav a[aria-current]::after{content:'';position:absolute;left:50%;bottom:-8px;width:22px;height:3px;margin-left:-11px;border-radius:2px;background:var(--color-marigold)}.ds-login{display:inline-flex;align-items:center;height:44px;padding:0 20px;border-radius:999px;border:1px solid rgba(246,241,231,.5);color:inherit;text-decoration:none;font:600 14px/1 " + PS + "}.ds-header a:focus-visible{outline:2px solid var(--color-marigold);outline-offset:3px}"},
]

side = {
    "schemaVersion": 2, "generatedAt": "2026-11-14T00:00:00Z",
    "title": "Design System: ICG — Integrated Communications Group",
    "extensions": {
        "colorMeta": colorMeta,
        "typographyMeta": {
            "display-hero": {"displayName": "Display, hero", "purpose": "Hero headline only, uppercase. 84/60/44px."},
            "display-page": {"displayName": "Display, page", "purpose": "Page titles that are a date, e.g. NOVEMBER 2026. 112/72/56px."},
            "numeral-strip": {"displayName": "Numeral, strip", "purpose": "Week strip day numbers; other numeral-* steps cover times, years, agenda and calendar cells."},
            "headline-date": {"displayName": "Headline, date", "purpose": "A day's programme heading, e.g. SATURDAY, NOVEMBER 14."},
            "title-section": {"displayName": "Title, section", "purpose": "Coming up, Latest news, Announcements."},
            "title-item": {"displayName": "Title, item", "purpose": "One story or event headline."},
            "body-lead": {"displayName": "Body, lead", "purpose": "Hero description."},
            "body": {"displayName": "Body", "purpose": "Running text, 65 to 75 characters per line."},
            "body-sm": {"displayName": "Body, small", "purpose": "Details, places, buttons, links, chips."},
            "label": {"displayName": "Label", "purpose": "Weekday names and TODAY only, uppercase."},
            "meta": {"displayName": "Meta", "purpose": "Dates under items, footnotes."},
        },
        "shadows": [],
        "overlays": [
            {"name": "hero-fade-desktop", "value": "linear-gradient(90deg, rgba(12,20,34,.96) 0%, rgba(12,20,34,.86) 34%, rgba(12,20,34,.45) 58%, rgba(12,20,34,0) 78%), linear-gradient(180deg, rgba(12,20,34,0) 55%, rgba(12,20,34,1) 100%)", "purpose": "Fades the hero photo into midnight behind the headline and into the week strip."},
            {"name": "hero-fade-mobile", "value": "linear-gradient(180deg, rgba(12,20,34,.55) 0%, rgba(12,20,34,.25) 16%, rgba(12,20,34,.7) 34%, rgba(12,20,34,.94) 50%, rgba(12,20,34,1) 82%)", "purpose": "Mobile hero: text sits in the lower half."},
            {"name": "hero-soften", "value": "backdrop-filter: blur(7px) saturate(.85); mask-image: linear-gradient(90deg, #000 0%, #000 42%, transparent 66%)", "purpose": "Quiets posters and signage behind the headline."},
            {"name": "header-scrim", "value": "linear-gradient(180deg, rgba(12,20,34,.78) 0%, rgba(12,20,34,.35) 60%, rgba(12,20,34,0) 100%)", "purpose": "Keeps the transparent header readable over bright photos."},
            {"name": "header-solid", "value": "background: rgba(12,20,34,.94); backdrop-filter: blur(10px); box-shadow: 0 1px 0 #25344f", "purpose": "Header after 40px of scroll."},
        ],
        "focus": [
            {"name": "focus-night", "value": "outline: 2px solid #f5b335; outline-offset: 3px"},
            {"name": "focus-day", "value": "outline: 2px solid #0c1422; outline-offset: 3px"},
        ],
        "motion": [
            {"name": "signin-ambient", "value": "12s ease-in-out", "purpose": "Decorative sign-in Marquee board; pausable, static under reduced motion."},
            {"name": "ease-out-expo", "value": "cubic-bezier(0.16, 1, 0.3, 1)", "purpose": "Hero photo crossfade, 500ms."},
            {"name": "state", "value": "150ms ease", "purpose": "Hover on cells, buttons, chips."},
            {"name": "header", "value": "250ms ease", "purpose": "Header turning solid on scroll."},
            {"name": "reduced-motion", "value": "prefers-reduced-motion: reduce disables transitions and smooth scroll", "purpose": "Always respected."},
        ],
        "breakpoints": [{"name": "sm", "value": "640px"}, {"name": "lg", "value": "1024px"}, {"name": "container", "value": "1440px"}],
    },
    "components": components,
    "narrative": {"northStar": "The Campus Marquee", "overview": overview, "keyCharacteristics": keys,
                  "rules": rules, "dos": dos, "donts": donts},
}
os.makedirs(os.path.join(root, '.impeccable'), exist_ok=True)
with open(os.path.join(root, '.impeccable', 'design.json'), 'w', encoding='utf-8') as f:
    json.dump(side, f, ensure_ascii=False, indent=2)
print(len(colorMeta), 'colors |', len(components), 'components |', len(rules), 'rules |', len(dos), 'dos |', len(donts), 'donts')
print([(r['name'], r['section']) for r in rules])
