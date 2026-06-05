import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import HeroCarousel from '@/components/home/HeroCarousel';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import StorySection from '@/components/home/StorySection';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
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
  try {
    const carouselSlugs = [
      'chakhchoukhat-dfer',
      'tajine-zitoun-avec-khobz-el-dar',
      'sables-a-la-confiture',
      'dziriettes'
    ];
    const dbCarouselProducts = await prisma.product.findMany({
      where: {
        slug: { in: carouselSlugs }
      }
    });
    carouselProducts = carouselSlugs
      .map(slug => dbCarouselProducts.find(p => p.slug === slug))
      .filter(Boolean);
  } catch (err) {
    console.error('Failed to fetch carousel products from database:', err);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroCarousel products={carouselProducts} />
        <FeaturedProducts products={displayFeatured} />
        <StorySection />
      </main>
      <SiteFooter />
    </div>
  );
}