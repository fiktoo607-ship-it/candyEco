// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import NewProductsSection from '@/components/home/NewProductsSection';
import PopularProductsSection from '@/components/home/PopularProductsSection';
import NotificationBell from '@/components/dashbord/NotificationBell';
import { OrdersTable } from '@/components/dashbord/orders/OrdersTable';
import { UsersTable } from '@/components/dashbord/users/UsersTable';
import CheckoutForm from '@/components/cart/CheckoutForm';

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'admin-1', role: 'ADMIN' } } }),
}));

vi.mock('@/lib/cart-store', () => ({
  useCartStore: () => ({
    items: [{ product: { id: 'p1', title: 'Test Product', price: '10' }, quantity: 1 }],
    clearCart: vi.fn(),
    getTotalPrice: () => 10,
  }),
}));

vi.mock('@/lib/hooks/use-orders', () => ({
  useSubmitOrder: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/lib/hooks/use-config', () => ({
  useConfig: () => ({ data: { store_enabled: true } }),
}));

let mockUnreadCount = 0;
vi.mock('@/components/dashbord/hooks/useNotificationBell', () => ({
  useNotificationBell: () => ({
    isOpen: false,
    setIsOpen: vi.fn(),
    toast: null,
    setToast: vi.fn(),
    notifications: [],
    unreadCount: mockUnreadCount,
    handleNotificationClick: vi.fn(),
    handleMarkAllRead: vi.fn(),
    handleClearAll: vi.fn(),
    setActiveTab: vi.fn(),
  }),
}));

vi.mock('@/lib/hooks/use-push-notifications', () => ({
  usePushNotifications: () => ({
    isSupported: false,
    isSubscribed: false,
    subscribeToPush: vi.fn(),
    unsubscribeFromPush: vi.fn(),
    loading: false,
    isIOS: false,
    isStandalone: false,
  }),
}));

