import { vi, describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Helper function that mirrors the logic implemented in app/home/page.tsx
async function getPopularProducts(limit: number) {
  const mostOrderedItems = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: {
      quantity: true
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: limit
  });

  const orderedProductIds = mostOrderedItems.map(item => item.productId);

  let popularProducts: any[] = [];
  if (orderedProductIds.length > 0) {
    const fetchedProducts = await prisma.product.findMany({
      where: {
        id: { in: orderedProductIds },
        state: 'exist'
      },
      include: {
        tags: true
      }
    });
    
    popularProducts = orderedProductIds
      .map(id => fetchedProducts.find(p => p.id === id))
      .filter((p): p is any => !!p);
  }

  if (popularProducts.length < limit) {
    const remainingCount = limit - popularProducts.length;
    const fallbackProducts = await prisma.product.findMany({
      where: {
        state: 'exist',
        id: { notIn: popularProducts.map(p => p.id) }
      },
      orderBy: [
        { visibility: 'desc' },
        { createdAt: 'desc' }
      ],
      take: remainingCount,
      include: {
        tags: true
      }
    });
    popularProducts = [...popularProducts, ...fallbackProducts];
  }

  return popularProducts;
}

// Mock Prisma client
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    orderItem: {
      groupBy: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
  };
});

describe('Popular Products Query Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProductA = { id: 'prod-a', title: 'Product A', state: 'exist', tags: [] };
  const mockProductB = { id: 'prod-b', title: 'Product B', state: 'exist', tags: [] };
  const mockProductC = { id: 'prod-c', title: 'Product C', state: 'exist', tags: [] };
  const mockProductD = { id: 'prod-d', title: 'Product D', state: 'exist', tags: [] };

  it('should retrieve most ordered products based on orderItem grouping', async () => {
    // Mock groupBy returning prod-b (most ordered) then prod-a
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValueOnce([
      { productId: 'prod-b', _sum: { quantity: 15 } },
      { productId: 'prod-a', _sum: { quantity: 5 } }
    ] as any);

    // Mock findMany returning the product details (in arbitrary order)
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([mockProductA, mockProductB] as any);

    const result = await getPopularProducts(2);

    expect(prisma.orderItem.groupBy).toHaveBeenCalledWith({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 2
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['prod-b', 'prod-a'] }, state: 'exist' },
      include: { tags: true }
    });

    // Check that popularity order (B then A) is preserved
    expect(result).toEqual([mockProductB, mockProductA]);
  });

  it('should fall back to general products if there are no orders', async () => {
    // No orders in DB
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValueOnce([]);
    // Mock fallback products
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([mockProductC, mockProductD] as any);

    const result = await getPopularProducts(2);

    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { state: 'exist', id: { notIn: [] } },
      orderBy: [{ visibility: 'desc' }, { createdAt: 'desc' }],
      take: 2,
      include: { tags: true }
    });

    expect(result).toEqual([mockProductC, mockProductD]);
  });

  it('should fetch ordered products first and fill the remaining slots with fallbacks', async () => {
    // Grouping returns 1 ordered product (prod-b) but the limit is 3
    vi.mocked(prisma.orderItem.groupBy).mockResolvedValueOnce([
      { productId: 'prod-b', _sum: { quantity: 10 } }
    ] as any);

    // First findMany call for ordered products
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([mockProductB] as any);
    // Second findMany call for fallbacks (avoiding prod-b)
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([mockProductC, mockProductD] as any);

    const result = await getPopularProducts(3);

    expect(prisma.product.findMany).toHaveBeenCalledTimes(2);
    // Verifying it filters out prod-b from the fallback query
    expect(prisma.product.findMany).toHaveBeenLastCalledWith({
      where: { state: 'exist', id: { notIn: ['prod-b'] } },
      orderBy: [{ visibility: 'desc' }, { createdAt: 'desc' }],
      take: 2,
      include: { tags: true }
    });

    expect(result).toEqual([mockProductB, mockProductC, mockProductD]);
  });
});
