import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteImage } from '@/lib/cloudinary';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
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
    const { id } = await params;
    const body = await request.json();
    const { title, slug, price, category, imageUrl, description, story, limitBay, state, publishedAt, visibility } = body;

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
        publishedAt: publishedAt !== undefined ? (publishedAt ? new Date(publishedAt) : null) : existingProduct.publishedAt,
      },
    });

    return NextResponse.json(updatedProduct);
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
