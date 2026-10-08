"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { containsArabic } from '@/lib/a11y';

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

/**
 * Validates and sanitizes slide link URLs to prevent open redirects and XSS (Issue #16).
 * Rejects javascript:, data:, vbscript: and ensures external links use valid http/https
 * or relative internal paths.
 */
export function sanitizeSlideUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === '#') return null;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return null;
  }

  // Reject protocol-relative URLs
  if (trimmed.startsWith('//')) {
    return null;
  }

  // Allow relative internal paths
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Allow valid http / https URLs
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch {
    // Invalid URL
  }

  return null;
}

interface HeroCarouselProps {
  slides?: CarouselSlide[];
}

export default function HeroCarousel({ slides = [] }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Touch Swipe gesture states
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const displaySlides: Slide[] = slides.map((slide) => {
    const safeUrl = sanitizeSlideUrl(slide.linkUrl);
    const isProduct = slide.isProduct ?? (safeUrl ? safeUrl.startsWith('/our-product/') : false);
    return {
      imageUrl: slide.imageUrl,
      title: slide.title,
      description: slide.description,
      primaryLink: isProduct
        ? (safeUrl
            ? {
                href: safeUrl,
                label: "Savoir plus",
                isComingSoon: false,
              }
            : undefined)
        : {
            href: safeUrl || "#",
            label: safeUrl ? "Savoir plus" : "Coming Soon",
            isComingSoon: !safeUrl,
          },
    };
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Respect prefers-reduced-motion: disable automatic sliding by default if user prefers reduced motion
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
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
  }, []);

  const startTimer = () => {
    stopTimer();
    if (!isPlaying || reducedMotion || displaySlides.length <= 1) return;
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
    if (isPlaying && !reducedMotion) {
      startTimer();
    } else {
      stopTimer();
    }
    return () => stopTimer();
  }, [displaySlides.length, isPlaying, reducedMotion]);

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleNext = () => {
    if (displaySlides.length === 0) return;
    stopTimer();
    setCurrentSlide((prev) => (prev + 1) % displaySlides.length);
    if (isPlaying && !reducedMotion) {
      startTimer();
    }
  };

  const handlePrev = () => {
    if (displaySlides.length === 0) return;
    stopTimer();
    setCurrentSlide((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);
    if (isPlaying && !reducedMotion) {
      startTimer();
    }
  };

  const handleDotClick = (index: number) => {
    stopTimer();
    setCurrentSlide(index);
    if (isPlaying && !reducedMotion) {
      startTimer();
    }
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
              aria-hidden={!isActive ? true : undefined}
              inert={!isActive ? true : undefined}
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
                  {/* Elegant Typography - Single H1 for primary slide, H2 for subsequent slides */}
                  {index === 0 ? (
                    <h1 className="mt-sm sm:mt-md font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white drop-shadow-md max-w-[15ch] md:max-w-[18ch]">
                      {containsArabic(slide.title) ? (
                        <span lang="ar" dir="rtl">{slide.title}</span>
                      ) : (
                        slide.title
                      )}
                    </h1>
                  ) : (
                    <h2 className="mt-sm sm:mt-md font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white drop-shadow-md max-w-[15ch] md:max-w-[18ch]">
                      {containsArabic(slide.title) ? (
                        <span lang="ar" dir="rtl">{slide.title}</span>
                      ) : (
                        slide.title
                      )}
                    </h2>
                  )}

                  <p className="mt-xs sm:mt-md max-w-xl text-xs xs:text-sm sm:text-lg md:text-2xl leading-relaxed text-neutral-300 font-medium line-clamp-3 sm:line-clamp-4 lg:line-clamp-none">
                    {containsArabic(slide.description) ? (
                      <span lang="ar" dir="rtl">{slide.description}</span>
                    ) : (
                      slide.description
                    )}
                  </p>

                  {/* Action Buttons */}
                  {slide.primaryLink && (
                    <div className="mt-sm sm:mt-lg flex flex-wrap gap-xs sm:gap-sm">
                      {slide.primaryLink.isComingSoon ? (
                        <div className="rounded-xl bg-neutral-200 px-6 py-2.5 xs:px-8 xs:py-3 md:px-[50px] md:py-[16px] text-xs xs:text-sm md:text-base font-extrabold text-neutral-500 cursor-not-allowed select-none">
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
          className="absolute left-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex h-12 w-12 items-center justify-center text-white opacity-60 hover:opacity-100 hover:scale-110 active:scale-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
          className="absolute right-6 top-1/2 -translate-y-1/2 z-30 hidden md:flex h-12 w-12 items-center justify-center text-white opacity-60 hover:opacity-100 hover:scale-110 active:scale-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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

      {/* Slide Indicator Dots and Play/Pause toggle centered at the bottom */}
      {displaySlides.length > 1 && (
        <div suppressHydrationWarning className="absolute bottom-md left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 bg-neutral-900/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause carousel" : "Play carousel"}
            aria-pressed={!isPlaying}
            title={isPlaying ? "Pause automated slide transitions" : "Start automated slide transitions"}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
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
          <div className="flex items-center gap-2">
            {displaySlides.map((_, index) => {
              const isActive = index === currentSlide;
              return (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`h-3 transition-all duration-300 ease-out rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isActive
                      ? "w-12 bg-[#2a1082] shadow-md shadow-[#2a1082]/50"
                      : "w-3 bg-white/40 hover:bg-white/70 hover:scale-110"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={isActive ? "true" : undefined}
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
