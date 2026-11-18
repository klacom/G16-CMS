/**
 * Design preview (development only): which app route shows which HTML prototype
 * from design/prototypes/. `npm run dev` serves the prototype at the route until
 * the real page is built; production builds keep the route's own page.
 *
 * When a route is built for real, remove its entry here.
 */

type PreviewRoute = {
  /** Matches the app route; a capture group fills `param`. */
  pattern: RegExp;
  /** File in design/prototypes/. */
  file: string;
  /** Query parameter the prototype reads the captured path segment from. */
  param?: string;
  /** Query parameters the prototype needs on this route. */
  fixed?: Record<string, string>;
};

export const PREVIEW_ROUTES: PreviewRoute[] = [
  { pattern: /^\/$/, file: "home.html" },
  { pattern: /^\/news\/([^/]+)$/, file: "article.html", param: "id" },
  { pattern: /^\/archive$/, file: "archive.html" },
  { pattern: /^\/calendar$/, file: "calendar.html" },
  { pattern: /^\/about$/, file: "about.html" },
  { pattern: /^\/contact$/, file: "contact.html" },
  { pattern: /^\/login$/, file: "login-identity.html" },
  {
    pattern: /^\/forgot-password$/,
    file: "login-identity.html",
    fixed: { step: "reset" },
  },
  { pattern: /^\/reset-password$/, file: "reset-password.html" },
  { pattern: /^\/auth\/invite$/, file: "accept-invite.html" },
  { pattern: /^\/dashboard$/, file: "dashboard.html" },
  { pattern: /^\/dashboard\/inbox$/, file: "dashboard-inbox.html" },
  { pattern: /^\/dashboard\/account$/, file: "dashboard-account.html" },
  { pattern: /^\/dashboard\/users$/, file: "dashboard-users.html" },
  { pattern: /^\/dashboard\/messages$/, file: "dashboard-messages.html" },
  { pattern: /^\/dashboard\/audit$/, file: "dashboard-audit.html" },
  { pattern: /^\/dashboard\/settings$/, file: "dashboard-settings.html" },
  {
    pattern: /^\/dashboard\/messages\/([^/]+)$/,
    file: "dashboard-messages.html",
    param: "id",
  },
  { pattern: /^\/dashboard\/articles$/, file: "dashboard-articles.html" },
  {
    pattern: /^\/dashboard\/articles\/([^/]+)\/edit$/,
    file: "dashboard-editor.html",
    param: "id",
  },
  { pattern: /^\/dashboard\/reviews$/, file: "dashboard-reviews.html" },
  {
    pattern: /^\/dashboard\/reviews\/([^/]+)$/,
    file: "dashboard-reviews.html",
    param: "id",
  },
];

/** The prototype for an app route, with the query defaults it needs. */
export function matchPreviewRoute(
  pathname: string,
): { file: string; defaults: Record<string, string> } | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  for (const route of PREVIEW_ROUTES) {
    const m = route.pattern.exec(path);
    if (!m) continue;
    const defaults = { ...route.fixed };
    if (route.param && m[1]) defaults[route.param] = decodeURIComponent(m[1]);
    return { file: route.file, defaults };
  }
  return null;
}

/**
 * The app route for a prototype link such as `dashboard-editor.html?id=a1`.
 * Moves path parameters out of `query` (mutated). Null when the prototype has no route
 * (concept pages such as review-a.html), which are then served as files.
 */
export function routeForPrototype(
  file: string,
  query: URLSearchParams,
): string | null {
  const take = (...keys: string[]) => {
    for (const k of keys) {
      const v = query.get(k);
      if (v) {
        keys.forEach((key) => query.delete(key));
        return v;
      }
    }
    return null;
  };
  switch (file) {
    case "index.html":
    case "home.html":
      return "/";
    case "article.html": {
      const id = take("id");
      return id ? `/news/${encodeURIComponent(id)}` : null;
    }
    case "login-identity.html":
      if (query.get("step") === "reset") {
        query.delete("step");
        return "/forgot-password";
      }
      return "/login";
    case "accept-invite.html":
      return "/auth/invite";
    case "dashboard.html":
      return "/dashboard";
    case "dashboard-inbox.html":
      return "/dashboard/inbox";
    case "dashboard-account.html":
      return "/dashboard/account";
    case "dashboard-users.html":
      return "/dashboard/users";
    case "dashboard-audit.html":
      return "/dashboard/audit";
    case "dashboard-settings.html":
      return "/dashboard/settings";
    case "dashboard-messages.html": {
      const id = take("id");
      return id
        ? `/dashboard/messages/${encodeURIComponent(id)}`
        : "/dashboard/messages";
    }
    case "dashboard-articles.html":
      return "/dashboard/articles";
    case "dashboard-editor.html":
      return `/dashboard/articles/${encodeURIComponent(take("id") ?? "a2")}/edit`;
    case "dashboard-reviews.html": {
      const id = take("id", "open");
      return id
        ? `/dashboard/reviews/${encodeURIComponent(id)}`
        : "/dashboard/reviews";
    }
    default: {
      const simple: Record<string, string> = {
        "archive.html": "/archive",
        "calendar.html": "/calendar",
        "about.html": "/about",
        "contact.html": "/contact",
        "reset-password.html": "/reset-password",
      };
      return simple[file] ?? null;
    }
  }
}
