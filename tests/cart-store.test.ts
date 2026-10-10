// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, CartProduct } from '@/lib/cart-store';

describe('Cart Store & limitBay Alignment (Minimum Order Quantity)', () => {
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
    limitBay: 3, // Minimum 3 per order
  };

  it('enforces initial added quantity to be at least limitBay', () => {
    // When no quantity or a quantity less than 3 is provided, starts at minimum limitBay (3)
    useCartStore.getState().addItem(limitedProduct);

    const items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(3);
  });

  it('allows adding quantities greater than limitBay', () => {
    // Adding 6 directly should succeed (6 >= 3)
    useCartStore.getState().addItem(limitedProduct, 6);
    expect(useCartStore.getState().items[0].quantity).toBe(6);

    // Adding 2 more (6 + 2 = 8) should be 8 without upper restriction
    useCartStore.getState().addItem(limitedProduct, 2);
    expect(useCartStore.getState().items[0].quantity).toBe(8);
  });

  it('clamps updateQuantity to minimum limitBay and allows higher quantities', () => {
    useCartStore.getState().addItem(limitedProduct);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    // Attempt to decrease below limitBay (e.g. to 1 or 0) clamps to minimum 3
    useCartStore.getState().updateQuantity(limitedProduct.id, 1);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    useCartStore.getState().updateQuantity(limitedProduct.id, 0);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    // Updating to a quantity higher than limitBay (e.g. 10) is allowed
    useCartStore.getState().updateQuantity(limitedProduct.id, 10);
    expect(useCartStore.getState().items[0].quantity).toBe(10);
  });

  it('calculates total price accurately', () => {
    useCartStore.getState().addItem(limitedProduct, 4); // 4 * 25 = 100
    expect(useCartStore.getState().getTotalPrice()).toBe(100);
  });
});
