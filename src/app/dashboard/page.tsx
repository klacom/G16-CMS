import Link from "next/link";
import { z } from "zod";
import { DeskMonth } from "@/components/desk-month";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkDatabase } from "@/lib/actions";
import { manilaDay, formatDate } from "@/lib/dates";
export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const profile = await requireProfile(),
    client = await createSupabaseServerClient(),
    today = manilaDay();
  if (profile.role === "reviewer") {
    const [queue, totals] = await Promise.all([
      client.rpc("review_page"),
      client.rpc("review_counts"),
    ]);
    checkDatabase(queue.error);
    checkDatabase(totals.error);
    const counts = z
      .object({
        waiting: z.number(),
        invitations: z.number(),
        overdue: z.number(),
      })
      .parse(totals.data);
    const waiting = (queue.data ?? []).filter(
        (review) => review.state !== "decided",
      ),
      dated = waiting.filter((review) => review.needed_by),
      undated = waiting.filter((review) => !review.needed_by);
    return (
      <>
        <p className="kicker">{formatDate(`${today}T12:00:00+08:00`)}</p>
        <h1>Your next read.</h1>
        <p>
          Welcome back, {profile.full_name}. Your assigned submissions are here.
        </p>
        <div className="overview-metrics">
          <div>
            <strong>{counts.waiting}</strong>waiting
          </div>
          <div>
            <strong>{counts.invitations}</strong>invitations
          </div>
          <div>
            <strong>{counts.overdue}</strong>overdue
          </div>
        </div>
        <DeskMonth reviewer date={params.date} />
        <div className="split">
          <section className="panel">
            <h2>Dated assignments</h2>
            <ul className="list">
              {dated.map((review) => (
                <li className="list-row" key={review.id}>
                  <div>
                    <p className="kicker">
                      Needed {formatDate(review.needed_by!, true)}
                    </p>
                    <h3>
                      <Link href={`/dashboard/reviews/${review.id}`}>
                        {review.title}
                      </Link>
                    </h3>
                    <p>
                      {review.writer_name} ·{" "}
                      {review.state === "invited"
                        ? "Invitation"
                        : `Round ${review.round}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {!dated.length && (
              <p className="muted">
                No dated reviews. Event dates are not used as review deadlines.
              </p>
            )}
          </section>
          <section className="panel">
            <h2>Needs you</h2>
            <ul className="list">
              {undated.map((review) => (
                <li className="list-row" key={review.id}>
                  <div>
                    <h3>
                      <Link href={`/dashboard/reviews/${review.id}`}>
                        {review.title}
                      </Link>
                    </h3>
                    <p>
                      {review.state === "invited"
                        ? "Accept or decline this invitation"
                        : "Read and decide"}{" "}
                      · No deadline
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {!waiting.length && (
              <p>You’re caught up. New requests will appear here.</p>
            )}
            <p>
              <Link href="/dashboard/reviews">Open Reviews →</Link>
            </p>
          </section>
        </div>
      </>
    );
  }
  const [articles, messages, invitations, operations, totals] =
    await Promise.all([
      client
        .from("desk_article_list")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(200),
      profile.role === "admin"
        ? client
            .from("contact_messages")
            .select("id,subject,created_at,read_at,status", { count: "exact" })
            .eq("status", "open")
            .order("created_at")
            .limit(20)
        : Promise.resolve(null),
      profile.role === "admin"
        ? client
            .from("invitations")
            .select("*")
            .in("state", ["pending", "expired"])
            .order("created_at", { ascending: false })
            .limit(30)
        : Promise.resolve(null),
      profile.role === "admin"
        ? client.rpc("operations_status")
        : Promise.resolve(null),
      client.rpc("desk_counts"),
    ]);
  for (const result of [articles, messages, invitations, operations, totals])
    if (result) checkDatabase(result.error);
  const counts = z.record(z.string(), z.number()).parse(totals.data ?? {});
  const rows = articles.data ?? [],
    scheduled = rows.filter((article) => article.scheduled_at),
    drafts = rows.filter((article) => article.status === "draft");
  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">{formatDate(`${today}T12:00:00+08:00`)}</p>
          <h1>
            {profile.role === "admin" ? "On the desk." : "Your next story."}
          </h1>
          <p>Welcome back, {profile.full_name}.</p>
        </div>
        <Link className="button" href="/dashboard/articles/new">
          New article
        </Link>
      </header>
      <div className="overview-metrics">
        {["draft", "in_review", "approved", "published"].map((status) => (
          <div key={status}>
            <strong>{counts[status] ?? 0}</strong>
            {status.replace("_", " ")}
          </div>
        ))}
      </div>
      <DeskMonth date={params.date} />
      <div className="split">
        <section className="panel">
          <h2>Scheduled publications</h2>
          <ul className="list">
            {scheduled.map((article) => (
              <li className="list-row" key={article.id}>
                <div>
                  <p className="kicker">
                    Goes live {formatDate(article.scheduled_at!, true)}
                  </p>
                  <h3>
                    <Link href={`/dashboard/articles/${article.id}/edit`}>
                      {article.title}
                    </Link>
                  </h3>
                </div>
              </li>
            ))}
          </ul>
          {!scheduled.length && (
            <p className="muted">
              No publication dates scheduled. Approved articles can be published
              now or scheduled.
            </p>
          )}
          <h2>Continue a draft</h2>
          <ul className="list">
            {drafts.slice(0, 8).map((article) => (
              <li className="list-row" key={article.id}>
                <div>
                  <h3>
                    <Link href={`/dashboard/articles/${article.id}/edit`}>
                      {article.title}
                    </Link>
                  </h3>
                  <small>
                    Updated{" "}
                    {article.updated_at
                      ? formatDate(article.updated_at, true)
                      : ""}
                  </small>
                </div>
              </li>
            ))}
          </ul>
          {!drafts.length && <p className="muted">No drafts waiting.</p>}
        </section>
        <aside className="panel">
          <h2>Needs you</h2>
          {profile.role === "admin" ? (
            <>
              <section>
                <h3>Contact messages</h3>
                <p>{messages?.count ?? 0} open</p>
                {messages?.data?.slice(0, 5).map((message) => (
                  <p key={message.id}>
                    <Link href={`/dashboard/messages/${message.id}`}>
                      {message.subject}
                    </Link>
                    {!message.read_at ? " · Unread" : ""}
                  </p>
                ))}
                <Link href="/dashboard/messages">Open Messages →</Link>
              </section>
              <section className="ruled-section">
                <h3>Invitations</h3>
                {invitations?.data
                  ?.filter(
                    (invite) =>
                      invite.state === "expired" ||
                      new Date(invite.expires_at) < new Date(),
                  )
                  .slice(0, 5)
                  .map((invite) => (
                    <p key={invite.id}>{invite.email} · Expired</p>
                  ))}
                <Link href="/dashboard/users">Manage People →</Link>
              </section>
              <section className="ruled-section">
                <h3>Delivery and jobs</h3>
                {operations?.data &&
                  typeof operations.data === "object" &&
                  !Array.isArray(operations.data) && (
                    <p>
                      {String(operations.data.queued_deliveries ?? 0)} waiting
                      to send · {String(operations.data.failed_deliveries ?? 0)}{" "}
                      recent delivery failures
                    </p>
                  )}
                <Link href="/dashboard/settings#mail">
                  Open service status →
                </Link>
              </section>
            </>
          ) : (
            <>
              <p>
                Check your drafts for requested changes, or publish a revision
                that has approval.
              </p>
              {rows
                .filter((article) => article.status === "approved")
                .map((article) => (
                  <p key={article.id}>
                    <Link href={`/dashboard/articles/${article.id}/edit`}>
                      {article.title}
                    </Link>{" "}
                    · Approved
                  </p>
                ))}
              <Link href="/dashboard/articles">Open My articles →</Link>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
