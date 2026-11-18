import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { localStatus, root } from "./local-supabase.mjs";

const status = localStatus();
if (
  status.API_URL !== "http://127.0.0.1:55321" ||
  !(status.SECRET_KEY ?? status.SERVICE_ROLE_KEY)
)
  throw new Error("Only the isolated ICG local stack is supported.");
const file = join(root, ".env.local");
let contents = "";
try {
  contents = readFileSync(file, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
if (
  /NEXT_PUBLIC_SUPABASE_URL=(?!http:\/\/127\.0\.0\.1:55321(?:\r?$))/m.test(
    contents,
  )
)
  throw new Error("Existing configuration is not the ICG local stack.");
const settings = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
  ICG_SUPABASE_SECRET_KEY: status.SECRET_KEY ?? status.SERVICE_ROLE_KEY,
  ICG_AUTH_COOKIE_SECRET: randomBytes(32).toString("hex"),
  ICG_SITE_URL: "http://127.0.0.1:3000",
};
for (const [key, value] of Object.entries(settings)) {
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(contents)) {
    if (
      [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "ICG_SUPABASE_SECRET_KEY",
      ].includes(key)
    )
      contents = contents.replace(pattern, `${key}=${value}`);
  } else contents += `\n${key}=${value}\n`;
}
writeFileSync(file, contents, { mode: 0o600 });
console.log(
  "Local ICG configuration is ready. Credentials were written only to ignored .env.local.",
);
