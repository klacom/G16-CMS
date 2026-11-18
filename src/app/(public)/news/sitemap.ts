import type { MetadataRoute } from "next";
import { publicClient } from "@/lib/data";
import { checkDatabase } from "@/lib/actions";
import { siteOrigin } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function generateSitemaps() {
  const result = await publicClient()
    .from("public_articles")
    .select("id", { count: "exact", head: true });
  checkDatabase(result.error);
  return Array.from(
    { length: Math.max(1, Math.ceil((result.count ?? 0) / 500)) },
    (_, id) => ({ id }),
  );
}
export default async function sitemap({
  id,
}: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const page = Number(await id);
  if (!Number.isSafeInteger(page) || page < 0) return [];
  const result = await publicClient()
    .from("public_articles")
    .select("slug,published_at,updated_at")
    .order("id")
    .range(page * 500, page * 500 + 499);
  checkDatabase(result.error);
  return [
    ...(page === 0
      ? ["", "/about", "/archive", "/calendar", "/contact"].map((path) => ({
          url: `${siteOrigin()}${path}`,
        }))
      : []),
    ...(result.data ?? []).map((row) => ({
      url: `${siteOrigin()}/news/${row.slug}`,
      lastModified: row.published_at ?? undefined,
    })),
  ];
}
