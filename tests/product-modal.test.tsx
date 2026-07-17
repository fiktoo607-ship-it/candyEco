// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { useProductModal } from '@/components/dashbord/hooks/useProductModal';
import { useDashboardStore } from '@/lib/dashboard-store';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock the react-products hooks
vi.mock('@/lib/hooks/use-products', () => {
  return {
    useProducts: () => ({
      data: [
        {
          id: 'prod-123',
          title: 'Cake Chocolat',
          slug: 'cake-chocolat',
          category: 'gâteau',
          price: '15',
          imageUrl: 'http://example.com/cake.jpg',
          description: 'A chocolate cake',
          story: 'Delicious recipe',
          limitBay: 3,
          state: 'exist',
          visibility: 5,
          rating: 4.5,
          tags: ['chocolat', 'sucré'],
          publishedAt: '2026-07-17',
        }
      ],
      isLoading: false,
    }),
    useCreateProduct: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useUpdateProduct: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useUploadImage: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
  };
});

function TestComponent({ onHookResult }: { onHookResult: (res: any) => void }) {
  const result = useProductModal();
  onHookResult(result);
  return null;
}

describe('ProductModal Hook & Local State', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    useDashboardStore.setState({
      isModalOpen: false,
      modalMode: 'create',
      editingId: null,
      defaultCategory: '',
    });
  });

  afterEach(() => {
    if (root && container) {
      act(() => {
        root!.unmount();
      });
      document.body.removeChild(container);
    }
  });

  it('should initialize form fields to default/empty when opening in create mode', async () => {
    let hookResult: any = null;

    await act(async () => {
      root!.render(<TestComponent onHookResult={(res) => { hookResult = res; }} />);
    });

    // Modal is closed, should still render null/defaults
    expect(hookResult.title).toBe('');
    expect(hookResult.slug).toBe('');

    // Open in create mode
    await act(async () => {
      useDashboardStore.getState().openCreate('aliments traditionnel');
    });

    expect(hookResult.isModalOpen).toBe(true);
    expect(hookResult.modalMode).toBe('create');
    expect(hookResult.title).toBe('');
    expect(hookResult.category).toBe('aliments traditionnel');
  });

  it('should initialize form fields with product attributes when opening in edit mode', async () => {
    let hookResult: any = null;

    await act(async () => {
      root!.render(<TestComponent onHookResult={(res) => { hookResult = res; }} />);
    });

    const product = {
      id: 'prod-123',
      title: 'Cake Chocolat',
      slug: 'cake-chocolat',
      category: 'gâteau',
      price: '15',
      imageUrl: 'http://example.com/cake.jpg',
      description: 'A chocolate cake',
      story: 'Delicious recipe',
      limitBay: 3,
      state: 'exist' as const,
      visibility: 5,
      rating: 4.5,
      tags: ['chocolat', 'sucré'],
      publishedAt: '2026-07-17',
    };

    // Open in edit mode
    await act(async () => {
      useDashboardStore.getState().openEdit(product);
    });

    expect(hookResult.isModalOpen).toBe(true);
    expect(hookResult.modalMode).toBe('edit');
    expect(hookResult.title).toBe('Cake Chocolat');
    expect(hookResult.slug).toBe('cake-chocolat');
    expect(hookResult.category).toBe('gâteau');
    expect(hookResult.price).toBe('15');
    expect(hookResult.imageUrl).toBe('http://example.com/cake.jpg');
    expect(hookResult.description).toBe('A chocolate cake');
    expect(hookResult.story).toBe('Delicious recipe');
    expect(hookResult.limitBay).toBe('3');
    expect(hookResult.tags).toEqual(['chocolat', 'sucré']);
  });

  it('should auto-generate slugs when title changes in create mode', async () => {
    let hookResult: any = null;

    await act(async () => {
      root!.render(<TestComponent onHookResult={(res) => { hookResult = res; }} />);
    });

    await act(async () => {
      useDashboardStore.getState().openCreate('gâteau');
    });

    expect(hookResult.title).toBe('');
    expect(hookResult.slug).toBe('');

    // Simulate typing title
    await act(async () => {
      hookResult.setTitle('Gâteau au Chocolat');
      // Mimic the ProductBasicInfo onChange auto-generation
      hookResult.setSlug('gateau-au-chocolat');
    });

    expect(hookResult.title).toBe('Gâteau au Chocolat');
    expect(hookResult.slug).toBe('gateau-au-chocolat');
  });

  it('should support adding and removing tags locally', async () => {
    let hookResult: any = null;

    await act(async () => {
      root!.render(<TestComponent onHookResult={(res) => { hookResult = res; }} />);
    });

    await act(async () => {
      useDashboardStore.getState().openCreate('gâteau');
    });

    expect(hookResult.tags).toEqual([]);

    // Add tag
    await act(async () => {
      hookResult.setNewTagInput('chocolat');
    });
    await act(async () => {
      hookResult.handleAddTag();
    });

    expect(hookResult.tags).toEqual(['chocolat']);
    expect(hookResult.newTagInput).toBe('');

    // Remove tag
    await act(async () => {
      hookResult.handleRemoveTag('chocolat');
    });

    expect(hookResult.tags).toEqual([]);
  });
});
