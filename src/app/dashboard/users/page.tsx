import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { checkDatabase } from "@/lib/actions";
import { pageNumber } from "@/lib/records";
import { formatDate } from "@/lib/dates";
import {
  invitePerson,
  withdrawInvite,
  managePerson,
  changePersonEmail,
} from "./actions";
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireProfile(["admin"]);
  const query = await searchParams,
    page = pageNumber(query.page),
    client = await createSupabaseServerClient();
  const [people, invites] = await Promise.all([
    client.rpc("people_directory", {
      p_offset: (page - 1) * 50,
      p_filter: query.role ?? "",
      p_query: query.q ?? "",
    }),
    client
      .from("invitations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  checkDatabase(people.error);
  checkDatabase(invites.error);
  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">People who keep the record</p>
          <h1>People</h1>
          <p>
            Invite contributors and manage their access. Their work stays on the
            record.
          </p>
        </div>
      </header>
      <details className="panel">
        <summary>Invite someone to the desk</summary>
        <ActionForm action={invitePerson} className="form-stack">
          <label>
            Email
            <input name="email" type="email" required />
          </label>
          <label>
            Full name (optional)
            <input name="full_name" maxLength={120} />
          </label>
          <label>
            Role
            <select name="role">
              <option value="writer">Writer</option>
              <option value="reviewer">Reviewer</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            Organization or office (optional)
            <input name="affiliation" maxLength={160} />
          </label>
          <p className="muted">
            The invitation expires in 24 hours. Any previous pending invitation
            to this address will be withdrawn.
          </p>
          <SubmitButton>Send invitation</SubmitButton>
        </ActionForm>
      </details>
      <form className="filters">
        <label>
          Find a person
          <input name="q" defaultValue={query.q} maxLength={120} />
        </label>
        <label>
          Access
          <select name="role" defaultValue={query.role ?? ""}>
            <option value="">Everyone</option>
            <option value="writer">Writers</option>
            <option value="reviewer">Reviewers</option>
            <option value="admin">Admins</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button className="button secondary">Filter</button>
      </form>
      <ul className="list">
        {people.data?.map((person) => (
          <li className="list-row" key={person.id}>
            <div>
              <h2>{person.full_name}</h2>
              <p>{person.email}</p>
              <span className="badge">
                {person.deactivated_at ? "Inactive" : person.role}
              </span>
            </div>
            <details>
              <summary>Manage access</summary>
              <ActionForm action={managePerson} className="form-stack">
                <input type="hidden" name="id" value={person.id} />
                <label>
                  Role
                  <select name="role" defaultValue={person.role}>
                    <option value="writer">Writer</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label>
                  Group
                  <input
                    name="affiliation"
                    defaultValue={person.affiliation ?? ""}
                    maxLength={160}
                  />
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    name="deactivated"
                    defaultChecked={!!person.deactivated_at}
                  />
                  Deactivate desk access
                </label>
                <p className="muted">
                  Changing reviewer access cancels unfinished assignments.
                  Reactivation requires a new sign-in.
                </p>
                <SubmitButton>Update access</SubmitButton>
              </ActionForm>
              <ActionForm action={changePersonEmail} className="form-stack">
                <input type="hidden" name="id" value={person.id} />
                <label>
                  New sign-in email
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={person.email}
                  />
                </label>
                <p className="muted">
                  Confirm this address with the person first. Their sessions
                  will end.
                </p>
                <SubmitButton>Change email</SubmitButton>
              </ActionForm>
            </details>
          </li>
        ))}
      </ul>
      {!people.data?.length && (
        <div className="empty">
          <h2>No matching people</h2>
          <p>Try a different search or access filter.</p>
        </div>
      )}
      <nav className="pagination">
        {page > 1 && (
          <Link
            href={`?${new URLSearchParams({ ...query, page: String(page - 1) } as Record<string, string>)}`}
          >
            Previous
          </Link>
        )}
        {(people.data?.[0]?.total ?? 0) > page * 50 && (
          <Link
            href={`?${new URLSearchParams({ ...query, page: String(page + 1) } as Record<string, string>)}`}
          >
            Next
          </Link>
        )}
      </nav>
      <section className="ruled-section">
        <h2>Invitations</h2>
        <ul className="list">
          {invites.data?.map((invite) => (
            <li className="list-row" key={invite.id}>
              <div>
                <strong>{invite.email}</strong>
                <p>
                  {invite.role} · {invite.state} · expires{" "}
                  {formatDate(invite.expires_at, true)}
                </p>
                {invite.delivery_error && (
                  <p className="form-error">
                    Delivery failed. Resend after checking mail setup.
                  </p>
                )}
              </div>
              <div>
                {invite.state !== "accepted" && (
                  <ActionForm action={invitePerson}>
                    <input type="hidden" name="email" value={invite.email} />
                    <input type="hidden" name="role" value={invite.role} />
                    <input
                      type="hidden"
                      name="full_name"
                      value={invite.full_name ?? ""}
                    />
                    <input
                      type="hidden"
                      name="affiliation"
                      value={invite.affiliation ?? ""}
                    />
                    <SubmitButton>Resend</SubmitButton>
                  </ActionForm>
                )}
                {invite.state === "pending" && (
                  <ActionForm action={withdrawInvite}>
                    <input type="hidden" name="id" value={invite.id} />
                    <SubmitButton className="text-button">
                      Withdraw
                    </SubmitButton>
                  </ActionForm>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
