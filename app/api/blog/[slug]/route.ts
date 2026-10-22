import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { handleServerError } from '@/lib/api-error-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || slug.trim() === '') {
      return NextResponse.json({ error: 'Slug manquant ou invalide' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const isAdmin = (session?.user as any)?.role === 'admin';

    const post = await prisma.blogPost.findUnique({
      where: { slug: slug.trim() },
    });

    if (
      !post ||
      (!isAdmin && (!post.isPublished || (post.publishedAt && new Date(post.publishedAt) > new Date())))
    ) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleServerError(error, '[Blog API GET Slug]', "Une erreur est survenue lors de la récupération de l'article.");
  }
}
