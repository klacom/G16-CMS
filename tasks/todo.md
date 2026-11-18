# ICG implementation tasks

Created: 2026-11-14 (Asia/Manila). Updated 2026-11-17: the user approved the full replacement contract in backend-plan.md. T02-T05 remain complete. Follow backend-todo.md for the implementation slices; the original detailed task inventory below is preserved for traceability.

Read [plan.md](plan.md) first. This is the execution checklist. Paths for future tasks are proposed repository-relative paths. Migration placeholders mean one tool-generated migration file, not a literal filename. Foundation commands now exist; verification results are in [foundation-evidence.md](foundation-evidence.md). Each future database task includes direct policy checks and type regeneration within its file budget. Every business mutation must use the T10 audit primitive once introduced. If a slice needs more than five files or a session, split it before implementing.

Complete a task checkbox only when its acceptance criteria and verification have evidence. Decisions, credentials, provider choice, and Claude handoffs must be resolved only for the tasks that depend on them. Conditional tasks are not silently omitted.

# Phase: Foundation and early permission proof

## Task T01: Confirm implementation contracts

- [ ] T01 complete

**Description:** Reconcile local scope with the inaccessible migration plan before fixing schema and workflow semantics.

**Acceptance criteria:**
- [ ] Record public visibility, role permissions, review quorum, revision invalidation, archive/expiry rules, and all 28 route mappings.
- [x] Mark unresolved decisions with affected task IDs; do not treat inferred fields as the approved external data model.

**Progress:** contracts.md maps all 28 routes and records proposed permissions/state/visibility rules. decisions.md identifies the remaining gates. The external specification and final client decisions remain unavailable; T01 is intentionally not marked complete. The user's explicit technical-foundation authorization allows T02-T05 to proceed independently of those business decisions.

**Verification:**
- [ ] Document review against CLAUDE.md and design/PAGES.md; no runtime checks yet.
- [ ] Manual check: Walk through draft → review → publication and a rejected access attempt.

**Dependencies:** None.

**Files likely touched:**
- `tasks/contracts.md`
- `tasks/decisions.md`
- `tasks/plan.md`
- `tasks/todo.md`

**Estimated scope:** Medium: 3-5 files.

## Task T02: Pin the application toolchain

- [x] T02 complete

**Description:** Establish the proposed root-level Next.js TypeScript package without moving legacy files.

**Acceptance criteria:**
- [x] Pin verified compatible dependency versions and commit a lockfile; identify Node and package-manager requirements.
- [x] Define dev/build/lint/typecheck scripts and TypeScript configuration without importing or serving legacy PHP.

**Verification:**
- [x] Clean lockfile installation with npm ci --ignore-scripts --offline from the downloaded cache; npm run typecheck after Task 3.
- [x] Manual check: Review dependency versions against official documentation and inspect install scripts before normal installation.

**Dependencies:** None. The user authorized the technical foundation conventions; outstanding business semantics are independent.

**Files likely touched:**
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `next-env.d.ts`
- `tasks/decisions.md`

**Estimated scope:** Medium: 3-5 files.

## Task T03: Boot the ICG application shell

- [x] T03 complete

**Description:** Make a minimal application run using the shared design tokens as the integration boundary.

**Acceptance criteria:**
- [x] The Next.js root route starts and builds; environment files and local artifacts are ignored.
- [x] Use ICG branding and Claude-owned tokens; document provisional styling until a prototype handoff arrives.

**Verification:**
- [x] npm run typecheck; npm run build; npm run dev.
- [x] Manual check: Open the root route; confirm legacy folders are not copied into public/.

**Dependencies:** T02.

**Files likely touched:**
- `src/app/layout.tsx`
- `src/app/(public)/page.tsx`
- `src/app/globals.css`
- `next.config.ts`
- `.gitignore`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T03

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T04: Establish verification runners

- [x] T04 complete

**Description:** Add focused application, browser, and database test entry points before behavioral work.

**Acceptance criteria:**
- [x] Provide working test:unit, test:e2e, and test:db scripts with deterministic isolated fixtures.
- [x] A minimal smoke test passes; a deliberate failure is detected; lint and typecheck are enforced.

**Verification:**
- [x] npm run test:unit -- tests/smoke.test.ts; npm run lint; npm run typecheck; npm run build.
- [x] Manual check: Run the browser runner against the root route; document database-runner prerequisites.

**Dependencies:** T03.

**Files likely touched:**
- `package.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `tests/smoke.test.ts`
- `eslint.config.mjs`

**Estimated scope:** Medium: 3-5 files.

## Task T05: Connect a local Supabase stack

- [x] T05 complete

**Description:** Configure reproducible local development with separate browser/server clients and environment validation.

**Acceptance criteria:**
- [x] The application connects to a disposable local stack; missing configuration produces a clear development error.
- [x] Only publishable configuration can enter the browser bundle; secret keys stay server-side; CLI commands are verified with --help.

**Verification:**
- [x] Start the local stack using verified CLI commands; npm run typecheck; npm run build.
- [x] Manual check: Read a harmless local fixture through the application; inspect client output for secret exposure.

**Dependencies:** T04.

**Files likely touched:**
- `supabase/config.toml`
- `.env.example`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/browser.ts`
- `src/lib/env.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T06: Prove identity isolation

- [ ] T06 complete

**Description:** Introduce the minimum profile/role foundation and a database policy test harness before feature tables expand.

**Confirmed rules:** One role per account initially (Writer, Reviewer or Admin).
Inactive accounts must lose authenticated access immediately; retain their
articles, authorship and audit history. See decisions.md for the user confirmation.

**Acceptance criteria:**
- [ ] Users cannot assign themselves roles or modify another profile; authorization uses server-controlled records.
- [ ] Anonymous, writer, reviewer, admin, and inactive-user policy cases run against a resettable local database.

**Verification:**
- [ ] npm run test:db -- identity; npm run typecheck; npm run build.
- [ ] Manual check: Attempt unauthorized profile/role changes directly through the Data API.

**Dependencies:** T01, T05.

**Files likely touched:**
- `supabase/migrations/<generated_identity>.sql`
- `supabase/tests/identity.test.sql`
- `src/lib/auth/permissions.ts`
- `src/types/database.ts`
- `tasks/decisions.md`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T06

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T07: Implement sign-in sessions

- [ ] T07 complete

**Description:** Deliver login/logout with server-validated identity and safe session refresh.

**Acceptance criteria:**
- [ ] Valid credentials establish a session; invalid credentials receive safe errors; logout clears access.
- [ ] Protected routes and mutations reject missing, expired, or inactive sessions; redirect targets are constrained.

**Verification:**
- [ ] npm run test:e2e -- tests/auth/login.spec.ts; npm run typecheck; npm run build.
- [ ] Manual check: Sign in and out in two browser sessions; revisit a protected URL after logout.

**Dependencies:** T06.

**Files likely touched:**
- `src/app/login/page.tsx`
- `src/app/login/actions.ts`
- `src/proxy.ts`
- `src/lib/auth/session.ts`
- `tests/auth/login.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T08: Deliver password recovery

