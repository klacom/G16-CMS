"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  actionResult,
  ActionError,
  emailSchema,
  passwordSchema,
  type ActionState,
} from "@/lib/actions";
import { siteOrigin } from "@/lib/auth";
import { validRecoveryCookie } from "@/lib/recovery-cookie";

export async function login(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const result = await actionResult(async () => {
    const email = emailSchema.parse(form.get("email"));
    const password = z
      .string()
      .min(1, "Enter your password.")
      .max(128)
      .parse(form.get("password"));
    const client = await createSupabaseServerClient(true);
    const signed = await client.auth.signInWithPassword({ email, password });
    if (signed.error)
      throw new ActionError(
        "That email and password could not sign in. Check your details or reset your password.",
      );
    const profile = await client.rpc("current_profile").maybeSingle();
    if (profile.error || !profile.data) {
      await client.auth.signOut({ scope: "local" });
      throw new ActionError(
        "This account does not have active desk access. Ask an admin for help.",
      );
    }
  });
  if (result.ok) redirect("/dashboard");
  return result;
}
export async function logout(): Promise<void> {
  const client = await createSupabaseServerClient(true);
  await client.auth.signOut({ scope: "local" });
  redirect("/login");
}
export async function requestRecovery(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return actionResult(async () => {
    const email = emailSchema.parse(form.get("email"));
    const client = await createSupabaseServerClient(true);
    // Same visible response regardless of account existence or provider response.
    await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteOrigin()}/auth/confirm?next=/reset-password`,
    });
    return "If this address has an account, a password reset link will arrive shortly.";
  });
}
export async function resetPassword(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const result = await actionResult(async () => {
    const password = passwordSchema.parse(form.get("password"));
    if (password !== form.get("confirm"))
      throw new ActionError("The passwords do not match.");
    const client = await createSupabaseServerClient(true);
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user)
      throw new ActionError("Open a current password reset link first.");
    // Recovery context is set only by the verified recovery callback, never a form flag.
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    if (!validRecoveryCookie(cookieStore.get("icg-recovery")?.value, user.id))
      throw new ActionError("Request a new password reset link.");
    const updated = await client.auth.updateUser({ password });
    if (updated.error)
      throw new ActionError(
        "The new password could not be set. Request a fresh link and try again.",
      );
    cookieStore.delete("icg-recovery");
    await client.auth.signOut({ scope: "global" });
    return "Password changed. Sign in with your new password.";
  });
  return result;
}
