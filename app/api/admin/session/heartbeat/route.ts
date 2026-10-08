import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  acquireAdminLock,
  refreshAdminLock,
  releaseAdminLock,
  getActiveAdminSessions,
  setAdminTabActive,
  MAX_CONCURRENT_ADMINS,
  ActiveAdminSession,
} from '@/lib/admin-session';

function sanitizeSessions(sessions: ActiveAdminSession[]) {
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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeSessions = await getActiveAdminSessions();
    const sanitized = sanitizeSessions(activeSessions);
    const mySessionIndex = activeSessions.findIndex((s) => s.userId === session.user.id);
    const mySanitizedSession = mySessionIndex !== -1 ? sanitized[mySessionIndex] : null;

    return NextResponse.json({
      isActive: sanitized.length > 0,
      isCurrentUser: mySessionIndex !== -1,
      activeSessions: sanitized,
      session: mySanitizedSession || sanitized[0] || null,
      slotsOccupied: sanitized.length,
      maxSlots: MAX_CONCURRENT_ADMINS,
    });
  } catch (error) {
    console.error('[AdminSession API] Error fetching session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty or non-JSON body is allowed
    }

    const deviceId =
      body?.deviceId ||
      req.headers.get('x-device-id') ||
      'default_device';

    const deviceName =
      body?.deviceName ||
      req.headers.get('x-device-name') ||
      req.headers.get('x-device-model') ||
      req.headers.get('sec-ch-ua-model') ||
      null;

    const isVisible = typeof body?.isVisible === 'boolean' ? body.isVisible : true;

    const userId = session.user.id;

    // Update tab visibility for notifications
    await setAdminTabActive(userId, isVisible);

    // Attempt refresh first; if not existing, try to acquire
    const refreshed = await refreshAdminLock(userId, deviceId, {
      deviceName,
      userAgent: req.headers.get('user-agent'),
      headers: req.headers,
    });

    if (!refreshed) {
      const lockResult = await acquireAdminLock(userId, {
        deviceId,
        deviceName,
        userName: session.user.name,
        userEmail: session.user.email,
        userPhone: (session.user as any).phone,
        userAgent: req.headers.get('user-agent'),
        headers: req.headers,
      });

      if (!lockResult.success) {
        return NextResponse.json(
          {
            error: lockResult.error || 'AdminSessionActive',
            message:
              lockResult.error === 'SameAccountAnotherDevice'
                ? 'Ce compte est déjà connecté sur un autre appareil'
                : 'La limite de 2 administrateurs connectés simultanément est atteinte',
            activeSessions: sanitizeSessions(lockResult.activeSessions || []),
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({ success: true, isVisible });
  } catch (error) {
    console.error('[AdminSession API] Error updating heartbeat:', error);
    return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let deviceId = req?.nextUrl ? req.nextUrl.searchParams.get('deviceId') : null;
    if (!deviceId && req.headers) {
      deviceId = req.headers.get('x-device-id');
    }

    await releaseAdminLock(session.user.id, deviceId || undefined);
    await setAdminTabActive(session.user.id, false);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AdminSession API] Error releasing session:', error);
    return NextResponse.json({ error: 'Failed to release session' }, { status: 500 });
  }
}
