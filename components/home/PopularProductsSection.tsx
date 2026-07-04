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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [itemsPerSlide, setItemsPerSlide] = useState(4);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const handleMediaQueryChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setItemsPerSlide(e.matches ? 1 : 4);
    };
    
    handleMediaQueryChange(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaQueryChange);
      return () => mediaQuery.removeEventListener("change", handleMediaQueryChange);
    } else {
      mediaQuery.addListener(handleMediaQueryChange);
      return () => mediaQuery.removeListener(handleMediaQueryChange);
    }
  }, []);

  const currentItemsPerSlide = isMounted ? itemsPerSlide : 4;
  const slidesCount = Math.ceil((products || []).length / currentItemsPerSlide) || 1;

  useEffect(() => {
    if (currentSlide >= slidesCount) {
      setCurrentSlide(0);
    }
  }, [slidesCount, currentSlide]);

  const startAutoCycle = () => {
    stopAutoCycle();
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slidesCount);
    }, 5000);
  };

  const stopAutoCycle = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    startAutoCycle();
    return () => stopAutoCycle();
  }, [slidesCount]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStartX(e.clientX);
    setIsDragging(true);
    setDragOffset(0);
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
      setCurrentSlide((prev) => (prev + 1) % slidesCount);
    } else if (dragOffset > threshold) {
      setCurrentSlide((prev) => (prev - 1 + slidesCount) % slidesCount);
    }
    setDragOffset(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartX(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
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
      setCurrentSlide((prev) => (prev + 1) % slidesCount);
    } else if (dragOffset > threshold) {
      setCurrentSlide((prev) => (prev - 1 + slidesCount) % slidesCount);
    }
    setDragOffset(0);
  };

  if (!products || products.length === 0) return null;

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
          className="flex transition-transform duration-[800ms] ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {Array.from({ length: slidesCount }).map((_, slideIndex) => {
            const slideProducts = products.slice(
              slideIndex * currentItemsPerSlide,
              (slideIndex + 1) * currentItemsPerSlide,
            );

            return (
              <div
                key={slideIndex}
                className="w-full flex-shrink-0 grid grid-cols-1 gap-sm sm:gap-lg sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {slideProducts.map((product) => (
                  <div key={product.id || product.slug} className="h-full">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dotted Slide Indicators */}
      {slidesCount > 1 && (
        <div className="mt-lg flex gap-1.5 justify-center items-center z-20 relative">
          {Array.from({ length: slidesCount }).map((_, index) => {
            const isActive = index === currentSlide;
            return (
              <button
                key={index}
                onClick={() => {
                  setCurrentSlide(index);
                  startAutoCycle();
                }}
                className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                  isActive
                    ? "w-6 bg-primary shadow-sm shadow-primary/30"
                    : "w-1.5 bg-neutral-300 hover:bg-neutral-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
