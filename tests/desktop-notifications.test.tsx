// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BPHTjZ8sucNYke7fVDjQMgGVs00eEI1Amoz9I3_HqAWWuHaaehCP7vU3lraagWGxWPnxO7taIKgssavdYgqY8o8';

import NotificationBell from '@/components/dashbord/NotificationBell';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock use-notifications hooks
const mockNotifications = [
  { id: 'notif-1', orderId: 'order-1', read: false, createdAt: new Date().toISOString(), order: { customerName: 'Alice', totalPrice: '10' } }
];
const mockInvalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

vi.mock('@/lib/hooks/use-notifications', () => ({
  useNotifications: () => ({
    data: mockNotifications,
    isLoading: false,
  }),
  useMarkNotifications: () => ({
    mutate: vi.fn(),
  }),
  useClearNotifications: () => ({
    mutate: vi.fn(),
  }),
}));

vi.mock('@/lib/dashboard-store', () => ({
  useDashboardStore: () => ({
    setActiveTab: vi.fn(),
    setOrderSearchQuery: vi.fn(),
    setOrderCurrentPage: vi.fn(),
  }),
}));

// Mock EventSource
let sseInstance: any = null;
class MockEventSource {
  onmessage: any;
  onerror: any;
  close = vi.fn();
  constructor(url: string) {
    sseInstance = this;
  }
}

// Mock Web Audio API
class MockAudioContext {
  currentTime = 0;
  createOscillator() {
    return {
      connect: vi.fn(),
      type: '',
      frequency: { setValueAtTime: vi.fn() },
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
  }
  destination = {};
}

describe('Desktop Notifications System', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;
  let mockNotificationConstructor: any;
  let mockRequestPermission: any;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    mockRequestPermission = vi.fn().mockResolvedValue('granted');
    mockNotificationConstructor = vi.fn();

    vi.stubGlobal('Notification', Object.assign(mockNotificationConstructor, {
      permission: 'default',
      requestPermission: mockRequestPermission,
    }));

    vi.stubGlobal('EventSource', MockEventSource);
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) }));
    vi.stubGlobal('PushManager', class MockPushManager {});
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistration: vi.fn().mockResolvedValue(null),
        register: vi.fn().mockResolvedValue({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(null),
            subscribe: vi.fn().mockResolvedValue({
              toJSON: () => ({ endpoint: 'https://example.com' }),
            }),
          },
        }),
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(null),
            subscribe: vi.fn().mockResolvedValue({
              toJSON: () => ({ endpoint: 'https://example.com' }),
            }),
          },
        }),
      },
      configurable: true,
      writable: true,
    });
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
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

  it('should request notification permission and update permission state when button is clicked', async () => {
    await act(async () => {
      root!.render(<NotificationBell />);
    });

    // Open the dropdown menu to reveal the button
    const bellBtn = container!.querySelector('button');
    expect(bellBtn).not.toBeNull();
    await act(async () => {
      bellBtn!.click();
    });

    // Check that the permission button is rendered
    const permBtn = Array.from(container!.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('Activer les notifications')
    );
    expect(permBtn).toBeDefined();

    // Click permission button
    await act(async () => {
      permBtn!.click();
    });

    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('should trigger browser Notification when SSE receives a message and permission is granted', async () => {
    (globalThis.Notification as any).permission = 'granted';

    await act(async () => {
      root!.render(<NotificationBell />);
    });

    expect(sseInstance).not.toBeNull();

    // Simulate SSE message
    await act(async () => {
      sseInstance.onmessage({
        data: JSON.stringify({
          id: 'notif-2',
          orderId: 'order-2',
          order: {
            customerName: 'Jean Dupont',
            totalPrice: '25.00',
          },
        }),
      });
    });

    expect(mockNotificationConstructor).toHaveBeenCalledWith(
      'Nouvelle commande reçue ! 🍰',
      expect.objectContaining({
        body: 'Jean Dupont a passé une commande de 25.00 €.',
        icon: '/logo.jpeg',
        tag: 'order-notif-2',
      })
    );
  });

  it('should NOT trigger browser Notification when SSE receives a message but permission is default or denied', async () => {
    (globalThis.Notification as any).permission = 'default';

    await act(async () => {
      root!.render(<NotificationBell />);
    });

    // Simulate SSE message
    await act(async () => {
      sseInstance.onmessage({
        data: JSON.stringify({
          id: 'notif-3',
          orderId: 'order-3',
          order: {
            customerName: 'Jean Dupont',
            totalPrice: '25.00',
          },
        }),
      });
    });

    expect(mockNotificationConstructor).not.toHaveBeenCalled();
  });
});
