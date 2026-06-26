import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getNotifications, PATCH as updateNotifications } from '@/app/api/notifications/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    orderNotification: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    order: {
      create: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    product: {
      findMany: vi.fn(),
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

describe('Notifications API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('should return 401 if user is not logged in', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await getNotifications(new NextRequest('http://localhost/api/notifications'));
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if user is not an admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'user' },
      } as any);

      const response = await getNotifications(new NextRequest('http://localhost/api/notifications'));
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 200 and notifications if user is admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'admin' },
      } as any);

      const mockNotifications = [
        { id: 'notif-1', orderId: 'order-1', read: false, createdAt: new Date() },
        { id: 'notif-2', orderId: 'order-2', read: true, createdAt: new Date() },
      ];
      vi.mocked(prisma.orderNotification.findMany).mockResolvedValue(mockNotifications as any);

      const response = await getNotifications(new NextRequest('http://localhost/api/notifications'));
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0].id).toBe('notif-1');
      expect(prisma.orderNotification.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { order: true },
      });
    });
  });

  describe('PATCH /api/notifications', () => {
    it('should return 401 if unauthorized', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'notif-1' }),
      });

      const response = await updateNotifications(req);
      expect(response.status).toBe(401);
    });

    it('should mark a specific notification as read', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'admin' },
      } as any);

      const req = new NextRequest('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'notif-1' }),
      });

      vi.mocked(prisma.orderNotification.update).mockResolvedValue({
        id: 'notif-1',
        read: true,
      } as any);

      const response = await updateNotifications(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.read).toBe(true);
      expect(prisma.orderNotification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { read: true },
        include: { order: true },
      });
    });

    it('should mark all notifications as read if readAll is true', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'admin' },
      } as any);

      const req = new NextRequest('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ readAll: true }),
      });

      vi.mocked(prisma.orderNotification.updateMany).mockResolvedValue({ count: 5 } as any);

      const response = await updateNotifications(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(prisma.orderNotification.updateMany).toHaveBeenCalledWith({
        where: { read: false },
        data: { read: true },
      });
    });

    it('should return 400 if request lacks id and readAll', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'admin' },
      } as any);

      const req = new NextRequest('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({}),
      });

      const response = await updateNotifications(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Missing notification id or readAll parameter');
    });
  });
});
