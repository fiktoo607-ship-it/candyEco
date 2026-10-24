import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteImage } from '@/lib/cloudinary';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limiter';
import { normalizePrice } from '@/lib/utils/currency';
import { handleServerError } from '@/lib/api-error-handler';
import { isProductPubliclyVisible } from '@/lib/products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isDashboardParam = searchParams.get('dashboard') === 'true';
    let isDashboard = false;

    if (isDashboardParam) {
      const session = await getServerSession(authOptions);
      if (session && (session.user as any)?.role === 'admin') {
        isDashboard = true;
      }
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { tags: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Hide unpublished products from non-admin visitors (Issue #10, #144, #145)
    // Default visibility 0 is treated as active item
    if (!isDashboard && !isProductPubliclyVisible(product)) {
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
    return handleServerError(error, '[Products API GET]', 'Une erreur interne est survenue.');
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

    let normalizedPrice: string | undefined = undefined;
    if (price !== undefined) {
      try {
        normalizedPrice = normalizePrice(price);
      } catch {
        return NextResponse.json({ error: 'Le prix doit être un nombre positif valide.' }, { status: 400 });
      }
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      return await tx.product.update({
        where: { id },
        data: {
          title: title !== undefined ? title : existingProduct.title,
          slug: slug !== undefined ? slug : existingProduct.slug,
          category: category !== undefined ? category : existingProduct.category,
          price: normalizedPrice !== undefined ? normalizedPrice : existingProduct.price,
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
    });

    // If imageUrl is changing, clean up the old image from Cloudinary only after database update completes successfully
    if (imageUrl !== undefined && imageUrl !== existingProduct.imageUrl && existingProduct.imageUrl) {
      try {
        await deleteImage(existingProduct.imageUrl);
      } catch (cloudErr) {
        console.error('Failed to delete old image from Cloudinary:', cloudErr);
      }
    }

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/our-product');
      revalidatePath(`/our-product/${updatedProduct.slug}`);
      if (existingProduct.slug !== updatedProduct.slug) {
        revalidatePath(`/our-product/${existingProduct.slug}`);
      }
      revalidatePath('/products');
      revalidatePath('/home');
      revalidatePath('/');
      revalidatePath('/sitemap.xml');
    } catch {
      // Safe fallback if called outside Next.js request context
    }

    return NextResponse.json({
      ...updatedProduct,
      tags: Array.isArray(updatedProduct.tags)
        ? updatedProduct.tags.map((t: any) => typeof t === 'string' ? t : t.name)
        : []
    });
  } catch (error) {
    return handleServerError(error, '[Products API PUT]', 'Une erreur interne est survenue.');
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

    // Prevent hard deletion if product has historical order items (Issue #22)
    if (typeof (prisma as any).orderItem?.count === 'function') {
      const orderItemsCount = await (prisma as any).orderItem.count({
        where: { productId: id },
      });
      if (orderItemsCount > 0) {
        return NextResponse.json(
          {
            error: "Impossible de supprimer ce produit car il est lié à des commandes existantes. Veuillez plutôt l'archiver pour préserver l'historique des commandes.",
          },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.delete({
        where: { id },
      });
    });

    // Delete image from Cloudinary only after database deletion completes successfully if applicable
    if (existingProduct.imageUrl) {
      try {
        await deleteImage(existingProduct.imageUrl);
      } catch (cloudErr) {
        console.error('Failed to delete image from Cloudinary:', cloudErr);
      }
    }

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/our-product');
      revalidatePath(`/our-product/${existingProduct.slug}`);
      revalidatePath('/products');
      revalidatePath('/home');
      revalidatePath('/');
      revalidatePath('/sitemap.xml');
    } catch {
      // Safe fallback if called outside Next.js request context
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    if (error?.code === 'P2003') {
      return NextResponse.json(
        {
          error: "Impossible de supprimer ce produit car il est lié à des commandes existantes. Veuillez plutôt l'archiver pour préserver l'historique des commandes.",
        },
        { status: 400 }
      );
    }
    return handleServerError(error, '[Products API DELETE]', 'Une erreur interne est survenue.');
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

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Vous devez vous connecter pour évaluer un produit.' }, { status: 401 });
    }

    const clientIp = getClientIp(request);
    const identifier = session?.user?.id ? `user:${session.user.id}` : `ip:${clientIp}`;
    const rateLimitResult = await checkRateLimit(identifier, {
      keyPrefix: 'reviews',
      limit: 5,
      windowSeconds: 60,
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult,
        'Trop d\'évaluations soumises. Veuillez patienter une minute avant de réessayer.'
      );
    }

    // Verification: Order containing the product must be DELIVERED or COMPLETED
    const user = session.user as any;

    // Enforce uniqueness: allow only one rating per user per product (Issue #11)
    const ratingModel = (prisma as any).review || (prisma as any).rating;
    if (user?.id && typeof ratingModel?.findFirst === 'function') {
      const existingRating = await ratingModel.findFirst({
        where: {
          productId: id,
          userId: user.id,
        },
      });

      if (existingRating) {
        return NextResponse.json(
          { error: 'Vous avez déjà évalué ce produit.' },
          { status: 400 }
        );
      }
    }

    // Verification: Order containing the product must be DELIVERED or COMPLETED
    // Strictly bound to authenticated userId to prevent cross-account rating hijacking (Issue #19)
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: { in: ['DELIVERED', 'COMPLETED'] },
        items: {
          some: {
            productId: id
          }
        }
      }
    });

    if (!deliveredOrder) {
      return NextResponse.json({ error: 'Vous ne pouvez évaluer que les produits qui vous ont été livrés.' }, { status: 403 });
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id }
      });

      if (!product) {
        return null;
      }

      const ratingDelegate = (tx as any).review || (tx as any).rating;

      if (user?.id && typeof ratingDelegate?.findFirst === 'function') {
        const alreadyRated = await ratingDelegate.findFirst({
          where: {
            productId: id,
            userId: user.id,
          },
        });
        if (alreadyRated) {
          throw new Error('AlreadyRated');
        }
      }

      await ratingDelegate.create({
        data: {
          productId: id,
          rating,
          userId: user?.id || null,
        }
      });

      const aggregation = await ratingDelegate.aggregate({
        where: { productId: id },
        _avg: { rating: true },
        _count: true,
      });

      const newAvg = aggregation._avg.rating !== null
        ? parseFloat(aggregation._avg.rating.toFixed(2))
        : rating;
      const newCount = aggregation._count;

      return await tx.product.update({
        where: { id },
        data: {
          rating: newAvg,
          ratingCount: newCount,
        }
      });
    });

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Rating submitted successfully',
      rating: updatedProduct.rating,
      ratingCount: updatedProduct.ratingCount
    });
  } catch (error: any) {
    if (error?.message === 'AlreadyRated' || error?.code === 'P2002') {
      return NextResponse.json({ error: 'Vous avez déjà évalué ce produit.' }, { status: 400 });
    }
    return handleServerError(error, '[Products API Rating]', 'Une erreur interne est survenue.');
  }
}
