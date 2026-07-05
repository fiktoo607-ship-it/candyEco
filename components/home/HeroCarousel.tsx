"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string | null;
  order?: number;
  isProduct?: boolean;
}

interface Slide {
  imageUrl: string;
  title: string;
  description: string;
  primaryLink?: { href: string; label: string; isComingSoon: boolean };
}

interface HeroCarouselProps {
  slides?: CarouselSlide[];
}

export default function HeroCarousel({ slides = [] }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Touch Swipe gesture states
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const displaySlides: Slide[] = slides.map((slide) => {
    const isProduct = slide.isProduct ?? slide.linkUrl?.startsWith('/our-product/');
    return {
      imageUrl: slide.imageUrl,
      title: slide.title,
      description: slide.description,
      primaryLink: isProduct
        ? (slide.linkUrl
            ? {
                href: slide.linkUrl,
                label: "Savoir plus",
                isComingSoon: false,
              }
            : undefined)
        : {
            href: slide.linkUrl || "#",
            label: "Coming Soon",
            isComingSoon: true,
          },
    };
  });

  const startTimer = () => {
    stopTimer();
    if (displaySlides.length === 0) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
    }, 6000); // cycles slides every 6 seconds
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [displaySlides.length]);

  const handleNext = () => {
    if (displaySlides.length === 0) return;
    stopTimer();
    setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
    startTimer();
  };

  const handlePrev = () => {
    if (displaySlides.length === 0) return;
    stopTimer();
    setCurrentSlide((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);
    startTimer();
  };

  const handleDotClick = (index: number) => {
    stopTimer();
    setCurrentSlide(index);
    startTimer();
  };

  // Touch handlers for swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const diff = touchStartX - touchEndX;
    const threshold = 50; // Swipe threshold in px
    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
      handlePrev();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  if (displaySlides.length === 0) {
    return null;
  }

  return (
    <section 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative isolate w-full overflow-hidden bg-neutral-950 h-[calc(100dvh-5rem)]"
    >
      {/* Slides Container */}
      <div className="absolute inset-0 h-full w-full">
        {displaySlides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={index}
              className={`absolute inset-0 h-full w-full transition-all duration-1000 ease-in-out ${
                isActive
                  ? "opacity-100 scale-100 z-10"
                  : "opacity-0 scale-105 z-0 pointer-events-none"
              }`}
            >
              {/* Background Image with Slow Zoom */}
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className={`absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[6000ms] ease-out ${
                  isActive ? "scale-100" : "scale-110"
                }`}
              />

              {/* Dark Overlay Mask for High Text Contrast */}
              <div className="absolute inset-0 bg-black/60 lg:bg-gradient-to-r lg:from-neutral-950/95 lg:via-neutral-950/50 lg:to-transparent z-10" />

              {/* Text & Content Overlay in a Glassmorphic block */}
              <div className="relative mx-auto flex h-full max-w-container-max items-center justify-start px-gutter z-20">
                <div
                  className="w-full max-w-2xl text-left text-white rounded-3xl p-sm xs:p-md md:p-12 transition-all duration-500 hover:border-white/20"
                  dir="ltr"
                >
                  {/* Elegant Typography */}
                  <h1 className="mt-sm sm:mt-md font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white drop-shadow-md max-w-[15ch] md:max-w-[18ch]">
                    {slide.title}
                  </h1>

                  <p className="mt-xs sm:mt-md max-w-xl text-xs xs:text-sm sm:text-lg md:text-2xl leading-relaxed text-neutral-300 font-medium line-clamp-3 sm:line-clamp-4 lg:line-clamp-none">
                    {slide.description}
                  </p>

                 {/* Action Buttons */}
                  {slide.primaryLink && (
                    <div className="mt-sm sm:mt-lg flex flex-wrap gap-xs sm:gap-sm">
                      {slide.primaryLink.isComingSoon ? (
                        <div className="rounded-xl bg-[#deb53d] px-6 py-2.5 xs:px-8 xs:py-3 md:px-[50px] md:py-[16px] text-xs xs:text-sm md:text-base font-extrabold text-neutral-950 shadow-lg shadow-[#deb53d]/10 cursor-default select-none">
                          {slide.primaryLink.label}
                        </div>
                      ) : (
                        <Link
                          href={slide.primaryLink.href}
                          className="rounded-xl bg-[#deb53d] px-6 py-2.5 xs:px-8 xs:py-3 md:px-[50px] md:py-[16px] text-xs xs:text-sm md:text-base font-extrabold text-neutral-950 shadow-lg shadow-[#deb53d]/20 transition-all hover:scale-[1.02] hover:bg-[#ca9e2b] active:scale-[0.98]"
                        >
                          {slide.primaryLink.label}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Left/Prev Edge Button */}
      {displaySlides.length > 1 && (
        <button
          onClick={handlePrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex h-12 w-12 items-center justify-center text-white opacity-60 hover:opacity-100 hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label="Previous Slide"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-8 w-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </button>
      )}

      {/* Right/Next Edge Button */}
      {displaySlides.length > 1 && (
        <button
          onClick={handleNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex h-12 w-12 items-center justify-center text-white opacity-60 hover:opacity-100 hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label="Next Slide"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-8 w-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      )}

      {/* Slide Indicator Dots centered at the bottom */}
      {displaySlides.length > 1 && (
        <div className="absolute bottom-md left-1/2 z-30 flex -translate-x-1/2 items-center gap-3">
          {displaySlides.map((_, index) => {
            const isActive = index === currentSlide;
            return (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-3 transition-all duration-300 ease-out rounded-full ${
                  isActive
                    ? "w-8 bg-[#deb53d] shadow-md shadow-[#deb53d]/50"
                    : "w-3 bg-white/40 hover:bg-white/70 hover:scale-110"
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
