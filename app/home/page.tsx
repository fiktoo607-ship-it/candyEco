import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import HomeProductSection from '@/components/home/HomeProductSection';
import { prisma } from '@/lib/prisma';
import { getDictionary, initCmsConfigIfNeeded } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Ensure config is initialized in JSON first
  initCmsConfigIfNeeded();
  const dictionary = getDictionary();

  let displayFeatured: any[] = [];
  try {
    const dbFeatured = await prisma.product.findMany({
      orderBy: [
        { visibility: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 12
    });
    if (dbFeatured && dbFeatured.length > 0) {
      displayFeatured = dbFeatured.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        category: p.category,
        price: p.price,
        imageUrl: p.imageUrl,
        description: p.description,
        story: p.story,
        limitBay: p.limitBay,
        state: p.state as any,
        publishedAt: p.publishedAt
      }));
    }
  } catch (err) {
    console.error('Failed to fetch featured products from database, using fallback:', err);
  }

  let carouselProducts: any[] = [];
  let storyTitle = "";
  let storyDescription = "";

  try {
    const carouselSlugs = (dictionary.cms?.carousel_products || []) as string[];
    const dbCarouselProducts = await prisma.product.findMany({
      where: {
        slug: { in: carouselSlugs }
      }
    });
    carouselProducts = carouselSlugs
      .map((slug: string) => dbCarouselProducts.find(p => p.slug === slug))
      .filter(Boolean);

    storyTitle = dictionary.home?.story?.title || "";
    storyDescription = dictionary.home?.story?.description || "";
  } catch (err) {
    console.error('Failed to fetch carousel products/stories from database:', err);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HomeProductSection
          initialFeaturedProducts={displayFeatured}
          storyTitle={storyTitle}
          storyDescription={storyDescription}
          carouselProducts={carouselProducts}
        />
      </main>
      <SiteFooter />
    </div>
  );
}