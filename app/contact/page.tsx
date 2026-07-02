import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ContactHero from '@/components/contact/ContactHero';
import ContactLinksCard from '@/components/contact/ContactLinksCard';
import BakeryVisitCard from '@/components/contact/BakeryVisitCard';

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter pt-md pb-xl md:py-xl">
        <ContactHero />

        <section className="mt-xl grid gap-xl lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ContactLinksCard />
          </div>
          <BakeryVisitCard />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}