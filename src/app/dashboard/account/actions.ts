"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import {
  actionResult,
  checkDatabase,
  passwordSchema,
  ActionError,
  type ActionState,
} from "@/lib/actions";
import { z } from "zod";
import { preferenceKinds } from "@/lib/preferences";

export async function saveProfile(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile();
  return actionResult(async () => {
    const client = await createSupabaseServerClient(true);
    const name = z
      .string()
      .trim()
      .min(3, "Use at least three characters.")
      .max(120)
      .parse(form.get("full_name"));
    checkDatabase((await client.rpc("save_profile", { p_name: name })).error);
    revalidatePath("/dashboard", "layout");
  });
}
export async function changePassword(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();
  return actionResult(async () => {
    const password = passwordSchema.parse(form.get("password"));
    if (password !== form.get("confirm"))
      throw new ActionError("The passwords do not match.");
    const current = z
      .string()
      .min(1, "Enter your current password.")
      .max(128)
      .parse(form.get("current_password"));
    const client = await createSupabaseServerClient(true);
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user?.email) throw new ActionError("Sign in again.");
    const verified = await client.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (verified.error)
      throw new ActionError("That is not your current password.");
    const changed = await client.auth.updateUser({ password });
    if (changed.error)
      throw new ActionError(
        "The new password could not be set. Try a different password.",
      );
    if (form.get("signout_others") === "on") {
      const ended = await client.auth.signOut({ scope: "others" });
      if (ended.error)
        throw new ActionError(
          "Password changed, but other sessions could not be signed out. Retry from the sessions section.",
        );
      checkDatabase(
        (
          await createSupabaseAdminClient().rpc("auth_event", {
            p_user: profile.id,
            p_action: "sessions_revoked",
          })
        ).error,
      );
    }
    return "Password changed.";
  });
}
export async function endOtherSessions(): Promise<ActionState> {
  const profile = await requireProfile();
  return actionResult(async () => {
    const client = await createSupabaseServerClient(true);
    const result = await client.auth.signOut({ scope: "others" });
    if (result.error)
      throw new ActionError(
        "Other sessions could not be signed out. Try again.",
      );
    checkDatabase(
      (
        await createSupabaseAdminClient().rpc("auth_event", {
          p_user: profile.id,
          p_action: "sessions_revoked",
        })
      ).error,
    );
    return "Other sessions signed out.";
  });
}
export async function savePreferences(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();
  return actionResult(async () => {
    const allowed = preferenceKinds(
      profile.role as "writer" | "reviewer" | "admin",
    );
    const client = await createSupabaseServerClient(true);
    checkDatabase(
      (
        await client.rpc("save_preferences", {
          p_preferences: Object.fromEntries(
            allowed.map((kind) => [kind, form.get(kind) === "on"]),
          ),
        })
      ).error,
    );
    return "Email preferences saved. Security notices are always sent.";
  });
}

export async function removePhoto(): Promise<ActionState> {
  await requireProfile();
  return actionResult(async () => {
    const client = await createSupabaseServerClient(true);
    checkDatabase((await client.rpc("remove_avatar")).error);
    revalidatePath("/dashboard/account");
    return "Desk photo removed.";
  });
}
