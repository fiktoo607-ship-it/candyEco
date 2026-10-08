"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { THEME_CONFIG } from '@/lib/theme';
import dictionary from '@/lib/copy-dictionary.json';
import PriceDisplay from '@/components/PriceDisplay';
import { containsArabic } from '@/lib/a11y';

export interface ProductCardProps {
  product: {
    id?: string;
    title: string;
    slug: string;
    price: string;
    category: string;
    imageUrl: string;
    description: string;
    state: string;
    limitBay?: number | null;
    tags?: string[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const maxQuantity = product.limitBay && product.limitBay > 0 ? product.limitBay : undefined;
  const [quantity, setQuantity] = useState(1);

  const handleIncrease = () => {
    setQuantity((prev) => (!maxQuantity || prev < maxQuantity ? prev + 1 : prev));
  };

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id || product.slug,
      title: product.title,
      slug: product.slug,
      price: product.price,
      imageUrl: product.imageUrl,
      category: product.category,
      description: product.description,
      state: product.state,
      limitBay: product.limitBay,
    }, quantity);
  };

  let badge: string | undefined = undefined;
  let isActionable = true;
  let buttonText = dictionary.productCard.addToCart;

  if (product.state === 'outofStock') {
    badge = dictionary.productCard.unavailable;
    isActionable = false;
    buttonText = dictionary.productCard.unavailable;
  } else if (product.state === 'commingSoun') {
    badge = dictionary.productCard.comingSoon;
    isActionable = false;
    buttonText = dictionary.productCard.comingSoon;
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-soft transition-transform duration-300 hover:-translate-y-1 flex flex-col h-full group">
      <Link
        href={`/our-product/${product.slug}`}
        className="relative aspect-[4/3] overflow-hidden bg-surface-variant cursor-pointer block"
      >
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
        {badge ? (
          <span className="absolute left-sm top-sm rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {badge}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-col flex-grow p-sm sm:p-md" dir="ltr">
        <div>
          <p className="mb-xs text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-primary">
            {product.category}
          </p>
          <Link
            href={`/our-product/${product.slug}`}
            className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          >
            <h3 className="font-display text-lg sm:text-2xl font-bold text-on-surface line-clamp-1">
              {containsArabic(product.title) ? (
                <span lang="ar" dir="rtl">{product.title}</span>
              ) : (
                product.title
              )}
            </h3>
          </Link>
          {/* Product Tags (up to 3) */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-xs mt-xs">
              {product.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-primary border border-primary/20"
                >
                  {containsArabic(tag) ? (
                    <span lang="ar" dir="rtl">#{tag}</span>
                  ) : (
                    `#${tag}`
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="mt-xs sm:mt-sm flex-grow text-xs sm:text-base leading-normal sm:leading-8 text-on-surface-variant line-clamp-2">
          {containsArabic(product.description) ? (
            <span lang="ar" dir="rtl">{product.description}</span>
          ) : (
            product.description
          )}
        </p>

        <div className="mt-sm sm:mt-md border-t border-surface-variant pt-sm flex flex-col gap-sm">
          {/* Price and Read More Button */}
          <div className="flex items-center justify-between">
            <span className="text-base sm:text-xl font-bold text-primary">
              <PriceDisplay price={product.price} />
            </span>
            <Link
              href={`/our-product/${product.slug}`}
              className="group inline-flex items-center text-xs sm:text-sm font-bold text-primary hover:text-surface-tint hover:underline transition-all"
            >
              {dictionary.productCard.readMore || "Read More"}
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 ml-1 select-none transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>

          {/* Quantity Controls & Add to Cart */}
          <div className="flex flex-col gap-xs w-full mt-xs">
            {isActionable && (
              <div className="flex items-center justify-between border border-outline-variant/60 rounded-full bg-surface-container-low p-0.5 w-full">
                <button
                  type="button"
                  onClick={handleDecrease}
                  className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={quantity <= 1}
                  title="Quantité minimale : 1"
                  aria-label="Diminuer la quantité"
                >
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 select-none"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 12h-15"
                    />
                  </svg>
                </button>
                <span className="flex-1 text-center text-xs sm:text-sm font-bold text-on-surface">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={maxQuantity !== undefined && quantity >= maxQuantity}
                  title={maxQuantity !== undefined && quantity >= maxQuantity ? `Limite maximale : ${maxQuantity}` : undefined}
                  aria-label="Augmenter la quantité"
                  className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 select-none"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </button>
              </div>
            )}
            <button
              onClick={handleAddToCart}
              disabled={!isActionable}
              style={
                isActionable
                  ? {
                      backgroundColor:
                        THEME_CONFIG.colorRoles.accent10.yellowPrimary,
                      color: THEME_CONFIG.colorRoles.accent10.textOnYellow,
                    }
                  : undefined
              }
              className="w-full rounded-full py-1.5 sm:py-sm text-xs sm:text-sm font-bold shadow-soft transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed h-9 sm:h-11 flex items-center justify-center disabled:bg-neutral-200 disabled:text-neutral-500 whitespace-nowrap"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
