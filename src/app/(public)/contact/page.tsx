import { randomUUID } from "node:crypto";
import { z } from "zod";
import { siteDetails } from "@/lib/public-data";
import { ContactForm } from "@/components/contact-form";
export const metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact ICG",
};
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; article?: string }>;
}) {
  const query = await searchParams,
    details = await siteDetails(),
    article = z.uuid().safeParse(query.article);
  return (
    <>
      <p className="kicker">A line to the desk</p>
      <h1>Contact</h1>
      <p className="article-excerpt">
        A campus story, an event, a correction or a question — tell us.
      </p>
      <div className="split">
        <section>
          <h2>Send us a message</h2>
          <ContactForm
            requestKey={randomUUID()}
            topic={query.topic}
            article={article.success ? article.data : undefined}
          />
        </section>
        <aside className="panel">
          <h2>Visit the ICG desk</h2>
          {details.office_address ? (
            <p>{details.office_address}</p>
          ) : (
            <p className="muted">
              Office details will be added by the ICG desk.
            </p>
          )}
          {details.office_hours && <p>{details.office_hours}</p>}
          {details.office_hours_note && <p>{details.office_hours_note}</p>}
          {details.contact_email && (
            <p>
              <a href={`mailto:${details.contact_email}`}>
                {details.contact_email}
              </a>
            </p>
          )}
          {details.phone && <p>{details.phone}</p>}
          <p className="muted">
            Reply target: {details.reply_within_school_days} weekdays. Campus
            holidays and suspensions may affect the desk’s availability.
          </p>
        </aside>
      </div>
    </>
  );
}
