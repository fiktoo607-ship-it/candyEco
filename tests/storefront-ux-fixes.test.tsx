// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { prisma } from '@/lib/prisma';
import { getHomePageData } from '@/lib/services/home.service';
import { getSocialLink, INSTAGRAM_URL, TIKTOK_URL } from '@/lib/social-icons';
import BakeryVisitCard from '@/components/contact/BakeryVisitCard';
import ContactLinksCard from '@/components/contact/ContactLinksCard';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
    carouselSlide: {
      findMany: vi.fn(),
    },
    faq: {
      findMany: vi.fn(),
    },
    orderItem: {
      groupBy: vi.fn(),
    },
    siteConfig: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

describe('Storefront Content and Delivery UX Fixes', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Issue #66: Home Featured + Carousel Product Slides Filter State Exist', () => {
    it('should include where: { state: "exist" } when querying featured products and carousel product slides', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.carouselSlide.findMany).mockResolvedValue([]);
      vi.mocked(prisma.faq.findMany).mockResolvedValue([]);
      vi.mocked(prisma.orderItem.groupBy).mockResolvedValue([]);

      await getHomePageData();

      // Check featured products query
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ state: 'exist' }),
          orderBy: [
            { visibility: 'desc' },
            { createdAt: 'desc' }
          ],
          take: 5,
        })
      );

      // Check carousel products query includes state: 'exist'
      const calls = vi.mocked(prisma.product.findMany).mock.calls;
      const carouselCall = calls.find(call => call[0]?.where?.slug && call[0]?.where?.state);
      expect(carouselCall).toBeDefined();
      expect(carouselCall![0]?.where?.state).toBe('exist');
    });
  });

  describe('Issue #53: Contact Instagram Link points to authentic Instagram, not TikTok', () => {
    it('should return authentic Instagram URL and prevent pointing to TikTok', () => {
      expect(getSocialLink('Instagram', 'https://www.tiktok.com/@les.delices.d.eva')).toBe(INSTAGRAM_URL);
      expect(getSocialLink('Instagram', undefined)).toBe(INSTAGRAM_URL);
      expect(getSocialLink('Instagram', '#')).toBe(INSTAGRAM_URL);
      expect(INSTAGRAM_URL).toContain('instagram.com/lesdelices.d.eva');
      expect(INSTAGRAM_URL).not.toContain('tiktok.com');
    });

    it('should return authentic TikTok URL for TikTok platform', () => {
      expect(getSocialLink('TikTok', undefined)).toBe(TIKTOK_URL);
      expect(TIKTOK_URL).toContain('tiktok.com/@les.delices.d.eva');
    });

    it('should render correct Instagram href in ContactLinksCard', async () => {
      const card = await ContactLinksCard();
      await act(async () => {
        root?.render(card);
      });

      const links = container?.querySelectorAll('a') || [];
      const igLink = Array.from(links).find(a => a.textContent?.includes('Instagram'));
      expect(igLink).toBeDefined();
      expect(igLink?.getAttribute('href')).toBe(INSTAGRAM_URL);
      expect(igLink?.getAttribute('href')).not.toContain('tiktok.com');
    });
  });

  describe('Issue #54: Contact Page ships authentic store address and email, no New York or placeholder', () => {
    it('should render authentic Paris address and email in BakeryVisitCard', async () => {
      const card = await BakeryVisitCard();
      await act(async () => {
        root?.render(card);
      });

      const content = container?.textContent || '';
      expect(content).not.toContain('New York');
      expect(content).not.toContain('124 Rue Baker');
      expect(content).not.toContain('contact@boulangerie-artisanale.fr');

      expect(content).toContain('15 Rue de la Paix');
      expect(content).toContain('75002 Paris');
      expect(content).toContain('contact@lesdelicesdeva.fr');
      expect(content).toContain('33695049833');
    });
  });
});
