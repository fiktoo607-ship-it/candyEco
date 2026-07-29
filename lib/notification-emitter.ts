import { EventEmitter } from 'events';
import { redisPub, redisSub } from './redis';

const CHANNEL_NEW_ORDER = 'candyeco:notifications:new-order';

class NotificationEmitter extends EventEmitter {
  private isSubscribed = false;

  constructor() {
    super();
    this.setupRedisSub();
  }

  private async setupRedisSub() {
    if (!redisSub || this.isSubscribed) return;
    try {
      this.isSubscribed = true;
      if (redisSub.status === 'wait') {
        await redisSub.connect().catch((err) => {
          console.warn('[Redis Sub] Connection deferred:', err.message);
        });
      }
      await redisSub.subscribe(CHANNEL_NEW_ORDER);

      redisSub.on('message', (channel, message) => {
        if (channel === CHANNEL_NEW_ORDER) {
          try {
            const notification = JSON.parse(message);
            super.emit('new-order', notification);
          } catch (err) {
            console.error('[NotificationEmitter] Failed to parse Redis message:', err);
          }
        }
      });
    } catch (err: any) {
      console.warn('[NotificationEmitter] Redis Pub/Sub subscription error:', err.message);
      this.isSubscribed = false;
    }
  }

  emit(event: string | symbol, ...args: any[]): boolean {
    if (event === 'new-order' && redisPub) {
      const payload = args[0];
      try {
        if (redisPub.status === 'wait') {
          redisPub.connect().catch(() => {});
        }
        redisPub.publish(CHANNEL_NEW_ORDER, JSON.stringify(payload)).catch((err) => {
          console.error('[NotificationEmitter] Redis publish error, falling back to local emit:', err);
          super.emit(event, ...args);
        });
        return true;
      } catch (err) {
        console.error('[NotificationEmitter] Redis publish exception:', err);
        return super.emit(event, ...args);
      }
    }
    return super.emit(event, ...args);
  }
}

const globalForEmitter = globalThis as unknown as {
  notificationEmitter?: NotificationEmitter;
};

export const notificationEmitter =
  globalForEmitter.notificationEmitter || new NotificationEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEmitter.notificationEmitter = notificationEmitter;
}
