# Handoff — Accept invite

Prototype: `design/prototypes/accept-invite.html` · Route: `/auth/invite` (PAGES #12)
Purpose: an invited person sets up their account. **Accounts are invite only**
(user decision, 2026-11-15); there is no public sign-up page.

## Layout
Campus Desk sign-in layout, identical to `reset-password.html` (see that handoff).

## Components
| `data-component` | Notes |
| --- | --- |
| `InviteDetails` | Card White panel: who invited them, the role, one line on what the role does, expiry date. |
| `AcceptInviteForm` | Email as fixed text (not editable) with "Not you? Ask the desk", Full name (required), Organization or office (optional), password + confirm, "Join the desk". |
| `PasswordField`, `PasswordRules`, `ErrorSummary` | Same as reset password (`signin-password.js`). |
| `SuccessPanel` | "You're on the desk", one action: "Go to your dashboard" → `/dashboard`. |
| `LinkProblem` | Expired, withdrawn, or the email already has an account. |

## States (prototype URL switches)
- `?role=writer|reviewer|admin` changes the role name and description.
- `?state=done | expired | withdrawn | existing`.

## Data
- Invitation: inviter name (`profiles.full_name` of the admin), `role` (one of
  writer / reviewer / admin — one role per account, confirmed 2026-11-14),
  invited email, expiry. Copy assumes invites last **seven days** (open question).
- On join: `profiles.full_name` (required, shown as the byline), an optional
  organization/office string shown under the name (**new field**, suggest
  `profiles.affiliation`), password.
- Role descriptions (copy): Writer drafts and sends for review; Reviewer reads assigned
  drafts, comments, approves or asks for changes; Admin invites people, manages every
  article and settings, but publishing still needs a reviewer.

## Open questions
- Invite lifetime (7 days in copy) and whether admins can resend/withdraw (the overview
  prototype shows "Resend invite").
- Is `profiles.affiliation` wanted in the data model? It helps org officers' bylines.
