import Link from "next/link";
import Image from "next/image";
import { formatDate, manilaDay } from "@/lib/dates";
import type { PublicArticle } from "@/lib/records";
import { RichContent } from "./rich-content";
export function ArticleRow({
  article,
  newTab = false,
}: {
  article: PublicArticle;
  newTab?: boolean;
}) {
  return (
    <li className="list-row">
      <div>
        <p className="kicker">
          {article.category_name ?? article.type} ·{" "}
          {formatDate(
            article.type === "event" && article.event_starts_at
              ? article.event_starts_at
              : article.published_at,
          )}
        </p>
        <h2>
          <Link
            href={`/news/${article.slug}`}
            target={newTab ? "_blank" : undefined}
            rel={newTab ? "noopener noreferrer" : undefined}
          >
            {article.title}
            {newTab ? " ↗" : ""}
          </Link>
        </h2>
        <p>{article.excerpt}</p>
      </div>
      <span className="badge">{article.type}</span>
    </li>
  );
}
export function ArticleBody({ article }: { article: PublicArticle }) {
  const cover = article.images.find((image) => image.cover);
  return (
    <article className="article-reading">
      <header>
        <p className="kicker">
          {article.category_name ?? article.type} ·{" "}
          {formatDate(article.published_at)}
        </p>
        <h1>{article.title}</h1>
        <p className="article-excerpt">{article.excerpt}</p>
        <p className="muted">
          By {article.byline_name ?? "ICG"}
          {article.byline_affiliation ? `, ${article.byline_affiliation}` : ""}
        </p>
        {article.visibility === "archived" && (
          <p className="badge">From the campus archive</p>
        )}
      </header>
      {cover && (
        <figure>
          <Image
            unoptimized
            className="cover"
            width={1600}
            height={1000}
            src={`/media/${cover.id}`}
            alt={cover.alt}
          />
          <figcaption>
            {cover.caption}
            {cover.credit ? ` · Photo: ${cover.credit}` : ""}
          </figcaption>
        </figure>
      )}
      {article.type === "event" && (
        <aside className="event-details panel">
          <h2>Event details</h2>
          <p>
            {article.event_starts_at
              ? formatDate(article.event_starts_at, true)
              : ""}
            {article.event_ends_at
              ? ` – ${formatDate(article.event_ends_at, true)}`
              : ""}
          </p>
          <p>{article.venue}</p>
          <div className="actions">
            {article.map_url && (
              <a
                href={article.map_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View map ↗
              </a>
            )}
            <a href={`/news/${article.slug}/calendar.ics`}>Add to calendar</a>
          </div>
        </aside>
      )}
      <RichContent document={article.body} />
      {article.images.filter((image) => !image.cover).length > 0 && (
        <section className="ruled-section">
          <h2>Photos from the story</h2>
          <div className="gallery">
            {article.images
              .filter((image) => !image.cover)
              .map((image) => (
                <figure key={image.id}>
                  <Image
                    unoptimized
                    width={1200}
                    height={800}
                    style={{ width: "100%", height: "auto" }}
                    src={`/media/${image.id}`}
                    alt={image.alt}
                  />
                  <figcaption>
                    {image.caption}
                    {image.credit ? ` · Photo: ${image.credit}` : ""}
                  </figcaption>
                </figure>
              ))}
          </div>
        </section>
      )}
      <div className="actions tags">
        {article.tags.map((tag) => (
          <Link key={tag} href={`/archive?tag=${encodeURIComponent(tag)}`}>
            {tag}
          </Link>
        ))}
      </div>
      <footer className="ruled-section">
        <Link href={`/contact?topic=correction&article=${article.id}`}>
          Report a correction
        </Link>{" "}
        ·{" "}
        <Link
          href={`/calendar?date=${manilaDay(new Date(article.event_starts_at ?? article.published_at))}`}
        >
          Browse the campus calendar
        </Link>
      </footer>
    </article>
  );
}