- [ ] T08 complete

**Description:** Complete request/reset screens using the verified Supabase recovery flow.

**Acceptance criteria:**
- [ ] Recovery requests avoid account enumeration and use allowed callback URLs.
- [ ] Valid recovery links update the password; expired/reused links and invalid input receive recoverable states.

**Verification:**
- [ ] npm run test:e2e -- tests/auth/recovery.spec.ts; npm run typecheck; npm run build.
- [ ] Manual check: Use local captured email to complete recovery and test an expired link.

**Dependencies:** T07.

**Files likely touched:**
- `src/app/forgot-password/page.tsx`
- `src/app/reset-password/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/lib/auth/recovery.ts`
- `tests/auth/recovery.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T09: Verify role enforcement

- [ ] T09 complete

**Description:** Exercise server and database authorization together before authoring or administration is introduced.

**Confirmed rules:** Admins may manage every article but cannot bypass reviewer
approval before publication. Existing sessions must not retain authenticated
access after account deactivation. Editorial quorum/self-review remain separate
decisions; do not treat them as confirmed by the admin-management decision.

**Acceptance criteria:**
- [ ] A shared permission contract covers ownership, reviewer assignments, administrative actions, and inactive users.
- [ ] Tests deny forged identities, cross-user access, direct API bypasses, and role changes with an existing session.

**Verification:**
- [ ] npm run test:db -- authorization; npm run test:unit -- tests/auth/permissions.test.ts; npm run build.
- [ ] Manual check: Attempt a privileged action as each role; verify navigation is not the security boundary.

**Dependencies:** T07.

**Files likely touched:**
- `src/lib/auth/permissions.ts`
- `src/lib/auth/session.ts`
- `supabase/tests/authorization.test.sql`
- `tests/auth/permissions.test.ts`
- `tasks/contracts.md`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T09

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T10: Create the audit write primitive

- [ ] T10 complete

**Description:** Establish append-only server-attributed audit recording before privileged mutations are built.

**Acceptance criteria:**
- [ ] Clients cannot forge actor/time or alter audit entries; sensitive payloads and secrets are excluded.
- [ ] A privileged change and its audit event have a defined atomic failure contract that is verified in a disposable database.

**Verification:**
- [ ] npm run test:db -- audit; npm run typecheck; npm run build.
- [ ] Manual check: Attempt to insert, edit, or delete an audit record through an unprivileged client.

**Dependencies:** T09.

**Files likely touched:**
- `supabase/migrations/<generated_audit>.sql`
- `src/lib/audit/record.ts`
- `supabase/tests/audit.test.sql`
- `src/types/database.ts`
- `tasks/contracts.md`

**Estimated scope:** Medium: 3-5 files.

# Phase: P1 public-site demo

## Task T11: Read a published article

- [ ] T11 complete

**Description:** Create the smallest content slice: a safe public article detail backed by incremental schema.

**Acceptance criteria:**
- [ ] A published due article resolves by unique slug with excerpt, author attribution, and safe body output.
- [ ] Draft, in-review, future, and withdrawn content is inaccessible by slug or direct Data API requests under the agreed visibility rules.
- [ ] Public detail includes category/tag links, related eligible stories, canonical metadata, safe share URLs, and available fixture cover/gallery/event blocks; later authoring tasks replace fixture-only controls.

**Verification:**
- [ ] npm run test:db -- articles-public; npm run typecheck; npm run build.
- [ ] Manual check: Read a published story and attempt to access a draft and a future story without signing in.

**Dependencies:** T01, T09.

**Files likely touched:**
- `supabase/migrations/<generated_articles>.sql`
- `src/lib/articles/public.ts`
- `src/app/(public)/news/[slug]/page.tsx`
- `supabase/tests/articles-public.test.sql`
- `src/types/database.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T12: Seed the public demo

- [ ] T12 complete

**Description:** Provide deterministic synthetic ICG examples for public journeys and policy edge cases.

**Acceptance criteria:**
- [ ] Local-only fixtures include visible, future, draft, archived, event, and announcement examples with realistic copy.
- [ ] Reset/reseed is repeatable; existing media is reused only when ownership and suitability are confirmed; production seeding is separate.

**Verification:**
- [ ] Reset the disposable local stack twice; npm run test:db; npm run build.
- [ ] Manual check: Confirm stable fixture slugs and that private fixture content never appears publicly.

**Dependencies:** T11.

**Files likely touched:**
- `supabase/seed.sql`
- `tests/fixtures/content.ts`
- `tasks/demo-data.md`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T12

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T13: Deliver the home feed

