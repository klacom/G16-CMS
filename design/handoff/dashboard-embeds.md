# Handoff — Embed widget builder

Prototype: `design/prototypes/dashboard-embeds.html` and `dashboard-embeds.js`.
Route: `/dashboard/settings/embeds` (PAGES #26), admin design prototype. D08 implemented
November 17, 2026. Production route/auth wiring remains separate from this HTML preview.

## Design contract

Let Maria choose an existing public widget, check its actual rendered output and
copy the matching iframe code. Reuse the selected desk shell, ruled settings groups,
labelled fields and one Marigold Copy code action. Configure and Copy sit beside the
preview in a wide work area; smaller work areas stack Configure, Preview, Code.
Preview width is independent of embed configuration: the iframe code stays 100% wide.
Use only the D06/D07 option contracts. No new widget content or expiry policy.

The iframe uses the actual local widget document. Code must encode its URL safely,
match its accessible title and configured height, and identify the design-preview
origin. Clipboard feedback follows the fulfilled write promise; rejection or missing
API leaves selectable code and a keyboard-copy path. Returning to Site settings
retains admin and the originating section. No backend save, deployment, production
framing permission or auto-height protocol is included.

## Configuration and code

| Control | Output |
| --- | --- |
| Widget | Events or Announcements, using fixed local widget routes. |
| Events: View | List or Calendar, from D06. |
| Show events from / Start on | Strict valid 2000–2099 wall date; November 14, 2026 by default, matching the public demo. Inclusive list cutoff or initial calendar day. |
| Announcements: Layout | Column or Row, from D07. |
| Number of events / announcements | Whole number 1–10, default 5. This is a maximum; three announcement fixtures exist. Hidden/disabled for Calendar, which shows every event on the selected day. |
| Frame height | Whole number 240–1600 pixels, default 640. Actual preview and generated iframe use the same height; taller content scrolls. |
| Narrow / Wide | Preview-only width: up to 280px, or available stage width. Code always uses `width="100%"`. |

Inactive controls are hidden/disabled and retain their values when switching back.
Invalid active values show associated inline errors, hide/clear stale preview/code
and disable Copy/Select. No category, theme, expiry or animation option is invented.

One validated configuration builds the URL, accessible title, height and readonly
code. Events use `view`, `startdate` and (List only) `limit`; Announcements use `layout`
and `limit`. Admin/section parameters never enter the public URL. The code encodes
ampersands as `&amp;` and includes the same title, 100% width, integer height and
`style="border:0;"`. Pasted output was exercised as an actual iframe in a separate
isolated browser context. Visitor interactions inside the preview do not replace
the configured starting options; the preview states this explicitly.

## Layout and preview feedback

The fluid desk has a back link, title and muted description. Ruled Configure, Preview
and Code sections use existing type/spacing. From 64rem of actual work area, a 320px
configuration/code column sits beside the fluid preview with a 32px gap. Smaller work
areas follow DOM order: Configure, Preview, Code. There is one Marigold Copy code action
and an outlined Select code action. Controls have at least 44px targets; text/code wrap.
The iframe keeps the configured height even if its content is shorter; no auto-fit.

Dimensions and Loading/Ready/Unavailable status are shown. Local readiness checks the
loaded URL and widget root. Missing/non-widget documents offer Reload preview, which
remains available after height changes. Reload returns focus to Preview on success
or Reload on continued failure. Production cross-origin readiness needs a separate
contract; this implementation inspects only its own same-origin local preview.
No entrance animation or decorative loading motion is added.

## Clipboard

Copy snapshots current code, prevents duplicate clicks and awaits the write promise.
Fulfillment alone reports success. If options changed meanwhile, feedback explicitly
refers to earlier code and requests a fresh copy (or field correction). Rejection or
an absent API selects current code and explains keyboard copying. Select code is
always available for valid output. A polite status and associated instructions report
the result. No deprecated hidden-textarea copy command is used.

This follows [MDN's Clipboard.writeText documentation](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText):
the promise resolves after writing, can reject with NotAllowedError and requires a
secure context. Deterministic API doubles verify completion, rejection, absence and
races without reading or overwriting the user's system clipboard. Native clipboard
permissions and hosted-browser integration still require verification.

## Navigation and production boundary

Site settings now opens this builder with admin, current section and optional `mail=on`
demo context. Its existing Leave without saving dialog protects the outbound link;
Cancel stays, Discard clears that section's unsaved work before leaving. The back link
allowlists the section, defaults to Featured stories and restores admin context.
Role query parameters are demo controls, not authorization; the production route
must enforce the existing admin permission contract.

The code is visibly labelled **Local preview code**, using the current design server's
`design/prototypes/embed-*.html` routes so it works locally. The build must substitute
the confirmed public origin and `/embed/events` or `/embed/announcements`, preserving
configuration/title/height agreement. No public domain or arbitrary iframe source is
invented. Configuration is ephemeral; copying does not save/publish settings.

Production framing permissions, CSP, sandbox/pop-up behavior, font delivery, live-feed
eligibility and any origin-checked auto-height/readiness messages remain integration
work. No production header/resizing/backend change. D06/D07 publication/expiry questions
remain open.

## Verification and exports

`python -I design/tools/check_embeds.py --builder-only` passed configuration/code
agreement, real output, pasted code, navigation, unsaved-work cancel/discard, native
keyboard traversal, inactive/invalid fields, width-only changes, preview recovery and
clipboard races/fallback. Native date-field segments are traversed before the next
field, rather than assuming one Tab leaves the date. Layout checks passed at 320, 390,
768, 1024, 1440 and 1920px, both widgets, Narrow/Wide and 25% larger text. Installed
axe-core found no WCAG 2 A/AA or 2.1 AA violations in checked builder states; no page/
console errors were observed. This is not physical-device/screen-reader certification,
native clipboard permission testing or external hosting verification.

Final combined `python -I design/tools/check_embeds.py` passed Events, Announcements
and Builder end to end. Synthetic public-feed fixtures use separate browser contexts
before the admin flow, preventing fixture responses/cache from leaking between tests.

Exports: `design/tools/out/embeds/builder-{events,announcements}-{320,390,768,1024,1440,1920}.png`,
plus narrow, invalid, unavailable, copy-fallback and larger-text captures. Desktop and
phone renders were inspected. JS syntax, completed-page detector and scoped whitespace
checks passed. The earlier automated taste-gate `GATE: ERROR (the gate itself failed:
spawn EPERM)` remains unverified; its do-not-rerun instruction was respected. No commit
or deployment. User visual acceptance is not assumed.
