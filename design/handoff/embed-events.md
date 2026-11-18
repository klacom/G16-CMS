# Handoff — Events widget

Prototype: `design/prototypes/embed-events.html` (PAGES #27, future `/embed/events`).
D06 implemented November 16, 2026. This is a public design prototype using
`public-data.js`, not a live feed. Behavior: `embed-events.js`; scoped shared styles:
`embed-widgets.css`. No desk shell or public-site bootstrap is loaded.

## Design contract

Help a visitor find an event and open its details without losing their host page.
Use the accepted public calendar and date-spine rows as references: compact Evergreen
identity band, quiet Card White list, Anton dates and Public Sans event titles. No desk
sidebar, promotional hero, photographs or motion on date/view changes. Event links are
the main action. Calendar/list switching, month/day selection and recovery must work
with a keyboard. Empty, loading and failed-load states must be distinct.

At narrow widths, keep the month visible and use a labelled 44px day select; only show
interactive day cells when seven 44px targets fit. The selected-day programme always
follows the month in reading order. A wide iframe can place them side by side. Use
existing tokens and spacing steps; scope shared widget styles with `ew` classes.

## Options and date semantics

| Query | Behavior |
| --- | --- |
| `view=list` / `view=calendar` | Initial view; list by default. Both remain available through keyboard-accessible tabs. |
| `startdate=YYYY-MM-DD` | Inclusive list start and initial calendar selection. Strict valid date from 2000 to 2099; invalid values fall back to the demo today. |
| `limit=5` | Maximum individual events in the list, not date groups. Integer, clamped to 1–10; omitted/unparseable values use 5. Calendar days always show every matching event. |
| `state=empty` / `loading` / `error` | Frozen design examples. Empty replaces the fixture feed with zero records. Loading and error replace both data views; they never imply an empty successful load. |

The stable demo today is **November 14, 2026**, matching the public calendar. The
preview labels its data as sample campus content. Use public `ICGDemo.events` only,
ordered by event date (fixture order within a day); never read the desk's draft records.
Dates are local wall-calendar dates, parsed as year/month/day and round-trip validated,
so ISO date-only strings do not shift through UTC. Times and venues come from the same
public event fixtures and are labelled Philippine Time; ranges use “to” and noon is NN.
In production, use the published revision's actual event start/end and Asia/Manila
date/time; the list cutoff is the event date, not the publication date. The live-feed
query, ordering within a day and real clock remain implementation work.

## Layout and interactions

- A compact Night identity band contains Campus events and a 44px ICG home link.
  List/calendar tabs use the desk's quiet Ink selection, leaving marigold for today.
  Event rows use 17px Public Sans titles, readable time/venue lines, thin rules and
  an Anton date spine. The 4rem spine accommodates the month name at larger text sizes.
- From is a labelled native date field. A valid change updates the inclusive list
  cutoff and retained calendar date. An invalid field leaves the current results in
  place and shows its error. A loaded but exhausted list says No upcoming events.
- The calendar follows the actual iframe width. Below 22rem of widget content width,
  the month is a passive overview plus a labelled 44px day select. At 22rem and up,
  day buttons are at least 44px and use one Tab stop with arrow-key navigation. Home /
  End select the week edges; Page Up / Down retain the day where possible in the
  adjacent month. The date selection and event count are announced in a polite region.
  The selected button keeps focus after rerendering. Selection uses an Ink outline,
  today a Marigold circle, and a dot means events; each button's name includes its full
  date and event count. Blank cells are not actionable.
- Month controls stay with the grid. Changing month selects its first day; Today
  restores the demo date. Navigation stops at January 2000 / December 2099. At 44rem
  of widget content width, grid and programme sit side by side with a 32px gap;
  narrower they stack. All events for the selected day remain visible, including
  crowded days; the list limit does not truncate them.
- Tabs support Left / Right and Home / End and retain the shared date. Switching
  from a selected calendar date to List uses that date as its cutoff. View/date changes
  are immediate; only direct button press feedback is used, removed for reduced motion.
- Error shows Try again and the permanent full-calendar exit. In the demo, retry
  clears `state=error`, restores fixtures and focuses the current tab; if the fixture
  dependency itself is absent, failure remains explicit and focus stays on Retry.
  The real feed needs its own asynchronous retry; this prototype does not fetch one.

## Destinations and iframe integration

Event links use the existing `article.html?id=<record-id>` mapping. Full campus calendar
retains the selected date and uses `view=agenda` from List or `view=month` from Calendar.
The ICG mark opens Home. All three open in a new tab with `rel=noopener`; accessible
names announce the new tab, and the host page/widget remain available. The final build
must map these relative prototype links to the real public origin/routes.

The host should supply a descriptive iframe title (for example, “ICG campus events”),
100% width and an explicit height. This prototype works from a 280px frame width; it
does not read a `width`/`height` query or resize its host. A short fixed-height iframe
scrolls vertically, keeping the full list/programme and exit reachable. No parent DOM
access, parent-style injection or auto-height/postMessage protocol is included. A
future height bridge would need an agreed origin/message contract. The iframe has its
own token/font document; parent CSS cannot style its contents. The host must permit
the intended scripts and new-tab links. Production framing permissions, CSP, sandbox
and cross-origin font delivery require deployment verification; localhost tests do
not certify those headers. Builder/code-copy design remains D08.

## Verification and exports

`python -I design/tools/check_embeds.py` passed in Chromium with actual iframes at
280, 320, 390, 768, 1024 and 1440px. It checks article/full-calendar destinations,
keyboard date/tab focus, invalid/boundary dates, empty/loading/error/retry, dependency
failure, style isolation, 44px interactive targets and no horizontal overflow. An
11-event day and long unbroken titles/venues at 25% larger text passed; larger-text
list date spines were checked separately. A 520px-tall frame retained keyboard access
to the footer. Installed axe-core found no WCAG 2 A/AA or 2.1 AA violations in the
checked views/states and larger-text list examples. No page/console errors were observed.

Exports: `design/tools/out/embeds/events-{list,calendar}-{280,320,390,768,1024,1440}.png`,
plus state and stress captures in the same directory. Rendered 280/390px and wide
layouts were inspected. Impeccable returned `[]`. The earlier taste gate's
`GATE: ERROR (the gate itself failed: spawn EPERM)` remains unverified; its do-not-rerun
instruction was respected. No production route/backend change, commit or deployment.
Visual acceptance is not assumed.
