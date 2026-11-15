# Handoff — Reviews (the review inbox)

Prototype: `design/prototypes/dashboard-reviews.html` (+ `desk-review.js`, `desk.css`, `desk.js`)
Routes: `/dashboard/reviews` (PAGES #20) and `/dashboard/reviews/[id]` (PAGES #21); in the
prototype the review is `?id=r1`. Chosen 2026-11-15 over a deadline agenda
(`review-a.html`) and a queue split by kind of read (`review-b.html`); `review-c.html` is
the original sketch. All three stay as references only.
Rules: DESIGN.md › Dashboard › "Reviews: the review inbox".

One page, two panes: the reviewer's queue on the left, the selected review on the right
with the decision at its head. In the Next.js build the two routes can share one layout
(list as a persistent column, review as the nested route), so moving to the next review
keeps the list in place.

## Components
| `data-component` | Notes |
| --- | --- |
| `ReviewList` | Card White column (380px, sticky, full height on desktop). `h1` "Reviews", segmented tabs Waiting / Decided with counts (`role="tablist"`, arrow keys switch). |
| `ReviewRow` | One button per waiting review: kind ("New request"), type, writer, title, round and fixes ("Round 2, 2 of 2 fixed"), needed-by date or "No date". The open one has `aria-current="true"`. |
| `DecidedRow` | What you did, when, writer, title, the article's current badge. Not interactive. |
| `ReviewPane` / `ReviewHead` | Meta line, title (`h2`, takes focus when a review opens), decision on the right from 1280px. Phones: "All reviews" back button. |
| `ReviewDecision` | Approve (marigold), Ask for changes (inline form: one request per line, optional note, "Send back to <writer>"), Step down (confirm dialog). After deciding: status line + "Next review" / "Done". |
| `ReviewInvite` | For invitations: Accept / Decline. Decline shows a toast with Undo. Only the summary is shown before accepting. |
| `FixedRequests` | Second reads: "<writer> fixed your N requests", their note, each request with its fix. |
| `ReviewArticle` | Read-only article as the reader meets it; on second reads, additions are wrapped in `<ins>` (marigold wash 45%, 2px underline). |
| `CaughtUp` | Empty pane when nothing is waiting, with "See what you decided". |
| `ConfirmDialog` | "Step down from this review?" Focus starts on Cancel. |

## States
- `?id=r1` (default): code camp, round 2, both requests fixed, venue and deadline highlighted.
- `?id=r2`: first read (hackathon rules). `?id=r3`, `?id=r4`: invitations (r4 has no date).
- `?empty=1`: nothing waiting.
- Ask for changes with no requests: toast "Add at least one request first.", focus stays in the field.
- The sidebar's Reviews count follows the number waiting.

## Data
- `review_assignments` (or equivalent): `article_id`, `reviewer_id`, `state`
  (invited / accepted / declined / stepped_down / decided), `invited_at`, `responded_at`.
- Revision being reviewed: `articles.title`, `excerpt`, `type`, `category_id`, `cover`,
  `event_starts_at`, `event_ends_at`, venue, body; the round number (how many times it
  has been sent for review).
- **Needed by:** a date the writer gives when sending (or derived from
  `event_starts_at` / a sign-up deadline) and the reason line ("Sign-ups close
  November 28"). Not in the data model yet.
- Review decision: `approved` / `changes_requested`, with the requests as separate rows
  (text, later `resolved_at` and the writer's fix note) plus an optional note. These are
  the same rows the editor's `ReviewConversation` shows.
- What changed: a diff between the revision the reviewer last saw and the current one.
- Decided list: the reviewer's recent decisions with the article's current status.

## Open questions
- **Diff source:** stored revisions diffed server side, or tracked changes in the editor?
  Depends on the rich-text format decision.
- Is "needed by" set by the writer, derived from event dates, or both?
- Can a reviewer edit small things (typos) themselves, or only ask? The prototype only asks.
- Approve: does approval publish on the schedule, or does someone else press Publish?
  The toast says "goes live as scheduled"; scheduling is still undecided (see the editor handoff).
- Queue order: the prototype keeps the order requests arrived; sorting by needed-by date
  may suit reviewers better.
- Reviewer eligibility and self-review are still pending in the contracts.
