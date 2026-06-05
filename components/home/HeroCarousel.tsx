"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dictionary from '@/lib/copy-dictionary.json';

interface Slide {
  imageUrl: string;
  tagline: string;
  title: string;
  description: string;
  primaryLink: { href: string; label: string };
  secondaryLink: { href: string; label: string };
}

const imageUrls = [
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200",
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200",
  "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=1200",
];

const slides: Slide[] = dictionary.home.carousel.map((item, index) => ({
  imageUrl: imageUrls[index],
  tagline: item.tagline,
  title: item.title,
  description: item.description,
  primaryLink: { href: '/our-product', label: item.primaryLabel },
  secondaryLink: { 
    href: index === 0 || index === 2 ? '/about' : '/contact', 
    label: item.secondaryLabel 
  }
}));

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
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
  }, []);

  const handleNext = () => {
    stopTimer();
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    startTimer();
  };

  const handlePrev = () => {
    stopTimer();
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    startTimer();
  };

  const handleDotClick = (index: number) => {
    stopTimer();
    setCurrentSlide(index);
    startTimer();
  };

  return (
    <section className="relative isolate h-[680px] w-full overflow-hidden bg-neutral-950">
      {/* Slides Container */}
      <div className="absolute inset-0 h-full w-full">
        {slides.map((slide, index) => {
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
                className={`h-full w-full object-cover object-center transition-transform duration-[6000ms] ease-out ${
                  isActive ? "scale-100" : "scale-110"
                }`}
              />

              {/* Directional Gradient Mask (Premium Dark Overlay) */}
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/50 to-transparent z-10" />

              {/* Text & Content Overlay in a Glassmorphic block */}
              <div className="relative mx-auto flex h-full max-w-container-max items-center px-gutter py-xl z-20">
                <div
                  className="w-full max-w-2xl text-left text-white rounded-3xl border border-white/10 bg-neutral-950/40 p-md md:p-12 backdrop-blur-md shadow-2xl transition-all duration-500 hover:border-white/20"
                  dir="ltr"
                >
                  {/* Glassmorphic Tagline Badge */}
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#e8dfff] backdrop-blur-md shadow-sm">
                    <span className="flex h-2 w-2 rounded-full bg-[#e8dfff] animate-pulse" />
                    {slide.tagline}
                  </div>

                  {/* Elegant Typography */}
                  <h1 className="mt-md font-display text-4xl font-black leading-tight md:text-5xl lg:text-6xl tracking-tight text-white drop-shadow-sm">
                    {slide.title}
                  </h1>

                  <p className="mt-md max-w-xl text-base md:text-lg leading-relaxed text-white/80 font-medium">
                    {slide.description}
                  </p>

                  {/* Action Buttons */}
                  <div className="mt-lg flex flex-wrap gap-sm">
                    <Link
                      href={slide.primaryLink.href}
                      className="rounded-xl bg-primary px-xl py-md text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-surface-tint active:scale-[0.98]"
                    >
                      {slide.primaryLink.label}
                    </Link>
                    <Link
                      href={slide.secondaryLink.href}
                      className="rounded-xl border border-white/20 bg-white/10 px-xl py-md text-base font-bold text-white backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-white/20 active:scale-[0.98]"
                    >
                      {slide.secondaryLink.label}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unified Bottom Control Bar */}
      <div className=" opacity-70 absolute bottom-md left-1/2 z-30 flex -translate-x-1/2 items-center gap-sm rounded-full border border-white/10 bg-neutral-900/60 px-sm py-1.5 backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-neutral-900/80 hover:border-white/20">
        {/* Prev Button */}
        <button
          onClick={handlePrev}
          className="rounded-full p-1 text-white/40 hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          aria-label="Previous Slide"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        {/* Slide Indicator Pills */}
        <div className="flex gap-1.5 items-center">
          {slides.map((_, index) => {
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

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="rounded-full p-1 text-white/40 hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          aria-label="Next Slide"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
