"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { THEME_CONFIG } from '@/lib/theme';
import dictionary from '@/lib/copy-dictionary.json';

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
  const minQuantity = product.limitBay && product.limitBay > 0 ? product.limitBay : 1;
  const [quantity, setQuantity] = useState(minQuantity);

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecrease = () => {
    setQuantity((prev) => (prev > minQuantity ? prev - 1 : prev));
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
    <article className="overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-soft transition-transform duration-300 hover:-translate-y-1 flex flex-col h-full">
      <Link href={`/our-product/${product.slug}`} className="relative aspect-[4/3] overflow-hidden bg-surface-variant cursor-pointer block">
        <Image 
          src={product.imageUrl} 
          alt={product.title} 
          fill 
          className="object-cover" 
          sizes="(max-width: 1024px) 100vw, 33vw" 
        />
        {badge ? (
          <span className="absolute left-sm top-sm rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {badge}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-col flex-grow p-md" dir="ltr">
        <div>
          <p className="mb-xs text-sm font-bold uppercase tracking-[0.2em] text-primary">{product.category}</p>
          <Link href={`/our-product/${product.slug}`} className="hover:text-primary transition-colors">
            <h3 className="font-display text-2xl font-bold text-on-surface line-clamp-1">{product.title}</h3>
          </Link>
          {/* Product Tags (up to 3) */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-xs mt-xs">
              {product.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="mt-sm flex-grow text-base leading-8 text-on-surface-variant line-clamp-2">{product.description}</p>

        <div className="mt-md border-t border-surface-variant pt-sm flex flex-col gap-sm">
          {/* Price and Read More Button */}
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary">{product.price}</span>
            <Link 
              href={`/our-product/${product.slug}`} 
              className="group inline-flex items-center text-sm font-bold text-primary hover:text-surface-tint hover:underline transition-all"
            >
              {dictionary.productCard.readMore || 'Read More'}
              <svg className="w-4 h-4 ml-1 select-none transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Quantity Controls & Add to Cart */}
          <div className="flex items-center gap-xs">
            {isActionable && (
              <div className="flex items-center border border-outline-variant/60 rounded-full bg-surface-container-low p-0.5">
                <button
                  type="button"
                  onClick={handleDecrease}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={quantity <= minQuantity}
                  title={`Minimum quantity is ${minQuantity}`}
                >
                  <svg className="w-4 h-4 select-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                  </svg>
                </button>
                <span className="w-10 text-center text-sm font-bold text-on-surface">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-variant transition-colors"
                >
                  <svg className="w-4 h-4 select-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            )}
            <button
              onClick={handleAddToCart}
              disabled={!isActionable}
              style={isActionable ? { backgroundColor: THEME_CONFIG.colorRoles.accent10.yellowPrimary, color: THEME_CONFIG.colorRoles.accent10.textOnYellow } : undefined}
              className="flex-grow rounded-full py-sm text-sm font-bold shadow-soft transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed h-11 flex items-center justify-center disabled:bg-neutral-200 disabled:text-neutral-500"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
