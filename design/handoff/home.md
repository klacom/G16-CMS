# Home — Campus Marquee handoff

Updated November 17, 2026 (D10), against current source. Intended app route: `/`.
[Prototype](../prototypes/home.html) · [Design system](../../DESIGN.md) ·
[Tokens](../tokens.css) · [Tailwind configuration](../tailwind.config.js).

Home is PLP's calendar-led campus record: a cinematic featured story, the week's
dates, a selected-day programme, news and announcements, then the historical record.
Use Evergreen & Marigold, Anton for the loud headline/dates, Public Sans for reading,
Mist for day surfaces, functional photo fades, flat panels and ruled rows.

## Read the complete rendering path

The inline script builds the hero, week, programme, Coming up and news.
[public-data.js](../prototypes/public-data.js) supplies matching records and detail
links. [public-site.js](../prototypes/public-site.js), loaded last, replaces the
header/footer, resolves remaining links and handles calendar downloads;
[public-site.css](../prototypes/public-site.css) styles that connected navigation.
The initial header/footer markup alone does not describe the rendered page.

This static preview uses JavaScript, the existing Tailwind CDN and Google Fonts.
Its content is sample data. Start the Python design server on port 4321; see the
[walkthrough](../PUBLIC-DEMO.md). Development `/` also maps to this HTML through
[design-preview.ts](../../src/lib/design-preview.ts). Production Home remains a
minimal ICG shell; this is a design handoff, not a completed React page.

## Components and current behavior

| Surface | Current prototype |
| --- | --- |
| `SiteHeader` | Fixed over the hero, transparent with a Night scrim initially; gains the existing Night/blur treatment after 40px of scroll. Navigation: Home, Calendar, Archive, About, Contact. Search opens `archive.html#search`; Log in opens Campus Desk identity. Desktop active navigation has a Marigold underline. |
| `HeroCarousel` | Three manually controlled photo slides. Headline, description, time/place, then actions. Events offer See event details and Add to calendar; stories offer Read the story. The three featured IDs match the defaults shown in Site settings. |
| `CarouselControls` | Borderless 44px previous/next buttons flank visual progress dashes and a count such as 1 of 3. Navigation wraps. Dashes are aria-hidden indicators. No autoplay; changing slide content is a polite live region. |
| `WeekStrip` | Seven days, initially Monday November 9 to Sunday November 15, 2026. Today/initial selection is Saturday November 14. Cells show weekday, Anton day and textual event count. Today fills Marigold; another selected date uses Raised Night and a Marigold inset outline. Native buttons expose date/count names and `aria-pressed`. |
| `Programme` | Day selection updates the full weekday/date and count; rows are in the polite `#day-events` region. Rows show start time, title, category and venue; desktop adds summary/photo. The entire row opens the matching event article. Empty days link to Calendar with that selected date. |
| `Coming up` | First three fixture events after demo today, in fixture order. Rows lead with day number and weekday/start time. Changing selected day/week does not rebase this list. The full-November-calendar action opens default Calendar. |
| `LatestNews` | Three fixed selections with 5:3 photos, titles, categories and publication dates. All news opens the Archive's News filter. This occupies the 400px desktop side column. |
| `Announcements` | Three fixed title/publication-date rows in a Night panel below news. All announcements opens the Archive's Announcement filter. No expiry computation. |
| `OnThisDay` | A Marigold band with three fixed November 14 entries from 2025, 2024 and 2023, large years and matching detail links. No rolling historical query; week selection does not change it. |
| `SiteFooter` | Shared script supplies ICG identity, section links, campus address, Contact and Submit an event, plus a design-preview/sample-content label. Unconfirmed socials and office hours from the initial fallback markup are absent from the connected footer. |

Week arrows move seven days and select the new week's first day. On initial window
load, the horizontal strip is centered on today. Home neither reads nor persists a
`?date=` selection. Only specific outgoing calendar/detail links carry a date. Day
selection updates the programme without a reload or custom focus move. There is no
custom arrow-key day grid: these are ordinary buttons.

Initial hero order:

1. Second-semester student assembly — Event, November 23, 2026.
2. CHED supervisors review PLP’s education programs — News, November 12, 2026.
3. Leadership summit fills the auditorium on its first day — News, November 6, 2026.

