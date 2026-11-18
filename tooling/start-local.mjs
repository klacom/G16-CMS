import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cli, root, localCliEnv } from "./local-supabase.mjs";
const args = process.argv.includes("--restart") ? ["stop", "start"] : ["start"];
mkdirSync(join(root, ".cache"), { recursive: true });
for (const command of args) {
  const result = spawnSync(
    process.execPath,
    [
      cli,
      "--workdir",
      root,
      command,
      ...(command === "start"
        ? [
            "--exclude",
            "realtime,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor",
          ]
        : []),
    ],
    {
      cwd: root,
      env: localCliEnv(),
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  // Native startup can print local keys. Keep its full output out of terminals.
  const output = (result.stdout ?? "") + (result.stderr ?? "");
  writeFileSync(join(root, ".cache", `supabase-${command}.log`), output, {
    mode: 0o600,
  });
  if (result.status !== 0) {
    console.error(
      `Local ICG ${command} failed. Full output is in ignored .cache/supabase-${command}.log; it may contain local credentials.`,
    );
    for (const line of output
      .split(/\r?\n/)
      .filter((line) => /error|failed|unable|port.*used/i.test(line))
      .slice(-5))
      console.error(
        line
          .replace(/sb_(?:secret|publishable)_[\w-]+|eyJ[\w.-]+/g, "[redacted]")
          .slice(0, 300),
      );
    process.exit(result.status ?? 1);
  }
  console.log(`Local ICG ${command} complete.`);
}
