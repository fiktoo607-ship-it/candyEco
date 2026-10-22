import { create } from 'zustand';
import { Product } from './hooks/use-products';
import { BlogPostItem } from '@/components/blog/types';

export type DashboardTab = 'products' | 'orders' | 'cms' | 'qna' | 'users' | 'delivery-methods' | 'profile' | 'blog';

interface DashboardState {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;

  // Orders Search & Pagination
  orderSearchQuery: string;
  setOrderSearchQuery: (query: string) => void;
  orderStatusFilter: string;
  setOrderStatusFilter: (filter: string) => void;
  orderCurrentPage: number;
  setOrderCurrentPage: (page: number) => void;

  // Products Search & Pagination
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;

  // Products Modals & Controls
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  modalMode: 'create' | 'edit';
  setModalMode: (mode: 'create' | 'edit') => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;

  isDeleteOpen: boolean;
  setIsDeleteOpen: (open: boolean) => void;
  productToDelete: Product | null;
  setProductToDelete: (product: Product | null) => void;

  defaultCategory: string;

  // Helpers to open/close product modal and delete
  openCreate: (defaultCategory: string) => void;
  openEdit: (product: Product) => void;
  openDelete: (product: Product) => void;

  // Blog Modals & Controls
  isBlogModalOpen: boolean;
  setIsBlogModalOpen: (open: boolean) => void;
  blogModalMode: 'create' | 'edit';
  setBlogModalMode: (mode: 'create' | 'edit') => void;
  editingBlogPost: BlogPostItem | null;
  setEditingBlogPost: (post: BlogPostItem | null) => void;

  isBlogDeleteOpen: boolean;
  setIsBlogDeleteOpen: (open: boolean) => void;
  blogToDelete: BlogPostItem | null;
  setBlogToDelete: (post: BlogPostItem | null) => void;

  // Blog helpers
  openCreateBlog: () => void;
  openEditBlog: (post: BlogPostItem) => void;
  openDeleteBlog: (post: BlogPostItem) => void;

  // Toast notifications
  toast: { message: string; type: 'success' | 'error' } | null;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: 'products',
  setActiveTab: (activeTab) => set({ activeTab }),

  orderSearchQuery: '',
  setOrderSearchQuery: (orderSearchQuery) => set({ orderSearchQuery }),
  orderStatusFilter: '',
  setOrderStatusFilter: (orderStatusFilter) => set({ orderStatusFilter }),
  orderCurrentPage: 1,
  setOrderCurrentPage: (orderCurrentPage) => set({ orderCurrentPage }),

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  currentPage: 1,
  setCurrentPage: (currentPage) => set({ currentPage }),

  isModalOpen: false,
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  modalMode: 'create',
  setModalMode: (modalMode) => set({ modalMode }),
  editingId: null,
  setEditingId: (editingId) => set({ editingId }),

  isDeleteOpen: false,
  setIsDeleteOpen: (isDeleteOpen) => set({ isDeleteOpen }),
  productToDelete: null,
  setProductToDelete: (productToDelete) => set({ productToDelete }),

  defaultCategory: '',

  openCreate: (defaultCategory) => set({
    modalMode: 'create',
    editingId: null,
    defaultCategory,
    isModalOpen: true,
  }),

  openEdit: (p) => set({
    modalMode: 'edit',
    editingId: p.id,
    isModalOpen: true,
  }),

  openDelete: (p) => set({
    productToDelete: p,
    isDeleteOpen: true,
  }),

  // Blog state
  isBlogModalOpen: false,
  setIsBlogModalOpen: (isBlogModalOpen) => set({ isBlogModalOpen }),
  blogModalMode: 'create',
  setBlogModalMode: (blogModalMode) => set({ blogModalMode }),
  editingBlogPost: null,
  setEditingBlogPost: (editingBlogPost) => set({ editingBlogPost }),

  isBlogDeleteOpen: false,
  setIsBlogDeleteOpen: (isBlogDeleteOpen) => set({ isBlogDeleteOpen }),
  blogToDelete: null,
  setBlogToDelete: (blogToDelete) => set({ blogToDelete }),

  openCreateBlog: () => set({
    blogModalMode: 'create',
    editingBlogPost: null,
    isBlogModalOpen: true,
  }),

  openEditBlog: (post) => set({
    blogModalMode: 'edit',
    editingBlogPost: post,
    isBlogModalOpen: true,
  }),

  openDeleteBlog: (post) => set({
    blogToDelete: post,
    isBlogDeleteOpen: true,
  }),

  toast: null,
  setToast: (toast) => set({ toast }),
  showToast: (message, type) => {
    set({ toast: { message, type } });
  },
}));