`ICGDemo.linkFor` resolves titles to fixture IDs. Later hero renders dispatch
`icg:render` for shared link wiring. Add to calendar downloads that event as an `.ics`
snapshot with Asia/Manila timezone information. Image opacity transitions for 500ms,
with source replacement after 180ms; reduced motion removes photo/header transitions
and uses zero-delay image replacement. The shared mobile menu is a modal dialog with
Escape, focus return and scroll locking, without animation.

## Responsive composition

| Width | Layout |
| --- | --- |
| Below 640px | Hero 760px with 44px Anton headline, stacked actions and 16px gutters. Header 76px. Week cells are 76px in a horizontal strip. Programme, Coming up, news, announcements and historical entries stack; event summaries/photos are hidden. |
| 640–1023px | Hero remains 760px, headline becomes 60px and actions can share a row. Organization lockup appears beside ICG. Main content stacks and week scrolls. |
| From 1024px | Hero 720px, headline 84px, header 92px with navigation/Log in. Public frame caps at 1440px with 64px gutters. Fluid programme + 400px news/announcement column, 72px gap. Event rows: 110px time / fluid text / 180px photo, 32px gaps. Week: seven equal cells beside a 220px label column. Historical band: label + three entries. |
| From 1440px | Full organization lockup reappears; it is hidden at 1024–1439px to make navigation fit. |

Desktop hero shade is horizontal with a bottom Night fade; phone shade is vertical.
A masked 7px soften layer reduces busy image detail. Headline/description measures
are 660px/560px. Programme dates use 30px/52px Anton, event titles 17px/22px Public Sans,
news titles 19px/21px. Follow the actual classes and DESIGN.md for remaining values.

## Data and build contract

| Area | Current source | Build follow-up |
| --- | --- | --- |
| Featured | Inline `slides`, image positions/alt text and title-to-ID links. | Connect ordered featured publication IDs/revisions. Site settings demo saves do not update this separate page. Use stable IDs in the build. |
| Week/day | `ICGDemo.events`, compared as local wall-date strings. | Read eligible public events by Asia/Manila event date/time, separately from publication timestamps. |
| Coming up | `events.filter(date > homeToday).slice(0,3)`. | Agree real-feed ordering/window/empty behavior; no server query is implemented here. |
| News | Three inline records and supplied dates/photos. | Connect agreed public news selection and metadata. |
| Announcements | Three notices dated November 13, 11 and 9. | Supply eligible public notices under the publication/expiry contract; this design does not define it. |
| Historical | Three shared historical fixtures. | Confirm publication-date/event-date/editorial basis, limits and empty behavior. |
| Identity/assets | ICG identity, sample campus facts and legacy gallery images. | Confirm copy/contact facts and provide approved originals, alt text and credit/rights metadata under the rebuild's media contract. |

Demo today is fixed to **November 14, 2026**; footer year is fixed to 2026. Production
date boundaries/formats must use Asia/Manila and DESIGN.md. Some inline hero times
use shorter fixture labels than the system's full format; normalize real timestamps
on integration. No new database fields or eligibility policy are specified here.
Relevant [rebuild work](../../tasks/plan.md): T01 contracts, T13 Home feed, T19 public
states and T46 featured curation.

## Known differences and unresolved states

These are source-audit findings, not UI changes or new approvals:

- Week arrow markup is 36px; DESIGN.md requires 44px minimum targets. Hero arrows
  already use 44px.
- Phone week cells retain count text and the weekday label. DESIGN.md describes
  mobile dots and a TODAY label; reconcile this before treating markup as final.
- The base horizontal `.hero-soften` mask follows its phone override, so the cascade
  retains the base mask on phones. Reconcile it with the system's intended phone
  soften treatment; the phone shade itself is vertical.
- Selected-day empty feedback exists. Hero/news/announcement/historical empty,
  loading, failed-feed, missing-photo and variable-count states remain build/design
  follow-ups. No such behavior should be inferred from the obsolete handoff.
- Actual copy, imagery/credits, campus facts and historical selection policy need
  confirmation. ICG's name and this seven-day prototype are already established.

## Verification scope

D10 audited Home, shared scripts/CSS, fixtures, DESIGN.md and the preview map, and
changed documentation only. It did not recapture/re-review every public page or add
visual acceptance. The existing [public runner](../tools/check_public_demo.py) covers
navigation, matching details/date links, search, calendar export and responsive
overflow. Existing [public-demo exports](../tools/out/public-demo/) are historical
runtime evidence, not proof of the unresolved production states or client decisions.
