import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireProfile } from "@/lib/auth";
import { getDeskArticle, categories } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ArticleEditor } from "@/components/article-editor";
import { ActionForm, SubmitButton } from "@/components/action-form";
import {
  publishArticle,
  publicationAction,
  resolveRequest,
  addComment,
} from "../../actions";
import { formatDate } from "@/lib/dates";
export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile(["writer", "admin"]),
    { id } = await params;
  if (id === "new") redirect("/dashboard/articles/new");
  if (!z.uuid().safeParse(id).success) notFound();
  const client = await createSupabaseServerClient(),
    { article, revision } = await getDeskArticle(id);
  const [taxonomy, reviewers, assignments, comments] = await Promise.all([
    categories(),
    client.rpc("reviewer_directory"),
    client
      .from("review_assignments")
      .select("*")
      .eq("article_id", id)
      .order("round", { ascending: false })
      .limit(30),
    client
      .from("review_comments")
      .select("*")
      .eq("article_id", id)
      .order("created_at")
      .limit(100),
  ]);
  const latest = assignments.data?.[0];
  const requests = latest
    ? await client
        .from("review_requests")
        .select("*")
        .eq("assignment_id", latest.id!)
        .order("id")
    : null;
  return (
    <>
      <Link href="/dashboard/articles">← My articles</Link>
      <ArticleEditor
        key={`${revision.id}:${article.status}`}
        article={article}
        revision={revision}
        categories={taxonomy}
        reviewers={reviewers.data ?? []}
      />
      <div className="split">
        <section className="ruled-section">
          <h2>Review conversation</h2>
          {latest && (
            <p className="muted">
              Round {latest.round} · {latest.state}
              {latest.decision ? ` · ${latest.decision.replace("_", " ")}` : ""}
              {latest.needed_by
                ? ` · Needed ${formatDate(latest.needed_by, true)}`
                : ""}
            </p>
          )}
          {latest?.decision_note && <p>{latest.decision_note}</p>}
          {requests?.data?.map((request) => (
            <div className="panel" key={request.id}>
              <p className={request.resolved_at ? "done" : ""}>
                {request.text}
              </p>
              {request.fix_note && <p>{request.fix_note}</p>}
              <ActionForm action={resolveRequest} className="form-stack">
                <input type="hidden" name="request" value={request.id ?? ""} />
                <input
                  type="hidden"
                  name="resolved"
                  value={String(!request.resolved_at)}
                />
                <label>
                  Fix note (optional)
                  <input
                    name="fix_note"
                    maxLength={1000}
                    defaultValue={request.fix_note ?? ""}
                  />
                </label>
                <SubmitButton>
                  {request.resolved_at ? "Mark unresolved" : "Mark as fixed"}
                </SubmitButton>
              </ActionForm>
            </div>
          ))}
          {comments.data?.map((comment) => (
            <div className="list-row" key={comment.id}>
              <div>
                <small>
                  {comment.author_id === profile.id
                    ? "You"
                    : "Desk contributor"}{" "}
                  ·{" "}
                  {comment.created_at
                    ? formatDate(comment.created_at, true)
                    : ""}
                </small>
                <p>{comment.body}</p>
              </div>
            </div>
          ))}
          {!latest && !comments.data?.length && (
            <p className="muted">
              No comments yet. Your reviewer’s requests will appear here.
            </p>
          )}
          <ActionForm action={addComment} className="form-stack">
            <input type="hidden" name="article" value={id} />
            <input type="hidden" name="key" value={randomUUID()} />
            <label>
              Reply or add a note
              <textarea name="body" maxLength={4000} required />
            </label>
            <SubmitButton>Post comment</SubmitButton>
          </ActionForm>
        </section>
        <aside className="ruled-section">
          <h2>Publication</h2>
          {article.status === "approved" ? (
            <ActionForm action={publishArticle} className="form-stack">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="revision" value={revision.id} />
              <p>This exact revision has reviewer approval.</p>
              <label>
                Schedule (optional, Philippine time)
                <input name="schedule" type="datetime-local" />
              </label>
              <p className="muted">Leave blank to publish now.</p>
              <SubmitButton>Publish approved revision</SubmitButton>
            </ActionForm>
          ) : (
            <p className="muted">
              A reviewer must approve the current revision before it can be
              published.
            </p>
          )}
          {article.scheduled_at && (
            <p>Scheduled {formatDate(article.scheduled_at, true)}</p>
          )}
          <div className="actions">
            {[
              ...(article.visibility === "public" ? ["archive"] : []),
              ...(article.visibility === "archived" ? ["restore"] : []),
              ...(profile.role === "admin" &&
              article.published_revision_id &&
              article.visibility !== "withdrawn"
                ? ["withdraw"]
                : []),
              ...(profile.role === "admin" && article.visibility === "withdrawn"
                ? ["restore_withdrawn"]
                : []),
              ...(!article.published_revision_id ? ["delete"] : []),
              ...(article.scheduled_at ? ["cancel_schedule"] : []),
            ].map((operation) => (
              <ActionForm key={operation} action={publicationAction}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="revision" value={revision.id} />
                <input type="hidden" name="operation" value={operation} />
                <SubmitButton className="button secondary">
                  {operation.charAt(0).toUpperCase() +
                    operation.slice(1).replaceAll("_", " ")}
                </SubmitButton>
              </ActionForm>
            ))}
          </div>
          {article.published_revision_id &&
            article.visibility !== "withdrawn" && (
              <p>
                <Link href={`/news/${article.slug}`}>
                  Read the public version ↗
                </Link>
              </p>
            )}
        </aside>
      </div>
    </>
  );
}
