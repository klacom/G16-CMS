import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ActionForm, SubmitButton } from "@/components/action-form";
import {
  saveProfile,
  changePassword,
  endOtherSessions,
  savePreferences,
} from "./actions";
import { formatDate } from "@/lib/dates";
import { ImageUpload } from "@/components/image-upload";
import Image from "next/image";
import { preferenceKinds } from "@/lib/preferences";
import { removePhoto } from "./actions";
export default async function AccountPage() {
  const profile = await requireProfile(),
    client = await createSupabaseServerClient();
  const [
    {
      data: { user },
    },
    { data: preference },
  ] = await Promise.all([
    client.auth.getUser(),
    client
      .from("notification_preferences")
      .select("email_preferences")
      .eq("user_id", profile.id)
      .maybeSingle(),
  ]);
  const preferences = preference?.email_preferences;
  const options = preferenceKinds(
    profile.role as "writer" | "reviewer" | "admin",
  );
  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">Your place on the desk</p>
          <h1>Account</h1>
          <p>Signed in as {user?.email}</p>
        </div>
      </header>
      <div className="split">
        <section className="panel">
          <h2>Profile</h2>
          <p className="muted">Your name and group appear in your byline.</p>
          <ActionForm guard action={saveProfile} className="form-stack">
            <label>
              Full name
              <input
                name="full_name"
                defaultValue={profile.full_name}
                minLength={3}
                maxLength={120}
                required
              />
            </label>
            <p className="muted">
              By {profile.full_name}
              {profile.affiliation ? `, ${profile.affiliation}` : ""}
            </p>
            <SubmitButton>Save profile</SubmitButton>
          </ActionForm>
          <dl className="facts">
            <dt>Role</dt>
            <dd>{profile.role}</dd>
            <dt>Group</dt>
            <dd>{profile.affiliation ?? "Not set"}</dd>
            <dt>Joined</dt>
            <dd>{formatDate(profile.created_at)}</dd>
          </dl>
          <p className="muted">
            An admin manages your email, role, group and account access.
          </p>
          <section className="ruled-section">
            <h2>Desk photo</h2>
            <p>Profile photos stay inside the desk.</p>
            {profile.avatar_path && (
              <>
                <Image
                  unoptimized
                  src={`/media/${profile.avatar_path}`}
                  width={96}
                  height={96}
                  alt="Your current desk photo"
                />
                <ActionForm guard action={removePhoto}>
                  <SubmitButton className="button secondary">
                    Remove photo
                  </SubmitButton>
                </ActionForm>
              </>
            )}
            <ImageUpload purpose="avatar" />
          </section>
        </section>
        <div>
          <section className="panel">
            <h2>Password</h2>
            <ActionForm guard action={changePassword} className="form-stack">
              <label>
                Current password
                <input
                  name="current_password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={128}
                />
              </label>
              <label>
                New password
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
              <label>
                Confirm password
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
              <label className="check-label">
                <input type="checkbox" name="signout_others" defaultChecked />
                Sign out on other devices
              </label>
              <SubmitButton>Change password</SubmitButton>
            </ActionForm>
          </section>
          <section id="email" className="ruled-section">
            <h2>Email notifications</h2>
            <ActionForm guard action={savePreferences} className="form-stack">
              {options.map((kind) => (
                <label key={kind} className="check-label">
                  <input
                    type="checkbox"
                    name={kind}
                    defaultChecked={
                      !preferences ||
                      typeof preferences !== "object" ||
                      Array.isArray(preferences) ||
                      preferences[kind] !== false
                    }
                  />
                  {kind.replaceAll("_", " ")}
                </label>
              ))}
              <p className="muted">Security notices: always sent.</p>
              <SubmitButton>Save email preferences</SubmitButton>
            </ActionForm>
          </section>
          <section className="ruled-section">
            <h2>Where you’re signed in</h2>
            <p>
              This browser is signed in. You can end your other sessions without
              leaving this one.
            </p>
            <ActionForm guard action={endOtherSessions}>
              <SubmitButton>Sign out everywhere else</SubmitButton>
            </ActionForm>
          </section>
        </div>
      </div>
    </>
  );
}
