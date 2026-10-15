import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleServerError } from '@/lib/api-error-handler';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (q && q.trim() !== '') {
      const query = q.trim();
      const dbTags = await prisma.tag.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
          products: {
            some: {}, // Only return tags associated with at least one product
          },
        },
        select: { name: true },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(dbTags.map((t) => t.name));
    }

    const dbTags = await prisma.tag.findMany({
      where: {
        products: {
          some: {}, // Only return tags associated with at least one product
        },
      },
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(dbTags.map((t) => t.name));
  } catch (error) {
    return handleServerError(error, '[Tags API]', 'Une erreur interne est survenue.');
  }
}
