// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, CartProduct } from '@/lib/cart-store';

describe('Cart Store & limitBay Alignment (Issue #8)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  const limitedProduct: CartProduct = {
    id: 'prod-limit-3',
    title: 'Limited Chocolate Box',
    slug: 'limited-chocolate-box',
    price: '$25.00',
    imageUrl: '/choco.jpg',
    category: 'gâteau',
    description: 'Delicious chocolate',
    state: 'exist',
    limitBay: 3, // Maximum 3 per order
  };

  it('clamps initial added quantity to limitBay', () => {
    // Attempting to add 5 of a product limited to 3
    useCartStore.getState().addItem(limitedProduct, 5);

    const items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(3);
  });

  it('clamps cumulative additions to limitBay', () => {
    useCartStore.getState().addItem(limitedProduct, 2);
    expect(useCartStore.getState().items[0].quantity).toBe(2);

    // Adding 2 more (2 + 2 = 4) should be clamped to 3
    useCartStore.getState().addItem(limitedProduct, 2);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it('clamps updateQuantity to limitBay and minimum 1', () => {
    useCartStore.getState().addItem(limitedProduct, 1);

    // Attempt to update to 10
    useCartStore.getState().updateQuantity(limitedProduct.id, 10);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    // Attempt to update to 0
    useCartStore.getState().updateQuantity(limitedProduct.id, 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });

  it('calculates total price accurately', () => {
    useCartStore.getState().addItem(limitedProduct, 2); // 2 * 25 = 50
    expect(useCartStore.getState().getTotalPrice()).toBe(50);
  });
});
