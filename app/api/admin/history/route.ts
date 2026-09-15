import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveAdminSessions } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const roleFilter = searchParams.get('role'); // 'all', 'admin', 'user'
    const query = searchParams.get('query')?.trim();

    const where: any = {};

    if (roleFilter && roleFilter !== 'all') {
      where.role = roleFilter;
    }

    if (query) {
      where.OR = [
        { userName: { contains: query, mode: 'insensitive' } },
        { userPhone: { contains: query, mode: 'insensitive' } },
        { userEmail: { contains: query, mode: 'insensitive' } },
        { deviceLabel: { contains: query, mode: 'insensitive' } },
        { browser: { contains: query, mode: 'insensitive' } },
        { os: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, records, activeSessions] = await Promise.all([
      prisma.loginHistory.count({ where }),
      prisma.loginHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      getActiveAdminSessions().catch(() => []),
    ]);

    const activeUserIds = new Set(activeSessions.map((s) => s.userId));

    const history = records.map((record) => ({
      id: record.id,
      userId: record.userId,
      userName: record.userName || 'Utilisateur inconnu',
      userPhone: record.userPhone || 'Non renseigné',
      userEmail: record.userEmail || null,
      role: record.role || 'user',
      deviceInfo: {
        deviceType: record.deviceType || 'desktop',
        browser: record.browser || 'Inconnu',
        os: record.os || 'Inconnu',
        label: record.deviceLabel || 'Appareil inconnu',
      },
      ip: record.ip || '127.0.0.1',
      location: record.location || 'Localisation inconnue',
      status: record.status || 'success',
      createdAt: record.createdAt,
      isActiveNow: record.userId ? activeUserIds.has(record.userId) : false,
    }));

    return NextResponse.json({
      history,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      activeSessionsCount: activeSessions.length,
    });
  } catch (error) {
    console.error('[AdminHistory API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
