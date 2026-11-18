import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { localStatus, root } from "./local-supabase.mjs";

try {
  const status = localStatus();
  if (
    status.API_URL !== "http://127.0.0.1:55321" ||
    !/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(status.PUBLISHABLE_KEY ?? "")
  ) {
    throw new Error("Expected ICG's local publishable configuration.");
  }
  const contents = `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.PUBLISHABLE_KEY}\n`;
  writeFileSync(join(root, ".env.local"), contents, {
    flag: "wx",
    mode: 0o600,
  });
  console.log("Created .env.local with local public configuration only.");
} catch (error) {
  console.error(
    error?.code === "EEXIST"
      ? ".env.local already exists; it was preserved. Update it manually if necessary."
      : "Could not write local configuration. Verify the ICG local stack is running.",
  );
  process.exit(1);
}
