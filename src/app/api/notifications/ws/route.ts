import { NextRequest } from 'next/server';
import { registerClient, unregisterClient } from '@/lib/notifications-bus';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return new Response('Missing userId', { status: 400 });
  }

  // Create SSE stream
  const responseStream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const clientId = `${userId}-${Date.now()}`;
      
      // Register connection in centralized bus
      registerClient(clientId, controller);
      
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`));

      // Ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch (error) {
          clearInterval(pingInterval);
          unregisterClient(clientId);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        unregisterClient(clientId);
        try {
          controller.close();
        } catch (e) {
          // Already closed
        }
      });
    },
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
