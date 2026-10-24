import { NextRequest, NextResponse } from 'next/server';
import { redisPub } from '@/lib/redis';

export interface RateLimitOptions {
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds remaining until reset
}

// In-memory sliding window fallback when Redis is offline or not configured
interface MemoryWindow {
  count: number;
  resetAt: number; // Milliseconds timestamp
}

const memoryStore = new Map<string, MemoryWindow>();

/**
 * Periodically purge stale keys from in-memory fallback store
 */
function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (record.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}

// Clean up memory store every 60 seconds
if (typeof setInterval !== 'undefined') {
  const interval = setInterval(cleanupMemoryStore, 60000);
  if (interval.unref) {
    interval.unref();
  }
}

export function resetRateLimiter(): void {
  memoryStore.clear();
}

/**
 * Helper to safely extract a header value from Request or NextRequest,
 * whether headers is a Headers instance or a plain object.
 */
function getHeader(request: Request | NextRequest, name: string): string | null {
  if (!request || !request.headers) return null;
  if (typeof request.headers.get === 'function') {
    return request.headers.get(name);
  }
  const headers = request.headers as unknown as Record<string, string | string[] | undefined>;
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  if (!key) return null;
  const val = headers[key];
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'string') return val;
  return null;
}

/**
 * Extracts a trustworthy client IP address from request.
 * Prioritizes request.ip / socket address and verified platform/proxy headers
 * (x-vercel-forwarded-for, x-real-ip, cf-connecting-ip) before falling back
 * to rightmost proxy hop of X-Forwarded-For to prevent client spoofing (Issue #7).
 */
export function getClientIp(request: Request | NextRequest): string {
  if (!request) return '127.0.0.1';

  // 1. Prefer direct connection IP (request.ip, socket.remoteAddress, connection.remoteAddress)
  if (typeof (request as any).ip === 'string' && (request as any).ip.trim()) {
    return (request as any).ip.trim();
  }
  if (typeof (request as any).socket?.remoteAddress === 'string' && (request as any).socket.remoteAddress.trim()) {
    return (request as any).socket.remoteAddress.trim();
  }
  if (typeof (request as any).connection?.remoteAddress === 'string' && (request as any).connection.remoteAddress.trim()) {
    return (request as any).connection.remoteAddress.trim();
  }

  if (!request.headers) return '127.0.0.1';

  // 2. Verified platform / reverse proxy headers:
  // 2a. Vercel edge network (x-vercel-forwarded-for appends verified client IP as rightmost hop)
  const vercelForwarded = getHeader(request, 'x-vercel-forwarded-for');
  if (vercelForwarded) {
    const hops = vercelForwarded.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) {
      const rightmost = hops[hops.length - 1];
      if (rightmost) return rightmost;
    }
  }

  // 2b. Reverse proxy: x-real-ip (Nginx / Vercel verified client IP)
  const realIp = getHeader(request, 'x-real-ip');
  if (realIp && realIp.trim()) {
    const hops = realIp.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) {
      const rightmost = hops[hops.length - 1];
      if (rightmost) return rightmost;
    }
  }

  // 2c. Cloudflare: cf-connecting-ip
  const cfConnectingIp = getHeader(request, 'cf-connecting-ip');
  if (cfConnectingIp && cfConnectingIp.trim()) {
    const hops = cfConnectingIp.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) {
      const rightmost = hops[hops.length - 1];
      if (rightmost) return rightmost;
    }
  }

  // 3. Fallback to rightmost proxy hop of X-Forwarded-For
  const forwarded = getHeader(request, 'x-forwarded-for');
  if (forwarded) {
    const hops = forwarded.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) {
      const rightmost = hops[hops.length - 1];
      if (rightmost) return rightmost;
    }
  }

  return '127.0.0.1';
}

/**
 * Atomic Distributed Rate Limiter
 * 
 * Uses atomic Redis Lua scripts when available, falling back to a safe
 * in-memory rate-limiter if Redis is unavailable.
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { keyPrefix, limit, windowSeconds } = options;
  const key = `ratelimit:${keyPrefix}:${identifier}`;
  const now = Date.now();

  if (redisPub) {
    try {
      if (redisPub.status === 'wait') {
        await redisPub.connect().catch(() => {});
      }

      // Atomic Lua script: INCR and set EXPIRE if new key, returning count and TTL
      const luaScript = `
        local current = redis.call('INCR', KEYS[1])
        if current == 1 then
          redis.call('EXPIRE', KEYS[1], ARGV[1])
        end
        local ttl = redis.call('TTL', KEYS[1])
        return {current, ttl}
      `;

      const result = (await redisPub.eval(
        luaScript,
        1,
        key,
        windowSeconds.toString()
      )) as [number, number];

      if (result && Array.isArray(result)) {
        const count = Number(result[0]);
        let ttl = Number(result[1]);
        if (ttl < 0) ttl = windowSeconds;

        const success = count <= limit;
        const remaining = Math.max(0, limit - count);
        const retryAfter = success ? undefined : Math.max(1, ttl);
        const reset = Math.floor(Date.now() / 1000) + ttl;

        return {
          success,
          limit,
          remaining,
          reset,
          retryAfter,
        };
      }
    } catch (err) {
      console.warn('[RateLimiter] Redis rate limiter failed, falling back to in-memory store:', err);
    }
  }

  // In-memory fallback
  const record = memoryStore.get(key);
  if (!record || record.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.floor(resetAt / 1000),
    };
  }

  record.count += 1;
  const ttlSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  const success = record.count <= limit;
  const remaining = Math.max(0, limit - record.count);

  return {
    success,
    limit,
    remaining,
    reset: Math.floor(record.resetAt / 1000),
    retryAfter: success ? undefined : ttlSeconds,
  };
}

/**
 * Creates a standard HTTP 429 Too Many Requests response with Retry-After header.
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  message = 'Trop de requêtes. Veuillez réessayer ultérieurement.'
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter || 60),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
      },
    }
  );
}
