// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import PwaRegister from '@/components/PwaRegister';
import CheckoutForm from '@/components/cart/CheckoutForm';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let currentRoute = '/cart';
vi.mock('next/navigation', () => ({
  usePathname: () => currentRoute,
}));

// Mock use-config
vi.mock('@/lib/hooks/use-config', () => ({
  useConfig: () => ({
    data: { store_enabled: true },
    isLoading: false,
  }),
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
}));

// Mock use-orders
vi.mock('@/lib/hooks/use-orders', () => ({
  useSubmitOrder: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

// Mock cart store
vi.mock('@/lib/cart-store', () => ({
  useCartStore: () => ({
    items: [
      {
        product: { id: 'p1', title: 'Chocolat', price: '15.00', slug: 'chocolat' },
        quantity: 2,
      },
    ],
    clearCart: vi.fn(),
    getTotalPrice: () => 30,
  }),
}));

// Mock fetch for delivery methods
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => [
    { id: 'del-1', name: 'Livraison Standard', price: 500, active: true },
  ],
}) as any;

describe('PWA Checkout & Navigation Protection (Issue #142)', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;
  let mockReload: any;
  let swEventListeners: { [key: string]: Function[] } = {};

  beforeEach(() => {
    currentRoute = '/cart';
    (process.env as any).NODE_ENV = 'production';
    swEventListeners = {};
    mockReload = vi.fn();

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, reload: mockReload } as any;

    vi.stubGlobal('navigator', {
      onLine: true,
      serviceWorker: {
        register: vi.fn().mockResolvedValue({
          addEventListener: vi.fn(),
          waiting: null,
        }),
        addEventListener: vi.fn((event: string, handler: Function) => {
          if (!swEventListeners[event]) swEventListeners[event] = [];
          swEventListeners[event].push(handler);
        }),
        removeEventListener: vi.fn(),
        controller: {},
      },
    });

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
      root = null;
      container = null;
    }
    vi.restoreAllMocks();
  });

  it('keeps checkout form inputs and state intact when service worker updates and controllerchange fires', async () => {
    // Render PwaRegister alongside CheckoutForm as they would coexist in app/layout
    await act(async () => {
      root!.render(
        <div>
          <PwaRegister />
          <CheckoutForm onSuccess={vi.fn()} />
        </div>
      );
    });

    // Wait for delivery methods to load
    await new Promise((r) => setTimeout(r, 10));

    // Fill in checkout form fields
    const nameInput = container!.querySelector('input[type="text"]') as HTMLInputElement;
    const phoneInput = container!.querySelector('input[type="tel"]') as HTMLInputElement;
    const emailInput = container!.querySelector('input[type="email"]') as HTMLInputElement;

    expect(nameInput).not.toBeNull();
    expect(phoneInput).not.toBeNull();

    await act(async () => {
      nameInput.value = 'Jean Dupont';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));

      phoneInput.value = '0555123456';
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(nameInput.value).toBe('Jean Dupont');
    expect(phoneInput.value).toBe('0555123456');

    // Simulate mid-session service worker background update and controllerchange
    const controllerChangeHandlers = swEventListeners['controllerchange'] || [];
    expect(controllerChangeHandlers.length).toBe(1);

    await act(async () => {
      for (const handler of controllerChangeHandlers) {
        handler();
      }
    });

    // Verify window.location.reload was NEVER called
    expect(mockReload).not.toHaveBeenCalled();

    // Verify input values are completely preserved and uninterrupted
    expect(nameInput.value).toBe('Jean Dupont');
    expect(phoneInput.value).toBe('0555123456');
  });

  it('suppresses update prompt during checkout and allows seamless route navigation', async () => {
    currentRoute = '/cart';

    // Mock waiting worker exists
    (navigator.serviceWorker.register as any).mockResolvedValueOnce({
      addEventListener: vi.fn(),
      waiting: { postMessage: vi.fn() },
    });

    await act(async () => {
      root!.render(<PwaRegister />);
    });

    // On /cart, prompt must never be displayed
    expect(container!.innerHTML).toBe('');

    // Navigate to /home
    currentRoute = '/home';
    await act(async () => {
      root!.render(<PwaRegister />);
    });

    // After navigating to /home, gentle prompt is available for user review
    expect(container!.innerHTML).toContain('Mise à jour disponible');
    expect(mockReload).not.toHaveBeenCalled();
  });
});
