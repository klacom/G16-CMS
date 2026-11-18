import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const cli = fileURLToPath(
  new URL("../node_modules/supabase/dist/supabase.js", import.meta.url),
);

export function localCliEnv() {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !name.startsWith("SUPABASE_"),
    ),
  );
}

export function localStatus() {
  // Do not log this output: it includes local administrative credentials.
  try {
    const output = execFileSync(
      process.execPath,
      [cli, "--workdir", root, "status", "-o", "json"],
      {
        cwd: root,
        env: localCliEnv(),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    return JSON.parse(output);
  } catch {
    // execFileSync errors carry captured stdout/stderr, including CLI keys.
    // Never forward the child error or attach it as a cause.
    throw new Error(
      "The local ICG stack is unavailable. Start it before running local tooling.",
    );
  }
}