- [ ] T13 complete

**Description:** Connect the home route to bounded featured/latest/announcement queries using Claude's handoff.

**Acceptance criteria:**
- [ ] The home feed uses only public-eligible stories with deterministic ordering and fallbacks for missing images.
- [ ] Featured slots, latest items, and announcement summaries show empty/error states without exposing private fields.

**Verification:**
- [ ] npm run test:e2e -- tests/public/home.spec.ts; npm run typecheck; npm run build.
- [ ] Manual check: Compare 390 px and 1440 px output with Claude's home handoff.

**Dependencies:** T11, T12.

**Files likely touched:**
- `src/app/(public)/page.tsx`
- `src/lib/articles/home.ts`
- `src/components/public/ArticleCard.tsx`
- `src/components/public/HomeFeed.tsx`
- `tests/public/home.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T14: Deliver archive search

- [ ] T14 complete

**Description:** Build bounded search with stable pagination before adding additional facets.

**Acceptance criteria:**
- [ ] Search is validated, paginated, URL-addressable, and limited to public-eligible content.
- [ ] Empty results, malformed input, ties in ordering, and page boundaries behave consistently.

**Verification:**
- [ ] npm run test:e2e -- tests/public/archive.spec.ts; npm run typecheck; npm run build.
- [ ] Manual check: Search, change pages, reload the URL, and inspect an empty result.

**Dependencies:** T11, T12.

**Files likely touched:**
- `src/app/(public)/archive/page.tsx`
- `src/lib/articles/search.ts`
- `src/components/public/ArchiveResults.tsx`
- `tests/public/archive.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T15: Add archive facets

- [ ] T15 complete

**Description:** Extend the working archive with category, tag, and year/month filters.

**Acceptance criteria:**
- [ ] Combining facets and search returns consistent totals and stable pagination; changing a filter resets invalid page state.
- [ ] Public taxonomy exposes no private article counts; invalid dates and unknown filters are handled safely.

**Verification:**
- [ ] npm run test:e2e -- tests/public/archive.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Combine category, tag, and month filters and revisit the shared URL.

**Dependencies:** T14.

**Files likely touched:**
- `supabase/migrations/<generated_taxonomy>.sql`
- `src/lib/articles/search.ts`
- `src/app/(public)/archive/page.tsx`
- `tests/public/archive.spec.ts`
- `src/types/database.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T15

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T16: Deliver the public calendar

- [ ] T16 complete

**Description:** Show events by actual event times rather than inheriting legacy publication-date behavior.

**Acceptance criteria:**
- [ ] Month queries include eligible overlapping/multi-day events using UTC storage and the approved site timezone.
- [ ] Month grid, upcoming list, and detail state handle month/year boundaries and empty months.

**Verification:**
- [ ] npm run test:e2e -- tests/public/calendar.spec.ts; npm run typecheck; npm run build.
- [ ] Manual check: Check a multi-day event crossing a month boundary in Asia/Manila.

**Dependencies:** T11, T12.

**Files likely touched:**
- `src/lib/events/queries.ts`
- `src/app/(public)/calendar/page.tsx`
- `src/components/public/Calendar.tsx`
- `tests/public/calendar.spec.ts`
- `src/components/public/HomeFeed.tsx`

**Estimated scope:** Medium: 3-5 files.

## Task T17: Read public site information

- [ ] T17 complete

**Description:** Serve About sections and public contact/general information from a safe settings projection.

**Acceptance criteria:**
- [ ] About and contact information render from structured public settings with ICG fallback content.
- [ ] Anonymous access cannot retrieve mail credentials, internal configuration, or unpublished settings.

**Verification:**
- [ ] npm run test:db -- settings-public; npm run typecheck; npm run build.
- [ ] Manual check: Open About with populated and empty settings; attempt to query internal configuration.

**Dependencies:** T09, T12.

**Files likely touched:**
- `supabase/migrations/<generated_settings>.sql`
- `src/lib/settings/public.ts`
- `src/app/(public)/about/page.tsx`
- `supabase/tests/settings-public.test.sql`
- `src/types/database.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T18: Accept contact submissions

- [ ] T18 complete

**Description:** Deliver a validated public contact form with durable storage and abuse controls.

**Acceptance criteria:**
- [ ] Valid submissions are stored once with bounded fields and usable success/error feedback; private messages are admin-only.
- [ ] Malformed input, repeated submissions, honeypot/rate-limit cases, and delivery/storage failures have explicit behavior.

**Verification:**
- [ ] npm run test:unit -- tests/contact/submit.test.ts; npm run test:db; npm run build.
- [ ] Manual check: Submit once, repeat, trigger the abuse limit, and attempt anonymous message reads.

**Dependencies:** T10, T17.

**Files likely touched:**
- `supabase/migrations/<generated_messages>.sql`
- `src/lib/contact/submit.ts`
- `src/app/(public)/contact/page.tsx`
- `tests/contact/submit.test.ts`
- `src/types/database.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T18

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T19: Complete public demo states

- [ ] T19 complete

**Description:** Integrate shared public navigation and resilient loading/not-found/error behavior.

**Acceptance criteria:**
- [ ] All six P1 routes are reachable and shared navigation works at 390 px and 1440 px.
- [ ] Unknown slugs, dependency failures, and loading states preserve accessible recovery actions without leaking diagnostics.

**Verification:**
- [ ] npm run test:e2e -- tests/public/journey.spec.ts; npm run lint; npm run typecheck; npm run build.
- [ ] Manual check: Walk Home → Article → Archive → Calendar → About → Contact using keyboard and mobile navigation.

**Dependencies:** T13, T15, T16, T17, T18.

**Files likely touched:**
- `src/app/(public)/layout.tsx`
- `src/components/public/SiteNavigation.tsx`
- `src/app/not-found.tsx`
- `src/app/error.tsx`
- `tests/public/journey.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T19 — P1 public demo

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

