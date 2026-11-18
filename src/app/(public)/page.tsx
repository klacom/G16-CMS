import Link from "next/link";
import { homeRecords } from "@/lib/public-data";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { ArticleRow } from "@/components/public-article";
import { addDays, formatDate } from "@/lib/dates";
export default async function HomePage() {
  const data = await homeRecords();
  return (
    <>
      <div className="home-masthead">
        <h1>ICG</h1>
        <p>
          The PLP campus record · {formatDate(`${data.today}T12:00:00+08:00`)}
        </p>
      </div>
      <FeaturedCarousel articles={data.featured} />
      <section className="week-strip bg-night">
        <div>
          <p className="kicker">This week on campus</p>
          <h2>Find your day.</h2>
        </div>
        <div className="week-days">
          {Array.from({ length: 7 }, (_, index) => {
            const day = addDays(data.today, index),
              count = data.week.find((row) => row.day === day)?.total ?? 0;
            return (
              <Link key={day} href={`/calendar?date=${day}`}>
                <small>
                  {new Intl.DateTimeFormat("en-PH", {
                    weekday: "short",
                    timeZone: "Asia/Manila",
                  }).format(new Date(`${day}T12:00:00+08:00`))}
                </small>
                <strong>{Number(day.slice(8))}</strong>
                <span>
                  {count} {count === 1 ? "event" : "events"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <div className="split">
        <section className="ruled-section">
          <div className="page-head">
            <h2>Coming up</h2>
            <Link href="/calendar">Full calendar →</Link>
          </div>
          {data.upcoming.length ? (
            <ul className="list">
              {data.upcoming.map((article) => (
                <ArticleRow key={article.id} article={article} />
              ))}
            </ul>
          ) : (
            <p className="muted">No upcoming events have been published yet.</p>
          )}
        </section>
        <section className="ruled-section">
          <div className="page-head">
            <h2>Announcements</h2>
            <Link href="/archive?type=announcement">All notices →</Link>
          </div>
          {data.notices.length ? (
            <ul className="list">
              {data.notices.map((article) => (
                <ArticleRow key={article.id} article={article} />
              ))}
            </ul>
          ) : (
            <p className="muted">No active announcements.</p>
          )}
        </section>
      </div>
      <section className="ruled-section">
        <div className="page-head">
          <h2>News from campus</h2>
          <Link href="/archive?type=news">The news record →</Link>
        </div>
        {data.news.length ? (
          <ul className="news-grid list">
            {data.news.map((article) => (
              <ArticleRow key={article.id} article={article} />
            ))}
          </ul>
        ) : (
          <div className="empty">
            <h2>The record starts here.</h2>
            <p>
              Reviewed campus stories will appear here when the desk publishes
              them.
            </p>
          </div>
        )}
      </section>
      {data.historical.length > 0 && (
        <section className="ruled-section">
          <h2>On this day, on campus</h2>
          <ul className="list">
            {data.historical.map((article) => (
              <ArticleRow key={article.id} article={article} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
