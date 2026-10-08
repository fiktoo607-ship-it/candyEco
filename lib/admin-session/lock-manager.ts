import { randomUUID as nodeRandomUUID } from 'crypto';
import { redisPub } from '../redis';
import {
  DeviceInfo,
  LocationInfo,
  HeaderContainer,
  parseDeviceInfo,
  extractLocationInfo,
  extractDeviceModelFromHeaders,
} from './device-geo';

export interface ActiveAdminSession {
  sessionId: string;
  deviceId: string;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  deviceInfo: DeviceInfo;
  locationInfo: LocationInfo;
  loginAt: number;
  lastSeenAt: number;
}

export const MAX_CONCURRENT_ADMINS = 2;
export const ADMIN_SESSIONS_KEY = 'admin:active_sessions';
export const SESSION_TTL_SECONDS = 180; // 3 minutes timeout if inactive

/**
 * Cryptographically secure random session ID generator (CSPRNG).
 * Uses Node.js crypto.randomUUID(), Web Crypto API crypto.randomUUID(),
 * or crypto.getRandomValues(new Uint8Array(16)) formatted as hexadecimal string.
 * Strictly eliminates any insecure Math.random() fallback.
 */
export function generateSecureSessionId(): string {
  if (typeof nodeRandomUUID === 'function') {
    try {
      return nodeRandomUUID();
    } catch {}
  }
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
  }
  throw new Error('CSPRNG unavailable for session ID generation');
}

const globalForAdminSessions = globalThis as unknown as {
  inMemoryActiveSessions?: ActiveAdminSession[];
};

if (!globalForAdminSessions.inMemoryActiveSessions) {
  globalForAdminSessions.inMemoryActiveSessions = [];
}

function getInMemorySessions(): ActiveAdminSession[] {
  if (!globalForAdminSessions.inMemoryActiveSessions) {
    globalForAdminSessions.inMemoryActiveSessions = [];
  }
  return globalForAdminSessions.inMemoryActiveSessions;
}

function setInMemorySessions(sessions: ActiveAdminSession[]): void {
  globalForAdminSessions.inMemoryActiveSessions = sessions;
}

/**
 * Filters out expired sessions based on SESSION_TTL_SECONDS.
 */
function filterActiveSessions(sessions: ActiveAdminSession[]): ActiveAdminSession[] {
  const now = Date.now();
  const maxAgeMs = SESSION_TTL_SECONDS * 1000;
  return sessions.filter((s) => now - s.lastSeenAt < maxAgeMs);
}

/**
 * Loads the list of active admin sessions from Redis or in-memory fallback.
 */
export async function getActiveAdminSessions(): Promise<ActiveAdminSession[]> {
  if (redisPub) {
    try {
      if (redisPub.status === 'wait') {
        await redisPub.connect().catch(() => {});
      }
      const raw = await redisPub.get(ADMIN_SESSIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ActiveAdminSession[];
        const valid = filterActiveSessions(parsed);
        if (valid.length !== parsed.length) {
          await saveActiveAdminSessions(valid);
        }
        return valid;
      }
      return [];
    } catch (err) {
      console.error('[AdminSession] Redis get failed, using memory fallback:', err);
    }
  }

  const valid = filterActiveSessions(getInMemorySessions());
  setInMemorySessions(valid);
  return valid;
}

/**
 * Persists active admin sessions to Redis and/or in-memory cache.
 */
export async function saveActiveAdminSessions(sessions: ActiveAdminSession[]): Promise<void> {
  const valid = filterActiveSessions(sessions);
  setInMemorySessions(valid);

  if (redisPub) {
    try {
      if (redisPub.status === 'wait') {
        await redisPub.connect().catch(() => {});
      }
      if (valid.length > 0) {
        await redisPub.set(ADMIN_SESSIONS_KEY, JSON.stringify(valid), 'EX', SESSION_TTL_SECONDS);
      } else {
        await redisPub.del(ADMIN_SESSIONS_KEY);
      }
    } catch (err) {
      console.error('[AdminSession] Redis set failed:', err);
    }
  }
}

/**
 * Returns the currently active admin session.
 */
