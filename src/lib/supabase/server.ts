import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "./database.types";

// Session refresh/proxy is introduced in T07. Operations that write cookies
// must run in a Server Action or Route Handler; write failures are not swallowed.
export async function createSupabaseServerClient(writeCookies = false) {
  const { url, publishableKey } = getPublicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && url.startsWith("https:"),
    },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (updates) => {
        // Read-only renders rely on the proxy to refresh before rendering.
        if (!writeCookies) return;
        for (const { name, value, options } of updates)
          cookieStore.set(name, value, options);
      },
    },
  });
}
