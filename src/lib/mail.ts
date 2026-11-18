import { z } from "zod";

export const deliverySchema = z.object({
  id: z.uuid(),
  lease_id: z.uuid(),
  kind: z.enum(["workflow", "contact_reply", "test"]),
  to_email: z.email(),
  payload: z.object({
    subject: z.string().optional(),
    body: z.string().optional(),
    signature: z.string().optional(),
    kind: z.string().optional(),
    title: z.string().optional(),
    article_id: z.uuid().nullable().optional(),
    review_id: z.uuid().nullable().optional(),
  }),
});
export type Delivery = z.infer<typeof deliverySchema>;
export type DeliveryOutcome = {
  providerId?: string;
  errorCode?: string;
  retryable: boolean;
};
export async function deliverBatch(
  input: unknown,
  send: (item: Delivery) => Promise<DeliveryOutcome>,
  finish: (id: string, lease: string, result: DeliveryOutcome) => Promise<void>,
): Promise<number> {
  const items = z.array(z.unknown()).parse(input);
  let sent = 0;
  for (const raw of items) {
    const parsed = deliverySchema.safeParse(raw);
    if (!parsed.success) {
      const identity = z
        .object({ id: z.uuid(), lease_id: z.uuid() })
        .parse(raw);
      await finish(identity.id, identity.lease_id, {
        errorCode: "invalid_delivery_payload",
        retryable: false,
      });
      continue;
    }
    const result = await send(parsed.data);
    await finish(parsed.data.id, parsed.data.lease_id, result);
    if (result.providerId) sent++;
  }
  return sent;
}
export type MailConfig = {
  origin: string;
  from: string;
  replyTo: string;
  apiKey: string;
};
function headerText(value: string): string {
  return value.replace(/[\r\n\u0000]/g, " ").slice(0, 240);
}
export function buildMail(
  input: unknown,
  origin: string,
  from: string,
  replyTo: string,
) {
  const item = deliverySchema.parse(input);
  let subject = "ICG desk update",
    text: string;
  if (item.kind === "contact_reply") {
    const reply = z
      .object({ subject: z.string(), body: z.string(), signature: z.string() })
      .parse(item.payload);
    subject = headerText(reply.subject);
    text = `${reply.body}\n\n${reply.signature}\nIntegrated Communications Group · PLP`;
  } else if (item.kind === "test") {
    subject = "ICG desk: email test";
    text =
      "You requested this test from ICG Site settings. Email delivery is connected.";
  } else {
    const kind = item.payload.kind ?? "update";
    const security: Record<string, string> = {
      password_changed: "Your ICG password changed",
      email_changed: "Your ICG sign-in address changed",
      sessions_revoked: "Your other ICG sessions were signed out",
    };
    subject = security[kind] ?? `ICG desk: ${kind.replaceAll("_", " ")}`;
    let path = "/dashboard/inbox";
    if (
      item.payload.review_id &&
      ["review_requested", "resubmitted"].includes(kind)
    )
      path = `/dashboard/reviews/${item.payload.review_id}`;
    else if (item.payload.article_id)
      path = `/dashboard/articles/${item.payload.article_id}/edit`;
    else if (kind === "contact_messages") path = "/dashboard/messages";
    else if (kind.startsWith("invite_")) path = "/dashboard/users";
    else if (security[kind]) path = "/dashboard/account";
    text = `${item.payload.title ?? subject}\n\nOpen the ICG desk: ${new URL(path, origin).href}`;
    if (security[kind])
      text +=
        "\n\nIf you did not make this change, contact the ICG desk and reset your password.";
  }
  return {
    from,
    to: [item.to_email],
    reply_to: replyTo,
    subject: headerText(subject),
    text,
  };
}
export async function sendResend(
  item: Delivery,
  config: MailConfig,
  transport: typeof fetch = fetch,
): Promise<{ providerId?: string; errorCode?: string; retryable: boolean }> {
  try {
    const response = await transport("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `icg-${item.id}`,
      },
      body: JSON.stringify(
        buildMail(item, config.origin, config.from, config.replyTo),
      ),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      return {
        errorCode: `provider_${response.status}`,
        retryable: response.status === 429 || response.status >= 500,
      };
    const result = z
      .object({ id: z.string().min(1).max(100) })
      .safeParse(await response.json());
    return result.success
      ? { providerId: result.data.id, retryable: false }
      : { errorCode: "invalid_provider_response", retryable: true };
  } catch {
    return { errorCode: "delivery_unconfirmed", retryable: true };
  }
}
