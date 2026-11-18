"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
export function ImageUpload({
  articleId,
  onUploaded,
  purpose = "article",
}: {
  articleId?: string;
  onUploaded?: (id: string) => void;
  purpose?: "article" | "avatar" | "about";
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    router = useRouter();
  return (
    <div>
      <label>
        {purpose === "avatar"
          ? "Choose a desk photo"
          : "Add a cover or gallery photo"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            if (file.size > 4 * 1024 * 1024) {
              setMessage("Choose an image up to 4 MB.");
              return;
            }
            setBusy(true);
            setMessage("Uploading…");
            try {
              const data = new FormData();
              data.set("file", file);
              data.set("purpose", purpose);
              if (articleId) data.set("article", articleId);
              const response = await fetch("/media/upload", {
                method: "POST",
                body: data,
                headers: { Accept: "application/json" },
              });
              const value = await response.json();
              if (!response.ok)
                throw new Error(
                  z.object({ error: z.string() }).parse(value).error,
                );
              const result = z.object({ id: z.uuid() }).parse(value);
              onUploaded?.(result.id);
              setMessage("Image uploaded.");
              if (purpose === "avatar") router.refresh();
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Upload failed. Try again.",
              );
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      <p className="muted">
        JPG, PNG or WebP, up to 4 MB.{" "}
        {purpose === "avatar"
          ? "Visible only inside the desk."
          : "Add alternative text and credit before saving."}
      </p>
      <p role="status">{message}</p>
    </div>
  );
}
