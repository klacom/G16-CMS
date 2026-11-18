# Design plan: Remaining ICG interface gaps

Kind: software — an editorial desk and compact public widgets, using the existing Campus Marquee system.

Created: November 16, 2026 (Asia/Manila).
Status: implementation authorized November 16, 2026. Updated November 17: D01–D09 prototypes are implemented/browser-checked and D10 documentation is complete; Checkpoints A–E evidence is recorded. This specific design-gap plan is complete. The automated taste gate launch limitation (`spawn EPERM`) remains recorded; Team and documented client/build follow-ups remain outside this completion. Visual acceptance is not assumed.
Task list: [design-todo.md](design-todo.md).
Location authorized by the user to preserve the unfinished rebuild plan in `tasks/plan.md` and `tasks/todo.md`.

## Objective and boundary

Complete the specific design gaps identified by the user, beginning with the reviewer and admin Overview. Preserve the selected month desk, proof sheet, ready-for-review editor and review inbox. Deliver static HTML interactions, responsive screenshots and accurate developer handoffs. This is not a redesign of every page or a claim that every existing page has been visually reviewed.

The work is under `design/`, with planning records under `tasks/`. Production React routes, database queries, authentication, authorization, email delivery and hosting changes remain implementation work in the rebuild plan. Role query parameters are prototype controls, not permission enforcement. No commits, deployment or client-facing publication are included.

## Evidence from the checkout

| Finding | Evidence and consequence |
| --- | --- |
| Overview is still writer-only in its content | `dashboard.html` calls `dated()` and reads the shared writer `ARTICLES`; its summary, editor links, Needs you and pipeline are hard-coded for Lea. Changing the sidebar role is insufficient. |
| Review deadline examples already exist | `desk-review.js` includes accepted assignments, invitations, second-round work and `neededBy: null`. Reuse their meanings; an event date is not a review deadline. |
| Admin operational examples already exist | Users and Messages have pending/expired invites, open messages, reply deadlines and delivery failures. Their statuses and counts should agree with Overview examples. |
| Outer-width findings | D04–D05 verified the three Overviews, My articles, editor and Reviews already fill the work area at 1920px; their fluid outer widths were retained. Work-area container queries corrected calendar/editor/review squeezes at 1024px. The editor's 760px measure and Reviews' 900px panel / 680px body cap remain intentional reading limits. |
| Admin Inbox links are stale | Several notices use `#users` plus `later: 'Users'`; the expired-invite task also uses the later-round path. Users now exists. |
| Builder and widgets have no finished prototypes | PAGES #26–28 define the routes; Site settings still uses `#embeds` with `data-later`. Design the actual widgets before wiring the live builder preview. |
| Home handoff is unsafe to build from | `design/handoff/home.md` still specifies broadsheet, green selection and obsolete components. The current prototype and DESIGN.md supply the accepted visual direction. |
| Documentation has conflicting completion claims | HANDOFF.md lists the three-role Overview as done, then explicitly records its writer-only content. `dashboard.md` also retains obsolete shell details. Update these during the relevant slices. |

The initial evidence came from source inspection. D01–D04 now have rendered/browser evidence recorded in design-todo.md; remaining surfaces have not received a new visual audit.

## Design contract

Use DESIGN.md, tokens.css, desk.css and the accepted prototypes as the local reference catalogue. In particular, the selected month desk establishes composition; Reviews establishes reviewer language and decisions; Messages and Users establish admin operational states. No new visual direction needs external reference research.

