import Link from "next/link";
import { publicClient } from "@/lib/data";
import { checkDatabase } from "@/lib/actions";
import { RichContent } from "@/components/rich-content";
export const metadata = {
  alternates: { canonical: "/about" },
  title: "About ICG",
};
export default async function AboutPage() {
  const { data, error } = await publicClient()
    .from("about_sections")
    .select("*")
    .order("position")
    .order("key");
  checkDatabase(error);
  return (
    <>
      <p className="kicker">Integrated Communications Group</p>
      <h1>
        Campus life,
        <br />
        on the record.
      </h1>
      <p className="article-excerpt">
        ICG brings PLP’s news, events and announcements into one shared campus
        record.
      </p>
      {data
        ?.filter(
          (section) =>
            section.body_text?.trim() ||
            /"type"\s*:\s*"(?:image|video)"/.test(JSON.stringify(section.body)),
        )
        .map((section) => (
          <section className="ruled-section" key={section.key}>
            <h2>{section.heading}</h2>
            <RichContent document={section.body} />
          </section>
        ))}
      <section className="ruled-section">
        <h2>Have something for the record?</h2>
        <p>
          Tell the desk about a campus story, an upcoming event or a correction.
        </p>
        <Link className="button" href="/contact">
          Contact ICG
        </Link>
      </section>
    </>
  );
}
