import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useProducts } from '@/lib/hooks/use-products';
import { useDashboardStore } from '@/lib/dashboard-store';

export default function ProductsSection() {
  const { data: products = [], isLoading, error: productsError } = useProducts(true);
  const error = productsError instanceof Error ? productsError.message : null;
  const [sortBy, setSortBy] = useState<'default' | 'rating-desc' | 'rating-asc'>('default');

  const {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    openEdit,
    openDelete,
  } = useDashboardStore();

  const itemsPerPage = 5;

  // Filter products by search query
  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Reset page when query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, setCurrentPage]);

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
        <div className="flex flex-col gap-md border-b border-outline-variant/30 p-md lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-sm sm:flex-row sm:items-center w-full lg:w-auto">
            <label className="relative w-full lg:w-80">
              <svg className="pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher des produits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-sm pl-xl pr-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer h-[46px] md:w-56"
            >
              <option value="default">Tri par défaut</option>
              <option value="rating-desc">Note : Élevée à Faible</option>
              <option value="rating-asc">Note : Faible à Élevée</option>
            </select>
          </div>
          <div className="text-sm text-on-surface-variant font-medium">
            Total des produits :{" "}
            <span className="text-primary font-bold">{totalItems}</span>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-md">
            <svg className="w-10 h-10 text-primary animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <p className="text-on-surface-variant">Chargement des produits...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-sm text-on-surface-variant">
            <svg className="w-12 h-12 text-on-surface-variant/60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.31c-.4 0-.785-.158-1.07-.44l-2.12-2.12z" />
            </svg>
            <p className="text-lg font-semibold">Aucun produit trouvé</p>
            <p className="text-sm">
              Essayez d'ajouter un nouveau produit ou d'affiner votre recherche.
            </p>
          </div>
        ) : (
          /* Products Table */
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
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
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-surface-container-high border border-outline-variant/20 shadow-sm">
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
                    <td className="p-md font-bold text-primary">
                      {product.price}
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
                          className="inline-flex items-center justify-center rounded-full p-2 text-primary transition-all hover:bg-primary-container/10 active:scale-95"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDelete(product)}
                          className="inline-flex items-center justify-center rounded-full p-2 text-error transition-all hover:bg-error-container/30 active:scale-95"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-1.8c0-.661-.493-1.19-1.15-1.19h-3.78c-.657 0-1.15.529-1.15 1.19v1.8m-5.8 0h12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!isLoading && totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-outline-variant/30 p-md">
            <span className="text-sm text-on-surface-variant font-medium">
              Affichage de {indexOfFirstItem + 1} à{" "}
              {Math.min(indexOfLastItem, totalItems)} sur {totalItems} entrées
            </span>
            <div className="flex gap-xs">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                className="rounded-md border border-outline-variant px-sm py-xs text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-md px-sm py-xs text-sm font-semibold transition-all ${
                      currentPage === page
                        ? "bg-primary text-white shadow-soft"
                        : "border border-outline-variant text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage(Math.min(currentPage + 1, totalPages))
                }
                className="rounded-md border border-outline-variant px-sm py-xs text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
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
