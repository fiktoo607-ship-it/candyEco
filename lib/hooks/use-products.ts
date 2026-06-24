import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

export function useProducts(isDashboard?: boolean) {
  return useQuery<Product[]>({
    queryKey: ['products', isDashboard],
    queryFn: async () => {
      const url = isDashboard ? '/api/products?dashboard=true' : '/api/products';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to load products');
      }
      return res.json();
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
