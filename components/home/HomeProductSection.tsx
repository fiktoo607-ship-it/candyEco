"use client";

import { useState, useEffect, useRef } from "react";
import HeroCarousel from "./HeroCarousel";
import FeaturedProducts from "./FeaturedProducts";
import StorySection from "./StorySection";
import SearchBar from "../SearchBar";
import ProductCard from "../ProductCard";
import NewProductsSection from "./NewProductsSection";
import PopularProductsSection from "./PopularProductsSection";
import { useProducts } from "@/lib/hooks/use-products";
import { filterProductsByTitle } from "@/lib/products";
import FaqSection from "./FaqSection";

interface HomeProductSectionProps {
  initialFeaturedProducts: any[];
  initialNewProducts: any[];
  initialPopularProducts: any[];
  storyTitle: string;
  storyDescription: string;
  carouselSlides: any[];
  initialFaqs: any[];
}

export default function HomeProductSection({
  initialFeaturedProducts,
  initialNewProducts,
  initialPopularProducts,
  storyTitle,
  storyDescription,
  carouselSlides,
  initialFaqs = [],
}: HomeProductSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: allProducts = [], isLoading } = useProducts();
  const searchBarRef = useRef<HTMLDivElement>(null);

  const isSearchActive = searchQuery.trim() !== "";
  const filteredProducts = isSearchActive
    ? filterProductsByTitle(allProducts, searchQuery)
    : [];

  const handleSearchFocus = () => {
    if (searchBarRef.current) {
      const rect = searchBarRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetScroll = rect.top + scrollTop - 80; // 80px offset for the sticky header
      window.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-md">
      <HeroCarousel slides={carouselSlides} />

      <div ref={searchBarRef} className="mx-auto max-w-container-max px-gutter py-sm">
        <div className="mx-auto max-w-xl">
          <SearchBar value={searchQuery} onChange={setSearchQuery} onFocus={handleSearchFocus} />
        </div>
      </div>

      {!isSearchActive ? (
        <>
          <NewProductsSection products={initialNewProducts} />
          <PopularProductsSection products={initialPopularProducts} />
          <FeaturedProducts products={initialFeaturedProducts} />
          <StorySection title={storyTitle} description={storyDescription} />
          <FaqSection faqs={initialFaqs} />
        </>
      ) : (
        <div className="mx-auto max-w-container-max px-gutter pb-lg">
          <div className="space-y-md">
            <div className="border-b border-outline-variant/30 pb-sm">
              <h2 className="font-display text-3xl font-bold text-on-surface">
                Résultats de recherche pour &ldquo;{searchQuery}&rdquo;
              </h2>
              <p className="text-sm text-on-surface-variant mt-xs">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'produit trouvé' : 'produits trouvés'}
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-xl">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                  sync
                </span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-xl text-center">
                <span className="material-symbols-outlined text-5xl text-outline mb-sm">
                  search_off
                </span>
                <p className="text-lg font-semibold text-on-surface">
                  Aucun produit trouvé
                </p>
                <p className="text-sm text-on-surface-variant mt-xs">
                  Essayez d&apos;ajuster l&apos;orthographe ou de chercher un autre mot-clé.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.title} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
