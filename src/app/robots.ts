import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/auth";
export default function robots(): MetadataRoute.Robots {
  return process.env.ICG_ALLOW_INDEXING === "true"
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/dashboard/",
            "/auth/",
            "/login",
            "/forgot-password",
            "/reset-password",
            "/embed/",
            "/media/",
            "/api/",
          ],
        },
        sitemap: `${siteOrigin()}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
