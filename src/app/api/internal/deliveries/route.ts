import {
  validWorkerAuthorization,
  mailConfigured,
  deliverQueuedMail,
} from "@/lib/mail-worker";
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!validWorkerAuthorization(request.headers.get("authorization")))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!mailConfigured())
    return Response.json({ error: "Mail is not configured." }, { status: 503 });
  try {
    return Response.json(
      { sent: await deliverQueuedMail() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Delivery worker failed. Pending work will be retried." },
      { status: 503 },
    );
  }
}
