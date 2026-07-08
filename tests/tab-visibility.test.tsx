// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import TabVisibilityNotifier from '@/components/TabVisibilityNotifier';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('Tab Visibility Notification System (Client Component)', () => {
  let mockNotificationConstructor: any;
  let mockAudioPlay: any;
  let mockRequestPermission: any;
  let mockUnregister: any;
  let mockGetRegistrations: any;
  let eventListeners: { [key: string]: EventListenerOrEventListenerObject[] } = {};
  let audioInstances: any[] = [];
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
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
    class MockAudio {
      src: string;
      constructor(src: string) {
        this.src = src;
        audioInstances.push(this);
      }
      play() {
        return mockAudioPlay();
      }
    }
    vi.stubGlobal('Audio', MockAudio);

    // Mock navigator.serviceWorker and getRegistrations
    mockUnregister = vi.fn().mockResolvedValue(true);
    mockGetRegistrations = vi.fn().mockResolvedValue([
      {
        scope: 'http://localhost:3000/',
        unregister: mockUnregister
      }
    ]);

    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistrations: mockGetRegistrations
      }
    });

    // Create DOM container for rendering
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root && container) {
      act(() => {
        root!.unmount();
      });
      document.body.removeChild(container);
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should request permission and force-unregister service workers on mount', async () => {
    await act(async () => {
      root!.render(<TabVisibilityNotifier />);
    });

    // Check SW unregistration called
    expect(mockGetRegistrations).toHaveBeenCalled();
    // Wait for the registrations promise microtask to run
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockUnregister).toHaveBeenCalled();

    // Check Notification permission requested
    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('should play sound and show desktop notification when tab switches to hidden and permission is granted', async () => {
    (global.Notification as any).permission = 'granted';
    
    await act(async () => {
      root!.render(<TabVisibilityNotifier />);
    });

    // Mock document.visibilityState
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

    // Trigger visibilitychange event
    const handlers = eventListeners['visibilitychange'] || [];
    expect(handlers.length).toBe(1);
    
    const handler = handlers[0];
    if (typeof handler === 'function') {
      await act(async () => {
        handler(new Event('visibilitychange'));
      });
    }

    // Verify Audio play called
    expect(audioInstances.length).toBe(1);
    expect(audioInstances[0].src).toBe('/notification.mp3');
    expect(mockAudioPlay).toHaveBeenCalled();

    // Verify Desktop Notification triggered via standard constructor
    expect(mockNotificationConstructor).toHaveBeenCalledWith('Revenez vite ! 🍰', expect.objectContaining({
      body: 'Ne manquez pas vos gourmandises préférées sur Délices d\'Eva !',
      icon: '/logo.jpeg',
      tag: 'tab-away'
    }));
  });

  it('should not show notification if tab switches to hidden but permission is denied', async () => {
    (global.Notification as any).permission = 'denied';
    
    await act(async () => {
      root!.render(<TabVisibilityNotifier />);
    });

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

    const handlers = eventListeners['visibilitychange'] || [];
    const handler = handlers[0];
    if (typeof handler === 'function') {
      await act(async () => {
        handler(new Event('visibilitychange'));
      });
    }

    // Sound should still play
    expect(mockAudioPlay).toHaveBeenCalled();

    // Notification should NOT trigger
    expect(mockNotificationConstructor).not.toHaveBeenCalled();
  });

  it('should not trigger sound or notification when tab switches to visible', async () => {
    (global.Notification as any).permission = 'granted';
    
    await act(async () => {
      root!.render(<TabVisibilityNotifier />);
    });

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');

    const handlers = eventListeners['visibilitychange'] || [];
    const handler = handlers[0];
    if (typeof handler === 'function') {
      await act(async () => {
        handler(new Event('visibilitychange'));
      });
    }

    expect(mockAudioPlay).not.toHaveBeenCalled();
    expect(mockNotificationConstructor).not.toHaveBeenCalled();
  });

  it('should handle audio playback rejection gracefully (autoplay policy restriction)', async () => {
    (global.Notification as any).permission = 'granted';
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Force play to reject with NotAllowedError
    mockAudioPlay.mockRejectedValue(new DOMException('NotAllowedError', 'NotAllowedError'));

    await act(async () => {
      root!.render(<TabVisibilityNotifier />);
    });

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

    const handlers = eventListeners['visibilitychange'] || [];
    const handler = handlers[0];
    if (typeof handler === 'function') {
      await act(async () => {
        handler(new Event('visibilitychange'));
      });
    }

    // Check play was called
    expect(mockAudioPlay).toHaveBeenCalled();
    // Wait for the rejection promise to resolve
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check that the error was caught and logged
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('autoplay policy'));
    consoleSpy.mockRestore();
  });

  it('should clean up the event listener on unmount', async () => {
    await act(async () => {
      root!.render(<TabVisibilityNotifier />);
    });

    expect(eventListeners['visibilitychange']?.length).toBe(1);

    await act(async () => {
      root!.unmount();
      root = null;
    });

    expect(eventListeners['visibilitychange']?.length).toBe(0);
  });
});
