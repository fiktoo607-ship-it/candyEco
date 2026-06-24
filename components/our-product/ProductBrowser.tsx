"use client";

import { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';
import { useBakeryStore } from '@/lib/store';
import dictionary from '@/lib/copy-dictionary.json';
import { Product } from '@/lib/hooks/use-products';

const filters = [
  { value: 'all', label: dictionary.productBrowser.filters.all },
  { value: 'gâteau', label: dictionary.productBrowser.filters.gateau },
  { value: 'aliments traditionnel', label: dictionary.productBrowser.filters.traditional }
] as const;

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest p-0.5 shadow-soft flex flex-col h-full animate-pulse select-none">
      {/* Image Skeleton */}
      <div className="aspect-[4/3] bg-surface-variant w-full rounded-t-2xl" />
      
      {/* Content Skeleton */}
      <div className="flex flex-col flex-grow p-md space-y-sm">
        {/* Category */}
        <div className="h-4 bg-outline-variant/40 rounded w-1/4" />
        
        {/* Title */}
        <div className="h-6 bg-outline-variant/50 rounded w-3/4" />
        
        {/* Description */}
        <div className="space-y-xs pt-xs">
          <div className="h-4 bg-outline-variant/20 rounded w-full" />
          <div className="h-4 bg-outline-variant/20 rounded w-5/6" />
        </div>
        
        {/* Price & Buttons */}
        <div className="mt-md border-t border-surface-variant/40 pt-sm flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-outline-variant/50 rounded w-1/5" />
            <div className="h-4 bg-outline-variant/30 rounded w-1/4" />
          </div>
          <div className="flex gap-xs items-center">
            <div className="h-10 bg-outline-variant/30 rounded-full w-28" />
            <div className="h-11 bg-outline-variant/40 rounded-full flex-grow" />
          </div>
        </div>
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 6;

export default function ProductBrowser() {
  const activeCategory = useBakeryStore((state) => state.activeCategory);
  const setActiveCategory = useBakeryStore((state) => state.setActiveCategory);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query to optimize API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<Product[]>({
    queryKey: ['products-infinite', activeCategory, debouncedSearchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const categoryParam = activeCategory !== 'all' ? `&category=${encodeURIComponent(activeCategory)}` : '';
      const searchParam = debouncedSearchQuery.trim() !== '' ? `&search=${encodeURIComponent(debouncedSearchQuery.trim())}` : '';
      const res = await fetch(`/api/products?page=${pageParam}&limit=${ITEMS_PER_PAGE}${categoryParam}${searchParam}`);
      if (!res.ok) {
        throw new Error('Failed to load products');
      }
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // If the last page has fewer items than our limit, there are no more pages.
      return lastPage.length === ITEMS_PER_PAGE ? allPages.length + 1 : undefined;
    },
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Set up Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = loadMoreRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const products = data?.pages.flatMap((page) => page) || [];
  const showInitialLoading = isLoading || (isFetching && !isFetchingNextPage && products.length === 0);

  return (
    <div className="space-y-xl">
      {/* Centered Search Bar */}
      <div className="mx-auto max-w-xl w-full">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-sm">
        {filters.map((filter) => {
          const active = activeCategory === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setActiveCategory(filter.value as typeof activeCategory);
              }}
              className={`rounded-full border px-md py-sm text-sm font-semibold transition-colors ${
                active 
                  ? 'border-transparent bg-primary-container text-on-primary-container' 
                  : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {showInitialLoading ? (
        /* Initial Loading Skeletons */
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-sm">search_off</span>
          <p className="text-lg font-semibold text-on-surface">Aucun produit trouvé</p>
          <p className="text-sm text-on-surface-variant mt-xs">Essayez d&apos;ajuster votre recherche ou vos filtres.</p>
        </div>
      ) : (
        /* Products Grid & Infinite Scroll Skeletons */
        <div className="space-y-lg">
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id || product.slug} product={product} />
            ))}
            {isFetchingNextPage && 
              Array.from({ length: 3 }).map((_, index) => (
                <ProductCardSkeleton key={`next-skeleton-${index}`} />
              ))
            }
          </div>

          {/* Observer Target */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-md">
              <span className="material-symbols-outlined text-3xl text-primary animate-spin">sync</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
