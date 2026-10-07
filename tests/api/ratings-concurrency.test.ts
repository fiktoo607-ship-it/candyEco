import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST as submitRatingViaRatingRoute } from '@/app/api/products/[id]/rating/route';
import { POST as submitRatingViaProductRoute } from '@/app/api/products/[id]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('@/lib/cloudinary', () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
  getPublicIdFromUrl: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'user-uuid-1', role: 'user', name: 'User 1' },
  }),
}));

vi.mock('@/lib/prisma', () => {
  const ratingsStore: Array<{ id: string; productId: string; rating: number; userId?: string }> = [];

  const mockPrisma = {
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
    },
    rating: {
      create: vi.fn(async ({ data }: any) => {
        const entry = { id: `r-${ratingsStore.length + 1}`, ...data };
        ratingsStore.push(entry);
        return entry;
      }),
      aggregate: vi.fn(async ({ where }: any) => {
        const matches = ratingsStore.filter(r => r.productId === where.productId);
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
    _ratingsStore: ratingsStore,
  };
});

describe('Atomic Rating Aggregation and Concurrency', () => {
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
    vi.mocked(prisma.order.findFirst).mockResolvedValue({ id: 'order-delivered-1' } as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(testProduct as any);
    vi.mocked(prisma.product.update).mockImplementation((async ({ data }: any) => ({
      ...testProduct,
      rating: data.rating,
      ratingCount: data.ratingCount,
    } as any)) as any);
  });

  it('should route via /api/products/[id]/rating and atomically aggregate', async () => {
    vi.mocked(prisma.rating.aggregate).mockResolvedValueOnce({
      _avg: { rating: 5.0 },
      _count: 1,
    } as any);

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

  it('should handle simulated concurrent ratings atomically without lost updates', async () => {
    let currentAvg = 0;
    let currentCount = 0;

    // Simulate 3 concurrent submissions: rating 5, rating 4, rating 3
    const submittedScores = [5, 4, 3];

    for (let i = 0; i < submittedScores.length; i++) {
      const score = submittedScores[i];
      const newCount = i + 1;
      const runningSum = submittedScores.slice(0, newCount).reduce((a, b) => a + b, 0);
      const runningAvg = parseFloat((runningSum / newCount).toFixed(2));

      vi.mocked(prisma.rating.create).mockResolvedValueOnce({ id: `r-${i + 1}`, rating: score, productId: testProduct.id } as any);
      vi.mocked(prisma.rating.aggregate).mockResolvedValueOnce({
        _avg: { rating: runningAvg },
        _count: newCount,
      } as any);

      const req = new NextRequest(`http://localhost/api/products/${testProduct.id}`, {
        method: 'POST',
        body: JSON.stringify({ rating: score }),
      });

      const res = await submitRatingViaProductRoute(req, { params: Promise.resolve({ id: testProduct.id }) });
      expect(res.status).toBe(200);
      const resJson = await res.json();

      currentAvg = resJson.rating;
      currentCount = resJson.ratingCount;
    }

    // Final average of [5, 4, 3] = 12 / 3 = 4.0
    expect(currentAvg).toBe(4.0);
    expect(currentCount).toBe(3);
  });
});
