export const metadata = { robots: { index: false, follow: false } };
import Link from "next/link";
export const dynamic = "force-dynamic";
export default function EmbedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="widget">
      <header className="widget-head bg-night">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="ICG Home (opens a new tab)"
          className="display"
        >
          ICG
        </Link>
        <span>Campus life, on the record.</span>
      </header>
      <main className="widget-main">{children}</main>
    </div>
  );
}
