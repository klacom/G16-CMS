# Handoff — ICG design prototyping (as of 2026-11-15)

You are picking up the ICG redesign mid-stream. Read this file, then `CLAUDE.md`, then
`DESIGN.md`, before touching anything. Nothing has been committed yet; the user has not
asked for commits.

## 1. What this project is

- The repo holds the old Lundayan CMS (plain PHP, MySQL, jQuery) for Pamantasan ng Lungsod
  ng Pasig. It is being rebuilt and rebranded as **ICG, the Integrated Communications Group**:
  PLP's news and events record, with **the calendar as the main way in**.
- Target stack (built by another tool, ChatGPT, not by you): Next.js + Supabase + Vercel.
  The old database is lost; there's no data to migrate.
- **Your job is design prototyping only.** Don't write Next.js, Supabase or backend code
  unless the user explicitly asks. Don't modify the old PHP files.
- Migration plan (features, data model, phases): https://claude.ai/artifact/XLxYzwpGB6jzqUBMgaRGBL

## 2. How the user works (decisions already made)

- **Prototype in static HTML** in `design/prototypes/` (Tailwind Play CDN 3.4.17 +
  `design/tokens.css` + `design/tailwind.config.js`). The user moved away from Figma
  "for a while" because the Figma MCP Starter plan caps tool calls (~20/month) and they
  can't upgrade. If they go back to Figma, deliver Plugin API scripts in
  `design/figma-scripts/` that they paste into the **Scripter** plugin; scripts must draw on
  `figma.currentPage` to the right of existing content and use only the standard Plugin API.
- **`DESIGN.md` is the law.** North Star "The Campus Marquee". Palette **Evergreen & Marigold** (changed from Midnight navy at the client's request on 2026-11-15: night bands use the 135° `--gradient-night` from `#071a14` to `#0d2c21`, applied by the `bg-night` class),
  type Anton (loud: hero headlines, page titles, dates, numerals) + Public Sans (everything
  else), flat (no shadows), pills for everything you press. Seven named rules; read them.
  When a page needs something new, **extend DESIGN.md and `design/tokens.css` together**,
  then regenerate the sidecar (section 4).
- Rejected directions — don't bring back: PLP green palette, warm cream backgrounds, the
  broadsheet/newspaper look, Figma "Mock Design 6" photo-magazine as the base, copying
  Manila Bulletin's look (it's a concept reference only), eyebrow labels above headings.
- The user likes: big Anton date numerals (the "This week" strip), the cinematic hero (photo
  fading into evergreen night), real PLP photos, calendar-first everything.
- Global rule (`~/.claude/CLAUDE.md`): **no AI attribution** in branches, commits, PRs or
  code comments; Conventional Commits; `feat/ fix/ chore/ refactor/` branch prefixes.
- Write to the user in plain language; they review screenshots, so always attach desktop
  and mobile screenshots of what you built.

## 3. Status

Done (all checked at 1440 and 390 px, no console errors, impeccable detector clean):

| Page | File |
| --- | --- |
| Home | `design/prototypes/home.html` |
| Calendar (month grid, day panel, agenda, filters) | `design/prototypes/calendar.html` |
| Article | `design/prototypes/article.html` |
| Archive (date browser, search, pagination) | `design/prototypes/archive.html` |
| About | `design/prototypes/about.html` |
| Contact (form with validation, success state) | `design/prototypes/contact.html` |
| Log in (with forgot-password step) | `design/prototypes/login.html` (Marquee board, alternate) and `login-identity.html` (Campus Desk, the standard) |
| Reset password | `design/prototypes/reset-password.html` |
| Accept invite | `design/prototypes/accept-invite.html` |
| Desk shell + overview (writer, reviewer, admin) | `design/prototypes/dashboard.html` (+ `desk.css`, `desk.js`) |
| My articles (admin: Articles) | `design/prototypes/dashboard-articles.html` |
| Article editor | `design/prototypes/dashboard-editor.html` (+ `desk-editor.js`) |
| Reviews: queue + review (reviewer) | `design/prototypes/dashboard-reviews.html` (+ `desk-review.js`) |

Still to do, in the user's likely order (full list with routes in `design/PAGES.md`):

