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
| `ArticleFilters` | Row 1: status chips with counts (marigold = selected). Row 2: search (titles) and "Group by" (Month edited, Event month), separated by 16px. On phones Group by is a full-width row with its select aligned to the search field's right edge. |
| `ProofSheet` | Month sections under a 3px Ink rule with a count; 16px from rule to heading, 16px from heading to proofs. Auto-fill grid, columns ≥ 260px, 32px row / 24px column gaps. First three months, then "Show N older months" (focus moves to the first new month). |
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

## Spacing and width — D04 (November 16, 2026)

The page already used `.desk-content.fluid` and filled the available work area at
1920px. Keep that wrapper and the photo-led auto-fill grid; a month with fewer items
naturally has empty tracks, which is not an outer-width defect.

- Status chips and the search/group row are 16px apart. The first month's rule starts
  32px after the controls; later months retain 40px separation on desktop, 32px on phones.
- Desktop proofs use 12px cover-to-text spacing and reserve 56px at the right for a
  44px action button plus a 12px gap. The button's hit area stays inside the card.
  Cover badges sit 12px from the lower-left corner.
- Phone rows keep the chosen 112px thumbnail (88px below 380px), with 16px padding
  on every side and a 12px image/text gap. The 44px action sits 8px from the top and
  right. Text reserves enough space to avoid the button's hit area.
- Type, category and event date wrap as whole metadata units when they fit, rather
  than leaving a single trailing letter on the next line. Unbroken long titles and
  categories can still wrap inside the card. No text or dates are hidden to fit.
- Empty/error panels start at the same 32px distance as the first month and use
  24px inner padding on phones (32px desktop). Loading placeholders follow the grid.
- Photo zoom/underline hover feedback is restricted to a fine pointer with hover;
  reduced-motion mode retains the existing static equivalent. No motion was added.
