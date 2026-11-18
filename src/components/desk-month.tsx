import Link from "next/link";
import { z } from "zod";
import { manilaDay, dayStart, addDays, formatDate } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkDatabase } from "@/lib/actions";
const monthSchema = z.array(
  z.object({
    day: z.string(),
    total: z.number(),
    items: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        at: z.string(),
        kind: z.string(),
        href: z.string(),
      }),
    ),
  }),
);
export async function DeskMonth({
  date,
  reviewer = false,
}: {
  date?: string;
  reviewer?: boolean;
}) {
  let selected = manilaDay();
  try {
    if (date) {
      dayStart(date);
      selected = date;
    }
  } catch {
    /* Invalid calendar links return to today. */
  }
  const first = selected.slice(0, 7) + "-01",
    current = new Date(`${first}T12:00:00+08:00`),
    year = current.getUTCFullYear(),
    month = current.getUTCMonth(),
    week = current.getUTCDay(),
    days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate(),
    gridStart = addDays(first, -week);
  const client = await createSupabaseServerClient(),
    result = await client.rpc("desk_month", { p_month: first });
  checkDatabase(result.error);
  const programme = monthSchema.parse(result.data),
    selectedDay = programme.find((day) => day.day === selected);
  return (
    <section className="panel month-desk">
      <header className="page-head">
        <div>
          <p className="kicker">
            {reviewer
              ? "Your review deadlines"
              : "Publication dates & campus events"}
          </p>
          <h2>
            {new Intl.DateTimeFormat("en-PH", {
              month: "long",
              year: "numeric",
              timeZone: "Asia/Manila",
            }).format(current)}
          </h2>
        </div>
        <nav className="actions" aria-label="Desk calendar">
          <Link
            className="button secondary"
            aria-label="Previous month"
            href={`?date=${manilaDay(new Date(Date.UTC(year, month - 1, 1, 4)))}`}
          >
            ←
          </Link>
          <Link className="button secondary" href={`?date=${manilaDay()}`}>
            Today
          </Link>
          <Link
            className="button secondary"
            aria-label="Next month"
            href={`?date=${manilaDay(new Date(Date.UTC(year, month + 1, 1, 4)))}`}
          >
            →
          </Link>
        </nav>
      </header>
      <div className="calendar" role="group" aria-label="Desk month">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div className="weekday" key={day}>
            {day}
          </div>
        ))}
        {Array.from(
          { length: Math.ceil((week + days) / 7) * 7 },
          (_, index) => {
            const day = addDays(gridStart, index),
              events = programme.find((entry) => entry.day === day);
            return day.slice(0, 7) !== first.slice(0, 7) ? (
              <div key={day} />
            ) : (
              <Link
                href={`?date=${day}`}
                key={day}
                className={`calendar-day ${day === manilaDay() ? "today" : ""}`}
                aria-current={day === selected ? "date" : undefined}
                aria-label={`${day}, ${events?.total ?? 0} items`}
              >
                <span>{Number(day.slice(8))}</span>
                {events && (
                  <small>
                    {events.total} {reviewer ? "due" : "items"}
                  </small>
                )}
              </Link>
            );
          },
        )}
      </div>
      <section className="ruled-section">
        <p className="kicker">Selected day</p>
        <h3>{formatDate(`${selected}T12:00:00+08:00`)}</h3>
        {selectedDay ? (
          <>
            <ul className="list">
              {selectedDay.items.map((item) => (
                <li className="list-row" key={item.id + item.kind}>
                  <div>
                    <small>
                      {item.kind} · {formatDate(item.at, true)}
                    </small>
                    <h3>
                      <Link href={item.href}>{item.title}</Link>
                    </h3>
                  </div>
                </li>
              ))}
            </ul>
            {selectedDay.total > 5 && (
              <p>
                Showing the first 5 of {selectedDay.total}.{" "}
                <Link
                  href={reviewer ? "/dashboard/reviews" : "/dashboard/articles"}
                >
                  Open the full list →
                </Link>
              </p>
            )}
          </>
        ) : (
          <p className="muted">
            {reviewer
              ? "No reviews with a deadline on this day. Undated requests stay in Needs you."
              : "No events or publications scheduled for this day."}
          </p>
        )}
      </section>
    </section>
  );
}
