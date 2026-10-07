import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import HomeProductSection from '@/components/home/HomeProductSection';
import { getHomePageData } from '@/lib/services/home.service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Accueil',
  description: 'Découvrez notre sélection de pâtisseries artisanales, bio et gourmandes.',
};

export default async function HomePage() {
  const {
    featuredProducts,
    newProducts,
    popularProducts,
    carouselSlides,
    story,
    faqs,
  } = await getHomePageData();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HomeProductSection
          initialFeaturedProducts={featuredProducts}
          initialNewProducts={newProducts}
          initialPopularProducts={popularProducts}
          storyTitle={story.title}
          storyDescription={story.description}
          storyImageUrl={story.imageUrl}
          carouselSlides={carouselSlides}
          initialFaqs={faqs}
        />
      </main>
      <SiteFooter />
    </div>
  );
}