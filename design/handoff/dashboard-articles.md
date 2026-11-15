# Handoff — My articles (the proof sheet)

Prototype: `design/prototypes/dashboard-articles.html` · Route: `/dashboard/articles` (PAGES #17, #19)
Purpose: everything a writer has written (admins: every article, titled "Articles"),
shown as their own archive of cover photos. Chosen 2026-11-15 over a filtered table
(`dashboard-articles-b.html`) and a status board (`dashboard-articles-c.html`), which stay
as references only. Rules: DESIGN.md › "My articles: the proof sheet".

## Components
| `data-component` | Notes |
| --- | --- |
| Header | `h1` "My articles", muted line "11 articles · 1 needs you", marigold "New article" (top bar + on mobile). |
| `ArticleFilters` | Row 1: status chips with counts (marigold = selected). Row 2: search (titles) and "Group by" (Month edited, Event month). |
| `ProofSheet` | Month sections under a 3px Ink rule with a count. Auto-fill grid, columns ≥ 260px. First three months, then "Show N older months" (focus moves to the first new month). |
| `ProofCard` | 3:2 cover (cropped 50% 40%) with the status badge on it; meta (type, category, event date); title as the card's one link, stretched over the card; one status line; 44px "More actions" button above the link. No cover: "No cover photo yet" block. Below 640px: compact row, 112px thumbnail (88px below 380px), badge under the text. |
| Card menu | `role="menu"`, arrow keys, Escape returns focus. Edit (published: "starts a new draft"), View on the site, Archive, Delete draft, Take back from review, Restore — by status. |
| `ConfirmDialog` | Native `<dialog>` for Archive, Delete draft, Take back. Focus starts on Cancel; action is an Ink fill. |
| `Toast` | Confirms; Archive and Restore offer Undo. |
| `EmptyState` | No articles yet (+ New article); nothing matches (+ Clear filters, which resets status, search and grouping). |

## States (prototype URL switches)
`?status=`, `?q=`, `?group=event` (written back to the URL), `?empty=1`,
`?state=loading` (placeholder covers and lines), `?state=error`, `?role=admin`.

## Data
`articles.id`, `title`, `type`, `categories.name`, `status`, `updated_at`, `cover`
(image + crop), `event_starts_at`, reviewer (review assignments), scheduled publish time,
changes-requested comment and author, author (admin view). Group by month of
`updated_at` (or `event_starts_at`), newest first; load older months on demand
(cursor by month). Archived is a filter of this page, not its own page.

## Open questions
- Archive/restore semantics are undecided (public archive vs withdrawal). Restore
  returns the article to Published in the prototype; confirm.
- "Edit" on a published article starting a new draft follows the proposed revision model.
- How many months to load at first (3 in the prototype) for admins with many articles.
- Spacing pass deferred by the user along with the month desk.
