import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getActiveAdminSessions, MAX_CONCURRENT_ADMINS } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessions = await getActiveAdminSessions();

    const sanitizedSessions = sessions.map((s) => ({
      sessionId: s.sessionId,
      userId: s.userId,
      userName: s.userName || 'Administrateur',
      userPhone: s.userPhone || 'Numéro non renseigné',
      userEmail: s.userEmail ? s.userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
      deviceInfo: s.deviceInfo,
      locationInfo: s.locationInfo,
      loginAt: s.loginAt,
      lastSeenAt: s.lastSeenAt,
    }));

    return NextResponse.json({
      activeSessions: sanitizedSessions,
      slotsOccupied: sanitizedSessions.length,
      maxSlots: MAX_CONCURRENT_ADMINS,
      isFull: sanitizedSessions.length >= MAX_CONCURRENT_ADMINS,
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
    const body = await req.json();
    const { phone, password } = body || {};

    if (!phone || !password) {
      return NextResponse.json({ error: 'MissingCredentials' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length > 128) {
      return NextResponse.json({ error: 'InvalidCredentials' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { phone: String(phone).trim() },
    });

    if (!user || user.role !== 'admin' || !user.password) {
      return NextResponse.json({ error: 'InvalidCredentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'InvalidCredentials' }, { status: 401 });
    }

    const sessions = await getActiveAdminSessions();

    const sanitizedSessions = sessions.map((s) => ({
      sessionId: s.sessionId,
      userId: s.userId,
      userName: s.userName || 'Administrateur',
      userPhone: s.userPhone || 'Numéro non renseigné',
      userEmail: s.userEmail ? s.userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
      deviceInfo: s.deviceInfo,
      locationInfo: s.locationInfo,
      loginAt: s.loginAt,
      lastSeenAt: s.lastSeenAt,
    }));

    return NextResponse.json({
      activeSessions: sanitizedSessions,
      slotsOccupied: sanitizedSessions.length,
      maxSlots: MAX_CONCURRENT_ADMINS,
      isFull: sanitizedSessions.length >= MAX_CONCURRENT_ADMINS,
    });
  } catch (error) {
    console.error('[ActiveAdminSessions POST API] Error:', error);
    return NextResponse.json({ error: 'InternalServerError' }, { status: 500 });
  }
}
