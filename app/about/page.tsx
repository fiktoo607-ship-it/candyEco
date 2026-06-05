import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AboutHero from '@/components/about/AboutHero';
import HeritageSection from '@/components/about/HeritageSection';
import ValuesSection from '@/components/about/ValuesSection';
import { getDictionary } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const dictionary = getDictionary();
  const heroTitle = dictionary.about?.hero?.title || "";
  const heroDescription = dictionary.about?.hero?.description || "";
  const heritageTitle = dictionary.about?.heritage?.title || "";
  const heritageDesc1 = dictionary.about?.heritage?.description1 || "";
  const heritageDesc2 = dictionary.about?.heritage?.description2 || "";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter py-xl">
        <AboutHero title={heroTitle} description={heroDescription} />
        <HeritageSection title={heritageTitle} desc1={heritageDesc1} desc2={heritageDesc2} />
        <ValuesSection />
      </main>
      <SiteFooter />
    </div>
  );
}