# Notification System — Executive Summary

What it is
A reliable, polling-based user notification system covering orders, payments, messages, revisions, and ratings with complete API, React hooks, and UI components.

Why it matters
- Keeps users informed across the lifecycle
- Improves response times (revisions/messages)
- Increases conversion (payment reminders)

Building blocks
- API
  - /api/notifications (GET, POST, PATCH, DELETE)
  - /api/notifications/[id] (GET, PATCH, DELETE)
  - /api/notifications/mark-all-read (PATCH)
- Frontend
  - useNotifications(userId, interval)
  - <NotificationCenter /> dropdown + /notifications page
- Helpers
  - createNotification + typed helpers per domain event

How to integrate (fast)
1) Add the bell to header
   - <NotificationCenter userId={session?.user?.id ?? null} />
2) Emit notifications from APIs
   - Use notifyOrderCreated / notifyPaymentReceived / notifyNewMessage, etc.
3) Verify
   - Run NOTIFICATION_SYSTEM_CHECKLIST.md

Performance & Security
- Polling interval: 20–60s; defaults to 30s
- Paginated responses; indexed queries
- Enforce user-scoped access in server routes

Read next
- Start Here → NOTIFICATION_START_HERE.md
- Quick Reference → NOTIFICATION_SYSTEM_QUICK_REFERENCE.md
- 50+ Examples → NOTIFICATION_INTEGRATION_EXAMPLES.md
- Full Docs → NOTIFICATION_SYSTEM_COMPLETE.md
- Checklist → NOTIFICATION_SYSTEM_CHECKLIST.md
- Inventory → NOTIFICATION_FILE_INVENTORY.md