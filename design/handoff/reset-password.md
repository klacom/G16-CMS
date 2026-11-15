# Handoff — Reset password

Prototype: `design/prototypes/reset-password.html` · Route: `/reset-password` (PAGES #11)
Purpose: the page the password-reset email opens; the person sets a new password.

## Layout
Campus Desk sign-in layout (DESIGN.md › Sign-in pages), same as `login-identity.html`:
night brand side with the illustration on desktop, 110px night band below 768px,
form column max 420px. Only the line under the brand headline changes.

## Components
| `data-component` | Notes |
| --- | --- |
| `LoginBrand`, `CampusDeskIllustration` | Copied unchanged from login. Static, `aria-hidden`. |
| `ResetPasswordForm` | Heading, account email (read from the recovery session), two password fields, sign-out checkbox, submit. |
| `PasswordField` | Show/hide eye (`aria-pressed`, label switches), Caps Lock hint. Behaviour in `signin-password.js`. |
| `PasswordRules` | Shown from the start; each rule gets `data-met` + an Ink check as it is met; never red before submit. Rules: at least 12 characters; doesn't contain the email name. |
| `ErrorSummary` | On submit, lists each problem as a link to its field and takes focus. |
| `Checkbox` | "Log out of the ICG desk on other devices", **on by default** (shared/lab computers). |
| `SuccessPanel` | Night panel, takes focus, one action: Log in. |
| `LinkProblem` | Card White panel for an expired or already-used link, one action: "Send a new link" → `/login?step=reset` (opens the reset request step). |

## States (prototype URL switches)
- default: set a new password
- `?state=done`: saved
- `?state=expired`, `?state=used`: link problems
- Busy: button shows spinner + "Saving…", disabled.

## Data / behaviour
- Supabase recovery flow: the link signs the user into a recovery session; show
  `auth.users.email` for that session. Never show anything when the token is invalid
  beyond the generic problem panel.
- Validation server-side too: min length 12 and not containing the local part of the
  email. Match the error copy in the prototype.
- "Log out on other devices" → sign out other sessions (`scope: 'others'`) when checked.
- After saving, the prototype sends the person to log in. If the build keeps them signed
  in instead, change the success action to "Go to your desk" → `/dashboard`.
- `noindex`.

## Open questions
- Password rules beyond length (breach check?) — confirm with whoever owns auth.
- Reset link lifetime: copy says one hour, matching the login reset step.
