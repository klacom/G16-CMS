# ICG design tasks

Plan: [design-plan.md](design-plan.md).
Created November 16, 2026 (Asia/Manila). Implementation authorized by the user the same day. Updated November 17: D01–D09 prototypes implemented/browser-checked and D10 documentation complete; Checkpoints A–E evidence recorded. Taste-gate limitation remains documented below. This specific design-gap plan is complete; Team and documented client/build follow-ups remain outside that completion. Visual acceptance is not assumed.
All file paths below are relative to the repo root. File lists are estimates, not permission to exceed the five-file scope without splitting the task.

## D01: Reviewer Overview

**Description:** Make the selected month desk show Paolo's review obligations and available next actions, preserving the writer experience and existing review language.

**Acceptance criteria:**
- [x] Reviewer summary, calendar, selected day and ruled task sections use assigned review records; dated assignments show their review deadline, invitations are explicitly labelled, and missing deadlines stay in Needs you.
- [x] Overdue, due-today, upcoming, second-round and caught-up examples have clear next steps; review links open the matching Reviews record and reviewer controls do not lead into the writer editor.
- [x] Writer content and navigation still work; dashboard handoff and DESIGN.md describe the actual role differences and current shell.

**Verification:**
- [x] Extend and run `python -I design/tools/check_dashboard.py` to assert reviewer content, undated work, correct destinations and writer regression behavior.
- [x] Inspect reviewer screenshots at 390, 1440 and 1920px; check overflow at 320, 768 and 1024px, day selection, month navigation, keyboard focus and reduced motion.
- [x] Run the completed-page detector and record its findings; apply the plan's shared finish gate. Detector returned `[]`; taste gate returned an execution error, not a pass (see evidence).

**Dependencies:** None; implementation authorized November 16, 2026.

**Files likely touched:**
- `design/prototypes/dashboard.html`
- `design/prototypes/desk-overview.js` (new; overview rendering extracted from the page, sharing existing Reviews fixtures)
- `design/tools/check_dashboard.py`
- `design/handoff/dashboard.md`
- `DESIGN.md`

**Estimated scope:** Medium, up to 5 files. Split a shared review-fixture extraction first if required.

**D01 evidence — November 16, 2026:**

- RED: the new reviewer assertion failed with actual greeting "Good morning, Lea" before the implementation.
- GREEN: `python -I design/tools/check_dashboard.py` passed, including existing writer, editor, Reviews, Inbox, Account, Users and drawer checks. No tests were skipped. Browser subprocesses required escalation past the sandbox's Windows pipe restriction; approval review allowed the local checks.
- Dedicated rendered checks passed at 320, 390, 768, 1024, 1440 and 1920px: no horizontal overflow, keyboard date selection, retained focus, next-deadline focus, invalid-date fallback and reduced motion. No console or page errors were observed.
- Screenshots: `design/tools/out/reviewer-overview/reviewer-{390,1440,1920}.png`, plus `reviewer-{due-today,overdue,empty,error,loading}.png`. Desktop and mobile were visually inspected; the mobile legend and count wrapping were corrected and recaptured.
- Impeccable detector on `dashboard.html`: `[]`. The design sidecar was regenerated after the DESIGN.md change; no tokens changed.
- `node --check design/prototypes/desk-overview.js` and scoped `git diff --check` passed.
- **GATE: ERROR (the gate itself failed: spawn EPERM).** The taste gate could not launch its child process in this Windows sandbox. Its own instructions say not to rerun after this result. Its automatic consistency/layout/copy suite is unverified; no waivers were added and no taste-gate pass is claimed. Independent project Playwright checks and screenshots provide the runtime evidence. This follows the approved project-specific verification workflow; Chrome DevTools MCP is not available in this session.
- No Next.js route, backend, production permissions or live data changes. Admin Overview remains explicitly pending D02. Visual acceptance has not been recorded.

| Before | After | Why |
| --- | --- | --- |
| Reviewer reads Lea's article pipeline and editor links | Reviewer shares assignment fixtures with Reviews and opens matching review IDs | Content and destinations match the person's role. |
| Writer event/submission dates stand in for reviewer work | Nullable review deadlines drive the calendar; undated requests stay in Needs you | Avoids inventing dates or confusing an event date with a review deadline. |
| No reviewer failure/caught-up states | Explicit loading, failure/retry and caught-up demonstrations | A failed load cannot imply the queue is empty. |

## D02: Admin Overview

**Implementation slices (November 16):** D02a extracts existing Messages/Users fixtures into `desk-admin-data.js` (3 files, preserving destination behavior). D02b consumes those fixtures in Overview and updates its checks/handoff (4 files). D02c updates DESIGN.md and the status handoff (2 files, plus the generated sidecar). This prerequisite avoids duplicating counts or expanding the writer's sample articles. Public News/Announcement publication dates come from `public-data.js`; scheduled publication comes from the existing approved article's go-live entry. No event date becomes a publication date.

**Description:** Extend the same month desk for Maria's site-wide publication schedule and outstanding operational work.

**Acceptance criteria:**
- [x] Calendar and selected day distinguish scheduled publication from campus events; site-wide sample content is labelled and does not masquerade as Maria's writing.
- [x] Unanswered messages and pending/expired invites appear as separate ruled groups with consistent counts, useful empty/error states and working Messages, Users or Articles destinations.
- [x] Admin greeting, summary and primary action fit the role; reviewer and writer content stay correct, with updated handoff and role-pattern documentation.

**Verification:**
- [x] Extend and run `python -I design/tools/check_dashboard.py` for admin content/counts and all three role regressions.
- [x] Inspect all three Overviews at 390, 1440 and 1920px; check long titles, crowded dates, empty/loading/error examples and keyboard destinations.
- [x] Run the completed-page detector and shared finish review. Detector returned `[]`; the previously failed automated taste gate remains unavailable, not passed (see evidence).

**Dependencies:** D01.

**Files likely touched:**
- `design/prototypes/dashboard.html`
- `design/prototypes/desk-overview.js`
- `design/tools/check_dashboard.py`
- `design/handoff/dashboard.md`
- `DESIGN.md`

**Estimated scope:** Medium, up to 5 files.

