import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request?: NextRequest) {
  try {
    const queryOptions: any = {
      orderBy: [
        { visibility: 'desc' },
        { createdAt: 'desc' }
      ],
    };

    let isDashboard = false;

    if (request) {
      const { searchParams } = new URL(request.url);
      isDashboard = searchParams.get('dashboard') === 'true';
      const pageStr = searchParams.get('page');
      const limitStr = searchParams.get('limit');
      const category = searchParams.get('category');
      const search = searchParams.get('search');
      const tagsParam = searchParams.get('tags');

      const where: any = {};
      let hasWhere = false;

      if (category && category !== 'all') {
        hasWhere = true;
        if (category === 'aliments traditionnel') {
          where.category = { contains: 'traditionnel', mode: 'insensitive' };
        } else {
          where.NOT = { category: { contains: 'traditionnel', mode: 'insensitive' } };
        }
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

      if (pageStr || limitStr) {
        const page = Math.max(1, parseInt(pageStr || '1', 10));
        const limit = Math.max(1, parseInt(limitStr || '6', 10));
        queryOptions.skip = (page - 1) * limit;
        queryOptions.take = limit;
      }
    }

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

    return NextResponse.json(mappedProducts);
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
