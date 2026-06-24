"use client";

import { useState } from 'react';
import { useProducts } from '@/lib/hooks/use-products';
import ProductCard from '@/components/ProductCard';
import SearchBar from '@/components/SearchBar';
import { getProductFilter } from '@/lib/site-data';
import { useBakeryStore } from '@/lib/store';
import { filterProductsByTitle } from '@/lib/products';
import dictionary from '@/lib/copy-dictionary.json';

const filters = [
  { value: 'all', label: dictionary.productBrowser.filters.all },
  { value: 'gâteau', label: dictionary.productBrowser.filters.gateau },
  { value: 'aliments traditionnel', label: dictionary.productBrowser.filters.traditional }
] as const;

export default function ProductBrowser() {
  const activeCategory = useBakeryStore((state) => state.activeCategory);
  const setActiveCategory = useBakeryStore((state) => state.setActiveCategory);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: dbProducts = [], isLoading } = useProducts();

  const categoryFiltered = activeCategory === 'all' 
    ? dbProducts 
    : dbProducts.filter((product) => getProductFilter(product.category, product.slug) === activeCategory);

  const filteredProducts = filterProductsByTitle(categoryFiltered, searchQuery);

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
              onClick={() => setActiveCategory(filter.value as typeof activeCategory)}
              className={`rounded-full border px-md py-sm text-sm font-semibold transition-colors ${active ? 'border-transparent bg-primary-container text-on-primary-container' : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-variant'}`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {isLoading && dbProducts.length === 0 ? (
        <div className="flex justify-center py-xl">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-xl text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-sm">search_off</span>
          <p className="text-lg font-semibold text-on-surface">Aucun produit trouvé</p>
          <p className="text-sm text-on-surface-variant mt-xs">Essayez d&apos;ajuster votre recherche ou vos filtres.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.title} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
