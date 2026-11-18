# First ICG administrator

Run this procedure once against the dedicated ICG project after its migrations
and native Auth email templates are installed. The first administrator's email
and full name are operator inputs; they have no source-code defaults. This does
not create a hosted project or modify any unrelated organization.

Supply `NEXT_PUBLIC_SUPABASE_URL`, `ICG_SUPABASE_SECRET_KEY`, and `ICG_SITE_URL`
through the operator environment. Use the project's secret/service-role key only
in that trusted environment. The command reads credentials without printing them.
Never put a privileged key in a `NEXT_PUBLIC_*` variable or a command-line argument.

1. Verify the Supabase project reference belongs to the dedicated ICG project,
   configure native SMTP, disable public signup, set native link expiry to 86400
   seconds, and install `supabase/templates/invite.html` and `recovery.html`.
   Allow the canonical site origin and `/auth/confirm` redirects in Auth settings.
2. Send the operator a native verification link:

   ```powershell
   node tooling/bootstrap-admin.mjs --mode invite --email "<operator-email>" --name "<full-name>" --project-ref "<dedicated-icg-ref>"
   ```

3. The operator opens the email link. It verifies the Auth identity and returns
   to login. Desk access remains unavailable until the next step; no password
   is generated, logged, or sent by the script.
4. Create the authoritative first-admin profile:

   ```powershell
   node tooling/bootstrap-admin.mjs --mode bootstrap --email "<operator-email>" --name "<full-name>" --project-ref "<dedicated-icg-ref>"
   ```

5. The operator uses **Forgot password**, opens the new recovery email, sets a
   password, and signs in. Verify the People and Audit screens. Invite subsequent
   members through People; bootstrap refuses once an active admin exists.

For the isolated local ICG stack, first run `node tooling/configure-local.mjs`,
then add `--env-file=.env.local` immediately after `node` in both commands and omit
`--project-ref`. Local email is captured at `http://127.0.0.1:55324`; no external
email is sent. The local URL must be exactly `http://127.0.0.1:55321`.

## Invitation resend behavior

Opening a native invitation confirms its Auth identity before the person accepts
desk membership. Native invite resend refuses that verified identity. People
therefore sends a native recovery sign-in link for a verified identity that still
has no desk profile. Its email may say **Reset your password**; it opens the latest
invitation acceptance page, where the person sets their password and joins. The
old application invitation remains invalid, and an existing desk member cannot
be re-invited through this path. Recovery and invite email templates must both be
installed for this flow.

## Local evidence

`tests/local/auth.integration.ts` uses real local Auth, SMTP capture and Data API
with synthetic users. It covers native acceptance, both resend states,
expired/withdrawn/used links, signed recovery context, old-session revocation,
administrator email control, and bootstrap privilege/second-admin denial.
`supabase/tests/bootstrap.test.sql` proves the positive first-admin transaction,
confirmation requirement and audit entry inside a rollback-only fixture.
Never run fixture cleanup or database resets against a hosted project.
