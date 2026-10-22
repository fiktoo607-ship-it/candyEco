"use client";

import Link from 'next/link';
import { BlogPostItem } from './types';
import BlogCard from './BlogCard';

interface SimilarPostsProps {
  posts: BlogPostItem[];
  currentCategory: string;
}

export default function SimilarPosts({ posts, currentCategory }: SimilarPostsProps) {
  if (posts.length === 0) {
    return (
      <section className="mt-16 pt-12 border-t border-outline-variant/30 text-center">
        <h3 className="text-xl md:text-2xl font-display font-bold text-on-surface mb-3">
          Envie d&apos;en lire plus ?
        </h3>
        <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
          Découvrez d&apos;autres recettes, astuces et coulisses sur notre blog artisanal.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-all shadow-soft"
        >
          <span>Voir tous les articles</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="similar-posts-heading" className="mt-16 pt-12 border-t border-outline-variant/30">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Dans la même thématique
          </span>
          <h2 id="similar-posts-heading" className="text-2xl md:text-3xl font-display font-bold text-on-surface mt-1">
            Articles similaires
          </h2>
        </div>
        <Link
          href="/blog"
          className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 group self-start sm:self-auto"
        >
          <span>Explorer tous les articles</span>
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
