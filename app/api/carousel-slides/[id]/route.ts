import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteImage } from '@/lib/cloudinary';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleServerError } from '@/lib/api-error-handler';
import { sanitizeSlideUrl } from '@/lib/carousel-url';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, imageUrl, linkUrl, order } = body;

    const existingSlide = await prisma.carouselSlide.findUnique({
      where: { id },
    });

    if (!existingSlide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }

    let sanitizedLinkUrl = existingSlide.linkUrl;
    if (linkUrl !== undefined) {
      if (linkUrl === null || String(linkUrl).trim() === '') {
        sanitizedLinkUrl = null;
      } else {
        const validated = sanitizeSlideUrl(String(linkUrl));
        if (!validated) {
          return NextResponse.json(
            { error: 'Invalid linkUrl. Only relative internal paths or trusted HTTPS URLs are allowed.' },
            { status: 400 }
          );
        }
        sanitizedLinkUrl = validated;
      }
    }

    // Clean up old image if changing imageUrl
    if (imageUrl !== undefined && imageUrl !== existingSlide.imageUrl && existingSlide.imageUrl) {
      try {
        await deleteImage(existingSlide.imageUrl);
      } catch (cloudErr) {
        console.error('Failed to delete old slide image from Cloudinary:', cloudErr);
      }
    }

    const updatedSlide = await prisma.carouselSlide.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingSlide.title,
        description: description !== undefined ? description : existingSlide.description,
        imageUrl: imageUrl !== undefined ? imageUrl : existingSlide.imageUrl,
        linkUrl: sanitizedLinkUrl,
        order: order !== undefined ? Number(order) : existingSlide.order,
      },
    });

    return NextResponse.json(updatedSlide);
  } catch (error) {
    return handleServerError(error, '[Carousel Slides API PUT]', 'Une erreur interne est survenue.');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingSlide = await prisma.carouselSlide.findUnique({
      where: { id },
    });

    if (!existingSlide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }

    // Delete image from Cloudinary
    if (existingSlide.imageUrl) {
      try {
        await deleteImage(existingSlide.imageUrl);
      } catch (cloudErr) {
        console.error('Failed to delete slide image from Cloudinary:', cloudErr);
      }
    }

    await prisma.carouselSlide.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleServerError(error, '[Carousel Slides API DELETE]', 'Une erreur interne est survenue.');
  }
}
