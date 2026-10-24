import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  let productStock = 1;
  const mockPrisma = {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
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
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === 'function') {
        return await cb(mockPrisma);
      }
      return Promise.resolve(cb);
    }),
  };
  return { prisma: mockPrisma };
});

describe('Issues #60, #120, #121: Order Creation Transactions, Stock Concurrency, and Guest Token Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimiter();
    resetIdempotencyStore();
    vi.mocked(getServerSession).mockResolvedValue(null);
  });

  describe('Issue #60: Concurrent Orders for Product with Stock = 1', () => {
    it('should reject one of two concurrent orders when product stock is 1 to protect inventory', async () => {
      let currentStock = 1;

      const mockProduct = {
        id: 'prod-stock-1',
        title: 'Limited Edition Cake',
        price: '$15.00',
        state: 'exist',
        stock: 1,
      };

      (prisma.product.findMany as any).mockImplementation(async () => [
        { ...mockProduct, stock: currentStock },
      ]);

      (prisma.product.update as any).mockImplementation(async (args: any) => {
        if (args.data.stock !== undefined) {
          currentStock = args.data.stock;
        }
        return { ...mockProduct, ...args.data };
      });

      (prisma.order.create as any).mockImplementation(async (args: any) => ({
        id: `ord-${Date.now()}-${Math.random()}`,
        reference: args.data.reference,
        sessionId: args.data.sessionId,
        status: 'PENDING',
        totalPrice: '$15.00',
        totalAmount: 15.0,
        customerName: args.data.customerName,
        customerPhone: args.data.customerPhone,
        shippingAddress: args.data.shippingAddress,
        items: [],
      }));

      const payload1 = {
        customerName: 'Buyer One',
        customerPhone: '+213555111111',
        shippingAddress: 'Address 1',
        items: [{ productId: 'prod-stock-1', quantity: 1 }],
      };

      const payload2 = {
        customerName: 'Buyer Two',
        customerPhone: '+213555222222',
        shippingAddress: 'Address 2',
        items: [{ productId: 'prod-stock-1', quantity: 1 }],
      };

      const req1 = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload1),
      });

      const req2 = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload2),
      });

      // Send order 1
      const res1 = await createOrder(req1);

      // Send order 2 (should fail because stock was depleted by order 1)
      const res2 = await createOrder(req2);

      const statuses = [res1.status, res2.status];
      expect(statuses).toContain(201);
      expect(statuses).toContain(400);

      // Stock must be decremented and not exceed available inventory
      expect(currentStock).toBe(0);
    });
  });

  describe('Issue #120 & #121: Guest Order Access & Cancellation Authorization', () => {
    const mockGuestOrder = {
      id: 'ord-guest-999',
      reference: 'ORD-20261015-999',
      sessionId: 'super-secret-guest-token-777',
      status: 'PENDING',
      totalPrice: '$20.00',
      totalAmount: 20.0,
      customerName: 'Secret Customer',
      customerPhone: '+213555999888',
      customerEmail: 'target-guest@example.com',
      shippingAddress: '123 Private Street, Algiers',
      userId: null,
      items: [],
    };

    it('should reject viewing guest order using phone number or email instead of secret claim token', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockGuestOrder as any);

      // 1. Attacker tries to access with victim's phone number as token
      const reqPhone = new NextRequest(
        `http://localhost/api/orders/ord-guest-999?token=${encodeURIComponent('+213555999888')}`
      );
      const resPhone = await getOrderDetail(reqPhone, { params: Promise.resolve({ id: 'ord-guest-999' }) });
      expect([401, 403]).toContain(resPhone.status);

      // 2. Attacker tries to access with victim's email as token
      const reqEmail = new NextRequest(
        'http://localhost/api/orders/ord-guest-999?token=target-guest@example.com'
      );
      const resEmail = await getOrderDetail(reqEmail, { params: Promise.resolve({ id: 'ord-guest-999' }) });
      expect([401, 403]).toContain(resEmail.status);

      // 3. Legitimate guest with the actual secret token succeeds
      const reqValid = new NextRequest(
        'http://localhost/api/orders/ord-guest-999?token=super-secret-guest-token-777'
      );
      const resValid = await getOrderDetail(reqValid, { params: Promise.resolve({ id: 'ord-guest-999' }) });
      expect(resValid.status).toBe(200);
      const dataValid = await resValid.json();
      expect(dataValid.id).toBe('ord-guest-999');
    });

    it('should reject cancelling guest order using phone number or email instead of secret claim token', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockGuestOrder as any);

      // 1. Attempt cancellation using phone number
      const reqPhone = new NextRequest(
        `http://localhost/api/orders/ord-guest-999?token=${encodeURIComponent('+213555999888')}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' }),
        }
      );
      const resPhone = await updateOrder(reqPhone, { params: Promise.resolve({ id: 'ord-guest-999' }) });
      expect([401, 403]).toContain(resPhone.status);
      expect(prisma.order.update).not.toHaveBeenCalled();

      // 2. Attempt cancellation using email
      const reqEmail = new NextRequest(
        'http://localhost/api/orders/ord-guest-999?token=target-guest@example.com',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' }),
        }
      );
      const resEmail = await updateOrder(reqEmail, { params: Promise.resolve({ id: 'ord-guest-999' }) });
      expect([401, 403]).toContain(resEmail.status);
      expect(prisma.order.update).not.toHaveBeenCalled();

      // 3. Legitimate cancellation with secret token succeeds
      vi.mocked(prisma.order.update).mockResolvedValueOnce({
        ...mockGuestOrder,
        status: 'CANCELLED',
      } as any);

      const reqValid = new NextRequest(
        'http://localhost/api/orders/ord-guest-999?token=super-secret-guest-token-777',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' }),
        }
      );
      const resValid = await updateOrder(reqValid, { params: Promise.resolve({ id: 'ord-guest-999' }) });
      expect(resValid.status).toBe(200);
    });
  });

  describe('Issue #121: Idempotency Scoping & Token Leak Prevention', () => {
    it('should scope idempotency cache per client and prevent token leakage across sessions', async () => {
      const mockProduct = {
        id: 'cookie-abc',
        title: 'Cookies',
        price: '$5.00',
        state: 'exist',
        stock: 50,
      };
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct as any]);

      let createdCount = 0;
      (prisma.order.create as any).mockImplementation(async (args: any) => {
        createdCount++;
        return {
          id: `ord-${createdCount}`,
          reference: args.data.reference,
          sessionId: args.data.sessionId,
          status: 'PENDING',
          totalPrice: '$5.00',
          totalAmount: 5.0,
          customerName: args.data.customerName,
          customerPhone: args.data.customerPhone,
          shippingAddress: args.data.shippingAddress,
          items: [],
        } as any;
      });

      const payloadA = {
        customerName: 'User A',
        customerPhone: '+213555000001',
        shippingAddress: 'Address A',
        sessionId: 'session-token-aaa',
        items: [{ productId: 'cookie-abc', quantity: 1 }],
      };

      const payloadB = {
        customerName: 'User B',
        customerPhone: '+213555000002',
        shippingAddress: 'Address B',
        sessionId: 'session-token-bbb',
        items: [{ productId: 'cookie-abc', quantity: 1 }],
      };

      // User A from IP A with idempotency key
      const reqA = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'shared-key-123',
        },
        body: JSON.stringify(payloadA),
      });
      (reqA as any).ip = '198.51.100.1';

      // User B from IP B with the SAME idempotency key
      const reqB = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'shared-key-123',
        },
        body: JSON.stringify(payloadB),
      });
      (reqB as any).ip = '198.51.100.2';

      const resA = await createOrder(reqA);
      const resB = await createOrder(reqB);

      expect(resA.status).toBe(201);
      expect(resB.status).toBe(201);

      const dataA = await resA.json();
      const dataB = await resB.json();

      // User B must NOT receive User A's order or User A's token
      expect(dataA.customerName).toBe('User A');
      expect(dataB.customerName).toBe('User B');
      expect(dataA.guestClaimToken).not.toBe(dataB.guestClaimToken);
      expect(createdCount).toBe(2);
    });
  });

  describe('Issue #138: Concurrent Order Status Updates with Optimistic Concurrency', () => {
    it('should eliminate race condition when concurrent status updates target the same order using previousStatus', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);

      let currentDbStatus = 'PENDING';
      const mockOrder = {
        id: 'ord-concurrent-status-1',
        reference: 'ORD-20261015-101',
        sessionId: 'token-101',
        status: 'PENDING',
        totalPrice: '$20.00',
        totalAmount: 20.0,
        customerName: 'Test Customer',
        customerPhone: '+213555111222',
        shippingAddress: '123 Street',
        items: [],
      };

      (vi.mocked(prisma.order.findUnique) as any).mockImplementation(async () => ({
        ...mockOrder,
        status: currentDbStatus,
      }));

      (vi.mocked(prisma.order.updateMany) as any).mockImplementation(async (args: any) => {
        // Atomic conditional check in database: WHERE id = :id AND status = expectedStatus
        if (args.where.status === currentDbStatus) {
          currentDbStatus = args.data.status;
          return { count: 1 };
        }
        return { count: 0 };
      });

      (vi.mocked(prisma.order.update) as any).mockImplementation(async (args: any) => ({
        ...mockOrder,
        status: args.data.status,
      }));

      // Concurrent request 1: Update from PENDING to ACCEPTED
      const req1 = new NextRequest('http://localhost/api/orders/ord-concurrent-status-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED', previousStatus: 'PENDING' }),
      });

      // Concurrent request 2: Update from PENDING to CANCELLED
      const req2 = new NextRequest('http://localhost/api/orders/ord-concurrent-status-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', previousStatus: 'PENDING' }),
      });

      const [res1, res2] = await Promise.all([
        updateOrder(req1, { params: Promise.resolve({ id: 'ord-concurrent-status-1' }) }),
        updateOrder(req2, { params: Promise.resolve({ id: 'ord-concurrent-status-1' }) }),
      ]);

      const statuses = [res1.status, res2.status];
      // One request must succeed (200), and the losing concurrent request must receive 409 Conflict
      expect(statuses).toContain(200);
      expect(statuses).toContain(409);

      // The final status in DB must be the winner's status, not overwritten
      expect(['ACCEPTED', 'CANCELLED']).toContain(currentDbStatus);
    });
  });
});
