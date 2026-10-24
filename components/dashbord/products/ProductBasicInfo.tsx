import React from 'react';
import { generateSlug } from '@/lib/products';
import { CATEGORIES_MAPPING } from './productCategories';

interface ProductBasicInfoProps {
  modalMode: 'create' | 'edit';
  title: string;
  setTitle: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
}

export function ProductBasicInfo({
  modalMode,
  title,
  setTitle,
  slug,
  setSlug,
  price,
  setPrice,
  category,
  setCategory,
}: ProductBasicInfoProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
        <div className="flex flex-col gap-xs">
          <label htmlFor="product-title" className="text-sm font-bold text-on-surface-variant">
            Titre du produit *
          </label>
          <input
            id="product-title"
            type="text"
            required
            placeholder="Ex: Gâteau au Chocolat"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (modalMode === "create") {
                setSlug(generateSlug(e.target.value));
              }
            }}
            className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <div className="flex justify-between items-center">
            <label htmlFor="product-slug" className="text-sm font-bold text-on-surface-variant">
              Slug *
            </label>
            <button
              type="button"
              onClick={() => {
                setSlug(generateSlug(title));
              }}
              className="text-xs font-bold text-primary hover:text-surface-tint flex items-center gap-[2px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              title="Générer le slug à partir du titre"
              aria-label="Générer le slug à partir du titre"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">autorenew</span>
              Générer
            </button>
          </div>
          <input
            id="product-slug"
            type="text"
            required
            placeholder="Ex: gateau-au-chocolat"
            value={slug}
            onChange={(e) =>
              setSlug(generateSlug(e.target.value))
            }
            className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
        <div className="flex flex-col gap-xs">
          <label htmlFor="product-price" className="text-sm font-bold text-on-surface-variant">
            Prix *
          </label>
          <input
            id="product-price"
            type="text"
            required
            placeholder="Ex: 45.00 €"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-xl border border-outline-variant bg-surface-container-low px-sm py-sm text-base text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all focus:border-primary"
          />
        </div>
        <div className="flex flex-col gap-xs">
          <label htmlFor="product-category" className="text-sm font-bold text-on-surface-variant">
            Catégorie *
          </label>
          <div className="relative">
            <select
              id="product-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-sm pr-8 py-sm text-base text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 h-[46px] appearance-none cursor-pointer transition-all focus:border-primary"
            >
              {CATEGORIES_MAPPING.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none select-none" aria-hidden="true">
              arrow_drop_down
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
