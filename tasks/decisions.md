# Implementation decisions

Updated: 2026-11-14 (Asia/Manila).

## Authorized foundation

The user approved proceeding with T01-T05. Use the current checkout on
`codex/icg-foundation`, a root Next.js App Router application, TypeScript, npm,
and local Supabase. Preserve the legacy PHP application and Claude-owned files.
No hosted project, paid service, production cutover, or domain schema is selected.

## Confirmed access rules

Confirmed directly by the user on 2026-11-14:

1. Each application account has one role initially: Writer, Reviewer or Admin.
   Admin content-management capabilities do not require multiple role memberships.
2. Admins may manage every article. Publication still requires reviewer approval;
   the Admin role does not provide a review bypass.
3. Deactivated accounts immediately lose authenticated access, including through
   existing sessions. Preserve their articles, authorship and audit history.
   Deactivation does not itself archive or delete content.

These resolve the corresponding T01 decisions for T06-T09/T38. Review quorum,
self-review, assignment eligibility and other editorial semantics remain pending.
This records product decisions; implementation task completion is unchanged.

## Evidence and unresolved decisions

The external migration artifact was inaccessible during planning. Local
`CLAUDE.md` and `design/PAGES.md` remain the verified feature inventory. The
contracts in `contracts.md` are a proposal, not a recovered external schema.

| Decision | Status | Blocks |
| --- | --- | --- |
| App Router, TypeScript, npm, root app with `src/` | Accepted for T02-T05 by user go-ahead | None |
| Node 24 LTS; exact npm/dependency versions pinned | Verify against installed tools/registry during T02 | Installation |
| One role per account: Writer, Reviewer or Admin | Confirmed by user | Apply in T06/T09/T38 |
| Admin manages all articles; reviewer approval still required to publish | Confirmed by user | Apply in T09/T29-T35 |
| Immediate deactivation denial; preserve content and audit history | Confirmed by user | Apply in T06-T09/T38 |
| Review quorum, self-review, revision invalidation | Proposed; needs review | T24, T29-T35 |
| Public archive vs withdrawal; expiry semantics | Unresolved | T11 final visibility, T35 |
| Invite-only vs public registration; first admin | Unresolved; no public registration implemented now | T37 |
| Rich-text format and video support | Unresolved | T24/T26-T27 |
| Team page | Conditional; client decision pending | T50 |
| Archived list as filter vs separate page | Filter proposed | Optional page beyond T35 |
| Mail provider, contact notification and abuse controls | Unresolved | T18/T40 |
| Supabase/Vercel hosted projects, domain and sender | Unselected | T52-T54 |
| Public content and legacy media permission | Unverified; no bulk copy | T12 and launch |

## Bounded implementation steps

T04 is split into T04a (unit/lint infrastructure), T04b (real browser smoke), and
T04c (local database runner). T05 is split into T05a (pinned CLI/config), T05b
(validated client factories), and T05c (live local integration evidence). These
are execution steps within the original task IDs, not additional product scope.
Each step targets at most five source/config files; execution notes and task
checkbox updates accompany its evidence. No domain migration is needed for this
foundation: disposable synthetic Auth fixtures prove live client connectivity.
T05d contains the local environment bootstrap and developer setup documentation.

## Verified toolchain compatibility

The installed Node is 24.19.0 with npm 12.0.2. Next.js 16.4.6 and React 19.3.1
are pinned. TypeScript 6.0.3 and ESLint 9.39.5 satisfy the installed Next.js lint
plugins' peer ranges; TypeScript 7 and ESLint 10 do not. ESLint 9 is an upstream
compatibility constraint to revisit when Next.js's plugins support ESLint 10.

A targeted override pins the lint parser's minimatch dependency to 11.0.1 for
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).
The parser uses its public named `minimatch` function, which the patched release
retains. Verify the resolved dependency tree, lint and audit after this override;
remove the override when upstream adopts a patched supported version.

## Local stack isolation

Default database port 54322 was already occupied. ICG uses project `icg-cms`
and ports 55320-55329 instead. No pre-existing container was stopped or changed.
The foundation start script excludes services not needed for DB/Auth/API/mail;
enable Storage, Realtime or Studio deliberately in their later feature tasks.

## Trust boundaries for this batch

- Browser bundles may receive only the Supabase URL and publishable key.
- Server Supabase clients use the caller's cookies, never an administrative key.
- Configuration errors identify the variable, never echo its value.
- Test provisioning uses the local stack only and deletes synthetic users.
- SQL tests use the local CLI target, never a supplied database URL or hosted link.
- The root app serves files from `public/` only; legacy PHP/uploads are not copied.
- Cookie/session refresh and authorization are T07/T09. Client factories alone
  do not constitute a secure login implementation.