**D02 evidence — November 16, 2026:**

- The new admin check reproduced the original bug first: actual greeting Good morning, Lea rather than Good morning, Maria.
- Shared fixture extraction preserved 5 open / 3 replied / 2 closed messages, the failed-reply state, 12 people and 2 invites. Both destination pages clone the records before local edits; the writer article dataset was not expanded.
- `python -I design/tools/check_dashboard.py --overview-only` passed all three roles, reviewer deadline states, admin counts, publication/event separation, exact editor/message/invite destinations and loading/error retry. The default full `check_dashboard.py` then passed existing desk flows. No test was skipped or disabled.
- Final rendered checks covered all three roles at 320, 390, 768, 1024, 1440 and 1920px, including keyboard date selection/focus, mobile drawer, crowded publication/event days, reduced motion, public story links and cleared queue badges in empty states. No horizontal overflow, console errors or page errors were observed.
- Screenshots: `design/tools/out/admin-overview/{admin,writer,reviewer}-{390,1440,1920}.png`, plus `admin-{selected-day,empty,loading,error}.png`. Desktop, phone and wide desktop admin renders were visually inspected. The admin initially selects the next scheduled publication in the current month; today remains independently marked.
- Impeccable detector on `dashboard.html`, `dashboard-messages.html` and `dashboard-users.html`: `[]`. `node --check` passed for both changed/new modules; scoped `git diff --check` passed. DESIGN.md and the dashboard/status handoffs were updated and the sidecar regenerated; token values did not change.
- The earlier `GATE: ERROR (the gate itself failed: spawn EPERM)` launch limitation remains. The skill instructed no rerun after that error; its automated marketing consistency/layout/copy suite was not rerun or represented as passed. Independent project browser checks and rendered finish review provide the validation above.
- This is static prototype work. No production route/backend was implemented, no mail or invite was sent, and no deployment or commit was made. Visual acceptance is pending user review. D03 (stale admin Inbox links) is next.

| Before | After | Why |
| --- | --- | --- |
| Admin sees Lea's personal article pipeline | Maria sees publication commitments, open messages and invites | The first screen reflects admin responsibilities. |
| Operational records live separately inside destination pages | Shared fixtures drive Overview and destination baselines | Counts and target records agree without copied summaries. |
| Initial day is empty despite an upcoming publication | Next scheduled publication in the current month is selected; today remains marked | The admin immediately sees the title and go-live time. |

## D03: Admin Inbox links

**Description:** Replace obsolete later-round Users destinations in admin notices and the expired-invite task with working prototype navigation.

**Acceptance criteria:**
- [x] Invite-accepted, invite-expired and relevant user notices open Users; expired-invite actions use the supported Users list/filter or record flow and no longer show the later-round toast.
- [x] Navigation retains admin context and notice read state; use supported URL parameters rather than inventing a record deep link.
- [x] Reviewer/writer notice links remain functional and the Inbox handoff records the new destinations.

**Verification:**
- [x] Follow every affected admin notice and waiting task, then return and verify read state; use keyboard as well as pointer.
- [x] Check writer/reviewer destinations and confirm no affected link retains `data-later`.
- [x] Inspect 390/1440px and record the focused link checks; no unrelated build or database suite is required.

**Dependencies:** None; scheduled after D02 for the role-flow checkpoint.

**Files likely touched:**
- `design/prototypes/dashboard-inbox.html`
- `design/handoff/dashboard-inbox.md`
- `design/tools/check_dashboard.py`

**Estimated scope:** Small, 2–3 files.

**D03 evidence — November 16, 2026:**

- Added the focused `--inbox-only` selection to the existing browser checker and replaced its obsolete expected later-round toast. Before the fix, the check failed on four placeholder links (three notices and one waiting task).
- Jo's notice opens Users filtered to u7, Rafael's to the expired invite u11, and Bea's to reviewer u4. All retain `role=admin`. The persistent task is labelled Review invite and opens the same expired record; opening its sheet exposes the existing Resend action without sending anything.
- `python -I design/tools/check_dashboard.py --inbox-only` passed: all affected notice/task destinations, pointer and keyboard navigation, read state on Back/reload, an unread notice remaining unread when its waiting task is followed, the existing Messages destination, and writer/reviewer notice destinations. No console or page errors were observed. The same helper runs in the default desk suite; its old toast expectation was removed, not skipped.
- Screenshots at `design/tools/out/inbox-links/admin-inbox-{1440,390}.png` were visually inspected; both widths passed overflow checks. No styling or design tokens changed.
- Impeccable detector on `dashboard-inbox.html`: `[]`. The earlier taste-gate launch limitation remains; no new automated taste-gate pass is claimed. No unrelated app build or database checks were run for this bounded link change.
- Updated the Inbox handoff and removed all Inbox `later` flags/branches. The shared later-round handler remains available for other unfinished prototypes. No production messages or invitations were sent, and no commit or deployment was made.

| Before | After | Why |
| --- | --- | --- |
| Three admin notices and one task use Users placeholders | Supported Users search/status URLs identify the relevant records | The existing Users page is actionable from Inbox. |
| Send a new invite leads to a deferred toast | Review invite opens the expired record and its existing Resend flow | The label describes what following the link actually does. |

## Checkpoint A: Role entry screens

- [x] Reviewer lands on review work, admin lands on publication/operations work, and writer retains the chosen desk (D01–D02 evidence).
- [x] Role-specific Overview and affected Inbox links, counts and documented states are checked; screenshots and console findings are recorded.
- [x] Concrete Overview results and screenshots were presented for user review; user authorized the next slices. This records presentation and implementation authorization, not visual acceptance.

## D04: Month desk and proof-sheet spacing

**Implementation slices:** scoped layout/geometry checks in 3 files, then the two page handoffs, DESIGN.md and status handoff plus generated sidecar. Each slice stays within five files; existing token values and the selected page structures are preserved.

**Description:** Apply the deferred spacing pass to Overview and My articles while verifying outer-page width at 1920px.

