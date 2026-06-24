import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const slides = await prisma.carouselSlide.findMany({
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(slides);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch carousel slides';
    console.error('Error fetching carousel slides:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, imageUrl, linkUrl, order } = body;

    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Title and Image URL are required' }, { status: 400 });
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
        linkUrl: linkUrl || null,
        order: Number(finalOrder),
      },
    });

    return NextResponse.json(newSlide, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create carousel slide';
    console.error('Error creating carousel slide:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
