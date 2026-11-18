"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { actionResult, checkDatabase, type ActionState } from "@/lib/actions";
import { articlePatchSchema, jsonValue } from "@/lib/records";
import { fromManilaInput } from "@/lib/dates";

export async function createArticle(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["writer", "admin"]);
  let id: string | null = null;
  const result = await actionResult(async () => {
    const client = await createSupabaseServerClient(true);
    const title = z.string().trim().min(1).max(240).parse(form.get("title"));
    const type = z
      .enum(["news", "event", "announcement"])
      .parse(form.get("type"));
    const created = await client.rpc("create_article", {
      p_title: title,
      p_type: type,
    });
    checkDatabase(created.error);
    id = created.data;
  });
  if (result.ok && id) redirect(`/dashboard/articles/${id}/edit`);
  return result;
}
export type SaveResult = ActionState & {
  revisionId?: string;
  version?: number;
};
export async function saveArticle(input: unknown): Promise<SaveResult> {
  await requireProfile(["writer", "admin"]);
  let saved: { revision_id: string; version: number } | undefined;
  const result = await actionResult(async () => {
    const parsed = z
      .object({
        id: z.uuid(),
        revision: z.uuid(),
        version: z.number().int().positive(),
        patch: articlePatchSchema,
      })
      .parse(input);
    const client = await createSupabaseServerClient(true);
    const response = await client.rpc("save_article", {
      p_id: parsed.id,
      p_revision: parsed.revision,
      p_version: parsed.version,
      p_patch: jsonValue(parsed.patch),
    });
    checkDatabase(response.error);
    saved = z
      .object({ revision_id: z.uuid(), version: z.number().int().positive() })
      .parse(response.data);
    revalidatePath("/dashboard/articles");
    return "Saved to the desk.";
  });
  return {
    ...result,
    ...(saved ? { revisionId: saved.revision_id, version: saved.version } : {}),
  };
}
export async function submitArticle(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["writer", "admin"]);
  return actionResult(async () => {
    const client = await createSupabaseServerClient(true);
    const id = z.uuid().parse(form.get("id")),
      revision = z.uuid().parse(form.get("revision"));
    const version = z.coerce
      .number()
      .int()
      .positive()
      .parse(form.get("version"));
    const reviewer = z.uuid("Choose a reviewer.").parse(form.get("reviewer"));
    const deadline = fromManilaInput(String(form.get("deadline") ?? ""));
    const note = z
      .string()
      .max(2000)
      .parse(form.get("note") ?? "");
    checkDatabase(
      (
        await client.rpc("submit_article", {
          p_id: id,
          p_revision: revision,
          p_version: version,
          p_reviewer: reviewer,
          ...(deadline ? { p_deadline: deadline } : {}),
          p_note: note,
        })
      ).error,
    );
    revalidatePath(`/dashboard/articles/${id}/edit`);
    revalidatePath("/dashboard");
    return "Sent for review.";
  });
}
export async function publishArticle(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["writer", "admin"]);
  return actionResult(async () => {
    const client = await createSupabaseServerClient(true);
    const id = z.uuid().parse(form.get("id")),
      revision = z.uuid().parse(form.get("revision"));
    const schedule = fromManilaInput(String(form.get("schedule") ?? ""));
    checkDatabase(
      (
        await client.rpc("publish_article", {
          p_id: id,
          p_revision: revision,
          ...(schedule ? { p_schedule: schedule } : {}),
        })
      ).error,
    );
    revalidatePath("/dashboard", "layout");
    revalidatePath("/", "layout");
    return schedule
      ? "Publication scheduled."
      : "The approved revision is now published.";
  });
}
export async function publicationAction(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["writer", "admin"]);
  return actionResult(async () => {
    const id = z.uuid().parse(form.get("id")),
      revision = z.uuid().parse(form.get("revision"));
    const action = z
      .enum([
        "archive",
        "restore",
        "withdraw",
        "restore_withdrawn",
        "delete",
        "cancel_schedule",
      ])
      .parse(form.get("operation"));
    const client = await createSupabaseServerClient(true);
    checkDatabase(
      (
        await client.rpc("change_publication", {
          p_id: id,
          p_revision: revision,
          p_action: action,
        })
      ).error,
    );
    revalidatePath("/dashboard", "layout");
    revalidatePath("/", "layout");
    return "Article state updated.";
  });
}
export async function resolveRequest(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["writer", "admin"]);
  return actionResult(async () => {
    const id = z.uuid().parse(form.get("request"));
    const client = await createSupabaseServerClient(true);
    checkDatabase(
      (
        await client.rpc("resolve_request", {
          p_id: id,
          p_resolved: form.get("resolved") === "true",
          p_note: z
            .string()
            .max(1000)
            .parse(form.get("fix_note") ?? ""),
        })
      ).error,
    );
    revalidatePath("/dashboard/articles", "layout");
  });
}
export async function addComment(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile();
  return actionResult(async () => {
    const client = await createSupabaseServerClient(true);
    checkDatabase(
      (
        await client.rpc("add_comment", {
          p_article: z.uuid().parse(form.get("article")),
          p_key: z.uuid().parse(form.get("key")),
          p_body: z.string().trim().min(1).max(4000).parse(form.get("body")),
        })
      ).error,
    );
    revalidatePath("/dashboard", "layout");
    return "Comment added.";
  });
}
