# Handoff — Article editor (ready for review)

Prototype: `design/prototypes/dashboard-editor.html` (+ `desk-editor.js`, `desk.css`)
Route: `/dashboard/articles/[id]/edit` (PAGES #18). New article: `?id=new`.
Chosen 2026-11-15 over guided steps (`editor-a.html`) and a writing page with tabbed
settings (`editor-b.html`); `editor-c.html` is the original sketch. All three stay as
references only. Rules: DESIGN.md › "Article editor: ready for review".

## Components
| `data-component` | Notes |
| --- | --- |
| `EditorBar` | The `#bar` wrapper sticks beneath the mobile desk bar (at the top on desktop). Its inner controls can wrap, and their measured height positions the formatting toolbar. Back to My articles, `h1`, badge, autosave line, Preview and Send remain the same. On phones the `#macts` wrapper pins Preview/Send at the bottom, with wrapping and safe-area padding. |
| `ArticleDocument` | The Card White document fills its column; only `.doc-inner` is capped at 760px. Type/category pills and formatting/tag-removal controls have 44px targets. Event fields use three columns only when the document has 36rem available, otherwise one. Title/summary, cover, toolbar, story and tags retain their original order and behavior. |
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

## Spacing, width and sticky controls — D05 (November 16, 2026)

The outer editor already filled all 1656px beside the sidebar at a 1920px viewport;
keep that fluid layout and the intentional 760px inner measure. The original 1024px
viewport rule squeezed the writing measure to 176px and allowed event fields to cross
the document boundary. Two columns now require at least 64rem of actual work-area
width; otherwise the checklist/conversation follows the document. The gap is 32px,
with existing 40px desktop / 24px-by-16px mobile outer padding retained.

Use the D04 spacing rhythm: 24px before the title; 32px before event details, cover
and toolbar; 24px from toolbar to story; 16px above ruled headings. Event detail groups
have 16px padding and gaps. Review requests may wrap with 12px vertical padding.
Long text wraps within the document and conversation. The 760px editor measure remains
independent of the page's outer width.

Sticky positioning belongs to `#bar` and `#macts`, whose parent spans the whole editor;
sticking only their child bars constrains them to a wrapper of their own height.
`ResizeObserver` measures the editor bar, formatting toolbar and phone actions. Runtime
CSS variables track their real heights as text/viewport changes, rather than assuming
every bar is 64px. The toolbar sticks below the visible desk/editor bars; the wide
review column clears the editor bar and scrolls within the remaining viewport.
Checklist shortcuts scroll immediately to a field with room for the current chrome,
then focus it, so repeated keyboard actions never wait for a scroll animation.

The type/category selects, formatting buttons and tag-remove controls are 44px;
tag rows wrap within the document. Bottom actions may wrap for larger text and include
`safe-area-inset-bottom`. No new colors, font roles, design tokens or motion were added.
Autosave, review submission, request resolution and the stand-in rich-text toolbar
are unchanged. The rich-text storage/renderer decision remains an implementation blocker.
