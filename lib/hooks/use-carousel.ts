import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string | null;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CarouselSlideInput {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string | null;
  order?: number;
}

export function useCarouselSlides() {
  return useQuery<CarouselSlide[]>({
    queryKey: ['carousel-slides'],
    queryFn: async () => {
      const res = await fetch('/api/carousel-slides');
      if (!res.ok) {
        throw new Error('Failed to load carousel slides');
      }
      return res.json();
    },
  });
}

export function useCreateCarouselSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CarouselSlideInput) => {
      const res = await fetch('/api/carousel-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create carousel slide');
      }

      return res.json() as Promise<CarouselSlide>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel-slides'] });
    },
  });
}

export function useUpdateCarouselSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CarouselSlideInput> }) => {
      const res = await fetch(`/api/carousel-slides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update carousel slide');
      }

      return res.json() as Promise<CarouselSlide>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel-slides'] });
    },
  });
}

export function useDeleteCarouselSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/carousel-slides/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete carousel slide');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel-slides'] });
    },
  });
}
