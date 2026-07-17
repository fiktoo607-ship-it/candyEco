import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST as createOrder, GET as getOrders } from '@/app/api/orders/route';
import { PUT as updateOrder, GET as getOrderDetail } from '@/app/api/orders/[id]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getSiteConfig } from '@/lib/config';

// Mock next-auth session
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

// Mock config
vi.mock('@/lib/config', () => ({
  getSiteConfig: vi.fn().mockImplementation((key) => {
    if (key === 'store_enabled') return Promise.resolve(true);
    if (key === 'store_message') return Promise.resolve('Le magasin est temporairement fermé.');
    return Promise.resolve(null);
  }),
}));


// Mock Prisma client
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    product: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    order: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    orderNotification: {
      create: vi.fn().mockImplementation((args) => Promise.resolve({
        id: 'notif-uuid-123',
        orderId: args.data.orderId,
        read: false,
        createdAt: new Date(),
      })),
    },
    $queryRaw: vi.fn().mockImplementation((queryParts, ...values) => {
      const queryStr = Array.isArray(queryParts) ? queryParts.join('') : '';
      if (queryStr.includes('COUNT(*)')) {
        return Promise.resolve([{ count: 0 }]);
      }
      return Promise.resolve([]);
    }),
    $transaction: vi.fn((arg) => {
      if (typeof arg === 'function') {
        return arg(mockPrisma);
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return Promise.resolve(arg);
    }),
  };
  return {
    prisma: mockPrisma,
  };
});

