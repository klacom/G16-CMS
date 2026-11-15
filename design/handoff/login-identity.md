# Login concept — The Campus Desk

Date: November 14, 2026 (Asia/Manila).

## Recommendation

Give the login page the character of the ICG desk: a place where campus stories,
event dates, photographs, and the archive come together. The bold identity line
“Campus life, on the record.” supplies the focal point; a bespoke SVG editorial
still life explains the purpose of the product.

This is a proposed alternative, not an approved replacement. Compare
`design/prototypes/login-identity.html` with the existing
`design/prototypes/login.html`. Both use the same form behavior. The application
and its authentication implementation are unchanged.

## Directions considered

| Direction | Appearance | Tradeoff |
| --- | --- | --- |
| **The Campus Desk — recommended and prototyped** | A story proof, camera, calendar, pencil, and archive folder, drawn as flat editorial objects. | Connects the identity to the contributor's work; the full illustration needs desktop space. |
| The Living Marquee | A larger, higher-contrast date board with a strong typographic headline. | Closest to the existing graphic; still mainly communicates the calendar. |
| Campus in Frame | Real PLP photography, crop marks, and oversized dates. | Strong local connection; needs suitable photographs with permission and without legacy watermarks. |

## Design contract

- **Job:** make the ICG identity recognizable while helping contributors log in.
- **Primary action:** Log in. The form stays calm and familiar.
- **Visual authority:** `DESIGN.md`, existing tokens, and `IDENTITY.md`. The new
  illustration is a documented, sign-in-only extension to the brand-graphic rule.
- **Required states:** empty, invalid fields, password reveal, submitting, failed
  login, demo success, reset request, reset confirmation, and return to login.
- **Reject:** stock characters, invented PLP buildings, decorative gradients,
  shadows, new accent colors, floating animations, and a branded vocabulary that
  obscures familiar form controls.

## Components and behavior

| Component | Content and states |
| --- | --- |
| `LoginBrand` | ICG lockup, identity headline, explanatory copy, university name. |
| `CampusDeskIllustration` | Inline SVG. Static and decorative; `aria-hidden` and nonfocusable. Contains no controls or live data. |
| `LoginForm` | Existing email/password form, persistent hints, password visibility, shared-device guidance, and account-request link. |
| `ErrorSummary` | Existing focused alert for failure and status for demo success. |
| `ResetRequest` | Existing inline recovery step, validation, confirmation, and back action. |

The story proof represents campus reporting; the camera represents documentation;
the calendar represents planning; the folder represents the record over time.
The illustration's November 14, 2026 highlight is fixed sample artwork, not today's
date or an event feed. No production content fields or backend data are read.

Below 1024px, hide the full scene and headline. Keep a 110px Midnight brand band
with a small static calendar motif beside ICG. The form follows with 16px gutters
on phones and remains at most 420px wide. At 1024px and above, use the split layout,
with a 60px identity headline, increasing to the existing 84px hero role at 1280px.
Only one “Back to the site” link is visible at any viewport size.

The illustration has no motion, so it needs no play/pause control. Existing form
transitions and the loading indicator respect reduced motion.

## Preview and verification

Serve the repository root on port 4321 and open:

`http://127.0.0.1:4321/design/prototypes/login-identity.html`

- Desktop: `design/tools/out/login-identity-desktop.png`.
- Mobile: `design/tools/out/login-identity-mobile.png`.
- State captures: `design/tools/out/login-identity-states/`.
- Interaction check: `python -I design/tools/check_login_identity.py`.
- Screenshot utility: `python -I design/tools/shot.py http://127.0.0.1:4321/design/prototypes/login-identity.html design/tools/out/login-identity`.

Chromium checks cover login validation, password visibility, loading, failed login,
demo success, reset/reopen, account-request navigation, keyboard traversal,
reduced motion, and overflow at 320, 390, 768, 1024, and 1440px. The visual detector
reports no findings. Desktop and mobile screenshots have been visually reviewed.

## Implementation boundary

This is an interactive static prototype. It does not authenticate, send email,
or create accounts. The copied form's invitation wording, institutional email hint,
and one-hour reset-link text require confirmation against the eventual access
and email contracts. Role names and permissions remain governed by the confirmed
implementation decisions, not by this concept's copy.

The inline SVG can later become a reusable illustration component for login,
reset-password, and accept-invite pages. Select the direction before propagating
the new treatment to those pages.
