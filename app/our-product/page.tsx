import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ProductBrowser from '@/components/our-product/ProductBrowser';
import dictionary from '@/lib/copy-dictionary.json';

export default function OurProductPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter pt-md pb-xl md:py-xl">


        <section className="mt-xl">
          <ProductBrowser />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}