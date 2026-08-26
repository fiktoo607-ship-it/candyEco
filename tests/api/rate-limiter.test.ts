import { vi, describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limiter';
import { NextRequest } from 'next/server';

describe('Rate Limiter & Abuse Protection (SEC-08)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow requests under the limit', async () => {
    const identifier = `test-ip-under-${Date.now()}`;
    const options = { keyPrefix: 'test', limit: 3, windowSeconds: 60 };

    const res1 = await checkRateLimit(identifier, options);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await checkRateLimit(identifier, options);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);
  });

  it('should allow request exactly at limit and reject next request (over limit)', async () => {
    const identifier = `test-ip-exact-${Date.now()}`;
    const options = { keyPrefix: 'test', limit: 2, windowSeconds: 60 };

    // Request 1: Allowed
    const res1 = await checkRateLimit(identifier, options);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(1);

    // Request 2: Exactly at limit (Allowed)
    const res2 = await checkRateLimit(identifier, options);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(0);

    // Request 3: Exceeds limit (Rejected)
    const res3 = await checkRateLimit(identifier, options);
    expect(res3.success).toBe(false);
    expect(res3.remaining).toBe(0);
    expect(res3.retryAfter).toBeGreaterThan(0);

    // Test HTTP 429 response structure and headers
    const httpResponse = createRateLimitResponse(res3);
    expect(httpResponse.status).toBe(429);
    expect(httpResponse.headers.get('Retry-After')).toBeDefined();
    expect(httpResponse.headers.get('X-RateLimit-Limit')).toBe('2');
    expect(httpResponse.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('should isolate rate limits across separate users / IPs', async () => {
    const ipA = `user-a-${Date.now()}`;
    const ipB = `user-b-${Date.now()}`;
    const options = { keyPrefix: 'test', limit: 1, windowSeconds: 60 };

    const resA1 = await checkRateLimit(ipA, options);
    expect(resA1.success).toBe(true);

    const resA2 = await checkRateLimit(ipA, options);
    expect(resA2.success).toBe(false);

    // User B should not be blocked by User A
    const resB1 = await checkRateLimit(ipB, options);
    expect(resB1.success).toBe(true);
  });

  it('should handle concurrent requests safely without counter corruption', async () => {
    const identifier = `concurrent-test-${Date.now()}`;
    const options = { keyPrefix: 'test', limit: 5, windowSeconds: 60 };

    // Send 10 concurrent requests
    const promises = Array.from({ length: 10 }, () => checkRateLimit(identifier, options));
    const results = await Promise.all(promises);

    const allowed = results.filter((r) => r.success).length;
    const blocked = results.filter((r) => !r.success).length;

    expect(allowed).toBe(5);
    expect(blocked).toBe(5);
  });

  it('should accurately extract client IP from forwarding headers', () => {
    const reqWithForwarded = new NextRequest('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
      },
    });
    expect(getClientIp(reqWithForwarded)).toBe('203.0.113.195');

    const reqWithRealIp = new NextRequest('http://localhost/api/test', {
      headers: {
        'x-real-ip': '198.51.100.42',
      },
    });
    expect(getClientIp(reqWithRealIp)).toBe('198.51.100.42');

    const reqEmpty = new NextRequest('http://localhost/api/test');
    expect(getClientIp(reqEmpty)).toBe('127.0.0.1');
  });
});
