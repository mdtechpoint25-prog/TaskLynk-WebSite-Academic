# Notification System — Deployment & Verification Checklist

Preflight
- [ ] notifications table exists with proper columns and indexes (userId, createdAt)
- [ ] API routes present:
  - [ ] /api/notifications (GET, POST, PATCH, DELETE)
  - [ ] /api/notifications/[id] (GET, PATCH, DELETE)
  - [ ] /api/notifications/mark-all-read (PATCH)
- [ ] Frontend pieces present:
  - [ ] useNotifications hook
  - [ ] NotificationCenter component in header
  - [ ] /notifications page

Security
- [ ] Only the owner can read/modify notifications (auth check on server)
- [ ] Relative API paths used (iframe-safe)
- [ ] Inputs validated and sanitized

Performance
- [ ] Pagination defaults to 20, caps at 100
- [ ] Polling interval set (20–60s). Heavy pages use ≥30s
- [ ] DB indexes: (userId, createdAt)
- [ ] Old notification archival policy defined (e.g., >90 days)

Functional Tests
- [ ] Create notification → appears in GET
- [ ] Mark one read → unreadCount decreases by 1
- [ ] Mark all read → unreadCount becomes 0
- [ ] Delete one → removed from list
- [ ] Delete all → returns empty list
- [ ] Dropdown bell shows unread badge
- [ ] Full page filters by type/read state

Event Hooks
- [ ] Orders: created/status/approved/completed emit notifications
- [ ] Payments: received/pending/failed emit notifications
- [ ] Messages: new message emits notifications to recipients
- [ ] Revisions: requested/completed emit notifications
- [ ] Ratings: new rating/review emit notifications

UX Review
- [ ] Bell accessible (aria-label, focusable)
- [ ] Empty states present
- [ ] Loading states present
- [ ] Time formatting looks correct

Monitoring
- [ ] Server logs show no repeated errors
- [ ] Rate limits configured (optional)
- [ ] Error alerts configured (optional)

Rollback Plan
- [ ] Feature flag on client to hide NotificationCenter quickly
- [ ] Clear polling interval on teardown
- [ ] Revert recent changes via VCS

Sign-off
- [ ] Product
- [ ] Engineering
- [ ] QA