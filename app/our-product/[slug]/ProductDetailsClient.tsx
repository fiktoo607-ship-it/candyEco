"use client";

import Image from 'next/image';
import { useCartStore } from '@/lib/cart-store';
import dictionary from '@/lib/copy-dictionary.json';

interface ProductData {
  id: string;
  title: string;
  slug: string;
  price: string;
  category: string;
  imageUrl: string;
  description: string;
  story: string;
  limitBay: number | null;
  state: string;
}

export default function ProductDetailsClient({ product }: { product: ProductData }) {
  const addItem = useCartStore((state) => state.addItem);

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
    <article className="grid grid-cols-1 gap-xl md:grid-cols-2 mt-md">
      {/* Product Image Column */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-low shadow-soft">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        {badge && (
          <span className="absolute left-sm top-sm rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {badge}
          </span>
        )}
      </div>

      {/* Product Details Column */}
      <div className="flex flex-col justify-center gap-md" dir="ltr">
        <div>
          <span className="rounded-full bg-secondary-container/20 px-sm py-xs text-sm text-primary font-bold border border-outline-variant/30">
            {product.category}
          </span>
          <h1 className="font-display text-4xl font-bold text-on-surface mt-sm">
            {product.title}
          </h1>
          <p className="mt-md text-2xl font-bold text-primary">
            {product.price}
          </p>
        </div>

        <div className="border-t border-outline-variant/20 pt-md">
          <h2 className="text-lg font-bold text-on-surface-variant">{dictionary.productDetails.description}</h2>
          <p className="mt-xs text-base leading-8 text-on-surface-variant">
            {product.description}
          </p>
        </div>

        <div className="border-t border-outline-variant/20 pt-md">
          <h2 className="text-lg font-bold text-on-surface-variant">{dictionary.productDetails.story}</h2>
          <p className="mt-xs text-base leading-8 text-on-surface-variant italic">
            {product.story}
          </p>
        </div>

        <div className="mt-lg border-t border-outline-variant/20 pt-md">
          <button
            onClick={() => addItem(product)}
            disabled={!isActionable}
            className="w-full rounded-xl bg-primary py-md text-base font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </article>
  );
}
