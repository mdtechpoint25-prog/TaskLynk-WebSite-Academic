'use client';

import React, { useState } from 'react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { Bell, X, Check, Trash2 } from 'lucide-react';

interface NotificationCenterProps {
  userId: number | null;
  className?: string;
}

/**
 * Notification Center Component
 * Displays notifications with ability to mark as read and delete
 */
export function NotificationCenter({
  userId,
  className = '',
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications(userId);

  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  const handleDelete = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return '📋';
      case 'payment':
        return '💰';
      case 'rating':
        return '⭐';
      case 'message':
        return '💬';
      case 'revision':
        return '🔄';
      case 'system':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return 'bg-blue-50 border-blue-200';
      case 'payment':
        return 'bg-green-50 border-green-200';
      case 'rating':
        return 'bg-yellow-50 border-yellow-200';
      case 'message':
        return 'bg-purple-50 border-purple-200';
      case 'revision':
        return 'bg-orange-50 border-orange-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
        title={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex gap-2 px-4 py-2 border-b bg-gray-50">
              <button
                onClick={() => markAllAsRead()}
                className="flex-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                Mark All Read
              </button>
              <button
                onClick={() => deleteAllNotifications()}
                className="flex-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Loading notifications...</p>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 transition-colors hover:bg-gray-50 cursor-pointer ${
                      getNotificationColor(notification.type)
                    } ${!notification.read ? 'border-l-blue-600 bg-opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        {!notification.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title="Mark as read"
                            aria-label="Mark as read"
                          >
                            <Check className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, notification.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t p-3 bg-gray-50 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
