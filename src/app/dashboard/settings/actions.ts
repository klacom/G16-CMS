"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  actionResult,
  checkDatabase,
  ActionError,
  type ActionState,
} from "@/lib/actions";
import { contentSchema } from "@/lib/content";
import { jsonValue } from "@/lib/records";
import { mailConfigured } from "@/lib/mail-worker";
export async function saveSettings(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["admin"]);
  return actionResult(async () => {
    const keys = [
      "office_address",
      "office_hours",
      "office_hours_note",
      "contact_email",
      "events_email",
      "phone",
      "facebook_url",
      "instagram_url",
      "youtube_url",
      "tiktok_url",
    ];
    const details: Record<string, string | number> = Object.fromEntries(
      keys.map((key) => [
        key,
        z
          .string()
          .trim()
          .max(1000)
          .parse(form.get(key) ?? ""),
      ]),
    );
    for (const key of ["contact_email", "events_email"])
      if (details[key])
        z.email("Enter a valid contact email.").parse(details[key]);
    details.reply_within_school_days = z.coerce
      .number()
      .refine(
        (value) => [1, 2, 3, 5].includes(value),
        "Choose a listed reply target.",
      )
      .parse(form.get("reply_within_school_days"));
    const client = await createSupabaseServerClient(true);
    checkDatabase(
      (
        await client.rpc("save_site_settings", {
          p_details: jsonValue(details),
        })
      ).error,
    );
    revalidatePath("/", "layout");
    return "Public contact details saved.";
  });
}
export async function saveCategory(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["admin"]);
  return actionResult(async () => {
    const id = z
        .uuid()
        .nullable()
        .parse(form.get("id") || null),
      name = z.string().trim().min(1).max(80).parse(form.get("name")),
      operation = z
        .enum(["save", "archive", "restore", "delete"])
        .parse(form.get("operation") ?? "save");
    const client = await createSupabaseServerClient(true);
    checkDatabase(
      (
        await client.rpc("save_category", {
          p_name: name,
          p_action: operation,
          ...(id ? { p_id: id } : {}),
        })
      ).error,
    );
    revalidatePath("/", "layout");
  });
}
export async function saveTag(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["admin"]);
  return actionResult(async () => {
    const client = await createSupabaseServerClient(true);
    checkDatabase(
      (
        await client.rpc("save_tag", {
          p_name: z.string().trim().min(1).max(48).parse(form.get("name")),
          p_action: z
            .enum(["save", "archive", "restore", "delete"])
            .parse(form.get("operation") ?? "save"),
        })
      ).error,
    );
    revalidatePath("/dashboard/settings");
  });
}
export async function saveAbout(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["admin"]);
  return actionResult(async () => {
    const body = contentSchema.parse(
        JSON.parse(z.string().max(100000).parse(form.get("body"))),
      ),
      client = await createSupabaseServerClient(true);
    checkDatabase(
      (
        await client.rpc("save_about", {
          p_key: z
            .string()
            .regex(/^[a-z][a-z0-9-]{1,60}$/)
            .parse(form.get("key")),
          p_heading: z.string().trim().max(160).parse(form.get("heading")),
          p_body: jsonValue(body),
          p_position: z.coerce
            .number()
            .int()
            .min(0)
            .max(9999)
            .parse(form.get("position")),
        })
      ).error,
    );
    revalidatePath("/about");
    revalidatePath("/dashboard/settings");
    return "About section saved. Empty sections stay hidden.";
  });
}
export async function setFeatured(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireProfile(["admin"]);
  return actionResult(async () => {
    const id = z
        .uuid()
        .nullable()
        .parse(form.get("article") || null),
      client = await createSupabaseServerClient(true);
    checkDatabase(
      (
        await client.rpc("set_featured", {
          p_position: z.coerce
            .number()
            .int()
            .min(1)
            .max(3)
            .parse(form.get("position")),
          ...(id ? { p_article: id } : {}),
        })
      ).error,
    );
    revalidatePath("/");
    revalidatePath("/dashboard/settings");
  });
}
export async function testMail(): Promise<ActionState> {
  await requireProfile(["admin"]);
  return actionResult(async () => {
    if (!mailConfigured())
      throw new ActionError(
        "Configure the verified sender and mail service before sending a test.",
      );
    const client = await createSupabaseServerClient(true);
    checkDatabase((await client.rpc("queue_test_email")).error);
    return "Test queued to your sign-in address. Check delivery status after the worker runs.";
  });
}
