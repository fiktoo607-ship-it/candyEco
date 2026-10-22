"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDashboardStore } from '@/lib/dashboard-store';
import { useBlogPosts, useUpdateBlogPost } from '@/lib/hooks/use-blog';
import { BlogPostItem, BLOG_CATEGORIES } from '@/components/blog/types';
import { formatFrenchDate } from '@/lib/date';

export default function BlogSection() {
  const { openCreateBlog, openEditBlog, openDeleteBlog, showToast } = useDashboardStore();
  const updateMutation = useUpdateBlogPost();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error } = useBlogPosts({
    page,
    limit,
    search,
    category: selectedCategory,
    status: selectedStatus,
  });

  const posts = data?.posts || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const handleTogglePublished = async (post: BlogPostItem) => {
    try {
      const newStatus = !post.isPublished;
      await updateMutation.mutateAsync({
        id: post.id,
        payload: {
          isPublished: newStatus,
        },
      });
      showToast(
        newStatus ? 'Article publié en ligne !' : 'Article passé en brouillon.',
        'success'
      );
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Impossible de modifier le statut.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-soft">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl select-none" aria-hidden="true">
              article
            </span>
            <span>Gestion des Articles de Blog</span>
          </h2>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1">
            Rédigez, publiez et gérez vos actualités, recettes et secrets de fabrication.
          </p>
        </div>

        <button
          onClick={openCreateBlog}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-container transition-all shadow-soft flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:scale-[1.02]"
        >
          <span className="material-symbols-outlined text-xl select-none" aria-hidden="true">
            add_circle
          </span>
          <span>Nouvel Article</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-soft">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none select-none">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par titre, résumé ou contenu..."
            className="w-full h-10 pl-10 pr-9 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm placeholder:text-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 rounded-full"
              aria-label="Effacer la recherche"
            >
              <span className="material-symbols-outlined text-base select-none">close</span>
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="w-full md:w-52">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Filtrer par catégorie"
            className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
          >
            <option value="all">Toutes les catégories</option>
            {BLOG_CATEGORIES.filter((c) => c !== 'Tous').map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="w-full md:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as any);
              setPage(1);
            }}
            aria-label="Filtrer par statut"
            className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-on-surface text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publiés uniquement</option>
            <option value="draft">Brouillons uniquement</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-outline">Chargement des articles de blog...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-2">
            <span className="material-symbols-outlined text-error text-3xl select-none">
              error
            </span>
            <p className="text-sm font-semibold text-error">
              {(error as Error)?.message || 'Une erreur est survenue lors du chargement des articles.'}
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl select-none">article</span>
            </div>
            <h3 className="text-base font-bold text-on-surface">Aucun article trouvé</h3>
            <p className="text-xs md:text-sm text-on-surface-variant max-w-sm mx-auto">
              {search || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Aucun résultat ne correspond à vos filtres de recherche.'
                : 'Vous n’avez pas encore créé d’article de blog.'}
            </p>
            {search || selectedCategory !== 'all' || selectedStatus !== 'all' ? (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setPage(1);
                }}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Réinitialiser les filtres
              </button>
            ) : (
              <button
                onClick={openCreateBlog}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-colors shadow-soft"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Créer votre premier article</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-on-surface border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low text-xs font-bold uppercase tracking-wider text-outline">
                  <th scope="col" className="px-4 py-3.5">
                    Article
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Catégorie
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Lecture
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Statut
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-surface-container-low/40 transition-colors group"
                  >
                    {/* Article Thumbnail + Title & Slug */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0 border border-outline-variant/30">
                          {post.coverImage ? (
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-outline">
                              <span className="material-symbols-outlined text-base">image</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs md:max-w-sm">
                          <p className="font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                            {post.title}
                          </p>
                          <p className="text-xs text-outline font-mono truncate">
                            /blog/{post.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category Tag */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-primary whitespace-nowrap">
                        {post.category}
                      </span>
                    </td>

                    {/* Reading Time */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-on-surface-variant font-medium">
                      {post.readingTime || 3} min
                    </td>

                    {/* Status Badge (Publié / Brouillon) */}
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(post)}
                        title="Cliquer pour basculer le statut"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          post.isPublished
                            ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-800 hover:bg-amber-500/20'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            post.isPublished ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <span>{post.isPublished ? 'Publié' : 'Brouillon'}</span>
                      </button>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-xs text-outline whitespace-nowrap">
                      {formatFrenchDate(post.publishedAt || post.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 justify-end">
                        {/* Public Link */}
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-variant transition-colors"
                          title="Voir l'article en ligne"
                        >
                          <span className="material-symbols-outlined text-lg select-none" aria-hidden="true">
                            visibility
                          </span>
                        </Link>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openEditBlog(post)}
                          className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-variant transition-colors"
                          title="Modifier l'article"
                        >
                          <span className="material-symbols-outlined text-lg select-none" aria-hidden="true">
                            edit
                          </span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => openDeleteBlog(post)}
                          className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-colors"
                          title="Supprimer l'article"
                        >
                          <span className="material-symbols-outlined text-lg select-none" aria-hidden="true">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/20 bg-surface-container-low text-xs">
            <span className="text-outline">
              Page {pagination.page} sur {pagination.totalPages} ({pagination.total} articles)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-outline-variant/60 bg-surface text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
