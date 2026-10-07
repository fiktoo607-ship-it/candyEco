import { describe, it, expect, vi, beforeEach } from 'vitest';
// @ts-ignore
import nextConfig from '@/next.config.mjs';
import { NextRequest } from 'next/server';
import * as userDetailApi from '@/app/api/users/[id]/route';
import * as deliveryMethodsApi from '@/app/api/delivery-methods/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    deliveryMethod: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe('Security & Validation Enhancements Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Phase 1: Security Headers in next.config.mjs', () => {
    it('should include all required security headers', async () => {
      expect(nextConfig.headers).toBeDefined();
      if (typeof nextConfig.headers === 'function') {
        const headersConfig = await nextConfig.headers();
        expect(Array.isArray(headersConfig)).toBe(true);
        const globalHeader = headersConfig.find((h: any) => h.source === '/(.*)');
        expect(globalHeader).toBeDefined();

        const headerKeys = globalHeader.headers.map((h: any) => h.key);
        expect(headerKeys).toContain('X-Content-Type-Options');
        expect(headerKeys).toContain('X-Frame-Options');
        expect(headerKeys).toContain('X-XSS-Protection');
        expect(headerKeys).toContain('Referrer-Policy');
        expect(headerKeys).toContain('Permissions-Policy');
        expect(headerKeys).toContain('Strict-Transport-Security');

        const frameOptions = globalHeader.headers.find((h: any) => h.key === 'X-Frame-Options');
        expect(frameOptions.value).toBe('SAMEORIGIN');

        const contentType = globalHeader.headers.find((h: any) => h.key === 'X-Content-Type-Options');
        expect(contentType.value).toBe('nosniff');
      }
    });
  });

  describe('Phase 4: Route Zod Validation', () => {
    it('PUT /api/users/[id] should reject invalid status not in whitelist', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      });

      const req = new NextRequest('http://localhost:3000/api/users/user-123', {
        method: 'PUT',
        body: JSON.stringify({
          status: 'SUPERUSER_INVALID',
        }),
      });

      const res = await userDetailApi.PUT(req, {
        params: Promise.resolve({ id: 'user-123' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Données invalides');
      expect(data.details?.status).toBeDefined();
    });

    it('PUT /api/users/[id] should reject negative trustScore', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      });

      const req = new NextRequest('http://localhost:3000/api/users/user-123', {
        method: 'PUT',
        body: JSON.stringify({
          trustScore: -50,
        }),
      });

      const res = await userDetailApi.PUT(req, {
        params: Promise.resolve({ id: 'user-123' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Données invalides');
      expect(data.details?.trustScore).toBeDefined();
    });

    it('POST /api/delivery-methods should reject negative price', async () => {
      (getServerSession as any).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      });

      const req = new NextRequest('http://localhost:3000/api/delivery-methods', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Livraison Express',
          price: -10,
        }),
      });

      const res = await deliveryMethodsApi.POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Données invalides');
      expect(data.details?.price).toBeDefined();
    });
  });
});