**Acceptance criteria:**
- [x] Headers, controls, calendar/list boundaries and ruled groups use a consistent existing spacing rhythm, with equal outer edges and no cramped or orphaned controls.
- [x] My articles and all Overviews use the available outer work area at 1920px; preserve the existing fluid class where it already works and change only demonstrated defects.
- [x] Phone stacking, long titles, coverless proofs, filters and empty/loading/error states remain usable; handoffs reflect actual layout adjustments.

**Verification:**
- [x] Capture 1920px baselines before editing, then compare 390/1440/1920px results; check overflow at 320/768/1024px.
- [x] Run `python -I design/tools/check_dashboard.py` and verify filtering, row menus, date selection and mobile drawer focus.
- [x] Completed-page detectors and rendered finish review passed; the earlier automated taste-gate launch limitation remains recorded, not passed.

**Dependencies:** D01–D02.

**Files likely touched:**
- `design/prototypes/dashboard.html`
- `design/prototypes/dashboard-articles.html`
- `design/handoff/dashboard.md`
- `design/handoff/dashboard-articles.md`
- `design/tools/check_dashboard.py`

**Estimated scope:** Medium, up to 5 files.

**D04 evidence — November 16, 2026:**

- Saved before/after screenshots and measured boxes for writer, reviewer and admin Overview and My articles at `design/tools/out/spacing/{before,after}/`. Both folders contain 390/1024/1440/1920px captures and `metrics.json`; 320/768px geometry was also measured, with a separate 320px final calendar capture.
- All four outer work areas measured 1656px at a 1920px viewport before and after (1920 minus the 264px sidebar). My articles/Overview were already fluid. No outer-width expansion was needed; sparse months retain natural empty tracks.
- Reproduced the calendar bug before editing: day buttons were 40px wide at 320px, and 40px again at 1024px where the desktop sidebar plus side column squeezed/clipped calendar labels. The fixed work-area container query yields 96px cells at 1024px. A symmetric full-width grid below 360px yields approximately 44.8px cells at 320px while preserving reading gutters elsewhere.
- Proof spacing now uses 16px between filter rows; 32px before the first month; 16px at ruled headings; 32px/24px grid gaps; consistent 16px phone padding. Desktop action targets previously extended 6px beyond the proof and now remain inside it. Metadata units and unbroken titles wrap without spilling; phone Group by aligns with the search field's right edge.
- `python -I design/tools/check_dashboard.py --spacing-only` passed at 320/390/768/1024/1280/1440/1920px for all three calendar roles, day target sizes, unclipped labels, proof action bounds and unbroken title wrapping. It failed on the measured 40px target before the fix. The default full desk checker then passed filters, menus/confirmations/undo, date selection, role flows and drawer focus. No tests were skipped or disabled.
- Additional checks passed empty, filtered-empty, loading/error layouts, coverless proofs, menu focus and long title/category stress at 320/390/1440px, plus real touch-media and reduced-motion hover behavior. No horizontal overflow, console or page errors were observed. State/stress captures are in `design/tools/out/spacing/states/`.
- Compared representative desktop, phone and 1920px renders visually. Impeccable detector on both changed HTML pages returned `[]`; scoped `git diff --check` passed. Page handoffs and DESIGN.md were updated, and the sidecar regenerated. No tokens, role behavior, production routes or backend changed.
- The prior `GATE: ERROR (the gate itself failed: spawn EPERM)` limitation remains. The instruction not to rerun that failed automated gate was respected; no marketing-gate pass is claimed. Runtime geometry, interaction checks, static detector and rendered review provide this slice's finish evidence.
- D05 (editor spacing and Reviews width) remains pending. No deployment or commit was made; visual acceptance is not assumed.

| Before | After | Why |
| --- | --- | --- |
| Viewport-based two-column calendar at 1024px; clipped labels and 40px day targets | Two columns only when the work area has 64rem; narrow phones use the screen width for the grid | Fit the calendar to the actual space and preserve usable targets. |
| Uneven phone proof padding, broken metadata words and action hit areas outside desktop cards | Consistent spacing, wrapped metadata units and contained 44px actions | Keep content readable and interactions clearly separated. |
| Suspected unused outer width at 1920px | Verified and retained existing fluid widths | Avoid changing a layout that already fills its available area. |

## D05: Editor spacing and Reviews width

**Implementation slices:** the two prototypes and focused geometry checks (3 files), then the two page handoffs, DESIGN.md, status handoff and regenerated sidecar (5 files). Planning records are updated separately. Existing shared editor/review logic, tokens and chosen structures are preserved.

**Description:** Finish the editor spacing pass and verify that editor/Reviews outer layouts fill wide screens while preserving readable prose.

**Acceptance criteria:**
- [x] Editor document, toolbar, metadata and review sidebar align consistently and remain comfortable at phone and desktop sizes.
- [x] Editor and Reviews have no unexplained capped outer work area at 1920px; retain justified inner reading widths and record a no-change result wherever the baseline already passes.
- [x] Sticky controls, review decisions and mobile list/detail navigation remain usable with long content, keyboard focus and larger text.

**Verification:**
- [x] Compare 390/1440/1920px captures against baselines and check 320/768/1024px overflow and sticky overlaps.
- [x] Run `python -I design/tools/check_dashboard.py`; exercise draft save/send feedback, checklist and review next-item/decision flows.
- [x] Completed-page detector and rendered finish review passed; the prior automated taste-gate execution error remains recorded, not passed. The rich-text blocker remains a separate implementation decision.

**Dependencies:** D04 establishes the spacing rhythm; no dependency on rich-text implementation.

**Files likely touched:**
- `design/prototypes/dashboard-editor.html`
- `design/prototypes/dashboard-reviews.html`
- `design/handoff/dashboard-editor.md`
- `design/handoff/dashboard-reviews.md`
- `design/tools/check_dashboard.py`

**Estimated scope:** Medium, up to 5 files.

**D05 evidence — November 16, 2026:**

