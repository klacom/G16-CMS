import Link from "next/link";
import { categories, publicArticles } from "@/lib/data";
import { ArticleRow } from "@/components/public-article";
import { publicationCursor } from "@/lib/records";
export const metadata = {
  alternates: { canonical: "/archive" },
  title: "The archive · ICG",
};
export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const filters = await searchParams,
    [records, taxonomy] = await Promise.all([
      publicArticles(filters),
      categories(),
    ]);
  const pageLink = (direction: "after" | "before") => {
    const { after: _after, before: _before, page: _page, ...rest } = filters;
    void _after;
    void _before;
    void _page;
    const item =
      direction === "after" ? records.items.at(-1) : records.items.at(0);
    return `/archive?${new URLSearchParams(Object.fromEntries(Object.entries({ ...rest, ...(item ? { [direction]: publicationCursor(item) } : {}) }).filter(([, value]) => value !== undefined)) as Record<string, string>)}`;
  };
  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">Campus life, kept</p>
          <h1>The archive</h1>
          <p>News, events and announcements — a dated record of campus life.</p>
        </div>
        <Link href="/calendar">Browse the calendar →</Link>
      </header>
      <form className="filters">
        <label>
          Search the record
          <input
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Debate, job fair, scholarship"
            maxLength={200}
          />
        </label>
        <label>
          Type
          <select name="type" defaultValue={filters.type ?? ""}>
            <option value="">All types</option>
            <option value="news">News</option>
            <option value="event">Events</option>
            <option value="announcement">Announcements</option>
          </select>
        </label>
        <label>
          Category
          <select name="category" defaultValue={filters.category ?? ""}>
            <option value="">All categories</option>
            {taxonomy.map((category) => (
              <option key={category.id} value={category.slug ?? ""}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input type="date" name="from" defaultValue={filters.from} />
        </label>
        <label>
          Through
          <input type="date" name="to" defaultValue={filters.to} />
        </label>
        <label>
          Sort
          <select name="sort" defaultValue={filters.sort ?? "newest"}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
        {filters.tag && <input type="hidden" name="tag" value={filters.tag} />}
        <button className="button">Search</button>
        <Link className="button secondary" href="/archive">
          Clear
        </Link>
      </form>
      <p className="muted">
        {records.count} {records.count === 1 ? "record" : "records"}
        {filters.tag ? ` tagged ${filters.tag}` : ""}
      </p>
      {records.items.length ? (
        <ul className="list">
          {records.items.map((article) => (
            <ArticleRow key={article.id} article={article} />
          ))}
        </ul>
      ) : (
        <div className="empty">
          <h2>No records found</h2>
          <p>Try a different word, category or date range.</p>
        </div>
      )}
      <nav className="pagination" aria-label="Archive pages">
        {records.hasBefore ? (
          <Link href={pageLink("before")}>← Previous</Link>
        ) : (
          <span />
        )}
        <Link href="/archive">Start of archive</Link>
        {records.hasAfter ? (
          <Link href={pageLink("after")}>Next →</Link>
        ) : (
          <span />
        )}
      </nav>
    </>
  );
}
