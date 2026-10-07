"use client";

import React from "react";
import dictionary from "@/lib/copy-dictionary.json";

export interface CategoryOption {
  value: string;
  label: string;
}

export const defaultCategories: CategoryOption[] = [
  { value: "all", label: dictionary.productBrowser.filters.all },
  { value: "gâteau", label: dictionary.productBrowser.filters.gateau },
  { value: "aliments traditionnel", label: dictionary.productBrowser.filters.traditional },
];

export interface CategoryFilterProps {
  activeCategory?: string;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onCategoryChange?: (category: string) => void;
  categories?: CategoryOption[];
  className?: string;
  variant?: "vertical" | "horizontal" | "modal";
}

export default function CategoryFilter({
  activeCategory,
  selectedCategory,
  onSelectCategory,
  onCategoryChange,
  categories = defaultCategories,
  className = "",
  variant = "vertical",
}: CategoryFilterProps) {
  const currentCategory = activeCategory ?? selectedCategory ?? "all";
  const handleSelect = (categoryValue: string) => {
    if (onSelectCategory) {
      onSelectCategory(categoryValue);
    }
    if (onCategoryChange) {
      onCategoryChange(categoryValue);
    }
  };

  const isModal = variant === "modal";

  return (
    <div
      role="group"
      aria-label="Filtres par catégorie"
      className={
        className ||
        (variant === "horizontal"
          ? "flex flex-wrap gap-xs w-full"
          : isModal
          ? "flex flex-col gap-sm py-xs"
          : "flex flex-col gap-xs w-full")
      }
    >
      {categories.map((filter) => {
        const isSelected = currentCategory === filter.value;
        const buttonClass = isModal
          ? `text-left rounded-lg px-md py-sm text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              isSelected
                ? "bg-primary text-white border-l-4 border-secondary pl-3 shadow-soft"
                : "text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high hover:text-primary"
            }`
          : `text-left rounded-lg px-md py-xs text-sm font-semibold transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              isSelected
                ? "bg-primary-container text-on-primary-container border-l-4 border-primary pl-3"
                : "text-on-surface-variant hover:bg-surface-variant/40 hover:text-primary"
            }`;

        return (
          <button
            key={filter.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => handleSelect(filter.value)}
            className={buttonClass}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
