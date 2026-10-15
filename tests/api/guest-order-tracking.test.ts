import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST as createOrder } from '@/app/api/orders/route';
import { GET as getOrderDetail, PUT as updateOrder } from '@/app/api/orders/[id]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { resetRateLimiter } from '@/lib/rate-limiter';
import { resetIdempotencyStore } from '@/lib/idempotency';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/config', () => ({
  getSiteConfig: vi.fn().mockImplementation((key) => {
    if (key === 'store_enabled') return Promise.resolve(true);
    return Promise.resolve(null);
  }),
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    product: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    deliveryMethod: {
      findFirst: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    orderNotification: {
      create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ seq: 1 }]),
    $executeRawUnsafe: vi.fn().mockResolvedValue(1),
    $transaction: vi.fn((cb) => (typeof cb === 'function' ? cb(mockPrisma) : Promise.resolve(cb))),
  };
  return { prisma: mockPrisma };
});

describe('Issue #23: Guest Order Tracking without Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimiter();
    resetIdempotencyStore();
    vi.mocked(getServerSession).mockResolvedValue(null);
  });

  const guestPayload = {
    customerName: 'Amina Mansouri',
    customerPhone: '+213555123456',
    customerEmail: 'amina@example.com',
    shippingAddress: '42 Rue Didouche Mourad, Alger',
    items: [{ productId: 'cookie-1', quantity: 2 }],
  };

  const mockDbProduct = {
    id: 'cookie-1',
    title: 'Cookies Chocolat',
    price: '$3.50',
    state: 'exist',
  };

  it('generates secure guestClaimToken, returns trackingUrl and sets HttpOnly cookie on guest order creation', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValueOnce([mockDbProduct as any]);
    vi.mocked(prisma.order.create).mockImplementationOnce((args: any) =>
      Promise.resolve({
        id: 'ord-guest-101',
        reference: args.data.reference,
        sessionId: args.data.sessionId,
        status: 'PENDING',
        totalPrice: '$7.00',
        totalAmount: 7.0,
        customerName: args.data.customerName,
        customerPhone: args.data.customerPhone,
        customerEmail: args.data.customerEmail,
        shippingAddress: args.data.shippingAddress,
        userId: null,
        items: [],
      }) as any
    );

    const req = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestPayload),
    });

    const res = await createOrder(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.guestClaimToken).toBeDefined();
    expect(typeof body.guestClaimToken).toBe('string');
    expect(body.guestClaimToken.length).toBeGreaterThan(16);
    expect(body.trackingUrl).toBe(`/orders/ord-guest-101?token=${body.guestClaimToken}`);

    // Verify HttpOnly cookie was set
    const cookie = res.cookies.get('guest_order_ord-guest-101');
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe(body.guestClaimToken);
  });

  describe('GET /api/orders/[id] (Guest Access)', () => {
    const mockGuestOrder = {
      id: 'ord-guest-101',
      reference: 'ORD-20261015-001',
      sessionId: 'claim-token-secret-999',
      status: 'PENDING',
      totalPrice: '$7.00',
      totalAmount: 7.0,
      customerName: 'Amina Mansouri',
      customerPhone: '+213555123456',
      customerEmail: 'amina@example.com',
      shippingAddress: '42 Rue Didouche Mourad, Alger',
      userId: null,
      items: [],
    };

    it('returns 401 when unauthenticated and no claim token is provided', async () => {
      const req = new NextRequest('http://localhost/api/orders/ord-guest-101');
      const res = await getOrderDetail(req, { params: Promise.resolve({ id: 'ord-guest-101' }) });
      expect(res.status).toBe(401);
      expect(prisma.order.findUnique).not.toHaveBeenCalled();
    });

    it('allows guest access via URL search parameter ?token=', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockGuestOrder as any);

      const req = new NextRequest('http://localhost/api/orders/ord-guest-101?token=claim-token-secret-999');
      const res = await getOrderDetail(req, { params: Promise.resolve({ id: 'ord-guest-101' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe('ord-guest-101');
    });

    it('allows guest access via x-guest-token header', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockGuestOrder as any);

      const req = new NextRequest('http://localhost/api/orders/ord-guest-101', {
        headers: { 'x-guest-token': 'claim-token-secret-999' },
      });
      const res = await getOrderDetail(req, { params: Promise.resolve({ id: 'ord-guest-101' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe('ord-guest-101');
    });

    it('allows guest access via HttpOnly cookie', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockGuestOrder as any);

      const req = new NextRequest('http://localhost/api/orders/ord-guest-101', {
        headers: {
          cookie: 'guest_order_ord-guest-101=claim-token-secret-999',
        },
      });
      const res = await getOrderDetail(req, { params: Promise.resolve({ id: 'ord-guest-101' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe('ord-guest-101');
    });

    it('returns 403 when wrong claim token is provided', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockGuestOrder as any);

      const req = new NextRequest('http://localhost/api/orders/ord-guest-101?token=wrong-token');
      const res = await getOrderDetail(req, { params: Promise.resolve({ id: 'ord-guest-101' }) });
      expect(res.status).toBe(403);
    });

    it('returns 403 when claim token is used against a registered user order', async () => {
      const mockRegisteredOrder = {
        ...mockGuestOrder,
        id: 'ord-user-202',
        userId: 'registered-user-123',
      };
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockRegisteredOrder as any);

      const req = new NextRequest('http://localhost/api/orders/ord-user-202?token=claim-token-secret-999');
      const res = await getOrderDetail(req, { params: Promise.resolve({ id: 'ord-user-202' }) });
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/orders/[id] (Guest Cancellation)', () => {
    const mockGuestOrder = {
      id: 'ord-guest-101',
      reference: 'ORD-20261015-001',
      sessionId: 'claim-token-secret-999',
      status: 'PENDING',
      totalPrice: '$7.00',
      totalAmount: 7.0,
      customerName: 'Amina Mansouri',
      customerPhone: '+213555123456',
      customerEmail: 'amina@example.com',
      shippingAddress: '42 Rue Didouche Mourad, Alger',
      userId: null,
      items: [],
    };

    it('allows guest with valid claim token to cancel PENDING order', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockGuestOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValueOnce({
        ...mockGuestOrder,
        status: 'CANCELLED',
      } as any);

      const req = new NextRequest('http://localhost/api/orders/ord-guest-101?token=claim-token-secret-999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      const res = await updateOrder(req, { params: Promise.resolve({ id: 'ord-guest-101' }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('CANCELLED');
    });

    it('forbids guest from modifying status to anything other than CANCELLED', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockGuestOrder as any);

      const req = new NextRequest('http://localhost/api/orders/ord-guest-101?token=claim-token-secret-999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      });

      const res = await updateOrder(req, { params: Promise.resolve({ id: 'ord-guest-101' }) });
      expect(res.status).toBe(403);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('forbids guest from cancelling order when status is already ACCEPTED', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
        ...mockGuestOrder,
        status: 'ACCEPTED',
      } as any);

      const req = new NextRequest('http://localhost/api/orders/ord-guest-101?token=claim-token-secret-999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      const res = await updateOrder(req, { params: Promise.resolve({ id: 'ord-guest-101' }) });
      expect(res.status).toBe(400);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });
});
