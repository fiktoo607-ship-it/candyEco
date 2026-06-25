import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to update FAQ';
    console.error('Error updating FAQ:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete FAQ';
    console.error('Error deleting FAQ:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
