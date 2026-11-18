import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
} from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
const root = fileURLToPath(new URL("../", import.meta.url)),
  ref = "lcvxwfhbnzxjihtcrvpa",
  organization = "jphejzrzwchmuxkuijbt";
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token?.startsWith("sbp_fc"))
  throw new Error(
    "Provide an ICG-project-scoped token through the ignored operator environment.",
  );
async function api(path, method = "GET", body) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${ref}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30000),
    },
  );
  if (!response.ok)
    throw new Error(
      `Hosted configuration ${method} ${path || "/project"} failed with HTTP ${response.status}. Check the scoped token permissions.`,
    );
  return response.json();
}
function summarize(auth, rest) {
  return {
    ref,
    signupDisabled: auth.disable_signup,
    passwordMinimum: auth.password_min_length,
    emailExpirySeconds: auth.mailer_otp_exp,
    siteOrigin: auth.site_url,
    redirects: auth.uri_allow_list,
    customSmtpConfigured: !!auth.smtp_host,
    exposedSchemas: rest.db_schema,
  };
}
try {
  const project = await api("");
  if (project.id !== ref || project.organization_id !== organization)
    throw new Error("The API target does not match the dedicated ICG project.");
  const [auth, rest] = await Promise.all([
    api("/config/auth"),
    api("/postgrest"),
  ]);
  if (!process.argv.includes("--apply")) {
    console.log(JSON.stringify(summarize(auth, rest)));
    process.exit(0);
  }
  const file = join(root, ".env.local");
  let contents = existsSync(file) ? readFileSync(file, "utf8") : "";
  const current = Object.fromEntries(
    contents
      .split(/\r?\n/)
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at), line.slice(at + 1)];
      }),
  );
  const origin = new URL(current.ICG_SITE_URL || "http://127.0.0.1:3000");
  if (
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    (origin.protocol !== "https:" &&
      !["127.0.0.1", "localhost"].includes(origin.hostname))
  )
    throw new Error(
      "Configure an HTTPS origin or loopback development origin.",
    );
  const redirects = [
    `${origin.origin}/**`,
    ...(["127.0.0.1", "localhost"].includes(origin.hostname)
      ? ["http://127.0.0.1:3000/**", "http://localhost:3000/**"]
      : []),
  ]
    .filter((value, index, all) => all.indexOf(value) === index)
    .join(",");
  const authPatch = {
    disable_signup: true,
    password_min_length: 12,
    mailer_otp_exp: 86400,
    site_url: origin.origin,
    uri_allow_list: redirects,
    external_anonymous_users_enabled: false,
    external_phone_enabled: false,
    external_email_enabled: true,
    external_google_enabled: false,
    mailer_autoconfirm: false,
    mailer_secure_email_change_enabled: true,
  };
  if (auth.smtp_host) {
    authPatch.mailer_templates_invite_content = readFileSync(
      join(root, "supabase/templates/invite.html"),
      "utf8",
    );
    authPatch.mailer_templates_recovery_content = readFileSync(
      join(root, "supabase/templates/recovery.html"),
      "utf8",
    );
  }
  mkdirSync(join(root, ".cache"), { recursive: true });
  writeFileSync(
    join(root, ".cache", "cloud-config-before.json"),
    JSON.stringify(
      {
        auth: Object.fromEntries(
          Object.keys(authPatch).map((key) => [key, auth[key]]),
        ),
        rest: { db_schema: rest.db_schema },
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  await api("/config/auth", "PATCH", authPatch);
  await api("/postgrest", "PATCH", { db_schema: "public" });
  const [verifiedAuth, verifiedRest, keys] = await Promise.all([
    api("/config/auth"),
    api("/postgrest"),
    api("/api-keys?reveal=true"),
  ]);
  for (const [key, value] of Object.entries(authPatch))
    if (verifiedAuth[key] !== value)
      throw new Error(`Hosted Auth did not retain setting ${key}.`);
  if (verifiedRest.db_schema !== "public")
    throw new Error(
      "Hosted exposed schemas did not match the application contract.",
    );
  const keyRows = z
    .array(
      z.object({
        api_key: z.string(),
        type: z.string().optional(),
        name: z.string().optional(),
      }),
    )
    .parse(keys);
  const publishable = keyRows.find((key) =>
    key.api_key.startsWith("sb_publishable_"),
  )?.api_key;
  const secret = keyRows.find(
    (key) =>
      key.api_key.startsWith("sb_secret_") &&
      !key.api_key.includes("...") &&
      key.api_key.length > 35,
  )?.api_key;
  if (!publishable || !secret)
    throw new Error(
      "The project needs readable publishable and server secret API keys. No application configuration was switched.",
    );
  const settings = {
    NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
    ICG_SUPABASE_SECRET_KEY: secret,
    ICG_SITE_URL: origin.origin,
    ICG_AUTH_COOKIE_SECRET:
      current.ICG_AUTH_COOKIE_SECRET || randomBytes(32).toString("hex"),
    ICG_ALLOW_INDEXING: "false",
  };
  if (
    existsSync(file) &&
    current.NEXT_PUBLIC_SUPABASE_URL === "http://127.0.0.1:55321"
  )
    copyFileSync(file, join(root, ".cache", "local-stack.env.backup"));
  for (const [key, value] of Object.entries(settings)) {
    const pattern = new RegExp(`^${key}=.*$`, "m");
    contents = pattern.test(contents)
      ? contents.replace(pattern, `${key}=${value}`)
      : contents + `\n${key}=${value}\n`;
  }
  writeFileSync(join(root, ".env.cloud.local"), contents, { mode: 0o600 });
  writeFileSync(file, contents, { mode: 0o600 });
  console.log(
    JSON.stringify({
      ...summarize(verifiedAuth, verifiedRest),
      applicationSwitched: true,
      serverKeyConfigured: true,
      templatesInstalled: !!auth.smtp_host,
      keysPrinted: false,
    }),
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Hosted configuration failed.",
  );
  process.exitCode = 1;
}
