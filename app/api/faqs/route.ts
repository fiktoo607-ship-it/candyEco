import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });
    return NextResponse.json(faqs);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch FAQs';
    console.error('Error fetching FAQs:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to create FAQ';
    console.error('Error creating FAQ:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