- Before/after captures and geometry: `design/tools/out/editor-review/{before,after}/`, with `metrics.json` in each. Both pages already filled the 1656px work area beside the 264px sidebar at 1920px; that outer width is retained. The editor's 760px measure and Reviews' 900px panel / 680px body cap remain intentional.
- The baseline at 1024px left just 176px for editor text and 188px for review text, with editor event fields crossing the document boundary. Actual-work-area container queries now give both stories 584px at that viewport; two columns return only with 64rem of work area. Event fields use their document's 36rem threshold, and review decisions use their pane's 48rem threshold.
- Editor spacing now follows the D04 rhythm: 24px before the title, 32px between major document sections, 24px after the toolbar, 16px above ruled headings, 32px between document and review. Type, formatting and tag-remove targets are 44px; long tags and requests wrap. Reviews uses 40px desktop pane gutters and a 44px Step down target.
- Scrolled baselines revealed that sticky child bars were constrained by wrappers of their own height. Full-page-contained wrappers now own sticky positioning; ResizeObserver tracks the actual editor bar, formatting toolbar and phone-action heights. Focused checklist fields clear the measured chrome without animated keyboard scrolling.
- RED: `--editor-layout-only` failed on the squeezed editor at 1024px. The next run exposed a review heading focus failure: the pane was still hidden when focus was attempted. Making it visible before focusing fixed that transition. Final focused checks passed at 320, 390, 768, 1024, 1280, 1440 and 1920px, including contained fields, sticky offsets, minimum control sizes, Back-to-row focus and Enter-to-detail focus.
- GREEN: full `python -I design/tools/check_dashboard.py` passed, including save/send feedback, checklist, review decisions/next item, invitation handling, mobile drawer focus, and existing Overview/Articles/Inbox/Account/Users regressions. No tests were skipped. Local browser subprocesses required escalation past the Windows pipe restriction; automatic review allowed them.
- Long-content/unbroken-text and 25% larger-text checks passed at 320, 390, 768, 1024, 1440 and 1920px. Focused story/reply and Ask for changes fields stayed usable; phone actions wrapped within the viewport. New, approved, published, invitation and caught-up layouts were also checked. No page or console errors were observed. Captures: `design/tools/out/editor-review/states/`.
- Visually inspected finished editor/Reviews captures at 390, 1024, 1440 and 1920px, plus the scrolled 320px editor and larger-text focus state. Phone viewport exports are `states/editor-phone-390.png` and `states/reviews-phone-390.png`; full-page phone exports show sticky controls at the captured viewport edge rather than the document end.
- Impeccable detector on both HTML files returned `[]`; scoped `git diff --check` passed. DESIGN.md and page handoffs match the actual layout; the sidecar was regenerated with no token changes. The prior taste-gate `spawn EPERM` remains an execution error, and its do-not-rerun instruction was respected. No automatic taste-gate pass is claimed.
- No production route/backend change, rich-text format decision, commit or deployment. D05 is implemented; user visual acceptance is not assumed.

| Before | After | Why |
| --- | --- | --- |
| Viewport rules leave 176px / 188px story columns at 1024px | Work-area queries provide 584px and keep review decisions below the title until the pane has room | Fit each layout to its actual available space. |
| Editor bars disappear while scrolling; fixed offsets assume one line | Sticky wrappers and measured control heights preserve the controls and focused fields | Support wrapped controls and larger text without overlap. |
| Uneven section gaps and small select/format/tag targets | Existing spacing rhythm and 44px controls | Keep editing and request resolution comfortable. |
| Suspected unused page width at 1920px | Verified full outer width; retained the inner reading caps | Preserve readable prose without unnecessary page changes. |

## Checkpoint B: Core desk polish

- [x] All requested desk widths and spacing surfaces have before/after evidence, including no-change findings (D04–D05).
- [x] Focused desk checks pass and no new overflow, hidden controls or unreadable line lengths remain in the checked states and widths.
- [x] Screenshots and concrete results presented for review. No remaining implementation defect was found in this pass; user visual acceptance has not been recorded.

## D06: Events widget

**Implementation slices:** widget list and new-tab destination first, verified with `--list-only`; calendar, keyboard and recovery/stress behavior next. The HTML, scoped CSS, separate behavior file, checker and page handoff form a five-file slice. DESIGN.md, status handoff and generated sidecar are a separate documentation slice; planning records updated separately.

**Description:** Design the compact public events surface in list and calendar views, independent of the dashboard shell.

**Acceptance criteria:**
- [x] Both views show real fixture event dates, time, title and a working article/calendar destination; narrow calendars expose details in an accessible selected-day list.
- [x] Empty, loading, failed-load, crowded-day and long-title examples remain readable at 280px and wider, without unintended horizontal scrolling.
- [x] The handoff specifies options, responsive behavior, link targets, date semantics and iframe assumptions; styles are scoped to the widget.

**Verification:**
- [x] Add/run a focused widget check for month/day controls, item links and empty/error recovery.
- [x] Inspect the actual iframe at 280/320/390px and a wide host; check keyboard focus, reduced motion and host-page style isolation.
- [x] Detector and rendered finish review complete; prior automated taste-gate execution error remains recorded, not passed. Static-preview limitations for hosted framing are in the handoff.

**Dependencies:** None; uses the existing public calendar language and fixture content.

**Files likely touched:**
- `design/prototypes/embed-events.html` (new)
- `design/prototypes/embed-widgets.css` (new)
- `design/prototypes/embed-events.js` (new; keeps page markup and behavior separate)
- `design/handoff/embed-events.md` (new)
- `design/tools/check_embeds.py` (new)

**Estimated scope:** Medium, 5 files including separated behavior.

**D06 evidence — November 16, 2026:**

