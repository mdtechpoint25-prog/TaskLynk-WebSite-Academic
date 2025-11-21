import { useState, useCallback, useEffect, useRef } from 'react';

export interface Notification {
  id: number;
  userId: number;
  type: 'order' | 'payment' | 'system' | 'rating' | 'message' | 'revision';
  title: string;
  message: string;
  read: boolean;
  relatedId?: number;
  relatedType?: string;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  unreadCount: number;
}

/**
 * Hook for managing notifications
 */
export function useNotifications(userId: number | null, pollingInterval = 30000) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (limit = 20, offset = 0, unreadOnly = false) => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          userId: userId.toString(),
          limit: limit.toString(),
          offset: offset.toString(),
          unreadOnly: unreadOnly.toString(),
        });

        const response = await fetch(`/api/notifications?${params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch notifications: ${response.statusText}`);
        }

        const data = await response.json();
        setNotifications(data || []);
        
        // Count unread
        const unread = (data || []).filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);

        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ read: true }),
        });

        if (!response.ok) {
          throw new Error(`Failed to mark notification as read: ${response.statusText}`);
        }

        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    },
    []
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
      }

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [userId]);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: number) => {
      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to delete notification: ${response.statusText}`);
        }

        // Update local state
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } catch (err) {
        console.error('Error deleting notification:', err);
      }
    },
    []
  );

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/notifications?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete all notifications: ${response.statusText}`);
      }

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error deleting all notifications:', err);
    }
  }, [userId]);

  // Setup polling
  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchNotifications();

    // Setup polling
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, pollingInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [userId, pollingInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
}
