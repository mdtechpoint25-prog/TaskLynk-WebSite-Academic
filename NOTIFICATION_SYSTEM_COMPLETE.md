# Notification System — Complete Documentation

Overview
The TaskLynk notification system delivers user-scoped, event-driven updates for orders, payments, ratings, messages, and revisions. It uses a simple polling model for reliability and low operational overhead.

Data Model (Drizzle schema concept)
- notifications
  - id INT PK
  - userId INT NOT NULL
  - type TEXT CHECK in ('order','payment','system','rating','message','revision')
  - title TEXT NOT NULL
  - message TEXT NOT NULL
  - read BOOLEAN DEFAULT false
  - relatedId INT NULL
  - relatedType TEXT NULL
  - createdAt TEXT (ISO) NOT NULL

API Endpoints
1) GET /api/notifications
- Query: userId (required), limit, offset, unreadOnly, since
- Returns: { notifications, pagination: { total, limit, offset, hasMore }, unreadCount }

2) POST /api/notifications
- Body: { userId, type, title, message, relatedId?, relatedType? }
- Creates a notification; non-blocking usage recommended.

3) PATCH /api/notifications
- Body (mark_read): { notificationIds: [id], action: 'mark_read' }
- Body (mark_all_read): { userId, action: 'mark_all_read' }

4) DELETE /api/notifications
- Query: id OR userId (delete one or all for a user)

5) GET /api/notifications/[id]
- Returns one notification record

6) PATCH /api/notifications/[id]
- Body: { read: boolean }

7) DELETE /api/notifications/[id]
- Deletes one notification

8) PATCH /api/notifications/mark-all-read
- Body: { userId }
- Efficient bulk mark-all as read

Frontend Integrations
- Hook: useNotifications(userId, intervalMs=30000)
  - State: notifications, unreadCount, loading, error
  - Mutations: markAsRead(id), markAllAsRead(), deleteNotification(id), deleteAllNotifications()
- UI: NotificationCenter (bell dropdown) and /notifications page (full view)

Helper Library (src/lib/notifications.ts)
- createNotification({ userId, type, title, message, relatedId?, relatedType? })
- Order: notifyOrderCreated, notifyOrderStatusChange, notifyOrderCompleted, notifyOrderCancelled
- Payment: notifyPaymentReceived, notifyPaymentPending, notifyPaymentFailed
- Rating: notifyNewRating, notifyNewReview
- Revision: notifyRevisionRequested, notifyRevisionCompleted
- Message: notifyNewMessage
- System: notifySystemMessage

Usage Patterns
- Always call helpers after main action succeeds; never before commits
- Wrap calls in try/catch and use .catch() to avoid blocking responses
- Batch with Promise.all for broadcast-type events

Security
- Only a user should access their notifications (enforce in auth/middleware)
- Use relative paths; avoid absolute localhost URLs (iframe-friendly)
- Rate-limit creation if needed to prevent spam

Performance
- Index notifications by (userId, createdAt)
- Keep polling at sane defaults (20–60s)
- Paginate: default 20, max 100
- Consider archival jobs >90 days

Testing Guide
- Unit-test helper invocations in key APIs
- Smoke-test endpoints with curl examples in Quick Reference
- Verify unreadCount increments/decrements correctly

Future Enhancements
- WebSockets for real-time updates
- Email/SMS for critical notifications
- User preferences and templates
- Push notifications (browser)

Cross-References
- Quick Reference → NOTIFICATION_SYSTEM_QUICK_REFERENCE.md
- 50+ Examples → NOTIFICATION_INTEGRATION_EXAMPLES.md
- Checklist → NOTIFICATION_SYSTEM_CHECKLIST.md
- File Inventory → NOTIFICATION_FILE_INVENTORY.md