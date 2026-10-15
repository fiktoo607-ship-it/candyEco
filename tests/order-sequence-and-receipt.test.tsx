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

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/config', () => ({
  getSiteConfig: vi.fn().mockImplementation((key) => {
    if (key === 'store_enabled') return Promise.resolve(true);
    if (key === 'store_message') return Promise.resolve('Le magasin est temporairement fermé.');
    return Promise.resolve(null);
  }),
}));

vi.mock('@/lib/prisma', () => {
  const mockSequenceStore = new Map<string, number>();
  const mockPrisma: any = {
    _mockSequenceStore: mockSequenceStore,
    product: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    deliveryMethod: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findFirst: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    orderNotification: {
      create: vi.fn().mockImplementation((args) => Promise.resolve({
        id: 'notif-uuid-123',
        orderId: args.data.orderId,
        read: false,
        createdAt: new Date(),
      })),
    },
    setting: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn(),
    },
    $queryRaw: vi.fn().mockImplementation((strings: any, ...values: any[]) => {
      const queryStr = typeof strings === 'string'
        ? strings
        : Array.isArray(strings)
          ? strings.join('?')
          : (strings?.raw ? strings.raw.join('?') : String(strings));
      if (queryStr.includes('nextval') || values.length > 0) {
        const seqName = String(values[0] || 'default_seq');
        const nextVal = (mockSequenceStore.get(seqName) || 0) + 1;
        mockSequenceStore.set(seqName, nextVal);
        return Promise.resolve([{ seq: nextVal }]);
      }
      return Promise.resolve([{ seq: 1 }]);
    }),
    $queryRawUnsafe: vi.fn().mockResolvedValue([{ seq: 1 }]),
    $executeRawUnsafe: vi.fn().mockResolvedValue(1),
    $transaction: vi.fn((arg) => {
      if (typeof arg === 'function') {
        return arg(mockPrisma);
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return Promise.resolve(arg);
    }),
  };

  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

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

describe('Delivery Method Validation & Server-Side Pricing (Issues #8, #28)', () => {
  it('includes delivery fee in total price and total amount when paid delivery method is selected', async () => {
    const { POST: createOrder } = await import('@/app/api/orders/route');
    const { NextRequest } = await import('next/server');
    const { prisma } = await import('@/lib/prisma');

    vi.spyOn(prisma.product, 'findMany').mockResolvedValueOnce([
      {
        id: 'prod-cookie-1',
        title: 'Choco Cookie',
        price: '$10.00',
        state: 'exist',
      } as any,
    ]);

    vi.spyOn(prisma.deliveryMethod, 'findFirst').mockResolvedValueOnce({
      id: 'del-express',
      name: 'Livraison Express',
      price: 5.0,
      active: true,
    } as any);

    let createdOrderData: any = null;
    (vi.spyOn(prisma.order, 'create') as any).mockImplementationOnce(async (args: any) => {
      createdOrderData = args.data;
      return {
        id: 'ord-del-1',
        ...args.data,
        items: [],
      } as any;
    });

    const payload = {
      customerName: 'Karim Bouzid',
      customerPhone: '+213555333444',
      shippingAddress: '15 Rue Didouche, Alger',
      deliveryMethod: 'Livraison Express',
      items: [{ productId: 'prod-cookie-1', quantity: 2 }], // 2 * $10 = $20
    };

    const req = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await createOrder(req);
    expect(res.status).toBe(201);
    const body = await res.json();

    // 2 * $10 + $5 delivery fee = $25.00
    expect(body.totalAmount).toBe(25.0);
    expect(body.totalPrice).toBe('$25.00');
    expect(createdOrderData.totalAmount).toBe(25.0);
    expect(createdOrderData.totalPrice).toBe('$25.00');
    expect(createdOrderData.deliveryMethod).toBe('Livraison Express');
  });

  it('rejects unapproved or random delivery method with 400', async () => {
    const { POST: createOrder } = await import('@/app/api/orders/route');
    const { NextRequest } = await import('next/server');
    const { prisma } = await import('@/lib/prisma');

    vi.spyOn(prisma.product, 'findMany').mockResolvedValueOnce([
      {
        id: 'prod-cookie-1',
        title: 'Choco Cookie',
        price: '$10.00',
        state: 'exist',
      } as any,
    ]);

    // Database returns null because the delivery method is not approved or inactive
    vi.spyOn(prisma.deliveryMethod, 'findFirst').mockResolvedValueOnce(null);

    const payload = {
      customerName: 'Karim Bouzid',
      customerPhone: '+213555333444',
      shippingAddress: '15 Rue Didouche, Alger',
      deliveryMethod: 'FakeUnapprovedCourier999',
      items: [{ productId: 'prod-cookie-1', quantity: 1 }],
    };

    const req = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await createOrder(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Méthode de livraison non valide ou inactive');
  });
});

describe('Daily Sequence Counter Reset (Issue #113)', () => {
  it('resets daily counter to ORD-YYYYMMDD-001 with the start of each new calendar day', async () => {
    const { generateAtomicOrderReference, resetDailyOrderSequence } = await import('@/lib/order-sequence');

    if (resetDailyOrderSequence) {
      resetDailyOrderSequence();
    }

    const day1 = new Date('2026-10-15T08:00:00Z');
    const day1Later = new Date('2026-10-15T15:30:00Z');
    const day2 = new Date('2026-10-16T09:00:00Z');

    // Day 1 first order -> 001
    const refDay1_1 = await generateAtomicOrderReference(undefined, day1);
    expect(refDay1_1).toBe('ORD-20261015-001');

    // Day 1 second order -> 002
    const refDay1_2 = await generateAtomicOrderReference(undefined, day1Later);
    expect(refDay1_2).toBe('ORD-20261015-002');

    // Day 2 first order -> must RESET to 001 for the new day
    const refDay2_1 = await generateAtomicOrderReference(undefined, day2);
    expect(refDay2_1).toBe('ORD-20261016-001');
  });
});

