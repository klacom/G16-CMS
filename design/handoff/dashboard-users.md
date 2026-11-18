# Handoff — Users (admin)

Prototype: `design/prototypes/dashboard-users.html` (+ `desk.css`, `desk.js`)
Route: `/dashboard/users` (PAGES #22); in `npm run dev` it shows at that route. Admin only.
Designed 2026-11-16 as a single direction. Replaces `admin-manage-users.php`, where admins
created accounts and typed people's passwords; accounts are now invite only.
Rules: DESIGN.md › Dashboard › "Users (admin)" and "Side sheet".

## Components
| `data-component` | Notes |
| --- | --- |
| `InviteButton` | The page's one marigold action; the plus icon button in the mobile bar opens the same sheet. |
| `UserFilters` | Status chips with counts (Everyone, Active, Invites, Deactivated), search (name or email), role select. URL: `?status=active\|invited\|deactivated`, `?type=writer\|reviewer\|admin`, `?q=`. (`?role=` stays the prototype's demo person.) |
| `PeopleTable` / `PersonRow` | Real `<table>`, full width (no cap); the name button is stretched over the row. Stacked rows below 1280px. Deactivated rows last and muted. |
| `SideSheet` | `<dialog>` from the right (480px, full screen on phones), focus trapped, Escape/scrim/close button close it, focus returns to the opener. |
| `PersonFacts` | Status + last active, joined + invited by (or invited by + sent), what they have on the desk. |
| `RoleChoice` | Three radio pills with the chosen role's meaning under them. Disabled on your own sheet. |
| `AccessBlock` | Deactivate / Reactivate, or Send a new invite / Withdraw invite. |
| `ConfirmDialog` | Role change and deactivation. Focus starts on Cancel. |
| `UsersEmpty` | "No one matches" + Clear filters; "You're the only one here" + Invite someone. |

## States
- Default: 12 people (9 active, 1 invite waiting, 1 expired, 1 deactivated); you are Maria Santos.
- `?status=invited`, `?type=reviewer`, `?q=lea`, `?empty=1` (only you), `?invite=1` or `#invite` (opens the invite sheet).
- Invite errors: empty email, malformed email, an email that already has an account or a live invite. An expired invite's email can be invited again (it replaces the old invite).
- Role change: confirmation names the consequence (open reviews go back to their writers; a writer keeps their articles but can't write new ones; an admin loses the admin pages).

## Data
- `profiles`: `id`, `full_name`, `role` (`writer` | `reviewer` | `admin`), group/affiliation
  (**undecided**: `profiles.affiliation` or an `organizations` table), `created_at`,
  `invited_by`, `deactivated_at`, `last_active_at` (from auth sessions).
- `invites`: `id`, `email`, `full_name` (optional), `role`, group, `note`, `invited_by`,
  `created_at`, `expires_at`, `accepted_at`, `withdrawn_at`. Sending a new invite revokes the
  old token. Accepting creates the profile (see `design/handoff/accept-invite.md`).
- Deactivation: set `deactivated_at`, revoke all sessions at once (PRODUCT.md: access ends
  immediately), reassign open reviews to "writer chooses again", keep articles and bylines.
- "On the desk" summary: counts from `articles` (by author and status) and open review assignments.
- Every change here (invite, resend, withdraw, role, group, deactivate, reactivate) writes an
  audit log entry (PAGES #24).

## Open questions
- **Invite lifetime:** the prototype says 7 days. Confirm, and whether admins can extend.
- Must invites use a `@plpasig.edu.ph` address, or can org officers use other email?
- Role change rules: what happens to a writer's drafts in review when they become a reviewer, and to a
  reviewer's own articles (if any)? The prototype only states the consequences in the dialog.
- At least one admin must remain: the prototype only blocks changing your own role.
- Can a deactivated person's email be invited again as a new account, or only reactivated?
- Is "Group" a fixed list managed in Site settings (PAGES #25)?
