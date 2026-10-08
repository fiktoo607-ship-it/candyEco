// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';
import { generateAtomicOrderReference } from '@/app/api/orders/route';
import { OrderPrintReceipt, parseCleanPrice } from '@/components/dashbord/helpers/OrderPrintReceipt';
import { Order } from '@/lib/hooks/use-orders';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('Order Reference Sequence Wrap Collision Fix (Issue #35)', () => {
  it('formats low sequences with 3-digit zero-padding', async () => {
    const fixedDate = new Date('2026-10-08T00:00:00Z');
    const mockDb = {
      $queryRaw: vi.fn().mockResolvedValueOnce([{ seq: '1' }]),
    };

    const ref = await generateAtomicOrderReference(mockDb, fixedDate);
    expect(ref).toBe('ORD-20261008-001');
  });

  it('formats sequence 999 correctly', async () => {
    const fixedDate = new Date('2026-10-08T00:00:00Z');
    const mockDb = {
      $queryRaw: vi.fn().mockResolvedValueOnce([{ seq: '999' }]),
    };

    const ref = await generateAtomicOrderReference(mockDb, fixedDate);
    expect(ref).toBe('ORD-20261008-999');
  });

  it('does NOT modulo wrap or reset to 001 for sequence 1000 and beyond', async () => {
    const fixedDate = new Date('2026-10-08T00:00:00Z');
    const mockDb1000 = {
      $queryRaw: vi.fn().mockResolvedValueOnce([{ seq: '1000' }]),
    };
    const ref1000 = await generateAtomicOrderReference(mockDb1000, fixedDate);
    expect(ref1000).toBe('ORD-20261008-1000');
    expect(ref1000).not.toBe('ORD-20261008-001');

    const mockDb1001 = {
      $queryRaw: vi.fn().mockResolvedValueOnce([{ seq: '1001' }]),
    };
    const ref1001 = await generateAtomicOrderReference(mockDb1001, fixedDate);
    expect(ref1001).toBe('ORD-20261008-1001');

    const mockDb5500 = {
      $queryRaw: vi.fn().mockResolvedValueOnce([{ seq: '5500' }]),
    };
    const ref5500 = await generateAtomicOrderReference(mockDb5500, fixedDate);
    expect(ref5500).toBe('ORD-20261008-5500');
  });

  it('creates completely unique references beyond 999 without collisions', async () => {
    const fixedDate = new Date('2026-10-08T00:00:00Z');
    const generated = new Set<string>();

    for (let seq = 995; seq <= 1010; seq++) {
      const mockDb = {
        $queryRaw: vi.fn().mockResolvedValueOnce([{ seq: String(seq) }]),
      };
      const ref = await generateAtomicOrderReference(mockDb, fixedDate);
      expect(generated.has(ref)).toBe(false);
      generated.add(ref);
    }

    expect(generated.size).toBe(16);
  });
});

describe('Receipt Price Cleaning & NaN Prevention (Issue #31)', () => {
  describe('parseCleanPrice function', () => {
    it('correctly cleans currency symbols like $, DA, €', () => {
      expect(parseCleanPrice('$10.00')).toBe(10);
      expect(parseCleanPrice('15.50 DA')).toBe(15.5);
      expect(parseCleanPrice('DA 20.00')).toBe(20);
      expect(parseCleanPrice('€25.75')).toBe(25.75);
      expect(parseCleanPrice('30.00 €')).toBe(30);
      expect(parseCleanPrice('12,50 DA')).toBe(12.5);
    });

    it('handles numeric numbers, null, and undefined gracefully without returning NaN', () => {
      expect(parseCleanPrice(42.5)).toBe(42.5);
      expect(parseCleanPrice(0)).toBe(0);
      expect(parseCleanPrice(null)).toBe(0);
      expect(parseCleanPrice(undefined)).toBe(0);
      expect(parseCleanPrice('')).toBe(0);
      expect(parseCleanPrice('invalid-text')).toBe(0);
    });
  });

  describe('OrderPrintReceipt rendering', () => {
    it('renders accurate decimal prices without NaN when priceAtPurchase contains currency symbols', async () => {
      const mockOrderWithSymbols: Order = {
        id: 'ord-symbolic',
        reference: 'ORD-20261008-1005',
        sessionId: 'sess-sym-1',
        status: 'ACCEPTED',
        totalPrice: '25.50 €',
        totalAmount: 25.5,
        customerName: 'Samir Benali',
        customerPhone: '0550123456',
        customerEmail: 'samir@example.com',
        shippingAddress: '42 Rue Didouche, Alger',
        deliveryMethod: 'Livraison Standard',
        createdAt: '2026-10-08T12:00:00Z',
        updatedAt: '2026-10-08T12:00:00Z',
        items: [
          {
            id: 'item-1',
            orderId: 'ord-symbolic',
            productId: 'prod-1',
            quantity: 2,
            priceAtPurchase: '$10.00', // Dollar prefixed
            amountAtPurchase: 10.0,
            createdAt: '2026-10-08T12:00:00Z',
            updatedAt: '2026-10-08T12:00:00Z',
            product: {
              id: 'prod-1',
              title: 'Sucette Fraise',
              slug: 'sucette-fraise',
              price: '10.00',
              category: 'candy',
              imageUrl: '/sucette.jpg',
              description: 'Bonbon',
              story: 'Histoire',
              limitBay: null,
              state: 'AVAILABLE',
            },
          },
          {
            id: 'item-2',
            orderId: 'ord-symbolic',
            productId: 'prod-2',
            quantity: 1,
            priceAtPurchase: '5.50 DA', // DA suffixed
            amountAtPurchase: 5.5,
            createdAt: '2026-10-08T12:00:00Z',
            updatedAt: '2026-10-08T12:00:00Z',
            product: {
              id: 'prod-2',
              title: 'Guimauve Vanille',
              slug: 'guimauve-vanille',
              price: '5.50',
              category: 'candy',
              imageUrl: '/guimauve.jpg',
              description: 'Bonbon',
              story: 'Histoire',
              limitBay: null,
              state: 'AVAILABLE',
            },
          },
        ],
      };

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      await act(async () => {
        root.render(<OrderPrintReceipt order={mockOrderWithSymbols} onClose={vi.fn()} />);
      });

      const receiptRoot = document.getElementById('print-receipt-root');
      expect(receiptRoot).not.toBeNull();
      const receiptText = receiptRoot!.textContent || '';

      // Verify no NaN is rendered
      expect(receiptText).not.toContain('NaN');

      // Verify accurate prices are rendered
      expect(receiptText).toContain('10.00 €');
      expect(receiptText).toContain('20.00 €'); // 2 * 10.00
      expect(receiptText).toContain('5.50 €');

      root.unmount();
      container.remove();
    });
  });
});

describe('Preserve Historical OrderItems on Product Deletion (Issue #23)', () => {
  it('enforces onDelete: Restrict on OrderItem product relation in schema.prisma', () => {
    const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Find the OrderItem model
    const orderItemBlockMatch = schemaContent.match(/model OrderItem\s*{[^}]*}/s);
    expect(orderItemBlockMatch).not.toBeNull();
    const orderItemBlock = orderItemBlockMatch![0];

    // Must NOT cascade delete historical order items
    expect(orderItemBlock).not.toMatch(/product\s+Product\s+@relation\([^)]*onDelete:\s*Cascade[^)]*\)/);

    // Must have onDelete: Restrict
    expect(orderItemBlock).toMatch(/product\s+Product\s+@relation\([^)]*onDelete:\s*Restrict[^)]*\)/);
  });
});
