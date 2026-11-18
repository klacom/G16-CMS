import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "./database.types";

// Import only from Auth administration, trusted workers and bootstrap tooling.
export function createSupabaseAdminClient() {
  const { url } = getPublicSupabaseEnv();
  const key = process.env.ICG_SUPABASE_SECRET_KEY;
  if (!key)
    throw new Error(
      "ICG_SUPABASE_SECRET_KEY must be configured on the server.",
    );
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
