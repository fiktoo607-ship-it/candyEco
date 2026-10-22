import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleServerError } from '@/lib/api-error-handler';
import { updateBlogPostSchema } from '@/lib/validations/blog';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleServerError(error, '[Admin Blog GET by ID]', 'Une erreur interne est survenue.');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = updateBlogPostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      title,
      slug,
      summary,
      content,
      coverImage,
      category,
      readingTime,
      isPublished,
      publishedAt,
    } = validationResult.data;

    if (slug && slug !== existingPost.slug) {
      const slugConflict = await prisma.blogPost.findUnique({
        where: { slug },
      });
      if (slugConflict && slugConflict.id !== id) {
        return NextResponse.json(
          { error: 'Un article avec ce slug existe déjà' },
          { status: 400 }
        );
      }
    }

    const nextIsPublished = isPublished !== undefined ? isPublished : existingPost.isPublished;
    let nextPublishedAt = publishedAt !== undefined ? publishedAt : existingPost.publishedAt;

    // If publishing now and no previous or new publishedAt date was specified, set to now
    if (nextIsPublished && !nextPublishedAt) {
      nextPublishedAt = new Date();
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingPost.title,
        slug: slug !== undefined ? slug : existingPost.slug,
        summary: summary !== undefined ? summary : existingPost.summary,
        content: content !== undefined ? content : existingPost.content,
        coverImage: coverImage !== undefined ? coverImage : existingPost.coverImage,
        category: category !== undefined ? category : existingPost.category,
        readingTime: readingTime !== undefined ? readingTime : existingPost.readingTime,
        isPublished: nextIsPublished,
        publishedAt: nextPublishedAt,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleServerError(error, '[Admin Blog PUT]', 'Une erreur interne est survenue.');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }

    await prisma.blogPost.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Article supprimé avec succès',
    });
  } catch (error) {
    return handleServerError(error, '[Admin Blog DELETE]', 'Une erreur interne est survenue.');
  }
}
