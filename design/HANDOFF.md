# Handoff — ICG design prototyping (as of 2026-11-17)

Read this file, `CLAUDE.md` and `DESIGN.md` before implementation. D10 reconciled the
current source and design evidence on November 17, 2026. Use the current status and
[page inventory](PAGES.md) ahead of the dated round notes below. D01–D10 address the
user's specific design-gap plan; they do not establish production completion or a
new visual acceptance of every page. These design tasks did not create commits or
deploy; the unfinished rebuild plan remains separate.

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
  `design/tokens.css` + `design/tailwind.config.js`). The user paused Figma work after
  hitting the MCP cap. Continue HTML unless the user requests a return to Figma;
  that workflow uses Plugin API scripts in
  `design/figma-scripts/` that they paste into the **Scripter** plugin; scripts must draw on
  `figma.currentPage` to the right of existing content and use only the standard Plugin API.
- **`DESIGN.md` is the law.** North Star "The Campus Marquee". Palette **Evergreen & Marigold** (changed from Midnight navy at the client's request on 2026-11-15: night bands use the 135° `--gradient-night` from `#071a14` to `#0d2c21`, applied by the `bg-night` class),
  type Anton (loud: hero headlines, page titles, dates, numerals) + Public Sans (everything
  else), flat (no shadows), pills for everything you press. Read the named rules.
  When a page needs something new, **extend DESIGN.md and `design/tokens.css` together**,
  then regenerate the sidecar (section 4).
- Rejected directions — don't bring back: PLP green palette, warm cream backgrounds, the
  broadsheet/newspaper look, Figma "Mock Design 6" photo-magazine as the base, copying
  Manila Bulletin's look (it's a concept reference only), eyebrow labels above headings.
- The user likes: big Anton date numerals (the "This week" strip), the cinematic hero (photo
  fading into evergreen night), real PLP photos, calendar-first everything.
- Follow current workspace/environment Git instructions. This design plan does not
  authorize commits, deployment or external publication.
- Present desktop/mobile screenshots for UI changes. Documentation-only audits do
  not require recapturing unchanged screens; distinguish existing exports from new QA.
- Standard pages use the Tailwind preview setup; compact widgets and independent
  error fallbacks use their own local scoped CSS with the same tokens.

## 3. Status

Available HTML prototypes. Verification varies by round; see the evidence below and
[tasks/design-todo.md](../tasks/design-todo.md). No blanket new visual review is claimed.
[PAGES.md](PAGES.md) links the prototypes and their handoffs/system references:

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
| Inbox (all roles) | `design/prototypes/dashboard-inbox.html` |
| Account settings (all roles) | `design/prototypes/dashboard-account.html` |
| Users (admin) | `design/prototypes/dashboard-users.html` |
| Messages (admin) | `design/prototypes/dashboard-messages.html` |
| Audit log (admin) | `design/prototypes/dashboard-audit.html` |
| Site settings (admin) | `design/prototypes/dashboard-settings.html` |
| Embed widget builder (admin) | `design/prototypes/dashboard-embeds.html` (+ `dashboard-embeds.js`) |
| Not found / generic error | `design/prototypes/not-found.html`, `error.html` (+ `error-pages.css`) |
| Events widget (list and calendar) | `design/prototypes/embed-events.html` (+ `embed-widgets.css`, `embed-events.js`) |
| Announcements widget (column and row) | `design/prototypes/embed-announcements.html` (+ `embed-widgets.css`, `embed-announcements.js`) |

