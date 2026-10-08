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
 * Extracts a trustworthy client IP address from request.
 * Prioritizes request.ip and parses the rightmost trusted proxy hop from X-Forwarded-For
 * to prevent client header spoofing attacks (Issue #7).
 */
export function getClientIp(request: Request | NextRequest): string {
  if (!request) return '127.0.0.1';

  // 1. Prefer direct request.ip from Next.js runtime when present
  if (typeof (request as any).ip === 'string' && (request as any).ip.trim()) {
    return (request as any).ip.trim();
  }

  if (!request.headers) return '127.0.0.1';

  // 2. Parse X-Forwarded-For: parse only the rightmost trusted proxy hop
  // Prevents attackers from spoofing arbitrary IPs at the beginning of the list
  let forwarded: string | null = null;
  if (typeof request.headers.get === 'function') {
    forwarded = request.headers.get('x-forwarded-for');
  } else if ((request.headers as any)['x-forwarded-for']) {
    forwarded = String((request.headers as any)['x-forwarded-for']);
  }

  if (forwarded) {
    const hops = forwarded.split(',').map((h) => h.trim()).filter(Boolean);
    if (hops.length > 0) {
      const rightmost = hops[hops.length - 1];
      if (rightmost) return rightmost;
    }
  }

  // 3. Fallback to X-Real-IP if provided by reverse proxy
  let realIp: string | null = null;
  if (typeof request.headers.get === 'function') {
    realIp = request.headers.get('x-real-ip');
  } else if ((request.headers as any)['x-real-ip']) {
    realIp = String((request.headers as any)['x-real-ip']);
  }
  if (realIp && realIp.trim()) return realIp.trim();

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
