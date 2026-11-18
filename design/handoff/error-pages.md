# Handoff — Not found and generic error

Prototypes: `design/prototypes/not-found.html`, `error.html` and shared
`error-pages.css`. PAGES #8. D09 implemented November 17, 2026. Existing application
`not-found.tsx` / `error.tsx` placeholders are unchanged.

## Design contract

The 404 is a restrained Marquee moment: an Evergreen surface, large Anton Page not
found title and a static calendar with November 14 missing. The graphic is decorative,
never a usable calendar; the real exits are Go to home and Open calendar. Its content
and navigation must work without scripts or the decoration. References: the accepted
public calendar, the compact ICG identity and existing Marquee type/color rules.

Generic failure is a separate calm utility screen on Mist: plain explanation,
Try again and permanent recovery links. Its public and desk examples use fixed safe
destinations without raw diagnostics or private content. It must exercise both retry
outcomes and restore focus after failure. Success in the static demo opens Calendar
(public) or Overview (desk); production must retry the original failed route through
the actual boundary reset. No Next.js route, reset boundary or authentication change.

## Not found

`not-found.html` is entirely static. It has a minimal ICG home link, Page not found
heading and explanation, Go to home (`home.html`), Open calendar (`calendar.html`),
and an Error 404 footer that remains when the illustration is hidden. It does not
depend on the public navigation bootstrap, sample feed, a CDN script or client state.
The token stylesheet supplies fonts with native fallbacks; absent web fonts do not
remove content or exits.

The illustration is a **partial**, decorative November 2026 calendar: three weeks,
with November 14 missing from its position and 404 in the board header. It has no
today marker, event data or navigation; every cell is a span, not a button/link.
The whole board is `aria-hidden`, untabbable, pointer-inert and unselectable. Its
missing-day outline is a small dashed square, not a selected-day pill. Removing the
board leaves a complete error message and recovery flow.

Night, Marquee White, muted type, Anton numerals and one Marigold Home action use
existing tokens. The title steps 56/72/112px; the month/date graphic uses existing
30/44px heading/number roles and 20/26px days. Desktop places copy and board side by
side; below 1024px they stack. The heading and content align to 16px phone / 64px
desktop gutters in the 1440px public frame. No entrance, hover movement or ambient
animation. The calendar date is artwork, not a claim about today's date.

## Generic error and retry demonstrations

`error.html` uses an independent Night identity header and Mist utility body, with
a 32px Public Sans heading, explanation, one Marigold Try again and ruled recovery
rows. Links stay visible while retry is pending or has failed. There is no raw
error text, requested path, stack trace, record title or personal identity.

| Query | Design behavior |
| --- | --- |
| no query / `retry=success` | Public error. Retry demonstrates recovery by replacing this preview entry with the existing Calendar, selected on November 14, 2026. Home and Calendar remain permanent exits. |
| `retry=fail` | Retry returns a generic continued-failure message; the button is enabled and focused again, and recovery links remain. Further retry attempts can be exercised. |
| `context=desk&role=writer` / `reviewer` / `admin` | Minimal Campus Desk fallback. Home/Calendar rows become Overview/Inbox with the matching demo role. Successful retry goes to Overview. Unknown roles fall back to writer; unknown contexts use public recovery. |

The retry demonstration uses a 300ms timer only to expose pending behavior; production
must await real reset/revalidation rather than add this delay. During the attempt,
the button is disabled, labelled Trying again and `aria-busy`; a separate polite
status announces the attempt. A guard prevents repeated invocation while pending.
Failure restores the Try again label/focus and announces the continuing problem,
without claiming work was saved or lost. Failure text uses functional Error Red on
Mist. Success navigates to the fixed same-origin demonstration destination with
`location.replace`, avoiding a redundant failure entry in browser history. New
document navigation uses the destination's normal heading/reading order; no focus
is injected into another page.

The retry button starts hidden and is revealed only after its inline handler is
installed. With JavaScript disabled, the public Home/Calendar exits still work and
the visible no-script paragraph directs the visitor to them. Desk query switches
are client-only demonstrations, so without scripting they retain that safe public
fallback. Production must render the correct context from trusted route/session
information, not infer authorization from a query parameter. No untrusted return
URL or diagnostic query is reflected in links or visible copy.

## Production shell and status contract

These are standalone fallback designs. When the public/desk layout still works,
render the recovery content inside it and retain its navigation; omit a duplicate
brand header/footer. A surviving desk layout keeps its own 40px desktop / 16px phone
gutters and this utility typography. The desk example shows the minimal root fallback
when the full shell is unavailable; it fetches no identity or private records.

The real boundary must retry the **original failed route**, preserve its normal
authorization rules and handle reset success/failure using that route's state.
Calendar/Overview navigation here is an explicit static demonstration, not an
implementation of application `reset()`. No state-preservation guarantee is made
for unsent forms. Use fixed safe navigation destinations appropriate to the actual
authenticated context; never display raw exceptions or server diagnostics.

The local HTTP server serves these `.html` files with status 200. The production
not-found route must return the correct not-found HTTP status; serving/redirecting
to this design file alone is not that behavior. Error status, root/segment boundaries,
logging, offline service handling and full shell integration remain build work.
No production route or backend was changed by D09.

## Verification and exports

`python -I design/tools/check_error_pages.py` checks 404 exits, decorative semantics,
keyboard order, retry pending/success/failure, restored focus, history replacement,
public and all three desk-role destinations, ignored diagnostic/return parameters,
and layouts at 320/390/768/1024/1440px. Long localized-sized headings, unbroken text
and 25% larger type are tested; the calendar can be hidden without losing recovery.
Controls stay at least 44px, and no horizontal overflow or recovery-surface animation
was found. Installed axe-core checks WCAG 2 A/AA and 2.1 AA in ordinary and stressed
states. Separate script-disabled contexts replace remote font CSS with an empty
response, checking native-font/static-link fallback without relying on either script
or web-font delivery. This is not a physical-device/screen-reader certification.

Final result: the full focused runner passed, with no axe violations in the checked
ordinary/stressed/failure states and no page/console errors observed. The rendered
failed-retry state was refined so its focus outline preserves the button's pill shape.

Exports: `design/tools/out/error-pages/{not-found,error-public,error-desk}-{320,390,768,1024,1440}.png`,
plus continued-failure, no-art, larger-text and no-script/font captures. Desktop and
mobile layouts were visually inspected. Completed-page detector returned `[]`.
The prior automated taste-gate `GATE: ERROR (the gate itself failed: spawn EPERM)`
remains unverified; its do-not-rerun instruction was respected. No commit/deployment
or user visual acceptance is claimed.
