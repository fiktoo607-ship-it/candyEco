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
      addItem: (product, quantity) => {
        set((state) => {
          const minLimit = product.limitBay && product.limitBay > 1 ? product.limitBay : 1;
          const existingItem = state.items.find((item) => item.product.id === product.id);
          if (existingItem) {
            const addQty = quantity !== undefined ? quantity : 1;
            const nextQty = existingItem.quantity + addQty;
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: nextQty }
                  : item
              ),
            };
          }
          const initialQty = quantity !== undefined ? Math.max(minLimit, quantity) : minLimit;
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
            const minLimit = item.product.limitBay && item.product.limitBay > 1 ? item.product.limitBay : 1;
            const clampedQty = Math.max(minLimit, quantity);
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
        return get().items.length;
      },
    }),
    {
      name: 'candy-eco-cart',
    }
  )
);
