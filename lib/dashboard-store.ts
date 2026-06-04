import { create } from 'zustand';
import { Product } from './hooks/use-products';

interface DashboardState {
  activeTab: 'products' | 'orders';
  setActiveTab: (tab: 'products' | 'orders') => void;

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

  // Modals & Controls
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

  // Form Fields
  title: string;
  setTitle: (title: string) => void;
  slug: string;
  setSlug: (slug: string) => void;
  price: string;
  setPrice: (price: string) => void;
  imageUrl: string;
  setImageUrl: (url: string) => void;
  uploadError: string | null;
  setUploadError: (err: string | null) => void;
  description: string;
  setDescription: (desc: string) => void;
  story: string;
  setStory: (story: string) => void;
  limitBay: string;
  setLimitBay: (limit: string) => void;
  state: 'exist' | 'outofStock' | 'commingSoun';
  setState: (state: 'exist' | 'outofStock' | 'commingSoun') => void;
  publishedAt: string;
  setPublishedAt: (date: string) => void;
  category: string;
  setCategory: (cat: string) => void;
  visibility: string;
  setVisibility: (visibility: string) => void;

  // Helpers to open/close modal and delete
  openCreate: (defaultCategory: string) => void;
  openEdit: (product: Product) => void;
  openDelete: (product: Product) => void;
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

  title: '',
  setTitle: (title) => set({ title }),
  slug: '',
  setSlug: (slug) => set({ slug }),
  price: '',
  setPrice: (price) => set({ price }),
  imageUrl: '',
  setImageUrl: (imageUrl) => set({ imageUrl }),
  uploadError: null,
  setUploadError: (uploadError) => set({ uploadError }),
  description: '',
  setDescription: (description) => set({ description }),
  story: '',
  setStory: (story) => set({ story }),
  limitBay: '',
  setLimitBay: (limitBay) => set({ limitBay }),
  state: 'exist',
  setState: (state) => set({ state }),
  publishedAt: '',
  setPublishedAt: (publishedAt) => set({ publishedAt }),
  category: '',
  setCategory: (category) => set({ category }),
  visibility: '0',
  setVisibility: (visibility) => set({ visibility }),

  openCreate: (defaultCategory) => set({
    modalMode: 'create',
    editingId: null,
    title: '',
    slug: '',
    price: '',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600',
    description: '',
    story: '',
    limitBay: '',
    state: 'exist',
    publishedAt: new Date().toISOString().substring(0, 10),
    category: defaultCategory,
    visibility: '0',
    isModalOpen: true,
  }),

  openEdit: (p) => set({
    modalMode: 'edit',
    editingId: p.id,
    title: p.title,
    slug: p.slug,
    price: p.price,
    imageUrl: p.imageUrl,
    description: p.description,
    story: p.story,
    limitBay: p.limitBay !== null ? String(p.limitBay) : '',
    state: p.state as 'exist' | 'outofStock' | 'commingSoun',
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString().substring(0, 10) : '',
    category: p.category,
    visibility: String(p.visibility ?? 0),
    isModalOpen: true,
  }),

  openDelete: (p) => set({
    productToDelete: p,
    isDeleteOpen: true,
  }),
}));
