---
name: icg-prototype
description: Design ICG (Integrated Communications Group) web pages in Figma as comparable variants, following the ICG brand decisions, and write handoff notes. Use for any ICG page design, mockup, layout, component, landing page or UI prototype request in this repo.
---

# ICG prototyping

> **READ `/DESIGN.md` FIRST.** It is the design system ("The Campus Marquee") and
> overrides anything older in this skill: tokens, type roles, layout, components,
> named rules, do's and don'ts. Values in `design/tokens.css` must match its
> frontmatter. Extend DESIGN.md (and tokens.css) when a page needs something new.
>
> **CURRENT MODE: HTML prototypes (user decision, after the Figma MCP cap).** Build
> pages as static HTML + Tailwind in `design/prototypes/` (see `home.html` for the
> conventions: tokens.css + tailwind.config.js, data-component attributes, real
> gallery photos via `../../gallery/`, header scrim, hero carousel controls flanking
> the dashes, week strip centered on today after `load`). Check desktop 1440 and
> mobile 390 screenshots with Playwright, then run the impeccable detector once.
> The Figma notes below apply when the user switches back to Figma.
>
> **Figma first (user decision, 2026-11-14).** Every page is designed in the Figma
> file `H8cLeaupZB7AHxFpNalfeA`, usually as 2–3 variants side by side on a page
> named "<Page> — Variants", using `use_figma` (load the figma-use and
> figma-generate-design guidance first). Do NOT build HTML prototypes unless the
> user asks. The HTML sections further down are kept only for that case.
> The Home variants live on page "Home — Variants" (node 178:4). Reuse the photo
> image hashes from the existing mockups there; the Figma Starter plan has a low
> MCP call limit, so batch each variant into as few calls as possible.
> **Chosen look (2026-11-14):** Variant A layout + "Cinematic" hero (full-bleed photo
> fading into evergreen night, big Anton headline, Read the story + Add to calendar; NO
> story-card row) + the "This week" strip of big day numerals under it.
> Palette **Evergreen & Marigold** (night bands use the `bg-night` gradient; Midnight navy retired 2026-11-15), fonts **Anton + Public Sans** — values and contrast
> rules in `design/tokens.css`. Marigold is never text on the light paper sections
> (use amber #8A5A00 there). Reference build: `design/figma-scripts/home-final-v2.js`
> (polish pass via the impeccable + ui-ux-pro-max skills: no eyebrows above headings,
> Anton only for loud moments, Button/DayCell state variants, 390 mobile frame).
> Before handing a script over, also run it against a mock `figma` object in Node
> to catch runtime errors (pattern used for v2).
> Everything below about broadsheet, PLP green/gold, Newsreader and HTML files is
> SUPERSEDED.
>
> **Figma MCP limit:** the user's Figma is on the Starter plan (about 20 MCP calls a
> month) and can't be upgraded. Default to writing a Figma Plugin API script in
> `design/figma-scripts/<page>.js` that the user pastes into the Scripter plugin.
> Scripts must use only the standard Plugin API (no `figma.createAutoLayout`,
> no `node.screenshot`), reuse existing image hashes, and draw on
> `figma.currentPage` to the right of existing content (user preference: no new
> pages), never moving or deleting existing nodes.
> Syntax-check with `node --check` on a `.mjs` copy before handing over.

Claude's job in this repo is **design prototyping only**. The Next.js + Supabase
build and all backend work happen elsewhere (ChatGPT). So:

- Do not write Next.js, Supabase, SQL or API code here.
- Do not edit the legacy PHP app (root `*.php`, `php-backend/`, `scripts/`). It is
  a feature reference only.
- Everything you make lives under `design/`.

## Sources of truth

| What | Where |
| --- | --- |
| Brand tokens (colors, type, spacing) | `design/tokens.css` — use its CSS variables, never hard-coded hex |
| Visual direction | **Broadsheet + calendar spine** (decided 2026-11-14, see Design rules). Figma file `H8cLeaupZB7AHxFpNalfeA` holds earlier explorations only |
| Ideas to borrow | Mock Design 1 (`36:2`): category filter chips, compact Archives table. Mock Design 6 (`137:24`): story card with category kicker + date |
| Features and data per page | Migration plan doc: https://claude.ai/artifact/XLxYzwpGB6jzqUBMgaRGBL |
| Legacy behavior | `lundayan-site-*.php` (public), `edit-article.php`, `review-article.php`, `admin-*.php` |

