import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST as createOrder, GET as getOrders } from '@/app/api/orders/route';
import { PUT as updateOrder, GET as getOrderDetail } from '@/app/api/orders/[id]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Mock next-auth session
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
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
    order: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    pointsTransaction: {
      create: vi.fn(),
    },
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

    it('should place an order successfully, calculate correct price/points, and create PointsTransaction', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockDbProducts as any);

      // We expect:
      // prod-1: $2.50 * 2 = $5.00
      // prod-2: $15.00 * 1 = $15.00
      // Total amount = $20.00
      // Total price = '$20.00'
      // Points earned = 20

      const expectedOrder = {
        id: 'order-uuid-123',
        sessionId: validPayload.sessionId,
        status: 'PENDING',
        totalPrice: '$20.00',
        totalAmount: 20.00,
        customerName: validPayload.customerName,
        customerPhone: validPayload.customerPhone,
        customerEmail: validPayload.customerEmail,
        shippingAddress: validPayload.shippingAddress,
        pointsEarned: 20,
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
      vi.mocked(prisma.pointsTransaction.create).mockResolvedValueOnce({} as any);

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
          sessionId: validPayload.sessionId,
          status: 'PENDING',
          totalPrice: '$20.00',
          totalAmount: 20.00,
          customerName: validPayload.customerName,
          customerPhone: validPayload.customerPhone,
          customerEmail: validPayload.customerEmail,
          shippingAddress: validPayload.shippingAddress,
          pointsEarned: 20,
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

      expect(prisma.pointsTransaction.create).toHaveBeenCalledWith({
        data: {
          customerId: validPayload.customerPhone,
          orderId: 'order-uuid-123',
          type: 'earn',
          points: 20,
          description: 'Earned 20 loyalty points from order #ORDER-UU',
        },
      });
    });

    it('should place an order successfully with NO email (optional)', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockDbProducts as any);

      const payloadWithoutEmail = {
        ...validPayload,
        customerEmail: undefined,
      };

      const expectedOrder = {
        id: 'order-uuid-123',
        sessionId: payloadWithoutEmail.sessionId,
        status: 'PENDING',
        totalPrice: '$20.00',
        totalAmount: 20.00,
        customerName: payloadWithoutEmail.customerName,
        customerPhone: payloadWithoutEmail.customerPhone,
        customerEmail: null,
        shippingAddress: payloadWithoutEmail.shippingAddress,
        pointsEarned: 20,
      };

      vi.mocked(prisma.order.create).mockResolvedValueOnce(expectedOrder as any);
      vi.mocked(prisma.pointsTransaction.create).mockResolvedValueOnce({} as any);

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadWithoutEmail),
      });

      const response = await createOrder(req);
      expect(response.status).toBe(201);
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
  });

  describe('GET /api/orders', () => {
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
        status: 'SHIPPED',
        totalPrice: '$25.00',
        totalAmount: 25.0,
        createdAt: new Date('2026-06-04T13:00:00Z'),
      },
    ];

    const mockOrdersJson = JSON.parse(JSON.stringify(mockOrders)).map((o: any) => ({
      ...o,
      customerTrustScore: 0,
    }));

    it('should support pagination metadata and return paginated orders list', async () => {
      vi.mocked(prisma.order.count).mockResolvedValueOnce(12);
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

      expect(prisma.order.count).toHaveBeenCalledWith({ where: {} });
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } },
      });
    });

    it('should correctly apply query and status filters to count and findMany', async () => {
      vi.mocked(prisma.order.count).mockResolvedValueOnce(1);
      vi.mocked(prisma.order.findMany).mockResolvedValueOnce([mockOrders[1]] as any);

      // Filter by status=SHIPPED and query=Bob
      const req = new NextRequest('http://localhost/api/orders?status=SHIPPED&query=Bob');
      const response = await getOrders(req);

      expect(response.status).toBe(200);

      const expectedWhere = {
        status: 'SHIPPED',
        OR: [
          { customerName: { contains: 'Bob', mode: 'insensitive' } },
          { customerPhone: { contains: 'Bob', mode: 'insensitive' } },
          { customerEmail: { contains: 'Bob', mode: 'insensitive' } },
          { shippingAddress: { contains: 'Bob', mode: 'insensitive' } },
          { id: { contains: 'Bob', mode: 'insensitive' } },
        ],
      };

      expect(prisma.order.count).toHaveBeenCalledWith({ where: expectedWhere });
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere })
      );
    });

    it('should return 500 when database count or query fails', async () => {
      vi.mocked(prisma.order.count).mockRejectedValueOnce(new Error('Connection timed out'));

      const req = new NextRequest('http://localhost/api/orders');
      const response = await getOrders(req);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Connection timed out' });
    });
  });

  describe('PUT /api/orders/[id]', () => {
    const mockOrder = {
      id: 'order-1',
      customerName: 'John',
      status: 'PENDING',
    };

    it('should update the order status and convert status parameter to uppercase', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValueOnce({
        ...mockOrder,
        status: 'SHIPPED',
      } as any);

      const req = new NextRequest(`http://localhost/api/orders/${mockOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }), // Lowercase status passed
      });

      const response = await updateOrder(req, { params: Promise.resolve({ id: mockOrder.id }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe('SHIPPED');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrder.id },
        data: { status: 'SHIPPED' }, // Converted to uppercase
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
      vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(mockOrder as any);
      vi.mocked(prisma.order.update).mockRejectedValueOnce(new Error('Update failed'));

      const req = new NextRequest(`http://localhost/api/orders/${mockOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      });

      const response = await updateOrder(req, { params: Promise.resolve({ id: mockOrder.id }) });
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({ error: 'Update failed' });
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
});
