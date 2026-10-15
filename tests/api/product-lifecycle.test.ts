import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GET as getProducts } from '@/app/api/products/route';
import { POST as createOrder } from '@/app/api/orders/route';
import { prisma } from '@/lib/prisma';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/config', () => ({
  getSiteConfig: vi.fn().mockImplementation((key) => {
    if (key === 'store_enabled') return Promise.resolve(true);
    return Promise.resolve(null);
  }),
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma: any = {
    product: {
      findMany: vi.fn(),
      count: vi.fn().mockResolvedValue(1),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    deliveryMethod: {
      findFirst: vi.fn().mockResolvedValue({ id: 'standard', name: 'Standard', price: 0, active: true }),
    },
    orderNotification: {
      create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
    },
    orderItem: {
      count: vi.fn().mockResolvedValue(0),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ seq: 1 }]),
    $executeRawUnsafe: vi.fn().mockResolvedValue(1),
    $transaction: vi.fn((arg) => (typeof arg === 'function' ? arg(mockPrisma) : Promise.resolve(arg))),
  };

  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

describe('Product Lifecycle & Catalog Integrity (Issues #10, #22, #25)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Issue #10: Filter Unpublished Products from Public Catalog', () => {
    it('applies where: { isPublished: true } and excludes unpublished products for public visitors', async () => {
      vi.spyOn(prisma.product, 'findMany').mockResolvedValueOnce([
        {
          id: 'prod-pub',
          title: 'Delice Chocolat',
          slug: 'delice-chocolat',
          price: '5.00',
          state: 'exist',
          visibility: 1,
          isPublished: true,
          tags: [],
        },
        {
          id: 'prod-unpub',
          title: 'Unpublished Secret Candy',
          slug: 'unpublished-secret-candy',
          price: '10.00',
          state: 'exist',
          visibility: 1,
          isPublished: false,
          tags: [],
        },
      ] as any);

      const req = new NextRequest('http://localhost/api/products?public=true');
      const res = await getProducts(req);
      expect(res.status).toBe(200);

      // Verify that query passed to Prisma includes where: { isPublished: true }
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
          }),
        })
      );

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      // Ensure unpublished product is absent from public response
      const ids = data.map((p: any) => p.id);
      expect(ids).toContain('prod-pub');
      expect(ids).not.toContain('prod-unpub');
    });
  });

  describe('Issue #22: Block Orders for "comingSoon" Products', () => {
    it('rejects order creation with 400 when product state is comingSoon', async () => {
      vi.spyOn(prisma.product, 'findMany').mockResolvedValueOnce([
        {
          id: 'prod-soon-1',
          title: 'Nougat de Montelimar (Soon)',
          price: '8.00',
          state: 'comingSoon',
          isPublished: true,
        } as any,
      ]);

      const payload = {
        customerName: 'Samir Benali',
        customerPhone: '+213555112233',
        shippingAddress: '10 Rue Didouche, Alger',
        items: [{ productId: 'prod-soon-1', quantity: 1 }],
      };

      const req = new NextRequest('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await createOrder(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBeDefined();
      expect(body.error.toLowerCase()).toMatch(/coming soon|bient[oô]t|ne peut pas/i);
    });
  });

  describe('Issue #25: Retain Historical OrderItems on Product Deletion', () => {
    it('enforces onDelete: Restrict on OrderItem -> Product relation in schema.prisma', () => {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

      const orderItemMatch = schemaContent.match(/model\s+OrderItem\s+\{([^}]+)\}/);
      expect(orderItemMatch).toBeTruthy();
      const orderItemBlock = orderItemMatch![1];

      // Must never have Cascade on product deletion
      expect(orderItemBlock).not.toMatch(/product\s+Product\s+@relation\([^)]*onDelete:\s*Cascade[^)]*\)/);
      // Must enforce Restrict to retain order history
      expect(orderItemBlock).toMatch(/product\s+Product\s+@relation\([^)]*onDelete:\s*Restrict[^)]*\)/);
    });
  });
});
