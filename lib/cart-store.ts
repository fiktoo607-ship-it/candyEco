import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartProduct {
  id: string;
  title: string;
  slug: string;
  price: string;
  imageUrl: string;
  category: string;
  description: string;
  state: string;
  limitBay?: number | null;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItemsCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        set((state) => {
          const minLimit = product.limitBay && product.limitBay > 0 ? product.limitBay : 1;
          const existingItem = state.items.find((item) => item.product.id === product.id);
          if (existingItem) {
            const nextQty = Math.min(100, existingItem.quantity + quantity);
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: nextQty }
                  : item
              ),
            };
          }
          const initialQty = Math.min(100, Math.max(minLimit, quantity));
          return { items: [...state.items, { product, quantity: initialQty }] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.product.id !== productId) return item;
            const minLimit = item.product.limitBay && item.product.limitBay > 0 ? item.product.limitBay : 1;
            const clampedQty = Math.min(100, Math.max(minLimit, quantity));
            return { ...item, quantity: clampedQty };
          }),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const priceNum = parseFloat(item.product.price.replace(/[^0-9.]/g, ''));
          return total + (isNaN(priceNum) ? 0 : priceNum) * item.quantity;
        }, 0);
      },
      getTotalItemsCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'candy-eco-cart',
    }
  )
);
