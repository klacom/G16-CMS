# Implementation Plan: ICG rebuild

Created: 2026-11-14 (Asia/Manila)
Status: T01-T05 authorized by the user; T02-T05 implemented and verified. T01's contract draft is delivered; business-rule reconciliation remains pending.
Task list target: [todo.md](todo.md). See [foundation evidence](foundation-evidence.md) and [local setup](setup.md).

## Overview

Rebuild the legacy Lundayan PHP/MySQL/jQuery CMS as ICG on Next.js, Supabase, and Vercel. Codex owns application implementation, backend, database migrations, authorization, integrations, and verification. Claude owns visual direction, tokens, static prototypes, and page handoffs under `design/`. The old MySQL database is lost, so this is a software rebuild with fresh data, not a historical-record import.

This plan is based on the local documents and selected legacy feature paths. It is not a claim that the external migration specification has been recovered or approved. The subsequent user-authorized foundation batch is recorded in foundation-evidence.md; no hosted resources or production deployment settings have been changed.

## Evidence and scope authority

- `CLAUDE.md`: rebuild stack, ownership split, legacy-reference boundary, no old database, branding conventions.
- `design/PAGES.md`: 28 screen/widget entries and P1/P2/P3 priorities.
- `.claude/skills/icg-prototype/SKILL.md`: Claude's prototype/handoff contract.
- `design/tokens.css` and `design/tailwind.config.js`: available design inputs; colors/fonts remain provisional.
- `README.md`: describes the legacy application; its PHP hosting instructions are not the new application's setup guide.
- Selected `php-backend/` and editor/reviewer PHP paths: behavioral evidence for invitations, approvals, scheduling, expiry, comments, and contact submissions. Their implementation and security behavior are not carried over as requirements.
- External plan: https://claude.ai/artifact/XLxYzwpGB6jzqUBMgaRGBL was inaccessible during discovery. Task 1 reconciles it if an accessible copy becomes available; otherwise explicitly records a replacement contract for review before dependent semantics are implemented.
- There is no existing `package.json`, Next.js application, Supabase project configuration, SQL schema, or prior `tasks/` plan in this checkout at planning time.
- Existing untracked `CLAUDE.md`, `.claude/`, and `design/` belong to ongoing design work and must be preserved.
- The planning skill's referenced `../../references/definition-of-done.md` was absent at its resolved local path. Verification requirements below are explicit proposed project gates, not a quotation of that missing file.

## Working assumptions

1. Keep the existing checkout and legacy files intact. Introduce the app at the repository root with source under `src/`, incremental migrations under `supabase/`, and evidence under `tasks/`.
2. Use Next.js App Router with TypeScript; choose actual compatible package versions from current official documentation at implementation time, then pin them. npm is the proposed package manager, pending Task 1.
3. Public routes use a `(public)` route group; dashboard and auth routes have separate layouts. Route groups do not change public URLs.
4. Use writer, reviewer, and admin as provisional business roles from PAGES.md. Exact overlap, publishing authority, self-review, quorum, and last-admin behavior require the Task 1 contract.
5. Seed synthetic ICG demo content locally. Do not infer permission to publish legacy personal data, copy credentials, or upload every legacy media file.
6. Store instants consistently and display in Asia/Manila as the proposed site timezone. Publication time and event time are distinct.
7. Functional development can proceed from an agreed contract while Claude works on design. Visual acceptance of a route requires its handoff; missing handoffs do not justify inventing a replacement visual direction.
8. Archive and expiry behavior are unresolved product semantics. In particular, confirm whether archived publications remain publicly discoverable, whether only widgets expire, and whether restoration requires a new approval.
9. Preview demonstration can use clearly identified fixtures; production authoring requires the complete authenticated review/publishing path.
10. No production deployment, domain cutover, paid provider selection, or production database target is assumed to be selected by this plan.

## Architecture decisions proposed for review

