import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AboutHero from '@/components/about/AboutHero';
import HeritageSection from '@/components/about/HeritageSection';
import ValuesSection from '@/components/about/ValuesSection';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter py-xl">
        <AboutHero />
        <HeritageSection />
        <ValuesSection />
      </main>
      <SiteFooter />
    </div>
  );
}