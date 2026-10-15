import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleServerError } from '@/lib/api-error-handler';

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
    const { question, answer } = body;

    if (!question || question.trim() === '' || !answer || answer.trim() === '') {
      return NextResponse.json({ error: 'Missing required fields: question and answer' }, { status: 400 });
    }

    const faq = await prisma.faq.findUnique({
      where: { id },
    });

    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    const updatedFaq = await prisma.faq.update({
      where: { id },
      data: {
        question: question.trim(),
        answer: answer.trim(),
      },
    });

    return NextResponse.json(updatedFaq);
  } catch (error) {
    return handleServerError(error, '[Faqs API PUT]', 'Une erreur interne est survenue.');
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

    const faq = await prisma.faq.findUnique({
      where: { id },
    });

    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    await prisma.faq.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    return handleServerError(error, '[Faqs API DELETE]', 'Une erreur interne est survenue.');
  }
}
