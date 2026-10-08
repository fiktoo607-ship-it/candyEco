import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getActiveAdminSessions, MAX_CONCURRENT_ADMINS } from '@/lib/admin-session';
import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

function sanitizeSessions(sessions: Awaited<ReturnType<typeof getActiveAdminSessions>>) {
  return sessions.map((s, idx) => ({
    id: `session-${idx + 1}`,
    userId: s.userId,
    userName: s.userName || 'Administrateur',
    userPhone: s.userPhone || 'Numéro non renseigné',
    userEmail: s.userEmail ? s.userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
    deviceInfo: s.deviceInfo ? {
      browser: s.deviceInfo.browser,
      os: s.deviceInfo.os,
      deviceType: s.deviceInfo.deviceType,
      label: s.deviceInfo.label,
    } : undefined,
    locationInfo: s.locationInfo,
    loginAt: s.loginAt,
    lastSeenAt: s.lastSeenAt,
  }));
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await getActiveAdminSessions();
    const sanitized = sanitizeSessions(sessions);

    return NextResponse.json({
      activeSessions: sanitized,
      slotsOccupied: sanitized.length,
      maxSlots: MAX_CONCURRENT_ADMINS,
      isFull: sanitized.length >= MAX_CONCURRENT_ADMINS,
    });
  } catch (error) {
    console.error('[ActiveAdminSessions API] Error:', error);
    return NextResponse.json(
      {
        activeSessions: [],
        slotsOccupied: 0,
        maxSlots: MAX_CONCURRENT_ADMINS,
        isFull: false,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const rateLimitResult = await checkRateLimit(clientIp, {
      keyPrefix: 'admin_active_session',
      limit: 5,
      windowSeconds: 900, // 15 minutes
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(
        rateLimitResult,
        'Trop de tentatives. Veuillez réessayer plus tard.'
      );
    }

    const body = await req.json();
    const { phone, password } = body || {};

    if (!phone || !password) {
      return NextResponse.json({ error: 'MissingCredentials' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length > 128) {
      return NextResponse.json({ error: 'InvalidCredentials' }, { status: 400 });
    }

    const phoneNormalized = String(phone).trim();

    // Additional per-phone rate limiting against brute-force password probing
    const phoneRateLimitResult = await checkRateLimit(`phone:${phoneNormalized}`, {
      keyPrefix: 'admin_active_session_phone',
      limit: 5,
      windowSeconds: 900,
    });

    if (!phoneRateLimitResult.success) {
      return createRateLimitResponse(
        phoneRateLimitResult,
        'Trop de tentatives sur ce compte. Veuillez réessayer plus tard.'
      );
    }

    const user = await prisma.user.findFirst({
      where: { phone: phoneNormalized },
    });

    if (!user || user.role !== 'admin' || !user.password) {
      return NextResponse.json({ error: 'InvalidCredentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'InvalidCredentials' }, { status: 401 });
    }

    const sessions = await getActiveAdminSessions();
    const sanitized = sanitizeSessions(sessions);

    return NextResponse.json({
      activeSessions: sanitized,
      slotsOccupied: sanitized.length,
      maxSlots: MAX_CONCURRENT_ADMINS,
      isFull: sanitized.length >= MAX_CONCURRENT_ADMINS,
    });
  } catch (error) {
    console.error('[ActiveAdminSessions POST API] Error:', error);
    return NextResponse.json({ error: 'InternalServerError' }, { status: 500 });
  }
}
