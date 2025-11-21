'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface OrderStatusUpdate {
  jobId: number;
  newStatus: string;
  timestamp: string;
}

interface UseOrderStatusSyncOptions {
  userId?: number;
  role?: string;
  onStatusChange?: (update: OrderStatusUpdate) => void;
  pollInterval?: number; // milliseconds, default 10000 (10s)
}

/**
 * Hook for syncing order status changes across dashboards
 * 
 * Features:
 * - Polls for order status changes at regular intervals
 * - Shows toast notifications for status updates
 * - Calls optional callback when status changes detected
 * - Auto-refreshes dashboard data
 * 
 * @example
 * ```tsx
 * const { lastUpdate, isPolling } = useOrderStatusSync({
 *   userId: 123,
 *   role: 'client',
 *   onStatusChange: (update) => {
 *     console.log('Status changed:', update);
 *     refetchOrders();
 *   },
 *   pollInterval: 15000 // 15 seconds
 * });
 * ```
 */
export function useOrderStatusSync(options: UseOrderStatusSyncOptions = {}) {
  const {
    userId,
    role,
    onStatusChange,
    pollInterval = 10000 // Default 10 seconds
  } = options;

  const [lastUpdate, setLastUpdate] = useState<OrderStatusUpdate | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const lastCheckRef = useRef<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only poll if we have userId and role
    if (!userId || !role) {
      return;
    }

    const checkForUpdates = async () => {
      try {
        setIsPolling(true);

        // Fetch notifications since last check
        const response = await fetch(
          `/api/notifications?userId=${userId}&since=${lastCheckRef.current.toISOString()}`,
          {
            headers: {
              'Cache-Control': 'no-cache',
            }
          }
        );

        if (response.ok) {
          const notifications = await response.json();
          
          // Filter for order_updated notifications
          const orderUpdates = notifications.filter(
            (n: any) => n.type === 'order_updated' && !n.read
          );

          if (orderUpdates.length > 0) {
            // Process each update
            for (const notif of orderUpdates) {
              const update: OrderStatusUpdate = {
                jobId: notif.jobId,
                newStatus: extractStatusFromMessage(notif.message),
                timestamp: notif.createdAt
              };

              // Show toast notification
              toast.info(notif.title, {
                description: notif.message,
                duration: 5000,
              });

              // Update state
              setLastUpdate(update);

              // Call callback if provided
              if (onStatusChange) {
                onStatusChange(update);
              }
            }
          }

          // Update last check time
          lastCheckRef.current = new Date();
        }
      } catch (error) {
        console.error('Error checking for order updates:', error);
      } finally {
        setIsPolling(false);
      }
    };

    // Initial check
    checkForUpdates();

    // Set up polling interval
    intervalRef.current = setInterval(checkForUpdates, pollInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, role, onStatusChange, pollInterval]);

  return {
    lastUpdate,
    isPolling,
  };
}

// Helper function to extract status from notification message
function extractStatusFromMessage(message: string): string {
  const statusMap: Record<string, string> = {
    'delivered': 'delivered',
    'completed': 'completed',
    'revision': 'revision',
    'cancelled': 'cancelled',
    'in progress': 'in_progress',
    'assigned': 'assigned',
  };

  const lowerMessage = message.toLowerCase();
  for (const [key, value] of Object.entries(statusMap)) {
    if (lowerMessage.includes(key)) {
      return value;
    }
  }

  return 'unknown';
}
