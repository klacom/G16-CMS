import Link from "next/link";
import { z } from "zod";
import { manilaDay, addDays, formatDate } from "@/lib/dates";
import { eventRecords } from "@/lib/public-data";
import { CampusCalendar } from "@/components/campus-calendar";
export default async function EventsWidgetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams,
    date = z.iso.date().safeParse(params.startdate),
    startdate =
      date.success && date.data >= "2000-01-01" && date.data <= "2099-12-31"
        ? date.data
        : manilaDay(),
    limit = z.coerce
      .number()
      .int()
      .min(1)
      .max(10)
      .catch(5)
      .parse(params.limit ?? 5),
    calendar = params.view === "calendar";
  const events = calendar
    ? null
    : await eventRecords(
        startdate,
        addDays(startdate, 3660),
        undefined,
        1,
        limit,
        true,
      );
  return (
    <>
      <h1>Campus events</h1>
      {calendar ? (
        <CampusCalendar
          compact
          query={{ date: startdate, view: "month", page: params.page }}
        />
      ) : (
        <>
          <p className="muted">
            From {formatDate(`${startdate}T12:00:00+08:00`)}
          </p>
          <ul className="list">
            {events?.items.map((event) => (
              <li key={event.id} className="list-row">
                <div>
                  <p className="kicker">
                    {event.event_starts_at
                      ? formatDate(event.event_starts_at, true)
                      : ""}
                  </p>
                  <h2>
                    <Link
                      href={`/news/${event.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${event.title} (opens a new tab)`}
                    >
                      {event.title}
                    </Link>
                  </h2>
                  <p>{event.venue}</p>
                </div>
              </li>
            ))}
          </ul>
          {!events?.items.length && (
            <p className="muted">
              No upcoming published events from this date.
            </p>
          )}
        </>
      )}
      <footer className="ruled-section">
        <Link
          href={`/calendar?date=${startdate}&view=${calendar ? "month" : "agenda"}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Full campus calendar ↗
        </Link>
      </footer>
    </>
  );
}
