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

  describe('Carousels Responsive Layout & Auto Swapping by Default', () => {
    it('FeaturedProducts, NewProductsSection and PopularProductsSection do not render pause/play button', () => {
      const { container: c1, unmount: u1 } = renderComponent(<FeaturedProducts products={sampleProducts} />);
      expect(c1.querySelector('button[aria-label="Mettre en pause le carrousel"]')).toBeNull();
      expect(c1.querySelector('button[aria-label="Lancer le carrousel"]')).toBeNull();
      u1();

      const { container: c2, unmount: u2 } = renderComponent(<NewProductsSection products={sampleProducts} />);
      expect(c2.querySelector('button[aria-label="Mettre en pause le carrousel"]')).toBeNull();
      expect(c2.querySelector('button[aria-label="Lancer le carrousel"]')).toBeNull();
      u2();

      const { container: c3, unmount: u3 } = renderComponent(<PopularProductsSection products={sampleProducts} />);
      expect(c3.querySelector('button[aria-label="Mettre en pause le carrousel"]')).toBeNull();
      expect(c3.querySelector('button[aria-label="Lancer le carrousel"]')).toBeNull();
      u3();
    });

    it('renders indicator dots for slides and navigates properly', () => {
      const { container, unmount } = renderComponent(<PopularProductsSection products={sampleProducts} />);
      const indicatorBtns = container.querySelectorAll('button[aria-label^="Aller à la diapositive"], button[aria-label^="Go to slide"]');
      expect(indicatorBtns.length).toBe(sampleProducts.length);
      unmount();
    });

    it('adapts items per view responsively based on window width', () => {
      // Simulate phone screen (< 640px)
      window.innerWidth = 375;
      const { container: phoneContainer, unmount: phoneUnmount } = renderComponent(<PopularProductsSection products={sampleProducts} />);
      const phoneSlideCard = phoneContainer.querySelector('.flex-shrink-0') as HTMLElement;
      expect(phoneSlideCard?.style.width).toBe('100%');
      phoneUnmount();

      // Simulate tablet screen (640px - 1023px)
      window.innerWidth = 768;
      const { container: tabletContainer, unmount: tabletUnmount } = renderComponent(<PopularProductsSection products={sampleProducts} />);
      const tabletSlideCard = tabletContainer.querySelector('.flex-shrink-0') as HTMLElement;
      expect(tabletSlideCard?.style.width).toBe('50%');
      tabletUnmount();

      // Simulate large screen (>= 1024px)
      window.innerWidth = 1200;
      const { container: desktopContainer, unmount: desktopUnmount } = renderComponent(<PopularProductsSection products={sampleProducts} />);
      const desktopSlideCard = desktopContainer.querySelector('.flex-shrink-0') as HTMLElement;
      expect(desktopSlideCard?.style.width).toBe(`${100 / 3}%`);
      desktopUnmount();
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
