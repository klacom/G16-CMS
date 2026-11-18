# ICG cloud acceptance — November 18, 2026

The existing project [icg](https://supabase.com/dashboard/project/lcvxwfhbnzxjihtcrvpa) in organization ICG is migrated and the application is connected. No new paid resource was created. Before deployment, the target had zero application tables, Auth users, buckets and migration history. Synthetic data stayed local throughout.

## Verification matrix

| Area | Evidence |
| --- | --- |
| Access/accounts | Real local Auth invite/resend/withdraw/expiry/use/recovery/email-change/session tests; session-aware RLS, role escalation and last-admin checks. |
| Author/reviewer/publication | Native independent review/publication, checklist fixes and second reads; stale/null revision guards, inherited editor provenance, replacement drafts, schedules/idempotency, archival and withdrawal; phone/desktop journeys. |
| Content/public discovery | Validated Tiptap rendering/media, cover/gallery metadata, real About uploads; year-boundary multi-day events, individual/subscription ICS, archive cursor stability, Home/widgets announcement expiry, canonical metadata/sitemaps and HTTP404. |
| Communication | Contact validation/privacy, shared inbox/reply state, concurrent identical submission deduplication, durable delivery/retry/exhaustion, concurrent provider association, and 15 actual signed-Svix handler cases. |
| Operations/settings/widgets | Safe settings/taxonomy/About/featured mutations; source-derived tasks/month desks; retention preserves unresolved cases/history; safe bounded CSV; real cross-origin 280 px iframe; job failure/recovery checks. |
| Final local commands | 48 unit tests, 157 pgTAP assertions, 18 native integration tests and 16 phone/desktop browser/request tests pass. Lint, typecheck and cloud production build pass. |
| Live cloud API | 33 checks pass: public reads, private-data denial, private-schema exclusion, calendar/anniversary queries, service-only RPC denial, private Storage, server-key validity and disabled signup. No accounts/content created. |
| Live cloud-backed app | 26 page/feed/404/private-route checks pass at 390 px and 1440 px. No accounts/content created. |

The test inventory covers the agreed scenarios and reviewed RPC/route boundaries; it is not a proof of every possible input or execution path. Live external Resend delivery and real-account acceptance are still pending the sender/SMTP setup.

## Deployed state

- 14 ordered migrations applied; cloud history matches source versions/names. [Migration manifest](cloud-migration-manifest.json) records hashes and connector-generated timestamps before history alignment. Cloud types regenerated and compiled.
- 25 application tables with RLS; all public views use security_invoker; zero public SECURITY DEFINER functions.
- Private icg-media bucket, JPG/PNG/WebP,4MB maximum, permission-checked uncached delivery.
- Cron: minute publication, minute mail dispatch and 15-minute housekeeping. Recent runs succeeded; zero recorded job failures. Mail dispatch remains a no-op until its HTTPS worker origin/secret is configured.
- Auth: signup disabled, minimum password 12, token expiry 86400 seconds, anonymous/phone/Google sign-in disabled. Public Data API schemas: public only.
- Site/redirect origin remains loopback for development because no canonical domain was supplied. Indexing stays disabled.
- Modern matched publishable/server keys are confined to ignored .env.local and .env.cloud.local. Operator PAT is confined to separately ignored .env.operator.local. No credentials printed or committed.
- Final cloud snapshot: zero Auth accounts, profiles, articles, messages and media assets. No local fixtures imported.

## Findings and limits

Required fixes completed with regressions: contact-request race, Svix verify/parse contract, URL-control-character redirect bypass and CLI-error credential logging. Earlier reviewer-role and delivery-association races remain covered by deterministic native tests.

Security advisor: no WARN/ERROR findings. Six INFO findings indicate intentional RLS-without-policies on worker-only private tables; these deny ordinary callers. Performance advisor: three multiple-permissive-policy WARN groups reflect separate public/desk read rules; INFO findings include unused indexes on the empty project and unindexed foreign keys. These are recorded for workload monitoring and are not authorization failures.

Production dependency audit reports zero vulnerabilities. Full development audit reports 16 inherited high findings around picomatch ReDoS ([GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)); the latest 4.0.7 has no published patch as checked November 18. These dependencies process repository-controlled tooling globs, not website input. No forced framework/test-runner downgrade or audit suppression was introduced. Recheck when a patch is released.

## Remaining launch work

1. Verified ICG Resend sender/domain and API/SMTP/webhook credentials; install hosted invite/recovery templates and verify real delivery. Hosted default SMTP/template behavior is not treated as accepted.
2. Verify the first-admin email <first-admin-email> through [bootstrap](bootstrap.md); no real account was silently created or emailed during migration.
3. Choose canonical domain, deploy/configure Vercel, enable the HTTPS mail worker, wire monitoring and backup/restore procedures, load approved copy/assets, and run real-account acceptance before enabling indexing.

The main app now reads cloud. Local acceptance explicitly overrides its environment and uses .next-e2e, preserving the main .next cloud build. Reset/fixture tools still refuse hosted targets.
