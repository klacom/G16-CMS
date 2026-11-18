# Handoff — Desk shell and overview

Prototypes: `design/prototypes/dashboard.html` (+ shared `desk.css`, `desk.js`, `desk-review.js`, `desk-admin-data.js`, and `desk-overview.js`)
Routes: `/dashboard/*` layout (PAGES #13) and `/dashboard` overview (#14).
Rules: DESIGN.md › "Dashboard — the ICG desk (Operate mode)" and The Pressable Outline Rule.
Tokens: `--dash-sidebar` 264px and `--dash-topbar` 56px. Overview uses `.desk-content.fluid`,
so the default `--dash-content` 1240px cap does not apply. Equal outer padding is 40px
desktop / 16px mobile. A 32px gap separates the calendar from the ruled sections.
The 360px side column appears only when the actual work area is at least 64rem wide
(a container query, not a viewport breakpoint); otherwise those sections follow the
calendar. This prevents the desktop sidebar from squeezing the calendar at 1024px.

## Shell components
| `data-component` | Notes |
| --- | --- |
| `DeskSidebar` | 1024px and up. Night gradient, sticky full height. Wordmark + "Desk", role-based nav, person + role, View the site, Log out. Current item: Raised Night fill, semibold text and `aria-current="page"`, without an edge stripe. Counts are Marquee White pills with an sr-only ", N new". |
| `DeskTopBar` | Below 1024px. Menu button, wordmark, page name, the page's one primary action as a 44px marigold icon button. Reviewer: review icon labelled Open reviews. Writer: plus icon labelled New article. Admin: mail icon labelled Answer messages (article icon/View articles when no messages remain). |
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
| Header | `h1` greeting names Lea, Paolo or Maria; today's date and role-specific counts. Primary action: New article for writers, Open reviews for reviewers, Answer messages for admins. No night band. |
| `DeskMonth` | Public calendar month grid: Monday first, 1px Mist Rule gaps, today = marigold circle, selected = 2px Ink inset outline, bordered prev/next month buttons, legend. Cells are buttons (`aria-pressed`, label names the day and counts). Desktop: up to two chips of the person's dated work (time + kind, title clamped to two lines) filled with the article's status fill, "N more", and "N on campus" at the foot. Mobile: numeral + up to three dots (Ink = yours, Ink Faint = campus). |
| `SelectedDay` | Ruled section (3px Ink rule): the chosen day's items with badges, then campus events. Empty day: one sentence naming the next dated item + "Show <weekday>" button, which selects it and moves focus to the heading. |
| `NeedsYou` | Ruled section: items waiting on this person with their one bordered action. |
| `PipelineCounts` / `ReviewCounts` | Writer: article-status links. Reviewer: first reads, another read and new-request counts, linked into Reviews. Admin replaces this group with PendingInvites. |
| `StatusBadge` | 24px, no border, fill ramp (Draft Mist → In review Mist Rule → Approved Raised Night → Published Ink; Archived unfilled). On Mist surfaces Draft takes Card White. |

Dated writer kinds shown in the grid (`desk.js` → `dated()`): event (`articles.event_starts_at`),
go-live (scheduled publish time), published (publish date), sent for review, changes
requested. Campus events come from the public events feed.

## Data (new data model names)
`articles.title`, `articles.type`, `categories.name`, `articles.status`,
`articles.updated_at`, `articles.event_starts_at`, scheduled publish time, review
assignments (reviewer, sent date, decision, comment), invitations, contact messages
(unanswered count). Overview queries must be bounded and role-scoped.

## Reviewer Overview — D01, November 16, 2026

The Overview reuses `window.Review.REVIEWS` from the Reviews prototype. It does not
duplicate assignment records. Summary counts distinguish accepted reviews and new
requests; overdue and due-today counts include accepted assignments only.

| Area | Behavior |
| --- | --- |
| Calendar | Uses nullable `neededBy`, not the sent date or article event date. Accepted assignments use filled Mist chips (Review due / Another read); invitations use dashed-outline chips (New request) on their requested needed-by date. These are assignment states, not article status badges. On phones the legend describes the actual dots: Ink for deadlines/requests, muted for campus events. |
| Selected day | Deadline/request, writer and round; opens `dashboard-reviews.html?id=<review-id>&role=reviewer`. Public campus events retain their event dates and remain separately labelled. |
| Needs you | Accepted assignments in deadline order, then invitations. Each names the writer and deadline or No review deadline, with Continue review / View request. A second read states its round and fixes to check. Undated work is never assigned an invented date. |
| Your reviews | First reads, Another read and New requests. Nonzero groups open the first matching assignment; zero groups open Reviews. These links are entry points, not queue filters. |
| Caught up | You’re all caught up; new requests will appear here. Keep the public campus calendar and Reviews navigation. |
| Loading / error | Replace the personal schedule with loading status/placeholders or a failure alert and Try again. A failed load must not look like a zero queue. Retry retains reviewer context. |

Prototype controls:
- `?role=reviewer`: 2 accepted reviews, 2 new requests.
- `?role=reviewer&today=2026-11-17`: one accepted review due today.
- `?role=reviewer&today=2026-11-27`: both accepted reviews overdue.
- `?role=reviewer&empty=1`: caught up.
- `?role=reviewer&state=loading` or `state=error`: loading/failure.

The `today` override accepts valid ISO dates only and applies to this Overview demo.
Reviewer data needs review ID, assigned reviewer, state, nullable requested deadline,
round, writer and resolved/outstanding requests. `neededBy` is a prototype field name,
not an approved database column. Production queries must be bounded and role-scoped.

## Admin Overview — D02, November 16, 2026

The admin desk is site-wide rather than a personal article pipeline. The summary is
"1 scheduled · 5 open messages · 1 invite waiting" at the fixed demo clock; the invite
section also calls out the separate expired invite. The primary action, Answer messages,
opens the most urgent open message (the overdue correction). When there are no open
messages, it becomes View articles. The sidebar Messages count is unread open messages,
not all open messages; it is 3 in the normal fixture and disappears in the empty state.

| Area | Data and behavior |
| --- | --- |
| Publication calendar | Upcoming scheduled publication entries come from the existing approved article's go-live record. Published News/Announcement dates come from the public fixture feed across the site, restricted to dates through the demo clock. Public Event dates remain campus dates, never inferred publication dates. Dark Published chips and the Approved-fill Goes live chip use existing status tokens. |
| Initial selected day | Select the next scheduled publication on or after today within the current month; fall back to today when there is none. This makes the next title/time visible immediately. Today keeps its marigold marker independently of selection. Choosing another date stays under the user's control. |
| Selected day | Go-live title/time and Approved badge open the matching article editor with admin context. Published entries open the real public story. Campus events are separately labelled On campus. A date without publication entries offers the next dated publication when available. |
| `OpenMessages` | Five open messages, including unread and previously read work. Show the first three: overdue replies first, undelivered replies next, then earliest reply deadline. Name the subject and sender without showing message bodies. View all 5 messages opens the Open list. Failed replies are distinguished from overdue unanswered messages. |
| `PendingInvites` | One waiting, one expired; expired first. Show the invitee or email, role and expiry. Each row opens Users filtered to that invite via supported `status=invited&q=<email>` parameters; the user then opens the matching row's sheet. View all invites opens the Invites filter. No invented person deep link. |
| Empty/loading/error | `?role=admin&empty=1` clears publication/operational fixtures while retaining the public campus calendar; explicit No open messages and No invites waiting states. Loading/error replaces the schedule and counts; retry retains role and other demo parameters. No zero queue is inferred from a failed load. |

`desk-admin-data.js` holds the exact synthetic Messages and Users records previously
embedded in those pages. Both destination pages clone their fixtures before local edits;
Overview reads the same baseline. The shared two-school-day deadline helper and bounce
predicate keep priority and counts consistent. No extra scheduled publication or author
has been invented. Sharing fixture files is not a data API, persistence mechanism or
authorization model. Refreshing destination pages restores their local fixture state,
as before this extraction. Production scheduling must enforce approved revisions;
an admin still cannot publish an unapproved revision. Message claiming, per-admin read
state, holidays and live invite expiry remain existing product/build decisions.

## Prototype notes
- `?role=writer|reviewer|admin` selects the demo person. All three now have role-specific
  Overview content and action destinations.
- "Today" is fixed to
  Sunday, November 15, 2026 (10:05 AM, hence "Good morning") in `desk.js` so screenshots
  stay stable; use the real date and greeting in Asia/Manila in production.
- Editor, Reviews, Inbox, Account, Users and Messages now have linked prototypes.
- Demo query parameters do not implement production authorization or persistence.
- Login success (`login-identity.html`) now opens `dashboard.html`.

## Spacing and width — D04 (November 16, 2026)

- The existing fluid outer width already filled the work area at 1920px; keep it.
  The fix is the calendar's available-width decision, not a wider page wrapper.
- Header to calendar: 24px on phones/tablets, 32px with the desktop frame. Month
  controls to weekday labels: 16px. Ruled section headings have 16px above them;
  item rows have 16px vertical padding; separate ruled groups retain a 32px gap.
- At viewport widths below 360px, the weekday row and grid alone reach both screen
  edges so seven day buttons can retain at least 44px width. The rest of the page
  keeps its 16px gutter. The grid has square, borderless outer sides at this size.
- Before/after checks: at a 1024px viewport day buttons grew from 40px to 96px,
  eliminating clipped labels; at 320px they grew from 40px to about 44.8px.
  Writer/reviewer/admin calendar meaning, primary actions and destinations are unchanged.

## Open questions
- Reviewer quorum, self-review and deadline ownership remain product/build decisions.
- Review deadline storage still needs the rebuild contract; the design distinguishes
  it from publication instants and event dates without choosing a database schema.
