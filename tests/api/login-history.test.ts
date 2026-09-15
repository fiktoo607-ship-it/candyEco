import { vi, describe, it, expect, beforeEach } from 'vitest';
import { recordLoginHistory } from '@/lib/login-history';
import { GET as getHistoryRoute } from '@/app/api/admin/history/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    loginHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/admin-session', () => ({
  getActiveAdminSessions: vi.fn().mockResolvedValue([]),
}));

describe('Login History & Device Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordLoginHistory utility', () => {
    it('accurately parses desktop user agent and records login history', async () => {
      vi.mocked(prisma.loginHistory.create).mockResolvedValue({
        id: 'hist-1',
        userId: 'user-1',
        userName: 'Admin Karim',
        userPhone: '+33 6 12 34 56 78',
        userEmail: 'karim@example.com',
        role: 'admin',
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'Windows 10/11',
        deviceLabel: 'Chrome sur Windows 10/11 (PC)',
        ip: '127.0.0.1',
        location: 'Localhost / Réseau local',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        status: 'success',
        createdAt: new Date(),
      } as any);

      const result = await recordLoginHistory({
        userId: 'user-1',
        userName: 'Admin Karim',
        userPhone: '+33 6 12 34 56 78',
        userEmail: 'karim@example.com',
        role: 'admin',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      });

      expect(result).toBeDefined();
      expect(prisma.loginHistory.create).toHaveBeenCalledTimes(1);
      const callArgs = vi.mocked(prisma.loginHistory.create).mock.calls[0][0] as any;
      expect(callArgs?.data?.deviceType).toBe('desktop');
      expect(callArgs?.data?.browser).toBe('Chrome');
      expect(callArgs?.data?.os).toBe('Windows 10/11');
      expect(callArgs?.data?.deviceLabel).toContain('Chrome sur Windows 10/11 (PC)');
    });

    it('accurately parses mobile user agent (iPhone Safari)', async () => {
      vi.mocked(prisma.loginHistory.create).mockResolvedValue({ id: 'hist-2' } as any);

      await recordLoginHistory({
        userId: 'user-2',
        userName: 'Sara Client',
        role: 'user',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      });

      const callArgs = vi.mocked(prisma.loginHistory.create).mock.calls[0][0] as any;
      expect(callArgs?.data?.deviceType).toBe('mobile');
      expect(callArgs?.data?.browser).toBe('Safari');
      expect(callArgs?.data?.os).toBe('iOS (iPhone)');
      expect(callArgs?.data?.deviceLabel).toContain('Safari sur iOS (iPhone) (Mobile)');
    });
  });

  describe('GET /api/admin/history', () => {
    it('rejects unauthenticated requests with 401', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const res = await getHistoryRoute({ url: 'http://localhost/api/admin/history' } as any);
      expect(res.status).toBe(401);
    });

    it('rejects regular user requests with 401', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'u1', role: 'user' },
      } as any);
      const res = await getHistoryRoute({ url: 'http://localhost/api/admin/history' } as any);
      expect(res.status).toBe(401);
    });

    it('returns login history list for admin with device info', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);

      vi.mocked(prisma.loginHistory.count).mockResolvedValue(1);
      vi.mocked(prisma.loginHistory.findMany).mockResolvedValue([
        {
          id: 'hist-1',
          userId: 'admin-1',
          userName: 'Admin Karim',
          userPhone: '+33 6 12 34 56 78',
          userEmail: 'karim@example.com',
          role: 'admin',
          deviceType: 'desktop',
          browser: 'Chrome',
          os: 'Windows 10/11',
          deviceLabel: 'Chrome sur Windows 10/11 (PC)',
          ip: '127.0.0.1',
          location: 'Localhost',
          status: 'success',
          createdAt: new Date(),
        } as any,
      ]);

      const res = await getHistoryRoute({ url: 'http://localhost/api/admin/history?page=1&limit=10' } as any);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.history).toHaveLength(1);
      expect(data.history[0].deviceInfo.label).toBe('Chrome sur Windows 10/11 (PC)');
      expect(data.history[0].deviceInfo.deviceType).toBe('desktop');
      expect(data.pagination.total).toBe(1);
    });
  });
});
