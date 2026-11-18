import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkDatabase } from "@/lib/actions";
import { revisionSchema, pageNumber } from "@/lib/records";
import { formatDate } from "@/lib/dates";
import {
  RichContent,
  RevisionChanges,
  RevisionDetailsChanges,
} from "./rich-content";
import { ActionForm, SubmitButton } from "./action-form";
import { decideReview } from "@/app/dashboard/reviews/actions";
import { addComment } from "@/app/dashboard/articles/actions";

export async function ReviewDesk({
  id,
  query = {},
}: {
  id?: string;
  query?: Record<string, string | undefined>;
}) {
  const profile = await requireProfile(["reviewer"]),
    client = await createSupabaseServerClient(),
    waitingPage = pageNumber(query.waiting),
    historyPage = pageNumber(query.history);
  const [waiting, history, detail, totals] = await Promise.all([
    client.rpc("review_page", { p_page: waitingPage }),
    client.rpc("review_page", { p_page: historyPage, p_history: true }),
    id ? client.rpc("review_page", { p_id: id }) : Promise.resolve(null),
    client.rpc("review_counts"),
  ]);
  for (const result of [waiting, history, detail, totals])
    if (result) checkDatabase(result.error);
  if (!id && waiting.data?.[0])
    redirect(`/dashboard/reviews/${waiting.data[0].id}`);
  const selected = detail?.data?.[0],
    counts = z.object({ waiting: z.number() }).parse(totals.data);
  if (id && !selected) notFound();
  let body: ReturnType<typeof revisionSchema.parse> | null = null,
    previous: ReturnType<typeof revisionSchema.parse> | null = null;
  if (selected && selected.state !== "invited") {
    const result = await client
      .from("article_revisions")
      .select("*")
      .eq("id", selected.revision_id)
      .maybeSingle();
    checkDatabase(result.error);
    if (result.data) body = revisionSchema.parse(result.data);
    if (body?.parent_revision_id) {
      const old = await client
        .from("article_revisions")
        .select("*")
        .eq("id", body.parent_revision_id)
        .maybeSingle();
      checkDatabase(old.error);
      previous = old.data ? revisionSchema.parse(old.data) : null;
    }
  }
  const requests = selected
    ? await client
        .from("review_requests")
        .select("*")
        .eq("assignment_id", selected.id)
        .order("id")
    : null;
  if (requests) checkDatabase(requests.error);
  const operation = (value: string, label: string) => (
    <ActionForm action={decideReview}>
      <input name="id" type="hidden" value={selected?.id} />
      <input name="operation" type="hidden" value={value} />
      <SubmitButton
        className={
          value === "decline" || value === "step_down"
            ? "button secondary"
            : "button"
        }
      >
        {label}
      </SubmitButton>
    </ActionForm>
  );
  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">An independent read</p>
          <h1>Reviews</h1>
          <p>{counts.waiting} waiting · Review the exact submitted version.</p>
        </div>
      </header>
      <div className="review-layout">
        <aside className="review-list">
          <h2>Waiting</h2>
          {waiting.data?.map((row) => (
            <Link
              className="review-row"
              aria-current={row.id === selected?.id ? "page" : undefined}
              href={`/dashboard/reviews/${row.id}`}
              key={row.id}
            >
              <p className="kicker">
                {row.state === "invited" ? "New request" : `Round ${row.round}`}
              </p>
              <strong>{row.title}</strong>
              <p>{row.writer_name}</p>
              <small>
                {row.needed_by
                  ? `Needed ${formatDate(row.needed_by, true)}`
                  : "No deadline"}
              </small>
            </Link>
          ))}
          {!waiting.data?.length && (
            <p className="muted">No reviews waiting.</p>
          )}
          <nav className="pagination">
            {waitingPage > 1 && (
              <Link href={`?waiting=${waitingPage - 1}&history=${historyPage}`}>
                Previous waiting
              </Link>
            )}
            {waiting.data?.length === 40 && (
              <Link href={`?waiting=${waitingPage + 1}&history=${historyPage}`}>
                More waiting →
              </Link>
            )}
          </nav>
          <section className="ruled-section">
            <h2>Decided</h2>
            {history.data?.map((row) => (
              <Link
                className="review-row"
                key={row.id}
                href={`/dashboard/reviews/${row.id}`}
              >
                <strong>{row.title}</strong>
                <p>{row.decision?.replace("_", " ")}</p>
              </Link>
            ))}
            <nav className="pagination">
              {historyPage > 1 && (
                <Link
                  href={`?waiting=${waitingPage}&history=${historyPage - 1}`}
                >
                  Previous decisions
                </Link>
              )}
              {history.data?.length === 40 && (
                <Link
                  href={`?waiting=${waitingPage}&history=${historyPage + 1}`}
                >
                  More decisions →
                </Link>
              )}
            </nav>
          </section>
        </aside>
        <section>
          {selected ? (
            <>
              <div className="panel">
                <p className="kicker">
                  {selected.type} · {selected.writer_name} · Round{" "}
                  {selected.round}
                </p>
                <h2>{selected.title}</h2>
                <p>{selected.excerpt}</p>
                {selected.note && <p className="notice">{selected.note}</p>}
                {selected.state === "invited" ? (
                  <>
                    <p className="muted">
                      Accept to read the submitted story and its review
                      discussion.
                    </p>
                    <div className="actions">
                      {operation("accept", "Accept review")}
                      {operation("decline", "Decline")}
                    </div>
                  </>
                ) : selected.state === "accepted" ? (
                  <div className="actions">
                    {operation("approve", "Approve this revision")}
                    <details>
                      <summary>Ask for changes</summary>
                      <ActionForm action={decideReview} className="form-stack">
                        <input name="id" type="hidden" value={selected.id} />
                        <input name="operation" type="hidden" value="changes" />
                        <label>
                          Requests — one per line
                          <textarea
                            name="requests"
                            maxLength={30000}
                            required
                          />
                        </label>
                        <label>
                          Note (optional)
                          <textarea name="note" maxLength={4000} />
                        </label>
                        <SubmitButton>Send back to writer</SubmitButton>
                      </ActionForm>
                    </details>
                    <details>
                      <summary>Step down</summary>
                      <p>
                        The writer will choose another reviewer. You will lose
                        access to this unfinished review.
                      </p>
                      {operation("step_down", "Confirm step down")}
                    </details>
                  </div>
                ) : (
                  <p className="badge">
                    You{" "}
                    {selected.decision === "approved"
                      ? "approved this revision"
                      : "requested changes"}
                  </p>
                )}
              </div>
              {body && (
                <article className="panel review-article">
                  {body.type === "event" && (
                    <p>
                      {body.venue} ·{" "}
                      {body.event_starts_at
                        ? formatDate(body.event_starts_at, true)
                        : ""}
                    </p>
                  )}
                  {previous ? (
                    <>
                      <RevisionDetailsChanges
                        previous={previous}
                        current={body}
                      />
                      <RevisionChanges
                        previous={previous.body}
                        current={body.body}
                      />
                    </>
                  ) : (
                    <RichContent document={body.body} />
                  )}
                </article>
              )}
              {requests?.data?.map((request) => (
                <div className="list-row" key={request.id}>
                  <p>
                    {request.text}
                    {request.resolved_at ? " · Marked fixed" : ""}
                  </p>
                  {request.fix_note && <p>{request.fix_note}</p>}
                </div>
              ))}
              {selected.state === "accepted" && (
                <ActionForm action={addComment} className="form-stack">
                  <input
                    name="article"
                    type="hidden"
                    value={selected.article_id}
                  />
                  <input name="key" type="hidden" value={randomUUID()} />
                  <label>
                    Comment to the writer
                    <textarea name="body" maxLength={4000} required />
                  </label>
                  <SubmitButton>Post comment</SubmitButton>
                </ActionForm>
              )}
              <p className="muted">
                Signed in as {profile.full_name}. Approval does not publish
                automatically.
              </p>
            </>
          ) : (
            <div className="empty">
              <h2>You’re caught up</h2>
              <p>New requests and second reads will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
