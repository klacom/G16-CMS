import { getPublicArticle } from "@/lib/data";
import { calendarFeed } from "@/lib/dates";
import { siteOrigin } from "@/lib/auth";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const article = await getPublicArticle((await params).slug);
  if (!article || article.type !== "event")
    return new Response("Not found", { status: 404 });
  return new Response(calendarFeed([article], siteOrigin()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="icg-event.ics"',
      "Cache-Control": "no-store",
    },
  });
}
