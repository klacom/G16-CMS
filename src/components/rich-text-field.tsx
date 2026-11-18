"use client";
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { emptyDocument, safeLink, safeVideoUrl } from "@/lib/content";
import ImageExtension from "@tiptap/extension-image";
import { Video } from "@/lib/tiptap-video";
import { ImageUpload } from "./image-upload";
export function RichTextField({
  initial,
  name = "body",
}: {
  initial?: unknown;
  name?: string;
}) {
  const [value, setValue] = useState(JSON.stringify(initial ?? emptyDocument));
  const [alt, setAlt] = useState("");
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
    content: initial ?? emptyDocument,
    immediatelyRender: false,
    onUpdate: ({ editor }) => setValue(JSON.stringify(editor.getJSON())),
  });
  return (
    <div className="panel">
      <input type="hidden" name={name} value={value} />
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label="Section formatting"
      >
        <button
          type="button"
          aria-label="Bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          aria-label="Italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          Heading
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => {
            const link = window.prompt("HTTPS or mailto link");
            if (link && safeLink(link))
              editor
                ?.chain()
                .focus()
                .setLink({ href: safeLink(link)! })
                .run();
          }}
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("YouTube or Vimeo link");
            const src = url ? safeVideoUrl(url) : null;
            if (src)
              editor
                ?.chain()
                .focus()
                .insertContent({ type: "video", attrs: { src } })
                .run();
          }}
        >
          Video
        </button>
      </div>
      <EditorContent editor={editor} className="prose" />
      <details>
        <summary>Add a photo</summary>
        <label>
          Alternative text for the new photo
          <input
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            maxLength={300}
          />
        </label>
        {alt.trim() ? (
          <ImageUpload
            purpose="about"
            onUploaded={(id) => {
              editor
                ?.chain()
                .focus()
                .setImage({ src: `/media/${id}`, alt: alt.trim() })
                .run();
            }}
          />
        ) : (
          <p className="muted">Describe the photo before uploading it.</p>
        )}
      </details>
    </div>
  );
}
