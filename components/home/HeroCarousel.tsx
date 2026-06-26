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
}

interface Slide {
  imageUrl: string;
  title: string;
  description: string;
  primaryLink?: { href: string; label: string };
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

  const displaySlides: Slide[] = slides.map((slide) => ({
    imageUrl: slide.imageUrl,
    title: slide.title,
    description: slide.description,
    primaryLink: slide.linkUrl
      ? {
          href: slide.linkUrl,
          label: "Savoir plus",
        }
      : undefined,
  }));

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
      className="relative isolate h-[calc(100vh-80px)] lg:h-[680px] w-full overflow-hidden bg-neutral-950"
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

              {/* Directional Gradient Mask (Premium Dark Overlay) */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent lg:bg-gradient-to-r lg:from-neutral-950/95 lg:via-neutral-950/50 lg:to-transparent z-10" />

              {/* Text & Content Overlay in a Glassmorphic block */}
              <div className="relative mx-auto flex h-full max-w-container-max items-end lg:items-center px-gutter pb-28 lg:pb-0 lg:py-xl z-20">
                <div
                  className="w-full max-w-2xl text-left text-white rounded-3xl p-md md:p-12 transition-all duration-500 hover:border-white/20"
                  dir="ltr"
                >
                  {/* Elegant Typography */}
                  <h1 className="mt-md font-display text-4xl font-black leading-tight md:text-5xl lg:text-6xl tracking-tight text-white drop-shadow-sm">
                    {slide.title}
                  </h1>

                  <p className="mt-md max-w-xl text-base md:text-lg leading-relaxed text-white/80 font-medium line-clamp-4 lg:line-clamp-none">
                    {slide.description}
                  </p>

                  {/* Action Buttons */}
                  {slide.primaryLink && (
                    <div className="mt-lg flex flex-wrap gap-sm">
                      <Link
                        href={slide.primaryLink.href}
                        className="rounded-xl bg-primary px-xl py-md text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-surface-tint active:scale-[0.98]"
                      >
                        {slide.primaryLink.label}
                      </Link>
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
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/10 bg-neutral-900/40 text-white/70 backdrop-blur-md transition-all duration-300 hover:bg-primary hover:border-primary hover:text-white hover:scale-110 active:scale-95 shadow-lg shadow-black/20"
          aria-label="Previous Slide"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-5 w-5 md:h-6 md:w-6"
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
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/10 bg-neutral-900/40 text-white/70 backdrop-blur-md transition-all duration-300 hover:bg-primary hover:border-primary hover:text-white hover:scale-110 active:scale-95 shadow-lg shadow-black/20"
          aria-label="Next Slide"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-5 w-5 md:h-6 md:w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      )}

      {/* Slide Indicator Pills centered at the bottom */}
      {displaySlides.length > 1 && (
        <div className="absolute bottom-md left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-neutral-900/65 px-md py-2 backdrop-blur-md shadow-lg">
          {displaySlides.map((_, index) => {
            const isActive = index === currentSlide;
            return (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                  isActive
                    ? "w-6 bg-primary shadow-sm shadow-primary/30"
                    : "w-1.5 bg-white/20 hover:bg-white/50"
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
