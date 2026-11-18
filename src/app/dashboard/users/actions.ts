"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile, siteOrigin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  actionResult,
  checkDatabase,
  ActionError,
  emailSchema,
  type ActionState,
} from "@/lib/actions";

export async function invitePerson(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["admin"]);
  return actionResult(async () => {
    const email = emailSchema.parse(form.get("email")).toLowerCase();
    const role = z
      .enum(["writer", "reviewer", "admin"])
      .parse(form.get("role"));
    const name = z
      .string()
      .trim()
      .max(120)
      .parse(form.get("full_name") ?? "");
    const affiliation = z
      .string()
      .trim()
      .max(160)
      .parse(form.get("affiliation") ?? "");
    const client = await createSupabaseServerClient(true);
    const created = await client.rpc("create_invitation", {
      p_email: email,
      p_role: role,
      p_name: name,
      p_affiliation: affiliation,
    });
    checkDatabase(created.error);
    if (!created.data)
      throw new ActionError("The invitation could not be created.");
    const next = `/auth/invite?invitation=${created.data}`;
    const admin = createSupabaseAdminClient();
    const redirectTo = `${siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`;
    const result = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });
    // Auth confirms the identity when its first link opens, before the person
    // accepts desk membership. Native invitations cannot resend to that identity;
    // a recovery link establishes a fresh session for the replacement invitation.
    // create_invitation has already rejected addresses with a desk profile.
    const delivery =
      result.error?.code === "email_exists"
        ? await admin.auth.resetPasswordForEmail(email, { redirectTo })
        : result;
    if (delivery.error) {
      await admin
        .from("invitations")
        .update({ delivery_error: true })
        .eq("id", created.data);
      revalidatePath("/dashboard/users");
      throw new ActionError(
        "The invitation was recorded, but its email could not be sent. Check mail setup and resend it.",
      );
    }
    revalidatePath("/dashboard/users");
    return "Invitation sent. The link expires in 24 hours.";
  });
}
export async function withdrawInvite(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["admin"]);
  return actionResult(async () => {
    const id = z.uuid().parse(form.get("id"));
    const client = await createSupabaseServerClient(true);
    checkDatabase(
      (await client.rpc("withdraw_invitation", { p_id: id })).error,
    );
    revalidatePath("/dashboard/users");
  });
}
export async function managePerson(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["admin"]);
  return actionResult(async () => {
    const id = z.uuid().parse(form.get("id"));
    const role = z
      .enum(["writer", "reviewer", "admin"])
      .parse(form.get("role"));
    const affiliation = z
      .string()
      .trim()
      .max(160)
      .parse(form.get("affiliation") ?? "");
    const client = await createSupabaseServerClient(true);
    checkDatabase(
      (
        await client.rpc("manage_person", {
          p_id: id,
          p_patch: {
            role,
            affiliation,
            deactivated: form.get("deactivated") === "on",
          },
        })
      ).error,
    );
    revalidatePath("/dashboard", "layout");
    return "Account access updated. Articles and history are preserved.";
  });
}
export async function changePersonEmail(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["admin"]);
  return actionResult(async () => {
    const id = z.uuid().parse(form.get("id")),
      email = emailSchema.parse(form.get("email")).toLowerCase();
    const client = await createSupabaseServerClient(true);
    checkDatabase(
      (
        await client.rpc("authorize_email_change", {
          p_user: id,
          p_email: email,
        })
      ).error,
    );
    const changed = await createSupabaseAdminClient().auth.admin.updateUserById(
      id,
      { email },
    );
    if (changed.error)
      throw new ActionError(
        "The sign-in address could not be changed. It may already belong to an account.",
      );
    revalidatePath("/dashboard/users");
    return "Email changed. The person must sign in again.";
  });
}
