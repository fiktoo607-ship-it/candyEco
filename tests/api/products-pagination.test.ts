import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getProducts } from '@/app/api/products/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      product: {
        findMany: vi.fn(),
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

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      orderBy: [
        { visibility: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: 6,
      take: 6,
      include: { tags: true }
    });
  });

  it('should pass correct category filtering for "aliments traditionnel"', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/products?category=aliments%20traditionnel');
    await getProducts(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        category: 'aliments traditionnel'
      },
      orderBy: [
        { visibility: 'desc' },
        { createdAt: 'desc' },
      ],
      include: { tags: true }
    });
  });

  it('should pass correct category filtering for "gâteau"', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/products?category=gâteau');
    await getProducts(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        category: 'gâteau'
      },
      orderBy: [
        { visibility: 'desc' },
        { createdAt: 'desc' },
      ],
      include: { tags: true }
    });
  });

  it('should pass search filter when search query is specified', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/products?search=choco');
    await getProducts(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        title: { contains: 'choco', mode: 'insensitive' }
      },
      orderBy: [
        { visibility: 'desc' },
        { createdAt: 'desc' },
      ],
      include: { tags: true }
    });
  });

  it('should pass correct tags filter when tags query is specified', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/products?tags=لوز,شوكولا');
    await getProducts(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        tags: {
          some: {
            name: {
              in: ['لوز', 'شوكولا']
            }
          }
        }
      },
      orderBy: [
        { visibility: 'desc' },
        { createdAt: 'desc' },
      ],
      include: { tags: true }
    });
  });

  it('should fall back to no skip/take if page/limit parameters are omitted', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost/api/products');
    await getProducts(req);

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      orderBy: [
        { visibility: 'desc' },
        { createdAt: 'desc' },
      ],
      include: { tags: true }
    });
  });
});
