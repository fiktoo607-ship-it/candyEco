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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch tag suggestions when query or selected tags change
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const url = tagSearchQuery.trim() !== ""
          ? `/api/tags?q=${encodeURIComponent(tagSearchQuery.trim())}`
          : '/api/tags';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          // Filter out already selected tags
          setSuggestedTags(data.filter((tag: string) => !selectedTags.includes(tag)));
        }
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    }
    const handler = setTimeout(() => {
      fetchSuggestions();
    }, 150);
    return () => clearTimeout(handler);
  }, [tagSearchQuery, selectedTags]);

  // Click outside to close tag dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagSearchQuery("");
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagToRemove));
  };

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
    queryKey: ['products-infinite', activeCategory, debouncedSearchQuery, selectedTags],
    queryFn: async ({ pageParam = 1 }) => {
      const categoryParam = activeCategory !== 'all' ? `&category=${encodeURIComponent(activeCategory)}` : '';
      const searchParam = debouncedSearchQuery.trim() !== '' ? `&search=${encodeURIComponent(debouncedSearchQuery.trim())}` : '';
      const tagsParam = selectedTags.length > 0 ? `&tags=${encodeURIComponent(selectedTags.join(','))}` : '';
      const res = await fetch(`/api/products?page=${pageParam}&limit=${ITEMS_PER_PAGE}${categoryParam}${searchParam}${tagsParam}`);
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
    <div className="space-y-lg w-full">
      {/* Top Filter and Search Controls (Full Width) */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md md:p-lg shadow-soft space-y-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md items-center">
          {/* Search Bar (Spans 2 columns on medium+ screens) */}
          <div className="md:col-span-2 space-y-xs">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Recherche par nom
            </label>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Tag Selection (Spans 1 column) */}
          <div className="relative space-y-xs">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Filtrer par tags
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl pointer-events-none select-none">
                sell
              </span>
              <input
                type="text"
                value={tagSearchQuery}
                onChange={(e) => {
                  setTagSearchQuery(e.target.value);
                  setShowTagDropdown(true);
                }}
                onFocus={() => setShowTagDropdown(true)}
                placeholder="Rechercher un tag (ex: لوز)..."
                className="w-full h-12 pl-11 pr-4 rounded-full border border-outline-variant bg-surface-container-low text-base text-on-surface placeholder-outline outline-none transition-all focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20"
              />
              {/* Tag Search Dropdown */}
              {showTagDropdown && (
                <div 
                  ref={dropdownRef}
                  className="absolute z-30 mt-xs w-full max-h-60 overflow-y-auto rounded-xl border border-outline-variant/30 bg-surface-container-lowest shadow-lg py-xs scrollbar-thin"
                >
                  {suggestedTags.length === 0 ? (
                    <div className="px-md py-sm text-sm text-on-surface-variant">
                      Aucun tag trouvé
                    </div>
                  ) : (
                    suggestedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleSelectTag(tag)}
                        className="w-full text-left px-md py-sm text-sm text-on-surface hover:bg-primary-container hover:text-on-primary-container transition-colors font-medium flex items-center gap-xs"
                      >
                        <span className="text-primary font-bold">#</span>
                        {tag}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Tags list below the search inputs */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-xs pt-xs border-t border-outline-variant/10">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mr-xs">
              Tags actifs:
            </span>
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-xxs rounded-full bg-primary-container pl-sm pr-xs py-[4px] text-xs font-bold text-on-primary-container shadow-sm transition-transform hover:scale-[1.02]"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="flex items-center justify-center p-0.5 rounded-full hover:bg-on-primary-container/10 text-on-primary-container transition-colors"
                  aria-label={`Supprimer le tag ${tag}`}
                >
                  <span className="material-symbols-outlined text-[14px] leading-none select-none">
                    close
                  </span>
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="text-xs font-bold text-error hover:underline ml-xs"
            >
              Tout effacer
            </button>
          </div>
        )}
      </div>

      {/* Main product catalog layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-lg items-start">
        {/* Sidebar Filter Section */}
        <aside className="lg:col-span-1 space-y-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-soft lg:sticky lg:top-24">
          {/* Category Tabs */}
          <div className="space-y-xs">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Catégorie
            </label>
            <div className="flex flex-col gap-xs">
              {filters.map((filter) => {
                const active = activeCategory === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => {
                      setActiveCategory(filter.value as typeof activeCategory);
                    }}
                    className={`text-left rounded-lg px-md py-xs text-sm font-semibold transition-all ${
                      active 
                        ? 'bg-primary-container text-on-primary-container border-l-4 border-primary pl-3' 
                        : 'text-on-surface-variant hover:bg-surface-variant/40 hover:text-primary'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-md">
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
      </div>
    </div>
  );
}
