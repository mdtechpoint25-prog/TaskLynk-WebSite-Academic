import { NextRequest } from 'next/server';

// Store active WebSocket connections
const connections = new Map<number, Set<WebSocket>>();

export async function GET(request: NextRequest) {
  // Check if this is a WebSocket upgrade request
  if (request.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 400 });
  }

  // Note: Replit's environment may not support raw WebSocket upgrades
  // This is a fallback implementation using Server-Sent Events (SSE) instead

  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return new Response('Missing userId', { status: 400 });
  }

  // Return SSE stream instead
  const responseStream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

      // Ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'));
      }, 30000);

      // Cleanup on close
      return () => {
        clearInterval(pingInterval);
        controller.close();
      };
    },
  });

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
