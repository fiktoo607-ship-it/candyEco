import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { generateSecureDeviceId, getOrCreateAdminDeviceId } from '@/hooks/useAdminSession';

describe('Service Worker Notification Click Security & CSPRNG Device ID', () => {
  describe('Service Worker URL Sanitization (Issue #51)', () => {
    let swContext: any;
    let registeredListeners: { [key: string]: Function } = {};

    beforeEach(() => {
      registeredListeners = {};
      const swCode = fs.readFileSync(path.resolve(process.cwd(), 'public/sw.js'), 'utf8');

      swContext = {
        self: {
          location: {
            origin: 'https://candyeco-production.up.railway.app',
          },
          addEventListener: (event: string, handler: Function) => {
            registeredListeners[event] = handler;
          },
          registration: {
            showNotification: vi.fn(),
          },
          skipWaiting: vi.fn(),
          clients: {
            claim: vi.fn(),
          },
        },
        caches: {
          open: vi.fn().mockResolvedValue({ addAll: vi.fn(), put: vi.fn() }),
          keys: vi.fn().mockResolvedValue([]),
          match: vi.fn().mockResolvedValue(null),
        },
        clients: {
          matchAll: vi.fn(),
          openWindow: vi.fn(),
        },
        console: {
          log: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
        URL: globalThis.URL,
      };

      vm.createContext(swContext);
      vm.runInContext(swCode, swContext);
    });

    it('sanitizes javascript:alert(1) and redirects to safe default "/" on notification click', async () => {
      const notificationClickHandler = registeredListeners['notificationclick'];
      expect(notificationClickHandler).toBeDefined();

      const navigatedUrls: string[] = [];
      const openedUrls: string[] = [];

      swContext.clients.matchAll.mockResolvedValueOnce([
        {
          url: 'https://candyeco-production.up.railway.app/home',
          focus: vi.fn().mockResolvedValue(undefined),
          navigate: (url: string) => navigatedUrls.push(url),
        },
      ]);
      swContext.clients.openWindow.mockImplementation((url: string) => {
        openedUrls.push(url);
        return Promise.resolve(null);
      });

      const mockEvent = {
        notification: {
          close: vi.fn(),
          data: {
            url: 'javascript:alert(1)',
          },
        },
        waitUntil: vi.fn((promise) => promise),
      };

      await notificationClickHandler(mockEvent);

      expect(mockEvent.notification.close).toHaveBeenCalled();
      // Must NOT navigate to javascript:
      expect(navigatedUrls).toContain('/');
      expect(navigatedUrls).not.toContain('javascript:alert(1)');
    });

    it('sanitizes external open redirect URLs (e.g. https://attacker.com) and redirects to "/"', async () => {
      const notificationClickHandler = registeredListeners['notificationclick'];

      const navigatedUrls: string[] = [];
      swContext.clients.matchAll.mockResolvedValueOnce([
        {
          url: 'https://candyeco-production.up.railway.app/home',
          focus: vi.fn().mockResolvedValue(undefined),
          navigate: (url: string) => navigatedUrls.push(url),
        },
      ]);

      const mockEvent = {
        notification: {
          close: vi.fn(),
          data: {
            url: 'https://attacker.com/malicious-login',
          },
        },
        waitUntil: vi.fn((promise) => promise),
      };

      await notificationClickHandler(mockEvent);

      expect(navigatedUrls).toContain('/');
      expect(navigatedUrls).not.toContain('https://attacker.com/malicious-login');
    });

    it('sanitizes protocol-relative URLs (//evil.com) to "/"', async () => {
      const notificationClickHandler = registeredListeners['notificationclick'];

      const navigatedUrls: string[] = [];
      swContext.clients.matchAll.mockResolvedValueOnce([
        {
          url: 'https://candyeco-production.up.railway.app/home',
          focus: vi.fn().mockResolvedValue(undefined),
          navigate: (url: string) => navigatedUrls.push(url),
        },
      ]);

      const mockEvent = {
        notification: {
          close: vi.fn(),
          data: {
            url: '//evil.com/phish',
          },
        },
        waitUntil: vi.fn((promise) => promise),
      };

      await notificationClickHandler(mockEvent);

      expect(navigatedUrls).toContain('/');
    });

    it('preserves valid relative paths such as "/orders/123"', async () => {
      const notificationClickHandler = registeredListeners['notificationclick'];

      const navigatedUrls: string[] = [];
      swContext.clients.matchAll.mockResolvedValueOnce([
        {
          url: 'https://candyeco-production.up.railway.app/home',
          focus: vi.fn().mockResolvedValue(undefined),
          navigate: (url: string) => navigatedUrls.push(url),
        },
      ]);

      const mockEvent = {
        notification: {
          close: vi.fn(),
          data: {
            url: '/orders/123',
          },
        },
        waitUntil: vi.fn((promise) => promise),
      };

      await notificationClickHandler(mockEvent);

      expect(navigatedUrls).toContain('/orders/123');
    });

    it('opens a new window with "/" if no open window and URL is dangerous', async () => {
      const notificationClickHandler = registeredListeners['notificationclick'];

      const openedUrls: string[] = [];
      swContext.clients.matchAll.mockResolvedValueOnce([]); // no open window
      swContext.clients.openWindow = vi.fn().mockImplementation((url: string) => {
        openedUrls.push(url);
        return Promise.resolve(null);
      });

      const mockEvent = {
        notification: {
          close: vi.fn(),
          data: {
            url: 'data:text/html,<script>alert(1)</script>',
          },
        },
        waitUntil: vi.fn((promise) => promise),
      };

      await notificationClickHandler(mockEvent);

      expect(swContext.clients.openWindow).toHaveBeenCalledWith('/');
    });
  });

  describe('Device ID CSPRNG Generation (Issue #50)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('generates secure device ID without calling Math.random()', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random');
      const id = generateSecureDeviceId();

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThanOrEqual(16);
      expect(mathRandomSpy).not.toHaveBeenCalled();

      mathRandomSpy.mockRestore();
    });

    it('getOrCreateAdminDeviceId stores dev_ with CSPRNG id in localStorage without calling Math.random()', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random');
      const storage: { [key: string]: string } = {};

      const mockLocalStorage = {
        getItem: (k: string) => storage[k] || null,
        setItem: (k: string, v: string) => {
          storage[k] = v;
        },
      };

      vi.stubGlobal('window', {
        localStorage: mockLocalStorage,
      });
      vi.stubGlobal('localStorage', mockLocalStorage);

      const deviceId = getOrCreateAdminDeviceId();

      expect(deviceId.startsWith('dev_')).toBe(true);
      expect(storage['admin_device_id']).toBe(deviceId);
      expect(mathRandomSpy).not.toHaveBeenCalled();

      mathRandomSpy.mockRestore();
      vi.unstubAllGlobals();
    });
  });
});
