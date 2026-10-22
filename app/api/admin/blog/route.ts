import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleServerError } from '@/lib/api-error-handler';
import { createBlogPostSchema, slugify } from '@/lib/validations/blog';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const category = searchParams.get('category');
    const search = searchParams.get('search') || searchParams.get('q');
    const statusParam = searchParams.get('status'); // 'published' | 'draft' | 'all'

    const rawPage = parseInt(pageParam || '1', 10);
    const rawLimit = parseInt(limitParam || '10', 10);
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 10 : rawLimit), 100);
    const skip = (page - 1) * limit;

    const conditions: Prisma.BlogPostWhereInput[] = [];

    if (statusParam === 'published') {
      conditions.push({ isPublished: true });
    } else if (statusParam === 'draft') {
      conditions.push({ isPublished: false });
    }

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
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.BlogPostWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    const [total, posts] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json(
      {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
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
    return handleServerError(error, '[Admin Blog GET]', 'Une erreur interne est survenue.');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createBlogPostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      title,
      summary,
      content,
      coverImage,
      category,
      readingTime,
      isPublished,
      publishedAt,
    } = validationResult.data;

    let targetSlug = validationResult.data.slug;
    if (!targetSlug || targetSlug.trim() === '') {
      targetSlug = slugify(title);
    }

    if (!targetSlug) {
      return NextResponse.json(
        { error: 'Impossible de générer un slug valide à partir du titre' },
        { status: 400 }
      );
    }

    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: targetSlug },
    });

    if (existingPost) {
      return NextResponse.json(
        { error: 'Un article avec ce slug existe déjà' },
        { status: 400 }
      );
    }

    const effectivePublishedAt = isPublished
      ? (publishedAt || new Date())
      : (publishedAt || null);

    const newPost = await prisma.blogPost.create({
      data: {
        title,
        slug: targetSlug,
        summary,
        content,
        coverImage,
        category,
        readingTime,
        isPublished,
        publishedAt: effectivePublishedAt,
      },
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    return handleServerError(error, '[Admin Blog POST]', 'Une erreur interne est survenue.');
  }
}
