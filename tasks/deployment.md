# ICG acceptance and launch

The application is now connected to the existing ICG cloud project `lcvxwfhbnzxjihtcrvpa` in organization ICG (`jphejzrzwchmuxkuijbt`). Fourteen migrations, private Storage, Cron and hosted Auth/Data API configuration are applied and verified. The main ignored .env.local points to cloud; no Vercel deployment or public launch has occurred. There is no legacy import. See cloud-acceptance.md for current evidence and remaining setup.

## Configuration

Use `.env.example` as the variable inventory. For a new local checkout, setup is `npm run supabase:start`, then `node tooling/configure-local.mjs`, then `npm run dev`. In this configured workspace npm run dev now uses cloud; configure-local deliberately refuses to overwrite cloud settings. Local tests select loopback independently. Local mail goes to Mailpit, not to real recipients. Do not enable `ICG_DESIGN_PREVIEW` for application acceptance.

For Vercel, set the public Supabase URL/publishable key, server-only `ICG_SUPABASE_SECRET_KEY`, HTTPS `ICG_SITE_URL`, and a stable random `ICG_AUTH_COOKIE_SECRET` of at least 32 characters. Keep preview deployments on separate configuration with indexing disabled. The application uses the approved Supabase SSR cookie flow; the server secret is restricted to Auth administration, queued-delivery workers and the permission-checked private-media adapter. Never expose it as `NEXT_PUBLIC_*`.

Mail requires `RESEND_API_KEY`, a verified `ICG_MAIL_FROM`, a real `ICG_MAIL_REPLY_TO` mailbox, `RESEND_WEBHOOK_SECRET`, and a random `ICG_WORKER_SECRET` of at least 32 characters. These values belong in deployment secrets. They do not belong in database site settings, source code, browser configuration or chat. The user has not supplied a domain or verified sender yet.

## Provision and accept

1. Confirm the ICG organization in the connected Supabase account. Select the dedicated project's region and actual provider plan/cost before provisioning. Never use the connected EcoPinas project as a substitute.
2. Apply versioned migrations in timestamp order with the pinned CLI to the new empty ICG project. Review the target ref before `db push`. Generate public database types and check for unexpected differences. Enable the private Storage bucket and required Cron/pg_net extensions through these migrations.
3. In hosted Auth, disable public signup and third-party sign-in. Set email token expiry to 86,400 seconds, password minimum to 12, site URL to the accepted origin, and an exact redirect allowlist for `/auth/confirm` on accepted origins. Apply `supabase/templates/invite.html` and `recovery.html` in the hosted template editor. Local TOML is not proof of hosted settings.
4. Configure Resend custom SMTP in Supabase Auth, using Resend's SMTP credentials and verified sender. The application uses Resend's API separately for workflow/contact mail. Verify DNS records and a real invite, recovery, and reply message before acceptance.
5. Deploy the built Next.js application to Vercel with the dedicated project's configuration. Set the canonical origin only when selected. Create the first administrator with [bootstrap.md](bootstrap.md), using `<first-admin-email>` as the user's current operator email. No synthetic fixture account should enter the hosted project.
6. Register Resend webhook events `email.delivered`, `email.bounced`, `email.failed`, and `email.complained` at `/api/webhooks/resend`; set its signing secret in Vercel. The handler checks the signature, event identity and ordering, and stores only delivery metadata. Incoming email is not synchronized into the desk.
7. Using an operator-only service client, invoke `configure_worker` with the accepted HTTPS origin and matching `ICG_WORKER_SECRET`. This enables the minute-based `icg-mail` job. Verify `icg-publication`, `icg-housekeeping`, and `icg-mail` in Cron. The mail job deliberately does nothing until configured. Verify mail health/test delivery from Settings, and use Messages to inspect each reply's delivery state.
8. Run hosted read-only/schema checks and isolated acceptance records through all four roles. Verify invitation expiry/resend/withdrawal, inactive JWT denial, exact revision review, concurrent saves, publication jobs, private image revocation, all public surfaces, contact retries/webhooks, real cross-origin widgets, audit export and retention. Do not run local fixture/reset commands on hosted infrastructure.
9. Load approved public copy and image assets; set contact details, About, taxonomy and featured stories. Keep `ICG_ALLOW_INDEXING=false` until the canonical domain and content are accepted. Then enable it, check canonical metadata, `/robots.txt`, `/sitemap.xml`, and linked sitemap pages.

## Operation and recovery

- Settings shows queued/exhausted deliveries and recent job failures; check these and Supabase Cron run history after deployment. Alert through the hosting/provider monitoring configuration on failed worker invocations, repeated job failures, and exhausted deliveries. Monitoring destinations remain a hosted setup input.
- The mail worker leases up to five records per request, uses provider idempotency keys, and has bounded attempts within the provider's idempotency window. Failed replies remain visible and actionable. A missing sender must never be treated as delivered email.
- Retention runs every fifteen minutes: inbox records 90 days, closed contact cases/reply bodies 12 months after closure, audit entries 24 months. Open contact cases and article/revision history remain. Do not manually delete audit entries to repair operational state.
- Enable backups on the chosen hosted plan before public launch and exercise its documented restore process on a separate project. Keep a known-good Vercel deployment available. Application rollback can redeploy that build; do not reverse migrations by dropping content tables. For a serious publication issue use admin withdrawal; for a mail incident disable the mail worker configuration/dispatch while preserving the queue.
- Local migration replay is `npm run verify:migrations`. It verifies the exact loopback stack/container and refuses any stack containing accounts, articles or contact cases. It has no hosted target option. Native CLI output is captured in ignored `.cache` because it can include keys.

Official references: [Supabase sessions](https://supabase.com/docs/guides/auth/sessions), [Cron](https://supabase.com/docs/guides/cron), [Resend SMTP](https://resend.com/docs/send-with-supabase-smtp), [Resend webhooks](https://resend.com/docs/webhooks/introduction), [Next.js sitemaps](https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps).

## Applied cloud configuration

Cloud Auth uses the current loopback development origin until a canonical domain is selected. The Data API exposes only public. Email templates were not installed because custom SMTP is absent; the provider requires custom SMTP for template customization on new Free projects. Invitation/recovery email acceptance therefore remains a launch gate.

`node --env-file=.env.operator.local tooling/configure-cloud.mjs` reads a safe configuration summary; add --apply only for an authorized settings update/cutover. It is locked to the exact ICG project/organization and uses the separately ignored scoped token file. It never copies that token to the application environment. Keep .env.operator.local out of source control and revoke its token when operator work is finished.

`node --env-file=.env.cloud.local tooling/verify-cloud.mjs` performs live read/denial checks with no fixtures. After npm run build, `node --env-file=.env.cloud.local tooling/smoke-cloud.mjs` starts a temporary server on3300 and checks public pages/feeds/boundaries on phone/desktop without creating content. `npm run test:e2e` builds its own local .next-e2e output, so it cannot reuse a cloud build.
