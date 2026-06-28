import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy') || 'email';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const dbUsers = await prisma.user.findMany({
      include: {
        orders: {
          select: {
            createdAt: true,
            status: true,
          },
        },
      },
    });

    const mappedUsers = dbUsers.map((user) => {
      const completedOrderCount = user.orders.filter(
        (order) => order.status === 'DELIVERED' || order.status === 'COMPLETED'
      ).length;

      const trustScore = completedOrderCount;

      let latestActivity = user.createdAt || new Date(0);
      user.orders.forEach((order) => {
        if (order.createdAt > latestActivity) {
          latestActivity = order.createdAt;
        }
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        completedOrderCount,
        trustScore,
        latestActivity: latestActivity.toISOString(),
      };
    });

    mappedUsers.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'trustScore') {
        comparison = a.trustScore - b.trustScore;
      } else if (sortBy === 'latestActivity') {
        comparison = new Date(a.latestActivity).getTime() - new Date(b.latestActivity).getTime();
      } else {
        comparison = (a.email || '').localeCompare(b.email || '');
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return NextResponse.json(mappedUsers);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
