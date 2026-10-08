import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as trackOrderPost, GET as trackOrderGet } from '@/app/api/orders/track/route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limiter', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  createRateLimitResponse: vi.fn(),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

describe('Guest Order Tracking API (Issue #22)', () => {
  const mockOrder = {
    id: 'ord-123456',
    reference: 'ORD-20261008-1002',
    status: 'ACCEPTED',
    totalPrice: '35.00 €',
    totalAmount: 35.0,
    customerName: 'Karim Hadj',
    customerPhone: '0555123456',
    customerEmail: 'karim@example.com',
    shippingAddress: '15 Rue Didouche Mourad, Alger',
    deliveryMethod: 'Livraison Express',
    createdAt: new Date('2026-10-08T10:00:00Z'),
    updatedAt: new Date('2026-10-08T10:30:00Z'),
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        quantity: 2,
        priceAtPurchase: '$10.00',
        amountAtPurchase: 10.0,
        product: {
          id: 'prod-1',
          title: 'Caramel Beurre Salé',
          slug: 'caramel-beurre-sale',
          price: '10.00',
          imageUrl: '/caramel.jpg',
        },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/orders/track', () => {
    it('returns 400 when reference is missing', async () => {
      const req = new NextRequest('http://localhost/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: '0555123456' }),
      });

      const res = await trackOrderPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/référence/i);
    });

    it('returns 400 when verification token/phone/email is missing', async () => {
      const req = new NextRequest('http://localhost/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: 'ORD-20261008-1002' }),
      });

      const res = await trackOrderPost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/téléphone|email/i);
    });

    it('returns 404 when order reference is not found', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: 'ORD-NON-EXISTENT',
          phone: '0555123456',
        }),
      });

      const res = await trackOrderPost(req);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toMatch(/introuvable/i);
    });

    it('returns 403 when phone verification token does not match', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(mockOrder as any);

      const req = new NextRequest('http://localhost/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: 'ORD-20261008-1002',
          phone: '0699999999', // Wrong phone
        }),
      });

      const res = await trackOrderPost(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toMatch(/incorrectes/i);
    });

    it('successfully allows guest tracking with valid reference and phone without login', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(mockOrder as any);

      const req = new NextRequest('http://localhost/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: 'ORD-20261008-1002',
          phone: '0555123456',
        }),
      });

      const res = await trackOrderPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.reference).toBe('ORD-20261008-1002');
      expect(data.status).toBe('ACCEPTED');
      expect(data.customerName).toBe('Karim Hadj');
      expect(data.items).toHaveLength(1);
    });

    it('successfully allows guest tracking with valid reference and email', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(mockOrder as any);

      const req = new NextRequest('http://localhost/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: 'ORD-20261008-1002',
          email: 'karim@example.com',
        }),
      });

      const res = await trackOrderPost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.reference).toBe('ORD-20261008-1002');
      expect(data.customerEmail).toBe('karim@example.com');
    });
  });

  describe('GET /api/orders/track', () => {
    it('successfully tracks order via query parameters', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(mockOrder as any);

      const req = new NextRequest(
        'http://localhost/api/orders/track?reference=ORD-20261008-1002&phone=0555123456'
      );

      const res = await trackOrderGet(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.reference).toBe('ORD-20261008-1002');
      expect(data.status).toBe('ACCEPTED');
    });
  });
});
