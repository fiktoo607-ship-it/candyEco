import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { parsePrice } from '@/lib/utils';
import { POST as updateFidelity } from '@/app/api/fidelity/route';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'admin-1', email: 'admin@candyeco.com', role: 'admin' },
  }),
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    siteConfig: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.key === 'fidelity_vip_threshold') {
          return Promise.resolve({ key: 'fidelity_vip_threshold', value: '500' });
        }
        if (where.key === 'fidelity_fidele_threshold') {
          return Promise.resolve({ key: 'fidelity_fidele_threshold', value: '100' });
        }
        return Promise.resolve(null);
      }),
      upsert: vi.fn().mockResolvedValue({}),
    },
  };
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

describe('Price Parser & Decimal Localization (Issues #52, #65)', () => {
  it('parses price with comma decimal separator ("1,8€") as 1.8 and NOT 18', () => {
    const result = parsePrice('1,8€');
    expect(result).toBe(1.8);
    expect(result).not.toBe(18);
  });

  it('parses localized Algerian Dinar price with letters ("1.80 DA") as 1.8 and NOT 18 or 180', () => {
    const result = parsePrice('1.80 DA');
    expect(result).toBe(1.8);
    expect(result).not.toBe(18);
    expect(result).not.toBe(180);
  });

  it('handles various international currencies without returning NaN or dropping decimals', () => {
    expect(parsePrice('12,50 €')).toBe(12.5);
    expect(parsePrice('$12.50')).toBe(12.5);
    expect(parsePrice('3,5 DA')).toBe(3.5);
    expect(parsePrice('2500 DA')).toBe(2500);
    expect(parsePrice(1.8)).toBe(1.8);
  });
});

describe('Fidelity Threshold Validation (Issue #112)', () => {
  it('rejects inverted fidelity thresholds with 400 Bad Request when VIP <= Fidèle', async () => {
    const payload = {
      vipThreshold: 100,
      fideleThreshold: 200, // Inverted: Fidèle cannot be higher than VIP
    };

    const req = new NextRequest('http://localhost/api/fidelity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await updateFidelity(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(data.error).toMatch(/VIP.*supérieur.*Fidèle|invalide|seuil/i);
  });

  it('rejects equal fidelity thresholds with 400 Bad Request', async () => {
    const payload = {
      vipThreshold: 300,
      fideleThreshold: 300,
    };

    const req = new NextRequest('http://localhost/api/fidelity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await updateFidelity(req);
    expect(res.status).toBe(400);
  });
});
