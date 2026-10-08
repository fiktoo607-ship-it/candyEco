import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ContactHero from '@/components/contact/ContactHero';
import ContactLinksCard from '@/components/contact/ContactLinksCard';
import BakeryVisitCard from '@/components/contact/BakeryVisitCard';
import ContactForm from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez Candy Eco ou visitez notre boutique artisanale.',
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main-content" className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter py-xl">
        <ContactHero />

        <section className="mt-xl grid gap-xl lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-xl">
            <ContactForm />
            <ContactLinksCard />
          </div>
          <BakeryVisitCard />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}