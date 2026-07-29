import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getUsers } from '@/app/api/users/route';
import { POST as createOrder } from '@/app/api/orders/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    product: {
      findMany: vi.fn(),
    },
    siteConfig: {
      findUnique: vi.fn().mockResolvedValue(null),
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

describe('User Trust System API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/orders (Session Linkage)', () => {
    it('should link the order to the logged-in user id if a session exists', async () => {
      // Mock session
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123', email: 'user@example.com', role: 'user' },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-123' } as any);

      // Mock products in cart
      vi.mocked(prisma.product.findMany).mockResolvedValue([
        { id: 'prod-1', title: 'Candy A', price: '$5.00', state: 'exist' },
      ] as any);

      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-123' } as any);

      const payload = {
        customerName: 'Alice',
        customerPhone: '987654321',
        shippingAddress: '456 Sweet Ave',
        items: [{ productId: 'prod-1', quantity: 2 }],
        sessionId: 'session-xyz',
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
            userId: 'user-123',
          }),
        })
      );
    });

    it('should set userId to null if checkout is a guest (no session)', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      vi.mocked(prisma.product.findMany).mockResolvedValue([
        { id: 'prod-1', title: 'Candy A', price: '$5.00', state: 'exist' },
      ] as any);

      vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-123' } as any);

      const payload = {
        customerName: 'Alice',
        customerPhone: '987654321',
        shippingAddress: '456 Sweet Ave',
        items: [{ productId: 'prod-1', quantity: 2 }],
        sessionId: 'session-xyz',
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
            userId: null,
          }),
        })
      );
    });
  });

  describe('GET /api/users (Trust Metrics and Sorting)', () => {
    const mockUsersFromDb = [
      {
        id: 'u1',
        name: 'User One',
        email: 'user1@example.com',
        role: 'user',
        emailVerified: null,
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
        orders: [
          { createdAt: new Date('2026-01-02T10:00:00.000Z'), status: 'DELIVERED', totalAmount: 40.0 },
          { createdAt: new Date('2026-01-03T10:00:00.000Z'), status: 'PENDING', totalAmount: 15.0 },
        ],
      },
      {
        id: 'u2',
        name: 'User Two',
        email: 'user2@example.com',
        role: 'user',
        emailVerified: null,
        createdAt: new Date('2026-01-01T11:00:00.000Z'),
        orders: [
          { createdAt: new Date('2026-01-04T10:00:00.000Z'), status: 'DELIVERED', totalAmount: 30.5 },
          { createdAt: new Date('2026-01-05T10:00:00.000Z'), status: 'COMPLETED', totalAmount: 20.0 },
        ],
      },
    ];

    it('should return 401 if unauthorized', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/users');
      const response = await getUsers(req);
      expect(response.status).toBe(401);
    });

    it('should compute correct trust score, completed order count, and latest activity', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsersFromDb as any);

      const req = new NextRequest('http://localhost/api/users');
      const response = await getUsers(req);
      expect(response.status).toBe(200);

      const users = await response.json();
      expect(users).toHaveLength(2);

      // User One has 1 completed order (DELIVERED), latest activity on 2026-01-03 (PENDING order)
      const u1 = users.find((u: any) => u.id === 'u1');
      expect(u1.completedOrderCount).toBe(1);
      expect(u1.trustScore).toBe(40);
      expect(u1.latestActivity).toBe(new Date('2026-01-03T10:00:00.000Z').toISOString());

      // User Two has 2 completed orders (DELIVERED + COMPLETED), latest activity on 2026-01-05
      const u2 = users.find((u: any) => u.id === 'u2');
      expect(u2.completedOrderCount).toBe(2);
      expect(u2.trustScore).toBe(50);
      expect(u2.latestActivity).toBe(new Date('2026-01-05T10:00:00.000Z').toISOString());
    });

    it('should sort by trust score in descending order', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsersFromDb as any);

      const req = new NextRequest('http://localhost/api/users?sortBy=trustScore&sortOrder=desc');
      const response = await getUsers(req);
      expect(response.status).toBe(200);

      const users = await response.json();
      expect(users[0].id).toBe('u2'); // Higher trust score (2 vs 1)
      expect(users[1].id).toBe('u1');
    });

    it('should sort by latest activity in ascending order', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsersFromDb as any);

      const req = new NextRequest('http://localhost/api/users?sortBy=latestActivity&sortOrder=asc');
      const response = await getUsers(req);
      expect(response.status).toBe(200);

      const users = await response.json();
      expect(users[0].id).toBe('u1'); // Older latest activity (Jan 3 vs Jan 5)
      expect(users[1].id).toBe('u2');
    });

    it('should filter out administrators and calculate client status correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      const statusMockUsers = [
        {
          id: 'u_vip',
          name: 'VIP User',
          email: 'vip@example.com',
          role: 'user',
          orders: [{ createdAt: new Date('2026-01-02T10:00:00.000Z'), status: 'DELIVERED', totalAmount: 550.0 }],
        },
        {
          id: 'u_fidele',
          name: 'Fidele User',
          email: 'fidele@example.com',
          role: 'user',
          orders: [{ createdAt: new Date('2026-01-02T10:00:00.000Z'), status: 'DELIVERED', totalAmount: 120.0 }],
        },
        {
          id: 'u_verifie',
          name: 'Verifie User',
          email: 'verifie@example.com',
          role: 'user',
          orders: [{ createdAt: new Date('2026-01-02T10:00:00.000Z'), status: 'DELIVERED', totalAmount: 50.0 }],
        },
        {
          id: 'u_non_verifie',
          name: 'Non Verifie User',
          email: 'nonverifie@example.com',
          role: 'user',
          orders: [{ createdAt: new Date('2026-01-02T10:00:00.000Z'), status: 'PENDING', totalAmount: 30.0 }],
        },
      ];

      vi.mocked(prisma.user.findMany).mockResolvedValue(statusMockUsers as any);

      const req = new NextRequest('http://localhost/api/users');
      const response = await getUsers(req);
      expect(response.status).toBe(200);

      const users = await response.json();
      expect(users).toHaveLength(4);

      const vip = users.find((u: any) => u.id === 'u_vip');
      expect(vip.status).toBe('VIP');

      const fidele = users.find((u: any) => u.id === 'u_fidele');
      expect(fidele.status).toBe('Fidèle');

      const verifie = users.find((u: any) => u.id === 'u_verifie');
      expect(verifie.status).toBe('Vérifié');

      const nonVerifie = users.find((u: any) => u.id === 'u_non_verifie');
      expect(nonVerifie.status).toBe('Non vérifié');

      // Assert database query filtered out admin roles
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: expect.objectContaining({
              notIn: ['admin', 'ADMIN']
            })
          })
        })
      );
    });
  });
});