function renderComponent(ui: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('Accessibility Enhancements (Issues #24, #27, #33)', () => {
  const sampleProducts = [
    { id: '1', title: 'Product 1', slug: 'p1', category: 'C1', price: '10', imageUrl: '/1.jpg', description: 'Desc 1', state: 'active' },
    { id: '2', title: 'Product 2', slug: 'p2', category: 'C2', price: '20', imageUrl: '/2.jpg', description: 'Desc 2', state: 'active' },
    { id: '3', title: 'Product 3', slug: 'p3', category: 'C3', price: '30', imageUrl: '/3.jpg', description: 'Desc 3', state: 'active' },
    { id: '4', title: 'Product 4', slug: 'p4', category: 'C4', price: '40', imageUrl: '/4.jpg', description: 'Desc 4', state: 'active' },
  ];

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'del-1', name: 'Standard', price: 500, active: true }],
    } as any);
  });

  describe('Issue #24: CheckoutForm Error Banner', () => {
    it('formError container has role="alert" and aria-live="assertive" when offline or error occurs', async () => {
      // simulate navigator offline
      Object.defineProperty(window.navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const { container, unmount } = renderComponent(<CheckoutForm onSuccess={vi.fn()} />);

      const form = container.querySelector('form');
      expect(form).not.toBeNull();

      // Submit form to trigger offline error
      await act(async () => {
        form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      });

      const alertBanner = container.querySelector('[role="alert"]');
      expect(alertBanner).not.toBeNull();
      expect(alertBanner?.getAttribute('aria-live')).toBe('assertive');
      expect(alertBanner?.textContent).toContain('hors ligne');

      unmount();
    });
  });

  describe('Issue #27: Carousels Pause/Play Button & Reduced Motion', () => {
    it('FeaturedProducts renders Pause/Play button and toggles state correctly', () => {
      const { container, unmount } = renderComponent(<FeaturedProducts products={sampleProducts} />);

      const pausePlayBtn = container.querySelector('button[aria-label="Mettre en pause le carrousel"]') as HTMLButtonElement;
      expect(pausePlayBtn).not.toBeNull();
      expect(pausePlayBtn.getAttribute('aria-pressed')).toBe('false');

      // Click to pause
      act(() => {
        pausePlayBtn.click();
      });

      expect(pausePlayBtn.getAttribute('aria-label')).toBe('Lancer le carrousel');
      expect(pausePlayBtn.getAttribute('aria-pressed')).toBe('true');

      unmount();
    });

    it('NewProductsSection renders Pause/Play button and toggles state correctly', () => {
      const { container, unmount } = renderComponent(<NewProductsSection products={sampleProducts} />);

      const pausePlayBtn = container.querySelector('button[aria-label="Mettre en pause le carrousel"]') as HTMLButtonElement;
      expect(pausePlayBtn).not.toBeNull();
      expect(pausePlayBtn.getAttribute('aria-pressed')).toBe('false');

      // Click to pause
      act(() => {
        pausePlayBtn.click();
      });

      expect(pausePlayBtn.getAttribute('aria-label')).toBe('Lancer le carrousel');
      expect(pausePlayBtn.getAttribute('aria-pressed')).toBe('true');

      unmount();
    });

    it('PopularProductsSection renders Pause/Play button and toggles state correctly', () => {
      const { container, unmount } = renderComponent(<PopularProductsSection products={sampleProducts} />);

      const pausePlayBtn = container.querySelector('button[aria-label="Mettre en pause le carrousel"]') as HTMLButtonElement;
      expect(pausePlayBtn).not.toBeNull();
      expect(pausePlayBtn.getAttribute('aria-pressed')).toBe('false');

      // Click to pause
      act(() => {
        pausePlayBtn.click();
      });

      expect(pausePlayBtn.getAttribute('aria-label')).toBe('Lancer le carrousel');
      expect(pausePlayBtn.getAttribute('aria-pressed')).toBe('true');

      unmount();
    });

    it('respects prefers-reduced-motion media query by defaulting to paused', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { container, unmount } = renderComponent(<FeaturedProducts products={sampleProducts} />);
      const btn = container.querySelector('button[aria-label="Lancer le carrousel"]');
      expect(btn).not.toBeNull();
      expect(btn?.getAttribute('aria-pressed')).toBe('true');

      unmount();
      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Issue #33: Icon Button Accessible Labels', () => {
    it('NotificationBell has dynamic aria-label reflecting unreadCount', () => {
      mockUnreadCount = 0;
      const { container: c1, unmount: u1 } = renderComponent(<NotificationBell />);
      const btn1 = c1.querySelector('button');
      expect(btn1?.getAttribute('aria-label')).toBe('Notifications');
      u1();

      mockUnreadCount = 5;
      const { container: c2, unmount: u2 } = renderComponent(<NotificationBell />);
      const btn2 = c2.querySelector('button');
      expect(btn2?.getAttribute('aria-label')).toBe('Notifications, 5 non lues');
      u2();
    });

    it('OrdersTable print button has aria-label="Imprimer la commande"', () => {
      const mockOrder: any = {
        id: 'ord-123',
        status: 'ACCEPTED',
        customerName: 'Ahmad',
        customerPhone: '0555000000',
        shippingAddress: 'Alger',
        deliveryMethod: 'Livraison Rapide',
        totalPrice: 1500,
        createdAt: new Date().toISOString(),
        items: [],
        orderItems: [],
      };

      const { container, unmount } = renderComponent(
        <OrdersTable
          orders={[mockOrder]}
          isLoading={false}
          error={null}
          ordersPerPage={10}
          setOrdersPerPage={vi.fn()}
          orderCurrentPage={1}
          setOrderCurrentPage={vi.fn()}
          totalPages={1}
          totalOrders={1}
          updateStatusMutation={{ mutate: vi.fn() }}
          onViewDetails={vi.fn()}
          onStatusChangeClick={vi.fn()}
          onToastMessage={vi.fn()}
          onPrintOrder={vi.fn()}
        />
      );

      const printButtons = container.querySelectorAll('button[aria-label="Imprimer la commande"]');
      expect(printButtons.length).toBeGreaterThanOrEqual(1);

      unmount();
    });

    it('UsersTable delete button has aria-label="Supprimer le client"', () => {
      const mockUser: any = {
        id: 'user-2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '0666000000',
        status: 'ACTIVE',
        completedOrderCount: 3,
        trustScore: 20,
        latestActivity: new Date().toISOString(),
      };

      const { container, unmount } = renderComponent(
        <UsersTable
          filteredUsers={[mockUser]}
          session={{ user: { id: 'admin-1' } }}
          confirmDeleteId={null}
          setConfirmDeleteId={vi.fn()}
          deleteLoading={false}
          onDeleteUser={vi.fn()}
        />
      );

      const deleteButtons = container.querySelectorAll('button[aria-label="Supprimer le client"]');
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1);

      unmount();
    });
  });
});
