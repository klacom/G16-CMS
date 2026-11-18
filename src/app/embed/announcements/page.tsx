import Link from "next/link";
import { z } from "zod";
import { activeAnnouncements } from "@/lib/public-data";
import { formatDate } from "@/lib/dates";
export default async function AnnouncementsWidgetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams,
    limit = z.coerce
      .number()
      .int()
      .min(1)
      .max(10)
      .catch(5)
      .parse(params.limit ?? 5),
    rows = await activeAnnouncements(limit),
    layout = params.layout === "row" ? "row" : "column";
  return (
    <>
      <h1>Announcements</h1>
      <ul className={`list widget-notices ${layout}`}>
        {rows.map((article) => (
          <li key={article.id} className="list-row">
            <div>
              <p className="kicker">{formatDate(article.published_at)}</p>
              <h2>
                <Link
                  href={`/news/${article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${article.title} (opens a new tab)`}
                >
                  {article.title}
                </Link>
              </h2>
            </div>
          </li>
        ))}
      </ul>
      {!rows.length && <p className="muted">No active announcements.</p>}
      <footer className="ruled-section">
        <Link
          href="/archive?type=announcement"
          target="_blank"
          rel="noopener noreferrer"
        >
          All announcements ↗
        </Link>
      </footer>
    </>
  );
}
