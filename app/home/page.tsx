import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import HeroCarousel from '@/components/home/HeroCarousel';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import StorySection from '@/components/home/StorySection';
import { featuredProducts as fallbackFeatured } from '@/lib/site-data';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let displayFeatured = fallbackFeatured;
  try {
    const dbFeatured = await prisma.product.findMany({
      orderBy: [
        { visibility: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 3
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

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroCarousel />
        <FeaturedProducts products={displayFeatured} />
        <StorySection />
      </main>
      <SiteFooter />
    </div>
  );
}