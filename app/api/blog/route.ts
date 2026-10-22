import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleServerError } from '@/lib/api-error-handler';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const category = searchParams.get('category');
    const search = searchParams.get('search') || searchParams.get('q');

    const rawPage = parseInt(pageParam || '1', 10);
    const rawLimit = parseInt(limitParam || '10', 10);
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 10 : rawLimit), 100);
    const skip = (page - 1) * limit;

    const conditions: Prisma.BlogPostWhereInput[] = [
      { isPublished: true },
      {
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: new Date() } },
        ],
      },
    ];

    if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
      conditions.push({
        category: {
          equals: category.trim(),
          mode: 'insensitive',
        },
      });
    }

    if (search && search.trim() !== '') {
      const query = search.trim();
      conditions.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.BlogPostWhereInput = {
      AND: conditions,
    };

    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json(
      {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        total,
        page,
        limit,
        totalPages,
      },
      {
        headers: {
          'x-total-count': total.toString(),
          'x-page': page.toString(),
          'x-limit': limit.toString(),
          'x-total-pages': totalPages.toString(),
        },
      }
    );
  } catch (error) {
    return handleServerError(error, '[Blog API GET]', 'Une erreur est survenue lors de la récupération des articles.');
  }
}
