import { NextResponse } from 'next/server';
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
