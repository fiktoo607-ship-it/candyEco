import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  acquireAdminLock,
  refreshAdminLock,
  releaseAdminLock,
  getActiveAdminSession,
  _resetInMemoryAdminSession,
} from '@/lib/admin-session';
import {
  GET as getSessionHeartbeat,
  POST as postSessionHeartbeat,
  DELETE as deleteSessionHeartbeat,
} from '@/app/api/admin/session/heartbeat/route';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  redisPub: null,
  redisSub: null,
}));

describe('Admin Session Concurrency & Lock Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetInMemoryAdminSession();
  });

  describe('Core Lock Logic (lib/admin-session.ts)', () => {
    it('allows first admin to acquire the lock', async () => {
      const result = await acquireAdminLock('admin-1', {
        userName: 'Admin One',
        userEmail: 'admin1@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.activeSession).toBeDefined();
      expect(result.activeSession?.userId).toBe('admin-1');
      expect(result.activeSession?.userName).toBe('Admin One');
    });

    it('allows same admin to re-acquire / keep lock', async () => {
      await acquireAdminLock('admin-1', { userName: 'Admin One' });
      const result2 = await acquireAdminLock('admin-1', { userName: 'Admin One' });

      expect(result2.success).toBe(true);
      expect(result2.activeSession?.userId).toBe('admin-1');
    });

    it('blocks second admin when first admin is actively holding the lock', async () => {
      await acquireAdminLock('admin-1', { userName: 'Admin One' });
      
      const result2 = await acquireAdminLock('admin-2', { userName: 'Admin Two' });

      expect(result2.success).toBe(false);
      expect(result2.activeSession?.userId).toBe('admin-1');
    });

    it('refreshes heartbeat for current active admin', async () => {
      await acquireAdminLock('admin-1', { userName: 'Admin One' });

      const refreshed = await refreshAdminLock('admin-1');
      expect(refreshed).toBe(true);

      const refreshedOther = await refreshAdminLock('admin-2');
      expect(refreshedOther).toBe(false);
    });

    it('releases lock and allows second admin to acquire it afterwards', async () => {
      await acquireAdminLock('admin-1', { userName: 'Admin One' });
      
      // Admin 1 releases lock
      await releaseAdminLock('admin-1');

      const activeAfterRelease = await getActiveAdminSession();
      expect(activeAfterRelease).toBeNull();

      // Now Admin 2 can acquire
      const result2 = await acquireAdminLock('admin-2', { userName: 'Admin Two' });
      expect(result2.success).toBe(true);
      expect(result2.activeSession?.userId).toBe('admin-2');
    });

    it('does not allow non-holder admin to release someone elses lock', async () => {
      await acquireAdminLock('admin-1', { userName: 'Admin One' });
      
      // Admin 2 tries to release Admin 1's lock
      await releaseAdminLock('admin-2');

      // Admin 1's lock should still be active
      const activeSession = await getActiveAdminSession();
      expect(activeSession?.userId).toBe('admin-1');
    });
  });

  describe('Heartbeat API Routes (/api/admin/session/heartbeat)', () => {
    it('returns 401 on GET if unauthenticated or not admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const res = await getSessionHeartbeat();
      expect(res.status).toBe(401);
    });

    it('returns 401 on POST if unauthenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const res = await postSessionHeartbeat();
      expect(res.status).toBe(401);
    });

    it('successfully processes POST heartbeat for authenticated admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin', name: 'Admin One' },
      } as any);

      const res = await postSessionHeartbeat();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      const active = await getActiveAdminSession();
      expect(active?.userId).toBe('admin-1');
    });

    it('returns 409 conflict if POST heartbeat called by admin when another is active', async () => {
      // First acquire lock for admin-1
      await acquireAdminLock('admin-1', { userName: 'Admin One' });

      // Admin 2 attempts heartbeat
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-2', role: 'admin', name: 'Admin Two' },
      } as any);

      const res = await postSessionHeartbeat();
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe('AdminSessionActive');
    });

    it('releases session on DELETE request from holding admin', async () => {
      await acquireAdminLock('admin-1', { userName: 'Admin One' });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);

      const res = await deleteSessionHeartbeat();
      expect(res.status).toBe(200);

      const active = await getActiveAdminSession();
      expect(active).toBeNull();
    });
  });
});
