import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ProductBrowser from '@/components/our-product/ProductBrowser';

export default function OurProductPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter py-xl">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">المنتجات</p>
          <h1 className="mt-sm font-display text-5xl font-bold text-on-surface">إبداعاتنا الحرفية</h1>
          <p className="mx-auto mt-md max-w-2xl text-lg leading-8 text-on-surface-variant">مصنوعة يدوياً بمكونات فاخرة. استمتع بمجموعتنا من المخبوزات الطازجة.</p>
        </header>

        <section className="mt-xl">
          <ProductBrowser />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}