# Notification System — File Inventory

Backend (API)
- src/app/api/notifications/route.ts — GET, POST, PATCH, DELETE (collection)
- src/app/api/notifications/[id]/route.ts — GET, PATCH, DELETE (single)
- src/app/api/notifications/mark-all-read/route.ts — PATCH (bulk mark read)
- src/app/api/notifications/unread-count/route.ts — GET (unread counters)
- src/app/api/notifications/message-counts/route.ts — GET (message-related counts)

Libraries
- src/lib/notifications.ts — Helper functions (createNotification + domain helpers)

Frontend
- src/hooks/useNotifications.ts — React hook (polling, mutations, counts)
- src/components/NotificationCenter.tsx — Header bell dropdown
- src/app/notifications/page.tsx — Full notifications page

Related Integration Spots (examples)
- src/app/api/jobs/route.ts — Notifies freelancers on new order creation
- src/app/api/messages/* — Notifies participants on new messages
- src/app/api/v2/orders/* — Can emit status changes, approvals, revisions

Database
- src/db/schema.ts — notifications table definition (id, userId, type, title, message, read, relatedId, relatedType, createdAt)
- drizzle/* — migrations and meta (if applicable to notifications)

Docs (this set)
- NOTIFICATION_START_HERE.md — Guided intro
- NOTIFICATION_SYSTEM_README.md — Executive summary
- NOTIFICATION_SYSTEM_QUICK_REFERENCE.md — Fast lookup
- NOTIFICATION_SYSTEM_COMPLETE.md — Full API & model
- NOTIFICATION_INTEGRATION_EXAMPLES.md — 50+ patterns
- NOTIFICATION_SYSTEM_CHECKLIST.md — Deploy & verify
- NOTIFICATION_FINAL_REPORT.md — Status summary
- NOTIFICATION_FILE_INVENTORY.md — This file

Notes
- Use relative API paths (iframe-safe)
- Add/verify auth guards so users can access only their notifications
- Polling intervals must be chosen with traffic in mind (20–60s)
