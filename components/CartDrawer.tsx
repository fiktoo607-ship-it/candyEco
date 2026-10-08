"use client";

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import CartItemsList from '@/components/cart/CartItemsList';
import PriceDisplay from '@/components/PriceDisplay';
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CartDrawer({ isOpen = true, onClose }: CartDrawerProps) {
  const { items, getTotalPrice, getTotalItemsCount } = useCartStore();
  const totalPrice = getTotalPrice();
  const totalCount = getTotalItemsCount();

  const drawerRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panier d'achats"
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
    >
      <div
        ref={drawerRef}
        className="relative flex h-full w-full max-w-md flex-col bg-surface-container-lowest shadow-2xl p-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-sm">
          <h2 className="text-xl font-bold text-on-surface">
            Votre Panier ({totalCount})
          </h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le panier"
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="material-symbols-outlined text-xl select-none" aria-hidden="true">
                close
              </span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-md">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-xl text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-sm text-outline" aria-hidden="true">
                shopping_bag
              </span>
              <p className="font-semibold text-base">Votre panier est vide</p>
            </div>
          ) : (
            <CartItemsList />
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-outline-variant/30 pt-md space-y-sm">
            <div className="flex justify-between items-center text-base font-bold text-on-surface">
              <span>Total</span>
              <span className="text-xl text-primary"><PriceDisplay price={totalPrice} /></span>
            </div>
            <Link
              href="/cart"
              onClick={onClose}
              className="block w-full text-center rounded-xl bg-primary py-sm text-base font-bold text-white shadow-soft hover:bg-surface-tint transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Commander
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export { CartDrawer };
