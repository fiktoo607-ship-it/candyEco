import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import BlogBrowser from '@/components/blog/BlogBrowser';
import { BlogPostItem } from '@/components/blog/types';
import { THEME_CONFIG } from '@/lib/theme';
import { getBaseUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Blog & Actualités | ${THEME_CONFIG.brand.name}`,
  description:
    'Découvrez nos recettes artisanales, nos secrets de pâtisserie, nos ingrédients bio d’exception et les coulisses de notre atelier.',
  openGraph: {
    title: `Blog Gourmand & Artisanal | ${THEME_CONFIG.brand.name}`,
    description:
      'Recettes de tradition, ingrédients biologiques et coulisses de notre atelier artisanal.',
    type: 'website',
    url: `${getBaseUrl()}/blog`,
    siteName: THEME_CONFIG.brand.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `Blog & Actualités | ${THEME_CONFIG.brand.name}`,
    description:
      'Recettes de tradition, ingrédients biologiques et coulisses de notre atelier artisanal.',
  },
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: {
      isPublished: true,
      OR: [
        { publishedAt: null },
        { publishedAt: { lte: new Date() } },
      ],
    },
    orderBy: [
      { publishedAt: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  const serializablePosts: BlogPostItem[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    content: p.content,
    coverImage: p.coverImage,
    category: p.category,
    readingTime: p.readingTime,
    isPublished: p.isPublished,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main id="main-content" className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter py-md md:py-xl w-full">
        {/* JSON-LD Structured Data for BreadcrumbList */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Accueil',
                  item: `${getBaseUrl()}/home`,
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Blog',
                  item: `${getBaseUrl()}/blog`,
                },
              ],
            }),
          }}
        />


        {/* Page Header */}
        <header className="mb-6 md:mb-10 text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-on-surface tracking-tight">
            Le Blog Gourmand & Artisanal
          </h1>
          <p className="text-on-surface-variant text-base md:text-lg leading-relaxed">
            Plongez dans l&apos;univers de <strong className="text-primary font-semibold">{THEME_CONFIG.brand.name}</strong> : recettes exclusives, bienfaits de nos ingrédients bio et coulisses de fabrication.
          </p>
        </header>

        {/* Interactive Blog Browser (Hero, Pills, Search, Grid) */}
        <BlogBrowser initialPosts={serializablePosts} />
      </main>
      <SiteFooter />
    </div>
  );
}
