# Handoff — Audit log (admin)

Prototype: `design/prototypes/dashboard-audit.html` (+ `desk.css`, `desk.js`)
Route: `/dashboard/audit` (PAGES #24); in `npm run dev` it shows at that route. Admin only.
Designed 2026-11-16 as a single direction. Replaces `admin-audit-logs.php` (user, user type,
action and date filters, a paged table with a numeric ID column, CSV export).
Rules: DESIGN.md › Dashboard › "Audit log (admin)" and "Side sheet".

## Components
| `data-component` | Notes |
| --- | --- |
| `DownloadButton` | The page's one marigold action; the download icon button in the mobile bar does the same. Disabled when nothing matches or the dates are wrong. |
| `AuditFilters` | Area chips with counts, search, person select, date-range select. |
| `DateRange` | From / To date fields, shown for "Choose dates…". At most a year; errors under the field. |
| `AuditScope` | "28 entries" (polite status) and the dates covered. |
| `AuditTable` / `AuditDay` / `AuditEntry` | One `<table>`; a `<tbody>` per day with a `scope="rowgroup"` header. The sentence button is stretched over the row. Stacked rows below 1280px. |
| `SideSheet` / `EntryFacts` / `EntryChange` / `EntryNote` | Read-only entry sheet (shared side-sheet styles now live in `desk.css`). |
| `AuditEmpty`, `AuditError` | Filtered empty, empty range, failed load. |

## States (demo)
- Default: last 30 days (October 17 to November 15, 2026), 28 entries; you are Maria Santos.
- `?range=90` adds Miguel Torres's deactivation (October 2). `?range=custom&from=2025-11-15&to=2026-11-15`.
- `?area=security`, `?who=The%20desk`, `?q=hackathon`, `?id=E-1035` (opens an entry), `?state=loading`, `?state=error`.
- Date errors: start after end; a range over a year.
- Download: the CSV includes only what the filters show; afterwards the export appears at the top of the log.

## Data
- `audit_entries` (append only; no update or delete for anyone, including admins): `id`,
  `created_at` (timestamptz; shown in Philippine Time), `actor_id` (null = the desk itself),
  `actor_role` at the time, `area` (`articles` | `reviews` | `people` | `messages` | `settings` |
  `security`), `action` (a code such as `group_changed`, `invite_sent`, `reply_bounced`,
  `audit_exported`), `target_type`, `target_id`, `target_label` (kept so the entry still reads
  after the target is deleted), `changes` (jsonb: `[{field, before, after}]`), `note`,
  `user_agent_summary` ("Chrome on Android"; not the raw user agent, not the IP, unless the
  client wants IPs kept).
- The sentence ("Changed Joy Bautista's group") is built from `action` + `target_label` at read
  time, so wording can change without rewriting history.
- Never store message bodies, passwords, tokens or long text (About sections are logged as
  "edited" without the text). See `tasks/contracts.md` › Audit.
- Queries are bounded: a date range is required and at most a year; page in 50s (the prototype
  shows everything in range).
- CSV export (T42): the filtered rows only, UTF-8 with BOM, columns as in the prototype
  (Entry, Date, Time, Person, Role, Area, Action, What happened, On, Changed, From). Prefix any
  cell starting with `=`, `+`, `-`, `@`, tab or carriage return with `'` (formula injection).
  Each export writes its own `audit_exported` entry with the range and filters.
- Actions to log, from the other pages' handoffs: invites (sent, resent, withdrawn, accepted,
  expired), role and group changes, deactivate / reactivate, log-ins and failed log-ins,
  password changes and "log out everywhere", review requests and decisions, step-downs,
  publish / schedule / archive / restore, gallery edits on published stories, message replies,
  bounces, closes, reopens and deletes, settings changes, audit exports.

## Open questions
- **Retention:** how long are entries kept? (`tasks/plan.md` lists message and audit retention as open.)
- Should IP addresses be stored, and for how long? The prototype shows only browser and system.
- Should successful log-ins be logged for everyone, or only failures and admin log-ins? They are most of the volume.
- Does anyone besides admins see any part of the log (for example a writer seeing their own article's history)?
- Do failed log-ins need an alert to admins (Inbox notice) past a threshold?
