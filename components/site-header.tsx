"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { navigationLinks } from '@/lib/site-data';
import { useBakeryStore } from '@/lib/store';
import { useCartStore } from '@/lib/cart-store';

function MenuIcon() {
  return <span className="material-symbols-outlined text-2xl">menu</span>;
}

function CloseIcon() {
  return <span className="material-symbols-outlined text-2xl">close</span>;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const mobileMenuOpen = useBakeryStore((state) => state.mobileMenuOpen);
  const toggleMobileMenu = useBakeryStore((state) => state.toggleMobileMenu);
  const closeMobileMenu = useBakeryStore((state) => state.closeMobileMenu);

  const totalItemsCount = useCartStore((state) => state.getTotalItemsCount());

  // Prevent SSR hydration mismatch on cart count
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-container-max items-center justify-between px-gutter">
        <Link href="/home" className="font-display text-2xl font-bold text-primary">
          مخبز حرفي
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-md md:flex">
          <nav className="flex items-center gap-md">
            {navigationLinks.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-base transition-colors duration-200 ${active ? 'border-b-2 border-primary pb-1 text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/cart" className="relative flex items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest p-3 text-primary hover:bg-surface-container-low transition-colors ml-sm">
            <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            {mounted && totalItemsCount > 0 && (
              <span className="absolute -top-xs -right-xs flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-soft">
                {totalItemsCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-sm md:hidden">
          <Link href="/cart" className="relative flex items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest p-3 text-primary">
            <span className="material-symbols-outlined text-2xl">shopping_cart</span>
            {mounted && totalItemsCount > 0 && (
              <span className="absolute -top-xs -right-xs flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-soft">
                {totalItemsCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="inline-flex items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest p-3 text-primary"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-outline-variant/20 bg-surface-container-lowest px-gutter py-md md:hidden">
          <nav className="flex flex-col gap-sm">
            {navigationLinks.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-md py-sm text-base transition-colors ${active ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}