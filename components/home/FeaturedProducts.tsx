"use client";

import { useState } from "react";
import ProductCard from "../ProductCard";
import dictionary from "@/lib/copy-dictionary.json";

interface FeaturedProduct {
  id?: string;
  title: string;
  slug: string;
  category: string;
  price: string;
  imageUrl: string;
  description: string;
  state: string;
  limitBay?: number | null;
}

interface FeaturedProductsProps {
  products: FeaturedProduct[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const itemsPerSlide = 6;
  const slidesCount = Math.ceil(products.length / itemsPerSlide) || 1;

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slidesCount) % slidesCount);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slidesCount);
  };

  return (
    <section className="mx-auto max-w-container-max px-gutter py-xl relative">
      {/* Title Header */}
      <div className="mb-lg text-center flex flex-col items-center justify-center relative">
        <h2 className="font-display text-4xl font-bold text-on-surface">
          {dictionary.home.featured.title}
        </h2>
        <div className="mx-auto mt-sm h-1 w-16 rounded-full bg-primary-container" />
      </div>

      {/* Slides Container */}
      <div className="relative overflow-hidden w-full min-h-[3550px] sm:min-h-[1850px] lg:min-h-[1250px]">
        {Array.from({ length: slidesCount }).map((_, slideIndex) => {
          const slideProducts = products.slice(
            slideIndex * itemsPerSlide,
            (slideIndex + 1) * itemsPerSlide,
          );
          const isActive = slideIndex === currentSlide;

          return (
            <div
              key={slideIndex}
              className={`w-full transition-all duration-[800ms] ease-in-out absolute inset-0 grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3 ${
                isActive
                  ? "opacity-100 translate-x-0 z-10"
                  : slideIndex < currentSlide
                    ? "opacity-0 -translate-x-[50%] z-0 pointer-events-none"
                    : "opacity-0 translate-x-[50%] z-0 pointer-events-none"
              }`}
            >
              {slideProducts.map((product) => (
                <div key={product.title} className="h-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Carousel Navigation Buttons at the Bottom */}
      {slidesCount > 1 && (
        <div className="mt-lg flex justify-center gap-xs items-center z-20 relative">
          <button
            onClick={handlePrev}
            className="rounded-full border border-outline-variant/60 bg-surface-container-low p-2 text-on-surface hover:bg-surface-variant transition-all hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm"
            aria-label="Previous Products"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-sm font-bold text-on-surface-variant px-sm select-none">
            {currentSlide + 1} / {slidesCount}
          </span>
          <button
            onClick={handleNext}
            className="rounded-full border border-outline-variant/60 bg-surface-container-low p-2 text-on-surface hover:bg-surface-variant transition-all hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm"
            aria-label="Next Products"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
