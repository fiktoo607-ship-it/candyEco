import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as registerRoute } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';
import { resetRateLimiter } from '@/lib/rate-limiter';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    order: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-pass'),
    compare: vi.fn(),
  },
}));

describe('Registration & First-User Bootstrap Security (Issue #42)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimiter();
  });

  it('uses interactive transaction and assigns admin role only to the first user', async () => {
    const txMock = {
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockImplementation(async ({ data }) => ({
          id: 'u-1',
          ...data,
        })),
      },
      order: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => cb(txMock));

    const req = {
      headers: { get: () => '127.0.0.1' },
      json: vi.fn().mockResolvedValue({
        name: 'First Admin',
        phone: '+213555000001',
        password: 'ValidPassword123!',
      }),
    } as any;

    const res = await registerRoute(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.userId).toBe('u-1');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'admin',
        }),
      })
    );
  });

  it('assigns regular user role when userCount > 0 in transaction', async () => {
    const txMock = {
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(1),
        create: vi.fn().mockImplementation(async ({ data }) => ({
          id: 'u-2',
          ...data,
        })),
      },
      order: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => cb(txMock));

    const req = {
      headers: { get: () => '127.0.0.1' },
      json: vi.fn().mockResolvedValue({
        name: 'Second Customer',
        phone: '+213555000002',
        password: 'ValidPassword123!',
      }),
    } as any;

    const res = await registerRoute(req);
    expect(res.status).toBe(201);

    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'user',
        }),
      })
    );
  });

  it('rejects registration when phone is already in use within transaction', async () => {
    const txMock = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'existing-id' }),
        count: vi.fn(),
        create: vi.fn(),
      },
      order: {
        updateMany: vi.fn(),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => cb(txMock));

    const req = {
      headers: { get: () => '127.0.0.1' },
      json: vi.fn().mockResolvedValue({
        name: 'Duplicate Phone User',
        phone: '+213555000001',
        password: 'ValidPassword123!',
      }),
    } as any;

    const res = await registerRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Ce numéro de téléphone est déjà utilisé.');
    expect(txMock.user.create).not.toHaveBeenCalled();
  });
});