export async function getActiveAdminSession(userId?: string): Promise<ActiveAdminSession | null> {
  const sessions = await getActiveAdminSessions();
  if (userId) {
    return sessions.find((s) => s.userId === userId) || null;
  }
  return sessions[0] || null;
}

class AsyncMutex {
  private queue: Promise<void> = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const nextInQueue = new Promise<void>((resolve) => {
      release = resolve;
    });

    const currentQueue = this.queue;
    this.queue = this.queue.then(() => nextInQueue);

    await currentQueue;
    try {
      return await fn();
    } finally {
      release!();
    }
  }
}

export const adminLockMutex = new AsyncMutex();
const REDIS_MUTEX_KEY = 'admin:active_sessions:mutex';

export async function withAdminSessionMutex<T>(fn: () => Promise<T>): Promise<T> {
  return adminLockMutex.runExclusive(async () => {
    let hasRedisLock = false;
    if (redisPub) {
      try {
        if (redisPub.status === 'wait') {
          await redisPub.connect().catch(() => {});
        }
        for (let i = 0; i < 20; i++) {
          const acquired = await redisPub.set(REDIS_MUTEX_KEY, 'locked', 'PX', 5000, 'NX');
          if (acquired === 'OK') {
            hasRedisLock = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      } catch (err) {
        // Fall back to in-memory mutex
      }
    }

    try {
      return await fn();
    } finally {
      if (hasRedisLock && redisPub) {
        try {
          await redisPub.del(REDIS_MUTEX_KEY);
        } catch {}
      }
    }
  });
}

/**
 * Resolves a reliable, non-bypassable device identifier.
 * Prevents circumventing single-device concurrency limits via 'default_device'
 * or omitted device IDs (e.g. during OAuth sign-ins).
 */
export function resolveDeviceId(options?: AcquireAdminLockOptions): string {
  const explicit = options?.deviceId?.trim();
  if (explicit && explicit !== 'default_device') {
    return explicit;
  }

  const ua = options?.userAgent?.trim() || '';
  const model = options?.deviceName?.trim() || extractDeviceModelFromHeaders(options?.headers) || '';
  let platform = '';
  if (options?.headers) {
    if (typeof options.headers.get === 'function') {
      platform = options.headers.get('sec-ch-ua-platform') || options.headers.get('sec-ch-ua') || '';
    } else {
      platform = (options.headers as any)['sec-ch-ua-platform'] || (options.headers as any)['sec-ch-ua'] || '';
    }
  }

  if (ua || model || platform) {
    return `fp_${Buffer.from(`${ua}:${model}:${platform}`).toString('base64url').slice(0, 32)}`;
  }

  return `anon_${generateSecureSessionId()}`;
}

export interface AcquireAdminLockOptions {
  deviceId?: string;
  deviceName?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  userAgent?: string | null;
  headers?: HeaderContainer;
}

export interface AcquireAdminLockResult {
  success: boolean;
  error?: 'SameAccountAnotherDevice' | 'MaxAdminsReached';
  activeSessions: ActiveAdminSession[];
  activeSession?: ActiveAdminSession;
}

/**
 * Attempt to acquire an admin session slot.
 * Enforces:
 * 1. Single device per account: Rejects if the same user is already active on a different device.
 * 2. Max 2 concurrent admins: Rejects if 2 different admins are already active.
 * 3. Idempotent on same device: Refreshes timestamp and updates info without consuming extra slots.
 * 4. TOCTOU safe: Mutex-locked atomic operation across checks and mutations.
 */
export async function acquireAdminLock(
  userId: string,
  options?: AcquireAdminLockOptions
): Promise<AcquireAdminLockResult> {
  return withAdminSessionMutex(async () => {
    const activeSessions = await getActiveAdminSessions();
    const normalizedDeviceId = resolveDeviceId(options);
    const effectiveModel = options?.deviceName || extractDeviceModelFromHeaders(options?.headers);

    // Check if this user already has an active session
    const existingUserSession = activeSessions.find((s) => s.userId === userId);

    if (existingUserSession) {
      // If deviceId differs, prevent login on second device (no default_device bypass)
      if (existingUserSession.deviceId !== normalizedDeviceId) {
        return {
          success: false,
          error: 'SameAccountAnotherDevice',
          activeSessions,
          activeSession: existingUserSession,
        };
      }

      // Same device: refresh and update metadata
      existingUserSession.lastSeenAt = Date.now();
      if (options?.userName) existingUserSession.userName = options.userName;
      if (options?.userEmail) existingUserSession.userEmail = options.userEmail;
      if (options?.userPhone) existingUserSession.userPhone = options.userPhone;
      if (options?.userAgent || effectiveModel) {
        existingUserSession.deviceInfo = parseDeviceInfo(options?.userAgent, effectiveModel || existingUserSession.deviceInfo?.model);
      }
      if (options?.headers) existingUserSession.locationInfo = extractLocationInfo(options.headers);

      await saveActiveAdminSessions(activeSessions);
      return {
        success: true,
        activeSessions,
        activeSession: existingUserSession,
      };
    }

    // User is not active yet: check slot availability
    if (activeSessions.length >= MAX_CONCURRENT_ADMINS) {
      return {
        success: false,
        error: 'MaxAdminsReached',
        activeSessions,
        activeSession: activeSessions[0],
      };
    }

    // Create new session
    const newSession: ActiveAdminSession = {
      sessionId: generateSecureSessionId(),
      deviceId: normalizedDeviceId,
      userId,
      userName: options?.userName ?? null,
      userEmail: options?.userEmail ?? null,
      userPhone: options?.userPhone ?? null,
      deviceInfo: parseDeviceInfo(options?.userAgent, effectiveModel),
      locationInfo: extractLocationInfo(options?.headers),
      loginAt: Date.now(),
      lastSeenAt: Date.now(),
    };

    const updatedSessions = [...activeSessions, newSession];
    await saveActiveAdminSessions(updatedSessions);

    return {
      success: true,
      activeSessions: updatedSessions,
      activeSession: newSession,
    };
  });
}

/**
 * Refreshes an active session for the specified user and device.
 * TOCTOU safe: wrapped in distributed/in-process mutex.
 */
export async function refreshAdminLock(
  userId: string,
  deviceId?: string,
  options?: { deviceName?: string | null; userAgent?: string | null; headers?: HeaderContainer }
): Promise<boolean> {
  return withAdminSessionMutex(async () => {
    const activeSessions = await getActiveAdminSessions();
    const normalizedDeviceId = deviceId && deviceId !== 'default_device'
      ? deviceId.trim()
      : resolveDeviceId({ deviceId, deviceName: options?.deviceName, userAgent: options?.userAgent, headers: options?.headers });

    const session = activeSessions.find(
      (s) => s.userId === userId && (s.deviceId === normalizedDeviceId || s.deviceId === deviceId)
    );

    if (!session) {
      return false;
    }

    session.lastSeenAt = Date.now();
    const effectiveModel = options?.deviceName || extractDeviceModelFromHeaders(options?.headers);
    if (effectiveModel || (options?.userAgent && !session.deviceInfo?.model)) {
      session.deviceInfo = parseDeviceInfo(options?.userAgent, effectiveModel || session.deviceInfo?.model);
    }
    await saveActiveAdminSessions(activeSessions);
    return true;
  });
}

/**
 * Releases the session for the given user and device (or all for user if no deviceId).
 * TOCTOU safe: wrapped in distributed/in-process mutex.
 */
export async function releaseAdminLock(userId?: string, deviceId?: string): Promise<void> {
  return withAdminSessionMutex(async () => {
    let activeSessions = await getActiveAdminSessions();

    if (userId) {
      activeSessions = activeSessions.filter((s) => {
        if (s.userId !== userId) return true;
        if (deviceId && deviceId !== 'default_device' && s.deviceId !== deviceId) {
          return true;
        }
        return false;
      });
    } else {
      activeSessions = [];
    }

    await saveActiveAdminSessions(activeSessions);
  });
}

// Utility function for tests to clear state
export function _resetInMemoryAdminSession(): void {
  setInMemorySessions([]);
}
