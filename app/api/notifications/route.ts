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

    const notifications = await prisma.orderNotification.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        order: true,
      },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Failed to fetch notifications';
    console.error('[Notifications API] Error fetching notifications:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, readAll } = body;

    if (readAll === true) {
      await prisma.orderNotification.updateMany({
        where: { read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing notification id or readAll parameter' }, { status: 400 });
    }

    const updated = await prisma.orderNotification.update({
      where: { id },
      data: { read: true },
      include: {
        order: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Failed to update notifications';
    console.error('[Notifications API] Error updating notifications:', error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
