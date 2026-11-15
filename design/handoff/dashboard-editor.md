# Handoff — Article editor (ready for review)

Prototype: `design/prototypes/dashboard-editor.html` (+ `desk-editor.js`, `desk.css`)
Route: `/dashboard/articles/[id]/edit` (PAGES #18). New article: `?id=new`.
Chosen 2026-11-15 over guided steps (`editor-a.html`) and a writing page with tabbed
settings (`editor-b.html`); `editor-c.html` is the original sketch. All three stay as
references only. Rules: DESIGN.md › "Article editor: ready for review".

## Components
| `data-component` | Notes |
| --- | --- |
| `EditorBar` | Sticky. Back to My articles, `h1` ("Edit draft" / "New article"), status badge, autosave line (`role="status"`: "Saving…" → "Saved at …"), Preview, marigold "Send for review". Phones: Preview and Send in a sticky bottom bar. |
| `ArticleDocument` | Card White, 760px measure. Type and category select pills, title and summary edited in place, `EventBlock` (events only: date, starts, ends, venue), cover drop zone or the chosen photo, sticky formatting toolbar, story, tags (`TagInput`: Enter or comma adds, × removes). |
| `ReadyChecklist` | Live list: title, summary (≤ 200), type and category, event date and time, venue, the story (or the reviewer's specific request), cover photo (recommended). Count "N left" / "Ready" in a polite status. Each item is a button that scrolls to and focuses its field. |
| `ReviewConversation` | With a review: the reviewer's comment, each request as a row ("Go to venue", "Mark as fixed"; fixed rows strike through), optional reply. Without one: reviewer select, "No comments yet.", optional note. |

## States
- `?id=a2` (default): the draft Paolo sent back, two requests open.
- `?id=<published article>`: notice "You are editing a new draft. The published version stays on the site until this one is approved."
- in review: notice that editing takes it back to drafts. approved: notice that changes need approval again.
- `?id=new`: blank; News by default; the event block appears when Type is Event.
- Send with items left: toast with the count, nothing sent. Send when ready: badge → In review, autosave line "Sent to <reviewer> at …", both Send buttons disabled "Sent for review".

## Data
`articles.title`, `excerpt` (max 200), `type`, `category_id`, tags, `cover` (+ alt
text, still to design), gallery (still to design), `event_starts_at`, `event_ends_at`,
venue, body (format undecided), reviewer assignment, review comments with resolvable
requests (`resolved_at` per request), revision status. Editing a published or approved
revision creates a new draft revision (proposed revision model). Autosave per revision.

## Open questions
- **Rich-text format** (blocks vs HTML vs Markdown) and video support: blocks the toolbar.
- Should reviewer requests be stored as separate checklist items, or parsed from one comment? The prototype shows them as items.
- Cover alt text, photo credit and gallery ordering screens are not designed yet.
- Scheduling ("goes live at") is not in this editor yet; decide whether writers or reviewers set it.
- Who can be chosen as reviewer (eligibility, self-review) is still pending in the contracts.
