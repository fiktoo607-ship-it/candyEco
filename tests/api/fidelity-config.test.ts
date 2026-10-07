import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getFidelityConfig, POST as updateFidelityConfig } from '@/app/api/fidelity-config/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'admin-uuid', role: 'admin', name: 'Admin', email: 'admin@example.com' },
  }),
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    siteConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn((arg) => {
      if (typeof arg === 'function') return arg(mockPrisma);
      if (Array.isArray(arg)) return Promise.all(arg);
      return Promise.resolve(arg);
    }),
  };
  return {
    prisma: mockPrisma,
  };
});

describe('Fidelity Config API (/api/fidelity-config)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/fidelity-config', () => {
    it('should return configured thresholds or defaults', async () => {
      vi.mocked(prisma.siteConfig.findUnique)
        .mockResolvedValueOnce({ key: 'fidelity_vip_threshold', value: '600' })
        .mockResolvedValueOnce({ key: 'fidelity_fidele_threshold', value: '150' });

      const res = await getFidelityConfig();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({
        vipThreshold: 600,
        fideleThreshold: 150,
      });
    });

    it('should return defaults 500 and 100 when DB has no values', async () => {
      vi.mocked(prisma.siteConfig.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const res = await getFidelityConfig();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({
        vipThreshold: 500,
        fideleThreshold: 100,
      });
    });
  });

  describe('POST /api/fidelity-config', () => {
    it('should reject when both thresholds are undefined', async () => {
      const req = new NextRequest('http://localhost/api/fidelity-config', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await updateFidelityConfig(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Au moins un seuil');
    });

    it('should reject negative VIP threshold with 400 Bad Request', async () => {
      const req = new NextRequest('http://localhost/api/fidelity-config', {
        method: 'POST',
        body: JSON.stringify({ vipThreshold: -50, fideleThreshold: 100 }),
      });

      const res = await updateFidelityConfig(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Le seuil VIP doit être un entier strictement positif.');
    });

    it('should reject negative Fidèle threshold with 400 Bad Request', async () => {
      const req = new NextRequest('http://localhost/api/fidelity-config', {
        method: 'POST',
        body: JSON.stringify({ vipThreshold: 500, fideleThreshold: -20 }),
      });

      const res = await updateFidelityConfig(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Le seuil Fidèle doit être un entier strictement positif.');
    });

    it('should reject inverted values (VIP <= Fidèle) with 400 Bad Request', async () => {
      const req = new NextRequest('http://localhost/api/fidelity-config', {
        method: 'POST',
        body: JSON.stringify({ vipThreshold: 50, fideleThreshold: 200 }),
      });

      const res = await updateFidelityConfig(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Le seuil VIP doit être strictement supérieur au seuil Fidèle.');
    });

    it('should reject equal values (VIP === Fidèle) with 400 Bad Request', async () => {
      const req = new NextRequest('http://localhost/api/fidelity-config', {
        method: 'POST',
        body: JSON.stringify({ vipThreshold: 200, fideleThreshold: 200 }),
      });

      const res = await updateFidelityConfig(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Le seuil VIP doit être strictement supérieur au seuil Fidèle.');
    });

    it('should save valid thresholds (VIP > Fidèle) with 200 OK', async () => {
      vi.mocked(prisma.siteConfig.findUnique)
        .mockResolvedValueOnce({ key: 'fidelity_vip_threshold', value: '500' })
        .mockResolvedValueOnce({ key: 'fidelity_fidele_threshold', value: '100' });

      const req = new NextRequest('http://localhost/api/fidelity-config', {
        method: 'POST',
        body: JSON.stringify({ vipThreshold: 750, fideleThreshold: 150 }),
      });

      const res = await updateFidelityConfig(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({
        success: true,
        vipThreshold: 750,
        fideleThreshold: 150,
      });

      expect(prisma.siteConfig.upsert).toHaveBeenCalledWith({
        where: { key: 'fidelity_vip_threshold' },
        update: { value: '750' },
        create: { key: 'fidelity_vip_threshold', value: '750' },
      });
      expect(prisma.siteConfig.upsert).toHaveBeenCalledWith({
        where: { key: 'fidelity_fidele_threshold' },
        update: { value: '150' },
        create: { key: 'fidelity_fidele_threshold', value: '150' },
      });
    });
  });
});
