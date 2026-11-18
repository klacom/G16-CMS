import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import type { Tables } from "./supabase/database.types";

export type Profile = Tables<"profiles">;
export type Role = "writer" | "reviewer" | "admin";
export const currentProfile = cache(async (): Promise<Profile | null> => {
  const client = await createSupabaseServerClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data, error } = await client.rpc("current_profile").maybeSingle();
  if (error) throw new Error("Unable to verify desk access.");
  return data;
});
export async function requireProfile(
  roles: Role[] = ["writer", "reviewer", "admin"],
): Promise<Profile> {
  const profile = await currentProfile();
  if (!profile) redirect("/login");
  if (!roles.includes(profile.role as Role)) redirect("/dashboard");
  return profile;
}
export function siteOrigin(): string {
  const url = new URL(process.env.ICG_SITE_URL ?? "http://127.0.0.1:3000");
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("ICG_SITE_URL must be a site origin.");
  if (
    url.protocol !== "https:" &&
    !["127.0.0.1", "localhost"].includes(url.hostname)
  )
    throw new Error("ICG_SITE_URL requires HTTPS outside localhost.");
  return url.origin;
}
export function safeReturnPath(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 || character === "\\";
    })
  )
    return "/dashboard";
  return value;
}
