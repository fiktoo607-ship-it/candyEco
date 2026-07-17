// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import OrdersSection from '@/components/dashbord/OrdersSection';
import { useDashboardStore } from '@/lib/dashboard-store';
import { Order } from '@/lib/hooks/use-orders';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const initialMockOrders: Order[] = [
  {
    id: 'order-123',
    reference: 'ORD-20260717-001',
    sessionId: null,
    status: 'PENDING',
    totalPrice: '25.50',
    totalAmount: 25.5,
    customerName: 'Jean Dupont',
    customerPhone: '0612345678',
    customerEmail: 'jean.dupont@example.com',
    shippingAddress: '123 Rue de la Paix, Paris',
    createdAt: '2026-07-17T07:00:00.000Z',
    updatedAt: '2026-07-17T07:00:00.000Z',
    deliveryMethod: 'Livraison à Domicile',
    items: [
      {
        id: 'item-1',
        orderId: 'order-123',
        productId: 'prod-1',
        quantity: 2,
        priceAtPurchase: '12.75',
        amountAtPurchase: 25.5,
        createdAt: '2026-07-17T07:00:00.000Z',
        updatedAt: '2026-07-17T07:00:00.000Z',
        product: {
          id: 'prod-1',
          title: 'Fraise Tagada',
          slug: 'fraise-tagada',
          price: '12.75',
          category: 'bonbon',
          imageUrl: '/fraise.jpg',
          description: 'Fraise rouge',
          story: 'Histoire fraise',
          limitBay: null,
          state: 'AVAILABLE',
        }
      }
    ],
  }
];

const mockMutateAsync = vi.fn();
let currentOrdersData: any = {
  data: {
    data: initialMockOrders,
    meta: { total: 1, totalPages: 1 },
  },
  isLoading: false,
  error: null,
};

vi.mock('@/lib/hooks/use-orders', () => {
  return {
    useOrders: () => currentOrdersData,
    useUpdateOrderStatus: () => ({
      mutateAsync: async (payload: any) => {
        mockMutateAsync(payload);
        return { ...initialMockOrders[0], status: payload.status };
      },
      isPending: false,
    }),
    useSubmitOrder: vi.fn(),
  };
});

// Mock print portal to avoid layout side-effects
vi.mock('@/components/dashbord/helpers/OrderPrintReceipt', () => {
  return {
    OrderPrintReceipt: () => <div id="mock-print-receipt">Print Receipt</div>
  };
});

describe('Orders Dashboard State Synchronization & Cache Invalidation', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Reset Zustand store
    useDashboardStore.setState({
      orderSearchQuery: '',
      orderStatusFilter: 'ALL',
      orderCurrentPage: 1,
      showToast: vi.fn(),
    });

    // Reset mock data
    currentOrdersData = {
      data: {
        data: JSON.parse(JSON.stringify(initialMockOrders)),
        meta: { total: 1, totalPages: 1 },
      },
      isLoading: false,
      error: null,
    };

    mockMutateAsync.mockReset();
  });

  afterEach(() => {
    if (root && container) {
      act(() => {
        root!.unmount();
      });
      document.body.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  it('should synchronize the details modal status when query refetch updates the order', async () => {
    // 1. Render OrdersSection
    await act(async () => {
      root!.render(<OrdersSection />);
    });

    // 2. Open details modal by clicking "Détails"
    const detailsButtons = document.querySelectorAll('button');
    let detailsBtn: HTMLButtonElement | null = null;
    detailsButtons.forEach((btn) => {
      if (btn.textContent?.includes('Détails')) {
        detailsBtn = btn;
      }
    });

    expect(detailsBtn).not.toBeNull();
    await act(async () => {
      detailsBtn!.click();
    });

    // Verify modal is open and shows "En attente" (PENDING)
    const getModal = () => document.querySelector('.fixed.inset-0.z-\\[70\\]');
    expect(getModal()).not.toBeNull();
    expect(getModal()!.textContent).toContain('En attente');

    // 3. Click "Accepter la commande" in the details modal
    const acceptBtn = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('Accepter la commande')
    );
    expect(acceptBtn).not.toBeNull();
    await act(async () => {
      acceptBtn!.click();
    });

    // 4. Confirm the status update in the confirmation modal
    const confirmBtn = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('Confirmer')
    );
    expect(confirmBtn).not.toBeNull();
    await act(async () => {
      confirmBtn!.click();
    });

    // Verify mutation was called with the correct status
    expect(mockMutateAsync).toHaveBeenCalledWith({
      id: 'order-123',
      status: 'ACCEPTED',
    });

    // 5. Simulate React Query refetch returning updated order status
    currentOrdersData.data.data[0].status = 'ACCEPTED';

    // Trigger state change (re-render) by simulating cache invalidate and refetch completed
    await act(async () => {
      root!.render(<OrdersSection />);
    });

    // The details modal should now show "Acceptée" (ACCEPTED) instead of "En attente"
    expect(getModal()!.textContent).toContain('Acceptée');
    expect(getModal()!.textContent).not.toContain('En attente');
  });

  it('should close the details modal when the updated order is no longer in the query list (e.g. filtered out)', async () => {
    // 1. Render OrdersSection
    await act(async () => {
      root!.render(<OrdersSection />);
    });

    // 2. Open details modal
    const detailsBtn = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('Détails')
    );
    await act(async () => {
      detailsBtn!.click();
    });

    expect(document.body.textContent).toContain('Détails de la Commande');

    // 3. Click "Accepter la commande" and then "Confirmer"
    const acceptBtn = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('Accepter la commande')
    );
    await act(async () => {
      acceptBtn!.click();
    });

    const confirmBtn = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('Confirmer')
    );
    await act(async () => {
      confirmBtn!.click();
    });

    // 4. Simulate React Query refetch returning empty data (order filtered out from pending view)
    currentOrdersData.data.data = [];

    // Trigger state change (re-render)
    await act(async () => {
      root!.render(<OrdersSection />);
    });

    // The details modal should have automatically closed because the selected order is no longer in the query list
    expect(document.body.textContent).not.toContain('Détails de la Commande');
  });
});
