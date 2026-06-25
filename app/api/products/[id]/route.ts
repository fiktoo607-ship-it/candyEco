import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteImage } from '@/lib/cloudinary';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isDashboard = searchParams.get('dashboard') === 'true';

    const product = await prisma.product.findUnique({
      where: { id },
      include: { tags: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const mappedProduct = {
      ...product,
      tags: Array.isArray(product.tags)
        ? product.tags.map((t: any) => typeof t === 'string' ? t : t.name)
        : []
    };

    if (!isDashboard) {
      delete (mappedProduct as any).rating;
      delete (mappedProduct as any).ratingCount;
    }

    return NextResponse.json(mappedProduct);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch product';
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

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
    const { title, slug, price, category, imageUrl, description, story, limitBay, state, publishedAt, visibility, tags, rating, ratingCount } = body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // If imageUrl is changing, clean up the old image from Cloudinary
    if (imageUrl !== undefined && imageUrl !== existingProduct.imageUrl && existingProduct.imageUrl) {
      try {
        await deleteImage(existingProduct.imageUrl);
      } catch (cloudErr) {
        console.error('Failed to delete old image from Cloudinary:', cloudErr);
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingProduct.title,
        slug: slug !== undefined ? slug : existingProduct.slug,
        category: category !== undefined ? category : existingProduct.category,
        price: price !== undefined ? price : existingProduct.price,
        imageUrl: imageUrl !== undefined ? imageUrl : existingProduct.imageUrl,
        description: description !== undefined ? description : existingProduct.description,
        story: story !== undefined ? story : existingProduct.story,
        limitBay: limitBay !== undefined ? (limitBay === null ? null : Number(limitBay)) : existingProduct.limitBay,
        state: state !== undefined ? state : existingProduct.state,
        visibility: visibility !== undefined ? Number(visibility) : existingProduct.visibility,
        rating: rating !== undefined ? Number(rating) : existingProduct.rating,
        ratingCount: ratingCount !== undefined ? Number(ratingCount) : existingProduct.ratingCount,
        tags: tags !== undefined ? {
          set: [],
          connectOrCreate: (Array.isArray(tags) ? tags : []).map((name: string) => ({
            where: { name },
            create: { name },
          }))
        } : undefined,
        publishedAt: publishedAt !== undefined ? (publishedAt ? new Date(publishedAt) : null) : existingProduct.publishedAt,
      },
      include: {
        tags: true
      }
    });

    return NextResponse.json({
      ...updatedProduct,
      tags: Array.isArray(updatedProduct.tags)
        ? updatedProduct.tags.map((t: any) => typeof t === 'string' ? t : t.name)
        : []
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
    console.error('Error updating product:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete image from Cloudinary if applicable
    if (existingProduct.imageUrl) {
      try {
        await deleteImage(existingProduct.imageUrl);
      } catch (cloudErr) {
        console.error('Failed to delete image from Cloudinary:', cloudErr);
      }
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating } = body;

    if (rating === undefined || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating value. Must be a number between 1 and 5.' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const currentRating = product.rating ?? 0.0;
    const currentCount = product.ratingCount ?? 0;
    const newCount = currentCount + 1;
    const newRating = ((currentRating * currentCount) + rating) / newCount;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        rating: parseFloat(newRating.toFixed(2)),
        ratingCount: newCount
      }
    });

    return NextResponse.json({
      message: 'Rating submitted successfully',
      rating: updatedProduct.rating,
      ratingCount: updatedProduct.ratingCount
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit rating';
    console.error('Error submitting rating:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
