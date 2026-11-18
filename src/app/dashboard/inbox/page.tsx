import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkDatabase } from "@/lib/actions";
import { pageNumber } from "@/lib/records";
import { formatDate } from "@/lib/dates";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { readNotice } from "./actions";
export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireProfile(),
    params = await searchParams,
    page = pageNumber(params.page),
    client = await createSupabaseServerClient();
  let query = client
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("recipient_id", profile.id);
  if (params.unread === "1") query = query.is("read_at", null);
  const result = await query
    .order("created_at", { ascending: false })
    .order("id")
    .range((page - 1) * 30, page * 30 - 1);
  checkDatabase(result.error);
  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">What the desk needs you to know</p>
          <h1>Inbox</h1>
          <p>
            Notices stay here for 90 days. Reading one does not complete its
            task.
          </p>
        </div>
        <ActionForm action={readNotice}>
          <SubmitButton>Mark all read</SubmitButton>
        </ActionForm>
      </header>
      <nav className="actions">
        <Link href="/dashboard/inbox">All notices</Link>
        <Link href="/dashboard/inbox?unread=1">Unread</Link>
        <Link href="/dashboard">Waiting on you →</Link>
      </nav>
      <ul className="list">
        {result.data?.map((notice) => {
          let path = "/dashboard/account";
          if (notice.review_id && profile.role === "reviewer")
            path = `/dashboard/reviews/${notice.review_id}`;
          else if (notice.article_id)
            path =
              profile.role === "reviewer"
                ? "/dashboard/reviews"
                : `/dashboard/articles/${notice.article_id}/edit`;
          else if (notice.kind === "contact_messages")
            path = "/dashboard/messages";
          else if (notice.kind.startsWith("invite_")) path = "/dashboard/users";
          const payload = notice.payload;
          const title =
            payload &&
            typeof payload === "object" &&
            !Array.isArray(payload) &&
            typeof payload.title === "string"
              ? payload.title
              : notice.kind.replaceAll("_", " ");
          return (
            <li className="list-row" key={notice.id}>
              <div>
                <small>{formatDate(notice.created_at, true)}</small>
                <h2>
                  <Link href={path}>
                    {!notice.read_at && (
                      <span className="unread-dot" aria-label="Unread" />
                    )}
                    {title}
                  </Link>
                </h2>
                <p className="muted">{notice.kind.replaceAll("_", " ")}</p>
              </div>
              {!notice.read_at && (
                <ActionForm action={readNotice}>
                  <input name="id" type="hidden" value={notice.id} />
                  <SubmitButton className="button secondary">
                    Mark read
                  </SubmitButton>
                </ActionForm>
              )}
            </li>
          );
        })}
      </ul>
      {!result.data?.length && (
        <div className="empty">
          <h2>No notices here</h2>
          <p>Your workflow and account updates will appear in this inbox.</p>
        </div>
      )}
      <nav className="pagination">
        {page > 1 && (
          <Link href={`?page=${page - 1}&unread=${params.unread ?? ""}`}>
            Previous
          </Link>
        )}
        {page * 30 < (result.count ?? 0) && (
          <Link href={`?page=${page + 1}&unread=${params.unread ?? ""}`}>
            Next
          </Link>
        )}
      </nav>
    </>
  );
}
