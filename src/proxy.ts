import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { matchPreviewRoute, routeForPrototype } from "@/lib/design-preview";
import { createServerClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Development only: show the HTML prototypes (design/prototypes/) at the app's routes.
 * - A route with a prototype is rewritten to /preview/…, so the address stays clean.
 * - A prototype link (`archive.html`, `dashboard-editor.html?id=a1`) redirects to its route.
 * Production requests pass straight through.
 */
export async function proxy(request: NextRequest) {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.ICG_DESIGN_PREVIEW === "true"
  )
    return designPreview(request);
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64"),
    widget = ["/embed/events", "/embed/announcements"].includes(
      request.nextUrl.pathname,
    );
  const { url, publishableKey } = getPublicSupabaseEnv();
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' blob: data:",
    `connect-src 'self' ${new URL(url).origin}${process.env.NODE_ENV === "development" ? " ws: wss:" : ""}`,
    "frame-src https://www.youtube-nocookie.com https://player.vimeo.com 'self'",
    `frame-ancestors ${widget ? "*" : "'none'"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  const next = () => {
    const headers = new Headers(request.headers);
    headers.set("x-nonce", nonce);
    headers.set("Content-Security-Policy", csp);
    return NextResponse.next({ request: { headers } });
  };
  let response = next();
  if (
    request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"))
  ) {
    const client = createServerClient<Database>(url, publishableKey, {
      cookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (updates) => {
          updates.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = next();
          updates.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    await client.auth.getUser();
  }
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  if (!widget) response.headers.set("X-Frame-Options", "DENY");
  return response;
}

function designPreview(request: NextRequest) {
  // A request this proxy already rewrote to /preview/… comes back through here: let it through.
  if (request.headers.get(PREVIEW_HEADER)) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const last = pathname.slice(pathname.lastIndexOf("/") + 1);

  if (last.endsWith(".html")) {
    const query = new URLSearchParams(request.nextUrl.search);
    const route = routeForPrototype(last, query);
    if (!route && pathname.startsWith("/preview/")) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = route ?? `/preview/design/prototypes/${last}`;
    url.search = query.toString();
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/preview/")) return NextResponse.next();

  const match = matchPreviewRoute(pathname);
  if (!match) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/preview/design/prototypes/${match.file}`;
  url.searchParams.set("__preview_defaults", JSON.stringify(match.defaults));
  const headers = new Headers(request.headers);
  headers.set(PREVIEW_HEADER, "1");
  return NextResponse.rewrite(url, { request: { headers } });
}

const PREVIEW_HEADER = "x-design-preview";

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
