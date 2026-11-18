# ICG implementation and acceptance evidence

Updated November 18, 2026 (Asia/Manila). All eight modules are implemented. The application is now connected to the dedicated ICG cloud project, with fourteen migrations applied and live cloud checks passing. Public launch still needs the domain, verified Resend sender/SMTP, email templates and first administrator.

## Completed application

- Identity/access: authoritative one-role profiles, session-aware RLS, immediate deactivation and fresh-session reactivation, last-admin protection, one-time verified first-admin operator procedure, login/logout, native invitations/recovery, account preferences/photo and user administration. Invitations expire in 24 hours; resend/withdraw/use/expiry invalidate application membership links. A verified but unfinished native invite resends through native recovery without deleting the Auth identity.
- Editorial: Tiptap JSON validation and allowlisted shared renderer; optimistic serialized autosave and recovery download; independent exact-revision review, acceptance/decline/step-down, checklist fixes, second-read body and detail comparison, explicit publication/schedules, archive and admin withdrawal/restoration, immutable public revision during replacements, captured bylines. Covers, galleries, metadata, Events and Announcements are implemented.
- Public record: ordered featured fallback, seven-day event strip, upcoming events/news/notices, prior-year anniversary query, archive search/filter with timestamp/ID cursor pagination, event-interval calendar and ICS, related records, About, metadata/canonical URLs, paged sitemap index and real HTTP 404/error/loading states. Announcement expiry affects promotion only.
- Site management: stable category slugs, referenced-category archival, tags, safe public contact/social settings, ordered About sections with the same safe text/image/video subset, curation, deployment-only mail configuration and service health/test queue.
- Communication: recipient inboxes, source-derived tasks, optional role email preferences with mandatory security notices, durable bounded/deduplicated Resend outbox, verified webhook processing, shared admin contact read/status/replies, distinct delivery status and weekday reply targets. No inbound mailbox synchronization.
- Operations/embeds: immutable admin-readable audit and bounded CSV snapshot export with formula escaping; retention; minute publication and mail dispatch, housekeeping, bounded job health/failure codes, role month desks, real widget previews and escaped matching iframe output. Framing is allowed only for the two exact widget routes.

## Final verification results

| Check | Actual result |
| --- | --- |
| Versioned migration replay | The original 13 migrations replayed from empty locally; the contact retry fix is migration 14. All 14 subsequently applied successfully to the empty cloud project, and cloud history matches the source versions. |
| `npm run test:db` | 157 pgTAP assertions pass across 11 files. |
| `npm run test:local` | 18 native Auth/Data API/concurrency/discovery tests pass across 7 files. |
| `npm run test:unit` | 48 tests pass across 8 files. |
| `npm run test:e2e` | 16 tests pass at 390px and 1440px against an isolated local production build. |
| `npm run lint` | Pass. |
| `npm run typecheck` | Pass. |
| `npm run build` | Pass with the pinned Next.js 16.4.6 toolchain. |
| Whitespace validation | `git diff --check` passes for implementation paths. |

The browser suite uses actual local users, server actions, RLS, Storage and publication. It proves writer → independent reviewer → public reader, private replacement isolation, draft media denial, public media after publication, withdrawal returning HTTP 404 for article and image with no-store, explicit restoration, anonymous Contact → admin inbox, real audit CSV without message bodies, About image upload/publication, live embed builder, and a 280px frame from a second real origin. Public shell checks cover runtime errors, overflow and blocked legacy PHP source. Screenshots in ignored test-results were inspected for desktop editor/admin Overview and phone reviewer Overview/embed builder; fixtures are removed afterwards.

Native Auth tests use captured Mailpit emails, actual callback handlers and native tokens. They cover expired/withdrawn/used/replaced invitations, verified-but-unaccepted resend, recovery-cookie tamper checks, global session revocation, admin-only email change, bootstrap confirmation and first-admin protection. Discovery tests cover equal publication timestamps and new records between pages without duplicate archive entries. Database tests cover exact approval, second reads, NULL/stale revisions, schedules/idempotency, Manila midnight/year boundaries and multi-day intervals, About/avatar media boundaries, webhook ordering/replay/exhaustion, and retention preserving open cases/article history.

## Independent review and corrections