| Surface | Job and primary action | Composition and required states |
| --- | --- | --- |
| Reviewer Overview | Find the next review requiring attention; open that review | Keep the month grid and selected-day panel. Plot explicitly dated review assignments, label invitations separately, and keep undated work in Needs you. Show overdue, due today, upcoming, returned-for-another-read and caught-up examples. Reviewer actions lead to Reviews. |
| Admin Overview | See publication commitments and work awaiting the desk; open the highest-priority operational item | Calendar dates distinguish scheduled publication from campus event dates. Ruled sections summarize unanswered messages and pending/expired invites. Link into Messages, Users and Articles; counts include the relevant site-wide sample records. |
| Writer Overview | Continue the accepted writing workflow | Preserve writer-specific calendar items, changes requested, article counts and New article. Verify it when shared code changes. |
| Events widget | Find an event and open its details | Compact list and calendar views, with a readable selected-day list at narrow widths. Include empty, loading, failed-load, long-title and crowded-day examples. |
| Announcements widget | Scan current notices and open a notice | Column and row options with defined narrow-width wrapping; no automatic carousel. Include no notices, long text, loading and failed-load examples. |
| Embed builder | Configure, preview and copy the selected widget | Admin desk shell; adjacent configuration and real iframe preview on desktop, stacked on phones. Clear options, preview width and copy success/failure. |
| Not found / error | Recover orientation and continue | A static missing-day calendar motif may make the 404 playful. Generic failures use calm, specific recovery copy and Try again; they must remain usable without the decorative artwork. |

### Visual and interaction rules

- Preserve Evergreen & Marigold, Anton date numerals, Public Sans reading text, flat surfaces, ruled groups and the One Marigold Rule. Add no glass, shadows, marketing hero or decorative dashboard motion.
- Apply the supplied taste skill through composition, equal edges, purposeful density, plain copy and rendered visual checks. Its marketing-page palette deals, full-screen sections and mandatory showpiece moments do not fit the explicitly selected Operate-mode product layout.
- Apply Apple and Emil guidance through immediate feedback, predictable navigation, focus continuity, restrained pointer interactions and reduced-motion behavior. Calendar navigation and frequent keyboard actions stay immediate.
- Start with existing spacing steps. Outer work areas fill the available width while reading columns stay readable. Full width does not require stretching prose across the screen.
- Keep one clear heading hierarchy, visible labels and focus rings. Use text as well as visual status cues; functional controls need accessible names and adequate touch targets.
- Use realistic prototype fixtures already established in the repo. Document their fixed November 15 demo clock separately from the actual date; do not present those records as live activity.
- If a new token or reusable pattern is necessary, update DESIGN.md, tokens.css and the generated sidecar together. Split that into a bounded prerequisite if it exceeds a task's five-file estimate.

## Ordered task index

Detailed acceptance criteria, verification and file estimates are in design-todo.md.

1. D01 — Reviewer Overview.
2. D02 — Admin Overview.
3. D03 — Working admin Inbox links.
4. Checkpoint A — All three role entry screens and admin destinations.
5. D04 — Month desk and proof-sheet spacing; wide-screen verification.
6. D05 — Editor spacing and Reviews width verification.
7. Checkpoint B — Core desk polish.
8. D06 — Compact events widget.
9. D07 — Compact announcements widget.
10. Checkpoint C — Real widget surfaces at host widths.
11. D08 — Embed builder using those widgets.
12. D09 — Branded not-found and generic error prototypes.
13. Checkpoint D — Remaining designed surfaces.
14. D10 — Rewrite Home handoff and reconcile the design status index.
15. Checkpoint E — Handoffs and evidence complete; ready for user review.

The highest-risk content mismatch is first. D03 is deliberately a small follow-through while role navigation is being checked. D06 and D07 precede D08 so the builder cannot diverge from its previews. D09 and D10 have no dependency on widget internals; they may be scheduled sooner if integration work is waiting on them. This plan does not dispatch parallel agents.

D02 was delivered in bounded slices: shared Messages/Users fixture extraction (three files), Overview/behavior checks/handoff (four files), then design-system/status documentation (two files plus the generated sidecar). This kept operational counts consistent with their destination pages without changing the writer article dataset.

## Verification and evidence contract

For every changed surface, verify its main path, a relevant empty/error case and keyboard behavior. Inspect screenshots at 390px and 1440px, plus a 1920px desk capture for all three Overviews, My articles, editor and Reviews. Check overflow at 320px, 768px and 1024px. For widgets, test the actual iframe content width, including 280px, 320px, 390px and a wide host; include a long unbroken title and a crowded date.

