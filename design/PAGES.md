# ICG — Pages to prototype

Every screen the ICG rebuild needs a new design for, based on the legacy PHP app's features and the ICG Figma file. Prototype files go in `design/prototypes/` (see the `icg-prototype` skill).

**Priority:** P1 = needed for the first client demo (public site) · P2 = needed to author and review content · P3 = admin and supporting screens.
**Figma frame:** the empty frame already planned in the ICG Figma file, or "—" if none exists yet.

## Public site

| # | Page | Route | Replaces (legacy) | Figma frame | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 1 | Home | `/` | `index.php`, `lundayan-site-home.php` | Public / Home (Mock 6 direction) | P1 | Featured hero carousel, latest stories, calendar + announcements sidebar |
| 2 | Article | `/news/[slug]` | `lundayan-site-article.php` | Public / View Article | P1 | Body, cover, gallery, category + tags, share, related stories; event details block when the article is an event |
| 3 | Archive | `/archive` | `lundayan-site-archive.php` | Public / Archive | P1 | Search, category chips, tag filters, year/month filter, paginated list or table |
| 4 | Calendar | `/calendar` | `lundayan-site-calendar.php` | Public / Calendar | P1 | Month grid, upcoming events list, event detail popover |
| 5 | About | `/about` | `lundayan-site-about.php` | Public / About | P1 | Admin-editable sections (who we are, mission, roles) |
| 6 | Contact | `/contact` | `lundayan-site-contact.php` | Public / Contact | P1 | Form, address, office hours, map, socials; success and error states |
| 7 | Team | `/team` | `lundayan-site-team.php` | — | P3 | Confirm with client whether ICG still wants a team page |
| 8 | Not found / error | `/404`, error boundary | none | — | P3 | Branded 404 and generic error page |

## Authentication

| # | Page | Route | Replaces (legacy) | Figma frame | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 9 | Log in | `/login` | `lundayan-sign-in-page.php` | Public / Login | P2 | Email + password; error state |
| 10 | Forgot password | `/forgot-password` | `forgot-password.php` (admin note only) | — | P2 | Request a reset email; "check your inbox" state |
| 11 | Reset password | `/reset-password` | none | — | P2 | Set new password from the email link |
| 12 | Accept invite | `/auth/invite` | `register.php` (public sign-up) | — | P2 | Invited user sets name and password. Accounts are invite only (decided 2026-11-15); no public sign-up page |

## Dashboard — shared

One dashboard shell for all roles; the sidebar shows only what the role can use.

| # | Page | Route | Replaces (legacy) | Figma frame | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 13 | Dashboard shell | `/dashboard/*` layout | `editor-nav.php`, `admin-side-bar.php` | — | P2 | Sidebar, top bar, role-based nav, mobile drawer |
| 14 | Overview (home) | `/dashboard` | `editor-dashboard.php`, `admin-dashboard.php` | Writer / Reviewer / Admin Home | P2 | Per-role widgets: writer drafts and statuses, reviewer pending reviews, admin site stats |
| 15 | Notifications inbox | `/dashboard/inbox` | `inbox-page.php` | Reviewer / Inbox | P2 | Review invitations (accept/decline), review decisions, mentions |
| 16 | Account settings | `/dashboard/account` | `account-settings.php` | Writer / Account Settings, Reviewer / Account Settings | P2 | Name, email, avatar, password |

## Dashboard — writer

| # | Page | Route | Replaces (legacy) | Figma frame | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 17 | My articles | `/dashboard/articles` | `add-article-page.php` list | Writer / Articles | P2 | List with status filter (draft, in review, approved, published, archived), search |
| 18 | Create / edit article | `/dashboard/articles/[id]/edit` | `edit-article.php` | Writer / Create/Edit Article | P2 | Rich text editor, title, excerpt, cover, gallery, type, category, tags, event fields, schedule, reviewer assignment, review comments panel, status actions |
| 19 | Archived articles | `/dashboard/articles?status=archived` | `article-archives-page.php` | Writer / Archives | P3 | Could be a filter of #17 rather than its own page |

## Dashboard — reviewer

| # | Page | Route | Replaces (legacy) | Figma frame | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 20 | Review queue | `/dashboard/reviews` | `for-review-article-page.php` | Reviewer / Review Articles | P2 | Assigned articles with decision status. Prototype: `dashboard-reviews.html` (review inbox, shared with #21) |
| 21 | Review article | `/dashboard/reviews/[id]` | `review-article.php` | Reviewer / Review Article | P2 | Read-only article preview, comments thread, approve / request changes, step down. Prototype: `dashboard-reviews.html?id=r1` |

## Dashboard — admin

| # | Page | Route | Replaces (legacy) | Figma frame | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 22 | Manage users | `/dashboard/users` | `admin-manage-users.php` | Admin / Manage Users | P3 | User table, invite user, change role, deactivate |
| 23 | Contact messages | `/dashboard/messages` | `admin-inbox.php` | Admin / Inbox | P3 | Message list, detail view, reply by email, replied status |
| 24 | Audit log | `/dashboard/audit` | `admin-audit-logs.php` | Admin / Audit Log | P3 | Filter by user, action, date; CSV export |
| 25 | Site settings | `/dashboard/settings` | `admin-settings.php` | Admin / Site Settings | P3 | Tabs: general and social links, contact info, About page sections, featured articles, categories |
| 26 | Embed widget builder | `/dashboard/settings/embeds` | widget generator in `admin-settings.php` | — | P3 | Pick widget, options, live preview, copy embed code |

## Embeddable widgets

Shown inside iframes on other sites, so they need their own compact design.

| # | Page | Route | Replaces (legacy) | Figma frame | Priority | Notes |
|---|------|-------|-------------------|-------------|----------|-------|
| 27 | Events widget | `/embed/events` | `events-widget.php` | — | P3 | List and calendar views; must look right at narrow widths |
| 28 | Announcements widget | `/embed/announcements` | `announcements-widget.php` | — | P3 | Column and row layouts |

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

## Before prototyping

- Add 390 px (mobile) frames in Figma; none exist yet.
- Decide with the client: Team page (#7), whether Archived (#19) is its own page.
