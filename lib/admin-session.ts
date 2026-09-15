import { redisPub } from './redis';
import { DeviceInfo, LocationInfo, parseDeviceInfo, extractLocationInfo } from './device-geo';

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
const ADMIN_SESSIONS_KEY = 'admin:active_sessions';
const SESSION_TTL_SECONDS = 180; // 3 minutes timeout if inactive

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
          // Update Redis if some expired
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
async function saveActiveAdminSessions(sessions: ActiveAdminSession[]): Promise<void> {
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
 * If userId is given, returns that user's session; otherwise returns the first active session.
 */
export async function getActiveAdminSession(userId?: string): Promise<ActiveAdminSession | null> {
  const sessions = await getActiveAdminSessions();
  if (userId) {
    return sessions.find((s) => s.userId === userId) || null;
  }
  return sessions[0] || null;
}

export interface AcquireAdminLockOptions {
  deviceId?: string;
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  userAgent?: string | null;
  headers?: Headers | Record<string, string | string[] | undefined>;
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
 */
export async function acquireAdminLock(
  userId: string,
  options?: AcquireAdminLockOptions
): Promise<AcquireAdminLockResult> {
  const activeSessions = await getActiveAdminSessions();
  const normalizedDeviceId = options?.deviceId?.trim() || 'default_device';

  // Check if this user already has an active session
  const existingUserSession = activeSessions.find((s) => s.userId === userId);

  if (existingUserSession) {
    // If deviceId differs, prevent login on second device
    if (
      existingUserSession.deviceId &&
      normalizedDeviceId &&
      existingUserSession.deviceId !== normalizedDeviceId &&
      normalizedDeviceId !== 'default_device' &&
      existingUserSession.deviceId !== 'default_device'
    ) {
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
    if (options?.userAgent) existingUserSession.deviceInfo = parseDeviceInfo(options.userAgent);
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
    sessionId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}_${Math.random()}`,
    deviceId: normalizedDeviceId,
    userId,
    userName: options?.userName ?? null,
    userEmail: options?.userEmail ?? null,
    userPhone: options?.userPhone ?? null,
    deviceInfo: parseDeviceInfo(options?.userAgent),
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
}

/**
 * Refreshes an active session for the specified user and device.
 */
export async function refreshAdminLock(userId: string, deviceId?: string): Promise<boolean> {
  const activeSessions = await getActiveAdminSessions();
  const session = activeSessions.find(
    (s) => s.userId === userId && (!deviceId || s.deviceId === 'default_device' || s.deviceId === deviceId)
  );

  if (!session) {
    return false;
  }

  session.lastSeenAt = Date.now();
  await saveActiveAdminSessions(activeSessions);
  return true;
}

/**
 * Releases the session for the given user and device (or all for user if no deviceId).
 */
export async function releaseAdminLock(userId?: string, deviceId?: string): Promise<void> {
  let activeSessions = await getActiveAdminSessions();

  if (userId) {
    activeSessions = activeSessions.filter((s) => {
      if (s.userId !== userId) return true;
      if (deviceId && s.deviceId !== deviceId && s.deviceId !== 'default_device') {
        return true; // Keep session on other device
      }
      return false; // Remove this session
    });
  } else {
    activeSessions = [];
  }

  await saveActiveAdminSessions(activeSessions);
}

// Utility function for tests to clear state
export function _resetInMemoryAdminSession(): void {
  setInMemorySessions([]);
}
