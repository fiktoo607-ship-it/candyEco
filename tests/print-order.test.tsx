// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { OrderPrintReceipt } from '@/components/dashbord/helpers/OrderPrintReceipt';
import { Order } from '@/lib/hooks/use-orders';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mockOrder: Order = {
  id: 'order-123',
  reference: 'CMD-ABC',
  sessionId: 'sess-1',
  status: 'ACCEPTED',
  totalPrice: '25.50',
  totalAmount: 25.5,
  customerName: 'Jean Dupont',
  customerPhone: '0612345678',
  customerEmail: 'jean.dupont@example.com',
  shippingAddress: '123 Rue de la Paix, 75001 Paris',
  createdAt: '2026-07-17T07:00:00.000Z',
  updatedAt: '2026-07-17T07:00:00.000Z',
  deliveryMethod: 'Livraison Standard',
  items: [
    {
      id: 'item-1',
      orderId: 'order-123',
      productId: 'prod-1',
      quantity: 2,
      priceAtPurchase: '10.00',
      amountAtPurchase: 20.0,
      createdAt: '2026-07-17T07:00:00.000Z',
      updatedAt: '2026-07-17T07:00:00.000Z',
      product: {
        id: 'prod-1',
        title: 'Bonbon Fraise',
        slug: 'bonbon-fraise',
        price: '10.00',
        category: 'candy',
        imageUrl: '/strawberry.jpg',
        description: 'Délicieux bonbons à la fraise',
        story: 'Une longue histoire...',
        limitBay: null,
        state: 'AVAILABLE',
      }
    },
    {
      id: 'item-2',
      orderId: 'order-123',
      productId: 'prod-2',
      quantity: 1,
      priceAtPurchase: '5.50',
      amountAtPurchase: 5.5,
      createdAt: '2026-07-17T07:00:00.000Z',
      updatedAt: '2026-07-17T07:00:00.000Z',
      product: {
        id: 'prod-2',
        title: 'Chocolat Lait',
        slug: 'chocolat-lait',
        price: '5.50',
        category: 'chocolate',
        imageUrl: '/chocolate.jpg',
        description: 'Chocolat au lait fondant',
        story: 'Depuis 1850...',
        limitBay: null,
        state: 'AVAILABLE',
      }
    }
  ]
};

describe('OrderPrintReceipt Component', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;
  let printSpy: any;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    if (root && container) {
      act(() => {
        root!.unmount();
      });
      document.body.removeChild(container);
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders order metadata, customer details, and item details correctly', async () => {
    const onClose = vi.fn();
    
    await act(async () => {
      root!.render(<OrderPrintReceipt order={mockOrder} onClose={onClose} />);
    });

    const receiptRoot = document.getElementById('print-receipt-root');
    expect(receiptRoot).not.toBeNull();

    const content = receiptRoot!.textContent || '';
    expect(content).toContain('CANDY ECO');
    expect(content).toContain('CMD-ABC');
    expect(content).toContain('Jean Dupont');
    expect(content).toContain('0612345678');
    expect(content).toContain('jean.dupont@example.com');
    expect(content).toContain('123 Rue de la Paix, 75001 Paris');
    expect(content).toContain('Livraison Standard');
    expect(content).toContain('Bonbon Fraise');
    expect(content).toContain('x2');
    expect(content).toContain('10.00 €');
    expect(content).toContain('Chocolat Lait');
    expect(content).toContain('x1');
    expect(content).toContain('5.50 €');
    expect(content).toContain('25.50 €');
  });

  it('triggers window.print and onClose after timer', async () => {
    const onClose = vi.fn();
    
    await act(async () => {
      root!.render(<OrderPrintReceipt order={mockOrder} onClose={onClose} />);
    });

    expect(printSpy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
