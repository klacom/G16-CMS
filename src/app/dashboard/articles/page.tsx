import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkDatabase } from "@/lib/actions";
import { pageNumber } from "@/lib/records";
import { formatDate } from "@/lib/dates";
export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireProfile(["writer", "admin"]),
    params = await searchParams,
    page = pageNumber(params.page),
    client = await createSupabaseServerClient();
  let query = client.from("desk_article_list").select("*", { count: "exact" });
  if (params.status === "archived") query = query.eq("visibility", "archived");
  else if (
    params.status &&
    ["draft", "in_review", "approved", "published"].includes(params.status)
  )
    query = query.eq("status", params.status);
  if (params.q?.trim())
    query = query.ilike("title", `%${params.q.trim().slice(0, 120)}%`);
  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .order("id")
    .range((page - 1) * 20, page * 20 - 1);
  checkDatabase(error);
  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">The proof sheet</p>
          <h1>{profile.role === "admin" ? "Articles" : "My articles"}</h1>
          <p>Every draft, review and published record in one place.</p>
        </div>
        <Link className="button" href="/dashboard/articles/new">
          New article
        </Link>
      </header>
      <form className="filters">
        <label>
          Search articles
          <input
            name="q"
            defaultValue={params.q}
            maxLength={120}
            placeholder="Find a title"
          />
        </label>
        <label>
          Status
          <select name="status" defaultValue={params.status ?? ""}>
            <option value="">All articles</option>
            {["draft", "in_review", "approved", "published", "archived"].map(
              (status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ),
            )}
          </select>
        </label>
        <button className="button secondary">Filter</button>
      </form>
      <ul className="list">
        {data?.map((article) => (
          <li className="list-row" key={article.id}>
            <div>
              <p className="kicker">{article.type}</p>
              <h2>
                <Link href={`/dashboard/articles/${article.id}/edit`}>
                  {article.title}
                </Link>
              </h2>
              <p className="muted">
                Updated{" "}
                {article.updated_at ? formatDate(article.updated_at, true) : ""}
                {article.scheduled_at
                  ? ` · Scheduled ${formatDate(article.scheduled_at, true)}`
                  : ""}
              </p>
            </div>
            <div className="actions">
              <span className={`badge ${article.status}`}>
                {article.status?.replace("_", " ")}
              </span>
              {article.visibility === "archived" && (
                <span className="badge">Public history</span>
              )}
              {article.visibility === "withdrawn" && (
                <span className="badge">Withdrawn</span>
              )}
              {article.published_revision_id &&
                article.visibility !== "withdrawn" && (
                  <Link href={`/news/${article.slug}`}>
                    Read public version ↗
                  </Link>
                )}
            </div>
          </li>
        ))}
      </ul>
      {!data?.length && (
        <div className="empty">
          <h2>
            {params.q || params.status
              ? "No matching articles"
              : "Your next story starts here"}
          </h2>
          <p>
            {params.q || params.status
              ? "Try another title or status."
              : "Start a draft, then send it to an independent reviewer."}
          </p>
        </div>
      )}
      <nav className="pagination">
        {page > 1 && (
          <Link
            href={`?${new URLSearchParams({ q: params.q ?? "", status: params.status ?? "", page: String(page - 1) })}`}
          >
            Previous
          </Link>
        )}
        {(count ?? 0) > page * 20 && (
          <Link
            href={`?${new URLSearchParams({ q: params.q ?? "", status: params.status ?? "", page: String(page + 1) })}`}
          >
            Next
          </Link>
        )}
      </nav>
    </>
  );
}
