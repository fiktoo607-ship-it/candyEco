import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getFaqs, POST as createFaq } from '@/app/api/faqs/route';
import { PUT as updateFaq, DELETE as deleteFaq } from '@/app/api/faqs/[id]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Mock next-auth session
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'admin-uuid', role: 'admin', name: 'Admin', email: 'admin@example.com' },
  }),
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    faq: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
  };
});

describe('Faqs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFaq = {
    id: 'faq-123',
    question: 'Quels sont vos horaires ?',
    answer: 'De 8h à 20h.',
    createdAt: new Date('2026-06-24T18:00:00Z'),
    updatedAt: new Date('2026-06-24T18:00:00Z'),
  };

  describe('GET /api/faqs', () => {
    it('should fetch faqs list', async () => {
      vi.mocked(prisma.faq.findMany).mockResolvedValue([mockFaq]);

      const req = new NextRequest('http://localhost/api/faqs');
      const response = await getFaqs(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveLength(1);
      expect(data[0].question).toBe(mockFaq.question);
      expect(prisma.faq.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'asc',
        },
      });
    });

    it('should return 500 when fetch fails', async () => {
      vi.mocked(prisma.faq.findMany).mockRejectedValue(new Error('Database error'));

      const req = new NextRequest('http://localhost/api/faqs');
      const response = await getFaqs(req);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Database error');
    });
  });

  describe('POST /api/faqs', () => {
    it('should create a FAQ when payload is valid', async () => {
      vi.mocked(prisma.faq.create).mockResolvedValue(mockFaq);

      const req = new NextRequest('http://localhost/api/faqs', {
        method: 'POST',
        body: JSON.stringify({
          question: '  Quels sont vos horaires ?  ',
          answer: '  De 8h à 20h.  ',
        }),
      });

      const response = await createFaq(req);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.question).toBe(mockFaq.question);
      expect(prisma.faq.create).toHaveBeenCalledWith({
        data: {
          question: 'Quels sont vos horaires ?',
          answer: 'De 8h à 20h.',
        },
      });
    });

    it('should return 400 when question or answer is missing', async () => {
      const req = new NextRequest('http://localhost/api/faqs', {
        method: 'POST',
        body: JSON.stringify({
          question: 'Quels sont vos horaires ?',
          answer: '   ',
        }),
      });

      const response = await createFaq(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('Missing required fields');
    });
  });

  describe('PUT /api/faqs/[id]', () => {
    it('should update FAQ when valid', async () => {
      vi.mocked(prisma.faq.findUnique).mockResolvedValue({ id: 'faq-123' } as any);
      vi.mocked(prisma.faq.update).mockResolvedValue({ ...mockFaq, question: 'Nouveau texte' } as any);

      const req = new NextRequest('http://localhost/api/faqs/faq-123', {
        method: 'PUT',
        body: JSON.stringify({
          question: '  Nouveau texte  ',
          answer: 'De 8h à 20h.',
        }),
      });

      const response = await updateFaq(req, { params: Promise.resolve({ id: 'faq-123' }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.question).toBe('Nouveau texte');
      expect(prisma.faq.update).toHaveBeenCalledWith({
        where: { id: 'faq-123' },
        data: {
          question: 'Nouveau texte',
          answer: 'De 8h à 20h.',
        },
      });
    });

    it('should return 404 if FAQ does not exist', async () => {
      vi.mocked(prisma.faq.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/faqs/faq-999', {
        method: 'PUT',
        body: JSON.stringify({
          question: 'Horaires ?',
          answer: 'De 8h à 20h.',
        }),
      });

      const response = await updateFaq(req, { params: Promise.resolve({ id: 'faq-999' }) });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/faqs/[id]', () => {
    it('should delete FAQ if it exists', async () => {
      vi.mocked(prisma.faq.findUnique).mockResolvedValue({ id: 'faq-123' } as any);
      vi.mocked(prisma.faq.delete).mockResolvedValue({ id: 'faq-123' } as any);

      const req = new NextRequest('http://localhost/api/faqs/faq-123', {
        method: 'DELETE',
      });

      const response = await deleteFaq(req, { params: Promise.resolve({ id: 'faq-123' }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toBe('FAQ deleted successfully');
      expect(prisma.faq.delete).toHaveBeenCalledWith({ where: { id: 'faq-123' } });
    });

    it('should return 404 if FAQ does not exist', async () => {
      vi.mocked(prisma.faq.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/faqs/faq-999', {
        method: 'DELETE',
      });

      const response = await deleteFaq(req, { params: Promise.resolve({ id: 'faq-999' }) });
      expect(response.status).toBe(404);
    });
  });
});
