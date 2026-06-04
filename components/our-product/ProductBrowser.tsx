"use client";

import { useProducts } from '@/lib/hooks/use-products';
import ProductCard from '@/components/ProductCard';
import { getProductFilter, products as fallbackProducts } from '@/lib/site-data';
import { useBakeryStore } from '@/lib/store';

const filters = [
  { value: 'all', label: 'Tous' },
  { value: 'cake', label: 'Gâteaux' },
  { value: 'cookies', label: 'Biscuits' },
  { value: 'tart', label: 'Tartes' },
  { value: 'macarons', label: 'Macarons' }
] as const;

export default function ProductBrowser() {
  const activeCategory = useBakeryStore((state) => state.activeCategory);
  const setActiveCategory = useBakeryStore((state) => state.setActiveCategory);
  
  const { data: dbProducts = [], isLoading } = useProducts();

  // Fallback to static mock products if database is empty
  const displayProducts = dbProducts.length > 0 ? dbProducts : fallbackProducts;

  const filteredProducts = activeCategory === 'all' 
    ? displayProducts 
    : displayProducts.filter((product) => getProductFilter(product.category, product.slug) === activeCategory);

  return (
    <div className="space-y-xl">
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
