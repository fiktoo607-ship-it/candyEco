import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getBaseUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  // Stable baseline date for core content pages instead of volatile current moment
  const staticLastModified = new Date('2026-03-01T00:00:00.000Z');

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: staticLastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/home`,
      lastModified: staticLastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/our-product`,
      lastModified: staticLastModified,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: staticLastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: staticLastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    const products = await prisma.product.findMany({
      where: {
        state: 'exist',
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/our-product/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : staticLastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.error('Failed to generate product sitemap entries:', error);
    return staticRoutes;
  }
}
