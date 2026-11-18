import "server-only";
import { timingSafeEqual } from "node:crypto";
import { createSupabaseAdminClient } from "./supabase/admin";
import { deliverBatch, sendResend } from "./mail";
import { siteOrigin } from "./auth";

export function validWorkerAuthorization(header: string | null): boolean {
  const expected = process.env.ICG_WORKER_SECRET;
  if (!expected || expected.length < 32 || !header?.startsWith("Bearer "))
    return false;
  const left = Buffer.from(expected),
    right = Buffer.from(header.slice(7));
  return left.length === right.length && timingSafeEqual(left, right);
}
export function mailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY &&
    process.env.ICG_MAIL_FROM &&
    process.env.ICG_MAIL_REPLY_TO,
  );
}
export async function deliverQueuedMail(): Promise<number> {
  if (!mailConfigured()) throw new Error("Mail is not configured.");
  const client = createSupabaseAdminClient();
  const claimed = await client.rpc("claim_deliveries", { p_limit: 5 });
  if (claimed.error) throw new Error("Could not claim email work.");
  return deliverBatch(
    claimed.data,
    (item) =>
      sendResend(item, {
        origin: siteOrigin(),
        from: process.env.ICG_MAIL_FROM!,
        replyTo: process.env.ICG_MAIL_REPLY_TO!,
        apiKey: process.env.RESEND_API_KEY!,
      }),
    async (id, lease, result) => {
      const finished = await client.rpc("finish_delivery", {
        p_id: id,
        p_lease: lease,
        ...(result.providerId ? { p_provider: result.providerId } : {}),
        ...(result.errorCode ? { p_error: result.errorCode } : {}),
        p_retryable: result.retryable,
      });
      if (finished.error) throw new Error("Could not record email delivery.");
    },
  );
}
