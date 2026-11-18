# Handoff — Account settings

Prototype: `design/prototypes/dashboard-account.html` (+ `desk.css`, `desk.js`, `signin-password.js`)
Route: `/dashboard/account` (PAGES #16); in `npm run dev` it shows at that route.
`/dashboard/account#email` opens at the email section (the Inbox links there).
Designed 2026-11-16 as a single direction, like the Inbox.
Rules: DESIGN.md › Dashboard › "Account: ruled settings sections" and "Switch".

## Components
| `data-component` | Notes |
| --- | --- |
| `ProfileSection` | Photo, full name (its hint previews the byline), admin-set facts, save row. Left column from 1280px. |
| `ProfilePhoto` | 72px circle; initials until a photo is chosen. JPG or PNG up to 5 MB, checked on choose. "Change photo" / "Remove". |
| `BylinePreview` | Inside the name hint: “By <name>, <group>”, updates as the name is typed. |
| `AccountFacts` | Role, group, joined + invited by. Read-only rows, then one note: only an admin can change email, role or group. The email shows once, in the page header ("Signed in as …"). |
| `SaveRow` | Only while the profile has unsaved changes: "Save changes" (marigold, busy "Saving…"), "Discard". |
| `PasswordSection` | "Change password" opens the form in place: current, new (`PasswordRules`), confirm, "log out on other devices" checkbox (on). `ErrorSummary` on submit. |
| `EmailSection` | Switch rows per role; each change saves at once with a polite status line. Security notices end in "Always" (text, not a disabled switch). |
| `SessionsSection` / `Session` | Current browser first ("This browser"), others with "Log out"; "Log out everywhere else". |
| `LeavingNote` | One muted line under both columns: only admins close accounts; link to `contact.html?topic=account`. |

## States
- `?role=writer` (default, Lea), `?role=reviewer` (Paolo), `?role=admin` (Maria): different email options and facts.
- Name empty or under 3 characters: field error on save. Photo not JPG/PNG or over 5 MB: error under the photo buttons.
- Password: empty fields → summary with three links; current password `wrong-password` (demo) → "That isn't your current password…"; success → "Last changed today, 10:05 AM", other sessions removed when the checkbox is on.
- Unsaved profile changes: browser leave dialog (`beforeunload`).

## Data
- `profiles.full_name`, `profiles.avatar_path` (Supabase Storage; crop to a square on upload),
  `profiles.role` and the group/affiliation (read-only here; **`profiles.affiliation` is still undecided**),
  `profiles.created_at`, `profiles.invited_by`.
- Sign-in email from Supabase Auth (`auth.users.email`), read-only for the person.
- Password change: Supabase Auth `updateUser({ password })` after re-checking the current password
  (re-authentication); "log out on other devices" → sign out other sessions (`signOut({ scope: 'others' })`).
- Email preferences: a `notification_preferences` row per person (one boolean per notification kind,
  see `design/handoff/dashboard-inbox.md`); security notices are not stored as a preference.
- Sessions: the auth sessions list (device from the user agent, `last_active_at`). If listing sessions
  isn't available from the auth provider, keep only "Log out everywhere else".
- Password change and sign-outs should write audit log entries and send the security notice.

## Open questions
- Who can change the sign-in email: only admins (as shown), or the person with a confirmation email?
- `profiles.affiliation` ("Group"): is it a fixed list of organizations, free text, or dropped?
- Can people choose a different byline from their full name (for example, a pen name)? The prototype says no.
- Is the profile photo shown publicly (on article bylines) or only on the desk?
- Session list: is it possible with the chosen auth setup, and should it show an approximate location?

## Revised after critique (2026-11-16)
From 1280px the sections sit in two columns (Profile | Password, Email, Where you're logged in), each description under its heading; the page dropped from 1,864px to 1,329px tall at 1920. Snapshot: `.impeccable/critique/`.
