"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { useSession } from 'next-auth/react';
import { THEME_CONFIG } from '@/lib/theme';
import dictionary from '@/lib/copy-dictionary.json';
import { formatPrice } from '@/lib/price';

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
  tags?: string[];
}

export default function ProductDetails({ product }: { product: ProductData }) {
  const addItem = useCartStore((state) => state.addItem);
  const { data: session, status } = useSession();
  const minQuantity = product.limitBay && product.limitBay > 0 ? product.limitBay : 1;
  const [quantity, setQuantity] = useState(minQuantity);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [loadingCanRate, setLoadingCanRate] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rated = localStorage.getItem(`rated-${product.id}`);
      if (rated === 'true') {
        setHasRated(true);
      }
    }
  }, [product.id]);

  useEffect(() => {
    async function checkCanRate() {
      try {
        const res = await fetch(`/api/products/${product.id}/can-rate`);
        if (res.ok) {
          const data = await res.json();
          setCanRate(data.canRate);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCanRate(false);
      }
    }
    checkCanRate();
  }, [product.id]);

  const handleRate = async (value: number) => {
    setIsSubmittingRating(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value }),
      });
      if (res.ok) {
        setHasRated(true);
        localStorage.setItem(`rated-${product.id}`, 'true');
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de l\'évaluation');
      }
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue.');
    } finally {
      setIsSubmittingRating(false);
    }
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
          <div className="flex flex-wrap gap-xs items-center">
            <span className="rounded-full bg-secondary-container/20 px-sm py-xs text-sm text-primary font-bold border border-outline-variant/30 capitalize">
              {product.category}
            </span>
            {product.tags && product.tags.length > 0 && product.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-sm py-xs text-xs text-primary font-semibold border border-primary/20">
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="font-display text-4xl font-bold text-on-surface mt-sm">
            {product.title}
          </h1>
          <p className="mt-md text-2xl font-bold text-primary">
            {formatPrice(product.price)}
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

        <div className="border-t border-outline-variant/20 pt-md">
          <h2 className="text-lg font-bold text-on-surface-variant">Évaluer ce produit</h2>
          {loadingCanRate ? (
            <span className="text-xs text-on-surface-variant animate-pulse">Vérification de l'éligibilité...</span>
          ) : status === 'unauthenticated' ? (
            <p className="mt-xs text-xs text-on-surface-variant/70">
              <Link href="/login" className="font-semibold text-primary hover:underline">Connectez-vous</Link> puis passez une commande livrée pour évaluer ce produit.
            </p>
          ) : !canRate ? (
            <p className="mt-xs text-xs text-on-surface-variant/70 italic">
              Vous pouvez évaluer ce produit uniquement après qu'une commande le contenant a été livrée.
            </p>
          ) : hasRated ? (
            <p className="mt-xs text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-xs">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">check_circle</span>
              Merci pour votre évaluation !
            </p>
          ) : (
            <div className="flex items-center gap-sm mt-xs">
              <div className="flex items-center gap-xs">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    disabled={isSubmittingRating}
                    className="text-amber-500 hover:scale-110 transition-transform focus:outline-none disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-2xl select-none">
                      {star <= (hoverRating || 0) ? 'star' : 'star_outline'}
                    </span>
                  </button>
                ))}
              </div>
              {isSubmittingRating && <span className="text-xs text-on-surface-variant animate-pulse">Envoi...</span>}
            </div>
          )}
        </div>

        <div className="mt-lg border-t border-outline-variant/20 pt-md space-y-sm">
          {/* Quantity Selector */}
          {isActionable && (
            <div>
              <label className="text-sm font-bold text-on-surface-variant mb-xs block">
                Quantité {minQuantity > 1 && <span className="text-xs font-normal text-outline">(min. {minQuantity})</span>}
              </label>
              <div className="flex items-center border border-outline-variant/60 rounded-full bg-surface-container-low p-0.5 w-40">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => (prev > minQuantity ? prev - 1 : prev))}
                  disabled={quantity <= minQuantity}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title={`Minimum: ${minQuantity}`}
                >
                  <svg className="w-4 h-4 select-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                  </svg>
                </button>
                <span className="flex-1 text-center text-sm font-bold text-on-surface">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-variant transition-colors"
                >
                  <svg className="w-4 h-4 select-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => addItem({ ...product, limitBay: product.limitBay }, quantity)}
            disabled={!isActionable}
            style={isActionable ? { backgroundColor: THEME_CONFIG.colorRoles.accent10.yellowPrimary, color: THEME_CONFIG.colorRoles.accent10.textOnYellow } : undefined}
            className="w-full rounded-xl px-md py-md text-base font-bold shadow-soft transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </article>
  );
}
