import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getMethods, POST as createMethod } from '@/app/api/delivery-methods/route';
import { PUT as updateMethod, DELETE as deleteMethod } from '@/app/api/delivery-methods/[id]/route';
import { POST as createOrder } from '@/app/api/orders/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    deliveryMethod: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    product: {
      findMany: vi.fn(),
    },
    pointsTransaction: {
      create: vi.fn(),
    },
    orderNotification: {
      create: vi.fn().mockImplementation((args) => Promise.resolve({
        id: 'notif-uuid-123',
        orderId: args.data.orderId,
        read: false,
        createdAt: new Date(),
      })),
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

describe('Delivery Method Selection API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/delivery-methods', () => {
    const mockMethods = [
      { id: '1', name: 'Home Delivery', price: 5, active: true },
      { id: '2', name: 'Office Pickup', price: 0, active: false },
    ];

    it('should return only active methods for guest users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      vi.mocked(prisma.deliveryMethod.findMany).mockResolvedValue([mockMethods[0]] as any);

      const response = await getMethods();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('Home Delivery');
      expect(prisma.deliveryMethod.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { name: 'asc' },
      });
    });

    it('should return all methods for admin users', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'admin' },
      } as any);
      vi.mocked(prisma.deliveryMethod.findMany).mockResolvedValue(mockMethods as any);

      const response = await getMethods();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(prisma.deliveryMethod.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('POST /api/delivery-methods', () => {
    it('should return 401 if unauthorized user tries to create', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/delivery-methods', {
        method: 'POST',
        body: JSON.stringify({ name: 'Store Pickup' }),
      });

      const response = await createMethod(req);
      expect(response.status).toBe(401);
    });

    it('should create method successfully if admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'admin' },
      } as any);
      vi.mocked(prisma.deliveryMethod.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.deliveryMethod.create).mockResolvedValue({ id: 'dm-123', name: 'Store Pickup' } as any);

      const req = new NextRequest('http://localhost/api/delivery-methods', {
        method: 'POST',
        body: JSON.stringify({ name: 'Store Pickup', description: 'Store pickup desc', price: 0 }),
      });

      const response = await createMethod(req);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.name).toBe('Store Pickup');
      expect(prisma.deliveryMethod.create).toHaveBeenCalledWith({
        data: {
          name: 'Store Pickup',
          description: 'Store pickup desc',
          price: 0,
          active: true,
        },
      });
    });
  });

  describe('PUT /api/delivery-methods/[id]', () => {
    it('should update method details successfully if admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'admin' },
      } as any);
      vi.mocked(prisma.deliveryMethod.findUnique).mockResolvedValue({ id: 'dm-123', name: 'Store Pickup', active: true } as any);
      vi.mocked(prisma.deliveryMethod.update).mockResolvedValue({ id: 'dm-123', name: 'Store Pickup', active: false } as any);

      const req = new NextRequest('http://localhost/api/delivery-methods/dm-123', {
        method: 'PUT',
        body: JSON.stringify({ active: false }),
      });

      const response = await updateMethod(req, { params: Promise.resolve({ id: 'dm-123' }) });
      expect(response.status).toBe(200);

      expect(prisma.deliveryMethod.update).toHaveBeenCalledWith({
        where: { id: 'dm-123' },
        data: expect.objectContaining({ active: false }),
      });
    });
  });

  describe('DELETE /api/delivery-methods/[id]', () => {
    it('should delete method successfully if admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'admin' },
      } as any);
      vi.mocked(prisma.deliveryMethod.findUnique).mockResolvedValue({ id: 'dm-123', name: 'Store Pickup' } as any);

      const req = new NextRequest('http://localhost/api/delivery-methods/dm-123', {
        method: 'DELETE',
      });

      const response = await deleteMethod(req, { params: Promise.resolve({ id: 'dm-123' }) });
      expect(response.status).toBe(200);

      expect(prisma.deliveryMethod.delete).toHaveBeenCalledWith({
        where: { id: 'dm-123' },
      });
    });
  });

  describe('POST /api/orders (Save Delivery Method)', () => {
    it('should save the delivery method in order creation', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        { id: 'prod-1', title: 'Cookie', price: '$2.50', state: 'exist' },
      ] as any);
      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-xyz' } as any);

      const payload = {
        customerName: 'John',
        customerPhone: '123456',
        shippingAddress: 'Main Street',
        deliveryMethod: 'Home Delivery',
        items: [{ productId: 'prod-1', quantity: 2 }],
      };

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await createOrder(req);
      expect(response.status).toBe(201);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deliveryMethod: 'Home Delivery',
          }),
        })
      );
    });
  });
});
