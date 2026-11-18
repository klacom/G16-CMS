"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { actionResult, checkDatabase, type ActionState } from "@/lib/actions";
export async function decideReview(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["reviewer"]);
  return actionResult(async () => {
    const id = z.uuid().parse(form.get("id"));
    const action = z
      .enum(["accept", "decline", "step_down", "approve", "changes"])
      .parse(form.get("operation"));
    const note = z
      .string()
      .max(4000)
      .parse(form.get("note") ?? "");
    const requests = z
      .array(z.string().min(1).max(1000))
      .max(30)
      .parse(
        String(form.get("requests") ?? "")
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
      );
    const client = await createSupabaseServerClient(true);
    checkDatabase(
      (
        await client.rpc("review_action", {
          p_id: id,
          p_action: action,
          p_note: note,
          p_requests: requests,
        })
      ).error,
    );
    revalidatePath("/dashboard", "layout");
    return action === "approve"
      ? "Approved. The author can now publish or schedule this revision."
      : "Review updated.";
  });
}
