import Link from "next/link";
import { requireProfile, siteOrigin } from "@/lib/auth";
import { manilaDay } from "@/lib/dates";
import { EmbedBuilder } from "@/components/embed-builder";
export default async function EmbedBuilderPage() {
  await requireProfile(["admin"]);
  return (
    <>
      <Link href="/dashboard/settings">← Site settings</Link>
      <header className="page-head">
        <div>
          <p className="kicker">The campus record, elsewhere</p>
          <h1>Embed widgets</h1>
          <p>
            Choose a widget, check its live preview, and copy the matching
            iframe.
          </p>
        </div>
      </header>
      <EmbedBuilder origin={siteOrigin()} today={manilaDay()} />
    </>
  );
}