- **Incremental vertical slices:** add a feature's migration, policy, service, minimal working route/component, and focused tests together. Do not create the entire backend before anything can run.
- **Database authorization:** enable RLS and explicit grants on exposed tables. Enforce ownership, assignments, active status, and transitions at the data boundary as well as the server boundary. Hiding a menu is insufficient.
- **Server-controlled roles:** do not trust client-supplied role/actor fields or user-editable auth metadata. Verify sensitive access against current authoritative role/active state, including existing sessions after deactivation.
- **Server-first data access:** use authenticated server clients for privileged actions and explicit validated input/output contracts. Add route handlers for jobs, exports, or other actual HTTP consumers; do not manufacture a redundant REST API for every form.
- **Publication revisions:** provisionally bind reviews and public output to a revision, so editing approved content cannot silently publish unreviewed changes. Confirm the retention/version model in Task 1.
- **One eligibility contract:** public pages, direct API access, search, related stories, calendar, widgets, and media must agree on publication/revision/time/archival eligibility. Public read paths must not bypass RLS through a privileged client.
- **Private media by default:** draft covers/galleries are protected. Specify delivery and cache behavior for published and withdrawn media before exposing it. Public buckets alone cannot provide draft confidentiality.
- **Safe content:** select and document a structured rich-text format and renderer before authoring work; validate on the server and render through a supported safe subset.
- **Durable transitions:** publication scheduling, review decisions, audit attribution, notifications, and email retries need transaction/idempotency contracts. Choose the smallest deployment-compatible mechanism after validating current platform support.
- **Schema workflow:** prefer versioned incremental migrations for this greenfield app unless Task 1 deliberately selects declarative schemas. Discover current CLI behavior and generate migration filenames through supported tools; placeholders in todo.md are not literal migration names.
- **Secrets:** use environment/provider configuration, never editable public site settings, for mail/API credentials. Do not copy legacy hard-coded secrets into the new application.
- **Design:** Claude remains the owner of design assets. Codex implements working React components from the handoffs and returns contract discrepancies through `tasks/` notes, without overwriting Claude's prototypes.

