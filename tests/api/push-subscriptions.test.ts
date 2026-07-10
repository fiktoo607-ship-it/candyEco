import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock server-only index to prevent Vitest import environment error
vi.mock('server-only', () => ({}));

import { POST as createSubscription, DELETE as deleteSubscription } from '@/app/api/push-subscriptions/route';
import { sendPushNotification } from '@/lib/push-notifications';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import webpush from '@/lib/webpush';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock web-push configuration module
vi.mock('@/lib/webpush', () => {
  return {
    default: {
      sendNotification: vi.fn(),
    },
  };
});

// Mock Prisma client
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    pushSubscription: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
  };
});

describe('Push Subscriptions API & Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/push-subscriptions', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/push-subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: 'https://fcm.googleapis.com/fcm/send/some-endpoint',
          keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
        }),
      });

      const response = await createSubscription(req);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if endpoint is missing or invalid', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
      } as any);

      const req = new NextRequest('http://localhost/api/push-subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
        }),
      });

      const response = await createSubscription(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid or missing endpoint');
    });

    it('should return 400 if keys are missing or invalid', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
      } as any);

      const req = new NextRequest('http://localhost/api/push-subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: 'https://fcm.googleapis.com/fcm/send/some-endpoint',
        }),
      });

      const response = await createSubscription(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid or missing keys (p256dh, auth)');
    });

    it('should return 200 and create/update subscription if request is valid', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
      } as any);

      const mockSub = {
        id: 'sub-id',
        userId: 'user-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/some-endpoint',
        p256dh: 'p256dh-key',
        auth: 'auth-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.pushSubscription.upsert).mockResolvedValue(mockSub);

      const req = new NextRequest('http://localhost/api/push-subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: 'https://fcm.googleapis.com/fcm/send/some-endpoint',
          keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
        }),
      });

      const response = await createSubscription(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe('sub-id');
      expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: 'https://fcm.googleapis.com/fcm/send/some-endpoint' },
        update: { userId: 'user-1', p256dh: 'p256dh-key', auth: 'auth-key' },
        create: { userId: 'user-1', endpoint: 'https://fcm.googleapis.com/fcm/send/some-endpoint', p256dh: 'p256dh-key', auth: 'auth-key' },
      });
    });
  });

  describe('DELETE /api/push-subscriptions', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/push-subscriptions?endpoint=some-endpoint', {
        method: 'DELETE',
      });

      const response = await deleteSubscription(req);
      expect(response.status).toBe(401);
    });

    it('should delete all subscriptions of the user if no endpoint parameter is provided', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
      } as any);

      vi.mocked(prisma.pushSubscription.deleteMany).mockResolvedValue({ count: 2 });

      const req = new NextRequest('http://localhost/api/push-subscriptions', {
        method: 'DELETE',
      });

      const response = await deleteSubscription(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should return 404 if the specific endpoint subscription is not found', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
      } as any);

      vi.mocked(prisma.pushSubscription.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/push-subscriptions?endpoint=missing-endpoint', {
        method: 'DELETE',
      });

      const response = await deleteSubscription(req);
      expect(response.status).toBe(404);
    });

    it('should return 401 if the subscription belongs to another user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
      } as any);

      vi.mocked(prisma.pushSubscription.findUnique).mockResolvedValue({
        id: 'sub-id',
        userId: 'user-2', // belongs to user-2
        endpoint: 'some-endpoint',
      } as any);

      const req = new NextRequest('http://localhost/api/push-subscriptions?endpoint=some-endpoint', {
        method: 'DELETE',
      });

      const response = await deleteSubscription(req);
      expect(response.status).toBe(401);
    });

    it('should delete the specific subscription if user owns it', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
      } as any);

      vi.mocked(prisma.pushSubscription.findUnique).mockResolvedValue({
        id: 'sub-id',
        userId: 'user-1',
        endpoint: 'some-endpoint',
      } as any);

      const req = new NextRequest('http://localhost/api/push-subscriptions?endpoint=some-endpoint', {
        method: 'DELETE',
      });

      const response = await deleteSubscription(req);
      expect(response.status).toBe(200);
      expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
        where: { endpoint: 'some-endpoint' },
      });
    });
  });

  describe('sendPushNotification service helper', () => {
    it('should not try to send if user has no subscriptions', async () => {
      vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([]);

      const result = await sendPushNotification('user-1', { title: 'Test', body: 'Body' });
      expect(result.sentCount).toBe(0);
      expect(webpush.sendNotification).not.toHaveBeenCalled();
    });

    it('should send notification to all user devices and return success', async () => {
      const mockSubs = [
        { id: 'sub-1', userId: 'user-1', endpoint: 'ep-1', p256dh: 'd-1', auth: 'a-1' },
        { id: 'sub-2', userId: 'user-1', endpoint: 'ep-2', p256dh: 'd-2', auth: 'a-2' },
      ];
      vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue(mockSubs as any);
      vi.mocked(webpush.sendNotification).mockResolvedValue({} as any);

      const result = await sendPushNotification('user-1', { title: 'Hello', body: 'World' });
      expect(result.sentCount).toBe(2);
      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
      expect(result.results[0].status).toBe('fulfilled');
    });

    it('should automatically delete subscription if web-push throws 410 or 404', async () => {
      const mockSubs = [
        { id: 'sub-1', userId: 'user-1', endpoint: 'ep-expired', p256dh: 'd-1', auth: 'a-1' },
      ];
      vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue(mockSubs as any);
      
      const error410 = new Error('Subscription expired');
      (error410 as any).statusCode = 410;
      vi.mocked(webpush.sendNotification).mockRejectedValue(error410);
      vi.mocked(prisma.pushSubscription.delete).mockResolvedValue({} as any);

      const result = await sendPushNotification('user-1', { title: 'Hello', body: 'World' });
      expect(result.sentCount).toBe(1);
      // It should trigger prisma delete
      expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
        where: { endpoint: 'ep-expired' },
      });
      // The promise itself fails
      expect(result.results[0].status).toBe('rejected');
    });
  });
});
