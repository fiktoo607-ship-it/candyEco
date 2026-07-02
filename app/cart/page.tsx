"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { useCartStore } from '@/lib/cart-store';
import CartItemsList from '@/components/cart/CartItemsList';
import CheckoutForm from '@/components/cart/CheckoutForm';
import dictionary from '@/lib/copy-dictionary.json';

export default function CartPage() {
  const { items } = useCartStore();
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent SSR hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto flex max-w-container-max flex-1 flex-col items-center justify-center px-gutter py-xl">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            sync
          </span>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const handleCheckoutSuccess = (orderId: string) => {
    setCreatedOrderId(orderId);
    setIsSuccess(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main
        className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter py-xl w-full"
        dir="ltr"
      >
        <header className="text-center mb-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            {dictionary.cart.header.tagline}
          </p>
          <h1 className="mt-sm font-display text-5xl font-bold text-on-surface">
            {dictionary.cart.header.title}
          </h1>
        </header>

        {isSuccess ? (
          <div className="mx-auto max-w-md rounded-2xl border border-emerald-100 bg-emerald-50/50 p-xl text-center shadow-soft">
            <span className="material-symbols-outlined text-5xl text-emerald-600 mb-sm">
              check_circle
            </span>
            <h2 className="text-2xl font-bold text-on-surface">
              {dictionary.cart.success.title}
            </h2>
            <p className="mt-md text-on-surface-variant leading-relaxed">
              {dictionary.cart.success.description}
            </p>
            <div className="mt-lg flex flex-col sm:flex-row justify-center gap-sm">
              {createdOrderId && (
                <Link
                  href={`/orders/${createdOrderId}`}
                  className="rounded-xl bg-primary px-xl py-sm font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint"
                >
                  Suivre ma commande
                </Link>
              )}
              <Link
                href="/our-product"
                className="rounded-xl border border-outline-variant bg-surface-container-low px-xl py-sm font-bold text-on-surface hover:bg-surface-container-high transition-transform active:scale-95"
              >
                {dictionary.cart.success.backButton}
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-md text-center py-xl">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-sm">
              shopping_cart_off
            </span>
            <h2 className="text-2xl font-bold text-on-surface">
              {dictionary.cart.empty.title}
            </h2>
            <p className="mt-sm text-on-surface-variant">
              {dictionary.cart.empty.description}
            </p>
            <Link
              href="/our-product"
              className="mt-lg inline-block rounded-xl bg-primary px-xl py-sm font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint"
            >
              {dictionary.cart.empty.exploreButton}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-xl lg:grid-cols-3">
            {/* Cart Items List */}
            <div className="lg:col-span-2">
              <CartItemsList />
            </div>

            {/* Guest Checkout Form & Summary */}
            <div className="lg:col-span-1">
              <CheckoutForm onSuccess={handleCheckoutSuccess} />
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