Supabase guidance checked on 2026-11-14:
- [Changelog](https://supabase.com/changelog.md), including the relevant [CLI v3 targeting/confirmation change](https://supabase.com/changelog/supabase-cli-v3). Verify installed CLI help before choosing local/hosted commands.
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [SSR client setup for Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs).
- [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).
These references inform the proposed safeguards; package versions, exact APIs, and deployment behavior are rechecked during implementation.

## Dependency graph

```text
T01 contracts
  -> T02-T04 runnable app and verification
  -> T05-T10 local data, roles, sessions, recovery, audit primitive
       -> T11-T19 public content + P1 demo
       -> T20-T28 account, dashboard, owned draft, media, event editing
              -> T29-T32 invitations, assigned review, comments, decisions
                     -> T33-T35 publish, schedule, archive/expiry
                     -> T36 notifications
       -> T37-T46 onboarding, users, messages/mail, audit, settings
Public eligibility + settings -> T47-T49 embeds
Client team decision -> T50 optional team route
Completed feature gates -> T51 CI -> T52 isolated preview
  -> T53 cutover/rollback readiness -> T54 authorized release
```

The full dependency list is per task in todo.md. Numbering is a valid topological order, not a requirement to block independent work on an unrelated later-numbered dependency. Database migration generation/application remains serialized.

## Task index

### Foundation and early permission proof

- [ ] T01: Confirm implementation contracts
- [x] T02: Pin the application toolchain
- [x] T03: Boot the ICG application shell
- [x] T04: Establish verification runners
- [x] T05: Connect a local Supabase stack
- [ ] T06: Prove identity isolation
- [ ] T07: Implement sign-in sessions
- [ ] T08: Deliver password recovery
- [ ] T09: Verify role enforcement
- [ ] T10: Create the audit write primitive

### P1 public-site demo

- [ ] T11: Read a published article
- [ ] T12: Seed the public demo
- [ ] T13: Deliver the home feed
- [ ] T14: Deliver archive search
- [ ] T15: Add archive facets
- [ ] T16: Deliver the public calendar
- [ ] T17: Read public site information
- [ ] T18: Accept contact submissions
- [ ] T19: Complete public demo states

### P2 account and authoring

- [ ] T20: Deliver account settings
- [ ] T21: Upload an account avatar
- [ ] T22: Deliver the dashboard shell
- [ ] T23: Create an owned draft
- [ ] T24: Save safe article content
- [ ] T25: Edit article metadata
- [ ] T26: Attach an article cover
- [ ] T27: Manage article galleries
- [ ] T28: Edit event details

### P2 review and publishing

- [ ] T29: Invite reviewers
- [ ] T30: Respond to review assignments
- [ ] T31: Discuss a review
- [ ] T32: Record review decisions
- [ ] T33: Publish an approved revision
- [ ] T34: Schedule publication
- [ ] T35: Archive a publication
- [ ] T36: Deliver the notifications inbox

### P3 administration

- [ ] T37: Onboard an invited user
- [ ] T38: Manage user access
- [ ] T39: Read contact messages
- [ ] T40: Send contact replies
- [ ] T41: Browse the audit log
- [ ] T42: Export filtered audit records
- [ ] T43: Edit general site settings
- [ ] T44: Edit About content
- [ ] T45: Manage categories
- [ ] T46: Curate featured stories

### P3 embeds and optional team page

- [ ] T47: Deliver the events embed
- [ ] T48: Deliver the announcements embed
- [ ] T49: Build widget embed codes
- [ ] T50: Resolve the optional team page

### Validation and release

- [ ] T51: Automate validation in CI
- [ ] T52: Verify a Vercel preview
- [ ] T53: Prepare production cutover
- [ ] T54: Release the approved build

## Milestones and checkpoints

- **Early risk gate, T06-T10:** direct API permission denial, role/session enforcement, and unforgeable audit attribution have evidence before privileged authoring expands.
- **P1 demo, T19:** Home, Article, Archive, Calendar, About, and Contact work with local fixtures and Claude's accepted handoffs. No claim of a completed production CMS.
- **P2 editorial workflow, T36:** a writer creates content, reviewers discuss/decide, an approved revision is published or scheduled, and notifications/withdrawal work.
- **P3 operations, T49-T50:** users, messages, audit, settings, and embeds are functional; optional team scope is explicitly decided.
- **Release gate, T52-T54:** isolated preview validation, restoration rehearsal, runbook, and authorized production cutover.

Todo.md includes checkpoints after at most three tasks and at feature milestones. Present the evidence for review. Record unresolved feedback; dependent decisions remain blocked until resolved. Do not record user approval merely because checks pass.

## Verification contract

The entry points below were established and verified in the foundation batch. See foundation-evidence.md for actual results; future feature commands in todo.md remain proposals until their task is implemented:

| Entry point | Intended purpose |
| --- | --- |
| `npm run dev` | Local app |
| `npm run lint` | Source linting |
| `npm run typecheck` | TypeScript validation |
| `npm run build` | Production compilation |
| `npm run test:unit -- <path>` | Focused service/validation tests |
| `npm run test:e2e -- <path>` | Browser journey against an isolated app |
| `npm run test:db -- <selector>` | Migrations/RLS/transition tests in a disposable local stack |

Task 4 defines how database selectors are translated into the actual verified CLI/test runner commands. Never reset a hosted database to run tests.

For each behavioral slice:
- Prove an allowed user journey and a relevant denied/failure case. Database changes include direct Data API/RLS cases; mocked services alone are insufficient.
- Run its focused checks, typecheck/build when application code changes, and the phase checkpoint suite. Do not rerun unrelated exhaustive suites after every small edit.
- Introduce migrations with replay evidence from an empty local stack; generate/reconcile database types as part of the slice.
- Capture changed behavior, material limitations, and any remaining blocker. No skipped tests or suppressions to manufacture success.
- Verify interactive routes against real browser behavior, including keyboard operation, empty/error states, and Claude's 390 px/1440 px handoff requirements.
- Include public metadata/canonical URL, related-story/tag links, and safe share URLs when integrating the article handoff; prevent indexing of auth/dashboard/preview-only pages.
- Add privacy-conscious error/job/mail diagnostics with the feature. Audit events are user activity records, not substitutes for operational failure monitoring.

Likely file lists are estimates capped at five files per task, including generated types where listed. Reuse established components to keep slices bounded. If implementation reveals a larger change, split that task in todo.md before writing it; include lockfile/generated-artifact changes in the estimate.

## Claude coordination

| Claude owns | Codex consumes/builds |
| --- | --- |
| `design/tokens.css`, visual direction | App token integration and compatible styles |
| `design/prototypes/<page>.html` | React/Next.js route and components |
| `design/handoff/<page>.md` | Props, data mapping, behavior, states |
| Mobile and desktop composition | Runtime responsiveness and accessibility checks |

Before integrating a page, read its handoff and agree field names with tasks/contracts.md. Missing handoffs are recorded as design dependencies for visual completion. The current checkout contains tokens and PAGES.md, but no prototype/handoff files yet.

Claude can continue design alongside Codex's implementation. Independent application slices can be scheduled concurrently only after contracts are established, with exclusive file ownership and serialized shared migrations. This plan does not spawn agents or authorize edits to Claude-owned files.

## Route coverage

| Source entries in PAGES.md | Planned tasks |
| --- | --- |
| 1 Home | T13, T19, T46 |
| 2 Article | T11, T24, T27-T28, T33 |
| 3 Archive | T14-T15 |
| 4 Calendar | T16, T28 |
| 5 About | T17, T44 |
| 6 Contact | T17-T18, T39-T40 |
| 7 Team | T50 (conditional) |
| 8 Not found/error | T19 |
| 9 Login | T07 |
| 10-11 Forgot/reset password | T08 |
| 12 Accept invite | T37 (sign-up decision required) |
| 13-14 Dashboard shell/overview | T22 |
| 15 Inbox | T29-T30, T36 |
| 16 Account | T20-T21 |
| 17-18 Writer list/editor | T23-T29, T33-T35 |
| 19 Archived filter | T35; separate route decision remains optional |
| 20-21 Review queue/detail | T30-T32 |
| 22 Users | T37-T38 |
| 23 Messages | T39-T40 |
| 24 Audit | T10, T41-T42 |
| 25 Settings | T43-T46 |
| 26 Embed builder | T49 |
| 27-28 Widgets | T47-T48 |

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Missing external data/workflow plan | High | T01 obtains or explicitly replaces/reviews the contract; dependent semantics stay provisional. |
| Legacy endpoint bugs mistaken for requirements | High | Preserve user outcomes, verify permissions independently, keep legacy code unchanged. |
| Draft/withdrawn content leaks through media, joins, caches, or API | High | One eligibility contract, protected storage, direct API tests, revision-bound publication, timed boundary tests. |
| Stale sessions retain admin/reviewer access | High | Current-role/active checks on sensitive operations; deactivation tests with an existing token. |
| Review/content edits race | High | Version checks, transactional guarded transitions, invalidated stale approvals. |
| Unavailable local tooling or hosted access | Medium | T02-T06 validate tool prerequisites early; no hosted dependency is assumed for offline contract work. |
| Design changes during implementation | Medium | Consume handoffs by route, retain token ownership, log field mismatches before coding. |
| Mail delivery/provider retries | Medium | Sandbox verification, durable status, idempotency, secrets outside public settings. |
| Scheduled job limits or platform changes | Medium | Verify current deployment capability and delivery delay before choosing a scheduler. |
| No recoverable old database | High | Synthetic demo seed and client-approved new content; no invented historical import task. |
| Legacy credentials committed in repository | High | Do not reuse; owner rotates exposed credentials before launch, without publishing their values in evidence. |
| Large initial bootstrap or feature expands beyond a session | Medium | Split tasks before implementation; keep a runnable boundary and update dependency IDs. |

## Open decisions and when they block work

| Decision | Blocks |
| --- | --- |
| Accessible migration specification or explicit replacement contract | T01 completion; final schema/state machine semantics |
| Writer/reviewer/admin permissions, publishing actor, review quorum, self-review | T06/T09 contract; T29-T35 behavior |
| Revision retention and edits after approval/publication | T24, T32-T35 |
| Public archive vs withdrawn article behavior, expiry, restoration | T11 visibility contract, T35 |
| Invite-only vs public sign-up and first-admin provisioning | T37; production setup |
| Rich-text editor/content format; video upload vs allowed embeds and limits | T24, T26-T27; add a bounded video slice only if required by approved scope |
| Selected Supabase projects, local tooling, environments | T05 local prerequisites; T52 hosted verification |
| Email provider, verified sender, abuse controls and contact notification policy | T18 abuse contract; T40 delivery |
| Team page retained? Archived filter or separate page? | T50; only optional UI scope for archive beyond T35 |
| Approved domain, scheduler delay, canonical URLs and redirect scope | T34 timing; T52-T54 deployment |
| Content/asset permissions, upload limits, message/audit retention | T12/T18/T21/T26/T41; final production readiness |
| Claude page handoffs and final token/font decisions | Visual acceptance of affected routes |

Do not turn every open decision into a global stop. Continue independent contract/tooling work and ask only when the affected implementation is next. A missing answer is not approval.

## Planning validation

- [x] Existing plan/task files checked; none existed.
- [x] Every task has acceptance criteria, verification, dependencies, likely files, and scope.
- [x] Dependencies point only to earlier tasks.
- [x] Each task estimates at most five files; split again if actual scope expands.
- [x] Checkpoints occur after no more than three tasks.
- [x] All 28 documented screen/widget entries are mapped.
- [x] Claude's design work and legacy files are preserved.
- [x] Provisional decisions and proposed commands are labeled.
- [x] User authorized implementation of T01-T05, including the technical foundation conventions.
- [ ] Business-rule decisions and remaining implementation milestones have received their applicable review.
