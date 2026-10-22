// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import Sidebar from '@/components/dashbord/Sidebar';
import BlogSection from '@/components/dashbord/BlogSection';
import BlogModal from '@/components/dashbord/BlogModal';
import BlogDeleteModal from '@/components/dashbord/BlogDeleteModal';
import { useDashboardStore } from '@/lib/dashboard-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BlogPostItem } from '@/components/blog/types';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
  useSession: () => ({ data: { user: { role: 'admin' } }, status: 'authenticated' }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard',
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

// Mock NotificationBell
vi.mock('@/components/dashbord/NotificationBell', () => ({
  default: () => <div data-testid="mock-notification-bell" />,
}));

const mockBlogPosts: BlogPostItem[] = [
  {
    id: 'post-1',
    title: 'Les secrets du levain naturel',
    slug: 'les-secrets-du-levain-naturel',
    summary: 'Comment réussir votre premier levain maison bio.',
    content: '<p>Le levain naturel apporte une saveur authentique.</p>',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
    category: 'Recettes',
    readingTime: 5,
    isPublished: true,
    publishedAt: '2026-03-15T10:00:00.000Z',
    createdAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-03-15T10:00:00.000Z',
  },
  {
    id: 'post-2',
    title: 'Farine T80 bio : Guide complet',
    slug: 'farine-t80-bio-guide-complet',
    summary: 'Tout sur les bienfaits de la mouture à la meule de pierre.',
    content: '<p>La farine T80 est idéale pour les pains de campagne.</p>',
    coverImage: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73',
    category: 'Ingrédients Bio',
    readingTime: 3,
    isPublished: false,
    publishedAt: null,
    createdAt: '2026-03-10T08:00:00.000Z',
    updatedAt: '2026-03-10T08:00:00.000Z',
  },
];

describe('Admin Dashboard Blog Integration', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset fetch
    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/admin/blog')) {
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'post-new', ...JSON.parse(options.body) }),
          });
        }
        if (options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'post-1', ...JSON.parse(options.body) }),
          });
        }
        if (options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              posts: mockBlogPosts,
              pagination: {
                page: 1,
                limit: 10,
                total: 2,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
              },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as any;

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Reset store
    useDashboardStore.setState({
      activeTab: 'products',
      isBlogModalOpen: false,
      blogModalMode: 'create',
      editingBlogPost: null,
      isBlogDeleteOpen: false,
      blogToDelete: null,
      toast: null,
    });
  });

  afterEach(() => {
    if (root && container) {
      act(() => {
        root!.unmount();
      });
      document.body.removeChild(container);
    }
  });

  it('1. Sidebar should include "Articles Blog" and switch activeTab to "blog"', async () => {
    await act(async () => {
      root!.render(
        <QueryClientProvider client={queryClient}>
          <Sidebar />
        </QueryClientProvider>
      );
    });

    const buttons = container!.querySelectorAll('button');
    const blogBtn = Array.from(buttons).find((b) => b.textContent?.includes('Articles Blog'));
    expect(blogBtn).toBeDefined();

    await act(async () => {
      blogBtn!.click();
    });

    expect(useDashboardStore.getState().activeTab).toBe('blog');
  });

  it('2. BlogSection should display posts, status badges (Publié / Brouillon), and trigger actions', async () => {
    await act(async () => {
      root!.render(
        <QueryClientProvider client={queryClient}>
          <BlogSection />
        </QueryClientProvider>
      );
    });

    // Wait for React Query to resolve
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(container!.textContent).toContain('Gestion des Articles de Blog');
    expect(container!.textContent).toContain('Les secrets du levain naturel');
    expect(container!.textContent).toContain('Farine T80 bio : Guide complet');
    expect(container!.textContent).toContain('Publié');
    expect(container!.textContent).toContain('Brouillon');

    // Click Nouvel Article
    const newBtn = Array.from(container!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Nouvel Article')
    );
    expect(newBtn).toBeDefined();

    await act(async () => {
      newBtn!.click();
    });

    expect(useDashboardStore.getState().isBlogModalOpen).toBe(true);
    expect(useDashboardStore.getState().blogModalMode).toBe('create');
  });

  it('3. BlogModal should allow creating a new post with slug generator and publish toggle', async () => {
    useDashboardStore.setState({
      isBlogModalOpen: true,
      blogModalMode: 'create',
    });

    await act(async () => {
      root!.render(
        <QueryClientProvider client={queryClient}>
          <BlogModal />
        </QueryClientProvider>
      );
    });

    expect(container!.textContent).toContain('Nouvel Article de Blog');

    const titleInput = container!.querySelector('#blog-title') as HTMLInputElement;
    const slugInput = container!.querySelector('#blog-slug') as HTMLInputElement;
    const summaryInput = container!.querySelector('#blog-summary') as HTMLTextAreaElement;
    const contentInput = container!.querySelector('#blog-content') as HTMLTextAreaElement;

    expect(titleInput).not.toBeNull();
    expect(slugInput).not.toBeNull();

    // Type title and check slug auto-generation
    await act(async () => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )!.set;
      nativeSetter!.call(titleInput, 'Brioche Maison Moelleuse');
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(titleInput.value).toBe('Brioche Maison Moelleuse');
    expect(slugInput.value).toBe('brioche-maison-moelleuse');

    // Fill summary, content, and direct image URL
    await act(async () => {
      const summarySetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )!.set;
      summarySetter!.call(summaryInput, 'Recette de grand-mère pour une brioche dorée');
      summaryInput.dispatchEvent(new Event('input', { bubbles: true }));
      summaryInput.dispatchEvent(new Event('change', { bubbles: true }));

      const contentSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )!.set;
      contentSetter!.call(contentInput, '<p>Mélanger la levure avec du lait tiède...</p>');
      contentInput.dispatchEvent(new Event('input', { bubbles: true }));
      contentInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Direct image URL
      const urlInput = container!.querySelector('input[type="url"]') as HTMLInputElement;
      if (urlInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )!.set;
        nativeSetter!.call(urlInput, 'https://example.com/brioche.jpg');
        urlInput.dispatchEvent(new Event('input', { bubbles: true }));
        urlInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Submit form
    const form = container!.querySelector('form');
    await act(async () => {
      form!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/blog',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('4. BlogDeleteModal should handle deleting a post', async () => {
    useDashboardStore.setState({
      isBlogDeleteOpen: true,
      blogToDelete: mockBlogPosts[0],
    });

    await act(async () => {
      root!.render(
        <QueryClientProvider client={queryClient}>
          <BlogDeleteModal />
        </QueryClientProvider>
      );
    });

    expect(container!.textContent).toContain('Supprimer l\'article');
    expect(container!.textContent).toContain('Les secrets du levain naturel');

    const deleteBtn = Array.from(container!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Supprimer définitivement')
    );
    expect(deleteBtn).toBeDefined();

    await act(async () => {
      deleteBtn!.click();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/blog/post-1',
      expect.objectContaining({
        method: 'DELETE',
      })
    );
    expect(useDashboardStore.getState().isBlogDeleteOpen).toBe(false);
  });
});
