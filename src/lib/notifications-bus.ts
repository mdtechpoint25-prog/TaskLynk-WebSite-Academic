/**
 * Centralized Notification Broadcasting System
 * Singleton pattern ensures single shared clients registry across all modules
 */

// Singleton clients registry - shared across all imports
const clients = new Map<string, ReadableStreamDefaultController>();

/**
 * Register a new SSE client connection
 */
export function registerClient(clientId: string, controller: ReadableStreamDefaultController): void {
  clients.set(clientId, controller);
  console.log(`✅ Client registered: ${clientId} (Total: ${clients.size})`);
}

/**
 * Unregister an SSE client connection
 */
export function unregisterClient(clientId: string): void {
  clients.delete(clientId);
  console.log(`❌ Client unregistered: ${clientId} (Total: ${clients.size})`);
}

/**
 * Broadcast notification to specific user via SSE
 */
export function broadcastNotification(userId: number, notification: any): void {
  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(notification)}\n\n`;
  let sent = 0;
  
  // Send to all connections for this user
  clients.forEach((controller, clientId) => {
    if (clientId.startsWith(`${userId}-`)) {
      try {
        controller.enqueue(encoder.encode(message));
        sent++;
      } catch (error) {
        console.error(`Failed to send notification to ${clientId}:`, error);
        clients.delete(clientId);
      }
    }
  });
  
  console.log(`📤 Notification sent to user ${userId}: ${sent} connection(s)`);
}

/**
 * Get current number of active connections
 */
export function getActiveConnections(): number {
  return clients.size;
}