describe('Orders API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/orders (Guest Checkout)', () => {
    const mockDbProducts = [
      {
        id: 'prod-1',
        title: 'Delicious Cookie',
        price: '$2.50',
        state: 'exist',
      },
      {
        id: 'prod-2',
        title: 'Fancy Cake',
        price: '15.00', // price can be with or without currency symbol
        state: 'exist',
      },
    ];

    const validPayload = {
      customerName: 'John Doe',
      customerPhone: '1234567890',
      customerEmail: 'john@example.com',
      shippingAddress: '123 Main St, Candy Land',
      sessionId: 'sess-abc-123',
      items: [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 },
      ],
    };

    it('should return 400 when store is closed', async () => {
      vi.mocked(getSiteConfig).mockImplementation((key) => {
        if (key === 'store_enabled') return Promise.resolve(false);
        if (key === 'store_message') return Promise.resolve('Boutique fermée pour maintenance.');
        return Promise.resolve(null);
      });

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      });

      const response = await createOrder(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Boutique fermée pour maintenance.');

      // Restore default mock
      vi.mocked(getSiteConfig).mockImplementation((key) => {
        if (key === 'store_enabled') return Promise.resolve(true);
        if (key === 'store_message') return Promise.resolve('Le magasin est temporairement fermé.');
        return Promise.resolve(null);
      });
    });

    it('should place an order successfully, calculate correct price', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockDbProducts as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(null);

      // We expect:
      // prod-1: $2.50 * 2 = $5.00
      // prod-2: $15.00 * 1 = $15.00
      // Total amount = $20.00
      // Total price = '$20.00'

      const now = new Date();
      const yyyy = now.getUTCFullYear();
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(now.getUTCDate()).padStart(2, '0');
      const expectedRef = `ORD-${yyyy}${mm}${dd}-001`;

      const expectedOrder = {
        id: 'order-uuid-123',
        reference: expectedRef,
        sessionId: validPayload.sessionId,
        status: 'PENDING',
        totalPrice: '$20.00',
        totalAmount: 20.00,
        customerName: validPayload.customerName,
        customerPhone: validPayload.customerPhone,
        customerEmail: validPayload.customerEmail,
        shippingAddress: validPayload.shippingAddress,
        items: [
          {
            id: 'item-1',
            orderId: 'order-uuid-123',
            productId: 'prod-1',
            quantity: 2,
            priceAtPurchase: '$2.50',
            amountAtPurchase: 2.5,
          },
          {
            id: 'item-2',
            orderId: 'order-uuid-123',
            productId: 'prod-2',
            quantity: 1,
            priceAtPurchase: '15.00',
            amountAtPurchase: 15,
          },
        ],
      };

      vi.mocked(prisma.order.create).mockResolvedValueOnce(expectedOrder as any);

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });

      const response = await createOrder(req);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toEqual(expectedOrder);

      // Verify DB queries
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['prod-1', 'prod-2'] } },
      });

      expect(prisma.order.create).toHaveBeenCalledWith({
        data: {
          reference: expectedRef,
          sessionId: validPayload.sessionId,
          status: 'PENDING',
          totalPrice: '$20.00',
          totalAmount: 20.00,
          customerName: validPayload.customerName,
          customerPhone: validPayload.customerPhone,
          customerEmail: validPayload.customerEmail,
          shippingAddress: validPayload.shippingAddress,
          userId: null,
          items: {
            create: [
              {
                productId: 'prod-1',
                quantity: 2,
                priceAtPurchase: '$2.50',
                amountAtPurchase: 2.5,
              },
              {
                productId: 'prod-2',
                quantity: 1,
                priceAtPurchase: '15.00',
                amountAtPurchase: 15,
              },
            ],
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should place an order successfully with NO email (optional)', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockDbProducts as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(null);

      const payloadWithoutEmail = {
        ...validPayload,
        customerEmail: undefined,
      };

      const now = new Date();
      const yyyy = now.getUTCFullYear();
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(now.getUTCDate()).padStart(2, '0');
      const expectedRef = `ORD-${yyyy}${mm}${dd}-001`;

      const expectedOrder = {
        id: 'order-uuid-123',
        reference: expectedRef,
        sessionId: payloadWithoutEmail.sessionId,
        status: 'PENDING',
        totalPrice: '$20.00',
        totalAmount: 20.00,
        customerName: payloadWithoutEmail.customerName,
        customerPhone: payloadWithoutEmail.customerPhone,
        customerEmail: null,
        shippingAddress: payloadWithoutEmail.shippingAddress,
      };

      vi.mocked(prisma.order.create).mockResolvedValueOnce(expectedOrder as any);

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadWithoutEmail),
      });

      const response = await createOrder(req);
      expect(response.status).toBe(201);
    });

    it('should automatically increment sequence number for reference code on the same day', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockDbProducts as any);
      
      const now = new Date();
      const yyyy = now.getUTCFullYear();
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(now.getUTCDate()).padStart(2, '0');
      const todayStr = `${yyyy}${mm}${dd}`;

      // Mock that there's already an order with sequence 002
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce({
        reference: `ORD-${todayStr}-002`,
      } as any);

      const expectedOrder = {
        id: 'order-uuid-123',
        reference: `ORD-${todayStr}-003`,
        sessionId: validPayload.sessionId,
        status: 'PENDING',
        totalPrice: '$20.00',
        totalAmount: 20.00,
        customerName: validPayload.customerName,
        customerPhone: validPayload.customerPhone,
        customerEmail: validPayload.customerEmail,
        shippingAddress: validPayload.shippingAddress,
        items: [],
      };

      vi.mocked(prisma.order.create).mockResolvedValueOnce(expectedOrder as any);

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });

      const response = await createOrder(req);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.reference).toBe(`ORD-${todayStr}-003`);
    });

    it('should return 400 when phone number format is invalid', async () => {
      const invalidPhonePayload = {
        ...validPayload,
        customerPhone: 'invalid-phone-number-123', // contains letters
      };

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPhonePayload),
      });

      const response = await createOrder(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Invalid phone number format' });
    });

    it('should return 400 when email format is invalid', async () => {
      const invalidEmailPayload = {
        ...validPayload,
        customerEmail: 'notanemail',
      };

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidEmailPayload),
      });

      const response = await createOrder(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Invalid email format' });
    });

    it('should return 400 when customer data or cart items are missing/invalid', async () => {
      const invalidPayloads = [
        { customerPhone: '1234567', shippingAddress: 'Addr', items: [{ productId: 'p1', quantity: 1 }] }, // Missing name
        { customerName: 'Name', shippingAddress: 'Addr', items: [] }, // Empty items
        { customerName: 'Name', customerPhone: '1234567', shippingAddress: 'Addr' }, // Missing items field
      ];

      for (const payload of invalidPayloads) {
        const req = new NextRequest('http://localhost/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const response = await createOrder(req);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ error: 'Missing required guest customer or cart information' });
      }

      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('should return 400 if one or more products in the cart are not found in the database', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValueOnce([mockDbProducts[0]] as any); // Only returns prod-1

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });

      const response = await createOrder(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toEqual({ error: 'One or more products in your cart could not be found' });
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('should return 400 when trying to purchase an outOfStock product', async () => {
      const outOfStockProducts = [
        {
          id: 'prod-1',
          title: 'Delicious Cookie',
          price: '$2.50',
          state: 'outofStock',
        },
      ];

      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(outOfStockProducts as any);

      const singleItemPayload = {
        customerName: 'John Doe',
        customerPhone: '1234567890',
        shippingAddress: '123 Main St',
        items: [{ productId: 'prod-1', quantity: 2 }],
      };

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(singleItemPayload),
      });

      const response = await createOrder(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toEqual({ error: 'Product "Delicious Cookie" is out of stock' });
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('should return 500 when transaction writing fails', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockDbProducts as any);
      vi.mocked(prisma.order.create).mockRejectedValueOnce(new Error('Transaction lock timeout'));

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });

      const response = await createOrder(req);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({ error: 'Transaction lock timeout' });
    });

    it('should fall back to guest checkout (userId = null) when user session has a stale user ID that does not exist in the database', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'stale-user-id', name: 'John Doe' }
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockDbProducts as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(null);

      const expectedOrder = {
        id: 'order-uuid-123',
        reference: 'ORD-20260709-001',
        sessionId: validPayload.sessionId,
        status: 'PENDING',
        totalPrice: '$20.00',
        totalAmount: 20.00,
        customerName: validPayload.customerName,
        customerPhone: validPayload.customerPhone,
        customerEmail: validPayload.customerEmail,
        shippingAddress: validPayload.shippingAddress,
      };

      vi.mocked(prisma.order.create).mockResolvedValueOnce(expectedOrder as any);

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });

      const response = await createOrder(req);
      expect(response.status).toBe(201);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: null
          })
        })
      );
    });
  });

  describe('GET /api/orders', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);
    });

    const mockOrders = [
      {
        id: 'order-1',
        customerName: 'Alice',
        customerPhone: '111222',
        shippingAddress: 'Address 1',
        status: 'PENDING',
        totalPrice: '$10.00',
        totalAmount: 10.0,
        createdAt: new Date('2026-06-04T12:00:00Z'),
      },
      {
        id: 'order-2',
        customerName: 'Bob',
        customerPhone: '333444',
        shippingAddress: 'Address 2',
        status: 'ACCEPTED',
        totalPrice: '$25.00',
        totalAmount: 25.0,
        createdAt: new Date('2026-06-04T13:00:00Z'),
      },
    ];

    const mockOrdersJson = JSON.parse(JSON.stringify(mockOrders)).map((o: any) => ({
      ...o,
      customerTrustScore: 0,
      customerOrderCount: 0,
    }));

    it('should support pagination metadata and return paginated orders list', async () => {
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ count: 12 }])
        .mockResolvedValueOnce(mockOrders.map(o => ({ id: o.id, customerTrustScore: 0, customerOrderCount: 0 })));
      vi.mocked(prisma.order.findMany).mockResolvedValueOnce(mockOrders as any);

      // Fetch page 2, limit 5
      const req = new NextRequest('http://localhost/api/orders?page=2&limit=5');
      const response = await getOrders(req);

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body).toEqual({
        data: mockOrdersJson,
        meta: {
          total: 12,
          page: 2,
          limit: 5,
          totalPages: 3,
        },
      });

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { id: { in: mockOrders.map(o => o.id) } },
        include: { items: { include: { product: true } } },
      });
    });

    it('should correctly apply query and status filters to count and findMany', async () => {
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ id: mockOrders[1].id, customerTrustScore: 0, customerOrderCount: 0 }]);
      vi.mocked(prisma.order.findMany).mockResolvedValueOnce([mockOrders[1]] as any);

      // Filter by status=ACCEPTED and query=Bob
      const req = new NextRequest('http://localhost/api/orders?status=ACCEPTED&query=Bob');
      const response = await getOrders(req);

      expect(response.status).toBe(200);

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: { id: { in: [mockOrders[1].id] } },
        include: { items: { include: { product: true } } },
      });
    });

    it('should support sorting by status, customer trust score, and order count', async () => {
      // 1. Test sorting by status
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ count: 12 }])
        .mockResolvedValueOnce(mockOrders.map(o => ({ id: o.id, customerTrustScore: 0, customerOrderCount: 0 })));
      vi.mocked(prisma.order.findMany).mockResolvedValueOnce(mockOrders as any);

      const reqStatus = new NextRequest('http://localhost/api/orders?sortBy=status&sortOrder=asc');
      const resStatus = await getOrders(reqStatus);
      expect(resStatus.status).toBe(200);
      expect(prisma.$queryRaw).toHaveBeenCalled();

      // 2. Test sorting by orderCount
      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce(mockOrders.map(o => ({ id: o.id, customerTrustScore: 10, customerOrderCount: 5 })));
      vi.mocked(prisma.order.findMany).mockResolvedValueOnce(mockOrders as any);

      const reqOrderCount = new NextRequest('http://localhost/api/orders?sortBy=orderCount&sortOrder=desc');
      const resOrderCount = await getOrders(reqOrderCount);
      expect(resOrderCount.status).toBe(200);
      const dataOrderCount = await resOrderCount.json();
      expect(dataOrderCount.data[0].customerOrderCount).toBe(5);
    });

    it('should return 500 when database count or query fails', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection timed out'));

      const req = new NextRequest('http://localhost/api/orders');
      const response = await getOrders(req);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Connection timed out' });
    });

    it('should filter orders by userId when logged-in user is not an admin', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'user-123', role: 'user' },
      } as any);

      vi.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce(mockOrders.map(o => ({ id: o.id, customerTrustScore: 0, customerOrderCount: 0 })));
      vi.mocked(prisma.order.findMany).mockResolvedValueOnce(mockOrders as any);

      const req = new NextRequest('http://localhost/api/orders');
      const response = await getOrders(req);

      expect(response.status).toBe(200);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return 401 when no session is active', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost/api/orders');
      const response = await getOrders(req);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('PUT /api/orders/[id]', () => {
    const mockOrder = {
      id: 'order-1',
      customerName: 'John',
      status: 'PENDING',
    };
    it('should update the order status and convert status parameter to uppercase', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { role: 'admin' } } as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValueOnce({
        ...mockOrder,
        status: 'ACCEPTED',
      } as any);

      const req = new NextRequest(`http://localhost/api/orders/${mockOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }), // Lowercase status passed
      });

      const response = await updateOrder(req, { params: Promise.resolve({ id: mockOrder.id }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('ACCEPTED');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrder.id },
        data: { status: 'ACCEPTED' }, // Converted to uppercase
        include: { items: { include: { product: true } } },
      });
    });

    it('should return 400 if status parameter is missing', async () => {
      const req = new NextRequest(`http://localhost/api/orders/${mockOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await updateOrder(req, { params: Promise.resolve({ id: mockOrder.id }) });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toEqual({ error: 'Status is required' });
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should return 404 if the order to update is not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(null);

      const req = new NextRequest(`http://localhost/api/orders/unknown-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      const response = await updateOrder(req, { params: Promise.resolve({ id: 'unknown-id' }) });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toEqual({ error: 'Order not found' });
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should return 500 when order update fails in database', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { role: 'admin' } } as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockOrder as any);
      vi.mocked(prisma.order.update).mockRejectedValueOnce(new Error('Update failed'));

      const req = new NextRequest(`http://localhost/api/orders/${mockOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });

      const response = await updateOrder(req, { params: Promise.resolve({ id: mockOrder.id }) });
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({ error: 'Update failed' });
    });

    it('should allow customer to cancel order while status is PENDING', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null); // Guest/Customer
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
        id: 'order-1',
        status: 'PENDING',
      } as any);
      vi.mocked(prisma.order.update).mockResolvedValueOnce({
        id: 'order-1',
        status: 'CANCELLED',
      } as any);

      const req = new NextRequest('http://localhost/api/orders/order-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      const response = await updateOrder(req, { params: Promise.resolve({ id: 'order-1' }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('CANCELLED');
    });

    it('should NOT allow customer to update status to anything other than CANCELLED', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null); // Guest/Customer
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
        id: 'order-1',
        status: 'PENDING',
      } as any);

      const req = new NextRequest('http://localhost/api/orders/order-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });

      const response = await updateOrder(req, { params: Promise.resolve({ id: 'order-1' }) });
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized to update order status');
    });

    it('should NOT allow customer to cancel order if current status is not PENDING', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null); // Guest/Customer
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
        id: 'order-1',
        status: 'ACCEPTED',
      } as any);

      const req = new NextRequest('http://localhost/api/orders/order-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      const response = await updateOrder(req, { params: Promise.resolve({ id: 'order-1' }) });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Only pending orders can be cancelled');
    });

    it('should NOT allow admin to cancel order if current status is ACCEPTED', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { role: 'admin' } } as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
        id: 'order-1',
        status: 'ACCEPTED',
      } as any);

      const req = new NextRequest('http://localhost/api/orders/order-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      const response = await updateOrder(req, { params: Promise.resolve({ id: 'order-1' }) });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Cannot cancel an accepted or delivered order');
    });

    it('should allow admin to update order status to ACCEPTED from PENDING', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({ user: { role: 'admin' } } as any);
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
        id: 'order-1',
        status: 'PENDING',
      } as any);
      vi.mocked(prisma.order.update).mockResolvedValueOnce({
        id: 'order-1',
        status: 'ACCEPTED',
      } as any);

      const req = new NextRequest('http://localhost/api/orders/order-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });

      const response = await updateOrder(req, { params: Promise.resolve({ id: 'order-1' }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('ACCEPTED');
    });
  });

  describe('GET /api/orders/[id]', () => {
    const mockOrder = {
      id: 'order-1',
      customerName: 'John',
      status: 'PENDING',
      items: [],
    };

    it('should retrieve a single order by ID successfully', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockOrder as any);

      const req = new NextRequest(`http://localhost/api/orders/${mockOrder.id}`, {
        method: 'GET',
      });

      const response = await getOrderDetail(req, { params: Promise.resolve({ id: mockOrder.id }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual(mockOrder);

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: mockOrder.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should return 404 if the order is not found', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(null);

      const req = new NextRequest(`http://localhost/api/orders/unknown-id`, {
        method: 'GET',
      });

      const response = await getOrderDetail(req, { params: Promise.resolve({ id: 'unknown-id' }) });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toEqual({ error: 'Order not found' });
    });

    it('should return 500 when fetching order fails in database', async () => {
      vi.mocked(prisma.order.findUnique).mockRejectedValueOnce(new Error('Fetch failed'));

      const req = new NextRequest(`http://localhost/api/orders/${mockOrder.id}`, {
        method: 'GET',
      });

      const response = await getOrderDetail(req, { params: Promise.resolve({ id: mockOrder.id }) });
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({ error: 'Fetch failed' });
    });
  });

  describe('Address Linked To Order Requirements', () => {
    const mockDbProducts = [
      {
        id: 'prod-1',
        title: 'Delicious Cookie',
        price: '$2.50',
        state: 'exist',
      },
    ];

    it('should save shipping address on the order itself and not alter user profile', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockDbProducts as any);
      vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(null);

      const payload = {
        customerName: 'Alice Address',
        customerPhone: '1234567890',
        shippingAddress: '456 Order Street',
        items: [{ productId: 'prod-1', quantity: 1 }],
      };

      const now = new Date();
      const yyyy = now.getUTCFullYear();
      const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(now.getUTCDate()).padStart(2, '0');
      const expectedRef = `ORD-${yyyy}${mm}${dd}-001`;

      const expectedOrder = {
        id: 'order-12345',
        reference: expectedRef,
        status: 'PENDING',
        totalPrice: '$2.50',
        totalAmount: 2.50,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        shippingAddress: payload.shippingAddress,
      };

      vi.mocked(prisma.order.create).mockResolvedValueOnce(expectedOrder as any);

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await createOrder(req);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.shippingAddress).toBe('456 Order Street');
      
      // Verify that prisma.order.create was called with the shippingAddress directly
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            shippingAddress: '456 Order Street',
          }),
        })
      );
    });
  });
});
