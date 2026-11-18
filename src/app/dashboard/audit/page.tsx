import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkDatabase } from "@/lib/actions";
import { auditFilters } from "@/lib/audit";
import { formatDate } from "@/lib/dates";
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireProfile(["admin"]);
  const params = await searchParams;
  let filters: ReturnType<typeof auditFilters>,
    errorMessage = "";
  try {
    filters = auditFilters(params);
  } catch {
    filters = auditFilters({});
    errorMessage = "Choose a valid date range of at most one year.";
  }
  const client = await createSupabaseServerClient();
  let query = client
    .from("audit_entries")
    .select("*", { count: "exact" })
    .gte("created_at", filters.start)
    .lt("created_at", filters.end);
  if (filters.area) query = query.eq("area", filters.area);
  if (filters.action) query = query.eq("action", filters.action);
  const result = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((filters.page - 1) * 50, filters.page * 50 - 1);
  checkDatabase(result.error);
  const options = {
    from: filters.from,
    to: filters.to,
    area: filters.area,
    action: filters.action,
  };
  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">The desk’s record</p>
          <h1>Audit log</h1>
          <p>Who changed what, and when. Entries are retained for 24 months.</p>
        </div>
        <a
          className="button secondary"
          href={`/dashboard/audit/export?${new URLSearchParams(options)}`}
        >
          Export filtered CSV
        </a>
      </header>
      {errorMessage && (
        <p role="alert" className="form-error">
          {errorMessage}
        </p>
      )}
      <form className="filters">
        <label>
          From
          <input name="from" type="date" defaultValue={filters.from} required />
        </label>
        <label>
          Through
          <input name="to" type="date" defaultValue={filters.to} required />
        </label>
        <label>
          Area
          <select name="area" defaultValue={filters.area}>
            <option value="">All areas</option>
            {[
              "articles",
              "reviews",
              "people",
              "messages",
              "settings",
              "security",
            ].map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
        <label>
          Action
          <input name="action" defaultValue={filters.action} maxLength={80} />
        </label>
        <button className="button secondary">Apply filters</button>
      </form>
      <p className="muted">{result.count ?? 0} entries · Philippine time</p>
      <ul className="list">
        {result.data?.map((entry) => (
          <li className="list-row" key={entry.id}>
            <div>
              <small>
                {formatDate(entry.created_at, true)} ·{" "}
                {entry.actor_role ?? "Desk"}
              </small>
              <h2>{entry.action.replaceAll("_", " ")}</h2>
              <p>
                {entry.target_label ?? entry.target_id ?? "ICG desk"} ·{" "}
                {entry.area}
              </p>
            </div>
            <details>
              <summary>Entry details</summary>
              <dl className="facts">
                <dt>Entry</dt>
                <dd>{entry.id}</dd>
                <dt>Actor</dt>
                <dd>{entry.actor_id ?? "Automatic desk action"}</dd>
                {entry.changes &&
                  Object.entries(entry.changes).map(([key, value]) => (
                    <div key={key}>
                      <dt>{key.replaceAll("_", " ")}</dt>
                      <dd>
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </dd>
                    </div>
                  ))}
              </dl>
            </details>
          </li>
        ))}
      </ul>
      {!result.data?.length && (
        <div className="empty">
          <h2>No entries in this range</h2>
          <p>Try another date range or remove a filter.</p>
        </div>
      )}
      <nav className="pagination">
        {filters.page > 1 && (
          <Link
            href={`?${new URLSearchParams({ ...options, page: String(filters.page - 1) })}`}
          >
            Previous
          </Link>
        )}
        {filters.page * 50 < (result.count ?? 0) && (
          <Link
            href={`?${new URLSearchParams({ ...options, page: String(filters.page + 1) })}`}
          >
            Next
          </Link>
        )}
      </nav>
    </>
  );
}
