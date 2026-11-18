# Handoff — Announcements widget

Prototype: `design/prototypes/embed-announcements.html` (PAGES #28, future
`/embed/announcements`). D07 implemented November 17, 2026. Uses
`embed-announcements.js`, shared `embed-widgets.css` and `public-data.js`; no desk
shell, full public navigation or parent-page script is loaded.

## Design contract

Help a visitor scan dated campus announcements and open a notice while keeping the
host page available. References are the accepted public announcement rows and D06's
compact widget frame: Night identity band, Public Sans titles, Anton date numerals,
thin rules, and a permanent archive exit. Column places publication dates beside
titles; Row uses ruled columns when the iframe has room, with dates following titles.
Narrow frames stack every notice. Layout is an embed option, not a visitor control.
No carousel, title truncation, photographs or decorative animation. Empty, loading,
failed-load and extreme-text examples must remain readable and keyboard accessible.

Reuse only the shared public Announcement fixtures. Their dates are publication
dates, not event dates or expiry dates. No new publication, pinning or expiration
policy is established by this design.

## Options

| Query | Behavior |
| --- | --- |
| `layout=column` / `layout=row` | Initial arrangement. Column is the default and invalid values fall back to it. Layout is configured by the host/builder, with no visitor layout switch. |
| `limit=5` | Maximum notices, parsed as an integer and clamped to 1–10. Omitted/unparseable values use 5. The shared feed currently contains three notices. |
| `state=empty` / `loading` / `error` | Frozen design examples. Empty clears the visible feed; loading/failure replace the list and keep the archive exit. Retry clears the error query while retaining layout and limit. |

## Content and eligibility boundary

Use the shared public `ICGDemo.records` with `type === 'Announcement'`, newest
publication date first, limited after sorting. This is a sample public feed, not an
eligibility query against drafts or the CMS. Its three fixtures are dated November 13,
11 and 9, 2026. The notice about claiming lost items by November 20 still shows its
November 9 publication date. A deadline mentioned in a title is not an expiry field.

The widget has no new pinning, visibility-window, expiry, timezone cutoff or active/
archived rule. Production must supply the approved, publicly displayable records
under the client's agreed publication/expiry contract; that contract is still open.
Do not infer it from the legacy SQL or the static fixture filter. The widget simply
renders the supplied sample records; dates are not represented as event dates.

Shared date objects preserve their local wall-calendar date through
`ICGDemo.dateString`; no UTC date-only parsing is introduced. The rendered date
contains the Anton day, full month and year. Screen readers receive “Posted November
13, 2026”; the footer says dates are publication dates. In production derive that
date from the actual publication timestamp in Asia/Manila, independently of event
start/end or announcement expiration.

## Layout and interaction

- Both arrangements share D06's compact Night header, 22px Public Sans heading,
  30px ICG mark, Card White surface, 1px Mist Rules and 6px frame corners. Titles are
  17px Public Sans; dates use 40px Anton and 13px month/year. Normal gutters are
  16px, increasing to 24px in a wide frame. No new design tokens.
- Column is a single ordered list at every width. Publication date sits in a scalable
  4rem spine beside the complete title; a small external-link arrow identifies the
  destination. Long titles wrap naturally without ellipsis, line clamp or tooltip-only
  text. The whole notice is a real anchor, with a minimum 44px target and visible focus.
- Row follows the **iframe content width**, rather than the host viewport. Below
  36rem it uses the same stacked arrangement as Column. At 36rem it uses two ruled
  columns; at 56rem it uses three. Dates follow titles in these wider arrangements,
  aligned along the bottom of each grid row. Additional notices wrap to more rows;
  no carousel, horizontal scrolling, timed rotation or hidden overflow is used.
  Outer text edges align to the widget gutters, with 16px on either side of internal
  rules. Font-relative thresholds adapt to larger text.
- Source order is newest first in the DOM and in every arrangement. Keyboard focus
  runs from ICG home through notices to All announcements. There is no animation on
  layout/data changes. Only the inherited direct button press feedback appears on
  Retry, and reduced motion removes that transform.
- Empty says No announcements to show. Loading is static and exposes `aria-busy`.
  Failed load says Announcements couldn’t load and offers Try again; it never looks
  like a successful empty feed. Demo retry restores fixtures, announces the count
  and focuses the first notice (the heading if the restored feed is empty). When
  the shared data dependency is absent, failure stays explicit and focus returns
  to Retry. Live asynchronous fetching/retry is separate implementation work.

## Destinations and framing

Notice anchors use `ICGDemo.href(record)` to open the matching `article.html?id=...`.
All announcements opens `archive.html?type=Announcement` with that filter selected;
ICG opens Home. All open a new tab with `rel=noopener` and accessible new-tab wording,
keeping the widget/host available. Map the relative design-preview links to the
production public origin/routes in the build. No `window.top` navigation is used.

Use a descriptive iframe title, 100% width and an explicit height. The supported
minimum is 280px. A short frame scrolls vertically and keeps every notice and the
archive exit reachable; the widget does not resize its host. It accesses no parent
DOM and sends no auto-height messages. Host CSS cannot style its iframe document;
shared CSS rules stay scoped to `.ew`, with announcement layout rules further scoped
to `.ew-announcements`. Production framing permissions, sandbox behavior, CSP, font
delivery and any future origin-checked resizing bridge still need hosted verification.
Builder/code-copy work remains D08.

## Verification and exports

`python -I design/tools/check_embeds.py --announcements-only` passed both layouts in
actual iframes at 280, 320, 390, 768, 1024 and 1440px. Checks include publication order,
article/archive destinations, host style isolation, keyboard traversal and retry focus,
limits/fallbacks, distinct empty/loading/error states, natural empty feed and missing
dependency. Synthetic long/unbroken titles, literal markup characters and September
date labels passed at 25% larger text, with ten notices wrapping rather than vanishing.
A 520px frame retained keyboard access to the archive exit. axe-core found no WCAG 2
A/AA or 2.1 AA violations in the checked views/states/stress cases; no page or console
errors were observed. This is not a physical-device or screen-reader certification.
The final combined `python -I design/tools/check_embeds.py` also passed, including
all D06 Events checks after the shared stylesheet changes.

Exports: `design/tools/out/embeds/announcements-{column,row}-{280,320,390,768,1024,1440}.png`,
with state and stress captures alongside them. Rendered review covered Column at
280/390px and Row at 768/1440px; row padding was refined to align the outer edges.
The completed-page detector returned `[]`. The earlier automated taste-gate
`GATE: ERROR (the gate itself failed: spawn EPERM)` remains unverified; its do-not-rerun
instruction was respected. No production route/backend change, commit or deployment.
User visual acceptance is not assumed.
