"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import { useCartStore } from '@/lib/cart-store';
import CartItemsList from '@/components/cart/CartItemsList';
import CheckoutForm from '@/components/cart/CheckoutForm';

export default function CartPage() {
  const { items } = useCartStore();
  const [isSuccess, setIsSuccess] = useState(false);
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
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter py-xl w-full" dir="ltr">
        <header className="text-center mb-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Panier</p>
          <h1 className="mt-sm font-display text-5xl font-bold text-on-surface">Votre Commande Actuelle</h1>
        </header>

        {isSuccess ? (
          <div className="mx-auto max-w-md rounded-2xl border border-emerald-100 bg-emerald-50/50 p-xl text-center shadow-soft">
            <span className="material-symbols-outlined text-5xl text-emerald-600 mb-sm">check_circle</span>
            <h2 className="text-2xl font-bold text-on-surface">Commande envoyée !</h2>
            <p className="mt-md text-on-surface-variant leading-relaxed">
              Merci pour votre commande. Nous avons bien reçu vos informations et notre équipe va la traiter dans les plus brefs délais.
            </p>
            <Link
              href="/our-product"
              className="mt-lg inline-block rounded-xl bg-primary px-xl py-sm font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint"
            >
              Retour aux produits
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-md text-center py-xl">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-sm">shopping_cart_off</span>
            <h2 className="text-2xl font-bold text-on-surface">Votre panier est vide</h2>
            <p className="mt-sm text-on-surface-variant">Vous n'avez pas encore ajouté de produits dans votre panier.</p>
            <Link
              href="/our-product"
              className="mt-lg inline-block rounded-xl bg-primary px-xl py-sm font-bold text-white shadow-soft transition-transform active:scale-95 hover:bg-surface-tint"
            >
              Découvrir nos produits
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
              <CheckoutForm onSuccess={() => setIsSuccess(true)} />
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
