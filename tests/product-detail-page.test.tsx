import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProductDetailPage, { generateMetadata } from '@/app/our-product/[slug]/page';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('@/components/site-header', () => ({
  default: () => <header data-testid="site-header" />,
}));

vi.mock('@/components/site-footer', () => ({
  default: () => <footer data-testid="site-footer" />,
}));

vi.mock('@/components/product-details/ProductDetails', () => ({
  default: ({ product }: { product: any }) => (
    <div data-testid="product-details">{product.title}</div>
  ),
}));

describe('Product Detail Page - Visibility & Publish Rules (Issue #145, #144)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseProduct = {
    id: 'prod-123',
    title: 'Croissant Beurre',
    slug: 'croissant-beurre',
    price: '3.50',
    category: 'viennoiserie',
    imageUrl: 'https://example.com/croissant.jpg',
    description: 'Croissant traditionnel',
    story: 'Notre histoire',
    limitBay: 10,
    state: 'exist',
    visibility: 0, // Default visibility 0 must display
    isPublished: true,
    publishedAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    tags: [{ name: 'artisan' }],
  };

  it('renders product details for an active product with default visibility 0', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(baseProduct as any);

    const jsx = await ProductDetailPage({ params: Promise.resolve({ slug: 'croissant-beurre' }) });
    expect(jsx).toBeDefined();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('triggers notFound() when product is draft (state = draft)', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      ...baseProduct,
      state: 'draft',
    } as any);

    await ProductDetailPage({ params: Promise.resolve({ slug: 'croissant-beurre' }) });
    expect(notFound).toHaveBeenCalled();
  });

  it('triggers notFound() when isPublished is false', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      ...baseProduct,
      isPublished: false,
    } as any);

    await ProductDetailPage({ params: Promise.resolve({ slug: 'croissant-beurre' }) });
    expect(notFound).toHaveBeenCalled();
  });

  it('triggers notFound() when publishedAt is in the future', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      ...baseProduct,
      publishedAt: new Date(Date.now() + 86400000), // tomorrow
    } as any);

    await ProductDetailPage({ params: Promise.resolve({ slug: 'croissant-beurre' }) });
    expect(notFound).toHaveBeenCalled();
  });

  it('generateMetadata returns not found title when product is unpublished (isPublished = false)', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce({
      ...baseProduct,
      isPublished: false,
    } as any);

    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'croissant-beurre' }) });
    expect(meta.title).toBeDefined();
    expect(meta.title).not.toBe(baseProduct.title);
  });
});