# Phase: P2 account and authoring

## Task T20: Deliver account settings

- [ ] T20 complete

**Description:** Allow a signed-in user to maintain their own profile and verified account email.

**Acceptance criteria:**
- [ ] Name changes affect only the current profile; email changes follow verification and display pending/error states.
- [ ] Password changes use the authenticated account flow; all privileged profile changes are attributed in audit records.

**Verification:**
- [ ] npm run test:e2e -- tests/account/settings.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Change a name, request an email change, and test invalid password input.

**Dependencies:** T08, T10.

**Files likely touched:**
- `src/app/dashboard/account/page.tsx`
- `src/lib/account/update.ts`
- `src/lib/auth/recovery.ts`
- `tests/account/settings.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T21: Upload an account avatar

- [ ] T21 complete

**Description:** Introduce storage with a tightly bounded profile-image use case.

**Acceptance criteria:**
- [ ] Only the account owner can upload/replace their avatar; type, size, content, and path are validated.
- [ ] Unsafe formats and cross-user object access fail; replacement/deletion handles references without leaking draft media.

**Verification:**
- [ ] npm run test:unit -- tests/media/avatar.test.ts; npm run test:db; npm run build.
- [ ] Manual check: Upload and replace an avatar; try another user's object path and an invalid file.

**Dependencies:** T20.

**Files likely touched:**
- `supabase/migrations/<generated_avatar_storage>.sql`
- `src/lib/media/avatar.ts`
- `src/app/dashboard/account/page.tsx`
- `tests/media/avatar.test.ts`
- `src/types/database.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T22: Deliver the dashboard shell

- [ ] T22 complete

**Description:** Connect role-aware navigation and bounded per-role overview queries.

**Acceptance criteria:**
- [ ] Writers see their drafts/statuses, reviewers their queue summary, and admins permitted aggregate statistics.
- [ ] Role-based navigation, empty/error states, and direct URL authorization agree with the permission contract.

**Verification:**
- [ ] npm run test:e2e -- tests/dashboard/overview.spec.ts; npm run typecheck; npm run build.
- [ ] Manual check: Open the dashboard as every role and try a hidden route directly.

**Dependencies:** T09, T10, T19.

**Files likely touched:**
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/Navigation.tsx`
- `src/lib/dashboard/overview.ts`
- `tests/dashboard/overview.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T22

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T23: Create an owned draft

- [ ] T23 complete

**Description:** Deliver writer draft creation and an owner-filtered article list.

**Acceptance criteria:**
- [ ] Creating a draft assigns the authenticated writer, records an audit event, and opens its edit route.
- [ ] Status/search filters list only permitted articles; clients cannot set another author or begin in a published state.

**Verification:**
- [ ] npm run test:e2e -- tests/articles/drafts.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Create two writers' drafts; attempt cross-owner reads and edits.

**Dependencies:** T10, T11, T22.

**Files likely touched:**
- `supabase/migrations/<generated_article_writes>.sql`
- `src/lib/articles/drafts.ts`
- `src/app/dashboard/articles/page.tsx`
- `src/app/dashboard/articles/[id]/edit/page.tsx`
- `tests/articles/drafts.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T24: Save safe article content

- [ ] T24 complete

**Description:** Connect a chosen rich-text editor to revision-aware validated saves.

**Acceptance criteria:**
- [ ] The chosen content format preserves supported blocks while preventing stored script/unsafe URL execution in previews and public output.
- [ ] Conflicting edits are detected; saving content invalidates approval when required and leaves failed saves recoverable.

**Verification:**
- [ ] npm run test:unit -- tests/articles/content.test.ts; npm run test:db; npm run build.
- [ ] Manual check: Save rich content, attempt malicious content, and edit concurrently in two sessions.

**Dependencies:** T01, T23.

**Files likely touched:**
- `src/lib/articles/save.ts`
- `src/lib/articles/content.ts`
- `src/components/editor/BodyEditor.tsx`
- `src/app/dashboard/articles/[id]/edit/page.tsx`
- `tests/articles/content.test.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T25: Edit article metadata

- [ ] T25 complete

**Description:** Connect title, excerpt, category, tags, type, and slug fields to the existing draft editor.

**Acceptance criteria:**
- [ ] Validated metadata persists with unique slug handling, length bounds, and allowed taxonomy relations.
- [ ] Only permitted writers/admins can change metadata; changes follow revision and audit rules.

**Verification:**
- [ ] npm run test:unit -- tests/articles/metadata.test.ts; npm run test:db; npm run build.
- [ ] Manual check: Save duplicate slugs, long titles, new/existing tags, and an invalid category.

**Dependencies:** T15, T24.

**Files likely touched:**
- `src/lib/articles/metadata.ts`
- `src/components/editor/MetadataForm.tsx`
- `src/app/dashboard/articles/[id]/edit/page.tsx`
- `tests/articles/metadata.test.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T25

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T26: Attach an article cover

- [ ] T26 complete

**Description:** Extend protected storage to cover-image upload and safe delivery.

**Acceptance criteria:**
- [ ] Draft covers are accessible only to permitted participants; public images are delivered only under the content visibility contract.
- [ ] Ownership/type/size checks and reference-safe removal hold through retries and replacement.

**Verification:**
- [ ] npm run test:unit -- tests/media/article-cover.test.ts; npm run test:db; npm run build.
- [ ] Manual check: Upload a draft cover; try its URL anonymously before and after publication.

**Dependencies:** T21, T24.

**Files likely touched:**
- `supabase/migrations/<generated_article_media>.sql`
- `src/lib/media/articles.ts`
- `src/components/editor/CoverField.tsx`
- `tests/media/article-cover.test.ts`
- `src/types/database.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T27: Manage article galleries

- [ ] T27 complete

