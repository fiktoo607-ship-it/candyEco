import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resetRateLimiter } from '@/lib/rate-limiter';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-pass'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe('Registration & Authentication Security Verification (Issues #5, #116, #117)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimiter();
    process.env.ADMIN_EMAILS = 'admin@candyele.com,superadmin@candyele.com';
  });

  // Issue #116: Unverified client-supplied body email must NOT grant admin role
  it('does NOT grant admin role when client sends an ADMIN_EMAILS address in registration body (Issue #116)', async () => {
    let createdRole: string | undefined;

    const txMock = {
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(10), // existing database with users
        create: vi.fn().mockImplementation(async ({ data }) => {
          createdRole = data.role;
          return { id: 'u-hacker-1', ...data };
        }),
      },
      order: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => cb(txMock));

    const req = {
      headers: { get: () => '127.0.0.1' },
      json: vi.fn().mockResolvedValue({
        name: 'Attacker Impersonating Admin',
        phone: '+213555999888',
        email: 'admin@candyele.com', // Guessing/knowing admin email
        password: 'Password123!',
      }),
    } as any;

    const res = await registerRoute(req);
    expect(res.status).toBe(201);

    // Security assertion: Public registration MUST yield role "user"
    expect(createdRole).toBe('user');
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'user',
        }),
      })
    );
  });

  // Issue #117: Phone-registered users must NOT be rejected with EmailNotVerified on login
  it('allows phone-registered user to sign in without being rejected by EmailNotVerified (Issue #117)', async () => {
    const phoneUser = {
      id: 'u-phone-customer',
      name: 'Phone Customer',
      phone: '+213555112233',
      email: null,
      emailVerified: null,
      role: 'user',
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(phoneUser as any);

    const signInCallback = authOptions.callbacks?.signIn;
    expect(signInCallback).toBeDefined();

    if (signInCallback) {
      // Must not throw EmailNotVerified error
      let errorThrown: any = null;
      let signInResult: any = null;
      try {
        signInResult = await signInCallback({
          user: { id: phoneUser.id, phone: phoneUser.phone, role: 'user' } as any,
          account: { provider: 'credentials' } as any,
          profile: {} as any,
        });
      } catch (err) {
        errorThrown = err;
      }

      expect(errorThrown).toBeNull();
      expect(signInResult).toBe(true);
    }
  });

  // Issue #5: First-user bootstrap race condition prevention
  it('prevents first-user bootstrap privilege escalation race on public registration (Issue #5)', async () => {
    let firstUserRole: string | undefined;

    const txMock = {
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0), // Database is empty (count === 0)
        create: vi.fn().mockImplementation(async ({ data }) => {
          firstUserRole = data.role;
          return { id: 'u-first-user', ...data };
        }),
      },
      order: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => cb(txMock));

    const req = {
      headers: { get: () => '127.0.0.1' },
      json: vi.fn().mockResolvedValue({
        name: 'First Random Registrant',
        phone: '+213555000000',
        password: 'Password123!',
      }),
    } as any;

    const res = await registerRoute(req);
    expect(res.status).toBe(201);

    // Security assertion: Public registration MUST NOT grant admin role just because count === 0
    expect(firstUserRole).toBe('user');
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'user',
        }),
      })
    );
  });
});
