# Handoff — Inbox (what happened, by day)

Prototype: `design/prototypes/dashboard-inbox.html` (+ `desk.css`, `desk.js`)
Route: `/dashboard/inbox` (PAGES #15); in `npm run dev` it shows at that route.
Designed 2026-11-16 as a single direction (no concept round, at the user's request).
Rules: DESIGN.md › Dashboard › "Inbox: what happened, by day" and "Segmented control".

The inbox is every role's log of what happened to their work. It replaces the legacy
`inbox-page.php`, which only listed review invitations; accepting or declining a review
now happens on the Reviews page, and the inbox links there.

## Components
| `data-component` | Notes |
| --- | --- |
| `MarkAllRead` | Day outline button at the right of the tools row, beside the tabs and above the list. Disabled when nothing is unread. Toast with Undo. |
| (segmented control) | `.seg` in `desk.css`: All N / Unread N, `role="tablist"`, only the selected tab is a tab stop, arrow keys switch, `?show=unread`. |
| `NoticeDays` / `NoticeDay` | Notices grouped by the day they happened, newest first. Day head: Anton numeral + weekday label (`TODAY` for today), `h2` with the full date for screen readers. |
| `Notice` | Read toggle (the unread dot, a 44px button) + one link: sentence, optional quote (2 lines), meta (time + one short fact), current status badge, chevron. Read notices are Ink Muted. Panels 820px and wider (container query) move time, fact and badge into a right-hand column. Opening it marks it read. |
| `InboxSide` / `WaitingOnYou` | Open tasks that outlive their notice, each with one named action beside its text. On phones it comes before the notices, and is hidden when nothing is waiting. |
| `EmailNote` | One line under the list: which notices are also emailed and to which address, linking to Account › Email. |
| `InboxEmpty` | Empty inbox (per role) and "You've read everything" for the Unread view. |

## States
- `?role=writer` (default, Lea): 6 notices over 5 days, 3 unread, 1 task.
- `?role=reviewer` (Paolo): 5 notices, 3 unread, 3 tasks (a second read, two new requests).
- `?role=admin` (Maria): 4 notices, 2 unread, 1 task (an expired invite).
- `?show=unread`, `?empty=1`, `?state=loading`, `?state=error`.
- Read state is kept in `sessionStorage` in the prototype so going to an article and back keeps it.

## Data
A `notifications` table (proposed): `id`, `recipient_id`, `kind`, `actor_id` (nullable),
`article_id` (nullable), `review_id` (nullable), `created_at`, `read_at` (null = unread),
plus a small payload for the quote and the meta fact (e.g. request count, needed-by date).
The sentence is built from `kind` + actor + `articles.title` in the UI, not stored.
The badge reads the article's current `status`, not the status at the time of the notice.

Kinds shown in the prototype:
- writer: `review_accepted`, `changes_requested` (with `review_comments` note and request count),
  `approved` (with go-live time), `goes_live_soon`, `published`, `password_changed`;
- reviewer: `review_requested` (with needed-by), `resubmitted` (round, needed-by, note), `published`;
- admin: `invite_accepted`, `invite_expired`, `contact_messages` (a daily roll-up),
  `reviewer_stepped_down`.

"Waiting on you" is derived, not stored: open review requests, drafts with unresolved
requests, expired invites. The sidebar count is unread notifications.

## Open questions
- Which kinds are also emailed, and is that per person (Account) or fixed? The prototype shows two per role.
- How long are notices kept (all time, or e.g. the last 90 days with older ones cleared)?
- Should contact messages notify every admin or only one on duty?
- Security notices (password changed, new sign-in): which events, and should they also email always?
- Mobile push or browser notifications are out of scope for now.

## Revised after critique (2026-11-16)
The page is now full width (fluid) so wide screens fill with notices; kind icons were removed; read notices are muted; Mark all moved beside the tabs; the email section became one line; open tasks lead on phones. Snapshot: `.impeccable/critique/`.

## Admin destinations — D03 (2026-11-16)

All admin notices now open existing pages with `role=admin` retained:

| Notice / task | Destination |
| --- | --- |
| Jo Ramos accepted the invite | Users filtered by `q=jo.ramos@plpasig.edu.ph` (Jo's active record). |
| Rafael's invite expired | Users with `status=invited` and `q=rafael.santos@plpasig.edu.ph` (the matching expired invite). |
| Review invite (Waiting on you) | The same filtered expired-invite list. Open the row to use the existing Resend action; following the link itself sends nothing. |
| Bea Villanueva stepped down | Users filtered by `q=bea.villanueva@plpasig.edu.ph` (Bea's reviewer record). |
| Contact-message roll-up | Existing Messages page. |

These use the supported Users search/status parameters rather than inventing a person
deep link. The obsolete Users placeholders and later-round handlers were removed from
Inbox. Opening a notice still marks it read before navigating, and the read state survives
Back and reload in this prototype. Following a waiting task does not mark its notice read;
the task remains until the underlying work is resolved. Writer and reviewer destinations
retain their existing behavior. Production still needs recipient-scoped notification data
and authenticated permissions; these are prototype links.
