import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkDatabase } from "@/lib/actions";
import { pageNumber } from "@/lib/records";
import { formatDate, businessDeadline } from "@/lib/dates";
import { siteDetails } from "@/lib/public-data";
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireProfile(["admin"]);
  const params = await searchParams,
    page = pageNumber(params.page),
    client = await createSupabaseServerClient(),
    details = await siteDetails();
  let query = client
    .from("contact_messages")
    .select("id,first_name,last_name,subject,topic,status,created_at,read_at", {
      count: "exact",
    });
  if (["open", "replied", "closed"].includes(params.status ?? ""))
    query = query.eq("status", params.status!);
  if (params.topic) query = query.eq("topic", params.topic);
  if (params.q?.trim())
    query = query.ilike("subject", `%${params.q.trim().slice(0, 120)}%`);
  const result = await query
    .order("created_at", { ascending: false })
    .order("id")
    .range((page - 1) * 20, page * 20 - 1);
  checkDatabase(result.error);
  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">A line from campus</p>
          <h1>Messages</h1>
          <p>
            A shared inbox for the administration desk. Opening a message marks
            it read for everyone.
          </p>
        </div>
      </header>
      <form className="filters">
        <label>
          Subject
          <input name="q" defaultValue={params.q} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={params.status ?? ""}>
            <option value="">All messages</option>
            <option value="open">Open</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <button className="button secondary">Filter</button>
      </form>
      <ul className="list">
        {result.data?.map((message) => (
          <li className="list-row" key={message.id}>
            <div>
              <p className="kicker">
                {message.topic} ·{" "}
                {message.created_at ? formatDate(message.created_at, true) : ""}
              </p>
              <h2>
                <Link href={`/dashboard/messages/${message.id}`}>
                  {!message.read_at && (
                    <span className="unread-dot" aria-label="Unread" />
                  )}
                  {message.subject}
                </Link>
              </h2>
              <p>
                {message.first_name} {message.last_name}
              </p>
              <small>
                Reply by{" "}
                {message.created_at
                  ? businessDeadline(
                      message.created_at,
                      details.reply_within_school_days,
                    )
                  : ""}
              </small>
            </div>
            <span className="badge">{message.status}</span>
          </li>
        ))}
      </ul>
      {!result.data?.length && (
        <div className="empty">
          <h2>No messages here</h2>
          <p>New contact submissions will appear in this inbox.</p>
        </div>
      )}
      <nav className="pagination">
        {page > 1 && (
          <Link href={`?status=${params.status ?? ""}&page=${page - 1}`}>
            Previous
          </Link>
        )}
        {(result.count ?? 0) > page * 20 && (
          <Link href={`?status=${params.status ?? ""}&page=${page + 1}`}>
            Next
          </Link>
        )}
      </nav>
    </>
  );
}
