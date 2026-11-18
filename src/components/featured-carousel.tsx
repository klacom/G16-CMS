"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { PublicArticle } from "@/lib/records";
export function FeaturedCarousel({ articles }: { articles: PublicArticle[] }) {
  const [index, setIndex] = useState(0),
    article = articles[index] ?? articles[0];
  if (!article)
    return (
      <section className="home-hero bg-night">
        <div>
          <p className="kicker">Pamantasan ng Lungsod ng Pasig</p>
          <h2>
            Campus life,
            <br />
            on the record.
          </h2>
          <p>Stories, events and announcements from the PLP community.</p>
          <Link className="button" href="/calendar">
            Explore the calendar
          </Link>
        </div>
        <div className="hero-date" aria-hidden="true">
          ICG
        </div>
      </section>
    );
  const cover = article.images.find((image) => image.cover);
  return (
    <section
      className="home-hero bg-night"
      aria-label="Featured campus stories"
    >
      {cover && (
        <Image
          unoptimized
          className="hero-photo"
          src={`/media/${cover.id}`}
          alt={cover.alt}
          fill
          priority
          sizes="100vw"
        />
      )}
      <div className="hero-copy">
        <p className="kicker">{article.category_name ?? article.type}</p>
        <h2>
          <Link href={`/news/${article.slug}`}>{article.title}</Link>
        </h2>
        <p>{article.excerpt}</p>
        <Link className="button" href={`/news/${article.slug}`}>
          Read the story
        </Link>
      </div>
      {articles.length > 1 && (
        <div className="hero-controls" aria-label="Choose featured story">
          {articles.map((row, i) => (
            <button
              type="button"
              key={row.id}
              aria-label={`Story ${i + 1}: ${row.title}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            >
              {String(i + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
