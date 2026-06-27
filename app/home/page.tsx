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

  let displayNewProducts: any[] = [];
  try {
    const newProductsLimit = Number(dictionary.cms?.new_products_limit ?? 4);
    const dbNewProducts = await prisma.product.findMany({
      where: { state: 'exist' },
      orderBy: { createdAt: 'desc' },
      take: newProductsLimit,
      include: {
        tags: true
      }
    });
    if (dbNewProducts && dbNewProducts.length > 0) {
      displayNewProducts = dbNewProducts.map(p => ({
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
        publishedAt: p.publishedAt,
        tags: p.tags.map(t => t.name)
      }));
    }
  } catch (err) {
    console.error('Failed to fetch new products from database:', err);
  }

  let displayPopularProducts: any[] = [];
  try {
    const popularLimit = 4;
    const mostOrderedItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: popularLimit
    });

    const orderedProductIds = mostOrderedItems.map(item => item.productId);

    let popularProducts = [];
    if (orderedProductIds.length > 0) {
      const fetchedProducts = await prisma.product.findMany({
        where: {
          id: { in: orderedProductIds },
          state: 'exist'
        },
        include: {
          tags: true
        }
      });
      
      popularProducts = orderedProductIds
        .map(id => fetchedProducts.find(p => p.id === id))
        .filter((p): p is any => !!p);
    }

    if (popularProducts.length < popularLimit) {
      const remainingCount = popularLimit - popularProducts.length;
      const fallbackProducts = await prisma.product.findMany({
        where: {
          state: 'exist',
          id: { notIn: popularProducts.map(p => p.id) }
        },
        orderBy: [
          { visibility: 'desc' },
          { createdAt: 'desc' }
        ],
        take: remainingCount,
        include: {
          tags: true
        }
      });
      popularProducts = [...popularProducts, ...fallbackProducts];
    }

    if (popularProducts.length > 0) {
      displayPopularProducts = popularProducts.map(p => ({
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
        publishedAt: p.publishedAt,
        tags: p.tags.map((t: any) => t.name)
      }));
    }
  } catch (err) {
    console.error('Failed to fetch popular products from database:', err);
  }

  let carouselSlides: any[] = [];
  let storyTitle = "";
  let storyDescription = "";

  try {
    const selectedSlugs = dictionary.cms?.carousel_products || [];
    const maxSlides = Number(dictionary.cms?.carousel_max_slides ?? 5);

    let productSlides: any[] = [];
    if (selectedSlugs.length > 0) {
      const selectedProducts = await prisma.product.findMany({
        where: {
          slug: { in: selectedSlugs },
        },
      });
      productSlides = selectedSlugs
        .map((slug: string) => selectedProducts.find((p: any) => p.slug === slug))
        .filter((p: any): p is any => !!p)
        .map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          imageUrl: p.imageUrl,
          linkUrl: `/our-product/${p.slug}`,
          isProduct: true,
        }));
    }

    const customSlides = await prisma.carouselSlide.findMany({
      orderBy: { order: 'asc' },
    });
    const formattedCustomSlides = customSlides.map((slide) => ({
      id: slide.id,
      title: slide.title,
      description: slide.description,
      imageUrl: slide.imageUrl,
      linkUrl: slide.linkUrl,
      isProduct: false,
    }));

    carouselSlides = [...productSlides, ...formattedCustomSlides].slice(0, maxSlides);

    storyTitle = dictionary.home?.story?.title || "";
    storyDescription = dictionary.home?.story?.description || "";
  } catch (err) {
    console.error('Failed to fetch carousel slides/stories from database:', err);
  }

  let displayFaqs: any[] = [];
  try {
    const dbFaqs = await prisma.faq.findMany({
      orderBy: { createdAt: 'asc' },
    });
    displayFaqs = dbFaqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
    }));
  } catch (err) {
    console.error('Failed to fetch FAQs from database:', err);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HomeProductSection
          initialFeaturedProducts={displayFeatured}
          initialNewProducts={displayNewProducts}
          initialPopularProducts={displayPopularProducts}
          storyTitle={storyTitle}
          storyDescription={storyDescription}
          carouselSlides={carouselSlides}
          initialFaqs={displayFaqs}
        />
      </main>
      <SiteFooter />
    </div>
  );
}