**Specific gap plan:** D01–D10 completed, with scope/limitations recorded in the
[design tasks](../tasks/design-todo.md). The [Home handoff](handoff/home.md) now describes
the actual Campus Marquee source. **Deferred:** Team (#7), until ICG confirms it.
Archived articles already use the proof-sheet filter; accounts are invite-only.

### What this checkout actually serves

- Python on 4321 serves every HTML prototype directly. Development app preview uses
  [design-preview.ts](../src/lib/design-preview.ts) and [proxy.ts](../src/proxy.ts).
  It maps public/auth/desk pages through Site settings; the newer builder, widgets
  and error designs have no canonical-route preview mapping yet. Direct HTML files
  may be served through the development fallback, which is a separate mechanism.
- Production bypasses that proxy. Home is a minimal ICG page; most route sources use
  RoutePlaceholder and the generic error boundary is still a placeholder. New design
  artifacts do not update those application sources or their old “Not designed” text.
- Current [next.config.ts](../next.config.ts) declares X-Frame-Options: DENY globally.
  Python iframe checks do not verify the Next preview or hosted embedding. Correct
  origin/routes, framing policy, readiness/resize messages and permissions remain
  implementation work. Local error files return 200; actual 404/reset behavior is
  also not implemented by serving them.

### Evidence and build handoff

| Completed scope | Evidence / specification |
| --- | --- |
| D01–D03: reviewer/admin Overview and admin Inbox destinations | [Desk handoff](handoff/dashboard.md), [Inbox](handoff/dashboard-inbox.md), task evidence; `design/tools/check_dashboard.py`. |
| D04–D05: desk/proof/editor spacing and width verification | Page handoffs in PAGES; `design/tools/out/spacing/`, `design/tools/out/editor-review/`; focused/full desk checks recorded. |
| D06–D07: actual iframe widgets | [Events](handoff/embed-events.md), [Announcements](handoff/embed-announcements.md); 280–1440px iframe/state/stress checks and exports. |
| D08: admin builder / matching code / copy fallback | [Builder](handoff/dashboard-embeds.md); combined widget/builder runner passed, including 320–1920px builder checks. Native clipboard permissions remain unverified. |
| D09: independent 404 and public/desk error examples | [Error pages](handoff/error-pages.md); 320–1440px, retry, focus, no-script/font and accessibility checks. |
| D10: documentation reconciliation | Home source/script/fixture audit, local link checks and unchanged-source verification. No UI, build or new global visual test in this pass. |

The prior automated taste gate returned `GATE: ERROR (the gate itself failed: spawn
EPERM)`; its do-not-rerun instruction was respected. That suite remains unverified.
Independent browser/detector evidence is recorded per task; passing it does not
record client visual acceptance. Older public checks/screenshots are historical
evidence, not a fresh D10 review.

| Open integration / decision | Existing rebuild work |
| --- | --- |
| Public Home feed, featured IDs and historical/date selection; Home loading/empty/missing-image states | [Rebuild plan](../tasks/plan.md): T01, T13, T19, T46. Home handoff records source/system differences such as week-arrow size and phone soften cascade. |
| Authenticated role/session enforcement, invite-only onboarding and actual notifications/messages | T01, T07–T09, T22, T29–T40. Prototype role queries and simulated sending are not permission/delivery implementations. |
| Rich-text storage/renderer; cover alt/credit, gallery ordering and scheduling UI/build follow-ups | T01, T24–T28, T34. The editor handoff keeps these unresolved. |
| Publication/review/quorum/eligibility/expiry contracts and real public feeds | T01, T16, T29–T35, T47–T48. Do not infer them from fixtures or a deadline in a title. |
| Canonical embed origin/routes, framing policy, code/preview wiring, native clipboard and hosted validation | T47–T49, T52. Boundary/status/reset integration also belongs to public-state/application work, including T19. |
| Optional Team page and real editorial/contact/assets | T50 and client confirmation. No Team design or new sign-up decision was created. |

The rebuild plan/task files are unchanged. Some old design-availability wording there
may lag this index; the implementation owner should reconcile it while resolving T01.
Do not mark rebuild tasks complete merely because a prototype and handoff exist.

Dashboard pages are **Operate mode** (impeccable). The rules now live in DESIGN.md ›
"Dashboard — the ICG desk (Operate mode)": shell, role-based nav, status badges,
tables, list controls, empty/loading/error, toasts, confirmation dialog. Reuse
`desk.css` / `desk.js` (sample records, shell, badges, toast) for every desk page.

## Historical round notes — November 15–16

These entries retain decision context and their recorded checks. They are not a
current production-status report; use section 3, PAGES and the page handoffs first.

### 2026-11-15: auth pages + desk core

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
- **Completed November 16 (D04–D05):** month desk, proof-sheet and editor spacing, plus editor/Reviews width verification. All checked desk surfaces already filled their available outer width at 1920px. Work-area container queries corrected cramped calendar, editor and review layouts at 1024px. The editor's sticky wrappers now keep its controls in view; measured heights accommodate wrapped controls. Updated page handoffs and before/after evidence are linked from `tasks/design-todo.md`.
- **Completed November 16 (D01–D02):** reviewer and admin Overviews now have their own content. Reviewer deadlines and requests open Reviews; admin publication dates, open messages and invites open their actual destinations. Shared admin fixtures live in `desk-admin-data.js`. Handoff: `design/handoff/dashboard.md`; evidence and remaining tasks: `tasks/design-todo.md`.

**Design plan status:** D01–D10 complete. The next work is review and the existing
rebuild integration above; Team stays conditional. User visual acceptance remains
separate from completed prototype/document work.

## 2026-11-16: repo layout and route scaffold

- The legacy PHP app and its assets moved to `legacy/` (prototype photos now load from
  `../../legacy/gallery/`). The root holds the Next.js app, `design/` and the docs.
- At that scaffold round, routes from `design/PAGES.md` were added to the Next.js app
  as a placeholder page under `src/app/`, using route groups for the shells:
  `(public)/` (site header and footer), `(auth)/` (Campus Desk sign-in), `dashboard/`
  (desk shell) and `embed/` (iframe widgets), plus `not-found.tsx` and `error.tsx`.
  Each page renders `RoutePlaceholder` (`src/components/route-placeholder.tsx`): an `h1`,
  one line on the page's purpose, and the prototype to build from, or "Not designed yet".
  Layouts only pass children through for now. Home (`(public)/page.tsx`) was left as it was.
- Recorded at that round: typecheck, lint, unit tests, `next build` (26 routes) and Playwright shell checks passed. These were not rerun in D10.
- For the build side: `next.config.ts` sends `X-Frame-Options: DENY` on every path, which
  will block the `/embed/*` widgets inside iframes on other sites. Writers create articles
  via the editor with `?id=new` in the prototype; the app has no `/dashboard/articles/new`
  route yet.

- **Design preview in the app (same day):** `npm run dev` shows the mapped HTML prototypes
  at selected app routes (`src/proxy.ts` rewrites a designed route to
  `src/app/preview/[...path]/route.ts`, which serves `design/` and `legacy/gallery/`;
  prototype links such as `dashboard-editor.html?id=a1` redirect to
  `/dashboard/articles/a1/edit`). Development only: production keeps the placeholder
  pages and `/preview/*` returns 404. The route map is `src/lib/design-preview.ts`;
  drop a route from it when its real page is built. The `app` entry in
  `.claude/launch.json` starts `npm run dev` on port 3000. Prototype edits show on reload.
  If Next's dev server starts reloading a page in a loop after `src/proxy.ts` changes,
  restart it.

- **Inbox (2026-11-16):** designed as one direction at the user's request (no three
  concepts), using the impeccable, ui-ux-pro-max and emil-design-eng skills. It is now
  `dashboard-inbox.html`, linked from every role's sidebar and shown at `/dashboard/inbox`
  in `npm run dev`. The segmented control moved into `desk.css` (`.seg`) and is shared
  with Reviews. Paolo's round-2 hand-off time is now 9:58 AM (it was after the prototype's
  "now"). Handoff: `design/handoff/dashboard-inbox.md`.
