import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ProductBrowser from '@/components/our-product/ProductBrowser';
import dictionary from '@/lib/copy-dictionary.json';

export const metadata: Metadata = {
  title: 'Nos Produits',
  description: 'Découvrez toutes nos créations artisanales et gourmandises.',
};

export default function OurProductPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter py-md md:py-xl">
        <header className="mb-lg text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Catalogue
          </p>
          <h1 className="mt-xs font-display text-3xl sm:text-4xl md:text-5xl font-bold text-on-surface">
            Nos Produits
          </h1>
          <p className="mt-xs max-w-2xl text-sm sm:text-base text-on-surface-variant">
            Découvrez toutes nos créations artisanales et gourmandises traditionnelles.
          </p>
        </header>
        <section className="mt-0 md:mt-md">
          <h2 className="sr-only">Recherche et filtres du catalogue</h2>
          <ProductBrowser />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}