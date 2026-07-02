"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useBakeryStore } from '@/lib/store';
import { useCartStore } from '@/lib/cart-store';
import { THEME_CONFIG } from '@/lib/theme';
import dictionary from '@/lib/copy-dictionary.json';
import { useSession, signOut } from 'next-auth/react';
import { useConfig } from '@/lib/hooks/use-config';

const navigationLinks = [
  { href: '/home', label: dictionary.navigation.home },
  { href: '/our-product', label: dictionary.navigation.products },
  { href: '/about', label: dictionary.navigation.about },
  { href: '/contact', label: dictionary.navigation.contact }
];

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function ShoppingCartIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const mobileMenuOpen = useBakeryStore((state) => state.mobileMenuOpen);
  const toggleMobileMenu = useBakeryStore((state) => state.toggleMobileMenu);
  const closeMobileMenu = useBakeryStore((state) => state.closeMobileMenu);

  const totalItemsCount = useCartStore((state) => state.getTotalItemsCount());
  const { data: session, status } = useSession();
  const { data: config } = useConfig();

  const storeEnabled = config?.store_enabled !== false;
  const storeMessage = config?.store_message;

  // Prevent SSR hydration mismatch on cart count
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  return (
    <>
      {mounted && !storeEnabled && storeMessage && (
        <div className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white px-gutter py-2 text-center font-semibold text-sm shadow-md flex items-center justify-center gap-xs relative z-50 animate-fade-in select-none">
          <span className="material-symbols-outlined text-base animate-pulse">error</span>
          <span>{storeMessage}</span>
        </div>
      )}
      <header className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-container-max items-center justify-between px-4 md:px-gutter">
        <Link href="/home" className="flex items-center">
          <Image
            src="/logo-title.png"
            alt={THEME_CONFIG.brand.logoText}
            width={198}
            height={40}
            className="h-8 w-auto object-contain md:h-10"
            priority
          />
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
            <ShoppingCartIcon className="h-6 w-6" />
            {mounted && totalItemsCount > 0 && (
              <span
                style={{ backgroundColor: THEME_CONFIG.colorRoles.accent10.yellowPrimary, color: THEME_CONFIG.colorRoles.accent10.textOnYellow }}
                className="absolute -top-xs -right-xs flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow-soft"
              >
                {totalItemsCount}
              </span>
            )}
          </Link>

          {mounted && status === 'authenticated' && session && (
            <>
              {session.user.role === 'admin' && (
                <Link
                  href="/dashboard"
                  className="rounded-full bg-primary/10 px-md py-sm text-sm font-semibold text-primary hover:bg-primary/20 transition-colors ml-sm"
                >
                  Tableau de bord
                </Link>
              )}
              <div className="flex items-center gap-xs ml-sm border-l border-outline-variant/30 pl-sm">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover border border-outline"
                  />
                ) : (
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant select-none">
                    account_circle
                  </span>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/home' })}
                  className="text-sm font-semibold text-on-surface-variant hover:text-error transition-colors px-sm py-sm"
                >
                  Déconnecter
                </button>
              </div>
            </>
          )}

          {mounted && status === 'unauthenticated' && (
            <Link
              href="/login"
              className="rounded-full bg-primary px-md py-sm text-sm font-semibold text-white hover:bg-surface-tint hover:scale-[1.02] active:scale-95 transition-all ml-sm"
            >
              Connexion
            </Link>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/cart" className="relative flex items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest p-2 text-primary">
            <ShoppingCartIcon className="h-6 w-6" />
            {mounted && totalItemsCount > 0 && (
              <span
                style={{ backgroundColor: THEME_CONFIG.colorRoles.accent10.yellowPrimary, color: THEME_CONFIG.colorRoles.accent10.textOnYellow }}
                className="absolute -top-xs -right-xs flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow-soft"
              >
                {totalItemsCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="inline-flex items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest p-2 text-primary"
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

            {mounted && status === 'authenticated' && session && (
              <>
                {session.user.role === 'admin' && (
                  <Link
                    href="/dashboard"
                    className="rounded-xl px-md py-sm text-base font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors text-center"
                  >
                    Tableau de bord
                  </Link>
                )}
                <div className="flex items-center justify-between border-t border-outline-variant/20 pt-sm mt-xs px-md">
                  <div className="flex items-center gap-sm">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover border border-outline"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant select-none">
                        account_circle
                      </span>
                    )}
                    <span className="text-sm font-medium text-on-surface truncate max-w-[120px]">
                      {session.user.name || 'Mon Compte'}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/home' })}
                    className="text-sm font-semibold text-error hover:underline"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            )}

            {mounted && status === 'unauthenticated' && (
              <Link
                href="/login"
                className="rounded-xl bg-primary px-md py-sm text-base font-semibold text-white text-center hover:bg-surface-tint transition-colors"
              >
                Connexion
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
    </>
  );
}