export const metadata = { robots: { index: false, follow: false } };
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DeskNavigation } from "@/components/desk-navigation";
import { logout } from "../(auth)/actions";
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireProfile();
  const client = await createSupabaseServerClient();
  const { count } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", profile.id)
    .is("read_at", null);
  return (
    <div className="desk">
      <DeskNavigation
        role={profile.role}
        name={profile.full_name}
        inboxCount={count ?? 0}
      />
      <main className="desk-main">
        <div className="desk-content fluid">
          <div className="desk-session">
            <span>{profile.full_name}</span>
            <form action={logout}>
              <button className="text-button">Sign out</button>
            </form>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
