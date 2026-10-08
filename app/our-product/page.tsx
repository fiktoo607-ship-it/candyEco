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
        <section className="mt-0 md:mt-xl">
          <ProductBrowser />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}