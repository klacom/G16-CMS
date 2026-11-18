import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="wrap error-page">
      <p className="kicker">ICG · 404</p>
      <h1>This page is off the record.</h1>
      <p>The address may have changed, or this story is no longer available.</p>
      <div className="actions">
        <Link className="button" href="/">
          Back to campus
        </Link>
        <Link href="/archive">Search the archive</Link>
      </div>
    </main>
  );
}
