import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/font/google', () => ({
  Outfit: () => ({ variable: 'outfit' }),
  Fredoka: () => ({ variable: 'fredoka' }),
}));
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { prisma } from '@/lib/prisma';
// @ts-expect-error next.config.mjs has no declaration file
import nextConfig from '@/next.config.mjs';
import { metadata as layoutMetadata } from '@/app/layout';
import { metadata as homeMetadata } from '@/app/home/page';
import { metadata as aboutMetadata } from '@/app/about/page';
import { metadata as contactMetadata } from '@/app/contact/page';
import { metadata as ourProductMetadata } from '@/app/our-product/page';
import { metadata as productsMetadata } from '@/app/products/page';
import { metadata as cartMetadata } from '@/app/cart/layout';
import { metadata as ordersMetadata } from '@/app/orders/layout';
import { metadata as orderDetailsMetadata } from '@/app/orders/[id]/layout';
import { metadata as loginMetadata } from '@/app/login/layout';
import { metadata as registerMetadata } from '@/app/register/layout';
import { metadata as verifyEmailMetadata } from '@/app/verify-email/layout';
import { metadata as dashboardMetadata } from '@/app/dashboard/layout';
import { metadata as offlineMetadata } from '@/app/offline/layout';
import fs from 'fs';
import path from 'path';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

describe('SEO, Sitemap, Caching & Metadata Implementation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Issue #69: robots.txt and sitemap.xml', () => {
    it('robots() should allow public routes, disallow /admin/*, and link to sitemap', () => {
      const robotsData = robots();

      expect(robotsData.sitemap).toBeDefined();
      expect(robotsData.sitemap).toContain('/sitemap.xml');

      const rules = Array.isArray(robotsData.rules) ? robotsData.rules[0] : robotsData.rules;
      expect(rules).toBeDefined();
      expect(rules.userAgent).toBe('*');
      expect(rules.allow).toBe('/');

      const disallow = Array.isArray(rules.disallow) ? rules.disallow : [rules.disallow];
      expect(disallow).toContain('/admin/*');
    });

    it('sitemap() should generate dynamic sitemap with main routes and active products', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        { slug: 'croissant-bio', updatedAt: new Date('2026-01-01') },
        { slug: 'pain-chocolat', updatedAt: new Date('2026-01-02') },
      ] as any);

      const items = await sitemap();

      const urls = items.map((i) => i.url);
      expect(urls.some((u) => u.endsWith('/'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/home'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/our-product'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/about'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/contact'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/cart'))).toBe(true);

      expect(urls.some((u) => u.endsWith('/our-product/croissant-bio'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/our-product/pain-chocolat'))).toBe(true);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { state: 'exist' },
        select: { slug: true, updatedAt: true },
      });
    });
  });

  describe('Issue #67: Static Assets Caching (next.config.mjs & vercel.json)', () => {
    it('next.config.mjs should set immutable Cache-Control headers for static assets', async () => {
      const headers = await nextConfig.headers();

      const imagesRule = headers.find((h: any) => h.source.includes('images'));
      expect(imagesRule).toBeDefined();
      const imageCacheControl = imagesRule.headers.find((h: any) => h.key === 'Cache-Control');
      expect(imageCacheControl?.value).toBe('public, max-age=31536000, immutable');

      const staticRule = headers.find((h: any) => h.source.includes('_next/static'));
      expect(staticRule).toBeDefined();
      const staticCacheControl = staticRule.headers.find((h: any) => h.key === 'Cache-Control');
      expect(staticCacheControl?.value).toBe('public, max-age=31536000, immutable');
    });

    it('vercel.json should contain cache headers matching CDN requirements', () => {
      const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
      expect(fs.existsSync(vercelJsonPath)).toBe(true);

      const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
      expect(vercelConfig.headers).toBeDefined();

      const imagesHeader = vercelConfig.headers.find((h: any) => h.source.includes('images'));
      expect(imagesHeader).toBeDefined();
      const imageCache = imagesHeader.headers.find((h: any) => h.key === 'Cache-Control');
      expect(imageCache?.value).toBe('public, max-age=31536000, immutable');

      const nextStaticHeader = vercelConfig.headers.find((h: any) => h.source.includes('_next/static'));
      expect(nextStaticHeader).toBeDefined();
      const nextStaticCache = nextStaticHeader.headers.find((h: any) => h.key === 'Cache-Control');
      expect(nextStaticCache?.value).toBe('public, max-age=31536000, immutable');
    });
  });

  describe('Issue #71: Document Title Template and Per-Page Metadata', () => {
    it('layout.tsx should define title default and template matching Candy Eco', () => {
      expect(layoutMetadata.title).toEqual({
        default: 'Candy Eco',
        template: '%s | Candy Eco',
      });
    });

    it('storefront pages and layouts should export distinct metadata titles', () => {
      expect(homeMetadata.title).toBe('Accueil');
      expect(aboutMetadata.title).toBe('À Propos');
      expect(contactMetadata.title).toBe('Contact');
      expect(ourProductMetadata.title).toBe('Nos Produits');
      expect(productsMetadata.title).toBe('Nos Produits');
      expect(cartMetadata.title).toBe('Panier');
      expect(ordersMetadata.title).toBe('Mes Commandes');
      expect(orderDetailsMetadata.title).toBe('Suivi de Commande');
      expect(loginMetadata.title).toBe('Connexion');
      expect(registerMetadata.title).toBe('Inscription');
      expect(verifyEmailMetadata.title).toBe('Vérification de l’email');
      expect(dashboardMetadata.title).toBe('Tableau de Bord');
      expect(offlineMetadata.title).toBe('Hors Ligne');
    });
  });
});
