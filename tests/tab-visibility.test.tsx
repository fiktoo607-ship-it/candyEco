// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import TabVisibilityNotifier from '@/components/TabVisibilityNotifier';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('Tab Visibility Notification System (Client Component - Issue #141 Fix)', () => {
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

  it('unregisters legacy service workers on mount without requesting notification permissions (Issue #141)', async () => {
    await act(async () => {
      root!.render(<TabVisibilityNotifier />);
    });

    // Check SW unregistration called
    expect(mockGetRegistrations).toHaveBeenCalled();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(mockUnregister).toHaveBeenCalled();

    // Check Notification permission was NOT requested on mount
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it('does not request permission or attach intrusive click/keydown listeners on first touch', async () => {
    await act(async () => {
      root!.render(<TabVisibilityNotifier />);
    });

    // Ensure no click or keydown listeners were registered to request permission
    expect(eventListeners['click']?.length || 0).toBe(0);
    expect(eventListeners['keydown']?.length || 0).toBe(0);
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it('does not register visibilitychange listener to play sound or show notification on tab switch', async () => {
    await act(async () => {
      root!.render(<TabVisibilityNotifier />);
    });

    // Verify visibilitychange listener was NOT registered
    expect(eventListeners['visibilitychange']?.length || 0).toBe(0);

    // Audio and desktop notification should never be called
    expect(mockAudioPlay).not.toHaveBeenCalled();
    expect(mockNotificationConstructor).not.toHaveBeenCalled();
  });
});
