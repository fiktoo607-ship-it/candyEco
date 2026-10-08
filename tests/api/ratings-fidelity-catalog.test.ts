import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getProducts } from '@/app/api/products/route';
import { GET as checkCanRate } from '@/app/api/products/[id]/can-rate/route';
import { POST as submitRating } from '@/app/api/products/[id]/route';
import { PUT as updateUser } from '@/app/api/users/[id]/route';
import { POST as registerUser } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

vi.mock('@/lib/prisma', () => {
  const ratingsStore: Array<{ id: string; productId: string; rating: number; userId?: string }> = [];

  const mockPrisma = {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    order: {
      findFirst: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    rating: {
      findFirst: vi.fn(),
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    siteConfig: {
      findUnique: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn().mockResolvedValue(1),
    },
    $transaction: vi.fn(async (cb: any) => {
      if (typeof cb === 'function') {
        return cb(mockPrisma);
      }
      return cb;
    }),
  };

  return {
    prisma: mockPrisma,
    _ratingsStore: ratingsStore,
  };
});

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  createRateLimitResponse: vi.fn(),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

describe('Prompt 7 Verification Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Issue #30: Public Catalog Filtering', () => {
    it('filters out draft, inactive, and future unpublished products for non-admin visitors', async () => {
      const allProducts = [
        {
          id: 'prod-active-1',
          title: 'Active Product',
          state: 'exist',
          publishedAt: new Date('2026-01-01T00:00:00Z'),
          visibility: 5,
        },
        {
          id: 'prod-draft-2',
          title: 'Draft Inactive Product',
          state: 'draft',
          publishedAt: new Date('2026-01-01T00:00:00Z'),
          visibility: 3,
        },
        {
          id: 'prod-future-3',
          title: 'Future Unpublished Product',
          state: 'exist',
          publishedAt: new Date('2099-01-01T00:00:00Z'), // Future date
          visibility: 4,
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(allProducts as any);

      const req = new NextRequest('http://localhost/api/products');
      const res = await getProducts(req);
      expect(res.status).toBe(200);

      const returned = await res.json();
      expect(returned).toHaveLength(1);
      expect(returned[0].id).toBe('prod-active-1');
    });

    it('returns all products without filtering when admin visits dashboard', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-1', role: 'admin' },
      } as any);

      const allProducts = [
        { id: 'prod-active', state: 'exist', publishedAt: new Date(), visibility: 5 },
        { id: 'prod-draft', state: 'draft', publishedAt: new Date(), visibility: 3 },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(allProducts as any);

      const req = new NextRequest('http://localhost/api/products?dashboard=true');
      const res = await getProducts(req);
      expect(res.status).toBe(200);

      const returned = await res.json();
      expect(returned).toHaveLength(2);
    });
  });

  describe('Issue #11 & #10: Duplicate Rating Prevention & Exact Ownership Eligibility', () => {
    it('prevents user from submitting multiple ratings for the same product to artificially inflate score', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-rater-1', role: 'user' },
      } as any);

      // User has already submitted a rating
      vi.mocked(prisma.rating.findFirst).mockResolvedValueOnce({
        id: 'rating-existing',
        productId: 'prod-test',
        userId: 'user-rater-1',
        rating: 5,
      } as any);

      const req = new NextRequest('http://localhost/api/products/prod-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 5 }),
      });

      const res = await submitRating(req, { params: Promise.resolve({ id: 'prod-test' }) });
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toMatch(/déjà évalué/i);
      expect(prisma.rating.create).not.toHaveBeenCalled();
    });

    it('can-rate returns canRate: false with reason already_rated when user already rated product', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'user-rater-1', role: 'user' },
      } as any);

      vi.mocked(prisma.rating.findFirst).mockResolvedValueOnce({
        id: 'rating-1',
        productId: 'prod-test',
        userId: 'user-rater-1',
        rating: 4,
      } as any);

      const req = new NextRequest('http://localhost/api/products/prod-test/can-rate');
      const res = await checkCanRate(req, { params: Promise.resolve({ id: 'prod-test' }) });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.canRate).toBe(false);
      expect(data.reason).toBe('already_rated');
      expect(prisma.order.findFirst).not.toHaveBeenCalled();
    });

    it('can-rate enforces exact user ownership and rejects loose OR phone/email mismatches', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'user-1', phone: '0555112233', email: 'user1@example.com' },
      } as any);

      vi.mocked(prisma.rating.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost/api/products/prod-test/can-rate');
      await checkCanRate(req, { params: Promise.resolve({ id: 'prod-test' }) });

      // Verify that query requires exact ownership, not loose independent OR phone / OR email
      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { userId: 'user-1' },
              {
                customerPhone: '0555112233',
                customerEmail: 'user1@example.com',
                OR: [{ userId: null }, { userId: 'user-1' }],
              },
            ],
          }),
        })
      );
    });
  });

  describe('Issue #19: Dynamic Loyalty/Fidelity Tier Configuration', () => {
    it('immediately applies dynamic fidelity thresholds from database to user tier calculation', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-1', role: 'admin' },
      } as any);

      // Dynamic thresholds loaded from siteConfig: VIP is 800, Fidèle is 250
      vi.mocked(prisma.siteConfig.findUnique)
        .mockResolvedValueOnce({ key: 'fidelity_vip_threshold', value: '800' } as any)
        .mockResolvedValueOnce({ key: 'fidelity_fidele_threshold', value: '250' } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-target',
        trustScore: 50,
      } as any);

      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: 'user-target',
        status: 'VIP',
        trustScore: 800, // Should be elevated to the dynamic threshold 800, not hardcoded 500!
      } as any);

      const req = new NextRequest('http://localhost/api/users/user-target', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VIP' }),
      });

      const res = await updateUser(req, { params: Promise.resolve({ id: 'user-target' }) });
      expect(res.status).toBe(200);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-target' },
        data: {
          status: 'VIP',
          trustScore: 800,
        },
      });
    });
  });

  describe('Issue #9: Phone-Only Registration emailVerified is Null', () => {
    it('sets emailVerified to null for phone-only registered accounts lacking email', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 'new-user-1',
        name: 'Ahmed',
        phone: '0555998877',
        role: 'user',
        emailVerified: null,
      } as any);

      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Ahmed',
          phone: '0555998877',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        }),
      });

      const res = await registerUser(req);
      expect(res.status).toBe(201);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            emailVerified: null,
          }),
        })
      );
    });
  });
});
