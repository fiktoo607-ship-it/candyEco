import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useProducts } from '@/lib/hooks/use-products';
import { useDashboardStore } from '@/lib/dashboard-store';
import PriceDisplay from '@/components/PriceDisplay';

export default function ProductsSection() {
  const { data: products = [], isLoading, error: productsError } = useProducts(true);
  const error = productsError instanceof Error ? productsError.message : null;
  const [sortBy, setSortBy] = useState<'default' | 'rating-desc' | 'rating-asc'>('default');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    openEdit,
    openDelete,
    openCreate,
  } = useDashboardStore();

  const itemsPerPage = 5;

  // Filter products by search query and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' ||
      p.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'rating-desc') {
      return (b.rating ?? 0) - (a.rating ?? 0);
    }
    if (sortBy === 'rating-asc') {
      return (a.rating ?? 0) - (b.rating ?? 0);
    }
    return 0;
  });

  // Pagination calculations
  const totalItems = sortedProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);

  // Reset page when query or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, setCurrentPage]);

  return (
    <>
      {error && (
        <div className="mb-md rounded-xl bg-error-container p-md text-on-error-container border border-error/20 flex gap-sm items-center">
          <span className="material-symbols-outlined">error</span>
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft border border-outline-variant/10">
        {/* Search and Filters */}
        <div className="flex flex-col gap-md border-b border-outline-variant/30 p-md lg:flex-row lg:items-center lg:justify-between bg-surface-container-lowest/50">
          <div className="flex flex-col gap-sm sm:flex-row sm:items-center w-full lg:w-auto flex-1 flex-wrap">
            {/* Search Input */}
            <label className="relative w-full lg:w-80 flex-shrink-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
                search
              </span>
              <input
                type="text"
                placeholder="Rechercher des produits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-sm pl-10 pr-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            {/* Category Select */}
            <div className="relative w-full sm:w-64 flex-shrink-0">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
                category
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-9 pr-8 py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer h-[46px] appearance-none"
              >
                <option value="all">Toutes les catégories</option>
                <option value="gâteau">Gâteaux</option>
                <option value="aliments traditionnel">Aliments Traditionnels</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
                arrow_drop_down
              </span>
            </div>

            {/* Sort Select */}
            <div className="relative w-full sm:w-64 flex-shrink-0">
              <span className="material-symbols-outlined notranslate absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none" translate="no">
                sort
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-9 pr-8 py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer h-[46px] appearance-none"
              >
                <option value="default">Tri par défaut</option>
                <option value="rating-desc">Note : Élevée à Faible</option>
                <option value="rating-asc">Note : Faible à Élevée</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none">
                arrow_drop_down
              </span>
            </div>

            {/* Reset Filters Button */}
            {(searchQuery !== '' || categoryFilter !== 'all' || sortBy !== 'default') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setSortBy('default');
                }}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-md py-sm text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-xs h-[46px] text-primary"
              >
                <span className="material-symbols-outlined text-base">filter_alt_off</span>
                <span>Réinitialiser</span>
              </button>
            )}
          </div>
          {/* Action buttons and Product Count */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-md flex-shrink-0 mt-sm lg:mt-0 border-t border-outline-variant/10 pt-md lg:border-t-0 lg:pt-0">
            <button
              onClick={() => openCreate('gâteau')}
              className="inline-flex items-center justify-center gap-xs rounded-xl bg-primary px-md py-sm text-sm font-semibold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint hover:scale-[1.02] h-[46px]"
            >
              <svg className="w-4 h-4 select-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Ajouter un produit</span>
            </button>
            <div className="text-sm text-on-surface-variant font-semibold text-right">
              Total des produits : <span className="text-primary font-bold">{totalItems}</span>
            </div>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="p-md space-y-md">
            {/* Desktop Table Skeleton (Hidden on Mobile) */}
            <div className="hidden lg:block space-y-sm">
              <div className="h-12 bg-surface-container-low rounded-xl animate-pulse" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-md items-center py-sm border-b border-outline-variant/10 animate-pulse">
                  <div className="h-16 w-16 bg-surface-container-low rounded-xl" />
                  <div className="flex-1 space-y-xs">
                    <div className="h-4 bg-surface-container-low rounded-lg w-1/3" />
                    <div className="h-3 bg-surface-container-low rounded-lg w-1/2" />
                  </div>
                  <div className="h-6 bg-surface-container-low rounded-xl w-24" />
                  <div className="h-6 bg-surface-container-low rounded-xl w-16" />
                  <div className="h-8 bg-surface-container-low rounded-xl w-20" />
                </div>
              ))}
            </div>
            {/* Mobile Cards Skeleton (Hidden on Desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md lg:hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md space-y-md animate-pulse">
                  <div className="aspect-video w-full rounded-xl bg-surface-container-low" />
                  <div className="space-y-sm">
                    <div className="flex justify-between">
                      <div className="h-4 bg-surface-container-low rounded-xl w-1/4" />
                      <div className="h-4 bg-surface-container-low rounded-xl w-1/6" />
                    </div>
                    <div className="h-5 bg-surface-container-low rounded-lg w-3/4" />
                    <div className="h-3 bg-surface-container-low rounded-lg w-full" />
                  </div>
                  <div className="flex justify-end gap-sm pt-sm border-t border-outline-variant/10">
                    <div className="h-8 bg-surface-container-low rounded-xl w-20" />
                    <div className="h-8 bg-surface-container-low rounded-xl w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-sm text-on-surface-variant bg-surface/10">
            <svg className="w-12 h-12 text-on-surface-variant/60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.31c-.4 0-.785-.158-1.07-.44l-2.12-2.12z" />
            </svg>
            <p className="text-lg font-semibold">Aucun produit trouvé</p>
            <p className="text-sm">
              Essayez d'ajouter un nouveau produit ou d'affiner votre recherche.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile/Tablet Card Grid Layout (< 1024px) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md p-md lg:hidden bg-surface/20">
              {currentItems.map((product) => (
                <div key={product.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft space-y-md hover:border-primary/20 transition-all flex flex-col justify-between">
                  <div className="space-y-sm">
                    {/* Product Image & Badges */}
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-900 shadow-sm border border-outline-variant/10 group">
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        sizes="(max-w-768px) 100vw, 50vw"
                      />
                      {/* State Badge */}
                      <div className="absolute top-2 left-2">
                        <span
                          className={`rounded-full px-sm py-[2px] text-[10px] font-bold uppercase border ${
                            product.state === "exist"
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : product.state === "outofStock"
                                ? "bg-rose-500/15 border-rose-500/30 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                                : "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                          }`}
                        >
                          {product.state === "exist"
                            ? "Disponible"
                            : product.state === "outofStock"
                              ? "Indisponible"
                              : "Bientôt"}
                        </span>
                      </div>
                      {/* Price Tag */}
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-sm py-[2px] rounded-lg">
                        <span className="text-xs font-bold text-white"><PriceDisplay price={product.price} /></span>
                      </div>
                    </div>

                    {/* Title & Category */}
                    <div>
                      <div className="flex items-center justify-between gap-sm">
                        <span className="inline-block rounded-xl bg-secondary-container/20 px-sm py-xs text-[10px] text-on-surface font-semibold border border-outline-variant/30 leading-normal">
                          {product.category}
                        </span>
                        {/* Rating */}
                        <div className="flex items-center gap-[2px] font-semibold text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined text-amber-500 text-base select-none">star</span>
                          <span>{product.rating !== undefined ? Number(product.rating).toFixed(1) : '0.0'}</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-on-surface text-base mt-xs">{product.title}</h3>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mt-xs">{product.description}</p>
                    </div>
                  </div>

                  {/* Footer details & actions */}
                  <div className="space-y-sm pt-sm border-t border-outline-variant/10 mt-auto">
                    <div className="flex justify-between items-center text-xs text-on-surface-variant">
                      <span className="flex items-center gap-[2px]">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Visibilité: <strong>{product.visibility ?? 0}</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-xs">
                      <button
                        onClick={() => openEdit(product)}
                        className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-xs text-xs font-bold text-primary hover:bg-surface-container-high transition-colors flex items-center gap-xs"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Modifier
                      </button>
                      <button
                        onClick={() => openDelete(product)}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-sm py-xs text-xs font-bold text-error hover:bg-rose-500/10 transition-colors flex items-center gap-xs"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Tabular Grid Layout (>= 1024px) */}
            <div className="overflow-x-auto lg:block hidden">
              <table className="min-w-[800px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container-low text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                    <th className="p-md">Image</th>
                    <th className="p-md">Titre</th>
                    <th className="p-md">Catégorie</th>
                    <th className="p-md">Prix</th>
                    <th className="p-md">État</th>
                    <th className="p-md">Visibilité</th>
                    <th className="p-md">Note</th>
                    <th className="p-md text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {currentItems.map((product) => (
                    <tr
                      key={product.id}
                      className="group transition-colors hover:bg-surface/50"
                    >
                      <td className="p-md">
                        <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-surface-container-high border border-outline-variant/20 shadow-sm">
                          <Image
                            src={product.imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      </td>
                      <td className="p-md">
                        <div className="font-semibold text-on-surface group-hover:text-primary transition-colors flex items-center gap-sm">
                          {product.title}
                        </div>
                        <div className="text-xs text-on-surface-variant/80 mt-[2px] line-clamp-1 max-w-md">
                          {product.description}
                        </div>
                      </td>
                      <td className="p-md">
                        <span className="inline-block rounded-xl bg-secondary-container/20 px-sm py-xs text-sm text-on-surface font-medium border border-outline-variant/30 leading-normal max-w-[150px] text-center">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-md font-bold text-primary whitespace-nowrap">
                        <PriceDisplay price={product.price} />
                      </td>
                      <td className="p-md">
                        <span
                          className={`rounded-full px-sm py-[2px] text-xs font-semibold ${
                            product.state === "exist"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : product.state === "outofStock"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                          }`}
                        >
                          {product.state === "exist"
                            ? "Disponible"
                            : product.state === "outofStock"
                              ? "Indisponible"
                              : "Bientôt"}
                        </span>
                      </td>
                      <td className="p-md font-semibold text-on-surface-variant">
                        {product.visibility ?? 0}
                      </td>
                      <td className="p-md">
                        <div className="flex items-center gap-xs font-semibold text-on-surface-variant">
                          <span className="material-symbols-outlined text-amber-500 text-lg">star</span>
                          <span>{product.rating !== undefined ? Number(product.rating).toFixed(1) : '0.0'}</span>
                        </div>
                      </td>
                      <td className="p-md text-right">
                        <div className="flex justify-end gap-xs">
                          <button
                            onClick={() => openEdit(product)}
                            className="inline-flex items-center justify-center rounded-xl p-2 text-primary border border-outline-variant/20 hover:bg-surface-container-low active:scale-95 transition-all h-[34px] w-[34px]"
                            title="Modifier"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => openDelete(product)}
                            className="inline-flex items-center justify-center rounded-xl p-2 text-error border border-rose-500/20 hover:bg-rose-500/5 active:scale-95 transition-all h-[34px] w-[34px]"
                            title="Supprimer"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination footer (Responsive design) */}
        {!isLoading && totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-outline-variant/30 p-md gap-sm bg-surface-container-lowest/80 flex-wrap">
            <span className="text-xs md:text-sm text-on-surface-variant font-medium text-center sm:text-left">
              Affichage de {indexOfFirstItem + 1} à{" "}
              {Math.min(indexOfLastItem, totalItems)} sur {totalItems} entrées
            </span>
            <div className="flex gap-xs items-center overflow-x-auto max-w-full py-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                className="rounded-xl border border-outline-variant text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed h-9 w-9 flex items-center justify-center font-bold p-0"
              >
                ‹
              </button>
              <div className="flex gap-xs items-center">
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`rounded-xl text-xs md:text-sm font-semibold transition-all h-9 w-9 flex items-center justify-center p-0 ${
                        currentPage === page
                          ? "bg-primary text-white shadow-soft font-bold"
                          : "border border-outline-variant text-on-surface hover:bg-surface-container-low"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage(Math.min(currentPage + 1, totalPages))
                }
                className="rounded-xl border border-outline-variant text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed h-9 w-9 flex items-center justify-center font-bold p-0"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
