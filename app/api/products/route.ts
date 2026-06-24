import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request?: NextRequest) {
  try {
    const queryOptions: any = {
      orderBy: [
        { visibility: 'desc' },
        { createdAt: 'desc' }
      ],
    };

    if (request) {
      const { searchParams } = new URL(request.url);
      const pageStr = searchParams.get('page');
      const limitStr = searchParams.get('limit');
      const category = searchParams.get('category');
      const search = searchParams.get('search');

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

    const products = await prisma.product.findMany(queryOptions);
    return NextResponse.json(products);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, price, category, imageUrl, description, story, limitBay, state, publishedAt, visibility } = body;

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
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
    console.error('Error creating product:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
