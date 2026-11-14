import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { cli, localCliEnv, root } from "./local-supabase.mjs";

const selectors = process.argv.slice(2);
if (selectors.some((selector) => !/^[a-z0-9][a-z0-9_-]*$/.test(selector))) {
  console.error("Use database test names only, without paths or CLI flags.");
  process.exit(2);
}
const directory = join(root, "supabase", "tests");
const available = readdirSync(directory).filter((name) => name.endsWith(".test.sql"));
if (selectors.some((selector) => !available.includes(`${selector}.test.sql`))) {
  console.error("Unknown database test selector.");
  process.exit(2);
}
const files = available.filter((name) => selectors.length === 0 || selectors.includes(name.replace(/\.test\.sql$/, "")));
if (files.length === 0) {
  console.error("No database tests found; refusing to report a successful empty run.");
  process.exit(2);
}
const result = spawnSync(process.execPath, [cli, "--workdir", root, "test", "db", ...files.map((name) => join(directory, name))], {
  cwd: root, env: localCliEnv(), stdio: "inherit",
});
if (result.error) console.error("Unable to start local database tests.");
process.exit(result.status ?? 1);
