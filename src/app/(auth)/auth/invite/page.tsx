import Link from "next/link";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { formatDate } from "@/lib/dates";
import { acceptInvitation } from "./actions";
export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ invitation?: string }>;
}) {
  const query = await searchParams,
    id = z.uuid().safeParse(query.invitation);
  const client = await createSupabaseServerClient();
  const details = id.success
    ? await client.rpc("invitation_details", { p_id: id.data }).maybeSingle()
    : null;
  if (!details?.data)
    return (
      <>
        <p className="kicker">An invitation to the desk</p>
        <h1>This link is unavailable.</h1>
        <p>
          It may have expired, been withdrawn, or already been used. Ask an ICG
          admin to send a new invitation.
        </p>
        <Link className="button" href="/login">
          Go to sign in
        </Link>
      </>
    );
  const invite = details.data;
  return (
    <>
      <p className="kicker">You’re invited</p>
      <h1>Join the desk.</h1>
      <div className="panel">
        <p>
          {invite.inviter_name} invited <strong>{invite.email}</strong> as a{" "}
          <strong>{invite.role}</strong>.
        </p>
        <p className="muted">Expires {formatDate(invite.expires_at, true)}</p>
      </div>
      <ActionForm action={acceptInvitation} className="form-stack">
        <input type="hidden" name="invitation" value={invite.id} />
        <label>
          Full name
          <input
            name="full_name"
            defaultValue={invite.full_name ?? ""}
            minLength={3}
            maxLength={120}
            required
            autoComplete="name"
          />
        </label>
        {invite.affiliation && (
          <p>Organization or office: {invite.affiliation}</p>
        )}
        <label>
          Password
          <input
            name="password"
            type="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirm password
          <input
            name="confirm"
            type="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        <SubmitButton>Join the desk</SubmitButton>
      </ActionForm>
    </>
  );
}
