import Image from 'next/image';
import { useEffect } from 'react';
import { useProducts } from '@/lib/hooks/use-products';
import { useDashboardStore } from '@/lib/dashboard-store';

export default function ProductsSection() {
  const { data: products = [], isLoading, error: productsError } = useProducts();
  const error = productsError instanceof Error ? productsError.message : null;

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

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

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
          <label className="relative w-full lg:w-80">
            <span className="material-symbols-outlined pointer-events-none absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-sm pl-xl pr-sm text-base text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="text-sm text-on-surface-variant font-medium">
            Total Products:{" "}
            <span className="text-primary font-bold">{totalItems}</span>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-md">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin">
              sync
            </span>
            <p className="text-on-surface-variant">Loading products...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl">
              folder_open
            </span>
            <p className="text-lg font-semibold">No products found</p>
            <p className="text-sm">
              Try adding a new product or refining your search query.
            </p>
          </div>
        ) : (
          /* Products Table */
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                  <th className="p-md">Image</th>
                  <th className="p-md">Title</th>
                  <th className="p-md">Category</th>
                  <th className="p-md">Price</th>
                  <th className="p-md">State</th>
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
                      <span className="rounded-full bg-secondary-container/20 px-sm py-xs text-sm text-on-surface font-medium border border-outline-variant/30">
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
                          ? "متوفر"
                          : product.state === "outofStock"
                            ? "غير متوفر"
                            : "قريباً"}
                      </span>
                    </td>
                    <td className="p-md text-right">
                      <div className="flex justify-end gap-sm">
                        <button
                          onClick={() => openEdit(product)}
                          className="inline-flex items-center gap-xs rounded-lg px-sm py-xs text-sm font-semibold text-primary transition-all hover:bg-primary-container/10 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-base">
                            edit
                          </span>
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(product)}
                          className="inline-flex items-center gap-xs rounded-lg px-sm py-xs text-sm font-semibold text-error transition-all hover:bg-error-container/30 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-base">
                            delete
                          </span>
                          Delete
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
              Showing {indexOfFirstItem + 1} to{" "}
              {Math.min(indexOfLastItem, totalItems)} of {totalItems}{" "}
              entries
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
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
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
