import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Only the Next.js request cookie context is replaced. Supabase HTTP is real.
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => { throw new Error("Unexpected cookie write in read-only fixture test."); } }),
}));

import { createSupabaseBrowserClient } from "../../src/lib/supabase/browser";
import { createSupabaseServerClient } from "../../src/lib/supabase/server";
import { getPublicSupabaseEnv } from "../../src/lib/env";

const { url, publishableKey } = getPublicSupabaseEnv();
const secretKey = process.env.ICG_LOCAL_TEST_SECRET;
if (url !== "http://127.0.0.1:55321" || !secretKey) throw new Error("Local fixture target is required.");
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const admin = createClient(url, secretKey, options);
let fixtureId: string | undefined;
let accessToken: string;

beforeAll(async () => {
  const email = `foundation-${randomUUID()}@icg.invalid`;
  const password = randomUUID();
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw new Error("Local synthetic user provisioning failed.");
  fixtureId = created.data.user.id;
  const sessionClient = createClient(url, publishableKey, options);
  const signedIn = await sessionClient.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) throw new Error("Local synthetic user sign-in failed.");
  accessToken = signedIn.data.session.access_token;
});

afterAll(async () => {
  if (!fixtureId) return;
  const deleted = await admin.auth.admin.deleteUser(fixtureId);
  if (deleted.error) throw new Error("Local synthetic user cleanup failed.");
});

test("the browser factory reads the synthetic user through the local Auth API", async () => {
  const result = await createSupabaseBrowserClient().auth.getUser(accessToken);
  expect(result.error).toBeNull();
  expect(result.data.user?.id).toBe(fixtureId);
});

test("the server factory reads the same synthetic user with a publishable key", async () => {
  const client = await createSupabaseServerClient();
  const result = await client.auth.getUser(accessToken);
  expect(result.error).toBeNull();
  expect(result.data.user?.id).toBe(fixtureId);
});

test("an invalid token cannot read the synthetic user", async () => {
  const client = await createSupabaseServerClient();
  const result = await client.auth.getUser("not-a-valid-token");
  expect(result.error).not.toBeNull();
  expect(result.data.user).toBeNull();
});