**Description:** Add ordered galleries using the existing article-media permission boundary.

**Acceptance criteria:**
- [ ] Writers add/reorder/remove gallery assets with alt text and deterministic ordering.
- [ ] Deleting an attachment cannot delete another article's asset; draft gallery assets remain private.

**Verification:**
- [ ] npm run test:unit -- tests/media/gallery.test.ts; npm run test:db; npm run build.
- [ ] Manual check: Reorder images, remove a shared reference, and inspect the published gallery.

**Dependencies:** T26.

**Files likely touched:**
- `src/lib/media/gallery.ts`
- `src/components/editor/GalleryField.tsx`
- `src/app/(public)/news/[slug]/page.tsx`
- `tests/media/gallery.test.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T28: Edit event details

- [ ] T28 complete

**Description:** Add event-specific fields and preview them through the existing event display.

**Acceptance criteria:**
- [ ] Event articles require valid start/end times and allowed venue/map URLs; announcement/ordinary articles have correct field behavior.
- [ ] Timezone conversion and cross-month event behavior agree with the public calendar.

**Verification:**
- [ ] npm run test:unit -- tests/articles/event-fields.test.ts; npm run test:e2e -- tests/public/calendar.spec.ts; npm run build.
- [ ] Manual check: Create an overnight event and confirm its local display and calendar position.

**Dependencies:** T16, T25.

**Files likely touched:**
- `src/lib/articles/event-fields.ts`
- `src/components/editor/EventFields.tsx`
- `src/app/dashboard/articles/[id]/edit/page.tsx`
- `tests/articles/event-fields.test.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T28

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

# Phase: P2 review and publishing

## Task T29: Invite reviewers

- [ ] T29 complete

**Description:** Allow a writer to submit a revision for review and invite eligible reviewers.

**Acceptance criteria:**
- [ ] Only permitted authors/admins invite reviewers for the current revision; duplicates and self-review follow the approved contract.
- [ ] Submitting creates a reviewable state and durable inbox event, with atomic audit attribution.

**Verification:**
- [ ] npm run test:unit -- tests/reviews/invite.test.ts; npm run test:db; npm run build.
- [ ] Manual check: Invite a reviewer, retry the request, and attempt a self/cross-owner invitation.

**Dependencies:** T01, T10, T24.

**Files likely touched:**
- `supabase/migrations/<generated_reviews>.sql`
- `src/lib/reviews/invite.ts`
- `src/components/editor/ReviewerPicker.tsx`
- `tests/reviews/invite.test.ts`
- `src/types/database.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T30: Respond to review assignments

- [ ] T30 complete

**Description:** Deliver accept/decline, assignment queue, and step-down behavior.

**Acceptance criteria:**
- [ ] Only the addressed reviewer responds; accepted assignments open a read-only current-revision preview.
- [ ] Declining, stepping down, or canceling an assignment updates eligibility/quorum as agreed and is safe to retry.

**Verification:**
- [ ] npm run test:e2e -- tests/reviews/assignments.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Accept, decline, and step down using assigned and unassigned reviewer sessions.

**Dependencies:** T29.

**Files likely touched:**
- `src/lib/reviews/assignments.ts`
- `src/app/dashboard/reviews/page.tsx`
- `src/app/dashboard/reviews/[id]/page.tsx`
- `tests/reviews/assignments.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T31: Discuss a review

- [ ] T31 complete

**Description:** Add participant-scoped comments linked to the reviewed revision.

**Acceptance criteria:**
- [ ] Permitted author/reviewers can read and add comments; edits/deletes follow authorship and moderation rules.
- [ ] Safe output, empty/error states, and revision context survive reload; unrelated users cannot access the thread.

**Verification:**
- [ ] npm run test:unit -- tests/reviews/comments.test.ts; npm run test:db; npm run build.
- [ ] Manual check: Comment as each participant and attempt access as an unrelated writer.

**Dependencies:** T30.

**Files likely touched:**
- `supabase/migrations/<generated_review_comments>.sql`
- `src/lib/reviews/comments.ts`
- `src/components/reviews/Comments.tsx`
- `tests/reviews/comments.test.ts`
- `src/types/database.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T31

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T32: Record review decisions

- [ ] T32 complete

**Description:** Deliver approve/request-changes as guarded transitions on a specific revision.

**Acceptance criteria:**
- [ ] Only active assigned reviewers decide; the agreed quorum yields the correct status without zero-reviewer accidental approval.
- [ ] Concurrent/replayed decisions are consistent; editing reviewed content invalidates decisions as specified and emits audit/inbox events.

**Verification:**
- [ ] npm run test:unit -- tests/reviews/decisions.test.ts; npm run test:db; npm run build.
- [ ] Manual check: Approve a revision, change its content, and attempt publication using the stale approval.

**Dependencies:** T01, T30, T31.

**Files likely touched:**
- `src/lib/reviews/decide.ts`
- `src/components/reviews/DecisionActions.tsx`
- `supabase/migrations/<generated_review_transitions>.sql`
- `tests/reviews/decisions.test.ts`
- `src/types/database.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T33: Publish an approved revision

- [ ] T33 complete

**Description:** Expose only an approved immutable revision through every public read path.

**Acceptance criteria:**
- [ ] Only the approved publishing actor can publish a currently approved revision; direct status updates cannot bypass the transition.
- [ ] Article detail, feed, archive, calendar, widgets, and media use the same public eligibility contract; cache refresh exposes the correct revision.

**Verification:**
- [ ] npm run test:e2e -- tests/articles/publish.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Publish, then edit a new draft revision; verify public readers keep seeing the approved version.

**Dependencies:** T26, T27, T28, T32.

