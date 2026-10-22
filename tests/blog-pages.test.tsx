// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import BlogCategoryFilter from '@/components/blog/BlogCategoryFilter';
import BlogCard from '@/components/blog/BlogCard';
import BlogHero from '@/components/blog/BlogHero';
import BlogBrowser from '@/components/blog/BlogBrowser';
import SocialShareButtons from '@/components/blog/SocialShareButtons';
import SimilarPosts from '@/components/blog/SimilarPosts';
import SiteFooter from '@/components/site-footer';
import sitemap from '@/app/sitemap';
import { generateMetadata as generateBlogSlugMetadata } from '@/app/blog/[slug]/page';
import { prisma } from '@/lib/prisma';
import { BlogPostItem } from '@/components/blog/types';
import fs from 'fs';
import path from 'path';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/lib/prisma', () => ({
  prisma: {
    blogPost: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

const mockPosts: BlogPostItem[] = [
  {
    id: 'post-1',
    title: 'Les secrets du levain naturel',
    slug: 'les-secrets-du-levain-naturel',
    summary: 'Comment réussir votre premier levain maison bio.',
    content: '<p>Le levain naturel apporte une saveur authentique et une digestion optimale.</p>',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
    category: 'Recettes',
    readingTime: 5,
    isPublished: true,
    publishedAt: '2026-03-15T10:00:00.000Z',
    createdAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-03-15T10:00:00.000Z',
  },
  {
    id: 'post-2',
    title: 'Pourquoi choisir la farine biologique T80 ?',
    slug: 'pourquoi-choisir-la-farine-biologique-t80',
    summary: 'Tout savoir sur les moulins artisanaux et le blé ancien.',
    content: '<p>La farine T80 conserve une grande partie des nutriments du grain.</p>',
    coverImage: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73',
    category: 'Ingrédients Bio',
    readingTime: 4,
    isPublished: true,
    publishedAt: '2026-03-10T08:00:00.000Z',
    createdAt: '2026-03-10T08:00:00.000Z',
    updatedAt: '2026-03-10T08:00:00.000Z',
  },
  {
    id: 'post-3',
    title: 'Une matinée à l’atelier de Délices d’Eva',
    slug: 'une-matinee-a-latelier',
    summary: 'Découvrez les coulisses de nos fournées matinales.',
    content: '<p>Chaque matin à 4h, les pétrins s\'activent dans une ambiance chaleureuse.</p>',
    coverImage: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a',
    category: 'Coulisses',
    readingTime: 3,
    isPublished: true,
    publishedAt: '2026-03-05T06:00:00.000Z',
    createdAt: '2026-03-05T06:00:00.000Z',
    updatedAt: '2026-03-05T06:00:00.000Z',
  },
  {
    id: 'post-4',
    title: 'Nouvelle gamme de pâtisseries sans sucre raffiné',
    slug: 'nouvelle-gamme-patisseries',
    summary: 'Découvrez nos créations sucrées au sirop d’agave et dattes bio.',
    content: '<p>Une douceur gourmande adaptée à un mode de vie sain.</p>',
    coverImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587',
    category: 'Actualités',
    readingTime: 2,
    isPublished: true,
    publishedAt: '2026-03-01T09:00:00.000Z',
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T09:00:00.000Z',
  },
];

describe('Public Blog Pages and Components', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root && container) {
      act(() => {
        root!.unmount();
      });
      document.body.removeChild(container);
    }
  });

  describe('BlogCategoryFilter Component', () => {
    it('should render all expected category pills', async () => {
      const onSelect = vi.fn();
      await act(async () => {
        root!.render(<BlogCategoryFilter selectedCategory="Tous" onSelectCategory={onSelect} />);
      });

      expect(container!.textContent).toContain('Tous');
      expect(container!.textContent).toContain('Recettes');
      expect(container!.textContent).toContain('Ingrédients Bio');
      expect(container!.textContent).toContain('Coulisses');
      expect(container!.textContent).toContain('Actualités');
    });

    it('should call onSelectCategory when a category pill is clicked', async () => {
      const onSelect = vi.fn();
      await act(async () => {
        root!.render(<BlogCategoryFilter selectedCategory="Tous" onSelectCategory={onSelect} />);
      });

      const buttons = container!.querySelectorAll('button');
      const recettesBtn = Array.from(buttons).find((b) => b.textContent?.includes('Recettes'));
      expect(recettesBtn).toBeDefined();

      await act(async () => {
        recettesBtn!.click();
      });

      expect(onSelect).toHaveBeenCalledWith('Recettes');
    });
  });

  describe('BlogHero Component', () => {
    it('should render the hero post with title, badges, and read link', async () => {
      await act(async () => {
        root!.render(<BlogHero post={mockPosts[0]} />);
      });

      expect(container!.textContent).toContain('Les secrets du levain naturel');
      expect(container!.textContent).toContain('5 min de lecture');
      expect(container!.textContent).toContain('Recettes');

      const link = container!.querySelector('a[href="/blog/les-secrets-du-levain-naturel"]');
      expect(link).toBeDefined();
    });
  });

  describe('BlogCard Component', () => {
    it('should render card with reading time badge and category tag', async () => {
      await act(async () => {
        root!.render(<BlogCard post={mockPosts[1]} />);
      });

      expect(container!.textContent).toContain('Pourquoi choisir la farine biologique T80 ?');
      expect(container!.textContent).toContain('Ingrédients Bio');
      expect(container!.textContent).toContain('4 min');
      expect(container!.textContent).toContain('Tout savoir sur les moulins artisanaux');
    });
  });

  describe('BlogBrowser Component (Interactive)', () => {
    it('should render hero post and grid posts without category tabs', async () => {
      await act(async () => {
        root!.render(<BlogBrowser initialPosts={mockPosts} />);
      });

      // Hero post is displayed
      expect(container!.textContent).toContain('Les secrets du levain naturel');
      // Grid posts are displayed
      expect(container!.textContent).toContain('Pourquoi choisir la farine biologique T80 ?');
      expect(container!.textContent).toContain('Une matinée à l’atelier de Délices d’Eva');

      // Category tabs are not rendered in BlogBrowser
      const allButtons = Array.from(container!.querySelectorAll('button'));
      const categoryTabs = allButtons.filter((b) => b.textContent?.includes('Ingrédients Bio'));
      expect(categoryTabs.length).toBe(0);
    });

    it('should filter posts by search term in search input', async () => {
      await act(async () => {
        root!.render(<BlogBrowser initialPosts={mockPosts} />);
      });

      const input = container!.querySelector('input[type="text"]') as HTMLInputElement;
      expect(input).toBeDefined();

      await act(async () => {
        // Native input change
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )!.set;
        nativeInputValueSetter!.call(input, 'farine');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      expect(container!.textContent).toContain('Pourquoi choisir la farine biologique T80 ?');
    });

    it('should show empty state message if no posts match filter', async () => {
      await act(async () => {
        root!.render(<BlogBrowser initialPosts={mockPosts} />);
      });

      const input = container!.querySelector('input[type="text"]') as HTMLInputElement;
      await act(async () => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )!.set;
        nativeInputValueSetter!.call(input, 'motclefintrouvable9999');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      expect(container!.textContent).toContain('Aucun article ne correspond à votre recherche');
    });
  });

  describe('SocialShareButtons Component', () => {
    it('should render share links for Twitter, Facebook, WhatsApp, LinkedIn, and copy link', async () => {
      await act(async () => {
        root!.render(
          <SocialShareButtons
            url="http://localhost:3000/blog/test"
            title="Mon Titre Test"
            summary="Résumé test"
          />
        );
      });

      expect(container!.querySelector('a[aria-label="Partager sur X (Twitter)"]')).not.toBeNull();
      expect(container!.querySelector('a[aria-label="Partager sur Facebook"]')).not.toBeNull();
      expect(container!.querySelector('a[aria-label="Partager sur WhatsApp"]')).not.toBeNull();
      expect(container!.querySelector('a[aria-label="Partager sur LinkedIn"]')).not.toBeNull();
      expect(container!.querySelector('button[aria-label="Copier le lien de l\'article"]')).not.toBeNull();
    });
  });

  describe('SimilarPosts Component', () => {
    it('should render similar post cards', async () => {
      await act(async () => {
        root!.render(<SimilarPosts posts={[mockPosts[1], mockPosts[2]]} currentCategory="Recettes" />);
      });

      expect(container!.textContent).toContain('Articles similaires');
      expect(container!.textContent).toContain('Pourquoi choisir la farine biologique T80 ?');
      expect(container!.textContent).toContain('Une matinée à l’atelier de Délices d’Eva');
    });
  });

  describe('Dynamic Metadata (generateMetadata)', () => {
    it('should return OpenGraph and Twitter metadata for valid published slug', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
        id: 'post-1',
        title: 'Les secrets du levain naturel',
        slug: 'les-secrets-du-levain-naturel',
        summary: 'Comment réussir votre premier levain maison bio.',
        content: 'Contenu',
        coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
        category: 'Recettes',
        readingTime: 5,
        isPublished: true,
        publishedAt: new Date('2026-03-15T10:00:00.000Z'),
        createdAt: new Date('2026-03-15T10:00:00.000Z'),
        updatedAt: new Date('2026-03-15T10:00:00.000Z'),
      });

      const metadata = await generateBlogSlugMetadata({
        params: Promise.resolve({ slug: 'les-secrets-du-levain-naturel' }),
      });

      expect(metadata.title).toContain('Les secrets du levain naturel');
      expect(metadata.description).toBe('Comment réussir votre premier levain maison bio.');
      expect((metadata.openGraph as any)?.type).toBe('article');
      expect(metadata.openGraph?.url).toContain('/blog/les-secrets-du-levain-naturel');
      expect((metadata.twitter as any)?.card).toBe('summary_large_image');
    });

    it('should return fallback metadata if post is not found or unpublished', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);

      const metadata = await generateBlogSlugMetadata({
        params: Promise.resolve({ slug: 'inconnu' }),
      });

      expect(metadata.title).toContain('Article non trouvé');
    });
  });

  describe('Navigation & Sitemap Integration', () => {
    it('SiteHeader should contain "Blog" navigation link to /blog', () => {
      const headerPath = path.join(process.cwd(), 'components/site-header.tsx');
      const headerContent = fs.readFileSync(headerPath, 'utf8');
      expect(headerContent).toContain("href: '/blog'");
      expect(headerContent).toContain("label: 'Blog'");
    });

    it('SiteFooter should contain "Blog" link to /blog', async () => {
      await act(async () => {
        root!.render(<SiteFooter />);
      });

      const blogLink = container!.querySelector('a[href="/blog"]');
      expect(blogLink).not.toBeNull();
      expect(blogLink!.textContent).toBe('Blog');
    });

    it('sitemap() should dynamically include /blog and published post slugs with priority 0.7', async () => {
      vi.mocked(prisma.blogPost.findMany).mockResolvedValue([
        { slug: 'recette-levain-bio', updatedAt: new Date('2026-03-01') },
      ] as any);

      // Mock prisma.product.findMany as well
      (prisma as any).product = {
        findMany: vi.fn().mockResolvedValue([]),
      };

      const sitemapItems = await sitemap();
      const blogMain = sitemapItems.find((item) => item.url.endsWith('/blog'));
      expect(blogMain).toBeDefined();
      expect(blogMain?.priority).toBe(0.8);

      const postItem = sitemapItems.find((item) => item.url.endsWith('/blog/recette-levain-bio'));
      expect(postItem).toBeDefined();
      expect(postItem?.priority).toBe(0.7);
    });
  });
});
