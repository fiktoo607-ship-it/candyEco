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
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200',
  'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?q=80&w=1200',
  'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?q=80&w=1200'
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
    }, 5000); // cycles slides every 5 seconds
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
    <section className="relative isolate h-[640px] w-full overflow-hidden bg-surface-container-lowest">
      {/* Slides Container */}
      <div className="absolute inset-0 h-full w-full">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={index}
              className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Background Image */}
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="h-full w-full object-cover object-center"
              />
              {/* Dark Overlay & Gradient */}
              <div className="absolute inset-0 bg-black/45" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

              {/* Text & Content Overlay (LTR Support) */}
              <div className="relative mx-auto flex h-full max-w-container-max items-center px-gutter py-xl z-20">
                <div className="max-w-2xl text-left text-white" dir="ltr">
                  <p className="mb-sm text-sm font-semibold uppercase tracking-[0.3em] text-primary-container">
                    {slide.tagline}
                  </p>
                  <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl">
                    {slide.title}
                  </h1>
                  <p className="mt-md max-w-xl text-lg leading-8 text-white/90">
                    {slide.description}
                  </p>
                  <div className="mt-lg flex flex-wrap gap-sm">
                    <Link
                      href={slide.primaryLink.href}
                      className="rounded-xl bg-primary px-xl py-md text-base font-semibold text-white shadow-soft transition-transform hover:scale-[0.98] hover:bg-surface-tint"
                    >
                      {slide.primaryLink.label}
                    </Link>
                    <Link
                      href={slide.secondaryLink.href}
                      className="rounded-xl border border-white/30 bg-white/10 px-xl py-md text-base font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20"
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

      {/* Manual Navigation Buttons */}
      <button
        onClick={handlePrev}
        className="absolute left-md top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-3 text-white backdrop-blur-xs transition-all hover:bg-black/50 active:scale-90 flex items-center justify-center"
        aria-label="Previous Slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button
        onClick={handleNext}
        className="absolute right-md top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-3 text-white backdrop-blur-xs transition-all hover:bg-black/50 active:scale-90 flex items-center justify-center"
        aria-label="Next Slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-6 w-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Slide Indicator Dots */}
      <div className="absolute bottom-md left-1/2 z-30 flex -translate-x-1/2 gap-xs">
        {slides.map((_, index) => {
          const isActive = index === currentSlide;
          return (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                isActive ? 'w-8 bg-primary shadow-soft' : 'w-2.5 bg-white/50 hover:bg-white'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          );
        })}
      </div>
    </section>
  );
}
