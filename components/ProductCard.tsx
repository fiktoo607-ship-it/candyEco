"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';

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
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

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
    });
  };

  let badge: string | undefined = undefined;
  let isActionable = true;
  let buttonText = "Ajouter au panier";

  if (product.state === 'outofStock') {
    badge = 'Indisponible';
    isActionable = false;
    buttonText = 'Indisponible';
  } else if (product.state === 'commingSoun') {
    badge = 'Bientôt';
    isActionable = false;
    buttonText = 'Bientôt';
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
        </div>

        <p className="mt-sm flex-grow text-base leading-8 text-on-surface-variant line-clamp-2">{product.description}</p>

        <div className="mt-md border-t border-surface-variant pt-sm flex items-center justify-between">
          <span className="text-xl font-bold text-primary">{product.price}</span>
          <button
            onClick={handleAddToCart}
            disabled={!isActionable}
            className="rounded-full bg-primary px-md py-xs text-xs font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </article>
  );
}
