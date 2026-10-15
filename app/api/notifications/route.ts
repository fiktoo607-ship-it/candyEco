import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleServerError } from '@/lib/api-error-handler';

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
      select: {
        id: true,
        orderId: true,
        read: true,
        createdAt: true,
        order: {
          select: {
            id: true,
            reference: true,
            customerName: true,
            totalPrice: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    return handleServerError(error, '[Notifications API GET]', 'Une erreur interne est survenue.');
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
    return handleServerError(error, '[Notifications API PATCH]', 'Une erreur interne est survenue.');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.orderNotification.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleServerError(error, '[Notifications API DELETE]', 'Une erreur interne est survenue.');
  }
}
