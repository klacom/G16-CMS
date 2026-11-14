import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "@/lib/env";

// Session refresh/proxy is introduced in T07. Operations that write cookies
// must run in a Server Action or Route Handler; write failures are not swallowed.
export async function createSupabaseServerClient() {
  const { url, publishableKey } = getPublicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (updates) => {
        for (const { name, value, options } of updates) cookieStore.set(name, value, options);
      },
    },
  });
}
