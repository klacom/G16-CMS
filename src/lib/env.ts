type PublicSupabaseInput = {
  url: string | undefined;
  publishableKey: string | undefined;
};

export function getPublicSupabaseEnv(
  input: PublicSupabaseInput = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
) {
  let url: URL;
  try {
    url = new URL(input.url ?? "");
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase API URL.",
    );
  }

  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must use HTTPS (HTTP is allowed on loopback only), without credentials, query, or fragment.",
    );
  }

  if (
    !input.publishableKey ||
    !/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(input.publishableKey)
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must contain a publishable key; secret and legacy JWT keys are not accepted.",
    );
  }

  return {
    url: url.toString().replace(/\/$/, ""),
    publishableKey: input.publishableKey,
  };
}
