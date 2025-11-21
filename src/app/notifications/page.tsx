'use client';

import React, { useState } from 'react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { Bell, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Notifications Page
 * Full page view of all notifications
 */
export default function NotificationsPage() {
  // TODO: Get userId from session
  const userId = 1; // Replace with actual user session

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications(userId);

  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');

  const filteredNotifications = notifications.filter((n) => {
    if (filterType && n.type !== filterType) return false;
    if (filterRead === 'unread' && n.read) return false;
    if (filterRead === 'read' && !n.read) return false;
    return true;
  });

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
        return 'border-blue-200 bg-blue-50';
      case 'payment':
        return 'border-green-200 bg-green-50';
      case 'rating':
        return 'border-yellow-200 bg-yellow-50';
      case 'message':
        return 'border-purple-200 bg-purple-50';
      case 'revision':
        return 'border-orange-200 bg-orange-50';
      case 'system':
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (timestamp: string) => {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold">Notifications</h1>
            </div>
            {unreadCount > 0 && (
              <span className="ml-auto bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {unreadCount} Unread
              </span>
            )}
          </div>

          {/* Actions */}
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => markAllAsRead()}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Mark All as Read
              </button>
              <button
                onClick={() => deleteAllNotifications()}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg p-4 mb-6 border">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {/* Status Filter */}
            <button
              onClick={() => setFilterRead('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterRead === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterRead('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterRead === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilterRead('read')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterRead === 'read'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Read
            </button>

            {/* Type Filters */}
            {[
              { type: 'order', label: 'Orders' },
              { type: 'payment', label: 'Payments' },
              { type: 'rating', label: 'Ratings' },
              { type: 'message', label: 'Messages' },
              { type: 'revision', label: 'Revisions' },
              { type: 'system', label: 'System' },
            ].map(({ type, label }) => (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? null : type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {loading && filteredNotifications.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No notifications</p>
            <p className="text-gray-500 text-sm">
              {filterType || filterRead !== 'all'
                ? 'No notifications match your filters'
                : 'You are all caught up!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg border-l-4 p-4 hover:shadow-md transition-all ${
                  getNotificationColor(notification.type)
                } ${!notification.read ? 'shadow-md' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="text-3xl flex-shrink-0 pt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                        )}
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                          {notification.type}
                        </span>
                      </div>
                      <p className="text-gray-600 text-base mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(notification.createdAt)} ({formatRelativeTime(notification.createdAt)})
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
