export const metadata = { robots: { index: false, follow: false } };
import Link from "next/link";
// Sign-in shell: the Campus Desk split screen (see design/prototypes/login-identity.html).
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="auth-shell">
      <aside className="auth-brand bg-night">
        <Link href="/" className="display">
          ICG
        </Link>
        <p>
          Campus life,
          <br />
          on the record.
        </p>
        <div className="auth-grid" aria-hidden="true">
          17
          <br />
          NOV
        </div>
        <small>
          Integrated Communications Group
          <br />
          Pamantasan ng Lungsod ng Pasig
        </small>
      </aside>
      <main className="auth-main">{children}</main>
    </div>
  );
}
