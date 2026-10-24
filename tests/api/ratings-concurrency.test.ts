import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST as submitRatingViaRatingRoute } from '@/app/api/products/[id]/rating/route';
import { POST as submitRatingViaProductRoute } from '@/app/api/products/[id]/route';
import { POST as submitRatingViaReviewsRoute } from '@/app/api/products/[id]/reviews/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('@/lib/cloudinary', () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
  getPublicIdFromUrl: vi.fn(),
}));

const { ratingsStore } = vi.hoisted(() => {
  const store: Array<{ id: string; productId: string; rating: number; userId?: string }> = [];
  return { ratingsStore: store };
});

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'user-uuid-1', role: 'user', name: 'User 1' },
  }),
}));

vi.mock('@/lib/prisma', () => {
  const store = ratingsStore;

  const mockPrisma = {
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
    },
    rating: {
      findFirst: vi.fn(async ({ where }: any) => {
        return store.find(r => r.productId === where.productId && r.userId === where.userId) || null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const entry = { id: `r-${store.length + 1}`, ...data };
        store.push(entry);
        return entry;
      }),
      aggregate: vi.fn(async ({ where }: any) => {
        const matches = store.filter(r => r.productId === where.productId);
        const count = matches.length;
        const sum = matches.reduce((acc, curr) => acc + curr.rating, 0);
        return {
          _avg: { rating: count > 0 ? sum / count : null },
          _count: count,
        };
      }),
    },
    $transaction: vi.fn(async (cb: any) => {
      if (typeof cb === 'function') {
        return await cb(mockPrisma);
      }
      return cb;
    }),
  };

  return {
    prisma: mockPrisma,
    _ratingsStore: store,
  };
});

describe('Atomic Rating Aggregation and Concurrency (Issue #61, #152)', () => {
  const testProduct = {
    id: 'prod-atomic-1',
    title: 'Atomic Croissant',
    slug: 'atomic-croissant',
    price: '3.50',
    category: 'Viennoiserie',
    rating: 0,
    ratingCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    ratingsStore.length = 0;
    vi.mocked(prisma.order.findFirst).mockResolvedValue({ id: 'order-delivered-1' } as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(testProduct as any);
    vi.mocked(prisma.product.update).mockImplementation((async ({ data }: any) => ({
      ...testProduct,
      rating: data.rating,
      ratingCount: data.ratingCount,
    } as any)) as any);
  });

  it('should route via /api/products/[id]/rating and atomically aggregate', async () => {
    const req = new NextRequest(`http://localhost/api/products/${testProduct.id}/rating`, {
      method: 'POST',
      body: JSON.stringify({ rating: 5 }),
    });

    const res = await submitRatingViaRatingRoute(req, { params: Promise.resolve({ id: testProduct.id }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.rating).toBe(5);
    expect(data.ratingCount).toBe(1);

    expect(prisma.rating.create).toHaveBeenCalled();
    expect(prisma.rating.aggregate).toHaveBeenCalledWith({
      where: { productId: testProduct.id },
      _avg: { rating: true },
      _count: true,
    });
  });

  it('should route via /api/products/[id]/reviews and atomically aggregate', async () => {
    const req = new NextRequest(`http://localhost/api/products/${testProduct.id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating: 4 }),
    });

    const res = await submitRatingViaReviewsRoute(req, { params: Promise.resolve({ id: testProduct.id }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.rating).toBe(4);
    expect(data.ratingCount).toBe(1);

    expect(prisma.rating.create).toHaveBeenCalled();
    expect(prisma.rating.aggregate).toHaveBeenCalledWith({
      where: { productId: testProduct.id },
      _avg: { rating: true },
      _count: true,
    });
  });

  it('should accurately calculate average under concurrent review posts via Promise.all (Issue #61, #152)', async () => {
    // 4 concurrent reviews from 4 distinct users
    const submissions = [
      { userId: 'user-concurrent-1', rating: 5 },
      { userId: 'user-concurrent-2', rating: 4 },
      { userId: 'user-concurrent-3', rating: 3 },
      { userId: 'user-concurrent-4', rating: 4 },
    ];

    // Simulate concurrent HTTP requests executed in parallel with Promise.all
    const responses = await Promise.all(
      submissions.map(async (sub) => {
        const req = new NextRequest(`http://localhost/api/products/${testProduct.id}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': `192.168.1.${sub.userId.slice(-1)}`,
          },
          body: JSON.stringify({ rating: sub.rating }),
        });

        // Set authenticated user for this concurrent request
        vi.mocked(getServerSession).mockResolvedValueOnce({
          user: { id: sub.userId, role: 'user', name: sub.userId },
        } as any);

        return await submitRatingViaReviewsRoute(req, {
          params: Promise.resolve({ id: testProduct.id }),
        });
      })
    );

    // Verify all 4 concurrent requests completed successfully (status 200)
    for (const res of responses) {
      expect(res.status).toBe(200);
    }

    // Verify all 4 ratings were atomically persisted in the ratings table
    expect(ratingsStore).toHaveLength(4);

    // Verify all scores are stored correctly
    const storedScores = ratingsStore.map((r) => r.rating);
    expect(storedScores).toEqual([5, 4, 3, 4]);

    // Expected final average: (5 + 4 + 3 + 4) / 4 = 16 / 4 = 4.0
    const finalExpectedSum = 5 + 4 + 3 + 4;
    const finalExpectedCount = 4;
    const finalExpectedAvg = finalExpectedSum / finalExpectedCount;

    // Verify that the final update to the product record matches the true aggregation
    expect(prisma.product.update).toHaveBeenLastCalledWith({
      where: { id: testProduct.id },
      data: {
        rating: finalExpectedAvg,
        ratingCount: finalExpectedCount,
      },
    });
  });
});
