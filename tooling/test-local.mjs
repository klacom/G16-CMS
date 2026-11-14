import { spawnSync } from "node:child_process";
import { localStatus, root } from "./local-supabase.mjs";

let status;
try {
  status = localStatus();
} catch {
  console.error("The ICG local Supabase stack is unavailable. Start it before running test:local.");
  process.exit(1);
}

const url = status.API_URL;
const publishableKey = status.PUBLISHABLE_KEY;
const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
if (url !== "http://127.0.0.1:55321" || !publishableKey || !secretKey) {
  console.error("Expected the ICG loopback stack with local publishable/admin credentials; refusing any other target.");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "--config", "vitest.local.config.ts"], {
  cwd: root,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    ICG_LOCAL_TEST_SECRET: secretKey,
  },
  stdio: "inherit",
});
if (result.error) console.error("Unable to start local integration tests.");
process.exit(result.status ?? 1);