- **GATE: ERROR (the gate itself failed: spawn EPERM).** This is the earlier taste-gate execution result, retained unverified. Its do-not-rerun instruction was respected; no gate waiver or pass is claimed. Compact functional widgets follow the supplied public calendar/date-spine references; marketing hero, photo, full-screen-section and decorative-moment rules do not apply. Project Playwright and screenshot workflow was retained because DevTools MCP is unavailable; this resolves the taste skill's tooling conflict without dropping project runtime evidence.
- RED: `python -I design/tools/check_embeds.py` failed with “Events widget prototype is missing.” The first list slice then passed `--list-only`, proving five shared events, time ranges and the matching article in a new tab. Calendar navigation/day selection passed next. The broader runner's first destination assertion expected a full date label from the existing public calendar, which currently renders “Fri, Nov 20”; the assertion was corrected to that existing behavior, without changing the public page.
- GREEN: final `python -I design/tools/check_embeds.py` passed in actual iframes at 280, 320, 390, 768, 1024 and 1440px. Checks include public article/full-calendar destinations, selected date retention, keyboard tab/day/week/month navigation and focus, list limits/date changes, invalid-date fallback, boundary navigation, empty/loading/error/retry and missing dependency behavior. Local browser checks required escalation past the sandbox's Windows subprocess restriction; automatic approval review allowed them.
- Host CSS deliberately changed links/buttons to red 40px text; the widget retained its own typography/colors. There was no horizontal overflow and visible interactive controls were at least 44px. Below 22rem widget content width, the static month overview plus labelled day picker avoids undersized calendar targets. At 44rem, month and programme sit beside each other; controls stay with their month. Dates use the same November 14, 2026 demo clock as the public calendar and remain wall dates rather than UTC-parsed strings.
- Injected test-only fixtures exercised an 11-event day and long unbroken titles/venues at 25% larger text. Calendar and list passed at 280, 390 and 768px, including contained month names; a 520px-tall iframe retained keyboard access to the footer. Synthetic stress records were not added to `public-data.js` or the widget source. Loading is static under reduced motion; view/date changes never animate.
- Installed axe-core found no WCAG 2 A/AA or 2.1 AA violations in both views at each tested width, empty/loading/error examples, and larger-text list examples. No console or page errors were observed. This records automated and keyboard checks, not a screen-reader or physical-device certification.
- Rendered review inspected List/Calendar at 390px, the 280px day picker, the 1024px split calendar and failure state. It prompted a wider scalable date spine, shortened native day-option text, circular day markers, and moving the wide month controls into the grid column. Clean captures: `design/tools/out/embeds/events-{list,calendar}-{280,320,390,768,1024,1440}.png`; state and stress captures are alongside them.
- Final Impeccable detector returned `[]`; `node --check design/prototypes/embed-events.js` and scoped whitespace checks passed. DESIGN.md documents the reusable widget pattern; sidecar regenerated without token changes. Page handoff specifies query options, shared fixtures/time semantics, destinations and explicit-height iframe scrolling. Auto-height messaging, live feed and production framing headers remain implementation work. No production route/backend change, commit or deployment; visual acceptance is not assumed.

| Before | After | Why |
| --- | --- | --- |
| No designed Events widget | Compact identity band and two working date-led views | Give embedded content its own useful scale without the desk shell. |
| Seven 44px day targets cannot fit in a 280px frame | Passive month plus labelled day picker at narrow widths | Keep the month visible and selection comfortably operable. |
| Wide month controls spanned both grid and programme in the initial render | Controls stay in the grid column | Keep the controls beside what they change. |
| Narrow date spine risked colliding with titles at larger text sizes | Scalable 4rem spine with full month names | Preserve readable dates and separate event text. |

## D07: Announcements widget

**Implementation slices:** dated column/article path first, then responsive Row, states and stress cases. HTML, separated behavior, shared widget CSS, checker and page handoff form a five-file slice. DESIGN.md, status handoff and generated sidecar are a separate documentation slice; planning records updated separately.

**Description:** Design compact column and row announcement layouts sharing the widget visual system.

**Acceptance criteria:**
- [x] Column and row options show dated announcements with working destinations and defined wrapping/stacking at narrow widths.
- [x] Empty, loading, failed-load and extreme-title examples work without an automatic carousel or lost content.
- [x] The handoff defines configuration, display eligibility assumptions, link targets and responsive behavior without deciding unresolved publication/expiry policy.

**Verification:**
- [x] Extend/run the widget check for both layouts, links and state recovery.
- [x] Inspect actual iframe widths of 280/320/390px and a wide host, including keyboard use and long unbroken text.
- [x] Final combined widget checks reverified Events; detector and rendered finish review passed. Prior automated taste-gate execution error remains recorded, not passed.

**Dependencies:** D06 for the shared compact visual system.

**Files likely touched:**
- `design/prototypes/embed-announcements.html` (new)
- `design/prototypes/embed-announcements.js` (new; keeps page markup and behavior separate)
- `design/prototypes/embed-widgets.css`
- `design/handoff/embed-announcements.md` (new)
- `design/tools/check_embeds.py`

**Estimated scope:** Medium, 5 files including separated behavior.

**D07 evidence — November 17, 2026:**

- **GATE: ERROR (the gate itself failed: spawn EPERM).** Earlier automated taste-gate execution result retained unverified; its do-not-rerun instruction was respected. No new waiver or gate pass is claimed. The compact functional-widget contract follows the supplied public announcement rows and D06 frame, rather than marketing hero/photo/decorative-moment rules. Project Playwright/screenshots remain the required runtime evidence; DevTools MCP is unavailable.
- RED: the first check found the previous local server stopped (`ECONNREFUSED`). Restarted the existing 4321 design workflow, then confirmed the meaningful missing-widget failure. The column/article slice passed next: three shared announcement records, descending publication dates and a matching article opened in a new tab.
- GREEN: `python -I design/tools/check_embeds.py --announcements-only` passed both layouts at 280, 320, 390, 768, 1024 and 1440px. Final combined `python -I design/tools/check_embeds.py` passed all Events and Announcements checks after the scoped shared CSS additions. No tests were skipped. Local browser subprocesses required escalation past the Windows restriction; automatic approval review allowed them.
- Column keeps dates beside complete titles. Row uses one stacked column in narrow frames, two ruled columns from 36rem of widget content width and three from 56rem; further notices wrap into additional rows. Screenshot review refined outer row padding so text/exit arrows align to the widget gutters while internal rules retain space. Layout is a host option, not a visitor control. No carousel, title clamp, horizontal scroll or automatic rotation.
- Destinations verified in separate tabs: matching public article and Archive with the Announcement filter selected. Keyboard moves through all notices; retry restores the first notice and preserves layout/limit. Invalid layout falls back to Column; limits clamp to 1–10. Empty, loading and error examples are distinct; missing fixture dependency stays a failure and a naturally empty feed stays empty. Host red 40px link/button styles did not leak into the iframe.
- Synthetic test-only records verified ten visible notices (clamped from a larger request), newest-first order after an intentionally reversed source, long unbroken titles, literal markup characters, September month labels and 25% larger text at 280/390/768/1024px. Titles and dates remained contained; every visible interactive target was at least 44px. A 520px frame retained keyboard access to All announcements. No test records were written to the public fixtures or widget source.
- Installed axe-core reported no WCAG 2 A/AA or 2.1 AA violations in checked layouts, states and larger-text cases; no page/console errors were observed. This records automated and keyboard checks, not physical-device/screen-reader certification.
- Rendered layouts inspected: Column at 280/390px, Row at 768/1440px, with final exports `design/tools/out/embeds/announcements-{column,row}-{280,320,390,768,1024,1440}.png`. Empty/loading/error and stress captures are alongside them. D06 captures were regenerated by the full regression run. Final Impeccable detector on the announcement prototype returned `[]`; JS syntax and scoped whitespace checks passed. DESIGN.md documents the shared pattern and sidecar was regenerated with no token changes.
- Handoff explicitly separates supplied public fixture records from unresolved production eligibility. November 9 remains the publication date of the notice with a November 20 deadline in its title. No expiry/pinning/visibility window was inferred. Live feed/retry, production framing permissions and resizing protocol remain implementation work. No production route/backend change, commit or deployment; visual acceptance is not assumed.

