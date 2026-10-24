import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
// @ts-ignore
import nextConfig from '@/next.config.mjs';
import { getClientIp, checkRateLimit, resetRateLimiter } from '@/lib/rate-limit';
import { DELETE as deleteUpload } from '@/app/api/upload/route';
import { POST as subscribePush } from '@/app/api/notifications/subscribe/route';
import { deleteImage } from '@/lib/cloudinary';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Mock Cloudinary
vi.mock('@/lib/cloudinary', () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn().mockResolvedValue({ result: 'ok' }),
  getPublicIdFromUrl: vi.fn((url: string) => {
    if (url.includes('res.cloudinary.com')) return 'products/test-image';
    return null;
  }),
}));

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pushSubscription: {
      findUnique: vi.fn(),
      upsert: vi.fn().mockResolvedValue({ id: 'sub-123' }),
      delete: vi.fn(),
    },
  },
}));

describe('Security: Headers, Rate Limit & Endpoint Authorization (Issues #7, #14, #122)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimiter();
  });

  describe('Issue #7: Rate Limiter Protection against Spoofed X-Forwarded-For', () => {
    it('should NOT allow bypassing the rate limiter with spoofed X-Forwarded-For headers from the same connection', async () => {
      const realPeerIp = '198.51.100.77';
      const options = { keyPrefix: 'spoof-test', limit: 2, windowSeconds: 60 };

      // Attacker sends 3 requests from the same connection IP, but with randomized/spoofed X-Forwarded-For
      const req1 = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '10.0.0.1' },
      });
      (req1 as any).ip = realPeerIp;

      const req2 = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '172.16.0.2, 10.0.0.2' },
      });
      (req2 as any).ip = realPeerIp;

      const req3 = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.3' },
      });
      (req3 as any).ip = realPeerIp;

      // Ensure getClientIp resolves to the trusted connection address, ignoring client-injected headers
      expect(getClientIp(req1)).toBe(realPeerIp);
      expect(getClientIp(req2)).toBe(realPeerIp);
      expect(getClientIp(req3)).toBe(realPeerIp);

      const res1 = await checkRateLimit(getClientIp(req1), options);
      expect(res1.success).toBe(true);

      const res2 = await checkRateLimit(getClientIp(req2), options);
      expect(res2.success).toBe(true);

      // Third request must be blocked because the connection IP exceeded limit (2)
      const res3 = await checkRateLimit(getClientIp(req3), options);
      expect(res3.success).toBe(false);
      expect(res3.remaining).toBe(0);
    });

    it('should ignore forged leftmost hops when behind a trusted proxy and extract legitimate client IP', () => {
      const trustedProxyHop = '150.172.238.178';
      const spoofedClientHop = '1.1.1.1';

      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': `${spoofedClientHop}, ${trustedProxyHop}`,
        },
      });

      // When request.ip is not directly attached, it must not blindly trust the leftmost spoofed hop
      const extractedIp = getClientIp(req);
      expect(extractedIp).not.toBe(spoofedClientHop);
      expect(extractedIp).toBe(trustedProxyHop);
    });

    it('should NOT allow bypassing the rate limiter with spoofed X-Forwarded-For when originating from the same Vercel proxy connection (x-vercel-forwarded-for)', async () => {
      const realPeerIp = '198.51.100.88';
      const options = { keyPrefix: 'vercel-spoof-test', limit: 2, windowSeconds: 60 };

      // Attacker sends 3 requests from the same Vercel connection, rotating x-forwarded-for headers:
      const req1 = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '1.2.3.4',
          'x-vercel-forwarded-for': realPeerIp,
        },
      });

      const req2 = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '5.6.7.8',
          'x-vercel-forwarded-for': realPeerIp,
        },
      });

      const req3 = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '9.10.11.12',
          'x-vercel-forwarded-for': realPeerIp,
        },
      });

      // getClientIp must prioritize verified x-vercel-forwarded-for over client-injected x-forwarded-for
      expect(getClientIp(req1)).toBe(realPeerIp);
      expect(getClientIp(req2)).toBe(realPeerIp);
      expect(getClientIp(req3)).toBe(realPeerIp);

      const res1 = await checkRateLimit(getClientIp(req1), options);
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(1);

      const res2 = await checkRateLimit(getClientIp(req2), options);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(0);

      // Third request must be blocked because the originating connection exceeded the limit of 2,
      // and spoofing x-forwarded-for must not reset the rate limiter counter.
      const res3 = await checkRateLimit(getClientIp(req3), options);
      expect(res3.success).toBe(false);
      expect(res3.remaining).toBe(0);
      expect(res3.retryAfter).toBeGreaterThan(0);
    });

    it('should NOT allow bypassing the rate limiter with spoofed X-Forwarded-For when reverse proxy sets x-real-ip', async () => {
      const proxyPeerIp = '203.0.113.50';
      const options = { keyPrefix: 'x-real-ip-test', limit: 2, windowSeconds: 60 };

      const req1 = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '10.0.0.1',
          'x-real-ip': proxyPeerIp,
        },
      });

      const req2 = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '10.0.0.2',
          'x-real-ip': proxyPeerIp,
        },
      });

      const req3 = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '10.0.0.3',
          'x-real-ip': proxyPeerIp,
        },
      });

      expect(getClientIp(req1)).toBe(proxyPeerIp);
      expect(getClientIp(req2)).toBe(proxyPeerIp);
      expect(getClientIp(req3)).toBe(proxyPeerIp);

      const res1 = await checkRateLimit(getClientIp(req1), options);
      expect(res1.success).toBe(true);

      const res2 = await checkRateLimit(getClientIp(req2), options);
      expect(res2.success).toBe(true);

      const res3 = await checkRateLimit(getClientIp(req3), options);
      expect(res3.success).toBe(false);
    });

    it('should extract the rightmost hop if x-vercel-forwarded-for contains multiple hops due to upstream proxy chaining', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-vercel-forwarded-for': 'client.spoofed.hop, 198.51.100.99',
        },
      });
      expect(getClientIp(req)).toBe('198.51.100.99');
    });
  });

  describe('Issue #14: Security Headers & CSP Configuration', () => {
    it('should configure Content-Security-Policy and omit deprecated legacy headers like X-XSS-Protection', async () => {
      expect(nextConfig.poweredByHeader).toBe(false);

      const headersList = await nextConfig.headers();
      const catchAllConfig = headersList.find((h: any) => h.source === '/(.*)');
      expect(catchAllConfig).toBeDefined();

      const headersMap = new Map(
        catchAllConfig.headers.map((h: { key: string; value: string }) => [h.key.toLowerCase(), h.value])
      );

      // 1. Content-Security-Policy must be present
      expect(headersMap.has('content-security-policy')).toBe(true);
      const csp = headersMap.get('content-security-policy') as string;
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain('https://fonts.googleapis.com');
      expect(csp).toContain('https://fonts.gstatic.com');
      expect(csp).toContain('https://res.cloudinary.com');

      // 2. Deprecated / obsolete legacy headers like X-XSS-Protection must be absent
      expect(headersMap.has('x-xss-protection')).toBe(false);

      // 3. Modern security headers must be enforced
      expect(headersMap.get('x-content-type-options')).toBe('nosniff');
      expect(headersMap.get('x-frame-options')).toBe('SAMEORIGIN');
    });
  });

  describe('Issue #122: Authorization & Input Validation for Delete and Push Endpoints', () => {
    it('should require admin authorization for deleting images via DELETE /api/upload', async () => {
      // 1. Unauthenticated request -> 401
      vi.mocked(getServerSession).mockResolvedValueOnce(null);
      const unauthReq = new NextRequest('http://localhost/api/upload', {
        method: 'DELETE',
        body: JSON.stringify({ publicId: 'products/sample-pic' }),
      });
      const unauthRes = await deleteUpload(unauthReq);
      expect(unauthRes.status).toBe(401);
      expect(deleteImage).not.toHaveBeenCalled();

      // 2. Customer / non-admin session -> 401 or 403
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'cust-1', role: 'customer' },
      } as any);
      const nonAdminReq = new NextRequest('http://localhost/api/upload', {
        method: 'DELETE',
        body: JSON.stringify({ publicId: 'products/sample-pic' }),
      });
      const nonAdminRes = await deleteUpload(nonAdminReq);
      expect([401, 403]).toContain(nonAdminRes.status);
      expect(deleteImage).not.toHaveBeenCalled();

      // 3. Admin session -> 200 and calls deleteImage
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-1', role: 'admin' },
      } as any);
      const adminReq = new NextRequest('http://localhost/api/upload', {
        method: 'DELETE',
        body: JSON.stringify({ publicId: 'products/sample-pic' }),
      });
      const adminRes = await deleteUpload(adminReq);
      expect(adminRes.status).toBe(200);
      expect(deleteImage).toHaveBeenCalledWith('products/sample-pic');
    });

    it('should strictly validate push notification subscription endpoints to reject SSRF and non-HTTPS endpoints', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      // 1. Insecure HTTP endpoint
      const insecureHttpReq = new NextRequest('http://localhost/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: {
            endpoint: 'http://insecure-push-service.com/notify',
            keys: { p256dh: 'sample-p256dh-key', auth: 'sample-auth-key' },
          },
        }),
      });
      const resHttp = await subscribePush(insecureHttpReq);
      expect(resHttp.status).toBe(400);

      // 2. Loopback / SSRF endpoint
      const ssrfReq = new NextRequest('http://localhost/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: {
            endpoint: 'https://localhost:8443/internal-admin',
            keys: { p256dh: 'sample-p256dh-key', auth: 'sample-auth-key' },
          },
        }),
      });
      const resSsrf = await subscribePush(ssrfReq);
      expect(resSsrf.status).toBe(400);

      // 3. Private IP range SSRF endpoint (169.254.169.254)
      const cloudMetadataReq = new NextRequest('http://localhost/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: {
            endpoint: 'https://169.254.169.254/latest/meta-data',
            keys: { p256dh: 'sample-p256dh-key', auth: 'sample-auth-key' },
          },
        }),
      });
      const resMetadata = await subscribePush(cloudMetadataReq);
      expect(resMetadata.status).toBe(400);

      // 4. Valid HTTPS push service endpoint succeeds
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'user-valid', role: 'customer' },
      } as any);
      vi.mocked(prisma.pushSubscription.findUnique).mockResolvedValueOnce(null);

      const validReq = new NextRequest('http://localhost/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: {
            endpoint: 'https://fcm.googleapis.com/fcm/send/valid-device-token',
            keys: { p256dh: 'sample-p256dh-key', auth: 'sample-auth-key' },
          },
        }),
      });
      const resValid = await subscribePush(validReq);
      expect(resValid.status).toBe(200);
      expect(prisma.pushSubscription.upsert).toHaveBeenCalled();
    });
  });
});
