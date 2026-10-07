import { vi, describe, it, expect, beforeEach } from 'vitest';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Mock Prisma client
vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
    },
  };
});

// Mock bcrypt
vi.mock('bcryptjs', () => {
  return {
    default: {
      compare: vi.fn(),
      hash: vi.fn(),
    },
  };
});

describe('NextAuth Callbacks & Security Hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAILS = 'admin@example.com,super@example.com';
  });

  describe('signIn callback (Issue #48: No silent admin elevation for existing users)', () => {
    it('should NOT elevate an existing user to admin on sign-in even if email is in ADMIN_EMAILS', async () => {
      const user = { id: 'u1', email: 'admin@example.com', name: 'Existing User' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'u1',
        email: 'admin@example.com',
        role: 'user',
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({ user: user as any, account: { provider: 'google' } as any, profile: {} as any });
        expect(result).toBe(true);
        // prisma.user.update must NOT be called for silent elevation
        expect(prisma.user.update).not.toHaveBeenCalled();
        expect((user as any).role).toBe('user');
      }
    });

    it('should assign role admin to a NEW user on first-time signup if email is in ADMIN_EMAILS', async () => {
      const user = { id: 'u-new', email: 'admin@example.com', name: 'New Admin' };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.count).mockResolvedValue(5);

      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({ user: user as any, account: { provider: 'google' } as any, profile: {} as any });
        expect(result).toBe(true);
        expect((user as any).role).toBe('admin');
      }
    });

    it('should assign role admin if it is the first user in the database (bootstrap)', async () => {
      const user = { id: 'u1', email: 'first@example.com', name: 'First' };
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
      const user = { id: 'u2', email: 'user@example.com', name: 'User' };
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

  describe('jwt & session callbacks (Issue #62: Revoke JWT on user delete)', () => {
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

    it('should revoke token and wipe role when user is deleted from DB (Issue #62)', async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      if (jwtCallback) {
        const token = { id: 'deleted-user-id', role: 'admin' };
        // User is deleted in database
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

        const result = await jwtCallback({ token, user: undefined, account: null, profile: undefined, trigger: 'update' } as any);

        // Resulting token must be empty/revoked with NO role
        expect(result.id).toBeUndefined();
        expect(result.role).toBeUndefined();
      }
    });

    it('should expire session and clear user when token is revoked/empty', async () => {
      const sessionCallback = authOptions.callbacks?.session;
      if (sessionCallback) {
        const session = { user: { name: 'Deleted Admin' } } as any;
        const emptyToken = {}; // revoked token after user deletion

        const result = await sessionCallback({ session, token: emptyToken as any, user: {} as any } as any);
        expect((result as any).user).toBeUndefined();
        expect(new Date(result.expires).getTime()).toBeLessThanOrEqual(Date.now());
      }
    });

    it('should populate valid session with user id and role from token', async () => {
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

  describe('CredentialsProvider (Issue #63: Password length cap against bcrypt DoS)', () => {
    it('should reject passwords exceeding 128 characters immediately without calling bcrypt.compare', async () => {
      const credentialsProvider = authOptions.providers.find(
        (p: any) => p.id === 'credentials' || p.name === 'Credentials'
      ) as any;

      const longPassword = 'a'.repeat(129);
      const authorizeFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;
      let error: any;
      try {
        await authorizeFn(
          {
            phone: '+1234567890',
            password: longPassword,
          },
          {} as any
        );
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error?.message).toBe('InvalidCredentials');

      // bcrypt.compare must NOT have been called
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });
});