**Files likely touched:**
- `src/lib/articles/publish.ts`
- `src/lib/articles/public.ts`
- `supabase/migrations/<generated_publication>.sql`
- `tests/articles/publish.spec.ts`
- `src/types/database.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T34: Schedule publication

- [ ] T34 complete

**Description:** Add durable scheduled transitions with explicit UTC/site-timezone boundaries.

**Acceptance criteria:**
- [ ] Only approved revisions can be scheduled; future revisions stay private until due across direct API, page caches, and media.
- [ ] An authenticated scheduled worker retries idempotently, records failures, and refreshes public data within the agreed delay.

**Verification:**
- [ ] npm run test:unit -- tests/articles/schedule.test.ts; npm run test:db; npm run build.
- [ ] Manual check: Advance a controlled clock over a boundary; replay the worker and test unauthorized invocation.

**Dependencies:** T33.

**Files likely touched:**
- `src/lib/articles/schedule.ts`
- `src/app/api/jobs/publication/route.ts`
- `vercel.json`
- `tests/articles/schedule.test.ts`
- `tasks/operations.md`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T34

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T35: Archive a publication

- [ ] T35 complete

**Description:** Deliver reversible archive controls and agreed expiry behavior.

**Acceptance criteria:**
- [ ] Archiving/restoring follows permission and revision rules; configured expiry uses the same idempotent scheduling path.
- [ ] Public detail/search/feed/calendar/media stop exposing withdrawn content under the agreed cache policy; dashboard archived filtering remains available.

**Verification:**
- [ ] npm run test:e2e -- tests/articles/archive.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Archive and restore an article; check public URLs, caches, scheduled expiry, and writer filtering.

**Dependencies:** T01, T34.

**Files likely touched:**
- `src/lib/articles/archive.ts`
- `src/lib/articles/schedule.ts`
- `src/app/dashboard/articles/page.tsx`
- `tests/articles/archive.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T36: Deliver the notifications inbox

- [ ] T36 complete

**Description:** Expose durable workflow events and scoped mention notifications.

**Acceptance criteria:**
- [ ] Review invitations/decisions and permitted mentions show only to intended recipients with read/unread and pagination states.
- [ ] Events deduplicate on retries; mention parsing does not grant access or expose private content to unpermitted recipients.

**Verification:**
- [ ] npm run test:e2e -- tests/notifications/inbox.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Accept a review invitation from the inbox and test a mention to an unpermitted user.

**Dependencies:** T29, T31, T32.

**Files likely touched:**
- `src/lib/notifications/inbox.ts`
- `src/app/dashboard/inbox/page.tsx`
- `src/lib/reviews/comments.ts`
- `tests/notifications/inbox.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T36 — P2 editorial workflow

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

# Phase: P3 administration

## Task T37: Onboard an invited user

- [ ] T37 complete

**Description:** Implement administrative invitations and acceptance only after the client confirms the sign-up model.

**Acceptance criteria:**
- [ ] Admins invite a permitted role; acceptance establishes the intended identity/name/password without self-selected privilege.
- [ ] Expired/replayed invites, delivery failures, and unexpected callback targets receive safe recovery behavior; public sign-up follows the client decision.

**Verification:**
- [ ] npm run test:e2e -- tests/users/invite.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Accept local captured invitation mail; attempt token replay and a forged role.

**Dependencies:** T01, T08, T10.

**Files likely touched:**
- `src/lib/users/invite.ts`
- `src/app/auth/invite/page.tsx`
- `src/app/dashboard/users/page.tsx`
- `tests/users/invite.spec.ts`
- `tasks/decisions.md`

**Estimated scope:** Medium: 3-5 files.

## Task T38: Manage user access

- [ ] T38 complete

**Description:** Complete administrative user search, role changes, and deactivation.

**Acceptance criteria:**
- [ ] Only admins change role/active state; last-admin and self-lockout behavior follows the agreed contract.
- [ ] Deactivation takes effect on sensitive actions with existing sessions; accepted review assignments and audit history remain consistent.

**Verification:**
- [ ] npm run test:e2e -- tests/users/manage.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Deactivate a signed-in reviewer and attempt a review decision from that existing session.

**Dependencies:** T09, T30, T37.

**Files likely touched:**
- `src/lib/users/manage.ts`
- `src/app/dashboard/users/page.tsx`
- `src/lib/auth/session.ts`
- `tests/users/manage.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T39: Read contact messages

- [ ] T39 complete

**Description:** Deliver the administrative contact inbox and message detail view.

**Acceptance criteria:**
- [ ] Admins can page/search messages and open safe detail views; other roles cannot read sender data.
- [ ] Read/replied status and empty/error states are explicit and private information is excluded from logs.

**Verification:**
- [ ] npm run test:e2e -- tests/contact/inbox.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Open a submission as admin and attempt the same URL/query as writer and anonymous user.

**Dependencies:** T18, T22.

