import Link from 'next/link';

import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { featuredProducts as fallbackFeatured } from '@/lib/site-data';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let displayFeatured = fallbackFeatured;
  try {
    const dbFeatured = await prisma.product.findMany({
      where: {
        OR: [
          { badge: { not: null } },
          { name: { in: ['كرواسون الزبدة الكلاسيكي', 'تارت التوت الموسمي', 'رغيف العجين المخمر الحرفي'] } }
        ]
      },
      take: 3
    });
    if (dbFeatured && dbFeatured.length > 0) {
      displayFeatured = dbFeatured.map(p => ({
        name: p.name,
        category: p.category,
        price: p.price,
        image: p.image,
        badge: p.badge || undefined,
        description: p.description,
        filter: p.filter as any
      }));
    }
  } catch (err) {
    console.error('Failed to fetch featured products from database, using fallback:', err);
  }
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-surface-container-lowest">
          <div className="absolute inset-0">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA07iZjoM13sVYlYQtUrcUwHXEJnsSdStrPwobecH0ta-m9CvgHlptFEPOBkp8jrkQMglUT2NEHuZNDR0HeNnTryeYJd6TbsTc-36AH3SpOTczwCSe5H5KiEAtLR55uIa6oHq2pHkyWw6tsKesLqwXA-qc1wGMnOuIAt94oNM1UlbV97h8r5HrBKSkrce39SbhAy1adboz6hV3-zSgaAA8hpKz6R1EJjJgL84ob9DAHX6kr7YxPP6nWVnL6lNMpUT-saqFqLvaRV9I"
              alt="خلفية حلويات"
              className="h-full w-full object-cover object-center opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-surface/85 via-surface/45 to-transparent" />
          </div>

          <div className="relative mx-auto flex min-h-[640px] max-w-container-max items-center px-gutter py-xl">
            <div className="max-w-2xl">
              <p className="mb-sm text-sm font-semibold uppercase tracking-[0.3em] text-primary">Artisanal Bakery</p>
              <h1 className="font-display text-5xl font-bold leading-tight text-on-surface md:text-6xl">حلويات مصنوعة يدوياً لكل لحظة</h1>
              <p className="mt-md max-w-xl text-lg leading-8 text-on-surface-variant">استمتع بدفء مطبخنا الصباحي مع المعجنات والكعك الحرفي المخبوز طازجاً يومياً باستخدام أجود المكونات.</p>
              <div className="mt-lg flex flex-wrap gap-sm">
                <Link href="/our-product" className="rounded-xl bg-primary-container px-xl py-md text-base font-semibold text-white transition-transform hover:scale-[0.98]">
                  تسوق الآن
                </Link>
                <Link href="/about" className="rounded-xl border border-outline-variant bg-surface-container-lowest px-xl py-md text-base font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low">
                  قصتنا
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-container-max px-gutter py-xl">
          <div className="mb-lg text-center">
            <h2 className="font-display text-4xl font-bold text-on-surface">حلويات مميزة</h2>
            <div className="mx-auto mt-sm h-1 w-16 rounded-full bg-primary-container" />
          </div>

          <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
            {displayFeatured.map((product) => (
              <article key={product.name} className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft transition-transform hover:-translate-y-1">
                <div className="relative aspect-square overflow-hidden border-b border-surface-container">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                  {product.badge ? <span className="absolute left-sm top-sm rounded-full bg-secondary-container/20 px-3 py-1 text-sm font-semibold text-on-surface">{product.badge}</span> : null}
                </div>
                <div className="flex h-full flex-col justify-between p-md">
                  <div>
                    <p className="mb-xs text-sm font-semibold uppercase tracking-[0.2em] text-primary">{product.category}</p>
                    <h3 className="font-display text-2xl font-bold text-on-surface">{product.name}</h3>
                  </div>
                  <div className="mt-md flex items-center justify-between">
                    <span className="font-display text-2xl font-bold text-on-surface">{product.price}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-container-max gap-lg px-gutter pb-xl md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-4xl font-bold text-on-surface">مصنوع باليد، لا بالسرعة</h2>
            <p className="mt-md text-lg leading-8 text-on-surface-variant">نحن نخبز بعقلية الحِرفة: عجين بطيء، زبدة جيدة، ومواعيد نضج دقيقة. النتيجة هي حلويات تبدو يومية، لكنها تحمل طبقة فاخرة في كل قضمة.</p>
          </div>
          <div className="overflow-hidden rounded-2xl shadow-soft">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ9D8JLa_bfz2-LqILaPS5Y5BNwRA_3_bfuzgyv-_AiSHUdnRMTf5_AZb6INTxhlP88O8s1X6XR4AHvNDEXK2EDRRgpY4cna0MCbdHkCPv5-jz00MwRuChHhuklDPaHhX_dCvMy5Dv9urTEaOek3gFOHeGFvTCbs0nYdUqQJqghQfUlyn25b0pdgqrw3irttdyHjTFncU2Z5NssW_4gRAVVey6EbOYqQdOcZJoP5395MAXo8JM1qL2SqWTp83OEnG2GDgZVOXJyyo"
              alt="الخبز الحرفي"
              className="h-[420px] w-full object-cover"
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}