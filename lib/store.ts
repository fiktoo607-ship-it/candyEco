import { create } from 'zustand';
import type { ProductCategory } from './site-data';

type BakeryState = {
  activeCategory: ProductCategory;
  mobileMenuOpen: boolean;
  setActiveCategory: (category: ProductCategory) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
};

export const useBakeryStore = create<BakeryState>((set) => ({
  activeCategory: 'all',
  mobileMenuOpen: false,
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  closeMobileMenu: () => set({ mobileMenuOpen: false })
}));