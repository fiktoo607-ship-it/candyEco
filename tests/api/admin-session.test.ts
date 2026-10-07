import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  acquireAdminLock,
  refreshAdminLock,
  releaseAdminLock,
  getActiveAdminSession,
  getActiveAdminSessions,
  generateSecureSessionId,
  _resetInMemoryAdminSession,
  MAX_CONCURRENT_ADMINS,
} from '@/lib/admin-session';
import {
  GET as getSessionHeartbeat,
  POST as postSessionHeartbeat,
  DELETE as deleteSessionHeartbeat,
} from '@/app/api/admin/session/heartbeat/route';
import {
  GET as getActiveSessionsRoute,
  POST as postActiveSessionsRoute,
} from '@/app/api/admin/session/active/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock('@/lib/redis', () => ({
  redisPub: null,
  redisSub: null,
}));

describe('Admin Multi-Device & 2-Admin Concurrency Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetInMemoryAdminSession();
  });

  describe('Core Multi-Admin & Device Lock Logic (lib/admin-session.ts)', () => {
    it('allows first admin to acquire the lock with device and geo info', async () => {
      const result = await acquireAdminLock('admin-1', {
        deviceId: 'device-1',
        userName: 'Karim Admin',
        userEmail: 'karim@example.com',
        userPhone: '+213 555 12 34 56',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      expect(result.success).toBe(true);
      expect(result.activeSession).toBeDefined();
      expect(result.activeSession?.userId).toBe('admin-1');
      expect(result.activeSession?.userName).toBe('Karim Admin');
      expect(result.activeSession?.userPhone).toBe('+213 555 12 34 56');
      expect(result.activeSession?.deviceInfo.browser).toBe('Chrome');
      expect(result.activeSession?.deviceInfo.os).toBe('Windows 10/11');
      expect(result.activeSession?.deviceInfo.deviceType).toBe('desktop');
    });

    it('allows a second distinct admin to acquire the lock concurrently (up to 2 admins)', async () => {
      await acquireAdminLock('admin-1', { deviceId: 'dev-1', userName: 'Admin One' });

      const result2 = await acquireAdminLock('admin-2', {
        deviceId: 'dev-2',
        userName: 'Admin Two',
        userPhone: '+213 666 98 76 54',
      });

      expect(result2.success).toBe(true);
      expect(result2.activeSession?.userId).toBe('admin-2');

      const allActive = await getActiveAdminSessions();
      expect(allActive.length).toBe(2);
      expect(MAX_CONCURRENT_ADMINS).toBe(2);
    });

    it('blocks a third admin when 2 admins are already actively holding sessions', async () => {
      await acquireAdminLock('admin-1', { deviceId: 'dev-1', userName: 'Admin One' });
      await acquireAdminLock('admin-2', { deviceId: 'dev-2', userName: 'Admin Two' });

      const result3 = await acquireAdminLock('admin-3', {
        deviceId: 'dev-3',
        userName: 'Admin Three',
      });

      expect(result3.success).toBe(false);
      expect(result3.error).toBe('MaxAdminsReached');
      expect(result3.activeSessions.length).toBe(2);
    });

    it('blocks the SAME admin from logging in on a DIFFERENT device (Single device per account)', async () => {
      await acquireAdminLock('admin-1', { deviceId: 'device-laptop', userName: 'Admin One' });

      // Admin 1 attempts to log in from a mobile phone
      const resultSameAdminNewDevice = await acquireAdminLock('admin-1', {
        deviceId: 'device-mobile',
        userName: 'Admin One',
      });

      expect(resultSameAdminNewDevice.success).toBe(false);
      expect(resultSameAdminNewDevice.error).toBe('SameAccountAnotherDevice');
    });

    it('allows the same admin on the SAME device to refresh without occupying another slot', async () => {
      await acquireAdminLock('admin-1', { deviceId: 'dev-1', userName: 'Admin One' });

      const refreshResult = await acquireAdminLock('admin-1', {
        deviceId: 'dev-1',
        userName: 'Admin One Updated',
      });

      expect(refreshResult.success).toBe(true);
      const allActive = await getActiveAdminSessions();
      expect(allActive.length).toBe(1);
      expect(allActive[0].userName).toBe('Admin One Updated');
    });

    it('refreshes heartbeat for active admin on matching device', async () => {
      await acquireAdminLock('admin-1', { deviceId: 'dev-1' });

      const refreshed = await refreshAdminLock('admin-1', 'dev-1');
      expect(refreshed).toBe(true);

      const refreshedOther = await refreshAdminLock('admin-unknown', 'dev-1');
      expect(refreshedOther).toBe(false);
    });

    it('releases lock for admin-1 and allows admin-3 to join', async () => {
      await acquireAdminLock('admin-1', { deviceId: 'dev-1' });
      await acquireAdminLock('admin-2', { deviceId: 'dev-2' });

      // Release Admin 1
      await releaseAdminLock('admin-1', 'dev-1');

      let active = await getActiveAdminSessions();
      expect(active.length).toBe(1);
      expect(active[0].userId).toBe('admin-2');

      // Now Admin 3 can acquire
      const result3 = await acquireAdminLock('admin-3', { deviceId: 'dev-3' });
      expect(result3.success).toBe(true);

      active = await getActiveAdminSessions();
      expect(active.length).toBe(2);
    });
  });

  describe('Heartbeat & Active Sessions API Routes', () => {
    it('returns 401 on GET heartbeat if unauthenticated or not admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const res = await getSessionHeartbeat({} as any);
      expect(res.status).toBe(401);
    });

    it('returns public list of active sessions with device & location details for logged-out admins', async () => {
      await acquireAdminLock('admin-1', {
        deviceId: 'dev-phone',
        userName: 'Sara Admin',
        userPhone: '+33 6 12 34 56 78',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      });

      const res = await getActiveSessionsRoute();
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.slotsOccupied).toBe(1);
      expect(data.maxSlots).toBe(2);
      expect(data.isFull).toBe(false);
      expect(data.activeSessions.length).toBe(1);
      expect(data.activeSessions[0].userName).toBe('Sara Admin');
      expect(data.activeSessions[0].userPhone).toBe('+33 6 12 34 56 78');
      expect(data.activeSessions[0].deviceInfo.os).toBe('iOS (iPhone)');
      expect(data.activeSessions[0].deviceInfo.deviceType).toBe('mobile');
    });

    it('returns 409 conflict when 3rd admin tries to heartbeat without a slot', async () => {
      await acquireAdminLock('admin-1', { deviceId: 'dev-1' });
      await acquireAdminLock('admin-2', { deviceId: 'dev-2' });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-3', role: 'admin', name: 'Admin Three' },
      } as any);

      const req = {
        json: vi.fn().mockResolvedValue({ deviceId: 'dev-3' }),
        headers: { get: vi.fn() },
      } as any;

      const res = await postSessionHeartbeat(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe('MaxAdminsReached');
    });

    it('returns 409 conflict when same admin tries to heartbeat from another device', async () => {
      await acquireAdminLock('admin-1', { deviceId: 'dev-1' });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin', name: 'Admin One' },
      } as any);

      const req = {
        json: vi.fn().mockResolvedValue({ deviceId: 'dev-2-new-phone' }),
        headers: { get: vi.fn() },
      } as any;

      const res = await postSessionHeartbeat(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe('SameAccountAnotherDevice');
    });

    it('rejects POST /api/admin/session/active when credentials are invalid', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const req = {
        json: vi.fn().mockResolvedValue({ phone: '0123456789', password: 'wrong' }),
      } as any;

      const res = await postActiveSessionsRoute(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('InvalidCredentials');
    });

    it('returns active sessions on POST /api/admin/session/active when admin credentials are valid', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'admin-1',
        phone: '04545454',
        password: 'hashed-password',
        role: 'admin',
      } as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

      await acquireAdminLock('admin-2', {
        deviceId: 'dev-win',
        userName: 'Admin 2',
        userPhone: '04545454',
      });

      const req = {
        json: vi.fn().mockResolvedValue({ phone: '04545454', password: 'correct-password' }),
      } as any;

      const res = await postActiveSessionsRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.activeSessions.length).toBe(1);
      expect(data.activeSessions[0].userName).toBe('Admin 2');
    });
  });

  describe('CSPRNG Session ID Security (Issue #50)', () => {
    it('generates secure session IDs without calling Math.random()', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random');
      const sessionId = generateSecureSessionId();

      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThanOrEqual(16);
      expect(mathRandomSpy).not.toHaveBeenCalled();

      mathRandomSpy.mockRestore();
    });

    it('creates new session with CSPRNG sessionId without calling Math.random()', async () => {
      const mathRandomSpy = vi.spyOn(Math, 'random');

      const result = await acquireAdminLock('admin-csprng', {
        deviceId: 'dev-csprng',
        userName: 'Secure Admin',
      });

      expect(result.success).toBe(true);
      expect(result.activeSession).toBeDefined();
      expect(typeof result.activeSession?.sessionId).toBe('string');
      expect(result.activeSession?.sessionId.length).toBeGreaterThanOrEqual(16);
      expect(mathRandomSpy).not.toHaveBeenCalled();

      mathRandomSpy.mockRestore();
    });
  });
});
