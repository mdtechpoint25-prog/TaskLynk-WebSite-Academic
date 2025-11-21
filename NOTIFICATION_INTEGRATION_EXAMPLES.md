# Notification Integration — 50+ Examples

Notes
- All examples assume the helpers are imported from `@/lib/notifications`
- Always wrap in `.catch()` or use `Promise.all().catch()`

Orders
```ts
await notifyOrderCreated(userId, orderId, clientName).catch(console.error)
await notifyOrderStatusChange(userId, orderId, 'in_progress').catch(console.error)
await notifyOrderCompleted(clientId, orderId).catch(console.error)
await notifyOrderCancelled(clientId, orderId, 'Client requested cancellation').catch(console.error)
```

Payments
```ts
await notifyPaymentReceived(userId, 2500, orderId).catch(console.error)
await notifyPaymentPending(userId, 1200, '2025-12-01').catch(console.error)
await notifyPaymentFailed(userId, 1200, 'Card declined').catch(console.error)
```

Revisions
```ts
await notifyRevisionRequested(writerId, orderId, requesterName).catch(console.error)
await notifyRevisionCompleted(clientId, orderId).catch(console.error)
```

Ratings/Reviews
```ts
await notifyNewRating(writerId, ratingId, 5, reviewerName).catch(console.error)
await notifyNewReview(writerId, orderId, reviewerName).catch(console.error)
```

Messages
```ts
await notifyNewMessage(recipientId, messageId, senderName).catch(console.error)
```

System
```ts
await notifySystemMessage(adminId, 'Alert', 'Action required').catch(console.error)
```

Bulk Broadcast
```ts
const recipients = [1,2,3,4]
Promise.all(recipients.map(id => notifySystemMessage(id, 'Notice', 'Platform update'))).catch(console.error)
```

Order API — create (POST /api/jobs)
```ts
// after inserting newJob
const freelancers = await db.select({ id: users.id }).from(users).where(eq(users.role, 'freelancer'))
Promise.all(freelancers.map(f => notifyOrderCreated(f.id, newJob[0].id, client.name))).catch(console.error)
```

Order approve (client)
```ts
await notifyOrderStatusChange(writerId, orderId, 'approved').catch(console.error)
await notifyOrderStatusChange(clientId, orderId, 'approved').catch(console.error)
```

Payouts (when processed)
```ts
await notifySystemMessage(writerId, 'Payout Processed', 'Funds are on the way').catch(console.error)
```

Admin actions
```ts
await notifySystemMessage(targetUserId, 'Account Approved', 'You can now access all features')
await notifySystemMessage(targetUserId, 'Account Rejected', 'Please contact support')
```

Messaging
```ts
const recipients = conversation.participantIds.filter(id => id !== senderId)
Promise.all(recipients.map(rid => notifyNewMessage(rid, message.id, sender.name))).catch(console.error)
```

Revision loop
```ts
// request
await notifyRevisionRequested(writerId, orderId, clientName)
// submit
await notifyRevisionCompleted(clientId, orderId)
```

Payment flow
```ts
await notifyPaymentReceived(clientId, amount, orderId)
await notifySystemMessage(writerId, 'Payment Confirmed', `Order ${orderId} is paid`) 
```

Error-safe pattern
```ts
try {
  await doMainAction()
  await notifySystemMessage(userId, 'Success', 'Operation completed').catch(console.error)
} catch (e) {
  // main action failed, skip notification
}
```

Conditional
```ts
if (order.status === 'completed') {
  await notifyOrderCompleted(clientId, order.id)
  if (order.assignedFreelancerId) {
    await notifyOrderCompleted(order.assignedFreelancerId, order.id)
  }
}
```

Mark-as-read client calls
```ts
await fetch(`/api/notifications/${id}`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ read: true }) })
```

Mark-all-read
```ts
await fetch('/api/notifications/mark-all-read', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId }) })
```

Delete one
```ts
await fetch(`/api/notifications/${id}`, { method:'DELETE' })
```

Delete all
```ts
await fetch(`/api/notifications?userId=${userId}`, { method:'DELETE' })
```

Hook usage (component)
```tsx
const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(userId, 20000)
```

Header bell
```tsx
<NotificationCenter userId={userId} className="ml-2" />
```

Dashboard widget (recent 5)
```tsx
const recent = notifications.slice(0,5)
```

Filtering on client
```ts
const unread = notifications.filter(n => !n.read)
const onlyPayments = notifications.filter(n => n.type === 'payment')
```

Server action wrapper (example)
```ts
await notifySystemMessage(userId, 'Welcome', 'Your account is ready').catch(console.error)
```

Retry pattern
```ts
const attempt = async () => {
  try { await notifySystemMessage(userId, 'Ping', 'Hello') } catch {}
}
attempt()
```

Queue pattern (future)
```ts
// push to queue -> worker calls createNotification()
```

Analytics idea (future)
```sql
-- count unread per user
SELECT userId, COUNT(*) FROM notifications WHERE read = 0 GROUP BY userId;
```

This file intentionally provides compact patterns to copy-paste quickly.