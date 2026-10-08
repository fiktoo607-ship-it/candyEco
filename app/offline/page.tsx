"use client";

import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/home';
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center p-md bg-background text-center select-none">
        <div className="max-w-md w-full rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-soft">
          <span className="material-symbols-outlined text-6xl text-primary mb-md animate-pulse select-none notranslate" translate="no">
            wifi_off
          </span>
          <h1 className="font-display font-bold text-3xl text-on-surface mb-sm">
            Vous êtes hors ligne
          </h1>
          <p className="text-sm text-on-surface-variant mb-lg leading-relaxed">
            Il semble que vous n&apos;êtes pas connecté à Internet. Certaines fonctionnalités, comme la validation de commande, ne sont pas disponibles sans connexion.
          </p>
          <button
            onClick={handleRetry}
            className="w-full rounded-xl bg-primary hover:bg-surface-tint hover:scale-[1.02] active:scale-95 px-md py-sm text-sm font-semibold text-white shadow-soft transition-all"
          >
            Réessayer
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