Before reading the Figma file, run the Figma `create_session` with that file key.
Use `get_screenshot` for the look and `get_design_context` (after loading the
figma design-to-code skill) for exact values. If Figma variables now exist, update
`design/tokens.css` from them and note it in the file header.

## Design rules

- **Direction: broadsheet + calendar spine.** The site is PLP's newspaper of
  record and event archive. Take the *genre* of a national broadsheet, never a
  specific paper's masthead, logo or colors.
  - Masthead with publication name and a dateline (today's date, edition line).
  - Serif headlines with real weight; sans-serif for datelines, labels, nav and
    the calendar. Thin column rules, dense multi-column front page.
  - **Calendar spine:** a week strip directly under the masthead (today
    highlighted, days with events marked; clicking a day filters the front page)
    and a "Today / This week / Upcoming" rail on desktop. The full calendar page is
    the deep view.
  - Every story shows a category kicker and a dateline. Lead story gets a large
    photo; secondary stories use small photos or none. No full-screen hero.
  - Archive reads like back issues: browse by year → month → day.
- **Palette: ink, PLP green, a touch of gold.** Ink for text and rules, green for
  today, kickers, links and primary buttons, gold ONLY as small event-day markers
  (dots, underlines) in the week strip and calendar — it fails contrast as text.
  Corners stay tight (2–4 px); no shadows, no gradients.
- **Type: Newsreader + Public Sans.** Newsreader for the masthead, headlines and
  article body; Public Sans for nav, datelines, kickers (uppercase, letter-spaced),
  buttons, forms and the calendar grid.
- **Mobile first.** Every prototype must work at 390 px and 1440 px. On mobile the
  week strip scrolls horizontally and the rail moves under the lead story.
- **Nav:** Home, About, Archive, Calendar, Contact, plus the account icon.
- **Accessibility:** text contrast at least 4.5:1 (the accent passes on the page
  background only at normal text weight and up — never use it on photos or dark
  ink). Visible focus states, real buttons and links, alt text, one `h1` per page.
- **Real-looking copy.** No lorem ipsum and none of the template filler in the mocks
  ("Professional-grade presets…"). Use plausible ICG/PLP news, events and
  announcements. No Lundayan branding anywhere.
- Load frontend-design and use `design:design-critique` / `design:accessibility-review`
  for a self-review pass before calling a page done.

## File format

One self-contained HTML file per page or component in `design/prototypes/`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ICG — Home (prototype)</title>
  <link rel="stylesheet" href="../tokens.css">
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <script src="../tailwind.config.js"></script>
</head>
```

- Style with Tailwind utility classes mapped to the tokens (`bg-paper`, `text-ink`,
  `text-green`, `bg-gold`, `border-rule`, `font-display`…; see `design/tailwind.config.js`). These classes
  carry straight over to the Next.js build.
- Mark each repeated block with `data-component="ArticleCard"` (PascalCase) so the
  builder can see the component boundaries.
- Images: use files from `gallery/` or `pics/` via relative paths
  (`../../gallery/...`), or neutral placeholders. No hotlinked stock photos.
- Plain JS only for interaction demos (carousel, menu, tabs). Keep it short.

Name files by route: `home.html`, `article.html`, `archive.html`, `calendar.html`,
`about.html`, `contact.html`, `login.html`, `dashboard-*.html`.

## Preview and check

Start the `design` server from `.claude/launch.json` (serves the repo root on
port 4321, so `gallery/` images resolve) and open
`http://localhost:4321/design/prototypes/<file>.html` in the browser pane. Check it at the
mobile preset and at desktop, then reset the viewport to desktop.

## Handoff note

For each finished prototype, write `design/handoff/<page>.md` for the developer:

1. **Route** and purpose in one line.
2. **Components:** each `data-component`, its props, and its states (empty,
   loading, error, long text, no image).
3. **Data:** which fields it reads, named after the new data model in the plan doc
   (`articles.title`, `articles.excerpt`, `articles.event_starts_at`, `categories.name`…).
4. **Behavior:** interactions, breakpoints, anything not obvious from the HTML.
5. **Open questions** for the developer or client.
