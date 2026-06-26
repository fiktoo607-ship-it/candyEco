import { EventEmitter } from 'events';

const globalForEmitter = globalThis as unknown as {
  notificationEmitter?: EventEmitter;
};

export const notificationEmitter =
  globalForEmitter.notificationEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForEmitter.notificationEmitter = notificationEmitter;
}
