"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BlogPostItem } from '@/components/blog/types';

export interface UseBlogPostsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string; // 'all' | 'published' | 'draft'
}

export interface BlogListResponse {
  posts: BlogPostItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BlogPostInput {
  title: string;
  slug?: string;
  category: string;
  summary: string;
  content: string;
  coverImage: string;
  readingTime?: number;
  isPublished?: boolean;
  publishedAt?: string | null;
}

export function useBlogPosts(params: UseBlogPostsParams = {}) {
  const { page = 1, limit = 10, search = '', category = 'all', status = 'all' } = params;

  return useQuery<BlogListResponse>({
    queryKey: ['admin-blog-posts', { page, limit, search, category, status }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', page.toString());
      searchParams.set('limit', limit.toString());
      if (search.trim()) searchParams.set('search', search.trim());
      if (category && category !== 'all' && category !== 'Tous') {
        searchParams.set('category', category);
      }
      if (status && status !== 'all') {
        searchParams.set('status', status);
      }

      const res = await fetch(`/api/admin/blog?${searchParams.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch blog posts');
      }

      return res.json();
    },
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BlogPostInput) => {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create blog post');
      }

      return res.json() as Promise<BlogPostItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<BlogPostInput> }) => {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update blog post');
      }

      return res.json() as Promise<BlogPostItem>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete blog post');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}
