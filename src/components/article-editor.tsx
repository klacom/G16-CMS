"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import { Video } from "@/lib/tiptap-video";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import Image from "next/image";
import {
  contentSchema,
  plainText,
  safeLink,
  safeVideoUrl,
} from "@/lib/content";
import {
  articlePatchSchema,
  type ArticlePatch,
  type DeskArticle,
  type Revision,
} from "@/lib/records";
import { localInput, fromManilaInput } from "@/lib/dates";
import { saveArticle, submitArticle } from "@/app/dashboard/articles/actions";
import { RichContent } from "./rich-content";
import { ImageUpload } from "./image-upload";
import { useUnsavedChanges } from "./unsaved-changes";

type Props = {
  article: DeskArticle;
  revision: Revision;
  categories: {
    id: string | null;
    name: string | null;
    archived_at: string | null;
  }[];
  reviewers: { id: string; full_name: string }[];
};
export function ArticleEditor({
  article,
  revision,
  categories,
  reviewers,
}: Props) {
  const router = useRouter(),
    [hasChanges, setHasChanges] = useState(false),
    [draft, setDraft] = useState<ArticlePatch>(() =>
      articlePatchSchema.parse(revision),
    );
  const [cursor, setCursor] = useState({
      revision: revision.id,
      version: revision.version,
    }),
    [status, setStatus] = useState(article.status),
    [message, setMessage] = useState("All changes saved."),
    [conflict, setConflict] = useState(false),
    [preview, setPreview] = useState(false),
    [pending, startTransition] = useTransition(),
    [tagInput, setTagInput] = useState(revision.tags.join(", "));
  const draftRef = useRef(draft),
    cursorRef = useRef(cursor),
    savedRef = useRef(JSON.stringify(draft)),
    flight = useRef<Promise<boolean> | null>(null),
    mounted = useRef(true),
    conflictRef = useRef(false),
    invalidContentRef = useRef(false);
  const update = useCallback((patch: Partial<ArticlePatch>) => {
    setHasChanges(true);
    setDraft((current) => {
      const next = { ...current, ...patch };
      draftRef.current = next;
      return next;
    });
  }, []);
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (conflictRef.current || invalidContentRef.current) return false;
    while (flight.current) {
      const success = await flight.current;
      if (!success) return false;
    }
    const snapshot = draftRef.current,
      serialized = JSON.stringify(snapshot);
    if (savedRef.current === serialized) return true;
    const parsed = articlePatchSchema.safeParse(snapshot);
    if (!parsed.success) {
      setMessage(
        parsed.error.issues[0]?.message ??
          "Complete the image details before saving.",
      );
      return false;
    }
    setMessage("Saving…");
    const request = (async () => {
      const result = await saveArticle({
        id: article.id,
        revision: cursorRef.current.revision,
        version: cursorRef.current.version,
        patch: parsed.data,
      });
      if (!mounted.current) return false;
      if (!result.ok || !result.revisionId || !result.version) {
        setMessage(result.message);
        if (result.message.includes("Someone changed")) {
          setConflict(true);
          conflictRef.current = true;
        }
        return false;
      }
      const next = { revision: result.revisionId, version: result.version };
      cursorRef.current = next;
      setCursor(next);
      savedRef.current = serialized;
      setHasChanges(JSON.stringify(draftRef.current) !== serialized);
      setStatus("draft");
      setMessage("All changes saved.");
      return true;
    })();
    flight.current = request;
    try {
      return await request;
    } finally {
      flight.current = null;
    }
  }, [article.id]);
  useUnsavedChanges(hasChanges);
  useEffect(() => {
    const timer = setTimeout(() => {
      void saveNow();
    }, 900);
    return () => clearTimeout(timer);
  }, [draft, saveNow]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
        code: false,
        link: { openOnClick: false },
      }),
      ImageExtension.configure({ allowBase64: false }),
      Video,
    ],
    content: revision.body,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setHasChanges(true);
      const body = contentSchema.safeParse(editor.getJSON());
      invalidContentRef.current = !body.success;
      if (body.success) update({ body: body.data });
      else
        setMessage(
          "This formatting is not supported. Remove it before saving.",
        );
    },
  });
  const remaining = [
    ...(!draft.title.trim() ? ["title"] : []),
    ...(!draft.excerpt.trim() ? ["summary"] : []),
    ...(!draft.category_id ? ["category"] : []),
    ...(!plainText(draft.body).trim() ? ["story"] : []),
    ...(draft.type === "event" && !draft.event_starts_at ? ["event date"] : []),
    ...(draft.type === "event" && !draft.venue?.trim() ? ["venue"] : []),
    ...(draft.images.some((image) => !image.alt.trim())
      ? ["image alternative text"]
      : []),
  ];
  const dateField = (
    key: "event_starts_at" | "event_ends_at" | "display_until",
    label: string,
  ) => (
    <label>
      {label}
      <input
        type="datetime-local"
        value={localInput(draft[key])}
        onChange={(event) => {
          try {
            update({ [key]: fromManilaInput(event.target.value) });
          } catch {
            setMessage("Choose a valid Philippine date and time.");
          }
        }}
      />
    </label>
  );
  return (
    <>
      <div className="page-head">
        <div>
          <p className="kicker">Ready for review</p>
          <h1>Article editor</h1>
          <span className={`badge ${status}`}>
            {status.replace("_", " ")}
          </span>{" "}
          <span role="status" className="muted">
            {message}
          </span>
        </div>
        <div className="actions">
          <button
            className="button secondary"
            type="button"
            onClick={() => setPreview(!preview)}
          >
            {preview ? "Back to editing" : "Preview"}
          </button>
          <button
            className="button"
            type="button"
            disabled={pending || conflict}
            onClick={() =>
              startTransition(async () => {
                await saveNow();
              })
            }
          >
            Save draft
          </button>
        </div>
      </div>
      {article.published_revision_id && (
        <p className="notice">
          You are editing a new draft. The approved version stays on the site
          until this one is reviewed and published.
        </p>
      )}
      {["in_review", "approved"].includes(status) && (
        <p className="notice">
          Editing creates a new draft and requires reviewer approval again.
        </p>
      )}
      {conflict && (
        <div className="form-error" role="alert">
          <h2>A newer version is on the desk</h2>
          <p>
            Your text is still here. Copy any changes you need, then reload to
            continue from the latest version.
          </p>
          <button
            className="button secondary"
            onClick={() => window.location.reload()}
          >
            Reload latest version
          </button>
          <button
            className="button secondary"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(draftRef.current, null, 2)], {
                  type: "application/json",
                }),
              );
              const link = document.createElement("a");
              link.href = url;
              link.download = `icg-draft-${article.id}.json`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download your recovery copy
          </button>
        </div>
      )}
      {preview ? (
        <article className="panel">
          <p className="kicker">Private preview · {draft.type}</p>
          <h1>{draft.title}</h1>
          <p>{draft.excerpt}</p>
          {draft.type === "event" && (
            <p>
              {draft.venue} ·{" "}
              {draft.event_starts_at
                ? new Date(draft.event_starts_at).toLocaleString("en-PH", {
                    timeZone: "Asia/Manila",
                  })
                : "Date pending"}
            </p>
          )}
          <RichContent document={draft.body} />
        </article>
      ) : (
        <div className="split">
          <section className="panel">
            <div className="editor-document">
              <div className="form-grid">
                <label>
                  Type
                  <select
                    value={draft.type}
                    onChange={(event) =>
                      update({
                        type: event.target.value as ArticlePatch["type"],
                        ...(event.target.value !== "event"
                          ? {
                              event_starts_at: null,
                              event_ends_at: null,
                              venue: null,
                              map_url: null,
                            }
                          : {}),
                        ...(event.target.value !== "announcement"
                          ? { display_until: null }
                          : {}),
                      })
                    }
                  >
                    <option value="news">News</option>
                    <option value="event">Event</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </label>
                <label>
                  Category
                  <select
                    value={draft.category_id ?? ""}
                    onChange={(event) =>
                      update({ category_id: event.target.value || null })
                    }
                  >
                    <option value="">Choose a category</option>
                    {categories
                      .filter(
                        (category) =>
                          !category.archived_at ||
                          category.id === draft.category_id,
                      )
                      .map((category) => (
                        <option key={category.id} value={category.id ?? ""}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <label>
                Title
                <input
                  className="editor-title"
                  value={draft.title}
                  maxLength={240}
                  onChange={(event) => update({ title: event.target.value })}
                />
              </label>
              <label>
                Summary{" "}
                <span className="muted">{draft.excerpt.length}/200</span>
                <textarea
                  value={draft.excerpt}
                  maxLength={200}
                  onChange={(event) => update({ excerpt: event.target.value })}
                />
              </label>
              {draft.type === "event" && (
                <section className="ruled-section">
                  <h2>Event details</h2>
                  <div className="form-grid">
                    {dateField("event_starts_at", "Starts — Philippine time")}
                    {dateField("event_ends_at", "Ends (optional)")}
                    <label>
                      Venue
                      <input
                        value={draft.venue ?? ""}
                        maxLength={240}
                        onChange={(event) =>
                          update({ venue: event.target.value || null })
                        }
                      />
                    </label>
                    <label>
                      Google Maps or OpenStreetMap link
                      <input
                        type="url"
                        value={draft.map_url ?? ""}
                        onChange={(event) =>
                          update({ map_url: event.target.value || null })
                        }
                      />
                    </label>
                  </div>
                </section>
              )}
              {draft.type === "announcement" && (
                <section className="ruled-section">
                  {dateField(
                    "display_until",
                    "Stop showing in active announcements (optional)",
                  )}
                  <p className="muted">
                    The public article and archive entry remain available
                    afterwards.
                  </p>
                </section>
              )}
              <section className="ruled-section">
                <h2>Photos</h2>
                <ImageUpload
                  articleId={article.id}
                  onUploaded={(id) =>
                    update({
                      images: [
                        ...draftRef.current.images,
                        {
                          id,
                          alt: "",
                          credit: "",
                          caption: "",
                          cover: draftRef.current.images.length === 0,
                        },
                      ],
                    })
                  }
                />
                {draft.images.map((image, index) => (
                  <div className="panel" key={image.id}>
                    <Image
                      unoptimized
                      width={640}
                      height={400}
                      style={{ width: "100%", height: "auto" }}
                      src={`/media/${image.id}`}
                      alt={image.alt || "Newly uploaded image"}
                    />
                    <div className="form-stack">
                      <label>
                        Alternative text
                        <input
                          value={image.alt}
                          maxLength={300}
                          required
                          onChange={(event) =>
                            update({
                              images: draft.images.map((row, i) =>
                                i === index
                                  ? { ...row, alt: event.target.value }
                                  : row,
                              ),
                            })
                          }
                        />
                      </label>
                      <label>
                        Photo credit
                        <input
                          value={image.credit}
                          maxLength={200}
                          onChange={(event) =>
                            update({
                              images: draft.images.map((row, i) =>
                                i === index
                                  ? { ...row, credit: event.target.value }
                                  : row,
                              ),
                            })
                          }
                        />
                      </label>
                      <label>
                        Caption
                        <input
                          value={image.caption}
                          maxLength={500}
                          onChange={(event) =>
                            update({
                              images: draft.images.map((row, i) =>
                                i === index
                                  ? { ...row, caption: event.target.value }
                                  : row,
                              ),
                            })
                          }
                        />
                      </label>
                      <label className="check-label">
                        <input
                          type="radio"
                          name="cover"
                          checked={image.cover}
                          onChange={() =>
                            update({
                              images: draft.images.map((row, i) => ({
                                ...row,
                                cover: i === index,
                              })),
                            })
                          }
                        />
                        Use as cover
                      </label>
                      <div className="actions">
                        <button
                          type="button"
                          className="text-button"
                          disabled={index === 0}
                          onClick={() => {
                            const rows = [...draft.images];
                            [rows[index - 1], rows[index]] = [
                              rows[index],
                              rows[index - 1],
                            ];
                            update({ images: rows });
                          }}
                        >
                          Move up
                        </button>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() =>
                            editor
                              ?.chain()
                              .focus()
                              .setImage({
                                src: `/media/${image.id}`,
                                alt: image.alt,
                              })
                              .run()
                          }
                          disabled={!image.alt.trim()}
                        >
                          Insert in story
                        </button>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() =>
                            update({
                              images: draft.images.filter(
                                (_, i) => i !== index,
                              ),
                            })
                          }
                        >
                          Remove from gallery
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
              <section className="ruled-section">
                <h2>Story</h2>
                <div
                  className="editor-toolbar"
                  role="toolbar"
                  aria-label="Story formatting"
                >
                  <button
                    type="button"
                    aria-label="Bold"
                    aria-pressed={editor?.isActive("bold") ?? false}
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    aria-label="Italic"
                    aria-pressed={editor?.isActive("italic") ?? false}
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    aria-label="Heading"
                    aria-pressed={
                      editor?.isActive("heading", { level: 2 }) ?? false
                    }
                    onClick={() =>
                      editor?.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    aria-label="Bullet list"
                    onClick={() =>
                      editor?.chain().focus().toggleBulletList().run()
                    }
                  >
                    List
                  </button>
                  <button
                    type="button"
                    aria-label="Numbered list"
                    onClick={() =>
                      editor?.chain().focus().toggleOrderedList().run()
                    }
                  >
                    1.
                  </button>
                  <button
                    type="button"
                    aria-label="Quote"
                    onClick={() =>
                      editor?.chain().focus().toggleBlockquote().run()
                    }
                  >
                    Quote
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const value = window.prompt(
                        "HTTPS link or email address link",
                      );
                      if (value && safeLink(value))
                        editor
                          ?.chain()
                          .focus()
                          .setLink({ href: safeLink(value)! })
                          .run();
                      else if (value)
                        setMessage("Use an HTTPS or mailto link.");
                    }}
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const value = window.prompt(
                          "YouTube or Vimeo HTTPS link",
                        ),
                        src = value ? safeVideoUrl(value) : null;
                      if (src)
                        editor
                          ?.chain()
                          .focus()
                          .insertContent({ type: "video", attrs: { src } })
                          .run();
                      else if (value)
                        setMessage("Use a YouTube or Vimeo video link.");
                    }}
                  >
                    Video
                  </button>
                  <button
                    type="button"
                    aria-label="Undo"
                    onClick={() => editor?.chain().focus().undo().run()}
                  >
                    Undo
                  </button>
                </div>
                <EditorContent editor={editor} className="prose" />
              </section>
              <label>
                Tags (comma separated)
                <input
                  value={tagInput}
                  onChange={(event) => {
                    setTagInput(event.target.value);
                    update({
                      tags: event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .slice(0, 20),
                    });
                  }}
                />
              </label>
            </div>
          </section>
          <aside>
            <section className="panel">
              <h2>
                {remaining.length
                  ? `${remaining.length} left`
                  : "Ready for review"}
              </h2>
              <ul className="checklist">
                {[
                  "title",
                  "summary",
                  "category",
                  "story",
                  ...(draft.type === "event" ? ["event date", "venue"] : []),
                ].map((item) => (
                  <li
                    key={item}
                    className={remaining.includes(item) ? "" : "done"}
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="muted">
                Cover photos are recommended. Every image needs alternative
                text.
              </p>
            </section>
            <section className="ruled-section">
              <h2>Send for review</h2>
              <form
                className="form-stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  startTransition(async () => {
                    if (!(await saveNow())) return;
                    data.set("id", article.id);
                    data.set("revision", cursorRef.current.revision);
                    data.set("version", String(cursorRef.current.version));
                    const result = await submitArticle(
                      { ok: false, message: "" },
                      data,
                    );
                    setMessage(result.message);
                    if (result.ok) {
                      setStatus("in_review");
                      router.refresh();
                    }
                  });
                }}
              >
                <label>
                  Reviewer
                  <select name="reviewer" required defaultValue="">
                    <option value="" disabled>
                      Choose a reviewer
                    </option>
                    {reviewers.map((reviewer) => (
                      <option key={reviewer.id} value={reviewer.id}>
                        {reviewer.full_name}
                      </option>
                    ))}
                  </select>
                </label>
                {!reviewers.length && (
                  <p className="muted">
                    An admin needs to invite an independent reviewer first.
                  </p>
                )}
                <label>
                  Needed by (optional, Philippine time)
                  <input name="deadline" type="datetime-local" />
                </label>
                <label>
                  Note to reviewer (optional)
                  <textarea name="note" maxLength={2000} />
                </label>
                <button
                  className="button"
                  type="submit"
                  disabled={
                    pending ||
                    conflict ||
                    remaining.length > 0 ||
                    !reviewers.length ||
                    status === "in_review" ||
                    status === "approved"
                  }
                >
                  {pending ? "Sending…" : "Send for review"}
                </button>
              </form>
            </section>
          </aside>
        </div>
      )}
    </>
  );
}
