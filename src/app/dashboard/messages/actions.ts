"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { actionResult, checkDatabase, type ActionState } from "@/lib/actions";
export async function replyContact(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["admin"]);
  return actionResult(async () => {
    const client = await createSupabaseServerClient(true),
      id = z.uuid().parse(form.get("id"));
    checkDatabase(
      (
        await client.rpc("reply_contact", {
          p_id: id,
          p_version: z.coerce
            .number()
            .int()
            .positive()
            .parse(form.get("version")),
          p_body: z
            .string()
            .trim()
            .min(1, "Write your reply.")
            .max(10000)
            .parse(form.get("body")),
          p_key: z.uuid().parse(form.get("key")),
        })
      ).error,
    );
    revalidatePath("/dashboard/messages", "layout");
    return "Reply queued. Delivery status will update after the mail service accepts it.";
  });
}
export async function messageAction(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["admin"]);
  let deleted = false;
  const result = await actionResult(async () => {
    const client = await createSupabaseServerClient(true),
      id = z.uuid().parse(form.get("id")),
      operation = z
        .enum(["read", "close", "reopen", "mark_replied", "delete"])
        .parse(form.get("operation"));
    checkDatabase(
      (
        await client.rpc("manage_contact", {
          p_id: id,
          p_version: z.coerce
            .number()
            .int()
            .positive()
            .parse(form.get("version")),
          p_action: operation,
        })
      ).error,
    );
    deleted = operation === "delete";
    revalidatePath("/dashboard/messages", "layout");
    return "Message updated.";
  });
  if (result.ok && deleted) redirect("/dashboard/messages");
  return result;
}
export async function markMessageRead(id: string): Promise<void> {
  await requireProfile(["admin"]);
  const client = await createSupabaseServerClient(true);
  checkDatabase(
    (
      await client.rpc("manage_contact", {
        p_id: z.uuid().parse(id),
        p_version: 1,
        p_action: "read",
      })
    ).error,
  );
  revalidatePath("/dashboard/messages");
}
