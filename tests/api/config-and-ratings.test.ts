import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getConfig } from '@/app/api/config/route';
import { GET as getDeliveryMethods } from '@/app/api/delivery-methods/route';
import { POST as submitReview } from '@/app/api/products/[id]/reviews/route';
import { getServerSession } from 'next-auth';
import { getAllSiteConfigs } from '@/lib/config';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

vi.mock('@/lib/cloudinary', () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
  getPublicIdFromUrl: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/config', () => ({
  getAllSiteConfigs: vi.fn(),
  saveSiteConfig: vi.fn(),
  initCmsConfigIfNeeded: vi.fn(),
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    deliveryMethod: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'dm-1', name: 'Standard Delivery', price: 5, active: true },
      ]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
    },
    rating: {
      create: vi.fn(),
      aggregate: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: any) => {
      if (typeof cb === 'function') {
        return await cb(mockPrisma);
      }
      return cb;
    }),
  };

  return { prisma: mockPrisma };
});

describe('Issues #61, #111, and #118: Public Config, Delivery GET Idempotency, and Atomic Ratings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Issue #61: Anonymous access to public store configuration', () => {
    it('allows anonymous users to retrieve public store config with 200 OK instead of 401/403', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      vi.mocked(getAllSiteConfigs).mockResolvedValue({
        store_enabled: true,
        store_message: 'Bienvenue chez CandyEco',
        contact_phone: '+213555000111',
        contact_email: 'contact@candyeco.dz',
      });

      const response = await getConfig();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.store_enabled).toBe(true);
      expect(data.store_message).toBe('Bienvenue chez CandyEco');
      expect(data.error).toBeUndefined();
    });
  });

  describe('Issue #111: Repeated GET on delivery methods without DB mutations', () => {
    it('ensures repeated GET requests to /api/delivery-methods are pure reads and do not perform any DB writes', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      // Send repeated GET requests
      const res1 = await getDeliveryMethods();
      const res2 = await getDeliveryMethods();
      const res3 = await getDeliveryMethods();

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200);

      // Verify no DB mutations / write operations occurred during GET requests
      expect(prisma.deliveryMethod.updateMany).not.toHaveBeenCalled();
      expect(prisma.deliveryMethod.update).not.toHaveBeenCalled();
      expect(prisma.deliveryMethod.create).not.toHaveBeenCalled();
      expect(prisma.deliveryMethod.delete).not.toHaveBeenCalled();
    });
  });

  describe('Issue #118: Atomic rating update via reviews endpoint', () => {
    it('atomically aggregates rating and updates product score via transaction', async () => {
      const productId = 'prod-atomic-test';
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-rater-100', role: 'user' },
      } as any);

      vi.mocked(prisma.order.findFirst).mockResolvedValue({ id: 'order-delivered-100' } as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: productId,
        title: 'Bonbon Caramel',
        rating: 4.0,
        ratingCount: 1,
      } as any);
      vi.mocked(prisma.rating.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.rating.create).mockResolvedValue({
        id: 'r-new',
        productId,
        rating: 5,
        userId: 'user-rater-100',
      } as any);
      vi.mocked(prisma.rating.aggregate).mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: 2,
      } as any);
      vi.mocked(prisma.product.update).mockResolvedValue({
        id: productId,
        rating: 4.5,
        ratingCount: 2,
      } as any);

      const req = new NextRequest(`http://localhost/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 5 }),
      });

      const res = await submitReview(req, { params: Promise.resolve({ id: productId }) });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.rating).toBe(4.5);
      expect(json.ratingCount).toBe(2);

      // Confirm atomic transaction executed create + aggregate + update
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.rating.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId,
          rating: 5,
          userId: 'user-rater-100',
        }),
      });
      expect(prisma.rating.aggregate).toHaveBeenCalledWith({
        where: { productId },
        _avg: { rating: true },
        _count: true,
      });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: productId },
        data: {
          rating: 4.5,
          ratingCount: 2,
        },
      });
    });
  });
});
