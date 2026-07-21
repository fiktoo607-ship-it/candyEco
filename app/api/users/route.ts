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
      where: {
        role: {
          notIn: ['admin', 'ADMIN'],
        },
      },
      include: {
        orders: {
          select: {
            createdAt: true,
            status: true,
            totalAmount: true,
          },
        },
      },
    });

    const vipConfig = await prisma.siteConfig.findUnique({ where: { key: 'fidelity_vip_threshold' } });
    const fideleConfig = await prisma.siteConfig.findUnique({ where: { key: 'fidelity_fidele_threshold' } });
    const vipThreshold = vipConfig ? parseInt(vipConfig.value) : 500;
    const fideleThreshold = fideleConfig ? parseInt(fideleConfig.value) : 100;

    const mappedUsers = dbUsers.map((user) => {
      const completedOrders = user.orders.filter(
        (order) => order.status === 'DELIVERED' || order.status === 'COMPLETED'
      );
      const completedOrderCount = completedOrders.length;

      const totalAmountSpent = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const calculatedScore = Math.floor(totalAmountSpent);
      const trustScore = user.trustScore !== null && user.trustScore !== undefined ? user.trustScore : calculatedScore;

      let latestActivity = user.createdAt || new Date(0);
      user.orders.forEach((order) => {
        if (order.createdAt > latestActivity) {
          latestActivity = order.createdAt;
        }
      });

      // Determine client status (prioritize stored admin status if set)
      let status = user.status;
      if (!status) {
        const hasDeliveredOrder = user.orders.some((order) => order.status === 'DELIVERED');
        if (trustScore >= vipThreshold) {
          status = 'VIP';
        } else if (trustScore >= fideleThreshold) {
          status = 'Fidèle';
        } else if (hasDeliveredOrder) {
          status = 'Vérifié';
        } else {
          status = 'Non vérifié';
        }
      }

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
        status,
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
