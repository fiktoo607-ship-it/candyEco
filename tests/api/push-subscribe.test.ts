import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST as subscribe, DELETE as unsubscribe } from '@/app/api/notifications/subscribe/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pushSubscription: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

describe('Push Notifications Subscription Security (Issue #47)', () => {
  const sampleSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/sample-endpoint-token',
    expirationTime: null,
    keys: {
      p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9Q0A',
      auth: 'tBHItJI5svbpez7KI4CCXg',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DELETE /api/notifications/subscribe', () => {
    it('returns 401 Unauthorized when unauthenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost/api/notifications/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: sampleSubscription.endpoint }),
      });

      const res = await unsubscribe(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
      expect(prisma.pushSubscription.delete).not.toHaveBeenCalled();
    });

    it('returns 400 when endpoint is missing', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'user-1', role: 'customer' },
      } as any);

      const req = new NextRequest('http://localhost/api/notifications/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({}),
      });

      const res = await unsubscribe(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Missing endpoint field');
    });

    it('returns 403 Forbidden when a user attempts to delete another user endpoint', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'attacker-id', role: 'customer' },
      } as any);

      vi.mocked(prisma.pushSubscription.findUnique).mockResolvedValueOnce({
        id: 'sub-1',
        endpoint: sampleSubscription.endpoint,
        userId: 'victim-id',
      } as any);

      const req = new NextRequest('http://localhost/api/notifications/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: sampleSubscription.endpoint }),
      });

      const res = await unsubscribe(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Forbidden');
      expect(prisma.pushSubscription.delete).not.toHaveBeenCalled();
    });

    it('allows a user to delete their own subscription', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'user-1', role: 'customer' },
      } as any);

      vi.mocked(prisma.pushSubscription.findUnique).mockResolvedValueOnce({
        id: 'sub-1',
        endpoint: sampleSubscription.endpoint,
        userId: 'user-1',
      } as any);

      vi.mocked(prisma.pushSubscription.delete).mockResolvedValueOnce({} as any);

      const req = new NextRequest('http://localhost/api/notifications/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: sampleSubscription.endpoint }),
      });

      const res = await unsubscribe(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.pushSubscription.delete).toHaveBeenCalledWith({
        where: { endpoint: sampleSubscription.endpoint },
      });
    });

    it('allows an admin to delete any subscription', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-id', role: 'admin' },
      } as any);

      vi.mocked(prisma.pushSubscription.findUnique).mockResolvedValueOnce({
        id: 'sub-1',
        endpoint: sampleSubscription.endpoint,
        userId: 'other-user',
      } as any);

      vi.mocked(prisma.pushSubscription.delete).mockResolvedValueOnce({} as any);

      const req = new NextRequest('http://localhost/api/notifications/subscribe', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: sampleSubscription.endpoint }),
      });

      const res = await unsubscribe(req);
      expect(res.status).toBe(200);
      expect(prisma.pushSubscription.delete).toHaveBeenCalled();
    });
  });

  describe('POST /api/notifications/subscribe', () => {
    it('returns 403 Forbidden when re-binding existing endpoint to another user', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'attacker-id', role: 'customer' },
      } as any);

      vi.mocked(prisma.pushSubscription.findUnique).mockResolvedValueOnce({
        id: 'sub-1',
        endpoint: sampleSubscription.endpoint,
        userId: 'victim-id',
      } as any);

      const req = new NextRequest('http://localhost/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription: sampleSubscription }),
      });

      const res = await subscribe(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Forbidden');
      expect(prisma.pushSubscription.upsert).not.toHaveBeenCalled();
    });

    it('successfully registers or updates when endpoint is new or owned by user', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'user-1', role: 'customer' },
      } as any);

      vi.mocked(prisma.pushSubscription.findUnique).mockResolvedValueOnce({
        id: 'sub-1',
        endpoint: sampleSubscription.endpoint,
        userId: 'user-1',
      } as any);

      vi.mocked(prisma.pushSubscription.upsert).mockResolvedValueOnce({
        id: 'sub-1',
        endpoint: sampleSubscription.endpoint,
        userId: 'user-1',
      } as any);

      const req = new NextRequest('http://localhost/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription: sampleSubscription }),
      });

      const res = await subscribe(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.id).toBe('sub-1');
    });

    it('returns 400 when subscription fields are incomplete', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription: { endpoint: 'bad-endpoint' } }),
      });

      const res = await subscribe(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Missing required');
    });
  });
});
