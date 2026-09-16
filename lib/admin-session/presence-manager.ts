import { redisPub } from '../redis';

const inMemoryAdminPresence = new Map<string, number>();

export async function setAdminTabActive(userId: string, isVisible: boolean): Promise<void> {
  const key = `admin:active_tab:${userId}`;

  if (isVisible) {
    const expiresAt = Date.now() + 30000; // 30 seconds TTL
    if (redisPub) {
      try {
        if (redisPub.status === 'wait') {
          await redisPub.connect().catch(() => {});
        }
        await redisPub.set(key, 'visible', 'EX', 30);
      } catch (err) {
        console.error('[Presence] Redis set failed, falling back to memory:', err);
        inMemoryAdminPresence.set(userId, expiresAt);
      }
    } else {
      inMemoryAdminPresence.set(userId, expiresAt);
    }
  } else {
    if (redisPub) {
      try {
        if (redisPub.status === 'wait') {
          await redisPub.connect().catch(() => {});
        }
        await redisPub.del(key);
      } catch (err) {
        console.error('[Presence] Redis del failed:', err);
        inMemoryAdminPresence.delete(userId);
      }
    } else {
      inMemoryAdminPresence.delete(userId);
    }
  }
}

export async function hasActiveAdminTab(): Promise<boolean> {
  if (redisPub) {
    try {
      if (redisPub.status === 'wait') {
        await redisPub.connect().catch(() => {});
      }
      const keys = await redisPub.keys('admin:active_tab:*');
      if (keys.length > 0) {
        return true;
      }
    } catch (err) {
      console.error('[Presence] Redis keys failed, falling back to memory:', err);
    }
  }

  const now = Date.now();
  for (const [userId, expiresAt] of inMemoryAdminPresence.entries()) {
    if (expiresAt > now) {
      return true;
    } else {
      inMemoryAdminPresence.delete(userId);
    }
  }

  return false;
}
