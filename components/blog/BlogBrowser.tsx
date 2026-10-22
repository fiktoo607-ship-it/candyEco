"use client";

import { useState, useMemo } from 'react';
import { BlogPostItem } from './types';
import BlogHero from './BlogHero';
import BlogCard from './BlogCard';

interface BlogBrowserProps {
  initialPosts: BlogPostItem[];
}

export default function BlogBrowser({ initialPosts }: BlogBrowserProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Featured Hero post: the most recent published post
  const heroPost = initialPosts.length > 0 ? initialPosts[0] : null;

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return initialPosts;

    return initialPosts.filter((post) => {
      return (
        post.title.toLowerCase().includes(query) ||
        post.summary.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query)
      );
    });
  }, [initialPosts, searchTerm]);

  // When no active search, hero post is shown at the top, rest in the grid
  const isDefaultView = searchTerm.trim() === '';
  const gridPosts = isDefaultView ? filteredPosts.slice(1) : filteredPosts;

  const handleResetFilters = () => {
    setSearchTerm('');
  };

  return (
    <div className="w-full space-y-8 md:space-y-12">
      {/* 1. Featured/Hero Post Section at the Top */}
      {heroPost && <BlogHero post={heroPost} />}

      {/* 2. Controls Section: Search Bar */}
      <div className="bg-surface rounded-2xl p-4 md:p-6 border border-outline-variant/40 shadow-soft">
        {/* Search Input Bar */}
        <div className="relative w-full">
          <label htmlFor="blog-search-input" className="sr-only">
            Rechercher un article de blog
          </label>
          <div className="relative flex items-center">
            {/* Search Icon */}
            <span
              className="material-symbols-outlined absolute left-4 text-outline text-2xl pointer-events-none select-none"
              aria-hidden="true"
            >
              search
            </span>
            <input
              id="blog-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un article, une recette, un ingrédient..."
              className="w-full h-12 pl-12 pr-12 rounded-full border border-outline-variant bg-surface-container-low text-base text-on-surface placeholder:text-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all focus:border-primary focus:bg-surface-container-lowest"
            />
            {/* Clear Button */}
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 flex items-center justify-center p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-variant transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                aria-label="Effacer la recherche"
              >
                <span className="material-symbols-outlined text-lg select-none" aria-hidden="true">
                  close
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Grid of Responsive BlogPost Cards */}
      <section aria-label="Liste des articles">
        {/* Results Heading & Count */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl md:text-2xl font-display font-bold text-on-surface">
            {isDefaultView ? 'Dernières publications' : 'Résultats de recherche'}
          </h3>
          <span className="text-xs md:text-sm text-outline font-medium">
            {filteredPosts.length} article{filteredPosts.length > 1 ? 's' : ''}
          </span>
        </div>

        {filteredPosts.length === 0 ? (
          // Empty State
          <div className="bg-surface rounded-2xl border border-dashed border-outline-variant p-8 md:p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl" aria-hidden="true">
                article
              </span>
            </div>
            <h4 className="text-lg font-bold text-on-surface">Aucun article ne correspond à votre recherche</h4>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">
              Essayez de modifier vos termes de recherche.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors shadow-soft"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                refresh
              </span>
              <span>Réinitialiser la recherche</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {gridPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
