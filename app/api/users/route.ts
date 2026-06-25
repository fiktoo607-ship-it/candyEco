import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      orderBy: {
        email: 'asc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
