import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getBlogPosts } from '@/app/api/blog/route';
import { GET as getBlogPostBySlug } from '@/app/api/blog/[slug]/route';
import { POST as createBlogPost, GET as getAdminBlogPosts } from '@/app/api/admin/blog/route';
import { PUT as updateBlogPost, DELETE as deleteBlogPost, GET as getAdminBlogPostById } from '@/app/api/admin/blog/[id]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    blogPost: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
  };
});

describe('Blog API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPost = {
    id: 'post-1',
    title: 'Mon Premier Article',
    slug: 'mon-premier-article',
    summary: 'Un super résumé pour commencer',
    content: '<p>Contenu détaillé de l\'article.</p>',
    coverImage: 'https://example.com/image.jpg',
    category: 'Actualités',
    readingTime: 3,
    isPublished: true,
    publishedAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  describe('1. GET /api/blog (Public List)', () => {
    it('should return published posts with pagination info', async () => {
      vi.mocked(prisma.blogPost.count).mockResolvedValue(1);
      vi.mocked(prisma.blogPost.findMany).mockResolvedValue([mockPost]);

      const req = new NextRequest('http://localhost:3000/api/blog?page=1&limit=10');
      const res = await getBlogPosts(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.posts).toHaveLength(1);
      expect(data.posts[0].slug).toBe('mon-premier-article');
      expect(data.pagination.total).toBe(1);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.totalPages).toBe(1);
      expect(res.headers.get('x-total-count')).toBe('1');
    });

    it('should filter by category and search query', async () => {
      vi.mocked(prisma.blogPost.count).mockResolvedValue(1);
      vi.mocked(prisma.blogPost.findMany).mockResolvedValue([mockPost]);

      const req = new NextRequest('http://localhost:3000/api/blog?category=Actualités&q=Premier');
      const res = await getBlogPosts(req);

      expect(res.status).toBe(200);
      expect(prisma.blogPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { isPublished: true },
              expect.objectContaining({
                category: { equals: 'Actualités', mode: 'insensitive' },
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('2. GET /api/blog/[slug] (Public Single Post)', () => {
    it('should return 200 with post for valid published slug', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(mockPost);

      const req = new NextRequest('http://localhost:3000/api/blog/mon-premier-article');
      const res = await getBlogPostBySlug(req, {
        params: Promise.resolve({ slug: 'mon-premier-article' }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.title).toBe(mockPost.title);
    });

    it('should return 404 if post is not found', async () => {
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/blog/not-found');
      const res = await getBlogPostBySlug(req, {
        params: Promise.resolve({ slug: 'not-found' }),
      });

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-admin if post is draft', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
        ...mockPost,
        isPublished: false,
      });

      const req = new NextRequest('http://localhost:3000/api/blog/draft-post');
      const res = await getBlogPostBySlug(req, {
        params: Promise.resolve({ slug: 'draft-post' }),
      });

      expect(res.status).toBe(404);
    });

    it('should allow admin to preview draft post by slug', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue({
        ...mockPost,
        isPublished: false,
      });

      const req = new NextRequest('http://localhost:3000/api/blog/draft-post');
      const res = await getBlogPostBySlug(req, {
        params: Promise.resolve({ slug: 'draft-post' }),
      });

      expect(res.status).toBe(200);
    });
  });

  describe('3. POST /api/admin/blog (Admin Creation)', () => {
    it('should return 401 if unauthenticated or not admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });
      const res = await createBlogPost(req);

      expect(res.status).toBe(401);
    });

    it('should return 400 on invalid validation body', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify({ title: '' }), // Missing required fields
      });
      const res = await createBlogPost(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Données invalides');
      expect(data.details).toBeDefined();
    });

    it('should create post and auto-slugify title if slug omitted', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);
      (prisma.blogPost.create as any).mockImplementation(async (args: any) => ({
        id: 'post-new-1',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const payload = {
        title: 'Nouveau Délicieux Bonbon !',
        summary: 'Découvrez notre nouveauté',
        content: 'Contenu complet ici',
        coverImage: 'https://example.com/bonbon.jpg',
        category: 'Nouveautés',
        isPublished: true,
      };

      const req = new NextRequest('http://localhost:3000/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const res = await createBlogPost(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.slug).toBe('nouveau-delicieux-bonbon');
      expect(prisma.blogPost.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'nouveau-delicieux-bonbon',
            title: 'Nouveau Délicieux Bonbon !',
            isPublished: true,
          }),
        })
      );
    });

    it('should return 400 if slug already exists', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(mockPost);

      const payload = {
        title: 'Mon Premier Article',
        slug: 'mon-premier-article',
        summary: 'Résumé',
        content: 'Contenu',
        coverImage: 'https://example.com/img.jpg',
        category: 'Cat',
      };

      const req = new NextRequest('http://localhost:3000/api/admin/blog', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const res = await createBlogPost(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Un article avec ce slug existe déjà');
    });
  });

  describe('4. PUT /api/admin/blog/[id] (Admin Update)', () => {
    it('should return 401 if non-admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
      } as any);

      const req = new NextRequest('http://localhost:3000/api/admin/blog/post-1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });
      const res = await updateBlogPost(req, {
        params: Promise.resolve({ id: 'post-1' }),
      });

      expect(res.status).toBe(401);
    });

    it('should return 404 if post does not exist', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/blog/unknown', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      });
      const res = await updateBlogPost(req, {
        params: Promise.resolve({ id: 'unknown' }),
      });

      expect(res.status).toBe(404);
    });

    it('should return 400 if slug conflicts with another post', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);
      vi.mocked(prisma.blogPost.findUnique)
        .mockResolvedValueOnce(mockPost) // existing post for id
        .mockResolvedValueOnce({ ...mockPost, id: 'different-id', slug: 'existing-slug' }); // slug conflict

      const req = new NextRequest('http://localhost:3000/api/admin/blog/post-1', {
        method: 'PUT',
        body: JSON.stringify({ slug: 'existing-slug' }),
      });
      const res = await updateBlogPost(req, {
        params: Promise.resolve({ id: 'post-1' }),
      });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Un article avec ce slug existe déjà');
    });

    it('should update post successfully', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(mockPost);
      vi.mocked(prisma.blogPost.update).mockResolvedValue({
        ...mockPost,
        title: 'Titre Modifié',
      });

      const req = new NextRequest('http://localhost:3000/api/admin/blog/post-1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Titre Modifié' }),
      });
      const res = await updateBlogPost(req, {
        params: Promise.resolve({ id: 'post-1' }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.title).toBe('Titre Modifié');
      expect(prisma.blogPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'post-1' },
          data: expect.objectContaining({
            title: 'Titre Modifié',
          }),
        })
      );
    });
  });

  describe('5. DELETE /api/admin/blog/[id] (Admin Deletion)', () => {
    it('should return 401 if unauthenticated or non-admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/blog/post-1', {
        method: 'DELETE',
      });
      const res = await deleteBlogPost(req, {
        params: Promise.resolve({ id: 'post-1' }),
      });

      expect(res.status).toBe(401);
    });

    it('should return 404 if post does not exist', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/admin/blog/unknown', {
        method: 'DELETE',
      });
      const res = await deleteBlogPost(req, {
        params: Promise.resolve({ id: 'unknown' }),
      });

      expect(res.status).toBe(404);
    });

    it('should delete post and return success', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);
      vi.mocked(prisma.blogPost.findUnique).mockResolvedValue(mockPost);
      vi.mocked(prisma.blogPost.delete).mockResolvedValue(mockPost);

      const req = new NextRequest('http://localhost:3000/api/admin/blog/post-1', {
        method: 'DELETE',
      });
      const res = await deleteBlogPost(req, {
        params: Promise.resolve({ id: 'post-1' }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.blogPost.delete).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
    });
  });
});
