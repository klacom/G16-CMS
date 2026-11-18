# Handoff — Messages (admin)

Prototype: `design/prototypes/dashboard-messages.html` (+ `desk.css`, `desk.js`)
Routes: `/dashboard/messages` and `/dashboard/messages/[id]` (PAGES #23); in `npm run dev`
both show the prototype. Admin only.
Designed 2026-11-16 as a single direction. Replaces `admin-inbox.php` (a paged list and a
detail view with no reply, status or search).
Rules: DESIGN.md › Dashboard › "Messages (admin)".

## Components
| `data-component` | Notes |
| --- | --- |
| `MessageList` | 380px Card White column, sticky and scrolling on its own on desktop; the first screen on phones. |
| `MessageTabs` | Segmented control: Open / Replied / Closed with counts. Arrow keys move between tabs. `?tab=`. |
| `MessageFilters` | Search (name, email, subject, message text; `?q=`) and topic select (`?topic=`, the six contact-form topics). |
| `DayHead` | Anton day numeral, weekday label, month; `h2` with the full date for screen readers; sticky. |
| `MessageRow` | One button per message. Unread: Ink dot, bold name. Meta line: topic + where it stands. |
| `MessagePane` / `MessageHead` | Meta, subject, state line ("Reply by …"), Mark as read/unread, Close without replying, Reopen. |
| `IncomingMessage` / `SentReply` | Letters in date order. Sender block with copy-email button. Sent replies show delivery. |
| `EventDetails` / `AccountRequest` / `AboutStory` | The topic's next step: Draft an event article, Invite <name>, Edit the article. |
| `ReplyNotDelivered` | Error Wash panel under a bounced reply, with a "Send it to" field and Send again. |
| `ReplyBox` | Reply textarea (5,000 characters), signature, Send reply, Mark as replied. |
| `DeleteMessage` / `ConfirmDialog` | Delete asks first (can't be undone, removes it for every admin). |
| `ListEmpty`, `AllAnswered`, `NoMessages`, `ListError` | Empty, filtered-empty and failed states. |

## States (demo)
- Default: 10 messages, 5 open (3 unread, 1 overdue, 1 with a bounced reply), 3 replied, 2 closed; you are Maria Santos. Prototype "today" is Sunday, November 15, 2026.
- `?id=m1` event submission, `m2` account request, `m3` question with a phone number, `m4` overdue correction tied to a story, `m5` bounced reply, `m6`–`m8` replied, `m9`–`m10` closed.
- `?tab=replied|closed`, `?topic=event`, `?q=job`, `?empty=1`, `?state=loading`, `?state=error`.
- Reply errors: sending only the greeting; resending to the same address that bounced; an empty or malformed address.
- Close offers Undo in the toast; Mark as replied offers Undo; Delete uses the confirmation dialog.

## Data
- `contact_messages`: `id`, `topic` (`question` | `account` | `event` | `correction` | `photo` | `partner`),
  `first_name`, `last_name`, `email`, `phone` (optional), `subject`, `body`, `created_at`,
  `read_at` (per admin or shared: **undecided**, see below), `status` (`open` | `replied` | `closed`),
  `closed_at`, `closed_by`, and for events `event_title`, `event_starts_at`, `event_place`.
  A correction sent from a story's "Report a correction" link should carry `article_id`
  (the public article page doesn't pass it yet).
- `contact_replies`: `id`, `message_id`, `sent_by`, `to_email`, `body`, `sent_at`,
  `delivery_status` (`sending` | `sent` | `bounced`), `bounced_at`, `marked_only` (true for
  "Mark as replied", no email sent). Delivery needs the mail provider's bounce webhook.
- "Reply by" = `created_at` plus two school days (Monday to Friday). Holidays and class
  suspensions aren't counted yet.
- Sidebar count = unread open messages. The admin Inbox gets one daily roll-up notice
  ("3 new messages came in through the contact form"), which now links here.
- Audit log (PAGES #24): reply sent, marked as replied, closed, reopened, deleted. Per
  `tasks/contracts.md`, never store message bodies in the audit log.
- Replies are sent from `icg@plpasig.edu.ph` with the admin's name in the signature. Answers
  go to that mailbox; the desk does not receive email.

## Open questions
- **Mail provider** (`tasks/decisions.md`: unresolved): sending, bounce reporting and the
  sender address all depend on it.
- Is "read" shared by all admins (one person reads it, it's read for everyone) or per admin?
  The prototype treats it as shared.
- Spam and abuse: is Close enough, or should there be a spam folder and rate limits on the form?
- Retention: how long are messages kept? Photo-removal requests contain personal details.
- Should "Draft an event article" prefill the editor from the message (title, date, time,
  place)? The prototype links to a blank draft.
- Should one admin be able to claim a message ("Nina is replying") so two people don't answer it?
- Saved replies for common answers (account requests, event received)?
