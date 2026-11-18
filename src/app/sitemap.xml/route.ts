import { generateSitemaps } from "../(public)/news/sitemap";
import { siteOrigin } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const pages = await generateSitemaps(),
    origin = siteOrigin()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll('"', "&quot;");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map((page) => `<sitemap><loc>${origin}/news/sitemap/${page.id}.xml</loc></sitemap>`).join("")}</sitemapindex>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
