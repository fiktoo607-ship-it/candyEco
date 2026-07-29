import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

let pubClient: Redis | null = null;
let subClient: Redis | null = null;

if (redisUrl) {
  try {
    pubClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    });
    subClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    });

    pubClient.on('error', (err) => {
      console.warn('[Redis Pub] Connection error:', err.message);
    });
    subClient.on('error', (err) => {
      console.warn('[Redis Sub] Connection error:', err.message);
    });
  } catch (error) {
    console.error('[Redis] Failed to initialize Redis clients:', error);
  }
}

export const redisPub = pubClient;
export const redisSub = subClient;
