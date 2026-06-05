"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Product } from "@prisma/client";

interface Slide {
  imageUrl: string;
  title: string;
  description: string;
  primaryLink: { href: string; label: string };
}

interface HeroCarouselProps {
  products?: Product[];
}

export default function HeroCarousel({ products = [] }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slides: Slide[] =
    products.length > 0
      ? products.map((product) => ({
          imageUrl: product.imageUrl,
          title: product.title,
          description: product.description,
          primaryLink: {
            href: `/our-product/${product.slug}`,
            label: "Savoir plus",
          },
        }))
      : [
          {
            imageUrl:
              "https://res.cloudinary.com/dr8buntcb/image/upload/v1780692653/carousel/hyss2jjjyh6ichchm3c8.jpg",
            title: "Chakhchoukhat Dfer",
            description:
              "Un plat traditionnel de l'Est algérien à base de petites pâtes coupées à la main, arrosées d'une sauce rouge piquante et garnies de viande et de pois chiches.",
            primaryLink: {
              href: "/our-product/chakhchoukhat-dfer",
              label: "Savoir plus",
            },
          },
          {
            imageUrl:
              "https://res.cloudinary.com/dr8buntcb/image/upload/v1780692654/carousel/tkafu2szdsqqjxrgzrin.jpg",
            title: "Tajine Zitoun avec Khobz El Dar",
            description:
              "Un ragoût algérien classique aux olives vertes et poulet mijotés dans une sauce au citron, accompagné d'un pain maison moelleux.",
            primaryLink: {
              href: "/our-product/tajine-zitoun-avec-khobz-el-dar",
              label: "Savoir plus",
            },
          },
          {
            imageUrl:
              "https://res.cloudinary.com/dr8buntcb/image/upload/v1780692654/carousel/wqw7mqlukeroz9e87fbx.jpg",
            title: "Sablés à la confiture",
            description:
              "Biscuits secs algériens incontourbables, très fondants, saupoudrés de sucre glace et assemblés avec de la confiture au centre.",
            primaryLink: {
              href: "/our-product/sables-a-la-confiture",
              label: "Savoir plus",
            },
          },
          {
            imageUrl:
              "https://res.cloudinary.com/dr8buntcb/image/upload/v1780692655/carousel/trjzocbatbpsbuu794ng.jpg",
            title: "Dziriettes",
            description:
              "Une pâtisserie algéroise raffinée, composée d'une fine pâte croustillante farcie d'amandes parfumées au citron, puis généreusement trempée dans le miel.",
            primaryLink: {
              href: "/our-product/dziriettes",
              label: "Savoir plus",
            },
          },
        ];

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
  }, [slides.length]);

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
                className={`absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[6000ms] ease-out ${
                  isActive ? "scale-100" : "scale-110"
                }`}
              />

              {/* Directional Gradient Mask (Premium Dark Overlay) */}
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/50 to-transparent z-10" />

              {/* Text & Content Overlay in a Glassmorphic block */}
              <div className="relative mx-auto flex h-full max-w-container-max items-center px-gutter py-xl z-20">
                <div
                  className="w-full max-w-2xl text-left text-white rounded-3xl  p-md md:p-12  transition-all duration-500 hover:border-white/20"
                  dir="ltr"
                >
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
