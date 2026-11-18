import Link from "next/link";
import { publicClient, categories } from "@/lib/data";
import { eventRecords } from "@/lib/public-data";
import { checkDatabase } from "@/lib/actions";
import { manilaDay, dayStart, addDays, formatDate } from "@/lib/dates";
import { pageNumber } from "@/lib/records";
import { ArticleRow } from "./public-article";
export async function CampusCalendar({
  query,
  compact = false,
}: {
  query: Record<string, string | undefined>;
  compact?: boolean;
}) {
  let selected = manilaDay();
  try {
    if (query.date) {
      dayStart(query.date);
      selected = query.date;
    }
  } catch {
    /* Invalid URL date returns to today. */
  }
  const first = selected.slice(0, 7) + "-01",
    monthDate = new Date(`${first}T12:00:00+08:00`),
    year = monthDate.getUTCFullYear(),
    month = monthDate.getUTCMonth();
  const last = manilaDay(new Date(Date.UTC(year, month + 1, 0, 4))),
    weekday = monthDate.getUTCDay(),
    gridStart = addDays(first, -weekday),
    days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const view = query.view === "agenda" ? "agenda" : "month",
    page = pageNumber(query.page),
    end = view === "agenda" ? last : selected;
  const [counts, records, taxonomy] = await Promise.all([
    publicClient().rpc("calendar_counts", {
      p_from: first,
      p_to: last,
      ...(query.category ? { p_category: query.category } : {}),
    }),
    eventRecords(selected, end, query.category, page),
    compact ? Promise.resolve([]) : categories(),
  ]);
  checkDatabase(counts.error);
  const base = compact ? "/embed/events" : "/calendar";
  const href = (changes: Record<string, string>) =>
    `${base}?${new URLSearchParams(compact ? { view: "calendar", startdate: changes.date ?? selected, ...(changes.page ? { page: changes.page } : {}) } : { date: selected, view, ...(query.category ? { category: query.category } : {}), ...changes })}`;
  const monthLabel = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(monthDate);
  return (
    <>
      <div className="page-head">
        <h2>{monthLabel}</h2>
        <nav className="actions" aria-label="Calendar navigation">
          <Link
            className="button secondary"
            aria-label="Previous month"
            href={href({
              date: manilaDay(new Date(Date.UTC(year, month - 1, 1, 4))),
              page: "1",
            })}
          >
            ←
          </Link>
          <Link
            className="button secondary"
            href={href({ date: manilaDay(), page: "1" })}
          >
            Today
          </Link>
          <Link
            className="button secondary"
            aria-label="Next month"
            href={href({
              date: manilaDay(new Date(Date.UTC(year, month + 1, 1, 4))),
              page: "1",
            })}
          >
            →
          </Link>
        </nav>
      </div>
      {!compact && (
        <form className="filters">
          <input type="hidden" name="date" value={selected} />
          <label>
            View
            <select name="view" defaultValue={view}>
              <option value="month">Month</option>
              <option value="agenda">Agenda</option>
            </select>
          </label>
          <label>
            Category
            <select name="category" defaultValue={query.category ?? ""}>
              <option value="">All categories</option>
              {taxonomy.map((category) => (
                <option key={category.id} value={category.slug ?? ""}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button secondary">Apply</button>
          <a href="/calendar.ics">Subscribe to this calendar</a>
        </form>
      )}
      {compact && (
        <form className="compact-calendar-picker">
          <input type="hidden" name="view" value="calendar" />
          <label>
            Day
            <select name="startdate" defaultValue={selected}>
              {Array.from({ length: days }, (_, index) => {
                const day = addDays(first, index),
                  total =
                    counts.data?.find((row) => row.day === day)?.total ?? 0;
                return (
                  <option key={day} value={day}>
                    {formatDate(`${day}T12:00:00+08:00`)} · {total} events
                  </option>
                );
              })}
            </select>
          </label>
          <button className="button secondary">Show day</button>
        </form>
      )}
      {view === "month" && (
        <div className="calendar" role="group" aria-label={monthLabel}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
          {Array.from(
            { length: Math.ceil((weekday + days) / 7) * 7 },
            (_, index) => {
              const day = addDays(gridStart, index),
                outside = day.slice(0, 7) !== first.slice(0, 7),
                count = counts.data?.find((row) => row.day === day)?.total ?? 0;
              return outside ? (
                <div key={day} aria-hidden="true" />
              ) : (
                <Link
                  key={day}
                  href={href({ date: day, page: "1" })}
                  className={`calendar-day ${day === manilaDay() ? "today" : ""}`}
                  aria-current={day === selected ? "date" : undefined}
                  aria-label={`${formatDate(`${day}T12:00:00+08:00`)}, ${count} events`}
                >
                  <span>{Number(day.slice(8))}</span>
                  {count > 0 && (
                    <small>
                      {count} {count === 1 ? "event" : "events"}
                    </small>
                  )}
                </Link>
              );
            },
          )}
        </div>
      )}
      <section className="ruled-section">
        <h2>
          {view === "month"
            ? formatDate(`${selected}T12:00:00+08:00`)
            : "The programme"}
        </h2>
        {records.items.length ? (
          <ul className="list">
            {records.items.map((article) => (
              <ArticleRow key={article.id} article={article} newTab={compact} />
            ))}
          </ul>
        ) : (
          <p className="muted">
            No published events for{" "}
            {view === "month" ? "this day" : "the selected dates"}.
          </p>
        )}
        <nav className="pagination">
          {page > 1 && (
            <Link href={href({ page: String(page - 1) })}>Previous events</Link>
          )}
          {page * 20 < records.count && (
            <Link href={href({ page: String(page + 1) })}>More events →</Link>
          )}
        </nav>
      </section>
    </>
  );
}
