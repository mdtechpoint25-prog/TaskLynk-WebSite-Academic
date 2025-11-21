/**
 * Centralized API endpoint constants
 * Prevents hardcoded strings and makes changes easy
 */

export const API_ENDPOINTS = {
  // User
  USER_PROFILE: (userId: string) => `/api/user/profile?userId=${userId}`,
  USER_SETTINGS: '/api/user/settings',
  
  // Jobs/Orders
  JOBS_LIST: '/api/jobs',
  JOB_DETAIL: (jobId: string) => `/api/jobs/${jobId}`,
  JOB_UPDATE: (jobId: string) => `/api/jobs/${jobId}`,
  
  // Payments
  PAYMENT_SUBMIT: '/api/payments',
  PAYMENT_STATUS: (paymentId: string) => `/api/payments/${paymentId}`,
  
  // Files
  FILE_UPLOAD: '/api/files/upload',
  
  // Notifications
  NOTIFICATIONS_LIST: '/api/notifications',
  NOTIFICATIONS_MARK_READ: '/api/notifications/mark-all-read',
  NOTIFICATIONS_UNREAD_COUNT: (userId: string) => `/api/notifications/unread-count?userId=${userId}`,
  NOTIFICATIONS_MESSAGE_COUNTS: (userId: string) => `/api/notifications/message-counts?userId=${userId}`,

  // Messaging
  MESSAGES_LIST: '/api/messages',
  MESSAGE_SEND: '/api/messages',

  // Users (v2)
  USERS_BADGES: (userId: string | number) => `/api/v2/users/${userId}/badges`,
} as const;