**Files likely touched:**
- `src/lib/contact/messages.ts`
- `src/app/dashboard/messages/page.tsx`
- `src/components/messages/MessageDetail.tsx`
- `tests/contact/inbox.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T39

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T40: Send contact replies

- [ ] T40 complete

**Description:** Integrate the selected email provider with durable, retry-safe reply delivery.

**Acceptance criteria:**
- [ ] Replies use a verified sender with safe reply-to handling; server-side secrets never enter settings exposed to clients.
- [ ] Pending/sent/failed status distinguishes persistence from delivery; provider retries cannot send duplicate replies or falsely mark replied.

**Verification:**
- [ ] npm run test:unit -- tests/contact/reply.test.ts; npm run build.
- [ ] Manual check: Send through a sandbox provider; simulate a provider timeout followed by retry.

**Dependencies:** T01, T39.

**Files likely touched:**
- `src/lib/mail/send.ts`
- `src/lib/contact/reply.ts`
- `src/components/messages/ReplyForm.tsx`
- `tests/contact/reply.test.ts`
- `tasks/operations.md`

**Estimated scope:** Medium: 3-5 files.

## Task T41: Browse the audit log

- [ ] T41 complete

**Description:** Expose attributed privileged events through an admin-only paginated interface.

**Acceptance criteria:**
- [ ] Admin filters by actor/action/date use bounded validated queries and deterministic pagination.
- [ ] All existing privileged feature mutations are checked for audit coverage; no secrets or unnecessary message bodies appear.

**Verification:**
- [ ] npm run test:e2e -- tests/audit/browse.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Filter across a timezone boundary and compare a known mutation with its audit entry.

**Dependencies:** T10, T35, T38, T40.

**Files likely touched:**
- `src/lib/audit/query.ts`
- `src/app/dashboard/audit/page.tsx`
- `tests/audit/browse.spec.ts`
- `tasks/audit-coverage.md`

**Estimated scope:** Medium: 3-5 files.

## Task T42: Export filtered audit records

- [ ] T42 complete

**Description:** Add bounded administrative CSV export using the same filter contract.

**Acceptance criteria:**
- [ ] CSV export respects authorization and the displayed filters, with a documented row/range limit.
- [ ] Spreadsheet formula injection, CSV escaping, Unicode, and large export failures are handled safely and export itself is audited.

**Verification:**
- [ ] npm run test:unit -- tests/audit/export.test.ts; npm run build.
- [ ] Manual check: Download an export with commas, newlines, Unicode, and a formula-like value.

**Dependencies:** T41.

**Files likely touched:**
- `src/app/api/audit/export/route.ts`
- `src/lib/audit/csv.ts`
- `src/app/dashboard/audit/page.tsx`
- `tests/audit/export.test.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T42

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T43: Edit general site settings

- [ ] T43 complete

**Description:** Deliver administrative general/contact/social configuration.

**Acceptance criteria:**
- [ ] Only admins can update validated public configuration; secrets use environment/provider configuration instead of public settings.
- [ ] Public routes refresh after a successful audited save; failed saves preserve previous settings and return usable feedback.

**Verification:**
- [ ] npm run test:e2e -- tests/settings/general.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Change office hours and a social URL; confirm public output and reject an unsafe URL.

**Dependencies:** T10, T17, T22.

**Files likely touched:**
- `src/lib/settings/update.ts`
- `src/app/dashboard/settings/page.tsx`
- `src/components/settings/GeneralForm.tsx`
- `tests/settings/general.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T44: Edit About content

- [ ] T44 complete

**Description:** Add structured About section administration behind the settings boundary.

**Acceptance criteria:**
- [ ] Admins can edit/order agreed About sections with safe rich content and explicit empty states.
- [ ] A successful audited save appears on /about; malformed content and unauthorized writes fail.

**Verification:**
- [ ] npm run test:e2e -- tests/settings/about.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Reorder sections, save an empty optional section, and try unsafe content.

**Dependencies:** T24, T43.

**Files likely touched:**
- `src/lib/settings/about.ts`
- `src/components/settings/AboutForm.tsx`
- `src/app/dashboard/settings/page.tsx`
- `tests/settings/about.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T45: Manage categories

- [ ] T45 complete

**Description:** Deliver administrative taxonomy management with stable article references.

**Acceptance criteria:**
- [ ] Admins create/rename/archive categories with validated unique identifiers and audit events.
- [ ] Referenced category deletion follows the agreed restriction/reassignment rule; archive filters and metadata choices stay consistent.

**Verification:**
- [ ] npm run test:unit -- tests/settings/categories.test.ts; npm run test:db; npm run build.
- [ ] Manual check: Rename a used category and attempt its deletion while articles still reference it.

**Dependencies:** T15, T25, T43.

**Files likely touched:**
- `src/lib/categories/manage.ts`
- `src/components/settings/CategoriesForm.tsx`
- `src/app/dashboard/settings/page.tsx`
- `tests/settings/categories.test.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T45

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T46: Curate featured stories

- [ ] T46 complete

**Description:** Connect settings to ordered featured placement on the home route.

**Acceptance criteria:**
- [ ] Admins can select/order eligible stories with bounded featured slots and audit attribution.
- [ ] Unpublished, future, or archived stories cannot leak through curation; removing eligibility yields a predictable home fallback.

**Verification:**
- [ ] npm run test:e2e -- tests/settings/featured.spec.ts; npm run test:db; npm run build.
- [ ] Manual check: Feature a story, then archive it and confirm the home fallback.

**Dependencies:** T13, T33, T35, T43.

**Files likely touched:**
- `src/lib/settings/featured.ts`
- `src/components/settings/FeaturedForm.tsx`
- `src/app/dashboard/settings/page.tsx`
- `tests/settings/featured.spec.ts`

**Estimated scope:** Medium: 3-5 files.

# Phase: P3 embeds and optional team page

## Task T47: Deliver the events embed

- [ ] T47 complete

**Description:** Expose a compact iframe-safe event widget using existing public queries.

**Acceptance criteria:**
- [ ] Validated list/calendar options produce bounded eligible events at narrow widths.
- [ ] Only designated embed routes allow framing; widgets expose no dashboard/session information and handle empty/error states.

**Verification:**
- [ ] npm run test:e2e -- tests/embed/events.spec.ts; npm run build.
- [ ] Manual check: Load the widget in a separate-origin iframe and try framing a dashboard route.

**Dependencies:** T16, T35.

**Files likely touched:**
- `src/app/embed/events/page.tsx`
- `src/components/embed/Events.tsx`
- `next.config.ts`
- `tests/embed/events.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T48: Deliver the announcements embed

- [ ] T48 complete

**Description:** Add column/row announcement layouts under the established embed boundary.

**Acceptance criteria:**
- [ ] Options are validated and bounded; only publicly eligible announcements appear.
- [ ] Both layouts work at narrow widths and share publication/expiry semantics with the public site.

