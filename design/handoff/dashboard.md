# Handoff — Desk shell and overview

Prototypes: `design/prototypes/dashboard.html` (+ shared `desk.css`, `desk.js`)
Routes: `/dashboard/*` layout (PAGES #13) and `/dashboard` overview (#14).
Rules: DESIGN.md › "Dashboard — the ICG desk (Operate mode)" and The Pressable Outline Rule.
Tokens: `--dash-sidebar` 264px, `--dash-topbar` 56px, `--dash-content` 1240px (left-aligned,
not centered, so the band and the panels share one left edge).

## Shell components
| `data-component` | Notes |
| --- | --- |
| `DeskSidebar` | 1024px and up. Night gradient, sticky full height. Wordmark + "Desk", role-based nav, person + role, View the site, Log out. Current item: Raised Night + 3×22 marigold bar + `aria-current="page"`. Counts are Marquee White pills with an sr-only ", N new". |
| `DeskTopBar` | Below 1024px. Menu button, wordmark, page name, the page's one primary action as a 44px marigold icon button. |
| `DeskDrawer` | Mobile nav: `role="dialog"`, `aria-modal`, focus moves to the current item, is trapped, Escape/scrim/close return focus to the menu button. 250ms slide; instant under reduced motion. |
| `Toast` | Polite status region, 5s, optional Undo. |

Nav per role (one role per account): Writer — Overview, My articles, Inbox, Account.
Reviewer — Overview, Reviews, Inbox, Account. Admin — Overview, Articles, Users,
Messages, Audit log, Site settings, Inbox, Account. Never render links a role can't use.

## Overview: the month desk (chosen 2026-11-15)
The user picked concept C over A (pipeline lanes, `dashboard-a.html`) and B (ledger with
a two-week rail, `dashboard-b.html`). Those two stay as references only.

| `data-component` | Notes |
| --- | --- |
| Header | `h1` greeting ("Good morning, Lea"), one muted line: today's date · counts. "New article" (marigold) on the right; on mobile it is the top bar's + button. No night band. |
| `DeskMonth` | Public calendar month grid: Monday first, 1px Mist Rule gaps, today = marigold circle, selected = 2px Ink inset outline, bordered prev/next month buttons, legend. Cells are buttons (`aria-pressed`, label names the day and counts). Desktop: up to two chips of the person's dated work (time + kind, title clamped to two lines) filled with the article's status fill, "N more", and "N on campus" at the foot. Mobile: numeral + up to three dots (Ink = yours, Ink Faint = campus). |
| `SelectedDay` | Ruled section (3px Ink rule): the chosen day's items with badges, then campus events. Empty day: one sentence naming the next dated item + "Show <weekday>" button, which selects it and moves focus to the heading. |
| `NeedsYou` | Ruled section: items waiting on this person with their one bordered action. |
| `PipelineCounts` | Ruled section: one row per state (badge, count, chevron) linking to `/dashboard/articles?status=…`. |
| `StatusBadge` | 24px, no border, fill ramp (Draft Mist → In review Mist Rule → Approved Raised Night → Published Ink; Archived unfilled). On Mist surfaces Draft takes Card White. |

Dated kinds shown in the grid (`desk.js` → `dated()`): event (`articles.event_starts_at`),
go-live (scheduled publish time), published (publish date), sent for review, changes
requested. Campus events come from the public events feed.

## Data (new data model names)
`articles.title`, `articles.type`, `categories.name`, `articles.status`,
`articles.updated_at`, `articles.event_starts_at`, scheduled publish time, review
assignments (reviewer, sent date, decision, comment), invitations, contact messages
(unanswered count). Overview queries must be bounded and role-scoped.

## Prototype notes
- `?role=writer|reviewer|admin` switches the sidebar only; the month desk content is the
  writer's for now (reviewer and admin versions are still to design).
- "Today" is fixed to
  Sunday, November 15, 2026 (10:05 AM, hence "Good morning") in `desk.js` so screenshots
  stay stable; use the real date and time of day.
- Links to pages from later rounds (editor, inbox, reviews, admin pages) show a toast.
- Login success (`login-identity.html`) now opens `dashboard.html`.

## Open questions
- Reviewer quorum: admin row "has one reviewer" assumes more than one may be wanted.
- Should reviewers see campus events or their review deadlines in "Coming up"? Review
  deadlines aren't in the data model yet.
