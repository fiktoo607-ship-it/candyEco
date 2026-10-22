import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import BlogArticleContent from '@/components/blog/BlogArticleContent';
import SimilarPosts from '@/components/blog/SimilarPosts';
import { BlogPostItem } from '@/components/blog/types';
import { THEME_CONFIG } from '@/lib/theme';
import { getBaseUrl } from '@/lib/site-url';
import { formatBlogDate } from '@/lib/date';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post || !post.isPublished) {
    return {
      title: `Article non trouvé | ${THEME_CONFIG.brand.name}`,
      description: "L'article que vous recherchez est introuvable ou a été retiré.",
    };
  }

  const baseUrl = getBaseUrl();
  const articleUrl = `${baseUrl}/blog/${post.slug}`;
  const ogImage = post.coverImage.startsWith('http')
    ? post.coverImage
    : `${baseUrl}${post.coverImage.startsWith('/') ? '' : '/'}${post.coverImage}`;

  return {
    title: `${post.title} | ${THEME_CONFIG.brand.name}`,
    description: post.summary,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: `${post.title} | ${THEME_CONFIG.brand.name}`,
      description: post.summary,
      url: articleUrl,
      siteName: THEME_CONFIG.brand.name,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [THEME_CONFIG.brand.name],
      section: post.category,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | ${THEME_CONFIG.brand.name}`,
      description: post.summary,
      images: [ogImage],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post || !post.isPublished) {
    notFound();
  }

  // Fetch similar posts in the same category
  let similarPosts = await prisma.blogPost.findMany({
    where: {
      id: { not: post.id },
      isPublished: true,
      category: post.category,
      OR: [
        { publishedAt: null },
        { publishedAt: { lte: new Date() } },
      ],
    },
    take: 3,
    orderBy: [
      { publishedAt: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  // If fewer than 3 posts found in category, supplement with recent posts from other categories
  if (similarPosts.length < 3) {
    const existingIds = [post.id, ...similarPosts.map((p) => p.id)];
    const additionalPosts = await prisma.blogPost.findMany({
      where: {
        id: { notIn: existingIds },
        isPublished: true,
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: new Date() } },
        ],
      },
      take: 3 - similarPosts.length,
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    similarPosts = [...similarPosts, ...additionalPosts];
  }

  const serializableSimilarPosts: BlogPostItem[] = similarPosts.map((p) => ({
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

  const formattedDate = formatBlogDate(post.publishedAt || post.createdAt);
  const baseUrl = getBaseUrl();
  const articleUrl = `${baseUrl}/blog/${post.slug}`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main id="main-content" className="mx-auto flex max-w-container-max flex-1 flex-col px-gutter py-md md:py-xl w-full">
        {/* JSON-LD Structured Data for Breadcrumbs & BlogPosting */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Accueil',
                    item: `${baseUrl}/home`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Blog',
                    item: `${baseUrl}/blog`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: post.category,
                    item: `${baseUrl}/blog?category=${encodeURIComponent(post.category)}`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 4,
                    name: post.title,
                    item: articleUrl,
                  },
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'BlogPosting',
                headline: post.title,
                description: post.summary,
                image: post.coverImage,
                datePublished: (post.publishedAt || post.createdAt).toISOString(),
                dateModified: post.updatedAt.toISOString(),
                mainEntityOfPage: {
                  '@type': 'WebPage',
                  '@id': articleUrl,
                },
                author: {
                  '@type': 'Organization',
                  name: THEME_CONFIG.brand.name,
                },
                publisher: {
                  '@type': 'Organization',
                  name: THEME_CONFIG.brand.name,
                  logo: {
                    '@type': 'ImageObject',
                    url: `${baseUrl}/logo-title.png`,
                  },
                },
              },
            ]),
          }}
        />


        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-container transition-colors group"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Retour aux articles</span>
          </Link>
        </div>

        {/* Article Container */}
        <article className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <header className="space-y-4 md:space-y-6 text-center mb-8 md:mb-12">
            {/* Badges: Category & Reading Time */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <span className="bg-primary text-white text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full shadow-sm">
                {post.category}
              </span>
              <span className="bg-surface-container-high text-on-surface text-xs md:text-sm font-medium px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{post.readingTime || 3} min de lecture</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-on-surface leading-tight tracking-tight max-w-3xl mx-auto">
              {post.title}
            </h1>

            {/* Summary / Lead */}
            <p className="text-lg md:text-xl text-on-surface-variant font-normal leading-relaxed max-w-2xl mx-auto">
              {post.summary}
            </p>

            {/* Author / Metadata info */}
            <div className="flex items-center justify-center gap-4 text-xs md:text-sm text-outline pt-2 border-t border-outline-variant/30 max-w-md mx-auto">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">{THEME_CONFIG.brand.name}</span>
              </div>
              <span aria-hidden="true">•</span>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <time dateTime={(post.publishedAt || post.createdAt).toISOString()}>{formattedDate}</time>
              </div>
            </div>

            {/* Hero Cover Image */}
            <div className="relative aspect-[16/9] w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-soft bg-surface-container-low mt-6 md:mt-8">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          </header>

          {/* Formatted Article Content */}
          <div className="bg-surface rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 border border-outline-variant/40 shadow-soft">
            <BlogArticleContent content={post.content} />

            {/* Tags Section */}
            <div className="mt-12 pt-8 border-t border-outline-variant/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">Catégorie :</span>
                <span className="px-3 py-1 rounded-full bg-surface-container-low text-primary font-medium text-xs">
                  #{post.category}
                </span>
              </div>
            </div>
          </div>

          {/* Articles Similaires Section */}
          <SimilarPosts posts={serializableSimilarPosts} currentCategory={post.category} />
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
