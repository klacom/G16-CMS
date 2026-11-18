# Approved ICG backend and application contract

Approved for implementation by the user on November 17, 2026 (Asia/Manila).
This replaces provisional business rules in plan.md, contracts.md and decisions.md.
The existing foundation, uncommitted design work, and completed design plan are preserved.

## Modules

| ID | Responsibility | Dependencies |
| --- | --- | --- |
| identity-access | Invite-only Auth, profiles, roles, sessions, users | — |
| editorial | Revisions, media, taxonomy, review, publication | identity-access |
| public-record | Home, article, archive/search, calendar/ICS | editorial |
| site-management | Curation, About, contact details, taxonomy UI | identity-access, editorial |
| notifications | Personal inbox, preferences, workflow mail | identity-access, editorial |
| contact-desk | Public enquiries, private admin replies | identity-access |
| embeds | Public widgets and admin builder | public-record, site-management |
| audit-operations | Audit/export, jobs, retention, delivery retries | Events from the modules above |

## Implementation contract

- Next.js App Router, TypeScript, Supabase and Vercel; existing dependency pins remain until a justified addition. Server Actions for app mutations, Route Handlers for actual HTTP consumers.
- Work locally, then one dedicated hosted ICG Supabase project. EcoPin is unrelated. No legacy DB import; Team and Google sign-in remain deferred.
- One role: writer, reviewer or admin. Authoritative database role/active/session checks protect every private operation, including direct Data API and Storage access. Never authorize from editable metadata.
- Admins invite any email; native invitation expiry 24 hours. Resend/withdraw invalidate application acceptance of older links. Public signup disabled. Operator bootstraps the first admin; last-active-admin changes serialize.
- Members edit their name, private desk photo, password and email preferences; admins control email, role and optional text affiliation. Deactivation immediately denies old sessions while retaining authorship/history. Reactivation requires a fresh session.
- Writers edit own articles; admins manage all. News/Event/Announcement share title, <=200-character excerpt, category, tags, rich JSON body, images/alt/credits and gallery. Event start/end, venue and safe map URL are distinct from publication time.
- Use open-source Tiptap and validated allowlisted JSON rendering, including YouTube/Vimeo embeds, without uploaded videos. Autosaves check expected versions and surface conflicts.
- One active Reviewer assignment per review round; optional explicit writer deadline and note. Only summary before acceptance; full submitted revision afterwards. Reviewer cannot author edits. Authors/editors cannot approve their revision. Changes require separate checklist items; marking a fix never grants approval.
- One approval for the exact immutable submitted revision. Draft -> in_review -> approved -> published -> archived. Editing submitted/approved work cancels its release and requires new review. Author/admin explicitly publishes now or schedules after approval. Due publication jobs are transactional and idempotent.
- New draft for changes to published content; public revision stays live until reviewed replacement is published. Capture approved byline. Archive retains public history but removes promotion. Unchanged archive restoration needs no new review. Withdrawal/restoration is admin-only and removes public access while preserving internal records.
- Optional announcement expiry affects active promotion only. Public pages, related content, search, ICS, calendar, embeds and media share eligibility rules. Keep private media private and uncached, with checked delivery rather than long-lived bearer links.
- Home has three featured slots with eligible deduplicated recent fallback, week events, upcoming events, news, active notices, and prior-year publication anniversaries. Archive has bounded stable search/filter pagination. Calendar uses event intervals and Manila dates; supports month/agenda and ICS subscriptions.
- Admin settings control public settings, safe About sections, taxonomy and curation. Stable category slugs; archive referenced categories. Credentials stay in environment, not site settings.
- Recipient-only inbox; current tasks derived from source records. Optional workflow email preferences; mandatory security notices. Durable Resend deliveries with deduplication, retry limits, verified webhooks and explicit failure states. Daily new-contact rollup at 09:00 Manila.
- Contact topics: question/account/event/correction/photo/partner. Server validation, honeypot, throttling, private persistence. Shared admin read state; open/replied/closed; replies and manual answered/close/reopen/delete. Weekday turnaround, no holiday integration. Separate queued/sent/delivered/failed delivery status. No inbound mailbox synchronization.
- Events embed: list/calendar, startdate, list limit. Notices: row/column, limit. Limits 1-10/default5; height240-1600/default640. Exact same-origin preview and escaped canonical iframe output; fixed-height scrolling. Allow framing only on public widget routes.
- Append-only administrator-readable audit with bounded safe CSV export; no passwords/tokens/message bodies/article bodies. Internal retention only: notifications90 days, closed contacts12 months after closure, audit24 months. Retain article/revision history.
- UTC storage, Asia/Manila display. Jobs via pg_cron and controlled delivery worker. Atomic mutations include audit and outgoing events; expected versions/idempotency guard concurrency. No raw DB errors or secrets in user-visible responses.

## Verification and deployment

Use npm run lint, typecheck, test:unit, test:db, test:local, build and test:e2e as applicable. Prove RLS cross-user denial, stale-session denial, invite invalidation, review/version races, public visibility/media, scheduled idempotency, Manila interval boundaries, email/webhook concurrency, retention and iframe boundaries. Browser-check real reader/writer/reviewer/admin journeys on mobile and desktop.

Deployment inputs: dedicated project/organization, operator's first-admin email, approved public content/assets, canonical domain, Resend credentials and verified sender. Complete all local work independently of unavailable deployment inputs. Never run fixture cleanup/reset on a hosted project. Hosted creation costs require the provider tool's actual cost confirmation, not an inferred budget.
