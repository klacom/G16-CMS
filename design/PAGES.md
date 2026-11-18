# ICG — Page inventory and prototype status

Updated November 17, 2026 (D10). The 28 entries below are the feature inventory;
shared layouts and filters are not separate designed pages. HTML prototypes exist
for this scope except Team (#7), which stays deferred. A prototype is a design
reference with the limitations in its handoff, not a production implementation or
record of client visual acceptance.

**Priority:** P1 public demo · P2 author/review · P3 admin/supporting.
**Figma archive:** older inventory labels retained for reference; use DESIGN.md,
current HTML and handoffs for implementation. Legacy filenames refer to `legacy/`.

**Preview/build distinction:** the Python design server serves all linked HTML
artifacts directly. The development app route map currently covers the public/auth/
desk designs through #25 (including shared/filter entries), except Team and the
special error boundaries. Builder #26, embeds #27–28 and error designs #8 are not
mapped at their canonical app routes in `src/lib/design-preview.ts`. Most production
pages remain RoutePlaceholder; Home is a minimal ICG page and the error boundary is
still a placeholder. No application mapping or implementation changed in D10.

## Public site

| # | Page | Route | Replaces (legacy) | Figma archive | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 1 | Home | `/` | `index.php`, `lundayan-site-home.php` | Archive only; use HTML | P1 | [Prototype](prototypes/home.html) · [Handoff](handoff/home.md). Cinematic three-slide hero, seven-day strip, programme/news composition. Fixed demo content and remaining Home component gaps are explicit in the handoff. |
| 2 | Article | `/news/[slug]` | `lundayan-site-article.php` | Public / View Article | P1 | [Prototype](prototypes/article.html) · [System](../DESIGN.md). Shared story/event detail design. Use DESIGN.md Article (Read mode) and the prototype; no page-specific Markdown handoff exists. |
| 3 | Archive | `/archive` | `lundayan-site-archive.php` | Public / Archive | P1 | [Prototype](prototypes/archive.html) · [System](../DESIGN.md). Search, type/category/date filters, dated results and pagination. DESIGN.md and prototype are the specification; no dedicated handoff. |
| 4 | Calendar | `/calendar` | `lundayan-site-calendar.php` | Public / Calendar | P1 | [Prototype](prototypes/calendar.html) · [System](../DESIGN.md). Month/Agenda, selected-day programme, filters and calendar snapshot download. DESIGN.md and prototype; no dedicated handoff. |
| 5 | About | `/about` | `lundayan-site-about.php` | Public / About | P1 | [Prototype](prototypes/about.html) · [System](../DESIGN.md). Section patterns and current content are in DESIGN.md/prototype; client text/assets still need confirmation. No dedicated handoff. |
| 6 | Contact | `/contact` | `lundayan-site-contact.php` | Public / Contact | P1 | [Prototype](prototypes/contact.html) · [System](../DESIGN.md). Topics, validation and simulated submission. DESIGN.md/prototype; actual contact facts and delivery need build/client confirmation. No dedicated handoff. |
| 7 | Team | `/team` | `lundayan-site-team.php` | — | P3 | DEFERRED pending ICG decision. App Team route is only a scaffold; no Team design is claimed. |
| 8 | Not found / error | not-found / error boundaries (catalogue `/404`) | none | — | P3 | [Prototype](prototypes/not-found.html) · [Handoff](handoff/error-pages.md). Also [generic error](prototypes/error.html): public/desk retry examples and independent recovery links. Standalone prototypes; app boundary/status wiring remains unimplemented. |

## Authentication

| # | Page | Route | Replaces (legacy) | Figma archive | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 9 | Log in | `/login` | `lundayan-sign-in-page.php` | Public / Login | P2 | [Prototype](prototypes/login-identity.html) · [Handoff](handoff/login-identity.md). Campus Desk is the standard sign-in design. login.html is the alternate decorative Marquee-board direction; authentication is simulated. |
| 10 | Forgot password | `/forgot-password` | `forgot-password.php` (admin note only) | — | P2 | [Prototype](prototypes/login-identity.html?step=reset) · [Handoff](handoff/login-identity.md). Reset-request step inside sign-in; app preview supplies the step query. Email delivery remains build work. |
| 11 | Reset password | `/reset-password` | none | — | P2 | [Prototype](prototypes/reset-password.html) · [Handoff](handoff/reset-password.md). New-password and link-state design; real token/session behavior remains build work. |
| 12 | Accept invite | `/auth/invite` | `register.php` (public sign-up) | — | P2 | [Prototype](prototypes/accept-invite.html) · [Handoff](handoff/accept-invite.md). Invite-only account setup, decided November 15. No public sign-up design or new client sign-up decision. |

## Dashboard — shared

One dashboard shell for all roles; the sidebar shows only what the role can use.

| # | Page | Route | Replaces (legacy) | Figma archive | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 13 | Dashboard shell | `/dashboard/*` layout | `editor-nav.php`, `admin-side-bar.php` | — | P2 | [Prototype](prototypes/dashboard.html) · [Handoff](handoff/dashboard.md). Shared desk.css/desk.js shell, role navigation and mobile drawer. Query roles select sample people; they are not authorization. |
| 14 | Overview (home) | `/dashboard` | `editor-dashboard.php`, `admin-dashboard.php` | Writer / Reviewer / Admin Home | P2 | [Prototype](prototypes/dashboard.html) · [Handoff](handoff/dashboard.md). Month desk for writer plus [reviewer](prototypes/dashboard.html?role=reviewer) and [admin](prototypes/dashboard.html?role=admin). Review deadlines, publication/operations links and D04 width/spacing evidence are recorded. |
| 15 | Notifications inbox | `/dashboard/inbox` | `inbox-page.php` | Reviewer / Inbox | P2 | [Prototype](prototypes/dashboard-inbox.html) · [Handoff](handoff/dashboard-inbox.md). Dated notices and open tasks for every role; admin notices now open existing Users filters (D03). |
| 16 | Account settings | `/dashboard/account` | `account-settings.php` | Writer / Account Settings, Reviewer / Account Settings | P2 | [Prototype](prototypes/dashboard-account.html) · [Handoff](handoff/dashboard-account.md). Profile, password, email preferences and sessions. Admins control email/role/group; no production session changes are implied. |

## Dashboard — writer

| # | Page | Route | Replaces (legacy) | Figma archive | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 17 | My articles | `/dashboard/articles` | `add-article-page.php` list | Writer / Articles | P2 | [Prototype](prototypes/dashboard-articles.html) · [Handoff](handoff/dashboard-articles.md). Selected proof sheet with filters, search, grouping, row menu and archived filter. D04 spacing/wide-screen checks recorded; admin uses the same surface. |
| 18 | Create / edit article | `/dashboard/articles/[id]/edit` | `edit-article.php` | Writer / Create/Edit Article | P2 | [Prototype](prototypes/dashboard-editor.html?id=a2) · [Handoff](handoff/dashboard-editor.md). Selected ready-for-review document/checklist/conversation; new draft uses ?id=new. D05 layout polish complete. Rich-text format, media metadata/gallery and scheduling follow-ups remain open. |
| 19 | Archived articles | `/dashboard/articles?status=archived` | `article-archives-page.php` | Writer / Archives | P3 | [Prototype](prototypes/dashboard-articles.html?status=archived) · [Handoff](handoff/dashboard-articles.md). Implemented design as a filter of #17. No separate Archives-page decision remains for this prototype. |

## Dashboard — reviewer

| # | Page | Route | Replaces (legacy) | Figma archive | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 20 | Review queue | `/dashboard/reviews` | `for-review-article-page.php` | Reviewer / Review Articles | P2 | [Prototype](prototypes/dashboard-reviews.html) · [Handoff](handoff/dashboard-reviews.md). Selected review inbox, shared with #21. Queue, invitations and decisions are design examples; D05 width/navigation checks recorded. |
| 21 | Review article | `/dashboard/reviews/[id]` | `review-article.php` | Reviewer / Review Article | P2 | [Prototype](prototypes/dashboard-reviews.html?id=r1) · [Handoff](handoff/dashboard-reviews.md). Read/decide within the same inbox, including second-read fixes, request changes and confirmed step-down. Eligibility/quorum remain rebuild contracts. |

## Dashboard — admin

| # | Page | Route | Replaces (legacy) | Figma archive | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 22 | Manage users | `/dashboard/users` | `admin-manage-users.php` | Admin / Manage Users | P3 | [Prototype](prototypes/dashboard-users.html) · [Handoff](handoff/dashboard-users.md). People filters and person/invite sheets, including invite/deactivation states. Real permissions and delivery remain build work. |
| 23 | Contact messages | `/dashboard/messages` | `admin-inbox.php` | Admin / Inbox | P3 | [Prototype](prototypes/dashboard-messages.html) · [Handoff](handoff/dashboard-messages.md). Dated message inbox, reply/delivery states and topic next steps. Contact promise and operational policies need confirmed contracts. |
| 24 | Audit log | `/dashboard/audit` | `admin-audit-logs.php` | Admin / Audit Log | P3 | [Prototype](prototypes/dashboard-audit.html) · [Handoff](handoff/dashboard-audit.md). Filtered log, entry details and demo CSV export. Production audit attribution, retention and exports remain build work. |
| 25 | Site settings | `/dashboard/settings` | `admin-settings.php` | Admin / Site Settings | P3 | [Prototype](prototypes/dashboard-settings.html) · [Handoff](handoff/dashboard-settings.md). Featured stories, categories, About, contact and read-only mail status; D08 builder entry preserves section/admin context and protects unsaved work. Saves are simulated. |
| 26 | Embed widget builder | `/dashboard/settings/embeds` | widget generator in `admin-settings.php` | — | P3 | [Prototype](prototypes/dashboard-embeds.html?role=admin) · [Handoff](handoff/dashboard-embeds.md). D08 configuration, actual widget preview, matching local iframe code and clipboard fallback. Canonical app route is still a placeholder/unmapped; production origin/framing/native clipboard integration remain open. |

## Embeddable widgets

Shown inside iframes on other sites, so they need their own compact design.

| # | Page | Route | Replaces (legacy) | Figma archive | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 27 | Events widget | `/embed/events` | `events-widget.php` | — | P3 | [Prototype](prototypes/embed-events.html) · [Handoff](handoff/embed-events.md). D06 List/Calendar, narrow day picker, full selected-day programme and distinct states. Actual iframe checks from 280px; live feed and production framing remain open. |
| 28 | Announcements widget | `/embed/announcements` | `announcements-widget.php` | — | P3 | [Prototype](prototypes/embed-announcements.html) · [Handoff](handoff/embed-announcements.md). D07 Column/Row; stacked/two-/three-column wrapping, complete titles and states. Publication/expiry eligibility remains an open build contract. |

## Shared components

Design these once and reuse them across the pages above.

- Site header + mobile menu, site footer
- Article card (large, standard, compact list item), category kicker, tag chip
- Calendar month grid, event list item
- Announcement list item
- Search bar, filter chips, pagination / "view more"
- Status badge (draft, in review, approved, published, archived)
- Empty, loading and error states
- Form fields, buttons, toasts, confirmation dialog

## Remaining decisions and build wiring

- Team (#7) remains the only deferred page in this inventory; do not design/build it
  without the client decision. Accounts are invite-only. Archived articles (#19)
  use the existing proof-sheet filter.
- Missing page-specific public handoffs are identified above. Their current design
  evidence is the prototype and DESIGN.md; D10 did not invent new handoff files or
  re-review all public pages visually.
- Current `next.config.ts` declares `X-Frame-Options: DENY` on all paths, including
  embed routes. The successful Python-server iframe tests do not certify the Next
  preview or external hosting. Canonical origin, headers, permissions and optional
  readiness/resizing protocols remain integration work.
- The D09 HTML examples are served as ordinary 200 responses locally. Correct
  not-found HTTP status and reset of the original failed route remain build work.
- Real feeds, media/alt/credit/gallery handling, rich-text storage/rendering,
  publication/review/expiry rules, authentication and email remain subject to the
  existing [rebuild plan](../tasks/plan.md), not the sample query parameters.
- D01–D10 scope/evidence and remaining feedback are recorded in the
  [design tasks](../tasks/design-todo.md). The rebuild plan/task state was not
  changed by the design completion pass.