1. Inbox (#15) and Account settings (#16).
2. Admin: users, contact messages, audit log, site settings, embed widget builder (#22–26).
3. Embeddable widgets (#27–28), 404/error (#8), Team page if the client wants it (#7).

Dashboard pages are **Operate mode** (impeccable). The rules now live in DESIGN.md ›
"Dashboard — the ICG desk (Operate mode)": shell, role-based nav, status badges,
tables, list controls, empty/loading/error, toasts, confirmation dialog. Reuse
`desk.css` / `desk.js` (sample records, shell, badges, toast) for every desk page.

## 2026-11-15 round: auth pages + desk core

- **PRODUCT.md** written via `/impeccable init`: writers are ICG staff plus invited
  org officers; reviewers are ICG student editors; work happens on phones and
  computers about evenly.
- Decisions: Campus Desk (`login-identity.html`) is the sign-in standard; accounts are
  **invite only** (no public sign-up). Recorded in DESIGN.md, PAGES.md and PRODUCT.md;
  `tasks/decisions.md` (owned by the build side) still lists sign-up as unresolved.
- New pages: reset password, accept invite, desk overview (3 roles), My articles.
  Shared helpers: `signin-password.js` (password rules, show/hide, error summary) and
  `desk.css` / `desk.js`. Handoffs: `design/handoff/{reset-password,accept-invite,dashboard,dashboard-articles}.md`.
- Login demo success now opens `dashboard.html`; `login-identity.html?step=reset` opens
  the reset request step.
- Checks: `design/tools/check_auth_pages.py`, `design/tools/check_dashboard.py`
  (and the updated `check_login_identity.py`) pass; detector clean on all new pages;
  screenshots in `design/tools/out/` (`reset-*`, `invite-*`, `dashboard-*`, `articles-*`,
  `auth-states/`, `desk-states/`).
- Note: the `design` preview server may land on another port if 4321 is busy; the
  check scripts expect 4321.

### Overview direction (2026-11-15, later the same day)

- After a review of the first overview (green date band, mixed sizes, side bars, empty
  right side), three structures were built: A pipeline lanes, B grouped ledger with a
  two-week rail, C month desk. **The user chose C**; it is now `dashboard.html`
  (A and B remain as `dashboard-a.html` / `dashboard-b.html` for reference).
- DESIGN.md › Dashboard now describes the month desk, borderless status badges on a fill
  ramp, The Pressable Outline Rule, and a sidebar without edge bars.
- My articles went through the same round: A proof sheet, B filtered table, C status
  board. **The user chose A**; it is now `dashboard-articles.html` with the row menu,
  confirmations, undo, URL filters and empty/loading/error states carried over
  (B and C remain as `dashboard-articles-b.html` / `-c.html`; `-a.html` is the original sketch).
- Article editor, same process: A guided steps, B writing page with tabbed settings,
  C ready for review. **The user chose C**; it is now `dashboard-editor.html`
  (`?id=` any sample article, `?id=new` for a blank one). My articles cards, the card
  menu's Edit, the month desk's day items and "Edit draft", and every "New article"
  button now open it. Handoff: `design/handoff/dashboard-editor.md`.
- Reviews (#20–21), same process: A by deadline, B what changed, C review inbox.
  **The user chose C**; it is now `dashboard-reviews.html` (`?id=r1`…`r4`, `?empty=1`),
  linked from the reviewer's sidebar. Stepping down now asks first (confirm dialog);
  declining an invitation offers Undo. `review-a/b/c.html` stay for reference.
  Handoff: `design/handoff/dashboard-reviews.md`.
- **Open, deferred by the user:** a spacing pass (padding and margins) on the month desk, the proof sheet and the editor;
  reviewer and admin versions of the month desk (content is writer-only for now).

**Next task:** Inbox (#15) and Account settings (#16), offered as three structures for
the user to choose from, as before. The rich-text format decision still blocks the editor's build.
Do the spacing pass when the user asks for it.

## 4. Workflow and tools

1. Start the preview server: `.claude/launch.json` → config `design` (python http.server on
   port 4321, serving the repo root). Pages are at
   `http://localhost:4321/design/prototypes/<page>.html`.
2. Build the page. Conventions every prototype follows:
   - Copy the header and footer markup from an existing page; set `aria-current="page"`.
   - Define type roles as CSS classes in the page `<style>` (`.t-page`, `.t-feature`,
     `.t-section`, `.t-item`…) with their responsive steps, using only sizes listed in the
     DESIGN.md typography frontmatter. The detector flags off-scale sizes.
   - Mark components with `data-component="Name"`.
   - Photos come from `../../gallery/<file>` (real PLP photos; many carry an old "Lundayan"
     watermark at the bottom, so crop with `object-position: 50% 40%`).
   - Elements that receive focus programmatically get `scroll-margin-top` so the sticky
     header doesn't cover them.
3. Screenshot both sizes: `python -I design/tools/shot.py <url> design/tools/out/<name>`
   (needs Python Playwright; it's installed). It also prints page width, which must equal
   the viewport (a mobile width over 390 means something overflows; usually a grid child
   needs `min-w-0`).
4. Run the impeccable detector once per finished page (PowerShell):
   `& ".\.claude\skills\impeccable\scripts\impeccable.cmd" detect --json design/prototypes/<page>.html`
   It checks against DESIGN.md (colors, sizes, radii) and AI-slop patterns (nested cards,
   flat type hierarchy, cream backgrounds…). `[]` means clean.
5. After any DESIGN.md change: `python -I design/tools/gen_sidecar.py .` regenerates
   `.impeccable/design.json`. New colors need a display name in the script's `names` dict.
6. Contrast: every new color pair must be checked (body text ≥ 4.5:1, large text and field
   borders ≥ 3:1). Verified pairs are listed at the top of `design/tokens.css`.

Skills worth loading: `impeccable` (polish/critique/craft floor; run its `context` once),
`icg-prototype` (project skill, reads like this file), `ui-ux-pro-max` (UX guideline search).

## 5. Login improvements completed (2026-11-14)

- `login.html` now uses the decorative Marquee board SVG on Evergreen Night: Anton numerals,
  a Marigold illustrative today cell, a 12-second ambient cycle, pause/play control,
  and a static reduced-motion default with explicit "Play animation" opt-in. It is artwork, not a live calendar.
- Below 768px, the night band is 110px tall, with back link and wordmark side by side
  and no tagline. The back link stays 14px on a solid background.
- Login and reset-request email fields use persistent hints instead of placeholders.
  Hint associations survive validation errors. The unchecked keep-logged-in control
  includes guidance for shared or lab computers.
- “Ask the desk” links to `contact.html?topic=account`; the contact form has a
  “Request an account” topic. Unknown topic values fall back to “A question”.
- The user chose to leave Google sign-in out for now because PLP's Google Workspace
  status is uncertain. Keep pill buttons and the 420px form column.
- Fixed two existing interaction defects: reopening reset now restores the form, and
  a failed login after demo success restores error styling and alert semantics.
- DESIGN.md and tokens document the graphic, responsive band and motion; regenerate
  the sidecar after future changes. `design/tools/check_login.py` exercises login,
  reset, account requests, keyboard topic selection, reduced motion and overflow.
- Screenshots live in `design/tools/out/`: `login-{desktop,mobile}.png`, plus loading,
  error, success, reset, reset-sent, reduced-motion and contact-account variants.
- These remain static prototypes: login, email sending and account requests are
  simulated. No backend authentication or messaging is connected.
- Verification passed at 1440px and 390px for login, password visibility, loading,
  error, demo success, reset/reopen, account requests and keyboard topic changes.
  Reduced motion and overflow checks also passed at 320px, 768px and 1024px;
  no console errors were reported. The one detector warning is a confirmed static
  contrast false positive: it pairs the pause control's Night Muted text with Mist,
  but browser computed styles show Midnight behind it (7.52:1; measured before the Evergreen change, re-measure). Other measured
  pairs: email hint on Mist 5.26:1, back link on Midnight 16.38:1, field border on
  Card White 3.98:1. Contact has no detector findings.

**Next task:** see section 3.

## 6. Known issues and open questions

### Connected public walkthrough (2026-11-14)

- The public prototypes now form a single browsable local presentation. Open
  `http://127.0.0.1:4321/design/prototypes/`; `index.html` opens Home.
- Read `design/PUBLIC-DEMO.md` for launch instructions and the client-recording route.
- `public-data.js`, `public-site.js`, and `public-site.css` under `design/prototypes/`
  provide shared sample records, matching detail links, consistent navigation,
  mobile menus, calendar exports, and responsive refinements. Preserve these
  includes when editing the individual prototypes.
- The public navigation is Home, Calendar, Archive, About, and Contact. The
  separate News and Events listing pages were removed at the user's request;
  news links use the Archive filter and event browsing uses the Calendar.
  The login link opens the separate Campus Desk concept
  (`login-identity.html`). No private pages or application backend were added.
- Shared sample data replaces independently generated November records so links
  agree on title/date. Historical fixtures remain synthetic, not recovered data.
- The connected footer omits unconfirmed social destinations and labels the site
  as a design preview. Calendar downloads are snapshots, not live subscriptions.
- Run `design/tools/check_public_demo.py` before a presentation; the screenshots
  it captures live in `design/tools/out/public-demo/`.

- **Photos:** many gallery photos carry the old Lundayan watermark; hero and lead photos
  need landscape originals ≥ 2400px wide (current ones are 1080px squares and look soft).
  The job fair hero photo the user liked exists only in Figma.
- **Placeholder content:** contact emails (`icg@plpasig.edu.ph`, `events.icg@…`), About
  page promises and turnaround times, all article and event copy, and archive data
  (generated) are placeholders for ICG to confirm.
- **`design/handoff/home.md` is stale** (written for the rejected broadsheet version). Rewrite
  it, or write handoff notes per page, when the user asks for developer handoff.
- **`design/PAGES.md`** lists 28 pages; Team page and sign-up model still need a client
  decision.
- **PRODUCT.md** exists (2026-11-15); update it rather than re-interviewing.
- Impeccable reports a setup issue (its design hook isn't installed). The user can run
  `/impeccable doctor`; don't fix it unasked.
- Figma file `H8cLeaupZB7AHxFpNalfeA`: pages "Home — Variants", "Home — Hero & Color", and
  whatever the user drew with the Scripter scripts. Treat Figma as archive for now.
- Old scripts in `design/figma-scripts/` (`home-final.js`, `home-final-v2.js`,
  `home-hero-variants.js`) predate the cool Mist background and some tokens; regenerate
  from DESIGN.md before reusing them.
