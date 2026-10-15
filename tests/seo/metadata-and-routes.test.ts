import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

vi.mock('next/font/google', () => ({
  Outfit: () => ({ variable: 'outfit' }),
  Fredoka: () => ({ variable: 'fredoka' }),
}));

import sitemap from '@/app/sitemap';
import { prisma } from '@/lib/prisma';
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

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

describe('Issues #71, #110, and #128: SEO Metadata, Sitemap & 404 Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Issue #71 & #110: Unique Route Titles & Metadata', () => {
    it('verifies store routes do not share duplicate titles and each route has a unique clear title', () => {
      const titles = [
        homeMetadata.title,
        aboutMetadata.title,
        contactMetadata.title,
        ourProductMetadata.title,
        productsMetadata.title,
        cartMetadata.title,
        ordersMetadata.title,
        orderDetailsMetadata.title,
        loginMetadata.title,
        registerMetadata.title,
        verifyEmailMetadata.title,
        dashboardMetadata.title,
        offlineMetadata.title,
      ];

      // Each title must be defined and non-empty
      for (const t of titles) {
        expect(typeof t).toBe('string');
        expect((t as string).trim().length).toBeGreaterThan(0);
      }

      // Check for distinct unique titles across routes
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });
  });

  describe('Issue #128: Clean Sitemap entries without /cart and with stable lastmod dates', () => {
    it('ensures app/sitemap.ts excludes /cart route and lastmod is not dynamically tied to current timestamp', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        { slug: 'croissant-artisanal', updatedAt: new Date('2026-02-15T10:00:00Z') },
      ] as any);

      const items1 = await sitemap();
      await new Promise((resolve) => setTimeout(resolve, 20));
      const items2 = await sitemap();

      const urls = items1.map((i) => i.url);

      // Verify /cart is excluded from sitemap
      expect(urls.some((u) => u.endsWith('/cart'))).toBe(false);

      // Verify static routes have stable lastModified dates, not volatile current moment on every call
      const homeEntry1 = items1.find((i) => i.url.endsWith('/home'));
      const homeEntry2 = items2.find((i) => i.url.endsWith('/home'));

      expect(homeEntry1).toBeDefined();
      expect(homeEntry2).toBeDefined();
      expect(homeEntry1?.lastModified).toEqual(homeEntry2?.lastModified);

      // Verify product route uses product updatedAt
      const productEntry = items1.find((i) => i.url.includes('/our-product/croissant-artisanal'));
      expect(productEntry?.lastModified).toEqual(new Date('2026-02-15T10:00:00Z'));
    });
  });

  describe('Issue #71: Custom 404 Not Found Page', () => {
    it('verifies that app/not-found.tsx exists in the project and adheres to site layout', () => {
      const notFoundPath = path.join(process.cwd(), 'app', 'not-found.tsx');
      expect(fs.existsSync(notFoundPath)).toBe(true);

      const content = fs.readFileSync(notFoundPath, 'utf8');
      expect(content).toContain('SiteHeader');
      expect(content).toContain('SiteFooter');
      expect(content).toMatch(/404|non trouvée|Page introuvable/i);
    });
  });
});
