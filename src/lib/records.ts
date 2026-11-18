import { z } from "zod";
import { contentSchema } from "./content";
import type { Json } from "./supabase/database.types";

export const imageSchema = z.object({
  id: z.uuid(),
  alt: z.string().trim().min(1, "Add alternative text.").max(300),
  credit: z.string().max(200).default(""),
  caption: z.string().max(500).default(""),
  cover: z.boolean().default(false),
});
export const articlePatchSchema = z.object({
  title: z.string().trim().min(1, "Add a title.").max(240),
  excerpt: z.string().max(200),
  type: z.enum(["news", "event", "announcement"]),
  category_id: z.uuid().nullable(),
  tags: z.array(z.string().trim().min(1).max(48)).max(20),
  body: contentSchema,
  images: z.array(imageSchema).max(20),
  event_starts_at: z.iso.datetime({ offset: true }).nullable(),
  event_ends_at: z.iso.datetime({ offset: true }).nullable(),
  venue: z.string().trim().max(240).nullable(),
  map_url: z.string().max(1000).nullable(),
  display_until: z.iso.datetime({ offset: true }).nullable(),
});
export const revisionSchema = articlePatchSchema.extend({
  id: z.uuid(),
  article_id: z.uuid(),
  version: z.number().int().positive(),
  parent_revision_id: z.uuid().nullable(),
  sealed_at: z.string().nullable(),
  editor_ids: z.array(z.uuid()),
  byline_name: z.string().nullable(),
  byline_affiliation: z.string().nullable(),
});
export type ArticlePatch = z.infer<typeof articlePatchSchema>;
export type Revision = z.infer<typeof revisionSchema>;
export const deskArticleSchema = z.object({
  id: z.uuid(),
  owner_id: z.uuid(),
  slug: z.string(),
  status: z.enum(["draft", "in_review", "approved", "published", "archived"]),
  visibility: z.enum(["unpublished", "public", "archived", "withdrawn"]),
  working_revision_id: z.uuid(),
  published_revision_id: z.uuid().nullable(),
  scheduled_at: z.string().nullable(),
  published_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type DeskArticle = z.infer<typeof deskArticleSchema>;
export const publicArticleSchema = articlePatchSchema.extend({
  id: z.uuid(),
  slug: z.string(),
  visibility: z.enum(["public", "archived"]),
  published_at: z.string(),
  first_published_at: z.string(),
  updated_at: z.string(),
  category_name: z.string().nullable(),
  category_slug: z.string().nullable(),
  byline_name: z.string().nullable(),
  byline_affiliation: z.string().nullable(),
});
export type PublicArticle = z.infer<typeof publicArticleSchema>;
export const publicationCursorSchema = z
  .object({ at: z.iso.datetime({ offset: true }), id: z.uuid() })
  .strict();
export function publicationCursor(
  value: Pick<PublicArticle, "published_at" | "id">,
) {
  return JSON.stringify({ at: value.published_at, id: value.id });
}
export function parsePublicationCursor(value: string | undefined) {
  if (!value || value.length > 200) return null;
  try {
    const result = publicationCursorSchema.safeParse(JSON.parse(value));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
export function jsonValue(value: unknown): Json {
  return z.json().parse(JSON.parse(JSON.stringify(value)));
}
export function pageNumber(value: string | undefined): number {
  const parsed = Number(value ?? 1);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(parsed, 2000)
    : 1;
}
