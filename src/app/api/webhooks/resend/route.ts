import { Webhook } from "svix";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
async function limitedText(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("No body");
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > 65536) {
      await reader.cancel();
      throw new Error("Payload too large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret)
    return Response.json(
      { error: "Webhook is not configured." },
      { status: 503 },
    );
  let event: unknown;
  const id = request.headers.get("svix-id") ?? "";
  try {
    const body = await limitedText(request);
    new Webhook(secret).verify(body, {
      "svix-id": id,
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    });
    // Svix verifies the original bytes; its current API does not parse JSON.
    event = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid webhook." }, { status: 400 });
  }
  const parsed = z
    .object({
      type: z.string(),
      created_at: z.iso.datetime({ offset: true }),
      data: z.object({ email_id: z.string().min(1).max(100) }),
    })
    .safeParse(event);
  if (!parsed.success)
    return Response.json({ error: "Invalid event." }, { status: 422 });
  const kinds: Record<string, string> = {
    "email.delivered": "delivered",
    "email.bounced": "bounced",
    "email.failed": "failed",
    "email.complained": "failed",
  };
  const kind = kinds[parsed.data.type];
  if (!kind) return Response.json({ received: true });
  const result = await createSupabaseAdminClient().rpc(
    "record_delivery_event",
    {
      p_id: id,
      p_provider: parsed.data.data.email_id,
      p_kind: kind,
      p_time: parsed.data.created_at,
    },
  );
  if (result.error)
    return Response.json(
      { error: "Event could not be stored." },
      { status: 503 },
    );
  return Response.json(
    { received: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
