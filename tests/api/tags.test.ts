import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getTags } from '@/app/api/tags/route';
import { prisma } from '@/lib/prisma';
import { ensureProductTags } from '@/lib/tags';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      tag: {
        findMany: vi.fn(),
      },
    },
  };
});

vi.mock('@/lib/tags', () => {
  return {
    ensureProductTags: vi.fn().mockResolvedValue(undefined),
  };
});

describe('Tags API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call ensureProductTags first', async () => {
    vi.mocked(prisma.tag.findMany).mockResolvedValueOnce([
      { id: 'tag-1', name: 'لوز' },
      { id: 'tag-2', name: 'بندق' }
    ]);

    const req = new NextRequest('http://localhost/api/tags');
    const res = await getTags(req);
    expect(res.status).toBe(200);

    expect(ensureProductTags).toHaveBeenCalledTimes(1);
    expect(prisma.tag.findMany).toHaveBeenCalledWith({
      where: {
        products: {
          some: {},
        },
      },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    const data = await res.json();
    expect(data).toEqual(['لوز', 'بندق']);
  });

  it('should pass case-insensitive contains filter and product count constraint when query q is provided', async () => {
    vi.mocked(prisma.tag.findMany).mockResolvedValueOnce([
      { id: 'tag-3', name: 'شوكولا' }
    ]);

    const req = new NextRequest('http://localhost/api/tags?q=choco');
    const res = await getTags(req);
    expect(res.status).toBe(200);

    expect(prisma.tag.findMany).toHaveBeenCalledWith({
      where: {
        name: {
          contains: 'choco',
          mode: 'insensitive',
        },
        products: {
          some: {},
        },
      },
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    const data = await res.json();
    expect(data).toEqual(['شوكولا']);
  });
});
