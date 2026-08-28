import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  acquireAdminLock,
  refreshAdminLock,
  releaseAdminLock,
  getActiveAdminSession,
} from '@/lib/admin-session';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeSession = await getActiveAdminSession();
    return NextResponse.json({
      isActive: !!activeSession,
      isCurrentUser: activeSession?.userId === session.user.id,
      session: activeSession,
    });
  } catch (error) {
    console.error('[AdminSession API] Error fetching session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    // Attempt refresh first; if not existing, try to acquire
    const refreshed = await refreshAdminLock(userId);
    if (!refreshed) {
      const lockResult = await acquireAdminLock(userId, {
        userName: session.user.name,
        userEmail: session.user.email,
      });

      if (!lockResult.success) {
        return NextResponse.json(
          {
            error: 'AdminSessionActive',
            message: 'Another admin is currently logged in',
            activeSession: lockResult.activeSession,
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AdminSession API] Error updating heartbeat:', error);
    return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await releaseAdminLock(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AdminSession API] Error releasing session:', error);
    return NextResponse.json({ error: 'Failed to release session' }, { status: 500 });
  }
}
