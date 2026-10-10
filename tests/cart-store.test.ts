// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore, CartProduct } from '@/lib/cart-store';

describe('Cart Store & limitBay Minimum Quantity Alignment', () => {
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

  it('enforces minimum limitBay when adding lower quantity, but allows higher quantity', () => {
    // Attempting to add 1 when minimum is 3 -> defaults to 3
    useCartStore.getState().addItem(limitedProduct, 1);
    let items = useCartStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(3);

    useCartStore.getState().clearCart();

    // Adding 5 when minimum is 3 -> allowed to buy 5 (or more)
    useCartStore.getState().addItem(limitedProduct, 5);
    items = useCartStore.getState().items;
    expect(items[0].quantity).toBe(5);
  });

  it('allows cumulative additions above limitBay', () => {
    useCartStore.getState().addItem(limitedProduct, 3);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    // Adding 2 more (3 + 2 = 5) should increase to 5
    useCartStore.getState().addItem(limitedProduct, 2);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('allows increasing quantity above limitBay, clamps lower updates to minimum limitBay', () => {
    useCartStore.getState().addItem(limitedProduct, 3);

    // Increasing to 12 (above minimum 3) is allowed
    useCartStore.getState().updateQuantity(limitedProduct.id, 12);
    expect(useCartStore.getState().items[0].quantity).toBe(12);

    // Attempting to drop below minimum (e.g. 1 or 0) clamps to minimum limitBay (3)
    useCartStore.getState().updateQuantity(limitedProduct.id, 1);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it('calculates total price accurately', () => {
    useCartStore.getState().addItem(limitedProduct, 3); // 3 * 25 = 75
    expect(useCartStore.getState().getTotalPrice()).toBe(75);
  });
});