| Before | After | Why |
| --- | --- | --- |
| No designed Announcements widget | Two dated arrangements sharing the D06 frame | Keep embedded notices compact and recognizably ICG. |
| Legacy row truncates titles and navigates the host away | Complete wrapped titles and real new-tab article anchors | Preserve the notice and the host context. |
| Fixed horizontal treatment risks hiding content in narrow frames | Font-relative stacked/two-/three-column layouts with extra rows | Every configured notice remains accessible. |
| Initial wide row text sat inside extra outer padding | Outer text aligns to widget gutters; padding stays around internal rules | Give the row equal content edges. |

## Checkpoint C: Widget surfaces

- [x] Both widget types and all four view/layout combinations work inside actual iframes at the stated host widths.
- [x] Empty/error states, focus, item destinations and shared styles have evidence.
- [x] Concrete results, supported options and screenshots presented for review before D08. User visual acceptance is not recorded; production eligibility/framing remain open as documented.

## D08: Embed widget builder

**Implementation slices:** builder HTML/behavior, Site settings link/guard, checker and builder handoff (5 files). The settings handoff, DESIGN.md, status handoff and generated sidecar are a separate documentation slice (4 files); planning records updated separately. No shared widget behavior or production route was changed.

**Description:** Give admins configuration controls, an actual widget preview and a reliable copy-code flow; connect the Site settings entry.

**Acceptance criteria:**
- [x] Pick widget and supported options; the iframe preview and displayed embed code update consistently, with an explicit narrow/wide preview control.
- [x] Copy code reports success only when copying succeeds and provides selectable code when clipboard access fails; generated options and accessible frame naming match the preview.
- [x] Site settings opens the builder with admin context; the builder provides a clear return path and a handoff that distinguishes local preview URLs from the production origin.

**Verification:**
- [x] Extend/run widget checks for option changes, preview/code agreement, clipboard success/failure and Site settings navigation.
- [x] Inspect 390/1440/1920px and 320px overflow; tab through configuration, preview controls and copy fallback.
- [x] Completed-page detector and rendered finish review passed; prior automated taste-gate execution error remains recorded, not passed. Production origin/header/resizing/native-clipboard follow-ups are documented without claiming external hosting works.

**Dependencies:** D06–D07 and Checkpoint C feedback on supported options.

**Files likely touched:**
- `design/prototypes/dashboard-embeds.html` (new)
- `design/prototypes/dashboard-embeds.js` (new, separated behavior)
- `design/prototypes/dashboard-settings.html`
- `design/handoff/dashboard-embeds.md` (new)
- `design/handoff/dashboard-settings.md`
- `design/tools/check_embeds.py`

**Estimated scope:** Medium, up to 5 files.

**D08 evidence — November 17, 2026:**

- **GATE: ERROR (the gate itself failed: spawn EPERM).** Earlier automated taste-gate execution result retained unverified; its do-not-rerun instruction was respected. No waiver/pass is claimed. The admin builder follows the accepted Operate-mode desk, not marketing hero/photo/moment rules. Project Playwright and screenshots supply runtime evidence; DevTools MCP is unavailable.
- RED: the new builder assertion failed with “Embed builder prototype is missing.” The first implementation reached a real Events preview; its textarea assertion was corrected to inspect the value rather than DOM text. The final native keyboard test accounts for Chromium's date-field segments. A separate pasted-code test uses its own browser context, as required by the existing Playwright convenience-page API.
- GREEN: focused `python -I design/tools/check_embeds.py --builder-only` passed; final combined `python -I design/tools/check_embeds.py` passed all Events, Announcements and Builder checks end to end. An earlier combined run exposed an empty-feed fixture carrying into the admin phase; feature checks now use isolated browser contexts/caches, with all assertions retained. No tests were skipped. Local browser subprocesses required escalation past the Windows restriction; automatic review allowed them.
- One validated configuration drives preview URL, title, responsive width, integer height and HTML-encoded code. Tests exercised Events List/Calendar and Announcements Column/Row, event-date changes, count/height values, hidden/disabled irrelevant fields and invalid active inputs. Calendar omits the ignored limit. Narrow changes only preview width; visitor interactions do not replace configured starting options. Generated code was also pasted into a separate actual host page, retaining the matching public widget/count.
- Copy tests use deterministic Clipboard API doubles: no success before fulfillment, copied snapshot equality, rejected/missing API, duplicate-click prevention, options changed during a pending copy and an invalid new configuration. Failure selects current code and focuses its field; Select code provides a keyboard path. The user's system clipboard was neither read nor overwritten; native clipboard permissions still require hosted-browser verification. Promise/security semantics were checked against MDN, linked in the builder handoff.
- Site settings opens the builder with admin/current section and the optional connected-mail demo flag. Cancel/discard of unsaved contact changes and the return link were exercised. Invalid return sections fall back to Featured stories. Public iframe URLs never inherit admin/settings parameters. Query roles remain prototype controls, not authorization.
- Preview failure/reload was exercised with a non-widget response; changing height preserves recovery, and successful keyboard reload focuses Preview. Rendered review aligned Configure/Preview headings and kept 44px controls. Both widgets passed at 320/390/768/1024/1440/1920px, with Narrow/Wide, 25% larger text and wrapped readonly code. Installed axe-core found no WCAG 2 A/AA or 2.1 AA violations in checked builder states, with no page/console errors. No physical-device/screen-reader certification is implied.
- Exports: `design/tools/out/embeds/builder-{events,announcements}-{320,390,768,1024,1440,1920}.png`, plus `builder-narrow-*`, `builder-large-text-*`, `builder-invalid-1440.png`, `builder-unavailable-1440.png` and `builder-copy-fallback-1440.png`. Phone and wide layouts were visually inspected. Final detector on Builder and Site settings returned `[]`; JS syntax/scoped whitespace checks passed. Sidecar regenerated after DESIGN.md updates, with no token-value changes.
- Code is explicitly labelled Local preview code and uses the actual local design server; canonical public origin and production `/embed/*` routes remain build work. Framing/CSP/sandbox/font integration, readiness/auto-height messaging and publication/expiry eligibility remain separate. No production route/backend change, commit or deployment; visual acceptance is not assumed.

