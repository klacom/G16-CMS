import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicArticle, publicArticles } from "@/lib/data";
import { siteOrigin } from "@/lib/auth";
import { ArticleBody, ArticleRow } from "@/components/public-article";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const article = await getPublicArticle((await params).slug);
  if (!article)
    return { title: "Article not found · ICG", robots: { index: false } };
  return {
    title: `${article.title} · ICG`,
    description: article.excerpt,
    alternates: {
      canonical: new URL(`/news/${article.slug}`, siteOrigin()).href,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.published_at,
      modifiedTime: article.updated_at,
    },
  };
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const article = await getPublicArticle((await params).slug);
  if (!article) notFound();
  const related = await publicArticles({
    category: article.category_slug ?? undefined,
  });
  return (
    <>
      <ArticleBody article={article} />
      {related.items.some((row) => row.id !== article.id) && (
        <section className="ruled-section">
          <h2>More from {article.category_name ?? "campus"}</h2>
          <ul className="list">
            {related.items
              .filter((row) => row.id !== article.id)
              .slice(0, 3)
              .map((row) => (
                <ArticleRow key={row.id} article={row} />
              ))}
          </ul>
        </section>
      )}
    </>
  );
}
