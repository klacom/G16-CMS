import { eventRecords } from "@/lib/public-data";
import { manilaDay, addDays, calendarFeed } from "@/lib/dates";
import { siteOrigin } from "@/lib/auth";
export async function GET() {
  const today = manilaDay(),
    events = await eventRecords(
      addDays(today, -365),
      addDays(today, 730),
      undefined,
      1,
      1000,
    );
  if (events.count > 1000)
    return new Response("This calendar is too large to export in one feed.", {
      status: 503,
    });
  return new Response(calendarFeed(events.items, siteOrigin()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="icg-campus-calendar.ics"',
      "Cache-Control": "no-store",
    },
  });
}
