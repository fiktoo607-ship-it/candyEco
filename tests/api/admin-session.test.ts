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
  DELETE as deleteActiveSessionsRoute,
} from '@/app/api/admin/session/active/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { resetRateLimiter } from '@/lib/rate-limiter';

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

    it('returns 401 Unauthorized on GET /api/admin/session/active when unauthenticated (Issue #39)', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const res = await getActiveSessionsRoute();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 401 Unauthorized on GET /api/admin/session/active when authenticated as non-admin customer', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'cust-1', role: 'customer' },
      } as any);
      const res = await getActiveSessionsRoute();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('returns sanitized active sessions on GET /api/admin/session/active for authenticated admins with deviceId stripped', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);

      await acquireAdminLock('admin-1', {
        deviceId: 'dev-phone-secret',
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
      // Crucial: deviceId and internal session identifiers must be stripped
      expect((data.activeSessions[0] as any).deviceId).toBeUndefined();
      expect((data.activeSessions[0] as any).sessionId).toBeUndefined();
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
      // Verify deviceId and sessionId are stripped from POST response
      expect((data.activeSessions[0] as any).deviceId).toBeUndefined();
      expect((data.activeSessions[0] as any).sessionId).toBeUndefined();
    });

    it('rate limits POST /api/admin/session/active to prevent brute-force probing', async () => {
      resetRateLimiter();
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const req = {
        headers: { get: () => '192.168.1.100' },
        json: vi.fn().mockResolvedValue({ phone: '0999999999', password: 'bad-password' }),
      } as any;

      // First 5 attempts fail with 401
      for (let i = 0; i < 5; i++) {
        const res = await postActiveSessionsRoute(req);
        expect(res.status).toBe(401);
      }

      // 6th attempt must be blocked by rate limiter with 429
      const blockedRes = await postActiveSessionsRoute(req);
      expect(blockedRes.status).toBe(429);
      const data = await blockedRes.json();
      expect(data.error).toContain('Trop de tentatives');
    });

    it('enforces rate limiting (429) under concurrent burst requests to POST /api/admin/session/active (Issue #39)', async () => {
      resetRateLimiter();
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const burstRequests = Array.from({ length: 15 }, () => {
        const req = {
          headers: { get: () => '198.51.100.25' },
          json: vi.fn().mockResolvedValue({ phone: '0888888888', password: 'probe-password' }),
        } as any;
        return postActiveSessionsRoute(req);
      });

      const responses = await Promise.all(burstRequests);
      const rateLimited = responses.filter((r) => r.status === 429);
      const passed = responses.filter((r) => r.status !== 429);

      // Maximum 5 allowed per 15 minutes; remainder must be blocked with 429
      expect(passed.length).toBeLessThanOrEqual(5);
      expect(rateLimited.length).toBeGreaterThanOrEqual(10);
    });

    it('rejects POST /api/admin/session/active with 400 on missing credentials', async () => {
      const req = {
        json: vi.fn().mockResolvedValue({}),
      } as any;
      const res = await postActiveSessionsRoute(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('MissingCredentials');
    });

    it('rejects POST /api/admin/session/active with 400 on oversize passwords to prevent bcrypt CPU DoS', async () => {
      const req = {
        json: vi.fn().mockResolvedValue({ phone: '0123456789', password: 'A'.repeat(150) }),
      } as any;
      const res = await postActiveSessionsRoute(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('InvalidCredentials');
    });

    it('enforces per-phone rate limiting on POST across different IP addresses to prevent distributed credential stuffing', async () => {
      resetRateLimiter();
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const targetPhone = '0777777777';

      // 5 failed attempts from 5 distinct IP addresses
      for (let i = 1; i <= 5; i++) {
        const req = {
          headers: { get: () => `203.0.113.${i}` },
          json: vi.fn().mockResolvedValue({ phone: targetPhone, password: 'guessed-password' }),
        } as any;
        const res = await postActiveSessionsRoute(req);
        expect(res.status).toBe(401);
      }

      // 6th attempt from a brand new 6th IP against the same phone must be rate-limited (429)
      const reqBlocked = {
        headers: { get: () => '203.0.113.99' },
        json: vi.fn().mockResolvedValue({ phone: targetPhone, password: 'guessed-password' }),
      } as any;
      const resBlocked = await postActiveSessionsRoute(reqBlocked);
      expect(resBlocked.status).toBe(429);
      const data = await resBlocked.json();
      expect(data.error).toContain('Trop de tentatives sur ce compte');
    });

    it('performs constant-time dummy bcrypt comparison when phone does not belong to an admin to prevent timing oracle', async () => {
      resetRateLimiter();
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const req = {
        headers: { get: () => '192.168.1.50' },
        json: vi.fn().mockResolvedValue({ phone: '0900000000', password: 'timing-test-password' }),
      } as any;

      await postActiveSessionsRoute(req);
      expect(bcrypt.compare).toHaveBeenCalledWith('timing-test-password', expect.stringContaining('$2a$'));
    });

    it('releases admin sessions via DELETE /api/admin/session/active with valid credentials', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: 'admin-delete-test',
        phone: '0555112233',
        password: 'hashed-password',
        role: 'admin',
      } as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as any);

      await acquireAdminLock('admin-delete-test', {
        deviceId: 'dev-old',
        userName: 'Admin To Delete',
      });

      let sessions = await getActiveAdminSessions();
      expect(sessions.some((s) => s.userId === 'admin-delete-test')).toBe(true);

      const req = {
        headers: { get: () => '127.0.0.1' },
        json: vi.fn().mockResolvedValue({ phone: '0555112233', password: 'correct-password' }),
      } as any;

      const res = await deleteActiveSessionsRoute(req);
      expect(res.status).toBe(200);

      sessions = await getActiveAdminSessions();
      expect(sessions.some((s) => s.userId === 'admin-delete-test')).toBe(false);
    });

    it('rejects DELETE /api/admin/session/active with invalid credentials', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const req = {
        headers: { get: () => '127.0.0.1' },
        json: vi.fn().mockResolvedValue({ phone: '0555000000', password: 'wrong' }),
      } as any;

      const res = await deleteActiveSessionsRoute(req);
      expect(res.status).toBe(401);
    });

    it('enforces per-phone rate limiting on DELETE across different IP addresses', async () => {
      resetRateLimiter();
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      const targetPhone = '0555998877';

      for (let i = 1; i <= 5; i++) {
        const req = {
          headers: { get: () => `198.51.100.${i}` },
          json: vi.fn().mockResolvedValue({ phone: targetPhone, password: 'guess' }),
        } as any;
        const res = await deleteActiveSessionsRoute(req);
        expect(res.status).toBe(401);
      }

      // 6th attempt from a fresh IP
      const reqBlocked = {
        headers: { get: () => '198.51.100.200' },
        json: vi.fn().mockResolvedValue({ phone: targetPhone, password: 'guess' }),
      } as any;
      const resBlocked = await deleteActiveSessionsRoute(reqBlocked);
      expect(resBlocked.status).toBe(429);
      const data = await resBlocked.json();
      expect(data.error).toContain('Trop de tentatives sur ce compte');
    });
  });

  describe('TOCTOU Concurrency & Default Device Bypass Security (Issues #43, #45)', () => {
    it('prevents TOCTOU race conditions when simulating concurrent lock requests', async () => {
      // 1 slot is occupied by admin-1
      await acquireAdminLock('admin-1', { deviceId: 'dev-1', userName: 'Admin One' });

      // Simulate simultaneous requests by admin-2 and admin-3 for the remaining 1 slot
      const [resA, resB] = await Promise.all([
        acquireAdminLock('admin-2', { deviceId: 'dev-2', userName: 'Admin Two' }),
        acquireAdminLock('admin-3', { deviceId: 'dev-3', userName: 'Admin Three' }),
      ]);

      // Exactly ONE must succeed and the other must fail with MaxAdminsReached
      const successes = [resA, resB].filter((r) => r.success);
      const failures = [resA, resB].filter((r) => !r.success);

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);
      expect(failures[0].error).toBe('MaxAdminsReached');

      const allActive = await getActiveAdminSessions();
      expect(allActive.length).toBe(2);
    });

    it('prevents default_device bypass when an admin has an active session and tries logging in from another device', async () => {
      // Admin logs in with deviceId
      const firstLogin = await acquireAdminLock('admin-bypass', {
        deviceId: 'dev-trusted',
        userName: 'Admin Bypass',
      });
      expect(firstLogin.success).toBe(true);

      // Same admin attempts to log in using 'default_device' (or omitted deviceId like in OAuth)
      const secondLogin = await acquireAdminLock('admin-bypass', {
        deviceId: 'default_device',
        userName: 'Admin Bypass',
        userAgent: 'Different Mobile Safari',
      });

      expect(secondLogin.success).toBe(false);
      expect(secondLogin.error).toBe('SameAccountAnotherDevice');
    });

    it('prevents circumventing single-device limit when initial session was created without deviceId (e.g. OAuth)', async () => {
      // Admin logs in via OAuth on desktop
      const oauthLogin = await acquireAdminLock('admin-oauth', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
        userName: 'Admin OAuth',
      });
      expect(oauthLogin.success).toBe(true);

      // Same admin attempts to log in from a mobile phone
      const secondOAuthLogin = await acquireAdminLock('admin-oauth', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1',
        userName: 'Admin OAuth',
      });

      expect(secondOAuthLogin.success).toBe(false);
      expect(secondOAuthLogin.error).toBe('SameAccountAnotherDevice');
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

  describe('Hardcoded Credentials Security Audit (Issue #114)', () => {
    it('verifies absence of hardcoded passwords in scripts and seed files (Issue #114)', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const rootDir = path.resolve(__dirname, '../..');

      const targetFiles = [
        path.join(rootDir, 'prisma', 'seed.ts'),
        path.join(rootDir, 'scripts', 'create-admin.ts'),
        path.join(rootDir, 'scripts', 'create-admin.cjs'),
      ];

      const forbiddenLiterals = [
        'pass012',
        'password123',
      ];

      for (const filePath of targetFiles) {
        expect(fs.existsSync(filePath)).toBe(true);
        const content = fs.readFileSync(filePath, 'utf8');

        // Check that forbidden literal credentials do not exist
        for (const literal of forbiddenLiterals) {
          expect(content).not.toContain(literal);
        }

        // Check that ADMIN_INIT_PASSWORD is used without hardcoded default fallback string
        if (filePath.endsWith('create-admin.ts') || filePath.endsWith('seed.ts')) {
          expect(content).toContain('ADMIN_INIT_PASSWORD');
          expect(content).not.toMatch(/process\.env\.ADMIN_INIT_PASSWORD\s*\|\|\s*['"][^'"]+['"]/);
        }
      }
    });
  });
});

