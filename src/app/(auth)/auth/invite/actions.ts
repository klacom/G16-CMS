"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  actionResult,
  passwordSchema,
  checkDatabase,
  ActionError,
  type ActionState,
} from "@/lib/actions";
export async function acceptInvitation(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const result = await actionResult(async () => {
    const id = z.uuid().parse(form.get("invitation"));
    const name = z
      .string()
      .trim()
      .min(3, "Use at least three characters.")
      .max(120)
      .parse(form.get("full_name"));
    const password = passwordSchema.parse(form.get("password"));
    if (password !== form.get("confirm"))
      throw new ActionError("The passwords do not match.");
    const client = await createSupabaseServerClient(true);
    const details = await client
      .rpc("invitation_details", { p_id: id })
      .maybeSingle();
    checkDatabase(details.error);
    if (!details.data)
      throw new ActionError(
        "This invitation has expired or was replaced. Ask an admin to resend it.",
      );
    const updated = await client.auth.updateUser({ password });
    if (updated.error)
      throw new ActionError(
        "The password could not be set. Request a fresh invitation.",
      );
    checkDatabase(
      (await client.rpc("accept_invitation", { p_id: id, p_name: name })).error,
    );
  });
  if (result.ok) redirect("/dashboard");
  return result;
}
