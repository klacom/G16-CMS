import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Development only: serves the HTML prototypes and their assets for the design preview
 * (see src/proxy.ts). Production returns 404, so design/ and legacy/ are never served.
 */

// turbopackIgnore keeps the build from tracing (and bundling) the whole project for these reads.
const ROOT = process.cwd();
/** Folders the preview may read, relative to the project root (forward slashes). */
const ALLOWED_DIRS = ["design/", "legacy/gallery/"];
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const TEXT = new Set([".html", ".css", ".js"]);

const notFound = () => new Response("Not found", { status: 404 });

/** Prototype files use relative paths; on app routes they must be absolute. */
function absolutize(text: string, ext: string) {
  let out = text
    .replace(/(?:\.\.\/)+legacy\//g, "/preview/legacy/")
    .replace(/\.\.\/(tokens\.css|tailwind\.config\.js)/g, "/preview/design/$1");
  if (ext === ".html")
    out = out.replace(
      /\b(src|href)="([\w.-]+\.(?:js|css))"/g,
      '$1="/preview/design/prototypes/$2"',
    );
  return out;
}

/**
 * Path parameters (e.g. /news/[slug]) reach the prototype as the query values it reads,
 * and PREVIEW_FILE names the prototype for scripts that would read it from the address.
 */
function defaultsShim(file: string, defaults: Record<string, string>) {
  const data = JSON.stringify(defaults).replace(/</g, "\\u003c");
  return `<script>window.PREVIEW_FILE=${JSON.stringify(file)};(function(d){var N=URLSearchParams;function P(i){var s=new N(i);if(i===location.search)for(var k in d)if(!s.has(k))s.set(k,d[k]);return s}P.prototype=N.prototype;window.URLSearchParams=P})(${data})</script>`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (process.env.NODE_ENV !== "development") return notFound();

  const { path: parts } = await params;
  const file = path.resolve(/* turbopackIgnore: true */ ROOT, ...parts);
  const ext = path.extname(file).toLowerCase();
  const rel = path
    .relative(/* turbopackIgnore: true */ ROOT, file)
    .split(path.sep)
    .join("/");
  if (!TYPES[ext] || !ALLOWED_DIRS.some((dir) => rel.startsWith(dir)))
    return notFound();

  let body: Buffer;
  try {
    body = await readFile(file);
  } catch {
    return notFound();
  }
  const headers = { "Content-Type": TYPES[ext], "Cache-Control": "no-store" };
  if (!TEXT.has(ext)) return new Response(new Uint8Array(body), { headers });

  let text = absolutize(body.toString("utf-8"), ext);
  if (ext === ".html") {
    let defaults: Record<string, string> = {};
    try {
      defaults = JSON.parse(
        new URL(request.url).searchParams.get("__preview_defaults") ?? "{}",
      );
    } catch {
      /* none */
    }
    text = text.replace(
      /<head>/i,
      (head) => head + defaultsShim(path.basename(file), defaults),
    );
  }
  return new Response(text, { headers });
}
