// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import TrackOrderPage from '@/app/track-order/page';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/track-order',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

vi.mock('@/lib/hooks/use-config', () => ({
  useConfig: () => ({ data: { store_enabled: true }, isLoading: false }),
}));

vi.mock('@/lib/store', () => ({
  useBakeryStore: (selector: any) =>
    selector({
      mobileMenuOpen: false,
      toggleMobileMenu: vi.fn(),
      closeMobileMenu: vi.fn(),
    }),
}));

vi.mock('@/lib/cart-store', () => ({
  useCartStore: (selector: any) => selector({ getTotalItemsCount: () => 0 }),
}));

describe('Guest Order Tracking Page UI (app/track-order/page.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the guest tracking form with inputs for reference and phone/email', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<TrackOrderPage />);
    });

    const refInput = container.querySelector('#reference') as HTMLInputElement;
    const tokenInput = container.querySelector('#token') as HTMLInputElement;
    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(refInput).not.toBeNull();
    expect(tokenInput).not.toBeNull();
    expect(submitBtn).not.toBeNull();
    expect(submitBtn.textContent).toContain('Rechercher ma commande');

    root.unmount();
    container.remove();
  });

  it('submits form and displays order details, status timeline, and items', async () => {
    const mockOrderData = {
      id: 'ord-999',
      reference: 'ORD-20261008-1005',
      status: 'ACCEPTED',
      totalPrice: '25.50 €',
      totalAmount: 25.5,
      customerName: 'Fatima Zohra',
      customerPhone: '0555987654',
      customerEmail: 'fatima@example.com',
      shippingAddress: '10 Boulevard Colonel Amirouche, Alger',
      deliveryMethod: 'Livraison Standard',
      createdAt: '2026-10-08T10:00:00.000Z',
      items: [
        {
          id: 'item-1',
          quantity: 2,
          priceAtPurchase: '10.00 €',
          amountAtPurchase: 10.0,
          product: { title: 'Nougat aux Amandes' },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrderData,
    }) as any;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<TrackOrderPage />);
    });

    const refInput = container.querySelector('#reference') as HTMLInputElement;
    const tokenInput = container.querySelector('#token') as HTMLInputElement;
    const form = container.querySelector('form') as HTMLFormElement;

    function setInputValue(input: HTMLInputElement, value: string) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(input, value);
      } else {
        input.value = value;
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    await act(async () => {
      setInputValue(refInput, 'ORD-20261008-1005');
      setInputValue(tokenInput, '0555987654');
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/orders/track', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        reference: 'ORD-20261008-1005',
        token: '0555987654',
      }),
    }));

    expect(container.textContent).toContain('Commande #ORD-20261008-1005');
    expect(container.textContent).toContain('Fatima Zohra');
    expect(container.textContent).toContain('Nougat aux Amandes');

    root.unmount();
    container.remove();
  });
});
