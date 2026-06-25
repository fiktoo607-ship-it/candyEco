import { vi, describe, it, expect, beforeEach } from 'vitest';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Mock Prisma client
vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

describe('NextAuth Callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAILS = 'admin@example.com,super@example.com';
  });

  describe('signIn callback', () => {
    it('should assign role admin if user email is in ADMIN_EMAILS', async () => {
      const user = { email: 'admin@example.com', name: 'Admin' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', email: 'admin@example.com', role: 'user' } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({ user: user as any, account: {} as any, profile: {} as any });
        expect(result).toBe(true);
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { email: 'admin@example.com' },
          data: { role: 'admin' },
        });
        expect((user as any).role).toBe('admin');
      }
    });

    it('should assign role admin if it is the first user in the database', async () => {
      const user = { email: 'first@example.com', name: 'First' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({ user: user as any, account: {} as any, profile: {} as any });
        expect(result).toBe(true);
        expect((user as any).role).toBe('admin');
      }
    });

    it('should assign role user if not in ADMIN_EMAILS and not first user', async () => {
      const user = { email: 'user@example.com', name: 'User' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u2', email: 'user@example.com', role: 'user' } as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({ user: user as any, account: {} as any, profile: {} as any });
        expect(result).toBe(true);
        expect((user as any).role).toBe('user');
      }
    });
  });

  describe('jwt callback', () => {
    it('should populate token with user id and role on initial sign in', async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      if (jwtCallback) {
        const token = {};
        const user = { id: 'user-uuid-1', role: 'admin' };
        const result = await jwtCallback({ token, user, account: null, profile: undefined, trigger: 'signIn' } as any);
        expect(result.id).toBe('user-uuid-1');
        expect(result.role).toBe('admin');
      }
    });

    it('should fetch user role from db if user is not passed (session restoration)', async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      if (jwtCallback) {
        const token = { id: 'user-uuid-1', role: 'user' };
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-uuid-1', role: 'admin' } as any);
        const result = await jwtCallback({ token, user: undefined, account: null, profile: undefined, trigger: 'update' } as any);
        expect(result.role).toBe('admin');
        expect(prisma.user.findUnique).toHaveBeenCalled();
      }
    });
  });

  describe('session callback', () => {
    it('should populate session with user id and role from token', async () => {
      const sessionCallback = authOptions.callbacks?.session;
      if (sessionCallback) {
        const session = { user: { name: 'Test' } } as any;
        const token = { id: 'user-uuid-1', role: 'admin' };
        const result = await sessionCallback({ session, token, user: {} as any } as any);
        expect((result.user as any)?.id).toBe('user-uuid-1');
        expect((result.user as any)?.role).toBe('admin');
      }
    });
  });
});
