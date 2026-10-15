"use client";

import { useState, useEffect, useRef } from "react";
import ProductCard from "../ProductCard";
import dictionary from "@/lib/copy-dictionary.json";

interface Product {
  id?: string;
  title: string;
  slug: string;
  category: string;
  price: string;
  imageUrl: string;
  description: string;
  state: string;
  limitBay?: number | null;
  tags?: string[];
}

interface PopularProductsSectionProps {
  products: Product[];
}

export default function PopularProductsSection({ products }: PopularProductsSectionProps) {
  const N = products?.length ?? 0;

  const [itemsPerView, setItemsPerView] = useState(3);
  const [isMounted, setIsMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(3); // initialized to default itemsPerView
  const [isTransitioning, setIsTransitioning] = useState(true);

  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setReducedMotion(true);
        setIsPlaying(false);
      }
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          setReducedMotion(true);
          setIsPlaying(false);
        } else {
          setReducedMotion(false);
        }
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else if ('addListener' in mediaQuery) {
        (mediaQuery as any).addListener(handleChange);
        return () => (mediaQuery as any).removeListener(handleChange);
      }
    }

    const getItemsPerView = () => {
      if (typeof window === 'undefined') return 3;
      if (window.innerWidth < 640) return 1;
      if (window.innerWidth < 1024) return 2;
      return 3;
    };

    const initialItems = getItemsPerView();
    setItemsPerView(initialItems);
    setCurrentSlide(initialItems);

    const handleResize = () => {
      const newItems = getItemsPerView();
      setItemsPerView(newItems);
      setCurrentSlide(newItems);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentItemsPerView = isMounted ? itemsPerView : 3;

  const startAutoCycle = () => {
    stopAutoCycle();
    if (N <= currentItemsPerView || !isPlaying || reducedMotion) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => prev + 1);
    }, 5000);
  };

  const stopAutoCycle = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (isPlaying && !reducedMotion) {
      startAutoCycle();
    } else {
      stopAutoCycle();
    }
    return () => stopAutoCycle();
  }, [N, currentItemsPerView, isPlaying, reducedMotion]);

  const handleTransitionEnd = () => {
    if (N <= currentItemsPerView) return;
    if (currentSlide === currentItemsPerView - 1) {
      setIsTransitioning(false);
      setCurrentSlide(N + currentItemsPerView - 1);
    } else if (currentSlide === N + currentItemsPerView) {
      setIsTransitioning(false);
      setCurrentSlide(currentItemsPerView);
    }
  };

  useEffect(() => {
    if (!isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(true);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  // Safety check to prevent slider from running out of bounds (e.g. background tabs)
  useEffect(() => {
    if (N <= currentItemsPerView) return;
    if (currentSlide > N + currentItemsPerView) {
      setIsTransitioning(false);
      setCurrentSlide(currentItemsPerView);
    } else if (currentSlide < currentItemsPerView - 1) {
      setIsTransitioning(false);
      setCurrentSlide(N + currentItemsPerView - 1);
    }
  }, [currentSlide, N, currentItemsPerView]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (N <= currentItemsPerView) return;
    setDragStartX(e.clientX);
    setIsDragging(true);
    setDragOffset(0);
    stopAutoCycle();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX === null) return;
    const currentX = e.clientX;
    const diff = currentX - dragStartX;
    setDragOffset(diff);
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragStartX(null);
    startAutoCycle();

    const threshold = 80;
    if (dragOffset < -threshold) {
      setCurrentSlide((prev) => prev + 1);
    } else if (dragOffset > threshold) {
      setCurrentSlide((prev) => prev - 1);
    }
    setDragOffset(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (N <= currentItemsPerView) return;
    setDragStartX(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
    stopAutoCycle();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || dragStartX === null) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - dragStartX;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragStartX(null);
    startAutoCycle();

    const threshold = 50;
    if (dragOffset < -threshold) {
      setCurrentSlide((prev) => prev + 1);
    } else if (dragOffset > threshold) {
      setCurrentSlide((prev) => prev - 1);
    }
    setDragOffset(0);
  };

  if (!products || products.length === 0) return null;

  // Static grid fallback if products count fits on the screen
  if (N <= currentItemsPerView) {
    return (
      <section className="mx-auto max-w-container-max px-gutter py-md relative select-none">
        {/* Title Header */}
        <div className="mb-lg text-center flex flex-col items-center justify-center relative">
          <h2 className="font-display text-4xl font-bold text-on-surface">
            {dictionary.home.popularProducts?.title || "Produits Populaires"}
          </h2>
          <div className="mx-auto mt-sm h-1 w-16 rounded-full bg-primary-container" />
        </div>

        <div className="flex justify-center w-full">
          <div className="grid gap-sm sm:gap-lg grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl justify-items-center">
            {products.map((product) => (
              <div key={product.id || product.slug} className="w-full max-w-[320px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const prepended = products.slice(-currentItemsPerView);
  const appended = products.slice(0, currentItemsPerView);
  const displayProducts = [...prepended, ...products, ...appended];

  const activeIndicatorIndex = (currentSlide - currentItemsPerView + N) % N;

  return (
    <section
      className="mx-auto max-w-container-max px-gutter py-md relative select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Title Header */}
      <div className="mb-lg text-center flex flex-col items-center justify-center relative">
        <h2 className="font-display text-4xl font-bold text-on-surface">
          {dictionary.home.popularProducts?.title || "Produits Populaires"}
        </h2>
        <div className="mx-auto mt-sm h-1 w-16 rounded-full bg-primary-container" />
      </div>

      {/* Slides Container */}
      <div className="overflow-hidden w-full">
        <div
          className={`flex w-full ${isTransitioning ? 'transition-transform duration-[800ms] ease-in-out' : ''}`}
          style={{ transform: `translateX(-${currentSlide * (100 / currentItemsPerView)}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {displayProducts.map((product, idx) => (
            <div
              key={`${product.id || product.slug}-${idx}`}
              style={{ width: `${100 / currentItemsPerView}%` }}
              className="flex-shrink-0 flex justify-center px-4"
            >
              <div className="w-full max-w-[320px]">
                <ProductCard product={product} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dotted Slide Indicators & Pause/Play Control */}
      {N > 1 && (
        <div suppressHydrationWarning className="mt-lg flex gap-3 justify-center items-center z-20 relative">
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            aria-label={isPlaying ? "Mettre en pause le carrousel" : "Lancer le carrousel"}
            aria-pressed={!isPlaying}
            title={isPlaying ? "Mettre en pause le carrousel" : "Lancer le carrousel"}
            className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isPlaying ? (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          {Array.from({ length: N }).map((_, index) => {
            const isActive = index === activeIndicatorIndex;
            return (
              <button
                key={index}
                onClick={() => {
                  setCurrentSlide(currentItemsPerView + index);
                  if (isPlaying && !reducedMotion) {
                    startAutoCycle();
                  }
                }}
                className={`h-3 rounded-full transition-all duration-300 ease-out ${
                  isActive
                    ? "w-12 bg-[#2a1082] shadow-sm shadow-[#2a1082]/30"
                    : "w-3 bg-neutral-300 hover:bg-neutral-400 hover:scale-105"
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
