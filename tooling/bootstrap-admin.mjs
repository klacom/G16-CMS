import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

class SetupError extends Error {}
const help =
  "Usage: node --env-file=.env.local tooling/bootstrap-admin.mjs --mode invite|bootstrap --email <operator-email> --name <full-name> [--project-ref <dedicated-icg-ref>]";

try {
  const { values } = parseArgs({
    options: {
      mode: { type: "string" },
      email: { type: "string" },
      name: { type: "string" },
      "project-ref": { type: "string" },
      help: { type: "boolean" },
    },
    strict: true,
  });
  if (values.help) {
    console.log(help);
    process.exit(0);
  }
  const input = z
    .object({
      mode: z.enum(["invite", "bootstrap"]),
      email: z
        .email()
        .max(254)
        .transform((email) => email.toLowerCase()),
      name: z.string().trim().min(3).max(120),
    })
    .safeParse(values);
  if (!input.success) throw new SetupError(help);
  const api = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  const local = api.origin === "http://127.0.0.1:55321";
  if (
    api.username ||
    api.password ||
    api.search ||
    api.hash ||
    api.pathname !== "/"
  )
    throw new SetupError(
      "Configure a Supabase API origin without credentials or a path.",
    );
  if (
    !local &&
    (api.protocol !== "https:" ||
      !values["project-ref"] ||
      api.hostname !== `${values["project-ref"]}.supabase.co`)
  )
    throw new SetupError(
      "Hosted setup requires the exact dedicated ICG --project-ref matching its HTTPS Supabase URL.",
    );
  const secret = process.env.ICG_SUPABASE_SECRET_KEY;
  if (!secret)
    throw new SetupError(
      "Provide ICG_SUPABASE_SECRET_KEY through the operator environment.",
    );
  const client = createClient(api.origin, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const active = await client
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .is("deactivated_at", null)
    .limit(1);
  if (active.error)
    throw new SetupError(
      "Cannot check the project. Apply ICG migrations and verify operator credentials.",
    );
  if (active.data.length)
    throw new SetupError(
      "An active ICG admin already exists. Use its People screen for additional accounts.",
    );
  const { email, name, mode } = input.data;
  if (mode === "invite") {
    const origin = new URL(process.env.ICG_SITE_URL ?? "");
    if (
      origin.username ||
      origin.password ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash ||
      (!local && origin.protocol !== "https:") ||
      (local && origin.origin !== "http://127.0.0.1:3000")
    )
      throw new SetupError(
        "Configure the intended ICG_SITE_URL origin before sending the operator link.",
      );
    const redirectTo = `${origin.origin}/auth/confirm?next=/login`;
    const invited = await client.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });
    if (invited.error)
      throw new SetupError(
        "The operator link could not be sent. If the identity is already verified, run bootstrap; otherwise check native SMTP and resend.",
      );
    console.log(
      "Operator verification email sent. Open its link, then rerun with --mode bootstrap. No admin profile has been created yet.",
    );
  } else {
    let user;
    for (let page = 1; page <= 1000; page++) {
      const listed = await client.auth.admin.listUsers({ page, perPage: 1000 });
      if (listed.error)
        throw new SetupError(
          "Could not find the operator Auth identity. Verify administrative credentials.",
        );
      user = listed.data.users.find(
        (candidate) => candidate.email?.toLowerCase() === email,
      );
      if (user || listed.data.users.length < 1000) break;
    }
    if (!user?.email_confirmed_at)
      throw new SetupError(
        "The operator must open its native verification link before bootstrap.",
      );
    const created = await client.rpc("bootstrap_admin", {
      p_id: user.id,
      p_name: name,
    });
    if (created.error)
      throw new SetupError(
        "Bootstrap was refused. Verify that the identity is confirmed and this project has no active admin.",
      );
    console.log(
      "First ICG admin created. Use Forgot password to set its password, then sign in. Keep operator credentials outside the application client.",
    );
  }
} catch (error) {
  console.error(
    error instanceof SetupError
      ? error.message
      : "First-admin setup failed. Check the command, dedicated project configuration, and network connection.",
  );
  process.exitCode = 1;
}
