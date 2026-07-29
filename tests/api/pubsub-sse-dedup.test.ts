import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST as updatePresence } from '@/app/api/notifications/presence/route';
import { GET as getSSE } from '@/app/api/notifications/sse/route';
import { setAdminTabActive, hasActiveAdminTab } from '@/lib/presence';
import { notificationEmitter } from '@/lib/notification-emitter';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

describe('Pub/Sub, SSE Heartbeat & Notification Deduplication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Presence API & Helper (/api/notifications/presence)', () => {
    it('should return 401 if user is not authenticated as admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/notifications/presence', {
        method: 'POST',
        body: JSON.stringify({ isVisible: true }),
      });

      const response = await updatePresence(req);
      expect(response.status).toBe(401);
    });

    it('should return 400 if isVisible is missing or invalid', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'admin' },
      } as any);

      const req = new NextRequest('http://localhost/api/notifications/presence', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await updatePresence(req);
      expect(response.status).toBe(400);
    });

    it('should successfully update admin presence when isVisible is boolean', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);

      const req = new NextRequest('http://localhost/api/notifications/presence', {
        method: 'POST',
        body: JSON.stringify({ isVisible: true }),
      });

      const response = await updatePresence(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.isVisible).toBe(true);

      const isActive = await hasActiveAdminTab();
      expect(isActive).toBe(true);

      // Deactivate presence
      await setAdminTabActive('admin-1', false);
      const isActiveAfter = await hasActiveAdminTab();
      expect(isActiveAfter).toBe(false);
    });
  });

  describe('SSE Route Handler with 15s Heartbeat Headers', () => {
    it('should set correct headers including X-Accel-Buffering for proxying', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { role: 'admin' },
      } as any);

      const req = new NextRequest('http://localhost/api/notifications/sse');
      const response = await getSSE(req);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform');
      expect(response.headers.get('Connection')).toBe('keep-alive');
      expect(response.headers.get('X-Accel-Buffering')).toBe('no');
    });
  });

  describe('NotificationEmitter (Redis Pub/Sub & Local Fallback)', () => {
    it('should emit events locally when Redis is not connected', () => {
      const listener = vi.fn();
      notificationEmitter.on('new-order', listener);

      const mockOrder = { id: 'order-123' };
      notificationEmitter.emit('new-order', mockOrder);

      expect(listener).toHaveBeenCalledWith(mockOrder);
      notificationEmitter.off('new-order', listener);
    });
  });
});