| Before | After | Why |
| --- | --- | --- |
| Site settings says the builder comes later | Working admin entry and section-preserving return, protected by the existing unsaved-work dialog | Complete the settings path without losing edits. |
| No configuration/code contract | One validated configuration builds the actual iframe and safely encoded code | Keep options, accessible naming and dimensions in agreement. |
| Potentially optimistic clipboard feedback | Fulfilled-promise success, stale-copy handling and selected-code fallback | Describe what was actually copied and retain a usable manual path. |
| Wide layout only implied | Actual-work-area columns, aligned ruled headings and stacked phone flow | Fill the available desk width without cramped controls. |

## D09: Not found and generic error

**Implementation slices:** two HTML surfaces, shared local CSS, focused checker and page handoff (5 files). DESIGN.md, status handoff and generated sidecar form a separate documentation slice; planning records updated separately. No production error-boundary or route changes.

**Description:** Design a Marquee 404 with a restrained missing-day calendar motif and a separate useful generic failure state.

**Acceptance criteria:**
- [x] Not found clearly states the problem and offers working Home and Calendar recovery; the decorative missing day is not mistaken for an interactive calendar.
- [x] Generic error provides plain recovery copy, an exercisable Try again flow and a safe navigation path, without exposing internal error details.
- [x] Both layouts work with long/localized-sized copy, keyboard and reduced motion; the handoff explains public/private shell context without implementing Next.js error boundaries.

**Verification:**
- [x] Add/run focused error-page checks for recovery links, retry success/failure and heading/focus behavior.
- [x] Inspect 390/1440px and overflow at 320/768/1024px; verify useful recovery with decoration hidden.
- [x] Completed-page detector and rendered finish review passed; prior automated taste-gate execution error remains recorded, not passed.

**Dependencies:** None; scheduled alongside the remaining-surface phase.

**Files likely touched:**
- `design/prototypes/not-found.html` (new)
- `design/prototypes/error.html` (new)
- `design/prototypes/error-pages.css` (new)
- `design/handoff/error-pages.md` (new)
- `design/tools/check_error_pages.py` (new)

**Estimated scope:** Medium, up to 5 files.

**D09 evidence — November 17, 2026:**

- **GATE: ERROR (the gate itself failed: spawn EPERM).** Earlier automated taste-gate execution result retained unverified; its do-not-rerun instruction was respected. No waiver/pass is claimed. Failure surfaces use the supplied calendar/identity references and functional recovery contract; marketing photos, dealt moments and entrance animation are inapplicable. Required project Playwright/screenshots remain the runtime evidence; DevTools MCP is unavailable.
- RED: `python -I design/tools/check_error_pages.py` failed with “Not-found prototype is missing.” First implementation passed the actual 404 destinations and retry success/failure. The no-script text assertion was corrected to inspect its visible paragraph rather than the noscript wrapper; the fallback itself was then exercised successfully.
- GREEN: final `python -I design/tools/check_error_pages.py` passed 320/390/768/1024/1440px layouts, 404 keyboard order and destinations, decorative semantics, retry pending/failure/success, focus restoration and replacement history. Public success opens the fixed Calendar example; each writer/reviewer/admin desk success opens its matching Overview, with role-safe Inbox links. No tests were skipped. Browser subprocesses required escalation past the Windows restriction; automatic review allowed local checks.
- 404 uses a partial November 2026 calendar with day 14 absent, a plain Page not found explanation and real Home/Calendar links. The board is aria-hidden, pointer-inert and untabbable; it contains no links/buttons and does not enter the accessibility tree. Hiding it leaves all recovery content intact. The actual error code remains in the footer. It uses no script, feed or public-navigation bootstrap.
- Generic error is a calmer Mist utility surface with permanent recovery rows, a busy/disabled Try again state, a polite status and explicit continuing-failure feedback. It never reflects raw error/return parameters or private records. A 300ms timer demonstrates the pending state only; the real boundary/reset is not implemented. No saved-work guarantee is made. Visual review corrected a generic focus rule that squared off the Retry button; its pill geometry now remains while the focus outline is visible.
- Long localized-sized headings, unbroken text and 25% larger type passed with the illustration visible; separate no-art captures verify decoration-free recovery. Interactive targets remained at least 44px; no horizontal overflow or recovery-surface animation was observed. Script-disabled contexts with empty remote-font CSS still reached Home from both surfaces and showed a usable no-script instruction. The no-font renders were visually inspected. Private query switches intentionally retain safe public exits when script is disabled; production must render trusted context.
- Installed axe-core reported no WCAG 2 A/AA or 2.1 AA violations in ordinary, stressed and continued-failure states. No page/console errors were observed. This is automated/keyboard evidence, not physical-device or screen-reader certification.
- Exports: `design/tools/out/error-pages/{not-found,error-public,error-desk}-{320,390,768,1024,1440}.png`, plus failed-retry, no-art, larger-text and no-script/font examples. Desktop 404/public error and phone 404/desk fallback were visually inspected. Completed-page detector returned `[]`; inline JS syntax and scoped whitespace checks passed. DESIGN.md describes the two patterns; generated sidecar refreshed without token changes.
- Handoff distinguishes standalone root fallback from recovery inside an existing public/desk shell; correct HTTP status, original-route reset, authorization, logging and integration remain build work. Local `.html` responses are 200, not a production 404 implementation. Existing `src/app/not-found.tsx` and `src/app/error.tsx` are unchanged. No backend, commit, deployment or user visual-acceptance claim.

