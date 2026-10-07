import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureProductTags } from "@/lib/tags";

export async function GET(request?: NextRequest) {
  try {
    const queryOptions: any = {
      orderBy: [
        { visibility: 'desc' },
        { createdAt: 'desc' }
      ],
    };

    let isDashboard = false;
    let pageStr: string | null = null;
    let limitStr: string | null = null;

    if (request) {
      const { searchParams } = new URL(request.url);
      const isDashboardParam = searchParams.get('dashboard') === 'true';

      if (isDashboardParam) {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== 'admin') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        isDashboard = true;
      }

      pageStr = searchParams.get('page');
      limitStr = searchParams.get('limit');
      const category = searchParams.get('category');
      const search = searchParams.get('search');
      const tagsParam = searchParams.get('tags');
      const sortBy = searchParams.get('sortBy');

      const where: any = {};
      let hasWhere = false;

      if (category && category !== 'all') {
        hasWhere = true;
        where.category = category;
      }

      if (search && search.trim() !== '') {
        hasWhere = true;
        where.title = { contains: search.trim(), mode: 'insensitive' };
      }

      if (tagsParam && tagsParam.trim() !== '') {
        hasWhere = true;
        const tagsList = tagsParam.split(',').map(t => t.trim()).filter(Boolean);
        if (tagsList.length > 0) {
          where.tags = {
            some: {
              name: {
                in: tagsList
              }
            }
          };
        }
      }

      if (hasWhere) {
        queryOptions.where = where;
      }

      if (sortBy === 'rating-desc') {
        queryOptions.orderBy = [
          { rating: 'desc' },
          { createdAt: 'desc' }
        ];
      } else if (sortBy === 'rating-asc') {
        queryOptions.orderBy = [
          { rating: 'asc' },
          { createdAt: 'desc' }
        ];
      }

      if (pageStr || limitStr) {
        const page = Math.max(1, parseInt(pageStr || '1', 10));
        const limit = Math.max(1, parseInt(limitStr || '6', 10));
        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;
      }
    }

    const total = await prisma.product.count({
      where: queryOptions.where || {}
    });

    const products = await prisma.product.findMany({
      ...queryOptions,
      include: {
        tags: true
      }
    });

    const mappedProducts = products.map((p: any) => {
      const mapped = {
        ...p,
        tags: Array.isArray(p.tags)
          ? p.tags.map((t: any) => typeof t === 'string' ? t : t.name)
          : []
      };
      if (!isDashboard) {
        delete mapped.rating;
        delete mapped.ratingCount;
      }
      return mapped;
    });

    let hasNextPage = false;
    if (pageStr || limitStr) {
      const page = Math.max(1, parseInt(pageStr || '1', 10));
      const limit = Math.max(1, parseInt(limitStr || '6', 10));
      hasNextPage = total > page * limit;
    }

    return NextResponse.json(mappedProducts, {
      headers: {
        'x-total-count': total.toString(),
        'x-has-next-page': hasNextPage.toString()
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, slug, price, category, imageUrl, description, story, limitBay, state, publishedAt, visibility, tags, rating, ratingCount } = body;

    if (!title || !slug || !price || !category || !imageUrl || !description || !story) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        title,
        slug,
        price,
        category,
        imageUrl,
        description,
        story,
        limitBay: limitBay !== undefined ? (limitBay === null ? null : Number(limitBay)) : null,
        state: state || 'exist',
        visibility: visibility !== undefined ? Number(visibility) : 0,
        rating: rating !== undefined ? Number(rating) : 0.0,
        ratingCount: ratingCount !== undefined ? Number(ratingCount) : 0,
        tags: {
          connectOrCreate: (Array.isArray(tags) ? tags : []).map((name: string) => ({
            where: { name },
            create: { name },
          }))
        },
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
      include: {
        tags: true
      }
    });

    if (!tags || (Array.isArray(tags) && tags.length === 0)) {
      await ensureProductTags(newProduct.id);
    }

    return NextResponse.json({
      ...newProduct,
      tags: Array.isArray(newProduct.tags)
        ? newProduct.tags.map((t: any) => typeof t === 'string' ? t : t.name)
        : []
    }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
    console.error('Error creating product:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
