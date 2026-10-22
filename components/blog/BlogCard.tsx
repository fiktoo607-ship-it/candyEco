"use client";

import Link from 'next/link';
import Image from 'next/image';
import { BlogPostItem } from './types';
import { formatBlogDate } from '@/lib/date';
import { useState } from 'react';

interface BlogCardProps {
  post: BlogPostItem;
}

export default function BlogCard({ post }: BlogCardProps) {
  const [imageError, setImageError] = useState(false);
  const formattedDate = formatBlogDate(post.publishedAt || post.createdAt);

  return (
    <article className="group bg-surface rounded-2xl overflow-hidden border border-outline-variant/50 shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      {/* Cover Image Container */}
      <Link
        href={`/blog/${post.slug}`}
        aria-label={`Lire l'article : ${post.title}`}
        className="relative block aspect-[16/10] overflow-hidden bg-surface-container-low"
      >
        {!imageError && post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-primary/5 text-primary">
            <svg
              className="w-12 h-12 opacity-40 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider opacity-60">
              {post.category}
            </span>
          </div>
        )}

        {/* Floating Category Pill */}
        <span className="absolute top-3 left-3 bg-primary/90 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm tracking-wide">
          {post.category}
        </span>

        {/* Floating Reading Time Badge */}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-on-surface text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
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
          <span>{post.readingTime || 3} min</span>
        </span>
      </Link>

      {/* Card Content */}
      <div className="p-5 md:p-6 flex flex-col flex-1">
        {/* Date */}
        <div className="text-xs font-medium text-outline flex items-center gap-1.5 mb-2">
          <svg
            className="w-3.5 h-3.5 text-outline"
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

        {/* Title */}
        <h3 className="text-lg md:text-xl font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          <Link href={`/blog/${post.slug}`} className="focus-visible:outline-none focus-visible:underline">
            {post.title}
          </Link>
        </h3>

        {/* Summary */}
        <p className="text-sm text-on-surface-variant line-clamp-3 leading-relaxed mt-2.5 mb-4">
          {post.summary}
        </p>

        {/* Footer Link */}
        <div className="mt-auto pt-3 border-t border-outline-variant/30 flex items-center justify-between">
          <Link
            href={`/blog/${post.slug}`}
            className="text-primary font-semibold text-sm flex items-center gap-1.5 group-hover:gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            <span>Lire l&apos;article</span>
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
