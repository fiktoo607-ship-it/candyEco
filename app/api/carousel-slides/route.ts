import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleServerError } from '@/lib/api-error-handler';
import { sanitizeSlideUrl } from '@/lib/carousel-url';

export async function GET() {
  try {
    const slides = await prisma.carouselSlide.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(slides);
  } catch (error) {
    return handleServerError(error, '[Carousel Slides API GET]', 'Une erreur interne est survenue.');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, imageUrl, linkUrl, order } = body;

    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Title and Image URL are required' }, { status: 400 });
    }

    let sanitizedLinkUrl: string | null = null;
    if (linkUrl !== undefined && linkUrl !== null && String(linkUrl).trim() !== '') {
      sanitizedLinkUrl = sanitizeSlideUrl(String(linkUrl));
      if (!sanitizedLinkUrl) {
        return NextResponse.json(
          { error: 'Invalid linkUrl. Only relative internal paths or trusted HTTPS URLs are allowed.' },
          { status: 400 }
        );
      }
    }

    // Determine the next order if not specified
    let finalOrder = order;
    if (finalOrder === undefined || finalOrder === null) {
      const maxOrderSlide = await prisma.carouselSlide.findFirst({
        orderBy: { order: 'desc' },
      });
      finalOrder = maxOrderSlide ? maxOrderSlide.order + 1 : 0;
    }

    const newSlide = await prisma.carouselSlide.create({
      data: {
        title,
        description: description || '',
        imageUrl,
        linkUrl: sanitizedLinkUrl,
        order: Number(finalOrder),
      },
    });

    return NextResponse.json(newSlide, { status: 201 });
  } catch (error) {
    return handleServerError(error, '[Carousel Slides API POST]', 'Une erreur interne est survenue.');
  }
}