- Preview fix: `public-site.js` reads the page name from `window.PREVIEW_FILE` when the dev
  server serves it at a route, so `/news/<id>` shows the right story.

- **Account settings (2026-11-16):** one direction, same skills as the Inbox. Now
  `dashboard-account.html`, linked from every role's sidebar, from the Inbox ("Change what
  we email you" → `#email`) and from the writer's password-changed notice; shown at
  `/dashboard/account` in `npm run dev`. DESIGN.md gained "Account" and a "Switch"
  component. Handoff: `design/handoff/dashboard-account.md`.

- **Users (2026-11-16):** one direction. Now `dashboard-users.html`, linked from the admin
  sidebar and shown at `/dashboard/users` in `npm run dev`. New shared pattern: the
  **side sheet** (DESIGN.md), used for a person and for a new invite. The page's role
  filter uses `?type=` because `?role=` already picks the demo person. Handoff:
  `design/handoff/dashboard-users.md`.

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
   - Photos come from `../../legacy/gallery/<file>` (real PLP photos; many carry an old "Lundayan"
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

**Current status:** see section 3; this round note is historical.

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
  (`login-identity.html`). That original walkthrough covered public pages; private
  prototypes are now listed in section 3. No application backend is implied.
- Shared sample data replaces independently generated November records so links
  agree on title/date. Historical fixtures remain synthetic, not recovered data.
- The connected footer omits unconfirmed social destinations and labels the site
  as a design preview. Calendar downloads are snapshots, not live subscriptions.
- Run `design/tools/check_public_demo.py` before a presentation; the screenshots
  it captures live in `design/tools/out/public-demo/`.

- **Photos:** legacy samples may carry old watermarks. Obtain approved landscape
  originals, alt text and rights/credit metadata before production; the preview is not
  an asset approval. An earlier round recorded a liked job-fair photo in Figma, so
  verify archive availability before reusing it.
- **Placeholder content:** contact emails (`icg@plpasig.edu.ph`, `events.icg@…`), About
  page promises and turnaround times, all article and event copy, and archive data
  (generated) are placeholders for ICG to confirm.
- **Home handoff:** updated in D10 against actual source. Remaining source/system
  differences and unimplemented feed/empty/media states are explicit build follow-ups.
- **Page inventory:** 28 entries include shared/filter surfaces. Team is deferred;
  invite-only accounts and the archived-article filter are established. Public pages
  without dedicated Markdown handoffs use DESIGN.md and their prototypes, as labelled
  in PAGES; do not assume additional page notes exist.
- **PRODUCT.md** exists (2026-11-15); update it rather than re-interviewing.
- Verification limitations are recorded in section 3 and the design tasks. D10
  does not change skill hooks or retry the failed automated taste gate.
- Figma file `H8cLeaupZB7AHxFpNalfeA`: pages "Home — Variants", "Home — Hero & Color", and
  whatever the user drew with the Scripter scripts. Treat Figma as archive for now.
- Old scripts in `design/figma-scripts/` (`home-final.js`, `home-final-v2.js`,
  `home-hero-variants.js`) predate the cool Mist background and some tokens; regenerate
  from DESIGN.md before reusing them.

- **Messages (2026-11-16):** one direction, built with the design-taste-frontend,
  frontend-design, ux-copy, web-design-guidelines, apple-design and ui-ux-pro-max skills
  (DESIGN.md wins wherever they disagree: sentence case, the existing palette and type, no
  marketing-page rules). Now `dashboard-messages.html`, linked from the admin sidebar and the
  admin Inbox's daily roll-up; shown at `/dashboard/messages` and `/dashboard/messages/[id]`
  in `npm run dev` (placeholder `[id]` route added). Two panes like Reviews, rows grouped
  under Anton day numerals, a "Reply by" date from the contact page's two-school-day
  promise, topic next steps (draft an event, invite, edit the story), reply from the desk with
  a bounced-reply state. `desk.js` gained the `copy` and `alert` icons; Users accepts
  `?invite=1&email=&name=` to prefill the invite. DESIGN.md gained "Messages (admin)".
  Handoff: `design/handoff/dashboard-messages.md`.

- **Audit log (2026-11-16):** one direction. Now `dashboard-audit.html`, linked from the admin
  sidebar and shown at `/dashboard/audit` in `npm run dev`. One table with a row group per day
  (Anton numerals), area chips, search, person and a required date range (a year at most),
  a read-only entry side sheet (before/after, exact time, browser), and "Download CSV" for
  what the filters show (formula-safe; the export is itself logged). The side sheet's styles
  moved from the Users page into `desk.css`; `desk.js` gained the `download` icon.
  Handoff: `design/handoff/dashboard-audit.md`.
  Note: in the desktop app's preview pane, a `<dialog>`'s `close` event didn't fire, so the
  URL kept `?id=` after closing; headless Chromium (Playwright) behaves correctly.

- **Site settings (2026-11-16):** one direction. Now `dashboard-settings.html`, linked from the
  admin sidebar and shown at `/dashboard/settings` in `npm run dev`. A section menu (column on
  desktop, pills on phones, `?section=`) with Featured stories (3 ordered home slides, up/down
  buttons, add from published stories), Categories (add, rename, archive, delete unused),
  About page (order + side-sheet editor; empty sections hide), Contact and links (incl. the
  "Reply within" promise that Messages uses) and Email sending (read only, no secrets).
  D08 subsequently connected "Embed widgets" to its working prototype with unsaved-work
  protection and return context. Handoffs: `design/handoff/dashboard-settings.md` and
  `design/handoff/dashboard-embeds.md`; canonical app preview wiring remains separate.
