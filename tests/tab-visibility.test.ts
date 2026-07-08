// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initTabVisibilityNotifier } from '@/lib/tab-visibility';

describe('Tab Visibility Notification System', () => {
  let mockNotificationConstructor: any;
  let mockAudioPlay: any;
  let mockRequestPermission: any;
  let eventListeners: { [key: string]: EventListenerOrEventListenerObject[] } = {};

  let audioInstances: any[] = [];

  let mockShowNotification: any;

  beforeEach(() => {
    // Reset event listeners registry
    eventListeners = {};
    audioInstances = [];

    // Spy on document addEventListener/removeEventListener
    vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(handler);
    });

    vi.spyOn(document, 'removeEventListener').mockImplementation((event, handler) => {
      if (eventListeners[event]) {
        eventListeners[event] = eventListeners[event].filter(h => h !== handler);
      }
    });

    // Mock HTML5 Notification API
    mockRequestPermission = vi.fn().mockResolvedValue('granted');
    mockNotificationConstructor = vi.fn();
    
    vi.stubGlobal('Notification', Object.assign(mockNotificationConstructor, {
      permission: 'default',
      requestPermission: mockRequestPermission
    }));

    // Mock HTML5 Audio API
    mockAudioPlay = vi.fn().mockResolvedValue(undefined);
    const playSpy = mockAudioPlay;
    class MockAudio {
      src: string;
      constructor(src: string) {
        this.src = src;
        audioInstances.push(this);
      }
      play() {
        return playSpy();
      }
    }
    vi.stubGlobal('Audio', MockAudio);

    // Mock navigator.serviceWorker
    mockShowNotification = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      serviceWorker: {
        register: vi.fn().mockResolvedValue({}),
        ready: Promise.resolve({
          showNotification: mockShowNotification
        })
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should request permission on click gesture if permission is default', () => {
    const cleanup = initTabVisibilityNotifier();
    
    // Check click handler is registered
    const clickHandlers = eventListeners['click'] || [];
    expect(clickHandlers.length).toBe(1);

    // Trigger click gesture
    const clickHandler = clickHandlers[0];
    if (typeof clickHandler === 'function') {
      clickHandler(new Event('click'));
    }

    expect(mockRequestPermission).toHaveBeenCalled();
    cleanup();
  });

  it('should not request permission or register click handler if permission is not default', () => {
    (global.Notification as any).permission = 'granted';
    const cleanup = initTabVisibilityNotifier();
    
    const clickHandlers = eventListeners['click'] || [];
    expect(clickHandlers.length).toBe(0);
    expect(mockRequestPermission).not.toHaveBeenCalled();
    
    cleanup();
  });

  it('should play sound and show desktop notification when tab switches to hidden and permission is granted', async () => {
    (global.Notification as any).permission = 'granted';
    const cleanup = initTabVisibilityNotifier();

    // Mock document.visibilityState
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

    // Trigger visibilitychange event
    const handlers = eventListeners['visibilitychange'] || [];
    expect(handlers.length).toBe(1);
    
    // Call handler
    const handler = handlers[0];
    if (typeof handler === 'function') {
      handler(new Event('visibilitychange'));
    }

    // Verify Audio play called
    expect(audioInstances.length).toBe(1);
    expect(audioInstances[0].src).toBe('/notification.mp3');
    expect(mockAudioPlay).toHaveBeenCalled();

    // Wait for promise resolution (serviceWorker.ready)
    await new Promise(resolve => setTimeout(resolve, 0));

    // Verify Desktop Notification triggered via service worker
    expect(mockShowNotification).toHaveBeenCalledWith('Revenez vite ! 🍰', expect.objectContaining({
      body: expect.any(String),
      icon: '/logo.jpeg',
      tag: 'tab-away'
    }));

    cleanup();
  });

  it('should not show notification if tab switches to hidden but permission is denied', async () => {
    (global.Notification as any).permission = 'denied';
    const cleanup = initTabVisibilityNotifier();

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

    const handlers = eventListeners['visibilitychange'] || [];
    const handler = handlers[0];
    if (typeof handler === 'function') {
      handler(new Event('visibilitychange'));
    }

    // Sound should still play
    expect(mockAudioPlay).toHaveBeenCalled();

    // Wait for promise resolution
    await new Promise(resolve => setTimeout(resolve, 0));

    // Notification should NOT trigger
    expect(mockShowNotification).not.toHaveBeenCalled();
    expect(mockNotificationConstructor).not.toHaveBeenCalled();

    cleanup();
  });

  it('should not trigger sound or notification when tab switches to visible', async () => {
    (global.Notification as any).permission = 'granted';
    const cleanup = initTabVisibilityNotifier();

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');

    const handlers = eventListeners['visibilitychange'] || [];
    const handler = handlers[0];
    if (typeof handler === 'function') {
      handler(new Event('visibilitychange'));
    }

    expect(mockAudioPlay).not.toHaveBeenCalled();
    
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockShowNotification).not.toHaveBeenCalled();
    expect(mockNotificationConstructor).not.toHaveBeenCalled();

    cleanup();
  });

  it('should clean up the event listener on cleanup call', () => {
    const cleanup = initTabVisibilityNotifier();
    expect(eventListeners['visibilitychange']?.length).toBe(1);

    cleanup();
    expect(eventListeners['visibilitychange']?.length).toBe(0);
  });
});
