import Link from "next/link";
export const dynamic = "force-dynamic";
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="wrap">
          <Link className="site-brand" href="/" aria-label="ICG Home">
            ICG
          </Link>
          <nav className="site-nav" aria-label="Main">
            <Link href="/calendar">Calendar</Link>
            <Link href="/archive">Archive</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </header>
      <main id="main-content" className="wrap public-main">
        {children}
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <div>
            <Link className="site-brand" href="/">
              ICG
            </Link>
            <p>
              Campus life, on the record.
              <br />
              Integrated Communications Group · PLP
            </p>
          </div>
          <nav className="site-nav" aria-label="Footer">
            <Link href="/calendar">Campus calendar</Link>
            <Link href="/archive">The record</Link>
            <Link href="/contact">Get in touch</Link>
            <Link href="/login">The desk ↗</Link>
          </nav>
          <p>
            ©{" "}
            {new Intl.DateTimeFormat("en", {
              timeZone: "Asia/Manila",
              year: "numeric",
            }).format(new Date())}{" "}
            ICG
          </p>
        </div>
      </footer>
    </>
  );
}
