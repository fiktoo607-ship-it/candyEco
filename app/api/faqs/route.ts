import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleServerError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });
    return NextResponse.json(faqs);
  } catch (error) {
    return handleServerError(error, '[Faqs API GET]', 'Une erreur interne est survenue.');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { question, answer } = body;

    if (!question || question.trim() === '' || !answer || answer.trim() === '') {
      return NextResponse.json({ error: 'Missing required fields: question and answer' }, { status: 400 });
    }

    const newFaq = await prisma.faq.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
      },
    });

    return NextResponse.json(newFaq, { status: 201 });
  } catch (error) {
    return handleServerError(error, '[Faqs API POST]', 'Une erreur interne est survenue.');
  }
}
