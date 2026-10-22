"use client";

import React from 'react';
import { BLOG_CATEGORIES, BlogCategory } from './types';

interface BlogCategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts?: Record<string, number>;
}

export default function BlogCategoryFilter({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}: BlogCategoryFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Filtrer les articles par catégorie"
      className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none py-1"
    >
      {BLOG_CATEGORIES.map((category) => {
        const isSelected = selectedCategory.toLowerCase() === category.toLowerCase();
        const count = categoryCounts ? categoryCounts[category] : undefined;

        return (
          <button
            key={category}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectCategory(category)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              isSelected
                ? 'bg-primary text-white shadow-soft ring-2 ring-primary ring-offset-2 scale-[1.02]'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary hover:scale-[1.01]'
            }`}
          >
            <span>{category}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
