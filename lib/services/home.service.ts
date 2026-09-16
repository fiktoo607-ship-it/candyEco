import { prisma } from '@/lib/prisma';
import { getDictionaryWithDbOverrides } from '@/lib/config';

export interface HomeProductItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  price: string | number;
  imageUrl: string | null;
  description: string | null;
  story?: string | null;
  limitBay?: number | null;
  state: any;
  publishedAt: Date | null;
  tags?: string[];
}

export interface CarouselSlideItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  isProduct: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface HomePageData {
  featuredProducts: HomeProductItem[];
  newProducts: HomeProductItem[];
  popularProducts: HomeProductItem[];
  carouselSlides: CarouselSlideItem[];
  story: {
    title: string;
    description: string;
    imageUrl: string;
  };
  faqs: FaqItem[];
}

/**
 * Fetch featured products for home page
 */
async function getFeaturedProducts(): Promise<HomeProductItem[]> {
  try {
    const dbFeatured = await prisma.product.findMany({
      orderBy: [
        { visibility: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        price: true,
        imageUrl: true,
        description: true,
        story: true,
        limitBay: true,
        state: true,
        publishedAt: true,
      },
    });

    return dbFeatured.map((p) => ({
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
    }));
  } catch (err) {
    console.error('Failed to fetch featured products from database:', err);
    return [];
  }
}

/**
 * Fetch newly published products
 */
async function getNewProducts(newProductsLimit: number): Promise<HomeProductItem[]> {
  try {
    const dbNewProducts = await prisma.product.findMany({
      where: { state: 'exist' },
      orderBy: { createdAt: 'desc' },
      take: newProductsLimit,
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        price: true,
        imageUrl: true,
        description: true,
        story: true,
        limitBay: true,
        state: true,
        publishedAt: true,
        tags: {
          select: {
            name: true,
          },
        },
      },
    });

    return dbNewProducts.map((p) => ({
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
      tags: p.tags.map((t) => t.name),
    }));
  } catch (err) {
    console.error('Failed to fetch new products from database:', err);
    return [];
  }
}

/**
 * Fetch most ordered / popular products with fallback
 */
async function getPopularProducts(popularLimit = 4): Promise<HomeProductItem[]> {
  try {
    const mostOrderedItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: popularLimit,
    });

    const orderedProductIds = mostOrderedItems.map((item) => item.productId);

    let popularProducts: any[] = [];
    if (orderedProductIds.length > 0) {
      const fetchedProducts = await prisma.product.findMany({
        where: {
          id: { in: orderedProductIds },
          state: 'exist',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          price: true,
          imageUrl: true,
          description: true,
          story: true,
          limitBay: true,
          state: true,
          publishedAt: true,
          tags: {
            select: {
              name: true,
            },
          },
        },
      });

      popularProducts = orderedProductIds
        .map((id) => fetchedProducts.find((p) => p.id === id))
        .filter((p): p is any => !!p);
    }

    if (popularProducts.length < popularLimit) {
      const remainingCount = popularLimit - popularProducts.length;
      const fallbackProducts = await prisma.product.findMany({
        where: {
          state: 'exist',
          id: { notIn: popularProducts.map((p) => p.id) },
        },
        orderBy: [
          { visibility: 'desc' },
          { createdAt: 'desc' },
        ],
        take: remainingCount,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          price: true,
          imageUrl: true,
          description: true,
          story: true,
          limitBay: true,
          state: true,
          publishedAt: true,
          tags: {
            select: {
              name: true,
            },
          },
        },
      });
      popularProducts = [...popularProducts, ...fallbackProducts];
    }

    return popularProducts.map((p) => ({
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
      tags: p.tags?.map((t: any) => t.name) || [],
    }));
  } catch (err) {
    console.error('Failed to fetch popular products from database:', err);
    return [];
  }
}

/**
 * Fetch carousel slides combining CMS product slugs and custom carousel slides
 */
async function getCarouselSlides(
  selectedSlugs: string[],
  maxSlides: number
): Promise<CarouselSlideItem[]> {
  try {
    let productSlides: CarouselSlideItem[] = [];

    if (selectedSlugs.length > 0) {
      const selectedProducts = await prisma.product.findMany({
        where: {
          slug: { in: selectedSlugs },
        },
      });

      productSlides = selectedSlugs
        .map((slug) => selectedProducts.find((p) => p.slug === slug))
        .filter((p): p is any => !!p)
        .map((p) => ({
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

    const formattedCustomSlides: CarouselSlideItem[] = customSlides.map((slide) => ({
      id: slide.id,
      title: slide.title,
      description: slide.description,
      imageUrl: slide.imageUrl,
      linkUrl: slide.linkUrl,
      isProduct: false,
    }));

    return [...productSlides, ...formattedCustomSlides].slice(0, maxSlides);
  } catch (err) {
    console.error('Failed to fetch carousel slides from database:', err);
    return [];
  }
}

/**
 * Fetch FAQs
 */
async function getFaqs(): Promise<FaqItem[]> {
  try {
    const dbFaqs = await prisma.faq.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return dbFaqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
    }));
  } catch (err) {
    console.error('Failed to fetch FAQs from database:', err);
    return [];
  }
}

/**
 * Main service function to gather all data needed for Home Page
 */
export async function getHomePageData(): Promise<HomePageData> {
  const dictionary = await getDictionaryWithDbOverrides();

  const newProductsLimit = Number(dictionary.cms?.new_products_limit ?? 4);
  const selectedSlugs = dictionary.cms?.carousel_products || [];
  const maxSlides = Number(dictionary.cms?.carousel_max_slides ?? 5);

  const [
    featuredProducts,
    newProducts,
    popularProducts,
    carouselSlides,
    faqs,
  ] = await Promise.all([
    getFeaturedProducts(),
    getNewProducts(newProductsLimit),
    getPopularProducts(4),
    getCarouselSlides(selectedSlugs, maxSlides),
    getFaqs(),
  ]);

  return {
    featuredProducts,
    newProducts,
    popularProducts,
    carouselSlides,
    story: {
      title: dictionary.home?.story?.title || '',
      description: dictionary.home?.story?.description || '',
      imageUrl: dictionary.home?.story?.image || '',
    },
    faqs,
  };
}
