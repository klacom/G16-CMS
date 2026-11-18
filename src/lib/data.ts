import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getPublicSupabaseEnv } from "./env";
import { createSupabaseServerClient } from "./supabase/server";
import type { Database } from "./supabase/database.types";
import {
  deskArticleSchema,
  publicArticleSchema,
  revisionSchema,
  parsePublicationCursor,
} from "./records";
import { checkDatabase } from "./actions";

export function publicClient() {
  const { url, publishableKey } = getPublicSupabaseEnv();
  return createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
    },
  });
}
export const getDeskArticle = cache(async (id: string) => {
  const client = await createSupabaseServerClient();
  const article = await client
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  checkDatabase(article.error);
  if (!article.data) notFound();
  const parsed = deskArticleSchema.parse(article.data);
  const revision = await client
    .from("article_revisions")
    .select("*")
    .eq("id", parsed.working_revision_id)
    .maybeSingle();
  checkDatabase(revision.error);
  if (!revision.data) notFound();
  return { article: parsed, revision: revisionSchema.parse(revision.data) };
});
export const getPublicArticle = cache(async (slug: string) => {
  const { data, error } = await publicClient()
    .from("public_articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  checkDatabase(error);
  return data ? publicArticleSchema.parse(data) : null;
});
export async function publicArticles(
  filters: Record<string, string | undefined> = {},
) {
  const size = 20,
    after = parsePublicationCursor(filters.after),
    before = after ? null : parsePublicationCursor(filters.before),
    cursor = after ?? before,
    ascending = filters.sort === "oldest",
    queryAscending = before ? !ascending : ascending;
  let query = publicClient()
    .from("public_articles")
    .select("*", { count: "exact" });
  if (filters.type && ["news", "event", "announcement"].includes(filters.type))
    query = query.eq("type", filters.type);
  if (filters.category) query = query.eq("category_slug", filters.category);
  if (filters.tag) query = query.contains("tags", [filters.tag.slice(0, 48)]);
  if (filters.q?.trim())
    query = query.textSearch(
      "search_document",
      filters.q.trim().slice(0, 200),
      { type: "websearch", config: "simple" },
    );
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from))
    query = query.gte("published_at", `${filters.from}T00:00:00+08:00`);
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to))
    query = query.lte("published_at", `${filters.to}T23:59:59.999+08:00`);
  let total: number | undefined;
  if (cursor) {
    const counted = await query.limit(1);
    checkDatabase(counted.error);
    total = counted.count ?? 0;
    const comparator = queryAscending ? "gt" : "lt";
    query = query.or(
      `published_at.${comparator}.${cursor.at},and(published_at.eq.${cursor.at},id.${comparator}.${cursor.id})`,
    );
  }
  const { data, error, count } = await query
    .order("published_at", { ascending: queryAscending })
    .order("id", { ascending: queryAscending })
    .limit(size + 1);
  checkDatabase(error);
  const items = (data ?? [])
    .slice(0, size)
    .map((row) => publicArticleSchema.parse(row));
  if (before) items.reverse();
  return {
    items,
    count: total ?? count ?? 0,
    hasBefore: before ? (data ?? []).length > size : !!after,
    hasAfter: before ? true : (data ?? []).length > size,
    size,
  };
}
export async function categories() {
  const { data, error } = await publicClient()
    .from("categories")
    .select("*")
    .order("name")
    .limit(200);
  checkDatabase(error);
  return data ?? [];
}
