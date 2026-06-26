import { NextRequest } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notificationEmitter } from "@/lib/notification-emitter";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    };

    // Callback on new order notification
    const onNewOrder = (notification: any) => {
      try {
        writer.write(encoder.encode(`data: ${JSON.stringify(notification)}\n\n`));
      } catch (err) {
        console.error('[SSE] Failed to write notification to stream:', err);
      }
    };

    notificationEmitter.on('new-order', onNewOrder);

    // Keep connection alive
    const keepAliveInterval = setInterval(() => {
      try {
        writer.write(encoder.encode(': ping\n\n'));
      } catch (err) {
        console.error('[SSE] Failed to write keep-alive ping to stream:', err);
      }
    }, 15000);

    request.signal.addEventListener('abort', () => {
      clearInterval(keepAliveInterval);
      notificationEmitter.off('new-order', onNewOrder);
      try {
        writer.close();
      } catch (err) {}
    });

    return new Response(responseStream.readable, { headers });
  } catch (error) {
    console.error('[SSE] Error setting up event stream:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
