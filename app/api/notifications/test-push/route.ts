import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendPushNotification } from '@/lib/push-notifications';

export async function POST(request: NextRequest) {
  // Requirement 17: Limit to development environment only
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  // Requirement 17: Limit to admin role only
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, title, body: pushBody, url } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const result = await sendPushNotification(userId, {
      title: title || 'Test Push Title',
      body: pushBody || 'This is a test push notification from Délices d\'Eva.',
      data: { url: url || '/home' },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Test Push API] Error sending test notification:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
