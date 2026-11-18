"use client";
import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="wrap error-page">
      <p className="kicker">ICG · A pause at the desk</p>
      <h1>We couldn’t load this page.</h1>
      <p>
        Your last request may not have finished. Try loading the page again.
      </p>
      <div className="actions">
        <button className="button" type="button" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/">Return to campus</Link>
      </div>
    </main>
  );
}
