"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { actionResult, checkDatabase, type ActionState } from "@/lib/actions";
export async function readNotice(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile();
  return actionResult(async () => {
    const client = await createSupabaseServerClient(true),
      id = z
        .uuid()
        .nullable()
        .parse(form.get("id") || null);
    checkDatabase(
      (await client.rpc("read_notification", id ? { p_id: id } : {})).error,
    );
    revalidatePath("/dashboard", "layout");
    return "Inbox updated. The underlying tasks remain in their queues.";
  });
}
