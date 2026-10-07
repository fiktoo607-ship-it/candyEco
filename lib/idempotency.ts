/**
 * Idempotency manager for handling concurrent and duplicate requests.
 * Uses an in-memory sliding cache and in-flight promise locking to ensure
 * that identical requests in the same split second only execute once.
 */

export interface IdempotentResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
}

interface CacheEntry {
  response: IdempotentResponse;
  expiresAt: number;
}

const idempotencyCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<IdempotentResponse>>();

/**
 * Periodically purge expired cache entries
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of idempotencyCache.entries()) {
    if (entry.expiresAt <= now) {
      idempotencyCache.delete(key);
    }
  }
}

if (typeof setInterval !== 'undefined') {
  const interval = setInterval(cleanupExpiredEntries, 60000);
  if (interval.unref) {
    interval.unref();
  }
}

export function resetIdempotencyStore(): void {
  idempotencyCache.clear();
  inFlightRequests.clear();
}

/**
 * Executes an operation with idempotency protection.
 * If multiple requests with the same key arrive simultaneously, only one executes the operation
 * while the others await its completion and share the result.
 */
export async function withIdempotency(
  key: string,
  execute: () => Promise<IdempotentResponse>,
  ttlSeconds = 600
): Promise<IdempotentResponse> {
  const normalizedKey = key.trim();
  const now = Date.now();

  // 1. Return cached response if already completed
  const cached = idempotencyCache.get(normalizedKey);
  if (cached && cached.expiresAt > now) {
    return cached.response;
  }

  // 2. Await currently running execution if another request is in-flight
  const existingInFlight = inFlightRequests.get(normalizedKey);
  if (existingInFlight) {
    return await existingInFlight;
  }

  // 3. Execute and register in-flight promise
  const executionPromise = (async () => {
    try {
      const response = await execute();
      // Cache non-server-error responses
      if (response.status < 500) {
        idempotencyCache.set(normalizedKey, {
          response,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
      }
      return response;
    } finally {
      inFlightRequests.delete(normalizedKey);
    }
  })();

  inFlightRequests.set(normalizedKey, executionPromise);
  return await executionPromise;
}
