# Home — handoff

Prototype: `design/prototypes/home.html` · Route: `/` · The front page of PLP's news and events record: today's lead story, the week's events, and a way into the archive.

Theme: broadsheet + calendar spine. Tokens in `design/tokens.css`, Tailwind theme in `design/tailwind.config.js` (copy `theme.extend`).

## Components

| Component | Props | States to handle |
| --- | --- | --- |
| `Masthead` | `publicationName`, `tagline` | Name is a placeholder until the client decides |
| `SectionNav` | `items[]` (label, href), `current` | Scrolls sideways on mobile; current item in green |
| `WeekStrip` | `startDate`, `days` (14), `eventCounts` by date, `selectedDate`, `onSelect` | Today (green underline), selected (green fill), 0 to 3+ gold dots (cap at 3), prev/next two weeks, today scrolled into view on mobile |
| `LeadStory` | article | Missing cover image (fall back to a headline-only layout), very long headline |
| `Briefs` | articles[] (title, date) | 0 items hides the block; show 4 max |
| `ArticleCard` | article, `variant`: `with-image` or `text` | No image, long headline, missing excerpt |
| `WhatsOnRail` | `selectedDate`, `eventsOnDate[]`, `upcoming[]` | Empty day ("Nothing scheduled" + calendar link), heading reads "Today, …" or the weekday for other dates |
| `AnnouncementList` | announcements[] | Empty hides the block |
| `LatestStories` | articles[] (4) | Fewer than 4 |
| `OnThisDay` | `date`, items[] (year, article) | No past items for the date: hide the section |
| `SiteFooter` | settings (address, hours) | — |

## Data

All from the new data model in the migration plan.

| Area | Query |
| --- | --- |
| Lead story | `articles` where `status = 'published'` and `is_featured`, newest `published_at`; fallback: newest published |
| Secondary stories (3) | next newest published, excluding the lead |
| In brief (4) | published `news` with no cover image, or the next 4 |
| Week strip dots | count of `articles` where `type = 'event'` grouped by date of `event_starts_at`, for the 14 visible days |
| What's on: selected day | events where `event_starts_at` falls on `selectedDate`, ordered by time; show time, `title`, `location` |
| What's on: later this week | events from tomorrow to 7 days out |
| Announcements (3) | published, `type = 'announcement'`, not past `expires_at`, newest first |
| Latest stories (4) | next published stories after the secondary ones |
| On this day | published articles whose `published_at` (or `event_starts_at`) month and day equal today, from earlier years, one per year, newest year first, max 3 |
| Kicker | `categories.name` |
| Date line | `published_at` (stories) or `event_starts_at` (events); show the year only on the lead |

## Behavior

- **Week strip:** clicking a day updates the What's on "selected day" list without a page reload (`aria-pressed` on the day buttons, `aria-live="polite"` on the list). Consider reflecting it in the URL (`/?date=2026-11-18`) so the view can be shared.
- **Breakpoints:** below `lg` (1024 px) everything stacks in this order: lead + briefs, What's on, secondary stories, latest, on this day. At `lg` it's a 6 / 3 / 3 column grid.
- **Dates:** the prototype fixes "today" to 2026-11-14. Use the real date in Asia/Manila time.
- **Images:** prototype photos come from the legacy `gallery/` folder and some carry the old "Lundayan" watermark. Replace them with ICG photos.
- Photo credit under the lead comes from the article's cover image metadata (add a `cover_credit` column).

## Open questions

- Publication name for the masthead.
- Should the week strip start on Monday (current) or Sunday?
- Does "On this day" use the publish date or the event date?
