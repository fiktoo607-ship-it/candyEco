"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

export interface Product {
  id: string;
  title: string;
  slug: string;
  category: string;
  price: string;
  imageUrl: string;
  description: string;
  story: string;
  limitBay: number | null;
  state: 'exist' | 'outofStock' | 'commingSoun';
  visibility: number;
  rating?: number;
  ratingCount?: number;
  tags: string[];
  publishedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductInput {
  title: string;
  slug: string;
  price: string;
  category: string;
  imageUrl: string;
  description: string;
  story: string;
  limitBay: number | null;
  state: 'exist' | 'outofStock' | 'commingSoun';
  visibility: number;
  rating?: number;
  ratingCount?: number;
  tags?: string[];
  publishedAt: string | null;
}

export interface UseProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: string;
  isDashboard?: boolean;
  tags?: string | string[];
  enabled?: boolean;
  initialData?: PaginatedProducts;
}

export type PaginatedProducts = Product[] & { total?: number };
export type InfiniteProductsResult = Product[] & { hasNextPage?: boolean };

export function useProducts(params?: boolean | UseProductsParams) {
  const resolvedParams: UseProductsParams = typeof params === 'boolean'
    ? { isDashboard: params }
    : params || {};

  return useQuery<PaginatedProducts>({
    queryKey: ['products', resolvedParams],
    enabled: resolvedParams.enabled,
    initialData: resolvedParams.initialData,
    queryFn: async () => {
      let url = '/api/products';
      const queryParts: string[] = [];

      if (resolvedParams.isDashboard) {
        queryParts.push('dashboard=true');
      }
      if (resolvedParams.page) {
        queryParts.push(`page=${resolvedParams.page}`);
      }
      if (resolvedParams.limit) {
        queryParts.push(`limit=${resolvedParams.limit}`);
      }
      if (resolvedParams.search) {
        queryParts.push(`search=${encodeURIComponent(resolvedParams.search)}`);
      }
      if (resolvedParams.category && resolvedParams.category !== 'all') {
        queryParts.push(`category=${encodeURIComponent(resolvedParams.category)}`);
      }
      if (resolvedParams.sortBy) {
        queryParts.push(`sortBy=${encodeURIComponent(resolvedParams.sortBy)}`);
      }
      if (resolvedParams.tags) {
        const tagsStr = Array.isArray(resolvedParams.tags) ? resolvedParams.tags.join(',') : resolvedParams.tags;
        queryParts.push(`tags=${encodeURIComponent(tagsStr)}`);
      }

      if (queryParts.length > 0) {
        url += '?' + queryParts.join('&');
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to load products');
      }

      const totalHeader = res.headers.get('x-total-count');
      const data = await res.json() as Product[];
      const total = totalHeader ? parseInt(totalHeader, 10) : data.length;

      const result = [...data] as PaginatedProducts;
      result.total = total;
      return result;
    },
  });
}

export function useInfiniteProducts(params?: Omit<UseProductsParams, 'page'>) {
  const limit = params?.limit ?? 10;
  return useInfiniteQuery<InfiniteProductsResult>({
    queryKey: ['products-infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      let url = '/api/products';
      const queryParts: string[] = [`page=${pageParam}`, `limit=${limit}`];

      if (params?.isDashboard) {
        queryParts.push('dashboard=true');
      }
      if (params?.search) {
        queryParts.push(`search=${encodeURIComponent(params.search)}`);
      }
      if (params?.category && params.category !== 'all') {
        queryParts.push(`category=${encodeURIComponent(params.category)}`);
      }
      if (params?.sortBy) {
        queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
      }
      if (params?.tags) {
        const tagsStr = Array.isArray(params.tags) ? params.tags.join(',') : params.tags;
        queryParts.push(`tags=${encodeURIComponent(tagsStr)}`);
      }

      url += '?' + queryParts.join('&');

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to load products');
      }
      const data = await res.json() as Product[];
      const hasNextHeader = res.headers.get('x-has-next-page');
      const hasNext = hasNextHeader === 'true';

      const result = [...data] as InfiniteProductsResult;
      result.hasNextPage = hasNext;
      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return (lastPage as any).hasNextPage ? allPages.length + 1 : undefined;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProductInput) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create product');
      }

      return res.json() as Promise<Product>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ProductInput }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update product');
      }

      return res.json() as Promise<Product>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete product');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Upload failed');
      }

      return res.json() as Promise<{ url: string; publicId: string }>;
    },
  });
}
