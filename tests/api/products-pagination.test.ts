import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getProducts } from '@/app/api/products/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      product: {
        findMany: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
      },
    },
  };
});

describe('Products API - Pagination & Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass correct skip and take when page and limit are specified', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/products?page=2&limit=6');
    await getProducts(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPublished: true,
          visibility: { gte: 0 },
        }),
        orderBy: [
          { visibility: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: 6,
        take: 6,
        include: { tags: true }
      })
    );
  });

  it('should pass correct category filtering for "aliments traditionnel"', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/products?category=aliments%20traditionnel');
    await getProducts(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: 'aliments traditionnel',
          isPublished: true,
          visibility: { gte: 0 },
        }),
        orderBy: [
          { visibility: 'desc' },
          { createdAt: 'desc' },
        ],
        include: { tags: true }
      })
    );
  });

  it('should pass correct category filtering for "gâteau"', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/products?category=gâteau');
    await getProducts(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: 'gâteau',
          isPublished: true,
          visibility: { gte: 0 },
        }),
        orderBy: [
          { visibility: 'desc' },
          { createdAt: 'desc' },
        ],
        include: { tags: true }
      })
    );
  });

  it('should pass search filter when search query is specified', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/products?search=choco');
    await getProducts(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: { contains: 'choco', mode: 'insensitive' },
          isPublished: true,
          visibility: { gte: 0 },
        }),
        orderBy: [
          { visibility: 'desc' },
          { createdAt: 'desc' },
        ],
        include: { tags: true }
      })
    );
  });

  it('should pass correct tags filter when tags query is specified', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/products?tags=لوز,شوكولا');
    await getProducts(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tags: {
            some: {
              name: {
                in: ['لوز', 'شوكولا']
              }
            }
          },
          isPublished: true,
          visibility: { gte: 0 },
        }),
        orderBy: [
          { visibility: 'desc' },
          { createdAt: 'desc' },
        ],
        include: { tags: true }
      })
    );
  });

  it('should fall back to no skip/take if page/limit parameters are omitted', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/products');
    await getProducts(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPublished: true,
          visibility: { gte: 0 },
        }),
        orderBy: [
          { visibility: 'desc' },
          { createdAt: 'desc' },
        ],
        include: { tags: true }
      })
    );
  });

  it('should order by rating desc when sortBy=rating-desc is specified', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/products?sortBy=rating-desc');
    await getProducts(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPublished: true,
          visibility: { gte: 0 },
        }),
        orderBy: [
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        include: { tags: true }
      })
    );
  });

  it('should order by rating asc when sortBy=rating-asc is specified', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/products?sortBy=rating-asc');
    await getProducts(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPublished: true,
          visibility: { gte: 0 },
        }),
        orderBy: [
          { rating: 'asc' },
          { createdAt: 'desc' },
        ],
        include: { tags: true }
      })
    );
  });

  describe('Catalog Visibility and DB-Level Pagination (Issue #144, #10)', () => {
    it('returns exactly 10 visible items when drafts exist in DB and filters via Prisma where clause before skip/take', async () => {
      // Simulate 25 published products total in database (out of e.g. 50 products where 25 are drafts)
      vi.mocked(prisma.product.count).mockResolvedValueOnce(25);

      // Generate 10 published products (including default visibility 0)
      const visibleProducts = Array.from({ length: 10 }, (_, i) => ({
        id: `prod-visible-${i + 1}`,
        title: `Gateau Artisanal ${i + 1}`,
        slug: `gateau-artisanal-${i + 1}`,
        price: '12.50',
        category: 'gâteau',
        imageUrl: 'https://example.com/gateau.jpg',
        description: 'Delicieux gateau',
        story: 'Histoire',
        limitBay: 10,
        state: 'exist',
        visibility: 0, // Default visibility 0 must be treated as active
        isPublished: true,
        publishedAt: new Date('2026-01-01T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        tags: [],
      }));

      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(visibleProducts as any);

      const req = new NextRequest('http://localhost/api/products?page=1&limit=10');
      const response = await getProducts(req);

      expect(response.status).toBe(200);
      const items = await response.json();

      // Exactly 10 items returned on page 1
      expect(items).toHaveLength(10);
      expect(items[0].id).toBe('prod-visible-1');
      expect(items[9].id).toBe('prod-visible-10');

      // Verify that where clause filters by isPublished and visibility at the Prisma query level before skip/take
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            visibility: { gte: 0 },
          }),
          skip: 0,
          take: 10,
        })
      );

      // Pagination headers based on published count
      expect(response.headers.get('x-total-count')).toBe('25');
      expect(response.headers.get('x-has-next-page')).toBe('true');
    });

    it('returns exactly 10 visible items on page 2 with skip 10 and take 10', async () => {
      vi.mocked(prisma.product.count).mockResolvedValueOnce(25);

      const page2Products = Array.from({ length: 10 }, (_, i) => ({
        id: `prod-visible-${i + 11}`,
        title: `Gateau Artisanal ${i + 11}`,
        slug: `gateau-artisanal-${i + 11}`,
        price: '12.50',
        category: 'gâteau',
        imageUrl: 'https://example.com/gateau.jpg',
        description: 'Delicieux gateau',
        story: 'Histoire',
        limitBay: 10,
        state: 'exist',
        visibility: 0,
        isPublished: true,
        publishedAt: new Date('2026-01-01T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        tags: [],
      }));

      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(page2Products as any);

      const req = new NextRequest('http://localhost/api/products?page=2&limit=10');
      const response = await getProducts(req);

      expect(response.status).toBe(200);
      const items = await response.json();

      expect(items).toHaveLength(10);
      expect(items[0].id).toBe('prod-visible-11');
      expect(items[9].id).toBe('prod-visible-20');

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            visibility: { gte: 0 },
          }),
          skip: 10,
          take: 10,
        })
      );

      expect(response.headers.get('x-total-count')).toBe('25');
      expect(response.headers.get('x-has-next-page')).toBe('true');
    });
  });

  describe('Unbounded Pagination Protection (Issue #15)', () => {
    it('should clamp limit=1000000 to safe maximum of 100', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost/api/products?limit=1000000');
      await getProducts(req);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
          skip: 0,
        })
      );
    });

    it('should clamp limit=0 or negative limit to minimum of 1', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

      const req = new NextRequest('http://localhost/api/products?limit=-10');
      await getProducts(req);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
          skip: 0,
        })
      );
    });
  });
});