| Before | After | Why |
| --- | --- | --- |
| No branded 404 | A missing-day Marquee calendar with explicit Home/Calendar exits | Make the error recognizable and useful without obscuring recovery. |
| No generic error design | A calmer utility screen with pending, continued-failure and success demonstrations | Separate temporary failure from a missing page. |
| Recovery could depend on the failing app's scripts | Static exits, no-script instructions and native-font fallback | Keep a usable path out when optional dependencies are absent. |
| Generic focus rule changed the retry button's shape | Outline feedback preserves its pill geometry | Retain the same control identity in keyboard use. |

## Checkpoint D: Remaining surfaces

- [x] Builder configuration is reflected in actual widget output/copied code (D08); errors have working prototype recovery paths (D09).
- [x] Screenshots, checks and remaining integration dependencies are recorded in the page handoffs and evidence above.
- [x] Concrete results/previews presented for review. User visual acceptance is not assumed; integration and client decisions remain explicit.

## D10: Home handoff and design status

**Description:** Replace the obsolete newspaper Home instructions with the accepted Campus Marquee prototype and reconcile the status index with completed evidence.

**Acceptance criteria:**
- [x] Home handoff describes the actual cinematic hero, current week strip, programme/news composition, controls, responsive states and present token system; rejected green/broadsheet instructions are removed.
- [x] Home behavior/data descriptions match the current prototype; unresolved client facts and build contracts are explicitly identified rather than invented.
- [x] HANDOFF.md and PAGES.md point to completed prototypes/handoffs, distinguish unimplemented production routes and leave Team deferred pending the client's decision.

**Verification:**
- [x] Compare every Home component/behavior claim against `home.html`, `public-site.js`, public fixtures and DESIGN.md; validate referenced local file paths.
- [x] Cross-check D01–D09 results before marking any design complete; keep unfinished items open.
- [x] Review the documentation diff for stale direction, unsupported approval claims and accidental changes to rebuild task state.

**Dependencies:** Home rewrite can proceed independently; final index reconciliation follows the other completed design slices.

**Files likely touched:**
- `design/handoff/home.md`
- `design/HANDOFF.md`
- `design/PAGES.md`

**Estimated scope:** Small, 3 files. No UI change or application build required for documentation alone.

**D10 evidence — November 17, 2026:**

- Replaced the obsolete Home note with the actual Campus Marquee rendering path: inline Home interactions plus shared public data/navigation/CSS. Verified three manual hero slides, seven day cells, selected-day rows, fixed Coming up/news/notices/historical fixtures, connected destinations, calendar snapshot behavior and actual responsive classes. The old data-query/schema assumptions, fourteen-day/green treatment and masthead questions were removed.
- Distinguished source behavior from production contracts: fixed November 14, 2026 demo date, no Home date URL state, no live featured-setting subscription, no computed expiry/history selection and unimplemented variable/empty/loading/media states. Source/system differences are explicit: 36px week arrows vs 44px target rule, phone count/weekday text vs system dots/TODAY, and the phone soften-mask cascade. No UI was changed to resolve them in this documentation task.
- Updated all 28 inventory IDs with actual prototype links and dedicated handoff or system references; public pages without individual notes are labelled honestly. Team remains deferred, invite-only accounts are established and archived articles already use the proof-sheet filter. Historical Figma labels are references, not current build instructions.
- Audited `src/lib/design-preview.ts`, `src/proxy.ts`, the preview file server, actual app page sources and `next.config.ts`. The docs now distinguish Python HTML previews, mapped development app routes and production placeholders. New builder/embed/error canonical-route mapping remains open; global DENY framing and the local-200/error-reset limitations are recorded.
- Reconciled the status guide against D01–D09 evidence and linked current handoffs. Preserved dated decision history while removing stale active Home/builder/sign-up/Archives tasks. Mapped remaining Home/feed/media/auth/review/widget/framing/client work to the existing rebuild task IDs, without changing or completing any rebuild task.
- Validated 86 local Markdown links across the three deliverable docs and all 28 inventory IDs. Checked documentation whitespace and stale Home terms. Content hashes for 100 UI/runtime/design-system/rebuild-plan files remained unchanged. No UI, route map, token, test runner, application build, deployment or commit was changed by D10. Documentation-only verification does not claim a new visual review or acceptance; historical screenshots and runtime checks are identified as such.
- The previously recorded taste-gate `GATE: ERROR (the gate itself failed: spawn EPERM)` remains unverified and was not rerun. No HTML detector, new browser pass or application build was needed for this Markdown-only change. Dedicated prototype evidence and integration limits remain available per task.

| Before | After | Why |
| --- | --- | --- |
| Home instructions describe a different composition and invented feed/schema rules | Current hero/week/programme composition and explicit fixture/build boundaries | Developers can follow the actual design without inheriting unsupported contracts. |
| Inventory still says builder/widgets/errors need design | Working prototype/handoff links and accurate route-preview status | Separate design availability from unfinished application integration. |
| Stale client questions and completion language | Team deferred, established account/filter decisions retained, visual acceptance explicit | Keep real decisions open without asking settled questions again. |

## Checkpoint E: Complete

- [x] D01–D10 meet the specific gap plan's criteria with evidence and limitations recorded. This does not claim every product feature or public-page state has been designed/re-reviewed.
- [x] Handoffs/index describe current designs and map backend/preview/framing follow-ups to the unchanged rebuild work; none of that integration is marked done.
- [x] Visual acceptance status is explicitly not recorded; passing checks and requests to proceed are not substituted for it. Team remains deferred pending the client.
