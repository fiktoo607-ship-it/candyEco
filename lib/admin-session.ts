import { redisPub } from './redis';

export interface ActiveAdminSession {
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  loginAt: number;
  lastSeenAt: number;
}

const ADMIN_SESSION_KEY = 'admin:active_session';
const SESSION_TTL_SECONDS = 180; // 3 minutes timeout if inactive or browser closed

let inMemoryActiveSession: { session: ActiveAdminSession; expiresAt: number } | null = null;

/**
 * Attempt to acquire the exclusive admin session lock.
 * Returns { success: true } if lock is granted to this user (or if this user already holds the lock).
 * Returns { success: false, activeSession } if another admin is currently active.
 */
export async function acquireAdminLock(
  userId: string,
  metadata?: { userName?: string | null; userEmail?: string | null }
): Promise<{ success: boolean; activeSession?: ActiveAdminSession }> {
  const currentSession = await getActiveAdminSession();
  
  if (currentSession && currentSession.userId !== userId) {
    return {
      success: false,
      activeSession: currentSession,
    };
  }

  const sessionData: ActiveAdminSession = {
    userId,
    userName: metadata?.userName ?? currentSession?.userName ?? null,
    userEmail: metadata?.userEmail ?? currentSession?.userEmail ?? null,
    loginAt: currentSession?.loginAt ?? Date.now(),
    lastSeenAt: Date.now(),
  };

  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;

  if (redisPub) {
    try {
      if (redisPub.status === 'wait') {
        await redisPub.connect().catch(() => {});
      }
      await redisPub.set(ADMIN_SESSION_KEY, JSON.stringify(sessionData), 'EX', SESSION_TTL_SECONDS);
    } catch (err) {
      console.error('[AdminSession] Redis acquire set failed, using memory fallback:', err);
      inMemoryActiveSession = { session: sessionData, expiresAt };
    }
  } else {
    inMemoryActiveSession = { session: sessionData, expiresAt };
  }

  return {
    success: true,
    activeSession: sessionData,
  };
}

/**
 * Extends the TTL and lastSeenAt timestamp of the active admin session if it belongs to userId.
 */
export async function refreshAdminLock(userId: string): Promise<boolean> {
  const currentSession = await getActiveAdminSession();
  if (!currentSession || currentSession.userId !== userId) {
    return false;
  }

  currentSession.lastSeenAt = Date.now();
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;

  if (redisPub) {
    try {
      if (redisPub.status === 'wait') {
        await redisPub.connect().catch(() => {});
      }
      await redisPub.set(ADMIN_SESSION_KEY, JSON.stringify(currentSession), 'EX', SESSION_TTL_SECONDS);
      return true;
    } catch (err) {
      console.error('[AdminSession] Redis refresh failed, using memory fallback:', err);
      inMemoryActiveSession = { session: currentSession, expiresAt };
      return true;
    }
  } else {
    inMemoryActiveSession = { session: currentSession, expiresAt };
    return true;
  }
}

/**
 * Releases the exclusive admin lock when the user logs out or closes the page.
 */
export async function releaseAdminLock(userId?: string): Promise<void> {
  if (userId) {
    const currentSession = await getActiveAdminSession();
    if (currentSession && currentSession.userId !== userId) {
      return; // Do not release if held by someone else
    }
  }

  if (redisPub) {
    try {
      if (redisPub.status === 'wait') {
        await redisPub.connect().catch(() => {});
      }
      await redisPub.del(ADMIN_SESSION_KEY);
    } catch (err) {
      console.error('[AdminSession] Redis release del failed:', err);
    }
  }

  inMemoryActiveSession = null;
}

/**
 * Returns the currently active admin session if one exists and has not expired.
 */
export async function getActiveAdminSession(): Promise<ActiveAdminSession | null> {
  if (redisPub) {
    try {
      if (redisPub.status === 'wait') {
        await redisPub.connect().catch(() => {});
      }
      const raw = await redisPub.get(ADMIN_SESSION_KEY);
      if (raw) {
        return JSON.parse(raw) as ActiveAdminSession;
      }
      return null;
    } catch (err) {
      console.error('[AdminSession] Redis get failed, using memory fallback:', err);
    }
  }

  if (inMemoryActiveSession) {
    if (Date.now() < inMemoryActiveSession.expiresAt) {
      return inMemoryActiveSession.session;
    }
    inMemoryActiveSession = null;
  }

  return null;
}

// Utility function for tests to clear state
export function _resetInMemoryAdminSession(): void {
  inMemoryActiveSession = null;
}
