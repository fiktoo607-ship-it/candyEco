"use client";

import Link from 'next/link';
import Image from 'next/image';
import { BlogPostItem } from './types';
import { formatBlogDate } from '@/lib/date';
import { useState } from 'react';

interface BlogHeroProps {
  post?: BlogPostItem | null;
}

export default function BlogHero({ post }: BlogHeroProps) {
  const [imageError, setImageError] = useState(false);

  if (!post) {
    return (
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-surface-container-low to-secondary/10 border border-outline-variant/40 p-8 md:p-12 text-center my-6">
        <div className="max-w-xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white">
            Bienvenue sur notre Blog
          </span>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-on-surface">
            Les délices, recettes et secrets de nos maîtres artisans
          </h2>
          <p className="text-on-surface-variant text-base">
            Découvrez nos secrets de fabrication, nos ingrédients biologiques d&apos;exception et nos actualités gourmandes.
          </p>
        </div>
      </section>
    );
  }

  const formattedDate = formatBlogDate(post.publishedAt || post.createdAt);

  return (
    <section
      aria-label="Article à la une"
      className="relative mb-8 md:mb-12 overflow-hidden rounded-3xl bg-surface border border-outline-variant/40 shadow-soft group hover:shadow-xl transition-all duration-300"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-5 md:p-8 items-center">
        {/* Cover Image */}
        <Link
          href={`/blog/${post.slug}`}
          aria-label={`Lire l'article à la une : ${post.title}`}
          className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto lg:h-[380px] rounded-2xl overflow-hidden bg-surface-container-low block"
        >
          {!imageError && post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-primary/10 text-primary">
              <svg
                className="w-16 h-16 opacity-40 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
              <span className="text-sm font-semibold uppercase tracking-wider opacity-70">
                À la une
              </span>
            </div>
          )}

          {/* Featured pill badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="bg-secondary-fixed text-on-secondary-fixed font-bold text-xs uppercase px-3 py-1 rounded-full shadow-md tracking-wider">
              ⭐ À la une
            </span>
          </div>
        </Link>

        {/* Content Column */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              {post.category}
            </span>
            <span className="bg-surface-container text-on-surface-variant text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{post.readingTime || 3} min de lecture</span>
            </span>
          </div>

          <div className="text-xs text-outline font-medium flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <time dateTime={post.publishedAt || post.createdAt}>{formattedDate}</time>
          </div>

          <h2 className="text-2xl md:text-3xl xl:text-4xl font-display font-bold text-on-surface group-hover:text-primary transition-colors leading-tight">
            <Link href={`/blog/${post.slug}`} className="focus-visible:outline-none focus-visible:underline">
              {post.title}
            </Link>
          </h2>

          <p className="text-on-surface-variant text-base leading-relaxed line-clamp-3">
            {post.summary}
          </p>

          <div className="pt-2">
            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-container transition-all duration-200 shadow-soft group-hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span>Lire l&apos;article complet</span>
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