Identity/editorial and final security reviews found and corrected authorization-after-lock timing, reactivation cutoff, self-demotion audit attribution, NULL optimistic guards, inherited editor provenance, mandatory security notices, draft-tag leakage, malformed rich JSON, replayed failure events, exhausted reply state and per-row delivery validation. Two deterministic native concurrency tests failed before fixes and pass afterwards:

1. Reviewer deactivation between eligibility checking and assignment insertion. A consistent advisory-lock-before-row-lock order now serializes role changes, submissions, decisions and publication. Trigger candidates are rechecked after waits.
2. A provider callback between delivery association and worker transaction commit. A shared provider lock now serializes event recording/association so the event cannot remain unapplied.

Scheduled mail request failures are reconciled from pg_net using safe status codes only; hanging/overlapping dispatch is bounded. Housekeeping records SQLSTATE outside rolled-back work. No response body, URL or authorization header enters job failure records. The independent final review and About-media review reported no remaining actionable high-consequence finding within their reviewed scope.

The browser withdrawal regression caught streamed 404 content with HTTP 200. Loading boundaries now apply to list pages rather than the article ancestor, and real withdrawn/missing article responses return 404.

## Architecture and workspace

Domain tables are in the unexposed private schema, protected by RLS and explicit grants. Public invoker views project approved public revisions separately from desk data. Normal queries retain caller permissions. Auth metadata and browser role fields do not grant access.

Storage clients may insert authorized pending assets but cannot select objects or mint signed downloads. The media handler first authorizes through caller-scoped media_location, then uses a narrow privileged byte-delivery adapter. Responses are uncached, with unoptimized images, so later withdrawal/deactivation and About reference removal are enforced on new requests. This is the explicit controlled server-key exception in addition to Auth administration/background workers. Uploads are capped at 4 MB, checked by MIME signatures/size/ownership, and revision associations are validated. Profile photos remain desk-only.

The isolated ICG stack uses ports 55320–55329. Other project containers were not stopped or reset. Migration replay refuses the exact local stack if accounts/articles/contact cases exist, and cannot target hosted infrastructure. Native CLI output is captured in ignored .cache logs because it may contain local keys. Credentials stay in ignored .env.local or deployment secrets; they are never source defaults. Existing staged legacy renames and the separate completed design plan were preserved. No commit, push or Vercel deployment was performed. Cloud database/configuration deployment is recorded in cloud-acceptance.md.

## Cloud cutover completed November 18

The Supabase connection now exposes organization ICG (`jphejzrzwchmuxkuijbt`) and its existing healthy project `icg` (`lcvxwfhbnzxjihtcrvpa`, Singapore). Before migration, the project had no application tables, accounts, buckets or migration history. No new project or paid resource was provisioned.

All 14 source migrations were applied sequentially through the connector. Its generated history timestamps were immediately aligned to each successfully applied source version; cloud-migration-manifest.json records the source SHA256 and original generated version. Remote migration history matches all source versions/names. Types were regenerated from cloud and the application compiles against them.

The scoped operator token configured Auth and Data API through the Management API: signup disabled, password minimum 12, email token expiry 86400, anonymous/phone/Google sign-in disabled, only public exposed, and loopback development redirects. The app's ignored .env.local and .env.cloud.local now contain matched cloud public/server keys. No key/token was printed or committed. The previous local configuration is backed up in ignored .cache/local-stack.env.backup. Local tests still force the exact loopback backend; browser acceptance now uses its own .next-e2e build.

Live cloud verification passed 33 API/Auth/Storage/authorization checks and 26 browser checks at 390px/1440px without creating cloud fixtures. Cloud has 25 RLS-protected application tables, invoker public views, zero public definer functions, a private 4 MB image bucket and 3 active Cron jobs. Recent scheduled runs succeeded; no job failures were recorded. Accounts, profiles, articles, messages and media remain empty.

Final review/testing additionally reproduced and fixed: simultaneous contact retries returning a unique-key error; valid Svix callbacks rejected because its verify method returns void; ASCII control characters turning a return path into an external redirect; and local CLI failures potentially logging captured credentials. Regression tests failed before each fix and pass afterwards.

See cloud-acceptance.md for the test matrix, advisories and remaining launch work. The first-admin email remains <first-admin-email>, supplied as an operator input. No external email delivery, public domain, Vercel deployment or first-admin verification is claimed yet.