**Verification:**
- [ ] npm run test:e2e -- tests/embed/announcements.spec.ts; npm run build.
- [ ] Manual check: Render row/column iframe examples with no announcements and an expired item.

**Dependencies:** T35, T47.

**Files likely touched:**
- `src/app/embed/announcements/page.tsx`
- `src/components/embed/Announcements.tsx`
- `tests/embed/announcements.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T48

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T49: Build widget embed codes

- [ ] T49 complete

**Description:** Provide admin controls for safe iframe previews and copyable code.

**Acceptance criteria:**
- [ ] Admins choose allowed widget options and preview the exact generated URL.
- [ ] Copied embed code escapes values, uses the configured public origin, and rejects arbitrary URL/script injection.

**Verification:**
- [ ] npm run test:e2e -- tests/embed/builder.spec.ts; npm run build.
- [ ] Manual check: Copy generated code into a separate-origin test page and verify the result.

**Dependencies:** T43, T47, T48.

**Files likely touched:**
- `src/app/dashboard/settings/embeds/page.tsx`
- `src/lib/embeds/code.ts`
- `tests/embed/builder.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T50: Resolve the optional team page

- [ ] T50 complete

**Description:** Implement /team only if the client retains the page and approves the public data source.

**Acceptance criteria:**
- [ ] Record the include/defer decision; if excluded, remove no existing files and mark this task intentionally out of scope with rationale.
- [ ] If included, expose only approved public team fields and integrate Claude's team handoff with empty/error states.

**Verification:**
- [ ] If included: npm run test:e2e -- tests/public/team.spec.ts; npm run build. Otherwise verify the recorded scope decision.
- [ ] Manual check: Check public visibility for inactive/private profiles if the route is included.

**Dependencies:** T01, T19, T38.

**Files likely touched:**
- `tasks/decisions.md`
- `src/app/(public)/team/page.tsx`
- `src/lib/team/public.ts`
- `tests/public/team.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T50 — P3 feature scope

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

# Phase: Validation and release

## Task T51: Automate validation in CI

- [ ] T51 complete

**Description:** Run the established checks in isolated CI with reproducible local database setup.

**Acceptance criteria:**
- [ ] Clean checkout validation runs lint, typecheck, build, focused unit/database suites, and critical browser journeys.
- [ ] Dependencies are locked, artifacts redact secrets, and preview jobs cannot modify production data.

**Verification:**
- [ ] Execute the workflow or an equivalent clean local run and inspect a deliberately failing check.
- [ ] Manual check: Inspect migration reset behavior and verify no production credentials are available to untrusted jobs.

**Dependencies:** T19, T35, T42, T46, T49.

**Files likely touched:**
- `.github/workflows/validate.yml`
- `package.json`
- `tasks/operations.md`
- `tests/ci-smoke.spec.ts`

**Estimated scope:** Medium: 3-5 files.

## Task T52: Verify a Vercel preview

- [ ] T52 complete

**Description:** Exercise the complete app with a separate nonproduction Supabase environment.

**Acceptance criteria:**
- [ ] Preview environment configuration, auth redirects, mail sandbox, storage rules, and scheduled invocation work together.
- [ ] Database migrations replay from empty state; security advisories and cross-role journeys pass with no privileged key in browser output.

**Verification:**
- [ ] Run CI suite against the isolated preview; run the verified Supabase advisory checks; inspect build output.
- [ ] Manual check: Walk writer → reviewer → published article → public visitor, then archive; test contact delivery and recovery mail.

**Dependencies:** T37, T38, T40, T50, T51.

**Files likely touched:**
- `tasks/operations.md`
- `tasks/release-evidence.md`
- `.env.example`
- `vercel.json`

**Estimated scope:** Medium: 3-5 files.

## Task T53: Prepare production cutover

- [ ] T53 complete

**Description:** Produce a concrete release and rollback runbook after preview acceptance.

**Acceptance criteria:**
- [ ] Document project/domain ownership, migration order, initial admin provisioning, backup/restore evidence, provider setup, and smoke checks.
- [ ] Document legacy URL/SEO redirects and approved static-asset inventory; identify exposed legacy credentials for owner rotation without copying them into the new app.

**Verification:**
- [ ] Review the runbook against preview evidence; test redirect mappings and restoration in an isolated environment; npm run build if config changes.
- [ ] Manual check: Rehearse rollback with a nonproduction deployment and verify restoration does not depend on the lost MySQL database.

**Dependencies:** T52.

**Files likely touched:**
- `tasks/release-runbook.md`
- `tasks/redirects.md`
- `tasks/asset-inventory.md`
- `next.config.ts`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T53

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.

## Task T54: Release the approved build

- [ ] T54 complete

**Description:** Perform the authorized production rollout and record its evidence.

**Acceptance criteria:**
- [ ] User-approved domain/cutover configuration serves the ICG app; login, public reads, publication, uploads, and contact submission pass smoke checks.
- [ ] Monitoring covers worker/mail failures and application errors; rollback triggers, operator ownership, and final evidence are recorded.

**Verification:**
- [ ] Run the release smoke checklist and inspect production health with synthetic non-sensitive data.
- [ ] Manual check: Verify rollback readiness, then confirm the legacy PHP app is not deployed alongside the new public application.

**Dependencies:** T53.

**Files likely touched:**
- `tasks/release-evidence.md`
- `tasks/operations.md`
- `tasks/todo.md`

**Estimated scope:** Medium: 3-5 files.

## Checkpoint: After T54 — Release evidence

- [ ] Completed slices' focused tests pass; application builds/typechecks once the runnable shell exists.
- [ ] Relevant database policy tests pass from a disposable local stack; no unresolved permission regression.
- [ ] Demonstrate the completed user flow and denied/failure case; record evidence and any design dependency.
- [ ] Review evidence with the user; record feedback and resolve blocking decisions before dependent work.
