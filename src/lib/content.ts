import { z } from "zod";

export type RichMark = {
  type: string;
  attrs?: Record<string, string | number | boolean | null>;
};
export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, string | number | boolean | null>;
  marks?: RichMark[];
  content?: RichNode[];
};
export type RichDocument = RichNode & { type: "doc" };
export const emptyDocument: RichDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
const nodeTypes = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
  "horizontalRule",
  "image",
  "video",
]);
const markTypes = new Set(["bold", "italic", "strike", "underline", "link"]);

export function safeLink(value: string): string | null {
  try {
    const url = new URL(value);
    return ["https:", "mailto:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function safeMapUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const allowed = [
      "maps.google.com",
      "www.google.com",
      "maps.app.goo.gl",
      "goo.gl",
      "www.openstreetmap.org",
      "openstreetmap.org",
    ];
    return url.protocol === "https:" &&
      allowed.includes(url.hostname) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function safeVideoUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (
      [
        "youtube.com",
        "www.youtube.com",
        "youtu.be",
        "www.youtube-nocookie.com",
      ].includes(url.hostname)
    ) {
      const id =
        url.hostname === "youtu.be"
          ? url.pathname.slice(1)
          : (url.searchParams.get("v") ??
            url.pathname.match(/^\/embed\/([^/]+)$/)?.[1]);
      return id && /^[\w-]{11}$/.test(id)
        ? `https://www.youtube-nocookie.com/embed/${id}`
        : null;
    }
    if (
      ["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(url.hostname)
    ) {
      const id = url.pathname.match(/^\/(?:video\/)?(\d{1,12})$/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}
function validContent(value: unknown): value is RichDocument {
  if (
    !value ||
    typeof value !== "object" ||
    !("type" in value) ||
    value.type !== "doc"
  )
    return false;
  let count = 0;
  const visit = (input: unknown, depth: number): boolean => {
    if (
      ++count > 2500 ||
      depth > 20 ||
      !input ||
      typeof input !== "object" ||
      Array.isArray(input)
    )
      return false;
    const n = input as Record<string, unknown>;
    if (
      Object.keys(n).some(
        (k) => !["type", "text", "attrs", "marks", "content"].includes(k),
      ) ||
      typeof n.type !== "string" ||
      !nodeTypes.has(n.type)
    )
      return false;
    if (
      n.text !== undefined &&
      (typeof n.text !== "string" ||
        n.type !== "text" ||
        n.text.length > 100_000)
    )
      return false;
    if (n.type === "text" && typeof n.text !== "string") return false;
    if (
      ["text", "hardBreak", "horizontalRule", "image", "video"].includes(
        n.type,
      ) &&
      n.content !== undefined
    )
      return false;
    if (
      n.attrs !== undefined &&
      (!n.attrs || typeof n.attrs !== "object" || Array.isArray(n.attrs))
    )
      return false;
    const attrs = (n.attrs ?? {}) as Record<string, unknown>;
    if (
      Object.values(attrs).some(
        (v) =>
          v !== null && !["string", "number", "boolean"].includes(typeof v),
      )
    )
      return false;
    if (n.type === "heading" && ![2, 3, 4].includes(Number(attrs.level)))
      return false;
    if (
      n.type === "image" &&
      (typeof attrs.src !== "string" ||
        !/^\/media\/[0-9a-f-]{36}$/.test(attrs.src))
    )
      return false;
    if (
      n.type === "video" &&
      (typeof attrs.src !== "string" || !safeVideoUrl(attrs.src))
    )
      return false;
    if (
      n.marks !== undefined &&
      (!Array.isArray(n.marks) ||
        n.marks.some((m) => {
          if (
            !m ||
            typeof m !== "object" ||
            !markTypes.has(m.type) ||
            Object.keys(m).some((k) => !["type", "attrs"].includes(k))
          )
            return true;
          return (
            m.type === "link" &&
            (typeof m.attrs?.href !== "string" || !safeLink(m.attrs.href))
          );
        }))
    )
      return false;
    return (
      n.content === undefined ||
      (Array.isArray(n.content) &&
        n.content.every((child) => visit(child, depth + 1)))
    );
  };
  return JSON.stringify(value).length <= 512_000 && visit(value, 0);
}
export const contentSchema = z.custom<RichDocument>(
  validContent,
  "Use supported article formatting and safe links.",
);
export function plainText(node: RichNode): string {
  return (
    node.text ?? (node.content ?? []).map(plainText).filter(Boolean).join(" ")
  );
}
