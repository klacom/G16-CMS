import { describe, expect, it } from "vitest";
import { getPublicSupabaseEnv } from "../../src/lib/env";

const publishableKey = "sb_publishable_abcdefghijklmnop";

describe("public Supabase configuration", () => {
  it("accepts a local URL and a publishable key", () => {
    expect(getPublicSupabaseEnv({ url: "http://127.0.0.1:54321/", publishableKey }))
      .toEqual({ url: "http://127.0.0.1:54321", publishableKey });
  });

  it("accepts hosted HTTPS configuration", () => {
    expect(getPublicSupabaseEnv({ url: "https://example.supabase.co", publishableKey }).url)
      .toBe("https://example.supabase.co");
  });

  it.each([undefined, "", "replace_with_local_publishable_key", "sb_secret_do_not_expose", "eyJhbGciOiJIUzI1NiJ9.secret"])(
    "rejects missing, placeholder, or privileged keys without echoing their value", (key) => {
      expect(() => getPublicSupabaseEnv({ url: "http://localhost:54321", publishableKey: key }))
        .toThrow("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
      try {
        getPublicSupabaseEnv({ url: "http://localhost:54321", publishableKey: key });
      } catch (error) {
        if (key) expect((error as Error).message).not.toContain(key);
      }
    },
  );

  it.each([undefined, "", "not a URL", "http://example.com", "https://user:password@example.com", "https://example.com?secret=x", "https://example.com#fragment"])(
    "rejects missing or unsafe API URLs", (url) => {
      expect(() => getPublicSupabaseEnv({ url, publishableKey })).toThrow("NEXT_PUBLIC_SUPABASE_URL");
    },
  );
});
