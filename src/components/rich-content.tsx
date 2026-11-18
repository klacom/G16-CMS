import type { ReactNode } from "react";
import Image from "next/image";
import type { Revision } from "@/lib/records";
import { formatDate } from "@/lib/dates";
import {
  contentSchema,
  safeLink,
  safeVideoUrl,
  type RichNode,
} from "@/lib/content";

function renderNode(node: RichNode, key: number | string): ReactNode {
  const children = node.content?.map((child, index) =>
    renderNode(child, index),
  );
  if (node.type === "text") {
    let text: ReactNode = node.text;
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") text = <strong>{text}</strong>;
      if (mark.type === "italic") text = <em>{text}</em>;
      if (mark.type === "underline") text = <u>{text}</u>;
      if (mark.type === "strike") text = <s>{text}</s>;
      if (mark.type === "link") {
        const url = safeLink(String(mark.attrs?.href ?? ""));
        if (url)
          text = (
            <a href={url} rel="noopener noreferrer">
              {text}
            </a>
          );
      }
    }
    return <span key={key}>{text}</span>;
  }
  switch (node.type) {
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "heading":
      return node.attrs?.level === 2 ? (
        <h2 key={key}>{children}</h2>
      ) : node.attrs?.level === 3 ? (
        <h3 key={key}>{children}</h3>
      ) : (
        <h4 key={key}>{children}</h4>
      );
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return <ol key={key}>{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    case "image":
      return (
        <figure key={key}>
          <Image
            unoptimized
            width={1200}
            height={800}
            style={{ width: "100%", height: "auto" }}
            src={String(node.attrs?.src)}
            alt={String(node.attrs?.alt ?? "")}
            loading="lazy"
          />
        </figure>
      );
    case "video": {
      const src = safeVideoUrl(String(node.attrs?.src ?? ""));
      return src ? (
        <iframe
          key={key}
          src={src}
          title="Embedded video"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="fullscreen; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      ) : null;
    }
    case "doc":
      return (
        <div key={key} className="prose">
          {children}
        </div>
      );
    default:
      return null;
  }
}
export function RichContent({ document }: { document: unknown }) {
  const parsed = contentSchema.parse(document);
  return renderNode(parsed, "document");
}
export function RevisionChanges({
  previous,
  current,
}: {
  previous: unknown;
  current: unknown;
}) {
  const before = contentSchema.parse(previous),
    after = contentSchema.parse(current);
  const prior = new Set(
    (before.content ?? []).map((node) => JSON.stringify(node)),
  );
  return (
    <div className="revision-comparison">
      <details>
        <summary>Previous submitted story</summary>
        <RichContent document={before} />
      </details>
      <div className="prose">
        {after.content?.map((node, index) =>
          prior.has(JSON.stringify(node)) ? (
            renderNode(node, index)
          ) : (
            <div key={index} className="changed-block">
              <span className="kicker">Added or changed</span>
              {renderNode(node, index)}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export function RevisionDetailsChanges({
  previous,
  current,
}: {
  previous: Revision;
  current: Revision;
}) {
  const date = (value: string | null) =>
    value ? formatDate(value, true) : "None";
  const photos = (revision: Revision) =>
    revision.images
      .map(
        (image, index) =>
          `${index + 1}. ${image.alt}${image.cover ? " (cover)" : ""}${image.credit ? ` · ${image.credit}` : ""}${image.caption ? ` · ${image.caption}` : ""}`,
      )
      .join("; ") || "None";
  const fields = [
    ["Title", previous.title, current.title],
    ["Summary", previous.excerpt, current.excerpt],
    ["Type", previous.type, current.type],
    ["Tags", previous.tags.join(", "), current.tags.join(", ")],
    ["Starts", date(previous.event_starts_at), date(current.event_starts_at)],
    ["Ends", date(previous.event_ends_at), date(current.event_ends_at)],
    ["Venue", previous.venue ?? "", current.venue ?? ""],
    ["Map", previous.map_url ?? "", current.map_url ?? ""],
    [
      "Announcement expiry",
      date(previous.display_until),
      date(current.display_until),
    ],
    ["Photos", photos(previous), photos(current)],
  ].filter(([, before, after]) => before !== after);
  if (!fields.length && previous.category_id === current.category_id)
    return null;
  return (
    <section className="ruled-section">
      <h3>Details changed since the previous submission</h3>
      {previous.category_id !== current.category_id && (
        <p>The category changed.</p>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Detail</th>
              <th>Previous</th>
              <th>Submitted now</th>
            </tr>
          </thead>
          <tbody>
            {fields.map(([label, before, after]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{before || "None"}</td>
                <td>{after || "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
