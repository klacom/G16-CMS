import Link from "next/link";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkDatabase } from "@/lib/actions";
import { formatDate } from "@/lib/dates";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { MarkMessageRead } from "@/components/mark-message-read";
import { mailConfigured } from "@/lib/mail-worker";
import { replyContact, messageAction } from "../actions";
export default async function MessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile(["admin"]);
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const client = await createSupabaseServerClient();
  const [record, replies] = await Promise.all([
    client.from("contact_messages").select("*").eq("id", id).maybeSingle(),
    client
      .from("contact_replies")
      .select("*")
      .eq("message_id", id)
      .order("created_at")
      .limit(100),
  ]);
  checkDatabase(record.error);
  checkDatabase(replies.error);
  if (!record.data) notFound();
  const message = z
    .object({
      id: z.uuid(),
      version: z.number(),
      subject: z.string(),
      body: z.string(),
      email: z.string(),
      first_name: z.string(),
      last_name: z.string(),
      topic: z.string(),
      status: z.string(),
      created_at: z.string(),
      event_title: z.string().nullable(),
      event_starts_at: z.string().nullable(),
      event_place: z.string().nullable(),
    })
    .parse(record.data);
  const waiting = replies.data?.some((reply) =>
    ["queued", "sending"].includes(reply.delivery_status ?? ""),
  );
  return (
    <>
      <MarkMessageRead id={id} />
      <Link href="/dashboard/messages">← All messages</Link>
      <header className="page-head">
        <div>
          <p className="kicker">
            {message.topic} · {formatDate(message.created_at, true)}
          </p>
          <h1>{message.subject}</h1>
          <p>
            {message.first_name} {message.last_name} ·{" "}
            <a href={`mailto:${encodeURIComponent(message.email)}`}>
              {message.email}
            </a>
          </p>
        </div>
        <span className="badge">{message.status}</span>
      </header>
      <div className="split">
        <section>
          <div className="panel message-body">{message.body}</div>
          {message.event_title && (
            <section className="panel">
              <h2>{message.event_title}</h2>
              <p>
                {message.event_starts_at
                  ? formatDate(message.event_starts_at, true)
                  : ""}{" "}
                · {message.event_place}
              </p>
              <Link href="/dashboard/articles/new">
                Start an event article →
              </Link>
            </section>
          )}
          <section className="ruled-section">
            <h2>Replies</h2>
            {replies.data?.map((reply) => (
              <article className="panel" key={reply.id}>
                <p className="message-body">{reply.body}</p>
                <small>
                  {reply.created_at ? formatDate(reply.created_at, true) : ""} ·{" "}
                  {reply.delivery_status}
                </small>
              </article>
            ))}
            {!replies.data?.length && (
              <p className="muted">No desk replies yet.</p>
            )}
          </section>
          {!mailConfigured() && (
            <p className="notice">
              Email delivery is not configured. Replies can be queued, but will
              wait until the sender and mail worker are connected.
            </p>
          )}
          <ActionForm action={replyContact} className="form-stack">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="version" value={message.version} />
            <input type="hidden" name="key" value={randomUUID()} />
            <label>
              Reply to {message.first_name}
              <textarea
                name="body"
                maxLength={10000}
                rows={7}
                required
                disabled={waiting || message.status === "closed"}
              />
            </label>
            <SubmitButton>
              {waiting ? "Reply pending" : "Queue reply"}
            </SubmitButton>
          </ActionForm>
        </section>
        <aside className="panel">
          <h2>Message actions</h2>
          {(message.status === "closed"
            ? ["reopen"]
            : ["mark_replied", "close"]
          ).map((operation) => (
            <ActionForm key={operation} action={messageAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="version" value={message.version} />
              <input type="hidden" name="operation" value={operation} />
              <SubmitButton className="button secondary">
                {operation.replaceAll("_", " ")}
              </SubmitButton>
            </ActionForm>
          ))}
          <details className="ruled-section">
            <summary>Delete message</summary>
            <p>
              This removes the private message and replies. Its audit entry
              remains.
            </p>
            <ActionForm action={messageAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="version" value={message.version} />
              <input type="hidden" name="operation" value="delete" />
              <SubmitButton className="button danger">
                Confirm deletion
              </SubmitButton>
            </ActionForm>
          </details>
        </aside>
      </div>
    </>
  );
}
