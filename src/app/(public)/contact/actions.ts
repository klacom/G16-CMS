"use server";
import { z } from "zod";
import { publicClient } from "@/lib/data";
import {
  actionResult,
  checkDatabase,
  emailSchema,
  type ActionState,
} from "@/lib/actions";
import { jsonValue } from "@/lib/records";
import { fromManilaInput } from "@/lib/dates";
export async function submitContact(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  return actionResult(async () => {
    if (String(form.get("company") ?? "").trim())
      return "Your message has been received.";
    const fields = z
      .object({
        topic: z.enum([
          "question",
          "account",
          "event",
          "correction",
          "photo",
          "partner",
        ]),
        first_name: z.string().trim().min(1, "Enter your first name.").max(80),
        last_name: z.string().trim().min(1, "Enter your last name.").max(80),
        email: emailSchema,
        phone: z.string().max(40),
        subject: z.string().trim().min(1, "Add a subject.").max(200),
        body: z.string().trim().min(1, "Write your message.").max(10000),
      })
      .parse(
        Object.fromEntries(
          [
            "topic",
            "first_name",
            "last_name",
            "email",
            "phone",
            "subject",
            "body",
          ].map((key) => [key, form.get(key) ?? ""]),
        ),
      );
    const event =
      fields.topic === "event"
        ? z
            .object({
              event_title: z
                .string()
                .trim()
                .min(1, "Add the event name.")
                .max(240),
              event_place: z.string().trim().min(1, "Add the venue.").max(240),
              event_starts_at: z
                .string()
                .min(1, "Add the event date and time."),
            })
            .parse({
              event_title: form.get("event_title"),
              event_place: form.get("event_place"),
              event_starts_at: fromManilaInput(
                String(form.get("event_starts_at") ?? ""),
              ),
            })
        : {};
    const article = z
        .uuid()
        .nullable()
        .parse(form.get("article_id") || null),
      key = z.uuid().parse(form.get("request_key"));
    const result = await publicClient().rpc("submit_contact", {
      p_key: key,
      p_data: jsonValue({
        ...fields,
        ...event,
        ...(article ? { article_id: article } : {}),
      }),
    });
    checkDatabase(result.error);
    return "Your message has been received. The ICG desk will review it.";
  });
}
