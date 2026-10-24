// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import PwaRegister from '@/components/PwaRegister';
import PwaInstallButton from '@/components/PwaInstallButton';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let mockPathname = '/home';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('PWA System Components', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;
  let originalNodeEnv: string | undefined;

  let mockRegister: any;
  let mockServiceWorkerEvents: { [key: string]: any } = {};
  let mockWindowEvents: { [key: string]: EventListenerOrEventListenerObject[] } = {};

  beforeEach(() => {
    mockPathname = '/home';
    originalNodeEnv = process.env.NODE_ENV;
    // Force NODE_ENV to production to trigger SW registration
    (process.env as any).NODE_ENV = 'production';

    mockServiceWorkerEvents = {};
    mockWindowEvents = {};

    // Mock navigator.serviceWorker
    mockRegister = vi.fn().mockResolvedValue({
      addEventListener: (event: string, handler: any) => {
        mockServiceWorkerEvents[event] = handler;
      },
      waiting: null,
    });

    vi.stubGlobal('navigator', {
      serviceWorker: {
        register: mockRegister,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        controller: {},
      },
    });

    // Spy on window.addEventListener/removeEventListener
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (!mockWindowEvents[event]) {
        mockWindowEvents[event] = [];
      }
      mockWindowEvents[event].push(handler);
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((event, handler) => {
      if (mockWindowEvents[event]) {
        mockWindowEvents[event] = mockWindowEvents[event].filter(h => h !== handler);
      }
    });

    // Create container
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
    // Restore NODE_ENV
    (process.env as any).NODE_ENV = originalNodeEnv;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('PwaRegister Component', () => {
    let mockNavigatorSwEvents: { [key: string]: Function[] } = {};
    let reloadMock: any;

    beforeEach(() => {
      mockNavigatorSwEvents = {};
      reloadMock = vi.fn();

      vi.stubGlobal('navigator', {
        serviceWorker: {
          register: mockRegister,
          addEventListener: vi.fn((event: string, handler: Function) => {
            if (!mockNavigatorSwEvents[event]) mockNavigatorSwEvents[event] = [];
            mockNavigatorSwEvents[event].push(handler);
          }),
          removeEventListener: vi.fn((event: string, handler: Function) => {
            if (mockNavigatorSwEvents[event]) {
              mockNavigatorSwEvents[event] = mockNavigatorSwEvents[event].filter(h => h !== handler);
            }
          }),
          controller: {},
        },
      });

      // Mock window.location.reload safely
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, reload: reloadMock } as any;
    });

    it('should register sw.js in production', async () => {
      await act(async () => {
        root!.render(<PwaRegister />);
      });

      expect(mockRegister).toHaveBeenCalledWith('/sw.js', { updateViaCache: 'none' });
    });

    it('should not register sw.js if not in production', async () => {
      (process.env as any).NODE_ENV = 'development';

      mockRegister.mockClear();

      await act(async () => {
        root!.render(<PwaRegister />);
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should not show the update toast on checkout /cart page', async () => {
      mockPathname = '/cart';
      
      // Simulate waiting worker exists
      mockRegister.mockResolvedValueOnce({
        addEventListener: vi.fn(),
        waiting: {
          postMessage: vi.fn(),
        },
      });

      await act(async () => {
        root!.render(<PwaRegister />);
      });

      // Verify the toast is not rendered
      expect(container!.innerHTML).toBe('');
    });

    it('does not trigger window.location.reload on controllerchange without user consent (Issue #142)', async () => {
      await act(async () => {
        root!.render(<PwaRegister />);
      });

      // Simulate background controllerchange event
      const controllerChangeHandlers = mockNavigatorSwEvents['controllerchange'] || [];
      expect(controllerChangeHandlers.length).toBe(1);

      await act(async () => {
        for (const handler of controllerChangeHandlers) {
          handler();
        }
      });

      // Unsolicited reload must NEVER happen
      expect(reloadMock).not.toHaveBeenCalled();
    });

    it('shows gentle update prompt when update is waiting and allows user to update or dismiss', async () => {
      mockPathname = '/home';
      const mockPostMessage = vi.fn();
      
      mockRegister.mockResolvedValueOnce({
        addEventListener: vi.fn(),
        waiting: {
          postMessage: mockPostMessage,
        },
      });

      await act(async () => {
        root!.render(<PwaRegister />);
      });

      // Update prompt should be visible
      expect(container!.innerHTML).toContain('Mise à jour disponible');
      expect(container!.innerHTML).toContain('Mettez à jour pour profiter des dernières fonctionnalités');

      // Click "Mettre à jour"
      const updateButton = Array.from(container!.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Mettre à jour'
      );
      expect(updateButton).toBeDefined();

      await act(async () => {
        updateButton!.click();
      });

      // Should send SKIP_WAITING to waiting worker
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });

      // Now when controllerchange fires, reload should be permitted
      const controllerChangeHandlers = mockNavigatorSwEvents['controllerchange'] || [];
      await act(async () => {
        for (const handler of controllerChangeHandlers) {
          handler();
        }
      });

      expect(reloadMock).toHaveBeenCalledTimes(1);
    });

    it('dismisses gentle prompt without reloading when Ignorer is clicked', async () => {
      mockPathname = '/home';
      
      mockRegister.mockResolvedValueOnce({
        addEventListener: vi.fn(),
        waiting: {
          postMessage: vi.fn(),
        },
      });

      await act(async () => {
        root!.render(<PwaRegister />);
      });

      expect(container!.innerHTML).toContain('Mise à jour disponible');

      const ignoreButton = Array.from(container!.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Ignorer'
      );
      expect(ignoreButton).toBeDefined();

      await act(async () => {
        ignoreButton!.click();
      });

      // Toast dismissed
      expect(container!.innerHTML).toBe('');

      // controllerchange should still not reload
      const controllerChangeHandlers = mockNavigatorSwEvents['controllerchange'] || [];
      await act(async () => {
        for (const handler of controllerChangeHandlers) {
          handler();
        }
      });

      expect(reloadMock).not.toHaveBeenCalled();
    });
  });

  describe('PwaInstallButton Component', () => {
    it('should stay hidden initially', async () => {
      await act(async () => {
        root!.render(<PwaInstallButton />);
      });

      expect(container!.innerHTML).toBe('');
    });

    it('should render install button when beforeinstallprompt fires', async () => {
      await act(async () => {
        root!.render(<PwaInstallButton />);
      });

      const promptEvent = new Event('beforeinstallprompt') as any;
      promptEvent.preventDefault = vi.fn();
      promptEvent.prompt = vi.fn();
      promptEvent.userChoice = Promise.resolve({ outcome: 'accepted' });

      // Trigger the window event listener manually
      const handlers = mockWindowEvents['beforeinstallprompt'] || [];
      await act(async () => {
        for (const handler of handlers) {
          if (typeof handler === 'function') {
            handler(promptEvent);
          }
        }
      });

      // The button should now be rendered
      expect(container!.innerHTML).toContain('Installer');
      
      // Trigger click
      const button = container!.querySelector('button');
      expect(button).not.toBeNull();

      await act(async () => {
        button!.click();
      });

      expect(promptEvent.prompt).toHaveBeenCalled();
    });
  });
});
