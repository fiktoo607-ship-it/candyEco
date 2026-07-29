import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { setAdminTabActive } from '@/lib/presence';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isVisible } = body;

    if (typeof isVisible !== 'boolean') {
      return NextResponse.json({ error: 'Invalid isVisible parameter' }, { status: 400 });
    }

    await setAdminTabActive(session.user.id, isVisible);

    return NextResponse.json({ success: true, isVisible });
  } catch (error) {
    console.error('[Presence API] Error setting tab visibility:', error);
    return NextResponse.json({ error: 'Failed to update presence' }, { status: 500 });
  }
}
