"use client";

import Image from 'next/image';

import { useEffect, useState } from 'react';
import { products as fallbackProducts, getProductFilter } from '@/lib/site-data';
import { useBakeryStore } from '@/lib/store';

const filters = [
  { value: 'all', label: 'الكل' },
  { value: 'cake', label: 'كعك' },
  { value: 'cookies', label: 'بسكويت' },
  { value: 'tart', label: 'تارت' },
  { value: 'macarons', label: 'ماكرون' }
] as const;

export default function ProductBrowser() {
  const activeCategory = useBakeryStore((state) => state.activeCategory);
  const setActiveCategory = useBakeryStore((state) => state.setActiveCategory);
  
  const [displayProducts, setDisplayProducts] = useState(fallbackProducts);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDisplayProducts(data);
          }
        }
      } catch (err) {
        console.error('Failed to load products from API, falling back to static data:', err);
      }
    }
    loadProducts();
  }, []);

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

      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          let badge: string | undefined = undefined;
          if (product.state === 'outofStock') {
            badge = 'غير متوفر';
          } else if (product.state === 'commingSoun') {
            badge = 'قريباً';
          }

          return (
            <article key={product.title} className="overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-soft transition-transform duration-300 hover:-translate-y-1">
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-variant">
                <Image src={product.imageUrl} alt={product.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
                {badge ? <span className="absolute left-sm top-sm rounded-full bg-[rgba(255,174,218,0.2)] px-3 py-1 text-xs font-semibold text-on-surface backdrop-blur-sm">{badge}</span> : null}
              </div>

              <div className="flex h-full flex-col p-md">
                <div>
                  <p className="mb-xs text-sm font-bold uppercase tracking-[0.2em] text-primary">{product.category}</p>
                  <h3 className="font-display text-2xl font-bold text-on-surface">{product.title}</h3>
                </div>

                <p className="mt-sm flex-1 text-base leading-8 text-on-surface-variant">{product.description}</p>

                <div className="mt-md border-t border-surface-variant pt-sm text-2xl font-bold text-primary">{product.price}</div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}