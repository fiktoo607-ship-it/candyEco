import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getSlides, POST as createSlide } from '@/app/api/carousel-slides/route';
import { PUT as updateSlide, DELETE as deleteSlide } from '@/app/api/carousel-slides/[id]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Mock Cloudinary
vi.mock('@/lib/cloudinary', () => ({
  deleteImage: vi.fn().mockResolvedValue({ result: 'ok' }),
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    carouselSlide: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
  };
});

describe('Carousel Slides API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSlide = {
    id: 'slide-uuid-1',
    title: 'New Collection',
    description: 'Our new bakery items are here!',
    imageUrl: 'https://res.cloudinary.com/dummy/slide1.jpg',
    linkUrl: '/our-product/gateau',
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSlideJson = JSON.parse(JSON.stringify(mockSlide));

  describe('GET /api/carousel-slides', () => {
    it('should retrieve all slides sorted by order', async () => {
      vi.mocked(prisma.carouselSlide.findMany).mockResolvedValueOnce([mockSlide]);

      const response = await getSlides();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual([mockSlideJson]);
      expect(prisma.carouselSlide.findMany).toHaveBeenCalledWith({
        orderBy: { order: 'asc' },
      });
    });
  });

  describe('POST /api/carousel-slides', () => {
    it('should validate and create a new slide successfully', async () => {
      vi.mocked(prisma.carouselSlide.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prisma.carouselSlide.create).mockResolvedValueOnce(mockSlide);

      const req = new NextRequest('http://localhost/api/carousel-slides', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Collection',
          description: 'Our new bakery items are here!',
          imageUrl: 'https://res.cloudinary.com/dummy/slide1.jpg',
          linkUrl: '/our-product/gateau',
        }),
      });

      const response = await createSlide(req);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toEqual(mockSlideJson);
      expect(prisma.carouselSlide.create).toHaveBeenCalledWith({
        data: {
          title: 'New Collection',
          description: 'Our new bakery items are here!',
          imageUrl: 'https://res.cloudinary.com/dummy/slide1.jpg',
          linkUrl: '/our-product/gateau',
          order: 0,
        },
      });
    });

    it('should return 400 error when title or imageUrl is missing', async () => {
      const req = new NextRequest('http://localhost/api/carousel-slides', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Missing title and image',
        }),
      });

      const response = await createSlide(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Title and Image URL are required');
    });
  });

  describe('PUT /api/carousel-slides/[id]', () => {
    it('should update slide fields successfully', async () => {
      vi.mocked(prisma.carouselSlide.findUnique).mockResolvedValueOnce(mockSlide);
      vi.mocked(prisma.carouselSlide.update).mockResolvedValueOnce({
        ...mockSlide,
        title: 'Updated Title',
      });

      const req = new NextRequest('http://localhost/api/carousel-slides/slide-uuid-1', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated Title',
        }),
      });

      const response = await updateSlide(req, { params: Promise.resolve({ id: 'slide-uuid-1' }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.title).toBe('Updated Title');
      expect(prisma.carouselSlide.update).toHaveBeenCalledWith({
        where: { id: 'slide-uuid-1' },
        data: {
          title: 'Updated Title',
          description: mockSlide.description,
          imageUrl: mockSlide.imageUrl,
          linkUrl: mockSlide.linkUrl,
          order: mockSlide.order,
        },
      });
    });
  });

  describe('DELETE /api/carousel-slides/[id]', () => {
    it('should delete slide successfully', async () => {
      vi.mocked(prisma.carouselSlide.findUnique).mockResolvedValueOnce(mockSlide);
      vi.mocked(prisma.carouselSlide.delete).mockResolvedValueOnce(mockSlide);

      const req = new NextRequest('http://localhost/api/carousel-slides/slide-uuid-1', {
        method: 'DELETE',
      });

      const response = await deleteSlide(req, { params: Promise.resolve({ id: 'slide-uuid-1' }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(prisma.carouselSlide.delete).toHaveBeenCalledWith({
        where: { id: 'slide-uuid-1' },
      });
    });
  });
});
