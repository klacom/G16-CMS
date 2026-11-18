import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteDetails } from "@/lib/public-data";
import { checkDatabase } from "@/lib/actions";
import { mailConfigured } from "@/lib/mail-worker";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { RichTextField } from "@/components/rich-text-field";
import {
  saveSettings,
  saveCategory,
  saveTag,
  saveAbout,
  setFeatured,
  testMail,
} from "./actions";
export default async function SettingsPage() {
  await requireProfile(["admin"]);
  const client = await createSupabaseServerClient();
  const [details, taxonomy, tags, sections, selected, choices, status] =
    await Promise.all([
      siteDetails(),
      client.from("categories").select("*").order("name"),
      client.from("tags").select("*").order("name").limit(200),
      client.from("about_sections").select("*").order("position"),
      client.from("featured_stories").select("*").order("position"),
      client
        .from("public_articles")
        .select("id,title")
        .eq("visibility", "public")
        .order("published_at", { ascending: false })
        .limit(200),
      client.rpc("operations_status"),
    ]);
  for (const result of [taxonomy, tags, sections, selected, choices, status])
    checkDatabase(result.error);
  return (
    <>
      <header className="page-head">
        <div>
          <p className="kicker">What the public sees</p>
          <h1>Site settings</h1>
          <p>Keep the campus record accurate, useful and easy to find.</p>
        </div>
        <Link className="button secondary" href="/dashboard/settings/embeds">
          Embed widgets
        </Link>
      </header>
      <nav className="settings-nav actions">
        <a href="#featured">Featured</a>
        <a href="#categories">Categories & tags</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
        <a href="#mail">Mail</a>
      </nav>
      <section id="featured" className="ruled-section">
        <h2>Featured stories</h2>
        <p className="muted">
          Three places on Home. An unavailable selection falls back to a recent
          eligible story. Clear a place before moving its story elsewhere.
        </p>
        <div className="settings-grid">
          {[1, 2, 3].map((position) => (
            <ActionForm
              guard
              key={position}
              action={setFeatured}
              className="panel form-stack"
            >
              <input name="position" type="hidden" value={position} />
              <label>
                Place {position}
                <select
                  name="article"
                  defaultValue={
                    selected.data?.find((row) => row.position === position)
                      ?.article_id ?? ""
                  }
                >
                  <option value="">Use the latest eligible story</option>
                  {choices.data?.map((article) => (
                    <option value={article.id ?? ""} key={article.id}>
                      {article.title}
                    </option>
                  ))}
                </select>
              </label>
              <SubmitButton>Save place {position}</SubmitButton>
            </ActionForm>
          ))}
        </div>
      </section>
      <section id="categories" className="ruled-section">
        <h2>Categories</h2>
        <p className="muted">
          Renaming preserves links. Referenced categories are archived instead
          of deleted.
        </p>
        <ActionForm guard action={saveCategory} className="form-stack">
          <label>
            New category
            <input name="name" required maxLength={80} />
          </label>
          <SubmitButton>Add category</SubmitButton>
        </ActionForm>
        <ul className="list">
          {taxonomy.data?.map((category) => (
            <li key={category.id} className="list-row">
              <div>
                <strong>{category.name}</strong>
                <p className="muted">
                  {category.archived_at ? "Archived" : "Active"}
                </p>
              </div>
              <div>
                <ActionForm guard action={saveCategory} className="actions">
                  <input type="hidden" name="id" value={category.id ?? ""} />
                  <input type="hidden" name="operation" value="save" />
                  <label>
                    Rename {category.name}
                    <input
                      name="name"
                      defaultValue={category.name ?? ""}
                      maxLength={80}
                      required
                    />
                  </label>
                  <SubmitButton className="button secondary">
                    Rename
                  </SubmitButton>
                </ActionForm>
                <ActionForm guard action={saveCategory}>
                  <input type="hidden" name="id" value={category.id ?? ""} />
                  <input
                    type="hidden"
                    name="name"
                    value={category.name ?? ""}
                  />
                  <input
                    type="hidden"
                    name="operation"
                    value={category.archived_at ? "restore" : "archive"}
                  />
                  <SubmitButton className="text-button">
                    {category.archived_at ? "Restore" : "Archive"}
                  </SubmitButton>
                </ActionForm>
              </div>
            </li>
          ))}
        </ul>
        <h2>Tags</h2>
        <ActionForm guard action={saveTag} className="form-stack">
          <label>
            New tag
            <input name="name" maxLength={48} required />
          </label>
          <SubmitButton>Add tag</SubmitButton>
        </ActionForm>
        <ul className="list">
          {tags.data?.map((tag) => (
            <li className="list-row" key={tag.name}>
              <strong>{tag.name}</strong>
              <ActionForm guard action={saveTag}>
                <input type="hidden" name="name" value={tag.name ?? ""} />
                <input
                  type="hidden"
                  name="operation"
                  value={tag.archived_at ? "restore" : "archive"}
                />
                <SubmitButton className="button secondary">
                  {tag.archived_at ? "Restore" : "Archive"}
                </SubmitButton>
              </ActionForm>
            </li>
          ))}
        </ul>
      </section>
      <section id="about" className="ruled-section">
        <h2>About ICG</h2>
        <p className="muted">
          Introduction stays first; the call to action stays last. Empty
          sections are hidden.
        </p>
        {[
          ["introduction", "Introduction"],
          ["purpose", "Purpose"],
          ["our-work", "Our work"],
          ["values", "Values"],
          ["call-to-action", "Call to action"],
        ].map(([key, label], index) => {
          const section = sections.data?.find((row) => row.key === key);
          return (
            <details key={key} className="panel">
              <summary>{label}</summary>
              <ActionForm guard action={saveAbout} className="form-stack">
                <input type="hidden" name="key" value={key} />
                <label>
                  Heading
                  <input
                    name="heading"
                    maxLength={160}
                    defaultValue={section?.heading ?? label}
                  />
                </label>
                <label>
                  Order
                  <input
                    name="position"
                    type="number"
                    min={0}
                    max={9999}
                    defaultValue={section?.position ?? index}
                  />
                </label>
                <RichTextField initial={section?.body} />
                <SubmitButton>Save {label.toLowerCase()}</SubmitButton>
              </ActionForm>
            </details>
          );
        })}
      </section>
      <section id="contact" className="ruled-section">
        <h2>Contact details</h2>
        <ActionForm guard action={saveSettings} className="form-stack">
          {[
            ["office_address", "Office address"],
            ["office_hours", "Office hours"],
            ["office_hours_note", "Hours note"],
            ["contact_email", "Contact email"],
            ["events_email", "Events email"],
            ["phone", "Phone"],
            ["facebook_url", "Facebook URL"],
            ["instagram_url", "Instagram URL"],
            ["youtube_url", "YouTube URL"],
            ["tiktok_url", "TikTok URL"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                name={key}
                defaultValue={String(details[key as keyof typeof details])}
                maxLength={1000}
              />
            </label>
          ))}
          <label>
            Reply target
            <select
              name="reply_within_school_days"
              defaultValue={details.reply_within_school_days}
            >
              {[1, 2, 3, 5].map((days) => (
                <option key={days} value={days}>
                  {days} {days === 1 ? "weekday" : "weekdays"}
                </option>
              ))}
            </select>
          </label>
          <SubmitButton>Save public details</SubmitButton>
        </ActionForm>
      </section>
      <section id="mail" className="ruled-section">
        <h2>Mail service</h2>
        <p>
          {mailConfigured()
            ? "Resend sender configured. Send a test to verify delivery."
            : "Not configured. A verified sender and mail credentials are needed."}
        </p>
        <ActionForm guard action={testMail}>
          <SubmitButton>Send a test to my email</SubmitButton>
        </ActionForm>
        <p className="muted">Delivery and scheduler status</p>
        <dl className="facts">
          {status.data &&
            typeof status.data === "object" &&
            !Array.isArray(status.data) &&
            Object.entries(status.data).map(([key, value]) => (
              <div key={key}>
                <dt>{key.replaceAll("_", " ")}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
        </dl>
      </section>
    </>
  );
}