Use the existing local design-server workflow (`python -m http.server 4321 --bind 127.0.0.1` from the repo root). The focused runner is `python -I design/tools/check_dashboard.py`; D01 added reviewer content, deadline, destination and recovery assertions beyond the original navigation-only coverage. Extend it for D02. Capture evidence with `python -I design/tools/shot.py <url> design/tools/out/<name>`. New widget/builder/error checks should verify behavior and links, not merely mirror markup.

Run the project's impeccable detector on completed HTML surfaces and examine the rendered result. When a taste-skill gate is used during implementation, report its exact result; document any marketing-only rule as inapplicable with the Operate-mode reason rather than altering the page to satisfy an irrelevant rule. No website gate is claimed for these Markdown planning files.

Existing prototype checkers and screenshot helpers use Playwright. The supplied taste skill restricts browser checks to its own headless scripts; resolve any tooling conflict explicitly in the implementation verification record. Keep the project's required runtime and screenshot evidence, and never claim an unrun check passed.

If application preview mappings are changed later, run the focused preview-route tests, lint, typecheck and build. Pure prototype/document slices do not require the unrelated database suite. Record screenshots, behavior checks, console failures and unresolved findings at each checkpoint; green automation alone does not mean the user approved the design.

## Dependencies and risks

| Risk or dependency | Impact | Treatment |
| --- | --- | --- |
| Shared role code breaks the writer | High | Verify writer alongside reviewer and admin after both Overview slices. Role-specific content and action destinations need assertions. |
| Counts disagree between prototypes | Medium | Reuse or reconcile existing review/message/invite fixtures. Avoid a broad fixture refactor; split any necessary shared extraction. |
| Null review deadlines become invented calendar dates | Medium | Keep undated requests in Needs you; never use submission or event time as a deadline substitute. |
| Static demo time resembles live status | Medium | Keep a documented stable clock for screenshots and specify Asia/Manila for the production handoff. |
| Unnecessary width changes hurt reading | Medium | Capture baseline at 1920px first; keep justified inner reading limits and fix only evidenced outer-width defects. |
| Embeds blocked by production headers | High for release | `next.config.ts` currently sends `X-Frame-Options: DENY` globally. Record a rebuild follow-up to permit the public embed routes under the agreed framing policy while protecting private routes. Static iframe preview does not prove hosted embedding works. |
| New prototypes are absent from app preview | Medium | Static design review is sufficient for this plan. Add explicit prototype-to-route mappings as a separate bounded integration slice when requested; do not imply production routes were implemented. |
| Old handoffs override accepted designs | High | D01/D02 refresh dashboard.md; D10 replaces obsolete Home instructions and the final status index. |
| Broader editorial/publication rules unresolved | Medium | Show design states without deciding quorum, self-review, archive eligibility or rich-text format. Carry existing rebuild decisions forward unchanged. |

## Client decisions and open questions

- Team (#7) stays deferred until ICG confirms whether it wants the page. It is outside the executable task list.
- The Home handoff was rewritten in D10 against the current prototype and DESIGN.md. Client confirmation is still needed for real content/contact/assets and historical selection; source/system differences and remaining Home states are listed in the handoff.
- Reviewer deadline ownership, contact-message assignment and precise production widget options may need product confirmation. Prototype them using the established examples, mark proposals in the handoff and avoid treating them as new backend requirements.
- Exact production embed origin, framing policy and iframe resizing strategy belong to the rebuild integration contract. The builder design must make its preview behavior and resulting code clear without claiming these are already implemented.

## Planning validation

- Every task has at most three acceptance criteria, focused verification, dependencies and an estimate of five files or fewer.
- Checkpoints follow groups of two or three slices.
- Existing incomplete rebuild plans are preserved.
- No UI, runtime behavior or production configuration was changed during the original planning pass.
- The user authorized implementation on November 16, 2026 ("Let's proceed with the plan"). Visual acceptance remains separate from implementation and passing tests.
